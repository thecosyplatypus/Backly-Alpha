import { useEffect, useState, useCallback } from 'react';

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function WeeklyChart() {
  const [data, setData] = useState<{
    totalHours: number;
    gamesPlayed: number;
    completionPercentage: number;
    dailyHours: Record<string, { hours: number; games: number }>;
  } | null>(null);
  const [error, setError] = useState(false);

  const fetch = useCallback(async () => {
    try {
      const d = await window.backly.getWeeklyActivity();
      setData(d);
      setError(false);
    } catch (e) {
      console.error('[WeeklyChart] fetch error:', e);
      setError(true);
    }
  }, []);

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 60000);
    const onFocus = () => fetch();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetch]);

  if (error) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-3 md:mb-5">
          <div>
            <h3 className="text-[11px] md:text-sm font-semibold text-white">Weekly Activity</h3>
            <p className="text-[9px] md:text-xs text-gray-500 mt-0.5">Last 2 weeks</p>
          </div>
          <button
            onClick={fetch}
            className="text-[10px] text-gray-400 hover:text-gold-400 transition-colors"
            title="Refresh from Steam"
          >
            ↻
          </button>
        </div>
        <p className="text-[10px] md:text-xs text-gray-500">No activity data available</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card animate-pulse">
        <div className="h-4 w-32 bg-surface-700/50 rounded mb-4" />
        <div className="flex gap-2 h-28">
          {dayNames.map(d => <div key={d} className="flex-1 bg-surface-700/50 rounded-lg" />)}
        </div>
      </div>
    );
  }

  const totalHours = data.totalHours;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3 md:mb-5">
        <div>
          <h3 className="text-[11px] md:text-sm font-semibold text-white">Weekly Activity</h3>
          <p className="text-[9px] md:text-xs text-gray-500 mt-0.5">Last 7 days</p>
        </div>
        <div className="text-right">
          <p className="text-sm md:text-lg font-bold text-gold-400">{totalHours.toFixed(1)}h</p>
          <p className="text-[8px] md:text-[10px] text-gray-500">total</p>
        </div>
      </div>

      <div className="text-center py-4">
        <p className="text-2xl md:text-3xl font-black text-gold-400">{totalHours.toFixed(1)}h</p>
        <p className="text-[10px] md:text-xs text-gray-500 mt-1">played in the last 2 weeks</p>
      </div>

      <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-white/[0.04]">
        <div className="grid grid-cols-2 gap-2 md:gap-4">
          <div>
            <p className="text-[8px] md:text-[10px] text-gray-500 uppercase tracking-wider">Games Played</p>
            <p className="text-[11px] md:text-sm font-semibold text-white mt-0.5">{data.gamesPlayed} games</p>
          </div>
          <div>
            <p className="text-[8px] md:text-[10px] text-gray-500 uppercase tracking-wider">Completion</p>
            <p className="text-[11px] md:text-sm font-semibold text-gold-400 mt-0.5">+{data.completionPercentage}% this week</p>
          </div>
        </div>
      </div>
    </div>
  );
}
