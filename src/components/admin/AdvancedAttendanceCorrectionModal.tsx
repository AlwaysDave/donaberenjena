import React, { useState, useMemo, useEffect } from 'react';
import { Activity, Participant, CanonicalParticipantStatus, CancellationKind } from '../../types';
import { doesParticipantOccupySpot } from '../../services/participantTransitions';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  ArrowRight, 
  Calendar, 
  Users, 
  RefreshCw, 
  FileText,
  Info
} from 'lucide-react';

interface AdvancedAttendanceCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant: Participant | null;
  activity: Activity | null;
  onSuccess?: (message: string) => void;
}

export const AdvancedAttendanceCorrectionModal: React.FC<AdvancedAttendanceCorrectionModalProps> = ({
  isOpen,
  onClose,
  participant,
  activity,
  onSuccess
}) => {
  const { executeAdvancedAttendanceCorrection } = useData();
  const { user } = useAuth();

  const [targetStatus, setTargetStatus] = useState<CanonicalParticipantStatus>('asistio');
  const [cancellationKind, setCancellationKind] = useState<CancellationKind>('cancelacion_usuario');
  const [cancellationReason, setCancellationReason] = useState<string>('');
  const [cancellationJustified, setCancellationJustified] = useState<boolean>(false);
  const [refundAmount, setRefundAmount] = useState<string>('');
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [correctionReason, setCorrectionReason] = useState<string>('');

  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize form state when participant changes
  useEffect(() => {
    if (participant) {
      setTargetStatus(participant.status);
      setCancellationKind(participant.cancellationKind || 'cancelacion_usuario');
      setCancellationReason(participant.cancellationReason || '');
      setCancellationJustified(participant.cancellationJustified || false);
      setRefundAmount(participant.cancellationRefund !== undefined ? String(participant.cancellationRefund) : '');
      setPaidAmount(participant.paidAmount !== undefined ? String(participant.paidAmount) : String(participant.totalAmount));
      setCorrectionReason('');
      setShowConfirmation(false);
      setErrorMessage(null);
    }
  }, [participant]);

  // Calculations for spot delta and activity reopening
  const preview = useMemo(() => {
    if (!participant || !activity) return null;

    const beforeOccupies = doesParticipantOccupySpot(participant.status, participant.cancellationKind);
    const afterOccupies = doesParticipantOccupySpot(targetStatus, cancellationKind);
    const spotsDelta = (afterOccupies ? 1 : 0) - (beforeOccupies ? 1 : 0);

    const currentBooked = activity.bookedSpots ?? 0;
    const newBookedSpots = currentBooked + spotsDelta;
    const isExceeding = activity.totalSpots !== undefined && newBookedSpots > activity.totalSpots;
    const isNegative = newBookedSpots < 0;

    const leavesPending = targetStatus === 'pendiente_pago' || targetStatus === 'pagada';
    const willReopen = activity.status === 'celebrada' && leavesPending;

    return {
      beforeOccupies,
      afterOccupies,
      spotsDelta,
      currentBooked,
      newBookedSpots,
      isExceeding,
      isNegative,
      willReopen
    };
  }, [participant, activity, targetStatus, cancellationKind]);

  if (!isOpen || !participant || !activity) {
    return null;
  }

  const handleValidateAndProceed = () => {
    setErrorMessage(null);

    if (!correctionReason.trim()) {
      setErrorMessage('El motivo de la corrección administrativa es estrictamente obligatorio.');
      return;
    }

    if (preview?.isNegative) {
      setErrorMessage('La corrección daría lugar a un aforo ocupado negativo.');
      return;
    }

    if (preview?.isExceeding) {
      setErrorMessage(`El nuevo aforo (${preview.newBookedSpots}) supera el límite máximo (${activity.totalSpots} plazas).`);
      return;
    }

    setShowConfirmation(true);
  };

  const handleExecuteCorrection = async () => {
    if (!preview) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const parsedRefund = refundAmount !== '' ? parseFloat(refundAmount) : undefined;
      const parsedPaid = paidAmount !== '' ? parseFloat(paidAmount) : undefined;

      const actorName = user?.name ? `${user.name} (${user.role})` : user?.email || 'Administración Avanzada';

      const res = await executeAdvancedAttendanceCorrection({
        participantId: participant.id,
        activityId: activity.id,
        targetStatus,
        correctionReason: correctionReason.trim(),
        actor: actorName,
        cancellationData: targetStatus === 'cancelada' ? {
          reason: cancellationReason.trim() || (cancellationKind === 'no_presentado' ? 'No presentado' : 'Cancelación corregida'),
          justified: cancellationKind === 'no_presentado' ? false : cancellationJustified,
          kind: cancellationKind,
          refundAmount: parsedRefund
        } : undefined,
        paymentData: targetStatus === 'pagada' || targetStatus === 'asistio' || targetStatus === 'pendiente_pago' ? {
          paidAmount: parsedPaid
        } : undefined
      });

      if (!res.success) {
        setErrorMessage(res.error || 'No se pudo aplicar la corrección.');
        setShowConfirmation(false);
        setIsSubmitting(false);
        return;
      }

      const successMsg = preview.willReopen
        ? `Corrección aplicada con éxito: El participante pasó a "${targetStatus}" y la actividad fue REABIERTA a estado "próxima".`
        : `Corrección aplicada con éxito: El participante pasó a "${targetStatus}".`;

      if (onSuccess) {
        onSuccess(successMsg);
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error inesperado durante la transacción.');
      setShowConfirmation(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-[#EDE4D7] shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-[#290824] text-white px-6 py-5 flex items-center justify-between border-b border-[#3E1037]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#521849] text-amber-300">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-serif text-white flex items-center gap-2">
                Corregir Hoja de Sala
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 font-sans font-bold uppercase tracking-wider">
                  Modo Avanzado
                </span>
              </h2>
              <p className="text-xs text-[#DFD3C2] mt-0.5">
                Modificación administrativa directa con recálculo transaccional de aforo
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-[#DFD3C2] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs sm:text-sm">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs">Error de validación</p>
                <p className="text-xs mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Context Cards: Activity & Participant */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Activity Card */}
            <div className="p-3.5 rounded-2xl bg-[#FCFAF7] border border-[#EDE4D7] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-[#574B45] tracking-wider">Actividad</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  activity.status === 'celebrada'
                    ? 'bg-stone-200 text-stone-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {activity.status === 'celebrada' ? 'Celebrada' : 'Próxima'}
                </span>
              </div>
              <p className="font-bold text-[#26201D] text-sm truncate font-serif">{activity.title}</p>
              <div className="text-xs text-[#574B45] flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#521849]" />
                  {activity.date}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-[#521849]" />
                  {activity.bookedSpots || 0} / {activity.totalSpots} plazas
                </span>
              </div>
            </div>

            {/* Participant Card */}
            <div className="p-3.5 rounded-2xl bg-[#FCFAF7] border border-[#EDE4D7] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-[#574B45] tracking-wider">Participante</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#521849]/10 text-[#521849]">
                  {participant.status}
                </span>
              </div>
              <p className="font-bold text-[#26201D] text-sm truncate font-serif">{participant.fullName}</p>
              <div className="text-xs text-[#574B45] truncate">
                {participant.email || participant.phone || 'Sin contacto directo'} • {participant.totalAmount}€
              </div>
            </div>
          </div>

          {/* Historical correction notice if any */}
          {participant.correctedAt && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Registro previo de corrección:</span> Corregido el{' '}
                {new Date(participant.correctedAt).toLocaleDateString('es-ES')} por {participant.correctedBy || 'Admin'}:{' '}
                <em>"{participant.correctionReason}"</em>
              </div>
            </div>
          )}

          {!showConfirmation ? (
            /* STEP 1: Edit Form */
            <div className="space-y-4">
              {/* Target Status Select */}
              <div>
                <label className="block text-xs font-bold text-[#26201D] mb-1.5">
                  Nuevo Estado Canónico *
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as CanonicalParticipantStatus)}
                  className="w-full text-xs sm:text-sm p-2.5 bg-[#F8F6F5] border border-[#EDE4D7] rounded-xl text-[#26201D] font-medium focus:ring-2 focus:ring-[#521849]/30 outline-none"
                >
                  <option value="asistio">asistio — Check-in completado / Asistió presencialmente</option>
                  <option value="pagada">pagada — Abono confirmado / En espera de cata</option>
                  <option value="pendiente_pago">pendiente_pago — Inscripción confirmada pendiente de abono</option>
                  <option value="cancelada">cancelada — Baja administrativa o inasistencia</option>
                  <option value="lista_de_espera">lista_de_espera — En lista de espera (no ocupa plaza)</option>
                </select>
              </div>

              {/* Conditional: Cancellation fields */}
              {targetStatus === 'cancelada' && (
                <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-rose-950 mb-1">
                      Naturaleza de la Cancelación *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors ${
                        cancellationKind === 'cancelacion_usuario' 
                          ? 'bg-white border-rose-400 font-semibold text-rose-900 shadow-2xs' 
                          : 'bg-white/60 border-rose-200 text-stone-700'
                      }`}>
                        <input
                          type="radio"
                          name="cancellationKind"
                          checked={cancellationKind === 'cancelacion_usuario'}
                          onChange={() => setCancellationKind('cancelacion_usuario')}
                          className="text-rose-600 focus:ring-rose-500"
                        />
                        <div>
                          <p className="text-xs font-bold">Cancelación Ordinaria</p>
                          <p className="text-[10px] text-[#574B45]">Libera 1 plaza de aforo</p>
                        </div>
                      </label>

                      <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors ${
                        cancellationKind === 'no_presentado' 
                          ? 'bg-white border-rose-400 font-semibold text-rose-900 shadow-2xs' 
                          : 'bg-white/60 border-rose-200 text-stone-700'
                      }`}>
                        <input
                          type="radio"
                          name="cancellationKind"
                          checked={cancellationKind === 'no_presentado'}
                          onChange={() => setCancellationKind('no_presentado')}
                          className="text-rose-600 focus:ring-rose-500"
                        />
                        <div>
                          <p className="text-xs font-bold">No Presentado (Inasistencia)</p>
                          <p className="text-[10px] text-[#574B45]">Retiene la plaza de aforo</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {cancellationKind === 'cancelacion_usuario' && (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="cancellationJustified"
                        checked={cancellationJustified}
                        onChange={(e) => setCancellationJustified(e.target.checked)}
                        className="rounded text-rose-600 focus:ring-rose-500"
                      />
                      <label htmlFor="cancellationJustified" className="text-xs text-rose-950 font-medium">
                        Marcar como cancelación justificada (fuerza mayor o aviso previo reglamentario)
                      </label>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-rose-950 mb-1">
                        Detalle / Motivo de cancelación
                      </label>
                      <input
                        type="text"
                        value={cancellationReason}
                        onChange={(e) => setCancellationReason(e.target.value)}
                        placeholder="Ej: Aviso médico, indisposición..."
                        className="w-full text-xs p-2 bg-white border border-rose-200 rounded-lg text-[#26201D] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-rose-950 mb-1">
                        Importe Reembolsado (€)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(e.target.value)}
                        placeholder="Ej: 25.00"
                        className="w-full text-xs p-2 bg-white border border-rose-200 rounded-lg text-[#26201D] outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Conditional: Paid amount field */}
              {(targetStatus === 'pagada' || targetStatus === 'asistio') && (
                <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-2">
                  <label className="block text-xs font-bold text-blue-950">
                    Importe Abonado (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    placeholder={String(participant.totalAmount)}
                    className="w-full text-xs sm:text-sm p-2 bg-white border border-blue-200 rounded-xl text-[#26201D] outline-none"
                  />
                  <p className="text-[10px] text-blue-800">
                    Importe total de la reserva: {participant.totalAmount}€
                  </p>
                </div>
              )}

              {/* Mandatory Reason */}
              <div>
                <label className="block text-xs font-bold text-[#26201D] mb-1.5 flex items-center justify-between">
                  <span>Motivo de la Corrección Administrativa *</span>
                  <span className="text-[11px] text-[#574B45] font-normal">Obligatorio para auditoría</span>
                </label>
                <textarea
                  rows={3}
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="Explica detalladamente la razón administrativa de la corrección (ej: Error de lista de puerta subsanado por secretaría, pago recibido en efectivo in situ...)"
                  className="w-full text-xs sm:text-sm p-3 bg-[#F8F6F5] border border-[#EDE4D7] rounded-xl text-[#26201D] placeholder-[#574B45]/50 focus:ring-2 focus:ring-[#521849]/30 outline-none resize-none"
                />
              </div>

              {/* Live Preview of Impact */}
              {preview && (
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2.5">
                  <p className="text-xs font-bold text-[#26201D] flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-[#521849]" />
                    Impacto Calculado de la Corrección
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-white border border-stone-200">
                      <span className="text-[10px] text-[#574B45] block">Ocupación de plaza:</span>
                      <div className="flex items-center gap-1.5 mt-0.5 font-bold">
                        <span>{preview.beforeOccupies ? 'Ocupa (1)' : 'No ocupa (0)'}</span>
                        <ArrowRight className="w-3 h-3 text-[#574B45]" />
                        <span className={preview.afterOccupies ? 'text-emerald-700' : 'text-stone-600'}>
                          {preview.afterOccupies ? 'Ocupa (1)' : 'No ocupa (0)'}
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-stone-200">
                      <span className="text-[10px] text-[#574B45] block">Variación de Aforo:</span>
                      <div className="flex items-center gap-1.5 mt-0.5 font-bold">
                        <span>{preview.currentBooked}</span>
                        <ArrowRight className="w-3 h-3 text-[#574B45]" />
                        <span className={
                          preview.isExceeding ? 'text-rose-700' :
                          preview.spotsDelta > 0 ? 'text-amber-700' :
                          preview.spotsDelta < 0 ? 'text-blue-700' : 'text-stone-700'
                        }>
                          {preview.newBookedSpots} / {activity.totalSpots}
                          {preview.spotsDelta !== 0 && ` (${preview.spotsDelta > 0 ? `+${preview.spotsDelta}` : preview.spotsDelta})`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Reopening banner */}
                  {preview.willReopen && (
                    <div className="p-3 rounded-xl bg-amber-100 border border-amber-300 text-amber-950 text-xs flex items-start gap-2 animate-fadeIn">
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Reapertura técnica de la actividad</p>
                        <p className="mt-0.5">
                          La actividad está actualmente <strong>celebrada</strong>. Al corregir a un estado no resuelto (<em>{targetStatus}</em>), 
                          la actividad pasará automáticamente a <strong>próxima</strong> en la misma transacción para permitir la gestión de la hoja de sala.
                        </p>
                      </div>
                    </div>
                  )}

                  {!preview.willReopen && activity.status === 'celebrada' && (
                    <p className="text-[11px] text-[#574B45]">
                      • La actividad permanecerá en estado <strong>celebrada</strong> (el estado resultante queda resuelto).
                    </p>
                  )}

                  {activity.status === 'proxima' && (
                    <p className="text-[11px] text-[#574B45]">
                      • La actividad permanecerá en estado <strong>próxima</strong> (no se celebra automáticamente).
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* STEP 2: Explicit Confirmation Summary */
            <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-4">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>¿Confirmar y aplicar corrección en la base de datos?</span>
              </div>

              <div className="bg-white rounded-xl p-4 border border-amber-200/80 space-y-2.5 text-xs text-[#26201D]">
                <div className="flex justify-between border-b border-stone-100 pb-1.5">
                  <span className="text-[#574B45]">Participante:</span>
                  <span className="font-bold">{participant.fullName}</span>
                </div>
                <div className="flex justify-between border-b border-stone-100 pb-1.5">
                  <span className="text-[#574B45]">Transición de estado:</span>
                  <span className="font-mono font-bold text-[#521849]">
                    {participant.status} → {targetStatus}
                  </span>
                </div>
                <div className="flex justify-between border-b border-stone-100 pb-1.5">
                  <span className="text-[#574B45]">Nuevo aforo ocupado:</span>
                  <span className="font-bold">
                    {preview?.newBookedSpots} / {activity.totalSpots} plazas
                  </span>
                </div>
                <div className="flex justify-between border-b border-stone-100 pb-1.5">
                  <span className="text-[#574B45]">Estado de la actividad:</span>
                  <span className="font-bold">
                    {preview?.willReopen ? 'Reabrirá a "próxima"' : activity.status}
                  </span>
                </div>
                <div>
                  <span className="text-[#574B45] block mb-1">Motivo auditado:</span>
                  <p className="p-2 rounded-lg bg-[#FCFAF7] border border-[#EDE4D7] italic text-[#26201D]">
                    "{correctionReason.trim()}"
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-amber-900">
                Esta acción se ejecutará de forma atómica en una única transacción de Firestore. Quedará registrada la fecha, el usuario corrector y el motivo.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-[#FCFAF7] px-6 py-4 border-t border-[#EDE4D7] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={showConfirmation ? () => setShowConfirmation(false) : onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl border border-[#EDE4D7] bg-white text-[#574B45] hover:bg-[#F8F6F5] font-semibold text-xs cursor-pointer"
          >
            {showConfirmation ? 'Volver al formulario' : 'Cancelar'}
          </button>

          {!showConfirmation ? (
            <button
              type="button"
              onClick={handleValidateAndProceed}
              disabled={isSubmitting || !correctionReason.trim()}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all ${
                correctionReason.trim()
                  ? 'bg-[#521849] hover:bg-[#3E1037] text-white'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
            >
              <span>Revisar y Confirmar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleExecuteCorrection}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs transition-all"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Aplicando transacción...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirmar y Aplicar Transacción</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
