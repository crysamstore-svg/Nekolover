// Supabase REST Integration for NekoLover Read
// Validación de código de suscripción Premium mediante Supabase REST API (GET fetch)

const DEFAULT_SUPABASE_URL = "https://jeplkoloixbkvgqwxkez.supabase.co/rest/v1/";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_7P6iF17OzgWWgWfbc3rg9Q_LXP_Gp1v";

const resolveEnv = (key: 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_ANON_KEY', fallback: string): string => {
  try {
    const val = (import.meta as any)?.env?.[key];
    if (typeof val === 'string' && val.trim().length > 0) {
      return val.trim();
    }
  } catch {
    // Fallback outside Vite runtime
  }
  return fallback;
};

export const SUPABASE_URL = resolveEnv('VITE_SUPABASE_URL', DEFAULT_SUPABASE_URL);
export const SUPABASE_ANON_KEY = resolveEnv('VITE_SUPABASE_ANON_KEY', DEFAULT_SUPABASE_ANON_KEY);

export interface SupabaseSuscripcion {
  id?: string | number;
  codigo?: string;
  codigo_activacion?: string;
  estado: string;
  created_at?: string;
}

export interface VerificarCodigoResult {
  success: boolean;
  message: string;
  matchedCode?: string;
  data?: SupabaseSuscripcion;
}

const VALID_CODE_REGEX = /^[A-Za-z0-9._-]{4,64}$/;
const VALID_DEVICE_ID_REGEX = /^[A-Za-z0-9_-]{12,80}$/;
const DEVICE_ID_STORAGE_KEY = 'nl_device_id';
let memoryFallbackDeviceId: string | null = null;

/**
 * Obtiene o crea un identificador único persistente para este dispositivo/navegador
 * (usado para vincular cada código VIP a 1 solo dispositivo).
 */
export function getOrCreateDeviceId(): string {
  try {
    if (typeof localStorage !== 'undefined') {
      const existing = localStorage.getItem(DEVICE_ID_STORAGE_KEY);
      if (existing && VALID_DEVICE_ID_REGEX.test(existing)) {
        return existing;
      }
    }
  } catch {
    // Ignore storage access failures
  }

  if (memoryFallbackDeviceId) return memoryFallbackDeviceId;

  let generated = '';
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      generated = `nl_${crypto.randomUUID().replace(/-/g, '')}`;
    } else if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      generated = `nl_${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;
    }
  } catch {
    // Fallback below if crypto API unavailable
  }

  if (!generated || !VALID_DEVICE_ID_REGEX.test(generated)) {
    generated = `nl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
  }

  memoryFallbackDeviceId = generated;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(DEVICE_ID_STORAGE_KEY, generated);
    }
  } catch {
    // Ignore write failures
  }
  return generated;
}

function sanitizeSuscripcionRecord(row: Record<string, any>): SupabaseSuscripcion {
  return {
    id: row.id,
    codigo: typeof row.codigo === 'string' ? row.codigo.trim() : undefined,
    codigo_activacion: typeof row.codigo_activacion === 'string' ? row.codigo_activacion.trim() : undefined,
    estado: String(row.estado ?? '').trim(),
    created_at: typeof row.created_at === 'string' ? row.created_at : undefined
  };
}

interface RpcRedeemOutcome {
  state: 'ok' | 'already_used' | 'inactive' | 'not_found' | 'rpc_unavailable' | 'network_error';
  matchedCode?: string;
}

