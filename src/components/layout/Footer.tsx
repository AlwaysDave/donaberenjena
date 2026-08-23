import React from 'react';
import { Link } from 'react-router-dom';
import { Wine, MapPin, Mail, Phone, Clock, Heart, Shield, ArrowUpRight } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#191412] text-[#EDE4D7] pt-14 pb-10 border-t border-[#3D3430]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-[#3D3430]/80">
          {/* Column 1: Association Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#521849] flex items-center justify-center text-white">
                <Wine className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold font-serif text-white">
                Doña Berenjena
              </span>
            </div>
            <p className="text-xs text-[#DFD3C2] leading-relaxed">
              Asociación Gastronómica sin ánimo de lucro dedicada a la difusión del patrimonio culinario, la cultura vitivinícola y los viajes de terruño en España.
            </p>
            <div className="pt-2 text-xs text-[#DFD3C2]">
              <p>Inscrita en el Registro Nacional de Asociaciones.</p>
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
                  <span>Catas Gastronómicas (Vino, Aceite, Vermut)</span>
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
                <span>Calle Mayor 14, Planta 1, 28013 Madrid (España)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#C96043] shrink-0" />
                <a href="tel:+34912345678" className="hover:text-white">+34 912 345 678</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#C96043] shrink-0" />
                <a href="mailto:secretaria@donaberenjena.es" className="hover:text-white">secretaria@donaberenjena.es</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#C96043] shrink-0" />
                <span>Atención a socios: Jueves a Sábados</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#574B45] gap-4">
          <p>
            © {new Date().getFullYear()} Asociación Gastronómica Doña Berenjena. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-6">
            <span>Aviso Legal</span>
            <span>Política de Privacidad</span>
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
