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
  date: string; // e.g. "2026-04-10"
  time?: string; // e.g. "20:30 h"
  priceMember: number; // Precio para socios (€)
  priceNonMember: number; // Precio para no socios (€)
  totalSpots: number;
  bookedSpots: number;
  status: ActivityStatus;
  registrationStatus?: RegistrationStatus; // 'abierta' o 'cerrada'
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
}

export type ParticipantStatus = 'confirmada' | 'pendiente_pago' | 'cancelada' | 'asistio' | 'no_asistio' | 'lista_de_espera';

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
  groupId: string;
  turn?: string;
  membershipNumber?: string;
  notes?: string;
  status: ParticipantStatus;
  attended?: boolean;
  justified?: boolean; // Justificación para cancelación o no asistencia
  justificationReason?: string;
  justifiedBy?: string;
  justifiedAt?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  refundAmount?: number;
  attendedAt?: string;
  attendedBy?: string;
  spotsCount?: number;
  totalAmount: number;
  paidAmount?: number;
  paymentMethod: PaymentMethod;
  registeredAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  activityInterest?: string;
  read: boolean;
  status: 'nuevo' | 'leido' | 'respondido';
  createdAt: string;
  repliedAt?: string;
  replyNotes?: string;
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

