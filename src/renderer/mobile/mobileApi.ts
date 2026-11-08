import { GameStatus } from '../../shared/types';

/**
 * Offline data layer for the Android build.
 *
 * The desktop app talks to Electron through `window.backly` (IPC + Prisma).
 * Android has no Electron main process, so this module provides the same
 * interface backed by localStorage. It is only installed when a `window.backly`
 * bridge does not already exist (i.e. in the Capacitor build).
 */

interface StoredSession {
  date: string;
  hours: number;
  title: string;
}

interface StoredActivity {
  id: string;
  type: string;
  gameId: string | null;
  gameTitle: string | null;
  icon: string;
  description: string;
  metadata: string | null;
  createdAt: string;
}

interface MobileState {
  version: 1;
  profileId: string;
  games: any[];
  activities: StoredActivity[];
  sessions: StoredSession[];
  settings: any;
}

const STORAGE_KEY = 'backly.mobile.v1';

const DEFAULT_SETTINGS = {
  theme: 'dark',
  sidebarCollapsed: false,
  autoSync: false,
  syncInterval: 30,
  notificationsEnabled: true,
  minimizeToTray: false,
  startOnBoot: false,
  language: 'en',
  xp: 0,
};

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    // fall through
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function slugify(title: string): string {
  return String(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'game';
}

function defaultState(): MobileState {
  return {
    version: 1,
    profileId: 'local',
    games: [],
    activities: [],
    sessions: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}

function loadState(): MobileState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    const base = defaultState();
    return {
      ...base,
      ...parsed,
      version: 1,
      games: Array.isArray(parsed.games) ? parsed.games : [],
      activities: Array.isArray(parsed.activities) ? parsed.activities : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      settings: { ...base.settings, ...(parsed.settings || {}) },
    };
  } catch (err) {
    console.error('[Backly Mobile] Failed to load local data:', err);
    return defaultState();
  }
}

let state: MobileState = loadState();

function save(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('[Backly Mobile] Failed to save local data:', err);
  }
}

const listeners = new Map<string, Set<(...args: any[]) => void>>();

function emit(channel: string, payload?: any): void {
  const set = listeners.get(channel);
  if (!set) return;
  for (const fn of set) {
    try {
      fn(payload);
    } catch (err) {
      console.error('[Backly Mobile] Listener error:', err);
    }
  }
}

function on(channel: string, callback: (...args: any[]) => void): () => void {
  if (!listeners.has(channel)) listeners.set(channel, new Set());
  listeners.get(channel)!.add(callback);
  return () => listeners.get(channel)?.delete(callback);
}

const ACTIVITY_ICONS: Record<string, string> = {
  game_started: 'play',
  game_completed: 'check',
  added_to_backlog: 'plus',
  removed_from_backlog: 'trash',
  game_stopped: 'stop',
  game_favourited: 'heart',
  game_unfavourited: 'heart-off',
  achievement_unlocked: 'trophy',
  milestone_reached: 'award',
  wheel_spin: 'dice',
};

function createActivity(type: string, payload: {
  gameId?: string | null;
  gameTitle?: string | null;
  description?: string;
  metadata?: any;
} = {}): StoredActivity {
  const verb = String(type).replace(/_/g, ' ');
  let description = payload.description;
  if (!description) {
    if (type === 'added_to_backlog' && payload.gameTitle) description = `Added ${payload.gameTitle} to backlog`;
    else if (type === 'removed_from_backlog' && payload.gameTitle) description = `Removed ${payload.gameTitle} from backlog`;
    else if (type === 'game_completed' && payload.gameTitle) description = `Completed ${payload.gameTitle}`;
    else if (type === 'game_started' && payload.gameTitle) description = `Started playing ${payload.gameTitle}`;
    else if (type === 'game_stopped' && payload.gameTitle) description = `Stopped playing ${payload.gameTitle}`;
    else if (type === 'game_favourited' && payload.gameTitle) description = `Favourited ${payload.gameTitle}`;
    else if (type === 'game_unfavourited' && payload.gameTitle) description = `Unfavourited ${payload.gameTitle}`;
    else description = verb.charAt(0).toUpperCase() + verb.slice(1);
  }

  const activity: StoredActivity = {
    id: newId(),
    type,
    gameId: payload.gameId ?? null,
    gameTitle: payload.gameTitle ?? null,
    icon: ACTIVITY_ICONS[type] || 'default',
    description,
    metadata: payload.metadata ? JSON.stringify(payload.metadata) : null,
    createdAt: nowIso(),
  };

  state.activities.unshift(activity);
  emit('activity-update', activity);
  return activity;
}

