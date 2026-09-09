/**
 * Server re-export of canonical reservation transaction service from src/services/reservationTransaction.
 * Preserves a single canonical implementation for backend handlers and Vercel functions
 * while keeping client code strictly decoupled from api/ and firebase-admin.
 */
export * from '../../src/services/reservationTransaction';

