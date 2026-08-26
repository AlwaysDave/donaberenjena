import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { 
  Calendar, 
  Users, 
  Search, 
  ExternalLink, 
  Wine, 
  ChefHat, 
  Compass, 
  CheckCircle2, 
  UserX, 
  UserCheck, 
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { Activity } from '../../types';

interface PastActivitiesManagerProps {
  onViewParticipants: (activityId: string) => void;
}

export const PastActivitiesManager: React.FC<PastActivitiesManagerProps> = ({ onViewParticipants }) => {
  const { activities, participants } = useData();
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  const pastActivities = useMemo(() => {
    return activities
      .filter(a => a.status === 'celebrada')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [activities]);

  const availableYears = useMemo(() => {
    const years = new Set(pastActivities.map(a => new Date(a.date).getFullYear().toString()));
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [pastActivities]);

  const filteredActivities = useMemo(() => {
    const q = (searchTerm || '').toLowerCase().trim();
    return pastActivities.filter(a => {
      const yearMatch = selectedYear === 'all' || new Date(a.date).getFullYear().toString() === selectedYear;
      const searchMatch = !q || (a.title || '').toLowerCase().includes(q);
      const typeMatch = selectedType === 'all' || a.type === selectedType;
      return yearMatch && searchMatch && typeMatch;
    });
  }, [pastActivities, selectedYear, searchTerm, selectedType]);

  // Analytics for filtered activities (Strictly Non-Economic)
  const analytics = useMemo(() => {
    let totalAttendanceCount = 0;
    let totalNoShowsCount = 0;
    let totalSociosCount = 0;
    let totalNoSociosCount = 0;
    const globalUniqueAttendeesSet = new Set<string>();

    const activitiesData = filteredActivities.map(act => {
      const actParticipants = participants.filter(p => p.activityId === act.id);
      
      // Categorías de asistentes
      const attendedList = actParticipants.filter(p => p.status === 'asistio');
      const noShowList = actParticipants.filter(p => p.status === 'no_asistio');
      const cancelledList = actParticipants.filter(p => p.status === 'cancelada');
      const confirmedList = actParticipants.filter(p => p.status === 'confirmada');

      // Asistentes reales totales
      const totalAttended = attendedList.length > 0 ? attendedList.length : confirmedList.length; // fallback si no se marcó el check-in individual
      
      // Asistentes únicos dentro de la actividad (por email o nombre)
      const actUniqueAttendees = new Set(
        (attendedList.length > 0 ? attendedList : confirmedList)
          .map(p => p.email?.toLowerCase().trim() || p.fullName?.toLowerCase().trim())
          .filter(Boolean)
      );

      // Socios vs No Socios
      const sociosAttended = (attendedList.length > 0 ? attendedList : confirmedList).filter(p => p.isMember).length;
      const noSociosAttended = (attendedList.length > 0 ? attendedList : confirmedList).filter(p => !p.isMember).length;

      // Actualizar contadores globales
      totalAttendanceCount += totalAttended;
      totalNoShowsCount += noShowList.length;
      totalSociosCount += sociosAttended;
      totalNoSociosCount += noSociosAttended;
      actUniqueAttendees.forEach(key => globalUniqueAttendeesSet.add(key as string));

      const actTotalSpots = act.totalSpots || 0;
      const occupancyRate = actTotalSpots > 0 ? Math.min(100, Math.round((totalAttended / actTotalSpots) * 100)) : 0;

      return {
        ...act,
        totalAttended,
        uniqueAttendedCount: actUniqueAttendees.size,
        sociosAttended,
        noSociosAttended,
        noShowCount: noShowList.length,
        cancelledCount: cancelledList.length,
        occupancyRate
      };
    });

    return {
      totalActivities: activitiesData.length,
      totalAttendanceCount,
      uniqueAttendeesCount: globalUniqueAttendeesSet.size,
      totalNoShowsCount,
      totalSociosCount,
      totalNoSociosCount,
      activitiesData
    };
  }, [filteredActivities, participants]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header and Controls */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#EDE4D7] shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold font-serif text-[#26201D]">
              Historial de Actividades Celebradas
            </h2>
            <p className="text-xs text-[#574B45] mt-1">
              Registro estadístico de asistencia, aforo y segregación de participantes (Socios vs No Socios).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#574B45]" />
              <input
                type="text"
                placeholder="Buscar por título..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-[#FCFAF7] border border-[#EDE4D7] rounded-xl text-xs focus:outline-none focus:border-[#521849]"
              />
            </div>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 bg-[#FCFAF7] border border-[#EDE4D7] rounded-xl text-xs font-semibold text-[#26201D] focus:outline-none focus:border-[#521849]"
            >
              <option value="all">Todos los tipos</option>
              <option value="cata">Catas</option>
              <option value="curso">Cursos</option>
              <option value="viaje">Viajes</option>
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-2 bg-[#FCFAF7] border border-[#EDE4D7] rounded-xl text-xs font-semibold text-[#26201D] focus:outline-none focus:border-[#521849]"
            >
              <option value="all">Todos los años</option>
              {availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Operational Statistics Cards (Zero financial data) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-[#FCFAF7] border border-[#EDE4D7]">
            <div className="flex items-center justify-between text-[#574B45]">
              <span className="text-xs font-bold uppercase tracking-wider">Actividades</span>
              <Calendar className="w-4 h-4 text-[#521849]" />
            </div>
            <p className="text-2xl font-bold font-serif text-[#26201D] mt-2">{analytics.totalActivities}</p>
            <p className="text-[11px] text-[#574B45] mt-0.5">Eventos finalizados</p>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100">
            <div className="flex items-center justify-between text-[#521849]">
              <span className="text-xs font-bold uppercase tracking-wider">Asistencias Totales</span>
              <Users className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold font-serif text-[#521849] mt-2">{analytics.totalAttendanceCount}</p>
            <p className="text-[11px] text-[#521849]/80 mt-0.5">
              {analytics.totalSociosCount} socios • {analytics.totalNoSociosCount} no socios
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100">
            <div className="flex items-center justify-between text-emerald-800">
              <span className="text-xs font-bold uppercase tracking-wider">Asistentes Únicos</span>
              <Sparkles className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold font-serif text-emerald-900 mt-2">{analytics.uniqueAttendeesCount}</p>
            <p className="text-[11px] text-emerald-700 mt-0.5">Personas distintas</p>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-100">
            <div className="flex items-center justify-between text-rose-800">
              <span className="text-xs font-bold uppercase tracking-wider">No Asistencias</span>
              <UserX className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold font-serif text-rose-900 mt-2">{analytics.totalNoShowsCount}</p>
            <p className="text-[11px] text-rose-700 mt-0.5">No presentados</p>
          </div>
        </div>
      </div>

      {/* Activities Table */}
      <div className="bg-white rounded-3xl border border-[#EDE4D7] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FCFAF7] border-b border-[#EDE4D7] text-[10px] uppercase tracking-wider font-bold text-[#574B45]">
                <th className="p-4">Tipo</th>
                <th className="p-4">Actividad (Ficha Pública)</th>
                <th className="p-4">Fecha</th>
                <th className="p-4">Precios de Ficha</th>
                <th className="p-4 text-center">Asistencia Total</th>
                <th className="p-4 text-center">Socios / No Socios</th>
                <th className="p-4 text-center">No Asistencia</th>
                <th className="p-4 text-right">Hoja de Sala</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE4D7]">
              {analytics.activitiesData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-sm text-[#574B45]">
                    No se han encontrado actividades celebradas con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                analytics.activitiesData.map(act => (
                  <tr key={act.id} className="hover:bg-[#FCFAF7] transition-colors">
                    {/* Tipo */}
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold text-[11px] ${
                        act.type === 'cata' 
                          ? 'bg-[#521849]/10 text-[#521849]' 
                          : act.type === 'curso'
                          ? 'bg-[#C96043]/10 text-[#C96043]'
                          : 'bg-[#4D6233]/10 text-[#4D6233]'
                      }`}>
                        {act.type === 'cata' && <Wine className="w-3 h-3" />}
                        {act.type === 'curso' && <ChefHat className="w-3 h-3" />}
                        {act.type === 'viaje' && <Compass className="w-3 h-3" />}
                        <span className="capitalize">{act.type}</span>
                      </span>
                    </td>

                    {/* Actividad con hipervínculo discreto */}
                    <td className="p-4 max-w-xs">
                      <a
                        href={`/actividad/${act.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-center gap-1 font-serif text-sm font-bold text-[#26201D] hover:text-[#521849] transition-colors"
                        title="Abrir ficha pública de la actividad"
                      >
                        <span className="group-hover:underline">{act.title}</span>
                        <ArrowUpRight className="w-3 h-3 text-[#574B45] group-hover:text-[#521849] opacity-70 group-hover:opacity-100 shrink-0" />
                      </a>
                      <p className="text-[11px] text-[#574B45] truncate">{act.subtitle}</p>
                    </td>

                    {/* Fecha */}
                    <td className="p-4 text-[#26201D] font-medium whitespace-nowrap">
                      {new Date(act.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>

                    {/* Precios Socio / No Socio */}
                    <td className="p-4 whitespace-nowrap">
                      {act.priceMember !== act.priceNonMember ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60 leading-none">
                              Socio
                            </span>
                            <span className="font-bold text-[#26201D]">{act.priceMember}€</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-medium text-[#73635B] bg-[#F6F1EA] px-1.5 py-0.5 rounded border border-[#EDE4D7] leading-none">
                              General
                            </span>
                            <span className="font-medium text-[#574B45]">{act.priceNonMember}€</span>
                          </div>
                        </div>
                      ) : (
                        <span className="font-bold text-[#26201D]">{act.priceMember}€</span>
                      )}
                    </td>

                    {/* Asistentes Totales y Aforo */}
                    <td className="p-4 text-center whitespace-nowrap">
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-bold text-[#521849]">
                          {act.totalAttended} / {act.totalSpots}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-0.5 ${
                          act.occupancyRate >= 90 ? 'bg-emerald-100 text-emerald-800' :
                          act.occupancyRate >= 50 ? 'bg-amber-100 text-amber-800' :
                          'bg-stone-100 text-stone-700'
                        }`}>
                          {act.occupancyRate}% aforo
                        </span>
                      </div>
                    </td>

                    {/* Segregación Socios vs No Socios */}
                    <td className="p-4 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-2 text-xs">
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200/60" title="Socios asistentes">
                          {act.sociosAttended} socios
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-[#F6F1EA] text-[#574B45] font-semibold border border-[#EDE4D7]" title="No socios asistentes">
                          {act.noSociosAttended} no socios
                        </span>
                      </div>
                    </td>

                    {/* No Asistencia y Cancelaciones */}
                    <td className="p-4 text-center whitespace-nowrap">
                      {act.noShowCount > 0 || act.cancelledCount > 0 ? (
                        <div className="flex flex-col items-center gap-0.5">
                          {act.noShowCount > 0 && (
                            <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                              {act.noShowCount} no presentado{act.noShowCount > 1 ? 's' : ''}
                            </span>
                          )}
                          {act.cancelledCount > 0 && (
                            <span className="text-[10px] text-[#574B45]">
                              {act.cancelledCount} cancelada{act.cancelledCount > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-emerald-700 font-medium flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> 100% asistencia
                        </span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="p-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onViewParticipants(act.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FCFAF7] hover:bg-[#521849] hover:text-white text-[#521849] border border-[#EDE4D7] text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs"
                        title="Ver lista y detalle de asistentes de esta actividad"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Ver Hoja de Sala</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
