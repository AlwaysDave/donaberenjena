import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Member } from '../../types';
import { 
  Users, 
  UserPlus, 
  Search, 
  Phone, 
  Mail, 
  CheckCircle, 
  XCircle, 
  Edit2, 
  Trash2, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Calendar,
  Sparkles,
  MessageCircle,
  FileText,
  Clock
} from 'lucide-react';
import { formatDisplayDate } from '../../utils/dateUtils';

export const SimpleMembersManager: React.FC = () => {
  const { members, participants, addMember, updateMember, deleteMember } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);
  
  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

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

  // Filtered members
  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const q = (searchQuery || '').toLowerCase().trim();
      const matchSearch = !q ||
        (m.fullName || '').toLowerCase().includes(q) ||
        (m.email || '').toLowerCase().includes(q) ||
        (m.phone || '').toLowerCase().includes(q) ||
        (m.membershipNumber || '').toLowerCase().includes(q);

      const matchStatus = 
        statusFilter === 'all' ? true :
        statusFilter === 'active' ? m.active :
        !m.active;

      return matchSearch && matchStatus;
    }).sort((a, b) => {
      // Sort active first, then alphabetical by name
      if (a.active !== b.active) return a.active ? -1 : 1;
      return (a.fullName || '').localeCompare(b.fullName || '', 'es');
    });
  }, [members, searchQuery, statusFilter]);

  const activeCount = useMemo(() => members.filter(m => m.active).length, [members]);
  const inactiveCount = useMemo(() => members.filter(m => !m.active).length, [members]);

  // Open modal for new member
  const handleOpenCreateModal = () => {
    setEditingMember(null);
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      membershipNumber: '',
      active: true,
      notes: ''
    });
    setIsFormModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEditModal = (member: Member, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingMember(member);
    setFormData({
      fullName: member.fullName || '',
      email: member.email || '',
      phone: member.phone || '',
      membershipNumber: member.membershipNumber || '',
      active: member.active,
      notes: member.notes || ''
    });
    setIsFormModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      alert('El nombre completo es obligatorio.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingMember) {
        await updateMember(editingMember.id, {
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          membershipNumber: formData.membershipNumber.trim(),
          active: formData.active,
          notes: formData.notes.trim()
        });
        setFeedbackMessage(`Socio «${formData.fullName}» actualizado correctamente.`);
      } else {
        await addMember({
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          membershipNumber: formData.membershipNumber.trim(),
          active: formData.active,
          notes: formData.notes.trim()
        });
        setFeedbackMessage(`Socio «${formData.fullName}» dado de alta con éxito.`);
      }
      setIsFormModalOpen(false);
      setTimeout(() => setFeedbackMessage(null), 3500);
    } catch (err: any) {
      alert('Error al guardar socio: ' + (err.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!memberToDelete) return;
    try {
      await deleteMember(memberToDelete.id);
      setFeedbackMessage(`Socio «${memberToDelete.fullName}» eliminado.`);
      setMemberToDelete(null);
      if (expandedMemberId === memberToDelete.id) {
        setExpandedMemberId(null);
      }
      setTimeout(() => setFeedbackMessage(null), 3500);
    } catch (err: any) {
      alert('Error al eliminar socio: ' + (err.message || err));
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedMemberId(prev => (prev === id ? null : id));
  };

  return (
    <div className="space-y-4">
      {/* Feedback banner */}
      {feedbackMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Header with Search and Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-[#574B45] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-simple-search-member"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, teléfono, nº de socio..."
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white border border-[#EDE4D7] text-xs text-[#26201D] placeholder-[#574B45]/60 focus:outline-none focus:border-[#521849] focus:ring-1 focus:ring-[#521849] shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#574B45] hover:text-[#26201D] p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          id="btn-simple-add-member"
          type="button"
          onClick={handleOpenCreateModal}
          className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-[#521849] hover:bg-[#3E1037] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer shrink-0 active:scale-[0.98]"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Dar de alta socio</span>
        </button>
      </div>

      {/* Quick Filter chips */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
            statusFilter === 'all'
              ? 'bg-[#521849] text-white shadow-2xs'
              : 'bg-white border border-[#EDE4D7] text-[#574B45] hover:bg-[#F6F1EA]'
          }`}
        >
          Todos ({members.length})
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('active')}
          className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
            statusFilter === 'active'
              ? 'bg-emerald-700 text-white shadow-2xs'
              : 'bg-white border border-[#EDE4D7] text-emerald-800 hover:bg-emerald-50/50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Activos ({activeCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('inactive')}
          className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
            statusFilter === 'inactive'
              ? 'bg-slate-700 text-white shadow-2xs'
              : 'bg-white border border-[#EDE4D7] text-[#574B45] hover:bg-[#F6F1EA]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-slate-400"></span>
          <span>Inactivos ({inactiveCount})</span>
        </button>
      </div>

      {/* Members List - Vertical, mobile optimized, zero horizontal scroll */}
      {filteredMembers.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white border border-[#EDE4D7] text-center space-y-2">
          <Users className="w-8 h-8 text-[#574B45]/40 mx-auto" />
          <p className="text-xs font-medium text-[#574B45]">
            {searchQuery ? 'No se encontraron socios que coincidan con la búsqueda.' : 'No hay socios registrados en esta categoría.'}
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs text-[#521849] font-bold hover:underline"
            >
              Limpiar búsqueda
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredMembers.map((member) => {
            const isExpanded = expandedMemberId === member.id;
            
            // Member participation stats
            const memberHistory = participants.filter(p => {
              const emailMatch = member.email && p.email && member.email.toLowerCase().trim() === p.email.toLowerCase().trim();
              const phoneMatch = member.phone && p.phone && member.phone.replace(/\D/g, '') === p.phone.replace(/\D/g, '');
              const nameMatch = member.fullName && p.fullName && member.fullName.toLowerCase().trim() === p.fullName.toLowerCase().trim();
              return emailMatch || phoneMatch || nameMatch;
            });
            const attendedCount = memberHistory.filter(p => p.status === 'asistio' || p.attended).length;

            // Formatted phone for WhatsApp link (digits only)
            const cleanPhone = member.phone ? member.phone.replace(/\D/g, '') : '';
            const waPhone = cleanPhone.startsWith('34') ? cleanPhone : `34${cleanPhone}`;

            return (
              <div
                key={member.id}
                className={`rounded-2xl border transition-all bg-white shadow-2xs overflow-hidden ${
                  isExpanded ? 'border-[#521849] ring-1 ring-[#521849]/20' : 'border-[#EDE4D7] hover:border-[#DFD3C2]'
                }`}
              >
                {/* Compact Main Row (Always visible) */}
                <div
                  onClick={() => toggleExpand(member.id)}
                  className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Status dot / Initials */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      member.active 
                        ? 'bg-[#521849]/10 text-[#521849]' 
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {member.fullName ? member.fullName.charAt(0).toUpperCase() : 'S'}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-bold text-[#26201D] truncate">
                          {member.fullName}
                        </h4>
                        {member.membershipNumber && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#EDE4D7]/70 text-[#574B45]">
                            #{member.membershipNumber}
                          </span>
                        )}
                        {!member.active && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                            Inactivo
                          </span>
                        )}
                      </div>

                      {/* Phone Number - Primary minimal info */}
                      <div className="flex items-center gap-1.5 text-xs text-[#574B45] mt-0.5">
                        <Phone className="w-3 h-3 text-[#521849] shrink-0" />
                        <span className="font-medium text-[#26201D]">
                          {member.phone || 'Sin teléfono'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Quick Call Icon (if phone exists) */}
                    {member.phone && (
                      <a
                        href={`tel:${member.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="min-h-[38px] min-w-[38px] p-2 rounded-xl bg-[#F6F1EA] hover:bg-emerald-50 text-emerald-800 flex items-center justify-center transition-colors"
                        title="Llamar directamente"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    )}

                    <div className="p-1 text-[#574B45]">
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-[#521849]" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Card Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-[#EDE4D7]/70 bg-[#FAF7F3] space-y-3.5 animate-fadeIn">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {/* Email */}
                      <div className="p-2.5 rounded-xl bg-white border border-[#EDE4D7] space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#574B45]">
                          Correo Electrónico
                        </span>
                        {member.email ? (
                          <a
                            href={`mailto:${member.email}`}
                            className="text-[#521849] font-medium hover:underline flex items-center gap-1.5 break-all"
                          >
                            <Mail className="w-3.5 h-3.5 shrink-0" />
                            <span>{member.email}</span>
                          </a>
                        ) : (
                          <p className="text-[#574B45]/70 italic">No registrado</p>
                        )}
                      </div>

                      {/* Direct Phone & WhatsApp Actions */}
                      <div className="p-2.5 rounded-xl bg-white border border-[#EDE4D7] space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#574B45]">
                          Teléfono y Mensajes
                        </span>
                        {member.phone ? (
                          <div className="flex items-center gap-2 flex-wrap pt-0.5">
                            <a
                              href={`tel:${member.phone}`}
                              className="px-2.5 py-1 rounded-lg bg-[#521849] text-white text-[11px] font-bold flex items-center gap-1 hover:bg-[#3E1037]"
                            >
                              <Phone className="w-3 h-3" />
                              <span>Llamar</span>
                            </a>
                            <a
                              href={`https://wa.me/${waPhone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold flex items-center gap-1 hover:bg-emerald-700"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        ) : (
                          <p className="text-[#574B45]/70 italic">No registrado</p>
                        )}
                      </div>

                      {/* Membership & Status */}
                      <div className="p-2.5 rounded-xl bg-white border border-[#EDE4D7] space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#574B45]">
                          Número de Socio & Estado
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#26201D]">
                            {member.membershipNumber ? `Nº ${member.membershipNumber}` : 'Sin número asignado'}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            member.active 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {member.active ? 'Socio Activo' : 'Socio Inactivo'}
                          </span>
                        </div>
                      </div>

                      {/* Activity History summary */}
                      <div className="p-2.5 rounded-xl bg-white border border-[#EDE4D7] space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#574B45]">
                          Historial de Asistencia
                        </span>
                        <p className="font-semibold text-[#26201D]">
                          {attendedCount} asistencias registradas ({memberHistory.length} inscripciones totales)
                        </p>
                      </div>
                    </div>

                    {/* Notes if any */}
                    {member.notes && (
                      <div className="p-2.5 rounded-xl bg-white border border-[#EDE4D7] text-xs space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#574B45] flex items-center gap-1">
                          <FileText className="w-3 h-3 text-[#521849]" />
                          Observaciones
                        </span>
                        <p className="text-[#26201D] whitespace-pre-line">{member.notes}</p>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#EDE4D7]">
                      <button
                        type="button"
                        onClick={(e) => handleOpenEditModal(member, e)}
                        className="min-h-[40px] px-3.5 py-1.5 rounded-xl border border-[#EDE4D7] bg-white hover:bg-[#F6F1EA] text-[#26201D] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-[#521849]" />
                        <span>Editar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMemberToDelete(member)}
                        className="min-h-[40px] px-3.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-700" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create or Edit Member */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#EDE4D7] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#EDE4D7]">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#521849]" />
                <h3 className="font-serif font-bold text-base text-[#26201D]">
                  {editingMember ? 'Editar Socio' : 'Alta de Nuevo Socio'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="p-1 rounded-lg text-[#574B45] hover:bg-[#F6F1EA]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#26201D] mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Ej: Laura Gómez Sánchez"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE4D7] text-xs text-[#26201D] focus:outline-none focus:border-[#521849]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#26201D] mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Ej: 600123456"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE4D7] text-xs text-[#26201D] focus:outline-none focus:border-[#521849]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#26201D] mb-1">
                    Nº de Socio
                  </label>
                  <input
                    type="text"
                    value={formData.membershipNumber}
                    onChange={(e) => setFormData({ ...formData, membershipNumber: e.target.value })}
                    placeholder="Ej: 42"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE4D7] text-xs text-[#26201D] focus:outline-none focus:border-[#521849]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#26201D] mb-1">
                  Correo Electrónico (opcional)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ejemplo@correo.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE4D7] text-xs text-[#26201D] focus:outline-none focus:border-[#521849]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#26201D] mb-1">
                  Observaciones / Notas
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Preferencias de vino, tipo de cuota, etc."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#EDE4D7] text-xs text-[#26201D] focus:outline-none focus:border-[#521849] resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="simple-active-member-chk"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 rounded text-[#521849] focus:ring-[#521849] cursor-pointer"
                />
                <label htmlFor="simple-active-member-chk" className="text-xs font-bold text-[#26201D] cursor-pointer">
                  Socio en estado activo
                </label>
              </div>

              <div className="pt-3 border-t border-[#EDE4D7] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-[#EDE4D7] text-xs font-bold text-[#574B45] hover:bg-[#F6F1EA]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-h-[44px] px-6 py-2 rounded-xl bg-[#521849] hover:bg-[#3E1037] text-white text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : editingMember ? 'Guardar Cambios' : 'Dar de Alta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {memberToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-[#EDE4D7] space-y-4">
            <h3 className="font-serif font-bold text-base text-[#26201D]">
              ¿Eliminar socio?
            </h3>
            <p className="text-xs text-[#574B45]">
              Estás a punto de dar de baja definitiva al socio <strong>«{memberToDelete.fullName}»</strong>.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMemberToDelete(null)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-[#EDE4D7] text-xs font-bold text-[#574B45]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
