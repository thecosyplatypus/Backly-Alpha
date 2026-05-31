import { PrismaClient } from '@prisma/client';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';

const fsp = fs.promises;

let prisma: PrismaClient | null = null;

const MIGRATIONS_TABLE = '_migrations';

const REQUIRED_MIGRATIONS = [
  'v1.1.0_achievement_columns',
  'v1.1.0_achievement_table',
  'v1.2.0_achievement_col_fix',
] as const;

function getDbPath(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL.replace('file:', '');
  }
  return path.join(app.getPath('userData'), 'backly.db');
}

async function copyBundledDb(targetPath: string): Promise<void> {
  try {
    const isDev = !app.isPackaged;
    let sourcePath: string | null = null;

    if (isDev) {
      sourcePath = path.join(__dirname, '../../../prisma/backly.db');
    } else {
      const resourcePath = process.resourcesPath || path.join(process.execPath, '..');
      sourcePath = path.join(resourcePath, 'database', 'backly.db');
    }

    if (sourcePath) {
      try {
        await fsp.access(sourcePath);
        const dir = path.dirname(targetPath);
        await fsp.mkdir(dir, { recursive: true });
        await fsp.copyFile(sourcePath, targetPath);
        console.log('Copied bundled database to:', targetPath);
      } catch {
        console.warn('Bundled database not found at:', sourcePath);
      }
    }
  } catch (error) {
    console.error('Failed to copy bundled database:', error);
  }
}

async function ensureDatabase(dbPath: string): Promise<void> {
  try {
    await fsp.access(dbPath);
  } catch {
    console.log('Database not found at:', dbPath);
    await copyBundledDb(dbPath);
  }
}

async function ensureMigrationsTable(): Promise<void> {
  if (!prisma) return;
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "${MIGRATIONS_TABLE}" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "applied_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function getAppliedMigrations(): Promise<Set<string>> {
  if (!prisma) return new Set();
  try {
    const rows: { id: string }[] =
      await prisma.$queryRawUnsafe(`SELECT "id" FROM "${MIGRATIONS_TABLE}"`);
    return new Set(rows.map((r: any) => r.id));
  } catch {
    return new Set();
  }
}

async function markMigrationApplied(id: string): Promise<void> {
  if (!prisma) return;
  try {
    await prisma.$executeRawUnsafe(
      `INSERT OR IGNORE INTO "${MIGRATIONS_TABLE}" ("id") VALUES (?)`,
      id
    );
  } catch {
    // ignore — migration may already be tracked
  }
}

async function runMigration(prisma: PrismaClient, id: string, fn: () => Promise<void>): Promise<void> {
  const applied = await getAppliedMigrations();
  if (applied.has(id)) return;
  console.log(`Running migration: ${id}`);
  await fn();
  await markMigrationApplied(id);
}

async function ensureColumn(prisma: PrismaClient, table: string, name: string, type: string, def: string, notNull = false): Promise<void> {
  try {
    const constraint = notNull ? ` NOT NULL DEFAULT ${def}` : ` DEFAULT ${def}`;
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "${table}" ADD COLUMN "${name}" ${type}${constraint}`
    );
    console.log(`Added column ${table}.${name}`);
  } catch (err: any) {
    if (!err?.message?.toLowerCase().includes('duplicate column')) {
      console.warn(`Migration warning for ${table}.${name}:`, err?.message);
    }
  }
}

async function runMigrations(prisma: PrismaClient): Promise<void> {
  await ensureMigrationsTable();

  await runMigration(prisma, 'v1.1.0_achievement_columns', async () => {
    const gameColumns: { name: string; type: string; default: string }[] = [
      { name: 'totalAchievements', type: 'INTEGER', default: '0' },
      { name: 'unlockedAchievements', type: 'INTEGER', default: '0' },
      { name: 'completionPercentage', type: 'REAL', default: '0' },
    ];
    for (const col of gameColumns) {
      await ensureColumn(prisma, 'Game', col.name, col.type, col.default);
    }
  });

  await runMigration(prisma, 'v1.1.0_achievement_table', async () => {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Achievement" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "apiName" TEXT,
        "description" TEXT,
        "iconUrl" TEXT,
        "iconGrayUrl" TEXT,
        "unlocked" BOOLEAN NOT NULL DEFAULT false,
        "unlockedAt" DATETIME,
        "globalProgress" REAL,
        "gameId" TEXT NOT NULL,
        CONSTRAINT "Achievement_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);
    const indices = [
      'CREATE UNIQUE INDEX IF NOT EXISTS "Achievement_gameId_name_key" ON "Achievement"("gameId", "name")',
      'CREATE INDEX IF NOT EXISTS "Achievement_gameId_idx" ON "Achievement"("gameId")',
      'CREATE INDEX IF NOT EXISTS "Achievement_unlocked_idx" ON "Achievement"("unlocked")',
    ];
    for (const idx of indices) {
      try { await prisma.$executeRawUnsafe(idx); } catch { /* ignore */ }
    }
  });

  await runMigration(prisma, 'v1.2.0_achievement_col_fix', async () => {
    await ensureColumn(prisma, 'Achievement', 'apiName', 'TEXT', "''", true);
    await ensureColumn(prisma, 'Achievement', 'globalProgress', 'REAL', '0', true);
    await ensureColumn(prisma, 'Achievement', 'iconGrayUrl', 'TEXT', 'NULL', false);
  });
}

export async function initDatabase(): Promise<PrismaClient> {
  if (prisma) return prisma;

  const dbPath = getDbPath();
  await ensureDatabase(dbPath);

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
