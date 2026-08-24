import fs from 'fs';
let code = fs.readFileSync('src/data/demoData.ts', 'utf8');

const newActivities = `  },
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
];`;

code = code.replace(/  \}\n\];/g, newActivities);

const newCalls = `  ...generateParticipants('demo-viaje-1-lleno', 'Viaje Mockup 1 (Lleno)', '2026-11-15', 'viaje', 25, 350, 500),
  ...generateParticipants('demo-curso-3-celebrado', 'Curso Mockup 3 (Celebrado)', '2025-10-15', 'curso', 16, 150, 600, true),
  ...generateParticipants('demo-viaje-3-celebrado', 'Viaje Mockup 3 (Celebrado)', '2025-11-15', 'viaje', 36, 350, 700, true)
];`;

code = code.replace(/  \.\.\.generateParticipants\('demo-viaje-1-lleno', 'Viaje Mockup 1 \(Lleno\)', '2026-11-15', 'viaje', 25, 350, 500\)\n\];/g, newCalls);

fs.writeFileSync('src/data/demoData.ts', code);
console.log('Done!');
