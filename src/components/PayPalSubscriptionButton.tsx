import React, { useEffect, useId, useRef, useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';

interface PayPalSubscriptionButtonProps {
  onSuccess: (subscriptionID: string) => void;
  onError?: (error: any) => void;
  userEmail?: string;
}

const PLAN_ID = 'P-0GH31223S1526604TNLUBBEQ';
const CLIENT_ID = 'BAAuKNjCuRd3S-EKKHcqsiBBy8FkOQeHr7JKb2ZQ0XH0Akb6BFJ4XCN9wBfInqG54NClBy4LRls3FUC7jY';

declare global {
  interface Window {
    paypal?: any;
  }
}

export const PayPalSubscriptionButton: React.FC<PayPalSubscriptionButtonProps> = ({
  onSuccess,
  onError,
  userEmail
}) => {
  const [sdkReady, setSdkReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const uniqueId = useId().replace(/:/g, '_');
  const containerId = `paypal_btn_container_${uniqueId}`;
  const containerRef = useRef<HTMLDivElement>(null);

  // Cargar y verificar SDK oficial de PayPal
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

    // Cargar SDK oficial de PayPal bajo demanda inmediatamente
    if (!document.querySelector('script[src*="paypal.com/sdk/js"]')) {
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${CLIENT_ID}&vault=true&intent=subscription`;
      script.setAttribute('data-sdk-integration-source', 'button-factory');
      script.onload = () => {
        if (window.paypal && window.paypal.Buttons) {
          setSdkReady(true);
        }
      };
      script.onerror = () => {
        setLoadError('No se pudo conectar con los servidores de PayPal.');
      };
      document.head.appendChild(script);
    }

    checkInterval = setInterval(() => {
      if (checkPayPal()) {
        clearInterval(checkInterval);
      }
    }, 200);

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, []);

  // Renderizar botones de PayPal en el contenedor
  useEffect(() => {
    if (!sdkReady || !containerRef.current) return;

    try {
      containerRef.current.innerHTML = '';
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
        .render(containerRef.current)
        .catch((err: any) => {
          console.warn('Error rendering PayPal smart buttons:', err);
        });
    } catch (e: any) {
      console.warn('Failed to initialize PayPal Buttons:', e);
    }
  }, [sdkReady, containerId]);

  return (
    <div className="w-full flex flex-col items-center justify-center my-2 space-y-2">
      <div className="w-full relative min-h-[46px] flex flex-col items-center justify-center">
        <div 
          ref={containerRef} 
          id={containerId} 
          className="w-full flex items-center justify-center min-h-[46px]"
        />

        {!sdkReady && !loadError && (
          <div className="flex items-center justify-center gap-2 py-1.5 px-3 rounded-full bg-white/5 text-[11px] text-amber-200">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
            <span>Cargando botón de PayPal...</span>
          </div>
        )}

        {loadError && (
          <div className="text-xs text-red-300 bg-red-950/60 border border-red-500/40 px-3 py-1.5 rounded-xl">
            {loadError}
          </div>
        )}
      </div>

      {isProcessing && (
        <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 rounded-xl animate-pulse">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Conectando de forma segura con PayPal...</span>
        </div>
      )}

      <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] font-mono">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>Plan: {PLAN_ID} • Cancelación libre en cualquier momento</span>
      </div>
    </div>
  );
};
