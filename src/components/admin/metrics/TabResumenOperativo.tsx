import React from 'react';
import { 
  Calendar, 
  Users, 
  DollarSign, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  UserPlus, 
  Percent, 
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Building2,
  FileSpreadsheet
} from 'lucide-react';
import { computeOperationalMetrics, MetricPeriodType } from '../../../utils/metricsCalculator';
import { MetricStatusBadge } from './MetricStatusBadge';

interface TabResumenOperativoProps {
  metricsData: ReturnType<typeof computeOperationalMetrics>;
  onNavigateTab?: (tabId: string) => void;
}

export const TabResumenOperativo: React.FC<TabResumenOperativoProps> = ({
  metricsData,
  onNavigateTab
}) => {
  const {
    useMockData,
    periodLabel,
    upcomingActivitiesList,
    totalCapacity,
    totalBookedSpotsCalculated,
    averageOccupancyPercent,
    discrepanciesCount,
    totalRegistrations,
    effectiveAttendance,
    noShows,
    cancellations,
    activeMembersTotal,
    newMembersInPeriod,
    ingresosFacturados,
    ingresosCobrados,
    pendienteCobro,
    totalGastos,
    balanceNeto,
    topIssues
  } = metricsData;

  const badgeState = useMockData ? 'demo' : 'real';
  const badgeSource = useMockData ? 'Datos de prueba' : 'Firestore / Producción';

  return (
    <div className="space-y-6">
      {/* Disclaimer / Top bar info */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FBF9F5] border border-[#EDE4D7] rounded-xl p-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#521849]" />
          <span className="text-sm font-semibold text-[#26201D]">
            Periodo Activo: <span className="text-[#521849] font-bold">{periodLabel}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <MetricStatusBadge state={badgeState} source={badgeSource} />
        </div>
      </div>

      {/* 1. Bloque de Asistencia & Ocupación */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold font-serif text-[#26201D] flex items-center gap-2">
            <Percent className="w-4 h-4 text-[#521849]" />
            <span>Ocupación y Aforo de Actividades Próximas</span>
          </h4>
          <span className="text-xs text-[#574B45]">
            {upcomingActivitiesList.length} actividades en catálogo
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white border border-[#EDE4D7] shadow-xs">
            <div className="flex items-center justify-between text-[#574B45] mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Ocupación Media</span>
              <TrendingUp className="w-4 h-4 text-[#521849]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-serif text-[#26201D]">{averageOccupancyPercent}%</span>
              <span className="text-xs text-[#574B45]">del aforo</span>
            </div>
            <div className="w-full bg-stone-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div 
                className="bg-[#521849] h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, averageOccupancyPercent)}%` }}
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#EDE4D7] shadow-xs">
            <div className="flex items-center justify-between text-[#574B45] mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Plazas Reservadas</span>
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-serif text-[#26201D]">{totalBookedSpotsCalculated}</span>
              <span className="text-xs text-[#574B45]">de {totalCapacity} totales</span>
            </div>
            <p className="text-[11px] text-[#574B45] mt-2">
              Suma de reservas individuales y grupales confirmadas.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#EDE4D7] shadow-xs">
            <div className="flex items-center justify-between text-[#574B45] mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Asistencia Real</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-serif text-emerald-700">{effectiveAttendance}</span>
              <span className="text-xs text-[#574B45]">asistentes validados</span>
            </div>
            <p className="text-[11px] text-[#574B45] mt-2">
              {noShows > 0 ? `${noShows} ausencias (no asistió)` : 'Sin no-shows registrados en el periodo'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#EDE4D7] shadow-xs">
            <div className="flex items-center justify-between text-[#574B45] mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Censo de Socios</span>
              <UserPlus className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-serif text-[#26201D]">{activeMembersTotal}</span>
              <span className="text-xs text-emerald-600 font-semibold">+{newMembersInPeriod} en periodo</span>
            </div>
            <p className="text-[11px] text-[#574B45] mt-2">
              Socios con cuota o estado activo en el censo.
            </p>
          </div>
        </div>

        {/* Breakdown of upcoming activities */}
        {upcomingActivitiesList.length > 0 && (
          <div className="mt-4 bg-white border border-[#EDE4D7] rounded-xl overflow-hidden shadow-xs">
            <div className="p-3 bg-[#FAF8F5] border-b border-[#EDE4D7] text-xs font-bold text-[#26201D]">
              Desglose de Aforo por Actividad Próxima
            </div>
            <div className="divide-y divide-[#EDE4D7]">
              {upcomingActivitiesList.map(act => {
                const occupancy = act.totalSpots > 0 ? Math.round((act.bookedSpots / act.totalSpots) * 100) : 0;
                const isFull = act.bookedSpots >= act.totalSpots;
                return (
                  <div key={act.id} className="p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="min-w-[200px]">
                      <div className="font-semibold text-[#26201D]">{act.title}</div>
                      <div className="text-[11px] text-[#574B45]">{act.date} {act.time ? `• ${act.time}` : ''} • {act.type.toUpperCase()}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="font-bold text-[#26201D]">{act.bookedSpots}</span>
                        <span className="text-[#574B45]"> / {act.totalSpots} plazas</span>
                      </div>
                      <div className="w-20 bg-stone-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${isFull ? 'bg-amber-600' : 'bg-[#521849]'}`}
                          style={{ width: `${Math.min(100, occupancy)}%` }}
                        />
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isFull ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {occupancy}% {isFull ? '(Completo)' : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. Bloque Financiero Operativo */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold font-serif text-[#26201D] flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[#521849]" />
            <span>Resumen Financiero & Cobros</span>
          </h4>
          <span className="text-xs text-[#574B45]">
            Métricas sincronizadas con el módulo de Contabilidad
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white border border-[#EDE4D7] shadow-xs">
            <div className="text-xs font-semibold text-[#574B45] uppercase mb-1">Ingresos Facturados</div>
            <div className="text-2xl font-bold font-serif text-[#26201D]">
              {ingresosFacturados.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
            </div>
            <div className="text-[11px] text-[#574B45] mt-2">
              Reservas + Patrocinios devengados
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#EDE4D7] shadow-xs">
            <div className="text-xs font-semibold text-[#574B45] uppercase mb-1">Ingresos Cobrados</div>
            <div className="text-2xl font-bold font-serif text-emerald-700">
              {ingresosCobrados.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
            </div>
            <div className="text-[11px] text-emerald-600 mt-2 font-medium">
              Dinero recibido en cuenta o caja
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#EDE4D7] shadow-xs">
            <div className="text-xs font-semibold text-[#574B45] uppercase mb-1">Pendiente de Cobro</div>
            <div className={`text-2xl font-bold font-serif ${pendienteCobro > 0 ? 'text-amber-600' : 'text-stone-700'}`}>
              {pendienteCobro.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
            </div>
            <div className="text-[11px] text-[#574B45] mt-2">
              {pendienteCobro > 0 ? 'Cobros pendientes de confirmar' : 'Al día, 0 € pendientes'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#EDE4D7] shadow-xs">
            <div className="text-xs font-semibold text-[#574B45] uppercase mb-1">Balance Neto Operativo</div>
            <div className={`text-2xl font-bold font-serif ${balanceNeto >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {balanceNeto.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
            </div>
            <div className="text-[11px] text-[#574B45] mt-2">
              Gastos deducidos: {totalGastos.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Avisos Operativos y Puntos de Atención */}
      {topIssues.length > 0 && (
        <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl">
          <h5 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-700" />
            <span>Puntos de Atención Operativa</span>
          </h5>
          <div className="space-y-2">
            {topIssues.map((issue, idx) => (
              <div key={idx} className="flex items-start justify-between gap-3 p-2.5 bg-white rounded-lg border border-amber-200 text-xs">
                <div>
                  <div className="font-bold text-[#26201D]">{issue.title}</div>
                  <div className="text-[11px] text-[#574B45] mt-0.5">{issue.desc}</div>
                </div>
                {onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateTab(issue.linkTab)}
                    className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#521849] text-white text-[11px] font-medium hover:bg-[#3d1236] transition-colors"
                  >
                    <span>Ir</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
