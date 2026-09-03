import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Activity, ActivityType, CataActivity, WineDetail, BodegaItem } from '../../types';
import { sortActivitiesNewestFirst, sortActivitiesOldestFirst } from '../../utils/dateUtils';
import { extractTextFromPdf, parseCataText, DEFAULT_OFFICIAL_LOCATION, getDefaultStartTime } from '../../services/pdfCataParser';
import { searchBodegaLogo } from '../../services/bodegaLogoService';
import { BodegaLogoSearchModal } from '../../components/admin/BodegaLogoSearchModal';
import { BodegaWebsiteSearchModal } from '../../components/admin/BodegaWebsiteSearchModal';
import { BodegaManager } from '../../components/admin/BodegaManager';
import { SimpleMembersManager } from '../../components/admin/SimpleMembersManager';
import { QuickCheckIn } from '../../components/admin/QuickCheckIn';
import { getAdminAuthHeader } from '../../services/authHelper';
import { getActivityRegistrationState } from '../../utils/activityStatus';
import { 
  Plus, 
  Calendar, 
  Euro, 
  CheckCircle, 
  Sparkles, 
  Check, 
  Edit2, 
  Trash2, 
  Upload, 
  FileUp, 
  Loader2, 
  AlertTriangle,
  AlertCircle,
  Wine,
  Clock,
  MapPin,
  Globe,
  UserCheck,
  Bell,
  X,
  ListChecks,
  Layers,
  Users,
  RefreshCw,
  ArrowLeft,
  DollarSign
} from 'lucide-react';

