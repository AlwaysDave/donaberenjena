import React from 'react';
import { ActivityStatus } from '../../types';
import { Calendar, CheckCircle2, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: ActivityStatus;
  totalSpots?: number;
  bookedSpots?: number;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  totalSpots,
  bookedSpots,
  className = ''
}) => {
  if (status === 'celebrada') {
    return (
      <span
        id="badge-status-celebrada"
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#2C2420]/80 text-[#F6F1EA] backdrop-blur-xs border border-[#423730] ${className}`}
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-[#DFD3C2]" />
        <span>Celebrada</span>
      </span>
    );
  }

  const remaining = totalSpots !== undefined && bookedSpots !== undefined ? totalSpots - bookedSpots : null;
  const isAlmostFull = remaining !== null && remaining <= 5 && remaining > 0;
  const isSoldOut = remaining !== null && remaining <= 0;

  if (isSoldOut) {
    return (
      <span
        id="badge-status-completo"
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#5C1D24] text-white backdrop-blur-xs shadow-xs ${className}`}
      >
        <AlertCircle className="w-3.5 h-3.5" />
        <span>Aforo Completo</span>
      </span>
    );
  }

  if (isAlmostFull) {
    return (
      <span
        id="badge-status-ultimas-plazas"
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#B84E33] text-white shadow-xs animate-pulse ${className}`}
      >
        <AlertCircle className="w-3.5 h-3.5" />
        <span>¡Últimas {remaining} plazas!</span>
      </span>
    );
  }

  return (
    <span
      id="badge-status-proxima"
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#521849] text-white backdrop-blur-xs shadow-xs ${className}`}
    >
      <Calendar className="w-3.5 h-3.5 text-[#F6EDF4]" />
      <span>Próxima Actividad</span>
    </span>
  );
};
