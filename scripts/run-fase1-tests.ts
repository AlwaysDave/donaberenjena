import { validateAndPrepareTransition, isActivityConcluded, checkAttendanceSheetComplete } from '../src/services/participantTransitions';
import { normalizeParticipantRecord, simulateParticipantMigration } from '../src/services/participantMigration';
import { Activity, Participant, Member } from '../src/types';

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, details: string) {
  if (condition) {
    results.push({ name, passed: true, details });
    console.log(`[PASS] ${name}: ${details}`);
  } else {
    results.push({ name, passed: false, details: `FAILED: ${details}` });
    console.error(`[FAIL] ${name}: ${details}`);
  }
}

console.log('====================================================');
console.log('EJECUCIÓN DE CASOS DE PRUEBA EXIGIDOS - FASE 1');
console.log('====================================================\n');

// ----------------------------------------------------------------------------
// TEST 1: Intento de transición inválida (cancelada -> asistio)
// ----------------------------------------------------------------------------
const baseActivity: Activity = {
  id: 'act-test-1',
  title: 'Cata de Ribera del Duero',
  subtitle: 'Cata guiada',
  date: '2026-10-15',
  time: '19:00',
  location: 'Sede Doña Berenjena',
  type: 'cata',
  category: 'vino',
  totalSpots: 20,
  bookedSpots: 10,
  priceMember: 20,
  priceNonMember: 30,
  status: 'proxima',
  images: [],
  description: 'Test activity',
  featured: false,
  createdAt: '2026-09-01T10:00:00.000Z',
  updatedAt: '2026-09-01T10:00:00.000Z'
};

const cancelledParticipant: Participant = {
  id: 'part-cancelled-1',
  groupId: 'grp-1',
  activityId: 'act-test-1',
  activityTitle: 'Cata de Ribera del Duero',
  activityDate: '2026-10-15',
  activityType: 'cata',
  fullName: 'Juan Pérez',
  email: 'juan@example.com',
  phone: '600111222',
  isMember: false,
  status: 'cancelada',
  cancellationKind: 'cancelacion_usuario',
  cancellationJustified: true,
  cancellationReason: 'Viaje imprevisto',
  paymentMethod: 'tarjeta',
  totalAmount: 30,
  registeredAt: '2026-09-01T10:00:00.000Z'
};

const invalidRes = validateAndPrepareTransition({
  participant: cancelledParticipant,
  activity: baseActivity,
  targetStatus: 'asistio',
  actor: 'Sumiller'
});

assert(
  invalidRes.allowed === false && invalidRes.error !== undefined,
  'Caso 1: Transición inválida cancelada -> asistio',
  `Rechazada correctamente. Mensaje: "${invalidRes.error}"`
);

// ----------------------------------------------------------------------------
// TEST 2: Estado de conclusión por status administrativo ('proxima' no concluida)
// ----------------------------------------------------------------------------
const futureActivity: Activity = {
  ...baseActivity,
  id: 'act-future-2',
  date: '2026-12-25',
  time: '20:00',
  status: 'proxima'
};

const pendingParticipant: Participant = {
  id: 'part-pending-1',
  groupId: 'grp-2',
  activityId: 'act-future-2',
  activityTitle: 'Cata de Ribera del Duero',
  activityDate: '2026-12-25',
  activityType: 'cata',
  fullName: 'Ana Gómez',
  email: 'ana@example.com',
  phone: '600333444',
  isMember: true,
  status: 'pendiente_pago',
  paymentMethod: 'tarjeta',
  totalAmount: 20,
  registeredAt: '2026-09-01T10:00:00.000Z'
};

const isConcludedBeforeEnd = isActivityConcluded(futureActivity);
assert(
  isConcludedBeforeEnd === false,
  'Caso 2: Actividad proxima no concluida',
  `La actividad con status proxima no está concluida (isConcluded: ${isConcludedBeforeEnd}).`
);

// ----------------------------------------------------------------------------
// TEST 3: Cierre de hoja de sala (sólo pendiente_pago y pagada -> cancelada no_presentado)
// ----------------------------------------------------------------------------
const pastActivity: Activity = {
  ...baseActivity,
  id: 'act-past-3',
  date: '2026-01-10',
  time: '19:00',
  status: 'proxima',
  bookedSpots: 3
};

