import React, { useState } from 'react';
import { DailyReadingStat } from '../types';

interface ChartProps {
  data: DailyReadingStat[];
  height?: number;
}

// Helper to calculate smooth SVG curve path
function getSmoothCurvePath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;

    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

export const ReadingAreaChart: React.FC<ChartProps> = ({ data, height = 240 }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="w-full flex items-center justify-center text-xs text-[var(--text-muted)]" style={{ height }}>
        Sin datos disponibles
      </div>
    );
  }

  const width = 600;
  const padding = { top: 20, right: 20, bottom: 35, left: 40 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const rawMax = Math.max(1, ...data.map((d) => d.minutes || 0));
  // Round max to neat interval (e.g. 15, 30, 45, 60...)
  const maxVal = Math.max(10, Math.ceil(rawMax / 10) * 10);

  const points = data.map((d, i) => {
    const x = padding.left + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
    const y = padding.top + innerH - ((d.minutes || 0) / maxVal) * innerH;
    return { x, y, data: d };
  });

  const curveLine = getSmoothCurvePath(points);
  const bottomY = padding.top + innerH;
  const areaPath = points.length > 0
    ? `${curveLine} L ${points[points.length - 1].x} ${bottomY} L ${points[0].x} ${bottomY} Z`
    : '';

  // 4 Y-ticks
  const yTicks = [0, Math.round(maxVal / 3), Math.round((maxVal * 2) / 3), maxVal];

  // X-ticks interval (if 30 days show every 3rd or 4th, if 14 show every 2nd, if 7 show all)
  const xStep = data.length > 20 ? 4 : data.length > 10 ? 2 : 1;

  const activeItem = hoveredIdx !== null ? points[hoveredIdx] : null;

  return (
    <div className="w-full relative select-none">
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        className="w-full h-auto overflow-visible"
        style={{ maxHeight: height }}
      >
        <defs>
          <linearGradient id="areaTimeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff79c6" stopOpacity="0.65" />
            <stop offset="70%" stopColor="#bd93f9" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#bd93f9" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="lineTimeGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ff79c6" />
            <stop offset="100%" stopColor="#bd93f9" />
          </linearGradient>
          <filter id="areaGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Horizontal grid lines & Y labels */}
        {yTicks.map((tickVal, i) => {
          const y = padding.top + innerH - (tickVal / maxVal) * innerH;
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="rgba(255, 255, 255, 0.08)"
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 8}
                y={y + 3}
                textAnchor="end"
                className="fill-[var(--text-muted)] text-[10px] font-mono"
              >
                {tickVal}m
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaPath} fill="url(#areaTimeGradient)" />

        {/* Smooth line */}
        <path
          d={curveLine}
          fill="none"
          stroke="url(#lineTimeGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          filter="url(#areaGlow)"
        />

        {/* X axis labels */}
        {points.map((p, idx) => {
          if (idx % xStep !== 0 && idx !== points.length - 1) return null;
          return (
            <text
              key={idx}
              x={p.x}
              y={bottomY + 18}
              textAnchor="middle"
              className="fill-[var(--text-muted)] text-[10px]"
            >
              {p.data.dayLabel}
            </text>
          );
        })}

        {/* Interactive Hover Vertical Guideline */}
        {activeItem && (
          <line
            x1={activeItem.x}
            y1={padding.top}
            x2={activeItem.x}
            y2={bottomY}
            stroke="rgba(255, 121, 198, 0.4)"
            strokeDasharray="2 2"
            strokeWidth="1.5"
          />
        )}

        {/* Data points */}
        {points.map((p, idx) => {
          const isHovered = hoveredIdx === idx;
          return (
            <g 
              key={idx}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIdx(idx)}
              onTouchStart={() => setHoveredIdx(idx)}
            >
              {/* Invisible large touch hit area */}
              <circle cx={p.x} cy={p.y} r="16" fill="transparent" />

              {/* Visible dot */}
              <circle
                cx={p.x}
                cy={p.y}
                r={isHovered ? 6 : 3.5}
                fill={isHovered ? '#ffffff' : '#ff79c6'}
                stroke="#bd93f9"
                strokeWidth={isHovered ? 2.5 : 1}
                className="transition-all duration-150"
              />
            </g>
          );
        })}
      </svg>

      {/* Floating Tooltip Card */}
      {activeItem && (
        <div 
          className="absolute z-20 pointer-events-none bg-[var(--card-bg)] border border-[var(--accent-pink)] p-2.5 rounded-xl shadow-2xl text-xs -translate-x-1/2 -translate-y-full transition-all duration-150 animate-popIn"
          style={{
            left: `${(activeItem.x / width) * 100}%`,
            top: `${(activeItem.y / height) * 100 - 8}%`
          }}
        >
          <p className="font-bold text-[var(--accent-pink)] mb-0.5 text-[11px]">
            {activeItem.data.formattedDate} ({activeItem.data.dayLabel})
          </p>
          <p className="text-white flex items-center gap-1 font-mono">
            <span>⏱️ Tiempo:</span>
            <span className="font-bold text-[var(--accent-pink)]">
              {activeItem.data.minutes} min
            </span>
          </p>
          <p className="text-[var(--text-muted)] text-[10px] mt-0.5">
            📖 {activeItem.data.pages} páginas leídas
          </p>
        </div>
      )}
    </div>
  );
};

export const ReadingBarChart: React.FC<ChartProps> = ({ data, height = 240 }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="w-full flex items-center justify-center text-xs text-[var(--text-muted)]" style={{ height }}>
        Sin datos disponibles
      </div>
    );
  }

  const width = 600;
  const padding = { top: 20, right: 20, bottom: 35, left: 40 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const rawMax = Math.max(1, ...data.map((d) => d.pages || 0));
  const maxVal = Math.max(10, Math.ceil(rawMax / 5) * 5);

  const slotW = innerW / data.length;
  const barW = Math.max(6, Math.min(24, slotW * 0.65));

  const yTicks = [0, Math.round(maxVal / 3), Math.round((maxVal * 2) / 3), maxVal];
  const bottomY = padding.top + innerH;
  const xStep = data.length > 20 ? 4 : data.length > 10 ? 2 : 1;

  const activeData = hoveredIdx !== null ? data[hoveredIdx] : null;
  const activeX = hoveredIdx !== null ? padding.left + (hoveredIdx + 0.5) * slotW : 0;
  const activeY = hoveredIdx !== null && activeData
    ? padding.top + innerH - (activeData.pages / maxVal) * innerH
    : 0;

  return (
    <div className="w-full relative select-none">
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        className="w-full h-auto overflow-visible"
        style={{ maxHeight: height }}
      >
        <defs>
          <linearGradient id="barPagesGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#bd93f9" />
            <stop offset="100%" stopColor="#ff79c6" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="barHoverGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#bd93f9" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines & Y labels */}
        {yTicks.map((tickVal, i) => {
          const y = padding.top + innerH - (tickVal / maxVal) * innerH;
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="rgba(255, 255, 255, 0.08)"
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 8}
                y={y + 3}
                textAnchor="end"
                className="fill-[var(--text-muted)] text-[10px] font-mono"
              >
                {tickVal}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, idx) => {
          const val = d.pages || 0;
          const barH = (val / maxVal) * innerH;
          const x = padding.left + (idx + 0.5) * slotW - barW / 2;
          const y = bottomY - barH;
          const isHovered = hoveredIdx === idx;

          return (
            <g 
              key={idx}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIdx(idx)}
              onTouchStart={() => setHoveredIdx(idx)}
            >
              {/* Invisible large touch hit area */}
              <rect
                x={padding.left + idx * slotW}
                y={padding.top}
                width={slotW}
                height={innerH}
                fill="transparent"
              />

              {/* Bar Rect */}
              {barH > 0 && (
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={barH}
                  rx="4"
                  ry="4"
                  fill={isHovered ? 'url(#barHoverGradient)' : 'url(#barPagesGradient)'}
                  className="transition-all duration-150"
                  opacity={isHovered ? 1 : 0.9}
                />
              )}
            </g>
          );
        })}

        {/* X axis labels */}
        {data.map((d, idx) => {
          if (idx % xStep !== 0 && idx !== data.length - 1) return null;
          const x = padding.left + (idx + 0.5) * slotW;
          return (
            <text
              key={idx}
              x={x}
              y={bottomY + 18}
              textAnchor="middle"
              className="fill-[var(--text-muted)] text-[10px]"
            >
              {d.dayLabel}
            </text>
          );
        })}
      </svg>

      {/* Floating Tooltip Card */}
      {activeData && (
        <div 
          className="absolute z-20 pointer-events-none bg-[var(--card-bg)] border border-[var(--accent-purple)] p-2.5 rounded-xl shadow-2xl text-xs -translate-x-1/2 -translate-y-full transition-all duration-150 animate-popIn"
          style={{
            left: `${(activeX / width) * 100}%`,
            top: `${(activeY / height) * 100 - 8}%`
          }}
        >
          <p className="font-bold text-[var(--accent-purple)] mb-0.5 text-[11px]">
            {activeData.formattedDate} ({activeData.dayLabel})
          </p>
          <p className="text-white flex items-center gap-1 font-mono">
            <span>📖 Páginas:</span>
            <span className="font-bold text-[var(--accent-purple)]">
              {activeData.pages} págs
            </span>
          </p>
          <p className="text-[var(--text-muted)] text-[10px] mt-0.5">
            ⏱️ {activeData.minutes} minutos de lectura
          </p>
        </div>
      )}
    </div>
  );
};
