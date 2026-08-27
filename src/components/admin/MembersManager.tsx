import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { Member, AdminNotification } from '../../types';
import { Pagination } from '../common/Pagination';
import { 
  Users, 
  UserPlus, 
  Upload, 
  Download, 
  Search, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Edit2, 
  Trash2, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Filter, 
  Check, 
  X, 
  FileText, 
  Bell, 
  RefreshCw,
  History,
  Sparkles,
  Wine,
  ChefHat,
  Compass,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { formatDisplayDate, parseActivityDate } from '../../utils/dateUtils';

export const MembersManager: React.FC = () => {
  const { 
    members, 
    activities,
    participants,
    addMember, 
    updateMember, 
    deleteMember, 
    importMembers,
    adminNotifications,
    markNotificationAsRead,
    deleteNotification
  } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [selectedMemberForHistory, setSelectedMemberForHistory] = useState<Member | null>(null);

  // Form state
  const [formData, setFormData] = useState<{
    fullName: string;
    email: string;
    phone: string;
    membershipNumber: string;
    active: boolean;
    notes: string;
  }>({
    fullName: '',
    email: '',
    phone: '',
    membershipNumber: '',
    active: true,
    notes: ''
  });

  // Import state
  const [importText, setImportText] = useState('');
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Notification items
  const mismatchNotifs = adminNotifications.filter(n => n.type === 'socio_mismatch');
  const unreadMismatches = mismatchNotifs.filter(n => !n.read);

  // Pagination state for members
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Reset page when search, filter or pageSize changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, pageSize]);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const q = (searchQuery || '').toLowerCase().trim();
      const matchSearch = !q ||
        (m.fullName || '').toLowerCase().includes(q) ||
        (m.email || '').toLowerCase().includes(q) ||
        (m.phone || '').toLowerCase().includes(q) ||
        (m.membershipNumber || '').toLowerCase().includes(q);

      if (!matchSearch) return false;

      if (statusFilter === 'active') return m.active;
      if (statusFilter === 'inactive') return !m.active;
      return true;
    }).sort((a, b) => (a.membershipNumber || a.fullName).localeCompare(b.membershipNumber || b.fullName));
  }, [members, searchQuery, statusFilter]);

  // Paginated members slice
  const paginatedMembers = useMemo(() => {
    const totalItems = filteredMembers.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Math.min(Math.max(1, currentPage), totalPages);
    const start = (safePage - 1) * pageSize;
    return filteredMembers.slice(start, start + pageSize);
  }, [filteredMembers, currentPage, pageSize]);

  // Sync safePage to state
  useEffect(() => {
    const totalItems = filteredMembers.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Math.min(Math.max(1, currentPage), totalPages);
    if (currentPage !== safePage) {
      setCurrentPage(safePage);
    }
  }, [filteredMembers.length, pageSize, currentPage]);

  // Helper to compute member trajectory & real attendances
  const getMemberHistoryData = (member: Member) => {
    const memberEmail = member.email?.toLowerCase().trim();
    const memberName = member.fullName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    
    const memberParticipations = participants.filter(p => {
      if (p.memberId && p.memberId === member.id) return true;
      if (memberEmail && p.email && p.email.toLowerCase().trim() === memberEmail) return true;
      const pName = (p.fullName || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      if (pName && pName === memberName) return true;
      return false;
    });

    // Real attendances only (status === 'asistio' or attended === true, never cancelada or no_asistio)
    const attendedList = memberParticipations.filter(p => (p.status === 'asistio' || p.attended === true) && p.status !== 'cancelada' && p.status !== 'no_asistio');
    const totalAttendances = attendedList.length;

    const cataAttendances = attendedList.filter(p => {
      const act = activities.find(a => a.id === p.activityId);
      return p.activityType === 'cata' || act?.type === 'cata';
    }).length;

    const cursoAttendances = attendedList.filter(p => {
      const act = activities.find(a => a.id === p.activityId);
      return p.activityType === 'curso' || act?.type === 'curso';
    }).length;

    const viajeAttendances = attendedList.filter(p => {
      const act = activities.find(a => a.id === p.activityId);
      return p.activityType === 'viaje' || act?.type === 'viaje';
    }).length;

    const totalCancelled = memberParticipations.filter(p => p.status === 'cancelada').length;
    const totalNoShows = memberParticipations.filter(p => p.status === 'no_asistio').length;
    const totalJustified = memberParticipations.filter(p => p.justified).length;

    // Sort newest first (reverse chronological)
    const sortedParticipations = [...memberParticipations].sort((a, b) => {
      const actA = activities.find(act => act.id === a.activityId);
      const actB = activities.find(act => act.id === b.activityId);
      const dateA = actA?.date || a.createdAt || '';
      const dateB = actB?.date || b.createdAt || '';
      const timeA = parseActivityDate(dateA);
      const timeB = parseActivityDate(dateB);
      if (timeB !== timeA) return timeB - timeA;
      const hourA = actA?.time || '';
      const hourB = actB?.time || '';
      const hourComp = hourB.localeCompare(hourA);
      if (hourComp !== 0) return hourComp;
      const titleA = a.activityTitle || actA?.title || '';
      const titleB = b.activityTitle || actB?.title || '';
      return titleA.localeCompare(titleB, 'es', { sensitivity: 'base' });
    });

    return {
      memberParticipations,
      sortedParticipations,
      totalAttendances,
      cataAttendances,
      cursoAttendances,
      viajeAttendances,
      totalCancelled,
      totalNoShows,
      totalJustified
    };
  };

  // Open add modal
  const handleOpenAdd = () => {
    setEditingMember(null);
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      membershipNumber: `SOC-${String(members.length + 1).padStart(3, '0')}`,
      active: true,
      notes: ''
    });
    setIsEditModalOpen(true);
  };

  // Open edit modal
  const handleOpenEdit = (m: Member) => {
    setEditingMember(m);
    setFormData({
      fullName: m.fullName,
      email: m.email || '',
      phone: m.phone || '',
      membershipNumber: m.membershipNumber || '',
      active: m.active,
      notes: m.notes || ''
    });
    setIsEditModalOpen(true);
  };

  // Save member (add/edit)
  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) return;

    if (editingMember) {
      await updateMember(editingMember.id, {
        fullName: formData.fullName.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        membershipNumber: formData.membershipNumber.trim() || undefined,
        active: formData.active,
        notes: formData.notes.trim() || undefined
      });
    } else {
      await addMember({
        fullName: formData.fullName.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        membershipNumber: formData.membershipNumber.trim() || undefined,
        active: formData.active,
        notes: formData.notes.trim() || undefined
      });
    }

    setIsEditModalOpen(false);
  };

  // Toggle active status
  const handleToggleStatus = async (m: Member) => {
    await updateMember(m.id, { active: !m.active });
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!memberToDelete) return;
    await deleteMember(memberToDelete.id);
    setMemberToDelete(null);
  };

  // Parse and import CSV/Text
  const handleProcessImport = async () => {
    if (!importText.trim()) return;
    setIsImporting(true);
    setImportResult(null);

    const lines = importText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const parsedList: Omit<Member, 'id' | 'createdAt'>[] = [];

    for (const line of lines) {
      // Check if header line
      const lower = line.toLowerCase();
      if (lower.includes('nombre') && (lower.includes('email') || lower.includes('correo') || lower.includes('socio'))) {
        continue;
      }

      // Delimiters: comma, semicolon, or tab
      let parts: string[] = [];
      if (line.includes('\t')) {
        parts = line.split('\t');
      } else if (line.includes(';')) {
        parts = line.split(';');
      } else if (line.includes(',')) {
        parts = line.split(',');
      } else {
        // Single column (just full name)
        parts = [line];
      }

      parts = parts.map(p => p.trim().replace(/^["']|["']$/g, ''));

      const fullName = parts[0] || '';
      if (!fullName) continue;

      let email = '';
      let phone = '';
      let membershipNumber = '';

      for (let i = 1; i < parts.length; i++) {
        const val = parts[i];
        if (val.includes('@')) {
          email = val;
        } else if (/^[0-9+\s-]{8,}$/.test(val) && !phone) {
          phone = val;
        } else if (/^SOC-|^N[º°]?\s*\d+|\d{1,4}/i.test(val) && !membershipNumber) {
          membershipNumber = val;
        } else if (!email && val.length > 3) {
          email = val;
        }
      }

      parsedList.push({
        fullName,
        email: email || undefined,
        phone: phone || undefined,
        membershipNumber: membershipNumber || undefined,
        active: true
      });
    }

    const result = await importMembers(parsedList);
    setImportResult(result);
    setIsImporting(false);
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (members.length === 0) return;

    const headers = ['Nº Socio', 'Nombre y Apellidos', 'Email', 'Teléfono', 'Estado', 'Fecha Registro'];
    const rows = members.map(m => [
      `"${m.membershipNumber || ''}"`,
      `"${m.fullName}"`,
      `"${m.email || ''}"`,
      `"${m.phone || ''}"`,
      `"${m.active ? 'Activo' : 'Inactivo'}"`,
      `"${m.createdAt ? new Date(m.createdAt).toLocaleDateString('es-ES') : ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `censo-socios-dona-berenjena-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalMembers = members.length;
  const activeCount = members.filter(m => m.active).length;
  const inactiveCount = totalMembers - activeCount;

  return (
    <div className="space-y-6">
      {/* Top Banner: Discrepancy Warnings if any */}
      {unreadMismatches.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 text-amber-900 shadow-xs animate-fadeIn">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 rounded-xl text-amber-700 shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-amber-950 flex items-center gap-2">
                  <span>Discrepancias detectadas en reservas ({unreadMismatches.length})</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 font-bold uppercase tracking-wider">
                    Revisión requerida
                  </span>
                </h4>
                <p className="text-xs text-amber-800 mt-1">
                  El sistema ha detectado asistentes registrados como socios que no figuran en el censo activo, o socios reconocidos registrados con tarifa general.
                </p>
                <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-1">
                  {unreadMismatches.slice(0, 3).map((n) => (
                    <div key={n.id} className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white/80 border border-amber-200/80 text-xs">
                      <span className="font-medium text-amber-950">{n.message}</span>
                      <button
                        type="button"
                        onClick={() => markNotificationAsRead(n.id)}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold shrink-0 cursor-pointer"
                      >
                        Marcar resuelto
                      </button>
                    </div>
                  ))}
                  {unreadMismatches.length > 3 && (
                    <button
                      type="button"
                      onClick={() => setShowNotificationsModal(true)}
                      className="text-xs text-amber-900 font-bold underline hover:text-amber-950 cursor-pointer"
                    >
                      Ver los {unreadMismatches.length} avisos completos
                    </button>
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowNotificationsModal(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-200 hover:bg-amber-300 text-amber-950 text-xs font-bold shrink-0 cursor-pointer"
            >
              Gestionar avisos
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Socios */}
        <div className="bg-white rounded-2xl border border-[#EDE4D7] p-5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#574B45] mb-2">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Censo Total</span>
            <Users className="w-5 h-5 text-[#521849]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-serif text-[#26201D]">{totalMembers}</span>
            <span className="text-xs text-[#574B45]">socios censados</span>
          </div>
          <p className="text-[11px] text-[#574B45] mt-1">
            Base de datos oficial de miembros
          </p>
        </div>

        {/* Socios Activos */}
        <div className="bg-white rounded-2xl border border-[#EDE4D7] p-5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#574B45] mb-2">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Socios Activos</span>
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-serif text-emerald-700">{activeCount}</span>
            <span className="text-xs text-[#574B45]">al corriente de cuota</span>
          </div>
          <p className="text-[11px] text-[#574B45] mt-1">
            Con derecho a tarifa reducida en catas y viajes
          </p>
        </div>

        {/* Inactivos / Avisos */}
        <div className="bg-white rounded-2xl border border-[#EDE4D7] p-5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#574B45] mb-2">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Inactivos / Bajas</span>
            <XCircle className="w-5 h-5 text-[#8C7E77]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-serif text-[#574B45]">{inactiveCount}</span>
            <span className="text-xs text-[#574B45]">socios en pausa o baja</span>
          </div>
          <p className="text-[11px] text-[#574B45] mt-1">
            {unreadMismatches.length > 0 ? `⚠️ ${unreadMismatches.length} avisos de contraste pendientes` : 'Sin incidencias en reservas'}
          </p>
        </div>
      </div>

      {/* Actions Toolbar */}
      <div className="bg-white rounded-2xl border border-[#EDE4D7] p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search and Filters */}
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-[#8C7E77] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, email, teléfono o Nº de socio..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs focus:outline-none focus:border-[#521849] focus:bg-white"
              />
            </div>

            <div className="inline-flex p-1 rounded-xl bg-[#FCFAF7] border border-[#EDE4D7]">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === 'all' ? 'bg-[#521849] text-white shadow-2xs' : 'text-[#574B45] hover:text-[#26201D]'
                }`}
              >
                Todos ({totalMembers})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === 'active' ? 'bg-emerald-700 text-white shadow-2xs' : 'text-[#574B45] hover:text-[#26201D]'
                }`}
              >
                Activos ({activeCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('inactive')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === 'inactive' ? 'bg-stone-700 text-white shadow-2xs' : 'text-[#574B45] hover:text-[#26201D]'
                }`}
              >
                Inactivos ({inactiveCount})
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-import-members"
              type="button"
              onClick={() => {
                setImportText('');
                setImportResult(null);
                setIsImportModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] hover:bg-[#F6F1EA] text-[#521849] text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Importar Censo</span>
            </button>

            <button
              id="btn-export-members-csv"
              type="button"
              onClick={handleExportCsv}
              disabled={members.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] hover:bg-[#F6F1EA] text-[#574B45] text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar CSV</span>
            </button>

            <button
              id="btn-add-member"
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#521849] hover:bg-[#3E1037] text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Añadir Socio</span>
            </button>
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-3xl border border-[#EDE4D7] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#FCFAF7] border-b border-[#EDE4D7] text-[#574B45] uppercase tracking-wider font-semibold">
                <th className="p-4">Nº Socio</th>
                <th className="p-4">Nombre y Apellidos</th>
                <th className="p-4">Contacto</th>
                <th className="p-4">Estado Censo</th>
                <th className="p-4 text-center">Asistencias</th>
                <th className="p-4">Fecha de Alta</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE4D7]">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#8C7E77]">
                    <Users className="w-8 h-8 mx-auto mb-2 text-[#EDE4D7]" />
                    <p className="font-semibold text-sm text-[#574B45]">No se encontraron socios</p>
                    <p className="text-xs mt-1">
                      {searchQuery ? 'Prueba a cambiar los términos de búsqueda o filtros.' : 'Comienza añadiendo o importando socios al censo.'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedMembers.map((m) => {
                  const memberStats = getMemberHistoryData(m);
                  return (
                  <tr 
                    key={m.id}
                    className={`hover:bg-[#FCFAF7] transition-colors ${!m.active ? 'bg-stone-50/50 opacity-70' : ''}`}
                  >
                    {/* Nº de Socio */}
                    <td className="p-4 font-mono font-bold text-[#521849]">
                      <span className="px-2 py-1 rounded-md bg-[#521849]/10 text-[#521849] font-mono text-xs">
                        {m.membershipNumber || 'S/N'}
                      </span>
                    </td>

                    {/* Nombre */}
                    <td className="p-4">
                      <button
                        type="button"
                        onClick={() => setSelectedMemberForHistory(m)}
                        className="text-left font-bold text-[#26201D] hover:text-[#521849] text-sm font-serif transition-colors cursor-pointer block"
                        title="Ver trayectoria y reservas de este socio"
                      >
                        {m.fullName}
                      </button>
                      {m.notes && (
                        <p className="text-[11px] text-[#8C7E77] italic mt-0.5">{m.notes}</p>
                      )}
                    </td>

                    {/* Contacto */}
                    <td className="p-4">
                      <div className="space-y-0.5">
                        {m.email ? (
                          <a href={`mailto:${m.email}`} className="flex items-center gap-1.5 text-[#574B45] hover:text-[#521849]">
                            <Mail className="w-3 h-3 text-[#8C7E77]" />
                            <span>{m.email}</span>
                          </a>
                        ) : (
                          <span className="text-[#8C7E77] italic text-[11px]">Sin email</span>
                        )}
                        {m.phone && (
                          <a href={`tel:${m.phone}`} className="flex items-center gap-1.5 text-[#521849] hover:underline text-[11px]">
                            <Phone className="w-3 h-3" />
                            <span>{m.phone}</span>
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Estado */}
                    <td className="p-4">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(m)}
                        title={m.active ? 'Hacer clic para marcar como Inactivo' : 'Hacer clic para Activar'}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                          m.active 
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                            : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                        }`}
                      >
                        {m.active ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Activo</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-stone-500" />
                            <span>Inactivo</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Asistencias Reales */}
                    <td className="p-4 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedMemberForHistory(m)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#521849]/10 hover:bg-[#521849]/20 text-[#521849] font-mono font-bold text-xs cursor-pointer transition-colors"
                        title="Ver desglose e historial de actividades"
                      >
                        <Sparkles className="w-3 h-3 text-[#521849]" />
                        <span>{memberStats.totalAttendances}</span>
                      </button>
                    </td>

                    {/* Fecha de alta */}
                    <td className="p-4 text-[#574B45] text-xs">
                      {m.createdAt ? formatDisplayDate(m.createdAt) : '-'}
                    </td>

                    {/* Acciones */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedMemberForHistory(m)}
                          className="p-1.5 rounded-lg hover:bg-[#EDE4D7] text-[#521849] transition-colors cursor-pointer"
                          title="Ver historial de actividades del socio"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(m)}
                          className="p-1.5 rounded-lg hover:bg-[#EDE4D7] text-[#574B45] hover:text-[#521849] transition-colors cursor-pointer"
                          title="Editar socio"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setMemberToDelete(m)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-[#8C7E77] hover:text-rose-600 transition-colors cursor-pointer"
                          title="Eliminar socio"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredMembers.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="socios censados"
        />
      </div>

      {/* MODAL: Add / Edit Member */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#EDE4D7] my-8 animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-[#EDE4D7] mb-5">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#521849]/10 text-[#521849]">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-serif text-[#26201D]">
                    {editingMember ? 'Editar Datos de Socio' : 'Registrar Nuevo Socio'}
                  </h3>
                  <p className="text-xs text-[#574B45]">
                    Censo oficial de la Asociación Doña Berenjena
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-[#F6F1EA] text-[#574B45] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="space-y-4">
              {/* Nombre y Apellidos */}
              <div>
                <label className="block text-xs font-semibold text-[#26201D] mb-1">
                  Nombre y Apellidos *
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

              {/* Nº de Socio & Estado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#26201D] mb-1">
                    Nº de Socio (Identificador)
                  </label>
                  <input
                    type="text"
                    value={formData.membershipNumber}
                    onChange={(e) => setFormData({ ...formData, membershipNumber: e.target.value })}
                    placeholder="SOC-042"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs focus:outline-none focus:border-[#521849] focus:bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#26201D] mb-1">
                    Estado en el Censo
                  </label>
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] cursor-pointer hover:bg-stone-50">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="w-4 h-4 rounded text-[#521849] focus:ring-[#521849]"
                    />
                    <span className="text-xs font-medium text-[#26201D]">
                      {formData.active ? '⭐ Socio Activo' : '⚪ En Pausa / Baja'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Email & Teléfono */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#26201D] mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="carmen@ejemplo.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs focus:outline-none focus:border-[#521849] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#26201D] mb-1">
                    Teléfono Móvil
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="600 000 000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs focus:outline-none focus:border-[#521849] focus:bg-white"
                  />
                </div>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-xs font-semibold text-[#26201D] mb-1">
                  Observaciones internas (opcional)
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notas administrativas..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs focus:outline-none focus:border-[#521849] focus:bg-white resize-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#EDE4D7]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#EDE4D7] bg-white text-[#574B45] text-xs font-semibold hover:bg-[#F6F1EA] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#521849] hover:bg-[#3E1037] text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  {editingMember ? 'Guardar Cambios' : 'Registrar Socio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Import CSV / Text */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-[#EDE4D7] my-8 animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-[#EDE4D7] mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#521849]/10 text-[#521849]">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-serif text-[#26201D]">
                    Importar Censo de Socios
                  </h3>
                  <p className="text-xs text-[#574B45]">
                    Pega directamente tu lista desde Excel, Google Sheets o archivo CSV
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-[#F6F1EA] text-[#574B45] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-[#FCFAF7] border border-[#EDE4D7] rounded-xl p-3.5 text-xs text-[#574B45] space-y-1">
                <p className="font-semibold text-[#26201D]">Formatos soportados (1 socio por línea):</p>
                <p className="font-mono text-[11px] text-[#521849]">
                  Nombre Apellidos, correo@ejemplo.com, 600123456, SOC-001
                </p>
                <p className="font-mono text-[11px] text-[#521849]">
                  Nombre Apellidos; correo@ejemplo.com; 600123456; SOC-001
                </p>
                <p className="text-[11px] text-[#8C7E77]">
                  * También puedes copiar y pegar columnas directamente desde una hoja de cálculo.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#26201D] mb-1">
                  Contenido a importar
                </label>
                <textarea
                  rows={8}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder={`Ejemplo:\nCarlos Gómez Ruíz, carlos@ejemplo.com, 611223344, SOC-001\nMaría Carmen Sánchez, mcarmen@ejemplo.com, 622334455, SOC-002\nAntonio Navarro Martínez, antonio@ejemplo.com, 633445566, SOC-003`}
                  className="w-full p-3.5 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs font-mono focus:outline-none focus:border-[#521849] focus:bg-white resize-none"
                />
              </div>

              {importResult && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      <strong>{importResult.imported}</strong> socios importados con éxito. ({importResult.skipped} omitidos por ya existir o formato inválido).
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#EDE4D7]">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#EDE4D7] bg-white text-[#574B45] text-xs font-semibold hover:bg-[#F6F1EA] cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={handleProcessImport}
                  disabled={!importText.trim() || isImporting}
                  className="px-5 py-2.5 rounded-xl bg-[#521849] hover:bg-[#3E1037] text-white text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isImporting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Procesar e Importar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Full Notifications Management */}
      {showNotificationsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-[#EDE4D7] my-8 animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-[#EDE4D7] mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-serif text-[#26201D]">
                    Avisos de Contraste con el Censo
                  </h3>
                  <p className="text-xs text-[#574B45]">
                    Alertas generadas automáticamente al reservar plazas
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNotificationsModal(false)}
                className="p-1.5 rounded-xl hover:bg-[#F6F1EA] text-[#574B45] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {mismatchNotifs.length === 0 ? (
                <div className="p-8 text-center text-[#8C7E77]">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
                  <p className="font-semibold text-sm text-[#574B45]">Todo en orden</p>
                  <p className="text-xs mt-1">No hay avisos de discrepancia pendientes.</p>
                </div>
              ) : (
                mismatchNotifs.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3.5 rounded-2xl border transition-colors flex items-start justify-between gap-3 ${
                      n.read 
                        ? 'bg-stone-50 border-stone-200 opacity-60' 
                        : 'bg-amber-50/80 border-amber-200 text-amber-950'
                    }`}
                  >
                    <div className="space-y-1 text-xs flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          n.read ? 'bg-stone-200 text-stone-700' : 'bg-amber-200 text-amber-900'
                        }`}>
                          {n.read ? 'Resuelto' : 'Pendiente'}
                        </span>
                        <span className="text-[10px] text-[#8C7E77]">
                          {n.createdAt ? new Date(n.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className="font-medium leading-snug">{n.message}</p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {!n.read && (
                        <button
                          type="button"
                          onClick={() => markNotificationAsRead(n.id)}
                          className="px-2.5 py-1 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-950 text-xs font-semibold cursor-pointer"
                        >
                          Marcar visto
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteNotification(n.id)}
                        className="p-1 rounded-lg hover:bg-rose-100 text-stone-400 hover:text-rose-600 cursor-pointer"
                        title="Eliminar aviso"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 flex justify-end border-t border-[#EDE4D7] mt-4">
              <button
                type="button"
                onClick={() => setShowNotificationsModal(false)}
                className="px-4 py-2 rounded-xl bg-[#521849] hover:bg-[#3E1037] text-white text-xs font-semibold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MEMBER HISTORY & ATTENDANCE MODAL */}
      {selectedMemberForHistory && (() => {
        const history = getMemberHistoryData(selectedMemberForHistory);
        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-[#EDE4D7] my-8 animate-scaleUp max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#EDE4D7] shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-[#521849]/10 text-[#521849]">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold font-serif text-[#26201D]">
                        {selectedMemberForHistory.fullName}
                      </h3>
                      <span className="px-2 py-0.5 rounded-md bg-[#521849]/10 text-[#521849] font-mono text-xs font-bold">
                        {selectedMemberForHistory.membershipNumber || 'S/N'}
                      </span>
                    </div>
                    <p className="text-xs text-[#574B45] mt-0.5">
                      Historial completo de actividades y asistencias registradas
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedMemberForHistory(null)}
                  className="p-1.5 rounded-xl hover:bg-[#F6F1EA] text-[#574B45] cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4 shrink-0">
                <div className="p-3 rounded-2xl bg-[#FCFAF7] border border-[#EDE4D7] text-center">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-[#574B45] block">
                    Asistencias Reales
                  </span>
                  <span className="text-xl font-bold font-serif text-[#521849] mt-0.5 block">
                    {history.totalAttendances}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-[#FCFAF7] border border-[#EDE4D7] text-center">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-[#574B45] block">
                    Catas / Cursos
                  </span>
                  <span className="text-xl font-bold font-serif text-[#26201D] mt-0.5 block">
                    {history.cataAttendances} / {history.cursoAttendances}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-[#FCFAF7] border border-[#EDE4D7] text-center">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-[#574B45] block">
                    Viajes
                  </span>
                  <span className="text-xl font-bold font-serif text-[#26201D] mt-0.5 block">
                    {history.viajeAttendances}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-[#FCFAF7] border border-[#EDE4D7] text-center">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-[#574B45] block">
                    Bajas / Faltas
                  </span>
                  <span className="text-xl font-bold font-serif text-rose-700 mt-0.5 block">
                    {history.totalCancelled + history.totalNoShows}
                    {history.totalJustified > 0 && (
                      <span className="text-[10px] font-normal text-amber-700 ml-1">
                        ({history.totalJustified} just.)
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Reverse Chronological Activity List */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[220px]">
                <div className="text-xs font-semibold text-[#574B45] px-1 pb-1">
                  Actividades registradas ({history.sortedParticipations.length}) — Ordenadas por fecha más reciente
                </div>

                {history.sortedParticipations.length === 0 ? (
                  <div className="p-8 text-center bg-[#FCFAF7] rounded-2xl border border-[#EDE4D7] text-[#8C7E77]">
                    <Users className="w-8 h-8 mx-auto mb-2 text-[#EDE4D7]" />
                    <p className="font-semibold text-sm text-[#574B45]">Sin actividades registradas</p>
                    <p className="text-xs mt-1">Este socio aún no cuenta con inscripciones o asistencias en el sistema.</p>
                  </div>
                ) : (
                  history.sortedParticipations.map((p) => {
                    const act = activities.find(a => a.id === p.activityId);
                    const isAttended = (p.status === 'asistio' || p.attended === true) && p.status !== 'cancelada' && p.status !== 'no_asistio';
                    const isCancelled = p.status === 'cancelada';
                    const isNoShow = p.status === 'no_asistio';
                    const actType = p.activityType || act?.type || 'cata';

                    return (
                      <div
                        key={p.id}
                        className={`p-3 rounded-2xl border transition-colors flex items-start justify-between gap-3 ${
                          isAttended
                            ? 'bg-emerald-50/40 border-emerald-200/80'
                            : isCancelled
                            ? 'bg-rose-50/40 border-rose-200/80'
                            : isNoShow
                            ? 'bg-amber-50/40 border-amber-200/80'
                            : 'bg-[#FCFAF7] border-[#EDE4D7]'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-xl bg-white border border-[#EDE4D7] text-[#521849] shrink-0 mt-0.5">
                            {actType === 'cata' && <Wine className="w-4 h-4" />}
                            {actType === 'curso' && <ChefHat className="w-4 h-4" />}
                            {actType === 'viaje' && <Compass className="w-4 h-4" />}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-[#26201D] font-serif">
                              {p.activityTitle || act?.title || 'Actividad'}
                            </h4>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#574B45] mt-1">
                              <span className="capitalize">{actType}</span>
                              <span>•</span>
                              <span className="inline-flex items-center gap-1 font-medium">
                                <Calendar className="w-3 h-3 text-[#521849]" />
                                {act ? formatDisplayDate(act.date, act.time) : (p.createdAt ? formatDisplayDate(p.createdAt) : '-')}
                              </span>
                              <span>•</span>
                              <span>{p.spots} {p.spots === 1 ? 'plaza' : 'plazas'} ({p.totalAmount} €)</span>
                            </div>
                            {p.justificationReason && (
                              <p className="text-[11px] text-amber-800 italic mt-1">
                                Justificación: {p.justificationReason}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0 text-right">
                          {isAttended && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Asistió</span>
                            </span>
                          )}
                          {isCancelled && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[11px] font-semibold">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Cancelada</span>
                            </span>
                          )}
                          {isNoShow && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-semibold">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                              <span>No asistió</span>
                            </span>
                          )}
                          {!isAttended && !isCancelled && !isNoShow && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 text-[11px] font-semibold">
                              <span>Reserva {p.status}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="pt-4 flex justify-end border-t border-[#EDE4D7] mt-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedMemberForHistory(null)}
                  className="px-5 py-2.5 rounded-xl bg-[#521849] hover:bg-[#3E1037] text-white text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
                >
                  Cerrar Historial
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* CONFIRM DELETE MODAL */}
      {memberToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[#EDE4D7] animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold font-serif text-[#26201D] text-center mb-2">
              ¿Eliminar socio del censo?
            </h3>
            <p className="text-xs text-[#574B45] text-center mb-5">
              Estás a punto de dar de baja a <strong>{memberToDelete.fullName}</strong> ({memberToDelete.membershipNumber || 'S/N'}). Esta acción no se puede deshacer.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMemberToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#EDE4D7] bg-white text-[#574B45] text-xs font-semibold hover:bg-[#F6F1EA] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
