import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  ShieldCheck, 
  Cookie, 
  RotateCcw, 
  CheckCircle2, 
  ExternalLink,
  Clock,
  Layers,
  Sparkles,
  Lock,
  HeartHandshake
} from 'lucide-react';
import { vipManager, ConsentLogRecord } from '../utils/vipManager';

export type LegalTab = 'terms' | 'privacy' | 'cookies' | 'refund' | 'audit';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalTab;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'terms'
}) => {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);
  const consentLogs = vipManager.getConsentLogs();
  const latestConsent = vipManager.getLatestConsent();

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none overflow-y-auto">
      <div 
        className="bg-gradient-to-b from-[#181324] via-[#120f1d] to-[#0a0812] border-2 border-[var(--accent-pink)]/40 rounded-3xl max-w-2xl w-full shadow-[0_0_40px_rgba(255,121,198,0.2)] flex flex-col max-h-[92dvh] overflow-hidden modal-animate my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-black/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[var(--accent-pink)] to-[var(--accent-purple)] flex items-center justify-center text-lg shadow-md text-white">
              ⚖️
            </div>
            <div>
              <h3 className="dark-reborn-font font-bold text-base sm:text-lg text-[var(--accent-pink)] flex items-center gap-2">
                <span>Centro Legal y Transparencia</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-mono">
                  v1.0.0
                </span>
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                Términos, Privacidad, Cookies, Reembolsos y Registro de Consentimiento
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-2 bg-black/40 border-b border-white/5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('terms')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shrink-0 ${
              activeTab === 'terms'
                ? 'bg-[var(--accent-pink)] text-black font-bold shadow-md'
                : 'text-[var(--text-muted)] hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Términos y Condiciones</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shrink-0 ${
              activeTab === 'privacy'
                ? 'bg-[var(--accent-pink)] text-black font-bold shadow-md'
                : 'text-[var(--text-muted)] hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Privacidad</span>
          </button>

          <button
            onClick={() => setActiveTab('cookies')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shrink-0 ${
              activeTab === 'cookies'
                ? 'bg-[var(--accent-pink)] text-black font-bold shadow-md'
                : 'text-[var(--text-muted)] hover:text-white hover:bg-white/5'
            }`}
          >
            <Cookie className="w-3.5 h-3.5" />
            <span>Cookies y Almacenamiento</span>
          </button>

          <button
            onClick={() => setActiveTab('refund')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shrink-0 ${
              activeTab === 'refund'
                ? 'bg-[var(--accent-pink)] text-black font-bold shadow-md'
                : 'text-[var(--text-muted)] hover:text-white hover:bg-white/5'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reembolsos</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shrink-0 ${
              activeTab === 'audit'
                ? 'bg-amber-400 text-black font-bold shadow-md'
                : 'text-amber-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Registro de Consentimiento</span>
            {consentLogs.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/60 text-white font-mono">
                {consentLogs.length}
              </span>
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs text-white/90 leading-relaxed scrollbar-none flex-1">
          {/* 1. TÉRMINOS Y CONDICIONES */}
          {activeTab === 'terms' && (
            <div className="space-y-4">
              <div className="bg-black/40 border border-white/10 p-3.5 rounded-2xl">
                <h4 className="font-bold text-sm text-[var(--accent-pink)] mb-1 flex items-center gap-1.5">
                  <span>1.</span> Naturaleza del Servicio (Software Lector)
                </h4>
                <p className="text-[11px] text-white/80">
                  <strong>NekoLover Read</strong> es exclusivamente una herramienta técnica de software (visor digital) diseñada para que el usuario abra, lea, organice y personalice sus propios archivos locales (<strong>EPUB, PDF, TXT</strong>). La aplicación se ejecuta de manera local en el navegador del dispositivo.
                </p>
              </div>

              <div className="bg-black/40 border border-white/10 p-3.5 rounded-2xl">
                <h4 className="font-bold text-sm text-[var(--accent-pink)] mb-1 flex items-center gap-1.5">
                  <span>2.</span> Responsabilidad del Contenido y Derechos de Autor
                </h4>
                <p className="text-[11px] text-white/80 mb-2">
                  El Desarrollador <strong>no almacena, no aloja, no distribuye ni provee ningún tipo de libro o material de lectura comercial</strong>. Es responsabilidad exclusiva del usuario garantizar que cuenta con los derechos o licencias legítimas sobre los archivos que decida cargar en su estantería. El desarrollador se deslinda de cualquier uso ilícito o infracción de propiedad intelectual por parte de terceros.
                </p>
                <div className="bg-pink-950/40 border border-pink-500/30 p-2.5 rounded-xl text-[10px] text-pink-200">
                  <strong>🖼️ Verificación de Derechos de Imágenes:</strong> Todas las ilustraciones de estantería y stickers del sistema son de diseño propio o estándar Unicode libre. Los fondos predeterminados provienen de Unsplash bajo licencia libre.
                </div>
              </div>

              <div className="bg-black/40 border border-white/10 p-3.5 rounded-2xl">
                <h4 className="font-bold text-sm text-[var(--accent-pink)] mb-1 flex items-center gap-1.5">
                  <span>3.</span> Privacidad y Almacenamiento Local
                </h4>
                <p className="text-[11px] text-white/80">
                  Tus archivos de libros, notas, subrayados y configuraciones se guardan únicamente en el almacenamiento local de tu dispositivo (<code className="text-pink-300">IndexedDB</code>). No subimos tus documentos a ningún servidor externo. Los datos enviados por PayPal o Pago Móvil (Venezuela) se usan únicamente para validar tu suscripción VIP y brindar soporte.
                </p>
              </div>

              <div className="bg-black/40 border border-white/10 p-3.5 rounded-2xl">
                <h4 className="font-bold text-sm text-[var(--accent-pink)] mb-1 flex items-center gap-1.5">
                  <span>4.</span> Suscripción Premium ($2.00 USD/mes — PayPal o Pago Móvil)
                </h4>
                <p className="text-[11px] text-white/80 mb-2">
                  El acceso a las funciones avanzadas (uso de más de 4 tipografías, colección completa de stickers no felinos, fondos y decoraciones avanzadas de estantería, notas ilimitadas, todos los colores de subrayado y reproductor de música de fondo) requiere una membresía mensual activa procesada mediante <strong>PayPal</strong> (recurrente) o <strong>Pago Móvil en Venezuela</strong> (pago único mensual en Bs. a tasa BCV).
                </p>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-white/80 pl-1">
                  <li>En suscripciones por PayPal, puedes cancelar el cobro recurrente en cualquier momento desde tu cuenta de PayPal.</li>
                  <li>En pagos por Pago Móvil no existen cobros automáticos; el acceso dura 30 días tras validar tu referencia.</li>
                  <li>Al finalizar o cancelar, conservas las funciones Premium hasta que venza el ciclo de 30 días activo.</li>
                  <li>No se realizan reembolsos por periodos ya facturados o códigos ya activados (ver Política de Reembolso).</li>
                </ul>
              </div>
            </div>
          )}

          {/* 2. POLÍTICA DE PRIVACIDAD */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="bg-black/40 border border-white/10 p-3.5 rounded-2xl">
                <h4 className="font-bold text-sm text-[var(--accent-pink)] mb-1">
                  Principio de Minimización de Datos (Privacy by Design)
                </h4>
                <p className="text-[11px] text-white/80">
                  En cumplimiento con el RGPD (Reglamento General de Protección de Datos de la UE) y normativas internacionales de privacidad, <strong>NekoLover Read solicita única y exclusivamente los datos imprescindibles</strong> para prestar el servicio:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2.5">
                  <div className="p-2.5 rounded-xl bg-black/60 border border-emerald-500/30">
                    <span className="text-emerald-300 font-bold block text-[11px]">✅ Lo que recopilamos:</span>
                    <span className="text-[10px] text-white/70 block mt-1">
                      Si pagas con <strong>PayPal</strong>, no solicitamos datos personales en la app. Si optas por <strong>Pago Móvil (Venezuela)</strong>, únicamente guardamos tu reporte de pago (banco emisor, teléfono emisor, número de referencia, monto en Bs. y correo/WhatsApp de contacto) para validar la transferencia y enviarte tu código VIP.
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/60 border border-red-500/30">
                    <span className="text-red-300 font-bold block text-[11px]">❌ Lo que NUNCA recopilamos:</span>
                    <span className="text-[10px] text-white/70 block mt-1">
                      No leemos tus libros, no recopilamos ubicación geográfica, historial externo de navegación, teléfonos personales ni datos bancarios. Tampoco vendemos ni cedemos datos a terceros.
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-black/40 border border-white/10 p-3.5 rounded-2xl">
                <h4 className="font-bold text-sm text-[var(--accent-pink)] mb-1">
                  Almacenamiento Local de tus Lecturas
                </h4>
                <p className="text-[11px] text-white/80 leading-relaxed">
                  Todos tus libros (PDF/EPUB/TXT), pistas musicales, notas, subrayados y stickers permanecen dentro de <code className="text-pink-300">IndexedDB</code> y <code className="text-pink-300">LocalStorage</code> en tu dispositivo. Al estar conectado, las búsquedas automáticas de portada/sinopsis solo consultan título o autor en APIs públicas bibliográficas.
                </p>
              </div>

              <div className="bg-black/40 border border-white/10 p-3.5 rounded-2xl">
                <h4 className="font-bold text-sm text-[var(--accent-pink)] mb-1">
                  Tus Derechos de Control y Supresión
                </h4>
                <p className="text-[11px] text-white/80">
                  Puedes borrar todos tus datos locales en cualquier instante desde el menú de Ajustes mediante el botón «Reiniciar estadísticas y datos» o desvinculando tu carpeta local. Si deseas cancelar tu suscripción o solicitar la desvinculación de tu correo de contacto, puedes hacerlo desde PayPal o contactando con soporte.
                </p>
              </div>
            </div>
          )}

          {/* 3. POLÍTICA DE COOKIES Y ALMACENAMIENTO */}
          {activeTab === 'cookies' && (
            <div className="space-y-4">
              <div className="bg-black/40 border border-white/10 p-3.5 rounded-2xl">
                <h4 className="font-bold text-sm text-[var(--accent-pink)] mb-1 flex items-center gap-1.5">
                  <span>1.</span> Uso de Almacenamiento Local, IndexedDB y Caché Offline (PWA)
                </h4>
                <p className="text-[11px] text-white/80 mb-2 leading-relaxed">
                  Esta aplicación no utiliza cookies publicitarias ni rastreadores de terceros. Utiliza tecnologías locales del navegador (<code className="text-pink-300 bg-black/60 px-1 py-0.5 rounded">localStorage</code>, <code className="text-pink-300 bg-black/60 px-1 py-0.5 rounded">IndexedDB</code> y caché PWA de Service Worker) con el único fin técnico de:
                </p>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-white/80 pl-1">
                  <li>Recordar tu membresía VIP (<code className="text-amber-300">nl_vip_subscription</code>) y tu consentimiento legal (<code className="text-emerald-300">consentimiento_privacidad</code>).</li>
                  <li>Guardar localmente tus libros, pistas de música y progreso de lectura.</li>
                  <li>Conservar las preferencias de diseño de estanterías (temas, decoraciones, fondos y tipografías).</li>
                  <li>Mantener la app operativa sin conexión.</li>
                </ul>
                <p className="text-[10px] text-[var(--text-muted)] mt-2">
                  Estos datos permanecen exclusivamente en tu dispositivo y el desarrollador no tiene acceso remoto a tus archivos locales.
                </p>
              </div>

              <div className="bg-black/40 border border-white/10 p-3.5 rounded-2xl">
                <h4 className="font-bold text-sm text-[var(--accent-pink)] mb-1 flex items-center gap-1.5">
                  <span>2.</span> Cookies y Servicios de Terceros (PayPal y Supabase)
                </h4>
                <p className="text-[11px] text-white/80 mb-2">
                  Cuando el usuario interactúa con los servicios de pago o validación externos:
                </p>
                <div className="space-y-2 text-[11px] text-white/80">
                  <div className="p-2.5 rounded-xl bg-black/50 border border-white/5">
                    <strong className="text-amber-300">🅿️ PayPal:</strong> Al hacer clic en el enlace de suscripción, el usuario interactúa con la plataforma web oficial de PayPal. PayPal utiliza sus propias cookies estrictamente necesarias para procesar el pago de forma segura, mitigar fraudes y autenticar la cuenta del comprador. Estas cookies se rigen bajo la Política de Privacidad de PayPal.
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/50 border border-white/5">
                    <strong className="text-emerald-300">⚡ Supabase y WhatsApp (Validación de Pagos):</strong> Supabase almacena de forma privada el registro técnico de consentimiento, verifica los códigos de activación y recibe los reportes de Pago Móvil enviados por el usuario (sin acceso público de lectura). Si el usuario pulsa el botón opcional de WhatsApp, enviará su comprobante directamente al soporte oficial para agilizar la entrega del código.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. POLÍTICA DE CANCELACIÓN Y REEMBOLSO */}
          {activeTab === 'refund' && (
            <div className="space-y-4">
              <div className="bg-black/40 border border-amber-400/40 p-4 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 border-b border-white/10 pb-2.5">
                  <span className="text-xl">💸</span>
                  <h4 className="font-bold text-sm text-amber-300">
                    Política de Cancelación y Reembolso
                  </h4>
                </div>

                {/* 1. Política de No Reembolso (Bienes Digitales) */}
                <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-400/30 space-y-1.5">
                  <h5 className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
                    <span>1.</span> Política de No Reembolso (Bienes Digitales)
                  </h5>
                  <p className="text-[11px] text-white/90 leading-relaxed">
                    Debido a la naturaleza digital e inmediata del acceso Premium (desbloqueo instantáneo de fuentes, stickers, notas y personalización de estanterías), <strong>todas las ventas y cobros de suscripción son definitivos</strong>. No se realizarán reembolsos totales ni parciales por meses de suscripción ya cobrados o transcurridos.
                  </p>
                </div>

                {/* 2. Cancelación de la Suscripción */}
                <div className="p-3.5 rounded-xl bg-black/50 border border-white/10 space-y-2">
                  <h5 className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
                    <span>2.</span> Cancelación de la Suscripción y Modalidades
                  </h5>
                  <p className="text-[11px] text-white/80 leading-relaxed">
                    El usuario mantiene el control sobre su membresía mensual ($2.00 USD/mes) según el método elegido:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 text-[11px] text-white/80 pl-1">
                    <li>
                      <strong>PayPal (3 días de prueba gratis y renovación automática):</strong> Si cancelas desde tu cuenta de <strong>PayPal</strong> (<em>Suscripciones / Pagos con aprobación previa</em>) antes de concluir los 3 días de prueba, no se realizará ningún cargo. Si cancelas luego, conservarás el VIP hasta terminar el mes pagado.
                    </li>
                    <li>
                      <strong>Pago Móvil Venezuela (30 días sin renovación automática):</strong> Es un pago único manual de 30 días en Bolívares a tasa BCV; no genera cobros automáticos ni requiere cancelación posterior. Una vez validada la referencia y entregado el código VIP, el servicio digital queda suministrado y no admite reembolso.
                    </li>
                  </ul>
                </div>

                {/* 3. Excepciones de Soporte */}
                <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-400/30 space-y-1.5">
                  <h5 className="font-bold text-xs text-blue-300 flex items-center gap-1.5">
                    <span>3.</span> Excepciones de Soporte
                  </h5>
                  <p className="text-[11px] text-white/90 leading-relaxed">
                    Si realizaste un pago por PayPal o Pago Móvil y aún no recibes tu código de activación, contáctanos a través de{' '}
                    <a 
                      href="mailto:nekolover.online@nekolover.Online" 
                      className="text-amber-300 underline font-mono font-bold hover:text-white"
                    >
                      nekolover.online@nekolover.Online
                    </a>{' '}
                    o por WhatsApp (+58 412-8432704) adjuntando tu comprobante o número de referencia para validar y entregar tu acceso manualmente.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 5. REGISTRO DE CONSENTIMIENTO (AUDIT LOG) */}
          {activeTab === 'audit' && (
            <div className="space-y-3">
              <div className="bg-black/40 border border-amber-400/30 p-3.5 rounded-2xl">
                <h4 className="font-bold text-sm text-amber-300 mb-1 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>Tu Registro de Consentimiento Legal</span>
                </h4>
                <p className="text-[11px] text-white/80 leading-relaxed">
                  Para tu garantía y cumplimiento de las leyes de privacidad, guardamos constancia técnica de cuándo y cómo aceptaste cada término en este dispositivo.
                </p>
              </div>

              {consentLogs.length === 0 ? (
                <div className="text-center py-8 bg-black/30 rounded-2xl border border-white/5 space-y-2">
                  <span className="text-3xl">📜</span>
                  <p className="text-xs text-[var(--text-muted)]">
                    Aún no se ha registrado un consentimiento explícito en este dispositivo.
                  </p>
                  <p className="text-[10px] text-white/50">
                    Aparecerá aquí cuando aceptes el cartel de cookies o las casillas del checkout de PayPal.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {consentLogs.map((log) => (
                    <div key={log.id} className="p-3 rounded-xl bg-black/60 border border-white/10 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-amber-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>
                            {log.consentType === 'vip_checkout_paypal'
                              ? 'Checkout PayPal VIP ($2/mes)'
                              : log.consentType === 'vip_checkout_pago_movil'
                                ? 'Checkout Pago Móvil VIP ($2/mes)'
                                : 'Cartel de Cookies & Privacidad'}
                          </span>
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] font-mono">
                          {log.formattedDate}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-1 text-[10px] text-white/80 pt-1 border-t border-white/5">
                        <span>• Términos Aceptados: <strong>{log.termsAccepted ? 'Sí' : 'No'}</strong></span>
                        <span>• Privacidad Aceptada: <strong>{log.privacyAccepted ? 'Sí' : 'No'}</strong></span>
                        <span>• Política Reembolso: <strong>{log.refundPolicyAccepted ? 'Sí' : 'No'}</strong></span>
                        <span>• Versión Legal: <strong>{log.legalVersion}</strong></span>
                      </div>

                      {log.email && (
                        <div className="text-[10px] text-[var(--accent-pink)]">
                          Correo asociado PayPal: <span className="font-mono text-white">{log.email}</span>
                        </div>
                      )}

                      <div className="text-[9px] text-[var(--text-muted)] font-mono truncate">
                        ID: {log.id} | Fecha ISO: {log.isoDate}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-black/60 border-t border-white/10 flex items-center justify-between gap-2 text-xs">
          <span className="text-[10px] text-[var(--text-muted)]">
            🔒 Documentos legales en conformidad con RGPD, ePrivacy y PayPal.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gradient-to-r from-[var(--accent-pink)] to-[var(--accent-purple)] text-black font-cute font-bold rounded-xl shadow-md hover:opacity-90 active:scale-95 transition"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
