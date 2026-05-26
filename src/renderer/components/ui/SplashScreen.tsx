import { useEffect, useRef, useState } from 'react';

interface Props {
  onFinish: () => void;
}

const LOADING_PHASES = [
  'Initializing...',
  'Loading your library...',
  'Preparing dashboard...',
  'Syncing achievements...',
  'Loading artwork...',
  'Ready to play!',
];

const TARGET_PROGRESS = [5, 20, 40, 60, 80, 100];
const PHASE_DURATIONS = [700, 900, 900, 900, 900, 700];

const BG_COLORS = [
  'rgba(234,179,8,0.08)',
  'rgba(212,168,0,0.06)',
  'rgba(255,255,255,0.03)',
];

const ORB_SIZES = ['w-[600px] h-[600px]', 'w-[500px] h-[500px]', 'w-[400px] h-[400px]'];
const ORB_POSITIONS = ['top-[-10%] left-[-5%]', 'bottom-[-10%] right-[-10%]', 'top-[40%] left-[40%]'];
const ORB_DURATIONS = ['20s', '18s', '22s'];
const ORB_DELAYS = ['0s', '-5s', '-10s'];

export default function SplashScreen({ onFinish }: Props) {
  const [phase, setPhase] = useState<'enter' | 'visible' | 'exit'>('enter');
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState(LOADING_PHASES[0]);
  const [showStats, setShowStats] = useState(false);
  const [counts, setCounts] = useState({ games: 0, achievements: 0, hours: 0 });
  const progressRef = useRef(0);
  const animFrameRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    const startTime = Date.now();
    let phaseIndex = 0;
    let phaseStart = startTime;

    requestAnimationFrame(() => setPhase('visible'));

    const fetchRealStats = async () => {
      try {
        const stats = await window.backly.getDashboardStats();
        if (!mountedRef.current) return;
        setCounts({
          games: stats.totalGames || 0,
          achievements: stats.achievementCount || stats.achievements || 0,
          hours: Math.round(stats.totalHoursPlayed || 0),
        });
      } catch {
        // fall back to zeros (will animate from 0)
      }
    };

    const animate = () => {
      if (!mountedRef.current) return;
      const now = Date.now();
      const elapsed = now - phaseStart;
      const duration = PHASE_DURATIONS[phaseIndex] || 900;
      const t = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - t, 3);

      const startPct = phaseIndex === 0 ? 0 : TARGET_PROGRESS[phaseIndex - 1];
      const endPct = TARGET_PROGRESS[phaseIndex];
      const current = Math.round(startPct + (endPct - startPct) * easeOut);

      progressRef.current = current;
      setProgress(current);
      setLoadingText(LOADING_PHASES[phaseIndex]);

      if (t >= 1) {
        setProgress(endPct);
        phaseIndex++;

        if (phaseIndex >= TARGET_PROGRESS.length) {
          const totalElapsed = Date.now() - startTime;
          const minTime = 2000;
          const remaining = Math.max(0, minTime - totalElapsed);
          setTimeout(() => {
            if (!mountedRef.current) return;
            setPhase('exit');
            setTimeout(onFinish, 800);
          }, remaining + 400);
          return;
        }

        if (phaseIndex >= 3 && !showStats) {
          setShowStats(true);
          fetchRealStats();
        }

        phaseStart = Date.now();
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      mountedRef.current = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-surface-950 select-none ${
        phase === 'enter'
          ? 'opacity-0'
          : 'opacity-100'
        } ${
          phase === 'exit'
            ? 'opacity-0 scale-110 blur-sm'
            : ''
        }`}
      style={{ transition: 'opacity 0.7s ease, transform 0.7s ease, filter 0.7s ease' }}
    >
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`absolute rounded-full ${ORB_SIZES[i]} ${ORB_POSITIONS[i]}`}
            style={{
              background: `radial-gradient(circle, ${BG_COLORS[i] ?? ''}, transparent)`,
              animation: `float ${ORB_DURATIONS[i] || '20s'} ease-in-out infinite`,
              animationDelay: ORB_DELAYS[i] || '0s',
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Logo & Branding */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gold-500/20 to-yellow-500/10 border border-gold-500/20 flex items-center justify-center">
            <span className="text-3xl font-black text-gold-400">B</span>
          </div>
          <h1 className="text-3xl font-bold text-gradient-gold">Backly</h1>
          <p className="text-xs text-gray-500 tracking-[0.3em] uppercase">Premium Gaming Dashboard</p>
        </div>

        {/* Progress Ring */}
        <div className="relative w-32 h-32">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="url(#progressGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-none"
              style={{
                filter: 'drop-shadow(0 0 6px rgba(255,215,0,0.4))',
                strokeDashoffset: offset,
                transition: 'stroke-dashoffset 0.15s ease-out',
              }}
            />
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f5c400" />
                <stop offset="100%" stopColor="#ffd700" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-gold-400">{progress}%</span>
          </div>
        </div>

        {/* Loading dots & text */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-1.5">
            {[0, 150, 300].map((delay) => (
              <div
                key={delay}
                className="w-2 h-2 rounded-full bg-gold-400 animate-bounce"
                style={{ animationDelay: `${delay}ms`, animationDuration: '1s' }}
              />
            ))}
          </div>
          <p className="text-sm text-gold-400/80 font-medium">{loadingText}</p>
        </div>

        {/* Startup Stats */}
        <div
          className={`flex gap-4 transition-all duration-700 delay-300 ${
            showStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {[
            { label: 'Games', value: counts.games },
            { label: 'Achievements', value: counts.achievements },
            { label: 'Hours', value: counts.hours },
          ].map((stat) => (
            <div
              key={stat.label}
              className="text-center p-3 rounded-xl bg-white/[0.03] border border-gold-500/10 min-w-[80px]"
            >
              <span className="block text-xl font-bold text-gold-400">{stat.value}</span>
              <span className="block text-[10px] text-gray-500 uppercase tracking-wider mt-1">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 text-center">
        <p className="text-[10px] text-gray-600">Optimizing for optimal gaming experience</p>
      </div>
    </div>
  );
}
