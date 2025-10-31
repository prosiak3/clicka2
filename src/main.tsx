import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
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

registerSW({
  onNeedRefresh() {
    if (confirm('New content available. Reload?')) {
      window.location.reload();
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline');
  },
  onRegisteredSW(swScriptUrl) {
    console.log('Service Worker registered:', swScriptUrl);
  },
  onRegisterError(error) {
    console.error('Service Worker registration error:', error);
  }
});

logPWAStatus();

initSounds();

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
