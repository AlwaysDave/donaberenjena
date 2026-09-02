/**
 * Google Analytics 4 (GA4) Integration with Strict Privacy & RGPD Consent Gating.
 * 
 * Directives:
 * 1. ZERO TAG INJECTION & ZERO EVENT DISPATCH before explicit user consent for analytics.
 * 2. ZERO PII (Personally Identifiable Information): Never transmit names, emails, phones, Auth UIDs or personal notes.
 * 3. SPA-aware: Manages manual page_view dispatches on route changes.
 * 4. Structured Ecommerce/Funnel Events: view_item, sign_up, and purchase (only post-server confirmation).
 */

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

export type AnalyticsConsentStatus = 'accepted' | 'rejected' | 'pending';

const CONSENT_STORAGE_KEY = 'dnb_cookie_consent_analytics_v1';
let isGA4ScriptInjected = false;

/**
 * Returns the configured GA4 Measurement ID from environment.
 */
export function getGAMeasurementId(): string | undefined {
  const id = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (!id || typeof id !== 'string' || !id.trim().startsWith('G-')) {
    return undefined;
  }
  return id.trim();
}

/**
 * Checks the current analytics cookie consent status.
 */
export function getAnalyticsConsent(): AnalyticsConsentStatus {
  if (typeof window === 'undefined') return 'pending';
  try {
    const val = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (val === 'accepted') return 'accepted';
    if (val === 'rejected') return 'rejected';
    return 'pending';
  } catch {
    return 'pending';
  }
}

/**
 * Returns true only if the user has explicitly consented to analytics cookies.
 */
export function hasAnalyticsConsent(): boolean {
  return getAnalyticsConsent() === 'accepted';
}

/**
 * Updates the user's consent choice and initializes GA4 if accepted.
 */
export function setAnalyticsConsent(granted: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    const status: AnalyticsConsentStatus = granted ? 'accepted' : 'rejected';
    localStorage.setItem(CONSENT_STORAGE_KEY, status);

    if (granted) {
      initGA4();
      // Track current page upon acceptance
      trackGAPageView(window.location.pathname + window.location.search);
    }

    // Notify components that consent changed
    window.dispatchEvent(new CustomEvent('dnb_cookie_consent_changed', { detail: { status } }));
  } catch (err) {
    console.warn('[GA4_CONSENT_SAVE_WARN]', err);
  }
}

/**
 * Initializes Google Analytics 4 dynamically ONLY if consent has been explicitly granted.
 */
export function initGA4(): boolean {
  if (typeof window === 'undefined') return false;

  const measurementId = getGAMeasurementId();
  if (!measurementId) {
    return false;
  }

  // Strict check: DO NOT inject or configure GA4 without analytics consent
  if (!hasAnalyticsConsent()) {
    return false;
  }

  if (isGA4ScriptInjected) {
    return true;
  }

  try {
    // Setup dataLayer and gtag stub
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer?.push(arguments);
    };

    window.gtag('js', new Date());

    // Configure GA4 with send_page_view disabled to prevent duplicate hits in SPA
    window.gtag('config', measurementId, {
      send_page_view: false,
      anonymize_ip: true,
      cookie_flags: 'SameSite=None;Secure'
    });

    // Dynamically inject the gtag script tag
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    script.id = 'google-analytics-gtag';
    document.head.appendChild(script);

    isGA4ScriptInjected = true;
    return true;
  } catch (err) {
    console.warn('[GA4_INIT_WARN]', err);
    return false;
  }
}

/**
 * Tracks a Single-Page Application (SPA) route change as a page_view event.
 * Will NOT fire if cookies have not been accepted.
 */
export function trackGAPageView(path: string, pageTitle?: string): void {
  if (typeof window === 'undefined' || !hasAnalyticsConsent()) return;

  const measurementId = getGAMeasurementId();
  if (!measurementId) return;

  initGA4();

  if (typeof window.gtag === 'function') {
    const cleanPath = path || window.location.pathname;
    const title = pageTitle || document.title || 'Doña Berenjena';

    window.gtag('event', 'page_view', {
      page_title: title,
      page_location: window.location.href,
      page_path: cleanPath,
      send_to: measurementId
    });
  }
}

/**
 * Tracks viewing an item/cata (GA4 recommended event `view_item`).
 * Strict Zero-PII parameterization.
 */
export function trackGAViewItem(activity: {
  id: string;
  title: string;
  type?: string;
  priceNonMember?: number;
  priceMember?: number;
}): void {
  if (typeof window === 'undefined' || !hasAnalyticsConsent()) return;

  const measurementId = getGAMeasurementId();
  if (!measurementId) return;

  initGA4();

  if (typeof window.gtag === 'function') {
    const price = Number(activity.priceNonMember ?? activity.priceMember ?? 0);
    window.gtag('event', 'view_item', {
      currency: 'EUR',
      value: price,
      items: [
        {
          item_id: String(activity.id),
          item_name: String(activity.title),
          item_category: String(activity.type || 'actividad'),
          price: price,
          quantity: 1
        }
      ]
    });
  }
}

/**
 * Tracks opening the registration / reservation modal for an activity (GA4 `sign_up`).
 * Strict Zero-PII parameterization.
 */
export function trackGASignUp(activity: {
  id: string;
  title: string;
  type?: string;
}): void {
  if (typeof window === 'undefined' || !hasAnalyticsConsent()) return;

  const measurementId = getGAMeasurementId();
  if (!measurementId) return;

  initGA4();

  if (typeof window.gtag === 'function') {
    window.gtag('event', 'sign_up', {
      method: 'modal_reserva',
      item_id: String(activity.id),
      item_name: String(activity.title),
      item_category: String(activity.type || 'actividad')
    });
  }
}

/**
 * Tracks a successfully confirmed reservation (GA4 `purchase` / ecommerce transaction).
 * Executed ONLY after successful server confirmation.
 * Strict Zero-PII guarantee (no client names, emails, phones, or notes).
 */
export function trackGAPurchase(params: {
  transactionId: string;
  activityId: string;
  activityTitle: string;
  activityType?: string;
  spots: number;
  totalPrice: number;
}): void {
  if (typeof window === 'undefined' || !hasAnalyticsConsent()) return;

  const measurementId = getGAMeasurementId();
  if (!measurementId) return;

  initGA4();

  if (typeof window.gtag === 'function') {
    const spotsCount = Math.max(1, Number(params.spots) || 1);
    const total = Number(params.totalPrice) || 0;
    const unitPrice = spotsCount > 0 ? Number((total / spotsCount).toFixed(2)) : total;

    window.gtag('event', 'purchase', {
      transaction_id: String(params.transactionId),
      value: total,
      currency: 'EUR',
      items: [
        {
          item_id: String(params.activityId),
          item_name: String(params.activityTitle),
          item_category: String(params.activityType || 'actividad'),
          price: unitPrice,
          quantity: spotsCount
        }
      ]
    });
  }
}
