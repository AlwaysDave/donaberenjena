import { Participant, ParticipantStatus, Activity } from '../types';

export interface MigrationPreviewItem {
  id: string;
  fullName: string;
  activityTitle: string;
  previousStatus: string;
  targetStatus: ParticipantStatus;
  changes: Partial<Participant>;
  reason: string;
}

export interface MigrationSimulationResult {
  totalParticipants: number;
  alreadyNormalized: number;
  affectedCount: number;
  itemsToMigrate: MigrationPreviewItem[];
  occupancyInconsistencies: {
    activityId: string;
    activityTitle: string;
    currentBookedSpots: number;
    expectedBookedSpots: number;
    difference: number;
  }[];
}

/**
 * Simulates the normalization of participant statuses according to Bloque 5.
 */
export function simulateParticipantMigration(
  participants: Participant[],
  activities: Activity[]
): MigrationSimulationResult {
  const itemsToMigrate: MigrationPreviewItem[] = [];
  let alreadyNormalized = 0;

  for (const p of participants) {
    const rawStatus = p.status as string;
    let needsMigration = false;
    let targetStatus: ParticipantStatus = p.status;
    const changes: Partial<Participant> = {};
    let reason = '';

    // Mapeo 1: 'confirmada' -> 'pagada'
    if (rawStatus === 'confirmada') {
      needsMigration = true;
      targetStatus = 'pagada';
      changes.status = 'pagada';
      changes.paidAmount = p.paidAmount || p.totalAmount;
      reason = 'Estado "confirmada" normalizado a "pagada"';
    }
    // Mapeo 2: attended: true cuando status no es 'asistio'
    else if (p.attended && rawStatus !== 'asistio') {
      needsMigration = true;
      targetStatus = 'asistio';
      changes.status = 'asistio';
      changes.attended = true;
      reason = 'Booleano attended:true normalizado a estado "asistio"';
    }
    // Mapeo 3: 'no_asistio' -> 'cancelada' injustificada con motivo 'No presentado'
    else if (rawStatus === 'no_asistio') {
      needsMigration = true;
      targetStatus = 'cancelada';
      changes.status = 'cancelada';
      changes.cancellationReason = p.cancellationReason || 'No presentado';
      changes.cancellationJustified = false;
      changes.cancellationKind = 'no_presentado';
      reason = 'Estado "no_asistio" normalizado a cancelación injustificada (No presentado)';
    }
    // Mapeo 4: 'cancelada' sin cancellationKind o sin cancellationJustified
    else if (rawStatus === 'cancelada') {
      if (p.cancellationJustified === undefined || !p.cancellationKind) {
        needsMigration = true;
        targetStatus = 'cancelada';
        changes.cancellationJustified = p.justified === true || p.cancellationJustified === true;
        changes.cancellationKind = changes.cancellationJustified ? 'cancelacion_usuario' : (p.cancellationKind || 'cancelacion_usuario');
        changes.cancellationReason = p.cancellationReason || p.justificationReason || 'Cancelación administrativa';
        reason = 'Estructura canónica de cancelación completada';
      }
    }

    if (needsMigration) {
      itemsToMigrate.push({
        id: p.id,
        fullName: p.fullName || 'Participante sin nombre',
        activityTitle: p.activityTitle || 'Actividad',
        previousStatus: rawStatus,
        targetStatus,
        changes,
        reason
      });
    } else {
      alreadyNormalized++;
    }
  }

  // Detect occupancy inconsistencies on activities
  const occupancyInconsistencies: MigrationSimulationResult['occupancyInconsistencies'] = [];
  for (const act of activities) {
    const actParts = participants.filter(p => p.activityId === act.id);
    const consumingCount = actParts.filter(p => {
      const st = p.status as string;
      return st === 'pendiente_pago' || st === 'pagada' || st === 'asistio' || st === 'confirmada';
    }).length;

    if (consumingCount !== act.bookedSpots) {
      occupancyInconsistencies.push({
        activityId: act.id,
        activityTitle: act.title,
        currentBookedSpots: act.bookedSpots,
        expectedBookedSpots: consumingCount,
        difference: consumingCount - act.bookedSpots
      });
    }
  }

  return {
    totalParticipants: participants.length,
    alreadyNormalized,
    affectedCount: itemsToMigrate.length,
    itemsToMigrate,
    occupancyInconsistencies
  };
}
