import { BrowserWindow, ipcMain, shell } from 'electron';
import { getDatabase, initDatabase } from './database';
import { getSteamApiKey, steamAuth, syncSteamLibrary, fetchSteamAppDetailsBatch } from './steam-auth';
import {
  getDashboardStats,
  getGameById,
  getGames,
  createGame,
  updateGame,
  deleteGame,
  getBacklogInsights,
  getRecommendations,
  searchGames,
  getBacklogHealth,
  getCloseToCompletion,
  getShortSessionGames,
  getWeeklyActivity,
} from './game-service';
import { getActivities, createActivity, setMainWindow } from './activity-service';
import { updateSettings, getSettings } from './settings';
import { ActivityType } from '../shared/types';

let mainWindowRef: BrowserWindow | null = null;

export function setupIPC(mainWindow: BrowserWindow | null): void {
  mainWindowRef = mainWindow;
  setMainWindow(mainWindow);

  ipcMain.handle('get-dashboard-stats', async () => {
    return getDashboardStats();
  });

  ipcMain.handle('get-games', async (_event, params: any) => {
    return getGames(params);
  });

  ipcMain.handle('get-game-by-id', async (_event, id: string) => {
    return getGameById(id);
  });

  ipcMain.handle('create-game', async (_event, data: any) => {
    return createGame(data);
  });

  ipcMain.handle('update-game', async (_event, id: string, data: any) => {
    return updateGame(id, data);
  });

  ipcMain.handle('delete-game', async (_event, id: string) => {
    return deleteGame(id);
  });

  ipcMain.handle('search-games', async (_event, query: string) => {
    return searchGames(query);
  });

  ipcMain.handle('steam-auth-url', async () => {
    return steamAuth.getAuthUrl();
  });

  ipcMain.handle('steam-login', async () => {
    const authResult = await steamAuth.authenticate(mainWindow);
    if (authResult) {
      const syncResult = await syncSteamLibrary(authResult.steamId, (current, total, message) => {
        mainWindow?.webContents.send('sync-progress', { current, total, message });
      });
      return syncResult;
    }
    return { success: false, message: 'Authentication cancelled', imported: 0, updated: 0, errors: 0 };
  });

  ipcMain.handle('steam-sync', async () => {
    const db = getDatabase();
    const profile = await db.profile.findFirst();
    if (profile?.steamId) {
      return syncSteamLibrary(profile.steamId, (current, total, message) => {
        mainWindow?.webContents.send('sync-progress', { current, total, message });
      });
    }
    return { success: false, message: 'No Steam account linked' };
  });

  ipcMain.handle('steam-set-id', async (_event, steamId: string) => {
    const db = getDatabase();
    const profile = await db.profile.findFirst();
    if (!profile) return { success: false, message: 'No profile found' };
    await db.profile.update({ where: { id: profile.id }, data: { steamId } });
    return { success: true };
  });

  ipcMain.handle('steam-status', async () => {
    const db = getDatabase();
    const profile = await db.profile.findFirst();
    return {
      isConnected: !!profile?.steamId,
      username: profile?.steamUsername,
      avatar: profile?.steamAvatar,
      lastSync: profile?.steamLastSync,
    };
  });

  ipcMain.handle('steam-disconnect', async () => {
    const db = getDatabase();
    await db.profile.updateMany({
      where: {},
      data: {
        steamId: null,
        steamUsername: null,
        steamAvatar: null,
        steamData: null,
        steamLastSync: null,
      },
    });
    return { success: true };
  });

  ipcMain.handle('get-backlog-insights', async () => {
    return getBacklogInsights();
  });

  ipcMain.handle('get-recommendations', async (_event, type: string) => {
    return getRecommendations(type);
  });

  ipcMain.handle('get-settings', async () => {
    return getSettings();
  });

  ipcMain.handle('update-settings', async (_event, settings: any) => {
    return updateSettings(settings);
  });

  ipcMain.handle('get-profiles', async () => {
    const db = getDatabase();
    return db.profile.findMany();
  });

  ipcMain.handle('switch-profile', async (_event, profileId: string) => {
    const db = getDatabase();
    return db.profile.findUnique({ where: { id: profileId } });
  });

  ipcMain.handle('export-data', async (_event, format: string) => {
    const db = getDatabase();
    const games = await db.game.findMany();
    if (format === 'json') {
      return JSON.stringify(games, null, 2);
    }
    return games;
  });

  ipcMain.handle('import-data', async (_event, data: string) => {
    const db = getDatabase();
    const games = JSON.parse(data);
    let imported = 0;
    for (const game of games) {
      const { id, createdAt, updatedAt, ...rest } = game;
      await db.game.upsert({
        where: { slug: rest.slug },
        update: rest,
        create: rest,
      });
      imported++;
    }
    return { success: true, imported };
  });

  ipcMain.handle('minimize-to-tray', () => {
    mainWindow?.hide();
  });

  ipcMain.handle('get-platform', () => {
    return process.platform;
  });

  ipcMain.handle('get-activities', async (_event, params: any) => {
    return getActivities(params);
  });

  ipcMain.handle('create-activity', async (_event, type: string, payload: any) => {
    return createActivity(type as ActivityType, payload);
  });

  ipcMain.handle('get-backlog-health', async () => {
    return getBacklogHealth();
  });

  ipcMain.handle('get-close-to-completion', async () => {
    return getCloseToCompletion();
  });

  ipcMain.handle('get-short-session-games', async () => {
    return getShortSessionGames();
  });

  ipcMain.handle('get-weekly-activity', async () => {
    try {
      const result = await getWeeklyActivity();
      return result;
    } catch (err: any) {
      console.error('[get-weekly-activity] error:', err?.message || err, err?.stack || '');
      return {
        totalHours: 0, gamesPlayed: 0, completionPercentage: 0,
        weeklyChange: 0, dailyHours: {}, gameTitles: [],
      };
    }
  });

  ipcMain.handle('launch-steam-game', async (_event, steamAppId: string) => {
    try {
      await shell.openExternal(`steam://run/${steamAppId}`);
      return { success: true };
    } catch (err: any) {
      console.error('[launch-steam-game] error:', err?.message || err);
      return { success: false, error: err?.message || 'Failed to launch' };
    }
  });

  ipcMain.handle('get-game-achievements', async (_event, gameId: string) => {
    try {
      const { getGameAchievements } = await import('./game-service');
      const result = await getGameAchievements(gameId);
      return result;
    } catch (err: any) {
      console.error('IPC: get-game-achievements error:', err?.message || err);
      throw err;
    }
  });

  ipcMain.handle('get-all-achievements', async () => {
    const { SteamAchievementService } = await import('./steam-achievement-service');
    return SteamAchievementService.getInstance().getCachedAchievements();
  });

  ipcMain.handle('sync-steam-achievements', async () => {
    try {
      const db = getDatabase();
      const profile = await db.profile.findFirst();
      if (!profile?.steamId) {
        return { success: false, message: 'No Steam account linked', imported: 0, skipped: 0, failed: 0, total: 0, achievements: [] };
      }
      const apiKey = getSteamApiKey();
      if (!apiKey) {
        return { success: false, message: 'Steam API key not configured in settings', imported: 0, skipped: 0, failed: 0, total: 0, achievements: [] };
      }
      const { SteamAchievementService } = await import('./steam-achievement-service');
      return await SteamAchievementService.getInstance().syncAllGames(profile.steamId, (current, total, gameTitle) => {
        mainWindow?.webContents.send('sync-progress', { current, total, message: gameTitle });
      });
    } catch (err) {
      console.error('[steam:syncAchievements] Error:', err);
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Unknown error during achievement sync',
        imported: 0, skipped: 0, failed: 0, total: 0, achievements: [],
      };
    }
  });

  ipcMain.handle('get-achievement-stats', async () => {
    const { SteamAchievementService } = await import('./steam-achievement-service');
    return SteamAchievementService.getInstance().getStats();
  });

  ipcMain.handle('refresh-game-metadata', async (_event, gameId: string) => {
    try {
      const db = getDatabase();
      const game = await db.game.findUnique({ where: { id: gameId } });
      if (!game?.steamAppId) {
        return { success: false, message: 'Game has no Steam App ID' };
      }
      const metaMap = await fetchSteamAppDetailsBatch([game.steamAppId]);
      const meta = metaMap.get(game.steamAppId);
      if (!meta) {
        return { success: false, message: 'Could not fetch metadata from Steam' };
      }
      await db.game.update({
        where: { id: gameId },
        data: {
          genre: meta.genre,
          developer: meta.developer,
          publisher: meta.publisher,
          releaseDate: meta.releaseDate,
        },
      });
      return { success: true, ...meta };
    } catch (err: any) {
      console.error('[refresh-game-metadata] Error:', err);
      return { success: false, message: err?.message || 'Unknown error' };
    }
  });

  ipcMain.handle('refresh-all-metadata', async (_event) => {
    try {
      const db = getDatabase();
      const games = await db.game.findMany({
        where: { steamAppId: { not: null } },
        select: { id: true, steamAppId: true, genre: true, developer: true, publisher: true, releaseDate: true },
      });
      const allIds = games.map(g => g.steamAppId!).filter(Boolean);
      if (allIds.length === 0) {
        return { success: true, enriched: 0, total: 0, message: 'No Steam games found' };
      }

      const uniqueIds = [...new Set(allIds)];
      const metaMap = await fetchSteamAppDetailsBatch(uniqueIds, (done, total) => {
        mainWindow?.webContents.send('sync-progress', { current: done, total, message: `Fetching metadata (${done}/${total})...` });
      });

      let enriched = 0;
      for (const game of games) {
        if (!game.steamAppId) continue;
        const meta = metaMap.get(game.steamAppId);
        if (!meta) continue;

        const updateData: any = {};
        if (!game.genre && meta.genre) { updateData.genre = meta.genre; enriched++; }
        if (!game.developer && meta.developer) { updateData.developer = meta.developer; enriched++; }
        if (!game.publisher && meta.publisher) { updateData.publisher = meta.publisher; enriched++; }
        if (!game.releaseDate && meta.releaseDate) { updateData.releaseDate = meta.releaseDate; enriched++; }

        if (Object.keys(updateData).length > 0) {
          await db.game.update({ where: { id: game.id }, data: updateData });
        }
      }

      return { success: true, enriched, total: games.length, message: `Enriched ${enriched} fields across ${games.length} games` };
    } catch (err: any) {
      console.error('[refresh-all-metadata] Error:', err);
      return { success: false, message: err?.message || 'Unknown error' };
    }
  });

  ipcMain.handle('factory-reset', async () => {
    const db = getDatabase();

    // Standalone tables with no FK constraints
    try {
      await db.$executeRawUnsafe('DELETE FROM "Activity"');
    } catch {}
    await db.syncLog.deleteMany();

    // Profile cascades to games, games cascade to achievements
    await db.profile.deleteMany();

    // Reset settings to factory defaults
    const { updateSettings } = await import('./settings');
    updateSettings({
      theme: 'dark',
      sidebarCollapsed: false,
      autoSync: true,
      syncInterval: 30,
      notificationsEnabled: true,
      minimizeToTray: true,
      startOnBoot: false,
      language: 'en',
    });

    // Create fresh default profile
    await db.profile.create({ data: { name: 'Default' } });

    return { success: true };
  });
}
