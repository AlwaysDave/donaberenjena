import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { 
  Bell, 
  CheckCircle, 
  ArrowLeft, 
  AlertTriangle, 
  AlertOctagon, 
  Info, 
  ArrowRight, 
  RefreshCw, 
  ShieldCheck, 
  Filter,
  Layers,
  Users,
  Mail,
  UserCheck,
  Clock,
  Sparkles,
  Search
} from 'lucide-react';
import { computeAdminAlerts, AdminAlert, AlertSeverity } from '../../services/adminAlertsService';

interface AdminNotificationsCenterProps {
  onClose: () => void;
  onNavigateTab?: (
    tab: 'gestion' | 'participantes' | 'historico' | 'socios' | 'celebradas' | 'cuentas' | 'contacto',
    options?: {
      activityId?: string;
      searchQuery?: string;
      participantId?: string;
    }
  ) => void;
}

export const AdminNotificationsCenter: React.FC<AdminNotificationsCenterProps> = ({ 
  onClose,
  onNavigateTab 
}) => {
  const { activities, participants, members, contactMessages, useMockData } = useData();

  const [severityFilter, setSeverityFilter] = useState<'all' | AlertSeverity>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 1. Compute dynamic real-time alerts based on actual data (Punto 8)
  const activeAlerts = useMemo(() => {
    return computeAdminAlerts({
      activities,
      participants,
      members,
      contactMessages,
      isDemoMode: useMockData
    });
  }, [activities, participants, members, contactMessages, useMockData]);

  // Statistics
  const totalAlerts = activeAlerts.length;
  const importantCount = activeAlerts.filter(a => a.severity === 'important').length;
  const attentionCount = activeAlerts.filter(a => a.severity === 'attention').length;
  const infoCount = activeAlerts.filter(a => a.severity === 'info').length;

  // Filtered alerts
  const filteredAlerts = useMemo(() => {
    return activeAlerts.filter(alert => {
      if (severityFilter !== 'all' && alert.severity !== severityFilter) {
        return false;
      }
      if (roleFilter !== 'all' && alert.responsibleRole !== roleFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = alert.title.toLowerCase().includes(q);
        const matchWhat = alert.whatHappened.toLowerCase().includes(q);
        const matchWhy = alert.whyItMatters.toLowerCase().includes(q);
        const matchKey = alert.dedupeKey.toLowerCase().includes(q);
        return matchTitle || matchWhat || matchWhy || matchKey;
      }
      return true;
    });
  }, [activeAlerts, severityFilter, roleFilter, searchQuery]);

  // Unique roles for filtering
  const availableRoles = useMemo(() => {
    const set = new Set(activeAlerts.map(a => a.responsibleRole));
    return Array.from(set);
  }, [activeAlerts]);

  const handleActionClick = (alert: AdminAlert) => {
    if (onNavigateTab) {
      onNavigateTab(alert.actionTarget.tab, {
        activityId: alert.actionTarget.activityId,
        searchQuery: alert.actionTarget.searchQuery,
        participantId: alert.actionTarget.participantId
      });
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EDE4D7] pb-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-xl bg-white border border-[#EDE4D7] text-[#574B45] hover:text-[#26201D] hover:bg-[#F6F1EA] transition-colors cursor-pointer"
            title="Volver a Próximas Actividades"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#26201D]">
                Centro de Avisos Interno
              </h2>
              {totalAlerts > 0 ? (
                <span className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 shadow-2xs ${
                  importantCount > 0 
                    ? 'bg-rose-100 text-rose-900 border border-rose-200' 
                    : 'bg-amber-100 text-amber-900 border border-amber-200'
                }`}>
                  <Bell className="w-3.5 h-3.5 animate-pulse" />
                  <span>{totalAlerts} activa{totalAlerts !== 1 ? 's' : ''}</span>
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>0 incidencias</span>
                </span>
              )}
            </div>
            <p className="text-xs text-[#574B45] mt-1">
              Detección proactiva en tiempo real sobre socios, aforos, mensajes pendientes y cierres de asistencia.
            </p>
          </div>
        </div>

        {/* Real-time Indicator */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FCFAF7] border border-[#EDE4D7] text-[11px] font-medium text-[#73635B]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
          <span>Sincronización automática de datos</span>
        </div>
      </div>

      {/* KPI Cards & Severity Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => setSeverityFilter('all')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            severityFilter === 'all'
              ? 'bg-[#521849] text-white border-[#3E1037] shadow-sm ring-2 ring-[#521849]/30'
              : 'bg-white border-[#EDE4D7] text-[#26201D] hover:bg-[#FCFAF7]'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${severityFilter === 'all' ? 'text-white/80' : 'text-[#73635B]'}`}>
              Total Avisos
            </span>
            <Bell className="w-4 h-4 opacity-70" />
          </div>
          <div className="text-2xl font-bold font-serif">{totalAlerts}</div>
          <div className={`text-[10px] mt-0.5 ${severityFilter === 'all' ? 'text-white/70' : 'text-[#8C7E77]'}`}>
            Todas las incidencias
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSeverityFilter('important')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            severityFilter === 'important'
              ? 'bg-rose-700 text-white border-rose-800 shadow-sm ring-2 ring-rose-600/30'
              : 'bg-rose-50/70 border-rose-200/80 text-rose-950 hover:bg-rose-100/70'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${severityFilter === 'important' ? 'text-white/80' : 'text-rose-800'}`}>
              Importante
            </span>
            <AlertOctagon className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold font-serif text-rose-900">{importantCount}</div>
          <div className={`text-[10px] mt-0.5 ${severityFilter === 'important' ? 'text-white/70' : 'text-rose-700'}`}>
            Cierres de asistencia pendientes
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSeverityFilter('attention')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            severityFilter === 'attention'
              ? 'bg-amber-600 text-white border-amber-700 shadow-sm ring-2 ring-amber-500/30'
              : 'bg-amber-50/70 border-amber-200/80 text-amber-950 hover:bg-amber-100/70'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${severityFilter === 'attention' ? 'text-white/80' : 'text-amber-800'}`}>
              Atención
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-serif text-amber-900">{attentionCount}</div>
          <div className={`text-[10px] mt-0.5 ${severityFilter === 'attention' ? 'text-white/70' : 'text-amber-700'}`}>
            Socios, aforo y listas de espera
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSeverityFilter('info')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            severityFilter === 'info'
              ? 'bg-blue-600 text-white border-blue-700 shadow-sm ring-2 ring-blue-500/30'
              : 'bg-blue-50/70 border-blue-200/80 text-blue-950 hover:bg-blue-100/70'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${severityFilter === 'info' ? 'text-white/80' : 'text-blue-800'}`}>
              Información
            </span>
            <Info className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-serif text-blue-900">{infoCount}</div>
          <div className={`text-[10px] mt-0.5 ${severityFilter === 'info' ? 'text-white/70' : 'text-blue-700'}`}>
            Mensajes de contacto
          </div>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-[#EDE4D7] shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#8C7E77] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por título, persona o clave..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs text-[#26201D] placeholder-[#8C7E77] focus:outline-hidden focus:border-[#521849]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Role Filter */}
          {availableRoles.length > 1 && (
            <div className="flex items-center gap-1.5 text-xs text-[#574B45]">
              <span className="font-semibold text-[11px]">Responsable:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-[#EDE4D7] bg-white text-xs font-medium text-[#26201D]"
              >
                <option value="all">Todos los roles ({activeAlerts.length})</option>
                {availableRoles.map(role => (
                  <option key={role} value={role}>
                    {role} ({activeAlerts.filter(a => a.responsibleRole === role).length})
                  </option>
                ))}
              </select>
            </div>
          )}

          {(severityFilter !== 'all' || roleFilter !== 'all' || searchQuery.trim()) && (
            <button
              type="button"
              onClick={() => {
                setSeverityFilter('all');
                setRoleFilter('all');
                setSearchQuery('');
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#521849] hover:bg-[#F6EDF4] transition-colors cursor-pointer"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Alert List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#EDE4D7] p-12 text-center shadow-xs">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold font-serif text-[#26201D]">
              {activeAlerts.length === 0 ? 'Sin incidencias activas' : 'No hay avisos con los filtros actuales'}
            </h3>
            <p className="text-xs text-[#574B45] max-w-md mx-auto mt-1">
              {activeAlerts.length === 0 
                ? 'Todos los datos de socios, reservas, aforos, mensajes y asistencias se encuentran al día y normalizados.'
                : 'Prueba a cambiar el nivel de severidad o limpiar los términos de búsqueda.'}
            </p>
          </div>
        ) : (
          filteredAlerts.map(alert => {
            const isImportant = alert.severity === 'important';
            const isAttention = alert.severity === 'attention';
            const isInfo = alert.severity === 'info';

            return (
              <div 
                key={alert.id}
                className={`p-5 sm:p-6 rounded-3xl border transition-all shadow-xs ${
                  isImportant
                    ? 'bg-rose-50/40 border-rose-200 hover:border-rose-300'
                    : isAttention
                    ? 'bg-amber-50/30 border-amber-200/80 hover:border-amber-300'
                    : 'bg-blue-50/30 border-blue-200/80 hover:border-blue-300'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Icon & Content */}
                  <div className="flex items-start gap-4">
                    {/* Severity Icon */}
                    <div className={`p-3 rounded-2xl shrink-0 mt-0.5 shadow-2xs ${
                      isImportant 
                        ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                        : isAttention
                        ? 'bg-amber-100 text-amber-700 border border-amber-200'
                        : 'bg-blue-100 text-blue-700 border border-blue-200'
                    }`}>
                      {isImportant && <AlertOctagon className="w-6 h-6" />}
                      {isAttention && <AlertTriangle className="w-6 h-6" />}
                      {isInfo && <Info className="w-6 h-6" />}
                    </div>

                    <div className="space-y-2">
                      {/* Meta Pills */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isImportant 
                            ? 'bg-rose-600 text-white' 
                            : isAttention
                            ? 'bg-amber-600 text-white'
                            : 'bg-blue-600 text-white'
                        }`}>
                          {alert.severityLabel}
                        </span>

                        <span className="px-2.5 py-0.5 rounded-full bg-white text-[#574B45] border border-[#EDE4D7] text-[10px] font-semibold">
                          Responsable: <strong>{alert.responsibleRole}</strong>
                        </span>

                        <span className="text-[11px] font-mono text-[#8C7E77] bg-[#FCFAF7] px-2 py-0.5 rounded border border-[#EDE4D7]/70">
                          {alert.dedupeKey}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="text-base sm:text-lg font-bold font-serif text-[#26201D]">
                        {alert.title}
                      </h4>

                      {/* Qué ocurre */}
                      <div className="text-xs text-[#26201D] leading-relaxed">
                        <strong className="text-[#521849]">Qué ocurre: </strong>
                        <span>{alert.whatHappened}</span>
                      </div>

                      {/* Por qué importa */}
                      <div className="text-xs text-[#574B45] leading-relaxed">
                        <strong className="text-[#73635B]">Por qué importa: </strong>
                        <span>{alert.whyItMatters}</span>
                      </div>

                      {/* Criterio de resolución */}
                      <div className="text-[11px] text-[#8C7E77] italic flex items-center gap-1.5 pt-1">
                        <RefreshCw className="w-3 h-3 shrink-0 text-[#8C7E77]" />
                        <span>{alert.resolutionCriteria}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Action Button */}
                  <div className="shrink-0 flex sm:self-center pt-2 lg:pt-0">
                    <button
                      type="button"
                      onClick={() => handleActionClick(alert)}
                      className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer ${
                        isImportant
                          ? 'bg-rose-700 hover:bg-rose-800 text-white'
                          : isAttention
                          ? 'bg-[#521849] hover:bg-[#3E1037] text-white'
                          : 'bg-blue-700 hover:bg-blue-800 text-white'
                      }`}
                    >
                      <span>{alert.actionLabel}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
