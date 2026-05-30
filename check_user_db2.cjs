const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: { db: { url: 'file:C:/Users/phoeb/AppData/Roaming/Backly/backly.db' } }
});
(async () => {
  const profiles = await prisma.profile.findMany();
  console.log('=== PROFILES ===');
  for (const p of profiles) {
    console.log(JSON.stringify({ id: p.id, name: p.name, steamId: p.steamId, steamUsername: p.steamUsername, steamLastSync: p.steamLastSync }));
  }
  const sampleGames = await prisma.game.findMany({ take: 3, select: { id: true, title: true, steamAppId: true } });
  console.log('=== SAMPLE GAMES ===');
  for (const g of sampleGames) {
    console.log(JSON.stringify(g));
  }
  const achCount = await prisma.achievement.count();
  console.log('=== ACHIEVEMENTS ===');
  console.log('Count:', achCount);
  const gameCount = await prisma.game.count({
    where: { steamAppId: { not: null } }
  });
  console.log('Games with steamAppId:', gameCount);
  const totalGames = await prisma.game.count();
  console.log('Total games:', totalGames);
  const dbPath = 'C:/Users/phoeb/AppData/Roaming/Backly/backly.db';
  const fs = require('fs');
  console.log('DB file size:', fs.statSync(dbPath).size);
  await prisma['$disconnect']();
})().catch(e => { console.error(e); process.exit(1); });
