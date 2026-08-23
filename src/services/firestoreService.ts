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
import { Activity, AdminRole, WebMetric } from '../types';

const ACTIVITIES_COLLECTION = 'activities';
const METRICS_COLLECTION = 'metrics';
const METRICS_DOC_ID = 'summary';
const ADMINS_COLLECTION = 'admins';

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
  await setDoc(activityDocRef, activity);
}

/**
 * Update partial fields of an activity document in Firestore
 */
export async function updateActivityFirestore(id: string, updates: Partial<Activity>): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized');
  const activityDocRef = doc(db, ACTIVITIES_COLLECTION, id);
  await updateDoc(activityDocRef, {
    ...updates,
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
