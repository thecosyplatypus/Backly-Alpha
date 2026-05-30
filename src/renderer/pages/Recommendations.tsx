import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { useResponsive } from '../hooks/useResponsive';

export default function Recommendations() {
  const navigate = useNavigate();
  const { recommendations, fetchRecommendations } = useGameStore();
  const resp = useResponsive();
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchRecommendations(activeTab === 'all' ? undefined : activeTab);
  }, [activeTab]);

  const tabs = [
    { value: 'all', label: 'All' },
    { value: 'short', label: 'Under 10h' },
    { value: 'close', label: 'Almost Done' },
    { value: 'best', label: 'Best Rated' },
    { value: 'random', label: 'Surprise' },
  ];

  const gridStyle = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fill, minmax(${resp.cardWidth}px, 1fr))`,
    gap: `${resp.contentPadding / 2}px`,
  }), [resp.cardWidth, resp.contentPadding]);

  return (
    <div className="content-area space-y-4 md:space-y-6 resize-transition">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-fluid-lg md:text-2xl font-bold text-gradient">Recommendations</h1>
          <p className="text-[11px] md:text-sm text-gray-500 mt-0.5">What should you play next?</p>
        </div>
        <button onClick={() => fetchRecommendations('random')} className="btn-primary text-[10px] md:text-sm px-3 md:px-5 py-2 md:py-2.5 shrink-0">
          🎲 Pick
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

      {/* Recommendations */}
      {recommendations.length === 0 ? (
        <div className="text-center py-12 md:py-20">
          <p className="text-2xl md:text-4xl mb-3 md:mb-4">🎯</p>
          <p className="text-sm md:text-base text-gray-500">No recommendations yet</p>
          <p className="text-[11px] md:text-sm text-gray-600 mt-1.5 md:mt-2">
            Add more games to your library for personalized recommendations
          </p>
        </div>
      ) : (
        <div className="game-grid" style={gridStyle}>
          {recommendations.map((rec: any) => (
            <div
              key={rec.game.id}
              className="card flex items-start gap-3 md:gap-4"
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
                <p className="text-[10px] md:text-xs text-backly-400 mt-1.5 md:mt-2">{rec.reason}</p>
                <div className="flex items-center gap-1.5 md:gap-2 mt-1.5 md:mt-2">
                  {rec.game.hoursPlayed > 0 && (
                    <span className="text-[9px] md:text-xs text-gray-500">{Math.round(rec.game.hoursPlayed)}h played</span>
                  )}
                </div>
                <button
                  onClick={() => navigate(`/game/${rec.game.id}`)}
                  className="text-[10px] md:text-xs text-backly-400 hover:text-backly-300 mt-1.5 md:mt-2 inline-block"
                >
                  View Details →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tips */}
      <div className="card mt-4 md:mt-6">
        <h2 className="text-[11px] md:text-sm font-semibold text-white mb-3 md:mb-4">Smart Tips</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 resize-transition">
          {[
            { title: 'Quick Wins', desc: 'Games under 5h', icon: '⚡' },
            { title: 'Almost There', desc: "90%+ complete", icon: '🎯' },
            { title: 'Hidden Gems', desc: 'Highly rated, unplayed', icon: '💎' },
            { title: 'Clean Up', desc: 'Untouched for a year', icon: '🧹' },
          ].map((tip, i) => (
            <div key={i} className="bg-surface-800/50 rounded-lg p-2.5 md:p-3">
              <span className="text-lg md:text-xl">{tip.icon}</span>
              <h3 className="text-[11px] md:text-sm font-medium text-white mt-1.5 md:mt-2">{tip.title}</h3>
              <p className="text-[9px] md:text-xs text-gray-500 mt-0.5 md:mt-1">{tip.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
