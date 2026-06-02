import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, animate } from 'framer-motion';
import { useSettingsStore } from '../../store/settingsStore';

type SyncState = 'idle' | 'connecting' | 'syncing' | 'processing' | 'complete' | 'error';

interface SyncMetrics {
  gamesScanned: number;
  achievementsFetched: number;
  currentGame: string;
  percentComplete: number;
  estimatedRemaining: number;
}

function SteamLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 12a4 4 0 118 0 4 4 0 01-8 0z" stroke="currentColor" strokeWidth="1.2" />
      <path d="M12 8v8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 12h8" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="2.5">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M15 9l-6 6M9 9l6 6" />
    </svg>
  );
}

function CancelIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function getTimeAgo(date: string | Date): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = Math.max(0, now - then);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(date).toLocaleDateString();
}

interface AnimatedNumberProps {
  value: number;
  suffix?: string;
  className?: string;
}

function AnimatedNumber({ value, suffix = '', className = '' }: AnimatedNumberProps) {
  const prevValueRef = useRef(value);
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const from = prevValueRef.current;
    prevValueRef.current = value;
    if (from === value) return;
    const controls = animate(from, value, {
      duration: 0.6,
      ease: 'easeOut',
      onUpdate: (v) => setDisplayValue(Math.round(v)),
    });
    return controls.stop;
  }, [value]);

  return (
    <span className={className}>
      {displayValue}{suffix}
    </span>
  );
}

interface CircularProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  state: SyncState;
}

function CircularProgress({ progress, size = 64, strokeWidth = 4, state }: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  const center = size / 2;

  const glowColor = state === 'complete'
    ? 'rgba(34,197,94,0.5)'
    : state === 'error'
    ? 'rgba(239,68,68,0.5)'
    : 'rgba(250,204,21,0.5)';

  return (
    <svg width={size} height={size} className="transform -rotate-90 shrink-0">
      <defs>
        <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#eab308" />
          <stop offset="50%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#ffd700" />
        </linearGradient>
      </defs>
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={strokeWidth}
      />
      <motion.circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="url(#progressGrad)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{
          strokeDashoffset: offset,
          filter: [
            `drop-shadow(0 0 2px ${glowColor})`,
            `drop-shadow(0 0 6px ${glowColor})`,
            `drop-shadow(0 0 2px ${glowColor})`,
          ],
        }}
        transition={{
          duration: 0.5,
          ease: 'easeOut',
          filter: {
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        }}
        style={{ filter: `drop-shadow(0 0 3px ${glowColor})` }}
      />
      {(state === 'connecting' || state === 'syncing' || state === 'processing') && (
        <>
          <motion.circle
            cx={center}
            cy={center}
            r={radius + 2}
            fill="none"
            stroke="rgba(250,204,21,0.15)"
            strokeWidth={strokeWidth + 2}
            strokeDasharray={`${circumference * 0.3} ${circumference * 0.7}`}
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: 'center' }}
          />
          <motion.circle
            cx={center}
            cy={center}
            r={radius + 5}
            fill="none"
            stroke="rgba(250,204,21,0.06)"
            strokeWidth={strokeWidth + 1}
            strokeDasharray={`${circumference * 0.15} ${circumference * 0.85}`}
            animate={{ rotate: -360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: 'center' }}
          />
        </>
      )}
    </svg>
  );
}

interface ProgressBarProps {
  percent: number;
  state: SyncState;
}

