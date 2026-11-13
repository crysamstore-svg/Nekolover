import React, { useState, useEffect } from 'react';
import { 
  X, 
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
  ArrowRight,
  ExternalLink,
  Lock,
  FileText,
  KeyRound
} from 'lucide-react';
import { vipManager, VipSubscriptionData } from '../utils/vipManager';
import { LegalTab } from './LegalModal';
import { PayPalSubscriptionButton } from './PayPalSubscriptionButton';

interface VipSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribed?: () => void;
  onOpenLegalModal?: (tab: LegalTab) => void;
  featureReason?: 'music' | 'fonts' | 'shelf_bg' | 'stickers' | 'highlights' | 'notes' | null;
}

export const VipSubscriptionModal: React.FC<VipSubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSubscribed,
  onOpenLegalModal,
  featureReason
}) => {
  const [subscription, setSubscription] = useState<VipSubscriptionData>(() => vipManager.getSubscription());
  // Data minimization: Strictly ONLY PayPal email address is requested
  const [paypalEmail, setPaypalEmail] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [codeSuccessMessage, setCodeSuccessMessage] = useState<string | null>(null);
  
  // Mandatory separate legal checkboxes (Two separate boxes as strictly required)
  const [acceptTermsAndRefund, setAcceptTermsAndRefund] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [payPalNotice, setPayPalNotice] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successAnimation, setSuccessAnimation] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSubscription(vipManager.getSubscription());
      setConfirmingCancel(false);
    }
    const unsub = vipManager.onVipChange(() => {
      setSubscription(vipManager.getSubscription());
    });
    return unsub;
  }, [isOpen]);

  if (!isOpen) return null;

  const isVip = subscription.isVip;

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Verify both checkboxes are independently checked
    if (!acceptTermsAndRefund || !acceptPrivacy) {
      setValidationError('Debes marcar ambas casillas de verificación por separado para continuar de conformidad con la ley.');
      return;
    }

    // Email format validation
    if (!paypalEmail || !paypalEmail.includes('@') || !paypalEmail.includes('.')) {
      setValidationError('Por favor, introduce una dirección de correo electrónico válida asociada a tu cuenta de PayPal.');
      return;
    }

    // Direct user to click the official PayPal button or enter an existing code
    setValidationError('Para suscribirte, utiliza el botón oficial de PayPal arriba. Una vez completado, inserta el código de activación en la casilla para activar tu membresía VIP.');
  };

  const handlePayPalApprove = (subscriptionId: string) => {
    // Guardar registro legal de consentimiento
    vipManager.saveConsentLog({
      consentType: 'vip_checkout_paypal',
      termsAccepted: true,
      privacyAccepted: true,
      refundPolicyAccepted: true,
      email: paypalEmail.trim() || 'subscriber-paypal@user.com'
    });

    setManualCode(subscriptionId);
    setShowCodeInput(true);
    setPayPalNotice(`✅ ¡Pago registrado por PayPal con éxito! (ID: ${subscriptionId}). Tu código de activación ha sido enviado a tu correo o puedes usar este ID.`);
  };

  const handleCancelSubscription = () => {
    vipManager.cancel();
    setSubscription(vipManager.getSubscription());
    setConfirmingCancel(false);
    setCodeSuccessMessage(null);
    setValidationError(null);
  };

  const handleActivateManualCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setValidationError(null);
    setCodeSuccessMessage(null);

    if (!manualCode.trim()) {
      setValidationError('Por favor introduce tu código de activación en la casilla.');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await vipManager.activateWithCodeAsync(manualCode, paypalEmail);
      if (res.success && res.sub) {
        setSubscription(res.sub);
        setCodeSuccessMessage(res.message);
        setPayPalNotice(null);
        setSuccessAnimation(true);
        onSubscribed?.();

        setTimeout(() => {
          setSuccessAnimation(false);
        }, 4000);
      } else {
        setValidationError(res.message);
      }
    } catch (err: any) {
      setValidationError('Error de conexión al validar código con Supabase.');
    } finally {
      setIsProcessing(false);
    }
  };

  const reasonMessages: Record<string, { title: string; desc: string; icon: string }> = {
    music: {
      title: 'Reproductor de Música Exclusivo VIP',
      desc: 'El reproductor de música de fondo y la subida de canciones desde tus archivos son funciones de la suscripción VIP.',
      icon: '🎵'
    },
    fonts: {
      title: 'Tipografías Góticas & Literarias VIP',
      desc: 'La versión gratuita incluye 4 tipografías. Suscríbete a VIP para desbloquear todas las fuentes góticas, medievales y literarias.',
      icon: '🔤'
    },
    shelf_bg: {
      title: 'Fondo de Estantería con Tus Fotos',
      desc: 'Subir imágenes y texturas personalizadas desde tus archivos es exclusivo para miembros VIP.',
      icon: '🖼️'
    },
    stickers: {
      title: 'Stickers Premium Exclusivos VIP',
      desc: 'En el modo gratuito solo los stickers de gatitos (😸😹😻😼😽🙀😿😾😺🐈‍⬛🐱🐾) son libres. ¡Suscríbete a VIP ($2/mes) para desbloquear la colección completa de stickers góticos, brujiles y mágicos!',
      icon: '👑'
    },
    highlights: {
      title: 'Colores de Subrayado Exclusivos VIP',
      desc: 'En el plan gratuito tienes Amarillo y Gris. ¡Suscríbete a VIP ($2/mes) para desbloquear Rosa Neón, Rosa Pastel, Púrpura Amatista, Lila Mágico, Rojo Carmesí y Verde Esmeralda!',
      icon: '🌈'
    },
    notes: {
      title: 'Baúl de Notas & Citas Ilimitadas',
      desc: 'Has alcanzado el límite gratuito de 3 notas literarias. Desbloquea citas infinitas con tu suscripción VIP.',
      icon: '🪶'
    }
  };

  const currentReason = featureReason ? reasonMessages[featureReason] : null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 select-none overflow-y-auto">
      <div 
        className="bg-gradient-to-b from-[#181324] via-[#120f1d] to-[#0a0812] border-2 border-amber-400/60 rounded-3xl p-4 sm:p-6 max-w-lg w-full shadow-[0_0_50px_rgba(251,191,36,0.25)] relative modal-animate my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition z-10"
          title="Cerrar ventana"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Celebration Banner when just subscribed */}
        {successAnimation ? (
          <div className="py-10 text-center space-y-4 my-auto">
            <div className="text-6xl animate-bounce">👑✨🎉</div>
            <h3 className="dark-reborn-title text-2xl font-bold bg-gradient-to-r from-amber-300 via-pink-400 to-amber-200 bg-clip-text text-transparent">
              ¡Bienvenido al Club VIP de NekoLover!
            </h3>
            <p className="text-sm text-amber-200/90 max-w-sm mx-auto leading-relaxed">
              Tu suscripción mensual de <strong>$2.00 USD</strong> mediante <strong>PayPal</strong> está activa para <span className="text-white font-mono">{paypalEmail || 'tu cuenta'}</span>.
            </p>
            <div className="bg-black/50 border border-emerald-500/30 p-3 rounded-2xl max-w-xs mx-auto text-xs text-emerald-300 space-y-1">
              <div className="flex items-center justify-center gap-1.5 font-bold">
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Registro de consentimiento guardado</span>
              </div>
              <div className="text-[10px] text-white/70">
                Puedes consultar tu comprobante legal en la sección de Ajustes en cualquier momento.
              </div>
            </div>
            <div className="pt-2">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-400 to-pink-500 text-black font-bold text-sm rounded-2xl shadow-lg hover:scale-105 transition"
              >
                Comenzar a Disfrutar ✨
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-y-auto pr-1 space-y-4 scrollbar-none">
            {/* Header / Crown badge */}
            <div className="text-center pt-2">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-pink-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.5)] mb-2 animate-pulse">
                <Crown className="w-8 h-8 fill-black" />
              </div>
              <h2 className="dark-reborn-title text-xl sm:text-2xl font-bold bg-gradient-to-r from-amber-300 via-pink-300 to-amber-100 bg-clip-text text-transparent">
                NekoLover VIP Club 👑
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                La experiencia literaria definitiva sin límites
              </p>

              {/* Price Tag - Solo PayPal */}
              <div className="inline-flex flex-col items-center mt-2.5 gap-1">
                <div className="inline-flex items-baseline gap-1 px-4 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300">
                  <span className="text-2xl font-extrabold text-white">$2.00</span>
                  <span className="text-xs font-semibold text-amber-300">USD / mes</span>
                  <span className="text-[10px] text-pink-300/90 ml-1.5 font-semibold">• Procesado vía PayPal</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-amber-200/80">
                  <span>🅿️ Pago exclusivo por PayPal</span>
                  <span>•</span>
                  <span>Cancela en cualquier momento</span>
                </div>
              </div>
            </div>

            {/* Contextual Warning if blocked by a specific feature */}
            {currentReason && !isVip && (
              <div className="bg-pink-950/40 border border-pink-500/50 rounded-2xl p-3 flex items-start gap-3">
                <span className="text-2xl shrink-0">{currentReason.icon}</span>
                <div>
                  <h4 className="text-xs font-bold text-pink-300">
                    {currentReason.title}
                  </h4>
                  <p className="text-[11px] text-pink-200/80 mt-0.5 leading-relaxed">
                    {currentReason.desc}
                  </p>
                </div>
              </div>
            )}

            {/* VIP Status for Active Members */}
            {isVip ? (
              <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-2xl p-4 text-center space-y-3">
                <div className="inline-flex items-center gap-1.5 text-emerald-300 font-bold text-sm bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Membresía VIP Activa</span>
                </div>
                <p className="text-xs text-emerald-200/80">
                  Plan: <strong>{subscription.planName}</strong>
                  <br />
                  Método: <strong>PayPal</strong> ({subscription.email || 'correo guardado'})
                  <br />
                  Válido hasta:{' '}
                  {subscription.expiresAt
                    ? new Date(subscription.expiresAt).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })
                    : 'Indefinido'}
                </p>
                <div className="pt-2 flex flex-col items-center gap-2">
                  {confirmingCancel ? (
                    <div className="flex flex-col items-center gap-2 bg-red-950/50 border border-red-500/40 rounded-xl p-2.5 w-full">
                      <span className="text-[11px] text-red-200 font-semibold">
                        ¿Confirmas volver al Plan Gratuito ahora?
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCancelSubscription}
                          className="px-3 py-1 rounded-lg bg-red-500 hover:bg-red-400 text-white text-xs font-bold transition cursor-pointer"
                        >
                          Sí, cancelar VIP
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingCancel(false)}
                          className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition cursor-pointer"
                        >
                          No, mantener
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmingCancel(true)}
                      className="text-xs text-red-400 hover:text-red-300 underline font-medium cursor-pointer"
                    >
                      Cancelar VIP y volver al plan gratuito
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onOpenLegalModal?.('audit')}
                    className="text-[11px] text-amber-300 hover:text-white flex items-center gap-1 font-mono"
                  >
                    <span>📜 Ver mi registro de consentimiento legal</span>
                  </button>
                </div>
              </div>
            ) : null}

            {/* Comparison / Benefits Grid */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Beneficios Incluidos en tu Suscripción ($2/mes)</span>
              </h4>

              <div className="grid grid-cols-1 gap-2 text-xs">
                {/* 1. Música */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-amber-400/20">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300">
                      <Music className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-white block">Reproductor de Música</span>
                      <span className="text-[10px] text-[var(--text-muted)]">Subir canciones de tus archivos y fondo continuo</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-red-400 line-through block">Gratis: Bloqueado</span>
                    <span className="text-[11px] text-amber-300 font-bold">VIP: Ilimitado 👑</span>
                  </div>
                </div>

                {/* 2. Tipografías */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-amber-400/20">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-pink-500/20 text-pink-300">
                      <Type className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-white block">Tipografías Góticas & Literarias</span>
                      <span className="text-[10px] text-[var(--text-muted)]">Cinzel, Pirata, Unifraktur, Creepster, Lora</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[var(--text-muted)] block">Gratis: Solo 4</span>
                    <span className="text-[11px] text-amber-300 font-bold">VIP: Todas (8+) 👑</span>
                  </div>
                </div>

                {/* 3. Fotos de Estantería */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-amber-400/20">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-white block">Estantería con Tus Propias Fotos</span>
                      <span className="text-[10px] text-[var(--text-muted)]">Sube texturas y fotos desde tu dispositivo</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-red-400 line-through block">Gratis: No</span>
                    <span className="text-[11px] text-amber-300 font-bold">VIP: Sí 👑</span>
                  </div>
                </div>

                {/* 4. Stickers */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-amber-400/20">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-pink-500/20 text-pink-300">
                      <Smile className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-white block">Stickers Kawaii</span>
                      <span className="text-[10px] text-[var(--text-muted)]">Pegar y mover sobre cualquier página</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[var(--text-muted)] block">Gratis: Solo gatitos 😸</span>
                    <span className="text-[11px] text-amber-300 font-bold">VIP: Todos los stickers 👑</span>
                  </div>
                </div>

                {/* 5. Subrayado */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-amber-400/20">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300">
                      <Highlighter className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-white block">Colores de Subrayado</span>
                      <span className="text-[10px] text-[var(--text-muted)]">Rosa, Púrpura, Lila, Gris, Rosa Pastel, Rojo, Amarillo y Esmeralda</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[var(--text-muted)] block">Gratis: Solo Gris y Amarillo</span>
                    <span className="text-[11px] text-amber-300 font-bold">VIP: Los 8 colores 👑</span>
                  </div>
                </div>

                {/* 6. Notas y Citas */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-amber-400/20">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300">
                      <Feather className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-white block">Baúl de Notas Literarias & Citas</span>
                      <span className="text-[10px] text-[var(--text-muted)]">Guardar reflexiones y citas favoritas</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[var(--text-muted)] block">Gratis: 3 notas</span>
                    <span className="text-[11px] text-amber-300 font-bold">VIP: Ilimitadas 👑</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Section for Non-VIP (SOLO PAYPAL & 2 CASILLAS SEPARADAS) */}
            {!isVip && (
              <form onSubmit={handleSubscribe} className="space-y-3.5 pt-3 border-t border-white/10">
                <div className="bg-gradient-to-r from-blue-950/60 to-indigo-950/40 p-3.5 rounded-2xl border border-blue-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow">
                        🅿️
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">Suscripción Exclusiva por PayPal</h4>
                        <p className="text-[10px] text-blue-200/80">Pasarela oficial y segura de PayPal</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-amber-300 flex items-center gap-1 font-mono bg-black/40 px-2 py-0.5 rounded-md border border-white/5">
                      <ShieldCheck className="w-3 h-3" /> SSL 256-bit
                    </span>
                  </div>

                  {/* DATA MINIMIZATION: Ask ONLY for the user's PayPal email */}
                  <div>
                    <label className="text-[11px] font-semibold text-white block mb-1">
                      Correo Electrónico de tu Cuenta de PayPal:
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="tu-correo-paypal@ejemplo.com"
                      value={paypalEmail}
                      onChange={(e) => setPaypalEmail(e.target.value)}
                      className="w-full bg-black/70 border border-white/15 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none transition font-sans"
                    />
                    <p className="text-[10px] text-[var(--text-muted)] mt-1">
                      🔒 <strong>Minimización de datos:</strong> Solo te pedimos tu correo de PayPal para gestionar tu suscripción y enviarte el código de activación. No pedimos tarjeta, teléfono ni domicilio.
                    </p>
                  </div>
                </div>

                {/* Error Banner */}
                {validationError && (
                  <div className="bg-red-950/70 border border-red-500/50 p-2.5 rounded-xl text-xs text-red-200">
                    {validationError}
                  </div>
                )}

                {/* 2 CASILLAS SEPARADAS OBLIGATORIAS (RGPD & LEGAL COMPLIANCE) */}
                <div className="space-y-2.5 bg-black/40 p-3.5 rounded-2xl border border-white/10 text-[11px]">
                  <h5 className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Consentimientos Legales Requeridos (2 Casillas Separadas):</span>
                  </h5>

                  {/* CASILLA 1: TÉRMINOS Y CONDICIONES + POLÍTICA DE REEMBOLSO */}
                  <label className="flex items-start gap-2.5 cursor-pointer text-white/90 hover:text-white transition">
                    <input
                      type="checkbox"
                      checked={acceptTermsAndRefund}
                      onChange={(e) => setAcceptTermsAndRefund(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-gray-600 text-amber-500 focus:ring-amber-400 bg-black/80 shrink-0 cursor-pointer accent-amber-400"
                    />
                    <span className="leading-snug text-[11px]">
                      <strong>Casilla 1:</strong> He leído y acepto los{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          onOpenLegalModal?.('terms');
                        }}
                        className="text-[var(--accent-pink)] underline hover:text-pink-300 font-semibold"
                      >
                        Términos y Condiciones de Uso
                      </button>
                      {' '}y la{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          onOpenLegalModal?.('refund');
                        }}
                        className="text-amber-300 underline hover:text-amber-200 font-semibold"
                      >
                        Política de Reembolso
                      </button>
                      . Entiendo y consiento que al tratarse de contenido digital con suministro inmediato no se admiten devoluciones por periodos ya facturados, pudiendo cancelar en cualquier momento desde mi cuenta de PayPal.
                    </span>
                  </label>

                  {/* CASILLA 2: POLÍTICA DE PRIVACIDAD & CORREO PAYPAL */}
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
                        onClick={(e) => {
                          e.preventDefault();
                          onOpenLegalModal?.('privacy');
                        }}
                        className="text-[var(--accent-pink)] underline hover:text-pink-300 font-semibold"
                      >
                        Política de Privacidad
                      </button>
                      {' '}y consiento de forma libre e inequívoca el tratamiento de mi correo electrónico de PayPal única y exclusivamente para la activación, comprobante de pago y soporte de mi suscripción VIP.
                    </span>
                  </label>
                </div>

                {/* Code Success Banner */}
                {codeSuccessMessage && (
                  <div className="bg-emerald-950/70 border border-emerald-500/50 p-2.5 rounded-xl text-xs text-emerald-200">
                    {codeSuccessMessage}
                  </div>
                )}

                {/* BOTÓN OFICIAL DE SUSCRIPCIÓN DE PAYPAL (Plan P-0GH31223S1526604TNLUBBEQ) */}
                <div className="pt-1">
                  <PayPalSubscriptionButton 
                    onSuccess={handlePayPalApprove}
                    onError={(err) => setValidationError('Error al procesar el pago con PayPal. Intenta de nuevo.')}
                  />
                </div>

                {/* SECCIÓN OBLIGATORIA: INSERTAR CÓDIGO DE ACTIVACIÓN VIP */}
                <div className="pt-3 border-t border-amber-400/30 space-y-2.5 bg-gradient-to-br from-amber-950/40 via-black/80 to-black/90 p-3.5 rounded-2xl border border-amber-400/40 shadow-inner">
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

                  <p className="text-[10px] text-white/80 leading-relaxed">
                    De conformidad con nuestras políticas de seguridad, el acceso VIP únicamente se activará cuando insertes tu código de activación. Al suscribirte por PayPal, tu código es entregado a tu correo o puedes usar tu ID de transacción. Si necesitas asistencia, escribe a{' '}
                    <a
                      href="https://nekolover.online.zoho.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-300 underline font-mono font-bold hover:text-white"
                    >
                      nekolover.online.zoho.com
                    </a>.
                  </p>

                  {payPalNotice && (
                    <div className="p-2.5 rounded-xl bg-blue-950/80 border border-blue-400/60 text-[11px] text-blue-200 animate-fadeIn">
                      {payPalNotice}
                    </div>
                  )}

                  <div className="flex flex-col gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Ej. NEKO-VIP-2026 o ID de PayPal"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                      className="w-full bg-black/90 border border-amber-400/50 rounded-xl px-3.5 py-2.5 text-xs text-white uppercase font-mono focus:border-amber-400 focus:outline-none placeholder-white/30"
                    />
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={handleActivateManualCode}
                      className="w-full px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:opacity-50 text-black text-xs font-extrabold rounded-xl shadow-[0_2px_12px_rgba(245,158,11,0.4)] active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Crown className="w-3.5 h-3.5 fill-black" />
                      <span>{isProcessing ? 'Verificando en Supabase...' : 'Activar Membresía VIP'}</span>
                    </button>
                  </div>
                </div>

                {/* Additional Trust & Transparency badges */}
                <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] pt-1 px-1">
                  <button
                    type="button"
                    onClick={() => onOpenLegalModal?.('cookies')}
                    className="hover:text-white underline cursor-pointer"
                  >
                    🍪 Cookies y Almacenamiento
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenLegalModal?.('audit')}
                    className="hover:text-amber-300 text-amber-400/90 underline cursor-pointer flex items-center gap-1"
                  >
                    <span>📜 Registro de Consentimiento</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
