/**
 * Client-side lightweight analytics tracker for public navigation & funnel events.
 * 
 * Strict Privacy & Zero-PII Compliance:
 * - Does NOT collect IPs, emails, names, phones, device fingerprints, or Auth UIDs.
 * - Uses an ephemeral session token in sessionStorage purely to deduplicate refresh events.
 * - Only tracks public pages (ignores /admin and administrative sub-paths).
 * - All tracking calls fail silently to guarantee zero interruption to user experience.
 */

// Memory cache to debounce and avoid double-counting in React Strict Mode
const recentEventsCache = new Map<string, number>();
const DEDUPE_WINDOW_MS = 1500;

function getEphemeralSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  try {
    let sessId = sessionStorage.getItem('dnb_ephemeral_sess');
    if (!sessId) {
      sessId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem('dnb_ephemeral_sess', sessId);
    }
    return sessId;
  } catch {
    return 'ephemeral_fallback';
  }
}

/**
 * Normalizes a URL path to prevent fragment/query pollution.
 */
export function normalizePublicPath(rawPath: string): string {
  if (!rawPath) return '/';
  const clean = rawPath.split('?')[0].split('#')[0].trim().toLowerCase();
  return clean.startsWith('/') ? clean : `/${clean}`;
}

/**
 * Dispatches a metric event to the backend endpoint.
 */
async function sendMetricEvent(payload: {
  type: 'page_view' | 'registration_started' | 'reservation_completed';
  path: string;
  activityId?: string;
}) {
  if (typeof window === 'undefined') return;

  const normalizedPath = normalizePublicPath(payload.path);

  // Exclude administrative routes from public traffic analytics
  if (normalizedPath.startsWith('/admin')) {
    return;
  }

  const dedupeKey = `${payload.type}:${normalizedPath}:${payload.activityId || ''}`;
  const now = Date.now();
  const lastTime = recentEventsCache.get(dedupeKey);

  if (lastTime && now - lastTime < DEDUPE_WINDOW_MS) {
    return; // Skip duplicate trigger within debounce window
  }

  recentEventsCache.set(dedupeKey, now);

  // Clean old dedupe entries
  if (recentEventsCache.size > 100) {
    for (const [k, v] of recentEventsCache.entries()) {
      if (now - v > DEDUPE_WINDOW_MS * 2) {
        recentEventsCache.delete(k);
      }
    }
  }

  const clientEventId = `${getEphemeralSessionId()}_${now}_${Math.random().toString(36).substring(2, 6)}`;

  try {
    await fetch('/api/metrics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: payload.type,
        path: normalizedPath,
        activityId: payload.activityId?.trim() || undefined,
        clientEventId,
      }),
      // Use keepalive if supported for reliable delivery on page unloads
      keepalive: true,
      credentials: 'omit',
    });
  } catch {
    // Non-blocking, fail silently for maximum UX robustness
  }
}

/**
 * Track a public page view.
 */
export function trackPageView(path: string, activityId?: string): void {
  sendMetricEvent({
    type: 'page_view',
    path,
    activityId,
  });
}

/**
 * Track when a user opens the reservation or waiting list modal for an activity.
 */
export function trackRegistrationStarted(activityId: string): void {
  sendMetricEvent({
    type: 'registration_started',
    path: `/actividad/${activityId}`,
    activityId,
  });
}
