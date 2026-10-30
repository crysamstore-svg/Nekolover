import React, { useState } from 'react';
import { Sparkles, Heart } from 'lucide-react';

export type DecorationType = 
  | 'pink-dragon'
  | 'pink-baby-dragon'
  | 'gothic-vase'
  | 'rose-vase'
  | 'black-cat-sleeping'
  | 'black-cat-curious'
  | 'black-cat-playful';

interface ShelfDecorationProps {
  type: DecorationType;
  position?: 'inline' | 'bookend-left' | 'bookend-right';
}

export const ShelfDecoration: React.FC<ShelfDecorationProps> = ({ 
  type, 
  position = 'inline' 
}) => {
  const [bounce, setBounce] = useState(false);
  const [reactionMsg, setReactionMsg] = useState<string | null>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBounce(true);
    setTimeout(() => setBounce(false), 900);

    let msg = '';
    switch (type) {
      case 'pink-dragon':
      case 'pink-baby-dragon':
        msg = '🌸🐉 Dragón Rosa: ¡Custodio de tus historias sagradas!';
        break;
      case 'gothic-vase':
      case 'rose-vase':
        msg = '🏺🌹 Jarrón Gótico: Rosas oscuras y pétalos de cerezo.';
        break;
      case 'black-cat-sleeping':
        msg = '🐈‍⬛💤 Neko Durmiente: Zzz... ronronea junto a los libros 🐾';
        break;
      case 'black-cat-curious':
        msg = '🐈‍⬛✨ Neko Curioso: ¡Miau! Mirando tu próximo tomo 🖤';
        break;
      case 'black-cat-playful':
        msg = '🐈‍⬛🐾 Neko Juguetón: ¡Atrapando marcapáginas mágicos!';
        break;
    }

    setReactionMsg(msg);
    setTimeout(() => setReactionMsg(null), 2400);
  };

  // 1. DRAGONES ROSAS
  if (type === 'pink-dragon' || type === 'pink-baby-dragon') {
    return (
      <div 
        onClick={handleClick}
        className={`group cursor-pointer select-none relative flex flex-col items-center justify-end transition-all duration-300 ${
          position === 'inline' 
            ? 'w-full max-w-[170px] aspect-[2/3] p-2' 
            : 'absolute bottom-3 z-20'
        } ${position === 'bookend-left' ? '-left-2 sm:left-1' : position === 'bookend-right' ? '-right-2 sm:right-1' : ''}`}
        title="Dragón Rosa Guardián (Toca para interactuar)"
      >
        {/* Floating Speech / Reaction Bubble */}
        {reactionMsg && (
          <div className="absolute -top-12 z-40 bg-black/90 border border-pink-400 text-pink-200 text-[10px] px-2.5 py-1 rounded-xl shadow-2xl modal-animate whitespace-nowrap font-cute font-bold flex items-center gap-1">
            <span>✨</span>
            <span>{reactionMsg}</span>
          </div>
        )}

        <div className={`relative flex flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-t from-pink-950/40 via-purple-950/20 to-transparent border border-pink-500/20 group-hover:border-pink-500/60 shadow-xl transition-all duration-300 ${
          bounce ? 'animate-bounce scale-110' : 'group-hover:scale-105'
        }`}>
          {/* Dragon Magical Aura Glow */}
          <div className="absolute inset-0 bg-pink-500/10 rounded-2xl filter blur-md group-hover:bg-pink-500/20 transition-all pointer-events-none" />

          {/* Dragon Graphic */}
          <div className="relative text-center">
            <div className="text-4xl sm:text-5xl filter drop-shadow-[0_4px_12px_rgba(255,121,198,0.6)] transform group-hover:rotate-6 transition-transform">
              🐉
            </div>
            {/* Sparkle & Cherry Blossoms */}
            <div className="absolute -top-2 -right-2 text-sm animate-pulse">
              🌸
            </div>
            <div className="absolute -bottom-1 -left-1 text-xs">
              ✨
            </div>
          </div>

          <div className="mt-2 text-center">
            <span className="text-[11px] font-cute font-bold text-pink-300 block leading-tight">
              Dragón Rosa
            </span>
            <span className="text-[9px] text-pink-200/60 font-mono">
              Guardián Mágico
            </span>
          </div>

          {/* Pedestal Stand Shadow */}
          <div className="w-16 h-2 bg-pink-500/20 rounded-full filter blur-[2px] mt-1" />
        </div>
      </div>
    );
  }

  // 2. JARRONES GÓTICOS / FLORALES
  if (type === 'gothic-vase' || type === 'rose-vase') {
    return (
      <div 
        onClick={handleClick}
        className={`group cursor-pointer select-none relative flex flex-col items-center justify-end transition-all duration-300 ${
          position === 'inline' 
            ? 'w-full max-w-[170px] aspect-[2/3] p-2' 
            : 'absolute bottom-3 z-20'
        } ${position === 'bookend-left' ? '-left-2 sm:left-1' : position === 'bookend-right' ? '-right-2 sm:right-1' : ''}`}
        title="Jarrón Gótico con Rosas (Toca para interactuar)"
      >
        {reactionMsg && (
          <div className="absolute -top-12 z-40 bg-black/90 border border-purple-400 text-purple-200 text-[10px] px-2.5 py-1 rounded-xl shadow-2xl modal-animate whitespace-nowrap font-cute font-bold flex items-center gap-1">
            <span>🌹</span>
            <span>{reactionMsg}</span>
          </div>
        )}

        <div className={`relative flex flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-t from-purple-950/40 via-black/40 to-transparent border border-purple-500/20 group-hover:border-purple-400/60 shadow-xl transition-all duration-300 ${
          bounce ? 'animate-bounce scale-110' : 'group-hover:scale-105'
        }`}>
          {/* Soft Candlelight Glow */}
          <div className="absolute inset-0 bg-purple-500/10 rounded-2xl filter blur-md group-hover:bg-purple-500/20 transition-all pointer-events-none" />

          {/* Vase Graphic with Dark Roses */}
          <div className="relative text-center">
            <div className="text-4xl sm:text-5xl filter drop-shadow-[0_4px_10px_rgba(189,147,249,0.5)] transform group-hover:-rotate-3 transition-transform">
              🏺
            </div>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-sm filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              🥀
            </div>
            <div className="absolute top-2 -right-2 text-xs">
              🌺
            </div>
          </div>

          <div className="mt-2 text-center">
            <span className="text-[11px] font-cute font-bold text-purple-300 block leading-tight">
              Jarrón de Rosas
            </span>
            <span className="text-[9px] text-purple-200/60 font-mono">
              Porcelana Gótica
            </span>
          </div>

          {/* Marble Stand Shadow */}
          <div className="w-16 h-2 bg-purple-500/20 rounded-full filter blur-[2px] mt-1" />
        </div>
      </div>
    );
  }

  // 3. GATOS NEGROS (Sleeping, Curious, Playful)
  return (
    <div 
      onClick={handleClick}
      className={`group cursor-pointer select-none relative flex flex-col items-center justify-end transition-all duration-300 ${
        position === 'inline' 
          ? 'w-full max-w-[170px] aspect-[2/3] p-2' 
          : 'absolute bottom-3 z-20'
      } ${position === 'bookend-left' ? '-left-2 sm:left-1' : position === 'bookend-right' ? '-right-2 sm:right-1' : ''}`}
      title="Gato Negro Neko (Toca para acariciar)"
    >
      {reactionMsg && (
        <div className="absolute -top-12 z-40 bg-black/90 border border-pink-400 text-pink-200 text-[10px] px-2.5 py-1 rounded-xl shadow-2xl modal-animate whitespace-nowrap font-cute font-bold flex items-center gap-1">
          <span>🐾</span>
          <span>{reactionMsg}</span>
        </div>
      )}

      <div className={`relative flex flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-t from-black/80 via-purple-950/20 to-transparent border border-white/10 group-hover:border-pink-500/50 shadow-xl transition-all duration-300 ${
        bounce ? 'animate-bounce scale-110' : 'group-hover:scale-105'
      }`}>
        {/* Cat Eyes Glow Backdrop */}
        <div className="absolute inset-0 bg-yellow-400/5 rounded-2xl filter blur-md group-hover:bg-pink-500/15 transition-all pointer-events-none" />

        {/* Cat Graphic */}
        <div className="relative text-center">
          <div className="text-4xl sm:text-5xl filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] transform group-hover:scale-110 transition-transform">
            🐈‍⬛
          </div>
          {type === 'black-cat-sleeping' ? (
            <div className="absolute -top-2 right-0 text-[11px] font-bold text-pink-300 animate-pulse font-mono">
              zzz...
            </div>
          ) : type === 'black-cat-curious' ? (
            <div className="absolute -top-2 right-0 text-xs">
              ✨
            </div>
          ) : (
            <div className="absolute -top-1 -right-1 text-xs">
              🐾
            </div>
          )}
        </div>

        <div className="mt-2 text-center">
          <span className="text-[11px] font-cute font-bold text-[var(--accent-pink)] block leading-tight">
            {type === 'black-cat-sleeping' ? 'Neko Durmiente' : type === 'black-cat-curious' ? 'Neko Curioso' : 'Neko Kuro'}
          </span>
          <span className="text-[9px] text-[var(--text-muted)] font-mono">
            {type === 'black-cat-sleeping' ? 'Ronroneando 🐾' : 'Compañero Fiel'}
          </span>
        </div>

        {/* Shadow */}
        <div className="w-16 h-2 bg-black/60 rounded-full filter blur-[2px] mt-1" />
      </div>
    </div>
  );
};