async function callRedeemCodeRpc(code: string, deviceId: string, timeoutMs = 8000): Promise<RpcRedeemOutcome> {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  try {
    const response = await fetch(`${SUPABASE_URL}rpc/canjear_codigo_vip`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      referrerPolicy: 'no-referrer',
      signal: controller?.signal,
      body: JSON.stringify({
        p_codigo: code,
        p_device_id: deviceId
      })
    });

    if (response.status === 404) {
      return { state: 'rpc_unavailable' };
    }

    if (!response.ok) {
      let errCode = '';
      try {
        const body = await response.json();
        errCode = String(body?.code ?? '');
      } catch {}
      if (errCode === 'PGRST202' || errCode === '42883') {
        return { state: 'rpc_unavailable' };
      }
      return { state: 'network_error' };
    }

    const data = await response.json();
    const result = Array.isArray(data) ? data[0] : data;
    if (!result || typeof result !== 'object') {
      return { state: 'network_error' };
    }

    if (result.ok === true) {
      const matched = typeof result.matched_code === 'string' ? result.matched_code.trim().toUpperCase() : code.toUpperCase();
      return { state: 'ok', matchedCode: matched };
    }

    const reason = String(result.reason ?? '').toLowerCase();
    if (reason === 'already_used') return { state: 'already_used' };
    if (reason === 'inactive') return { state: 'inactive' };
    return { state: 'not_found' };
  } catch {
    return { state: 'network_error' };
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

/**
 * Función verificarCodigo(codigo):
 * Valida y vincula el código VIP a 1 único dispositivo mediante la función segura RPC
 * `canjear_codigo_vip` en Supabase (con respaldo temporal si aún no se ha creado la RPC).
 */
export async function verificarCodigo(codigo: string): Promise<VerificarCodigoResult> {
  if (!codigo || typeof codigo !== 'string' || !codigo.trim()) {
    return {
      success: false,
      message: 'Por favor introduce un código de activación en la casilla.'
    };
  }

  const cleanCode = codigo.trim();
  const upperCode = cleanCode.toUpperCase();

  if (cleanCode.length < 4 || cleanCode.length > 64) {
    return {
      success: false,
      message: 'El código de activación debe tener entre 4 y 64 caracteres.'
    };
  }

  if (!VALID_CODE_REGEX.test(cleanCode)) {
    return {
      success: false,
      message: 'El código contiene caracteres no permitidos.'
    };
  }

  const deviceId = getOrCreateDeviceId();
  const rpcResult = await callRedeemCodeRpc(upperCode, deviceId, 8000);

  if (rpcResult.state === 'ok') {
    const matchedCode = rpcResult.matchedCode || upperCode;
    return {
      success: true,
      message: `¡Código [${matchedCode}] verificado y vinculado a este dispositivo con éxito! Membresía VIP activada.`,
      matchedCode
    };
  }
  if (rpcResult.state === 'already_used') {
    return {
      success: false,
      message: 'Este código ya fue activado en otro dispositivo. Cada código VIP es personal (válido para 1 solo dispositivo).'
    };
  }
  if (rpcResult.state === 'inactive') {
    return {
      success: false,
      message: 'El código existe en Supabase, pero su estado actual no está "activo".'
    };
  }
  if (rpcResult.state === 'not_found') {
    return {
      success: false,
      message: 'El código ingresado no existe o no tiene estado "activo" en la base de datos de Supabase.'
    };
  }
  if (rpcResult.state === 'network_error') {
    return {
      success: false,
      message: 'No se pudo conectar con Supabase para verificar tu código. Revisa tu internet e intenta de nuevo.'
    };
  }

  // Respaldo temporal si la función RPC `canjear_codigo_vip` aún no ha sido creada en Supabase
  const candidateCodes = cleanCode === upperCode ? [cleanCode] : [upperCode, cleanCode];
  const urlsToTry: string[] = [
    ...candidateCodes.map((c) => `${SUPABASE_URL}suscripciones?codigo=eq.${encodeURIComponent(c)}`),
    `${SUPABASE_URL}suscripciones?codigo_activacion=eq.${encodeURIComponent(upperCode)}`
  ];

  let foundRecord: SupabaseSuscripcion | null = null;
  let inactiveRecord: SupabaseSuscripcion | null = null;

  for (const url of urlsToTry) {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 8000) : null;
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Accept': 'application/json'
        },
        referrerPolicy: 'no-referrer',
        signal: controller?.signal
      });

      if (response.ok) {
        const data: Record<string, any>[] = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const matchingRows = data.filter((row) => {
            const rowCode = String(row?.codigo ?? row?.codigo_activacion ?? '').trim();
            return rowCode.toUpperCase() === upperCode;
          });

          const activeMatch = matchingRows.find((row) => {
            const est = String(row?.estado ?? '').trim().toLowerCase();
            return est === 'activo' || est === 'active';
          });
          if (activeMatch) {
            foundRecord = sanitizeSuscripcionRecord(activeMatch);
            break;
          } else if (!inactiveRecord && matchingRows.length > 0) {
            inactiveRecord = sanitizeSuscripcionRecord(matchingRows[0]);
          }
        }
      }
    } catch (e) {
      console.warn('Fallo en intento de consulta a Supabase:', e);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  if (foundRecord) {
    const matchedCode = String(foundRecord.codigo || foundRecord.codigo_activacion || upperCode).trim().toUpperCase();
    return {
      success: true,
      message: `¡Código [${matchedCode}] verificado en Supabase con éxito! Membresía VIP activada.`,
      matchedCode,
      data: foundRecord
    };
  } else if (inactiveRecord) {
    return {
      success: false,
      message: `El código existe en Supabase, pero su estado actual no está "activo".`
    };
  } else {
    return {
      success: false,
      message: 'El código ingresado no existe o no tiene estado "activo" en la base de datos de Supabase.'
    };
  }
}

