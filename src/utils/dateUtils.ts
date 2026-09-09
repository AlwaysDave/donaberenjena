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
  let trimmed = dateStr.trim();
  if (!trimmed) return 0;

  // Handle range like "2026-10-15 a 2026-10-18" or "2026-10-15 - 2026-10-18"
  if (trimmed.includes(' a ')) {
    trimmed = trimmed.split(' a ')[0].trim();
  } else if (trimmed.includes(' - ') && trimmed.indexOf(' - ') >= 4) {
    trimmed = trimmed.split(' - ')[0].trim();
  }

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
 * Comparator to sort activities oldest first / ascending by date (earliest date first).
 * Empty or invalid dates are safely pushed to the end.
 * Tiebreakers: time, title, id.
 */
export function compareActivitiesAscending(
  a: { date?: string; time?: string; title?: string; id?: string },
  b: { date?: string; time?: string; title?: string; id?: string }
): number {
  const rawA = parseActivityDate(a?.date);
  const rawB = parseActivityDate(b?.date);
  const timeA = rawA > 0 ? rawA : Number.MAX_SAFE_INTEGER;
  const timeB = rawB > 0 ? rawB : Number.MAX_SAFE_INTEGER;

  if (timeA !== timeB) {
    return timeA - timeB; // Ascending: earliest timestamp first
  }

  const hourA = a?.time || '';
  const hourB = b?.time || '';
  const hourComp = hourA.localeCompare(hourB);
  if (hourComp !== 0) return hourComp;

  const titleA = a?.title || '';
  const titleB = b?.title || '';
  const titleComp = titleA.localeCompare(titleB, 'es', { sensitivity: 'base' });
  if (titleComp !== 0) return titleComp;

  const idA = a?.id || '';
  const idB = b?.id || '';
  return idA.localeCompare(idB);
}

/**
 * Comparator to sort activities newest first (descending by date).
 * In case of a tie in dates, uses title and id as stable tiebreakers.
 */
export function compareActivitiesNewestFirst(
  a: { date?: string; time?: string; title?: string; id?: string },
  b: { date?: string; time?: string; title?: string; id?: string }
): number {
  const rawA = parseActivityDate(a?.date);
  const rawB = parseActivityDate(b?.date);
  const timeA = rawA > 0 ? rawA : 0;
  const timeB = rawB > 0 ? rawB : 0;

  if (timeB !== timeA) {
    return timeB - timeA; // Descending: newest first
  }

  const hourA = a?.time || '';
  const hourB = b?.time || '';
  const hourComp = hourB.localeCompare(hourA);
  if (hourComp !== 0) return hourComp;

  const titleA = a?.title || '';
  const titleB = b?.title || '';
  const titleComp = titleA.localeCompare(titleB, 'es', { sensitivity: 'base' });
  if (titleComp !== 0) return titleComp;

  const idA = a?.id || '';
  const idB = b?.id || '';
  return idA.localeCompare(idB);
}

/**
 * Comparator alias for ascending sorting (earliest date first).
 */
export const compareActivitiesOldestFirst = compareActivitiesAscending;

/**
 * Returns a new array of activities sorted ascending by date (earliest date first).
 * Empty or invalid dates are pushed to the end.
 */
export function sortActivitiesAscending<T extends Partial<Activity> = Activity>(items: T[]): T[] {
  return [...items].sort((a: any, b: any) => compareActivitiesAscending(a, b));
}

/**
 * Returns a new array of activities sorted oldest first (date ascending).
 */
export const sortActivitiesOldestFirst = sortActivitiesAscending;

/**
 * Returns a new array of activities sorted newest first (date descending).
 */
