import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const dbDir = path.join(__dirname, '..', '..', 'prisma');
const dbPath = path.join(dbDir, 'dev.db');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

process.env.DATABASE_URL = `file:${dbPath}`;

const prisma = new PrismaClient();

export async function initializeDatabase() {
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      await prisma.user.create({
        data: {
          id: 1,
          username: 'Guest',
          email: 'guest@example.com',
        },
      });

      const defaults = [
        { key: 'window_state', value: '{}' },
        { key: 'app_theme', value: 'dark' },
        { key: 'app_color_scheme', value: 'gold' },
        { key: 'app_language', value: 'en-US' },
        { key: 'steam_connected', value: 'false' },
        { key: 'last_sync', value: '' },
      ];

      for (const setting of defaults) {
        await prisma.userSetting.upsert({
          where: { key: setting.key },
          update: {},
          create: setting,
        });
      }
    }
  } catch (err) {
    console.error('Database initialization error:', err);
    throw err;
  }
}

export default prisma;
