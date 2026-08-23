export type ActivityType = 'cata' | 'viaje' | 'curso';
export type ActivityStatus = 'proxima' | 'celebrada';
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
  price: number; // en euros (€)
  totalSpots: number;
  bookedSpots: number;
  status: ActivityStatus;
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
  type: string; // e.g. "Blanco", "Tinto", "Espumoso", "AOVE"
  name: string; // e.g. "El Jalbegandero"
  grape?: string; // e.g. "100% Airén"
  pairing?: string; // e.g. "Arroz Meloso con Verduritas y Atún en Escabeche"
  notes?: string;
}

export interface BodegaProductor {
  name: string;
  region: string;
  description?: string;
  enologo?: string;
  colaboradores?: string;
}

export interface CataActivity extends BaseActivity {
  type: 'cata';
  category: CataCategory;
  bodegaProductor: BodegaProductor;
  pairingMenu: PairingMenuItem[];
  wines?: WineDetail[];
  sumiller?: string;
  aove?: string;
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

export interface ReservationFormData {
  fullName: string;
  email: string;
  phone: string;
  spots: number;
  notes?: string;
  membershipNumber?: string;
}
