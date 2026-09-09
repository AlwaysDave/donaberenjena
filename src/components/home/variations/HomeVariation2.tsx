import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ActivityType } from '../../../types';
import { ActivityCard } from '../../common/ActivityCard';
import { ActivitiesCalendar } from '../ActivitiesCalendar';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Wine, 
  ChefHat, 
  Compass, 
  Sparkles, 
  X, 
  CheckCircle2,
  CalendarCheck,
  Maximize2,
  Minimize2,
  Columns,
  Clock,
  MapPin,
  ArrowRight
} from 'lucide-react';
import { parseActivityDate, sortActivitiesAscending, formatDateSpanish, getActivityOccurrences } from '../../../utils/dateUtils';

interface HomeVariationProps {
  activities: Activity[];
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const WEEKDAY_SHORT = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function getActivityParts(dateStr?: string | null): { year: number; month: number; day: number } | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  
  if (trimmed.includes('/') || (trimmed.includes('-') && trimmed.indexOf('-') <= 2)) {
    const parts = trimmed.split(trimmed.includes('/') ? '/' : '-');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) return { year, month, day };
    }
  }

  const isoParts = trimmed.split('T')[0].split('-');
  if (isoParts.length === 3 && isoParts[0].length === 4) {
    const year = parseInt(isoParts[0], 10);
    const month = parseInt(isoParts[1], 10) - 1;
    const day = parseInt(isoParts[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) return { year, month, day };
  }

  const timestamp = parseActivityDate(dateStr);
  if (timestamp > 0) {
    const d = new Date(timestamp);
    return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
  }
  return null;
}

