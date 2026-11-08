import { useEffect, useRef } from 'react';
import { useSettingsStore } from '../../store/settingsStore';

interface Props {
  placement?: 'sidebar' | 'dashboard';
}

export default function AdBanner({ placement = 'sidebar' }: Props) {
  const settings = useSettingsStore((s) => s.settings);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!settings?.adsEnabled) return null;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const adCode = settings?.adCode || (import.meta as any).env?.VITE_AD_CODE;
    if (!adCode) return;

    container.innerHTML = '';
    const range = document.createRange();
    range.selectNode(container);
    const fragment = range.createContextualFragment(String(adCode));
    container.appendChild(fragment);
  }, [settings?.adCode, placement]);

  const sizeClass = placement === 'dashboard'
    ? 'min-h-[90px] w-full'
    : 'min-h-[72px] w-full';

  return (
    <div
      ref={containerRef}
      className={`${sizeClass} overflow-hidden rounded-xl border border-white/[0.05] bg-surface-800/40 p-2 text-center`}
      aria-label="Sponsored content"
    >
      {!settings?.adCode && !(import.meta as any).env?.VITE_AD_CODE && (
        <div className="flex h-full min-h-[56px] items-center justify-center text-[10px] text-gray-600">
          Sponsored space
        </div>
      )}
    </div>
  );
}
