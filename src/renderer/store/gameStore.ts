import { create } from 'zustand';
import { GameStatus } from '../../shared/types';

interface GameStore {
  games: any[];
  totalGames: number;
  selectedGame: any | null;
  stats: any | null;
  insights: any[];
  recommendations: any[];
  loading: boolean;
  error: string | null;

  fetchGames: (params?: any) => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchInsights: () => Promise<void>;
  fetchRecommendations: (type?: string) => Promise<void>;
  selectGame: (game: any | null) => void;
  createGame: (data: any) => Promise<void>;
  updateGame: (id: string, data: any) => Promise<void>;
  deleteGame: (id: string) => Promise<void>;
  searchGames: (query: string) => Promise<any[]>;
}

export const useGameStore = create<GameStore>((set, get) => ({
  games: [],
  totalGames: 0,
  selectedGame: null,
  stats: null,
  insights: [],
  recommendations: [],
  loading: false,
  error: null,

  fetchGames: async (params) => {
    set({ loading: true, error: null });
    try {
      const { games, total } = await window.backly.getGames(params);
      set({ games, totalGames: total, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchStats: async () => {
    try {
      const stats = await window.backly.getDashboardStats();
      set({ stats });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  fetchInsights: async () => {
    try {
      const insights = await window.backly.getBacklogInsights();
      set({ insights });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  fetchRecommendations: async (type) => {
    try {
      const recommendations = await window.backly.getRecommendations(type);
      set({ recommendations });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  selectGame: (game) => set({ selectedGame: game }),

  createGame: async (data) => {
    try {
      await window.backly.createGame(data);
      await get().fetchGames();
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  updateGame: async (id, data) => {
    try {
      await window.backly.updateGame(id, data);
      await get().fetchGames();
      await get().fetchStats();
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  deleteGame: async (id) => {
    try {
      await window.backly.deleteGame(id);
      await get().fetchGames();
      await get().fetchStats();
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  searchGames: async (query) => {
    return window.backly.searchGames(query);
  },
}));
