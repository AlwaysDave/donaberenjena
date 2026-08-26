import { Activity, Participant, WebMetric, CataActivity, Member, AdminNotification, ContactMessage, ParticipantStatus } from '../types';

// ==========================================
// 1. BASE DE PERSONAS REALISTAS Y FIJAS
// ==========================================
interface BasePerson {
  fullName: string;
  email?: string;
  phone?: string;
  isMember: boolean;
  membershipNumber?: string;
}

const BASE_PEOPLE: BasePerson[] = [
  { fullName: 'María José Fernández Ruiz', email: 'mariajose.fernandez@example.com', phone: '611 222 001', isMember: true, membershipNumber: 'SOC-001' },
  { fullName: 'Antonio Sánchez Gómez', email: 'antonio.sanchez@example.com', phone: '611 222 002', isMember: true, membershipNumber: 'SOC-002' },
  { fullName: 'Laura Martínez López', email: 'laura.martinez@example.com', phone: '611 222 003', isMember: false },
  { fullName: 'Javier Rodríguez Pérez', email: 'javier.rodriguez@example.com', phone: '611 222 004', isMember: false },
  { fullName: 'Carmen Jiménez Díaz', email: 'carmen.jimenez@example.com', phone: '611 222 005', isMember: true, membershipNumber: 'SOC-003' },
  { fullName: 'Francisco Torres Molina', email: 'francisco.torres@example.com', phone: '611 222 006', isMember: true, membershipNumber: 'SOC-004' },
  { fullName: 'Isabel Romero Navarro', email: 'isabel.romero@example.com', phone: '611 222 007', isMember: true, membershipNumber: 'SOC-005' },
  { fullName: 'Manuel Ortega Castillo', email: 'manuel.ortega@example.com', phone: '611 222 008', isMember: false },
  { fullName: 'Pilar Gutiérrez Serrano', email: 'pilar.gutierrez@example.com', phone: '611 222 009', isMember: false },
  { fullName: 'David Muñoz Cabrera', email: 'david.munoz@example.com', phone: '611 222 010', isMember: true, membershipNumber: 'SOC-006' },
  { fullName: 'Rocío Delgado Vega', email: 'rocio.delgado@example.com', phone: '611 222 011', isMember: false },
  { fullName: 'Alberto Ramírez Flores', email: 'alberto.ramirez@example.com', phone: '611 222 012', isMember: true, membershipNumber: 'SOC-007' },
  { fullName: 'Cristina Herrera Reyes', email: 'cristina.herrera@example.com', phone: '611 222 013', isMember: true, membershipNumber: 'SOC-008' },
  { fullName: 'Sergio Guerrero Pascual', email: 'sergio.guerrero@example.com', phone: '611 222 014', isMember: true, membershipNumber: 'SOC-009' },
  { fullName: 'Elena Cortés Iglesias', email: 'elena.cortes@example.com', phone: '611 222 015', isMember: false },
  { fullName: 'Pablo Vázquez Santos', email: 'pablo.vazquez@example.com', phone: '611 222 016', isMember: false },
  { fullName: 'Marta Cano Rubio', email: 'marta.cano@example.com', phone: '611 222 017', isMember: false },
  { fullName: 'Rubén Domínguez Blanco', email: 'ruben.dominguez@example.com', phone: '611 222 018', isMember: false },
  { fullName: 'Nuria Marín Gallego', email: 'nuria.marin@example.com', phone: '611 222 019', isMember: false },
  // Diego Aguilar Bravo: marcado como socio en su reserva pero NO está en censo para demostrar aviso
  { fullName: 'Diego Aguilar Bravo', email: 'diego.aguilar@example.com', phone: '611 222 020', isMember: true },
  // Variantes para detección de duplicados con IA:
  { fullName: 'José Antonio García López', email: 'jose.garcia@example.com', phone: '611 222 021', isMember: false },
  { fullName: 'Jose A. Garcia Lopez', isMember: false }
];

