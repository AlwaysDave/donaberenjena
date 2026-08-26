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
import { Activity, AdminRole, WebMetric, Participant, Member, AdminNotification, Expense, Sponsorship } from '../types';

const ACTIVITIES_COLLECTION = 'activities';
const METRICS_COLLECTION = 'metrics';
const METRICS_DOC_ID = 'summary';
const ADMINS_COLLECTION = 'admins';
const PARTICIPANTS_COLLECTION = 'participants';
const MEMBERS_COLLECTION = 'members';
const ADMIN_NOTIFICATIONS_COLLECTION = 'adminNotifications';
const EXPENSES_COLLECTION = 'expenses';
const SPONSORSHIPS_COLLECTION = 'sponsorships';


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
        const data = docSnap.data();
        activities.push({
          ...data,
          id: docSnap.id,
          // Legacy migration
          priceMember: data.priceMember ?? data.price ?? 20,
          priceNonMember: data.priceNonMember ?? data.price ?? 25
        } as Activity);
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
 * Atomic reservation creation with multiple individual Participant records + spot update
 */
export async function createReservationWithParticipantsFirestore(
  attendees: Participant[],
  activityId: string
): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized');
  if (!attendees || attendees.length === 0) return;

  // 1. Save each participant document (all sharing the same groupId)
  for (const attendee of attendees) {
    const participantDocRef = doc(db, PARTICIPANTS_COLLECTION, attendee.id);
    const cleanData = sanitizeForFirestore(attendee);
    await setDoc(participantDocRef, cleanData);
  }

  // 2. Increment spots on activity if valid
  if (activityId) {
    const activityDocRef = doc(db, ACTIVITIES_COLLECTION, activityId);
    try {
      await updateDoc(activityDocRef, {
        bookedSpots: increment(attendees.length),
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

// =========================================================================
// MEMBERS CRUD FUNCTIONS
// =========================================================================

/**
 * Subscribe to the `members` collection in real-time
 */
export function subscribeToMembersFirestore(
  onData: (members: Member[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  if (!db) {
    throw new Error('Firestore is not initialized');
  }

  const membersRef = collection(db, MEMBERS_COLLECTION);
  return onSnapshot(
    membersRef,
    (snapshot) => {
      const list: Member[] = [];
      snapshot.forEach((docSnap) => {
        list.push({
          ...(docSnap.data() as Member),
          id: docSnap.id
        });
      });
      list.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
      onData(list);
    },
    (err) => {
      console.warn('Firestore members subscription error:', err);
      onError(err);
    }
  );
}

/**
 * Save or create a Member document
 */
export async function saveMemberFirestore(member: Member): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized');
  const memberDocRef = doc(db, MEMBERS_COLLECTION, member.id);
  const cleanData = sanitizeForFirestore(member);
  await setDoc(memberDocRef, cleanData);
}

/**
 * Update partial fields of a Member document
 */
export async function updateMemberFirestore(id: string, updates: Partial<Member>): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized');
  const memberDocRef = doc(db, MEMBERS_COLLECTION, id);
  const cleanUpdates = sanitizeForFirestore(updates);
  await updateDoc(memberDocRef, {
    ...cleanUpdates,
    updatedAt: new Date().toISOString()
  });
}

/**
 * Delete a Member document
 */
export async function deleteMemberFirestore(id: string): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized');
  const memberDocRef = doc(db, MEMBERS_COLLECTION, id);
  await deleteDoc(memberDocRef);
}

// =========================================================================
// ADMIN NOTIFICATIONS CRUD FUNCTIONS
// =========================================================================

/**
 * Subscribe to the `adminNotifications` collection in real-time
 */
export function subscribeToAdminNotificationsFirestore(
  onData: (notifications: AdminNotification[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  if (!db) {
    throw new Error('Firestore is not initialized');
  }

  const notifsRef = collection(db, ADMIN_NOTIFICATIONS_COLLECTION);
  return onSnapshot(
    notifsRef,
    (snapshot) => {
      const list: AdminNotification[] = [];
      snapshot.forEach((docSnap) => {
        list.push({
          ...(docSnap.data() as AdminNotification),
          id: docSnap.id
        });
      });
      // Sort newest first
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      onData(list);
    },
    (err) => {
      console.warn('Firestore adminNotifications subscription error:', err);
      onError(err);
    }
  );
}

/**
 * Save an Admin Notification
 */
export async function saveAdminNotificationFirestore(notification: AdminNotification): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized');
  const notifDocRef = doc(db, ADMIN_NOTIFICATIONS_COLLECTION, notification.id);
  const cleanData = sanitizeForFirestore(notification);
  await setDoc(notifDocRef, cleanData);
}

/**
 * Mark an Admin Notification as read
 */
export async function markAdminNotificationReadFirestore(id: string): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized');
  const notifDocRef = doc(db, ADMIN_NOTIFICATIONS_COLLECTION, id);
  await updateDoc(notifDocRef, {
    read: true
  });
}

/**
 * Delete an Admin Notification
 */
export async function deleteAdminNotificationFirestore(id: string): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized');
  const notifDocRef = doc(db, ADMIN_NOTIFICATIONS_COLLECTION, id);
  await deleteDoc(notifDocRef);
}

/**
 * Subscribe to the `expenses` collection in real-time
 */
export function subscribeToExpensesFirestore(
  onData: (expenses: Expense[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  if (!db) {
    throw new Error('Firestore is not initialized');
  }

  const expensesRef = collection(db, EXPENSES_COLLECTION);
  return onSnapshot(
    expensesRef,
    (snapshot) => {
      const list: Expense[] = [];
      snapshot.forEach((docSnap) => {
        list.push({
          ...(docSnap.data() as Expense),
          id: docSnap.id
        });
      });
      // Sort newest first
      list.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
      onData(list);
    },
    (err) => {
      console.warn('Firestore expenses subscription error:', err);
      onError(err);
    }
  );
}

/**
 * Save an Expense
 */
export async function saveExpenseFirestore(expense: Expense): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized');
  const expenseDocRef = doc(db, EXPENSES_COLLECTION, expense.id);
  const cleanData = sanitizeForFirestore(expense);
  await setDoc(expenseDocRef, cleanData);
}

/**
 * Update an Expense
 */
export async function updateExpenseFirestore(id: string, updates: Partial<Expense>): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized');
  const expenseDocRef = doc(db, EXPENSES_COLLECTION, id);
  const cleanUpdates = sanitizeForFirestore(updates);
  await updateDoc(expenseDocRef, cleanUpdates);
}

/**
 * Delete an Expense
 */
export async function deleteExpenseFirestore(id: string): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized');
  const expenseDocRef = doc(db, EXPENSES_COLLECTION, id);
  await deleteDoc(expenseDocRef);
}

/**
 * Subscribe to the `sponsorships` collection in real-time
 */
export function subscribeToSponsorshipsFirestore(
  onData: (sponsorships: Sponsorship[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  if (!db) {
    throw new Error('Firestore is not initialized');
  }

  const sponsorshipsRef = collection(db, SPONSORSHIPS_COLLECTION);
  return onSnapshot(
    sponsorshipsRef,
    (snapshot) => {
      const list: Sponsorship[] = [];
      snapshot.forEach((docSnap) => {
        list.push({
          ...(docSnap.data() as Sponsorship),
          id: docSnap.id
        });
      });
      // Sort newest first
      list.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
      onData(list);
    },
    (err) => {
      console.warn('Firestore sponsorships subscription error:', err);
      onError(err);
    }
  );
}

/**
 * Save a Sponsorship
 */
export async function saveSponsorshipFirestore(sponsorship: Sponsorship): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized');
  const docRef = doc(db, SPONSORSHIPS_COLLECTION, sponsorship.id);
  const cleanData = sanitizeForFirestore(sponsorship);
  await setDoc(docRef, cleanData);
}

/**
 * Update a Sponsorship
 */
export async function updateSponsorshipFirestore(id: string, updates: Partial<Sponsorship>): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized');
  const docRef = doc(db, SPONSORSHIPS_COLLECTION, id);
  const cleanUpdates = sanitizeForFirestore(updates);
  await updateDoc(docRef, cleanUpdates);
}

/**
 * Delete a Sponsorship
 */
export async function deleteSponsorshipFirestore(id: string): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized');
  const docRef = doc(db, SPONSORSHIPS_COLLECTION, id);
  await deleteDoc(docRef);
}

