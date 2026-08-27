import React, { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Bell, CheckCircle, Clock, Trash2, ShieldAlert, ArrowLeft } from 'lucide-react';

export const AdminNotificationsCenter: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { adminNotifications, markNotificationAsRead, deleteNotification } = useData();

  const sortedNotifs = useMemo(() => {
    return [...adminNotifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [adminNotifications]);

  const unreadCount = sortedNotifs.filter(n => !n.read).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onClose}
          className="p-2 rounded-xl bg-white border border-[#EDE4D7] text-[#574B45] hover:text-[#26201D] hover:bg-[#F6F1EA] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#26201D] flex items-center gap-3">
            Centro de Avisos y Alertas
            {unreadCount > 0 && (
              <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-sm font-bold">
                {unreadCount} sin leer
              </span>
            )}
          </h2>
          <p className="text-[#574B45] text-sm mt-1">Supervisión de discrepancias de socios, aforos, y gastos.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-[#EDE4D7] shadow-sm overflow-hidden">
        {sortedNotifs.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-[#26201D]">Todo en orden</h3>
            <p className="text-[#574B45]">No hay avisos pendientes en el sistema.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#EDE4D7]">
            {sortedNotifs.map(notif => (
              <div key={notif.id} className={`p-6 transition-colors ${notif.read ? 'bg-white opacity-80' : 'bg-amber-50/40'}`}>
                <div className="flex justify-between items-start gap-4">
                  <div className="flex gap-4">
                    <div className={`p-3 rounded-2xl shrink-0 ${notif.read ? 'bg-stone-100 text-stone-500' : 'bg-amber-100 text-amber-700'}`}>
                      {notif.severity === 'critical' ? <ShieldAlert className="w-6 h-6" /> : <Bell className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-[#26201D] text-lg">{notif.title || 'Aviso'}</h4>
                        <span className="text-xs text-[#8C7E77] flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(notif.createdAt).toLocaleString('es-ES')}
                        </span>
                      </div>
                      <p className="text-[#574B45] leading-relaxed">{notif.message}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {!notif.read ? (
                      <button
                        onClick={() => markNotificationAsRead(notif.id)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Marcar como resuelta
                      </button>
                    ) : (
                      <span className="px-3 py-1 rounded-lg bg-stone-100 text-stone-600 text-xs font-bold uppercase tracking-wider">
                        Resuelta
                      </span>
                    )}
                    <button
                      onClick={() => deleteNotification(notif.id)}
                      className="px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-sm font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
