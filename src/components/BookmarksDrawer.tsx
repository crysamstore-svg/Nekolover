import React from 'react';
import { X, Bookmark, BookOpen, Trash2, ArrowRight } from 'lucide-react';
import { Bookmark as BookmarkType, Book } from '../types';

interface BookmarksDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: BookmarkType[];
  books: Book[];
  onSelectBookmark: (bookId: string, page: number) => void;
  onDeleteBookmark: (id: string) => void;
}

export const BookmarksDrawer: React.FC<BookmarksDrawerProps> = ({
  isOpen,
  onClose,
  bookmarks,
  books,
  onSelectBookmark,
  onDeleteBookmark
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl relative modal-animate max-h-[85vh] flex flex-col">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-pink)] transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="mb-4">
          <h3 className="dark-reborn-font font-bold text-lg text-[var(--accent-pink)] flex items-center gap-2">
            <Bookmark className="w-5 h-5 fill-current text-[var(--accent-pink)]" />
            <span>Marcadores Literarios</span>
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            Tus puntos de lectura guardados en cada tomo
          </p>
        </div>

        {/* Bookmarks List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {bookmarks.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)]">
              <p className="text-3xl mb-2">🔖</p>
              <p className="font-cute text-xs">No tienes marcadores guardados aún.</p>
              <p className="text-[10px] mt-1 opacity-70">
                Toca el icono de marcador en la barra del lector para guardar cualquier página.
              </p>
            </div>
          ) : (
            bookmarks.map((bm) => {
              const book = books.find((b) => b.id === bm.bookId);
              return (
                <div
                  key={bm.id}
                  className="bg-black/40 border border-[var(--border-color)] hover:border-[var(--accent-pink)] rounded-2xl p-3 flex items-center justify-between gap-3 transition group"
                >
                  <div
                    onClick={() => {
                      onSelectBookmark(bm.bookId, bm.page);
                      onClose();
                    }}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--accent-pink)] truncate">
                      <BookOpen className="w-3.5 h-3.5 text-[var(--accent-purple)] shrink-0" />
                      <span className="truncate">{bm.bookTitle}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-[var(--text-muted)]">
                      <span className="bg-black/60 px-2 py-0.5 rounded-md font-mono text-[var(--accent-purple)] border border-white/5">
                        Página {bm.page}
                      </span>
                      <span>
                        {new Date(bm.createdAt).toLocaleDateString('es-ES', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => {
                        onSelectBookmark(bm.bookId, bm.page);
                        onClose();
                      }}
                      className="p-1.5 bg-[var(--accent-pink)]/20 text-[var(--accent-pink)] hover:bg-[var(--accent-pink)] hover:text-black rounded-lg transition"
                      title="Ir a esta página"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteBookmark(bm.id)}
                      className="p-1.5 text-red-400/80 hover:text-red-400 hover:bg-white/10 rounded-lg transition"
                      title="Eliminar marcador"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
