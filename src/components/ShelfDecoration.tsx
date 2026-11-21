import React, { useState, useRef, useEffect } from 'react';
import {
  ShelfBookendId,
  ShelfDecorConfig,
  ShelfDecorPropId,
  ShelfDecorTheme,
} from '../types';
import {
  SHELF_BOOKEND_CATALOG,
  SHELF_DECOR_CATALOG,
} from '../data/shelfDecorCatalog';

export type LegacyDecorationType =
  | 'pink-dragon'
  | 'pink-baby-dragon'
  | 'gothic-vase'
  | 'rose-vase'
  | 'black-cat-sleeping'
  | 'black-cat-curious'
  | 'black-cat-playful';

export type DecorationType = ShelfDecorPropId | LegacyDecorationType;

function resolvePropId(type: DecorationType): ShelfDecorPropId {
  switch (type) {
    case 'pink-dragon':
    case 'pink-baby-dragon':
      return 'kawaii-bunny-bear';
    case 'gothic-vase':
    case 'rose-vase':
      return 'dark-crimson-roses';
    case 'black-cat-sleeping':
    case 'black-cat-curious':
    case 'black-cat-playful':
      return 'fantasy-black-cat';
    default:
      return type;
  }
}

export const ShelfDecorArt: React.FC<{ id: ShelfDecorPropId; className?: string }> = ({
  id,
  className = 'w-full h-full',
}) => {
  switch (id) {
    // 1. KAWAII: Lámpara Nube luminosa (descansando en la base)
    case 'kawaii-cloud-lamp':
      return (
        <svg viewBox="4 20 112 67" preserveAspectRatio="xMidYMax meet" className={className} aria-hidden="true">
          <defs>
            <radialGradient id="nlCloudGlow" cx="50%" cy="62%" r="48%">
              <stop offset="0%" stopColor="#fde68a" stopOpacity="0.6" />
              <stop offset="65%" stopColor="#fef08a" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="nlCloudBody" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fffdf5" />
              <stop offset="65%" stopColor="#fef3c7" />
              <stop offset="100%" stopColor="#fde68a" />
            </linearGradient>
          </defs>
          <ellipse cx="60" cy="60" rx="52" ry="34" fill="url(#nlCloudGlow)" />
          <ellipse cx="60" cy="84.5" rx="38" ry="2.5" fill="rgba(0,0,0,0.58)" />
          <path
            d="M28 84 H92 C102 84 108 77 108 68 C108 60 102 54 94 53 C93 40 82 31 69 32 C62 23 47 24 41 34 C31 35 24 43 24 53 C17 55 12 61 12 69 C12 78 19 84 28 84 Z"
            fill="url(#nlCloudBody)"
            stroke="#fbbf24"
            strokeWidth="1.5"
            strokeOpacity="0.6"
          />
          <circle cx="48" cy="61" r="2.7" fill="#451a03" />
          <circle cx="72" cy="61" r="2.7" fill="#451a03" />
          <ellipse cx="42" cy="66" rx="4" ry="2.2" fill="#f9a8d4" opacity="0.85" />
          <ellipse cx="78" cy="66" rx="4" ry="2.2" fill="#f9a8d4" opacity="0.85" />
          <path d="M55 64 Q60 69 65 64" fill="none" stroke="#451a03" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="24" cy="30" r="2" fill="#fde68a" />
          <circle cx="98" cy="27" r="1.6" fill="#fbcfe8" />
        </svg>
      );

    // 2. KAWAII: Jarrón de tulipanes rosas con lazo vichy
    case 'kawaii-tulips-vase':
      return (
        <svg viewBox="14 6 92 114" preserveAspectRatio="xMidYMax meet" className={className} aria-hidden="true">
          <defs>
            <linearGradient id="nlVaseCream" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fff7ed" />
              <stop offset="100%" stopColor="#f5d0c5" />
            </linearGradient>
            <linearGradient id="nlTulipPink" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fbcfe8" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
          <ellipse cx="60" cy="117.5" rx="22" ry="2.5" fill="rgba(0,0,0,0.58)" />
          {/* Stems & leaves */}
          <path d="M56 72 Q46 52 40 36" fill="none" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" />
          <path d="M60 72 Q60 46 60 28" fill="none" stroke="#22c55e" strokeWidth="3.2" strokeLinecap="round" />
          <path d="M64 72 Q75 50 82 38" fill="none" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" />
          <path d="M54 68 Q34 56 32 45 Q46 52 56 64 Z" fill="#16a34a" />
          <path d="M66 68 Q86 58 90 46 Q74 52 64 64 Z" fill="#22c55e" />
          {/* Tulips */}
          <g transform="translate(38,24) rotate(-14)">
            <path d="M-9 6 C-11 -6 -4 -12 0 -10 C4 -12 11 -6 9 6 C7 12 -7 12 -9 6 Z" fill="url(#nlTulipPink)" />
            <path d="M-3 -8 Q0 -1 3 -8" fill="#fdf2f8" opacity="0.65" />
          </g>
          <g transform="translate(60,18)">
            <path d="M-10 7 C-12 -7 -4 -14 0 -11 C4 -14 12 -7 10 7 C8 14 -8 14 -10 7 Z" fill="url(#nlTulipPink)" />
            <path d="M-4 -9 Q0 -2 4 -9" fill="#fdf2f8" opacity="0.7" />
          </g>
          <g transform="translate(82,27) rotate(16)">
            <path d="M-8 5 C-10 -6 -3 -11 0 -9 C3 -11 10 -6 8 5 C6 11 -6 11 -8 5 Z" fill="url(#nlTulipPink)" />
          </g>
          {/* Ceramic vase */}
          <path
            d="M46 65 H74 L70 76 C81 84 83 108 75 117 H45 C37 108 39 84 50 76 Z"
            fill="url(#nlVaseCream)"
            stroke="#f9a8d4"
            strokeWidth="1.2"
          />
          {/* Ribbon bow */}
          <rect x="48" y="72" width="24" height="4.5" rx="2" fill="#f43f5e" />
          <path d="M60 74 L48 67 L49 78 Z" fill="#fb7185" />
          <path d="M60 74 L72 67 L71 78 Z" fill="#fb7185" />
          <path d="M58 76 L51 89 M62 76 L69 89" stroke="#fb7185" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="60" cy="74" r="2.8" fill="#f43f5e" />
        </svg>
      );

    // 3. KAWAII: Mini Radio Retro Rosa
    case 'kawaii-retro-radio':
      return (
        <svg viewBox="14 24 92 76" preserveAspectRatio="xMidYMax meet" className={className} aria-hidden="true">
          <defs>
            <linearGradient id="nlRadioPink" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fbcfe8" />
              <stop offset="100%" stopColor="#f472b6" />
            </linearGradient>
          </defs>
          <ellipse cx="60" cy="97.5" rx="38" ry="2.5" fill="rgba(0,0,0,0.58)" />
          {/* Handle */}
          <path d="M36 42 C36 27 84 27 84 42" fill="none" stroke="#fce7f3" strokeWidth="4" strokeLinecap="round" />
          {/* Feet */}
          <rect x="30" y="90" width="8" height="7" rx="3" fill="#be185d" />
          <rect x="82" y="90" width="8" height="7" rx="3" fill="#be185d" />
          {/* Main body */}
          <rect x="20" y="42" width="80" height="50" rx="14" fill="url(#nlRadioPink)" stroke="#fdf2f8" strokeWidth="2" />
          {/* Gold speaker grill */}
          <rect x="28" y="50" width="38" height="34" rx="8" fill="#4c0519" stroke="#fcd34d" strokeWidth="1.8" />
          <line x1="33" y1="57" x2="61" y2="57" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
          <line x1="33" y1="63" x2="61" y2="63" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
          <line x1="33" y1="69" x2="61" y2="69" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
          <line x1="33" y1="75" x2="61" y2="75" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
          {/* Dial & buttons */}
          <circle cx="82" cy="61" r="10" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" />
          <line x1="82" y1="61" x2="87" y2="56" stroke="#be185d" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="75" cy="79" r="3.2" fill="#fde68a" />
          <circle cx="84" cy="79" r="3.2" fill="#fde68a" />
          <circle cx="92" cy="79" r="2.2" fill="#ffffff" />
        </svg>
      );

    // 4. KAWAII: Conejita & Osito pastel de cerámica
    case 'kawaii-bunny-bear':
      return (
        <svg viewBox="12 18 96 89" preserveAspectRatio="xMidYMax meet" className={className} aria-hidden="true">
          <ellipse cx="60" cy="104.5" rx="42" ry="2.5" fill="rgba(0,0,0,0.58)" />
          {/* Left pastel bunny (aligned flush to shared baseline y=104) */}
          <g transform="translate(36,84)">
            <ellipse cx="-6" cy="-34" rx="5.5" ry="15" fill="#fff1f2" stroke="#f9a8d4" strokeWidth="1.2" />
            <ellipse cx="6" cy="-34" rx="5.5" ry="15" fill="#fff1f2" stroke="#f9a8d4" strokeWidth="1.2" />
            <ellipse cx="-6" cy="-34" rx="2.5" ry="9" fill="#fbcfe8" />
            <ellipse cx="6" cy="-34" rx="2.5" ry="9" fill="#fbcfe8" />
            <ellipse cx="0" cy="-12" rx="15" ry="14" fill="#fff1f2" stroke="#f9a8d4" strokeWidth="1.2" />
            <path d="M-12 2 C-14 26 14 26 12 2 Z" fill="#c084fc" />
            <circle cx="-5.5" cy="-13" r="2" fill="#1e1b4b" />
            <circle cx="5.5" cy="-13" r="2" fill="#1e1b4b" />
            <path d="M-2 -8 L2 -6 M2 -8 L-2 -6" stroke="#1e1b4b" strokeWidth="1.5" strokeLinecap="round" />
            <ellipse cx="-9" cy="-8" rx="2.8" ry="1.6" fill="#f9a8d4" />
            <ellipse cx="9" cy="-8" rx="2.8" ry="1.6" fill="#f9a8d4" />
          </g>
          {/* Right creamy bear holding pink heart */}
          <g transform="translate(82,74)">
            <circle cx="-11" cy="-22" r="6" fill="#fef3c7" stroke="#fcd34d" strokeWidth="1" />
            <circle cx="11" cy="-22" r="6" fill="#fef3c7" stroke="#fcd34d" strokeWidth="1" />
            <ellipse cx="0" cy="-10" rx="15" ry="13" fill="#fffbeb" stroke="#fde68a" strokeWidth="1.2" />
            <ellipse cx="0" cy="14" rx="14" ry="16" fill="#fef3c7" stroke="#fde68a" strokeWidth="1.2" />
            <circle cx="-5" cy="-11" r="1.8" fill="#451a03" />
            <circle cx="5" cy="-11" r="1.8" fill="#451a03" />
            <ellipse cx="0" cy="-7" rx="4" ry="3" fill="#ffffff" />
            <circle cx="0" cy="-8" r="1.4" fill="#451a03" />
            <path
              d="M0 18 C-6 13 -9 8 -4 5 C-1 3 0 6 0 6 C0 6 1 3 4 5 C9 8 6 13 0 18 Z"
              fill="#f472b6"
            />
          </g>
        </svg>
      );

    // 5. KAWAII: Cuadro Pastel con marco madera/lila
    case 'kawaii-quote-frame':
      return (
        <svg viewBox="14 12 82 107" preserveAspectRatio="xMidYMax meet" className={className} aria-hidden="true">
          <ellipse cx="55" cy="116.5" rx="34" ry="2.5" fill="rgba(0,0,0,0.58)" />
          <rect x="18" y="14" width="74" height="102" rx="6" fill="#f9a8d4" stroke="#fdf2f8" strokeWidth="1.5" />
          <rect x="26" y="22" width="58" height="86" rx="3" fill="#fff1f2" />
          <rect x="30" y="26" width="50" height="78" rx="2" fill="#f5d0fe" opacity="0.45" />
          <text x="55" y="46" textAnchor="middle" fill="#831843" fontSize="9.5" fontWeight="700" fontFamily="Quicksand, sans-serif">
            little by
          </text>
          <text x="55" y="59" textAnchor="middle" fill="#9d174d" fontSize="9.5" fontWeight="700" fontFamily="Quicksand, sans-serif">
            little,
          </text>
          <text x="55" y="72" textAnchor="middle" fill="#831843" fontSize="9.5" fontWeight="700" fontFamily="Quicksand, sans-serif">
            day by
          </text>
          <text x="55" y="85" textAnchor="middle" fill="#be185d" fontSize="9.5" fontWeight="700" fontFamily="Quicksand, sans-serif">
            day
          </text>
          <path d="M55 98 C51 94 49 91 52 89 C54 88 55 90 55 90 C55 90 56 88 58 89 C61 91 59 94 55 98 Z" fill="#ec4899" />
        </svg>
      );

    // 6. KAWAII: Lámpara Luna sobre soporte de madera
    case 'kawaii-moon-lamp':
      return (
        <svg viewBox="12 8 96 102" preserveAspectRatio="xMidYMax meet" className={className} aria-hidden="true">
          <defs>
            <radialGradient id="nlMoonAura" cx="50%" cy="46%" r="48%">
              <stop offset="0%" stopColor="#fef08a" stopOpacity="0.65" />
              <stop offset="65%" stopColor="#fde047" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#fde047" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="nlMoonSurface" cx="38%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#fffbeb" />
              <stop offset="55%" stopColor="#fde68a" />
              <stop offset="100%" stopColor="#f59e0b" />
            </radialGradient>
          </defs>
          <circle cx="60" cy="54" r="45" fill="url(#nlMoonAura)" />
          <ellipse cx="60" cy="107.5" rx="28" ry="2.5" fill="rgba(0,0,0,0.58)" />
          {/* Wooden tripod stand */}
          <line x1="42" y1="78" x2="36" y2="106" stroke="#d97706" strokeWidth="5.5" strokeLinecap="round" />
          <line x1="78" y1="78" x2="84" y2="106" stroke="#b45309" strokeWidth="5.5" strokeLinecap="round" />
          <line x1="40" y1="90" x2="80" y2="90" stroke="#92400e" strokeWidth="4" strokeLinecap="round" />
          {/* Moon sphere */}
          <circle cx="60" cy="54" r="30" fill="url(#nlMoonSurface)" stroke="#fef9c3" strokeWidth="1.2" />
          <circle cx="49" cy="43" r="5" fill="#f59e0b" opacity="0.22" />
          <circle cx="71" cy="58" r="7" fill="#d97706" opacity="0.18" />
          <circle cx="55" cy="67" r="3.5" fill="#d97706" opacity="0.22" />
          <circle cx="68" cy="39" r="3" fill="#ffffff" opacity="0.5" />
        </svg>
      );

    // 7. FANTASÍA: Gatito Luminoso de escritorio
    case 'fantasy-cat-lamp':
      return (
        <svg viewBox="12 18 96 89" preserveAspectRatio="xMidYMax meet" className={className} aria-hidden="true">
          <defs>
            <radialGradient id="nlCatLampAura" cx="50%" cy="58%" r="46%">
              <stop offset="0%" stopColor="#fef08a" stopOpacity="0.65" />
              <stop offset="70%" stopColor="#fde68a" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="nlCatLampBody" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="75%" stopColor="#fef3c7" />
              <stop offset="100%" stopColor="#fde68a" />
            </linearGradient>
          </defs>
          <circle cx="60" cy="64" r="44" fill="url(#nlCatLampAura)" />
          <ellipse cx="60" cy="104.5" rx="30" ry="2.5" fill="rgba(0,0,0,0.58)" />
          {/* Cat ears */}
          <path d="M35 48 L33 23 L52 38 Z" fill="url(#nlCatLampBody)" stroke="#fde68a" strokeWidth="1.4" />
          <path d="M85 48 L87 23 L68 38 Z" fill="url(#nlCatLampBody)" stroke="#fde68a" strokeWidth="1.4" />
          {/* Rounded kitty body */}
          <path
            d="M27 80 C27 48 39 36 60 36 C81 36 93 48 93 80 C93 98 81 104 60 104 C39 104 27 98 27 80 Z"
            fill="url(#nlCatLampBody)"
            stroke="#fbbf24"
            strokeWidth="1.4"
            strokeOpacity="0.5"
          />
          <circle cx="47" cy="64" r="2.8" fill="#1f2937" />
          <circle cx="73" cy="64" r="2.8" fill="#1f2937" />
          <ellipse cx="40" cy="70" rx="4.2" ry="2.2" fill="#fda4af" opacity="0.8" />
          <ellipse cx="80" cy="70" rx="4.2" ry="2.2" fill="#fda4af" opacity="0.8" />
          <path d="M55 68 Q57.5 72 60 69 Q62.5 72 65 68" fill="none" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" />
          <line x1="29" y1="64" x2="38" y2="66" stroke="#78350f" strokeWidth="1.4" opacity="0.55" />
          <line x1="29" y1="70" x2="38" y2="70" stroke="#78350f" strokeWidth="1.4" opacity="0.55" />
          <line x1="91" y1="64" x2="82" y2="66" stroke="#78350f" strokeWidth="1.4" opacity="0.55" />
          <line x1="91" y1="70" x2="82" y2="70" stroke="#78350f" strokeWidth="1.4" opacity="0.55" />
        </svg>
      );

    // 8. FANTASÍA: Farol Negro con vela cálida encantada
    case 'fantasy-lantern':
      return (
        <svg viewBox="14 6 82 115" preserveAspectRatio="xMidYMax meet" className={className} aria-hidden="true">
          <defs>
            <radialGradient id="nlLanternGlow" cx="50%" cy="58%" r="42%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx="55" cy="119" rx="30" ry="2.5" fill="rgba(0,0,0,0.62)" />
          <circle cx="55" cy="76" r="40" fill="url(#nlLanternGlow)" />
          {/* Ring handle */}
          <circle cx="55" cy="16" r="7" fill="none" stroke="#52525b" strokeWidth="3" />
          {/* Roof dome */}
          <path d="M27 42 L55 22 L83 42 Z" fill="#18181b" stroke="#52525b" strokeWidth="1.5" />
          <rect x="24" y="42" width="62" height="6" rx="2" fill="#27272a" stroke="#52525b" strokeWidth="1" />
          {/* Glass cage */}
          <rect x="30" y="48" width="50" height="62" fill="rgba(254, 243, 199, 0.1)" stroke="#3f3f46" strokeWidth="2.5" />
          <line x1="46" y1="48" x2="46" y2="110" stroke="#27272a" strokeWidth="2" />
          <line x1="64" y1="48" x2="64" y2="110" stroke="#27272a" strokeWidth="2" />
          {/* Candle inside */}
          <rect x="48" y="84" width="14" height="24" rx="2" fill="#fef3c7" />
          <path d="M55 64 C59 71 61 77 55 83 C49 77 51 71 55 64 Z" fill="#fb923c" />
          <path d="M55 69 C57 73 58 77 55 81 C52 77 53 73 55 69 Z" fill="#fef08a" />
          {/* Base */}
          <rect x="24" y="110" width="62" height="9" rx="3" fill="#18181b" stroke="#52525b" strokeWidth="1.2" />
        </svg>
      );

    // 9. FANTASÍA: Casita de madera iluminada
    case 'fantasy-cottage':
      return (
        <svg viewBox="12 10 96 103" preserveAspectRatio="xMidYMax meet" className={className} aria-hidden="true">
          <defs>
            <radialGradient id="nlCottageWarm" cx="50%" cy="68%" r="40%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="60" cy="74" r="42" fill="url(#nlCottageWarm)" />
          <ellipse cx="60" cy="110.5" rx="34" ry="2.5" fill="rgba(0,0,0,0.6)" />
          {/* Chimney */}
          <rect x="74" y="27" width="11" height="24" rx="2" fill="#78350f" />
          <circle cx="79" cy="20" r="3" fill="#e2e8f0" opacity="0.45" />
          <circle cx="84" cy="14" r="4" fill="#e2e8f0" opacity="0.3" />
          {/* Cottage body */}
          <path d="M28 56 H92 V110 H28 Z" fill="#92400e" stroke="#451a03" strokeWidth="1.5" />
          {/* Roof */}
          <path d="M18 60 L60 22 L102 60 Z" fill="#451a03" stroke="#d97706" strokeWidth="1.5" />
          {/* Glowing window + arched door */}
          <rect x="37" y="68" width="17" height="19" rx="3" fill="#fde047" stroke="#451a03" strokeWidth="2" />
          <line x1="45.5" y1="68" x2="45.5" y2="87" stroke="#78350f" strokeWidth="1.8" />
          <line x1="37" y1="77.5" x2="54" y2="77.5" stroke="#78350f" strokeWidth="1.8" />
          <path d="M65 110 V80 C65 73 79 73 79 80 V110 Z" fill="#fef08a" stroke="#451a03" strokeWidth="2" />
          <circle cx="75" cy="96" r="1.5" fill="#78350f" />
          <circle cx="24" cy="30" r="2" fill="#fde68a" />
          <circle cx="98" cy="34" r="1.8" fill="#fde68a" />
        </svg>
      );

    // 10. FANTASÍA: Cuadro Celestial ("Better Things Ahead")
    case 'fantasy-ghost-frame':
      return (
        <svg viewBox="14 12 82 107" preserveAspectRatio="xMidYMax meet" className={className} aria-hidden="true">
          <ellipse cx="55" cy="116.5" rx="34" ry="2.5" fill="rgba(0,0,0,0.58)" />
          <rect x="17" y="14" width="76" height="102" rx="6" fill="#27272a" stroke="#a78bfa" strokeWidth="1.5" strokeOpacity="0.55" />
          <rect x="25" y="22" width="60" height="86" rx="3" fill="#0f0b1a" />
          <path d="M40 31 A7 7 0 1 0 49 41 A5.5 5.5 0 1 1 40 31 Z" fill="#fde68a" />
          <circle cx="72" cy="34" r="1.6" fill="#fde68a" />
          <circle cx="34" cy="52" r="1.4" fill="#c4b5fd" />
          <path
            d="M44 63 C44 50 66 50 66 63 V79 L61 75 L55 80 L49 75 L44 79 Z"
            fill="#f5f3ff"
          />
          <circle cx="51" cy="61" r="1.6" fill="#1e1b4b" />
          <circle cx="59" cy="61" r="1.6" fill="#1e1b4b" />
          <text x="55" y="92" textAnchor="middle" fill="#fde68a" fontSize="8" fontWeight="700" fontFamily="Quicksand, sans-serif">
            Better Things
          </text>
          <text x="55" y="102" textAnchor="middle" fill="#ddd6fe" fontSize="8" fontWeight="700" fontFamily="Quicksand, sans-serif">
            Ahead
          </text>
        </svg>
      );

    // 11. FANTASÍA: Gato Negro sentado + mini calabaza cálida
    case 'fantasy-black-cat':
      return (
        <svg viewBox="16 18 92 93" preserveAspectRatio="xMidYMax meet" className={className} aria-hidden="true">
          <ellipse cx="60" cy="108.5" rx="38" ry="2.5" fill="rgba(0,0,0,0.62)" />
          {/* Tail curling right */}
          <path d="M62 105 C82 105 88 91 80 81" fill="none" stroke="#18181b" strokeWidth="6" strokeLinecap="round" />
          {/* Body */}
          <path d="M32 108 C30 82 37 64 50 64 C63 64 70 82 68 108 Z" fill="#09090b" stroke="#3f3f46" strokeWidth="1.2" />
          {/* Head & ears */}
          <path d="M35 45 L33 23 L48 36 Z" fill="#09090b" stroke="#3f3f46" strokeWidth="1" />
          <path d="M65 45 L67 23 L52 36 Z" fill="#09090b" stroke="#3f3f46" strokeWidth="1" />
          <circle cx="50" cy="49" r="17" fill="#09090b" stroke="#3f3f46" strokeWidth="1.2" />
          {/* Golden eyes */}
          <circle cx="43.5" cy="48" r="3.8" fill="#fbbf24" />
          <circle cx="56.5" cy="48" r="3.8" fill="#fbbf24" />
          <circle cx="43.5" cy="48" r="1.8" fill="#09090b" />
          <circle cx="56.5" cy="48" r="1.8" fill="#09090b" />
          <circle cx="44.8" cy="46.6" r="0.9" fill="#ffffff" />
          <circle cx="57.8" cy="46.6" r="0.9" fill="#ffffff" />
          {/* Gold collar & bell */}
          <path d="M39 64 Q50 68 61 64" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="50" cy="69" r="3.2" fill="#fde047" />
          {/* Mini glowing autumn pumpkin */}
          <g transform="translate(86,98)">
            <path d="M-2 -12 Q0 -17 3 -15" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" />
            <ellipse cx="0" cy="0" rx="14" ry="11" fill="#ea580c" stroke="#fdba74" strokeWidth="1" />
            <ellipse cx="0" cy="0" rx="7" ry="11" fill="#f97316" />
            <polygon points="-6,-3 -2,-3 -4,0" fill="#fef08a" />
            <polygon points="2,-3 6,-3 4,0" fill="#fef08a" />
            <path d="M-5 4 Q0 7 5 4" fill="none" stroke="#fef08a" strokeWidth="1.6" strokeLinecap="round" />
          </g>
        </svg>
      );

    // 12. FANTASÍA: Orbe lunar y pócima estrellada
    case 'fantasy-moon-potion':
      return (
        <svg viewBox="14 16 82 94" preserveAspectRatio="xMidYMax meet" className={className} aria-hidden="true">
          <defs>
            <radialGradient id="nlPotionGlow" cx="50%" cy="62%" r="44%">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="nlPotionFluid" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#5b21b6" />
            </linearGradient>
          </defs>
          <circle cx="55" cy="70" r="40" fill="url(#nlPotionGlow)" />
          <ellipse cx="55" cy="107.5" rx="28" ry="2.5" fill="rgba(0,0,0,0.6)" />
          <rect x="46" y="21" width="18" height="12" rx="3" fill="#b45309" />
          <rect x="42" y="32" width="26" height="8" rx="3" fill="#ddd6fe" opacity="0.85" />
          <path
            d="M46 40 V50 C28 58 23 82 32 98 C37 107 73 107 78 98 C87 82 82 58 64 50 V40 Z"
            fill="rgba(221, 214, 254, 0.18)"
            stroke="#c4b5fd"
            strokeWidth="2"
          />
          <path
            d="M32 76 C28 89 35 103 55 103 C75 103 82 89 78 76 Q66 72 55 76 Q44 80 32 76 Z"
            fill="url(#nlPotionFluid)"
          />
          <path d="M51 64 A8 8 0 1 0 60 74 A6 6 0 1 1 51 64 Z" fill="#fde68a" />
          <circle cx="65" cy="87" r="2.2" fill="#fde68a" />
          <circle cx="43" cy="90" r="1.8" fill="#fbcfe8" />
        </svg>
      );

    // 13. DARK: Máscara teatral nocturna con filigrana
    case 'dark-masquerade-mask':
      return (
        <svg viewBox="16 16 78 100" preserveAspectRatio="xMidYMax meet" className={className} aria-hidden="true">
          <defs>
            <linearGradient id="nlMaskSlate" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="60%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>
          </defs>
          <ellipse cx="55" cy="113" rx="26" ry="2.5" fill="rgba(0,0,0,0.68)" />
          <rect x="52" y="84" width="6" height="25" fill="#27272a" />
          <ellipse cx="55" cy="109" rx="22" ry="5" fill="#18181b" stroke="#fb7185" strokeWidth="1" strokeOpacity="0.5" />
          <path
            d="M55 20 C35 20 24 36 24 56 C24 80 41 96 55 96 C69 96 86 80 86 56 C86 36 75 20 55 20 Z"
            fill="url(#nlMaskSlate)"
            stroke="#0f172a"
            strokeWidth="2"
          />
          <path
            d="M55 20 C69 20 86 36 86 56 C86 80 69 96 55 96 C61 81 62 40 55 20 Z"
            fill="#09090b"
            opacity="0.88"
          />
          <path d="M33 52 Q41 44 48 53 Q41 59 33 52 Z" fill="#09090b" />
          <path d="M62 53 Q69 44 77 52 Q69 59 62 53 Z" fill="#e11d48" />
          <path d="M34 36 Q45 29 55 38 Q65 29 76 36" fill="none" stroke="#be123c" strokeWidth="1.8" />
          <path d="M47 76 Q55 81 63 76" fill="none" stroke="#be123c" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );

    // 14. DARK: Rosas negras y carmesí en florero obsidiana
    case 'dark-crimson-roses':
      return (
        <svg viewBox="14 8 92 112" preserveAspectRatio="xMidYMax meet" className={className} aria-hidden="true">
          <defs>
            <linearGradient id="nlObsidianVase" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3f3f46" />
              <stop offset="50%" stopColor="#18181b" />
              <stop offset="100%" stopColor="#09090b" />
            </linearGradient>
          </defs>
          <ellipse cx="60" cy="117.5" rx="22" ry="2.5" fill="rgba(0,0,0,0.68)" />
          <path d="M56 70 L41 38 M60 70 L60 28 M64 70 L80 41" stroke="#3f6212" strokeWidth="3" strokeLinecap="round" />
          <g transform="translate(40,34)">
            <circle cx="0" cy="0" r="11" fill="#881337" />
            <path d="M-6 -2 C-5 -8 6 -8 5 -1 C5 4 -4 5 -6 -2 Z" fill="#e11d48" />
            <circle cx="0" cy="-1" r="3" fill="#4c0519" />
          </g>
          <g transform="translate(60,24)">
            <circle cx="0" cy="0" r="13" fill="#4c0519" stroke="#be123c" strokeWidth="1.2" />
            <path d="M-7 -2 C-6 -9 7 -9 6 -1 C6 5 -5 6 -7 -2 Z" fill="#be123c" />
            <circle cx="0" cy="-1" r="3.5" fill="#fb7185" opacity="0.65" />
          </g>
          <g transform="translate(81,38)">
            <circle cx="0" cy="0" r="10.5" fill="#881337" />
            <path d="M-5 -2 C-4 -7 5 -7 4 -1 C4 4 -3 5 -5 -2 Z" fill="#f43f5e" />
          </g>
          <path
            d="M46 66 H74 L70 77 C81 86 82 108 74 117 H46 C38 108 39 86 50 77 Z"
            fill="url(#nlObsidianVase)"
            stroke="#fb7185"
            strokeWidth="1.2"
            strokeOpacity="0.45"
          />
          <line x1="51" y1="84" x2="54" y2="108" stroke="#ffffff" strokeWidth="1.2" opacity="0.2" strokeLinecap="round" />
        </svg>
      );

    // 15. DARK: Cráneo de obsidiana, mini ataúd y cristal
    case 'dark-skull-coffin':
      return (
        <svg viewBox="16 28 94 80" preserveAspectRatio="xMidYMax meet" className={className} aria-hidden="true">
          <ellipse cx="62" cy="105.5" rx="40" ry="2.5" fill="rgba(0,0,0,0.68)" />
          <g transform="translate(76,68)">
            <polygon points="-10,-32 10,-32 16,-14 10,36 -10,36 -16,-14" fill="#18181b" stroke="#71717a" strokeWidth="1.6" />
            <polygon points="-7,-26 7,-26 11,-13 7,30 -7,30 -11,-13" fill="#09090b" />
            <line x1="0" y1="-15" x2="0" y2="9" stroke="#e11d48" strokeWidth="2.4" strokeLinecap="round" />
            <line x1="-6" y1="-7" x2="6" y2="-7" stroke="#e11d48" strokeWidth="2.4" strokeLinecap="round" />
          </g>
          <g transform="translate(43,78)">
            <path
              d="M-19 -4 C-19 -22 19 -22 19 -4 C19 6 13 11 11 15 V25 H-11 V15 C-13 11 -19 6 -19 -4 Z"
              fill="#e2e8f0"
              stroke="#475569"
              strokeWidth="1.5"
            />
            <circle cx="-7" cy="-2" r="5" fill="#09090b" />
            <circle cx="7" cy="-2" r="5" fill="#09090b" />
            <polygon points="0,4 -2.5,10 2.5,10" fill="#09090b" />
            <line x1="-6" y1="18" x2="-6" y2="25" stroke="#334155" strokeWidth="1.4" />
            <line x1="0" y1="18" x2="0" y2="25" stroke="#334155" strokeWidth="1.4" />
            <line x1="6" y1="18" x2="6" y2="25" stroke="#334155" strokeWidth="1.4" />
          </g>
          <polygon points="94,105 99,79 105,86 104,105" fill="#be123c" stroke="#fda4af" strokeWidth="0.9" />
        </svg>
      );

    // 16. DARK: Media Luna tallada metálica sobre pedestal
    case 'dark-crescent-moon':
      return (
        <svg viewBox="16 16 78 96" preserveAspectRatio="xMidYMax meet" className={className} aria-hidden="true">
          <defs>
            <linearGradient id="nlDarkMoonMetal" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e2e8f0" />
              <stop offset="50%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
          </defs>
          <ellipse cx="55" cy="110" rx="24" ry="2.5" fill="rgba(0,0,0,0.68)" />
          <rect x="40" y="102" width="30" height="8" rx="2" fill="#18181b" stroke="#52525b" strokeWidth="1.2" />
          <rect x="52" y="88" width="6" height="14" fill="#3f3f46" />
          <path
            d="M66 20 C41 21 24 41 27 65 C30 85 48 96 68 92 C48 88 41 68 45 50 C48 35 56 26 66 20 Z"
            fill="url(#nlDarkMoonMetal)"
            stroke="#f8fafc"
            strokeWidth="1"
            strokeOpacity="0.4"
          />
          <line x1="64" y1="26" x2="64" y2="48" stroke="#cbd5e1" strokeWidth="1.2" />
          <polygon points="64,46 69,55 64,64 59,55" fill="#e11d48" stroke="#fda4af" strokeWidth="0.8" />
        </svg>
      );

    // 17. DARK: Cuadro Gótico Midnight Club
    case 'dark-noir-frame':
      return (
        <svg viewBox="14 12 82 107" preserveAspectRatio="xMidYMax meet" className={className} aria-hidden="true">
          <ellipse cx="55" cy="116.5" rx="34" ry="2.5" fill="rgba(0,0,0,0.68)" />
          <rect x="17" y="14" width="76" height="102" rx="4" fill="#18181b" stroke="#52525b" strokeWidth="2" />
          <rect x="24" y="21" width="62" height="88" fill="#09090b" stroke="#fb7185" strokeWidth="0.8" strokeOpacity="0.5" />
          <path d="M35 88 V52 C35 35 75 35 75 52 V88 Z" fill="none" stroke="#e2e8f0" strokeWidth="1.2" strokeOpacity="0.65" />
          <text x="55" y="45" textAnchor="middle" fill="#fda4af" fontSize="8" fontWeight="700" fontFamily="Cinzel Decorative, serif">
            MIDNIGHT
          </text>
          <text x="55" y="57" textAnchor="middle" fill="#e2e8f0" fontSize="7.5" fontWeight="700" fontFamily="Quicksand, sans-serif">
            DARK ROMANCE
          </text>
          <path d="M55 63 L57 69 L63 71 L57 73 L55 79 L53 73 L47 71 L53 69 Z" fill="#e11d48" />
          <text x="55" y="99" textAnchor="middle" fill="#94a3b8" fontSize="6.5" fontFamily="monospace">
            CHAPTER XIII
          </text>
        </svg>
      );

    // 18. DARK: Velas Negras con cera carmesí
    case 'dark-candles':
      return (
        <svg viewBox="14 16 86 99" preserveAspectRatio="xMidYMax meet" className={className} aria-hidden="true">
          <defs>
            <radialGradient id="nlDarkCandleGlow" cx="50%" cy="32%" r="40%">
              <stop offset="0%" stopColor="#fb7185" stopOpacity="0.55" />
              <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="57" cy="40" r="38" fill="url(#nlDarkCandleGlow)" />
          <ellipse cx="57" cy="112.5" rx="34" ry="2.5" fill="rgba(0,0,0,0.68)" />
          <ellipse cx="57" cy="107" rx="31" ry="6" fill="#27272a" stroke="#71717a" strokeWidth="1.2" />
          <rect x="49" y="42" width="16" height="63" rx="2" fill="#18181b" stroke="#3f3f46" strokeWidth="1" />
          <path d="M51 42 V54 C53 57 55 53 56 59 C58 51 62 55 64 46 V42 Z" fill="#be123c" />
          <path d="M57 22 C61 29 62 34 57 39 C52 34 53 29 57 22 Z" fill="#fb923c" />
          <path d="M57 27 C59 31 59 34 57 37 C55 34 55 31 57 27 Z" fill="#fef08a" />
          <rect x="30" y="64" width="14" height="41" rx="2" fill="#09090b" stroke="#3f3f46" strokeWidth="1" />
          <path d="M32 64 V72 C35 76 37 69 40 74 V64 Z" fill="#9f1239" />
          <path d="M37 47 C40 53 41 57 37 61 C33 57 34 53 37 47 Z" fill="#fb923c" />
          <rect x="70" y="72" width="14" height="33" rx="2" fill="#09090b" stroke="#3f3f46" strokeWidth="1" />
          <path d="M77 56 C80 62 81 65 77 69 C73 65 74 62 77 56 Z" fill="#fb923c" />
        </svg>
      );

    // 19. KAWAII: Nicho Café Soleado (Book nook casita café con gatito)
    case 'kawaii-sunshine-cafe':
      return (
        <svg viewBox="10 4 80 120" preserveAspectRatio="xMidYMax meet" className={className} aria-hidden="true">
          <defs>
            <linearGradient id="nlCafeWall" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fef9c3" />
              <stop offset="65%" stopColor="#fde68a" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
            <linearGradient id="nlCafeFrame" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f5f5f4" />
              <stop offset="50%" stopColor="#e7e5e4" />
              <stop offset="100%" stopColor="#d6d3d1" />
            </linearGradient>
          </defs>
          <ellipse cx="50" cy="121.5" rx="34" ry="2.5" fill="rgba(0,0,0,0.58)" />
          {/* Gable roof & wooden frame */}
          <path d="M16 20 L50 6 L84 20 V120 H16 Z" fill="url(#nlCafeFrame)" stroke="#a8a29e" strokeWidth="1.4" />
          <path d="M22 23 L50 11 L78 23 V115 H22 Z" fill="url(#nlCafeWall)" />
          {/* Roof skylight panels */}
          <path d="M24 22 L50 11 L76 22" fill="none" stroke="#b45309" strokeWidth="2" />
          {/* Upper shuttered window & striped awning */}
          <rect x="33" y="25" width="22" height="17" rx="1.5" fill="#92400e" stroke="#451a03" strokeWidth="1" />
          <rect x="27" y="25" width="6" height="17" fill="#b45309" />
          <rect x="55" y="25" width="6" height="17" fill="#b45309" />
          <path d="M24 44 H76 L72 52 H28 Z" fill="#fef3c7" stroke="#d97706" strokeWidth="1" />
          {/* COFFEE sign */}
          <rect x="27" y="53" width="46" height="11" rx="2" fill="#fffbeb" stroke="#d97706" strokeWidth="1.1" />
          <text x="50" y="61" textAnchor="middle" fill="#78350f" fontSize="6.5" fontWeight="800" fontFamily="Quicksand, sans-serif">
            COFFEE
          </text>
          {/* Warm lamp hanging over stairs */}
          <path d="M46 68 H56 V73" fill="none" stroke="#78350f" strokeWidth="1.5" />
          <path d="M51 73 L61 73 L59 77 H53 Z" fill="#fff" />
          <circle cx="56" cy="77" r="4" fill="#fef08a" opacity="0.6" />
          {/* Cafe door + arched stair railing */}
          <rect x="43" y="76" width="18" height="32" fill="#92400e" stroke="#451a03" strokeWidth="1" />
          <path d="M24 88 H38 V106 H24 Z" fill="#a8a29e" opacity="0.65" />
          <path d="M24 106 H62 L66 115 H24 Z" fill="#d6d3d1" />
          <path d="M44 92 L58 84 V108 H44 Z" fill="none" stroke="#1c1917" strokeWidth="1.4" />
          {/* Red mailbox & tiny yellow kitty resting inside */}
          <rect x="65" y="88" width="7" height="14" rx="2" fill="#dc2626" />
          <rect x="67.5" y="102" width="2" height="12" fill="#292524" />
          {/* Potted shrub + kitty */}
          <ellipse cx="34" cy="108" rx="6" ry="5" fill="#4ade80" />
          <rect x="30" y="109" width="8" height="6" rx="1" fill="#b45309" />
          <circle cx="57" cy="111" r="4" fill="#fbbf24" />
          <polygon points="54,108 55,104 57,107" fill="#fbbf24" />
          <polygon points="58,107 60,104 61,108" fill="#fbbf24" />
          {/* Tiny power button emblem on base */}
          <rect x="16" y="114" width="68" height="6" rx="1" fill="#f5f5f4" stroke="#a8a29e" strokeWidth="0.9" />
          <circle cx="50" cy="117" r="2" fill="none" stroke="#78716c" strokeWidth="0.8" />
        </svg>
      );

    // 20. FANTASÍA: Nicho Arco Estelar (Book nook montaña nevada y aldea iluminada)
    case 'fantasy-arch-nook':
      return (
        <svg viewBox="12 4 76 120" preserveAspectRatio="xMidYMax meet" className={className} aria-hidden="true">
          <defs>
            <linearGradient id="nlArchSky" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#082f49" />
              <stop offset="55%" stopColor="#1e3a8a" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <radialGradient id="nlArchBridgeGlow" cx="50%" cy="84%" r="34%">
              <stop offset="0%" stopColor="#fef08a" stopOpacity="0.95" />
              <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </radialGradient>
            <clipPath id="nlArchClip">
              <path d="M22 112 V48 C22 25 36 14 50 9 C64 14 78 25 78 48 V112 Z" />
            </clipPath>
          </defs>
          <ellipse cx="50" cy="121.5" rx="32" ry="2.5" fill="rgba(0,0,0,0.65)" />
          {/* Wooden plinth base */}
          <rect x="18" y="114" width="64" height="7" rx="1.5" fill="#27272a" stroke="#52525b" strokeWidth="1" />
          {/* Interior diorama clipped inside pointed gothic arch */}
          <g clipPath="url(#nlArchClip)">
            <rect x="20" y="8" width="60" height="106" fill="url(#nlArchSky)" />
            {/* Stars */}
            <circle cx="33" cy="30" r="1.5" fill="#fde68a" />
            <circle cx="67" cy="28" r="1.3" fill="#fef08a" />
            <circle cx="42" cy="20" r="1" fill="#e0f2fe" />
            <circle cx="61" cy="38" r="1.4" fill="#fde68a" />
            {/* Snow-capped mountain */}
            <polygon points="20,76 50,24 80,76" fill="#475569" />
            <polygon points="50,24 41,42 47,40 50,49 56,41 61,44" fill="#e2e8f0" />
            <polygon points="20,76 34,50 45,76" fill="#334155" />
            <polygon points="56,76 68,52 80,76" fill="#334155" />
            {/* Warm glowing village & bridge */}
            <circle cx="54" cy="96" r="24" fill="url(#nlArchBridgeGlow)" />
            <polygon points="24,90 36,74 48,90" fill="#1e293b" stroke="#f59e0b" strokeWidth="0.7" />
            <rect x="29" y="85" width="5" height="6" fill="#fde047" />
            <polygon points="48,92 61,72 74,92" fill="#1e293b" stroke="#f59e0b" strokeWidth="0.7" />
            <rect x="57" y="83" width="6" height="6" fill="#fde047" />
            <path d="M22 112 H78 V94 Q58 84 44 102 L22 102 Z" fill="#1c1917" />
            {/* Glowing bridge arch */}
            <path d="M46 112 C46 95 68 95 68 112 Z" fill="#fef08a" />
          </g>
          {/* Outer dark arched frame & mullion bars */}
          <path
            d="M19 114 V48 C19 23 35 11 50 6 C65 11 81 23 81 48 V114 Z"
            fill="none"
            stroke="#09090b"
            strokeWidth="5"
          />
          <path
            d="M20 114 V48 C20 24 35 12 50 7 C65 12 80 24 80 48 V114 Z"
            fill="none"
            stroke="#3f3f46"
            strokeWidth="1"
          />
          <line x1="21" y1="68" x2="26" y2="68" stroke="#09090b" strokeWidth="2.2" />
          <line x1="74" y1="68" x2="79" y2="68" stroke="#09090b" strokeWidth="2.2" />
        </svg>
      );

    // 21. FANTASÍA: Caballero Lector en armadura plateada
    case 'fantasy-reading-knight':
      return (
        <svg viewBox="14 8 72 116" preserveAspectRatio="xMidYMax meet" className={className} aria-hidden="true">
          <defs>
            <linearGradient id="nlKnightPlate" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f1f5f9" />
              <stop offset="45%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
          </defs>
          <ellipse cx="50" cy="121.5" rx="22" ry="2.5" fill="rgba(0,0,0,0.65)" />
          {/* Crossed greaves & boots */}
          <path d="M46 72 L38 96 L49 118" fill="none" stroke="#64748b" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M57 70 L53 96 L39 117" fill="none" stroke="url(#nlKnightPlate)" strokeWidth="8.5" strokeLinecap="round" strokeLinejoin="round" />
          <ellipse cx="38" cy="118.5" rx="7" ry="3.2" fill="#0f172a" />
          <ellipse cx="51" cy="118.5" rx="7" ry="3.2" fill="#1e293b" />
          {/* Armored torso & pauldrons */}
          <path d="M38 35 C38 29 63 29 66 42 L61 72 H42 Z" fill="url(#nlKnightPlate)" stroke="#1e293b" strokeWidth="1.2" />
          <ellipse cx="63" cy="40" rx="8.5" ry="7" fill="url(#nlKnightPlate)" stroke="#334155" strokeWidth="1.2" />
          <ellipse cx="40" cy="39" rx="7.5" ry="6.5" fill="#cbd5e1" stroke="#334155" strokeWidth="1.2" />
          {/* Helmet bowed down */}
          <path d="M42 18 C42 10 56 10 58 20 C59 27 52 33 47 32 C42 30 41 24 42 18 Z" fill="url(#nlKnightPlate)" stroke="#1e293b" strokeWidth="1.2" />
          <path d="M45 22 L53 26 M44 25 L51 28" stroke="#0f172a" strokeWidth="1.4" strokeLinecap="round" />
          {/* Left arm resting on hip + right arm holding open book */}
          <path d="M64 44 L69 57 L59 68" fill="none" stroke="#94a3b8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M38 42 L34 55 L42 52" fill="none" stroke="#cbd5e1" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* Open book */}
          <polygon points="27,42 38,48 38,54 27,48" fill="#f8fafc" stroke="#475569" strokeWidth="1" />
          <polygon points="38,48 48,43 48,49 38,54" fill="#e2e8f0" stroke="#475569" strokeWidth="1" />
        </svg>
      );

    // 22. FANTASÍA: Dragón Lector de obsidiana con libro abierto
    case 'fantasy-reading-dragon':
      return (
        <svg viewBox="6 12 102 104" preserveAspectRatio="xMidYMax meet" className={className} aria-hidden="true">
          <defs>
            <linearGradient id="nlDragonObsidian" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#52525b" />
              <stop offset="50%" stopColor="#27272a" />
              <stop offset="100%" stopColor="#09090b" />
            </linearGradient>
            <linearGradient id="nlDragonWing" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3f3f46" />
              <stop offset="100%" stopColor="#18181b" />
            </linearGradient>
          </defs>
          <ellipse cx="58" cy="113" rx="36" ry="2.6" fill="rgba(0,0,0,0.72)" />
          {/* Large scalloped bat wing with visible bone spars */}
          <path
            d="M49 62 L56 22 L87 18 C79 30 81 41 91 45 C78 47 74 56 79 64 C68 59 60 64 55 71 Z"
            fill="url(#nlDragonWing)"
            stroke="#94a3b8"
            strokeWidth="1.2"
          />
          <path d="M56 22 L66 61 M56 22 L81 47 M56 22 L87 18" stroke="#71717a" strokeWidth="1.4" strokeLinecap="round" />
          {/* Tail curling right cleanly on shelf baseline */}
          <path
            d="M73 88 C95 88 102 104 86 112 C78 114 74 109 82 104"
            fill="none"
            stroke="#18181b"
            strokeWidth="7.5"
            strokeLinecap="round"
          />
          <path
            d="M73 88 C95 88 102 104 86 112"
            fill="none"
            stroke="#71717a"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
          {/* Dragon torso & muscular haunch */}
          <path
            d="M43 96 C41 72 53 60 67 66 C80 70 84 88 76 111 H47 Z"
            fill="url(#nlDragonObsidian)"
            stroke="#71717a"
            strokeWidth="1.3"
          />
          <ellipse cx="69" cy="98" rx="11.5" ry="12.5" fill="#27272a" stroke="#71717a" strokeWidth="1.1" />
          {/* Dorsal spikes along neck and back */}
          <polygon points="48,46 53,43 50,51" fill="#94a3b8" />
          <polygon points="50,54 55,52 52,59" fill="#94a3b8" />
          <polygon points="75,69 81,66 78,74" fill="#94a3b8" />
          {/* Curved neck */}
          <path d="M49 71 C43 57 41 43 43 35" fill="none" stroke="#27272a" strokeWidth="12" strokeLinecap="round" />
          <path d="M44 69 C39 57 38 44 40 35" fill="none" stroke="#52525b" strokeWidth="2.5" strokeLinecap="round" />
          {/* Swept horns, ear fin & horned dragon head looking at book */}
          <path d="M41 28 L52 15 L48 31 Z" fill="#3f3f46" stroke="#94a3b8" strokeWidth="1.1" />
          <path d="M36 30 L44 19 L43 32 Z" fill="#27272a" stroke="#94a3b8" strokeWidth="1.1" />
          <path d="M46 34 L54 31 L48 39 Z" fill="#52525b" />
          <path
            d="M28 42 C29 33 40 28 48 33 C52 39 46 49 36 49 C31 49 28 46 28 42 Z"
            fill="url(#nlDragonObsidian)"
            stroke="#94a3b8"
            strokeWidth="1.2"
          />
          {/* Glowing amber eye */}
          <circle cx="38" cy="38" r="1.8" fill="#fbbf24" />
          {/* Front forearms holding golden open book */}
          <path d="M46 77 L34 94 L29 90" fill="none" stroke="#3f3f46" strokeWidth="5.5" strokeLinecap="round" />
          <path d="M51 79 L41 96 L36 92" fill="none" stroke="#27272a" strokeWidth="5" strokeLinecap="round" />
          {/* Open Golden Book with cream curved pages */}
          <polygon points="10,67 27,79 27,102 10,89" fill="#d97706" stroke="#fde68a" strokeWidth="1.2" />
          <polygon points="27,79 39,69 39,92 27,102" fill="#b45309" stroke="#fde68a" strokeWidth="1.2" />
          <polygon points="13,70 26,79 26,98 13,88" fill="#fef3c7" />
          <polygon points="28,79 37,71 37,90 28,98" fill="#fde68a" />
          <line x1="16" y1="76" x2="23" y2="81" stroke="#b45309" strokeWidth="1" />
          <line x1="16" y1="81" x2="23" y2="86" stroke="#b45309" strokeWidth="1" />
          <line x1="16" y1="86" x2="23" y2="91" stroke="#b45309" strokeWidth="1" />
          <line x1="30" y1="80" x2="35" y2="76" stroke="#92400e" strokeWidth="1" />
          <line x1="30" y1="85" x2="35" y2="81" stroke="#92400e" strokeWidth="1" />
          {/* Little gold claws gripping book edge */}
          <circle cx="29" cy="91" r="2" fill="#52525b" stroke="#94a3b8" strokeWidth="0.8" />
          <circle cx="13" cy="83" r="1.8" fill="#52525b" stroke="#94a3b8" strokeWidth="0.8" />
        </svg>
      );

    // 23. DARK: Portal de Calaveras con cuervo y silueta
    case 'dark-skull-portal':
      return (
        <svg viewBox="10 4 80 120" preserveAspectRatio="xMidYMax meet" className={className} aria-hidden="true">
          <defs>
            <linearGradient id="nlPortalLight" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#fde68a" />
              <stop offset="45%" stopColor="#f97316" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#312e81" />
            </linearGradient>
            <clipPath id="nlPortalArch">
              <path d="M31 108 V50 C31 32 69 32 69 50 V108 Z" />
            </clipPath>
          </defs>
          <ellipse cx="50" cy="121.5" rx="34" ry="2.5" fill="rgba(0,0,0,0.72)" />
          {/* Obsidian shelf base */}
          <rect x="14" y="114" width="72" height="7" rx="1.5" fill="#18181b" stroke="#3f3f46" strokeWidth="1" />
          {/* Inner misty portal scene */}
          <g clipPath="url(#nlPortalArch)">
            <rect x="30" y="30" width="40" height="80" fill="#1e1b4b" />
            <ellipse cx="50" cy="54" rx="14" ry="28" fill="url(#nlPortalLight)" />
            {/* Cloaked silhouette */}
            <path d="M44 96 L48 73 C48 69 52 69 52 73 L56 96 C52 98 48 98 44 96 Z" fill="#09090b" />
            <circle cx="50" cy="68" r="3" fill="#09090b" />
            {/* Perched raven */}
            <ellipse cx="61" cy="98" rx="4" ry="2.5" fill="#09090b" />
            <circle cx="58" cy="96" r="2" fill="#09090b" />
          </g>
          {/* Bone frame pillars */}
          <path d="M22 114 L25 32 H33 L32 114 Z" fill="#d6d3d1" stroke="#57534e" strokeWidth="1.3" />
          <path d="M68 114 L67 32 H75 L78 114 Z" fill="#d6d3d1" stroke="#57534e" strokeWidth="1.3" />
          <path d="M25 36 C25 14 75 14 75 36" fill="none" stroke="#d6d3d1" strokeWidth="7" />
          {/* Crown Skull */}
          <circle cx="50" cy="16" r="9.5" fill="#e7e5e4" stroke="#44403c" strokeWidth="1.3" />
          <rect x="45.5" y="21" width="9" height="5.5" rx="1.5" fill="#d6d3d1" />
          <circle cx="46.5" cy="16" r="2.2" fill="#09090b" />
          <circle cx="53.5" cy="16" r="2.2" fill="#09090b" />
          {/* Side mini skulls */}
          <circle cx="29" cy="24" r="5" fill="#d6d3d1" stroke="#44403c" strokeWidth="1" />
          <circle cx="71" cy="24" r="5" fill="#d6d3d1" stroke="#44403c" strokeWidth="1" />
          <circle cx="27" cy="107" r="4.5" fill="#d6d3d1" stroke="#44403c" strokeWidth="1" />
          <circle cx="73" cy="107" r="4.5" fill="#d6d3d1" stroke="#44403c" strokeWidth="1" />
        </svg>
      );

    // 24. DARK: Daga de acero entre rosas rojas esculpidas (mejorada)
    case 'dark-dagger-roses':
      return (
        <svg viewBox="14 2 72 120" preserveAspectRatio="xMidYMax meet" className={className} aria-hidden="true">
          <defs>
            <linearGradient id="nlBladeLeft" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#cbd5e1" />
              <stop offset="50%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>
            <linearGradient id="nlBladeEdge" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#64748b" />
              <stop offset="65%" stopColor="#f1f5f9" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>
            <radialGradient id="nlRoseBloom" cx="42%" cy="38%" r="60%">
              <stop offset="0%" stopColor="#fb7185" />
              <stop offset="40%" stopColor="#e11d48" />
              <stop offset="80%" stopColor="#9f1239" />
              <stop offset="100%" stopColor="#4c0519" />
            </radialGradient>
          </defs>
          <ellipse cx="50" cy="119.5" rx="31" ry="2.6" fill="rgba(0,0,0,0.75)" />
          {/* Steel choil / bolster below handle */}
          <path
            d="M44 42 H55 L54 50 C52 50 51 53 53 55 L44 55 Z"
            fill="#94a3b8"
            stroke="#334155"
            strokeWidth="1.1"
          />
          {/* Wavy double-edge steel hunter blade plunging into rose bed */}
          <path
            d="M44 54 C42 63 45 71 43 80 C42 87 44 92 45 99 H55 C56 91 55 83 57 74 C58 66 55 59 54 54 C51 54 51 50 54 49 H44 Z"
            fill="url(#nlBladeLeft)"
            stroke="#1e293b"
            strokeWidth="1.2"
          />
          <path
            d="M50 50 L50 98 L55 98 C56 90 55 83 57 74 C58 66 55 59 54 54 C51 54 51 50 54 49 Z"
            fill="url(#nlBladeEdge)"
            opacity="0.88"
          />
          {/* Blade fuller / center ridge */}
          <line x1="48" y1="53" x2="48" y2="96" stroke="#334155" strokeWidth="1" opacity="0.65" />
          {/* Ergonomic black riveted knife handle */}
          <path
            d="M45 43 L44 26 C44 19 42 14 43 10 C45 6 51 6 54 9 C56 12 52 17 53 24 L54 43 Z"
            fill="#18181b"
            stroke="#52525b"
            strokeWidth="1.2"
          />
          <path d="M46 11 C47 16 46 28 47 41" stroke="#3f3f46" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <circle cx="48.8" cy="14.5" r="1.7" fill="#e2e8f0" stroke="#334155" strokeWidth="0.5" />
          <circle cx="49" cy="24" r="1.7" fill="#e2e8f0" stroke="#334155" strokeWidth="0.5" />
          <circle cx="49.2" cy="33.5" r="1.7" fill="#e2e8f0" stroke="#334155" strokeWidth="0.5" />
          {/* Dark subtle rose leaves underneath */}
          <path d="M23 111 L32 103 L36 113 Z" fill="#3f6212" opacity="0.7" />
          <path d="M77 111 L68 103 L64 113 Z" fill="#3f6212" opacity="0.7" />
          {/* Back center sculpted rose enveloping blade */}
          <g transform="translate(50,94)">
            <circle cx="0" cy="0" r="11.5" fill="#7f1d1d" stroke="#4c0519" strokeWidth="1" />
            <path d="M-8 -3 C-8 -10 8 -10 8 -2 C8 5 -6 7 -8 -3 Z" fill="url(#nlRoseBloom)" />
            <path d="M-5 -2 C-3 -7 4 -7 4 -2 C4 2 -4 3 -5 -2 Z" fill="#9f1239" />
            <path d="M-2 -1 Q0 -3 2 -1 Q0 1 -2 -1" fill="#f43f5e" />
          </g>
          {/* Left sculpted crimson rose */}
          <g transform="translate(34,107)">
            <circle cx="0" cy="0" r="12.5" fill="#881337" stroke="#4c0519" strokeWidth="1" />
            <path d="M-10 3 C-12 -8 -3 -12 5 -10 C11 -7 12 4 6 9 C-2 12 -8 8 -10 3 Z" fill="url(#nlRoseBloom)" />
            <path d="M-6 -2 C-5 -8 6 -8 5 -1 C5 4 -4 5 -6 -2 Z" fill="#be123c" stroke="#fda4af" strokeWidth="0.4" strokeOpacity="0.45" />
            <path d="M-3 -1 C-2 -4 3 -4 2 0 C2 2 -2 2 -3 -1 Z" fill="#4c0519" />
            <path d="M-1 -1 Q1 -3 2 -1" stroke="#fb7185" strokeWidth="0.9" fill="none" />
          </g>
          {/* Right sculpted crimson rose */}
          <g transform="translate(65,107)">
            <circle cx="0" cy="0" r="12.5" fill="#881337" stroke="#4c0519" strokeWidth="1" />
            <path d="M-10 3 C-12 -8 -3 -12 5 -10 C11 -7 12 4 6 9 C-2 12 -8 8 -10 3 Z" fill="url(#nlRoseBloom)" />
            <path d="M-6 -2 C-5 -8 6 -8 5 -1 C5 4 -4 5 -6 -2 Z" fill="#be123c" stroke="#fda4af" strokeWidth="0.4" strokeOpacity="0.45" />
            <path d="M-3 -1 C-2 -4 3 -4 2 0 C2 2 -2 2 -3 -1 Z" fill="#4c0519" />
            <path d="M-1 -1 Q1 -3 2 -1" stroke="#fb7185" strokeWidth="0.9" fill="none" />
          </g>
          {/* Foreground center velvet petals */}
          <g transform="translate(50,111)">
            <circle cx="0" cy="0" r="10.5" fill="#9f1239" stroke="#4c0519" strokeWidth="0.9" />
            <path d="M-7 -2 C-6 -8 6 -8 6 -1 C6 4 -5 5 -7 -2 Z" fill="#e11d48" />
            <path d="M-3 -1 C-2 -4 3 -4 3 0 C2 2 -2 2 -3 -1 Z" fill="#881337" />
          </g>
        </svg>
      );

    // 25. DARK: Nicho Mansión y Rosa (Book nook figura encapuchada)
    case 'dark-manor-nook':
      return (
        <svg viewBox="14 6 72 118" preserveAspectRatio="xMidYMax meet" className={className} aria-hidden="true">
          <defs>
            <linearGradient id="nlHoodFigure" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#cbd5e1" />
              <stop offset="55%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
          </defs>
          <ellipse cx="50" cy="121.5" rx="30" ry="2.5" fill="rgba(0,0,0,0.75)" />
          {/* Deep shadowbox frame */}
          <rect x="18" y="8" width="64" height="113" rx="2" fill="#09090b" stroke="#3f3f46" strokeWidth="2" />
          <rect x="23" y="13" width="54" height="103" fill="#0f172a" />
          {/* Golden Victorian mansion backdrop */}
          <path d="M23 56 Q50 42 77 56 V84 H23 Z" fill="#eab308" opacity="0.22" />
          <path d="M26 88 V62 L35 52 L42 62 V50 L50 38 L58 50 V62 L65 52 L74 62 V88 Z" fill="#09090b" />
          <rect x="48" y="54" width="4" height="8" fill="#facc15" />
          <rect x="33" y="68" width="4" height="7" fill="#facc15" />
          <rect x="63" y="68" width="4" height="7" fill="#facc15" />
          <rect x="47" y="74" width="6" height="12" rx="3" fill="#fde047" />
          {/* Hooded shadowed figure */}
          <path d="M40 116 L45 72 C46 62 67 62 71 74 L74 102 L68 116 Z" fill="url(#nlHoodFigure)" />
          <path d="M49 54 C49 44 63 44 64 56 C64 62 59 68 55 68 C50 68 48 61 49 54 Z" fill="#94a3b8" />
          <ellipse cx="56" cy="58" rx="4.5" ry="6" fill="#09090b" />
          {/* Single red rose */}
          <line x1="43" y1="103" x2="36" y2="108" stroke="#15803d" strokeWidth="1.6" />
          <circle cx="35" cy="109" r="3.4" fill="#e11d48" />
        </svg>
      );
  }
};

interface ShelfDecorationProps {
  type: DecorationType;
  position?: 'inline' | 'bookend-left' | 'bookend-right';
  compact?: boolean;
}

export const ShelfDecoration: React.FC<ShelfDecorationProps> = ({
  type,
  position = 'inline',
  compact = false,
}) => {
  const [bounce, setBounce] = useState(false);
  const [reactionMsg, setReactionMsg] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const propId = resolvePropId(type);
  const meta = SHELF_DECOR_CATALOG.find((item) => item.id === propId) || SHELF_DECOR_CATALOG[0];

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBounce(true);
    setReactionMsg(meta.reaction);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setBounce(false);
      setReactionMsg(null);
    }, 2200);
  };

  return (
    <div
      className={`relative flex flex-col items-center justify-end self-end mb-[-3px] ${
        compact
          ? 'w-[54px] sm:w-[66px] h-[84px] sm:h-[104px] shrink-0'
          : position === 'inline'
          ? 'w-full max-w-[78px] sm:max-w-[96px] md:max-w-[106px] aspect-[2/3] mx-auto'
          : 'w-16 sm:w-20 h-24'
      }`}
    >
      {reactionMsg && (
        <span
          role="status"
          className="absolute -top-11 left-1/2 -translate-x-1/2 z-50 bg-black/95 border border-white/20 text-white text-[10px] leading-snug px-2.5 py-1.5 rounded-xl shadow-2xl pointer-events-none w-max max-w-[175px] text-center font-medium animate-popIn"
        >
          {reactionMsg}
        </span>
      )}

      <button
        type="button"
        onClick={handleClick}
        className={`group w-full h-full select-none flex items-end justify-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-pink)] rounded-lg transition-transform duration-150 ${
          bounce ? '-translate-y-1.5 scale-105' : 'hover:-translate-y-0.5'
        }`}
        title={`${meta.name} — ${meta.subtitle}`}
        aria-label={`${meta.name}: ${meta.subtitle}`}
      >
        <ShelfDecorArt
          id={propId}
          className="w-full h-full drop-shadow-[0_3px_5px_rgba(0,0,0,0.75)] transition-transform duration-150 group-hover:scale-105"
        />
      </button>
    </div>
  );
};

