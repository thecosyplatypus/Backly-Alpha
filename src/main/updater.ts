import { BrowserWindow, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';

export function setupUpdater(mainWindow: BrowserWindow | null): void {
  if (process.env.NODE_ENV === 'development') return;

  autoUpdater.logger = log;
  autoUpdater.autoDownload = false;

  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for updates...');
  });

  autoUpdater.on('update-available', (info) => {
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Available',
      message: `Backly ${info.version} is available.`,
      detail: 'Would you like to download the update?',
      buttons: ['Download', 'Later'],
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.downloadUpdate();
      }
    });
  });

  autoUpdater.on('update-not-available', () => {
    log.info('No updates available.');
  });

  autoUpdater.on('download-progress', (progress) => {
    mainWindow?.webContents.send('update-progress', progress.percent);
  });

  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Ready',
      message: 'Backly has been updated.',
      detail: 'Restart the app to apply the update.',
      buttons: ['Restart Now', 'Later'],
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });

  autoUpdater.on('error', (error) => {
    log.error('Update error:', error);
  });

  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err) => {
      log.error('Failed to check for updates:', err);
    });
  }, 5000);
}
