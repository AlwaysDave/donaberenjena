import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Activity, CataActivity, CursoActivity, ViajeActivity } from '../types';
import { ReservationBlock } from '../components/common/ReservationBlock';
import { StatusBadge } from '../components/common/StatusBadge';
import { PdfDownloadButton } from '../components/common/PdfDownloadButton';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Euro, 
  FileText, 
  Wine, 
  ChefHat, 
  Compass, 
  Check, 
  Share2, 
  ArrowLeft, 
  Building, 
  Award,
  Sparkles,
  UtensilsCrossed,
  Droplets,
  HeartHandshake
} from 'lucide-react';

export const ActivityDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getActivityById, incrementViews } = useData();
  
  const [copied, setCopied] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const activity = id ? getActivityById(id) : undefined;

  useEffect(() => {
    if (id) {
      incrementViews(id);
    }
    window.scrollTo(0, 0);
  }, [id]);

  if (!activity) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-[#F6EDF4] text-[#521849] flex items-center justify-center mx-auto">
          <Wine className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold font-serif text-[#26201D]">Actividad no encontrada</h1>
        <p className="text-sm text-[#574B45]">
          La ficha que estás buscando no existe o ha sido dada de baja.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#521849] text-white text-xs font-semibold hover:bg-[#3E1037] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a la portada</span>
        </Link>
      </div>
    );
  }

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const cata = activity.type === 'cata' ? (activity as CataActivity) : null;
  const curso = activity.type === 'curso' ? (activity as CursoActivity) : null;
  const viaje = activity.type === 'viaje' ? (activity as ViajeActivity) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Top Breadcrumb & Share Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EDE4D7] pb-4">
        <nav className="flex items-center space-x-2 text-xs text-[#574B45]">
          <Link to="/" className="hover:text-[#521849] transition-colors">Inicio</Link>
          <span>/</span>
          <Link 
            to={activity.type === 'cata' ? '/catas' : activity.type === 'curso' ? '/cursos' : '/viajes'} 
            className="hover:text-[#521849] transition-colors capitalize"
          >
            {activity.type === 'cata' ? 'Catas' : activity.type === 'curso' ? 'Cursos' : 'Viajes'}
          </Link>
          <span>/</span>
          <span className="text-[#26201D] font-medium truncate max-w-xs sm:max-w-md">{activity.title}</span>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#EDE4D7] text-[#574B45] text-xs font-medium hover:bg-[#F6F1EA] transition-colors cursor-pointer shadow-2xs"
            title="Copiar enlace de esta ficha"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Enlace copiado</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Compartir</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#EDE4D7] text-[#26201D] text-xs font-medium hover:bg-[#DFD3C2] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Content (8 cols) + Reservation / Info Sidebar (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Details, Imagery, Menus, Itineraries */}
        <div className="lg:col-span-8 space-y-8">
          {/* Header Title Section */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                status={activity.status}
                totalSpots={activity.totalSpots}
                bookedSpots={activity.bookedSpots}
              />
              <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#F6EDF4] text-[#521849]">
                {activity.type === 'cata' && `Cata • ${cata?.category || 'Vinos'}`}
                {activity.type === 'curso' && 'Curso de Cocina'}
                {activity.type === 'viaje' && `Viaje • ${viaje?.durationDays} días`}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-bold font-serif text-[#26201D] leading-tight">
              {activity.title}
            </h1>

            {activity.subtitle && (
              <p className="text-base sm:text-lg text-[#574B45] font-light leading-relaxed">
                {activity.subtitle}
              </p>
            )}

            {/* Quick Meta Row */}
            <div className="pt-3 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs sm:text-sm text-[#3D3430] border-t border-[#F6F1EA]">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Calendar className="w-4 h-4 text-[#521849]" />
                {activity.date}
              </span>
              {activity.time && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#521849]" />
                  {activity.time}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#521849]" />
                {activity.location}
              </span>
            </div>
          </div>

          {/* Image Gallery */}
          <div className="space-y-3">
            <div className="relative aspect-16/9 rounded-3xl overflow-hidden shadow-md bg-[#EDE4D7]">
              <img
                src={activity.images[activeImageIndex] || activity.images[0]}
                alt={activity.title}
                className="w-full h-full object-cover transition-all duration-300"
              />
            </div>
            {activity.images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {activity.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-20 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                      activeImageIndex === idx
                        ? 'border-[#521849] scale-105 shadow-xs'
                        : 'border-transparent opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Miniatura ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Activity Description */}
          <div className="space-y-4 rounded-2xl bg-white p-6 sm:p-8 border border-[#EDE4D7]">
            <h2 className="text-xl font-bold font-serif text-[#26201D] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#521849]" />
              <span>Descripción de la Actividad</span>
            </h2>
            <p className="text-sm sm:text-base text-[#3D3430] leading-relaxed whitespace-pre-line">
              {activity.description}
            </p>

            {/* Document PDF Attachment Button */}
            {activity.documentPdf && (
              <div className="pt-4 border-t border-[#F6F1EA]">
                <PdfDownloadButton document={activity.documentPdf} />
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* TYPE-SPECIFIC SECTION: CATA */}
          {/* ========================================================================= */}
          {activity.type === 'cata' && cata && (
            <div className="space-y-6">
              {/* Cata Type Badge Header */}
              <div className="flex items-center justify-between bg-[#F6EDF4] px-4 py-2.5 rounded-xl border border-[#521849]/20 text-xs font-semibold text-[#521849]">
                <span className="flex items-center gap-2">
                  <Wine className="w-4 h-4" />
                  {cata.cataType === 'varias_bodegas' ? 'Cata de Varias Bodegas / Múltiples Pases' : 'Cata de Una Sola Bodega'}
                </span>
                {cata.sumiller && (
                  <span>Sumiller: <strong>{cata.sumiller}</strong></span>
                )}
              </div>

              {/* If Varias Bodegas: Render Multiple Bodegas Timeline / Cards */}
              {cata.cataType === 'varias_bodegas' && cata.wines && cata.wines.length > 0 ? (
                <div className="space-y-4">
                  <div className="border-b border-[#EDE4D7] pb-3 flex items-center justify-between">
                    <h3 className="text-lg font-bold font-serif text-[#26201D] flex items-center gap-2">
                      <Building className="w-5 h-5 text-[#521849]" />
                      <span>Pases y Bodegas Protagonistas ({cata.wines.length})</span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-5">
                    {cata.wines.map((wine, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl bg-white p-6 border border-[#EDE4D7] shadow-xs space-y-4 relative overflow-hidden hover:border-[#521849]/40 transition-all"
                      >
                        {/* Pase number badge */}
                        <div className="absolute top-0 right-0 bg-[#521849] text-white text-[11px] font-bold px-4 py-1 rounded-bl-xl tracking-wider uppercase">
                          {wine.type || `Pase ${idx + 1}`}
                        </div>

                        <div className="space-y-1 pr-16">
                          <span className="text-xs font-bold text-[#C96043] uppercase tracking-wider">
                            {wine.bodega || `Bodega Invitada ${idx + 1}`}
                          </span>
                          <h4 className="text-lg font-bold font-serif text-[#26201D]">
                            {wine.name}
                          </h4>
                          {wine.region && (
                            <p className="text-xs text-[#574B45] flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-[#521849]" />
                              <span>{wine.region}</span>
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#F6F1EA] text-xs">
                          {wine.grape && (
                            <div className="p-3 rounded-xl bg-[#FCFAF7] border border-[#EDE4D7]">
                              <span className="text-[10px] uppercase font-bold text-[#521849] block mb-0.5">Variedad de Uva / Denominación</span>
                              <span className="font-medium text-[#26201D]">{wine.grape}</span>
                            </div>
                          )}
                          {wine.pairing && (
                            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80">
                              <span className="text-[10px] uppercase font-bold text-amber-900 block mb-0.5">Maridaje Armonizado</span>
                              <span className="font-medium text-amber-950">{wine.pairing}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Taller / Special workshop notice */}
                  {cata.tallerEspecial && (
                    <div className="rounded-2xl bg-[#F9ECE8] p-5 border border-[#C96043]/30 flex items-center gap-3">
                      <Sparkles className="w-6 h-6 text-[#C96043] shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-[#C96043] uppercase tracking-wider block">Taller Práctico / Elaboración In Situ</span>
                        <p className="text-sm font-serif font-bold text-[#26201D]">{cata.tallerEspecial}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Bodega / Sumiller Header Card for Single Bodega */
                <div className="rounded-2xl bg-gradient-to-br from-[#FBF9F5] to-white p-6 sm:p-8 border border-[#EDE4D7] space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#521849]">
                    <Building className="w-4 h-4" />
                    <span>Bodega & Protagonistas de la Cata</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-lg font-bold font-serif text-[#26201D]">
                        {cata.bodegaProductor?.name || 'Bodega Invitada'}
                      </h3>
                      <p className="text-xs text-[#574B45] mt-1">
                        <strong className="text-[#26201D]">Procedencia:</strong> {cata.bodegaProductor?.region || 'Castilla-La Mancha'}
                      </p>
                    </div>

                    {cata.sumiller && (
                      <div className="p-3 rounded-xl bg-white border border-[#EDE4D7]/80">
                        <span className="text-[11px] uppercase font-bold text-[#521849] block">
                          Sumiller Conductor/a
                        </span>
                        <p className="text-sm font-semibold text-[#26201D] mt-0.5">
                          {cata.sumiller}
                        </p>
                      </div>
                    )}
                  </div>

                  {cata.bodegaProductor?.colaboradores && (
                    <div className="pt-2 text-xs text-[#574B45] flex items-center gap-2 border-t border-[#EDE4D7]/50">
                      <HeartHandshake className="w-4 h-4 text-[#C96043] shrink-0" />
                      <span><strong>Colaboración Especial:</strong> {cata.bodegaProductor.colaboradores}</span>
                    </div>
                  )}

                  {cata.aove && (
                    <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-950 flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-amber-700 shrink-0" />
                      <span><strong>AOVE de Bienvenida:</strong> {cata.aove}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Structured Wine & Pairing Menu (for bodega_unica) */}
              {cata.cataType !== 'varias_bodegas' && cata.wines && cata.wines.length > 0 && (
                <div className="rounded-2xl bg-white p-6 sm:p-8 border border-[#EDE4D7] space-y-5">
                  <div className="flex items-center justify-between border-b border-[#F6F1EA] pb-4">
                    <h3 className="text-lg font-bold font-serif text-[#26201D] flex items-center gap-2">
                      <UtensilsCrossed className="w-5 h-5 text-[#521849]" />
                      <span>Menú de Cata y Maridajes</span>
                    </h3>
                    <span className="text-xs font-semibold text-[#521849] bg-[#F6EDF4] px-2.5 py-1 rounded-full">
                      {cata.wines.length} armonías
                    </span>
                  </div>

                  <div className="space-y-4">
                    {cata.wines.map((wine, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-[#FCFAF7] border border-[#EDE4D7] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#521849]/40 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-[#521849] text-white">
                              {wine.type}
                            </span>
                            <span className="font-serif font-bold text-sm text-[#26201D]">
                              {wine.name}
                            </span>
                          </div>
                          {wine.grape && (
                            <p className="text-xs text-[#574B45]">
                              Variedad de uva: <strong className="text-[#26201D]">{wine.grape}</strong>
                            </p>
                          )}
                        </div>

                        {wine.pairing && (
                          <div className="sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-[#EDE4D7]">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-[#C96043] block">
                              Plato de Maridaje
                            </span>
                            <span className="text-xs font-medium text-[#26201D]">
                              {wine.pairing}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TYPE-SPECIFIC SECTION: CURSO */}
          {/* ========================================================================= */}
          {activity.type === 'curso' && curso && (
            <div className="space-y-6">
              {/* Chef Card */}
              <div className="rounded-2xl bg-[#F9ECE8] p-6 sm:p-8 border border-[#C96043]/30 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#C96043]">
                  <ChefHat className="w-4 h-4" />
                  <span>Chef Formador / Ponente</span>
                </div>
                <h3 className="text-lg font-bold font-serif text-[#26201D]">
                  {curso.chef.name}
                </h3>
                {curso.chef.restaurant && (
                  <p className="text-xs text-[#574B45]">
                    <strong className="text-[#26201D]">Restaurante / Trayectoria:</strong> {curso.chef.restaurant}
                  </p>
                )}
                <p className="text-xs sm:text-sm text-[#3D3430] leading-relaxed">
                  {curso.chef.bio}
                </p>
              </div>

              {/* Syllabus / Temario */}
              {curso.syllabus && curso.syllabus.length > 0 && (
                <div className="rounded-2xl bg-white p-6 sm:p-8 border border-[#EDE4D7] space-y-4">
                  <h3 className="text-lg font-bold font-serif text-[#26201D] flex items-center gap-2">
                    <Award className="w-5 h-5 text-[#C96043]" />
                    <span>Contenidos y Aprendizajes del Curso</span>
                  </h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {curso.syllabus.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-[#3D3430]">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TYPE-SPECIFIC SECTION: VIAJE */}
          {/* ========================================================================= */}
          {activity.type === 'viaje' && viaje && (
            <div className="space-y-6">
              {/* Included Services */}
              {viaje.includedServices && viaje.includedServices.length > 0 && (
                <div className="rounded-2xl bg-[#EFF4E9] p-6 sm:p-8 border border-[#4D6233]/30 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#4D6233]">
                    <Compass className="w-4 h-4" />
                    <span>Servicios y Experiencias Incluidas</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {viaje.includedServices.map((service, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-[#26201D] font-medium">
                        <span className="w-2 h-2 rounded-full bg-[#4D6233]" />
                        <span>{service}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Itinerary */}
              {viaje.itinerary && viaje.itinerary.length > 0 && (
                <div className="rounded-2xl bg-white p-6 sm:p-8 border border-[#EDE4D7] space-y-6">
                  <h3 className="text-lg font-bold font-serif text-[#26201D]">
                    Itinerario de la Experiencia
                  </h3>
                  <div className="space-y-6 relative before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#EDE4D7]">
                    {viaje.itinerary.map((day) => (
                      <div key={day.day} className="relative pl-8 space-y-1">
                        <span className="absolute left-0 top-1 w-6 h-6 rounded-full bg-[#521849] text-white text-[10px] font-bold flex items-center justify-center ring-4 ring-white">
                          {day.day}
                        </span>
                        <h4 className="text-sm font-bold font-serif text-[#26201D]">
                          Día {day.day}: {day.title}
                        </h4>
                        <p className="text-xs text-[#574B45] leading-relaxed">
                          {day.description}
                        </p>
                        {day.highlights && day.highlights.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {day.highlights.map((h, i) => (
                              <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-[#FCFAF7] border border-[#EDE4D7] text-[#574B45]">
                                {h}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Sticky Reservation & Action Sidebar */}
        <div className="lg:col-span-4 sticky top-24 space-y-6">
          <ReservationBlock activity={activity} />

          {/* Guarantee & Association Quality Box */}
          <div className="rounded-2xl bg-[#FCFAF7] p-5 border border-[#EDE4D7] space-y-3 text-xs text-[#574B45]">
            <span className="font-bold text-[#26201D] block">
              Compromiso Gastronómico Doña Berenjena
            </span>
            <ul className="space-y-1.5">
              <li className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#521849]" />
                <span>Productos seleccionados de máxima calidad.</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Wine className="w-3.5 h-3.5 text-[#521849]" />
                <span>Copas técnicas homologadas y servicio cuidado.</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#521849]" />
                <span>Grupos reducidos para una experiencia inmersiva.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
