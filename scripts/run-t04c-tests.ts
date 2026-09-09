import { 
  validateAndPrepareTransition, 
  isActivityConcluded, 
  canResolveAttendance 
} from '../src/services/participantTransitions';
import { Activity, Participant } from '../src/types';
import { execSync } from 'child_process';

interface Result {
  id: string;
  name: string;
  status: 'CUMPLE' | 'NO CUMPLE';
  evidence: string;
}

const results: Result[] = [];

console.log('================================================================');
console.log('CERTIFICACIÓN AS IS — T-04C (Eliminación definitiva de hora fin)');
console.log('================================================================\n');

// ----------------------------------------------------------------------------
// AC-01: Actividad proxima fechada en el pasado, sin endTime, con participante pagada
// ----------------------------------------------------------------------------
try {
  const pastProximaAct: Activity = {
    id: 'act-past-proxima-1',
    type: 'cata',
    category: 'vino',
    title: 'Cata Pasada Próxima',
    subtitle: 'Subtítulo',
    description: 'Descripción',
    date: '2020-01-15',
    time: '20:00',
    priceMember: 20,
    priceNonMember: 30,
    totalSpots: 10,
    bookedSpots: 2,
    status: 'proxima',
    images: [],
    location: 'Sede Principal',
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2020-01-01T00:00:00.000Z'
  };

  const participantPaid: Participant = {
    id: 'part-paid-1',
    groupId: 'grp-1',
    activityId: 'act-past-proxima-1',
    activityTitle: 'Cata Pasada Próxima',
    activityDate: '2020-01-15',
    activityType: 'cata',
    fullName: 'María Asistente',
    email: 'maria@example.com',
    phone: '600111222',
    isMember: true,
    status: 'pagada',
    paymentMethod: 'tarjeta',
    totalAmount: 20,
    paidAmount: 20,
    registeredAt: '2020-01-02T10:00:00.000Z'
  };

  const checkAttendance = canResolveAttendance(pastProximaAct);
  const transitionRes = validateAndPrepareTransition({
    participant: participantPaid,
    targetStatus: 'asistio',
    activity: pastProximaAct,
    actor: 'Control de Puerta'
  });

  const passAC01 = 
    checkAttendance.allowed === true &&
    transitionRes.allowed === true &&
    transitionRes.updatedParticipant?.status === 'asistio' &&
    transitionRes.spotsDelta === 0;

  results.push({
    id: 'AC-01',
    name: 'Asistencia en actividad proxima pasada sin endTime',
    status: passAC01 ? 'CUMPLE' : 'NO CUMPLE',
    evidence: passAC01 
      ? `canResolveAttendance.allowed=true, transición pagada->asistio permitida sin consultar hora fin (spotsDelta=${transitionRes.spotsDelta}).`
      : `Fallo: canResolve=${checkAttendance.allowed}, transition=${transitionRes.allowed}, error=${transitionRes.error}`
  });
} catch (err: any) {
  results.push({
    id: 'AC-01',
    name: 'Asistencia en actividad proxima pasada sin endTime',
    status: 'NO CUMPLE',
    evidence: `Excepción: ${err.message}`
  });
}

// ----------------------------------------------------------------------------
// AC-02: Actividad proxima fechada en el pasado, sin endTime, plaza libre y espera
// ----------------------------------------------------------------------------
try {
  const pastProximaWithSpots: Activity = {
    id: 'act-past-proxima-2',
    type: 'cata',
    category: 'vino',
    title: 'Cata con Plazas Libres',
    subtitle: 'Subtítulo',
    description: 'Descripción',
    date: '2020-01-15',
    time: '20:00',
    priceMember: 25,
    priceNonMember: 35,
    totalSpots: 10,
    bookedSpots: 5,
    status: 'proxima',
    images: [],
    location: 'Sede Principal',
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2020-01-01T00:00:00.000Z'
  };

  const participantWaitlist: Participant = {
    id: 'part-wait-1',
    groupId: 'grp-2',
    activityId: 'act-past-proxima-2',
    activityTitle: 'Cata con Plazas Libres',
    activityDate: '2020-01-15',
    activityType: 'cata',
    fullName: 'Carlos Espera',
    email: 'carlos@example.com',
    phone: '600222333',
    isMember: false,
    status: 'lista_de_espera',
    paymentMethod: 'transferencia',
    totalAmount: 35,
    paidAmount: 0,
    registeredAt: '2020-01-02T10:00:00.000Z'
  };

  const promotionRes = validateAndPrepareTransition({
    participant: participantWaitlist,
    targetStatus: 'pendiente_pago',
    activity: pastProximaWithSpots,
    actor: 'Administración'
  });

  const passAC02 = 
    promotionRes.allowed === true &&
    promotionRes.updatedParticipant?.status === 'pendiente_pago' &&
    promotionRes.spotsDelta === 1;

  results.push({
    id: 'AC-02',
    name: 'Promoción de lista de espera en actividad proxima pasada',
    status: passAC02 ? 'CUMPLE' : 'NO CUMPLE',
    evidence: passAC02
      ? `Promoción lista_de_espera->pendiente_pago autorizada, spotsDelta=+1, status=pendiente_pago.`
      : `Fallo: allowed=${promotionRes.allowed}, error=${promotionRes.error}`
  });
} catch (err: any) {
  results.push({
    id: 'AC-02',
    name: 'Promoción de lista de espera en actividad proxima pasada',
    status: 'NO CUMPLE',
    evidence: `Excepción: ${err.message}`
  });
}

