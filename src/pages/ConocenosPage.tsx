import React from 'react';
import { Logo } from '../components/common/Logo';
import { Wine, Users, Heart, BookOpen, Sparkles, Landmark, ChefHat, Compass, History, MapPin, Newspaper, ExternalLink } from 'lucide-react';

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
          Nacida en Bolaños de Calatrava en 2013 como asociación cultural y gastronómica, Doña Berenjena es un punto de encuentro para difundir la gastronomía tradicional, poner en valor los productos locales y compartir la pasión por el buen comer y el buen vino.
        </p>
      </div>

      {/* Origin Story Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        <div className="lg:col-span-7 space-y-5 text-sm text-[#3D3430] leading-relaxed">
          <div className="flex items-center gap-2 text-xs font-bold text-[#521849] uppercase tracking-wider">
            <History className="w-4 h-4" />
            <span>Fundación en Bolaños de Calatrava (2013)</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#26201D]">
            De las aulas de cocina a una asociación con arraigo
          </h2>

          <p>
            El origen de <strong className="text-[#26201D] font-semibold">Doña Berenjena</strong> surgió en el año <strong>2013</strong> de la iniciativa de un grupo de personas inquietas y entusiastas que fueron coincidiendo en los <strong>cursos de cocina de la Universidad Popular de Bolaños de Calatrava</strong>. Compartiendo recetas, fogones e inquietudes culinarias, decidieron unirse formalmente para constituir una asociación cultural y gastronómica dedicada a promocionar la riqueza gastronómica y los productos autóctonos de nuestra tierra.
          </p>

          <p>
            La asociación tuvo su presentación oficial en octubre de 2013, contando desde el primer momento con el respaldo institucional del Ayuntamiento de Bolaños, representado en el acto por el entonces alcalde, <strong>Miguel Ángel Valverde</strong>, y el concejal de Cultura, <strong>Felipe López</strong>. En ese marco de colaboración, el Ayuntamiento cedió el uso de las instalaciones de cocina del <strong>Centro de Formación «El Salobral»</strong> (en el polígono industrial de Bolaños) como sede para el desarrollo de sus actividades, valorando su aportación como entidad de interés público local.
          </p>

          <p>
            Ya en sus primeros meses de andadura en 2013, la asociación puso en marcha sus primeras iniciativas: un <strong>curso continuado de cocina</strong> (impartido los jueves de 21:00 a 23:00 h) y una <strong>visita guiada con cata comentada a una bodega local de Bolaños</strong>. Desde aquel inicio, Doña Berenjena definió las tres grandes líneas de actividad que siguen vertebrando su labor hoy en día: catas de productos con identidad propia, cursos de cocina y viajes gastronómicos en origen.
          </p>

          <div className="p-4 sm:p-5 rounded-2xl bg-[#F6EDF4] border border-[#521849]/20 text-xs sm:text-sm text-[#521849] space-y-1.5">
            <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[11px]">
              <MapPin className="w-3.5 h-3.5" />
              <span>Identidad y Territorio: Campo de Calatrava</span>
            </div>
            <p className="italic text-xs leading-relaxed text-[#521849]/90">
              «Nuestra identidad se nutre del Campo de Calatrava: el vino y el aceite con Denominación de Origen, y la Berenjena de Almagro con Indicación Geográfica Protegida (IGP), emblemas de una cultura gastronómica viva que cuidamos y compartimos alrededor de la mesa.»
            </p>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-4">
          {/* Official Logo Card */}
          <div className="p-6 rounded-3xl bg-white border border-[#EDE4D7] shadow-xs flex flex-col items-center text-center space-y-3">
            <Logo className="w-full max-w-[320px] justify-center" />
            <div className="pt-3 border-t border-[#EDE4D7] w-full text-center">
              <span className="text-[11px] font-bold text-[#521849] uppercase tracking-wider">
                Logotipo e Identidad Institucional
              </span>
              <p className="text-[11px] text-[#73635B] mt-0.5">
                Cuchara, tenedor, cuchillo y copa: los cuatro pilares de nuestra asociación gastronómica.
              </p>
            </div>
          </div>

          <div className="aspect-16/10 rounded-3xl overflow-hidden shadow-xs border border-[#EDE4D7]">
            <img
              src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80"
              alt="Mesa compartida y cata en Doña Berenjena"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EDE4D7] text-xs text-[#73635B] flex items-center gap-3">
            <Landmark className="w-5 h-5 text-[#521849] shrink-0" />
            <span>
              Sede oficial de actividades: Cocina del Centro de Formación «El Salobral», Bolaños de Calatrava.
            </span>
          </div>
        </div>
      </div>

      {/* Core Principles */}
      <div className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs uppercase tracking-widest font-semibold text-[#521849]">
            Líneas de Actuación
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#26201D]">
            Nuestros Cuatro Pilares
          </h2>
          <p className="text-xs sm:text-sm text-[#73635B]">
            Los principios culinarios representados en las cuatro baldosas de nuestro logotipo oficial.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pillar 1: Copa / Vino (Green) */}
          <div className="p-6 rounded-3xl bg-white border border-[#EDE4D7] space-y-3 shadow-2xs hover:shadow-md transition-shadow">
            <div className="w-11 h-11 rounded-2xl bg-[#43A047]/10 text-[#43A047] flex items-center justify-center">
              <Wine className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#43A047]" />
              <h3 className="text-base font-bold text-[#26201D]">Catas y Divulgación</h3>
            </div>
            <p className="text-xs text-[#574B45] leading-relaxed">
              Catas comentadas de vinos con D.O., aceites de oliva virgen extra, quesos artesanos y productos locales con fichas técnicas y rigor enológico.
            </p>
          </div>

          {/* Pillar 2: Tenedor / Cocina (Orange) */}
          <div className="p-6 rounded-3xl bg-white border border-[#EDE4D7] space-y-3 shadow-2xs hover:shadow-md transition-shadow">
            <div className="w-11 h-11 rounded-2xl bg-[#E65100]/10 text-[#E65100] flex items-center justify-center">
              <ChefHat className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E65100]" />
              <h3 className="text-base font-bold text-[#26201D]">Cursos de Cocina</h3>
            </div>
            <p className="text-xs text-[#574B45] leading-relaxed">
              Talleres prácticos entre fogones, perfeccionamiento de técnicas, recuperación del recetario tradicional e intercambio culinario intergeneracional.
            </p>
          </div>

          {/* Pillar 3: Cuchillo / Gastronomía (Magenta) */}
          <div className="p-6 rounded-3xl bg-white border border-[#EDE4D7] space-y-3 shadow-2xs hover:shadow-md transition-shadow">
            <div className="w-11 h-11 rounded-2xl bg-[#E91E83]/10 text-[#E91E83] flex items-center justify-center">
              <Compass className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E91E83]" />
              <h3 className="text-base font-bold text-[#26201D]">Viajes y Rutas</h3>
            </div>
            <p className="text-xs text-[#574B45] leading-relaxed">
              Experiencias enológicas y gastronómicas en origen: visitas a bodegas singulares, almazaras históricas y zonas de producción protegida.
            </p>
          </div>

          {/* Pillar 4: Cuchara / Producto Local (Cyan / dña. b) */}
          <div className="p-6 rounded-3xl bg-white border border-[#EDE4D7] space-y-3 shadow-2xs hover:shadow-md transition-shadow">
            <div className="w-11 h-11 rounded-2xl bg-[#0077C8]/10 text-[#0077C8] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0077C8]" />
              <h3 className="text-base font-bold text-[#26201D]">Producto Local</h3>
            </div>
            <p className="text-xs text-[#574B45] leading-relaxed">
              Puesta en valor de la IGP Berenjena de Almagro y los sellos de calidad del Campo de Calatrava, en colaboración con productores y ferias locales.
            </p>
          </div>
        </div>
      </div>

      {/* Board & Team Section */}
      <div className="space-y-10">
        {/* Bloque 1: Junta Fundadora (2013) */}
        <div className="rounded-3xl bg-[#FAF8F5] border border-[#EDE4D7] p-6 sm:p-10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EDE4D7] pb-4">
            <div>
              <span className="text-[11px] uppercase tracking-widest font-bold text-[#521849]">
                Hito Histórico
              </span>
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#26201D] mt-0.5">
                Junta Directiva Fundadora (Octubre 2013)
              </h2>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#EBE3D7] text-[#574B45] text-xs font-semibold self-start sm:self-auto">
              Acta Fundacional • Bolaños de Calatrava
            </span>
          </div>

          <p className="text-xs sm:text-sm text-[#574B45] leading-relaxed">
            Agradecimiento a las socias y socios fundadores que impulsaron la constitución oficial de la asociación en octubre de 2013:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-white border border-[#EDE4D7] space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#C96043] tracking-wider block">
                Presidencia
              </span>
              <p className="font-bold text-sm text-[#26201D]">Jesús Fernández</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#EDE4D7] space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#C96043] tracking-wider block">
                Vicepresidencia
              </span>
              <p className="font-bold text-sm text-[#26201D]">Lucas Sobrino</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#EDE4D7] space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#C96043] tracking-wider block">
                Secretaría
              </span>
              <p className="font-bold text-sm text-[#26201D]">Julia López</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#EDE4D7] space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#C96043] tracking-wider block">
                Tesorería
              </span>
              <p className="font-bold text-sm text-[#26201D]">Luis Miguel Zurita</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#EDE4D7] space-y-2">
            <span className="text-[10px] uppercase font-bold text-[#73635B] tracking-wider block">
              Vocalías Fundadoras (2013)
            </span>
            <p className="text-xs text-[#3D3430] leading-relaxed">
              José Ángel Ruiz, José Ramón Baos, Fermín Chacón, Miguel Ángel Rodrigo, Antonio Aranda y Chelo Sobrino.
            </p>
          </div>

          {/* Referencia a la noticia de prensa fundacional */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#EDE4D7] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
            <div className="flex items-start sm:items-center gap-3 text-[#3D3430]">
              <div className="p-2 rounded-xl bg-[#F6EDF4] text-[#521849] shrink-0">
                <Newspaper className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-[#26201D] block sm:inline">
                  Hemeroteca (4 de octubre de 2013):
                </span>{' '}
                <span className="text-[#574B45]">
                  «Nace en Bolaños 'Doña Berenjena', una nueva asociación cultural y gastronómica»
                </span>{' '}
                <span className="text-[#8C7E77]">— MiCiudadReal.es</span>
              </div>
            </div>
            <a
              href="https://www.miciudadreal.es/2013/10/04/nace-en-bolanos-dona-berenjena-una-nueva-asociacion-cultural-y-gastronomica/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF8F5] hover:bg-[#F2ECE4] border border-[#EDE4D7] font-semibold text-[#521849] text-xs transition-colors shrink-0 self-start sm:self-center cursor-pointer"
            >
              <span>Ver noticia original</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Bloque 2: Junta Directiva Actual */}
        <div className="rounded-3xl bg-white border border-[#EDE4D7] p-6 sm:p-10 space-y-8 shadow-xs">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs uppercase tracking-widest font-semibold text-[#521849]">
              Órganos de Gobierno
            </span>
            <h2 className="text-2xl font-bold font-serif text-[#26201D]">
              Junta Directiva Actual
            </h2>
            <p className="text-xs sm:text-sm text-[#73635B]">
              Composición de los órganos de representación y coordinación de la asociación en el ejercicio presente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#FCFAF7] border border-[#EDE4D7] text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#521849]/15 text-[#521849] flex items-center justify-center mx-auto text-sm font-bold">
                <Users className="w-6 h-6 text-[#521849]" />
              </div>
              <div>
                <span className="text-[11px] uppercase font-bold text-[#C96043] tracking-wider block">
                  Presidencia
                </span>
                <h3 className="font-bold text-sm text-[#26201D] mt-0.5">
                  Pendiente de asignación
                </h3>
              </div>
              <p className="text-xs text-[#73635B] leading-relaxed">
                Representación institucional, coordinación general de la asamblea y dirección de relaciones institucionales.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FCFAF7] border border-[#EDE4D7] text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#C96043]/15 text-[#C96043] flex items-center justify-center mx-auto text-sm font-bold">
                <ChefHat className="w-6 h-6 text-[#C96043]" />
              </div>
              <div>
                <span className="text-[11px] uppercase font-bold text-[#C96043] tracking-wider block">
                  Secretaría & Programación
                </span>
                <h3 className="font-bold text-sm text-[#26201D] mt-0.5">
                  Pendiente de asignación
                </h3>
              </div>
              <p className="text-xs text-[#73635B] leading-relaxed">
                Coordinación del calendario de catas, cursos gastronómicos, actas de asambleas y gestión de socios.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FCFAF7] border border-[#EDE4D7] text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#4D6233]/15 text-[#4D6233] flex items-center justify-center mx-auto text-sm font-bold">
                <Compass className="w-6 h-6 text-[#4D6233]" />
              </div>
              <div>
                <span className="text-[11px] uppercase font-bold text-[#C96043] tracking-wider block">
                  Tesorería & Logística
                </span>
                <h3 className="font-bold text-sm text-[#26201D] mt-0.5">
                  Pendiente de asignación
                </h3>
              </div>
              <p className="text-xs text-[#73635B] leading-relaxed">
                Gestión económica y contable, logística de reservas en bodega, viajes enogastronómicos y compras de sala.
              </p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-[11px] text-[#8C7E77] italic">
              Los datos nominales de la junta directiva en ejercicio se actualizan periódicamente tras las asambleas generales ordinarias de la asociación.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

