import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Activity, ActivityType, CataActivity, CataCategory, CursoActivity, ViajeActivity, WineDetail } from '../../types';
import { extractTextFromPdf, parseCataText, DEFAULT_OFFICIAL_LOCATION, getDefaultStartTime } from '../../services/pdfCataParser';
import { searchBodegaLogo } from '../../services/bodegaLogoService';
import { BodegaLogoSearchModal } from '../../components/admin/BodegaLogoSearchModal';
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
  const { activities, metrics, addActivity, updateActivity, deleteActivity } = useData();

  const [activeTab, setActiveTab] = useState<'gestion' | 'metricas'>('gestion');
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [activityTypeToCreate, setActivityTypeToCreate] = useState<ActivityType>('cata');
  const [notification, setNotification] = useState<string | null>(null);
  const [activityToDelete, setActivityToDelete] = useState<Activity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
  const [cataWines, setCataWines] = useState<WineDetail[]>([
    { type: 'Blanco', name: '', grape: '', pairing: '' },
    { type: 'Tinto', name: '', grape: '', pairing: '' },
    { type: 'Tinto', name: '', grape: '', pairing: '' },
    { type: 'Espumoso', name: '', grape: '', pairing: '' }
  ]);
  const [cataSumiller, setCataSumiller] = useState<string>('Ana García');
  const [cataAove, setCataAove] = useState<string>('');
  const [cataColaboradores, setCataColaboradores] = useState<string>('');
  const [cataType, setCataType] = useState<'bodega_unica' | 'varias_bodegas'>('bodega_unica');
  const [tallerEspecial, setTallerEspecial] = useState<string>('');
  const [isSearchingLogo, setIsSearchingLogo] = useState<boolean>(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState<boolean>(false);

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

  const updateWineField = (index: number, field: keyof WineDetail, val: string) => {
    setCataWines(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const addWineRow = () => {
    if (cataWines.length < 6) {
      setCataWines(prev => [...prev, { type: 'Vino', name: '', grape: '', pairing: '' }]);
    }
  };

  const removeWineRow = (index: number) => {
    if (cataWines.length > 1) {
      setCataWines(prev => prev.filter((_, i) => i !== index));
    }
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
        throw new Error("El servidor no devolvió una respuesta válida (posible error de conexión o archivo demasiado grande).");
      }

      if (!response.ok) {
        let errorMessage = "Error procesando el archivo con IA";
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // Ignore
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
        description: '', // Point 5: empty description by default
        bodegaProductor: {
          name: parsed.bodegaProductor?.name || parsed.bodegaName,
          region: parsed.bodegaProductor?.region || parsed.bodegaRegion || 'Castilla-La Mancha',
          colaboradores: parsed.bodegaProductor?.colaboradores || parsed.colaboradores
        }
      } as any));

      setDate1(parsed.date || '');
      setTime1(parsed.time || '');

      if (parsed.date2) {
        setDate2(parsed.date2);
        setTime2(parsed.time2 || getDefaultStartTime(parsed.date2));
      } else {
        setDate2('');
      }

      if (parsed.wines && parsed.wines.length > 0) {
        setCataWines(parsed.wines);
      } else {
        setCataWines([]);
      }
      setCataSumiller(parsed.sumiller || 'Ana García');
      setCataAove(parsed.aove || '');
      setCataColaboradores(parsed.colaboradores || '');
      setCataType(parsed.cataType || 'bodega_unica');
      setTallerEspecial(parsed.tallerEspecial || '');

      // Point 8: Auto search bodega logo
      const bodegaName = parsed.bodegaProductor?.name || parsed.bodegaName;
      if (bodegaName) {
        setIsSearchingLogo(true);
        const logo = await searchBodegaLogo(bodegaName);
        if (logo) {
          setImageUrlsText(logo);
        }
        setIsSearchingLogo(false);
      }

      setPdfSuccessMessage(`¡Archivo "${file.name}" analizado con IA con éxito! Detectados ${parsed.wines?.length || 0} vinos y sumiller ${parsed.sumiller || 'Ana García'}.`);
    } catch (err: any) {
      console.error('Error procesando PDF/Imagen:', err);
      setPdfErrorMessage(err.message || 'No se pudo extraer el texto. Puedes rellenar los datos manualmente.');
    } finally {
      setIsParsingPdf(false);
      e.target.value = '';
    }
  };

  const handleManualSearchLogo = async () => {
    const bodegaName = (formData as CataActivity).bodegaProductor?.name;
    if (!bodegaName) return;
    setIsSearchingLogo(true);
    try {
      const logo = await searchBodegaLogo(bodegaName);
      if (logo) {
        setImageUrlsText(logo);
      }
    } finally {
      setIsSearchingLogo(false);
    }
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
    setCataWines([
      { type: 'Blanco', name: '', grape: '', pairing: '' },
      { type: 'Tinto', name: '', grape: '', pairing: '' },
      { type: 'Tinto', name: '', grape: '', pairing: '' },
      { type: 'Espumoso', name: '', grape: '', pairing: '' }
    ]);
    setCataSumiller('Ana García');
    setCataAove('');
    setCataColaboradores('');
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
      setCataWines(cata.wines && cata.wines.length > 0 ? cata.wines : [
        { type: 'Blanco', name: '', grape: '', pairing: '' },
        { type: 'Tinto', name: '', grape: '', pairing: '' },
        { type: 'Tinto', name: '', grape: '', pairing: '' },
        { type: 'Espumoso', name: '', grape: '', pairing: '' }
      ]);
      setCataSumiller(cata.sumiller || 'Ana García');
      setCataAove(cata.aove || '');
      setCataColaboradores(cata.bodegaProductor?.colaboradores || '');
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

    const cleanedWines = cataWines.filter(w => w.name.trim() || w.pairing?.trim());
    const pairings = cleanedWines.map(w => ({
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
        pairingMenu: pairings,
        wines: cleanedWines.length > 0 ? cleanedWines : undefined,
        sumiller: cataSumiller.trim() || 'Ana García',
        aove: cataAove.trim() || undefined,
        cataType: cataType,
        tallerEspecial: tallerEspecial.trim() || undefined,
        bodegaProductor: {
          ...((finalActivity1 as CataActivity).bodegaProductor || { name: 'Bodega', region: 'Castilla-La Mancha' }),
          colaboradores: cataColaboradores.trim() || undefined
        }
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
      <div className="flex items-center gap-3 border-b border-[#EDE4D7] pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('gestion')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
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
          onClick={() => setActiveTab('metricas')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
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
        <div className="space-y-6">
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
                  {activities.map((act) => (
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
                          onClick={() => startEdit(act)}
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
                  {activities.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-[#574B45]">
                        No hay actividades registradas en la base de datos todavía. Pulsa en <strong>"Nueva Cata"</strong> para comenzar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Metricas */}
      {activeTab === 'metricas' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-[#EDE4D7] space-y-2">
            <div className="flex items-center justify-between text-[#574B45]">
              <span className="text-xs font-bold uppercase tracking-wider">Visitas a la Web</span>
              <Eye className="w-4 h-4 text-[#521849]" />
            </div>
            <p className="text-3xl font-bold font-serif text-[#26201D]">
              {metrics.totalVisitors.toLocaleString()}
            </p>
            <p className="text-[11px] text-[#4D6233] font-medium flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>Conteo en tiempo real</span>
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-[#EDE4D7] space-y-2">
            <div className="flex items-center justify-between text-[#574B45]">
              <span className="text-xs font-bold uppercase tracking-wider">Total Reservas Solicitadas</span>
              <Users className="w-4 h-4 text-[#C96043]" />
            </div>
            <p className="text-3xl font-bold font-serif text-[#26201D]">
              {metrics.totalBookings.toLocaleString()}
            </p>
            <p className="text-[11px] text-[#574B45]">
              En todas las actividades
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-[#EDE4D7] space-y-2">
            <div className="flex items-center justify-between text-[#574B45]">
              <span className="text-xs font-bold uppercase tracking-wider">Descargas de Catálogos / PDF</span>
              <FileText className="w-4 h-4 text-[#4D6233]" />
            </div>
            <p className="text-3xl font-bold font-serif text-[#26201D]">
              {metrics.catalogDownloads.toLocaleString()}
            </p>
            <p className="text-[11px] text-[#574B45]">
              Fichas y programas descargados
            </p>
          </div>
        </div>
      )}

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

            <form onSubmit={handleSaveForm} className="space-y-6">
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
                      <label className="block text-[11px] text-[#574B45] mb-1">Fecha (AAAA-MM-DD)</label>
                      <input
                        type="text"
                        required
                        value={date1}
                        onChange={(e) => handleDate1Change(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#EDE4D7] bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#574B45] mb-1">Hora Inicio</label>
                      <input
                        type="text"
                        value={time1}
                        onChange={(e) => setTime1(e.target.value)}
                        placeholder="21:00 / 13:00"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#EDE4D7] bg-white text-xs"
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
                      <label className="block text-[11px] text-[#574B45] mb-1">Fecha (AAAA-MM-DD)</label>
                      <input
                        type="text"
                        value={date2}
                        onChange={(e) => handleDate2Change(e.target.value)}
                        placeholder="2026-04-17"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#EDE4D7] bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#574B45] mb-1">Hora Inicio</label>
                      <input
                        type="text"
                        value={time2}
                        onChange={(e) => setTime2(e.target.value)}
                        placeholder="13:00"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#EDE4D7] bg-white text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#26201D] mb-1">Precio (€)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.price ?? 25.0}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs font-bold text-[#521849]"
                    />
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs"
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
                <div className="p-5 rounded-2xl bg-[#FBF9F5] border border-[#EDE4D7] space-y-5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#521849]">
                    Detalles Enológicos y Bodega
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#26201D] mb-1">Bodega / Productor</label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={(formData as CataActivity).bodegaProductor?.name || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            bodegaProductor: {
                              ...(formData as CataActivity).bodegaProductor,
                              name: e.target.value,
                              region: (formData as CataActivity).bodegaProductor?.region || 'Castilla-La Mancha'
                            }
                          } as any)}
                          placeholder="Ej. Bodega Paco Mulero"
                          className="w-full px-3 py-2 rounded-lg border border-[#EDE4D7] bg-white text-xs font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setIsLogoModalOpen(true)}
                          title="Buscar logotipo en Google Imágenes"
                          className="px-3 py-2 rounded-lg bg-gradient-to-r from-[#521849] to-[#C96043] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs hover:opacity-90 cursor-pointer whitespace-nowrap"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>Buscar Logo</span>
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#26201D] mb-1">Localidad / Región</label>
                      <input
                        type="text"
                        value={(formData as CataActivity).bodegaProductor?.region || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          bodegaProductor: {
                            ...(formData as CataActivity).bodegaProductor,
                            name: (formData as CataActivity).bodegaProductor?.name || '',
                            region: e.target.value
                          }
                        } as any)}
                        placeholder="Ej. Carrión de Calatrava – Ciudad Real"
                        className="w-full px-3 py-2 rounded-lg border border-[#EDE4D7] bg-white text-xs"
                      />
                    </div>

                    {/* Point 6: Sumiller */}
                    <div>
                      <label className="block text-xs font-semibold text-[#26201D] mb-1">Sumiller Guía</label>
                      <input
                        type="text"
                        value={cataSumiller}
                        onChange={(e) => setCataSumiller(e.target.value)}
                        placeholder="Ana García"
                        className="w-full px-3 py-2 rounded-lg border border-[#EDE4D7] bg-white text-xs font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#26201D] mb-1">Colaboración / Bodegueros</label>
                      <input
                        type="text"
                        value={cataColaboradores}
                        onChange={(e) => setCataColaboradores(e.target.value)}
                        placeholder="Ej. Eva Imedio y Venancio Castillo"
                        className="w-full px-3 py-2 rounded-lg border border-[#EDE4D7] bg-white text-xs"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-[#26201D] mb-1">AOVE de Bienvenida</label>
                      <input
                        type="text"
                        value={cataAove}
                        onChange={(e) => setCataAove(e.target.value)}
                        placeholder="Ej. Quinto Don Otilio (Bolaños de Calatrava) - AOVE Picual"
                        className="w-full px-3 py-2 rounded-lg border border-[#EDE4D7] bg-white text-xs"
                      />
                    </div>
                  </div>

                  {/* Point 7: Modular Wine and Pairing Cards (3 to 4 wines) */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-[#521849] uppercase tracking-wider">
                        Vinos y Maridajes Individuales ({cataWines.length} vinos):
                      </label>
                      <button
                        type="button"
                        onClick={addWineRow}
                        className="text-xs font-semibold text-[#521849] hover:text-[#3E1037] flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Añadir Vino</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {cataWines.map((wine, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-white border border-[#EDE4D7] space-y-2.5 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-[#521849] bg-[#521849]/10 px-2 py-0.5 rounded-md">
                              Vino #{idx + 1}
                            </span>
                            {cataWines.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeWineRow(idx)}
                                className="text-[#9B3E26] hover:text-rose-700 p-1 cursor-pointer"
                                title="Eliminar este vino"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="block text-[10px] text-[#574B45] mb-0.5">Tipo</label>
                              <input
                                type="text"
                                value={wine.type}
                                onChange={(e) => updateWineField(idx, 'type', e.target.value)}
                                placeholder="Blanco, Tinto..."
                                className="w-full px-2 py-1 rounded border border-[#EDE4D7] text-xs"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="block text-[10px] text-[#574B45] mb-0.5">Nombre del Vino</label>
                              <input
                                type="text"
                                value={wine.name}
                                onChange={(e) => updateWineField(idx, 'name', e.target.value)}
                                placeholder="Ej. El Jalbegandero"
                                className="w-full px-2 py-1 rounded border border-[#EDE4D7] text-xs font-semibold"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] text-[#574B45] mb-0.5">Variedad / Uva</label>
                              <input
                                type="text"
                                value={wine.grape || ''}
                                onChange={(e) => updateWineField(idx, 'grape', e.target.value)}
                                placeholder="Ej. 100% Airén"
                                className="w-full px-2 py-1 rounded border border-[#EDE4D7] text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-[#574B45] mb-0.5 text-[#C96043] font-semibold">Maridaje Propuesto</label>
                              <input
                                type="text"
                                value={wine.pairing || ''}
                                onChange={(e) => updateWineField(idx, 'pairing', e.target.value)}
                                placeholder="Ej. Arroz Meloso con Verduritas"
                                className="w-full px-2 py-1 rounded border border-[#EDE4D7] text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
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
          bodegaName={(formData as CataActivity).bodegaProductor?.name || formData.title || ''}
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
    </div>
  );
};
