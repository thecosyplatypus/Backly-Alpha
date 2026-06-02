import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { GameStatus } from '../../shared/types';
import SteamImage from '../components/ui/SteamImage';

const statusStyles: Record<string, { active: string; inactive: string }> = {
  [GameStatus.BACKLOG]: { active: 'bg-gray-600/30 text-gray-400 border border-gray-500/30', inactive: '' },
  [GameStatus.STARTED]: { active: 'bg-blue-600/30 text-blue-400 border border-blue-500/30', inactive: '' },
  [GameStatus.PLAYING]: { active: 'bg-green-600/30 text-green-400 border border-green-500/30', inactive: '' },
  [GameStatus.COMPLETED]: { active: 'bg-purple-600/30 text-purple-400 border border-purple-500/30', inactive: '' },
  [GameStatus.ALMOST_COMPLETED]: { active: 'bg-cyan-600/30 text-cyan-400 border border-cyan-500/30', inactive: '' },
  [GameStatus.DROPPED]: { active: 'bg-red-600/30 text-red-400 border border-red-500/30', inactive: '' },
  [GameStatus.DEMO]: { active: 'bg-orange-600/30 text-orange-400 border border-orange-500/30', inactive: '' },
  [GameStatus.NO_ACHIEVEMENTS]: { active: 'bg-gray-600/30 text-gray-400 border border-gray-500/30', inactive: '' },
};

const statusOptions = [
  { value: GameStatus.BACKLOG, label: 'Backlog' },
  { value: GameStatus.STARTED, label: 'Started' },
  { value: GameStatus.PLAYING, label: 'Playing' },
  { value: GameStatus.COMPLETED, label: 'Completed' },
  { value: GameStatus.ALMOST_COMPLETED, label: 'Almost Completed' },
  { value: GameStatus.DROPPED, label: 'Dropped' },
  { value: GameStatus.DEMO, label: 'Demo' },
  { value: GameStatus.NO_ACHIEVEMENTS, label: 'No Achievements' },
];

function CompletionRingLarge({ pct, size = 100 }: { pct: number; size?: number }) {
  const r = (size - 8) / 2;
  const c = r * 2 * Math.PI;
  const offset = c - (pct / 100) * c;
  const isComplete = pct >= 100;
  const strokeColor = isComplete ? '#22c55e' : '#6366f1';
  return (
    <svg width={size} height={size} className="transform -rotate-90 shrink-0">
      <defs>
        <linearGradient id="achRingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={isComplete ? strokeColor : 'url(#achRingGrad)'} strokeWidth="6" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={offset}
        className="transition-all duration-1000"
        style={{ filter: isComplete ? 'drop-shadow(0 0 8px rgba(34,197,94,0.5))' : 'drop-shadow(0 0 4px rgba(99,102,241,0.3))' }}
      />
    </svg>
  );
}

