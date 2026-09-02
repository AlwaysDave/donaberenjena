import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Logo } from '../common/Logo';
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
              Asociación Cultural y Gastronómica nacida en 2013
            </span>
            <span className="flex items-center gap-1 text-[#DFD3C2]">
              <Clock className="w-3 h-3 text-[#C96043]" />
              Actividades periódicas de Jueves a Domingo
            </span>
          </div>
          
          <div className="flex items-center gap-4 text-[#DFD3C2]">
            <div className="flex items-center gap-2">
            </div>
          </div>
        </div>
      </div>

      <nav className={`bg-[#FBF9F5] transition-all duration-300 ${
        isScrolled ? 'shadow-md py-2 border-b border-[#EDE4D7]' : 'py-4 border-b border-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo area */}
            <Link to="/" className="flex items-center group shrink-0 my-auto" aria-label="Inicio - Asociación Cultural Gastronómica Doña Berenjena">
              <Logo variant="default" theme="light" />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              <div className="flex items-center gap-1 p-1 bg-white rounded-2xl border border-[#EDE4D7] shadow-2xs mr-4">
                {navLinks.map((link) => {
                  const IconComponent = link.icon;
                  const active = isActive(link.path);
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                        active 
                          ? 'bg-[#521849] text-white shadow-xs' 
                          : 'text-[#574B45] hover:bg-[#F6F1EA] hover:text-[#26201D]'
                      }`}
                    >
                      {IconComponent && <IconComponent className="w-3.5 h-3.5" />}
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Admin Access Button (Desktop) */}
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <Link
                    to="/admin"
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#FCFAF7] hover:bg-[#F6F1EA] border border-[#EDE4D7] rounded-xl text-[#521849] text-xs font-bold transition-colors"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Panel Directiva</span>
                  </Link>
                  <button
                    onClick={logout}
                    className="p-2 rounded-xl border border-[#EDE4D7] text-[#574B45] hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Cerrar sesión"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/admin/login"
                  className="flex items-center gap-2 px-4 py-2 border-2 border-[#521849]/20 hover:border-[#521849] rounded-xl text-xs font-bold text-[#521849] transition-all bg-white hover:bg-[#FCFAF7]"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Acceso Socios</span>
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-2 lg:hidden">
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
