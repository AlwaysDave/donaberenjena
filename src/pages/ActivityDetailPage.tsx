import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { CataActivity, CursoActivity, ViajeActivity } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { ReservationBlock } from '../components/common/ReservationBlock';
import { PdfDownloadButton } from '../components/common/PdfDownloadButton';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  ArrowLeft, 
  Wine, 
  ChefHat, 
  Compass, 
  Utensils, 
  CheckCircle2, 
  FileText, 
  Camera, 
  Share2, 
  Check,
  Building,
  UserCheck
} from 'lucide-react';

export const ActivityDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getActivityById, incrementViews } = useData();
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);

  const activity = id ? getActivityById(id) : undefined;

  useEffect(() => {
    if (activity) {
      setSelectedImage(activity.images[0] || '');
      incrementViews(activity.id);
      window.scrollTo(0, 0);
    }
  }, [id, activity]);

  if (!activity) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-bold font-serif text-[#26201D]">
          Actividad no encontrada
        </h2>
        <p className="text-sm text-[#574B45] mt-2">
          La actividad solicitada no existe o ha sido trasladada.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#521849] text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a la página principal</span>
        </Link>
      </div>
    );
  }

  const isHeld = activity.status === 'celebrada';

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const getParentRoute = () => {
    switch (activity.type) {
      case 'cata': return { name: 'Catas', path: '/catas' };
      case 'curso': return { name: 'Cursos', path: '/cursos' };
      case 'viaje': return { name: 'Viajes', path: '/viajes' };
    }
  };

  const parent = getParentRoute();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-10">
      {/* Breadcrumbs and Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EDE4D7] pb-4">
        <div className="flex items-center gap-2 text-xs text-[#574B45]">
          <Link to="/" className="hover:text-[#521849]">Inicio</Link>
          <span>/</span>
          <Link to={parent.path} className="hover:text-[#521849]">{parent.name}</Link>
          <span>/</span>
          <span className="text-[#26201D] font-medium truncate max-w-xs">{activity.title}</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#EDE4D7] bg-white text-xs font-medium text-[#574B45] hover:text-[#521849] hover:bg-[#F6F1EA] transition-colors cursor-pointer"
          >
            {copiedLink ? (
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
                {activity.type === 'cata' && `Cata • ${(activity as CataActivity).category}`}
                {activity.type === 'curso' && 'Curso de Cocina'}
                {activity.type === 'viaje' && `Viaje • ${(activity as ViajeActivity).durationDays} días`}
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

          {/* Photo Gallery Banner */}
          <div className="space-y-3">
            <div className="relative aspect-16/10 sm:aspect-16/9 rounded-2xl overflow-hidden bg-[#F6F1EA] shadow-md border border-[#EDE4D7]">
              <img
                src={selectedImage || activity.images[0]}
                alt={activity.title}
                className="w-full h-full object-cover transition-all duration-300"
              />
            </div>

            {/* Thumbnails (visible if multiple images) */}
            {activity.images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {activity.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImage(img)}
                    className={`relative w-20 h-14 sm:w-24 sm:h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                      selectedImage === img
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
          {activity.type === 'cata' && (
            <div className="space-y-6">
              {/* Bodega / Productor Card */}
              <div className="rounded-2xl bg-[#FBF9F5] p-6 sm:p-8 border border-[#EDE4D7] space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#521849]">
                  <Building className="w-4 h-4" />
                  <span>Bodega & Productor Protagonista</span>
                </div>
                <h3 className="text-lg font-bold font-serif text-[#26201D]">
                  {(activity as CataActivity).bodegaProductor.name}
                </h3>
                <p className="text-xs sm:text-sm text-[#574B45]">
                  <strong className="text-[#26201D]">Región / D.O.:</strong> {(activity as CataActivity).bodegaProductor.region}
                  {(activity as CataActivity).bodegaProductor.enologo && (
                    <span> • <strong className="text-[#26201D]">Enólogo:</strong> {(activity as CataActivity).bodegaProductor.enologo}</span>
                  )}
                </p>
                {(activity as CataActivity).bodegaProductor.description && (
                  <p className="text-xs sm:text-sm text-[#3D3430] italic">
                    {(activity as CataActivity).bodegaProductor.description}
                  </p>
                )}
              </div>

              {/* Pairing Menu / Menú de Maridaje */}
              {(activity as CataActivity).pairingMenu && (activity as CataActivity).pairingMenu.length > 0 && (
                <div className="rounded-2xl bg-white p-6 sm:p-8 border border-[#EDE4D7] space-y-5">
                  <div className="flex items-center justify-between border-b border-[#F6F1EA] pb-4">
                    <h3 className="text-lg font-bold font-serif text-[#26201D] flex items-center gap-2">
                      <Utensils className="w-5 h-5 text-[#521849]" />
                      <span>Menú de Maridaje y Armonías</span>
                    </h3>
                    <span className="text-xs text-[#574B45]">
                      {(activity as CataActivity).pairingMenu.length} pases
                    </span>
                  </div>

                  <div className="space-y-4">
                    {(activity as CataActivity).pairingMenu.map((item, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-xl bg-[#FCFAF7] border border-[#EDE4D7] space-y-1.5"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <h4 className="text-sm font-bold text-[#26201D]">
                            {i + 1}. {item.dish}
                          </h4>
                          <span className="text-xs font-semibold text-[#521849] bg-[#F6EDF4] px-2.5 py-0.5 rounded-md w-fit">
                            {item.pairing}
                          </span>
                        </div>
                        {item.notes && (
                          <p className="text-xs text-[#574B45] pt-1">
                            <em>Nota de cata:</em> {item.notes}
                          </p>
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
          {activity.type === 'curso' && (
            <div className="space-y-6">
              {/* Chef Bio */}
              <div className="rounded-2xl bg-[#F9ECE8] p-6 sm:p-8 border border-[#C96043]/30 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#C96043]">
                  <ChefHat className="w-4 h-4" />
                  <span>Chef Docente Invitado</span>
                </div>
                <h3 className="text-lg font-bold font-serif text-[#26201D]">
                  {(activity as CursoActivity).chef.name}
                </h3>
                {(activity as CursoActivity).chef.restaurant && (
                  <p className="text-xs text-[#9B3E26] font-medium">
                    {(activity as CursoActivity).chef.restaurant}
                  </p>
                )}
                <p className="text-xs sm:text-sm text-[#3D3430] leading-relaxed">
                  {(activity as CursoActivity).chef.bio}
                </p>
              </div>

              {/* Syllabus / Temario */}
              {(activity as CursoActivity).syllabus && (
                <div className="rounded-2xl bg-white p-6 sm:p-8 border border-[#EDE4D7] space-y-4">
                  <h3 className="text-lg font-bold font-serif text-[#26201D]">
                    Temario y Técnicas que Aprenderás
                  </h3>
                  <ul className="space-y-2.5">
                    {(activity as CursoActivity).syllabus.map((point, i) => (
                      <li key={i} className="flex items-start gap-3 text-xs sm:text-sm text-[#3D3430]">
                        <CheckCircle2 className="w-4 h-4 text-[#C96043] shrink-0 mt-0.5" />
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
          {activity.type === 'viaje' && (
            <div className="space-y-6">
              {/* Included Services */}
              {(activity as ViajeActivity).includedServices && (
                <div className="rounded-2xl bg-[#EFF4E9] p-6 sm:p-8 border border-[#4D6233]/30 space-y-3">
                  <h3 className="text-base font-bold font-serif text-[#26201D] flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#4D6233]" />
                    <span>Servicios Incluidos en el Viaje</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {(activity as ViajeActivity).includedServices.map((service, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-[#3B4B27]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#4D6233]" />
                        <span>{service}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Itinerary Day by Day */}
              {(activity as ViajeActivity).itinerary && (activity as ViajeActivity).itinerary.length > 0 && (
                <div className="rounded-2xl bg-white p-6 sm:p-8 border border-[#EDE4D7] space-y-6">
                  <h3 className="text-lg font-bold font-serif text-[#26201D] flex items-center gap-2">
                    <Compass className="w-5 h-5 text-[#4D6233]" />
                    <span>Itinerario Detallado Día a Día</span>
                  </h3>

                  <div className="space-y-6">
                    {(activity as ViajeActivity).itinerary.map((day) => (
                      <div
                        key={day.day}
                        className="p-5 rounded-xl bg-[#FCFAF7] border border-[#EDE4D7] space-y-2 relative pl-6 border-l-4 border-l-[#4D6233]"
                      >
                        <h4 className="text-sm font-bold text-[#26201D]">
                          {day.title}
                        </h4>
                        <p className="text-xs sm:text-sm text-[#574B45] leading-relaxed">
                          {day.description}
                        </p>
                        {day.highlights && day.highlights.length > 0 && (
                          <div className="pt-2 flex flex-wrap gap-2">
                            {day.highlights.map((h, hi) => (
                              <span
                                key={hi}
                                className="px-2.5 py-1 rounded-md bg-[#EDE4D7]/70 text-[11px] font-medium text-[#26201D]"
                              >
                                • {h}
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

          {/* ========================================================================= */}
          {/* PAST EVENT ARCHIVE / MEMORIA (IF CELEBRADA) */}
          {/* ========================================================================= */}
          {isHeld && (
            <div className="rounded-2xl bg-white p-6 sm:p-8 border border-[#EDE4D7] space-y-5">
              <h3 className="text-xl font-bold font-serif text-[#26201D] flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#521849]" />
                <span>Memoria y Registro del Evento Celebrado</span>
              </h3>
              {activity.pastEventSummary && (
                <p className="text-sm text-[#3D3430] leading-relaxed bg-[#FCFAF7] p-4 rounded-xl border border-[#EDE4D7]">
                  {activity.pastEventSummary}
                </p>
              )}
              {activity.pastEventGallery && activity.pastEventGallery.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#574B45] mb-3">
                    Galería Fotográfica de la Jornada
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {activity.pastEventGallery.map((img, i) => (
                      <div key={i} className="aspect-4/3 rounded-xl overflow-hidden bg-[#F6F1EA]">
                        <img src={img} alt={`Foto evento ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar Column: Reservation Block or Archive Notice */}
        <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
          {!isHeld ? (
            <ReservationBlock activity={activity} />
          ) : (
            <div className="rounded-2xl border border-[#EDE4D7] bg-white p-6 md:p-8 space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-[#F6F1EA] text-[#521849] flex items-center justify-center mx-auto">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-serif text-[#26201D]">
                Actividad ya finalizada
              </h3>
              <p className="text-xs text-[#574B45]">
                Esta actividad tuvo lugar el {activity.date}. Permanece archivada en nuestra memoria histórica para consulta de socios.
              </p>
              <Link
                to={parent.path}
                className="inline-block w-full py-3 px-4 rounded-xl bg-[#521849] text-white text-xs font-semibold hover:bg-[#3E1037] transition-colors"
              >
                Ver próximas actividades similares
              </Link>
            </div>
          )}

          {/* Quick Help & Contact */}
          <div className="rounded-2xl bg-[#FCFAF7] border border-[#EDE4D7] p-5 text-xs text-[#574B45] space-y-2">
            <h4 className="font-semibold text-[#26201D]">¿Dudas sobre esta convocatoria?</h4>
            <p>Escribe a secretaría en <a href="mailto:secretaria@donaberenjena.es" className="text-[#521849] underline">secretaria@donaberenjena.es</a> o llama al <a href="tel:+34912345678" className="text-[#521849] font-medium">+34 912 345 678</a>.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
