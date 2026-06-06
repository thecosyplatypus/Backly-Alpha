# Backly-Alpha

A desktop app to track your video game backlog.

---

## Quick Start (Windows)

1. **Download** — Get the latest installer from the [releases page](https://github.com/thecosyplatypus/Backly-Alpha/releases/latest)
2. **Run** — Open `Backly Setup.exe` and follow the install prompts
3. **Launch** — Open Backly from your desktop shortcut or Start Menu

That's it. The app comes with a built-in database and works out of the box.

---

## Building from Source

Requires Node.js 18+.

```bash
git clone https://github.com/thecosyplatypus/Backly-Alpha.git
cd Backly-Alpha
npm install
npm run dev
```

### Optional — Add Steam API Key

Copy `.env.example` to `.env` and add your key from https://steamcommunity.com/dev/apikey:

```env
STEAM_API_KEY=your_key_here
```

---

## License

MIT
