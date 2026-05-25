import { useState, useEffect, useCallback } from 'react';

interface CinematicLaunchProps {
  game: {
    id: string;
    title: string;
    coverArt?: string | null;
    banner?: string | null;
    headerImage?: string;
    appId?: string | null;
    hoursPlayed?: number;
    genre?: string | null;
  };
  onLaunch: () => void;
  onClose: () => void;
}

function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function CinematicLaunch({ game, onLaunch, onClose }: CinematicLaunchProps) {
  const [phase, setPhase] = useState<'intro' | 'countdown' | 'launching'>('intro');
  const [countdown, setCountdown] = useState(3);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (phase === 'intro') {
      const t = setTimeout(() => setPhase('countdown'), 800);
      return () => clearTimeout(t);
    }
    if (phase === 'countdown') {
      if (countdown > 0) {
        const t = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(t);
      } else {
        setPhase('launching');
      }
    }
    if (phase === 'launching') {
      const interval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            clearInterval(interval);
            onLaunch();
            return 100;
          }
          return p + 5;
        });
      }, 30);
      return () => clearInterval(interval);
    }
  }, [phase, countdown, onLaunch]);

  const bgImage = game.banner || game.headerImage || game.coverArt;

  const genreGradients: Record<string, string> = {
    RPG: 'from-purple-900/60 via-indigo-800/40 to-transparent',
    Horror: 'from-red-950/60 via-black/50 to-transparent',
    FPS: 'from-orange-900/50 via-red-800/30 to-transparent',
    Strategy: 'from-blue-950/50 via-indigo-900/30 to-transparent',
    Simulation: 'from-amber-900/50 via-yellow-800/30 to-transparent',
  };

  const genreGrad = game.genre ? (genreGradients[game.genre] || 'from-surface-900/60 via-surface-800/40 to-transparent') : 'from-surface-900/60 via-surface-800/40 to-transparent';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black">
      {/* Background */}
      {bgImage && (
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[2000ms]"
          style={{
            backgroundImage: `url(${bgImage})`,
            transform: phase === 'launching' ? 'scale(1.05)' : 'scale(1)',
          }}
        />
      )}
      <div className={`absolute inset-0 bg-gradient-to-t ${genreGrad}`} />
      <div className="absolute inset-0 bg-black/40" />

      {/* Content */}
      <div className="relative z-10 text-center space-y-6 md:space-y-8 max-w-lg mx-auto px-4">
        {/* Game Art */}
        <div
          className={`w-24 md:w-32 h-32 md:h-44 mx-auto rounded-xl overflow-hidden ring-2 ring-gold-500/30 transition-all duration-700 ${
            phase === 'launching' ? 'opacity-40 scale-90 blur-sm' : 'opacity-100 scale-100 blur-0'
          }`}
        >
          <img
            src={game.coverArt || `https://ui-avatars.com/api/?name=${encodeURIComponent(game.title)}&background=1a1f2e&color=facc15&size=128`}
            alt={game.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Title */}
        <h1 className={`text-fluid-xl md:text-3xl font-black text-white transition-all duration-500 ${
          phase === 'launching' ? 'opacity-60' : 'opacity-100'
        }`}>
          {game.title}
        </h1>

        {/* Countdown */}
        {phase === 'countdown' && (
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="text-7xl md:text-9xl font-black text-gold-400 animate-scale-elastic">
                {countdown}
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 border-2 border-gold-500/20 rounded-full animate-ping" />
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {phase === 'launching' && (
          <div className="space-y-3">
            <div className="w-full h-1.5 md:h-2 rounded-full bg-surface-700/50 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-400 transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs md:text-sm text-gold-400 font-medium animate-pulse">
              Launching game...
            </p>
          </div>
        )}

        {/* Game Info */}
        <div className="flex items-center justify-center gap-3 md:gap-4 text-[10px] md:text-xs text-gray-500">
          {game.hoursPlayed !== undefined && (
            <span className="px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.06]">
              {formatHours(game.hoursPlayed)} played
            </span>
          )}
          {game.genre && (
            <span className="px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.06]">
              {game.genre}
            </span>
          )}
        </div>

        {/* Cancel */}
        <button
          onClick={onClose}
          className="text-[11px] md:text-xs text-gray-500 hover:text-gray-300 transition-colors underline underline-offset-4"
        >
          Cancel &amp; return
        </button>
      </div>
    </div>
  );
}
