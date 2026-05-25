import { app, BrowserWindow, Menu, Tray, nativeImage } from 'electron';
import path from 'path';

let tray: Tray | null = null;

export function createTray(mainWindow: BrowserWindow | null): void {
  if (tray) return;

  const iconPath = path.join(__dirname, '../../../resources/icon.png');
  let icon: Electron.NativeImage;
  try {
    icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) {
      icon = nativeImage.createEmpty();
    }
  } catch {
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);
  tray.setToolTip('Backly - Gaming Backlog Tracker');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Backly',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Quick Lookup',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.webContents.send('quick-lookup');
        }
      },
    },
    {
      label: 'Random Game',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.webContents.send('random-game');
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        (app as any).isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

export function destroyTray(): void {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}
