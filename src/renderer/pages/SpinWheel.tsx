import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { GameStatus } from '../../shared/types';

const GOLD = '#facc15';
const GOLD_RGB = '250,204,21';
const NUM_WHEEL_GAMES = 30;
const ARROW_KICK_STRENGTH = 0.45;

const PLATFORM_COLORS: Record<string, string> = {
  pc: '#1b2838', steam: '#1b2838', playstation: '#003791', 'ps5': '#003791',
  xbox: '#107c10', nintendo: '#e60012',
};

const PLATFORM_ICONS: Record<string, string> = {
  steam: 'S', playstation: 'P', ps5: 'P5', xbox: 'X', nintendo: 'N',
};

function SpinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 md:w-5 h-4 md:h-5">
      <path d="M12 2a10 10 0 0110 10M12 2v4M12 2l3 3M12 22A10 10 0 012 12M12 22v-4M12 22l-3-3M20 12h4M4 12H2M20 12l3-3M4 12l-2-3M17 7l3-3M7 17l-3 3" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 md:w-4 h-3.5 md:h-4">
      <path d="M1 4v6h6M23 20v-6h-6" />
      <path d="M20.49 9A9 9 0 005.64 5.64L1 10M22.54 14.01l-4.64 4.35a9 9 0 01-14.85-3.36" />
    </svg>
  );
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickEligibleGames(games: any[]): any[] {
  const eligible = games.filter((g) => {
    const status = g.status as GameStatus;
    return status === GameStatus.BACKLOG || status === GameStatus.PLAYING;
  });
  if (eligible.length === 0) return [];
  const shuffled = shuffleArray(eligible);
  const backlog = shuffled.filter((g) => g.status === GameStatus.BACKLOG);
  const playing = shuffled.filter((g) => g.status === GameStatus.PLAYING);
  const selected: any[] = [];
  const backlogCount = Math.min(backlog.length, Math.floor(NUM_WHEEL_GAMES * 0.7));
  const playingCount = Math.min(playing.length, NUM_WHEEL_GAMES - backlogCount);
  selected.push(...backlog.slice(0, backlogCount));
  selected.push(...playing.slice(0, playingCount));
  if (selected.length === 0) return [];
  return shuffleArray(selected).slice(0, NUM_WHEEL_GAMES);
}

