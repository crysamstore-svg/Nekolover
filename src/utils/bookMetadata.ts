import { Book } from '../types';
import { getFileFromDB } from './db';
import { sanitizeImageUrl } from './sanitizeHtml';

export interface PublicBookCandidate {
  id: string;
  title: string;
  author: string;
  genres: string[];
  description?: string;
  coverImage?: string;
  publisher?: string;
  publishedYear?: string;
  language?: string;
  isbn?: string;
  pageCount?: number;
  source: 'apple_books' | 'openlibrary' | 'google_books';
}

export interface CatalogSearchResult {
  candidates: PublicBookCandidate[];
  networkError: boolean;
}

export interface LocalPdfMetadata {
  title?: string;
  author?: string;
  genres?: string[];
  description?: string;
  coverImage?: string;
  totalPages?: number;
}

const GENERIC_AUTHOR_SET = new Set([
  'autor desconocido',
  'autor epub',
  'documento pdf',
  'archivo local',
  'unknown',
  'desconocido',
  'sin autor',
  'anonimo',
  'anónimo',
  'varios',
  'varios autores',
  'admin',
  'usuario',
  'user',
  'n/a',
  'none',
]);

export function isGenericAuthor(rawAuthor?: string): boolean {
  const clean = (rawAuthor || '').trim().toLowerCase();
  if (!clean || clean.length < 2) return true;
  if (GENERIC_AUTHOR_SET.has(clean)) return true;
  return /^(calibre|epublibre|lectulandia|z-?lib|annas?-?archive|scanner|adobe|microsoft|libreoffice|pdf|epub)\b/i.test(
    clean
  );
}

const normalizeFold = (val: string): string =>
  val
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokenizeFold = (val: string): string[] => {
  const stopWords = new Set(['el', 'la', 'los', 'las', 'de', 'del', 'y', 'en', 'un', 'una', 'the', 'of', 'and', 'a', 'to', 'in']);
  return normalizeFold(val)
    .split(' ')
    .filter((w) => w.length >= 2 && !stopWords.has(w));
};

const cleanCatalogTitle = (rawTitle: string): string => {
  return rawTitle
    .replace(/\s*\((?:edici[oó]n\s+(?:espa[ñn]ola|mexicana|castellana|argentina|en\s+espa[ñn]ol)|spanish\s+edition|english\s+edition)\)\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export function looksLikeRawFilename(title: string, fileName?: string): boolean {
  const t = (title || '').trim();
  if (!t) return true;
  if (fileName) {
    const stem = fileName.replace(/\.[^/.]+$/, '').trim();
    if (stem && t === stem && (/[_.]/.test(stem) || /\[[^\]]+\]/.test(stem) || /^\d{1,3}[\s._-]/.test(stem) || stem === stem.toLowerCase())) {
      return true;
    }
  }
  if (/\.(epub|pdf|txt|md)$/i.test(t)) return true;
  if (/[_]/.test(t)) return true;
  if (/\[[^\]]+\]/.test(t)) return true;
  if (/\b(?:z-?lib|epublibre|lectulandia|annas?-?archive)\b/i.test(t)) return true;
  if ((t.match(/\./g) || []).length >= 2 && !/\s/.test(t)) return true;
  if (t === t.toLowerCase() && t.length > 3) return true;
  return false;
}

const isStrongTitleMatch = (bookTitle: string, candidateTitle: string): boolean => {
  const normBook = normalizeFold(bookTitle);
  const normCand = normalizeFold(candidateTitle);
  if (!normBook || !normCand) return false;
  if (normBook === normCand) return true;
  if (normBook.length >= 5 && (normCand.includes(normBook) || normBook.includes(normCand))) {
    return true;
  }
  const bookTokens = tokenizeFold(bookTitle);
  const candTokens = tokenizeFold(candidateTitle);
  if (bookTokens.length === 0 || candTokens.length === 0) return false;
  const candSet = new Set(candTokens);
  const overlap = bookTokens.filter((w) => candSet.has(w)).length;
  return overlap / bookTokens.length >= 0.65;
};

/**
 * Cleans uploaded filenames/titles so public book APIs match the real book.
 */
