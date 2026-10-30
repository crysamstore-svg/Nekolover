import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Heart, 
  Trash2, 
  BookOpen, 
  RotateCcw, 
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
  Image as ImageIcon
} from 'lucide-react';
import { Book, BookCategory, ShelfStyle, ShelfViewMode, ShelfBackgroundConfig } from '../types';
import { ShelfBackgroundModal, DEFAULT_SHELF_BG } from './ShelfBackgroundModal';

interface BookshelfProps {
  books: Book[];
  onOpenBook: (book: Book) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onDeleteBook: (id: string, e: React.MouseEvent) => void;
  onChangeCategory: (id: string, category: 'reading' | 'unread' | 'completed' | 'abandoned', e: React.MouseEvent) => void;
  onRestoreDefaults: () => void;
  onTriggerUpload: () => void;
  onNavigateToStats?: () => void;
  onOpenSettings?: () => void;
  shelfStyle?: ShelfStyle;
  onShelfStyleChange?: (style: ShelfStyle) => void;
  viewMode?: ShelfViewMode;
  onViewModeChange?: (mode: ShelfViewMode) => void;
  shelfBgConfig?: ShelfBackgroundConfig;
  onUpdateShelfBgConfig?: (config: ShelfBackgroundConfig) => void;
}

export const Bookshelf: React.FC<BookshelfProps> = ({
  books,
  onOpenBook,
  onToggleFavorite,
  onDeleteBook,
  onChangeCategory,
  onRestoreDefaults,
  onTriggerUpload,
  onNavigateToStats,
  onOpenSettings,
  shelfStyle: propShelfStyle,
  onShelfStyleChange,
  viewMode: propViewMode,
  onViewModeChange,
  shelfBgConfig,
  onUpdateShelfBgConfig
}) => {
  const [activeCategory, setActiveCategory] = useState<BookCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'progress' | 'title'>('recent');
  const [isBgModalOpen, setIsBgModalOpen] = useState<boolean>(false);

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

  // Filter books
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

  // Sort books
  const sortedBooks = [...filteredBooks].sort((a, b) => {
    if (sortBy === 'progress') {
      return (b.progressPercent || 0) - (a.progressPercent || 0);
    }
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    }
    return (b.lastReadAt || b.addedAt) - (a.lastReadAt || a.addedAt);
  });

  // Stats
  const totalBooks = books.length;
  const readingCount = books.filter((b) => b.category === 'reading').length;
  const unreadCount = books.filter((b) => b.category === 'unread').length;
  const completedCount = books.filter((b) => b.category === 'completed').length;
  const abandonedCount = books.filter((b) => b.category === 'abandoned').length;
  const favoritesCount = books.filter((b) => b.favorite).length;

  // Chunk books for shelf levels depending on viewMode
  // Covers: 4 per shelf | Spines: 7 per shelf | Stacks: 4 piles per shelf
  const chunkSize = viewMode === 'spines' ? 7 : 4;
  const shelves: Book[][] = [];
  for (let i = 0; i < sortedBooks.length; i += chunkSize) {
    shelves.push(sortedBooks.slice(i, i + chunkSize));
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
    <div className="p-3 sm:p-6 max-w-7xl mx-auto w-full flex-1 flex flex-col">
      {/* Controls Bar: Categories, Search, Shelf Styles & View Modes */}
      <div className="flex flex-col gap-3 mb-6 bg-[var(--card-bg)] p-3 sm:p-4 rounded-2xl border border-[var(--border-color)] shadow-xl transition-colors">
        {/* Top Controls Row: Category Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1 shrink-0 ${
              activeCategory === 'all'
                ? 'bg-[var(--accent-pink)] text-black shadow-md'
                : 'bg-black/40 text-[var(--text-muted)] hover:text-white hover:bg-black/60'
            }`}
          >
            <span>🐾 Todos</span>
            <span className="text-[10px] opacity-80">({totalBooks})</span>
          </button>

          <button
            onClick={() => setActiveCategory('reading')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1 shrink-0 ${
              activeCategory === 'reading'
                ? 'bg-[var(--accent-pink)] text-black shadow-md'
                : 'bg-black/40 text-[var(--text-muted)] hover:text-white hover:bg-black/60'
            }`}
          >
            <span>📖 Leyendo</span>
            <span className="text-[10px] opacity-80">({readingCount})</span>
          </button>

          <button
            onClick={() => setActiveCategory('unread')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1 shrink-0 ${
              activeCategory === 'unread'
                ? 'bg-[var(--accent-pink)] text-black shadow-md'
                : 'bg-black/40 text-[var(--text-muted)] hover:text-white hover:bg-black/60'
            }`}
          >
            <span>⏳ Pendientes</span>
            <span className="text-[10px] opacity-80">({unreadCount})</span>
          </button>

          <button
            onClick={() => setActiveCategory('completed')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1 shrink-0 ${
              activeCategory === 'completed'
                ? 'bg-[var(--accent-pink)] text-black shadow-md'
                : 'bg-black/40 text-[var(--text-muted)] hover:text-white hover:bg-black/60'
            }`}
          >
            <span>✨ Leídos</span>
            <span className="text-[10px] opacity-80">({completedCount})</span>
          </button>

          <button
            onClick={() => setActiveCategory('abandoned')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1 shrink-0 ${
              activeCategory === 'abandoned'
                ? 'bg-rose-500 text-white shadow-md'
                : 'bg-black/40 text-[var(--text-muted)] hover:text-white hover:bg-black/60'
            }`}
            title="Libros que has decidido pausar o abandonar"
          >
            <span>🥀 Abandonados</span>
            <span className="text-[10px] opacity-80">({abandonedCount})</span>
          </button>

          <button
            onClick={() => setActiveCategory('favorites')}
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

        {/* Bottom Controls Row: Search, 3 View Modes, Shelf Style & Decorations */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-t border-white/5">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[180px] sm:max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--accent-purple)]/60" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar título o autor..."
              className="w-full bg-black/40 border border-[var(--border-color)] rounded-xl pl-8 pr-8 py-1.5 text-xs text-white placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-pink)] transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* 3 View Modes: Cubiertas, Lomos, Acostados */}
            <div className="flex items-center bg-black/40 border border-[var(--border-color)] rounded-xl p-0.5">
              <button
                onClick={() => handleSetViewMode('covers')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                  viewMode === 'covers'
                    ? 'bg-[var(--accent-pink)] text-black shadow-sm font-bold'
                    : 'text-[var(--text-muted)] hover:text-white'
                }`}
                title="Vista de portadas frontales completas"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Portadas</span>
              </button>

              <button
                onClick={() => handleSetViewMode('spines')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                  viewMode === 'spines'
                    ? 'bg-[var(--accent-pink)] text-black shadow-sm font-bold'
                    : 'text-[var(--text-muted)] hover:text-white'
                }`}
                title="Vista de lomos verticales alineados en estantería"
              >
                <Library className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Lomos</span>
              </button>

              <button
                onClick={() => handleSetViewMode('stacks')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                  viewMode === 'stacks'
                    ? 'bg-[var(--accent-pink)] text-black shadow-sm font-bold'
                    : 'text-[var(--text-muted)] hover:text-white'
                }`}
                title="Vista de libros acostados / apilados horizontalmente"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Acostados</span>
              </button>
            </div>

            {/* Custom Shelf Style Selector (Madera o Digital) */}
            <div className="flex items-center gap-1 bg-black/40 border border-[var(--border-color)] rounded-xl px-2.5 py-1 text-xs text-[var(--text-main)]">
              <Palette className="w-3 h-3 text-[var(--accent-pink)]" />
              <select
                value={shelfStyle}
                onChange={(e) => handleSetShelfStyle(e.target.value as ShelfStyle)}
                aria-label="Personalizar estilo de estantería"
                className="bg-transparent text-[11px] focus:outline-none cursor-pointer text-[var(--text-main)]"
              >
                <option value="wood-gothic" className="bg-[#1a1726]">🪵 Madera Caoba Gótica</option>
                <option value="wood-oak" className="bg-[#1a1726]">🌲 Roble Oscuro & Ébano</option>
                <option value="digital-neon" className="bg-[#1a1726]">⚡ Digital Neón Cristal</option>
                <option value="digital-cyber" className="bg-[#1a1726]">🔮 Digital Cyber Grid</option>
                <option value="minimal-oled" className="bg-[#1a1726]">🖤 Digital Minimalista OLED</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1 bg-black/40 border border-[var(--border-color)] rounded-xl px-2 py-1 text-xs text-[var(--text-main)]">
              <SlidersHorizontal className="w-3 h-3 text-[var(--accent-pink)]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'recent' | 'progress' | 'title')}
                aria-label="Ordenar libros por"
                className="bg-transparent text-[11px] focus:outline-none cursor-pointer text-[var(--text-main)]"
              >
                <option value="recent" className="bg-[#1a1726]">Recientes</option>
                <option value="progress" className="bg-[#1a1726]">Progreso</option>
                <option value="title" className="bg-[#1a1726]">Título (A-Z)</option>
              </select>
            </div>

            {/* Shortcut to Stats */}
            {onNavigateToStats && (
              <button
                onClick={onNavigateToStats}
                className="px-2.5 py-1.5 bg-black/40 border border-[var(--border-color)] hover:border-[var(--accent-pink)] rounded-xl text-xs text-[var(--accent-pink)] font-cute flex items-center gap-1.5 transition shrink-0"
                title="Ver panel de estadísticas y gráficos de lectura"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Gráficos</span>
              </button>
            )}

            {/* Custom Background Photo / Texture Modal Button */}
            <button
              onClick={() => setIsBgModalOpen(true)}
              className="px-2.5 py-1.5 bg-black/40 border border-[var(--border-color)] hover:border-[var(--accent-pink)] rounded-xl text-xs text-[var(--accent-pink)] font-semibold flex items-center gap-1.5 transition shrink-0 hover:bg-[var(--accent-pink)]/10"
              title="Personalizar fondo de la estantería con tus fotos o texturas"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Fondo con Foto</span>
              {shelfBgConfig?.customImage && (
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-pink)] animate-pulse" />
              )}
            </button>

            {/* Shortcut to Dedicated Settings Page (3 Dots) */}
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
      </div>

      {/* Main Bookshelf Display */}
      {sortedBooks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center bg-[var(--card-bg)]/40 border border-[var(--border-color)] rounded-3xl p-6">
          <div className="flex items-center gap-3 text-4xl mb-3 animate-pulse select-none">
            <span title="Dragón Rosa">🌸🐉</span>
            <span title="Jarrón Gótico">🏺</span>
            <span title="Gato Negro">🐈‍⬛</span>
          </div>
          <h3 className="dark-reborn-font text-lg text-[var(--accent-pink)] font-bold mb-1">
            Ningún tomo en esta sección
          </h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mb-4">
            {activeCategory === 'abandoned'
              ? 'No tienes ningún libro marcado como abandonado. ¡Todo sigue en marcha!'
              : 'Prueba ajustando el término de búsqueda o añade nuevos tomos en formato EPUB o PDF a tu estantería.'}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onTriggerUpload}
              className="px-4 py-2 bg-[var(--accent-pink)] text-black font-cute font-bold rounded-xl text-xs shadow-lg hover:opacity-90 transition"
            >
              Subir Archivo
            </button>
            <button
              onClick={onRestoreDefaults}
              className="px-4 py-2 bg-black/50 border border-[var(--border-color)] text-[var(--text-muted)] hover:text-white rounded-xl text-xs transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Clásicos</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="conventional-shelf-container p-4 sm:p-6 space-y-8 relative overflow-hidden">
          {/* Custom Photo / Texture Background Layer */}
          {shelfBgConfig?.customImage && (
            <>
              <div 
                className="absolute inset-0 pointer-events-none transition-all duration-300 z-0"
                style={{
                  backgroundImage: `url(${shelfBgConfig.customImage})`,
                  backgroundSize: shelfBgConfig.fit === 'cover' ? 'cover' : '320px',
                  backgroundRepeat: shelfBgConfig.fit === 'cover' ? 'no-repeat' : 'repeat',
                  backgroundPosition: 'center',
                  filter: shelfBgConfig.blur ? `blur(${shelfBgConfig.blur}px)` : undefined,
                  transform: shelfBgConfig.blur ? 'scale(1.05)' : undefined
                }}
              />
              <div 
                className="absolute inset-0 pointer-events-none transition-colors z-0"
                style={{
                  backgroundColor: '#000000',
                  opacity: (shelfBgConfig.overlayDarkness ?? 65) / 100
                }}
              />
            </>
          )}

          {/* Top Library Header */}
          <div className="relative z-10 px-1 py-1 flex items-center justify-between border-b border-[var(--border-color)] pb-3 text-xs text-[var(--text-muted)]">
            <span className="font-bold flex items-center gap-2 text-[var(--accent-pink)]">
              <span>📚</span>
              <span>MI ESTANTERÍA</span>
            </span>
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setIsBgModalOpen(true)}
                className="text-[11px] text-[var(--accent-pink)] hover:text-white flex items-center gap-1.5 transition px-2.5 py-1 rounded-lg bg-black/50 border border-[var(--border-color)] hover:border-[var(--accent-pink)] shadow-sm"
                title="Cambiar foto de fondo o textura de la estantería"
              >
                <ImageIcon className="w-3 h-3 text-[var(--accent-pink)]" />
                <span>{shelfBgConfig?.customImage ? 'Fondo Personalizado' : 'Personalizar Fondo'}</span>
              </button>
              <span className="text-[11px] font-mono text-[var(--text-muted)]">
                {books.length} {books.length === 1 ? 'TOMO' : 'TOMOS'} EN TOTAL
              </span>
            </div>
          </div>

          <div className="space-y-8 relative z-10">
          {shelves.map((shelfBooks, shelfIndex) => (
              <div key={shelfIndex} className="conventional-shelf-row">
              {/* MODE 1: COVERS VIEW (Cubiertas de frente) */}
              {viewMode === 'covers' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6 px-2 sm:px-4 pb-1 items-end">
                  {shelfBooks.map((book) => {
                    const percent = book.progressPercent || 0;
                    return (
                      <div
                        key={book.id}
                        onClick={() => onOpenBook(book)}
                        className="group cursor-pointer flex flex-col items-center transition-transform duration-200 hover:-translate-y-1.5 relative"
                      >
                        {/* Conventional Book Cover Container */}
                        <div className="relative w-full max-w-[190px] aspect-[2/3] rounded-r-lg rounded-l-sm shadow-md overflow-hidden border border-white/10 group-hover:border-[var(--accent-pink)]/50 group-hover:shadow-[0_10px_25px_rgba(0,0,0,0.5)] transition-all flex flex-col justify-between p-3.5 text-left book-cover-shadow">
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

                          {/* Top Card Bar: Favorite button & Type Badge */}
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
                          {/* Mark Completed / Reading */}
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

                          {/* Abandon book toggle */}
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
                                : 'Marcar como abandonado'
                            }
                          >
                            🥀
                          </button>

                          {/* Delete Book from Shelf */}
                          <button
                            onClick={(e) => onDeleteBook(book.id, e)}
                            className="p-1 rounded-lg bg-black/60 hover:bg-red-950 text-xs text-red-400 transition border border-[var(--border-color)]"
                            title="Eliminar libro de la estantería"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  
                </div>
              )}

              {/* MODE 2: SPINES VIEW (Lomos verticales uno al lado del otro) */}
              {viewMode === 'spines' && (
                <div className="flex items-end justify-center gap-2 sm:gap-3 px-4 pb-2 overflow-x-auto min-h-[260px]">
                  {shelfBooks.map((book) => {
                    const percent = book.progressPercent || 0;
                    return (
                      <div
                        key={book.id}
                        onClick={() => onOpenBook(book)}
                        className="group cursor-pointer relative flex flex-col items-center transition-all duration-300 transform hover:-translate-y-4"
                        title={`${book.title} - ${book.author}`}
                      >
                        {/* Vertical Book Spine */}
                        <div 
                          className="w-12 sm:w-16 h-56 sm:h-64 rounded-t-md rounded-b-sm shadow-2xl relative flex flex-col justify-between p-2 border-t border-r border-white/20 overflow-hidden text-center"
                          style={{
                            background:
                              book.coverGradient ||
                              'linear-gradient(180deg, #24141f 0%, #120910 100%)'
                          }}
                        >
                          {/* Spine Ribbon */}
                          <div className="absolute top-0 right-2 w-2.5 h-6 bg-pink-500 shadow-md [clip-path:polygon(0_0,100%_0,100%_100%,50%_75%,0_100%)]" />

                          {/* Top Spine Ornament */}
                          <div className="text-base sm:text-lg mb-1">{book.emoji}</div>

                          {/* Vertical Embossed Title */}
                          <div className="my-auto [writing-mode:vertical-rl] rotate-180 text-[11px] sm:text-xs font-cute font-bold tracking-wider text-white line-clamp-1 max-h-36 mx-auto group-hover:text-[var(--accent-pink)] transition">
                            {book.title}
                          </div>

                          {/* Bottom Spine Band & Progress */}
                          <div className="pt-1 border-t border-white/10 text-[9px] font-mono text-[var(--accent-purple)]">
                            {percent}%
                          </div>
                        </div>

                        {/* Quick Delete overlay button on hover */}
                        <button
                          onClick={(e) => onDeleteBook(book.id, e)}
                          className="absolute -top-3 right-0 p-1 rounded-full bg-red-950 text-red-300 border border-red-500/50 opacity-0 group-hover:opacity-100 transition shadow-lg text-[10px]"
                          title="Eliminar tomo"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* MODE 3: STACKS VIEW (Libros acostados / apilados horizontalmente) */}
              {viewMode === 'stacks' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4 pb-2 items-end">
                  {shelfBooks.map((book) => {
                    const percent = book.progressPercent || 0;
                    return (
                      <div
                        key={book.id}
                        onClick={() => onOpenBook(book)}
                        className="group cursor-pointer flex flex-col justify-end transition-all duration-300 transform hover:-translate-y-2 relative"
                      >
                        {/* Horizontal Flat / Stacked Book */}
                        <div 
                          className="w-full h-14 sm:h-16 rounded-lg shadow-xl border border-white/10 p-2.5 flex items-center justify-between text-left relative overflow-hidden group-hover:shadow-[0_0_20px_rgba(255,121,198,0.3)] transition"
                          style={{
                            background:
                              book.coverGradient ||
                              'linear-gradient(90deg, #1f1a2e 0%, #100d18 100%)'
                          }}
                        >
                          {/* Faux Page Paper Edge on the side */}
                          <div className="absolute right-0 top-0 bottom-0 w-3 bg-gradient-to-r from-amber-100/10 to-amber-100/30 border-l border-black/30 pointer-events-none" />

                          <div className="flex items-center space-x-2.5 min-w-0 pr-4">
                            <span className="text-2xl shrink-0">{book.emoji}</span>
                            <div className="truncate">
                              <h4 className="font-cute font-bold text-xs text-white truncate group-hover:text-[var(--accent-pink)] transition">
                                {book.title}
                              </h4>
                              <p className="text-[10px] text-[var(--text-muted)] truncate">
                                {book.author}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0 pr-2">
                            <span className="text-[10px] font-mono font-bold text-[var(--accent-pink)]">
                              {percent}%
                            </span>
                            <span className="text-[9px] text-[var(--text-muted)] block uppercase font-mono">
                              {book.type}
                            </span>
                          </div>
                        </div>

                        {/* Quick Delete overlay button on hover */}
                        <button
                          onClick={(e) => onDeleteBook(book.id, e)}
                          className="absolute -top-2 right-1 p-1 rounded-full bg-red-950 text-red-300 border border-red-500/50 opacity-0 group-hover:opacity-100 transition shadow-lg text-[10px] z-10"
                          title="Eliminar de la estantería"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Thick Shelf Surface Bar & Soft Shadow */}
              <div className={`conventional-shelf-bar ${shelfClassMap[shelfStyle]} w-full flex items-center justify-between px-4 text-xs relative select-none mt-2.5`}>
                <div className="text-[10px] font-mono tracking-widest uppercase opacity-80 text-center select-none font-bold mx-auto text-white drop-shadow">
                  ESTANTE {shelfIndex + 1}
                </div>
              </div>
              <div className="h-3 w-full bg-black/60 blur-[3px] -mt-1 rounded-full pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
      )}

      {/* Floating Bottom Upload Banner */}
      <div className="mt-12 bg-gradient-to-r from-[var(--card-bg)] via-black/40 to-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3 text-center sm:text-left">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent-pink)]/15 border border-[var(--accent-pink)]/30 flex items-center justify-center text-xl shrink-0">
            📚
          </div>
          <div>
            <h4 className="font-cute font-bold text-sm text-[var(--accent-pink)]">
              ¿Quieres leer tus propios libros?
            </h4>
            <p className="text-xs text-[var(--text-muted)]">
              Sube archivos .EPUB o .PDF sin límite. Se guardan de forma privada y permanente en tu navegador con IndexedDB.
            </p>
          </div>
        </div>
        <button
          onClick={onTriggerUpload}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[var(--accent-pink)] text-black hover:opacity-90 transition flex items-center gap-2 shadow-lg shrink-0 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Añadir Nuevo Libro</span>
        </button>
      </div>

      {/* Shelf Background Texture & Photo Modal */}
      <ShelfBackgroundModal
        isOpen={isBgModalOpen}
        onClose={() => setIsBgModalOpen(false)}
        config={shelfBgConfig || DEFAULT_SHELF_BG}
        onSaveConfig={(cfg) => {
          onUpdateShelfBgConfig?.(cfg);
        }}
      />
    </div>
  );
};
