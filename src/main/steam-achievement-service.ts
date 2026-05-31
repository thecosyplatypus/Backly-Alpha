import axios from 'axios';
import { getDatabase } from './database';
import { getSteamApiKey } from './steam-auth';
import { settingsStore } from './settings';

interface AchievementData {
  id: string;
  name: string;
  apiName: string;
  description: string;
  iconUrl: string | null;
  iconGrayUrl: string | null;
  unlocked: boolean;
  unlockTime: string | null;
  globalProgress: number | null;
  gameId: string;
  gameTitle: string;
  gameAppId: string;
}

type SyncStatus = 'SUCCESS' | 'NO_ACHIEVEMENTS' | 'NO_PLAYER_DATA' | 'INVALID_APP' | 'FAILED';

interface SyncResult {
  status: SyncStatus;
  achievementData?: AchievementData[];
}

const axiosClient = axios.create({ timeout: 10000 });

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function asyncConcurrencyLimit<T>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<void>
): Promise<void> {
  const results: Promise<void>[] = [];
  const executing = new Set<Promise<void>>();
  for (let i = 0; i < items.length; i++) {
    const p = Promise.resolve().then(() => fn(items[i], i));
    results.push(p);
    executing.add(p);
    const clean = () => executing.delete(p);
    p.then(clean, clean);
    if (executing.size >= concurrency) {
      await Promise.race(executing);
    }
  }
  await Promise.all(results);
}

