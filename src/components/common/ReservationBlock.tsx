import React, { useState } from 'react';
import { Activity, ReservationAttendee, ReservationFormData } from '../../types';
import { useData } from '../../context/DataContext';
import { Users, CreditCard, ShieldCheck, CheckCircle2, ChevronRight, HelpCircle, X, Sparkles, UserCheck, UserPlus } from 'lucide-react';
import { trackRegistrationStarted } from '../../utils/analyticsTracker';
import { trackGASignUp, trackGAPurchase } from '../../utils/googleAnalytics';

interface ReservationBlockProps {
  activity: Activity;
  className?: string;
  // Hook for future payment gateway (Bizum / Stripe)
  enableDirectPayment?: boolean;
}

export const ReservationBlock: React.FC<ReservationBlockProps> = ({
  activity,
  className = '',
  enableDirectPayment: _enableDirectPayment = false
}) => {
  const { reserveSpots } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showHowToReserve, setShowHowToReserve] = useState(false);
  
  const [numSpots, setNumSpots] = useState(1);
  const [titularData, setTitularData] = useState<{
    fullName: string;
    email: string;
    phone: string;
    isMember: boolean;
    membershipNumber: string;
    turn: string;
    notes: string;
    paymentMethod: 'bizum' | 'transferencia' | 'efectivo' | 'tarjeta';
  }>({
    fullName: '',
    email: '',
    phone: '',
    isMember: false,
    membershipNumber: '',
    turn: '',
    notes: '',
    paymentMethod: 'bizum'
  });

  // State for companions (index 0 is companion 1, corresponding to spot 2)
  const [companions, setCompanions] = useState<Array<{
    fullName: string;
    isMember: boolean;
    membershipNumber: string;
  }>>([
    { fullName: '', isMember: false, membershipNumber: '' },
    { fullName: '', isMember: false, membershipNumber: '' },
    { fullName: '', isMember: false, membershipNumber: '' },
    { fullName: '', isMember: false, membershipNumber: '' },
    { fullName: '', isMember: false, membershipNumber: '' },
  ]);

  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const priceMember = activity.priceMember;
  const priceNonMember = activity.priceNonMember;
  const hasSpecialPricing = priceMember !== priceNonMember;

  const availableSpots = Math.max(0, activity.totalSpots - activity.bookedSpots);
  const occupancyPercentage = Math.min(100, Math.round((activity.bookedSpots / activity.totalSpots) * 100));
  const isSoldOut = availableSpots <= 0;
  const isCelebrated = activity.status === 'celebrada';
  const isRegistrationClosed = activity.registrationStatus === 'cerrada' || isCelebrated;

  // Calculate total price based on member status of each attendee
  const titularPrice = titularData.isMember ? priceMember : priceNonMember;
  let companionTotal = 0;
  for (let i = 0; i < numSpots - 1; i++) {
    const comp = companions[i];
    companionTotal += comp?.isMember ? priceMember : priceNonMember;
  }
  const calculatedTotalPrice = titularPrice + companionTotal;

  const handleCompanionChange = (index: number, field: 'fullName' | 'isMember' | 'membershipNumber', value: any) => {
    setCompanions(prev => {
      const next = [...prev];
      if (!next[index]) {
        next[index] = { fullName: '', isMember: false, membershipNumber: '' };
      }
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    // Build attendees array
    const attendeesPayload: ReservationAttendee[] = [
      {
        fullName: titularData.fullName.trim(),
        isMember: titularData.isMember,
        membershipNumber: titularData.membershipNumber.trim() || undefined,
        email: titularData.email.trim(),
        phone: titularData.phone.trim(),
        notes: titularData.notes.trim() || undefined
      }
    ];

    for (let i = 0; i < numSpots - 1; i++) {
      const comp = companions[i];
      attendeesPayload.push({
        fullName: comp?.fullName?.trim() || `Acompañante ${i + 1} (${titularData.fullName.trim()})`,
        isMember: !!comp?.isMember,
        membershipNumber: comp?.membershipNumber?.trim() || undefined
      });
    }

    const reservationPayload: ReservationFormData = {
      fullName: titularData.fullName.trim(),
      email: titularData.email.trim(),
      phone: titularData.phone.trim(),
      spots: numSpots,
      isMember: titularData.isMember,
      membershipNumber: titularData.membershipNumber.trim() || undefined,
      turn: titularData.turn || undefined,
      notes: titularData.notes.trim() || undefined,
      paymentMethod: titularData.paymentMethod,
      attendees: attendeesPayload
    };

    const result = await reserveSpots(activity.id, numSpots, reservationPayload);
    setIsSubmitting(false);

    if (result.success) {
      // Dispatches GA4 purchase event strictly AFTER server confirmation with zero PII
      trackGAPurchase({
        transactionId: (result as any).reservationId || `res_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        activityId: activity.id,
        activityTitle: activity.title,
        activityType: activity.type,
        spots: numSpots,
        totalPrice: calculatedTotalPrice
      });

      setStatusMessage({ type: 'success', text: result.message });
      setTimeout(() => {
        setIsModalOpen(false);
        setStatusMessage(null);
        setNumSpots(1);
        setTitularData({
          fullName: '',
          email: '',
          phone: '',
          isMember: false,
          membershipNumber: '',
          turn: '',
          notes: '',
          paymentMethod: 'bizum'
        });
        setCompanions([
          { fullName: '', isMember: false, membershipNumber: '' },
          { fullName: '', isMember: false, membershipNumber: '' },
          { fullName: '', isMember: false, membershipNumber: '' },
          { fullName: '', isMember: false, membershipNumber: '' },
          { fullName: '', isMember: false, membershipNumber: '' },
        ]);
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
            {hasSpecialPricing ? 'Tarifas por plaza' : 'Precio por plaza'}
          </span>
          <div className="flex flex-col mt-1">
            {hasSpecialPricing ? (
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-serif text-emerald-800">
                    {priceMember}€
                  </span>
                  <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Socios
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold font-serif text-[#521849]">
                    {priceNonMember}€
                  </span>
                  <span className="text-xs text-[#574B45]">
                    No socios
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-3xl md:text-4xl font-bold font-serif text-[#521849]">
                  {priceNonMember}€
                </span>
                <span className="text-xs text-[#574B45]">/ plaza</span>
              </div>
            )}
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
        {isCelebrated ? (
          <div
            id="badge-activity-celebrated"
            className="w-full py-3.5 px-4 rounded-xl bg-[#F6F1EA] text-[#574B45] font-semibold text-sm text-center border border-[#EDE4D7] flex items-center justify-center gap-2 select-none"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>Actividad ya celebrada</span>
          </div>
        ) : activity.registrationStatus === 'cerrada' ? (
          <div
            id="badge-registration-closed"
            className="w-full py-3.5 px-4 rounded-xl bg-stone-100 text-stone-700 font-semibold text-sm text-center border border-stone-300 flex items-center justify-center gap-2 select-none"
          >
            <X className="w-4 h-4 text-rose-600" />
            <span>Inscripciones cerradas por la organización</span>
          </div>
        ) : isSoldOut ? (
          <button
            id="btn-waiting-list"
            type="button"
            onClick={() => {
              trackRegistrationStarted(activity.id);
              trackGASignUp({ id: activity.id, title: activity.title, type: activity.type });
              setIsModalOpen(true);
            }}
            className="w-full py-3.5 px-4 rounded-xl bg-[#EDE4D7] text-[#26201D] font-medium text-sm hover:bg-[#DFD3C2] transition-colors cursor-pointer text-center"
          >
            Apuntarse a lista de espera
          </button>
        ) : (
          <button
            id="btn-open-reservation-modal"
            type="button"
            onClick={() => {
              trackRegistrationStarted(activity.id);
              trackGASignUp({ id: activity.id, title: activity.title, type: activity.type });
              setIsModalOpen(true);
            }}
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
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-sm overflow-y-auto"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            id="modal-reservation-content"
            className="relative w-full max-w-xl rounded-3xl bg-white shadow-2xl border border-[#EDE4D7] max-h-[88vh] flex flex-col my-auto overflow-hidden animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sticky/Fixed Modal Header */}
            <div className="p-5 sm:p-6 border-b border-[#EDE4D7] bg-[#FCFAF7] flex items-start justify-between gap-4 shrink-0">
              <div className="min-w-0">
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#521849] block">
                  {isSoldOut ? 'Lista de Espera' : 'Solicitud de Reserva'}
                </span>
                <h3 className="text-lg sm:text-xl font-bold font-serif text-[#26201D] mt-0.5 truncate" title={activity.title}>
                  {activity.title}
                </h3>
                <p className="text-xs text-[#574B45] mt-0.5">
                  Fecha: <span className="font-semibold text-[#26201D]">{activity.date}</span> {activity.time && `• ${activity.time}`}
                </p>
              </div>
              <button
                id="btn-close-reservation-modal"
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-[#574B45] hover:text-[#26201D] hover:bg-[#EDE4D7]/70 transition-colors shrink-0 cursor-pointer"
                title="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
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
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* 1. Selector de Plazas */}
                  <div className="p-4 rounded-xl bg-[#FCFAF7] border border-[#EDE4D7]">
                    <label className="block text-xs font-bold text-[#26201D] mb-1">
                      Número de plazas que deseas reservar *
                    </label>
                  <select
                    id="select-reserva-plazas"
                    value={numSpots}
                    onChange={(e) => setNumSpots(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#EDE4D7] bg-white text-sm font-semibold text-[#26201D] focus:outline-none focus:border-[#521849]"
                  >
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <option
                        key={num}
                        value={num}
                        disabled={num > availableSpots && !isSoldOut}
                      >
                        {num} {num === 1 ? 'plaza (Titular)' : `plazas (Titular + ${num - 1} acompañante${num > 2 ? 's' : ''})`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Plaza 1 (Titular) */}
                <div className="p-4 rounded-xl bg-white border border-[#EDE4D7] space-y-3.5 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-[#F6F1EA] pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#521849] text-white flex items-center justify-center text-xs font-bold">
                        1
                      </div>
                      <h4 className="text-sm font-bold text-[#26201D]">
                        Titular de la reserva
                      </h4>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#FCFAF7] text-[#521849] border border-[#EDE4D7]">
                      {titularPrice}€
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#26201D] mb-1">
                      Nombre y apellidos del titular *
                    </label>
                    <input
                      id="input-reserva-nombre"
                      type="text"
                      required
                      value={titularData.fullName}
                      onChange={(e) => setTitularData({ ...titularData, fullName: e.target.value })}
                      placeholder="Ej. Carmen Navarro Ruiz"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#EDE4D7] bg-[#FCFAF7] text-sm focus:outline-none focus:border-[#521849] focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#26201D] mb-1">
                        Correo electrónico *
                      </label>
                      <input
                        id="input-reserva-email"
                        type="email"
                        required
                        value={titularData.email}
                        onChange={(e) => setTitularData({ ...titularData, email: e.target.value })}
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
                        value={titularData.phone}
                        onChange={(e) => setTitularData({ ...titularData, phone: e.target.value })}
                        placeholder="600 000 000"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-[#EDE4D7] bg-[#FCFAF7] text-sm focus:outline-none focus:border-[#521849] focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Condición de Socio Titular */}
                  <div className="pt-2 border-t border-[#F6F1EA]">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={titularData.isMember}
                        onChange={(e) => setTitularData({ ...titularData, isMember: e.target.checked })}
                        className="w-4 h-4 rounded text-[#521849] focus:ring-[#521849] border-[#EDE4D7]"
                      />
                      <span className="text-xs font-medium text-[#26201D] flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                        ¿El titular es socio/a de la asociación?
                      </span>
                    </label>

                    {titularData.isMember && (
                      <div className="mt-2.5 pl-6">
                        <label className="block text-xs font-semibold text-[#26201D] mb-1">
                          Nº de socio (opcional)
                        </label>
                        <input
                          type="text"
                          value={titularData.membershipNumber}
                          onChange={(e) => setTitularData({ ...titularData, membershipNumber: e.target.value })}
                          placeholder="Ej. SOC-142"
                          className="w-full sm:w-1/2 px-3 py-2 rounded-lg border border-[#EDE4D7] bg-[#FCFAF7] text-xs focus:outline-none focus:border-[#521849] focus:bg-white"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Plazas 2..N (Acompañantes) */}
                {numSpots > 1 && (
                  <div className="space-y-3 pt-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#574B45] flex items-center gap-1.5">
                      <UserPlus className="w-4 h-4 text-[#521849]" />
                      Datos de los acompañantes ({numSpots - 1})
                    </h4>

                    {Array.from({ length: numSpots - 1 }).map((_, idx) => {
                      const comp = companions[idx] || { fullName: '', isMember: false, membershipNumber: '' };
                      const compPrice = comp.isMember ? priceMember : priceNonMember;

                      return (
                        <div
                          key={idx}
                          className="p-4 rounded-xl bg-[#FCFAF7] border border-[#EDE4D7] space-y-3"
                        >
                          <div className="flex items-center justify-between border-b border-[#EDE4D7] pb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-[#EDE4D7] text-[#521849] flex items-center justify-center text-xs font-bold">
                                {idx + 2}
                              </div>
                              <span className="text-xs font-bold text-[#26201D]">
                                Plaza {idx + 2}: Acompañante
                              </span>
                            </div>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white text-[#521849] border border-[#EDE4D7]">
                              {compPrice}€
                            </span>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-[#26201D] mb-1">
                              Nombre y apellidos del acompañante *
                            </label>
                            <input
                              type="text"
                              required
                              value={comp.fullName}
                              onChange={(e) => handleCompanionChange(idx, 'fullName', e.target.value)}
                              placeholder={`Ej. Acompañante ${idx + 1}`}
                              className="w-full px-3.5 py-2.5 rounded-lg border border-[#EDE4D7] bg-white text-sm focus:outline-none focus:border-[#521849]"
                            />
                          </div>

                          <div>
                            <label className="flex items-center gap-2.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={comp.isMember}
                                onChange={(e) => handleCompanionChange(idx, 'isMember', e.target.checked)}
                                className="w-4 h-4 rounded text-[#521849] focus:ring-[#521849] border-[#EDE4D7]"
                              />
                              <span className="text-xs font-medium text-[#26201D] flex items-center gap-1.5">
                                <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                                ¿Este acompañante es socio/a?
                              </span>
                            </label>

                            {comp.isMember && (
                              <div className="mt-2 pl-6">
                                <label className="block text-xs font-semibold text-[#26201D] mb-1">
                                  Nº de socio del acompañante (opcional)
                                </label>
                                <input
                                  type="text"
                                  value={comp.membershipNumber}
                                  onChange={(e) => handleCompanionChange(idx, 'membershipNumber', e.target.value)}
                                  placeholder="Ej. SOC-204"
                                  className="w-full sm:w-1/2 px-3 py-1.5 rounded-lg border border-[#EDE4D7] bg-white text-xs focus:outline-none focus:border-[#521849]"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 4. Método de pago y observaciones */}
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-[#26201D] mb-1">
                      Método de abono preferido
                    </label>
                    <select
                      id="select-reserva-pago"
                      value={titularData.paymentMethod}
                      onChange={(e) => setTitularData({ ...titularData, paymentMethod: e.target.value as any })}
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
                      value={titularData.notes}
                      onChange={(e) => setTitularData({ ...titularData, notes: e.target.value })}
                      placeholder="Indica aquí si alguno de los asistentes tiene alergias alimentarias..."
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#EDE4D7] bg-[#FCFAF7] text-sm focus:outline-none focus:border-[#521849] focus:bg-white resize-none"
                    />
                  </div>
                </div>

                {/* Desglose de importe */}
                <div className="p-3.5 rounded-xl bg-[#FCFAF7] border border-[#EDE4D7] text-xs text-[#574B45] space-y-1">
                  <div className="flex items-center justify-between font-medium">
                    <span>Titular ({titularData.isMember ? 'Socio' : 'No socio'}):</span>
                    <span>{titularPrice}€</span>
                  </div>
                  {numSpots > 1 && Array.from({ length: numSpots - 1 }).map((_, idx) => {
                    const comp = companions[idx];
                    const compPr = comp?.isMember ? priceMember : priceNonMember;
                    return (
                      <div key={idx} className="flex items-center justify-between">
                        <span>Plaza {idx + 2} ({comp?.isMember ? 'Socio' : 'No socio'}):</span>
                        <span>{compPr}€</span>
                      </div>
                    );
                  })}
                  <div className="pt-2 border-t border-[#EDE4D7] flex items-center justify-between font-bold text-sm text-[#521849]">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#521849]" />
                      <span>Total estimado ({numSpots} {numSpots === 1 ? 'plaza' : 'plazas'}):</span>
                    </div>
                    <span>{calculatedTotalPrice}€</span>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    id="btn-confirmar-reserva"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-xl bg-[#521849] hover:bg-[#3E1037] text-white font-semibold text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Procesando solicitud...</span>
                    ) : (
                      <span>Confirmar Solicitud de Reserva ({numSpots} {numSpots === 1 ? 'plaza' : 'plazas'})</span>
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
        </div>
      )}
    </div>
  );
};
