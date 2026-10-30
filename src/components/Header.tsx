import React, { useRef } from 'react';
import { 
  BookOpen, 
  Quote as QuoteIcon, 
  Bookmark as BookmarkIcon, 
  Palette, 
  UploadCloud, 
  Volume2, 
  Music, 
  BarChart3, 
  Moon, 
  Sun,
  Download,
  MoreVertical
} from 'lucide-react';
import { HeaderButtonsConfig } from './SettingsView';

interface HeaderProps {
  currentView: 'library' | 'quotes' | 'bookmarks' | 'stats' | 'settings';
  onSwitchView: (view: 'library' | 'quotes' | 'bookmarks' | 'stats' | 'settings') => void;
  onOpenThemeModal: () => void;
  onOpenAudioModal: () => void;
  onFileUpload: (files: FileList) => void;
  quotesCount: number;
  bookmarksCount: number;
  isAudioPlaying: boolean;
  isNightMode: boolean;
  onToggleNightMode: () => void;
  onDownloadZip?: () => void;
  headerConfig?: HeaderButtonsConfig;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onSwitchView,
  onOpenThemeModal,
  onOpenAudioModal,
  onFileUpload,
  quotesCount,
  bookmarksCount,
  isAudioPlaying,
  isNightMode,
  onToggleNightMode,
  onDownloadZip,
  headerConfig
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNativeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files);
      e.target.value = '';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[var(--card-bg)] border-b border-[var(--border-color)] px-3 sm:px-6 py-2.5 flex items-center justify-between shadow-xl transition-colors duration-300">
      {/* Brand & Logo */}
      <div 
        onClick={() => onSwitchView('library')}
        className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer group shrink-0"
      >
        <div className="cat-ears-badge w-10 h-10 rounded-2xl bg-gradient-to-tr from-[var(--accent-pink)] to-[var(--accent-purple)] flex items-center justify-center text-xl shadow-lg transform group-hover:scale-105 transition-transform">
          🐾
        </div>
        <div>
          <h1 className="dark-reborn-title text-base sm:text-xl font-bold bg-gradient-to-r from-[var(--accent-pink)] via-[var(--accent-purple)] to-[var(--accent-secondary)] bg-clip-text text-transparent leading-tight">
            NekoLover Read
          </h1>
          <p className="text-[10px] sm:text-xs text-[var(--accent-purple)] font-medium flex items-center gap-1">
            <span>Dark Reborn & EPUB Engine</span>
            <span className="hidden sm:inline">🦇🖤</span>
          </p>
        </div>
      </div>

      {/* Navigation & Controls */}
      <nav className="flex items-center space-x-1 sm:space-x-2">
        {/* Library Tab */}
        <button
          onClick={() => onSwitchView('library')}
          className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-1.5 transition ${
            currentView === 'library'
              ? 'bg-[var(--accent-pink)] text-black font-bold shadow-md'
              : 'text-[var(--text-main)] hover:bg-white/10'
          }`}
          title="Ver estantería de libros"
        >
          <BookOpen className="w-4 h-4" />
          <span className="hidden sm:inline">Biblioteca</span>
        </button>

        {/* Quotes Tab */}
        {(!headerConfig || headerConfig.showQuotes) && (
          <button
            onClick={() => onSwitchView('quotes')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-1.5 transition relative ${
              currentView === 'quotes'
                ? 'bg-[var(--accent-pink)] text-black font-bold shadow-md'
                : 'text-[var(--text-main)] hover:bg-white/10'
            }`}
            title="Ver citas y notas literarias"
          >
            <QuoteIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Notas</span>
            {quotesCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                currentView === 'quotes' ? 'bg-black/80 text-white' : 'bg-[var(--accent-pink)] text-black'
              }`}>
                {quotesCount}
              </span>
            )}
          </button>
        )}

        {/* Stats Tab */}
        {(!headerConfig || headerConfig.showStats) && (
          <button
            onClick={() => onSwitchView('stats')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-1.5 transition relative ${
              currentView === 'stats'
                ? 'bg-[var(--accent-pink)] text-black font-bold shadow-md'
                : 'text-[var(--text-main)] hover:bg-white/10'
            }`}
            title="Ver panel de estadísticas de lectura y gráficos"
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Estadísticas</span>
          </button>
        )}

        {/* Bookmarks Tab */}
        {(!headerConfig || headerConfig.showBookmarks) && (
          <button
            onClick={() => onSwitchView('bookmarks')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-1.5 transition relative ${
              currentView === 'bookmarks'
                ? 'bg-[var(--accent-pink)] text-black font-bold shadow-md'
                : 'text-[var(--text-main)] hover:bg-white/10'
            }`}
            title="Ver marcadores guardados"
          >
            <BookmarkIcon className="w-4 h-4" />
            <span className="hidden md:inline">Marcadores</span>
            {bookmarksCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                currentView === 'bookmarks' ? 'bg-black/80 text-white' : 'bg-[var(--accent-purple)] text-black'
              }`}>
                {bookmarksCount}
              </span>
            )}
          </button>
        )}

        {/* Global Night Mode Toggle */}
        {(!headerConfig || headerConfig.showNightMode) && (
          <button
            onClick={onToggleNightMode}
            className={`px-2.5 sm:px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition active:scale-95 ${
              isNightMode
                ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.4)] font-bold'
                : 'bg-black/40 text-[var(--text-muted)] border-[var(--border-color)] hover:border-white hover:text-white'
            }`}
            title={
              isNightMode
                ? 'Desactivar Modo Noche (Restaurar colores)'
                : 'Activar Modo Noche: Negro puro OLED y escala de grises de alto contraste para oscuridad total'
            }
          >
            {isNightMode ? (
              <Sun className="w-4 h-4 text-black stroke-[2.5]" />
            ) : (
              <Moon className="w-4 h-4 text-gray-300" />
            )}
            <span className="hidden sm:inline font-cute">
              {isNightMode ? 'Modo Noche' : 'Noche'}
            </span>
          </button>
        )}

        {/* Ambient Lo-Fi Sound Toggle */}
        {(!headerConfig || headerConfig.showAudio) && (
          <button
            onClick={onOpenAudioModal}
            className={`px-2.5 sm:px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 border transition ${
              isAudioPlaying
                ? 'bg-[var(--accent-purple)]/25 text-[var(--accent-purple)] border-[var(--accent-purple)] animate-pulse'
                : 'bg-black/30 text-[var(--text-muted)] border-[var(--border-color)] hover:text-[var(--accent-purple)] hover:border-[var(--accent-purple)]/60'
            }`}
            title="Sonido ambiental Lo-Fi (Lluvia Gótica & Ronroneo Neko)"
          >
            {isAudioPlaying ? <Volume2 className="w-4 h-4 text-[var(--accent-purple)]" /> : <Music className="w-4 h-4" />}
            <span className="hidden lg:inline font-cute font-medium">Ambiente</span>
          </button>
        )}

        {/* Theme Modal Trigger */}
        {(!headerConfig || headerConfig.showTheme) && (
          <button
            onClick={onOpenThemeModal}
            className="p-2 sm:px-3 sm:py-2 bg-black/40 border border-[var(--border-color)] hover:border-[var(--accent-pink)] rounded-xl text-xs text-[var(--accent-pink)] font-cute flex items-center gap-1.5 transition shadow-sm"
            title="Cambiar Paleta & Tema Dark Reborn"
          >
            <Palette className="w-4 h-4" />
            <span className="hidden md:inline">Temas</span>
          </button>
        )}

        {/* Download ZIP Package Button */}
        {(!headerConfig || headerConfig.showZip) && onDownloadZip && (
          <button
            onClick={onDownloadZip}
            className="p-2 sm:px-3 sm:py-2 bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-[var(--accent-pink)]/60 hover:bg-[var(--accent-pink)] hover:text-black rounded-xl text-xs text-[var(--accent-pink)] font-cute font-bold flex items-center gap-1.5 transition shadow-sm active:scale-95"
            title="Descargar paquete ZIP del proyecto (Android & Web)"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">ZIP</span>
          </button>
        )}

        {/* File Upload Trigger */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[var(--accent-pink)]/20 text-[var(--accent-pink)] border border-[var(--accent-pink)]/50 hover:bg-[var(--accent-pink)] hover:text-black transition flex items-center space-x-1.5 shadow-sm active:scale-95"
          title="Subir archivo EPUB, PDF o Texto"
        >
          <UploadCloud className="w-4 h-4" />
          <span className="hidden xs:inline">Subir</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.epub,.txt,.md"
          multiple
          className="hidden"
          onChange={handleNativeFileChange}
        />

        {/* Three Dots Button: Settings Page Access */}
        <button
          onClick={() => onSwitchView('settings')}
          className={`p-2 sm:px-2.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1 transition ${
            currentView === 'settings'
              ? 'bg-[var(--accent-pink)] text-black font-bold shadow-md'
              : 'text-[var(--text-main)] hover:bg-white/10 hover:text-[var(--accent-pink)]'
          }`}
          title="Configuraciones: Modo de Contraste, Tipografía, Márgenes, Botones del Header"
          aria-label="Configuraciones"
        >
          <MoreVertical className="w-4 h-4" />
          <span className="hidden xl:inline">Ajustes</span>
        </button>
      </nav>
    </header>
  );
};
