import { Activity, CataActivity, CursoActivity, ViajeActivity, WebMetric } from '../types';

export const INITIAL_CATAS: CataActivity[] = [
  {
    id: 'cata-ribera-atauta',
    type: 'cata',
    category: 'vino',
    title: 'Cata Magistral: Vinos de Paraje de la Ribera del Duero Soriana',
    subtitle: 'Un recorrido por viñedos prefiloxéricos a más de 1.000 metros de altitud.',
    description: 'Una sesión exclusiva guiada por el enólogo Jaime Suárez para descubrir la singularidad del Valle de Atauta. Degustaremos 5 parcelas únicas acompañadas de bocados gastronómicos de cordero lechal y hongos de temporada.',
    date: '2026-09-18',
    time: '20:00 h',
    price: 48,
    totalSpots: 22,
    bookedSpots: 17,
    status: 'proxima',
    featured: true,
    location: 'Salón de Catas Principal — Sede Doña Berenjena (C/ Mayor 14, Planta 1)',
    howToReserveInfo: 'Reserva tu plaza rellenando el formulario o contactando con secretaría. El pago se formalizará por transferencia o Bizum tras confirmación de plaza.',
    documentPdf: {
      url: '#',
      title: 'Ficha de Cata y Menú de Maridaje - Ribera Atauta.pdf',
      fileSize: '1.4 MB'
    },
    images: [
      'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1528823872057-9c018a7a7553?auto=format&fit=crop&w=800&q=80'
    ],
    bodegaProductor: {
      name: 'Bodegas Dominio de Atauta',
      region: 'D.O. Ribera del Duero (Soria)',
      enologo: 'Jaime Suárez',
      description: 'Pioneros en la recuperación de viñas centenarias en el extremo oriental de la Ribera.'
    },
    pairingMenu: [
      {
        dish: 'Terrina de lechal con reducción de sarmientos y crujiente de piel',
        pairing: 'Parada de Atauta 2021',
        notes: 'Equilibrio tánico y frescura mineral que desengrasa el paladar.'
      },
      {
        dish: 'Boletus edulis salteados con yema de corral curada en salazón',
        pairing: 'Dominio de Atauta 2019 (Edición Paraje)',
        notes: 'Notas balsámicas y monte bajo que potencian la tierra del hongo.'
      },
      {
        dish: 'Queso curado de oveja de pasto con dulce artesano de berenjena',
        pairing: 'Llanos del Almendro 2018 (Gran Selección)',
        notes: 'Maridaje de contraste dulce-salino y alta concentración aromática.'
      }
    ],
    createdAt: '2026-07-10',
    updatedAt: '2026-08-15'
  },
  {
    id: 'cata-vermuts-artesanos',
    type: 'cata',
    category: 'vermut',
    title: 'Aperitivo Clandestino: Vermuts Artesanos y Salazones del Mediterráneo',
    subtitle: 'Botánica, ajenjo y la hora del aperitivo revisitada por grandes maestros vermuteros.',
    description: 'Exploración sensorial de 6 vermuts españoles: desde las fórmulas centenarias de Reus y El Puerto de Santa María hasta los nuevos vermuts de terruño de Madrid y Galicia, armonizados con laterío fino y encurtidos de autor.',
    date: '2026-10-03',
    time: '13:00 h',
    price: 35,
    totalSpots: 26,
    bookedSpots: 12,
    status: 'proxima',
    featured: true,
    location: 'Patio Ajardinado y Terraza de Doña Berenjena',
    howToReserveInfo: 'Confirmación instantánea para socios de número. Plazas abiertas para invitados hasta completar aforo.',
    documentPdf: {
      url: '#',
      title: 'Guía Botánica y Salazones - Vermuts 2026.pdf',
      fileSize: '950 KB'
    },
    images: [
      'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80'
    ],
    bodegaProductor: {
      name: 'Selección de Vermuterías Históricas de España',
      region: 'Reus, Jerez, Madrid y Rías Baixas',
      description: 'Una selección curada por nuestro sumiller de cabecera que reúne botánicas autóctonas.'
    },
    pairingMenu: [
      {
        dish: 'Gilda XXL con anchoa del Cantábrico 00 y piparra fresca de Navarra',
        pairing: 'Vermut Blanco Reserva de Botánica Alpina',
        notes: 'Acidez punzante y amargor herbáceo.'
      },
      {
        dish: 'Mojama de atún de almadraba con almendras marconas fritas en AOVE',
        pairing: 'Vermut Rojo sobre base de Pedro Ximénez y Oloroso',
        notes: 'Sabor umami prolongado con notas a piel de naranja amarga.'
      }
    ],
    createdAt: '2026-07-20',
    updatedAt: '2026-08-10'
  },
  {
    id: 'cata-aove-primeras-cosechas',
    type: 'cata',
    category: 'aceite',
    title: 'Oro Líquido: Cata Guiada de AOVE Cosecha Temprana',
    subtitle: 'Detección de atributos positivos, frutados verdes y armonías en crudo.',
    description: 'Taller práctico con copa oficial de cata reglamentaria. Aprenderemos a distinguir defectos y virtudes de los aceites de oliva virgen extra más premiados del año (Picual, Hojiblanca, Royal de Cazorla y Arbequina).',
    date: '2026-10-24',
    time: '19:30 h',
    price: 30,
    totalSpots: 20,
    bookedSpots: 8,
    status: 'proxima',
    featured: false,
    location: 'Salón de Catas Principal — Sede Doña Berenjena',
    documentPdf: {
      url: '#',
      title: 'Cuaderno Oficial de Cata de Aceites de Oliva.pdf',
      fileSize: '1.1 MB'
    },
    images: [
      'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=800&q=80'
    ],
    bodegaProductor: {
      name: 'Almazaras de la Subbética y Jaén Selección',
      region: 'Andalucía (Priego de Córdoba y Sierra Mágina)',
      enologo: 'Dra. Pilar Gómez (Catadora Panel Oficial)'
    },
    pairingMenu: [
      {
        dish: 'Tomates de huerta vieja en texturas con sal ahumada',
        pairing: 'AOVE Picual Temprano Ecológico',
        notes: 'Notas de tomatera, higuera y clorofila viva.'
      },
      {
        dish: 'Carpaccio de bacalao fresco con naranja y aceituna negra de Aragón',
        pairing: 'AOVE Hojiblanca Selección Especial',
        notes: 'Picante y amargo muy balanceados en garganta.'
      }
    ],
    createdAt: '2026-08-01',
    updatedAt: '2026-08-18'
  },
  {
    id: 'cata-jerez-generosos-celebrada',
    type: 'cata',
    category: 'vino',
    title: 'Viaje a la Albariza: Vinos de Jerez y Quesos de Pastor Afinados',
    subtitle: 'Manzanillas pasadas, Amontillados viejos y Palos Cortados VORS.',
    description: 'Una velada inolvidable donde recorrimos la crianza biológica y oxidativa del Marco de Jerez junto a 6 quesos españoles e internacionales afinados por nuestro maestro quesero.',
    date: '2026-05-14',
    time: '20:30 h',
    price: 55,
    totalSpots: 24,
    bookedSpots: 24,
    status: 'celebrada',
    featured: false,
    location: 'Salón de Catas Principal — Sede Doña Berenjena',
    pastEventSummary: 'La cata agotó todas las localidades en menos de 48 horas. Se descorcharon botellas históricas de más de 30 años de crianza y se degustó una tabla de quesos con Gamoneu del Puerto y Comté de 36 meses.',
    pastEventGallery: [
      'https://images.unsplash.com/photo-1558001373-7b93ee48ffa0?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=800&q=80'
    ],
    documentPdf: {
      url: '#',
      title: 'Memoria y Fichas de Cata - Vinos de Jerez.pdf',
      fileSize: '2.2 MB'
    },
    images: [
      'https://images.unsplash.com/photo-1558001373-7b93ee48ffa0?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=800&q=80'
    ],
    bodegaProductor: {
      name: 'Bodegas Tradición y Valdespino',
      region: 'D.O. Jerez-Xérès-Sherry y Manzanilla de Sanlúcar'
    },
    pairingMenu: [
      {
        dish: 'Tabla de afinados: Payoyo, Gamoneu y Stilton al oporto',
        pairing: 'Amontillado VORS 30 años y Palo Cortado Singular'
      }
    ],
    createdAt: '2026-03-01',
    updatedAt: '2026-05-15'
  }
];

