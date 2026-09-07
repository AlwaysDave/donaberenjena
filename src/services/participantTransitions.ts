import { Activity, Participant, ParticipantStatus, CancellationKind } from '../types';

/**
 * Service for canonical participant state transitions and timing validations.
 */

export interface TransitionResult {
  allowed: boolean;
  error?: string;
  updatedParticipant?: Partial<Participant>;
  spotsDelta?: number; // Change in booked spots: +1, -1, or 0
}

export interface AttendanceSheetStatus {
  isComplete: boolean;
  pendingCount: number;
  pendingParticipantIds: string[];
}

/**
 * Pure, typed and shared function that determines if an activity's attendance sheet
 * is fully resolved before marking the activity as 'celebrada'.
 * 
 * Rules (T-03):
 * - Incomplete if at least one participant is in 'pendiente_pago' or 'pagada'.
 * - 'asistio' and 'cancelada' (justified or unjustified / no_presentado) are resolved.
 * - 'lista_de_espera' is informative and does NOT occupy a spot or block closing.
 */
export function checkAttendanceSheetComplete(
  participants: Array<{ id: string; activityId: string; status: ParticipantStatus | string }>,
  activityId: string
): AttendanceSheetStatus {
  const activityParticipants = participants.filter(p => p.activityId === activityId);
  const pending = activityParticipants.filter(
    p => p.status === 'pendiente_pago' || p.status === 'pagada'
  );
  return {
    isComplete: pending.length === 0,
    pendingCount: pending.length,
    pendingParticipantIds: pending.map(p => p.id)
  };
}

/**
 * Validates that endTime is strictly after startTime (for same-day activities).
 */
export function validateActivityTimes(time?: string, endTime?: string): { valid: boolean; error?: string } {
  if (!time || !endTime) {
    return { valid: true };
  }
  const cleanStart = time.replace(/[^0-9:]/g, '').trim();
  const cleanEnd = endTime.replace(/[^0-9:]/g, '').trim();

  const [startH, startM = 0] = cleanStart.split(':').map(Number);
  const [endH, endM = 0] = cleanEnd.split(':').map(Number);

  if (isNaN(startH) || isNaN(endH)) {
    return { valid: true };
  }

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (endMinutes <= startMinutes) {
    return {
      valid: false,
      error: `La hora de fin (${endTime}) debe ser posterior a la hora de inicio (${time}).`
    };
  }

  return { valid: true };
}

/**
 * Checks whether an activity has already started (date + time).
 */
export function hasActivityStarted(activity: Activity): boolean {
  if (activity.status === 'celebrada') return true;
  if (!activity.date) return true;
  const timeStr = activity.time || '00:00';
  const cleanTime = timeStr.replace(/[^0-9:]/g, '').trim() || '00:00';
  const actDateTime = new Date(`${activity.date}T${cleanTime.padStart(5, '0')}:00`);
  if (isNaN(actDateTime.getTime())) return true;
  return new Date() >= actDateTime;
}

/**
 * Checks whether an activity date is today or in the past.
 */
export function isActivityTodayOrPast(activity: Activity): boolean {
  if (activity.status === 'celebrada') return true;
  if (!activity.date) return false;
  const today = new Date().toISOString().split('T')[0];
  return activity.date <= today;
}

/**
 * Checks whether an activity has concluded.
 * A session is concluded ONLY when date + endTime <= now OR status is 'celebrada'.
 * If endTime is missing and status is not 'celebrada', it is NOT concluded by default.
 */
export function isActivityConcluded(activity: Activity): boolean {
  if (activity.status === 'celebrada') return true;
  if (!activity.date) return false;

  // Safe strategy for legacy/activities without endTime: not concluded by default unless celebrada
  if (!activity.endTime) {
    return false;
  }

  const today = new Date().toISOString().split('T')[0];
  if (activity.date < today) return true;
  if (activity.date > today) return false;

  const timeStr = activity.endTime;
  const cleanTime = timeStr.replace(/[^0-9:]/g, '').trim() || '23:59';
  const actEndDateTime = new Date(`${activity.date}T${cleanTime.padStart(5, '0')}:00`);
  return !isNaN(actEndDateTime.getTime()) && new Date() >= actEndDateTime;
}

/**
 * Helper to check if a status consumes a spot
 */
export function doesStatusConsumeSpot(status: ParticipantStatus): boolean {
  return status === 'pendiente_pago' || status === 'pagada' || status === 'asistio';
}

