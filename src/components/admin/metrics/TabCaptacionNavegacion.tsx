import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  ArrowRight, 
  Eye, 
  MousePointerClick, 
  CheckCircle2, 
  Calendar, 
  RefreshCw, 
  AlertCircle, 
  FileText, 
  Sparkles, 
  HelpCircle,
  Clock,
  Compass,
  Layers,
  ChevronRight,
  TrendingDown
} from 'lucide-react';
import { AcquisitionMetrics, MetricPeriodType } from '../../../types';
import { fetchAcquisitionMetrics } from '../../../services/metricsService';
import { MetricStatusBadge } from './MetricStatusBadge';

interface TabCaptacionNavegacionProps {
  useMockData: boolean;
  adminToken?: string;
}

export const TabCaptacionNavegacion: React.FC<TabCaptacionNavegacionProps> = ({
  useMockData,
  adminToken
}) => {
  const [period, setPeriod] = useState<MetricPeriodType>('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AcquisitionMetrics | null>(null);

  const loadMetrics = async (targetPeriod: MetricPeriodType = period) => {
    setIsLoading(true);
    setError(null);

    try {
      if (useMockData) {
        // Deterministic mock preview for offline / demo mode
        const mockMetrics: AcquisitionMetrics = {
          period: targetPeriod,
          periodType: targetPeriod,
          source: 'Simulación local (Modo Demo)',
          updatedAt: new Date().toISOString(),
          status: 'demo',
          funnel: {
            catasViews: 2840,
            activityViews: 1420,
            registrationStarts: 380,
            reservationsCompleted: 215,
            rates: {
              activityToCatasPercent: 50.0,
              startsToActivityPercent: 26.8,
              completedToStartsPercent: 56.6,
            }
          },
          topPages: [
            { path: '/catas', label: 'Catas & Experiencias', views: 2840 },
            { path: '/', label: 'Portada Principal', views: 2120 },
            { path: '/cursos', label: 'Cursos & Talleres', views: 980 },
            { path: '/viajes', label: 'Viajes Gastronómicos', views: 640 },
            { path: '/conocenos', label: 'Conócenos', views: 510 },
            { path: '/instalaciones', label: 'Instalaciones', views: 390 },
            { path: '/contacto', label: 'Contacto', views: 280 }
          ],
          activityInterest: [
            { activityId: 'demo-1', title: 'Gran Cata Maridaje de Primavera', views: 620, starts: 180, completed: 110, conversionRate: 17.7 },
            { activityId: 'demo-2', title: 'Taller de Iniciación a los Vinos de Jerez', views: 430, starts: 120, completed: 65, conversionRate: 15.1 },
            { activityId: 'demo-3', title: 'Experiencia Vermuts Artesanos y Aperitivos', views: 370, starts: 80, completed: 40, conversionRate: 10.8 }
          ],
          conversionOpportunities: []
        };
        setData(mockMetrics);
      } else {
        const res = await fetchAcquisitionMetrics(
          targetPeriod,
          adminToken,
          targetPeriod === 'custom' ? customStart : undefined,
          targetPeriod === 'custom' ? customEnd : undefined
        );
        setData(res);
      }
    } catch (err: any) {
      console.error('[ACQUISITION_LOAD_ERROR]', err);
      setError(err?.message || 'Error al obtener las métricas de captación.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics(period);
  }, [period, useMockData]);

  const handlePeriodChange = (newPeriod: MetricPeriodType) => {
    setPeriod(newPeriod);
  };

  const handleApplyCustom = () => {
    if (customStart && customEnd) {
      loadMetrics('custom');
    }
  };

  const funnel = data?.funnel;
  const rates = funnel?.rates;

  return (
    <div className="space-y-6">
      {/* Top Header & Period Selector */}
      <div className="bg-white border border-[#EDE4D7] rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold font-serif text-[#26201D]">
              Embudo de Captación y Navegación Web
            </h3>
            {data && (
              <MetricStatusBadge 
                state={data.status} 
                label={
                  data.status === 'real' ? 'Métricas Reales' :
                  data.status === 'collecting' ? 'Recopilando datos' :
                  data.status === 'nodata' ? 'Sin datos en periodo' :
                  data.status === 'demo' ? 'Modo Demo' : 'Estado'
                }
              />
            )}
          </div>
          <p className="text-xs text-[#574B45]">
            Supervisión del recorrido del visitante desde la exploración inicial hasta la confirmación de reserva.
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#FAF8F5] p-1.5 rounded-xl border border-[#EDE4D7]">
          <button
            type="button"
            onClick={() => handlePeriodChange('30d')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              period === '30d' 
                ? 'bg-[#521849] text-white shadow-2xs' 
                : 'text-[#574B45] hover:text-[#26201D] hover:bg-stone-200/50'
            }`}
          >
            Últimos 30 días
          </button>
          <button
            type="button"
            onClick={() => handlePeriodChange('month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              period === 'month' 
                ? 'bg-[#521849] text-white shadow-2xs' 
                : 'text-[#574B45] hover:text-[#26201D] hover:bg-stone-200/50'
            }`}
          >
            Mes actual
          </button>
          <button
            type="button"
            onClick={() => handlePeriodChange('year')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              period === 'year' 
                ? 'bg-[#521849] text-white shadow-2xs' 
                : 'text-[#574B45] hover:text-[#26201D] hover:bg-stone-200/50'
            }`}
          >
            Año actual
          </button>
          <button
            type="button"
            onClick={() => handlePeriodChange('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              period === 'all' 
                ? 'bg-[#521849] text-white shadow-2xs' 
                : 'text-[#574B45] hover:text-[#26201D] hover:bg-stone-200/50'
            }`}
          >
            Histórico completo
          </button>
          <button
            type="button"
            onClick={() => handlePeriodChange('custom')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              period === 'custom' 
                ? 'bg-[#521849] text-white shadow-2xs' 
                : 'text-[#574B45] hover:text-[#26201D] hover:bg-stone-200/50'
            }`}
          >
            Personalizado
          </button>

          <button
            type="button"
            onClick={() => loadMetrics()}
            disabled={isLoading}
            title="Actualizar datos"
            className="p-1.5 rounded-lg text-[#574B45] hover:text-[#26201D] hover:bg-stone-200/50 transition-colors ml-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#521849]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Custom Date Range Picker */}
      {period === 'custom' && (
        <div className="bg-[#FAF8F5] border border-[#EDE4D7] rounded-xl p-4 flex flex-wrap items-center gap-3 animate-fadeIn">
          <span className="text-xs font-bold text-[#26201D] flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#521849]" />
            Rango de fechas:
          </span>
          <div className="flex items-center gap-2">
            <label htmlFor="custom-metric-start" className="text-xs text-[#574B45]">Desde:</label>
            <input
              id="custom-metric-start"
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-white border border-[#EDE4D7] text-[#26201D] focus:ring-1 focus:ring-[#521849]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="custom-metric-end" className="text-xs text-[#574B45]">Hasta:</label>
            <input
              id="custom-metric-end"
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-white border border-[#EDE4D7] text-[#26201D] focus:ring-1 focus:ring-[#521849]"
            />
          </div>
          <button
            type="button"
            onClick={handleApplyCustom}
            disabled={!customStart || !customEnd || isLoading}
            className="px-3 py-1.5 bg-[#521849] hover:bg-[#3E1037] text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
          >
            Aplicar filtro
          </button>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Error de consulta</div>
            <div>{error}</div>
          </div>
        </div>
      )}

      {/* Collecting / No Data Notice */}
      {data?.status === 'collecting' && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
          <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Sistema en fase de recopilación de datos</div>
            <div className="text-amber-800 mt-0.5">
              Se han registrado los primeros eventos de navegación. Los porcentajes de conversión ganarán precisión estadística conforme aumente el volumen de sesiones.
            </div>
          </div>
        </div>
      )}

      {data?.status === 'nodata' && (
        <div className="p-6 bg-white border border-[#EDE4D7] rounded-2xl text-center space-y-2">
          <Compass className="w-8 h-8 text-stone-400 mx-auto" />
          <h4 className="text-sm font-bold text-[#26201D]">Sin eventos registrados en el periodo seleccionado</h4>
          <p className="text-xs text-[#574B45] max-w-md mx-auto">
            No se han producido visitas a páginas públicas ni inicios de reserva durante este intervalo. Navega por las páginas del portal para generar los primeros registros reales.
          </p>
        </div>
      )}

      {/* 1. EMBUDO PRINCIPAL DE 4 PASOS */}
      <div className="bg-white border border-[#EDE4D7] rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold font-serif text-[#26201D] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#521849]" />
            <span>Embudo de Conversión de 4 Pasos</span>
          </h4>
          <span className="text-[11px] text-[#574B45]">
            Fuente: {data?.source || 'Eventos locales'}
          </span>
        </div>

        {/* 4 Funnel Columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {/* Paso 1 */}
          <div className="p-4 bg-[#FAF8F5] border border-[#EDE4D7] rounded-xl flex flex-col justify-between relative">
            <div>
              <div className="flex items-center justify-between text-xs text-[#574B45] font-semibold mb-1">
                <span>Paso 1</span>
                <Compass className="w-3.5 h-3.5 text-[#521849]" />
              </div>
              <div className="text-xs font-bold text-[#26201D]">Visitas a Catas</div>
              <div className="text-[11px] text-[#574B45]">Página pública <code className="font-mono text-[10px]">/catas</code></div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#EDE4D7]/60">
              <div className="text-2xl font-bold font-serif text-[#26201D]">
                {funnel?.catasViews.toLocaleString() ?? '0'}
              </div>
              <div className="text-[10px] text-stone-400 mt-0.5">Exploración de cartelera</div>
            </div>
          </div>

          {/* Paso 2 */}
          <div className="p-4 bg-[#FAF8F5] border border-[#EDE4D7] rounded-xl flex flex-col justify-between relative">
            <div>
              <div className="flex items-center justify-between text-xs text-[#574B45] font-semibold mb-1">
                <span>Paso 2</span>
                <Eye className="w-3.5 h-3.5 text-[#521849]" />
              </div>
              <div className="text-xs font-bold text-[#26201D]">Fichas de Actividad</div>
              <div className="text-[11px] text-[#574B45]">Detalle <code className="font-mono text-[10px]">/actividad/:id</code></div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#EDE4D7]/60">
              <div className="text-2xl font-bold font-serif text-[#26201D]">
                {funnel?.activityViews.toLocaleString() ?? '0'}
              </div>
              <div className="text-[10px] text-stone-500 mt-0.5">
                {rates?.activityToCatasPercent !== null && rates?.activityToCatasPercent !== undefined ? (
                  <span className="text-emerald-700 font-semibold">{rates.activityToCatasPercent.toFixed(1)}% de paso 1</span>
                ) : (
                  <span>— de paso 1</span>
                )}
              </div>
            </div>
          </div>

          {/* Paso 3 */}
          <div className="p-4 bg-[#FAF8F5] border border-[#EDE4D7] rounded-xl flex flex-col justify-between relative">
            <div>
              <div className="flex items-center justify-between text-xs text-[#574B45] font-semibold mb-1">
                <span>Paso 3</span>
                <MousePointerClick className="w-3.5 h-3.5 text-[#521849]" />
              </div>
              <div className="text-xs font-bold text-[#26201D]">Inicios de Reserva</div>
              <div className="text-[11px] text-[#574B45]">Apertura de formulario modal</div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#EDE4D7]/60">
              <div className="text-2xl font-bold font-serif text-[#26201D]">
                {funnel?.registrationStarts.toLocaleString() ?? '0'}
              </div>
              <div className="text-[10px] text-stone-500 mt-0.5">
                {rates?.startsToActivityPercent !== null && rates?.startsToActivityPercent !== undefined ? (
                  <span className="text-emerald-700 font-semibold">{rates.startsToActivityPercent.toFixed(1)}% de paso 2</span>
                ) : (
                  <span>— de paso 2</span>
                )}
              </div>
            </div>
          </div>

          {/* Paso 4 */}
          <div className="p-4 bg-[#521849] text-white rounded-xl flex flex-col justify-between relative shadow-xs">
            <div>
              <div className="flex items-center justify-between text-xs text-rose-200 font-semibold mb-1">
                <span>Paso 4 (Conversión)</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-rose-200" />
              </div>
              <div className="text-xs font-bold text-white">Reservas Completadas</div>
              <div className="text-[11px] text-rose-200">Confirmadas en servidor</div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/20">
              <div className="text-2xl font-bold font-serif text-white">
                {funnel?.reservationsCompleted.toLocaleString() ?? '0'}
              </div>
              <div className="text-[10px] text-rose-100 mt-0.5">
                {rates?.completedToStartsPercent !== null && rates?.completedToStartsPercent !== undefined ? (
                  <span className="font-semibold text-emerald-300">{rates.completedToStartsPercent.toFixed(1)}% de paso 3</span>
                ) : (
                  <span>— de paso 3</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Conversion Rates Summary Bar */}
        <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#EDE4D7] flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-[#574B45]">
            <Sparkles className="w-4 h-4 text-[#521849]" />
            <span className="font-semibold text-[#26201D]">Eficacia de conversión paso a paso:</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div>
              <span className="text-stone-500">Catas → Ficha: </span>
              <strong className="text-[#26201D] font-mono">
                {rates?.activityToCatasPercent !== null && rates?.activityToCatasPercent !== undefined ? `${rates.activityToCatasPercent.toFixed(1)}%` : '—'}
              </strong>
            </div>
            <div className="text-stone-300">|</div>
            <div>
              <span className="text-stone-500">Ficha → Inicio: </span>
              <strong className="text-[#26201D] font-mono">
                {rates?.startsToActivityPercent !== null && rates?.startsToActivityPercent !== undefined ? `${rates.startsToActivityPercent.toFixed(1)}%` : '—'}
              </strong>
            </div>
            <div className="text-stone-300">|</div>
            <div>
              <span className="text-stone-500">Inicio → Reserva: </span>
              <strong className="text-[#26201D] font-mono">
                {rates?.completedToStartsPercent !== null && rates?.completedToStartsPercent !== undefined ? `${rates.completedToStartsPercent.toFixed(1)}%` : '—'}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* 2. RANKING DE PÁGINAS MÁS VISITADAS & INTERÉS POR ACTIVIDAD */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        <div className="bg-white border border-[#EDE4D7] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold font-serif text-[#26201D] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#521849]" />
              <span>Páginas Más Visitadas</span>
            </h4>
            <span className="text-[11px] text-[#574B45]">Rutas públicas</span>
          </div>

          {(!data?.topPages || data.topPages.length === 0) ? (
            <div className="text-xs text-stone-500 py-6 text-center">
              Sin datos de navegación registrados para este periodo.
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {data.topPages.map((page, idx) => (
                <div key={page.path} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-md bg-[#FAF8F5] border border-[#EDE4D7] text-[10px] font-mono font-bold flex items-center justify-center text-[#521849] shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="font-semibold text-[#26201D] truncate">{page.label}</div>
                      <div className="text-[10px] font-mono text-stone-500 truncate">{page.path}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold font-mono text-[#26201D]">{page.views.toLocaleString()}</span>
                    <span className="text-[10px] text-stone-500 ml-1">visitas</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Activity Conversion */}
        <div className="bg-white border border-[#EDE4D7] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold font-serif text-[#26201D] flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#521849]" />
              <span>Interés por Actividad y Conversión</span>
            </h4>
            <span className="text-[11px] text-[#574B45]">Fichas individuales</span>
          </div>

          {(!data?.activityInterest || data.activityInterest.length === 0) ? (
            <div className="text-xs text-stone-500 py-6 text-center">
              Sin visitas registradas a fichas de actividad en este periodo.
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {data.activityInterest.map((act) => (
                <div key={act.activityId} className="py-2.5 space-y-1 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[#26201D] truncate">{act.title}</span>
                    <span className="font-mono text-[11px] font-bold text-[#521849] shrink-0">
                      {act.conversionRate !== null ? `${act.conversionRate.toFixed(1)}% conv.` : '— conv.'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#574B45]">
                    <span>{act.views} visitas</span>
                    <span>{act.starts} inicios</span>
                    <span className="font-semibold text-emerald-700">{act.completed} reservas</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. OPORTUNIDADES DE CONVERSIÓN */}
      {data?.conversionOpportunities && data.conversionOpportunities.length > 0 && (
        <div className="bg-[#FAF8F5] border border-amber-200 rounded-2xl p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-700" />
            <h4 className="text-sm font-bold font-serif text-[#26201D]">
              Oportunidades de Mejora en Conversión
            </h4>
          </div>
          <p className="text-xs text-[#574B45]">
            Actividades con visitas significativas donde la reserva no llegó a completarse:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            {data.conversionOpportunities.map((opp) => (
              <div key={opp.activityId} className="p-3 bg-white rounded-xl border border-amber-200/70 text-xs space-y-1">
                <div className="font-bold text-[#26201D]">{opp.title}</div>
                <div className="text-[#574B45] text-[11px]">{opp.reason}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
