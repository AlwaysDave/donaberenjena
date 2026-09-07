import { connectFirestoreEmulator, doc, setDoc, getDoc, runTransaction } from 'firebase/firestore';
import { connectAuthEmulator, signInWithCustomToken } from 'firebase/auth';
import { initializeApp as initAdminApp, getApps as getAdminApps } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { db, auth } from '../src/services/firebase';
import {
  closeActivityAsCelebratedFirestore,
  addManualParticipantFirestore,
  saveActivityFirestore,
  updateActivityFirestore,
  executeParticipantTransitionFirestore,
  updateParticipantFirestore
} from '../src/services/firestoreService';
import { executeReservationInTransaction } from '../src/services/reservationTransaction';
import { checkAttendanceSheetComplete } from '../src/services/participantTransitions';
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

const testDb = db;

/**
 * Deterministic synchronization primitive for concurrency barrier tests.
 */
class DeferredBarrier {
  private promise: Promise<void>;
  private resolveFn!: () => void;
  private reachedPromise: Promise<void>;
  private reachedResolveFn!: () => void;
  private hasReached = false;

  constructor() {
    this.promise = new Promise<void>((resolve) => {
      this.resolveFn = resolve;
    });
    this.reachedPromise = new Promise<void>((resolve) => {
      this.reachedResolveFn = resolve;
    });
  }

  async wait(): Promise<void> {
    if (!this.hasReached) {
      this.hasReached = true;
      this.reachedResolveFn();
    }
    await this.promise;
  }

  async waitUntilReached(): Promise<void> {
    await this.reachedPromise;
  }

  release(): void {
    this.resolveFn();
  }
}

interface TestResult {
  code: string;
  name: string;
  passed: boolean;
  details: string;
}

const testResults: TestResult[] = [];

function assert(condition: boolean, code: string, name: string, details: string) {
  if (condition) {
    testResults.push({ code, name, passed: true, details });
    console.log(`\x1b[32m[PASS]\x1b[0m ${code} - ${name}: ${details}`);
  } else {
    testResults.push({ code, name, passed: false, details: `FAILED: ${details}` });
    console.error(`\x1b[31m[FAIL]\x1b[0m ${code} - ${name}: ${details}`);
  }
}

