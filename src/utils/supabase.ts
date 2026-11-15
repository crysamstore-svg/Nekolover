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

function sanitizeSuscripcionRecord(row: Record<string, any>): SupabaseSuscripcion {
  return {
    id: row.id,
    codigo: typeof row.codigo === 'string' ? row.codigo.trim() : undefined,
    codigo_activacion: typeof row.codigo_activacion === 'string' ? row.codigo_activacion.trim() : undefined,
    estado: String(row.estado ?? '').trim(),
    created_at: typeof row.created_at === 'string' ? row.created_at : undefined
  };
}

/**
 * Función verificarCodigo(codigo):
 * Realiza una petición GET con fetch a la tabla "suscripciones" de Supabase
 * para comprobar si el código ingresado por el lector existe y tiene estado "activo".
 * No expone credenciales globales ni muta almacenamiento local sin firma de integridad.
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
 * Distingue fallos de red ('network_error') de revocación real ('invalid')
 * para no afectar a lectores sin conexión.
 */
export async function revalidarCodigoSilencioso(codigo: string): Promise<'active' | 'invalid' | 'network_error'> {
  const cleanCode = typeof codigo === 'string' ? codigo.trim() : '';
  if (!cleanCode || !VALID_CODE_REGEX.test(cleanCode)) {
    return 'invalid';
  }
  const upperCode = cleanCode.toUpperCase();
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
  consent_type: 'cookie_banner' | 'vip_checkout_paypal';
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
