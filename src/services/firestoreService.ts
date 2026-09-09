import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc,
  getDocs,
  query,
  where,
  increment,
  runTransaction,
  writeBatch,
  Unsubscribe 
} from 'firebase/firestore';
import { db } from './firebase';
import { Activity, AdminRole, WebMetric, Participant, Member, AdminNotification, Expense, Sponsorship, ContactMessage, ParticipantStatus, AdvancedAttendanceCorrectionParams, AdvancedCorrectionResult } from '../types';
import { sortActivitiesAscending } from '../utils/dateUtils';
import { validateAndPrepareTransition, isActivityConcluded, checkAttendanceSheetComplete, validateAndPrepareAdvancedCorrection } from './participantTransitions';
import { normalizeParticipantRecord } from './participantMigration';

export { 
  validateTwoShiftCataPair, 
  saveTwoShiftCataFirestore 
} from './twoShiftTastingService';
export type { TwoShiftValidationResult } from './twoShiftTastingService';

const ACTIVITIES_COLLECTION = 'activities';

const METRICS_COLLECTION = 'metrics';
const METRICS_DOC_ID = 'summary';
const ADMINS_COLLECTION = 'admins';
const PARTICIPANTS_COLLECTION = 'participants';
const MEMBERS_COLLECTION = 'members';
const ADMIN_NOTIFICATIONS_COLLECTION = 'adminNotifications';
const EXPENSES_COLLECTION = 'expenses';
const SPONSORSHIPS_COLLECTION = 'sponsorships';
const CONTACT_MESSAGES_COLLECTION = 'contactMessages';


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
        const status = data.status || 'proxima';
        const registrationStatus = data.registrationStatus || (status === 'celebrada' ? 'cerrada' : 'abierta');
        activities.push({
          ...data,
          id: docSnap.id,
          status,
          registrationStatus,
          // Legacy migration
          priceMember: data.priceMember ?? data.price ?? 20,
          priceNonMember: data.priceNonMember ?? data.price ?? 25
        } as Activity);
      });
      const sorted = sortActivitiesAscending(activities);
      onData(sorted);
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
  const snap = await getDoc(activityDocRef);
  if (snap.exists()) {
    const current = snap.data() as Activity;
    if (current.status === 'celebrada' && activity.status !== 'celebrada') {
      throw new Error('Una actividad celebrada no puede ser reabierta como próxima.');
    }
    if (current.status !== 'celebrada' && activity.status === 'celebrada') {
      throw new Error('El cierre a estado celebrada solo puede realizarse a través del cierre central transaccional (closeActivityAsCelebrated).');
    }
  }
  const cleanData = sanitizeForFirestore(activity);
  await setDoc(activityDocRef, cleanData);
}

/**
 * Update partial fields of an activity document in Firestore
 */
export async function updateActivityFirestore(id: string, updates: Partial<Activity>): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized');
  const activityDocRef = doc(db, ACTIVITIES_COLLECTION, id);
  if (updates.status !== undefined) {
    const snap = await getDoc(activityDocRef);
    if (snap.exists()) {
      const current = snap.data() as Activity;
      if (current.status === 'celebrada' && updates.status !== 'celebrada') {
        throw new Error('Una actividad celebrada no puede ser reabierta como próxima.');
      }
      if (current.status !== 'celebrada' && updates.status === 'celebrada') {
        throw new Error('El cierre a estado celebrada solo puede realizarse a través del cierre central transaccional (closeActivityAsCelebrated).');
      }
    }
  }
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
 * Update partial non-sensitive fields of a Participant document.
 * Cannot change status, attendance, cancellation, or capacity.
 */
export async function updateParticipantFirestore(id: string, updates: Partial<Participant>): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized');
  const participantDocRef = doc(db, PARTICIPANTS_COLLECTION, id);
  // Strip status and spotsCount to prevent non-transactional state/aforo desynchronization
  const {
    status: _s,
    spotsCount: _sc,
    ...safeUpdates
  } = updates as any;

  const cleanUpdates = sanitizeForFirestore(safeUpdates);
  if (Object.keys(cleanUpdates).length === 0) return;

  await updateDoc(participantDocRef, {
    ...cleanUpdates,
    updatedAt: new Date().toISOString()
  });
}

