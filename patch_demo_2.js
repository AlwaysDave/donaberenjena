const fs = require('fs');
let code = fs.readFileSync('src/data/demoData.ts', 'utf8');

// We need to add a celebrated course and a celebrated trip
const newActivities = `
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
`;

// Insert newActivities before "];\n\nexport const DEMO_PARTICIPANTS"
code = code.replace(
  `]
];`,
  `  },${newActivities}
];`
);
// Wait, the file ends the array with "];\n\nexport const DEMO_PARTICIPANTS" or something similar.
// Let's just replace the exact end of DEMO_ACTIVITIES.
