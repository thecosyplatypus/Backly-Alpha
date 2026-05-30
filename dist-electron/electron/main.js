"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const database_1 = __importStar(require("../database/database"));
let mainWindow = null;
function getIconPath() {
    const iconPath = path_1.default.join(__dirname, '../../public/icon.png');
    return fs_1.default.existsSync(iconPath) ? iconPath : undefined;
}
async function saveWindowState() {
    if (!mainWindow)
        return;
    const state = {
        x: mainWindow.getBounds().x,
        y: mainWindow.getBounds().y,
        width: mainWindow.getBounds().width,
        height: mainWindow.getBounds().height,
        maximized: mainWindow.isMaximized(),
    };
    try {
        await database_1.default.userSetting.upsert({
            where: { key: 'window_state' },
            update: { value: JSON.stringify(state) },
            create: { key: 'window_state', value: JSON.stringify(state) },
        });
    }
    catch (err) {
        console.error('Failed to save window state:', err);
    }
}
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1600,
        height: 900,
        minWidth: 1200,
        minHeight: 700,
        title: 'Backly - Alpha',
        icon: getIconPath(),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path_1.default.join(__dirname, 'preload.js'),
        },
        backgroundColor: '#111111',
        show: false,
    });
    mainWindow.loadFile(path_1.default.join(__dirname, '../../dist/index.html'));
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
    electron_1.ipcMain.handle('settings:get', async () => {
        try {
            const settings = await database_1.default.userSetting.findMany();
            const result = {};
            for (const s of settings) {
                result[s.key] = s.value;
            }
            return { success: true, settings: result };
        }
        catch (err) {
            console.error('Failed to get settings:', err);
            return { success: false, settings: {} };
        }
    });
    electron_1.ipcMain.handle('settings:set', async (_event, settings) => {
        try {
            for (const [key, value] of Object.entries(settings)) {
                await database_1.default.userSetting.upsert({
                    where: { key },
                    update: { value },
                    create: { key, value },
                });
            }
            return { success: true };
        }
        catch (err) {
            console.error('Failed to set settings:', err);
            return { success: false };
        }
    });
    electron_1.ipcMain.handle('db:games', async () => {
        try {
            const games = await database_1.default.game.findMany({
                include: { userGames: true },
            });
            return { success: true, games };
        }
        catch (err) {
            console.error('Failed to get games:', err);
            return { success: false, games: [] };
        }
    });
    electron_1.ipcMain.handle('db:add', async (_event, gameData) => {
        try {
            const game = await database_1.default.game.create({
                data: gameData,
            });
            return { success: true, id: game.id };
        }
        catch (err) {
            console.error('Failed to add game:', err);
            return { success: false, id: 0 };
        }
    });
    electron_1.ipcMain.handle('steam:authenticate', async () => {
        try {
            const setting = await database_1.default.userSetting.findUnique({
                where: { key: 'steam_api_key' },
            });
            if (!setting?.value) {
                return { success: false, error: 'No Steam API key configured' };
            }
            return { success: true, message: 'API key found' };
        }
        catch (err) {
            console.error('Steam authenticate error:', err);
            return { success: false, error: 'Authentication failed' };
        }
    });
    electron_1.ipcMain.handle('steam:library', async () => {
        return { success: false, error: 'Not implemented' };
    });
    electron_1.ipcMain.handle('steam:achievements', async (_event, gameId) => {
        return { success: false, error: 'Not implemented' };
    });
    electron_1.ipcMain.handle('rawg:enrich', async (_event, gameId) => {
        return { success: false, error: 'Not implemented' };
    });
    electron_1.ipcMain.handle('completion:refresh', async () => {
        return { success: true };
    });
    electron_1.ipcMain.handle('wheel:spin', async () => {
        try {
            const games = await database_1.default.game.findMany();
            const shuffled = [...games].sort(() => Math.random() - 0.5);
            const selected = shuffled.slice(0, 5);
            return { success: true, result: selected };
        }
        catch (err) {
            console.error('Wheel spin error:', err);
            return { success: false, result: [] };
        }
    });
    electron_1.ipcMain.handle('activity:get', async () => {
        try {
            const activities = await database_1.default.activity.findMany({
                orderBy: { createdAt: 'desc' },
                take: 50,
            });
            return { success: true, activities };
        }
        catch (err) {
            console.error('Failed to get activities:', err);
            return { success: false, activities: [] };
        }
    });
    electron_1.ipcMain.handle('user:profile', async () => {
        try {
            const user = await database_1.default.user.findFirst();
            return { success: true, user };
        }
        catch (err) {
            console.error('Failed to get user profile:', err);
            return { success: false, user: null };
        }
    });
    electron_1.ipcMain.handle('window:getState', async () => {
        try {
            const setting = await database_1.default.userSetting.findUnique({
                where: { key: 'window_state' },
            });
            return setting ? JSON.parse(setting.value) : {};
        }
        catch (err) {
            console.error('Failed to get window state:', err);
            return {};
        }
    });
    electron_1.ipcMain.handle('window:setState', async (_event, state) => {
        try {
            await database_1.default.userSetting.upsert({
                where: { key: 'window_state' },
                update: { value: JSON.stringify(state) },
                create: { key: 'window_state', value: JSON.stringify(state) },
            });
            return { success: true };
        }
        catch (err) {
            console.error('Failed to set window state:', err);
            return { success: false };
        }
    });
}
electron_1.app.whenReady().then(async () => {
    try {
        await (0, database_1.initializeDatabase)();
        console.log('Database initialized successfully');
    }
    catch (err) {
        console.error('Failed to initialize database:', err);
        electron_1.dialog.showErrorBox('Database Error', 'Failed to initialize the database. The application may not work correctly.');
    }
    registerIpcHandlers();
    console.log('Backly - Alpha Production Build');
    createWindow();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('before-quit', async () => {
    await database_1.default.$disconnect();
});
//# sourceMappingURL=main.js.map