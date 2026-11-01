import React, { useState } from 'react';
import { 
  X, 
  Crown, 
  Check, 
  Sparkles, 
  CreditCard, 
  ShieldCheck, 
  Music, 
  Type, 
  Image as ImageIcon, 
  Smile, 
  Highlighter, 
  Feather, 
  Lock,
  ArrowRight
} from 'lucide-react';
import { vipManager, VipSubscriptionData } from '../utils/vipManager';

interface VipSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribed?: () => void;
  featureReason?: 'music' | 'fonts' | 'shelf_bg' | 'stickers' | 'highlights' | 'notes' | null;
}

export const VipSubscriptionModal: React.FC<VipSubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSubscribed,
  featureReason
}) => {
  const [subscription, setSubscription] = useState<VipSubscriptionData>(() => vipManager.getSubscription());
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'gpay'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successAnimation, setSuccessAnimation] = useState(false);

  if (!isOpen) return null;

  const isVip = subscription.isVip;

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      const sub = vipManager.subscribe(
        paymentMethod === 'card' ? 'Tarjeta Bancaria' : paymentMethod === 'paypal' ? 'PayPal' : 'Google Pay'
      );
      setSubscription(sub);
      setIsProcessing(false);
      setSuccessAnimation(true);
      onSubscribed?.();

      setTimeout(() => {
        setSuccessAnimation(false);
      }, 3500);
    }, 1200);
  };

  const handleCancelSubscription = () => {
    if (window.confirm('¿Seguro que deseas cancelar tu suscripción VIP? Volverás al plan gratuito con límites.')) {
      vipManager.cancel();
      setSubscription(vipManager.getSubscription());
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
      title: 'Límite de Stickers Gratuitos',
      desc: 'La versión gratuita incluye los primeros 20 stickers. ¡Pásate a VIP para usar la colección completa de stickers ilimitados!',
      icon: '🎀'
    },
    highlights: {
      title: 'Subrayador Esmeralda Exclusivo VIP',
      desc: 'El resaltado en Verde Esmeralda Místico y paletas avanzadas son exclusivos para miembros VIP (el plan gratuito incluye 3 colores).',
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
      <div className="bg-gradient-to-b from-[#181324] via-[#120f1d] to-[#0a0812] border-2 border-amber-400/60 rounded-3xl p-4 sm:p-6 max-w-lg w-full shadow-[0_0_50px_rgba(251,191,36,0.25)] relative modal-animate my-auto max-h-[92vh] flex flex-col">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition z-10"
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
            <p className="text-sm text-amber-200/90 max-w-sm mx-auto">
              Tu suscripción mensual de <strong>$2 USD</strong> está activa. Todas las funciones, música, tipografías, fotos de estantería, stickers y notas ilimitadas están desbloqueadas.
            </p>
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

              {/* Price Tag */}
              <div className="inline-flex items-baseline gap-1 mt-2.5 px-4 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300">
                <span className="text-2xl font-extrabold text-white">$2.00</span>
                <span className="text-xs font-semibold text-amber-300">USD / mes</span>
                <span className="text-[10px] text-pink-300/80 ml-1.5">• Cancela cuando quieras</span>
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

            {/* VIP Status or Benefits list */}
            {isVip ? (
              <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-2xl p-4 text-center space-y-3">
                <div className="inline-flex items-center gap-1.5 text-emerald-300 font-bold text-sm bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Membresía VIP Activa</span>
                </div>
                <p className="text-xs text-emerald-200/80">
                  Plan: <strong>{subscription.planName}</strong>
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
                <div className="pt-2">
                  <button
                    onClick={handleCancelSubscription}
                    className="text-xs text-red-400 hover:text-red-300 underline font-medium"
                  >
                    Cancelar suscripción VIP (volver a cuenta gratuita)
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
                    <span className="text-[10px] text-[var(--text-muted)] block">Gratis: Max 20</span>
                    <span className="text-[11px] text-amber-300 font-bold">VIP: Ilimitados 👑</span>
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
                      <span className="text-[10px] text-[var(--text-muted)]">Rosa, Amatista, Oro y Esmeralda Místico</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[var(--text-muted)] block">Gratis: 3 colores</span>
                    <span className="text-[11px] text-amber-300 font-bold">VIP: Todos 👑</span>
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

            {/* Payment Section for Non-VIP */}
            {!isVip && (
              <form onSubmit={handleSubscribe} className="space-y-3 pt-2 border-t border-white/10">
                <h4 className="text-xs font-bold text-white flex items-center justify-between">
                  <span>Elige tu método de pago seguro:</span>
                  <span className="text-[10px] text-amber-300 flex items-center gap-1 font-mono">
                    <ShieldCheck className="w-3.5 h-3.5" /> 256-bit SSL
                  </span>
                </h4>

                {/* Payment Method Selector */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                      paymentMethod === 'card'
                        ? 'bg-amber-400 text-black border-amber-400 font-bold shadow-md'
                        : 'bg-black/50 text-[var(--text-muted)] border-white/10 hover:text-white'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Tarjeta</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('paypal')}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                      paymentMethod === 'paypal'
                        ? 'bg-amber-400 text-black border-amber-400 font-bold shadow-md'
                        : 'bg-black/50 text-[var(--text-muted)] border-white/10 hover:text-white'
                    }`}
                  >
                    <span>🅿️ PayPal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('gpay')}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                      paymentMethod === 'gpay'
                        ? 'bg-amber-400 text-black border-amber-400 font-bold shadow-md'
                        : 'bg-black/50 text-[var(--text-muted)] border-white/10 hover:text-white'
                    }`}
                  >
                    <span>Google Pay</span>
                  </button>
                </div>

                {/* Credit Card Inputs */}
                {paymentMethod === 'card' && (
                  <div className="space-y-2 bg-black/40 p-3 rounded-2xl border border-white/10">
                    <div>
                      <label className="text-[10px] text-[var(--text-muted)] block mb-1">
                        Nombre en la tarjeta:
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Neko Kuro"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        required
                        className="w-full bg-black/60 border border-[var(--border-color)] rounded-xl px-3 py-1.5 text-xs text-white placeholder-[var(--text-muted)] focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-[var(--text-muted)] block mb-1">
                        Número de tarjeta (Débito / Crédito):
                      </label>
                      <input
                        type="text"
                        maxLength={19}
                        placeholder="4123 4567 8901 2345"
                        value={cardNumber}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, '').slice(0, 16);
                          const formatted = v.match(/.{1,4}/g)?.join(' ') || v;
                          setCardNumber(formatted);
                        }}
                        required
                        className="w-full bg-black/60 border border-[var(--border-color)] rounded-xl px-3 py-1.5 text-xs text-white placeholder-[var(--text-muted)] font-mono focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-[var(--text-muted)] block mb-1">
                          Vencimiento:
                        </label>
                        <input
                          type="text"
                          maxLength={5}
                          placeholder="MM/AA"
                          value={cardExpiry}
                          onChange={(e) => {
                            let v = e.target.value.replace(/\D/g, '').slice(0, 4);
                            if (v.length >= 2) v = v.slice(0, 2) + '/' + v.slice(2);
                            setCardExpiry(v);
                          }}
                          required
                          className="w-full bg-black/60 border border-[var(--border-color)] rounded-xl px-3 py-1.5 text-xs text-white placeholder-[var(--text-muted)] font-mono focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[var(--text-muted)] block mb-1">
                          CVC / CVV:
                        </label>
                        <input
                          type="password"
                          maxLength={4}
                          placeholder="123"
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          required
                          className="w-full bg-black/60 border border-[var(--border-color)] rounded-xl px-3 py-1.5 text-xs text-white placeholder-[var(--text-muted)] font-mono focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod !== 'card' && (
                  <div className="bg-black/40 p-4 rounded-2xl border border-white/10 text-center space-y-1">
                    <p className="text-xs text-white font-medium">
                      Conectarás de forma segura con {paymentMethod === 'paypal' ? 'PayPal' : 'Google Pay'}.
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      Cargo mensual recurrente de $2.00 USD. Sin cargos ocultos.
                    </p>
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3 px-4 rounded-2xl text-black font-extrabold text-sm bg-gradient-to-r from-amber-400 via-amber-300 to-pink-400 hover:from-amber-300 hover:to-pink-300 shadow-[0_0_20px_rgba(245,158,11,0.4)] transition transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Procesando suscripción de $2/mes...</span>
                    </>
                  ) : (
                    <>
                      <Crown className="w-4 h-4 fill-black" />
                      <span>Suscribirme a VIP por $2.00 USD / mes</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-[10px] text-center text-[var(--text-muted)] leading-relaxed">
                  🔒 Pago simulado seguro. Puedes cancelar en cualquier momento desde esta misma ventana con un solo clic.
                </p>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
