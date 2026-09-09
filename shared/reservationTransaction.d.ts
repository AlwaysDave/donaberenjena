import type { Participant, ParticipantStatus, ReservationFailureKind, ReservationFormData } from '../src/types/index';

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

export interface ReservationLifecycleTransitionResult {
  nextKey: string | null;
  isCompleted: boolean;
  canResubmit: boolean;
  action: 'completed' | 'retained_for_retry' | 'renewed_for_corrected_attempt' | 'crypto_unavailable';
  errorMessage?: string;
}

export declare function generateSecureReservationKey(customCrypto?: CryptoProvider): string;
export declare function createNewReservationAttemptKey(customCrypto?: CryptoProvider): { key: string; error?: string };
export declare function processReservationLifecycleTransition(
  currentKey: string,
  result: { success: boolean; failureKind?: ReservationFailureKind; message?: string },
  customCrypto?: CryptoProvider
): ReservationLifecycleTransitionResult;
export declare function classifyReservationFailure(statusOrError: number | unknown): ReservationFailureKind;
export declare function validateIdempotencyKey(rawKey: unknown): { valid: boolean; key: string; error?: string };
export declare function executeReservationInTransaction(
  params: ReservationExecutionParams
): Promise<ReservationTransactionResult>;
