import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Crown, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Music, 
  Type, 
  Image as ImageIcon, 
  Smile, 
  Highlighter, 
  Feather, 
  FileText, 
  ExternalLink,
  KeyRound,
  RotateCcw,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { vipManager, VipSubscriptionData } from '../utils/vipManager';
import { LegalTab } from './LegalModal';
import { PayPalSubscriptionButton } from './PayPalSubscriptionButton';
import { PagoMovilPanel } from './PagoMovilPanel';

interface VipClubPageProps {
  onBack: () => void;
  onOpenLegalModal: (tab: LegalTab) => void;
  onSubscribed?: () => void;
}

export const VipClubPage: React.FC<VipClubPageProps> = ({
  onBack,
  onOpenLegalModal,
  onSubscribed
}) => {
  const [subscription, setSubscription] = useState<VipSubscriptionData>(() => vipManager.getSubscription());
  const [manualCode, setManualCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  
  // Two separate mandatory checkboxes
  const [acceptTermsAndRefund, setAcceptTermsAndRefund] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  
  const [paymentMethodTab, setPaymentMethodTab] = useState<'paypal' | 'pago_movil'>('paypal');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  useEffect(() => {
    const unsub = vipManager.onVipChange(() => {
      setSubscription(vipManager.getSubscription());
    });
    return unsub;
  }, []);

  const isVip = subscription.isVip;

  const handlePayPalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!acceptTermsAndRefund || !acceptPrivacy) {
      setErrorMessage('Debes marcar de forma separada ambas casillas de consentimiento legal antes de continuar.');
      return;
    }

    setErrorMessage('Para suscribirte, utiliza el botón oficial de PayPal situado abajo. Una vez completado, inserta tu código de activación para activar la membresía VIP.');
  };

  const handlePayPalApprove = (subscriptionId: string) => {
    vipManager.registerApprovedPayPalId(subscriptionId);
    vipManager.saveConsentLog({
      consentType: 'vip_checkout_paypal',
      termsAccepted: true,
      privacyAccepted: true,
      refundPolicyAccepted: true
    });

    setManualCode(subscriptionId);
    setSuccessMessage(`✅ ¡Pago oficial de PayPal registrado con éxito! (ID: ${subscriptionId}). Tu código de activación ha sido enviado a tu correo. Para activar tus funciones VIP, por favor presiona el botón "Activar Membresía VIP" en la casilla de abajo.`);
  };

  const handleActivateManualCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!manualCode.trim()) {
      setErrorMessage('Por favor introduce tu código de activación en la casilla.');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await vipManager.activateWithCodeAsync(manualCode);
      if (res.success && res.sub) {
        setSubscription(res.sub);
        setSuccessMessage(res.message);
        onSubscribed?.();
      } else {
        setErrorMessage(res.message);
      }
    } catch (err) {
      setErrorMessage('Error de conexión al verificar el código con el servidor de Supabase.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = () => {
    vipManager.cancel();
    setSubscription(vipManager.getSubscription());
    setConfirmingCancel(false);
    setSuccessMessage('Suscripción VIP cancelada. Has vuelto al plan gratuito.');
  };

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-8 animate-fadeIn select-none space-y-6">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-[var(--border-color)]">
        <button
          onClick={onBack}
          className="px-3.5 py-2 rounded-xl text-xs font-cute font-bold bg-black/40 border border-[var(--border-color)] hover:border-amber-400 text-amber-300 transition flex items-center gap-2 active:scale-95 shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a la Biblioteca</span>
        </button>

        <div className="text-right">
          <h2 className="dark-reborn-font font-bold text-lg sm:text-2xl text-amber-300 flex items-center justify-end gap-2">
            <span>👑</span>
            <span>NekoLover VIP Club</span>
          </h2>
          <p className="text-[11px] text-[var(--text-muted)]">
            Acceso Premium mensual con PayPal o Pago Móvil Venezuela ($2.00 USD/mes)
          </p>
        </div>
      </div>

      {/* Status banner if already VIP */}
      {isVip && (
        <div className="bg-gradient-to-r from-emerald-950/80 to-black/80 border-2 border-emerald-500/60 rounded-3xl p-5 shadow-[0_0_30px_rgba(16,185,129,0.2)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center text-2xl shrink-0">
              👑
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 text-xs font-bold font-mono">
                <Check className="w-3.5 h-3.5 stroke-[3]" /> MEMBRESÍA VIP ACTIVA
              </span>
              <h3 className="font-bold text-base text-white mt-1">
                Disfrutando de todas las funciones sin límites
              </h3>
              <p className="text-xs text-white/70">
                Plan: <strong>{subscription.planName}</strong> • Método: <strong>{subscription.paymentMethod}</strong>
                {subscription.expiresAt && (
                  <span> • Vence el: {new Date(subscription.expiresAt).toLocaleDateString('es-ES')}</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
            <button
              onClick={() => onOpenLegalModal('audit')}
              className="px-3 py-1.5 rounded-xl bg-black/60 border border-amber-400/30 text-amber-300 hover:text-white text-xs font-mono transition"
            >
              📜 Ver Auditoría Legal
            </button>
            {confirmingCancel ? (
              <div className="flex items-center gap-1.5 bg-red-950/70 border border-red-500/50 rounded-xl px-2.5 py-1">
                <span className="text-[11px] text-red-200 font-semibold">¿Confirmar?</span>
                <button
                  type="button"
                  onClick={handleCancelSubscription}
                  className="px-2.5 py-1 rounded-lg bg-red-500 hover:bg-red-400 text-white text-xs font-bold transition cursor-pointer"
                >
                  Sí, cancelar VIP
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingCancel(false)}
                  className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs transition cursor-pointer"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingCancel(true)}
                className="px-3 py-1.5 rounded-xl bg-red-950/40 border border-red-500/30 hover:border-red-400 text-red-300 text-xs font-medium transition cursor-pointer"
              >
                Cancelar VIP (Volver a Gratis)
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Grid: Benefits showcase & PayPal checkout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Benefits & Value (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Hero Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-[#1d162e] via-[#141021] to-[#0d0915] border-2 border-amber-400/40 shadow-xl relative overflow-hidden">
            <div className="relative z-10 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Suscripción Mensual VIP • $2.00 USD</span>
              </div>
              <h3 className="dark-reborn-font text-xl sm:text-2xl font-bold text-white leading-tight">
                Lectura sin límites, música de fondo y personalización total
              </h3>
              <p className="text-xs text-white/80 leading-relaxed">
                El plan gratuito de NekoLover Read incluye lo esencial. Suscríbete a VIP por solo <strong>$2.00 USD al mes</strong> mediante <strong>PayPal</strong> para desbloquear todas las herramientas avanzadas.
              </p>
            </div>
          </div>

          {/* Feature List */}
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-5 shadow-xl space-y-3">
            <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
              <span>💎</span>
              <span>Todo lo que obtienes con tu suscripción ($2/mes):</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-black/40 border border-purple-500/20 space-y-1">
                <div className="flex items-center gap-2 text-purple-300 font-bold">
                  <Music className="w-4 h-4" />
                  <span>Reproductor de Música</span>
                </div>
                <p className="text-[11px] text-white/70">
                  Sube tus archivos de música y reproduce en bucle mientras lees. (Gratis: bloqueado).
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-black/40 border border-pink-500/20 space-y-1">
                <div className="flex items-center gap-2 text-pink-300 font-bold">
                  <Type className="w-4 h-4" />
                  <span>Tipografías Góticas (8+)</span>
                </div>
                <p className="text-[11px] text-white/70">
                  Desbloquea Cinzel, Pirata, Unifraktur, Creepster y Lora. (Gratis: solo 4).
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-black/40 border border-amber-500/20 space-y-1">
                <div className="flex items-center gap-2 text-amber-300 font-bold">
                  <ImageIcon className="w-4 h-4" />
                  <span>Fotos de Estantería</span>
                </div>
                <p className="text-[11px] text-white/70">
                  Sube tus propias fotos desde tu dispositivo como fondo de repisas. (Gratis: no).
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-black/40 border border-emerald-500/20 space-y-1">
                <div className="flex items-center gap-2 text-emerald-300 font-bold">
                  <Smile className="w-4 h-4" />
                  <span>Stickers Premium Exclusivos</span>
                </div>
                <p className="text-[11px] text-white/70">
                  Desbloquea la colección completa de stickers góticos, brujiles y dulces. (Gratis: únicamente stickers de gatitos 😸).
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-black/40 border border-teal-500/20 space-y-1">
                <div className="flex items-center gap-2 text-teal-300 font-bold">
                  <Highlighter className="w-4 h-4" />
                  <span>Subrayadores Exclusivos VIP</span>
                </div>
                <p className="text-[11px] text-white/70">
                  Acceso a la paleta completa de 8 colores: Rosa Neón, Rosa Pastel, Púrpura, Lila, Rojo y Verde Esmeralda (Gratis: solo Amarillo y Gris).
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-black/40 border border-rose-500/20 space-y-1">
                <div className="flex items-center gap-2 text-rose-300 font-bold">
                  <Feather className="w-4 h-4" />
                  <span>Baúl de Notas Ilimitado</span>
                </div>
                <p className="text-[11px] text-white/70">
                  Guarda todas tus citas y reflexiones literarias sin el tope de 3 notas.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Solo PayPal Checkout Form & Support (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-gradient-to-b from-[#1c162b] to-[#100d1a] border-2 border-amber-400/50 rounded-3xl p-5 sm:p-6 shadow-[0_0_40px_rgba(251,191,36,0.15)] space-y-4">
            {/* Price Box */}
            <div className="text-center pb-3 border-b border-white/10 space-y-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-[11px] font-extrabold tracking-wide">
                🎁 ¡3 días gratis en PayPal o pago directo en Bs.!
              </span>
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-widest block">
                Suscripción Mensual
              </span>
              <div className="flex items-baseline justify-center gap-1.5">
                <span className="text-xs text-white/70">Solo</span>
                <span className="text-3xl font-extrabold text-white">$2.00</span>
                <span className="text-xs font-semibold text-amber-300">USD / mes</span>
              </div>
              <span className="text-[11px] text-white/70 block">
                PayPal Internacional • Pago Móvil Banesco (Venezuela)
              </span>
            </div>

            {/* Success Message Banner */}
            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-xs text-emerald-200 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Error Message Banner */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-xs text-red-200">
                {errorMessage}
              </div>
            )}

            {/* PayPal & Pago Móvil Subscription Form */}
            <form onSubmit={handlePayPalSubmit} className="space-y-4">
              {/* Method Selector Tabs */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-black/60 border border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethodTab('paypal');
                    setErrorMessage(null);
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    paymentMethodTab === 'paypal'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-[var(--text-muted)] hover:text-white'
                  }`}
                >
                  <span>🅿️</span>
                  <span>PayPal (3d gratis)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethodTab('pago_movil');
                    setErrorMessage(null);
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    paymentMethodTab === 'pago_movil'
                      ? 'bg-emerald-500 text-black shadow-md'
                      : 'text-[var(--text-muted)] hover:text-white'
                  }`}
                >
                  <span>🇻🇪</span>
                  <span>Pago Móvil</span>
                </button>
              </div>

              {paymentMethodTab === 'paypal' && (
                <p className="text-[11px] text-[var(--text-muted)] bg-black/40 border border-white/10 rounded-xl px-3 py-2">
                  🔒 Pago directo y seguro en PayPal: la aplicación no te solicita datos bancarios.
                </p>
              )}

              {/* 2 CASILLAS SEPARADAS OBLIGATORIAS */}
              <div className="p-3.5 rounded-2xl bg-black/50 border border-white/10 space-y-2.5 text-[11px]">
                <h5 className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Casillas de Consentimiento Obligatorias:</span>
                </h5>

                {/* Casilla 1 */}
                <label className="flex items-start gap-2.5 cursor-pointer text-white/90 hover:text-white transition">
                  <input
                    type="checkbox"
                    checked={acceptTermsAndRefund}
                    onChange={(e) => setAcceptTermsAndRefund(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-gray-600 text-amber-500 focus:ring-amber-400 bg-black/80 shrink-0 cursor-pointer accent-amber-400"
                  />
                  <span className="leading-snug text-[11px]">
                    <strong>Casilla 1:</strong> Acepto los{' '}
                    <button
                      type="button"
                      onClick={() => onOpenLegalModal('terms')}
                      className="text-pink-300 underline font-semibold hover:text-white"
                    >
                      Términos y Condiciones
                    </button>
                    {' '}y la{' '}
                    <button
                      type="button"
                      onClick={() => onOpenLegalModal('refund')}
                      className="text-amber-300 underline font-semibold hover:text-white"
                    >
                      Política de Reembolso
                    </button>
                    . Entiendo que las ventas de bienes digitales son definitivas y cancelables en PayPal en cualquier momento.
                  </span>
                </label>

                {/* Casilla 2 */}
                <label className="flex items-start gap-2.5 cursor-pointer text-white/90 hover:text-white transition pt-1 border-t border-white/5">
                  <input
                    type="checkbox"
                    checked={acceptPrivacy}
                    onChange={(e) => setAcceptPrivacy(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-gray-600 text-amber-500 focus:ring-amber-400 bg-black/80 shrink-0 cursor-pointer accent-amber-400"
                  />
                  <span className="leading-snug text-[11px]">
                    <strong>Casilla 2:</strong> Acepto la{' '}
                    <button
                      type="button"
                      onClick={() => onOpenLegalModal('privacy')}
                      className="text-pink-300 underline font-semibold hover:text-white"
                    >
                      Política de Privacidad
                    </button>
                    {' '}y autorizo el tratamiento de los datos mínimos necesarios para verificar mi pago por PayPal o Pago Móvil y activar mi acceso VIP.
                  </span>
                </label>
              </div>

              {/* PAGO SEGÚN MÉTODO SELECCIONADO */}
              {paymentMethodTab === 'paypal' ? (
                <div className="pt-1">
                  <PayPalSubscriptionButton 
                    onSuccess={handlePayPalApprove}
                    onError={() => setErrorMessage('La ventana emergente de PayPal fue bloqueada por el navegador. Pulsa el botón azul «Iniciar 3 días gratis con PayPal» abajo para completar la suscripción.')}
                    onCheckoutClick={() => {
                      if (acceptTermsAndRefund || acceptPrivacy) {
                        vipManager.saveConsentLog({
                          consentType: 'vip_checkout_paypal',
                          termsAccepted: acceptTermsAndRefund,
                          privacyAccepted: acceptPrivacy,
                          refundPolicyAccepted: acceptTermsAndRefund
                        });
                      }
                    }}
                  />
                </div>
              ) : (
                <PagoMovilPanel
                  acceptTermsAndRefund={acceptTermsAndRefund}
                  acceptPrivacy={acceptPrivacy}
                  onValidateConsent={() => {
                    if (!acceptTermsAndRefund || !acceptPrivacy) {
                      setErrorMessage('Debes marcar ambas casillas legales arriba antes de reportar tu Pago Móvil.');
                      return false;
                    }
                    setErrorMessage(null);
                    return true;
                  }}
                />
              )}
            </form>

            {/* SECCIÓN OBLIGATORIA: INSERTAR CÓDIGO DE ACTIVACIÓN VIP */}
            <div className="pt-3 border-t border-amber-400/30 space-y-2.5 bg-gradient-to-br from-amber-950/40 via-black/80 to-black/90 p-4 rounded-2xl border border-amber-400/40 shadow-inner">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-400/20 text-amber-300">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-amber-300">
                      Insertar Código de Activación VIP
                    </h5>
                    <p className="text-[10px] text-amber-200/80">
                      Solo se activa el VIP cuando el código sea insertado por el usuario
                    </p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
                  Activación
                </span>
              </div>

              <p className="text-[11px] text-white/80 leading-relaxed">
                Por políticas de seguridad, el acceso a la membresía VIP se activa única y exclusivamente cuando ingresas tu código de activación. Tras suscribirte por PayPal, tu código de acceso te llegará a tu correo (o puedes ingresar tu ID de suscripción de PayPal). Si necesitas soporte manual, contáctanos en{' '}
                <a
                  href="mailto:nekolover.online@nekolover.Online"
                  className="text-amber-300 underline font-mono font-bold hover:text-white"
                >
                  nekolover.online@nekolover.Online
                </a>.
              </p>

              <form onSubmit={handleActivateManualCode} className="flex flex-col sm:flex-row gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Ingresa tu código de activación VIP"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  className="flex-1 bg-black/90 border border-amber-400/50 rounded-xl px-3.5 py-2 text-xs text-white uppercase font-mono focus:border-amber-400 focus:outline-none placeholder-white/30"
                />
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:opacity-50 text-black text-xs font-extrabold rounded-xl shadow-[0_2px_12px_rgba(245,158,11,0.4)] active:scale-95 transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Crown className="w-3.5 h-3.5 fill-black" />
                  <span>{isProcessing ? 'Verificando en Supabase...' : 'Activar Membresía VIP'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* VERBATIM POLÍTICA DE CANCELACIÓN Y REEMBOLSO (REQUERIDA) */}
      <div className="bg-[var(--card-bg)] border border-amber-400/40 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <span className="text-2xl">💸</span>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-amber-300">
              Política de Cancelación y Reembolso
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Condiciones de venta digital y procedimiento transparente de cancelación
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
          {/* 1. Política de No Reembolso */}
          <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-400/30 space-y-1.5">
            <h4 className="font-bold text-amber-300 flex items-center gap-1.5">
              <span>1.</span> Política de No Reembolso (Bienes Digitales)
            </h4>
            <p className="text-[11px] text-white/80 leading-relaxed">
              Debido a la naturaleza digital e inmediata del acceso Premium (desbloqueo instantáneo de fuentes, stickers, notas y personalización de estanterías), <strong>todas las ventas y cobros de suscripción son definitivos</strong>. No se realizarán reembolsos totales ni parciales por meses de suscripción ya cobrados o transcurridos.
            </p>
          </div>

          {/* 2. Cancelación de la Suscripción */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1.5">
            <h4 className="font-bold text-amber-300 flex items-center gap-1.5">
              <span>2.</span> Cancelación de la Suscripción
            </h4>
            <p className="text-[11px] text-white/80 leading-relaxed mb-1">
              Incluye <strong>3 días de prueba gratis</strong>. El usuario tiene el control total sobre su suscripción y puede cancelarla en cualquier momento para evitar futuros cobros automáticos:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[10px] text-white/70 pl-0.5">
              <li><strong>Prueba de 3 días:</strong> Si cancelas desde PayPal antes de que terminen los 3 días de prueba, no se realizará ningún cobro.</li>
              <li><strong>Procedimiento:</strong> Directamente en tu propia cuenta de <strong>PayPal</strong> (en <em>Pagos con aprobación previa</em> o <em>Suscripciones</em>).</li>
              <li><strong>Efecto:</strong> Mantendrás las funciones VIP hasta que finalice el periodo actual, volviendo al modo gratis al término.</li>
            </ul>
          </div>

          {/* 3. Excepciones de Soporte */}
          <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-400/30 space-y-1.5">
            <h4 className="font-bold text-blue-300 flex items-center gap-1.5">
              <span>3.</span> Excepciones de Soporte
            </h4>
            <p className="text-[11px] text-white/80 leading-relaxed">
              Si experimentas un problema técnico donde PayPal procesó el cobro pero el sistema de automatización no entregó el código de activación por correo electrónico, deberás contactar al soporte a través de{' '}
              <a
                href="mailto:nekolover.online@nekolover.Online"
                className="text-amber-300 underline font-mono font-bold hover:text-white"
              >
                nekolover.online@nekolover.Online
              </a>{' '}
              adjuntando tu comprobante de pago de PayPal para registrar e ingresar tu código de acceso manualmente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
