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
  steamSetId: (steamId: string) => ipcRenderer.invoke('steam-set-id', steamId),
  steamDisconnect: () => ipcRenderer.invoke('steam-disconnect'),
  launchSteamGame: (steamAppId: string) => ipcRenderer.invoke('launch-steam-game', steamAppId),

  getBacklogInsights: () => ipcRenderer.invoke('get-backlog-insights'),
  getRecommendations: (type?: string) => ipcRenderer.invoke('get-recommendations', type),

  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSettings: (settings: any) => ipcRenderer.invoke('update-settings', settings),

  getProfiles: () => ipcRenderer.invoke('get-profiles'),
  switchProfile: (id: string) => ipcRenderer.invoke('switch-profile', id),

  exportData: (format: string) => ipcRenderer.invoke('export-data', format),
  importData: (data: string) => ipcRenderer.invoke('import-data', data),
  factoryReset: () => ipcRenderer.invoke('factory-reset'),

  getActivities: (params?: any) => ipcRenderer.invoke('get-activities', params),
  createActivity: (type: string, payload: any) => ipcRenderer.invoke('create-activity', type, payload),
  getBacklogHealth: () => ipcRenderer.invoke('get-backlog-health'),
  getCloseToCompletion: () => ipcRenderer.invoke('get-close-to-completion'),
  getShortSessionGames: () => ipcRenderer.invoke('get-short-session-games'),
  getWeeklyActivity: () => ipcRenderer.invoke('get-weekly-activity'),
  getGameAchievements: (gameId: string) => ipcRenderer.invoke('get-game-achievements', gameId),
  getAllAchievements: () => ipcRenderer.invoke('get-all-achievements'),
  syncSteamAchievements: () => ipcRenderer.invoke('sync-steam-achievements'),
  refreshGameMetadata: (gameId: string) => ipcRenderer.invoke('refresh-game-metadata', gameId),
  refreshAllMetadata: () => ipcRenderer.invoke('refresh-all-metadata'),
  minimizeToTray: () => ipcRenderer.invoke('minimize-to-tray'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),

  onNavigate: (callback: (path: string) => void) => {
    const handler = (_event: any, path: string) => callback(path);
    ipcRenderer.on('navigate', handler);
    return () => { ipcRenderer.removeListener('navigate', handler); };
  },
  onQuickLookup: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('quick-lookup', handler);
    return () => { ipcRenderer.removeListener('quick-lookup', handler); };
  },
  onRandomGame: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('random-game', handler);
    return () => { ipcRenderer.removeListener('random-game', handler); };
  },
  onUpdateProgress: (callback: (percent: number) => void) => {
    const handler = (_event: any, percent: number) => callback(percent);
    ipcRenderer.on('update-progress', handler);
    return () => { ipcRenderer.removeListener('update-progress', handler); };
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