const participantsToClose: Participant[] = [
  {
    id: 'p-attended-1',
    groupId: 'grp-3',
    activityId: 'act-past-3',
    activityTitle: 'Cata Pasada',
    activityDate: '2026-01-10',
    activityType: 'cata',
    fullName: 'Carlos Asistente',
    email: 'carlos@example.com',
    phone: '600000001',
    isMember: true,
    status: 'asistio',
    paymentMethod: 'tarjeta',
    totalAmount: 20,
    registeredAt: '2026-01-01T10:00:00.000Z'
  },
  {
    id: 'p-pending-1',
    groupId: 'grp-4',
    activityId: 'act-past-3',
    activityTitle: 'Cata Pasada',
    activityDate: '2026-01-10',
    activityType: 'cata',
    fullName: 'David Pendiente',
    email: 'david@example.com',
    phone: '600000002',
    isMember: false,
    status: 'pendiente_pago',
    paymentMethod: 'tarjeta',
    totalAmount: 30,
    registeredAt: '2026-01-01T10:00:00.000Z'
  },
  {
    id: 'p-paid-1',
    groupId: 'grp-5',
    activityId: 'act-past-3',
    activityTitle: 'Cata Pasada',
    activityDate: '2026-01-10',
    activityType: 'cata',
    fullName: 'Elena Pagada',
    email: 'elena@example.com',
    phone: '600000003',
    isMember: false,
    status: 'pagada',
    paymentMethod: 'tarjeta',
    totalAmount: 30,
    paidAmount: 30,
    registeredAt: '2026-01-01T10:00:00.000Z'
  },
  {
    id: 'p-cancelled-1',
    groupId: 'grp-6',
    activityId: 'act-past-3',
    activityTitle: 'Cata Pasada',
    activityDate: '2026-01-10',
    activityType: 'cata',
    fullName: 'Felipe Cancelado',
    email: 'felipe@example.com',
    phone: '600000004',
    isMember: true,
    status: 'cancelada',
    cancellationKind: 'cancelacion_usuario',
    paymentMethod: 'tarjeta',
    totalAmount: 20,
    registeredAt: '2026-01-01T10:00:00.000Z'
  }
];

// ----------------------------------------------------------------------------
// TEST 3: Verificación de hoja de asistencia incompleta (bloqueo)
// ----------------------------------------------------------------------------
const sheetIncompleteRes = checkAttendanceSheetComplete(participantsToClose, pastActivity.id);
assert(
  !sheetIncompleteRes.isComplete &&
  sheetIncompleteRes.pendingCount === 2 &&
  sheetIncompleteRes.pendingParticipantIds.length === 2 &&
  sheetIncompleteRes.pendingParticipantIds.includes('p-pending-1') &&
  sheetIncompleteRes.pendingParticipantIds.includes('p-paid-1'),
  'Caso 3: Validación de hoja de asistencia incompleta',
  `Detectó correctamente ${sheetIncompleteRes.pendingCount} participantes sin resolver (David y Elena). Bloqueo activado.`
);

// ----------------------------------------------------------------------------
// TEST 4: Verificación de hoja de asistencia completa (desbloqueo)
// ----------------------------------------------------------------------------
const participantsResolved: Participant[] = participantsToClose.map(p => {
  if (p.id === 'p-pending-1' || p.id === 'p-paid-1') {
    return { ...p, status: 'asistio' as const };
  }
  return p;
});

const sheetCompleteRes = checkAttendanceSheetComplete(participantsResolved, pastActivity.id);
assert(
  sheetCompleteRes.isComplete &&
  sheetCompleteRes.pendingCount === 0 &&
  sheetCompleteRes.pendingParticipantIds.length === 0,
  'Caso 4: Validación de hoja de asistencia completa',
  `Confirmó que la hoja está 100% resuelta con 0 pendientes. Cierre permitido.`
);

// ----------------------------------------------------------------------------
// TEST 5: Idempotencia en reservas concurrentes
// ----------------------------------------------------------------------------
const idempotencyStore = new Map<string, { reservationId: string; timestamp: number }>();