export const INITIAL_CURSOS: CursoActivity[] = [
  {
    id: 'curso-arroces-levantinos',
    type: 'curso',
    theme: 'Arroces de Autor: Dominio del Fuego, Fondos y Punto del Grano',
    title: 'Curso Magistral de Arroces Tradicionales y Melosos',
    subtitle: 'Aprende los secretos del socarrat perfecto, la salmorreta y los caldos de roca.',
    description: 'Curso 100% práctico en nuestros fogones profesionales. Cada participante elaborará su propio arroz individual con ingredientes de primera categoría. Al terminar, disfrutaremos de la comida maridada con vinos de la asociación.',
    date: '2026-09-26',
    time: '11:00 - 15:30 h',
    price: 75,
    totalSpots: 14,
    bookedSpots: 11,
    status: 'proxima',
    featured: true,
    location: 'Cocina Profesional Abierta — Sede Doña Berenjena',
    howToReserveInfo: 'Incluye recetario encuadernado, delantal oficial de la asociación, ingredientes, cata de vinos durante la comida y diploma de participación.',
    documentPdf: {
      url: '#',
      title: 'Dossier de Recetas y Técnicas de Arroz - Chef Quique.pdf',
      fileSize: '3.1 MB'
    },
    images: [
      'https://images.unsplash.com/photo-1534080564583-6be75777b70a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80'
    ],
    chef: {
      name: 'Chef Quique Luján',
      bio: 'Formado en las mejores arrocerías de Denia y Alicante, especialista en arroces de capa fina y pescados del litoral.',
      restaurant: 'Arrocería Can Fuego'
    },
    syllabus: [
      'Anatomía del grano de arroz: variedades Senia, Bomba y Albufera',
      'Elaboración del fumet de morralla y fondo oscuro de cigalas',
      'La salmorreta perfecta y sofritos sin prisas',
      'Técnica de fuego para conseguir el socarrat crujiente sin quemar',
      'Elaboración en clase: Arroz a banda tradicional y Arroz meloso de pato y alcachofas'
    ],
    includesTasting: true,
    createdAt: '2026-07-15',
    updatedAt: '2026-08-12'
  },
  {
    id: 'curso-guisos-chup-chup',
    type: 'curso',
    theme: 'Cocina de Cuchara: Guisos de Otoño, Casquería Fina y Reducciones',
    title: 'Guisos Lentos de Vanguardia y Tradición',
    subtitle: 'El arte de la paciencia en cazuela de barro y cocción a baja temperatura.',
    description: 'Un homenaje a los grandes platos de la gastronomía de cuchara: pochas con rape y almejas, carrilleras estofadas al vino tinto y callos melosos a la madrileña con su toque de hierbabuena.',
    date: '2026-10-17',
    time: '10:30 - 15:00 h',
    price: 70,
    totalSpots: 14,
    bookedSpots: 6,
    status: 'proxima',
    featured: false,
    location: 'Cocina Profesional Abierta — Sede Doña Berenjena',
    documentPdf: {
      url: '#',
      title: 'Manual de Guisos y Fondos Madres.pdf',
      fileSize: '1.8 MB'
    },
    images: [
      'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1507048331197-7d4ac70811cf?auto=format&fit=crop&w=800&q=80'
    ],
    chef: {
      name: 'Carmela Serrano',
      bio: 'Cocinera y divulgadora gastronómica con más de 20 años de experiencia rescatando recetarios tradicionales castellanos.',
      restaurant: 'Taberna El Chup-Chup'
    },
    syllabus: [
      'Desarrollo de colágeno y texturas untuosas en guisos de carne',
      'Pochas y legumbres frescas: tiempos, asustar el hervor y ligazón',
      'Callos, morro y pata: limpieza meticulosa y equilibrio picante',
      'Degustación en mesa común con vinos tintos de crianza'
    ],
    includesTasting: true,
    createdAt: '2026-08-05',
    updatedAt: '2026-08-20'
  },
  {
    id: 'curso-pan-masa-madre-celebrado',
    type: 'curso',
    theme: 'Panadería Artesanal: Fermentaciones Largas y Harinas Molidas a la Piedra',
    title: 'Iniciación al Pan de Masa Madre y Harinas Antiguas',
    subtitle: 'Crea tu propia masa madre viva y domina el amasado y horneado en casa.',
    description: 'Taller de fin de semana donde los asistentes crearon hogazas de trigo sarraceno, espelta y centeno, entendiendo la microbiología de las levaduras salvajes.',
    date: '2026-04-18',
    time: '10:00 - 16:00 h',
    price: 65,
    totalSpots: 12,
    bookedSpots: 12,
    status: 'celebrada',
    featured: false,
    location: 'Cocina Profesional Abierta — Sede Doña Berenjena',
    pastEventSummary: 'Todos los alumnos se llevaron a casa dos hogazas recién horneadas y un bote de masa madre centenaria de la asociación activa y lista para alimentar.',
    pastEventGallery: [
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&w=800&q=80'
    ],
    images: [
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80'
    ],
    chef: {
      name: 'Mateo Beltrán',
      bio: 'Maestro panadero artesano premiado en el certamen nacional de panadería rústica.'
    },
    syllabus: [
      'Creación y mantenimiento del cultivo de masa madre',
      'Hidratación al 75% y técnicas de plegado',
      'El greñado y control del vapor en horno doméstico'
    ],
    includesTasting: true,
    createdAt: '2026-02-10',
    updatedAt: '2026-04-19'
  }
];