// ==========================================
// 2. ACTIVIDADES DE DEMO REALISTAS
// ==========================================
export const DEMO_ACTIVITIES: Activity[] = [
  // CATAS EXISTENTES BASADAS EN PDFS REALES (BOLAÑOS DE CALATRAVA)
  {
    id: 'demo-cata-1-vermut',
    title: "La Hora Magica: CATA DE VERMUT'S",
    subtitle: 'Con Bodegas Lustau, Casa Berger y San Esteban',
    type: 'cata',
    date: '2026-03-01',
    time: '13:00 h',
    
    priceMember: 20,
    priceNonMember: 25,
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
    createdAt: new Date('2026-01-15').toISOString(),
    updatedAt: new Date('2026-03-02').toISOString()
  } as CataActivity,
  {
    id: 'demo-cata-2-terruno',
    title: 'La Expresión del Terruño',
    subtitle: 'Vino Artesano y Ecologico',
    type: 'cata',
    date: '2026-04-10',
    time: '21:00 h',
    
    priceMember: 20,
    priceNonMember: 25,
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
    createdAt: new Date('2026-02-01').toISOString(),
    updatedAt: new Date().toISOString()
  } as CataActivity,
  {
    id: 'demo-cata-3-coloman',
    title: 'Experiencia S.A.T. COLOMAN',
    subtitle: 'Con S.A.T. COLOMAN',
    type: 'cata',
    date: '2026-06-05',
    time: '21:00 h',
    
    priceMember: 20,
    priceNonMember: 25,
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
    createdAt: new Date('2026-02-15').toISOString(),
    updatedAt: new Date().toISOString()
  } as CataActivity,
  {
    id: 'demo-cata-4-vermut2',
    title: 'LA HORA DEL VERMUT',
    subtitle: 'El Encuentro Mediterraneo y Clásico Reinventado',
    type: 'cata',
    date: '2026-06-21',
    time: '13:00 h',
    
    priceMember: 20,
    priceNonMember: 25,
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
    createdAt: new Date('2026-03-01').toISOString(),
    updatedAt: new Date().toISOString()
  } as CataActivity,

  // CURSO 1: Próximo, ocupado
  {
    id: 'demo-curso-1-lleno',
    title: 'Cocina en Vivo: Producto de Cercanía',
    subtitle: 'Un menú completo con ingredientes de la Comarca de Calatrava',
    type: 'curso',
    date: '2026-10-15',
    time: '10:00 h',
    
    priceMember: 50,
    priceNonMember: 65,
    totalSpots: 16,
    bookedSpots: 14,
    location: 'Polígono Industrial "El Salobral" - Centro de Formación – Bolaños de Calatrava',
    images: ['https://images.unsplash.com/photo-1556910103-1c02745aae4d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'],
    description: 'Aprende a elaborar un menú completo maridado con vinos de la tierra, utilizando el mejor producto de la huerta y ganadería de Calatrava.',
    theme: 'Cocina de temporada',
    chef: {
      name: 'Rafael Peláez',
      bio: 'Chef manchego con más de 15 años en cocina de mercado, formado en el Basque Culinary Center',
      restaurant: 'Restaurante El Yantar (Bolaños de Calatrava)'
    },
    syllabus: [
      'Fondos y bases de cocina tradicional',
      'Elaboración de un menú de 3 platos con producto local',
      'Técnicas de emplatado',
      'Maridaje del menú con vinos de la zona'
    ],
    includesTasting: true,
    status: 'proxima',
    createdAt: new Date('2026-04-01').toISOString(),
    updatedAt: new Date().toISOString()
  },

  // CURSO 2: Próximo, recién publicado, vacío
  {
    id: 'demo-curso-2-vacio',
    title: 'Taller de Conservas y Encurtidos Tradicionales',
    subtitle: 'Aprende a conservar la huerta manchega para todo el año',
    type: 'curso',
    date: '2026-11-01',
    time: '11:00 h',
    
    priceMember: 30,
    priceNonMember: 40,
    totalSpots: 16,
    bookedSpots: 0,
    location: 'Centro de Formación – Bolaños de Calatrava',
    images: ['https://images.unsplash.com/photo-1540420773420-3366772f4999?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'],
    description: 'Aprende las técnicas tradicionales y seguras para encurtir y embotar verduras, berenjenas y hortalizas de temporada.',
    theme: 'Conservación de alimentos',
    chef: {
      name: 'Encarna Molina',
      bio: 'Cocinera y divulgadora especializada en recuperación de recetas tradicionales de Castilla-La Mancha'
    },
    syllabus: [
      'Escabeches y encurtidos',
      'Mermeladas y conservas dulces',
      'Conservación al vacío y en aceite',
      'Etiquetado y conservación segura'
    ],
    includesTasting: false,
    status: 'proxima',
    createdAt: new Date('2026-04-10').toISOString(),
    updatedAt: new Date().toISOString()
  },

  // CURSO 3: Celebrado (Pasado)
  {
    id: 'demo-curso-3-celebrado',
    title: 'Masterclass de Maridaje: Vino y Quesos Manchegos',
    subtitle: 'Una tarde dedicada a los quesos de Castilla-La Mancha y su maridaje',
    type: 'curso',
    date: '2025-10-15',
    time: '18:00 h',
    
    priceMember: 25,
    priceNonMember: 35,
    totalSpots: 20,
    bookedSpots: 17,
    location: 'Polígono Industrial "El Salobral" - Centro de Formación – Bolaños de Calatrava',
    images: ['https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'],
    description: 'Recorrido sensorial por las distintas curaciones del queso artesano manchego y su armonía perfecta con vinos locales.',
    theme: 'Maridaje',
    chef: {
      name: 'Ana García',
      bio: 'Sumiller de la Asociación Doña Berenjena'
    },
    syllabus: [
      'Tipos de queso manchego y su curación',
      'Maridaje con vinos blancos y tintos jóvenes',
      'Maridaje con vinos generosos'
    ],
    includesTasting: true,
    status: 'celebrada',
    createdAt: new Date('2025-08-10').toISOString(),
    updatedAt: new Date('2025-10-16').toISOString()
  },

  // VIAJE 1: Próximo, ocupado
  {
    id: 'demo-viaje-1-lleno',
    title: 'Ruta Enológica por la Ribera del Guadiana',
    subtitle: 'Dos días de bodegas, gastronomía y patrimonio en Extremadura',
    type: 'viaje',
    date: '2026-11-15',
    time: '08:00 h',
    
    priceMember: 150,
    priceNonMember: 180,
    totalSpots: 25,
    bookedSpots: 22,
    location: 'Salida: Plaza de España (Bolaños de Calatrava)',
    images: ['https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'],
    description: 'Fin de semana descubriendo los singulares viñedos y bodegas de Extremadura, maridados con la gastronomía de la dehesa.',
    destination: 'Ribera del Guadiana, Badajoz',
    durationDays: 2,
    itinerary: [
      {
        day: 1,
        title: 'Salida y bodega histórica',
        description: 'Salida desde Bolaños de Calatrava, visita y cata en una bodega centenaria, comida típica extremeña.',
        highlights: ['Cata guiada', 'Comida típica', 'Visita a viñedo centenario']
      },
      {
        day: 2,
        title: 'Ruta del queso y regreso',
        description: 'Visita a una quesería artesanal, paseo por el casco histórico de Almendralejo, comida de despedida y regreso.',
        highlights: ['Quesería artesanal', 'Casco histórico', 'Comida de despedida']
      }
    ],
    includedServices: ['Autobús ida y vuelta', '1 noche de hotel', '2 comidas', '2 catas guiadas'],
    status: 'proxima',
    createdAt: new Date('2026-03-20').toISOString(),
    updatedAt: new Date().toISOString()
  },

  // VIAJE 2: Próximo, recién publicado, vacío
  {
    id: 'demo-viaje-2-vacio',
    title: 'Escapada a Jerez: Bodegas y Flamenco',
    subtitle: 'Tres días en la cuna del vino de Jerez',
    type: 'viaje',
    date: '2026-12-05',
    time: '07:30 h',
    
    priceMember: 280,
    priceNonMember: 320,
    totalSpots: 25,
    bookedSpots: 0,
    location: 'Salida: Plaza de España (Bolaños de Calatrava)',
    images: ['https://images.unsplash.com/photo-1560493676-04071c5f467b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'],
    description: 'Viaje experiencial por el marco de Jerez: arquitectura bodeguera, criaderas y soleras, arte flamenco y gastronomía gaditana.',
    destination: 'Jerez de la Frontera, Cádiz',
    durationDays: 3,
    itinerary: [
      {
        day: 1,
        title: 'Llegada y bodega Lustau',
        description: 'Llegada, visita a Bodegas Lustau con cata de finos y amontillados.',
        highlights: ['Cata de finos', 'Bodega histórica']
      },
      {
        day: 2,
        title: 'Jerez tradicional',
        description: 'Mercado central, ruta de tapas, espectáculo de flamenco por la noche.',
        highlights: ['Ruta de tapas', 'Espectáculo de flamenco']
      },
      {
        day: 3,
        title: 'Sanlúcar y regreso',
        description: 'Visita a Sanlúcar de Barrameda, cata de manzanilla junto al mar, comida de despedida y regreso.',
        highlights: ['Cata de manzanilla', 'Paseo por Sanlúcar']
      }
    ],
    includedServices: ['Autobús ida y vuelta', '2 noches de hotel', '3 comidas', 'Entrada a espectáculo de flamenco'],
    status: 'proxima',
    createdAt: new Date('2026-04-12').toISOString(),
    updatedAt: new Date().toISOString()
  },

  // VIAJE 3: Celebrado (Pasado)
  {
    id: 'demo-viaje-3-celebrado',
    title: 'Ruta del Aceite: Sierra de Segura',
    subtitle: 'Un día entre olivares centenarios',
    type: 'viaje',
    date: '2025-11-15',
    time: '08:30 h',
    
    priceMember: 40,
    priceNonMember: 55,
    totalSpots: 40,
    bookedSpots: 36,
    location: 'Salida: Plaza de España (Bolaños de Calatrava)',
    images: ['https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'],
    description: 'Excursión de un día para conocer la recolección y extracción de los mejores aceites de oliva virgen extra de montaña.',
    destination: 'Sierra de Segura, Jaén',
    durationDays: 1,
    itinerary: [
      {
        day: 1,
        title: 'Olivares y almazara',
        description: 'Visita a un olivar centenario, proceso de extracción en almazara tradicional, cata de aceites con maridaje, comida campera.',
        highlights: ['Cata de AOVE', 'Almazara tradicional', 'Comida campera']
      }
    ],
    includedServices: ['Autobús ida y vuelta', 'Comida campera', 'Cata de aceites'],
    status: 'celebrada',
    createdAt: new Date('2025-09-01').toISOString(),
    updatedAt: new Date('2025-11-16').toISOString()
  }
];

