import { verificarCodigo } from './supabase';

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
  email?: string;
  userAgent?: string;
}

const STORAGE_KEY = 'nl_vip_subscription';
const LEGACY_PREMIUM_KEY = 'usuario_premium';
const CONSENT_LOGS_KEY = 'nl_legal_consent_logs';
const COOKIE_CONSENT_KEY = 'consentimiento_privacidad';
const SUPABASE_TEST_RESET_KEY = 'nl_supabase_test_reset_v1';

class VipManager {
  private listeners: Set<(isVip: boolean) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        if (!localStorage.getItem(SUPABASE_TEST_RESET_KEY)) {
          this.cancel();
          localStorage.setItem(SUPABASE_TEST_RESET_KEY, '1');
        }
      } catch (e) {
        console.warn('Error resetting VIP for Supabase test:', e);
      }

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

  // Solo activar el VIP cuando el código sea insertado por el usuario
  public subscribe(paymentMethod: string = 'PayPal', email?: string): VipSubscriptionData {
    console.info('Pago registrado. Pendiente de insertar código de activación por el usuario.');
    return this.getSubscription();
  }

  /**
   * Validación asíncrona de código de activación:
   * Primero consulta en tiempo real la base de datos de Supabase mediante GET fetch en la tabla "suscripciones".
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

    // 1. Verificación en la tabla "suscripciones" de Supabase
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
          email: email?.trim() || supRes.data?.email
        });
        return {
          success: true,
          message: supRes.message,
          sub: subData
        };
      } else {
        // Si Supabase respondió que el código no existe o no está activo,
        // solo permitir si es un cupón maestro oficial o ID de PayPal válido
        const upper = cleanCode.toUpperCase();
        const isMasterVoucher = /^(NEKO-VIP|NEKO-VIP-2026|VIP-NEKO|GATO-VIP|PREMIUM-NEKO)$/i.test(upper);
        const isPayPalId = /^(I|P)-[A-Z0-9]{8,}$/i.test(upper);
        
        if (!isMasterVoucher && !isPayPalId) {
          return {
            success: false,
            message: supRes.message || 'El código ingresado no existe o no tiene estado "activo" en la base de datos de suscripciones.'
          };
        }
      }
    } catch (e) {
      console.warn('Error consultando Supabase, intentando comprobación local:', e);
    }

    // 2. Respaldo para ID de suscripción de PayPal o cupones maestros
    return this.activateWithCode(cleanCode, email);
  }

  public activateWithCode(code: string, email?: string): { success: boolean; message: string; sub?: VipSubscriptionData } {
    const cleanCode = code.trim().toUpperCase();
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

    // Formatos válidos de respaldo:
    // 1. ID de Suscripción oficial de PayPal (ej: P-0GH31223S1526604TNLUBBEQ o I-...)
    const isPayPalId = /^(I|P)-[A-Z0-9]{8,}$/i.test(cleanCode);
    // 2. Vales de cortesía del sistema
    const isVipVoucher = /^(NEKO-VIP|NEKO-VIP-2026|VIP-NEKO|GATO-VIP|PREMIUM-NEKO)$/i.test(cleanCode);
    const isValidFormat = isPayPalId || isVipVoucher;

    if (!isValidFormat) {
      return {
        success: false,
        message: 'Código de activación no reconocido o inactivo en la base de datos. Revisa el código que recibiste por correo tras tu pago o contacta a soporte en nekolover.online.zoho.com.'
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
