import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { useSettingsStore } from '../store/settingsStore';
import GameCard from '../components/GameCard/GameCard';
import SteamImage from '../components/ui/SteamImage';
import { useResponsive } from '../hooks/useResponsive';
import { GameStatus } from '../../shared/types';

const statusFilters = [
  { value: '', label: 'All' },
  { value: GameStatus.PLAYING, label: 'Playing' },
  { value: GameStatus.BACKLOG, label: 'Backlog' },
  { value: GameStatus.STARTED, label: 'Started' },
  { value: GameStatus.COMPLETED, label: 'Completed' },
  { value: GameStatus.PAUSED, label: 'Paused' },
  { value: GameStatus.DROPPED, label: 'Dropped' },
  { value: GameStatus.WISHLIST, label: 'Wishlist' },
];

const sortOptions = [
  { value: 'recent', label: 'Recently Updated' },
  { value: 'title', label: 'Alphabetical' },
  { value: 'created', label: 'Recently Added' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'hours', label: 'Most Played' },
  { value: 'hours_asc', label: 'Least Played' },
];

const PAGE_SIZE = 48;

export default function Library() {
  const navigate = useNavigate();
  const { games, totalGames, fetchGames, loading, error } = useGameStore();
  const { steamStatus, steamSync, syncing, syncProgress, lastSyncResult, clearSyncResult, loadSteamStatus } = useSettingsStore();
  const resp = useResponsive();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [favouriteOnly, setFavouriteOnly] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadSteamStatus();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, sortBy, favouriteOnly]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGames({ search: search || undefined, status: statusFilter || undefined, sort: sortBy, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE, isFavourite: favouriteOnly || undefined });
    }, 200);
    return () => clearTimeout(timer);
  }, [search, statusFilter, sortBy, favouriteOnly, page]);

  const handleSync = async () => {
    clearSyncResult();
    await steamSync();
  };

  const totalPages = Math.max(1, Math.ceil((totalGames ?? 0) / PAGE_SIZE));
  const filtered = games ?? [];
  const isSyncing = syncing;
  const percent = syncProgress && syncProgress.total > 0
    ? Math.round((syncProgress.current / syncProgress.total) * 100)
    : null;

  const gridStyle = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fill, minmax(${resp.cardWidth}px, 1fr))`,
    gap: `${resp.contentPadding / 2}px`,
  }), [resp.cardWidth, resp.contentPadding]);

  return (
    <div className="content-area space-y-4 md:space-y-6 resize-transition">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-fluid-lg md:text-2xl font-bold text-gradient">Game Library</h1>
          <p className="text-[11px] md:text-sm text-gray-500 mt-0.5">{totalGames} games</p>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
          {steamStatus?.isConnected && (
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1.5 rounded-lg bg-gold-500/10 hover:bg-gold-500/20 text-gold-400 text-[10px] md:text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-3 md:w-3.5 h-3 md:h-3.5" stroke="currentColor" strokeWidth="2">
                <path d="M1 4v6h6M23 20v-6h-6" />
                <path d="M20.49 9A9 9 0 005.64 5.64L1 10M22.54 14.01l-4.64 4.35a9 9 0 01-14.85-3.36" />
              </svg>
              <span className="hidden xs:inline">{isSyncing ? 'Syncing...' : 'Sync Steam'}</span>
              <span className="xs:hidden">{isSyncing ? '...' : 'Sync'}</span>
            </button>
          )}
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 md:p-2 rounded ${viewMode === 'grid' ? 'bg-backly-600/20 text-backly-400' : 'text-gray-500 hover:text-white'}`}
            title="Grid view"
          >
            ▦
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 md:p-2 rounded ${viewMode === 'list' ? 'bg-backly-600/20 text-backly-400' : 'text-gray-500 hover:text-white'}`}
            title="List view"
          >
            ☰
          </button>
        </div>
      </div>

      {/* Sync Progress */}
      {syncProgress && (
        <div className="p-3 md:p-4 rounded-xl bg-backly-600/10 border border-backly-500/20 space-y-1.5 md:space-y-2">
          <div className="flex items-center justify-between text-[10px] md:text-xs">
            <span className="text-gray-400 truncate">{syncProgress.message}</span>
            {percent !== null && (
              <span className="text-gold-400 font-medium shrink-0">{percent}%</span>
            )}
          </div>
          <div className="w-full h-1.5 md:h-2 rounded-full bg-surface-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-400 transition-all duration-300"
              style={{ width: `${percent || 0}%` }}
            />
          </div>
          {syncProgress.total > 0 && (
            <p className="text-[9px] md:text-[10px] text-gray-600">
              {syncProgress.current} / {syncProgress.total} games
            </p>
          )}
        </div>
      )}

      {lastSyncResult && !syncProgress && (
        <div className={`p-2.5 md:p-3 rounded-xl text-[11px] md:text-sm ${
          lastSyncResult.success
            ? 'bg-green-500/10 border border-green-500/20 text-green-400'
            : 'bg-red-500/10 border border-red-500/20 text-red-400'
        }`}>
          <p className="font-medium">{lastSyncResult.message}</p>
        </div>
      )}

      {/* Status Tabs */}
      <div className="flex gap-1 md:gap-1.5 flex-wrap">
        {statusFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg text-[10px] md:text-sm font-medium transition-all ${
              statusFilter === f.value
                ? 'bg-backly-600/20 text-backly-400 neon-border'
                : 'bg-surface-800 text-gray-400 hover:bg-surface-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Search & Sort */}
      <div className="flex flex-wrap gap-2 md:gap-3 items-center">
        <div className="relative flex-1 min-w-[140px] md:min-w-[200px] max-w-md">
          <span className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 text-gray-500 text-[10px] md:text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search games..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-8 md:pl-9 w-full text-[11px] md:text-sm py-2 md:py-2.5"
          />
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="input text-[10px] md:text-sm py-2 md:py-2.5"
        >
          {sortOptions.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        <button
          onClick={() => setFavouriteOnly(!favouriteOnly)}
          className={`btn-ghost text-[10px] md:text-sm px-2 md:px-3 py-2 md:py-2.5 ${favouriteOnly ? 'text-yellow-400' : ''}`}
        >
          ★ {favouriteOnly ? 'Favourites' : 'All'}
        </button>
      </div>

      {/* Error State */}
      {error && !loading && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <p className="text-xs md:text-sm text-red-400 font-medium">Error loading games</p>
          <p className="text-[10px] md:text-xs text-red-400/60 mt-1">{error}</p>
          <button onClick={() => fetchGames()} className="mt-2 text-[10px] md:text-xs text-red-300 hover:text-red-200 underline">
            Try again
          </button>
        </div>
      )}

      {/* Game Grid/List */}
      {loading ? (
        <div className="game-grid" style={gridStyle}>
          {[...Array(10)].map((_, i) => (
            <div key={i} className="aspect-[3/4] skeleton rounded-lg md:rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 md:py-20">
          <p className="text-2xl md:text-4xl mb-3 md:mb-4">🎮</p>
          <p className="text-sm md:text-base text-gray-500">No games found</p>
          <p className="text-[11px] md:text-sm text-gray-600 mt-1.5 md:mt-2">
            {search ? 'Try a different search term' : 'Import from Steam or add games manually'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="game-grid" style={gridStyle}>
          {filtered.map((game: any) => (
            <GameCard
              key={game.id}
              game={game}
              onClick={() => navigate(`/game/${game.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-1.5 md:space-y-2">
          {filtered.map((game: any) => (
            <button
              key={game.id}
              onClick={() => navigate(`/game/${game.id}`)}
              className="w-full card flex items-center gap-3 md:gap-4 text-left hover:scale-[1.01] py-2 md:py-3"
            >
              <SteamImage
                src={game.coverArt}
                alt={game.title}
                className="w-8 md:w-12 h-12 md:h-16 rounded object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] md:text-sm font-medium text-white truncate">{game.title}</p>
                <p className="text-[9px] md:text-xs text-gray-500">{game.genre || '—'} · {Math.round(game.hoursPlayed)}h played</p>
              </div>
              <span className={`badge text-[9px] md:text-xs ${
                game.status === GameStatus.COMPLETED ? 'bg-purple-600/20 text-purple-400' :
                game.status === GameStatus.PLAYING ? 'bg-green-600/20 text-green-400' :
                game.status === GameStatus.BACKLOG ? 'bg-gray-600/20 text-gray-400' :
                'bg-blue-600/20 text-blue-400'
              }`}>
                {game.status}
              </span>
              {game.isFavourite && <span className="text-yellow-400 text-[10px] md:text-xs">★</span>}
              {game.userRating && <span className="text-[9px] md:text-xs text-gray-500">{game.userRating}/10</span>}
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 md:gap-3 pt-2 md:pt-4 pb-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-[10px] md:text-sm font-medium bg-surface-800 text-gray-400 hover:text-white hover:bg-surface-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const startPage = Math.max(1, Math.min(page - 2, totalPages - 4));
              const p = startPage + i;
              if (p > totalPages) return null;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-7 md:w-8 h-7 md:h-8 rounded-lg text-[10px] md:text-xs font-medium transition-all ${
                    p === page
                      ? 'bg-backly-600/20 text-backly-400 neon-border'
                      : 'bg-surface-800 text-gray-400 hover:bg-surface-700'
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= totalPages}
            className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-[10px] md:text-sm font-medium bg-surface-800 text-gray-400 hover:text-white hover:bg-surface-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
