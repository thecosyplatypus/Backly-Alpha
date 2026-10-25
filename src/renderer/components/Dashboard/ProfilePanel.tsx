import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import { useGameStore } from '../../store/gameStore';
import { useActivityStore } from '../../store/activityStore';
import { ActivityEvent, ActivityType } from '../../../shared/types';

const MILESTONES = [10, 25, 50, 100, 250, 500];

const ACTIVITY_ICONS: Record<string, React.FC<{ className?: string }>> = {
  play: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
  check: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={className}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  plus: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  trophy: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M6 9H4.5a2.5 2.5 0 010-5C7 4 6 9 6 9zM18 9h1.5a2.5 2.5 0 000-5C17 4 18 9 18 9zM12 15v6M8 21h8" />
      <path d="M6 9h12v2a6 6 0 01-12 0V9z" />
    </svg>
  ),
  sync: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2" />
    </svg>
  ),
  dice: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8" cy="8" r="1" />
      <circle cx="16" cy="8" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="8" cy="16" r="1" />
      <circle cx="16" cy="16" r="1" />
    </svg>
  ),
  download: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </svg>
  ),
  heart: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  ),
  'heart-off': ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
  trash: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  ),
  stop: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  ),
  award: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <circle cx="12" cy="8" r="7" />
      <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" />
    </svg>
  ),
  star: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  clock: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  'check-circle': ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  default: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
};

const ACTIVITY_COLORS: Record<string, string> = {
  play: 'text-neon-green bg-green-500/10 border-green-500/10',
  check: 'text-neon-purple bg-purple-500/10 border-purple-500/10',
  plus: 'text-neon-cyan bg-cyan-500/10 border-cyan-500/10',
  trophy: 'text-gold-400 bg-gold-500/10 border-gold-500/10',
  sync: 'text-neon-blue bg-blue-500/10 border-blue-500/10',
  dice: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/10',
  download: 'text-teal-400 bg-teal-500/10 border-teal-500/10',
  heart: 'text-neon-pink bg-pink-500/10 border-pink-500/10',
  'heart-off': 'text-gray-400 bg-gray-500/10 border-gray-500/10',
  trash: 'text-red-400 bg-red-500/10 border-red-500/10',
  stop: 'text-orange-400 bg-orange-500/10 border-orange-500/10',
  award: 'text-gold-400 bg-gold-500/10 border-gold-500/10',
  star: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/10',
  clock: 'text-neon-blue bg-blue-500/10 border-blue-500/10',
  'check-circle': 'text-neon-green bg-green-500/10 border-green-500/10',
  default: 'text-gray-400 bg-gray-500/10 border-gray-500/10',
};

function ActivityIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

function BadgeTrophyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <path d="M6 9H4.5a2.5 2.5 0 010-5C7 4 6 9 6 9zM18 9h1.5a2.5 2.5 0 000-5C17 4 18 9 18 9z" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0012 0V2z" />
    </svg>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gold-500/10 border border-gold-500/10 flex items-center justify-center mb-4">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-7 h-7 text-gold-400">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      </div>
      <h4 className="text-sm font-semibold text-white mb-1.5">Your gaming journey starts here</h4>
      <p className="text-[11px] text-gray-500 leading-relaxed max-w-[200px]">
        Import your Steam library, add games to your backlog, and start tracking completions.
      </p>
      <div className="flex flex-wrap justify-center gap-1.5 mt-4">
        <span className="px-2 py-0.5 rounded-md bg-surface-700/50 text-[9px] text-gray-400 border border-white/[0.04]">Import Steam</span>
        <span className="px-2 py-0.5 rounded-md bg-surface-700/50 text-[9px] text-gray-400 border border-white/[0.04]">Add Games</span>
        <span className="px-2 py-0.5 rounded-md bg-surface-700/50 text-[9px] text-gray-400 border border-white/[0.04]">Spin Wheel</span>
      </div>
    </div>
  );
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function ProfilePanel() {
  const steamStatus = useSettingsStore(s => s.steamStatus);
  const stats = useGameStore(s => s.stats);
  const activities = useActivityStore(s => s.activities);
  const loading = useActivityStore(s => s.loading);
  const fetchActivities = useActivityStore(s => s.fetchActivities);
  const isConnected = steamStatus?.isConnected;
  const username = steamStatus?.username || 'Player';
  const avatar = steamStatus?.avatar;
  const scrollRef = useRef<HTMLDivElement>(null);

  const [xp, setXp] = useState(0);
  useEffect(() => {
    window.backly.getSettings().then((s: any) => setXp(s?.xp || 0)).catch(() => {});
  }, []);
  const level = Math.floor(xp / 500) + 1;
  const levelXp = xp % 500;
  const nextLevelXp = 500;
  const progressPercent = Math.min(100, Math.max(0, Math.round((levelXp / nextLevelXp) * 100)));
  const remaining = Math.max(0, nextLevelXp - levelXp);

  useEffect(() => {
    fetchActivities({ limit: 30 });
  }, []);

  useEffect(() => {
    const cleanup = window.backly.onActivityUpdate?.((activity) => {
      useActivityStore.getState().pushActivity(activity);
    });
    return () => cleanup?.();
  }, []);

  const ActivityItem = useCallback(({ activity, index }: { activity: ActivityEvent; index: number }) => {
    const IconComponent = ACTIVITY_ICONS[activity.icon] || ACTIVITY_ICONS.default;
    const colorClasses = ACTIVITY_COLORS[activity.icon] || ACTIVITY_COLORS.default;

    return (
      <div
        className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/[0.03] transition-all duration-200 cursor-default animate-slide-up-fade"
        style={{ animationDelay: `${Math.min(index * 30, 200)}ms` }}
      >
        <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center border ${colorClasses}`}>
          <IconComponent className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-gray-300 group-hover:text-white transition-colors duration-150 leading-snug">
            {activity.description}
          </p>
          <p className="text-[9px] text-gray-600 mt-1 font-medium">
            {relativeTime(activity.createdAt)}
          </p>
        </div>
      </div>
    );
  }, []);

  const renderedActivities = useMemo(
    () => activities.map((a, i) => <ActivityItem key={a.id} activity={a} index={i} />),
    [activities, ActivityItem]
  );

  return (
    <aside className="w-[270px] flex-shrink-0 bg-surface-950/80 backdrop-blur-sm border-l border-white/[0.04] flex flex-col overflow-y-auto py-5 px-4 gap-4 resize-transition">
      {/* Profile card */}
      <div className="glass-strong rounded-2xl border border-white/[0.05] p-5">
        <div className="flex flex-col items-center">
          <div className="relative mb-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-500 to-yellow-400 p-[2px]">
              <div className="w-full h-full rounded-2xl bg-surface-900 flex items-center justify-center overflow-hidden">
                {avatar ? (
                  <img src={avatar} alt="" className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <span className="text-2xl font-bold text-gold-400">?</span>
                )}
              </div>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 border-2 border-surface-950 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
          </div>
          <h3 className="text-sm font-bold text-white">{username}</h3>
          <div className="flex items-center gap-1.5 mt-1">
            <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-500'}`} />
            <p className="text-[10px] text-gray-500 font-medium">
              {isConnected ? 'Steam Connected' : 'Offline'}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/[0.04]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-gold-500/10 border border-gold-500/10">
                <BadgeTrophyIcon />
                <span className="text-[10px] font-bold text-gold-400">Level {level}</span>
              </div>
            </div>
            <span className="text-[10px] text-gold-400/70 font-medium">Level {level} · {xp} XP</span>
          </div>
          <div className="relative w-full h-2.5 bg-surface-800/60 rounded-full overflow-hidden border border-white/[0.03]">
            <div
              className={`h-full rounded-full bg-gradient-to-r from-gold-600 via-gold-500 to-gold-400 transition-all duration-1000 ease-out relative `}
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[9px] text-gray-600">{progressPercent}% to next level</span>
            <span className="text-[9px] text-gray-600">{remaining} XP remaining</span>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="glass-strong rounded-2xl border border-white/[0.05] p-4 flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gold-500/10 text-gold-400 flex items-center justify-center">
              <ActivityIcon />
            </div>
            <h4 className="text-xs font-semibold text-white">Activity</h4>
          </div>
          {activities.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-gold-500/15 text-gold-400 text-[9px] font-bold flex items-center justify-center border border-gold-500/15">
              {activities.length > 99 ? '99+' : activities.length}
            </span>
          )}
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0 space-y-0.5 scrollbar-hide">
          {loading && activities.length === 0 ? (
            <div className="flex flex-col gap-2 p-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-start gap-3 p-2.5 animate-pulse">
                  <div className="w-8 h-8 rounded-xl bg-surface-700/50" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-surface-700/50 rounded w-3/4" />
                    <div className="h-2 bg-surface-700/30 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <EmptyState />
          ) : (
            renderedActivities
          )}
        </div>
      </div>
    </aside>
  );
}

