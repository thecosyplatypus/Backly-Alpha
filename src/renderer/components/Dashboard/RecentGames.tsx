import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SteamImage from '../ui/SteamImage';

interface Props {
  games: any[];
}

export default function RecentGames({ games }: Props) {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' });
    }
  };

  if (!games || games.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-fluid-sm font-semibold text-white">Recent Games</h2>
          <p className="text-[10px] md:text-[11px] text-gray-500 mt-0.5">Continue where you left off</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            className="p-1.5 rounded-lg bg-surface-800/50 hover:bg-surface-700/50 text-gray-400 hover:text-white transition-all"
          >
            <svg className="w-3.5 md:w-4 h-3.5 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-1.5 rounded-lg bg-surface-800/50 hover:bg-surface-700/50 text-gray-400 hover:text-white transition-all"
          >
            <svg className="w-3.5 md:w-4 h-3.5 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="game-row-scroll pb-2">
        {games.map((game: any) => {
          const coverArt = game.coverArt || `https://ui-avatars.com/api/?name=${encodeURIComponent(game.title)}&background=1a1f2e&color=eab308&size=256`;
          return (
            <button
              key={game.id}
              onClick={() => navigate(`/game/${game.id}`)}
              className="group flex-shrink-0 w-[130px] md:w-[160px] overflow-hidden rounded-xl md:rounded-2xl bg-surface-800/40 border border-white/[0.04] hover:border-gold-500/20 transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(234,179,8,0.1)]"
            >
              <div className="aspect-[16/10] overflow-hidden">
                <SteamImage
                  src={coverArt}
                  alt={game.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 gpu"
                />
              </div>
              <div className="p-2 md:p-3">
                <p className="text-[10px] md:text-xs font-semibold text-white truncate group-hover:text-gold-400 transition-colors">
                  {game.title}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[8px] md:text-[10px] text-gray-500">{Math.round(game.hoursPlayed || 0)}h played</span>
                  <span className="text-[8px] md:text-[9px] text-gold-400/60 group-hover:text-gold-400 transition-colors">→</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
