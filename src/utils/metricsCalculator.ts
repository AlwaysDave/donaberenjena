import { Activity, Participant, Member, Expense, Sponsorship, ContactMessage, AdminNotification } from '../types';
import { parseActivityDate } from './dateUtils';

export type MetricPeriodType = '30d' | 'month' | 'year' | 'custom' | 'all';

export interface MetricPeriodRange {
  type: MetricPeriodType;
  startDate: Date | null;
  endDate: Date | null;
  label: string;
}

export interface MetricStatusInfo {
  state: 'real' | 'demo' | 'unconfigured' | 'nodata' | 'error';
  label: string;
  source: string;
  updatedAt: string;
  notes?: string;
}

/**
 * Normalizes date bounds for the selected period
 */
export function getPeriodDateRange(
  periodType: MetricPeriodType,
  customStart?: string | null,
  customEnd?: string | null
): { start: Date | null; end: Date | null; label: string } {
  const now = new Date();

  if (periodType === '30d') {
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { start, end: now, label: 'Últimos 30 días' };
  }

  if (periodType === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const monthName = now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    return { start, end, label: `Mes actual (${monthName})` };
  }

  if (periodType === 'year') {
    const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    return { start, end, label: `Año actual (${now.getFullYear()})` };
  }

  if (periodType === 'custom' && customStart && customEnd) {
    const start = new Date(`${customStart}T00:00:00`);
    const end = new Date(`${customEnd}T23:59:59`);
    return { start, end, label: `Del ${customStart} al ${customEnd}` };
  }

  return { start: null, end: null, label: 'Histórico Completo' };
}

/**
 * Checks if a given timestamp/date is inside a date range
 */
export function isDateInRange(dateValue: string | Date | number | undefined | null, start: Date | null, end: Date | null): boolean {
  if (!dateValue) return false;
  let timeMs = 0;

  if (typeof dateValue === 'number') {
    timeMs = dateValue;
  } else if (dateValue instanceof Date) {
    timeMs = dateValue.getTime();
  } else if (typeof dateValue === 'string') {
    // If it contains ISO or standard time
    if (dateValue.includes('T') || dateValue.includes('-')) {
      const parsedIso = Date.parse(dateValue);
      if (!isNaN(parsedIso)) {
        timeMs = parsedIso;
      } else {
        timeMs = parseActivityDate(dateValue);
      }
    } else {
      timeMs = parseActivityDate(dateValue);
    }
  }

  if (!timeMs || isNaN(timeMs)) return false;
  if (start && timeMs < start.getTime()) return false;
  if (end && timeMs > end.getTime()) return false;
  return true;
}

/**
 * Single, pure reader adapter for participants status
 * Maps existing status & legacy boolean attended without altering raw data
 */
export function interpretParticipantStatus(p: Participant) {
  const isCancelled = p.status === 'cancelada';
  const isWaitingList = p.status === 'lista_de_espera';
  const occupiesSpot = !isCancelled && !isWaitingList;

  // Attended: status 'asistio' OR legacy attended: true (if not cancelled or no_asistio)
  const isAttended = (p.status === 'asistio' || p.attended === true) && !isCancelled && p.status !== 'no_asistio';
  const isNoShow = p.status === 'no_asistio';
  const isPendingPayment = p.status === 'pendiente_pago';
  const isConfirmed = p.status === 'confirmada' || isAttended;

  const isJustified = !!p.justified;

  return {
    occupiesSpot,
    isAttended,
    isNoShow,
    isCancelled,
    isWaitingList,
    isPendingPayment,
    isConfirmed,
    isJustified,
    spots: p.spotsCount || 1,
    billedAmount: occupiesSpot ? (p.totalAmount || 0) : 0,
    paidAmount: occupiesSpot ? (p.paidAmount || 0) : 0
  };
}

/**
 * Pure Operational Metrics computation for given entities in a selected period
 */
