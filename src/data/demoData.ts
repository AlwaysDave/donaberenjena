import { Activity, Participant, WebMetric } from '../types';

// Helper to generate a batch of mock participants
const generateParticipants = (
  activityId: string,
  activityTitle: string,
  activityDate: string,
  activityType: 'cata' | 'curso' | 'viaje',
  count: number,
  offset: number = 0,
  archived: boolean = false
): Participant[] => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `demo-part-${activityId}-${offset + i}`,
    activityId,
    activityTitle,
    activityDate,
    activityType,
    fullName: `Visitante Demo ${offset + i + 1}`,
    email: `demo.user${offset + i + 1}@ejemplo.com`,
    phone: `600 000 ${String(offset + i).padStart(3, '0')}`,
    spots: 1,
    turn: 'Turno 1',
    membershipNumber: i % 4 === 0 ? `SOC-${100 + offset + i}` : '',
    notes: i === 0 ? 'Alergia generada para demo' : '',
    status: archived ? 'asistio' : (i % 5 === 0 ? 'pendiente_pago' : 'confirmada'),
    totalAmount: 40,
    paidAmount: archived ? 40 : (i % 5 === 0 ? 0 : 40),
    paymentMethod: i % 2 === 0 ? 'bizum' : 'transferencia',
    registeredAt: new Date(Date.now() - (1000 * 60 * 60 * 24 * (i + 1))).toISOString(),
    updatedAt: new Date().toISOString()
  }));
};

