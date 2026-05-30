import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CATEGORY_ICONS: Record<string, React.FC<{ className?: string }>> = {
  clock: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  zap: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  calendar: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  coffee: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M18 8h1a4 4 0 010 8h-1" /><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" />
    </svg>
  ),
};

export default function ShortSessionGames() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const result = await window.backly.getShortSessionGames();
        setCategories(result);
      } catch {
        // ignore
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-4 bg-surface-700/50 rounded w-1/3 mb-3" />
        <div className="flex gap-2">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-surface-700/50 rounded-xl flex-1" />)}
        </div>
      </div>
    );
  }

  if (categories.length === 0) return null;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-[11px] md:text-sm font-semibold text-white">Quick Picks</h3>
          <p className="text-[9px] md:text-xs text-gray-500 mt-0.5">Curated for your session length</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {categories.slice(0, 4).map((cat) => {
          const Icon = CATEGORY_ICONS[cat.icon] || CATEGORY_ICONS.clock;
          return (
            <div key={cat.id} className="group p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.03] hover:border-gold-500/10 transition-all duration-300 cursor-default">
              <div className="w-7 h-7 rounded-lg bg-gold-500/10 text-gold-400 flex items-center justify-center mb-2 group-hover:bg-gold-500/20 transition-all">
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-[10px] font-semibold text-white group-hover:text-gold-400 transition-colors">{cat.title}</p>
              <p className="text-[8px] text-gray-500 mt-0.5">{cat.description}</p>
              <p className="text-[9px] text-gold-400/70 font-medium mt-1.5">{cat.games.length} games</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