export default function GameDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [achData, setAchData] = useState<any>(null);
  const [achLoading, setAchLoading] = useState(false);
  const updateGame = useGameStore(s => s.updateGame);
  const mountedRef = useRef(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    window.backly.getGameById(id).then((g) => {
      if (!mountedRef.current) return;
      setGame(g);
      setLoading(false);
    }).catch((err) => {
      if (!mountedRef.current) return;
      setError(err?.message || String(err));
      setLoading(false);
    });
    return () => { mountedRef.current = false; };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setAchLoading(true);
    window.backly.getGameAchievements(id).then((result) => {
      if (!mountedRef.current) return;
      setAchData(result);
      setAchLoading(false);
    }).catch(() => {
      if (mountedRef.current) setAchLoading(false);
    });
  }, [id]);

  const handleStatusChange = async (status: GameStatus) => {
    if (!game) return;
    await updateGame(game.id, { status });
    setGame({ ...game, status });
  };

  const handleRatingChange = async (rating: number) => {
    if (!game) return;
    await updateGame(game.id, { userRating: rating });
    setGame({ ...game, userRating: rating });
  };

  const handleToggleFavourite = async () => {
    if (!game) return;
    await updateGame(game.id, { isFavourite: !game.isFavourite });
    setGame({ ...game, isFavourite: !game.isFavourite });
  };

  const handleHoursChange = async (hours: number) => {
    if (!game) return;
    await updateGame(game.id, { hoursPlayed: hours });
    setGame({ ...game, hoursPlayed: hours });
  };

  const achTotal = achData?.totalAchievements ?? 0;
  const achUnlocked = achData?.unlockedAchievements ?? 0;
  const achPct = achData?.completionPercentage ?? 0;
  const achLocked = achTotal - achUnlocked;
  const hasAchievements = achTotal > 0;
  const isFullyComplete = hasAchievements && achPct >= 100;

  const achievements = achData?.achievements ?? [];

  if (loading) {
    return (
      <div className="content-area space-y-4 md:space-y-6 animate-pulse">
        <div className="h-40 md:h-64 skeleton rounded-xl" />
        <div className="h-6 md:h-8 w-48 md:w-64 skeleton" />
        <div className="h-3 md:h-4 w-64 md:w-96 skeleton" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 md:py-20">
        <p className="text-2xl md:text-4xl mb-3 md:mb-4">⚠️</p>
        <p className="text-sm md:text-base text-red-400">Failed to load game</p>
        <p className="text-[11px] text-gray-600 mt-1 max-w-md mx-auto">{error}</p>
        <div className="flex gap-3 justify-center mt-4">
          <button onClick={() => navigate('/library')} className="btn-primary text-[11px] md:text-sm">
            Back to Library
          </button>
          <button onClick={() => window.location.reload()} className="btn-secondary text-[11px] md:text-sm">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="text-center py-12 md:py-20">
        <p className="text-2xl md:text-4xl mb-3 md:mb-4">❓</p>
        <p className="text-sm md:text-base text-gray-500">Game not found</p>
        <button onClick={() => navigate('/library')} className="btn-primary mt-3 md:mt-4 text-[11px] md:text-sm">
          Back to Library
        </button>
      </div>
    );
  }

  return (
    <div className="content-area space-y-4 md:space-y-6 page-transition resize-transition">
      {/* Hero */}
      <div className={`relative rounded-xl overflow-hidden h-36 md:h-48 lg:h-64 ${isFullyComplete ? 'ring-1 ring-green-500/20' : ''}`}>
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${game.banner || game.coverArt || ''})`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-900 via-surface-900/60 to-transparent" />
        {isFullyComplete && (
          <>
            <div className="absolute inset-0 bg-gradient-to-b from-green-500/[0.02] via-transparent to-green-500/[0.05]" />
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-green-600/30 to-emerald-600/20 border border-green-400/30 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
              <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5" stroke="#22c55e" strokeWidth="2.5">
                <path d="M14 4L6 12l-4-4" />
              </svg>
              <span className="text-[10px] md:text-xs font-bold text-green-400 tracking-wider">100% COMPLETE</span>
            </div>
            <div className="absolute top-3 right-3 z-0 w-24 h-24 bg-green-500/10 rounded-full blur-2xl animate-pulse" />
          </>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-3 md:p-6 flex items-end gap-2 md:gap-4">
          <SteamImage
            src={game.coverArt}
            alt={game.title}
            className="w-12 md:w-20 h-16 md:h-28 rounded-lg object-cover shadow-lg shrink-0"
            fallback={`https://ui-avatars.com/api/?name=${encodeURIComponent(game.title)}&background=6366f1&color=fff&size=128`}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 md:gap-2">
              <h1 className="text-fluid-lg md:text-2xl font-bold text-white truncate">{game.title}</h1>
              <button onClick={handleToggleFavourite} className="text-sm md:text-xl shrink-0">
                {game.isFavourite ? '★' : '☆'}
              </button>
            </div>
            <p className="text-[10px] md:text-sm text-gray-400 mt-0.5 md:mt-1 truncate">
              {[game.developer, game.publisher, game.genre, game.platform].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
      </div>

      {/* Status Buttons */}
      <div className="flex flex-wrap gap-1.5 md:gap-2">
        {statusOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleStatusChange(opt.value)}
            className={`px-2.5 md:px-4 py-1 md:py-1.5 rounded-full text-[10px] md:text-xs font-medium transition-all duration-200 ${
              game.status === opt.value
                ? statusStyles[opt.value]?.active || 'bg-gray-600/30 text-gray-400'
                : 'bg-surface-800 text-gray-400 hover:bg-surface-700'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 resize-transition">
        {/* Left */}
        <div className="lg:col-span-2 space-y-3 md:space-y-4">
          {/* Playtime */}
          <div className="card">
            <h2 className="text-[11px] md:text-sm font-semibold text-white mb-2 md:mb-3">Playtime</h2>
            <div className="flex items-center gap-3 md:gap-4">
              <div className="flex items-center gap-1.5 md:gap-2">
                <p className="text-[11px] md:text-sm text-gray-300">
                  <span className="text-white font-semibold">{Math.round(game.hoursPlayed)}h</span> played
                </p>
                <div className="flex items-center gap-1.5 md:gap-2 ml-2">
                  <button onClick={() => handleHoursChange(Math.max(0, game.hoursPlayed - 0.5))} className="btn-ghost text-[10px] md:text-xs p-0.5 md:p-1">−</button>
                  <input
                    type="number"
                    value={game.hoursPlayed}
                    onChange={(e) => handleHoursChange(parseFloat(e.target.value) || 0)}
                    className="input w-14 md:w-20 text-center text-[10px] md:text-sm py-1 md:py-2"
                    step="0.5"
                  />
                  <button onClick={() => handleHoursChange(game.hoursPlayed + 0.5)} className="btn-ghost text-[10px] md:text-xs p-0.5 md:p-1">+</button>
                </div>
              </div>
            </div>
          </div>

          {/* Achievements Section */}
          <div className={`card ${isFullyComplete ? 'border-green-500/20' : ''}`}>
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h2 className={`text-[11px] md:text-sm font-semibold ${isFullyComplete ? 'text-green-400' : 'text-white'}`}>
                Achievements
                {isFullyComplete && (
                  <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[9px] font-medium">
                    <svg viewBox="0 0 12 12" fill="none" className="w-2.5 h-2.5" stroke="currentColor" strokeWidth="2">
                      <path d="M10.5 2L4.5 9l-3-3" />
                    </svg>
                    All Unlocked
                  </span>
                )}
              </h2>
              {hasAchievements && (
                <div className="text-right">
                  <p className={`text-[18px] md:text-2xl font-bold ${isFullyComplete ? 'text-green-400' : 'text-white'}`}>
                    {achPct}%
                  </p>
                  <p className="text-[9px] md:text-[10px] text-gray-500">
                    {achUnlocked} / {achTotal}
                  </p>
                </div>
              )}
            </div>

            {achLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3 p-2.5 animate-pulse">
                    <div className="w-9 h-9 rounded-xl bg-surface-700/50" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-surface-700/50 rounded w-3/4" />
                      <div className="h-2 bg-surface-700/30 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !hasAchievements ? (
              <div className="flex flex-col items-center justify-center py-6 md:py-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-surface-800/60 border border-white/[0.04] flex items-center justify-center mb-2">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-gray-500">
                    <path d="M6 9H4.5a2.5 2.5 0 010-5C7 4 6 9 6 9zM18 9h1.5a2.5 2.5 0 000-5C17 4 18 9 18 9zM12 15v6M8 21h8" />
                    <path d="M6 9h12v2a6 6 0 01-12 0V9z" />
                  </svg>
                </div>
                <p className="text-xs text-gray-500">No achievements tracked for this game</p>
                <p className="text-[10px] text-gray-600 mt-0.5">Sync your Steam account to see achievements here</p>
              </div>
            ) : (
              <>
                {/* Achievement Summary Cards */}
                <div className="grid grid-cols-4 gap-2 mb-3 md:mb-4">
                  <div className="p-2 rounded-lg bg-surface-800/40 border border-white/[0.03] text-center">
                    <p className="text-sm md:text-lg font-bold text-white">{achTotal}</p>
                    <p className="text-[7px] md:text-[9px] text-gray-500 mt-0.5">Total</p>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-800/40 border border-white/[0.03] text-center">
                    <p className="text-sm md:text-lg font-bold text-green-400">{achUnlocked}</p>
                    <p className="text-[7px] md:text-[9px] text-gray-500 mt-0.5">Unlocked</p>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-800/40 border border-white/[0.03] text-center">
                    <p className="text-sm md:text-lg font-bold text-gray-400">{achLocked}</p>
                    <p className="text-[7px] md:text-[9px] text-gray-500 mt-0.5">Locked</p>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-800/40 border border-white/[0.03] text-center">
                    <p className={`text-sm md:text-lg font-bold ${isFullyComplete ? 'text-green-400' : 'text-indigo-400'}`}>{achPct}%</p>
                    <p className="text-[7px] md:text-[9px] text-gray-500 mt-0.5">Complete</p>
                  </div>
                </div>

                {/* Achievement Progress Bar */}
                <div className="mb-3 md:mb-4">
                  <div className="w-full h-2 rounded-full bg-surface-700/50 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r ${
                        isFullyComplete ? 'from-green-500 to-emerald-400' : 'from-indigo-600 to-indigo-400'
                      }`}
                      style={{ width: `${achPct}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-gray-600 mt-1">
                    {achLocked > 0 ? `${achLocked} achievement${achLocked !== 1 ? 's' : ''} remaining` : 'All achievements unlocked!'}
                  </p>
                </div>

                {/* Achievement List */}
                <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1 scrollbar-hide">
                  {achievements.map((ach: any) => (
                    <div
                      key={ach.id}
                      className={`flex items-center gap-2.5 md:gap-3 p-2 md:p-2.5 rounded-lg transition-all duration-200 ${
                        ach.unlocked
                          ? 'bg-green-500/[0.03] border border-green-500/10 hover:bg-green-500/[0.06]'
                          : 'bg-surface-800/30 border border-transparent hover:bg-surface-800/50'
                      }`}
                    >
                      <div className={`w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center shrink-0 overflow-hidden ${
                        ach.unlocked ? 'bg-green-500/10' : 'bg-surface-700/50'
                      }`}>
                        {ach.iconUrl ? (
                          <img src={ach.iconUrl} alt="" className="w-full h-full object-cover opacity-60" />
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={`w-4 h-4 ${ach.unlocked ? 'text-green-400' : 'text-gray-600'}`}>
                            <path d="M12 15v6M8 21h8" />
                            <circle cx="12" cy="8" r="5" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className={`text-[10px] md:text-xs font-medium truncate ${ach.unlocked ? 'text-green-300' : 'text-gray-400'}`}>
                            {ach.name}
                          </p>
                          {ach.unlocked && (
                            <svg viewBox="0 0 12 12" fill="none" className="w-2.5 h-2.5 shrink-0" stroke="#22c55e" strokeWidth="2">
                              <path d="M10.5 2L4.5 9l-3-3" />
                            </svg>
                          )}
                        </div>
                        {ach.description && (
                          <p className="text-[8px] md:text-[10px] text-gray-600 truncate mt-0.5">{ach.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-0.5">
                          {ach.unlocked && ach.unlockedAt && (
                            <span className="text-[7px] md:text-[9px] text-green-500/60">
                              Unlocked {new Date(ach.unlockedAt).toLocaleDateString()}
                            </span>
                          )}
                          {ach.globalProgress !== null && (
                            <span className="text-[7px] md:text-[9px] text-gray-600">
                              {ach.globalProgress.toFixed(1)}% of players
                            </span>
                          )}
                        </div>
                      </div>
                      {ach.globalProgress !== null && (
                        <div className="hidden sm:flex flex-col items-center justify-center w-10 shrink-0">
                          <div className="w-full h-1 rounded-full bg-surface-700/50 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${ach.unlocked ? 'bg-green-500/60' : 'bg-indigo-500/40'}`}
                              style={{ width: `${Math.min(100, ach.globalProgress)}%` }}
                            />
                          </div>
                          <span className="text-[7px] text-gray-600 mt-0.5">{Math.round(ach.globalProgress)}%</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Notes */}
          <div className="card">
            <h2 className="text-[11px] md:text-sm font-semibold text-white mb-2 md:mb-3">Notes</h2>
            <textarea
              value={game.notes || ''}
              onChange={async (e) => {
                await updateGame(game.id, { notes: e.target.value });
                setGame({ ...game, notes: e.target.value });
              }}
              placeholder="Add your notes about this game..."
              className="input w-full h-16 md:h-24 resize-none text-[11px] md:text-sm"
            />
          </div>
        </div>

        {/* Right */}
        <div className="space-y-3 md:space-y-4">
          {/* Achievement Ring */}
          {hasAchievements && (
            <div className={`card ${isFullyComplete ? 'border-green-500/20' : ''}`}>
              <div className="flex flex-col items-center py-2">
                <div className="relative">
                  <CompletionRingLarge pct={achPct} size={100} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className={`text-lg md:text-xl font-bold ${isFullyComplete ? 'text-green-400' : 'text-white'}`}>
                        {achPct}%
                      </p>
                      <p className="text-[8px] text-gray-500 -mt-0.5">done</p>
                    </div>
                  </div>
                </div>
                <div className="text-center mt-2">
                  <p className="text-[10px] md:text-xs text-gray-400">
                    <span className={isFullyComplete ? 'text-green-400 font-semibold' : 'text-white font-semibold'}>{achUnlocked}</span>
                    {' / '}{achTotal} achievements
                  </p>
                  {achLocked > 0 ? (
                    <p className="text-[9px] text-gray-600 mt-0.5">{achLocked} remaining to unlock</p>
                  ) : hasAchievements ? (
                    <p className="text-[9px] text-green-500/70 mt-0.5">All achievements unlocked!</p>
                  ) : null}
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <h2 className="text-[11px] md:text-sm font-semibold text-white mb-2 md:mb-3">Details</h2>
            <div className="space-y-2 md:space-y-3">
              <DetailRow label="Status" value={game.status} />
              <DetailRow label="Platform" value={game.platform || '—'} />
              <DetailRow label="Genre" value={game.genre || '—'} />
              <DetailRow label="Developer" value={game.developer || '—'} />
              <DetailRow label="Publisher" value={game.publisher || '—'} />
              <DetailRow label="Release" value={game.releaseDate ? new Date(game.releaseDate).toLocaleDateString() : '—'} />
              {game.steamAppId && <DetailRow label="Steam ID" value={game.steamAppId} />}
              {hasAchievements && <DetailRow label="Achievements" value={`${achUnlocked}/${achTotal} (${achPct}%)`} />}
            </div>
          </div>

          {/* Rating */}
          <div className="card">
            <h2 className="text-[11px] md:text-sm font-semibold text-white mb-2 md:mb-3">Your Rating</h2>
            <div className="flex flex-wrap items-center gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <button
                  key={n}
                  onClick={() => handleRatingChange(n)}
                  className={`w-5 h-5 md:w-7 md:h-7 rounded text-[9px] md:text-xs font-medium transition-all ${
                    (game.userRating || 0) >= n
                      ? 'bg-yellow-600/30 text-yellow-400'
                      : 'bg-surface-800 text-gray-600 hover:bg-surface-700'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="card">
            <h2 className="text-[11px] md:text-sm font-semibold text-white mb-2 md:mb-3">Tags</h2>
            <div className="flex flex-wrap gap-1 md:gap-1.5">
              {(game.tags ? game.tags.split(',').filter(Boolean) : []).map((tag: string, i: number) => (
                <span key={i} className="badge bg-backly-600/20 text-backly-400 text-[8px] md:text-[10px]">{tag.trim()}</span>
              ))}
            </div>
            <input
              type="text"
              placeholder="Add tags (comma separated)"
              value={game.tags || ''}
              onChange={async (e) => {
                await updateGame(game.id, { tags: e.target.value });
                setGame({ ...game, tags: e.target.value });
              }}
              className="input w-full mt-2 text-[11px] md:text-sm"
            />
          </div>

          {/* Steam */}
          {game.steamAppId && (
            <div className="card">
              <div className="flex items-center gap-1.5 md:gap-2 text-[11px] md:text-sm text-gray-400">
                <span>✓</span>
                <span>Imported from Steam</span>
              </div>
              <div className="flex items-center gap-3 mt-1.5 md:mt-2">
                <a
                  href={`https://store.steampowered.com/app/${game.steamAppId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] md:text-xs text-backly-400 hover:text-backly-300 inline-block"
                >
                  View on Steam →
                </a>
                <button
                  onClick={async () => {
                    const result = await window.backly.refreshGameMetadata(game.id);
                    if (result.success) {
                      setGame((prev: any) => ({
                        ...prev,
                        genre: result.genre ?? prev.genre,
                        developer: result.developer ?? prev.developer,
                        publisher: result.publisher ?? prev.publisher,
                        releaseDate: result.releaseDate ?? prev.releaseDate,
                      }));
                    }
                  }}
                  className="text-[10px] md:text-xs text-gold-500 hover:text-gold-400 transition-colors"
                >
                  Refresh metadata
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] md:text-xs text-gray-500 shrink-0">{label}</span>
      <span className="text-[10px] md:text-xs text-gray-300 text-right truncate">{value}</span>
    </div>
  );
}