function findGame(id: string): any | undefined {
  return state.games.find((g) => g.id === id);
}

function sortGames(games: any[], sort?: string): any[] {
  const copy = [...games];
  switch (sort) {
    case 'title':
      return copy.sort((a, b) => String(a.title).localeCompare(String(b.title)));
    case 'created':
      return copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    case 'rating':
      return copy.sort((a, b) => (b.userRating || 0) - (a.userRating || 0));
    case 'hours':
      return copy.sort((a, b) => (b.hoursPlayed || 0) - (a.hoursPlayed || 0));
    case 'hours_asc':
      return copy.sort((a, b) => (a.hoursPlayed || 0) - (b.hoursPlayed || 0));
    case 'lastPlayed':
      return copy.sort((a, b) => {
        const aTime = new Date(a.lastPlayed || a.updatedAt || 0).getTime();
        const bTime = new Date(b.lastPlayed || b.updatedAt || 0).getTime();
        return bTime - aTime;
      });
    case 'recent':
      return copy.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    default:
      return copy.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }
}

function getGames(params?: {
  status?: string;
  genre?: string;
  platform?: string;
  search?: string;
  sort?: string;
  tags?: string;
  isFavourite?: boolean;
  limit?: number;
  offset?: number;
}): { games: any[]; total: number } {
  let games = [...state.games];
  const p = params || {};

  if (p.status === 'no-achievements') {
    games = games.filter((g) => !g.totalAchievements);
  } else if (p.status === 'demos') {
    games = games.filter((g) => /(demo|playtest|prologue)$/i.test(String(g.title).trim()));
  } else if (p.status === 'playing-or-recent') {
    const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
    games = games.filter((g) => {
      if (g.status === GameStatus.PLAYING) return true;
      if (g.lastPlayed && new Date(g.lastPlayed).getTime() > cutoff) return true;
      return state.sessions.some((s) => s.title === g.title && new Date(s.date).getTime() > cutoff);
    });
  } else if (p.status) {
    games = games.filter((g) => g.status === p.status);
  }

  if (p.genre) games = games.filter((g) => g.genre === p.genre);
  if (p.platform) games = games.filter((g) => g.platform === p.platform);
  if (p.isFavourite) games = games.filter((g) => g.isFavourite);
  if (p.tags) {
    const tag = p.tags.toLowerCase();
    games = games.filter((g) => String(g.tags || '').toLowerCase().includes(tag));
  }
  if (p.search) {
    const q = p.search.toLowerCase();
    games = games.filter((g) =>
      [g.title, g.developer, g.publisher, g.genre]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }

  games = sortGames(games, p.sort);
  const total = games.length;
  const offset = p.offset || 0;
  const limit = p.limit || 100;
  return { games: games.slice(offset, offset + limit), total };
}

function getDashboardStats() {
  const games = state.games;
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const completed = games.filter((g) => g.status === GameStatus.COMPLETED);
  const backlog = games.filter((g) => g.status === GameStatus.BACKLOG);
  const wishlist = games.filter((g) => g.status === GameStatus.WISHLIST);

  const genreHours: Record<string, number> = {};
  for (const g of games) {
    if (g.genre) genreHours[g.genre] = (genreHours[g.genre] || 0) + (g.hoursPlayed || 0);
  }
  const genreBreakdown = Object.entries(genreHours)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([genre, hours]) => ({ genre, hours: Math.round(hours) }));

  return {
    totalGames: games.length,
    completedGames: completed.length,
    backlogCount: backlog.length,
    wishlistCount: wishlist.length,
    completionPercent: games.length > 0 ? Math.round((completed.length / games.length) * 100) : 0,
    totalHoursPlayed: Math.round(games.reduce((sum, g) => sum + (g.hoursPlayed || 0), 0)),
    completedThisYear: completed.filter((g) => g.completionDate && new Date(g.completionDate) >= yearStart).length,
    mostPlayedGenre: genreBreakdown[0]?.genre || 'N/A',
    genreBreakdown,
    avgCompletionTime: completed.length > 0
      ? Math.round(completed.reduce((sum, g) => sum + (g.hoursPlayed || 0), 0) / completed.length)
      : 0,
    isSteamSynced: false,
    totalBacklogEstimate: Math.round(backlog.reduce((sum, g) => sum + ((g.estimatedHours || 0) > 0 ? g.estimatedHours : 15), 0)),
    currentlyPlaying: games.filter((g) => g.status === GameStatus.PLAYING).length,
    startedCount: games.filter((g) => g.status === GameStatus.STARTED).length,
    droppedCount: games.filter((g) => g.status === GameStatus.DROPPED).length,
    pausedCount: games.filter((g) => g.status === GameStatus.PAUSED).length,
    favouriteCount: games.filter((g) => g.isFavourite).length,
    unlockedAchievements: 0,
  };
}

