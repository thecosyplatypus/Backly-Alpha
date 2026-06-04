import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  steamAppId: string;
  gameTitle: string;
  size?: 'sm' | 'md' | 'lg';
}

type ButtonState = 'idle' | 'launching' | 'launched';

const sizeClasses: Record<string, string> = {
  sm: 'text-xs px-3 py-1.5 gap-1.5',
  md: 'text-sm px-4 py-2 gap-2',
  lg: 'text-base px-6 py-3 gap-2.5',
};

export default function PlayButton({ steamAppId, gameTitle, size = 'md' }: Props) {
  const [state, setState] = useState<ButtonState>('idle');

  const handleClick = async () => {
    if (state !== 'idle') return;
    setState('launching');
    try {
      const result = await window.backly.launchSteamGame(steamAppId);
      if (result.success) {
        setState('launched');
        window.backly.createActivity('game_started', {
          gameTitle,
          source: 'play_button',
        }).catch(() => {});
        setTimeout(() => setState('idle'), 3000);
      } else {
        setState('idle');
      }
    } catch {
      setState('idle');
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={state !== 'idle'}
      className={`inline-flex items-center justify-center rounded-lg font-bold transition-all duration-200 gpu ${
        state === 'launched'
          ? 'bg-green-600 text-white cursor-default'
          : 'bg-gradient-to-r from-orange-600 to-amber-500 text-white hover:shadow-[0_0_16px_rgba(255,165,0,0.4)] hover:scale-105 active:scale-95'
      } disabled:opacity-70 ${sizeClasses[size]}`}
      whileTap={state === 'idle' ? { scale: 0.95 } : {}}
    >
      <AnimatePresence mode="wait">
        {state === 'idle' && (
          <motion.span
            key="play"
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 4 }}
            className="flex items-center gap-1.5"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M8 5v14l11-7z" />
            </svg>
            Play
          </motion.span>
        )}
        {state === 'launching' && (
          <motion.span
            key="launching"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1.5"
          >
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.3" />
              <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
            </svg>
            Launching...
          </motion.span>
        )}
        {state === 'launched' && (
          <motion.span
            key="launched"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1.5"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            Launched
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
