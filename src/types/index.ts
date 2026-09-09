export type ActivityType = 'cata' | 'viaje' | 'curso';
export type ActivityStatus = 'proxima' | 'celebrada';
export type RegistrationStatus = 'abierta' | 'cerrada';
export type CataCategory = 'vino' | 'vermut' | 'cerveza' | 'aceite' | 'quesos' | 'destilados' | 'otros';

export interface PdfDocument {
  url: string;
  title: string;
  fileSize?: string;
}

export interface BaseActivity {
  id: string;
  type: ActivityType;
  title: string;
  subtitle: string;
  description: string;
  date: string; // e.g. "2026-10-09" or "2026-10-15 a 2026-10-18" (Fecha principal o representativa)
  startDate?: string; // Fecha de inicio / ida (e.g. "2026-10-06" o "2026-10-15")
  endDate?: string;   // Fecha de fin / vuelta (e.g. "2026-10-27" o "2026-10-18")
  isMultiDay?: boolean; // Indica si la actividad se desarrolla en varias jornadas
  time?: string; // e.g. "20:30 h" (Hora de inicio o franja horaria)
  priceMember: number; // Precio para socios (€)
  priceNonMember: number; // Precio para no socios (€)
  totalSpots: number;
  bookedSpots: number;
  participantIds?: string[];
  status: ActivityStatus;
  registrationStatus?: RegistrationStatus; // 'abierta' o 'cerrada'
  reopenedAt?: string;
  reopenedBy?: string;
  reopenReason?: string;
  images: string[];
  documentPdf?: PdfDocument;
  location: string;
  featured?: boolean;
  howToReserveInfo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PairingMenuItem {
  dish: string;
  pairing: string;
  notes?: string;
}

export interface WineDetail {
  type: string; // e.g. "Blanco", "Tinto", "Espumoso", "Vermut", "Pase I"
  name: string; // e.g. "El Jalbegandero", "Lustau Rojo", "Vermut 5 Tentaciones"
  grape?: string; // e.g. "Pedro Ximénez – Palomino", "100% Moscatel"
  pairing?: string; // e.g. "Gilda y un Canapé de Ahumados", "Tartar de Fuet..."
  notes?: string;
  bodega?: string; // Optional legacy / helper
  region?: string; // Optional legacy / helper
  denominacion?: string;
}

export interface BodegaItem {
  id?: string;
  name: string;
  website?: string;
  region: string;
  logoUrl?: string;
  wines: WineDetail[];
}

export interface BodegaProductor {
  name: string;
  region: string;
  website?: string;
  description?: string;
  enologo?: string;
  colaboradores?: string;
}

export interface CataActivity extends BaseActivity {
  type: 'cata';
  category: CataCategory;
  bodegas?: BodegaItem[]; // 1 to 4 Bodegas, each with 1 to 4 wines
  bodegaProductor?: BodegaProductor; // Legacy / Fallback for existing records
  sumiller?: string;
  aove?: string;
  pairingMenu?: PairingMenuItem[];
  wines?: WineDetail[]; // Legacy flat array if needed
  cataType?: 'bodega_unica' | 'varias_bodegas';
  shifts?: {
    id: string;
    name: string;
    time: string;
  }[];
  tastingGroupId?: string; // Grouping identifier exclusively for two-shift tastings
  shiftName?: string; // Explicit shift title (e.g., "Turno 1", "Turno 2", "Primer Turno")
  tallerEspecial?: string;
  pastEventGallery?: string[];
  pastEventSummary?: string;
}

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  highlights: string[];
}

export interface ViajeActivity extends BaseActivity {
  type: 'viaje';
  destination: string;
  durationDays: number;
  departureDate?: string; // Fecha de ida / salida (e.g. "2026-10-15")
  returnDate?: string;    // Fecha de vuelta / regreso (e.g. "2026-10-18")
  itinerary: ItineraryDay[];
  includedServices: string[];
  pastEventGallery?: string[];
  pastEventSummary?: string;
}

export interface ChefInfo {
  name: string;
  bio: string;
  restaurant?: string;
  photo?: string;
}

export interface CursoActivity extends BaseActivity {
  type: 'curso';
  theme: string;
  chef: ChefInfo;
  syllabus: string[];
  includesTasting: boolean;
  // Planificación de cursos multisesión / varios días
  sessionDaysOfWeek?: number[]; // [2] para martes (0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado)
  daysOfWeekText?: string;      // e.g. "Todos los martes de octubre" o "Lunes y Miércoles"
  sessionDates?: string[];      // Fechas exactas de cada sesión: ["2026-10-06", "2026-10-13", "2026-10-20", "2026-10-27"]
  sessionsCount?: number;       // Número de clases/sesiones (e.g. 4)
  scheduleDescription?: string; // e.g. "4 sesiones: 6, 13, 20 y 27 de octubre de 10:00 a 13:00 h"
  pastEventGallery?: string[];
  pastEventSummary?: string;
}

