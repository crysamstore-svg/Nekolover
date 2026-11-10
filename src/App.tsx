import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Trash2, FolderSync, Loader2 } from 'lucide-react';
import { Book, Quote, PageSticker, Bookmark, ThemeId, ReadingStatsData, TextHighlight, ReaderModeId, ShelfStyle, ShelfViewMode, ShelfBackgroundConfig } from './types';
import { 
  DEFAULT_BOOKS, 
  DEFAULT_QUOTES, 
  DEFAULT_STICKERS 
} from './data/defaultBooks';
import { Header } from './components/Header';
import { Bookshelf } from './components/Bookshelf';
import { Reader } from './components/Reader';
import { QuotesVault } from './components/QuotesVault';
import { StatsPanel } from './components/StatsPanel';
import { ThemeModal } from './components/ThemeModal';
import { FontModal } from './components/FontModal';
import { AddQuoteModal } from './components/AddQuoteModal';
import { AmbientAudioModal } from './components/AmbientAudioModal';
import { MusicShelfModal } from './components/MusicShelfModal';
import { VipSubscriptionModal } from './components/VipSubscriptionModal';
import { VipClubPage } from './components/VipClubPage';
import { musicPlayer } from './utils/musicManager';
import { vipManager } from './utils/vipManager';
import { BookmarksDrawer } from './components/BookmarksDrawer';
import { SettingsView, HeaderButtonsConfig } from './components/SettingsView';
import { DEFAULT_SHELF_BG } from './components/ShelfBackgroundModal';
import { LegalModal, LegalTab } from './components/LegalModal';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import { saveFileToDB, deleteFileFromDB, saveBooksToDB, getBooksFromDB, getSmartEmojiForTitle, getRandomGothicGradient } from './utils/db';
import { soundscape } from './utils/audio';
import { loadReadingStats, logReadingSession, resetReadingStatsToZero } from './utils/stats';
import { parseEpubFile } from './utils/epubParser';

