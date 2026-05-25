import { app, BrowserWindow, Menu, shell, dialog } from 'electron';

export function setupMenu(mainWindow: BrowserWindow | null): void {
  const isMac = process.platform === 'darwin';

  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'Backly',
      submenu: [
        {
          label: 'About Backly',
          click: () => {
            dialog.showMessageBox({
              type: 'info',
              title: 'About Backly',
              message: 'Backly v1.0.0',
              detail: 'Premium personal gaming backlog tracker.\nOrganize, track, and complete your video game collection.',
            });
          },
        },
        { type: 'separator' },
        ...(isMac ? [{ role: 'hide' as const }, { role: 'hideOthers' as const }, { role: 'unhide' as const }, { type: 'separator' as const }] : []),
        { role: 'quit' as const },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' as const },
        { role: 'redo' as const },
        { type: 'separator' },
        { role: 'cut' as const },
        { role: 'copy' as const },
        { role: 'paste' as const },
        { role: 'selectAll' as const },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' as const },
        { role: 'forceReload' as const },
        { role: 'toggleDevTools' as const },
        { type: 'separator' },
        { role: 'resetZoom' as const },
        { role: 'zoomIn' as const },
        { role: 'zoomOut' as const },
        { type: 'separator' },
        { role: 'togglefullscreen' as const },
      ],
    },
    {
      label: 'Navigate',
      submenu: [
        {
          label: 'Dashboard',
          accelerator: 'CmdOrCtrl+1',
          click: () => mainWindow?.webContents.send('navigate', '/'),
        },
        {
          label: 'Library',
          accelerator: 'CmdOrCtrl+2',
          click: () => mainWindow?.webContents.send('navigate', '/library'),
        },
        {
          label: 'Recommendations',
          accelerator: 'CmdOrCtrl+3',
          click: () => mainWindow?.webContents.send('navigate', '/recommendations'),
        },
        {
          label: 'Settings',
          accelerator: 'CmdOrCtrl+,',
          click: () => mainWindow?.webContents.send('navigate', '/settings'),
        },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: () => shell.openExternal('https://backly.app/docs'),
        },
        {
          label: 'Report Issue',
          click: () => shell.openExternal('https://github.com/backly/backly/issues'),
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
