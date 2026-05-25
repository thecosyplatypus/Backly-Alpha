import React, { useMemo } from 'react';
import { GameStatus } from '../../../shared/types';
import SteamImage from '../ui/SteamImage';

interface Props {
  game: any;
  onClick?: () => void;
  compact?: boolean;
}

const statusColors: Record<string, string> = {
  [GameStatus.BACKLOG]: 'bg-gray-600',
  [GameStatus.STARTED]: 'bg-blue-600',
  [GameStatus.PLAYING]: 'bg-green-600',
  [GameStatus.COMPLETED]: 'bg-purple-600',
  [GameStatus.PAUSED]: 'bg-yellow-600',
  [GameStatus.DROPPED]: 'bg-red-600',
  [GameStatus.WISHLIST]: 'bg-pink-600',
  [GameStatus.NO_ACHIEVEMENTS]: 'bg-gray-500',
};

const statusLabels: Record<string, string> = {
  [GameStatus.BACKLOG]: 'Backlog',
  [GameStatus.STARTED]: 'Started',
  [GameStatus.PLAYING]: 'Playing',
  [GameStatus.COMPLETED]: 'Completed',
  [GameStatus.PAUSED]: 'Paused',
  [GameStatus.DROPPED]: 'Dropped',
  [GameStatus.WISHLIST]: 'Wishlist',
  [GameStatus.NO_ACHIEVEMENTS]: 'No Achievements',
};

const FALLBACK_BASE = 'https://ui-avatars.com/api/?background=6366f1&color=fff&size=256';

function getFallback(title: string): string {
  return `${FALLBACK_BASE}&name=${encodeURIComponent(title)}`;
}

function CompletionRing({ pct, size = 36 }: { pct: number; size?: number }) {
  const r = (size - 4) / 2;
  const c = r * 2 * Math.PI;
  const offset = c - (pct / 100) * c;
  const isComplete = pct >= 100;
  const color = isComplete ? '#22c55e' : '#6366f1';
  return (
    <svg width={size} height={size} className="transform -rotate-90 shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={offset}
        className="transition-all duration-700"
        style={{ filter: isComplete ? 'drop-shadow(0 0 4px rgba(34,197,94,0.5))' : undefined }}
      />
    </svg>
  );
}

export default function GameCard({ game, onClick, compact }: Props) {
  const fallbackUrl = getFallback(game.title);
  const coverArt = game.coverArt || fallbackUrl;

  const achTotal = game.totalAchievements ?? 0;
  const achUnlocked = game.unlockedAchievements ?? 0;
  const achPct = game.completionPercentage ?? (achTotal > 0 ? Math.round((achUnlocked / achTotal) * 100) : 0);
  const hasAchievements = achTotal > 0;
  const isFullyComplete = hasAchievements && achPct >= 100;
  const isNotStarted = hasAchievements && achUnlocked === 0;
  const remaining = achTotal - achUnlocked;

  const ringColor = useMemo(() => {
    if (isFullyComplete) return 'from-green-500 to-emerald-400';
    if (achPct >= 50) return 'from-gold-500 to-yellow-400';
    if (achPct > 0) return 'from-backly-600 to-indigo-400';
    return 'from-gray-600 to-gray-500';
  }, [isFullyComplete, achPct]);

  if (compact) {
    return (
      <button
        onClick={onClick}
        className="group relative overflow-hidden rounded-lg aspect-[3/4] bg-surface-800 hover:scale-105 transition-all duration-200 gpu"
      >
        <SteamImage
          src={coverArt}
          alt={game.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-1.5 md:p-2">
          <p className="text-[9px] md:text-[10px] font-medium text-white truncate">{game.title}</p>
          {game.hoursPlayed > 0 && (
            <p className="text-[8px] md:text-[9px] text-gray-400">{Math.round(game.hoursPlayed)}h</p>
          )}
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-lg md:rounded-xl transition-all duration-200 w-full text-left card-gpu ${
        isFullyComplete
          ? 'bg-surface-800 ring-1 ring-green-500/30 hover:ring-green-400/50 hover:scale-[1.03] hover:shadow-[0_0_24px_rgba(34,197,94,0.15)]'
          : 'bg-surface-800 hover:scale-[1.03] hover:neon-glow'
      }`}
    >
      <div className="aspect-[16/9] overflow-hidden relative">
        <SteamImage
          src={coverArt}
          alt={game.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 gpu"
        />
        {isFullyComplete && (
          <div className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 border border-green-400/30 text-green-400 text-[9px] font-semibold backdrop-blur-sm">
            <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3" stroke="currentColor" strokeWidth="2">
              <path d="M14 4L6 12l-4-4" />
            </svg>
            Completed
          </div>
        )}
        {hasAchievements && (
          <div className="absolute top-2 left-2 z-10">
            <CompletionRing pct={achPct} size={32} />
          </div>
        )}
      </div>
      <div className="p-2 md:p-3 space-y-1 md:space-y-1.5">
        <div className="flex items-center gap-1.5 md:gap-2">
          <span className={`w-1 md:w-1.5 h-1 md:h-1.5 rounded-full ${statusColors[game.status] || 'bg-gray-600'}`} />
          <span className="text-[8px] md:text-[10px] text-gray-500 uppercase tracking-wider truncate">
            {statusLabels[game.status] || game.status}
          </span>
          {game.isFavourite && <span className="text-yellow-400 text-[10px] md:text-xs">★</span>}
        </div>
        <h3 className="text-[11px] md:text-sm font-semibold text-white truncate group-hover:text-backly-400 transition-colors">
          {game.title}
        </h3>
        <div className="flex items-center gap-1.5 md:gap-2 text-[9px] md:text-[11px] text-gray-500 flex-wrap">
          {game.hoursPlayed > 0 && <span>{Math.round(game.hoursPlayed)}h</span>}
          {game.genre && <span className="truncate max-w-[80px] md:max-w-[100px]">{game.genre}</span>}
        </div>

        {/* Achievement Progress */}
        {hasAchievements && (
          <div className="pt-1 space-y-1">
            <div className="flex items-center justify-between text-[9px] md:text-[10px]">
              <span className={isFullyComplete ? 'text-green-400 font-medium' : isNotStarted ? 'text-gray-500' : 'text-gray-400'}>
                {isFullyComplete ? '100% Complete' : isNotStarted ? 'Not Started' : `${achPct}% Complete`}
              </span>
              <span className="text-gray-500">
                <span className={isFullyComplete ? 'text-green-400' : 'text-gray-300'}>{achUnlocked}</span>
                /{achTotal}
              </span>
            </div>
            <div className="w-full h-1 rounded-full bg-surface-700/50 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${ringColor}`}
                style={{ width: `${achPct}%` }}
              />
            </div>
            {!isFullyComplete && remaining > 0 && (
              <p className="text-[8px] text-gray-600">{remaining} remaining</p>
            )}
          </div>
        )}

        {game.userRating && (
          <div className="flex items-center gap-1">
            <span className="text-yellow-400 text-[10px] md:text-xs">★</span>
            <span className="text-[10px] md:text-xs text-gray-400">{game.userRating}/10</span>
          </div>
        )}
      </div>
    </button>
  );
}