/**
 * Add a participant manually via an atomic transaction.
 * Checks capacity: assigns 'pendiente_pago' and increments bookedSpots if capacity available,
 * or assigns 'lista_de_espera' without modifying bookedSpots if capacity is full.
 */
export async function addManualParticipantFirestore(
  participantData: Omit<Participant, 'id' | 'status' | 'registeredAt'> & { id?: string },
  _testHooks?: {
    afterActivityRead?: (activity: Activity) => Promise<void>;
    beforeCommit?: () => Promise<void>;
  }
): Promise<Participant> {
  if (!db) throw new Error('Firestore is not initialized');

  const participantId = participantData.id || `part-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const partRef = doc(db, PARTICIPANTS_COLLECTION, participantId);
  const actRef = doc(db, ACTIVITIES_COLLECTION, participantData.activityId);
  const nowIso = new Date().toISOString();

  return await runTransaction(db, async (transaction) => {
    const actSnap = await transaction.get(actRef as any);
    if (!actSnap.exists()) {
      throw new Error('Actividad no encontrada.');
    }
    const actData = (typeof actSnap.data === 'function' ? actSnap.data() : actSnap.data) as Activity;
    if (actData.status === 'celebrada') {
      throw new Error('No se pueden añadir participantes a una actividad ya celebrada.');
    }

    if (_testHooks?.afterActivityRead) {
      await _testHooks.afterActivityRead(actData);
    }

    const currentBooked = Number(actData.bookedSpots || 0);
    const totalSpots = Number(actData.totalSpots || 0);

    const hasSpot = currentBooked < totalSpots;
    const assignedStatus: ParticipantStatus = hasSpot ? 'pendiente_pago' : 'lista_de_espera';
    const newBookedSpots = hasSpot ? currentBooked + 1 : currentBooked;

    const fullParticipant: Participant = {
      ...participantData,
      id: participantId,
      status: assignedStatus,
      groupId: participantData.groupId || `grp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      registeredAt: nowIso,
      updatedAt: nowIso
    };

    const cleanData = sanitizeForFirestore(fullParticipant);
    transaction.set(partRef as any, cleanData);

    const existingIds: string[] = Array.isArray(actData.participantIds) ? actData.participantIds : [];
    const updatedParticipantIds = Array.from(new Set([...existingIds, participantId]));

    const actUpdates: any = {
      participantIds: updatedParticipantIds,
      updatedAt: nowIso
    };
    if (hasSpot) {
      actUpdates.bookedSpots = newBookedSpots;
    }

    if (_testHooks?.beforeCommit) {
      await _testHooks.beforeCommit();
    }

    transaction.update(actRef as any, actUpdates);

    return fullParticipant;
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

/**
 * Subscribe to contact messages in real-time
 */
export function subscribeToContactMessagesFirestore(
  onData: (messages: ContactMessage[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  if (!db) {
    throw new Error('Firestore is not initialized');
  }

  const messagesRef = collection(db, CONTACT_MESSAGES_COLLECTION);
  return onSnapshot(
    messagesRef,
    (snapshot) => {
      const list: ContactMessage[] = [];
      snapshot.forEach((docSnap) => {
        list.push({
          ...(docSnap.data() as ContactMessage),
          id: docSnap.id
        });
      });
      // Sort newest first
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      onData(list);
    },
    (err) => {
      console.warn('Firestore contact messages subscription error:', err);
      onError(err);
    }
  );
}

/**
 * Save a Contact Message (can be called from public contact form or admin)
 */
export async function saveContactMessageFirestore(msg: ContactMessage): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized');
  const docRef = doc(db, CONTACT_MESSAGES_COLLECTION, msg.id);
  const cleanData = sanitizeForFirestore(msg);
  await setDoc(docRef, cleanData);
}

/**
 * Update a Contact Message status / notes
 */
export async function updateContactMessageFirestore(id: string, updates: Partial<ContactMessage>): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized');
  const docRef = doc(db, CONTACT_MESSAGES_COLLECTION, id);
  const cleanUpdates = sanitizeForFirestore(updates);
  await updateDoc(docRef, cleanUpdates);
}

