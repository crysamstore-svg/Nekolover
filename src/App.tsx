import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { Trash2, FolderSync, Loader2, UploadCloud, X } from 'lucide-react';
import { Book, Quote, PageSticker, Bookmark, ThemeId, ReadingStatsData, TextHighlight, ReaderModeId, ShelfStyle, ShelfViewMode, ShelfBackgroundConfig, ShelfDecorConfig, ShelfDecorTheme, BookCollection, PageNote } from './types';
import { 
  DEFAULT_BOOKS, 
  DEFAULT_QUOTES, 
  DEFAULT_STICKERS 
} from './data/defaultBooks';
import { Header } from './components/Header';
import { Bookshelf } from './components/Bookshelf';
import { ThemeModal } from './components/ThemeModal';
import { FontModal } from './components/FontModal';
import { AddQuoteModal } from './components/AddQuoteModal';
import { musicPlayer } from './utils/musicManager';
import { vipManager } from './utils/vipManager';
import { BookmarksDrawer } from './components/BookmarksDrawer';
import type { HeaderButtonsConfig } from './components/SettingsView';
import { DEFAULT_SHELF_BG } from './components/ShelfBackgroundModal';
import { DEFAULT_SHELF_DECOR, isValidShelfBookend, isValidShelfDecorProp } from './data/shelfDecorCatalog';
import type { LegalTab } from './components/LegalModal';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import {
  saveFileToDB,
  deleteFileFromDB,
  saveBooksToDB,
  getBooksFromDB,
  saveLinkedFolderHandle,
  getLinkedFolderHandle,
  clearLinkedFolderHandle,
  getSmartEmojiForTitle,
  getRandomGothicGradient
} from './utils/db';
import { soundscape } from './utils/audio';
import { loadReadingStats, saveReadingStats, logReadingSession, resetReadingStatsToZero } from './utils/stats';
import { compressCoverImage, extractMetadataFromBookFile, extractTxtDescription } from './utils/bookMetadata';
import { OfflineIndicator } from './components/PWAInstallButton';
import { safeJsonParse, sanitizeImageUrl } from './utils/sanitizeHtml';

const Reader = lazy(() => import('./components/Reader').then((m) => ({ default: m.Reader })));
const QuotesVault = lazy(() => import('./components/QuotesVault').then((m) => ({ default: m.QuotesVault })));
const StatsPanel = lazy(() => import('./components/StatsPanel').then((m) => ({ default: m.StatsPanel })));
const MusicShelfModal = lazy(() => import('./components/MusicShelfModal').then((m) => ({ default: m.MusicShelfModal })));
const VipSubscriptionModal = lazy(() => import('./components/VipSubscriptionModal').then((m) => ({ default: m.VipSubscriptionModal })));
const VipClubPage = lazy(() => import('./components/VipClubPage').then((m) => ({ default: m.VipClubPage })));
const SettingsView = lazy(() => import('./components/SettingsView').then((m) => ({ default: m.SettingsView })));
const LegalModal = lazy(() => import('./components/LegalModal').then((m) => ({ default: m.LegalModal })));
const BookDetailModal = lazy(() => import('./components/BookDetailModal').then((m) => ({ default: m.BookDetailModal })));

const MAX_BOOK_FILE_BYTES = 100 * 1024 * 1024; // 100 MB (PDF/EPUB)
const MAX_TEXT_FILE_BYTES = 20 * 1024 * 1024;  // 20 MB (TXT/MD)

const isPlainRecord = (val: unknown): val is Record<string, any> =>
  Boolean(val) && typeof val === 'object' && !Array.isArray(val);

const hydrateDemoBookMetadata = (list: Book[]): Book[] =>
  list.map((b) => {
    if (b.type !== 'demo') return b;
    const def = DEFAULT_BOOKS.find((d) => d.id === b.id);
    if (!def) return b;
    return {
      ...b,
      genres: b.genres && b.genres.length > 0 ? b.genres : def.genres,
      description: b.description || def.description,
      publisher: b.publisher || def.publisher,
      publishedYear: b.publishedYear || def.publishedYear,
      metadataSource: b.metadataSource || def.metadataSource
    };
  });

