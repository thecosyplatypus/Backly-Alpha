import { getDatabase } from './database';
import { GameStatus, ActivityType } from '../shared/types';

import { createActivity } from './activity-service';
import { getSteamApiKey, fetchSteamAchievements, fetchSteamGlobalAchievementPercentages, fetchSteamAchievementSchema } from './steam-auth';
import { settingsStore } from './settings';

export async function getGames(params?: {
  status?: GameStatus | 'no-achievements' | 'playing-or-recent' | 'demos';
  genre?: string;
  platform?: string;
  search?: string;
  sort?: string;
  tags?: string;
  isFavourite?: boolean;
  limit?: number;
  offset?: number;
}) {
  const db = getDatabase();
  const profile = await db.profile.findFirst();
  if (!profile) return { games: [], total: 0 };

  const where: any = { profileId: profile.id };
  const andConditions: any[] = [];

  if (params?.status === 'no-achievements') {
    andConditions.push({
      OR: [
        { totalAchievements: null },
        { totalAchievements: 0 },
      ],
    });
  } else if (params?.status === 'demos') {
    andConditions.push({
      OR: [
        { title: { endsWith: ' Demo' } },
        { title: { endsWith: ' Playtest' } },
        { title: { endsWith: ' Prologue' } },
        { title: 'Demo' },
        { title: 'Playtest' },
        { title: 'Prologue' },
      ],
    });
  } else if (params?.status === 'playing-or-recent') {
    const allProfileGames = await db.game.findMany({
      where: { profileId: profile.id },
      select: { id: true, status: true, steamData: true, lastPlayed: true },
    });
    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const matchedIds = new Set<string>();
    for (const g of allProfileGames) {
      if (g.steamData) {
        try {
          const sd = JSON.parse(g.steamData);
          if ((sd.playtime_2weeks || 0) > 0) {
            matchedIds.add(g.id);
            continue;
          }
        } catch {}
      }
      if (g.lastPlayed && new Date(g.lastPlayed).getTime() > twoWeeksAgo) {
        matchedIds.add(g.id);
      }
    }
    if (matchedIds.size > 0) {
      where.id = { in: Array.from(matchedIds) };
    } else {
      where.id = { in: [] };
    }
  } else if (params?.status === GameStatus.BACKLOG) {
    where.status = GameStatus.BACKLOG;
    andConditions.push({ totalAchievements: { gt: 0 } });
  } else if (params?.status) {
    where.status = params.status;
  }
  if (params?.genre) where.genre = params.genre;
  if (params?.platform) where.platform = params.platform;
  if (params?.isFavourite) where.isFavourite = true;
  if (params?.tags) where.tags = { contains: params.tags };
  if (params?.search) {
    andConditions.push({
      OR: [
        { title: { contains: params.search } },
        { developer: { contains: params.search } },
        { publisher: { contains: params.search } },
      ],
    });
  }
  if (andConditions.length > 0) {
    where.AND = andConditions;
  }


  let orderBy: any;
  switch (params?.sort) {
    case 'title': orderBy = { title: 'asc' }; break;
    case 'recent': orderBy = { updatedAt: 'desc' }; break;
    case 'created': orderBy = { createdAt: 'desc' }; break;
    case 'rating': orderBy = { userRating: 'desc' }; break;
    case 'hours': orderBy = { hoursPlayed: 'desc' }; break;
    case 'hours_asc': orderBy = { hoursPlayed: 'asc' }; break;
    case 'lastPlayed': orderBy = [{ lastPlayed: 'desc' }, { updatedAt: 'desc' }]; break;
    default: orderBy = { updatedAt: 'desc' };
  }

  const [games, total] = await Promise.all([
    db.game.findMany({
      where,
      orderBy,
      take: params?.limit || 100,
      skip: params?.offset || 0,
      select: { id: true, title: true, slug: true, status: true, genre: true,
        platform: true, hoursPlayed: true, estimatedHours: true, userRating: true, isFavourite: true,
        coverArt: true, banner: true, steamAppId: true, steamData: true,
        totalAchievements: true, unlockedAchievements: true, completionPercentage: true,
        developer: true, publisher: true, completionDate: true,
        tags: true, lastPlayed: true, notes: true, createdAt: true, updatedAt: true },
    }),
    db.game.count({ where }),
  ]);

  return { games, total };
}

