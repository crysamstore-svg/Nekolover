// VIP Subscription Management for NekoLover Read
// Price: $2.00 USD / month

export interface VipSubscriptionData {
  isVip: boolean;
  subscribedAt: number | null;
  expiresAt: number | null;
  planName: string;
  paymentMethod: string;
  autoRenew: boolean;
}

const STORAGE_KEY = 'nl_vip_subscription';

class VipManager {
  private listeners: Set<(isVip: boolean) => void> = new Set();

  public getSubscription(): VipSubscriptionData {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        // Check if expired
        if (data.expiresAt && Date.now() > data.expiresAt) {
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

  public subscribe(paymentMethod: string = 'Tarjeta'): VipSubscriptionData {
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const subData: VipSubscriptionData = {
      isVip: true,
      subscribedAt: now,
      expiresAt: now + thirtyDays,
      planName: 'Suscripción Mensual VIP ($2 USD/mes)',
      paymentMethod,
      autoRenew: true
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(subData));
    this.notify(true);
    return subData;
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
