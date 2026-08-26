import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { 
  Menu, 
  X, 
  Wine, 
  ChefHat, 
  Compass, 
  Info, 
  Building2, 
  Mail, 
  Shield, 
  LogOut, 
  Sparkles,
  Phone,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isGeminiConnected, setIsGeminiConnected] = useState<boolean | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { isConnected, connectionError } = useData();
  
  // Hardcoded version for display
  const appVersion = "v1.2.0";

  useEffect(() => {
    // Check Gemini API status
    fetch('/api/health/gemini')
      .then(res => {
        setIsGeminiConnected(res.ok);
      })
      .catch(() => {
        setIsGeminiConnected(false);
      });
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { label: 'Inicio', path: '/' },
    { label: 'Catas', path: '/catas', icon: Wine },
    { label: 'Cursos', path: '/cursos', icon: ChefHat },
    { label: 'Viajes', path: '/viajes', icon: Compass },
    { label: 'Conócenos', path: '/conocenos', icon: Info },
    { label: 'Instalaciones', path: '/instalaciones', icon: Building2 },
    { label: 'Contacto', path: '/contacto', icon: Mail },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 w-full transition-all duration-200">
      {/* Top Banner (gastronomic association header) */}
      <div className="bg-[#290824] text-[#EDE4D7] text-[11px] py-1.5 px-4 hidden md:block border-b border-[#3E1037]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-[#DFD3C2]">
              <Sparkles className="w-3 h-3 text-[#C96043]" />
              Asociación Cultural y Gastronómica nacida en 2013
            </span>
            <span className="flex items-center gap-1 text-[#DFD3C2]">
              <Clock className="w-3 h-3 text-[#C96043]" />
              Actividades periódicas de Jueves a Domingo
            </span>
          </div>
          <div className="flex items-center gap-4 text-[#DFD3C2]">
            <div className="flex items-center gap-2">
              {/* Version Display */}
              <span className="text-[10px] font-semibold text-[#C96043] tracking-wide">
                {appVersion}
              </span>
              
              {/* Traffic Light Status in Top Bar */}
              <div 
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/30 border border-white/10 text-[10px]"
                title={isConnected ? "Conexión activa con Firestore (.env verificado)" : (connectionError || "Sin conexión con la base de datos")}
              >
                <span className="text-xs">{isConnected ? '🟢' : '🔴'}</span>
                <span className={isConnected ? "text-emerald-300 font-medium" : "text-rose-300 font-medium"}>
                  {isConnected ? 'BD' : 'Sin BD'}
                </span>
              </div>
              
              {/* Gemini Traffic Light Status */}
              <div 
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/30 border border-white/10 text-[10px]"
                title={isGeminiConnected ? "Conexión activa con Gemini AI" : "Sin conexión con Gemini AI"}
              >
                <span className="text-xs">{isGeminiConnected ? '🟢' : (isGeminiConnected === null ? '⚪' : '🔴')}</span>
                <span className={isGeminiConnected ? "text-emerald-300 font-medium" : (isGeminiConnected === null ? "text-gray-300 font-medium" : "text-rose-300 font-medium")}>
                  {isGeminiConnected ? 'IA' : (isGeminiConnected === null ? 'IA' : 'Sin IA')}
                </span>
              </div>
            </div>

            <a href="tel:+34912345678" className="hover:text-white flex items-center gap-1 transition-colors">
              <Phone className="w-3 h-3 text-[#C96043]" />
              +34 912 345 678
            </a>
            {isAuthenticated ? (
              <span className="text-[#C96043] font-medium">
                Admin: {user?.name}
              </span>
            ) : (
              <Link to="/admin/login" className="hover:text-white transition-colors">
                Acceso Administración
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav
        className={`w-full bg-[#FBF9F5]/95 backdrop-blur-md border-b transition-all duration-200 ${
          isScrolled ? 'border-[#DFD3C2] shadow-xs py-3' : 'border-[#EDE4D7] py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo / Brand Name */}
          <Link
            id="brand-logo-link"
            to="/"
            className="flex items-center gap-3 group text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#521849] to-[#290824] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <Wine className="w-5 h-5 text-[#EDE4D7]" />
            </div>
            <div>
              <span className="block text-xl md:text-2xl font-bold font-serif text-[#26201D] tracking-tight group-hover:text-[#521849] transition-colors leading-none">
                Doña Berenjena
              </span>
              <span className="block text-[10px] md:text-[11px] uppercase tracking-widest text-[#574B45] font-semibold mt-0.5">
                Asociación Gastronómica
              </span>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  id={`nav-link-${link.label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`}
                  to={link.path}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-[#521849] text-white shadow-xs'
                      : 'text-[#3D3430] hover:text-[#521849] hover:bg-[#F6F1EA]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right Action / Admin Button */}
          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  id="btn-nav-admin-panel"
                  to="/admin"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#F6EDF4] border border-[#521849]/30 text-[#521849] text-xs font-semibold hover:bg-[#521849] hover:text-white transition-all shadow-xs"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Panel ({user?.role === 'advanced' ? 'Avanzado' : 'Sencillo'})</span>
                </Link>

                <button
                  id="btn-nav-logout"
                  type="button"
                  onClick={async () => {
                    await logout();
                    navigate('/');
                  }}
                  className="p-2 rounded-lg text-[#574B45] hover:text-red-700 hover:bg-red-50 transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                id="btn-nav-reserve-shortcut"
                to="/catas"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#521849] hover:bg-[#3E1037] text-white text-xs font-semibold tracking-wide transition-all shadow-xs"
              >
                <span>Ver Próximas Catas</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <span className="text-[10px] font-semibold text-[#C96043] tracking-wide mr-1">
              {appVersion}
            </span>
            <div 
              className="flex items-center gap-1 text-sm px-2 py-1 rounded-md bg-white border border-[#EDE4D7]"
              title={isConnected ? 'BD Conectada' : 'Sin conexión'}
            >
              <span>{isConnected ? '🟢' : '🔴'}</span>
              <span>{isGeminiConnected ? '🟢' : (isGeminiConnected === null ? '⚪' : '🔴')}</span>
            </div>

            <button
              id="btn-mobile-menu-toggle"
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl bg-[#FCFAF7] border border-[#EDE4D7] text-[#26201D] hover:bg-[#F6F1EA] transition-colors"
              aria-label="Abrir menú"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isOpen && (
          <div className="lg:hidden border-t border-[#EDE4D7] bg-[#FBF9F5] px-4 pt-3 pb-6 space-y-3 animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="grid grid-cols-1 gap-1">
              {navLinks.map((link) => {
                const IconComponent = link.icon;
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      active
                        ? 'bg-[#521849] text-white'
                        : 'text-[#26201D] hover:bg-[#F6F1EA]'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="pt-3 border-t border-[#EDE4D7] flex flex-col gap-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#EDE4D7] text-xs mb-1">
                <span className="text-[#574B45]">Estado de Conexiones:</span>
                <div className="flex flex-col items-end gap-1">
                  <span className="font-semibold flex items-center gap-1.5">
                    <span className={isConnected ? "text-emerald-700" : "text-rose-700"}>
                      {isConnected ? 'Firestore OK' : 'Sin BD'}
                    </span>
                    <span>{isConnected ? '🟢' : '🔴'}</span>
                  </span>
                  <span className="font-semibold flex items-center gap-1.5">
                    <span className={isGeminiConnected ? "text-emerald-700" : (isGeminiConnected === null ? "text-gray-500" : "text-rose-700")}>
                      {isGeminiConnected ? 'Gemini AI OK' : (isGeminiConnected === null ? 'Gemini AI' : 'Sin IA')}
                    </span>
                    <span>{isGeminiConnected ? '🟢' : (isGeminiConnected === null ? '⚪' : '🔴')}</span>
                  </span>
                </div>
              </div>

              {isAuthenticated ? (
                <>
                  <Link
                    to="/admin"
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#521849] text-white text-xs font-semibold shadow-xs"
                  >
                    <Layers className="w-4 h-4" />
                    <span>Ir al Panel de Administración</span>
                  </Link>
                  <button
                    type="button"
                    onClick={async () => {
                      await logout();
                      navigate('/');
                    }}
                    className="w-full py-2.5 rounded-xl border border-[#EDE4D7] text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Cerrar Sesión
                  </button>
                </>
              ) : (
                <Link
                  to="/admin/login"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs font-semibold text-[#521849] hover:bg-[#F6F1EA]"
                >
                  <Shield className="w-4 h-4" />
                  <span>Acceso Administración</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};
