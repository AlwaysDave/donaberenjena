import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ActivityType, CursoActivity, ViajeActivity } from '../../types';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Wine, 
  ChefHat, 
  Compass, 
  Clock, 
  MapPin, 
  Users, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  Filter,
  Repeat,
  Columns,
  X
} from 'lucide-react';
import { 
  parseActivityDate, 
  formatDateSpanish, 
  getActivityOccurrences, 
  ActivityDayOccurrence,
  formatActivityScheduleSummary 
} from '../../utils/dateUtils';

interface ActivitiesCalendarProps {
  activities: Activity[];
  showSplitViewToggle?: boolean;
  onToggleSplitView?: () => void;
}

interface DayActivityEntry {
  activity: Activity;
  occurrence: ActivityDayOccurrence;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const WEEKDAY_NAMES_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const WEEKDAY_NAMES_FULL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export const ActivitiesCalendar: React.FC<ActivitiesCalendarProps> = ({ 
  activities,
  showSplitViewToggle = false,
  onToggleSplitView
}) => {
  const today = useMemo(() => new Date(), []);
  
  // Set initial month to current month, or the first month that has upcoming activities if current month is empty
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const currentMonthHasEvents = activities.some(a => {
      const occs = getActivityOccurrences(a);
      return occs.some(occ => occ.year === today.getFullYear() && occ.month === today.getMonth());
    });
    if (!currentMonthHasEvents) {
      const upcoming = activities
        .filter(a => a.status === 'proxima')
        .map(a => parseActivityDate(a.date || (a as any).startDate))
        .filter(ts => ts > 0)
        .sort((a, b) => a - b);
      if (upcoming.length > 0) {
        const d = new Date(upcoming[0]);
        return new Date(d.getFullYear(), d.getMonth(), 1);
      }
    }
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedCategory, setSelectedCategory] = useState<'all' | ActivityType>('all');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    setSelectedDay(null);
  };

  const handleGoToToday = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDay(now.getDate());
  };

  // Filter activities by category
  const filteredActivities = useMemo(() => {
    return activities.filter(activity => {
      if (selectedCategory === 'all') return true;
      return activity.type === selectedCategory;
    });
  }, [activities, selectedCategory]);

  // Map activities by day number in the current month using multi-day occurrences
  const activitiesByDay = useMemo(() => {
    const map = new Map<number, DayActivityEntry[]>();
    
    filteredActivities.forEach(activity => {
      const occurrences = getActivityOccurrences(activity);
      occurrences.forEach(occ => {
        if (occ.year === currentYear && occ.month === currentMonth) {
          const day = occ.day;
          const list = map.get(day) || [];
          if (!list.some(item => item.activity.id === activity.id)) {
            list.push({ activity, occurrence: occ });
          }
          map.set(day, list);
        }
      });
    });

    return map;
  }, [filteredActivities, currentYear, currentMonth]);

  // Calendar matrix calculation
  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfWeek = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7; // 0 = Lunes, 6 = Domingo
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days: Array<{
      dayNumber: number;
      isCurrentMonth: boolean;
      dateKey: string;
      activities: Activity[];
      dayEntries: DayActivityEntry[];
    }> = [];

    // Leading days from previous month
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      days.push({
        dayNumber: dayNum,
        isCurrentMonth: false,
        dateKey: `prev-${dayNum}`,
        activities: [],
        dayEntries: []
      });
    }

    // Days in current month
    for (let day = 1; day <= daysInMonth; day++) {
      const entries = activitiesByDay.get(day) || [];
      days.push({
        dayNumber: day,
        isCurrentMonth: true,
        dateKey: `curr-${day}`,
        activities: entries.map(e => e.activity),
        dayEntries: entries
      });
    }

    // Trailing days from next month to complete standard 35 or 42 grid
    const totalSlots = days.length <= 35 ? 35 : 42;
    const remainingSlots = totalSlots - days.length;
    for (let day = 1; day <= remainingSlots; day++) {
      days.push({
        dayNumber: day,
        isCurrentMonth: false,
        dateKey: `next-${day}`,
        activities: [],
        dayEntries: []
      });
    }

    return days;
  }, [currentYear, currentMonth, activitiesByDay]);

  // Total weeks in grid (5 or 6)
  const totalWeeks = useMemo(() => {
    return calendarDays.length <= 35 ? 5 : 6;
  }, [calendarDays.length]);

  // Activities count for this month
  const totalMonthActivities = useMemo(() => {
    let count = 0;
    activitiesByDay.forEach(list => {
      count += list.length;
    });
    return count;
  }, [activitiesByDay]);

  // Today reference
  const isViewingCurrentMonth = today.getFullYear() === currentYear && today.getMonth() === currentMonth;
  const todayDateNumber = today.getDate();

  // Selected Day's activities
  const selectedDayEntries = useMemo(() => {
    if (selectedDay === null) return [];
    return activitiesByDay.get(selectedDay) || [];
  }, [selectedDay, activitiesByDay]);

  // Helper for type styling and icons
  const getTypeBadge = (type: ActivityType) => {
    switch (type) {
      case 'cata':
        return {
          label: 'Cata',
          icon: Wine,
          bgClass: 'bg-[#521849]/10 text-[#521849] border-[#521849]/20',
          dotClass: 'bg-[#521849]',
          borderClass: 'border-[#521849]/30'
        };
      case 'curso':
        return {
          label: 'Curso',
          icon: ChefHat,
          bgClass: 'bg-[#C96043]/10 text-[#C96043] border-[#C96043]/20',
          dotClass: 'bg-[#C96043]',
          borderClass: 'border-[#C96043]/30'
        };
      case 'viaje':
        return {
          label: 'Viaje',
          icon: Compass,
          bgClass: 'bg-[#4D6233]/10 text-[#4D6233] border-[#4D6233]/20',
          dotClass: 'bg-[#4D6233]',
          borderClass: 'border-[#4D6233]/30'
        };
    }
  };

  const getActivityImage = (activity: Activity) => {
    if (activity.images && activity.images.length > 0 && activity.images[0]) {
      return activity.images[0];
    }
    if (activity.type === 'cata') {
      return 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=400&q=80';
    }
    if (activity.type === 'curso') {
      return 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=400&q=80';
    }
    return 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80';
  };

  return (
    <div id="activities-calendar-section" className="w-full">
      {/* Calendar Card that adapts to viewport height and stays centered without being cut off */}
      <div 
        id="calendar-main-card"
        className="bg-white rounded-2xl sm:rounded-3xl border border-[#EDE4D7] shadow-xs p-2 sm:p-2.5 lg:p-3 flex flex-col justify-between h-[80vh] min-h-[460px] lg:h-[calc(100vh-9.5rem)] lg:max-h-[760px] gap-1.5"
      >
        
        {/* Compact Header & Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-[#EDE4D7] pb-2 shrink-0">
          {/* Left: Month title and badge */}
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 sm:p-2 rounded-xl bg-[#521849]/10 text-[#521849] shrink-0">
              <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#521849]" />
            </span>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg lg:text-xl font-bold font-serif text-[#26201D] capitalize leading-none">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </h2>
              <span className="text-[10px] sm:text-[11px] font-bold text-[#521849] bg-[#521849]/10 px-2 py-0.5 rounded-full shrink-0">
                {totalMonthActivities} {totalMonthActivities === 1 ? 'evento' : 'eventos'}
              </span>
            </div>
          </div>

          {/* Right: Controls & Filters & Navigation */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 bg-[#FAF8F5] p-0.5 rounded-xl border border-[#EDE4D7]">
              <button
                id="calendar-filter-all"
                type="button"
                onClick={() => { setSelectedCategory('all'); setSelectedDay(null); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-[#521849] text-white shadow-2xs'
                    : 'text-[#574B45] hover:bg-[#EDE4D7]'
                }`}
              >
                Todas
              </button>
              <button
                id="calendar-filter-cata"
                type="button"
                onClick={() => { setSelectedCategory('cata'); setSelectedDay(null); }}
                className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  selectedCategory === 'cata'
                    ? 'bg-[#521849] text-white shadow-2xs'
                    : 'text-[#574B45] hover:bg-[#EDE4D7]'
                }`}
              >
                <Wine className="w-3 h-3 text-[#521849]" />
                <span>Catas</span>
              </button>
              <button
                id="calendar-filter-curso"
                type="button"
                onClick={() => { setSelectedCategory('curso'); setSelectedDay(null); }}
                className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  selectedCategory === 'curso'
                    ? 'bg-[#C96043] text-white shadow-2xs'
                    : 'text-[#574B45] hover:bg-[#EDE4D7]'
                }`}
              >
                <ChefHat className="w-3 h-3 text-[#C96043]" />
                <span>Cursos</span>
              </button>
              <button
                id="calendar-filter-viaje"
                type="button"
                onClick={() => { setSelectedCategory('viaje'); setSelectedDay(null); }}
                className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  selectedCategory === 'viaje'
                    ? 'bg-[#4D6233] text-white shadow-2xs'
                    : 'text-[#574B45] hover:bg-[#EDE4D7]'
                }`}
              >
                <Compass className="w-3 h-3 text-[#4D6233]" />
                <span>Viajes</span>
              </button>
            </div>

            {/* Navigation: Hoy + Month Chevrons */}
            <div className="flex items-center gap-1 bg-[#FAF8F5] p-0.5 rounded-xl border border-[#EDE4D7]">
              <button
                id="calendar-btn-prev"
                type="button"
                onClick={handlePrevMonth}
                aria-label="Mes anterior"
                className="p-1 rounded-lg hover:bg-[#EDE4D7] text-[#574B45] cursor-pointer transition-colors"
                title="Mes anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                id="calendar-btn-today"
                type="button"
                onClick={handleGoToToday}
                className="px-2 py-0.5 text-xs font-bold text-[#521849] hover:bg-[#EDE4D7] rounded-md cursor-pointer transition-colors"
                title="Ir al mes actual"
              >
                Hoy
              </button>
              <button
                id="calendar-btn-next"
                type="button"
                onClick={handleNextMonth}
                aria-label="Mes siguiente"
                className="p-1 rounded-lg hover:bg-[#EDE4D7] text-[#574B45] cursor-pointer transition-colors"
                title="Mes siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Split View Toggle Button (Ver fichas) */}
            {showSplitViewToggle && onToggleSplitView && (
              <button
                id="calendar-btn-view-cards"
                type="button"
                onClick={onToggleSplitView}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#521849] hover:bg-[#3E1037] text-white text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0"
                title="Volver a la vista de mini-calendario y fichas"
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Ver fichas</span>
              </button>
            )}
          </div>
        </div>

        {/* Desktop & Tablet Calendar Grid */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden rounded-2xl border border-[#EDE4D7] bg-[#FAF8F5] shadow-2xs">
          {/* Weekday Header */}
          <div className="grid grid-cols-7 bg-[#F6F1EA] border-b border-[#EDE4D7] text-center font-bold text-[11px] sm:text-xs text-[#26201D] py-1.5 shrink-0">
            {WEEKDAY_NAMES_SHORT.map((name, idx) => (
              <div key={name} className="flex flex-col items-center">
                <span className="hidden sm:inline font-serif">{WEEKDAY_NAMES_FULL[idx]}</span>
                <span className="sm:hidden font-serif">{name}</span>
              </div>
            ))}
          </div>

          {/* Days Grid - fits 100% of container height divided equally across weeks */}
          <div 
            className="grid grid-cols-7 flex-1 min-h-0 gap-px bg-[#EDE4D7]"
            style={{ gridTemplateRows: `repeat(${totalWeeks}, minmax(0, 1fr))` }}
          >
            {calendarDays.map((cell) => {
              const hasActivities = cell.activities.length > 0;
              const isToday = isViewingCurrentMonth && cell.isCurrentMonth && cell.dayNumber === todayDateNumber;
              const isSelected = cell.isCurrentMonth && selectedDay === cell.dayNumber;

              return (
                <div
                  key={cell.dateKey}
                  onClick={() => {
                    if (cell.isCurrentMonth && hasActivities) {
                      setSelectedDay(isSelected ? null : cell.dayNumber);
                    }
                  }}
                  className={`p-1 sm:p-1.5 transition-all flex flex-col justify-between overflow-hidden h-full min-h-0 ${
                    cell.isCurrentMonth ? 'bg-white' : 'bg-[#FAF8F5]/60 opacity-40'
                  } ${
                    hasActivities && cell.isCurrentMonth 
                      ? 'cursor-pointer hover:bg-[#FDFBFA]' 
                      : ''
                  } ${
                    isSelected ? 'ring-2 ring-[#521849] bg-[#FDFBFA] z-10' : ''
                  }`}
                >
                  {/* Day Number and Badges Header */}
                  <div className="flex items-center justify-between gap-1 shrink-0 mb-0.5">
                    <span
                      className={`text-[10px] sm:text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full transition-colors ${
                        isToday
                          ? 'bg-[#521849] text-white shadow-2xs font-bold'
                          : isSelected
                          ? 'bg-[#521849]/10 text-[#521849] font-extrabold'
                          : cell.isCurrentMonth
                          ? 'text-[#26201D]'
                          : 'text-[#A89F91]'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {/* Small dot indicators for mobile view */}
                    {hasActivities && cell.isCurrentMonth && (
                      <div className="flex items-center gap-1 sm:hidden">
                        {cell.activities.slice(0, 3).map((act) => {
                          const badge = getTypeBadge(act.type);
                          return (
                            <span
                              key={act.id}
                              className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`}
                            />
                          );
                        })}
                        {cell.activities.length > 3 && (
                          <span className="text-[8px] text-[#574B45] font-bold">
                            +{cell.activities.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Activity count badge on tablet/desktop */}
                    {hasActivities && cell.isCurrentMonth && (
                      <span className="hidden sm:inline-flex items-center px-1.5 py-0.2 rounded bg-[#521849]/10 text-[#521849] text-[9px] font-bold">
                        {cell.activities.length} {cell.activities.length === 1 ? 'evento' : 'eventos'}
                      </span>
                    )}
                  </div>

                  {/* Desktop Activity Thumbnails Inside Cell */}
                  {hasActivities && cell.isCurrentMonth ? (
                    <div className="space-y-1 my-auto overflow-hidden flex-1 min-h-0 flex flex-col justify-center">
                      {cell.dayEntries.slice(0, totalWeeks === 6 ? 1 : 2).map(({ activity: act, occurrence: occ }) => {
                        const badge = getTypeBadge(act.type);
                        const isSoldOut = (act.bookedSpots ?? 0) >= (act.totalSpots ?? 0);
                        const isCelebrated = act.status === 'celebrada';
                        const thumbImg = getActivityImage(act);

                        return (
                          <Link
                            key={`${act.id}-${occ.day}`}
                            to={`/actividad/${act.id}`}
                            onClick={(e) => e.stopPropagation()}
                            title={`${act.title} (${badge.label}${occ.sessionLabel ? ` - ${occ.sessionLabel}` : ''})`}
                            className="group/thumb block rounded-lg border border-[#EDE4D7] bg-[#FAF8F5] hover:bg-white hover:border-[#521849]/40 hover:shadow-xs p-1 transition-all text-left shadow-2xs"
                          >
                            <div className="flex items-start gap-1.5">
                              {/* Thumbnail Image */}
                              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md overflow-hidden shrink-0 border border-black/5 bg-[#290824]/10 mt-0.5">
                                <img
                                  src={thumbImg}
                                  alt=""
                                  loading="lazy"
                                  className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-300"
                                />
                              </div>

                              {/* Thumbnail Meta */}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start gap-1">
                                  <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass} shrink-0 mt-1`} />
                                  <span className="text-[10px] sm:text-[11px] font-bold text-[#26201D] line-clamp-2 group-hover/thumb:text-[#521849] leading-tight block">
                                    {act.title}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-[9px] text-[#574B45] mt-0.5 gap-1">
                                  {occ.isMultiDay && occ.sessionLabel ? (
                                    <span className="truncate font-semibold text-[#C96043] bg-[#C96043]/10 px-1 py-0.2 rounded text-[8.5px]">
                                      {occ.sessionLabel}
                                    </span>
                                  ) : (
                                    <span className="truncate">{act.time || badge.label}</span>
                                  )}
                                  {isSoldOut ? (
                                    <span className="text-rose-700 font-bold shrink-0 ml-1 text-[8.5px]">Lleno</span>
                                  ) : isCelebrated ? (
                                    <span className="text-slate-500 font-medium shrink-0 ml-1 text-[8.5px]">Celebrada</span>
                                  ) : (
                                    <span className="text-emerald-700 font-bold shrink-0 ml-1 text-[8.5px]">
                                      {act.priceMember}€
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Link>
                        );
                      })}

                      {/* Extra activities indicator if more than visible */}
                      {cell.dayEntries.length > (totalWeeks === 6 ? 1 : 2) && (
                        <div className="text-[9px] text-[#521849] font-bold text-center pt-0.5 hover:underline cursor-pointer">
                          +{cell.dayEntries.length - (totalWeeks === 6 ? 1 : 2)} más (ver día)
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Modal Inspector */}
        {selectedDay !== null && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn"
            onClick={() => setSelectedDay(null)}
          >
            <div 
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-5 sm:p-6 shadow-2xl border border-[#EDE4D7] space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[#EDE4D7] pb-3">
                <div>
                  <span className="text-xs uppercase tracking-wider font-bold text-[#521849]">
                    Detalle del día seleccionado
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold font-serif text-[#26201D] mt-0.5">
                    {selectedDay} de {MONTH_NAMES[currentMonth]} de {currentYear}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDay(null)}
                  className="p-1.5 rounded-lg bg-[#FAF8F5] hover:bg-[#EDE4D7] text-[#574B45] hover:text-[#26201D] cursor-pointer transition-colors"
                  aria-label="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {selectedDayEntries.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {selectedDayEntries.map(({ activity: act, occurrence: occ }) => {
                    const badge = getTypeBadge(act.type);
                    const Icon = badge.icon;
                    const thumbImg = getActivityImage(act);
                    const spotsLeft = (act.totalSpots ?? 0) - (act.bookedSpots ?? 0);
                    const isSoldOut = spotsLeft <= 0;

                    return (
                      <div
                        key={`${act.id}-${occ.day}`}
                        className="bg-[#FAF8F5] rounded-xl border border-[#EDE4D7] p-3.5 flex flex-col justify-between hover:border-[#521849]/40 transition-all space-y-2.5"
                      >
                        <div className="flex gap-2.5 items-start">
                          <img
                            src={thumbImg}
                            alt={act.title}
                            className="w-14 h-14 rounded-lg object-cover shrink-0 border border-[#EDE4D7]"
                          />
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[9.5px] font-bold ${badge.bgClass}`}>
                              <Icon className="w-3 h-3" />
                              <span>{badge.label}</span>
                            </span>
                            <h4 className="text-xs font-bold font-serif text-[#26201D] line-clamp-2">
                              {act.title}
                            </h4>
                            <span className="text-[10px] text-[#574B45] block">
                              {act.time || 'Consultar horario'} • {act.location || 'Madrid'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-[#EDE4D7] text-xs">
                          <div>
                            <span className="font-bold text-[#521849]">{act.priceMember}€</span>
                            <span className="text-[10px] text-[#574B45] ml-1">socio</span>
                          </div>
                          <Link
                            to={`/actividad/${act.id}`}
                            className="px-2.5 py-1 rounded-lg bg-[#521849] hover:bg-[#3E1037] text-white text-[11px] font-bold transition-colors shadow-2xs"
                          >
                            Ver actividad
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-[#574B45]">
                  No hay actividades programadas para este día con el filtro actual.
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
