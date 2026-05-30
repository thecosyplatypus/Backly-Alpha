import { useState } from 'react';

interface AchievementCardEnhancedProps {
  name: string;
  description?: string;
  iconUrl?: string | null;
  unlocked: boolean;
  unlockTime?: string | null;
  globalProgress?: number | null;
  isNew?: boolean;
}

const RARITY_CONFIG = {
  rare: { threshold: 2, color: '#9C27B0', label: 'Rare', glow: '0 0 15px rgba(156,39,176,0.4)' },
  uncommon: { threshold: 8, color: '#FF9800', label: 'Uncommon', glow: '0 0 12px rgba(255,152,0,0.3)' },
  common: { threshold: 20, color: '#4CAF50', label: 'Common', glow: '0 0 8px rgba(76,175,80,0.2)' },
  veryCommon: { threshold: 100, color: '#8BC34A', label: 'Very Common', glow: '0 0 5px rgba(139,195,74,0.1)' },
};

function getRarity(pct: number | null | undefined): typeof RARITY_CONFIG.rare {
  if (pct === null || pct === undefined) return RARITY_CONFIG.veryCommon;
  if (pct <= RARITY_CONFIG.rare.threshold) return RARITY_CONFIG.rare;
  if (pct <= RARITY_CONFIG.uncommon.threshold) return RARITY_CONFIG.uncommon;
  if (pct <= RARITY_CONFIG.common.threshold) return RARITY_CONFIG.common;
  return RARITY_CONFIG.veryCommon;
}

export default function AchievementCardEnhanced({
  name, description, iconUrl, unlocked, unlockTime, globalProgress, isNew,
}: AchievementCardEnhancedProps) {
  const [imgError, setImgError] = useState(false);
  const rarity = getRarity(globalProgress);
  const isRare = rarity.label === 'Rare';

  return (
    <div
      className={`group relative flex items-start gap-3 p-2.5 md:p-3 rounded-xl transition-all duration-300 ${
        unlocked
          ? 'bg-gradient-to-r from-gold-500/[0.03] via-transparent to-transparent border border-gold-500/10'
          : 'bg-surface-800/30 border border-transparent hover:bg-surface-800/50'
      }`}
      style={{
        boxShadow: unlocked && isRare ? rarity.glow : unlocked ? '0 0 5px rgba(255,215,0,0.1)' : 'none',
      }}
    >
      {/* Rarity indicator */}
      {unlocked && (
        <div
          className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: rarity.color, boxShadow: `0 0 6px ${rarity.color}` }}
        />
      )}

      {/* Icon */}
      <div
        className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden transition-all duration-300 ${
          unlocked
            ? isRare
              ? 'bg-gradient-to-br from-purple-900/30 to-purple-700/10 ring-1 ring-purple-500/30'
              : 'bg-gold-500/10 ring-1 ring-gold-500/20'
            : 'bg-surface-700/50'
        }`}
      >
        {iconUrl && !imgError ? (
          <img
            src={iconUrl}
            alt=""
            className={`w-full h-full object-cover transition-all duration-300 ${
              unlocked ? 'opacity-90' : 'opacity-40 grayscale'
            }`}
            onError={() => setImgError(true)}
          />
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={`w-4 h-4 md:w-5 md:h-5 ${unlocked ? 'text-gold-400' : 'text-gray-600'}`}>
            <path d="M12 15v6M8 21h8" />
            <circle cx="12" cy="8" r="5" />
          </svg>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className={`text-[11px] md:text-xs font-medium truncate ${
            unlocked ? 'text-gold-300' : 'text-gray-400'
          }`}>
            {name}
          </p>
          {unlocked && (
            <svg viewBox="0 0 12 12" fill="none" className="w-2.5 h-2.5 shrink-0" stroke="#facc15" strokeWidth="2">
              <path d="M10.5 2L4.5 9l-3-3" />
            </svg>
          )}
          {isRare && unlocked && (
            <span className="px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/20">
              Rare
            </span>
          )}
          {isNew && unlocked && (
            <span className="px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider bg-gold-500/20 text-gold-400 border border-gold-500/20 animate-pulse">
              New
            </span>
          )}
        </div>

        {description && (
          <p className="text-[8px] md:text-[10px] text-gray-600 truncate mt-0.5">{description}</p>
        )}

        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {unlocked && unlockTime && (
            <span className="text-[7px] md:text-[9px] text-gold-500/60">
              {new Date(unlockTime).toLocaleDateString()}
            </span>
          )}
          {globalProgress !== null && globalProgress !== undefined && (
            <span
              className="text-[7px] md:text-[9px]"
              style={{ color: rarity.color }}
            >
              {globalProgress.toFixed(1)}% of players
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {globalProgress !== null && globalProgress !== undefined && (
        <div className="hidden sm:flex flex-col items-center justify-center w-10 shrink-0">
          <div className="w-full h-1 rounded-full bg-surface-700/50 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, globalProgress)}%`,
                backgroundColor: rarity.color,
                opacity: unlocked ? 0.8 : 0.3,
              }}
            />
          </div>
          <span className="text-[7px] text-gray-600 mt-0.5">{Math.round(globalProgress)}%</span>
        </div>
      )}
    </div>
  );
}

export function AchievementGrid({ achievements, columns = 4 }: {
  achievements: AchievementCardEnhancedProps[];
  columns?: number;
}) {
  return (
    <div
      className="grid gap-1.5 md:gap-2"
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
      }}
    >
      {achievements.map((ach, i) => (
        <AchievementCardEnhanced key={i} {...ach} />
      ))}
    </div>
  );
}
