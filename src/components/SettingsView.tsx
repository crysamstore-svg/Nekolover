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
  AlertTriangle,
  ShieldCheck,
  Scale,
  FileText,
  Cookie,
  Clock,
  Shuffle,
  X,
  Download,
  Upload
} from 'lucide-react';
import { ReaderModeId, ThemeId, ShelfStyle, ShelfViewMode, ShelfBackgroundConfig, ShelfDecorConfig, ShelfDecorPropId, ShelfDecorTheme } from '../types';
import { READER_MODES, FONT_OPTIONS, THEME_OPTIONS } from '../data/defaultBooks';
import { ShelfBackgroundModal, DEFAULT_SHELF_BG } from './ShelfBackgroundModal';
import { ShelfDecorModal } from './ShelfDecorModal';
import { ShelfDecorArt } from './ShelfDecoration';
import {
  SHELF_DECOR_PRESETS,
  SHELF_DECOR_CATALOG,
  SHELF_BOOKEND_CATALOG,
  DEFAULT_SHELF_DECOR,
  getPresetConfigForUser,
  randomizeShelfDecorConfig
} from '../data/shelfDecorCatalog';
import { LegalTab } from './LegalModal';
import { vipManager } from '../utils/vipManager';

export interface HeaderButtonsConfig {
  showNightMode: boolean;
  showMusic: boolean;
  showTheme: boolean;
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
  shelfDecorConfig?: ShelfDecorConfig;
  onUpdateShelfDecorConfig?: (config: ShelfDecorConfig) => void;
  onResetStatsToZero?: () => void;
  onOpenLegalModal?: (tab: LegalTab) => void;
  onOpenStats?: () => void;
  onOpenQuotes?: () => void;
  quotesCount?: number;
  highlightsCount?: number;
  pageNotesCount?: number;
  collectionsCount?: number;
  onExportBackup?: () => void;
  onImportBackup?: (file: File) => void;
  isVip?: boolean;
  onOpenVipModal?: (reason?: 'music' | 'fonts' | 'shelf_bg' | 'stickers' | 'highlights' | 'notes' | 'shelf_decor') => void;
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
  shelfDecorConfig,
  onUpdateShelfDecorConfig,
  onResetStatsToZero,
  onOpenLegalModal,
  onOpenStats,
  onOpenQuotes,
  quotesCount = 0,
  highlightsCount = 0,
  pageNotesCount = 0,
  collectionsCount = 0,
  onExportBackup,
  onImportBackup,
  isVip = false,
  onOpenVipModal,
}) => {
  const [activeTab, setActiveTab] = useState<'contrast' | 'typography' | 'margins' | 'header' | 'shelf' | 'legal'>('contrast');
  const [isBgModalOpen, setIsBgModalOpen] = useState<boolean>(false);
  const [isDecorModalOpen, setIsDecorModalOpen] = useState<boolean>(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);
  const [statsResetSuccess, setStatsResetSuccess] = useState<boolean>(false);
  const backupInputRef = React.useRef<HTMLInputElement | null>(null);

  const effectiveDecorConfig = shelfDecorConfig ?? DEFAULT_SHELF_DECOR;

  const handleQuickSwitchDecor = (theme: ShelfDecorTheme) => {
    if (theme === 'none') {
      onUpdateShelfDecorConfig?.({
        ...effectiveDecorConfig,
        theme: 'none',
        enabledProps: [],
        bookend: 'none',
        ledGlow: false,
        hangingVines: false,
      });
      return;
    }
    onUpdateShelfDecorConfig?.(getPresetConfigForUser(theme, Boolean(isVip)));
  };

  const handleRandomizeDecor = () => {
    onUpdateShelfDecorConfig?.(randomizeShelfDecorConfig(Boolean(isVip)));
  };

  const handleRemoveSingleDecorProp = (propId: ShelfDecorPropId) => {
    const nextProps = effectiveDecorConfig.enabledProps.filter((id) => id !== propId);
    const hasBookend = Boolean(effectiveDecorConfig.bookend && effectiveDecorConfig.bookend !== 'none');
    onUpdateShelfDecorConfig?.({
      ...effectiveDecorConfig,
      enabledProps: nextProps,
      theme: nextProps.length === 0 && !hasBookend ? 'none' : effectiveDecorConfig.theme,
    });
  };

  const handleRemoveDecorBookend = () => {
    onUpdateShelfDecorConfig?.({
      ...effectiveDecorConfig,
      bookend: 'none',
      theme: effectiveDecorConfig.enabledProps.length === 0 ? 'none' : effectiveDecorConfig.theme,
    });
  };

  const currentModeConfig = READER_MODES.find(m => m.id === readerMode) || READER_MODES[0];

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full p-3 sm:p-8 animate-fadeIn">
      {/* Top Bar with Back Button + Direct Shortcuts for Decor, Stats & Quotes Vault */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 mb-5 sm:mb-6 pb-4 border-b border-[var(--border-color)]">
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
          <button
            onClick={onBack}
            className="min-h-[42px] px-3 py-2 rounded-xl text-xs font-cute font-bold bg-black/40 border border-[var(--border-color)] hover:border-[var(--accent-pink)] text-[var(--accent-pink)] transition flex items-center justify-center sm:justify-start gap-1.5 active:scale-95 shadow-md"
            title="Regresar a la estantería de libros"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span className="truncate">Biblioteca</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDecorModalOpen(true)}
            className="min-h-[42px] px-3 py-2 rounded-xl text-xs font-cute font-bold bg-[var(--accent-pink)]/15 border border-[var(--accent-pink)]/50 hover:bg-[var(--accent-pink)] hover:text-black text-[var(--accent-pink)] transition flex items-center justify-center sm:justify-start gap-1.5 active:scale-95 shadow-md"
            title="Decorar repisas con estilos Kawaii, Fantasía o Dark"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Decorar Estantería</span>
          </button>

          {onOpenStats && (
            <button
              type="button"
              onClick={onOpenStats}
              className="min-h-[42px] px-3 py-2 rounded-xl text-xs font-cute font-bold bg-black/40 border border-[var(--border-color)] hover:border-[var(--accent-purple)] text-[var(--text-main)] hover:text-white transition flex items-center justify-center sm:justify-start gap-1.5 active:scale-95 shadow-md"
              title="Ver gráficos y estadísticas de lectura"
            >
              <BarChart3 className="w-3.5 h-3.5 text-[var(--accent-purple)] shrink-0" />
              <span className="truncate">Estadísticas</span>
            </button>
          )}

          {onOpenQuotes && (
            <button
              type="button"
              onClick={onOpenQuotes}
              className="min-h-[42px] px-3 py-2 rounded-xl text-xs font-cute font-bold bg-black/40 border border-[var(--border-color)] hover:border-[var(--accent-pink)] text-[var(--text-main)] hover:text-white transition flex items-center justify-center sm:justify-start gap-1.5 active:scale-95 shadow-md"
              title="Ver Baúl de Citas, Subrayados y Notas del Libro"
            >
              <QuoteIcon className="w-3.5 h-3.5 text-[var(--accent-pink)] shrink-0" />
              <span className="truncate">Citas y Notas</span>
              {quotesCount + highlightsCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-md font-bold bg-[var(--accent-pink)] text-black shrink-0">
                  {quotesCount + highlightsCount}
                </span>
              )}
            </button>
          )}
        </div>

        <div className="sm:text-right">
          <h2 className="dark-reborn-font font-bold text-base sm:text-xl text-[var(--accent-pink)] flex items-center sm:justify-end gap-2">
            <span>⚙️</span>
            <span>Configuraciones Literarias</span>
          </h2>
          <p className="text-[11px] text-[var(--text-muted)]">
            Ajustes de lectura, decoraciones, estadísticas, cabecera y legalidad
          </p>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2.5 mb-5 sm:mb-6 -mx-1 px-1 scrollbar-none">
        <button
          onClick={() => setActiveTab('contrast')}
          className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
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
          className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
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
          className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
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
          className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
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
          className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'shelf'
              ? 'bg-[var(--accent-pink)] text-black shadow-lg'
              : 'bg-black/40 text-[var(--text-muted)] hover:text-white border border-[var(--border-color)]'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Mi Estantería</span>
        </button>

        <button
          onClick={() => setActiveTab('legal')}
          className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'legal'
              ? 'bg-amber-400 text-black shadow-lg'
              : 'bg-black/40 text-amber-300 hover:text-white border border-amber-400/30'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Legal & Privacidad</span>
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
                Activa qué accesos directos y botones se muestran en la pantalla principal (solo aparecen los que actives aquí):
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {[
                { key: 'showNightMode' as const, label: 'Botón de Modo Noche Rápido (Sol / Luna)', desc: 'Interruptor directo para alternar alto contraste OLED', icon: '🌙' },
                { key: 'showMusic' as const, label: 'Botón de Reproductor de Música (VIP)', desc: 'Acceso rápido a tus canciones y pistas de fondo', icon: '🎶' },
                { key: 'showTheme' as const, label: 'Botón de Selector de Temas', desc: 'Acceso rápido al modal de paletas de color', icon: '🎨' },
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

            {/* Shelf Decorations (Kawaii · Fantasía · Dark) Section */}
            <div className="pt-4 border-t border-white/5 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[var(--accent-pink)]" />
                    <span>Decoraciones de Estantería (Kawaii · Fantasía · Dark):</span>
                  </label>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    Coloca lámparas, jarrones, cuadros, gatos y luz LED descansando directamente sobre tus repisas.
                  </p>
                </div>

                <span className="text-[11px] self-start sm:self-auto text-[var(--accent-pink)] font-semibold whitespace-nowrap">
                  {effectiveDecorConfig.theme === 'none'
                    ? 'Sin decoración'
                    : `${effectiveDecorConfig.enabledProps.length} piezas${
                        effectiveDecorConfig.bookend && effectiveDecorConfig.bookend !== 'none'
                          ? ' · Con sujetalibros'
                          : ''
                      } · ${
                        effectiveDecorConfig.theme === 'kawaii'
                          ? 'Kawaii'
                          : effectiveDecorConfig.theme === 'fantasy'
                          ? 'Fantasía'
                          : 'Dark'
                      }`}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {SHELF_DECOR_PRESETS.map((preset) => {
                  const isActive = effectiveDecorConfig.theme === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleQuickSwitchDecor(preset.id)}
                      className={`min-h-[82px] p-3 rounded-xl border text-left transition flex flex-col justify-between gap-2 ${
                        isActive
                          ? 'border-[var(--accent-pink)] bg-[var(--accent-pink)]/12 ring-1 ring-[var(--accent-pink)]'
                          : 'border-[var(--border-color)] bg-black/40 hover:border-white/25'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-white truncate">{preset.shortLabel}</span>
                        {isActive && <Check className="w-3.5 h-3.5 text-[var(--accent-pink)] shrink-0" />}
                      </div>
                      <div className="flex items-center gap-1">
                        {preset.props.slice(0, 3).map((pid) => (
                          <div key={pid} className="w-6 h-6 shrink-0">
                            <ShelfDecorArt id={pid} />
                          </div>
                        ))}
                      </div>
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => handleQuickSwitchDecor('none')}
                  className={`min-h-[82px] p-3 rounded-xl border text-left transition flex flex-col justify-between gap-2 ${
                    effectiveDecorConfig.theme === 'none'
                      ? 'border-[var(--accent-pink)] bg-white/10 ring-1 ring-[var(--accent-pink)]'
                      : 'border-[var(--border-color)] bg-black/40 hover:border-white/25'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-white">Sin piezas</span>
                    {effectiveDecorConfig.theme === 'none' && (
                      <Check className="w-3.5 h-3.5 text-[var(--accent-pink)] shrink-0" />
                    )}
                  </div>
                  <span className="text-[11px] text-[var(--text-muted)]">Solo libros en repisas</span>
                </button>
              </div>

              {/* Active Decorations Quick Remove Chips */}
              {effectiveDecorConfig.theme !== 'none' &&
                (effectiveDecorConfig.enabledProps.length > 0 ||
                  (effectiveDecorConfig.bookend && effectiveDecorConfig.bookend !== 'none')) && (
                  <div className="p-3 rounded-xl bg-black/35 border border-white/10 space-y-2">
                    <span className="text-[11px] font-semibold text-[var(--text-muted)] block">
                      Piezas activas en tus repisas (toca ✕ para quitar alguna):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {effectiveDecorConfig.enabledProps.map((propId) => {
                        const meta = SHELF_DECOR_CATALOG.find((item) => item.id === propId);
                        if (!meta) return null;
                        return (
                          <button
                            key={propId}
                            type="button"
                            onClick={() => handleRemoveSingleDecorProp(propId)}
                            className="inline-flex items-center gap-1.5 pl-2.5 pr-2 py-1 rounded-full bg-white/5 hover:bg-rose-950/60 border border-white/15 hover:border-rose-400/60 text-[11px] text-white transition group cursor-pointer"
                            title={`Quitar ${meta.name}`}
                          >
                            <span>{meta.name}</span>
                            <X className="w-3 h-3 text-white/60 group-hover:text-rose-300" />
                          </button>
                        );
                      })}
                      {effectiveDecorConfig.bookend && effectiveDecorConfig.bookend !== 'none' && (() => {
                        const bkMeta = SHELF_BOOKEND_CATALOG.find(
                          (b) => b.id === effectiveDecorConfig.bookend
                        );
                        return (
                          <button
                            type="button"
                            onClick={handleRemoveDecorBookend}
                            className="inline-flex items-center gap-1.5 pl-2.5 pr-2 py-1 rounded-full bg-[var(--accent-pink)]/10 hover:bg-rose-950/60 border border-[var(--accent-pink)]/40 hover:border-rose-400/60 text-[11px] text-[var(--accent-pink)] hover:text-white transition group cursor-pointer"
                            title={`Quitar sujetalibros ${bkMeta?.name || ''}`}
                          >
                            <span>📚 {bkMeta?.name || 'Sujetalibros'}</span>
                            <X className="w-3 h-3 opacity-75 group-hover:text-rose-300" />
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                )}

              <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsDecorModalOpen(true)}
                  className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-[var(--accent-pink)] to-[var(--accent-purple)] text-black font-cute font-bold text-xs shadow-lg hover:opacity-90 active:scale-95 transition flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Decorar Estantería y Elegir Piezas</span>
                </button>

                <button
                  type="button"
                  onClick={handleRandomizeDecor}
                  className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl bg-black/50 border border-[var(--accent-pink)]/55 text-[var(--accent-pink)] hover:bg-[var(--accent-pink)] hover:text-black font-cute font-bold text-xs shadow-md active:scale-95 transition flex items-center justify-center gap-2"
                  title="Elegir decoración y sujetalibros aleatoriamente"
                >
                  <Shuffle className="w-4 h-4" />
                  <span>Aleatorio</span>
                </button>
              </div>
            </div>

            {/* Custom Photo & Texture Background Section */}
            <div className="pt-4 border-t border-white/5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <label className="text-xs font-bold text-white block">
                    Fondo y Textura de la Estantería (Personalizada con Fotos):
                  </label>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Sube fotos de tu dispositivo o elige texturas góticas con oscurecimiento ajustable para óptima legibilidad.
                  </p>
                </div>
                {shelfBgConfig?.customImage && (
                  <span className="text-[10px] bg-[var(--accent-pink)]/20 text-[var(--accent-pink)] border border-[var(--accent-pink)]/40 px-2.5 py-0.5 rounded-full font-bold shrink-0">
                    Foto Personalizada Activa
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsBgModalOpen(true)}
                  className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-[var(--accent-pink)] to-[var(--accent-purple)] text-black font-cute font-bold text-xs shadow-lg hover:opacity-90 active:scale-95 transition flex items-center justify-center gap-2"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Subir Foto o Elegir Textura</span>
                </button>

                {shelfBgConfig?.customImage && (
                  <button
                    type="button"
                    onClick={() => onUpdateShelfBgConfig?.(DEFAULT_SHELF_BG)}
                    className="w-full sm:w-auto min-h-[42px] px-3.5 py-2.5 rounded-xl bg-black/60 border border-[var(--border-color)] hover:border-red-400 text-red-300 text-xs transition flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restablecer Fondo Original</span>
                  </button>
                )}
              </div>
            </div>

            {/* Reading Stats, Quotes/Notes Vault & Stats Reset Section */}
            <div className="pt-4 border-t border-white/5 space-y-3">
              <label className="text-xs font-bold text-white block flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[var(--accent-pink)]" />
                <span>Estadísticas de Lectura y Baúl de Citas / Notas:</span>
              </label>

              {/* Direct access cards for Stats and Quotes/Notes Vault */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-black/45 border border-[var(--accent-purple)]/35 flex flex-col justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
                      <BarChart3 className="w-3.5 h-3.5 text-[var(--accent-purple)]" />
                      <span>Estadísticas de Lectura</span>
                    </h4>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1">
                      Visualiza tus minutos leídos, páginas diarias, rachas activas y gráficos de progreso.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenStats?.()}
                    className="w-full px-3.5 py-2 rounded-xl text-xs font-cute font-bold bg-[var(--accent-purple)]/20 hover:bg-[var(--accent-purple)] text-[var(--accent-purple)] hover:text-black border border-[var(--accent-purple)]/50 transition flex items-center justify-center gap-2 active:scale-95"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Ver Estadísticas de Lectura</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-black/45 border border-[var(--accent-pink)]/35 flex flex-col justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
                      <QuoteIcon className="w-3.5 h-3.5 text-[var(--accent-pink)]" />
                      <span>Baúl de Citas y Notas del Libro</span>
                      {quotesCount + highlightsCount > 0 && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-[var(--accent-pink)] text-black font-bold">
                          {quotesCount + highlightsCount}
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1">
                      Consulta todas tus citas literarias, reflexiones y frases subrayadas de cada libro.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenQuotes?.()}
                    className="w-full px-3.5 py-2 rounded-xl text-xs font-cute font-bold bg-[var(--accent-pink)]/20 hover:bg-[var(--accent-pink)] text-[var(--accent-pink)] hover:text-black border border-[var(--accent-pink)]/50 transition flex items-center justify-center gap-2 active:scale-95"
                  >
                    <QuoteIcon className="w-3.5 h-3.5" />
                    <span>Ver Citas y Notas del Libro</span>
                  </button>
                </div>
              </div>

              {/* Copia de Seguridad (Exportar / Importar Respaldo JSON) */}
              {(onExportBackup || onImportBackup) && (
                <div className="p-4 rounded-xl bg-black/45 border border-[var(--accent-purple)]/35 space-y-3">
                  <div>
                    <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
                      <Download className="w-3.5 h-3.5 text-[var(--accent-pink)]" />
                      <span>Copia de Seguridad de tus Datos (Exportar / Importar)</span>
                    </h4>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-relaxed">
                      Guarda un respaldo con tu progreso de lectura, {quotesCount} citas, {pageNotesCount} notas en líneas, {highlightsCount} subrayados, stickers, marcadores, {collectionsCount} sagas y personalización para restaurarlos en otro dispositivo.
                    </p>
                  </div>

                  <input
                    ref={backupInputRef}
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      if (file) onImportBackup?.(file);
                    }}
                  />

                  <div className="flex flex-wrap items-center gap-2.5">
                    {onExportBackup && (
                      <button
                        type="button"
                        onClick={onExportBackup}
                        className="px-4 py-2 rounded-xl text-xs font-cute font-bold bg-gradient-to-r from-[var(--accent-pink)] to-[var(--accent-purple)] text-black shadow-md hover:opacity-90 active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar Respaldo (.json)</span>
                      </button>
                    )}
                    {onImportBackup && (
                      <button
                        type="button"
                        onClick={() => backupInputRef.current?.click()}
                        className="px-4 py-2 rounded-xl text-xs font-cute font-bold bg-black/60 border border-[var(--accent-purple)]/50 text-[var(--accent-purple)] hover:bg-[var(--accent-purple)] hover:text-black transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Restaurar Respaldo</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

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

      {/* TAB 6: LEGAL, PRIVACIDAD & CUMPLIMIENTO NORMATIVO */}
      {activeTab === 'legal' && (
        <div className="space-y-6">
          <div className="bg-[var(--card-bg)] border border-amber-400/40 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div>
                <h3 className="font-bold text-base sm:text-lg text-amber-300 flex items-center gap-2">
                  <Scale className="w-5 h-5 text-amber-400" />
                  <span>Centro Legal, Privacidad y Transparencia</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-mono">
                    Versión 1.0.0
                  </span>
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Cumplimiento exhaustivo de los 9 principios de legalidad, RGPD y protección del consumidor
                </p>
              </div>

              <button
                type="button"
                onClick={() => onOpenLegalModal?.('terms')}
                className="px-4 py-2 rounded-xl text-xs font-cute font-bold bg-gradient-to-r from-amber-400 to-pink-500 text-black shadow hover:brightness-110 transition shrink-0 active:scale-95"
              >
                Abrir Modal Legal Completo 📜
              </button>
            </div>

            {/* Quick Access Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => onOpenLegalModal?.('terms')}
                className="p-3 rounded-xl bg-black/40 border border-white/10 hover:border-[var(--accent-pink)] text-left transition group"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-white group-hover:text-[var(--accent-pink)]">
                  <FileText className="w-4 h-4 text-[var(--accent-pink)]" />
                  <span>1. Términos</span>
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mt-1">
                  Uso local y exención de contenido
                </div>
              </button>

              <button
                type="button"
                onClick={() => onOpenLegalModal?.('privacy')}
                className="p-3 rounded-xl bg-black/40 border border-white/10 hover:border-emerald-400 text-left transition group"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-white group-hover:text-emerald-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>2. Privacidad</span>
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mt-1">
                  Sin recopilación de datos personales
                </div>
              </button>

              <button
                type="button"
                onClick={() => onOpenLegalModal?.('cookies')}
                className="p-3 rounded-xl bg-black/40 border border-white/10 hover:border-purple-400 text-left transition group"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-white group-hover:text-purple-300">
                  <Cookie className="w-4 h-4 text-purple-400" />
                  <span>3. Cookies</span>
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mt-1">
                  LocalStorage e IndexedDB local
                </div>
              </button>

              <button
                type="button"
                onClick={() => onOpenLegalModal?.('refund')}
                className="p-3 rounded-xl bg-black/40 border border-white/10 hover:border-amber-400 text-left transition group"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-white group-hover:text-amber-300">
                  <RotateCcw className="w-4 h-4 text-amber-400" />
                  <span>4. Reembolso</span>
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mt-1">
                  3 días gratis • Cancelable en PayPal
                </div>
              </button>
            </div>

            {/* 9 Pillars of Compliance breakdown */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Resumen de Cumplimiento Normativo (9 Requisitos Implementados):
              </h4>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-black/50 border border-white/10">
                  <span className="font-bold text-[var(--accent-pink)]">1. Términos y Condiciones de Uso:</span>
                  <p className="text-[11px] text-white/80 mt-0.5">
                    Se estipula expresamente la naturaleza local del software y la exclusiva responsabilidad del usuario respecto a los archivos PDF y EPUB cargados en su lector.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-black/50 border border-white/10">
                  <span className="font-bold text-emerald-300">2. Política de Privacidad & 7. Minimización de Datos:</span>
                  <p className="text-[11px] text-white/80 mt-0.5">
                    No se recopilan libros ni datos de lectura. En <strong>PayPal</strong> no se solicitan datos bancarios en la app; en <strong>Pago Móvil (Venezuela)</strong> solo se solicita banco, teléfono emisor, referencia y contacto para validar la transferencia y entregar tu código VIP.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-black/50 border border-white/10">
                  <span className="font-bold text-purple-300">3. Política de Cookies y Almacenamiento Local:</span>
                  <p className="text-[11px] text-white/80 mt-0.5">
                    Se informa con total transparencia del uso de <code className="text-pink-300">localStorage</code> para registrar el estado de suscripción (<code className="text-pink-300">usuario_premium</code>) y preferencias, con banner de consentimiento explícito.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-black/50 border border-white/10">
                  <span className="font-bold text-amber-300">4. Formulario con 2 Casillas Separadas:</span>
                  <p className="text-[11px] text-white/80 mt-0.5">
                    El checkout VIP (PayPal y Pago Móvil) exige de forma obligatoria e independiente una casilla para Términos + Reembolso y otra casilla separada para Privacidad.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-black/50 border border-white/10">
                  <span className="font-bold text-blue-300">5. Registro de Consentimiento (Audit Trail):</span>
                  <p className="text-[11px] text-white/80 mt-0.5">
                    Se guarda registro técnico con fecha, hora exacta, versión legal (1.0.0) y casillas aceptadas, accesible para inspección por parte del usuario.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-black/50 border border-white/10">
                  <span className="font-bold text-rose-300">6. Política de Cancelación y Reembolso:</span>
                  <p className="text-[11px] text-white/80 mt-0.5">
                    <strong>PayPal</strong> incluye 3 días de prueba gratis cancelables sin cobro. <strong>Pago Móvil</strong> funciona como pago único de 30 días sin renovación automática. Las ventas de bienes digitales entregados son definitivas; ante incidencias de activación, soporte directo en <a href="mailto:nekolover.online@nekolover.Online" className="text-amber-300 underline font-mono">nekolover.online@nekolover.Online</a> o WhatsApp.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-black/50 border border-white/10">
                  <span className="font-bold text-cyan-300">8. Verificación de Derechos de Imágenes:</span>
                  <p className="text-[11px] text-white/80 mt-0.5">
                    Los stickers e iconos son estándar Unicode y SVG propios. Los fondos de estantería predeterminados proceden de Unsplash con licencia comercial libre. Las fotos subidas desde el dispositivo son responsabilidad del usuario.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-black/50 border border-white/10">
                  <span className="font-bold text-lime-300">9. Revisión de Leyes Locales e Internacionales:</span>
                  <p className="text-[11px] text-white/80 mt-0.5">
                    Cumplimiento con el RGPD (UE 2016/679), Directiva de Privacidad Electrónica (ePrivacy / LSSI-CE) y normativas de derechos de los consumidores en servicios digitales.
                  </p>
                </div>
              </div>
            </div>

            {/* Audit Log preview inside Settings */}
            <div className="pt-3 border-t border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Tu Registro de Consentimiento Guardado en este Dispositivo:</span>
                </span>
                <button
                  type="button"
                  onClick={() => onOpenLegalModal?.('audit')}
                  className="text-[11px] text-amber-300 hover:underline font-mono"
                >
                  Ver Todos ↗
                </button>
              </div>

              {vipManager.getConsentLogs().length === 0 ? (
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-[11px] text-[var(--text-muted)] text-center">
                  Aún no se ha registrado un consentimiento formal en este dispositivo.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {vipManager.getConsentLogs().slice(0, 2).map((log) => (
                    <div key={log.id} className="p-2.5 rounded-xl bg-black/60 border border-white/10 text-[10px] space-y-1">
                      <div className="flex items-center justify-between font-bold text-amber-300">
                        <span>
                          {log.consentType === 'vip_checkout_paypal'
                            ? 'Checkout PayPal ($2/mes)'
                            : log.consentType === 'vip_checkout_pago_movil'
                              ? 'Checkout Pago Móvil ($2/mes)'
                              : 'Cartel de Cookies & Privacidad'}
                        </span>
                        <span className="text-[var(--text-muted)] font-mono">{log.formattedDate}</span>
                      </div>
                      <div className="text-white/80 font-mono">
                        Términos: {log.termsAccepted ? '✅' : '❌'} | Privacidad: {log.privacyAccepted ? '✅' : '❌'} | Reembolso: {log.refundPolicyAccepted ? '✅' : '❌'} | Versión: {log.legalVersion}
                      </div>
                    </div>
                  ))}
                </div>
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
        isVip={isVip}
        onOpenVipModal={() => onOpenVipModal?.('shelf_bg')}
      />

      {/* Shelf Decorations Modal */}
      <ShelfDecorModal
        isOpen={isDecorModalOpen}
        onClose={() => setIsDecorModalOpen(false)}
        config={effectiveDecorConfig}
        onSaveConfig={(nextCfg) => {
          onUpdateShelfDecorConfig?.(nextCfg);
        }}
        isVip={isVip}
        onOpenVipModal={() => onOpenVipModal?.('shelf_decor')}
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
