import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { ActivityCard } from '../components/common/ActivityCard';
import { CataCategory } from '../types';
import { Wine, Sparkles, History, Calendar, Filter } from 'lucide-react';
import { sortActivitiesAscending } from '../utils/dateUtils';

export const CatasPage: React.FC = () => {
  const { catas } = useData();
  const [activeTab, setActiveTab] = useState<'proximas' | 'celebradas'>('proximas');
  const [categoryFilter, setCategoryFilter] = useState<string>('todas');

  const filteredCatas = useMemo(() => {
    const matching = catas.filter((cata) => {
      const matchesStatus = cata.status === (activeTab === 'proximas' ? 'proxima' : 'celebrada');
      const matchesCategory = categoryFilter === 'todas' || cata.category === categoryFilter;
      return matchesStatus && matchesCategory;
    });

    return sortActivitiesAscending(matching);
  }, [catas, activeTab, categoryFilter]);

  const proximasCount = catas.filter(c => c.status === 'proxima').length;
  const celebradasCount = catas.filter(c => c.status === 'celebrada').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 space-y-10">
      {/* Header Banner */}
      <div className="border-b border-[#EDE4D7] pb-8">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#521849] mb-2">
          <Wine className="w-4 h-4" />
          <span>Actividad Principal de la Asociación</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif text-[#26201D] tracking-tight">
          Catas Gastronómicas
        </h1>
        <p className="text-sm sm:text-base text-[#574B45] max-w-3xl mt-3 leading-relaxed">
          Sesiones sensoriales dirigidas por sumilleres, enólogos y maestros artesanos. Descubrimos la riqueza vinícola y los productos nobles de España a través de copas oficiales, maridajes estudiados y tertulias enológicas.
        </p>

        {/* Tab Selector: Próximas vs Celebradas */}
        <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="inline-flex p-1.5 rounded-xl bg-[#EDE4D7]/70 border border-[#DFD3C2] w-fit">
            <button
              id="tab-catas-proximas"
              type="button"
              onClick={() => setActiveTab('proximas')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'proximas'
                  ? 'bg-white text-[#521849] shadow-xs'
                  : 'text-[#574B45] hover:text-[#26201D]'
              }`}
            >
              <Calendar className="w-4 h-4 text-[#521849]" />
              <span>Próximas catas ({proximasCount})</span>
            </button>
            <button
              id="tab-catas-celebradas"
              type="button"
              onClick={() => setActiveTab('celebradas')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'celebradas'
                  ? 'bg-white text-[#521849] shadow-xs'
                  : 'text-[#574B45] hover:text-[#26201D]'
              }`}
            >
              <History className="w-4 h-4 text-[#521849]" />
              <span>Catas ya celebradas ({celebradasCount})</span>
            </button>
          </div>

          {/* Sub-category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#574B45]" />
            <select
              id="select-catas-categoria"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[#EDE4D7] bg-white text-xs font-medium text-[#26201D] focus:outline-none focus:border-[#521849]"
            >
              <option value="todas">Todas las tipologías</option>
              <option value="vino">Vinos y Espumosos</option>
              <option value="vermut">Vermuts y Aperitivos</option>
              <option value="aceite">Aceites de Oliva Virgen Extra</option>
              <option value="quesos">Quesos y Afinados</option>
              <option value="cerveza">Cervezas Artesanales</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Catas */}
      {filteredCatas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredCatas.map((cata) => (
            <ActivityCard key={cata.id} activity={cata} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#EDE4D7] p-8">
          <Wine className="w-12 h-12 text-[#DFD3C2] mx-auto mb-3" />
          <h3 className="text-lg font-bold font-serif text-[#26201D]">
            No hay catas en esta sección actualmente
          </h3>
          <p className="text-xs sm:text-sm text-[#574B45] mt-1 max-w-md mx-auto">
            {activeTab === 'proximas'
              ? 'Próximamente publicaremos nuevas fechas y bodegas invitadas para el próximo trimestre.'
              : 'No hay registros históricos para el filtro seleccionado.'}
          </p>
        </div>
      )}

      {/* Wine Tasting Club Info Footer Box */}
      <div className="rounded-2xl bg-[#FCFAF7] border border-[#EDE4D7] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left">
          <span className="text-xs font-bold uppercase tracking-wider text-[#521849]">
            ¿Eres productor o bodega?
          </span>
          <h4 className="text-lg font-bold font-serif text-[#26201D]">
            Presenta tus vinos y productos ante nuestra asociación
          </h4>
          <p className="text-xs text-[#574B45] max-w-xl">
            Acogemos presentaciones de añadas, proyectos singulares y catas verticales en nuestro salón oficial de catas.
          </p>
        </div>
        <Link
          to="/contacto?asunto=propuesta_cata"
          className="px-5 py-2.5 rounded-xl bg-[#521849] hover:bg-[#3E1037] text-white text-xs font-semibold tracking-wide transition-colors shrink-0"
        >
          Proponer una Cata
        </Link>
      </div>
    </div>
  );
};
