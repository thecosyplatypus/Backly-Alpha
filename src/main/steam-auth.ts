import axios from 'axios';
import crypto from 'crypto';
import { BrowserWindow } from 'electron';
import { getDatabase } from './database';
import { GameStatus } from '../shared/types';
import { createActivity } from './activity-service';

const STEAM_LOGIN_URL = 'https://steamcommunity.com/openid/login';

export function getSteamApiKey(): string {
  const key = Buffer.from('0ecb374421123c6dbc1a5848a5241d9f3fc95a5d69b7e14781b884a504d59944', 'hex');
  const iv = Buffer.from('4a4a0eee6d5e36e58115a1f149ce66d9', 'hex');
  const encrypted = '834f2a5fe866252a383ea379888ce62e668bfaefe411894a6e3089c83829133f14a5a6795349e8abf06853e1d254e728';
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
}

function getBaseUrl(): string {
  return 'http://localhost:5173';
}

export const steamAuth = {
  getAuthUrl(): string {
    const baseUrl = getBaseUrl();
    const returnUrl = `${baseUrl}/steam-callback`;
    const params = new URLSearchParams({
      'openid.ns': 'http://specs.openid.net/auth/2.0',
      'openid.mode': 'checkid_setup',
      'openid.return_to': returnUrl,
      'openid.realm': baseUrl,
      'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
      'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
    });
    return `${STEAM_LOGIN_URL}?${params.toString()}`;
  },

  async authenticate(mainWindow?: BrowserWindow | null): Promise<{ steamId: string } | null> {
    const authWindow = new BrowserWindow({
      width: 800,
      height: 700,
      title: 'Steam Login',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    const baseUrl = getBaseUrl();
    const filter = { urls: [`${baseUrl}/steam-callback*`] };
    const ses = authWindow.webContents.session;

    const handleBeforeRequest: any = (details: any, callback: any) => {
      const url = details.url;
      if (url.includes('steam-callback')) {
        const parsed = new URL(url);
        const claimedId = parsed.searchParams.get('openid.claimed_id');
        if (claimedId) {
          const steamId = claimedId.split('/').pop();
          if (steamId) {
            setImmediate(() => {
              authWindow.close();
              resolvePromise({ steamId });
            });
          }
        }
        callback({ cancel: true });
        return;
      }
      callback({});
    };

    ses.webRequest.onBeforeRequest(filter, handleBeforeRequest);

    let resolvePromise: (value: { steamId: string } | null) => void;
    const authPromise = new Promise<{ steamId: string } | null>((resolve) => {
      resolvePromise = resolve;

      const handleRedirect = (_event: any, url: string) => {
        if (url.includes('steam-callback')) {
          const parsed = new URL(url);
          const claimedId = parsed.searchParams.get('openid.claimed_id');
          if (claimedId) {
            const steamId = claimedId.split('/').pop();
            if (steamId) {
              authWindow.close();
              resolve({ steamId });
            }
          }
        }
      };

      const handleNavigate = (_event: any, url: string) => {
        if (url.includes('steam-callback')) {
          const parsed = new URL(url);
          const claimedId = parsed.searchParams.get('openid.claimed_id');
          if (claimedId) {
            const steamId = claimedId.split('/').pop();
            if (steamId) {
              authWindow.close();
              resolve({ steamId });
            }
          }
        }
      };

      authWindow.webContents.on('will-redirect', handleRedirect);
      authWindow.webContents.on('will-navigate', handleNavigate);

      authWindow.on('closed', () => {
        ses.webRequest.onBeforeRequest(null);
        try { authWindow.webContents.removeListener('will-redirect', handleRedirect); } catch {}
        try { authWindow.webContents.removeListener('will-navigate', handleNavigate); } catch {}
        resolve(null);
      });
    });

    authWindow.loadURL(this.getAuthUrl());

    return authPromise;
  },
};

async function fetchSteamUserData(steamId: string) {
  const apiKey = getSteamApiKey();
  if (!apiKey) throw new Error('Steam API key not configured');
  const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${steamId}`;
  const response = await axios.get(url, { timeout: 15000 });
  const player = response.data?.response?.players?.[0];
  if (player) {
    return {
      username: player.personaname,
      avatar: player.avatar,
      avatarFull: player.avatarfull,
      profileUrl: player.profileurl,
    };
  }
  return null;
}

export async function fetchSteamAchievementSchema(appId: string) {
  const apiKey = getSteamApiKey();
  if (!apiKey) return {};

  const url = `https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${apiKey}&appid=${appId}&format=json`;
  try {
    const response = await axios.get(url, { timeout: 10000 });
    const game = response.data?.game;
    if (!game?.availableGameStats?.achievements) return {};
    const map: Record<string, { icon: string; icongray: string }> = {};
    for (const ach of game.availableGameStats.achievements) {
      map[ach.name] = { icon: ach.icon, icongray: ach.icongray };
    }
    return map;
  } catch {
    return {};
  }
}

export async function fetchSteamAchievements(steamId: string, appId: string) {
  const apiKey = getSteamApiKey();
  if (!apiKey) return [];

  const url = `https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?key=${apiKey}&steamid=${steamId}&appid=${appId}`;
  try {
    const response = await axios.get(url, { timeout: 10000 });
    const playerstats = response.data?.playerstats;
    if (!playerstats) {
      console.warn(`[ACH] No playerstats for app ${appId}`);
      return [];
    }
    if (playerstats.success === false) {
      console.warn(`[ACH] success:false for app ${appId} — profile privacy`);
      return [];
    }
    const achievements = playerstats.achievements;
    if (!achievements) return [];
    return achievements.map((a: any) => ({
      name: a.name,
      apiName: a.apiname,
      description: a.description || '',
      achieved: a.achieved === 1,
      unlockTime: a.unlocktime ? new Date(a.unlocktime * 1000).toISOString() : null,
    }));
  } catch (err: any) {
    console.warn(`[ACH] fetch failed for app ${appId}:`, err?.message || err);
    return [];
  }
}

export async function fetchSteamGlobalAchievementPercentages(appId: string) {
  const apiKey = getSteamApiKey();
  if (!apiKey) return {};

  const url = `https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/?gameid=${appId}`;
  try {
    const response = await axios.get(url, { timeout: 10000 });
    const achievements = response.data?.achievementpercentages?.achievements;
    if (!achievements) return {};
    const map: Record<string, number> = {};
    for (const a of achievements) {
      map[a.name] = Number(a.percent) || 0;
    }
    return map;
  } catch {
    return {};
  }
}

export interface SteamAppDetails {
  genre: string | null;
  developer: string | null;
  publisher: string | null;
  releaseDate: Date | null;
}

const steamDetailsCache = new Map<string, SteamAppDetails | null>();

async function fetchSteamAppDetails(appId: string): Promise<SteamAppDetails | null> {
  const cached = steamDetailsCache.get(appId);
  if (cached !== undefined) return cached;

  const MAX_RETRIES = 3;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await axios.get(`https://store.steampowered.com/api/appdetails?appids=${appId}`, { timeout: 10000 });
      const entry = response.data?.[appId];
      if (!entry?.success || !entry?.data) {
        steamDetailsCache.set(appId, null);
        return null;
      }

      const d = entry.data;
      const result: SteamAppDetails = {
        genre: d.genres?.length ? d.genres.map((g: any) => g.description).join(', ') : null,
        developer: d.developers?.length ? d.developers[0] : null,
        publisher: d.publishers?.length ? d.publishers[0] : null,
        releaseDate: d.release_date?.date ? parseSteamDate(d.release_date.date) : null,
      };
      steamDetailsCache.set(appId, result);
      return result;
    } catch (err: any) {
      const status = err?.response?.status;
      if ((status === 429 || status === 403) && attempt < MAX_RETRIES - 1) {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
        continue;
      }
      steamDetailsCache.set(appId, null);
      return null;
    }
  }
  steamDetailsCache.set(appId, null);
  return null;
}

