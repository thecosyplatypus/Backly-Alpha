import { useState, useEffect, useRef } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { useGameStore } from '../store/gameStore';
import { useActivityStore } from '../store/activityStore';
import SteamSyncCard from '../components/ui/SteamSyncCard';

function SteamIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 md:w-5 h-4 md:h-5" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12a4 4 0 118 0 4 4 0 01-8 0z" />
      <path d="M12 8v8" strokeWidth="2" />
      <path d="M8 12h8" strokeWidth="2" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 md:w-5 h-4 md:h-5" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function DataIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 md:w-5 h-4 md:h-5" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 md:w-5 h-4 md:h-5" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 md:w-5 h-4 md:h-5" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

function ConfirmModal({ open, onConfirm, onCancel, loading }: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [confirmText, setConfirmText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setConfirmText('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative glass-strong rounded-2xl border border-red-500/20 p-6 max-w-md w-full animate-scale-in shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
            <ResetIcon />
          </div>
          <h3 className="text-base font-bold text-white">Factory Reset</h3>
        </div>

        <div className="space-y-3 mb-5">
          <p className="text-sm text-gray-300 leading-relaxed">
            This will permanently <span className="text-red-400 font-semibold">delete all</span> of your data:
          </p>
          <ul className="space-y-1.5 text-sm text-gray-400">
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />
              All games and achievements
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />
              Activity history and sync logs
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />
              Steam connection and API key
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />
              All settings and preferences
            </li>
          </ul>
          <p className="text-sm text-gray-500">
            Type <span className="font-mono font-bold text-red-400">RESET</span> to confirm.
          </p>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="Type RESET to confirm"
          className="input w-full text-sm py-2.5 px-3 mb-4"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && confirmText === 'RESET') onConfirm();
            if (e.key === 'Escape') onCancel();
          }}
        />

        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 font-medium text-sm transition-all duration-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={confirmText !== 'RESET' || loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Resetting...
              </>
            ) : (
              'Delete Everything'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingsCard({ icon, title, children, className = '' }: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`glass-strong rounded-2xl border border-white/[0.05] transition-all duration-300 ${className}`}>
      <div className="px-4 md:px-6 py-3 md:py-4 border-b border-white/[0.04] flex items-center gap-2 md:gap-3">
        <div className="w-7 md:w-8 h-7 md:h-8 rounded-lg bg-gold-500/10 text-gold-400 flex items-center justify-center">
          {icon}
        </div>
        <h2 className="text-[11px] md:text-sm font-semibold text-white">{title}</h2>
      </div>
      <div className="p-4 md:p-6">
        {children}
      </div>
    </div>
  );
}