/* ==========================================================================
   Bookends (Sujetalibros Izquierdo & Derecho descansando sobre la repisa)
   ========================================================================== */
export const ShelfBookendArt: React.FC<{
  id: Exclude<ShelfBookendId, 'none'>;
  side: 'left' | 'right';
  className?: string;
}> = ({ id, side, className = 'w-full h-full' }) => {
  const isRight = side === 'right';

  switch (id) {
    // 1. SUJETALIBROS LECTORES EN SILUETA (Chica a la izq., Chico a la der.)
    case 'readers-silhouette':
      return (
        <svg viewBox="0 10 80 110" preserveAspectRatio="xMidYMax meet" className={className} aria-hidden="true">
          <ellipse cx="40" cy="117.5" rx="34" ry="2.2" fill="rgba(0,0,0,0.65)" />
          {/* Metal L-plate base & book spine wall */}
          {isRight ? (
            <>
              <rect x="2" y="42" width="4" height="75" rx="1" fill="#18181b" stroke="#3f3f46" strokeWidth="0.9" />
              <path d="M2 113 H75 L78 117 H2 Z" fill="#09090b" stroke="#3f3f46" strokeWidth="0.9" />
              {/* Seated Boy Silhouette facing books */}
              <g transform="translate(8, 0)">
                <circle cx="24" cy="52" r="9.5" fill="#09090b" />
                <path d="M19 44 Q28 40 34 45 L30 49 Z" fill="#09090b" />
                <path
                  d="M12 66 C12 61 24 60 28 67 L32 89 L49 79 L62 110 L51 114 L44 96 L28 114 L10 113 C7 98 10 78 12 66 Z"
                  fill="#09090b"
                  stroke="#27272a"
                  strokeWidth="0.8"
                />
                {/* Open book held outward */}
                <path d="M40 73 L56 64 L60 72 L45 81 Z" fill="#09090b" />
              </g>
            </>
          ) : (
            <>
              <rect x="74" y="42" width="4" height="75" rx="1" fill="#18181b" stroke="#3f3f46" strokeWidth="0.9" />
              <path d="M78 113 H5 L2 117 H78 Z" fill="#09090b" stroke="#3f3f46" strokeWidth="0.9" />
              {/* Seated Girl Silhouette with ponytail */}
              <circle cx="52" cy="53" r="9.5" fill="#09090b" />
              <path d="M58 46 Q68 42 70 57 Q64 56 61 52 Z" fill="#09090b" />
              <path
                d="M64 67 C64 61 52 61 48 68 L44 89 L29 79 L14 111 L26 114 L34 97 L50 114 L66 113 C69 98 67 78 64 67 Z"
                fill="#09090b"
                stroke="#27272a"
                strokeWidth="0.8"
              />
              {/* Open book */}
              <path d="M36 73 L20 64 L16 72 L31 81 Z" fill="#09090b" />
            </>
          )}
        </svg>
      );

    // 2. SUJETALIBROS ALAS DE HADA (Madera de nogal + vitral ámbar)
    case 'fairy-wings': {
      const wingGradId = `nlWingStained-${side}`;
      return (
        <svg viewBox="0 6 82 114" preserveAspectRatio="xMidYMax meet" className={className} aria-hidden="true">
          <defs>
            <linearGradient id={wingGradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fde68a" stopOpacity="0.9" />
              <stop offset="55%" stopColor="#fb923c" stopOpacity="0.82" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.72" />
            </linearGradient>
          </defs>
          <ellipse cx="41" cy="117.5" rx="36" ry="2.2" fill="rgba(0,0,0,0.62)" />
          <g transform={isRight ? 'translate(82,0) scale(-1,1)' : undefined}>
            {/* Walnut L-frame bracket */}
            <rect x="68" y="14" width="11" height="101" rx="2" fill="#5c3a21" stroke="#3b2313" strokeWidth="1.2" />
            <rect x="6" y="108" width="73" height="9" rx="2" fill="#452714" stroke="#29170b" strokeWidth="1.2" />
            {/* Upper Stained-Glass Fairy Wing */}
            <path
              d="M68 72 C46 56 20 38 14 14 C32 22 52 34 68 54 Z"
              fill={`url(#${wingGradId})`}
              stroke="#78350f"
              strokeWidth="1.6"
            />
            <path d="M68 62 L24 27 M68 67 L32 45 M50 40 L45 55" stroke="#92400e" strokeWidth="1" opacity="0.7" />
            {/* Lower Fairy Wing */}
            <path
              d="M68 74 C44 68 18 76 12 96 C26 105 52 104 68 92 Z"
              fill={`url(#${wingGradId})`}
              stroke="#78350f"
              strokeWidth="1.6"
            />
            <path d="M68 82 L22 92 M50 76 L40 99" stroke="#92400e" strokeWidth="1" opacity="0.7" />
          </g>
        </svg>
      );
    }

    // 3. SUJETALIBROS MANOS ATADAS CON CUERDA CARMESÍ (Dark romance shadowbox)
    case 'crimson-hands':
      return (
        <svg viewBox="4 6 68 114" preserveAspectRatio="xMidYMax meet" className={className} aria-hidden="true">
          <ellipse cx="38" cy="117.5" rx="28" ry="2.2" fill="rgba(0,0,0,0.72)" />
          {/* Black shadowbox frame */}
          <rect x="8" y="10" width="60" height="106" rx="2" fill="#18181b" stroke="#3f3f46" strokeWidth="1.8" />
          <rect x="14" y="16" width="48" height="94" fill="#09090b" />
          {isRight ? (
            <>
              {/* Two alabaster forearms meeting in bound clasped hands */}
              <path
                d="M17 110 L28 60 C29 53 35 49 38 51 L39 70 L32 110 Z"
                fill="#f1f5f9"
                stroke="#94a3b8"
                strokeWidth="0.9"
              />
              <path
                d="M59 110 L48 60 C47 53 41 49 38 51 L37 70 L44 110 Z"
                fill="#cbd5e1"
                stroke="#94a3b8"
                strokeWidth="0.9"
              />
              {/* Interlocked fingers / thumbs at top */}
              <ellipse cx="35" cy="54" rx="4" ry="6" fill="#e2e8f0" stroke="#64748b" strokeWidth="0.8" />
              <ellipse cx="41" cy="54" rx="4" ry="6" fill="#cbd5e1" stroke="#64748b" strokeWidth="0.8" />
              <line x1="38" y1="50" x2="38" y2="61" stroke="#64748b" strokeWidth="0.9" />
              {/* Vertical suspension crimson rope from bound hands */}
              <line x1="38" y1="16" x2="38" y2="54" stroke="#e11d48" strokeWidth="3.2" />
              <line x1="37" y1="16" x2="37" y2="54" stroke="#fb7185" strokeWidth="0.8" opacity="0.6" />
              {/* Triple coiled crimson rope binding both wrists together */}
              <rect x="23" y="68" width="30" height="4.2" rx="2" fill="#e11d48" stroke="#881337" strokeWidth="0.9" />
              <rect x="22" y="72" width="32" height="4.2" rx="2" fill="#f43f5e" stroke="#881337" strokeWidth="0.9" />
              <rect x="23" y="76" width="30" height="4.2" rx="2" fill="#be123c" stroke="#881337" strokeWidth="0.9" />
              {/* Center rope knot */}
              <circle cx="38" cy="74" r="3.4" fill="#e11d48" stroke="#881337" strokeWidth="0.9" />
            </>
          ) : (
            <>
              {/* Sculpted forearm rising to bound fist/hand with visible fingers */}
              <path
                d="M32 110 C34 94 34 80 31 68 C29 60 32 52 38 51 C44 50 47 57 45 66 C43 77 45 92 48 110 Z"
                fill="#b45309"
                stroke="#7c2d12"
                strokeWidth="1"
              />
              {/* Curled bound fingers & thumb */}
              <path d="M32 58 C34 55 41 55 43 58" fill="none" stroke="#7c2d12" strokeWidth="1" />
              <path d="M32 62 C35 59 42 59 44 62" fill="none" stroke="#7c2d12" strokeWidth="1" />
              <ellipse cx="42" cy="60" rx="3.2" ry="4.5" fill="#9a3412" stroke="#7c2d12" strokeWidth="0.8" />
              {/* Vertical crimson cord to frame top */}
              <line x1="38" y1="16" x2="38" y2="56" stroke="#e11d48" strokeWidth="3.2" />
              {/* Coiled crimson rope bound around hand & wrist + knot + loose tail */}
              <rect x="28" y="64" width="19" height="3.8" rx="1.8" fill="#e11d48" stroke="#881337" strokeWidth="0.8" />
              <rect x="29" y="68" width="18" height="3.8" rx="1.8" fill="#f43f5e" stroke="#881337" strokeWidth="0.8" />
              <circle cx="36" cy="68" r="3.2" fill="#be123c" stroke="#881337" strokeWidth="0.9" />
              <path d="M35 70 L25 89" stroke="#e11d48" strokeWidth="3" strokeLinecap="round" />
            </>
          )}
        </svg>
      );
  }
};

interface ShelfBookendProps {
  id: Exclude<ShelfBookendId, 'none'>;
  side: 'left' | 'right';
  compact?: boolean;
}

export const ShelfBookend: React.FC<ShelfBookendProps> = ({
  id,
  side,
  compact = false,
}) => {
  const [bounce, setBounce] = useState(false);
  const [reactionMsg, setReactionMsg] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const meta =
    SHELF_BOOKEND_CATALOG.find((item) => item.id === id) ||
    SHELF_BOOKEND_CATALOG[0];

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBounce(true);
    setReactionMsg(meta.reaction);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setBounce(false);
      setReactionMsg(null);
    }, 2200);
  };

  return (
    <div
      className={`relative flex flex-col items-center justify-end self-end mb-[-3px] shrink-0 ${
        compact
          ? 'w-[34px] sm:w-[48px] h-[90px] sm:h-[118px]'
          : 'w-[40px] sm:w-[58px] md:w-[66px] h-[96px] sm:h-[128px] md:h-[142px]'
      }`}
    >
      {reactionMsg && (
        <span
          role="status"
          className="absolute -top-11 left-1/2 -translate-x-1/2 z-50 bg-black/95 border border-white/20 text-white text-[10px] leading-snug px-2.5 py-1.5 rounded-xl shadow-2xl pointer-events-none w-max max-w-[175px] text-center font-medium animate-popIn"
        >
          {reactionMsg}
        </span>
      )}

      <button
        type="button"
        onClick={handleClick}
        className={`group w-full h-full select-none flex items-end justify-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-pink)] rounded-lg transition-transform duration-150 ${
          bounce ? '-translate-y-1 scale-105' : 'hover:-translate-y-0.5'
        }`}
        title={`Sujetalibros ${meta.name} — ${meta.subtitle}`}
        aria-label={`Sujetalibros ${meta.name} (${side === 'left' ? 'izquierdo' : 'derecho'})`}
      >
        <ShelfBookendArt
          id={id}
          side={side}
          className="w-full h-full drop-shadow-[0_3px_5px_rgba(0,0,0,0.75)] transition-transform duration-150 group-hover:scale-105"
        />
      </button>
    </div>
  );
};