export type Activity = CataActivity | ViajeActivity | CursoActivity;

export type AdminRole = 'advanced' | 'simple';

export interface AdminUser {
  uid: string;
  email: string;
  name: string;
  baseRole: AdminRole; // Real role in Firestore (admins/{uid})
  role: AdminRole;     // Current display/working role (advanced view vs simple view)
}

export interface WebMetric {
  pageViewsThisMonth: number;
  uniqueVisitorsThisMonth: number;
  activeReservationsCount: number;
  occupancyRateAverage: number;
  topVisitedActivities: Array<{
    id: string;
    title: string;
    type: ActivityType;
    views: number;
  }>;
}

export type MetricDataState = 'real' | 'collecting' | 'nodata' | 'error' | 'demo';
export type MetricPeriodType = '30d' | 'month' | 'year' | 'all' | 'custom';

export interface AcquisitionMetrics {
  period: string;
  periodType: MetricPeriodType;
  source: string;
  updatedAt: string;
  status: MetricDataState;
  funnel: {
    catasViews: number;
    activityViews: number;
    registrationStarts: number;
    reservationsCompleted: number;
    rates: {
      activityToCatasPercent: number | null;     // (activityViews / catasViews) * 100
      startsToActivityPercent: number | null;     // (registrationStarts / activityViews) * 100
      completedToStartsPercent: number | null;    // (reservationsCompleted / registrationStarts) * 100
    };
  };
  topPages: Array<{ path: string; label: string; views: number }>;
  activityInterest: Array<{
    activityId: string;
    title: string;
    views: number;
    starts: number;
    completed: number;
    conversionRate: number | null;                // (completed / views) * 100
  }>;
  conversionOpportunities: Array<{
    activityId: string;
    title: string;
    views: number;
    starts: number;
    completed: number;
    reason: string;
  }>;
}

export interface WebMetricDailyDoc {
  id: string; // "YYYY-MM-DD"
  date: string; // "YYYY-MM-DD"
  totalPageViews: number;
  catasViews: number;
  activityDetailViews: number;
  registrationStarts: number;
  reservationsCompleted: number;
  paths?: Record<string, number>;
  activities?: Record<string, {
    views?: number;
    registrationStarts?: number;
    reservationsCompleted?: number;
  }>;
  updatedAt: string;
}

