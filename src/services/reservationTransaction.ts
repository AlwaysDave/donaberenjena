import type { Participant, ParticipantStatus, ReservationFailureKind, ReservationFormData } from '../types';

export interface ReservationTransactionResult {
  success: boolean;
  status: ParticipantStatus;
  groupId: string;
  createdCount: number;
  bookedSpots: number;
  totalSpots: number;
  message: string;
  participants: Participant[];
  isReplay?: boolean;
}

export interface FirestoreTransactionLike {
  get(docRef: any): Promise<any>;
  set(docRef: any, data: any): any;
  update(docRef: any, data: any): any;
}

export interface ReservationExecutionParams {
  transaction: FirestoreTransactionLike;
  activityRef: any;
  idempotencyRef: any;
  getParticipantRef: (id: string) => any;
  activityId: string;
  requestedSpots: number;
  reservationData: ReservationFormData;
  idempotencyKey: string;
  nowIso?: string;
  idGenerator?: {
    generateGroupId?: () => string;
    generateParticipantId?: (index: number) => string;
  };
  _testHooks?: {
    afterActivityRead?: (activity: any) => Promise<void>;
    beforeCommit?: () => Promise<void>;
  };
}

export interface CryptoProvider {
  randomUUID?: () => string;
  getRandomValues?: <T extends ArrayBufferView | null>(array: T) => T;
}

/**
 * Generates a cryptographically strong UUID (v4) for a reservation attempt.
 * RES-01: Key belongs to a single attempt and is never derived from form data, date/time, or email.
 * Rejects with an error if no secure crypto API is available. Never uses Date.now() or Math.random().
 */
