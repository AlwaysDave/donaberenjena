/**
 * Módulo canónico ESM JavaScript para transacciones y ciclo de vida de reservas.
 * Compatible con Node 22 ESM y navegadores modernos (browser-safe, zero Node built-ins).
 */

/**
 * Genera un UUID v4 criptográficamente seguro para un intento de reserva.
 * RES-01: La clave pertenece estrictamente a un único intento y nunca se deriva de datos del formulario, fecha o email.
 */
export function generateSecureReservationKey(customCrypto) {
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
 * Inicializa o resetea la clave de un intento de reserva.
 */
export function createNewReservationAttemptKey(customCrypto) {
  try {
    const key = generateSecureReservationKey(customCrypto);
    return { key };
  } catch (err) {
    return { key: '', error: err?.message || 'ENTORNO_CRIPTO_NO_DISPONIBLE' };
  }
}

/**
 * Transición de estado del ciclo de vida de la reserva tras una respuesta.
 */
export function processReservationLifecycleTransition(
  currentKey,
  result,
  customCrypto
) {
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

  // Fallo definitivo (4xx, validación, etc.): renovar clave para nuevo intento corregido
  try {
    const nextKey = generateSecureReservationKey(customCrypto);
    return {
      nextKey,
      isCompleted: false,
      canResubmit: true,
      action: 'renewed_for_corrected_attempt'
    };
  } catch (err) {
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
 * Clasifica un código HTTP o error en 'definitive' o 'retryable'.
 */
export function classifyReservationFailure(statusOrError) {
  if (typeof statusOrError === 'number') {
    if (statusOrError >= 400 && statusOrError < 500) {
      return 'definitive';
    }
    return 'retryable';
  }
  return 'retryable';
}

/**
 * Valida el formato de la clave de idempotencia.
 */
export function validateIdempotencyKey(rawKey) {
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
 * Ejecuta una reserva atómica dentro de una transacción Firestore.
 * Reglas:
 * - RES-01: La clave de idempotencia pertenece al intento.
 * - RES-02: Misma clave -> mismo groupId, mismos participantes, incremento único en bookedSpots.
 * - RES-03: Todo el grupo entra junto en plaza o lista de espera.
 */
export async function executeReservationInTransaction(params) {
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

  // 1. Verificar si la clave de idempotencia ya fue procesada
  const idemDoc = await transaction.get(idempotencyRef);
  const idemExists = typeof idemDoc?.exists === 'function' ? idemDoc.exists() : Boolean(idemDoc?.exists);
  if (idemExists) {
    const existingData = typeof idemDoc?.data === 'function' ? idemDoc.data() : idemDoc?.data;
    if (existingData?.response) {
      return {
        ...existingData.response,
        isReplay: true
      };
    }
  }

  // 2. Leer documento de actividad
  const actDoc = await transaction.get(activityRef);
  const actExists = typeof actDoc?.exists === 'function' ? actDoc.exists() : Boolean(actDoc?.exists);
  if (!actExists) {
    throw new Error('ACTIVIDAD_NO_ENCONTRADA');
  }

  const rawActData = typeof actDoc?.data === 'function' ? actDoc.data() : actDoc?.data;
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

  // Regla de grupo: Si hay plazas suficientes para todo el grupo, pasan a 'pendiente_pago'.
  // Si no hay plazas para todo el grupo, todos pasan a 'lista_de_espera' sin alterar bookedSpots.
  let assignedStatus = 'pendiente_pago';
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

  const createdParticipants = [];

  // 3. Crear Participante Titular (Plaza 1)
  const isTitularMember = Boolean(reservationData.isMember ?? reservationData.attendees?.[0]?.isMember);
  const titularPrice = isTitularMember ? priceMember : priceNonMember;
  const titularId = idGenerator?.generateParticipantId
    ? idGenerator.generateParticipantId(0)
    : `part-${Date.now()}-0-${Math.random().toString(36).substring(2, 6)}`;

  const titularRef = getParticipantRef(titularId);
  const titularPayload = {
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

  // 4. Crear Acompañantes (Plazas 2..N)
  for (let i = 1; i < requestedSpots; i++) {
    const comp = reservationData.attendees?.[i];
    const isCompMember = Boolean(comp?.isMember);
    const compPrice = isCompMember ? priceMember : priceNonMember;
    const compId = idGenerator?.generateParticipantId
      ? idGenerator.generateParticipantId(i)
      : `part-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`;
    const compName = comp?.fullName?.trim() || `Acompañante ${i} (${titularName})`;

    const compRef = getParticipantRef(compId);
    const compPayload = {
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

  // 5. Actualizar actividad bookedSpots y participantIds
  const newIds = createdParticipants.map(p => p.id);
  const existingParticipantIds = Array.isArray(actData.participantIds) ? actData.participantIds : [];
  const updatedParticipantIds = Array.from(new Set([...existingParticipantIds, ...newIds]));

  const activityUpdates = {
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

  const responsePayload = {
    success: true,
    status: assignedStatus,
    groupId,
    createdCount: requestedSpots,
    bookedSpots: resultingBookedSpots,
    totalSpots,
    message,
    participants: createdParticipants
  };

  // 6. Escribir documento de idempotencia
  transaction.set(idempotencyRef, {
    idempotencyKey,
    activityId: activityId.trim(),
    groupId,
    createdAt: nowIso,
    response: responsePayload
  });

  return responsePayload;
}
