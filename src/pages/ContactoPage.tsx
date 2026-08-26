import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2, MessageSquare } from 'lucide-react';

export const ContactoPage: React.FC = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    asunto: 'consulta_general',
    mensaje: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        nombre: '',
        email: '',
        telefono: '',
        asunto: 'consulta_general',
        mensaje: ''
      });
    }, 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 space-y-16">
      {/* Header */}
      <div className="max-w-3xl space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#521849]">
          <Mail className="w-4 h-4" />
          <span>Atención al Socio y Público</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold font-serif text-[#26201D] tracking-tight">
          Contacto y Ubicación
        </h1>
        <p className="text-base sm:text-lg text-[#574B45] font-light leading-relaxed">
          ¿Deseas información sobre cómo hacerte socio, proponer una actividad o consultar disponibilidad de nuestras catas? Estaremos encantados de atenderte.
        </p>
      </div>

      {/* Grid: Form (7 cols) + Contact Cards (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Contact Form */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-10 rounded-3xl border border-[#EDE4D7] shadow-xs">
          <h2 className="text-2xl font-bold font-serif text-[#26201D] mb-6">
            Envíanos un mensaje
          </h2>

          {submitted ? (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2 text-center animate-fadeIn">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="text-base font-bold">¡Mensaje recibido con éxito!</h3>
              <p className="text-xs text-emerald-700 max-w-sm mx-auto">
                Gracias por ponerte en contacto con la Asociación Gastronómica Doña Berenjena. La secretaría te responderá a la mayor brevedad.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#26201D] mb-1">
                  Nombre completo *
                </label>
                <input
                  id="input-contacto-nombre"
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Tu nombre y apellidos"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-sm focus:outline-none focus:border-[#521849] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#26201D] mb-1">
                    Correo electrónico *
                  </label>
                  <input
                    id="input-contacto-email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ejemplo@correo.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-sm focus:outline-none focus:border-[#521849] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#26201D] mb-1">
                    Teléfono
                  </label>
                  <input
                    id="input-contacto-telefono"
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    placeholder="+34 600 000 000"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-sm focus:outline-none focus:border-[#521849] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#26201D] mb-1">
                  Motivo de la consulta
                </label>
                <select
                  id="select-contacto-asunto"
                  value={formData.asunto}
                  onChange={(e) => setFormData({ ...formData, asunto: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-sm focus:outline-none focus:border-[#521849] focus:bg-white"
                >
                  <option value="consulta_general">Información general de actividades</option>
                  <option value="hazte_socio">Solicitud de alta como socio</option>
                  <option value="propuesta_cata">Propuesta de cata para bodega/productor</option>
                  <option value="alquiler_espacio">Colaboraciones y eventos privados</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#26201D] mb-1">
                  Mensaje o consulta *
                </label>
                <textarea
                  id="input-contacto-mensaje"
                  rows={4}
                  required
                  value={formData.mensaje}
                  onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                  placeholder="Escribe aquí tu consulta con todo detalle..."
                  className="w-full px-4 py-2.5 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-sm focus:outline-none focus:border-[#521849] focus:bg-white resize-none"
                />
              </div>

              <button
                id="btn-enviar-contacto"
                type="submit"
                className="w-full py-3.5 rounded-xl bg-[#521849] hover:bg-[#3E1037] text-white text-sm font-semibold tracking-wide transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Enviar Consulta</span>
              </button>
            </form>
          )}
        </div>

        {/* Contact Info Sidebar */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#FCFAF7] p-6 sm:p-8 rounded-3xl border border-[#EDE4D7] space-y-6">
            <h3 className="text-xl font-bold font-serif text-[#26201D]">
              Datos de la Sede
            </h3>

            <div className="space-y-4 text-xs sm:text-sm text-[#3D3430]">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#521849] shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-[#26201D]">Dirección Social:</strong>
                  <span>Polígono Industrial “El Salobral “- Centro de Formación – Bolaños de Calatrava, 13260 Ciudad Real (España)</span>
                  <p className="text-xs text-[#574B45] mt-0.5">Salida de Bolaños dirección a Torralba</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-[#521849] shrink-0" />
                <div>
                  <strong className="block text-[#26201D]">Teléfono Directo:</strong>
                  <a href="tel:+34912345678" className="hover:text-[#521849]">+34 912 345 678</a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[#521849] shrink-0" />
                <div>
                  <strong className="block text-[#26201D]">Correo de Secretaría:</strong>
                  <a href="mailto:secretaria@donaberenjena.es" className="hover:text-[#521849]">secretaria@donaberenjena.es</a>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-[#F6EDF4] border border-[#521849]/20 space-y-2">
            <h4 className="text-sm font-bold text-[#521849] flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span>¿Quieres organizar una cata privada?</span>
            </h4>
            <p className="text-xs text-[#574B45] leading-relaxed">
              Las instalaciones de Doña Berenjena están disponibles para grupos corporativos y celebraciones gastronómicas bajo reserva anticipada.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
