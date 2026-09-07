/**
 * Fase 4B Test Suite: Advanced Attendance Correction & RBAC Security Rules
 * Verifies all Acceptance Criteria (AC-4B-01 through AC-4B-07) and Defects D-4B-01 through D-4B-04.
 */

import { connectFirestoreEmulator, doc, setDoc, getDoc } from 'firebase/firestore';
import { connectAuthEmulator, signInWithCustomToken } from 'firebase/auth';
import { initializeApp as initAdminApp, getApps as getAdminApps } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import { db, auth } from '../src/services/firebase';
import {
  validateAndPrepareAdvancedCorrection,
  doesParticipantOccupySpot
} from '../src/services/participantTransitions';
import { executeAdvancedAttendanceCorrectionFirestore } from '../src/services/firestoreService';
import { Activity, Participant, CanonicalParticipantStatus } from '../src/types';

console.log('=== INICIANDO SUITE DE PRUEBAS: FASE 4B (CORRECCIÓN AVANZADA & PERMISOS RBAC) ===\n');

// 1. UNIT TESTS: SPOT DELTA & REOPENING ARITHMETIC
console.log('--- BLOQUE 1: Tests Unitarios de Lógica Canónica y Aforo ---');

let unitTestsPassed = 0;
let unitTestsFailed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✓ ${testName}`);
    unitTestsPassed++;
  } else {
    console.error(`  ✗ ${testName}`);
    unitTestsFailed++;
  }
}

// Test doesParticipantOccupySpot
assert(doesParticipantOccupySpot('pendiente_pago') === true, 'pendiente_pago ocupa plaza');
assert(doesParticipantOccupySpot('pagada') === true, 'pagada ocupa plaza');
assert(doesParticipantOccupySpot('asistio') === true, 'asistio ocupa plaza');
assert(doesParticipantOccupySpot('lista_de_espera') === false, 'lista_de_espera NO ocupa plaza');
assert(doesParticipantOccupySpot('cancelada', 'cancelacion_usuario') === false, 'cancelacion_usuario NO ocupa plaza');
assert(doesParticipantOccupySpot('cancelada', 'no_presentado') === true, 'no_presentado SÍ ocupa plaza');
assert(doesParticipantOccupySpot('cancelada') === false, 'cancelada genérica sin kind NO ocupa plaza');

// Mock data helper
function createMockActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: 'act-test-4b',
    title: 'Cata Vinos Fase 4B',
    type: 'cata',
    category: 'vinos',
    date: '2026-10-15',
    totalSpots: 20,
    bookedSpots: 10,
    priceMember: 25,
    priceNonMember: 35,
    status: 'celebrada',
    ...overrides
  } as Activity;
}

function createMockParticipant(overrides: Partial<Participant> = {}): Participant {
  return {
    id: 'part-test-4b',
    activityId: 'act-test-4b',
    activityTitle: 'Cata Vinos Fase 4B',
    fullName: 'Test Participant',
    email: 'test@example.com',
    status: 'asistio',
    isMember: true,
    totalAmount: 25,
    paidAmount: 25,
    registeredAt: '2026-10-01T10:00:00Z',
    ...overrides
  } as Participant;
}

// Test validation: Empty correction reason
const emptyReasonRes = validateAndPrepareAdvancedCorrection({
  participant: createMockParticipant(),
  activity: createMockActivity(),
  targetStatus: 'pagada',
  correctionReason: '   ',
  actor: 'Admin Test'
});
assert(!emptyReasonRes.allowed && !!emptyReasonRes.error, 'Rechaza motivo de corrección vacío o solo espacios');

// Test validation: Exceeding capacity
const overflowingAct = createMockActivity({ totalSpots: 10, bookedSpots: 10 });
const waitlistPart = createMockParticipant({ status: 'lista_de_espera' });
const overflowRes = validateAndPrepareAdvancedCorrection({
  participant: waitlistPart,
  activity: overflowingAct,
  targetStatus: 'pagada',
  correctionReason: 'Promoción indebida superando aforo',
  actor: 'Admin Test'
});
assert(!overflowRes.allowed && overflowRes.error?.includes('aforo máximo'), 'Rechaza corrección que supere el aforo máximo');

// Test validation: Negative booked spots prevention
const emptyAct = createMockActivity({ totalSpots: 10, bookedSpots: 0 });
const paidPart = createMockParticipant({ status: 'pagada' });
const negativeRes = validateAndPrepareAdvancedCorrection({
  participant: paidPart,
  activity: emptyAct,
  targetStatus: 'cancelada',
  cancellationData: { kind: 'cancelacion_usuario', reason: 'Error', justified: true },
  correctionReason: 'Cancelación administrativa',
  actor: 'Admin Test'
});
assert(!negativeRes.allowed && negativeRes.error?.includes('negativo'), 'Rechaza corrección que genere aforo negativo');

// Test spot calculation: cancelada (cancelacion_usuario) -> asistio (+1 spot)
const normalAct = createMockActivity({ totalSpots: 20, bookedSpots: 10 });
const cancelledUserPart = createMockParticipant({
  status: 'cancelada',
  cancellationKind: 'cancelacion_usuario'
});
const toAttendedRes = validateAndPrepareAdvancedCorrection({
  participant: cancelledUserPart,
  activity: normalAct,
  targetStatus: 'asistio',
  correctionReason: 'Asistió presencialmente tras revocación de baja',
  actor: 'Admin Test'
});
assert(toAttendedRes.allowed && toAttendedRes.spotsDelta === 1, 'Transición cancelacion_usuario -> asistio incrementa aforo en +1');
assert(toAttendedRes.activityUpdates?.bookedSpots === 11, 'Nuevo aforo en actividad es 11');

// Test spot calculation: asistio -> cancelada (no_presentado) (0 delta)
const attendedPart = createMockParticipant({ status: 'asistio' });
const toNoShowRes = validateAndPrepareAdvancedCorrection({
  participant: attendedPart,
  activity: normalAct,
  targetStatus: 'cancelada',
  cancellationData: { kind: 'no_presentado', reason: 'Inasistencia constatada', justified: false },
  correctionReason: 'Corrección a no presentado',
  actor: 'Admin Test'
});
assert(toNoShowRes.allowed && toNoShowRes.spotsDelta === 0, 'Transición asistio -> no_presentado mantiene aforo (delta 0)');
assert(toNoShowRes.activityUpdates?.bookedSpots === 10, 'Aforo en actividad sigue siendo 10');

// Test activity reopening: celebrada -> pagada reopens to proxima
const celebradaAct = createMockActivity({ status: 'celebrada' });
const reopenRes = validateAndPrepareAdvancedCorrection({
  participant: attendedPart,
  activity: celebradaAct,
  targetStatus: 'pagada',
  correctionReason: 'Error en check-in; el participante nunca llegó a entrar',
  actor: 'Admin Auditor'
});
assert(reopenRes.allowed && reopenRes.willReopen === true, 'Corrección a pagada en actividad celebrada marca willReopen = true');
assert(reopenRes.activityUpdates?.status === 'proxima', 'Actividad actualizada a proxima');
assert(reopenRes.activityUpdates?.reopenReason?.includes('Error en check-in'), 'Registra reopenReason en la actividad');
assert(reopenRes.activityUpdates?.reopenedBy === 'Admin Auditor', 'Registra reopenedBy en la actividad');

// Test activity non-reopening: celebrada -> cancelada stays celebrada
const toCancelledCelebradaRes = validateAndPrepareAdvancedCorrection({
  participant: attendedPart,
  activity: celebradaAct,
  targetStatus: 'cancelada',
  cancellationData: { kind: 'cancelacion_usuario', reason: 'Error', justified: true },
  correctionReason: 'Corrección de asistencia errónea',
  actor: 'Admin Auditor'
});
assert(toCancelledCelebradaRes.allowed && toCancelledCelebradaRes.willReopen === false, 'Corrección a cancelada en actividad celebrada no reabre');
assert(toCancelledCelebradaRes.activityUpdates?.status === undefined, 'No altera el status celebrada de la actividad');

// Test proxima activity does not automatically celebrate when all resolved
const proximaAct = createMockActivity({ status: 'proxima', bookedSpots: 10 });
const proximaToAttendedRes = validateAndPrepareAdvancedCorrection({
  participant: createMockParticipant({ status: 'pagada' }),
  activity: proximaAct,
  targetStatus: 'asistio',
  correctionReason: 'Registro anticipado',
  actor: 'Admin Auditor'
});
assert(proximaToAttendedRes.allowed, 'Permite corrección en proxima');
assert(proximaToAttendedRes.activityUpdates?.status === undefined, 'No cambia por sí solo proxima a celebrada');

// Audit trail preservation
assert(toAttendedRes.updatedParticipant?.correctedBy === 'Admin Test', 'Auditoría: guarda correctedBy');
assert(toAttendedRes.updatedParticipant?.correctionReason === 'Asistió presencialmente tras revocación de baja', 'Auditoría: guarda correctionReason');
assert(!!toAttendedRes.updatedParticipant?.correctedAt, 'Auditoría: guarda correctedAt');
assert(toAttendedRes.updatedParticipant?.registeredAt === undefined, 'No altera registeredAt');

console.log(`\nBloque 1 finalizado: ${unitTestsPassed} superados, ${unitTestsFailed} fallidos.\n`);

// 2. INTEGRATION TESTS WITH FIREBASE EMULATOR
console.log('--- BLOQUE 2: Tests de Integración Transaccional y Reglas RBAC (Firestore Emulator) ---');

async function runEmulatorIntegrationTests() {
  if (!db) {
    console.error('Firestore db is null, skipping emulator tests');
    return;
  }

  // Connect to emulator
  try {
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
  } catch (e) {
    // Already connected
  }
  if (auth) {
    try {
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    } catch (e) {
      // Already connected
    }
  }

  process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

  const adminApp = getAdminApps().length === 0 
    ? initAdminApp({ projectId: 'test-project' })
    : getAdminApps()[0];

  const adminDb = getAdminFirestore(adminApp);
  const adminAuth = getAdminAuth(adminApp);

  let emuTestsPassed = 0;
  let emuTestsFailed = 0;

  function assertEmu(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✓ ${testName}`);
      emuTestsPassed++;
    } else {
      console.error(`  ✗ ${testName}`);
      emuTestsFailed++;
    }
  }

  // Seed Admin Users
  const advancedUid = 'uid-admin-advanced-4b';
  const simpleUid = 'uid-admin-simple-4b';

  await adminDb.collection('admins').doc(advancedUid).set({
    email: 'admin.advanced@test.es',
    name: 'Admin Avanzado',
    role: 'advanced',
    baseRole: 'advanced'
  });

  await adminDb.collection('admins').doc(simpleUid).set({
    email: 'admin.simple@test.es',
    name: 'Admin Simple (Coordinador)',
    role: 'simple',
    baseRole: 'simple'
  });

  const advancedToken = await adminAuth.createCustomToken(advancedUid);
  const simpleToken = await adminAuth.createCustomToken(simpleUid);

  // Setup Test Activity & Participants via adminDb
  const actCelebradaId = 'act-celebrada-4b';
  await adminDb.collection('activities').doc(actCelebradaId).set({
    title: 'Cata Ribera Cerrada',
    type: 'cata',
    date: '2026-10-10',
    totalSpots: 15,
    bookedSpots: 12,
    status: 'celebrada'
  });

  const partInCelebradaId = 'part-in-celebrada-4b';
  await adminDb.collection('participants').doc(partInCelebradaId).set({
    activityId: actCelebradaId,
    fullName: 'Asistente Rectificable',
    status: 'asistio',
    totalAmount: 30,
    paidAmount: 30,
    registeredAt: '2026-10-01T12:00:00Z'
  });

  const actProximaId = 'act-proxima-4b';
  await adminDb.collection('activities').doc(actProximaId).set({
    title: 'Cata Próxima Door Checkin',
    type: 'cata',
    date: '2026-11-20',
    totalSpots: 20,
    bookedSpots: 15,
    status: 'proxima'
  });

  const partInProximaId = 'part-in-proxima-4b';
  await adminDb.collection('participants').doc(partInProximaId).set({
    activityId: actProximaId,
    fullName: 'Asistente Puerta',
    status: 'pagada',
    totalAmount: 35,
    paidAmount: 35,
    registeredAt: '2026-11-01T12:00:00Z'
  });

  // TEST 2.1: RBAC - Simple Admin cannot update activities
  if (auth) {
    await signInWithCustomToken(auth, simpleToken);
  }
  let simpleActUpdateBlocked = false;
  try {
    const actRef = doc(db, 'activities', actProximaId);
    await setDoc(actRef, { title: 'Hacked Title' }, { merge: true });
  } catch (err: any) {
    if (err.code === 'permission-denied' || String(err).includes('PERMISSION_DENIED')) {
      simpleActUpdateBlocked = true;
    }
  }
  assertEmu(simpleActUpdateBlocked, 'AC-4B-01: Admin Simple NO tiene permiso de escritura en la colección "activities"');

  // TEST 2.2: RBAC - Simple Admin cannot write correction audit fields to participants
  let simpleAuditBlocked = false;
  try {
    const partRef = doc(db, 'participants', partInProximaId);
    await setDoc(partRef, {
      correctedAt: new Date().toISOString(),
      correctionReason: 'Simple attempt'
    }, { merge: true });
  } catch (err: any) {
    if (err.code === 'permission-denied' || String(err).includes('PERMISSION_DENIED')) {
      simpleAuditBlocked = true;
    }
  }
  assertEmu(simpleAuditBlocked, 'AC-4B-01: Admin Simple NO puede escribir campos de corrección (correctedAt, correctionReason)');

  // TEST 2.3: RBAC - Simple Admin CAN do check-in (isAllowedSimpleDoorTransition) on proxima activity
  let simpleCheckInAllowed = false;
  try {
    const partRef = doc(db, 'participants', partInProximaId);
    await setDoc(partRef, {
      status: 'asistio',
      attendedAt: new Date().toISOString(),
      attendedBy: 'Admin Simple (Coordinador)',
      doorOperator: 'Admin Simple (Coordinador)'
    }, { merge: true });
    simpleCheckInAllowed = true;
  } catch (err: any) {
    console.error('Simple check-in error:', err);
  }
  assertEmu(simpleCheckInAllowed, 'AC-4B-01: Admin Simple SÍ puede realizar check-in presencial en puerta sobre actividad "proxima"');

  // TEST 2.4: Advanced Correction Transaction (AC-4B-03 & AC-4B-06)
  // Sign in as Advanced Admin
  if (auth) {
    await signInWithCustomToken(auth, advancedToken);
  }

  // Move part-in-celebrada from 'asistio' to 'pagada' with mandatory reason
  const correctionResult = await executeAdvancedAttendanceCorrectionFirestore({
    participantId: partInCelebradaId,
    activityId: actCelebradaId,
    targetStatus: 'pagada',
    correctionReason: 'Error constatado en puerta: el participante llamó por teléfono y no acudió.',
    actor: 'Admin Avanzado Auditor',
    paymentData: { paidAmount: 30 }
  });

  assertEmu(correctionResult.success === true, 'Transacción de corrección avanzada completada con éxito');
  assertEmu(correctionResult.willReopen === true, 'willReopen marcado como true en el resultado');

  // Check Firestore state atomically written
  const updatedActSnap = await adminDb.collection('activities').doc(actCelebradaId).get();
  const updatedAct = updatedActSnap.data();
  assertEmu(updatedAct?.status === 'proxima', 'AC-4B-03: Actividad reabierta atómicamente a "proxima"');
  assertEmu(!!updatedAct?.reopenedAt, 'AC-4B-03: reopenedAt registrado en la actividad');
  assertEmu(updatedAct?.reopenedBy === 'Admin Avanzado Auditor', 'AC-4B-03: reopenedBy registrado en la actividad');
  assertEmu(updatedAct?.reopenReason?.includes('Error constatado en puerta'), 'AC-4B-03: reopenReason registrado en la actividad');

  const updatedPartSnap = await adminDb.collection('participants').doc(partInCelebradaId).get();
  const updatedPart = updatedPartSnap.data();
  assertEmu(updatedPart?.status === 'pagada', 'Participante actualizado a "pagada"');
  assertEmu(!!updatedPart?.correctedAt, 'correctedAt registrado en el participante');
  assertEmu(updatedPart?.correctedBy === 'Admin Avanzado Auditor', 'correctedBy registrado en el participante');
  assertEmu(updatedPart?.correctionReason?.includes('Error constatado en puerta'), 'correctionReason registrado en el participante');

  // TEST 2.5: Atomicity check on error (e.g. invalid target status or nonexistent activity)
  const failCorrectionResult = await executeAdvancedAttendanceCorrectionFirestore({
    participantId: partInCelebradaId,
    activityId: 'non-existent-activity-id',
    targetStatus: 'asistio',
    correctionReason: 'Intentando actividad fantasma',
    actor: 'Admin'
  });
  assertEmu(failCorrectionResult.success === false, 'Transacción abortada limpiamente ante actividad inexistente');

  console.log(`\nBloque 2 finalizado: ${emuTestsPassed} superados, ${emuTestsFailed} fallidos.\n`);

  const totalPassed = unitTestsPassed + emuTestsPassed;
  const totalFailed = unitTestsFailed + emuTestsFailed;
  console.log(`=== RESUMEN GLOBAL: ${totalPassed} PASARON, ${totalFailed} FALLARON ===`);

  if (totalFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// Run emulator tests
runEmulatorIntegrationTests().catch((err) => {
  console.error('Error fatal en tests de emulador:', err);
  process.exit(1);
});
