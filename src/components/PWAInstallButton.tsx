import React, { useState } from 'react';
import { Download, Smartphone, WifiOff, X } from 'lucide-react';
import { usePWAInstall, useOnlineStatus } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className="min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-cute font-bold bg-gradient-to-r from-[var(--accent-pink)] to-[var(--accent-purple)] text-black shadow-md hover:opacity-95 active:scale-95 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
        title="Instalar NekoLover Read como aplicación"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Instalar App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-cute font-bold bg-white/10 hover:bg-white/15 border border-[var(--border-color)] text-[var(--accent-pink)] transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          title="Instalar en iPhone o iPad"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Instalar iOS</span>
        </button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setShowIOSGuide(false)}
          >
            <div
              className="w-full max-w-sm rounded-2xl bg-[var(--card-bg)] border border-[var(--border-color)] p-5 shadow-2xl space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[var(--accent-pink)]">
                  Instalar en iPhone / iPad
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-white cursor-pointer"
                  aria-label="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-[var(--text-main)] leading-relaxed">
                1. Pulsa el botón <strong>Compartir</strong> en la barra inferior de Safari.
                <br />
                2. Desliza hacia abajo y selecciona <strong>Añadir a pantalla de inicio</strong>.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full min-h-[44px] rounded-xl bg-[var(--accent-pink)] text-black text-xs font-bold cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500/95 px-3 py-2 text-xs font-semibold text-black shadow-lg">
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>Modo sin conexión · Leyendo libros locales</span>
    </div>
  );
};