export function cleanBookSearchParts(rawTitle: string, rawAuthor?: string): { title: string; author: string } {
  let cleanTitle = (rawTitle || '')
    .replace(/\.(epub|pdf|txt|md)$/i, '')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(
      /\((?:z-?lib(?:\.org)?|zlib|annas?-?archive|epublibre|lectulandia|epub|pdf|mobi|azw3|spanish(?:\s+edition)?|espa[ñn]ol|esp|complete|completo|ilustrado|illustrated|traducido|edici[oó]n[^)]*|\d{4})[^)]*\)/gi,
      ' '
    )
    .replace(/[_]+/g, ' ');

  // Replace dot-separated filename words (e.g. "Cien.anos.de.soledad") without breaking decimals/initials
  cleanTitle = cleanTitle.replace(/([A-Za-zÁÉÍÓÚÑÜáéíóúñü0-9])\.(?=[A-Za-zÁÉÍÓÚÑÜáéíóúñü]{2,})/g, '$1 ');

  // Strip leading list/book indices like "01. " or "02 - " while keeping years like "1984"
  cleanTitle = cleanTitle.replace(/^0?\d{1,2}(?:[.)]|\s+-)\s+(?=[A-Za-zÁÉÍÓÚÑÜáéíóúñü])/, '');

  cleanTitle = cleanTitle
    .replace(/\s+[-–—]+\s+(?=[A-Za-zÁÉÍÓÚÑÜáéíóúñü])/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanTitle) {
    cleanTitle = (rawTitle || '').replace(/\.(epub|pdf|txt|md)$/i, '').trim();
  }

  let cleanAuthor = (rawAuthor || '').trim();
  if (isGenericAuthor(cleanAuthor)) {
    cleanAuthor = '';
  }

  return { title: cleanTitle, author: cleanAuthor };
}

/**
 * Compresses any oversized image Data URL (e.g. uploaded cover or PDF first page)
 * into a lightweight 360px JPEG Data URL suitable for IndexedDB storage.
 */
export async function compressCoverImage(dataUrl: string, maxWidth = 360): Promise<string> {
  const safe = sanitizeImageUrl(dataUrl);
  if (!safe) return '';
  if (typeof document === 'undefined' || !safe.startsWith('data:image/')) {
    return safe;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(safe);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const compressed = canvas.toDataURL('image/jpeg', 0.82);
        resolve(compressed.length < safe.length ? compressed : safe);
      } catch {
        resolve(safe);
      }
    };
    img.onerror = () => resolve(safe);
    img.src = safe;
  });
}

/**
 * Extracts PDF metadata (Title, Author, Subject/Keywords) and renders a cover thumbnail
 * from page 1 if available in IndexedDB.
 */