/**
 * Validates and executes a transition from one state to another.
 *
 * Strictly allowed transitions:
 * - lista_de_espera -> pendiente_pago (Acción manual, plaza libre, no finalizada)
 * - lista_de_espera -> pagada (Acción manual, plaza libre, no finalizada)
 * - pendiente_pago -> pagada (Confirmación de pago)
 * - pendiente_pago -> asistio (Check-in permitido tras inicio y antes de fin)
 * - pagada -> asistio (Check-in permitido tras inicio y antes de fin)
 * - pendiente_pago -> cancelada (Cancelación completa o no presentado)
 * - pagada -> cancelada (Cancelación completa o no presentado)
 *
 * ALL other transitions are strictly forbidden.
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
    kind: CancellationKind;
    refundAmount?: number;
  };
}): TransitionResult {
  const currentStatus = participant.status;
  const nowIso = new Date().toISOString();

  // If activity is already celebrated, forbid all state modifications and promotions
  if (activity?.status === 'celebrada') {
    return {
      allowed: false,
      error: 'La actividad ya está celebrada. No se permiten transiciones en una actividad cerrada/celebrada.'
    };
  }

  // No-op if same status
  if (currentStatus === targetStatus) {
    return {
      allowed: true,
      updatedParticipant: { updatedAt: nowIso },
      spotsDelta: 0
    };
  }

  // Final states rule: asistio and cancelada can NEVER transition to anything
  if (currentStatus === 'asistio') {
    return {
      allowed: false,
      error: 'El estado "asistio" es final y no admite transiciones hacia ningún otro estado.'
    };
  }

  if (currentStatus === 'cancelada') {
    return {
      allowed: false,
      error: 'El estado "cancelada" es final y no admite transiciones hacia ningún otro estado.'
    };
  }

  // 1. Promotion from lista_de_espera
  if (currentStatus === 'lista_de_espera') {
    if (targetStatus !== 'pendiente_pago' && targetStatus !== 'pagada') {
      return {
        allowed: false,
        error: 'Desde "lista_de_espera" solo se permite promocionar a "pendiente_pago" o "pagada". No se permite cancelar ni pasar a asistió.'
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
          error: `No hay plazas libres disponibles (${activity.bookedSpots}/${activity.totalSpots}) para promocionar a este participante.`
        };
      }
    }

    return {
      allowed: true,
      updatedParticipant: {
        status: targetStatus,
        paidAmount: targetStatus === 'pagada' ? (participant.paidAmount || participant.totalAmount) : (participant.paidAmount || 0),
        updatedAt: nowIso
      },
      spotsDelta: +1
    };
  }

  // 2. Transition to 'pagada'
  if (targetStatus === 'pagada') {
    if (currentStatus !== 'pendiente_pago') {
      return {
        allowed: false,
        error: `No se permite la transición a "pagada" desde el estado "${currentStatus}".`
      };
    }

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

  // 3. Transition to 'asistio' (Check-in)
  if (targetStatus === 'asistio') {
    if (currentStatus !== 'pendiente_pago' && currentStatus !== 'pagada') {
      return {
        allowed: false,
        error: `El check-in a "asistio" solo está permitido para inscripciones en "pendiente_pago" o "pagada" (estado actual: "${currentStatus}").`
      };
    }

    if (activity) {
      if (!hasActivityStarted(activity)) {
        return {
          allowed: false,
          error: `El registro de check-in solo está permitido una vez iniciada la actividad (${activity.time || 'hora fijada'}).`
        };
      }

      if (isActivityConcluded(activity)) {
        return {
          allowed: false,
          error: 'La actividad ya ha finalizado. No se permite realizar nuevos check-in una vez concluida.'
        };
      }
    }

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
        cancellationRefund: undefined,
        // Mark paid if it was pendiente_pago
        paidAmount: participant.paidAmount ? Math.max(participant.paidAmount, participant.totalAmount) : participant.totalAmount,
        updatedAt: nowIso
      },
      spotsDelta: 0 // Was already consuming a spot in pendiente_pago or pagada
    };
  }

  // 4. Transition to 'cancelada'
  if (targetStatus === 'cancelada') {
    if (currentStatus !== 'pendiente_pago' && currentStatus !== 'pagada') {
      return {
        allowed: false,
        error: `Solo se pueden cancelar reservas en estado "pendiente_pago" o "pagada" (estado actual: "${currentStatus}").`
      };
    }

    const kind: CancellationKind = cancellationData?.kind || 'cancelacion_usuario';
    const reason = cancellationData?.reason?.trim() || (kind === 'no_presentado' ? 'No presentado' : 'Cancelación');
    const justified = kind === 'no_presentado' ? false : (cancellationData?.justified ?? false);

    // If kind === 'cancelacion_usuario': liberates 1 spot (spotsDelta: -1).
    // If kind === 'no_presentado': does NOT liberate spot (spotsDelta: 0).
    const spotsDelta = kind === 'cancelacion_usuario' ? -1 : 0;

    return {
      allowed: true,
      updatedParticipant: {
        status: 'cancelada',
        cancellationReason: reason,
        cancellationJustified: justified,
        cancellationKind: kind,
        cancelledAt: nowIso,
        cancelledBy: actor,
        cancellationRefund: cancellationData?.refundAmount,
        attendedAt: undefined,
        attendedBy: undefined,
        updatedAt: nowIso
      },
      spotsDelta
    };
  }

  // Catch-all forbidden transitions (e.g. pagada -> pendiente_pago, etc.)
  return {
    allowed: false,
    error: `Transición estrictamente prohibida de "${currentStatus}" a "${targetStatus}".`
  };
}