export async function getGameById(id: string) {
  const db = getDatabase();
  return db.game.findUnique({ where: { id } });
}

export async function createGame(data: any) {
  const db = getDatabase();
  const profile = await db.profile.findFirst();
  if (!profile) throw new Error('No profile found');

  const slug = data.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const game = await db.game.create({
    data: {
      ...data,
      slug,
      profileId: profile.id,
    },
  });

  await createActivity('added_to_backlog', {
    gameId: game.id,
    gameTitle: game.title,
  });

  return game;
}

export async function updateGame(id: string, data: any) {
  const db = getDatabase();
  const game = await db.game.findUnique({ where: { id } });
  if (!game) throw new Error('Game not found');

  if (data.status === GameStatus.COMPLETED && !data.completionDate) {
    data.completionDate = new Date().toISOString();
  }

  if (data.status && data.status !== game.status) {
    const prevStatus = game.status;
    let newStatus = data.status;
    if (game.hoursPlayed === 0 && data.status !== GameStatus.BACKLOG && data.status !== GameStatus.WISHLIST) {
      data.status = GameStatus.STARTED;
      newStatus = GameStatus.STARTED;
    }

    if (newStatus === GameStatus.COMPLETED && prevStatus !== GameStatus.COMPLETED) {
      await createActivity('game_completed', {
        gameId: game.id,
        gameTitle: game.title,
      });
    } else if (newStatus === GameStatus.PLAYING && prevStatus !== GameStatus.PLAYING) {
      await createActivity('game_started', {
        gameId: game.id,
        gameTitle: game.title,
      });
    } else if (newStatus === GameStatus.DROPPED && prevStatus !== GameStatus.DROPPED) {
      await createActivity('game_stopped', {
        gameId: game.id,
        gameTitle: game.title,
        metadata: { hours: Math.round(game.hoursPlayed) },
      });
    }
  }

  if (data.isFavourite !== undefined && data.isFavourite !== game.isFavourite) {
    if (data.isFavourite) {
      await createActivity('game_favourited', {
        gameId: game.id,
        gameTitle: game.title,
      });
    } else {
      await createActivity('game_unfavourited', {
        gameId: game.id,
        gameTitle: game.title,
      });
    }
  }

  return db.game.update({
    where: { id },
    data,
  });
}

export async function deleteGame(id: string) {
  const db = getDatabase();
  const game = await db.game.findUnique({ where: { id } });
  if (game) {
    await createActivity('removed_from_backlog', {
      gameId: game.id,
      gameTitle: game.title,
    });
  }
  return db.game.delete({ where: { id } });
}

export async function searchGames(query: string) {
  const db = getDatabase();
  const profile = await db.profile.findFirst();
  if (!profile) return [];

  return db.game.findMany({
    where: {
      profileId: profile.id,
      title: { contains: query },
    },
    take: 20,
    orderBy: { hoursPlayed: 'desc' },
  });
}

