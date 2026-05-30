import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({
  datasources: { db: { url: 'file:./prisma/backly.db' } }
});
const profiles = await prisma.profile.findMany();
console.log('Profiles:', JSON.stringify(profiles, null, 2));
const games = await prisma.game.findMany({
  select: { id: true, title: true, steamAppId: true, totalAchievements: true, unlockedAchievements: true, completionPercentage: true }
});
console.log('Games:', JSON.stringify(games, null, 2));
const achCount = await prisma.achievement.count();
console.log('Achievement count:', achCount);
await prisma.$disconnect();
