import React, { useState } from 'react';
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
  const [paypalEmail, setPaypalEmail] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  
  // Two separate mandatory checkboxes
  const [acceptTermsAndRefund, setAcceptTermsAndRefund] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const isVip = subscription.isVip;

  const handlePayPalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!acceptTermsAndRefund || !acceptPrivacy) {
      setErrorMessage('Debes marcar de forma separada ambas casillas de consentimiento legal antes de continuar.');
      return;
    }

    if (!paypalEmail || !paypalEmail.includes('@') || !paypalEmail.includes('.')) {
      setErrorMessage('Por favor ingresa una dirección de correo válida vinculada a tu cuenta de PayPal.');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      // Save consent log
      vipManager.saveConsentLog({
        consentType: 'vip_checkout_paypal',
        termsAccepted: acceptTermsAndRefund,
        privacyAccepted: acceptPrivacy,
        refundPolicyAccepted: acceptTermsAndRefund,
        email: paypalEmail.trim()
      });

      const sub = vipManager.subscribe('PayPal', paypalEmail.trim());
      setSubscription(sub);
      setIsProcessing(false);
      setSuccessMessage('¡Pago procesado con éxito! Tu membresía VIP ($2 USD/mes) ha sido activada.');
      onSubscribed?.();
    }, 1200);
  };

  const handleActivateManualCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!manualCode.trim()) {
      setErrorMessage('Introduce el código de activación que recibiste por correo o soporte.');
      return;
    }

    const res = vipManager.activateWithCode(manualCode, paypalEmail);
    if (res.success && res.sub) {
      setSubscription(res.sub);
      setSuccessMessage(res.message);
      setManualCode('');
      onSubscribed?.();
    } else {
      setErrorMessage(res.message);
    }
  };

  const handleCancelSubscription = () => {
    if (window.confirm('¿Seguro que deseas cancelar tu suscripción VIP? Mantendrás tus beneficios hasta que finalice el ciclo de 30 días pagado.')) {
      vipManager.cancel();
      setSubscription(vipManager.getSubscription());
      setSuccessMessage('Suscripción cancelada. Volverás al plan gratuito al expirar tu ciclo.');
    }
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
          <h2 className="dark-reborn-font font-bold text-lg sm:text-2xl bg-gradient-to-r from-amber-300 via-pink-400 to-amber-200 bg-clip-text text-transparent flex items-center justify-end gap-2">
            <span>👑</span>
            <span>NekoLover VIP Club</span>
          </h2>
          <p className="text-[11px] text-[var(--text-muted)]">
            Acceso Premium mensual con pasarela exclusiva de PayPal ($2.00 USD/mes)
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
            <button
              onClick={handleCancelSubscription}
              className="px-3 py-1.5 rounded-xl bg-red-950/40 border border-red-500/30 hover:border-red-400 text-red-300 text-xs font-medium transition"
            >
              Cancelar Renovación en PayPal
            </button>
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
                  <span>Subrayador Esmeralda</span>
                </div>
                <p className="text-[11px] text-white/70">
                  Acceso al cuarto color místico Verde Esmeralda (Gratis: 3 colores).
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
            <div className="text-center pb-3 border-b border-white/10 space-y-1">
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-widest block">
                Suscripción Mensual
              </span>
              <div className="flex items-baseline justify-center gap-1.5">
                <span className="text-3xl font-extrabold text-white">$2.00</span>
                <span className="text-xs font-semibold text-amber-300">USD / mes</span>
              </div>
              <span className="text-[11px] text-white/70 block">
                Pago procesado exclusivamente por PayPal
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

            {/* PayPal Subscription Form */}
            <form onSubmit={handlePayPalSubmit} className="space-y-4">
              {/* Data Minimization: Email only */}
              <div>
                <label className="text-xs font-bold text-white block mb-1">
                  Correo Electrónico de PayPal:
                </label>
                <input
                  type="email"
                  required
                  placeholder="tu-correo@paypal.com"
                  value={paypalEmail}
                  onChange={(e) => setPaypalEmail(e.target.value)}
                  className="w-full bg-black/60 border border-white/20 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none transition font-sans"
                />
                <p className="text-[10px] text-[var(--text-muted)] mt-1">
                  🔒 Principio de minimización: solo solicitamos tu correo para activar y vincular tu cuenta VIP.
                </p>
              </div>

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
                    {' '}y autorizo el uso de mi correo exclusivamente para la activación y gestión de mi suscripción VIP.
                  </span>
                </label>
              </div>

              {/* BOTÓN OFICIAL DE PAYPAL (ÚNICO MÉTODO DE PAGO) */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3.5 px-4 rounded-full bg-[#FFC439] hover:bg-[#F2BA36] active:scale-[0.98] transition shadow-[0_4px_20px_rgba(255,196,57,0.35)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2 text-[#003087] font-bold text-xs sm:text-sm">
                    <div className="w-4 h-4 border-2 border-[#003087] border-t-transparent rounded-full animate-spin" />
                    <span>Conectando con PayPal...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xl italic font-black tracking-tight select-none">
                      <span className="text-[#003087]">Pay</span><span className="text-[#0079C1]">Pal</span>
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold text-black">
                      Suscribirse ($2.00 USD / mes)
                    </span>
                  </div>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-white/60">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Transacción cifrada y protegida por PayPal</span>
              </div>
            </form>

            {/* SECCIÓN 3: EXCEPCIONES DE SOPORTE & CÓDIGO MANUAL */}
            <div className="pt-3 border-t border-white/10 space-y-2">
              <button
                type="button"
                onClick={() => setShowCodeInput(!showCodeInput)}
                className="w-full text-left text-xs font-semibold text-amber-300 hover:text-white flex items-center justify-between"
              >
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>¿Ya compraste o tienes código de activación?</span>
                </span>
                <span className="text-xs font-mono">{showCodeInput ? '▲' : '▼'}</span>
              </button>

              {showCodeInput && (
                <form onSubmit={handleActivateManualCode} className="p-3 bg-black/60 rounded-2xl border border-amber-400/30 space-y-2">
                  <p className="text-[10px] text-white/80 leading-relaxed">
                    Si PayPal procesó tu cobro y requieres ingresar tu código, o lo solicitaste a soporte, ingrésalo aquí:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ej. NEKO-VIP-2026"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      className="flex-1 bg-black/70 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white uppercase font-mono focus:border-amber-400 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold rounded-xl active:scale-95 transition"
                    >
                      Activar
                    </button>
                  </div>
                  <div className="text-[10px] text-white/70 pt-1">
                    ¿Problemas con tu código? Contacta a soporte:{' '}
                    <a
                      href="https://nekolover.online.zoho.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-300 underline font-mono"
                    >
                      nekolover.online.zoho.com
                    </a>
                  </div>
                </form>
              )}
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
              El usuario tiene el control total sobre su suscripción y puede cancelarla en cualquier momento para evitar futuros cobros automáticos:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[10px] text-white/70 pl-0.5">
              <li><strong>Procedimiento:</strong> Directamente en tu propia cuenta de <strong>PayPal</strong> (en <em>Pagos con aprobación previa</em> o <em>Suscripciones</em>).</li>
              <li><strong>Efecto:</strong> Mantendrás las funciones VIP hasta que finalice el periodo mensual pagado actual, volviendo al modo gratis al término.</li>
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
                href="https://nekolover.online.zoho.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-300 underline font-mono font-bold hover:text-white"
              >
                nekolover.online.zoho.com
              </a>{' '}
              adjuntando tu comprobante de pago de PayPal para registrar e ingresar tu código de acceso manualmente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