export async function extractPdfMetadataFromDB(bookId: string): Promise<LocalPdfMetadata | null> {
  try {
    const pdfjsLib = (window as any)?.pdfjsLib;
    if (!pdfjsLib) return null;

    const stored = await getFileFromDB(bookId);
    if (!stored) return null;

    const buffer =
      stored instanceof Blob ? await stored.arrayBuffer() : (stored as ArrayBuffer).slice(0);
    const loadingTask = pdfjsLib.getDocument({ data: buffer });
    const pdf = await loadingTask.promise;

    const metaResult = await pdf.getMetadata().catch(() => null);
    const info = metaResult?.info || {};

    const rawPdfTitle = typeof info.Title === 'string' && info.Title.trim() ? info.Title.trim() : undefined;
    // Ignore garbage PDF tool titles like "Microsoft Word - ..." or "Untitled"
    const title =
      rawPdfTitle && !/^(untitled|sin t[ií]tulo|microsoft word|adobe|calibre|document)/i.test(rawPdfTitle)
        ? rawPdfTitle
        : undefined;

    const rawPdfAuthor = typeof info.Author === 'string' && info.Author.trim() ? info.Author.trim() : undefined;
    const author = rawPdfAuthor && !isGenericAuthor(rawPdfAuthor) ? rawPdfAuthor : undefined;

    const genreCandidates = new Set<string>();
    const addTags = (raw?: unknown) => {
      if (typeof raw !== 'string') return;
      raw.split(/[;,/|]+/).forEach((part) => {
        const clean = part.trim();
        if (clean && clean.length >= 2 && clean.length <= 40) {
          genreCandidates.add(clean);
        }
      });
    };
    addTags(info.Subject);
    addTags(info.Keywords);

    let coverImage: string | undefined;
    try {
      const page1 = await pdf.getPage(1);
      const viewport = page1.getViewport({ scale: 1 });
      const targetScale = Math.min(1.5, Math.max(0.4, 340 / Math.max(1, viewport.width)));
      const scaledViewport = page1.getViewport({ scale: targetScale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(scaledViewport.width);
      canvas.height = Math.round(scaledViewport.height);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        await page1.render({ canvasContext: ctx, viewport: scaledViewport }).promise;
        coverImage = canvas.toDataURL('image/jpeg', 0.8);
      }
    } catch {
      // Ignore PDF cover render errors
    }

    await pdf.destroy().catch(() => {});

    return {
      title,
      author,
      genres: genreCandidates.size > 0 ? Array.from(genreCandidates).slice(0, 5) : undefined,
      totalPages: typeof pdf.numPages === 'number' ? pdf.numPages : undefined,
      coverImage,
    };
  } catch {
    return null;
  }
}

const normalizeGoogleCover = (links?: {
  thumbnail?: string;
  smallThumbnail?: string;
  medium?: string;
  large?: string;
}): string | undefined => {
  const raw = links?.large || links?.medium || links?.thumbnail || links?.smallThumbnail;
  if (!raw) return undefined;
  let url = raw.replace(/^http:\/\//i, 'https://');
  url = url.replace(/&edge=curl/gi, '');
  if (url.includes('zoom=1')) {
    url = url.replace('zoom=1', 'zoom=2');
  }
  return sanitizeImageUrl(url) || undefined;
};

const NAMED_HTML_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  xa0: ' ',
  laquo: '«',
  raquo: '»',
  ldquo: '“',
  rdquo: '”',
  lsquo: '‘',
  rsquo: '’',
  mdash: '—',
  ndash: '–',
  hellip: '…',
  copy: '©',
  reg: '®',
  aacute: 'á',
  eacute: 'é',
  iacute: 'í',
  oacute: 'ó',
  uacute: 'ú',
  uuml: 'ü',
  ntilde: 'ñ',
  Aacute: 'Á',
  Eacute: 'É',
  Iacute: 'Í',
  Oacute: 'Ó',
  Uacute: 'Ú',
  Uuml: 'Ü',
  Ntilde: 'Ñ',
  iquest: '¿',
  iexcl: '¡',
};

const decodeHtmlEntities = (input: string): string => {
  return input
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      const code = parseInt(hex, 16);
      if (code === 160) return ' ';
      return Number.isFinite(code) && code > 0 ? String.fromCodePoint(code) : '';
    })
    .replace(/&#(\d+);/g, (_, dec) => {
      const code = parseInt(dec, 10);
      if (code === 160) return ' ';
      return Number.isFinite(code) && code > 0 ? String.fromCodePoint(code) : '';
    })
    .replace(/&([a-zA-Z]+);/g, (full, name) => NAMED_HTML_ENTITIES[name] ?? full);
};

const cleanDescription = (raw?: string): string | undefined => {
  if (!raw || typeof raw !== 'string') return undefined;
  const withoutTags = raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');
  const decoded = decodeHtmlEntities(withoutTags)
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n\n')
    .trim();
  return decoded.length > 0 ? decoded : undefined;
};