export const ModoSencilloView: React.FC = () => {
  const { activities, participants, members, unreadNotificationsCount, addActivity, quickUpdateActivity, deleteActivity } = useData();
  const [activeTab, setActiveTab] = useState<'proximas' | 'celebradas' | 'socios'>('proximas');
  const [checkInActivityId, setCheckInActivityId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);
  const [activityToDelete, setActivityToDelete] = useState<Activity | null>(null);
  const [activityToToggleRegistration, setActivityToToggleRegistration] = useState<Activity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Simplified creation form state
  const [newType, setNewType] = useState<ActivityType>('cata');
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  
  // Turnos & Sesiones (exclusivo de catas)
  const [sessionMode, setSessionMode] = useState<'una_sesion' | 'dos_turnos'>('una_sesion');
  const [shift1Name, setShift1Name] = useState('Turno 1');
  const [shift2Name, setShift2Name] = useState('Turno 2');
  const [newDate1, setNewDate1] = useState('');
  const [newTime1, setNewTime1] = useState('21:00');
  const [newDate2, setNewDate2] = useState('');
  const [newTime2, setNewTime2] = useState('22:30');
  const [newSpots1, setNewSpots1] = useState(14);
  const [newSpots2, setNewSpots2] = useState(14);
  const [formValidationError, setFormValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newPriceMember, setNewPriceMember] = useState(20.0); // Default 20.00€
  const [newPriceNonMember, setNewPriceNonMember] = useState(25.0); // Default 25.00€
  const [newSpots, setNewSpots] = useState(14); // Default 14 for simple/courses/trips
  const [newLocation, setNewLocation] = useState(DEFAULT_OFFICIAL_LOCATION);
  
  // Specific cata state
  const [bodegas, setBodegas] = useState<BodegaItem[]>([
    {
      name: 'Bodega Invitada',
      region: 'Castilla-La Mancha',
      website: '',
      wines: [
        { type: 'Blanco', name: '', grape: '', pairing: '' },
        { type: 'Tinto', name: '', grape: '', pairing: '' },
        { type: 'Espumoso', name: '', grape: '', pairing: '' }
      ]
    }
  ]);
  const [newSumiller, setNewSumiller] = useState('Ana García');
  const [newAove, setNewAove] = useState('');
  const [activeBodegaLogoIdx, setActiveBodegaLogoIdx] = useState(0);
  const [activeBodegaWebIdx, setActiveBodegaWebIdx] = useState(0);
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1200&q=80');
  const [isSearchingLogo, setIsSearchingLogo] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [isWebsiteModalOpen, setIsWebsiteModalOpen] = useState(false);

  // PDF state
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState<string | null>(null);

  // Editing state for quick in-line updates
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPriceMember, setEditPriceMember] = useState<number>(0);
  const [editPriceNonMember, setEditPriceNonMember] = useState<number>(0);
  const [editDate, setEditDate] = useState<string>('');
  const [editSpots, setEditSpots] = useState<number>(0);

  const upcoming = sortActivitiesOldestFirst(activities.filter(a => a.status === 'proxima'));
  const held = sortActivitiesNewestFirst(activities.filter(a => a.status === 'celebrada'));

  const handleDate1Change = (dateVal: string) => {
    setNewDate1(dateVal);
    if (!newDate2 || newDate2 === newDate1) {
      setNewDate2(dateVal);
    }
    const defaultT = getDefaultStartTime(dateVal);
    setNewTime1(defaultT);
    if (sessionMode === 'dos_turnos' && newTime2 === defaultT) {
      setNewTime2(defaultT === '21:00' ? '22:45' : defaultT === '13:00' ? '15:00' : '22:30');
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingPdf(true);
    setPdfSuccess(null);
    setFormValidationError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const authHeaders = await getAdminAuthHeader();

      const response = await fetch("/api/parse-cata", {
        method: "POST",
        headers: {
          ...authHeaders
        },
        body: formData,
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const rawText = await response.text();
        throw new Error(`Error ${response.status}: El servidor no devolvió JSON válido. Respuesta: ${rawText.substring(0, 500)}`);
      }

      if (!response.ok) {
        let errorMessage = `Error ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage += `: ${errorData.error}`;
          } else {
            errorMessage += `: ${JSON.stringify(errorData)}`;
          }
        } catch (e) {
          errorMessage += `: No se pudo leer el detalle del error.`;
        }
        throw new Error(errorMessage);
      }

      const parsed = await response.json();

      setNewTitle(parsed.title || '');
      setNewSubtitle(parsed.subtitle || '');
      setNewDescription(parsed.description || '');
      
      setNewDate1(parsed.date || '');
      // Format time strictly to HH:MM
      const formatTime = (t?: string) => {
        if (!t) return '';
        const m = t.match(/(\d{1,2}):(\d{2})/);
        return m ? `${m[1].padStart(2, '0')}:${m[2]}` : '';
      };
      const formattedTime1 = formatTime(parsed.time) || (parsed.date ? getDefaultStartTime(parsed.date) : '21:00');
      setNewTime1(formattedTime1);

      setNewPriceNonMember(Number(Number(parsed.price || 25.0).toFixed(2)));
      setNewPriceMember(Number(Number(parsed.price || 20.0).toFixed(2)));
      setNewSpots(parsed.spots || 14);
      setNewSpots1(parsed.spots || 14);
      setNewLocation(parsed.location || DEFAULT_OFFICIAL_LOCATION);

      // Handle multi-shift detection from AI response
      if (parsed.hasMultipleShifts) {
        setSessionMode('dos_turnos');
        setShift1Name(parsed.shift1Name || 'Turno 1');
        setShift2Name(parsed.shift2Name || 'Turno 2');
        setNewDate2(parsed.date2 || parsed.date || '');
        const formattedTime2 = formatTime(parsed.time2) || '22:30';
        setNewTime2(formattedTime2);
        setNewSpots2(parsed.spots2 || parsed.spots || 14);
      } else {
        setSessionMode('una_sesion');
        setShift1Name('Turno 1');
        setShift2Name('Turno 2');
        setNewDate2(parsed.date || '');
        setNewTime2('22:30');
        setNewSpots2(14);
      }
      
      if (parsed.bodegas && Array.isArray(parsed.bodegas) && parsed.bodegas.length > 0) {
        setBodegas(parsed.bodegas);
      } else {
        const fallbackName = parsed.bodegaProductor?.name || 'Bodega Invitada';
        setBodegas([
          {
            name: fallbackName,
            region: parsed.bodegaProductor?.region || 'Castilla-La Mancha',
            website: '',
            wines: parsed.wines || [
              { type: 'Blanco', name: '', grape: '', pairing: '' },
              { type: 'Tinto', name: '', grape: '', pairing: '' }
            ]
          }
        ]);
      }
      
      setNewSumiller(parsed.sumiller || 'Ana García');
      setNewAove(parsed.aove || '');

      // Point 8: Auto search bodega logo for primary bodega
      const firstBodegaName = parsed.bodegas?.[0]?.name || parsed.bodegaProductor?.name;
      if (firstBodegaName) {
        setIsSearchingLogo(true);
        const logo = await searchBodegaLogo(firstBodegaName);
        if (logo) {
          setImageUrl(logo);
        }
        setIsSearchingLogo(false);
      }

      const totalWinesCount = (parsed.bodegas || []).reduce((acc: number, b: any) => acc + (b.wines?.length || 0), 0) || parsed.wines?.length || 0;
      if (parsed.hasMultipleShifts) {
        setPdfSuccess(`¡Cartel analizado con IA! Detectados 2 turnos independientes (${parsed.shift1Name || 'Turno 1'} y ${parsed.shift2Name || 'Turno 2'}), ${parsed.bodegas?.length || 1} bodegas y ${totalWinesCount} vinos.`);
      } else if (parsed.isShiftAmbiguous) {
        setPdfSuccess(`¡Cartel analizado! Se detectó posible ambigüedad en los turnos; se ha cargado como una única sesión para revisión y confirmación administrativa.`);
      } else {
        setPdfSuccess(`¡Archivo "${file.name}" analizado con IA con éxito! Detectadas ${parsed.bodegas?.length || 1} bodegas, ${totalWinesCount} vinos y sumiller ${parsed.sumiller || 'Ana García'}.`);
      }
    } catch (err) {
      console.error('Error procesando PDF/Imagen:', err);
      alert('Error: ' + (err as Error).message);
    } finally {
      setIsParsingPdf(false);
      e.target.value = '';
    }
  };

  const handleOpenLogoModalForBodega = (bIdx: number) => {
    setActiveBodegaLogoIdx(bIdx);
    setIsLogoModalOpen(true);
  };

  const handleOpenWebsiteModalForBodega = (bIdx: number) => {
    setActiveBodegaWebIdx(bIdx);
    setIsWebsiteModalOpen(true);
  };

  const handleCreateSimple = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormValidationError(null);

    if (!newTitle.trim()) {
      setFormValidationError('El título de la actividad es obligatorio.');
      return;
    }
    if (!newDate1) {
      setFormValidationError('La fecha de la actividad es obligatoria.');
      return;
    }

    if (newType === 'cata' && sessionMode === 'dos_turnos') {
      if (!newDate2) {
        setFormValidationError('Debes indicar la fecha para ambos turnos.');
        return;
      }
      if (!newTime1 || !newTime2) {
        setFormValidationError('Debes indicar la hora de inicio para ambos turnos.');
        return;
      }
      if (newDate1 === newDate2 && newTime1 === newTime2) {
        setFormValidationError('Los turnos para el mismo día deben tener horas de inicio diferentes.');
        return;
      }
      if (newSpots1 <= 0 || newSpots2 <= 0) {
        setFormValidationError('El aforo de cada turno debe ser superior a 0.');
        return;
      }
    } else {
      if (!newTime1) {
        setFormValidationError('Debes indicar la hora de inicio.');
        return;
      }
      if (newSpots <= 0) {
        setFormValidationError('El aforo debe ser superior a 0.');
        return;
      }
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Clean bodegas data
      const cleanedBodegas: BodegaItem[] = bodegas.map(b => ({
        name: b.name.trim() || 'Bodega Invitada',
        region: b.region.trim() || 'Castilla-La Mancha',
        website: b.website?.trim() || undefined,
        wines: b.wines
          .filter(w => w.name.trim() || w.pairing?.trim() || w.grape?.trim())
          .map(w => ({
            type: w.type.trim() || 'Vino',
            name: w.name.trim(),
            grape: w.grape?.trim() || undefined,
            pairing: w.pairing?.trim() || undefined,
            notes: w.notes?.trim() || undefined
          }))
      }));

      // Collect all wines for legacy compatibility
      const allWines: WineDetail[] = [];
      cleanedBodegas.forEach(b => {
        b.wines.forEach(w => {
          allWines.push({
            ...w,
            bodega: b.name,
            region: b.region
          });
        });
      });

      const pairingMenu = allWines.map(w => ({
        dish: w.pairing || 'Degustación',
        pairing: `${w.type} ${w.name}`.trim(),
        notes: w.grape || undefined
      }));

      if (newType === 'cata' && sessionMode === 'dos_turnos') {
        const tastingGroupId = `tg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

        // Actividad Turno 1
        const recordShift1: CataActivity = {
          id: `cata-${Date.now()}-t1`,
          type: 'cata',
          category: 'vino',
          title: newTitle.trim(),
          subtitle: newSubtitle || (cleanedBodegas[0]?.name ? `Con ${cleanedBodegas[0]?.name}` : `Cata de Bodega`),
          description: newDescription || '',
          date: newDate1,
          time: newTime1,
          priceMember: Number(newPriceMember),
          priceNonMember: Number(newPriceNonMember),
          totalSpots: Number(newSpots1),
          bookedSpots: 0,
          status: 'proxima',
          registrationStatus: 'abierta',
          location: newLocation,
          images: [imageUrl],
          tastingGroupId,
          shiftName: shift1Name.trim() || 'Turno 1',
          bodegas: cleanedBodegas,
          bodegaProductor: { 
            name: cleanedBodegas[0]?.name || 'Bodega Invitada', 
            region: cleanedBodegas[0]?.region || 'Castilla-La Mancha',
            website: cleanedBodegas[0]?.website || undefined
          },
          sumiller: newSumiller || 'Ana García',
          aove: newAove || undefined,
          wines: allWines,
          pairingMenu: pairingMenu,
          createdAt: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString().split('T')[0],
        };

        // Actividad Turno 2 (independiente con su propio ID, aforo, reservas y asistencia)
        const recordShift2: CataActivity = {
          id: `cata-${Date.now() + 1}-t2`,
          type: 'cata',
          category: 'vino',
          title: newTitle.trim(),
          subtitle: newSubtitle || (cleanedBodegas[0]?.name ? `Con ${cleanedBodegas[0]?.name}` : `Cata de Bodega`),
          description: newDescription || '',
          date: newDate2 || newDate1,
          time: newTime2,
          priceMember: Number(newPriceMember),
          priceNonMember: Number(newPriceNonMember),
          totalSpots: Number(newSpots2),
          bookedSpots: 0,
          status: 'proxima',
          registrationStatus: 'abierta',
          location: newLocation,
          images: [imageUrl],
          tastingGroupId,
          shiftName: shift2Name.trim() || 'Turno 2',
          bodegas: cleanedBodegas,
          bodegaProductor: { 
            name: cleanedBodegas[0]?.name || 'Bodega Invitada', 
            region: cleanedBodegas[0]?.region || 'Castilla-La Mancha',
            website: cleanedBodegas[0]?.website || undefined
          },
          sumiller: newSumiller || 'Ana García',
          aove: newAove || undefined,
          wines: allWines,
          pairingMenu: pairingMenu,
          createdAt: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString().split('T')[0],
        };

        await addActivity(recordShift1);
        await addActivity(recordShift2);

        setSavedSuccess(`¡Se han creado con éxito los 2 turnos independientes de la cata en Firestore!`);
      } else {
        // Single session or Curso or Viaje
        const baseRecord1: Activity = {
          id: `${newType}-${Date.now()}`,
          type: newType,
          title: newTitle.trim(),
          subtitle: newSubtitle || (cleanedBodegas[0]?.name ? `Con ${cleanedBodegas[0]?.name}` : `Convocatoria de ${newType}`),
          description: newDescription || '',
          date: newDate1,
          time: newTime1,
          priceMember: Number(newPriceMember),
          priceNonMember: Number(newPriceNonMember),
          totalSpots: Number(newSpots),
          bookedSpots: 0,
          status: 'proxima',
          registrationStatus: 'abierta',
          location: newLocation,
          images: [imageUrl],
          createdAt: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString().split('T')[0],
          ...(newType === 'cata' ? {
            category: 'vino',
            bodegas: cleanedBodegas,
            bodegaProductor: { 
              name: cleanedBodegas[0]?.name || 'Bodega Invitada', 
              region: cleanedBodegas[0]?.region || 'Castilla-La Mancha',
              website: cleanedBodegas[0]?.website || undefined
            },
            sumiller: newSumiller || 'Ana García',
            aove: newAove || undefined,
            wines: allWines,
            pairingMenu: pairingMenu
          } : newType === 'curso' ? {
            theme: 'Taller Gastronómico',
            chef: { name: 'Chef Invitado', bio: 'Especialista culinario' },
            syllabus: ['Técnicas fundamentales', 'Elaboración práctica', 'Degustación'],
            includesTasting: true
          } : {
            destination: 'Ruta Gastronómica',
            durationDays: 2,
            includedServices: ['Transporte y alojamiento', 'Visitas guiadas', 'Degustaciones'],
            itinerary: [{ day: 1, title: 'Llegada y bienvenida', description: 'Presentación', highlights: ['Cata inicial'] }]
          })
        } as Activity;

        await addActivity(baseRecord1);
        setSavedSuccess(`¡Convocatoria generada con éxito en Firestore!`);
      }

      setShowCreateForm(false);
      setTimeout(() => setSavedSuccess(null), 4000);
    } catch (err: any) {
      console.error('Error al guardar convocatoria:', err);
      setFormValidationError(`Error al guardar: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (act: Activity) => {
    setEditingId(act.id);
    setEditPriceMember(act.priceMember);
    setEditPriceNonMember(act.priceNonMember);
    setEditDate(act.date);
    setEditSpots(act.totalSpots);
  };

  const saveEdit = async (id: string) => {
    await quickUpdateActivity(id, {
      priceMember: editPriceMember,
      priceNonMember: editPriceNonMember,
      date: editDate,
      totalSpots: editSpots
    });
    setEditingId(null);
  };

  const toggleStatus = async (act: Activity) => {
    try {
      const nextStatus = act.status === 'proxima' ? 'celebrada' : 'proxima';
      await quickUpdateActivity(act.id, {
        status: nextStatus
      });
      if (nextStatus === 'celebrada') {
        setSavedSuccess(`La actividad «${act.title}» se ha archivado como CELEBRADA y se ha movido a la pestaña de Celebradas.`);
      } else {
        setSavedSuccess(`La actividad «${act.title}» se ha movido a Próximas actividades.`);
      }
      setTimeout(() => setSavedSuccess(null), 4000);
    } catch (err: any) {
      console.error('Error al cambiar estado de la actividad:', err);
      alert('Error al cambiar estado: ' + (err.message || err));
    }
  };

  const handleToggleRegistration = async (act: Activity) => {
    const isCurrentlyClosed = act.registrationStatus === 'cerrada';
    if (!isCurrentlyClosed) {
      if (act.bookedSpots > 0) {
        setActivityToToggleRegistration(act);
        return;
      }
      await quickUpdateActivity(act.id, { registrationStatus: 'cerrada' });
    } else {
      await quickUpdateActivity(act.id, { registrationStatus: 'abierta' });
    }
  };

  const confirmCloseRegistration = async () => {
    if (!activityToToggleRegistration) return;
    await quickUpdateActivity(activityToToggleRegistration.id, { registrationStatus: 'cerrada' });
    setActivityToToggleRegistration(null);
  };

  const handleMarkAsNotHeld = async (act: Activity) => {
    try {
      await quickUpdateActivity(act.id, { 
        status: 'proxima',
        registrationStatus: 'abierta'
      });
      setSavedSuccess(`La actividad «${act.title}» se ha marcado como NO CELEBRADA y se ha movido a Próximas actividades.`);
      setTimeout(() => setSavedSuccess(null), 4000);
    } catch (err: any) {
      console.error('Error al actualizar estado:', err);
      alert('Error al actualizar estado: ' + (err.message || err));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="text-xs uppercase tracking-widest font-bold text-[#C96043]">
          Operación Rápida Móvil
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#26201D]">
          Modo Sencillo
        </h2>
        <p className="text-xs text-[#574B45] mt-1">
          Gestión simplificada: Próximas actividades con hoja de asistencia, historial de celebradas y censo de socios.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{savedSuccess}</span>
        </div>
      )}

      {/* 4 Main Navigation Buttons - No horizontal scroll, responsive grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Button 1: Nueva Actividad */}
        <button
          id="btn-nav-nueva-actividad"
          type="button"
          onClick={() => {
            if (activeTab === 'proximas') {
              setShowCreateForm(!showCreateForm);
            } else {
              setActiveTab('proximas');
              setShowCreateForm(true);
              setCheckInActivityId(null);
            }
          }}
          className={`min-h-[44px] px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs ${
            showCreateForm && activeTab === 'proximas'
              ? 'bg-[#521849] text-white shadow-xs'
              : 'bg-white hover:bg-[#F6F1EA] text-[#26201D] border border-[#EDE4D7]'
          }`}
        >
          <Plus className={`w-4 h-4 ${showCreateForm && activeTab === 'proximas' ? 'text-amber-300' : 'text-[#521849]'}`} />
          <span>{showCreateForm && activeTab === 'proximas' ? 'Cerrar Formulario' : '+ Nueva actividad'}</span>
        </button>

        {/* Button 2: Próximas Actividades */}
        <button
          id="btn-tab-proximas"
          type="button"
          onClick={() => {
            setActiveTab('proximas');
            setShowCreateForm(false);
            setCheckInActivityId(null);
          }}
          className={`min-h-[44px] px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs ${
            activeTab === 'proximas' && !showCreateForm && !checkInActivityId
              ? 'bg-[#521849] text-white shadow-xs'
              : 'bg-white text-[#574B45] hover:bg-[#F6F1EA] border border-[#EDE4D7]'
          }`}
        >
          <Calendar className={`w-4 h-4 ${activeTab === 'proximas' && !showCreateForm && !checkInActivityId ? 'text-white' : 'text-[#521849]'}`} />
          <span className="truncate">Próximas ({upcoming.length})</span>
        </button>

        {/* Button 3: Actividades Celebradas */}
        <button
          id="btn-tab-celebradas"
          type="button"
          onClick={() => {
            setActiveTab('celebradas');
            setShowCreateForm(false);
            setCheckInActivityId(null);
          }}
          className={`min-h-[44px] px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs ${
            activeTab === 'celebradas' && !checkInActivityId
              ? 'bg-[#521849] text-white shadow-xs'
              : 'bg-white text-[#574B45] hover:bg-[#F6F1EA] border border-[#EDE4D7]'
          }`}
        >
          <CheckCircle className={`w-4 h-4 ${activeTab === 'celebradas' && !checkInActivityId ? 'text-emerald-300' : 'text-emerald-600'}`} />
          <span className="truncate">Celebradas ({held.length})</span>
        </button>

        {/* Button 4: Socios */}
        <button
          id="btn-tab-socios"
          type="button"
          onClick={() => {
            setActiveTab('socios');
            setShowCreateForm(false);
            setCheckInActivityId(null);
          }}
          className={`min-h-[44px] px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs ${
            activeTab === 'socios' && !checkInActivityId
              ? 'bg-[#521849] text-white shadow-xs'
              : 'bg-white text-[#574B45] hover:bg-[#F6F1EA] border border-[#EDE4D7]'
          }`}
        >
          <Users className={`w-4 h-4 ${activeTab === 'socios' && !checkInActivityId ? 'text-amber-300' : 'text-[#521849]'}`} />
          <span className="truncate">Socios ({members.length})</span>
        </button>
      </div>

      {/* Check-in In Situ View (if active) */}
      {checkInActivityId ? (
        <QuickCheckIn
          initialActivityId={checkInActivityId}
          onClose={() => setCheckInActivityId(null)}
        />
      ) : (
        <>
          {activeTab === 'proximas' && (
            <div className="space-y-6">
              {/* Quick Create Form with PDF Autocomplete */}
              {showCreateForm && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#EDE4D7] shadow-xl space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-lg text-[#26201D]">
              Alta Rápida de Actividad / Cata
            </h3>
            <span className="text-xs text-[#C96043] font-semibold bg-[#F6EDF4] px-2.5 py-1 rounded-full">
              Por defecto: 25,00€ | 14 plazas | Sede Oficial
            </span>
          </div>

          {/* Cartel / Image Upload Box */}
          <div className="p-4 rounded-2xl bg-[#FCFAF7] border border-[#EDE4D7] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-[#521849] flex items-center gap-1.5">
                <FileUp className="w-4 h-4 text-[#C96043]" />
                Autocompletar cartel con Inteligencia Artificial
              </span>
              <p className="text-[11px] text-[#574B45] mt-0.5">
                Sube el cartel en PDF o Imagen. Nuestra IA extraerá automáticamente fechas, pases, bodegas, vinos y maridajes.
              </p>
            </div>
            <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#521849] hover:bg-[#3E1037] text-white text-xs font-semibold cursor-pointer shadow-xs whitespace-nowrap">
              {isParsingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              <span>{isParsingPdf ? 'Procesando IA...' : 'Subir PDF / Imagen'}</span>
              <input
                type="file"
                accept="application/pdf,.pdf,image/*"
                onChange={handlePdfUpload}
                className="sr-only"
                disabled={isParsingPdf}
              />
            </label>
          </div>

          {pdfSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{pdfSuccess}</span>
            </div>
          )}

          <form onSubmit={handleCreateSimple} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#26201D] mb-1">Tipo</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as ActivityType)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs"
                >
                  <option value="cata">Cata de Vinos / Maridaje</option>
                  <option value="curso">Curso de Cocina</option>
                  <option value="viaje">Viaje Enogastronómico</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-[#26201D] mb-1">Título de la actividad *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ej. La Expresión del Terruño"
                  className="w-full px-3 py-2.5 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs font-medium"
                />
              </div>

              {/* Selector de Modo de Sesión (Exclusivo para Catas) */}
              {newType === 'cata' && (
                <div className="sm:col-span-2 lg:col-span-4 p-4 rounded-2xl bg-[#F6EDF4]/60 border border-[#521849]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#521849] mb-0.5">
                      Modalidad de Turnos para la Cata
                    </label>
                    <p className="text-[11px] text-[#574B45]">
                      Configura si la cata tendrá una única sesión o se celebrará en dos turnos independientes con sus propios aforos y reservas.
                    </p>
                  </div>
                  <div className="inline-flex rounded-xl bg-white p-1 border border-[#EDE4D7] shadow-2xs shrink-0">
                    <button
                      type="button"
                      onClick={() => setSessionMode('una_sesion')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        sessionMode === 'una_sesion'
                          ? 'bg-[#521849] text-white shadow-xs'
                          : 'text-[#574B45] hover:bg-[#F6F1EA]'
                      }`}
                    >
                      Una sesión
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSessionMode('dos_turnos');
                        if (!newDate2) setNewDate2(newDate1);
                      }}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        sessionMode === 'dos_turnos'
                          ? 'bg-[#521849] text-white shadow-xs'
                          : 'text-[#574B45] hover:bg-[#F6F1EA]'
                      }`}
                    >
                      Dos turnos
                    </button>
                  </div>
                </div>
              )}

              {/* Si es cata y modo dos_turnos: Renderizar campos de Turno 1 y Turno 2 */}
              {newType === 'cata' && sessionMode === 'dos_turnos' ? (
                <div className="sm:col-span-2 lg:col-span-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Turno 1 */}
                  <div className="p-4 rounded-2xl bg-[#FCFAF7] border border-[#521849]/20 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#EDE4D7]">
                      <span className="text-xs font-bold text-[#521849] flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#C96043]" />
                        Primer Turno (Turno 1) *
                      </span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#521849]/10 text-[#521849]">
                        Turno 1
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#26201D] mb-1">Nombre del Turno</label>
                      <input
                        type="text"
                        value={shift1Name}
                        onChange={(e) => setShift1Name(e.target.value)}
                        placeholder="Turno 1"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#EDE4D7] bg-white text-xs font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] text-[#574B45] mb-1">Fecha Turno 1 *</label>
                        <input
                          type="date"
                          required
                          value={newDate1}
                          onChange={(e) => handleDate1Change(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-[#EDE4D7] bg-white text-xs font-medium cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#574B45] mb-1 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#521849]" />
                          Hora Inicio 1 *
                        </label>
                        <input
                          type="time"
                          required
                          value={newTime1}
                          onChange={(e) => setNewTime1(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-[#EDE4D7] bg-white text-xs font-medium cursor-pointer"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#26201D] mb-1">Aforo Turno 1 (Plazas) *</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={newSpots1}
                        onChange={(e) => setNewSpots1(Math.max(1, parseInt(e.target.value) || 0))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#EDE4D7] bg-white text-xs font-bold text-[#26201D]"
                      />
                    </div>
                  </div>

                  {/* Turno 2 */}
                  <div className="p-4 rounded-2xl bg-[#FCFAF7] border border-[#521849]/20 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#EDE4D7]">
                      <span className="text-xs font-bold text-[#521849] flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#C96043]" />
                        Segundo Turno (Turno 2) *
                      </span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#C96043]/10 text-[#C96043]">
                        Turno 2
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#26201D] mb-1">Nombre del Turno</label>
                      <input
                        type="text"
                        value={shift2Name}
                        onChange={(e) => setShift2Name(e.target.value)}
                        placeholder="Turno 2"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#EDE4D7] bg-white text-xs font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] text-[#574B45] mb-1">Fecha Turno 2 *</label>
                        <input
                          type="date"
                          required
                          value={newDate2}
                          onChange={(e) => setNewDate2(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-[#EDE4D7] bg-white text-xs font-medium cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#574B45] mb-1 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#521849]" />
                          Hora Inicio 2 *
                        </label>
                        <input
                          type="time"
                          required
                          value={newTime2}
                          onChange={(e) => setNewTime2(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-[#EDE4D7] bg-white text-xs font-medium cursor-pointer"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-semibold text-[#26201D]">Aforo Turno 2 (Plazas) *</label>
                        <button
                          type="button"
                          onClick={() => setNewSpots2(newSpots1)}
                          className="text-[10px] text-[#521849] hover:text-[#C96043] font-semibold underline cursor-pointer"
                        >
                          Copiar aforo de Turno 1 ({newSpots1})
                        </button>
                      </div>
                      <input
                        type="number"
                        min="1"
                        required
                        value={newSpots2}
                        onChange={(e) => setNewSpots2(Math.max(1, parseInt(e.target.value) || 0))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#EDE4D7] bg-white text-xs font-bold text-[#26201D]"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Modo Una Sesión (O Cursos / Viajes) */
                <>
                  <div className="p-3.5 rounded-2xl bg-[#FCFAF7] border border-[#EDE4D7] sm:col-span-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#521849] flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#C96043]" />
                        Fecha y Hora de la Actividad *
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] text-[#574B45] mb-1">Fecha</label>
                        <input
                          type="date"
                          required
                          value={newDate1}
                          onChange={(e) => handleDate1Change(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-[#EDE4D7] bg-white text-xs font-medium cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#574B45] mb-1 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#521849]" />
                          Hora Inicio
                        </label>
                        <input
                          type="time"
                          required
                          value={newTime1}
                          onChange={(e) => setNewTime1(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-[#EDE4D7] bg-white text-xs font-medium cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#26201D] mb-1">Aforo Máximo (Plazas)</label>
                    <input
                      type="number"
                      min="1"
                      value={newSpots}
                      onChange={(e) => setNewSpots(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs font-bold text-[#26201D]"
                    />
                  </div>
                </>
              )}

              {/* Point 2: Sede oficial location */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#26201D] mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#C96043]" />
                  Ubicación de la Sede Oficial
                </label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs"
                />
              </div>

              {/* Specific cata summary fields */}
              {newType === 'cata' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-[#26201D] mb-1">Sumiller Guía</label>
                    <input
                      type="text"
                      value={newSumiller}
                      onChange={(e) => setNewSumiller(e.target.value)}
                      placeholder="Ana García"
                      className="w-full px-3 py-2 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#26201D] mb-1">AOVE / Aceite de Bienvenida</label>
                    <input
                      type="text"
                      value={newAove}
                      onChange={(e) => setNewAove(e.target.value)}
                      placeholder="Quinto Don Otilio - AOVE Picual"
                      className="w-full px-3 py-2 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs"
                    />
                  </div>
                </>
              )}

              <div className="sm:col-span-2 lg:col-span-4">
                <label className="block text-xs font-semibold text-[#26201D] mb-1">Descripción / Texto Detallado</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Texto descriptivo, talleres, presencia de bodegueros o notas..."
                  className="w-full px-3 py-2 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs resize-none"
                />
              </div>
            </div>

            {/* Bodega & Wine Manager (1 to 4 Bodegas, each with 1 to 4 wines) */}
            {newType === 'cata' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-[#FBF9F5] border border-[#EDE4D7]">
                <BodegaManager
                  bodegas={bodegas}
                  onChange={setBodegas}
                  onOpenLogoModal={handleOpenLogoModalForBodega}
                  onOpenWebsiteModal={handleOpenWebsiteModalForBodega}
                />
              </div>
            )}

            {/* Point 8: Imagen / Logo de la bodega */}
            <div className="p-3.5 rounded-2xl bg-[#FCFAF7] border border-[#EDE4D7] flex items-center gap-4">
              <img 
                src={imageUrl} 
                alt="Logo o portada"
                className="w-14 h-14 rounded-xl object-cover border border-[#EDE4D7] bg-white shrink-0"
              />
              <div className="flex-1">
                <label className="block text-xs font-semibold text-[#26201D] mb-1">
                  Logo / Imagen de Portada de la Bodega
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-1.5 rounded-lg border border-[#EDE4D7] bg-white text-xs font-mono"
                />
              </div>
            </div>

            {formValidationError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formValidationError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setFormValidationError(null);
                }}
                className="px-4 py-2.5 rounded-xl border border-[#EDE4D7] text-xs font-semibold text-[#574B45] hover:bg-[#F6F1EA] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-[#521849] hover:bg-[#3E1037] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <span>
                    {newType === 'cata' && sessionMode === 'dos_turnos' 
                      ? 'Guardar los 2 Turnos en BD' 
                      : 'Guardar Ficha en BD'}
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List of Upcoming Activities */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#26201D]">
          Actividades Programadas ({upcoming.length})
        </h3>

        <div className="grid grid-cols-1 gap-3">
          {upcoming.map((act) => {
            const isEditing = editingId === act.id;
            const regState = getActivityRegistrationState(act);
            const isClosed = act.registrationStatus === 'cerrada';

            return (
              <div
                key={act.id}
                className="p-5 rounded-2xl bg-white border border-[#EDE4D7] hover:border-[#DFD3C2] transition-all space-y-4 shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-[#521849]/10 text-[#521849]">
                          {act.type}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${regState.colorClass}`}>
                          {regState.badge}
                        </span>
                      </div>
                      <h4 className="text-base font-bold font-serif text-[#26201D] mt-1">
                        {act.title}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    {/* Toggle registration status button */}
                    <button
                      type="button"
                      onClick={() => handleToggleRegistration(act)}
                      aria-label={isClosed ? `Abrir inscripciones para ${act.title}` : `Cerrar inscripciones para ${act.title}`}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                        isClosed
                          ? 'border-stone-300 bg-stone-100 text-[#574B45] hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300'
                          : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-rose-50 hover:text-rose-800 hover:border-rose-300'
                      }`}
                      title={isClosed ? 'Inscripciones cerradas (clic para abrir)' : 'Inscripciones abiertas (clic para cerrar)'}
                    >
                      <span className={`w-2 h-2 rounded-full ${isClosed ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                      <span>{isClosed ? 'Inscripciones Cerradas' : 'Inscripciones Abiertas'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleStatus(act)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-emerald-300 text-emerald-800 hover:bg-emerald-50 cursor-pointer"
                    >
                      Archivar como Celebrada
                    </button>
                    {!isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => startEdit(act)}
                          className="p-1.5 rounded-lg border border-[#EDE4D7] text-[#521849] hover:bg-[#F6EDF4] cursor-pointer"
                          title="Modificar precio, fecha o aforo"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setActivityToDelete(act)}
                          className="p-1.5 rounded-lg border border-[#EDE4D7] text-[#9B3E26] hover:bg-rose-50 cursor-pointer"
                          title="Eliminar actividad"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => saveEdit(act.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#521849] text-white hover:bg-[#3E1037] cursor-pointer"
                      >
                        Guardar Cambios
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-2 border-t border-[#EDE4D7]">
                  <div>
                    <span className="text-[#574B45] block">Fecha y Hora:</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="w-full px-2 py-1 rounded border border-[#EDE4D7] text-xs font-bold"
                      />
                    ) : (
                      <span className="font-bold text-[#26201D] flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#521849]" />
                        {new Date(act.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })} {act.time ? `(${act.time})` : ''}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-[#574B45] block">Precio:</span>
                    {isEditing ? (
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Socio"
                          value={editPriceMember}
                          onChange={(e) => setEditPriceMember(Number(e.target.value))}
                          className="w-full px-2 py-1 rounded border border-[#EDE4D7] text-xs font-bold text-emerald-700"
                        />
                        <input
                          type="number"
                          placeholder="No socio"
                          value={editPriceNonMember}
                          onChange={(e) => setEditPriceNonMember(Number(e.target.value))}
                          className="w-full px-2 py-1 rounded border border-[#EDE4D7] text-xs font-bold text-[#521849]"
                        />
                      </div>
                    ) : (
                      act.priceMember !== act.priceNonMember ? (
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/70 px-1.5 py-0.5 rounded">
                            <span className="text-[10px] font-normal text-emerald-700">Socio:</span>
                            {act.priceMember}€
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#574B45] bg-[#F6F1EA] border border-[#EDE4D7] px-1.5 py-0.5 rounded">
                            <span className="text-[10px] font-normal text-[#8C7E77]">General:</span>
                            {act.priceNonMember}€
                          </span>
                        </div>
                      ) : (
                        <span className="font-bold text-[#26201D] text-xs">
                          {act.priceMember}€
                        </span>
                      )
                    )}
                  </div>

                  <div>
                    <span className="text-[#574B45] block">Aforo Total:</span>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editSpots}
                        onChange={(e) => setEditSpots(Number(e.target.value))}
                        className="w-full px-2 py-1 rounded border border-[#EDE4D7] text-xs font-bold"
                      />
                    ) : (
                      <span className="font-bold text-[#26201D]">
                        {act.totalSpots} plazas
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-[#574B45] block">Ocupación:</span>
                    {(() => {
                      const waitingCount = participants.filter(p => p.activityId === act.id && p.status === 'lista_de_espera').length;
                      return (
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          <span className={`font-bold ${act.bookedSpots >= act.totalSpots ? 'text-rose-600' : 'text-emerald-700'}`}>
                            {act.bookedSpots} / {act.totalSpots} ({act.totalSpots - act.bookedSpots > 0 ? `${act.totalSpots - act.bookedSpots} libres` : 'Completa'})
                          </span>
                          {waitingCount > 0 && (
                            <span 
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 text-[10px] font-bold cursor-help shadow-2xs"
                              title={`Lista de espera: ${waitingCount} persona${waitingCount !== 1 ? 's' : ''}`}
                            >
                              <Clock className="w-3 h-3 text-blue-600 shrink-0" />
                              <span>+{waitingCount} en espera</span>
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Direct Action for Mobile Check-in */}
                <div className="pt-3 border-t border-[#EDE4D7]/70 flex items-center justify-between flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setCheckInActivityId(act.id)}
                    className="min-h-[44px] w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-[0.98]"
                    title="Abrir hoja de asistencia para esta actividad"
                  >
                    <ListChecks className="w-4 h-4 text-emerald-200 shrink-0" />
                    <span>Revisar hoja de asistencia</span>
                  </button>

                  <span className="text-[11px] text-[#574B45]">
                    {act.bookedSpots} inscritos confirmados
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  )}

          {/* TAB 2: ACTIVIDADES CELEBRADAS */}
          {activeTab === 'celebradas' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#26201D]">
                Historial de Actividades Celebradas ({held.length})
              </h3>

              {held.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white border border-[#EDE4D7] text-center text-xs text-[#574B45]">
                  No hay actividades archivadas como celebradas todavía.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {held.map((act) => {
                    const actParticipants = participants.filter(p => p.activityId === act.id);
                    const attendedCount = actParticipants.filter(p => p.status === 'asistio' || p.attended === true).length;
                    const cancelledCount = actParticipants.filter(p => p.status === 'cancelada' || p.status === 'no_asistio').length;
                    const totalRevenue = actParticipants.reduce((sum, p) => (p.status === 'asistio' || p.status === 'pagada' || p.attended) ? sum + (p.totalAmount || (p.isMember ? act.priceMember : act.priceNonMember) || 0) : sum, 0);

                    return (
                      <div
                        key={act.id}
                        className="p-5 rounded-2xl bg-white border border-[#EDE4D7] hover:border-[#DFD3C2] transition-all space-y-4 shadow-xs"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-start gap-2.5">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-[#521849]/10 text-[#521849]">
                                  {act.type}
                                </span>
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-300 bg-emerald-50 text-emerald-800">
                                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                                  <span>Celebrada</span>
                                </span>
                              </div>
                              <h4 className="text-base font-bold font-serif text-[#26201D] mt-1">
                                {act.title}
                              </h4>
                              {act.subtitle && (
                                <p className="text-xs text-[#574B45]">{act.subtitle}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                            <button
                              type="button"
                              onClick={() => handleMarkAsNotHeld(act)}
                              className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 flex items-center gap-1.5 transition-colors cursor-pointer"
                              title="Devuelve la actividad a la pestaña de Próximas actividades"
                            >
                              <RefreshCw className="w-3.5 h-3.5 text-amber-800" />
                              <span>Marcar como NO CELEBRADA</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setActivityToDelete(act)}
                              className="min-h-[44px] min-w-[44px] p-2 rounded-xl border border-[#EDE4D7] text-[#9B3E26] hover:bg-rose-50 cursor-pointer flex items-center justify-center"
                              title="Eliminar actividad"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-3 border-t border-[#EDE4D7]">
                          <div>
                            <span className="text-[#574B45] block">Fecha y Hora:</span>
                            <span className="font-bold text-[#26201D] flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3.5 h-3.5 text-[#521849]" />
                              {new Date(act.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })} {act.time ? `(${act.time})` : ''}
                            </span>
                          </div>

                          <div>
                            <span className="text-[#574B45] block">Asistencia Real:</span>
                            <span className="font-bold text-emerald-800 mt-0.5 block">
                              {attendedCount} asistieron {cancelledCount > 0 ? `(${cancelledCount} no pres.)` : ''}
                            </span>
                          </div>

                          <div>
                            <span className="text-[#574B45] block">Aforo / Plazas:</span>
                            <span className="font-bold text-[#26201D] mt-0.5 block">
                              {act.bookedSpots} / {act.totalSpots} plazas
                            </span>
                          </div>

                          <div>
                            <span className="text-[#574B45] block">Recaudación Estimada:</span>
                            <span className="font-bold text-[#521849] mt-0.5 block">
                              {totalRevenue.toFixed(2)}€
                            </span>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-[#EDE4D7]/70 flex items-center justify-between flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setCheckInActivityId(act.id)}
                            className="min-h-[44px] w-full sm:w-auto px-4 py-2 rounded-xl bg-[#521849] hover:bg-[#3E1037] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-[0.98]"
                          >
                            <ListChecks className="w-4 h-4 text-emerald-300" />
                            <span>Revisar hoja de asistencia</span>
                          </button>

                          <span className="text-[11px] text-[#574B45]">
                            {actParticipants.length} asistentes registrados en total
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SOCIOS */}
          {activeTab === 'socios' && (
            <div className="space-y-4">
              <SimpleMembersManager />
            </div>
          )}
        </>
      )}

      {/* Close Registration Confirmation Modal */}
      {activityToToggleRegistration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#EDE4D7] space-y-5 animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-serif text-[#26201D]">
                ¿Cerrar inscripciones para esta actividad?
              </h3>
              <p className="text-xs text-[#574B45] mt-2">
                La actividad <strong>«{activityToToggleRegistration.title}»</strong> cuenta actualmente con <strong>{activityToToggleRegistration.bookedSpots} plazas reservadas</strong>.
              </p>
              <p className="text-xs text-[#574B45] mt-1">
                Al cerrar las inscripciones, ningún nuevo visitante podrá realizar reservas ni apuntarse en lista de espera desde la web pública.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActivityToToggleRegistration(null)}
                className="px-4 py-2 rounded-xl border border-[#EDE4D7] text-xs font-semibold text-[#574B45] hover:bg-[#F6F1EA] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmCloseRegistration}
                className="px-4 py-2 rounded-xl bg-[#521849] hover:bg-[#3E1037] text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                Sí, cerrar inscripciones
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {activityToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#EDE4D7] space-y-5 animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold font-serif text-[#26201D]">
                ¿Eliminar actividad?
              </h3>
              <p className="text-xs text-[#574B45] leading-relaxed">
                Vas a eliminar definitivamente <strong className="text-[#26201D]">"{activityToDelete.title}"</strong> de la base de datos Firestore. Esta acción no se puede deshacer.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setActivityToDelete(null)}
                className="py-2.5 rounded-xl border border-[#EDE4D7] text-xs font-semibold text-[#574B45] hover:bg-[#F6F1EA] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  try {
                    setIsDeleting(true);
                    await deleteActivity(activityToDelete.id);
                    setActivityToDelete(null);
                  } catch (err: any) {
                    alert('Error al eliminar de Firestore: ' + err.message);
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isDeleting ? 'Eliminando...' : 'Sí, eliminar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bodega Logo & Cover Image Search Modal */}
      {isLogoModalOpen && (
        <BodegaLogoSearchModal
          isOpen={isLogoModalOpen}
          onClose={() => setIsLogoModalOpen(false)}
          bodegaName={bodegas[activeBodegaLogoIdx]?.name || newTitle || ''}
          currentImageUrl={imageUrl || ''}
          onSelectImage={(url) => setImageUrl(url)}
        />
      )}

      {/* Bodega Official Website Search Modal */}
      {isWebsiteModalOpen && (
        <BodegaWebsiteSearchModal
          isOpen={isWebsiteModalOpen}
          onClose={() => setIsWebsiteModalOpen(false)}
          bodegaName={bodegas[activeBodegaWebIdx]?.name || ''}
          currentWebsite={bodegas[activeBodegaWebIdx]?.website || ''}
          onSelectWebsite={(url) => {
            const updated = [...bodegas];
            if (updated[activeBodegaWebIdx]) {
              updated[activeBodegaWebIdx] = {
                ...updated[activeBodegaWebIdx],
                website: url
              };
              setBodegas(updated);
            }
          }}
        />
      )}
    </div>
  );
};