export async function getDashboardStats() {
  const db = getDatabase();
  const profile = await db.profile.findFirst();
  if (!profile) {
    return {
      totalGames: 0, completedGames: 0, backlogCount: 0, wishlistCount: 0,
      completionPercent: 0, totalHoursPlayed: 0, completedThisYear: 0,
      mostPlayedGenre: 'N/A', avgCompletionTime: 0, isSteamSynced: !!false,
      totalBacklogEstimate: 0, currentlyPlaying: 0, startedCount: 0,
      droppedCount: 0, pausedCount: 0, favouriteCount: 0,
    };
  }

  const allGames = await db.game.findMany({
    where: { profileId: profile.id },
    select: { status: true, genre: true, hoursPlayed: true, estimatedHours: true, completionDate: true, isFavourite: true, unlockedAchievements: true },
  });

  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const completedGames = allGames.filter(g => g.status === GameStatus.COMPLETED);
  const backlogGames = allGames.filter(g => g.status === GameStatus.BACKLOG);
  const wishlistGames = allGames.filter(g => g.status === GameStatus.WISHLIST);

  const genreCounts: Record<string, number> = {};
  const genreHours: Record<string, number> = {};
  for (const g of allGames) {
    if (g.genre) {
      genreCounts[g.genre] = (genreCounts[g.genre] || 0) + 1;
      genreHours[g.genre] = (genreHours[g.genre] || 0) + (g.hoursPlayed || 0);
    }
  }
  const mostPlayedGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  const genreBreakdown = Object.entries(genreHours)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([genre, hours]) => ({ genre, hours: Math.round(hours) }));

  const totalBacklogEstimate = Math.round(backlogGames.reduce((sum, g) => sum + (g.estimatedHours && g.estimatedHours > 0 ? g.estimatedHours : 15), 0));
  const avgCompletionTime = completedGames.length > 0
    ? Math.round(completedGames.reduce((sum, g) => sum + (g.hoursPlayed || 0), 0) / completedGames.length)
    : 0;

  const totalUnlockedAchievements = allGames.reduce((sum, g: any) => sum + (g.unlockedAchievements || 0), 0);
  return {
    totalGames: allGames.length,
    completedGames: completedGames.length,
    backlogCount: backlogGames.length,
    wishlistCount: wishlistGames.length,
    completionPercent: allGames.length > 0 ? Math.round((completedGames.length / allGames.length) * 100) : 0,
    totalHoursPlayed: Math.round(allGames.reduce((sum, g) => sum + (g.hoursPlayed || 0), 0)),
    completedThisYear: completedGames.filter(g => {
      if (!g.completionDate) return false;
      const d = new Date(g.completionDate);
      return d >= yearStart;
    }).length,
    mostPlayedGenre,
    genreBreakdown,
    avgCompletionTime,
    isSteamSynced: !!profile.steamId,
    totalBacklogEstimate: totalBacklogEstimate,
    currentlyPlaying: allGames.filter(g => g.status === GameStatus.PLAYING).length,
    startedCount: allGames.filter(g => g.status === GameStatus.STARTED).length,
    droppedCount: allGames.filter(g => g.status === GameStatus.DROPPED).length,
    pausedCount: allGames.filter(g => g.status === GameStatus.PAUSED).length,
    favouriteCount: allGames.filter(g => g.isFavourite).length,
    unlockedAchievements: totalUnlockedAchievements,
  };
}

export async function getBacklogInsights() {
  const db = getDatabase();
  const profile = await db.profile.findFirst();
  if (!profile) return [];

  const games = await db.game.findMany({
    where: { profileId: profile.id },
    select: { id: true, title: true, status: true, hoursPlayed: true, lastPlayed: true, createdAt: true,
      genre: true, platform: true, userRating: true, isFavourite: true, slug: true,
      steamData: true, totalAchievements: true, unlockedAchievements: true,
      completionPercentage: true, developer: true, publisher: true,
      completionDate: true, tags: true, updatedAt: true },
  });

  const insights: any[] = [];
  const now = new Date();

  const abandoned = games.filter(g =>
    g.status === GameStatus.STARTED && g.hoursPlayed > 0 &&
    g.lastPlayed && (now.getTime() - new Date(g.lastPlayed).getTime()) > 180 * 24 * 60 * 60 * 1000
  );
  if (abandoned.length > 0) {
    insights.push({ type: 'abandoned', title: 'Games You Abandoned', description: 'You haven\'t touched these in over 6 months', games: abandoned });
  }

  const untouched = games.filter(g =>
    g.status === GameStatus.BACKLOG && g.hoursPlayed === 0 &&
    g.createdAt && (now.getTime() - new Date(g.createdAt).getTime()) > 365 * 24 * 60 * 60 * 1000
  );
  if (untouched.length > 0) {
    insights.push({ type: 'untouched', title: 'Games Untouched for Over a Year', description: 'Time to revisit these?', games: untouched });
  }

  return insights;
}