export const HomeVariation2: React.FC<HomeVariationProps> = ({ activities }) => {
  const today = useMemo(() => new Date(), []);
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
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<'all' | ActivityType>('all');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Smoothly center the expanded calendar in the viewport (taking into account the sticky navbar)
  const scrollToCenterCalendar = () => {
    setTimeout(() => {
      const calendarEl = document.getElementById('activities-calendar-section') || document.getElementById('calendar-main-card');
      if (!calendarEl) return;

      const navHeader = document.querySelector('header');
      const navHeight = navHeader ? navHeader.getBoundingClientRect().height : 95;
      
      const viewportHeight = window.innerHeight;
      const calendarRect = calendarEl.getBoundingClientRect();
      const calendarHeight = calendarRect.height;
      
      // Calculate remaining visible height between the sticky navbar and the bottom of the viewport
      const availableVisibleHeight = viewportHeight - navHeight;
      
      // Vertical offset from navbar to center calendar in the visible screen
      let topOffsetInVisible = (availableVisibleHeight - calendarHeight) / 2;
      
      // Maintain at least 14px breathing space below the sticky navbar
      if (topOffsetInVisible < 14) {
        topOffsetInVisible = 14;
      }
      
      const targetScrollY = window.pageYOffset + calendarRect.top - navHeight - topOffsetInVisible;
      
      window.scrollTo({
        top: Math.max(0, targetScrollY),
        behavior: 'smooth'
      });
    }, 70);
  };

  const toggleExpanded = (val: boolean) => {
    setIsExpanded(val);
    if (val) {
      scrollToCenterCalendar();
    } else {
      setTimeout(() => {
        const el = document.getElementById('agenda-seccion');
        if (el) {
          const navHeader = document.querySelector('header');
          const navHeight = navHeader ? navHeader.getBoundingClientRect().height : 95;
          const targetY = window.pageYOffset + el.getBoundingClientRect().top - navHeight - 16;
          window.scrollTo({
            top: Math.max(0, targetY),
            behavior: 'smooth'
          });
        }
      }, 50);
    }
  };

  useEffect(() => {
    if (isExpanded) {
      scrollToCenterCalendar();
    }
  }, [isExpanded]);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    setSelectedDay(null);
  };

  const handleGoToToday = () => {
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDay(today.getDate());
  };

  // Map activities for current month using multi-day occurrences
  const monthActivitiesMap = useMemo(() => {
    const map = new Map<number, Activity[]>();
    activities.forEach(a => {
      const occurrences = getActivityOccurrences(a);
      occurrences.forEach(occ => {
        if (occ.year === currentYear && occ.month === currentMonth) {
          const list = map.get(occ.day) || [];
          if (!list.some(item => item.id === a.id)) {
            list.push(a);
          }
          map.set(occ.day, list);
        }
      });
    });
    return map;
  }, [activities, currentYear, currentMonth]);

  // Mini-Calendar Days
  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfWeek = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days: Array<{
      dayNumber: number;
      isCurrentMonth: boolean;
      activities: Activity[];
    }> = [];

    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push({
        dayNumber: daysInPrevMonth - i,
        isCurrentMonth: false,
        activities: []
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        dayNumber: day,
        isCurrentMonth: true,
        activities: monthActivitiesMap.get(day) || []
      });
    }

    const totalSlots = days.length <= 35 ? 35 : 42;
    const remainingSlots = totalSlots - days.length;
    for (let day = 1; day <= remainingSlots; day++) {
      days.push({
        dayNumber: day,
        isCurrentMonth: false,
        activities: []
      });
    }

    return days;
  }, [currentYear, currentMonth, monthActivitiesMap]);

  // Filtered activities displayed on the right
  const displayedActivities = useMemo(() => {
    let result = activities.filter(a => a.status === 'proxima');

    if (filterType !== 'all') {
      result = result.filter(a => a.type === filterType);
    }

    if (selectedDay !== null) {
      result = result.filter(a => {
        const occurrences = getActivityOccurrences(a);
        return occurrences.some(occ => occ.year === currentYear && occ.month === currentMonth && occ.day === selectedDay);
      });
    }

    return sortActivitiesAscending(result);
  }, [activities, filterType, selectedDay, currentYear, currentMonth]);

  const isCurrentMonthActive = today.getFullYear() === currentYear && today.getMonth() === currentMonth;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header section (shown only in split view; in expanded view, the calendar has its own compact header to maximize screen space) */}
      {!isExpanded && (
        <div className="mb-8 border-b border-[#EDE4D7] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest font-semibold text-[#521849]">
              Agenda & Actividades
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#26201D] mt-1">
              Calendario interactivo y agenda sincronizada
            </h2>
            <p className="text-xs sm:text-sm text-[#574B45] mt-1">
              Navega por los días del calendario a la izquierda para filtrar instantáneamente el catálogo de eventos a la derecha.
            </p>
          </div>

          {/* Global Expand Toggle */}
          <div className="shrink-0">
            <button
              id="btn-toggle-calendar-view-header"
              type="button"
              onClick={() => toggleExpanded(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs bg-white hover:bg-[#F6F1EA] text-[#521849] border border-[#EDE4D7] hover:border-[#521849]/30"
            >
              <Maximize2 className="w-4 h-4" />
              <span>Ampliar calendario</span>
            </button>
          </div>
        </div>
      )}

      {isExpanded ? (
        /* ================= FULL-SIZE ENLARGED CALENDAR (CON FOTOS FORMATO INICIO 1) ================= */
        <ActivitiesCalendar
          activities={activities}
          showSplitViewToggle={true}
          onToggleSplitView={() => toggleExpanded(false)}
        />
      ) : (
        /* ================= SPLIT VIEW: MINI-CALENDAR + FICHAS ================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Interactive Mini Calendar & Month Highlights */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            <div className="bg-white rounded-2xl border border-[#EDE4D7] shadow-xs p-5 space-y-4">
              
              {/* Calendar Month Header with "Ampliar" Button */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-base font-bold font-serif text-[#26201D] block">
                    {MONTH_NAMES[currentMonth]} {currentYear}
                  </span>
                  <span className="text-[11px] text-[#521849] font-semibold">
                    {Array.from(monthActivitiesMap.values()).reduce((acc: number, list: Activity[]) => acc + list.length, 0)} eventos este mes
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1.5 rounded-lg border border-[#EDE4D7] hover:bg-[#F6F1EA] text-[#574B45] cursor-pointer"
                    title="Mes anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleGoToToday}
                    className="px-2 py-1 rounded-lg border border-[#EDE4D7] bg-[#FAF8F5] hover:bg-[#F6F1EA] text-[11px] font-bold text-[#521849] cursor-pointer"
                    title="Mes actual"
                  >
                    Hoy
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1.5 rounded-lg border border-[#EDE4D7] hover:bg-[#F6F1EA] text-[#574B45] cursor-pointer"
                    title="Mes siguiente"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {/* Button 'Ampliar' on mini-calendar */}
                  <button
                    id="btn-expand-calendar-mini"
                    type="button"
                    onClick={() => toggleExpanded(true)}
                    className="ml-1 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#EDE4D7] bg-[#FAF8F5] hover:bg-[#F6F1EA] text-[11px] font-bold text-[#521849] cursor-pointer transition-all shadow-2xs hover:border-[#521849]/30"
                    title="Ampliar calendario y ocultar fichas"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Ampliar</span>
                  </button>
                </div>
              </div>

              {/* Days grid */}
              <div className="rounded-xl border border-[#EDE4D7] overflow-hidden bg-[#FAF8F5]">
                <div className="grid grid-cols-7 bg-[#F6F1EA] text-center font-bold text-[11px] text-[#574B45] py-1.5 border-b border-[#EDE4D7]">
                  {WEEKDAY_SHORT.map((w, idx) => (
                    <div key={idx}>{w}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-px bg-[#EDE4D7] p-px">
                  {calendarDays.map((cell, idx) => {
                    const hasEvents = cell.activities.length > 0;
                    const isSelected = cell.isCurrentMonth && selectedDay === cell.dayNumber;
                    const isToday = isCurrentMonthActive && cell.isCurrentMonth && cell.dayNumber === today.getDate();

                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={!cell.isCurrentMonth}
                        onClick={() => {
                          if (cell.isCurrentMonth) {
                            setSelectedDay(isSelected ? null : cell.dayNumber);
                          }
                        }}
                        className={`h-11 sm:h-12 p-1 flex flex-col items-center justify-between transition-all relative ${
                          cell.isCurrentMonth ? 'bg-white' : 'bg-[#FAF8F5] opacity-30 cursor-default'
                        } ${
                          hasEvents && cell.isCurrentMonth ? 'cursor-pointer hover:bg-[#FDFBFA]' : ''
                        } ${
                          isSelected ? 'ring-2 ring-[#521849] bg-[#F6EDF4] font-bold z-10' : ''
                        }`}
                      >
                        <span
                          className={`text-xs w-5 h-5 flex items-center justify-center rounded-full ${
                            isToday
                              ? 'bg-[#521849] text-white font-bold'
                              : isSelected
                              ? 'bg-[#521849] text-white'
                              : 'text-[#26201D]'
                          }`}
                        >
                          {cell.dayNumber}
                        </span>

                        {/* Event dots */}
                        {hasEvents && cell.isCurrentMonth && (
                          <div className="flex items-center gap-0.5 mt-0.5">
                            {cell.activities.slice(0, 3).map((act) => (
                              <span
                                key={act.id}
                                className={`w-1.5 h-1.5 rounded-full ${
                                  act.type === 'cata'
                                    ? 'bg-[#521849]'
                                    : act.type === 'curso'
                                    ? 'bg-[#C96043]'
                                    : 'bg-[#4D6233]'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected day indicator / Reset filter */}
              {selectedDay !== null && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F6EDF4] border border-[#521849]/20 text-xs">
                  <div className="flex items-center gap-2">
                    <CalendarCheck className="w-4 h-4 text-[#521849]" />
                    <span className="font-semibold text-[#26201D]">
                      Día {selectedDay} de {MONTH_NAMES[currentMonth]}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedDay(null)}
                    className="text-[11px] font-bold text-[#521849] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Ver todas</span>
                  </button>
                </div>
              )}

              {/* Legend & quick expand link */}
              <div className="flex items-center justify-between text-[11px] text-[#574B45] pt-2 border-t border-[#EDE4D7]">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#521849]" />
                    Catas
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#C96043]" />
                    Cursos
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#4D6233]" />
                    Viajes
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => toggleExpanded(true)}
                  className="font-bold text-[#521849] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>Ampliar</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Activities Grid (Hidden when isExpanded is true) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Filter tabs and counter */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#EDE4D7]">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    filterType === 'all'
                      ? 'bg-[#521849] text-white shadow-2xs'
                      : 'bg-[#F6F1EA] text-[#574B45] hover:bg-[#EDE4D7]'
                  }`}
                >
                  Todas
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('cata')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    filterType === 'cata'
                      ? 'bg-[#521849] text-white shadow-2xs'
                      : 'bg-[#F6F1EA] text-[#574B45] hover:bg-[#EDE4D7]'
                  }`}
                >
                  <Wine className="w-3.5 h-3.5" />
                  <span>Catas</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('curso')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    filterType === 'curso'
                      ? 'bg-[#C96043] text-white shadow-2xs'
                      : 'bg-[#F6F1EA] text-[#574B45] hover:bg-[#EDE4D7]'
                  }`}
                >
                  <ChefHat className="w-3.5 h-3.5" />
                  <span>Cursos</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('viaje')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    filterType === 'viaje'
                      ? 'bg-[#4D6233] text-white shadow-2xs'
                      : 'bg-[#F6F1EA] text-[#574B45] hover:bg-[#EDE4D7]'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Viajes</span>
                </button>
              </div>

              <span className="text-xs text-[#574B45] font-medium">
                {displayedActivities.length} {displayedActivities.length === 1 ? 'actividad' : 'actividades'}
              </span>
            </div>

            {/* Cards Grid */}
            {displayedActivities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                {displayedActivities.map((act) => (
                  <ActivityCard key={act.id} activity={act} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl border border-[#EDE4D7] space-y-3">
                <CalendarIcon className="w-10 h-10 text-[#DFD3C2] mx-auto" />
                <p className="text-sm font-semibold text-[#26201D]">
                  No hay actividades para los filtros seleccionados.
                </p>
                {selectedDay !== null && (
                  <button
                    type="button"
                    onClick={() => setSelectedDay(null)}
                    className="px-4 py-2 rounded-xl bg-[#521849] text-white text-xs font-semibold cursor-pointer"
                  >
                    Ver todas las fechas
                  </button>
                )}
              </div>
            )}
          </div>

        </div>
      )}
    </section>
  );
};