/**
 * Revalidación silenciosa en segundo plano al iniciar la app.
 * Verifica tanto si el código sigue activo como si sigue perteneciendo a este dispositivo.
 */
export async function revalidarCodigoSilencioso(codigo: string): Promise<'active' | 'invalid' | 'network_error'> {
  const cleanCode = typeof codigo === 'string' ? codigo.trim() : '';
  if (!cleanCode || !VALID_CODE_REGEX.test(cleanCode)) {
    return 'invalid';
  }
  const upperCode = cleanCode.toUpperCase();
  const deviceId = getOrCreateDeviceId();

  const rpcResult = await callRedeemCodeRpc(upperCode, deviceId, 6000);
  if (rpcResult.state === 'ok') return 'active';
  if (rpcResult.state === 'already_used' || rpcResult.state === 'inactive' || rpcResult.state === 'not_found') {
    return 'invalid';
  }
  if (rpcResult.state === 'network_error') {
    return 'network_error';
  }

  // Respaldo si RPC aún no existe en Supabase
  const urlsToTry: string[] = [
    `${SUPABASE_URL}suscripciones?codigo=eq.${encodeURIComponent(upperCode)}`,
    `${SUPABASE_URL}suscripciones?codigo_activacion=eq.${encodeURIComponent(upperCode)}`
  ];

  let sawSuccessfulResponse = false;
  let sawNetworkOrServerError = false;

  for (const url of urlsToTry) {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 6000) : null;
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Accept': 'application/json'
        },
        referrerPolicy: 'no-referrer',
        signal: controller?.signal
      });

      if (response.ok) {
        sawSuccessfulResponse = true;
        const data: Record<string, any>[] = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const matchingRows = data.filter((row) => {
            const rowCode = String(row?.codigo ?? row?.codigo_activacion ?? '').trim();
            return rowCode.toUpperCase() === upperCode;
          });
          if (matchingRows.some((row) => {
            const est = String(row?.estado ?? '').trim().toLowerCase();
            return est === 'activo' || est === 'active';
          })) {
            return 'active';
          }
          if (matchingRows.length > 0) {
            return 'invalid';
          }
        }
      } else if (response.status >= 500) {
        sawNetworkOrServerError = true;
      }
    } catch {
      sawNetworkOrServerError = true;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  if (sawSuccessfulResponse && !sawNetworkOrServerError) {
    return 'invalid';
  }
  return 'network_error';
}

export interface ConsentimientoPayload {
  consent_id: string;
  consent_type: 'cookie_banner' | 'vip_checkout_paypal' | 'vip_checkout_pago_movil';
  terms_accepted: boolean;
  privacy_accepted: boolean;
  refund_policy_accepted: boolean;
  legal_version: string;
  accepted_at: string;
  user_agent?: string;
  codigo_activacion?: string;
}

/**
 * Envía el registro de consentimiento legal a la tabla "consentimientos" de Supabase (POST).
 * Si la tabla aún no existe o el dispositivo está sin conexión, falla silenciosamente sin afectar la app.
 */
export async function registrarConsentimientoEnSupabase(payload: ConsentimientoPayload): Promise<boolean> {
  try {
    const response = await fetch(`${SUPABASE_URL}consentimientos`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      referrerPolicy: 'no-referrer',
      body: JSON.stringify(payload)
    });

    return response.ok;
  } catch (e) {
    console.warn('No se pudo sincronizar el consentimiento con Supabase:', e);
    return false;
  }
}