export async function getRecommendations(type?: string) {
  const db = getDatabase();
  const profile = await db.profile.findFirst();
  if (!profile) return [];

  const games = await db.game.findMany({
    where: { profileId: profile.id, NOT: { status: GameStatus.COMPLETED } },
    select: { id: true, title: true, status: true, hoursPlayed: true, estimatedHours: true, userRating: true,
      genre: true, platform: true, isFavourite: true, slug: true,
      steamData: true, totalAchievements: true, unlockedAchievements: true,
      completionPercentage: true, developer: true, publisher: true,
      completionDate: true, tags: true, lastPlayed: true, createdAt: true, updatedAt: true },
  });

  const recommendations: any[] = [];

  switch (type) {
    case 'best': {
      const best = games.filter(g => g.userRating && g.userRating >= 7);
      best.forEach(g => recommendations.push({ game: g, reason: 'Highly rated — must play!', priority: g.userRating || 0 }));
      break;
    }
    case 'random': {
      if (games.length > 0) {
        const random = games[Math.floor(Math.random() * games.length)];
        recommendations.push({ game: random, reason: 'Random pick — give it a try!', priority: 50 });
      }
      break;
    }
    default: {
      // Almost done — high completion, not finished
      const almostDone = games
        .filter(g => (g.completionPercentage || 0) >= 70 && (g.completionPercentage || 0) < 100 && (g.hoursPlayed || 0) > 0)
        .sort((a, b) => (b.completionPercentage || 0) - (a.completionPercentage || 0))
        .slice(0, 4);
      almostDone.forEach(g => recommendations.push({ game: g, reason: `Almost done — ${Math.round(g.completionPercentage || 0)}% complete`, priority: 90 + (g.completionPercentage || 0) }));

      // Hidden gems — highly rated but barely played
      const hiddenGems = games
        .filter(g => (g.userRating || 0) >= 8 && (g.hoursPlayed || 0) < 5)
        .sort((a, b) => (b.userRating || 0) - (a.userRating || 0))
        .slice(0, 4);
      hiddenGems.forEach(g => {
        if (!recommendations.find(r => r.game.id === g.id)) {
          recommendations.push({ game: g, reason: `Hidden gem — rated ${g.userRating}/10, barely touched`, priority: 80 + (g.userRating || 0) });
        }
      });

      // Quick wins — short backlog games
      const quickWins = games
        .filter(g => (g.hoursPlayed || 0) === 0 && g.status === GameStatus.BACKLOG)
        .sort((a, b) => ((a.estimatedHours || 15) - (b.estimatedHours || 15)))
        .slice(0, 4);
      quickWins.forEach(g => {
        if (!recommendations.find(r => r.game.id === g.id)) {
          const est = g.estimatedHours && g.estimatedHours > 0 ? Math.round(g.estimatedHours) : 15;
          recommendations.push({ game: g, reason: `Quick win — ~${est}h to beat`, priority: 70 - est });
        }
      });

      // Highly rated — must play
      const best = games.filter(g => (g.userRating || 0) >= 7);
      best.forEach(g => {
        if (!recommendations.find(r => r.game.id === g.id)) {
          recommendations.push({ game: g, reason: 'Highly rated — must play!', priority: (g.userRating || 0) * 5 });
        }
      });

      // Fallback — random picks if nothing else
      if (recommendations.length === 0 && games.length > 0) {
        const shuffled = [...games].sort(() => Math.random() - 0.5).slice(0, 5);
        shuffled.forEach(g => recommendations.push({ game: g, reason: 'Give it a try!', priority: 10 }));
      }
      break;
    }
  }

  return recommendations.sort((a, b) => b.priority - a.priority).slice(0, 10);
}

