export type ActivityRegistrationBadge =
  | 'INSCRIPCIONES CERRADAS'
  | 'VACÍA'
  | 'ABIERTA'
  | 'ÚLTIMAS PLAZAS'
  | 'COMPLETA'
  | 'CELEBRADA';

export const LOW_SPOTS_THRESHOLD = 5;

export interface ActivityStatusInfo {
  badge: ActivityRegistrationBadge;
  isClosed: boolean;
  isSoldOut: boolean;
  availableSpots: number;
  occupancyPercentage: number;
  colorClass: string;
  badgeLabel: string;
}

/**
 * Canonical calculation of activity registration status and visual badge.
 * Standard rules:
 * 1. Celebrated -> 'CELEBRADA'
 * 2. registrationStatus === 'cerrada' -> 'INSCRIPCIONES CERRADAS' (priority over occupancy)
 * 3. bookedSpots >= totalSpots -> 'COMPLETA'
 * 4. bookedSpots === 0 -> 'VACÍA'
 * 5. availableSpots <= LOW_SPOTS_THRESHOLD (5) -> 'ÚLTIMAS PLAZAS'
 * 6. Otherwise -> 'ABIERTA'
 */
export function getActivityRegistrationState(activity: {
  status?: string;
  registrationStatus?: 'abierta' | 'cerrada';
  bookedSpots?: number;
  totalSpots?: number;
}): ActivityStatusInfo {
  const isCelebrated = activity.status === 'celebrada';
  const total = Math.max(0, Number(activity.totalSpots || 0));
  const booked = Math.max(0, Number(activity.bookedSpots || 0));
  const available = Math.max(0, total - booked);
  const isSoldOut = total > 0 ? booked >= total : false;
  const occupancyPercentage = total > 0 ? Math.min(100, Math.round((booked / total) * 100)) : 0;

  if (isCelebrated) {
    return {
      badge: 'CELEBRADA',
      isClosed: true,
      isSoldOut,
      availableSpots: available,
      occupancyPercentage,
      colorClass: 'bg-stone-100 text-stone-700 border-stone-300',
      badgeLabel: 'Celebrada'
    };
  }

  // Priority 1 over spots: registrationStatus === 'cerrada'
  if (activity.registrationStatus === 'cerrada') {
    return {
      badge: 'INSCRIPCIONES CERRADAS',
      isClosed: true,
      isSoldOut,
      availableSpots: available,
      occupancyPercentage,
      colorClass: 'bg-rose-100 text-rose-800 border-rose-300',
      badgeLabel: 'Inscripciones Cerradas'
    };
  }

  if (isSoldOut) {
    return {
      badge: 'COMPLETA',
      isClosed: false,
      isSoldOut: true,
      availableSpots: 0,
      occupancyPercentage: 100,
      colorClass: 'bg-rose-100 text-rose-800 border-rose-300',
      badgeLabel: 'Completa'
    };
  }

  if (booked === 0) {
    return {
      badge: 'VACÍA',
      isClosed: false,
      isSoldOut: false,
      availableSpots: available,
      occupancyPercentage: 0,
      colorClass: 'bg-blue-100 text-blue-800 border-blue-200',
      badgeLabel: 'Vacía'
    };
  }

  if (available <= LOW_SPOTS_THRESHOLD && available > 0) {
    return {
      badge: 'ÚLTIMAS PLAZAS',
      isClosed: false,
      isSoldOut: false,
      availableSpots: available,
      occupancyPercentage,
      colorClass: 'bg-amber-100 text-amber-900 border-amber-300',
      badgeLabel: `Últimas ${available} plazas`
    };
  }

  return {
    badge: 'ABIERTA',
    isClosed: false,
    isSoldOut: false,
    availableSpots: available,
    occupancyPercentage,
    colorClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    badgeLabel: 'Abierta'
  };
}
