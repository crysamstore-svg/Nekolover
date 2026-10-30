import React from 'react';
import { X, Check, Type } from 'lucide-react';
import { FONT_OPTIONS } from '../data/defaultBooks';

interface FontModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFont: string;
  onSelectFont: (fontFamily: string) => void;
}

export const FontModal: React.FC<FontModalProps> = ({
  isOpen,
  onClose,
  currentFont,
  onSelectFont
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl relative modal-animate">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-pink)] transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="text-center mb-5">
          <h3 className="dark-reborn-font font-bold text-lg text-[var(--accent-pink)] flex items-center justify-center gap-2">
            <span>🦇</span> Tipografía Dark Reborn
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Escoge la fuente que mejor resuene con el espíritu de tu lectura
          </p>
        </div>

        {/* Font List */}
        <div className="space-y-2.5 max-h-[62vh] overflow-y-auto pr-1">
          {FONT_OPTIONS.map((f) => {
            const isSelected = currentFont.includes(f.name);
            return (
              <button
                key={f.id}
                onClick={() => {
                  onSelectFont(f.family);
                  onClose();
                }}
                className={`w-full p-3 rounded-2xl border text-left transition transform hover:scale-[1.01] shadow-md flex items-center justify-between ${
                  isSelected
                    ? 'border-[var(--accent-pink)] bg-black/60 shadow-[0_0_12px_rgba(255,121,198,0.2)]'
                    : 'border-[var(--border-color)] bg-black/30 hover:border-[var(--accent-pink)]/50'
                }`}
              >
                <div className="flex-1 pr-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs sm:text-sm text-[var(--accent-pink)]">
                      {f.name}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] bg-black/40 px-2 py-0.5 rounded-full border border-[var(--border-color)]">
                      {f.category}
                    </span>
                  </div>
                  <p
                    className="text-xs sm:text-sm text-white/90 line-clamp-1 italic"
                    style={{ fontFamily: f.family }}
                  >
                    "{f.preview}"
                  </p>
                </div>

                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-[var(--accent-pink)] text-black flex items-center justify-center shrink-0 shadow-md">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
