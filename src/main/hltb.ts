import axios from 'axios';
import * as cheerio from 'cheerio';
import { getDatabase } from './database';

const HLTB_SEARCH_URL = 'https://howlongtobeat.com/api/search';
const HLTB_GAME_URL = 'https://howlongtobeat.com/game';

let hltbCookie: string | null = null;

function generateUserAgent(): string {
  return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
}

async function getHLTBSearchToken(): Promise<string | null> {
  try {
    const response = await axios.get('https://howlongtobeat.com/', {
      headers: {
        'User-Agent': generateUserAgent(),
      },
    });
    const cookies = response.headers['set-cookie'];
    if (cookies) {
      hltbCookie = cookies.join('; ');
    }
    return null;
  } catch {
    return null;
  }
}

export async function lookupHLTB(gameTitle: string): Promise<{
  gameId: number | null;
  name: string | null;
  mainStory: number | null;
  mainExtra: number | null;
  completionist: number | null;
  allStyles: number | null;
  url: string | null;
  imageUrl: string | null;
} | null> {
  try {
    await getHLTBSearchToken();

    const searchResponse = await axios.post(
      HLTB_SEARCH_URL,
      {
        searchType: 'games',
        searchTerms: gameTitle.split(' '),
        searchPage: 1,
        size: 5,
        searchOptions: {
          games: {
            userId: 0,
            platform: '',
            sortCategory: 'popular',
            rangeCategory: 'main',
            rangeTime: { min: 0, max: 0 },
            gameplay: { perspective: '', flow: '', genre: '' },
            modifier: '',
          },
          users: { sortCategory: 'postcount' },
          lists: { sortCategory: 'follows' },
          filter: '',
          sort: 0,
          randomizer: 0,
        },
        useCache: true,
      },
      {
        headers: {
          'User-Agent': generateUserAgent(),
          'Content-Type': 'application/json',
          'Referer': 'https://howlongtobeat.com/',
          ...(hltbCookie ? { Cookie: hltbCookie } : {}),
        },
      }
    );

    const data = searchResponse.data;
    if (!data?.data?.length) return null;

    const bestMatch = data.data[0];
    if (!bestMatch) return null;

    const mainStory = bestMatch.comp_main
      ? convertHLTBTime(bestMatch.comp_main)
      : null;
    const mainExtra = bestMatch.comp_plus
      ? convertHLTBTime(bestMatch.comp_plus)
      : null;
    const completionist = bestMatch.comp_100
      ? convertHLTBTime(bestMatch.comp_100)
      : null;
    const allStyles = bestMatch.comp_all
      ? convertHLTBTime(bestMatch.comp_all)
      : null;

    return {
      gameId: bestMatch.game_id,
      name: bestMatch.game_name,
      mainStory,
      mainExtra,
      completionist,
      allStyles,
      url: `${HLTB_GAME_URL}/${bestMatch.game_id}`,
      imageUrl: bestMatch.game_image
        ? `https://howlongtobeat.com/games/${bestMatch.game_image}`
        : null,
    };
  } catch (error) {
    console.error(`HLTB lookup failed for "${gameTitle}":`, error);
    return null;
  }
}

function convertHLTBTime(time: number): number {
  if (typeof time === 'number') {
    const hours = time / 3600;
    return Math.round(hours * 10) / 10;
  }
  return 0;
}

export async function syncGameHLTB(gameId: string): Promise<void> {
  const db = getDatabase();
  const game = await db.game.findUnique({ where: { id: gameId } });
  if (!game) return;

  const result = await lookupHLTB(game.title);
  if (result) {
    await db.game.update({
      where: { id: gameId },
      data: {
        hltbMain: result.mainStory,
        hltbMainExtra: result.mainExtra,
        hltbCompletionist: result.completionist,
        hltbData: JSON.stringify(result),
        hltbLastSync: new Date(),
      },
    });
  }
}

export async function batchSyncHLTB(): Promise<{ synced: number; failed: number }> {
  const db = getDatabase();
  const games = await db.game.findMany({
    where: {
      OR: [
        { hltbMain: null },
        {
          hltbLastSync: {
            lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      ],
    },
    take: 50,
  });

  let synced = 0;
  let failed = 0;

  for (const game of games) {
    try {
      await syncGameHLTB(game.id);
      synced++;
    } catch {
      failed++;
    }
  }

  return { synced, failed };
}
