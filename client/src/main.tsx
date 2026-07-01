import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import { registerServiceWorker } from './lib/registerSW';
import './index.css';

// Register service worker for PWA
registerServiceWorker();

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found');

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
