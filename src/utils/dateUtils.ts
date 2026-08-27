/**
 * Date and Sorting Utilities for Doña Berenjena
 * Handles ISO (YYYY-MM-DD), Spanish (DD/MM/YYYY), and timestamp formats safely.
 */
import { Activity } from '../types';

/**
 * Safely parses any date string (ISO YYYY-MM-DD or DD/MM/YYYY) to a timestamp (milliseconds).
 * Returns 0 if the date cannot be parsed, preventing runtime crashes.
 */
export function parseActivityDate(dateStr?: string | null): number {
  if (!dateStr || typeof dateStr !== 'string') return 0;
  const trimmed = dateStr.trim();
  if (!trimmed) return 0;

  // Format DD/MM/YYYY or DD-MM-YYYY
  if (trimmed.includes('/') || (trimmed.includes('-') && trimmed.indexOf('-') <= 2)) {
    const separator = trimmed.includes('/') ? '/' : '-';
    const parts = trimmed.split(separator);
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year) && year > 1900 && month >= 0 && month <= 11) {
        return new Date(year, month, day).getTime();
      }
    }
  }

  // Format YYYY-MM-DD (ISO)
  const isoParts = trimmed.split('T')[0].split('-');
  if (isoParts.length === 3 && isoParts[0].length === 4) {
    const year = parseInt(isoParts[0], 10);
    const month = parseInt(isoParts[1], 10) - 1;
    const day = parseInt(isoParts[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year) && year > 1900 && month >= 0 && month <= 11) {
      return new Date(year, month, day).getTime();
    }
  }

  // Fallback to standard Date.parse
  const parsed = Date.parse(trimmed);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Comparator to sort activities newest first (descending by date).
 * In case of a tie in dates, uses title and id as stable tiebreakers.
 */
export function compareActivitiesNewestFirst(
  a: { date?: string; title?: string; id?: string },
  b: { date?: string; title?: string; id?: string }
): number {
  const timeA = parseActivityDate(a.date);
  const timeB = parseActivityDate(b.date);

  if (timeB !== timeA) {
    return timeB - timeA; // Descending: newest first
  }

  const titleA = a.title || '';
  const titleB = b.title || '';
  const titleComp = titleA.localeCompare(titleB, 'es', { sensitivity: 'base' });
  if (titleComp !== 0) return titleComp;

  const idA = a.id || '';
  const idB = b.id || '';
  return idA.localeCompare(idB);
}

/**
 * Comparator to sort activities oldest first (ascending by date).
 */
export function compareActivitiesOldestFirst(
  a: { date?: string; title?: string; id?: string },
  b: { date?: string; title?: string; id?: string }
): number {
  const timeA = parseActivityDate(a.date);
  const timeB = parseActivityDate(b.date);

  if (timeA !== timeB) {
    return timeA - timeB; // Ascending: oldest first
  }

  const titleA = a.title || '';
  const titleB = b.title || '';
  const titleComp = titleA.localeCompare(titleB, 'es', { sensitivity: 'base' });
  if (titleComp !== 0) return titleComp;

  const idA = a.id || '';
  const idB = b.id || '';
  return idA.localeCompare(idB);
}

/**
 * Returns a new array of activities sorted newest first (date descending).
 */
export function sortActivitiesNewestFirst<T extends Partial<Activity> = Activity>(items: T[]): T[] {
  return [...items].sort((a: any, b: any) => {
    const timeA = parseActivityDate(a?.date);
    const timeB = parseActivityDate(b?.date);
    if (timeB !== timeA) return timeB - timeA;
    const titleA = a?.title || '';
    const titleB = b?.title || '';
    const titleComp = titleA.localeCompare(titleB, 'es', { sensitivity: 'base' });
    if (titleComp !== 0) return titleComp;
    const idA = a?.id || '';
    const idB = b?.id || '';
    return idA.localeCompare(idB);
  });
}

/**
 * Returns a new array of activities sorted oldest first (date ascending).
 */
export function sortActivitiesOldestFirst<T extends Partial<Activity> = Activity>(items: T[]): T[] {
  return [...items].sort((a: any, b: any) => {
    const timeA = parseActivityDate(a?.date);
    const timeB = parseActivityDate(b?.date);
    if (timeA !== timeB) return timeA - timeB;
    const titleA = a?.title || '';
    const titleB = b?.title || '';
    const titleComp = titleA.localeCompare(titleB, 'es', { sensitivity: 'base' });
    if (titleComp !== 0) return titleComp;
    const idA = a?.id || '';
    const idB = b?.id || '';
    return idA.localeCompare(idB);
  });
}

/**
 * Formats a date string into standard Spanish display format (e.g. "15 de mayo de 2026").
 */
export function formatDateSpanish(dateStr?: string | null): string {
  if (!dateStr) return '-';
  const timestamp = parseActivityDate(dateStr);
  if (timestamp === 0) return dateStr;

  try {
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date(timestamp));
  } catch {
    return dateStr;
  }
}

/**
 * Formats a date string into short Spanish format (e.g. "15/05/2026").
 */
export function formatDateShort(dateStr?: string | null): string {
  if (!dateStr) return '-';
  const timestamp = parseActivityDate(dateStr);
  if (timestamp === 0) return dateStr;

  try {
    const d = new Date(timestamp);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

/**
 * Display helper for tables and summaries.
 */
export function formatDisplayDate(dateStr?: string | null): string {
  return formatDateShort(dateStr);
}

/**
 * Extracts the 4-digit year from a date string as number.
 */
export function getActivityYear(dateStr?: string | null): number {
  if (!dateStr) return new Date().getFullYear();
  const timestamp = parseActivityDate(dateStr);
  if (timestamp === 0) return new Date().getFullYear();
  return new Date(timestamp).getFullYear();
}

/**
 * Extracts the 4-digit year from a date string (nullable).
 */
export function extractYearFromDate(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  const timestamp = parseActivityDate(dateStr);
  if (timestamp === 0) return null;
  return new Date(timestamp).getFullYear();
}
