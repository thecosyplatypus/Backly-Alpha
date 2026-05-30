import { GameStatus } from '../../shared/types';

export declare global {
  interface Window {
    backly: BacklyAPI;
  }
}

export interface BacklyAPI {
  getDashboardStats: () => Promise<any>;
  getGames: (params?: any) => Promise<{ games: any[]; total: number }>;
  getGameById: (id: string) => Promise<any>;
  createGame: (data: any) => Promise<any>;
  updateGame: (id: string, data: any) => Promise<any>;
  deleteGame: (id: string) => Promise<any>;
  searchGames: (query: string) => Promise<any[]>;
  steamAuthUrl: () => Promise<string>;
  steamLogin: () => Promise<any>;
  steamSync: () => Promise<any>;
  steamStatus: () => Promise<any>;
  steamDisconnect: () => Promise<any>;
  getBacklogInsights: () => Promise<any[]>;
  getRecommendations: (type?: string) => Promise<any[]>;
  getSettings: () => Promise<any>;
  updateSettings: (settings: any) => Promise<any>;
  getProfiles: () => Promise<any[]>;
  switchProfile: (id: string) => Promise<any>;
  exportData: (format: string) => Promise<string>;
  importData: (data: string) => Promise<any>;
  getActivities: (params?: any) => Promise<{ activities: any[]; total: number }>;
  createActivity: (type: string, payload: any) => Promise<any>;
  getBacklogHealth: () => Promise<any>;
  getCloseToCompletion: () => Promise<any[]>;
  getShortSessionGames: () => Promise<any[]>;
  getGameAchievements: (gameId: string) => Promise<{
    totalAchievements: number;
    unlockedAchievements: number;
    completionPercentage: number;
    achievements: any[];
  } | null>;
  getAllAchievements: () => Promise<any[]>;
  syncSteamAchievements: () => Promise<any>;
  getAchievementStats: () => Promise<{ total: number; unlocked: number; locked: number; games: number }>;
  getWrappedData: (year: number) => Promise<any>;
  getGenreGradient: (genre: string) => Promise<string>;
  factoryReset: () => Promise<{ success: boolean }>;

  minimizeToTray: () => Promise<void>;
  getPlatform: () => Promise<string>;
  onActivityUpdate: (callback: (activity: any) => void) => (() => void) | undefined;
  onNavigate: (callback: (path: string) => void) => void;
  onQuickLookup: (callback: () => void) => void;
  onRandomGame: (callback: () => void) => void;
  onUpdateProgress: (callback: (percent: number) => void) => void;
  onSyncProgress: (callback: (data: { current: number; total: number; message: string }) => void) => (() => void) | undefined;
  removeAllListeners: (channel: string) => void;
}
