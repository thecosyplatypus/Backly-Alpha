"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = initializeDatabase;
const client_1 = require("@prisma/client");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const dbDir = path_1.default.join(__dirname, '..', '..', 'prisma');
const dbPath = path_1.default.join(dbDir, 'dev.db');
if (!fs_1.default.existsSync(dbDir)) {
    fs_1.default.mkdirSync(dbDir, { recursive: true });
}
process.env.DATABASE_URL = `file:${dbPath}`;
const prisma = new client_1.PrismaClient();
async function initializeDatabase() {
    try {
        const userCount = await prisma.user.count();
        if (userCount === 0) {
            await prisma.user.create({
                data: {
                    id: 1,
                    username: 'Guest',
                    email: 'guest@example.com',
                },
            });
            const defaults = [
                { key: 'window_state', value: '{}' },
                { key: 'app_theme', value: 'dark' },
                { key: 'app_color_scheme', value: 'gold' },
                { key: 'app_language', value: 'en-US' },
                { key: 'steam_connected', value: 'false' },
                { key: 'last_sync', value: '' },
            ];
            for (const setting of defaults) {
                await prisma.userSetting.upsert({
                    where: { key: setting.key },
                    update: {},
                    create: setting,
                });
            }
        }
    }
    catch (err) {
        console.error('Database initialization error:', err);
        throw err;
    }
}
exports.default = prisma;
//# sourceMappingURL=database.js.map