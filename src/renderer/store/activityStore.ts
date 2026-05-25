import { create } from 'zustand';
import { ActivityEvent, ActivityType } from '../../shared/types';

interface ActivityStore {
  activities: ActivityEvent[];
  total: number;
  loading: boolean;
  hasMore: boolean;

  fetchActivities: (params?: { limit?: number; offset?: number }) => Promise<void>;
  loadMore: () => Promise<void>;
  pushActivity: (activity: ActivityEvent) => void;
  createActivity: (type: ActivityType, payload: any) => Promise<void>;
}

const PAGE_SIZE = 50;

export const useActivityStore = create<ActivityStore>((set, get) => ({
  activities: [],
  total: 0,
  loading: false,
  hasMore: true,

  fetchActivities: async (params) => {
    set({ loading: true });
    try {
      const result = await window.backly.getActivities(params);
      set({
        activities: result.activities,
        total: result.total,
        loading: false,
        hasMore: result.activities.length < result.total,
      });
    } catch {
      set({ loading: false });
    }
  },

  loadMore: async () => {
    const { activities, loading, hasMore } = get();
    if (loading || !hasMore) return;

    set({ loading: true });
    try {
      const result = await window.backly.getActivities({
        offset: activities.length,
        limit: PAGE_SIZE,
      });
      set({
        activities: [...activities, ...result.activities],
        total: result.total,
        loading: false,
        hasMore: activities.length + result.activities.length < result.total,
      });
    } catch {
      set({ loading: false });
    }
  },

  pushActivity: (activity) => {
    set(state => ({
      activities: [activity, ...state.activities],
      total: state.total + 1,
    }));
  },

  createActivity: async (type, payload) => {
    try {
      const activity = await window.backly.createActivity(type, payload);
      get().pushActivity(activity);
    } catch {
      // silently fail
    }
  },
}));
