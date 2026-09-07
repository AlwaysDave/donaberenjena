import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Participant } from '../../types';
import { 
  CheckCircle2, 
  UserCheck, 
  Calendar, 
  Search, 
  Phone, 
  Mail, 
  Clock,
  XCircle,
  ArrowLeft
} from 'lucide-react';
import { sortActivitiesAscending } from '../../utils/dateUtils';
import { canResolveAttendance } from '../../services/participantTransitions';

interface QuickCheckInProps {
  initialActivityId?: string;
  onClose?: () => void;
}

export const QuickCheckIn: React.FC<QuickCheckInProps> = ({ initialActivityId, onClose }) => {
  const { activities, participants, executeParticipantTransition } = useData();

  const sortedActivities = useMemo(() => {
    return sortActivitiesAscending(activities);
  }, [activities]);

  const [selectedActivityId, setSelectedActivityId] = useState<string>(
    initialActivityId || (sortedActivities[0]?.id || '')
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [transitioningId, setTransitioningId] = useState<string | null>(null);

  const currentActivity = activities.find(a => a.id === selectedActivityId);
  const attendanceResolution = canResolveAttendance(currentActivity);
  const canResolve = attendanceResolution.allowed;

  const activityParticipants = useMemo(() => {
    if (!selectedActivityId) return [];
    return participants.filter(p => p.activityId === selectedActivityId);
  }, [participants, selectedActivityId]);

  const regularParticipants = useMemo(() => {
    return activityParticipants.filter(p => p.status !== 'lista_de_espera');
  }, [activityParticipants]);

  const waitlistParticipants = useMemo(() => {
    return activityParticipants.filter(p => p.status === 'lista_de_espera');
  }, [activityParticipants]);

  const filteredRegularParticipants = useMemo(() => {
    const q = (searchQuery || '').toLowerCase().trim();
    if (!q) return regularParticipants;
    return regularParticipants.filter(p => 
      (p.fullName || '').toLowerCase().includes(q) ||
      (p.email || '').toLowerCase().includes(q) ||
      (p.phone || '').toLowerCase().includes(q) ||
      (p.membershipNumber || '').toLowerCase().includes(q)
    );
  }, [regularParticipants, searchQuery]);

  const filteredWaitlist = useMemo(() => {
    const q = (searchQuery || '').toLowerCase().trim();
    if (!q) return waitlistParticipants;
    return waitlistParticipants.filter(p => 
      (p.fullName || '').toLowerCase().includes(q) ||
      (p.email || '').toLowerCase().includes(q) ||
      (p.phone || '').toLowerCase().includes(q)
    );
  }, [waitlistParticipants, searchQuery]);

  const checkedInCount = activityParticipants.filter(p => p.status === 'asistio').length;
  const pendingCheckInCount = activityParticipants.filter(p => p.status === 'pendiente_pago' || p.status === 'pagada').length;
  const cancelledCount = activityParticipants.filter(p => p.status === 'cancelada').length;
  const waitlistCount = waitlistParticipants.length;

  // Mark as Asistió (from pendiente_pago or pagada)
  const handleMarkAttended = async (p: Participant) => {
    const check = canResolveAttendance(currentActivity);
    if (!check.allowed) {
      alert(check.error || 'No se puede registrar asistencia en esta actividad.');
      return;
    }

    setTransitioningId(p.id);
    try {
      const res = await executeParticipantTransition({
        participantId: p.id,
        activityId: p.activityId,
        targetStatus: 'asistio',
        actor: 'Control de Puerta'
      });

      if (!res.success) {
        alert(res.error || 'No se pudo registrar la asistencia.');
      } else {
        setActionFeedback(`¡${p.fullName} registrado como Asistió!`);
        setTimeout(() => setActionFeedback(null), 2500);
      }
    } finally {
      setTransitioningId(null);
    }
  };

  // Mark as No presentado (Cancelada por no presentado)
  const handleMarkNoShow = async (p: Participant) => {
    const check = canResolveAttendance(currentActivity);
    if (!check.allowed) {
      alert(check.error || 'No se puede marcar como no presentado en esta actividad.');
      return;
    }

    const confirmed = window.confirm(`¿Marcar a ${p.fullName} como "No presentado"?`);
    if (!confirmed) return;

    setTransitioningId(p.id);
    try {
      const res = await executeParticipantTransition({
        participantId: p.id,
        activityId: p.activityId,
        targetStatus: 'cancelada',
        actor: 'Control de Puerta',
        cancellationData: {
          reason: 'No presentado',
          justified: false,
          kind: 'no_presentado'
        }
      });

      if (!res.success) {
        alert(res.error || 'No se pudo registrar como no presentado.');
      } else {
        setActionFeedback(`${p.fullName} marcado como "No presentado".`);
        setTimeout(() => setActionFeedback(null), 2500);
      }
    } finally {
      setTransitioningId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header & Activity Selector */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E6E1DF] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 -ml-2 rounded-xl text-[#574B45] hover:text-[#26201D] hover:bg-[#F8F6F5] transition-colors"
                title="Volver"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[#26201D]">Control de Puerta (Check-in)</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#521849]/10 text-[#521849]">
                  Vista de Puerta
                </span>
              </div>
              <p className="text-xs text-[#574B45] mt-0.5">
                Acceso rápido in situ para registrar asistencia o no presentados durante la actividad.
              </p>
            </div>
          </div>

          <div className="w-full md:w-80">
            <label className="block text-xs font-semibold text-[#574B45] mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#521849]" />
              <span>Actividad Seleccionada</span>
            </label>
            <select
              value={selectedActivityId}
              onChange={(e) => {
                setSelectedActivityId(e.target.value);
                setSearchQuery('');
              }}
              className="w-full text-sm font-medium px-3.5 py-2.5 bg-[#F8F6F5] border border-[#E6E1DF] rounded-xl text-[#26201D] focus:outline-none focus:ring-2 focus:ring-[#521849]/30"
            >
              {sortedActivities.map(act => (
                <option key={act.id} value={act.id}>
                  {new Date(act.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} — {act.title} ({act.time || 'Sin hora'}{act.endTime ? ` - ${act.endTime}` : ''})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Activity Details & Timing Status */}
        {currentActivity && (
          <div className="mt-5 pt-5 border-t border-[#E6E1DF]/80">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[#26201D]">{currentActivity.title}</h3>
                  {currentActivity.status === 'celebrada' && (
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-stone-100 text-stone-700">
                      Celebrada
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-[#574B45] mt-1">
                  <span className="flex items-center gap-1 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-[#521849]" />
                    {new Date(currentActivity.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-[#521849]" />
                    {currentActivity.time || 'Hora no especificada'}
                    {currentActivity.endTime ? ` a ${currentActivity.endTime}` : ''}
                  </span>
                  <span>
                    Aforo: <strong>{currentActivity.bookedSpots || 0}</strong> / {currentActivity.totalSpots} plazas
                  </span>
                </div>
              </div>

              {/* Resolution Status Badge */}
              <div className="flex items-center gap-2">
                {canResolve ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>Control de Asistencia Abierto</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 border border-stone-300 text-stone-700 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-stone-600" />
                    <span>Actividad Cerrada (Solo consulta)</span>
                  </span>
                )}
              </div>
            </div>

            {/* Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <p className="text-[11px] font-semibold text-emerald-800">Asistieron</p>
                <p className="text-xl font-bold text-emerald-950 mt-0.5">{checkedInCount}</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200">
                <p className="text-[11px] font-semibold text-amber-800">Pendientes Puerta</p>
                <p className="text-xl font-bold text-amber-950 mt-0.5">{pendingCheckInCount}</p>
              </div>
              <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200">
                <p className="text-[11px] font-semibold text-rose-800">Canceladas / No presentados</p>
                <p className="text-xl font-bold text-rose-950 mt-0.5">{cancelledCount}</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200">
                <p className="text-[11px] font-semibold text-purple-800">Lista de Espera</p>
                <p className="text-xl font-bold text-purple-950 mt-0.5">{waitlistCount}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action feedback message */}
      {actionFeedback && (
        <div className="p-3.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-sm font-semibold flex items-center justify-between animate-fadeIn">
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Main List */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E6E1DF] shadow-sm space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#574B45] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, socio, email o teléfono..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm pl-9 pr-4 py-2.5 bg-[#F8F6F5] border border-[#E6E1DF] rounded-xl text-[#26201D] placeholder-[#574B45]/60 focus:outline-none focus:ring-2 focus:ring-[#521849]/30"
          />
        </div>

        {/* Warning if concluded */}
        {!canResolve && (
          <div className="p-3.5 rounded-xl bg-stone-100 border border-stone-300 text-stone-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-stone-600 shrink-0" />
            <span>
              {attendanceResolution.error || 'La actividad está celebrada. La hoja de asistencia está cerrada para modificaciones in situ.'}
            </span>
          </div>
        )}

        {/* Attendees List */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-[#574B45] px-1">
            <span>Inscripciones Registradas ({filteredRegularParticipants.length})</span>
          </div>

          {filteredRegularParticipants.length === 0 ? (
            <div className="py-10 text-center text-sm text-[#574B45]">
              No se encontraron participantes registrados para esta actividad.
            </div>
          ) : (
            filteredRegularParticipants.map(p => {
              const isAttended = p.status === 'asistio';
              const isCancelled = p.status === 'cancelada';
              const isNoShow = isCancelled && p.cancellationKind === 'no_presentado';
              const isActionable = (p.status === 'pendiente_pago' || p.status === 'pagada') && canResolve;
              const isTransitioning = transitioningId === p.id;

              return (
                <div
                  key={p.id}
                  className={`p-4 rounded-xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isAttended
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : isCancelled
                      ? 'bg-stone-50/70 border-stone-200 opacity-85'
                      : 'bg-[#F8F6F5] border-[#E6E1DF] hover:border-[#521849]/30'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-[#26201D]">{p.fullName}</span>
                      {p.isMember && (
                        <span className="px-2 py-0.5 rounded-md bg-purple-100 text-[#521849] font-bold text-[10px]">
                          Socio {p.membershipNumber ? `#${p.membershipNumber}` : ''}
                        </span>
                      )}
                      {p.turn && (
                        <span className="px-2 py-0.5 rounded-md bg-stone-200 text-[#26201D] text-[10px] font-medium">
                          {p.turn}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#574B45]">
                      {p.phone && (
                        <a href={`tel:${p.phone}`} className="flex items-center gap-1 hover:text-[#26201D]">
                          <Phone className="w-3 h-3 text-[#521849]" />
                          <span>{p.phone}</span>
                        </a>
                      )}
                      {p.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-[#574B45]" />
                          <span>{p.email}</span>
                        </span>
                      )}
                      <span className="text-[11px] font-semibold text-[#26201D]">
                        Importe: {p.totalAmount} € {p.paidAmount ? `(Cobrado: ${p.paidAmount} €)` : ''}
                      </span>
                    </div>

                    {/* Meta info for attended or cancelled */}
                    {isAttended && p.attendedAt && (
                      <p className="text-[10px] text-emerald-800 font-medium">
                        ✓ Acceso registrado: {new Date(p.attendedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} ({p.attendedBy || 'Puerta'})
                      </p>
                    )}
                    {isCancelled && (
                      <p className="text-[10px] text-rose-800 font-medium">
                        ✗ {isNoShow ? 'No presentado' : 'Cancelada'}: {p.cancellationReason || 'Cancelada'}
                      </p>
                    )}
                  </div>

                  {/* Actions / Status badge */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {/* Status Pill */}
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      isAttended
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : isNoShow
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : isCancelled
                        ? 'bg-rose-100 text-rose-900 border border-rose-300'
                        : p.status === 'pagada'
                        ? 'bg-blue-100 text-blue-900 border border-blue-200'
                        : 'bg-amber-100 text-amber-900 border border-amber-200'
                    }`}>
                      {isAttended
                        ? 'Asistió'
                        : isNoShow
                        ? 'No presentado'
                        : isCancelled
                        ? 'Cancelada'
                        : p.status === 'pagada'
                        ? 'Pagada (Pendiente Puerta)'
                        : 'Pendiente de pago'}
                    </span>

                    {/* Only Asistió and No Presentado for pendiente_pago or pagada during check-in */}
                    {isActionable && (
                      <div className="flex items-center gap-1.5 ml-1">
                        <button
                          type="button"
                          disabled={isTransitioning}
                          onClick={() => handleMarkAttended(p)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors disabled:opacity-50"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Asistió</span>
                        </button>

                        <button
                          type="button"
                          disabled={isTransitioning}
                          onClick={() => handleMarkNoShow(p)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 font-semibold text-xs border border-rose-300 transition-colors disabled:opacity-50"
                          title="Marcar como No presentado"
                        >
                          <XCircle className="w-3.5 h-3.5 text-rose-700" />
                          <span>No presentado</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Informative Waitlist View */}
        {filteredWaitlist.length > 0 && (
          <div className="mt-6 pt-5 border-t border-[#E6E1DF] space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wide flex items-center gap-1.5">
                <span>Lista de Espera ({filteredWaitlist.length})</span>
                <span className="text-[10px] lowercase font-normal text-purple-700">(solo consulta informativa)</span>
              </h4>
            </div>

            <div className="space-y-2">
              {filteredWaitlist.map((w, idx) => (
                <div
                  key={w.id}
                  className="p-3 rounded-xl bg-purple-50/50 border border-purple-100 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-purple-200 text-purple-800 font-bold text-[10px] flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-[#26201D]">{w.fullName}</span>
                    {w.isMember && (
                      <span className="px-1.5 py-0.5 rounded bg-purple-100 text-[#521849] font-semibold text-[10px]">
                        Socio
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[#574B45]">
                    {w.phone && <span>{w.phone}</span>}
                    <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-semibold text-[10px]">
                      Lista de Espera
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
