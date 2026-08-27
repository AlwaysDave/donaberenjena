import * as XLSX from 'xlsx';
import { Activity, Participant, Sponsorship, Expense } from '../types';
import { formatDisplayDate } from './dateUtils';

interface ActivityFinances {
  reservasFacturadas: number;
  reservasCobradas: number;
  patrociniosFacturados: number;
  patrociniosCobrados: number;
  ingresosFacturados: number;
  ingresosCobrados: number;
  gastos: number;
  balance: number;
  asistentes: number;
  aforo: number;
  gastoPorAsistente: number;
  numSocios: number;
  numNoSocios: number;
}

interface ExportAccountingOptions {
  year: string;
  activities: Activity[];
  participants: Participant[];
  sponsorships: Sponsorship[];
  expenses: Expense[];
  financesByActivity: Record<string, ActivityFinances>;
}

function formatDate(dateStr?: string): string {
  return formatDisplayDate(dateStr);
}

function calculateColumnWidths(data: any[]): { wch: number }[] {
  if (!data || data.length === 0) return [];
  const colWidths: { [key: number]: number } = {};
  
  data.forEach(row => {
    Object.values(row).forEach((val, colIdx) => {
      const len = val !== null && val !== undefined ? String(val).length : 0;
      colWidths[colIdx] = Math.max(colWidths[colIdx] || 10, len + 3);
    });
  });

  return Object.values(colWidths).map(w => ({ wch: Math.min(Math.max(w, 12), 48) }));
}

