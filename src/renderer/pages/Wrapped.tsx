import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function StatCard({ label, value, icon, color }: { label: string; value: string | number | React.ReactNode; icon: string; color?: string }) {
  return (
    <div className="glass-strong rounded-2xl p-4 md:p-6 border border-white/[0.05] hover:border-gold-500/20 transition-all duration-300 group">
      <div className="flex items-center justify-between mb-2 md:mb-3">
        <span className="text-lg md:text-2xl">{icon}</span>
        <div className={`w-8 h-8 rounded-full ${color || 'bg-gold-500/10'} flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity`}>
          <div className={`w-2 h-2 rounded-full ${color?.replace('bg-', 'bg-') || 'bg-gold-400'}`} />
        </div>
      </div>
      <p className="text-fluid-xl md:text-3xl font-black text-white">{value}</p>
      <p className="text-[10px] md:text-xs text-gray-500 mt-1 uppercase tracking-wider">{label}</p>
    </div>
  );
}

function HeatmapCell({ count, max }: { count: number; max: number }) {
  const intensity = max > 0 ? count / max : 0;
  return (
    <div
      className="rounded-sm transition-all duration-300 hover:scale-125"
      style={{
        width: '100%',
        aspectRatio: '1',
        background: intensity > 0
          ? `rgba(255, 215, 0, ${0.1 + intensity * 0.7})`
          : 'rgba(255,255,255,0.03)',
        boxShadow: intensity > 0.5 ? `0 0 ${intensity * 12}px rgba(255, 215, 0, ${intensity * 0.3})` : 'none',
      }}
      title={`${count} sessions`}
    />
  );
}

