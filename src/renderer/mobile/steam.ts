import { CapacitorHttp } from '@capacitor/core';

export interface SteamAchievement {
  id: string;
  name: string;
  description: string;
  iconUrl: string | null;
  unlocked: boolean;
  unlockedAt: string | null;
  globalProgress: number | null;
}

export async function getSteamSettings(): Promise<{ apiKey: string; steamId: string }> {
  const settings = await window.backly.getSettings();
  return {
    apiKey: String(settings?.steamApiKey || '').trim(),
    steamId: String(settings?.steamId || '').trim(),
  };
}

export async function refreshSteamMetadata(game: any): Promise<{
  genre: string | null;
  developer: string | null;
  publisher: string | null;
  releaseDate: string | null;
}> {
  if (!game?.steamAppId) throw new Error('This game is not linked to Steam');

  const response = await CapacitorHttp.get({
    url: 'https://store.steampowered.com/api/appdetails',
    params: { appids: String(game.steamAppId), l: 'english' },
  });

  const payload = response.data?.[game.steamAppId];
  if (response.status !== 200 || !payload?.success || !payload.data) {
    throw new Error('Steam did not return metadata for this game');
  }

  const data = payload.data;
  const releaseDate = data.release_date?.date
    ? (() => {
        const parsed = new Date(data.release_date.date);
        return Number.isNaN(parsed.getTime()) ? data.release_date.date : parsed.toISOString();
      })()
    : null;

  return {
    genre: Array.isArray(data.genres) ? data.genres.map((genre: any) => genre.description).filter(Boolean).join(', ') || null : null,
    developer: Array.isArray(data.developers) ? data.developers.filter(Boolean).join(', ') || null : null,
    publisher: Array.isArray(data.publishers) ? data.publishers.filter(Boolean).join(', ') || null : null,
    releaseDate,
  };
}

export async function syncSteamAchievements(game: any): Promise<{
  achievements: SteamAchievement[];
  total: number;
  unlocked: number;
  percentage: number;
}> {
  if (!game?.steamAppId) throw new Error('This game is not linked to Steam');

  const { apiKey, steamId } = await getSteamSettings();
  if (!apiKey || !steamId) {
    throw new Error('Add your Steam API key and SteamID64 in Settings first');
  }

  const schemaResponse = await CapacitorHttp.get({
    url: 'https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/',
    params: { key: apiKey, appid: String(game.steamAppId) },
  });

  const playerResponse = await CapacitorHttp.get({
    url: 'https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/',
    params: { key: apiKey, steamid: steamId, appid: String(game.steamAppId) },
  });

  const schemaAchievements = schemaResponse.data?.game?.availableGameStats?.achievements || [];
  const playerAchievements = playerResponse.data?.playerstats?.achievements || [];
  const playerMap = new Map(playerAchievements.map((achievement: any) => [achievement.apiname, achievement as any]));

  let globalMap = new Map<string, number>();
  try {
    const globalResponse = await CapacitorHttp.get({
      url: 'https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/',
      params: { gameid: String(game.steamAppId) },
    });
    const globalAchievements = globalResponse.data?.achievementpercentages?.achievements || [];
    globalMap = new Map(globalAchievements.map((achievement: any) => [achievement.name, achievement.percent]));
  } catch {
    // Global percentages are optional.
  }

  let achievements: SteamAchievement[] = schemaAchievements.map((schema: any) => {
    const player = playerMap.get(schema.name);
    return {
      id: schema.name,
      name: schema.displayName || schema.name,
      description: schema.description || '',
      iconUrl: (player as any)?.achieved ? schema.icon || null : schema.icongray || null,
      unlocked: Boolean((player as any)?.achieved),
      unlockedAt: (player as any)?.achieved && (player as any)?.unlocktime
        ? new Date((player as any).unlocktime * 1000).toISOString()
        : null,
      globalProgress: globalMap.has(schema.name) ? globalMap.get(schema.name)! : null,
    };
  });

  if (achievements.length === 0 && playerAchievements.length > 0) {
    achievements = playerAchievements.map((achievement: any) => ({
      id: achievement.apiname,
      name: achievement.apiname,
      description: '',
      iconUrl: null,
      unlocked: Boolean(achievement.achieved),
      unlockedAt: achievement.achieved && achievement.unlocktime
        ? new Date(achievement.unlocktime * 1000).toISOString()
        : null,
      globalProgress: null,
    }));
  }

  const total = achievements.length;
  const unlocked = achievements.filter((achievement) => achievement.unlocked).length;
  const percentage = total > 0 ? Math.round((unlocked / total) * 100) : 0;

  await window.backly.updateGame(game.id, {
    achievementsData: JSON.stringify(achievements),
    totalAchievements: total,
    unlockedAchievements: unlocked,
    completionPercentage: percentage,
  });

  return { achievements, total, unlocked, percentage };
}
