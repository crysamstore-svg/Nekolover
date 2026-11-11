import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Heart, 
  Trash2, 
  BookOpen, 
  SlidersHorizontal,
  Bookmark,
  BarChart3,
  CheckCircle2,
  Layers,
  LayoutGrid,
  Library,
  Palette,
  Sparkles,
  MoreVertical,
  Image as ImageIcon,
  Quote as QuoteIcon,
  Bookmark as BookmarkIcon,
  Moon,
  Sun,
  Crown,
  Volume2,
  Music,
  UploadCloud,
  HardDrive,
  ArrowLeft,
  ArrowRight,
  MoveHorizontal,
  FolderSync,
  Check,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  Shuffle,
  GripVertical
} from 'lucide-react';
import { Book, BookCategory, ShelfStyle, ShelfViewMode, ShelfBackgroundConfig } from '../types';
import { ShelfBackgroundModal, DEFAULT_SHELF_BG } from './ShelfBackgroundModal';
import { HeaderButtonsConfig } from './SettingsView';

interface BookshelfProps {
  books: Book[];
  onOpenBook: (book: Book) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onDeleteBook: (id: string, e?: React.MouseEvent) => void;
  onChangeCategory: (id: string, category: 'reading' | 'unread' | 'completed' | 'abandoned', e: React.MouseEvent) => void;
  onRestoreDefaults: () => void;
  onTriggerUpload: () => void;
  onSyncFolder?: () => void;
  onReorderBooks?: (newBooks: Book[]) => void;
  onNavigateToStats?: () => void;
  onOpenSettings?: () => void;
  // Header Action Buttons Props moved beside Search Bar
  onSwitchView?: (view: 'library' | 'quotes' | 'bookmarks' | 'stats' | 'settings' | 'vip') => void;
  quotesCount?: number;
  bookmarksCount?: number;
  isNightMode?: boolean;
  onToggleNightMode?: () => void;
  onOpenThemeModal?: () => void;
  onOpenAudioModal?: () => void;
  isAudioPlaying?: boolean;
  headerConfig?: HeaderButtonsConfig;
  // Shelf config
  shelfStyle?: ShelfStyle;
  onShelfStyleChange?: (style: ShelfStyle) => void;
  viewMode?: ShelfViewMode;
  onViewModeChange?: (mode: ShelfViewMode) => void;
  shelfBgConfig?: ShelfBackgroundConfig;
  onUpdateShelfBgConfig?: (config: ShelfBackgroundConfig) => void;
  isVip?: boolean;
  onOpenVipModal?: () => void;
  onOpenVipPage?: () => void;
}