function ProgressBar({ pct, color = 'from-gold-600 to-gold-400' }: { pct: number; color?: string }) {
  return (
    <div className="w-full h-1.5 md:h-2 rounded-full bg-surface-700/50 overflow-hidden">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-1000 ease-out`}
        style={{ width: `${Math.min(100, pct)}%` }}
      />
    </div>
  );
}

function AnimatedNumber({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.max(1, Math.ceil(value / 60));
    const interval = setInterval(() => {
      start += step;
      if (start >= value) {
        setDisplay(value);
        clearInterval(interval);
      } else {
        setDisplay(start);
      }
    }, duration / 60);
    return () => clearInterval(interval);
  }, [value, duration]);
  return <>{display.toLocaleString()}</>;
}

export default function Wrapped() {
  const navigate = useNavigate();
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    setLoading(true);
    window.backly.getWrappedData(year).then((d) => {
      setData(d);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [year]);

  const totalSlides = 5;

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  if (loading) {
    return (
      <div className="content-area flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">Crunching your gaming data...</p>
        </div>
      </div>
    );
  }

  if (!data || data.totalGames === 0) {
    return (
      <div className="content-area flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">📊</div>
          <h2 className="text-lg font-bold text-white mb-2">No Data Yet</h2>
          <p className="text-sm text-gray-500 mb-4">Add games and track your playtime to see your yearly wrapped summary.</p>
          <button onClick={() => navigate('/library')} className="btn-primary text-sm px-5 py-2.5">
            Go to Library
          </button>
        </div>
      </div>
    );
  }

  const slides = [
    {
      title: `${data.year} in Review`,
      subtitle: 'Your gaming year wrapped',
      content: (
        <div className="text-center py-8 md:py-12">
          <div className="relative inline-block mb-6">
            <div className="text-7xl md:text-9xl font-black text-gradient-gold">Backly</div>
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-gold-500/20 rounded-full blur-xl animate-pulse" />
          </div>
          <p className="text-fluid-lg md:text-2xl text-gray-300 font-light">Wrapped {data.year}</p>
          <div className="mt-8 max-w-xs mx-auto h-px bg-gradient-to-r from-transparent via-gold-500/50 to-transparent" />
          <p className="text-sm text-gray-500 mt-4">Your personal gaming retrospective</p>
        </div>
      ),
    },
    {
      title: 'Overview',
      subtitle: 'The big numbers',
      content: (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 resize-transition">
          <StatCard label="Total Games" value={<AnimatedNumber value={data.totalGames} />} icon="🎮" color="bg-neon-blue/10" />
          <StatCard label="Hours Played" value={<AnimatedNumber value={data.totalHours} />} icon="⏱" color="bg-gold-500/10" />
          <StatCard label="Completed" value={<AnimatedNumber value={data.completedThisYear} />} icon="✅" color="bg-neon-green/10" />
          <StatCard label="Backlog" value={<AnimatedNumber value={data.totalBacklog} />} icon="📚" color="bg-neon-cyan/10" />
        </div>
      ),
    },
    {
      title: 'Top Games',
      subtitle: 'Most played this year',
      content: (
        <div className="space-y-2 md:space-y-3">
          {data.topGames.slice(0, 5).map((game: any, i: number) => (
            <div
              key={game.id}
              className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl glass-strong border border-white/[0.05] hover:border-gold-500/20 transition-all cursor-pointer group"
              onClick={() => navigate(`/game/${game.id}`)}
            >
              <span className="text-lg md:text-2xl font-black text-gold-500 w-8 md:w-10 text-center shrink-0">#{i + 1}</span>
              <img
                src={game.coverArt || `https://ui-avatars.com/api/?name=${encodeURIComponent(game.title)}&background=1a1f2e&color=facc15&size=64`}
                alt={game.title}
                className="w-10 md:w-14 h-14 md:h-20 rounded-lg object-cover shrink-0"
                loading="lazy"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm md:text-base font-semibold text-white truncate group-hover:text-gold-400 transition-colors">{game.title}</p>
                <p className="text-[10px] md:text-xs text-gray-500 mt-0.5">{game.genre || '—'}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] md:text-xs text-gold-400 font-medium">{game.hoursPlayed}h played</span>
                  {game.status === 'COMPLETED' && <span className="badge bg-neon-green/10 text-neon-green text-[9px]">Completed</span>}
                </div>
              </div>
              <ProgressBar pct={Math.min(100, (game.hoursPlayed / (data.topGames[0]?.hoursPlayed || 1)) * 100)} />
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Genre Breakdown',
      subtitle: 'Where your time went',
      content: (
        <div className="space-y-3 md:space-y-4">
          {data.topGenres.map((g: any, i: number) => {
              const maxHours = (data.topGenres[0]?.hours ?? 1) as number;
            const colors = ['from-gold-600 to-yellow-400', 'from-neon-purple to-purple-400', 'from-neon-blue to-cyan-400', 'from-neon-green to-emerald-400', 'from-neon-pink to-rose-400'];
            return (
              <div key={g.genre} className="space-y-1.5 md:space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${colors[i]} ${i === 0 ? 'neon-glow' : ''}`} />
                    <span className="text-xs md:text-sm font-medium text-gray-300">{g.genre}</span>
                  </div>
                  <span className="text-xs md:text-sm text-gray-500">{g.hours}h</span>
                </div>
                <div className="w-full h-2 md:h-3 rounded-full bg-surface-700/50 overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${colors[i]} transition-all duration-1000 ease-out`}
                    style={{ width: `${(g.hours / maxHours) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
          {data.topGenres.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-8">No genre data available</p>
          )}
        </div>
      ),
    },
    {
      title: 'Monthly Activity',
      subtitle: `Your biggest month was ${data.biggestMonth.name}`,
      content: (
        <div className="space-y-4 md:space-y-6">
          <div className="grid grid-cols-12 gap-1 md:gap-1.5">
            {Object.entries(data.monthlyActivity).map(([month, count]: [string, any]) => (
              <div key={month} className="flex flex-col items-center gap-1" title={`${MONTHS[parseInt(month) - 1]}: ${count} sessions`}>
                <div className="w-full" style={{ aspectRatio: '1' }}>
                  <HeatmapCell count={count as number} max={Math.max(...Object.values(data.monthlyActivity as Record<string, number>), 1)} />
                </div>
                <span className="text-[7px] md:text-[9px] text-gray-600">{MONTHS[parseInt(month) - 1].slice(0, 3)}</span>
              </div>
            ))}
          </div>
          <div className="glass-strong rounded-xl p-3 md:p-4 border border-white/[0.05]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-500">Most Active Month</p>
                <p className="text-sm md:text-lg font-bold text-white mt-0.5">{data.biggestMonth.name}</p>
              </div>
              <div className="text-right">
                <p className="text-lg md:text-2xl font-black text-gold-400">{data.biggestMonth.count}</p>
                <p className="text-[9px] md:text-xs text-gray-600">sessions</p>
              </div>
            </div>
          </div>
          <div className="glass-strong rounded-xl p-3 md:p-4 border border-white/[0.05]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-500">Achievement Progress</p>
                <p className="text-sm md:text-lg font-bold text-white mt-0.5">
                  {data.completionStats.unlockedAchievements} / {data.completionStats.totalAchievements}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg md:text-2xl font-black text-gold-400">
                  {data.completionStats.totalAchievements > 0
                    ? Math.round((data.completionStats.unlockedAchievements / data.completionStats.totalAchievements) * 100)
                    : 0}%
                </p>
                <p className="text-[9px] md:text-xs text-gray-600">unlocked</p>
              </div>
            </div>
            <ProgressBar
              pct={data.completionStats.totalAchievements > 0
                ? (data.completionStats.unlockedAchievements / data.completionStats.totalAchievements) * 100
                : 0}
              color="from-neon-purple to-purple-400"
            />
          </div>
        </div>
      ),
    },
  ];

  const slide = slides[activeSlide];

  return (
    <div className="content-area min-h-full pb-8 resize-transition">
      <div className="max-w-3xl mx-auto space-y-4 md:space-y-6 resize-transition">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-fluid-lg md:text-2xl font-bold text-gradient-gold">Backly Wrapped</h1>
            <p className="text-[10px] md:text-xs text-gray-500 mt-0.5">Your gaming year in review</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={year}
              onChange={(e) => { setYear(parseInt(e.target.value)); setActiveSlide(0); }}
              className="input text-[11px] md:text-sm py-1.5 md:py-2 pr-6 md:pr-8"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Slide Navigation */}
        <div className="flex gap-1.5 md:gap-2 flex-wrap">
          {slides.map((s, i) => (
            <button
              key={i}
              onClick={() => setActiveSlide(i)}
              className={`px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-medium transition-all ${
                activeSlide === i
                  ? 'bg-gold-500/20 text-gold-400 neon-border'
                  : 'bg-surface-800 text-gray-400 hover:bg-surface-700'
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>

        {/* Slide Content */}
        <div
          key={activeSlide}
          className="glass-strong rounded-2xl p-4 md:p-6 lg:p-8 border border-white/[0.05] animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          <div className="mb-4 md:mb-6">
            <h2 className="text-fluid-lg md:text-xl font-bold text-white">{slide.title}</h2>
            {slide.subtitle && (
              <p className="text-[11px] md:text-sm text-gray-500 mt-1">{slide.subtitle}</p>
            )}
          </div>
          {slide.content}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setActiveSlide(Math.max(0, activeSlide - 1))}
            disabled={activeSlide === 0}
            className="px-4 md:px-6 py-2 md:py-2.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-gray-300 hover:text-white text-[11px] md:text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          <div className="flex items-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveSlide(i)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === activeSlide ? 'bg-gold-400 w-4 md:w-6' : 'bg-surface-600 hover:bg-surface-500'
                }`}
              />
            ))}
          </div>
          <button
            onClick={() => setActiveSlide(Math.min(totalSlides - 1, activeSlide + 1))}
            disabled={activeSlide >= totalSlides - 1}
            className="px-4 md:px-6 py-2 md:py-2.5 rounded-xl bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-black font-semibold text-[11px] md:text-sm transition-all active:scale-[0.97] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {activeSlide >= totalSlides - 1 ? 'Complete ✓' : 'Next →'}
          </button>
        </div>

        {activeSlide >= totalSlides - 1 && (
          <div className="text-center py-4 md:py-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 rounded-xl bg-gold-500/10 border border-gold-500/20">
              <span className="text-lg">🎉</span>
              <span className="text-xs md:text-sm text-gold-400 font-medium">
                {data.totalGames} games · {data.totalHours} hours · {data.completedThisYear} completed
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
