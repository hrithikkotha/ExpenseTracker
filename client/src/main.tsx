import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import { registerServiceWorker } from './lib/registerSW';
import { initializeBackgroundSync } from './pwa/sync/backgroundSync';
import './index.css';

// Register service worker for PWA
registerServiceWorker();

// Initialize background sync (auto-sync when online)
if ('serviceWorker' in navigator) {
  initializeBackgroundSync();
}

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found');

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
