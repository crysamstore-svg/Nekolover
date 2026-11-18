import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Heart,
  Search,
  Edit3,
  Check,
  X,
  Upload,
  RefreshCw,
  Loader2,
  Bookmark as BookmarkIcon,
  Quote as QuoteIcon,
  Globe,
  RotateCcw
} from 'lucide-react';
import { Book } from '../types';
import { resolveCoverGradient, normalizeBookEmoji } from '../utils/db';
import { sanitizeImageUrl } from '../utils/sanitizeHtml';
import {
  PublicBookCandidate,
  searchPublicBookCatalog,
  applyCandidateToBook,
  autoEnrichBookFromNetwork,
  compressCoverImage,
  cleanBookSearchParts
} from '../utils/bookMetadata';

interface BookDetailModalProps {
  book: Book;
  quotesCountForBook: number;
  bookmarksCountForBook: number;
  onClose: () => void;
  onEnterReader: (book: Book) => void;
  onUpdateBook: (updated: Book, toastMsg?: string) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onChangeCategory: (id: string, category: 'reading' | 'unread' | 'completed' | 'abandoned', e?: React.MouseEvent) => void;
}

export const BookDetailModal: React.FC<BookDetailModalProps> = ({
  book,
  quotesCountForBook,
  bookmarksCountForBook,
  onClose,
  onEnterReader,
  onUpdateBook,
  onToggleFavorite,
  onChangeCategory
}) => {
  const [imgError, setImgError] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showCatalogSearch, setShowCatalogSearch] = useState(false);
  const [candidates, setCandidates] = useState<PublicBookCandidate[]>([]);
  const [customQuery, setCustomQuery] = useState(() => {
    const cleaned = cleanBookSearchParts(book.title, book.author);
    return [cleaned.title, cleaned.author].filter(Boolean).join(' ');
  });

  // Manual edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(book.title);
  const [editAuthor, setEditAuthor] = useState(book.author);
  const [editGenres, setEditGenres] = useState((book.genres || []).join(', '));
  const [editYear, setEditYear] = useState(book.publishedYear || '');
  const [editPublisher, setEditPublisher] = useState(book.publisher || '');
  const [editDescription, setEditDescription] = useState(book.description || '');
  const [expandBio, setExpandBio] = useState(false);

  const coverUploadRef = useRef<HTMLInputElement | null>(null);
  const autoFetchedIdRef = useRef<string | null>(null);

  useEffect(() => {
    setImgError(false);
    setEditTitle(book.title);
    setEditAuthor(book.author);
    setEditGenres((book.genres || []).join(', '));
    setEditYear(book.publishedYear || '');
    setEditPublisher(book.publishedYear ? book.publisher || '' : book.publisher || '');
    setEditDescription(book.description || '');
    const cleaned = cleanBookSearchParts(book.title, book.author);
    setCustomQuery([cleaned.title, cleaned.author].filter(Boolean).join(' '));
  }, [book]);

  // Escape key closes modal
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  // Automatic enrichment on open when book lacks public cover/bio/genres
  useEffect(() => {
    if (book.id === 'demo-neko-1') return;
    if (autoFetchedIdRef.current === book.id) return;

    const missingImportant =
      !book.description ||
      !book.coverImage ||
      !book.genres ||
      book.genres.length === 0 ||
      book.author === 'Documento PDF' ||
      book.author === 'Autor EPUB' ||
      book.author === 'Archivo Local';

    if (!missingImportant) return;
    // If we already fetched via public_api previously and got a cover/description, don't re-run automatically
    if (book.metadataFetchedAt && book.metadataSource === 'public_api' && book.coverImage) return;

    autoFetchedIdRef.current = book.id;
    let cancelled = false;

    const runAutoEnrich = async () => {
      setIsSearching(true);
      setSearchError(null);
      const result = await autoEnrichBookFromNetwork(book);
      if (cancelled) return;

      if (result.candidates.length > 0) {
        setCandidates(result.candidates);
      }
      onUpdateBook(result.updated);
      setIsSearching(false);
    };

    void runAutoEnrich();

    return () => {
      cancelled = true;
    };
  }, [book, onUpdateBook]);

  const handleManualPublicSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSearching(true);
    setSearchError(null);
    setShowCatalogSearch(true);

    const results = await searchPublicBookCatalog(
      book.title,
      book.author,
      customQuery.trim() || undefined
    );

    setIsSearching(false);
    if (results.length === 0) {
      setCandidates([]);
      setSearchError('No encontramos coincidencias exactas. Prueba solo con el título o el apellido del autor.');
    } else {
      setCandidates(results);
    }
  };

  const handleSelectCandidate = (candidate: PublicBookCandidate) => {
    const updated = applyCandidateToBook(book, candidate, true);
    setImgError(false);
    onUpdateBook(updated, '📚 Ficha y portada pública aplicadas al libro.');
    setShowCatalogSearch(false);
  };

  const handleUploadCustomCover = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setSearchError('Selecciona una imagen válida (JPG, PNG o WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const raw = typeof reader.result === 'string' ? reader.result : '';
      if (!raw) return;
      const compressed = await compressCoverImage(raw, 400);
      if (compressed) {
        setImgError(false);
        onUpdateBook(
          {
            ...book,
            coverImage: compressed,
            metadataSource: 'manual',
            metadataFetchedAt: Date.now()
          },
          '🖼️ Portada personalizada guardada.'
        );
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClearCover = () => {
    setImgError(false);
    onUpdateBook(
      {
        ...book,
        coverImage: undefined,
        metadataSource: 'manual'
      },
      'Portada restaurada al estilo de estantería.'
    );
  };

  const handleSaveManualEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedGenres = editGenres
      .split(',')
      .map((g) => g.trim())
      .filter((g) => g.length > 0)
      .slice(0, 6);

    onUpdateBook(
      {
        ...book,
        title: editTitle.trim() || book.title,
        author: editAuthor.trim() || book.author,
        genres: parsedGenres,
        publishedYear: editYear.trim() || undefined,
        publisher: editPublisher.trim() || undefined,
        description: editDescription.trim() || undefined,
        metadataSource: 'manual',
        metadataFetchedAt: Date.now()
      },
      '✨ Biografía y ficha del libro guardadas.'
    );
    setIsEditing(false);
  };

  const safeCover = !imgError ? sanitizeImageUrl(book.coverImage) : null;
  const percent = book.progressPercent || 0;
  const bioText = book.description?.trim() || '';
  const isLongBio = bioText.length > 420;
  const displayedBio = isLongBio && !expandBio ? `${bioText.slice(0, 420).trim()}...` : bioText;

  const metadataParts: string[] = [];
  if (book.genres && book.genres.length > 0) {
    metadataParts.push(book.genres.slice(0, 3).join(' / '));
  }
  if (book.publishedYear) {
    metadataParts.push(book.publishedYear);
  }
  if (book.publisher) {
    metadataParts.push(book.publisher);
  }
  metadataParts.push(book.type === 'epub' ? 'EPUB' : book.type === 'pdf' ? 'PDF' : book.type === 'text' ? 'Texto' : 'Edición Neko');
  if (book.totalPages > 1) {
    metadataParts.push(`${book.totalPages} págs.`);
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md overflow-y-auto p-3 sm:p-6 flex items-start sm:items-center justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="book-detail-title"
    >
      <div
        className="relative w-full max-w-4xl bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl sm:rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.85)] overflow-hidden my-auto modal-animate"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-white/10 bg-black/30">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Estantería</span>
          </button>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={(e) => onToggleFavorite(book.id, e)}
              className={`min-h-[44px] min-w-[44px] px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                book.favorite
                  ? 'bg-[var(--accent-pink)]/20 border-[var(--accent-pink)]/60 text-[var(--accent-pink)]'
                  : 'bg-white/5 border-white/10 text-[var(--text-muted)] hover:text-white'
              }`}
              title={book.favorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
            >
              <Heart className={`w-4 h-4 ${book.favorite ? 'fill-[var(--accent-pink)]' : ''}`} />
              <span className="hidden sm:inline whitespace-nowrap">Favorito</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsEditing((prev) => !prev);
                setShowCatalogSearch(false);
              }}
              className={`min-h-[44px] min-w-[44px] px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                isEditing
                  ? 'bg-[var(--accent-purple)] text-black border-[var(--accent-purple)] font-bold'
                  : 'bg-white/5 border-white/10 text-[var(--text-muted)] hover:text-white'
              }`}
              title="Editar datos manualmente"
            >
              <Edit3 className="w-4 h-4" />
              <span className="hidden sm:inline whitespace-nowrap">{isEditing ? 'Editando' : 'Editar ficha'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] rounded-xl bg-white/5 hover:bg-white/15 text-[var(--text-muted)] hover:text-white flex items-center justify-center transition cursor-pointer"
              aria-label="Cerrar ficha del libro"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main 2-Column Editorial Content */}
        <div className="p-4 sm:p-7 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6 sm:gap-8 items-start">
          {/* Left Column: Cover Showcase & Progress */}
          <div className="flex flex-col items-center md:items-stretch gap-3.5 max-w-[220px] mx-auto w-full">
            <div className="relative w-full aspect-[2/3] rounded-r-xl rounded-l-sm overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.8)] border border-white/15">
              {safeCover ? (
                <img
                  src={safeCover}
                  alt={`Portada de ${book.title}`}
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex flex-col items-center justify-center p-4 text-center"
                  style={{ background: resolveCoverGradient(book.coverGradient) }}
                >
                  <span className="text-5xl mb-3 filter drop-shadow-md">
                    {normalizeBookEmoji(book.emoji)}
                  </span>
                  <p className="dark-reborn-font font-bold text-sm text-white line-clamp-3 leading-snug">
                    {book.title}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1.5 line-clamp-1">
                    {book.author}
                  </p>
                </div>
              )}

              {/* Subtle Book Spine Shading */}
              <div className="absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-black/55 to-transparent pointer-events-none" />
              <div className="absolute inset-y-0 left-2 w-px bg-white/15 pointer-events-none" />
            </div>

            {/* Cover Controls */}
            <input
              ref={coverUploadRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                void handleUploadCustomCover(e.target.files);
                e.target.value = '';
              }}
            />
            <div className="flex items-center justify-center gap-2 w-full">
              <button
                type="button"
                onClick={() => coverUploadRef.current?.click()}
                className="flex-1 min-h-[40px] px-2.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-[var(--text-muted)] hover:text-white flex items-center justify-center gap-1.5 transition whitespace-nowrap cursor-pointer"
                title="Subir una portada desde tu dispositivo"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Portada</span>
              </button>

              {safeCover ? (
                <button
                  type="button"
                  onClick={handleClearCover}
                  className="min-h-[40px] min-w-[40px] px-2.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-[var(--text-muted)] hover:text-white flex items-center justify-center transition cursor-pointer"
                  title="Quitar imagen de portada"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              ) : null}
            </div>

            {/* Reading Progress Summary */}
            <div className="w-full pt-2 border-t border-white/10 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-mono tabular-nums">
                <span>Progreso</span>
                <span>
                  Pág. {book.currentPage || 1} / {Math.max(1, book.totalPages)} ({percent}%)
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-black/60 overflow-hidden border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-[var(--accent-pink)] to-[var(--accent-purple)] transition-all duration-300"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Biography, Metadata & Actions */}
          <div className="flex flex-col gap-5 min-w-0">
            {isEditing ? (
              <form onSubmit={handleSaveManualEdit} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[var(--text-muted)] mb-1">Título del libro</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      required
                      className="w-full h-10 px-3 rounded-xl bg-black/50 border border-[var(--border-color)] text-sm text-white focus:outline-none focus:border-[var(--accent-pink)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--text-muted)] mb-1">Autor / Autora</label>
                    <input
                      type="text"
                      value={editAuthor}
                      onChange={(e) => setEditAuthor(e.target.value)}
                      required
                      className="w-full h-10 px-3 rounded-xl bg-black/50 border border-[var(--border-color)] text-sm text-white focus:outline-none focus:border-[var(--accent-pink)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-[var(--text-muted)] mb-1">Géneros (separados por coma)</label>
                    <input
                      type="text"
                      value={editGenres}
                      onChange={(e) => setEditGenres(e.target.value)}
                      placeholder="Romance Oscuro, Fantasía, Misterio"
                      className="w-full h-10 px-3 rounded-xl bg-black/50 border border-[var(--border-color)] text-sm text-white focus:outline-none focus:border-[var(--accent-pink)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--text-muted)] mb-1">Año</label>
                    <input
                      type="text"
                      value={editYear}
                      onChange={(e) => setEditYear(e.target.value)}
                      placeholder="2024"
                      className="w-full h-10 px-3 rounded-xl bg-black/50 border border-[var(--border-color)] text-sm text-white focus:outline-none focus:border-[var(--accent-pink)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">Editorial / Colección</label>
                  <input
                    type="text"
                    value={editPublisher}
                    onChange={(e) => setEditPublisher(e.target.value)}
                    placeholder="Editorial opcional"
                    className="w-full h-10 px-3 rounded-xl bg-black/50 border border-[var(--border-color)] text-sm text-white focus:outline-none focus:border-[var(--accent-pink)]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">Biografía / Sinopsis del libro</label>
                  <textarea
                    rows={5}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Escribe o pega la sinopsis del libro..."
                    className="w-full p-3 rounded-xl bg-black/50 border border-[var(--border-color)] text-sm text-white leading-relaxed focus:outline-none focus:border-[var(--accent-pink)] resize-y"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="min-h-[44px] px-5 py-2 rounded-xl bg-[var(--accent-pink)] text-black text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Guardar Ficha</span>
                  </button>
                </div>
              </form>
            ) : (
              <>
                {/* Title, Author & Clean Unboxed Metadata */}
                <div className="space-y-2">
                  <h2
                    id="book-detail-title"
                    className="dark-reborn-font text-2xl sm:text-3xl font-bold text-white leading-tight [text-wrap:balance]"
                  >
                    {book.title}
                  </h2>

                  <p className="text-sm sm:text-base font-semibold text-[var(--accent-pink)]">
                    {book.author || 'Autor Desconocido'}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-[var(--text-muted)] pt-0.5">
                    {metadataParts.map((part, idx) => (
                      <React.Fragment key={`${part}-${idx}`}>
                        {idx > 0 && <span aria-hidden="true">·</span>}
                        <span>{part}</span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Reading Status Segmented Control */}
                <div className="flex flex-wrap items-center gap-1.5 p-1 bg-black/40 border border-white/10 rounded-xl w-fit">
                  {(
                    [
                      { id: 'unread', label: 'Por leer' },
                      { id: 'reading', label: 'Leyendo' },
                      { id: 'completed', label: 'Completado' },
                      { id: 'abandoned', label: 'Pausado' }
                    ] as const
                  ).map((st) => {
                    const active = book.category === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={(e) => onChangeCategory(book.id, st.id, e)}
                        className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap shrink-0 cursor-pointer ${
                          active
                            ? st.id === 'completed'
                              ? 'bg-emerald-500 text-black shadow-sm'
                              : st.id === 'abandoned'
                              ? 'bg-rose-500 text-white shadow-sm'
                              : 'bg-[var(--accent-pink)] text-black shadow-sm'
                            : 'text-[var(--text-muted)] hover:text-white'
                        }`}
                      >
                        {st.label}
                      </button>
                    );
                  })}
                </div>

                {/* Synopsis / Book Biography Section */}
                <div className="space-y-2.5 border-t border-white/10 pt-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs font-semibold tracking-wide text-[var(--text-muted)]">
                      Biografía y sinopsis del libro
                    </h3>

                    <button
                      type="button"
                      onClick={() => {
                        if (!showCatalogSearch && candidates.length === 0) {
                          void handleManualPublicSearch();
                        } else {
                          setShowCatalogSearch((prev) => !prev);
                        }
                      }}
                      className="min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-medium text-[var(--accent-purple)] hover:text-white hover:bg-white/5 flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer"
                    >
                      {isSearching ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Globe className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {isSearching
                          ? 'Buscando...'
                          : showCatalogSearch
                          ? 'Ocultar catálogo'
                          : 'Buscar info pública'}
                      </span>
                    </button>
                  </div>

                  {isSearching && !bioText ? (
                    <div className="py-4 text-xs sm:text-sm text-[var(--text-muted)] flex items-center gap-2.5">
                      <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-pink)] shrink-0" />
                      <span>Extrayendo autor, género, sinopsis y portada pública...</span>
                    </div>
                  ) : bioText ? (
                    <div className="space-y-2">
                      <p className="text-sm leading-relaxed text-[var(--text-main)]/95 whitespace-pre-line">
                        {displayedBio}
                      </p>
                      {isLongBio && (
                        <button
                          type="button"
                          onClick={() => setExpandBio((prev) => !prev)}
                          className="text-xs font-semibold text-[var(--accent-pink)] hover:underline cursor-pointer"
                        >
                          {expandBio ? 'Ver menos' : 'Leer sinopsis completa'}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="py-3 text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                      Este tomo todavía no tiene sinopsis guardada. Puedes buscar su ficha y portada pública automáticamente o escribir una manualmente en <strong>Editar ficha</strong>.
                    </div>
                  )}
                </div>

                {/* Public Catalog Search & Edition Picker */}
                {showCatalogSearch && (
                  <div className="border-t border-white/10 pt-4 space-y-3">
                    <form onSubmit={handleManualPublicSearch} className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                        <input
                          type="text"
                          value={customQuery}
                          onChange={(e) => setCustomQuery(e.target.value)}
                          placeholder="Buscar por título o autor..."
                          className="w-full h-11 pl-9 pr-3 rounded-xl bg-black/50 border border-[var(--border-color)] text-xs sm:text-sm text-white focus:outline-none focus:border-[var(--accent-pink)]"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isSearching}
                        className="min-h-[44px] px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition shrink-0 whitespace-nowrap cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSearching ? 'animate-spin' : ''}`} />
                        <span>Buscar edición</span>
                      </button>
                    </form>

                    {searchError && (
                      <p className="text-xs text-rose-300">{searchError}</p>
                    )}

                    {candidates.length > 0 && (
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {candidates.slice(0, 5).map((cand) => (
                          <button
                            key={cand.id}
                            type="button"
                            onClick={() => handleSelectCandidate(cand)}
                            className="w-full text-left p-2.5 rounded-xl bg-black/40 hover:bg-white/10 border border-white/10 hover:border-[var(--accent-pink)]/60 transition flex items-start gap-3 cursor-pointer"
                          >
                            {cand.coverImage ? (
                              <img
                                src={cand.coverImage}
                                alt={cand.title}
                                referrerPolicy="no-referrer"
                                className="w-10 h-14 object-cover rounded shrink-0 bg-black/50"
                              />
                            ) : (
                              <div className="w-10 h-14 rounded bg-white/5 flex items-center justify-center text-base shrink-0">
                                📖
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-xs sm:text-sm font-semibold text-white truncate">
                                {cand.title}
                              </p>
                              <p className="text-xs text-[var(--accent-pink)] truncate">
                                {cand.author}
                                {cand.publishedYear ? ` · ${cand.publishedYear}` : ''}
                              </p>
                              {cand.genres.length > 0 && (
                                <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
                                  {cand.genres.slice(0, 3).join(' · ')}
                                </p>
                              )}
                            </div>
                            <span className="text-[11px] font-semibold text-[var(--accent-purple)] shrink-0 self-center">
                              Usar
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* User's Saved Notes & Bookmarks Summary */}
                {(quotesCountForBook > 0 || bookmarksCountForBook > 0) && (
                  <div className="flex items-center gap-4 text-xs text-[var(--text-muted)] border-t border-white/10 pt-3">
                    {quotesCountForBook > 0 && (
                      <span className="flex items-center gap-1.5">
                        <QuoteIcon className="w-3.5 h-3.5 text-[var(--accent-pink)]" />
                        <span>{quotesCountForBook} {quotesCountForBook === 1 ? 'cita guardada' : 'citas guardadas'}</span>
                      </span>
                    )}
                    {bookmarksCountForBook > 0 && (
                      <span className="flex items-center gap-1.5">
                        <BookmarkIcon className="w-3.5 h-3.5 text-amber-300" />
                        <span>{bookmarksCountForBook} {bookmarksCountForBook === 1 ? 'marcador' : 'marcadores'}</span>
                      </span>
                    )}
                  </div>
                )}

                {/* Primary CTA: Enter Reader */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onEnterReader(book)}
                    className="flex-1 min-h-[48px] px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--accent-pink)] to-[var(--accent-purple)] hover:opacity-95 text-black font-extrabold text-sm shadow-lg transition active:scale-[0.99] flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>
                      {(book.currentPage || 1) > 1
                        ? `Continuar lectura · Pág. ${book.currentPage}`
                        : 'Entrar al lector'}
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
