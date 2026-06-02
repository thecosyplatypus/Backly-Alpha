import React, { useEffect, useRef, useState } from 'react';
import { BacklogHealth as BacklogHealthType } from '../../../shared/types';

const RATING_CONFIG = {
  healthy: { color: 'from-emerald-500 to-green-400', glow: 'rgba(34,197,94,0.3)', label: 'Healthy', icon: 'check-circle' },
  growing: { color: 'from-gold-500 to-yellow-400', glow: 'rgba(234,179,8,0.3)', label: 'Growing', icon: 'trending-up' },
  overloaded: { color: 'from-orange-500 to-amber-400', glow: 'rgba(249,115,22,0.3)', label: 'Overloaded', icon: 'alert-triangle' },
  critical: { color: 'from-red-500 to-rose-400', glow: 'rgba(239,68,68,0.3)', label: 'Critical', icon: 'alert-octagon' },
};

function RatingIcon({ icon, className }: { icon: string; className?: string }) {
  if (icon === 'check-circle') return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
  if (icon === 'trending-up') return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
    </svg>
  );
  if (icon === 'alert-triangle') return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
      <line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

export default function BacklogHealth() {
  const [health, setHealth] = useState<BacklogHealthType | null>(null);
  const [loading, setLoading] = useState(true);

  const mountedRef = useRef(true);

  useEffect(() => {
    (async () => {
      try {
        const result = await window.backly.getBacklogHealth();
        if (mountedRef.current) setHealth(result);
      } catch {}
      if (mountedRef.current) setLoading(false);
    })();
    return () => { mountedRef.current = false; };
  }, []);

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-4 bg-surface-700/50 rounded w-1/3 mb-3" />
        <div className="h-16 bg-surface-700/50 rounded-xl mb-3" />
        <div className="h-3 bg-surface-700/30 rounded w-2/3" />
      </div>
    );
  }

  if (!health) return null;

  const cfg = RATING_CONFIG[health.rating];

  return (
    <div className="card group hover:border-gold-500/10 transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-[11px] md:text-sm font-semibold text-white">Backlog Health</h3>
          <p className="text-[9px] md:text-xs text-gray-500 mt-0.5">Overall backlog status</p>
        </div>
        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r ${cfg.color} bg-opacity-10 text-black text-[10px] md:text-xs font-bold`}>
          <RatingIcon icon={cfg.icon} className="w-3.5 h-3.5" />
          {cfg.label}
        </div>
      </div>

      <div className="relative mb-3">
        <div className="w-full h-3 bg-surface-800/60 rounded-full overflow-hidden border border-white/[0.03]">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${cfg.color} transition-all duration-1000 ease-out shadow-[0_0_12px_var(--glow)]`}
            style={{ width: `${health.score}%`, '--glow': cfg.glow } as React.CSSProperties}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center p-2 rounded-lg bg-surface-800/40 border border-white/[0.03]">
          <p className="text-[10px] md:text-xs font-bold text-white">{health.completedGames}</p>
          <p className="text-[7px] md:text-[9px] text-gray-500 mt-0.5">Completed</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-surface-800/40 border border-white/[0.03]">
          <p className="text-[10px] md:text-xs font-bold text-white">{health.unplayedGames}</p>
          <p className="text-[7px] md:text-[9px] text-gray-500 mt-0.5">Unplayed</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-surface-800/40 border border-white/[0.03]">
          <p className="text-[10px] md:text-xs font-bold text-white">{health.abandonedGames}</p>
          <p className="text-[7px] md:text-[9px] text-gray-500 mt-0.5">Abandoned</p>
        </div>
      </div>

      <p className="text-[10px] md:text-xs text-gray-400 leading-relaxed">{health.tip}</p>
    </div>
  );
}
