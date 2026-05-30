import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: { db: { url: 'file:../prisma/backly.db' } },
});

const demoGames = [
  { title: 'Elden Ring', genre: 'Action RPG', developer: 'FromSoftware', platform: 'PC', hours: 87.5, status: 'STARTED', rating: 9, hltbMain: 56, isFavourite: true },
  { title: 'Baldur\'s Gate 3', genre: 'RPG', developer: 'Larian Studios', platform: 'PC', hours: 142.0, status: 'PLAYING', rating: 10, hltbMain: 80, isFavourite: true },
  { title: 'The Witcher 3', genre: 'RPG', developer: 'CD Projekt Red', platform: 'PC', hours: 0, status: 'BACKLOG', rating: 0, hltbMain: 52 },
  { title: 'Hades', genre: 'Roguelike', developer: 'Supergiant Games', platform: 'PC', hours: 45.0, status: 'COMPLETED', rating: 9, hltbMain: 22, isFavourite: true },
  { title: 'Portal 2', genre: 'Puzzle', developer: 'Valve', platform: 'PC', hours: 8.5, status: 'COMPLETED', rating: 9, hltbMain: 8 },
  { title: 'Cyberpunk 2077', genre: 'Action RPG', developer: 'CD Projekt Red', platform: 'PC', hours: 65.0, status: 'PLAYING', rating: 8, hltbMain: 30, isFavourite: true },
  { title: 'Red Dead Redemption 2', genre: 'Action-Adventure', developer: 'Rockstar Games', platform: 'PC', hours: 0, status: 'BACKLOG', rating: 0, hltbMain: 48 },
  { title: 'Dark Souls III', genre: 'Action RPG', developer: 'FromSoftware', platform: 'PC', hours: 72.0, status: 'COMPLETED', rating: 10, hltbMain: 32 },
  { title: 'Stardew Valley', genre: 'Simulation', developer: 'ConcernedApe', platform: 'PC', hours: 120.0, status: 'PAUSED', rating: 8, hltbMain: 52 },
  { title: 'Celeste', genre: 'Platformer', developer: 'Matt Makes Games', platform: 'PC', hours: 12.0, status: 'COMPLETED', rating: 8, hltbMain: 8 },
  { title: 'Hollow Knight', genre: 'Metroidvania', developer: 'Team Cherry', platform: 'PC', hours: 35.0, status: 'STARTED', rating: 9, hltbMain: 25, isFavourite: true },
  { title: 'Disco Elysium', genre: 'RPG', developer: 'ZA/UM', platform: 'PC', hours: 0, status: 'BACKLOG', rating: 0, hltbMain: 23 },
  { title: 'Half-Life 2', genre: 'FPS', developer: 'Valve', platform: 'PC', hours: 13.0, status: 'COMPLETED', rating: 9, hltbMain: 13 },
  { title: 'Doom Eternal', genre: 'FPS', developer: 'id Software', platform: 'PC', hours: 0, status: 'WISHLIST', rating: 0, hltbMain: 14 },
  { title: 'God of War (2018)', genre: 'Action-Adventure', developer: 'Santa Monica Studio', platform: 'PC', hours: 0, status: 'BACKLOG', rating: 0, hltbMain: 21 },
  { title: 'Resident Evil 4 Remake', genre: 'Survival Horror', developer: 'Capcom', platform: 'PC', hours: 18.0, status: 'COMPLETED', rating: 9, hltbMain: 16 },
  { title: 'Death Stranding', genre: 'Action', developer: 'Kojima Productions', platform: 'PC', hours: 3.5, status: 'DROPPED', rating: 6, hltbMain: 35 },
  { title: 'Horizon Zero Dawn', genre: 'Action RPG', developer: 'Guerrilla Games', platform: 'PC', hours: 0, status: 'BACKLOG', rating: 0, hltbMain: 29 },
  { title: 'Slay the Spire', genre: 'Roguelike', developer: 'Mega Crit Games', platform: 'PC', hours: 200.0, status: 'PLAYING', rating: 9, hltbMain: 15, isFavourite: true },
  { title: 'Outer Wilds', genre: 'Adventure', developer: 'Mobius Digital', platform: 'PC', hours: 0, status: 'BACKLOG', rating: 0, hltbMain: 16 },
  { title: 'Sekiro: Shadows Die Twice', genre: 'Action-Adventure', developer: 'FromSoftware', platform: 'PC', hours: 40.0, status: 'STARTED', rating: 9, hltbMain: 29 },
  { title: 'Persona 5 Royal', genre: 'RPG', developer: 'Atlus', platform: 'PC', hours: 0, status: 'BACKLOG', rating: 0, hltbMain: 102 },
  { title: 'Factorio', genre: 'Simulation', developer: 'Wube Software', platform: 'PC', hours: 300.0, status: 'PLAYING', rating: 10, hltbMain: 45, isFavourite: true },
  { title: 'Metro Exodus', genre: 'FPS', developer: '4A Games', platform: 'PC', hours: 15.0, status: 'STARTED', rating: 7, hltbMain: 16 },
  { title: 'Firewatch', genre: 'Adventure', developer: 'Campo Santo', platform: 'PC', hours: 4.0, status: 'COMPLETED', rating: 7, hltbMain: 4 },
  { title: 'It Takes Two', genre: 'Action-Adventure', developer: 'Hazelight', platform: 'PC', hours: 14.0, status: 'COMPLETED', rating: 9, hltbMain: 13 },
  { title: 'Undertale', genre: 'RPG', developer: 'tobyfox', platform: 'PC', hours: 7.0, status: 'COMPLETED', rating: 9, hltbMain: 7 },
  { title: 'Subnautica', genre: 'Adventure', developer: 'Unknown Worlds', platform: 'PC', hours: 28.0, status: 'PAUSED', rating: 8, hltbMain: 24 },
  { title: 'XCOM 2', genre: 'Strategy', developer: 'Firaxis Games', platform: 'PC', hours: 55.0, status: 'STARTED', rating: 8, hltbMain: 33 },
  { title: 'Dave the Diver', genre: 'Adventure', developer: 'MINTROCKET', platform: 'PC', hours: 0, status: 'WISHLIST', rating: 0, hltbMain: 12 },
];

async function seed() {
  console.log('Seeding database...');

  const profile = await prisma.profile.upsert({
    where: { id: 'default-profile' },
    update: {},
    create: {
      id: 'default-profile',
      name: 'Default',
    },
  });

  console.log(`Profile: ${profile.id}`);

  let created = 0;
  for (const game of demoGames) {
    const slug = game.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    await prisma.game.upsert({
      where: { slug },
      update: {},
      create: {
        title: game.title,
        slug,
        genre: game.genre,
        developer: game.developer,
        platform: game.platform,
        hoursPlayed: game.hours,
        status: game.status as any,
        userRating: game.rating || null,
        hltbMain: game.hltbMain,
        isFavourite: game.isFavourite || false,
        coverArt: `https://ui-avatars.com/api/?name=${encodeURIComponent(game.title)}&background=6366f1&color=fff&size=256`,
        profileId: profile.id,
      },
    });
    created++;
  }

  console.log(`Seeded ${created} games`);
  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
