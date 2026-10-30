import JSZip from 'jszip';

export interface ParsedEpubChapter {
  id: string;
  title: string;
  html: string;
  text: string;
}

export interface ParsedEpub {
  title: string;
  author: string;
  coverImage?: string;
  chapters: ParsedEpubChapter[];
  pages: string[]; // Formatted readable pages/segments
}

/**
 * Robust EPUB Parser using pure JSZip and DOMParser.
 * Works 100% offline, zero iframe dependencies, safe inside any sandboxed environment.
 */
export async function parseEpubFile(data: ArrayBuffer | Blob): Promise<ParsedEpub> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(data);

  // 1. Find container.xml to locate the OPF package file
  const containerFile = loadedZip.file('META-INF/container.xml');
  if (!containerFile) {
    throw new Error('Archivo EPUB no válido: falta META-INF/container.xml');
  }

  const containerXml = await containerFile.async('text');
  const parser = new DOMParser();
  const containerDoc = parser.parseFromString(containerXml, 'application/xml');
  const rootfileEl = containerDoc.querySelector('rootfile');
  const opfPath = rootfileEl?.getAttribute('full-path') || 'OEBPS/content.opf';

  // 2. Read OPF file
  const opfFile = loadedZip.file(opfPath);
  if (!opfFile) {
    throw new Error(`Archivo EPUB no válido: no se encontró el paquete en ${opfPath}`);
  }

  const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';
  const opfXml = await opfFile.async('text');
  const opfDoc = parser.parseFromString(opfXml, 'application/xml');

  // Metadata
  const title = opfDoc.querySelector('title')?.textContent?.trim() || 'Libro EPUB';
  const author = opfDoc.querySelector('creator')?.textContent?.trim() || 'Autor Desconocido';

  // Manifest items
  const manifestItems: Record<string, { href: string; mediaType: string }> = {};
  opfDoc.querySelectorAll('manifest > item').forEach((item) => {
    const id = item.getAttribute('id');
    const href = item.getAttribute('href');
    const mediaType = item.getAttribute('media-type') || '';
    if (id && href) {
      manifestItems[id] = { href, mediaType };
    }
  });

  // Spine items (ordered reading list)
  const spineIds: string[] = [];
  opfDoc.querySelectorAll('spine > itemref').forEach((item) => {
    const idref = item.getAttribute('idref');
    if (idref) spineIds.push(idref);
  });

  // Helper to resolve relative path inside the zip
  const resolveZipPath = (relativeHref: string): string => {
    const decoded = decodeURIComponent(relativeHref.split('#')[0]);
    if (decoded.startsWith('/')) return decoded.slice(1);
    const combined = opfDir + decoded;
    const parts = combined.split('/');
    const stack: string[] = [];
    for (const part of parts) {
      if (part === '.' || part === '') continue;
      if (part === '..') {
        stack.pop();
      } else {
        stack.push(part);
      }
    }
    return stack.join('/');
  };

  // Helper to cache images as Base64 Data URLs so they render reliably
  const imageCache: Record<string, string> = {};
  const getImageDataUrl = async (imgHref: string, baseHtmlPath: string): Promise<string> => {
    let cleanHref = imgHref.split('#')[0];
    let fullImgPath = '';

    if (cleanHref.startsWith('http://') || cleanHref.startsWith('https://') || cleanHref.startsWith('data:')) {
      return imgHref;
    }

    if (cleanHref.startsWith('/')) {
      fullImgPath = cleanHref.slice(1);
    } else {
      const baseDir = baseHtmlPath.includes('/') ? baseHtmlPath.substring(0, baseHtmlPath.lastIndexOf('/') + 1) : '';
      const combined = baseDir + cleanHref;
      const parts = combined.split('/');
      const stack: string[] = [];
      for (const p of parts) {
        if (p === '.' || p === '') continue;
        if (p === '..') stack.pop();
        else stack.push(p);
      }
      fullImgPath = stack.join('/');
    }

    if (imageCache[fullImgPath]) return imageCache[fullImgPath];

    // Find file in zip (case-insensitive fallback)
    let file = loadedZip.file(fullImgPath);
    if (!file) {
      const lower = fullImgPath.toLowerCase();
      const matchKey = Object.keys(loadedZip.files).find((k) => k.toLowerCase() === lower);
      if (matchKey) file = loadedZip.file(matchKey);
    }

    if (file) {
      try {
        const base64 = await file.async('base64');
        const ext = fullImgPath.split('.').pop()?.toLowerCase() || 'png';
        const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'svg' ? 'image/svg+xml' : ext === 'webp' ? 'image/webp' : 'image/png';
        const dataUrl = `data:${mime};base64,${base64}`;
        imageCache[fullImgPath] = dataUrl;
        return dataUrl;
      } catch {
        return '';
      }
    }
    return '';
  };

  const chapters: ParsedEpubChapter[] = [];
  const pages: string[] = [];

  // 3. Process each chapter in spine
  for (let idx = 0; idx < spineIds.length; idx++) {
    const id = spineIds[idx];
    const manifestItem = manifestItems[id];
    if (!manifestItem) continue;

    const fullPath = resolveZipPath(manifestItem.href);
    let chapterFile = loadedZip.file(fullPath);

    // Fallback search in zip if path casing differs
    if (!chapterFile) {
      const lower = fullPath.toLowerCase();
      const match = Object.keys(loadedZip.files).find((k) => k.toLowerCase() === lower);
      if (match) chapterFile = loadedZip.file(match);
    }

    if (!chapterFile) continue;

    try {
      const rawHtml = await chapterFile.async('text');
      const doc = parser.parseFromString(rawHtml, 'text/html');

      // Title detection
      const chapterTitle =
        doc.querySelector('h1, h2, h3, title')?.textContent?.trim() ||
        `Capítulo ${idx + 1}`;

      // Convert images to Base64
      const imgElements = Array.from(doc.querySelectorAll('img, image'));
      for (const img of imgElements) {
        const srcAttr = img.getAttribute('src') || img.getAttribute('xlink:href') || '';
        if (srcAttr) {
          const dataUrl = await getImageDataUrl(srcAttr, fullPath);
          if (dataUrl) {
            img.setAttribute('src', dataUrl);
            img.removeAttribute('srcset');
            img.setAttribute('style', 'max-width: 100%; height: auto; margin: 1rem auto; display: block; border-radius: 0.5rem;');
          }
        }
      }

      // Remove unwanted scripts and external stylesheets that break layout
      doc.querySelectorAll('script, style, link[rel="stylesheet"]').forEach((el) => el.remove());

      // Extract body content or inner HTML
      const body = doc.body || doc.documentElement;

      // Clean inline fonts/colors so user reader themes work nicely
      body.querySelectorAll('*').forEach((el) => {
        el.removeAttribute('color');
        el.removeAttribute('bgcolor');
        const style = el.getAttribute('style') || '';
        // Remove font-family or color overrides, keep text-align and formatting
        const cleanedStyle = style
          .replace(/color\s*:[^;]+;?/gi, '')
          .replace(/background-color\s*:[^;]+;?/gi, '')
          .replace(/font-family\s*:[^;]+;?/gi, '');
        if (cleanedStyle.trim()) {
          el.setAttribute('style', cleanedStyle);
        } else {
          el.removeAttribute('style');
        }
      });

      const bodyHtml = body.innerHTML.trim();
      const textContent = body.textContent?.trim() || '';

      if (textContent.length > 0 || bodyHtml.includes('<img')) {
        chapters.push({
          id,
          title: chapterTitle,
          html: bodyHtml,
          text: textContent
        });

        // Paginate chapter if it's too long (> 2200 chars), so reading feels like turning real book pages
        if (textContent.length > 2500) {
          // Split into readable segments
          const paragraphs = Array.from(body.children);
          if (paragraphs.length > 1) {
            let currentChunk = '';
            let currentLen = 0;

            for (const child of paragraphs) {
              const childHtml = child.outerHTML;
              const childLen = child.textContent?.length || 0;

              if (currentLen + childLen > 1800 && currentChunk) {
                pages.push(currentChunk);
                currentChunk = childHtml;
                currentLen = childLen;
              } else {
                currentChunk += childHtml;
                currentLen += childLen;
              }
            }

            if (currentChunk.trim()) {
              pages.push(currentChunk);
            }
          } else {
            pages.push(bodyHtml);
          }
        } else {
          pages.push(bodyHtml);
        }
      }
    } catch (err) {
      console.warn(`Error procesando capítulo ${fullPath}:`, err);
    }
  }

  if (pages.length === 0) {
    pages.push('<p>El archivo EPUB no contiene texto legible.</p>');
  }

  return {
    title,
    author,
    chapters,
    pages
  };
}
