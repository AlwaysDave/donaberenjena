import React from 'react';
import { Building2, Wine, ChefHat, Sparkles, MapPin, Eye } from 'lucide-react';

export const InstalacionesPage: React.FC = () => {
  const facilities = [
    {
      title: 'Salón de Catas Principal',
      description: 'Espacio climatizado diseñado acústica y lumínicamente para la apreciación sensorial. Equipado con 14 puestos individuales, copas oficiales de cata, y una ambientación tradicional manchega.',
      image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1200&q=80',
      specs: ['Capacidad: 14 catadores', 'Climatización', 'Cristalería técnica completa']
    },
    {
      title: 'Cocina Profesional',
      description: 'Nuestra aula gastronómica cuenta con islas de trabajo de acero inoxidable, planca profesional de alta potencia, horno de convección, tres fogones de gas profesionales y sistema de extracción industrial silencioso.',
      image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=80',
      specs: ['Amplio Aforo de 10 personas', 'Cuchillería y menaje profesional', 'Mesa de emplatado central']
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
          Ubicada en el antiguo Centro de Formación en el Poligono "El Salobral", nuestra sede aúna el encanto arquitectónico manchego tradicional con el equipamiento técnico más riguroso para la hostelería y la cata.
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
          Visita nuestra sede bajo cita previa
        </h3>
        <p className="text-xs sm:text-sm text-[#574B45]">
          Polígono Industrial “El Salobral “- Centro de Formación – Bolaños de Calatrava. Abrimos las puertas para actividades programadas y atención previa cita los jueves y viernes por la tarde.
        </p>
      </div>
    </div>
  );
};
