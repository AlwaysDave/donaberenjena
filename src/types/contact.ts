export interface ContactSubjectOption {
  value: string;
  label: string;
  badgeClass: string;
  description?: string;
}

export const CONTACT_SUBJECTS: ContactSubjectOption[] = [
  { 
    value: 'consulta_general', 
    label: 'Información general de actividades',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
    description: 'Dudas generales sobre el funcionamiento y calendario'
  },
  { 
    value: 'hazte_socio', 
    label: 'Solicitud de alta como socio',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    description: 'Peticiones de inscripción y cuotas de socio'
  },
  { 
    value: 'propuesta_cata', 
    label: 'Propuesta de cata para bodega/productor',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
    description: 'Presentación de vinos y bodegas para catas'
  },
  { 
    value: 'alquiler_espacio', 
    label: 'Alquiler de espacio / Eventos privados',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    description: 'Uso de la sede para catas o eventos corporativos'
  },
  { 
    value: 'duda_reserva', 
    label: 'Duda sobre una reserva',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
    description: 'Consultas sobre pagos o plazas reservadas'
  },
  { 
    value: 'prensa', 
    label: 'Prensa / Comunicación / Colaboración',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    description: 'Medios de comunicación y patrocinios'
  },
  { 
    value: 'otro', 
    label: 'Otro motivo de consulta',
    badgeClass: 'bg-stone-100 text-stone-800 border-stone-200',
    description: 'Cualquier otra consulta'
  }
];

export function getContactSubjectLabel(value: string): string {
  const found = CONTACT_SUBJECTS.find(s => s.value === value);
  return found ? found.label : value;
}

export function getContactSubjectBadge(value: string): { label: string; color: string } {
  const found = CONTACT_SUBJECTS.find(s => s.value === value);
  if (found) {
    return { label: found.label, color: found.badgeClass };
  }
  return { label: value, color: 'bg-stone-100 text-stone-800 border-stone-200' };
}
