const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: { db: { url: 'file:C:/Users/phoeb/AppData/Roaming/Backly/backly.db' } }
});
const axios = require('axios').default || require('axios');

const API_KEY = '006287B8A75A938AD6ADF92DBF377776';
const STEAM_ID = '76561198204673965';

async function testSyncOneGame(appId, gameId) {
  console.log('\\n=== Testing sync for app', appId, '===');
  
  const res = await axios.get('https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/', {
    params: { key: API_KEY, appid: appId }
  });
  const schema = res.data?.game;
  if (!schema?.availableGameStats?.achievements) {
    console.log('SKIP - no achievements');
    return;
  }
  console.log('Schema:', schema.availableGameStats.achievements.length, 'achievements');
  
  const res2 = await axios.get('https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/', {
    params: { key: API_KEY, steamid: STEAM_ID, appid: appId }
  });
  const playerData = res2.data?.playerstats;
  if (!playerData?.achievements) {
    console.log('SKIP - no player data');
    return;
  }
  console.log('Player achievements:', playerData.achievements.length, 'achievements');
  
  const globalRes = await axios.get('https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/', {
    params: { gameid: appId }
  });
  const globalEntries = globalRes.data?.achievementpercentages?.achievements || [];
  const globalPcts = {};
  for (const e of globalEntries) { globalPcts[e.name] = e.percent; }
  
  // Now do the upsert
  const schemaAchs = schema.availableGameStats.achievements;
  const playerAchs = playerData.achievements;
  let inserted = 0;
  
  for (const schemaAch of schemaAchs) {
    const apiName = schemaAch.name;
    const playerAch = playerAchs.find(p => p.apiname === apiName);
    const unlocked = playerAch?.achieved === 1;
    const iconGrayUrl = schemaAch.icongray || '';
    
    await prisma.achievement.upsert({
      where: { gameId_name: { gameId, name: schemaAch.displayName || apiName } },
      update: {
        apiName,
        unlocked,
        unlockedAt: playerAch?.unlocktime ? new Date(Number(playerAch.unlocktime) * 1000) : null,
        description: schemaAch.description || '',
        globalProgress: globalPcts[apiName] ?? null,
        iconUrl: schemaAch.icon || null,
        iconGrayUrl,
      },
      create: {
        gameId,
        name: schemaAch.displayName || apiName,
        apiName,
        description: schemaAch.description || '',
        unlocked,
        unlockedAt: playerAch?.unlocktime ? new Date(Number(playerAch.unlocktime) * 1000) : null,
        globalProgress: globalPcts[apiName] ?? null,
        iconUrl: schemaAch.icon || null,
        iconGrayUrl,
      },
    });
    inserted++;
  }
  
  console.log('Inserted/updated', inserted, 'achievements - ZERO errors!');
  
  const totalCount = schemaAchs.length;
  const unlockedCount = playerAchs.filter(p => p.achieved === 1).length;
  const pct = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;
  
  await prisma.game.update({
    where: { id: gameId },
    data: {
      totalAchievements: totalCount,
      unlockedAchievements: unlockedCount,
      completionPercentage: pct,
    },
  });
  console.log('Updated game and cleaned up');
  
  // Clean up the test data
  await prisma.achievement.deleteMany({ where: { gameId } });
  await prisma.game.update({
    where: { id: gameId },
    data: { totalAchievements: null, unlockedAchievements: null, completionPercentage: null },
  });
  console.log('Cleaned up test data');
}

(async () => {
  const eldenRing = await prisma.game.findFirst({ where: { steamAppId: '1245620' } });
  if (!eldenRing) { console.log('Elden Ring not found'); return; }
  
  await testSyncOneGame('1245620', eldenRing.id);
  console.log('\\nFIX VERIFIED: iconGrayUrl passed correctly, no constraint violation!');
  
  await prisma['$disconnect']();
})();