export const Bookshelf: React.FC<BookshelfProps> = ({
  books,
  onOpenBook,
  onToggleFavorite,
  onDeleteBook,
  onChangeCategory,
  onRestoreDefaults,
  onTriggerUpload,
  onSyncFolder,
  onReorderBooks,
  onNavigateToStats,
  onOpenSettings,
  onSwitchView,
  quotesCount = 0,
  bookmarksCount = 0,
  isNightMode = false,
  onToggleNightMode,
  onOpenThemeModal,
  onOpenAudioModal,
  isAudioPlaying = false,
  headerConfig,
  shelfStyle: propShelfStyle,
  onShelfStyleChange,
  viewMode: propViewMode,
  onViewModeChange,
  shelfBgConfig,
  onUpdateShelfBgConfig,
  isVip,
  onOpenVipModal,
  onOpenVipPage
}) => {
  const [activeCategory, setActiveCategory] = useState<BookCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sorting options: 'custom' preserves the exact user-defined arrangement
  type SortOption = 
    | 'custom'
    | 'recent'
    | 'title-asc'
    | 'title-desc'
    | 'author-asc'
    | 'progress-desc'
    | 'progress-asc'
    | 'favorites'
    | 'newest'
    | 'oldest';

  const [sortBy, setSortBy] = useState<SortOption>(() => {
    return (localStorage.getItem('nl_shelf_sort_by') as SortOption) || 'custom';
  });

  const handleSetSortBy = (val: SortOption) => {
    setSortBy(val);
    localStorage.setItem('nl_shelf_sort_by', val);
  };

  const [isBgModalOpen, setIsBgModalOpen] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(24);

  // Modo de eliminación por mantener presionado (Long-Press to Mark for Deletion)
  const [markedForDeleteIds, setMarkedForDeleteIds] = useState<string[]>([]);
  const [draggedBookId, setDraggedBookId] = useState<string | null>(null);
  const [dragOverBookId, setDragOverBookId] = useState<string | null>(null);
  const longPressTimerRef = useRef<any>(null);
  const suppressClickRef = useRef<boolean>(false);

  const isBookMarked = (id: string) => markedForDeleteIds.includes(id);

  const toggleMarkForDelete = (id: string) => {
    setMarkedForDeleteIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleClearMarked = () => {
    setMarkedForDeleteIds([]);
  };

  const handleDeleteMarkedBooks = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (markedForDeleteIds.length === 0) return;
    markedForDeleteIds.forEach((id) => {
      onDeleteBook(id);
    });
    setMarkedForDeleteIds([]);
  };

  // Shelf Appearance & View Mode Customization (Conventional Shelf)
  const [internalShelfStyle, setInternalShelfStyle] = useState<ShelfStyle>(() => {
    return (localStorage.getItem('nl_shelf_style') as ShelfStyle) || 'wood-gothic';
  });

  const [internalViewMode, setInternalViewMode] = useState<ShelfViewMode>(() => {
    return (localStorage.getItem('nl_shelf_view_mode') as ShelfViewMode) || 'covers';
  });

  const shelfStyle = propShelfStyle ?? internalShelfStyle;
  const viewMode = propViewMode ?? internalViewMode;

  const handleSetShelfStyle = (style: ShelfStyle) => {
    setInternalShelfStyle(style);
    onShelfStyleChange?.(style);
    localStorage.setItem('nl_shelf_style', style);
  };

  const handleSetViewMode = (mode: ShelfViewMode) => {
    setInternalViewMode(mode);
    onViewModeChange?.(mode);
    localStorage.setItem('nl_shelf_view_mode', mode);
  };

  // Mantener presionado (long-press) marca el libro para eliminar (sin vibraciones)
  const handlePressStart = (bookId: string) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    longPressTimerRef.current = setTimeout(() => {
      suppressClickRef.current = true;
      toggleMarkForDelete(bookId);
      setTimeout(() => {
        suppressClickRef.current = false;
      }, 450);
    }, 450);
  };

  const handlePressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Desmarcar libros al presionar la tecla Escape
  useEffect(() => {
    if (markedForDeleteIds.length === 0) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMarkedForDeleteIds([]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [markedForDeleteIds.length]);

  // Move book: left, right, first, or last in bookshelf array
  const handleMoveBook = (
    bookId: string, 
    direction: 'left' | 'right' | 'first' | 'last', 
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();
    const index = books.findIndex((b) => b.id === bookId);
    if (index === -1) return;

    let targetIndex = index;
    if (direction === 'left') targetIndex = index - 1;
    else if (direction === 'right') targetIndex = index + 1;
    else if (direction === 'first') targetIndex = 0;
    else if (direction === 'last') targetIndex = books.length - 1;

    if (targetIndex < 0 || targetIndex >= books.length || targetIndex === index) return;

    const newBooks = [...books];
    const [moved] = newBooks.splice(index, 1);
    newBooks.splice(targetIndex, 0, moved);

    handleSetSortBy('custom');
    if (onReorderBooks) {
      onReorderBooks(newBooks);
    }
  };

  // Drag and Drop Handlers for free movement anywhere
  const handleDragStart = (e: React.DragEvent, bookId: string) => {
    e.dataTransfer.setData('text/plain', bookId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedBookId(bookId);
  };

  const handleDragOver = (e: React.DragEvent, bookId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverBookId !== bookId) {
      setDragOverBookId(bookId);
    }
  };

  const handleDragLeave = (_e: React.DragEvent, bookId: string) => {
    if (dragOverBookId === bookId) {
      setDragOverBookId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetBookId: string) => {
    e.preventDefault();
    setDragOverBookId(null);
    const sourceBookId = e.dataTransfer.getData('text/plain') || draggedBookId;
    setDraggedBookId(null);

    if (!sourceBookId || sourceBookId === targetBookId) return;

    const fromIndex = books.findIndex((b) => b.id === sourceBookId);
    const toIndex = books.findIndex((b) => b.id === targetBookId);

    if (fromIndex === -1 || toIndex === -1) return;

    const newBooks = [...books];
    const [moved] = newBooks.splice(fromIndex, 1);
    newBooks.splice(toIndex, 0, moved);

    handleSetSortBy('custom');
    if (onReorderBooks) {
      onReorderBooks(newBooks);
    }
  };

  const handleDragEnd = () => {
    setDraggedBookId(null);
    setDragOverBookId(null);
  };

  // Deslizar con el dedo en pantallas táctiles (Touch Slide Reorder)
  const [touchActiveBookId, setTouchActiveBookId] = useState<string | null>(null);
  const [touchOverBookId, setTouchOverBookId] = useState<string | null>(null);
  const [touchOffset, setTouchOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const isTouchDragging = useRef<boolean>(false);

  const handleBookTouchStart = (bookId: string, e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    isTouchDragging.current = false;
    handlePressStart(bookId);
  };

  const handleBookTouchMove = (bookId: string, e: React.TouchEvent) => {
    if (!touchStartPos.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartPos.current.x;
    const dy = touch.clientY - touchStartPos.current.y;
    const distance = Math.hypot(dx, dy);

    // Si se desliza más de 8px con el dedo, activar arrastre táctil fluido (sin vibraciones)
    if (distance > 8) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      if (!isTouchDragging.current) {
        isTouchDragging.current = true;
        setTouchActiveBookId(bookId);
      }

      // Prevenir desplazamiento de la página durante el deslizamiento del libro
      if (e.cancelable) {
        e.preventDefault();
      }

      setTouchOffset({ x: dx, y: dy });

      // Detectar el libro que se encuentra debajo del dedo
      const elem = document.elementFromPoint(touch.clientX, touch.clientY);
      const targetCard = elem?.closest('[data-book-id]');
      const targetId = targetCard?.getAttribute('data-book-id');

      if (targetId && targetId !== bookId) {
        if (touchOverBookId !== targetId) {
          setTouchOverBookId(targetId);
        }
      } else {
        setTouchOverBookId(null);
      }
    }
  };

  const handleBookTouchEnd = (bookId: string) => {
    handlePressEnd();

    const wasDragging = isTouchDragging.current;
    if (wasDragging) {
      suppressClickRef.current = true;
      setTimeout(() => {
        suppressClickRef.current = false;
      }, 350);
    }

    if (wasDragging && touchActiveBookId && touchOverBookId && touchActiveBookId !== touchOverBookId) {
      const fromIndex = books.findIndex((b) => b.id === touchActiveBookId);
      const toIndex = books.findIndex((b) => b.id === touchOverBookId);

      if (fromIndex !== -1 && toIndex !== -1) {
        const newBooks = [...books];
        const [moved] = newBooks.splice(fromIndex, 1);
        newBooks.splice(toIndex, 0, moved);

        handleSetSortBy('custom');
        if (onReorderBooks) {
          onReorderBooks(newBooks);
        }
      }
    }

    isTouchDragging.current = false;
    touchStartPos.current = null;
    setTouchActiveBookId(null);
    setTouchOverBookId(null);
    setTouchOffset({ x: 0, y: 0 });
  };

  const handleBookTouchCancel = () => {
    handlePressEnd();
    if (isTouchDragging.current) {
      suppressClickRef.current = true;
      setTimeout(() => {
        suppressClickRef.current = false;
      }, 350);
    }
    isTouchDragging.current = false;
    touchStartPos.current = null;
    setTouchActiveBookId(null);
    setTouchOverBookId(null);
    setTouchOffset({ x: 0, y: 0 });
  };

  // Quick batch sort helpers
  const handleQuickSort = (preset: 'title-asc' | 'author-asc' | 'progress-desc' | 'reverse' | 'favorites') => {
    const sorted = [...books];
    if (preset === 'title-asc') {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    } else if (preset === 'author-asc') {
      sorted.sort((a, b) => a.author.localeCompare(b.author));
    } else if (preset === 'progress-desc') {
      sorted.sort((a, b) => (b.progressPercent || 0) - (a.progressPercent || 0));
    } else if (preset === 'reverse') {
      sorted.reverse();
    } else if (preset === 'favorites') {
      sorted.sort((a, b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0));
    }

    handleSetSortBy('custom');
    if (onReorderBooks) {
      onReorderBooks(sorted);
    }
  };

  // Filter books across whole collection (Capacity up to 2000 books)
  const filteredBooks = books.filter((book) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      query === '' ||
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    if (activeCategory === 'all') return true;
    if (activeCategory === 'favorites') return book.favorite;
    return book.category === activeCategory;
  });

  // Sort books: 'custom' preserves the user's manual arrangement perfectly
  const sortedBooks = [...filteredBooks].sort((a, b) => {
    if (sortBy === 'custom') {
      return 0; // Maintain custom user order
    }
    if (sortBy === 'progress-desc') {
      return (b.progressPercent || 0) - (a.progressPercent || 0);
    }
    if (sortBy === 'progress-asc') {
      return (a.progressPercent || 0) - (b.progressPercent || 0);
    }
    if (sortBy === 'title-asc') {
      return a.title.localeCompare(b.title);
    }
    if (sortBy === 'title-desc') {
      return b.title.localeCompare(a.title);
    }
    if (sortBy === 'author-asc') {
      return a.author.localeCompare(b.author);
    }
    if (sortBy === 'favorites') {
      return (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0);
    }
    if (sortBy === 'newest') {
      return (b.addedAt || 0) - (a.addedAt || 0);
    }
    if (sortBy === 'oldest') {
      return (a.addedAt || 0) - (b.addedAt || 0);
    }
    // Default fallback: 'recent'
    return (b.lastReadAt || b.addedAt || 0) - (a.lastReadAt || a.addedAt || 0);
  });

  // Pagination for high capacity (2000 books)
  const totalPages = Math.max(1, Math.ceil(sortedBooks.length / pageSize));
  const effectivePage = Math.min(currentPage, totalPages);
  const paginatedBooks = sortedBooks.slice((effectivePage - 1) * pageSize, effectivePage * pageSize);

  // Stats
  const totalBooks = books.length;
  const readingCount = books.filter((b) => b.category === 'reading').length;
  const unreadCount = books.filter((b) => b.category === 'unread').length;
  const completedCount = books.filter((b) => b.category === 'completed').length;
  const abandonedCount = books.filter((b) => b.category === 'abandoned').length;
  const favoritesCount = books.filter((b) => b.favorite).length;

  // Chunk books for shelf levels depending on viewMode
  const chunkSize = viewMode === 'spines' ? 7 : 4;
  const shelves: Book[][] = [];
  for (let i = 0; i < paginatedBooks.length; i += chunkSize) {
    shelves.push(paginatedBooks.slice(i, i + chunkSize));
  }

  // Shelf CSS class based on style
  const shelfClassMap: Record<ShelfStyle, string> = {
    'wood-gothic': 'shelf-wood-gothic',
    'wood-oak': 'shelf-wood-oak',
    'digital-neon': 'shelf-digital-neon',
    'digital-cyber': 'shelf-digital-cyber',
    'minimal-oled': 'shelf-minimal-oled'
  };

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto w-full flex-1 flex flex-col select-none">
      {/* Barra de acción flotante cuando hay libros marcados para eliminar */}
      {markedForDeleteIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 sm:gap-3.5 bg-[#1a0a10]/95 border-2 border-rose-500/80 px-4 py-2.5 sm:px-6 sm:py-3 rounded-2xl shadow-[0_10px_35px_rgba(244,63,94,0.5)] backdrop-blur-md animate-popIn">
          <div className="flex items-center gap-1.5 text-rose-200 text-xs sm:text-sm font-cute font-medium">
            <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              {markedForDeleteIds.length} {markedForDeleteIds.length === 1 ? 'libro marcado para eliminar' : 'libros marcados para eliminar'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleDeleteMarkedBooks}
            className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Eliminar {markedForDeleteIds.length === 1 ? 'libro' : `(${markedForDeleteIds.length})`}</span>
          </button>

          <button
            type="button"
            onClick={handleClearMarked}
            className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-black/60 hover:bg-white/10 text-gray-300 hover:text-white text-xs border border-white/20 transition active:scale-95 cursor-pointer"
            title="Desmarcar todos y cancelar (o pulsa Escape)"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Main Controls Box */}
      <div className="flex flex-col gap-3.5 mb-6 bg-[var(--card-bg)] p-3.5 sm:p-5 rounded-3xl border border-[var(--border-color)] shadow-xl transition-colors">
        
        {/* Top Controls Row: Category Filter Pills + Capacity Counter */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center space-x-1.5 shrink-0">
            <button
              onClick={() => { setActiveCategory('all'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1 shrink-0 ${
                activeCategory === 'all'
                  ? 'bg-[var(--accent-pink)] text-black shadow-md'
                  : 'bg-black/40 text-[var(--text-muted)] hover:text-white hover:bg-black/60'
              }`}
            >
              <span>Todos</span>
              <span className="text-[10px] opacity-80">({totalBooks})</span>
            </button>

            <button
              onClick={() => { setActiveCategory('reading'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1 shrink-0 ${
                activeCategory === 'reading'
                  ? 'bg-[var(--accent-pink)] text-black shadow-md'
                  : 'bg-black/40 text-[var(--text-muted)] hover:text-white hover:bg-black/60'
              }`}
            >
              <span>Leyendo</span>
              <span className="text-[10px] opacity-80">({readingCount})</span>
            </button>

            <button
              onClick={() => { setActiveCategory('unread'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1 shrink-0 ${
                activeCategory === 'unread'
                  ? 'bg-[var(--accent-pink)] text-black shadow-md'
                  : 'bg-black/40 text-[var(--text-muted)] hover:text-white hover:bg-black/60'
              }`}
            >
              <span>Por Leer</span>
              <span className="text-[10px] opacity-80">({unreadCount})</span>
            </button>

            <button
              onClick={() => { setActiveCategory('completed'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1 shrink-0 ${
                activeCategory === 'completed'
                  ? 'bg-emerald-500 text-black shadow-md'
                  : 'bg-black/40 text-[var(--text-muted)] hover:text-white hover:bg-black/60'
              }`}
            >
              <span>Completados</span>
              <span className="text-[10px] opacity-80">({completedCount})</span>
            </button>

            <button
              onClick={() => { setActiveCategory('abandoned'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1 shrink-0 ${
                activeCategory === 'abandoned'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'bg-black/40 text-[var(--text-muted)] hover:text-white hover:bg-black/60'
              }`}
            >
              <span>🥀 Pausados</span>
              <span className="text-[10px] opacity-80">({abandonedCount})</span>
            </button>

            <button
              onClick={() => { setActiveCategory('favorites'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1 shrink-0 ${
                activeCategory === 'favorites'
                  ? 'bg-[var(--accent-pink)] text-black shadow-md'
                  : 'bg-black/40 text-[var(--text-muted)] hover:text-white hover:bg-black/60'
              }`}
            >
              <span>🖤 Favoritos</span>
              <span className="text-[10px] opacity-80">({favoritesCount})</span>
            </button>
          </div>

          {/* Capacity for 2000 Books Badge */}
          <div className="flex items-center gap-1.5 text-[11px] font-mono px-3 py-1 rounded-full bg-purple-950/40 border border-purple-500/30 text-purple-200 shrink-0 shadow-sm" title="Capacidad de almacenamiento interno para hasta 2000 libros">
            <HardDrive className="w-3.5 h-3.5 text-purple-400" />
            <span>{totalBooks} / 2000 Libros</span>
          </div>
        </div>

        {/* INTEGRATED ACTION ROW: Search Bar + Header Operational Buttons placed right beside it */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-white/10">
          
          {/* 1. Buscador del Libro */}
          <div className="relative flex-1 min-w-[210px] sm:max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--accent-purple)]/60" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscador de libro: título o autor..."
              className="w-full bg-black/50 border border-[var(--border-color)] rounded-xl pl-8 pr-8 py-2 text-xs text-white placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-pink)] transition shadow-inner font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] hover:text-white p-0.5"
              >
                ✕
              </button>
            )}
          </div>

          {/* 2. Botones del Header reubicados abajo junto al buscador */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            
            {/* Notas y Citas */}
            {(!headerConfig || headerConfig.showQuotes) && onSwitchView && (
              <button
                onClick={() => onSwitchView('quotes')}
                className="px-2.5 py-1.5 rounded-xl bg-black/40 border border-[var(--border-color)] hover:border-[var(--accent-pink)] text-xs text-[var(--text-main)] hover:text-white flex items-center gap-1.5 transition active:scale-95 shrink-0 shadow-sm"
                title="Ver Baúl de Citas y Notas"
              >
                <QuoteIcon className="w-3.5 h-3.5 text-[var(--accent-pink)]" />
                <span className="hidden md:inline font-cute">Notas</span>
                {quotesCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-[var(--accent-pink)] text-black">
                    {quotesCount}
                  </span>
                )}
              </button>
            )}

            {/* Estadísticas */}
            {(!headerConfig || headerConfig.showStats) && onSwitchView && (
              <button
                onClick={() => onSwitchView('stats')}
                className="px-2.5 py-1.5 rounded-xl bg-black/40 border border-[var(--border-color)] hover:border-[var(--accent-purple)] text-xs text-[var(--text-main)] hover:text-white flex items-center gap-1.5 transition active:scale-95 shrink-0 shadow-sm"
                title="Ver Gráficos y Estadísticas de Lectura"
              >
                <BarChart3 className="w-3.5 h-3.5 text-[var(--accent-purple)]" />
                <span className="hidden md:inline font-cute">Gráficos</span>
              </button>
            )}

            {/* Marcadores */}
            {(!headerConfig || headerConfig.showBookmarks) && onSwitchView && (
              <button
                onClick={() => onSwitchView('bookmarks')}
                className="px-2.5 py-1.5 rounded-xl bg-black/40 border border-[var(--border-color)] hover:border-amber-400 text-xs text-[var(--text-main)] hover:text-white flex items-center gap-1.5 transition active:scale-95 shrink-0 shadow-sm"
                title="Ver Marcadores Guardados"
              >
                <BookmarkIcon className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden lg:inline font-cute">Marcadores</span>
                {bookmarksCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-amber-400 text-black">
                    {bookmarksCount}
                  </span>
                )}
              </button>
            )}

            {/* Modo Noche Rápido (OLED) */}
            {(!headerConfig || headerConfig.showNightMode) && onToggleNightMode && (
              <button
                onClick={onToggleNightMode}
                className={`px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-1 border transition active:scale-95 shrink-0 shadow-sm ${
                  isNightMode
                    ? 'bg-white text-black border-white font-bold shadow-[0_0_12px_rgba(255,255,255,0.4)]'
                    : 'bg-black/40 text-[var(--text-muted)] border-[var(--border-color)] hover:text-white hover:border-white'
                }`}
                title={isNightMode ? 'Modo Noche Activado' : 'Activar Modo Noche OLED'}
              >
                {isNightMode ? <Sun className="w-3.5 h-3.5 text-black" /> : <Moon className="w-3.5 h-3.5 text-gray-300" />}
                <span className="hidden sm:inline font-cute">{isNightMode ? 'Día' : 'Noche'}</span>
              </button>
            )}

            {/* Coronita VIP ($2 USD/mes) */}
            <button
              onClick={() => onOpenVipModal?.()}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-cute font-bold flex items-center gap-1 transition active:scale-95 shrink-0 shadow-sm ${
                isVip
                  ? 'bg-amber-400 text-black border-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.6)]'
                  : 'bg-black/50 border-amber-400/60 text-amber-300 hover:bg-amber-400 hover:text-black hover:border-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.2)]'
              }`}
              title={isVip ? 'Membresía VIP Activa 👑' : 'Acceso VIP ($2 USD/mes) • Solo PayPal 👑'}
            >
              <Crown className={`w-3.5 h-3.5 ${isVip ? 'fill-black' : 'text-amber-400'}`} />
              <span>{isVip ? 'VIP' : 'VIP'}</span>
            </button>

            {/* Música Lo-Fi / Subir Canciones */}
            {(!headerConfig || headerConfig.showAudio) && onOpenAudioModal && (
              <button
                onClick={() => {
                  if (!isVip && onOpenVipModal) {
                    onOpenVipModal();
                  } else {
                    onOpenAudioModal();
                  }
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-1 border transition active:scale-95 shrink-0 shadow-sm ${
                  isAudioPlaying
                    ? 'bg-[var(--accent-purple)]/25 text-[var(--accent-purple)] border-[var(--accent-purple)] animate-pulse'
                    : 'bg-black/40 text-[var(--text-muted)] border-[var(--border-color)] hover:text-white hover:border-[var(--accent-purple)]'
                }`}
                title={isVip ? 'Reproductor de Música: Escuchar de fondo' : 'Música VIP ($2/mes)'}
              >
                {isAudioPlaying ? <Volume2 className="w-3.5 h-3.5 text-[var(--accent-purple)]" /> : <Music className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline font-cute">Música</span>
                {!isVip && <span className="text-[10px] text-amber-300">👑</span>}
              </button>
            )}

            {/* Temas Visuales */}
            {(!headerConfig || headerConfig.showTheme) && onOpenThemeModal && (
              <button
                onClick={onOpenThemeModal}
                className="p-1.5 sm:px-2.5 sm:py-1.5 bg-black/40 border border-[var(--border-color)] hover:border-[var(--accent-pink)] rounded-xl text-xs text-[var(--accent-pink)] font-cute flex items-center gap-1 transition shrink-0 shadow-sm"
                title="Cambiar Paleta de Temas"
              >
                <Palette className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Temas</span>
              </button>
            )}

            {/* Subir Archivo Individual */}
            <button
              onClick={onTriggerUpload}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[var(--accent-pink)]/20 text-[var(--accent-pink)] border border-[var(--accent-pink)]/50 hover:bg-[var(--accent-pink)] hover:text-black transition flex items-center gap-1 shadow-sm active:scale-95 shrink-0"
              title="Subir libro individual (EPUB, PDF, TXT)"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Subir</span>
            </button>

            {/* Sincronizar Almacenamiento Interno (Hasta 2000 Libros) */}
            {onSyncFolder && (
              <button
                onClick={onSyncFolder}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600/30 to-pink-600/30 text-purple-200 border border-purple-400/50 hover:bg-purple-600 hover:text-white transition flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0"
                title="Sincronizar carpeta con tu almacenamiento interno para colocar hasta 2000 libros automáticamente"
              >
                <FolderSync className="w-3.5 h-3.5 text-purple-300" />
                <span className="hidden sm:inline">Sincronizar Carpeta</span>
              </button>
            )}

            {/* Indicador / Desmarcar si hay libros marcados para eliminar */}
            {markedForDeleteIds.length > 0 && (
              <button
                onClick={handleClearMarked}
                className="px-2.5 py-1.5 rounded-xl border text-xs font-cute flex items-center gap-1 transition shrink-0 shadow-sm bg-rose-600/30 text-rose-300 border-rose-500/60 hover:bg-rose-600 hover:text-white active:scale-95 cursor-pointer"
                title="Desmarcar todos los libros seleccionados para eliminar (o pulsa Escape)"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="font-bold">{markedForDeleteIds.length} Marcado{markedForDeleteIds.length === 1 ? '' : 's'} (✕)</span>
              </button>
            )}

            {/* Configuración (Tres Puntos) */}
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="p-1.5 bg-black/40 border border-[var(--border-color)] hover:border-[var(--accent-pink)] rounded-xl text-xs text-[var(--accent-pink)] flex items-center justify-center transition shrink-0 hover:bg-[var(--accent-pink)]/10"
                title="Configuración de lectura, tipografía y márgenes (Tres puntos)"
                aria-label="Abrir panel de configuraciones"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Third Row: View Modes, Shelf Style and Sorting */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5 text-xs">
          <div className="flex items-center gap-2">
            {/* 3 View Modes */}
            <div className="flex items-center bg-black/40 border border-[var(--border-color)] rounded-xl p-0.5">
              <button
                onClick={() => handleSetViewMode('covers')}
                className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                  viewMode === 'covers'
                    ? 'bg-[var(--accent-pink)] text-black shadow-sm font-bold'
                    : 'text-[var(--text-muted)] hover:text-white'
                }`}
                title="Vista de portadas frontales"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Portadas</span>
              </button>

              <button
                onClick={() => handleSetViewMode('spines')}
                className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                  viewMode === 'spines'
                    ? 'bg-[var(--accent-pink)] text-black shadow-sm font-bold'
                    : 'text-[var(--text-muted)] hover:text-white'
                }`}
                title="Vista de lomos verticales"
              >
                <Library className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Lomos</span>
              </button>

              <button
                onClick={() => handleSetViewMode('stacks')}
                className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                  viewMode === 'stacks'
                    ? 'bg-[var(--accent-pink)] text-black shadow-sm font-bold'
                    : 'text-[var(--text-muted)] hover:text-white'
                }`}
                title="Vista de libros apilados"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Acostados</span>
              </button>
            </div>

            {/* Custom Shelf Style Selector */}
            <div className="flex items-center gap-1 bg-black/40 border border-[var(--border-color)] rounded-xl px-2 py-1 text-xs text-[var(--text-main)]">
              <Palette className="w-3 h-3 text-[var(--accent-pink)]" />
              <select
                value={shelfStyle}
                onChange={(e) => handleSetShelfStyle(e.target.value as ShelfStyle)}
                aria-label="Personalizar estilo de estantería"
                className="bg-transparent text-[11px] focus:outline-none cursor-pointer text-[var(--text-main)]"
              >
                <option value="wood-gothic" className="bg-[#1a1726]">🪵 Madera Caoba</option>
                <option value="wood-oak" className="bg-[#1a1726]">🌲 Roble Ébano</option>
                <option value="digital-neon" className="bg-[#1a1726]">⚡ Digital Neón</option>
                <option value="digital-cyber" className="bg-[#1a1726]">🔮 Cyber Grid</option>
                <option value="minimal-oled" className="bg-[#1a1726]">🖤 Minimal OLED</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1 bg-black/40 border border-[var(--border-color)] rounded-xl px-2 py-1 text-xs text-[var(--text-main)] shadow-sm">
              <SlidersHorizontal className="w-3 h-3 text-[var(--accent-pink)]" />
              <select
                value={sortBy}
                onChange={(e) => handleSetSortBy(e.target.value as any)}
                aria-label="Ordenar libros por"
                className="bg-transparent text-[11px] focus:outline-none cursor-pointer text-[var(--text-main)] font-medium"
              >
                <option value="custom" className="bg-[#1a1726]">✨ Mi Orden (Como gustes)</option>
                <option value="recent" className="bg-[#1a1726]">🕒 Recientes / Última lectura</option>
                <option value="title-asc" className="bg-[#1a1726]">🔤 Título (A → Z)</option>
                <option value="title-desc" className="bg-[#1a1726]">🔤 Título (Z → A)</option>
                <option value="author-asc" className="bg-[#1a1726]">✍️ Autor (A → Z)</option>
                <option value="progress-desc" className="bg-[#1a1726]">📊 Mayor Progreso (% leído)</option>
                <option value="progress-asc" className="bg-[#1a1726]">📖 Menor Progreso</option>
                <option value="favorites" className="bg-[#1a1726]">🖤 Favoritos Primero</option>
                <option value="newest" className="bg-[#1a1726]">🆕 Recién Añadidos</option>
                <option value="oldest" className="bg-[#1a1726]">⏳ Más Antiguos</option>
              </select>
            </div>

            {/* Custom Background Photo / Texture Button */}
            <button
              onClick={() => setIsBgModalOpen(true)}
              className="px-2 py-1 bg-black/40 border border-[var(--border-color)] hover:border-[var(--accent-pink)] rounded-xl text-xs text-[var(--accent-pink)] font-semibold flex items-center gap-1 transition shrink-0 hover:bg-[var(--accent-pink)]/10"
              title="Personalizar fondo con tus fotos o texturas"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Foto Fondo</span>
              {shelfBgConfig?.customImage && (
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-pink)] animate-pulse" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Bookshelf Display with Conventional Shelf Wood/Digital Texture */}
      {sortedBooks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center bg-[var(--card-bg)]/40 border border-[var(--border-color)] rounded-3xl p-6">
          <span className="text-6xl mb-4 block animate-bounce">📚</span>
          <h3 className="dark-reborn-font text-lg font-bold text-white mb-1">
            {searchQuery ? 'No se encontraron libros' : 'Tu Estantería está lista'}
          </h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mb-4">
            {searchQuery
              ? `No hay tomos que coincidan con "${searchQuery}".`
              : 'Sube tus libros en formato EPUB, PDF o sincroniza tu carpeta con almacenamiento interno para colocar hasta 2000 libros automáticamente.'}
          </p>
          <div className="flex flex-wrap gap-2.5 justify-center">
            {onSyncFolder && (
              <button
                onClick={onSyncFolder}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 text-white shadow-md hover:bg-purple-700 transition flex items-center gap-1.5 active:scale-95"
              >
                <FolderSync className="w-4 h-4" />
                <span>Sincronizar Carpeta de Libros</span>
              </button>
            )}
            <button
              onClick={onTriggerUpload}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--accent-pink)] text-black shadow-md hover:opacity-90 transition flex items-center gap-1.5 active:scale-95"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Subir Archivo Local</span>
            </button>
            <button
              onClick={onRestoreDefaults}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-black/60 border border-[var(--border-color)] hover:border-white text-[var(--text-muted)] hover:text-white transition flex items-center gap-1.5"
            >
              <span>Restaurar Clásicos Neko</span>
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`flex-1 flex flex-col rounded-3xl p-3 sm:p-6 border border-[var(--border-color)] relative transition-all duration-300 shadow-2xl ${
            shelfClassMap[shelfStyle]
          }`}
        >
          {/* Custom user background image if configured */}
          {shelfBgConfig?.customImage && (
            <>
              <div
                className="absolute inset-0 rounded-3xl bg-center pointer-events-none transition-all duration-300 overflow-hidden"
                style={{
                  backgroundImage: `url(${shelfBgConfig.customImage})`,
                  backgroundSize: shelfBgConfig.fit === 'pattern' ? 'auto' : 'cover',
                  backgroundRepeat: shelfBgConfig.fit === 'pattern' ? 'repeat' : 'no-repeat',
                  filter: `blur(${shelfBgConfig.blur ?? 0}px)`
                }}
              />
              <div
                className="absolute inset-0 rounded-3xl bg-black pointer-events-none transition-opacity duration-300"
                style={{ opacity: (shelfBgConfig.overlayDarkness ?? 65) / 100 }}
              />
            </>
          )}

          {/* Top Library Shelf Header */}
          <div className="relative z-10 px-1 py-1 flex items-center justify-between border-b border-[var(--border-color)] pb-3 text-xs text-[var(--text-muted)]">
            <span className="font-bold flex items-center gap-2 text-[var(--accent-pink)]">
              <span>📚</span>
              <span>MI ESTANTERÍA</span>
              {markedForDeleteIds.length > 0 && (
                <span className="text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">
                  {markedForDeleteIds.length} marcado{markedForDeleteIds.length === 1 ? '' : 's'} para eliminar
                </span>
              )}
            </span>
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setIsBgModalOpen(true)}
                className="text-[11px] text-[var(--accent-pink)] hover:text-white flex items-center gap-1.5 transition px-2.5 py-1 rounded-lg bg-black/50 border border-[var(--border-color)] hover:border-[var(--accent-pink)] shadow-sm"
                title="Cambiar foto de fondo o textura"
              >
                <ImageIcon className="w-3 h-3 text-[var(--accent-pink)]" />
                <span>{shelfBgConfig?.customImage ? 'Fondo Personalizado' : 'Personalizar Fondo'}</span>
              </button>
              <span className="text-[11px] font-mono text-[var(--text-muted)]">
                {totalBooks} {totalBooks === 1 ? 'TOMO' : 'TOMOS'}
              </span>
            </div>
          </div>

          {/* Shelves rows */}
          <div className="space-y-8 relative z-10 mt-4">
            {shelves.map((shelfBooks, shelfIndex) => (
              <div key={shelfIndex} className="conventional-shelf-row">
                
                {/* MODE 1: COVERS VIEW (Portadas frontales) */}
                {viewMode === 'covers' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6 px-2 sm:px-4 pb-1 items-end">
                    {shelfBooks.map((book) => {
                      const percent = book.progressPercent || 0;
                      const isMarked = isBookMarked(book.id);
                      const isTouchingCurrent = touchActiveBookId === book.id;
                      const isDraggingCurrent = draggedBookId === book.id || isTouchingCurrent;
                      const isDropTarget = (dragOverBookId === book.id || touchOverBookId === book.id) && !isDraggingCurrent;

                      return (
                        <div
                          key={book.id}
                          data-book-id={book.id}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, book.id)}
                          onDragOver={(e) => handleDragOver(e, book.id)}
                          onDragLeave={(e) => handleDragLeave(e, book.id)}
                          onDrop={(e) => handleDrop(e, book.id)}
                          onDragEnd={handleDragEnd}
                          onTouchStart={(e) => handleBookTouchStart(book.id, e)}
                          onTouchMove={(e) => handleBookTouchMove(book.id, e)}
                          onTouchEnd={() => handleBookTouchEnd(book.id)}
                          onTouchCancel={handleBookTouchCancel}
                          onMouseDown={() => handlePressStart(book.id)}
                          onMouseUp={handlePressEnd}
                          onMouseLeave={handlePressEnd}
                          onClick={() => {
                            if (suppressClickRef.current) return;
                            if (markedForDeleteIds.length > 0) {
                              toggleMarkForDelete(book.id);
                            } else if (!isTouchDragging.current) {
                              onOpenBook(book);
                            }
                          }}
                          style={{
                            touchAction: 'pan-y',
                            transform: isTouchingCurrent 
                              ? `translate3d(${touchOffset.x}px, ${touchOffset.y}px, 0)` 
                              : undefined,
                            zIndex: isTouchingCurrent ? 60 : undefined,
                            pointerEvents: isTouchingCurrent ? 'none' : 'auto'
                          }}
                          className={`group cursor-grab active:cursor-grabbing flex flex-col items-center transition-all duration-200 relative select-none ${
                            isTouchingCurrent 
                              ? 'scale-105 shadow-[0_20px_45px_rgba(255,121,198,0.7)] ring-2 ring-[var(--accent-pink)] transition-none' 
                              : ''
                          } ${
                            draggedBookId === book.id ? 'opacity-40 scale-95' : ''
                          } ${
                            isDropTarget ? 'ring-4 ring-[var(--accent-pink)] scale-105 shadow-[0_0_25px_rgba(255,121,198,0.8)] z-30 rounded-xl' : ''
                          } ${
                            isMarked
                              ? 'ring-4 ring-rose-500 rounded-xl scale-[1.03] shadow-[0_0_25px_rgba(244,63,94,0.6)] z-20'
                              : 'hover:-translate-y-1.5'
                          }`}
                          title={isMarked ? 'Marcado para eliminar (clic para desmarcar)' : 'Mantén presionado para marcar y eliminar, o desliza para mover'}
                        >
                          {/* Drop Target Indicator when dragging or sliding with finger */}
                          {isDropTarget && (
                            <div className="absolute inset-0 z-50 bg-[var(--accent-pink)]/20 backdrop-blur-xs rounded-xl flex items-center justify-center pointer-events-none border-2 border-[var(--accent-pink)]">
                              <span className="text-[10px] font-bold text-white bg-black/90 px-2.5 py-1 rounded-full shadow-lg border border-[var(--accent-pink)] animate-bounce">
                                ✨ Soltar aquí
                              </span>
                            </div>
                          )}

                          {/* Delete Badge when marked for deletion */}
                          {isMarked && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteBook(book.id, e);
                                setMarkedForDeleteIds((prev) => prev.filter((id) => id !== book.id));
                              }}
                              className="absolute -top-2.5 -left-2.5 z-50 w-7 h-7 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs flex items-center justify-center shadow-[0_2px_10px_rgba(220,38,38,0.7)] transition active:scale-90 border-2 border-white cursor-pointer animate-popIn"
                              title="Eliminar este libro de la estantería ahora"
                            >
                              ✕
                            </button>
                          )}

                          {/* Conventional Book Cover Container */}
                          <div className={`relative w-full max-w-[190px] aspect-[2/3] rounded-r-lg rounded-l-sm shadow-md overflow-hidden border border-white/10 group-hover:border-[var(--accent-pink)]/50 group-hover:shadow-[0_10px_25px_rgba(0,0,0,0.5)] transition-all flex flex-col justify-between p-3.5 text-left book-cover-shadow ${
                            isMarked ? 'border-rose-500' : ''
                          }`}>
                            {/* Marked badge inside top right */}
                            {isMarked && (
                              <div className="absolute top-2 right-2 z-30 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md border border-white flex items-center gap-1 animate-fadeIn">
                                <Trash2 className="w-3 h-3" />
                                <span>Eliminar</span>
                              </div>
                            )}
                            {/* Background cover gradient */}
                            <div
                              className="absolute inset-0 opacity-95 group-hover:scale-105 transition-transform duration-300"
                              style={{
                                background:
                                  book.coverGradient ||
                                  'linear-gradient(135deg, #1f1a2e 0%, #100d18 100%)'
                              }}
                            />

                            {/* Subtle Spine Ledge line */}
                            <div className="absolute top-0 left-0 bottom-0 w-2.5 bg-black/40 pointer-events-none" />
                            <div className="absolute top-0 left-2.5 bottom-0 w-px bg-white/10 pointer-events-none" />

                            {/* Bookmark Ribbon on top */}
                            <div className="absolute -top-1 right-3 z-10 w-4 h-9 bg-gradient-to-b from-pink-500 to-rose-600 shadow-md [clip-path:polygon(0_0,100%_0,100%_100%,50%_75%,0_100%)] opacity-90 group-hover:h-10 transition-all" />

                            {/* Top Card Bar */}
                            <div className="relative z-10 flex items-center justify-between">
                              <button
                                onClick={(e) => onToggleFavorite(book.id, e)}
                                className="p-1.5 rounded-full bg-black/50 backdrop-blur-md text-white/70 hover:text-[var(--accent-pink)] transition"
                                title={book.favorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                              >
                                <Heart
                                  className={`w-3.5 h-3.5 ${
                                    book.favorite
                                      ? 'fill-[var(--accent-pink)] text-[var(--accent-pink)]'
                                      : ''
                                  }`}
                                />
                              </button>

                              <span className="text-[10px] font-mono uppercase bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full text-[var(--accent-purple)] border border-white/5">
                                {book.type === 'epub'
                                  ? 'EPUB'
                                  : book.type === 'pdf'
                                  ? 'PDF'
                                  : 'NEKO'}
                              </span>
                            </div>

                            {/* Center Cover Graphic */}
                            <div className="relative z-10 text-center my-auto py-2">
                              <span className="text-4xl sm:text-5xl filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] transform group-hover:scale-105 transition-transform block">
                                {book.emoji}
                              </span>
                              <h4 className="dark-reborn-font font-bold text-xs sm:text-sm text-white line-clamp-2 mt-2 px-1 group-hover:text-[var(--accent-pink)] transition">
                                {book.title}
                              </h4>
                              <p className="text-[10px] text-[var(--text-muted)] line-clamp-1 mt-0.5">
                                {book.author}
                              </p>
                            </div>

                            {/* Bottom: Reading Progress Indicator */}
                            <div className="relative z-10">
                              <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)] mb-1">
                                <span>{percent}%</span>
                                <span>Pág. {book.currentPage || 1}</span>
                              </div>
                              <div className="w-full bg-black/60 h-1.5 rounded-full overflow-hidden border border-white/5">
                                <div
                                  className="h-full bg-gradient-to-r from-[var(--accent-pink)] to-[var(--accent-purple)] transition-all duration-300"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Quick Action Overlay (Categories & Delete) */}
                          <div className="flex items-center space-x-1 mt-2.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            <button
                              onClick={(e) =>
                                onChangeCategory(
                                  book.id,
                                  book.category === 'completed' ? 'reading' : 'completed',
                                  e
                                )
                              }
                              className="p-1 rounded-lg bg-black/60 hover:bg-black/90 text-xs text-[var(--accent-purple)] transition border border-[var(--border-color)]"
                              title={
                                book.category === 'completed'
                                  ? 'Marcar como en lectura'
                                  : 'Marcar como leído'
                              }
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={(e) =>
                                onChangeCategory(
                                  book.id,
                                  book.category === 'abandoned' ? 'reading' : 'abandoned',
                                  e
                                )
                              }
                              className="p-1 rounded-lg bg-black/60 hover:bg-black/90 text-xs text-rose-300 transition border border-[var(--border-color)]"
                              title={
                                book.category === 'abandoned'
                                  ? 'Reanudar lectura'
                                  : 'Marcar como pausado'
                              }
                            >
                              🥀
                            </button>

                            <button
                              onClick={(e) => onDeleteBook(book.id, e)}
                              className="p-1 rounded-lg bg-black/60 hover:bg-red-950 text-xs text-red-400 transition border border-[var(--border-color)]"
                              title="Eliminar libro"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* MODE 2: SPINES VIEW (Lomos verticales alineados en estantería) */}
                {viewMode === 'spines' && (
                  <div className="flex items-end justify-center gap-2 sm:gap-3 px-4 pb-2 overflow-x-auto min-h-[260px]">
                    {shelfBooks.map((book) => {
                      const isMarked = isBookMarked(book.id);
                      const isTouchingCurrent = touchActiveBookId === book.id;
                      const isDraggingCurrent = draggedBookId === book.id || isTouchingCurrent;
                      const isDropTarget = (dragOverBookId === book.id || touchOverBookId === book.id) && !isDraggingCurrent;

                      return (
                        <div
                          key={book.id}
                          data-book-id={book.id}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, book.id)}
                          onDragOver={(e) => handleDragOver(e, book.id)}
                          onDragLeave={(e) => handleDragLeave(e, book.id)}
                          onDrop={(e) => handleDrop(e, book.id)}
                          onDragEnd={handleDragEnd}
                          onTouchStart={(e) => handleBookTouchStart(book.id, e)}
                          onTouchMove={(e) => handleBookTouchMove(book.id, e)}
                          onTouchEnd={() => handleBookTouchEnd(book.id)}
                          onTouchCancel={handleBookTouchCancel}
                          onMouseDown={() => handlePressStart(book.id)}
                          onMouseUp={handlePressEnd}
                          onMouseLeave={handlePressEnd}
                          onClick={() => {
                            if (suppressClickRef.current) return;
                            if (markedForDeleteIds.length > 0) {
                              toggleMarkForDelete(book.id);
                            } else if (!isTouchDragging.current) {
                              onOpenBook(book);
                            }
                          }}
                          style={{
                            background:
                              book.coverGradient ||
                              'linear-gradient(180deg, #2b112c 0%, #100b19 100%)',
                            width: '46px',
                            height: '240px',
                            boxShadow: '3px 0 10px rgba(0,0,0,0.5)',
                            touchAction: 'pan-y',
                            transform: isTouchingCurrent 
                              ? `translate3d(${touchOffset.x}px, ${touchOffset.y}px, 0)` 
                              : undefined,
                            zIndex: isTouchingCurrent ? 60 : undefined,
                            pointerEvents: isTouchingCurrent ? 'none' : 'auto'
                          }}
                          className={`relative group cursor-grab active:cursor-grabbing flex flex-col justify-between p-2 rounded-t-md transition-all duration-200 border-x border-t border-white/10 select-none ${
                            isTouchingCurrent 
                              ? 'scale-105 shadow-[0_20px_45px_rgba(255,121,198,0.7)] ring-2 ring-[var(--accent-pink)] transition-none' 
                              : ''
                          } ${
                            draggedBookId === book.id ? 'opacity-40 scale-95' : ''
                          } ${
                            isDropTarget ? 'ring-4 ring-[var(--accent-pink)] scale-105 shadow-[0_0_20px_rgba(255,121,198,0.8)] z-30' : ''
                          } ${
                            isMarked
                              ? 'ring-4 ring-rose-500 rounded-t-md scale-105 shadow-[0_0_25px_rgba(244,63,94,0.7)] z-20'
                              : 'hover:-translate-y-2'
                          }`}
                          title={`${book.title} - ${book.author} (${isMarked ? 'Marcado para eliminar' : 'Mantén presionado para marcar y eliminar, o desliza para mover'})`}
                        >
                          {/* Drop target indicator */}
                          {isDropTarget && (
                            <div className="absolute inset-0 z-40 bg-[var(--accent-pink)]/20 rounded-t-md flex items-center justify-center pointer-events-none border border-[var(--accent-pink)]">
                              <span className="text-[8px] font-bold text-white bg-black/90 px-1 py-0.5 rounded shadow">
                                ✨
                              </span>
                            </div>
                          )}

                          {isMarked && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteBook(book.id, e);
                                setMarkedForDeleteIds((prev) => prev.filter((id) => id !== book.id));
                              }}
                              className="absolute -top-2.5 -left-2.5 z-50 w-5 h-5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] flex items-center justify-center shadow-md border border-white cursor-pointer active:scale-90 animate-popIn"
                              title="Eliminar de la estantería ahora"
                            >
                              ✕
                            </button>
                          )}
                          <span className="text-sm block text-center">{book.emoji}</span>
                          <span
                            className="font-cute font-bold text-[11px] text-white tracking-wider whitespace-nowrap overflow-hidden text-ellipsis block text-center"
                            style={{
                              writingMode: 'vertical-rl',
                              transform: 'rotate(180deg)'
                            }}
                          >
                            {book.title}
                          </span>
                          <span className="text-[9px] font-mono text-[var(--accent-pink)] block text-center">
                            {book.progressPercent || 0}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* MODE 3: STACKS VIEW (Libros acostados / apilados horizontalmente) */}
                {viewMode === 'stacks' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 px-4 pb-2 items-end">
                    {shelfBooks.map((book) => {
                      const isMarked = isBookMarked(book.id);
                      const isTouchingCurrent = touchActiveBookId === book.id;
                      const isDraggingCurrent = draggedBookId === book.id || isTouchingCurrent;
                      const isDropTarget = (dragOverBookId === book.id || touchOverBookId === book.id) && !isDraggingCurrent;

                      return (
                        <div
                          key={book.id}
                          data-book-id={book.id}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, book.id)}
                          onDragOver={(e) => handleDragOver(e, book.id)}
                          onDragLeave={(e) => handleDragLeave(e, book.id)}
                          onDrop={(e) => handleDrop(e, book.id)}
                          onDragEnd={handleDragEnd}
                          onTouchStart={(e) => handleBookTouchStart(book.id, e)}
                          onTouchMove={(e) => handleBookTouchMove(book.id, e)}
                          onTouchEnd={() => handleBookTouchEnd(book.id)}
                          onTouchCancel={handleBookTouchCancel}
                          onMouseDown={() => handlePressStart(book.id)}
                          onMouseUp={handlePressEnd}
                          onMouseLeave={handlePressEnd}
                          onClick={() => {
                            if (suppressClickRef.current) return;
                            if (markedForDeleteIds.length > 0) {
                              toggleMarkForDelete(book.id);
                            } else if (!isTouchDragging.current) {
                              onOpenBook(book);
                            }
                          }}
                          style={{
                            background:
                              book.coverGradient ||
                              'linear-gradient(90deg, #2b112c 0%, #100b19 100%)',
                            touchAction: 'pan-y',
                            transform: isTouchingCurrent 
                              ? `translate3d(${touchOffset.x}px, ${touchOffset.y}px, 0)` 
                              : undefined,
                            zIndex: isTouchingCurrent ? 60 : undefined,
                            pointerEvents: isTouchingCurrent ? 'none' : 'auto'
                          }}
                          className={`relative group cursor-grab active:cursor-grabbing p-3 rounded-xl border border-white/10 transition-all duration-200 flex items-center justify-between shadow-md select-none ${
                            isTouchingCurrent 
                              ? 'scale-105 shadow-[0_20px_45px_rgba(255,121,198,0.7)] ring-2 ring-[var(--accent-pink)] transition-none' 
                              : ''
                          } ${
                            draggedBookId === book.id ? 'opacity-40 scale-95' : ''
                          } ${
                            isDropTarget ? 'ring-4 ring-[var(--accent-pink)] scale-105 shadow-[0_0_20px_rgba(255,121,198,0.8)] z-30' : ''
                          } ${
                            isMarked
                              ? 'ring-4 ring-rose-500 rounded-xl scale-[1.02] shadow-[0_0_20px_rgba(244,63,94,0.7)] z-20'
                              : 'hover:-translate-y-1'
                          }`}
                          title={isMarked ? 'Marcado para eliminar (clic para desmarcar)' : 'Mantén presionado para marcar y eliminar, o desliza para mover'}
                        >
                          {/* Drop target indicator */}
                          {isDropTarget && (
                            <div className="absolute inset-0 z-40 bg-[var(--accent-pink)]/20 backdrop-blur-xs rounded-xl flex items-center justify-center pointer-events-none border border-[var(--accent-pink)]">
                              <span className="text-[10px] font-bold text-white bg-black/90 px-2 py-0.5 rounded-full shadow">
                                ✨ Soltar aquí
                              </span>
                            </div>
                          )}

                          {isMarked && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteBook(book.id, e);
                                setMarkedForDeleteIds((prev) => prev.filter((id) => id !== book.id));
                              }}
                              className="absolute -top-2 -left-2 z-50 w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center shadow border border-white cursor-pointer active:scale-90 animate-popIn"
                              title="Eliminar de la estantería ahora"
                            >
                              ✕
                            </button>
                          )}
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="text-2xl">{book.emoji}</span>
                            <div className="overflow-hidden">
                              <h4 className="text-xs font-bold text-white truncate">{book.title}</h4>
                              <p className="text-[10px] text-[var(--text-muted)] truncate">{book.author}</p>
                            </div>
                          </div>
                          <span className="text-xs font-mono font-bold text-[var(--accent-pink)] shrink-0 ml-2">
                            {book.progressPercent || 0}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* The Physical 3D Shelf Ledge / Plank */}
                <div className="shelf-plank-shadow h-4 sm:h-5 w-full rounded-b-md relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls for Large Libraries (Supports up to 2000 books smoothly) */}
          {totalPages > 1 && (
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-6 mt-4 border-t border-[var(--border-color)] text-xs">
              <div className="text-[11px] text-[var(--text-muted)] font-mono">
                Mostrando {((effectivePage - 1) * pageSize) + 1} - {Math.min(effectivePage * pageSize, sortedBooks.length)} de {sortedBooks.length} tomos
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  disabled={effectivePage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-xl bg-black/50 border border-[var(--border-color)] hover:border-[var(--accent-pink)] text-white text-xs font-cute transition disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Anterior</span>
                </button>

                <div className="px-3 py-1 rounded-xl bg-black/60 border border-white/10 font-mono text-xs text-[var(--accent-pink)] font-bold">
                  Pág. {effectivePage} / {totalPages}
                </div>

                <button
                  disabled={effectivePage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-xl bg-black/50 border border-[var(--border-color)] hover:border-[var(--accent-pink)] text-white text-xs font-cute transition disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1"
                >
                  <span>Siguiente</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                <span>Por página:</span>
                {[24, 48, 96].map((size) => (
                  <button
                    key={size}
                    onClick={() => { setPageSize(size); setCurrentPage(1); }}
                    className={`px-2 py-0.5 rounded-md font-mono text-[10px] ${
                      pageSize === size 
                        ? 'bg-[var(--accent-pink)] text-black font-bold' 
                        : 'bg-black/40 text-white hover:bg-black/60'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Shelf Background Customization Modal */}
      {isBgModalOpen && (
        <ShelfBackgroundModal
          isOpen={isBgModalOpen}
          onClose={() => setIsBgModalOpen(false)}
          config={shelfBgConfig || DEFAULT_SHELF_BG}
          onSaveConfig={(newCfg: ShelfBackgroundConfig) => {
            onUpdateShelfBgConfig?.(newCfg);
            setIsBgModalOpen(false);
          }}
          isVip={isVip}
          onOpenVipModal={onOpenVipModal}
        />
      )}
    </div>
  );
};