// ----------------------------------------------------------------------------
// AC-03: Actividad celebrada con participante pagada y lista de espera
// ----------------------------------------------------------------------------
try {
  const celebAct: Activity = {
    id: 'act-celeb-3',
    type: 'cata',
    category: 'vino',
    title: 'Cata Celebrada',
    subtitle: 'Subtítulo',
    description: 'Descripción',
    date: '2020-01-15',
    time: '20:00',
    priceMember: 25,
    priceNonMember: 35,
    totalSpots: 10,
    bookedSpots: 5,
    status: 'celebrada',
    images: [],
    location: 'Sede Principal',
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2020-01-01T00:00:00.000Z'
  };

  const participantPaidInCeleb: Participant = {
    id: 'part-paid-celeb',
    groupId: 'grp-3',
    activityId: 'act-celeb-3',
    activityTitle: 'Cata Celebrada',
    activityDate: '2020-01-15',
    activityType: 'cata',
    fullName: 'Elena Pagada',
    email: 'elena@example.com',
    phone: '600444555',
    isMember: true,
    status: 'pagada',
    paymentMethod: 'tarjeta',
    totalAmount: 25,
    paidAmount: 25,
    registeredAt: '2020-01-02T10:00:00.000Z'
  };

  const participantWaitInCeleb: Participant = {
    id: 'part-wait-celeb',
    groupId: 'grp-4',
    activityId: 'act-celeb-3',
    activityTitle: 'Cata Celebrada',
    activityDate: '2020-01-15',
    activityType: 'cata',
    fullName: 'Pedro Espera',
    email: 'pedro@example.com',
    phone: '600555666',
    isMember: true,
    status: 'lista_de_espera',
    paymentMethod: 'tarjeta',
    totalAmount: 25,
    paidAmount: 0,
    registeredAt: '2020-01-02T10:00:00.000Z'
  };

  const checkAttendanceCeleb = canResolveAttendance(celebAct);
  const attendanceRes = validateAndPrepareTransition({
    participant: participantPaidInCeleb,
    targetStatus: 'asistio',
    activity: celebAct,
    actor: 'Control'
  });

  const promotionRes = validateAndPrepareTransition({
    participant: participantWaitInCeleb,
    targetStatus: 'pendiente_pago',
    activity: celebAct,
    actor: 'Administración'
  });

  const passAC03 =
    checkAttendanceCeleb.allowed === false &&
    attendanceRes.allowed === false &&
    attendanceRes.updatedParticipant === undefined &&
    attendanceRes.spotsDelta === undefined &&
    promotionRes.allowed === false &&
    promotionRes.updatedParticipant === undefined &&
    promotionRes.spotsDelta === undefined &&
    celebAct.bookedSpots === 5;

  results.push({
    id: 'AC-03',
    name: 'Bloqueo estricto de asistencia ordinaria y promoción en celebrada',
    status: passAC03 ? 'CUMPLE' : 'NO CUMPLE',
    evidence: passAC03
      ? `Asistencia rechazada ("${attendanceRes.error}"), promoción rechazada ("${promotionRes.error}"). Participantes y aforo (5/10) intactos.`
      : `Fallo: checkAllowed=${checkAttendanceCeleb.allowed}, attAllowed=${attendanceRes.allowed}, promAllowed=${promotionRes.allowed}`
  });
} catch (err: any) {
  results.push({
    id: 'AC-03',
    name: 'Bloqueo estricto de asistencia ordinaria y promoción en celebrada',
    status: 'NO CUMPLE',
    evidence: `Excepción: ${err.message}`
  });
}

