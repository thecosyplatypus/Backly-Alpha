import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import ProfilePanel from '../Dashboard/ProfilePanel';
import BackgroundEffects from '../ui/BackgroundEffects';
import { useResponsive } from '../../hooks/useResponsive';
import { useGamepadDetection } from '../../hooks/useController';

interface Props {
  children: React.ReactNode;
}

export default function Layout({ children }: Props) {
  const resp = useResponsive();
  const [overlayOpen, setOverlayOpen] = useState(false);
  const hasGamepad = useGamepadDetection();

  const handleToggleOverlay = useCallback(() => {
    setOverlayOpen((prev) => !prev);
  }, []);

  const handleCloseOverlay = useCallback(() => {
    setOverlayOpen(false);
  }, []);

  useEffect(() => {
    const handler = () => setOverlayOpen((prev) => !prev);
    document.addEventListener('toggle-sidebar', handler);
    return () => document.removeEventListener('toggle-sidebar', handler);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface-950 resize-transition">
      <BackgroundEffects />

      {/* Gamepad indicator */}
      {hasGamepad && (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface-900/80 backdrop-blur-md border border-white/[0.04] text-[9px] text-gray-500">
          <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
          <span>Controller</span>
        </div>
      )}

      <Sidebar
        mode={resp.sidebarMode}
        overlayOpen={overlayOpen}
        onToggleOverlay={handleToggleOverlay}
        onCloseOverlay={handleCloseOverlay}
      />

      <main
        className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden scrollbar-hide resize-transition relative z-10"
        onClick={resp.sidebarMode === 'overlay' && overlayOpen ? handleCloseOverlay : undefined}
      >
        <div className="page-transition min-h-full">
          {children}
        </div>
      </main>

      {resp.showPanelRight && (
        <div className="hidden xl:block resize-transition relative z-10">
          <ProfilePanel />
        </div>
      )}
    </div>
  );
}
