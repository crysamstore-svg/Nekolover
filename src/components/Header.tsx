import React from 'react';
import { ArrowLeft, Crown } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

export type HeaderSectionView =
  | 'library'
  | 'quotes'
  | 'bookmarks'
  | 'stats'
  | 'settings'
  | 'vip';

interface HeaderProps {
  currentView: HeaderSectionView;
  onSwitchView: (view: HeaderSectionView) => void;
  isVip?: boolean;
  onOpenVipModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onSwitchView,
  isVip,
  onOpenVipModal,
}) => {
  const isBooksSection = currentView === 'library';

  return (
    <header className="sticky top-0 z-40 bg-[var(--card-bg)] border-b border-[var(--border-color)] px-3 sm:px-6 py-2 flex items-center justify-between gap-2 sm:gap-6 shadow-xl transition-colors duration-300">
      {/* Zone 1: Brand & Logo */}
      <button
        type="button"
        onClick={() => onSwitchView('library')}
        className="flex items-center gap-2 sm:gap-3 cursor-pointer group min-w-0 text-left shrink-0"
      >
        <img
          src="/nekolover-192x192.png"
          alt="NekoLover Read"
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-cover border border-[var(--accent-pink)]/50 shadow-lg group-hover:scale-105 transition-transform shrink-0"
        />
        <div className="min-w-0 hidden min-[410px]:block">
          <span className="dark-reborn-title block text-xs sm:text-lg font-bold text-[var(--accent-pink)] leading-tight truncate whitespace-nowrap">
            NekoLover Read
          </span>
          <span className="hidden lg:block text-[11px] text-[var(--accent-purple)] font-medium truncate whitespace-nowrap">
            Dark Reborn &amp; EPUB Engine
          </span>
        </div>
      </button>

      {/* Zone 2: Primary Action & Install */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <PWAInstallButton />

        {!isBooksSection && (
          <button
            type="button"
            onClick={() => onSwitchView('library')}
            className="min-h-[36px] px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-cute font-bold bg-black/40 border border-[var(--border-color)] hover:border-[var(--accent-pink)] text-[var(--accent-pink)] transition flex items-center gap-1.5 shadow-sm active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
            title="Volver a la Biblioteca"
          >
            <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Estantería</span>
          </button>
        )}

        {isVip && (
          <button
            type="button"
            onClick={onOpenVipModal}
            className="min-h-[36px] px-2.5 py-1 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-bold flex items-center gap-1 cursor-pointer shadow-sm hover:bg-amber-400/30 transition whitespace-nowrap shrink-0"
            title="Membresía VIP Activa"
          >
            <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="hidden sm:inline font-mono">VIP</span>
          </button>
        )}
      </div>
    </header>
  );
};