export function sortActivitiesNewestFirst<T extends Partial<Activity> = Activity>(items: T[]): T[] {
  return [...items].sort((a: any, b: any) => compareActivitiesNewestFirst(a, b));
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
 * Display helper for cards, tables, and summaries: "28 feb 2026" (or "28 feb 2026, 21:00" if time is provided).
 */
export function formatDisplayDate(dateStr?: string | null, timeStr?: string | null): string {
  if (!dateStr) return '-';

  // If a range string is passed (e.g. "2026-10-15 a 2026-10-18")
  if (dateStr.includes(' a ')) {
    const [start, end] = dateStr.split(' a ');
    return `${formatDisplayDate(start.trim())} al ${formatDisplayDate(end.trim())}`;
  }

  const timestamp = parseActivityDate(dateStr);
  if (timestamp === 0) {
    return timeStr && timeStr.trim() ? `${dateStr}, ${timeStr.trim()}` : dateStr;
  }

  try {
    const formatted = new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(timestamp));
    const cleanDate = formatted.replace(/\./g, '');
    if (timeStr && timeStr.trim()) {
      return `${cleanDate}, ${timeStr.trim()}`;
    }
    return cleanDate;
  } catch {
    return dateStr;
  }
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

export interface ActivityDayOccurrence {
  activity: Activity;
  dateKey: string; // "YYYY-MM-DD"
  year: number;
  month: number; // 0 to 11
  day: number;
  isMultiDay: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  isRangeMiddle: boolean;
  occurrenceIndex: number;
  totalOccurrences: number;
  sessionLabel?: string; // e.g. "Sesión 1 de 4" or "Día 2 del Viaje"
}

/**
 * Returns all individual calendar day occurrences for an activity,
 * supporting multi-session courses and multi-day continuous trips.
 */
export function getActivityOccurrences(activity: Activity): ActivityDayOccurrence[] {
  if (!activity) return [];

  const occurrences: ActivityDayOccurrence[] = [];

  // Helper to parse single YYYY-MM-DD or DD/MM/YYYY into { year, month, day }
  const parseParts = (dateStr?: string | null) => {
    if (!dateStr) return null;
    const trimmed = dateStr.trim();
    if (trimmed.includes('/') || (trimmed.includes('-') && trimmed.indexOf('-') <= 2)) {
      const parts = trimmed.split(trimmed.includes('/') ? '/' : '-');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) return { year, month, day };
      }
    }
    const isoParts = trimmed.split('T')[0].split('-');
    if (isoParts.length === 3 && isoParts[0].length === 4) {
      const year = parseInt(isoParts[0], 10);
      const month = parseInt(isoParts[1], 10) - 1;
      const day = parseInt(isoParts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) return { year, month, day };
    }
    const ts = parseActivityDate(dateStr);
    if (ts > 0) {
      const d = new Date(ts);
      return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
    }
    return null;
  };

  // Case 1: Curso with explicit sessionDates array
  if (activity.type === 'curso' && Array.isArray((activity as any).sessionDates) && (activity as any).sessionDates.length > 0) {
    const sessionDates: string[] = (activity as any).sessionDates;
    sessionDates.forEach((sDate, idx) => {
      const parts = parseParts(sDate);
      if (parts) {
        const dateKey = `${parts.year}-${String(parts.month + 1).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
        occurrences.push({
          activity,
          dateKey,
          year: parts.year,
          month: parts.month,
          day: parts.day,
          isMultiDay: true,
          isRangeStart: idx === 0,
          isRangeEnd: idx === sessionDates.length - 1,
          isRangeMiddle: idx > 0 && idx < sessionDates.length - 1,
          occurrenceIndex: idx + 1,
          totalOccurrences: sessionDates.length,
          sessionLabel: `Sesión ${idx + 1} de ${sessionDates.length}`
        });
      }
    });
    if (occurrences.length > 0) return occurrences;
  }

  // Case 2: Multi-day continuous range (Viaje or any activity with startDate & endDate)
  const startStr = activity.startDate || (activity as any).departureDate || activity.date;
  let endStr = activity.endDate || (activity as any).returnDate;

  // Check if date has " a " format (e.g. "2026-10-15 a 2026-10-18")
  if (!endStr && typeof activity.date === 'string' && activity.date.includes(' a ')) {
    const split = activity.date.split(' a ');
    if (split.length === 2) {
      endStr = split[1].trim();
    }
  }

  const startParts = parseParts(startStr);
  const endParts = parseParts(endStr);

  if (startParts && endParts) {
    const startDateObj = new Date(startParts.year, startParts.month, startParts.day);
    const endDateObj = new Date(endParts.year, endParts.month, endParts.day);

    if (endDateObj >= startDateObj) {
      const diffDays = Math.round((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      // Limit to max 31 days to prevent accidental huge loops
      const safeDays = Math.min(diffDays, 31);
      for (let i = 0; i < safeDays; i++) {
        const curr = new Date(startDateObj.getFullYear(), startDateObj.getMonth(), startDateObj.getDate() + i);
        const y = curr.getFullYear();
        const m = curr.getMonth();
        const d = curr.getDate();
        const dateKey = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        
        occurrences.push({
          activity,
          dateKey,
          year: y,
          month: m,
          day: d,
          isMultiDay: safeDays > 1,
          isRangeStart: i === 0,
          isRangeEnd: i === safeDays - 1,
          isRangeMiddle: i > 0 && i < safeDays - 1,
          occurrenceIndex: i + 1,
          totalOccurrences: safeDays,
          sessionLabel: activity.type === 'viaje' ? `Día ${i + 1} de ${safeDays}` : `Día ${i + 1}`
        });
      }
      if (occurrences.length > 0) return occurrences;
    }
  }

  // Case 3: Standard single day occurrence
  const singleParts = parseParts(activity.date || activity.startDate);
  if (singleParts) {
    const dateKey = `${singleParts.year}-${String(singleParts.month + 1).padStart(2, '0')}-${String(singleParts.day).padStart(2, '0')}`;
    occurrences.push({
      activity,
      dateKey,
      year: singleParts.year,
      month: singleParts.month,
      day: singleParts.day,
      isMultiDay: false,
      isRangeStart: true,
      isRangeEnd: true,
      isRangeMiddle: false,
      occurrenceIndex: 1,
      totalOccurrences: 1
    });
  }

  return occurrences;
}

/**
 * Returns a human-friendly schedule summary for any activity
 * (handles multi-day trips, courses with multiple weekly sessions, and tastings with shifts).
 */
export function formatActivityScheduleSummary(activity: Activity): string {
  if (!activity) return '-';

  // For multi-session courses
  if (activity.type === 'curso') {
    const curso = activity as any;
    if (curso.daysOfWeekText) {
      if (curso.sessionsCount) {
        return `${curso.daysOfWeekText} (${curso.sessionsCount} sesiones)`;
      }
      return curso.daysOfWeekText;
    }
    if (Array.isArray(curso.sessionDates) && curso.sessionDates.length > 1) {
      return `${curso.sessionDates.length} sesiones programadas`;
    }
  }

  // For multi-day trips
  if (activity.type === 'viaje') {
    const viaje = activity as any;
    const startStr = viaje.startDate || viaje.departureDate || viaje.date;
    const endStr = viaje.endDate || viaje.returnDate;

    if (startStr && endStr && startStr !== endStr) {
      const startFormatted = formatDateSpanish(startStr);
      const endFormatted = formatDateSpanish(endStr);
      return `${startFormatted} al ${endFormatted} (${viaje.durationDays || 4} días)`;
    }
  }

  // Default formatted date
  return formatDateSpanish(activity.date || activity.startDate);
}
