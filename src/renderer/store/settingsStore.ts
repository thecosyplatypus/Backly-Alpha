import { create } from 'zustand';
import { useGameStore } from './gameStore';

interface SyncResult {
  success: boolean;
  message: string;
  imported: number;
  updated: number;
  errors: number;
}

interface SyncProgress {
  current: number;
  total: number;
  message: string;
}

interface SettingsStore {
  settings: any;
  steamStatus: any;
  loading: boolean;
  syncing: boolean;
  syncProgress: SyncProgress | null;
  lastSyncResult: SyncResult | null;

  loadSettings: () => Promise<void>;
  updateSettings: (settings: any) => Promise<void>;
  loadSteamStatus: () => Promise<void>;
  steamLogin: () => Promise<any>;
  steamSync: () => Promise<any>;
  steamDisconnect: () => Promise<any>;
  clearSyncResult: () => void;
  setSyncProgress: (progress: SyncProgress | null) => void;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: {
    theme: 'dark',
    sidebarCollapsed: false,
    autoSync: true,
    syncInterval: 30,
    notificationsEnabled: true,
    minimizeToTray: true,
    startOnBoot: false,
    language: 'en',
  },
  steamStatus: { isConnected: false, username: null, avatar: null, lastSync: null },
  loading: false,
  syncing: false,
  syncProgress: null,
  lastSyncResult: null,

  setSyncProgress: (progress) => set({ syncProgress: progress }),

  loadSettings: async () => {
    try {
      const settings = await window.backly.getSettings();
      set({ settings: { ...get().settings, ...settings } });
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  },

  updateSettings: async (newSettings) => {
    try {
      const settings = await window.backly.updateSettings(newSettings);
      set({ settings });
    } catch (err) {
      console.error('Failed to update settings:', err);
    }
  },

  loadSteamStatus: async () => {
    try {
      const steamStatus = await window.backly.steamStatus();
      set({ steamStatus });
    } catch (err) {
      console.error('Failed to load Steam status:', err);
    }
  },

  steamLogin: async () => {
    set({ loading: true, syncProgress: null, lastSyncResult: null });
    try {
      const cleanup = window.backly.onSyncProgress((data) => {
        set({ syncProgress: data });
      });

      const result = await window.backly.steamLogin();
      if (result && result.success !== false) {
        let achResult: any = null;
        try {
          achResult = await window.backly.syncSteamAchievements();
        } catch (err) {
          achResult = { success: false, imported: 0, skipped: 0, failed: 0, total: 0, achievements: [] };
        }
        cleanup?.();
        await get().loadSteamStatus();
        const totalErrors = (result?.errors || 0) + (achResult?.failed || 0);
        const achMsg = achResult ? `${achResult.imported} with achievements, ${achResult.skipped} without` : '';
        set({
          lastSyncResult: {
            success: result?.success !== false,
            message: result?.message || (achMsg ? `Synced achievements: ${achMsg}` : 'Connect complete'),
            imported: result?.imported || 0,
            updated: result?.updated || 0,
            errors: totalErrors,
          },
        });
        if (result?.success !== false) {
          useGameStore.getState().fetchGames();
          useGameStore.getState().fetchStats();
          useGameStore.getState().fetchInsights();
        }
      } else {
        cleanup?.();
        await get().loadSteamStatus();
        if (result) set({ lastSyncResult: result });
      }
      set({ loading: false, syncProgress: null });
      return result;
    } catch (err) {
      set({ loading: false, syncProgress: null });
      throw err;
    }
  },

  steamSync: async () => {
    set({ syncing: true, syncProgress: null, lastSyncResult: null });
    try {
      const cleanup = window.backly.onSyncProgress((data) => {
        set({ syncProgress: data });
      });

      // Phase 1: Library sync
      const libResult = await window.backly.steamSync();

      // Phase 2: Achievement sync
      let achResult: any = null;
      try {
        achResult = await window.backly.syncSteamAchievements();
      } catch (err) {
        achResult = { success: false, imported: 0, skipped: 0, failed: 0, total: 0, achievements: [] };
      }

      cleanup?.();
      await get().loadSteamStatus();

      if (libResult) {
        const totalErrors = (libResult.errors || 0) + (achResult?.failed || 0);
        const achMsg = achResult ? `${achResult.imported} with achievements, ${achResult.skipped} without` : '';
        set({
          lastSyncResult: {
            success: libResult.success !== false,
            message: libResult.message || (achMsg ? `Synced achievements: ${achMsg}` : 'Sync complete'),
            imported: libResult.imported || 0,
            updated: libResult.updated || 0,
            errors: totalErrors,
          },
        });
        if (libResult.success !== false) {
          useGameStore.getState().fetchGames();
          useGameStore.getState().fetchStats();
          useGameStore.getState().fetchInsights();
        }
      }
      set({ syncing: false, syncProgress: null });
      return libResult;
    } catch (err) {
      set({ syncing: false, syncProgress: null });
      throw err;
    }
  },

  steamDisconnect: async () => {
    try {
      await window.backly.steamDisconnect();
      set({ steamStatus: { isConnected: false, username: null, avatar: null, lastSync: null } });
    } catch (err) {
      console.error('Failed to disconnect Steam:', err);
    }
  },

  clearSyncResult: () => set({ lastSyncResult: null }),
}));