function getBacklogInsights() {
  const games = state.games;
  const now = Date.now();
  const insights: any[] = [];

  const abandoned = games.filter((g) =>
    g.status === GameStatus.STARTED &&
    (g.hoursPlayed || 0) > 0 &&
    g.lastPlayed &&
    now - new Date(g.lastPlayed).getTime() > 180 * 24 * 60 * 60 * 1000
  );
  if (abandoned.length > 0) {
    insights.push({
      type: 'abandoned',
      title: 'Games You Abandoned',
      description: "You haven't touched these in over 6 months",
      games: abandoned,
    });
  }

  const untouched = games.filter((g) =>
    g.status === GameStatus.BACKLOG &&
    (g.hoursPlayed || 0) === 0 &&
    g.createdAt &&
    now - new Date(g.createdAt).getTime() > 365 * 24 * 60 * 60 * 1000
  );
  if (untouched.length > 0) {
    insights.push({
      type: 'untouched',
      title: 'Games Untouched for Over a Year',
      description: 'Time to revisit these?',
      games: untouched,
    });
  }

  return insights;
}

function getRecommendations(type?: string) {
  const games = state.games.filter((g) => g.status !== GameStatus.COMPLETED);
  const recommendations: any[] = [];

  if (type === 'best') {
    games
      .filter((g) => (g.userRating || 0) >= 7)
      .sort((a, b) => (b.userRating || 0) - (a.userRating || 0))
      .forEach((g) => recommendations.push({ game: g, reason: 'Highly rated - must play!', priority: g.userRating || 0 }));
  } else if (type === 'random') {
    if (games.length > 0) {
      const pick = games[Math.floor(Math.random() * games.length)];
      recommendations.push({ game: pick, reason: 'Random pick - give it a try!', priority: 50 });
    }
  } else if (type === 'short') {
    games
      .filter((g) => (g.estimatedHours || 0) > 0 && g.estimatedHours <= 10)
      .sort((a, b) => (a.estimatedHours || 0) - (b.estimatedHours || 0))
      .forEach((g) => recommendations.push({ game: g, reason: `Short game - about ${Math.round(g.estimatedHours)}h`, priority: 75 }));
  } else if (type === 'close') {
    games
      .filter((g) => (g.completionPercentage || 0) >= 70 && (g.completionPercentage || 0) < 100)
      .sort((a, b) => (b.completionPercentage || 0) - (a.completionPercentage || 0))
      .forEach((g) => recommendations.push({ game: g, reason: `Almost done - ${Math.round(g.completionPercentage || 0)}% complete`, priority: 90 }));
  } else {
    const almostDone = games
      .filter((g) => (g.completionPercentage || 0) >= 70 && (g.completionPercentage || 0) < 100)
      .sort((a, b) => (b.completionPercentage || 0) - (a.completionPercentage || 0))
      .slice(0, 4);
    almostDone.forEach((g) => recommendations.push({
      game: g,
      reason: `Almost done - ${Math.round(g.completionPercentage || 0)}% complete`,
      priority: 90 + (g.completionPercentage || 0),
    }));

    const hiddenGems = games
      .filter((g) => (g.userRating || 0) >= 8 && (g.hoursPlayed || 0) < 5)
      .sort((a, b) => (b.userRating || 0) - (a.userRating || 0))
      .slice(0, 4);
    hiddenGems.forEach((g) => {
      if (!recommendations.find((r) => r.game.id === g.id)) {
        recommendations.push({ game: g, reason: `Hidden gem - rated ${g.userRating}/10`, priority: 80 + (g.userRating || 0) });
      }
    });

    const quickWins = games
      .filter((g) => (g.hoursPlayed || 0) === 0 && g.status === GameStatus.BACKLOG)
      .sort((a, b) => (a.estimatedHours || 15) - (b.estimatedHours || 15))
      .slice(0, 4);
    quickWins.forEach((g) => {
      if (!recommendations.find((r) => r.game.id === g.id)) {
        const est = (g.estimatedHours || 0) > 0 ? Math.round(g.estimatedHours) : 15;
        recommendations.push({ game: g, reason: `Quick win - ~${est}h to beat`, priority: 70 - est });
      }
    });

    games.filter((g) => (g.userRating || 0) >= 7).forEach((g) => {
      if (!recommendations.find((r) => r.game.id === g.id)) {
        recommendations.push({ game: g, reason: 'Highly rated - must play!', priority: (g.userRating || 0) * 5 });
      }
    });

    if (recommendations.length === 0 && games.length > 0) {
      [...games].sort(() => Math.random() - 0.5).slice(0, 5).forEach((g) => {
        recommendations.push({ game: g, reason: 'Give it a try!', priority: 10 });
      });
    }
  }

  return recommendations.sort((a, b) => b.priority - a.priority).slice(0, 10);
}

