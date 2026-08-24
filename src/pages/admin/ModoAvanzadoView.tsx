import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Activity, ActivityType, CataActivity, CataCategory, CursoActivity, ViajeActivity, WineDetail, BodegaItem } from '../../types';
import { extractTextFromPdf, parseCataText, DEFAULT_OFFICIAL_LOCATION, getDefaultStartTime } from '../../services/pdfCataParser';
import { searchBodegaLogo } from '../../services/bodegaLogoService';
import { BodegaLogoSearchModal } from '../../components/admin/BodegaLogoSearchModal';
import { BodegaWebsiteSearchModal } from '../../components/admin/BodegaWebsiteSearchModal';
import { BodegaManager } from '../../components/admin/BodegaManager';
import { ParticipantsManager } from '../../components/admin/ParticipantsManager';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  BarChart3, 
  Eye, 
  Users, 
  TrendingUp, 
  FileText, 
  CheckCircle, 
  X, 
  Save, 
  Wine, 
  ChefHat, 
  Compass, 
  Layers, 
  Sparkles,
  Upload,
  FileUp,
  Loader2,
  Check,
  AlertTriangle,
  Calendar,
  Clock,
  MapPin,
  Globe
} from 'lucide-react';

export const ModoAvanzadoView: React.FC = () => {
  const { activities, participants, metrics, addActivity, updateActivity, deleteActivity } = useData();

  const [activeTab, setActiveTab] = useState<'gestion' | 'participantes' | 'metricas'>('gestion');
  const [selectedParticipantActivityId, setSelectedParticipantActivityId] = useState<string | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'form' | 'participantes'>('form');
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [activityTypeToCreate, setActivityTypeToCreate] = useState<ActivityType>('cata');
  const [notification, setNotification] = useState<string | null>(null);
  const [activityToDelete, setActivityToDelete] = useState<Activity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Activity type filter switches (ON / OFF)
  const [filterTypes, setFilterTypes] = useState<{ cata: boolean; curso: boolean; viaje: boolean }>({
    cata: true,
    curso: true,
    viaje: true
  });

  const toggleTypeFilter = (type: ActivityType) => {
    setFilterTypes(prev => {
      const next = { ...prev, [type]: !prev[type] };
      // Prevent turning all filters off: if user turns off all 3, turn them all on
      if (!next.cata && !next.curso && !next.viaje) {
        return { cata: true, curso: true, viaje: true };
      }
      return next;
    });
  };

  const filteredActivities = activities.filter(act => filterTypes[act.type]);

  // Form State for Advanced Editor
  const [formData, setFormData] = useState<Partial<Activity>>({});
  const [imageUrlsText, setImageUrlsText] = useState<string>('');
  const [syllabusText, setSyllabusText] = useState<string>(''); // For cursos
  const [servicesText, setServicesText] = useState<string>(''); // For viajes

  // Point 1: Two dates
  const [date1, setDate1] = useState<string>('');
  const [date2, setDate2] = useState<string>('');
  const [time1, setTime1] = useState<string>('21:00');
  const [time2, setTime2] = useState<string>('13:00');

  // Specific cata state
  const [cataBodegas, setCataBodegas] = useState<BodegaItem[]>([
    {
      name: 'Bodega Invitada',
      region: 'Castilla-La Mancha',
      website: '',
      wines: [
        { type: 'Blanco', name: '', grape: '', pairing: '' },
        { type: 'Tinto', name: '', grape: '', pairing: '' },
        { type: 'Tinto', name: '', grape: '', pairing: '' },
        { type: 'Espumoso', name: '', grape: '', pairing: '' }
      ]
    }
  ]);
  const [cataSumiller, setCataSumiller] = useState<string>('Ana García');
  const [cataAove, setCataAove] = useState<string>('');
  const [activeBodegaLogoIndex, setActiveBodegaLogoIndex] = useState<number>(0);
  const [activeBodegaWebIndex, setActiveBodegaWebIndex] = useState<number>(0);
  const [isSearchingLogo, setIsSearchingLogo] = useState<boolean>(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState<boolean>(false);
  const [isWebsiteModalOpen, setIsWebsiteModalOpen] = useState<boolean>(false);

  // PDF Upload & Parser state
  const [isParsingPdf, setIsParsingPdf] = useState<boolean>(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState<string | null>(null);
  const [pdfErrorMessage, setPdfErrorMessage] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleDate1Change = (val: string) => {
    setDate1(val);
    setTime1(getDefaultStartTime(val));
  };

  const handleDate2Change = (val: string) => {
    setDate2(val);
    setTime2(getDefaultStartTime(val));
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingPdf(true);
    setPdfErrorMessage(null);
    setPdfSuccessMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/parse-cata", {
        method: "POST",
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

      // Autocomplete form fields with extracted data
      setFormData((prev) => ({
        ...prev,
        type: 'cata',
        title: parsed.title,
        subtitle: parsed.subtitle,
        price: parsed.price || 25.0,
        totalSpots: parsed.spots || 14,
        location: parsed.location || DEFAULT_OFFICIAL_LOCATION,
        description: parsed.description || '', // Marketing description generated by AI
      } as any));

      // Format time strictly to HH:MM
      const formatTime = (t?: string) => {
        if (!t) return '';
        const m = t.match(/(\d{1,2}):(\d{2})/);
        return m ? `${m[1].padStart(2, '0')}:${m[2]}` : '';
      };

      setDate1(parsed.date || '');
      setTime1(formatTime(parsed.time) || (parsed.date ? getDefaultStartTime(parsed.date) : '21:00'));

      if (parsed.date2) {
        setDate2(parsed.date2);
        setTime2(formatTime(parsed.time2) || (parsed.date2 ? getDefaultStartTime(parsed.date2) : '13:00'));
      } else {
        setDate2('');
      }

      // Handle extracted bodegas
      if (parsed.bodegas && Array.isArray(parsed.bodegas) && parsed.bodegas.length > 0) {
        setCataBodegas(parsed.bodegas);
      } else {
        const fallbackName = parsed.bodegaProductor?.name || 'Bodega Invitada';
        setCataBodegas([
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

      setCataSumiller(parsed.sumiller || 'Ana García');
      setCataAove(parsed.aove || '');

      // Point 8: Auto search logo for first bodega
      const firstBodegaName = parsed.bodegas?.[0]?.name || parsed.bodegaProductor?.name;
      if (firstBodegaName) {
        setIsSearchingLogo(true);
        const logo = await searchBodegaLogo(firstBodegaName);
        if (logo) {
          setImageUrlsText(logo);
        }
        setIsSearchingLogo(false);
      }

      const totalWinesCount = (parsed.bodegas || []).reduce((acc: number, b: any) => acc + (b.wines?.length || 0), 0) || parsed.wines?.length || 0;
      setPdfSuccessMessage(`¡Archivo "${file.name}" analizado con IA con éxito! Detectadas ${parsed.bodegas?.length || 1} bodegas, ${totalWinesCount} vinos y sumiller ${parsed.sumiller || 'Ana García'}.`);
    } catch (err: any) {
      console.error('Error procesando PDF/Imagen:', err);
      setPdfErrorMessage(err.message || 'No se pudo extraer el texto. Puedes rellenar los datos manualmente.');
    } finally {
      setIsParsingPdf(false);
      e.target.value = '';
    }
  };

  const handleOpenLogoModalForBodega = (bodegaIndex: number) => {
    setActiveBodegaLogoIndex(bodegaIndex);
    setIsLogoModalOpen(true);
  };

  const handleOpenWebsiteModalForBodega = (bodegaIndex: number) => {
    setActiveBodegaWebIndex(bodegaIndex);
    setIsWebsiteModalOpen(true);
  };

  const startCreate = (type: ActivityType) => {
    setIsCreatingNew(true);
    setActivityTypeToCreate(type);
    setPdfSuccessMessage(null);
    setPdfErrorMessage(null);

    const defaultDate = new Date().toISOString().split('T')[0];
    setDate1(defaultDate);
    setDate2('');
    setTime1(getDefaultStartTime(defaultDate));
    setTime2('13:00');

    // Default bodegas structure
    setCataBodegas([
      {
        name: '',
        region: 'Castilla-La Mancha',
        website: '',
        wines: [
          { type: 'Blanco', name: '', grape: '', pairing: '' },
          { type: 'Tinto', name: '', grape: '', pairing: '' },
          { type: 'Tinto', name: '', grape: '', pairing: '' },
          { type: 'Espumoso', name: '', grape: '', pairing: '' }
        ]
      }
    ]);
    setCataSumiller('Ana García');
    setCataAove('');

    const blank: Partial<Activity> = {
      id: `${type}-${Date.now()}`,
      type: type,
      title: '',
      subtitle: '',
      description: '', // Point 5: empty description
      date: defaultDate,
      time: getDefaultStartTime(defaultDate),
      price: 25.0, // Point 3: 25€ default
      totalSpots: 14, // Point 3: 14 spots default
      bookedSpots: 0,
      status: 'proxima',
      location: DEFAULT_OFFICIAL_LOCATION, // Point 2: Sede oficial
      images: [
        type === 'cata' 
          ? 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1200&q=80'
          : type === 'curso'
          ? 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=80'
          : 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1200&q=80'
      ],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      ...(type === 'cata' ? {
        category: 'vino' as CataCategory,
        bodegaProductor: { name: '', region: 'Castilla-La Mancha' },
        pairingMenu: []
      } : type === 'curso' ? {
        theme: '',
        chef: { name: '', bio: '' },
        syllabus: [],
        includesTasting: true
      } : {
        destination: '',
        durationDays: 2,
        includedServices: [],
        itinerary: []
      })
    };

    setFormData(blank);
    setImageUrlsText(blank.images?.join('\n') || '');
    setSyllabusText('');
    setServicesText('');
    setCataSumiller('Ana García');
    setCataAove('');
    setEditingActivity(blank as Activity);
  };

  const startEdit = (act: Activity) => {
    setIsCreatingNew(false);
    setPdfSuccessMessage(null);
    setPdfErrorMessage(null);
    setFormData(act);
    setDate1(act.date);
    setDate2('');
    setTime1(act.time || '21:00');
    setImageUrlsText(act.images?.join('\n') || '');

    if (act.type === 'cata') {
      const cata = act as CataActivity;
      if (cata.bodegas && cata.bodegas.length > 0) {
        setCataBodegas(cata.bodegas);
      } else {
        // Fallback from legacy structure
        setCataBodegas([
          {
            name: cata.bodegaProductor?.name || 'Bodega Invitada',
            region: cata.bodegaProductor?.region || 'Castilla-La Mancha',
            website: cata.bodegaProductor?.website || '',
            wines: cata.wines && cata.wines.length > 0 ? cata.wines : [
              { type: 'Blanco', name: '', grape: '', pairing: '' },
              { type: 'Tinto', name: '', grape: '', pairing: '' }
            ]
          }
        ]);
      }
      setCataSumiller(cata.sumiller || 'Ana García');
      setCataAove(cata.aove || '');
    } else if (act.type === 'curso') {
      const curso = act as CursoActivity;
      setSyllabusText(curso.syllabus?.join('\n') || '');
    } else if (act.type === 'viaje') {
      const viaje = act as ViajeActivity;
      setServicesText(viaje.includedServices?.join('\n') || '');
    }

    setEditingActivity(act);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !date1) return;

    // Process image URLs
    const images = imageUrlsText
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    // Clean bodegas data
    const cleanedBodegas: BodegaItem[] = cataBodegas.map(b => ({
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

    // Generate pairing menu items from all wines across all bodegas for compatibility
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

    const pairings = allWines.map(w => ({
      dish: w.pairing || 'Degustación',
      pairing: `${w.type} ${w.name}`.trim(),
      notes: w.grape || undefined
    }));

    // Construct primary record
    let finalActivity1: Activity = {
      ...formData,
      date: date1,
      time: time1,
      images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1200&q=80'],
      updatedAt: new Date().toISOString().split('T')[0]
    } as Activity;

    if (finalActivity1.type === 'cata') {
      finalActivity1 = {
        ...finalActivity1,
        bodegas: cleanedBodegas,
        // Legacy fields filled for backwards compatibility
        bodegaProductor: {
          name: cleanedBodegas[0]?.name || 'Bodega Invitada',
          region: cleanedBodegas[0]?.region || 'Castilla-La Mancha',
          website: cleanedBodegas[0]?.website || undefined
        },
        wines: allWines,
        pairingMenu: pairings,
        sumiller: cataSumiller.trim() || 'Ana García',
        aove: cataAove.trim() || undefined,
      } as CataActivity;
    } else if (finalActivity1.type === 'curso') {
      const syllabus = syllabusText
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      finalActivity1 = {
        ...finalActivity1,
        syllabus
      } as CursoActivity;
    } else if (finalActivity1.type === 'viaje') {
      const services = servicesText
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      finalActivity1 = {
        ...finalActivity1,
        includedServices: services
      } as ViajeActivity;
    }

    try {
      if (isCreatingNew) {
        // Point 1: Create 2 records if Date 2 is provided
        const recordsToSave: Activity[] = [
          { ...finalActivity1, id: `${finalActivity1.type}-${Date.now()}-f1` }
        ];

        if (date2 && date2.trim().length > 0) {
          recordsToSave.push({
            ...finalActivity1,
            id: `${finalActivity1.type}-${Date.now()}-f2`,
            date: date2,
            time: time2,
            bookedSpots: 0
          });
        }

        for (const rec of recordsToSave) {
          await addActivity(rec);
        }

        showNotification(recordsToSave.length === 2 
          ? '¡2 convocatorias generadas y sincronizadas con Firestore!' 
          : 'Nueva actividad creada y sincronizada con Firestore.');
      } else {
        await updateActivity(finalActivity1);
        showNotification('Actividad actualizada correctamente en Firestore.');
      }
      setEditingActivity(null);
    } catch (err: any) {
      console.error('Error saving activity:', err);
      alert('Error al guardar en Firestore: ' + err.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest font-bold text-[#521849]">
            Panel de Dirección
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#26201D]">
            Modo Avanzado de Gestión
          </h2>
          <p className="text-xs text-[#574B45] mt-1">
            Control integral del catálogo gastronómico, autocompletado con PDF y analíticas de la asociación.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-create-cata"
            type="button"
            onClick={() => startCreate('cata')}
            className="px-4 py-2.5 rounded-xl bg-[#521849] hover:bg-[#3E1037] text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Cata</span>
          </button>
          <button
            id="btn-create-curso"
            type="button"
            onClick={() => startCreate('curso')}
            className="px-4 py-2.5 rounded-xl border border-[#EDE4D7] bg-white text-[#26201D] hover:bg-[#F6F1EA] text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Curso</span>
          </button>
          <button
            id="btn-create-viaje"
            type="button"
            onClick={() => startCreate('viaje')}
            className="px-4 py-2.5 rounded-xl border border-[#EDE4D7] bg-white text-[#26201D] hover:bg-[#F6F1EA] text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Viaje</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-[#EDE4D7] pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('gestion')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'gestion'
              ? 'bg-[#521849] text-white shadow-xs'
              : 'bg-white text-[#574B45] hover:bg-[#F6F1EA]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Catálogo de Actividades ({activities.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedParticipantActivityId('all');
            setActiveTab('participantes');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'participantes'
              ? 'bg-[#521849] text-white shadow-xs'
              : 'bg-white text-[#574B45] hover:bg-[#F6F1EA]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Asistentes y Reservas ({participants.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('metricas')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'metricas'
              ? 'bg-[#521849] text-white shadow-xs'
              : 'bg-white text-[#574B45] hover:bg-[#F6F1EA]'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Métricas de Visitas y Reservas</span>
        </button>
      </div>

      {/* Tab 1: Gestion */}
      {activeTab === 'gestion' && (
        <div className="space-y-4">
          {/* 3 ON/OFF Filter buttons between catalog tabs and table list */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#EDE4D7] shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#574B45] uppercase tracking-wider mr-1">Filtrar por tipo:</span>
              
              {/* Cata Switch */}
              <button
                type="button"
                onClick={() => toggleTypeFilter('cata')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border ${
                  filterTypes.cata
                    ? 'bg-[#521849] text-white border-[#521849] shadow-xs'
                    : 'bg-[#FCFAF7] text-stone-400 border-stone-200 hover:text-stone-600'
                }`}
                title={filterTypes.cata ? 'Ocultar Catas' : 'Mostrar Catas'}
              >
                <Wine className="w-3.5 h-3.5" />
                <span>Catas</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full uppercase tracking-wider font-extrabold ${
                  filterTypes.cata ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-500'
                }`}>
                  {filterTypes.cata ? 'ON' : 'OFF'}
                </span>
              </button>

              {/* Curso Switch */}
              <button
                type="button"
                onClick={() => toggleTypeFilter('curso')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border ${
                  filterTypes.curso
                    ? 'bg-[#C96043] text-white border-[#C96043] shadow-xs'
                    : 'bg-[#FCFAF7] text-stone-400 border-stone-200 hover:text-stone-600'
                }`}
                title={filterTypes.curso ? 'Ocultar Cursos' : 'Mostrar Cursos'}
              >
                <ChefHat className="w-3.5 h-3.5" />
                <span>Cursos</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full uppercase tracking-wider font-extrabold ${
                  filterTypes.curso ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-500'
                }`}>
                  {filterTypes.curso ? 'ON' : 'OFF'}
                </span>
              </button>

              {/* Viaje Switch */}
              <button
                type="button"
                onClick={() => toggleTypeFilter('viaje')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border ${
                  filterTypes.viaje
                    ? 'bg-[#4D6233] text-white border-[#4D6233] shadow-xs'
                    : 'bg-[#FCFAF7] text-stone-400 border-stone-200 hover:text-stone-600'
                }`}
                title={filterTypes.viaje ? 'Ocultar Viajes' : 'Mostrar Viajes'}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Viajes</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full uppercase tracking-wider font-extrabold ${
                  filterTypes.viaje ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-500'
                }`}>
                  {filterTypes.viaje ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>

            <div className="text-xs text-[#574B45]">
              Mostrando <strong className="text-[#26201D]">{filteredActivities.length}</strong> de <strong className="text-[#26201D]">{activities.length}</strong> actividades
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#EDE4D7] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#FCFAF7] border-b border-[#EDE4D7] text-[#574B45] uppercase tracking-wider font-semibold">
                    <th className="p-4">Tipo</th>
                    <th className="p-4">Título / Actividad</th>
                    <th className="p-4">Fecha y Hora</th>
                    <th className="p-4">Precio</th>
                    <th className="p-4">Aforo / Ocupación</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDE4D7]">
                  {filteredActivities.map((act) => (
                    <tr key={act.id} className="hover:bg-[#FCFAF7] transition-colors">
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold text-[11px] ${
                          act.type === 'cata' 
                            ? 'bg-[#521849]/10 text-[#521849]' 
                            : act.type === 'curso'
                            ? 'bg-[#C96043]/10 text-[#C96043]'
                            : 'bg-[#4D6233]/10 text-[#4D6233]'
                        }`}>
                          {act.type === 'cata' && <Wine className="w-3 h-3" />}
                          {act.type === 'curso' && <ChefHat className="w-3 h-3" />}
                          {act.type === 'viaje' && <Compass className="w-3 h-3" />}
                          <span className="capitalize">{act.type}</span>
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-[#26201D] max-w-xs">
                        <p className="truncate font-serif text-sm">{act.title}</p>
                        <p className="text-[11px] text-[#574B45] truncate font-sans font-normal">{act.subtitle}</p>
                      </td>
                      <td className="p-4 text-[#26201D] font-medium">
                        {act.date} {act.time ? `(${act.time})` : ''}
                      </td>
                      <td className="p-4 font-bold text-[#521849]">
                        {act.price.toFixed(2)} €
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-[#EDE4D7] h-2 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${act.bookedSpots >= act.totalSpots ? 'bg-rose-500' : 'bg-[#521849]'}`} 
                              style={{ width: `${Math.min(100, (act.bookedSpots / act.totalSpots) * 100)}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-[#574B45] font-semibold">
                            {act.bookedSpots}/{act.totalSpots}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          act.status === 'proxima'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-stone-200 text-stone-700'
                        }`}>
                          {act.status === 'proxima' ? 'Próxima' : 'Celebrada'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedParticipantActivityId(act.id);
                            setActiveTab('participantes');
                          }}
                          className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 cursor-pointer"
                          title="Ver y Gestionar Asistentes / Hoja de Sala"
                        >
                          <Users className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveModalTab('form');
                            startEdit(act);
                          }}
                          className="p-1.5 rounded-lg border border-[#EDE4D7] text-[#521849] hover:bg-[#F6EDF4] cursor-pointer"
                          title="Editar actividad completa"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setActivityToDelete(act)}
                          className="p-1.5 rounded-lg border border-[#EDE4D7] text-[#9B3E26] hover:bg-rose-50 cursor-pointer"
                          title="Eliminar actividad"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredActivities.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-[#574B45]">
                        No hay actividades que coincidan con los filtros seleccionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Participantes y Hoja de Sala */}
      {activeTab === 'participantes' && (
        <ParticipantsManager
          initialActivityId={selectedParticipantActivityId}
          onCloseDetailedView={() => {
            setSelectedParticipantActivityId(null);
            setActiveTab('gestion');
          }}
        />
      )}

      {/* Tab 3: Metricas */}
      {activeTab === 'metricas' && (() => {
        const totalCapacity = activities.reduce((acc, a) => acc + (a.totalSpots || 0), 0);
        const totalBooked = activities.reduce((acc, a) => acc + (a.bookedSpots || 0), 0);
        const globalOccupancy = totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0;
        const totalExpectedRevenue = participants.reduce((acc, p) => acc + (p.totalAmount || 0), 0);
        const confirmedReservations = participants.filter(p => p.status === 'confirmada' || p.status === 'asistio').length;

        return (
          <div className="space-y-6">
            {/* Metric Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-[#EDE4D7] space-y-2 shadow-xs">
                <div className="flex items-center justify-between text-[#574B45]">
                  <span className="text-xs font-bold uppercase tracking-wider">Visitas a la Web</span>
                  <Eye className="w-4 h-4 text-[#521849]" />
                </div>
                <p className="text-2xl font-bold font-serif text-[#26201D]">
                  {(metrics?.pageViewsThisMonth || 0).toLocaleString()}
                </p>
                <p className="text-[11px] text-[#4D6233] font-medium flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>{(metrics?.uniqueVisitorsThisMonth || 0).toLocaleString()} visitantes únicos</span>
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#EDE4D7] space-y-2 shadow-xs">
                <div className="flex items-center justify-between text-[#574B45]">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Reservas</span>
                  <Users className="w-4 h-4 text-[#C96043]" />
                </div>
                <p className="text-2xl font-bold font-serif text-[#26201D]">
                  {participants.length} solicitudes
                </p>
                <p className="text-[11px] text-[#574B45]">
                  {confirmedReservations} confirmadas / en sala
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#EDE4D7] space-y-2 shadow-xs">
                <div className="flex items-center justify-between text-[#574B45]">
                  <span className="text-xs font-bold uppercase tracking-wider">Tasa de Ocupación</span>
                  <BarChart3 className="w-4 h-4 text-[#521849]" />
                </div>
                <p className="text-2xl font-bold font-serif text-[#26201D]">
                  {globalOccupancy}%
                </p>
                <p className="text-[11px] text-[#574B45]">
                  {totalBooked} plazas de {totalCapacity} ofertadas
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#EDE4D7] space-y-2 shadow-xs">
                <div className="flex items-center justify-between text-[#574B45]">
                  <span className="text-xs font-bold uppercase tracking-wider">Recaudación Prevista</span>
                  <FileText className="w-4 h-4 text-[#4D6233]" />
                </div>
                <p className="text-2xl font-bold font-serif text-[#4D6233]">
                  {totalExpectedRevenue.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                </p>
                <p className="text-[11px] text-[#574B45]">
                  Calculado de reservas registradas
                </p>
              </div>
            </div>

            {/* Detailed Table: Ocupación por Actividad */}
            <div className="bg-white rounded-3xl border border-[#EDE4D7] overflow-hidden shadow-xs">
              <div className="p-5 border-b border-[#EDE4D7] flex items-center justify-between">
                <div>
                  <h4 className="font-serif font-bold text-base text-[#26201D]">Desglose de Ocupación por Actividad</h4>
                  <p className="text-xs text-[#574B45]">Seguimiento de plazas cubiertas y demanda en tiempo real</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#FCFAF7] border-b border-[#EDE4D7] text-[#574B45] uppercase tracking-wider font-semibold">
                      <th className="p-4">Actividad</th>
                      <th className="p-4">Tipo</th>
                      <th className="p-4">Fecha</th>
                      <th className="p-4">Plazas Ocupadas</th>
                      <th className="p-4">Aforo Máximo</th>
                      <th className="p-4">% Ocupación</th>
                      <th className="p-4">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDE4D7]">
                    {activities.map((act) => {
                      const occupancy = act.totalSpots > 0 ? Math.round((act.bookedSpots / act.totalSpots) * 100) : 0;
                      return (
                        <tr key={act.id} className="hover:bg-[#FCFAF7]">
                          <td className="p-4 font-semibold text-[#26201D]">
                            <p className="font-serif text-sm truncate max-w-xs">{act.title}</p>
                            <p className="text-[11px] text-[#574B45]">{act.subtitle}</p>
                          </td>
                          <td className="p-4 capitalize text-[#574B45]">
                            {act.type}
                          </td>
                          <td className="p-4 text-[#26201D]">
                            {act.date}
                          </td>
                          <td className="p-4 font-bold text-[#521849]">
                            {act.bookedSpots}
                          </td>
                          <td className="p-4 text-[#574B45]">
                            {act.totalSpots}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-[#EDE4D7] h-2 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${occupancy >= 100 ? 'bg-rose-500' : 'bg-[#521849]'}`} 
                                  style={{ width: `${Math.min(100, occupancy)}%` }}
                                />
                              </div>
                              <span className="font-semibold text-[11px] text-[#26201D]">{occupancy}%</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              occupancy >= 100 
                                ? 'bg-rose-100 text-rose-800' 
                                : occupancy >= 75
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {occupancy >= 100 ? 'Completo' : occupancy >= 75 ? 'Últimas plazas' : 'Disponible'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {activities.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-[#574B45]">
                          No hay actividades para mostrar métricas.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* ADVANCED MODAL FORM WITH PDF PARSER */}
      {/* ========================================================================= */}
      {editingActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-[#EDE4D7] my-8 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setEditingActivity(null)}
              className="absolute top-6 right-6 p-1.5 rounded-full text-[#574B45] hover:text-[#26201D] hover:bg-[#F6F1EA]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs uppercase tracking-wider font-bold text-[#521849]">
                    {isCreatingNew ? 'Creación de Nueva Ficha' : 'Edición Avanzada de Ficha'}
                  </span>
                  <h3 className="text-2xl font-bold font-serif text-[#26201D]">
                    {formData.title || `Nueva ficha de ${formData.type}`}
                  </h3>
                </div>
              </div>

              {!isCreatingNew && (
                <div className="flex items-center gap-2 border-b border-[#EDE4D7] pb-3">
                  <button
                    type="button"
                    onClick={() => setActiveModalTab('form')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeModalTab === 'form'
                        ? 'bg-[#521849] text-white shadow-xs'
                        : 'bg-[#FCFAF7] text-[#574B45] hover:bg-[#F6F1EA]'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Ficha y Contenido</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveModalTab('participantes')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeModalTab === 'participantes'
                        ? 'bg-[#521849] text-white shadow-xs'
                        : 'bg-[#FCFAF7] text-[#574B45] hover:bg-[#F6F1EA]'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>
                      Asistentes Registrados ({participants.filter(p => p.activityId === editingActivity.id).length})
                    </span>
                  </button>
                </div>
              )}

              {activeModalTab === 'participantes' && !isCreatingNew ? (
                <div className="pt-2">
                  <ParticipantsManager initialActivityId={editingActivity.id} />
                </div>
              ) : (
                <form onSubmit={handleSaveForm} className="space-y-6">

              {/* PDF Auto-Fill Box for Catas */}
              {formData.type === 'cata' && (
                <div className="p-5 rounded-2xl bg-gradient-to-r from-[#F6EDF4] to-[#FCFAF7] border border-[#521849]/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#521849]">
                      <FileUp className="w-4 h-4 text-[#C96043]" />
                      <span>Autocompletar cartel con Inteligencia Artificial</span>
                    </div>
                    {isParsingPdf && (
                      <div className="flex items-center gap-1.5 text-xs text-[#521849] font-medium">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Analizando con IA...</span>
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-[#574B45]">
                    Sube el cartel en PDF o Imagen. Nuestra IA extraerá automáticamente fechas, pases, bodegas, vinos y maridajes.
                  </p>

                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#521849] hover:bg-[#3E1037] text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Subir PDF / Imagen</span>
                      <input
                        type="file"
                        accept="application/pdf,.pdf,image/*"
                        onChange={handlePdfUpload}
                        className="sr-only"
                        disabled={isParsingPdf}
                      />
                    </label>
                    <span className="text-[11px] text-[#574B45]">o arrastra el archivo aquí</span>
                  </div>

                  {pdfSuccessMessage && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{pdfSuccessMessage}</span>
                    </div>
                  )}

                  {pdfErrorMessage && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                      {pdfErrorMessage}
                    </div>
                  )}
                </div>
              )}

              {/* Core Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#26201D] mb-1">Título de la actividad *</label>
                  <input
                    type="text"
                    required
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs focus:outline-none focus:border-[#521849] focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#26201D] mb-1">Subtítulo explicativo</label>
                  <input
                    type="text"
                    value={formData.subtitle || ''}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs focus:outline-none focus:border-[#521849] focus:bg-white"
                  />
                </div>

                {/* Point 1: Two dates */}
                <div className="p-3.5 rounded-2xl bg-[#FCFAF7] border border-[#EDE4D7] space-y-2">
                  <span className="text-xs font-bold text-[#521849] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#C96043]" />
                    Fecha 1 (Primer Turno) *
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-[#574B45] mb-1">Fecha</label>
                      <input
                        type="date"
                        required
                        value={date1}
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
                        value={time1}
                        onChange={(e) => setTime1(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#EDE4D7] bg-white text-xs font-medium cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FCFAF7] border border-[#EDE4D7] space-y-2">
                  <span className="text-xs font-bold text-[#521849] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#C96043]" />
                    Fecha 2 (Segundo Turno - Opcional)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-[#574B45] mb-1">Fecha</label>
                      <input
                        type="date"
                        value={date2}
                        onChange={(e) => handleDate2Change(e.target.value)}
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
                        value={time2}
                        onChange={(e) => setTime2(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#EDE4D7] bg-white text-xs font-medium cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#26201D] mb-1">Precio (€)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={isNaN(Number(formData.price)) ? '' : formData.price}
                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs font-bold text-[#521849]"
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-bold text-[#521849]">€</span>
                    </div>
                    <span className="text-[10px] text-[#574B45] mt-0.5 block">
                      {(formData.price ?? 25).toFixed(2)} €
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#26201D] mb-1">Aforo Total</label>
                    <input
                      type="number"
                      value={formData.totalSpots ?? 14}
                      onChange={(e) => setFormData({ ...formData, totalSpots: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#26201D] mb-1">Reservadas</label>
                    <input
                      type="number"
                      value={formData.bookedSpots || 0}
                      onChange={(e) => setFormData({ ...formData, bookedSpots: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#26201D] mb-1">Estado de la actividad</label>
                  <select
                    value={formData.status || 'proxima'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs"
                  >
                    <option value="proxima">Próxima Actividad</option>
                    <option value="celebrada">Celebrada (Archivada)</option>
                  </select>
                </div>

                {/* Point 2: Sede oficial */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#26201D] mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#C96043]" />
                    Ubicación física (Sede Oficial)
                  </label>
                  <input
                    type="text"
                    value={formData.location || DEFAULT_OFFICIAL_LOCATION}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs"
                  />
                </div>

                {/* Point 5: Descripción vacía por defecto */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#26201D] mb-1">Descripción detallada (Opcional)</label>
                  <textarea
                    rows={2}
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Dejar vacía o añadir notas personalizadas..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs resize-none"
                  />
                </div>
              </div>

              {/* Specific fields for Catas */}
              {formData.type === 'cata' && (
                <div className="space-y-6">
                  {/* General Cata Info (Sumiller & AOVE) */}
                  <div className="p-5 rounded-2xl bg-[#FBF9F5] border border-[#EDE4D7] space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#521849] border-b border-[#EDE4D7] pb-2">
                      Información General de la Cata
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#26201D] mb-1">Sumiller Guía</label>
                        <input
                          type="text"
                          value={cataSumiller}
                          onChange={(e) => setCataSumiller(e.target.value)}
                          placeholder="Ana García"
                          className="w-full px-3 py-2 rounded-xl border border-[#EDE4D7] bg-white text-xs font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#26201D] mb-1">AOVE de Bienvenida</label>
                        <input
                          type="text"
                          value={cataAove}
                          onChange={(e) => setCataAove(e.target.value)}
                          placeholder="Ej. Quinto Don Otilio (Bolaños de Calatrava) - AOVE Picual"
                          className="w-full px-3 py-2 rounded-xl border border-[#EDE4D7] bg-white text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bodegas and Wines Manager (1 to 4 Bodegas, each with 1 to 4 wines) */}
                  <div className="p-5 rounded-2xl bg-[#FBF9F5] border border-[#EDE4D7]">
                    <BodegaManager
                      bodegas={cataBodegas}
                      onChange={setCataBodegas}
                      onOpenLogoModal={handleOpenLogoModalForBodega}
                      onOpenWebsiteModal={handleOpenWebsiteModalForBodega}
                    />
                  </div>
                </div>
              )}

              {/* Specific fields for Cursos */}
              {formData.type === 'curso' && (
                <div className="p-5 rounded-2xl bg-[#FBF9F5] border border-[#EDE4D7] space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#C96043]">
                    Detalles del Taller / Curso
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#26201D] mb-1">Temática del curso</label>
                      <input
                        type="text"
                        value={(formData as CursoActivity).theme || ''}
                        onChange={(e) => setFormData({ ...formData, theme: e.target.value } as any)}
                        placeholder="Ej. Arroces Tradicionales"
                        className="w-full px-3 py-2 rounded-lg border border-[#EDE4D7] bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#26201D] mb-1">Chef o Maestro Cocinero</label>
                      <input
                        type="text"
                        value={(formData as CursoActivity).chef?.name || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          chef: { ...(formData as CursoActivity).chef, name: e.target.value, bio: (formData as CursoActivity).chef?.bio || '' }
                        } as any)}
                        placeholder="Ej. Chef Invitado"
                        className="w-full px-3 py-2 rounded-lg border border-[#EDE4D7] bg-white text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#26201D] mb-1">
                      Temario / Programa (un punto por línea)
                    </label>
                    <textarea
                      rows={3}
                      value={syllabusText}
                      onChange={(e) => setSyllabusText(e.target.value)}
                      placeholder="Técnicas de sofrito&#10;Punto de cocción&#10;Emplatado y maridaje"
                      className="w-full px-3 py-2 rounded-lg border border-[#EDE4D7] bg-white text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Point 8: URLs de Imágenes / Logotipo */}
              <div>
                <label className="block text-xs font-semibold text-[#26201D] mb-1">
                  Logo / Imagen de Portada (URL)
                </label>
                <textarea
                  rows={2}
                  value={imageUrlsText}
                  onChange={(e) => setImageUrlsText(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs font-mono"
                />
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-[#EDE4D7] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingActivity(null)}
                  className="px-4 py-2.5 rounded-xl border border-[#EDE4D7] text-xs font-medium text-[#574B45] hover:bg-[#F6F1EA] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#521849] hover:bg-[#3E1037] text-white text-xs font-semibold tracking-wide transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isCreatingNew && date2 ? 'Guardar Ficha (Generar 2 Convocatorias en Firestore)' : 'Guardar Ficha en Firestore'}</span>
                </button>
              </div>
                </form>
              )}
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
                    showNotification('Actividad eliminada definitivamente de Firestore.');
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
          bodegaName={cataBodegas[activeBodegaLogoIndex]?.name || (formData as CataActivity).bodegaProductor?.name || formData.title || ''}
          currentImageUrl={(formData.images && formData.images[0]) || ''}
          onSelectImage={(url) => {
            setFormData(prev => ({
              ...prev,
              images: [url]
            }));
            setImageUrlsText(url);
          }}
        />
      )}

      {/* Bodega Official Website Search Modal */}
      {isWebsiteModalOpen && (
        <BodegaWebsiteSearchModal
          isOpen={isWebsiteModalOpen}
          onClose={() => setIsWebsiteModalOpen(false)}
          bodegaName={cataBodegas[activeBodegaWebIndex]?.name || ''}
          currentWebsite={cataBodegas[activeBodegaWebIndex]?.website || ''}
          onSelectWebsite={(url) => {
            const updated = [...cataBodegas];
            if (updated[activeBodegaWebIndex]) {
              updated[activeBodegaWebIndex] = {
                ...updated[activeBodegaWebIndex],
                website: url
              };
              setCataBodegas(updated);
            }
          }}
        />
      )}
    </div>
  );
};
