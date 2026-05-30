import React from 'react';
import { useNavigate } from 'react-router-dom';

const recommendedGames = [
  { id: '1', title: "Baldur's Gate 3", genre: 'RPG', discount: 20, price: 47.99, originalPrice: 59.99, rating: 96, color: 'from-amber-800/40 to-yellow-900/20' },
  { id: '2', title: 'Cyberpunk 2077', genre: 'Action RPG', discount: 50, price: 29.99, originalPrice: 59.99, rating: 88, color: 'from-cyan-800/40 to-blue-900/20' },
  { id: '3', title: 'Hades II', genre: 'Roguelike', discount: null, price: 24.99, originalPrice: null, rating: 92, color: 'from-red-800/40 to-orange-900/20' },
];

export default function Recommendations() {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-fluid-sm font-semibold text-white">Recommended Games</h2>
          <p className="text-[10px] md:text-[11px] text-gray-500 mt-0.5">Based on your library</p>
        </div>
        <button
          onClick={() => navigate('/recommendations')}
          className="text-[10px] md:text-[11px] text-gold-400 hover:text-gold-300 transition-colors font-medium"
        >
          Explore All →
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3 resize-transition">
        {recommendedGames.map((game) => (
          <button
            key={game.id}
            className="group relative overflow-hidden rounded-xl md:rounded-2xl bg-surface-800/40 border border-white/[0.04] hover:border-gold-500/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(234,179,8,0.08)] text-left card-gpu"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-60 group-hover:opacity-80 transition-opacity duration-300`} />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </div>

            <div className="relative z-10 p-3 md:p-4">
              <div className="flex items-start justify-between mb-6 md:mb-8">
                {game.discount ? (
                  <span className="badge bg-gold-500/20 text-gold-400 border border-gold-500/20 text-[8px] md:text-[10px] font-bold">
                    -{game.discount}%
                  </span>
                ) : (
                  <span className="badge bg-surface-700/50 text-gray-500 text-[8px] md:text-[10px]">New</span>
                )}
                <span className="text-[8px] md:text-[10px] text-gray-500 font-medium bg-surface-900/50 px-1.5 md:px-2 py-0.5 rounded-lg shrink-0">
                  ★ {game.rating}
                </span>
              </div>

              <div>
                <p className="text-[8px] md:text-[10px] text-gray-500 uppercase tracking-wider mb-0.5 md:mb-1">{game.genre}</p>
                <h3 className="text-[11px] md:text-sm font-bold text-white group-hover:text-gold-400 transition-colors">{game.title}</h3>
                <div className="flex items-center gap-1.5 md:gap-2 mt-1 md:mt-1.5">
                  <span className="text-[11px] md:text-sm font-bold text-gold-400">${game.price.toFixed(2)}</span>
                  {game.originalPrice && (
                    <span className="text-[8px] md:text-[10px] text-gray-600 line-through">${game.originalPrice.toFixed(2)}</span>
                  )}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
