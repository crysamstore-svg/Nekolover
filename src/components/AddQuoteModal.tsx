import React, { useState, useEffect } from 'react';
import { X, Feather, BookOpen, Heart, Sparkles } from 'lucide-react';
import { Book, Quote } from '../types';

interface AddQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveQuote: (quote: Omit<Quote, 'id' | 'createdAt'>) => void;
  activeBook?: Book | null;
  defaultText?: string;
  currentPage?: number;
}

export const AddQuoteModal: React.FC<AddQuoteModalProps> = ({
  isOpen,
  onClose,
  onSaveQuote,
  activeBook,
  defaultText = '',
  currentPage = 1
}) => {
  const [text, setText] = useState('');
  const [bookTitle, setBookTitle] = useState('');
  const [chapter, setChapter] = useState('');
  const [emotion, setEmotion] = useState('🖤 Dark Reborn');
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (isOpen) {
      setText(defaultText || '');
      setBookTitle(activeBook ? activeBook.title : 'Lectura Nocturna');
      setChapter(activeBook ? `Pág. ${currentPage}` : 'Pág. 1');
      setEmotion('🖤 Dark Reborn');
      setComment('');
    }
  }, [isOpen, defaultText, activeBook, currentPage]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    onSaveQuote({
      bookId: activeBook ? activeBook.id : 'custom',
      bookTitle: bookTitle.trim() || 'Libro General',
      chapter: chapter.trim() || 'General',
      emotion,
      text: text.trim(),
      comment: comment.trim() || undefined
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl relative modal-animate">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-pink)] transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="mb-3">
          <h3 className="dark-reborn-font font-bold text-lg text-[var(--accent-pink)] flex items-center gap-2">
            <span>✍️</span> Guardar Cita o Pensamiento
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            Inmortaliza los pasajes literarios que conmovieron tu alma
          </p>
        </div>

        {/* Book Cover & Information Section */}
        {activeBook && (
          <div className="mb-4 p-3 rounded-2xl bg-gradient-to-r from-black/60 via-purple-950/20 to-black/60 border border-[var(--border-color)] flex items-center gap-3 shadow-inner">
            {/* 3D Mini Book Cover */}
            <div 
              className="w-12 h-16 rounded-md shadow-lg flex flex-col justify-between p-1 text-center shrink-0 border border-white/10 relative overflow-hidden"
              style={{ background: activeBook.coverGradient || 'linear-gradient(135deg, #1f1a2e 0%, #100d18 100%)' }}
            >
              <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-gradient-to-r from-black/70 to-transparent pointer-events-none" />
              <span className="text-xl my-auto block drop-shadow-md">{activeBook.emoji}</span>
              <div className="w-full bg-black/60 h-1 rounded-full overflow-hidden">
                <div className="bg-[var(--accent-pink)] h-full" style={{ width: `${activeBook.progressPercent || 0}%` }} />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <span className="text-[10px] uppercase font-mono text-[var(--accent-purple)] tracking-wider block">
                {activeBook.type.toUpperCase()} • PÁGINA {currentPage}
              </span>
              <h4 className="dark-reborn-font font-bold text-xs sm:text-sm text-white truncate">
                {activeBook.title}
              </h4>
              <p className="text-[11px] text-[var(--text-muted)] truncate">
                {activeBook.author}
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Quote Text */}
          <div>
            <label className="block text-xs font-semibold text-white mb-1">
              Cita / Fragmento literario <span className="text-[var(--accent-pink)]">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escribe o pega aquí la cita que te inspiró..."
              className="w-full bg-black/40 border border-[var(--border-color)] rounded-xl p-3 text-xs text-white placeholder-[var(--text-muted)] focus:border-[var(--accent-pink)] focus:outline-none transition leading-relaxed font-lora"
            />
          </div>

          {/* Book Title & Chapter */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                Libro
              </label>
              <input
                type="text"
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                placeholder="Título del libro"
                className="w-full bg-black/40 border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-white focus:border-[var(--accent-pink)] focus:outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                Página / Cap.
              </label>
              <input
                type="text"
                value={chapter}
                onChange={(e) => setChapter(e.target.value)}
                placeholder="Ej: Pág. 42"
                className="w-full bg-black/40 border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-white focus:border-[var(--accent-pink)] focus:outline-none transition"
              />
            </div>
          </div>

          {/* Emotion Tag */}
          <div>
            <label className="block text-xs font-semibold text-white mb-1">
              Categoría de Ánimo
            </label>
            <select
              value={emotion}
              onChange={(e) => setEmotion(e.target.value)}
              className="w-full bg-black/40 border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-white focus:border-[var(--accent-pink)] focus:outline-none transition cursor-pointer"
            >
              <option value="🖤 Dark Reborn" className="bg-[#1a1726]">🖤 Dark Reborn</option>
              <option value="🍓 Vainilla Fresa" className="bg-[#1a1726]">🍓 Vainilla Fresa</option>
              <option value="💖 Favorito" className="bg-[#1a1726]">💖 Favorito</option>
              <option value="🦇 Oscuro" className="bg-[#1a1726]">🦇 Oscuro</option>
              <option value="🥀 Melancolía" className="bg-[#1a1726]">🥀 Melancolía</option>
              <option value="✨ Místico" className="bg-[#1a1726]">✨ Místico</option>
            </select>
          </div>

          {/* Personal Reflection */}
          <div>
            <label className="block text-xs font-semibold text-white mb-1">
              Reflexión Personal (Opcional)
            </label>
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="¿Qué sentiste o descubriste al leer esto?"
              className="w-full bg-black/40 border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-white placeholder-[var(--text-muted)] focus:border-[var(--accent-pink)] focus:outline-none transition"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-2.5 bg-[var(--accent-pink)] text-black font-cute font-bold rounded-xl shadow-lg hover:opacity-95 transition mt-2 active:scale-98"
          >
            Guardar en el Baúl 🐾
          </button>
        </form>
      </div>
    </div>
  );
};
