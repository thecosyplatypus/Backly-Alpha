import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const statusColors: Record<string, string> = {
  PLAYING: 'text-neon-green',
  STARTED: 'text-sky-400',
  PAUSED: 'text-yellow-400',
};

export default function CloseToCompletion() {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const result = await window.backly.getCloseToCompletion();
        setItems(result);
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
        <div className="space-y-2">
          {[1, 2].map(i => <div key={i} className="h-12 bg-surface-700/50 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-[11px] md:text-sm font-semibold text-white">Almost Finished</h3>
          <p className="text-[9px] md:text-xs text-gray-500 mt-0.5">You're close to completing these</p>
        </div>
        <button className="text-[9px] md:text-[11px] text-gold-400 hover:text-gold-300 transition-colors font-medium">View All</button>
      </div>

      <div className="space-y-1.5">
        {items.map((item) => (
          <div
            key={item.game.id}
            onClick={() => navigate(`/game/${item.game.id}`)}
            className="group flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.03] hover:border-gold-500/10 cursor-pointer transition-all duration-300"
          >
            <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-gold-500/20 to-yellow-500/10 flex items-center justify-center text-xs font-bold text-gold-400 border border-gold-500/10 group-hover:border-gold-500/20 transition-all">
              {item.game.title[0]}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-[11px] font-semibold text-white group-hover:text-gold-400 transition-colors truncate">{item.game.title}</p>
                {item.game.status && (
                  <span className={`text-[8px] font-medium ${statusColors[item.game.status] || 'text-gray-500'}`}>
                    {item.game.status}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1 bg-surface-700/50 rounded-full overflow-hidden max-w-[80px]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-gold-500 to-yellow-400 transition-all duration-1000 ease-out"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
                <span className="text-[9px] text-gold-400/70 font-medium">{item.progress}%</span>
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <p className="text-[10px] font-bold text-white">~{item.estimatedRemaining}h</p>
              <p className="text-[8px] text-gray-600">remaining</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
