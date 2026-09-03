import { Activity, Participant, ParticipantStatus } from '../types';

/**
 * Service for canonical participant state transitions (Bloque 5)
 */

export interface TransitionResult {
  allowed: boolean;
  error?: string;
  updatedParticipant?: Partial<Participant>;
  spotsDelta?: number; // Change in booked spots: +1, -1, or 0
}

/**
 * Checks whether an activity has already concluded based on date and time or explicit status
 */
export function isActivityConcluded(activity: Activity): boolean {
  if (activity.status === 'celebrada') return true;
  if (!activity.date) return false;
  const today = new Date().toISOString().split('T')[0];
  if (activity.date < today) return true;
  if (activity.date > today) return false;
  const timeStr = activity.time || '23:59';
  const cleanTime = timeStr.replace(/[^0-9:]/g, '').trim() || '23:59';
  const actDateTime = new Date(`${activity.date}T${cleanTime.padStart(5, '0')}:00`);
  return !isNaN(actDateTime.getTime()) && new Date() > actDateTime;
}

/**
 * Checks whether an activity is today or in the past (eligible for check-in)
 */
export function isActivityTodayOrPast(activity: Activity): boolean {
  if (activity.status === 'celebrada') return true;
  if (!activity.date) return true;
  const today = new Date().toISOString().split('T')[0];
  return activity.date <= today;
}

/**
 * Helper to check if a status consumes a spot
 */
export function doesStatusConsumeSpot(status: ParticipantStatus): boolean {
  return status === 'pendiente_pago' || status === 'pagada' || status === 'asistio';
}

/**
 * Validates and executes a transition from one state to another
 */