function getInitials(name: string): string {
  return name.split(/[\s-]+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function getSegmentColor(index: number): string {
  const colors = [
    '#1a1f2e', '#2a1f1f', '#1a2a1e', '#2a2a1f', '#1f1f3e',
    '#3e1f1f', '#1f3e2a', '#3e2a1f', '#2a1f3e', '#1f2a2a',
    '#1e1e3e', '#2e1e1e', '#1e2e2a',
  ];
  return colors[index % colors.length];
}

function hasRarity(index: number): { rare: boolean; color: string } {
  const rareIndices = [3, 7, 13, 17, 22, 27];
  const isRare = rareIndices.includes(index);
  return {
    rare: isRare,
    color: isRare ? `rgba(168,85,247,0.15)` : 'transparent',
  };
}

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  size: number; color: string;
}

export default function SpinWheel() {
  const navigate = useNavigate();
  const { games, fetchGames, loading } = useGameStore();
  const [wheelGames, setWheelGames] = useState<any[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<any | null>(null);
  const [showResult, setShowResult] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef(0);
  const velocityRef = useRef(0);
  const animFrameRef = useRef<number>(0);
  const spinningRef = useRef(false);
  const winnerRef = useRef<any | null>(null);
  const pulsePhaseRef = useRef(0);
  const renderPulseRef = useRef(false);
  const particlesRef = useRef<Particle[]>([]);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const canvasDimsRef = useRef({ w: 800, h: 600 });
  const wheelCenterRef = useRef({ x: 400, y: 500 });
  const wheelRadiusRef = useRef(400);
  const segAngleRef = useRef((2 * Math.PI) / NUM_WHEEL_GAMES);
  const arrowAngleRef = useRef(0);
  const arrowVelocityRef = useRef(0);
  const prevPinAnglesRef = useRef<number[]>([]);
  const lastHitIndexRef = useRef(-1);
  const pinHitCooldownRef = useRef(0);
  const arrowGlowRef = useRef(0);

  useEffect(() => {
    fetchGames({ limit: 2000, sort: 'recent' });
  }, []);

  useEffect(() => { spinningRef.current = spinning; }, [spinning]);
  useEffect(() => { winnerRef.current = winner; }, [winner]);

  useEffect(() => {
    if (games.length > 0) {
      const picked = pickEligibleGames(games);
      setWheelGames(picked);
      setWinner(null);
      setShowResult(false);
      rotationRef.current = 0;
      velocityRef.current = 0;
    }
  }, [games]);

  const getCoverUrl = useCallback((game: any): string => {
    if (game.coverArt) return game.coverArt;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(game.title)}&background=1a1f2e&color=facc15&size=128&font-size=0.35&bold=true&format=png`;
  }, []);

  const loadImage = useCallback((url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve) => {
      if (imageCacheRef.current.has(url)) {
        resolve(imageCacheRef.current.get(url)!);
        return;
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imageCacheRef.current.set(url, img);
        resolve(img);
      };
      img.onerror = () => resolve(img);
      img.src = url;
    });
  }, []);

  const updateCanvasSize = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const w = Math.ceil(rect.width);
    const h = Math.ceil(rect.height);
    const dpr = window.devicePixelRatio || 1;
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    }
    const arrowSpace = 55;
    const bottomSpace = 90;
    const availableH = h - arrowSpace - bottomSpace;
    const maxDim = Math.min(w, availableH);
    const radius = Math.max(150, maxDim * 0.44);
    const cx = w / 2;
    const cy = arrowSpace + availableH / 2;
    wheelCenterRef.current = { x: cx, y: cy };
    wheelRadiusRef.current = radius;
    segAngleRef.current = (2 * Math.PI) / Math.max(1, wheelGames.length || NUM_WHEEL_GAMES);
    canvasDimsRef.current = { w, h };
  }, [wheelGames.length]);

  useEffect(() => {
    updateCanvasSize();
    const container = containerRef.current;
    if (!container) return;
    let rafId: number;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => updateCanvasSize());
    });
    observer.observe(container);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [updateCanvasSize]);

  const drawWheel = useCallback((rotation: number, ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const cx = wheelCenterRef.current.x;
    const cy = wheelCenterRef.current.y;
    const radius = wheelRadiusRef.current;
    const n = wheelGames.length;
    const segAngle = segAngleRef.current;
    if (n === 0) return;

    ctx.clearRect(0, 0, w, h);

    const gradient = ctx.createRadialGradient(cx, cy - radius * 0.3, 0, cx, cy, radius * 1.3);
    gradient.addColorStop(0, '#121212');
    gradient.addColorStop(0.5, '#0a0a0a');
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    const TOP = -Math.PI / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);

    for (let i = 0; i < n; i++) {
      const start = TOP + i * segAngle;
      const end = start + segAngle;
      const midAngle = start + segAngle / 2;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, start, end);
      ctx.closePath();

      const segGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
      const baseColor = getSegmentColor(i);
      segGrad.addColorStop(0, lighten(baseColor, 15));
      segGrad.addColorStop(0.6, baseColor);
      segGrad.addColorStop(1, darken(baseColor, 10));
      ctx.fillStyle = segGrad;
      ctx.fill();

      ctx.strokeStyle = 'rgba(250, 204, 21, 0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();

      const rarity = hasRarity(i);
      if (rarity.rare) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, start, end);
        ctx.closePath();
        ctx.fillStyle = rarity.color;
        ctx.fill();
        ctx.restore();
      }

      if (renderPulseRef.current && winner && wheelGames[i].id === winner.id) {
        const pulse = 0.4 + 0.6 * Math.abs(Math.sin(pulsePhaseRef.current));
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, start, end);
        ctx.closePath();
        ctx.fillStyle = `rgba(250, 204, 21, ${0.08 * pulse})`;
        ctx.fill();
        ctx.shadowColor = `rgba(250, 204, 21, ${0.15 * pulse})`;
        ctx.shadowBlur = 20 * pulse;
        ctx.strokeStyle = `rgba(250, 204, 21, ${0.3 * pulse})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      const iconRadius = radius * 0.88;
      const game = wheelGames[i];
      const url = getCoverUrl(game);

      ctx.save();
      ctx.rotate(midAngle);
      ctx.translate(iconRadius, 0);

      const iconSize = Math.max(14, radius * 0.065);
      const borderRadius = 3;

      const ic = iconSize;
      roundRect(ctx, -ic / 2, -ic / 2, ic, ic, borderRadius);
      ctx.fillStyle = 'rgba(15,17,23,0.7)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(250,204,21,0.1)';
      ctx.lineWidth = 0.5;
      ctx.stroke();

      const cached = imageCacheRef.current.get(url);
      if (cached && cached.complete && cached.naturalWidth > 0) {
        ctx.save();
        roundRect(ctx, -ic / 2, -ic / 2, ic, ic, borderRadius);
        ctx.clip();
        ctx.drawImage(cached, -ic / 2, -ic / 2, ic, ic);
        ctx.restore();
      } else {
        ctx.fillStyle = 'rgba(250,204,21,0.3)';
        ctx.font = `bold ${Math.max(6, ic * 0.4)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(getInitials(game.title), 0, 0);
      }

      ctx.restore();

      ctx.save();
      ctx.rotate(midAngle);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      const fontSize = Math.max(8, Math.min(11, radius * 0.019));
      ctx.font = `600 ${fontSize}px "Inter","Segoe UI",sans-serif`;

      const displayText = game.title.length > 16
        ? game.title.slice(0, 14) + '\u2026'
        : game.title;

      const textX = iconRadius - iconSize * 0.5 - 5 - (rarity.rare ? 4 : 0);
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(displayText, textX, 0);
      ctx.shadowBlur = 0;

      ctx.restore();

      const plat = (game.platform || 'pc').toLowerCase();
      if (PLATFORM_ICONS[plat]) {
        ctx.save();
        ctx.rotate(midAngle);
        ctx.translate(radius - 3, 0);
        const badgeSize = Math.max(8, radius * 0.032);
        const badgeBg = PLATFORM_COLORS[plat] || '#333';
        roundRect(ctx, -badgeSize / 2, -badgeSize / 2, badgeSize, badgeSize, 2);
        ctx.fillStyle = badgeBg;
        ctx.globalAlpha = 0.7;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${badgeSize * 0.5}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(PLATFORM_ICONS[plat], 0, 0.5);
        ctx.restore();
      }

      if (rarity.rare) {
        ctx.save();
        ctx.rotate(midAngle);
        ctx.translate(radius - 3, 0);
        const starSize = Math.max(5, radius * 0.025);
        ctx.fillStyle = 'rgba(168,85,247,0.6)';
        ctx.font = `${starSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('\u2605', 0, -starSize * 1.6);
        ctx.restore();
      }

      const pinAngle = start;
      ctx.save();
      ctx.rotate(pinAngle);
      const pinHeight = Math.max(6, radius * 0.025);
      const pinWidth = Math.max(3, radius * 0.012);
      ctx.beginPath();
      ctx.moveTo(0, radius - pinHeight * 0.3);
      ctx.lineTo(-pinWidth, radius + pinHeight * 0.7);
      ctx.lineTo(pinWidth, radius + pinHeight * 0.7);
      ctx.closePath();
      const pinGrad = ctx.createLinearGradient(0, radius - pinHeight, 0, radius + pinHeight);
      pinGrad.addColorStop(0, '#3d3020');
      pinGrad.addColorStop(0.5, GOLD);
      pinGrad.addColorStop(1, '#8a6f20');
      ctx.fillStyle = pinGrad;
      ctx.fill();
      ctx.strokeStyle = `rgba(${GOLD_RGB},0.3)`;
      ctx.lineWidth = 0.5;
      ctx.stroke();

      const highlightY = radius + pinHeight * 0.1;
      ctx.beginPath();
      ctx.arc(0, highlightY, pinWidth * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${0.15 + 0.1 * Math.abs(Math.sin(pinAngle * 3))})`;
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();

    const lightGrad = ctx.createRadialGradient(cx, cy - radius * 0.5, 0, cx, cy, radius);
    lightGrad.addColorStop(0, 'rgba(250,204,21,0.02)');
    lightGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = lightGrad;
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

    const shadowGrad = ctx.createRadialGradient(cx, cy + radius * 0.1, radius * 0.2, cx, cy + radius * 0.1, radius * 1.1);
    shadowGrad.addColorStop(0, 'rgba(0,0,0,0)');
    shadowGrad.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    drawCenterHub(ctx, cx, cy, radius);
    drawBottomVignette(ctx, w, h);
  }, [wheelGames, winner, getCoverUrl]);

  function drawCenterHub(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) {
    const hubRadius = Math.max(24, radius * 0.06);
    const outerRadius = hubRadius * 1.3;
    const isSpinning = spinningRef.current;
    const hasWinner = winnerRef.current !== null;

    ctx.save();

    const hubGrad = ctx.createRadialGradient(cx, cy - hubRadius * 0.3, 0, cx, cy, outerRadius);
    hubGrad.addColorStop(0, '#2a2d3a');
    hubGrad.addColorStop(0.5, '#1a1f2e');
    hubGrad.addColorStop(1, '#0f111a');
    ctx.beginPath();
    ctx.arc(cx, cy, outerRadius, 0, Math.PI * 2);
    ctx.fillStyle = hubGrad;
    ctx.fill();

    ctx.shadowColor = `rgba(${GOLD_RGB},0.3)`;
    ctx.shadowBlur = 12;
    ctx.strokeStyle = `rgba(${GOLD_RGB},0.4)`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.arc(cx, cy, hubRadius, 0, Math.PI * 2);
    const innerGrad = ctx.createRadialGradient(cx - hubRadius * 0.2, cy - hubRadius * 0.2, 0, cx, cy, hubRadius);
    innerGrad.addColorStop(0, '#3d3020');
    innerGrad.addColorStop(0.5, '#2a2010');
    innerGrad.addColorStop(1, '#1a1508');
    ctx.fillStyle = innerGrad;
    ctx.fill();

    ctx.shadowColor = `rgba(${GOLD_RGB},0.5)`;
    ctx.shadowBlur = 8;
    ctx.strokeStyle = `rgba(${GOLD_RGB},0.6)`;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.shadowBlur = 0;

    const spinState = isSpinning ? 'spinning' : (hasWinner ? 'done' : 'idle');
    const pulseAlpha = spinState === 'done'
      ? 0.5 + 0.5 * Math.abs(Math.sin(pulsePhaseRef.current))
      : 0.6;

    ctx.globalAlpha = pulseAlpha;
    ctx.shadowColor = `rgba(${GOLD_RGB},0.6)`;
    ctx.shadowBlur = 15;
    ctx.font = `bold ${hubRadius * 0.6}px "Inter","Segoe UI",sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = GOLD;
    ctx.fillText('B', cx, cy + 0.5);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    ctx.restore();
  }

  function drawBottomVignette(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const grad = ctx.createLinearGradient(0, h - 100, 0, h);
    grad.addColorStop(0, 'rgba(10,12,18,0)');
    grad.addColorStop(1, 'rgba(10,12,18,1)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, h - 100, w, 100);
  }

  function darken(hex: string, amount: number): string {
    const num = parseInt(hex.slice(1), 16);
    const r = Math.max(0, (num >> 16) - amount);
    const g = Math.max(0, ((num >> 8) & 0xFF) - amount);
    const b = Math.max(0, (num & 0xFF) - amount);
    return `rgb(${r},${g},${b})`;
  }

  function lighten(hex: string, amount: number): string {
    const num = parseInt(hex.slice(1), 16);
    const r = Math.min(255, (num >> 16) + amount);
    const g = Math.min(255, ((num >> 8) & 0xFF) + amount);
    const b = Math.min(255, (num & 0xFF) + amount);
    return `rgb(${r},${g},${b})`;
  }

  const spawnParticles = useCallback((cx: number, cy: number) => {
    const count = 40 + Math.floor(Math.random() * 30);
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI + Math.random() * Math.PI;
      const speed = 1 + Math.random() * 4;
      const colors = ['#facc15', '#ffd700', '#fff', '#eab308', '#ffed4a', '#f5c400'];
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 1,
        maxLife: 0.6 + Math.random() * 1.0,
        size: 1.5 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    return particles;
  }, []);

  const animateParticles = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const particles = particlesRef.current;
    if (particles.length === 0) return false;
    let alive = false;
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      p.life -= 1 / (60 * p.maxLife);
      if (p.life > 0) alive = true;
    }
    for (const p of particles) {
      if (p.life <= 0) continue;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.restore();
    }
    return alive;
  }, []);

  const renderFrame = useCallback((rotation: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const { w, h } = canvasDimsRef.current;

    ctx.save();
    ctx.scale(dpr, dpr);

    drawWheel(rotation, ctx, w, h);

    animateParticles(ctx, w, h);

    ctx.restore();
  }, [drawWheel, animateParticles]);

  useEffect(() => {
    if (wheelGames.length === 0) return;
    imageCacheRef.current.clear();
    wheelGames.forEach((g) => {
      loadImage(getCoverUrl(g));
    });
  }, [wheelGames, getCoverUrl, loadImage]);

  useEffect(() => {
    if (canvasDimsRef.current.w <= 0 || wheelGames.length === 0) return;

    const FRICTION = 0.985;
    const MIN_VELOCITY = 0.0008;
    const IDLE_SPEED = 0.008;
    const ARROW_SPRING_STIFF = 0.55;
    const ARROW_SPRING_DAMP = 0.7;

    const pinHitSound = () => {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(1200 + Math.random() * 800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
      } catch {}
    };

    const loop = () => {
      const vel = velocityRef.current;
      const n = wheelGames.length;
      const segAngle = segAngleRef.current;
      const TOP = -Math.PI / 2;

      if (!spinningRef.current && Math.abs(vel) < IDLE_SPEED * 2) {
        velocityRef.current = IDLE_SPEED;
      }

      if (pinHitCooldownRef.current > 0) {
        pinHitCooldownRef.current -= 1;
      }

      if (Math.abs(arrowVelocityRef.current) > 0.001 || Math.abs(arrowAngleRef.current) > 0.01) {
        arrowVelocityRef.current *= ARROW_SPRING_DAMP;
        arrowAngleRef.current += arrowVelocityRef.current;
        arrowAngleRef.current *= ARROW_SPRING_STIFF;
        if (Math.abs(arrowAngleRef.current) < 0.001 && Math.abs(arrowVelocityRef.current) < 0.001) {
          arrowAngleRef.current = 0;
          arrowVelocityRef.current = 0;
        }
      }

      if (arrowGlowRef.current > 0) {
        arrowGlowRef.current *= 0.9;
        if (arrowGlowRef.current < 0.01) arrowGlowRef.current = 0;
      }

      if (Math.abs(vel) > 0.0001) {
        rotationRef.current += vel;

        const pinAngles: number[] = [];
        for (let i = 0; i < n; i++) {
          const worldAngle = TOP + i * segAngle + rotationRef.current;
          pinAngles.push(((worldAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI));
        }

        if (prevPinAnglesRef.current.length === n && pinHitCooldownRef.current <= 0) {
          const arrowNorm = 3 * Math.PI / 2;
          for (let i = 0; i < n; i++) {
            if (i === lastHitIndexRef.current) continue;
            const prev = prevPinAnglesRef.current[i];
            const curr = pinAngles[i];
            const crossedArrow = prev < arrowNorm && curr >= arrowNorm;
            if (crossedArrow) {
              lastHitIndexRef.current = i;
              pinHitCooldownRef.current = 8;
              const speedFactor = Math.min(1, Math.abs(vel) / 0.3);
              const kick = (Math.random() * 0.5 + 0.5) * ARROW_KICK_STRENGTH * speedFactor;
              arrowVelocityRef.current = -kick;
              arrowAngleRef.current += kick * 0.3;
              arrowGlowRef.current = 0.8;
              pinHitSound();
              break;
            }
          }
        }
        prevPinAnglesRef.current = pinAngles;

        if (spinningRef.current) {
          velocityRef.current *= FRICTION;
          if (Math.abs(velocityRef.current) < MIN_VELOCITY) {
            velocityRef.current = 0;
            spinningRef.current = false;
            setSpinning(false);

            const norm = ((-rotationRef.current % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
            const winnerIndex = Math.floor(norm / segAngle) % n;
            const selectedWinner = wheelGames[winnerIndex];
            winnerRef.current = selectedWinner;
            setWinner(selectedWinner);

            renderPulseRef.current = true;
            pulsePhaseRef.current = 0;

            const cxc = wheelCenterRef.current.x;
            particlesRef.current = spawnParticles(cxc, 4);

            setTimeout(() => {
              setShowResult(true);
            }, 600);
          }
        }
      } else {
        prevPinAnglesRef.current = [];
        lastHitIndexRef.current = -1;
        pinHitCooldownRef.current = 0;
      }

      if (renderPulseRef.current) {
        pulsePhaseRef.current += 0.05;
      }

      renderFrame(rotationRef.current);
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [wheelGames, renderFrame, spawnParticles]);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const handleSpin = useCallback(() => {
    if (spinningRef.current || wheelGames.length === 0) return;
    setWinner(null);
    setShowResult(false);
    renderPulseRef.current = false;
    particlesRef.current = [];
    winnerRef.current = null;
    arrowAngleRef.current = 0;
    arrowVelocityRef.current = 0;
    prevPinAnglesRef.current = [];
    lastHitIndexRef.current = -1;
    pinHitCooldownRef.current = 0;
    arrowGlowRef.current = 0;

    const minSpeed = 0.25;
    const maxSpeed = 0.5;
    const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
    velocityRef.current = speed;
    spinningRef.current = true;
    setSpinning(true);
  }, [wheelGames.length]);

  const handleSpinAgain = useCallback(() => {
    if (games.length > 0) {
      const picked = pickEligibleGames(games);
      setWheelGames(picked);
      imageCacheRef.current.clear();
      picked.forEach((g) => loadImage(getCoverUrl(g)));
    }
    rotationRef.current = 0;
    velocityRef.current = 0;
    setWinner(null);
    setShowResult(false);
    renderPulseRef.current = false;
    particlesRef.current = [];
    arrowAngleRef.current = 0;
    arrowVelocityRef.current = 0;
    prevPinAnglesRef.current = [];
    lastHitIndexRef.current = -1;
    pinHitCooldownRef.current = 0;
    arrowGlowRef.current = 0;
  }, [games, getCoverUrl, loadImage]);

  if (loading && games.length === 0) {
    return (
      <div className="content-area flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#0a0a0a]" ref={containerRef}>
      {/* Arrow at top middle */}
      <div className="absolute left-1/2 top-0 -translate-x-1/2 z-20" style={{ filter: 'drop-shadow(0 -4px 12px rgba(255, 215, 0, 0.35))' }}>
        <div className="relative w-[60px] h-[52px]" style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)', background: 'linear-gradient(180deg, #ffd700 0%, #ffb300 100%)' }}>
          <div className="absolute top-[6px] left-1/2 -translate-x-1/2 w-[12px] h-[12px] rounded-full bg-[#ffd700] shadow-[0_0_6px_rgba(255,215,0,0.5)]" />
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="absolute inset-0 block"
      />

      <div className="absolute top-4 left-4 md:top-6 md:left-6 z-10">
        <h1 className="text-fluid-lg md:text-2xl font-bold text-gradient-gold">Spin Wheel</h1>
      </div>

      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-10 flex items-center gap-3">
        <div className="px-3 py-1.5 rounded-xl bg-surface-900/60 backdrop-blur-md border border-white/5">
          <span className="text-[10px] md:text-xs font-medium text-gray-400">
            {wheelGames.length} games loaded
          </span>
        </div>
        <button
          onClick={handleSpinAgain}
          disabled={spinning}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-900/60 backdrop-blur-md border border-white/5 text-gray-400 hover:text-white hover:bg-surface-700/60 text-[10px] md:text-xs font-medium transition-all disabled:opacity-40"
        >
          <RefreshIcon />
          Respin Pool
        </button>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-3">
        <button
          onClick={handleSpin}
          disabled={spinning || wheelGames.length === 0}
          className="group relative inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-gradient-to-b from-gold-500 to-yellow-600 hover:from-gold-400 hover:to-yellow-500 text-black font-black text-sm md:text-base tracking-wider uppercase transition-all duration-300 hover:shadow-[0_0_40px_rgba(250,204,21,0.25)] active:scale-[0.96] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:active:scale-100"
        >
          <SpinIcon />
          {spinning ? 'Spinning\u2026' : 'SPIN!'}
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-gold-500/0 via-gold-500/20 to-gold-500/0 opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500" />
        </button>
        {spinning && (
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-surface-900/60 backdrop-blur-md border border-gold-500/10">
            <div className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
            <span className="text-[10px] text-gold-400 font-medium tracking-wider uppercase">Spinning\u2026</span>
          </div>
        )}
      </div>

      {showResult && winner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative w-full max-w-md mx-4 bg-surface-900 border border-gold-500/20 rounded-2xl p-6 md:p-8 shadow-[0_0_60px_rgba(250,204,21,0.12)]">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-gold-600 to-yellow-500 rounded-full text-black text-[10px] md:text-xs font-bold uppercase tracking-widest shadow-lg">
              Selected!
            </div>

            <div className="flex flex-col items-center gap-3 md:gap-4 mt-2">
              <div className="w-20 md:w-28 h-24 md:h-32 rounded-xl overflow-hidden ring-2 ring-gold-500/30">
                <img
                  src={getCoverUrl(winner)}
                  alt={winner.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <h2 className="text-fluid-lg md:text-2xl font-bold text-white text-center">{winner.title}</h2>

              <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 text-[10px] md:text-xs text-gray-400">
                <span className="px-2 py-0.5 rounded-md bg-surface-800 border border-white/[0.04]">
                  {Math.round(winner.hoursPlayed)}h played
                </span>
                {winner.genre && (
                  <span className="px-2 py-0.5 rounded-md bg-surface-800 border border-white/[0.04]">
                    {winner.genre}
                  </span>
                )}
                {winner.status && (
                  <span className="px-2 py-0.5 rounded-md bg-surface-800 border border-white/[0.04] capitalize">
                    {winner.status.toLowerCase()}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 md:gap-3 mt-1 w-full">
                <button
                  onClick={() => navigate(`/game/${winner.id}`)}
                  className="flex-1 py-2.5 md:py-3 rounded-xl bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-black font-semibold text-[11px] md:text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(250,204,21,0.3)] active:scale-[0.97]"
                >
                  View Details
                </button>
                <button
                  onClick={() => {
                    handleSpinAgain();
                    setShowResult(false);
                  }}
                  className="flex-1 py-2.5 md:py-3 rounded-xl bg-surface-800 hover:bg-surface-700 text-gray-300 hover:text-white font-semibold text-[11px] md:text-sm transition-all duration-200 active:scale-[0.97] border border-white/[0.06]"
                >
                  Spin Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {wheelGames.length === 0 && !loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          <div className="w-14 h-14 rounded-2xl bg-surface-800/60 border border-white/[0.04] flex items-center justify-center mb-4">
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
