import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Logo } from '../../components/common/Logo';
import { ModoSencilloView } from './ModoSencilloView';
import { ModoAvanzadoView } from './ModoAvanzadoView';
import { AdminNotificationsCenter } from '../../components/admin/AdminNotificationsCenter';
import { computeAdminAlerts } from '../../services/adminAlertsService';
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
    activities,
    participants,
    members,
    contactMessages
  } = useData();
  const navigate = useNavigate();
  const [showNotificationsDrawer, setShowNotificationsDrawer] = useState(false);

  const activeAlerts = useMemo(() => {
    return computeAdminAlerts({
      activities,
      participants,
      members,
      contactMessages,
      isDemoMode: useMockData
    });
  }, [activities, participants, members, contactMessages, useMockData]);

  const activeAlertsCount = activeAlerts.length;

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
      <div className="bg-[#290824] text-white border-b border-[#3E1037] px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        {/* MOBILE VIEW (< sm) */}
        <div className="sm:hidden flex flex-col gap-2.5">
          {/* Mobile Row 1: Brand & User Identity */}
          <div className="flex items-center justify-between gap-2">
            <Link to="/" title="Ir a la web pública" className="flex items-center gap-2.5 min-w-0 hover:opacity-90">
              <Logo variant="boxed" className="h-7 w-auto shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-sm text-white tracking-tight leading-none">Doña Berenjena</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#842A76] text-white font-semibold uppercase">
                    {user.baseRole === 'advanced' ? 'Admin' : 'Coord'}
                  </span>
                </div>
                <p className="text-[11px] text-[#DFD3C2] mt-0.5 truncate max-w-[220px]">
                  {user.name}
                </p>
              </div>
            </Link>
          </div>

          {/* Mobile Row 2: Full-width Segmented Mode Switcher */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-[#191412] border border-[#3D3430] w-full gap-1">
            <button
              id="btn-switch-to-simple-mobile"
              type="button"
              onClick={() => switchRole('simple')}
              className={`min-h-[42px] flex items-center justify-center gap-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentRole === 'simple'
                  ? 'bg-[#C96043] text-white shadow-xs'
                  : 'text-[#DFD3C2] active:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Modo Sencillo</span>
            </button>
            <button
              id="btn-switch-to-advanced-mobile"
              type="button"
              onClick={() => switchRole('advanced')}
              className={`min-h-[42px] flex items-center justify-center gap-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentRole === 'advanced'
                  ? 'bg-[#521849] text-white shadow-xs'
                  : 'text-[#DFD3C2] active:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Modo Avanzado</span>
            </button>
          </div>

          {/* Mobile Row 3: Dedicated Full-Width Action Buttons (Avisos, Web Pública, Salir) */}
          <div className="grid grid-cols-3 gap-2 w-full pt-0.5">
            {/* Botón Avisos */}
            <button
              id="btn-admin-notifications-bell-mobile"
              type="button"
              onClick={() => setShowNotificationsDrawer(true)}
              className="min-h-[40px] px-2 py-1.5 rounded-xl bg-white/10 active:bg-white/20 text-[#EDE4D7] border border-white/10 flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer"
              title="Avisos del censo"
            >
              <Bell className="w-3.5 h-3.5 shrink-0" />
              <span>Avisos</span>
              {activeAlertsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-amber-950 font-black text-[10px]">
                  {activeAlertsCount}
                </span>
              )}
            </button>

            {/* Botón Ver Web Pública */}
            <Link
              to="/"
              className="min-h-[40px] px-2 py-1.5 rounded-xl bg-white/10 active:bg-white/20 text-[#EDE4D7] border border-white/10 flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors"
              title="Ver Web Pública"
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              <span>Ver Web</span>
            </Link>

            {/* Botón Salir */}
            <button
              id="btn-admin-logout-mobile"
              type="button"
              onClick={async () => {
                await logout();
                navigate('/admin/login');
              }}
              className="min-h-[40px] px-2 py-1.5 rounded-xl bg-rose-950/40 active:bg-rose-900/60 text-rose-200 border border-rose-800/40 flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer"
              title="Cerrar sesión"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0 text-rose-300" />
              <span>Salir</span>
            </button>
          </div>

          {/* Mobile Row 4: Mockup Toggle if in advanced mode */}
          {currentRole === 'advanced' && (
            <div className="flex items-center justify-between pt-1 border-t border-white/10 text-xs">
              <span className="text-[11px] text-[#DFD3C2]">Datos de prueba:</span>
              <button
                type="button"
                onClick={toggleMockData}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                  useMockData
                    ? 'bg-amber-400 text-amber-950 border-amber-500 shadow-xs'
                    : 'bg-[#191412] text-[#DFD3C2] border-[#3D3430]'
                }`}
                title="Cargar datos de prueba ficticios para demostración"
              >
                <Database className="w-3 h-3" />
                <span>Mockup</span>
                <span className={`text-[9px] px-1 py-0.2 rounded font-black uppercase ${
                  useMockData ? 'bg-amber-950 text-amber-400' : 'bg-[#3D3430] text-[#DFD3C2]'
                }`}>
                  {useMockData ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* DESKTOP VIEW (>= sm) - Unchanged */}
        <div className="hidden sm:flex max-w-7xl mx-auto items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/" title="Ir a la web pública" className="shrink-0 hover:opacity-90 transition-opacity">
              <Logo variant="boxed" className="h-9 w-auto" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight">Doña Berenjena</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#842A76] text-white font-semibold uppercase">
                  {user.baseRole === 'advanced' ? 'Admin Directiva' : 'Coordinador'}
                </span>
              </div>
              <p className="text-xs text-[#DFD3C2]">
                Sesión iniciada como: <strong className="text-white">{user.name}</strong> ({user.email})
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
              {activeAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-amber-400 text-amber-950 font-black text-[10px] shadow-xs">
                  {activeAlertsCount}
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
        {showNotificationsDrawer ? (
          <AdminNotificationsCenter 
            onClose={() => setShowNotificationsDrawer(false)} 
            onNavigateTab={() => {
              setShowNotificationsDrawer(false);
              if (currentRole !== 'advanced') {
                switchRole('advanced');
              }
            }}
          />
        ) : currentRole === 'simple' ? (
          <ModoSencilloView />
        ) : (
          <ModoAvanzadoView />
        )}
      </main>

      
    </div>
  );
};