function getBacklogHealth() {
  const games = state.games;
  const total = games.length;
  if (total === 0) {
    return {
      rating: 'healthy',
      score: 100,
      completionRate: 0,
      unplayedRate: 0,
      abandonedRate: 0,
      startedVsFinished: 0,
      totalGames: 0,
      completedGames: 0,
      unplayedGames: 0,
      abandonedGames: 0,
      message: 'Your backlog is clean!',
      tip: 'Add some games to start tracking.',
    };
  }

  const completed = games.filter((g) => g.status === GameStatus.COMPLETED).length;
  const unplayed = games.filter((g) => (g.hoursPlayed || 0) === 0).length;
  const abandoned = games.filter((g) => g.status === GameStatus.DROPPED).length;
  const started = games.filter((g) => (g.hoursPlayed || 0) > 0 && g.status !== GameStatus.COMPLETED).length;

  const completionRate = completed / total;
  const unplayedRate = unplayed / total;
  const abandonedRate = abandoned / total;
  const startedVsFinished = completed / (started + completed || 1);

  let score = completionRate * 40 + (1 - unplayedRate) * 30 + (1 - abandonedRate) * 20 + Math.min(startedVsFinished, 1) * 10;
  score = Math.round(score);

  let rating: 'healthy' | 'growing' | 'overloaded' | 'critical';
  let message: string;
  let tip: string;
  if (score >= 70) {
    rating = 'healthy';
    message = 'Your backlog is in great shape!';
    tip = "Keep up the pace - you're clearing games faster than you add them.";
  } else if (score >= 45) {
    rating = 'growing';
    message = 'Your backlog is growing steadily.';
    tip = `Try finishing ${Math.ceil(unplayed * 0.3)} unplayed games to get ahead.`;
  } else if (score >= 25) {
    rating = 'overloaded';
    message = 'Your backlog needs attention.';
    tip = 'Focus on short games (under 10 hours) to reduce the pile.';
  } else {
    rating = 'critical';
    message = 'Your backlog is out of control!';
    tip = 'Pause new purchases and focus on finishing what you have.';
  }

  return {
    rating,
    score,
    completionRate,
    unplayedRate,
    abandonedRate,
    startedVsFinished: Math.round(startedVsFinished * 100),
    totalGames: total,
    completedGames: completed,
    unplayedGames: unplayed,
    abandonedGames: abandoned,
    message,
    tip,
  };
}

function getCloseToCompletion() {
  return state.games
    .filter((g) => g.status !== GameStatus.COMPLETED && (g.hoursPlayed || 0) > 0)
    .map((g) => {
      const target = (g.estimatedHours || 0) > 0 ? g.estimatedHours : 50;
      return {
        game: g,
        progress: Math.min(100, Math.round(((g.hoursPlayed || 0) / target) * 100)),
        estimatedRemaining: Math.max(0, target - (g.hoursPlayed || 0)),
      };
    })
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 6);
}

