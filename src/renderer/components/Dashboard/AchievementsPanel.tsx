import React, { useEffect, useState, useCallback } from 'react';
import AchievementCard from './AchievementCard';

function TrophyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <path d="M6 9H4.5a2.5 2.5 0 010-5C7 4 6 9 6 9zM18 9h1.5a2.5 2.5 0 000-5C17 4 18 9 18 9zM12 15v6M8 21h8" />
      <path d="M6 9h12v2a6 6 0 01-12 0V9z" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2" />
    </svg>
  );
}

export default function AchievementsPanel() {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const fetchAchievements = useCallback(async () => {
    try {
      const data = await window.backly.getAllAchievements();
      setAchievements(data);
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage(null);
    const cleanup = window.backly.onSyncProgress((data) => {
      if (data.message) {
        setSyncMessage(`Syncing: ${data.message} (${data.current}/${data.total})`);
      }
    });
    try {
      const result = await window.backly.syncSteamAchievements();
      cleanup?.();
      const msg = result.message || `Synced ${result.imported || 0} games with achievements, ${result.skipped || 0} skipped`;
      setSyncMessage(msg);
      setTimeout(() => setSyncMessage(null), 5000);
      await fetchAchievements();
    } catch {
      cleanup?.();
      setSyncMessage('Sync failed — check console for details');
      setTimeout(() => setSyncMessage(null), 5000);
    }
    setSyncing(false);
  };

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-[11px] md:text-sm font-semibold text-white">Steam Achievements</h3>
          <p className="text-[9px] md:text-xs text-gray-500 mt-0.5">
            {loading ? 'Loading...' : `${unlockedCount} / ${totalCount} unlocked`}
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing || loading}
          className={`flex items-center gap-1 text-[9px] md:text-[11px] font-medium transition-colors ${
            syncing ? 'text-gray-500 cursor-not-allowed' : 'text-gold-400 hover:text-gold-300'
          }`}
        >
          <RefreshIcon />
          {syncing ? 'Syncing...' : 'Sync'}
        </button>
      </div>

      {syncMessage && (
        <div className="mb-2 px-2.5 py-1.5 rounded-lg bg-gold-500/10 border border-gold-500/15 text-[10px] text-gold-400 font-medium animate-slide-up-fade">
          {syncing ? '⟳' : '✓'} {syncMessage}
        </div>
      )}

      <div className="space-y-1.5 overflow-y-auto scrollbar-hide">
        {loading ? (
          <>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-3 p-2.5 animate-pulse">
                <div className="w-9 h-9 rounded-xl bg-surface-700/50" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-surface-700/50 rounded w-3/4" />
                  <div className="h-2 bg-surface-700/30 rounded w-1/2" />
                </div>
              </div>
            ))}
          </>
        ) : achievements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-surface-800/60 border border-white/[0.04] flex items-center justify-center mb-3">
              <TrophyIcon />
            </div>
            <h4 className="text-xs font-semibold text-white mb-1">No achievements synced yet</h4>
            <p className="text-[10px] text-gray-500 leading-relaxed max-w-[200px] mb-3">
              Connect your Steam account and sync to see your achievements here.
            </p>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="btn-primary text-[9px] md:text-[11px] px-3 py-1.5"
            >
              {syncing ? 'Syncing...' : 'Sync from Steam'}
            </button>
          </div>
        ) : (
          achievements.map((ach, i) => (
            <AchievementCard
              key={ach.id}
              title={ach.name}
              description={ach.description}
              icon={ach.iconUrl}
              progress={ach.globalProgress !== null ? Math.round(ach.globalProgress) : null}
              unlocked={ach.unlocked}
              gameTitle={ach.gameTitle}
            />
          ))
        )}
      </div>
    </div>
  );
}