export function exportAccountingToExcel(options: ExportAccountingOptions): void {
  const { year, activities, participants, sponsorships, expenses, financesByActivity } = options;
  const wb = XLSX.utils.book_new();

  // -------------------------------------------------------------
  // 1. HOJA: RESUMEN
  // -------------------------------------------------------------
  let totalReservasFact = 0;
  let totalReservasCob = 0;
  let totalPatrociniosFact = 0;
  let totalPatrociniosCob = 0;
  let totalIngresosCob = 0;
  let totalGastos = 0;
  let totalBalance = 0;
  let totalAsistentes = 0;

  const typeSummary: Record<string, { count: number; asistentes: number; reservasCob: number; patrociniosCob: number; ingresosCob: number; gastos: number; balance: number }> = {
    cata: { count: 0, asistentes: 0, reservasCob: 0, patrociniosCob: 0, ingresosCob: 0, gastos: 0, balance: 0 },
    curso: { count: 0, asistentes: 0, reservasCob: 0, patrociniosCob: 0, ingresosCob: 0, gastos: 0, balance: 0 },
    viaje: { count: 0, asistentes: 0, reservasCob: 0, patrociniosCob: 0, ingresosCob: 0, gastos: 0, balance: 0 }
  };

  activities.forEach(act => {
    const f = financesByActivity[act.id] || {
      reservasFacturadas: 0,
      reservasCobradas: 0,
      patrociniosFacturados: 0,
      patrociniosCobrados: 0,
      ingresosFacturados: 0,
      ingresosCobrados: 0,
      gastos: 0,
      balance: 0,
      asistentes: 0
    };

    totalReservasFact += f.reservasFacturadas;
    totalReservasCob += f.reservasCobradas;
    totalPatrociniosFact += f.patrociniosFacturados;
    totalPatrociniosCob += f.patrociniosCobrados;
    totalIngresosCob += f.ingresosCobrados;
    totalGastos += f.gastos;
    totalBalance += f.balance;
    totalAsistentes += f.asistentes;

    if (typeSummary[act.type]) {
      typeSummary[act.type].count += 1;
      typeSummary[act.type].asistentes += f.asistentes;
      typeSummary[act.type].reservasCob += f.reservasCobradas;
      typeSummary[act.type].patrociniosCob += f.patrociniosCobrados;
      typeSummary[act.type].ingresosCob += f.ingresosCobrados;
      typeSummary[act.type].gastos += f.gastos;
      typeSummary[act.type].balance += f.balance;
    }
  });

  const resumenRows = [
    { 'Concepto': 'INFORME CONTABLE GLOBAL', 'Detalle / Importe (€)': `Asociación Cultural Doña Berenjena - Ejercicio ${year === 'all' ? 'Todos los años' : year}` },
    { 'Concepto': 'Fecha de generación', 'Detalle / Importe (€)': formatDate(new Date().toISOString()) },
    { 'Concepto': '', 'Detalle / Importe (€)': '' },
    { 'Concepto': '--- TOTALES GLOBALES ---', 'Detalle / Importe (€)': '' },
    { 'Concepto': 'Total Actividades', 'Detalle / Importe (€)': activities.length },
    { 'Concepto': 'Total Asistentes Confirmados', 'Detalle / Importe (€)': totalAsistentes },
    { 'Concepto': 'Reservas Facturadas (€)', 'Detalle / Importe (€)': Number(totalReservasFact.toFixed(2)) },
    { 'Concepto': 'Reservas Cobradas (€)', 'Detalle / Importe (€)': Number(totalReservasCob.toFixed(2)) },
    { 'Concepto': 'Patrocinios Facturados (€)', 'Detalle / Importe (€)': Number(totalPatrociniosFact.toFixed(2)) },
    { 'Concepto': 'Patrocinios Cobrados (€)', 'Detalle / Importe (€)': Number(totalPatrociniosCob.toFixed(2)) },
    { 'Concepto': 'Ingresos Totales Cobrados (€)', 'Detalle / Importe (€)': Number(totalIngresosCob.toFixed(2)) },
    { 'Concepto': 'Gastos Totales (€)', 'Detalle / Importe (€)': Number(totalGastos.toFixed(2)) },
    { 'Concepto': 'BALANCE NETO (€)', 'Detalle / Importe (€)': Number(totalBalance.toFixed(2)) },
    { 'Concepto': '', 'Detalle / Importe (€)': '' },
    { 'Concepto': '--- SUB-TOTALES POR TIPO DE ACTIVIDAD ---', 'Detalle / Importe (€)': '' },
    { 'Concepto': `Catas (${typeSummary.cata.count} act.)`, 'Detalle / Importe (€)': `Ingresos: ${typeSummary.cata.ingresosCob.toFixed(2)}€ | Gastos: ${typeSummary.cata.gastos.toFixed(2)}€ | Balance: ${typeSummary.cata.balance.toFixed(2)}€` },
    { 'Concepto': `Cursos (${typeSummary.curso.count} act.)`, 'Detalle / Importe (€)': `Ingresos: ${typeSummary.curso.ingresosCob.toFixed(2)}€ | Gastos: ${typeSummary.curso.gastos.toFixed(2)}€ | Balance: ${typeSummary.curso.balance.toFixed(2)}€` },
    { 'Concepto': `Viajes (${typeSummary.viaje.count} act.)`, 'Detalle / Importe (€)': `Ingresos: ${typeSummary.viaje.ingresosCob.toFixed(2)}€ | Gastos: ${typeSummary.viaje.gastos.toFixed(2)}€ | Balance: ${typeSummary.viaje.balance.toFixed(2)}€` }
  ];

  const wsResumen = XLSX.utils.json_to_sheet(resumenRows);
  wsResumen['!cols'] = [{ wch: 40 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

  // -------------------------------------------------------------
  // 2. HOJA: ACTIVIDADES
  // -------------------------------------------------------------
  const actividadesRows = activities.map(act => {
    const f = financesByActivity[act.id] || {
      reservasFacturadas: 0,
      reservasCobradas: 0,
      patrociniosFacturados: 0,
      patrociniosCobrados: 0,
      ingresosFacturados: 0,
      ingresosCobrados: 0,
      gastos: 0,
      balance: 0,
      asistentes: 0,
      aforo: act.totalSpots,
      gastoPorAsistente: 0
    };

    const ocupacionPct = f.aforo > 0 ? `${Math.round((f.asistentes / f.aforo) * 100)}%` : '0%';

    return {
      'ID Actividad': act.id,
      'Actividad': act.title,
      'Tipo': act.type.toUpperCase(),
      'Fecha': formatDate(act.date),
      'Estado': act.status,
      'Aforo': f.aforo,
      'Asistentes': f.asistentes,
      '% Ocupación': ocupacionPct,
      'Precio Socio (€)': act.priceMember,
      'Precio No Socio (€)': act.priceNonMember,
      'Reservas Facturadas (€)': Number(f.reservasFacturadas.toFixed(2)),
      'Reservas Cobradas (€)': Number(f.reservasCobradas.toFixed(2)),
      'Patrocinios Facturados (€)': Number(f.patrociniosFacturados.toFixed(2)),
      'Patrocinios Cobrados (€)': Number(f.patrociniosCobrados.toFixed(2)),
      'Ingresos Totales Cobrados (€)': Number(f.ingresosCobrados.toFixed(2)),
      'Gastos Totales (€)': Number(f.gastos.toFixed(2)),
      'Gasto Medio / Asist. (€)': Number(f.gastoPorAsistente.toFixed(2)),
      'Balance Neto (€)': Number(f.balance.toFixed(2))
    };
  });

  const wsActividades = XLSX.utils.json_to_sheet(
    actividadesRows.length > 0
      ? actividadesRows
      : [{ 'Aviso': 'No hay actividades en el período seleccionado' }]
  );
  wsActividades['!cols'] = calculateColumnWidths(actividadesRows);
  if (actividadesRows.length > 0) {
    wsActividades['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: 17, r: actividadesRows.length } }) };
  }
  XLSX.utils.book_append_sheet(wb, wsActividades, 'Actividades');

  // -------------------------------------------------------------
  // 3. HOJA: RESERVAS
  // -------------------------------------------------------------
  const activityMap = new Map<string, Activity>(activities.map(a => [a.id, a]));
  const filteredActivityIds = new Set(activities.map(a => a.id));

  const validParticipants = participants.filter(
    p => filteredActivityIds.has(p.activityId) && p.status !== 'cancelada'
  );

  const reservasRows = validParticipants.map(p => {
    const act = activityMap.get(p.activityId);
    const total = p.totalAmount || 0;
    const paid = p.paidAmount ?? 0;
    const pending = Math.max(0, total - paid);

    return {
      'ID Actividad': p.activityId,
      'Actividad': act ? act.title : p.activityId,
      'Fecha Actividad': act ? formatDate(act.date) : '',
      'Nombre Asistente': p.fullName,
      'Email': p.email || '',
      'Teléfono': p.phone || '',
      'Condición': p.isMember ? 'Socio' : 'General',
      'Nº Socio': p.membershipNumber || '',
      'Plazas': p.spotsCount || 1,
      'Total Facturado (€)': Number(total.toFixed(2)),
      'Importe Cobrado (€)': Number(paid.toFixed(2)),
      'Pendiente (€)': Number(pending.toFixed(2)),
      'Estado': p.status,
      'Método de Pago': p.paymentMethod || 'no_especificado',
      'Fecha Registro': formatDate(p.registeredAt)
    };
  });

  const wsReservas = XLSX.utils.json_to_sheet(
    reservasRows.length > 0
      ? reservasRows
      : [{ 'Aviso': 'No hay reservas registradas en el período' }]
  );
  wsReservas['!cols'] = calculateColumnWidths(reservasRows);
  if (reservasRows.length > 0) {
    wsReservas['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: 14, r: reservasRows.length } }) };
  }
  XLSX.utils.book_append_sheet(wb, wsReservas, 'Reservas');

  // -------------------------------------------------------------
  // 4. HOJA: PATROCINIOS
  // -------------------------------------------------------------
  const filteredSponsorships = sponsorships.filter(s => filteredActivityIds.has(s.activityId));

  const patrociniosRows = filteredSponsorships.map(s => {
    const act = activityMap.get(s.activityId);
    const amount = s.amount || 0;
    const paid = s.paidAmount ?? 0;
    const pending = s.status === 'cancelado' ? 0 : Math.max(0, amount - paid);

    return {
      'ID Patrocinio': s.id,
      'ID Actividad': s.activityId,
      'Actividad': act ? act.title : s.activityId,
      'Patrocinador': s.sponsorName,
      'Concepto': s.concept,
      'Fecha': formatDate(s.date),
      'Importe Facturado (€)': Number(amount.toFixed(2)),
      'Importe Cobrado (€)': Number(paid.toFixed(2)),
      'Pendiente (€)': Number(pending.toFixed(2)),
      'Estado': s.status,
      'Notas': s.notes || ''
    };
  });

  const wsPatrocinios = XLSX.utils.json_to_sheet(
    patrociniosRows.length > 0
      ? patrociniosRows
      : [{ 'Aviso': 'No hay patrocinios registrados en el período' }]
  );
  wsPatrocinios['!cols'] = calculateColumnWidths(patrociniosRows);
  if (patrociniosRows.length > 0) {
    wsPatrocinios['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: 10, r: patrociniosRows.length } }) };
  }
  XLSX.utils.book_append_sheet(wb, wsPatrocinios, 'Patrocinios');

  // -------------------------------------------------------------
  // 5. HOJA: GASTOS
  // -------------------------------------------------------------
  const filteredExpenses = expenses.filter(e => filteredActivityIds.has(e.activityId));

  const gastosRows = filteredExpenses.map(e => {
    const act = activityMap.get(e.activityId);

    return {
      'ID Gasto': e.id,
      'ID Actividad': e.activityId,
      'Actividad': act ? act.title : e.activityId,
      'Concepto': e.concept,
      'Categoría': e.category,
      'Fecha': formatDate(e.date),
      'Importe (€)': Number((e.amount || 0).toFixed(2)),
      'Notas': e.notes || '',
      'Comprobante 1': e.receiptImageUrl || '',
      'Comprobante 2': e.receiptImageUrl2 || ''
    };
  });

  const wsGastos = XLSX.utils.json_to_sheet(
    gastosRows.length > 0
      ? gastosRows
      : [{ 'Aviso': 'No hay gastos registrados en el período' }]
  );
  wsGastos['!cols'] = calculateColumnWidths(gastosRows);
  if (gastosRows.length > 0) {
    wsGastos['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: 9, r: gastosRows.length } }) };
  }
  XLSX.utils.book_append_sheet(wb, wsGastos, 'Gastos');

  // -------------------------------------------------------------
  // DESCARGA DE ARCHIVO
  // -------------------------------------------------------------
  const fileName = `contabilidad-dona-berenjena-${year === 'all' ? 'todos-los-anos' : year}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