/* ==========================================================================
   Atmospheric Bookcase Backwall Overlay (Hanging Vines, Starry Moon Wallpaper,
   Gothic Arch Vignette)
   ========================================================================== */
export const ShelfAtmosphereBackwall: React.FC<{ config: ShelfDecorConfig }> = ({ config }) => {
  if (config.theme === 'none') return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-[1] overflow-hidden" aria-hidden="true">
      {config.theme === 'kawaii' && (
        <>
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 25% 15%, rgba(254, 243, 199, 0.14), transparent 55%), radial-gradient(circle at 80% 70%, rgba(251, 207, 232, 0.14), transparent 55%)',
            }}
          />
          {config.hangingVines && (
            <>
              <HangingIvySvg side="left" variant="kawaii" />
              <HangingIvySvg side="right" variant="kawaii" />
            </>
          )}
        </>
      )}

      {config.theme === 'fantasy' && (
        <>
          {config.hangingVines && (
            <>
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180' viewBox='0 0 180 180'%3E%3Cpath d='M48 34 A14 14 0 1 0 64 52 A11 11 0 1 1 48 34 Z' fill='%23fde68a'/%3E%3Ccircle cx='120' cy='40' r='2' fill='%23fde68a'/%3E%3Ccircle cx='152' cy='90' r='1.6' fill='%23fef3c7'/%3E%3Ccircle cx='28' cy='112' r='1.8' fill='%23fde68a'/%3E%3Ccircle cx='96' cy='140' r='2.1' fill='%23fde68a'/%3E%3Cpath d='M138 134 L141 140 L147 142 L141 144 L138 150 L135 144 L129 142 L135 140 Z' fill='%23fde68a'/%3E%3Cpath d='M76 86 C76 78 86 74 92 78 C98 72 110 75 112 83 C118 84 121 90 116 94 H79 C73 94 72 88 76 86 Z' fill='none' stroke='%23fde68a' stroke-opacity='0.35' stroke-width='1.4'/%3E%3C/svg%3E")`,
                  backgroundSize: '180px 180px',
                }}
              />
              <HangingIvySvg side="left" variant="fantasy" />
              <HangingIvySvg side="right" variant="fantasy" />
            </>
          )}
        </>
      )}

      {config.theme === 'dark' && (
        <>
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 50% 0%, rgba(190, 18, 60, 0.14), transparent 60%), radial-gradient(circle at 50% 100%, rgba(0, 0, 0, 0.55), transparent 65%)',
            }}
          />
          {config.hangingVines && (
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Cpath d='M60 10 L75 35 L60 60 L45 35 Z' fill='none' stroke='%23fb7185' stroke-opacity='0.35' stroke-width='1'/%3E%3Ccircle cx='60' cy='60' r='3' fill='none' stroke='%23fda4af' stroke-opacity='0.3'/%3E%3C/svg%3E")`,
                backgroundSize: '120px 120px',
              }}
            />
          )}
        </>
      )}
    </div>
  );
};

