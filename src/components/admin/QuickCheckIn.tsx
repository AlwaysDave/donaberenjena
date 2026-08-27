import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Participant } from '../../types';
import { 
  CheckCircle2, 
  XCircle, 
  UserCheck, 
  Calendar, 
  Search, 
  Edit3, 
  Check, 
  Plus, 
  UserPlus, 
  Phone, 
  Mail, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { sortActivitiesAscending } from '../../utils/dateUtils';

interface QuickCheckInProps {
  initialActivityId?: string;
}

export const QuickCheckIn: React.FC<QuickCheckInProps> = ({ initialActivityId }) => {
  const { activities, participants, updateParticipant, addParticipant } = useData();

  const sortedActivities = useMemo(() => {
    return sortActivitiesAscending(activities);
  }, [activities]);

  const [selectedActivityId, setSelectedActivityId] = useState<string>(
    initialActivityId || (sortedActivities[0]?.id || '')
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null);
  const [inlineName, setInlineName] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Quick Walk-in form state
  const [walkInName, setWalkInName] = useState('');
  const [walkInEmail, setWalkInEmail] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInIsMember, setWalkInIsMember] = useState(false);
  const [walkInSpots, setWalkInSpots] = useState(1);

  const currentActivity = activities.find(a => a.id === selectedActivityId);

  const activityParticipants = useMemo(() => {
    if (!selectedActivityId) return [];
    return participants.filter(p => p.activityId === selectedActivityId);
  }, [participants, selectedActivityId]);

  const filteredParticipants = useMemo(() => {
    const q = (searchQuery || '').toLowerCase().trim();
    if (!q) return activityParticipants;
    return activityParticipants.filter(p => 
      (p.fullName || '').toLowerCase().includes(q) ||
      (p.email || '').toLowerCase().includes(q) ||
      (p.phone || '').toLowerCase().includes(q)
    );
  }, [activityParticipants, searchQuery]);

  const checkedInCount = activityParticipants.filter(p => p.attended === true || p.status === 'asistio').length;
  const totalBooked = activityParticipants.reduce((acc, p) => acc + (p.spotsCount || 1), 0);

  // Toggle Check-in status
  const handleToggleCheckIn = async (p: Participant) => {
    const isAttended = p.attended === true || p.status === 'asistio';
    await updateParticipant(p.id, {
      attended: !isAttended,
      status: !isAttended ? 'asistio' : 'confirmada'
    });
  };

  // Start Inline Name Edit
  const handleStartEditName = (p: Participant) => {
    setEditingParticipantId(p.id);
    setInlineName(p.fullName);
  };

  // Save Inline Name
  const handleSaveInlineName = async (participantId: string) => {
    if (inlineName.trim()) {
      await updateParticipant(participantId, { fullName: inlineName.trim() });
    }
    setEditingParticipantId(null);
  };

  // Add Walk-in attendee in situ
  const handleAddWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInName.trim() || !currentActivity) return;

    const basePrice = currentActivity.priceNonMember || 25;
    const memberPrice = currentActivity.memberPrice ?? (basePrice > 5 ? basePrice - 5 : basePrice);
    const unitPrice = walkInIsMember ? memberPrice : basePrice;
    const totalAmount = unitPrice * walkInSpots;

    await addParticipant({
      activityId: currentActivity.id,
      activityTitle: currentActivity.title,
      activityType: currentActivity.type,
      fullName: walkInName.trim(),
      email: walkInEmail.trim() || undefined,
      phone: walkInPhone.trim() || undefined,
      spotsCount: walkInSpots,
      isMember: walkInIsMember,
      status: 'asistio',
      attended: true,
      totalAmount
    });

    setWalkInName('');
    setWalkInEmail('');
    setWalkInPhone('');
    setWalkInIsMember(false);
    setWalkInSpots(1);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Activity Selector & Check-in KPI bar */}
      <div className="bg-white rounded-2xl border border-[#EDE4D7] p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#574B45] mb-1">
              Seleccionar Actividad para Check-in
            </label>
            <select
              value={selectedActivityId}
              onChange={(e) => setSelectedActivityId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] font-semibold text-xs text-[#26201D] focus:outline-none focus:border-[#521849] focus:bg-white cursor-pointer"
            >
              {sortedActivities.map(act => (
                <option key={act.id} value={act.id}>
                  {act.title} ({new Date(act.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })} {act.time ? `- ${act.time}` : ''}) {act.status === 'celebrada' ? '[Celebrada]' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-2 self-start sm:self-end">
            <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-700" />
              <div className="text-xs">
                <span className="font-bold text-sm font-mono text-emerald-800">{checkedInCount}</span>
                <span className="text-emerald-700"> / {activityParticipants.length} asistentes en sala</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2 rounded-xl bg-[#521849] hover:bg-[#3E1037] text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
              title="Añadir asistente de última hora"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Asistente In Situ</span>
            </button>
          </div>
        </div>

        {/* Search filter for participant list */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#8C7E77] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar asistente por nombre, teléfono o correo..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs focus:outline-none focus:border-[#521849] focus:bg-white"
          />
        </div>
      </div>

      {/* Mobile-Optimized List of Attendee Cards */}
      <div className="space-y-2.5">
        {filteredParticipants.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#EDE4D7] p-8 text-center text-[#8C7E77]">
            <UserCheck className="w-8 h-8 mx-auto mb-2 text-[#EDE4D7]" />
            <p className="font-semibold text-xs text-[#574B45]">No hay asistentes registrados para esta actividad</p>
            <p className="text-[11px] mt-1">Utiliza el botón de "Asistente In Situ" para registrar a alguien en puerta.</p>
          </div>
        ) : (
          filteredParticipants.map((p) => {
            const isAttended = p.attended === true || p.status === 'asistio';
            const isEditing = editingParticipantId === p.id;

            return (
              <div 
                key={p.id}
                className={`bg-white rounded-2xl border transition-all p-3.5 sm:p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isAttended 
                    ? 'border-emerald-200 bg-emerald-50/30' 
                    : 'border-[#EDE4D7]'
                }`}
              >
                {/* Participant Info & Inline Name Editor */}
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 mb-1">
                      <input
                        type="text"
                        autoFocus
                        value={inlineName}
                        onChange={(e) => setInlineName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveInlineName(p.id);
                          if (e.key === 'Escape') setEditingParticipantId(null);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg border-2 border-[#521849] text-sm font-bold text-[#26201D] bg-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveInlineName(p.id)}
                        className="p-2 rounded-lg bg-[#521849] text-white text-xs font-bold cursor-pointer shrink-0"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <h4 
                        onClick={() => handleStartEditName(p)}
                        className="font-bold text-sm sm:text-base font-serif text-[#26201D] cursor-pointer hover:text-[#521849] flex items-center gap-1.5"
                        title="Toca para editar el nombre"
                      >
                        <span>{p.fullName}</span>
                        <Edit3 className="w-3.5 h-3.5 text-[#8C7E77] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h4>
                      {p.isMember ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase tracking-wider">
                          Socio
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-medium">
                          General
                        </span>
                      )}
                    </div>
                  )}

                  {/* Secondary metadata */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#574B45] mt-1">
                    {p.spotsCount > 1 && (
                      <span className="font-bold text-[#521849] bg-[#521849]/10 px-2 py-0.5 rounded-md">
                        {p.spotsCount} plazas
                      </span>
                    )}
                    {p.phone && (
                      <a href={`tel:${p.phone}`} className="flex items-center gap-1 hover:text-[#521849]">
                        <Phone className="w-3 h-3 text-[#8C7E77]" />
                        <span>{p.phone}</span>
                      </a>
                    )}
                    {p.email && (
                      <span className="hidden sm:flex items-center gap-1 text-[#8C7E77]">
                        <Mail className="w-3 h-3" />
                        <span className="truncate max-w-[150px]">{p.email}</span>
                      </span>
                    )}
                    <span>Importe: <strong>{p.totalAmount} €</strong></span>
                  </div>
                </div>

                {/* Big One-Tap Check-In Button (Thumb-friendly ~48px) */}
                <div className="shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#EDE4D7]/60 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => handleToggleCheckIn(p)}
                    className={`w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                      isAttended
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                        : 'bg-[#FCFAF7] hover:bg-[#F6F1EA] text-[#574B45] border border-[#EDE4D7]'
                    }`}
                  >
                    {isAttended ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-white" />
                        <span>¡Asistió!</span>
                      </>
                    ) : (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-[#8C7E77]" />
                        <span>Marcar Asistencia</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: Walk-in participant registration */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#EDE4D7] my-8 animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-[#EDE4D7] mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#521849]/10 text-[#521849]">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-serif text-[#26201D]">
                    Asistente de Última Hora
                  </h3>
                  <p className="text-xs text-[#574B45]">
                    Registro rápido en puerta con asistencia confirmada
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleAddWalkIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#26201D] mb-1">
                  Nombre y Apellidos *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  placeholder="Ej. Carmen Navarro"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs focus:outline-none focus:border-[#521849] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#26201D] mb-1">
                    Teléfono (opcional)
                  </label>
                  <input
                    type="tel"
                    value={walkInPhone}
                    onChange={(e) => setWalkInPhone(e.target.value)}
                    placeholder="600 000 000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs focus:outline-none focus:border-[#521849] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#26201D] mb-1">
                    Nº de Plazas
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={walkInSpots}
                    onChange={(e) => setWalkInSpots(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs focus:outline-none focus:border-[#521849] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#26201D] mb-1">
                  Email (opcional)
                </label>
                <input
                  type="email"
                  value={walkInEmail}
                  onChange={(e) => setWalkInEmail(e.target.value)}
                  placeholder="carmen@ejemplo.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs focus:outline-none focus:border-[#521849] focus:bg-white"
                />
              </div>

              <label className="flex items-center gap-2 p-3 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] cursor-pointer">
                <input
                  type="checkbox"
                  checked={walkInIsMember}
                  onChange={(e) => setWalkInIsMember(e.target.checked)}
                  className="w-4 h-4 rounded text-[#521849] focus:ring-[#521849]"
                />
                <span className="text-xs font-medium text-[#26201D]">
                  Aplicar tarifa de socio
                </span>
              </label>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#EDE4D7]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#EDE4D7] bg-white text-[#574B45] text-xs font-semibold hover:bg-[#F6F1EA] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#521849] hover:bg-[#3E1037] text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  Registrar e Ingresar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