function ProgressBar({ percent, state }: ProgressBarProps) {
  const barColor = state === 'complete'
    ? 'from-green-500 to-green-400'
    : state === 'error'
    ? 'from-red-500 to-red-400'
    : state === 'connecting'
    ? 'from-gold-600 to-gold-400'
    : 'from-gold-600 via-gold-400 to-yellow-300';

  const pulseEnabled = state === 'syncing' || state === 'processing' || state === 'connecting';

  return (
    <div className="relative w-full h-2 rounded-full bg-surface-700/50 overflow-hidden">
      <motion.div
        className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${barColor}`}
        initial={{ width: '0%' }}
        animate={{
          width: `${percent}%`,
          ...(pulseEnabled ? {
            boxShadow: [
              '0 0 4px rgba(250,204,21,0.2)',
              '0 0 12px rgba(250,204,21,0.4)',
              '0 0 4px rgba(250,204,21,0.2)',
            ],
          } : {}),
        }}
        transition={{
          width: { duration: 0.4, ease: 'easeOut' },
          boxShadow: pulseEnabled ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {},
        }}
      />
      {pulseEnabled && (
        <motion.div
          className="absolute inset-y-0 left-0 w-8 rounded-full bg-white/20 blur-sm"
          animate={{ x: ['-100%', `${percent + 100}%`] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />
      )}
    </div>
  );
}

interface SyncLog {
  time: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'game';
}

function getStateMessage(state: SyncState, currentGame: string): string {
  switch (state) {
    case 'connecting': return 'Connecting to Steam servers...';
    case 'syncing': return currentGame
      ? `Syncing ${currentGame}...`
      : 'Fetching owned games...';
    case 'processing': return 'Processing metadata...';
    case 'complete': return 'Sync complete!';
    case 'error': return 'Sync failed';
    default: return 'Ready to sync';
  }
}

export default function SteamSyncCard() {
  const steamStatus = useSettingsStore(s => s.steamStatus);
  const syncing = useSettingsStore(s => s.syncing);
  const loading = useSettingsStore(s => s.loading);
  const syncProgress = useSettingsStore(s => s.syncProgress);
  const lastSyncResult = useSettingsStore(s => s.lastSyncResult);
  const steamSync = useSettingsStore(s => s.steamSync);
  const steamLogin = useSettingsStore(s => s.steamLogin);
  const steamDisconnect = useSettingsStore(s => s.steamDisconnect);
  const clearSyncResult = useSettingsStore(s => s.clearSyncResult);
  const loadSteamStatus = useSettingsStore(s => s.loadSteamStatus);

  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [metrics, setMetrics] = useState<SyncMetrics>({
    gamesScanned: 0, achievementsFetched: 0, currentGame: '',
    percentComplete: 0, estimatedRemaining: 0,
  });
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [logsExpanded, setLogsExpanded] = useState(false);
  const [showRetry, setShowRetry] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const cancelRef = useRef(false);
  const startTimeRef = useRef<number>(0);
  const cleanupRef = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    loadSteamStatus();
  }, []);

  useEffect(() => {
    if (loading && syncState === 'idle') {
      setSyncState('connecting');
      setShowRetry(false);
      addLog('Initializing Steam connection...', 'info');
      startTimeRef.current = Date.now();
    }
  }, [loading]);

  useEffect(() => {
    if (syncing && syncState === 'idle') {
      setSyncState('connecting');
      setShowRetry(false);
      addLog('Initializing sync...', 'info');
      startTimeRef.current = Date.now();
    }
  }, [syncing]);

  useEffect(() => {
    if (!loading && !syncing && (syncState === 'connecting' || syncState === 'syncing' || syncState === 'processing')) {
      if (lastSyncResult?.success) {
        setSyncState('complete');
        addLog(lastSyncResult.message || 'Sync completed successfully', 'success');
        if (lastSyncResult.imported > 0) {
          addLog(`Imported ${lastSyncResult.imported} new games`, 'success');
        }
        if (lastSyncResult.updated > 0) {
          addLog(`Updated ${lastSyncResult.updated} games`, 'success');
        }
      } else if (lastSyncResult && !lastSyncResult.success) {
        setSyncState('error');
        addLog(lastSyncResult.message || 'Sync failed', 'error');
        setShowRetry(true);
      } else if (!lastSyncResult && !cancelRef.current) {
        setSyncState('idle');
      }
    }
  }, [loading, syncing, lastSyncResult]);

  useEffect(() => {
    if (syncProgress) {
      const { current, total, message } = syncProgress;
      const isGameSync = message && message.length > 0;

      if (isGameSync) {
        setSyncState('syncing');
        const cleanName = message.replace(/^Processing:\s*/, '');
        setMetrics(prev => {
          const isProcessingPrefix = message.startsWith('Processing:');
          const next: SyncMetrics = {
            ...prev,
            currentGame: cleanName,
            percentComplete: total > 0 ? Math.round((current / total) * 100) : prev.percentComplete,
          };
          if (isProcessingPrefix) {
            next.gamesScanned = Math.max(prev.gamesScanned, current);
          } else if (!message.startsWith('Fetching') && !message.includes('Complete') && !message.includes('Matching') && !message.includes('No games')) {
            next.achievementsFetched = prev.achievementsFetched + 1;
          }
          return next;
        });
      } else if (message?.toLowerCase().includes('metadata') || message?.toLowerCase().includes('process')) {
        setSyncState('processing');
      } else if (message?.toLowerCase().includes('connect')) {
        setSyncState('connecting');
      } else if (current > 0 || total > 0) {
        setSyncState('syncing');
        setMetrics(prev => ({
          ...prev,
          gamesScanned: Math.max(prev.gamesScanned, current),
          percentComplete: total > 0 ? Math.round((current / total) * 100) : prev.percentComplete,
        }));
      }

      if (isGameSync && current > 0 && message) {
        addLog(message, 'game');
      }
    }
  }, [syncProgress]);

  useEffect(() => {
    if (syncState === 'complete') {
      const timer = setTimeout(() => {
        setShowRetry(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [syncState]);

  useEffect(() => {
    const cleanup = window.backly.onSyncProgress((data) => {
      if (data.total > 0 && data.current > 0) {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        const rate = data.current / elapsed;
        const remaining = rate > 0 ? (data.total - data.current) / rate : 0;
        setMetrics(prev => ({ ...prev, estimatedRemaining: Math.round(remaining) }));
      }
    });
    cleanupRef.current = cleanup ?? undefined;
    return () => cleanupRef.current?.();
  }, []);

  useEffect(() => {
    setAvatarError(false);
  }, [steamStatus?.avatar]);

  const addLog = useCallback((message: string, type: SyncLog['type']) => {
    setLogs(prev => {
      const next = [...prev, {
        time: new Date().toLocaleTimeString(),
        message,
        type,
      }];
      return next.slice(-50);
    });
  }, []);

  const handleSync = useCallback(async () => {
    clearSyncResult();
    cancelRef.current = false;
    setMetrics({ gamesScanned: 0, achievementsFetched: 0, currentGame: '', percentComplete: 0, estimatedRemaining: 0 });
    setLogs([]);
    setSyncState('connecting');
    setShowRetry(false);
    startTimeRef.current = Date.now();
    addLog('Starting sync...', 'info');

    try {
      if (steamStatus?.isConnected) {
        await steamSync();
      } else {
        await steamLogin();
      }
    } catch (err: any) {
      setSyncState('error');
      addLog(err?.message || 'Sync failed', 'error');
      setShowRetry(true);
    }
  }, [steamSync, steamLogin, steamStatus, clearSyncResult]);

  const handleCancel = useCallback(() => {
    cancelRef.current = true;
    addLog('Sync cancelled by user', 'info');
    setSyncState('idle');
  }, []);

  const handleRetry = useCallback(() => {
    handleSync();
  }, [handleSync]);

  const handleDisconnect = useCallback(async () => {
    await steamDisconnect();
    setSyncState('idle');
    setShowRetry(false);
  }, [steamDisconnect]);

  const isActive = syncState === 'connecting' || syncState === 'syncing' || syncState === 'processing';
  const isSyncing = syncState === 'syncing';
  const isComplete = syncState === 'complete';
  const isError = syncState === 'error';

  const percent = metrics.percentComplete;

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl bg-surface-900/60 backdrop-blur-xl border border-white/[0.06]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {isSyncing && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            background: [
              'radial-gradient(ellipse at 30% 20%, rgba(250,204,21,0.03) 0%, transparent 60%)',
              'radial-gradient(ellipse at 70% 80%, rgba(250,204,21,0.03) 0%, transparent 60%)',
              'radial-gradient(ellipse at 30% 20%, rgba(250,204,21,0.03) 0%, transparent 60%)',
            ],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      {isComplete && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.5] }}
          transition={{ duration: 0.6 }}
          style={{
            background: 'radial-gradient(ellipse at center, rgba(34,197,94,0.08) 0%, transparent 60%)',
          }}
        />
      )}

      <div className="relative p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className="relative"
              animate={isError ? {
                x: [0, -4, 4, -4, 4, 0],
              } : {}}
              transition={isError ? { duration: 0.4, ease: 'easeInOut' } : {}}
            >
              <CircularProgress
                progress={isComplete ? 100 : isError ? 100 : percent}
                state={syncState}
                size={64}
                strokeWidth={3}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  key={syncState}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'backOut' }}
                  className={`
                    ${isComplete ? 'text-green-400' : ''}
                    ${isError ? 'text-red-400' : ''}
                    ${syncState === 'idle' || isActive ? 'text-gold-400' : ''}
                  `}
                >
                  {syncState === 'complete' ? (
                    <motion.div
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    >
                      <CheckIcon />
                    </motion.div>
                  ) : syncState === 'error' ? (
                    <ErrorIcon />
                  ) : (
                    <SteamLogo />
                  )}
                </motion.div>
              </div>
              {isActive && (
                <motion.div
                  className="absolute -inset-1 rounded-full"
                  animate={{
                    boxShadow: [
                      '0 0 4px rgba(250,204,21,0.1)',
                      '0 0 12px rgba(250,204,21,0.2)',
                      '0 0 4px rgba(250,204,21,0.1)',
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
            </motion.div>

            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-white">Steam Sync</h3>
              <motion.p
                className="text-xs text-gray-400"
                key={syncState + metrics.currentGame}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {getStateMessage(syncState, metrics.currentGame)}
              </motion.p>
              {steamStatus?.isConnected && steamStatus.username && syncState === 'idle' && (
                <p className="text-[11px] text-gray-500">
                  Connected as <span className="text-gold-400">{steamStatus.username}</span>
                  {steamStatus.lastSync && ` \u00b7 synced ${getTimeAgo(steamStatus.lastSync)}`}
                </p>
              )}
            </div>
          </div>

          {isActive && (
            <motion.button
              onClick={handleCancel}
              className="shrink-0 w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-white flex items-center justify-center transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
              title="Cancel sync"
            >
              <CancelIcon />
            </motion.button>
          )}
        </div>

        {(isActive || isComplete || isError) && (
          <motion.div
            className="space-y-3"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <ProgressBar percent={isComplete ? 100 : isError ? 100 : percent} state={syncState} />

            <div className="grid grid-cols-3 gap-3">
              <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Games</p>
                <p className="text-sm font-bold text-white mt-0.5">
                  <AnimatedNumber value={metrics.gamesScanned} />
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Achievements</p>
                <p className="text-sm font-bold text-white mt-0.5">
                  <AnimatedNumber value={metrics.achievementsFetched} />
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                  {isComplete ? 'Status' : isError ? 'Status' : 'ETA'}
                </p>
                <p className="text-sm font-bold text-white mt-0.5">
                  {isComplete ? (
                    <motion.span
                      className="text-green-400"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    >
                      Done
                    </motion.span>
                  ) : isError ? (
                    <motion.span
                      className="text-red-400"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    >
                      Failed
                    </motion.span>
                  ) : (
                    <span className="text-gold-400">
                      {metrics.estimatedRemaining > 0
                        ? `${metrics.estimatedRemaining}s`
                        : '...'}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {metrics.currentGame && isSyncing && (
              <motion.div
                className="flex items-center gap-2 p-2.5 rounded-lg bg-gold-500/[0.04] border border-gold-500/10"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                key={metrics.currentGame}
              >
                <motion.div
                  className="w-1.5 h-1.5 rounded-full bg-gold-400 shrink-0"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                />
                <p className="text-[11px] text-gold-300/80 truncate">
                  {metrics.currentGame}
                </p>
              </motion.div>
            )}

            {isComplete && lastSyncResult && (
              <motion.div
                className="p-2.5 rounded-lg bg-green-500/[0.04] border border-green-500/10"
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, ease: 'easeOut', delay: 0.15 }}
              >
                <div className="flex items-center gap-2">
                  <motion.div
                    className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 12, delay: 0.3 }}
                  >
                    <svg viewBox="0 0 12 12" fill="none" className="w-2.5 h-2.5" stroke="#22c55e" strokeWidth="2.5">
                      <path d="M10 3L4.5 9l-2.5-2" />
                    </svg>
                  </motion.div>
                  <div>
                    <p className="text-[11px] text-green-400 font-medium">
                      {lastSyncResult.imported > 0 ? `${lastSyncResult.imported} new games imported` : 'All games up to date'}
                    </p>
                    <p className="text-[10px] text-green-500/60">
                      {lastSyncResult.updated} updated {lastSyncResult.errors > 0 ? `\u00b7 ${lastSyncResult.errors} errors` : ''}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {isError && showRetry && (
              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <button
                  onClick={handleRetry}
                  className="flex-1 py-2 rounded-lg bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-black font-semibold text-xs transition-all duration-300 active:scale-[0.97]"
                >
                  Retry Sync
                </button>
                <button
                  onClick={() => setSyncState('idle')}
                  className="px-4 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-white text-xs transition-all duration-200"
                >
                  Dismiss
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        <div className="pt-2 border-t border-white/[0.04]">
          <div className="flex items-center justify-between">
            {steamStatus?.isConnected ? (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-7 h-7 rounded-lg overflow-hidden ring-1 ring-gold-500/20">
                    {steamStatus.avatar && !avatarError ? (
                      <img
                        src={steamStatus.avatar}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={() => setAvatarError(true)}
                      />
                    ) : (
                      <div className="w-full h-full bg-gold-500/10 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-gold-400">S</span>
                      </div>
                    )}
                  </div>
                  <motion.div
                    className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500 border border-surface-900"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
                <span className="text-[11px] text-gray-400">
                  {steamStatus.username}
                </span>
              </div>
            ) : (
              <p className="text-[11px] text-gray-500">No Steam account connected</p>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={handleSync}
                disabled={isActive}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-black font-semibold text-[11px] transition-all duration-300 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {steamStatus?.isConnected ? 'Sync' : 'Connect'}
              </button>
              {steamStatus?.isConnected && (
                <button
                  onClick={handleDisconnect}
                  disabled={isActive}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-red-500/10 text-gray-400 hover:text-red-400 text-[11px] transition-all duration-200 disabled:opacity-50"
                >
                  Disconnect
                </button>
              )}
            </div>
          </div>
        </div>

        {logs.length > 0 && (
          <div>
            <button
              onClick={() => setLogsExpanded(!logsExpanded)}
              className="flex items-center gap-1.5 text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
            >
              <motion.svg
                viewBox="0 0 12 12"
                fill="none"
                className="w-3 h-3"
                stroke="currentColor"
                strokeWidth="1.5"
                animate={{ rotate: logsExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <path d="M3 5l3 3 3-3" />
              </motion.svg>
              Sync Log ({logs.length})
            </button>
            <AnimatePresence mode="wait">
              {logsExpanded && (
                <motion.div
                  key="sync-logs"
                  className="mt-2 max-h-32 overflow-y-auto space-y-0.5 rounded-lg bg-surface-900/50 p-2"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {logs.map((log, i) => (
                    <div
                      key={i}
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        log.type === 'error' ? 'text-red-400 bg-red-500/5' :
                        log.type === 'success' ? 'text-green-400 bg-green-500/5' :
                        log.type === 'game' ? 'text-gold-300 bg-gold-500/5' :
                        'text-gray-500'
                      }`}
                    >
                      <span className="text-gray-600">[{log.time}]</span> {log.message}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
