const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: { db: { url: 'file:C:/Users/phoeb/AppData/Local/Temp/opencode/user_backly.db' } }
});
(async () => {
  try {
    const profiles = await prisma.profile.findMany();
    console.log('Profiles:', JSON.stringify(profiles, null, 2));
    const games = await prisma.game.findMany({
      select: { id: true, title: true, steamAppId: true, totalAchievements: true, unlockedAchievements: true, achievementsData: true }
    });
    console.log('Games:', JSON.stringify(games, null, 2));
    const achievements = await prisma.achievement.findMany();
    console.log('Achievements count:', achievements.length);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
})();
