import React from 'react';
import { 
  X, 
  Type, 
  AlignJustify, 
  Columns, 
  Sun, 
  Moon, 
  Lightbulb, 
  ZoomIn, 
  ZoomOut, 
  Check, 
  Sliders,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { ReaderModeId, FontOption } from '../types';
import { FONT_OPTIONS, READER_MODES } from '../data/defaultBooks';

interface ReadingSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookType: 'pdf' | 'epub' | 'demo' | 'text';
  // PDF reflow
  pdfReflowMode?: boolean;
  onTogglePdfReflow?: (reflow: boolean) => void;
  // Font
  currentFont: string;
  onSelectFont: (fontFamily: string) => void;
  // Font Size
  fontSize: number;
  onSelectFontSize: (size: number) => void;
  // Line Height
  lineHeight: number;
  onSelectLineHeight: (lh: number) => void;
  // Margins / Container Width
  containerWidth: 'normal' | 'wide' | 'narrow';
  onSelectContainerWidth: (w: 'normal' | 'wide' | 'narrow') => void;
  // Reader Contrast Mode
  readerMode: ReaderModeId;
  onSelectReaderMode: (mode: ReaderModeId) => void;
  // Screen WakeLock illumination
  isWakeLockActive: boolean;
  onToggleWakeLock: () => void;
  // Zoom (for PDF page view)
  zoomLevel?: number;
  onSetZoomLevel?: (zoom: number) => void;
}

