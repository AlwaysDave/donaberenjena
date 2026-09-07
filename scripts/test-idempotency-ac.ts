/**
 * PRUEBAS UNITARIAS PURAS DE GESTIÓN DE CLAVES DE IDEMPOTENCIA Y CICLO DE VIDA DEL FORMULARIO
 * 
 * NOTA EXPRESA: Este archivo contiene exclusivamente pruebas unitarias de lógica pura en memoria.
 * NO valida Firestore, NO valida llamadas HTTP ni concurrencia real.
 * 
 * Cobertura de Criterios de Aceptación (T-02C: AC-01 a AC-06):
 * - AC-01: Formulario en estado completado tras éxito bloquea envíos posteriores.
 * - AC-02: Apertura de una nueva reserva tras un éxito genera una clave nueva antes del primer envío.
 * - AC-03: Fallo reintentable (retryable / 5xx / red) conserva exactamente la misma clave.
 * - AC-04: Fallo definitivo (definitive / 4xx / regla de negocio) reemplaza la clave por una nueva.
 * - AC-05: Entorno sin crypto.randomUUID pero con crypto.getRandomValues genera UUID v4 válida.
 * - AC-06: Entorno sin API criptográfica segura produce error controlado sin fabricar clave predecible.
 */

import {
  generateSecureReservationKey,
  createNewReservationAttemptKey,
  processReservationLifecycleTransition,
  validateIdempotencyKey,
  classifyReservationFailure,
  CryptoProvider
} from '../src/services/reservationTransaction.ts';
import { ReservationResult } from '../src/types';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${testName} ${detail ? `- ${detail}` : ''}`);
  }
}

async function runAcceptanceTests() {
  console.log('================================================================================');
  console.log('PRUEBAS UNITARIAS: CICLO DE VIDA DE IDEMPOTENCIA EN FORMULARIO (AC-01 - AC-06)');
  console.log('NOTA: Esta suite prueba lógica pura en memoria; no valida Firestore, HTTP ni concurrencia.');
  console.log('================================================================================\n');

  // --------------------------------------------------------------------------
  // AC-01: Estado terminado tras éxito bloquea segundos envíos
  // --------------------------------------------------------------------------
  console.log('--- AC-01: Formulario con clave K y resultado éxito ---');
  const initialKeyAC1 = generateSecureReservationKey();
  const successResult: ReservationResult = {
    success: true,
    message: 'Reserva confirmada con éxito',
    groupId: 'grp-ac01-test'
  };

  const transitionAC1 = processReservationLifecycleTransition(initialKeyAC1, successResult);
  assert(transitionAC1.isCompleted === true, 'El estado del ciclo de vida se marca como completado (isCompleted: true)');
  assert(transitionAC1.canResubmit === false, 'Se prohíbe explícitamente cualquier reenvío (canResubmit: false)');
  assert(transitionAC1.action === 'completed', 'La acción resultante es "completed"');
  assert(transitionAC1.nextKey === null, 'La clave para el formulario actual queda invalidada/nula para prevenir dobles envíos');

  // Simulación de intento de segundo envío en el cliente
  let reserveSpotsCalls = 0;
  const mockReserveSpots = () => {
    reserveSpotsCalls++;
  };

  // Simular la guarda del formulario (isSubmitting || isCompleted)
  let isCompleted = transitionAC1.isCompleted;
  const triggerSubmitAgain = () => {
    if (isCompleted) {
      return; // Guardia idéntica a ReservationBlock
    }
    mockReserveSpots();
  };

  triggerSubmitAgain();
  assert(reserveSpotsCalls === 0, 'Un segundo intento de confirmación antes del cierre no ejecuta reserveSpots');

  // --------------------------------------------------------------------------
  // AC-02: Apertura de una reserva nueva tras cierre de la anterior
  // --------------------------------------------------------------------------
  console.log('\n--- AC-02: Apertura de nueva reserva tras éxito previo ---');
  // Se simula la apertura del modal usando la misma función pura createNewReservationAttemptKey
  const newAttempt = createNewReservationAttemptKey();
  assert(typeof newAttempt.key === 'string' && newAttempt.key.length >= 8, 'Se genera una clave válida antes del primer envío');
  assert(newAttempt.key !== initialKeyAC1, 'La clave generada L es completamente distinta de la clave K anterior');

  // --------------------------------------------------------------------------
  // AC-03: Resultado retryable conserva exactamente la misma clave
  // --------------------------------------------------------------------------
  console.log('\n--- AC-03: Error reintentable conserva la misma clave ---');
  const keyAC3 = generateSecureReservationKey();
  const retryableResult: ReservationResult = {
    success: false,
    message: 'Error de red temporal (503)',
    failureKind: classifyReservationFailure(503)
  };

  const transitionAC3 = processReservationLifecycleTransition(keyAC3, retryableResult);
  assert(transitionAC3.isCompleted === false, 'El formulario no se marca como completado');
  assert(transitionAC3.canResubmit === true, 'Se permite reintentar el envío (canResubmit: true)');
  assert(transitionAC3.action === 'retained_for_retry', 'La acción es "retained_for_retry"');
  assert(transitionAC3.nextKey === keyAC3, 'La clave conservada para el reintento es exactamente la misma clave K');

  // --------------------------------------------------------------------------
  // AC-04: Resultado definitive genera una clave nueva para corregir
  // --------------------------------------------------------------------------
  console.log('\n--- AC-04: Error definitivo reemplaza la clave por una nueva ---');
  const keyAC4 = generateSecureReservationKey();
  const definitiveResult: ReservationResult = {
    success: false,
    message: 'Datos de reserva no válidos (400)',
    failureKind: classifyReservationFailure(400)
  };

  const transitionAC4 = processReservationLifecycleTransition(keyAC4, definitiveResult);
  assert(transitionAC4.isCompleted === false, 'El formulario permanece abierto para corrección');
  assert(transitionAC4.canResubmit === true, 'Se permite enviar la corrección');
  assert(transitionAC4.action === 'renewed_for_corrected_attempt', 'La acción es "renewed_for_corrected_attempt"');
  assert(
    typeof transitionAC4.nextKey === 'string' && transitionAC4.nextKey !== keyAC4,
    'La clave anterior K es descartada y se asigna una nueva clave L para el reenvío corregido'
  );

  // --------------------------------------------------------------------------
  // AC-05: Entorno sin crypto.randomUUID pero con crypto.getRandomValues
  // --------------------------------------------------------------------------
  console.log('\n--- AC-05: Entorno sólo con crypto.getRandomValues ---');
  const mockRandomValuesCrypto: CryptoProvider = {
    randomUUID: undefined,
    getRandomValues: <T extends ArrayBufferView | null>(array: T): T => {
      if (!array) return array;
      const u8 = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
      for (let i = 0; i < u8.length; i++) {
        u8[i] = (i * 37 + 13) % 256; // Mock determinista de bytes sin Math.random
      }
      return array;
    }
  };

  const keyAC5 = generateSecureReservationKey(mockRandomValuesCrypto);
  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  assert(uuidV4Regex.test(keyAC5), 'Devuelve un UUID v4 válido conforme a la especificación RFC 4122');
  assert(!keyAC5.includes('idem-') && !keyAC5.includes(Date.now().toString().slice(0, 5)), 'No contiene marcas de fecha ni prefijos inseguros');

  // --------------------------------------------------------------------------
  // AC-06: Entorno sin API criptográfica segura
  // --------------------------------------------------------------------------
  console.log('\n--- AC-06: Entorno sin API criptográfica segura ---');
  const mockEmptyCrypto: CryptoProvider = {
    randomUUID: undefined,
    getRandomValues: undefined
  };

  let threwError = false;
  try {
    generateSecureReservationKey(mockEmptyCrypto);
  } catch (err: any) {
    threwError = true;
    assert(
      err.message.includes('ENTORNO_CRIPTO_NO_DISPONIBLE'),
      'generateSecureReservationKey lanza una excepción explícita ENTORNO_CRIPTO_NO_DISPONIBLE'
    );
  }
  assert(threwError, 'No se genera ninguna clave fallback predecible cuando falta la criptografía');

  const attemptWithoutCrypto = createNewReservationAttemptKey(mockEmptyCrypto);
  assert(attemptWithoutCrypto.key === '', 'createNewReservationAttemptKey devuelve clave vacía');
  assert(
    typeof attemptWithoutCrypto.error === 'string' && attemptWithoutCrypto.error.length > 0,
    'createNewReservationAttemptKey reporta el error controlado para la interfaz'
  );

  // --------------------------------------------------------------------------
  // RESUMEN
  // --------------------------------------------------------------------------
  console.log('\n================================================================================');
  console.log(`RESUMEN: ${passedTests}/${totalTests} pruebas unitarias superadas`);
  console.log('================================================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runAcceptanceTests().catch((err) => {
  console.error('Error fatal ejecutando pruebas:', err);
  process.exit(1);
});
