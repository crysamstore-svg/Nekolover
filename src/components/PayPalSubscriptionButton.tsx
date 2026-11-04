import React, { useEffect, useId, useRef, useState } from 'react';
import { Loader2, ShieldCheck, ExternalLink, Sparkles } from 'lucide-react';

interface PayPalSubscriptionButtonProps {
  onSuccess: (subscriptionID: string) => void;
  onError?: (error: any) => void;
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

    let attempts = 0;
    checkInterval = setInterval(() => {
      attempts++;
      if (checkPayPal()) {
        clearInterval(checkInterval);
      } else if (attempts > 15) {
        clearInterval(checkInterval);
        if (!document.querySelector('script[src*="paypal.com/sdk/js"]')) {
          const script = document.createElement('script');
          script.src = `https://www.paypal.com/sdk/js?client-id=${CLIENT_ID}&vault=true&intent=subscription`;
          script.setAttribute('data-sdk-integration-source', 'button-factory');
          script.onload = () => {
            if (window.paypal) setSdkReady(true);
          };
          script.onerror = () => {
            setLoadError('No se pudo cargar el SDK interactivo. Usa el botón directo abajo.');
          };
          document.head.appendChild(script);
        }
      }
    }, 300);

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, []);

  // Renderizar botones inteligentes de PayPal en el contenedor único
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
    <div className="w-full flex flex-col items-center justify-center my-2 space-y-3">
      {/* 1. BOTÓN DIRECTO QUE NUNCA SE BLOQUEA EN IFRAMES NI NAVEGADORES */}
      <a
        href={DIRECT_PAYPAL_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full py-2.5 px-4 rounded-xl bg-[#FFC439] hover:bg-[#F2BA36] text-[#003087] font-extrabold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer border border-[#e0a824]"
        title="Abrir pasarela de suscripción de PayPal en pestaña nueva ($2.00 USD/mes)"
      >
        <span>Pagar Suscripción en</span>
        <span className="italic font-black text-sm text-[#003087]">Pay<span className="text-[#0079C1]">Pal</span></span>
        <span className="text-black text-xs font-semibold">($2.00 USD/mes)</span>
        <ExternalLink className="w-4 h-4 text-[#003087] shrink-0" />
      </a>

      {/* 2. BOTONES INTELIGENTES DE PAYPAL (Smart Buttons) */}
      <div className="w-full relative min-h-[46px] flex flex-col items-center justify-center">
        <div 
          ref={containerRef} 
          id={containerId} 
          className="w-full flex items-center justify-center min-h-[46px]"
        />

        {!sdkReady && !loadError && (
          <div className="flex items-center justify-center gap-2 py-1.5 px-3 rounded-full bg-white/5 text-[11px] text-amber-200">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
            <span>Cargando botón interactivo de PayPal...</span>
          </div>
        )}
      </div>

      {isProcessing && (
        <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 rounded-xl animate-pulse">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Conectando de forma segura con PayPal...</span>
        </div>
      )}

      {/* Nota de ayuda para popups y WebViews */}
      <p className="text-[10px] text-white/60 text-center leading-tight">
        💡 <em>Si la ventana de PayPal no se abre al presionar el botón interactivo, usa el botón amarillo directo de arriba. Tras pagar, tu código de activación o ID de PayPal se enviará a Supabase para activar tu VIP.</em>
      </p>

      <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] font-mono">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>Plan: {PLAN_ID} • Cancelación libre en cualquier momento</span>
      </div>
    </div>
  );
};