// ==========================================
// 3. GENERACIÓN REALISTA DE PARTICIPANTES
// ==========================================
// Reutiliza coherentemente la lista fija para que la misma persona aparezca
// en múltiples eventos de distintos tipos, con fidelidad medible.

function buildParticipant(
  activity: Activity,
  person: BasePerson,
  index: number,
  options: {
    status?: ParticipantStatus;
    attended?: boolean;
    justified?: boolean;
    justificationReason?: string;
    groupId?: string;
    spotsCount?: number;
    notes?: string;
    registeredDaysAgo?: number;
  } = {}
): Participant {
  const isMember = person.isMember;
  const unitPrice = (isMember && activity.priceMember) ? activity.priceMember : activity.priceNonMember;
  const isPast = activity.status === 'celebrada';
  const attended = options.attended ?? (options.status === 'cancelada' || options.status === 'no_asistio' ? false : isPast);
  const status = options.status ?? (isPast ? 'asistio' : (index % 4 === 0 ? 'pendiente_pago' : 'confirmada'));
  const daysAgo = options.registeredDaysAgo ?? (index + 2);
  const regDateIso = new Date(Date.now() - (1000 * 60 * 60 * 24 * daysAgo)).toISOString();

  return {
    id: `part-${activity.id}-${index + 1}`,
    activityId: activity.id,
    activityTitle: activity.title,
    activityDate: activity.date,
    activityType: activity.type,
    fullName: person.fullName,
    email: person.email || `usuario${index + 1}@example.com`,
    phone: person.phone || `600 000 00${index + 1}`,
    isMember,
    membershipNumber: isMember ? person.membershipNumber : undefined,
    groupId: options.groupId || `grp-${activity.id}-${index + 1}`,
    spotsCount: options.spotsCount || 1,
    turn: 'Turno único',
    notes: options.notes,
    status,
    attended,
    justified: options.justified,
    justificationReason: options.justificationReason,
    totalAmount: unitPrice * (options.spotsCount || 1),
    paidAmount: (status === 'pendiente_pago' || status === 'lista_de_espera' || status === 'cancelada') ? 0 : unitPrice * (options.spotsCount || 1),
    paymentMethod: status === 'lista_de_espera' ? 'pendiente' : (index % 2 === 0 ? 'bizum' : 'transferencia'),
    registeredAt: regDateIso,
    createdAt: regDateIso,
    updatedAt: new Date().toISOString()
  };
}

