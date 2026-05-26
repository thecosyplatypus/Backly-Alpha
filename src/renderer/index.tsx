import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import SplashScreen from './components/ui/SplashScreen';
import './styles/globals.css';
import './devMock';

function Boot() {
  const [ready, setReady] = useState(false);

  if (!ready) {
    return <SplashScreen onFinish={() => setReady(true)} />;
  }

  return (
    <React.StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </React.StrictMode>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<Boot />);
