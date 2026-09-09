import React, { useState, useMemo, useEffect } from 'react';
import { 
  Mail, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Search, 
  Filter, 
  ExternalLink, 
  Phone, 
  User, 
  Send,
  Eye,
  Check,
  AlertCircle,
  AlertTriangle,
  Inbox,
  Sparkles,
  Tag,
  ShieldCheck,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { ContactMessage, CONTACT_SUBJECTS, getContactSubjectLabel, getContactSubjectBadge } from '../../types';

interface MessagesManagerProps {
  initialMessageId?: string | null;
}

export const MessagesManager: React.FC<MessagesManagerProps> = ({ initialMessageId }) => {
  const { 
    contactMessages, 
    markContactMessageRead,
    markContactAlertSeen,
    updateContactMessageStatus, 
    deleteContactMessage,
    useMockData 
  } = useData();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'nuevo' | 'leido' | 'respondido'>('todos');
  const [subjectFilter, setSubjectFilter] = useState<string>('todos');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [replyNotes, setReplyNotes] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [markingAlertSeen, setMarkingAlertSeen] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  // Sync initialMessageId if supplied (without auto-marking as read - CON-TACT-06)
  useEffect(() => {
    if (initialMessageId) {
      const found = contactMessages.find(m => m.id === initialMessageId);
      if (found) {
        setSelectedMessage(found);
        setReplyNotes(found.replyNotes || '');
      }
    }
  }, [initialMessageId, contactMessages]);

  // Keep selectedMessage synchronized if contactMessages changes
  useEffect(() => {
    if (selectedMessage) {
      const updated = contactMessages.find(m => m.id === selectedMessage.id);
      if (updated) {
        setSelectedMessage(updated);
      }
    }
  }, [contactMessages]);

  // Statistics
  const totalCount = contactMessages.length;
  const newCount = contactMessages.filter(m => !m.read || m.status === 'nuevo').length;
  const inProgressCount = contactMessages.filter(m => m.read && m.status === 'leido').length;
  const repliedCount = contactMessages.filter(m => m.status === 'respondido').length;

  const filteredMessages = useMemo(() => {
    return contactMessages
      .filter(msg => {
        if (statusFilter !== 'todos') {
          if (statusFilter === 'nuevo' && (msg.status === 'nuevo' || !msg.read)) return true;
          if (msg.status !== statusFilter) return false;
        }
        if (subjectFilter !== 'todos' && msg.subject !== subjectFilter) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = msg.name.toLowerCase().includes(q);
          const matchEmail = msg.email.toLowerCase().includes(q);
          const matchPhone = (msg.phone || '').toLowerCase().includes(q);
          const matchMsg = msg.message.toLowerCase().includes(q);
          const matchInterest = (msg.activityInterest || '').toLowerCase().includes(q);
          return matchName || matchEmail || matchPhone || matchMsg || matchInterest;
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [contactMessages, searchQuery, statusFilter, subjectFilter]);

  // Handler to open message details (CON-TACT-06: strictly read-only, does NOT auto-mark as read)
  const handleOpenDetail = (msg: ContactMessage) => {
    setSelectedMessage(msg);
    setReplyNotes(msg.replyNotes || '');
  };

  // Handler to explicitly mark message as reviewed (CON-TACT-06)
  const handleMarkAsReviewed = async () => {
    if (!selectedMessage) return;
    setSavingStatus(true);
    try {
      await markContactMessageRead(selectedMessage.id, true);
    } catch (err) {
      console.error('Error marking contact message as read:', err);
    } finally {
      setSavingStatus(false);
    }
  };

  // Handler to mark alert as seen (CON-TACT-05: updates only contactAlertSeenAt and seen by fields)
  const handleMarkAlertSeen = async () => {
    if (!selectedMessage) return;
    setMarkingAlertSeen(true);
    try {
      await markContactAlertSeen(
        selectedMessage.id,
        user?.name || 'Administración',
        user?.uid || 'admin'
      );
    } catch (err) {
      console.error('Error marking contact alert seen:', err);
    } finally {
      setMarkingAlertSeen(false);
    }
  };

  const handleSaveReply = async () => {
    if (!selectedMessage) return;
    setSavingStatus(true);
    try {
      await updateContactMessageStatus(selectedMessage.id, 'respondido', replyNotes.trim());
    } catch (err) {
      console.error('Error saving contact message reply:', err);
    } finally {
      setSavingStatus(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteContactMessage(id);
    setShowDeleteConfirm(null);
    if (selectedMessage?.id === id) {
      setSelectedMessage(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold font-serif text-[#26201D]">
              Buzón de Contacto y Consultas
            </h2>
            {newCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#521849] text-white shadow-2xs">
                {newCount} sin revisar
              </span>
            )}
          </div>
          <p className="text-xs text-[#574B45] mt-1">
            Gestión de solicitudes y consultas recibidas desde el formulario público de contacto.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div 
          onClick={() => setStatusFilter('todos')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'todos' 
              ? 'bg-[#521849] text-white border-[#521849] shadow-sm' 
              : 'bg-white border-[#EDE4D7] text-[#26201D] hover:border-[#521849]/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs uppercase tracking-wider font-semibold ${statusFilter === 'todos' ? 'text-white/80' : 'text-[#574B45]'}`}>
              Total Mensajes
            </span>
            <Inbox className={`w-4 h-4 ${statusFilter === 'todos' ? 'text-white' : 'text-[#521849]'}`} />
          </div>
          <p className="text-2xl font-bold font-serif mt-2">{totalCount}</p>
        </div>

        <div 
          onClick={() => setStatusFilter('nuevo')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'nuevo' 
              ? 'bg-rose-600 text-white border-rose-600 shadow-sm' 
              : 'bg-white border-[#EDE4D7] text-[#26201D] hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs uppercase tracking-wider font-semibold ${statusFilter === 'nuevo' ? 'text-white/80' : 'text-rose-700'}`}>
              Nuevos
            </span>
            <span className={`w-2.5 h-2.5 rounded-full ${statusFilter === 'nuevo' ? 'bg-white animate-pulse' : 'bg-rose-500 animate-ping'}`} />
          </div>
          <p className={`text-2xl font-bold font-serif mt-2 ${statusFilter === 'nuevo' ? 'text-white' : 'text-rose-600'}`}>{newCount}</p>
        </div>

        <div 
          onClick={() => setStatusFilter('leido')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'leido' 
              ? 'bg-amber-600 text-white border-amber-600 shadow-sm' 
              : 'bg-white border-[#EDE4D7] text-[#26201D] hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs uppercase tracking-wider font-semibold ${statusFilter === 'leido' ? 'text-white/80' : 'text-amber-700'}`}>
              Revisados / En Gestión
            </span>
            <Clock className={`w-4 h-4 ${statusFilter === 'leido' ? 'text-white' : 'text-amber-600'}`} />
          </div>
          <p className={`text-2xl font-bold font-serif mt-2 ${statusFilter === 'leido' ? 'text-white' : 'text-amber-600'}`}>{inProgressCount}</p>
        </div>

        <div 
          onClick={() => setStatusFilter('respondido')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'respondido' 
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm' 
              : 'bg-white border-[#EDE4D7] text-[#26201D] hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs uppercase tracking-wider font-semibold ${statusFilter === 'respondido' ? 'text-white/80' : 'text-emerald-700'}`}>
              Respondidos
            </span>
            <CheckCircle2 className={`w-4 h-4 ${statusFilter === 'respondido' ? 'text-white' : 'text-emerald-600'}`} />
          </div>
          <p className={`text-2xl font-bold font-serif mt-2 ${statusFilter === 'respondido' ? 'text-white' : 'text-emerald-600'}`}>{repliedCount}</p>
        </div>
      </div>

      {/* Filters and Search Bar (CON-TACT-07) */}
      <div className="bg-white p-4 rounded-2xl border border-[#EDE4D7] flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#574B45]" />
          <input
            type="text"
            placeholder="Buscar por nombre, email, teléfono o texto del mensaje..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#FCFAF7] border border-[#EDE4D7] rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#521849]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="px-3 py-2 bg-[#FCFAF7] border border-[#EDE4D7] rounded-xl text-xs font-medium text-[#26201D] focus:outline-none focus:border-[#521849]"
          >
            <option value="todos">Todos los motivos de consulta ({totalCount})</option>
            {CONTACT_SUBJECTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages List */}
      <div className="bg-white rounded-2xl border border-[#EDE4D7] overflow-hidden shadow-xs">
        {filteredMessages.length === 0 ? (
          <div className="p-12 text-center text-[#574B45]">
            <Inbox className="w-10 h-10 mx-auto text-[#EDE4D7] mb-3" />
            <p className="font-medium text-sm text-[#26201D]">No se han encontrado mensajes de contacto</p>
            <p className="text-xs text-[#574B45] mt-1">
              {searchQuery || statusFilter !== 'todos' || subjectFilter !== 'todos'
                ? 'Prueba a cambiar o limpiar los filtros seleccionados.'
                : 'Cuando los usuarios envíen consultas desde la web aparecerán aquí.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#EDE4D7]">
            {filteredMessages.map((msg) => {
              const subjectBadge = getContactSubjectBadge(msg.subject);
              const isUnread = !msg.read || msg.status === 'nuevo';
              const isReplied = msg.status === 'respondido';
              const isEmailFailed = msg.emailDeliveryStatus === 'failed';
              const isAlertPending = !msg.contactAlertSeenAt;
              const createdDate = new Date(msg.createdAt);
              const formattedDate = createdDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
              const formattedTime = createdDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

              return (
                <div
                  key={msg.id}
                  onClick={() => handleOpenDetail(msg)}
                  className={`p-4 sm:p-5 transition-colors cursor-pointer flex flex-col sm:flex-row items-start justify-between gap-4 ${
                    isUnread ? 'bg-[#FCFAF7] hover:bg-[#F6F1EA]' : 'hover:bg-[#FCFAF7]'
                  }`}
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {isUnread && (
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" title="Mensaje no leído / nuevo" />
                      )}
                      <h4 className={`text-sm sm:text-base ${isUnread ? 'font-bold text-[#26201D]' : 'font-semibold text-[#574B45]'}`}>
                        {msg.name}
                      </h4>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${subjectBadge.color}`}>
                        {subjectBadge.label}
                      </span>
                      {isReplied ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Respondido
                        </span>
                      ) : isUnread ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Nuevo
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          Revisado
                        </span>
                      )}

                      {/* Email Failure Indicator */}
                      {isEmailFailed && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1" title={msg.emailErrorReason || 'Fallo SMTP'}>
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          Fallo email
                        </span>
                      )}

                      {/* Central Alert Seen Indicator */}
                      {isAlertPending && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-[#521849] border border-purple-200 flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          Aviso pendiente
                        </span>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-[#26201D] line-clamp-2 leading-relaxed">
                      {msg.message}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#574B45]">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-[#521849]" />
                        {msg.email}
                      </span>
                      {msg.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-[#521849]" />
                          {msg.phone}
                        </span>
                      )}
                      {msg.activityInterest && (
                        <span className="flex items-center gap-1 text-[#521849] font-medium">
                          <Tag className="w-3.5 h-3.5" />
                          {msg.activityInterest}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center sm:flex-col sm:items-end justify-between w-full sm:w-auto shrink-0 gap-2">
                    <span className="text-[11px] text-[#574B45]">
                      {formattedDate} • {formattedTime}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetail(msg);
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#FCFAF7] hover:bg-[#521849] hover:text-white text-[#521849] border border-[#EDE4D7] transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver Ficha</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DETAIL MODAL / DRAWER (CON-TACT-05 & CON-TACT-06) */}
      {selectedMessage && (
        <div
          id="modal-message-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-sm overflow-y-auto"
          onClick={() => setSelectedMessage(null)}
        >
          <div
            id="modal-message-card"
            className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-[#EDE4D7] max-h-[90vh] flex flex-col my-auto overflow-hidden animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-[#EDE4D7] bg-[#FCFAF7] flex items-start justify-between gap-4 shrink-0">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#521849] block">
                  Mensaje de Contacto
                </span>
                <h3 className="text-xl font-bold font-serif text-[#26201D] mt-0.5">
                  {selectedMessage.name}
                </h3>
                <p className="text-xs text-[#574B45] mt-0.5">
                  Recibido el {new Date(selectedMessage.createdAt).toLocaleString('es-ES')}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMessage(null)}
                className="p-2 rounded-xl text-[#574B45] hover:text-[#26201D] hover:bg-[#EDE4D7]/70 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
              {/* Status and tags bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-2xl bg-[#FCFAF7] border border-[#EDE4D7]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#574B45]">Motivo:</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getContactSubjectBadge(selectedMessage.subject).color}`}>
                    {getContactSubjectBadge(selectedMessage.subject).label}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#574B45]">Estado:</span>
                  <select
                    value={selectedMessage.status}
                    onChange={(e) => {
                      const newSt = e.target.value as 'nuevo' | 'leido' | 'respondido';
                      updateContactMessageStatus(selectedMessage.id, newSt, selectedMessage.replyNotes);
                    }}
                    className="px-3 py-1 bg-white border border-[#EDE4D7] rounded-xl text-xs font-bold text-[#26201D] focus:outline-none focus:border-[#521849]"
                  >
                    <option value="nuevo">🔴 Nuevo / Sin revisar</option>
                    <option value="leido">🟡 Revisado / En gestión</option>
                    <option value="respondido">🟢 Respondido</option>
                  </select>
                </div>
              </div>

              {/* Central Alert Status & Email Traceability Banner */}
              <div className="space-y-2">
                {/* Email Delivery Traceability */}
                <div className="p-3 rounded-xl bg-white border border-[#EDE4D7] text-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Mail className="w-4 h-4 text-[#521849] shrink-0" />
                    <span className="text-[#574B45] font-medium">Reenvío por email:</span>
                    {selectedMessage.emailDeliveryStatus === 'sent' ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        Remitido a ea4ayu.12@gmail.com
                        {selectedMessage.emailSentAt && (
                          <span className="font-normal text-[#8C7E77] text-[11px]">
                            ({new Date(selectedMessage.emailSentAt).toLocaleTimeString('es-ES')})
                          </span>
                        )}
                      </span>
                    ) : selectedMessage.emailDeliveryStatus === 'failed' ? (
                      <span className="text-rose-700 font-bold flex items-center gap-1 truncate" title={selectedMessage.emailErrorReason}>
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        Fallo en envío: {selectedMessage.emailErrorReason || 'Error SMTP'}
                      </span>
                    ) : selectedMessage.emailDeliveryStatus === 'simulated' ? (
                      <span className="text-indigo-700 font-semibold flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        Simulado (Modo Demo)
                      </span>
                    ) : (
                      <span className="text-amber-700 font-medium">Pendiente de reenvío</span>
                    )}
                  </div>
                </div>

                {/* Central Alert Status & Action (CON-TACT-05) */}
                <div className="p-3 rounded-xl bg-[#FCFAF7] border border-[#EDE4D7] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Eye className="w-4 h-4 text-[#521849] shrink-0" />
                    <span className="text-[#574B45] font-medium">Aviso central:</span>
                    {selectedMessage.contactAlertSeenAt ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        Visto el {new Date(selectedMessage.contactAlertSeenAt).toLocaleString('es-ES')} por {selectedMessage.contactAlertSeenBy || 'Administración'}
                      </span>
                    ) : (
                      <span className="text-amber-800 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        Pendiente de confirmación en la Central de Avisos
                      </span>
                    )}
                  </div>

                  {!selectedMessage.contactAlertSeenAt && (
                    <button
                      type="button"
                      onClick={handleMarkAlertSeen}
                      disabled={markingAlertSeen}
                      className="px-3 py-1.5 rounded-lg bg-white border border-[#EDE4D7] hover:bg-[#F6EDF4] text-[#521849] font-bold text-xs shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 self-start sm:self-auto shrink-0"
                    >
                      {markingAlertSeen ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>Marcar aviso como visto</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Direct Contact Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href={`mailto:${selectedMessage.email}?subject=Respuesta de Asoc. Gastronómica Doña Berenjena - ${encodeURIComponent(getContactSubjectLabel(selectedMessage.subject))}`}
                  className="p-3.5 rounded-2xl bg-white border border-[#EDE4D7] hover:border-[#521849] hover:bg-[#FCFAF7] transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#521849] flex items-center justify-center">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-[#574B45]">Email de contacto</p>
                      <p className="text-xs font-bold text-[#26201D] group-hover:text-[#521849]">{selectedMessage.email}</p>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-[#574B45]" />
                </a>

                {selectedMessage.phone ? (
                  <a
                    href={`tel:${selectedMessage.phone.replace(/\s+/g, '')}`}
                    className="p-3.5 rounded-2xl bg-white border border-[#EDE4D7] hover:border-[#521849] hover:bg-[#FCFAF7] transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-[#574B45]">Teléfono</p>
                        <p className="text-xs font-bold text-[#26201D] group-hover:text-[#521849]">{selectedMessage.phone}</p>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-[#574B45]" />
                  </a>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-white border border-[#EDE4D7] flex items-center gap-3 opacity-60">
                    <div className="w-8 h-8 rounded-xl bg-stone-100 text-stone-500 flex items-center justify-center">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-[#574B45]">Teléfono</p>
                      <p className="text-xs text-[#574B45]">No facilitado</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Message Content */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#574B45]">
                    Mensaje del Remitente
                  </label>
                  {selectedMessage.activityInterest && (
                    <span className="text-xs text-[#521849] font-semibold bg-[#FCFAF7] px-2.5 py-1 rounded-lg border border-[#EDE4D7]">
                      Actividad de interés: <strong>{selectedMessage.activityInterest}</strong>
                    </span>
                  )}
                </div>
                <div className="p-4 rounded-2xl bg-[#FCFAF7] border border-[#EDE4D7] text-sm text-[#26201D] leading-relaxed whitespace-pre-wrap">
                  {selectedMessage.message}
                </div>
              </div>

              {/* Explicit Mark as Reviewed Action (CON-TACT-06) */}
              {(!selectedMessage.read || selectedMessage.status === 'nuevo') && (
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h5 className="text-xs font-bold text-amber-950">El mensaje está marcado como Nuevo</h5>
                    <p className="text-[11px] text-amber-800">
                      Puedes marcarlo como revisado para indicar que ya ha sido leído por la secretaría.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleMarkAsReviewed}
                    disabled={savingStatus}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    {savingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Marcar como revisado</span>
                  </button>
                </div>
              )}

              {/* Admin Notes & Response tracking */}
              <div className="space-y-3 pt-2 border-t border-[#EDE4D7]">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#574B45]">
                    Notas Internas / Registro de Respuesta
                  </label>
                  {selectedMessage.repliedAt && (
                    <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Respondido el {new Date(selectedMessage.repliedAt).toLocaleDateString('es-ES')}
                    </span>
                  )}
                </div>

                <textarea
                  rows={3}
                  value={replyNotes}
                  onChange={(e) => setReplyNotes(e.target.value)}
                  placeholder="Anota aquí qué se le respondió o los detalles acordados (ej: Se le envió por email el dossier de socio el 15/05)..."
                  className="w-full px-4 py-2.5 rounded-xl border border-[#EDE4D7] bg-white text-xs sm:text-sm focus:outline-none focus:border-[#521849] resize-none"
                />

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleSaveReply}
                    disabled={savingStatus}
                    className="px-4 py-2 rounded-xl bg-[#521849] hover:bg-[#3E1037] text-white text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {savingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Guardar y Marcar como Respondido</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(selectedMessage.id)}
                    className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar mensaje</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-[#EDE4D7] shadow-xl space-y-4">
            <h4 className="text-base font-bold font-serif text-[#26201D]">¿Eliminar mensaje?</h4>
            <p className="text-xs text-[#574B45]">
              Esta acción no se puede deshacer y borrará la consulta del buzón.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#FCFAF7] border border-[#EDE4D7] text-[#574B45] hover:text-[#26201D]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDelete(showDeleteConfirm)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white"
              >
                Eliminar definitivamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
