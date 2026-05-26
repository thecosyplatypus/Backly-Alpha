import { getDatabase } from './database';
import { GameStatus, ActivityType } from '../shared/types';
import { Prisma } from '@prisma/client';
import { createActivity } from './activity-service';
import { fetchSteamAchievements, fetchSteamGlobalAchievementPercentages, fetchSteamAchievementSchema } from './steam-auth';
import { settingsStore } from './settings';

export async function getGames(params?: {
  status?: GameStatus;
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

  if (params?.status) where.status = params.status;
  if (params?.genre) where.genre = params.genre;
  if (params?.platform) where.platform = params.platform;
  if (params?.isFavourite) where.isFavourite = true;
  if (params?.tags) where.tags = { contains: params.tags };
  if (params?.search) {
    where.OR = [
      { title: { contains: params.search } },
      { developer: { contains: params.search } },
      { publisher: { contains: params.search } },
    ];
  }

  const orderBy: any = {};
  switch (params?.sort) {
    case 'title': orderBy.title = 'asc'; break;
    case 'recent': orderBy.updatedAt = 'desc'; break;
    case 'created': orderBy.createdAt = 'desc'; break;
    case 'rating': orderBy.userRating = 'desc'; break;
    case 'hours': orderBy.hoursPlayed = 'desc'; break;
    case 'hours_asc': orderBy.hoursPlayed = 'asc'; break;
    default: orderBy.updatedAt = 'desc';
  }

  const [games, total] = await Promise.all([
    db.game.findMany({
      where,
      orderBy,
      take: params?.limit || 100,
      skip: params?.offset || 0,
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
    if (game.hoursPlayed === 0 && data.status !== GameStatus.BACKLOG && data.status !== GameStatus.WISHLIST) {
      data.status = GameStatus.STARTED;
    }

    const prevStatus = game.status;
    const newStatus = data.status;

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

  const allGames = await db.game.findMany({ where: { profileId: profile.id } });

  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const completedGames = allGames.filter(g => g.status === GameStatus.COMPLETED);
  const backlogGames = allGames.filter(g => g.status === GameStatus.BACKLOG);
  const wishlistGames = allGames.filter(g => g.status === GameStatus.WISHLIST);

  const genreCounts: Record<string, number> = {};
  for (const g of allGames) {
    if (g.genre) {
      genreCounts[g.genre] = (genreCounts[g.genre] || 0) + 1;
    }
  }
  const mostPlayedGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  const totalBacklogEstimate = 0;
  const avgCompletionTime = completedGames.length > 0
    ? Math.round(completedGames.reduce((sum, g) => sum + (g.hoursPlayed || 0), 0) / completedGames.length)
    : 0;

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
    avgCompletionTime,
    isSteamSynced: !!profile.steamId,
    totalBacklogEstimate: totalBacklogEstimate,
    currentlyPlaying: allGames.filter(g => g.status === GameStatus.PLAYING).length,
    startedCount: allGames.filter(g => g.status === GameStatus.STARTED).length,
    droppedCount: allGames.filter(g => g.status === GameStatus.DROPPED).length,
    pausedCount: allGames.filter(g => g.status === GameStatus.PAUSED).length,
    favouriteCount: allGames.filter(g => g.isFavourite).length,
  };
}

export async function getBacklogInsights() {
  const db = getDatabase();
  const profile = await db.profile.findFirst();
  if (!profile) return [];

  const games = await db.game.findMany({ where: { profileId: profile.id } });

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

const TIPS_CACHE = { data: null as any, timestamp: 0 };
const CACHE_TTL = 5 * 60 * 1000;

export async function getSmartTips() {
  const db = getDatabase();
  const profile = await db.profile.findFirst();
  if (!profile) {
    return { quickWins: 0, almostThere: 0, hiddenGems: 0, cleanup: 0 };
  }

  const now = Date.now();
  if (TIPS_CACHE.data && now - TIPS_CACHE.timestamp < CACHE_TTL) {
    return TIPS_CACHE.data;
  }

  const allGames = await db.game.findMany({ where: { profileId: profile.id } });
  const nonCompleted = allGames.filter(g => g.status !== GameStatus.COMPLETED);

  // Reset cache so concurrent calls don't double-count
  TIPS_CACHE.timestamp = now;

  const tips = {
    quickWins: 0,
    almostThere: nonCompleted.filter(g => g.totalAchievements > 0 && g.completionPercentage >= 90).length,
    hiddenGems: nonCompleted.filter(g => (!g.hoursPlayed || g.hoursPlayed === 0) && g.userRating && g.userRating >= 7).length,
    cleanup: nonCompleted.filter(g => (!g.hoursPlayed || g.hoursPlayed === 0) && g.status === GameStatus.BACKLOG).length,
  };

  TIPS_CACHE.data = tips;
  return tips;
}

export async function getRecommendations(type?: string) {
  const db = getDatabase();
  const profile = await db.profile.findFirst();
  if (!profile) return [];

  const games = await db.game.findMany({
    where: { profileId: profile.id, NOT: { status: GameStatus.COMPLETED } },
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
    case 'hidden-gem': {
      const gems = games.filter(g => (!g.hoursPlayed || g.hoursPlayed === 0) && g.userRating && g.userRating >= 7);
      gems.forEach(g => recommendations.push({ game: g, reason: 'Hidden gem — highly rated but unplayed', priority: g.userRating || 0 }));
      break;
    }
    default: {
      const short = games.filter(g => g.hoursPlayed > 0 && g.hoursPlayed <= 10);
      short.forEach(g => recommendations.push({ game: g, reason: 'Quick completion — under 10 hours played', priority: 10 - (g.hoursPlayed || 0) }));
      const achClose = games.filter(g => g.totalAchievements > 0 && g.completionPercentage >= 90);
      achClose.forEach(g => {
        if (!recommendations.find(r => r.game.id === g.id)) {
          recommendations.push({ game: g, reason: `${Math.round(g.completionPercentage)}% achievements unlocked`, priority: Math.round(g.completionPercentage) });
        }
      });
      const quick = games.filter(g => g.hoursPlayed > 0 && g.hoursPlayed <= 5 && !recommendations.find(r => r.game.id === g.id));
      quick.forEach(g => recommendations.push({ game: g, reason: 'Quick win — under 5 hours played', priority: 10 - (g.hoursPlayed || 0) }));
      break;
    }
  }

  return recommendations.sort((a, b) => b.priority - a.priority).slice(0, 10);
}

export async function getBacklogHealth() {
  const db = getDatabase();
  const profile = await db.profile.findFirst();
  if (!profile) return null;

  const allGames = await db.game.findMany({ where: { profileId: profile.id } });
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
  });

  return games
    .filter(g => g.totalAchievements > 0 && g.completionPercentage >= 75)
    .map(g => ({
      game: g,
      progress: Math.min(100, Math.round(g.completionPercentage)),
      estimatedRemaining: g.totalAchievements - g.unlockedAchievements,
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
  });

  const categories = [
    {
      id: 'under-5',
      title: 'Under 5 Hours',
      description: 'Perfect for tonight',
      icon: 'clock',
      games: games.filter(g => g.hoursPlayed > 0 && g.hoursPlayed <= 5).slice(0, 6),
    },
    {
      id: 'one-session',
      title: 'One-Session Wonders',
      description: 'Games you can finish in one sitting',
      icon: 'zap',
      games: games.filter(g => g.hoursPlayed > 0 && g.hoursPlayed <= 3).slice(0, 6),
    },
    {
      id: 'weekend',
      title: 'Weekend Picks',
      description: 'Dive into something deeper this weekend',
      icon: 'calendar',
      games: games.filter(g => g.genre === 'RPG' && g.hoursPlayed > 0).slice(0, 6),
    },
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

  const allAchievements: any[] = [];
  for (const game of games) {
    const gameAchievements = await db.achievement.findMany({ where: { gameId: game.id } });
    for (const a of gameAchievements) {
      allAchievements.push({
        id: a.id,
        name: a.name,
        description: a.description || '',
        iconUrl: a.iconUrl,
        unlocked: a.unlocked,
        unlockedAt: a.unlockedAt,
        gameId: game.id,
        gameTitle: game.title,
      });
    }
  }

  return allAchievements.sort((a, b) => {
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

  const apiKey = settingsStore.get('steamApiKey') || process.env.STEAM_API_KEY;
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

        const schemaHasAchievements = Object.keys(schema).length > 0;

        if (!achievements || achievements.length === 0) {
          if (!schemaHasAchievements) {
            const existing = await db.game.findUnique({ where: { id: game.id }, select: { manualStatus: true } });
            if (!existing?.manualStatus) {
              await db.game.update({ where: { id: game.id }, data: { status: 'NO_ACHIEVEMENTS' } });
            }
          }
          onProgress?.(index + 1, games.length, `${game.title} — no achievements`);
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
            },
          });

          steamData.push({ ...ach, globalProgress: globalPct });
        }

        const unlockedCount = achievements.filter((a: any) => a.achieved).length;
        const totalCount = achievements.length;

        await db.game.update({
          where: { id: game.id },
          data: {
            achievementsData: JSON.stringify(steamData),
            totalAchievements: totalCount,
            unlockedAchievements: unlockedCount,
            completionPercentage: totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0,
          },
        });

        const existing = await db.game.findUnique({ where: { id: game.id }, select: { manualStatus: true } });
        if (!existing?.manualStatus) {
          let newStatus: string;
          if (unlockedCount === 0) {
            newStatus = 'BACKLOG';
          } else if (unlockedCount >= totalCount) {
            newStatus = 'COMPLETED';
          } else {
            newStatus = 'PLAYING';
          }
          await db.game.update({ where: { id: game.id }, data: { status: newStatus } });
        }

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
