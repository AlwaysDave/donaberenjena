import React, { useState } from 'react';
import { Activity, ReservationFormData } from '../../types';
import { useData } from '../../context/DataContext';
import { Users, CreditCard, ShieldCheck, Phone, CheckCircle2, ChevronRight, HelpCircle, X, Sparkles } from 'lucide-react';

interface ReservationBlockProps {
  activity: Activity;
  className?: string;
  // Hook for future payment gateway (Bizum / Stripe)
  enableDirectPayment?: boolean;
}

export const ReservationBlock: React.FC<ReservationBlockProps> = ({
  activity,
  className = '',
  enableDirectPayment = false
}) => {
  const { reserveSpots } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showHowToReserve, setShowHowToReserve] = useState(false);
  const [formData, setFormData] = useState<ReservationFormData>({
    fullName: '',
    email: '',
    phone: '',
    spots: 1,
    notes: '',
    membershipNumber: ''
  });
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableSpots = Math.max(0, activity.totalSpots - activity.bookedSpots);
  const occupancyPercentage = Math.min(100, Math.round((activity.bookedSpots / activity.totalSpots) * 100));
  const isSoldOut = availableSpots <= 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    const result = await reserveSpots(activity.id, formData.spots, formData);
    setIsSubmitting(false);

    if (result.success) {
      setStatusMessage({ type: 'success', text: result.message });
      setTimeout(() => {
        setIsModalOpen(false);
        setStatusMessage(null);
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          spots: 1,
          notes: '',
          membershipNumber: ''
        });
      }, 2500);
    } else {
      setStatusMessage({ type: 'error', text: result.message });
    }
  };

  return (
    <div
      id={`reservation-block-${activity.id}`}
      className={`rounded-2xl border border-[#EDE4D7] bg-white p-6 md:p-8 shadow-xs ${className}`}
    >
      {/* Price and Spots Top Section */}
      <div className="flex items-baseline justify-between border-b border-[#F6F1EA] pb-6">
        <div>
          <span className="text-xs uppercase tracking-wider text-[#574B45] font-semibold">
            Precio por persona
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl md:text-4xl font-bold font-serif text-[#521849]">
              {activity.price}€
            </span>
            <span className="text-xs text-[#574B45]">/ plaza</span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs text-[#574B45]">Aforo disponible</span>
          <p className="text-sm font-semibold text-[#26201D] mt-0.5 flex items-center justify-end gap-1.5">
            <Users className="w-4 h-4 text-[#521849]" />
            {isSoldOut ? (
              <span className="text-[#9B3E26]">Completo</span>
            ) : (
              <span>{availableSpots} de {activity.totalSpots} plazas</span>
            )}
          </p>
        </div>
      </div>

      {/* Progress Bar of Occupancy */}
      <div className="my-5">
        <div className="flex justify-between text-xs text-[#574B45] mb-1.5">
          <span>Ocupación</span>
          <span>{occupancyPercentage}% cubierto</span>
        </div>
        <div className="w-full bg-[#F6F1EA] rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isSoldOut
                ? 'bg-[#9B3E26]'
                : occupancyPercentage > 75
                ? 'bg-[#B84E33]'
                : 'bg-[#521849]'
            }`}
            style={{ width: `${occupancyPercentage}%` }}
          />
        </div>
      </div>

      {/* Main Reservation Call-to-Action Buttons */}
      <div className="space-y-3">
        {isSoldOut ? (
          <button
            id="btn-waiting-list"
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="w-full py-3.5 px-4 rounded-xl bg-[#EDE4D7] text-[#26201D] font-medium text-sm hover:bg-[#DFD3C2] transition-colors cursor-pointer text-center"
          >
            Apuntarse a lista de espera
          </button>
        ) : (
          <button
            id="btn-open-reservation-modal"
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="w-full py-3.5 px-4 rounded-xl bg-[#521849] hover:bg-[#3E1037] text-white font-semibold text-sm tracking-wide transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Reservar plaza</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* How to Reserve Toggle */}
        <button
          id="btn-toggle-how-to-reserve"
          type="button"
          onClick={() => setShowHowToReserve(!showHowToReserve)}
          className="w-full py-2 px-3 text-xs text-[#574B45] hover:text-[#521849] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{showHowToReserve ? 'Ocultar instrucciones' : '¿Cómo funciona la reserva?'}</span>
        </button>
      </div>

      {/* Explanatory notes & future Bizum placeholder container */}
      {showHowToReserve && (
        <div className="mt-4 p-4 rounded-xl bg-[#FCFAF7] border border-[#EDE4D7] text-xs text-[#574B45] space-y-2 animate-fadeIn">
          <p className="font-semibold text-[#26201D]">
            Procedimiento de Reserva de Doña Berenjena:
          </p>
          <ol className="list-decimal pl-4 space-y-1">
            <li>Solicita tus plazas mediante el formulario o por teléfono.</li>
            <li>Recibirás un email de confirmación con el código de reserva.</li>
            <li>
              El abono se realiza mediante transferencia o Bizum a la cuenta oficial de la asociación.
            </li>
            <li>Cancelación gratuita hasta 48 horas antes del evento.</li>
          </ol>
          {activity.howToReserveInfo && (
            <p className="pt-1 italic border-t border-[#EDE4D7]/60 text-[#3D3430]">
              Nota especial: {activity.howToReserveInfo}
            </p>
          )}
        </div>
      )}

      {/* Association Guarantee Badges */}
      <div className="mt-6 pt-5 border-t border-[#F6F1EA] grid grid-cols-2 gap-3 text-[11px] text-[#574B45]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#521849] shrink-0" />
          <span>Reserva garantizada</span>
        </div>
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-[#521849] shrink-0" />
          <span>Sin comisiones</span>
        </div>
      </div>

      {/* MODAL DE RESERVA / FORMULARIO */}
      {isModalOpen && (
        <div
          id="modal-reservation-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div
            id="modal-reservation-content"
            className="relative w-full max-w-lg rounded-2xl bg-white p-6 md:p-8 shadow-2xl border border-[#EDE4D7] max-h-[90vh] overflow-y-auto"
          >
            <button
              id="btn-close-reservation-modal"
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-[#574B45] hover:text-[#26201D] hover:bg-[#F6F1EA] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <span className="text-xs uppercase tracking-wider font-semibold text-[#521849]">
                Solicitud de Reserva
              </span>
              <h3 className="text-xl font-bold font-serif text-[#26201D] mt-1">
                {activity.title}
              </h3>
              <p className="text-xs text-[#574B45] mt-1">
                Fecha: {activity.date} {activity.time && `• ${activity.time}`} • {activity.price}€ / persona
              </p>
            </div>

            {statusMessage ? (
              <div
                className={`p-4 rounded-xl mb-4 text-sm ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                <div className="flex items-center gap-2 font-medium">
                  {statusMessage.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <HelpCircle className="w-5 h-5 text-rose-600" />
                  )}
                  <span>{statusMessage.text}</span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#26201D] mb-1">
                    Nombre y apellidos *
                  </label>
                  <input
                    id="input-reserva-nombre"
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Ej. Carmen Navarro Ruiz"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#EDE4D7] bg-[#FCFAF7] text-sm focus:outline-none focus:border-[#521849] focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#26201D] mb-1">
                      Correo electrónico *
                    </label>
                    <input
                      id="input-reserva-email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="nombre@ejemplo.com"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#EDE4D7] bg-[#FCFAF7] text-sm focus:outline-none focus:border-[#521849] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#26201D] mb-1">
                      Teléfono de contacto *
                    </label>
                    <input
                      id="input-reserva-telefono"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="600 000 000"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#EDE4D7] bg-[#FCFAF7] text-sm focus:outline-none focus:border-[#521849] focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#26201D] mb-1">
                      Número de plazas *
                    </label>
                    <select
                      id="select-reserva-plazas"
                      value={formData.spots}
                      onChange={(e) => setFormData({ ...formData, spots: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#EDE4D7] bg-[#FCFAF7] text-sm focus:outline-none focus:border-[#521849] focus:bg-white"
                    >
                      {[1, 2, 3, 4, 5, 6].map((num) => (
                        <option
                          key={num}
                          value={num}
                          disabled={num > availableSpots && !isSoldOut}
                        >
                          {num} {num === 1 ? 'plaza' : 'plazas'} ({num * activity.price}€)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#26201D] mb-1">
                      Nº de socio (opcional)
                    </label>
                    <input
                      id="input-reserva-socio"
                      type="text"
                      value={formData.membershipNumber || ''}
                      onChange={(e) => setFormData({ ...formData, membershipNumber: e.target.value })}
                      placeholder="Ej. SOC-142"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#EDE4D7] bg-[#FCFAF7] text-sm focus:outline-none focus:border-[#521849] focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#26201D] mb-1">
                    Método de abono preferido
                  </label>
                  <select
                    id="select-reserva-pago"
                    value={formData.paymentMethod || 'bizum'}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#EDE4D7] bg-[#FCFAF7] text-sm focus:outline-none focus:border-[#521849] focus:bg-white"
                  >
                    <option value="bizum">Bizum (Recomendado)</option>
                    <option value="transferencia">Transferencia Bancaria</option>
                    <option value="efectivo">Pago en Sede / Efectivo</option>
                    <option value="tarjeta">Tarjeta en Sede</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#26201D] mb-1">
                    Alergias / Intolerancias / Observaciones
                  </label>
                  <textarea
                    id="input-reserva-observaciones"
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Indica aquí si tienes alguna intolerancia alimentaria o necesidad especial..."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#EDE4D7] bg-[#FCFAF7] text-sm focus:outline-none focus:border-[#521849] focus:bg-white resize-none"
                  />
                </div>

                {/* Futuro soporte Bizum / Pasarela de pago */}
                <div className="p-3 rounded-lg bg-[#FCFAF7] border border-[#EDE4D7] flex items-center justify-between text-xs text-[#574B45]">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#521849]" />
                    <span>Total estimado:</span>
                  </div>
                  <span className="font-bold text-sm text-[#521849]">
                    {formData.spots * activity.price}€
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    id="btn-confirmar-reserva"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-xl bg-[#521849] hover:bg-[#3E1037] text-white font-semibold text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Procesando solicitud...</span>
                    ) : (
                      <span>Confirmar Solicitud de Reserva</span>
                    )}
                  </button>
                  <p className="text-[11px] text-[#574B45] text-center mt-2">
                    No se realizará ningún cobro en este paso. Recibirás las instrucciones de pago por correo.
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
