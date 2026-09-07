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
  mappingCounts: {
    attendedToAsistio: number;
    confirmadaToPagada: number;
    pendientePago: number;
    noAsistioToCancelada: number;
    canceladaNormalized: number;
    listaEspera: number;
  };
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
 * Normalizes an individual participant record following the exact 6-step hierarchy:
 * 1. status: 'asistio' o attended: true -> asistio
 * 2. confirmada -> pagada
 * 3. pendiente_pago -> pendiente_pago
 * 4. no_asistio -> cancelada, injustificada, cancellationKind: 'no_presentado', motivo 'No presentado'
 * 5. cancelada -> cancelada (conserva o determina justificación con datos válidos)
 * 6. lista_de_espera -> lista_de_espera
 */
export function normalizeParticipantRecord(
  p: Participant,
  actor: string = 'Migración Administrativa'
): { needsMigration: boolean; targetStatus: ParticipantStatus; cleanRecord: Participant; reason: string; mappingKey: string } {
  const rawStatus = (p.status as string) || '';
  const isLegacyAttended = (p as any).attended === true;
  const nowIso = new Date().toISOString();

  // Create clean cloned record (excluding forbidden legacy fields)
  const clean: any = { ...p };
  delete clean.attended;
  delete clean.justified;
  delete clean.justificationReason;

  // Step 1: asistio or legacy attended: true
  if (rawStatus === 'asistio' || isLegacyAttended) {
    clean.status = 'asistio';
    clean.attendedAt = p.attendedAt || (p as any).checkInTime || p.registeredAt || p.createdAt || nowIso;
    clean.attendedBy = p.attendedBy || actor;
    if (clean.paidAmount === undefined && p.totalAmount) {
      clean.paidAmount = p.totalAmount;
    }
    const needsMigration = rawStatus !== 'asistio' || (p as any).attended !== undefined;
    return {
      needsMigration,
      targetStatus: 'asistio',
      cleanRecord: clean as Participant,
      reason: isLegacyAttended && rawStatus !== 'asistio' 
        ? 'Booleano legacy attended:true normalizado a estado "asistio"'
        : 'Registro asistio verificado',
      mappingKey: 'attendedToAsistio'
    };
  }

  // Step 2: confirmada -> pagada or already pagada
  if (rawStatus === 'pagada') {
    clean.status = 'pagada';
    const needsMigration = (p as any).attended !== undefined || (p as any).justified !== undefined;
    return {
      needsMigration,
      targetStatus: 'pagada',
      cleanRecord: clean as Participant,
      reason: 'Inscripción pagada verificada',
      mappingKey: 'confirmadaToPagada'
    };
  }

  if (rawStatus === 'confirmada') {
    clean.status = 'pagada';
    clean.paidAmount = p.paidAmount || p.totalAmount || 0;
    return {
      needsMigration: true,
      targetStatus: 'pagada',
      cleanRecord: clean as Participant,
      reason: 'Estado legacy "confirmada" normalizado a "pagada"',
      mappingKey: 'confirmadaToPagada'
    };
  }

  // Step 3: pendiente_pago -> pendiente_pago
  if (rawStatus === 'pendiente_pago') {
    clean.status = 'pendiente_pago';
    const needsMigration = (p as any).attended !== undefined || (p as any).justified !== undefined;
    return {
      needsMigration,
      targetStatus: 'pendiente_pago',
      cleanRecord: clean as Participant,
      reason: 'Inscripción pendiente de pago',
      mappingKey: 'pendientePago'
    };
  }

  // Step 4: no_asistio -> cancelada (injustificada, no_presentado, 'No presentado')
  if (rawStatus === 'no_asistio') {
    clean.status = 'cancelada';
    clean.cancellationKind = 'no_presentado';
    clean.cancellationJustified = false;
    clean.cancellationReason = p.cancellationReason || 'No presentado';
    clean.cancelledAt = p.cancelledAt || p.registeredAt || p.createdAt || nowIso;
    clean.cancelledBy = p.cancelledBy || actor;
    return {
      needsMigration: true,
      targetStatus: 'cancelada',
      cleanRecord: clean as Participant,
      reason: 'Estado "no_asistio" normalizado a cancelación injustificada (No presentado)',
      mappingKey: 'noAsistioToCancelada'
    };
  }

  // Step 5: cancelada -> cancelada
  if (rawStatus === 'cancelada') {
    clean.status = 'cancelada';
    const isJustified = (p as any).justified === true || p.cancellationJustified === true;
    clean.cancellationJustified = isJustified;
    clean.cancellationKind = isJustified 
      ? 'cancelacion_usuario' 
      : (p.cancellationKind || 'cancelacion_usuario');
    clean.cancellationReason = p.cancellationReason || (p as any).justificationReason || (isJustified ? 'Cancelación justificada' : 'Cancelación administrativa');
    clean.cancelledAt = p.cancelledAt || nowIso;
    clean.cancelledBy = p.cancelledBy || actor;

    const needsMigration = 
      p.cancellationJustified === undefined || 
      !p.cancellationKind || 
      !p.cancelledAt || 
      !p.cancelledBy || 
      (p as any).attended !== undefined ||
      (p as any).justified !== undefined;

    return {
      needsMigration,
      targetStatus: 'cancelada',
      cleanRecord: clean as Participant,
      reason: 'Estructura canónica de cancelación completada',
      mappingKey: 'canceladaNormalized'
    };
  }

  // Step 6: lista_de_espera -> lista_de_espera
  if (rawStatus === 'lista_de_espera') {
    clean.status = 'lista_de_espera';
    const needsMigration = (p as any).attended !== undefined || (p as any).justified !== undefined;
    return {
      needsMigration,
      targetStatus: 'lista_de_espera',
      cleanRecord: clean as Participant,
      reason: 'Registro en lista de espera',
      mappingKey: 'listaEspera'
    };
  }

  // Fallback for any unknown raw status
  clean.status = 'pendiente_pago';
  return {
    needsMigration: true,
    targetStatus: 'pendiente_pago',
    cleanRecord: clean as Participant,
    reason: `Estado desconocido "${rawStatus}" normalizado a "pendiente_pago"`,
    mappingKey: 'pendientePago'
  };
}

