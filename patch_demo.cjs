const fs = require('fs');
let code = fs.readFileSync('src/data/demoData.ts', 'utf8');

// 1. Update generateParticipants
const oldGenerateParticipants = `const generateParticipants = (
  activityId: string,
  activityTitle: string,
  activityDate: string,
  activityType: 'cata' | 'curso' | 'viaje',
  count: number,
  offset: number = 0,
  archived: boolean = false
): Participant[] => {
  return Array.from({ length: count }).map((_, i) => ({
    id: \`demo-part-\${activityId}-\${offset + i}\`,
    activityId,
    activityTitle,
    activityDate,
    activityType,
    fullName: \`Visitante Demo \${offset + i + 1}\`,
    email: \`demo.user\${offset + i + 1}@ejemplo.com\`,
    phone: \`600 000 \${String(offset + i).padStart(3, '0')}\`,
    spots: 1,
    turn: 'Turno único',
    membershipNumber: i % 4 === 0 ? \`SOC-\${100 + offset + i}\` : '',
    notes: i === 0 ? 'Alergia generada para demo' : '',
    status: archived ? 'asistio' : (i % 5 === 0 ? 'pendiente_pago' : 'confirmada'),
    totalAmount: 40,
    paidAmount: archived ? 40 : (i % 5 === 0 ? 0 : 40),
    paymentMethod: i % 2 === 0 ? 'bizum' : 'transferencia',
    registeredAt: new Date(Date.now() - (1000 * 60 * 60 * 24 * (i + 1))).toISOString(),
    updatedAt: new Date().toISOString()
  }));
};`;

const newGenerateParticipants = `const generateParticipants = (
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
      id: \`demo-part-\${activityId}-\${offset + i}\`,
      activityId,
      activityTitle,
      activityDate,
      activityType,
      fullName: \`Visitante Demo \${offset + i + 1}\`,
      email: \`demo.user\${offset + i + 1}@ejemplo.com\`,
      phone: \`600 000 \${String(offset + i).padStart(3, '0')}\`,
      spots: spotsToBook,
      turn: 'Turno único',
      membershipNumber: i % 4 === 0 ? \`SOC-\${100 + offset + i}\` : '',
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
};`;

code = code.replace(oldGenerateParticipants, newGenerateParticipants);

// Update demo-cata-4-vermut2 bookedSpots to 12
code = code.replace(
  `id: 'demo-cata-4-vermut2',
    title: 'LA HORA DEL VERMUT',
    subtitle: 'El Encuentro Mediterraneo y Clásico Reinventado',
    type: 'cata',
    date: '2026-06-21',
    time: '13:00 h',
    price: 20,
    totalSpots: 14,
    bookedSpots: 2,`,
  `id: 'demo-cata-4-vermut2',
    title: 'LA HORA DEL VERMUT',
    subtitle: 'El Encuentro Mediterraneo y Clásico Reinventado',
    type: 'cata',
    date: '2026-06-21',
    time: '13:00 h',
    price: 20,
    totalSpots: 14,
    bookedSpots: 12,`
);

// Update DEMO_PARTICIPANTS calls
const oldCalls = `export const DEMO_PARTICIPANTS: Participant[] = [
  ...generateParticipants('demo-cata-1-vermut', "La Hora Magica: CATA DE VERMUT'S", '2026-03-01', 'cata', 14, 0, true),
  ...generateParticipants('demo-cata-2-terruno', 'La Expresión del Terruño', '2026-04-10', 'cata', 14, 100),
  ...generateParticipants('demo-cata-3-coloman', 'Experiencia S.A.T. COLOMAN', '2026-06-05', 'cata', 7, 200),
  ...generateParticipants('demo-cata-4-vermut2', 'LA HORA DEL VERMUT', '2026-06-21', 'cata', 2, 300),
  ...generateParticipants('demo-curso-1-lleno', 'Curso Mockup 1 (Lleno)', '2026-10-15', 'curso', 16, 400),
  ...generateParticipants('demo-viaje-1-lleno', 'Viaje Mockup 1 (Lleno)', '2026-11-15', 'viaje', 25, 500)
];`;

const newCalls = `export const DEMO_PARTICIPANTS: Participant[] = [
  ...generateParticipants('demo-cata-1-vermut', "La Hora Magica: CATA DE VERMUT'S", '2026-03-01', 'cata', 14, 20, 0, true),
  ...generateParticipants('demo-cata-2-terruno', 'La Expresión del Terruño', '2026-04-10', 'cata', 14, 20, 100),
  ...generateParticipants('demo-cata-3-coloman', 'Experiencia S.A.T. COLOMAN', '2026-06-05', 'cata', 7, 20, 200),
  ...generateParticipants('demo-cata-4-vermut2', 'LA HORA DEL VERMUT', '2026-06-21', 'cata', 12, 20, 300),
  ...generateParticipants('demo-curso-1-lleno', 'Curso Mockup 1 (Lleno)', '2026-10-15', 'curso', 16, 150, 400),
  ...generateParticipants('demo-viaje-1-lleno', 'Viaje Mockup 1 (Lleno)', '2026-11-15', 'viaje', 25, 350, 500)
];`;

code = code.replace(oldCalls, newCalls);

fs.writeFileSync('src/data/demoData.ts', code);
console.log('Patched demoData.ts');
