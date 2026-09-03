import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Participant } from '../../types';
import { 
  CheckCircle2, 
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
  AlertCircle,
  Clock,
  CheckCheck,
  X,
  ArrowLeft
} from 'lucide-react';
import { sortActivitiesAscending } from '../../utils/dateUtils';

interface QuickCheckInProps {
  initialActivityId?: string;
  onClose?: () => void;
}

export const QuickCheckIn: React.FC<QuickCheckInProps> = ({ initialActivityId, onClose }) => {
  const { activities, participants, updateParticipant, addManualParticipant, executeParticipantTransition, closeActivityAttendance } = useData();

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
  const [isClosingAttendance, setIsClosingAttendance] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

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

  const checkedInCount = activityParticipants.filter(p => p.status === 'asistio').length;
  const pendingCheckInCount = activityParticipants.filter(p => p.status === 'pendiente_pago' || p.status === 'pagada' || (p.status as string) === 'confirmada').length;

  // Handle Check-in / Toggle status between Asistió and No asistió (Cancelado injustificado)
  const handleToggleAttendance = async (p: Participant) => {
    if (p.status === 'asistio') {
      // Toggle from Asistió -> No asistió
      const res = await executeParticipantTransition({
        participantId: p.id,
        activityId: p.activityId,
        targetStatus: 'cancelada',
        actor: 'Control de Puerta',
        cancellationData: {
          reason: 'No ha asistido a la actividad',
          justified: false,
          kind: 'no_presentado'
        }
      });

      if (!res.success) {
        alert(res.error || 'No se pudo actualizar el estado.');
      } else {
        setActionFeedback(`${p.fullName} marcado como "No asistió".`);
        setTimeout(() => setActionFeedback(null), 2500);
      }
    } else {
      // Toggle from Initial / Cancelada -> Asistió
      const res = await executeParticipantTransition({
        participantId: p.id,
        activityId: p.activityId,
        targetStatus: 'asistio',
        actor: 'Control de Puerta'
      });

      if (!res.success) {
        alert(res.error || 'No se pudo registrar la asistencia.');
      } else {
        setActionFeedback(`¡${p.fullName} marcado como "Asistió"!`);
        setTimeout(() => setActionFeedback(null), 2500);
      }
    }
  };

  // Close attendance for all remaining pending attendees
  const handleCloseAttendance = async () => {
    if (!currentActivity) return;
    if (pendingCheckInCount === 0) {
      alert('No hay participantes pendientes de check-in.');
      return;
    }

    const confirmed = window.confirm(
      `¿Deseas cerrar el control de asistencia para "${currentActivity.title}"?\n\nLos ${pendingCheckInCount} participante(s) pendientes pasarán a "Cancelada (No presentado)". Esta acción no altera el aforo ocupado.`
    );
    if (!confirmed) return;

    setIsClosingAttendance(true);
    const res = await closeActivityAttendance(currentActivity.id, 'Control de Puerta');
    setIsClosingAttendance(false);

    if (res.success) {
      setActionFeedback(`Control cerrado: ${res.affectedCount} participante(s) marcados como no presentados.`);
      setTimeout(() => setActionFeedback(null), 3500);
    } else {
      alert(res.error || 'Error al cerrar el control de asistencia.');
    }
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

    const priceMember = currentActivity.priceMember ?? 20;
    const priceNonMember = currentActivity.priceNonMember ?? 25;
    const unitPrice = walkInIsMember ? priceMember : priceNonMember;
    const totalAmount = unitPrice * walkInSpots;

    await addManualParticipant({
      activityId: currentActivity.id,
      activityTitle: currentActivity.title,
      activityDate: currentActivity.date,
      activityType: currentActivity.type,
      fullName: walkInName.trim(),
      email: walkInEmail.trim() || '',
      phone: walkInPhone.trim() || '',
      spotsCount: walkInSpots,
      isMember: walkInIsMember,
      status: 'asistio',
      attendedAt: new Date().toISOString(),
      attendedBy: 'Control de Puerta (In Situ)',
      totalAmount,
      paidAmount: totalAmount,
      paymentMethod: 'efectivo',
      groupId: `grp-walkin-${Date.now()}`
    });

    setWalkInName('');
    setWalkInEmail('');
    setWalkInPhone('');
    setWalkInIsMember(false);
    setWalkInSpots(1);
    setShowAddModal(false);
    setActionFeedback('Asistente registrado en puerta.');
    setTimeout(() => setActionFeedback(null), 2500);
  };

  return (
    <div className="space-y-4">
      {/* Optional top return bar when rendered inside modal/subview */}
      {onClose && (
        <div className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-[#EDE4D7] shadow-2xs">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#FCFAF7] hover:bg-[#F6F1EA] text-[#521849] border border-[#EDE4D7] text-xs font-bold transition-all cursor-pointer min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Actividades</span>
          </button>
          <span className="text-xs font-bold text-[#574B45] truncate max-w-[200px] sm:max-w-xs">
            {currentActivity?.title || 'Check-in en Puerta'}
          </span>
        </div>
      )}

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

          {/* Quick Stats Pill & Actions */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-end">
            <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-700" />
              <div className="text-xs">
                <span className="font-bold text-sm font-mono text-emerald-800">{checkedInCount}</span>
                <span className="text-emerald-700"> / {activityParticipants.length} en sala</span>
              </div>
            </div>

            {pendingCheckInCount > 0 && (
              <button
                type="button"
                onClick={handleCloseAttendance}
                disabled={isClosingAttendance}
                className="px-3 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Cierra el control marcando a los no presentados como cancelados"
              >
                <CheckCheck className="w-3.5 h-3.5 text-amber-800" />
                <span>Cerrar control ({pendingCheckInCount})</span>
              </button>
            )}

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

        {/* Action feedback toast/banner */}
        {actionFeedback && (
          <div className="p-2.5 rounded-xl bg-emerald-100/80 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
        )}

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
            const isAttended = p.status === 'asistio';
            const isCancelled = p.status === 'cancelada';
            const isEditing = editingParticipantId === p.id;

            return (
              <div 
                key={p.id}
                className={`bg-white rounded-2xl border transition-all p-3.5 sm:p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isAttended 
                    ? 'border-emerald-200 bg-emerald-50/30' 
                    : isCancelled
                    ? 'border-stone-200 bg-stone-50/60 opacity-60'
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
                    <div className="flex items-center gap-2 group flex-wrap">
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

                      {p.status === 'asistio' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                          Asistió
                        </span>
                      )}
                      {p.status === 'cancelada' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-semibold">
                          No Asistió
                        </span>
                      )}
                      {p.status === 'pendiente_pago' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
                          Pendiente Pago
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

                {/* Attendance Single / Toggle Button (Harmonized with Doña Berenjena visual style) */}
                <div className="shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#EDE4D7]/60 flex items-center justify-end">
                  {isAttended ? (
                    /* State: Asistió (predominantly deep olive-green with a warm wine-red switch strip on the right) */
                    <button
                      type="button"
                      onClick={() => handleToggleAttendance(p)}
                      className="group h-[44px] w-full sm:w-[172px] rounded-xl overflow-hidden shadow-xs border border-[#2E5A36] flex items-stretch cursor-pointer active:scale-[0.98] transition-all select-none"
                      title="Asistió — Pulsa para cambiar a No Asistió"
                    >
                      <div className="flex-1 bg-[#2E5A36] group-hover:bg-[#254B2D] text-white font-bold text-xs flex items-center justify-center gap-1.5 px-3 transition-colors">
                        <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                        <span className="tracking-wide">Asistió</span>
                      </div>
                      <div 
                        className="w-5.5 bg-[#681C26] group-hover:bg-[#54141E] border-l border-white/20 flex items-center justify-center transition-colors shrink-0" 
                        title="Cambiar a No Asistió"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-200/90" />
                      </div>
                    </button>
                  ) : isCancelled ? (
                    /* State: No Asistió (predominantly warm wine-red with a deep olive-green switch strip on the left) */
                    <button
                      type="button"
                      onClick={() => handleToggleAttendance(p)}
                      className="group h-[44px] w-full sm:w-[172px] rounded-xl overflow-hidden shadow-xs border border-[#681C26] flex items-stretch cursor-pointer active:scale-[0.98] transition-all select-none"
                      title="No Asistió — Pulsa para cambiar a Asistió"
                    >
                      <div 
                        className="w-5.5 bg-[#2E5A36] group-hover:bg-[#254B2D] border-r border-white/20 flex items-center justify-center transition-colors shrink-0" 
                        title="Cambiar a Asistió"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-200/90" />
                      </div>
                      <div className="flex-1 bg-[#681C26] group-hover:bg-[#54141E] text-white font-bold text-xs flex items-center justify-center gap-1.5 px-3 transition-colors">
                        <X className="w-4 h-4 text-rose-300 shrink-0" />
                        <span className="tracking-wide">No Asistió</span>
                      </div>
                    </button>
                  ) : (
                    /* Initial State: Marcar asistencia */
                    <button
                      type="button"
                      onClick={() => handleToggleAttendance(p)}
                      className="group h-[44px] w-full sm:w-[172px] px-3.5 rounded-xl font-semibold text-xs bg-[#FCFAF7] hover:bg-[#F6F1EA] text-[#3D3430] hover:text-[#521849] border border-[#EDE4D7] hover:border-[#521849]/40 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.98] select-none"
                      title="Marcar asistencia"
                    >
                      <div className="w-4 h-4 rounded-full border border-[#8C7E77] group-hover:border-[#521849] flex items-center justify-center transition-colors">
                        <div className="w-1.5 h-1.5 rounded-full bg-transparent group-hover:bg-[#521849] transition-colors" />
                      </div>
                      <span className="tracking-wide">Marcar asistencia</span>
                    </button>
                  )}
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
