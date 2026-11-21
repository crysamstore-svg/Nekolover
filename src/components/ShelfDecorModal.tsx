import React, { useState, useEffect } from 'react';
import { X, Check, Sparkles, Sun, Trees, Eraser, BookMarked, Shuffle, Crown, Lock } from 'lucide-react';
import {
  ShelfBookendId,
  ShelfDecorConfig,
  ShelfDecorPropId,
  ShelfDecorTheme,
} from '../types';
import {
  SHELF_BOOKEND_CATALOG,
  SHELF_DECOR_CATALOG,
  SHELF_DECOR_PRESETS,
  getPresetConfigForUser,
  isShelfBookendVip,
  isShelfPropVip,
  randomizeShelfDecorConfig,
} from '../data/shelfDecorCatalog';
import { ShelfBookendArt, ShelfDecorArt } from './ShelfDecoration';

interface ShelfDecorModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ShelfDecorConfig;
  onSaveConfig: (nextConfig: ShelfDecorConfig) => void;
  isVip?: boolean;
  onOpenVipModal?: () => void;
}

export const ShelfDecorModal: React.FC<ShelfDecorModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  isVip = false,
  onOpenVipModal,
}) => {
  const [draft, setDraft] = useState<ShelfDecorConfig>(() => ({
    theme: config.theme,
    enabledProps: [...config.enabledProps],
    bookend: config.bookend ?? 'none',
    ledGlow: config.ledGlow,
    hangingVines: config.hangingVines,
  }));
  const [filterCat, setFilterCat] = useState<'all' | Exclude<ShelfDecorTheme, 'none'>>(
    config.theme === 'none' ? 'all' : config.theme
  );

  useEffect(() => {
    if (!isOpen) return;
    setDraft({
      theme: config.theme,
      enabledProps: [...config.enabledProps],
      bookend: config.bookend ?? 'none',
      ledGlow: config.ledGlow,
      hangingVines: config.hangingVines,
    });
    setFilterCat(config.theme === 'none' ? 'all' : config.theme);
  }, [isOpen, config]);

  if (!isOpen) return null;

  const handleSelectPreset = (presetId: Exclude<ShelfDecorTheme, 'none'>) => {
    const nextCfg = getPresetConfigForUser(presetId, Boolean(isVip));
    setDraft(nextCfg);
    setFilterCat(presetId);
  };

  const handleRandomize = () => {
    const randomCfg = randomizeShelfDecorConfig(Boolean(isVip));
    setDraft(randomCfg);
    setFilterCat(randomCfg.theme === 'none' ? 'all' : randomCfg.theme);
  };

  const handleSelectBookend = (bookendId: ShelfBookendId) => {
    if (bookendId !== 'none' && !isVip && isShelfBookendVip(bookendId)) {
      onOpenVipModal?.();
      return;
    }
    setDraft((prev) => {
      const bookendMeta = SHELF_BOOKEND_CATALOG.find((b) => b.id === bookendId);
      const nextTheme: ShelfDecorTheme =
        bookendId !== 'none' && prev.theme === 'none' && bookendMeta
          ? bookendMeta.category
          : prev.theme;
      return {
        ...prev,
        theme: nextTheme,
        bookend: bookendId,
      };
    });
  };

  const handleToggleProp = (propId: ShelfDecorPropId) => {
    const isAlreadyEnabled = draft.enabledProps.includes(propId);
    if (!isAlreadyEnabled && !isVip && isShelfPropVip(propId)) {
      onOpenVipModal?.();
      return;
    }

    setDraft((prev) => {
      const exists = prev.enabledProps.includes(propId);
      const nextProps = exists
        ? prev.enabledProps.filter((id) => id !== propId)
        : [...prev.enabledProps, propId];

      const itemMeta = SHELF_DECOR_CATALOG.find((c) => c.id === propId);
      const nextTheme: ShelfDecorTheme =
        nextProps.length === 0 && (prev.bookend ?? 'none') === 'none'
          ? 'none'
          : prev.theme === 'none' && itemMeta
          ? itemMeta.category
          : prev.theme;

      return {
        ...prev,
        theme: nextTheme,
        enabledProps: nextProps,
      };
    });
  };

  const handleClearAll = () => {
    setDraft({
      theme: 'none',
      enabledProps: [],
      bookend: 'none',
      ledGlow: false,
      hangingVines: false,
    });
  };

  const handleApply = () => {
    onSaveConfig(draft);
    onClose();
  };

  const filteredCatalog =
    filterCat === 'all'
      ? SHELF_DECOR_CATALOG
      : SHELF_DECOR_CATALOG.filter((item) => item.category === filterCat);

  const previewProps = draft.enabledProps.slice(0, 3);
  const activeBookend = draft.bookend && draft.bookend !== 'none' ? draft.bookend : null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl sm:rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] animate-popIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-3.5 sm:p-5 border-b border-[var(--border-color)] flex items-center justify-between gap-2 bg-black/40">
          <div className="min-w-0">
            <h3 className="dark-reborn-font font-bold text-base sm:text-lg text-[var(--accent-pink)]">
              Decoraciones y Sujetalibros
            </h3>
            <p className="text-[11px] sm:text-xs text-[var(--text-muted)]">
              Combina sujetalibros laterales, book nooks y figuras Kawaii, Fantasía o Dark sobre tus repisas
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition shrink-0"
            aria-label="Cerrar decoraciones"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-3.5 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6 flex-1 text-xs">
          {/* Live Shelf Preview */}
          <div>
            <div className="flex flex-wrap items-center justify-between mb-2 gap-2">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[var(--accent-pink)]" />
                <span>Vista previa de repisa</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[var(--text-muted)] tabular-nums truncate">
                  {draft.enabledProps.length} piezas
                  {activeBookend ? ' · Sujetalibros activos' : ''}
                </span>
                <button
                  type="button"
                  onClick={handleRandomize}
                  className="min-h-[34px] px-3 py-1 rounded-xl bg-gradient-to-r from-[var(--accent-pink)]/20 to-[var(--accent-purple)]/25 border border-[var(--accent-pink)]/60 hover:bg-[var(--accent-pink)] hover:text-black text-[var(--accent-pink)] font-bold text-[11px] flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                  title="Elegir aleatoriamente estilo, decoraciones y sujetalibros"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Aleatorio</span>
                </button>
              </div>
            </div>

            <div
              className="relative h-36 sm:h-40 rounded-2xl border border-[var(--border-color)] overflow-hidden flex flex-col justify-end shadow-inner"
              style={{
                background:
                  draft.theme === 'kawaii'
                    ? 'linear-gradient(180deg, #2a1f2d 0%, #1d1522 100%)'
                    : draft.theme === 'fantasy'
                    ? 'linear-gradient(180deg, #131129 0%, #0b091a 100%)'
                    : draft.theme === 'dark'
                    ? 'linear-gradient(180deg, #160a11 0%, #090508 100%)'
                    : '#0d0b12',
              }}
            >
              {/* Fantasy starry overlay inside preview */}
              {draft.theme === 'fantasy' && draft.hangingVines && (
                <div
                  className="absolute inset-0 opacity-35 pointer-events-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Cpath d='M30 24 A9 9 0 1 0 40 36 A7 7 0 1 1 30 24 Z' fill='%23fde68a'/%3E%3Ccircle cx='85' cy='32' r='1.5' fill='%23fde68a'/%3E%3Ccircle cx='65' cy='72' r='1.5' fill='%23fef3c7'/%3E%3Ccircle cx='20' cy='88' r='1.5' fill='%23fde68a'/%3E%3C/svg%3E")`,
                    backgroundSize: '120px 120px',
                  }}
                />
              )}

              {/* Warm under-shelf LED wash */}
              {draft.ledGlow && draft.theme !== 'none' && (
                <div
                  className="absolute top-0 inset-x-0 h-16 pointer-events-none"
                  style={{
                    background:
                      draft.theme === 'dark'
                        ? 'linear-gradient(180deg, rgba(244,63,94,0.28) 0%, transparent 100%)'
                        : 'linear-gradient(180deg, rgba(253,224,71,0.28) 0%, transparent 100%)',
                  }}
                />
              )}

              {/* Items + Bookends resting flush on shelf */}
              <div className="relative z-10 flex items-end justify-center gap-2 sm:gap-3.5 px-3 pb-0 mb-[-3px]">
                {activeBookend && (
                  <div className="w-10 h-16 sm:w-12 sm:h-20 shrink-0 flex items-end justify-center">
                    <ShelfBookendArt id={activeBookend} side="left" />
                  </div>
                )}

                <div className="w-8 h-16 sm:w-10 sm:h-20 rounded-r-md bg-gradient-to-t from-purple-950 to-purple-700 border border-white/15 shadow-lg shrink-0" />
                <div className="w-8 h-20 sm:w-10 sm:h-24 rounded-r-md bg-gradient-to-t from-rose-950 to-pink-700 border border-white/15 shadow-lg shrink-0" />

                {previewProps[0] && (
                  <div className="w-11 h-16 sm:w-13 sm:h-20 shrink-0 flex items-end justify-center">
                    <ShelfDecorArt id={previewProps[0]} />
                  </div>
                )}

                <div className="hidden sm:block w-10 h-18 rounded-r-md bg-gradient-to-t from-amber-950 to-amber-700 border border-white/15 shadow-lg shrink-0" />

                {previewProps[1] && (
                  <div className="hidden min-[400px]:flex w-11 h-16 sm:w-13 sm:h-20 shrink-0 items-end justify-center">
                    <ShelfDecorArt id={previewProps[1]} />
                  </div>
                )}

                {activeBookend && (
                  <div className="w-10 h-16 sm:w-12 sm:h-20 shrink-0 flex items-end justify-center">
                    <ShelfBookendArt id={activeBookend} side="right" />
                  </div>
                )}
              </div>

              {/* Plank ledge */}
              <div
                className="relative z-20 h-3 w-full border-t"
                style={{
                  background:
                    draft.theme === 'kawaii'
                      ? 'linear-gradient(180deg, #9a6b4c 0%, #5c3a21 100%)'
                      : draft.theme === 'dark'
                      ? 'linear-gradient(180deg, #27272a 0%, #09090b 100%)'
                      : 'linear-gradient(180deg, #4b253a 0%, #240c1a 100%)',
                  borderColor:
                    draft.ledGlow && draft.theme !== 'none'
                      ? draft.theme === 'dark'
                        ? 'rgba(244,63,94,0.55)'
                        : 'rgba(253,230,138,0.65)'
                      : 'rgba(255,255,255,0.2)',
                }}
              />
            </div>
          </div>

          {/* 1. Theme Presets (Kawaii, Fantasia, Dark) */}
          <div>
            <h4 className="font-bold text-white text-xs sm:text-sm mb-2.5">
              Estilos completos (1 toque)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {SHELF_DECOR_PRESETS.map((preset) => {
                const isSelected = draft.theme === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`min-h-[88px] p-3.5 rounded-2xl border text-left transition flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'border-[var(--accent-pink)] bg-white/10 shadow-lg'
                        : 'border-[var(--border-color)] bg-black/40 hover:border-white/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-bold text-white text-sm block leading-tight">
                          {preset.name}
                        </span>
                        <span className="text-[11px] text-[var(--text-muted)] block mt-0.5">
                          {preset.subtitle}
                        </span>
                      </div>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-[var(--accent-pink)] text-black flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 pt-1">
                      {preset.props.slice(0, 4).map((propId) => (
                        <div key={propId} className="w-7 h-7">
                          <ShelfDecorArt id={propId} />
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Bookends (Sujetalibros Izq. + Der.) */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                <BookMarked className="w-4 h-4 text-[var(--accent-pink)]" />
                <span>Sujetalibros (Izq. + Der.)</span>
              </h4>
              <span className="text-[11px] text-[var(--text-muted)]">
                Flanquean tus libros en cada repisa
              </span>
            </div>

            <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-3 gap-2.5">
              {SHELF_BOOKEND_CATALOG.map((bk) => {
                const isSelected = draft.bookend === bk.id;
                const isLocked = Boolean(bk.vipOnly && !isVip);
                const catLabel =
                  bk.category === 'kawaii'
                    ? 'Kawaii'
                    : bk.category === 'fantasy'
                    ? 'Fantasía'
                    : 'Dark';

                return (
                  <button
                    key={bk.id}
                    type="button"
                    onClick={() => handleSelectBookend(bk.id)}
                    className={`min-h-[88px] p-3 rounded-2xl border text-left transition flex flex-col justify-between gap-2 relative ${
                      isSelected
                        ? 'border-[var(--accent-pink)] bg-white/10 shadow-md'
                        : isLocked
                        ? 'border-amber-400/35 bg-black/45 hover:border-amber-400/75'
                        : 'border-[var(--border-color)] bg-black/35 hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1 h-11">
                        <div className="w-7 h-10 shrink-0">
                          <ShelfBookendArt id={bk.id} side="left" />
                        </div>
                        <div className="w-2.5 h-8 rounded-sm bg-purple-700/80 border border-white/15 shrink-0" />
                        <div className="w-7 h-10 shrink-0">
                          <ShelfBookendArt id={bk.id} side="right" />
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {bk.vipOnly && (
                          <span
                            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold border ${
                              isLocked
                                ? 'bg-amber-400/15 text-amber-300 border-amber-400/50'
                                : 'bg-amber-400 text-black border-amber-300'
                            }`}
                          >
                            {isLocked ? <Lock className="w-2.5 h-2.5" /> : <Crown className="w-2.5 h-2.5 fill-black" />}
                            <span>VIP</span>
                          </span>
                        )}
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-[var(--accent-pink)] text-black flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-white text-xs block truncate">
                        {bk.name}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] block truncate">
                        {catLabel} · {bk.subtitle}
                      </span>
                    </div>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => handleSelectBookend('none')}
                className={`min-h-[86px] p-3 rounded-2xl border text-left transition flex flex-col justify-between gap-2 ${
                  !activeBookend
                    ? 'border-[var(--accent-pink)] bg-white/10 shadow-md'
                    : 'border-[var(--border-color)] bg-black/35 hover:border-white/25'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-xs font-bold text-white">Sin sujetalibros</span>
                  {!activeBookend && (
                    <span className="w-5 h-5 rounded-full bg-[var(--accent-pink)] text-black flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-[var(--text-muted)] leading-snug">
                  Deja toda la anchura libre para portadas o lomos
                </span>
              </button>
            </div>
          </div>

          {/* 3. Atmosphere Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setDraft((prev) => ({ ...prev, ledGlow: !prev.ledGlow }))}
              className={`min-h-[52px] px-3.5 py-2.5 rounded-2xl border flex items-center justify-between gap-3 text-left transition ${
                draft.ledGlow
                  ? 'border-amber-400/60 bg-amber-400/10 text-white'
                  : 'border-[var(--border-color)] bg-black/35 text-[var(--text-muted)]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sun className="w-4 h-4 text-amber-300 shrink-0" />
                <div>
                  <span className="font-bold text-xs block text-white">Luz LED bajo repisas</span>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    Iluminación cálida o carmesí bajo cada estante
                  </span>
                </div>
              </div>
              <span
                className={`text-[11px] font-bold ${
                  draft.ledGlow ? 'text-amber-300' : 'text-[var(--text-muted)]'
                }`}
              >
                {draft.ledGlow ? 'Activa' : 'Apagada'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDraft((prev) => ({ ...prev, hangingVines: !prev.hangingVines }))}
              className={`min-h-[52px] px-3.5 py-2.5 rounded-2xl border flex items-center justify-between gap-3 text-left transition ${
                draft.hangingVines
                  ? 'border-emerald-400/60 bg-emerald-400/10 text-white'
                  : 'border-[var(--border-color)] bg-black/35 text-[var(--text-muted)]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Trees className="w-4 h-4 text-emerald-300 shrink-0" />
                <div>
                  <span className="font-bold text-xs block text-white">Enredaderas y fondo temático</span>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    Hojas colgantes, lunas estrelladas o trama gótica
                  </span>
                </div>
              </div>
              <span
                className={`text-[11px] font-bold ${
                  draft.hangingVines ? 'text-emerald-300' : 'text-[var(--text-muted)]'
                }`}
              >
                {draft.hangingVines ? 'Activa' : 'Apagada'}
              </span>
            </button>
          </div>

          {/* 4. Individual Piece Picker */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h4 className="font-bold text-white text-xs sm:text-sm">
                Personalizar piezas ({draft.enabledProps.length}/{SHELF_DECOR_CATALOG.length})
              </h4>

              <div className="flex items-center gap-1 bg-black/40 border border-[var(--border-color)] rounded-xl p-1 overflow-x-auto max-w-full scrollbar-none">
                {(
                  [
                    { id: 'all', label: 'Todos' },
                    { id: 'kawaii', label: 'Kawaii' },
                    { id: 'fantasy', label: 'Fantasía' },
                    { id: 'dark', label: 'Dark' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilterCat(tab.id)}
                    className={`min-h-[34px] px-3 py-1.5 rounded-lg text-[11px] font-bold transition whitespace-nowrap shrink-0 ${
                      filterCat === tab.id
                        ? 'bg-[var(--accent-pink)] text-black shadow-sm'
                        : 'text-[var(--text-muted)] hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 min-[380px]:grid-cols-2 sm:grid-cols-3 gap-2.5">
              {filteredCatalog.map((item) => {
                const isSelected = draft.enabledProps.includes(item.id);
                const isLocked = Boolean(item.vipOnly && !isVip);
                const catLabel =
                  item.category === 'kawaii'
                    ? 'Kawaii'
                    : item.category === 'fantasy'
                    ? 'Fantasía'
                    : 'Dark';

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleToggleProp(item.id)}
                    className={`min-h-[84px] p-3 rounded-2xl border flex items-center gap-2.5 text-left transition ${
                      isSelected
                        ? 'border-[var(--accent-pink)] bg-white/10 shadow-md'
                        : isLocked
                        ? 'border-amber-400/35 bg-black/45 hover:border-amber-400/75'
                        : 'border-[var(--border-color)] bg-black/35 hover:border-white/25'
                    }`}
                  >
                    <div className="w-12 h-14 shrink-0 flex items-end justify-center">
                      <ShelfDecorArt id={item.id} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white text-xs block truncate">
                          {item.name}
                        </span>
                        {item.vipOnly && (
                          <span
                            className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-extrabold shrink-0 border ${
                              isLocked
                                ? 'bg-amber-400/15 text-amber-300 border-amber-400/50'
                                : 'bg-amber-400 text-black border-amber-300'
                            }`}
                          >
                            {isLocked ? <Lock className="w-2.5 h-2.5" /> : <Crown className="w-2.5 h-2.5 fill-black" />}
                            <span>VIP</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] block truncate mt-0.5">
                        {catLabel} · {item.subtitle}
                      </span>
                    </div>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-[var(--accent-pink)] text-black flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-5 border-t border-[var(--border-color)] bg-black/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={handleClearAll}
            className="min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-medium text-[var(--text-muted)] hover:text-white hover:bg-white/5 transition flex items-center justify-center sm:justify-start gap-1.5"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Quitar Decoración</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-medium text-[var(--text-muted)] hover:text-white bg-black/40 border border-[var(--border-color)] transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="min-h-[44px] flex-[1.5] sm:flex-none px-5 py-2 rounded-xl text-xs font-cute font-bold bg-[var(--accent-pink)] text-black shadow-lg hover:opacity-90 active:scale-95 transition flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Aplicar a Mi Estantería</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
