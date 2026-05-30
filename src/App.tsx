import React from 'react';
import SteamSettings from './components/Settings/SteamSettings';

function App() {
  return (
    <div className="min-h-screen bg-backly-dark p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <SteamSettings />
      </div>
    </div>
  );
}

export default App;