/**
 * Simulates the normalization of participant statuses according to Bloque 4.
 */
export function simulateParticipantMigration(
  participants: Participant[],
  activities: Activity[]
): MigrationSimulationResult {
  const itemsToMigrate: MigrationPreviewItem[] = [];
  let alreadyNormalized = 0;

  const mappingCounts = {
    attendedToAsistio: 0,
    confirmadaToPagada: 0,
    pendientePago: 0,
    noAsistioToCancelada: 0,
    canceladaNormalized: 0,
    listaEspera: 0
  };

  for (const p of participants) {
    const rawStatus = (p.status as string) || '';
    const norm = normalizeParticipantRecord(p);

    if (norm.mappingKey && mappingCounts[norm.mappingKey as keyof typeof mappingCounts] !== undefined) {
      mappingCounts[norm.mappingKey as keyof typeof mappingCounts]++;
    }

    if (norm.needsMigration) {
      itemsToMigrate.push({
        id: p.id,
        fullName: p.fullName || 'Participante sin nombre',
        activityTitle: p.activityTitle || 'Actividad',
        previousStatus: rawStatus,
        targetStatus: norm.targetStatus,
        changes: norm.cleanRecord,
        reason: norm.reason
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

    if (consumingCount !== (act.bookedSpots || 0)) {
      occupancyInconsistencies.push({
        activityId: act.id,
        activityTitle: act.title,
        currentBookedSpots: act.bookedSpots || 0,
        expectedBookedSpots: consumingCount,
        difference: consumingCount - (act.bookedSpots || 0)
      });
    }
  }

  return {
    totalParticipants: participants.length,
    alreadyNormalized,
    affectedCount: itemsToMigrate.length,
    mappingCounts,
    itemsToMigrate,
    occupancyInconsistencies
  };
}