export interface PagoMovilReportePayload {
  referencia: string;
  bancoEmisor: string;
  telefonoEmisor: string;
  montoBs: string;
  contactoUsuario: string;
  tasaBcvReferencia?: number | null;
}

export interface PagoMovilReporteResult {
  success: boolean;
  savedToSupabase: boolean;
  reportId: string;
  message: string;
}

/**
 * Registra un reporte de Pago Móvil (Venezuela) en la tabla "pagos_moviles" de Supabase (POST)
 * para verificación manual del administrador sin requerir cuenta jurídica ni API bancaria.
 */
export async function registrarPagoMovilEnSupabase(
  payload: PagoMovilReportePayload
): Promise<PagoMovilReporteResult> {
  const cleanRef = payload.referencia.replace(/[^A-Za-z0-9-]/g, '').trim().slice(0, 32);
  const cleanBank = payload.bancoEmisor.trim().slice(0, 80);
  const cleanPhone = payload.telefonoEmisor.replace(/[^\d+\-\s]/g, '').trim().slice(0, 24);
  const cleanAmount = payload.montoBs.replace(/[^\d.,]/g, '').trim().slice(0, 24);
  const cleanContact = payload.contactoUsuario.trim().slice(0, 120);

  if (cleanRef.length < 4) {
    return {
      success: false,
      savedToSupabase: false,
      reportId: '',
      message: 'Introduce al menos los últimos 4 dígitos del número de referencia.'
    };
  }
  if (!cleanBank) {
    return {
      success: false,
      savedToSupabase: false,
      reportId: '',
      message: 'Selecciona el banco desde el cual realizaste el Pago Móvil.'
    };
  }
  if (cleanPhone.replace(/\D/g, '').length < 7) {
    return {
      success: false,
      savedToSupabase: false,
      reportId: '',
      message: 'Introduce un número de teléfono emisor válido.'
    };
  }
  if (!cleanContact || cleanContact.length < 4) {
    return {
      success: false,
      savedToSupabase: false,
      reportId: '',
      message: 'Indica tu correo o WhatsApp para poder enviarte tu código VIP.'
    };
  }

  const reportId = `PM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const body = {
    reporte_id: reportId,
    referencia: cleanRef,
    banco_emisor: cleanBank,
    telefono_emisor: cleanPhone,
    monto_bs: cleanAmount || 'Tasa BCV del día ($2 USD)',
    monto_usd: 2.0,
    tasa_bcv: payload.tasaBcvReferencia ?? null,
    contacto_usuario: cleanContact,
    banco_destino: 'Banesco',
    estado: 'pendiente',
    created_at: new Date().toISOString()
  };

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), 8000) : null;

  try {
    const response = await fetch(`${SUPABASE_URL}pagos_moviles`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      referrerPolicy: 'no-referrer',
      signal: controller?.signal,
      body: JSON.stringify(body)
    });

    if (response.ok) {
      return {
        success: true,
        savedToSupabase: true,
        reportId,
        message: `Reporte [${reportId}] guardado en Supabase correctamente. También puedes enviarlo por WhatsApp para acelerar la entrega de tu código VIP.`
      };
    }

    let detail = `HTTP ${response.status}`;
    try {
      const errText = await response.text();
      if (errText) {
        console.warn('Error de Supabase al guardar Pago Móvil:', response.status, errText);
        try {
          const parsedErr = JSON.parse(errText);
          if (parsedErr?.message) {
            detail = `${detail}: ${String(parsedErr.message).slice(0, 120)}`;
          }
        } catch {
          // Ignore non-JSON error body
        }
      }
    } catch {}

    return {
      success: true,
      savedToSupabase: false,
      reportId,
      message: `Comprobante [${reportId}] generado (Supabase respondió ${detail}). Envíalo por WhatsApp con el botón verde para validar tu referencia y recibir tu código VIP.`
    };
  } catch (err) {
    console.warn('Error de red al conectar con Supabase Pago Móvil:', err);
    return {
      success: true,
      savedToSupabase: false,
      reportId,
      message: `Comprobante [${reportId}] listo (sin conexión con Supabase en este momento). Envíalo por WhatsApp para validar tu pago y recibir tu código VIP.`
    };
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
