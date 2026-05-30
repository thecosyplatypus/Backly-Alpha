import { useState, useEffect, useMemo } from 'react';

const GENRE_GRADIENTS: Record<string, string[]> = {
  RPG: [
    'radial-gradient(ellipse at 20% 50%, rgba(76,29,149,0.3) 0%, transparent 60%)',
    'radial-gradient(ellipse at 80% 20%, rgba(105,10,204,0.2) 0%, transparent 50%)',
    'radial-gradient(ellipse at 50% 80%, rgba(168,85,247,0.1) 0%, transparent 40%)',
  ],
  Horror: [
    'radial-gradient(ellipse at 30% 40%, rgba(68,0,0,0.4) 0%, transparent 60%)',
    'radial-gradient(ellipse at 70% 60%, rgba(30,0,0,0.3) 0%, transparent 50%)',
    'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.5) 0%, transparent 70%)',
  ],
  FPS: [
    'radial-gradient(ellipse at 20% 30%, rgba(200,0,0,0.2) 0%, transparent 50%)',
    'radial-gradient(ellipse at 80% 70%, rgba(255,69,0,0.15) 0%, transparent 50%)',
    'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.3) 0%, transparent 60%)',
  ],
  Strategy: [
    'radial-gradient(ellipse at 25% 25%, rgba(0,0,139,0.25) 0%, transparent 50%)',
    'radial-gradient(ellipse at 75% 75%, rgba(30,60,180,0.15) 0%, transparent 50%)',
    'radial-gradient(ellipse at 50% 50%, rgba(0,0,80,0.2) 0%, transparent 60%)',
  ],
  Simulation: [
    'radial-gradient(ellipse at 30% 30%, rgba(139,69,19,0.2) 0%, transparent 50%)',
    'radial-gradient(ellipse at 70% 70%, rgba(160,120,60,0.15) 0%, transparent 50%)',
    'radial-gradient(ellipse at 50% 50%, rgba(80,40,10,0.15) 0%, transparent 60%)',
  ],
  Adventure: [
    'radial-gradient(ellipse at 20% 30%, rgba(34,139,34,0.2) 0%, transparent 50%)',
    'radial-gradient(ellipse at 80% 70%, rgba(60,179,113,0.15) 0%, transparent 50%)',
    'radial-gradient(ellipse at 50% 50%, rgba(0,80,0,0.15) 0%, transparent 60%)',
  ],
  Action: [
    'radial-gradient(ellipse at 40% 30%, rgba(255,69,0,0.2) 0%, transparent 50%)',
    'radial-gradient(ellipse at 60% 70%, rgba(200,50,0,0.15) 0%, transparent 50%)',
    'radial-gradient(ellipse at 50% 50%, rgba(100,20,0,0.15) 0%, transparent 60%)',
  ],
  Indie: [
    'radial-gradient(ellipse at 30% 40%, rgba(218,165,32,0.2) 0%, transparent 50%)',
    'radial-gradient(ellipse at 70% 60%, rgba(255,215,0,0.1) 0%, transparent 50%)',
    'radial-gradient(ellipse at 50% 50%, rgba(139,90,20,0.15) 0%, transparent 60%)',
  ],
};

const DEFAULT_GRADIENTS = [
  'radial-gradient(ellipse at 20% 50%, rgba(255,215,0,0.08) 0%, transparent 60%)',
  'radial-gradient(ellipse at 80% 20%, rgba(255,215,0,0.04) 0%, transparent 50%)',
  'radial-gradient(ellipse at 50% 80%, rgba(251,191,36,0.03) 0%, transparent 40%)',
];

const TIME_GRADIENTS = {
  morning: 'linear-gradient(180deg, rgba(255,200,100,0.03) 0%, rgba(255,150,50,0.02) 100%)',
  afternoon: 'linear-gradient(180deg, rgba(200,200,255,0.02) 0%, transparent 100%)',
  evening: 'linear-gradient(180deg, rgba(200,100,50,0.04) 0%, rgba(100,50,150,0.02) 100%)',
  night: 'linear-gradient(180deg, rgba(0,0,50,0.05) 0%, rgba(0,0,0,0.08) 100%)',
};

export function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export function getGenreBackgroundStyle(genre: string | null): string {
  const gradients = GENRE_GRADIENTS[genre || ''] || DEFAULT_GRADIENTS;
  const timeGrad = TIME_GRADIENTS[getTimeOfDay()];
  return [...gradients, timeGrad].join(', ');
}

export function useDynamicBackground(genre?: string | null) {
  const bgStyle = useMemo(() => getGenreBackgroundStyle(genre || null), [genre]);
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const update = () => setTimeStr(getTimeOfDay());
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  return bgStyle;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  delay: number;
}

export function useBackgroundParticles(count = 20) {
  const [particles] = useState<Particle[]>(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      speed: Math.random() * 0.3 + 0.1,
      opacity: Math.random() * 0.3 + 0.05,
      delay: Math.random() * 5,
    }))
  );

  return particles;
}
