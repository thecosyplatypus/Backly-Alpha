import { useEffect, useRef, useState } from 'react';

const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function WeeklyChart() {
  const [data, setData] = useState<{
    totalHours: number;
    gamesPlayed: number;
    completionPercentage: number;
    dailyHours: Record<string, { hours: number; games: number }>;
  } | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    window.backly.getWeeklyActivity().then((d) => { if (mountedRef.current) setData(d); });
    return () => { mountedRef.current = false; };
  }, []);

  if (!data) {
    return (
      <div className="card animate-pulse">
        <div className="h-4 w-32 bg-surface-700 rounded mb-4" />
        <div className="flex gap-2 h-28">
          {dayNames.map(d => <div key={d} className="flex-1 bg-surface-700 rounded-lg" />)}
        </div>
      </div>
    );
  }

  const maxHours = Math.max(
    ...dayNames.map(d => data.dailyHours[d]?.hours || 0),
    0.1
  );
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

      <div className="flex items-stretch gap-1 md:gap-2 h-20 md:h-28">
        {dayNames.map((day, i) => {
          const dayData = data.dailyHours[day] || { hours: 0, games: 0 };
          const heightPercent = (dayData.hours / maxHours) * 100;
          return (
            <div key={day} className="flex-1 flex flex-col items-center gap-1 md:gap-1.5 group">
              <span className="text-[8px] md:text-[10px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                {dayData.hours.toFixed(1)}h
              </span>
              <div className="flex-1 w-full relative flex items-end justify-center">
                <div
                  className="w-full max-w-[20px] md:max-w-[28px] rounded-lg bg-gradient-to-t from-[#F59E0B] to-[#FB923C] hover:from-[#F59E0B] hover:to-[#FB923C] transition-all duration-300 cursor-pointer group-hover:shadow-[0_0_12px_rgba(234,179,8,0.3)]"
                  style={{
                    height: `${heightPercent}%`,
                    animation: `barRise 0.8s ease-out ${i * 0.1}s forwards`,
                    transformOrigin: 'bottom',
                  }}
                />
              </div>
              <span className="text-[8px] md:text-[10px] text-gray-500 font-medium mt-0.5 md:mt-1">{day}</span>
            </div>
          );
        })}
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
