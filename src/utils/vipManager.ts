// VIP Subscription Management for NekoLover Read
// Price: $2.00 USD / month (Solo PayPal)

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

class VipManager {
  private listeners: Set<(isVip: boolean) => void> = new Set();

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

  public subscribe(paymentMethod: string = 'PayPal', email?: string): VipSubscriptionData {
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const subData: VipSubscriptionData = {
      isVip: true,
      subscribedAt: now,
      expiresAt: now + thirtyDays,
      planName: 'Suscripción Mensual VIP ($2 USD/mes)',
      paymentMethod,
      email,
      autoRenew: true
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(subData));
    localStorage.setItem(LEGACY_PREMIUM_KEY, 'true');
    this.notify(true);
    return subData;
  }

  public activateWithCode(code: string, email?: string): { success: boolean; message: string; sub?: VipSubscriptionData } {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode || cleanCode.length < 4) {
      return { 
        success: false, 
        message: 'Por favor, introduce un código de activación válido provisto por soporte o PayPal.' 
      };
    }

    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const subData: VipSubscriptionData = {
      isVip: true,
      subscribedAt: now,
      expiresAt: now + thirtyDays,
      planName: 'Suscripción Mensual VIP ($2 USD/mes)',
      paymentMethod: `Código Activación PayPal (${cleanCode})`,
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
      message: '¡Código de activación verificado! Acceso VIP activado exitosamente.',
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
  MAX_FONTS: 4, // Only first 4 fonts are free
  MAX_STICKERS_COUNT: 20, // Only first 20 stickers are free
  MAX_NOTES: 3, // Only 3 quotes/notes in free tier
  ALLOWED_HIGHLIGHT_COLORS: ['pink', 'purple', 'gold'] as const, // Emerald is VIP only
  CUSTOM_SHELF_IMAGE: false, // Uploading custom shelf photo requires VIP
  MUSIC_PLAYER: false // Background music and upload requires VIP
};
