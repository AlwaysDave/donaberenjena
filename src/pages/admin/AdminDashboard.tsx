import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { ModoSencilloView } from './ModoSencilloView';
import { ModoAvanzadoView } from './ModoAvanzadoView';
import { 
  Shield, 
  Layers, 
  Sparkles, 
  LogOut, 
  ExternalLink, 
  AlertTriangle, 
  Database,
  Bell,
  CheckCircle,
  X,
  Clock,
  Trash2
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user, isAuthenticated, switchRole, logout } = useAuth();
  const { 
    isConnected, 
    connectionError, 
    useMockData, 
    toggleMockData, 
    adminNotifications, 
    unreadNotificationsCount, 
    markNotificationAsRead,
    deleteNotification 
  } = useData();
  const navigate = useNavigate();
  const [isGeminiConnected, setIsGeminiConnected] = useState<boolean | null>(null);
  const [showNotificationsDrawer, setShowNotificationsDrawer] = useState(false);
  const appVersion = "v1.2.0";

  useEffect(() => {
    fetch('/api/health/gemini')
      .then(res => setIsGeminiConnected(res.ok))
      .catch(() => setIsGeminiConnected(false));
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated || !user) {
    return null;
  }

  const currentRole = user.role;

  return (
    <div className="min-h-screen bg-[#FBF9F5] pb-20">
      {/* Top Admin Bar */}
      <div className="bg-[#290824] text-white border-b border-[#3E1037] px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#521849] flex items-center justify-center text-white shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight">Doña Berenjena</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#842A76] text-white font-semibold uppercase">
                  {user.baseRole === 'advanced' ? 'Admin Directiva' : 'Coordinador'}
                </span>
                
                {currentRole === 'advanced' && (
                  <>
                    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                      isConnected 
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800' 
                        : 'bg-rose-950 text-rose-300 border-rose-800'
                    }`}>
                      <Database className="w-2.5 h-2.5" />
                      {isConnected ? '🟢 Firestore Conectado' : '🔴 Sin Conexión'}
                    </span>

                    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                      isGeminiConnected 
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800' 
                        : isGeminiConnected === null ? 'bg-gray-900 text-gray-300 border-gray-700' : 'bg-rose-950 text-rose-300 border-rose-800'
                    }`}>
                      {isGeminiConnected ? '🟢 IA OK' : isGeminiConnected === null ? '⚪ IA' : '🔴 Sin IA'}
                    </span>

                    <span className="text-[10px] font-semibold text-[#DFD3C2] tracking-wide ml-1">
                      {appVersion}
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs text-[#DFD3C2]">
                Inición sesiada como: <strong className="text-white">{user.name}</strong> ({user.email})
              </p>
            </div>
          </div>

          {/* Mode Switcher and Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {currentRole === 'advanced' && (
              <button
                type="button"
                onClick={toggleMockData}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                  useMockData
                    ? 'bg-amber-400 text-amber-950 border-amber-500 shadow-[0_0_10px_rgba(251,191,36,0.3)]'
                    : 'bg-[#191412] text-[#DFD3C2] border-[#3D3430] hover:text-white'
                }`}
                title="Cargar datos de prueba ficticios para demostración"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Datos Mockup</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-sm uppercase tracking-wider ${
                  useMockData ? 'bg-amber-950 text-amber-400' : 'bg-[#3D3430] text-[#DFD3C2]'
                }`}>
                  {useMockData ? 'ON' : 'OFF'}
                </span>
              </button>
            )}

            {/* Any logged in admin can switch freely between simple and advanced views */}
            <div className="inline-flex p-1 rounded-xl bg-[#191412] border border-[#3D3430]">
              <button
                id="btn-switch-to-simple"
                type="button"
                onClick={() => switchRole('simple')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  currentRole === 'simple'
                    ? 'bg-[#C96043] text-white shadow-xs'
                    : 'text-[#DFD3C2] hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Modo Sencillo</span>
              </button>
              <button
                id="btn-switch-to-advanced"
                type="button"
                onClick={() => switchRole('advanced')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  currentRole === 'advanced'
                    ? 'bg-[#521849] text-white shadow-xs'
                    : 'text-[#DFD3C2] hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Modo Avanzado</span>
              </button>
            </div>

            {/* Notification Bell Button */}
            <button
              id="btn-admin-notifications-bell"
              type="button"
              onClick={() => setShowNotificationsDrawer(true)}
              className="relative p-2 rounded-lg bg-white/10 hover:bg-white/20 text-[#EDE4D7] hover:text-white transition-colors cursor-pointer"
              title="Buzón de discrepancias y avisos del censo"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-amber-400 text-amber-950 font-black text-[10px] shadow-xs">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-[#EDE4D7] transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver Web Pública</span>
            </Link>

            <button
              id="btn-admin-logout"
              type="button"
              onClick={async () => {
                await logout();
                navigate('/admin/login');
              }}
              className="p-2 rounded-lg bg-white/10 hover:bg-rose-900/50 text-xs font-medium text-[#EDE4D7] transition-colors cursor-pointer"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Disconnection Warning if not connected */}
      {!isConnected && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-rose-900">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                <strong>Atención:</strong> No hay conexión activa con Firestore ({connectionError || 'revisa las credenciales del proyecto'}).
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {currentRole === 'simple' ? (
          <ModoSencilloView />
        ) : (
          <ModoAvanzadoView />
        )}
      </main>

      {/* Admin Notifications Drawer / Modal */}
      {showNotificationsDrawer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center sm:justify-end p-0 sm:p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-[#FCFAF7] h-full sm:h-auto sm:max-h-[90vh] sm:rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#EDE4D7] flex flex-col justify-between animate-scaleUp">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#EDE4D7] mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-900">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-serif text-[#26201D]">
                      Buzón de Incidencias y Contraste
                    </h3>
                    <p className="text-xs text-[#574B45]">
                      {unreadNotificationsCount} aviso(s) pendiente(s) de revisión
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowNotificationsDrawer(false)}
                  className="p-1.5 rounded-xl hover:bg-[#EDE4D7] text-[#574B45] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Notification list */}
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {adminNotifications.length === 0 ? (
                  <div className="p-8 text-center text-[#8C7E77]">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
                    <p className="font-semibold text-xs text-[#574B45]">No hay avisos pendientes</p>
                    <p className="text-[11px] mt-1">El contraste con el censo de socios está al día sin discrepancias.</p>
                  </div>
                ) : (
                  adminNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3.5 rounded-2xl border text-xs transition-all space-y-2 ${
                        notif.read
                          ? 'bg-white border-[#EDE4D7] opacity-75'
                          : 'bg-amber-50/70 border-amber-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <span className="font-bold text-[#26201D] block">{notif.title}</span>
                          <p className="text-xs text-[#574B45] leading-relaxed">{notif.message}</p>
                        </div>
                        <span className="text-[10px] text-[#8C7E77] whitespace-nowrap flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(notif.createdAt).toLocaleDateString('es-ES')}
                        </span>
                      </div>

                      <div className="pt-2 flex items-center justify-between border-t border-[#EDE4D7]">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          notif.read ? 'bg-stone-200 text-stone-700' : 'bg-amber-200 text-amber-900'
                        }`}>
                          {notif.read ? 'Resuelta' : 'Pendiente'}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {!notif.read && (
                            <button
                              type="button"
                              onClick={() => markNotificationAsRead(notif.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle className="w-3 h-3" />
                              <span>Marcar como resuelta</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => deleteNotification(notif.id)}
                            className="p-1 rounded-lg hover:bg-rose-100 text-rose-700 cursor-pointer"
                            title="Eliminar notificación"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-[#EDE4D7] mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowNotificationsDrawer(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#521849] hover:bg-[#3E1037] text-white text-xs font-semibold cursor-pointer"
              >
                Cerrar Buzón
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
