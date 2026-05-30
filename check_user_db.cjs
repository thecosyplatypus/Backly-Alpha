const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: { db: { url: 'file:C:/Users/phoeb/AppData/Roaming/Backly/backly.db' } }
});
(async () => {
  const profiles = await prisma.profile.findMany();
  console.log('Profiles:', JSON.stringify(profiles.map(p => ({
    id: p.id, name: p.name, steamId: p.steamId,
    steamUsername: p.steamUsername, steamLastSync: p.steamLastSync
  }))));
  const games = await prisma.game.findMany({
    select: { id: true, title: true, steamAppId: true,
      totalAchievements: true, unlockedAchievements: true,
      completionPercentage: true, achievementsData: true }
  });
  console.log('Games count:', games.length);
  for (const g of games) {
    console.log('  ' + g.title + ' (' + g.steamAppId + '): total=' + g.totalAchievements + ' unlocked=' + g.unlockedAchievements + ' pct=' + g.completionPercentage);
  }
  const achCount = await prisma.achievement.count();
  console.log('Achievement count:', achCount);
  if (achCount > 0) {
    const unlocked = await prisma.achievement.count({ where: { unlocked: true } });
    console.log('Unlocked:', unlocked);
    const samples = await prisma.achievement.findMany({ take: 3 });
    for (const a of samples) {
      console.log('  ' + a.name + ': unlocked=' + a.unlocked + ' gameId=' + a.gameId);
    }
  } else {
    // Check if Achievement table exists
    const tables = await prisma.$queryRawUnsafe("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
    console.log('Tables:', tables);
  }
  await prisma.$disconnect();
})();
