import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AdminRole } from '../../types';
import { Shield, Lock, Mail, Sparkles, Layers, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginAsDemo, isAuthenticated, user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AdminRole>('advanced');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await login(email, role);
    setLoading(false);
    navigate('/admin');
  };

  const handleDemoLogin = (selectedRole: AdminRole) => {
    loginAsDemo(selectedRole);
    navigate('/admin');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#EDE4D7] shadow-xl p-8 sm:p-10 space-y-8">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#521849] text-white flex items-center justify-center mx-auto shadow-md">
            <Shield className="w-6 h-6" />
          </div>
          <span className="text-xs uppercase tracking-widest font-bold text-[#521849]">
            Gestión Interna
          </span>
          <h1 className="text-2xl font-bold font-serif text-[#26201D]">
            Panel de Administración
          </h1>
          <p className="text-xs text-[#574B45]">
            Acceso exclusivo para la Junta Directiva y Coordinadores de Doña Berenjena.
          </p>
        </div>

        {/* Demo Fast Access Buttons */}
        <div className="p-4 rounded-2xl bg-[#FCFAF7] border border-[#EDE4D7] space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#521849]">
            <Zap className="w-4 h-4 text-[#C96043]" />
            <span>Acceso Rápido de Prueba (Demo)</span>
          </div>
          <p className="text-[11px] text-[#574B45]">
            Elige el perfil para evaluar los dos modos de gestión de la asociación:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              id="btn-demo-advanced"
              type="button"
              onClick={() => handleDemoLogin('advanced')}
              className="px-3 py-2 rounded-xl bg-[#521849] hover:bg-[#3E1037] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Modo Avanzado</span>
            </button>
            <button
              id="btn-demo-simple"
              type="button"
              onClick={() => handleDemoLogin('simple')}
              className="px-3 py-2 rounded-xl bg-[#C96043] hover:bg-[#B84E33] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Modo Sencillo</span>
            </button>
          </div>
        </div>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-[#EDE4D7]"></div>
          <span className="flex-shrink mx-4 text-[11px] text-[#574B45] uppercase">
            o con credenciales
          </span>
          <div className="flex-grow border-t border-[#EDE4D7]"></div>
        </div>

        {/* Standard Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#26201D] mb-1">
              Correo del administrador
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#574B45] absolute left-3.5 top-3" />
              <input
                id="input-admin-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@donaberenjena.es"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs focus:outline-none focus:border-[#521849] focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#26201D] mb-1">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#574B45] absolute left-3.5 top-3" />
              <input
                id="input-admin-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs focus:outline-none focus:border-[#521849] focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#26201D] mb-1">
              Modo de trabajo inicial
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('advanced')}
                className={`py-2 px-3 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  role === 'advanced'
                    ? 'border-[#521849] bg-[#F6EDF4] text-[#521849]'
                    : 'border-[#EDE4D7] bg-white text-[#574B45]'
                }`}
              >
                Avanzado (Completo)
              </button>
              <button
                type="button"
                onClick={() => setRole('simple')}
                className={`py-2 px-3 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  role === 'simple'
                    ? 'border-[#C96043] bg-[#F9ECE8] text-[#C96043]'
                    : 'border-[#EDE4D7] bg-white text-[#574B45]'
                }`}
              >
                Sencillo (Rápido)
              </button>
            </div>
          </div>

          <button
            id="btn-admin-login-submit"
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#521849] hover:bg-[#3E1037] text-white text-xs font-semibold tracking-wide transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>{loading ? 'Accediendo...' : 'Iniciar Sesión'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
