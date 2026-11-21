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

registerSW({ immediate: true });

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