export function generateSecureReservationKey(customCrypto?: CryptoProvider): string {
  const c = customCrypto !== undefined ? customCrypto : (typeof crypto !== 'undefined' ? crypto : undefined);
  
  if (c && typeof c.randomUUID === 'function') {
    return c.randomUUID();
  }
  
  if (c && typeof c.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    c.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  
  throw new Error('ENTORNO_CRIPTO_NO_DISPONIBLE: No se dispone de una API criptográfica segura (crypto.randomUUID o crypto.getRandomValues).');
}

/**
 * Pure helper to initialize or reset a reservation attempt key.
 */
export function createNewReservationAttemptKey(customCrypto?: CryptoProvider): { key: string; error?: string } {
  try {
    const key = generateSecureReservationKey(customCrypto);
    return { key };
  } catch (err: any) {
    return { key: '', error: err?.message || 'ENTORNO_CRIPTO_NO_DISPONIBLE' };
  }
}

export interface ReservationLifecycleTransitionResult {
  nextKey: string | null;
  isCompleted: boolean;
  canResubmit: boolean;
  action: 'completed' | 'retained_for_retry' | 'renewed_for_corrected_attempt' | 'crypto_unavailable';
  errorMessage?: string;
}

/**
 * Pure lifecycle state transition on reservation result.
 * Used by both ReservationBlock and test scripts without duplicating logic.
 */
export function processReservationLifecycleTransition(
  currentKey: string,
  result: { success: boolean; failureKind?: ReservationFailureKind; message?: string },
  customCrypto?: CryptoProvider
): ReservationLifecycleTransitionResult {
  if (result.success) {
    return {
      nextKey: null,
      isCompleted: true,
      canResubmit: false,
      action: 'completed'
    };
  }

  if (result.failureKind === 'retryable') {
    return {
      nextKey: currentKey,
      isCompleted: false,
      canResubmit: true,
      action: 'retained_for_retry'
    };
  }

  // Definitive failure (4xx, validation, etc.): renew key for next corrected submission
  try {
    const nextKey = generateSecureReservationKey(customCrypto);
    return {
      nextKey,
      isCompleted: false,
      canResubmit: true,
      action: 'renewed_for_corrected_attempt'
    };
  } catch (err: any) {
    return {
      nextKey: null,
      isCompleted: false,
      canResubmit: false,
      action: 'crypto_unavailable',
      errorMessage: err?.message || 'ENTORNO_CRIPTO_NO_DISPONIBLE'
    };
  }
}

/**
 * Classifies an HTTP status code or error into 'definitive' or 'retryable'.
 * - 4xx errors (client / validation / business conflict) are definitive: key must be discarded.
 * - 5xx errors or network exceptions are uncertain/retryable: key must be retained.
 */
export function classifyReservationFailure(statusOrError: number | unknown): ReservationFailureKind {
  if (typeof statusOrError === 'number') {
    if (statusOrError >= 400 && statusOrError < 500) {
      return 'definitive';
    }
    return 'retryable';
  }
  return 'retryable';
}

/**
 * Validates the idempotency key format.
 * RES-01: Key belongs strictly to the reservation attempt; cannot be derived from minute, email, etc.
 */
export function validateIdempotencyKey(rawKey: unknown): { valid: boolean; key: string; error?: string } {
  if (typeof rawKey !== 'string') {
    return {
      valid: false,
      key: '',
      error: 'Se requiere una clave de idempotencia válida (cabecera "Idempotency-Key" o campo "idempotencyKey").'
    };
  }

  const trimmed = rawKey.trim();
  if (trimmed.length < 8 || trimmed.length > 200) {
    return {
      valid: false,
      key: '',
      error: 'La clave de idempotencia debe tener entre 8 y 200 caracteres.'
    };
  }

  return { valid: true, key: trimmed };
}

/**
 * Executes an atomic reservation inside a Firestore transaction.
 *
 * Rules:
 * - RES-01: Idempotency key belongs to the attempt.
 * - RES-02: Same key -> same groupId, same participants, single bookedSpots increment.
 * - RES-03: Whole group enters together in spot or waitlist; never split.
 */
export async function executeReservationInTransaction(
  params: ReservationExecutionParams
): Promise<ReservationTransactionResult> {
  const {
    transaction,
    activityRef,
    idempotencyRef,
    getParticipantRef,
    activityId,
    requestedSpots,
    reservationData,
    idempotencyKey,
    nowIso = new Date().toISOString(),
    idGenerator
  } = params;

  // 1. Check if idempotency key was already processed
  const idemDoc = await transaction.get(idempotencyRef);
  const idemExists = typeof (idemDoc as any)?.exists === 'function' ? (idemDoc as any).exists() : Boolean((idemDoc as any)?.exists);
  if (idemExists) {
    const existingData = typeof (idemDoc as any)?.data === 'function' ? (idemDoc as any).data() : (idemDoc as any)?.data;
    if (existingData?.response) {
      return {
        ...(existingData.response as ReservationTransactionResult),
        isReplay: true
      };
    }
  }

  // 2. Read activity document
  const actDoc = await transaction.get(activityRef);
  const actExists = typeof (actDoc as any)?.exists === 'function' ? (actDoc as any).exists() : Boolean((actDoc as any)?.exists);
  if (!actExists) {
    throw new Error('ACTIVIDAD_NO_ENCONTRADA');
  }

  const rawActData = typeof (actDoc as any)?.data === 'function' ? (actDoc as any).data() : (actDoc as any)?.data;
  const actData = rawActData || {};
  if (actData.status === 'celebrada') {
    throw new Error('ACTIVIDAD_CELEBRADA');
  }

  if (actData.registrationStatus === 'cerrada') {
    throw new Error('INSCRIPCIONES_CERRADAS');
  }

  if (params._testHooks?.afterActivityRead) {
    await params._testHooks.afterActivityRead(actData);
  }

  const currentBooked = Number(actData.bookedSpots || 0);
  const totalSpots = Number(actData.totalSpots || 0);
  const available = Math.max(0, totalSpots - currentBooked);

  // Group rule: If enough spots for whole group, all get 'pendiente_pago'.
  // If not enough spots for whole group, all get 'lista_de_espera' without modifying bookedSpots.
  let assignedStatus: ParticipantStatus = 'pendiente_pago';
  let resultingBookedSpots = currentBooked;

  if (requestedSpots <= available) {
    assignedStatus = 'pendiente_pago';
    resultingBookedSpots = currentBooked + requestedSpots;
  } else {
    assignedStatus = 'lista_de_espera';
    resultingBookedSpots = currentBooked;
  }

  const priceMember = Number(actData.priceMember ?? 0);
  const priceNonMember = Number(actData.priceNonMember ?? 0);
  const turnText = reservationData.turn || (actData.time ? `Turno (${actData.time})` : undefined);

  const titularName = (reservationData.fullName || '').trim();
  const titularEmail = (reservationData.email || '').trim();
  const titularPhone = (reservationData.phone || '').trim();

  const groupId = idGenerator?.generateGroupId
    ? idGenerator.generateGroupId()
    : `grp-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

  const createdParticipants: Participant[] = [];

  // 3. Create Titular Participant (Spot 1)
  const isTitularMember = Boolean(reservationData.isMember ?? reservationData.attendees?.[0]?.isMember);
  const titularPrice = isTitularMember ? priceMember : priceNonMember;
  const titularId = idGenerator?.generateParticipantId
    ? idGenerator.generateParticipantId(0)
    : `part-${Date.now()}-0-${Math.random().toString(36).substring(2, 6)}`;

  const titularRef = getParticipantRef(titularId);
  const titularPayload: Participant = {
    id: titularId,
    activityId: activityId.trim(),
    activityTitle: actData.title || 'Actividad',
    activityDate: actData.date || '',
    activityType: actData.type || 'cata',
    fullName: titularName,
    email: titularEmail,
    phone: titularPhone,
    isMember: isTitularMember,
    groupId,
    status: assignedStatus,
    totalAmount: titularPrice,
    paidAmount: 0,
    paymentMethod: reservationData.paymentMethod || 'bizum',
    registeredAt: nowIso,
    updatedAt: nowIso
  };

  if (turnText) titularPayload.turn = turnText;
  if (reservationData.membershipNumber?.trim()) titularPayload.membershipNumber = reservationData.membershipNumber.trim();
  if (reservationData.notes?.trim()) titularPayload.notes = reservationData.notes.trim();

  transaction.set(titularRef, titularPayload);
  createdParticipants.push(titularPayload);

  // 4. Create Companions (Spots 2..N)
  for (let i = 1; i < requestedSpots; i++) {
    const comp = reservationData.attendees?.[i];
    const isCompMember = Boolean(comp?.isMember);
    const compPrice = isCompMember ? priceMember : priceNonMember;
    const compId = idGenerator?.generateParticipantId
      ? idGenerator.generateParticipantId(i)
      : `part-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`;
    const compName = comp?.fullName?.trim() || `Acompañante ${i} (${titularName})`;

    const compRef = getParticipantRef(compId);
    const compPayload: Participant = {
      id: compId,
      activityId: activityId.trim(),
      activityTitle: actData.title || 'Actividad',
      activityDate: actData.date || '',
      activityType: actData.type || 'cata',
      fullName: compName,
      email: comp?.email?.trim() || '',
      phone: comp?.phone?.trim() || '',
      isMember: isCompMember,
      groupId,
      status: assignedStatus,
      totalAmount: compPrice,
      paidAmount: 0,
      paymentMethod: reservationData.paymentMethod || 'bizum',
      registeredAt: nowIso,
      updatedAt: nowIso
    };

    if (turnText) compPayload.turn = turnText;
    if (comp?.membershipNumber?.trim()) compPayload.membershipNumber = comp.membershipNumber.trim();
    if (comp?.notes?.trim()) compPayload.notes = comp.notes.trim();

    transaction.set(compRef, compPayload);
    createdParticipants.push(compPayload);
  }

  // 5. Update Activity bookedSpots and participantIds
  const newIds = createdParticipants.map(p => p.id);
  const existingParticipantIds: string[] = Array.isArray(actData.participantIds) ? actData.participantIds : [];
  const updatedParticipantIds = Array.from(new Set([...existingParticipantIds, ...newIds]));

  const activityUpdates: any = {
    participantIds: updatedParticipantIds,
    updatedAt: nowIso
  };

  if (assignedStatus === 'pendiente_pago') {
    activityUpdates.bookedSpots = resultingBookedSpots;
  }

  if (params._testHooks?.beforeCommit) {
    await params._testHooks.beforeCommit();
  }

  transaction.update(activityRef, activityUpdates);

  const message = assignedStatus === 'lista_de_espera'
    ? `Solicitud de ${requestedSpots} plaza(s) registrada en lista de espera para ${titularName}.`
    : `Reserva de ${requestedSpots} plaza(s) registrada correctamente para ${titularName}.`;

  const responsePayload: ReservationTransactionResult = {
    success: true,
    status: assignedStatus,
    groupId,
    createdCount: requestedSpots,
    bookedSpots: resultingBookedSpots,
    totalSpots,
    message,
    participants: createdParticipants
  };

  // 6. Write idempotency document
  transaction.set(idempotencyRef, {
    idempotencyKey,
    activityId: activityId.trim(),
    groupId,
    createdAt: nowIso,
    response: responsePayload
  });

  return responsePayload;
}

