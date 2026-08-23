import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { ActivityCard } from '../components/common/ActivityCard';
import { Compass, Calendar, History, MapPin, Bus, Hotel } from 'lucide-react';

export const ViajesPage: React.FC = () => {
  const { viajes } = useData();
  const [activeTab, setActiveTab] = useState<'proximos' | 'celebrados'>('proximos');

  const filteredViajes = viajes.filter((viaje) => {
    return viaje.status === (activeTab === 'proximos' ? 'proxima' : 'celebrada');
  });

  const proximosCount = viajes.filter(v => v.status === 'proxima').length;
  const celebradosCount = viajes.filter(v => v.status === 'celebrada').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 space-y-10">
      {/* Header Banner */}
      <div className="border-b border-[#EDE4D7] pb-8">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#4D6233] mb-2">
          <Compass className="w-4 h-4" />
          <span>Rutas de Terruño y Patrimonio</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif text-[#26201D] tracking-tight">
          Viajes Enogastronómicos
        </h1>
        <p className="text-sm sm:text-base text-[#574B45] max-w-3xl mt-3 leading-relaxed">
          Experiencias inmersivas en origen: visitamos los viñedos más singulares, presenciamos faenas tradicionales (como el ronqueo del atún o la recogida de trufas) y nos alojamos en entornos de ensueño con la comunidad de Doña Berenjena.
        </p>

        {/* Tab Selector: Próximos vs Celebrados */}
        <div className="mt-8 flex items-center justify-between">
          <div className="inline-flex p-1.5 rounded-xl bg-[#EDE4D7]/70 border border-[#DFD3C2]">
            <button
              id="tab-viajes-proximos"
              type="button"
              onClick={() => setActiveTab('proximos')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'proximos'
                  ? 'bg-white text-[#4D6233] shadow-xs'
                  : 'text-[#574B45] hover:text-[#26201D]'
              }`}
            >
              <Calendar className="w-4 h-4 text-[#4D6233]" />
              <span>Próximos viajes ({proximosCount})</span>
            </button>
            <button
              id="tab-viajes-celebrados"
              type="button"
              onClick={() => setActiveTab('celebrados')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'celebrados'
                  ? 'bg-white text-[#4D6233] shadow-xs'
                  : 'text-[#574B45] hover:text-[#26201D]'
              }`}
            >
              <History className="w-4 h-4 text-[#4D6233]" />
              <span>Viajes celebrados ({celebradosCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Viajes */}
      {filteredViajes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredViajes.map((viaje) => (
            <ActivityCard key={viaje.id} activity={viaje} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#EDE4D7] p-8">
          <Compass className="w-12 h-12 text-[#DFD3C2] mx-auto mb-3" />
          <h3 className="text-lg font-bold font-serif text-[#26201D]">
            No hay viajes en esta sección actualmente
          </h3>
          <p className="text-xs sm:text-sm text-[#574B45] mt-1 max-w-md mx-auto">
            {activeTab === 'proximos'
              ? 'Estamos cerrando los itinerarios de primavera y otoño con bodegas singulares de Galicia y Priorat.'
              : 'No hay expediciones pasadas archivadas.'}
          </p>
        </div>
      )}

      {/* Travel Quality Highlights */}
      <div className="rounded-3xl bg-[#EFF4E9] border border-[#4D6233]/30 p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-[#4D6233] text-white flex items-center justify-center shrink-0">
            <Bus className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#26201D]">Transporte Exclusivo</h4>
            <p className="text-xs text-[#574B45] mt-0.5">Autobús privado de gran confort para que no tengas que preocuparte por conducir.</p>
          </div>
        </div>

        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-[#4D6233] text-white flex items-center justify-center shrink-0">
            <Hotel className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#26201D]">Alojamientos con Encanto</h4>
            <p className="text-xs text-[#574B45] mt-0.5">Hoteles boutique entre viñedos y casonas históricas seleccionadas con mimo.</p>
          </div>
        </div>

        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-[#4D6233] text-white flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#26201D]">Accesos Privados</h4>
            <p className="text-xs text-[#574B45] mt-0.5">Visitas a calados subterráneos y viñas centenarias no abiertas al turismo masivo.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
