import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Participant, PaymentMethod, ParticipantStatus } from '../../types';
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Check, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  AlertCircle, 
  Phone, 
  Mail, 
  UserCheck, 
  XCircle, 
  Printer, 
  Download, 
  Copy, 
  ChevronRight, 
  ChevronDown, 
  Sparkles, 
  ArrowRight, 
  RefreshCw, 
  ShieldCheck, 
  HelpCircle,
  CreditCard,
  UserX
} from 'lucide-react';
import { sortActivitiesAscending } from '../../utils/dateUtils';
import { Pagination } from '../common/Pagination';
import { 
  isActivityConcluded, 
  isActivityTodayOrPast, 
  validateAndPrepareTransition 
} from '../../services/participantTransitions';
import { simulateParticipantMigration, MigrationSimulationResult } from '../../services/participantMigration';

interface ParticipantsManagerProps {
  initialActivityId?: string;
  initialSearchQuery?: string;
  onCloseDetailedView?: () => void;
}

export const ParticipantsManager: React.FC<ParticipantsManagerProps> = ({ 
  initialActivityId,
  initialSearchQuery,
  onCloseDetailedView
}) => {
  const { 
    activities, 
    participants, 
    addManualParticipant, 
    updateParticipant, 
    deleteParticipant 
  } = useData();
  const { user } = useAuth();

  // Filters State
  const [selectedActivityId, setSelectedActivityId] = useState<string>(initialActivityId || 'all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>(initialSearchQuery || '');

  // Synchronize when parent navigation changes initialActivityId or initialSearchQuery
  useEffect(() => {
    if (initialActivityId !== undefined) {
      setSelectedActivityId(initialActivityId || 'all');
    }
  }, [initialActivityId]);

  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchTerm(initialSearchQuery || '');
    }
  }, [initialSearchQuery]);

  // Modals & Tools State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [participantToDelete, setParticipantToDelete] = useState<Participant | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  const [showWorkflowDiagram, setShowWorkflowDiagram] = useState<boolean>(false);

  // Dedicated Cancellation Modal State (Bloque 5)
  const [cancellationModalParticipant, setCancellationModalParticipant] = useState<Participant | null>(null);
  const [cancellationReasonInput, setCancellationReasonInput] = useState<string>('');
  const [cancellationIsJustified, setCancellationIsJustified] = useState<boolean>(true);
  const [cancellationRefundInput, setCancellationRefundInput] = useState<string>('');
  const [cancellationError, setCancellationError] = useState<string | null>(null);

  // Close Attendance Modal State (Bloque 5)
  const [isCloseAttendanceModalOpen, setIsCloseAttendanceModalOpen] = useState<boolean>(false);
  const [closingAttendanceActivityId, setClosingAttendanceActivityId] = useState<string | null>(null);
  const [isClosingAttendanceLoading, setIsClosingAttendanceLoading] = useState<boolean>(false);

  // Data Migration Simulation & Execution State (Bloque 5)
  const [isMigrationModalOpen, setIsMigrationModalOpen] = useState<boolean>(false);
  const [migrationSimulation, setMigrationSimulation] = useState<MigrationSimulationResult | null>(null);
  const [isApplyingMigration, setIsApplyingMigration] = useState<boolean>(false);
  const [migrationSuccessMsg, setMigrationSuccessMsg] = useState<string | null>(null);

  // Form State (Only personal and administrative data, NO direct arbitrary status manipulation)
  const [formData, setFormData] = useState<{
    activityId: string;
    fullName: string;
    email: string;
    phone: string;
    isMember: boolean;
    turn: string;
    membershipNumber: string;
    notes: string;
    paymentMethod: PaymentMethod;
    totalAmount: string;
  }>({
    activityId: '',
    fullName: '',
    email: '',
    phone: '',
    isMember: false,
    turn: '',
    membershipNumber: '',
    notes: '',
    paymentMethod: 'bizum',
    totalAmount: ''
  });

  // Filtered Activities
  const activeActivities = useMemo(() => {
    let filtered = activities.filter(a => a.status !== 'celebrada');
    if (selectedActivityId !== 'all' && !filtered.some(a => a.id === selectedActivityId)) {
      const selected = activities.find(a => a.id === selectedActivityId);
      if (selected) {
        filtered = [...filtered, selected];
      }
    }
    return sortActivitiesAscending(filtered);
  }, [activities, selectedActivityId]);

  const currentActivity = useMemo(() => {
    if (selectedActivityId === 'all') return null;
    return activities.find(a => a.id === selectedActivityId) || null;
  }, [activities, selectedActivityId]);

  // Pagination state for participants
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedActivityId, statusFilter, searchTerm, pageSize]);

  // Filtered Participants (Canonical 5 statuses)
  const filteredParticipants = useMemo(() => {
    return participants.filter(p => {
      // Activity filter
      if (selectedActivityId !== 'all' && p.activityId !== selectedActivityId) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'cancelada') {
          if (p.status !== 'cancelada') return false;
        } else if (statusFilter === 'asistio') {
          if (p.status !== 'asistio') return false;
        } else if (p.status !== statusFilter) {
          return false;
        }
      }
      // Search query
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesName = (p.fullName || '').toLowerCase().includes(query);
        const matchesEmail = (p.email || '').toLowerCase().includes(query);
        const matchesPhone = (p.phone || '').toLowerCase().includes(query);
        const matchesSocio = (p.membershipNumber || '').toLowerCase().includes(query);
        const matchesNotes = (p.notes || '').toLowerCase().includes(query);
        const matchesActTitle = (p.activityTitle || '').toLowerCase().includes(query);
        return matchesName || matchesEmail || matchesPhone || matchesSocio || matchesNotes || matchesActTitle;
      }
      return true;
    });
  }, [participants, selectedActivityId, statusFilter, searchTerm]);

  // Paginated slice
  const paginatedParticipants = useMemo(() => {
    const totalItems = filteredParticipants.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Math.min(Math.max(1, currentPage), totalPages);
    const start = (safePage - 1) * pageSize;
    return filteredParticipants.slice(start, start + pageSize);
  }, [filteredParticipants, currentPage, pageSize]);

  // Sync safePage to state
  useEffect(() => {
    const totalItems = filteredParticipants.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Math.min(Math.max(1, currentPage), totalPages);
    if (currentPage !== safePage) {
      setCurrentPage(safePage);
    }
  }, [filteredParticipants.length, pageSize, currentPage]);

  // Key Metrics Calculations strictly for the 5 Canonical States
  const metrics = useMemo(() => {
    const relevant = selectedActivityId === 'all' 
      ? participants 
      : participants.filter(p => p.activityId === selectedActivityId);

    const activeParticipants = relevant.filter(p => p.status !== 'cancelada' && p.status !== 'lista_de_espera');
    const waitingListCount = relevant.filter(p => p.status === 'lista_de_espera').length;
    const totalSpotsBooked = activeParticipants.length;
    const sociosCount = activeParticipants.filter(p => p.isMember).length;
    const noSociosCount = activeParticipants.filter(p => !p.isMember).length;
    const withAllergies = activeParticipants.filter(p => p.notes && p.notes.trim().length > 0).length;
    
    // 5 canonical counts
    const pendingPaymentCount = relevant.filter(p => p.status === 'pendiente_pago').length;
    const paidCount = relevant.filter(p => p.status === 'pagada' || p.status === 'confirmada').length;
    const attendedCount = relevant.filter(p => p.status === 'asistio').length;
    const cancelledCount = relevant.filter(p => p.status === 'cancelada').length;
    const cancelledJustifiedCount = relevant.filter(p => p.status === 'cancelada' && p.cancellationJustified === true).length;
    const cancelledUnjustifiedCount = relevant.filter(p => p.status === 'cancelada' && p.cancellationJustified === false).length;

    let maxCapacity = 0;
    if (selectedActivityId === 'all') {
      maxCapacity = activities.reduce((sum, a) => sum + (a.totalSpots || 0), 0);
    } else if (currentActivity) {
      maxCapacity = currentActivity.totalSpots || 0;
    }

    const occupancyRate = maxCapacity > 0 ? Math.min(100, Math.round((totalSpotsBooked / maxCapacity) * 100)) : 0;

    return {
      totalBookings: relevant.length,
      totalSpotsBooked,
      waitingListCount,
      sociosCount,
      noSociosCount,
      maxCapacity,
      occupancyRate,
      withAllergies,
      pendingPaymentCount,
      paidCount,
      attendedCount,
      cancelledCount,
      cancelledJustifiedCount,
      cancelledUnjustifiedCount
    };
  }, [participants, selectedActivityId, activities, currentActivity]);

  // Open modal for new manual participant (Always starts in 'pendiente_pago' or auto 'lista_de_espera' if full)
  const handleOpenNewModal = () => {
    setEditingParticipant(null);
    const defaultActId = selectedActivityId !== 'all' ? selectedActivityId : (activeActivities[0]?.id || '');
    const act = activities.find(a => a.id === defaultActId);
    setFormData({
      activityId: defaultActId,
      fullName: '',
      email: '',
      phone: '',
      isMember: false,
      turn: act?.time ? `Turno (${act.time})` : '',
      membershipNumber: '',
      notes: '',
      paymentMethod: 'bizum',
      totalAmount: act ? String(act.priceNonMember || 0) : ''
    });
    setIsModalOpen(true);
  };

  // Open modal for editing participant data (Personal/Contact ONLY)
  const handleOpenEditModal = (p: Participant) => {
    setEditingParticipant(p);
    setFormData({
      activityId: p.activityId,
      fullName: p.fullName || '',
      email: p.email || '',
      phone: p.phone || '',
      isMember: p.isMember,
      turn: p.turn || '',
      membershipNumber: p.membershipNumber || '',
      notes: p.notes || '',
      paymentMethod: p.paymentMethod || 'bizum',
      totalAmount: p.totalAmount !== undefined ? String(p.totalAmount) : ''
    });
    setIsModalOpen(true);
  };

  // Dedicated Cancellation Modal (Bloque 5)
  const handleOpenCancellationModal = (p: Participant) => {
    setCancellationModalParticipant(p);
    setCancellationReasonInput('');
    setCancellationIsJustified(true);
    setCancellationRefundInput(p.totalAmount ? String(p.totalAmount) : '');
    setCancellationError(null);
  };

  const handleConfirmCancellation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellationModalParticipant) return;

    if (!cancellationReasonInput.trim()) {
      setCancellationError('El motivo de la cancelación es obligatorio.');
      return;
    }

    let parsedRefund: number | undefined = undefined;
    if (cancellationRefundInput.trim() !== '') {
      const num = parseFloat(cancellationRefundInput.replace(',', '.'));
      if (isNaN(num) || num < 0) {
        setCancellationError('Introduce un importe numérico válido en euros para la devolución (o déjalo vacío).');
        return;
      }
      parsedRefund = num;
    }

    const activity = activities.find(a => a.id === cancellationModalParticipant.activityId);
    const transition = validateAndPrepareTransition({
      participant: cancellationModalParticipant,
      targetStatus: 'cancelada',
      activity,
      actor: user?.name || user?.email || 'Secretaría / Administración',
      cancellationData: {
        reason: cancellationReasonInput.trim(),
        justified: cancellationIsJustified,
        kind: 'cancelacion_usuario'
      }
    });

    if (!transition.allowed) {
      setCancellationError(transition.error || 'No se pudo cancelar la inscripción.');
      return;
    }

    await updateParticipant(cancellationModalParticipant.id, {
      ...transition.updatedParticipant,
      refundAmount: parsedRefund
    });

    setCancellationModalParticipant(null);
    setCancellationReasonInput('');
    setCancellationRefundInput('');
    setCancellationError(null);
  };

  // Action: Confirm Payment (pendiente_pago -> pagada)
  const handleConfirmPayment = async (p: Participant) => {
    const activity = activities.find(a => a.id === p.activityId);
    const transition = validateAndPrepareTransition({
      participant: p,
      targetStatus: 'pagada',
      activity,
      actor: user?.name || user?.email || 'Administración'
    });

    if (!transition.allowed) {
      alert(transition.error);
      return;
    }

    await updateParticipant(p.id, transition.updatedParticipant || { status: 'pagada' });
  };

  // Action: Check-in / Asistió (pendiente_pago / pagada -> asistio)
  const handleCheckIn = async (p: Participant) => {
    const activity = activities.find(a => a.id === p.activityId);
    const transition = validateAndPrepareTransition({
      participant: p,
      targetStatus: 'asistio',
      activity,
      actor: user?.name || user?.email || 'Puerta / Check-in'
    });

    if (!transition.allowed) {
      alert(transition.error);
      return;
    }

    await updateParticipant(p.id, transition.updatedParticipant || { status: 'asistio', attended: true });
  };

  // Action: Promote from Waitlist (lista_de_espera -> pendiente_pago)
  const handlePromoteWaitlist = async (p: Participant) => {
    const activity = activities.find(a => a.id === p.activityId);
    if (!activity) return;

    if (isActivityConcluded(activity)) {
      alert('No se puede promocionar de lista de espera en una actividad ya celebrada.');
      return;
    }

    if (activity.bookedSpots >= activity.totalSpots) {
      alert(`El aforo está completo (${activity.bookedSpots}/${activity.totalSpots}). Debes disponer de una vacante para promocionar.`);
      return;
    }

    const transition = validateAndPrepareTransition({
      participant: p,
      targetStatus: 'pendiente_pago',
      activity,
      actor: user?.name || user?.email || 'Administración'
    });

    if (!transition.allowed) {
      alert(transition.error);
      return;
    }

    await updateParticipant(p.id, transition.updatedParticipant || { status: 'pendiente_pago' });
  };

  // Action: Close Activity Attendance (Batch non-checked-in to cancelada / no_presentado)
  const handleOpenCloseAttendanceModal = (activityId: string) => {
    const act = activities.find(a => a.id === activityId);
    if (!act) return;

    if (!isActivityTodayOrPast(act)) {
      alert('No es posible cerrar la asistencia de una actividad que aún no se ha celebrado (fecha futura).');
      return;
    }

    setClosingAttendanceActivityId(activityId);
    setIsCloseAttendanceModalOpen(true);
  };

  const handleConfirmCloseAttendance = async () => {
    if (!closingAttendanceActivityId) return;
    setIsClosingAttendanceLoading(true);

    try {
      const actParts = participants.filter(p => p.activityId === closingAttendanceActivityId);
      const pendingToCheckIn = actParts.filter(p => p.status === 'pendiente_pago' || p.status === 'pagada' || p.status === 'confirmada');

      for (const p of pendingToCheckIn) {
        await updateParticipant(p.id, {
          status: 'cancelada',
          cancellationReason: 'No presentado',
          cancellationJustified: false,
          cancellationKind: 'no_presentado',
          cancelledAt: new Date().toISOString(),
          cancelledBy: 'Cierre de Asistencia'
        });
      }

      setIsCloseAttendanceModalOpen(false);
      setClosingAttendanceActivityId(null);
    } catch (err) {
      console.error('Error closing attendance:', err);
      alert('Ocurrió un error al cerrar la asistencia.');
    } finally {
      setIsClosingAttendanceLoading(false);
    }
  };

  // Save Participant Form (Add or Edit personal details ONLY)
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.activityId) return;

    const targetActivity = activities.find(a => a.id === formData.activityId);
    if (!targetActivity) return;

    let parsedPrice: number | undefined = undefined;
    if (formData.totalAmount.trim() !== '') {
      const num = parseFloat(formData.totalAmount.replace(',', '.'));
      if (!isNaN(num) && num >= 0) parsedPrice = num;
    }
    if (parsedPrice === undefined) {
      parsedPrice = formData.isMember ? targetActivity.priceMember : targetActivity.priceNonMember;
    }

    if (editingParticipant) {
      await updateParticipant(editingParticipant.id, {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        isMember: formData.isMember,
        turn: formData.turn.trim() || undefined,
        membershipNumber: formData.membershipNumber.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        paymentMethod: formData.paymentMethod,
        totalAmount: parsedPrice
      });
    } else {
      // Add Manual: determines status based on available spots
      const availableSpots = Math.max(0, targetActivity.totalSpots - targetActivity.bookedSpots);
      const assignedStatus: ParticipantStatus = availableSpots > 0 ? 'pendiente_pago' : 'lista_de_espera';

      const newGroupId = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `grp-manual-${Date.now()}`;

      await addManualParticipant({
        activityId: formData.activityId,
        activityTitle: targetActivity.title,
        activityDate: targetActivity.date,
        activityType: targetActivity.type,
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        isMember: formData.isMember,
        groupId: newGroupId,
        turn: formData.turn.trim() || (targetActivity.time ? `Turno (${targetActivity.time})` : undefined),
        membershipNumber: formData.membershipNumber.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        status: assignedStatus,
        paymentMethod: formData.paymentMethod,
        totalAmount: parsedPrice
      });
    }

    setIsModalOpen(false);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!participantToDelete) return;
    await deleteParticipant(participantToDelete.id, participantToDelete.activityId);
    setParticipantToDelete(null);
  };

  // Data Migration Simulation & Application Tool (Bloque 5)
  const handleOpenMigrationTool = () => {
    const sim = simulateParticipantMigration(participants, activities);
    setMigrationSimulation(sim);
    setMigrationSuccessMsg(null);
    setIsMigrationModalOpen(true);
  };

  const handleApplyCanonicalMigration = async () => {
    if (!migrationSimulation || migrationSimulation.itemsToMigrate.length === 0) return;
    setIsApplyingMigration(true);

    try {
      for (const item of migrationSimulation.itemsToMigrate) {
        await updateParticipant(item.id, item.changes);
      }
      setMigrationSuccessMsg(`¡Normalización completada con éxito! Se han actualizado ${migrationSimulation.itemsToMigrate.length} registros al modelo canónico.`);
      // Refresh simulation
      const refreshedSim = simulateParticipantMigration(participants, activities);
      setMigrationSimulation(refreshedSim);
    } catch (err) {
      console.error('Error applying migration:', err);
      alert('Hubo un problema al aplicar la normalización.');
    } finally {
      setIsApplyingMigration(false);
    }
  };

  // Export to CSV
  const handleExportCsv = () => {
    const headers = [
      'ID', 
      'Grupo Reserva', 
      'Actividad', 
      'Fecha', 
      'Nombre Asistente', 
      'Es Socio', 
      'Email', 
      'Telefono', 
      'Turno', 
      'N_Socio', 
      'Alergias_Observaciones', 
      'Estado_Canonico', 
      'Metodo_Pago', 
      'Total_Euros', 
      'Motivo_Cancelacion',
      'Cancelacion_Justificada',
      'Tipo_Cancelacion',
      'Fecha_Cancelacion',
      'Responsable_Cancelacion',
      'Importe_Devuelto_Euros',
      'Fecha_Registro'
    ];
    const rows = filteredParticipants.map(p => [
      `"${p.id}"`,
      `"${p.groupId || ''}"`,
      `"${(p.activityTitle || '').replace(/"/g, '""')}"`,
      `"${p.activityDate || ''}"`,
      `"${(p.fullName || '').replace(/"/g, '""')}"`,
      p.isMember ? 'SI' : 'NO',
      `"${p.email || ''}"`,
      `"${p.phone || ''}"`,
      `"${p.turn || ''}"`,
      `"${p.membershipNumber || ''}"`,
      `"${(p.notes || '').replace(/"/g, '""')}"`,
      `"${p.status}"`,
      `"${p.paymentMethod || ''}"`,
      p.totalAmount || 0,
      `"${(p.cancellationReason || '').replace(/"/g, '""')}"`,
      p.status === 'cancelada' ? (p.cancellationJustified ? 'SI' : 'NO') : '',
      `"${p.cancellationKind || ''}"`,
      `"${p.cancelledAt || ''}"`,
      `"${(p.cancelledBy || '').replace(/"/g, '""')}"`,
      p.refundAmount !== undefined ? p.refundAmount : '',
      `"${p.registeredAt || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const actName = currentActivity ? currentActivity.title.substring(0, 20).replace(/\s+/g, '_') : 'Todas_las_Catas';
    link.setAttribute('download', `Participantes_${actName}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy list for WhatsApp
  const handleCopyWhatsApp = () => {
    const actTitle = currentActivity ? currentActivity.title : 'Listado General de Participantes';
    const dateStr = currentActivity ? ` (${currentActivity.date})` : '';
    
    let text = `🍷 *DOÑA BERENJENA — LISTA DE ASISTENTES*\n📌 *${actTitle}*${dateStr}\n\n`;
    text += `👥 *Total plazas ocupadas:* ${metrics.totalSpotsBooked}\n`;
    text += `⚠️ *Alergias registradas:* ${metrics.withAllergies}\n\n`;
    text += `--- LISTADO DE PARTICIPANTES ---\n`;

    filteredParticipants.forEach((p, idx) => {
      const statusLabel = 
        p.status === 'asistio' ? '✅ Asistió' :
        p.status === 'pagada' ? '💳 Pagada' :
        p.status === 'pendiente_pago' ? '⏳ Pendiente Pago' :
        p.status === 'lista_de_espera' ? '📋 Lista Espera' : '❌ Cancelada';

      text += `${idx + 1}. *${p.fullName}* ${p.isMember ? '(Socio)' : '(No socio)'} [${statusLabel}]`;
      if (p.phone) text += ` - Tel: ${p.phone}`;
      if (p.notes) text += `\n   ⚠️ _Alergias/Notas:_ ${p.notes}`;
      text += `\n`;
    });

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedNotification('¡Listado formateado para WhatsApp copiado al portapapeles!');
      setTimeout(() => setCopiedNotification(null), 3500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions Bar */}
      <div className="bg-white rounded-3xl border border-[#EDE4D7] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest font-bold text-[#521849]">
                Control de Asistencia • Modelo Canónico
              </span>
              {currentActivity && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#521849]/10 text-[#521849] text-[11px] font-bold">
                  {currentActivity.title}
                </span>
              )}
            </div>
            <h3 className="text-xl sm:text-2xl font-bold font-serif text-[#26201D] mt-1">
              Gestión de Asistentes y Reservas
            </h3>
            <p className="text-xs text-[#574B45] mt-0.5">
              Control con 5 estados normalizados: Lista de espera, Pendiente de pago, Pagada, Asistió y Cancelada.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-add-manual-participant"
              type="button"
              onClick={handleOpenNewModal}
              className="px-4 py-2.5 rounded-xl bg-[#521849] hover:bg-[#3E1037] text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nueva Inscripción Manual</span>
            </button>

            {/* Cierre de Asistencia Button (Visible when specific activity is filtered) */}
            {currentActivity && (
              <button
                id="btn-close-attendance"
                type="button"
                onClick={() => handleOpenCloseAttendanceModal(currentActivity.id)}
                className={`px-3.5 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isActivityTodayOrPast(currentActivity)
                    ? 'border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-900 shadow-2xs'
                    : 'border-stone-200 bg-stone-100 text-stone-400 cursor-not-allowed'
                }`}
                title={isActivityTodayOrPast(currentActivity) ? 'Cerrar asistencia de la actividad' : 'Bloqueado: La actividad es futura'}
              >
                <UserX className="w-4 h-4 text-purple-700" />
                <span>Cerrar Asistencia</span>
              </button>
            )}

            <button
              id="btn-workflow-diagram"
              type="button"
              onClick={() => setShowWorkflowDiagram(!showWorkflowDiagram)}
              className="px-3.5 py-2.5 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] hover:bg-white text-[#26201D] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Ver diagrama de transiciones canónicas"
            >
              <HelpCircle className="w-4 h-4 text-[#521849]" />
              <span>Flujo de Estados</span>
            </button>

            <button
              id="btn-audit-migration"
              type="button"
              onClick={handleOpenMigrationTool}
              className="px-3.5 py-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Auditoría y normalización de estados de participantes"
            >
              <RefreshCw className="w-4 h-4 text-amber-700" />
              <span>Normalizar Datos</span>
            </button>

            <button
              id="btn-print-sheet"
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] hover:bg-white text-[#26201D] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Imprimir Hoja de Sala para el Sumiller"
            >
              <Printer className="w-4 h-4 text-[#521849]" />
              <span>Hoja de Sala</span>
            </button>

            <button
              id="btn-export-csv"
              type="button"
              onClick={handleExportCsv}
              className="px-3.5 py-2.5 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] hover:bg-white text-[#26201D] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Descargar listado en CSV"
            >
              <Download className="w-4 h-4 text-[#521849]" />
              <span>Exportar CSV</span>
            </button>

            <button
              id="btn-copy-whatsapp"
              type="button"
              onClick={handleCopyWhatsApp}
              className="px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Copiar lista formateada para WhatsApp"
            >
              <Copy className="w-4 h-4 text-emerald-700" />
              <span>WhatsApp</span>
            </button>

            {onCloseDetailedView && (
              <button
                type="button"
                onClick={onCloseDetailedView}
                className="p-2.5 rounded-xl border border-[#EDE4D7] bg-[#F6F1EA] text-[#574B45] hover:text-[#26201D] cursor-pointer"
                title="Cerrar vista de participantes"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Canonical State Diagram */}
        {showWorkflowDiagram && (
          <div className="p-5 rounded-2xl bg-[#FCFAF7] border border-[#EDE4D7] space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#521849]" />
                <h4 className="font-bold text-sm font-serif text-[#26201D]">
                  Diagrama de Flujo Canónico de Participantes (Bloque 5)
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowWorkflowDiagram(false)}
                className="text-xs text-[#8C7E77] hover:text-[#26201D] cursor-pointer"
              >
                Cerrar diagrama
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white border border-[#EDE4D7] space-y-1">
                <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full text-[10px] uppercase">
                  1. Pendiente de pago
                </span>
                <p className="text-[#574B45] text-[11px] mt-1">
                  Inscripción inicial cuando hay plaza libre. Ocupa 1 plaza en el aforo.
                </p>
                <div className="text-[10px] text-[#8C7E77] pt-1 border-t border-[#EDE4D7]/60">
                  Transiciona a: <strong>Pagada</strong>, <strong>Asistió</strong> o <strong>Cancelada</strong>.
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#EDE4D7] space-y-1">
                <span className="font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full text-[10px] uppercase">
                  2. Pagada
                </span>
                <p className="text-[#574B45] text-[11px] mt-1">
                  Pago verificado mediante Bizum, transferencia o en sede. Ocupa 1 plaza.
                </p>
                <div className="text-[10px] text-[#8C7E77] pt-1 border-t border-[#EDE4D7]/60">
                  Transiciona a: <strong>Asistió</strong> o <strong>Cancelada</strong>.
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#EDE4D7] space-y-1">
                <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full text-[10px] uppercase">
                  3. Asistió
                </span>
                <p className="text-[#574B45] text-[11px] mt-1">
                  Check-in validado en la puerta de la sala de catas (hoy o pasado).
                </p>
                <div className="text-[10px] text-emerald-800 font-semibold pt-1 border-t border-[#EDE4D7]/60">
                  Estado terminal. No admite reversión operativa.
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#EDE4D7] space-y-1">
                <span className="font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full text-[10px] uppercase">
                  4. Cancelada
                </span>
                <p className="text-[#574B45] text-[11px] mt-1">
                  Libera 1 plaza. Puede ser <em>Justificada</em> o <em>Injustificada</em> (con motivo obligatorio).
                </p>
                <div className="text-[10px] text-rose-800 font-semibold pt-1 border-t border-[#EDE4D7]/60">
                  Estado terminal. No admite reactivación directa.
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong>Regla de Lista de Espera y Cierre de Asistencia:</strong> Si una actividad está llena, la persona queda en <strong>Lista de espera</strong> (sin plaza). Solo se promociona a <em>Pendiente de pago</em> si se libera una plaza antes de celebrarse la actividad. Al pulsar «Cerrar Asistencia», las plazas no presentadas pasan automáticamente a <strong>Cancelada (Injustificada, «No presentado»)</strong>.
              </div>
            </div>
          </div>
        )}

        {copiedNotification && (
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{copiedNotification}</span>
          </div>
        )}

        {/* Filter Controls Row */}
        <div className="pt-2 border-t border-[#F6F1EA] grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Activity Selector */}
          <div className="sm:col-span-5">
            <label className="block text-[11px] font-bold text-[#574B45] uppercase tracking-wider mb-1">
              Seleccionar Cata / Actividad:
            </label>
            <div className="relative">
              <select
                id="select-participant-activity"
                value={selectedActivityId}
                onChange={(e) => setSelectedActivityId(e.target.value)}
                className="w-full pl-3.5 pr-8 py-2 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs font-medium text-[#26201D] focus:outline-none focus:border-[#521849] focus:bg-white appearance-none cursor-pointer"
              >
                <option value="all">🌟 Todas las Actividades ({participants.length} inscripciones)</option>
                {activeActivities.map(act => {
                  const actParticipants = participants.filter(p => p.activityId === act.id);
                  const actOccupied = actParticipants.filter(p => p.status !== 'cancelada' && p.status !== 'lista_de_espera').length;
                  const isConcluded = isActivityConcluded(act);
                  return (
                    <option key={act.id} value={act.id}>
                      {act.title} — {new Date(act.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} ({actOccupied}/{act.totalSpots} plazas) {isConcluded ? '[Celebrada]' : ''}
                    </option>
                  );
                })}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#574B45]">
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Status Filter (Canonical 5) */}
          <div className="sm:col-span-4">
            <label className="block text-[11px] font-bold text-[#574B45] uppercase tracking-wider mb-1">
              Filtrar por Estado Canónico:
            </label>
            <select
              id="select-participant-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs font-medium text-[#26201D] focus:outline-none focus:border-[#521849] focus:bg-white cursor-pointer"
            >
              <option value="all">Todos los estados</option>
              <option value="pendiente_pago">⏳ Pendiente de Pago ({metrics.pendingPaymentCount})</option>
              <option value="pagada">💳 Pagada ({metrics.paidCount})</option>
              <option value="asistio">✅ Asistió ({metrics.attendedCount})</option>
              <option value="lista_de_espera">📋 Lista de Espera ({metrics.waitingListCount})</option>
              <option value="cancelada">❌ Cancelada ({metrics.cancelledCount})</option>
            </select>
          </div>

          {/* Search bar */}
          <div className="sm:col-span-3">
            <label className="block text-[11px] font-bold text-[#574B45] uppercase tracking-wider mb-1">
              Búsqueda Rápida:
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, email, teléfono, socio..."
              className="w-full px-3 py-2 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs text-[#26201D] focus:outline-none focus:border-[#521849] focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* KPI Stats Cards strictly aligned to Canonical States */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Card 1: Plazas Ocupadas */}
        <div className="bg-white rounded-2xl border border-[#EDE4D7] p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#574B45] mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Aforo Ocupado</span>
            <Users className="w-4 h-4 text-[#521849]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold font-serif text-[#26201D]">
              {metrics.totalSpotsBooked}
            </span>
            <span className="text-[11px] text-[#574B45]">
              / {metrics.maxCapacity > 0 ? metrics.maxCapacity : '-'} plazas
            </span>
          </div>
          <p className="text-[10px] text-[#574B45] mt-1 truncate">
            {metrics.occupancyRate}% ocupación real
          </p>
        </div>

        {/* Card 2: Pendiente Pago */}
        <div className="bg-white rounded-2xl border border-amber-200 bg-amber-50/30 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-amber-900 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Pendiente Pago</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold font-serif text-amber-950">
              {metrics.pendingPaymentCount}
            </span>
            <span className="text-[11px] text-amber-800">por abonar</span>
          </div>
          <p className="text-[10px] text-amber-700 mt-1 truncate">
            {metrics.pendingPaymentCount > 0 ? 'Requiere abono' : 'Todos al día'}
          </p>
        </div>

        {/* Card 3: Pagadas */}
        <div className="bg-white rounded-2xl border border-blue-200 bg-blue-50/20 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-blue-900 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Pagadas</span>
            <CreditCard className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold font-serif text-blue-950">
              {metrics.paidCount}
            </span>
            <span className="text-[11px] text-blue-800">confirmadas</span>
          </div>
          <p className="text-[10px] text-blue-700 mt-1 truncate">
            Abono registrado
          </p>
        </div>

        {/* Card 4: Asistió */}
        <div className="bg-white rounded-2xl border border-emerald-200 bg-emerald-50/30 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-emerald-900 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Asistió</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold font-serif text-emerald-950">
              {metrics.attendedCount}
            </span>
            <span className="text-[11px] text-emerald-800">en sala</span>
          </div>
          <p className="text-[10px] text-emerald-700 mt-1 truncate">
            Check-in completado
          </p>
        </div>

        {/* Card 5: Lista de Espera */}
        <div className="bg-white rounded-2xl border border-amber-200 bg-amber-50/20 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-amber-900 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Lista Espera</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold font-serif text-amber-950">
              {metrics.waitingListCount}
            </span>
            <span className="text-[11px] text-amber-800">en cola</span>
          </div>
          <p className="text-[10px] text-amber-700 mt-1 truncate">
            {metrics.waitingListCount > 0 ? 'Pendientes de vacante' : 'Sin cola'}
          </p>
        </div>

        {/* Card 6: Canceladas */}
        <div className="bg-white rounded-2xl border border-rose-200 bg-rose-50/30 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-rose-900 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Canceladas</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold font-serif text-rose-950">
              {metrics.cancelledCount}
            </span>
            <span className="text-[11px] text-rose-800">bajas</span>
          </div>
          <p className="text-[10px] text-rose-700 mt-1 truncate">
            {metrics.cancelledJustifiedCount} just. / {metrics.cancelledUnjustifiedCount} injust.
          </p>
        </div>
      </div>

      {/* Participants Table */}
      <div className="bg-white rounded-3xl border border-[#EDE4D7] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#FCFAF7] border-b border-[#EDE4D7] text-[#574B45] uppercase tracking-wider font-semibold">
                <th className="p-4">Asistente / Contacto</th>
                <th className="p-4">Cata / Actividad</th>
                <th className="p-4">Condición / Importe</th>
                <th className="p-4">Alergias & Observaciones</th>
                <th className="p-4">Estado Canónico</th>
                <th className="p-4">Fecha Registro</th>
                <th className="p-4 text-right">Acciones Canónicas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE4D7]">
              {paginatedParticipants.map((p) => {
                const act = activities.find(a => a.id === p.activityId);
                const isTodayOrPast = act ? isActivityTodayOrPast(act) : true;
                const isConcluded = act ? isActivityConcluded(act) : false;
                const hasAvailableSpots = act ? act.bookedSpots < act.totalSpots : false;

                return (
                  <tr 
                    key={p.id} 
                    className={`hover:bg-[#FCFAF7] transition-colors ${
                      p.status === 'cancelada' ? 'opacity-60 bg-stone-50' : 
                      p.status === 'lista_de_espera' ? 'bg-amber-50/20' : ''
                    }`}
                  >
                    {/* Asistente */}
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#26201D] text-sm font-serif">{p.fullName}</span>
                          {p.membershipNumber && (
                            <span className="px-1.5 py-0.5 rounded-md bg-[#521849]/10 text-[#521849] font-mono text-[10px] font-bold">
                              {p.membershipNumber}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#574B45]">
                          {p.phone && (
                            <a 
                              href={`tel:${p.phone}`} 
                              className="inline-flex items-center gap-1 text-[#521849] hover:underline"
                              title="Llamar"
                            >
                              <Phone className="w-3 h-3" />
                              <span>{p.phone}</span>
                            </a>
                          )}
                          {p.email && (
                            <a 
                              href={`mailto:${p.email}`} 
                              className="inline-flex items-center gap-1 hover:text-[#26201D]"
                              title="Enviar email"
                            >
                              <Mail className="w-3 h-3" />
                              <span className="truncate max-w-[140px]">{p.email}</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Actividad */}
                    <td className="p-4 max-w-[200px]">
                      <p className="font-medium text-[#26201D] truncate" title={p.activityTitle}>
                        {p.activityTitle || 'Actividad'}
                      </p>
                      <p className="text-[11px] text-[#574B45]">
                        {p.activityDate} {isConcluded ? '• (Celebrada)' : ''}
                      </p>
                    </td>

                    {/* Condición, Importe y Turno */}
                    <td className="p-4">
                      <div className="space-y-1">
                        <span className={`inline-flex items-center gap-1 font-bold text-[11px] px-2 py-0.5 rounded-full ${
                          p.isMember ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-[#574B45]'
                        }`}>
                          {p.isMember ? '⭐ Socio' : '👤 No socio'}
                        </span>
                        <p className="text-xs font-bold text-[#521849]">
                          {p.totalAmount !== undefined ? `${p.totalAmount} €` : '-'}
                        </p>
                        {p.turn && (
                          <span className="inline-block text-[10px] text-[#574B45] font-mono bg-[#EDE4D7]/50 px-1.5 py-0.5 rounded">
                            {p.turn}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Alergias / Notas */}
                    <td className="p-4 max-w-[220px]">
                      {p.notes && p.notes.trim().length > 0 ? (
                        <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] space-y-1">
                          <div className="flex items-center gap-1 font-bold text-[10px] uppercase text-amber-800 tracking-wider">
                            <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>Observaciones:</span>
                          </div>
                          <p className="leading-tight line-clamp-2" title={p.notes}>
                            {p.notes}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[#8C7E77] text-[11px] italic">Sin notas</span>
                      )}
                    </td>

                    {/* Estado Canónico */}
                    <td className="p-4">
                      <div className="space-y-1.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          p.status === 'pendiente_pago'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : p.status === 'pagada' || p.status === 'confirmada'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : p.status === 'asistio'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : p.status === 'lista_de_espera'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}>
                          {p.status === 'pendiente_pago' && <Clock className="w-3 h-3 text-amber-600" />}
                          {(p.status === 'pagada' || p.status === 'confirmada') && <CreditCard className="w-3 h-3 text-blue-600" />}
                          {p.status === 'asistio' && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                          {p.status === 'lista_de_espera' && <Clock className="w-3 h-3 text-amber-600" />}
                          {p.status === 'cancelada' && <XCircle className="w-3 h-3 text-rose-600" />}
                          <span>
                            {p.status === 'pendiente_pago' ? 'Pendiente Pago' :
                             p.status === 'pagada' || p.status === 'confirmada' ? 'Pagada' :
                             p.status === 'asistio' ? 'Asistió' :
                             p.status === 'lista_de_espera' ? 'Lista de Espera' : 'Cancelada'}
                          </span>
                        </span>

                        {/* Detalles si es Cancelada */}
                        {p.status === 'cancelada' && (
                          <div className="p-2 rounded-xl bg-rose-50 border border-rose-200/80 text-[10px] text-rose-950 space-y-1 max-w-[220px]">
                            <div className="flex items-center gap-1 font-bold">
                              <span className={`px-1.5 py-0.2 rounded text-[9px] uppercase ${
                                p.cancellationJustified ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-200 text-rose-900'
                              }`}>
                                {p.cancellationJustified ? '✓ Justificada' : '✗ Injustificada'}
                              </span>
                              {p.cancellationKind === 'no_presentado' && (
                                <span className="text-[9px] text-rose-800 font-semibold">(No presentado)</span>
                              )}
                            </div>
                            {p.cancellationReason && (
                              <p className="line-clamp-2 italic text-rose-900" title={p.cancellationReason}>
                                «{p.cancellationReason}»
                              </p>
                            )}
                            <div className="text-[9px] text-rose-800/80">
                              {p.cancelledAt && <span>{new Date(p.cancelledAt).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>}
                              {p.cancelledBy && <span> • {p.cancelledBy}</span>}
                            </div>
                            {p.refundAmount !== undefined && (
                              <div className="font-bold text-rose-950 bg-rose-200/60 px-1.5 py-0.5 rounded text-[9px] inline-block">
                                Devolución: {p.refundAmount} €
                              </div>
                            )}
                          </div>
                        )}

                        {p.paymentMethod && p.status !== 'cancelada' && p.status !== 'lista_de_espera' && (
                          <div className="text-[10px] text-[#574B45] font-medium flex items-center gap-1">
                            <span>Método:</span>
                            <span className="capitalize font-semibold text-[#26201D]">{p.paymentMethod}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Fecha Registro */}
                    <td className="p-4 text-[#574B45] text-[11px]">
                      {p.registeredAt ? new Date(p.registeredAt).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      }) : '-'}
                    </td>

                    {/* Acciones Canónicas (Reglas Bloque 5) */}
                    <td className="p-4 text-right space-x-1 whitespace-nowrap">
                      {/* Caso 1: Lista de Espera -> Promocionar (si actividad no celebrada y hay aforo) */}
                      {p.status === 'lista_de_espera' && (
                        <button
                          type="button"
                          onClick={() => handlePromoteWaitlist(p)}
                          disabled={isConcluded || !hasAvailableSpots}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold ${
                            !isConcluded && hasAvailableSpots
                              ? 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 cursor-pointer'
                              : 'border-stone-200 bg-stone-100 text-stone-400 cursor-not-allowed'
                          }`}
                          title={
                            isConcluded ? 'Actividad ya celebrada' :
                            !hasAvailableSpots ? 'Aforo completo: No hay vacantes' :
                            'Promocionar a Pendiente de Pago (ocupa 1 plaza)'
                          }
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Promocionar</span>
                        </button>
                      )}

                      {/* Caso 2: Pendiente de Pago -> Confirmar Pago */}
                      {p.status === 'pendiente_pago' && (
                        <button
                          type="button"
                          onClick={() => handleConfirmPayment(p)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100 font-semibold text-xs cursor-pointer"
                          title="Confirmar Abono (pasa a Pagada)"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Confirmar Pago</span>
                        </button>
                      )}

                      {/* Caso 3: Check-in / Asistió (Disponible para pendiente_pago y pagada si es hoy o pasado) */}
                      {(p.status === 'pendiente_pago' || p.status === 'pagada' || p.status === 'confirmada') && isTodayOrPast && (
                        <button
                          type="button"
                          onClick={() => handleCheckIn(p)}
                          className="p-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                          title="Check-in: Marcar Asistencia en Sala"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Caso 4: Gestionar Cancelación (Solo para pendiente_pago y pagada) */}
                      {(p.status === 'pendiente_pago' || p.status === 'pagada' || p.status === 'confirmada') && (
                        <button
                          type="button"
                          onClick={() => handleOpenCancellationModal(p)}
                          className="p-1.5 rounded-lg border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 cursor-pointer"
                          title="Gestionar Cancelación (Libera 1 plaza con motivo obligatorio)"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Edición de Datos Personales */}
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(p)}
                        className="p-1.5 rounded-lg border border-[#EDE4D7] text-[#521849] hover:bg-[#F6EDF4] cursor-pointer"
                        title="Editar Datos del Asistente"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Eliminar Registro */}
                      <button
                        type="button"
                        onClick={() => setParticipantToDelete(p)}
                        className="p-1.5 rounded-lg border border-[#EDE4D7] text-[#9B3E26] hover:bg-rose-50 cursor-pointer"
                        title="Eliminar Registro"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredParticipants.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#574B45]">
                    <Users className="w-8 h-8 text-[#574B45]/40 mx-auto mb-2" />
                    <p className="font-semibold text-sm text-[#26201D]">No se encontraron participantes con los filtros aplicados</p>
                    <p className="text-xs text-[#574B45] mt-1">
                      {participants.length === 0 
                        ? 'Aún no hay inscripciones registradas.' 
                        : 'Prueba a cambiar el filtro de cata o limpiar el texto de búsqueda.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredParticipants.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="participantes"
        />
      </div>

      {/* MODAL: AÑADIR / EDITAR DATOS DE PARTICIPANTE (NO CAMBIO ARBITRARIO DE ESTADO) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-[#EDE4D7] max-h-[90vh] overflow-y-auto animate-scaleUp">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-[#574B45] hover:text-[#26201D] hover:bg-[#F6F1EA] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <span className="text-xs uppercase tracking-widest font-bold text-[#521849]">
                {editingParticipant ? 'Modificar Datos de Inscripción' : 'Nueva Inscripción Manual'}
              </span>
              <h3 className="text-xl font-bold font-serif text-[#26201D] mt-1">
                {editingParticipant ? `Editar: ${editingParticipant.fullName}` : 'Registrar Participante'}
              </h3>
              <p className="text-xs text-[#574B45] mt-0.5">
                {editingParticipant 
                  ? 'Modificación de datos personales y administrativos (nombre, contacto, socio, turno y notas).' 
                  : 'Las nuevas inscripciones se crean como "Pendiente de pago" o "Lista de espera" si el aforo está completo.'}
              </p>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4">
              {/* Activity Selector */}
              <div>
                <label className="block text-xs font-semibold text-[#26201D] mb-1">
                  Cata o Actividad *
                </label>
                <select
                  required
                  disabled={!!editingParticipant}
                  value={formData.activityId}
                  onChange={(e) => {
                    const act = activities.find(a => a.id === e.target.value);
                    const defaultPrice = act ? (formData.isMember ? act.priceMember : act.priceNonMember) : 0;
                    setFormData({ 
                      ...formData, 
                      activityId: e.target.value,
                      totalAmount: String(defaultPrice)
                    });
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs font-medium text-[#26201D] focus:outline-none focus:border-[#521849] focus:bg-white"
                >
                  <option value="">-- Selecciona una actividad --</option>
                  {activeActivities.map(act => (
                    <option key={act.id} value={act.id}>
                      {new Date(act.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })} — {act.title} ({act.bookedSpots}/{act.totalSpots} plazas ocupadas)
                    </option>
                  ))}
                </select>
              </div>

              {/* Nombre y Apellidos */}
              <div>
                <label className="block text-xs font-semibold text-[#26201D] mb-1">
                  Nombre y Apellidos del Participante *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Ej. Carmen Navarro Ruiz"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs focus:outline-none focus:border-[#521849] focus:bg-white"
                />
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#26201D] mb-1">
                    Teléfono de contacto *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="600 000 000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs focus:outline-none focus:border-[#521849] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#26201D] mb-1">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="nombre@ejemplo.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs focus:outline-none focus:border-[#521849] focus:bg-white"
                  />
                </div>
              </div>

              {/* Socio, Turn, and Socio Number */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#26201D] mb-1">
                    Condición
                  </label>
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] cursor-pointer hover:bg-stone-50">
                    <input
                      type="checkbox"
                      checked={formData.isMember}
                      onChange={(e) => {
                        const isMember = e.target.checked;
                        const act = activities.find(a => a.id === formData.activityId);
                        const newPrice = act ? (isMember ? act.priceMember : act.priceNonMember) : 0;
                        setFormData({ 
                          ...formData, 
                          isMember, 
                          totalAmount: String(newPrice) 
                        });
                      }}
                      className="w-4 h-4 rounded text-[#521849] focus:ring-[#521849]"
                    />
                    <span className="text-xs font-medium text-[#26201D]">
                      {formData.isMember ? '⭐ Es Socio' : '👤 No socio'}
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#26201D] mb-1">
                    Turno (opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.turn}
                    onChange={(e) => setFormData({ ...formData, turn: e.target.value })}
                    placeholder="Ej. Turno 21:00 h"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs focus:outline-none focus:border-[#521849] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#26201D] mb-1">
                    Nº de Socio
                  </label>
                  <input
                    type="text"
                    value={formData.membershipNumber}
                    onChange={(e) => setFormData({ ...formData, membershipNumber: e.target.value })}
                    placeholder="SOC-042"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs focus:outline-none focus:border-[#521849] focus:bg-white"
                  />
                </div>
              </div>

              {/* Payment Method and Total Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#26201D] mb-1">
                    Método de Pago
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs focus:outline-none focus:border-[#521849] focus:bg-white"
                  >
                    <option value="bizum">Bizum</option>
                    <option value="transferencia">Transferencia Bancaria</option>
                    <option value="efectivo">Efectivo en Sede</option>
                    <option value="tarjeta">Tarjeta en Sede</option>
                    <option value="pendiente">Pendiente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#26201D] mb-1">
                    Importe (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.totalAmount}
                    onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs focus:outline-none focus:border-[#521849] focus:bg-white"
                  />
                </div>
              </div>

              {/* Alergias / Observaciones */}
              <div>
                <label className="block text-xs font-semibold text-[#26201D] mb-1">
                  Alergias / Intolerancias / Notas para Cocina
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Indicar intolerancias (gluten, marisco, lactosa, vegetarianos...)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs focus:outline-none focus:border-[#521849] focus:bg-white resize-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#EDE4D7]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#EDE4D7] bg-white text-[#574B45] text-xs font-semibold hover:bg-[#F6F1EA] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#521849] hover:bg-[#3E1037] text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  {editingParticipant ? 'Guardar Cambios' : 'Registrar Participante'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: GESTIONAR CANCELACIÓN (Bloque 5) */}
      {cancellationModalParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-[#EDE4D7] my-8 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-[#EDE4D7] mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-serif text-[#26201D]">
                    Gestionar Cancelación
                  </h3>
                  <p className="text-xs text-[#574B45]">
                    {cancellationModalParticipant.fullName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCancellationModalParticipant(null)}
                className="p-1.5 rounded-xl hover:bg-[#F6F1EA] text-[#574B45] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCancellation} className="space-y-4">
              <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="font-semibold text-amber-950 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>Actividad: {cancellationModalParticipant.activityTitle}</span>
                </div>
                <p className="text-[11px] text-amber-800">
                  Esta acción cambiará el estado a <strong>Cancelada</strong> y <strong>liberará exactamente 1 plaza</strong> en el aforo. No se promocionará automáticamente a nadie de la lista de espera.
                </p>
              </div>

              {cancellationError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{cancellationError}</span>
                </div>
              )}

              {/* Justification Switch */}
              <div>
                <label className="block text-xs font-bold text-[#26201D] mb-1.5">
                  Tipo de Cancelación
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCancellationIsJustified(true)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                      cancellationIsJustified
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-2xs'
                        : 'border-[#EDE4D7] bg-[#FCFAF7] text-[#574B45] hover:bg-white'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Justificada</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCancellationIsJustified(false)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                      !cancellationIsJustified
                        ? 'border-rose-500 bg-rose-50 text-rose-900 shadow-2xs'
                        : 'border-[#EDE4D7] bg-[#FCFAF7] text-[#574B45] hover:bg-white'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Injustificada</span>
                  </button>
                </div>
              </div>

              {/* Mandatory Reason */}
              <div>
                <label className="block text-xs font-bold text-[#26201D] mb-1">
                  Motivo de la cancelación <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={cancellationReasonInput}
                  onChange={(e) => setCancellationReasonInput(e.target.value)}
                  placeholder="Ej. Avisó con más de 48h de antelación por motivos médicos justificados..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Optional Refund */}
              <div>
                <label className="block text-xs font-bold text-[#26201D] mb-1">
                  Importe devuelto (€, opcional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={cancellationRefundInput}
                  onChange={(e) => setCancellationRefundInput(e.target.value)}
                  placeholder="0.00 (dejar vacío si no procede devolución)"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#EDE4D7]">
                <button
                  type="button"
                  onClick={() => setCancellationModalParticipant(null)}
                  className="px-4 py-2 rounded-xl border border-[#EDE4D7] bg-white text-[#574B45] text-xs font-semibold hover:bg-[#F6F1EA] cursor-pointer"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Confirmar Cancelación</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CIERRE DE ASISTENCIA DE ACTIVIDAD (Bloque 5) */}
      {isCloseAttendanceModalOpen && closingAttendanceActivityId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-[#EDE4D7] animate-scaleUp">
            {(() => {
              const act = activities.find(a => a.id === closingAttendanceActivityId);
              const actParts = participants.filter(p => p.activityId === closingAttendanceActivityId);
              const pendingCount = actParts.filter(p => p.status === 'pendiente_pago' || p.status === 'pagada' || p.status === 'confirmada').length;

              return (
                <div>
                  <div className="flex items-center gap-3 pb-3 border-b border-[#EDE4D7]">
                    <div className="p-2.5 rounded-2xl bg-purple-100 text-purple-800">
                      <UserX className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold font-serif text-[#26201D]">
                        Cierre de Asistencia de Sala
                      </h3>
                      <p className="text-xs text-[#574B45]">
                        {act?.title}
                      </p>
                    </div>
                  </div>

                  <div className="py-4 space-y-3 text-xs text-[#574B45]">
                    <p>
                      Al cerrar la asistencia de esta actividad celebrada:
                    </p>
                    <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-purple-950 font-medium">
                      <strong>{pendingCount} persona{pendingCount !== 1 ? 's' : ''}</strong> con reserva que no realizaron check-in pasarán automáticamente a:
                      <div className="mt-1 text-xs font-bold text-rose-800 bg-white p-2 rounded-xl border border-purple-200">
                        • Estado: Cancelada (Injustificada)<br />
                        • Motivo: «No presentado»
                      </div>
                    </div>
                    <p className="text-[11px] text-[#8C7E77]">
                      Esta acción consolida el histórico de faltas de asistencia y no puede revertirse masivamente.
                    </p>
                  </div>

                  <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#EDE4D7]">
                    <button
                      type="button"
                      disabled={isClosingAttendanceLoading}
                      onClick={() => {
                        setIsCloseAttendanceModalOpen(false);
                        setClosingAttendanceActivityId(null);
                      }}
                      className="px-4 py-2 rounded-xl border border-[#EDE4D7] bg-white text-[#574B45] text-xs font-semibold hover:bg-[#F6F1EA] cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={isClosingAttendanceLoading || pendingCount === 0}
                      onClick={handleConfirmCloseAttendance}
                      className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isClosingAttendanceLoading ? (
                        <span>Cerrando...</span>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Confirmar Cierre ({pendingCount} afectados)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* MODAL: AUDITORÍA Y NORMALIZACIÓN DE ESTADOS (Bloque 5) */}
      {isMigrationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-[#EDE4D7] my-8 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-[#EDE4D7] mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-serif text-[#26201D]">
                    Auditoría y Normalización de Estados (Bloque 5)
                  </h3>
                  <p className="text-xs text-[#574B45]">
                    Simulación y corrección de inconsistencias hacia el modelo canónico
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMigrationModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-[#F6F1EA] text-[#574B45] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {migrationSuccessMsg && (
              <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{migrationSuccessMsg}</span>
              </div>
            )}

            {migrationSimulation && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-2xl bg-[#FCFAF7] border border-[#EDE4D7]">
                    <span className="text-[10px] text-[#574B45] uppercase font-bold">Total Registros</span>
                    <p className="text-xl font-bold font-serif text-[#26201D] mt-0.5">{migrationSimulation.totalParticipants}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                    <span className="text-[10px] text-emerald-800 uppercase font-bold">Ya Normalizados</span>
                    <p className="text-xl font-bold font-serif text-emerald-950 mt-0.5">{migrationSimulation.alreadyNormalized}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
                    <span className="text-[10px] text-amber-800 uppercase font-bold">Requieren Mapeo</span>
                    <p className="text-xl font-bold font-serif text-amber-950 mt-0.5">{migrationSimulation.affectedCount}</p>
                  </div>
                </div>

                {migrationSimulation.itemsToMigrate.length > 0 ? (
                  <div className="space-y-2">
                    <h5 className="font-bold text-xs text-[#26201D]">
                      Detalle de Registros a Normalizar ({migrationSimulation.itemsToMigrate.length}):
                    </h5>
                    <div className="max-h-60 overflow-y-auto rounded-xl border border-[#EDE4D7] divide-y divide-[#EDE4D7]">
                      {migrationSimulation.itemsToMigrate.map(item => (
                        <div key={item.id} className="p-3 bg-[#FCFAF7] flex items-center justify-between text-[11px]">
                          <div>
                            <span className="font-bold text-[#26201D]">{item.fullName}</span>
                            <span className="text-[#8C7E77] ml-2">({item.activityTitle})</span>
                            <div className="text-[10px] text-[#574B45] mt-0.5">{item.reason}</div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="line-through text-stone-400 font-mono">{item.previousStatus}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-[#521849]" />
                            <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-mono">
                              {item.targetStatus}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-center font-medium">
                    ✓ Todos los participantes se encuentran alineados al 100% con los 5 estados canónicos de Bloque 5.
                  </div>
                )}

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#EDE4D7]">
                  <button
                    type="button"
                    onClick={() => setIsMigrationModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-[#EDE4D7] bg-white text-[#574B45] text-xs font-semibold hover:bg-[#F6F1EA] cursor-pointer"
                  >
                    Cerrar
                  </button>
                  {migrationSimulation.itemsToMigrate.length > 0 && (
                    <button
                      type="button"
                      disabled={isApplyingMigration}
                      onClick={handleApplyCanonicalMigration}
                      className="px-5 py-2 rounded-xl bg-[#521849] hover:bg-[#3E1037] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isApplyingMigration ? (
                        <span>Normalizando...</span>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          <span>Ejecutar Normalización Canónica</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR ELIMINACIÓN */}
      {participantToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-[#EDE4D7] animate-scaleUp">
            <h3 className="text-lg font-bold font-serif text-[#26201D]">
              ¿Eliminar inscripción de {participantToDelete.fullName}?
            </h3>
            <p className="text-xs text-[#574B45] mt-2">
              Se eliminará el registro de este asistente para la actividad <strong>{participantToDelete.activityTitle}</strong> y se liberará el aforo correspondiente.
            </p>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setParticipantToDelete(null)}
                className="px-4 py-2 rounded-xl border border-[#EDE4D7] text-xs font-semibold text-[#574B45] hover:bg-[#F6F1EA] cursor-pointer"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                Sí, eliminar inscripción
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VISTA DE IMPRESIÓN / HOJA DE SALA PARA EL SUMILLER */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-3xl bg-white p-8 shadow-2xl border border-[#EDE4D7] my-8">
            <div className="flex items-center justify-between border-b border-[#EDE4D7] pb-4 mb-6 print:hidden">
              <h3 className="text-lg font-bold font-serif text-[#26201D]">
                Vista Previa de la Hoja de Sala
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-[#521849] hover:bg-[#3E1037] text-white text-xs font-semibold flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Documento</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-2 rounded-xl border border-[#EDE4D7] text-[#574B45] hover:text-[#26201D] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Content */}
            <div className="space-y-6 text-[#26201D]">
              <div className="flex items-start justify-between border-b-2 border-[#521849] pb-4">
                <div>
                  <span className="text-[11px] uppercase tracking-widest font-bold text-[#521849]">
                    Doña Berenjena • Asociación Enogastronómica
                  </span>
                  <h1 className="text-2xl font-bold font-serif mt-1">
                    Hoja de Control de Asistencia y Recepción de Sala
                  </h1>
                  <p className="text-xs text-[#574B45] mt-1 font-medium">
                    {currentActivity ? currentActivity.title : 'Listado de Comensales'}
                  </p>
                </div>
                <div className="text-right text-xs">
                  <p className="font-bold text-[#521849]">Fecha: {currentActivity?.date || new Date().toISOString().split('T')[0]}</p>
                  <p className="text-[#574B45]">Hora: {currentActivity?.time || '21:00 h'}</p>
                  <p className="text-[#574B45] font-semibold mt-1">
                    Aforo: {metrics.totalSpotsBooked} plazas ocupadas
                  </p>
                </div>
              </div>

              <table className="w-full text-left text-xs border border-stone-300">
                <thead>
                  <tr className="bg-stone-100 border-b border-stone-300 text-stone-800 font-bold">
                    <th className="p-2.5 w-10 text-center">Firma</th>
                    <th className="p-2.5">Asistente</th>
                    <th className="p-2.5">Teléfono</th>
                    <th className="p-2.5 text-center">Condición</th>
                    <th className="p-2.5">Turno / Socio</th>
                    <th className="p-2.5">Alergias & Requisitos de Cocina</th>
                    <th className="p-2.5">Estado Canónico</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-300">
                  {filteredParticipants.filter(p => p.status !== 'cancelada' && p.status !== 'lista_de_espera').map((p, idx) => (
                    <tr key={p.id} className="hover:bg-stone-50">
                      <td className="p-2.5 text-center">
                        <div className="w-5 h-5 border border-stone-400 rounded-sm mx-auto flex items-center justify-center">
                          {p.status === 'asistio' && <Check className="w-3.5 h-3.5 text-emerald-700" />}
                        </div>
                      </td>
                      <td className="p-2.5 font-bold font-serif">
                        {idx + 1}. {p.fullName}
                      </td>
                      <td className="p-2.5 font-mono text-[11px]">
                        {p.phone}
                      </td>
                      <td className="p-2.5 text-center font-semibold text-xs">
                        {p.isMember ? '⭐ Socio' : 'No socio'}
                      </td>
                      <td className="p-2.5 text-[11px]">
                        {p.turn || '-'} {p.membershipNumber ? `(${p.membershipNumber})` : ''}
                      </td>
                      <td className="p-2.5 text-[11px]">
                        {p.notes ? (
                          <strong className="text-red-700 bg-red-50 px-1 py-0.5 rounded">
                            ⚠️ {p.notes}
                          </strong>
                        ) : (
                          <span className="text-stone-400">-</span>
                        )}
                      </td>
                      <td className="p-2.5 text-[11px] capitalize">
                        {p.status === 'pendiente_pago' ? '⏳ Pendiente Pago' : p.status === 'asistio' ? '✅ Asistió' : '💳 Pagada'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pt-4 border-t border-stone-300 flex justify-between text-xs text-stone-600">
                <p>Generado el {new Date().toLocaleString('es-ES')}</p>
                <p>Doña Berenjena — Sede Oficial (C/ Mayor 14, Planta 1)</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