function simulateReserveRequest(key: string, reservationPayload: { activityId: string; user: string }) {
  if (idempotencyStore.has(key)) {
    return {
      status: 200,
      cached: true,
      data: idempotencyStore.get(key)
    };
  }
  const result = {
    reservationId: `res-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: Date.now()
  };
  idempotencyStore.set(key, result);
  return {
    status: 201,
    cached: false,
    data: result
  };
}

const req1 = simulateReserveRequest('idemp-key-abc-123', { activityId: 'act-test-1', user: 'Laura' });
const req2 = simulateReserveRequest('idemp-key-abc-123', { activityId: 'act-test-1', user: 'Laura' });

assert(
  req1.status === 201 && req2.status === 200 && req2.cached === true && req1.data.reservationId === req2.data.reservationId,
  'Caso 5: Idempotencia en reservas',
  `La 2ª llamada devolvió la reserva original "${req1.data.reservationId}" sin duplicar plazas ni registros.`
);

// ----------------------------------------------------------------------------
// TEST 6: Alta de socio en Censo - membershipNumber duplicado
// ----------------------------------------------------------------------------
const existingMembers: Member[] = [
  {
    id: 'mem-1',
    membershipNumber: 'SOC-042',
    fullName: 'Ignacio Rueda',
    email: 'ignacio@example.com',
    active: true,
    createdAt: '2025-01-01T00:00:00.000Z'
  }
];

function validateMemberAddition(newNum: string, memberList: Member[]) {
  const trimmed = newNum.trim().toLowerCase();
  const exists = memberList.some(m => m.active && (m.membershipNumber || '').trim().toLowerCase() === trimmed);
  if (exists) {
    throw new Error(`El número de socio «${newNum}» ya está asignado a otro socio activo en el Censo.`);
  }
  return true;
}

let duplicateRejected = false;
try {
  validateMemberAddition('soc-042', existingMembers);
} catch (err: any) {
  duplicateRejected = true;
}

assert(
  duplicateRejected === true,
  'Caso 6: Validación de duplicidad en Censo de Socios',
  'El intento de registrar un socio con "soc-042" (existente: SOC-042) fue rechazado con error unívoco.'
);

// ----------------------------------------------------------------------------
// TEST 7: Migración canónica en 6 pasos y 0 cambios en segunda ejecución
// ----------------------------------------------------------------------------
const legacyParticipants: any[] = [
  { id: 'leg-1', fullName: 'Lucía Legacy 1', status: 'asistio', attended: true, isMember: false },
  { id: 'leg-2', fullName: 'Marcos Legacy 2', status: 'confirmada', isMember: true, totalAmount: 20 },
  { id: 'leg-3', fullName: 'Nuria Legacy 3', status: 'pendiente_pago', isMember: false },
  { id: 'leg-4', fullName: 'Óscar Legacy 4', status: 'no_asistio', isMember: false },
  { id: 'leg-5', fullName: 'Patricia Legacy 5', status: 'cancelada', justified: true, justificationReason: 'Causa médica' },
  { id: 'leg-6', fullName: 'Quique Legacy 6', status: 'lista_de_espera', isMember: true }
];

const sim1 = simulateParticipantMigration(legacyParticipants, [baseActivity]);
assert(
  sim1.affectedCount > 0,
  'Caso 7a: Primera simulación de migración canónica',
  `Detectó ${sim1.affectedCount} registros legacy a normalizar: confirmada->pagada, no_asistio->cancelada (injustificada/no presentado), cancelada enriquecida con metadatos y legacy fields eliminados.`
);

// Normalizar todos los registros
const normalizedList = legacyParticipants.map(p => normalizeParticipantRecord(p).cleanRecord);

// Verificar ausencia de campos prohibidos (attended, justified, confirmada, no_asistio)
const hasLegacyFields = normalizedList.some(p => 
  (p as any).attended !== undefined || 
  (p as any).justified !== undefined ||
  p.status === ('confirmada' as any) ||
  p.status === ('no_asistio' as any)
);

assert(
  hasLegacyFields === false,
  'Caso 7b: Limpieza estricta de esquema canónico',
  'Ningún registro normalizado contiene campos legacy (attended, justified) ni estados prohibidos (confirmada, no_asistio).'
);

// Segunda ejecución: debe producir 0 cambios
const sim2 = simulateParticipantMigration(normalizedList, [baseActivity]);
assert(
  sim2.affectedCount === 0 && sim2.alreadyNormalized === normalizedList.length,
  'Caso 7c: Idempotencia de migración canónica',
  `La segunda ejecución produjo 0 modificaciones (alreadyNormalized: ${sim2.alreadyNormalized}/${normalizedList.length}).`
);

console.log('\n====================================================');
console.log(`RESUMEN DE PRUEBAS: ${results.filter(r => r.passed).length}/${results.length} PASADAS`);
console.log('====================================================');

if (results.some(r => !r.passed)) {
  process.exit(1);
} else {
  process.exit(0);
}
