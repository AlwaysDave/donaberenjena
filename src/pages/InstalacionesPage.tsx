import React from 'react';
import { Building2, Wine, ChefHat, Sparkles, MapPin, Eye } from 'lucide-react';

export const InstalacionesPage: React.FC = () => {
  const facilities = [
    {
      title: 'Salón de Catas Principal «El Alambique»',
      description: 'Espacio climatizado diseñado acústica y lumínicamente para la apreciación sensorial. Equipado con 30 puestos individuales, copas oficiales Riedel y Schott Zwiesel, escupideras individuales y pantallas de proyección enológica.',
      image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1200&q=80',
      specs: ['Capacidad: 30 catadores', 'Iluminación neutra de 5000K', 'Cristalería técnica completa']
    },
    {
      title: 'Cocina Profesional Abierta y Fogones',
      description: 'Nuestra aula gastronómica cuenta con islas de trabajo de acero inoxidable, placas de inducción de alta potencia, hornos mixtos de vapor, abatidores de temperatura y sistema de extracción industrial silencioso.',
      image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=80',
      specs: ['14 puestos individuales de cocinado', 'Cuchillería y menaje profesional', 'Mesa de emplatado central']
    },
    {
      title: 'Cava Climatizada de Guarda y Archivo Enológico',
      description: 'Cámara subterránea con control estricto de humedad (70%) y temperatura (13°C) donde reposan las botellas históricas de la asociación, añadas donadas por productores y nuestras reservas para catas verticales.',
      image: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1200&q=80',
      specs: ['Capacidad: 2.500 botellas', 'Higrometría y temperatura monitorizada', 'Zona de decantación']
    },
    {
      title: 'Terraza y Patio de Aromáticas',
      description: 'Espacio al aire libre donde cultivamos hierbas aromáticas tradicionales (tomillo, romero, albahaca, menta) y celebramos los aperitivos al sol, catas de vermut y bienvenidas de cursos.',
      image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80',
      specs: ['Ambiente exterior protegido', 'Huerto de aromáticas vivas', 'Espacio para cóctel de bienvenida']
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 space-y-16">
      {/* Header */}
      <div className="max-w-3xl space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#521849]">
          <Building2 className="w-4 h-4" />
          <span>Sede Social & Espacios</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold font-serif text-[#26201D] tracking-tight">
          Nuestras Instalaciones
        </h1>
        <p className="text-base sm:text-lg text-[#574B45] font-light leading-relaxed">
          Ubicada en un edificio protegido en pleno corazón de Madrid, nuestra sede aúna el encanto arquitectónico tradicional con el equipamiento técnico más riguroso para la hostelería y la cata.
        </p>
      </div>

      {/* Facilities List */}
      <div className="space-y-12">
        {facilities.map((fac, i) => (
          <div
            key={i}
            className={`grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 sm:p-8 rounded-3xl bg-white border border-[#EDE4D7] shadow-xs ${
              i % 2 === 1 ? 'lg:flex-row-reverse' : ''
            }`}
          >
            <div className="lg:col-span-6 space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-[#C96043]">
                Espacio 0{i + 1}
              </span>
              <h2 className="text-2xl font-bold font-serif text-[#26201D]">
                {fac.title}
              </h2>
              <p className="text-sm text-[#574B45] leading-relaxed">
                {fac.description}
              </p>
              <div className="pt-2 flex flex-wrap gap-2">
                {fac.specs.map((spec, si) => (
                  <span
                    key={si}
                    className="px-3 py-1 rounded-lg bg-[#F6F1EA] text-[#26201D] text-xs font-medium border border-[#EDE4D7]"
                  >
                    ✓ {spec}
                  </span>
                ))}
              </div>
            </div>

            <div className="lg:col-span-6 aspect-16/10 rounded-2xl overflow-hidden shadow-md bg-[#F6F1EA]">
              <img
                src={fac.image}
                alt={fac.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Location Box */}
      <div className="rounded-3xl bg-[#F6EDF4] border border-[#521849]/20 p-8 text-center max-w-2xl mx-auto space-y-3">
        <MapPin className="w-8 h-8 text-[#521849] mx-auto" />
        <h3 className="text-xl font-bold font-serif text-[#26201D]">
          Visita nuestra sede
        </h3>
        <p className="text-xs sm:text-sm text-[#574B45]">
          Calle Mayor 14, Planta 1, 28013 Madrid. Abrimos las puertas para actividades programadas y atención previa cita los jueves y viernes por la tarde.
        </p>
      </div>
    </div>
  );
};