export const INITIAL_VIAJES: ViajeActivity[] = [
  {
    id: 'viaje-rioja-alavesa',
    type: 'viaje',
    destination: 'Rioja Alavesa y Calados Medievales de Laguardia',
    title: 'Viaje Enogastronómico a la Rioja Alavesa',
    subtitle: '3 días entre viñas centenarias, calados bajo tierra y gastronomía vasco-riojana de altura.',
    description: 'Un viaje exclusivo para 18 socios y amigos de Doña Berenjena. Nos alojaremos en un hotel con encanto entre viñas, visitaremos 4 bodegas de culto inaccesibles al público general y comeremos en asadores tradicionales con chuletas al sarmiento.',
    date: '2026-10-09 a 2026-10-11',
    time: 'Salida viernes 08:00 h — Regreso domingo 20:00 h',
    price: 490,
    totalSpots: 18,
    bookedSpots: 14,
    status: 'proxima',
    featured: true,
    location: 'Laguardia, Elciego y Samaniego (Álava)',
    durationDays: 3,
    howToReserveInfo: 'El precio incluye transporte en autobús privado de gran confort, 2 noches de alojamiento y desayuno, todas las comidas y cenas con maridaje, visitas privadas y seguro de viaje.',
    documentPdf: {
      url: '#',
      title: 'Itinerario Completo y Dosier del Viaje - Rioja Alavesa.pdf',
      fileSize: '4.5 MB'
    },
    images: [
      'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80'
    ],
    includedServices: [
      'Autobús privado exclusivo durante todo el recorrido',
      '2 noches en Hotel Boutique 4* en Laguardia',
      '3 almuerzos en asadores tradicionales y 2 cenas gastronómicas maridadas',
      'Visita privada y cata comentada en 4 bodegas singulares',
      'Guía sumiller acompañante de Doña Berenjena'
    ],
    itinerary: [
      {
        day: 1,
        title: 'Viernes: Llegada a Laguardia y descenso a los calados históricos',
        description: 'Salida desde Madrid en autobús privado. Almuerzo de bienvenida con patatas a la riojana y chuletillas de cordero al sarmiento. Por la tarde, visita exclusiva a un calado subterráneo del siglo XVI.',
        highlights: ['Paseo por las murallas de Laguardia', 'Cata en calado subterráneo privado', 'Cena degustación con maridaje de vinos blancos con crianza']
      },
      {
        day: 2,
        title: 'Sábado: Grandes parcelas, bodegas de autor y paisaje de viñedos',
        description: 'Recorrido por viñedos viejos de Samaniego y San Vicente de la Sonsierra. Visita a bodega boutique de mínima intervención con almuerzo entre barricas.',
        highlights: ['Cata de 6 vinos de parcela', 'Almuerzo campestre maridado en terraza con vistas a la Sierra de Cantabria', 'Tiempo libre para callejear']
      },
      {
        day: 3,
        title: 'Domingo: Arquitectura de vanguardia y regreso',
        description: 'Paseo enológico matutino, visita a bodega de arquitectura contemporánea y comida de despedida en bodega tradicional antes del regreso.',
        highlights: ['Degustación de añadas históricas', 'Menú de despedida con pochas y torrija caramelizada']
      }
    ],
    createdAt: '2026-06-15',
    updatedAt: '2026-08-10'
  },
  {
    id: 'viaje-atun-barbate-cadiz',
    type: 'viaje',
    destination: 'Costa de la Luz, Barbate, Zahara y Jerez de la Frontera',
    title: 'Ruta del Atún Rojo de Almadraba y Vinos de Albariza',
    subtitle: 'El ronqueo tradicional, la magia de las salinas y los secretos del Marco de Jerez.',
    description: 'Una inmersión gastronómica en el sur: presenciaremos un ronqueo en directo, degustaremos los 24 cortes del atún en restaurantes de referencia y visitaremos bodegas centenarias con catas a pie de bota.',
    date: '2026-11-06 a 2026-11-08',
    time: '3 días / 2 noches',
    price: 520,
    totalSpots: 16,
    bookedSpots: 7,
    status: 'proxima',
    featured: false,
    location: 'Cádiz, Barbate y Jerez de la Frontera',
    durationDays: 3,
    documentPdf: {
      url: '#',
      title: 'Itinerario Detallado - Ruta del Atun Rojo 2026.pdf',
      fileSize: '3.8 MB'
    },
    images: [
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'
    ],
    includedServices: [
      'Alojamiento en hotel con encanto frente al mar',
      'Demostración privada de ronqueo tradicional de atún rojo',
      'Menú degustación monogràfico de atún en 12 pases',
      'Visita y cata a pie de bota en Jerez',
      'Seguro y coordinación completa de la asociación'
    ],
    itinerary: [
      {
        day: 1,
        title: 'Viernes: Llegada a la bahía de Cádiz y primera toma de contacto con el fino',
        description: 'Recepción en Jerez, visita a un tabanco histórico y cena marinera en Sanlúcar de Barrameda.',
        highlights: ['Langostinos de Sanlúcar', 'Cata de manzanillas en rama', 'Puesta de sol en Bajo de Guía']
      },
      {
        day: 2,
        title: 'Sábado: El ritual de la almadraba y el templo del atún',
        description: 'Asistencia al despiece tradicional del atún (ronqueo) y comida con los cortes nobles: descargado, morrillo, ventresca y tarantelo.',
        highlights: ['Ronqueo explicado por maestro almadrabero', 'Almuerzo de 10 pases de atún rojo', 'Paseo por los acantilados de la Breña']
      },
      {
        day: 3,
        title: 'Domingo: Salinas de Chiclana, vinos tintos de la tierra de Cádiz y regreso',
        description: 'Visita a esteros y salinas artesanales con cata de flor de sal y pescado de estero antes del retorno.',
        highlights: ['Cata de sales y algas marinas', 'Almuerzo final de arroz con corvina']
      }
    ],
    createdAt: '2026-07-25',
    updatedAt: '2026-08-16'
  },
  {
    id: 'viaje-trufa-teruel-celebrado',
    type: 'viaje',
    destination: 'Sarrión, Mora de Rubielos y Albarracín (Teruel)',
    title: 'La Caza de la Trufa Negra (Tuber Melanosporum) en Teruel',
    subtitle: 'Jornada de recolección con perros truferos, talleres aromáticos y cocina de montaña.',
    description: 'Viaje celebrado en pleno invierno para disfrutar del momento cumbre de la trufa negra silvestre y de cultivo en la capital mundial de la melanosporum.',
    date: '2026-02-06 a 2026-02-08',
    time: 'Fin de semana',
    price: 460,
    totalSpots: 16,
    bookedSpots: 16,
    status: 'celebrada',
    featured: false,
    location: 'Sarrión y Albarracín',
    durationDays: 3,
    pastEventSummary: 'Una experiencia inolvidable donde los socios recolectaron más de 1,2 kg de trufa en el encinar y disfrutaron de huevos fritos trufados in situ y un menú de 7 pases con trufa en todos los platos.',
    pastEventGallery: [
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=800&q=80'
    ],
    images: [
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80'
    ],
    includedServices: [
      'Transporte y alojamiento rural de encanto',
      'Actividad con perro trufero y botánico experto',
      'Cena maridada monográfica de trufa negra'
    ],
    itinerary: [
      {
        day: 1,
        title: 'Viernes: Llegada y cena de bienvenida en mesón de montaña',
        description: 'Presentación del viaje y primera cata olfativa.',
        highlights: ['Embutidos trufados y jamón de Teruel D.O.']
      }
    ],
    createdAt: '2025-12-01',
    updatedAt: '2026-02-10'
  }
];

export const INITIAL_WEB_METRICS: WebMetric = {
  pageViewsThisMonth: 3840,
  uniqueVisitorsThisMonth: 1290,
  activeReservationsCount: 48,
  occupancyRateAverage: 78,
  topVisitedActivities: [
    { id: 'cata-ribera-atauta', title: 'Cata Magistral: Vinos de Paraje de Ribera del Duero', type: 'cata', views: 820 },
    { id: 'viaje-rioja-alavesa', title: 'Viaje Enogastronómico a la Rioja Alavesa', type: 'viaje', views: 640 },
    { id: 'curso-arroces-levantinos', title: 'Curso Magistral de Arroces Tradicionales', type: 'curso', views: 510 },
    { id: 'cata-vermuts-artesanos', title: 'Aperitivo Clandestino: Vermuts y Salazones', type: 'cata', views: 430 }
  ]
};
