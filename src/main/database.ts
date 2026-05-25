import { PrismaClient } from '@prisma/client';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';

let prisma: PrismaClient | null = null;

function getDbPath(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL.replace('file:', '');
  }
  return path.join(app.getPath('userData'), 'backly.db');
}

function copyBundledDb(targetPath: string): void {
  try {
    const isDev = !app.isPackaged;
    let sourcePath: string | null = null;

    if (isDev) {
      sourcePath = path.join(__dirname, '../../../prisma/backly.db');
    } else {
      // In production, the db is bundled in extraResources
      const resourcePath = process.resourcesPath || path.join(process.execPath, '..');
      sourcePath = path.join(resourcePath, 'database', 'backly.db');
    }

    if (sourcePath && fs.existsSync(sourcePath)) {
      const dir = path.dirname(targetPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.copyFileSync(sourcePath, targetPath);
      console.log('Copied bundled database to:', targetPath);
    } else {
      console.warn('Bundled database not found at:', sourcePath);
    }
  } catch (error) {
    console.error('Failed to copy bundled database:', error);
  }
}

function ensureDatabase(dbPath: string): void {
  if (!fs.existsSync(dbPath)) {
    console.log('Database not found at:', dbPath);
    copyBundledDb(dbPath);
  }
}

async function ensureColumn(prisma: PrismaClient, table: string, name: string, type: string, def: string): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "${table}" ADD COLUMN "${name}" ${type} NOT NULL DEFAULT ${def}`
    );
    console.log(`Added column ${table}.${name}`);
  } catch (err: any) {
    if (!err?.message?.toLowerCase().includes('duplicate column')) {
      console.warn(`Migration warning for ${table}.${name}:`, err?.message);
    }
  }
}

async function runMigrations(prisma: PrismaClient): Promise<void> {
  // v1.1.0: Add achievement completion columns to Game
  const gameColumns: { name: string; type: string; default: string }[] = [
    { name: 'totalAchievements', type: 'INTEGER', default: '0' },
    { name: 'unlockedAchievements', type: 'INTEGER', default: '0' },
    { name: 'completionPercentage', type: 'REAL', default: '0' },
  ];
  for (const col of gameColumns) {
    await ensureColumn(prisma, 'Game', col.name, col.type, col.default);
  }

  // v1.1.0: Create Achievement table (missing in older bundled DBs)
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Achievement" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "apiName" TEXT,
        "description" TEXT,
        "iconUrl" TEXT,
        "unlocked" BOOLEAN NOT NULL DEFAULT false,
        "unlockedAt" DATETIME,
        "globalProgress" REAL,
        "gameId" TEXT NOT NULL,
        CONSTRAINT "Achievement_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);
    // Create indices and unique constraint (ignored if already exist)
    const indices = [
      'CREATE UNIQUE INDEX IF NOT EXISTS "Achievement_gameId_name_key" ON "Achievement"("gameId", "name")',
      'CREATE INDEX IF NOT EXISTS "Achievement_gameId_idx" ON "Achievement"("gameId")',
      'CREATE INDEX IF NOT EXISTS "Achievement_unlocked_idx" ON "Achievement"("unlocked")',
    ];
    for (const idx of indices) {
      try { await prisma.$executeRawUnsafe(idx); } catch { /* ignore */ }
    }
    console.log('Ensured Achievement table exists');
  } catch (err: any) {
    console.warn('Migration warning for Achievement table:', err?.message);
  }

  // v1.2.0: Add apiName and globalProgress columns to Achievement if missing
  const achColumns: { name: string; type: string; default: string }[] = [
    { name: 'apiName', type: 'TEXT', default: "''" },
    { name: 'globalProgress', type: 'REAL', default: '0' },
  ];
  for (const col of achColumns) {
    await ensureColumn(prisma, 'Achievement', col.name, col.type, col.default);
  }

  // v1.2.1: Create Activity table (missing in older bundled DBs)
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Activity" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "type" TEXT NOT NULL,
        "gameId" TEXT,
        "gameTitle" TEXT,
        "icon" TEXT NOT NULL DEFAULT 'default',
        "description" TEXT NOT NULL,
        "metadata" TEXT,
        "profileId" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    const activityIndices = [
      'CREATE INDEX IF NOT EXISTS "Activity_profileId_idx" ON "Activity"("profileId")',
      'CREATE INDEX IF NOT EXISTS "Activity_createdAt_idx" ON "Activity"("createdAt")',
      'CREATE INDEX IF NOT EXISTS "Activity_type_idx" ON "Activity"("type")',
    ];
    for (const idx of activityIndices) {
      try { await prisma.$executeRawUnsafe(idx); } catch { /* ignore */ }
    }
    console.log('Ensured Activity table exists');
  } catch (err: any) {
    console.warn('Migration warning for Activity table:', err?.message);
  }
}

export async function initDatabase(): Promise<PrismaClient> {
  if (prisma) return prisma;

  const dbPath = getDbPath();
  ensureDatabase(dbPath);

  process.env.DATABASE_URL = `file:${dbPath}`;

  prisma = new PrismaClient();

  try {
    await prisma.$connect();
    console.log('Database connected:', dbPath);

    // Run schema migrations for columns added after initial release
    await runMigrations(prisma);

    const profileCount = await prisma.profile.count();
    if (profileCount === 0) {
      await prisma.profile.create({
        data: {
          name: 'Default',
        },
      });
      console.log('Default profile created');
    }
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }

  return prisma;
}

export function getDatabase(): PrismaClient {
  if (!prisma) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return prisma;
}

export async function closeDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}
