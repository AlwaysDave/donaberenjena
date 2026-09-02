import React from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  XCircle, 
  Sparkles,
  Info
} from 'lucide-react';

export type MetricBadgeState = 'real' | 'demo' | 'unconfigured' | 'nodata' | 'error' | 'configured';

interface MetricStatusBadgeProps {
  state: MetricBadgeState;
  label?: string;
  source?: string;
  updatedAt?: string;
  notes?: string;
  className?: string;
}

export const MetricStatusBadge: React.FC<MetricStatusBadgeProps> = ({
  state,
  label,
  source,
  updatedAt,
  notes,
  className = ''
}) => {
  const getBadgeConfig = () => {
    switch (state) {
      case 'real':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
          defaultLabel: 'Dato Real',
          icon: CheckCircle2
        };
      case 'demo':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500',
          defaultLabel: 'Modo Demo',
          icon: Sparkles
        };
      case 'configured':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          dot: 'bg-blue-500',
          defaultLabel: 'Configurado',
          icon: CheckCircle2
        };
      case 'unconfigured':
        return {
          bg: 'bg-stone-100 text-stone-600 border-stone-200',
          dot: 'bg-stone-400',
          defaultLabel: 'Sin configurar',
          icon: HelpCircle
        };
      case 'nodata':
        return {
          bg: 'bg-slate-50 text-slate-600 border-slate-200',
          dot: 'bg-slate-400',
          defaultLabel: 'Sin datos',
          icon: Info
        };
      case 'error':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          dot: 'bg-rose-500',
          defaultLabel: 'Error de conexión',
          icon: XCircle
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;
  const displayLabel = label || config.defaultLabel;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-medium ${config.bg} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span className="truncate">{displayLabel}</span>
      {source && (
        <span className="opacity-70 text-[10px] hidden sm:inline">({source})</span>
      )}
    </div>
  );
};
