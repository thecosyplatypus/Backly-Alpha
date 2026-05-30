import React from 'react';
import { useNavigate } from 'react-router-dom';
import GameCard from '../GameCard/GameCard';

interface Props {
  insight: any;
}

export default function InsightCard({ insight }: Props) {
  const navigate = useNavigate();

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2 md:mb-3">
        <div className="min-w-0">
          <h3 className="text-[11px] md:text-sm font-semibold text-white truncate">{insight.title}</h3>
          <p className="text-[9px] md:text-xs text-gray-500 mt-0.5 truncate">{insight.description}</p>
        </div>
        <span className="badge bg-backly-600/20 text-backly-400 text-[9px] md:text-xs shrink-0">
          {insight.games?.length || 0} games
        </span>
      </div>
      <div className="game-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
        gap: '0.5rem',
      }}>
        {insight.games?.slice(0, 4).map((game: any) => (
          <GameCard key={game.id} game={game} onClick={() => navigate(`/game/${game.id}`)} compact />
        ))}
      </div>
    </div>
  );
}