function safeNumber(value: any): number {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export class SteamAchievementService {
  private static instance: SteamAchievementService;
  private constructor() {}

  static getInstance(): SteamAchievementService {
    if (!SteamAchievementService.instance) {
      SteamAchievementService.instance = new SteamAchievementService();
    }
    return SteamAchievementService.instance;
  }

  private getApiKey(): string | null {
    return getSteamApiKey() || null;
  }

  private async getSchema(appId: string, retries = 3): Promise<any> {
    const apiKey = this.getApiKey();
    if (!apiKey) return null;

    try {
      const res = await axiosClient.get(
        'https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/',
        { params: { key: apiKey, appid: appId } }
      );
      return res.data?.game || null;
    } catch (err: any) {
      if (err.response?.status === 429 && retries > 0) {
        console.warn('[RATE LIMITED]', appId, `${retries} retries left`);
        await sleep(2000);
        return this.getSchema(appId, retries - 1);
      }
      console.warn('[SCHEMA FAILED]', appId);
      return null;
    }
  }

  private async getPlayerAchievements(steamId: string, appId: string, retries = 3): Promise<any> {
    const apiKey = this.getApiKey();
    if (!apiKey) return null;

    try {
      console.log(`[ACH] Fetching player achievements for app ${appId} (SteamID: ${steamId})`);
      const res = await axiosClient.get(
        'https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/',
        { params: { key: apiKey, steamid: steamId, appid: appId } }
      );
      console.log(`[ACH] Status: ${res.status} for app ${appId}`);
      const playerstats = res.data?.playerstats;
      if (playerstats && playerstats.success === false) {
        console.warn(`[ACH] success:false for app ${appId} — Steam profile privacy or no achievements`);
        return null;
      }
      return playerstats || null;
    } catch (err: any) {
      const status = err.response?.status;
      console.warn(`[ACH] HTTP ${status || 'ERR'} for app ${appId}`);
      if (status === 403) {
        console.warn('[PRIVATE GAME DATA]', appId);
        return null;
      }
      if (status === 429 && retries > 0) {
        console.warn('[RATE LIMITED]', appId, `${retries} retries left`);
        await sleep(2000);
        return this.getPlayerAchievements(steamId, appId, retries - 1);
      }
      console.warn('[PLAYER ACHIEVEMENTS FAILED]', appId);
      return null;
    }
  }

  private async getGlobalPercentages(appId: string): Promise<Record<string, number>> {
    const apiKey = this.getApiKey();
    if (!apiKey) return {};

    try {
      const res = await axiosClient.get(
        'https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/',
        { params: { gameid: appId } }
      );
      const entries = res.data?.achievementpercentages?.achievements;
      if (!entries) return {};
      const map: Record<string, number> = {};
      for (const e of entries) {
        map[e.name] = safeNumber(e.percent);
      }
      return map;
    } catch {
      return {};
    }
  }

  /** Ensure the game record exists before saving achievements */
  private async ensureGame(gameId: string, appId: string, gameTitle: string): Promise<void> {
    const db = getDatabase();
    const existing = await db.game.findUnique({ where: { id: gameId }, select: { id: true } });
    if (!existing) {
      const profile = await db.profile.findFirst();
      if (!profile) return;
      await db.game.create({
        data: {
          id: gameId,
          title: gameTitle,
          slug: `${gameTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${appId}`,
          platform: 'Steam',
          steamAppId: appId,
          importedFromSteam: true,
          status: 'BACKLOG',
          profileId: profile.id,
        },
      });
    }
  }

  /** Sync achievements for a single game */
  async syncGameAchievements(
    steamId: string,
    gameId: string,
    gameTitle: string,
    appId: string
  ): Promise<SyncResult> {
    const numericAppId = safeNumber(appId);
    if (!numericAppId) {
      console.warn('[INVALID APP ID]', { gameId, gameTitle, appId });
      return { status: 'INVALID_APP' };
    }

    console.log(`[ACH] Syncing ${gameTitle} (${appId}) steamId=${steamId}`);

    await this.ensureGame(gameId, appId, gameTitle);

    const schema = await this.getSchema(appId);

    if (!schema?.availableGameStats?.achievements) {
      console.log(`[ACH] No achievements defined for ${gameTitle} (${appId})`);
      return { status: 'NO_ACHIEVEMENTS' };
    }

    const playerData = await this.getPlayerAchievements(steamId, appId);

    if (!playerData?.achievements) {
      console.log(`[ACH] No player achievement data for ${gameTitle} (${appId}) — privacy or no achievements`);
      return { status: 'NO_PLAYER_DATA' };
    }

    const globalPcts = await this.getGlobalPercentages(appId);
    const db = getDatabase();

    const schemaAchs = schema.availableGameStats.achievements;
    const playerAchs: any[] = playerData.achievements;

    let unlockedCount = 0;
    const achievementData: AchievementData[] = [];
    const steamData: any[] = [];

    await db.$transaction(async (tx: any) => {
      for (const schemaAch of schemaAchs) {
        const apiName = schemaAch.name;
        const playerAch = playerAchs.find((p: any) => p.apiname === apiName);

        const unlocked = playerAch?.achieved === 1;
        if (unlocked) unlockedCount++;

        const globalPct = globalPcts[apiName] ?? null;
        const iconUrl = schemaAch.icon || null;
        const iconGrayUrl = schemaAch.icongray || null;

        await tx.achievement.upsert({
          where: { gameId_name: { gameId, name: schemaAch.displayName || apiName } },
          update: {
            apiName,
            unlocked,
            unlockedAt: playerAch?.unlocktime ? new Date(safeNumber(playerAch.unlocktime) * 1000) : null,
            description: schemaAch.description || '',
            globalProgress: globalPct,
            iconUrl,
            iconGrayUrl: iconGrayUrl || '',
          },
          create: {
            gameId,
            name: schemaAch.displayName || apiName,
            apiName,
            description: schemaAch.description || '',
            unlocked,
            unlockedAt: playerAch?.unlocktime ? new Date(safeNumber(playerAch.unlocktime) * 1000) : null,
            globalProgress: globalPct,
            iconUrl,
            iconGrayUrl: iconGrayUrl || '',
          },
        });

        achievementData.push({
          id: '',
          name: schemaAch.displayName || apiName,
          apiName,
          description: schemaAch.description || '',
          iconUrl,
          iconGrayUrl,
          unlocked,
          unlockTime: playerAch?.unlocktime ? new Date(safeNumber(playerAch.unlocktime) * 1000).toISOString() : null,
          globalProgress: globalPct,
          gameId,
          gameTitle,
          gameAppId: appId,
        });

        steamData.push({
          apiname: apiName,
          name: schemaAch.displayName || apiName,
          achieved: unlocked ? 1 : 0,
          unlockTime: safeNumber(playerAch?.unlocktime),
          description: schemaAch.description || '',
          globalProgress: globalPct,
        });
      }

      const totalCount = schemaAchs.length;
      const pct = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

      const updateData: any = {
        achievementsData: JSON.stringify(steamData),
        totalAchievements: totalCount,
        unlockedAchievements: unlockedCount,
        completionPercentage: pct,
      };

      if (totalCount > 0) {
        if (pct >= 100) {
          updateData.status = 'COMPLETED';
          updateData.completionDate = new Date().toISOString();
        } else if (pct >= 90) {
          updateData.status = 'ALMOST_COMPLETED';
        } else if (pct >= 50) {
          updateData.status = 'PLAYING';
        } else if (pct > 0) {
          updateData.status = 'STARTED';
        } else {
          updateData.status = 'BACKLOG';
        }
      }

      await tx.game.update({
        where: { id: gameId },
        data: updateData,
      });
    });

    console.log(`[SUCCESS] ${appId} | ${unlockedCount}/${schemaAchs.length}`);
    return { status: 'SUCCESS', achievementData };
  }

  /** Sync achievements for all Steam-linked games */
  async syncAllGames(
    steamId: string,
    onProgress?: (current: number, total: number, gameTitle: string) => void
  ) {
    const db = getDatabase();

    const games = await db.game.findMany({
      where: { profileId: (await db.profile.findFirst())?.id, steamAppId: { not: null } },
      select: { id: true, title: true, steamAppId: true },
    });

    if (games.length === 0) {
      return { success: true, message: 'No games to sync achievements for', imported: 0, skipped: 0, failed: 0, total: 0, achievements: [] };
    }

    let imported = 0;
    let skipped = 0;
    let failed = 0;
    const allAchievements: AchievementData[] = [];

    await asyncConcurrencyLimit(games, 2, async (game, index) => {
      onProgress?.(index + 1, games.length, game.title);

      try {
        const result = await this.syncGameAchievements(steamId, game.id, game.title, game.steamAppId!);

        switch (result.status) {
          case 'SUCCESS':
            imported++;
            if (result.achievementData) {
              allAchievements.push(...result.achievementData);
            }
            break;
          case 'NO_ACHIEVEMENTS':
          case 'NO_PLAYER_DATA':
          case 'INVALID_APP':
            skipped++;
            break;
          case 'FAILED':
            failed++;
            break;
        }
      } catch (err) {
        failed++;
        console.error('[FAILED] Achievement sync:', game.steamAppId, err);
      }
    });

    return {
      success: failed === 0,
      message: `Imported achievements for ${imported} game(s), ${skipped} without achievements${failed > 0 ? `, ${failed} failed` : ''}`,
      imported,
      skipped,
      failed,
      total: games.length,
      achievements: allAchievements,
    };
  }

  /** Read all cached achievements from the local DB */
  async getCachedAchievements(): Promise<AchievementData[]> {
    const db = getDatabase();
    const profile = await db.profile.findFirst();
    if (!profile) return [];

    const games = await db.game.findMany({
      where: { profileId: profile.id, steamAppId: { not: null } },
      select: { id: true, title: true, steamAppId: true },
    });

    const results: AchievementData[] = [];
    for (const game of games) {
      const entries = await db.achievement.findMany({ where: { gameId: game.id } });
      for (const a of entries) {
        results.push({
          id: a.id,
          name: a.name,
          apiName: a.apiName || '',
          description: a.description || '',
          iconUrl: a.iconUrl || null,
          iconGrayUrl: null,
          unlocked: a.unlocked,
          unlockTime: a.unlockedAt ? a.unlockedAt.toISOString() : null,
          globalProgress: a.globalProgress ?? null,
          gameId: game.id,
          gameTitle: game.title,
          gameAppId: game.steamAppId || '',
        });
      }
    }

    results.sort((a, b) => {
      if (a.unlocked && !b.unlocked) return -1;
      if (!a.unlocked && b.unlocked) return 1;
      return 0;
    });

    return results;
  }

  /** Get achievement stats summary */
  async getStats() {
    const all = await this.getCachedAchievements();
    return {
      total: all.length,
      unlocked: all.filter(a => a.unlocked).length,
      locked: all.filter(a => !a.unlocked).length,
      games: [...new Set(all.map(a => a.gameId))].length,
    };
  }
}