export interface ReservationAttendee {
  fullName: string;
  isMember: boolean;
  membershipNumber?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface ReservationFormData {
  fullName: string;
  email: string;
  phone: string;
  spots: number;
  isMember?: boolean;
  membershipNumber?: string;
  turn?: string;
  notes?: string;
  paymentMethod?: PaymentMethod;
  attendees?: ReservationAttendee[];
  idempotencyKey?: string;
}

export type ReservationFailureKind = 'definitive' | 'retryable';

export interface ReservationResult {
  success: boolean;
  message: string;
  groupId?: string;
  status?: CanonicalParticipantStatus;
  failureKind?: ReservationFailureKind;
  httpStatus?: number;
  participants?: Participant[];
  bookedSpots?: number;
}

export type CanonicalParticipantStatus = 'lista_de_espera' | 'pendiente_pago' | 'pagada' | 'asistio' | 'cancelada';
export type ParticipantStatus = CanonicalParticipantStatus;

export type CancellationKind = 'cancelacion_usuario' | 'no_presentado';

export type PaymentMethod = 'bizum' | 'transferencia' | 'efectivo' | 'tarjeta' | 'pendiente' | 'otro';

export interface Participant {
  id: string;
  activityId: string;
  activityTitle: string;
  activityDate: string;
  activityType: ActivityType;
  fullName: string;
  email: string;
  phone: string;
  isMember: boolean;
  memberId?: string;
  groupId: string;
  turn?: string;
  membershipNumber?: string;
  notes?: string;
  status: CanonicalParticipantStatus;
  cancellationReason?: string;
  cancellationJustified?: boolean;
  cancellationKind?: CancellationKind;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationRefund?: number;
  attendedAt?: string;
  attendedBy?: string;
  correctedAt?: string;
  correctedBy?: string;
  correctionReason?: string;
  spotsCount?: number;
  spots?: number;
  justificationReason?: string;
  refundAmount?: number;
  totalAmount: number;
  paidAmount?: number;
  paymentMethod: PaymentMethod;
  registeredAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdvancedAttendanceCorrectionParams {
  participantId: string;
  activityId: string;
  targetStatus: CanonicalParticipantStatus;
  correctionReason: string;
  actor: string;
  cancellationData?: {
    reason?: string;
    justified?: boolean;
    kind?: CancellationKind;
    refundAmount?: number;
  };
  paymentData?: {
    paidAmount?: number;
  };
  attendanceData?: {
    attendedAt?: string;
    attendedBy?: string;
  };
}

export interface AdvancedCorrectionResult {
  success: boolean;
  error?: string;
  updatedParticipant?: Partial<Participant>;
  updatedActivity?: Partial<Activity>;
  spotsDelta?: number;
  willReopen?: boolean;
}

export * from './contact';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  activityInterest?: string;
  website?: string;
  read: boolean;
  status: 'nuevo' | 'leido' | 'respondido';
  createdAt: string;
  repliedAt?: string;
  replyNotes?: string;
  emailDeliveryStatus?: 'sent' | 'failed' | 'simulated' | 'pending';
  emailSentAt?: string;
  emailFailedAt?: string;
  emailErrorReason?: string;
  contactAlertSeenAt?: string;
  contactAlertSeenBy?: string;
  contactAlertSeenByUid?: string;
}

export interface Member {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  membershipNumber?: string;
  active: boolean;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type NotificationSeverity = 'info' | 'attention' | 'important' | 'critical';
export type NotificationType = 'socio_mismatch' | 'ocupacion_alta' | 'ocupacion_baja' | 'sin_gastos' | 'gasto_sin_comprobante' | 'patrocinio_pendiente' | 'balance_negativo' | 'plaza_liberada' | 'aforo_discrepancia' | 'info_incompleta' | 'sistema' | 'otro';

export interface AdminNotification {
  id: string;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  activityId?: string;
  participantId?: string;
  dedupeKey: string;
  read: boolean;
  archived?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type ExpenseCategory = 'bodega_proveedor' | 'catering' | 'transporte' | 'alojamiento' | 'material' | 'personal' | 'otros';

export interface Expense {
  id: string;
  activityId: string;
  concept: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  receiptImageUrl?: string;
  receiptImageUrl2?: string;
  notes?: string;
  createdAt: string;
  createdBy?: string;
}

export type SponsorshipStatus = 'pendiente' | 'cobrado' | 'cancelado';

export interface Sponsorship {
  id: string;
  activityId: string;
  sponsorName: string;
  concept: string;
  amount: number;       // Importe comprometido o facturado
  paidAmount: number;   // Importe efectivamente recibido; 0 si está pendiente
  status: SponsorshipStatus;
  date: string;         // Fecha de factura, compromiso o cobro, YYYY-MM-DD
  notes?: string;
  createdAt: string;
  createdBy?: string;
}

// ==========================================
// CONTABILIDAD GENERAL DE LA ASOCIACIÓN
// ==========================================
export type GeneralIncomeType = 'cuota_socio' | 'subvencion' | 'patrocinio_general' | 'donacion' | 'otros';
export type GeneralIncomeStatus = 'pendiente' | 'cobrado' | 'cancelado';

export interface GeneralIncome {
  id: string;
  concept: string;
  payerName?: string;
  amount: number;
  paidAmount: number;
  type: GeneralIncomeType;
  status: GeneralIncomeStatus;
  date: string;
  receiptImageUrl?: string;
  notes?: string;
  isConsolidatedFeeRecord?: boolean;
  feeYear?: number;
  createdAt: string;
  createdBy?: string;
}

export type GeneralExpenseCategory = 
  | 'equipamiento'
  | 'comida_asociacion'
  | 'menaje_copas'
  | 'suministros_local'
  | 'administracion_legal'
  | 'mantenimiento'
  | 'otros';

export interface GeneralExpense {
  id: string;
  concept: string;
  supplierName?: string;
  amount: number;
  category: GeneralExpenseCategory;
  date: string;
  receiptImageUrl?: string;
  notes?: string;
  createdAt: string;
  createdBy?: string;
}

// ==========================================
// ESTADO DE CUOTAS DE SOCIOS (POR AÑO)
// ==========================================
export interface MemberFeeItem {
  memberId: string;
  memberName: string;
  membershipNumber?: string;
  email?: string;
  phone?: string;
  feeAmount: number;
  status: 'pagada' | 'pendiente';
  paidDate?: string;
  paymentMethod?: PaymentMethod;
  notes?: string;
}

export interface AnnualMembershipFeesRecord {
  id: string; // "fees_2026"
  year: number;
  defaultFeeAmount: number;
  fees: Record<string, MemberFeeItem>; // memberId -> MemberFeeItem
  totalAssigned: number;
  totalCollected: number;
  totalMembers: number;
  paidMembersCount: number;
  updatedAt: string;
}


