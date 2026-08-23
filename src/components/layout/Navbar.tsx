import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
  Layers
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

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
              Asociación Gastronómica fundada para el fomento de la cultura del vino y la cocina
            </span>
            <span className="flex items-center gap-1 text-[#DFD3C2]">
              <Clock className="w-3 h-3 text-[#C96043]" />
              Actividades periódicas de Jueves a Domingo
            </span>
          </div>
          <div className="flex items-center gap-4 text-[#DFD3C2]">
            <a href="tel:+34912345678" className="hover:text-white flex items-center gap-1 transition-colors">
              <Phone className="w-3 h-3 text-[#C96043]" />
              +34 912 345 678
            </a>
            {isAuthenticated ? (
              <span className="text-[#C96043] font-medium">
                Modo Admin activo ({user?.role === 'advanced' ? 'Avanzado' : 'Sencillo'})
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
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  title="Cerrar sesión"
                  className="p-2 rounded-lg text-[#574B45] hover:text-[#5C1D24] hover:bg-[#F6F1EA] transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                id="btn-nav-admin-login"
                to="/admin/login"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#EDE4D7] text-xs font-medium text-[#574B45] hover:text-[#521849] hover:border-[#DFD3C2] hover:bg-[#F6F1EA] transition-all"
              >
                <Shield className="w-3.5 h-3.5 text-[#521849]" />
                <span>Acceso Admin</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            {isAuthenticated && (
              <Link
                to="/admin"
                className="px-2.5 py-1 rounded-md bg-[#521849] text-white text-xs font-medium"
              >
                Admin
              </Link>
            )}
            <button
              id="btn-mobile-menu-toggle"
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-[#26201D] hover:bg-[#F6F1EA] focus:outline-none"
              aria-label="Abrir menú de navegación"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isOpen && (
          <div
            id="mobile-nav-drawer"
            className="lg:hidden border-t border-[#EDE4D7] bg-[#FCFAF7] px-4 pt-3 pb-6 space-y-1 animate-fadeIn"
          >
            <div className="grid grid-cols-1 gap-1">
              {navLinks.map((link) => {
                const active = isActive(link.path);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-[#521849] text-white font-semibold'
                        : 'text-[#26201D] hover:bg-[#F6F1EA]'
                    }`}
                  >
                    {Icon && <Icon className="w-4 h-4 shrink-0" />}
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="pt-4 mt-3 border-t border-[#EDE4D7] flex flex-col gap-2">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/admin"
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-[#521849] text-white text-sm font-medium"
                  >
                    <Layers className="w-4 h-4" />
                    <span>Ir al Panel de Administración ({user?.role === 'advanced' ? 'Avanzado' : 'Sencillo'})</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      navigate('/');
                    }}
                    className="flex items-center justify-center gap-2 w-full py-2 rounded-lg border border-[#EDE4D7] text-xs font-medium text-[#5C1D24]"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Cerrar sesión de administrador</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/admin/login"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-[#EDE4D7] text-[#521849] text-sm font-medium bg-white"
                >
                  <Shield className="w-4 h-4" />
                  <span>Acceso para Administradores</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};
