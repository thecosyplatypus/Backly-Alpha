import { useEffect, useState } from 'react';
import { CapacitorHttp } from '@capacitor/core';
import { GameStatus } from '../../shared/types';
import { useGameStore } from '../store/gameStore';

export default function SteamImportCard() {
  const [apiKey, setApiKey] = useState('');
  const [steamId, setSteamId] = useState('');
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    window.backly.getSettings().then((settings: any) => {
      setApiKey(settings?.steamApiKey || '');
      setSteamId(settings?.steamId || '');
    }).catch(() => {});
  }, []);

  const importLibrary = async () => {
    if (!apiKey.trim() || !steamId.trim()) {
      setMessage('Enter both a Steam API key and a SteamID64.');
      return;
    }

    setImporting(true);
    setMessage('Fetching your Steam library...');
    try {
      await window.backly.updateSettings({
        steamApiKey: apiKey.trim(),
        steamId: steamId.trim(),
      });

      const response = await CapacitorHttp.get({
        url: 'https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/',
        params: {
          key: apiKey.trim(),
          steamid: steamId.trim(),
          include_appinfo: '1',
          include_played_free_games: '1',
          format: 'json',
        },
      });

      if (response.status !== 200) {
        throw new Error(`Steam returned HTTP ${response.status}`);
      }

      const games = response.data?.response?.games;
      if (!Array.isArray(games) || games.length === 0) {
        throw new Error('No games found. Make sure the Steam profile and game details are public.');
      }

      const existing = await window.backly.getGames({ limit: 100000 });
      const byAppId = new Map(
        (existing.games || [])
          .filter((game: any) => game.steamAppId)
          .map((game: any) => [String(game.steamAppId), game])
      );

      let imported = 0;
      let updated = 0;
      for (const game of games) {
        const appId = String(game.appid);
        const coverArt = `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/library_600x900.jpg`;
        const hoursPlayed = Math.round(((game.playtime_forever || 0) / 60) * 10) / 10;
        const existingGame = byAppId.get(appId);

        if (existingGame) {
          await window.backly.updateGame(existingGame.id, {
            hoursPlayed,
            coverArt: existingGame.coverArt || coverArt,
          });
          updated++;
        } else {
          await window.backly.createGame({
            title: game.name,
            steamAppId: appId,
            coverArt,
            platform: 'PC',
            status: GameStatus.BACKLOG,
            hoursPlayed,
          });
          imported++;
        }
      }

      await useGameStore.getState().fetchGames();
      await useGameStore.getState().fetchStats();
      setMessage(`Imported ${imported} new games and updated ${updated} existing games.`);
    } catch (err: any) {
      setMessage(err?.message || 'Steam import failed.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-gray-500 leading-relaxed">
        Import your public Steam library using a Steam Web API key. Your profile and game details must be public.
      </p>
      <label className="mobile-field">
        <span>Steam API key</span>
        <input
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="input w-full"
          placeholder="Paste your Steam Web API key"
        />
      </label>
      <label className="mobile-field">
        <span>SteamID64</span>
        <input
          value={steamId}
          onChange={(e) => setSteamId(e.target.value)}
          className="input w-full"
          placeholder="e.g. 76561198..."
          inputMode="numeric"
        />
      </label>
      <a
        href="https://steamcommunity.com/dev/apikey"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block text-[11px] text-backly-400 hover:text-backly-300"
      >
        Get a Steam API key
      </a>
      {message && (
        <div className="rounded-lg bg-surface-800/60 p-3 text-[11px] text-gray-300">
          {message}
        </div>
      )}
      <button
        type="button"
        onClick={importLibrary}
        disabled={importing}
        className="btn-primary w-full py-3 disabled:opacity-50"
      >
        {importing ? 'Importing...' : 'Import Steam library'}
      </button>
    </div>
  );
}
