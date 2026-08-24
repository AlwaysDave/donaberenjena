import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Activity, Participant, ParticipantStatus, PaymentMethod } from '../../types';
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
  Layers
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

  const [selectedActivityId, setSelectedActivityId] = useState<string>(initialActivityId || 'all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [participantToDelete, setParticipantToDelete] = useState<Participant | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // Form State for Adding / Editing Participant
  const [formData, setFormData] = useState<{
    activityId: string;
    fullName: string;
    email: string;
    phone: string;
    spots: number;
    turn: string;
    membershipNumber: string;
    notes: string;
    status: ParticipantStatus;
    paymentMethod: PaymentMethod;
  }>({
    activityId: '',
    fullName: '',
    email: '',
    phone: '',
    spots: 1,
    turn: '',
    membershipNumber: '',
    notes: '',
    status: 'confirmada',
    paymentMethod: 'bizum'
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
    return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [activities, selectedActivityId]);

  const currentActivity = useMemo(() => {
    if (selectedActivityId === 'all') return null;
    return activities.find(a => a.id === selectedActivityId) || null;
  }, [activities, selectedActivityId]);

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
        const matchesName = p.fullName.toLowerCase().includes(query);
        const matchesEmail = p.email.toLowerCase().includes(query);
        const matchesPhone = p.phone.toLowerCase().includes(query);
        const matchesSocio = p.membershipNumber?.toLowerCase().includes(query);
        const matchesNotes = p.notes?.toLowerCase().includes(query);
        const matchesActTitle = p.activityTitle?.toLowerCase().includes(query);
        return matchesName || matchesEmail || matchesPhone || matchesSocio || matchesNotes || matchesActTitle;
      }
      return true;
    });
  }, [participants, selectedActivityId, statusFilter, searchTerm, activities]);

  // Key Metrics Calculations
  const metrics = useMemo(() => {
    const relevant = selectedActivityId === 'all' 
      ? participants.filter(p => {
          const act = activities.find(a => a.id === p.activityId);
          if (act && act.status === 'celebrada') return false;
          return true;
        })
      : participants.filter(p => p.activityId === selectedActivityId);

    const activeParticipants = relevant.filter(p => p.status !== 'cancelada');
    const totalSpotsBooked = activeParticipants.reduce((sum, p) => sum + (p.spots || 0), 0);
    const totalExpectedRevenue = activeParticipants.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
    const withAllergies = activeParticipants.filter(p => p.notes && p.notes.trim().length > 0).length;
    const attendedCount = relevant.filter(p => p.status === 'asistio').reduce((sum, p) => sum + p.spots, 0);

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
      maxCapacity,
      occupancyRate,
      totalExpectedRevenue,
      withAllergies,
      attendedCount
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
      spots: 1,
      turn: act?.time ? `Turno (${act.time})` : '',
      membershipNumber: '',
      notes: '',
      status: 'confirmada',
      paymentMethod: 'bizum'
    });
    setIsModalOpen(true);
  };

  // Open modal for editing participant
  const handleOpenEditModal = (p: Participant) => {
    setEditingParticipant(p);
    setFormData({
      activityId: p.activityId,
      fullName: p.fullName,
      email: p.email,
      phone: p.phone,
      spots: p.spots,
      turn: p.turn || '',
      membershipNumber: p.membershipNumber || '',
      notes: p.notes || '',
      status: p.status,
      paymentMethod: p.paymentMethod || 'bizum'
    });
    setIsModalOpen(true);
  };

  // Save Participant Form (Add or Edit)
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.activityId) return;

    const targetActivity = activities.find(a => a.id === formData.activityId);
    if (!targetActivity) return;

    const totalAmount = formData.spots * (targetActivity.price || 0);

    if (editingParticipant) {
      // Update
      await updateParticipant(editingParticipant.id, {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        spots: Number(formData.spots),
        turn: formData.turn.trim() || undefined,
        membershipNumber: formData.membershipNumber.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        status: formData.status,
        paymentMethod: formData.paymentMethod,
        totalAmount
      });
    } else {
      // Create
      await addManualParticipant({
        activityId: formData.activityId,
        activityTitle: targetActivity.title,
        activityDate: targetActivity.date,
        activityType: targetActivity.type,
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        spots: Number(formData.spots),
        turn: formData.turn.trim() || (targetActivity.time ? `Turno (${targetActivity.time})` : undefined),
        membershipNumber: formData.membershipNumber.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        status: formData.status,
        paymentMethod: formData.paymentMethod,
        totalAmount
      });
    }

    setIsModalOpen(false);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!participantToDelete) return;
    await deleteParticipant(participantToDelete.id, participantToDelete.activityId, participantToDelete.spots);
    setParticipantToDelete(null);
  };

  // Export to CSV
  const handleExportCsv = () => {
    const headers = ['ID', 'Actividad', 'Fecha', 'Nombre Asistente', 'Email', 'Telefono', 'Plazas', 'Turno', 'N_Socio', 'Alergias_Observaciones', 'Estado', 'Metodo_Pago', 'Total_Euros', 'Fecha_Registro'];
    const rows = filteredParticipants.map(p => [
      `"${p.id}"`,
      `"${(p.activityTitle || '').replace(/"/g, '""')}"`,
      `"${p.activityDate || ''}"`,
      `"${(p.fullName || '').replace(/"/g, '""')}"`,
      `"${p.email || ''}"`,
      `"${p.phone || ''}"`,
      p.spots,
      `"${p.turn || ''}"`,
      `"${p.membershipNumber || ''}"`,
      `"${(p.notes || '').replace(/"/g, '""')}"`,
      `"${p.status}"`,
      `"${p.paymentMethod || ''}"`,
      p.totalAmount || 0,
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
      text += `${idx + 1}. *${p.fullName}* (${p.spots} ${p.spots === 1 ? 'plaza' : 'plazas'})`;
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
                  const actSpots = actParticipants.filter(p => p.status !== 'cancelada').reduce((s, p) => s + p.spots, 0);
                  return (
                    <option key={act.id} value={act.id}>
                      {act.type === 'cata' ? '🍷' : act.type === 'curso' ? '🍳' : '🧳'} {act.date} — {act.title} ({actSpots}/{act.totalSpots} plazas)
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
              <option value="all">Todos los estados</option>
              <option value="confirmada">✅ Confirmadas</option>
              <option value="pendiente_pago">⏳ Pendientes de Pago</option>
              <option value="asistio">🎉 Asistió (Presente)</option>
              <option value="cancelada">❌ Canceladas</option>
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
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Card 1: Plazas Ocupadas */}
        <div className="bg-white rounded-2xl border border-[#EDE4D7] p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#574B45] mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Aforo Ocupado</span>
            <Users className="w-4 h-4 text-[#521849]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-serif text-[#26201D]">
              {metrics.totalSpotsBooked}
            </span>
            {metrics.maxCapacity > 0 && (
              <span className="text-xs text-[#574B45]">
                / {metrics.maxCapacity} plazas
              </span>
            )}
          </div>
          {metrics.maxCapacity > 0 && (
            <div className="mt-2 w-full bg-[#EDE4D7] h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-[#521849] h-full rounded-full transition-all duration-300"
                style={{ width: `${metrics.occupancyRate}%` }}
              />
            </div>
          )}
        </div>

        {/* Card 2: Total Reservas */}
        <div className="bg-white rounded-2xl border border-[#EDE4D7] p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#574B45] mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Reservas Registradas</span>
            <Layers className="w-4 h-4 text-[#521849]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-serif text-[#26201D]">
              {metrics.totalBookings}
            </span>
            <span className="text-xs text-[#574B45]">solicitudes</span>
          </div>
          <p className="text-[10px] text-[#574B45] mt-1">
            {metrics.attendedCount > 0 ? `${metrics.attendedCount} plazas confirmadas en sala` : 'Pendientes de confirmar asistencia'}
          </p>
        </div>

        {/* Card 3: Recaudación Prevista */}
        <div className="bg-white rounded-2xl border border-[#EDE4D7] p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#574B45] mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Recaudación Prevista</span>
            <DollarSign className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold font-serif text-[#521849]">
              {metrics.totalExpectedRevenue.toFixed(0)} €
            </span>
          </div>
          <p className="text-[10px] text-[#574B45] mt-1">
            Importe total de plazas activas
          </p>
        </div>

        {/* Card 4: Alergias e Intolerancias */}
        <div className="bg-white rounded-2xl border border-[#EDE4D7] p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#574B45] mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Alergias / Menú</span>
            <AlertTriangle className={`w-4 h-4 ${metrics.withAllergies > 0 ? 'text-amber-600' : 'text-stone-400'}`} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-serif ${metrics.withAllergies > 0 ? 'text-amber-700' : 'text-[#26201D]'}`}>
              {metrics.withAllergies}
            </span>
            <span className="text-xs text-[#574B45]">con notas</span>
          </div>
          <p className="text-[10px] text-[#574B45] mt-1">
            {metrics.withAllergies > 0 ? '⚠️ Revisar adaptaciones de cocina' : 'Sin intolerancias reportadas'}
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
                <th className="p-4">Plazas / Turno</th>
                <th className="p-4">Alergias & Observaciones</th>
                <th className="p-4">Estado & Pago</th>
                <th className="p-4">Fecha Registro</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE4D7]">
              {filteredParticipants.map((p) => (
                <tr 
                  key={p.id} 
                  className={`hover:bg-[#FCFAF7] transition-colors ${
                    p.status === 'cancelada' ? 'opacity-60 bg-stone-50' : ''
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

                  {/* Plazas y Turno */}
                  <td className="p-4">
                    <div className="space-y-0.5">
                      <span className="inline-flex items-center gap-1 font-bold text-[#521849] text-sm">
                        <Users className="w-3.5 h-3.5" />
                        <span>{p.spots} {p.spots === 1 ? 'plaza' : 'plazas'}</span>
                      </span>
                      <p className="text-[11px] font-semibold text-[#26201D]">
                        {p.totalAmount ? `${p.totalAmount} €` : '-'}
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
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {p.status === 'confirmada' && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                        {p.status === 'pendiente_pago' && <Clock className="w-3 h-3 text-amber-600" />}
                        {p.status === 'asistio' && <Sparkles className="w-3 h-3 text-purple-600" />}
                        {p.status === 'cancelada' && <X className="w-3 h-3 text-rose-600" />}
                        <span>
                          {p.status === 'confirmada' ? 'Confirmada' :
                           p.status === 'pendiente_pago' ? 'Pendiente Pago' :
                           p.status === 'asistio' ? 'Asistió (En Sala)' : 'Cancelada'}
                        </span>
                      </span>

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
                    {p.status !== 'asistio' && p.status !== 'cancelada' && (
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
                        title="Desmarcar Asistencia"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
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
                      {act.date} — {act.title} ({act.price}€/plaza)
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

              {/* Spots, Turn, and Socio */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#26201D] mb-1">
                    Plazas *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    required
                    value={formData.spots}
                    onChange={(e) => setFormData({ ...formData, spots: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs focus:outline-none focus:border-[#521849] focus:bg-white"
                  />
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
                    <option value="asistio">Asistió (En Sala)</option>
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
              Se eliminará el registro de {participantToDelete.spots} plaza(s) para la actividad <strong>{participantToDelete.activityTitle}</strong> y se liberará el aforo correspondiente.
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
                    <th className="p-2.5 text-center">Plazas</th>
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
                      <td className="p-2.5 text-center font-bold text-sm">
                        {p.spots}
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
    </div>
  );
};
