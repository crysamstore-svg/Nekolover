import React, { useEffect, useId, useRef, useState } from 'react';
import { ExternalLink, Loader2, ShieldCheck } from 'lucide-react';

interface PayPalSubscriptionButtonProps {
  onSuccess: (subscriptionID: string) => void;
  onError?: (error: any) => void;
  onCheckoutClick?: () => void;
  userEmail?: string;
}

const PLAN_ID = 'P-0GH31223S1526604TNLUBBEQ';
const CLIENT_ID = 'BAAuKNjCuRd3S-EKKHcqsiBBy8FkOQeHr7JKb2ZQ0XH0Akb6BFJ4XCN9wBfInqG54NClBy4LRls3FUC7jY';
const DIRECT_PAYPAL_URL = `https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=${PLAN_ID}`;

declare global {
  interface Window {
    paypal?: any;
  }
}

export const PayPalSubscriptionButton: React.FC<PayPalSubscriptionButtonProps> = ({
  onSuccess,
  onError,
  onCheckoutClick
}) => {
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkFailed, setSdkFailed] = useState(false);
  const [popupBlockedNotice, setPopupBlockedNotice] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const uniqueId = useId().replace(/:/g, '_');
  const containerId = `paypal_btn_container_${uniqueId}`;
  const containerRef = useRef<HTMLDivElement>(null);

  // Cargar y verificar SDK oficial de PayPal
  useEffect(() => {
    let checkInterval: ReturnType<typeof setInterval> | null = null;
    let loadTimeout: ReturnType<typeof setTimeout> | null = null;

    const checkPayPal = () => {
      if (window.paypal && window.paypal.Buttons) {
        setSdkReady(true);
        setSdkFailed(false);
        if (checkInterval) clearInterval(checkInterval);
        if (loadTimeout) clearTimeout(loadTimeout);
        return true;
      }
      return false;
    };

    if (checkPayPal()) return;

    if (!document.querySelector('script[src*="paypal.com/sdk/js"]')) {
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${CLIENT_ID}&vault=true&intent=subscription&disable-funding=card`;
      script.async = true;
      script.setAttribute('data-sdk-integration-source', 'button-factory');
      script.onload = () => {
        checkPayPal();
      };
      script.onerror = () => {
        setSdkFailed(true);
        if (checkInterval) clearInterval(checkInterval);
      };
      document.head.appendChild(script);
    }

    checkInterval = setInterval(() => {
      checkPayPal();
    }, 250);

    // Si en 6 segundos no carga el SDK (ej. bloqueador o WebView restringido), dejar de mostrar spinner
    loadTimeout = setTimeout(() => {
      if (!window.paypal?.Buttons) {
        setSdkFailed(true);
      }
      if (checkInterval) clearInterval(checkInterval);
    }, 6000);

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (loadTimeout) clearTimeout(loadTimeout);
    };
  }, []);

  // Renderizar botón inteligente exclusivo de PayPal (sin botón de tarjeta)
  useEffect(() => {
    if (!sdkReady || !containerRef.current) return;

    let cancelled = false;
    try {
      containerRef.current.innerHTML = '';
      const paypalFunding = window.paypal?.FUNDING?.PAYPAL;
      window.paypal
        .Buttons({
          ...(paypalFunding ? { fundingSource: paypalFunding } : {}),
          style: {
            shape: 'pill',
            color: 'gold',
            layout: 'horizontal',
            label: 'subscribe',
            height: 44,
            tagline: false
          },
          createSubscription: function (_data: any, actions: any) {
            setIsProcessing(true);
            setPopupBlockedNotice(false);
            return actions.subscription.create({
              plan_id: PLAN_ID
            });
          },
          onApprove: function (data: any) {
            if (cancelled) return;
            setIsProcessing(false);
            onSuccess(data.subscriptionID || 'P-APPROVED');
          },
          onError: function (err: any) {
            if (cancelled) return;
            setIsProcessing(false);
            setPopupBlockedNotice(true);
            console.warn('PayPal Smart Button popup blocked or errored:', err);
            onError?.(err);
          },
          onCancel: function () {
            if (cancelled) return;
            setIsProcessing(false);
          }
        })
        .render(containerRef.current)
        .catch((err: any) => {
          if (cancelled) return;
          console.warn('Error rendering PayPal smart buttons:', err);
          setSdkFailed(true);
        });
    } catch (e: any) {
      console.warn('Failed to initialize PayPal Buttons:', e);
      setSdkFailed(true);
    }

    return () => {
      cancelled = true;
    };
  }, [sdkReady, containerId]);

  return (
    <div className="w-full flex flex-col items-center justify-center my-2 space-y-2.5">
      {/* Contenedor del botón inteligente oficial (block width para evitar colapso del iframe zoid) */}
      {!sdkFailed && (
        <div className="w-full relative min-h-[46px]">
          <div
            ref={containerRef}
            id={containerId}
            className="w-full block min-h-[46px]"
          />

          {!sdkReady && (
            <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-full bg-white/5 text-[11px] text-amber-200">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
              <span>Cargando botón de PayPal...</span>
            </div>
          )}
        </div>
      )}

      {/* Enlace directo oficial de PayPal: en móviles/APK WebView navega directo para no ser bloqueado por target=_blank; en iframe abre pestaña nueva */}
      <a
        href={DIRECT_PAYPAL_URL}
        {...((() => {
          try {
            return window.self !== window.top
              ? { target: '_blank', rel: 'noopener noreferrer' }
              : {};
          } catch {
            return { target: '_blank', rel: 'noopener noreferrer' };
          }
        })())}
        onClick={() => onCheckoutClick?.()}
        className="w-full min-h-[44px] py-3 px-4 rounded-full bg-[#0070ba] hover:bg-[#005ea6] active:scale-[0.98] text-white font-bold text-xs shadow-[0_4px_16px_rgba(0,112,186,0.4)] transition flex items-center justify-center gap-2 border border-blue-300/30"
      >
        <span>🅿️ Iniciar 3 días gratis con PayPal (luego $2/mes)</span>
        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
      </a>

      {(popupBlockedNotice || sdkFailed) && (
        <p className="text-[11px] text-amber-200/90 text-center bg-amber-950/40 border border-amber-400/30 rounded-xl px-3 py-1.5">
          Si tu navegador o app bloqueó la ventana emergente de PayPal, usa el botón azul <strong>«Iniciar 3 días gratis con PayPal»</strong> arriba.
        </p>
      )}

      {isProcessing && (
        <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 rounded-xl animate-pulse">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Conectando de forma segura con PayPal...</span>
        </div>
      )}

      <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] font-mono text-center">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>Plan: {PLAN_ID} • 3 días gratis, cancela cuando quieras</span>
      </div>
    </div>
  );
};
