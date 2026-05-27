import { app, BrowserWindow } from 'electron';
import path from 'path';
import prisma, { initializeDatabase } from '../database/database';

let mainWindow: BrowserWindow | null = null;

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
    icon: path.join(__dirname, '../../public/icon.png'),
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

app.whenReady().then(async () => {
  await initializeDatabase();
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