export async function getBacklogHealth() {
  const db = getDatabase();
  const profile = await db.profile.findFirst();
  if (!profile) return null;

  const allGames = await db.game.findMany({
    where: { profileId: profile.id },
    select: { status: true, hoursPlayed: true, estimatedHours: true },
  });
  const total = allGames.length;
  if (total === 0) {
    return {
      rating: 'healthy' as const,
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

  const completed = allGames.filter(g => g.status === GameStatus.COMPLETED).length;
  const unplayed = allGames.filter(g => g.hoursPlayed === 0).length;
  const abandoned = allGames.filter(g => g.status === GameStatus.DROPPED).length;
  const started = allGames.filter(g => g.hoursPlayed > 0 && g.status !== GameStatus.COMPLETED).length;

  const completionRate = completed / total;
  const unplayedRate = unplayed / total;
  const abandonedRate = abandoned / total;
  const startedVsFinished = completed / (started + completed || 1);

  // Score 0-100 based on multiple factors
  let score = 0;
  score += completionRate * 40;
  score += (1 - unplayedRate) * 30;
  score += (1 - abandonedRate) * 20;
  score += Math.min(startedVsFinished, 1) * 10;
  score = Math.round(score);

  let rating: 'healthy' | 'growing' | 'overloaded' | 'critical';
  let message: string;
  let tip: string;

  if (score >= 70) {
    rating = 'healthy';
    message = 'Your backlog is in great shape!';
    tip = 'Keep up the pace — you\'re clearing games faster than you add them.';
  } else if (score >= 45) {
    rating = 'growing';
    message = 'Your backlog is growing steadily.';
    tip = `Try finishing ${Math.ceil(unplayed * 0.3)} unplayed games to get ahead.`;
  } else if (score >= 25) {
    rating = 'overloaded';
    message = 'Your backlog needs attention.';
    tip = `Focus on short games (under 10 hours) to reduce the pile.`;
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

export async function getCloseToCompletion() {
  const db = getDatabase();
  const profile = await db.profile.findFirst();
  if (!profile) return [];

  const games = await db.game.findMany({
    where: {
      profileId: profile.id,
      NOT: { status: GameStatus.COMPLETED },
      hoursPlayed: { gt: 0 },
    },
    select: { id: true, title: true, status: true, hoursPlayed: true, estimatedHours: true,
      genre: true, platform: true, isFavourite: true, slug: true,
      steamData: true, totalAchievements: true, unlockedAchievements: true,
      completionPercentage: true, developer: true, publisher: true,
      completionDate: true, tags: true, lastPlayed: true, createdAt: true, updatedAt: true },
  });

  return games
    .map(g => ({
      game: g,
      progress: Math.min(100, Math.round((g.hoursPlayed / (g.estimatedHours && g.estimatedHours > 0 ? g.estimatedHours : 50)) * 100)),
      estimatedRemaining: Math.max(0, (g.estimatedHours && g.estimatedHours > 0 ? g.estimatedHours : 50) - g.hoursPlayed),
    }))
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 6);
}

export async function getShortSessionGames() {
  const db = getDatabase();
  const profile = await db.profile.findFirst();
  if (!profile) return [];

  const games = await db.game.findMany({
    where: {
      profileId: profile.id,
      NOT: { status: GameStatus.COMPLETED },
    },
    select: { id: true, title: true, status: true, genre: true, hoursPlayed: true,
      platform: true, isFavourite: true, slug: true,
      steamData: true, totalAchievements: true, unlockedAchievements: true,
      completionPercentage: true, developer: true, publisher: true,
      completionDate: true, tags: true, lastPlayed: true, createdAt: true, updatedAt: true },
  });

  const categories = [
    {
      id: 'relaxing',
      title: 'Relaxing Games',
      description: 'Wind down with something chill',
      icon: 'coffee',
      games: games.filter(g => {
        const relaxed = ['Simulation', 'Puzzle', 'Adventure', 'Casual'];
        return relaxed.includes(g.genre || '');
      }).slice(0, 6),
    },
  ];

  return categories.filter(c => c.games.length > 0);
}

export async function getGameAchievements(gameId: string) {
  const db = getDatabase();
  const game = await db.game.findUnique({
    where: { id: gameId },
    include: { achievements: { orderBy: { unlockedAt: 'desc' } } },
  });
  if (!game) return null;

  const achievements = (game.achievements || []).map(a => ({
    id: a.id,
    name: a.name,
    apiName: a.apiName || '',
    description: a.description || '',
    iconUrl: a.iconUrl || null,
    unlocked: a.unlocked,
    unlockedAt: a.unlockedAt ? a.unlockedAt.toISOString() : null,
    globalProgress: a.globalProgress ?? null,
  }));

  const total = achievements.length;
  const unlocked = achievements.filter(a => a.unlocked).length;
  const pct = total > 0 ? Math.round((unlocked / total) * 100) : 0;

  return {
    totalAchievements: game.totalAchievements || total,
    unlockedAchievements: game.unlockedAchievements || unlocked,
    completionPercentage: game.completionPercentage || pct,
    achievements,
  };
}

export async function getAllAchievements() {
  const db = getDatabase();
  const profile = await db.profile.findFirst();
  if (!profile) return [];

  const games = await db.game.findMany({
    where: { profileId: profile.id, steamAppId: { not: null } },
    select: { id: true, title: true, steamAppId: true },
  });

  if (games.length === 0) return [];

  const gameIds = games.map(g => g.id);
  const gameTitles = new Map(games.map(g => [g.id, g.title]));

  const allAchievements = await db.achievement.findMany({
    where: { gameId: { in: gameIds } },
  });

  const result = allAchievements.map(a => ({
    id: a.id,
    name: a.name,
    description: a.description || '',
    iconUrl: a.iconUrl,
    unlocked: a.unlocked,
    unlockedAt: a.unlockedAt,
    gameId: a.gameId,
    gameTitle: gameTitles.get(a.gameId) || 'Unknown',
  }));

  return result.sort((a, b) => {
    if (a.unlocked && !b.unlocked) return -1;
    if (!a.unlocked && b.unlocked) return 1;
    return 0;
  });
}

export async function syncSteamAchievements(
  onProgress?: (current: number, total: number, message: string) => void
) {
  const db = getDatabase();
  const profile = await db.profile.findFirst();
  if (!profile || !profile.steamId) {
    return { success: false, message: 'No Steam account linked', synced: 0, total: 0 };
  }

  const apiKey = getSteamApiKey();
  if (!apiKey) {
    return { success: false, message: 'Steam API key not configured. Set it in Settings > Steam Integration.', synced: 0, total: 0 };
  }

  const games = await db.game.findMany({
    where: { profileId: profile.id, steamAppId: { not: null } },
    select: { id: true, title: true, steamAppId: true },
  });

  if (games.length === 0) {
    return { success: true, message: 'No Steam games found to sync achievements for', synced: 0, total: 0 };
  }

  let synced = 0;
  let skipped = 0;
  let failed = 0;

  const results = await Promise.allSettled(
    games.map(async (game, index) => {
      try {
        onProgress?.(index + 1, games.length, `${game.title}`);

        const [achievements, globalPcts, schema] = await Promise.all([
          fetchSteamAchievements(profile.steamId!, game.steamAppId!),
          fetchSteamGlobalAchievementPercentages(game.steamAppId!),
          fetchSteamAchievementSchema(game.steamAppId!),
        ]);

        if (!achievements || achievements.length === 0) {
          onProgress?.(index + 1, games.length, `${game.title} — no achievements`);
          await db.game.update({ where: { id: game.id }, data: { status: GameStatus.NO_ACHIEVEMENTS } });
          skipped++;
          return;
        }

        const steamData: any[] = [];
        for (const ach of achievements) {
          if (!ach.name && !ach.apiName) continue;

          const displayName = ach.name || ach.apiName || 'Unknown';
          const apiName = ach.apiName || ach.name || displayName;
          const globalPct = globalPcts[apiName] ?? globalPcts[ach.name] ?? null;
          const iconData = schema[apiName] || schema[displayName] || null;

          await db.achievement.upsert({
            where: { gameId_name: { gameId: game.id, name: displayName } },
            update: {
              apiName: apiName,
              unlocked: ach.achieved,
              unlockedAt: ach.unlockTime ? new Date(ach.unlockTime) : null,
              description: ach.description || '',
              globalProgress: globalPct,
              iconUrl: iconData?.icon || iconData?.icongray || null,
              iconGrayUrl: iconData?.icongray || '',
            },
            create: {
              gameId: game.id,
              name: displayName,
              apiName: apiName,
              description: ach.description || '',
              unlocked: ach.achieved,
              unlockedAt: ach.unlockTime ? new Date(ach.unlockTime) : null,
              globalProgress: globalPct,
              iconUrl: iconData?.icon || iconData?.icongray || null,
              iconGrayUrl: iconData?.icongray || '',
            },
          });

          steamData.push({ ...ach, globalProgress: globalPct });
        }

        const unlockedCount = achievements.filter((a: any) => a.achieved).length;
        const totalCount = achievements.length;
        const completionPct = Math.round((unlockedCount / totalCount) * 100);

        const updateData: any = {
          achievementsData: JSON.stringify(steamData),
          totalAchievements: totalCount,
          unlockedAchievements: unlockedCount,
          completionPercentage: completionPct,
        };

        if (completionPct >= 100) {
          updateData.status = GameStatus.COMPLETED;
          updateData.completionDate = new Date().toISOString();
        } else if (completionPct >= 90) {
          updateData.status = GameStatus.ALMOST_COMPLETED;
        } else if (completionPct >= 50) {
          updateData.status = GameStatus.PLAYING;
        } else if (completionPct > 0) {
          updateData.status = GameStatus.STARTED;
        } else {
          updateData.status = GameStatus.BACKLOG;
        }

        await db.game.update({
          where: { id: game.id },
          data: updateData,
        });

        synced++;
      } catch (err) {
        console.error(`[ACH] Failed to sync achievements for ${game.title}:`, err);
        throw err;
      }
    })
  );

  const rejected = results.filter(r => r.status === 'rejected');
  failed = rejected.length;

  console.log(`[ACH] Sync complete: ${synced} synced, ${skipped} skipped, ${failed} failed`);

  return {
    success: failed === 0,
    message: `Synced achievements for ${synced}/${games.length} games${skipped > 0 ? ` (${skipped} without achievements)` : ''}${failed > 0 ? ` (${failed} failed)` : ''}`,
    synced,
    total: games.length,
    failed,
  };
}

export async function getWeeklyActivity() {
  try {
  const db = getDatabase();
  const profile = await db.profile.findFirst();
  if (!profile) {
    return {
      totalHours: 0, gamesPlayed: 0, completionPercentage: 0,
      weeklyChange: 0, dailyHours: {}, gameTitles: [],
    };
  }

  const games = await db.game.findMany({
    where: { profileId: profile.id },
    select: { steamData: true, hoursPlayed: true, title: true, lastPlayed: true },
  });

  const now = Date.now();
  const sevenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000);

  let weeklyHours = 0;
  const recentlyPlayedTitles: string[] = [];

  for (const game of games) {
    let playedRecently = false;

    if (game.steamData) {
      try {
        const steamData = JSON.parse(game.steamData);
        const pt2w = steamData.playtime_2weeks || 0;
        if (pt2w > 0) {
          weeklyHours += pt2w / 60;
          playedRecently = true;
        }
      } catch {}
    }

    if (!playedRecently && game.lastPlayed && new Date(game.lastPlayed).getTime() > sevenDaysAgo.getTime()) {
      playedRecently = true;
      weeklyHours += Math.min(game.hoursPlayed || 0, 2);
    }

    if (playedRecently) {
      recentlyPlayedTitles.push(game.title);
    }
  }
  const gamesPlayed = recentlyPlayedTitles.length;

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dailyHours: Record<string, { hours: number; games: number }> = {};
  for (const day of dayNames) dailyHours[day] = { hours: 0, games: 0 };

  for (const game of games) {
    let playedRecently = false;
    let hours = 0;

    if (game.steamData) {
      try {
        const steamData = JSON.parse(game.steamData);
        const pt2w = steamData.playtime_2weeks || 0;
        if (pt2w > 0) {
          playedRecently = true;
          hours = pt2w / 60;
        }
      } catch {}
    }

    if (!playedRecently && game.lastPlayed && new Date(game.lastPlayed).getTime() > sevenDaysAgo.getTime()) {
      playedRecently = true;
      hours = Math.min(game.hoursPlayed || 0, 2);
    }

    if (playedRecently) {
      let dayIndex = new Date().getDay();
      if (game.lastPlayed) {
        const lp = new Date(game.lastPlayed);
        if (lp.getTime() > sevenDaysAgo.getTime()) {
          dayIndex = lp.getDay();
        }
      }
      const day = dayNames[dayIndex];
      dailyHours[day].hours = Math.round((dailyHours[day].hours + hours) * 10) / 10;
      dailyHours[day].games += 1;
    }
  }

  const completionPercentage = games.length > 0
    ? Math.round((gamesPlayed / games.length) * 100)
    : 0;

  return {
    totalHours: Math.round(weeklyHours * 10) / 10,
    gamesPlayed,
    completionPercentage,
    weeklyChange: 0,
    dailyHours,
    gameTitles: recentlyPlayedTitles.slice(0, 10),
  };
  } catch (err: any) {
    console.error('[getWeeklyActivity] error:', err?.message || err, err?.stack || '');
    return {
      totalHours: 0, gamesPlayed: 0, completionPercentage: 0,
      weeklyChange: 0, dailyHours: {}, gameTitles: [],
    };
  }
}
