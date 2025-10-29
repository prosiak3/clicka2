import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find root element');
}

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

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