function getShortSessionGames() {
  const games = state.games.filter((g) => g.status !== GameStatus.COMPLETED);
  const categories = [
    {
      id: 'relaxing',
      title: 'Relaxing Games',
      description: 'Wind down with something chill',
      icon: 'coffee',
      games: games.filter((g) => ['Simulation', 'Puzzle', 'Adventure', 'Casual'].includes(g.genre || '')).slice(0, 6),
    },
    {
      id: 'quick',
      title: 'Quick Sessions',
      description: 'Games you can finish in a few sittings',
      icon: 'clock',
      games: games.filter((g) => (g.estimatedHours || 0) > 0 && g.estimatedHours <= 10).slice(0, 6),
    },
  ];
  return categories.filter((c) => c.games.length > 0);
}

function getWeeklyActivity() {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dailyHours: Record<string, { hours: number; games: number }> = {};
  for (const day of dayNames) dailyHours[day] = { hours: 0, games: 0 };

  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recent = state.sessions.filter((s) => new Date(s.date).getTime() > cutoff);
  const titles = new Set<string>();

  for (const session of recent) {
    const day = dayNames[new Date(session.date).getDay()];
    dailyHours[day].hours = Math.round((dailyHours[day].hours + session.hours) * 10) / 10;
    dailyHours[day].games += 1;
    titles.add(session.title);
  }

  // Fall back to lastPlayed for libraries created before session tracking.
  if (recent.length === 0) {
    for (const game of state.games) {
      if (!game.lastPlayed || new Date(game.lastPlayed).getTime() <= cutoff) continue;
      const day = dayNames[new Date(game.lastPlayed).getDay()];
      const hours = Math.min(game.hoursPlayed || 0, 2);
      dailyHours[day].hours = Math.round((dailyHours[day].hours + hours) * 10) / 10;
      dailyHours[day].games += 1;
      titles.add(game.title);
    }
  }

  const totalHours = Object.values(dailyHours).reduce((sum, d) => sum + d.hours, 0);
  return {
    totalHours: Math.round(totalHours * 10) / 10,
    gamesPlayed: titles.size,
    completionPercentage: state.games.length > 0 ? Math.round((titles.size / state.games.length) * 100) : 0,
    weeklyChange: 0,
    dailyHours,
    gameTitles: [...titles].slice(0, 10),
  };
}