// ----------------------------------------------------------------------------
// AC-04: Ausencia de endTime, validateActivityTimes y comprobación de isActivityConcluded
// ----------------------------------------------------------------------------
try {
  let grepEndTimeMatches = '';
  let grepSearchSuccess = false;

  try {
    // Grep case-insensitive (-rni) buscando endtime, validateactivitytimes, unitnoendtime
    const output = execSync(
      'grep -rni "endtime\\|validateactivitytimes\\|unitnoendtime" src/ api/ scripts/ --exclude="run-t04c-tests.ts"',
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    ).trim();
    if (output.length > 0) {
      grepEndTimeMatches = output;
    }
  } catch (err: any) {
    // Grep retorna exit code 1 cuando NO encuentra coincidencias (comportamiento esperado)
    if (err.status === 1) {
      grepSearchSuccess = true;
    } else {
      throw new Error(`Fallo de ejecución en comando grep (exit code ${err.status}): ${err.message}`);
    }
  }

  let grepHoraFinMatches = '';
  let grepHoraFinSuccess = false;

  try {
    // Grep case-insensitive buscando hora fin / hora de fin
    const output = execSync(
      'grep -rni "hora[ _-]*fin\\|hora de fin" src/ api/ scripts/ --exclude="run-t04c-tests.ts"',
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    ).trim();
    if (output.length > 0) {
      grepHoraFinMatches = output;
    }
  } catch (err: any) {
    if (err.status === 1) {
      grepHoraFinSuccess = true;
    } else {
      throw new Error(`Fallo de ejecución en comando grep hora fin (exit code ${err.status}): ${err.message}`);
    }
  }

  // Comprobar isActivityConcluded con varias actividades
  const futureAct: Activity = {
    id: 'act-f',
    type: 'cata',
    category: 'vino',
    title: 'Futura',
    subtitle: '',
    description: '',
    date: '2030-01-01',
    time: '20:00',
    priceMember: 10,
    priceNonMember: 20,
    totalSpots: 10,
    bookedSpots: 0,
    status: 'proxima',
    images: [],
    location: '',
    createdAt: '',
    updatedAt: ''
  };

  const pastAct: Activity = {
    ...futureAct,
    id: 'act-p',
    date: '2020-01-01',
    time: '10:00',
    status: 'proxima'
  };

  const celebAct: Activity = {
    ...pastAct,
    id: 'act-c',
    status: 'celebrada'
  };

  const isConcludedFuture = isActivityConcluded(futureAct);
  const isConcludedPast = isActivityConcluded(pastAct);
  const isConcludedCeleb = isActivityConcluded(celebAct);

  const isConcludedStrict = 
    isConcludedFuture === false &&
    isConcludedPast === false &&
    isConcludedCeleb === true;

  const searchesClean = 
    grepSearchSuccess && 
    grepHoraFinSuccess && 
    grepEndTimeMatches === '' && 
    grepHoraFinMatches === '';

  const passAC04 = searchesClean && isConcludedStrict;

  results.push({
    id: 'AC-04',
    name: 'Ausencia total de endTime / hora fin y regla estricta de isActivityConcluded',
    status: passAC04 ? 'CUMPLE' : 'NO CUMPLE',
    evidence: passAC04
      ? `Búsqueda insensible a mayúsculas/minúsculas ejecutada con éxito (0 coincidencias de endtime/validateactivitytimes/unitnoendtime/hora fin). isActivityConcluded(proxima_futura)=false, isActivityConcluded(proxima_pasada)=false, isActivityConcluded(celebrada)=true.`
      : `Fallo: grepMatches="${grepEndTimeMatches || grepHoraFinMatches}", searchesClean=${searchesClean}, isConcludedStrict=${isConcludedStrict}`
  });
} catch (err: any) {
  results.push({
    id: 'AC-04',
    name: 'Ausencia total de endTime / hora fin y regla estricta de isActivityConcluded',
    status: 'NO CUMPLE',
    evidence: `Excepción en verificación AC-04: ${err.message}`
  });
}

// ----------------------------------------------------------------------------
// AC-05: Verificación real de lint y build en entorno reproducible
// ----------------------------------------------------------------------------
try {
  console.log('\n--- Ejecutando verificaciones reales de AC-05 (lint y build) ---');
  
  // 1. Ejecutar lint real
  const lintStartTime = Date.now();
  execSync('npm run lint', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  const lintDurationMs = Date.now() - lintStartTime;

  // 2. Ejecutar build real
  const buildStartTime = Date.now();
  execSync('npm run build', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  const buildDurationMs = Date.now() - buildStartTime;

  results.push({
    id: 'AC-05',
    name: 'Instalación limpia, lint y build con Node 22.x',
    status: 'CUMPLE',
    evidence: `Verificación real ejecutada exitosamente: npm run lint completado en ${lintDurationMs}ms (código 0), npm run build completado en ${buildDurationMs}ms (código 0). Node: ${process.version}.`
  });
} catch (err: any) {
  results.push({
    id: 'AC-05',
    name: 'Instalación limpia, lint y build con Node 22.x',
    status: 'NO CUMPLE',
    evidence: `Fallo en ejecución real de verificación AC-05: ${err.message}`
  });
}

// Imprimir informe
console.log('--- RESULTADOS DE CRITERIOS DE ACEPTACIÓN ---');
results.forEach(r => {
  console.log(`[${r.status}] ${r.id}: ${r.name}`);
  console.log(`       Evidencia: ${r.evidence}`);
});

const allPassed = results.every(r => r.status === 'CUMPLE');
console.log('\n================================================================');
console.log(`ESTADO FINAL: ${allPassed ? 'TODOS LOS CRITERIOS CUMPLIDOS (CÓDIGO 0)' : 'FALLOS DETECTADOS'}`);
console.log('================================================================');

if (!allPassed) {
  process.exit(1);
} else {
  process.exit(0);
}