export const ReadingSettingsModal: React.FC<ReadingSettingsModalProps> = ({
  isOpen,
  onClose,
  bookType,
  pdfReflowMode,
  onTogglePdfReflow,
  currentFont,
  onSelectFont,
  fontSize,
  onSelectFontSize,
  lineHeight,
  onSelectLineHeight,
  containerWidth,
  onSelectContainerWidth,
  readerMode,
  onSelectReaderMode,
  isWakeLockActive,
  onToggleWakeLock,
  zoomLevel = 1.0,
  onSetZoomLevel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 select-none">
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-6 max-w-lg w-full shadow-2xl relative modal-animate flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌸</span>
            <div>
              <h3 className="dark-reborn-font font-bold text-base sm:text-lg text-[var(--accent-pink)]">
                Ajustes de Lectura Kawaii
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                Personaliza la apariencia, letras y comodidad visual de tu lectura
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Settings Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-none">
          {/* 1. SECCIÓN EXCLUSIVA PDF: Acomodar Letras vs Página Fija */}
          {bookType === 'pdf' && onTogglePdfReflow && (
            <div className="bg-black/40 border border-[var(--border-color)] p-3.5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>📖</span>
                  <span>Modo de Visualización PDF</span>
                </span>
                <span className="text-[10px] text-[var(--accent-pink)] font-bold">
                  {pdfReflowMode ? 'Acomodado' : 'Página Fija'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onTogglePdfReflow(true)}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    pdfReflowMode
                      ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 border-[var(--accent-pink)] text-white shadow'
                      : 'bg-black/30 border-white/5 text-[var(--text-muted)] hover:text-white'
                  }`}
                >
                  <div className="font-bold text-xs flex items-center gap-1 text-[var(--accent-pink)]">
                    <span>📖 Acomodar Letras</span>
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5 leading-tight">
                    Las letras se adaptan al ancho de la pantalla al ampliar (sin scroll horizontal).
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => onTogglePdfReflow(false)}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    !pdfReflowMode
                      ? 'bg-[var(--accent-pink)] text-black border-[var(--accent-pink)] font-bold shadow'
                      : 'bg-black/30 border-white/5 text-[var(--text-muted)] hover:text-white'
                  }`}
                >
                  <div className="font-bold text-xs flex items-center gap-1">
                    <span>📄 Página Fija</span>
                  </div>
                  <p className="text-[10px] mt-0.5 leading-tight opacity-80">
                    Muestra el diseño original y las páginas del PDF tal como fueron creadas.
                  </p>
                </button>
              </div>

              {/* Si es página fija, control de zoom */}
              {!pdfReflowMode && onSetZoomLevel && (
                <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-[var(--text-muted)]">Zoom del PDF:</span>
                  <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/10">
                    <button
                      onClick={() => onSetZoomLevel(Math.max(0.5, Number((zoomLevel - 0.25).toFixed(2))))}
                      className="p-1 rounded text-xs text-white hover:bg-white/10"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-mono font-bold text-[var(--accent-pink)] px-2">
                      {Math.round(zoomLevel * 100)}%
                    </span>
                    <button
                      onClick={() => onSetZoomLevel(Math.min(3.5, Number((zoomLevel + 0.25).toFixed(2))))}
                      className="p-1 rounded text-xs text-white hover:bg-white/10"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. TAMAÑO DE LETRA */}
          <div className="bg-black/40 border border-[var(--border-color)] p-3.5 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Type className="w-4 h-4 text-[var(--accent-pink)]" />
                <span>Tamaño de Letras</span>
              </span>
              <span className="text-xs font-mono font-bold text-[var(--accent-pink)]">
                {fontSize}px
              </span>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => onSelectFontSize(Math.max(12, fontSize - 2))}
                className="w-8 h-8 rounded-xl bg-black/60 border border-white/10 text-white hover:border-[var(--accent-pink)] font-bold text-xs flex items-center justify-center transition active:scale-95"
                title="Hacer letra más pequeña"
              >
                A-
              </button>
              <input
                type="range"
                min="12"
                max="36"
                step="1"
                value={fontSize}
                onChange={(e) => onSelectFontSize(parseInt(e.target.value, 10))}
                className="flex-1 accent-[var(--accent-pink)] cursor-pointer h-1.5 bg-white/20 rounded-lg"
              />
              <button
                type="button"
                onClick={() => onSelectFontSize(Math.min(36, fontSize + 2))}
                className="w-8 h-8 rounded-xl bg-black/60 border border-white/10 text-white hover:border-[var(--accent-pink)] font-bold text-xs flex items-center justify-center transition active:scale-95"
                title="Hacer letra más grande"
              >
                A+
              </button>
            </div>
          </div>

          {/* 3. MODOS DE CONTRASTE & COLOR DE LECTURA */}
          <div className="bg-black/40 border border-[var(--border-color)] p-3.5 rounded-2xl space-y-2">
            <span className="text-xs font-bold text-white block">
              Fondo & Contraste para la Vista
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {READER_MODES.map((mode) => {
                const isSelected = readerMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => onSelectReaderMode(mode.id)}
                    className={`p-2 rounded-xl border text-left transition flex items-center justify-between gap-1.5 ${
                      isSelected
                        ? 'border-[var(--accent-pink)] shadow-md ring-1 ring-[var(--accent-pink)]'
                        : 'border-white/5 hover:border-white/20'
                    }`}
                    style={{ backgroundColor: mode.bg, color: mode.text }}
                  >
                    <span className="text-[11px] font-bold truncate">
                      {mode.name}
                    </span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-[var(--accent-pink)] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. TIPOGRAFÍA Y FUENTES */}
          <div className="bg-black/40 border border-[var(--border-color)] p-3.5 rounded-2xl space-y-2">
            <span className="text-xs font-bold text-white block">
              Tipografía Literaria & Kawaii
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-1 scrollbar-none">
              {FONT_OPTIONS.map((f: FontOption) => {
                const isSelected = currentFont === f.family;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => onSelectFont(f.family)}
                    className={`p-2 rounded-xl border text-left transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-[var(--accent-pink)]/20 border-[var(--accent-pink)] text-[var(--accent-pink)]'
                        : 'bg-black/30 border-white/5 text-[var(--text-muted)] hover:text-white hover:border-white/20'
                    }`}
                  >
                    <div className="truncate">
                      <span className="text-xs font-bold block truncate" style={{ fontFamily: f.family }}>
                        {f.name}
                      </span>
                      <span className="text-[9px] text-[var(--text-muted)] truncate block">
                        {f.category}
                      </span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[var(--accent-pink)] shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. INTERLINEADO & MÁRGENES DE LA PÁGINA */}
          <div className="grid grid-cols-2 gap-2">
            {/* Interlineado */}
            <div className="bg-black/40 border border-[var(--border-color)] p-3 rounded-2xl space-y-1.5">
              <span className="text-[11px] font-bold text-white flex items-center gap-1">
                <AlignJustify className="w-3.5 h-3.5 text-[var(--accent-purple)]" />
                <span>Interlineado</span>
              </span>
              <div className="flex items-center gap-1 pt-0.5">
                {[
                  { label: '1.4x', value: 1.4, title: 'Compacto' },
                  { label: '1.8x', value: 1.8, title: 'Equilibrado' },
                  { label: '2.2x', value: 2.2, title: 'Aireado' }
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => onSelectLineHeight(item.value)}
                    className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition ${
                      Math.abs(lineHeight - item.value) < 0.1
                        ? 'bg-[var(--accent-purple)] text-black'
                        : 'bg-black/50 text-[var(--text-muted)] hover:text-white border border-white/5'
                    }`}
                    title={item.title}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ancho / Márgenes */}
            <div className="bg-black/40 border border-[var(--border-color)] p-3 rounded-2xl space-y-1.5">
              <span className="text-[11px] font-bold text-white flex items-center gap-1">
                <Columns className="w-3.5 h-3.5 text-[var(--accent-pink)]" />
                <span>Márgenes</span>
              </span>
              <div className="flex items-center gap-1 pt-0.5">
                {[
                  { label: 'Estrecho', value: 'narrow' as const },
                  { label: 'Normal', value: 'normal' as const },
                  { label: 'Ancho', value: 'wide' as const }
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => onSelectContainerWidth(item.value)}
                    className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition ${
                      containerWidth === item.value
                        ? 'bg-[var(--accent-pink)] text-black'
                        : 'bg-black/50 text-[var(--text-muted)] hover:text-white border border-white/5'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 6. ILUMINACIÓN FIJA DE PANTALLA */}
          <div className="bg-black/40 border border-[var(--border-color)] p-3 rounded-2xl flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Lightbulb className={`w-4 h-4 ${isWakeLockActive ? 'text-amber-300 fill-amber-300' : 'text-[var(--text-muted)]'}`} />
              <div>
                <h5 className="text-xs font-bold text-white">Iluminación Continua</h5>
                <p className="text-[10px] text-[var(--text-muted)]">Evita que la pantalla se apague mientras lees</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleWakeLock}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                isWakeLockActive 
                  ? 'bg-amber-400 text-black shadow' 
                  : 'bg-black/60 border border-white/10 text-[var(--text-muted)] hover:text-white'
              }`}
            >
              {isWakeLockActive ? 'Encendida 💡' : 'Apagada'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 mt-3 border-t border-[var(--border-color)] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[var(--accent-pink)] to-purple-600 text-black hover:opacity-95 transition shadow-md"
          >
            Aplicar y Continuar Lectura
          </button>
        </div>
      </div>
    </div>
  );
};
