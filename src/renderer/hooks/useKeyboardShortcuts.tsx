import { useEffect } from 'react';

interface Shortcuts {
  [key: string]: () => void;
}

const SHORTCUT_DISPLAY: Record<string, string> = {
  'ctrl+1': 'Dashboard',
  'ctrl+2': 'Library',
  'ctrl+3': 'Recommendations',
  'ctrl+4': 'Spin Wheel',
  'ctrl+5': 'Wrapped',
  'ctrl+,': 'Settings',
  'ctrl+f': 'Search',
  'ctrl+b': 'Toggle Sidebar',
  'escape': 'Close Panel',
  'ctrl+r': 'Sync Steam',
  'ctrl+e': 'Export Data',
};

export function useKeyboardShortcuts(shortcuts: Shortcuts) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const parts: string[] = [];
      if (e.ctrlKey || e.metaKey) parts.push('ctrl');
      if (e.altKey) parts.push('alt');
      if (e.shiftKey) parts.push('shift');
      parts.push(e.key.toLowerCase());

      const key = parts.join('+');

      if (key in shortcuts) {
        e.preventDefault();
        e.stopPropagation();
        shortcuts[key]();
      }

      if (e.key === 'Escape') {
        shortcuts['escape']?.();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcuts]);
}

export function useKeyboardShortcut(key: string, callback: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const parts: string[] = [];
      if (e.ctrlKey || e.metaKey) parts.push('ctrl');
      if (e.altKey) parts.push('alt');
      if (e.shiftKey) parts.push('shift');
      parts.push(e.key.toLowerCase());

      if (parts.join('+') === key) {
        e.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [key, callback]);
}

export function getShortcutLabel(action: string): string {
  const shortcut = Object.entries(SHORTCUT_DISPLAY).find(([, v]) => v === action);
  if (!shortcut) return '';
  return shortcut[0]
    .split('+')
    .map(p => p === 'ctrl' ? '⌃' : p === 'alt' ? '⌥' : p === 'shift' ? '⇧' : p.toUpperCase())
    .join(' ');
}

export function ShortcutHint({ action }: { action: string }) {
  const label = getShortcutLabel(action);
  if (!label) return null;
  return (
    <span className="text-[9px] md:text-[10px] text-gray-600 font-mono ml-2 px-1.5 py-0.5 rounded bg-surface-800/60 border border-white/[0.04]">
      {label}
    </span>
  );
}
