import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, CataActivity, CursoActivity, ViajeActivity } from '../../types';
import { StatusBadge } from './StatusBadge';
import { Calendar, MapPin, ChefHat, Wine, Compass, ArrowRight, Clock, Users } from 'lucide-react';
import { formatDisplayDate } from '../../utils/dateUtils';

interface ActivityCardProps {
  activity: Activity;
  priority?: boolean;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({ activity }) => {
  const isHeld = activity.status === 'celebrada';
  const availableSpots = Math.max(0, activity.totalSpots - activity.bookedSpots);

  // Type specific badge and icon
  const renderTypeMeta = () => {
    switch (activity.type) {
      case 'cata': {
        const cata = activity as CataActivity;
        return (
          <div className="inline-flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#521849] uppercase tracking-wider">
              <Wine className="w-3.5 h-3.5" />
              <span>Cata de {cata.category}</span>
            </span>
            {cata.shiftName && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#C96043]/10 text-[#C96043] border border-[#C96043]/20">
                {cata.shiftName}
              </span>
            )}
          </div>
        );
      }
      case 'curso': {
        const curso = activity as CursoActivity;
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#C96043] uppercase tracking-wider">
            <ChefHat className="w-3.5 h-3.5" />
            <span>Curso de Cocina</span>
          </span>
        );
      }
      case 'viaje': {
        const viaje = activity as ViajeActivity;
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#4D6233] uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5" />
            <span>Viaje ({viaje.durationDays} días)</span>
          </span>
        );
      }
    }
  };

  const renderSpecificDetail = () => {
    switch (activity.type) {
      case 'cata': {
        const cata = activity as CataActivity;
        const bodegaName = cata.bodegas?.[0]?.name || cata.bodegaProductor?.name;
        if (!bodegaName) return null;
        return (
          <p className="text-xs text-[#574B45] line-clamp-1">
            <strong className="text-[#3D3430]">Bodega / Productor:</strong> {bodegaName}
          </p>
        );
      }
      case 'curso': {
        const curso = activity as CursoActivity;
        if (!curso.chef?.name) return null;
        return (
          <p className="text-xs text-[#574B45] line-clamp-1">
            <strong className="text-[#3D3430]">Chef docente:</strong> {curso.chef.name} {curso.chef.restaurant && `(${curso.chef.restaurant})`}
          </p>
        );
      }
      case 'viaje': {
        const viaje = activity as ViajeActivity;
        return (
          <p className="text-xs text-[#574B45] line-clamp-1">
            <strong className="text-[#3D3430]">Destino:</strong> {viaje.destination}
          </p>
        );
      }
    }
  };

  return (
    <article
      id={`card-activity-${activity.id}`}
      className="group flex flex-col h-full rounded-2xl bg-white border border-[#EDE4D7] overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-[#DFD3C2] hover:-translate-y-0.5"
    >
      {/* Image Container with Status Overlay */}
      <Link to={`/actividad/${activity.id}`} className="relative aspect-16/10 w-full overflow-hidden bg-[#F6F1EA] block">
        <img
          src={activity.images[0] || 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80'}
          alt={activity.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />

        <div className="absolute top-3 left-3 z-10">
          <StatusBadge
            status={activity.status}
            registrationStatus={activity.registrationStatus}
            totalSpots={activity.totalSpots}
            bookedSpots={activity.bookedSpots}
          />
        </div>

        {!isHeld && (
          <div className="absolute bottom-3 right-3 z-10 flex gap-2">
            {activity.priceMember !== activity.priceNonMember ? (
              <>
                <div className="px-2 py-1 rounded-full bg-emerald-100/95 backdrop-blur-xs text-[10px] font-bold text-emerald-800 shadow-xs border border-emerald-200 flex items-center gap-1">
                  Socio: {activity.priceMember}€
                </div>
                <div className="px-2 py-1 rounded-full bg-white/95 backdrop-blur-xs text-[10px] font-bold text-[#521849] shadow-xs border border-white/50 flex items-center gap-1">
                  Gral: {activity.priceNonMember}€
                </div>
              </>
            ) : (
              <div className="px-3 py-1 rounded-full bg-white/95 backdrop-blur-xs text-xs font-bold text-[#521849] shadow-xs">
                {activity.priceNonMember}€
              </div>
            )}
          </div>
        )}
      </Link>

      {/* Card Content Body */}
      <div className="flex flex-col flex-1 p-5 md:p-6 justify-between gap-4">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            {renderTypeMeta()}
            {!isHeld && (
              <span className="text-[11px] text-[#574B45] flex items-center gap-1">
                <Users className="w-3 h-3 text-[#521849]" />
                {availableSpots > 0 ? `${availableSpots} libres` : 'Agotado'}
              </span>
            )}
          </div>

          <h3 className="text-lg md:text-xl font-bold font-serif text-[#26201D] group-hover:text-[#521849] transition-colors line-clamp-2 leading-snug">
            <Link to={`/actividad/${activity.id}`}>
              {activity.title}
            </Link>
          </h3>

          <p className="text-xs md:text-sm text-[#574B45] line-clamp-2 leading-relaxed">
            {activity.subtitle || activity.description}
          </p>

          <div className="pt-2 border-t border-[#F6F1EA] space-y-1.5">
            {renderSpecificDetail()}
            <div className="flex items-center gap-4 text-xs text-[#574B45]">
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#521849]" />
                {formatDisplayDate(activity.date)}
              </span>
              {activity.time && (
                <span className="inline-flex items-center gap-1 hidden sm:inline-flex">
                  <Clock className="w-3.5 h-3.5 text-[#521849]" />
                  {activity.time}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-3 border-t border-[#F6F1EA] flex items-center justify-between">
          <span className="text-xs text-[#574B45] flex items-center gap-1 truncate max-w-[60%]">
            <MapPin className="w-3.5 h-3.5 text-[#521849] shrink-0" />
            <span className="truncate">{activity.location.split('—')[0]}</span>
          </span>

          <Link
            id={`btn-ver-detalle-${activity.id}`}
            to={`/actividad/${activity.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#521849] group-hover:text-[#3E1037] group-hover:translate-x-0.5 transition-all"
          >
            <span>{isHeld ? 'Ver memoria' : 'Ver Actividad'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
};
