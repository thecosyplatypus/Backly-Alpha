# Backly

**Premium Personal Gaming Backlog Tracker**

Backly is a modern desktop application that helps you organize, track, and complete your video game collection. Built with Electron, React, TypeScript, and SQLite.

## Features

- **Steam Integration** — Import your entire Steam library, sync playtime, achievements
- **HowLongToBeat Integration** — Estimated completion times for every game
- **Smart Backlog Management** — Automatic status detection, insights, and cleanup suggestions
- **Rich Dashboard** — Progress rings, statistics, completion tracking
- **Game Library** — Search, filter, sort, rate, tag, and organize your games
- **Smart Recommendations** — "What should I play?" randomizer, curated suggestions
- **Desktop Features** — System tray, native notifications, keyboard shortcuts
- **Cross-Platform** — Windows, macOS, Linux

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Recharts, Zustand
- **Desktop**: Electron 33, Electron Builder
- **Backend**: Node.js, Prisma ORM, SQLite (better-sqlite3)
- **Integrations**: Steam API, HowLongToBeat API

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
git clone https://github.com/backly/backly.git
cd backly
npm install
```

### Configuration

Copy `.env.example` to `.env` and add your Steam API key:

```env
STEAM_API_KEY=your_steam_api_key_here
```

Get a Steam API key at https://steamcommunity.com/dev/apikey

### Development

```bash
# Run both main process and renderer
npm run dev

# Or run separately:
npm run dev:main   # TypeScript watch for electron main
npm run dev:renderer  # Vite dev server for React
```

### Database Setup

```bash
# Push Prisma schema to SQLite
npm run db:push

# Seed with demo data (30 games)
npm run db:seed
```

### Build

```bash
# Build for current platform
npm run build
npm start

# Package for distribution
npm run dist:win    # Windows
npm run dist:mac    # macOS
npm run dist:linux  # Linux
```

## Project Structure

```
backly/
├── src/
│   ├── main/           # Electron main process
│   │   ├── index.ts    # App entry, window creation
│   │   ├── ipc.ts      # IPC handlers
│   │   ├── database.ts # Database initialization
│   │   ├── game-service.ts  # Business logic
│   │   ├── steam-auth.ts    # Steam OpenID + API
│   │   ├── hltb.ts         # HowLongToBeat search
│   │   ├── settings.ts     # User settings
│   │   ├── tray.ts         # System tray
│   │   ├── menu.ts         # Application menu
│   │   └── updater.ts      # Auto-updater
│   ├── preload/
│   │   └── index.ts   # Secure bridge
│   ├── renderer/      # React frontend
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/
│   │   └── styles/
│   └── shared/
│       └── types.ts
├── prisma/
│   └── schema.prisma
├── scripts/
│   └── seed.ts
└── package.json
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+1 | Dashboard |
| Ctrl+2 | Library |
| Ctrl+3 | Recommendations |
| Ctrl+, | Settings |

## License

MIT
