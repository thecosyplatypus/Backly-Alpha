import React from 'react';

interface Props {
  data?: { genre: string; hours: number }[];
  totalHours?: number;
}

const GENRE_COLORS: Record<string, { color: string; glow: string }> = {
  RPG: { color: '#eab308', glow: 'rgba(234,179,8,0.3)' },
  Action: { color: '#f97316', glow: 'rgba(249,115,22,0.3)' },
  Adventure: { color: '#ffd700', glow: 'rgba(255,215,0,0.3)' },
  Strategy: { color: '#f59e0b', glow: 'rgba(245,158,11,0.3)' },
  Simulation: { color: '#d97706', glow: 'rgba(217,119,6,0.3)' },
  FPS: { color: '#ef4444', glow: 'rgba(239,68,68,0.3)' },
  Horror: { color: '#6b21a8', glow: 'rgba(107,33,168,0.3)' },
  Puzzle: { color: '#06b6d4', glow: 'rgba(6,182,212,0.3)' },
  Indie: { color: '#a855f7', glow: 'rgba(168,85,247,0.3)' },
};

export default function PlaytimeRing({ data: rawData, totalHours: rawTotal }: Props) {
  const data = rawData?.length ? rawData : [];
  const totalHours = rawTotal ?? data.reduce((sum, s) => sum + s.hours, 0);
  const size = 140;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  let cumulativePercent = 0;

  const segments = data.map((d) => {
    const colors = GENRE_COLORS[d.genre] || { color: '#8b5cf6', glow: 'rgba(139,92,246,0.3)' };
    return { label: d.genre, hours: d.hours, ...colors };
  });

  const showEmpty = data.length === 0;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <div>
          <h3 className="text-[11px] md:text-sm font-semibold text-white">Playtime</h3>
          <p className="text-[9px] md:text-xs text-gray-500 mt-0.5">Genre breakdown</p>
        </div>
      </div>

      <div className="flex flex-col items-center">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="transform -rotate-90">
            {segments.map((segment) => {
              const percent = segment.hours / totalHours;
              const offset = circumference * (1 - cumulativePercent);
              cumulativePercent += percent;
              return (
                <circle
                  key={segment.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${circumference * percent} ${circumference * (1 - percent)}`}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                  style={{ filter: `drop-shadow(0 0 4px ${segment.glow})` }}
                />
              );
            })}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.03)"
              strokeWidth={strokeWidth}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg md:text-2xl font-black text-white">{totalHours}</span>
            <span className="text-[8px] md:text-[10px] text-gray-500 font-medium">hours</span>
          </div>
        </div>

        <div className="w-full mt-3 md:mt-5 space-y-1.5 md:space-y-2">
          {showEmpty && (
            <p className="text-[10px] md:text-xs text-gray-500 text-center py-4">No genre data yet</p>
          )}
          {segments.map((segment) => {
            const percent = Math.round((segment.hours / totalHours) * 100);
            return (
              <div key={segment.label} className="flex items-center justify-between group">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <div
                    className="w-2 md:w-2.5 h-2 md:h-2.5 rounded-full"
                    style={{ backgroundColor: segment.color, boxShadow: `0 0 6px ${segment.glow}` }}
                  />
                  <span className="text-[10px] md:text-xs text-gray-400 group-hover:text-white transition-colors">{segment.label}</span>
                </div>
                <div className="flex items-center gap-1.5 md:gap-2">
                  <span className="text-[10px] md:text-xs font-medium text-white">{segment.hours}h</span>
                  <span className="text-[8px] md:text-[10px] text-gray-500 w-6 md:w-8 text-right">{percent}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
