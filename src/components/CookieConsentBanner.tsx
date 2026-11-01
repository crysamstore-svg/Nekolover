import React, { useState, useEffect } from 'react';
import { Cookie, ShieldCheck, ChevronRight, FileText } from 'lucide-react';
import { vipManager } from '../utils/vipManager';
import { LegalTab } from './LegalModal';

interface CookieConsentBannerProps {
  onOpenLegalModal: (tab: LegalTab) => void;
}

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({
  onOpenLegalModal
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    // Check if the user has already consented
    const hasConsented = localStorage.getItem('consentimiento_privacidad') === 'true';
    if (!hasConsented) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    // Save to localStorage as specified by user instructions and record audit log
    localStorage.setItem('consentimiento_privacidad', 'true');
    vipManager.acceptCookieConsent();
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <aside 
      id="banner-consentimiento" 
      aria-label="Aviso de privacidad y cookies"
      className="fixed bottom-0 left-0 w-full z-[9999] bg-[#120f1d]/95 backdrop-blur-md border-t-2 border-[var(--accent-pink)]/50 text-white p-4 sm:p-5 shadow-[0_-8px_30px_rgba(0,0,0,0.8)] transition-all animate-slideUp select-none"
    >
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Text information */}
        <div className="flex items-start gap-3 flex-1">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[var(--accent-pink)] to-[var(--accent-purple)] text-black flex items-center justify-center shrink-0 shadow-md text-xl">
            🍪
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-xs sm:text-sm text-[var(--accent-pink)] flex items-center gap-2">
              <span>Almacenamiento Local y Privacidad</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                100% Local & Seguro
              </span>
            </h4>
            <p className="text-xs sm:text-[13px] text-white/90 leading-relaxed">
              Utilizamos almacenamiento local (<code className="text-pink-300 bg-black/40 px-1 py-0.5 rounded">localStorage</code>) para recordar tus preferencias de lectura (tipografías, notas y stickers) y procesamos suscripciones de forma segura mediante <strong>PayPal</strong>. No recopilamos datos personales ni alojamos tus libros. Al continuar, aceptas nuestros{' '}
              <button
                type="button"
                onClick={() => onOpenLegalModal('terms')}
                className="text-[var(--accent-pink)] underline hover:text-white font-semibold inline-flex items-center gap-0.5 cursor-pointer"
              >
                <span>Términos y Condiciones</span>
              </button>
              {', '}
              <button
                type="button"
                onClick={() => onOpenLegalModal('privacy')}
                className="text-purple-300 underline hover:text-white font-semibold cursor-pointer"
              >
                Política de Privacidad
              </button>
              {' y '}
              <button
                type="button"
                onClick={() => onOpenLegalModal('cookies')}
                className="text-amber-300 underline hover:text-white font-semibold cursor-pointer"
              >
                Cookies
              </button>
              .
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2.5 self-end md:self-center shrink-0">
          <button
            type="button"
            onClick={() => onOpenLegalModal('cookies')}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:text-white bg-black/40 border border-white/10 hover:border-white/30 transition flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Ver Detalles</span>
          </button>

          <button
            type="button"
            onClick={handleAccept}
            className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-cute font-bold bg-gradient-to-r from-[var(--accent-pink)] via-[var(--accent-purple)] to-pink-500 text-black shadow-[0_0_15px_rgba(255,121,198,0.4)] hover:brightness-110 active:scale-95 transition cursor-pointer flex items-center gap-2"
          >
            <span>Aceptar y Continuar</span>
            <ChevronRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      </div>
    </aside>
  );
};
