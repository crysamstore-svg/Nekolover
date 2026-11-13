// Supabase REST Integration for NekoLover Read
// Validación de código de suscripción Premium mediante Supabase REST API (GET fetch)

export const SUPABASE_URL = "https://jeplkoloixbkvgqwxkez.supabase.co/rest/v1/";
export const SUPABASE_ANON_KEY = "sb_publishable_7P6iF17OzgWWgWfbc3rg9Q_LXP_Gp1v";

export interface SupabaseSuscripcion {
  id?: string | number;
  codigo?: string;
  codigo_activacion?: string;
  estado: string;
  email?: string;
  created_at?: string;
  [key: string]: any;
}

export interface VerificarCodigoResult {
  success: boolean;
  message: string;
  data?: SupabaseSuscripcion;
}

/**
 * Función verificarCodigo(codigo):
 * Realiza una petición GET con fetch a la tabla "suscripciones" de Supabase
 * para comprobar si el código ingresado por el lector existe y tiene estado "activo".
 * Si existe, guarda "usuario_premium = true" en el localStorage de la app.
 * ¡No utiliza el método .subscribe()!
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

  const candidateCodes = cleanCode === upperCode ? [cleanCode] : [upperCode, cleanCode];
  const urlsToTry: string[] = [
    ...candidateCodes.map((c) => `${SUPABASE_URL}suscripciones?codigo=eq.${encodeURIComponent(c)}`),
    `${SUPABASE_URL}suscripciones?codigo=ilike.${encodeURIComponent(cleanCode)}`,
    `${SUPABASE_URL}suscripciones?codigo_activacion=eq.${encodeURIComponent(cleanCode)}`
  ];

  let foundRecord: SupabaseSuscripcion | null = null;
  let inactiveRecord: SupabaseSuscripcion | null = null;

  for (const url of urlsToTry) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data: SupabaseSuscripcion[] = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const activeMatch = data.find((row) => {
            const est = String(row.estado ?? '').trim().toLowerCase();
            return est === 'activo' || est === 'active';
          });
          if (activeMatch) {
            foundRecord = activeMatch;
            break;
          } else if (!inactiveRecord) {
            inactiveRecord = data[0];
          }
        }
      }
    } catch (e) {
      console.warn('Fallo en intento de consulta a Supabase:', e);
    }
  }

  if (foundRecord) {
    const matchedCode = String(foundRecord.codigo || foundRecord.codigo_activacion || cleanCode).trim();
    // Guardar usuario_premium = true en el localStorage de la app
    localStorage.setItem('usuario_premium', 'true');

    // Sincronizar datos de la suscripción VIP en el almacenamiento local
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const subData = {
      isVip: true,
      subscribedAt: now,
      expiresAt: now + thirtyDays,
      planName: 'Suscripción Mensual VIP ($2 USD/mes)',
      paymentMethod: `Supabase [${matchedCode}]`,
      autoRenew: true
    };
    localStorage.setItem('nl_vip_subscription', JSON.stringify(subData));

    // Disparar evento para que la aplicación React se actualice al instante
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('vip_status_changed', {
          detail: { isVip: true, code: matchedCode, sub: subData }
        })
      );
    }

    return {
      success: true,
      message: `¡Código [${matchedCode}] verificado en Supabase con éxito! Membresía VIP activada.`,
      data: foundRecord
    };
  } else if (inactiveRecord) {
    return {
      success: false,
      message: `El código existe en Supabase, pero su estado actual es "${inactiveRecord.estado}" (no está "activo").`
    };
  } else {
    return {
      success: false,
      message: 'El código ingresado no existe o no tiene estado "activo" en la base de datos de Supabase.'
    };
  }
}

// Exponer en window para App Mint y scripts externos
if (typeof window !== 'undefined') {
  (window as any).SUPABASE_URL = SUPABASE_URL;
  (window as any).SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
  (window as any).verificarCodigo = verificarCodigo;
}
