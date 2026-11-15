import { verificarCodigo, registrarConsentimientoEnSupabase } from './supabase';

export interface VipSubscriptionData {
  isVip: boolean;
  subscribedAt: number | null;
  expiresAt: number | null;
  planName: string;
  paymentMethod: string;
  email?: string;
  autoRenew: boolean;
}

export interface ConsentLogRecord {
  id: string;
  timestamp: number;
  formattedDate: string;
  isoDate: string;
  legalVersion: string;
  consentType: 'cookie_banner' | 'vip_checkout_paypal';
  termsAccepted: boolean;
  privacyAccepted: boolean;
  refundPolicyAccepted: boolean;
  codigo?: string;
  email?: string;
  userAgent?: string;
}

const STORAGE_KEY = 'nl_vip_subscription';
const LEGACY_PREMIUM_KEY = 'usuario_premium';
const CONSENT_LOGS_KEY = 'nl_legal_consent_logs';
const COOKIE_CONSENT_KEY = 'consentimiento_privacidad';

class VipManager {
  private listeners: Set<(isVip: boolean) => void> = new Set();
  private approvedPayPalIds: Set<string> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('vip_status_changed', (e: any) => {
        this.notify(e.detail?.isVip ?? this.isVip());
      });
      window.addEventListener('storage', (e: StorageEvent) => {
        if (e.key === LEGACY_PREMIUM_KEY || e.key === STORAGE_KEY) {
          this.notify(this.isVip());
        }
      });
    }
  }

  public getSubscription(): VipSubscriptionData {
    try {
      // Check both keys for complete cross-compatibility
      const legacyPremium = localStorage.getItem(LEGACY_PREMIUM_KEY) === 'true';
      const saved = localStorage.getItem(STORAGE_KEY);
      
      if (saved) {
        const data = JSON.parse(saved);
        // Check if expired
        if (data.expiresAt && Date.now() > data.expiresAt) {
          localStorage.removeItem(LEGACY_PREMIUM_KEY);
          return {
            isVip: false,
            subscribedAt: null,
            expiresAt: null,
            planName: 'Plan Gratuito',
            paymentMethod: 'Ninguno',
            autoRenew: false
          };
        }
        return data;
      } else if (legacyPremium) {
        return {
          isVip: true,
          subscribedAt: Date.now(),
          expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
          planName: 'Suscripción Mensual VIP ($2 USD/mes)',
          paymentMethod: 'PayPal',
          autoRenew: true
        };
      }
    } catch (e) {
      console.warn('Error reading VIP status:', e);
    }

    return {
      isVip: false,
      subscribedAt: null,
      expiresAt: null,
      planName: 'Plan Gratuito',
      paymentMethod: 'Ninguno',
      autoRenew: false
    };
  }

  public isVip(): boolean {
    return this.getSubscription().isVip;
  }

  // Registrar en memoria únicamente un ID de suscripción recién aprobado por el SDK oficial de PayPal
  public registerApprovedPayPalId(subscriptionId: string): void {
    const clean = subscriptionId?.trim().toUpperCase();
    if (clean) {
      this.approvedPayPalIds.add(clean);
    }
  }

  // Solo activar el VIP cuando el código sea insertado por el usuario y validado
  public subscribe(paymentMethod: string = 'PayPal', email?: string): VipSubscriptionData {
    console.info('Pago registrado. Pendiente de insertar código de activación por el usuario.');
    return this.getSubscription();
  }

  /**
   * Validación asíncrona de código de activación:
   * Consulta en tiempo real la base de datos de Supabase mediante GET fetch en la tabla "suscripciones".
   * Ningún código se almacena en la app.
   * Si es válido y activo, activa "usuario_premium = true" en localStorage y actualiza la app.
   */
  public async activateWithCodeAsync(code: string, email?: string): Promise<{ success: boolean; message: string; sub?: VipSubscriptionData }> {
    const cleanCode = code.trim();
    if (!cleanCode) {
      return { 
        success: false, 
        message: 'Por favor, introduce el código de activación en la casilla.' 
      };
    }

    if (cleanCode.length < 4) {
      return {
        success: false,
        message: 'El código de activación debe contener al menos 4 caracteres.'
      };
    }

    // 1. Verificación obligatoria en la tabla "suscripciones" de Supabase
    try {
      const supRes = await verificarCodigo(cleanCode);
      if (supRes.success) {
        const subData = this.getSubscription();
        this.notify(true);
        this.saveConsentLog({
          consentType: 'vip_checkout_paypal',
          termsAccepted: true,
          privacyAccepted: true,
          refundPolicyAccepted: true,
          codigo: cleanCode.toUpperCase()
        });
        return {
          success: true,
          message: supRes.message,
          sub: subData
        };
      }

      // 2. Si acaba de completar el pago oficial de PayPal en esta sesión, permitir su ID aprobado
      if (this.approvedPayPalIds.has(cleanCode.toUpperCase())) {
        return this.activateWithCode(cleanCode, email);
      }

      return {
        success: false,
        message: supRes.message || 'El código ingresado no existe o no tiene estado "activo" en Supabase.'
      };
    } catch (e) {
      console.warn('Error consultando Supabase:', e);
      if (this.approvedPayPalIds.has(cleanCode.toUpperCase())) {
        return this.activateWithCode(cleanCode, email);
      }
      return {
        success: false,
        message: 'No se pudo conectar con Supabase para verificar tu código. Intenta de nuevo.'
      };
    }
  }

  public activateWithCode(code: string, email?: string): { success: boolean; message: string; sub?: VipSubscriptionData } {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      return { 
        success: false, 
        message: 'Por favor, introduce el código de activación en la casilla.' 
      };
    }

    // Únicamente permite activación directa si corresponde a un pago recién aprobado por PayPal en esta sesión
    if (!this.approvedPayPalIds.has(cleanCode)) {
      return {
        success: false,
        message: 'Código de activación no verificado en Supabase. Revisa tu código o contacta a soporte en nekolover.online@nekolover.Online.'
      };
    }

    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const subData: VipSubscriptionData = {
      isVip: true,
      subscribedAt: now,
      expiresAt: now + thirtyDays,
      planName: 'Suscripción Mensual VIP ($2 USD/mes)',
      paymentMethod: `Código Activación (${cleanCode})`,
      email: email?.trim() || undefined,
      autoRenew: false
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(subData));
    localStorage.setItem(LEGACY_PREMIUM_KEY, 'true');
    this.notify(true);

    this.saveConsentLog({
      consentType: 'vip_checkout_paypal',
      termsAccepted: true,
      privacyAccepted: true,
      refundPolicyAccepted: true,
      email: email?.trim()
    });

    return {
      success: true,
      message: `¡Código [${cleanCode}] verificado con éxito! Membresía VIP ($2 USD/mes) activada correctamente.`,
      sub: subData
    };
  }

  public cancel(): void {
    const subData: VipSubscriptionData = {
      isVip: false,
      subscribedAt: null,
      expiresAt: null,
      planName: 'Plan Gratuito',
      paymentMethod: 'Ninguno',
      autoRenew: false
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(subData));
    localStorage.removeItem(LEGACY_PREMIUM_KEY);
    this.notify(false);
  }

  public onVipChange(listener: (isVip: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(isVip: boolean) {
    this.listeners.forEach((l) => {
      try {
        l(isVip);
      } catch (e) {
        console.error(e);
      }
    });
  }

  // Legal Consent Audit Trail
  public getConsentLogs(): ConsentLogRecord[] {
    try {
      const raw = localStorage.getItem(CONSENT_LOGS_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Error reading consent logs:', e);
    }
    return [];
  }

  public getLatestConsent(): ConsentLogRecord | null {
    const logs = this.getConsentLogs();
    return logs.length > 0 ? logs[0] : null;
  }

  public saveConsentLog(record: Omit<ConsentLogRecord, 'id' | 'timestamp' | 'formattedDate' | 'isoDate' | 'legalVersion'>): ConsentLogRecord {
    const now = new Date();
    const fullRecord: ConsentLogRecord = {
      id: 'consent_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      timestamp: now.getTime(),
      formattedDate: now.toLocaleString(),
      isoDate: now.toISOString(),
      legalVersion: '1.0.0',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      ...record
    };

    try {
      const logs = this.getConsentLogs();
      logs.unshift(fullRecord);
      // Keep up to 50 logs for history and auditing
      localStorage.setItem(CONSENT_LOGS_KEY, JSON.stringify(logs.slice(0, 50)));
      localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    } catch (e) {
      console.warn('Error writing consent log:', e);
    }

    // Enviar respaldo asíncrono a la tabla "consentimientos" en Supabase
    void registrarConsentimientoEnSupabase({
      consent_id: fullRecord.id,
      consent_type: fullRecord.consentType,
      terms_accepted: fullRecord.termsAccepted,
      privacy_accepted: fullRecord.privacyAccepted,
      refund_policy_accepted: fullRecord.refundPolicyAccepted,
      legal_version: fullRecord.legalVersion,
      accepted_at: fullRecord.isoDate,
      user_agent: fullRecord.userAgent,
      codigo_activacion: fullRecord.codigo
    });

    return fullRecord;
  }

  public hasAcceptedCookieConsent(): boolean {
    return localStorage.getItem(COOKIE_CONSENT_KEY) === 'true';
  }

  public acceptCookieConsent(): void {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    this.saveConsentLog({
      consentType: 'cookie_banner',
      termsAccepted: true,
      privacyAccepted: true,
      refundPolicyAccepted: true
    });
  }
}

export const vipManager = new VipManager();

// Feature limits for Free users
export const FREE_LIMITS = {
  MAX_FONTS: 4, // Solo las primeras 4 fuentes son gratuitas
  ONLY_CAT_STICKERS_FREE: true, // Únicamente los stickers de gatitos (😸😹😻😼😽🙀😿😾😺🐈‍⬛🐱🐾) son gratuitos
  MAX_NOTES: 3, // Solo 3 notas en el plan gratuito
  ALLOWED_HIGHLIGHT_COLORS: ['gold', 'gris'] as const, // Solo amarillo y gris son gratuitos; los demás requieren VIP
  CUSTOM_SHELF_IMAGE: false, // Subir foto personalizada de estantería requiere VIP
  MUSIC_PLAYER: false // Reproductor de música requiere VIP
};
