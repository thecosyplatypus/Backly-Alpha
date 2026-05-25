import React, { useEffect, useState } from 'react';

interface Props {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: Props) {
  const [phase, setPhase] = useState<'enter' | 'visible' | 'exit'>('enter');
  const [loadingText, setLoadingText] = useState('');

  const loadingMessages = [
    'Loading your library...',
    'Preparing dashboard...',
    'Syncing achievements...',
    'Ready to play!',
  ];

  useEffect(() => {
    requestAnimationFrame(() => {
      setPhase('visible');
    });

    const textTimer = setTimeout(() => setLoadingText(loadingMessages[0]), 100);
    const textTimer2 = setTimeout(() => setLoadingText(loadingMessages[1]), 600);
    const textTimer3 = setTimeout(() => setLoadingText(loadingMessages[2]), 1200);
    const textTimer4 = setTimeout(() => setLoadingText(loadingMessages[3]), 1800);

    const exitTimer = setTimeout(() => {
      setPhase('exit');
      setTimeout(onFinish, 800);
    }, 2400);

    return () => {
      clearTimeout(textTimer);
      clearTimeout(textTimer2);
      clearTimeout(textTimer3);
      clearTimeout(textTimer4);
      clearTimeout(exitTimer);
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-surface-900 transition-all duration-700 ${
        phase === 'enter' ? 'opacity-0' : 'opacity-100'
      } ${phase === 'exit' ? 'opacity-0 scale-110 blur-sm' : ''}`}
    >
      <div className="splash-gradient absolute inset-0" />

      <div className="relative flex flex-col items-center gap-2">
        <div className={`text-5xl font-bold transition-all duration-700 ${
          phase === 'enter' ? 'opacity-0 scale-75 blur-sm' : 'opacity-100 scale-100 blur-0'
        }`}>
          <span className="text-gradient text-glow">Backly</span>
        </div>
        <p className={`text-xs text-gray-500 tracking-[0.3em] uppercase transition-all duration-700 delay-200 ${
          phase === 'enter' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
        }`}>
          Gaming Backlog Tracker
        </p>
      </div>

      <div className={`mt-16 flex items-center gap-3 transition-all duration-500 delay-700 ${
        phase === 'enter' ? 'opacity-0' : 'opacity-100'
      }`}>
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-backly-500 animate-bounce" style={{ animationDelay: '0ms', animationDuration: '0.8s' }} />
          <div className="w-2 h-2 rounded-full bg-backly-400 animate-bounce" style={{ animationDelay: '150ms', animationDuration: '0.8s' }} />
          <div className="w-2 h-2 rounded-full bg-backly-300 animate-bounce" style={{ animationDelay: '300ms', animationDuration: '0.8s' }} />
        </div>
        <span className="text-xs text-gray-500">{loadingText || 'Initializing...'}</span>
      </div>
    </div>
  );
}
