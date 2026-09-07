import React from 'react';
import { AlertCircle, ArrowRight, X, ClipboardList, ShieldAlert } from 'lucide-react';

interface IncompleteAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  activityId: string;
  activityTitle: string;
  pendingCount: number;
  onGoToAttendance: (activityId: string) => void;
}

export const IncompleteAttendanceModal: React.FC<IncompleteAttendanceModalProps> = ({
  isOpen,
  onClose,
  activityId,
  activityTitle,
  pendingCount,
  onGoToAttendance
}) => {
  if (!isOpen) return null;

  return (
    <div 
      id="modal-incomplete-attendance-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div 
        id="modal-incomplete-attendance"
        role="dialog"
        aria-modal="true"
        aria-labelledby="incomplete-attendance-title"
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200/80 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shadow-2xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 id="incomplete-attendance-title" className="text-base font-bold text-stone-900 leading-tight">
                Hoja de Asistencia Incompleta
              </h3>
              <p className="text-xs text-amber-900 font-medium">
                Bloqueo canónico de cierre
              </p>
            </div>
          </div>
          <button
            id="btn-close-modal-x"
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-white/80 transition-colors cursor-pointer"
            title="Cerrar aviso"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-stone-700">
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-amber-950 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Para cerrar la actividad debes completar la hoja de asistencia</span>
            </p>
            <p className="text-xs text-amber-900 mt-2 leading-relaxed">
              La actividad <strong>«{activityTitle}»</strong> tiene <strong>{pendingCount}</strong> {pendingCount === 1 ? 'registro pendiente' : 'registros pendientes'} de resolución con plaza reservada (en estado <em>pendiente de pago</em> o <em>pagada</em>).
            </p>
          </div>

          <p className="text-xs text-stone-600 leading-relaxed">
            Una actividad solo puede marcarse como <strong>Celebrada</strong> cuando todos los participantes con plaza hayan sido resueltos de forma explícita como <strong>Asistió</strong> o <strong>No presentado</strong> en el módulo de Control de Asistencia.
          </p>

          <div className="rounded-xl border border-stone-200 bg-stone-50 p-3.5 flex items-center gap-3">
            <ClipboardList className="w-5 h-5 text-[#521849] shrink-0" />
            <div className="text-xs">
              <span className="font-semibold text-stone-900 block">Acción requerida:</span>
              <span className="text-stone-600">Completa la hoja de sala en Control de Asistencia antes de archivar.</span>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="bg-stone-50 border-t border-stone-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            id="btn-cancel-close-attendance"
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            id="btn-go-to-attendance"
            type="button"
            onClick={() => {
              onClose();
              onGoToAttendance(activityId);
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#521849] hover:bg-[#3E1037] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <span>Ir a Control de Asistencia</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