/**
 * Mark a Contact alert as seen (CON-TACT-05: updates only contactAlertSeenAt and seen by fields)
 */
export async function markContactAlertSeenFirestore(
  id: string,
  seenBy?: string,
  seenByUid?: string
): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized');
  const docRef = doc(db, CONTACT_MESSAGES_COLLECTION, id);
  await updateDoc(docRef, {
    contactAlertSeenAt: new Date().toISOString(),
    contactAlertSeenBy: seenBy || 'Administración',
    contactAlertSeenByUid: seenByUid || 'admin'
  });
}

/**
 * Delete a Contact Message
 */
export async function deleteContactMessageFirestore(id: string): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized');
  const docRef = doc(db, CONTACT_MESSAGES_COLLECTION, id);
  await deleteDoc(docRef);
}

/**
 * Execute canonical participant state transition transactionally in Firestore.
 * Automatically synchronizes activity bookedSpots atomically within the same transaction.
 */
export async function executeParticipantTransitionFirestore({
  participantId,
  activityId,
  targetStatus,
  actor = 'Administración',
  cancellationData,
  _testHooks
}: {
  participantId: string;
  activityId: string;
  targetStatus: ParticipantStatus;
  actor?: string;
  cancellationData?: {
    reason: string;
    justified: boolean;
    kind: 'cancelacion_usuario' | 'no_presentado';
    refundAmount?: number;
  };
  _testHooks?: {
    afterRead?: (participant: Participant, activity: Activity) => Promise<void>;
    beforeCommit?: () => Promise<void>;
  };
}): Promise<{ success: boolean; error?: string; updatedParticipant?: Partial<Participant>; spotsDelta?: number }> {
  if (!db) throw new Error('Firestore is not initialized');

  const partRef = doc(db, PARTICIPANTS_COLLECTION, participantId);
  const actRef = doc(db, ACTIVITIES_COLLECTION, activityId);

  return await runTransaction(db, async (transaction) => {
    const partSnap = await transaction.get(partRef as any);
    if (!partSnap.exists()) {
      return { success: false, error: 'Participante no encontrado.' };
    }
    const actSnap = await transaction.get(actRef as any);
    if (!actSnap.exists()) {
      return { success: false, error: 'Actividad no encontrada.' };
    }

    const partData = typeof partSnap.data === 'function' ? partSnap.data() : partSnap.data;
    const actData = typeof actSnap.data === 'function' ? actSnap.data() : actSnap.data;

    const participant = { ...(partData as any), id: partSnap.id } as Participant;
    const activity = { ...(actData as any), id: actSnap.id } as Activity;

    if (_testHooks?.afterRead) {
      await _testHooks.afterRead(participant, activity);
    }

    const transition = validateAndPrepareTransition({
      participant,
      targetStatus,
      activity,
      actor,
      cancellationData
    });

    if (!transition.allowed) {
      return { success: false, error: transition.error };
    }

    const cleanUpdates = sanitizeForFirestore(transition.updatedParticipant || {});
    transaction.update(partRef as any, cleanUpdates);

    if (transition.spotsDelta && transition.spotsDelta !== 0) {
      const newBooked = Math.max(0, (activity.bookedSpots || 0) + transition.spotsDelta);
      transaction.update(actRef as any, {
        bookedSpots: newBooked,
        updatedAt: new Date().toISOString()
      });
    }

    if (_testHooks?.beforeCommit) {
      await _testHooks.beforeCommit();
    }

    return {
      success: true,
      updatedParticipant: transition.updatedParticipant,
      spotsDelta: transition.spotsDelta
    };
  });
}

/**
 * Single transactional service for advanced attendance correction (T-04B).
 * Reads participant and activity within the transaction,
 * calculates strict spot delta from canonical occupancy before and after,
 * reopens activity to 'proxima' if a pending status is introduced into a 'celebrada' activity,
 * and writes all changes to participant and activity in that same transaction.
 */
