import React from 'react';

interface Props {
  title: string;
  description: string;
  icon: string | null;
  progress: number | null;
  unlocked: boolean;
  globalProgress?: number | null;
  gameTitle?: string;
}

function LockedIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

function UnlockedIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 019.9-1" />
      <circle cx="12" cy="16" r="1" />
    </svg>
  );
}

export default function AchievementCard({ title, description, icon, progress, unlocked, globalProgress, gameTitle }: Props) {
  const displayProgress = progress ?? (globalProgress ? Math.round(globalProgress) : null);

  return (
    <div
      className={`group flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-300 cursor-default ${
        unlocked
          ? 'bg-white/[0.03] border-white/[0.04] hover:bg-white/[0.05] hover:border-gold-500/15'
          : 'bg-white/[0.01] border-white/[0.02] hover:bg-white/[0.03] hover:border-white/[0.06]'
      }`}
    >
      <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-300 ${
        unlocked
          ? 'bg-gold-500/15 border-gold-500/20 text-gold-400 group-hover:bg-gold-500/20'
          : 'bg-surface-800/60 border-white/[0.04] text-gray-600'
      }`}>
        {icon ? (
          <img src={icon} alt="" className="w-6 h-6 object-contain" loading="lazy" />
        ) : unlocked ? (
          <UnlockedIcon className="w-4 h-4" />
        ) : (
          <LockedIcon className="w-4 h-4" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className={`text-[11px] font-semibold leading-snug transition-colors line-clamp-2 ${
              unlocked ? 'text-white group-hover:text-gold-400' : 'text-gray-400'
            }`}>
              {title}
            </p>
            {gameTitle && (
              <p className="text-[8px] text-gray-600 mt-0.5 truncate">{gameTitle}</p>
            )}
          </div>
          <div className="flex-shrink-0 text-right">
            {displayProgress !== null && (
              <span className={`text-[10px] font-bold tabular-nums ${
                unlocked ? 'text-gold-400' : 'text-gray-600'
              }`}>
                {displayProgress}%
              </span>
            )}
          </div>
        </div>
        {description && (
          <p className={`text-[9px] mt-0.5 leading-relaxed line-clamp-1 ${
            unlocked ? 'text-gray-500' : 'text-gray-600'
          }`}>
            {description}
          </p>
        )}
        {displayProgress !== null && (
          <div className="mt-1.5 w-full h-1 bg-surface-700/40 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                unlocked
                  ? 'bg-gradient-to-r from-gold-500 to-yellow-400 shadow-[0_0_6px_rgba(234,179,8,0.15)]'
                  : 'bg-surface-600/60'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, displayProgress))}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
