import { verificarCodigo, revalidarCodigoSilencioso, registrarConsentimientoEnSupabase } from './supabase';
import { safeJsonParse } from './sanitizeHtml';

export interface VipSubscriptionData {
  isVip: boolean;
  subscribedAt: number | null;
  expiresAt: number | null;
  planName: string;
  paymentMethod: string;
  email?: string;
  autoRenew: boolean;
  activationCode?: string;
  integrityTag?: string;
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
const INTEGRITY_SALT = 'NL-VIP-CORE-2026-DARK-REBORN';

const FREE_PLAN_DATA: VipSubscriptionData = {
  isVip: false,
  subscribedAt: null,
  expiresAt: null,
  planName: 'Plan Gratuito',
  paymentMethod: 'Ninguno',
  autoRenew: false
};

function computeVipIntegrityTag(sub: {
  isVip: boolean;
  subscribedAt: number | null;
  expiresAt: number | null;
  paymentMethod: string;
  activationCode?: string;
}): string {
  const payload = [
    INTEGRITY_SALT,
    sub.isVip ? '1' : '0',
    String(sub.subscribedAt ?? 0),
    String(sub.expiresAt ?? 0),
    sub.paymentMethod || '',
    (sub.activationCode || '').toUpperCase()
  ].join('|');

  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < payload.length; i++) {
    const ch = payload.charCodeAt(i);
    h1 ^= ch;
    h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 ^= (ch + i) & 0xff;
    h2 = Math.imul(h2, 0x85ebca6b) >>> 0;
  }
  return `${h1.toString(36)}-${h2.toString(36)}`;
}

function isValidVipObject(val: unknown): val is VipSubscriptionData {
  if (!val || typeof val !== 'object' || Array.isArray(val)) return false;
  const obj = val as Record<string, unknown>;
  return (
    typeof obj.isVip === 'boolean' &&
    typeof obj.planName === 'string' &&
    typeof obj.paymentMethod === 'string'
  );
}

class VipManager {
  private listeners: Set<(isVip: boolean) => void> = new Set();
  private approvedPayPalIds: Set<string> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      // Siempre recalcular desde el estado verificado e ignorar cualquier payload arbitrario del evento
      window.addEventListener('vip_status_changed', () => {
        this.notify(this.isVip());
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
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        // Rechazar flag suelto usuario_premium='true' sin registro íntegro
        if (localStorage.getItem(LEGACY_PREMIUM_KEY) === 'true') {
          localStorage.removeItem(LEGACY_PREMIUM_KEY);
        }
        return { ...FREE_PLAN_DATA };
      }

      const data = safeJsonParse<VipSubscriptionData | null>(saved, null, isValidVipObject);
      if (!data) {
        return { ...FREE_PLAN_DATA };
      }

      if (!data.isVip) {
        return { ...FREE_PLAN_DATA };
      }

      // Verificar fecha de expiración válida (no expirada ni manipulada con un horizonte irreal > 400 días)
      const now = Date.now();
      const maxFutureMs = 400 * 24 * 60 * 60 * 1000;
      if (!data.expiresAt || typeof data.expiresAt !== 'number' || now > data.expiresAt || data.expiresAt - now > maxFutureMs) {
        localStorage.removeItem(LEGACY_PREMIUM_KEY);
        return { ...FREE_PLAN_DATA };
      }

      // Verificar etiqueta de integridad para evitar alteración trivial en localStorage
      const expectedTag = computeVipIntegrityTag({
        isVip: data.isVip,
        subscribedAt: data.subscribedAt,
        expiresAt: data.expiresAt,
        paymentMethod: data.paymentMethod,
        activationCode: data.activationCode
      });

      if (!data.integrityTag || data.integrityTag !== expectedTag) {
        localStorage.removeItem(LEGACY_PREMIUM_KEY);
        return { ...FREE_PLAN_DATA };
      }

      return data;
    } catch (e) {
      console.warn('Error reading VIP status:', e);
    }