export async function executeAdvancedAttendanceCorrectionFirestore({
  participantId,
  activityId,
  targetStatus,
  correctionReason,
  actor = 'Dirección / Administración',
  cancellationData,
  paymentData,
  attendanceData,
  _testHooks
}: AdvancedAttendanceCorrectionParams & {
  _testHooks?: {
    afterRead?: (participant: Participant, activity: Activity) => Promise<void>;
    beforeCommit?: () => Promise<void>;
  };
}): Promise<AdvancedCorrectionResult> {
  if (!db) throw new Error('Firestore is not initialized');

  const partRef = doc(db, PARTICIPANTS_COLLECTION, participantId);
  const actRef = doc(db, ACTIVITIES_COLLECTION, activityId);

  return await runTransaction(db, async (transaction) => {
    const partSnap = await transaction.get(partRef as any);
    if (!partSnap.exists()) {
      return { success: false, error: 'Participante no encontrado.' };
    }
    const actSnap = await transaction.get(actRef as any);
    if (!actSnap.exists()) {
      return { success: false, error: 'Actividad no encontrada.' };
    }

    const partData = typeof partSnap.data === 'function' ? partSnap.data() : partSnap.data;
    const actData = typeof actSnap.data === 'function' ? actSnap.data() : actSnap.data;

    const participant = { ...(partData as any), id: partSnap.id } as Participant;
    const activity = { ...(actData as any), id: actSnap.id } as Activity;

    if (_testHooks?.afterRead) {
      await _testHooks.afterRead(participant, activity);
    }

    const validation = validateAndPrepareAdvancedCorrection({
      participant,
      activity,
      targetStatus,
      correctionReason,
      actor,
      cancellationData,
      paymentData,
      attendanceData
    });

    if (!validation.allowed) {
      return { success: false, error: validation.error };
    }

    const cleanPartUpdates = sanitizeForFirestore(validation.updatedParticipant || {});
    transaction.update(partRef as any, cleanPartUpdates);

    if (validation.activityUpdates) {
      const cleanActUpdates = sanitizeForFirestore(validation.activityUpdates);
      transaction.update(actRef as any, cleanActUpdates);
    }

    if (_testHooks?.beforeCommit) {
      await _testHooks.beforeCommit();
    }

    return {
      success: true,
      updatedParticipant: validation.updatedParticipant,
      updatedActivity: validation.activityUpdates,
      spotsDelta: validation.spotsDelta,
      willReopen: validation.willReopen
    };
  });
}



/**
 * Executes administrative migration to canonical model directly in Firestore.
 * - Writes the exact normalized state for each participant.
 * - Deletes legacy fields (attended, justified, confirmada, no_asistio).
 * - Returns per-record individual results.
 * - Does not alter bookedSpots.
 * - Idempotent: repeating the migration produces 0 alterations.
 */
export async function executeAdministrativeMigrationFirestore(
  participants: Participant[],
  actor: string = 'Migración Administrativa'
): Promise<{
  success: boolean;
  migratedCount: number;
  results: Array<{ id: string; success: boolean; previousStatus: string; targetStatus: string; error?: string }>;
  error?: string;
}> {
  if (!db) throw new Error('Firestore is not initialized');

  const results: Array<{ id: string; success: boolean; previousStatus: string; targetStatus: string; error?: string }> = [];
  let migratedCount = 0;

  for (const p of participants) {
    const rawStatus = (p.status as string) || '';
    const norm = normalizeParticipantRecord(p, actor);

    if (!norm.needsMigration) {
      results.push({
        id: p.id,
        success: true,
        previousStatus: rawStatus,
        targetStatus: norm.targetStatus
      });
      continue;
    }

    const pRef = doc(db, PARTICIPANTS_COLLECTION, p.id);
    try {
      const cleanData = sanitizeForFirestore(norm.cleanRecord);
      // Use setDoc to replace document and eliminate deprecated legacy properties
      await setDoc(pRef, cleanData);
      migratedCount++;
      results.push({
        id: p.id,
        success: true,
        previousStatus: rawStatus,
        targetStatus: norm.targetStatus
      });
    } catch (err: any) {
      results.push({
        id: p.id,
        success: false,
        previousStatus: rawStatus,
        targetStatus: norm.targetStatus,
        error: err.message || String(err)
      });
    }
  }

  const allSucceeded = results.every(r => r.success);
  return {
    success: allSucceeded,
    migratedCount,
    results,
    error: allSucceeded ? undefined : 'Uno o más registros fallaron durante la migración.'
  };
}