export const DEMO_PARTICIPANTS: Participant[] = [
  // --- CATA 1 (Celebrada - Vermut: Asistentes reales, 2 cancelaciones y 1 no asistencia) ---
  buildParticipant(DEMO_ACTIVITIES[0], BASE_PEOPLE[0], 0, { status: 'asistio', attended: true }),  // María José (Socia)
  buildParticipant(DEMO_ACTIVITIES[0], BASE_PEOPLE[1], 1, { status: 'asistio', attended: true, groupId: 'grp-antonio-vermut' }), // Antonio (Socio) - Titular grupo
  buildParticipant(DEMO_ACTIVITIES[0], { fullName: 'Elena Gómez (Acompañante)', isMember: true }, 2, { status: 'asistio', attended: true, groupId: 'grp-antonio-vermut' }), // Acompañante
  buildParticipant(DEMO_ACTIVITIES[0], BASE_PEOPLE[2], 3, { status: 'asistio', attended: true }),  // Laura Martínez
  buildParticipant(DEMO_ACTIVITIES[0], BASE_PEOPLE[4], 4, { status: 'asistio', attended: true }),  // Carmen Jiménez (Socia)
  buildParticipant(DEMO_ACTIVITIES[0], BASE_PEOPLE[5], 5, { status: 'asistio', attended: true }),  // Francisco Torres (Socio)
  buildParticipant(DEMO_ACTIVITIES[0], BASE_PEOPLE[6], 6, { status: 'asistio', attended: true }),  // Isabel Romero (Socia)
  // 1. Cancelación justificada con preaviso:
  buildParticipant(DEMO_ACTIVITIES[0], BASE_PEOPLE[7], 7, { 
    status: 'cancelada', 
    attended: false, 
    justified: true, 
    justificationReason: 'Avisó con 48h de antelación por motivos médicos justificados.',
    notes: 'Cancelación con preaviso' 
  }), // Manuel Ortega
  // 2. Cancelación no justificada (mismo día):
  buildParticipant(DEMO_ACTIVITIES[0], BASE_PEOPLE[8], 8, { 
    status: 'cancelada', 
    attended: false, 
    justified: false, 
    justificationReason: 'Canceló 2 horas antes del inicio sin causa de fuerza mayor.',
    notes: 'Baja de última hora' 
  }), // Pilar Gutiérrez
  buildParticipant(DEMO_ACTIVITIES[0], BASE_PEOPLE[9], 9, { status: 'asistio', attended: true }),  // David Muñoz (Socio)
  // 3. No asistencia (se apuntó pero no acudió ni avisó):
  buildParticipant(DEMO_ACTIVITIES[0], BASE_PEOPLE[10], 10, { 
    status: 'no_asistio', 
    attended: false, 
    justified: false, 
    justificationReason: 'No acudió a la sala de catas ni notificó su ausencia.',
    notes: 'No presentado en sala' 
  }), // Rocío Delgado
  buildParticipant(DEMO_ACTIVITIES[0], BASE_PEOPLE[11], 11, { status: 'asistio', attended: true }), // Alberto Ramírez (Socio)
  buildParticipant(DEMO_ACTIVITIES[0], BASE_PEOPLE[12], 12, { status: 'asistio', attended: true }), // Cristina Herrera (Socia)
  // Asistente adicional para aforo completo de los que estuvieron:
  buildParticipant(DEMO_ACTIVITIES[0], BASE_PEOPLE[20], 13, { status: 'asistio', attended: true }), // José Antonio García López

  // --- CATA 2 (Próxima - Terruño: 14 asistentes confirmados + 4 en lista de espera) ---
  buildParticipant(DEMO_ACTIVITIES[1], BASE_PEOPLE[0], 0),  // María José (Socia)
  buildParticipant(DEMO_ACTIVITIES[1], BASE_PEOPLE[1], 1),  // Antonio (Socio)
  buildParticipant(DEMO_ACTIVITIES[1], BASE_PEOPLE[2], 2),  // Laura Martínez
  buildParticipant(DEMO_ACTIVITIES[1], BASE_PEOPLE[3], 3),  // Javier Rodríguez
  buildParticipant(DEMO_ACTIVITIES[1], BASE_PEOPLE[4], 4),  // Carmen Jiménez (Socia)
  buildParticipant(DEMO_ACTIVITIES[1], BASE_PEOPLE[5], 5),  // Francisco Torres (Socio)
  buildParticipant(DEMO_ACTIVITIES[1], BASE_PEOPLE[6], 6),  // Isabel Romero (Socia)
  buildParticipant(DEMO_ACTIVITIES[1], BASE_PEOPLE[13], 7), // Sergio Guerrero (Socio)
  buildParticipant(DEMO_ACTIVITIES[1], BASE_PEOPLE[14], 8), // Elena Cortés
  buildParticipant(DEMO_ACTIVITIES[1], BASE_PEOPLE[15], 9), // Pablo Vázquez
  buildParticipant(DEMO_ACTIVITIES[1], BASE_PEOPLE[16], 10), // Marta Cano
  buildParticipant(DEMO_ACTIVITIES[1], BASE_PEOPLE[17], 11), // Rubén Domínguez
  buildParticipant(DEMO_ACTIVITIES[1], BASE_PEOPLE[18], 12), // Nuria Marín
  buildParticipant(DEMO_ACTIVITIES[1], BASE_PEOPLE[12], 13), // Cristina Herrera (Socia)
  // 4 personas en lista de espera para probar el funcionamiento:
  buildParticipant(DEMO_ACTIVITIES[1], { fullName: 'Fernando Gómez Almansa', email: 'fernando.gomez@example.com', phone: '622 333 401', isMember: false }, 14, { status: 'lista_de_espera', notes: 'Lista de espera - 1 plaza. Disponible cualquier turno.' }),
  buildParticipant(DEMO_ACTIVITIES[1], { fullName: 'Beatriz Serrano Molina', email: 'beatriz.serrano@example.com', phone: '622 333 402', isMember: true, membershipNumber: 'SOC-010' }, 15, { status: 'lista_de_espera', notes: 'Lista de espera preferente socia (SOC-010)' }),
  buildParticipant(DEMO_ACTIVITIES[1], { fullName: 'Carlos Morales Pardo', email: 'carlos.morales@example.com', phone: '622 333 403', isMember: false }, 16, { status: 'lista_de_espera', notes: 'Lista de espera - Interesado si se produce alguna baja.' }),
  buildParticipant(DEMO_ACTIVITIES[1], { fullName: 'Sonia Navarro Gil', email: 'sonia.navarro@example.com', phone: '622 333 404', isMember: false }, 17, { status: 'lista_de_espera', notes: 'Lista de espera - Avisar preferentemente por WhatsApp.' }),

  // --- CATA 3 (Próxima - Coloman 7 asistentes) ---
  buildParticipant(DEMO_ACTIVITIES[2], BASE_PEOPLE[0], 0),  // María José (Socia)
  buildParticipant(DEMO_ACTIVITIES[2], BASE_PEOPLE[4], 1),  // Carmen Jiménez (Socia)
  buildParticipant(DEMO_ACTIVITIES[2], BASE_PEOPLE[6], 2),  // Isabel Romero (Socia)
  buildParticipant(DEMO_ACTIVITIES[2], BASE_PEOPLE[8], 3),  // Pilar Gutiérrez
  buildParticipant(DEMO_ACTIVITIES[2], BASE_PEOPLE[9], 4),  // David Muñoz (Socio)
  buildParticipant(DEMO_ACTIVITIES[2], BASE_PEOPLE[10], 5), // Rocío Delgado
  buildParticipant(DEMO_ACTIVITIES[2], BASE_PEOPLE[11], 6), // Alberto Ramírez (Socio)

  // --- CATA 4 (Próxima - Vermut 2, 12 asistentes) ---
  buildParticipant(DEMO_ACTIVITIES[3], BASE_PEOPLE[1], 0),  // Antonio Sánchez (Socio)
  buildParticipant(DEMO_ACTIVITIES[3], BASE_PEOPLE[2], 1),  // Laura Martínez
  buildParticipant(DEMO_ACTIVITIES[3], BASE_PEOPLE[3], 2),  // Javier Rodríguez
  buildParticipant(DEMO_ACTIVITIES[3], BASE_PEOPLE[5], 3),  // Francisco Torres (Socio)
  buildParticipant(DEMO_ACTIVITIES[3], BASE_PEOPLE[7], 4),  // Manuel Ortega
  buildParticipant(DEMO_ACTIVITIES[3], BASE_PEOPLE[13], 5), // Sergio Guerrero (Socio)
  buildParticipant(DEMO_ACTIVITIES[3], BASE_PEOPLE[14], 6), // Elena Cortés
  buildParticipant(DEMO_ACTIVITIES[3], BASE_PEOPLE[15], 7), // Pablo Vázquez
  buildParticipant(DEMO_ACTIVITIES[3], BASE_PEOPLE[16], 8), // Marta Cano
  buildParticipant(DEMO_ACTIVITIES[3], BASE_PEOPLE[17], 9), // Rubén Domínguez
  buildParticipant(DEMO_ACTIVITIES[3], BASE_PEOPLE[18], 10), // Nuria Marín
  buildParticipant(DEMO_ACTIVITIES[3], BASE_PEOPLE[0], 11), // María José (Socia)

  // --- CURSO 1: Cocina en Vivo (14 asistentes) ---
  buildParticipant(DEMO_ACTIVITIES[4], BASE_PEOPLE[0], 0),  // María José (Socia)
  buildParticipant(DEMO_ACTIVITIES[4], BASE_PEOPLE[1], 1),  // Antonio Sánchez (Socio)
  buildParticipant(DEMO_ACTIVITIES[4], BASE_PEOPLE[2], 2),  // Laura Martínez
  buildParticipant(DEMO_ACTIVITIES[4], BASE_PEOPLE[4], 3),  // Carmen Jiménez (Socia)
  buildParticipant(DEMO_ACTIVITIES[4], BASE_PEOPLE[5], 4),  // Francisco Torres (Socio)
  buildParticipant(DEMO_ACTIVITIES[4], BASE_PEOPLE[6], 5),  // Isabel Romero (Socia)
  buildParticipant(DEMO_ACTIVITIES[4], BASE_PEOPLE[9], 6),  // David Muñoz (Socio)
  buildParticipant(DEMO_ACTIVITIES[4], BASE_PEOPLE[11], 7), // Alberto Ramírez (Socio)
  buildParticipant(DEMO_ACTIVITIES[4], BASE_PEOPLE[12], 8), // Cristina Herrera (Socia)
  buildParticipant(DEMO_ACTIVITIES[4], BASE_PEOPLE[13], 9), // Sergio Guerrero (Socio)
  buildParticipant(DEMO_ACTIVITIES[4], BASE_PEOPLE[14], 10), // Elena Cortés
  buildParticipant(DEMO_ACTIVITIES[4], BASE_PEOPLE[15], 11), // Pablo Vázquez
  // Diego Aguilar: marcado como socio en la reserva pero no está en censo oficial (genera discrepancia de prueba)
  buildParticipant(DEMO_ACTIVITIES[4], BASE_PEOPLE[19], 12, { notes: 'Solicitó tarifa de socio' }),
  // Caso de duplicado variante (sin tilde y abreviado) para detección con IA:
  buildParticipant(DEMO_ACTIVITIES[4], BASE_PEOPLE[21], 13), // Jose A. Garcia Lopez

  // --- VIAJE 1: Ribera del Guadiana (22 asistentes) ---
  buildParticipant(DEMO_ACTIVITIES[7], BASE_PEOPLE[0], 0),  // María José (Socia)
  buildParticipant(DEMO_ACTIVITIES[7], BASE_PEOPLE[1], 1),  // Antonio Sánchez (Socio)
  buildParticipant(DEMO_ACTIVITIES[7], BASE_PEOPLE[2], 2),  // Laura Martínez
  buildParticipant(DEMO_ACTIVITIES[7], BASE_PEOPLE[3], 3),  // Javier Rodríguez
  buildParticipant(DEMO_ACTIVITIES[7], BASE_PEOPLE[4], 4),  // Carmen Jiménez (Socia)
  buildParticipant(DEMO_ACTIVITIES[7], BASE_PEOPLE[5], 5),  // Francisco Torres (Socio)
  buildParticipant(DEMO_ACTIVITIES[7], BASE_PEOPLE[6], 6),  // Isabel Romero (Socia)
  // Grupo familiar Manuel Ortega (3 personas)
  buildParticipant(DEMO_ACTIVITIES[7], BASE_PEOPLE[7], 7, { groupId: 'grp-manuel-guadiana' }),
  buildParticipant(DEMO_ACTIVITIES[7], { fullName: 'Alicia Ortega (Acompañante)', isMember: false }, 8, { groupId: 'grp-manuel-guadiana' }),
  buildParticipant(DEMO_ACTIVITIES[7], { fullName: 'Carlos Ortega (Acompañante)', isMember: false }, 9, { groupId: 'grp-manuel-guadiana' }),
  buildParticipant(DEMO_ACTIVITIES[7], BASE_PEOPLE[8], 10), // Pilar Gutiérrez
  buildParticipant(DEMO_ACTIVITIES[7], BASE_PEOPLE[9], 11), // David Muñoz (Socio)
  buildParticipant(DEMO_ACTIVITIES[7], BASE_PEOPLE[10], 12), // Rocío Delgado
  buildParticipant(DEMO_ACTIVITIES[7], BASE_PEOPLE[11], 13), // Alberto Ramírez (Socio)
  buildParticipant(DEMO_ACTIVITIES[7], BASE_PEOPLE[12], 14), // Cristina Herrera (Socia)
  buildParticipant(DEMO_ACTIVITIES[7], BASE_PEOPLE[13], 15), // Sergio Guerrero (Socio)
  buildParticipant(DEMO_ACTIVITIES[7], BASE_PEOPLE[14], 16), // Elena Cortés
  buildParticipant(DEMO_ACTIVITIES[7], BASE_PEOPLE[15], 17), // Pablo Vázquez
  buildParticipant(DEMO_ACTIVITIES[7], BASE_PEOPLE[16], 18), // Marta Cano
  buildParticipant(DEMO_ACTIVITIES[7], BASE_PEOPLE[17], 19), // Rubén Domínguez
  buildParticipant(DEMO_ACTIVITIES[7], BASE_PEOPLE[18], 20), // Nuria Marín
  buildParticipant(DEMO_ACTIVITIES[7], BASE_PEOPLE[20], 21), // José Antonio García López

  // --- CURSO 3 (Celebrado - Masterclass Quesos y Vino 2025, 17 asistentes) ---
  buildParticipant(DEMO_ACTIVITIES[6], BASE_PEOPLE[0], 0, { attended: true }), // María José
  buildParticipant(DEMO_ACTIVITIES[6], BASE_PEOPLE[1], 1, { attended: true }), // Antonio Sánchez
  buildParticipant(DEMO_ACTIVITIES[6], BASE_PEOPLE[2], 2, { attended: true }), // Laura Martínez
  buildParticipant(DEMO_ACTIVITIES[6], BASE_PEOPLE[4], 3, { attended: true }), // Carmen Jiménez
  buildParticipant(DEMO_ACTIVITIES[6], BASE_PEOPLE[5], 4, { attended: true }), // Francisco Torres
  buildParticipant(DEMO_ACTIVITIES[6], BASE_PEOPLE[6], 5, { attended: true }), // Isabel Romero
  buildParticipant(DEMO_ACTIVITIES[6], BASE_PEOPLE[7], 6, { attended: true }), // Manuel Ortega
  buildParticipant(DEMO_ACTIVITIES[6], BASE_PEOPLE[8], 7, { attended: true }), // Pilar Gutiérrez
  buildParticipant(DEMO_ACTIVITIES[6], BASE_PEOPLE[9], 8, { attended: true }), // David Muñoz
  buildParticipant(DEMO_ACTIVITIES[6], BASE_PEOPLE[10], 9, { attended: true }), // Rocío Delgado
  buildParticipant(DEMO_ACTIVITIES[6], BASE_PEOPLE[11], 10, { attended: true }), // Alberto Ramírez
  buildParticipant(DEMO_ACTIVITIES[6], BASE_PEOPLE[12], 11, { attended: true }), // Cristina Herrera
  buildParticipant(DEMO_ACTIVITIES[6], BASE_PEOPLE[13], 12, { attended: true }), // Sergio Guerrero
  buildParticipant(DEMO_ACTIVITIES[6], BASE_PEOPLE[14], 13, { attended: true }), // Elena Cortés
  buildParticipant(DEMO_ACTIVITIES[6], BASE_PEOPLE[15], 14, { attended: true }), // Pablo Vázquez
  buildParticipant(DEMO_ACTIVITIES[6], BASE_PEOPLE[16], 15, { attended: true }), // Marta Cano
  buildParticipant(DEMO_ACTIVITIES[6], BASE_PEOPLE[17], 16, { attended: true }), // Rubén Domínguez

  // --- VIAJE 3 (Celebrado - Ruta del Aceite Sierra de Segura 2025, 36 asistentes) ---
  buildParticipant(DEMO_ACTIVITIES[9], BASE_PEOPLE[0], 0, { attended: true }),
  buildParticipant(DEMO_ACTIVITIES[9], BASE_PEOPLE[1], 1, { attended: true }),
  buildParticipant(DEMO_ACTIVITIES[9], BASE_PEOPLE[2], 2, { attended: true }),
  buildParticipant(DEMO_ACTIVITIES[9], BASE_PEOPLE[3], 3, { attended: true }),
  buildParticipant(DEMO_ACTIVITIES[9], BASE_PEOPLE[4], 4, { attended: true }),
  buildParticipant(DEMO_ACTIVITIES[9], BASE_PEOPLE[5], 5, { attended: true }),
  buildParticipant(DEMO_ACTIVITIES[9], BASE_PEOPLE[6], 6, { attended: true }),
  buildParticipant(DEMO_ACTIVITIES[9], BASE_PEOPLE[7], 7, { attended: true }),
  buildParticipant(DEMO_ACTIVITIES[9], BASE_PEOPLE[8], 8, { attended: true }),
  buildParticipant(DEMO_ACTIVITIES[9], BASE_PEOPLE[9], 9, { attended: true }),
  buildParticipant(DEMO_ACTIVITIES[9], BASE_PEOPLE[10], 10, { attended: true }),
  buildParticipant(DEMO_ACTIVITIES[9], BASE_PEOPLE[11], 11, { attended: true }),
  buildParticipant(DEMO_ACTIVITIES[9], BASE_PEOPLE[12], 12, { attended: true }),
  buildParticipant(DEMO_ACTIVITIES[9], BASE_PEOPLE[13], 13, { attended: true }),
  buildParticipant(DEMO_ACTIVITIES[9], BASE_PEOPLE[14], 14, { attended: true }),
  buildParticipant(DEMO_ACTIVITIES[9], BASE_PEOPLE[15], 15, { attended: true }),
  buildParticipant(DEMO_ACTIVITIES[9], BASE_PEOPLE[16], 16, { attended: true }),
  buildParticipant(DEMO_ACTIVITIES[9], BASE_PEOPLE[17], 17, { attended: true }),
  buildParticipant(DEMO_ACTIVITIES[9], BASE_PEOPLE[18], 18, { attended: true }),
  buildParticipant(DEMO_ACTIVITIES[9], BASE_PEOPLE[20], 19, { attended: true })
];

