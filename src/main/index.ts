import dotenv from 'dotenv';

dotenv.config();

import { app, BrowserWindow, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import { setupIPC } from './ipc';
import { createTray } from './tray';
import { setupMenu } from './menu';
import { setupUpdater } from './updater';
import { initDatabase, getDatabase } from './database';
import { syncSteamLibrary } from './steam-auth';

if (!process.env.STEAM_API_KEY) {
  console.warn('WARNING: STEAM_API_KEY is not set in .env');
}
console.log('Steam key loaded:', !!process.env.STEAM_API_KEY);

const isDev = !app.isPackaged;
const builtRendererExists = fs.existsSync(path.join(__dirname, '../../renderer/index.html'));

let mainWindow: BrowserWindow | null = null;
let syncInterval: ReturnType<typeof setInterval> | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Backly',
    icon: path.join(__dirname, '../../../resources/icon.png'),
    backgroundColor: '#0a0c12',
    show: false,
    frame: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error(`Failed to load renderer: ${errorDescription} (${errorCode})`);
  });

  if (isDev && !builtRendererExists) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'));
  }

  mainWindow.on('close', (e) => {
    const settings = getSettings();
    if (settings?.minimizeToTray) {
      e.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

function getSettings() {
  try {
    const { settingsStore, settingsCache } = require('./settings');
    return settingsCache || settingsStore.get('settings');
  } catch {
    return null;
  }
}

async function performAutoSync() {
  try {
    const settings = getSettings();
    if (!settings?.autoSync) return;

    const db = getDatabase();
    const profile = await db.profile.findFirst();
    if (!profile?.steamId) return;

    const lastSync = profile.steamLastSync;
    const intervalMs = (settings.syncInterval || 30) * 60 * 1000;

    if (lastSync && (Date.now() - new Date(lastSync).getTime()) < intervalMs) {
      return;
    }

    console.log('Running auto-sync...');
    await syncSteamLibrary(profile.steamId, (current, total, message) => {
      mainWindow?.webContents.send('sync-progress', { current, total, message });
    });
    console.log('Auto-sync complete');
  } catch (err) {
    console.error('Auto-sync failed:', err);
  }
}

function startBackgroundSync() {
  const intervalMs = 30 * 60 * 1000;
  if (syncInterval) clearInterval(syncInterval);
  syncInterval = setInterval(performAutoSync, intervalMs);
}

app.whenReady().then(async () => {
  await initDatabase();

  // Fix cache permission errors on Windows
  const userDataPath = app.getPath('userData');
  app.setPath('cache', path.join(userDataPath, 'Cache'));

  createWindow();
  setupIPC(mainWindow);
  createTray(mainWindow);
  setupMenu(mainWindow);
  setupUpdater(mainWindow);

  setTimeout(() => {
    performAutoSync();
  }, 5000);

  startBackgroundSync();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (syncInterval) clearInterval(syncInterval);
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  if (syncInterval) clearInterval(syncInterval);
});

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});
