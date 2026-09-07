import { generateAccountingWorkbook } from '../src/utils/accountingExport';
import { Activity, Participant, Sponsorship, Expense } from '../src/types';
import * as XLSX from 'xlsx';

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, details: string) {
  if (condition) {
    results.push({ name, passed: true, details });
    console.log(`[PASS] ${name}: ${details}`);
  } else {
    results.push({ name, passed: false, details: `FAILED: ${details}` });
    console.error(`[FAIL] ${name}: ${details}`);
  }
}

console.log('====================================================');
console.log('EJECUCIÓN DE PRUEBAS T-06: CONTROL DE CUENTAS Y EXPORTACIÓN');
console.log('====================================================\n');

// ----------------------------------------------------------------------------
// Helper to simulate AccountsManager financesByActivity calculation
// ----------------------------------------------------------------------------
function computeFinancesForActivity(
  act: Activity,
  participants: Participant[],
  sponsorships: Sponsorship[],
  expenses: Expense[]
) {
  const actAsistioParticipants = participants.filter(
    p => p.activityId === act.id && p.status === 'asistio'
  );

  const asistentes = actAsistioParticipants.length;
  const aforo = act.totalSpots || 0;

  const numSocios = actAsistioParticipants.filter(p => p.isMember).length;
  const numNoSocios = actAsistioParticipants.filter(p => !p.isMember).length;

  const reservasFacturadas = actAsistioParticipants.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  const reservasCobradas = actAsistioParticipants.reduce((sum, p) => sum + (p.paidAmount ?? 0), 0);

  const actSponsorships = sponsorships.filter(s => s.activityId === act.id);
  const activeSponsorships = actSponsorships.filter(s => s.status !== 'cancelado');
  const patrociniosFacturados = activeSponsorships.reduce((sum, s) => sum + (s.amount || 0), 0);
  const patrociniosCobrados = activeSponsorships.reduce((sum, s) => sum + (s.paidAmount ?? 0), 0);

  const ingresosFacturados = reservasFacturadas + patrociniosFacturados;
  const ingresosCobrados = reservasCobradas + patrociniosCobrados;

  const actExpenses = expenses.filter(e => e.activityId === act.id);
  const gastos = actExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const gastoPorAsistente = asistentes > 0 ? gastos / asistentes : 0;

  return {
    reservasFacturadas,
    reservasCobradas,
    patrociniosFacturados,
    patrociniosCobrados,
    ingresosFacturados,
    ingresosCobrados,
    gastos,
    balance: ingresosCobrados - gastos,
    hasExpenses: actExpenses.length > 0,
    asistentes,
    aforo,
    gastoPorAsistente,
    numSocios,
    numNoSocios
  };
}

// ----------------------------------------------------------------------------
// TEST AC-01: Una actividad con un participante en cada uno de los 5 estados
// ----------------------------------------------------------------------------
const activityAC1: Activity = {
  id: 'act-ac-01',
  title: 'Cata Cinco Estados',
  subtitle: 'Cata de prueba',
  date: '2026-10-20',
  time: '19:00',
  endTime: '21:00',
  location: 'Sede Doña Berenjena',
  type: 'cata',
  category: 'vino',
  totalSpots: 20,
  bookedSpots: 5,
  priceMember: 25,
  priceNonMember: 35,
  status: 'celebrada',
  images: [],
  description: 'Test AC-01',
  featured: false,
  createdAt: '2026-09-01T10:00:00.000Z',
  updatedAt: '2026-09-01T10:00:00.000Z'
};

