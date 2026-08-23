import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ModoSencilloView } from './ModoSencilloView';
import { ModoAvanzadoView } from './ModoAvanzadoView';
import { Shield, Layers, Sparkles, LogOut, ArrowLeft, User, ExternalLink } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user, isAuthenticated, switchRole, logout } = useAuth();
  const navigate = useNavigate();

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
                  Admin
                </span>
              </div>
              <p className="text-xs text-[#DFD3C2]">
                Sesión iniciada como: <strong className="text-white">{user.name}</strong> ({user.email})
              </p>
            </div>
          </div>

          {/* Mode Switcher and Controls */}
          <div className="flex flex-wrap items-center gap-3">
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
              onClick={() => {
                logout();
                navigate('/admin/login');
              }}
              className="p-2 rounded-lg bg-white/10 hover:bg-rose-900/50 text-xs font-medium text-[#EDE4D7] transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {currentRole === 'simple' ? (
          <ModoSencilloView />
        ) : (
          <ModoAvanzadoView />
        )}
      </main>
    </div>
  );
};
