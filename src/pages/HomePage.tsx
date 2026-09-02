import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { ActivityCard } from '../components/common/ActivityCard';
import { Wine, ChefHat, Compass, ArrowRight, Sparkles, Award, Users, BookOpen, Calendar, MapPin } from 'lucide-react';
import { sortActivitiesAscending } from '../utils/dateUtils';

export const HomePage: React.FC = () => {
  const { activities } = useData();
  const [filterType, setFilterType] = useState<'all' | 'cata' | 'curso' | 'viaje'>('all');

  const upcomingActivities = useMemo(() => {
    return activities.filter(a => a.status === 'proxima');
  }, [activities]);

  const featuredActivities = useMemo(() => {
    const matching = upcomingActivities.filter(a => {
      if (filterType === 'all') return true;
      return a.type === filterType;
    });
    return sortActivitiesAscending(matching);
  }, [upcomingActivities, filterType]);

  return (
    <div className="space-y-16 md:space-y-24 pb-16">
      {/* Hero Section */}
      <section className="relative bg-[#290824] text-white overflow-hidden">
        {/* Background ambient lighting and pattern */}
        <div className="absolute inset-0 opacity-25">
          <img
            src="https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1920&q=80"
            alt="Ambiente gastronómico Doña Berenjena"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#290824] via-[#290824]/90 to-[#290824]/60" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 flex flex-col items-start justify-center">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#521849]/70 border border-[#842A76]/50 text-xs font-semibold text-[#EDE4D7] mb-6 backdrop-blur-xs">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-xs bg-[#00B5E8]" title="Cuchara" />
              <span className="w-2 h-2 rounded-xs bg-[#FFA000]" title="Tenedor" />
              <span className="w-2 h-2 rounded-xs bg-[#E91E83]" title="Cuchillo" />
              <span className="w-2 h-2 rounded-xs bg-[#8BC34A]" title="Copa" />
            </div>
            <span>Asociación Cultural y Gastronómica • Bolaños de Calatrava</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold font-serif text-white tracking-tight leading-tight max-w-3xl">
            El placer de compartir el vino, los fogones y la tierra.
          </h1>

          <p className="mt-5 text-base sm:text-lg text-[#DFD3C2] max-w-2xl font-light leading-relaxed">
            Bienvenidos a <strong className="text-white font-medium">Doña Berenjena</strong>. Un punto de encuentro para apasionados del buen comer, donde descubrir cosechas singulares, aprender técnicas culinarias de la mano de chefs y recorrer las comarcas más ricas de nuestra geografía.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              id="hero-btn-catas"
              to="/catas"
              className="px-6 py-3.5 rounded-xl bg-[#C96043] hover:bg-[#B84E33] text-white text-sm font-semibold tracking-wide transition-all shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <Wine className="w-4 h-4" />
              <span>Ver Próximas Catas</span>
            </Link>
            <Link
              id="hero-btn-cursos"
              to="/cursos"
              className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-sm font-semibold tracking-wide transition-all backdrop-blur-xs flex items-center gap-2"
            >
              <ChefHat className="w-4 h-4" />
              <span>Cursos de Cocina</span>
            </Link>
            <Link
              id="hero-btn-viajes"
              to="/viajes"
              className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-sm font-semibold tracking-wide transition-all backdrop-blur-xs flex items-center gap-2"
            >
              <Compass className="w-4 h-4" />
              <span>Viajes Organizados</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 3 Pillars Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs uppercase tracking-widest font-semibold text-[#521849]">
            Nuestras tres líneas de actividad
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#26201D] mt-2">
            Pasión gastronómica en tres formatos
          </h2>
          <p className="text-sm text-[#574B45] mt-3 leading-relaxed">
            Diseñamos cada encuentro con rigor técnico, cercanía y una cuidada selección de materias primas y productores locales.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Pillar 1: Catas */}
          <div className="group rounded-2xl bg-white p-7 border border-[#EDE4D7] shadow-xs hover:shadow-md hover:border-[#DFD3C2] transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#521849]/10 text-[#521849] flex items-center justify-center mb-5 group-hover:bg-[#521849] group-hover:text-white transition-colors">
                <Wine className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold tracking-wider text-[#521849] uppercase">
                Actividad Principal
              </span>
              <h3 className="text-xl font-bold font-serif text-[#26201D] mt-1 mb-2">
                Catas Gastronómicas
              </h3>
              <p className="text-xs sm:text-sm text-[#574B45] leading-relaxed">
                Vinos de parcela, vermuts artesanales, aceites virgen extra tempranos, quesos artesanos y cervezas de autor guiadas por sumilleres y enólogos invitados.
              </p>
            </div>
            <Link
              to="/catas"
              className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-[#521849] group-hover:text-[#3E1037]"
            >
              <span>Explorar calendario de catas</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Pillar 2: Cursos de Cocina */}
          <div className="group rounded-2xl bg-white p-7 border border-[#EDE4D7] shadow-xs hover:shadow-md hover:border-[#DFD3C2] transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#C96043]/10 text-[#C96043] flex items-center justify-center mb-5 group-hover:bg-[#C96043] group-hover:text-white transition-colors">
                <ChefHat className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold tracking-wider text-[#C96043] uppercase">
                Formación Práctica
              </span>
              <h3 className="text-xl font-bold font-serif text-[#26201D] mt-1 mb-2">
                Cursos de Cocina
              </h3>
              <p className="text-xs sm:text-sm text-[#574B45] leading-relaxed">
                Talleres 100% prácticos en nuestros fogones: arroces de autor, guisos lentos de cuchara, el arte del corte del jamón y técnicas tradicionales.
              </p>
            </div>
            <Link
              to="/cursos"
              className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-[#C96043] group-hover:text-[#B84E33]"
            >
              <span>Ver temarios y talleres</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Pillar 3: Viajes */}
          <div className="group rounded-2xl bg-white p-7 border border-[#EDE4D7] shadow-xs hover:shadow-md hover:border-[#DFD3C2] transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#4D6233]/10 text-[#4D6233] flex items-center justify-center mb-5 group-hover:bg-[#4D6233] group-hover:text-white transition-colors">
                <Compass className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold tracking-wider text-[#4D6233] uppercase">
                Escapadas de Terruño
              </span>
              <h3 className="text-xl font-bold font-serif text-[#26201D] mt-1 mb-2">
                Viajes Enogastronómicos
              </h3>
              <p className="text-xs sm:text-sm text-[#574B45] leading-relaxed">
                Rutas organizadas en grupos reducidos por bodegas familiares inaccesibles al gran público, almadrabas, dehesas y templos del producto.
              </p>
            </div>
            <Link
              to="/viajes"
              className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-[#4D6233] group-hover:text-[#3B4B27]"
            >
              <span>Descubrir próximos destinos</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Upcoming Activities Section with dynamic filters */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 border-b border-[#EDE4D7] pb-6">
          <div>
            <span className="text-xs uppercase tracking-widest font-semibold text-[#521849]">
              Agenda Oficial
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#26201D] mt-1">
              Próximas actividades programadas
            </h2>
          </div>

          {/* Activity Category Filters */}
          <div className="flex flex-wrap gap-2">
            <button
              id="filter-home-all"
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterType === 'all'
                  ? 'bg-[#521849] text-white shadow-xs'
                  : 'bg-white text-[#574B45] border border-[#EDE4D7] hover:bg-[#F6F1EA]'
              }`}
            >
              Todas ({upcomingActivities.length})
            </button>
            <button
              id="filter-home-catas"
              type="button"
              onClick={() => setFilterType('cata')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterType === 'cata'
                  ? 'bg-[#521849] text-white shadow-xs'
                  : 'bg-white text-[#574B45] border border-[#EDE4D7] hover:bg-[#F6F1EA]'
              }`}
            >
              Catas
            </button>
            <button
              id="filter-home-cursos"
              type="button"
              onClick={() => setFilterType('curso')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterType === 'curso'
                  ? 'bg-[#521849] text-white shadow-xs'
                  : 'bg-white text-[#574B45] border border-[#EDE4D7] hover:bg-[#F6F1EA]'
              }`}
            >
              Cursos
            </button>
            <button
              id="filter-home-viajes"
              type="button"
              onClick={() => setFilterType('viaje')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterType === 'viaje'
                  ? 'bg-[#521849] text-white shadow-xs'
                  : 'bg-white text-[#574B45] border border-[#EDE4D7] hover:bg-[#F6F1EA]'
              }`}
            >
              Viajes
            </button>
          </div>
        </div>

        {/* Activity Grid */}
        {featuredActivities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {featuredActivities.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-[#EDE4D7]">
            <Calendar className="w-10 h-10 text-[#DFD3C2] mx-auto mb-3" />
            <p className="text-sm text-[#574B45]">
              No hay actividades programadas en esta categoría actualmente.
            </p>
          </div>
        )}
      </section>

      {/* Institutional Philosophy Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-[#F6EDF4] border border-[#521849]/20 p-8 md:p-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <span className="text-xs uppercase tracking-widest font-bold text-[#521849]">
              Nuestra Filosofía
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold font-serif text-[#26201D] leading-tight">
              Una asociación hecha por y para apasionados de la mesa
            </h3>
            <p className="text-sm text-[#574B45] leading-relaxed">
              En Doña Berenjena no buscamos el academicismo rígido, sino el conocimiento vivido: saber por qué un vino sabe a su suelo, cómo un corte de carne cambia según su braseado y qué historia guardan los artesanos que cuidan nuestras tradiciones.
            </p>
            <div className="pt-2 flex flex-wrap gap-6 text-xs font-semibold text-[#26201D]">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[#521849]" />
                <span>Sumilleres y Chefs Acreditados</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#521849]" />
                <span>Grupos Reducidos y Cercanos</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#521849]" />
                <span>Documentación y Fichas Propias</span>
              </div>
            </div>
            <div className="pt-4">
              <Link
                to="/conocenos"
                className="inline-flex items-center gap-2 text-xs font-bold text-[#521849] hover:text-[#290824] uppercase tracking-wider"
              >
                <span>Conocer la historia de la asociación</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="aspect-4/3 rounded-2xl overflow-hidden shadow-lg border border-[#DFD3C2]">
              <img
                src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80"
                alt="Instalaciones de cocina de Doña Berenjena"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-4 -left-4 bg-white p-4 rounded-xl shadow-md border border-[#EDE4D7] hidden sm:flex items-center gap-3 max-w-xs">
              <MapPin className="w-5 h-5 text-[#521849] shrink-0" />
              <p className="text-xs text-[#26201D] font-medium leading-tight">
                Sede central con salón de catas y cocina profesional en Bolaños de Calatrava.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