// ==========================================
// 4. MÉTRICAS DE DEMO
// ==========================================
export const DEMO_METRICS: WebMetric = {
  pageViewsThisMonth: 12540,
  uniqueVisitorsThisMonth: 4200,
  activeReservationsCount: 88,
  occupancyRateAverage: 82,
  topVisitedActivities: [
    { id: 'demo-cata-1-vermut', title: "La Hora Magica: CATA DE VERMUT'S", type: 'cata', views: 3450 },
    { id: 'demo-viaje-1-lleno', title: 'Ruta Enológica por la Ribera del Guadiana', type: 'viaje', views: 2100 },
    { id: 'demo-curso-1-lleno', title: 'Cocina en Vivo: Producto de Cercanía', type: 'curso', views: 1800 }
  ]
};

// ==========================================
// 5. CENSO DE SOCIOS DE DEMO (MEMBERS)
// ==========================================
// Incluye 9 socios activos consistentes. Se excluye a propósito a 'Diego Aguilar Bravo'
// para que salte el aviso de discrepancia en el buzón de notificaciones.
export const DEMO_MEMBERS: Member[] = [
  { id: 'mem-1', fullName: 'María José Fernández Ruiz', email: 'mariajose.fernandez@example.com', phone: '611 222 001', membershipNumber: 'SOC-001', active: true, createdAt: '2025-01-10T10:00:00.000Z' },
  { id: 'mem-2', fullName: 'Antonio Sánchez Gómez', email: 'antonio.sanchez@example.com', phone: '611 222 002', membershipNumber: 'SOC-002', active: true, createdAt: '2025-01-12T11:00:00.000Z' },
  { id: 'mem-3', fullName: 'Carmen Jiménez Díaz', email: 'carmen.jimenez@example.com', phone: '611 222 003', membershipNumber: 'SOC-003', active: true, createdAt: '2025-01-15T12:00:00.000Z' },
  { id: 'mem-4', fullName: 'Francisco Torres Molina', email: 'francisco.torres@example.com', phone: '611 222 004', membershipNumber: 'SOC-004', active: true, createdAt: '2025-02-01T09:30:00.000Z' },
  { id: 'mem-5', fullName: 'Isabel Romero Navarro', email: 'isabel.romero@example.com', phone: '611 222 005', membershipNumber: 'SOC-005', active: true, createdAt: '2025-02-10T16:00:00.000Z' },
  { id: 'mem-6', fullName: 'David Muñoz Cabrera', email: 'david.munoz@example.com', phone: '611 222 010', membershipNumber: 'SOC-006', active: true, createdAt: '2025-02-14T10:00:00.000Z' },
  { id: 'mem-7', fullName: 'Alberto Ramírez Flores', email: 'alberto.ramirez@example.com', phone: '611 222 012', membershipNumber: 'SOC-007', active: true, createdAt: '2025-03-01T11:00:00.000Z' },
  { id: 'mem-8', fullName: 'Cristina Herrera Reyes', email: 'cristina.herrera@example.com', phone: '611 222 013', membershipNumber: 'SOC-008', active: true, createdAt: '2025-03-05T12:30:00.000Z' },
  { id: 'mem-9', fullName: 'Sergio Guerrero Pascual', email: 'sergio.guerrero@example.com', phone: '611 222 014', membershipNumber: 'SOC-009', active: true, createdAt: '2025-03-10T17:00:00.000Z' }
];

