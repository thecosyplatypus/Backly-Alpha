import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { GameStatus } from '../../shared/types';

const GOLD = '#facc15';
const MAX_WHEEL_GAMES_OPTIONS = [10, 15, 20, 25, 30];
const WHEEL_RADIUS = 750;
const TEXT_RADIUS = 700;
const ICON_RADIUS = 580;
const ICON_SIZE = 78;
const HUB_RADIUS = 165;
const ARROW_H = 105;
const ARROW_W = 60;

const ARC = 2 * Math.PI;
const ARC_START = 0;

const IDLE_ROTATION_SPEED = 0.003;
const POINTER_ANGLE = -Math.PI / 2;

const POOL_FILTER_OPTIONS = [
  { value: 'random', label: 'Random' },
  { value: GameStatus.BACKLOG, label: 'Backlog' },
  { value: GameStatus.STARTED, label: 'Started' },
  { value: GameStatus.PLAYING, label: 'Playing' },
  { value: GameStatus.ALMOST_COMPLETED, label: 'Almost Completed' },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickEligibleGames(games: any[], filter: string, max: number): any[] {
  const eligible = filter === 'random'
    ? [...games]
    : games.filter((g) => g.status === filter);
  if (eligible.length === 0) return [];
  return shuffleArray(eligible).slice(0, max);
}

function getSegmentHsl(index: number): string {
  const hue = ((index * 18) + 220) % 360;
  const saturation = 25 + (index % 4) * 8;
  const lightness = 15 + (index % 3) * 4;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

const imageCache = new Map<string, HTMLImageElement>();

export default function SpinWheel() {
  const navigate = useNavigate();
  const games = useGameStore(s => s.games);
  const fetchGames = useGameStore(s => s.fetchGames);
  const loading = useGameStore(s => s.loading);
  const [wheelGames, setWheelGames] = useState<any[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<any | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [poolFilter, setPoolFilter] = useState('random');
  const [maxGames, setMaxGames] = useState(30);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);
  const spinningRef = useRef(false);
  const mountedRef = useRef(true);
  const resultTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spinStateRef = useRef<{
    startTime: number;
    startRotation: number;
    duration: number;
    totalRotation: number;
  } | null>(null);
  const dimsRef = useRef({ w: 800, h: 600 });

  useEffect(() => {
    fetchGames({ limit: 2000, sort: 'recent' });
  }, []);

  useEffect(() => { spinningRef.current = spinning; }, [spinning]);

  const loadWheelGames = useCallback((games: any[], filter: string, max: number) => {
    const picked = pickEligibleGames(games, filter, max);
    setWheelGames(picked);
    setWinner(null);
    setShowResult(false);
    rotationRef.current = 0;
    imageCache.clear();
    picked.forEach((g) => {
      if (g.coverArt && !imageCache.has(g.coverArt)) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = g.coverArt;
        imageCache.set(g.coverArt, img);
      }
    });
  }, []);

  const initializedRef = useRef(false);

  useEffect(() => {
    if (games.length > 0 && !initializedRef.current) {
      initializedRef.current = true;
      loadWheelGames(games, poolFilter, maxGames);
    }
  }, [games, loadWheelGames, poolFilter, maxGames]);

  useEffect(() => {
    if (initializedRef.current) {
      loadWheelGames(games, poolFilter, maxGames);
    }
  }, [poolFilter, maxGames, loadWheelGames, games]);

  const getCoverUrl = useCallback((game: any): string => {
    if (game.coverArt) return game.coverArt;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(game.title)}&background=1a1f2e&color=facc15&size=80&font-size=0.35&bold=true&format=png`;
  }, []);

  const drawWheel = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, angle: number) => {
    const n = wheelGames.length;
    if (n === 0) return;

    const cx = w / 2;
    const cy = h;
    const segAngle = ARC / n;

    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, w, h);

    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, WHEEL_RADIUS * 1.1);
    glow.addColorStop(0, 'rgba(26,26,26,0.3)');
    glow.addColorStop(0.8, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    for (let i = 0; i < n; i++) {
      const start = ARC_START + i * segAngle;
      const end = start + segAngle;
      const mid = start + segAngle / 2;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, WHEEL_RADIUS, start, end, false);
      ctx.closePath();

      ctx.fillStyle = getSegmentHsl(i);
      ctx.fill();

      ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();

      const ix = Math.cos(mid) * ICON_RADIUS;
      const iy = Math.sin(mid) * ICON_RADIUS;
      ctx.save();
      ctx.translate(ix, iy);
      ctx.rotate(mid + Math.PI / 2);
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.arc(0, 0, ICON_SIZE / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(250,204,21,0.12)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
      const game = wheelGames[i];
      const url = getCoverUrl(game);
      const cached = imageCache.get(url);
      if (cached && cached.complete && cached.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, ICON_SIZE / 2 - 1, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(cached, -ICON_SIZE / 2 + 1, -ICON_SIZE / 2 + 1, ICON_SIZE - 2, ICON_SIZE - 2);
        ctx.restore();
      } else {
        ctx.fillStyle = 'rgba(250,204,21,0.3)';
        ctx.font = `bold ${ICON_SIZE * 0.4}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(game.title.charAt(0).toUpperCase(), 0, 0);
      }
      ctx.restore();

      const tx = Math.cos(mid) * TEXT_RADIUS;
      const ty = Math.sin(mid) * TEXT_RADIUS;
      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(mid + Math.PI / 2);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '600 18px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur = 4;
      const displayText = game.title.length > 18
        ? game.title.slice(0, 15) + '\u2026'
        : game.title;
      ctx.fillText(displayText, 0, 0);
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    ctx.restore();

    drawPointer(ctx, cx, cy);
  }, [wheelGames, getCoverUrl]);

  function drawPointer(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
    const tipY = cy - WHEEL_RADIUS - 15;

    ctx.save();
    ctx.shadowColor = 'rgba(250,204,21,0.5)';
    ctx.shadowBlur = 12;

    ctx.beginPath();
    ctx.moveTo(cx, tipY);
    ctx.lineTo(cx - ARROW_W, tipY - ARROW_H);
    ctx.lineTo(cx + ARROW_W, tipY - ARROW_H);
    ctx.closePath();

    const grad = ctx.createLinearGradient(cx - ARROW_W, tipY - ARROW_H, cx + ARROW_W, tipY - ARROW_H);
    grad.addColorStop(0, '#FFD700');
    grad.addColorStop(0.5, '#FFA500');
    grad.addColorStop(1, '#D4AF37');
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.moveTo(cx, tipY - 15);
    ctx.lineTo(cx - 54, tipY - 78);
    ctx.lineTo(cx + 54, tipY - 78);
    ctx.closePath();
    ctx.fillStyle = 'rgba(212, 175, 55, 0.3)';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx, tipY - 36);
    ctx.lineTo(cx - 36, tipY - 90);
    ctx.lineTo(cx + 36, tipY - 90);
    ctx.closePath();
    ctx.fillStyle = '#D4AF37';
    ctx.fill();

    ctx.restore();
  }

  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const { w, h } = dimsRef.current;
    ctx.save();
    ctx.scale(dpr, dpr);
    drawWheel(ctx, w, h, rotationRef.current);
    ctx.restore();
  }, [drawWheel]);

  useEffect(() => {
    mountedRef.current = true;
    if (wheelGames.length === 0) return;

    const loop = () => {
      if (spinningRef.current && spinStateRef.current) {
        const { startTime, startRotation, duration, totalRotation } = spinStateRef.current;
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        rotationRef.current = startRotation + totalRotation * eased;

        if (progress >= 1) {
          spinningRef.current = false;
          setSpinning(false);
          spinStateRef.current = null;

          const wheelAngle = ((POINTER_ANGLE - rotationRef.current) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
          const segAngle = ARC / wheelGames.length;
          const offsetFromStart = ((wheelAngle - ARC_START) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
          const winnerIndex = Math.min(Math.floor(offsetFromStart / segAngle), wheelGames.length - 1);
          setWinner(wheelGames[winnerIndex]);
          console.log('[SPIN] Winner:', wheelGames[winnerIndex]?.title, 'index:', winnerIndex);
          resultTimerRef.current = setTimeout(() => { if (mountedRef.current) setShowResult(true); console.log('[SPIN] showResult=true'); }, 500);
        }
      } else if (!document.hidden) {
        rotationRef.current += IDLE_ROTATION_SPEED;
      }
      renderFrame();
      if (!document.hidden) {
        animFrameRef.current = requestAnimationFrame(loop);
      }
    };

    const onVisibility = () => {
      if (!document.hidden) {
        animFrameRef.current = requestAnimationFrame(loop);
      } else if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      mountedRef.current = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [wheelGames, renderFrame]);

  const handleResize = useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    dimsRef.current = { w: rect.width, h: rect.height };

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  const handleSpin = useCallback(() => {
    if (spinningRef.current || wheelGames.length === 0) return;
    setWinner(null);
    setShowResult(false);

    spinStateRef.current = {
      startTime: performance.now(),
      startRotation: rotationRef.current,
      duration: 2000 + Math.random() * 1000,
      totalRotation: 4 * Math.PI + Math.random() * 2 * Math.PI,
    };
    spinningRef.current = true;
    setSpinning(true);
  }, [wheelGames]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (spinningRef.current || wheelGames.length === 0) return;
    const randomIndex = Math.floor(Math.random() * wheelGames.length);
    navigate(`/game/${wheelGames[randomIndex].id}`);
  }, [wheelGames, navigate]);

  const handleSpinAgain = useCallback(() => {
    if (games.length > 0) {
      loadWheelGames(games, poolFilter, maxGames);
    }
  }, [games, poolFilter, maxGames, loadWheelGames]);

  if (loading && games.length === 0) {
    return (
      <div className="content-area flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div
        className="relative w-full h-screen overflow-hidden"
        ref={containerRef}
        style={{ background: 'radial-gradient(circle at 50% 95%, #1a1a1a 0%, #0a0a0a 100%)' }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 block"
          onClick={handleCanvasClick}
          style={{ cursor: spinning ? 'default' : 'pointer' }}
        />

        <div className="absolute top-4 left-4 md:top-6 md:left-6 z-10">
          <div className="px-5 py-2 rounded-xl bg-black/60 backdrop-blur-xl border border-white/10">
            <h1 className="text-fluid-lg md:text-xl font-bold text-gold-400">Spin Wheel</h1>
          </div>
        </div>

        <div className="absolute top-4 right-4 md:top-6 md:right-6 z-10 flex items-center gap-3">
          <select
            value={poolFilter}
            onChange={(e) => setPoolFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-gray-800/80 backdrop-blur-xl border border-white/10 text-[11px] md:text-xs text-gray-300 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
          >
            {POOL_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={maxGames}
            onChange={(e) => setMaxGames(Number(e.target.value))}
            className="px-3 py-2 rounded-lg bg-gray-800/80 backdrop-blur-xl border border-white/10 text-[11px] md:text-xs text-gray-300 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
          >
            {MAX_WHEEL_GAMES_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <div className="px-3 py-2 rounded-lg bg-gray-800/80 backdrop-blur-xl border border-white/10">
            <span className="text-[11px] md:text-xs text-gray-300">
              {wheelGames.length} games loaded
            </span>
          </div>
          <button
            onClick={handleSpinAgain}
            disabled={spinning}
            className="px-3 py-2 rounded-lg bg-gray-800/80 backdrop-blur-xl border border-white/10 text-gray-300 hover:bg-gray-700/80 transition-colors disabled:opacity-40"
            title="Respin Pool"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-3">
          <motion.button
            onClick={handleSpin}
            disabled={spinning || wheelGames.length === 0}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="group relative inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-black text-sm md:text-base tracking-wider uppercase shadow-lg transition-all duration-300 active:scale-[0.96] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {spinning ? 'Spinning\u2026' : 'SPIN!'}
          </motion.button>
          {spinning && (
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-gold-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
              <span className="text-[10px] text-gold-400 font-medium tracking-wider uppercase">Spinning\u2026</span>
            </div>
          )}
        </div>

        {wheelGames.length === 0 && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            <div className="w-14 h-14 rounded-2xl bg-gray-800/60 border border-white/10 flex items-center justify-center mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="#facc15" strokeWidth="1.5" className="w-7 h-7">
                <path d="M12 2a10 10 0 0110 10M12 2v4M12 2l3 3M12 22A10 10 0 012 12M12 22v-4M12 22l-3-3M20 12h4M4 12H2M20 12l3-3M4 12l-2-3M17 7l3-3M7 17l-3 3" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">No eligible games</h3>
            <p className="text-[11px] text-gray-500 max-w-[240px] text-center leading-relaxed">
              Add games to your backlog or start playing to load the wheel.
            </p>
          </div>
        )}
      </div>

      {showResult && winner && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
            className="relative bg-[#0a0a0a] text-[#FFD700] p-10 rounded-2xl text-center shadow-2xl border border-[#FFD700]/30 max-w-md w-full mx-4"
          >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full bg-[#FFD700] text-[#0a0a0a] font-black text-sm tracking-widest uppercase shadow-lg">
              Winner
            </div>
            <div className="mt-6 mb-4">
              <img
                src={getCoverUrl(winner)}
                alt={winner.title}
                className="w-24 h-24 mx-auto mb-3 rounded-2xl border-2 border-[#FFD700]/40 object-cover shadow-lg"
              />
              <svg className="w-12 h-12 mx-auto mb-1 text-[#FFD700]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <div className="text-3xl font-black text-[#FFD700]">WINNER!</div>
            </div>
            <div className="my-4 text-xl font-bold text-[#FFD700] drop-shadow-lg">
              {winner.title}
            </div>
            <div className="flex gap-3 justify-center mt-6">
              <button
                onClick={() => navigate(`/game/${winner.id}`)}
                className="flex-1 px-5 py-3 rounded-xl bg-[#FFD700] text-[#0a0a0a] font-bold text-sm hover:brightness-110 transition-all active:scale-95"
              >
                View Details
              </button>
              <button
                onClick={() => { handleSpinAgain(); setShowResult(false); }}
                className="flex-1 px-5 py-3 rounded-xl bg-[#FFD700]/10 text-[#FFD700] font-bold text-sm hover:bg-[#FFD700]/20 transition-all active:scale-95 border border-[#FFD700]/30"
              >
                Spin Again
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}