export function computeOperationalMetrics(params: {
  activities: Activity[];
  participants: Participant[];
  members: Member[];
  expenses: Expense[];
  sponsorships: Sponsorship[];
  contactMessages: ContactMessage[];
  adminNotifications: AdminNotification[];
  periodType: MetricPeriodType;
  customStart?: string | null;
  customEnd?: string | null;
  useMockData: boolean;
}) {
  const {
    activities,
    participants,
    members,
    expenses,
    sponsorships,
    contactMessages,
    adminNotifications,
    periodType,
    customStart,
    customEnd,
    useMockData
  } = params;

  const { start, end, label: periodLabel } = getPeriodDateRange(periodType, customStart, customEnd);
  const now = new Date();

  // 1. Activities in period
  const periodActivities = activities.filter(a => isDateInRange(a.date, start, end));
  const celebratedActivities = periodActivities.filter(a => a.status === 'celebrada');
  const upcomingActivities = periodActivities.filter(a => a.status !== 'celebrada');
  const openForRegistrationActivities = periodActivities.filter(a => a.status !== 'celebrada' && a.registrationStatus === 'abierta');

  // 2. Spots & Occupancy
  let totalCapacity = 0;
  let totalBookedSpotsCalculated = 0;
  let totalBookedSpotsField = 0;
  let discrepanciesCount = 0;

  upcomingActivities.forEach(a => {
    totalCapacity += a.totalSpots || 0;
    totalBookedSpotsField += a.bookedSpots || 0;

    const actParts = participants.filter(p => p.activityId === a.id);
    const actSpots = actParts
      .filter(p => interpretParticipantStatus(p).occupiesSpot)
      .reduce((sum, p) => sum + (p.spotsCount || 1), 0);

    totalBookedSpotsCalculated += actSpots;
    if (actSpots !== (a.bookedSpots || 0)) {
      discrepanciesCount++;
    }
  });

  const averageOccupancyPercent = totalCapacity > 0
    ? Math.min(100, Math.round((totalBookedSpotsCalculated / totalCapacity) * 100))
    : 0;

  // 3. Participants in period (filtered by registeredAt or createdAt)
  const periodParticipants = participants.filter(p => {
    const regDate = p.registeredAt || p.createdAt || p.activityDate;
    return isDateInRange(regDate, start, end);
  });

  let totalRegistrations = 0;
  let effectiveAttendance = 0;
  let noShows = 0;
  let cancellations = 0;
  let justifiedAbsences = 0;
  let totalSpotsRegistered = 0;

  periodParticipants.forEach(p => {
    const info = interpretParticipantStatus(p);
    totalRegistrations++;
    totalSpotsRegistered += info.spots;

    if (info.isAttended) effectiveAttendance += info.spots;
    if (info.isNoShow) noShows += info.spots;
    if (info.isCancelled) cancellations += info.spots;
    if (info.isJustified) justifiedAbsences += info.spots;
  });

  // 4. Members in period
  const activeMembersTotal = members.filter(m => m.active).length;
  const newMembersInPeriod = members.filter(m => isDateInRange(m.createdAt, start, end)).length;

  // 5. Financials in period (Formula exactly matching AccountsManager)
  // Reservations from period activities
  let reservasFacturadas = 0;
  let reservasCobradas = 0;

  periodActivities.forEach(a => {
    const actActiveParticipants = participants.filter(
      p => p.activityId === a.id && p.status !== 'cancelada' && p.status !== 'lista_de_espera'
    );
    reservasFacturadas += actActiveParticipants.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
    reservasCobradas += actActiveParticipants.reduce((sum, p) => sum + (p.paidAmount ?? 0), 0);
  });

  // Sponsorships in period
  const periodSponsorships = sponsorships.filter(s => {
    const sDate = s.date || s.createdAt;
    return isDateInRange(sDate, start, end) && s.status !== 'cancelado';
  });

  const patrociniosFacturados = periodSponsorships.reduce((sum, s) => sum + (s.amount || 0), 0);
  const patrociniosCobrados = periodSponsorships.reduce((sum, s) => sum + (s.paidAmount ?? 0), 0);

  const ingresosFacturados = reservasFacturadas + patrociniosFacturados;
  const ingresosCobrados = reservasCobradas + patrociniosCobrados;
  const pendienteCobro = Math.max(0, ingresosFacturados - ingresosCobrados);

  // Expenses in period
  const periodExpenses = expenses.filter(e => {
    const eDate = e.date || e.createdAt;
    return isDateInRange(eDate, start, end);
  });
  const totalGastos = periodExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const balanceNeto = ingresosCobrados - totalGastos;

  // 6. Operational queues / unread
  const unreadMessagesCount = contactMessages.filter(m => !m.read || m.status === 'nuevo').length;
  const unreadNotificationsCount = adminNotifications.filter(n => !n.read).length;

  // Top 3 urgent issues for CEO
  const topIssues: Array<{ title: string; desc: string; linkTab: string; severity: 'attention' | 'error' | 'info' }> = [];

  if (discrepanciesCount > 0) {
    topIssues.push({
      title: `${discrepanciesCount} actividad(es) con discrepancia de plazas`,
      desc: 'El contador rápido difiere de la suma de participantes registrados.',
      linkTab: 'gestion',
      severity: 'attention'
    });
  }

  if (pendienteCobro > 0) {
    topIssues.push({
      title: `${pendienteCobro.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })} pendientes de cobro`,
      desc: 'Existen reservas o patrocinios con pagos pendientes de confirmar.',
      linkTab: 'cuentas',
      severity: 'attention'
    });
  }

  if (unreadMessagesCount > 0) {
    topIssues.push({
      title: `${unreadMessagesCount} mensaje(s) de contacto sin leer`,
      desc: 'Nuevas solicitudes ciudadanas o comerciales esperando respuesta.',
      linkTab: 'contacto',
      severity: 'info'
    });
  }

  if (unreadNotificationsCount > 0 && topIssues.length < 3) {
    topIssues.push({
      title: `${unreadNotificationsCount} aviso(s) administrativo(s) activo(s)`,
      desc: 'Notificaciones sobre censos o inscripciones pendientes de revisar.',
      linkTab: 'socios',
      severity: 'info'
    });
  }

  return {
    periodLabel,
    periodType,
    useMockData,
    dateRange: { start, end },
    // Activities
    periodActivitiesCount: periodActivities.length,
    celebratedCount: celebratedActivities.length,
    upcomingCount: upcomingActivities.length,
    openForRegistrationCount: openForRegistrationActivities.length,
    upcomingActivitiesList: upcomingActivities,
    // Spots
    totalCapacity,
    totalBookedSpotsCalculated,
    totalBookedSpotsField,
    averageOccupancyPercent,
    discrepanciesCount,
    // Attendance
    totalRegistrations,
    totalSpotsRegistered,
    effectiveAttendance,
    noShows,
    cancellations,
    justifiedAbsences,
    // Members
    activeMembersTotal,
    newMembersInPeriod,
    // Finances
    reservasFacturadas,
    reservasCobradas,
    patrociniosFacturados,
    patrociniosCobrados,
    ingresosFacturados,
    ingresosCobrados,
    pendienteCobro,
    totalGastos,
    balanceNeto,
    // Queues & Issues
    unreadMessagesCount,
    unreadNotificationsCount,
    topIssues
  };
}
