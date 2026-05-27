# Backly - Alpha Production Build

Version **1.0.0-alpha**

## Features
- Clean blank installation with empty database
- Production-ready Electron shell
- NSIS installer + portable builds
- Steam API integration ready
- RAWG API game discovery ready

## Configuration

Copy `.env.example` to `.env` and set your API keys:

```
STEAM_API_KEY=your_steam_api_key_here
RAWG_API_KEY=your_rawg_api_key_here
```

- Steam API key: https://steamcommunity.com/dev/apikey
- RAWG API key: https://rawg.io/register

## Build

```bash
# Install dependencies
npm install

# Package for distribution
npm run package

# Portable version only
npm run package:portable
```

Output lands in `release/`:
- `Backly-1.0.0-alpha-x64.exe` — NSIS installer
- `Backly-1.0.0-alpha-Portable-x64.exe` — standalone portable

## Requirements
- Windows 10/11 (64-bit)
- 2GB RAM
- 100MB disk space
