import { contextBridge, ipcRenderer } from 'electron';

const api = {
  getDashboardStats: () => ipcRenderer.invoke('get-dashboard-stats'),
  getGames: (params?: any) => ipcRenderer.invoke('get-games', params),
  getGameById: (id: string) => ipcRenderer.invoke('get-game-by-id', id),
  createGame: (data: any) => ipcRenderer.invoke('create-game', data),
  updateGame: (id: string, data: any) => ipcRenderer.invoke('update-game', id, data),
  deleteGame: (id: string) => ipcRenderer.invoke('delete-game', id),
  searchGames: (query: string) => ipcRenderer.invoke('search-games', query),

  steamAuthUrl: () => ipcRenderer.invoke('steam-auth-url'),
  steamLogin: () => ipcRenderer.invoke('steam-login'),
  steamSync: () => ipcRenderer.invoke('steam-sync'),
  steamStatus: () => ipcRenderer.invoke('steam-status'),
  steamDisconnect: () => ipcRenderer.invoke('steam-disconnect'),

  hltbLookup: (title: string) => ipcRenderer.invoke('hltb-lookup', title),
  hltbBatchSync: () => ipcRenderer.invoke('hltb-batch-sync'),

  getBacklogInsights: () => ipcRenderer.invoke('get-backlog-insights'),
  getRecommendations: (type?: string) => ipcRenderer.invoke('get-recommendations', type),

  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSettings: (settings: any) => ipcRenderer.invoke('update-settings', settings),

  getProfiles: () => ipcRenderer.invoke('get-profiles'),
  switchProfile: (id: string) => ipcRenderer.invoke('switch-profile', id),

  exportData: (format: string) => ipcRenderer.invoke('export-data', format),
  importData: (data: string) => ipcRenderer.invoke('import-data', data),

  getActivities: (params?: any) => ipcRenderer.invoke('get-activities', params),
  createActivity: (type: string, payload: any) => ipcRenderer.invoke('create-activity', type, payload),
  getBacklogHealth: () => ipcRenderer.invoke('get-backlog-health'),
  getCloseToCompletion: () => ipcRenderer.invoke('get-close-to-completion'),
  getShortSessionGames: () => ipcRenderer.invoke('get-short-session-games'),
  getGameAchievements: (gameId: string) => ipcRenderer.invoke('get-game-achievements', gameId),
  getAllAchievements: () => ipcRenderer.invoke('get-all-achievements'),
  syncSteamAchievements: () => ipcRenderer.invoke('sync-steam-achievements'),
  getAchievementStats: () => ipcRenderer.invoke('get-achievement-stats'),
  getWrappedData: (year: number) => ipcRenderer.invoke('get-wrapped-data', year),
  getGenreGradient: (genre: string) => ipcRenderer.invoke('get-genre-gradient', genre),

  minimizeToTray: () => ipcRenderer.invoke('minimize-to-tray'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),

  onNavigate: (callback: (path: string) => void) => {
    ipcRenderer.on('navigate', (_event, path: string) => callback(path));
  },
  onQuickLookup: (callback: () => void) => {
    ipcRenderer.on('quick-lookup', () => callback());
  },
  onRandomGame: (callback: () => void) => {
    ipcRenderer.on('random-game', () => callback());
  },
  onUpdateProgress: (callback: (percent: number) => void) => {
    ipcRenderer.on('update-progress', (_event, percent: number) => callback(percent));
  },

  onActivityUpdate: (callback: (activity: any) => void) => {
    const handler = (_event: any, activity: any) => callback(activity);
    ipcRenderer.on('activity-update', handler);
    return () => {
      ipcRenderer.removeListener('activity-update', handler);
    };
  },

  onSyncProgress: (callback: (data: { current: number; total: number; message: string }) => void) => {
    const handler = (_event: any, data: { current: number; total: number; message: string }) => callback(data);
    ipcRenderer.on('sync-progress', handler);
    return () => {
      ipcRenderer.removeListener('sync-progress', handler);
    };
  },

  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  },
};

contextBridge.exposeInMainWorld('backly', api);
