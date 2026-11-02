import React, { useEffect, useRef, useState } from 'react';
import { Loader2, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';

interface PayPalSubscriptionButtonProps {
  onSuccess: (subscriptionID: string) => void;
  onError?: (error: any) => void;
}

const PLAN_ID = 'P-0GH31223S1526604TNLUBBEQ';
const CLIENT_ID = 'BAAuKNjCuRd3S-EKKHcqsiBBy8FkOQeHr7JKb2ZQ0XH0Akb6BFJ4XCN9wBfInqG54NClBy4LRls3FUC7jY';
const CONTAINER_ID = `paypal-button-container-${PLAN_ID}`;

declare global {
  interface Window {
    paypal?: any;
  }
}

export const PayPalSubscriptionButton: React.FC<PayPalSubscriptionButtonProps> = ({
  onSuccess,
  onError
}) => {
  const [sdkReady, setSdkReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const renderedRef = useRef(false);

  useEffect(() => {
    let checkInterval: any = null;

    const checkPayPal = () => {
      if (window.paypal && window.paypal.Buttons) {
        setSdkReady(true);
        if (checkInterval) clearInterval(checkInterval);
        return true;
      }
      return false;
    };

    if (checkPayPal()) return;

    // If not ready yet, check every 300ms up to 20 times (6s)
    let attempts = 0;
    checkInterval = setInterval(() => {
      attempts++;
      if (checkPayPal()) {
        clearInterval(checkInterval);
      } else if (attempts > 20) {
        clearInterval(checkInterval);
        // Inject script dynamically if not yet in DOM
        if (!document.querySelector('script[src*="paypal.com/sdk/js"]')) {
          const script = document.createElement('script');
          script.src = `https://www.paypal.com/sdk/js?client-id=${CLIENT_ID}&vault=true&intent=subscription`;
          script.setAttribute('data-sdk-integration-source', 'button-factory');
          script.onload = () => {
            if (window.paypal) setSdkReady(true);
          };
          script.onerror = () => {
            setLoadError('No se pudo cargar el SDK de PayPal. Por favor verifica tu conexión.');
          };
          document.head.appendChild(script);
        } else {
          setLoadError('El servicio de PayPal está tardando en responder.');
        }
      }
    }, 300);

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, []);

  useEffect(() => {
    if (!sdkReady || renderedRef.current) return;

    const container = document.getElementById(CONTAINER_ID);
    if (!container) return;

    try {
      container.innerHTML = '';
      window.paypal
        .Buttons({
          style: {
            shape: 'pill',
            color: 'white',
            layout: 'horizontal',
            label: 'subscribe'
          },
          createSubscription: function (_data: any, actions: any) {
            setIsProcessing(true);
            return actions.subscription.create({
              plan_id: PLAN_ID
            });
          },
          onApprove: function (data: any, _actions: any) {
            setIsProcessing(false);
            console.log('PayPal Subscription Approved:', data.subscriptionID);
            onSuccess(data.subscriptionID || 'P-APPROVED');
          },
          onError: function (err: any) {
            setIsProcessing(false);
            console.error('PayPal Buttons Error:', err);
            onError?.(err);
          },
          onCancel: function () {
            setIsProcessing(false);
          }
        })
        .render(`#${CONTAINER_ID}`)
        .then(() => {
          renderedRef.current = true;
        })
        .catch((err: any) => {
          console.warn('Error rendering PayPal button container:', err);
        });
    } catch (e: any) {
      console.warn('Failed to initialize PayPal Buttons:', e);
      setLoadError(e.message || 'Error al iniciar PayPal.');
    }
  }, [sdkReady, onSuccess, onError]);

  return (
    <div className="w-full flex flex-col items-center justify-center my-2 space-y-3">
      {/* Official Container for PayPal SDK Buttons */}
      <div 
        id={CONTAINER_ID} 
        className="w-full min-h-[46px] flex items-center justify-center"
      />

      {/* Loading state before PayPal SDK finishes mounting */}
      {!sdkReady && !loadError && (
        <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-full bg-white/5 border border-white/10 text-xs text-amber-200 animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
          <span>Cargando botón oficial de suscripción de PayPal...</span>
        </div>
      )}

      {isProcessing && (
        <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 rounded-xl">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Comunicando de forma segura con PayPal...</span>
        </div>
      )}

      {loadError && (
        <div className="w-full p-3 rounded-2xl bg-amber-950/40 border border-amber-400/40 text-center space-y-2">
          <p className="text-[11px] text-amber-200">
            {loadError}
          </p>
          <button
            type="button"
            onClick={() => {
              window.open(`https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=${PLAN_ID}`, '_blank');
            }}
            className="px-4 py-2 rounded-full bg-[#FFC439] hover:bg-[#F2BA36] text-black font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2 mx-auto active:scale-95"
          >
            <span className="italic font-black text-[#003087]">Pay<span className="text-[#0079C1]">Pal</span></span>
            <span>Suscribirse directamente en PayPal ($2/mes)</span>
          </button>
        </div>
      )}

      <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] font-mono">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>Plan Oficial: {PLAN_ID} • Cancelación libre en tu cuenta PayPal</span>
      </div>
    </div>
  );
};
