const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    const profiles = await prisma.profile.findMany();
    console.log('Profiles:', JSON.stringify(profiles, null, 2));
    const games = await prisma.game.findMany({
      select: { id: true, title: true, steamAppId: true, totalAchievements: true, unlockedAchievements: true }
    });
    console.log('Games:', JSON.stringify(games, null, 2));
    const achievements = await prisma.achievement.count();
    console.log('Achievement count:', achievements);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
})();
