const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: { db: { url: 'file:C:/Users/phoeb/AppData/Roaming/Backly/backly.db' } }
});
const axios = require('axios').default || require('axios');

const API_KEY = '006287B8A75A938AD6ADF92DBF377776';
const STEAM_ID = '76561198204673965';

async function testSyncOneGame(appId, gameId) {
  console.log('\\n=== Testing sync for app', appId, '===');
  
  // Step 1: Get schema
  let schema;
  try {
    const res = await axios.get('https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/', {
      params: { key: API_KEY, appid: appId }
    });
    schema = res.data?.game;
    console.log('Schema:', schema?.availableGameStats?.achievements ? schema.availableGameStats.achievements.length + ' achievements' : 'no achievements');
  } catch (e) {
    console.log('Schema error:', e.message);
  }
  
  if (!schema?.availableGameStats?.achievements) {
    console.log('SKIP - no achievements');
    return;
  }
  
  // Step 2: Get player achievements
  let playerData;
  try {
    const res = await axios.get('https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/', {
      params: { key: API_KEY, steamid: STEAM_ID, appid: appId }
    });
    playerData = res.data?.playerstats;
    console.log('Player achievements:', playerData?.achievements ? playerData.achievements.length + ' achievements, success=' + playerData.success : 'null/error');
  } catch (e) {
    console.log('Player achievements error:', e.message);
  }
  
  if (!playerData?.achievements) {
    console.log('SKIP - no player data');
    return;
  }
  
  // Step 3: Upsert achievements
  try {
    const schemaAchs = schema.availableGameStats.achievements;
    const playerAchs = playerData.achievements;
    let inserted = 0;
    
    for (const schemaAch of schemaAchs) {
      const apiName = schemaAch.name;
      const playerAch = playerAchs.find(p => p.apiname === apiName);
      const unlocked = playerAch?.achieved === 1;
      
      try {
        await prisma.achievement.upsert({
          where: { gameId_name: { gameId, name: schemaAch.displayName || apiName } },
          update: {
            apiName,
            unlocked,
            unlockedAt: playerAch?.unlocktime ? new Date(Number(playerAch.unlocktime) * 1000) : null,
            description: schemaAch.description || '',
          },
          create: {
            gameId,
            name: schemaAch.displayName || apiName,
            apiName,
            description: schemaAch.description || '',
            unlocked,
            unlockedAt: playerAch?.unlocktime ? new Date(Number(playerAch.unlocktime) * 1000) : null,
          },
        });
        inserted++;
      } catch (upsertErr) {
        console.log('UPSERT ERROR for', apiName, ':', upsertErr.message);
      }
    }
    
    console.log('Inserted/updated', inserted, 'achievements');
    
    // Step 4: Update game counts
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
    console.log('Updated game: total=' + totalCount + ' unlocked=' + unlockedCount + ' pct=' + pct);
    
  } catch (e) {
    console.log('Transaction error:', e.message);
    console.log(e.stack);
  }
}

(async () => {
  // Find Elden Ring in the user's database
  const eldenRing = await prisma.game.findFirst({ where: { steamAppId: '1245620' } });
  if (eldenRing) {
    console.log('Found Elden Ring:', JSON.stringify({ id: eldenRing.id, title: eldenRing.title, steamAppId: eldenRing.steamAppId }));
    await testSyncOneGame('1245620', eldenRing.id);
  } else {
    console.log('Elden Ring not found in DB');
  }
  
  // Verify achievement count
  const achCount = await prisma.achievement.count();
  console.log('\\nTotal achievements in DB now:', achCount);
  
  await prisma['$disconnect']();
})();