export function validateAndPrepareTransition({
  participant,
  targetStatus,
  activity,
  actor = 'Administración',
  cancellationData
}: {
  participant: Participant;
  targetStatus: ParticipantStatus;
  activity?: Activity;
  actor?: string;
  cancellationData?: {
    reason: string;
    justified: boolean;
    kind: 'cancelacion_usuario' | 'no_presentado';
  };
}): TransitionResult {
  const currentStatus = participant.status;
  const nowIso = new Date().toISOString();

  // 1. Terminal / Rectification transitions
  // 1a. From 'cancelada' -> 'asistio' (Late arrival or check-in correction)
  if (currentStatus === 'cancelada' && targetStatus === 'asistio') {
    return {
      allowed: true,
      updatedParticipant: {
        status: 'asistio',
        attendedAt: nowIso,
        attendedBy: actor,
        cancellationReason: undefined,
        cancellationJustified: undefined,
        cancellationKind: undefined,
        cancelledAt: undefined,
        cancelledBy: undefined,
        paidAmount: participant.paidAmount || participant.totalAmount,
        updatedAt: nowIso
      },
      spotsDelta: 0
    };
  }

  // 1b. From 'cancelada' -> 'pagada' / 'pendiente_pago' (Administrative reactivation)
  if (currentStatus === 'cancelada' && (targetStatus === 'pagada' || targetStatus === 'pendiente_pago')) {
    return {
      allowed: true,
      updatedParticipant: {
        status: targetStatus,
        cancellationReason: undefined,
        cancellationJustified: undefined,
        cancellationKind: undefined,
        cancelledAt: undefined,
        cancelledBy: undefined,
        updatedAt: nowIso
      },
      spotsDelta: 0
    };
  }

  // 1c. From 'asistio' -> 'cancelada' (Correction to unjustified cancellation / no-show)
  if (currentStatus === 'asistio' && targetStatus === 'cancelada') {
    return {
      allowed: true,
      updatedParticipant: {
        status: 'cancelada',
        cancellationReason: cancellationData?.reason?.trim() || 'No presentado',
        cancellationJustified: cancellationData?.justified ?? false,
        cancellationKind: cancellationData?.kind || 'no_presentado',
        cancelledAt: nowIso,
        cancelledBy: actor,
        attendedAt: undefined,
        attendedBy: undefined,
        updatedAt: nowIso
      },
      spotsDelta: 0
    };
  }

  // 1d. From 'asistio' -> 'pagada' (Unmark attendance back to paid)
  if (currentStatus === 'asistio' && targetStatus === 'pagada') {
    return {
      allowed: true,
      updatedParticipant: {
        status: 'pagada',
        attendedAt: undefined,
        attendedBy: undefined,
        updatedAt: nowIso
      },
      spotsDelta: 0
    };
  }

  // 2. Transición desde lista de espera
  if (currentStatus === 'lista_de_espera') {
    if (targetStatus !== 'pendiente_pago' && targetStatus !== 'pagada') {
      return {
        allowed: false,
        error: 'Desde lista de espera solo se puede promocionar a "Pendiente de pago" o "Pagada".'
      };
    }

    if (activity) {
      if (isActivityConcluded(activity)) {
        return {
          allowed: false,
          error: 'No se puede promocionar de lista de espera en una actividad que ya ha finalizado.'
        };
      }

      if (activity.bookedSpots >= activity.totalSpots) {
        return {
          allowed: false,
          error: 'No hay plazas libres disponibles para promocionar a este participante.'
        };
      }
    }

    return {
      allowed: true,
      updatedParticipant: {
        status: targetStatus,
        updatedAt: nowIso
      },
      spotsDelta: +1
    };
  }

  // 3. Confirmar pago: pendiente_pago -> pagada
  if (currentStatus === 'pendiente_pago' && targetStatus === 'pagada') {
    return {
      allowed: true,
      updatedParticipant: {
        status: 'pagada',
        paidAmount: participant.totalAmount,
        updatedAt: nowIso
      },
      spotsDelta: 0
    };
  }

  // 4. Check-in (asistio) desde pendiente_pago o pagada
  if ((currentStatus === 'pendiente_pago' || currentStatus === 'pagada') && targetStatus === 'asistio') {
    if (activity && !isActivityTodayOrPast(activity)) {
      return {
        allowed: false,
        error: 'El registro de check-in solo está permitido el día de la actividad o después de su celebración.'
      };
    }

    return {
      allowed: true,
      updatedParticipant: {
        status: 'asistio',
        attendedAt: nowIso,
        attendedBy: actor,
        paidAmount: currentStatus === 'pendiente_pago' ? participant.totalAmount : participant.paidAmount,
        updatedAt: nowIso
      },
      spotsDelta: 0
    };
  }

  // 5. Cancelación desde pendiente_pago o pagada
  if ((currentStatus === 'pendiente_pago' || currentStatus === 'pagada') && targetStatus === 'cancelada') {
    if (!cancellationData || !cancellationData.reason.trim()) {
      return {
        allowed: false,
        error: 'Es obligatorio indicar un motivo para la cancelación.'
      };
    }

    return {
      allowed: true,
      updatedParticipant: {
        status: 'cancelada',
        cancellationReason: cancellationData.reason.trim(),
        cancellationJustified: cancellationData.justified,
        cancellationKind: cancellationData.kind,
        cancelledAt: nowIso,
        cancelledBy: actor,
        updatedAt: nowIso
      },
      // Libera 1 plaza solo si la actividad no ha concluido aún
      spotsDelta: activity && isActivityConcluded(activity) ? 0 : -1
    };
  }

  return {
    allowed: false,
    error: `Transición no permitida de "${currentStatus}" a "${targetStatus}".`
  };
}

/**
 * Closes attendance for an activity, converting all pending / paid participants to
 * 'cancelada' with 'no_presentado' and cancellationJustified: false.
 */
export function prepareAttendanceClose(
  participants: Participant[],
  activity: Activity,
  actor: string = 'Administración'
): {
  affectedCount: number;
  updatedParticipants: { id: string; updates: Partial<Participant> }[];
} {
  const nowIso = new Date().toISOString();
  const pendingOrPaid = participants.filter(
    p => p.activityId === activity.id && (p.status === 'pendiente_pago' || p.status === 'pagada' || p.status === 'confirmada')
  );

  const updatedParticipants = pendingOrPaid.map(p => ({
    id: p.id,
    updates: {
      status: 'cancelada' as ParticipantStatus,
      cancellationReason: 'No presentado',
      cancellationJustified: false,
      cancellationKind: 'no_presentado' as const,
      cancelledAt: nowIso,
      cancelledBy: actor,
      updatedAt: nowIso
    }
  }));

  return {
    affectedCount: pendingOrPaid.length,
    updatedParticipants
  };
}