function ToggleSwitch({ checked, onChange }: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 md:h-6 w-9 md:w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/40 ${
        checked
          ? 'bg-gradient-to-r from-gold-600 to-gold-500 shadow-[0_0_12px_rgba(234,179,8,0.25)]'
          : 'bg-surface-700/60 hover:bg-surface-600/60'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 md:h-5 w-4 md:w-5 transform rounded-full bg-white shadow-lg ring-0 transition-all duration-300 ${
          checked ? 'translate-x-4 md:translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

function ToggleSetting({ label, description, checked, onChange }: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 md:py-3 px-3 md:px-4 rounded-xl hover:bg-white/[0.02] transition-colors duration-200">
      <div className="flex-1 min-w-0 pr-3 md:pr-4">
        <p className="text-[11px] md:text-sm font-medium text-gray-200">{label}</p>
        <p className="text-[9px] md:text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
      </div>
      <ToggleSwitch checked={checked} onChange={onChange} />
    </div>
  );
}

export default function Settings() {
  const { settings, updateSettings } = useSettingsStore();
  const [apiKeyInput, setApiKeyInput] = useState('');

  useEffect(() => {
    if (settings.steamApiKey) {
      setApiKeyInput(settings.steamApiKey);
    }
  }, [settings.steamApiKey]);

  const handleSaveApiKey = async () => {
    await updateSettings({ ...settings, steamApiKey: apiKeyInput });
  };

  const handleExport = async () => {
    const data = await window.backly.exportData('json');
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backly-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const text = await file.text();
      const result = await window.backly.importData(text);
      alert(`Imported ${result.imported} games`);
    };
    input.click();
  };

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleFactoryReset = async () => {
    setResetting(true);
    try {
      await window.backly.factoryReset();
      await useSettingsStore.getState().loadSteamStatus();
      await useGameStore.getState().fetchStats();
      await useGameStore.getState().fetchGames();
      await useGameStore.getState().fetchInsights();
      await useActivityStore.getState().fetchActivities();
      setShowResetModal(false);
    } catch (err) {
      console.error('Factory reset failed:', err);
    }
    setResetting(false);
  };

  return (
    <div className="min-h-full">
      <div className="max-w-xl md:max-w-2xl mx-auto py-6 md:py-8 px-3 md:px-6 space-y-4 md:space-y-6 resize-transition">
        <div className="mb-1 md:mb-2">
          <h1 className="text-fluid-lg md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-gray-400">
            Settings
          </h1>
          <p className="text-[11px] md:text-sm text-gray-500 mt-1 md:mt-1.5">
            Configure your Backly experience
          </p>
        </div>

        {/* Steam Integration */}
        <SettingsCard icon={<SteamIcon />} title="Steam Integration">
          <div className="mb-4 md:mb-5">
            <label className="text-[10px] md:text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5 md:mb-2 block">
              Steam Web API Key
            </label>
            <div className="flex items-center gap-1.5 md:gap-2">
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="Enter your Steam API key..."
                className="input flex-1 text-[11px] md:text-sm py-2 md:py-2.5"
              />
              <button
                onClick={handleSaveApiKey}
                disabled={!apiKeyInput || apiKeyInput === settings.steamApiKey}
                className="px-3 md:px-4 py-2 md:py-2.5 rounded-xl bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-black font-semibold text-[11px] md:text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
            <p className="text-[9px] md:text-xs text-gray-600 mt-1 md:mt-1.5">
              Get your key from{' '}
              <a
                href="https://steamcommunity.com/dev/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold-500 hover:text-gold-400 underline"
              >
                steamcommunity.com/dev/apikey
              </a>
            </p>
          </div>

          <SteamSyncCard />
        </SettingsCard>

        {/* General Settings */}
        <SettingsCard icon={<GearIcon />} title="General">
          <div className="divide-y divide-white/[0.04] -mx-4 md:-mx-6">
            <div className="px-4 md:px-6">
              <ToggleSetting
                label="Auto-sync Steam library"
                description="Automatically sync your Steam library on launch"
                checked={settings.autoSync}
                onChange={(v) => updateSettings({ ...settings, autoSync: v })}
              />
            </div>
            <div className="px-4 md:px-6">
              <ToggleSetting
                label="Minimize to tray"
                description="Minimize to system tray instead of closing"
                checked={settings.minimizeToTray}
                onChange={(v) => updateSettings({ ...settings, minimizeToTray: v })}
              />
            </div>
            <div className="px-4 md:px-6">
              <ToggleSetting
                label="Desktop notifications"
                description="Show notifications for sync and updates"
                checked={settings.notificationsEnabled}
                onChange={(v) => updateSettings({ ...settings, notificationsEnabled: v })}
              />
            </div>
            <div className="px-4 md:px-6">
              <ToggleSetting
                label="Launch on system start"
                description="Automatically start Backly when you log in"
                checked={settings.startOnBoot}
                onChange={(v) => updateSettings({ ...settings, startOnBoot: v })}
              />
            </div>
          </div>
        </SettingsCard>

        {/* Data Management */}
        <SettingsCard icon={<DataIcon />} title="Data Management">
          <div className="space-y-3 md:space-y-4">
            <p className="text-[11px] md:text-sm text-gray-500 leading-relaxed">
              Export your game library and settings as a JSON file, or import a previously exported backup.
            </p>
            <div className="flex items-center gap-2 md:gap-3 flex-wrap">
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-1.5 md:gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-xl bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-black font-semibold text-[11px] md:text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(234,179,8,0.3)] active:scale-[0.97]"
              >
                <DataIcon />
                Export
              </button>
              <button
                onClick={handleImport}
                className="inline-flex items-center gap-1.5 md:gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 hover:text-white font-medium text-[11px] md:text-sm transition-all duration-200 active:scale-[0.97] border border-white/[0.06]"
              >
                Import
              </button>
            </div>

            <div className="border-t border-white/[0.04] pt-3 md:pt-4">
              <p className="text-[11px] md:text-sm text-gray-500 leading-relaxed mb-3">
                Permanently delete all data and reset the app to its factory state.
              </p>
              <button
                onClick={() => setShowResetModal(true)}
                className="inline-flex items-center gap-1.5 md:gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 font-medium text-[11px] md:text-sm transition-all duration-200 active:scale-[0.97] border border-red-500/20 hover:border-red-500/30"
              >
                <ResetIcon />
                Factory Reset
              </button>
            </div>
          </div>
        </SettingsCard>

        <ConfirmModal
          open={showResetModal}
          onConfirm={handleFactoryReset}
          onCancel={() => setShowResetModal(false)}
          loading={resetting}
        />

        {/* About */}
        <SettingsCard icon={<InfoIcon />} title="About">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 md:w-12 h-10 md:h-12 rounded-xl bg-gradient-to-br from-gold-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-gold-500/20 shrink-0">
              <span className="text-black font-bold text-lg md:text-xl">B</span>
            </div>
            <div>
              <p className="text-[11px] md:text-sm font-semibold text-white">Backly</p>
              <p className="text-[9px] md:text-xs text-gray-500 mt-0.5">Premium personal gaming backlog tracker</p>
              <p className="text-[8px] md:text-[11px] text-gray-600 mt-0.5 md:mt-1 font-mono">v1.0.0</p>
            </div>
          </div>
        </SettingsCard>
      </div>
    </div>
  );
}
