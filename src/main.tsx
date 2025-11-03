import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary';
import { WeatherProvider } from './contexts/WeatherContext';
import { logPWAStatus } from './utils/pwa-debug';
import { showOfflineNotification, showOnlineNotification } from './utils/notifications';
import { initSounds } from './utils/sound';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find root element');
}

let wasOffline = false;

window.addEventListener('offline', () => {
  wasOffline = true;
  console.log('App is now offline');
  showOfflineNotification().catch(console.error);
});

window.addEventListener('online', () => {
  if (wasOffline) {
    console.log('App is back online');
    showOnlineNotification().catch(console.error);
    wasOffline = false;
  }
});

logPWAStatus();

initSounds();

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <WeatherProvider>
        <App />
      </WeatherProvider>
    </ErrorBoundary>
  </StrictMode>
);
