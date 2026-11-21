import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  Settings,
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
  GripVertical,
  X
} from 'lucide-react';
import { Book, BookCategory, ShelfStyle, ShelfViewMode, ShelfBackgroundConfig, ShelfDecorConfig, ShelfDecorPropId, ShelfBookendId } from '../types';
import {
  ShelfDecoration,
  ShelfBookend,
  ShelfAtmosphereBackwall,
  getLedGlowClass,
} from './ShelfDecoration';
import {
  DEFAULT_SHELF_DECOR,
  DARK_BOOKEND_ROTATION,
  SHELF_DECOR_CATALOG,
  SHELF_BOOKEND_CATALOG,
  isShelfPropVip,
  isShelfBookendVip,
} from '../data/shelfDecorCatalog';
import { HeaderButtonsConfig } from './SettingsView';
import { resolveCoverGradient, normalizeBookEmoji } from '../utils/db';
import { sanitizeImageUrl } from '../utils/sanitizeHtml';

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
  shelfDecorConfig?: ShelfDecorConfig;
  onUpdateShelfDecorConfig?: (config: ShelfDecorConfig) => void;
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
  viewMode: propViewMode,
  onViewModeChange,
  shelfBgConfig,
  shelfDecorConfig: propShelfDecorConfig,
  onUpdateShelfDecorConfig,
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

  const rawDecorConfig = propShelfDecorConfig ?? DEFAULT_SHELF_DECOR;
  const effectiveDecorConfig = useMemo<ShelfDecorConfig>(() => {
    if (isVip) return rawDecorConfig;
    const filteredProps = rawDecorConfig.enabledProps.filter((id) => !isShelfPropVip(id));
    const safeBookend =
      rawDecorConfig.bookend && isShelfBookendVip(rawDecorConfig.bookend)
        ? rawDecorConfig.theme === 'dark'
          ? 'gothic-raven-skull'
          : 'readers-silhouette'
        : rawDecorConfig.bookend;
    return {
      ...rawDecorConfig,
      enabledProps: filteredProps,
      bookend: safeBookend,
    };
  }, [rawDecorConfig, isVip]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(24);

  // Modo de eliminación por mantener presionado (Long-Press to Mark for Deletion)
  const [markedForDeleteIds, setMarkedForDeleteIds] = useState<string[]>([]);
  const [selectedDecorSlotId, setSelectedDecorSlotId] = useState<string | null>(null);
  const [brokenCoverIds, setBrokenCoverIds] = useState<Record<string, boolean>>({});
  const [customSlotOrder, setCustomSlotOrder] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('nl_shelf_slot_order_v1');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
    } catch {
      return [];
    }
  });
  const saveCustomSlotOrder = (nextOrder: string[]) => {
    setCustomSlotOrder(nextOrder);
    try {
      localStorage.setItem('nl_shelf_slot_order_v1', JSON.stringify(nextOrder));
    } catch {
      // Ignore storage quota errors
    }
  };
  const [draggedSlotId, setDraggedSlotId] = useState<string | null>(null);
  const [dragOverSlotId, setDragOverSlotId] = useState<string | null>(null);
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
  const [internalShelfStyle] = useState<ShelfStyle>(() => {
    return (localStorage.getItem('nl_shelf_style') as ShelfStyle) || 'wood-gothic';
  });

  const [internalViewMode, setInternalViewMode] = useState<ShelfViewMode>(() => {
    return (localStorage.getItem('nl_shelf_view_mode') as ShelfViewMode) || 'covers';
  });

  const shelfStyle = propShelfStyle ?? internalShelfStyle;
  const viewMode = propViewMode ?? internalViewMode;

  const bookcaseRef = useRef<HTMLDivElement | null>(null);
  const prevShelfStyleRef = useRef<ShelfStyle>(shelfStyle);
  const [isDepthTransitioning, setIsDepthTransitioning] = useState(false);
  const [viewportWidth, setViewportWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Transición de profundidad 3D al cambiar el ShelfStyle
  useEffect(() => {
    if (prevShelfStyleRef.current !== shelfStyle) {
      prevShelfStyleRef.current = shelfStyle;
      setIsDepthTransitioning(true);
      const timer = setTimeout(() => {
        setIsDepthTransitioning(false);
      }, 620);
      return () => clearTimeout(timer);
    }
  }, [shelfStyle]);

  const handleSetViewMode = (mode: ShelfViewMode) => {
    setInternalViewMode(mode);
    onViewModeChange?.(mode);
    localStorage.setItem('nl_shelf_view_mode', mode);
  };

  // Mantener presionado (long-press) marca el libro o la decoración para opciones/quitar
  const handlePressStart = (targetId: string, kind: 'book' | 'decor' = 'book') => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    longPressTimerRef.current = setTimeout(() => {
      suppressClickRef.current = true;
      if (kind === 'book') {
        toggleMarkForDelete(targetId);
        setSelectedDecorSlotId(null);
      } else {
        setSelectedDecorSlotId((prev) => (prev === targetId ? null : targetId));
      }
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

  const handleRemoveDecorProp = (propId: ShelfDecorPropId) => {
    const nextProps = rawDecorConfig.enabledProps.filter((id) => id !== propId);
    const hasBookend = Boolean(rawDecorConfig.bookend && rawDecorConfig.bookend !== 'none');
    onUpdateShelfDecorConfig?.({
      ...rawDecorConfig,
      enabledProps: nextProps,
      theme: nextProps.length === 0 && !hasBookend ? 'none' : rawDecorConfig.theme,
    });
    setSelectedDecorSlotId(null);
  };

  const handleRemoveBookend = () => {
    onUpdateShelfDecorConfig?.({
      ...rawDecorConfig,
      bookend: 'none',
      theme: rawDecorConfig.enabledProps.length === 0 ? 'none' : rawDecorConfig.theme,
    });
    setSelectedDecorSlotId(null);
  };

  // Desmarcar libros o decoraciones al presionar la tecla Escape
  useEffect(() => {
    if (markedForDeleteIds.length === 0 && !selectedDecorSlotId) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMarkedForDeleteIds([]);
        setSelectedDecorSlotId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [markedForDeleteIds.length, selectedDecorSlotId]);

  const syncBookOrderInCustomSlots = (reorderedBooks: Book[]) => {
    if (customSlotOrder.length === 0) return;
    const reorderedBookSlotIds = reorderedBooks.map((b) => `book:${b.id}`);
    const bookSlotSet = new Set(reorderedBookSlotIds);
    let cursor = 0;
    const nextOrder = customSlotOrder.map((id) => {
      if (bookSlotSet.has(id) && cursor < reorderedBookSlotIds.length) {
        return reorderedBookSlotIds[cursor++];
      }
      return id;
    });
    saveCustomSlotOrder(nextOrder);
  };

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

    syncBookOrderInCustomSlots(newBooks);
    handleSetSortBy('custom');
    if (onReorderBooks) {
      onReorderBooks(newBooks);
    }
  };

  // Unified Drag & Drop + Touch Slide Reorder state (Books, Decorations, Bookends)
  const [touchActiveSlotId, setTouchActiveSlotId] = useState<string | null>(null);
  const [touchOverSlotId, setTouchOverSlotId] = useState<string | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const isTouchDragging = useRef<boolean>(false);
  const activeTouchElRef = useRef<HTMLElement | null>(null);
  const activeTouchBaseTransformRef = useRef<string>('');
  const touchActiveSlotIdRef = useRef<string | null>(null);
  const touchOverSlotIdRef = useRef<string | null>(null);

  const resetTouchDragState = () => {
    if (activeTouchElRef.current) {
      activeTouchElRef.current.style.transform = activeTouchBaseTransformRef.current;
      activeTouchElRef.current = null;
    }
    activeTouchBaseTransformRef.current = '';
    isTouchDragging.current = false;
    touchStartPos.current = null;
    touchActiveSlotIdRef.current = null;
    touchOverSlotIdRef.current = null;
    setTouchActiveSlotId(null);
    setTouchOverSlotId(null);
  };

  useEffect(() => {
    const handleWindowBlur = () => {
      handlePressEnd();
      resetTouchDragState();
      setDraggedSlotId(null);
      setDragOverSlotId(null);
    };
    window.addEventListener('blur', handleWindowBlur);
    return () => {
      window.removeEventListener('blur', handleWindowBlur);
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

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

    syncBookOrderInCustomSlots(sorted);
    handleSetSortBy('custom');
    if (onReorderBooks) {
      onReorderBooks(sorted);
    }
  };

  // Filter books across whole collection (Capacity up to 2000 books)
  const filteredBooks = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return books.filter((book) => {
      const matchesSearch =
        query === '' ||
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        (book.genres || []).some((g) => g.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      if (activeCategory === 'all') return true;
      if (activeCategory === 'favorites') return book.favorite;
      return book.category === activeCategory;
    });
  }, [books, searchQuery, activeCategory]);

  // Sort books: 'custom' preserves the user's manual arrangement perfectly
  const sortedBooks = useMemo(() => {
    if (sortBy === 'custom') return filteredBooks;
    return [...filteredBooks].sort((a, b) => {
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
  }, [filteredBooks, sortBy]);

  // Pagination for high capacity (2000 books)
  const totalPages = Math.max(1, Math.ceil(sortedBooks.length / pageSize));
  const effectivePage = Math.min(currentPage, totalPages);
  const paginatedBooks = useMemo(
    () => sortedBooks.slice((effectivePage - 1) * pageSize, effectivePage * pageSize),
    [sortedBooks, effectivePage, pageSize]
  );

  // Efecto de paralaje suave mediante transformaciones CSS al hacer scroll en la biblioteca
  useEffect(() => {
    let rafId = 0;

    const updateParallax = () => {
      rafId = 0;
      const el = bookcaseRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const viewportH = window.innerHeight || 800;
      const viewportCenter = viewportH * 0.5;
      const rectCenter = rect.top + rect.height * 0.5;

      const normalizedFromCenter = Math.max(-1, Math.min(1, (rectCenter - viewportCenter) / viewportH));
      const scrollDrift = Math.sin(window.scrollY * 0.0045) * 6;

      const backwallY = Math.max(-24, Math.min(24, normalizedFromCenter * -20 - scrollDrift));
      const shelfForegroundY = Math.max(-5, Math.min(5, normalizedFromCenter * 3.5 + scrollDrift * 0.25));

      el.style.setProperty('--shelf-parallax-y', `${backwallY.toFixed(2)}px`);
      el.style.setProperty('--shelf-books-parallax-y', `${shelfForegroundY.toFixed(2)}px`);
      el.style.setProperty('--shelf-plank-parallax-y', `${shelfForegroundY.toFixed(2)}px`);
    };

    const onScrollOrResize = () => {
      if (!rafId) {
        rafId = window.requestAnimationFrame(updateParallax);
      }
    };

    updateParallax();
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [sortedBooks.length, viewMode, effectivePage]);

  // Stats
  const totalBooks = books.length;
  const { readingCount, unreadCount, completedCount, abandonedCount, favoritesCount } = useMemo(() => {
    let reading = 0;
    let unread = 0;
    let completed = 0;
    let abandoned = 0;
    let favorites = 0;
    for (const b of books) {
      if (b.category === 'reading') reading++;
      else if (b.category === 'unread') unread++;
      else if (b.category === 'completed') completed++;
      else if (b.category === 'abandoned') abandoned++;
      if (b.favorite) favorites++;
    }
    return {
      readingCount: reading,
      unreadCount: unread,
      completedCount: completed,
      abandonedCount: abandoned,
      favoritesCount: favorites,
    };
  }, [books]);

  // Active shelf decorations & bookends calculation
  const activeDecorProps = useMemo(
    () => (effectiveDecorConfig.theme !== 'none' ? effectiveDecorConfig.enabledProps : []),
    [effectiveDecorConfig]
  );
  const hasDecorOnShelves = activeDecorProps.length > 0;
  const activeBookend =
    effectiveDecorConfig.theme !== 'none' &&
    effectiveDecorConfig.bookend &&
    effectiveDecorConfig.bookend !== 'none'
      ? effectiveDecorConfig.bookend
      : null;

  type ShelfSlotItem =
    | { slotId: string; kind: 'book'; book: Book }
    | { slotId: string; kind: 'decor'; propId: ShelfDecorPropId }
    | { slotId: string; kind: 'bookend'; bookendId: Exclude<ShelfBookendId, 'none'>; side: 'left' | 'right' };

  // Build balanced default shelf slot stream (books + decors + bookends)
  const defaultSlots: ShelfSlotItem[] = useMemo(() => {
    const decorPerRow =
      viewMode === 'covers'
        ? viewportWidth >= 1024 && activeDecorProps.length >= 4
          ? 2
          : 1
        : viewMode === 'spines'
        ? viewportWidth >= 768 && activeDecorProps.length >= 4
          ? 2
          : 1
        : activeDecorProps.length > 1
        ? 2
        : 1;

    const defaultBookChunkSize = (() => {
      if (viewMode === 'covers') {
        const cols = activeBookend
          ? viewportWidth < 640
            ? 3
            : viewportWidth < 768
            ? 4
            : viewportWidth < 1024
            ? 5
            : 6
          : viewportWidth < 640
          ? 4
          : viewportWidth < 768
          ? 5
          : viewportWidth < 1024
          ? 6
          : 7;
        if (!hasDecorOnShelves) return cols;
        return Math.max(2, cols - decorPerRow);
      }
      if (viewMode === 'spines') {
        const cols = activeBookend
          ? viewportWidth < 420
            ? 4
            : viewportWidth < 640
            ? 5
            : viewportWidth < 768
            ? 7
            : viewportWidth < 1024
            ? 9
            : 11
          : viewportWidth < 420
          ? 5
          : viewportWidth < 640
          ? 6
          : viewportWidth < 768
          ? 8
          : viewportWidth < 1024
          ? 10
          : 12;
        if (!hasDecorOnShelves) return cols;
        return Math.max(2, cols - decorPerRow);
      }
      const maxPiles = viewportWidth < 640 ? 2 : viewportWidth < 1024 ? 3 : 4;
      const bookPiles = hasDecorOnShelves ? Math.max(1, maxPiles - 1) : maxPiles;
      return bookPiles * 4;
    })();

    const result: ShelfSlotItem[] = [];
    const decorOccCounter: Record<string, number> = {};

    for (let i = 0, shelfIdx = 0; i < paginatedBooks.length; i += defaultBookChunkSize, shelfIdx++) {
      const bChunk = paginatedBooks.slice(i, i + defaultBookChunkSize);
      const rowItems: ShelfSlotItem[] = bChunk.map((book) => ({
        slotId: `book:${book.id}`,
        kind: 'book',
        book,
      }));

      if (hasDecorOnShelves) {
        const firstProp = activeDecorProps[(shelfIdx * decorPerRow) % activeDecorProps.length];
        const occ1 = decorOccCounter[firstProp] || 0;
        decorOccCounter[firstProp] = occ1 + 1;
        const firstSlot: ShelfSlotItem = {
          slotId: `decor:${firstProp}:${occ1}`,
          kind: 'decor',
          propId: firstProp,
        };

        if (viewMode === 'stacks') {
          rowItems.push(firstSlot);
        } else {
          const firstPosOptions = [
            Math.min(bChunk.length, 2),
            0,
            Math.min(bChunk.length, 3),
            bChunk.length,
          ];
          const pos1 = firstPosOptions[shelfIdx % firstPosOptions.length];
          rowItems.splice(pos1, 0, firstSlot);
        }

        if (decorPerRow > 1 && (viewMode !== 'stacks' || activeDecorProps.length > 1)) {
          const secondProp =
            activeDecorProps[(shelfIdx * decorPerRow + 1) % activeDecorProps.length];
          const occ2 = decorOccCounter[secondProp] || 0;
          decorOccCounter[secondProp] = occ2 + 1;
          const secondSlot: ShelfSlotItem = {
            slotId: `decor:${secondProp}:${occ2}`,
            kind: 'decor',
            propId: secondProp,
          };

          if (viewMode === 'stacks') {
            rowItems.push(secondSlot);
          } else {
            const pos2 = shelfIdx % 2 === 0 ? rowItems.length : Math.min(rowItems.length, 1);
            rowItems.splice(pos2, 0, secondSlot);
          }
        }
      }

      const resolvedRowBookend =
        activeBookend === 'dark-dynamic'
          ? DARK_BOOKEND_ROTATION[shelfIdx % DARK_BOOKEND_ROTATION.length]
          : activeBookend;

      if (activeBookend && resolvedRowBookend) {
        result.push({
          slotId: `bookend:${activeBookend}:left:${shelfIdx}`,
          kind: 'bookend',
          bookendId: resolvedRowBookend,
          side: 'left',
        });
      }
      result.push(...rowItems);
      if (activeBookend && resolvedRowBookend) {
        result.push({
          slotId: `bookend:${activeBookend}:right:${shelfIdx}`,
          kind: 'bookend',
          bookendId: resolvedRowBookend,
          side: 'right',
        });
      }
    }

    return result;
  }, [paginatedBooks, viewMode, viewportWidth, activeDecorProps, hasDecorOnShelves, activeBookend]);

  // Apply user's persisted custom arrangement across books, decorations & bookends
  const orderedSlots: ShelfSlotItem[] = useMemo(() => {
    if (sortBy !== 'custom' || customSlotOrder.length === 0) {
      return defaultSlots;
    }

    const slotMap = new Map<string, ShelfSlotItem>(defaultSlots.map((s) => [s.slotId, s]));
    const knownSet = new Set<string>();
    const mergedIds: string[] = [];

    for (const id of customSlotOrder) {
      if (slotMap.has(id) && !knownSet.has(id)) {
        knownSet.add(id);
        mergedIds.push(id);
      }
    }

    for (let i = 0; i < defaultSlots.length; i++) {
      const id = defaultSlots[i].slotId;
      if (knownSet.has(id)) continue;

      let insertAt = 0;
      for (let j = i - 1; j >= 0; j--) {
        const prevId = defaultSlots[j].slotId;
        const posInMerged = mergedIds.indexOf(prevId);
        if (posInMerged !== -1) {
          insertAt = posInMerged + 1;
          break;
        }
      }
      mergedIds.splice(insertAt, 0, id);
      knownSet.add(id);
    }

    return mergedIds.map((id) => slotMap.get(id)!);
  }, [defaultSlots, sortBy, customSlotOrder]);

  // Pack orderedSlots into shelf rows matching exact mobile/desktop width capacity
  const shelfRows: ShelfSlotItem[][] = useMemo(() => {
    if (orderedSlots.length === 0) return [];

    if (viewMode === 'covers') {
      const maxWeight =
        viewportWidth < 640
          ? 4.25
          : viewportWidth < 768
          ? 5.25
          : viewportWidth < 1024
          ? 6.25
          : 7.45;
      const getWeight = (slot: ShelfSlotItem) =>
        slot.kind === 'bookend' ? 0.58 : slot.kind === 'decor' ? 0.98 : 1.0;

      const rows: ShelfSlotItem[][] = [];
      let currentRow: ShelfSlotItem[] = [];
      let currentWeight = 0;

      for (const slot of orderedSlots) {
        const w = getWeight(slot);
        if (currentRow.length > 0 && currentWeight + w > maxWeight) {
          rows.push(currentRow);
          currentRow = [slot];
          currentWeight = w;
        } else {
          currentRow.push(slot);
          currentWeight += w;
        }
      }
      if (currentRow.length > 0) rows.push(currentRow);
      return rows;
    }

    if (viewMode === 'spines') {
      const maxWeight =
        viewportWidth < 420
          ? 5.45
          : viewportWidth < 640
          ? 6.45
          : viewportWidth < 768
          ? 8.45
          : viewportWidth < 1024
          ? 10.45
          : 12.45;
      const getWeight = (slot: ShelfSlotItem) =>
        slot.kind === 'bookend' ? 1.05 : slot.kind === 'decor' ? 1.45 : 1.0;

      const rows: ShelfSlotItem[][] = [];
      let currentRow: ShelfSlotItem[] = [];
      let currentWeight = 0;

      for (const slot of orderedSlots) {
        const w = getWeight(slot);
        if (currentRow.length > 0 && currentWeight + w > maxWeight) {
          rows.push(currentRow);
          currentRow = [slot];
          currentWeight = w;
        } else {
          currentRow.push(slot);
          currentWeight += w;
        }
      }
      if (currentRow.length > 0) rows.push(currentRow);
      return rows;
    }

    // viewMode === 'stacks': group up to 4 consecutive books per pile while respecting orderedSlots positions
    const maxPiles = viewportWidth < 640 ? 2 : viewportWidth < 1024 ? 3 : 4;
    const maxColBudget = maxPiles + (activeBookend ? 1.15 : 0.2);
    const rows: ShelfSlotItem[][] = [];
    let currentRow: ShelfSlotItem[] = [];
    let currentColWeight = 0;
    let consecutiveBooksInPile = 0;

    for (const slot of orderedSlots) {
      let addedWeight = 0;
      if (slot.kind === 'book') {
        if (consecutiveBooksInPile === 0 || consecutiveBooksInPile >= 4) {
          addedWeight = 1.0;
          consecutiveBooksInPile = 1;
        } else {
          addedWeight = 0;
          consecutiveBooksInPile += 1;
        }
      } else {
        consecutiveBooksInPile = 0;
        addedWeight = slot.kind === 'bookend' ? 0.55 : 0.85;
      }

      if (currentRow.length > 0 && currentColWeight + addedWeight > maxColBudget) {
        rows.push(currentRow);
        currentRow = [slot];
        if (slot.kind === 'book') {
          currentColWeight = 1.0;
          consecutiveBooksInPile = 1;
        } else {
          currentColWeight = addedWeight;
          consecutiveBooksInPile = 0;
        }
      } else {
        currentRow.push(slot);
        currentColWeight += addedWeight;
      }
    }
    if (currentRow.length > 0) rows.push(currentRow);
    return rows;
  }, [orderedSlots, viewMode, viewportWidth, activeBookend]);

  // Unified slot move & drag/touch handlers (works identically for books, decorations & bookends)
  const handleSlotMove = (sourceSlotId: string, targetSlotId: string) => {
    if (!sourceSlotId || !targetSlotId || sourceSlotId === targetSlotId) return;

    const currentIds = orderedSlots.map((s) => s.slotId);
    const fromIndex = currentIds.indexOf(sourceSlotId);
    const toIndex = currentIds.indexOf(targetSlotId);
    if (fromIndex === -1 || toIndex === -1) return;

    const nextVisibleIds = [...currentIds];
    const [movedId] = nextVisibleIds.splice(fromIndex, 1);
    nextVisibleIds.splice(toIndex, 0, movedId);

    const visibleSet = new Set(currentIds);
    const mergedOrder: string[] = [];
    let visibleCursor = 0;

    for (const existingId of customSlotOrder) {
      if (visibleSet.has(existingId)) {
        if (visibleCursor < nextVisibleIds.length) {
          mergedOrder.push(nextVisibleIds[visibleCursor++]);
        }
      } else {
        mergedOrder.push(existingId);
      }
    }
    while (visibleCursor < nextVisibleIds.length) {
      mergedOrder.push(nextVisibleIds[visibleCursor++]);
    }

    saveCustomSlotOrder(mergedOrder);
    handleSetSortBy('custom');

    if (sourceSlotId.startsWith('book:') && onReorderBooks) {
      const visibleBookIdsInOrder = nextVisibleIds
        .filter((id) => id.startsWith('book:'))
        .map((id) => id.slice('book:'.length));
      const visibleBookSet = new Set(visibleBookIdsInOrder);
      const bookMap = new Map(books.map((b) => [b.id, b]));
      const nextBooks: Book[] = [];
      let bCursor = 0;

      for (const b of books) {
        if (visibleBookSet.has(b.id)) {
          const nextId = visibleBookIdsInOrder[bCursor++];
          if (nextId && bookMap.has(nextId)) {
            nextBooks.push(bookMap.get(nextId)!);
          }
        } else {
          nextBooks.push(b);
        }
      }
      onReorderBooks(nextBooks);
    }
  };

  const handleSlotDragStart = (e: React.DragEvent, slotId: string) => {
    e.dataTransfer.setData('text/plain', slotId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedSlotId(slotId);
  };

  const handleSlotDragOver = (e: React.DragEvent, slotId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverSlotId !== slotId) {
      setDragOverSlotId(slotId);
    }
  };

  const handleSlotDragLeave = (e: React.DragEvent, slotId: string) => {
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    if (dragOverSlotId === slotId) {
      setDragOverSlotId(null);
    }
  };

  const handleSlotDrop = (e: React.DragEvent, targetSlotId: string) => {
    e.preventDefault();
    setDragOverSlotId(null);
    const sourceSlotId = e.dataTransfer.getData('text/plain') || draggedSlotId;
    setDraggedSlotId(null);
    if (!sourceSlotId || sourceSlotId === targetSlotId) return;
    handleSlotMove(sourceSlotId, targetSlotId);
  };

  const handleSlotDragEnd = () => {
    setDraggedSlotId(null);
    setDragOverSlotId(null);
  };

  const handleSlotTouchStart = (
    slotId: string,
    e: React.TouchEvent,
    bookId?: string,
    pressKind: 'book' | 'decor' = 'book'
  ) => {
    if (e.touches.length > 1) {
      resetTouchDragState();
      return;
    }
    const touch = e.touches[0];
    const targetEl = e.currentTarget as HTMLElement;
    if (activeTouchElRef.current && activeTouchElRef.current !== targetEl) {
      activeTouchElRef.current.style.transform = activeTouchBaseTransformRef.current;
    }
    activeTouchElRef.current = targetEl;
    activeTouchBaseTransformRef.current = targetEl.style.transform || '';
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    isTouchDragging.current = false;
    if (pressKind === 'book' && bookId) {
      handlePressStart(bookId, 'book');
    } else if (pressKind === 'decor') {
      handlePressStart(slotId, 'decor');
    }
  };

  const handleSlotTouchMove = (slotId: string, e: React.TouchEvent) => {
    if (!touchStartPos.current || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartPos.current.x;
    const dy = touch.clientY - touchStartPos.current.y;
    const distance = Math.hypot(dx, dy);

    if (!isTouchDragging.current && distance > 8) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      if (Math.abs(dy) >= Math.abs(dx) * 1.1) {
        touchStartPos.current = null;
        activeTouchElRef.current = null;
        return;
      }

      if (Math.abs(dx) > 14 && Math.abs(dx) > Math.abs(dy) * 1.25) {
        isTouchDragging.current = true;
        touchActiveSlotIdRef.current = slotId;
        setTouchActiveSlotId(slotId);
      } else {
        return;
      }
    }

    if (isTouchDragging.current) {
      if (e.cancelable) {
        e.preventDefault();
      }

      if (activeTouchElRef.current) {
        activeTouchElRef.current.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      }

      const elem = document.elementFromPoint(touch.clientX, touch.clientY);
      const targetSlot = elem?.closest('[data-slot-id]');
      const targetId = targetSlot?.getAttribute('data-slot-id') || null;
      const nextOver = targetId && targetId !== slotId ? targetId : null;

      if (touchOverSlotIdRef.current !== nextOver) {
        touchOverSlotIdRef.current = nextOver;
        setTouchOverSlotId(nextOver);
      }
    }
  };

  const handleSlotTouchEnd = () => {
    handlePressEnd();

    const wasDragging = isTouchDragging.current;
    const activeId = touchActiveSlotIdRef.current;
    const overId = touchOverSlotIdRef.current;

    if (wasDragging) {
      suppressClickRef.current = true;
      setTimeout(() => {
        suppressClickRef.current = false;
      }, 350);
    }

    resetTouchDragState();

    if (wasDragging && activeId && overId && activeId !== overId) {
      handleSlotMove(activeId, overId);
    }
  };

  const handleSlotTouchCancel = () => {
    handlePressEnd();
    if (isTouchDragging.current) {
      suppressClickRef.current = true;
      setTimeout(() => {
        suppressClickRef.current = false;
      }, 350);
    }
    resetTouchDragState();
  };

  // Shelf CSS class based on style
  const shelfClassMap: Record<ShelfStyle, string> = {
    'wood-gothic': 'shelf-wood-gothic',
    'wood-oak': 'shelf-wood-oak',
    'digital-neon': 'shelf-digital-neon',
    'digital-cyber': 'shelf-digital-cyber',
    'minimal-oled': 'shelf-minimal-oled'
  };

  const selectedDecorSlot = useMemo(
    () => (selectedDecorSlotId ? orderedSlots.find((s) => s.slotId === selectedDecorSlotId) : undefined),
    [orderedSlots, selectedDecorSlotId]
  );

  return (
    <div className="p-2 sm:p-6 max-w-7xl mx-auto w-full flex-1 flex flex-col select-none">
      {/* Barra flotante para quitar una decoración o sujetalibros seleccionado (long-press) */}
      {selectedDecorSlot && selectedDecorSlot.kind !== 'book' && markedForDeleteIds.length === 0 && (() => {
        const decorLabel =
          selectedDecorSlot.kind === 'decor'
            ? SHELF_DECOR_CATALOG.find((c) => c.id === selectedDecorSlot.propId)?.name || 'Decoración'
            : `Sujetalibros ${
                SHELF_BOOKEND_CATALOG.find((b) => b.id === selectedDecorSlot.bookendId)?.name || ''
              }`.trim();
        return (
          <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[94vw] max-w-md flex flex-wrap items-center justify-center gap-2.5 bg-[#1a0a10]/95 border-2 border-[var(--accent-pink)]/70 px-4 py-2.5 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.85)] animate-popIn">
            <span className="text-pink-200 text-xs sm:text-sm font-cute font-medium truncate max-w-[200px]">
              ✨ {decorLabel}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (selectedDecorSlot.kind === 'decor') {
                  handleRemoveDecorProp(selectedDecorSlot.propId);
                } else {
                  handleRemoveBookend();
                }
              }}
              className="min-h-[36px] px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition active:scale-95 flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Quitar de la estantería</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedDecorSlotId(null)}
              className="min-h-[36px] px-2.5 py-1.5 rounded-xl bg-black/60 hover:bg-white/10 text-gray-300 hover:text-white text-xs border border-white/20 transition active:scale-95 cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        );
      })()}

      {/* Barra de acción flotante cuando hay libros seleccionados al mantener presionado */}
      {markedForDeleteIds.length > 0 && (
        <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[94vw] max-w-xl flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 bg-[#1a0a10]/95 border-2 border-[var(--accent-pink)]/70 px-3.5 py-2.5 sm:px-5 sm:py-3 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.8)] backdrop-blur-md animate-popIn">
          <div className="flex items-center gap-1.5 text-pink-200 text-xs sm:text-sm font-cute font-medium">
            <span>📚</span>
            <span>
              {markedForDeleteIds.length} {markedForDeleteIds.length === 1 ? 'libro seleccionado' : 'libros seleccionados'}
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              markedForDeleteIds.forEach((id) => {
                const target = books.find((b) => b.id === id);
                if (target) {
                  onChangeCategory(id, target.category === 'completed' ? 'reading' : 'completed', e);
                }
              });
              setMarkedForDeleteIds([]);
            }}
            className="min-h-[36px] px-2.5 py-1.5 rounded-xl bg-purple-600/80 hover:bg-purple-600 text-white font-bold text-xs shadow-sm transition active:scale-95 flex items-center gap-1 cursor-pointer"
            title="Marcar como leído / en lectura"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Leído</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              markedForDeleteIds.forEach((id) => {
                const target = books.find((b) => b.id === id);
                if (target) {
                  onChangeCategory(id, target.category === 'abandoned' ? 'reading' : 'abandoned', e);
                }
              });
              setMarkedForDeleteIds([]);
            }}
            className="min-h-[36px] px-2.5 py-1.5 rounded-xl bg-rose-950/90 hover:bg-rose-900 text-rose-200 border border-rose-400/40 font-bold text-xs shadow-sm transition active:scale-95 flex items-center gap-1 cursor-pointer"
            title="Marcar como pausado / reanudar"
          >
            <span>🥀</span>
            <span>Pausar</span>
          </button>

          <button
            type="button"
            onClick={handleDeleteMarkedBooks}
            className="min-h-[36px] px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition active:scale-95 flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Eliminar {markedForDeleteIds.length === 1 ? '' : `(${markedForDeleteIds.length})`}</span>
          </button>

          <button
            type="button"
            onClick={handleClearMarked}
            className="min-h-[36px] px-2.5 py-1.5 rounded-xl bg-black/60 hover:bg-white/10 text-gray-300 hover:text-white text-xs border border-white/20 transition active:scale-95 cursor-pointer"
            title="Desmarcar todos y cancelar (o pulsa Escape)"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Main Controls Box */}
      <div className="flex flex-col gap-3 mb-4 sm:mb-6 bg-[var(--card-bg)] p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-[var(--border-color)] shadow-xl transition-colors">
        
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

        {/* INTEGRATED ACTION ROW: Search Bar + Header Operational Buttons */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-2.5 pt-2.5 border-t border-white/10">
          
          {/* 1. Buscador del Libro */}
          <div className="relative w-full sm:flex-1 sm:min-w-[210px] sm:max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--accent-pink)]/75 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscador: título, autor o género..."
              className="w-full h-10 sm:h-9 bg-black/50 border border-[var(--border-color)] rounded-xl pl-8 pr-8 py-1.5 text-xs leading-normal text-white placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-pink)] transition shadow-inner font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] hover:text-white p-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* 2. Botones del Header en la pantalla principal (solo visibles cuando están activados en Configuración) */}
          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2">
            
            {/* Notas y Citas */}
            {Boolean(headerConfig?.showQuotes) && onSwitchView && (
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
            {Boolean(headerConfig?.showStats) && onSwitchView && (
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
            {Boolean(headerConfig?.showBookmarks) && onSwitchView && (
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
            {Boolean(headerConfig?.showNightMode) && onToggleNightMode && (
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

            {/* Música MP3 / VIP (Solo si el usuario activa el botón en Configuración) */}
            {Boolean(headerConfig?.showMusic) && onOpenAudioModal && (
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
            {Boolean(headerConfig?.showTheme) && onOpenThemeModal && (
              <button
                onClick={onOpenThemeModal}
                className="p-1.5 sm:px-2.5 sm:py-1.5 bg-black/40 border border-[var(--border-color)] hover:border-[var(--accent-pink)] rounded-xl text-xs text-[var(--accent-pink)] font-cute flex items-center gap-1 transition shrink-0 shadow-sm"
                title="Cambiar Paleta de Temas"
              >
                <Palette className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Temas</span>
              </button>
            )}

            {/* Coronita VIP ($2 USD/mes) */}
            <button
              onClick={() => onOpenVipModal?.()}
              className={`min-h-[38px] px-3 py-1.5 rounded-xl border text-xs font-cute font-bold flex items-center gap-1 transition active:scale-95 shrink-0 shadow-sm ${
                isVip
                  ? 'bg-amber-400 text-black border-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.6)]'
                  : 'bg-black/50 border-amber-400/60 text-amber-300 hover:bg-amber-400 hover:text-black hover:border-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.2)]'
              }`}
              title={isVip ? 'Membresía VIP Activa 👑' : 'Acceso VIP ($2 USD/mes) • Solo PayPal 👑'}
            >
              <Crown className={`w-3.5 h-3.5 ${isVip ? 'fill-black' : 'text-amber-400'}`} />
              <span>VIP</span>
            </button>

            {/* Subir Archivo Individual */}
            <button
              onClick={onTriggerUpload}
              className="min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold bg-[var(--accent-pink)]/20 text-[var(--accent-pink)] border border-[var(--accent-pink)]/50 hover:bg-[var(--accent-pink)] hover:text-black transition flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0"
              title="Subir libro individual (EPUB, PDF, TXT)"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Subir</span>
            </button>

            {/* Sincronizar Almacenamiento Interno (Hasta 2000 Libros) */}
            {onSyncFolder && (
              <button
                onClick={onSyncFolder}
                className="min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600/30 to-pink-600/30 text-purple-200 border border-purple-400/50 hover:bg-purple-600 hover:text-white transition flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0"
                title="Sincronizar carpeta con tu almacenamiento interno para colocar hasta 2000 libros automáticamente"
              >
                <FolderSync className="w-3.5 h-3.5 text-purple-300" />
                <span className="sm:hidden">Carpeta</span>
                <span className="hidden sm:inline">Sincronizar Carpeta</span>
              </button>
            )}

            {/* Indicador / Desmarcar si hay libros marcados para eliminar */}
            {markedForDeleteIds.length > 0 && (
              <button
                onClick={handleClearMarked}
                className="min-h-[38px] px-2.5 py-1.5 rounded-xl border text-xs font-cute flex items-center gap-1 transition shrink-0 shadow-sm bg-rose-600/30 text-rose-300 border-rose-500/60 hover:bg-rose-600 hover:text-white active:scale-95 cursor-pointer"
                title="Desmarcar todos los libros seleccionados para eliminar (o pulsa Escape)"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="font-bold">{markedForDeleteIds.length} Marcado{markedForDeleteIds.length === 1 ? '' : 's'} (✕)</span>
              </button>
            )}

            {/* Configuración (Engranaje) */}
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="min-h-[38px] min-w-[38px] px-2.5 py-1.5 bg-black/40 border border-[var(--border-color)] hover:border-[var(--accent-pink)] rounded-xl text-xs text-[var(--accent-pink)] flex items-center justify-center transition shrink-0 hover:bg-[var(--accent-pink)]/10"
                title="Configuración de lectura, decoraciones, tipografía y márgenes"
                aria-label="Abrir panel de configuraciones"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Third Row: View Modes & Sorting */}
        <div className="flex items-center justify-between gap-2.5 pt-2.5 border-t border-white/5 text-xs">
          <div className="flex items-center gap-2 shrink-0">
            {/* 3 View Modes (Solo iconos) */}
            <div className="flex items-center gap-0.5 bg-black/40 border border-[var(--border-color)] rounded-xl p-0.5">
              <button
                onClick={() => handleSetViewMode('covers')}
                className={`min-h-[36px] min-w-[38px] px-2.5 py-1.5 rounded-lg flex items-center justify-center transition ${
                  viewMode === 'covers'
                    ? 'bg-[var(--accent-pink)] text-black shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-white'
                }`}
                title="Portadas"
                aria-label="Vista de portadas frontales"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleSetViewMode('spines')}
                className={`min-h-[36px] min-w-[38px] px-2.5 py-1.5 rounded-lg flex items-center justify-center transition ${
                  viewMode === 'spines'
                    ? 'bg-[var(--accent-pink)] text-black shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-white'
                }`}
                title="Lomos"
                aria-label="Vista de lomos verticales"
              >
                <Library className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleSetViewMode('stacks')}
                className={`min-h-[36px] min-w-[38px] px-2.5 py-1.5 rounded-lg flex items-center justify-center transition ${
                  viewMode === 'stacks'
                    ? 'bg-[var(--accent-pink)] text-black shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-white'
                }`}
                title="Acostados"
                aria-label="Vista de libros acostados"
              >
                <Layers className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 min-w-0">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-black/40 border border-[var(--border-color)] rounded-xl px-2.5 h-9 text-xs text-[var(--text-main)] shadow-sm min-w-0">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--accent-pink)] shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => handleSetSortBy(e.target.value as any)}
                aria-label="Ordenar libros por"
                className="w-full min-w-0 bg-transparent text-[11px] sm:text-xs leading-normal py-0.5 focus:outline-none cursor-pointer text-[var(--text-main)] font-medium truncate"
              >
                <option value="custom" className="bg-[#1a1726]">✨ Mi Orden</option>
                <option value="recent" className="bg-[#1a1726]">🕒 Recientes</option>
                <option value="title-asc" className="bg-[#1a1726]">🔤 Título (A → Z)</option>
                <option value="title-desc" className="bg-[#1a1726]">🔤 Título (Z → A)</option>
                <option value="author-asc" className="bg-[#1a1726]">✍️ Autor (A → Z)</option>
                <option value="progress-desc" className="bg-[#1a1726]">📊 Mayor %</option>
                <option value="progress-asc" className="bg-[#1a1726]">📖 Menor %</option>
                <option value="favorites" className="bg-[#1a1726]">🖤 Favoritos</option>
                <option value="newest" className="bg-[#1a1726]">🆕 Nuevos</option>
                <option value="oldest" className="bg-[#1a1726]">⏳ Antiguos</option>
              </select>
            </div>
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
          ref={bookcaseRef}
          data-shelf-style={shelfStyle}
          className={`flex-1 bookcase-cabinet relative transition-all duration-300 ${
            shelfClassMap[shelfStyle]
          } ${getLedGlowClass(effectiveDecorConfig.theme, effectiveDecorConfig.ledGlow)} ${
            isDepthTransitioning ? 'bookcase-depth-transition' : ''
          }`}
        >
          {/* Top Bookcase Crown Molding / Cornice */}
          <div className="bookcase-crown">
            <div className="bookcase-crown-ornament" />
          </div>

          {/* Bookcase Body: Left Upright Pillar + Recessed Interior + Right Upright Pillar */}
          <div className="bookcase-body">
            {/* Left Vertical Bookcase Frame Pillar */}
            <div className="bookcase-pillar" aria-hidden="true" />

            {/* Recessed Library Interior */}
            <div className="bookcase-interior px-2 sm:px-5 pt-3 pb-4">
              {/* Architectural Backwall Parallax Layer */}
              <div className="bookcase-backwall-layer" aria-hidden="true" />

              {/* Custom user background image if configured (also receives parallax depth) */}
              {(() => {
                const safeShelfBgImage = sanitizeImageUrl(shelfBgConfig?.customImage);
                if (!safeShelfBgImage) return null;
                return (
                  <>
                    <div
                      className="bookcase-backwall-layer bg-center overflow-hidden"
                      style={{
                        backgroundImage: `url(${safeShelfBgImage})`,
                        backgroundSize: shelfBgConfig?.fit === 'pattern' ? 'auto' : 'cover',
                        backgroundRepeat: shelfBgConfig?.fit === 'pattern' ? 'repeat' : 'no-repeat',
                        filter: `blur(${Math.max(0, Math.min(20, shelfBgConfig?.blur ?? 0))}px)`
                      }}
                    />
                    <div
                      className="absolute inset-0 bg-black pointer-events-none transition-opacity duration-300"
                      style={{ opacity: Math.max(0, Math.min(100, shelfBgConfig?.overlayDarkness ?? 65)) / 100 }}
                    />
                  </>
                );
              })()}

              {/* Atmospheric Theme Overlay (Vines, Starry Moon Sky, Obsidian Vignette) */}
              <ShelfAtmosphereBackwall config={effectiveDecorConfig} />

              {/* Top Library Shelf Header - Clean & Spacious on Mobile */}
              <div className="relative z-10 px-1 py-1 flex items-center justify-between gap-2 border-b border-white/10 pb-2.5 text-xs text-[var(--text-muted)]">
                <span className="font-bold flex items-center gap-2 text-[var(--accent-pink)] min-w-0">
                  <span>📚</span>
                  <span className="truncate">MI ESTANTERÍA</span>
                  {markedForDeleteIds.length > 0 && (
                    <span className="text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded-full font-bold animate-pulse shrink-0">
                      {markedForDeleteIds.length} marcado{markedForDeleteIds.length === 1 ? '' : 's'}
                    </span>
                  )}
                </span>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-mono text-[var(--text-muted)] tabular-nums whitespace-nowrap shrink-0">
                    {totalBooks} {totalBooks === 1 ? 'TOMO' : 'TOMOS'}
                  </span>
                </div>
              </div>

              {/* Shelves rows */}
              <div
                onContextMenu={(e) => {
                  if (isTouchDragging.current) e.preventDefault();
                }}
                className="space-y-4 sm:space-y-5 relative z-10 mt-2"
              >
                {shelfRows.map((rowSlots, shelfIndex) => (
              <div
                key={shelfIndex}
                className="conventional-shelf-row"
                style={
                  isDepthTransitioning
                    ? { animationDelay: `${Math.min(shelfIndex * 55, 280)}ms` }
                    : undefined
                }
              >
                <div className="bookcase-books-layer">
                {/* MODE 1: COVERS VIEW (Portadas, decoraciones y sujetalibros movibles descansando sobre la repisa) */}
                {viewMode === 'covers' && (
                  <div className="flex items-end justify-center gap-1.5 sm:gap-2.5 lg:gap-3.5 px-1 sm:px-2 pb-0">
                    {rowSlots.map((slot) => {
                      const isTouchingCurrent = touchActiveSlotId === slot.slotId;
                      const isDraggingCurrent = draggedSlotId === slot.slotId || isTouchingCurrent;
                      const isDropTarget = (dragOverSlotId === slot.slotId || touchOverSlotId === slot.slotId) && !isDraggingCurrent;

                      if (slot.kind === 'decor' || slot.kind === 'bookend') {
                        const isDecorSelected = selectedDecorSlotId === slot.slotId;
                        return (
                          <div
                            key={slot.slotId}
                            data-slot-id={slot.slotId}
                            draggable={true}
                            onDragStart={(e) => {
                              setSelectedDecorSlotId(null);
                              handleSlotDragStart(e, slot.slotId);
                            }}
                            onDragOver={(e) => handleSlotDragOver(e, slot.slotId)}
                            onDragLeave={(e) => handleSlotDragLeave(e, slot.slotId)}
                            onDrop={(e) => handleSlotDrop(e, slot.slotId)}
                            onDragEnd={handleSlotDragEnd}
                            onMouseDown={() => handlePressStart(slot.slotId, 'decor')}
                            onMouseUp={handlePressEnd}
                            onMouseLeave={handlePressEnd}
                            onTouchStart={(e) => handleSlotTouchStart(slot.slotId, e, undefined, 'decor')}
                            onTouchMove={(e) => handleSlotTouchMove(slot.slotId, e)}
                            onTouchEnd={handleSlotTouchEnd}
                            onTouchCancel={handleSlotTouchCancel}
                            style={{
                              touchAction: 'pan-y',
                              zIndex: isTouchingCurrent ? 60 : isDecorSelected ? 35 : undefined,
                              pointerEvents: isTouchingCurrent ? 'none' : 'auto',
                            }}
                            className={`group relative self-end mb-[-3px] shrink-0 cursor-grab active:cursor-grabbing flex items-end justify-center transition-all duration-200 select-none ${
                              slot.kind === 'bookend'
                                ? 'w-[34px] min-[400px]:w-[40px] sm:w-[54px] md:w-[62px] h-[86px] min-[400px]:h-[98px] sm:h-[126px] md:h-[138px]'
                                : 'w-[60px] min-[400px]:w-[68px] sm:w-[88px] md:w-[96px] lg:w-[104px] aspect-[2/3]'
                            } ${
                              isTouchingCurrent
                                ? 'scale-105 shadow-[0_20px_45px_rgba(255,121,198,0.7)] ring-2 ring-[var(--accent-pink)] transition-none rounded-xl'
                                : ''
                            } ${
                              isDecorSelected
                                ? 'ring-2 ring-rose-400 bg-rose-500/10 rounded-xl scale-[1.03]'
                                : ''
                            } ${
                              draggedSlotId === slot.slotId ? 'opacity-40 scale-95' : ''
                            } ${
                              isDropTarget
                                ? 'ring-4 ring-[var(--accent-pink)] scale-105 shadow-[0_0_25px_rgba(255,121,198,0.8)] z-30 rounded-xl'
                                : ''
                            }`}
                          >
                            {onUpdateShelfDecorConfig && !isTouchingCurrent && (
                              <button
                                type="button"
                                onMouseDown={(e) => e.stopPropagation()}
                                onTouchStart={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (slot.kind === 'decor') {
                                    handleRemoveDecorProp(slot.propId);
                                  } else {
                                    handleRemoveBookend();
                                  }
                                }}
                                className={`absolute -top-1.5 -right-1.5 z-50 w-6 h-6 rounded-full text-white border flex items-center justify-center shadow-lg transition active:scale-90 cursor-pointer ${
                                  isDecorSelected
                                    ? 'opacity-100 bg-rose-600 border-white'
                                    : 'opacity-0 group-hover:opacity-100 focus:opacity-100 bg-black/85 hover:bg-rose-600 border-white/40'
                                }`}
                                title={slot.kind === 'decor' ? 'Quitar esta decoración' : 'Quitar sujetalibros'}
                                aria-label={slot.kind === 'decor' ? 'Quitar esta decoración' : 'Quitar sujetalibros'}
                              >
                                <X className="w-3 h-3 stroke-[2.75]" />
                              </button>
                            )}
                            {isDropTarget && (
                              <div className="absolute inset-0 z-50 bg-[var(--accent-pink)]/25 rounded-xl flex items-center justify-center pointer-events-none border-2 border-[var(--accent-pink)]">
                                <span className="text-[9px] font-bold text-white bg-black/90 px-2 py-0.5 rounded-full shadow-lg border border-[var(--accent-pink)] animate-bounce">
                                  ✨
                                </span>
                              </div>
                            )}
                            {slot.kind === 'decor' ? (
                              <ShelfDecoration
                                type={slot.propId}
                                inSlot
                                onBeforeClick={() => !suppressClickRef.current && !isTouchDragging.current}
                              />
                            ) : (
                              <ShelfBookend
                                id={slot.bookendId}
                                side={slot.side}
                                inSlot
                                onBeforeClick={() => !suppressClickRef.current && !isTouchDragging.current}
                              />
                            )}
                          </div>
                        );
                      }

                      const book = slot.book;
                      const percent = book.progressPercent || 0;
                      const isMarked = isBookMarked(book.id);

                      return (
                        <div
                          key={book.id}
                          data-slot-id={slot.slotId}
                          data-book-id={book.id}
                          draggable={true}
                          onDragStart={(e) => handleSlotDragStart(e, slot.slotId)}
                          onDragOver={(e) => handleSlotDragOver(e, slot.slotId)}
                          onDragLeave={(e) => handleSlotDragLeave(e, slot.slotId)}
                          onDrop={(e) => handleSlotDrop(e, slot.slotId)}
                          onDragEnd={handleSlotDragEnd}
                          onTouchStart={(e) => handleSlotTouchStart(slot.slotId, e, book.id)}
                          onTouchMove={(e) => handleSlotTouchMove(slot.slotId, e)}
                          onTouchEnd={handleSlotTouchEnd}
                          onTouchCancel={handleSlotTouchCancel}
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
                            zIndex: isTouchingCurrent ? 60 : undefined,
                            pointerEvents: isTouchingCurrent ? 'none' : 'auto'
                          }}
                          className={`group shrink-0 w-[60px] min-[400px]:w-[68px] sm:w-[88px] md:w-[96px] lg:w-[104px] cursor-grab active:cursor-grabbing flex flex-col items-center transition-all duration-200 relative select-none ${
                            isTouchingCurrent 
                              ? 'scale-105 shadow-[0_20px_45px_rgba(255,121,198,0.7)] ring-2 ring-[var(--accent-pink)] transition-none rounded-xl' 
                              : ''
                          } ${
                            draggedSlotId === slot.slotId ? 'opacity-40 scale-95' : ''
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
                            <div className="absolute inset-0 z-50 bg-[var(--accent-pink)]/25 rounded-xl flex items-center justify-center pointer-events-none border-2 border-[var(--accent-pink)]">
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

                          {/* Conventional Book Cover Container - 4 por estante en móvil descansando sobre la repisa */}
                          <div className={`relative w-full max-w-[78px] sm:max-w-[96px] md:max-w-[106px] aspect-[2/3] rounded-r-md sm:rounded-r-lg rounded-l-sm shadow-[0_4px_10px_rgba(0,0,0,0.85)] overflow-hidden border border-white/10 group-hover:border-[var(--accent-pink)]/50 group-hover:shadow-[0_8px_18px_rgba(0,0,0,0.65)] transition-all flex flex-col justify-between p-1.5 sm:p-2 text-left book-cover-shadow ${
                            isMarked ? 'border-rose-500' : ''
                          }`}>
                            {/* Marked badge inside top right */}
                            {isMarked && (
                              <div className="absolute top-1 right-1 z-30 bg-rose-600 text-white text-[7px] sm:text-[9px] font-bold px-1 py-0.5 rounded-full shadow-md border border-white flex items-center gap-0.5 animate-fadeIn">
                                <Trash2 className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                                <span className="hidden sm:inline">Opciones</span>
                              </div>
                            )}
                            {/* Background cover gradient & real public/embedded cover if available */}
                            <div
                              className="absolute inset-0 opacity-95 group-hover:scale-105 transition-transform duration-300"
                              style={{
                                background: resolveCoverGradient(book.coverGradient)
                              }}
                            />
                            {(() => {
                              const safeCover = !brokenCoverIds[book.id] ? sanitizeImageUrl(book.coverImage) : null;
                              if (!safeCover) return null;
                              return (
                                <>
                                  <img
                                    src={safeCover}
                                    alt={book.title}
                                    referrerPolicy="no-referrer"
                                    loading="lazy"
                                    onError={() =>
                                      setBrokenCoverIds((prev) => ({ ...prev, [book.id]: true }))
                                    }
                                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/45 pointer-events-none" />
                                </>
                              );
                            })()}

                            {/* Subtle Spine Ledge line */}
                            <div className="absolute top-0 left-0 bottom-0 w-1 sm:w-1.5 bg-black/40 pointer-events-none" />
                            <div className="absolute top-0 left-1 sm:left-1.5 bottom-0 w-px bg-white/10 pointer-events-none" />

                            {/* Bookmark Ribbon on top */}
                            <div className="absolute -top-0.5 right-1 sm:right-2 z-10 w-2 h-3.5 sm:w-2.5 sm:h-5 bg-gradient-to-b from-pink-500 to-rose-600 shadow-md [clip-path:polygon(0_0,100%_0,100%_100%,50%_75%,0_100%)] opacity-90 group-hover:h-5 sm:group-hover:h-6 transition-all" />

                            {/* Top Card Bar */}
                            <div className="relative z-10 flex items-center justify-between gap-0.5">
                              <button
                                onClick={(e) => onToggleFavorite(book.id, e)}
                                className="p-0.5 sm:p-1 rounded-full bg-black/75 text-white/70 hover:text-[var(--accent-pink)] transition"
                                title={book.favorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                              >
                                <Heart
                                  className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${
                                    book.favorite
                                      ? 'fill-[var(--accent-pink)] text-[var(--accent-pink)]'
                                      : ''
                                  }`}
                                />
                              </button>

                              <span className="text-[6px] sm:text-[8px] font-mono uppercase bg-black/75 px-1 sm:px-1.5 py-0.2 rounded-full text-[var(--accent-purple)] border border-white/5 leading-tight">
                                {book.type === 'epub'
                                  ? 'EPUB'
                                  : book.type === 'pdf'
                                  ? 'PDF'
                                  : 'NEKO'}
                              </span>
                            </div>

                            {/* Center Cover Graphic (only when no public/embedded cover image is active) */}
                            {(!book.coverImage || brokenCoverIds[book.id] || !sanitizeImageUrl(book.coverImage)) ? (
                              <div className="relative z-10 text-center my-auto py-0.5">
                                <span className="text-base sm:text-xl md:text-2xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] transform group-hover:scale-105 transition-transform block leading-none">
                                  {normalizeBookEmoji(book.emoji)}
                                </span>
                                <h4 className="dark-reborn-font font-bold text-[8px] sm:text-[10px] md:text-[11px] text-white line-clamp-2 mt-0.5 sm:mt-1 px-0.5 leading-tight group-hover:text-[var(--accent-pink)] transition">
                                  {book.title}
                                </h4>
                                <p className="hidden sm:block text-[8px] md:text-[9px] text-[var(--text-muted)] line-clamp-1 mt-0.5">
                                  {book.author}
                                </p>
                              </div>
                            ) : (
                              <div className="relative z-10 mt-auto pb-0.5 text-left">
                                <h4 className="font-semibold text-[8px] sm:text-[10px] text-white/95 line-clamp-1 leading-tight drop-shadow">
                                  {book.title}
                                </h4>
                              </div>
                            )}

                            {/* Bottom: Reading Progress Indicator */}
                            <div className="relative z-10">
                              <div className="flex items-center justify-between text-[7px] sm:text-[8px] font-mono text-[var(--text-muted)] mb-0.5 leading-none">
                                <span>{percent}%</span>
                                <span className="hidden sm:inline">Pág. {book.currentPage || 1}</span>
                              </div>
                              <div className="w-full bg-black/60 h-[3px] sm:h-1 rounded-full overflow-hidden border border-white/5">
                                <div
                                  className="h-full bg-gradient-to-r from-[var(--accent-pink)] to-[var(--accent-purple)] transition-all duration-300"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>

                            {/* Quick Action Overlay - Solo aparece al mantener presionado el libro */}
                            {isMarked && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute bottom-1 inset-x-0.5 sm:inset-x-1.5 z-40 flex items-center justify-around gap-0.5 sm:gap-1 bg-black/95 border border-[var(--accent-pink)]/60 rounded-md sm:rounded-lg py-0.5 sm:py-1 px-0.5 sm:px-1 shadow-xl animate-popIn"
                              >
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    onChangeCategory(
                                      book.id,
                                      book.category === 'completed' ? 'reading' : 'completed',
                                      e
                                    );
                                    setMarkedForDeleteIds((prev) => prev.filter((id) => id !== book.id));
                                  }}
                                  className="p-1 rounded-md bg-white/5 hover:bg-white/15 text-xs text-[var(--accent-purple)] transition"
                                  title={
                                    book.category === 'completed'
                                      ? 'Marcar como en lectura'
                                      : 'Marcar como leído'
                                  }
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    onChangeCategory(
                                      book.id,
                                      book.category === 'abandoned' ? 'reading' : 'abandoned',
                                      e
                                    );
                                    setMarkedForDeleteIds((prev) => prev.filter((id) => id !== book.id));
                                  }}
                                  className="p-1 rounded-md bg-white/5 hover:bg-white/15 text-xs text-rose-300 transition"
                                  title={
                                    book.category === 'abandoned'
                                      ? 'Reanudar lectura'
                                      : 'Marcar como pausado'
                                  }
                                >
                                  🥀
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    onDeleteBook(book.id, e);
                                    setMarkedForDeleteIds((prev) => prev.filter((id) => id !== book.id));
                                  }}
                                  className="p-1 rounded-md bg-rose-600/20 hover:bg-rose-600 text-xs text-rose-300 hover:text-white transition"
                                  title="Eliminar libro"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* MODE 2: SPINES VIEW (Lomos verticales, decoraciones y sujetalibros movibles) */}
                {viewMode === 'spines' && (
                  <div className="flex items-end justify-center gap-1.5 sm:gap-2 px-1 sm:px-3 pt-2 pb-0 overflow-visible min-h-[172px] sm:min-h-[188px]">
                    {rowSlots.map((slot) => {
                      const isTouchingCurrent = touchActiveSlotId === slot.slotId;
                      const isDraggingCurrent = draggedSlotId === slot.slotId || isTouchingCurrent;
                      const isDropTarget = (dragOverSlotId === slot.slotId || touchOverSlotId === slot.slotId) && !isDraggingCurrent;

                      if (slot.kind === 'decor' || slot.kind === 'bookend') {
                        const isDecorSelected = selectedDecorSlotId === slot.slotId;
                        return (
                          <div
                            key={slot.slotId}
                            data-slot-id={slot.slotId}
                            draggable={true}
                            onDragStart={(e) => {
                              setSelectedDecorSlotId(null);
                              handleSlotDragStart(e, slot.slotId);
                            }}
                            onDragOver={(e) => handleSlotDragOver(e, slot.slotId)}
                            onDragLeave={(e) => handleSlotDragLeave(e, slot.slotId)}
                            onDrop={(e) => handleSlotDrop(e, slot.slotId)}
                            onDragEnd={handleSlotDragEnd}
                            onMouseDown={() => handlePressStart(slot.slotId, 'decor')}
                            onMouseUp={handlePressEnd}
                            onMouseLeave={handlePressEnd}
                            onTouchStart={(e) => handleSlotTouchStart(slot.slotId, e, undefined, 'decor')}
                            onTouchMove={(e) => handleSlotTouchMove(slot.slotId, e)}
                            onTouchEnd={handleSlotTouchEnd}
                            onTouchCancel={handleSlotTouchCancel}
                            style={{
                              touchAction: 'pan-y',
                              zIndex: isTouchingCurrent ? 60 : isDecorSelected ? 35 : undefined,
                              pointerEvents: isTouchingCurrent ? 'none' : 'auto',
                            }}
                            className={`group relative self-end mb-[-3px] shrink-0 cursor-grab active:cursor-grabbing flex items-end justify-center transition-all duration-200 select-none ${
                              slot.kind === 'bookend'
                                ? 'w-[38px] sm:w-[50px] h-[90px] sm:h-[118px]'
                                : 'w-[54px] sm:w-[66px] h-[84px] sm:h-[104px]'
                            } ${
                              isTouchingCurrent
                                ? 'scale-105 shadow-[0_20px_45px_rgba(255,121,198,0.7)] ring-2 ring-[var(--accent-pink)] transition-none rounded-lg'
                                : ''
                            } ${
                              isDecorSelected
                                ? 'ring-2 ring-rose-400 bg-rose-500/10 rounded-lg scale-[1.03]'
                                : ''
                            } ${
                              draggedSlotId === slot.slotId ? 'opacity-40 scale-95' : ''
                            } ${
                              isDropTarget
                                ? 'ring-4 ring-[var(--accent-pink)] scale-105 shadow-[0_0_20px_rgba(255,121,198,0.8)] z-30 rounded-lg'
                                : ''
                            }`}
                          >
                            {onUpdateShelfDecorConfig && !isTouchingCurrent && (
                              <button
                                type="button"
                                onMouseDown={(e) => e.stopPropagation()}
                                onTouchStart={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (slot.kind === 'decor') {
                                    handleRemoveDecorProp(slot.propId);
                                  } else {
                                    handleRemoveBookend();
                                  }
                                }}
                                className={`absolute -top-2 -right-1.5 z-50 w-5 h-5 rounded-full text-white border flex items-center justify-center shadow-lg transition active:scale-90 cursor-pointer ${
                                  isDecorSelected
                                    ? 'opacity-100 bg-rose-600 border-white'
                                    : 'opacity-0 group-hover:opacity-100 focus:opacity-100 bg-black/85 hover:bg-rose-600 border-white/40'
                                }`}
                                title={slot.kind === 'decor' ? 'Quitar esta decoración' : 'Quitar sujetalibros'}
                                aria-label={slot.kind === 'decor' ? 'Quitar esta decoración' : 'Quitar sujetalibros'}
                              >
                                <X className="w-3 h-3 stroke-[2.75]" />
                              </button>
                            )}
                            {isDropTarget && (
                              <div className="absolute inset-0 z-40 bg-[var(--accent-pink)]/20 rounded-lg flex items-center justify-center pointer-events-none border border-[var(--accent-pink)]">
                                <span className="text-[8px] font-bold text-white bg-black/90 px-1 py-0.5 rounded shadow">
                                  ✨
                                </span>
                              </div>
                            )}
                            {slot.kind === 'decor' ? (
                              <ShelfDecoration
                                type={slot.propId}
                                compact
                                inSlot
                                onBeforeClick={() => !suppressClickRef.current && !isTouchDragging.current}
                              />
                            ) : (
                              <ShelfBookend
                                id={slot.bookendId}
                                side={slot.side}
                                compact
                                inSlot
                                onBeforeClick={() => !suppressClickRef.current && !isTouchDragging.current}
                              />
                            )}
                          </div>
                        );
                      }

                      const book = slot.book;
                      const isMarked = isBookMarked(book.id);
                      const spineWidth = viewportWidth < 420 ? '36px' : viewportWidth < 640 ? '38px' : '38px';
                      const spineHeight = viewportWidth < 640 ? '164px' : '175px';

                      return (
                        <div
                          key={book.id}
                          data-slot-id={slot.slotId}
                          data-book-id={book.id}
                          draggable={true}
                          onDragStart={(e) => handleSlotDragStart(e, slot.slotId)}
                          onDragOver={(e) => handleSlotDragOver(e, slot.slotId)}
                          onDragLeave={(e) => handleSlotDragLeave(e, slot.slotId)}
                          onDrop={(e) => handleSlotDrop(e, slot.slotId)}
                          onDragEnd={handleSlotDragEnd}
                          onTouchStart={(e) => handleSlotTouchStart(slot.slotId, e, book.id)}
                          onTouchMove={(e) => handleSlotTouchMove(slot.slotId, e)}
                          onTouchEnd={handleSlotTouchEnd}
                          onTouchCancel={handleSlotTouchCancel}
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
                            background: resolveCoverGradient(book.coverGradient),
                            width: spineWidth,
                            height: spineHeight,
                            boxShadow: '3px 0 10px rgba(0,0,0,0.5)',
                            touchAction: 'pan-y',
                            zIndex: isTouchingCurrent ? 60 : undefined,
                            pointerEvents: isTouchingCurrent ? 'none' : 'auto'
                          }}
                          className={`relative group cursor-grab active:cursor-grabbing flex flex-col justify-between p-1.5 rounded-t-md transition-all duration-200 border-x border-t border-white/10 select-none ${
                            isTouchingCurrent 
                              ? 'scale-105 shadow-[0_20px_45px_rgba(255,121,198,0.7)] ring-2 ring-[var(--accent-pink)] transition-none' 
                              : ''
                          } ${
                            draggedSlotId === slot.slotId ? 'opacity-40 scale-95' : ''
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
                          <span className="text-sm block text-center">{normalizeBookEmoji(book.emoji)}</span>
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

                {/* MODE 3: STACKS VIEW (Pilas de libros acostados + decoraciones y sujetalibros movibles) */}
                {viewMode === 'stacks' && (() => {
                  type StackSegment =
                    | { kind: 'pile'; key: string; books: Book[] }
                    | { kind: 'slot'; slot: Exclude<ShelfSlotItem, { kind: 'book' }> };

                  const segments: StackSegment[] = [];
                  let currentPile: Book[] = [];

                  rowSlots.forEach((slot, idx) => {
                    if (slot.kind === 'book') {
                      currentPile.push(slot.book);
                      if (currentPile.length === 4) {
                        segments.push({ kind: 'pile', key: `pile-${shelfIndex}-${idx}`, books: currentPile });
                        currentPile = [];
                      }
                    } else {
                      if (currentPile.length > 0) {
                        segments.push({ kind: 'pile', key: `pile-${shelfIndex}-${idx}`, books: currentPile });
                        currentPile = [];
                      }
                      segments.push({ kind: 'slot', slot });
                    }
                  });
                  if (currentPile.length > 0) {
                    segments.push({ kind: 'pile', key: `pile-${shelfIndex}-end`, books: currentPile });
                  }

                  return (
                    <div className="flex flex-wrap sm:flex-nowrap items-end justify-center gap-2 sm:gap-3 px-1 sm:px-3 pt-2 pb-0">
                      {segments.map((seg) => {
                        if (seg.kind === 'slot') {
                          const slot = seg.slot;
                          const isTouchingCurrent = touchActiveSlotId === slot.slotId;
                          const isDraggingCurrent = draggedSlotId === slot.slotId || isTouchingCurrent;
                          const isDropTarget = (dragOverSlotId === slot.slotId || touchOverSlotId === slot.slotId) && !isDraggingCurrent;
                          const isDecorSelected = selectedDecorSlotId === slot.slotId;

                          return (
                            <div
                              key={slot.slotId}
                              data-slot-id={slot.slotId}
                              draggable={true}
                              onDragStart={(e) => {
                                setSelectedDecorSlotId(null);
                                handleSlotDragStart(e, slot.slotId);
                              }}
                              onDragOver={(e) => handleSlotDragOver(e, slot.slotId)}
                              onDragLeave={(e) => handleSlotDragLeave(e, slot.slotId)}
                              onDrop={(e) => handleSlotDrop(e, slot.slotId)}
                              onDragEnd={handleSlotDragEnd}
                              onMouseDown={() => handlePressStart(slot.slotId, 'decor')}
                              onMouseUp={handlePressEnd}
                              onMouseLeave={handlePressEnd}
                              onTouchStart={(e) => handleSlotTouchStart(slot.slotId, e, undefined, 'decor')}
                              onTouchMove={(e) => handleSlotTouchMove(slot.slotId, e)}
                              onTouchEnd={handleSlotTouchEnd}
                              onTouchCancel={handleSlotTouchCancel}
                              style={{
                                touchAction: 'pan-y',
                                zIndex: isTouchingCurrent ? 60 : isDecorSelected ? 35 : undefined,
                                pointerEvents: isTouchingCurrent ? 'none' : 'auto',
                              }}
                              className={`group relative self-end mb-[-3px] shrink-0 cursor-grab active:cursor-grabbing flex items-end justify-center transition-all duration-200 select-none ${
                                slot.kind === 'bookend'
                                  ? 'w-[38px] sm:w-[50px] h-[90px] sm:h-[118px]'
                                  : 'w-[54px] sm:w-[66px] h-[84px] sm:h-[104px]'
                              } ${
                                isTouchingCurrent
                                  ? 'scale-105 shadow-[0_20px_45px_rgba(255,121,198,0.7)] ring-2 ring-[var(--accent-pink)] transition-none rounded-lg'
                                  : ''
                              } ${
                                isDecorSelected
                                  ? 'ring-2 ring-rose-400 bg-rose-500/10 rounded-lg scale-[1.03]'
                                  : ''
                              } ${
                                draggedSlotId === slot.slotId ? 'opacity-40 scale-95' : ''
                              } ${
                                isDropTarget
                                  ? 'ring-4 ring-[var(--accent-pink)] scale-105 shadow-[0_0_20px_rgba(255,121,198,0.8)] z-30 rounded-lg'
                                  : ''
                              }`}
                            >
                              {onUpdateShelfDecorConfig && !isTouchingCurrent && (
                                <button
                                  type="button"
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onTouchStart={(e) => e.stopPropagation()}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (slot.kind === 'decor') {
                                      handleRemoveDecorProp(slot.propId);
                                    } else {
                                      handleRemoveBookend();
                                    }
                                  }}
                                  className={`absolute -top-2 -right-1.5 z-50 w-5 h-5 rounded-full text-white border flex items-center justify-center shadow-lg transition active:scale-90 cursor-pointer ${
                                    isDecorSelected
                                      ? 'opacity-100 bg-rose-600 border-white'
                                      : 'opacity-0 group-hover:opacity-100 focus:opacity-100 bg-black/85 hover:bg-rose-600 border-white/40'
                                  }`}
                                  title={slot.kind === 'decor' ? 'Quitar esta decoración' : 'Quitar sujetalibros'}
                                  aria-label={slot.kind === 'decor' ? 'Quitar esta decoración' : 'Quitar sujetalibros'}
                                >
                                  <X className="w-3 h-3 stroke-[2.75]" />
                                </button>
                              )}
                              {isDropTarget && (
                                <div className="absolute inset-0 z-40 bg-[var(--accent-pink)]/20 rounded-lg flex items-center justify-center pointer-events-none border border-[var(--accent-pink)]">
                                  <span className="text-[8px] font-bold text-white bg-black/90 px-1 py-0.5 rounded shadow">
                                    ✨
                                  </span>
                                </div>
                              )}
                              {slot.kind === 'decor' ? (
                                <ShelfDecoration
                                  type={slot.propId}
                                  compact
                                  inSlot
                                  onBeforeClick={() => !suppressClickRef.current && !isTouchDragging.current}
                                />
                              ) : (
                                <ShelfBookend
                                  id={slot.bookendId}
                                  side={slot.side}
                                  compact
                                  inSlot
                                  onBeforeClick={() => !suppressClickRef.current && !isTouchDragging.current}
                                />
                              )}
                            </div>
                          );
                        }

                        return (
                          <div
                            key={seg.key}
                            className="flex-1 min-w-[110px] max-w-[230px] flex flex-col-reverse gap-[2px] items-stretch justify-start"
                          >
                            {seg.books.map((book, stackIdx) => {
                              const slotId = `book:${book.id}`;
                              const isMarked = isBookMarked(book.id);
                              const isTouchingCurrent = touchActiveSlotId === slotId;
                              const isDraggingCurrent = draggedSlotId === slotId || isTouchingCurrent;
                              const isDropTarget = (dragOverSlotId === slotId || touchOverSlotId === slotId) && !isDraggingCurrent;
                              const stackOffsetPx = stackIdx === 1 ? 2 : stackIdx === 2 ? -2 : stackIdx === 3 ? 1 : 0;

                              return (
                                <div
                                  key={book.id}
                                  data-slot-id={slotId}
                                  data-book-id={book.id}
                                  draggable={true}
                                  onDragStart={(e) => handleSlotDragStart(e, slotId)}
                                  onDragOver={(e) => handleSlotDragOver(e, slotId)}
                                  onDragLeave={(e) => handleSlotDragLeave(e, slotId)}
                                  onDrop={(e) => handleSlotDrop(e, slotId)}
                                  onDragEnd={handleSlotDragEnd}
                                  onTouchStart={(e) => handleSlotTouchStart(slotId, e, book.id)}
                                  onTouchMove={(e) => handleSlotTouchMove(slotId, e)}
                                  onTouchEnd={handleSlotTouchEnd}
                                  onTouchCancel={handleSlotTouchCancel}
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
                                    background: resolveCoverGradient(book.coverGradient),
                                    touchAction: 'pan-y',
                                    transform: stackOffsetPx !== 0 ? `translateX(${stackOffsetPx}px)` : undefined,
                                    zIndex: isTouchingCurrent ? 60 : stackIdx + 1,
                                    pointerEvents: isTouchingCurrent ? 'none' : 'auto'
                                  }}
                                  className={`relative group cursor-grab active:cursor-grabbing px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-md border border-white/15 border-b-2 border-b-black/50 transition-all duration-200 flex items-center justify-between gap-1.5 shadow-[0_2px_5px_rgba(0,0,0,0.65)] select-none min-h-[28px] sm:min-h-[32px] ${
                                    isTouchingCurrent
                                      ? 'scale-105 shadow-[0_14px_30px_rgba(255,121,198,0.7)] ring-2 ring-[var(--accent-pink)] transition-none'
                                      : ''
                                  } ${
                                    draggedSlotId === slotId ? 'opacity-40 scale-95' : ''
                                  } ${
                                    isDropTarget ? 'ring-2 ring-[var(--accent-pink)] scale-[1.03] shadow-[0_0_16px_rgba(255,121,198,0.8)] z-30' : ''
                                  } ${
                                    isMarked
                                      ? 'ring-2 ring-rose-500 scale-[1.02] shadow-[0_0_16px_rgba(244,63,94,0.75)] z-20'
                                      : 'hover:-translate-y-0.5'
                                  }`}
                                  title={`${book.title} — ${book.author} (${isMarked ? 'Marcado para eliminar' : 'Mantén presionado para opciones o desliza para mover'})`}
                                >
                                  <div className="absolute right-0.5 top-1 bottom-1 w-[2px] rounded-full bg-amber-100/20 pointer-events-none" />

                                  {isDropTarget && (
                                    <div className="absolute inset-0 z-40 bg-[var(--accent-pink)]/25 rounded-md flex items-center justify-center pointer-events-none border border-[var(--accent-pink)]">
                                      <span className="text-[9px] font-bold text-white bg-black/90 px-1.5 py-0.5 rounded-full shadow">
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
                                      className="absolute -top-2 -left-1.5 z-50 w-5 h-5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] flex items-center justify-center shadow border border-white cursor-pointer active:scale-90 animate-popIn"
                                      title="Eliminar de la estantería ahora"
                                    >
                                      ✕
                                    </button>
                                  )}

                                  <div className="flex items-center gap-1.5 overflow-hidden min-w-0">
                                    <span className="text-xs sm:text-sm shrink-0 leading-none">{normalizeBookEmoji(book.emoji)}</span>
                                    <h4 className="text-[10px] sm:text-[11px] font-bold text-white truncate leading-tight">
                                      {book.title}
                                    </h4>
                                  </div>
                                  <span className="text-[9px] font-mono font-bold text-[var(--accent-pink)] shrink-0 pr-1">
                                    {book.progressPercent || 0}%
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
                </div>

                {/* The Physical 3D Shelf Ledge / Plank with Brackets & Niche Shadow */}
                <div
                  className="bookcase-plank-wrap"
                  aria-hidden="true"
                  style={
                    isDepthTransitioning
                      ? { animationDelay: `${Math.min(shelfIndex * 55, 280)}ms` }
                      : undefined
                  }
                >
                  <div className="bookcase-plank-top" />
                  <div className="bookcase-plank-front">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/15" />
                    <span className="text-[8px] font-mono tracking-widest uppercase text-white/25">
                      {shelfStyle === 'wood-gothic'
                        ? '✦ ✦ ✦'
                        : shelfStyle === 'digital-neon'
                        ? '━━━━━'
                        : shelfStyle === 'digital-cyber'
                        ? '[ NODE ]'
                        : ''}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-white/15" />
                  </div>
                  <div className="bookcase-plank-brackets">
                    <div className="bookcase-plank-shadow" />
                    <div className="bookcase-bracket-left" />
                    <div className="bookcase-bracket-right" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls for Large Libraries (Supports up to 2000 books smoothly) */}
          {totalPages > 1 && (
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-5 mt-3 border-t border-white/10 text-xs">
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

            {/* Right Vertical Bookcase Frame Pillar */}
            <div className="bookcase-pillar" aria-hidden="true" />
          </div>

          {/* Bottom Bookcase Plinth / Base */}
          <div className="bookcase-base" aria-hidden="true" />
        </div>
      )}

    </div>
  );
};
