import { app } from 'electron';
import * as fs from 'fs';
import path from 'path';

export let settingsCache: any = {
  theme: 'dark',
  sidebarCollapsed: false,
  autoSync: true,
  syncInterval: 30,
  notificationsEnabled: true,
  minimizeToTray: true,
  startOnBoot: false,
  language: 'en',
};

function getSettingsPath(): string {
  return path.join(app.getPath('userData'), 'settings.json');
}

export const settingsStore = {
  get(key: string): any {
    return key ? settingsCache[key] : settingsCache;
  },
  set(key: string, value: any): void {
    settingsCache[key] = value;
    saveSettings(settingsCache);
  },
};

export function loadSettings(): any {
  try {
    const settingsPath = getSettingsPath();
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf-8');
      settingsCache = { ...settingsCache, ...JSON.parse(data) };
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  return settingsCache;
}

export function saveSettings(settings: any): void {
  settingsCache = { ...settingsCache, ...settings };
  try {
    const settingsPath = getSettingsPath();
    const dir = path.dirname(settingsPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(settingsPath, JSON.stringify(settingsCache, null, 2));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

export function getSettings(): any {
  return loadSettings();
}

export function updateSettings(settings: any): any {
  saveSettings(settings);
  return settingsCache;
}
