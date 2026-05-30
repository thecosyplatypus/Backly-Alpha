import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import prisma, { initializeDatabase } from '../database/database';

let mainWindow: BrowserWindow | null = null;

function getIconPath(): string | undefined {
  const iconPath = path.join(__dirname, '../../public/icon.png');
  return fs.existsSync(iconPath) ? iconPath : undefined;
}

async function saveWindowState() {
  if (!mainWindow) return;
  const state = {
    x: mainWindow.getBounds().x,
    y: mainWindow.getBounds().y,
    width: mainWindow.getBounds().width,
    height: mainWindow.getBounds().height,
    maximized: mainWindow.isMaximized(),
  };
  try {
    await prisma.userSetting.upsert({
      where: { key: 'window_state' },
      update: { value: JSON.stringify(state) },
      create: { key: 'window_state', value: JSON.stringify(state) },
    });
  } catch (err) {
    console.error('Failed to save window state:', err);
  }
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    title: 'Backly - Alpha',
    icon: getIconPath(),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    backgroundColor: '#111111',
    show: false,
  });

  mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('close', () => {
    saveWindowState();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function registerIpcHandlers() {
  ipcMain.handle('settings:get', async () => {
    try {
      const settings = await prisma.userSetting.findMany();
      const result: Record<string, string> = {};
      for (const s of settings) {
        result[s.key] = s.value;
      }
      return { success: true, settings: result };
    } catch (err) {
      console.error('Failed to get settings:', err);
      return { success: false, settings: {} };
    }
  });

  ipcMain.handle('settings:set', async (_event, settings: Record<string, string>) => {
    try {
      for (const [key, value] of Object.entries(settings)) {
        await prisma.userSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        });
      }
      return { success: true };
    } catch (err) {
      console.error('Failed to set settings:', err);
      return { success: false };
    }
  });

  ipcMain.handle('db:games', async () => {
    try {
      const games = await prisma.game.findMany({
        include: { userGames: true },
      });
      return { success: true, games };
    } catch (err) {
      console.error('Failed to get games:', err);
      return { success: false, games: [] };
    }
  });

  ipcMain.handle('db:add', async (_event, gameData: any) => {
    try {
      const game = await prisma.game.create({
        data: gameData,
      });
      return { success: true, id: game.id };
    } catch (err) {
      console.error('Failed to add game:', err);
      return { success: false, id: 0 };
    }
  });

  ipcMain.handle('steam:authenticate', async () => {
    try {
      const setting = await prisma.userSetting.findUnique({
        where: { key: 'steam_api_key' },
      });
      if (!setting?.value) {
        return { success: false, error: 'No Steam API key configured' };
      }
      return { success: true, message: 'API key found' };
    } catch (err) {
      console.error('Steam authenticate error:', err);
      return { success: false, error: 'Authentication failed' };
    }
  });

  ipcMain.handle('steam:library', async () => {
    return { success: false, error: 'Not implemented' };
  });

  ipcMain.handle('steam:achievements', async (_event, gameId: string) => {
    return { success: false, error: 'Not implemented' };
  });

  ipcMain.handle('rawg:enrich', async (_event, gameId: string) => {
    return { success: false, error: 'Not implemented' };
  });

  ipcMain.handle('completion:refresh', async () => {
    return { success: true };
  });

  ipcMain.handle('wheel:spin', async () => {
    try {
      const games = await prisma.game.findMany();
      const shuffled = [...games].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, 5);
      return { success: true, result: selected };
    } catch (err) {
      console.error('Wheel spin error:', err);
      return { success: false, result: [] };
    }
  });

  ipcMain.handle('activity:get', async () => {
    try {
      const activities = await prisma.activity.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      return { success: true, activities };
    } catch (err) {
      console.error('Failed to get activities:', err);
      return { success: false, activities: [] };
    }
  });

  ipcMain.handle('user:profile', async () => {
    try {
      const user = await prisma.user.findFirst();
      return { success: true, user };
    } catch (err) {
      console.error('Failed to get user profile:', err);
      return { success: false, user: null };
    }
  });

  ipcMain.handle('window:getState', async () => {
    try {
      const setting = await prisma.userSetting.findUnique({
        where: { key: 'window_state' },
      });
      return setting ? JSON.parse(setting.value) : {};
    } catch (err) {
      console.error('Failed to get window state:', err);
      return {};
    }
  });

  ipcMain.handle('window:setState', async (_event, state: any) => {
    try {
      await prisma.userSetting.upsert({
        where: { key: 'window_state' },
        update: { value: JSON.stringify(state) },
        create: { key: 'window_state', value: JSON.stringify(state) },
      });
      return { success: true };
    } catch (err) {
      console.error('Failed to set window state:', err);
      return { success: false };
    }
  });
}

app.whenReady().then(async () => {
  try {
    await initializeDatabase();
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Failed to initialize database:', err);
    dialog.showErrorBox(
      'Database Error',
      'Failed to initialize the database. The application may not work correctly.'
    );
  }

  registerIpcHandlers();
  console.log('Backly - Alpha Production Build');
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async () => {
  await prisma.$disconnect();
});