export default function App() {
  // App State initialized with localStorage caching
  const [books, setBooks] = useState<Book[]>(() => {
    try {
      const saved = localStorage.getItem('nl_books');
      return saved ? JSON.parse(saved) : DEFAULT_BOOKS;
    } catch {
      return DEFAULT_BOOKS;
    }
  });

  const [quotes, setQuotes] = useState<Quote[]>(() => {
    try {
      const saved = localStorage.getItem('nl_quotes');
      return saved ? JSON.parse(saved) : DEFAULT_QUOTES;
    } catch {
      return DEFAULT_QUOTES;
    }
  });

  const [stickers, setStickers] = useState<Record<string, PageSticker[]>>(() => {
    try {
      const saved = localStorage.getItem('nl_stickers');
      return saved ? JSON.parse(saved) : DEFAULT_STICKERS;
    } catch {
      return DEFAULT_STICKERS;
    }
  });

  const [highlights, setHighlights] = useState<Record<string, TextHighlight[]>>(() => {
    try {
      const saved = localStorage.getItem('nl_highlights');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    try {
      const saved = localStorage.getItem('nl_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
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

  const [headerConfig, setHeaderConfig] = useState<HeaderButtonsConfig>(() => {
    try {
      const saved = localStorage.getItem('nl_header_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      showNightMode: true,
      showAudio: true,
      showTheme: true,
      showStats: true,
      showQuotes: true,
      showBookmarks: true,
    };
  });

  const [shelfStyle, setShelfStyle] = useState<ShelfStyle>(() => {
    return (localStorage.getItem('nl_shelf_style') as ShelfStyle) || 'wood-gothic';
  });

  const [viewMode, setViewMode] = useState<ShelfViewMode>(() => {
    return (localStorage.getItem('nl_shelf_view_mode') as ShelfViewMode) || 'covers';
  });

  // Custom Shelf Background Texture / Photo Config
  const [shelfBgConfig, setShelfBgConfig] = useState<ShelfBackgroundConfig>(() => {
    try {
      const saved = localStorage.getItem('nl_shelf_bg_config');
      return saved ? JSON.parse(saved) : DEFAULT_SHELF_BG;
    } catch {
      return DEFAULT_SHELF_BG;
    }
  });

  const handleUpdateShelfBgConfig = (cfg: ShelfBackgroundConfig) => {
    setShelfBgConfig(cfg);
    try {
      localStorage.setItem('nl_shelf_bg_config', JSON.stringify(cfg));
    } catch (e) {
      console.warn('Error saving shelf background config:', e);
    }
  };

  // Navigation & Active Reading
  const [currentView, setCurrentView] = useState<'library' | 'quotes' | 'bookmarks' | 'stats' | 'reader' | 'settings' | 'vip'>('library');
  const [activeBook, setActiveBook] = useState<Book | null>(null);

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
  const [vipFeatureReason, setVipFeatureReason] = useState<'music' | 'fonts' | 'shelf_bg' | 'stickers' | 'highlights' | 'notes' | null>(null);

  // Legal Modal State (Términos, Privacidad, Cookies, Reembolso, Auditoría)
  const [isLegalModalOpen, setIsLegalModalOpen] = useState<boolean>(false);
  const [legalModalTab, setLegalModalTab] = useState<LegalTab>('terms');

  const handleOpenLegalModal = (tab: LegalTab = 'terms') => {
    setLegalModalTab(tab);
    setIsLegalModalOpen(true);
  };

  const openVipModal = (reason?: 'music' | 'fonts' | 'shelf_bg' | 'stickers' | 'highlights' | 'notes') => {
    setVipFeatureReason(reason || null);
    setIsVipModalOpen(true);
  };

  useEffect(() => {
    const unsub = vipManager.onVipChange((vip) => {
      setIsVip(vip);
    });
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

  const isDbInitializedRef = useRef(false);

  // Load books from IndexedDB on startup (Supports 2000+ books without localStorage 5MB limit)
  useEffect(() => {
    let isMounted = true;
    getBooksFromDB()
      .then((stored) => {
        if (isMounted && stored && stored.length > 0) {
          setBooks(stored);
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

  // Save books to IndexedDB only AFTER initial load completes, updating lightweight cache
  useEffect(() => {
    if (!isDbInitializedRef.current) return;

    saveBooksToDB(books);
    try {
      // Lightweight title index in localStorage for fast splash boot (first 40 items without content)
      const lightCache = books.slice(0, 40).map((b) => ({ ...b, content: undefined }));
      localStorage.setItem('nl_books', JSON.stringify(lightCache));
    } catch {}
  }, [books]);

  // Sync state for large batch / folder sync
  const [syncState, setSyncState] = useState<{
    isSyncing: boolean;
    current: number;
    total: number;
    currentFile: string;
  }>({
    isSyncing: false,
    current: 0,
    total: 0,
    currentFile: ''
  });

  // Batch process files into bookshelf (Capacity up to 2000 books)
  const processBatchBooks = async (fileList: File[]) => {
    const validFiles = fileList.filter((f) => {
      const lower = f.name.toLowerCase();
      return lower.endsWith('.pdf') || lower.endsWith('.epub') || lower.endsWith('.txt') || lower.endsWith('.md');
    });

    if (validFiles.length === 0) {
      showToast('No se encontraron archivos de lectura (.epub, .pdf, .txt, .md).');
      return;
    }

    const MAX_BOOKS = 2000;
    if (books.length >= MAX_BOOKS) {
      showToast('⚠️ Capacidad máxima alcanzada (2000 libros).');
      return;
    }

    setSyncState({
      isSyncing: true,
      current: 0,
      total: validFiles.length,
      currentFile: validFiles[0]?.name || ''
    });

    const newBooksToAdd: Book[] = [];

    for (let i = 0; i < validFiles.length; i++) {
      if (books.length + newBooksToAdd.length >= MAX_BOOKS) {
        showToast('⚠️ Se alcanzó el límite de 2000 libros.');
        break;
      }

      const file = validFiles[i];
      setSyncState({
        isSyncing: true,
        current: i + 1,
        total: validFiles.length,
        currentFile: file.name
      });

      const bookId = `book-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`;
      const fileNameLower = file.name.toLowerCase();
      const rawTitle = file.name.replace(/\.[^/.]+$/, '');
      const smartEmoji = getSmartEmojiForTitle(rawTitle);
      const gradient = getRandomGothicGradient(books.length + i);

      // Case 1: EPUB
      if (fileNameLower.endsWith('.epub')) {
        let epubPages: string[] = [];
        let detectedTitle = rawTitle;
        let detectedAuthor = 'Autor EPUB';

        try {
          const arrayBuffer = await file.arrayBuffer();
          await saveFileToDB(bookId, arrayBuffer);
          const parsed = await parseEpubFile(arrayBuffer);
          if (parsed.pages && parsed.pages.length > 0) epubPages = parsed.pages;
          if (parsed.title) detectedTitle = parsed.title;
          if (parsed.author) detectedAuthor = parsed.author;
        } catch {
          await saveFileToDB(bookId, file);
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
          content: epubPages.length > 0 ? epubPages : undefined,
          fileName: file.name,
          currentPage: 1,
          totalPages: Math.max(1, epubPages.length),
          progressPercent: 0,
          addedAt: Date.now()
        });
        continue;
      }

      // Case 2: Plain Text / Markdown
      if (fileNameLower.endsWith('.txt') || fileNameLower.endsWith('.md')) {
        try {
          const fullText = await file.text();
          const pageSize = 1200;
          const pageChunks: string[] = [];
          for (let p = 0; p < fullText.length; p += pageSize) {
            pageChunks.push(fullText.slice(p, p + pageSize));
          }

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
            fileName: file.name,
            currentPage: 1,
            totalPages: Math.max(1, pageChunks.length),
            progressPercent: 0,
            addedAt: Date.now()
          });
        } catch {}
        continue;
      }

      // Case 3: PDF
      await saveFileToDB(bookId, file);
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
        currentPage: 1,
        totalPages: 1,
        progressPercent: 0,
        addedAt: Date.now()
      });
    }

    setBooks((prev) => {
      const merged = [...newBooksToAdd, ...prev].slice(0, MAX_BOOKS);
      saveBooksToDB(merged);
      return merged;
    });

    setSyncState({ isSyncing: false, current: 0, total: 0, currentFile: '' });
    showToast(`🐾 ¡Sincronización completada! ${newBooksToAdd.length} libro(s) colocados automáticamente en tu estantería.`);
  };

  // File Upload Handler (EPUB, PDF, TXT, MD)
  const handleFileUpload = async (fileList: FileList) => {
    const files = Array.from(fileList);
    await processBatchBooks(files);
  };

  // Internal Storage Directory Sync (Supports 2000 books automatic scanning)
  const handleSyncInternalStorage = async () => {
    try {
      if ('showDirectoryPicker' in window) {
        showToast('📂 Selecciona tu carpeta de libros en tu almacenamiento...');
        const dirHandle = await (window as any).showDirectoryPicker({
          id: 'neko-reader-storage-sync',
          mode: 'read'
        });

        const gatheredFiles: File[] = [];

        async function readDirectoryRecursive(handle: any) {
          for await (const entry of handle.values()) {
            if (entry.kind === 'file') {
              const file = await entry.getFile();
              const lower = file.name.toLowerCase();
              if (lower.endsWith('.pdf') || lower.endsWith('.epub') || lower.endsWith('.txt') || lower.endsWith('.md')) {
                gatheredFiles.push(file);
              }
            } else if (entry.kind === 'directory') {
              try {
                await readDirectoryRecursive(entry);
              } catch {}
            }
          }
        }

        await readDirectoryRecursive(dirHandle);
        if (gatheredFiles.length === 0) {
          showToast('No se encontraron libros compatibles en la carpeta seleccionada.');
          return;
        }

        await processBatchBooks(gatheredFiles);
      } else {
        const input = document.getElementById('folder-sync-input') as HTMLInputElement;
        input?.click();
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        const input = document.getElementById('folder-sync-input') as HTMLInputElement;
        input?.click();
      }
    }
  };

  const handleFolderSyncChange = (fileList: FileList) => {
    const filesArray = Array.from(fileList);
    processBatchBooks(filesArray);
  };

  const handleReorderBooks = (newBooks: Book[]) => {
    setBooks(newBooks);
    saveBooksToDB(newBooks);
    showToast('✨ Estantería reorganizada.');
  };

  // Open Book in Reader
  const handleOpenBook = (book: Book) => {
    setActiveBook(book);
    setCurrentView('reader');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  // Update Reading Progress
  const handleUpdateBookProgress = (
    bookId: string,
    curPage: number,
    totPages: number
  ) => {
    const percent = Math.min(100, Math.round((curPage / totPages) * 100));
    setBooks((prev) =>
      prev.map((b) => {
        if (b.id === bookId) {
          return {
            ...b,
            currentPage: curPage,
            totalPages: totPages,
            progressPercent: percent,
            category: percent === 100 ? 'completed' : b.category === 'unread' ? 'reading' : b.category,
            lastReadAt: Date.now()
          };
        }
        return b;
      })
    );
  };

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
    <div className="min-h-screen flex flex-col bg-[var(--bg-color)] text-[var(--text-main)] transition-colors duration-300">
      {/* Hidden file input for single/multi upload */}
      <input
        id="global-file-input"
        type="file"
        accept=".pdf,.epub,.txt,.md"
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
                Sincronizando Almacenamiento Interno
              </h3>
              <p className="text-xs text-purple-200/80 mt-1">
                Colocando libros automáticamente en tu estantería (hasta 2000 libros).
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5 text-left">
              <div className="flex justify-between text-xs font-mono text-[var(--accent-pink)]">
                <span>Libro {syncState.current} de {syncState.total}</span>
                <span>{Math.round((syncState.current / Math.max(1, syncState.total)) * 100)}%</span>
              </div>
              <div className="w-full bg-black/60 h-2.5 rounded-full overflow-hidden border border-white/10">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-200"
                  style={{ width: `${Math.round((syncState.current / Math.max(1, syncState.total)) * 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-[var(--text-muted)] truncate mt-1 font-mono">
                {syncState.currentFile}
              </p>
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
            onOpenBook={handleOpenBook}
            onToggleFavorite={handleToggleFavorite}
            onDeleteBook={handleDeleteBook}
            onChangeCategory={handleChangeCategory}
            onRestoreDefaults={handleRestoreDefaults}
            onTriggerUpload={handleTriggerUpload}
            onSyncFolder={handleSyncInternalStorage}
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
            isVip={isVip}
            onOpenVipModal={() => openVipModal('shelf_bg')}
            onOpenVipPage={() => setCurrentView('vip')}
          />
        )}

        {currentView === 'reader' && activeBook && (
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
            onOpenAudioModal={() => {
              if (!isVip) {
                openVipModal('music');
              } else {
                setIsAudioModalOpen(true);
              }
            }}
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
          />
        )}

        {currentView === 'quotes' && (
          <QuotesVault
            quotes={quotes}
            onOpenAddQuote={() => {
              if (!isVip && quotes.length >= 3) {
                openVipModal('notes');
                showToast('👑 Límite de 3 notas alcanzado. Pásate a VIP ($2/mes) para notas infinitas.');
                return;
              }
              setQuoteSelectedText(undefined);
              setIsAddQuoteOpen(true);
            }}
            onDeleteQuote={handleDeleteQuote}
            isVip={isVip}
            onOpenVipModal={() => openVipModal('notes')}
          />
        )}

        {currentView === 'stats' && (
          <StatsPanel
            stats={readingStats}
            books={books}
            onUpdateStats={setReadingStats}
            onNavigateToLibrary={() => setCurrentView('library')}
          />
        )}

        {currentView === 'settings' && (
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
            onResetStatsToZero={() => {
              const fresh = resetReadingStatsToZero();
              setReadingStats(fresh);
              showToast('✨ Estadísticas reiniciadas a cero. Comenzarán con tu primera lectura.');
            }}
            onBack={() => setCurrentView('library')}
            onOpenLegalModal={handleOpenLegalModal}
          />
        )}

        {currentView === 'vip' && (
          <VipClubPage
            onBack={() => setCurrentView('library')}
            onOpenLegalModal={handleOpenLegalModal}
            onSubscribed={() => {
              setIsVip(true);
              showToast('👑 ¡Membresía VIP Activada! Disfruta de música, fotos, tipografías y notas ilimitadas.');
            }}
          />
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

      <MusicShelfModal
        isOpen={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
        onToast={showToast}
      />

      <BookmarksDrawer
        isOpen={isBookmarksOpen}
        onClose={() => setIsBookmarksOpen(false)}
        bookmarks={bookmarks}
        books={books}
        onSelectBookmark={handleSelectBookmark}
        onDeleteBookmark={handleDeleteBookmark}
      />

      {/* NekoLover VIP Club Subscription Modal ($2.00 USD/month - Solo PayPal) */}
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

      {/* Centro Legal y Transparencia Modal (Términos, Privacidad, Cookies, Reembolso, Auditoría) */}
      <LegalModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        initialTab={legalModalTab}
      />

      {/* Banner de Consentimiento de Almacenamiento Local y Cookies */}
      <CookieConsentBanner
        onOpenLegalModal={handleOpenLegalModal}
      />

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
        <div className="fixed bottom-6 right-6 z-50 bg-[var(--card-bg)] border border-[var(--accent-pink)] text-white px-4 py-3 rounded-2xl shadow-2xl modal-animate flex items-center space-x-2.5">
          <span className="text-lg">🐾</span>
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
