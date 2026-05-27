import React, { useState, useEffect } from 'react';

const SteamSettings: React.FC = () => {
  const [localKey, setLocalKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanged, setHasChanged] = useState(false);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('steamApiKey');
    if (stored) {
      setLocalKey(stored);
      setSavedKey(stored);
    }
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 300));
    localStorage.setItem('steamApiKey', localKey);
    setSavedKey(localKey);
    setHasChanged(false);
    setIsLoading(false);
  };

  const handleClear = async () => {
    localStorage.removeItem('steamApiKey');
    setLocalKey('');
    setSavedKey(null);
    setHasChanged(false);
    setShowKey(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalKey(e.target.value);
    setHasChanged(e.target.value !== (savedKey || ''));
  };

  return (
    <div className="bg-gradient-to-br from-gray-900/80 to-black/90 rounded-2xl p-6 border border-white/10 shadow-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-yellow-500/20 flex items-center justify-center">
          <svg className="w-7 h-7 text-backly-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Steam Integration</h3>
          <p className="text-sm text-gray-400">Connect your Steam account</p>
        </div>
      </div>

      {/* Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          STEAM WEB API KEY
        </label>
        <div className="relative">
          <input
            type={showKey ? 'text' : 'password'}
            value={localKey}
            onChange={handleChange}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
            placeholder="Enter Steam API key"
            className="w-full px-4 py-3 rounded-xl bg-gray-800/50 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-backly-gold transition-all duration-200 pr-36"
            disabled={isLoading}
          />
          <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
            {/* Clear */}
            <button
              onClick={handleClear}
              disabled={!localKey || isLoading}
              className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-50 transition-all duration-200"
              title="Clear key"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            {/* Toggle visibility */}
            <button
              onClick={() => setShowKey(!showKey)}
              disabled={isLoading}
              className="p-2 rounded-lg bg-gray-700/50 text-gray-400 hover:bg-gray-700/80 transition-all duration-200"
              title={showKey ? 'Hide' : 'Show'}
            >
              {showKey ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
            {/* Save */}
            <button
              onClick={handleSave}
              disabled={!hasChanged || isLoading}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-backly-gold to-backly-goldDark text-backly-dark font-medium text-sm disabled:opacity-50 transition-all duration-200 shadow-lg flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save
                </>
              )}
            </button>
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Get your key from{' '}
          <a href="https://steamcommunity.com/dev/apikey" target="_blank" rel="noopener noreferrer"
             className="text-backly-gold hover:text-backly-goldLight transition-colors">
            steamcommunity.com/dev/apikey
          </a>
        </p>
      </div>

      {savedKey && (
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 mb-3">
          <p className="text-sm text-green-300">Steam API key is configured</p>
          <p className="text-xs text-green-400/70 mt-1">Click the trash icon to remove it.</p>
        </div>
      )}

      <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
        <p className="text-sm text-yellow-300">
          API keys are stored locally and never sent to external servers.
        </p>
      </div>
    </div>
  );
};

export default SteamSettings;
