import React, { useState, useEffect } from 'react';
import {
  Copy,
  Check,
  Smartphone,
  Send,
  MessageCircle,
  RefreshCw,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { registrarPagoMovilEnSupabase } from '../utils/supabase';
import { vipManager } from '../utils/vipManager';

const PAGO_MOVIL_ACCOUNT = {
  bankName: 'Banesco (0134)',
  cedulaDisplay: 'V-26727126',
  cedulaCopy: '26727126',
  phoneDisplay: '+58 412-8432704',
  phoneLocalCopy: '04128432704',
  whatsappNumber: '584128432704',
  amountUsd: 2
};

const VENEZUELAN_BANKS = [
  'Banesco (0134)',
  'Banco de Venezuela (0102)',
  'Mercantil (0105)',
  'BBVA Provincial (0108)',
  'BNC - Nacional de Crédito (0191)',
  'Bancamiga (0172)',
  'Bancaribe (0114)',
  'Banco Exterior (0115)',
  'Banco Plaza (0138)',
  'Venezolano de Crédito (0104)',
  'Banco del Tesoro (0163)',
  'Bicentenario (0175)',
  'Otro banco nacional'
];

interface PagoMovilPanelProps {
  onValidateConsent: () => boolean;
  acceptTermsAndRefund: boolean;
  acceptPrivacy: boolean;
}

export const PagoMovilPanel: React.FC<PagoMovilPanelProps> = ({
  onValidateConsent,
  acceptTermsAndRefund,
  acceptPrivacy
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [bcvRate, setBcvRate] = useState<number | null>(null);
  const [loadingRate, setLoadingRate] = useState(false);

  const [bancoEmisor, setBancoEmisor] = useState('Banesco (0134)');
  const [telefonoEmisor, setTelefonoEmisor] = useState('');
  const [referencia, setReferencia] = useState('');
  const [montoBs, setMontoBs] = useState('');
  const [contactoUsuario, setContactoUsuario] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedReceipt, setSubmittedReceipt] = useState<{
    reportId: string;
    savedToSupabase: boolean;
    message: string;
    whatsappUrl: string;
  } | null>(null);

  const fetchBcvRate = async () => {
    setLoadingRate(true);
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 5000) : null;
    try {
      const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', {
        referrerPolicy: 'no-referrer',
        signal: controller?.signal
      });
      if (res.ok) {
        const json = await res.json();
        const rate = Number(json?.promedio);
        if (Number.isFinite(rate) && rate > 1 && rate < 100000) {
          setBcvRate(rate);
          const totalBs = (rate * PAGO_MOVIL_ACCOUNT.amountUsd).toFixed(2);
          setMontoBs((prev) => (prev.trim() ? prev : totalBs));
        }
      }
    } catch {
      // Silencioso si está sin conexión; el lector puede ingresar el monto manual a tasa BCV del día
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      setLoadingRate(false);
    }
  };

  useEffect(() => {
    void fetchBcvRate();
  }, []);

  const handleCopy = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(key);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Ignore clipboard failures in restricted environments
    }
  };

  const calculatedBs = bcvRate ? (bcvRate * PAGO_MOVIL_ACCOUNT.amountUsd).toFixed(2) : null;

  const buildWhatsAppUrl = (reportId: string) => {
    const lines = [
      'Hola, reporto mi Pago Móvil para NekoLover Read VIP ($2.00 USD):',
      `• ID Reporte: ${reportId}`,
      `• Referencia: ${referencia.trim()}`,
      `• Banco emisor: ${bancoEmisor}`,
      `• Teléfono emisor: ${telefonoEmisor.trim()}`,
      `• Monto pagado: ${montoBs.trim() ? `${montoBs.trim()} Bs.` : '$2 USD a tasa BCV'}`,
      `• Enviar código VIP a: ${contactoUsuario.trim()}`
    ];
    return `https://wa.me/${PAGO_MOVIL_ACCOUNT.whatsappNumber}?text=${encodeURIComponent(lines.join('\n'))}`;
  };

  const handleSubmitReport = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError(null);

    if (!onValidateConsent()) {
      return;
    }

    setIsSubmitting(true);
    try {
      vipManager.saveConsentLog({
        consentType: 'vip_checkout_pago_movil',
        termsAccepted: acceptTermsAndRefund,
        privacyAccepted: acceptPrivacy,
        refundPolicyAccepted: acceptTermsAndRefund
      });

      const res = await registrarPagoMovilEnSupabase({
        referencia,
        bancoEmisor,
        telefonoEmisor,
        montoBs: montoBs || (calculatedBs ?? ''),
        contactoUsuario,
        tasaBcvReferencia: bcvRate
      });

      if (!res.success) {
        setFormError(res.message);
        return;
      }

      setSubmittedReceipt({
        reportId: res.reportId,
        savedToSupabase: res.savedToSupabase,
        message: res.message,
        whatsappUrl: buildWhatsAppUrl(res.reportId)
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3 bg-gradient-to-br from-emerald-950/35 via-black/75 to-amber-950/25 p-3.5 rounded-2xl border border-emerald-400/35">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shrink-0">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>🇻🇪 Pago Móvil (Venezuela)</span>
            </h4>
            <p className="text-[10px] text-emerald-200/80">
              Persona Natural • Validación con Nº de referencia
            </p>
          </div>
        </div>
        <span className="text-[10px] text-emerald-300 flex items-center gap-1 font-mono bg-black/40 px-2 py-0.5 rounded-md border border-emerald-500/20 shrink-0">
          <ShieldCheck className="w-3 h-3" /> $2 USD / mes
        </span>
      </div>

      {/* Datos Bancarios para Transferir */}
      <div className="bg-black/60 border border-white/10 rounded-xl p-3 space-y-2 text-[11px]">
        <div className="flex items-center justify-between">
          <span className="font-bold text-amber-300">Datos para tu Pago Móvil:</span>
          <button
            type="button"
            onClick={() =>
              handleCopy(
                'all',
                `Banesco (0134)\nCédula: ${PAGO_MOVIL_ACCOUNT.cedulaCopy}\nTeléfono: ${PAGO_MOVIL_ACCOUNT.phoneLocalCopy}${calculatedBs ? `\nMonto: ${calculatedBs} Bs.` : ''}`
              )
            }
            className="text-[10px] px-2 py-0.5 rounded-md bg-amber-400/15 hover:bg-amber-400/25 text-amber-300 border border-amber-400/30 flex items-center gap-1 cursor-pointer transition"
          >
            {copiedField === 'all' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedField === 'all' ? '¡Copiado!' : 'Copiar todo'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-1.5">
          <div className="flex items-center justify-between bg-white/5 rounded-lg px-2.5 py-1.5">
            <div>
              <span className="text-[10px] text-[var(--text-muted)] block">Banco destino</span>
              <span className="font-bold text-white">{PAGO_MOVIL_ACCOUNT.bankName}</span>
            </div>
            <button
              type="button"
              onClick={() => handleCopy('bank', '0134')}
              className="text-[10px] text-emerald-300 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              {copiedField === 'bank' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>0134</span>
            </button>
          </div>

          <div className="flex items-center justify-between bg-white/5 rounded-lg px-2.5 py-1.5">
            <div>
              <span className="text-[10px] text-[var(--text-muted)] block">Cédula</span>
              <span className="font-bold text-white font-mono">{PAGO_MOVIL_ACCOUNT.cedulaDisplay}</span>
            </div>
            <button
              type="button"
              onClick={() => handleCopy('cedula', PAGO_MOVIL_ACCOUNT.cedulaCopy)}
              className="text-[10px] px-2 py-0.5 rounded bg-black/50 text-emerald-300 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              {copiedField === 'cedula' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copiedField === 'cedula' ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between bg-white/5 rounded-lg px-2.5 py-1.5">
            <div>
              <span className="text-[10px] text-[var(--text-muted)] block">Teléfono</span>
              <span className="font-bold text-white font-mono">{PAGO_MOVIL_ACCOUNT.phoneDisplay}</span>
            </div>
            <button
              type="button"
              onClick={() => handleCopy('phone', PAGO_MOVIL_ACCOUNT.phoneLocalCopy)}
              className="text-[10px] px-2 py-0.5 rounded bg-black/50 text-emerald-300 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              {copiedField === 'phone' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copiedField === 'phone' ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>
        </div>

        {/* Monto en Bs. a tasa BCV */}
        <div className="flex items-center justify-between pt-1.5 border-t border-white/10 text-[11px]">
          <div>
            <span className="text-[var(--text-muted)]">Monto ($2.00 USD): </span>
            {calculatedBs ? (
              <strong className="text-emerald-300 font-mono">
                {calculatedBs} Bs.{' '}
                <span className="text-[10px] font-normal text-white/60">
                  (Tasa BCV: {bcvRate?.toFixed(2)} Bs/$)
                </span>
              </strong>
            ) : (
              <strong className="text-amber-200">Equivalente a $2.00 USD (tasa BCV del día)</strong>
            )}
          </div>
          <button
            type="button"
            onClick={() => void fetchBcvRate()}
            disabled={loadingRate}
            className="text-[10px] text-white/60 hover:text-white flex items-center gap-1 cursor-pointer"
            title="Actualizar tasa BCV"
          >
            <RefreshCw className={`w-3 h-3 ${loadingRate ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Confirmación de reporte enviado + WhatsApp */}
      {submittedReceipt ? (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-400/50 space-y-2.5 text-xs">
          <div className="flex items-start gap-2 text-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-white">
                {submittedReceipt.savedToSupabase
                  ? '¡Pago Móvil reportado en el sistema!'
                  : '¡Comprobante de Pago Móvil preparado!'}
              </p>
              <p className="text-[11px] leading-relaxed text-emerald-100/90">
                {submittedReceipt.message}
              </p>
            </div>
          </div>

          <a
            href={submittedReceipt.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Enviar Comprobante por WhatsApp</span>
          </a>

          <p className="text-[10px] text-white/70 text-center">
            Una vez verificada la referencia, recibirás tu código VIP para ingresarlo en la casilla de abajo.
          </p>

          <button
            type="button"
            onClick={() => setSubmittedReceipt(null)}
            className="w-full text-[10px] text-white/60 hover:text-white underline cursor-pointer"
          >
            Reportar otra referencia
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <h5 className="text-[11px] font-bold text-white">
            Reportar tu Pago Móvil realizado:
          </h5>

          {formError && (
            <div className="p-2 rounded-lg bg-red-950/70 border border-red-500/50 text-[11px] text-red-200">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-[var(--text-muted)] block mb-0.5">
                Tu banco emisor
              </label>
              <select
                value={bancoEmisor}
                onChange={(e) => setBancoEmisor(e.target.value)}
                className="w-full bg-black/80 border border-white/15 rounded-xl px-2.5 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none"
              >
                {VENEZUELAN_BANKS.map((bank) => (
                  <option key={bank} value={bank}>
                    {bank}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-[var(--text-muted)] block mb-0.5">
                Tu teléfono emisor
              </label>
              <input
                type="tel"
                placeholder="Ej: 0412-1234567"
                value={telefonoEmisor}
                onChange={(e) => setTelefonoEmisor(e.target.value)}
                className="w-full bg-black/80 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none placeholder-white/30"
              />
            </div>

            <div>
              <label className="text-[10px] text-[var(--text-muted)] block mb-0.5">
                Nº de Referencia
              </label>
              <input
                type="text"
                placeholder="Últimos 6 dígitos o completa"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                className="w-full bg-black/80 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-emerald-400 focus:outline-none placeholder-white/30"
              />
            </div>

            <div>
              <label className="text-[10px] text-[var(--text-muted)] block mb-0.5">
                Monto pagado (Bs.)
              </label>
              <input
                type="text"
                placeholder={calculatedBs ? `${calculatedBs} Bs.` : 'Monto en Bs.'}
                value={montoBs}
                onChange={(e) => setMontoBs(e.target.value)}
                className="w-full bg-black/80 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-emerald-400 focus:outline-none placeholder-white/30"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-[var(--text-muted)] block mb-0.5">
              Tu WhatsApp o Correo (para enviarte el código VIP)
            </label>
            <input
              type="text"
              placeholder="Ej: +58 412... o tucorreo@ejemplo.com"
              value={contactoUsuario}
              onChange={(e) => setContactoUsuario(e.target.value)}
              className="w-full bg-black/80 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none placeholder-white/30"
            />
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => void handleSubmitReport()}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 disabled:opacity-50 text-black text-xs font-extrabold shadow-[0_2px_12px_rgba(16,185,129,0.35)] active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Registrando Pago Móvil...' : 'Reportar Pago Móvil y Enviar Comprobante'}</span>
          </button>

          <div className="text-center pt-0.5">
            <a
              href={`https://wa.me/${PAGO_MOVIL_ACCOUNT.whatsappNumber}?text=${encodeURIComponent(
                'Hola, quiero consultar / enviar comprobante de Pago Móvil para NekoLover Read VIP ($2 USD).'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-emerald-300 hover:text-emerald-200 underline"
            >
              <MessageCircle className="w-3 h-3" />
              <span>¿Dudas con el pago? Escribir directo por WhatsApp</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
