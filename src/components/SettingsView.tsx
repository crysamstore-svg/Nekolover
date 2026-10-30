import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Type, 
  Sun, 
  Moon, 
  Sliders, 
  Check, 
  Layout, 
  Palette, 
  Music, 
  Download, 
  BarChart3, 
  Quote as QuoteIcon, 
  Bookmark as BookmarkIcon,
  Maximize2,
  Minimize2,
  BookOpen,
  Sparkles,
  SlidersHorizontal,
  RotateCcw,
  Image as ImageIcon,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { ReaderModeId, ThemeId, ShelfStyle, ShelfViewMode, ShelfBackgroundConfig } from '../types';
import { READER_MODES, FONT_OPTIONS, THEME_OPTIONS } from '../data/defaultBooks';
import { ShelfBackgroundModal, DEFAULT_SHELF_BG } from './ShelfBackgroundModal';

export interface HeaderButtonsConfig {
  showNightMode: boolean;
  showAudio: boolean;
  showTheme: boolean;
  showZip: boolean;
  showStats: boolean;
  showBookmarks: boolean;
  showQuotes: boolean;
}

interface SettingsViewProps {
  onBack: () => void;
  // Contrast Mode / Reader Mode
  readerMode: ReaderModeId;
  onSelectReaderMode: (mode: ReaderModeId) => void;
  isNightMode: boolean;
  onToggleNightMode: () => void;
  // Typography
  currentFont: string;
  onSelectFont: (font: string) => void;
  // Margins & Spacing
  containerWidth: 'narrow' | 'normal' | 'wide';
  onChangeContainerWidth: (w: 'narrow' | 'normal' | 'wide') => void;
  lineHeight: number;
  onChangeLineHeight: (lh: number) => void;
  fontSize: number;
  onChangeFontSize: (fs: number) => void;
  // Header Buttons
  headerConfig: HeaderButtonsConfig;
  onUpdateHeaderConfig: (key: keyof HeaderButtonsConfig, value: boolean) => void;
  // Theme
  currentTheme: ThemeId;
  onSelectTheme: (t: ThemeId) => void;
  // Shelf
  shelfStyle: ShelfStyle;
  onChangeShelfStyle: (s: ShelfStyle) => void;
  viewMode: ShelfViewMode;
  onChangeViewMode: (v: ShelfViewMode) => void;
  shelfBgConfig?: ShelfBackgroundConfig;
  onUpdateShelfBgConfig?: (config: ShelfBackgroundConfig) => void;
  onResetStatsToZero?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onBack,
  readerMode,
  onSelectReaderMode,
  isNightMode,
  onToggleNightMode,
  currentFont,
  onSelectFont,
  containerWidth,
  onChangeContainerWidth,
  lineHeight,
  onChangeLineHeight,
  fontSize,
  onChangeFontSize,
  headerConfig,
  onUpdateHeaderConfig,
  currentTheme,
  onSelectTheme,
  shelfStyle,
  onChangeShelfStyle,
  viewMode,
  onChangeViewMode,
  shelfBgConfig,
  onUpdateShelfBgConfig,
  onResetStatsToZero
}) => {
  const [activeTab, setActiveTab] = useState<'contrast' | 'typography' | 'margins' | 'header' | 'shelf'>('contrast');
  const [isBgModalOpen, setIsBgModalOpen] = useState<boolean>(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);
  const [statsResetSuccess, setStatsResetSuccess] = useState<boolean>(false);

  const currentModeConfig = READER_MODES.find(m => m.id === readerMode) || READER_MODES[0];

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-8 animate-fadeIn">
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-[var(--border-color)]">
        <button
          onClick={onBack}
          className="px-3.5 py-2 rounded-xl text-xs font-cute font-bold bg-black/40 border border-[var(--border-color)] hover:border-[var(--accent-pink)] text-[var(--accent-pink)] transition flex items-center gap-2 active:scale-95 shadow-md"
          title="Regresar a la estantería de libros"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a la Biblioteca</span>
        </button>

        <div className="text-right">
          <h2 className="dark-reborn-font font-bold text-lg sm:text-xl text-[var(--accent-pink)] flex items-center justify-end gap-2">
            <span>⚙️</span>
            <span>Configuraciones Literarias</span>
          </h2>
          <p className="text-[11px] text-[var(--text-muted)]">
            Ajustes de lectura, tipografía, márgenes, contrastes y cabecera
          </p>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
        <button
          onClick={() => setActiveTab('contrast')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'contrast'
              ? 'bg-[var(--accent-pink)] text-black shadow-lg'
              : 'bg-black/40 text-[var(--text-muted)] hover:text-white border border-[var(--border-color)]'
          }`}
        >
          <Sun className="w-3.5 h-3.5" />
          <span>Modo de Contraste</span>
        </button>

        <button
          onClick={() => setActiveTab('typography')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'typography'
              ? 'bg-[var(--accent-pink)] text-black shadow-lg'
              : 'bg-black/40 text-[var(--text-muted)] hover:text-white border border-[var(--border-color)]'
          }`}
        >
          <Type className="w-3.5 h-3.5" />
          <span>Tipografía</span>
        </button>

        <button
          onClick={() => setActiveTab('margins')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'margins'
              ? 'bg-[var(--accent-pink)] text-black shadow-lg'
              : 'bg-black/40 text-[var(--text-muted)] hover:text-white border border-[var(--border-color)]'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Espacio & Márgenes</span>
        </button>

        <button
          onClick={() => setActiveTab('header')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'header'
              ? 'bg-[var(--accent-pink)] text-black shadow-lg'
              : 'bg-black/40 text-[var(--text-muted)] hover:text-white border border-[var(--border-color)]'
          }`}
        >
          <Layout className="w-3.5 h-3.5" />
          <span>Botones del Header</span>
        </button>

        <button
          onClick={() => setActiveTab('shelf')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'shelf'
              ? 'bg-[var(--accent-pink)] text-black shadow-lg'
              : 'bg-black/40 text-[var(--text-muted)] hover:text-white border border-[var(--border-color)]'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Mi Estantería</span>
        </button>
      </div>

      {/* TAB 1: MODO DE CONTRASTE */}
      {activeTab === 'contrast' && (
        <div className="space-y-6">
          {/* Global High Contrast Night Mode Toggle */}
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-black/60 border border-[var(--border-color)] flex items-center justify-center text-2xl shrink-0">
                {isNightMode ? '☀️' : '🌙'}
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                  <span>Modo Noche de Alto Contraste</span>
                  {isNightMode && (
                    <span className="text-[10px] bg-white text-black font-bold px-2 py-0.5 rounded-full">
                      ACTIVO
                    </span>
                  )}
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5 max-w-lg">
                  Cambia toda la interfaz a escala de grises y negro puro OLED para lectura cómoda en total oscuridad.
                </p>
              </div>
            </div>

            <button
              onClick={onToggleNightMode}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md shrink-0 active:scale-95 ${
                isNightMode
                  ? 'bg-white text-black font-bold shadow-[0_0_20px_rgba(255,255,255,0.4)]'
                  : 'bg-black/60 text-white border border-[var(--border-color)] hover:border-[var(--accent-pink)]'
              }`}
            >
              {isNightMode ? <Sun className="w-4 h-4 text-black" /> : <Moon className="w-4 h-4 text-gray-300" />}
              <span>{isNightMode ? 'Desactivar Modo Noche' : 'Activar Modo Noche'}</span>
            </button>
          </div>

          {/* Reader Contrast Presets */}
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-4 sm:p-6 shadow-xl">
            <div className="mb-4">
              <h3 className="font-bold text-sm sm:text-base text-[var(--accent-pink)]">
                Paletas de Fondo para el Lector
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Selecciona la tonalidad y nivel de contraste con la que se mostrarán las páginas de tus libros:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {READER_MODES.map((mode) => {
                const isSelected = readerMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    onClick={() => onSelectReaderMode(mode.id)}
                    className={`p-4 rounded-2xl border text-left transition transform hover:scale-[1.02] shadow-lg relative flex flex-col justify-between h-36 ${
                      isSelected
                        ? 'border-[var(--accent-pink)] ring-2 ring-[var(--accent-pink)] shadow-[0_0_20px_rgba(255,121,198,0.25)]'
                        : 'border-[var(--border-color)] hover:border-white/30'
                    }`}
                    style={{ backgroundColor: mode.bg }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm" style={{ color: mode.text }}>
                        {mode.name}
                      </span>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-[var(--accent-pink)] text-black flex items-center justify-center shrink-0 shadow-md">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    <p className="text-xs opacity-80 leading-relaxed italic" style={{ color: mode.text }}>
                      "En la quietud de la noche, las páginas susurran secretos antiguos."
                    </p>

                    <div className="flex items-center justify-between text-[10px] opacity-60 font-mono" style={{ color: mode.text }}>
                      <span>Fondo: {mode.bg}</span>
                      <span>Texto: {mode.text}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TIPOGRAFÍA */}
      {activeTab === 'typography' && (
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-[var(--accent-pink)] flex items-center gap-2">
              <Type className="w-4 h-4" />
              <span>Tipografía de Lectura (Dark Reborn & Fuentes Literarias)</span>
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Personaliza el estilo de letra para disfrutar de una lectura inmersiva acorde a tu gusto:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {FONT_OPTIONS.map((f) => {
              const isSelected = currentFont.includes(f.name);
              return (
                <button
                  key={f.id}
                  onClick={() => onSelectFont(f.family)}
                  className={`p-4 rounded-2xl border text-left transition transform hover:scale-[1.01] shadow-md flex flex-col justify-between h-32 ${
                    isSelected
                      ? 'border-[var(--accent-pink)] bg-black/70 ring-1 ring-[var(--accent-pink)] shadow-[0_0_15px_rgba(255,121,198,0.2)]'
                      : 'border-[var(--border-color)] bg-black/40 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-sm text-[var(--accent-pink)]">
                      {f.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[var(--text-muted)] bg-black/60 px-2 py-0.5 rounded-full border border-white/5">
                        {f.category}
                      </span>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-[var(--accent-pink)] text-black flex items-center justify-center shrink-0 shadow-sm">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </div>

                  <p 
                    className="text-sm text-white/95 line-clamp-2 italic pt-2"
                    style={{ fontFamily: f.family }}
                  >
                    "{f.preview}"
                  </p>

                  <div className="text-[10px] text-[var(--text-muted)] font-mono">
                    css: {f.family.split(',')[0]}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: AJUSTE DE ESPACIO DE MÁRGENES Y FORMATO */}
      {activeTab === 'margins' && (
        <div className="space-y-6">
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-4 sm:p-6 shadow-xl space-y-6">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-[var(--accent-pink)] flex items-center gap-2">
                <Sliders className="w-4 h-4" />
                <span>Ajuste de Espacio de Márgenes y Contenedor</span>
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Controla la amplitud de los márgenes laterales y el formato del libro en pantalla:
              </p>
            </div>

            {/* Container Width (Márgenes) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white block">
                Márgenes y Ancho de Página:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => onChangeContainerWidth('narrow')}
                  className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between gap-2 ${
                    containerWidth === 'narrow'
                      ? 'border-[var(--accent-pink)] bg-[var(--accent-pink)]/15 text-white font-bold'
                      : 'border-[var(--border-color)] bg-black/40 text-[var(--text-muted)] hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">📄 Estrecho</span>
                    {containerWidth === 'narrow' && <Check className="w-3.5 h-3.5 text-[var(--accent-pink)]" />}
                  </div>
                  <span className="text-[11px] opacity-75">
                    Márgenes generosos (576px max). Ideal para lectura concentrada.
                  </span>
                </button>

                <button
                  onClick={() => onChangeContainerWidth('normal')}
                  className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between gap-2 ${
                    containerWidth === 'normal'
                      ? 'border-[var(--accent-pink)] bg-[var(--accent-pink)]/15 text-white font-bold'
                      : 'border-[var(--border-color)] bg-black/40 text-[var(--text-muted)] hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">📖 Normal</span>
                    {containerWidth === 'normal' && <Check className="w-3.5 h-3.5 text-[var(--accent-pink)]" />}
                  </div>
                  <span className="text-[11px] opacity-75">
                    Márgenes estándar (768px max). El formato tradicional de libro.
                  </span>
                </button>

                <button
                  onClick={() => onChangeContainerWidth('wide')}
                  className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between gap-2 ${
                    containerWidth === 'wide'
                      ? 'border-[var(--accent-pink)] bg-[var(--accent-pink)]/15 text-white font-bold'
                      : 'border-[var(--border-color)] bg-black/40 text-[var(--text-muted)] hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">📜 Ancho / Completo</span>
                    {containerWidth === 'wide' && <Check className="w-3.5 h-3.5 text-[var(--accent-pink)]" />}
                  </div>
                  <span className="text-[11px] opacity-75">
                    Márgenes mínimos (960px max). Máximo aprovechamiento visual.
                  </span>
                </button>
              </div>
            </div>

            {/* Line Height (Interlineado) */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <label className="text-xs font-bold text-white block">
                Interlineado (Espacio entre líneas de texto):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { val: 1.4, label: 'Compacto (1.4x)' },
                  { val: 1.6, label: 'Estándar (1.6x)' },
                  { val: 1.8, label: 'Relajado (1.8x)' },
                  { val: 2.0, label: 'Amplio (2.0x)' }
                ].map((item) => (
                  <button
                    key={item.val}
                    onClick={() => onChangeLineHeight(item.val)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition ${
                      lineHeight === item.val
                        ? 'border-[var(--accent-pink)] bg-[var(--accent-pink)] text-black font-bold shadow'
                        : 'border-[var(--border-color)] bg-black/40 text-[var(--text-muted)] hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size Sizing */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white">
                  Tamaño de Letra Base:
                </label>
                <span className="text-xs font-mono font-bold text-[var(--accent-pink)]">
                  {fontSize}px
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onChangeFontSize(Math.max(13, fontSize - 1))}
                  className="px-3 py-1.5 rounded-xl bg-black/50 border border-[var(--border-color)] hover:border-[var(--accent-pink)] text-xs font-bold text-white transition active:scale-95"
                >
                  A-
                </button>
                <input
                  type="range"
                  min="13"
                  max="32"
                  value={fontSize}
                  onChange={(e) => onChangeFontSize(parseInt(e.target.value, 10))}
                  className="flex-1 accent-[var(--accent-pink)] cursor-pointer h-2 bg-black/60 rounded-lg"
                />
                <button
                  onClick={() => onChangeFontSize(Math.min(32, fontSize + 1))}
                  className="px-3 py-1.5 rounded-xl bg-black/50 border border-[var(--border-color)] hover:border-[var(--accent-pink)] text-xs font-bold text-white transition active:scale-95"
                >
                  A+
                </button>
              </div>
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-4 sm:p-6 shadow-xl">
            <h4 className="text-xs font-bold text-[var(--accent-pink)] uppercase tracking-wider mb-3">
              Vista Previa en Tiempo Real de tu Configuración:
            </h4>
            <div 
              className="p-6 rounded-2xl border border-white/10 shadow-inner transition-all mx-auto"
              style={{
                backgroundColor: currentModeConfig.bg,
                color: currentModeConfig.text,
                fontFamily: currentFont,
                fontSize: `${fontSize}px`,
                lineHeight: lineHeight,
                maxWidth: containerWidth === 'narrow' ? '576px' : containerWidth === 'wide' ? '100%' : '768px'
              }}
            >
              <h5 className="font-bold text-base mb-2">Capítulo I: Las Sombras y el Silencio</h5>
              <p>
                Los gatos negros observaban desde lo alto de los tejados góticos. La noche extendía su manto de terciopelo, 
                mientras cada palabra cobraba vida en el resplandor de la pantalla con el margen y la tipografía exacta que has elegido.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BOTONES DEL HEADER */}
      {activeTab === 'header' && (
        <div className="space-y-6">
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-[var(--accent-pink)] flex items-center gap-2">
                <Layout className="w-4 h-4" />
                <span>Personalización de Botones del Header</span>
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Elige qué accesos directos y botones se muestran en la barra superior de la aplicación:
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {[
                { key: 'showNightMode' as const, label: 'Botón de Modo Noche Rápido (Sol / Luna)', desc: 'Interruptor directo para alternar alto contraste OLED', icon: '🌙' },
                { key: 'showAudio' as const, label: 'Botón de Sonido Ambiental Lo-Fi', desc: 'Control de lluvia gótica y ronroneo de gato', icon: '🎶' },
                { key: 'showTheme' as const, label: 'Botón de Selector de Temas', desc: 'Acceso rápido al modal de paletas de color', icon: '🎨' },
                { key: 'showZip' as const, label: 'Botón de Descarga ZIP', desc: 'Descarga del paquete de código para Android & Web', icon: '📦' },
                { key: 'showStats' as const, label: 'Pestaña de Estadísticas', desc: 'Acceso a minutos de lectura, rachas y gráficos', icon: '📊' },
                { key: 'showQuotes' as const, label: 'Pestaña de Notas y Citas', desc: 'Acceso al Baúl de Citas literarias guardadas', icon: '🪶' },
                { key: 'showBookmarks' as const, label: 'Pestaña de Marcadores', desc: 'Acceso al cajón de páginas marcadas', icon: '🔖' }
              ].map((item) => {
                const isEnabled = headerConfig[item.key];
                return (
                  <div 
                    key={item.key}
                    className="p-3.5 bg-black/40 border border-[var(--border-color)] rounded-xl flex items-center justify-between gap-3 hover:border-white/20 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl shrink-0">{item.icon}</span>
                      <div>
                        <div className="text-xs font-bold text-white">{item.label}</div>
                        <div className="text-[11px] text-[var(--text-muted)]">{item.desc}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => onUpdateHeaderConfig(item.key, !isEnabled)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isEnabled ? 'bg-[var(--accent-pink)]' : 'bg-gray-700'
                      }`}
                      aria-label={item.label}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          isEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Theme Palette Customization */}
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-4 sm:p-6 shadow-xl">
            <h3 className="font-bold text-sm sm:text-base text-[var(--accent-pink)] mb-1">
              Paleta de Color General de la App
            </h3>
            <p className="text-xs text-[var(--text-muted)] mb-4">
              Selecciona el tema que colorea botones, bordes y acentos de toda la aplicación:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {THEME_OPTIONS.map((theme) => {
                const isSelected = currentTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => onSelectTheme(theme.id)}
                    className={`p-3.5 rounded-xl border text-left transition flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'border-[var(--accent-pink)] bg-black/60 ring-1 ring-[var(--accent-pink)]'
                        : 'border-[var(--border-color)] bg-black/40 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="text-xl">{theme.icon}</span>
                      <div>
                        <div className="text-xs font-bold text-white">{theme.name}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">{theme.subtitle}</div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[var(--accent-pink)]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: MI ESTANTERÍA */}
      {activeTab === 'shelf' && (
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-4 sm:p-6 shadow-xl space-y-6">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-[var(--accent-pink)] flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span>Personalización de Mi Estantería</span>
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Personaliza el estilo de repisa y el modo de visualización de tus libros:
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-white block mb-2">
                Modo de Visualización de Libros:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'covers' as const, label: '🖼️ Cubiertas en Estante', desc: 'Libros de frente con portada y progreso en cada balda' },
                  { id: 'spines' as const, label: '📚 Lomos Verticales', desc: 'Lomos ordenados de pie uno al lado del otro' },
                  { id: 'stacks' as const, label: '📦 Lista / Acostados', desc: 'Vista limpia horizontal tipo lista de biblioteca' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onChangeViewMode(item.id)}
                    className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between gap-1 ${
                      viewMode === item.id
                        ? 'border-[var(--accent-pink)] bg-[var(--accent-pink)]/15 font-bold'
                        : 'border-[var(--border-color)] bg-black/40 text-[var(--text-muted)] hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-bold text-white">{item.label}</div>
                    <div className="text-[11px] opacity-75">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-white/5">
              <label className="text-xs font-bold text-white block mb-2">
                Acabado del Estante Convencional:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { id: 'wood-oak' as const, name: '🪵 Roble & Nogal Natural', desc: 'Madera cálida clásica convencional' },
                  { id: 'wood-gothic' as const, name: '☕ Caoba Oscura Tradicional', desc: 'Tono café caoba clásico pulido' },
                  { id: 'minimal-oled' as const, name: '🖤 Minimalista Pizarra Oscura', desc: 'Línea de estante sutil y moderna' },
                  { id: 'digital-neon' as const, name: '⚡ Cristal Neón Convencional', desc: 'Estante de cristal pulido con acento suave' },
                  { id: 'digital-cyber' as const, name: '🌿 Verde Clásico Terminal', desc: 'Estante sutil con acento esmeralda' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onChangeShelfStyle(item.id)}
                    className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between gap-1 ${
                      shelfStyle === item.id
                        ? 'border-[var(--accent-pink)] bg-black/70 ring-1 ring-[var(--accent-pink)]'
                        : 'border-[var(--border-color)] bg-black/40 hover:border-white/20'
                    }`}
                  >
                    <div className="text-xs font-bold text-white flex items-center justify-between">
                      <span>{item.name}</span>
                      {shelfStyle === item.id && <Check className="w-3.5 h-3.5 text-[var(--accent-pink)]" />}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)]">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Photo & Texture Background Section */}
            <div className="pt-4 border-t border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-white block">
                    Fondo y Textura de la Estantería (Personalizada con Fotos):
                  </label>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Sube fotos de tu dispositivo o elige texturas góticas con oscurecimiento ajustable para óptima legibilidad.
                  </p>
                </div>
                {shelfBgConfig?.customImage && (
                  <span className="text-[10px] bg-[var(--accent-pink)]/20 text-[var(--accent-pink)] border border-[var(--accent-pink)]/40 px-2.5 py-0.5 rounded-full font-bold">
                    Foto Personalizada Activa
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsBgModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[var(--accent-pink)] to-[var(--accent-purple)] text-black font-cute font-bold text-xs shadow-lg hover:opacity-90 active:scale-95 transition flex items-center gap-2"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Subir Foto o Elegir Textura</span>
                </button>

                {shelfBgConfig?.customImage && (
                  <button
                    type="button"
                    onClick={() => onUpdateShelfBgConfig?.(DEFAULT_SHELF_BG)}
                    className="px-3.5 py-2.5 rounded-xl bg-black/60 border border-[var(--border-color)] hover:border-red-400 text-red-300 text-xs transition flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restablecer Fondo Original</span>
                  </button>
                )}
              </div>
            </div>

            {/* Stats Reset to Zero Section */}
            <div className="pt-4 border-t border-white/5 space-y-3">
              <label className="text-xs font-bold text-white block flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[var(--accent-pink)]" />
                <span>Reinicio de Estadísticas de Lectura:</span>
              </label>
              <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-xs text-white">
                    Borrar datos e iniciar desde cero (Día 1 al instalar)
                  </h4>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    Elimina el historial de minutos y sesiones para comenzar limpio. Las estadísticas se activarán con tu primera lectura.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowResetConfirmModal(true)}
                  className="px-4 py-2 rounded-xl text-xs font-cute font-bold bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 text-white transition flex items-center gap-2 shrink-0 active:scale-95 shadow-md"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Reiniciar Estadísticas a Cero</span>
                </button>
              </div>

              {statsResetSuccess && (
                <p className="text-xs text-emerald-400 font-bold bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/40">
                  ✨ Las estadísticas han sido reiniciadas a cero. Al leer tu primer libro comenzará tu registro.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Shelf Background Texture Modal */}
      <ShelfBackgroundModal
        isOpen={isBgModalOpen}
        onClose={() => setIsBgModalOpen(false)}
        config={shelfBgConfig || DEFAULT_SHELF_BG}
        onSaveConfig={(cfg) => {
          onUpdateShelfBgConfig?.(cfg);
        }}
      />

      {/* In-App Confirmation Modal to Reset Stats to Zero */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[var(--card-bg)] border border-red-500/40 rounded-3xl max-w-md w-full shadow-2xl p-6 animate-popIn">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-red-950/60 border border-red-500/50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="dark-reborn-font font-bold text-base sm:text-lg text-white">
                  ¿Reiniciar Estadísticas a Cero?
                </h3>
                <p className="text-xs text-red-300">
                  Modo de instalación limpia
                </p>
              </div>
            </div>

            <p className="text-xs text-[var(--text-main)] mb-3 leading-relaxed">
              Esta acción borrará todas las sesiones de lectura anteriores, tiempo acumulado y rachas.
            </p>
            <p className="text-xs text-[var(--text-muted)] mb-6 bg-black/40 p-3 rounded-xl border border-white/5">
              ✨ <strong>Inicio limpio:</strong> Tus estadísticas se pondrán a 0 y comenzarán automáticamente a registrarse con tu primera lectura al abrir cualquier tomo en la estantería.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:text-white bg-black/40 border border-[var(--border-color)] transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetStatsToZero?.();
                  setShowResetConfirmModal(false);
                  setStatsResetSuccess(true);
                  setTimeout(() => setStatsResetSuccess(false), 4500);
                }}
                className="px-4 py-2 rounded-xl text-xs font-cute font-bold bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white shadow-lg active:scale-95 transition flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sí, Reiniciar a Cero</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
