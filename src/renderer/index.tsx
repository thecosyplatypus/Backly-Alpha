import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import SplashScreen from './components/ui/SplashScreen';
import './styles/globals.css';
import './devMock';
import { installMobileApi } from './mobile/mobileApi';

// Electron provides this bridge through its preload script. Capacitor has no
// preload process, so install the offline mobile implementation instead.
installMobileApi();

function Root() {
  const [splashDone, setSplashDone] = useState(false);

  if (!splashDone) {
    return <SplashScreen onFinish={() => setSplashDone(true)} />;
  }

  return (
    <React.StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<Root />);
