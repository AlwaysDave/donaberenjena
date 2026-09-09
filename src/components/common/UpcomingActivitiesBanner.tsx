import React, { useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ActivityType } from '../../types';
import { 
  Calendar as CalendarIcon, 
  Wine, 
  ChefHat, 
  Compass, 
  Clock, 
  MapPin, 
  ArrowRight, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight,
  Users,
  Award,
  CheckCircle2
} from 'lucide-react';
import { parseActivityDate, sortActivitiesAscending, getActivityOccurrences } from '../../utils/dateUtils';

interface UpcomingActivitiesBannerProps {
  activities: Activity[];
  category?: ActivityType | 'all';
  title?: string;
  subtitle?: string;
}

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const MONTHS_FULL = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

export const UpcomingActivitiesBanner: React.FC<UpcomingActivitiesBannerProps> = ({
  activities,
  category = 'all',
  title,
  subtitle
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -340 : 340;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Filter upcoming activities matching category
  const filteredUpcoming = useMemo(() => {
    const upcoming = activities.filter(a => a.status === 'proxima');
    if (category === 'all') {
      return sortActivitiesAscending(upcoming);
    }
    return sortActivitiesAscending(upcoming.filter(a => a.type === category));
  }, [activities, category]);

  // Extract date strip items with activities
  const dateStripItems = useMemo(() => {
    const datesMap = new Map<string, { dateObj: Date; count: number; activities: Activity[]; types: Set<ActivityType> }>();

    filteredUpcoming.forEach(a => {
      const occurrences = getActivityOccurrences(a);
      occurrences.forEach(occ => {
        const d = new Date(occ.year, occ.month, occ.day);
        const key = occ.dateKey;
        const existing = datesMap.get(key) || { dateObj: d, count: 0, activities: [], types: new Set() };
        existing.count += 1;
        if (!existing.activities.some(item => item.id === a.id)) {
          existing.activities.push(a);
        }
        existing.types.add(a.type);
        datesMap.set(key, existing);
      });
    });

    return Array.from(datesMap.entries())
      .map(([key, value]) => ({
        key,
        dateObj: value.dateObj,
        dayName: WEEKDAYS[value.dateObj.getDay()],
        dayNumber: value.dateObj.getDate(),
        monthName: MONTHS_SHORT[value.dateObj.getMonth()],
        year: value.dateObj.getFullYear(),
        count: value.count,
        types: Array.from(value.types),
        activities: value.activities,
        primaryActivity: value.activities[0]
      }))
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  }, [filteredUpcoming]);

  // Dynamic calculations for the first Stats Card
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const daysThisMonthWithEvents = useMemo(() => {
    const uniqueDays = new Set<number>();
    filteredUpcoming.forEach(a => {
      const occs = getActivityOccurrences(a);
      occs.forEach(occ => {
        if (occ.year === currentYear && occ.month === currentMonth) {
          uniqueDays.add(occ.day);
        }
      });
    });
    return uniqueDays.size;
  }, [filteredUpcoming, currentYear, currentMonth]);

  // Default section title and tag
  const displayTitle = title || (
    category === 'cata' 
      ? 'Próximas Catas en Cartelera' 
      : category === 'curso' 
      ? 'Próximos Talleres y Cursos' 
      : category === 'viaje' 
      ? 'Próximas Salidas y Rutas' 
      : 'Próximas Actividades en Cartelera'
  );

  const displaySubtitle = subtitle || (
    category === 'cata'
      ? 'Explora las fechas confirmadas de sesiones enológicas y maridajes'
      : category === 'curso'
      ? 'Talleres prácticos con plazas limitadas en nuestra cocina'
      : category === 'viaje'
      ? 'Escapadas enogastronómicas guiadas por bodegas y comarcas'
      : 'Línea temporal ilustrada con todas las citas programadas'
  );

  const categoryBadgeLabel = category === 'cata'
    ? 'Catas Gastronómicas'
    : category === 'curso'
    ? 'Cursos de Cocina'
    : category === 'viaje'
    ? 'Viajes Enogastronómicos'
    : 'Todas las Disciplinas';

  const thirdStatLabel = category === 'cata'
    ? 'Sumilleres y maridajes gourmet'
    : category === 'curso'
    ? '100% práctico en cocina equipada'
    : category === 'viaje'
    ? 'Rutas exclusivas en grupos reducidos'
    : 'Catas, talleres y salidas de terruño';

  if (filteredUpcoming.length === 0) {
    return null;
  }

  return (
    <section className="bg-white rounded-2xl sm:rounded-3xl border border-[#EDE4D7] p-4 sm:p-6 md:p-7 shadow-xs">
      {/* Banner Header with Title & Navigation Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#521849] mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[#C96043]" />
            <span>{categoryBadgeLabel} • Cartelera Inminente</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#26201D]">
            {displayTitle}
          </h2>
          <p className="text-xs sm:text-sm text-[#574B45] mt-0.5">
            {displaySubtitle}
          </p>
        </div>

        {/* Scroll Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => scroll('left')}
            className="p-2 rounded-xl border border-[#EDE4D7] bg-[#FAF8F5] hover:bg-[#F6F1EA] text-[#574B45] hover:text-[#26201D] cursor-pointer transition-colors"
            title="Ver citas anteriores"
            aria-label="Desplazar a la izquierda"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            className="p-2 rounded-xl border border-[#EDE4D7] bg-[#FAF8F5] hover:bg-[#F6F1EA] text-[#574B45] hover:text-[#26201D] cursor-pointer transition-colors"
            title="Ver más citas programadas"
            aria-label="Desplazar a la derecha"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Carousel Track */}
      <div
        ref={scrollRef}
        className="flex items-stretch gap-4 overflow-x-auto pb-2 scrollbar-none -mx-2 px-2 scroll-smooth"
      >
        {/* FIRST CARD: Informative Highlight / Summary Stats */}
        <div className="w-64 sm:w-72 shrink-0 p-5 rounded-2xl bg-linear-to-br from-[#290824] to-[#42123B] text-white border border-[#521849] flex flex-col justify-between shadow-md relative overflow-hidden group">
          {/* Ambient decorative glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#C96043]/15 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/15 text-[#EDE4D7] backdrop-blur-xs flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#C96043]" />
                <span>Resumen Agenda</span>
              </span>
              <CalendarIcon className="w-4 h-4 text-[#EDE4D7]/70" />
            </div>

            {/* Big Headline Metric */}
            <div className="mb-4">
              <span className="text-4xl font-bold font-serif text-white tracking-tight block">
                {filteredUpcoming.length}
              </span>
              <span className="text-xs font-semibold text-[#DFD3C2] block mt-0.5">
                {filteredUpcoming.length === 1 ? 'actividad en cartelera' : 'actividades en cartelera'}
              </span>
            </div>

            {/* Key Data Points */}
            <div className="space-y-2.5 text-xs text-[#EDE4D7]/90 pt-3 border-t border-white/15">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center shrink-0">
                  <CalendarIcon className="w-3 h-3 text-[#EDE4D7]" />
                </div>
                <span>
                  <strong className="text-white font-bold">{daysThisMonthWithEvents}</strong> {daysThisMonthWithEvents === 1 ? 'día con cita' : 'días con citas'} en {MONTHS_FULL[currentMonth]}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center shrink-0">
                  <Award className="w-3 h-3 text-[#EDE4D7]" />
                </div>
                <span className="truncate" title={thirdStatLabel}>
                  {thirdStatLabel}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center shrink-0">
                  <Users className="w-3 h-3 text-[#EDE4D7]" />
                </div>
                <span>Plazas limitadas por aforo</span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-white/15 flex items-center justify-between text-[11px] font-bold text-[#DFD3C2]">
            <span>Explorar cartelera</span>
            <span className="flex items-center gap-1 text-white group-hover:translate-x-1 transition-transform">
              <span>Desliza</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* VISUAL ACTIVITY CARDS */}
        {dateStripItems.map((item) => {
          const act = item.primaryActivity;
          if (!act) return null;

          const isCata = act.type === 'cata';
          const isCurso = act.type === 'curso';
          const typeLabel = isCata ? 'Cata' : isCurso ? 'Curso' : 'Viaje';
          const TypeIcon = isCata ? Wine : isCurso ? ChefHat : Compass;
          const typeBadgeColor = isCata 
            ? 'bg-[#521849] text-white' 
            : isCurso 
            ? 'bg-[#C96043] text-white' 
            : 'bg-[#4D6233] text-white';

          const thumbImg = act.images?.[0] || 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80';
          const spotsLeft = (act.totalSpots ?? 0) - (act.bookedSpots ?? 0);
          const isSoldOut = spotsLeft <= 0;

          return (
            <Link
              key={`${item.key}-${act.id}`}
              to={`/actividad/${act.id}`}
              className="w-64 sm:w-72 shrink-0 p-3.5 rounded-2xl bg-white border border-[#EDE4D7] hover:border-[#521849]/40 hover:shadow-md transition-all text-left flex flex-col justify-between group cursor-pointer"
            >
              {/* Card Header: Date badge + Category Pill */}
              <div>
                <div className="flex items-center justify-between gap-1.5 mb-2.5">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#FAF8F5] text-[#26201D] border border-[#EDE4D7] shadow-2xs">
                    {item.dayName}, {item.dayNumber} {item.monthName}
                  </span>

                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${typeBadgeColor} shadow-2xs`}>
                    <TypeIcon className="w-3 h-3" />
                    <span>{typeLabel}</span>
                  </span>
                </div>

                {/* Visual Image Thumbnail */}
                <div className="relative h-28 sm:h-32 rounded-xl overflow-hidden mb-3 bg-[#FAF8F5] border border-[#EDE4D7]">
                  <img
                    src={thumbImg}
                    alt={act.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />

                  {/* Price and schedule overlay badge */}
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-[11px] font-bold">
                    <span className="flex items-center gap-1 drop-shadow-xs truncate max-w-[65%]">
                      <Clock className="w-3 h-3 shrink-0" />
                      <span className="truncate">{act.time || '19:30 h'}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[11px] font-bold shadow-2xs">
                      {act.priceMember}€ socios
                    </span>
                  </div>

                  {isSoldOut && (
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-600 text-white shadow-xs">
                        Completo
                      </span>
                    </div>
                  )}
                </div>

                {/* Title and location */}
                <h4 className="text-xs sm:text-sm font-bold font-serif text-[#26201D] line-clamp-2 group-hover:text-[#521849] transition-colors leading-tight">
                  {act.title}
                </h4>

                <div className="flex items-center gap-1 text-[11px] text-[#574B45] mt-1.5 truncate">
                  <MapPin className="w-3 h-3 text-[#8C7E77] shrink-0" />
                  <span className="truncate">{act.location || 'Sede Bolaños de Calatrava'}</span>
                </div>
              </div>

              {/* Card Footer: Action button */}
              <div className="mt-3 pt-2.5 border-t border-[#EDE4D7] flex items-center justify-between text-[11px] text-[#521849] font-bold">
                <span>Ver ficha y reservar</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};
