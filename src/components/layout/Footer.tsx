import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../common/Logo';
import { Wine, MapPin, Mail, Phone, Clock, Heart, Shield, ArrowUpRight } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#191412] text-[#EDE4D7] pt-14 pb-10 border-t border-[#3D3430]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-[#3D3430]/80">
          {/* Column 1: Association Identity */}
          <div className="space-y-4">
            <Link to="/" className="inline-block hover:opacity-95 transition-opacity" title="Asociación Cultural Gastronómica Doña Berenjena">
              <Logo variant="boxed" />
            </Link>
            <p className="text-xs text-[#DFD3C2] leading-relaxed pt-1">
              Asociación Cultural y Gastronómica sin ánimo de lucro fundada en Bolaños de Calatrava (2013). Dedicada a la difusión del patrimonio culinario, la cultura vitivinícola y los productos autóctonos.
            </p>
            <div className="pt-2 text-xs text-[#DFD3C2]">
              <p>Inscrita en el Registro de Asociaciones.</p>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-[#C96043]">
              Actividades
            </h4>
            <ul className="space-y-2 text-xs text-[#DFD3C2]">
              <li>
                <Link to="/catas" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <span>Catas Gastronómicas</span>
                </Link>
              </li>
              <li>
                <Link to="/cursos" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <span>Cursos y Talleres de Cocina</span>
                </Link>
              </li>
              <li>
                <Link to="/viajes" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <span>Viajes Enogastronómicos</span>
                </Link>
              </li>
              <li>
                <Link to="/instalaciones" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <span>Salón de Catas y Fogones</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Institutional Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-[#C96043]">
              La Asociación
            </h4>
            <ul className="space-y-2 text-xs text-[#DFD3C2]">
              <li>
                <Link to="/conocenos" className="hover:text-white transition-colors">
                  Quiénes somos e Historia
                </Link>
              </li>
              <li>
                <Link to="/contacto" className="hover:text-white transition-colors">
                  Ubicación y Contacto
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="hover:text-white transition-colors inline-flex items-center gap-1">
                  <Shield className="w-3 h-3 text-[#C96043]" />
                  <span>Acceso de Administración</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact & Headquarters */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-[#C96043]">
              Sede Social
            </h4>
            <ul className="space-y-2.5 text-xs text-[#DFD3C2]">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#C96043] shrink-0 mt-0.5" />
                <span>Polígono Industrial “El Salobral “- Centro de Formación – Bolaños de Calatrava, 13260 Ciudad Real (España)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#C96043] shrink-0" />
                <a href="tel:+34912345678" className="hover:text-white">+34 912 345 678</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#C96043] shrink-0" />
                <a href="mailto:donaberenjena@gmail.com" className="hover:text-white">donaberenjena@gmail.com</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#574B45] gap-4">
          <p>
            © {new Date().getFullYear()} Asociación Gastronómica Doña Berenjena. Todos los derechos reservados.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <span>Aviso Legal</span>
            <span>Política de Privacidad</span>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('dnb_open_cookie_settings'));
                }
              }}
              className="text-[#DFD3C2] hover:text-[#C96043] transition-colors cursor-pointer underline underline-offset-2"
            >
              Preferencias de Cookies
            </button>
            <Link to="/admin/login" className="text-[#C96043] hover:underline flex items-center gap-1">
              <span>Gestión Interna</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
