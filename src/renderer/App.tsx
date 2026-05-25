import React, { useEffect, useCallback, useRef } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Library from './pages/Library';
import GameDetailPage from './pages/GameDetailPage';
import Settings from './pages/Settings';
import Recommendations from './pages/Recommendations';
import SpinWheel from './pages/SpinWheel';
import Wrapped from './pages/Wrapped';
import { useGameStore } from './store/gameStore';
import { useSettingsStore } from './store/settingsStore';
import { useKeyboardShortcuts, ShortcutHint } from './hooks/useKeyboardShortcuts';
import { useController } from './hooks/useController';

export default function App() {
  const navigate = useNavigate();
  const fetchStats = useGameStore((s) => s.fetchStats);
  const fetchInsights = useGameStore((s) => s.fetchInsights);
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const loadSteamStatus = useSettingsStore((s) => s.loadSteamStatus);
  const steamSync = useSettingsStore((s) => s.steamSync);

  useEffect(() => {
    fetchStats();
    fetchInsights();
    loadSettings();
    loadSteamStatus();
  }, []);

  useEffect(() => {
    window.backly.onNavigate((path) => navigate(path));
    return () => {
      window.backly.removeAllListeners('navigate');
    };
  }, [navigate]);

  const shortcuts = useCallback(() => ({
    'ctrl+1': () => navigate('/'),
    'ctrl+2': () => navigate('/library'),
    'ctrl+3': () => navigate('/recommendations'),
    'ctrl+4': () => navigate('/spin-wheel'),
    'ctrl+5': () => navigate('/wrapped'),
    'ctrl+,': () => navigate('/settings'),
    'ctrl+r': () => steamSync(),
    'escape': () => {
      // handled by individual pages
    },
    'ctrl+b': () => {
      document.dispatchEvent(new CustomEvent('toggle-sidebar'));
    },
  }), [navigate, steamSync]);

  useKeyboardShortcuts(shortcuts());

  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  useController({
    onMenu: () => navigateRef.current('/'),
    onStart: () => navigateRef.current('/library'),
    onSelect: () => navigateRef.current('/settings'),
  });

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/library" element={<Library />} />
        <Route path="/game/:id" element={<GameDetailPage />} />
        <Route path="/recommendations" element={<Recommendations />} />
        <Route path="/spin-wheel" element={<SpinWheel />} />
        <Route path="/wrapped" element={<Wrapped />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
}
