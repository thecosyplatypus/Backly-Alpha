const isViteProd = typeof import.meta !== 'undefined' && (import.meta as any).env?.PROD;
if (isViteProd) {
  (window as any).__backlyMock = false;
} else {
  console.log('[Backly Dev] Initializing mock API...');

const mockDb = {
  games: [
    {
      id: '1', title: 'Elden Ring', slug: 'elden-ring', coverArt: null, banner: null,
      platform: 'PC', genre: 'Action RPG', developer: 'FromSoftware', publisher: 'Bandai Namco',
      releaseDate: '2022-02-25', steamAppId: '1245620', steamData: null,
      status: 'PLAYING', userRating: 9, notes: null, tags: 'open-world,difficult',
      isFavourite: true, hoursPlayed: 142, completionDate: null,
      createdAt: '2024-01-15', updatedAt: '2024-12-01',
      achievementsData: null, lastPlayed: '2024-12-05', profileId: '1',
    },
    {
      id: '2', title: 'Baldur\'s Gate 3', slug: 'baldurs-gate-3', coverArt: null, banner: null,
      platform: 'PC', genre: 'RPG', developer: 'Larian Studios', publisher: 'Larian Studios',
      releaseDate: '2023-08-03', steamAppId: '1086940', steamData: null,
      status: 'PLAYING', userRating: 10, notes: null, tags: 'cRPG,story-rich',
      isFavourite: true, hoursPlayed: 87, completionDate: null,
      createdAt: '2024-02-10', updatedAt: '2024-12-03',
      achievementsData: null, lastPlayed: '2024-12-07', profileId: '1',
    },
    {
      id: '3', title: 'Portal 2', slug: 'portal-2', coverArt: null, banner: null,
      platform: 'PC', genre: 'Puzzle', developer: 'Valve', publisher: 'Valve',
      releaseDate: '2011-04-18', steamAppId: '620', steamData: null,
      status: 'COMPLETED', userRating: 9, notes: null, tags: 'puzzle,classic',
      isFavourite: true, hoursPlayed: 24, completionDate: '2024-11-20',
      createdAt: '2024-03-01', updatedAt: '2024-11-20',
      achievementsData: null, lastPlayed: '2024-11-18', profileId: '1',
    },
    {
      id: '4', title: 'Cyberpunk 2077', slug: 'cyberpunk-2077', coverArt: null, banner: null,
      platform: 'PC', genre: 'Action RPG', developer: 'CD Projekt Red', publisher: 'CD Projekt',
      releaseDate: '2020-12-10', steamAppId: '1091500', steamData: null,
      status: 'PLAYING', userRating: 8, notes: null, tags: 'open-world,sci-fi',
      isFavourite: false, hoursPlayed: 65, completionDate: null,
      createdAt: '2024-04-05', updatedAt: '2024-11-28',
      achievementsData: null, lastPlayed: '2024-11-30', profileId: '1',
    },
    {
      id: '5', title: 'Hades', slug: 'hades', coverArt: null, banner: null,
      platform: 'PC', genre: 'Roguelike', developer: 'Supergiant Games', publisher: 'Supergiant Games',
      releaseDate: '2020-09-17', steamAppId: '1145360', steamData: null,
      status: 'COMPLETED', userRating: 9, notes: null, tags: 'roguelike,mythology',
      isFavourite: true, hoursPlayed: 120, completionDate: '2024-08-15',
      createdAt: '2024-01-20', updatedAt: '2024-08-15',
      achievementsData: null, lastPlayed: '2024-08-10', profileId: '1',
    },
    {
      id: '6', title: 'Stardew Valley', slug: 'stardew-valley', coverArt: null, banner: null,
      platform: 'PC', genre: 'Simulation', developer: 'ConcernedApe', publisher: 'ConcernedApe',
      releaseDate: '2016-02-26', steamAppId: '413150', steamData: null,
      status: 'PAUSED', userRating: 8, notes: null, tags: 'farming,relaxing',
      isFavourite: false, hoursPlayed: 55, completionDate: null,
      createdAt: '2024-03-10', updatedAt: '2024-10-01',
      achievementsData: null, lastPlayed: '2024-09-28', profileId: '1',
    },
    {
      id: '7', title: 'The Witcher 3', slug: 'the-witcher-3', coverArt: null, banner: null,
      platform: 'PC', genre: 'Action RPG', developer: 'CD Projekt Red', publisher: 'CD Projekt',
      releaseDate: '2015-05-18', steamAppId: '292030', steamData: null,
      status: 'BACKLOG', userRating: null, notes: null, tags: 'open-world,story-rich',
      isFavourite: false, hoursPlayed: 0, completionDate: null,
      createdAt: '2024-05-01', updatedAt: '2024-05-01',
      achievementsData: null, lastPlayed: null, profileId: '1',
    },
    {
      id: '8', title: 'Hollow Knight', slug: 'hollow-knight', coverArt: null, banner: null,
      platform: 'PC', genre: 'Metroidvania', developer: 'Team Cherry', publisher: 'Team Cherry',
      releaseDate: '2017-02-24', steamAppId: '367520', steamData: null,
      status: 'BACKLOG', userRating: null, notes: null, tags: 'metroidvania,difficult',
      isFavourite: false, hoursPlayed: 0, completionDate: null,
      createdAt: '2024-06-15', updatedAt: '2024-06-15',
      achievementsData: null, lastPlayed: null, profileId: '1',
    },
    {
      id: '9', title: 'Disco Elysium', slug: 'disco-elysium', coverArt: null, banner: null,
      platform: 'PC', genre: 'RPG', developer: 'ZA/UM', publisher: 'ZA/UM',
      releaseDate: '2019-10-15', steamAppId: '632470', steamData: null,
      status: 'WISHLIST', userRating: null, notes: null, tags: 'story-rich,detective',
      isFavourite: false, hoursPlayed: 0, completionDate: null,
      createdAt: '2024-07-20', updatedAt: '2024-07-20',
      achievementsData: null, lastPlayed: null, profileId: '1',
    },
    {
      id: '10', title: 'Red Dead Redemption 2', slug: 'rdr2', coverArt: null, banner: null,
      platform: 'PC', genre: 'Action Adventure', developer: 'Rockstar Games', publisher: 'Rockstar Games',
      releaseDate: '2019-11-05', steamAppId: '1174180', steamData: null,
      status: 'BACKLOG', userRating: null, notes: null, tags: 'open-world,western',
      isFavourite: true, hoursPlayed: 15, completionDate: null,
      createdAt: '2024-08-01', updatedAt: '2024-12-01',
      achievementsData: null, lastPlayed: '2024-12-01', profileId: '1',
    },
  ],
  settings: {
    theme: 'dark', sidebarCollapsed: false, autoSync: true, syncInterval: 30,
    notificationsEnabled: true, minimizeToTray: true, startOnBoot: false, language: 'en',
  },
  steamStatus: { isConnected: false, username: 'Player', avatar: null, lastSync: null },
  activities: [
    {
      id: 'a1', type: 'game_completed', gameId: '3', gameTitle: 'Portal 2',
      icon: 'check', description: 'Completed Portal 2', metadata: null,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'a2', type: 'game_started', gameId: '1', gameTitle: 'Elden Ring',
      icon: 'play', description: 'Started playing Elden Ring', metadata: null,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: 'a3', type: 'added_to_backlog', gameId: '10', gameTitle: 'Red Dead Redemption 2',
      icon: 'plus', description: 'Added Red Dead Redemption 2 to backlog', metadata: null,
      createdAt: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      id: 'a4', type: 'achievement_unlocked', gameId: '5', gameTitle: 'Hades',
      icon: 'trophy', description: 'Earned "Marathon" achievement', metadata: null,
      createdAt: new Date(Date.now() - 259200000).toISOString(),
    },
    {
      id: 'a5', type: 'added_to_backlog', gameId: null, gameTitle: null,
      icon: 'plus', description: 'Added 3 games to backlog', metadata: JSON.stringify({ count: 3 }),
      createdAt: new Date(Date.now() - 345600000).toISOString(),
    },
  ],
};

function delay(ms = 200) {
  return new Promise((r) => setTimeout(r, ms));
}

const listeners = new Map<string, Set<(...args: any[]) => void>>();

(window as any).backly = {
  // Games
  getDashboardStats: async () => {
    await delay();
    const games = mockDb.games;
    const completed = games.filter((g) => g.status === 'COMPLETED');
    const backlog = games.filter((g) => g.status === 'BACKLOG');
    const wishlist = games.filter((g) => g.status === 'WISHLIST');
    const playing = games.filter((g) => g.status === 'PLAYING');
    const totalHours = games.reduce((s, g) => s + g.hoursPlayed, 0);
    return {
      totalGames: games.length,
      completedGames: completed.length,
      backlogCount: backlog.length,
      wishlistCount: wishlist.length,
      completionPercent: games.length > 0 ? Math.round((completed.length / games.length) * 100) : 0,
      totalHoursPlayed: totalHours,
      completedThisYear: completed.length,
      mostPlayedGenre: 'Action RPG',
      avgCompletionTime: 45,
      isSteamSynced: false,
      totalBacklogEstimate: 0,
      currentlyPlaying: playing.length,
      startedCount: games.filter((g) => g.status === 'STARTED').length,
      droppedCount: games.filter((g) => g.status === 'DROPPED').length,
      pausedCount: games.filter((g) => g.status === 'PAUSED').length,
      favouriteCount: games.filter((g) => g.isFavourite).length,
    };
  },
  getGames: async (params?: any) => {
    await delay();
    let result = [...mockDb.games];
    const total = result.length;
    if (params?.offset) result = result.slice(params.offset);
    if (params?.limit) result = result.slice(0, params.limit);
    if (params?.sort === 'recent') {
      result.sort((a, b) => {
        const aDate = a.lastPlayed || a.updatedAt;
        const bDate = b.lastPlayed || b.updatedAt;
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });
    }
    return { games: result, total };
  },
  getGameById: async (id: string) => {
    await delay();
    return mockDb.games.find((g) => g.id === id) || null;
  },
  createGame: async (_data: any) => { await delay(); return { id: String(Date.now()) }; },
  updateGame: async (_id: string, _data: any) => { await delay(); },
  deleteGame: async (_id: string) => { await delay(); },
  searchGames: async (_query: string) => { await delay(); return []; },

  // Steam
  steamAuthUrl: async () => { await delay(); return 'https://steamcommunity.com/openid/login'; },
  steamLogin: async () => { await delay(); mockDb.steamStatus.isConnected = true; return { success: true }; },
  steamSync: async () => { await delay(); return { success: true, imported: 5, updated: 3, errors: 0 }; },
  steamStatus: async () => { await delay(); return { ...mockDb.steamStatus }; },
  steamDisconnect: async () => { await delay(); mockDb.steamStatus.isConnected = false; },

  // Activities
  getActivities: async (params?: any) => {
    await delay(150);
    let result = [...mockDb.activities];
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const total = result.length;
    if (params?.offset) result = result.slice(params.offset);
    if (params?.limit) result = result.slice(0, params.limit);
    return { activities: result, total };
  },
  createActivity: async (type: string, payload: any) => {
    await delay(100);
    const activity = {
      id: `a${Date.now()}`,
      type,
      gameId: payload.gameId || null,
      gameTitle: payload.gameTitle || null,
      icon: type === 'game_started' ? 'play' : type === 'game_completed' ? 'check' : type === 'added_to_backlog' ? 'plus' : 'default',
      description: payload.description || `${type.replace(/_/g, ' ')}`,
      metadata: payload.metadata ? JSON.stringify(payload.metadata) : null,
      createdAt: new Date().toISOString(),
    };
    mockDb.activities.unshift(activity);
    return activity;
  },

  // Insights
  getBacklogInsights: async () => { await delay(); return []; },
  getRecommendations: async (_type?: string) => { await delay(); return mockDb.games.slice(0, 3).map((g) => ({ game: g, reason: 'Popular choice', priority: 1 })); },
  getSmartTips: async () => { await delay(); return { quickWins: 3, almostThere: 2, hiddenGems: 5, cleanup: 12 }; },

  // Settings
  getSettings: async () => { await delay(); return { ...mockDb.settings }; },
  updateSettings: async (settings: any) => { await delay(); Object.assign(mockDb.settings, settings); return { ...mockDb.settings }; },

  // Backlog Health
  getBacklogHealth: async () => {
    await delay(100);
    const games = mockDb.games;
    const total = games.length;
    const completed = games.filter(g => g.status === 'COMPLETED').length;
    const unplayed = games.filter(g => g.hoursPlayed === 0).length;
    const abandoned = games.filter(g => g.status === 'DROPPED').length;
    const completionRate = total > 0 ? completed / total : 0;
    const unplayedRate = total > 0 ? unplayed / total : 0;
    const abandonedRate = total > 0 ? abandoned / total : 0;
    const score = Math.round(completionRate * 40 + (1 - unplayedRate) * 30 + (1 - abandonedRate) * 20 + 10);
    const rating = score >= 70 ? 'healthy' : score >= 45 ? 'growing' : score >= 25 ? 'overloaded' : 'critical';
    return {
      rating, score, completionRate, unplayedRate, abandonedRate,
      startedVsFinished: total > 0 ? Math.round((completed / (games.length)) * 100) : 0,
      totalGames: total, completedGames: completed, unplayedGames: unplayed, abandonedGames: abandoned,
      message: rating === 'healthy' ? 'Your backlog is in great shape!' : 'Your backlog is growing.',
      tip: 'Keep up the good work!',
    };
  },
  getCloseToCompletion: async () => {
    await delay(100);
    const games = mockDb.games.filter(g => g.status !== 'COMPLETED' && g.hoursPlayed > 0);
    return games.map(g => ({
      game: g,
      progress: Math.min(100, Math.round((g.hoursPlayed / Math.max(1, g.hoursPlayed + 1)) * 100)),
      estimatedRemaining: 0,
    })).sort((a, b) => b.progress - a.progress).slice(0, 6);
  },
  getShortSessionGames: async () => {
    await delay(100);
    const games = mockDb.games.filter(g => g.status !== 'COMPLETED');
    return [
      {
        id: 'under-5', title: 'Under 5 Hours', description: 'Perfect for tonight', icon: 'clock',
        games: games.filter(g => g.hoursPlayed > 0 && g.hoursPlayed <= 5).slice(0, 6),
      },
      {
        id: 'weekend', title: 'Weekend RPGs', description: 'Dive into something deeper', icon: 'calendar',
        games: games.filter(g => g.genre === 'RPG').slice(0, 6),
      },
      {
        id: 'relaxing', title: 'Relaxing Games', description: 'Wind down with something chill', icon: 'coffee',
        games: games.filter(g => ['Simulation', 'Puzzle', 'Adventure'].includes(g.genre || '')).slice(0, 6),
      },
    ].filter(c => c.games.length > 0);
  },

  // Achievements
  getGameAchievements: async (gameId: string) => {
    await delay(100);
    const all = await (window as any).backly.getAllAchievements();
    const filtered = all.filter((a: any) => a.gameId === gameId);
    const unlocked = filtered.filter((a: any) => a.unlocked).length;
    const total = filtered.length;
    return {
      totalAchievements: total,
      unlockedAchievements: unlocked,
      completionPercentage: total > 0 ? Math.round((unlocked / total) * 100) : 0,
      achievements: filtered.sort((a: any, b: any) => {
        if (a.unlocked && !b.unlocked) return -1;
        if (!a.unlocked && b.unlocked) return 1;
        return 0;
      }),
    };
  },
  getAllAchievements: async () => {
    await delay(200);
    return [
      { id: 'ach1', name: 'Marathon', description: 'Complete 10 games', iconUrl: null, unlocked: true, unlockedAt: '2024-12-01', globalProgress: 12.5, gameId: '5', gameTitle: 'Hades' },
      { id: 'ach2', name: 'Rare Trophy', description: 'Complete a game on hard difficulty', iconUrl: null, unlocked: true, unlockedAt: '2024-11-20', globalProgress: 8.3, gameId: '3', gameTitle: 'Portal 2' },
      { id: 'ach3', name: 'Speed Demon', description: 'Complete the game in under 2 hours', iconUrl: null, unlocked: false, unlockedAt: null, globalProgress: 3.1, gameId: '3', gameTitle: 'Portal 2' },
      { id: 'ach4', name: 'Completionist', description: 'Collect all achievements', iconUrl: null, unlocked: false, unlockedAt: null, globalProgress: 1.2, gameId: '5', gameTitle: 'Hades' },
      { id: 'ach5', name: 'Veteran', description: 'Play for 100 hours', iconUrl: null, unlocked: true, unlockedAt: '2024-10-15', globalProgress: 22.8, gameId: '1', gameTitle: 'Elden Ring' },
      { id: 'ach6', name: 'Explorer', description: 'Discover all locations', iconUrl: null, unlocked: false, unlockedAt: null, globalProgress: 15.4, gameId: '1', gameTitle: 'Elden Ring' },
      { id: 'ach7', name: 'Collector', description: 'Collect all items', iconUrl: null, unlocked: false, unlockedAt: null, globalProgress: 5.7, gameId: '1', gameTitle: 'Elden Ring' },
    ];
  },
  syncSteamAchievements: async () => {
    await delay(2000);
    return { success: true, message: 'Synced achievements for 3 games', synced: 3, total: 5 };
  },
  getAchievementStats: async () => {
    await delay(100);
    const all = await (window as any).backly.getAllAchievements();
    return {
      total: all.length,
      unlocked: all.filter((a: any) => a.unlocked).length,
      locked: all.filter((a: any) => !a.unlocked).length,
      games: [...new Set(all.map((a: any) => a.gameId))].length,
    };
  },

  // Profiles
  getProfiles: async () => { await delay(); return [{ id: '1', name: 'Player', steamUsername: null }]; },
  switchProfile: async (_id: string) => { await delay(); },

  // Data
  exportData: async (_format: string) => { await delay(); return ''; },
  importData: async (_data: string) => { await delay(); return { success: true, imported: 0 }; },

  // System
  minimizeToTray: async () => { await delay(); },
  getPlatform: async () => { await delay(); return 'win32'; },

  // Events
  onActivityUpdate: (callback: (activity: any) => void) => {
    if (!listeners.has('activity-update')) listeners.set('activity-update', new Set());
    listeners.get('activity-update')!.add(callback);
    return () => { listeners.get('activity-update')?.delete(callback); };
  },

  onNavigate: (callback: (path: string) => void) => {
    if (!listeners.has('navigate')) listeners.set('navigate', new Set());
    listeners.get('navigate')!.add(callback);
  },
  onQuickLookup: (callback: () => void) => {
    if (!listeners.has('quick-lookup')) listeners.set('quick-lookup', new Set());
    listeners.get('quick-lookup')!.add(callback);
  },
  onRandomGame: (callback: () => void) => {
    if (!listeners.has('random-game')) listeners.set('random-game', new Set());
    listeners.get('random-game')!.add(callback);
  },
  onUpdateProgress: (callback: (percent: number) => void) => {
    if (!listeners.has('update-progress')) listeners.set('update-progress', new Set());
    listeners.get('update-progress')!.add(callback);
  },
  onSyncProgress: (_callback: (data: { current: number; total: number; message: string }) => void) => {
    return () => {};
  },
  removeAllListeners: (channel: string) => {
    listeners.delete(channel);
  },
};

console.log('[Backly Dev] Mock API initialized with', mockDb.games.length, 'games');
}
