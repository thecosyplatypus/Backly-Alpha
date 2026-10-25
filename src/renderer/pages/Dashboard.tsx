import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import SearchBar from '../components/Dashboard/SearchBar';
import HeroPanel from '../components/Dashboard/HeroPanel';
import WeeklyChart from '../components/Dashboard/WeeklyChart';
import AchievementsPanel from '../components/Dashboard/AchievementsPanel';
import BacklogHealth from '../components/Dashboard/BacklogHealth';
import ShortSessionGames from '../components/Dashboard/ShortSessionGames';
import InsightCard from '../components/Dashboard/InsightCard';
import SteamSyncCard from '../components/ui/SteamSyncCard';

export default function Dashboard() {
  const navigate = useNavigate();
  const [xp, setXp] = useState(0);
  const stats = useGameStore(s => s.stats);
  const games = useGameStore(s => s.games);
  const insights = useGameStore(s => s.insights);
  const fetchGames = useGameStore(s => s.fetchGames);
  const fetchStats = useGameStore(s => s.fetchStats);

  useEffect(() => {
    fetchGames({ limit: 100, sort: 'lastPlayed' });
    fetchStats().then(() => {
      const st = useGameStore.getState().stats;
      if (st) {
        const xp = (st.completedGames || 0) * 100 + (st.unlockedAchievements || 0) * 10;
        setXp(xp);
        window.backly.updateSettings({ xp }).catch(() => {});
      }
    });
    window.backly.getSettings().then((s: any) => setXp(s?.xp || 0)).catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (e.key === '/' && !isInput) {
        e.preventDefault();
        document.getElementById('global-search')?.focus();
      } else if ((e.key === 's' || e.key === 'S') && !isInput && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        navigate('/spin-wheel');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);

  const recentlyPlayed = useMemo(
    () => games
      .filter(g => g.hoursPlayed > 0)
      .sort((a, b) => {
        const aTime = a.lastPlayed ? new Date(a.lastPlayed).getTime() : (a.updatedAt ? new Date(a.updatedAt).getTime() : 0);
        const bTime = b.lastPlayed ? new Date(b.lastPlayed).getTime() : (b.updatedAt ? new Date(b.updatedAt).getTime() : 0);
        return bTime - aTime;
      })
      .slice(0, 10),
    [games]
  );

  const statItems = useMemo(() => stats ? [
    { title: 'Total Games', value: stats.totalGames, pct: 100 },
    { title: 'Completed', value: stats.completedGames, pct: stats.completionPercent },
    { title: 'Backlog', value: stats.backlogCount, sub: `~${Math.round(stats.totalBacklogEstimate / 60)}h to beat` },
    { title: 'Hours Played', value: Math.round(stats.totalHoursPlayed), sub: 'all time' },
  ] : [], [stats]);

  return (
    <div className="min-h-screen bg-surface-950">
      {/* Top bar */}
      <div className="sticky top-0 z-50 bg-surface-950/80 backdrop-blur-sm border-b border-white/[0.03]">
        <div className="flex items-center justify-between px-4 md:px-6 py-3 resize-transition">
          <SearchBar />
          <div className="flex items-center gap-3">
            <span className="text-[10px] md:text-xs text-gray-500 whitespace-nowrap">
              {stats ? `${stats.totalGames} games · ${Math.round(stats.totalHoursPlayed)}h` : ''}
            </span>
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-xl bg-gradient-to-br from-gold-500/30 to-yellow-500/20 flex items-center justify-center text-[10px] md:text-xs font-bold text-gold-400 border border-gold-500/10" title={`Level ${Math.floor(xp / 500) + 1} · ${xp} XP`}>
              Lv{Math.floor(xp / 500) + 1}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="content-area space-y-4 md:space-y-5 resize-transition">
        {/* Welcome row */}
        <div>
          <h1 className="text-fluid-lg font-bold text-gradient-gold">Dashboard</h1>
          <p className="text-fluid-xs text-gray-500 mt-0.5">Welcome back, Commander</p>
        </div>

        {/* Hero + Weekly Chart */}
        <div className="dashboard-grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-5 resize-transition">
          <div className="xl:col-span-2">
            <HeroPanel game={recentlyPlayed[0]} />
          </div>
          <div>
            <WeeklyChart />
          </div>
        </div>

        {/* Quick Stats */}
        {stats && (
          <div className="stats-row resize-transition">
            {statItems.map((item) => (
              <div key={item.title} className="card">
                <p className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-wider">{item.title}</p>
                <p className="text-fluid-xl font-black text-white mt-1">{item.value}</p>
                {item.pct !== undefined && (
                  <div className="mt-2 w-full h-1 bg-surface-700/50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-gold-500 to-yellow-400 transition-all duration-1000 ease-out"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                )}
                {item.sub && (
                  <p className="text-[9px] text-gray-600 mt-1">{item.sub}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Steam Sync */}
        <SteamSyncCard />

        {/* Backlog Health */}
        <BacklogHealth />

        {/* Short Session + Recommendations */}
        <ShortSessionGames />

        {/* Backlog Insights */}
        {insights.length > 0 && (
          <div className="space-y-3 md:space-y-4">
            <div>
              <h2 className="text-fluid-sm md:text-base font-bold text-white">Insights</h2>
              <p className="text-[10px] md:text-xs text-gray-500 mt-0.5">Smart observations about your backlog</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4 resize-transition">
              {insights.slice(0, 6).map((insight: any, i: number) => (
                <InsightCard key={i} insight={insight} />
              ))}
            </div>
          </div>
        )}

        {/* Achievements */}
        <AchievementsPanel />

        <div className="h-4" />
      </div>
    </div>
  );
}
