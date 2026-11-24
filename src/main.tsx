import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

declare global {
  interface Window {
    __NEKO_SPLASH_START__?: number;
    __dismissNekoSplash?: () => void;
  }
}

registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return;
    let lastCheck = Date.now();
    const checkForUpdate = () => {
      const now = Date.now();
      if (now - lastCheck < 30_000) return;
      lastCheck = now;
      if (navigator.onLine !== false) {
        void registration.update().catch(() => {});
      }
    };
    window.setTimeout(() => {
      if (navigator.onLine !== false) {
        void registration.update().catch(() => {});
      }
    }, 1500);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') checkForUpdate();
    });
    window.addEventListener('online', checkForUpdate);
    window.setInterval(checkForUpdate, 15 * 60 * 1000);
  }
});

createRoot(document.getElementById('root')!).render(<App />);

// Keep the AppMint-style welcome splash visible briefly on cold boot, then fade out cleanly
requestAnimationFrame(() => {
  const elapsed = Date.now() - (window.__NEKO_SPLASH_START__ || Date.now());
  const minDisplayMs = 950;
  const remaining = Math.max(0, minDisplayMs - elapsed);
  window.setTimeout(() => {
    window.__dismissNekoSplash?.();
  }, remaining);
});
