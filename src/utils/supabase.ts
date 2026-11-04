// Supabase REST Integration for NekoLover Read
// Validación y Envío de código de suscripción Premium mediante Supabase REST API

export const SUPABASE_URL = "https://abdqmclgskoigquivvxk.supabase.co/rest/v1/";
export const SUPABASE_ANON_KEY = "sb_publishable_X3sG7aK12tYNJ0T92AAdZQ_2LK4ijiz";

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

export interface EnviarCodigoResult {
  success: boolean;
  message: string;
  data?: any;
  error?: any;
  rlsBlocked?: boolean;
}

/**
 * Función enviarCodigoASupabase(codigo, email):
 * Envía e inserta el código en la tabla "suscripciones" de Supabase con estado "activo".
 */
export async function enviarCodigoASupabase(codigo: string, email?: string): Promise<EnviarCodigoResult> {
  if (!codigo || typeof codigo !== 'string' || !codigo.trim()) {
    return {
      success: false,
      message: 'Por favor proporciona un código de activación válido para enviar.'
    };
  }

  const cleanCode = codigo.trim();
  const url = `${SUPABASE_URL}suscripciones`;

  // En la base de datos de Supabase la columna es 'codigo_activacion'
  const payload: Record<string, any> = {
    codigo_activacion: cleanCode,
    estado: 'activo'
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => null);

    if (response.ok) {
      // Activar VIP en el almacenamiento local de la app
      localStorage.setItem('usuario_premium', 'true');

      const now = Date.now();
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      const subData = {
        isVip: true,
        subscribedAt: now,
        expiresAt: now + thirtyDays,
        planName: 'Suscripción Mensual VIP ($2 USD/mes)',
        paymentMethod: `Supabase [${cleanCode}]`,
        email: email || undefined,
        autoRenew: true
      };
      localStorage.setItem('nl_vip_subscription', JSON.stringify(subData));

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('vip_status_changed', {
            detail: { isVip: true, code: cleanCode, sub: subData }
          })
        );
      }

      return {
        success: true,
        message: `¡Código [${cleanCode}] enviado y guardado exitosamente en la tabla suscripciones de Supabase!`,
        data: Array.isArray(data) ? data[0] : data
      };
    } else {
      // Si la inserción fue denegada por Row Level Security (RLS) en Supabase
      const isRlsError = data?.code === '42501' || data?.message?.includes('row-level security');
      if (isRlsError) {
        console.warn('RLS Policy bloqueó la inserción en Supabase:', data);
        return {
          success: false,
          rlsBlocked: true,
          message: 'Tu tabla "suscripciones" en Supabase tiene las Políticas de Seguridad (RLS) activadas para inserción. Para permitir guardar códigos desde la app, ve a tu panel de Supabase > SQL Editor y ejecuta: ALTER TABLE suscripciones DISABLE ROW LEVEL SECURITY;',
          error: data
        };
      }

      return {
        success: false,
        message: data?.message || `Error al guardar en Supabase (HTTP ${response.status}).`,
        error: data
      };
    }
  } catch (error: any) {
    console.error('Error al enviar código a Supabase:', error);
    return {
      success: false,
      message: 'Error de red o conexión al enviar el código al servidor de Supabase.',
      error
    };
  }
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

  // 1. Intentar con columna 'codigo_activacion' (columna real detectada en la base de datos)
  let foundRecord: SupabaseSuscripcion | null = null;
  const urlsToTry = [
    `${SUPABASE_URL}suscripciones?codigo_activacion=eq.${encodeURIComponent(cleanCode)}&estado=eq.activo`,
    `${SUPABASE_URL}suscripciones?codigo=eq.${encodeURIComponent(cleanCode)}&estado=eq.activo`
  ];

  for (const url of urlsToTry) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data: SupabaseSuscripcion[] = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          foundRecord = data[0];
          break;
        }
      }
    } catch (e) {
      console.warn('Fallo en intento de consulta a Supabase:', e);
    }
  }

  if (foundRecord) {
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
      paymentMethod: `Supabase [${cleanCode}]`,
      autoRenew: true
    };
    localStorage.setItem('nl_vip_subscription', JSON.stringify(subData));

    // Disparar evento para que la aplicación React se actualice al instante
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('vip_status_changed', {
          detail: { isVip: true, code: cleanCode, sub: subData }
        })
      );
    }

    return {
      success: true,
      message: `¡Código [${cleanCode}] verificado en Supabase con éxito! Membresía VIP activada.`,
      data: foundRecord
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
  (window as any).enviarCodigoASupabase = enviarCodigoASupabase;
}
