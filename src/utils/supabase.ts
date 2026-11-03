// Supabase REST Integration for NekoLover Read
// Validación de código de suscripción Premium mediante GET (fetch)

export const SUPABASE_URL = "https://abdqmclgskoigquivvxk.supabase.co/rest/v1/";
export const SUPABASE_ANON_KEY = "sb_publishable_X3sG7aK12tYNJ0T92AAdZQ_2LK4ijiz";

export interface SupabaseSuscripcion {
  id?: string | number;
  codigo: string;
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
  // Consulta directa a la tabla "suscripciones" por codigo y estado activo
  const url = `${SUPABASE_URL}suscripciones?codigo=eq.${encodeURIComponent(cleanCode)}&estado=eq.activo`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
    }

    const data: SupabaseSuscripcion[] = await response.json();

    if (Array.isArray(data) && data.length > 0) {
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
        data: data[0]
      };
    } else {
      return {
        success: false,
        message: 'El código ingresado no existe o no tiene estado "activo" en la base de datos de Supabase.'
      };
    }
  } catch (error: any) {
    console.error('Error al conectar con Supabase:', error);
    return {
      success: false,
      message: 'Error de red o conexión al verificar el código con el servidor de Supabase.'
    };
  }
}

// Exponer en window para App Mint y scripts externos
if (typeof window !== 'undefined') {
  (window as any).SUPABASE_URL = SUPABASE_URL;
  (window as any).SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
  (window as any).verificarCodigo = verificarCodigo;
}
