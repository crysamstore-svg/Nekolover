import JSZip from 'jszip';
import { sanitizeEpubHtml, sanitizeImageUrl } from './sanitizeHtml';

const MAX_EPUB_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB safety cap
const MAX_EPUB_CHAPTERS = 400;
const MAX_IMAGE_BASE64_LEN = 12 * 1024 * 1024; // ~9 MB binary image cap

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
  description?: string;
  genres?: string[];
  publisher?: string;
  publishedYear?: string;
  language?: string;
  chapters: ParsedEpubChapter[];
  pages: string[]; // Formatted readable pages/segments
}

const stripHtmlTagsToText = (raw: string): string => {
  if (!raw) return '';
  try {
    const withBreaks = raw
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li|h[1-6])>/gi, '\n');
    const doc = new DOMParser().parseFromString(withBreaks, 'text/html');
    return (doc.body.textContent || raw)
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\s*\n+/g, '\n\n')
      .trim();
  } catch {
    return raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }
};

const getOpfTagTexts = (opfDoc: Document, localName: string): string[] => {
  const results: string[] = [];
  const nsNodes = Array.from(opfDoc.getElementsByTagNameNS('*', localName));
  if (nsNodes.length > 0) {
    for (const node of nsNodes) {
      const txt = node.textContent?.trim();
      if (txt) results.push(txt);
    }
    return results;
  }
  const fallbackNodes = Array.from(
    opfDoc.querySelectorAll(`${localName}, dc\\:${localName}`)
  );
  for (const node of fallbackNodes) {
    const txt = node.textContent?.trim();
    if (txt) results.push(txt);
  }
  return results;
};

/**
 * Robust EPUB Parser using pure JSZip and DOMParser.
 * Works 100% offline, zero iframe dependencies, sanitized against XSS.
 */
