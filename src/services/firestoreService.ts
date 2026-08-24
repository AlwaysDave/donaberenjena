import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc,
  increment,
  Unsubscribe 
} from 'firebase/firestore';
import { db } from './firebase';
import { Activity, AdminRole, WebMetric, Participant } from '../types';

const ACTIVITIES_COLLECTION = 'activities';
const METRICS_COLLECTION = 'metrics';
const METRICS_DOC_ID = 'summary';
const ADMINS_COLLECTION = 'admins';
const PARTICIPANTS_COLLECTION = 'participants';

/**
 * Deep sanitization helper that recursively removes undefined fields and cleans arrays,
 * preventing Firestore "Unsupported field value: undefined" errors.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as any;
  }
  if (typeof data === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned;
  }
  return data;
}

/**
 * Fetch role of an authenticated user from Firestore `admins/{uid}`
 */
export async function fetchAdminRole(uid: string): Promise<{ role: AdminRole; name?: string } | null> {
  if (!db) return null;
  try {
    const adminDocRef = doc(db, ADMINS_COLLECTION, uid);
    const snap = await getDoc(adminDocRef);
    if (!snap.exists()) {
      return null;
    }
    const data = snap.data();
    const role: AdminRole = data.role === 'simple' ? 'simple' : 'advanced';
    return {
      role,
      name: data.name || ''
    };
  } catch (err) {
    console.error('Error fetching admin role from Firestore:', err);
    throw err;
  }
}

/**
 * Subscribe to the unified `activities` collection in real-time
 */
export function subscribeToActivitiesFirestore(
  onData: (activities: Activity[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  if (!db) {
    throw new Error('Firestore is not initialized');
  }

  const activitiesRef = collection(db, ACTIVITIES_COLLECTION);
  return onSnapshot(
    activitiesRef,
    (snapshot) => {
      const activities: Activity[] = [];
      snapshot.forEach((docSnap) => {
        activities.push({
          ...(docSnap.data() as Activity),
          id: docSnap.id
        });
      });
      onData(activities);
    },
    (err) => {
      console.warn('Firestore activities subscription error:', err);
      onError(err);
    }
  );
}

/**
 * Subscribe to `metrics/summary` document in real-time
 */
export function subscribeToMetricsFirestore(
  onData: (metrics: WebMetric) => void,
  onError: (error: Error) => void
): Unsubscribe {
  if (!db) {
    throw new Error('Firestore is not initialized');
  }

  const metricsDocRef = doc(db, METRICS_COLLECTION, METRICS_DOC_ID);
  return onSnapshot(
    metricsDocRef,
    (docSnap) => {
      if (docSnap.exists()) {
        onData(docSnap.data() as WebMetric);
      }
    },
    (err) => {
      console.warn('Firestore metrics subscription error:', err);
      onError(err);
    }
  );
}

/**
 * Add or overwrite an activity document in Firestore
 */
export async function saveActivityFirestore(activity: Activity): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized');
  const activityDocRef = doc(db, ACTIVITIES_COLLECTION, activity.id);
  const cleanData = sanitizeForFirestore(activity);
  await setDoc(activityDocRef, cleanData);
}

/**
 * Update partial fields of an activity document in Firestore
 */
export async function updateActivityFirestore(id: string, updates: Partial<Activity>): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized');
  const activityDocRef = doc(db, ACTIVITIES_COLLECTION, id);
  const cleanUpdates = sanitizeForFirestore(updates);
  await updateDoc(activityDocRef, {
    ...cleanUpdates,
    updatedAt: new Date().toISOString().split('T')[0]
  });
}

/**
 * Delete an activity document from Firestore
 */
export async function deleteActivityFirestore(id: string): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized');
  const activityDocRef = doc(db, ACTIVITIES_COLLECTION, id);
  await deleteDoc(activityDocRef);
}

/**
 * Atomic reservation increment for public visitors
 */
export async function reserveSpotsFirestore(id: string, spotsCount: number): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized');
  const activityDocRef = doc(db, ACTIVITIES_COLLECTION, id);
  await updateDoc(activityDocRef, {
    bookedSpots: increment(spotsCount),
    updatedAt: new Date().toISOString().split('T')[0]
  });
}

/**
 * Subscribe to the `participants` collection in real-time
 */
export function subscribeToParticipantsFirestore(
  onData: (participants: Participant[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  if (!db) {
    throw new Error('Firestore is not initialized');
  }

  const participantsRef = collection(db, PARTICIPANTS_COLLECTION);
  return onSnapshot(
    participantsRef,
    (snapshot) => {
      const list: Participant[] = [];
      snapshot.forEach((docSnap) => {
        list.push({
          ...(docSnap.data() as Participant),
          id: docSnap.id
        });
      });
      // Sort newest first
      list.sort((a, b) => new Date(b.registeredAt || 0).getTime() - new Date(a.registeredAt || 0).getTime());
      onData(list);
    },
    (err) => {
      console.warn('Firestore participants subscription error:', err);
      onError(err);
    }
  );
}

/**
 * Save or create a Participant document
 */
export async function saveParticipantFirestore(participant: Participant): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized');
  const participantDocRef = doc(db, PARTICIPANTS_COLLECTION, participant.id);
  const cleanData = sanitizeForFirestore(participant);
  await setDoc(participantDocRef, cleanData);
}

/**
 * Update partial fields of a Participant document
 */
export async function updateParticipantFirestore(id: string, updates: Partial<Participant>): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized');
  const participantDocRef = doc(db, PARTICIPANTS_COLLECTION, id);
  const cleanUpdates = sanitizeForFirestore(updates);
  await updateDoc(participantDocRef, {
    ...cleanUpdates,
    updatedAt: new Date().toISOString()
  });
}

/**
 * Delete a Participant document
 */
export async function deleteParticipantFirestore(id: string): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized');
  const participantDocRef = doc(db, PARTICIPANTS_COLLECTION, id);
  await deleteDoc(participantDocRef);
}

/**
 * Atomic reservation creation with Participant record + spot update
 */
export async function createReservationWithParticipantFirestore(
  participant: Participant,
  spotsCount: number
): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized');
  
  // 1. Save participant
  const participantDocRef = doc(db, PARTICIPANTS_COLLECTION, participant.id);
  const cleanData = sanitizeForFirestore(participant);
  await setDoc(participantDocRef, cleanData);

  // 2. Increment spots on activity if valid
  if (participant.activityId) {
    const activityDocRef = doc(db, ACTIVITIES_COLLECTION, participant.activityId);
    try {
      await updateDoc(activityDocRef, {
        bookedSpots: increment(spotsCount),
        updatedAt: new Date().toISOString().split('T')[0]
      });
    } catch (actErr) {
      console.warn('Could not increment activity spots directly:', actErr);
    }
  }
}

/**
 * Adjust activity spots when participant spots change or are cancelled
 */
export async function adjustActivitySpotsFirestore(
  activityId: string,
  spotsDelta: number
): Promise<void> {
  if (!db || !activityId) return;
  const activityDocRef = doc(db, ACTIVITIES_COLLECTION, activityId);
  try {
    await updateDoc(activityDocRef, {
      bookedSpots: increment(spotsDelta),
      updatedAt: new Date().toISOString().split('T')[0]
    });
  } catch (err) {
    console.warn('Error adjusting activity spots:', err);
  }
}