const participantsAC1: Participant[] = [
  {
    id: 'p-1',
    groupId: 'grp-1',
    activityId: 'act-ac-01',
    activityTitle: activityAC1.title,
    activityDate: activityAC1.date,
    activityType: activityAC1.type,
    fullName: 'Persona Pendiente',
    email: 'pendiente@example.com',
    phone: '600000001',
    isMember: false,
    status: 'pendiente_pago',
    paymentMethod: 'transferencia',
    totalAmount: 35,
    paidAmount: 0,
    registeredAt: '2026-09-02T10:00:00.000Z'
  },
  {
    id: 'p-2',
    groupId: 'grp-2',
    activityId: 'act-ac-01',
    activityTitle: activityAC1.title,
    activityDate: activityAC1.date,
    activityType: activityAC1.type,
    fullName: 'Persona Pagada No Asistió',
    email: 'pagada@example.com',
    phone: '600000002',
    isMember: true,
    status: 'pagada',
    paymentMethod: 'tarjeta',
    totalAmount: 25,
    paidAmount: 25,
    registeredAt: '2026-09-02T10:00:00.000Z'
  },
  {
    id: 'p-3',
    groupId: 'grp-3',
    activityId: 'act-ac-01',
    activityTitle: activityAC1.title,
    activityDate: activityAC1.date,
    activityType: activityAC1.type,
    fullName: 'Persona Espera',
    email: 'espera@example.com',
    phone: '600000003',
    isMember: false,
    status: 'lista_de_espera',
    paymentMethod: 'transferencia',
    totalAmount: 35,
    paidAmount: 0,
    registeredAt: '2026-09-02T10:00:00.000Z'
  },
  {
    id: 'p-4',
    groupId: 'grp-4',
    activityId: 'act-ac-01',
    activityTitle: activityAC1.title,
    activityDate: activityAC1.date,
    activityType: activityAC1.type,
    fullName: 'Persona Cancelada',
    email: 'cancelada@example.com',
    phone: '600000004',
    isMember: false,
    status: 'cancelada',
    cancellationKind: 'cancelacion_usuario',
    paymentMethod: 'tarjeta',
    totalAmount: 35,
    paidAmount: 0,
    registeredAt: '2026-09-02T10:00:00.000Z'
  },
  {
    id: 'p-5',
    groupId: 'grp-5',
    activityId: 'act-ac-01',
    activityTitle: activityAC1.title,
    activityDate: activityAC1.date,
    activityType: activityAC1.type,
    fullName: 'Persona Asistió',
    email: 'asistio@example.com',
    phone: '600000005',
    isMember: true,
    status: 'asistio',
    paymentMethod: 'efectivo',
    totalAmount: 25,
    paidAmount: 25,
    registeredAt: '2026-09-02T10:00:00.000Z'
  }
];

const finAC1 = computeFinancesForActivity(activityAC1, participantsAC1, [], []);

assert(
  finAC1.asistentes === 1,
  'AC-01: Asistentes en Cuentas',
  `Esperado 1 asistente, obtenido: ${finAC1.asistentes}`
);
assert(
  finAC1.reservasFacturadas === 25 && finAC1.reservasCobradas === 25,
  'AC-01: Ingresos de reserva en Cuentas',
  `Esperado facturado=25€, cobrado=25€; obtenido facturado=${finAC1.reservasFacturadas}€, cobrado=${finAC1.reservasCobradas}€`
);
assert(
  finAC1.numSocios === 1 && finAC1.numNoSocios === 0,
  'AC-01: Desglose socios/no socios',
  `Esperado socios=1, noSocios=0; obtenido socios=${finAC1.numSocios}, noSocios=${finAC1.numNoSocios}`
);

// ----------------------------------------------------------------------------
// TEST AC-02: Participante Asistió con spotsCount: 4
// ----------------------------------------------------------------------------
const activityAC2: Activity = {
  ...activityAC1,
  id: 'act-ac-02',
  title: 'Cata Spots Count Multiple'
};

const participantsAC2: Participant[] = [
  {
    id: 'p-multi',
    groupId: 'grp-multi',
    activityId: 'act-ac-02',
    activityTitle: activityAC2.title,
    activityDate: activityAC2.date,
    activityType: activityAC2.type,
    fullName: 'Persona con Reserva Multiple',
    email: 'multi@example.com',
    phone: '600000009',
    isMember: false,
    status: 'asistio',
    spotsCount: 4,
    paymentMethod: 'tarjeta',
    totalAmount: 35,
    paidAmount: 35,
    registeredAt: '2026-09-02T10:00:00.000Z'
  }
];

const finAC2 = computeFinancesForActivity(activityAC2, participantsAC2, [], []);

assert(
  finAC2.asistentes === 1,
  'AC-02: Conteo de personas con spotsCount: 4',
  `Esperado 1 asistente (sin multiplicar por spotsCount), obtenido: ${finAC2.asistentes}`
);
assert(
  finAC2.reservasFacturadas === 35 && finAC2.reservasCobradas === 35,
  'AC-02: Importes de reserva con spotsCount: 4',
  `Esperado facturado=35€, cobrado=35€; obtenido facturado=${finAC2.reservasFacturadas}€, cobrado=${finAC2.reservasCobradas}€`
);

