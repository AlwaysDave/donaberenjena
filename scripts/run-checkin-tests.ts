import { connectFirestoreEmulator, doc, setDoc, getDoc } from 'firebase/firestore';
import { connectAuthEmulator, signInWithCustomToken } from 'firebase/auth';
import { initializeApp as initAdminApp, getApps as getAdminApps } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { db, auth } from '../src/services/firebase';
import {
  executeParticipantTransitionFirestore
} from '../src/services/firestoreService';
import { 
  canResolveAttendance
} from '../src/services/participantTransitions';
import { Activity, Participant } from '../src/types';

if (!db) {
  throw new Error('Firestore instance not available');
}

// Connect to Firestore & Auth Emulators
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

interface TestResult {
  code: string;
  name: string;
  passed: boolean;
  details: string;
}

const testResults: TestResult[] = [];

function recordResult(code: string, name: string, passed: boolean, details: string) {
  testResults.push({ code, name, passed, details });
  if (passed) {
    console.log(`\x1b[32m[PASS]\x1b[0m ${code}: ${name} - ${details}`);
  } else {
    console.error(`\x1b[31m[FAIL]\x1b[0m ${code}: ${name} - ${details}`);
  }
}

async function runCheckInTests() {
  console.log('========================================================================');
  console.log('SUITE DE PRUEBAS T-04A: GOBIERNO POR ESTADO DE ACTIVIDAD EN CHECK-IN');
  console.log('========================================================================\n');

  // Setup test admin document in Firestore and sign in client
  const adminId = 'test-checkin-admin-uid';
  await adminDb.doc(`admins/${adminId}`).set({
    email: 'admin@dona-berenjena.com',
    role: 'super_admin'
  });

  const customToken = await adminAuth.createCustomToken(adminId);
  if (auth) {
    await signInWithCustomToken(auth, customToken);
  }

  // ==========================================================================
  // 1. PRUEBAS UNITARIAS DE canResolveAttendance (Función pura compartida)
  // ==========================================================================
  console.log('--- 1. Pruebas Unitarias de canResolveAttendance ---');
  
  const unitFuture = canResolveAttendance({
    id: 'act-unit-future',
    status: 'proxima',
    date: '2029-12-31',
    time: '20:00',
    endTime: '22:00'
  });
  const unitPastEnd = canResolveAttendance({
    id: 'act-unit-past',
    status: 'proxima',
    date: '2020-01-01',
    time: '10:00',
    endTime: '12:00'
  });
  const unitNoEndTime = canResolveAttendance({
    id: 'act-unit-noend',
    status: 'proxima',
    date: '2026-10-10',
    time: '19:00'
  });
  const unitCelebrada = canResolveAttendance({
    id: 'act-unit-celeb',
    status: 'celebrada',
    date: '2026-01-01',
    time: '19:00'
  });
  const unitMissingStatus = canResolveAttendance({
    id: 'act-unit-none'
  } as Partial<Activity>);

  const unitAllPass = 
    unitFuture.allowed === true &&
    unitPastEnd.allowed === true &&
    unitNoEndTime.allowed === true &&
    unitCelebrada.allowed === false &&
    unitMissingStatus.allowed === false;

  if (!unitAllPass) {
    console.error('Fallo en pruebas unitarias de canResolveAttendance:', {
      unitFuture, unitPastEnd, unitNoEndTime, unitCelebrada, unitMissingStatus
    });
  }

  // ==========================================================================
  // AC-4A-01: Actividad proxima con date + endTime ya pasados
  // ==========================================================================
  console.log('\n--- Ejecutando AC-4A-01 ---');
  try {
    const actId1 = `act-4a-01-${Date.now()}`;
    const p1Id = `p1-4a-01-${Date.now()}`;
    const p2Id = `p2-4a-01-${Date.now()}`;

    // Preparación con setDoc
    await adminDb.doc(`activities/${actId1}`).set({
      id: actId1,
      title: 'Cata Pasada pero Próxima',
      date: '2020-01-01',
      time: '18:00',
      endTime: '20:00',
      status: 'proxima',
      totalSpots: 10,
      bookedSpots: 2,
      createdAt: '2020-01-01T00:00:00.000Z',
      updatedAt: '2020-01-01T00:00:00.000Z'
    });

    await adminDb.doc(`participants/${p1Id}`).set({
      id: p1Id,
      activityId: actId1,
      fullName: 'Participante Pendiente Pago',
      email: 'p1@example.com',
      status: 'pendiente_pago',
      totalAmount: 25,
      paidAmount: 0,
      createdAt: '2020-01-01T00:00:00.000Z',
      updatedAt: '2020-01-01T00:00:00.000Z'
    });

    await adminDb.doc(`participants/${p2Id}`).set({
      id: p2Id,
      activityId: actId1,
      fullName: 'Participante Pagada',
      email: 'p2@example.com',
      status: 'pagada',
      totalAmount: 25,
      paidAmount: 25,
      createdAt: '2020-01-01T00:00:00.000Z',
      updatedAt: '2020-01-01T00:00:00.000Z'
    });

    // Verificar disponibilidad de botones
    const actSnapBefore = await getDoc(doc(db, 'activities', actId1));
    const actDataBefore = actSnapBefore.data() as Activity;
    const canResolveCheck = canResolveAttendance(actDataBefore);

    // Ejecutar transiciones reales
    const res1 = await executeParticipantTransitionFirestore({
      participantId: p1Id,
      activityId: actId1,
      targetStatus: 'asistio',
      actor: 'Control de Puerta'
    });

    const res2 = await executeParticipantTransitionFirestore({
      participantId: p2Id,
      activityId: actId1,
      targetStatus: 'cancelada',
      actor: 'Control de Puerta',
      cancellationData: {
        reason: 'No presentado',
        justified: false,
        kind: 'no_presentado'
      }
    });

    // Leer Firestore después de cada acción
    const p1Snap = await getDoc(doc(db, 'participants', p1Id));
    const p2Snap = await getDoc(doc(db, 'participants', p2Id));
    const actSnapAfter = await getDoc(doc(db, 'activities', actId1));

    const p1Data = p1Snap.data();
    const p2Data = p2Snap.data();
    const actDataAfter = actSnapAfter.data();

    const pass = 
      canResolveCheck.allowed === true &&
      res1.success === true &&
      res2.success === true &&
      p1Data?.status === 'asistio' &&
      typeof p1Data?.attendedAt === 'string' &&
      p1Data?.attendedBy === 'Control de Puerta' &&
      p1Data?.paidAmount === 25 &&
      p2Data?.status === 'cancelada' &&
      p2Data?.cancellationKind === 'no_presentado' &&
      p2Data?.cancellationJustified === false &&
      p2Data?.cancellationReason === 'No presentado' &&
      actDataAfter?.status === 'proxima' &&
      actDataAfter?.bookedSpots === 2;

    recordResult(
      'AC-4A-01',
      'Actividad proxima con date + endTime pasados',
      pass,
      pass 
        ? 'Ambos botones disponibles. Asistió y No presentado ejecutados y auditados sin alterar actividad ni bookedSpots (2).'
        : `Fallo en aserciones: res1=${res1.success}, res2=${res2.success}, p1Status=${p1Data?.status}, p2Status=${p2Data?.status}, actSpots=${actDataAfter?.bookedSpots}`
    );
  } catch (err: any) {
    recordResult('AC-4A-01', 'Actividad proxima con date + endTime pasados', false, `Excepción: ${err.message}`);
  }

  // ==========================================================================
  // AC-4A-02: Actividad proxima con fecha/hora futuras
  // ==========================================================================
  console.log('\n--- Ejecutando AC-4A-02 ---');
  try {
    const actId2 = `act-4a-02-${Date.now()}`;
    const pId2 = `p-4a-02-${Date.now()}`;

    // Preparación con setDoc
    await adminDb.doc(`activities/${actId2}`).set({
      id: actId2,
      title: 'Cata Futura',
      date: '2029-12-31',
      time: '20:00',
      endTime: '22:00',
      status: 'proxima',
      totalSpots: 10,
      bookedSpots: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    });

    await adminDb.doc(`participants/${pId2}`).set({
      id: pId2,
      activityId: actId2,
      fullName: 'Participante Futuro Pagado',
      email: 'p-futuro@example.com',
      status: 'pagada',
      totalAmount: 30,
      paidAmount: 30,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    });

    const actSnap = await getDoc(doc(db, 'activities', actId2));
    const actData = actSnap.data() as Activity;
    const canResolveCheck = canResolveAttendance(actData);

    const res = await executeParticipantTransitionFirestore({
      participantId: pId2,
      activityId: actId2,
      targetStatus: 'asistio',
      actor: 'Control de Puerta'
    });

    const pSnap = await getDoc(doc(db, 'participants', pId2));
    const actSnapAfter = await getDoc(doc(db, 'activities', actId2));

    const pData = pSnap.data();
    const actAfter = actSnapAfter.data();

    const pass =
      canResolveCheck.allowed === true &&
      res.success === true &&
      pData?.status === 'asistio' &&
      typeof pData?.attendedAt === 'string' &&
      pData?.attendedBy === 'Control de Puerta' &&
      actAfter?.status === 'proxima' &&
      actAfter?.bookedSpots === 1;

    recordResult(
      'AC-4A-02',
      'Actividad proxima con fecha/hora futuras',
      pass,
      pass
        ? 'Acción de check-in disponible y persistida en Firestore sin bloqueo por ser fecha/hora futura.'
        : `Fallo: res=${res.success}, status=${pData?.status}, bookedSpots=${actAfter?.bookedSpots}`
    );
  } catch (err: any) {
    recordResult('AC-4A-02', 'Actividad proxima con fecha/hora futuras', false, `Excepción: ${err.message}`);
  }

  // ==========================================================================
  // AC-4A-03: Actividad proxima sin endTime
  // ==========================================================================
  console.log('\n--- Ejecutando AC-4A-03 ---');
  try {
    const actId3 = `act-4a-03-${Date.now()}`;
    const pId3 = `p-4a-03-${Date.now()}`;

    // Preparación con setDoc
    await adminDb.doc(`activities/${actId3}`).set({
      id: actId3,
      title: 'Cata Sin Fin',
      date: '2026-11-15',
      time: '19:00',
      status: 'proxima',
      totalSpots: 10,
      bookedSpots: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    });

    await adminDb.doc(`participants/${pId3}`).set({
      id: pId3,
      activityId: actId3,
      fullName: 'Participante Sin EndTime',
      email: 'p-noend@example.com',
      status: 'pendiente_pago',
      totalAmount: 20,
      paidAmount: 0,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    });

    const actSnap = await getDoc(doc(db, 'activities', actId3));
    const actData = actSnap.data() as Activity;
    const canResolveCheck = canResolveAttendance(actData);

    const res = await executeParticipantTransitionFirestore({
      participantId: pId3,
      activityId: actId3,
      targetStatus: 'cancelada',
      actor: 'Control de Puerta',
      cancellationData: {
        reason: 'No presentado',
        justified: false,
        kind: 'no_presentado'
      }
    });

    const pSnap = await getDoc(doc(db, 'participants', pId3));
    const actSnapAfter = await getDoc(doc(db, 'activities', actId3));

    const pData = pSnap.data();
    const actAfter = actSnapAfter.data();

    const pass =
      canResolveCheck.allowed === true &&
      res.success === true &&
      pData?.status === 'cancelada' &&
      pData?.cancellationKind === 'no_presentado' &&
      pData?.cancellationReason === 'No presentado' &&
      actAfter?.status === 'proxima' &&
      actAfter?.bookedSpots === 1;

    recordResult(
      'AC-4A-03',
      'Actividad proxima sin endTime',
      pass,
      pass
        ? 'No presentado disponible y persistido canónicamente sin depender ni fallar por ausencia de endTime.'
        : `Fallo: res=${res.success}, status=${pData?.status}, cancellationKind=${pData?.cancellationKind}`
    );
  } catch (err: any) {
    recordResult('AC-4A-03', 'Actividad proxima sin endTime', false, `Excepción: ${err.message}`);
  }

  // ==========================================================================
  // AC-4A-04: Actividad celebrada con participante en pendiente_pago o pagada
  // ==========================================================================
  console.log('\n--- Ejecutando AC-4A-04 ---');
  try {
    const actId4 = `act-4a-04-${Date.now()}`;
    const p1Id4 = `p1-4a-04-${Date.now()}`;
    const p2Id4 = `p2-4a-04-${Date.now()}`;

    // Preparación con setDoc
    await adminDb.doc(`activities/${actId4}`).set({
      id: actId4,
      title: 'Cata Ya Celebrada',
      date: '2026-01-01',
      time: '19:00',
      endTime: '21:00',
      status: 'celebrada',
      totalSpots: 10,
      bookedSpots: 2,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    });

    await adminDb.doc(`participants/${p1Id4}`).set({
      id: p1Id4,
      activityId: actId4,
      fullName: 'Participante Pendiente en Celebrada',
      email: 'p-celeb1@example.com',
      status: 'pendiente_pago',
      totalAmount: 20,
      paidAmount: 0,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    });

    await adminDb.doc(`participants/${p2Id4}`).set({
      id: p2Id4,
      activityId: actId4,
      fullName: 'Participante Pagada en Celebrada',
      email: 'p-celeb2@example.com',
      status: 'pagada',
      totalAmount: 20,
      paidAmount: 20,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    });

    const actSnap = await getDoc(doc(db, 'activities', actId4));
    const actData = actSnap.data() as Activity;
    const canResolveCheck = canResolveAttendance(actData);

    // Intentar transición a asistio
    const resAsistio = await executeParticipantTransitionFirestore({
      participantId: p1Id4,
      activityId: actId4,
      targetStatus: 'asistio',
      actor: 'Control de Puerta'
    });

    // Intentar transición a no_presentado
    const resNoShow = await executeParticipantTransitionFirestore({
      participantId: p2Id4,
      activityId: actId4,
      targetStatus: 'cancelada',
      actor: 'Control de Puerta',
      cancellationData: {
        reason: 'No presentado',
        justified: false,
        kind: 'no_presentado'
      }
    });

    // Leer Firestore para verificar que NO cambiaron
    const p1Snap = await getDoc(doc(db, 'participants', p1Id4));
    const p2Snap = await getDoc(doc(db, 'participants', p2Id4));
    const actSnapAfter = await getDoc(doc(db, 'activities', actId4));

    const p1Data = p1Snap.data();
    const p2Data = p2Snap.data();
    const actAfter = actSnapAfter.data();

    const pass =
      canResolveCheck.allowed === false &&
      resAsistio.success === false &&
      resNoShow.success === false &&
      p1Data?.status === 'pendiente_pago' &&
      p2Data?.status === 'pagada' &&
      actAfter?.status === 'celebrada' &&
      actAfter?.bookedSpots === 2;

    recordResult(
      'AC-4A-04',
      'Actividad celebrada con participante en pendiente_pago o pagada',
      pass,
      pass
        ? 'Botones no mostrados (allowed=false). Ambas llamadas rechazadas con error controlado; registros inalterados.'
        : `Fallo: canResolve=${canResolveCheck.allowed}, resAsistio=${resAsistio.success}, resNoShow=${resNoShow.success}, p1=${p1Data?.status}, p2=${p2Data?.status}`
    );
  } catch (err: any) {
    recordResult('AC-4A-04', 'Actividad celebrada con participante en pendiente_pago o pagada', false, `Excepción: ${err.message}`);
  }

  // ==========================================================================
  // AC-4A-05: Búsqueda de las rutas afectadas completada
  // ==========================================================================
  console.log('\n--- Verificando AC-4A-05 ---');
  try {
    // Inspección estática de las rutas productivas identificadas
    const quickCheckInCode = fs.readFileSync(path.resolve('src/components/admin/QuickCheckIn.tsx'), 'utf8');
    const participantsManagerCode = fs.readFileSync(path.resolve('src/components/admin/ParticipantsManager.tsx'), 'utf8');
    const transitionsCode = fs.readFileSync(path.resolve('src/services/participantTransitions.ts'), 'utf8');

    // Comprobar que en QuickCheckIn no se use hasActivityStarted ni isActivityConcluded para bloquear botones
    const qciNoTemporalRestrictions = 
      !quickCheckInCode.includes('hasActivityStarted') &&
      !quickCheckInCode.includes('isCheckInWindowActive') &&
      quickCheckInCode.includes('canResolveAttendance');

    // Comprobar que en ParticipantsManager el check-in use canResolveAttendance
    const pmUsesCanResolve = 
      participantsManagerCode.includes('canResolveAttendance') &&
      !participantsManagerCode.includes('isTodayOrPast &&');

    // Comprobar que en participantTransitions validateAndPrepareTransition para asistio y no_presentado use canResolveAttendance
    const transUsesCanResolve = 
      transitionsCode.includes('canResolveAttendance(activity)') &&
      transitionsCode.includes('export function canResolveAttendance');

    const pass = qciNoTemporalRestrictions && pmUsesCanResolve && transUsesCanResolve;

    recordResult(
      'AC-4A-05',
      'Búsqueda e inspección de rutas afectadas completada',
      pass,
      pass
        ? 'Evidencia verificada: QuickCheckIn.tsx, ParticipantsManager.tsx y participantTransitions.ts no usan prohibiciones temporales.'
        : `Fallo en inspección: qciNoTemporal=${qciNoTemporalRestrictions}, pmUsesCanResolve=${pmUsesCanResolve}, transUses=${transUsesCanResolve}`
    );
  } catch (err: any) {
    recordResult('AC-4A-05', 'Búsqueda e inspección de rutas afectadas completada', false, `Excepción: ${err.message}`);
  }

  // ==========================================================================
  // AC-4A-06: Suite unitaria y emulador configurados con dependencias locales
  // ==========================================================================
  console.log('\n--- Verificando AC-4A-06 ---');
  const requiredAcs = ['AC-4A-01', 'AC-4A-02', 'AC-4A-03', 'AC-4A-04', 'AC-4A-05'];
  const allPriorPassed = requiredAcs.every(code => {
    const r = testResults.find(t => t.code === code);
    return r && r.passed;
  });

  const pass06 = unitAllPass && allPriorPassed;
  recordResult(
    'AC-4A-06',
    'Suite unitaria y emulador configurados con dependencias locales existentes',
    pass06,
    pass06
      ? 'Pruebas unitarias de función pura y pruebas integradas de emulador ejecutadas con éxito; todos los criterios cubiertos.'
      : 'Fallo: no se cumplieron todas las pruebas previas o las pruebas unitarias.'
  );

  // ==========================================================================
  // RESUMEN Y VALIDACIÓN DE CRITERIOS
  // ==========================================================================
  console.log('\n========================================================================');
  console.log('RESUMEN DE CRITERIOS DE ACEPTACIÓN T-04A:');
  console.log('========================================================================');

  const finalCodes = ['AC-4A-01', 'AC-4A-02', 'AC-4A-03', 'AC-4A-04', 'AC-4A-05', 'AC-4A-06'];
  let allPassed = true;

  for (const code of finalCodes) {
    const res = testResults.find(t => t.code === code);
    if (res && res.passed) {
      console.log(`[PASS] ${code}: ${res.name}`);
    } else {
      console.log(`[FAIL] ${code}: ${res ? res.details : 'No ejecutado'}`);
      allPassed = false;
    }
  }

  console.log('========================================================================\n');

  if (!allPassed) {
    console.error('VALIDACIÓN INTEGRADA NO EJECUTADA: Fallaron criterios de aceptación.');
    process.exit(1);
  } else {
    console.log('Todos los criterios de aceptación AC-4A-01 a AC-4A-06 han sido validados exitosamente.');
    process.exit(0);
  }
}

runCheckInTests().catch((err) => {
  console.error('VALIDACIÓN INTEGRADA NO EJECUTADA:', err);
  process.exit(1);
});