const HangingIvySvg: React.FC<{ side: 'left' | 'right'; variant: 'kawaii' | 'fantasy' }> = ({
  side,
  variant,
}) => {
  const leafFillA = variant === 'kawaii' ? '#4ade80' : '#22c55e';
  const leafFillB = variant === 'kawaii' ? '#16a34a' : '#15803d';
  const isRight = side === 'right';

  return (
    <svg
      viewBox="0 0 70 280"
      className={`absolute top-0 ${isRight ? 'right-0 -scale-x-100' : 'left-0'} w-10 sm:w-14 h-56 sm:h-72 opacity-75`}
      aria-hidden="true"
    >
      <path d="M12 0 Q18 68 14 140 Q10 205 22 265" fill="none" stroke={leafFillB} strokeWidth="2.2" />
      <path d="M28 0 Q34 50 26 112 Q22 155 30 198" fill="none" stroke={leafFillA} strokeWidth="1.8" />
      <path d="M13 24 Q28 20 30 34 Q18 38 13 24 Z" fill={leafFillA} />
      <path d="M15 56 Q2 60 5 72 Q17 70 15 56 Z" fill={leafFillB} />
      <path d="M16 92 Q32 88 33 102 Q20 105 16 92 Z" fill={leafFillA} />
      <path d="M13 134 Q2 140 6 152 Q18 148 13 134 Z" fill={leafFillB} />
      <path d="M14 176 Q29 174 28 188 Q17 190 14 176 Z" fill={leafFillA} />
      <path d="M17 222 Q5 228 9 240 Q21 236 17 222 Z" fill={leafFillB} />
      <path d="M29 44 Q46 40 46 54 Q34 57 29 44 Z" fill={leafFillB} />
      <path d="M26 112 Q42 110 40 124 Q28 125 26 112 Z" fill={leafFillA} />
    </svg>
  );
};

export const getLedGlowClass = (theme: ShelfDecorTheme, enabled: boolean): string => {
  if (!enabled || theme === 'none') return '';
  if (theme === 'kawaii') return 'shelf-led-kawaii';
  if (theme === 'fantasy') return 'shelf-led-fantasy';
  if (theme === 'dark') return 'shelf-led-dark';
  return '';
};
