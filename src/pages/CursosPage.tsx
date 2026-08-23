import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { ActivityCard } from '../components/common/ActivityCard';
import { ChefHat, Calendar, History, Sparkles, UtensilsCrossed } from 'lucide-react';

export const CursosPage: React.FC = () => {
  const { cursos } = useData();
  const [activeTab, setActiveTab] = useState<'proximos' | 'celebrados'>('proximos');

  const filteredCursos = cursos.filter((curso) => {
    return curso.status === (activeTab === 'proximos' ? 'proxima' : 'celebrada');
  });

  const proximosCount = cursos.filter(c => c.status === 'proxima').length;
  const celebradosCount = cursos.filter(c => c.status === 'celebrada').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 space-y-10">
      {/* Header Banner */}
      <div className="border-b border-[#EDE4D7] pb-8">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#C96043] mb-2">
          <ChefHat className="w-4 h-4" />
          <span>Talleres Prácticos y Fogones</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif text-[#26201D] tracking-tight">
          Cursos de Cocina
        </h1>
        <p className="text-sm sm:text-base text-[#574B45] max-w-3xl mt-3 leading-relaxed">
          Talleres presenciales en grupos reducidos en nuestra cocina profesional equipada. Aprende técnicas de alta cocina adaptadas a casa, secretos de los grandes fondos y recetas de temporada con chefs invitados.
        </p>

        {/* Tab Selector: Próximos vs Celebrados */}
        <div className="mt-8 flex items-center justify-between">
          <div className="inline-flex p-1.5 rounded-xl bg-[#EDE4D7]/70 border border-[#DFD3C2]">
            <button
              id="tab-cursos-proximos"
              type="button"
              onClick={() => setActiveTab('proximos')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'proximos'
                  ? 'bg-white text-[#C96043] shadow-xs'
                  : 'text-[#574B45] hover:text-[#26201D]'
              }`}
            >
              <Calendar className="w-4 h-4 text-[#C96043]" />
              <span>Próximos cursos ({proximosCount})</span>
            </button>
            <button
              id="tab-cursos-celebrados"
              type="button"
              onClick={() => setActiveTab('celebrados')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'celebrados'
                  ? 'bg-white text-[#C96043] shadow-xs'
                  : 'text-[#574B45] hover:text-[#26201D]'
              }`}
            >
              <History className="w-4 h-4 text-[#C96043]" />
              <span>Cursos celebrados ({celebradosCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Cursos */}
      {filteredCursos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredCursos.map((curso) => (
            <ActivityCard key={curso.id} activity={curso} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#EDE4D7] p-8">
          <ChefHat className="w-12 h-12 text-[#DFD3C2] mx-auto mb-3" />
          <h3 className="text-lg font-bold font-serif text-[#26201D]">
            No hay cursos en esta sección actualmente
          </h3>
          <p className="text-xs sm:text-sm text-[#574B45] mt-1 max-w-md mx-auto">
            {activeTab === 'proximos'
              ? 'Estamos preparando el nuevo calendario docente con maestros arroceros y especialistas en repostería tradicional.'
              : 'No hay cursos históricos registrados.'}
          </p>
        </div>
      )}

      {/* Course Perks Banner */}
      <div className="rounded-3xl bg-[#F9ECE8] border border-[#C96043]/30 p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-[#C96043] text-white flex items-center justify-center shrink-0">
            <UtensilsCrossed className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#26201D]">Estaciones Individuales</h4>
            <p className="text-xs text-[#574B45] mt-0.5">Cada alumno cocina su plato con menaje profesional e ingredientes de mercado.</p>
          </div>
        </div>

        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-[#C96043] text-white flex items-center justify-center shrink-0">
            <ChefHat className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#26201D]">Comida y Maridaje</h4>
            <p className="text-xs text-[#574B45] mt-0.5">Degustamos todas las elaboraciones en mesa compartida con vinos seleccionados.</p>
          </div>
        </div>

        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-[#C96043] text-white flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#26201D]">Dossier y Recetario</h4>
            <p className="text-xs text-[#574B45] mt-0.5">Entrega de manual encuadernado y digital con gramajes y temperaturas exactas.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