// ==========================================
// 6. BUZÓN DE NOTIFICACIONES DE DEMO
// ==========================================
export const DEMO_NOTIFICATIONS: AdminNotification[] = [
  {
    id: 'notif-demo-1',
    type: 'socio_mismatch',
    title: 'Discrepancia de Socio detectada',
    message: 'El asistente "Diego Aguilar Bravo" solicitó tarifa de socio en "Cocina en Vivo: Producto de Cercanía", pero no figura en el censo oficial de socios activos.',
    activityId: 'demo-curso-1-lleno',
    read: false,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  }
];

// ==========================================
// 7. GASTOS DE DEMO (EXPENSES)
// ==========================================
export const DEMO_EXPENSES: import('../types').Expense[] = [
  // La Hora Mágica queda deliberadamente sin gastos.
  // Al estar celebrada, debe mostrar el aviso «Sin gastos» en Cuentas.

  // CATA 2 · La Expresión del Terruño
  {
    id: 'exp-demo-cata-terruno-vinos',
    activityId: 'demo-cata-2-terruno',
    concept: 'Selección de vinos artesanos de Bodega La Uveja Negra',
    amount: 218.40,
    category: 'bodega_proveedor',
    date: '2026-03-24',
    notes: 'Compra anticipada para los tres pases de la cata.',
    createdAt: '2026-03-24T10:15:00.000Z'
  },
  {
    id: 'exp-demo-cata-terruno-catering',
    activityId: 'demo-cata-2-terruno',
    concept: 'Elaboración de maridajes y aperitivos',
    amount: 156.50,
    category: 'catering',
    date: '2026-04-08',
    notes: 'Arroz meloso, pan bao y acompañamientos.',
    createdAt: '2026-04-08T09:30:00.000Z'
  },

  // CATA 3 · Experiencia S.A.T. COLOMAN
  {
    id: 'exp-demo-cata-coloman-vinos',
    activityId: 'demo-cata-3-coloman',
    concept: 'Lote de vinos S.A.T. Coloman',
    amount: 265.00,
    category: 'bodega_proveedor',
    date: '2026-05-20',
    notes: 'Cuatro referencias para la degustación.',
    createdAt: '2026-05-20T11:00:00.000Z'
  },
  {
    id: 'exp-demo-cata-coloman-maridaje',
    activityId: 'demo-cata-3-coloman',
    concept: 'Maridajes de la cata Coloman',
    amount: 118.75,
    category: 'catering',
    date: '2026-06-03',
    notes: 'Tartar, crujientes, queso y fruta seca.',
    createdAt: '2026-06-03T16:20:00.000Z'
  },

  // CATA 4 · La Hora del Vermut
  {
    id: 'exp-demo-cata-vermut2-proveedor',
    activityId: 'demo-cata-4-vermut2',
    concept: 'Vermuts y botánicos para el taller',
    amount: 238.00,
    category: 'bodega_proveedor',
    date: '2026-06-05',
    notes: 'Producto de las tres bodegas participantes.',
    createdAt: '2026-06-05T12:00:00.000Z'
  },
  {
    id: 'exp-demo-cata-vermut2-catering',
    activityId: 'demo-cata-4-vermut2',
    concept: 'Ingredientes para gildas y aperitivos',
    amount: 192.00,
    category: 'catering',
    date: '2026-06-19',
    notes: 'Incluye conservas, ahumados y fruta de temporada.',
    createdAt: '2026-06-19T08:45:00.000Z'
  },

  // CURSO 1 · Cocina en Vivo
  {
    id: 'exp-demo-curso-cocina-producto',
    activityId: 'demo-curso-1-lleno',
    concept: 'Compra de producto local para el taller',
    amount: 320.00,
    category: 'material',
    date: '2026-10-10',
    notes: 'Ingredientes, vino para maridaje y consumibles.',
    createdAt: '2026-10-10T10:00:00.000Z'
  },
  {
    id: 'exp-demo-curso-cocina-chef',
    activityId: 'demo-curso-1-lleno',
    concept: 'Honorarios del chef invitado Rafael Peláez',
    amount: 410.00,
    category: 'personal',
    date: '2026-10-15',
    notes: 'Impartición y preparación previa del curso.',
    createdAt: '2026-10-15T18:00:00.000Z'
  },

  // CURSO 2 · Conservas y Encurtidos
  {
    id: 'exp-demo-curso-conservas-envases',
    activityId: 'demo-curso-2-vacio',
    concept: 'Tarros, tapas y etiquetas para conservas',
    amount: 85.00,
    category: 'material',
    date: '2026-10-20',
    notes: 'Material adquirido antes de abrir inscripciones.',
    createdAt: '2026-10-20T09:00:00.000Z'
  },
  {
    id: 'exp-demo-curso-conservas-ingredientes',
    activityId: 'demo-curso-2-vacio',
    concept: 'Verduras, salmueras y especias',
    amount: 120.00,
    category: 'catering',
    date: '2026-10-29',
    notes: 'Provisión inicial para el taller.',
    createdAt: '2026-10-29T13:10:00.000Z'
  },

  // CURSO 3 · Masterclass de Maridaje
  {
    id: 'exp-demo-curso-maridaje-vinos',
    activityId: 'demo-curso-3-celebrado',
    concept: 'Selección de vinos para maridaje',
    amount: 155.00,
    category: 'bodega_proveedor',
    date: '2025-10-10',
    notes: 'Blancos, tintos jóvenes y generosos.',
    createdAt: '2025-10-10T10:30:00.000Z'
  },
  {
    id: 'exp-demo-curso-maridaje-quesos',
    activityId: 'demo-curso-3-celebrado',
    concept: 'Quesos manchegos artesanos y servicio',
    amount: 185.00,
    category: 'catering',
    date: '2025-10-14',
    notes: 'Distintas curaciones y material de degustación.',
    createdAt: '2025-10-14T17:00:00.000Z'
  },

  // VIAJE 1 · Ribera del Guadiana
  {
    id: 'exp-demo-viaje-guadiana-autobus',
    activityId: 'demo-viaje-1-lleno',
    concept: 'Autobús discrecional ida y vuelta',
    amount: 1100.00,
    category: 'transporte',
    date: '2026-10-15',
    notes: 'Reserva para grupo de 25 plazas.',
    createdAt: '2026-10-15T09:15:00.000Z'
  },
  {
    id: 'exp-demo-viaje-guadiana-hotel',
    activityId: 'demo-viaje-1-lleno',
    concept: 'Bloqueo de habitaciones en Almendralejo',
    amount: 820.00,
    category: 'alojamiento',
    date: '2026-10-20',
    notes: 'Anticipo de alojamiento de una noche.',
    createdAt: '2026-10-20T12:45:00.000Z'
  },

  // VIAJE 2 · Escapada a Jerez
  {
    id: 'exp-demo-viaje-jerez-autobus',
    activityId: 'demo-viaje-2-vacio',
    concept: 'Señal de reserva de autocar',
    amount: 650.00,
    category: 'transporte',
    date: '2026-10-30',
    notes: 'Anticipo reembolsable sujeto a la ocupación mínima.',
    createdAt: '2026-10-30T10:00:00.000Z'
  },
  {
    id: 'exp-demo-viaje-jerez-hotel',
    activityId: 'demo-viaje-2-vacio',
    concept: 'Depósito de hotel en Jerez',
    amount: 500.00,
    category: 'alojamiento',
    date: '2026-11-02',
    notes: 'Pre-reserva de habitaciones para el grupo.',
    createdAt: '2026-11-02T11:30:00.000Z'
  },

  // VIAJE 3 · Ruta del Aceite. Caso de prueba deliberadamente a pérdidas.
  {
    id: 'exp-demo-viaje-segura-autobus',
    activityId: 'demo-viaje-3-celebrado',
    concept: 'Autocar para excursión a Sierra de Segura',
    amount: 690.00,
    category: 'transporte',
    date: '2025-11-05',
    notes: 'Servicio de ida y vuelta para la excursión de un día.',
    createdAt: '2025-11-05T09:00:00.000Z'
  },
  {
    id: 'exp-demo-viaje-segura-comida',
    activityId: 'demo-viaje-3-celebrado',
    concept: 'Comida campera y cata de AOVE',
    amount: 430.00,
    category: 'catering',
    date: '2025-11-15',
    notes: 'Coste final del grupo en almazara y restaurante.',
    createdAt: '2025-11-15T18:30:00.000Z'
  }
];