// ----------------------------------------------------------------------------
// TEST AC-03: Exportación Excel con datos de AC-01
// ----------------------------------------------------------------------------
const wbAC3 = generateAccountingWorkbook({
  year: '2026',
  activities: [activityAC1],
  participants: participantsAC1,
  sponsorships: [],
  expenses: [],
  financesByActivity: { [activityAC1.id]: finAC1 }
});

const reservasSheet = wbAC3.Sheets['Reservas'];
const reservasData: any[] = XLSX.utils.sheet_to_json(reservasSheet);

assert(
  reservasData.length === 1 && reservasData[0]['Nombre Asistente'] === 'Persona Asistió',
  'AC-03: Hoja Reservas en Excel exporta solo asistio',
  `Esperada 1 fila con 'Persona Asistió', obtenidas ${reservasData.length} filas: ${JSON.stringify(reservasData.map(r => r['Nombre Asistente']))}`
);

const resumenSheet = wbAC3.Sheets['Resumen'];
const resumenData: any[] = XLSX.utils.sheet_to_json(resumenSheet);
const rowAsistentes = resumenData.find(r => r['Concepto'] === 'Total Asistentes Registrados');
const rowFacturadas = resumenData.find(r => r['Concepto'] === 'Reservas Facturadas (€)');
const rowCobradas = resumenData.find(r => r['Concepto'] === 'Reservas Cobradas (€)');

assert(
  rowAsistentes?.['Detalle / Importe (€)'] === 1,
  'AC-03: Total Asistentes en Resumen Excel',
  `Esperado 1 asistente, obtenido: ${rowAsistentes?.['Detalle / Importe (€)']}`
);

assert(
  rowFacturadas?.['Detalle / Importe (€)'] === 25 && rowCobradas?.['Detalle / Importe (€)'] === 25,
  'AC-03: Totales facturadas y cobradas en Resumen Excel',
  `Esperado facturado=25€, cobrado=25€; obtenido facturado=${rowFacturadas?.['Detalle / Importe (€)']}, cobrado=${rowCobradas?.['Detalle / Importe (€)']}`
);

// ----------------------------------------------------------------------------
// TEST AC-04: Solo Pendiente, Pagada, Espera y Cancelada (Cero Asistió)
// ----------------------------------------------------------------------------
const activityAC4: Activity = {
  ...activityAC1,
  id: 'act-ac-04',
  title: 'Cata Sin Asistencias'
};

const participantsAC4: Participant[] = participantsAC1.filter(p => p.status !== 'asistio');
const finAC4 = computeFinancesForActivity(activityAC4, participantsAC4, [], []);

assert(
  finAC4.asistentes === 0 && finAC4.reservasFacturadas === 0 && finAC4.reservasCobradas === 0,
  'AC-04: Cuentas con cero asistencias',
  `Esperado asistentes=0, facturado=0, cobrado=0; obtenido asistentes=${finAC4.asistentes}, facturado=${finAC4.reservasFacturadas}, cobrado=${finAC4.reservasCobradas}`
);

const wbAC4 = generateAccountingWorkbook({
  year: '2026',
  activities: [activityAC4],
  participants: participantsAC4,
  sponsorships: [],
  expenses: [],
  financesByActivity: { [activityAC4.id]: finAC4 }
});

const reservasSheetAC4 = wbAC4.Sheets['Reservas'];
const reservasDataAC4: any[] = XLSX.utils.sheet_to_json(reservasSheetAC4);

assert(
  reservasDataAC4.length === 1 && reservasDataAC4[0]['Aviso'] !== undefined,
  'AC-04: Hoja Reservas vacía o con aviso cuando no hay asistencias',
  `Esperado aviso de sin reservas, obtenido: ${JSON.stringify(reservasDataAC4)}`
);

console.log('\n====================================================');
console.log('RESUMEN DE PRUEBAS T-06');
console.log('====================================================');
const failed = results.filter(r => !r.passed);
console.log(`Total: ${results.length} | Pasadas: ${results.length - failed.length} | Fallidas: ${failed.length}`);

if (failed.length > 0) {
  console.error('\nPRUEBAS FALLIDAS:');
  failed.forEach(f => console.error(`- ${f.name}: ${f.details}`));
  process.exit(1);
} else {
  console.log('\nTODAS LAS PRUEBAS DE T-06 HAN PASADO CON ÉXITO.');
}
