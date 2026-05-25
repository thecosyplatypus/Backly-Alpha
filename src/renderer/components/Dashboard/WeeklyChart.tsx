import React from 'react';

const weeklyData = [
  { day: 'Mon', hours: 3.5 },
  { day: 'Tue', hours: 5.2 },
  { day: 'Wed', hours: 2.1 },
  { day: 'Thu', hours: 7.8 },
  { day: 'Fri', hours: 4.5 },
  { day: 'Sat', hours: 9.3 },
  { day: 'Sun', hours: 6.7 },
];

export default function WeeklyChart() {
  const maxHours = Math.max(...weeklyData.map((d) => d.hours));
  const totalHours = weeklyData.reduce((sum, d) => sum + d.hours, 0);

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

      <div className="flex items-end gap-1 md:gap-2 h-20 md:h-28">
        {weeklyData.map((item, i) => {
          const heightPercent = (item.hours / maxHours) * 100;
          return (
            <div key={item.day} className="flex-1 flex flex-col items-center gap-1 md:gap-1.5 group">
              <span className="text-[8px] md:text-[10px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                {item.hours.toFixed(1)}h
              </span>
              <div className="w-full relative flex items-end justify-center" style={{ height: '100%' }}>
                <div
                  className="w-full max-w-[20px] md:max-w-[28px] rounded-lg bg-gradient-to-t from-gold-600 to-gold-400 hover:from-gold-500 hover:to-yellow-300 transition-all duration-300 cursor-pointer group-hover:shadow-[0_0_12px_rgba(234,179,8,0.3)]"
                  style={{
                    height: `${heightPercent}%`,
                    animation: `barRise 0.8s ease-out ${i * 0.1}s forwards`,
                    transformOrigin: 'bottom',
                  }}
                />
              </div>
              <span className="text-[8px] md:text-[10px] text-gray-500 font-medium mt-0.5 md:mt-1">{item.day}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-white/[0.04]">
        <div className="grid grid-cols-2 gap-2 md:gap-4">
          <div>
            <p className="text-[8px] md:text-[10px] text-gray-500 uppercase tracking-wider">Games Played</p>
            <p className="text-[11px] md:text-sm font-semibold text-white mt-0.5">8 games</p>
          </div>
          <div>
            <p className="text-[8px] md:text-[10px] text-gray-500 uppercase tracking-wider">Completion</p>
            <p className="text-[11px] md:text-sm font-semibold text-gold-400 mt-0.5">+12% this week</p>
          </div>
        </div>
      </div>
    </div>
  );
}
