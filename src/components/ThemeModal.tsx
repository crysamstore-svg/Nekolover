import React from 'react';
import { X, Check } from 'lucide-react';
import { ThemeId } from '../types';
import { THEME_OPTIONS } from '../data/defaultBooks';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ThemeId;
  onSelectTheme: (theme: ThemeId) => void;
}

export const ThemeModal: React.FC<ThemeModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme
}) => {
  if (!isOpen) return null;

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
        <div className="text-center mb-5">
          <h3 className="dark-reborn-font font-bold text-lg text-[var(--accent-pink)] flex items-center justify-center gap-2">
            <span>🎨</span> Temas de Color & Lectura
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Personaliza el ambiente gótico y la paleta de tu lector
          </p>
        </div>

        {/* Theme List */}
        <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {THEME_OPTIONS.map((t) => {
            const isSelected = currentTheme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  onSelectTheme(t.id);
                  onClose();
                }}
                className={`w-full p-3 rounded-2xl border-2 flex items-center justify-between text-left transition transform hover:scale-[1.02] shadow-md ${
                  isSelected
                    ? 'border-[var(--accent-pink)] bg-black/50 shadow-[0_0_15px_rgba(255,121,198,0.2)]'
                    : 'border-[var(--border-color)] bg-black/30 hover:border-[var(--accent-pink)]/60'
                }`}
                style={{ backgroundColor: t.card }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl filter drop-shadow">{t.icon}</span>
                  <div>
                    <p className="font-bold text-xs sm:text-sm" style={{ color: t.primary }}>
                      {t.name}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      {t.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Color swatches */}
                  <div className="flex -space-x-1">
                    <div
                      className="w-4 h-4 rounded-full border border-black/40 shadow-sm"
                      style={{ backgroundColor: t.primary }}
                    />
                    <div
                      className="w-4 h-4 rounded-full border border-black/40 shadow-sm"
                      style={{ backgroundColor: t.accent }}
                    />
                  </div>

                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-[var(--accent-pink)] text-black flex items-center justify-center shadow-md">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
