import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  steam: {
    authenticate: () => ipcRenderer.invoke('steam:authenticate'),
    library: () => ipcRenderer.invoke('steam:library'),
    achievements: (gameId: string) => ipcRenderer.invoke('steam:achievements', gameId),
  },
  rawg: {
    enrich: (gameId: string) => ipcRenderer.invoke('rawg:enrich', gameId),
  },
  db: {
    games: () => ipcRenderer.invoke('db:games'),
    add: (gameData: any) => ipcRenderer.invoke('db:add', gameData),
  },
  completion: {
    refresh: () => ipcRenderer.invoke('completion:refresh'),
  },
  wheel: {
    spin: () => ipcRenderer.invoke('wheel:spin'),
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    set: (settings: any) => ipcRenderer.invoke('settings:set', settings),
  },
  activity: {
    get: () => ipcRenderer.invoke('activity:get'),
  },
  user: {
    profile: () => ipcRenderer.invoke('user:profile'),
  },
  window: {
    getState: () => ipcRenderer.invoke('window:getState'),
    setState: (state: any) => ipcRenderer.invoke('window:setState', state),
  },
  env: {
    NODE_ENV: process.env.NODE_ENV || 'production',
    VERSION: process.env.npm_package_version || '1.0.0-alpha',
  },
});
