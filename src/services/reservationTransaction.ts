/**
 * Fachada de tipos y reexport hacia el módulo canónico ESM compartido shared/reservationTransaction.js
 * Mantiene compatibilidad con todos los importadores de cliente (src/**) y scripts sin duplicar lógica.
 */

export * from '../../shared/reservationTransaction.js';
export type * from '../../shared/reservationTransaction.js';