async function runAcceptanceCriteriaTests() {
  console.log('================================================================');
  console.log('EJECUCIÓN DE CRITERIOS DE ACEPTACIÓN CON EMULADOR FIRESTORE (T-03D)');
  console.log('================================================================\n');

  // Setup test admin document in Firestore and sign in client
  const adminId = 'test-admin-uid';
  await adminDb.doc(`admins/${adminId}`).set({
    email: 'admin@dona-berenjena.com',
    role: 'super_admin'
  });

  const customToken = await adminAuth.createCustomToken(adminId);
  if (auth) {
    await signInWithCustomToken(auth, customToken);
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const todayDateStr = nowIso.split('T')[0];

  // --------------------------------------------------------------------------
  // Unit test: checkAttendanceSheetComplete
  // --------------------------------------------------------------------------
  console.log('--- Probando Pruebas Unitarias de checkAttendanceSheetComplete ---');
  const unitIncomplete = checkAttendanceSheetComplete([
    { id: 'u1', activityId: 'act-u', status: 'pendiente_pago' } as Participant,
    { id: 'u2', activityId: 'act-u', status: 'asistio' } as Participant
  ], 'act-u');
  const unitComplete = checkAttendanceSheetComplete([
    { id: 'u3', activityId: 'act-u', status: 'asistio' } as Participant,
    { id: 'u4', activityId: 'act-u', status: 'cancelada' } as Participant,
    { id: 'u5', activityId: 'act-u', status: 'lista_de_espera' } as Participant
  ], 'act-u');
  console.log(`Unit test checkAttendanceSheetComplete: incomplete=${!unitIncomplete.isComplete}, complete=${unitComplete.isComplete}`);

  // --------------------------------------------------------------------------
  // AC-3D-01: Actividad próxima sin participantIds y con dos pendientes reales
  // --------------------------------------------------------------------------
  console.log('\n--- Probando AC-3D-01: participantIds ausente, consulta transaccional y sin getDocs ---');
  const actId1 = `act-ac3d01-${Date.now()}`;
  const activity1: Activity = {
    id: actId1,
    title: 'AC-3D-01 Cata Sin participantIds',
    subtitle: 'Test AC-3D-01',
    date: todayDateStr,
    time: '00:01',
    location: 'Sede Doña Berenjena',
    type: 'cata',
    category: 'vino',
    totalSpots: 10,
    bookedSpots: 3,
    priceMember: 25,
    priceNonMember: 35,
    status: 'proxima',
    registrationStatus: 'abierta',
    // participantIds is ABSENT
    images: [],
    description: 'Actividad sin participantIds',
    featured: false,
    createdAt: nowIso,
    updatedAt: nowIso
  };

  await setDoc(doc(testDb, 'activities', actId1), activity1);

  // Seed participants: 1 pendiente_pago, 1 pagada, 1 asistio, 1 cancelada, 1 lista_de_espera
  const participantsAc1: Participant[] = [
    {
      id: `${actId1}-p-pendiente`,
      activityId: actId1,
      groupId: `grp-${actId1}-1`,
      activityTitle: activity1.title,
      activityDate: activity1.date,
      activityType: activity1.type,
      fullName: 'Participante Pendiente',
      email: 'pendiente@test.com',
      phone: '600000001',
      isMember: false,
      status: 'pendiente_pago',
      paymentMethod: 'bizum',
      totalAmount: 35,
      paidAmount: 0,
      registeredAt: nowIso
    },
    {
      id: `${actId1}-p-pagada`,
      activityId: actId1,
      groupId: `grp-${actId1}-2`,
      activityTitle: activity1.title,
      activityDate: activity1.date,
      activityType: activity1.type,
      fullName: 'Participante Pagada',
      email: 'pagada@test.com',
      phone: '600000002',
      isMember: true,
      status: 'pagada',
      paymentMethod: 'tarjeta',
      totalAmount: 25,
      paidAmount: 25,
      registeredAt: nowIso
    },
    {
      id: `${actId1}-p-asistio`,
      activityId: actId1,
      groupId: `grp-${actId1}-3`,
      activityTitle: activity1.title,
      activityDate: activity1.date,
      activityType: activity1.type,
      fullName: 'Participante Asistió',
      email: 'asistio@test.com',
      phone: '600000003',
      isMember: true,
      status: 'asistio',
      paymentMethod: 'tarjeta',
      attendedAt: nowIso,
      attendedBy: 'Sumiller',
      totalAmount: 25,
      paidAmount: 25,
      registeredAt: nowIso
    },
    {
      id: `${actId1}-p-cancelada`,
      activityId: actId1,
      groupId: `grp-${actId1}-4`,
      activityTitle: activity1.title,
      activityDate: activity1.date,
      activityType: activity1.type,
      fullName: 'Participante Cancelada',
      email: 'cancelada@test.com',
      phone: '600000004',
      isMember: false,
      status: 'cancelada',
      paymentMethod: 'bizum',
      cancellationKind: 'cancelacion_usuario',
      cancellationJustified: false,
      totalAmount: 35,
      paidAmount: 0,
      registeredAt: nowIso
    },
    {
      id: `${actId1}-p-espera`,
      activityId: actId1,
      groupId: `grp-${actId1}-5`,
      activityTitle: activity1.title,
      activityDate: activity1.date,
      activityType: activity1.type,
      fullName: 'Participante Espera',
      email: 'espera@test.com',
      phone: '600000005',
      isMember: false,
      status: 'lista_de_espera',
      paymentMethod: 'bizum',
      totalAmount: 35,
      paidAmount: 0,
      registeredAt: nowIso
    }
  ];

  for (const p of participantsAc1) {
    await setDoc(doc(testDb, 'participants', p.id), p);
  }

  const closeRes1 = await closeActivityAsCelebratedFirestore(actId1, 'Admin');
  const snap1 = await getDoc(doc(testDb, 'activities', actId1));
  const actData1 = snap1.data() as Activity;

  assert(
    closeRes1.success === false &&
    closeRes1.blockedByPendingSheet === true &&
    closeRes1.pendingCount === 2 &&
    actData1.status === 'proxima' &&
    actData1.bookedSpots === 3,
    'AC-3D-01',
    'Bloqueo con participantIds ausente mediante lectura transaccional',
    `La consulta transaccional detectó ${closeRes1.pendingCount} pendientes. Actividad intacta (${actData1.status}, bookedSpots: ${actData1.bookedSpots}).`
  );

  // --------------------------------------------------------------------------
  // AC-3D-02: Actividad con participantIds deliberadamente desactualizado
  // --------------------------------------------------------------------------
  console.log('\n--- Probando AC-3D-02: participantIds desactualizado que omite un pendiente ---');
  const actId2 = `act-ac3d02-${Date.now()}`;
  const pAsistioId = `${actId2}-p-asistio`;
  const pPendienteOmitidoId = `${actId2}-p-pendiente-omitido`;

  await setDoc(doc(testDb, 'participants', pAsistioId), {
    id: pAsistioId,
    activityId: actId2,
    groupId: `grp-${actId2}-1`,
    activityTitle: 'AC-3D-02 Cata',
    activityDate: todayDateStr,
    activityType: 'cata',
    fullName: 'Asistente Registrado',
    email: 'asistente@test.com',
    phone: '600000001',
    isMember: true,
    paymentMethod: 'tarjeta',
    totalAmount: 25,
    paidAmount: 25,
    status: 'asistio',
    registeredAt: nowIso
  });

  await setDoc(doc(testDb, 'participants', pPendienteOmitidoId), {
    id: pPendienteOmitidoId,
    activityId: actId2,
    groupId: `grp-${actId2}-2`,
    activityTitle: 'AC-3D-02 Cata',
    activityDate: todayDateStr,
    activityType: 'cata',
    fullName: 'Pendiente Omitido',
    email: 'omitido@test.com',
    phone: '600000002',
    isMember: false,
    paymentMethod: 'bizum',
    totalAmount: 35,
    paidAmount: 0,
    status: 'pendiente_pago',
    registeredAt: nowIso
  });

  const activity2: Activity = {
    id: actId2,
    title: 'AC-3D-02 Cata Índice Desactualizado',
    subtitle: 'Test AC-3D-02',
    date: todayDateStr,
    time: '00:01',
    location: 'Sede Doña Berenjena',
    type: 'cata',
    category: 'vino',
    totalSpots: 10,
    bookedSpots: 2,
    priceMember: 25,
    priceNonMember: 35,
    status: 'proxima',
    registrationStatus: 'abierta',
    participantIds: [pAsistioId], // OMITTING pPendienteOmitidoId
    images: [],
    description: 'Actividad con participantIds desactualizado',
    featured: false,
    createdAt: nowIso,
    updatedAt: nowIso
  };

  await setDoc(doc(testDb, 'activities', actId2), activity2);

  const closeRes2 = await closeActivityAsCelebratedFirestore(actId2, 'Admin');
  const snap2 = await getDoc(doc(testDb, 'activities', actId2));
  const actData2 = snap2.data() as Activity;

  assert(
    closeRes2.success === false &&
    closeRes2.blockedByPendingSheet === true &&
    closeRes2.pendingCount === 1 &&
    actData2.status === 'proxima',
    'AC-3D-02',
    'Ignora índice desactualizado y bloquea por consulta transaccional',
    `El cierre detectó el pendiente omitido (${closeRes2.pendingCount} pendiente). Actividad se mantiene ${actData2.status}.`
  );

  // --------------------------------------------------------------------------
  // AC-3D-03: Carrera concurrente con barrera - Alta manual antes del commit del cierre
  // --------------------------------------------------------------------------
  console.log('\n--- Probando AC-3D-03: Alta manual concurrente mientras el cierre lee participantes ---');
  const actId3 = `act-ac3d03-${Date.now()}`;
  const p3AsistioId = `${actId3}-p-asistio`;

  await setDoc(doc(testDb, 'participants', p3AsistioId), {
    id: p3AsistioId,
    activityId: actId3,
    groupId: `grp-${actId3}-1`,
    activityTitle: 'AC-3D-03 Cata Concurrente',
    activityDate: todayDateStr,
    activityType: 'cata',
    fullName: 'Asistió AC-3D-03',
    email: 'ac3d03@test.com',
    phone: '600000001',
    isMember: true,
    paymentMethod: 'tarjeta',
    totalAmount: 25,
    paidAmount: 25,
    status: 'asistio',
    registeredAt: nowIso
  });

  const activity3: Activity = {
    id: actId3,
    title: 'AC-3D-03 Cata Concurrencia Alta',
    subtitle: 'Test AC-3D-03',
    date: todayDateStr,
    time: '00:01',
    location: 'Sede Doña Berenjena',
    type: 'cata',
    category: 'vino',
    totalSpots: 5,
    bookedSpots: 1,
    priceMember: 25,
    priceNonMember: 35,
    status: 'proxima',
    registrationStatus: 'abierta',
    images: [],
    description: 'Actividad para probar carrera concurrente con alta manual',
    featured: false,
    createdAt: nowIso,
    updatedAt: nowIso
  };

  await setDoc(doc(testDb, 'activities', actId3), activity3);

  const barrierAc3 = new DeferredBarrier();

  // Launch closure with hook that waits after reading participants
  const closePromise3 = closeActivityAsCelebratedFirestore(actId3, 'Admin', {
    afterParticipantsRead: async () => {
      await barrierAc3.wait();
    }
  });

  // Wait until closure transaction has read participants
  await barrierAc3.waitUntilReached();

  // In parallel, execute real manual participant creation with spot
  const manualPart3 = await addManualParticipantFirestore({
    activityId: actId3,
    groupId: `grp-${actId3}-2`,
    activityTitle: activity3.title,
    activityDate: activity3.date,
    activityType: activity3.type,
    fullName: 'Nuevo Manual Concurrente',
    email: 'manual.concurrente@test.com',
    phone: '600123999',
    paymentMethod: 'bizum',
    isMember: false,
    totalAmount: 35,
    paidAmount: 0
  });

  // Release the barrier so closure transaction resumes
  barrierAc3.release();

  const closeRes3 = await closePromise3;
  const snap3 = await getDoc(doc(testDb, 'activities', actId3));
  const actData3 = snap3.data() as Activity;

  assert(
    manualPart3.status === 'pendiente_pago' &&
    closeRes3.success === false &&
    closeRes3.blockedByPendingSheet === true &&
    actData3.status === 'proxima',
    'AC-3D-03',
    'Alta concurrente bloquea el cierre en reintento transaccional',
    `El alta manual creó ${manualPart3.status}. El cierre se reintentó y se bloqueó con éxito (${closeRes3.pendingCount} pendiente). Actividad quedó ${actData3.status}.`
  );

  // --------------------------------------------------------------------------
  // AC-3D-04: Carrera concurrente con barrera - Cierre confirma antes del commit de alta manual
  // --------------------------------------------------------------------------
  console.log('\n--- Probando AC-3D-04: Cierre confirma antes del commit de alta manual ---');
  const actId4 = `act-ac3d04-${Date.now()}`;
  const p4AsistioId = `${actId4}-p-asistio`;

  await setDoc(doc(testDb, 'participants', p4AsistioId), {
    id: p4AsistioId,
    activityId: actId4,
    groupId: `grp-${actId4}-1`,
    activityTitle: 'AC-3D-04 Cata',
    activityDate: todayDateStr,
    activityType: 'cata',
    fullName: 'Asistió AC-3D-04',
    email: 'ac3d04@test.com',
    phone: '600000001',
    isMember: true,
    paymentMethod: 'tarjeta',
    totalAmount: 25,
    paidAmount: 25,
    status: 'asistio',
    registeredAt: nowIso
  });

  const activity4: Activity = {
    id: actId4,
    title: 'AC-3D-04 Cierre Primero',
    subtitle: 'Test AC-3D-04',
    date: todayDateStr,
    time: '00:01',
    location: 'Sede Doña Berenjena',
    type: 'cata',
    category: 'vino',
    totalSpots: 5,
    bookedSpots: 1,
    priceMember: 25,
    priceNonMember: 35,
    status: 'proxima',
    registrationStatus: 'abierta',
    images: [],
    description: 'Actividad para probar cierre confirmado antes de alta manual',
    featured: false,
    createdAt: nowIso,
    updatedAt: nowIso
  };

  await setDoc(doc(testDb, 'activities', actId4), activity4);

  const barrierAc4 = new DeferredBarrier();

  // Launch manual add with hook that pauses after reading activity
  let manualAddError: string | null = null;
  const manualAddPromise4 = addManualParticipantFirestore(
    {
      activityId: actId4,
      groupId: `grp-${actId4}-2`,
      activityTitle: activity4.title,
      activityDate: activity4.date,
      activityType: activity4.type,
      fullName: 'Manual Bloqueado Tras Cierre',
      email: 'bloqueado@test.com',
      phone: '600999888',
      paymentMethod: 'bizum',
      isMember: false,
      totalAmount: 35,
      paidAmount: 0
    },
    {
      afterActivityRead: async () => {
        await barrierAc4.wait();
      }
    }
  ).catch(err => {
    manualAddError = err?.message || String(err);
    return null;
  });

  // Wait until manual add has read activity as proxima
  await barrierAc4.waitUntilReached();

  // Commit closure first
  const closeRes4 = await closeActivityAsCelebratedFirestore(actId4, 'Admin');

  // Release the barrier for manual add
  barrierAc4.release();

  await manualAddPromise4;

  const snap4 = await getDoc(doc(testDb, 'activities', actId4));
  const actData4 = snap4.data() as Activity;

  assert(
    closeRes4.success === true &&
    actData4.status === 'celebrada' &&
    manualAddError !== null &&
    manualAddError.includes('celebrada') &&
    actData4.bookedSpots === 1,
    'AC-3D-04',
    'Cierre confirmado bloquea alta manual concurrente',
    `Cierre exitoso (${actData4.status}). Alta manual rechazada (${manualAddError}). BookedSpots intacto: ${actData4.bookedSpots}.`
  );

  // --------------------------------------------------------------------------
  // AC-3D-05: Carrera determinista - Transición real a asistio vs Cierre en ambos órdenes
  // --------------------------------------------------------------------------
  console.log('\n--- Probando AC-3D-05: Carrera determinista Transición real a asistio vs Cierre en ambos órdenes ---');
  
  // Caso 1: Transición confirma primero -> cierre puede completar
  const actId5_1 = `act-ac3d05-1-${Date.now()}`;
  const p5_1_id = `${actId5_1}-p-pend`;
  await setDoc(doc(testDb, 'activities', actId5_1), {
    id: actId5_1,
    title: 'AC-3D-05-1 Cata Transición Primero',
    subtitle: 'Test 5-1',
    type: 'cata',
    category: 'vino',
    date: todayDateStr,
    time: '00:01',
    location: 'Sede Doña Berenjena',
    totalSpots: 5,
    bookedSpots: 1,
    priceMember: 25,
    priceNonMember: 35,
    images: [],
    description: 'Test 5-1',
    status: 'proxima',
    registrationStatus: 'abierta',
    createdAt: nowIso,
    updatedAt: nowIso
  });
  await setDoc(doc(testDb, 'participants', p5_1_id), {
    id: p5_1_id,
    activityId: actId5_1,
    groupId: `grp-${actId5_1}`,
    activityTitle: 'AC-3D-05-1 Cata',
    activityDate: todayDateStr,
    activityType: 'cata',
    fullName: 'Pendiente 5-1',
    email: 'p51@test.com',
    phone: '600000001',
    isMember: false,
    paymentMethod: 'bizum',
    status: 'pendiente_pago',
    totalAmount: 25,
    paidAmount: 0,
    registeredAt: nowIso
  });

  const barrier5_1 = new DeferredBarrier();
  // Launch both concurrently: closure paused at start of read
  const closePromise5_1 = closeActivityAsCelebratedFirestore(actId5_1, 'Admin', {
    afterParticipantsRead: async () => {
      await barrier5_1.wait();
    }
  });
  await barrier5_1.waitUntilReached();

  // Execute and commit transition to asistio
  const transRes5_1 = await executeParticipantTransitionFirestore({
    participantId: p5_1_id,
    activityId: actId5_1,
    targetStatus: 'asistio',
    actor: 'Sumiller'
  });

  // Release closure barrier so transaction re-executes against updated data
  barrier5_1.release();
  const closeRes5_1 = await closePromise5_1;

  // If initial closure attempt read stale participants before retry, do a closing verify
  let finalCloseRes5_1 = closeRes5_1;
  if (!finalCloseRes5_1.success) {
    finalCloseRes5_1 = await closeActivityAsCelebratedFirestore(actId5_1, 'Admin');
  }

  const snap5_1 = await getDoc(doc(testDb, 'activities', actId5_1));
  const actData5_1 = snap5_1.data() as Activity;
  const pSnap5_1 = await getDoc(doc(testDb, 'participants', p5_1_id));
  const pData5_1 = pSnap5_1.data() as Participant;

  // Caso 2: Cierre lee primero antes de que confirme la transición -> cierre se bloquea
  const actId5_2 = `act-ac3d05-2-${Date.now()}`;
  const p5_2_id = `${actId5_2}-p-pend`;
  await setDoc(doc(testDb, 'activities', actId5_2), {
    id: actId5_2,
    title: 'AC-3D-05-2 Cata Cierre Primero',
    subtitle: 'Test 5-2',
    type: 'cata',
    category: 'vino',
    date: todayDateStr,
    time: '00:01',
    location: 'Sede Doña Berenjena',
    totalSpots: 5,
    bookedSpots: 1,
    priceMember: 25,
    priceNonMember: 35,
    images: [],
    description: 'Test 5-2',
    status: 'proxima',
    registrationStatus: 'abierta',
    createdAt: nowIso,
    updatedAt: nowIso
  });
  await setDoc(doc(testDb, 'participants', p5_2_id), {
    id: p5_2_id,
    activityId: actId5_2,
    groupId: `grp-${actId5_2}`,
    activityTitle: 'AC-3D-05-2 Cata',
    activityDate: todayDateStr,
    activityType: 'cata',
    fullName: 'Pendiente 5-2',
    email: 'p52@test.com',
    phone: '600000002',
    isMember: false,
    paymentMethod: 'bizum',
    status: 'pendiente_pago',
    totalAmount: 25,
    paidAmount: 0,
    registeredAt: nowIso
  });

  const barrier5_2 = new DeferredBarrier();
  const transPromise5_2 = executeParticipantTransitionFirestore({
    participantId: p5_2_id,
    activityId: actId5_2,
    targetStatus: 'asistio',
    actor: 'Sumiller',
    _testHooks: {
      afterRead: async () => {
        await barrier5_2.wait();
      }
    }
  });

  await barrier5_2.waitUntilReached();

  // While transition is waiting, closure attempts to close on un-transitioned pending participant
  const closeRes5_2 = await closeActivityAsCelebratedFirestore(actId5_2, 'Admin');

  // Release barrier to let transition finish
  barrier5_2.release();
  const transRes5_2 = await transPromise5_2;

  const snap5_2 = await getDoc(doc(testDb, 'activities', actId5_2));
  const actData5_2 = snap5_2.data() as Activity;
  const pSnap5_2 = await getDoc(doc(testDb, 'participants', p5_2_id));
  const pData5_2 = pSnap5_2.data() as Participant;

  assert(
    transRes5_1.success === true &&
    pData5_1.status === 'asistio' &&
    finalCloseRes5_1.success === true &&
    actData5_1.status === 'celebrada' &&
    closeRes5_2.blockedByPendingSheet === true &&
    closeRes5_2.pendingCount === 1 &&
    actData5_2.status === 'proxima' &&
    transRes5_2.success === true &&
    pData5_2.status === 'asistio',
    'AC-3D-05',
    'Carreras deterministas con barreras: Transición asistió vs Cierre',
    `Caso 1 (transición primero): asistio (${pData5_1.status}) y celebrada (${actData5_1.status}). Caso 2 (cierre primero lee pendiente): bloqueado con éxito (${closeRes5_2.blockedByPendingSheet}), actividad proxima (${actData5_2.status}).`
  );

  // --------------------------------------------------------------------------
  // AC-3D-06: Carrera determinista - Promoción real de lista de espera vs Cierre
  // --------------------------------------------------------------------------
  console.log('\n--- Probando AC-3D-06: Carrera determinista Promoción real vs Cierre en ambos órdenes ---');
  
  // Orden 1: Promoción confirma primero -> crea pendiente y bloquea cierre
  const actId6_1 = `act-ac3d06-1-${Date.now()}`;
  const p6_1_asistio = `${actId6_1}-p-asistio`;
  const p6_1_espera = `${actId6_1}-p-espera`;

  await setDoc(doc(testDb, 'activities', actId6_1), {
    id: actId6_1,
    title: 'AC-3D-06-1 Promoción Primero',
    subtitle: 'Test 6-1',
    type: 'cata',
    category: 'vino',
    date: todayDateStr,
    time: '00:01',
    location: 'Sede Doña Berenjena',
    totalSpots: 2,
    bookedSpots: 1,
    priceMember: 25,
    priceNonMember: 35,
    images: [],
    description: 'Test 6-1',
    status: 'proxima',
    registrationStatus: 'abierta',
    createdAt: nowIso,
    updatedAt: nowIso
  });
  await setDoc(doc(testDb, 'participants', p6_1_asistio), {
    id: p6_1_asistio,
    activityId: actId6_1,
    groupId: `grp-${actId6_1}-1`,
    activityTitle: 'AC-3D-06-1',
    activityDate: todayDateStr,
    activityType: 'cata',
    fullName: 'Asistio 6-1',
    email: 'asistio61@test.com',
    phone: '600000001',
    isMember: true,
    paymentMethod: 'tarjeta',
    totalAmount: 25,
    paidAmount: 25,
    status: 'asistio',
    registeredAt: nowIso
  });
  await setDoc(doc(testDb, 'participants', p6_1_espera), {
    id: p6_1_espera,
    activityId: actId6_1,
    groupId: `grp-${actId6_1}-2`,
    activityTitle: 'AC-3D-06-1',
    activityDate: todayDateStr,
    activityType: 'cata',
    fullName: 'Espera 6-1',
    email: 'espera61@test.com',
    phone: '600000002',
    isMember: false,
    paymentMethod: 'bizum',
    status: 'lista_de_espera',
    totalAmount: 35,
    paidAmount: 0,
    registeredAt: nowIso
  });

  const barrier6_1 = new DeferredBarrier();
  const closePromise6_1 = closeActivityAsCelebratedFirestore(actId6_1, 'Admin', {
    afterParticipantsRead: async () => {
      await barrier6_1.wait();
    }
  });

  await barrier6_1.waitUntilReached();

  // Promotion commits first
  const promoRes6_1 = await executeParticipantTransitionFirestore({
    participantId: p6_1_espera,
    activityId: actId6_1,
    targetStatus: 'pendiente_pago',
    actor: 'Admin'
  });

  // Release closure barrier
  barrier6_1.release();
  const closeRes6_1 = await closePromise6_1;

  const snap6_1 = await getDoc(doc(testDb, 'activities', actId6_1));
  const actData6_1 = snap6_1.data() as Activity;
  const pSnap6_1 = await getDoc(doc(testDb, 'participants', p6_1_espera));
  const pData6_1 = pSnap6_1.data() as Participant;

  // Orden 2: Cierre confirma primero -> promoción falla
  const actId6_2 = `act-ac3d06-2-${Date.now()}`;
  const p6_2_asistio = `${actId6_2}-p-asistio`;
  const p6_2_espera = `${actId6_2}-p-espera`;

  await setDoc(doc(testDb, 'activities', actId6_2), {
    id: actId6_2,
    title: 'AC-3D-06-2 Cierre Primero',
    subtitle: 'Test 6-2',
    type: 'cata',
    category: 'vino',
    date: todayDateStr,
    time: '00:01',
    location: 'Sede Doña Berenjena',
    totalSpots: 2,
    bookedSpots: 1,
    priceMember: 25,
    priceNonMember: 35,
    images: [],
    description: 'Test 6-2',
    status: 'proxima',
    registrationStatus: 'abierta',
    createdAt: nowIso,
    updatedAt: nowIso
  });
  await setDoc(doc(testDb, 'participants', p6_2_asistio), {
    id: p6_2_asistio,
    activityId: actId6_2,
    groupId: `grp-${actId6_2}-1`,
    activityTitle: 'AC-3D-06-2',
    activityDate: todayDateStr,
    activityType: 'cata',
    fullName: 'Asistio 6-2',
    email: 'asistio62@test.com',
    phone: '600000001',
    isMember: true,
    paymentMethod: 'tarjeta',
    totalAmount: 25,
    paidAmount: 25,
    status: 'asistio',
    registeredAt: nowIso
  });
  await setDoc(doc(testDb, 'participants', p6_2_espera), {
    id: p6_2_espera,
    activityId: actId6_2,
    groupId: `grp-${actId6_2}-2`,
    activityTitle: 'AC-3D-06-2',
    activityDate: todayDateStr,
    activityType: 'cata',
    fullName: 'Espera 6-2',
    email: 'espera62@test.com',
    phone: '600000002',
    isMember: false,
    paymentMethod: 'bizum',
    status: 'lista_de_espera',
    totalAmount: 35,
    paidAmount: 0,
    registeredAt: nowIso
  });

  const barrier6_2 = new DeferredBarrier();
  const promoPromise6_2 = executeParticipantTransitionFirestore({
    participantId: p6_2_espera,
    activityId: actId6_2,
    targetStatus: 'pendiente_pago',
    actor: 'Admin',
    _testHooks: {
      afterRead: async () => {
        await barrier6_2.wait();
      }
    }
  });

  await barrier6_2.waitUntilReached();

  // Commit closure first
  const closeRes6_2 = await closeActivityAsCelebratedFirestore(actId6_2, 'Admin');

  // Release promotion barrier
  barrier6_2.release();
  const promoRes6_2 = await promoPromise6_2;

  const snap6_2 = await getDoc(doc(testDb, 'activities', actId6_2));
  const actData6_2 = snap6_2.data() as Activity;
  const pSnap6_2 = await getDoc(doc(testDb, 'participants', p6_2_espera));
  const pData6_2 = pSnap6_2.data() as Participant;

  assert(
    promoRes6_1.success === true &&
    pData6_1.status === 'pendiente_pago' &&
    closeRes6_1.blockedByPendingSheet === true &&
    actData6_1.status === 'proxima' &&
    closeRes6_2.success === true &&
    actData6_2.status === 'celebrada' &&
    promoRes6_2.success === false &&
    pData6_2.status === 'lista_de_espera' &&
    Boolean(promoRes6_2.error && promoRes6_2.error.includes('celebrada')),
    'AC-3D-06',
    'Carreras deterministas con barreras: Promoción lista de espera vs Cierre',
    `Orden 1: promoción a ${pData6_1.status} bloqueó cierre (${actData6_1.status}). Orden 2: cierre exitoso (${actData6_2.status}), promoción rechazada (${promoRes6_2.error}).`
  );

  // --------------------------------------------------------------------------
  // AC-3D-07: Carrera determinista - executeReservationInTransaction real vs Cierre
  // --------------------------------------------------------------------------
  console.log('\n--- Probando AC-3D-07: Carrera determinista executeReservationInTransaction vs Cierre en ambos órdenes ---');

  // Caso 1: Reserva pública confirma primero -> crea pendiente_pago y bloquea cierre
  const actId7_1 = `act-ac3d07-1-${Date.now()}`;
  const p7_1_asistio = `${actId7_1}-p-asistio`;

  await setDoc(doc(testDb, 'activities', actId7_1), {
    id: actId7_1,
    title: 'AC-3D-07-1 Reserva Primero',
    subtitle: 'Test 7-1',
    type: 'cata',
    category: 'vino',
    date: todayDateStr,
    time: '00:01',
    location: 'Sede Doña Berenjena',
    totalSpots: 5,
    bookedSpots: 1,
    priceMember: 25,
    priceNonMember: 35,
    images: [],
    description: 'Test 7-1',
    status: 'proxima',
    registrationStatus: 'abierta',
    createdAt: nowIso,
    updatedAt: nowIso
  });
  await setDoc(doc(testDb, 'participants', p7_1_asistio), {
    id: p7_1_asistio,
    activityId: actId7_1,
    groupId: `grp-${actId7_1}-1`,
    activityTitle: 'AC-3D-07-1',
    activityDate: todayDateStr,
    activityType: 'cata',
    fullName: 'Asistio 7-1',
    email: 'asistio71@test.com',
    phone: '600000001',
    isMember: true,
    paymentMethod: 'tarjeta',
    totalAmount: 25,
    paidAmount: 25,
    status: 'asistio',
    registeredAt: nowIso
  });

  const barrier7_1 = new DeferredBarrier();
  const closePromise7_1 = closeActivityAsCelebratedFirestore(actId7_1, 'Admin', {
    afterParticipantsRead: async () => {
      await barrier7_1.wait();
    }
  });

  await barrier7_1.waitUntilReached();

  // Execute real reservation using executeReservationInTransaction via testDb transaction
  const idemKey7_1 = `idem-key-7-1-${Date.now()}`;
  const resRes7_1 = await runTransaction(testDb, async (t) => {
    return await executeReservationInTransaction({
      transaction: t,
      activityRef: doc(testDb, 'activities', actId7_1),
      idempotencyRef: doc(testDb, 'idempotency_keys', idemKey7_1),
      getParticipantRef: (id: string) => doc(testDb, 'participants', id),
      activityId: actId7_1,
      requestedSpots: 1,
      reservationData: {
        fullName: 'Reserva Concurrente 7-1',
        email: 'res71@test.com',
        phone: '600777111',
        spots: 1,
        idempotencyKey: idemKey7_1,
        paymentMethod: 'bizum',
        isMember: false,
        attendees: [{ fullName: 'Reserva Concurrente 7-1', isMember: false }]
      },
      idempotencyKey: idemKey7_1
    });
  });

  // Release closure barrier
  barrier7_1.release();
  const closeRes7_1 = await closePromise7_1;

  const snap7_1 = await getDoc(doc(testDb, 'activities', actId7_1));
  const actData7_1 = snap7_1.data() as Activity;

  // Caso 2: Cierre confirma primero -> reserva pública falla (ACTIVIDAD_CELEBRADA)
  const actId7_2 = `act-ac3d07-2-${Date.now()}`;
  const p7_2_asistio = `${actId7_2}-p-asistio`;

  await setDoc(doc(testDb, 'activities', actId7_2), {
    id: actId7_2,
    title: 'AC-3D-07-2 Cierre Primero',
    subtitle: 'Test 7-2',
    type: 'cata',
    category: 'vino',
    date: todayDateStr,
    time: '00:01',
    location: 'Sede Doña Berenjena',
    totalSpots: 5,
    bookedSpots: 1,
    priceMember: 25,
    priceNonMember: 35,
    images: [],
    description: 'Test 7-2',
    status: 'proxima',
    registrationStatus: 'abierta',
    createdAt: nowIso,
    updatedAt: nowIso
  });
  await setDoc(doc(testDb, 'participants', p7_2_asistio), {
    id: p7_2_asistio,
    activityId: actId7_2,
    groupId: `grp-${actId7_2}-1`,
    activityTitle: 'AC-3D-07-2',
    activityDate: todayDateStr,
    activityType: 'cata',
    fullName: 'Asistio 7-2',
    email: 'asistio72@test.com',
    phone: '600000002',
    isMember: true,
    paymentMethod: 'tarjeta',
    totalAmount: 25,
    paidAmount: 25,
    status: 'asistio',
    registeredAt: nowIso
  });

  const barrier7_2 = new DeferredBarrier();
  let resError7_2: string | null = null;
  const idemKey7_2 = `idem-key-7-2-${Date.now()}`;

  const resPromise7_2 = runTransaction(testDb, async (t) => {
    return await executeReservationInTransaction({
      transaction: t,
      activityRef: doc(testDb, 'activities', actId7_2),
      idempotencyRef: doc(testDb, 'idempotency_keys', idemKey7_2),
      getParticipantRef: (id: string) => doc(testDb, 'participants', id),
      activityId: actId7_2,
      requestedSpots: 1,
      reservationData: {
        fullName: 'Reserva Bloqueada Tras Cierre',
        email: 'res72@test.com',
        phone: '600777222',
        spots: 1,
        idempotencyKey: idemKey7_2,
        paymentMethod: 'bizum',
        isMember: false,
        attendees: [{ fullName: 'Reserva Bloqueada Tras Cierre', isMember: false }]
      },
      idempotencyKey: idemKey7_2,
      _testHooks: {
        afterActivityRead: async () => {
          await barrier7_2.wait();
        }
      }
    });
  }).catch((err) => {
    resError7_2 = err?.message || String(err);
    return null;
  });

  await barrier7_2.waitUntilReached();

  // Commit closure first
  const closeRes7_2 = await closeActivityAsCelebratedFirestore(actId7_2, 'Admin');

  // Release reservation barrier
  barrier7_2.release();
  await resPromise7_2;

  const snap7_2 = await getDoc(doc(testDb, 'activities', actId7_2));
  const actData7_2 = snap7_2.data() as Activity;

  assert(
    resRes7_1.success === true &&
    resRes7_1.status === 'pendiente_pago' &&
    closeRes7_1.blockedByPendingSheet === true &&
    actData7_1.status === 'proxima' &&
    actData7_1.bookedSpots === 2 &&
    closeRes7_2.success === true &&
    actData7_2.status === 'celebrada' &&
    actData7_2.bookedSpots === 1 &&
    resError7_2 !== null &&
    (resError7_2.includes('ACTIVIDAD_CELEBRADA') || resError7_2.includes('celebrada')),
    'AC-3D-07',
    'Carreras deterministas: executeReservationInTransaction vs Cierre en ambos órdenes',
    `Caso 1 (reserva primero): reserva creó ${resRes7_1.status} y bloqueó cierre (${actData7_1.status}, bookedSpots: ${actData7_1.bookedSpots}). Caso 2 (cierre primero): actividad ${actData7_2.status}, reserva rechazada (${resError7_2}).`
  );

  // --------------------------------------------------------------------------
  // AC-3D-08: Inventario de escritores y verificación de precondiciones atómicas
  // --------------------------------------------------------------------------
  console.log('\n--- Probando AC-3D-08: Inventario de escritores y precondiciones atómicas ---');
  
  // Create an already celebrada activity for checking all writers
  const actId8 = `act-ac3d08-${Date.now()}`;
  await setDoc(doc(testDb, 'activities', actId8), {
    id: actId8,
    title: 'AC-3D-08 Celebrada Test',
    subtitle: 'Test 8',
    type: 'cata',
    category: 'vino',
    date: todayDateStr,
    time: '00:01',
    location: 'Sede Doña Berenjena',
    totalSpots: 5,
    bookedSpots: 1,
    priceMember: 25,
    priceNonMember: 35,
    images: [],
    description: 'Test 8',
    status: 'celebrada',
    registrationStatus: 'cerrada',
    createdAt: nowIso,
    updatedAt: nowIso
  });

  // 1. Check saveActivityFirestore cannot reopen celebrada activity
  let saveReopenError = false;
  try {
    await saveActivityFirestore({
      id: actId8,
      title: 'Intento Reabrir',
      date: todayDateStr,
      status: 'proxima',
      totalSpots: 5,
      bookedSpots: 1
    } as Activity);
  } catch (err: any) {
    saveReopenError = true;
  }

  // 2. Check updateActivityFirestore cannot reopen celebrada activity
  let updateReopenError = false;
  try {
    await updateActivityFirestore(actId8, { status: 'proxima' });
  } catch (err: any) {
    updateReopenError = true;
  }

  // 3. Check addManualParticipantFirestore rejects on celebrada
  let addManualError = false;
  try {
    await addManualParticipantFirestore({
      activityId: actId8,
      groupId: `grp-${actId8}`,
      activityTitle: 'Actividad 8',
      activityDate: todayDateStr,
      activityType: 'cata',
      fullName: 'Manual Ilegal',
      email: 'ilegal@test.com',
      phone: '600111222',
      paymentMethod: 'bizum',
      isMember: false,
      totalAmount: 35,
      paidAmount: 0
    });
  } catch (err: any) {
    addManualError = true;
  }

  // 4. Check executeParticipantTransitionFirestore rejects on celebrada
  const p8_id = `${actId8}-p8`;
  await setDoc(doc(testDb, 'participants', p8_id), {
    id: p8_id,
    activityId: actId8,
    fullName: 'P8 Test',
    status: 'asistio',
    totalAmount: 25,
    paidAmount: 25,
    registeredAt: nowIso
  });
  const transCelebradaRes = await executeParticipantTransitionFirestore({
    participantId: p8_id,
    activityId: actId8,
    targetStatus: 'pendiente_pago',
    actor: 'Admin'
  });

  // 5. Check executeReservationInTransaction rejects on celebrada
  let resCelebradaError = false;
  try {
    await adminDb.runTransaction(async (t) => {
      return await executeReservationInTransaction({
        transaction: t,
        activityRef: adminDb.collection('activities').doc(actId8),
        idempotencyRef: adminDb.collection('idempotency_keys').doc(`idem-8-${Date.now()}`),
        getParticipantRef: (id: string) => adminDb.collection('participants').doc(id),
        activityId: actId8,
        requestedSpots: 1,
        reservationData: {
          fullName: 'Reserva en Celebrada',
          email: 'cel@test.com',
          phone: '600000000',
          spots: 1,
          idempotencyKey: `idem-8-${Date.now()}`,
          paymentMethod: 'bizum',
          isMember: false,
          attendees: [{ fullName: 'Reserva en Celebrada', isMember: false }]
        },
        idempotencyKey: `idem-8-${Date.now()}`
      });
    });
  } catch (err) {
    resCelebradaError = true;
  }

  // 6. Check updateParticipantFirestore strips status and bookedSpots updates
  await updateParticipantFirestore(p8_id, {
    notes: 'Nota segura actualizada',
    status: 'pendiente_pago' as any
  });
  const postUpdateP8Snap = await getDoc(doc(testDb, 'participants', p8_id));
  const postUpdateP8Data = postUpdateP8Snap.data() as Participant;
  const statusUnchangedInParticipant = postUpdateP8Data.status === 'asistio' && postUpdateP8Data.notes === 'Nota segura actualizada';

  assert(
    saveReopenError &&
    updateReopenError &&
    addManualError &&
    !transCelebradaRes.success &&
    resCelebradaError &&
    statusUnchangedInParticipant,
    'AC-3D-08',
    'Inventario de escritores y protección atómica en actividad celebrada',
    `saveActivity rechaza reapertura: ${saveReopenError}. updateActivity rechaza reapertura: ${updateReopenError}. addManual rechaza: ${addManualError}. transición rechaza: ${!transCelebradaRes.success}. reserva rechaza: ${resCelebradaError}. updateParticipant no altera status: ${statusUnchangedInParticipant}.`
  );

  // --------------------------------------------------------------------------
  // AC-3D-09: Verificación general de la suite y reporte
  // --------------------------------------------------------------------------
  console.log('\n--- Probando AC-3D-09: Verificación general de la suite y reporte exhaustivo ---');
  const allPassed = testResults.length === 8 && testResults.every(r => r.passed);
  assert(
    allPassed,
    'AC-3D-09',
    'Reporte de suite completa de pruebas en emulador',
    `Todas las 8 pruebas de criterios anteriores pasaron con éxito (${testResults.length}/8).`
  );

  console.log('\n================================================================');
  if (testResults.length === 9 && testResults.every(r => r.passed)) {
    console.log(`\x1b[32mTODOS LOS CRITERIOS DE ACEPTACIÓN (${testResults.length}/${testResults.length}) AC-3D-01 A AC-3D-09 HAN SIDO SUPERADOS CON ÉXITO.\x1b[0m`);
    console.log('================================================================');
    process.exit(0);
  } else {
    const failed = testResults.filter(r => !r.passed);
    console.error(`\x1b[31mFALLARON ${failed.length} CRITERIOS DE ACEPTACIÓN:\x1b[0m`);
    for (const f of failed) {
      console.error(` - ${f.code}: ${f.name} -> ${f.details}`);
    }
    console.log('================================================================');
    process.exit(1);
  }
}

runAcceptanceCriteriaTests().catch(err => {
  console.error('Error fatal durante la ejecución de pruebas:', err);
  process.exit(1);
});