// ==========================================
// 8. PATROCINIOS DE DEMO (SPONSORSHIPS)
// ==========================================
export const DEMO_SPONSORSHIPS: import('../types').Sponsorship[] = [
  {
    id: 'sponsor-demo-cata-vermut-lustau',
    activityId: 'demo-cata-1-vermut',
    sponsorName: 'Bodegas Lustau',
    concept: 'Colaboración para la cata y taller de vermut',
    amount: 350.00,
    paidAmount: 350.00,
    status: 'cobrado',
    date: '2026-02-20',
    notes: 'Aportación en efectivo para apoyar la experiencia de marca.',
    createdAt: '2026-02-20T10:00:00.000Z'
  },
  {
    id: 'sponsor-demo-curso-cocina-cooperativa',
    activityId: 'demo-curso-1-lleno',
    sponsorName: 'Cooperativa Virgen del Monte',
    concept: 'Patrocinio de producto local para Cocina en Vivo',
    amount: 450.00,
    paidAmount: 450.00,
    status: 'cobrado',
    date: '2026-09-28',
    notes: 'Apoyo a la difusión de productos de proximidad.',
    createdAt: '2026-09-28T12:15:00.000Z'
  },
  {
    id: 'sponsor-demo-viaje-guadiana-turismo',
    activityId: 'demo-viaje-1-lleno',
    sponsorName: 'Ruta del Vino Ribera del Guadiana',
    concept: 'Colaboración promocional para la ruta enológica',
    amount: 600.00,
    paidAmount: 600.00,
    status: 'cobrado',
    date: '2026-10-01',
    notes: 'Aportación destinada a cubrir parte del transporte del grupo.',
    createdAt: '2026-10-01T09:45:00.000Z'
  }
];

