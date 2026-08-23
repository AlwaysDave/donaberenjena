import React from 'react';
import { Wine, Award, Users, Heart, BookOpen, ShieldCheck, Sparkles } from 'lucide-react';

export const ConocenosPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 space-y-16">
      {/* Header */}
      <div className="max-w-3xl space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#521849]">
          <Heart className="w-4 h-4" />
          <span>Nuestra Historia & Misión</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold font-serif text-[#26201D] tracking-tight">
          Conócenos: El alma de Doña Berenjena
        </h1>
        <p className="text-base sm:text-lg text-[#574B45] font-light leading-relaxed">
          Nacimos como una tertulia entre amigos devotos del buen vino, el recetario tradicional y los viajes de terruño, y hoy somos una comunidad viva de más de 200 socios gastronómicos.
        </p>
      </div>

      {/* Origin Story Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        <div className="lg:col-span-6 space-y-4 text-sm text-[#3D3430] leading-relaxed">
          <h2 className="text-2xl font-bold font-serif text-[#26201D]">
            ¿Por qué «Doña Berenjena»?
          </h2>
          <p>
            La berenjena es el símbolo histórico del mestizaje culinario en la península ibérica: traída por los árabes en el siglo VIII, adoptada por las juderías sefardíes e inmortalizada en los recetarios castellanos, desde las berenjenas de Almagro hasta los escabeches y pisto manchego.
          </p>
          <p>
            En honor a esa humildad noble —un producto de la huerta que, con paciencia y fuego lento, se convierte en manjar suntuoso— bautizamos nuestra asociación en el año 2014.
          </p>
          <div className="p-4 rounded-xl bg-[#F6EDF4] border border-[#521849]/20 text-xs text-[#521849] italic">
            «La gastronomía no es ostentación; es curiosidad, respeto al productor y generosidad alrededor de una mesa redonda.»
          </div>
        </div>

        <div className="lg:col-span-6 aspect-4/3 rounded-2xl overflow-hidden shadow-lg border border-[#EDE4D7]">
          <img
            src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80"
            alt="Mesa compartida en Doña Berenjena"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Core Principles */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold font-serif text-[#26201D] text-center">
          Nuestros Cuatro Pilares Fundacionales
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-[#EDE4D7] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#521849]/10 text-[#521849] flex items-center justify-center">
              <Wine className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#26201D]">Rigor y Divulgación</h3>
            <p className="text-xs text-[#574B45] leading-relaxed">
              Catas guiadas con fichas técnicas reglamentarias y sumilleres con titulación oficial.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#EDE4D7] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#C96043]/10 text-[#C96043] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#26201D]">Pequeño Productor</h3>
            <p className="text-xs text-[#574B45] leading-relaxed">
              Apoyo directo a bodegas familiares, queserías de pasto y almazaras de recolección temprana.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#EDE4D7] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#4D6233]/10 text-[#4D6233] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#26201D]">Comunidad y Tertulia</h3>
            <p className="text-xs text-[#574B45] leading-relaxed">
              Ambiente cercano y amigable para adultos de 30 a 50 años que quieren disfrutar sin prisas.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#EDE4D7] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#521849]/10 text-[#521849] flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#26201D]">Memoria Gastronómica</h3>
            <p className="text-xs text-[#574B45] leading-relaxed">
              Documentación meticulosa de cada menú, cata y viaje para el archivo histórico de la asociación.
            </p>
          </div>
        </div>
      </div>

      {/* Board & Team */}
      <div className="rounded-3xl bg-[#FCFAF7] border border-[#EDE4D7] p-8 md:p-12 space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs uppercase tracking-widest font-semibold text-[#521849]">
            Junta Directiva
          </span>
          <h2 className="text-2xl font-bold font-serif text-[#26201D]">
            Las personas detrás del proyecto
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-white border border-[#EDE4D7] text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-[#521849] text-white flex items-center justify-center mx-auto text-lg font-serif font-bold">
              EG
            </div>
            <h3 className="font-bold text-sm text-[#26201D]">Eduardo Gómez</h3>
            <p className="text-xs text-[#C96043] font-medium">Presidente y Sumiller</p>
            <p className="text-xs text-[#574B45]">
              Formado en la Escuela Española de Cata y apasionado de los vinos de guarda y variedades minoritarias.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#EDE4D7] text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-[#C96043] text-white flex items-center justify-center mx-auto text-lg font-serif font-bold">
              MR
            </div>
            <h3 className="font-bold text-sm text-[#26201D]">Marta Ramos</h3>
            <p className="text-xs text-[#C96043] font-medium">Coordinadora de Cursos y Fogones</p>
            <p className="text-xs text-[#574B45]">
              Cocinera profesional encargada de la selección de chefs invitados y desarrollo de recetarios.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#EDE4D7] text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-[#4D6233] text-white flex items-center justify-center mx-auto text-lg font-serif font-bold">
              AL
            </div>
            <h3 className="font-bold text-sm text-[#26201D]">Álvaro Lorente</h3>
            <p className="text-xs text-[#C96043] font-medium">Responsable de Viajes y Logística</p>
            <p className="text-xs text-[#574B45]">
              Especialista en rutas enológicas por la Península y contacto directo con bodegas familiares.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
