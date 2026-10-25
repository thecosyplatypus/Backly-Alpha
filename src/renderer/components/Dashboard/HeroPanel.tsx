import React from 'react';
import { useNavigate } from 'react-router-dom';
import PlayButton from '../ui/PlayButton';

interface Props {
  game?: any;
}

const fallbackGame = {
  title: 'Elden Ring',
  description: 'Enter the Lands Between and become the Elden Lord in this epic fantasy action RPG.',
  coverArt: null,
  hoursPlayed: 142,
  genre: 'Action RPG',
  status: 'PLAYING',
};

export default function HeroPanel({ game }: Props) {
  const navigate = useNavigate();
  if (!game) {
    return (
      <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-surface-900 hero-panel group min-h-[180px] md:min-h-[320px] flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-gold-500/10 via-surface-900 to-neon-purple/5" />
        <div className="relative z-10 text-center px-6">
          <h2 className="text-fluid-xl md:text-2xl font-bold text-white mb-2">No games yet</h2>
          <p className="text-[11px] md:text-sm text-gray-400 mb-4">Add your first game to start tracking your backlog.</p>
          <button
            onClick={() => navigate('/library')}
            className="btn-primary px-4 md:px-6 py-2 md:py-3 rounded-xl text-[11px] md:text-sm"
          >
            Go to Library
          </button>
        </div>
      </div>
    );
  }
  const g = game;
  const progress = g.hoursPlayed > 0 ? Math.min(100, Math.round((g.hoursPlayed / 100) * 100)) : 0;

  return (
    <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-surface-900 hero-panel group">
      <div className="absolute inset-0 bg-gradient-to-br from-gold-500/10 via-surface-900 to-neon-purple/5" />
      <div className="absolute inset-0 bg-gradient-to-t from-surface-950 via-surface-950/60 to-transparent" />

      <div className="relative z-10 p-4 md:p-8 flex flex-col justify-end min-h-[180px] md:min-h-[320px]">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-4">
            <span className="badge-gold text-[9px] md:text-[11px] uppercase tracking-widest">{g.genre || 'RPG'}</span>
            <span className="badge bg-green-500/15 text-green-400 border border-green-500/20 text-[9px] md:text-[11px]">
              ● {g.status || 'PLAYING'}
            </span>
          </div>

          <h1 className="text-fluid-2xl md:text-4xl lg:text-5xl font-black text-white mb-2 md:mb-3 tracking-tight">
            {g.title}
          </h1>

          <p className="text-[11px] md:text-sm text-gray-400 leading-relaxed mb-4 md:mb-6 line-clamp-2 hidden sm:block">
            {g.description}
          </p>

          <div className="flex flex-wrap items-center gap-3 md:gap-6 mb-4 md:mb-6">
            <div className="flex items-center gap-1.5 md:gap-2">
              <div className="w-1.5 md:w-2 h-1.5 md:h-2 rounded-full bg-gold-400 shadow-[0_0_6px_rgba(234,179,8,0.5)]" />
              <span className="text-[11px] md:text-sm font-semibold text-white">{Math.round(g.hoursPlayed * 10) / 10}h</span>
              <span className="text-[9px] md:text-xs text-gray-500">played</span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {g.steamAppId ? (
              <PlayButton steamAppId={g.steamAppId} gameTitle={g.title} />
            ) : (
              <button onClick={() => g.id && navigate(`/game/${g.id}`)} className="btn-primary flex items-center gap-1.5 md:gap-2 text-[11px] md:text-sm px-4 md:px-6 py-2 md:py-3 rounded-xl">
                <svg className="w-3.5 md:w-4 h-3.5 md:h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span className="hidden xs:inline">Continue Playing</span>
                <span className="xs:hidden">Play</span>
              </button>
            )}
            <button onClick={() => g.id && navigate(`/game/${g.id}`)} className="btn-glass flex items-center gap-1.5 md:gap-2 text-[11px] md:text-sm px-4 md:px-6 py-2 md:py-3 rounded-xl border border-white/[0.06]">
              <svg className="w-3.5 md:w-4 h-3.5 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
