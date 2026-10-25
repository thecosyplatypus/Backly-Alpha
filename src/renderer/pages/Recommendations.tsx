import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { useResponsive } from '../hooks/useResponsive';

export default function Recommendations() {
  const navigate = useNavigate();
  const recommendations = useGameStore(s => s.recommendations);
  const fetchRecommendations = useGameStore(s => s.fetchRecommendations);
  const resp = useResponsive();
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchRecommendations(activeTab === 'all' ? undefined : activeTab);
  }, [activeTab]);

  const tabs = [
    { value: 'all', label: 'For You' },
    { value: 'short', label: 'Under 10h' },
    { value: 'close', label: 'Almost Done' },
    { value: 'best', label: 'Best Rated' },
    { value: 'random', label: 'Surprise' },
  ];

  const hero = recommendations[0];
  const rest = recommendations.slice(1);

  const gridStyle = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fill, minmax(${resp.cardWidth}px, 1fr))`,
    gap: `${resp.contentPadding / 2}px`,
  }), [resp.cardWidth, resp.contentPadding]);

  return (
    <div className="content-area space-y-4 md:space-y-6 resize-transition">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-fluid-lg md:text-2xl font-bold text-gradient">For You</h1>
          <p className="text-[11px] md:text-sm text-gray-500 mt-0.5">Personalized picks based on your library</p>
        </div>
        <button onClick={() => fetchRecommendations('random')} className="btn-primary text-[10px] md:text-sm px-3 md:px-5 py-2 md:py-2.5 shrink-0">
          🎲 Surprise
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 md:gap-2 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg text-[10px] md:text-sm font-medium transition-all ${
              activeTab === tab.value
                ? 'bg-backly-600/20 text-backly-400 neon-border'
                : 'bg-surface-800 text-gray-400 hover:bg-surface-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {recommendations.length === 0 ? (
        <div className="text-center py-12 md:py-20">
          <p className="text-2xl md:text-4xl mb-3 md:mb-4">🎯</p>
          <p className="text-sm md:text-base text-gray-500">No recommendations yet</p>
          <p className="text-[11px] md:text-sm text-gray-600 mt-1.5 md:mt-2">
            Add more games to your library for personalized recommendations
          </p>
        </div>
      ) : (
        <>
          {/* Hero pick */}
          {hero && (
            <div
              className="card relative overflow-hidden cursor-pointer group"
              onClick={() => navigate(`/game/${hero.game.id}`)}
            >
              <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                <img
                  src={hero.game.coverArt || `https://ui-avatars.com/api/?name=${encodeURIComponent(hero.game.title)}&background=6366f1&color=fff&size=256`}
                  alt={hero.game.title}
                  className="w-full md:w-48 h-40 md:h-64 rounded-xl object-cover shrink-0"
                  loading="lazy"
                />
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <span className="text-[9px] md:text-[10px] uppercase tracking-widest text-gold-400 font-bold mb-1">Top Pick for You</span>
                  <h2 className="text-fluid-xl md:text-3xl font-black text-white mb-1">{hero.game.title}</h2>
                  <p className="text-[11px] md:text-sm text-gray-400 mb-3">{hero.game.genre || '—'}{hero.game.platform ? ` · ${hero.game.platform}` : ''}</p>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gold-500/10 border border-gold-500/20 text-gold-400 text-[11px] md:text-sm font-medium w-fit" title="Why this?">
                    {hero.reason}
                  </div>
                  {hero.game.hoursPlayed > 0 && (
                    <p className="text-[10px] md:text-xs text-gray-500 mt-3">{Math.round(hero.game.hoursPlayed)}h played so far</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* More picks */}
          {rest.length > 0 && (
            <div>
              <h2 className="text-[11px] md:text-sm font-semibold text-white mb-3">More recommendations</h2>
              <div className="game-grid" style={gridStyle}>
                {rest.map((rec: any) => (
                  <div
                    key={rec.game.id}
                    className="card flex items-start gap-3 md:gap-4 cursor-pointer hover:neon-border transition-all"
                    onClick={() => navigate(`/game/${rec.game.id}`)}
                  >
                    <img
                      src={rec.game.coverArt || `https://ui-avatars.com/api/?name=${encodeURIComponent(rec.game.title)}&background=6366f1&color=fff&size=96`}
                      alt={rec.game.title}
                      className="w-10 md:w-16 h-14 md:h-20 rounded-lg object-cover shrink-0"
                      loading="lazy"
                      onError={(e) => { if (!e.currentTarget.src.includes('ui-avatars')) e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(rec.game.title)}&background=6366f1&color=fff&size=96`; }}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[11px] md:text-sm font-semibold text-white truncate">{rec.game.title}</h3>
                      <p className="text-[9px] md:text-xs text-gray-500 mt-0.5">{rec.game.genre || '—'}</p>
                      <p className="text-[10px] md:text-xs text-backly-400 mt-1.5 md:mt-2" title="Why this?">{rec.reason}</p>
                      {rec.game.hoursPlayed > 0 && (
                        <span className="text-[9px] md:text-xs text-gray-500 mt-1 block">{(Math.round(rec.game.hoursPlayed * 10) / 10)}h played</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}