// ==========================================
// 9. MENSAJES DE CONTACTO DE DEMO
// ==========================================
export const DEMO_CONTACT_MESSAGES: ContactMessage[] = [
  {
    id: 'msg-demo-1-propuesta',
    name: 'Gonzalo Rivas Medina',
    email: 'gonzalo.rivas@distribuciones-clm.es',
    phone: '654 987 321',
    subject: 'propuesta_cata',
    message: 'Buenas tardes. Somos una distribuidora gastronómica de Ciudad Real y nos gustaría organizar una cata privada de vinos y maridaje de autor para un grupo de 12 clientes a finales de mayo en vuestras instalaciones de Bolaños. ¿Podrían informarnos sobre tarifas de reserva de sala y disponibilidad? Muchas gracias de antemano.',
    activityInterest: 'Cata privada para empresa',
    read: false,
    status: 'nuevo',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() // Hace 5 horas
  },
  {
    id: 'msg-demo-2-socio',
    name: 'Lucía Navarro Beltrán',
    email: 'lucia.navarro@gmail.com',
    phone: '612 345 678',
    subject: 'hazte_socio',
    message: 'Hola equipo de Doña Berenjena. Asistí el mes pasado como no socia a la cata de vermuts y me encantó el ambiente y la pasión con la que explicáis todo. Quería consultar los pasos y documentación necesaria para darme de alta como socia de número para esta temporada. ¡Un saludo!',
    activityInterest: 'Alta de nuevo socio',
    read: true,
    status: 'leido',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString() // Hace día y medio
  }
];



