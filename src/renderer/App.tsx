import React, { Suspense, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import { useGameStore } from './store/gameStore';
import { useSettingsStore } from './store/settingsStore';
import { useKeyboardShortcuts, ShortcutHint } from './hooks/useKeyboardShortcuts';
import { useController } from './hooks/useController';

const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Library = React.lazy(() => import('./pages/Library'));
const GameDetailPage = React.lazy(() => import('./pages/GameDetailPage'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Recommendations = React.lazy(() => import('./pages/Recommendations'));
const SpinWheel = React.lazy(() => import('./pages/SpinWheel'));
const Wrapped = React.lazy(() => import('./pages/Wrapped'));

const PAGES = [
  { path: '/', element: <Dashboard /> },
  { path: '/library', element: <Library /> },
  { path: '/game/:id', element: <GameDetailPage /> },
  { path: '/recommendations', element: <Recommendations /> },
  { path: '/spin-wheel', element: <SpinWheel /> },
  { path: '/wrapped', element: <Wrapped /> },
  { path: '/settings', element: <Settings /> },
];

function PageFallback() {
  return (
    <div className="content-area flex items-center justify-center min-h-[400px]">
      <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  const navigate = useNavigate();
  const fetchStats = useGameStore((s) => s.fetchStats);
  const fetchInsights = useGameStore((s) => s.fetchInsights);
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const loadSteamStatus = useSettingsStore((s) => s.loadSteamStatus);
  const steamSync = useSettingsStore((s) => s.steamSync);

  useEffect(() => {
    fetchStats();
    loadSettings();
    const deferred = setTimeout(() => {
      fetchInsights();
      loadSteamStatus();
    }, 200);
    return () => clearTimeout(deferred);
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
      <Suspense fallback={<PageFallback />}>
        <Routes>
          {PAGES.map((p) => (
            <Route key={p.path} path={p.path} element={p.element} />
          ))}
        </Routes>
      </Suspense>
    </Layout>
  );
}
