import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Calendar, Users, DollarSign, TrendingUp, Search, ExternalLink } from 'lucide-react';
import { Activity } from '../../types';

interface PastActivitiesManagerProps {
  onViewParticipants: (activityId: string) => void;
}

export const PastActivitiesManager: React.FC<PastActivitiesManagerProps> = ({ onViewParticipants }) => {
  const { activities, participants } = useData();
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

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
    return pastActivities.filter(a => {
      const yearMatch = selectedYear === 'all' || new Date(a.date).getFullYear().toString() === selectedYear;
      const searchMatch = a.title.toLowerCase().includes(searchTerm.toLowerCase());
      return yearMatch && searchMatch;
    });
  }, [pastActivities, selectedYear, searchTerm]);

  // Analytics for filtered activities
  const analytics = useMemo(() => {
    let totalRevenue = 0;
    let totalAttendees = 0;
    
    const activitiesData = filteredActivities.map(act => {
      const actParticipants = participants.filter(p => p.activityId === act.id && p.status !== 'cancelada');
      const attendedParticipants = actParticipants.filter(p => p.status === 'asistio');
      
      const actRevenue = actParticipants.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
      const actTotalSpots = act.totalSpots || 0;
      const actBookedSpots = actParticipants.reduce((sum, p) => sum + p.spots, 0);
      
      const occupancyRate = actTotalSpots > 0 ? Math.round((actBookedSpots / actTotalSpots) * 100) : 0;
      const attendanceRate = actBookedSpots > 0 ? Math.round((attendedParticipants.reduce((sum, p) => sum + p.spots, 0) / actBookedSpots) * 100) : 0;

      totalRevenue += actRevenue;
      totalAttendees += attendedParticipants.reduce((sum, p) => sum + p.spots, 0);

      return {
        ...act,
        revenue: actRevenue,
        occupancyRate,
        attendanceRate,
        bookedSpots: actBookedSpots
      };
    });

    return {
      totalRevenue,
      totalAttendees,
      totalActivities: activitiesData.length,
      activitiesData
    };
  }, [filteredActivities, participants]);

  return (
    <div className="space-y-4">
      {/* Header and Filters */}
      <div className="bg-white p-5 rounded-2xl border border-[#EDE4D7] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-bold text-[#290824]">Resumen Anual de Actividades</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C7E76]" />
              <input
                type="text"
                placeholder="Buscar por título..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-[#FBF9F5] border border-[#EDE4D7] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#521849]"
              />
            </div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-4 py-2 bg-[#FBF9F5] border border-[#EDE4D7] rounded-xl text-xs font-semibold text-[#574B45] focus:outline-none focus:ring-2 focus:ring-[#521849]"
            >
              <option value="all">Todos los años</option>
              {availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-[#F6F1EA] rounded-xl border border-[#EDE4D7]">
            <div className="flex items-center gap-2 text-[#574B45] mb-2">
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Actividades</span>
            </div>
            <span className="text-2xl font-black text-[#290824]">{analytics.totalActivities}</span>
          </div>
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <div className="flex items-center gap-2 text-emerald-800 mb-2">
              <DollarSign className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Ingresos (Pagados)</span>
            </div>
            <span className="text-2xl font-black text-emerald-900">{analytics.totalRevenue} €</span>
          </div>
          <div className="p-4 bg-[#FBF9F5] rounded-xl border border-[#EDE4D7]">
            <div className="flex items-center gap-2 text-[#574B45] mb-2">
              <Users className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Asistentes Reales</span>
            </div>
            <span className="text-2xl font-black text-[#290824]">{analytics.totalAttendees}</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#EDE4D7] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FBF9F5] border-b border-[#EDE4D7] text-[10px] uppercase tracking-wider text-[#8C7E76]">
                <th className="p-4 font-bold">Actividad</th>
                <th className="p-4 font-bold">Fecha</th>
                <th className="p-4 font-bold text-center">Ocupación</th>
                <th className="p-4 font-bold text-center">Tasa Asistencia</th>
                <th className="p-4 font-bold text-right">Recaudación</th>
                <th className="p-4 font-bold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE4D7]">
              {analytics.activitiesData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-sm text-[#8C7E76]">
                    No hay actividades celebradas en este periodo.
                  </td>
                </tr>
              ) : (
                analytics.activitiesData.map(act => (
                  <tr key={act.id} className="hover:bg-[#FBF9F5] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                          {act.images?.[0] ? (
                            <img src={act.images[0]} alt={act.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Calendar className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#290824] leading-tight">{act.title}</p>
                          <p className="text-xs text-[#8C7E76] capitalize">{act.type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-xs font-medium text-[#574B45]">
                      {new Date(act.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col items-center">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          act.occupancyRate >= 90 ? 'bg-emerald-100 text-emerald-800' :
                          act.occupancyRate >= 50 ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {act.occupancyRate}%
                        </span>
                        <span className="text-[10px] text-[#8C7E76] mt-1">{act.bookedSpots} / {act.totalSpots}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-bold text-[#574B45]">
                          {act.attendanceRate}%
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-sm font-black text-emerald-700">{act.revenue} €</span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => onViewParticipants(act.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F6F1EA] hover:bg-[#521849] hover:text-white text-[#521849] text-xs font-bold rounded-lg transition-colors"
                        title="Ver o editar asistentes"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Asistentes</span>
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
