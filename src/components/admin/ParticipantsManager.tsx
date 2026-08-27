import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Activity, Participant, ParticipantStatus, PaymentMethod } from '../../types';
import { sortActivitiesAscending, formatDisplayDate } from '../../utils/dateUtils';
import { Pagination } from '../common/Pagination';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Download, 
  Printer, 
  Copy, 
  Check, 
  Phone, 
  Mail, 
  FileText, 
  Wine, 
  ChevronDown, 
  X, 
  Sparkles, 
  MessageSquare, 
  AlertCircle, 
  DollarSign, 
  Calendar,
  Layers,
  UserCheck,
  UserX,
  XCircle,
  Ban,
  RefreshCw
} from 'lucide-react';

interface ParticipantsManagerProps {
  initialActivityId?: string | null;
  onCloseDetailedView?: () => void;
}

export const ParticipantsManager: React.FC<ParticipantsManagerProps> = ({
  initialActivityId = null,
  onCloseDetailedView
}) => {
  const { 
    activities, 
    participants, 
    addManualParticipant, 
    updateParticipant, 
    deleteParticipant, 
    markAttendance 
  } = useData();
  const { user } = useAuth();

  const [selectedActivityId, setSelectedActivityId] = useState<string>(initialActivityId || 'all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [participantToDelete, setParticipantToDelete] = useState<Participant | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // Dedicated Cancellation Modal state
  const [cancellationModalParticipant, setCancellationModalParticipant] = useState<Participant | null>(null);
  const [cancellationReasonInput, setCancellationReasonInput] = useState<string>('');
  const [cancellationRefundInput, setCancellationRefundInput] = useState<string>('');
  const [cancellationError, setCancellationError] = useState<string | null>(null);

  // Dedicated Reactivation Confirmation Modal state
  const [reactivationParticipant, setReactivationParticipant] = useState<Participant | null>(null);

  // Form State for Adding / Editing Participant
  const [formData, setFormData] = useState<{
    activityId: string;
    fullName: string;
    email: string;
    phone: string;
    isMember: boolean;
    groupId?: string;
    turn: string;
    membershipNumber: string;
    notes: string;
    status: ParticipantStatus;
    paymentMethod: PaymentMethod;
    cancellationReason?: string;
    refundAmount?: string;
  }>({
    activityId: '',
    fullName: '',
    email: '',
    phone: '',
    isMember: false,
    turn: '',
    membershipNumber: '',
    notes: '',
    status: 'confirmada',
    paymentMethod: 'bizum',
    cancellationReason: '',
    refundAmount: ''
  });

  // Filtered Activities (focusing on Catas and other events with bookings)
  const activeActivities = useMemo(() => {
    let filtered = activities.filter(a => a.status !== 'celebrada');
    
    // Si selectedActivityId no está en las filtradas, lo forzamos para que no se rompa el select
    // (Por ejemplo, cuando navegamos desde la tabla de Actividades Celebradas)
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

  // Filtered Participants
  const filteredParticipants = useMemo(() => {
    return participants.filter(p => {
      // Past Activities filter
      if (selectedActivityId === 'all') {
        const act = activities.find(a => a.id === p.activityId);
        if (act && act.status === 'celebrada') {
          return false;
        }
      }
      
      // Activity filter
      if (selectedActivityId !== 'all' && p.activityId !== selectedActivityId) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'all' && p.status !== statusFilter) {
        return false;
      }
      // Search term
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
  }, [participants, selectedActivityId, statusFilter, searchTerm, activities]);

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

  // Key Metrics Calculations
  const metrics = useMemo(() => {
    const relevant = selectedActivityId === 'all' 
      ? participants.filter(p => {
          const act = activities.find(a => a.id === p.activityId);
          if (act && act.status === 'celebrada') return false;
          return true;
        })
      : participants.filter(p => p.activityId === selectedActivityId);

    const activeParticipants = relevant.filter(p => p.status !== 'cancelada' && p.status !== 'lista_de_espera');
    const waitingListCount = relevant.filter(p => p.status === 'lista_de_espera').length;
    const totalSpotsBooked = activeParticipants.length;
    const sociosCount = activeParticipants.filter(p => p.isMember).length;
    const noSociosCount = activeParticipants.filter(p => !p.isMember).length;
    const withAllergies = activeParticipants.filter(p => p.notes && p.notes.trim().length > 0).length;
    const attendedCount = relevant.filter(p => p.status === 'asistio' || p.attended === true).length;
    const noShowCount = relevant.filter(p => p.status === 'no_asistio').length;
    const cancelledCount = relevant.filter(p => p.status === 'cancelada').length;
    const confirmedCount = relevant.filter(p => p.status === 'confirmada').length;
    const pendingPaymentCount = relevant.filter(p => p.status === 'pendiente_pago').length;

    let maxCapacity = 0;
    if (selectedActivityId === 'all') {
      maxCapacity = activities.reduce((sum, a) => {
        if (a.status === 'celebrada') return sum;
        return sum + (a.totalSpots || 0);
      }, 0);
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
      attendedCount,
      noShowCount,
      cancelledCount,
      confirmedCount,
      pendingPaymentCount
    };
  }, [participants, selectedActivityId, activities, currentActivity]);

  // Open modal for new manual participant
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
      status: 'confirmada',
      paymentMethod: 'bizum',
      cancellationReason: '',
      refundAmount: ''
    });
    setIsModalOpen(true);
  };

  // Open modal for editing participant
  const handleOpenEditModal = (p: Participant) => {
    setEditingParticipant(p);
    setFormData({
      activityId: p.activityId,
      fullName: p.fullName || '',
      email: p.email || '',
      phone: p.phone || '',
      isMember: p.isMember,
      groupId: p.groupId,
      turn: p.turn || '',
      membershipNumber: p.membershipNumber || '',
      notes: p.notes || '',
      status: p.status,
      paymentMethod: p.paymentMethod || 'bizum',
      cancellationReason: p.cancellationReason || '',
      refundAmount: p.refundAmount !== undefined ? String(p.refundAmount) : ''
    });
    setIsModalOpen(true);
  };

  // Open dedicated cancellation modal
  const handleOpenCancellationModal = (p: Participant) => {
    setCancellationModalParticipant(p);
    setCancellationReasonInput('');
    setCancellationRefundInput(p.totalAmount ? String(p.totalAmount) : '');
    setCancellationError(null);
  };

  // Confirm cancellation with mandatory reason and optional refund
  const handleConfirmCancellation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellationModalParticipant) return;

    if (!cancellationReasonInput.trim()) {
      setCancellationError('Por favor, indica el motivo de la cancelación.');
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

    await updateParticipant(cancellationModalParticipant.id, {
      status: 'cancelada',
      attended: false,
      cancellationReason: cancellationReasonInput.trim(),
      cancelledAt: new Date().toISOString(),
      cancelledBy: user?.name || user?.email || 'Secretaría / Administración',
      refundAmount: parsedRefund
    });

    setCancellationModalParticipant(null);
    setCancellationReasonInput('');
    setCancellationRefundInput('');
    setCancellationError(null);
  };

  // Confirm reactivation of a cancelled reservation
  const handleConfirmReactivation = async () => {
    if (!reactivationParticipant) return;
    await updateParticipant(reactivationParticipant.id, {
      status: 'confirmada',
      attended: false
    });
    setReactivationParticipant(null);
  };

  // Save Participant Form (Add or Edit)
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.activityId) return;

    const targetActivity = activities.find(a => a.id === formData.activityId);
    if (!targetActivity) return;

    const priceMember = targetActivity.priceMember;
    const priceNonMember = targetActivity.priceNonMember;
    const calculatedPrice = formData.isMember ? priceMember : priceNonMember;

    if (editingParticipant) {
      const isNowCancelled = formData.status === 'cancelada';
      let parsedRefund: number | undefined = undefined;
      if (formData.refundAmount && formData.refundAmount.trim() !== '') {
        const num = parseFloat(formData.refundAmount.replace(',', '.'));
        if (!isNaN(num) && num >= 0) {
          parsedRefund = num;
        }
      }

      await updateParticipant(editingParticipant.id, {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        isMember: formData.isMember,
        turn: formData.turn.trim() || undefined,
        membershipNumber: formData.membershipNumber.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        status: formData.status,
        paymentMethod: formData.paymentMethod,
        totalAmount: calculatedPrice,
        ...(isNowCancelled ? {
          cancellationReason: formData.cancellationReason?.trim() || editingParticipant.cancellationReason || 'Cancelada en edición',
          cancelledAt: editingParticipant.cancelledAt || new Date().toISOString(),
          cancelledBy: editingParticipant.cancelledBy || user?.name || user?.email || 'Administración',
          refundAmount: parsedRefund !== undefined ? parsedRefund : editingParticipant.refundAmount
        } : {})
      });
    } else {
      // Create
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
        status: formData.status,
        paymentMethod: formData.paymentMethod,
        totalAmount: calculatedPrice
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

  // Export to CSV with full cancellation and tracking columns
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
      'Estado', 
      'Metodo_Pago', 
      'Total_Euros', 
      'Motivo_Cancelacion',
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
      `"${(p.cancellationReason || p.justificationReason || '').replace(/"/g, '""')}"`,
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
    text += `👥 *Total plazas reservadas:* ${metrics.totalSpotsBooked}\n`;
    text += `⚠️ *Alergias registradas:* ${metrics.withAllergies}\n\n`;
    text += `--- LISTADO DE COMENSALES ---\n`;

    filteredParticipants.forEach((p, idx) => {
      text += `${idx + 1}. *${p.fullName}* ${p.isMember ? '(Socio)' : '(No socio)'}`;
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
                Control de Asistencia
              </span>
              {currentActivity && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#521849]/10 text-[#521849] text-[11px] font-bold">
                  Filtrando por actividad
                </span>
              )}
            </div>
            <h3 className="text-xl sm:text-2xl font-bold font-serif text-[#26201D] mt-1">
              Reservas de Próximas Actividades
            </h3>
            <p className="text-xs text-[#574B45] mt-0.5">
              Gestión centralizada de comensales, plazas confirmadas, alergias alimentarias y hojas de sala para sumillería.
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
              <span>+ Nueva Reserva Manual</span>
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
              title="Descargar listado en CSV / Excel"
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
                <option value="all">🌟 Todas las Próximas Actividades</option>
                {activeActivities.map(act => {
                  const actParticipants = participants.filter(p => p.activityId === act.id);
                  const actSpots = actParticipants.filter(p => p.status !== 'cancelada').length;
                  return (
                    <option key={act.id} value={act.id}>
                      {act.type === 'cata' ? '🍷' : act.type === 'curso' ? '🍳' : '🧳'} {new Date(act.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })} — {act.title} ({actSpots}/{act.totalSpots} plazas)
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="w-4 h-4 text-[#574B45] absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-3">
            <label className="block text-[11px] font-bold text-[#574B45] uppercase tracking-wider mb-1">
              Estado:
            </label>
            <select
              id="select-participant-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs font-medium text-[#26201D] focus:outline-none focus:border-[#521849] focus:bg-white cursor-pointer"
            >
              <option value="all">Todos los estados ({metrics.totalBookings})</option>
              <option value="confirmada">✅ Confirmadas ({metrics.confirmedCount})</option>
              <option value="asistio">🎉 Asistió / En Sala ({metrics.attendedCount})</option>
              <option value="no_asistio">⚠️ No asistió ({metrics.noShowCount})</option>
              <option value="cancelada">❌ Canceladas ({metrics.cancelledCount})</option>
              <option value="pendiente_pago">⏳ Pendientes de Pago ({metrics.pendingPaymentCount})</option>
              <option value="lista_de_espera">📋 Lista de Espera ({metrics.waitingListCount})</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="sm:col-span-4">
            <label className="block text-[11px] font-bold text-[#574B45] uppercase tracking-wider mb-1">
              Buscar comensal:
            </label>
            <div className="relative">
              <input
                id="input-search-participant"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nombre, teléfono, email, alergia..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs text-[#26201D] focus:outline-none focus:border-[#521849] focus:bg-white"
              />
              <Search className="w-4 h-4 text-[#574B45] absolute left-3 top-2.5" />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2.5 text-[#574B45] hover:text-[#26201D]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Interactive Quick Status Filter Pills */}
        <div className="pt-2 border-t border-[#F6F1EA] flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-[#574B45] uppercase tracking-wider mr-1">Filtro Rápido:</span>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-[#521849] text-white shadow-2xs'
                : 'bg-[#FCFAF7] hover:bg-[#F6F1EA] text-[#574B45] border border-[#EDE4D7]'
            }`}
          >
            Todos ({metrics.totalBookings})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('confirmada')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              statusFilter === 'confirmada'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}
          >
            <CheckCircle className="w-3 h-3" />
            <span>Confirmadas ({metrics.confirmedCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('asistio')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              statusFilter === 'asistio'
                ? 'bg-purple-700 text-white shadow-2xs'
                : 'bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>En Sala ({metrics.attendedCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('no_asistio')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              statusFilter === 'no_asistio'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300'
            }`}
          >
            <UserX className="w-3 h-3" />
            <span>No Asistió ({metrics.noShowCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('cancelada')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              statusFilter === 'cancelada'
                ? 'bg-rose-700 text-white shadow-2xs'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200'
            }`}
          >
            <XCircle className="w-3 h-3" />
            <span>Canceladas ({metrics.cancelledCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pendiente_pago')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              statusFilter === 'pendiente_pago'
                ? 'bg-amber-700 text-white shadow-2xs'
                : 'bg-amber-50/60 hover:bg-amber-100/80 text-amber-900 border border-amber-200'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>Pendientes ({metrics.pendingPaymentCount})</span>
          </button>
          {metrics.waitingListCount > 0 && (
            <button
              type="button"
              onClick={() => setStatusFilter('lista_de_espera')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                statusFilter === 'lista_de_espera'
                  ? 'bg-blue-700 text-white shadow-2xs'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Lista Espera ({metrics.waitingListCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid with No-Shows and Cancellations */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: Plazas Ocupadas / Aforo */}
        <div className="bg-white rounded-2xl border border-[#EDE4D7] p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#574B45] mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Aforo Ocupado</span>
            <Users className="w-4 h-4 text-[#521849]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold font-serif text-[#26201D]">
              {metrics.totalSpotsBooked}
            </span>
            {metrics.maxCapacity > 0 && (
              <span className="text-[11px] text-[#574B45]">
                / {metrics.maxCapacity}
              </span>
            )}
          </div>
          {metrics.maxCapacity > 0 && (
            <div className="mt-1.5 w-full bg-[#EDE4D7] h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-[#521849] h-full rounded-full transition-all duration-300"
                style={{ width: `${metrics.occupancyRate}%` }}
              />
            </div>
          )}
          <p className="text-[10px] text-[#574B45] mt-1 truncate">
            {metrics.occupancyRate}% de ocupación
          </p>
        </div>

        {/* Card 2: Asistieron / En Sala */}
        <div className="bg-white rounded-2xl border border-purple-200/80 bg-purple-50/20 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-purple-900 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">En Sala / Asistió</span>
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold font-serif text-purple-950">
              {metrics.attendedCount}
            </span>
            <span className="text-[11px] text-purple-700">plazas</span>
          </div>
          <p className="text-[10px] text-purple-800 mt-1 truncate">
            {metrics.attendedCount > 0 ? 'Asistencia confirmada' : 'Pendiente check-in'}
          </p>
        </div>

        {/* Card 3: No Asistencias */}
        <div className="bg-white rounded-2xl border border-amber-200 bg-amber-50/30 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-amber-900 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">No Asistencias</span>
            <UserX className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold font-serif text-amber-950">
              {metrics.noShowCount}
            </span>
            <span className="text-[11px] text-amber-800">faltas</span>
          </div>
          <p className="text-[10px] text-amber-700 mt-1 truncate">
            {metrics.noShowCount > 0 ? '⚠️ No presentados' : 'Sin ausencias registradas'}
          </p>
        </div>

        {/* Card 4: Cancelaciones */}
        <div className="bg-white rounded-2xl border border-rose-200 bg-rose-50/30 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-rose-900 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Cancelaciones</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold font-serif text-rose-950">
              {metrics.cancelledCount}
            </span>
            <span className="text-[11px] text-rose-800">bajas</span>
          </div>
          <p className="text-[10px] text-rose-700 mt-1 truncate">
            {metrics.cancelledCount > 0 ? 'Plazas liberadas' : 'Cero cancelaciones'}
          </p>
        </div>

        {/* Card 5: Lista de Espera */}
        <div className="bg-white rounded-2xl border border-blue-200 bg-blue-50/20 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-blue-900 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Lista de Espera</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold font-serif text-blue-950">
              {metrics.waitingListCount}
            </span>
            <span className="text-[11px] text-blue-800">en cola</span>
          </div>
          <p className="text-[10px] text-blue-700 mt-1 truncate">
            {metrics.waitingListCount > 0 ? 'Pendientes de vacante' : 'Sin personas en espera'}
          </p>
        </div>

        {/* Card 6: Socios vs No Socios */}
        <div className="bg-white rounded-2xl border border-[#EDE4D7] p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#574B45] mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Socios / No Socios</span>
            <UserCheck className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-bold font-serif text-emerald-800">
              {metrics.sociosCount}
            </span>
            <span className="text-[11px] text-[#574B45]">
              / {metrics.noSociosCount} no socios
            </span>
          </div>
          <p className="text-[10px] text-[#574B45] mt-1 truncate">
            {metrics.withAllergies > 0 ? `⚠️ ${metrics.withAllergies} con alergias` : 'Distribución confirmada'}
          </p>
        </div>
      </div>

      {/* Waiting List Alert Banner if applicable */}
      {metrics.waitingListCount > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 border border-blue-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-blue-950 text-sm">
                  {metrics.waitingListCount} persona{metrics.waitingListCount !== 1 ? 's' : ''} en Lista de Espera
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-200/80 text-blue-900 text-[10px] font-bold uppercase tracking-wider">
                  Sin asignar aforo
                </span>
              </div>
              <p className="text-xs text-blue-800/90 mt-0.5">
                Si un asistente confirmado cancela su plaza, puedes asignar la vacante a las personas en espera con un solo clic pulsando «Asignar Plaza».
              </p>
            </div>
          </div>
          {statusFilter !== 'lista_de_espera' && (
            <button
              type="button"
              onClick={() => setStatusFilter('lista_de_espera')}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs whitespace-nowrap cursor-pointer transition-colors shadow-2xs self-start sm:self-center"
            >
              Ver Lista de Espera ({metrics.waitingListCount})
            </button>
          )}
        </div>
      )}

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
                <th className="p-4">Estado & Pago</th>
                <th className="p-4">Fecha Registro</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE4D7]">
              {paginatedParticipants.map((p) => (
                <tr 
                  key={p.id} 
                  className={`hover:bg-[#FCFAF7] transition-colors ${
                    p.status === 'cancelada' ? 'opacity-60 bg-stone-50' : 
                    p.status === 'lista_de_espera' ? 'bg-blue-50/30' : ''
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
                      {p.activityTitle || 'Cata Seleccionada'}
                    </p>
                    <p className="text-[11px] text-[#574B45]">
                      {p.activityDate}
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

                  {/* Estado y Pago */}
                  <td className="p-4">
                    <div className="space-y-1.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        p.status === 'confirmada'
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.status === 'pendiente_pago'
                          ? 'bg-amber-100 text-amber-800'
                          : p.status === 'asistio'
                          ? 'bg-purple-100 text-purple-800'
                          : p.status === 'no_asistio'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : p.status === 'lista_de_espera'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}>
                        {p.status === 'confirmada' && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                        {p.status === 'pendiente_pago' && <Clock className="w-3 h-3 text-amber-600" />}
                        {p.status === 'asistio' && <Sparkles className="w-3 h-3 text-purple-600" />}
                        {p.status === 'no_asistio' && <UserX className="w-3 h-3 text-amber-700" />}
                        {p.status === 'lista_de_espera' && <Clock className="w-3 h-3 text-blue-600" />}
                        {p.status === 'cancelada' && <XCircle className="w-3 h-3 text-rose-600" />}
                        <span>
                          {p.status === 'confirmada' ? 'Confirmada' :
                           p.status === 'pendiente_pago' ? 'Pendiente Pago' :
                           p.status === 'asistio' ? 'Asistió (En Sala)' :
                           p.status === 'no_asistio' ? 'No Asistió' :
                           p.status === 'lista_de_espera' ? 'Lista de Espera' : 'Cancelada'}
                        </span>
                      </span>

                      {/* Motivo de cancelación si está cancelada */}
                      {p.status === 'cancelada' && (p.cancellationReason || p.cancelledAt || p.refundAmount !== undefined) && (
                        <div className="p-1.5 rounded-lg bg-rose-50 border border-rose-200/80 text-[10px] text-rose-950 space-y-0.5 max-w-[220px]">
                          {p.cancellationReason && (
                            <p className="line-clamp-2 italic text-rose-900" title={p.cancellationReason}>
                              «{p.cancellationReason}»
                            </p>
                          )}
                          <div className="text-[9px] text-rose-800/80">
                            {p.cancelledAt && <span>{new Date(p.cancelledAt).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>}
                            {p.cancelledBy && <span> • Por {p.cancelledBy}</span>}
                          </div>
                          {p.refundAmount !== undefined && (
                            <div className="font-bold text-rose-950 bg-rose-200/60 px-1.5 py-0.5 rounded text-[9px] inline-block">
                              Devolución: {p.refundAmount} €
                            </div>
                          )}
                        </div>
                      )}

                      {/* Nota de justificación si es no asistencia */}
                      {p.status === 'no_asistio' && p.justified && (
                        <div className="p-1 rounded-md bg-emerald-50 border border-emerald-200 text-[9px] text-emerald-900 font-semibold inline-block">
                          ✓ Falta Justificada {p.justificationReason ? `(${p.justificationReason})` : ''}
                        </div>
                      )}

                      {p.paymentMethod && (
                        <div className="text-[10px] text-[#574B45] font-medium flex items-center gap-1">
                          <span>Pago:</span>
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

                  {/* Acciones */}
                  <td className="p-4 text-right space-x-1">
                    {p.status === 'lista_de_espera' && (
                      <button
                        type="button"
                        onClick={() => updateParticipant(p.id, { status: 'confirmada' })}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-[11px] cursor-pointer"
                        title="Asignar plaza y pasar a confirmada"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Asignar Plaza</span>
                      </button>
                    )}
                    {p.status !== 'asistio' && p.status !== 'cancelada' && p.status !== 'lista_de_espera' && (
                      <button
                        type="button"
                        onClick={() => markAttendance(p.id, true)}
                        className="p-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                        title="Marcar Asistencia (Comensal en Sala)"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {p.status === 'asistio' && (
                      <button
                        type="button"
                        onClick={() => markAttendance(p.id, false)}
                        className="p-1.5 rounded-lg border border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100 cursor-pointer"
                        title="Desmarcar Asistencia (volver a Confirmada)"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {p.status !== 'no_asistio' && p.status !== 'cancelada' && p.status !== 'lista_de_espera' && (
                      <button
                        type="button"
                        onClick={() => updateParticipant(p.id, { status: 'no_asistio', attended: false })}
                        className="p-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 cursor-pointer"
                        title="Marcar No Asistencia (Falta)"
                      >
                        <UserX className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {p.status === 'no_asistio' && (
                      <button
                        type="button"
                        onClick={() => updateParticipant(p.id, { status: 'confirmada' })}
                        className="p-1.5 rounded-lg border border-amber-300 bg-white text-amber-800 hover:bg-amber-50 cursor-pointer"
                        title="Restablecer a Confirmada"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {p.status !== 'cancelada' && p.status !== 'lista_de_espera' && (
                      <button
                        type="button"
                        onClick={() => handleOpenCancellationModal(p)}
                        className="p-1.5 rounded-lg border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 cursor-pointer"
                        title="Cancelar Reserva (Libera plaza con motivo y devolución)"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {p.status === 'cancelada' && (
                      <button
                        type="button"
                        onClick={() => setReactivationParticipant(p)}
                        className="p-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                        title="Reactivar Reserva Cancelada"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(p)}
                      className="p-1.5 rounded-lg border border-[#EDE4D7] text-[#521849] hover:bg-[#F6EDF4] cursor-pointer"
                      title="Editar Reserva"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setParticipantToDelete(p)}
                      className="p-1.5 rounded-lg border border-[#EDE4D7] text-[#9B3E26] hover:bg-rose-50 cursor-pointer"
                      title="Eliminar Reserva"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredParticipants.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#574B45]">
                    <Users className="w-8 h-8 text-[#574B45]/40 mx-auto mb-2" />
                    <p className="font-semibold text-sm text-[#26201D]">No se encontraron reservas con los filtros aplicados</p>
                    <p className="text-xs text-[#574B45] mt-1">
                      {participants.length === 0 
                        ? 'Aún no hay ningún asistente registrado. Puedes añadir uno manualmente con el botón "+ Nueva Reserva Manual".' 
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
          itemLabel="reservas"
        />
      </div>

      {/* MODAL: AÑADIR / EDITAR PARTICIPANTE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-[#EDE4D7] max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-[#574B45] hover:text-[#26201D] hover:bg-[#F6F1EA]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <span className="text-xs uppercase tracking-widest font-bold text-[#521849]">
                {editingParticipant ? 'Modificar Registro' : 'Nueva Reserva Manual'}
              </span>
              <h3 className="text-xl font-bold font-serif text-[#26201D] mt-1">
                {editingParticipant ? `Editar Asistente: ${editingParticipant.fullName}` : 'Registrar Asistente para Cata'}
              </h3>
              <p className="text-xs text-[#574B45] mt-0.5">
                Los cambios actualizarán automáticamente el aforo disponible de la actividad seleccionada.
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
                  value={formData.activityId}
                  onChange={(e) => setFormData({ ...formData, activityId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs font-medium text-[#26201D] focus:outline-none focus:border-[#521849] focus:bg-white"
                >
                  <option value="">-- Selecciona una actividad --</option>
                  {activeActivities.map(act => (
                    <option key={act.id} value={act.id}>
                      {new Date(act.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })} — {act.title} ({act.priceNonMember}€/plaza)
                    </option>
                  ))}
                </select>
              </div>

              {/* Nombre y Apellidos */}
              <div>
                <label className="block text-xs font-semibold text-[#26201D] mb-1">
                  Nombre y Apellidos del Asistente *
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
                      onChange={(e) => setFormData({ ...formData, isMember: e.target.checked })}
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

              {/* Status and Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#26201D] mb-1">
                    Estado de la Reserva *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ParticipantStatus })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs focus:outline-none focus:border-[#521849] focus:bg-white"
                  >
                    <option value="confirmada">Confirmada</option>
                    <option value="pendiente_pago">Pendiente de Pago</option>
                    <option value="lista_de_espera">Lista de Espera</option>
                    <option value="asistio">Asistió (En Sala)</option>
                    <option value="no_asistio">No Asistió (Falta)</option>
                    <option value="cancelada">Cancelada (Libera Aforo)</option>
                  </select>
                </div>

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
              </div>

              {/* Campos condicionales de Cancelación si el estado es cancelada */}
              {formData.status === 'cancelada' && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 space-y-3 animate-fadeIn">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-950">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Detalles de Cancelación de Reserva</span>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-rose-950 mb-1">
                      Motivo de la baja / cancelación *
                    </label>
                    <textarea
                      required={formData.status === 'cancelada'}
                      rows={2}
                      value={formData.cancellationReason || ''}
                      onChange={(e) => setFormData({ ...formData, cancellationReason: e.target.value })}
                      placeholder="Indicar motivo de la cancelación..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-rose-300 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-rose-950 mb-1">
                      Importe reembolsado / devuelto (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.refundAmount || ''}
                      onChange={(e) => setFormData({ ...formData, refundAmount: e.target.value })}
                      placeholder="0.00 (dejar vacío si no procede devolución)"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-rose-300 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>
              )}

              {/* Alergias / Observaciones */}
              <div>
                <label className="block text-xs font-semibold text-[#26201D] mb-1">
                  Alergias / Intolerancias / Notas para Cocina
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Indicar intolerancias (gluten, marisco, lactosa, vegetarianos, mesa especial...)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs focus:outline-none focus:border-[#521849] focus:bg-white resize-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#EDE4D7]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#EDE4D7] bg-white text-[#574B45] text-xs font-semibold hover:bg-[#F6F1EA]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#521849] hover:bg-[#3E1037] text-white text-xs font-semibold shadow-xs"
                >
                  {editingParticipant ? 'Guardar Cambios' : 'Registrar Asistente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR ELIMINACIÓN */}
      {participantToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-[#EDE4D7]">
            <h3 className="text-lg font-bold font-serif text-[#26201D]">
              ¿Eliminar reserva de {participantToDelete.fullName}?
            </h3>
            <p className="text-xs text-[#574B45] mt-2">
              Se eliminará el registro de este asistente para la actividad <strong>{participantToDelete.activityTitle}</strong> y se liberará el aforo correspondiente.
            </p>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setParticipantToDelete(null)}
                className="px-4 py-2 rounded-xl border border-[#EDE4D7] text-xs font-semibold text-[#574B45] hover:bg-[#F6F1EA]"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold shadow-xs"
              >
                Sí, eliminar reserva
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
                  className="p-2 rounded-xl border border-[#EDE4D7] text-[#574B45] hover:text-[#26201D]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Content */}
            <div className="space-y-6 text-[#26201D]">
              {/* Header */}
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
                    Aforo: {metrics.totalSpotsBooked} plazas reservadas
                  </p>
                </div>
              </div>

              {/* Table for print */}
              <table className="w-full text-left text-xs border border-stone-300">
                <thead>
                  <tr className="bg-stone-100 border-b border-stone-300 text-stone-800 font-bold">
                    <th className="p-2.5 w-10 text-center">Firma</th>
                    <th className="p-2.5">Asistente</th>
                    <th className="p-2.5">Teléfono</th>
                    <th className="p-2.5 text-center">Condición</th>
                    <th className="p-2.5">Turno / Socio</th>
                    <th className="p-2.5">Alergias & Requisitos de Cocina</th>
                    <th className="p-2.5">Estado Pago</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-300">
                  {filteredParticipants.filter(p => p.status !== 'cancelada').map((p, idx) => (
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
                        {p.status === 'pendiente_pago' ? '⏳ Pendiente' : '✅ Pagado'} ({p.paymentMethod || 'bizum'})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Footer Summary */}
              <div className="pt-4 border-t border-stone-300 flex justify-between text-xs text-stone-600">
                <p>Generado el {new Date().toLocaleString('es-ES')}</p>
                <p>Doña Berenjena — Sede Oficial (C/ Mayor 14, Planta 1)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR CANCELACIÓN DE RESERVA */}
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
                    Cancelar Reserva
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
                  <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                  <span>Actividad: {cancellationModalParticipant.activityTitle}</span>
                </div>
                <p className="text-[11px] text-amber-800">
                  Esta acción cambiará el estado a <strong>Cancelada</strong> y liberará de inmediato la plaza para el aforo y la lista de espera.
                </p>
              </div>

              {cancellationError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{cancellationError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#26201D] mb-1">
                  Motivo de la cancelación / baja <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={cancellationReasonInput}
                  onChange={(e) => setCancellationReasonInput(e.target.value)}
                  placeholder="Ej. Aviso por teléfono / WhatsApp con más de 48h de antelación..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#26201D] mb-1">
                  Importe devuelto o abonado (€)
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
                <p className="text-[10px] text-[#574B45] mt-1">
                  Importe de la reserva original: <strong>{cancellationModalParticipant.totalAmount || 0} €</strong>.
                </p>
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

      {/* MODAL: REACTIVAR RESERVA CANCELADA */}
      {reactivationParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-[#EDE4D7] animate-scaleUp">
            <div className="flex items-center gap-3 pb-3 border-b border-[#EDE4D7]">
              <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-800">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold font-serif text-[#26201D]">
                  Reactivar Reserva Cancelada
                </h3>
                <p className="text-xs text-[#574B45]">
                  {reactivationParticipant.fullName}
                </p>
              </div>
            </div>

            <div className="py-4 space-y-2 text-xs text-[#574B45]">
              <p>
                ¿Deseas reactivar la reserva para la actividad <strong>{reactivationParticipant.activityTitle}</strong>?
              </p>
              <p className="text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                ⚠️ El estado pasará a <strong>Confirmada</strong> y volverá a computar como plaza ocupada en el aforo.
              </p>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#EDE4D7]">
              <button
                type="button"
                onClick={() => setReactivationParticipant(null)}
                className="px-4 py-2 rounded-xl border border-[#EDE4D7] bg-white text-[#574B45] text-xs font-semibold hover:bg-[#F6F1EA] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReactivation}
                className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Sí, Reactivar Reserva</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