export default function App() {
  // App State initialized with localStorage caching
  const [books, setBooks] = useState<Book[]>(() => {
    const saved = localStorage.getItem('nl_books');
    const parsed = safeJsonParse<Book[]>(saved, DEFAULT_BOOKS, (v): v is Book[] => Array.isArray(v));
    return hydrateDemoBookMetadata(parsed);
  });

  const [quotes, setQuotes] = useState<Quote[]>(() => {
    const saved = localStorage.getItem('nl_quotes');
    return safeJsonParse<Quote[]>(saved, DEFAULT_QUOTES, (v): v is Quote[] => Array.isArray(v));
  });

  const [stickers, setStickers] = useState<Record<string, PageSticker[]>>(() => {
    const saved = localStorage.getItem('nl_stickers');
    return safeJsonParse<Record<string, PageSticker[]>>(saved, DEFAULT_STICKERS, isPlainRecord);
  });

  const [highlights, setHighlights] = useState<Record<string, TextHighlight[]>>(() => {
    const saved = localStorage.getItem('nl_highlights');
    return safeJsonParse<Record<string, TextHighlight[]>>(saved, {}, isPlainRecord);
  });

  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    const saved = localStorage.getItem('nl_bookmarks');
    return safeJsonParse<Bookmark[]>(saved, [], (v): v is Bookmark[] => Array.isArray(v));
  });

  const [collections, setCollections] = useState<BookCollection[]>(() => {
    const saved = localStorage.getItem('nl_collections');
    return safeJsonParse<BookCollection[]>(saved, [], (v): v is BookCollection[] => Array.isArray(v));
  });

  const [pageNotes, setPageNotes] = useState<Record<string, PageNote[]>>(() => {
    const saved = localStorage.getItem('nl_page_notes');
    return safeJsonParse<Record<string, PageNote[]>>(saved, {}, isPlainRecord);
  });

  const [currentTheme, setCurrentTheme] = useState<ThemeId>(() => {
    return (localStorage.getItem('nl_theme') as ThemeId) || 'kawaii-dark';
  });

  const [currentFont, setCurrentFont] = useState<string>(() => {
    return localStorage.getItem('nl_font') || "'Quicksand', sans-serif";
  });

  const [readingStats, setReadingStats] = useState<ReadingStatsData>(() => {
    return loadReadingStats();
  });

  // Reading Configurations & Settings
  const [readerMode, setReaderMode] = useState<ReaderModeId>(() => {
    return (localStorage.getItem('nl_reader_mode') as ReaderModeId) || 'dark-oled';
  });

  const [containerWidth, setContainerWidth] = useState<'normal' | 'wide' | 'narrow'>(() => {
    return (localStorage.getItem('nl_container_width') as any) || 'normal';
  });

  const [lineHeight, setLineHeight] = useState<number>(() => {
    const saved = localStorage.getItem('nl_line_height');
    return saved ? Number(saved) : 1.8;
  });

  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('nl_font_size');
    return saved ? Number(saved) : 18;
  });

  const DEFAULT_HEADER_CONFIG: HeaderButtonsConfig = {
    showNightMode: false,
    showMusic: false,
    showTheme: false,
    showStats: false,
    showQuotes: false,
    showBookmarks: false,
  };

  const [headerConfig, setHeaderConfig] = useState<HeaderButtonsConfig>(() => {
    const saved = localStorage.getItem('nl_header_config');
    const parsed = safeJsonParse<Partial<HeaderButtonsConfig> | null>(saved, null, isPlainRecord);
    return parsed ? { ...DEFAULT_HEADER_CONFIG, ...parsed } : DEFAULT_HEADER_CONFIG;
  });

  const [shelfStyle, setShelfStyle] = useState<ShelfStyle>(() => {
    return (localStorage.getItem('nl_shelf_style') as ShelfStyle) || 'wood-gothic';
  });

  const [viewMode, setViewMode] = useState<ShelfViewMode>(() => {
    return (localStorage.getItem('nl_shelf_view_mode') as ShelfViewMode) || 'covers';
  });

  // Custom Shelf Background Texture / Photo Config
  const [shelfBgConfig, setShelfBgConfig] = useState<ShelfBackgroundConfig>(() => {
    const saved = localStorage.getItem('nl_shelf_bg_config');
    const parsed = safeJsonParse<Partial<ShelfBackgroundConfig> | null>(saved, null, isPlainRecord);
    if (!parsed) return DEFAULT_SHELF_BG;
    return {
      ...DEFAULT_SHELF_BG,
      ...parsed,
      customImage: sanitizeImageUrl(parsed.customImage),
      overlayDarkness: Math.max(0, Math.min(100, Number(parsed.overlayDarkness) || 65)),
      blur: Math.max(0, Math.min(20, Number(parsed.blur) || 0))
    };
  });

  const handleUpdateShelfBgConfig = (cfg: ShelfBackgroundConfig) => {
    const sanitizedCfg: ShelfBackgroundConfig = {
      ...cfg,
      customImage: sanitizeImageUrl(cfg.customImage),
      overlayDarkness: Math.max(0, Math.min(100, Number(cfg.overlayDarkness) || 0)),
      blur: Math.max(0, Math.min(20, Number(cfg.blur) || 0))
    };
    setShelfBgConfig(sanitizedCfg);
    try {
      localStorage.setItem('nl_shelf_bg_config', JSON.stringify(sanitizedCfg));
    } catch (e) {
      console.warn('Error saving shelf background config:', e);
    }
  };

  const [shelfDecorConfig, setShelfDecorConfig] = useState<ShelfDecorConfig>(() => {
    const saved = localStorage.getItem('nl_shelf_decor_v1');
    const parsed = safeJsonParse<Partial<ShelfDecorConfig> | null>(saved, null, isPlainRecord);
    if (!parsed) return DEFAULT_SHELF_DECOR;
    const validThemes: ShelfDecorTheme[] = ['none', 'kawaii', 'dark', 'fantasy'];
    const theme: ShelfDecorTheme = validThemes.includes(parsed.theme as ShelfDecorTheme)
      ? (parsed.theme as ShelfDecorTheme)
      : 'kawaii';
    const enabledProps = Array.isArray(parsed.enabledProps)
      ? parsed.enabledProps.filter((id): id is ShelfDecorConfig['enabledProps'][number] =>
          typeof id === 'string' && isValidShelfDecorProp(id)
        )
      : DEFAULT_SHELF_DECOR.enabledProps;
    const bookend =
      typeof parsed.bookend === 'string' && isValidShelfBookend(parsed.bookend)
        ? parsed.bookend
        : DEFAULT_SHELF_DECOR.bookend;
    return {
      theme,
      enabledProps,
      bookend,
      ledGlow: typeof parsed.ledGlow === 'boolean' ? parsed.ledGlow : true,
      hangingVines: typeof parsed.hangingVines === 'boolean' ? parsed.hangingVines : true,
    };
  });

  const handleUpdateShelfDecorConfig = (cfg: ShelfDecorConfig) => {
    setShelfDecorConfig(cfg);
    try {
      localStorage.setItem('nl_shelf_decor_v1', JSON.stringify(cfg));
    } catch (e) {
      console.warn('Error saving shelf decor config:', e);
    }
  };

  // Navigation & Active Reading
  const [currentView, setCurrentView] = useState<'library' | 'quotes' | 'bookmarks' | 'stats' | 'reader' | 'settings' | 'vip'>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'vip') return 'vip';
      return 'library';
    } catch {
      return 'library';
    }
  });
  const [activeBook, setActiveBook] = useState<Book | null>(null);
  const [previewBookId, setPreviewBookId] = useState<string | null>(null);

  // Modals & Notifications
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isFontModalOpen, setIsFontModalOpen] = useState(false);
  const [isAddQuoteOpen, setIsAddQuoteOpen] = useState(false);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);
  const [quoteSelectedText, setQuoteSelectedText] = useState<string | undefined>(undefined);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);

  // VIP Subscription ($2 USD/month) State
  const [isVip, setIsVip] = useState<boolean>(() => vipManager.isVip());
  const [isVipModalOpen, setIsVipModalOpen] = useState<boolean>(false);
  const [vipFeatureReason, setVipFeatureReason] = useState<'music' | 'fonts' | 'shelf_bg' | 'stickers' | 'highlights' | 'notes' | 'shelf_decor' | null>(null);

  // Legal Modal State (Términos, Privacidad, Cookies, Reembolso, Auditoría)
  const [isLegalModalOpen, setIsLegalModalOpen] = useState<boolean>(false);
  const [legalModalTab, setLegalModalTab] = useState<LegalTab>('terms');

  const handleOpenLegalModal = (tab: LegalTab = 'terms') => {
    setLegalModalTab(tab);
    setIsLegalModalOpen(true);
  };

  const openVipModal = (reason?: 'music' | 'fonts' | 'shelf_bg' | 'stickers' | 'highlights' | 'notes' | 'shelf_decor') => {
    setVipFeatureReason(reason || null);
    setIsVipModalOpen(true);
  };

  useEffect(() => {
    const unsub = vipManager.onVipChange((vip) => {
      setIsVip(vip);
    });
    void vipManager.revalidateWithServer();
    return () => unsub();
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // High Contrast OLED Night Mode
  const [isNightMode, setIsNightMode] = useState<boolean>(() => {
    return localStorage.getItem('nl_night_mode') === 'true';
  });

  // Sync theme attribute on document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('nl_theme', currentTheme);
  }, [currentTheme]);

  // Sync night mode attribute on document
  useEffect(() => {
    if (isNightMode) {
      document.documentElement.setAttribute('data-night-mode', 'true');
    } else {
      document.documentElement.removeAttribute('data-night-mode');
    }
    localStorage.setItem('nl_night_mode', isNightMode ? 'true' : 'false');
  }, [isNightMode]);

  // Sync music player isPlaying state with Header indicator
  useEffect(() => {
    const unsub = musicPlayer.subscribe(() => {
      setIsAudioPlaying(musicPlayer.isPlaying);
    });
    return () => unsub();
  }, []);

  const handleToggleNightMode = () => {
    setIsNightMode((prev) => {
      const next = !prev;
      showToast(next ? '🌙 Modo Noche activado: Negro Puro OLED' : '☀️ Modo Noche desactivado');
      return next;
    });
  };

  // Sync font preference
  useEffect(() => {
    localStorage.setItem('nl_font', currentFont);
  }, [currentFont]);

  // Sync quotes
  useEffect(() => {
    localStorage.setItem('nl_quotes', JSON.stringify(quotes));
  }, [quotes]);

  // Sync stickers
  useEffect(() => {
    localStorage.setItem('nl_stickers', JSON.stringify(stickers));
  }, [stickers]);

  // Sync highlights
  useEffect(() => {
    localStorage.setItem('nl_highlights', JSON.stringify(highlights));
  }, [highlights]);

  // Sync bookmarks
  useEffect(() => {
    localStorage.setItem('nl_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  // Sync collections
  useEffect(() => {
    try {
      localStorage.setItem('nl_collections', JSON.stringify(collections));
    } catch {}
  }, [collections]);

  // Sync inline page notes
  useEffect(() => {
    try {
      localStorage.setItem('nl_page_notes', JSON.stringify(pageNotes));
    } catch {}
  }, [pageNotes]);

  const isDbInitializedRef = useRef(false);

  // Load books from IndexedDB on startup (Supports 2000+ books without localStorage 5MB limit)
  useEffect(() => {
    let isMounted = true;
    getBooksFromDB()
      .then((stored) => {
        if (isMounted && stored && stored.length > 0) {
          setBooks(hydrateDemoBookMetadata(stored));
        }
        isDbInitializedRef.current = true;
      })
      .catch((err) => {
        console.warn('Error loading books from IndexedDB:', err);
        isDbInitializedRef.current = true;
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const latestBooksRef = useRef<Book[]>(books);
  latestBooksRef.current = books;

  // Save books to IndexedDB only AFTER initial load completes, debounced so rapid page turns stay 60fps
  useEffect(() => {
    if (!isDbInitializedRef.current) return;

    const persistNow = (list: Book[]) => {
      saveBooksToDB(list);
      try {
        // Lightweight title index in localStorage for fast splash boot (first 40 items without heavy blobs)
        const lightCache = list.slice(0, 40).map((b) => ({
          ...b,
          content: undefined,
          coverImage: b.coverImage && b.coverImage.startsWith('data:') ? undefined : b.coverImage
        }));
        localStorage.setItem('nl_books', JSON.stringify(lightCache));
      } catch {}
    };

    const timer = window.setTimeout(() => {
      persistNow(latestBooksRef.current);
    }, 650);

    const flushOnHide = () => {
      persistNow(latestBooksRef.current);
    };
    window.addEventListener('pagehide', flushOnHide);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('pagehide', flushOnHide);
    };
  }, [books]);

  // Sync state for large batch / folder sync
  const [syncState, setSyncState] = useState<{
    isSyncing: boolean;
    phase: 'scanning' | 'importing';
    current: number;
    total: number;
    currentFile: string;
  }>({
    isSyncing: false,
    phase: 'scanning',
    current: 0,
    total: 0,
    currentFile: ''
  });
  const syncCancelledRef = useRef(false);
  const [folderFallbackPrompt, setFolderFallbackPrompt] = useState<string | null>(null);
  const [linkedFolderHandle, setLinkedFolderHandle] = useState<any | null>(null);
  const [isLinkedFolderModalOpen, setIsLinkedFolderModalOpen] = useState(false);

  const formatBookFileSize = (bytes: number): string => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  };

  // Batch process files into bookshelf (Capacity up to 2000 books)
  const processBatchBooks = async (fileList: File[]) => {
    const validFiles = fileList.filter((f) => {
      const lower = f.name.toLowerCase();
      const mime = (f.type || '').toLowerCase();
      return (
        lower.endsWith('.pdf') ||
        lower.endsWith('.epub') ||
        lower.endsWith('.txt') ||
        lower.endsWith('.md') ||
        mime === 'application/pdf' ||
        mime === 'application/epub+zip'
      );
    });

    if (validFiles.length === 0) {
      setSyncState({ isSyncing: false, phase: 'scanning', current: 0, total: 0, currentFile: '' });
      showToast('No se encontraron archivos de lectura (.epub, .pdf, .txt, .md).');
      return;
    }

    const MAX_BOOKS = 2000;
    const currentBooksSnapshot = latestBooksRef.current;
    if (currentBooksSnapshot.length >= MAX_BOOKS) {
      setSyncState({ isSyncing: false, phase: 'scanning', current: 0, total: 0, currentFile: '' });
      showToast('⚠️ Capacidad máxima alcanzada (2000 libros).');
      return;
    }

    // Deduplicate against already-imported files (name + formatted size) & within batch
    const existingKeys = new Set(
      currentBooksSnapshot
        .filter((b) => b.fileName)
        .map((b) => `${b.fileName!.toLowerCase()}|${b.fileSize || ''}`)
    );
    const filesToImport: File[] = [];
    let skippedDuplicates = 0;

    for (const f of validFiles) {
      const sizeStr = formatBookFileSize(f.size);
      const key = `${f.name.toLowerCase()}|${sizeStr}`;
      if (existingKeys.has(key)) {
        skippedDuplicates += 1;
        continue;
      }
      existingKeys.add(key);
      filesToImport.push(f);
    }

    if (filesToImport.length === 0) {
      setSyncState({ isSyncing: false, phase: 'scanning', current: 0, total: 0, currentFile: '' });
      showToast(`📚 Esos ${skippedDuplicates} libro(s) ya estaban en tu estantería.`);
      return;
    }

    syncCancelledRef.current = false;
    setSyncState({
      isSyncing: true,
      phase: 'importing',
      current: 0,
      total: filesToImport.length,
      currentFile: filesToImport[0]?.name || ''
    });

    const newBooksToAdd: Book[] = [];
    const hasEpub = filesToImport.some(
      (f) => f.name.toLowerCase().endsWith('.epub') || (f.type || '').toLowerCase() === 'application/epub+zip'
    );
    const parseEpubMetaFn = hasEpub
      ? (await import('./utils/epubParser')).parseEpubMetadataOnly
      : null;

    for (let i = 0; i < filesToImport.length; i++) {
      if (syncCancelledRef.current) {
        break;
      }
      if (currentBooksSnapshot.length + newBooksToAdd.length >= MAX_BOOKS) {
        showToast('⚠️ Se alcanzó el límite de 2000 libros.');
        break;
      }

      const file = filesToImport[i];
      setSyncState({
        isSyncing: true,
        phase: 'importing',
        current: i + 1,
        total: filesToImport.length,
        currentFile: file.name
      });

      // Yield briefly so the progress bar and Cancel button stay responsive during big batches
      if (i > 0) {
        await new Promise((r) => setTimeout(r, 0));
      }

      const bookId = `book-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`;
      const fileNameLower = file.name.toLowerCase();
      const fileSizeStr = formatBookFileSize(file.size);
      const isTextFile = fileNameLower.endsWith('.txt') || fileNameLower.endsWith('.md');
      const maxAllowedSize = isTextFile ? MAX_TEXT_FILE_BYTES : MAX_BOOK_FILE_BYTES;
      if (file.size > maxAllowedSize) {
        showToast(`⚠️ "${file.name}" supera el límite (${isTextFile ? '20 MB' : '100 MB'}).`);
        continue;
      }

      const rawTitle = file.name.replace(/\.[^/.]+$/, '') || 'Libro sin título';
      const smartEmoji = getSmartEmojiForTitle(rawTitle);
      const gradient = getRandomGothicGradient(currentBooksSnapshot.length + i);
      const isEpubFile =
        fileNameLower.endsWith('.epub') || (file.type || '').toLowerCase() === 'application/epub+zip';
      const isPdfFile =
        fileNameLower.endsWith('.pdf') || (file.type || '').toLowerCase() === 'application/pdf';

      // Case 1: EPUB (fast metadata-only scan; chapters parse lazily on open in Reader)
      if (isEpubFile) {
        let detectedTitle = rawTitle;
        let detectedAuthor = 'Autor EPUB';
        let detectedCover: string | undefined;
        let detectedDescription: string | undefined;
        let detectedGenres: string[] | undefined;
        let detectedPublisher: string | undefined;
        let detectedYear: string | undefined;
        let detectedLang: string | undefined;
        let estimatedPages = 1;

        let savedOk = false;
        try {
          const arrayBuffer = await file.arrayBuffer();
          await saveFileToDB(bookId, arrayBuffer);
          savedOk = true;
          if (parseEpubMetaFn) {
            const parsed = await parseEpubMetaFn(arrayBuffer);
            if (parsed.title) detectedTitle = parsed.title;
            if (parsed.author) detectedAuthor = parsed.author;
            if (parsed.description) detectedDescription = parsed.description;
            if (parsed.genres) detectedGenres = parsed.genres;
            if (parsed.publisher) detectedPublisher = parsed.publisher;
            if (parsed.publishedYear) detectedYear = parsed.publishedYear;
            if (parsed.language) detectedLang = parsed.language;
            if (parsed.spineCount) estimatedPages = Math.max(1, parsed.spineCount);
            if (parsed.coverImage) {
              const compressed = await compressCoverImage(parsed.coverImage, 320);
              if (compressed) detectedCover = compressed;
            }
          }
        } catch {
          if (!savedOk) {
            try {
              await saveFileToDB(bookId, file);
              savedOk = true;
            } catch {
              savedOk = false;
            }
          }
        }

        if (!savedOk) {
          showToast(`⚠️ No se pudo guardar "${file.name}" en el almacenamiento local.`);
          continue;
        }

        newBooksToAdd.push({
          id: bookId,
          title: detectedTitle,
          author: detectedAuthor,
          category: 'unread',
          favorite: false,
          emoji: smartEmoji,
          type: 'epub',
          coverGradient: gradient,
          coverImage: detectedCover,
          description: detectedDescription,
          genres: detectedGenres,
          publisher: detectedPublisher,
          publishedYear: detectedYear,
          language: detectedLang,
          metadataSource:
            detectedCover || detectedDescription || detectedGenres ? 'epub' : undefined,
          fileName: file.name,
          fileSize: fileSizeStr,
          currentPage: 1,
          totalPages: estimatedPages,
          progressPercent: 0,
          addedAt: Date.now()
        });
        continue;
      }

      // Case 2: Plain Text / Markdown
      if (!isPdfFile && (fileNameLower.endsWith('.txt') || fileNameLower.endsWith('.md'))) {
        try {
          const fullText = await file.text();
          const pageSize = 1200;
          const pageChunks: string[] = [];
          for (let p = 0; p < fullText.length; p += pageSize) {
            pageChunks.push(fullText.slice(p, p + pageSize));
          }

          const txtDesc = extractTxtDescription(pageChunks);

          newBooksToAdd.push({
            id: bookId,
            title: rawTitle,
            author: 'Archivo Local',
            category: 'unread',
            favorite: false,
            emoji: smartEmoji,
            type: 'text',
            coverGradient: gradient,
            content: pageChunks.length > 0 ? pageChunks : ['Documento sin texto legible.'],
            description: txtDesc,
            metadataSource: txtDesc ? 'text' : undefined,
            fileName: file.name,
            fileSize: fileSizeStr,
            currentPage: 1,
            totalPages: Math.max(1, pageChunks.length),
            progressPercent: 0,
            addedAt: Date.now()
          });
        } catch {}
        continue;
      }

      // Case 3: PDF (store ArrayBuffer bytes rather than volatile File handle)
      let pdfSaved = false;
      try {
        const pdfBuffer = await file.arrayBuffer();
        await saveFileToDB(bookId, pdfBuffer);
        pdfSaved = true;
      } catch {
        try {
          await saveFileToDB(bookId, file);
          pdfSaved = true;
        } catch {
          pdfSaved = false;
        }
      }

      if (!pdfSaved) {
        showToast(`⚠️ No se pudo guardar "${file.name}" en el almacenamiento local.`);
        continue;
      }

      newBooksToAdd.push({
        id: bookId,
        title: rawTitle,
        author: 'Documento PDF',
        category: 'unread',
        favorite: false,
        emoji: smartEmoji,
        type: 'pdf',
        coverGradient: gradient,
        fileName: file.name,
        fileSize: fileSizeStr,
        currentPage: 1,
        totalPages: 1,
        progressPercent: 0,
        addedAt: Date.now()
      });
    }

    const wasCancelled = syncCancelledRef.current;
    setSyncState({ isSyncing: false, phase: 'scanning', current: 0, total: 0, currentFile: '' });

    if (newBooksToAdd.length > 0) {
      setBooks((prev) => [...newBooksToAdd, ...prev].slice(0, MAX_BOOKS));
    }

    if (wasCancelled) {
      showToast(
        newBooksToAdd.length > 0
          ? `⏹️ Sincronización detenida. Se guardaron ${newBooksToAdd.length} libro(s) procesados.`
          : '⏹️ Sincronización cancelada.'
      );
    } else if (skippedDuplicates > 0) {
      showToast(`🐾 ¡Listo! ${newBooksToAdd.length} libro(s) nuevos añadidos (${skippedDuplicates} ya estaban en tu estantería).`);
    } else {
      showToast(`🐾 ¡Sincronización completada! ${newBooksToAdd.length} libro(s) colocados automáticamente en tu estantería.`);
    }

    // Extract cover & synopsis locally from newly uploaded PDFs/EPUBs (100% offline from the book itself)
    const booksToExtract = newBooksToAdd
      .filter((b) => b.type !== 'demo' && (!b.coverImage || !b.description))
      .slice(0, 15);

    if (booksToExtract.length > 0) {
      void (async () => {
        for (const item of booksToExtract) {
          try {
            const { updated, extracted } = await extractMetadataFromBookFile(item);
            if (extracted || updated.coverImage || updated.description) {
              setBooks((prev) => prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b)));
            }
          } catch {
            // Ignore local extraction errors for single files
          }
        }
      })();
    }
  };

  // File Upload Handler (EPUB, PDF, TXT, MD)
  const handleFileUpload = async (fileList: FileList) => {
    const files = Array.from(fileList);
    await processBatchBooks(files);
  };

  const processBatchBooksRef = useRef(processBatchBooks);
  processBatchBooksRef.current = processBatchBooks;

  // PWA File Handler launchQueue integration (open .epub/.pdf/.txt/.md directly with NekoRead)
  useEffect(() => {
    const win = window as any;
    if (!win.launchQueue || typeof win.launchQueue.setConsumer !== 'function') return;
    win.launchQueue.setConsumer(async (launchParams: { files?: Array<{ getFile: () => Promise<File> }> }) => {
      if (!launchParams?.files?.length) return;
      const files: File[] = [];
      for (const handle of launchParams.files) {
        try {
          if (typeof handle.getFile === 'function') {
            files.push(await handle.getFile());
          }
        } catch {}
      }
      if (files.length > 0) {
        await processBatchBooksRef.current(files);
      }
    });
  }, []);

  const syncFromDirectoryHandle = async (
    dirHandle: any,
    options: { silent?: boolean } = {}
  ) => {
    const { silent = false } = options;
    const MAX_BOOKS = 2000;
    const remainingSlots = Math.max(0, MAX_BOOKS - latestBooksRef.current.length);
    if (remainingSlots === 0) {
      if (!silent) showToast('⚠️ Capacidad máxima alcanzada (2000 libros).');
      return;
    }

    if (!silent) {
      syncCancelledRef.current = false;
      setSyncState({
        isSyncing: true,
        phase: 'scanning',
        current: 0,
        total: 0,
        currentFile: dirHandle.name || 'Escaneando carpeta...'
      });
    }

    const gatheredFiles: File[] = [];
    const SKIP_DIRS = new Set([
      'node_modules',
      'android',
      '$recycle.bin',
      'system volume information',
      '__macosx'
    ]);
    const SCAN_ENTRY_YIELD_INTERVAL = 50;
    const FILE_HANDLE_BATCH_SIZE = 8;
    const UI_PROGRESS_BATCH_SIZE = 10;
    const yieldToMain = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

    const isSupportedBookName = (nameLower: string) =>
      nameLower.endsWith('.pdf') ||
      nameLower.endsWith('.epub') ||
      nameLower.endsWith('.txt') ||
      nameLower.endsWith('.md');

    let scannedEntries = 0;

    async function* flushFileHandleBatch(handles: any[]): AsyncGenerator<File> {
      if (handles.length === 0 || (!silent && syncCancelledRef.current)) return;
      const settled = await Promise.allSettled(
        handles.map((fileHandle) => fileHandle.getFile() as Promise<File>)
      );
      for (const res of settled) {
        if (!silent && syncCancelledRef.current) return;
        if (res.status === 'fulfilled' && res.value) {
          yield res.value;
        }
      }
    }

    async function* readDirectoryRecursive(handle: any, depth = 0): AsyncGenerator<File> {
      if ((!silent && syncCancelledRef.current) || depth > 12) {
        return;
      }

      let pendingFileHandles: any[] = [];
      const childDirectories: any[] = [];

      for await (const entry of handle.values()) {
        if (!silent && syncCancelledRef.current) {
          return;
        }
        scannedEntries += 1;
        if (scannedEntries % SCAN_ENTRY_YIELD_INTERVAL === 0) {
          await yieldToMain();
        }

        const nameLower = String(entry.name || '').toLowerCase();
        if (entry.kind === 'file') {
          // Filter by extension BEFORE calling entry.getFile() so unrelated files don't stall scanning
          if (isSupportedBookName(nameLower)) {
            pendingFileHandles.push(entry);
            if (pendingFileHandles.length >= FILE_HANDLE_BATCH_SIZE) {
              const batch = pendingFileHandles;
              pendingFileHandles = [];
              yield* flushFileHandleBatch(batch);
              await yieldToMain();
            }
          }
        } else if (entry.kind === 'directory') {
          if (!nameLower.startsWith('.') && !SKIP_DIRS.has(nameLower)) {
            childDirectories.push(entry);
          }
        }
      }

      if (pendingFileHandles.length > 0 && (silent || !syncCancelledRef.current)) {
        yield* flushFileHandleBatch(pendingFileHandles);
      }

      for (const subDir of childDirectories) {
        if (!silent && syncCancelledRef.current) {
          return;
        }
        try {
          yield* readDirectoryRecursive(subDir, depth + 1);
        } catch {
          // Skip unreadable subdirectories without aborting the batch scan
        }
      }
    }

    for await (const file of readDirectoryRecursive(dirHandle, 0)) {
      if (!silent && syncCancelledRef.current) {
        break;
      }
      gatheredFiles.push(file);

      if (
        !silent &&
        (gatheredFiles.length === 1 ||
          gatheredFiles.length % UI_PROGRESS_BATCH_SIZE === 0 ||
          gatheredFiles.length >= remainingSlots)
      ) {
        setSyncState({
          isSyncing: true,
          phase: 'scanning',
          current: gatheredFiles.length,
          total: 0,
          currentFile: file.name
        });
        await yieldToMain();
      }

      if (gatheredFiles.length >= remainingSlots) {
        break;
      }
    }

    if (!silent && syncCancelledRef.current) {
      setSyncState({ isSyncing: false, phase: 'scanning', current: 0, total: 0, currentFile: '' });
      showToast('⏹️ Escaneo de carpeta cancelado.');
      return;
    }

    if (gatheredFiles.length === 0) {
      if (!silent) {
        setSyncState({ isSyncing: false, phase: 'scanning', current: 0, total: 0, currentFile: '' });
        showToast('No se encontraron libros (.epub, .pdf, .txt, .md) en la carpeta.');
      }
      return;
    }

    if (silent) {
      // Check if any file is actually new before disturbing the user with a modal
      const existingKeys = new Set(
        latestBooksRef.current
          .filter((b) => b.fileName)
          .map((b) => `${b.fileName!.toLowerCase()}|${b.fileSize || ''}`)
      );
      const hasNewBooks = gatheredFiles.some(
        (f) => !existingKeys.has(`${f.name.toLowerCase()}|${formatBookFileSize(f.size)}`)
      );
      if (!hasNewBooks) return;
    }

    await processBatchBooks(gatheredFiles);
  };

  const syncFromDirectoryHandleRef = useRef(syncFromDirectoryHandle);
  syncFromDirectoryHandleRef.current = syncFromDirectoryHandle;

  // Restore saved linked folder handle and auto-sync new books if browser permission persists
  useEffect(() => {
    if (typeof window === 'undefined' || !('showDirectoryPicker' in window)) return;
    let active = true;

    void (async () => {
      const savedHandle = await getLinkedFolderHandle();
      if (!active || !savedHandle) return;
      setLinkedFolderHandle(savedHandle);
      try {
        if (typeof savedHandle.queryPermission === 'function') {
          const perm = await savedHandle.queryPermission({ mode: 'read' });
          if (perm === 'granted' && active) {
            // Wait briefly until IndexedDB book list finishes hydrating
            window.setTimeout(() => {
              if (active) {
                void syncFromDirectoryHandleRef.current(savedHandle, { silent: true });
              }
            }, 900);
          }
        }
      } catch {}
    })();

    return () => {
      active = false;
    };
  }, []);

  const handlePickAndLinkFolder = async () => {
    try {
      const dirHandle = await (window as any).showDirectoryPicker({
        id: 'neko-reader-storage-sync',
        mode: 'read'
      });
      setLinkedFolderHandle(dirHandle);
      await saveLinkedFolderHandle(dirHandle);
      await syncFromDirectoryHandle(dirHandle, { silent: false });
    } catch (err: any) {
      setSyncState({ isSyncing: false, phase: 'scanning', current: 0, total: 0, currentFile: '' });
      if (err?.name === 'AbortError') {
        return;
      }
      // Chrome/Edge blocks system folders (Downloads/Documents root) with SecurityError AFTER user gesture expires
      setFolderFallbackPrompt(
        'Tu navegador bloqueó el acceso directo a esa carpeta del sistema (como Descargas o Documentos). Usa una de estas dos opciones:'
      );
    }
  };

  const handleSyncLinkedFolderNow = async () => {
    if (!linkedFolderHandle) return;
    setIsLinkedFolderModalOpen(false);
    try {
      if (typeof linkedFolderHandle.queryPermission === 'function') {
        let perm = await linkedFolderHandle.queryPermission({ mode: 'read' });
        if (perm !== 'granted' && typeof linkedFolderHandle.requestPermission === 'function') {
          perm = await linkedFolderHandle.requestPermission({ mode: 'read' });
        }
        if (perm !== 'granted') {
          showToast('⚠️ Se necesita permiso de lectura para sincronizar esa carpeta.');
          return;
        }
      }
      await syncFromDirectoryHandle(linkedFolderHandle, { silent: false });
    } catch {
      showToast('⚠️ No se pudo acceder a la carpeta vinculada. Selecciónala de nuevo.');
    }
  };

  // Internal Storage Directory Sync (Supports 2000 books automatic scanning)
  const handleSyncInternalStorage = async () => {
    const isAndroidDevice =
      typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);

    if ('showDirectoryPicker' in window) {
      if (linkedFolderHandle) {
        setIsLinkedFolderModalOpen(true);
        return;
      }
      await handlePickAndLinkFolder();
      return;
    }

    if (isAndroidDevice) {
      // Android 11+ disables "USAR ESTA CARPETA" in Download/Documents root; guide user clearly
      setFolderFallbackPrompt(
        'En Android los navegadores bloquean la sincronización automática en segundo plano. Para no subir uno por uno: elige tu subcarpeta (ej. Descargas → Libros) con "Elegir Carpeta" — solo importará los libros nuevos — o selecciona varios libros de golpe.'
      );
      return;
    }

    const input = document.getElementById('folder-sync-input') as HTMLInputElement;
    input?.click();
  };

  const handleFolderSyncChange = (fileList: FileList) => {
    const filesArray = Array.from(fileList);
    void processBatchBooks(filesArray);
  };

  const handleReorderBooks = (newBooks: Book[]) => {
    setBooks(newBooks);
    saveBooksToDB(newBooks);
    showToast('✨ Estantería reorganizada.');
  };

  // Open Book Biography / Detail Preview before entering Reader
  const handleOpenBook = (book: Book) => {
    setPreviewBookId(book.id);
  };

  // Enter Reader directly from BookDetailModal
  const handleEnterReaderFromPreview = (book: Book) => {
    setPreviewBookId(null);
    setActiveBook(book);
    setCurrentView('reader');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Update Book Metadata (Public API / PDF / Manual bio or cover edits)
  const handleUpdateBookMetadata = useCallback((updatedBook: Book, toastMsg?: string) => {
    setBooks((prev) => prev.map((b) => (b.id === updatedBook.id ? updatedBook : b)));
    setActiveBook((prev) => (prev && prev.id === updatedBook.id ? updatedBook : prev));
    if (toastMsg) showToast(toastMsg);
  }, [showToast]);

  // Favorite toggle
  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBooks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, favorite: !b.favorite } : b))
    );
  };

  // Delete Book
  const handleDeleteBook = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const target = books.find((b) => b.id === id);
    if (target) {
      setBookToDelete(target);
    }
  };

  const handleConfirmDeleteBook = async () => {
    if (!bookToDelete) return;
    const id = bookToDelete.id;
    await deleteFileFromDB(id);
    setBooks((prev) => prev.filter((b) => b.id !== id));
    if (activeBook?.id === id) {
      setActiveBook(null);
      setCurrentView('library');
    }
    setBookToDelete(null);
    showToast('Tomo eliminado de la biblioteca.');
  };

  // Change Category
  const handleChangeCategory = (
    id: string,
    cat: 'reading' | 'unread' | 'completed' | 'abandoned',
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();
    setBooks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, category: cat } : b))
    );
  };

  // Update Reading Progress (memoized so Reader doesn't re-bind handlers on every turn)
  const handleUpdateBookProgress = useCallback((
    bookId: string,
    curPage: number,
    totPages: number
  ) => {
    const safeTotal = Math.max(1, totPages);
    const percent = Math.min(100, Math.round((curPage / safeTotal) * 100));
    setBooks((prev) =>
      prev.map((b) => {
        if (b.id === bookId) {
          return {
            ...b,
            currentPage: curPage,
            totalPages: safeTotal,
            progressPercent: percent,
            category: percent === 100 ? 'completed' : b.category === 'unread' ? 'reading' : b.category,
            lastReadAt: Date.now()
          };
        }
        return b;
      })
    );
  }, []);

  // Record reading session duration and pages to statistics
  const handleRecordReadingSession = useCallback((minutes: number, pagesRead: number) => {
    if (!activeBook) return;
    const updated = logReadingSession(activeBook.id, activeBook.title, minutes, pagesRead);
    setReadingStats({ ...updated });
  }, [activeBook]);

  // Save Stickers for a page
  const handleSaveStickers = (pageKey: string, nextStickers: PageSticker[]) => {
    setStickers((prev) => ({
      ...prev,
      [pageKey]: nextStickers
    }));
  };

  // Save Highlights for a page
  const handleSaveHighlights = (pageKey: string, nextHighlights: TextHighlight[]) => {
    setHighlights((prev) => ({
      ...prev,
      [pageKey]: nextHighlights
    }));
  };

  // Save Inline Page Notes (💬 al lado de la línea)
  const handleSavePageNotes = useCallback((pageKey: string, nextNotes: PageNote[]) => {
    setPageNotes((prev) => {
      if (nextNotes.length === 0) {
        const copy = { ...prev };
        delete copy[pageKey];
        return copy;
      }
      return { ...prev, [pageKey]: nextNotes };
    });
  }, []);

  // Collections / Sagas handlers
  const handleCreateCollection = useCallback((name: string, emoji: string): BookCollection => {
    const newCol: BookCollection = {
      id: `col-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      emoji: emoji || '📚',
      createdAt: Date.now()
    };
    setCollections((prev) => [...prev, newCol]);
    showToast(`Colección "${newCol.name}" creada.`);
    return newCol;
  }, [showToast]);

  const handleDeleteCollection = useCallback((collectionId: string) => {
    setCollections((prev) => prev.filter((c) => c.id !== collectionId));
    setBooks((prev) =>
      prev.map((b) =>
        b.collectionIds?.includes(collectionId)
          ? { ...b, collectionIds: b.collectionIds.filter((id) => id !== collectionId) }
          : b
      )
    );
    showToast('Colección eliminada.');
  }, [showToast]);

  const handleToggleBookCollection = useCallback((bookId: string, collectionId: string) => {
    setBooks((prev) =>
      prev.map((b) => {
        if (b.id !== bookId) return b;
        const currentIds = b.collectionIds || [];
        const exists = currentIds.includes(collectionId);
        const nextIds = exists
          ? currentIds.filter((id) => id !== collectionId)
          : [...currentIds, collectionId];
        return { ...b, collectionIds: nextIds };
      })
    );
  }, []);

  // Export & Import JSON Backup (Copia de seguridad completa)
  const handleExportBackup = useCallback(() => {
    try {
      const payload = {
        app: 'NekoLover Read',
        version: 1,
        exportedAt: new Date().toISOString(),
        collections,
        quotes,
        highlights,
        bookmarks,
        stickers,
        pageNotes,
        readingStats,
        booksMeta: books.map((b) => ({
          id: b.id,
          title: b.title,
          author: b.author,
          type: b.type,
          fileName: b.fileName,
          fileSize: b.fileSize,
          category: b.category,
          favorite: b.favorite,
          collectionIds: b.collectionIds || [],
          currentPage: b.currentPage,
          totalPages: b.totalPages,
          progressPercent: b.progressPercent,
          genres: b.genres,
          description: b.description,
          publisher: b.publisher,
          publishedYear: b.publishedYear
        })),
        preferences: {
          theme: currentTheme,
          font: currentFont,
          isNightMode,
          readerMode,
          containerWidth,
          lineHeight,
          fontSize,
          shelfStyle,
          viewMode,
          headerConfig,
          shelfBgConfig,
          shelfDecorConfig
        }
      };
      const json = JSON.stringify(payload, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `nekolover-read-backup-${dateStamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast('✨ Respaldo exportado correctamente (.json).');
    } catch {
      showToast('⚠️ No se pudo generar el archivo de respaldo.');
    }
  }, [
    collections,
    quotes,
    highlights,
    bookmarks,
    stickers,
    pageNotes,
    readingStats,
    books,
    currentTheme,
    currentFont,
    isNightMode,
    readerMode,
    containerWidth,
    lineHeight,
    fontSize,
    shelfStyle,
    viewMode,
    headerConfig,
    shelfBgConfig,
    shelfDecorConfig,
    showToast
  ]);

  const handleImportBackup = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const parsed = safeJsonParse<Record<string, any> | null>(text, null, isPlainRecord);
      if (!parsed || (!Array.isArray(parsed.quotes) && !Array.isArray(parsed.collections) && !isPlainRecord(parsed.pageNotes))) {
        showToast('⚠️ El archivo no es un respaldo válido de NekoLover Read.');
        return;
      }

      if (Array.isArray(parsed.collections)) setCollections(parsed.collections);
      if (Array.isArray(parsed.quotes)) setQuotes(parsed.quotes);
      if (isPlainRecord(parsed.highlights)) setHighlights(parsed.highlights);
      if (Array.isArray(parsed.bookmarks)) setBookmarks(parsed.bookmarks);
      if (isPlainRecord(parsed.stickers)) setStickers(parsed.stickers);
      if (isPlainRecord(parsed.pageNotes)) setPageNotes(parsed.pageNotes);
      if (isPlainRecord(parsed.readingStats) && isPlainRecord(parsed.readingStats.dailyRecords) && Array.isArray(parsed.readingStats.sessions)) {
        const importedStats = parsed.readingStats as ReadingStatsData;
        saveReadingStats(importedStats);
        setReadingStats(importedStats);
      }

      if (isPlainRecord(parsed.preferences)) {
        const p = parsed.preferences;
        if (typeof p.theme === 'string') setCurrentTheme(p.theme as ThemeId);
        if (typeof p.font === 'string') setCurrentFont(p.font);
        if (typeof p.isNightMode === 'boolean') setIsNightMode(p.isNightMode);
        if (typeof p.readerMode === 'string') {
          setReaderMode(p.readerMode as ReaderModeId);
          localStorage.setItem('nl_reader_mode', p.readerMode);
        }
        if (typeof p.containerWidth === 'string') {
          setContainerWidth(p.containerWidth as 'normal' | 'wide' | 'narrow');
          localStorage.setItem('nl_container_width', p.containerWidth);
        }
        if (typeof p.lineHeight === 'number') {
          setLineHeight(p.lineHeight);
          localStorage.setItem('nl_line_height', String(p.lineHeight));
        }
        if (typeof p.fontSize === 'number') {
          setFontSize(p.fontSize);
          localStorage.setItem('nl_font_size', String(p.fontSize));
        }
        if (typeof p.shelfStyle === 'string') {
          setShelfStyle(p.shelfStyle as ShelfStyle);
          localStorage.setItem('nl_shelf_style', p.shelfStyle);
        }
        if (typeof p.viewMode === 'string') {
          setViewMode(p.viewMode as ShelfViewMode);
          localStorage.setItem('nl_shelf_view_mode', p.viewMode);
        }
        if (isPlainRecord(p.headerConfig)) {
          setHeaderConfig((prev) => {
            const next = { ...prev, ...p.headerConfig };
            localStorage.setItem('nl_header_config', JSON.stringify(next));
            return next;
          });
        }
        if (isPlainRecord(p.shelfBgConfig)) {
          handleUpdateShelfBgConfig(p.shelfBgConfig as ShelfBackgroundConfig);
        }
        if (isPlainRecord(p.shelfDecorConfig)) {
          handleUpdateShelfDecorConfig(p.shelfDecorConfig as ShelfDecorConfig);
        }
      }

      // Merge reading progress, favorites, categories & collections onto matching books
      if (Array.isArray(parsed.booksMeta)) {
        const metaById = new Map<string, any>();
        const metaByFileKey = new Map<string, any>();
        parsed.booksMeta.forEach((m: any) => {
          if (m?.id) metaById.set(String(m.id), m);
          if (m?.fileName) {
            metaByFileKey.set(`${String(m.fileName).toLowerCase()}|${m.fileSize || ''}`, m);
          }
        });

        setBooks((prev) => {
          const updated = prev.map((b) => {
            const m =
              metaById.get(b.id) ||
              (b.fileName ? metaByFileKey.get(`${b.fileName.toLowerCase()}|${b.fileSize || ''}`) : undefined);
            if (!m) return b;
            return {
              ...b,
              category: m.category || b.category,
              favorite: typeof m.favorite === 'boolean' ? m.favorite : b.favorite,
              collectionIds: Array.isArray(m.collectionIds) ? m.collectionIds : b.collectionIds,
              currentPage: typeof m.currentPage === 'number' ? m.currentPage : b.currentPage,
              totalPages: typeof m.totalPages === 'number' ? m.totalPages : b.totalPages,
              progressPercent: typeof m.progressPercent === 'number' ? m.progressPercent : b.progressPercent,
              genres: Array.isArray(m.genres) ? m.genres : b.genres,
              description: typeof m.description === 'string' ? m.description : b.description,
              publisher: typeof m.publisher === 'string' ? m.publisher : b.publisher,
              publishedYear: typeof m.publishedYear === 'string' ? m.publishedYear : b.publishedYear
            };
          });
          saveBooksToDB(updated);
          return updated;
        });
      }

      showToast('✨ Respaldo restaurado con éxito (notas, citas, colecciones y progreso).');
    } catch {
      showToast('⚠️ Error al leer el archivo de respaldo.');
    }
  }, [showToast]);

  // Toggle Bookmark for current page
  const handleToggleBookmark = (page: number) => {
    if (!activeBook) return;
    const exists = bookmarks.find((bm) => bm.bookId === activeBook.id && bm.page === page);

    if (exists) {
      setBookmarks((prev) => prev.filter((bm) => bm.id !== exists.id));
      showToast(`Marcador de la página ${page} removido.`);
    } else {
      const newBm: Bookmark = {
        id: `bm-${Date.now()}`,
        bookId: activeBook.id,
        bookTitle: activeBook.title,
        page,
        createdAt: Date.now()
      };
      setBookmarks((prev) => [newBm, ...prev]);
      showToast(`🔖 Marcador guardado en la página ${page}`);
    }
  };

  // Select bookmark from drawer
  const handleSelectBookmark = (bookId: string, page: number) => {
    const targetBook = books.find((b) => b.id === bookId);
    if (targetBook) {
      setActiveBook({ ...targetBook, currentPage: page });
      setCurrentView('reader');
    }
  };

  // Save Quote
  const handleSaveQuote = (quoteData: Omit<Quote, 'id' | 'createdAt'>) => {
    const newQuote: Quote = {
      ...quoteData,
      id: `q-${Date.now()}`,
      createdAt: Date.now()
    };
    setQuotes((prev) => [newQuote, ...prev]);
    showToast('✨ Cita guardada en tu Baúl Literario.');
  };

  // Delete Quote
  const handleDeleteQuote = (id: string) => {
    setQuotes((prev) => prev.filter((q) => q.id !== id));
    showToast('Cita eliminada.');
  };

  // Delete Bookmark
  const handleDeleteBookmark = (id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
    showToast('Marcador eliminado.');
  };

  // Restore Default Demo Books
  const handleRestoreDefaults = () => {
    setBooks(DEFAULT_BOOKS);
    setQuotes(DEFAULT_QUOTES);
    setStickers(DEFAULT_STICKERS);
    showToast('🐾 Clásicos Neko restaurados con éxito.');
  };

  // Trigger file upload from bookshelf
  const handleTriggerUpload = () => {
    const input = document.getElementById('global-file-input') as HTMLInputElement;
    input?.click();
  };

  // Check if active book's page is bookmarked
  const isCurrentPageBookmarked =
    activeBook &&
    bookmarks.some(
      (bm) => bm.bookId === activeBook.id && bm.page === (activeBook.currentPage || 1)
    );

  return (
    <div className="min-h-[100dvh] flex flex-col overflow-x-hidden bg-[var(--bg-color)] text-[var(--text-main)] transition-colors duration-300">
      {/* Hidden file input for single/multi upload */}
      <input
        id="global-file-input"
        type="file"
        accept=".epub,.pdf,.txt,.md,application/epub+zip,application/pdf,text/plain,text/markdown"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFileUpload(e.target.files);
          e.target.value = '';
        }}
      />

      {/* Hidden folder input for directory sync (Android / iOS / Safari fallback) */}
      <input
        id="folder-sync-input"
        type="file"
        // @ts-ignore
        webkitdirectory=""
        // @ts-ignore
        directory=""
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFolderSyncChange(e.target.files);
          e.target.value = '';
        }}
      />

      {/* Internal Storage Sync Progress Modal */}
      {syncState.isSyncing && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1726] border-2 border-purple-500/50 rounded-3xl p-6 max-w-md w-full shadow-[0_0_50px_rgba(168,85,247,0.3)] text-center space-y-4 animate-popIn">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/20 text-purple-300 mx-auto flex items-center justify-center text-2xl shadow-inner animate-pulse">
              <FolderSync className="w-7 h-7 animate-spin" />
            </div>

            <div>
              <h3 className="dark-reborn-font font-bold text-lg text-white">
                {syncState.phase === 'scanning'
                  ? 'Escaneando Carpeta de Libros'
                  : 'Importando Libros a la Estantería'}
              </h3>
              <p className="text-xs text-purple-200/80 mt-1">
                {syncState.phase === 'scanning'
                  ? 'Buscando archivos .epub, .pdf, .txt y .md...'
                  : 'Guardando libros de forma rápida en tu biblioteca.'}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5 text-left">
              <div className="flex justify-between text-xs font-mono text-[var(--accent-pink)]">
                <span>
                  {syncState.phase === 'scanning'
                    ? `${syncState.current} libro(s) encontrados`
                    : `Libro ${syncState.current} de ${syncState.total}`}
                </span>
                {syncState.phase === 'importing' && (
                  <span>{Math.round((syncState.current / Math.max(1, syncState.total)) * 100)}%</span>
                )}
              </div>
              <div className="w-full bg-black/60 h-2.5 rounded-full overflow-hidden border border-white/10">
                {syncState.phase === 'scanning' ? (
                  <div className="h-full w-1/2 bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse rounded-full" />
                ) : (
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-150"
                    style={{ width: `${Math.round((syncState.current / Math.max(1, syncState.total)) * 100)}%` }}
                  />
                )}
              </div>
              <p className="text-[11px] text-[var(--text-muted)] truncate mt-1 font-mono">
                {syncState.currentFile}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                syncCancelledRef.current = true;
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-red-500/30 border border-white/15 text-white transition cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Protected Folder / Android Multi-File Fallback Modal */}
      {folderFallbackPrompt && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1726] border-2 border-purple-500/50 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 relative">
            <button
              type="button"
              onClick={() => setFolderFallbackPrompt(null)}
              className="absolute top-3.5 right-3.5 p-1.5 rounded-xl text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0">
                <FolderSync className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Subir Carpeta o Varios Libros</h3>
                <p className="text-[11px] text-[var(--text-muted)] leading-snug mt-0.5">
                  {folderFallbackPrompt}
                </p>
              </div>
            </div>

            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setFolderFallbackPrompt(null);
                  const input = document.getElementById('global-file-input') as HTMLInputElement;
                  input?.click();
                }}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Seleccionar Varios Libros (.epub, .pdf, .txt)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFolderFallbackPrompt(null);
                  const input = document.getElementById('folder-sync-input') as HTMLInputElement;
                  input?.click();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-black/50 border border-purple-400/40 hover:border-purple-400 text-purple-200 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <FolderSync className="w-4 h-4" />
                <span>Elegir Carpeta (Solo importa los nuevos)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Linked Folder Sync Modal (Desktop persistent directory handle) */}
      {isLinkedFolderModalOpen && linkedFolderHandle && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1726] border-2 border-purple-500/50 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 relative">
            <button
              type="button"
              onClick={() => setIsLinkedFolderModalOpen(false)}
              className="absolute top-3.5 right-3.5 p-1.5 rounded-xl text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0">
                <FolderSync className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-base text-white">Carpeta Vinculada</h3>
                <p className="text-xs text-[var(--accent-pink)] font-mono truncate mt-0.5">
                  📁 {linkedFolderHandle.name || 'Biblioteca Local'}
                </p>
              </div>
            </div>

            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Escanea esta carpeta automáticamente y guarda solo los libros nuevos que hayas agregado sin duplicar los existentes.
            </p>

            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => void handleSyncLinkedFolderNow()}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
              >
                <FolderSync className="w-4 h-4" />
                <span>Sincronizar Libros Nuevos Ahora</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsLinkedFolderModalOpen(false);
                    void handlePickAndLinkFolder();
                  }}
                  className="py-2.5 px-3 rounded-xl bg-black/50 border border-purple-400/40 hover:border-purple-400 text-purple-200 font-bold text-xs transition cursor-pointer"
                >
                  Cambiar Carpeta
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsLinkedFolderModalOpen(false);
                    setLinkedFolderHandle(null);
                    void clearLinkedFolderHandle();
                    showToast('Carpeta desvinculada.');
                  }}
                  className="py-2.5 px-3 rounded-xl bg-black/50 border border-rose-500/35 hover:border-rose-400 text-rose-300 font-bold text-xs transition cursor-pointer"
                >
                  Desvincular
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Header - Clean without buttons next to app name */}
      <Header
        currentView={currentView === 'reader' ? 'library' : currentView}
        onSwitchView={(view) => {
          if (view === 'bookmarks') {
            setIsBookmarksOpen(true);
          } else {
            setCurrentView(view);
          }
        }}
        isVip={isVip}
        onOpenVipModal={() => openVipModal()}
      />

      {/* Main Content View Switcher */}
      <main className="flex-1 flex flex-col">
        {currentView === 'library' && (
          <Bookshelf
            books={books}
            collections={collections}
            onCreateCollection={handleCreateCollection}
            onDeleteCollection={handleDeleteCollection}
            onOpenBook={handleOpenBook}
            onToggleFavorite={handleToggleFavorite}
            onDeleteBook={handleDeleteBook}
            onChangeCategory={handleChangeCategory}
            onRestoreDefaults={handleRestoreDefaults}
            onTriggerUpload={handleTriggerUpload}
            onSyncFolder={handleSyncInternalStorage}
            linkedFolderName={linkedFolderHandle?.name || null}
            onReorderBooks={handleReorderBooks}
            onNavigateToStats={() => setCurrentView('stats')}
            onOpenSettings={() => setCurrentView('settings')}
            onSwitchView={(view) => {
              if (view === 'bookmarks') {
                setIsBookmarksOpen(true);
              } else {
                setCurrentView(view);
              }
            }}
            quotesCount={quotes.length}
            bookmarksCount={bookmarks.length}
            isNightMode={isNightMode}
            onToggleNightMode={handleToggleNightMode}
            onOpenThemeModal={() => setIsThemeModalOpen(true)}
            onOpenAudioModal={() => {
              if (!isVip) {
                openVipModal('music');
              } else {
                setIsAudioModalOpen(true);
              }
            }}
            isAudioPlaying={isAudioPlaying}
            headerConfig={headerConfig}
            shelfStyle={shelfStyle}
            onShelfStyleChange={(s) => {
              setShelfStyle(s);
              localStorage.setItem('nl_shelf_style', s);
            }}
            viewMode={viewMode}
            onViewModeChange={(m) => {
              setViewMode(m);
              localStorage.setItem('nl_shelf_view_mode', m);
            }}
            shelfBgConfig={shelfBgConfig}
            onUpdateShelfBgConfig={handleUpdateShelfBgConfig}
            shelfDecorConfig={shelfDecorConfig}
            onUpdateShelfDecorConfig={handleUpdateShelfDecorConfig}
            isVip={isVip}
            onOpenVipModal={() => openVipModal('shelf_bg')}
            onOpenVipPage={() => setCurrentView('vip')}
          />
        )}

        {currentView === 'reader' && activeBook && (
          <Suspense fallback={<div className="flex items-center justify-center py-24"><Loader2 className="w-7 h-7 animate-spin text-[var(--accent-pink)]" /></div>}>
            <Reader
              book={activeBook}
            onBackToLibrary={() => setCurrentView('library')}
            onOpenFontModal={() => setIsFontModalOpen(true)}
            onOpenThemeModal={() => setIsThemeModalOpen(true)}
            onOpenAddQuote={(selText) => {
              if (!isVip && quotes.length >= 3) {
                openVipModal('notes');
                showToast('👑 Límite de 3 notas alcanzado. Pásate a VIP ($2/mes) para notas infinitas.');
                return;
              }
              setQuoteSelectedText(selText);
              setIsAddQuoteOpen(true);
            }}
            onToggleBookmark={handleToggleBookmark}
            isBookmarked={!!isCurrentPageBookmarked}
            stickers={stickers}
            onSaveStickers={handleSaveStickers}
            highlights={highlights}
            onSaveHighlights={handleSaveHighlights}
            onUpdateBookProgress={handleUpdateBookProgress}
            currentFont={currentFont}
            onSelectFont={setCurrentFont}
            onOpenMusicShelf={() => {
              if (!isVip) {
                openVipModal('music');
              } else {
                setIsAudioModalOpen(true);
              }
            }}
            onRecordReadingSession={handleRecordReadingSession}
            readerMode={readerMode}
            onSelectReaderMode={(mode) => {
              setReaderMode(mode);
              localStorage.setItem('nl_reader_mode', mode);
            }}
            containerWidth={containerWidth}
            onSelectContainerWidth={(w) => {
              setContainerWidth(w);
              localStorage.setItem('nl_container_width', w);
            }}
            lineHeight={lineHeight}
            onSelectLineHeight={(lh) => {
              setLineHeight(lh);
              localStorage.setItem('nl_line_height', String(lh));
            }}
            fontSize={fontSize}
            onSelectFontSize={(fs) => {
              setFontSize(fs);
              localStorage.setItem('nl_font_size', String(fs));
            }}
              isVip={isVip}
              onOpenVipModal={openVipModal}
              quotesCount={quotes.length}
              pageNotes={pageNotes}
              onSavePageNotes={handleSavePageNotes}
              bookQuotes={quotes.filter((q) => q.bookId === activeBook.id)}
              bookBookmarks={bookmarks.filter((bm) => bm.bookId === activeBook.id)}
            />
          </Suspense>
        )}

        {currentView === 'quotes' && (
          <Suspense fallback={<div className="flex items-center justify-center py-24"><Loader2 className="w-7 h-7 animate-spin text-[var(--accent-pink)]" /></div>}>
            <QuotesVault
              quotes={quotes}
              highlights={highlights}
              books={books}
              onOpenAddQuote={(defaultText?: string) => {
                if (!isVip && quotes.length >= 3) {
                  openVipModal('notes');
                  showToast('👑 Límite de 3 notas alcanzado. Pásate a VIP ($2/mes) para notas infinitas.');
                  return;
                }
                setQuoteSelectedText(defaultText);
                setIsAddQuoteOpen(true);
              }}
              onDeleteQuote={handleDeleteQuote}
              onDeleteHighlight={(pageKey, id) => {
                setHighlights((prev) => {
                  const next = (prev[pageKey] || []).filter((h) => h.id !== id);
                  if (next.length === 0) {
                    const copy = { ...prev };
                    delete copy[pageKey];
                    return copy;
                  }
                  return { ...prev, [pageKey]: next };
                });
                showToast('Subrayado eliminado.');
              }}
              isVip={isVip}
              onOpenVipModal={() => openVipModal('notes')}
            />
          </Suspense>
        )}

        {currentView === 'stats' && (
          <Suspense fallback={<div className="flex items-center justify-center py-24"><Loader2 className="w-7 h-7 animate-spin text-[var(--accent-pink)]" /></div>}>
            <StatsPanel
              stats={readingStats}
              books={books}
              onUpdateStats={setReadingStats}
              onNavigateToLibrary={() => setCurrentView('library')}
            />
          </Suspense>
        )}

        {currentView === 'settings' && (
          <Suspense fallback={<div className="flex items-center justify-center py-24"><Loader2 className="w-7 h-7 animate-spin text-[var(--accent-pink)]" /></div>}>
            <SettingsView
              currentTheme={currentTheme}
              onSelectTheme={setCurrentTheme}
              currentFont={currentFont}
              onSelectFont={setCurrentFont}
              isNightMode={isNightMode}
              onToggleNightMode={handleToggleNightMode}
              readerMode={readerMode}
              onSelectReaderMode={(mode) => {
                setReaderMode(mode);
                localStorage.setItem('nl_reader_mode', mode);
              }}
              containerWidth={containerWidth}
              onChangeContainerWidth={(w: 'narrow' | 'normal' | 'wide') => {
                setContainerWidth(w);
                localStorage.setItem('nl_container_width', w);
              }}
              lineHeight={lineHeight}
              onChangeLineHeight={(lh: number) => {
                setLineHeight(lh);
                localStorage.setItem('nl_line_height', String(lh));
              }}
              fontSize={fontSize}
              onChangeFontSize={(fs: number) => {
                setFontSize(fs);
                localStorage.setItem('nl_font_size', String(fs));
              }}
              headerConfig={headerConfig}
              onUpdateHeaderConfig={(key: keyof HeaderButtonsConfig, value: boolean) => {
                setHeaderConfig((prev) => {
                  const updated = { ...prev, [key]: value };
                  localStorage.setItem('nl_header_config', JSON.stringify(updated));
                  return updated;
                });
              }}
              shelfStyle={shelfStyle}
              onChangeShelfStyle={(style: ShelfStyle) => {
                setShelfStyle(style);
                localStorage.setItem('nl_shelf_style', style);
              }}
              viewMode={viewMode}
              onChangeViewMode={(mode: ShelfViewMode) => {
                setViewMode(mode);
                localStorage.setItem('nl_shelf_view_mode', mode);
              }}
              shelfBgConfig={shelfBgConfig}
              onUpdateShelfBgConfig={handleUpdateShelfBgConfig}
              shelfDecorConfig={shelfDecorConfig}
              onUpdateShelfDecorConfig={handleUpdateShelfDecorConfig}
              onResetStatsToZero={() => {
                const fresh = resetReadingStatsToZero();
                setReadingStats(fresh);
                showToast('✨ Estadísticas reiniciadas a cero. Comenzarán con tu primera lectura.');
              }}
              onBack={() => setCurrentView('library')}
              onOpenLegalModal={handleOpenLegalModal}
              onOpenStats={() => setCurrentView('stats')}
              onOpenQuotes={() => setCurrentView('quotes')}
              quotesCount={quotes.length}
              highlightsCount={Object.values(highlights).reduce((acc, list) => acc + (list?.length || 0), 0)}
              pageNotesCount={Object.values(pageNotes).reduce((acc, list) => acc + (list?.length || 0), 0)}
              collectionsCount={collections.length}
              onExportBackup={handleExportBackup}
              onImportBackup={handleImportBackup}
              isVip={isVip}
              onOpenVipModal={openVipModal}
            />
          </Suspense>
        )}

        {currentView === 'vip' && (
          <Suspense fallback={<div className="flex items-center justify-center py-24"><Loader2 className="w-7 h-7 animate-spin text-[var(--accent-pink)]" /></div>}>
            <VipClubPage
              onBack={() => setCurrentView('library')}
              onOpenLegalModal={handleOpenLegalModal}
              onSubscribed={() => {
                setIsVip(true);
                showToast('👑 ¡Membresía VIP Activada! Disfruta de música, fotos, tipografías y notas ilimitadas.');
              }}
            />
          </Suspense>
        )}
      </main>

      {/* Modals & Overlays */}
      <ThemeModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        currentTheme={currentTheme}
        onSelectTheme={setCurrentTheme}
      />

      <FontModal
        isOpen={isFontModalOpen}
        onClose={() => setIsFontModalOpen(false)}
        currentFont={currentFont}
        onSelectFont={setCurrentFont}
        isVip={isVip}
        onOpenVipModal={() => openVipModal('fonts')}
      />

      <AddQuoteModal
        isOpen={isAddQuoteOpen}
        onClose={() => {
          setIsAddQuoteOpen(false);
          setQuoteSelectedText(undefined);
        }}
        onSaveQuote={handleSaveQuote}
        activeBook={activeBook}
        defaultText={quoteSelectedText}
        currentPage={activeBook?.currentPage || 1}
      />

      {isAudioModalOpen && (
        <Suspense fallback={null}>
          <MusicShelfModal
            isOpen={isAudioModalOpen}
            onClose={() => setIsAudioModalOpen(false)}
            onToast={showToast}
          />
        </Suspense>
      )}

      <BookmarksDrawer
        isOpen={isBookmarksOpen}
        onClose={() => setIsBookmarksOpen(false)}
        bookmarks={bookmarks}
        books={books}
        onSelectBookmark={handleSelectBookmark}
        onDeleteBookmark={handleDeleteBookmark}
      />

      {/* NekoLover VIP Club Subscription Modal ($2.00 USD/month - Solo PayPal) */}
      {isVipModalOpen && (
        <Suspense fallback={null}>
          <VipSubscriptionModal
            isOpen={isVipModalOpen}
            onClose={() => setIsVipModalOpen(false)}
            onSubscribed={() => {
              setIsVip(true);
              showToast('👑 ¡Membresía VIP Activada! Disfruta de música, fotos, tipografías y notas ilimitadas.');
            }}
            onOpenLegalModal={handleOpenLegalModal}
            featureReason={vipFeatureReason}
          />
        </Suspense>
      )}

      {/* Centro Legal y Transparencia Modal (Términos, Privacidad, Cookies, Reembolso, Auditoría) */}
      {isLegalModalOpen && (
        <Suspense fallback={null}>
          <LegalModal
            isOpen={isLegalModalOpen}
            onClose={() => setIsLegalModalOpen(false)}
            initialTab={legalModalTab}
          />
        </Suspense>
      )}

      {/* Banner de Consentimiento de Almacenamiento Local y Cookies */}
      <CookieConsentBanner
        onOpenLegalModal={handleOpenLegalModal}
      />

      {/* Pre-Reader Book Biography / Profile Modal */}
      {(() => {
        const previewBook = previewBookId ? books.find((b) => b.id === previewBookId) : null;
        if (!previewBook) return null;
        return (
          <Suspense fallback={null}>
            <BookDetailModal
              book={previewBook}
              collections={collections}
              onToggleBookCollection={handleToggleBookCollection}
              onCreateCollection={handleCreateCollection}
              quotesCountForBook={quotes.filter((q) => q.bookId === previewBook.id).length}
              bookmarksCountForBook={bookmarks.filter((bm) => bm.bookId === previewBook.id).length}
              onClose={() => setPreviewBookId(null)}
              onEnterReader={handleEnterReaderFromPreview}
              onUpdateBook={handleUpdateBookMetadata}
              onToggleFavorite={handleToggleFavorite}
              onChangeCategory={handleChangeCategory}
            />
          </Suspense>
        );
      })()}

      {/* In-App Gothic Delete Book Confirmation Modal */}
      {bookToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm modal-animate">
          <div className="bg-[var(--card-bg)] border border-red-500/60 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto text-xl shadow-lg">
              🥀
            </div>
            <div>
              <h3 className="text-base font-bold text-white">¿Eliminar tomo de la estantería?</h3>
              <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
                ¿Seguro que deseas eliminar <span className="text-[var(--accent-pink)] font-semibold font-cute">"{bookToDelete.title}"</span>? Se borrará de tus lecturas.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                onClick={() => setBookToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDeleteBook}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-500 hover:bg-red-600 text-white transition shadow-lg flex items-center gap-1.5 active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar Definitivamente</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 bg-[var(--card-bg)] border border-[var(--accent-pink)] text-white px-4 py-3 rounded-2xl shadow-2xl modal-animate flex items-center space-x-2.5">
          <span className="text-lg shrink-0">🐾</span>
          <span className="text-xs font-semibold leading-snug">{toastMessage}</span>
        </div>
      )}

      <OfflineIndicator />
    </div>
  );
}
