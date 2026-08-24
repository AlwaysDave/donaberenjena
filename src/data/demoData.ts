import { Activity, Participant, WebMetric, CataActivity } from '../types';

// Helper to generate a batch of mock participants
const generateParticipants = (
  activityId: string,
  activityTitle: string,
  activityDate: string,
  activityType: 'cata' | 'curso' | 'viaje',
  targetSpots: number,
  pricePerSpot: number,
  offset: number = 0,
  archived: boolean = false
): Participant[] => {
  const participants: Participant[] = [];
  let currentSpots = 0;
  let i = 0;
  
  while (currentSpots < targetSpots) {
    const remainingSpots = targetSpots - currentSpots;
    // Every 3rd participant books 2 spots, else 1 spot, ensuring we don't exceed targetSpots
    const spotsToBook = (i % 3 === 0 && remainingSpots >= 2) ? 2 : 1;
    const totalAmount = spotsToBook * pricePerSpot;
    
    participants.push({
      id: `demo-part-${activityId}-${offset + i}`,
      activityId,
      activityTitle,
      activityDate,
      activityType,
      fullName: `Visitante Demo ${offset + i + 1}`,
      email: `demo.user${offset + i + 1}@ejemplo.com`,
      phone: `600 000 ${String(offset + i).padStart(3, '0')}`,
      spots: spotsToBook,
      turn: 'Turno único',
      membershipNumber: i % 4 === 0 ? `SOC-${100 + offset + i}` : '',
      notes: i === 0 ? 'Alergia generada para demo' : '',
      status: archived ? 'asistio' : (i % 5 === 0 ? 'pendiente_pago' : 'confirmada'),
      totalAmount: totalAmount,
      paidAmount: archived ? totalAmount : (i % 5 === 0 ? 0 : totalAmount),
      paymentMethod: i % 2 === 0 ? 'bizum' : 'transferencia',
      registeredAt: new Date(Date.now() - (1000 * 60 * 60 * 24 * (i + 1))).toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    currentSpots += spotsToBook;
    i++;
  }
  
  return participants;
};

export const DEMO_ACTIVITIES: Activity[] = [
  // CATAS (Basadas en los PDFs proporcionados)
  {
    id: 'demo-cata-1-vermut',
    title: "La Hora Magica: CATA DE VERMUT'S",
    subtitle: 'Con Bodegas Lustau, Casa Berger y San Esteban',
    type: 'cata',
    date: '2026-03-01',
    time: '13:00 h',
    price: 20,
    totalSpots: 14,
    bookedSpots: 14,
    location: 'Polígono Industrial "El Salobral" - Centro de Formación – Bolaños de Calatrava',
    images: ['https://images.unsplash.com/photo-1514361892635-6b07e31e75f9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'],
    description: 'Vas a hacer tu propio vermut. Elaboración in situ en la Sala de Catas.',
    category: 'vermut',
    cataType: 'varias_bodegas',
    sumiller: 'Ana García',
    bodegas: [
      {
        name: 'Bodegas Lustau',
        region: 'Jerez de la Frontera – Cadiz',
        wines: [{ type: 'Vermut', name: 'LUSTAU ROJO', grape: 'Pedro Ximenez - Palomino - Palomino Fino', pairing: 'Gilda y un Canape de Ahumados' }]
      },
      {
        name: 'Casa Berger - Democratic Wines',
        region: 'Alt Penedes – Barcelona',
        wines: [{ type: 'Vermut', name: 'EL BANDARRA', grape: '50% Macabeo 50% Xarel-lo', pairing: 'Tosta de Sobrasada con Ralladura de Chocolate Negro, Aceituna Negra rellena de Queso' }]
      },
      {
        name: 'Bodegas San Esteban',
        region: 'Cenicientos - Madrid',
        wines: [{ type: 'Vermut', name: 'VERMUT BODEGAS SAN ESTEBAN', grape: '100 % Moscatel', pairing: 'Oreja a la plancha, gana la tradición y Piña caramelizada' }]
      }
    ],
    status: 'celebrada',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  } as CataActivity,
  {
    id: 'demo-cata-2-terruno',
    title: 'La Expresión del Terruño',
    subtitle: 'Vino Artesano y Ecologico',
    type: 'cata',
    date: '2026-04-10',
    time: '21:00 h',
    price: 20,
    totalSpots: 14,
    bookedSpots: 14,
    location: 'Polígono Industrial "El Salobral" - Centro de Formación – Bolaños de Calatrava',
    images: ['https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'],
    description: 'Especial Colaboracion Bodegueros: Eva Imedio y Venancio Castillo.',
    category: 'vino',
    cataType: 'bodega_unica',
    sumiller: 'Ana García',
    aove: '"Quinto Don Otilio" (Bolaños de Calatrava) - Picual',
    bodegas: [
      {
        name: 'Bodega La Uveja Negra',
        region: 'Carrion de Calatrava – Ciudad real',
        wines: [
          { type: 'Blanco', name: 'El Jalbegandero', grape: '100 % Airen', pairing: 'Arroz Meloso con Veduritas y Atun en Escabeche' },
          { type: 'Tinto', name: 'La Uveja Negra', grape: '100 % Cencibel', pairing: 'Pan Bao de Pollo Especiado y Cebolla Morada' },
          { type: 'Espumoso', name: 'Pomposo', grape: '100 % Airen', pairing: 'Nachos con Guacamoles y Palomitas Dulces' }
        ]
      }
    ],
    status: 'proxima',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  } as CataActivity,
  {
    id: 'demo-cata-3-coloman',
    title: 'Experiencia S.A.T. COLOMAN',
    subtitle: 'Con S.A.T. COLOMAN',
    type: 'cata',
    date: '2026-06-05',
    time: '21:00 h',
    price: 20,
    totalSpots: 14,
    bookedSpots: 7,
    location: 'Polígono Industrial "El Salobral" - Centro de Formación – Bolaños de Calatrava',
    images: ['https://images.unsplash.com/photo-1584916201218-f4242ceb4809?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'],
    description: 'Experiencia con los vinos de S.A.T. COLOMAN.',
    category: 'vino',
    cataType: 'bodega_unica',
    sumiller: 'Ana García',
    aove: '"Dehesa de Almodovar" - AOVE World Cup 2026 - Cornicabra',
    bodegas: [
      {
        name: 'S.A.T. COLOMAN',
        region: 'Pedro Muñoz – Ciudad real',
        wines: [
          { type: 'Blanco', name: 'Pedroteño Airen', grape: '100 % Airen', pairing: 'Tartar de Langostinos, Mango y Citricos sobre Tosta de Ines Rosales' },
          { type: 'Rosado', name: 'Manchegal Rosado de Aguja', grape: '100 % Tempranillo', pairing: 'Crujiente de Alga Nori con Ensalada' },
          { type: 'Tinto', name: 'Pedroteño Tempranillo', grape: '100 % Tempranillo', pairing: 'Galleta de Cacao rellena de Crema de Queso' },
          { type: 'Vino de Licor', name: '5 Tentaciones', grape: '100 % Airen', pairing: 'Higos Secos rellenos de Nuez' }
        ]
      }
    ],
    status: 'proxima',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  } as CataActivity,
  {
    id: 'demo-cata-4-vermut2',
    title: 'LA HORA DEL VERMUT',
    subtitle: 'El Encuentro Mediterraneo y Clásico Reinventado',
    type: 'cata',
    date: '2026-06-21',
    time: '13:00 h',
    price: 20,
    totalSpots: 14,
    bookedSpots: 12,
    location: 'Polígono Industrial "El Salobral" - Centro de Formación – Bolaños de Calatrava',
    images: ['https://images.unsplash.com/photo-1557682250-33bd709cbe85?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'],
    description: 'Durante la cata los asistentes podrán elaborar su propio maridaje de "GILDAS". Opción de comida por 30€.',
    category: 'vermut',
    cataType: 'varias_bodegas',
    sumiller: 'Ana García',
    bodegas: [
      {
        name: 'Bodegas S.A.T. Coloman',
        region: 'Pedro Muñoz – Ciudad Real',
        wines: [{ type: 'Vermut', name: 'VERMUT 5 TENTACIONES', grape: '', pairing: 'Tartar de Fuet con Manzana Verde y Queso' }]
      },
      {
        name: 'Bodegas Martinez Lacuesta',
        region: 'Haro – La Rioja',
        wines: [{ type: 'Vermut', name: 'VERMUT MARTINEZ LACUESTA ROJO', grape: '', pairing: 'Matrimonio sobre Baston Crujiente' }]
      },
      {
        name: 'Bodegas Reconquista',
        region: 'Miguelturra – Ciudad Real',
        wines: [{ type: 'Vermut', name: 'VERMUT RECONQUISTA', grape: '', pairing: 'Brocheta de Azucar Tostada al Fuego y Fruta de Estacion' }]
      }
    ],
    status: 'proxima',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  } as CataActivity,

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
  },
  // CELEBRATED MOCKS
  {
    id: 'demo-curso-3-celebrado',
    title: 'Curso Mockup 3 (Celebrado)',
    subtitle: 'Curso de Sumillería pasado',
    type: 'curso',
    date: '2025-10-15',
    time: '10:00 h',
    price: 150,
    totalSpots: 20,
    bookedSpots: 16,
    location: 'Sede Formación',
    images: ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'],
    description: 'Curso intensivo de hace un año, con 80% ocupación.',
    theme: 'Sumillería',
    chef: { name: 'Chef Test', bio: 'Bio' },
    syllabus: ['Intro', 'Advanced'],
    includesTasting: true,
    status: 'celebrada',
    createdAt: new Date('2025-08-01').toISOString(),
    updatedAt: new Date('2025-10-16').toISOString()
  },
  {
    id: 'demo-viaje-3-celebrado',
    title: 'Viaje Mockup 3 (Celebrado)',
    subtitle: 'Ruta Enológica pasada',
    type: 'viaje',
    date: '2025-11-15',
    time: '08:00 h',
    price: 350,
    totalSpots: 40,
    bookedSpots: 36,
    location: 'Rioja Alavesa',
    images: ['https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'],
    description: 'Viaje pasado con 90% ocupación.',
    destination: 'Rioja Alavesa',
    durationDays: 3,
    itinerary: [],
    includedServices: ['Hotel', 'Transporte'],
    status: 'celebrada',
    createdAt: new Date('2025-09-01').toISOString(),
    updatedAt: new Date('2025-11-20').toISOString()
  }
];

export const DEMO_PARTICIPANTS: Participant[] = [
  ...generateParticipants('demo-cata-1-vermut', "La Hora Magica: CATA DE VERMUT'S", '2026-03-01', 'cata', 14, 20, 0, true),
  ...generateParticipants('demo-cata-2-terruno', 'La Expresión del Terruño', '2026-04-10', 'cata', 14, 20, 100),
  ...generateParticipants('demo-cata-3-coloman', 'Experiencia S.A.T. COLOMAN', '2026-06-05', 'cata', 7, 20, 200),
  ...generateParticipants('demo-cata-4-vermut2', 'LA HORA DEL VERMUT', '2026-06-21', 'cata', 12, 20, 300),
  ...generateParticipants('demo-curso-1-lleno', 'Curso Mockup 1 (Lleno)', '2026-10-15', 'curso', 16, 150, 400),
  ...generateParticipants('demo-viaje-1-lleno', 'Viaje Mockup 1 (Lleno)', '2026-11-15', 'viaje', 25, 350, 500),
  ...generateParticipants('demo-curso-3-celebrado', 'Curso Mockup 3 (Celebrado)', '2025-10-15', 'curso', 16, 150, 600, true),
  ...generateParticipants('demo-viaje-3-celebrado', 'Viaje Mockup 3 (Celebrado)', '2025-11-15', 'viaje', 36, 350, 700, true)
];

export const DEMO_METRICS: WebMetric = {
  pageViewsThisMonth: 12540,
  uniqueVisitorsThisMonth: 4200,
  activeReservationsCount: 100, // Total number
  occupancyRateAverage: 75,
  topVisitedActivities: [
    { id: 'demo-cata-1-vermut', title: "La Hora Magica: CATA DE VERMUT'S", type: 'cata', views: 3450 },
    { id: 'demo-viaje-1-lleno', title: 'Viaje Mockup 1 (Lleno)', type: 'viaje', views: 2100 },
    { id: 'demo-curso-1-lleno', title: 'Curso Mockup 1 (Lleno)', type: 'curso', views: 1800 }
  ]
};