async function fetchAppleBooks(query: string): Promise<{ items: PublicBookCandidate[]; ok: boolean }> {
  const queryStore = async (country: 'es' | 'mx' | 'us'): Promise<{ items: PublicBookCandidate[]; ok: boolean }> => {
    try {
      const url = `https://itunes.apple.com/search?media=ebook&entity=ebook&limit=6&country=${country}&term=${encodeURIComponent(query)}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(7000) });
      if (!res.ok) return { items: [], ok: false };
      const json = await res.json();
      const items = Array.isArray(json?.results) ? json.results : [];

      const mapped: PublicBookCandidate[] = [];
      for (const item of items) {
        const rawTrackTitle = item?.trackName || item?.trackCensoredName;
        if (!rawTrackTitle) continue;
        const title = cleanCatalogTitle(String(rawTrackTitle));
        const rawArt = item?.artworkUrl100 || item?.artworkUrl60;
        const highResArt =
          typeof rawArt === 'string'
            ? rawArt.replace(/\/\d+x\d+bb\./i, '/600x600bb.').replace(/^http:\/\//i, 'https://')
            : undefined;
        const genres = Array.isArray(item?.genres)
          ? (item.genres as string[])
              .map((g) => String(g).trim())
              .filter((g) => g && !/^libros$/i.test(g) && !/^books$/i.test(g))
              .slice(0, 5)
          : [];
        const yearMatch =
          typeof item?.releaseDate === 'string'
            ? item.releaseDate.match(/\b(1[4-9]\d{2}|20\d{2})\b/)
            : null;

        mapped.push({
          id: `ab-${country}-${item.trackId || mapped.length}`,
          title,
          author: item?.artistName ? String(item.artistName).trim() : 'Autor Desconocido',
          genres,
          description: cleanDescription(item?.description),
          coverImage: sanitizeImageUrl(highResArt) || undefined,
          publishedYear: yearMatch ? yearMatch[1] : undefined,
          language: country === 'us' ? 'EN' : 'ES',
          source: 'apple_books',
        });
      }
      return { items: mapped, ok: true };
    } catch {
      return { items: [], ok: false };
    }
  };

  const [esRes, mxRes] = await Promise.all([queryStore('es'), queryStore('mx')]);
  const combinedEs = [...esRes.items, ...mxRes.items];
  // Also query US store if ES/MX didn't yield rich results with descriptions
  const hasRichEs = combinedEs.some((c) => c.description && c.description.length > 50 && c.coverImage);
  if (hasRichEs && combinedEs.length >= 2) {
    return { items: combinedEs, ok: esRes.ok || mxRes.ok };
  }
  const usRes = await queryStore('us');
  return {
    items: [...combinedEs, ...usRes.items],
    ok: esRes.ok || mxRes.ok || usRes.ok,
  };
}

async function fetchGoogleBooks(query: string): Promise<{ items: PublicBookCandidate[]; ok: boolean }> {
  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4500) });
    if (!res.ok) return { items: [], ok: false };
    const json = await res.json();
    const items = Array.isArray(json?.items) ? json.items : [];

    const results: PublicBookCandidate[] = [];
    for (const item of items) {
      const info = item?.volumeInfo;
      if (!info?.title) continue;
      const isbnObj = Array.isArray(info.industryIdentifiers)
        ? info.industryIdentifiers.find((x: any) => x.type === 'ISBN_13') || info.industryIdentifiers[0]
        : null;
      const yearMatch = typeof info.publishedDate === 'string' ? info.publishedDate.match(/\b(1[4-9]\d{2}|20\d{2})\b/) : null;
      const genres = Array.isArray(info.categories)
        ? info.categories
            .flatMap((c: string) => c.split(/[/>,]/).map((s) => s.trim()))
            .filter((s: string) => s.length >= 2 && s.length <= 38)
            .slice(0, 5)
        : [];

      results.push({
        id: `gb-${item.id || results.length}`,
        title: cleanCatalogTitle(String(info.title)),
        author: Array.isArray(info.authors) && info.authors.length > 0 ? info.authors.join(', ') : 'Autor Desconocido',
        genres,
        description: cleanDescription(info.description),
        coverImage: normalizeGoogleCover(info.imageLinks),
        publisher: typeof info.publisher === 'string' ? info.publisher.trim() : undefined,
        publishedYear: yearMatch ? yearMatch[1] : undefined,
        language: typeof info.language === 'string' ? info.language.toUpperCase() : undefined,
        isbn: isbnObj?.identifier ? String(isbnObj.identifier) : undefined,
        pageCount: typeof info.pageCount === 'number' && info.pageCount > 0 ? info.pageCount : undefined,
        source: 'google_books',
      });
    }
    return { items: results, ok: true };
  } catch {
    return { items: [], ok: false };
  }
}

async function fetchOpenLibrary(query: string): Promise<{ items: PublicBookCandidate[]; ok: boolean }> {
  try {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=6&fields=key,title,author_name,first_publish_year,cover_i,subject,publisher,isbn,language,number_of_pages_median`;
    const res = await fetch(url, { signal: AbortSignal.timeout(7000) });
    if (!res.ok) return { items: [], ok: false };
    const json = await res.json();
    const docs = Array.isArray(json?.docs) ? json.docs : [];

    // Fetch /works/*.json synopses in parallel for up to 3 top candidates
    const descByKey = new Map<string, string>();
    const workKeys: string[] = (docs as any[])
      .slice(0, 4)
      .map((d) => (typeof d?.key === 'string' && d.key.startsWith('/works/') ? (d.key as string) : null))
      .filter((k): k is string => Boolean(k))
      .slice(0, 3);

    await Promise.all(
      workKeys.map(async (wk: string) => {
        try {
          const workRes = await fetch(`https://openlibrary.org${wk}.json`, {
            signal: AbortSignal.timeout(4500),
          });
          if (workRes.ok) {
            const workJson = await workRes.json();
            const rawDesc =
              typeof workJson?.description === 'string'
                ? workJson.description
                : workJson?.description?.value;
            const cleaned = cleanDescription(rawDesc);
            if (cleaned) descByKey.set(wk, cleaned);
          }
        } catch {
          // Optional description lookup
        }
      })
    );

    const results: PublicBookCandidate[] = [];
    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      if (!doc?.title) continue;

      const coverUrl =
        typeof doc.cover_i === 'number' && doc.cover_i > 0
          ? sanitizeImageUrl(`https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`) || undefined
          : undefined;

      const genres = Array.isArray(doc.subject)
        ? (doc.subject as string[])
            .map((s) => String(s).trim())
            .filter((s) => s.length >= 2 && s.length <= 36 && !s.includes(':') && !/^\d+$/.test(s))
            .slice(0, 5)
        : [];

      results.push({
        id: `ol-${doc.key || i}`,
        title: String(doc.title).trim(),
        author:
          Array.isArray(doc.author_name) && doc.author_name.length > 0
            ? doc.author_name.slice(0, 3).join(', ')
            : 'Autor Desconocido',
        genres,
        description: typeof doc.key === 'string' ? descByKey.get(doc.key) : undefined,
        coverImage: coverUrl,
        publisher:
          Array.isArray(doc.publisher) && doc.publisher.length > 0
            ? String(doc.publisher[0]).trim()
            : undefined,
        publishedYear:
          typeof doc.first_publish_year === 'number' ? String(doc.first_publish_year) : undefined,
        language:
          Array.isArray(doc.language) && doc.language.length > 0
            ? String(doc.language[0]).toUpperCase()
            : undefined,
        isbn: Array.isArray(doc.isbn) && doc.isbn.length > 0 ? String(doc.isbn[0]) : undefined,
        pageCount:
          typeof doc.number_of_pages_median === 'number' && doc.number_of_pages_median > 0
            ? doc.number_of_pages_median
            : undefined,
        source: 'openlibrary',
      });
    }
    return { items: results, ok: true };
  } catch {
    return { items: [], ok: false };
  }
}

