"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electron', {
    steam: {
        authenticate: () => electron_1.ipcRenderer.invoke('steam:authenticate'),
        library: () => electron_1.ipcRenderer.invoke('steam:library'),
        achievements: (gameId) => electron_1.ipcRenderer.invoke('steam:achievements', gameId),
    },
    rawg: {
        enrich: (gameId) => electron_1.ipcRenderer.invoke('rawg:enrich', gameId),
    },
    db: {
        games: () => electron_1.ipcRenderer.invoke('db:games'),
        add: (gameData) => electron_1.ipcRenderer.invoke('db:add', gameData),
    },
    completion: {
        refresh: () => electron_1.ipcRenderer.invoke('completion:refresh'),
    },
    wheel: {
        spin: () => electron_1.ipcRenderer.invoke('wheel:spin'),
    },
    settings: {
        get: () => electron_1.ipcRenderer.invoke('settings:get'),
        set: (settings) => electron_1.ipcRenderer.invoke('settings:set', settings),
    },
    activity: {
        get: () => electron_1.ipcRenderer.invoke('activity:get'),
    },
    user: {
        profile: () => electron_1.ipcRenderer.invoke('user:profile'),
    },
    window: {
        getState: () => electron_1.ipcRenderer.invoke('window:getState'),
        setState: (state) => electron_1.ipcRenderer.invoke('window:setState', state),
    },
    env: {
        NODE_ENV: process.env.NODE_ENV || 'production',
        VERSION: process.env.npm_package_version || '1.0.0-alpha',
    },
});
//# sourceMappingURL=preload.js.map