export const DEMO_ACTIVITIES: Activity[] = [
  // CATAS
  {
    id: 'demo-cata-1-llena',
    title: 'Cata Mockup 1 (Llena - Activa)',
    subtitle: '100% Ocupación',
    type: 'cata',
    date: '2026-09-10',
    time: '20:00 h',
    price: 40,
    totalSpots: 24,
    bookedSpots: 24,
    location: 'Sede Principal',
    images: ['https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'],
    description: 'Cata de demostración con aforo completo.',
    category: 'vino',
    status: 'proxima',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'demo-cata-2-archivada',
    title: 'Cata Mockup 2 (Llena - Archivada)',
    subtitle: 'Evento ya finalizado',
    type: 'cata',
    date: '2026-07-15',
    time: '19:00 h',
    price: 35,
    totalSpots: 20,
    bookedSpots: 20,
    location: 'Sede Principal',
    images: ['https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'],
    description: 'Cata archivada con asistencia completa.',
    category: 'vino',
    status: 'celebrada',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'demo-cata-3-media',
    title: 'Cata Mockup 3 (50% Ocupación)',
    subtitle: '12 Reservas de 24',
    type: 'cata',
    date: '2026-09-20',
    time: '20:00 h',
    price: 50,
    totalSpots: 24,
    bookedSpots: 12,
    location: 'Sede Principal',
    images: ['https://images.unsplash.com/photo-1584916201218-f4242ceb4809?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'],
    description: 'Cata con ocupación media.',
    category: 'vino',
    status: 'proxima',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'demo-cata-4-baja',
    title: 'Cata Mockup 4 (Baja Ocupación)',
    subtitle: '3 Reservas de 20',
    type: 'cata',
    date: '2026-10-05',
    time: '19:30 h',
    price: 45,
    totalSpots: 20,
    bookedSpots: 3,
    location: 'Sede Principal',
    images: ['https://images.unsplash.com/photo-1557682250-33bd709cbe85?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'],
    description: 'Cata con baja ocupación.',
    category: 'vino',
    status: 'proxima',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // CURSOS
  {
    id: 'demo-curso-1-lleno',
    title: 'Curso Mockup 1 (Lleno)',
    subtitle: 'Curso de Sumillería completo',
    type: 'curso',
    date: '2026-10-15',
    time: '10:00 h',
    price: 150,
    totalSpots: 16,
    bookedSpots: 16,
    location: 'Sede Formación',
    images: ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'],
    description: 'Curso intensivo lleno.',
    theme: 'Sumillería',
    chef: { name: 'Chef Test', bio: 'Bio' },
    syllabus: ['Intro', 'Advanced'],
    includesTasting: true,
    status: 'proxima',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'demo-curso-2-vacio',
    title: 'Curso Mockup 2 (Vacío)',
    subtitle: 'Sin reservas',
    type: 'curso',
    date: '2026-11-01',
    time: '11:00 h',
    price: 120,
    totalSpots: 16,
    bookedSpots: 0,
    location: 'Sede Formación',
    images: ['https://images.unsplash.com/photo-1556910103-1c02745aae4d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'],
    description: 'Curso programado sin reservas aún.',
    theme: 'Cocina',
    chef: { name: 'Chef Test 2', bio: 'Bio 2' },
    syllabus: ['Módulo 1'],
    includesTasting: false,
    status: 'proxima',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // VIAJES
  {
    id: 'demo-viaje-1-lleno',
    title: 'Viaje Mockup 1 (Lleno)',
    subtitle: 'Ruta Enológica completa',
    type: 'viaje',
    date: '2026-11-15',
    time: '08:00 h',
    price: 350,
    totalSpots: 25,
    bookedSpots: 25,
    location: 'Rioja Alavesa',
    images: ['https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'],
    description: 'Viaje completo.',
    destination: 'Rioja Alavesa',
    durationDays: 3,
    itinerary: [],
    includedServices: ['Hotel', 'Transporte'],
    status: 'proxima',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'demo-viaje-2-vacio',
    title: 'Viaje Mockup 2 (Vacío)',
    subtitle: 'Sin reservas',
    type: 'viaje',
    date: '2026-12-05',
    time: '09:00 h',
    price: 400,
    totalSpots: 25,
    bookedSpots: 0,
    location: 'Ribera del Duero',
    images: ['https://images.unsplash.com/photo-1560493676-04071c5f467b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'],
    description: 'Viaje recién publicado.',
    destination: 'Ribera del Duero',
    durationDays: 2,
    itinerary: [],
    includedServices: ['Bus'],
    status: 'proxima',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const DEMO_PARTICIPANTS: Participant[] = [
  ...generateParticipants('demo-cata-1-llena', 'Cata Mockup 1 (Llena - Activa)', '2026-09-10', 'cata', 24, 0),
  ...generateParticipants('demo-cata-2-archivada', 'Cata Mockup 2 (Llena - Archivada)', '2026-07-15', 'cata', 20, 100, true),
  ...generateParticipants('demo-cata-3-media', 'Cata Mockup 3 (50% Ocupación)', '2026-09-20', 'cata', 12, 200),
  ...generateParticipants('demo-cata-4-baja', 'Cata Mockup 4 (Baja Ocupación)', '2026-10-05', 'cata', 3, 300),
  ...generateParticipants('demo-curso-1-lleno', 'Curso Mockup 1 (Lleno)', '2026-10-15', 'curso', 16, 400),
  ...generateParticipants('demo-viaje-1-lleno', 'Viaje Mockup 1 (Lleno)', '2026-11-15', 'viaje', 25, 500)
];

export const DEMO_METRICS: WebMetric = {
  pageViewsThisMonth: 12540,
  uniqueVisitorsThisMonth: 4200,
  activeReservationsCount: 100, // Total number
  occupancyRateAverage: 75,
  topVisitedActivities: [
    { id: 'demo-cata-1-llena', title: 'Cata Mockup 1 (Llena - Activa)', type: 'cata', views: 3450 },
    { id: 'demo-viaje-1-lleno', title: 'Viaje Mockup 1 (Lleno)', type: 'viaje', views: 2100 },
    { id: 'demo-curso-1-lleno', title: 'Curso Mockup 1 (Lleno)', type: 'curso', views: 1800 }
  ]
};