    return { ...FREE_PLAN_DATA };
  }

  public isVip(): boolean {
    return this.getSubscription().isVip;
  }

  // Registrar en memoria únicamente un ID de suscripción recién aprobado por el SDK oficial de PayPal
  public registerApprovedPayPalId(subscriptionId: string): void {
    const clean = subscriptionId?.trim().toUpperCase();
    if (clean && clean.length >= 6 && clean.length <= 64) {
      this.approvedPayPalIds.add(clean);
    }
  }

  // Solo activar el VIP cuando el código sea insertado por el usuario y validado
  public subscribe(_paymentMethod: string = 'PayPal', _email?: string): VipSubscriptionData {
    return this.getSubscription();
  }

  private persistVerifiedSubscription(subInput: Omit<VipSubscriptionData, 'integrityTag'>): VipSubscriptionData {
    const integrityTag = computeVipIntegrityTag({
      isVip: subInput.isVip,
      subscribedAt: subInput.subscribedAt,
      expiresAt: subInput.expiresAt,
      paymentMethod: subInput.paymentMethod,
      activationCode: subInput.activationCode
    });

    const signedData: VipSubscriptionData = {
      ...subInput,
      integrityTag
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(signedData));
    localStorage.setItem(LEGACY_PREMIUM_KEY, 'true');
    this.notify(true);
    return signedData;
  }

  /**
   * Revalidación silenciosa al arrancar para revocar códigos desactivados en Supabase.
   */
  public async revalidateWithServer(): Promise<void> {
    const current = this.getSubscription();
    if (!current.isVip || !current.activationCode) return;
    // Solo revalidar códigos provenientes de Supabase (no IDs locales de sesión PayPal si no empiezan como código)
    if (current.paymentMethod.startsWith('Código Activación')) return;

    const status = await revalidarCodigoSilencioso(current.activationCode);
    if (status === 'invalid') {
      this.cancel();
    }
  }

  /**
   * Validación asíncrona de código de activación:
   * Consulta en tiempo real la base de datos de Supabase mediante GET fetch en la tabla "suscripciones".
   */
  public async activateWithCodeAsync(code: string, email?: string): Promise<{ success: boolean; message: string; sub?: VipSubscriptionData }> {
    const cleanCode = code.trim();
    if (!cleanCode) {
      return { 
        success: false, 
        message: 'Por favor, introduce el código de activación en la casilla.' 
      };
    }

    if (cleanCode.length < 4 || cleanCode.length > 64) {
      return {
        success: false,
        message: 'El código de activación debe tener entre 4 y 64 caracteres.'
      };
    }

    try {
      const supRes = await verificarCodigo(cleanCode);
      if (supRes.success) {
        const matchedCode = (supRes.matchedCode || cleanCode).toUpperCase();
        const now = Date.now();
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        const subData = this.persistVerifiedSubscription({
          isVip: true,
          subscribedAt: now,
          expiresAt: now + thirtyDays,
          planName: 'Suscripción Mensual VIP ($2 USD/mes)',
          paymentMethod: `Supabase [${matchedCode}]`,
          autoRenew: true,
          activationCode: matchedCode
        });

        this.saveConsentLog({
          consentType: 'vip_checkout_paypal',
          termsAccepted: true,
          privacyAccepted: true,
          refundPolicyAccepted: true,
          codigo: matchedCode
        });

        return {
          success: true,
          message: supRes.message,
          sub: subData
        };
      }

      // Si acaba de completar el pago oficial de PayPal en esta sesión, permitir su ID aprobado
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
    const subData = this.persistVerifiedSubscription({
      isVip: true,
      subscribedAt: now,
      expiresAt: now + thirtyDays,
      planName: 'Suscripción Mensual VIP ($2 USD/mes)',
      paymentMethod: `Código Activación (${cleanCode})`,
      email: email?.trim() || undefined,
      autoRenew: false,
      activationCode: cleanCode
    });

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
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...FREE_PLAN_DATA }));
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
    const raw = localStorage.getItem(CONSENT_LOGS_KEY);
    return safeJsonParse<ConsentLogRecord[]>(
      raw,
      [],
      (val): val is ConsentLogRecord[] => Array.isArray(val)
    );
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