const api = {
  getDashboardStats: async () => getDashboardStats(),
  getGames: async (params?: any) => getGames(params),
  getGameById: async (id: string) => findGame(id) || null,

  createGame: async (data: any) => {
    const title = String(data.title || '').trim();
    if (!title) throw new Error('A title is required');

    const baseSlug = slugify(title);
    let slug = baseSlug;
    let counter = 2;
    while (state.games.some((g) => g.slug === slug)) {
      slug = `${baseSlug}-${counter++}`;
    }

    const timestamp = nowIso();
    const game = {
      id: newId(),
      title,
      slug,
      coverArt: data.coverArt || null,
      banner: data.banner || null,
      platform: data.platform || null,
      genre: data.genre || null,
      developer: data.developer || null,
      publisher: data.publisher || null,
      releaseDate: data.releaseDate || null,
      steamAppId: data.steamAppId || null,
      steamData: null,
      status: data.status || GameStatus.BACKLOG,
      userRating: data.userRating ?? null,
      notes: data.notes || null,
      tags: data.tags || null,
      isFavourite: !!data.isFavourite,
      hoursPlayed: Number(data.hoursPlayed) || 0,
      estimatedHours: Number(data.estimatedHours) || null,
      completionDate: data.status === GameStatus.COMPLETED ? timestamp : null,
      createdAt: timestamp,
      updatedAt: timestamp,
      achievementsData: null,
      lastPlayed: data.lastPlayed || null,
      profileId: state.profileId,
      totalAchievements: 0,
      unlockedAchievements: 0,
      completionPercentage: 0,
    };

    state.games.push(game);
    createActivity('added_to_backlog', { gameId: game.id, gameTitle: game.title });
    save();
    return game;
  },

  updateGame: async (id: string, data: any) => {
    const game = findGame(id);
    if (!game) throw new Error('Game not found');

    const previousStatus = game.status;
    const previousHours = Number(game.hoursPlayed) || 0;
    const next = { ...data };

    if (next.status === GameStatus.COMPLETED && !next.completionDate && !game.completionDate) {
      next.completionDate = nowIso();
    }

    if (next.status && next.status !== previousStatus) {
      let newStatus = next.status;
      if (previousHours === 0 && next.status !== GameStatus.BACKLOG && next.status !== GameStatus.WISHLIST) {
        next.status = GameStatus.STARTED;
        newStatus = GameStatus.STARTED;
      }

      if (newStatus === GameStatus.COMPLETED && previousStatus !== GameStatus.COMPLETED) {
        createActivity('game_completed', { gameId: game.id, gameTitle: game.title });
      } else if (newStatus === GameStatus.PLAYING && previousStatus !== GameStatus.PLAYING) {
        createActivity('game_started', { gameId: game.id, gameTitle: game.title });
      } else if (newStatus === GameStatus.DROPPED && previousStatus !== GameStatus.DROPPED) {
        createActivity('game_stopped', { gameId: game.id, gameTitle: game.title, metadata: { hours: Math.round(previousHours) } });
      }
    }

    if (next.isFavourite !== undefined && next.isFavourite !== game.isFavourite) {
      createActivity(next.isFavourite ? 'game_favourited' : 'game_unfavourited', {
        gameId: game.id,
        gameTitle: game.title,
      });
    }

    const nextHours = next.hoursPlayed !== undefined ? Number(next.hoursPlayed) : previousHours;
    const hoursDelta = nextHours - previousHours;
    if (Number.isFinite(hoursDelta) && hoursDelta > 0.0001) {
      state.sessions.push({
        date: next.lastPlayed || nowIso(),
        hours: hoursDelta,
        title: game.title,
      });
      // Keep the history bounded.
      if (state.sessions.length > 1000) state.sessions = state.sessions.slice(-1000);
    }

    Object.assign(game, next, { updatedAt: nowIso() });
    save();
    return game;
  },

  deleteGame: async (id: string) => {
    const index = state.games.findIndex((g) => g.id === id);
    if (index === -1) return { success: false };
    const [game] = state.games.splice(index, 1);
    createActivity('removed_from_backlog', { gameId: game.id, gameTitle: game.title });
    state.sessions = state.sessions.filter((s) => s.title !== game.title);
    save();
    return { success: true };
  },

  searchGames: async (query: string) => {
    const q = String(query || '').toLowerCase().trim();
    if (!q) return [];
    return state.games
      .filter((g) =>
        [g.title, g.developer, g.publisher, g.genre]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(q))
      )
      .sort((a, b) => (b.hoursPlayed || 0) - (a.hoursPlayed || 0))
      .slice(0, 20);
  },

  // Steam is a desktop-only integration. Mobile keeps the app fully offline.
  steamAuthUrl: async () => '',
  steamLogin: async () => ({ success: false, message: 'Steam sync is not available in the mobile app', imported: 0, updated: 0, errors: 0 }),
  steamSync: async () => ({ success: false, message: 'Steam sync is not available in the mobile app', imported: 0, updated: 0, errors: 0 }),
  steamStatus: async () => ({ isConnected: false, username: null, avatar: null, lastSync: null }),
  steamSetId: async () => ({ success: false, message: 'Steam sync is not available in the mobile app' }),
  steamDisconnect: async () => ({ success: false }),
  launchSteamGame: async () => ({ success: false }),

  getBacklogInsights: async () => getBacklogInsights(),
  getRecommendations: async (type?: string) => getRecommendations(type),

  getSettings: async () => ({ ...state.settings }),
  updateSettings: async (settings: any) => {
    state.settings = { ...state.settings, ...settings };
    save();
    return { ...state.settings };
  },

  getProfiles: async () => [{ id: state.profileId, name: state.settings.profileName || 'Player', steamUsername: null }],
  switchProfile: async (id: string) => ({ id }),

  exportData: async () => JSON.stringify(state.games, null, 2),
  importData: async (data: string) => {
    const parsed = JSON.parse(data);
    const games = Array.isArray(parsed) ? parsed : parsed?.games;
    if (!Array.isArray(games)) throw new Error('Invalid backup file');

    let imported = 0;
    for (const raw of games) {
      if (!raw || !raw.title) continue;
      const slug = raw.slug || slugify(raw.title);
      const existing = state.games.find((g) => g.slug === slug);
      const timestamp = nowIso();
      const record = {
        id: existing?.id || newId(),
        title: String(raw.title),
        slug,
        coverArt: raw.coverArt || null,
        banner: raw.banner || null,
        platform: raw.platform || null,
        genre: raw.genre || null,
        developer: raw.developer || null,
        publisher: raw.publisher || null,
        releaseDate: raw.releaseDate || null,
        steamAppId: raw.steamAppId || null,
        steamData: raw.steamData || null,
        status: raw.status || GameStatus.BACKLOG,
        userRating: raw.userRating ?? null,
        notes: raw.notes || null,
        tags: raw.tags || null,
        isFavourite: !!raw.isFavourite,
        hoursPlayed: Number(raw.hoursPlayed) || 0,
        estimatedHours: Number(raw.estimatedHours) || null,
        completionDate: raw.completionDate || null,
        createdAt: raw.createdAt || existing?.createdAt || timestamp,
        updatedAt: timestamp,
        achievementsData: raw.achievementsData || null,
        lastPlayed: raw.lastPlayed || null,
        profileId: state.profileId,
        totalAchievements: raw.totalAchievements || 0,
        unlockedAchievements: raw.unlockedAchievements || 0,
        completionPercentage: raw.completionPercentage || 0,
      };

      if (existing) Object.assign(existing, record);
      else state.games.push(record);
      imported++;
    }

    save();
    return { success: true, imported };
  },

  getActivities: async (params?: { limit?: number; offset?: number }) => {
    const total = state.activities.length;
    const offset = params?.offset || 0;
    const limit = params?.limit || 50;
    return { activities: state.activities.slice(offset, offset + limit), total };
  },
  createActivity: async (type: string, payload: any) => {
    const activity = createActivity(type, payload || {});
    save();
    return activity;
  },

  getBacklogHealth: async () => getBacklogHealth(),
  getCloseToCompletion: async () => getCloseToCompletion(),
  getShortSessionGames: async () => getShortSessionGames(),
  getWeeklyActivity: async () => getWeeklyActivity(),

  getGameAchievements: async (gameId: string) => {
    const game = findGame(gameId);
    if (!game) return null;
    return {
      totalAchievements: game.totalAchievements || 0,
      unlockedAchievements: game.unlockedAchievements || 0,
      completionPercentage: game.completionPercentage || 0,
      achievements: [],
    };
  },
  getAllAchievements: async () => [],
  syncSteamAchievements: async () => ({
    success: false,
    message: 'Steam achievements are not available in the mobile app',
    synced: 0,
    total: 0,
    failed: 0,
    imported: 0,
    skipped: 0,
    achievements: [],
  }),
  getAchievementStats: async () => ({ total: 0, unlocked: 0, locked: 0, games: 0 }),

  refreshGameMetadata: async () => ({ success: false, message: 'Steam metadata is not available in the mobile app' }),
  refreshAllMetadata: async () => ({ success: false, message: 'Steam metadata is not available in the mobile app' }),
  getGenreGradient: async () => 'from-indigo-600 to-indigo-400',

  factoryReset: async () => {
    state = defaultState();
    save();
    return { success: true };
  },

  minimizeToTray: async () => {},
  getPlatform: async () => 'android',

  onActivityUpdate: (callback: (activity: any) => void) => on('activity-update', callback),
  onNavigate: (_callback: (path: string) => void) => () => {},
  onQuickLookup: (_callback: () => void) => {},
  onRandomGame: (_callback: () => void) => {},
  onUpdateProgress: (_callback: (percent: number) => void) => {},
  onSyncProgress: (_callback: (data: { current: number; total: number; message: string }) => void) => () => {},
  removeAllListeners: (channel: string) => {
    listeners.delete(channel);
  },
};

export function installMobileApi(): boolean {
  if (typeof window === 'undefined') return false;
  if ((window as any).backly) return false;

  (window as any).__backlyMobile = true;
  (window as any).backly = api;
  console.log('[Backly Mobile] Offline local API installed');
  return true;
}

export default api;
