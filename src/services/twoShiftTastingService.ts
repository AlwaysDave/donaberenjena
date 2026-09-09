import { doc, getDoc, writeBatch, WriteBatch } from 'firebase/firestore';
import { db } from './firebase';
import { CataActivity, Activity } from '../types';
import { sanitizeForFirestore } from './firestoreService';

const ACTIVITIES_COLLECTION = 'activities';

export interface TwoShiftValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Pure validation function for two-shift tasting pairs.
 * Enforces business rules:
 * - Both must be of type 'cata'
 * - Non-empty and distinct IDs
 * - Non-empty and identical tastingGroupId
 * - Non-empty start dates and start times
 * - Cannot have exact same date AND same time
 * - Allowed to have same time if dates are different
 * - Positive capacity (totalSpots > 0)
 */
export function validateTwoShiftCataPair(shift1: CataActivity, shift2: CataActivity): TwoShiftValidationResult {
  if (!shift1 || !shift2) {
    return { valid: false, error: 'Ambos turnos de la cata son obligatorios.' };
  }

  if (shift1.type !== 'cata' || shift2.type !== 'cata') {
    return { valid: false, error: 'Ambas actividades deben ser de tipo cata.' };
  }

  const id1 = shift1.id?.trim();
  const id2 = shift2.id?.trim();
  if (!id1 || !id2) {
    return { valid: false, error: 'Los identificadores de ambos turnos son obligatorios.' };
  }

  if (id1 === id2) {
    return { valid: false, error: 'Los identificadores de ambos turnos no pueden ser iguales.' };
  }

  const group1 = shift1.tastingGroupId?.trim();
  const group2 = shift2.tastingGroupId?.trim();
  if (!group1 || !group2) {
    return { valid: false, error: 'El identificador de grupo (tastingGroupId) es obligatorio y no puede estar vacío.' };
  }

  if (group1 !== group2) {
    return { valid: false, error: 'Ambos turnos deben pertenecer al mismo grupo de cata (tastingGroupId idéntico).' };
  }

  const date1 = shift1.date?.trim();
  const date2 = shift2.date?.trim();
  if (!date1 || !date2) {
    return { valid: false, error: 'La fecha de inicio de ambos turnos es obligatoria.' };
  }

  const time1 = shift1.time?.trim();
  const time2 = shift2.time?.trim();
  if (!time1 || !time2) {
    return { valid: false, error: 'La hora de inicio de ambos turnos es obligatoria.' };
  }

  if (date1 === date2 && time1 === time2) {
    return { valid: false, error: 'Los dos turnos no pueden coincidir exactamente en la misma fecha y a la misma hora.' };
  }

  if (
    typeof shift1.totalSpots !== 'number' || 
    isNaN(shift1.totalSpots) || 
    shift1.totalSpots <= 0 || 
    typeof shift2.totalSpots !== 'number' || 
    isNaN(shift2.totalSpots) || 
    shift2.totalSpots <= 0
  ) {
    return { valid: false, error: 'El aforo de cada turno debe ser un número positivo mayor que 0.' };
  }

  return { valid: true };
}

/**
 * Persist a two-shift tasting pair atomically in Firestore using a single writeBatch.
 * If validation fails or the batch commit fails, no activity document is saved and the promise rejects.
 * Optional batchCommitOverride allows injecting failures in automated test runners.
 */
export async function saveTwoShiftCataFirestore(
  shift1: CataActivity,
  shift2: CataActivity,
  batchCommitOverride?: (batch: WriteBatch) => Promise<void>
): Promise<void> {
  const validation = validateTwoShiftCataPair(shift1, shift2);
  if (!validation.valid) {
    throw new Error(validation.error || 'Validación de pareja de turnos fallida.');
  }

  if (!db) {
    throw new Error('Firestore is not initialized');
  }

  const ref1 = doc(db, ACTIVITIES_COLLECTION, shift1.id);
  const ref2 = doc(db, ACTIVITIES_COLLECTION, shift2.id);

  const [snap1, snap2] = await Promise.all([getDoc(ref1), getDoc(ref2)]);
  if (snap1.exists()) {
    const current1 = snap1.data() as Activity;
    if (current1.status === 'celebrada' && shift1.status !== 'celebrada') {
      throw new Error('Una actividad celebrada no puede ser reabierta como próxima.');
    }
    if (current1.status !== 'celebrada' && shift1.status === 'celebrada') {
      throw new Error('El cierre a estado celebrada solo puede realizarse a través del cierre central transaccional (closeActivityAsCelebrated).');
    }
  }
  if (snap2.exists()) {
    const current2 = snap2.data() as Activity;
    if (current2.status === 'celebrada' && shift2.status !== 'celebrada') {
      throw new Error('Una actividad celebrada no puede ser reabierta como próxima.');
    }
    if (current2.status !== 'celebrada' && shift2.status === 'celebrada') {
      throw new Error('El cierre a estado celebrada solo puede realizarse a través del cierre central transaccional (closeActivityAsCelebrated).');
    }
  }

  const cleanData1 = sanitizeForFirestore(shift1);
  const cleanData2 = sanitizeForFirestore(shift2);

  const batch = writeBatch(db);
  batch.set(ref1, cleanData1);
  batch.set(ref2, cleanData2);

  if (batchCommitOverride) {
    await batchCommitOverride(batch);
  } else {
    await batch.commit();
  }
}