const isSummaryOrGuide = (title: string, genres: string[] = []): boolean =>
  /^(?:summary|resumen|analysis|an[aá]lisis|study guide|gu[ií]a de lectura|workbook|review)\b/i.test(
    title.trim()
  ) ||
  genres.some((g) => /^(?:educaci[oó]n|study aids|gu[ií]as de estudio|t[eé]cnicos y profesionales)$/i.test(g.trim()));

const looksSpanishText = (text: string): boolean => {
  const matches = text.match(
    /\b(?:el|la|los|las|una|unos|unas|para|con|por|que|sus|entre|historia|novela|vida|mundo|cuando|sobre|pero|esta|este|desde|hasta)\b/gi
  );
  return (matches?.length || 0) >= 3;
};

const looksForeignNonEsEn = (text: string): boolean =>
  /[őűąćęłńśźżğıİışčšžřěůďťňľĺŕăşţ]/i.test(text) ||
  /(?:\b(?:książka|zawiera|opisy|szexuális|befolyásolom|története|kitap|romanı|dokážem|manipulovať)\b)/i.test(
    text
  );

/**
 * Searches Apple Books (ES/MX/US) + Open Library (+ Google Books bonus)
 * and reports whether providers succeeded or experienced network failure.
 */
export async function searchPublicBookCatalogWithStatus(
  rawTitle: string,
  rawAuthor?: string,
  explicitQuery?: string
): Promise<CatalogSearchResult> {
  const cleaned = cleanBookSearchParts(rawTitle, rawAuthor);
  const query =
    (explicitQuery && explicitQuery.trim()) ||
    [cleaned.title, cleaned.author].filter(Boolean).join(' ');

  if (!query || query.length < 2) {
    return { candidates: [], networkError: false };
  }

  let anySuccess = false;
  const runProviders = async (q: string): Promise<PublicBookCandidate[]> => {
    const [abRes, olRes, gbRes] = await Promise.all([
      fetchAppleBooks(q),
      fetchOpenLibrary(q),
      fetchGoogleBooks(q),
    ]);
    if (abRes.ok || olRes.ok || gbRes.ok) {
      anySuccess = true;
    }
    return [...abRes.items, ...olRes.items, ...gbRes.items];
  };

  // If title contains " - " (e.g. "Title - Author" or "01 - Title") also search left segment
  const dashSplit = !explicitQuery ? cleaned.title : '';
  const hasExplicitAuthor = Boolean(cleaned.author) && query !== cleaned.title;

  const [primaryHits, titleOnlyHits] = await Promise.all([
    runProviders(query),
    hasExplicitAuthor ? runProviders(cleaned.title) : Promise.resolve([] as PublicBookCandidate[]),
  ]);

  const combined = [...primaryHits, ...titleOnlyHits];
  const targetTitle = explicitQuery?.trim() || dashSplit || cleaned.title;
  const targetTokens = tokenizeFold(targetTitle);
  const targetAuthorTokens = tokenizeFold(cleaned.author);
  const queryHasForeignScript = looksForeignNonEsEn(targetTitle);

  const score = (c: PublicBookCandidate): number => {
    let s = 0;
    const candTokens = tokenizeFold(c.title);
    const candSet = new Set(candTokens);

    // Title token overlap (critical for real matches)
    if (targetTokens.length > 0) {
      const matchedTokens = targetTokens.filter((w) => candSet.has(w)).length;
      const ratio = matchedTokens / targetTokens.length;
      s += Math.round(ratio * 10);
      if (ratio === 0) s -= 8;
    }

    if (normalizeFold(c.title) === normalizeFold(targetTitle)) {
      s += 4;
    }

    // Author token overlap (against explicit author OR author name embedded in filename/title)
    if (!isGenericAuthor(c.author)) {
      const authorTokens = tokenizeFold(c.author);
      if (targetAuthorTokens.length > 0) {
        const authorSet = new Set(authorTokens);
        const authorMatches = targetAuthorTokens.filter((w) => authorSet.has(w)).length;
        if (authorMatches > 0) s += 6;
      } else if (authorTokens.length > 0) {
        const titleTokenSet = new Set(targetTokens);
        const embeddedAuthorMatches = authorTokens.filter((w) => titleTokenSet.has(w)).length;
        if (embeddedAuthorMatches > 0) s += Math.min(8, embeddedAuthorMatches * 3);
      }
    }

    if (c.coverImage) s += 4;
    if (c.description && c.description.length > 60) s += 5;
    else if (c.description && c.description.length > 20) s += 2;
    if (c.genres.length > 0) s += 2;
    if (!isGenericAuthor(c.author)) s += 2;
    if (c.publishedYear) s += 1;

    // Strongly prefer Spanish descriptions, penalize non-ES/EN translations and academic study guides
    if (c.description && looksSpanishText(c.description)) s += 5;
    if (c.source === 'apple_books' && c.language === 'ES') s += 3;
    if (!queryHasForeignScript && c.description && looksForeignNonEsEn(c.description)) s -= 12;
    if (!isSummaryOrGuide(targetTitle) && isSummaryOrGuide(c.title, c.genres)) s -= 9;

    return s;
  };

  combined.sort((a, b) => score(b) - score(a));

  const seen = new Set<string>();
  const deduped: PublicBookCandidate[] = [];
  for (const cand of combined) {
    // Skip clearly irrelevant zero-overlap junk when searching automatically
    if (!explicitQuery && targetTokens.length >= 2) {
      const candSet = new Set(tokenizeFold(cand.title));
      const overlap = targetTokens.filter((w) => candSet.has(w)).length;
      if (overlap === 0) continue;
    }

    const key = `${normalizeFold(cand.title).slice(0, 30)}|${normalizeFold(cand.author).slice(0, 18)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(cand);
    if (deduped.length >= 8) break;
  }

  return {
    candidates: deduped,
    networkError: !anySuccess,
  };
}

export async function searchPublicBookCatalog(
  rawTitle: string,
  rawAuthor?: string,
  explicitQuery?: string
): Promise<PublicBookCandidate[]> {
  const { candidates } = await searchPublicBookCatalogWithStatus(rawTitle, rawAuthor, explicitQuery);
  return candidates;
}

/**
 * Merges a chosen PublicBookCandidate into an existing Book safely without losing
 * user reading progress, category, favorites, or file references.
 */
export function applyCandidateToBook(
  book: Book,
  candidate: PublicBookCandidate,
  overwriteManualFields = false
): Book {
  const hasGenericAuthor = isGenericAuthor(book.author);
  const nextAuthor =
    overwriteManualFields || hasGenericAuthor
      ? candidate.author || book.author
      : book.author;

  const shouldUpdateTitle =
    Boolean(candidate.title) &&
    (overwriteManualFields ||
      (book.type !== 'demo' &&
        (looksLikeRawFilename(book.title, book.fileName) ||
          isStrongTitleMatch(book.title, candidate.title))));

  return {
    ...book,
    title: shouldUpdateTitle ? candidate.title : book.title,
    author: nextAuthor,
    coverImage:
      overwriteManualFields || !book.coverImage
        ? candidate.coverImage || book.coverImage
        : book.coverImage,
    genres:
      overwriteManualFields || !book.genres || book.genres.length === 0
        ? candidate.genres.length > 0
          ? candidate.genres
          : book.genres
        : book.genres,
    description:
      overwriteManualFields || !book.description
        ? candidate.description || book.description
        : book.description,
    publisher:
      overwriteManualFields || !book.publisher
        ? candidate.publisher || book.publisher
        : book.publisher,
    publishedYear:
      overwriteManualFields || !book.publishedYear
        ? candidate.publishedYear || book.publishedYear
        : book.publishedYear,
    language: candidate.language || book.language,
    isbn: candidate.isbn || book.isbn,
    metadataSource: 'public_api',
    metadataFetchedAt: Date.now(),
  };
}

/**
 * Automatically extracts local PDF metadata + public web catalog metadata
 * (real title, author, genres, synopsis/bio, and public cover) for any uploaded book.
 */
export async function autoEnrichBookFromNetwork(
  book: Book
): Promise<{
  updated: Book;
  candidates: PublicBookCandidate[];
  matched: boolean;
  networkError: boolean;
}> {
  let workingBook: Book = { ...book };

  // Step 1: Extract embedded PDF metadata & page-1 fallback thumbnail
  if (workingBook.type === 'pdf' && (!workingBook.coverImage || isGenericAuthor(workingBook.author))) {
    const pdfMeta = await extractPdfMetadataFromDB(workingBook.id);
    if (pdfMeta) {
      workingBook = {
        ...workingBook,
        title:
          pdfMeta.title &&
          (looksLikeRawFilename(workingBook.title, workingBook.fileName) ||
            workingBook.title === workingBook.fileName?.replace(/\.[^/.]+$/, ''))
            ? pdfMeta.title
            : workingBook.title,
        author:
          pdfMeta.author && isGenericAuthor(workingBook.author)
            ? pdfMeta.author
            : workingBook.author,
        genres:
          (!workingBook.genres || workingBook.genres.length === 0) && pdfMeta.genres
            ? pdfMeta.genres
            : workingBook.genres,
        totalPages:
          workingBook.totalPages <= 1 && pdfMeta.totalPages
            ? pdfMeta.totalPages
            : workingBook.totalPages,
        coverImage: workingBook.coverImage || pdfMeta.coverImage,
        metadataSource: workingBook.metadataSource || 'pdf',
      };
    }
  }

  // Step 2: Fetch public info from Apple Books + Open Library (+ Google Books)
  const { candidates, networkError } = await searchPublicBookCatalogWithStatus(
    workingBook.title,
    workingBook.author
  );

  if (candidates.length > 0) {
    const top = candidates[0];
    const merged = applyCandidateToBook(workingBook, top, false);
    if (top.coverImage && workingBook.metadataSource === 'pdf') {
      merged.coverImage = top.coverImage;
    }
    return { updated: merged, candidates, matched: true, networkError: false };
  }

  return {
    updated: {
      ...workingBook,
      metadataFetchedAt: Date.now(),
    },
    candidates: [],
    matched: false,
    networkError,
  };
}