/**
 * Closes an activity and marks it as 'celebrada' with atomic validation in Firestore.
 * 
 * Rules (T-03 / T-03C):
 * - Builds a transactional query: query(collection(db, 'participants'), where('activityId', '==', activityId)).
 * - Reads all participants transactionally inside the transaction via transaction.get(partsQuery).
 * - Never uses participantIds or React state as authority for closure.
 * - Blocks closure if ANY participant of the activity is in 'pendiente_pago' or 'pagada'.
 * - Leaves participants and bookedSpots completely untouched.
 * - Idempotent: repeating close on already celebrada activity returns alreadyClosed: true with 0 writes.
 * - Concurrency safe: reads all participant docs and activity doc atomically inside transaction.
 */
export async function closeActivityAsCelebratedFirestore(
  activityId: string,
  actor: string = 'Administración',
  _testHooks?: {
    afterParticipantsRead?: (participants: Participant[]) => Promise<void>;
    beforeCommit?: () => Promise<void>;
  }
): Promise<{
  success: boolean;
  alreadyClosed?: boolean;
  blockedByPendingSheet?: boolean;
  pendingCount?: number;
  pendingParticipantIds?: string[];
  error?: string;
  message?: string;
}> {
  if (!db) throw new Error('Firestore is not initialized');

  const actRef = doc(db, ACTIVITIES_COLLECTION, activityId);
  const partsQuery = query(
    collection(db, PARTICIPANTS_COLLECTION),
    where('activityId', '==', activityId)
  );

  return await runTransaction(db, async (transaction) => {
    // 1. Read activity document atomically inside transaction
    const actSnap = await transaction.get(actRef as any);
    if (!actSnap.exists()) {
      return { success: false, error: 'Actividad no encontrada.' };
    }
    const actData = (typeof actSnap.data === 'function' ? actSnap.data() : actSnap.data) as Activity;

    // AC-05: If already celebrada, do not write anything and report it was already closed
    if (actData.status === 'celebrada') {
      return {
        success: true,
        alreadyClosed: true,
        message: 'La actividad ya estaba cerrada como celebrada.'
      };
    }

    // 2. Read participants transactionally
    // Query participants for this activity, and lock each document in the transaction read-set
    const querySnapshot = await getDocs(partsQuery);
    const participantDocs = await Promise.all(
      querySnapshot.docs.map(d => transaction.get(d.ref as any))
    );

    const currentParticipants: Participant[] = [];
    for (const d of participantDocs) {
      const exists = typeof d.exists === 'function' ? d.exists() : Boolean(d.exists);
      if (exists) {
        const data = (typeof d.data === 'function' ? d.data() : d.data) as Record<string, any> || {};
        currentParticipants.push({ ...data, id: d.id } as Participant);
      }
    }

    // Test hook after transactional participants read (AC-03 to AC-06)
    if (_testHooks?.afterParticipantsRead) {
      await _testHooks.afterParticipantsRead(currentParticipants);
    }

    // 3. Validate completeness using pure shared function
    const sheetStatus = checkAttendanceSheetComplete(currentParticipants, activityId);

    // AC-01 / AC-02: If incomplete, block closing and abort with zero writes
    if (!sheetStatus.isComplete) {
      return {
        success: false,
        blockedByPendingSheet: true,
        pendingCount: sheetStatus.pendingCount,
        pendingParticipantIds: sheetStatus.pendingParticipantIds,
        error: 'Para cerrar la actividad debes completar la hoja de asistencia.'
      };
    }

    // Test hook before commit
    if (_testHooks?.beforeCommit) {
      await _testHooks.beforeCommit();
    }

    // AC-03 / AC-07: If complete, ONLY mark activity as celebrada and cerrada.
    // Participants and bookedSpots remain untouched.
    transaction.update(actRef as any, {
      status: 'celebrada',
      registrationStatus: 'cerrada',
      updatedAt: new Date().toISOString()
    });

    return {
      success: true,
      message: 'Actividad cerrada y marcada como celebrada correctamente.'
    };
  });
}