function parseSteamDate(dateStr: string): Date | null {
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export async function fetchSteamAppDetailsBatch(
  appIds: string[],
  onProgress?: (done: number, total: number) => void
): Promise<Map<string, SteamAppDetails>> {
  const details = new Map<string, SteamAppDetails>();
  const CONCURRENCY = 5;
  const BATCH_DELAY_MS = 300;
  let completed = 0;

  for (let i = 0; i < appIds.length; i += CONCURRENCY) {
    const batch = appIds.slice(i, i + CONCURRENCY);
    const promises = batch.map((appId) =>
      fetchSteamAppDetails(appId).then((meta) => {
        if (meta) details.set(appId, meta);
      })
    );
    await Promise.allSettled(promises);
    completed += batch.length;
    onProgress?.(completed, appIds.length);
    if (i + CONCURRENCY < appIds.length) {
      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
    }
  }

  return details;
}

async function fetchSteamGames(steamId: string) {
  const apiKey = getSteamApiKey();
  if (!apiKey) throw new Error('Steam API key not configured');
  const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${apiKey}&steamid=${steamId}&include_appinfo=true&include_played_free_games=true&format=json`;
  const response = await axios.get(url, { timeout: 30000 });
  if (!response.data?.response) {
    throw new Error('Invalid Steam API response: missing response object');
  }
  return response.data.response.games || [];
}

export async function syncSteamLibrary(
  steamId: string,
  onProgress?: (current: number, total: number, message: string) => void
) {
  const db = getDatabase();
  const profile = await db.profile.findFirst();
  if (!profile) throw new Error('No profile found');

  const apiKey = getSteamApiKey();
  if (!apiKey) {
    return { success: false, message: 'Steam API key not configured. Set it in Settings > Steam Integration.', imported: 0, updated: 0, errors: 1 };
  }

  try {
    onProgress?.(0, 0, 'Fetching Steam profile...');
    const userData = await fetchSteamUserData(steamId);
    if (userData) {
      await db.profile.update({
        where: { id: profile.id },
        data: {
          steamId,
          steamUsername: userData.username,
          steamAvatar: userData.avatar,
          steamData: JSON.stringify(userData),
          steamLastSync: new Date(),
        },
      });
    }

    onProgress?.(0, 0, 'Fetching Steam library...');
    const steamGames = await fetchSteamGames(steamId);
    const total = steamGames.length;

    if (total === 0) {
      onProgress?.(1, 1, 'No games found in Steam library');
      await db.syncLog.create({
        data: {
          action: 'steam_sync',
          source: 'steam',
          status: 'success',
          message: 'No games found in Steam library',
          details: JSON.stringify({ imported: 0, updated: 0, errors: 0, total: 0 }),
        },
      });
      return { success: true, message: 'Steam library is empty — no games found', imported: 0, updated: 0, errors: 0 };
    }

    let imported = 0;
    let updated = 0;
    let errors = 0;

    // Batch query existing games once instead of findFirst per game
    const allAppIds = steamGames.map((g: any) => g.appid.toString());
    const existingGames = await db.game.findMany({
      where: { steamAppId: { in: allAppIds } },
      select: { id: true, steamAppId: true, hoursPlayed: true, status: true, coverArt: true, genre: true, developer: true, publisher: true, releaseDate: true },
    });
    const existingMap = new Map(existingGames.map(g => [g.steamAppId, g]));

    onProgress?.(0, total, 'Fetching game metadata from Steam store...');
    const metadataMap = await fetchSteamAppDetailsBatch(allAppIds, (done, totalApps) => {
      onProgress?.(done, total, `Fetching metadata (${done}/${totalApps})...`);
    });

    for (let i = 0; i < total; i++) {
      const game = steamGames[i];
      onProgress?.(i + 1, total, `Processing: ${game.name || `App ${game.appid}`}`);

      try {
        const playtimeHours = (game.playtime_forever || 0) / 60;
        const status = GameStatus.BACKLOG;
        const steamAppId = game.appid.toString();
        const existing = existingMap.get(steamAppId);
        const meta = metadataMap.get(steamAppId);

        if (!existing) {
          const slug = `${game.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${game.appid}`;

          await db.game.create({
            data: {
              title: game.name,
              slug,
              coverArt: `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/header.jpg`,
              banner: `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/library_hero.jpg`,
              platform: 'Steam',
              steamAppId,
              steamData: JSON.stringify(game),
              hoursPlayed: playtimeHours,
              status,
              importedFromSteam: true,
              lastPlayed: game.rtime_last_played ? new Date(game.rtime_last_played * 1000) : undefined,
              profileId: profile.id,
              genre: meta?.genre ?? null,
              developer: meta?.developer ?? null,
              publisher: meta?.publisher ?? null,
              releaseDate: meta?.releaseDate ?? null,
            },
          });
          imported++;
        } else {
          const updateData: any = {
            title: game.name,
            hoursPlayed: playtimeHours,
            steamData: JSON.stringify(game),
          };

          if (!existing.coverArt) {
            updateData.coverArt = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/header.jpg`;
          }

          if (game.rtime_last_played) {
            updateData.lastPlayed = new Date(game.rtime_last_played * 1000);
          }

          if (meta) {
            if (!existing.genre) updateData.genre = meta.genre;
            if (!existing.developer) updateData.developer = meta.developer;
            if (!existing.publisher) updateData.publisher = meta.publisher;
            if (!existing.releaseDate) updateData.releaseDate = meta.releaseDate;
          }

          await db.game.update({
            where: { id: existing.id },
            data: updateData,
          });
          updated++;
        }
      } catch (err) {
        console.error(`Failed to import game ${game.appid} (${game.name}):`, err);
        errors++;
      }
    }

    await db.syncLog.create({
      data: {
        action: 'steam_sync',
        source: 'steam',
        status: 'success',
        message: `Imported ${imported}, updated ${updated}, errors ${errors}`,
        details: JSON.stringify({ imported, updated, errors, total }),
      },
    });

    if (imported > 0) {
      await createActivity('steam_import', {
        description: `Imported ${imported} Steam games`,
        metadata: { count: imported, updated },
      }).catch(() => {});
    }

    onProgress?.(total, total, `Complete — ${imported} new, ${updated} updated`);

    return { success: true, message: `Imported ${imported} new games, updated ${updated}`, imported, updated, errors };
  } catch (error: any) {
    console.error('Steam sync failed:', error);
    onProgress?.(0, 0, `Sync failed: ${error.message}`);
    await db.syncLog.create({
      data: {
        action: 'steam_sync',
        source: 'steam',
        status: 'error',
        message: error.message,
        details: JSON.stringify({ stack: error.stack }),
      },
    });
    return { success: false, message: error.message, imported: 0, updated: 0, errors: 1 };
  }
}
