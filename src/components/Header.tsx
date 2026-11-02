import React from 'react';
import { ArrowLeft, Crown } from 'lucide-react';

interface HeaderProps {
  currentView: 'library' | 'quotes' | 'bookmarks' | 'stats' | 'settings' | 'vip';
  onSwitchView: (view: 'library' | 'quotes' | 'bookmarks' | 'stats' | 'settings' | 'vip') => void;
  isVip?: boolean;
  onOpenVipModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onSwitchView,
  isVip,
  onOpenVipModal
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[var(--card-bg)] border-b border-[var(--border-color)] px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-xl transition-colors duration-300">
      {/* Brand & Logo - Clean header without buttons next to it */}
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

      {/* Right side: Clean minimal status & Return to library when in other views */}
      <div className="flex items-center gap-2">
        {currentView !== 'library' && (
          <button
            onClick={() => onSwitchView('library')}
            className="px-3 py-1.5 rounded-xl text-xs font-cute font-bold bg-black/40 border border-[var(--border-color)] hover:border-[var(--accent-pink)] text-[var(--accent-pink)] transition flex items-center gap-1.5 shadow-sm active:scale-95"
            title="Volver a la Biblioteca"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a Estantería</span>
          </button>
        )}

        {isVip && (
          <div 
            onClick={onOpenVipModal}
            className="px-2.5 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-bold flex items-center gap-1 cursor-pointer shadow-sm hover:bg-amber-400/30 transition"
            title="Membresía VIP Activa"
          >
            <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="hidden sm:inline font-mono">VIP</span>
          </div>
        )}
      </div>
    </header>
  );
};
