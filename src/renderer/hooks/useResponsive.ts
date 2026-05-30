import { useState, useEffect, useCallback, useRef } from 'react';

export interface ResponsiveState {
  width: number;
  height: number;
  isSm: boolean;
  isMd: boolean;
  isLg: boolean;
  isXl: boolean;
  is2xl: boolean;
  is3xl: boolean;
  is4xl: boolean;
  sidebarMode: 'expanded' | 'icon-only' | 'overlay';
  showPanelRight: boolean;
  gridColumns: number;
  cardWidth: number;
  contentPadding: number;
  fontSize: 'sm' | 'base' | 'lg';
}

const BREAKPOINTS = {
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
  '3xl': 1920,
  '4xl': 2560,
};

function calcSidebarMode(w: number): ResponsiveState['sidebarMode'] {
  if (w < 768) return 'overlay';
  if (w < 1024) return 'icon-only';
  return 'expanded';
}

function calcShowPanelRight(w: number): boolean {
  return w >= 1280;
}

function calcGridColumns(w: number): number {
  if (w >= 1920) return 8;
  if (w >= 1536) return 7;
  if (w >= 1280) return 6;
  if (w >= 1024) return 5;
  if (w >= 768) return 4;
  if (w >= 480) return 3;
  return 2;
}

function calcCardWidth(w: number): number {
  if (w >= 1920) return 200;
  if (w >= 1280) return 180;
  if (w >= 1024) return 160;
  return 140;
}

function calcContentPadding(w: number): number {
  if (w >= 1920) return 48;
  if (w >= 1280) return 32;
  if (w >= 1024) return 24;
  return 16;
}

function calcFontSize(w: number): ResponsiveState['fontSize'] {
  if (w >= 1920) return 'lg';
  if (w >= 1024) return 'base';
  return 'sm';
}

export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>(() => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1024;
    return {
      width: w,
      height: typeof window !== 'undefined' ? window.innerHeight : 768,
      isSm: w >= BREAKPOINTS.sm,
      isMd: w >= BREAKPOINTS.md,
      isLg: w >= BREAKPOINTS.lg,
      isXl: w >= BREAKPOINTS.xl,
      is2xl: w >= BREAKPOINTS['2xl'],
      is3xl: w >= BREAKPOINTS['3xl'],
      is4xl: w >= BREAKPOINTS['4xl'],
      sidebarMode: calcSidebarMode(w),
      showPanelRight: calcShowPanelRight(w),
      gridColumns: calcGridColumns(w),
      cardWidth: calcCardWidth(w),
      contentPadding: calcContentPadding(w),
      fontSize: calcFontSize(w),
    };
  });

  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        setState({
          width: w,
          height: h,
          isSm: w >= BREAKPOINTS.sm,
          isMd: w >= BREAKPOINTS.md,
          isLg: w >= BREAKPOINTS.lg,
          isXl: w >= BREAKPOINTS.xl,
          is2xl: w >= BREAKPOINTS['2xl'],
          is3xl: w >= BREAKPOINTS['3xl'],
          is4xl: w >= BREAKPOINTS['4xl'],
          sidebarMode: calcSidebarMode(w),
          showPanelRight: calcShowPanelRight(w),
          gridColumns: calcGridColumns(w),
          cardWidth: calcCardWidth(w),
          contentPadding: calcContentPadding(w),
          fontSize: calcFontSize(w),
        });
      });
    };

    window.addEventListener('resize', handleResize, { passive: true });
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return state;
}