export async function parseEpubFile(data: ArrayBuffer | Blob): Promise<ParsedEpub> {
  const byteSize = data instanceof Blob ? data.size : data.byteLength;
  if (byteSize > MAX_EPUB_SIZE_BYTES) {
    throw new Error('El archivo EPUB supera el límite seguro de 100 MB.');
  }
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

  // Metadata (XML namespace-safe for EPUB 2 & EPUB 3 dc:* tags)
  const title = getOpfTagTexts(opfDoc, 'title')[0] || 'Libro EPUB';
  const author = getOpfTagTexts(opfDoc, 'creator')[0] || 'Autor Desconocido';
  const rawDescription = getOpfTagTexts(opfDoc, 'description')[0] || '';
  const description = rawDescription ? stripHtmlTagsToText(rawDescription) : undefined;
  const publisher = getOpfTagTexts(opfDoc, 'publisher')[0] || undefined;
  const language = getOpfTagTexts(opfDoc, 'language')[0] || undefined;
  const rawDate = getOpfTagTexts(opfDoc, 'date')[0] || '';
  const yearMatch = rawDate.match(/\b(1[4-9]\d{2}|20\d{2})\b/);
  const publishedYear = yearMatch ? yearMatch[1] : undefined;

  const subjectSet = new Set<string>();
  getOpfTagTexts(opfDoc, 'subject').forEach((raw) => {
    raw.split(/[;,/|]+/).forEach((part) => {
      const clean = part.trim();
      if (clean && clean.length >= 2 && clean.length <= 42) {
        subjectSet.add(clean);
      }
    });
  });
  const genres = Array.from(subjectSet).slice(0, 6);

  // Manifest items
  const manifestItems: Record<string, { href: string; mediaType: string; properties: string }> = {};
  opfDoc.querySelectorAll('manifest > item').forEach((item) => {
    const id = item.getAttribute('id');
    const href = item.getAttribute('href');
    const mediaType = item.getAttribute('media-type') || '';
    const properties = item.getAttribute('properties') || '';
    if (id && href) {
      manifestItems[id] = { href, mediaType, properties };
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

    if (cleanHref.startsWith('https://') || cleanHref.startsWith('data:')) {
      return sanitizeImageUrl(imgHref) || '';
    }
    if (cleanHref.startsWith('http://') || cleanHref.startsWith('javascript:')) {
      return '';
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
        const ext = fullImgPath.split('.').pop()?.toLowerCase() || 'png';
        // Block active SVG images inside untrusted EPUBs to prevent script execution
        if (ext === 'svg' || ext === 'svgz') {
          return '';
        }
        const base64 = await file.async('base64');
        if (base64.length > MAX_IMAGE_BASE64_LEN) {
          return '';
        }
        const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'webp' ? 'image/webp' : ext === 'gif' ? 'image/gif' : 'image/png';
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

  // 3. Process each chapter in spine (capped to prevent Zip Bomb / DoS)
  const chapterLimit = Math.min(spineIds.length, MAX_EPUB_CHAPTERS);
  for (let idx = 0; idx < chapterLimit; idx++) {
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

      // Sanitize entire chapter body DOM strictly against XSS before paginating
      const rawBodyHtml = body.innerHTML.trim();
      const bodyHtml = sanitizeEpubHtml(rawBodyHtml);
      const textContent = body.textContent?.trim() || '';

      if (textContent.length > 0 || bodyHtml.includes('<img')) {
        chapters.push({
          id,
          title: chapterTitle,
          html: bodyHtml,
          text: textContent
        });

        // Paginate chapter if it's too long (> 2500 chars), so reading feels like turning real book pages
        if (textContent.length > 2500) {
          const sanitizedDoc = parser.parseFromString(bodyHtml, 'text/html');
          let container: Element = sanitizedDoc.body || body;
          for (let depth = 0; depth < 5; depth++) {
            const kids = Array.from(container.children);
            if (
              kids.length === 1 &&
              ['div', 'section', 'article', 'main'].includes(kids[0].tagName.toLowerCase())
            ) {
              container = kids[0];
            } else {
              break;
            }
          }

          const paragraphs = Array.from(container.children);
          if (paragraphs.length > 1) {
            let currentChunk = '';
            let currentLen = 0;

            for (const child of paragraphs) {
              const childHtml = child.outerHTML;
              const childLen = child.textContent?.length || 0;

              if (currentLen + childLen > 1800 && currentChunk) {
                pages.push(sanitizeEpubHtml(currentChunk));
                currentChunk = childHtml;
                currentLen = childLen;
              } else {
                currentChunk += childHtml;
                currentLen += childLen;
              }
            }

            if (currentChunk.trim()) {
              pages.push(sanitizeEpubHtml(currentChunk));
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

  // Extract embedded EPUB cover image if present in OPF metadata/manifest
  let coverImage: string | undefined;
  try {
    let coverHref: string | undefined;
    const coverMeta = opfDoc.querySelector('meta[name="cover"]');
    const coverId = coverMeta?.getAttribute('content');
    if (coverId && manifestItems[coverId]?.mediaType.startsWith('image/')) {
      coverHref = manifestItems[coverId].href;
    }
    if (!coverHref) {
      const propCover = Object.values(manifestItems).find(
        (m) => m.properties.split(/\s+/).includes('cover-image') && m.mediaType.startsWith('image/')
      );
      if (propCover) coverHref = propCover.href;
    }
    if (!coverHref) {
      const heuristicCover = Object.entries(manifestItems).find(
        ([id, m]) =>
          m.mediaType.startsWith('image/') &&
          (id.toLowerCase().includes('cover') || m.href.toLowerCase().includes('cover'))
      );
      if (heuristicCover) coverHref = heuristicCover[1].href;
    }
    if (coverHref) {
      const fullCoverPath = resolveZipPath(coverHref);
      const dataUrl = await getImageDataUrl(fullCoverPath.split('/').pop() || fullCoverPath, fullCoverPath);
      if (dataUrl) coverImage = dataUrl;
    }
  } catch {
    // Cover extraction is optional
  }

  return {
    title,
    author,
    coverImage,
    description,
    genres: genres.length > 0 ? genres : undefined,
    publisher,
    publishedYear,
    language,
    chapters,
    pages
  };
}
