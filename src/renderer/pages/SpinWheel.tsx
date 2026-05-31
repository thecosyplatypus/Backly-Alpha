import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { GameStatus } from '../../shared/types';

const GOLD = '#facc15';
const NUM_WHEEL_GAMES = 30;
const FRICTION = 0.985;
const MIN_VELOCITY = 0.0008;
const FIXED_RADIUS = 280;
const ARC = Math.PI;
const ARC_START = 0;
const ARC_END = Math.PI;
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

function pickEligibleGames(games: any[], filter: string): any[] {
  const eligible = filter === 'random'
    ? [...games]
    : games.filter((g) => g.status === filter);
  if (eligible.length === 0) return [];
  return shuffleArray(eligible).slice(0, NUM_WHEEL_GAMES);
}

function getSegmentColor(index: number): string {
  const colors = [
    '#1a1f2e', '#2a1f1f', '#1a2a1e', '#2a2a1f', '#1f1f3e',
    '#3e1f1f', '#1f3e2a', '#3e2a1f', '#2a1f3e', '#1f2a2a',
    '#1e1e3e', '#2e1e1e', '#1e2e2a',
  ];
  return colors[index % colors.length];
}

const imageCache = new Map<string, HTMLImageElement>();

export default function SpinWheel() {
  const navigate = useNavigate();
  const { games, fetchGames, loading } = useGameStore();
  const [wheelGames, setWheelGames] = useState<any[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<any | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [poolFilter, setPoolFilter] = useState('random');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef(0);
  const velocityRef = useRef(0);
  const animFrameRef = useRef<number>(0);
  const spinningRef = useRef(false);
  const dimsRef = useRef({ w: 800, h: 600 });

  useEffect(() => {
    fetchGames({ limit: 2000, sort: 'recent' });
  }, []);

  useEffect(() => { spinningRef.current = spinning; }, [spinning]);

  const loadWheelGames = useCallback((games: any[], filter: string) => {
    const picked = pickEligibleGames(games, filter);
    setWheelGames(picked);
    setWinner(null);
    setShowResult(false);
    rotationRef.current = 0;
    velocityRef.current = 0;
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

  useEffect(() => {
    if (games.length > 0) {
      loadWheelGames(games, poolFilter);
    }
  }, [games, poolFilter, loadWheelGames]);

  const getCoverUrl = useCallback((game: any): string => {
    if (game.coverArt) return game.coverArt;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(game.title)}&background=1a1f2e&color=facc15&size=80&font-size=0.35&bold=true&format=png`;
  }, []);

  const drawWheel = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, angle: number) => {
    const n = wheelGames.length;
    if (n === 0) return;

    const cx = w / 2;
    const cy = h * 0.35;
    const radius = FIXED_RADIUS;
    const segAngle = ARC / n;

    ctx.clearRect(0, 0, w, h);

    const bgGrad = ctx.createRadialGradient(cx, cy - radius * 0.3, 0, cx, cy, radius * 1.3);
    bgGrad.addColorStop(0, '#141824');
    bgGrad.addColorStop(0.5, '#0f111a');
    bgGrad.addColorStop(1, '#06080e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    for (let i = 0; i < n; i++) {
      const start = ARC_START + i * segAngle;
      const end = start + segAngle;
      const midAngle = start + segAngle / 2;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, start, end, false);
      ctx.closePath();

      const baseColor = getSegmentColor(i);
      const segGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
      segGrad.addColorStop(0, baseColor);
      segGrad.addColorStop(0.6, baseColor);
      segGrad.addColorStop(1, '#06080e');
      ctx.fillStyle = segGrad;
      ctx.fill();

      ctx.strokeStyle = 'rgba(250, 204, 21, 0.06)';
      ctx.lineWidth = 1;
      ctx.stroke();

      const iconR = radius * 0.62;
      const ix = Math.cos(midAngle) * iconR;
      const iy = Math.sin(midAngle) * iconR;
      const iconSize = Math.max(20, radius * 0.07);

      ctx.save();
      ctx.translate(ix, iy);
      ctx.rotate(midAngle + Math.PI / 2);

      const r2 = iconSize / 2;
      ctx.beginPath();
      ctx.moveTo(r2, 0);
      ctx.arc(0, 0, r2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fillStyle = 'rgba(15,17,23,0.7)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(250,204,21,0.15)';
      ctx.lineWidth = 0.5;
      ctx.stroke();

      const game = wheelGames[i];
      const url = getCoverUrl(game);
      const cached = imageCache.get(url);
      if (cached && cached.complete && cached.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, r2 - 1, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(cached, -r2 + 1, -r2 + 1, iconSize - 2, iconSize - 2);
        ctx.restore();
      } else {
        ctx.fillStyle = 'rgba(250,204,21,0.3)';
        ctx.font = `bold ${r2 * 0.6}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(game.title.charAt(0).toUpperCase(), 0, 0);
      }

      ctx.restore();

      const textR = radius * 0.85;
      const tx = Math.cos(midAngle) * textR;
      const ty = Math.sin(midAngle) * textR;
      const textAngle = midAngle + Math.PI / 2;

      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(textAngle);

      const displayText = game.title.length > 14
        ? game.title.slice(0, 11) + '\u2026'
        : game.title;

      ctx.fillStyle = '#e2e8f0';
      ctx.font = `600 ${Math.max(9, Math.min(12, radius * 0.02))}px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur = 4;
      ctx.fillText(displayText, 0, 0);
      ctx.shadowBlur = 0;

      ctx.restore();
    }

    const outerGlow = ctx.createRadialGradient(0, 0, radius * 0.85, 0, 0, radius);
    outerGlow.addColorStop(0, 'rgba(250,204,21,0)');
    outerGlow.addColorStop(0.7, 'rgba(250,204,21,0.01)');
    outerGlow.addColorStop(1, 'rgba(250,204,21,0.05)');
    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, ARC_START, ARC_END, false);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    drawCenterHub(ctx, cx, cy);
    drawPointer(ctx, cx, cy, radius);
  }, [wheelGames, getCoverUrl]);

  function drawCenterHub(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
    const hubR = 36;

    ctx.save();
    ctx.translate(cx, cy);

    ctx.beginPath();
    ctx.arc(0, 0, hubR * 1.4, 0, Math.PI * 2);
    const outerGrad = ctx.createRadialGradient(0, -5, 0, 0, 0, hubR * 1.4);
    outerGrad.addColorStop(0, '#2a2d3a');
    outerGrad.addColorStop(0.5, '#1a1f2e');
    outerGrad.addColorStop(1, '#0f111a');
    ctx.fillStyle = outerGrad;
    ctx.fill();
    ctx.strokeStyle = `rgba(250,204,21,0.3)`;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = `rgba(250,204,21,0.2)`;
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.arc(0, 0, hubR, 0, Math.PI * 2);
    const innerGrad = ctx.createRadialGradient(-5, -5, 0, 0, 0, hubR);
    innerGrad.addColorStop(0, '#3d3020');
    innerGrad.addColorStop(0.5, '#2a2010');
    innerGrad.addColorStop(1, '#1a1508');
    ctx.fillStyle = innerGrad;
    ctx.fill();
    ctx.strokeStyle = `rgba(250,204,21,0.5)`;
    ctx.lineWidth = 1;
    ctx.shadowColor = `rgba(250,204,21,0.4)`;
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = GOLD;
    ctx.font = 'bold 20px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = `rgba(250,204,21,0.5)`;
    ctx.shadowBlur = 12;
    ctx.fillText('B', 0, 0.5);
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  function drawPointer(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) {
    const tipY = cy - 5;
    const arrowH = 22;
    const arrowW = 14;

    ctx.save();
    ctx.shadowColor = `rgba(250,204,21,0.5)`;
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.moveTo(cx, tipY);
    ctx.lineTo(cx - arrowW, tipY - arrowH);
    ctx.lineTo(cx + arrowW, tipY - arrowH);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, tipY, 0, tipY - arrowH);
    grad.addColorStop(0, '#ffd700');
    grad.addColorStop(1, '#eab308');
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.moveTo(cx, tipY - 1);
    ctx.lineTo(cx - arrowW * 0.7, tipY - arrowH + 2);
    ctx.lineTo(cx + arrowW * 0.7, tipY - arrowH + 2);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
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
    if (wheelGames.length === 0) return;

    const loop = () => {
      const vel = velocityRef.current;

      if (Math.abs(vel) > 0.0001) {
        rotationRef.current -= vel;

        if (spinningRef.current) {
          velocityRef.current *= FRICTION;
          if (Math.abs(velocityRef.current) < MIN_VELOCITY) {
            velocityRef.current = 0;
            spinningRef.current = false;
            setSpinning(false);

            const POINTER_ANGLE = -Math.PI / 2;
            const wheelAngle = ((POINTER_ANGLE - rotationRef.current) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
            const segAngle = ARC / wheelGames.length;
            const offsetFromStart = ((wheelAngle - ARC_START) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
            const winnerIndex = Math.min(Math.floor(offsetFromStart / segAngle), wheelGames.length - 1);
            const selectedWinner = wheelGames[winnerIndex];
            setWinner(selectedWinner);

            setTimeout(() => {
              setShowResult(true);
            }, 500);
          }
        }
      }

      renderFrame();
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
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

    const minSpeed = 0.3;
    const maxSpeed = 0.6;
    const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
    velocityRef.current = speed;
    spinningRef.current = true;
    setSpinning(true);
  }, [wheelGames.length]);

  const handleSpinAgain = useCallback(() => {
    if (games.length > 0) {
      loadWheelGames(games, poolFilter);
    }
  }, [games, poolFilter, loadWheelGames]);

  if (loading && games.length === 0) {
    return (
      <div className="content-area flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-gray-900 to-black" ref={containerRef}>
      <canvas ref={canvasRef} className="absolute inset-0 block" />

      <div className="absolute top-4 left-4 md:top-6 md:left-6 z-10">
        <h1 className="text-fluid-lg md:text-2xl font-bold text-gradient-gold">Spin Wheel</h1>
      </div>

      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-10 flex items-center gap-3">
        <select
          value={poolFilter}
          onChange={(e) => setPoolFilter(e.target.value)}
          className="input text-[10px] md:text-xs py-1.5 pr-6 md:pr-8"
        >
          {POOL_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <div className="px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10">
          <span className="text-[10px] md:text-xs font-medium text-gray-400">
            {wheelGames.length} games loaded
          </span>
        </div>
        <motion.button
          onClick={handleSpinAgain}
          disabled={spinning}
          whileTap={{ scale: 0.95 }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-gray-400 hover:text-white text-[10px] md:text-xs font-medium transition-all disabled:opacity-40"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 md:w-4 h-3.5 md:h-4">
            <path d="M1 4v6h6M23 20v-6h-6" />
            <path d="M20.49 9A9 9 0 005.64 5.64L1 10M22.54 14.01l-4.64 4.35a9 9 0 01-14.85-3.36" />
          </svg>
          Respin Pool
        </motion.button>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-3">
        <motion.button
          onClick={handleSpin}
          disabled={spinning || wheelGames.length === 0}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="group relative inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-gradient-to-b from-gold-500 to-yellow-600 hover:from-gold-400 hover:to-yellow-500 text-black font-black text-sm md:text-base tracking-wider uppercase transition-all duration-300 active:scale-[0.96] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 md:w-5 h-4 md:h-5">
            <path d="M12 2a10 10 0 0110 10M12 2v4M12 2l3 3M12 22A10 10 0 012 12M12 22v-4M12 22l-3-3M20 12h4M4 12H2M20 12l3-3M4 12l-2-3M17 7l3-3M7 17l-3 3" />
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

      <AnimatePresence>
        {showResult && winner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md mx-4 bg-gray-900 border border-gold-500/20 rounded-2xl p-6 md:p-8 shadow-[0_0_60px_rgba(250,204,21,0.12)]"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-gold-600 to-yellow-500 rounded-full text-black text-[10px] md:text-xs font-bold uppercase tracking-widest shadow-lg">
                Selected!
              </div>

              <div className="flex flex-col items-center gap-3 md:gap-4 mt-2">
                <div className="w-20 md:w-28 h-24 md:h-32 rounded-xl overflow-hidden ring-2 ring-gold-500/30">
                  <img
                    src={winner.coverArt || `https://ui-avatars.com/api/?name=${encodeURIComponent(winner.title)}&background=1a1f2e&color=facc15&size=128`}
                    alt={winner.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <h2 className="text-fluid-lg md:text-2xl font-bold text-white text-center">{winner.title}</h2>

                <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 text-[10px] md:text-xs text-gray-400">
                  <span className="px-2 py-0.5 rounded-md bg-gray-800 border border-white/10">
                    {Math.round(winner.hoursPlayed)}h played
                  </span>
                  {winner.genre && (
                    <span className="px-2 py-0.5 rounded-md bg-gray-800 border border-white/10">
                      {winner.genre}
                    </span>
                  )}
                  {winner.status && (
                    <span className="px-2 py-0.5 rounded-md bg-gray-800 border border-white/10 capitalize">
                      {winner.status.toLowerCase()}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 md:gap-3 mt-1 w-full">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/game/${winner.id}`)}
                    className="flex-1 py-2.5 md:py-3 rounded-xl bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-black font-semibold text-[11px] md:text-sm transition-all active:scale-[0.97]"
                  >
                    View Details
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { handleSpinAgain(); setShowResult(false); }}
                    className="flex-1 py-2.5 md:py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-semibold text-[11px] md:text-sm transition-all active:scale-[0.97] border border-white/10"
                  >
                    Spin Again
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
  );
}
