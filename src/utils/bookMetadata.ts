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
]);

/**
 * Cleans uploaded filenames/titles so public book APIs match the real book.
 */
export function cleanBookSearchParts(rawTitle: string, rawAuthor?: string): { title: string; author: string } {
  let cleanTitle = (rawTitle || '')
    .replace(/\.(epub|pdf|txt|md)$/i, '')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\((?:z-lib(?:\.org)?|zlib|annas?-archive|epub|pdf|spanish|español|esp|complete|completo|1st|edici[oó]n|\d{4})[^)]*\)/gi, ' ')
    .replace(/[_]+/g, ' ')
    .replace(/\s+-\s+(?=[A-Za-zÁÉÍÓÚÑÜ])/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanTitle) {
    cleanTitle = rawTitle.trim();
  }

  let cleanAuthor = (rawAuthor || '').trim();
  if (GENERIC_AUTHOR_SET.has(cleanAuthor.toLowerCase())) {
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

    const title = typeof info.Title === 'string' && info.Title.trim() ? info.Title.trim() : undefined;
    const author = typeof info.Author === 'string' && info.Author.trim() ? info.Author.trim() : undefined;

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

const normalizeGoogleCover = (links?: { thumbnail?: string; smallThumbnail?: string; medium?: string; large?: string }): string | undefined => {
  const raw = links?.large || links?.medium || links?.thumbnail || links?.smallThumbnail;
  if (!raw) return undefined;
  let url = raw.replace(/^http:\/\//i, 'https://');
  url = url.replace(/&edge=curl/gi, '');
  if (url.includes('zoom=1')) {
    url = url.replace('zoom=1', 'zoom=2');
  }
  return sanitizeImageUrl(url) || undefined;
};

const cleanDescription = (raw?: string): string | undefined => {
  if (!raw || typeof raw !== 'string') return undefined;
  const cleaned = raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n\n')
    .trim();
  return cleaned.length > 0 ? cleaned : undefined;
};

async function fetchAppleBooks(query: string): Promise<PublicBookCandidate[]> {
  const queryStore = async (country: 'es' | 'us'): Promise<PublicBookCandidate[]> => {
    try {
      const url = `https://itunes.apple.com/search?media=ebook&entity=ebook&limit=5&country=${country}&term=${encodeURIComponent(query)}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(7000) });
      if (!res.ok) return [];
      const json = await res.json();
      const items = Array.isArray(json?.results) ? json.results : [];

      const mapped: PublicBookCandidate[] = [];
      for (const item of items) {
        const title = item?.trackName || item?.trackCensoredName;
        if (!title) continue;
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
          title: String(title).trim(),
          author: item?.artistName ? String(item.artistName).trim() : 'Autor Desconocido',
          genres,
          description: cleanDescription(item?.description),
          coverImage: sanitizeImageUrl(highResArt) || undefined,
          publishedYear: yearMatch ? yearMatch[1] : undefined,
          language: country === 'es' ? 'ES' : 'EN',
          source: 'apple_books',
        });
      }
      return mapped;
    } catch {
      return [];
    }
  };

  const esResults = await queryStore('es');
  if (esResults.length > 0) return esResults;
  return queryStore('us');
}

async function fetchGoogleBooks(query: string): Promise<PublicBookCandidate[]> {
  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
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
        title: String(info.title).trim(),
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
    return results;
  } catch {
    return [];
  }
}

async function fetchOpenLibrary(query: string): Promise<PublicBookCandidate[]> {
  try {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=5&fields=key,title,author_name,first_publish_year,cover_i,subject,publisher,isbn,language,number_of_pages_median`;
    const res = await fetch(url, { signal: AbortSignal.timeout(7000) });
    if (!res.ok) return [];
    const json = await res.json();
    const docs = Array.isArray(json?.docs) ? json.docs : [];

    const results: PublicBookCandidate[] = [];
    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      if (!doc?.title) continue;

      let description: string | undefined;
      if (i === 0 && typeof doc.key === 'string' && doc.key.startsWith('/works/')) {
        try {
          const workRes = await fetch(`https://openlibrary.org${doc.key}.json`, {
            signal: AbortSignal.timeout(4500),
          });
          if (workRes.ok) {
            const workJson = await workRes.json();
            const rawDesc =
              typeof workJson?.description === 'string'
                ? workJson.description
                : workJson?.description?.value;
            description = cleanDescription(rawDesc);
          }
        } catch {
          // Optional work description fetch
        }
      }

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
        description,
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
    return results;
  } catch {
    return [];
  }
}

/**
 * Searches Apple Books + Open Library (+ Google Books bonus) concurrently and ranks
 * rich matches (those with cover image, synopsis, genres, and author) at the top.
 */
export async function searchPublicBookCatalog(
  rawTitle: string,
  rawAuthor?: string,
  explicitQuery?: string
): Promise<PublicBookCandidate[]> {
  const cleaned = cleanBookSearchParts(rawTitle, rawAuthor);
  const query = (explicitQuery && explicitQuery.trim()) ||
    [cleaned.title, cleaned.author].filter(Boolean).join(' ');

  if (!query || query.length < 2) return [];

  const runProviders = async (q: string): Promise<PublicBookCandidate[]> => {
    const [abResults, olResults, gbResults] = await Promise.all([
      fetchAppleBooks(q),
      fetchOpenLibrary(q),
      fetchGoogleBooks(q),
    ]);
    return [...abResults, ...olResults, ...gbResults];
  };

  let combined = await runProviders(query);
  // Fallback to title-only search if title+author was too restrictive
  if (combined.length === 0 && !explicitQuery && cleaned.author && cleaned.title.length >= 3) {
    combined = await runProviders(cleaned.title);
  }

  const score = (c: PublicBookCandidate): number => {
    let s = 0;
    if (c.coverImage) s += 4;
    if (c.description && c.description.length > 40) s += 4;
    if (c.genres.length > 0) s += 2;
    if (c.author && !GENERIC_AUTHOR_SET.has(c.author.toLowerCase())) s += 2;
    if (c.source === 'apple_books' && c.language === 'ES') s += 2;
    if (c.publishedYear) s += 1;
    if (cleaned.title.length >= 4 && c.title.toLowerCase().includes(cleaned.title.toLowerCase().slice(0, 12))) s += 2;
    return s;
  };

  combined.sort((a, b) => score(b) - score(a));

  // Deduplicate near-identical title+author entries, preferring higher-scored ones
  const seen = new Set<string>();
  const deduped: PublicBookCandidate[] = [];
  for (const cand of combined) {
    const key = `${cand.title.toLowerCase().slice(0, 28)}|${cand.author.toLowerCase().slice(0, 18)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(cand);
    if (deduped.length >= 8) break;
  }

  return deduped;
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
  const hasGenericAuthor = !book.author || GENERIC_AUTHOR_SET.has(book.author.toLowerCase());
  const nextAuthor =
    overwriteManualFields || hasGenericAuthor
      ? candidate.author || book.author
      : book.author;

  return {
    ...book,
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
 * (author, genres, synopsis/bio, and public cover) for any uploaded book.
 */
export async function autoEnrichBookFromNetwork(
  book: Book
): Promise<{ updated: Book; candidates: PublicBookCandidate[]; matched: boolean }> {
  let workingBook: Book = { ...book };

  // Step 1: Extract embedded PDF metadata & page-1 fallback thumbnail
  if (workingBook.type === 'pdf' && (!workingBook.coverImage || workingBook.author === 'Documento PDF')) {
    const pdfMeta = await extractPdfMetadataFromDB(workingBook.id);
    if (pdfMeta) {
      workingBook = {
        ...workingBook,
        title:
          pdfMeta.title && workingBook.title === workingBook.fileName?.replace(/\.[^/.]+$/, '')
            ? pdfMeta.title
            : workingBook.title,
        author:
          pdfMeta.author && workingBook.author === 'Documento PDF'
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

  // Step 2: Fetch public info from Apple Books + Open Library
  const candidates = await searchPublicBookCatalog(workingBook.title, workingBook.author);
  if (candidates.length > 0) {
    const top = candidates[0];
    const merged = applyCandidateToBook(workingBook, top, false);
    if (top.coverImage && workingBook.metadataSource === 'pdf') {
      merged.coverImage = top.coverImage;
    }
    return { updated: merged, candidates, matched: true };
  }

  return {
    updated: {
      ...workingBook,
      metadataFetchedAt: Date.now(),
    },
    candidates: [],
    matched: false,
  };
}
