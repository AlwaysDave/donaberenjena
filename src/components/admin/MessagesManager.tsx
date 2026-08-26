import React, { useState, useMemo } from 'react';
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
  Inbox,
  Sparkles,
  Tag
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { ContactMessage } from '../../types';

const SUBJECT_LABELS: Record<string, { label: string; color: string }> = {
  consulta_general: { label: 'Consulta General', color: 'bg-slate-100 text-slate-800 border-slate-200' },
  hazte_socio: { label: 'Alta de Socio', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  propuesta_cata: { label: 'Propuesta / Cata Privada', color: 'bg-purple-50 text-purple-800 border-purple-200' },
  duda_reserva: { label: 'Duda de Reserva', color: 'bg-blue-50 text-blue-800 border-blue-200' },
  prensa: { label: 'Prensa / Colaboración', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  otro: { label: 'Otro Asunto', color: 'bg-stone-100 text-stone-800 border-stone-200' }
};

export const MessagesManager: React.FC = () => {
  const { 
    contactMessages, 
    markContactMessageRead, 
    updateContactMessageStatus, 
    deleteContactMessage,
    useMockData 
  } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'nuevo' | 'leido' | 'respondido'>('todos');
  const [subjectFilter, setSubjectFilter] = useState<string>('todos');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [replyNotes, setReplyNotes] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

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

  const handleOpenDetail = (msg: ContactMessage) => {
    setSelectedMessage(msg);
    setReplyNotes(msg.replyNotes || '');
    if (!msg.read || msg.status === 'nuevo') {
      markContactMessageRead(msg.id, true);
    }
  };

  const handleSaveReply = async () => {
    if (!selectedMessage) return;
    await updateContactMessageStatus(selectedMessage.id, 'respondido', replyNotes.trim());
    setSelectedMessage(prev => prev ? { ...prev, status: 'respondido', replyNotes: replyNotes.trim(), repliedAt: new Date().toISOString(), read: true } : null);
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
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#521849] text-white">
                {newCount} sin leer
              </span>
            )}
          </div>
          <p className="text-xs text-[#574B45] mt-1">
            Gestión de solicitudes y mensajes recibidos desde el formulario público de contacto.
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
              En Gestión
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

      {/* Filters and Search Bar */}
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
            <option value="todos">Todos los motivos</option>
            <option value="consulta_general">Consulta General</option>
            <option value="hazte_socio">Alta de Socio</option>
            <option value="propuesta_cata">Propuesta / Cata Privada</option>
            <option value="duda_reserva">Duda de Reserva</option>
            <option value="prensa">Prensa / Colaboración</option>
            <option value="otro">Otro Asunto</option>
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
              const subjectInfo = SUBJECT_LABELS[msg.subject] || { label: msg.subject, color: 'bg-gray-100 text-gray-800 border-gray-200' };
              const isUnread = !msg.read || msg.status === 'nuevo';
              const isReplied = msg.status === 'respondido';
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
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" title="Mensaje no leído" />
                      )}
                      <h4 className={`text-sm sm:text-base ${isUnread ? 'font-bold text-[#26201D]' : 'font-semibold text-[#574B45]'}`}>
                        {msg.name}
                      </h4>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${subjectInfo.color}`}>
                        {subjectInfo.label}
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
                          En gestión
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

      {/* DETAIL MODAL / DRAWER */}
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
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${(SUBJECT_LABELS[selectedMessage.subject] || {}).color || 'bg-gray-100'}`}>
                    {(SUBJECT_LABELS[selectedMessage.subject] || {}).label || selectedMessage.subject}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#574B45]">Estado:</span>
                  <select
                    value={selectedMessage.status}
                    onChange={(e) => {
                      const newSt = e.target.value as 'nuevo' | 'leido' | 'respondido';
                      updateContactMessageStatus(selectedMessage.id, newSt, selectedMessage.replyNotes);
                      setSelectedMessage(prev => prev ? { ...prev, status: newSt, read: true } : null);
                    }}
                    className="px-3 py-1 bg-white border border-[#EDE4D7] rounded-xl text-xs font-bold text-[#26201D] focus:outline-none focus:border-[#521849]"
                  >
                    <option value="nuevo">🔴 Nuevo / Sin leer</option>
                    <option value="leido">🟡 En Gestión / Leído</option>
                    <option value="respondido">🟢 Respondido</option>
                  </select>
                </div>
              </div>

              {/* Direct Contact Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href={`mailto:${selectedMessage.email}?subject=Respuesta de Asoc. Gastronómica Doña Berenjena - ${encodeURIComponent(SUBJECT_LABELS[selectedMessage.subject]?.label || 'Consulta')}`}
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
                <label className="block text-xs font-bold uppercase tracking-wider text-[#574B45]">
                  Mensaje del Remitente
                </label>
                <div className="p-4 rounded-2xl bg-[#FCFAF7] border border-[#EDE4D7] text-sm text-[#26201D] leading-relaxed whitespace-pre-wrap">
                  {selectedMessage.message}
                </div>
              </div>

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

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleSaveReply}
                    className="px-4 py-2 rounded-xl bg-[#521849] hover:bg-[#3E1037] text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Guardar y Marcar como Respondido</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(selectedMessage.id)}
                    className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all text-xs font-semibold flex items-center gap-1 cursor-pointer"
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
