import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Activity, ActivityType, CataActivity, WineDetail } from '../../types';
import { extractTextFromPdf, parseCataText, DEFAULT_OFFICIAL_LOCATION, getDefaultStartTime } from '../../services/pdfCataParser';
import { searchBodegaLogo } from '../../services/bodegaLogoService';
import { BodegaLogoSearchModal } from '../../components/admin/BodegaLogoSearchModal';
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
  Wine,
  Clock,
  MapPin,
  Globe
} from 'lucide-react';

export const ModoSencilloView: React.FC = () => {
  const { activities, addActivity, quickUpdateActivity, deleteActivity } = useData();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);
  const [activityToDelete, setActivityToDelete] = useState<Activity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Simplified creation form state
  const [newType, setNewType] = useState<ActivityType>('cata');
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newDate1, setNewDate1] = useState('');
  const [newDate2, setNewDate2] = useState('');
  const [newTime1, setNewTime1] = useState('21:00');
  const [newTime2, setNewTime2] = useState('13:00');
  const [newPrice, setNewPrice] = useState(25.0); // Default 25.00€
  const [newSpots, setNewSpots] = useState(14); // Default 14
  const [newLocation, setNewLocation] = useState(DEFAULT_OFFICIAL_LOCATION);
  const [newBodega, setNewBodega] = useState('Bodega Invitada');
  const [newBodegaRegion, setNewBodegaRegion] = useState('Castilla-La Mancha');
  const [newSumiller, setNewSumiller] = useState('Ana García');
  const [newAove, setNewAove] = useState('');
  const [newColaboradores, setNewColaboradores] = useState('');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1200&q=80');
  const [isSearchingLogo, setIsSearchingLogo] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);

  // Individual editable wine cards (3 wines by default, expandable with "Añadir Vino")
  const [winesList, setWinesList] = useState<WineDetail[]>([
    { type: 'Blanco', name: '', grape: '', pairing: '' },
    { type: 'Tinto', name: '', grape: '', pairing: '' },
    { type: 'Espumoso', name: '', grape: '', pairing: '' }
  ]);

  // PDF state
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState<string | null>(null);
  
  // New States for Cata properties
  const [cataType, setCataType] = useState<'bodega_unica' | 'varias_bodegas'>('bodega_unica');
  const [tallerEspecial, setTallerEspecial] = useState<string>('');

  // Editing state for quick in-line updates
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editDate, setEditDate] = useState<string>('');
  const [editSpots, setEditSpots] = useState<number>(0);

  const upcoming = activities.filter(a => a.status === 'proxima');
  const held = activities.filter(a => a.status === 'celebrada');

  const updateWineField = (index: number, field: keyof WineDetail, value: string) => {
    setWinesList(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const addWineRow = () => {
    if (winesList.length < 6) {
      setWinesList(prev => [...prev, { type: 'Vino', name: '', grape: '', pairing: '' }]);
    }
  };

  const removeWineRow = (index: number) => {
    if (winesList.length > 1) {
      setWinesList(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleDate1Change = (dateVal: string) => {
    setNewDate1(dateVal);
    setNewTime1(getDefaultStartTime(dateVal));
  };

  const handleDate2Change = (dateVal: string) => {
    setNewDate2(dateVal);
    setNewTime2(getDefaultStartTime(dateVal));
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingPdf(true);
    setPdfSuccess(null);

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

      setNewTitle(parsed.title || '');
      
      // If there are multiple dates, we might need to parse them from the text, but the schema has date and time.
      // If we only get one date from AI schema, we use it for Date 1.
      setNewDate1(parsed.date || '');
      setNewTime1(parsed.time || '');

      // In case we want to support 2 dates again we'd need to extract them from raw text if they aren't parsed explicitly,
      // but for now let's leave Date 2 blank and let the user fill it.
      setNewDate2('');
      setNewTime2('');

      setNewPrice(parsed.price || 25.0);
      setNewSpots(parsed.spots || 14);
      setNewLocation(parsed.location || DEFAULT_OFFICIAL_LOCATION);
      
      setNewBodega(parsed.bodegaProductor?.name || 'Bodega Invitada');
      setNewBodegaRegion(parsed.bodegaProductor?.region || 'Castilla-La Mancha');
      setNewColaboradores(parsed.bodegaProductor?.colaboradores || '');
      
      setNewSumiller(parsed.sumiller || 'Ana García');
      setNewAove(parsed.aove || '');
      setCataType(parsed.cataType || 'bodega_unica');
      setTallerEspecial(parsed.tallerEspecial || '');

      if (parsed.wines && parsed.wines.length > 0) {
        setWinesList(parsed.wines);
      } else {
        setWinesList([]);
      }

      // Point 8: Auto search bodega logo
      if (parsed.bodegaProductor?.name) {
        setIsSearchingLogo(true);
        const logo = await searchBodegaLogo(parsed.bodegaProductor.name);
        if (logo) {
          setImageUrl(logo);
        }
        setIsSearchingLogo(false);
      }

      setPdfSuccess(`¡Archivo "${file.name}" analizado con IA con éxito! Detectados ${parsed.wines?.length || 0} vinos y sumiller ${parsed.sumiller || 'Ana García'}.`);
    } catch (err) {
      console.error('Error procesando PDF/Imagen:', err);
      alert('Error: ' + (err as Error).message);
    } finally {
      setIsParsingPdf(false);
      e.target.value = '';
    }
  };

  const handleManualSearchLogo = async () => {
    if (!newBodega) return;
    setIsSearchingLogo(true);
    try {
      const logo = await searchBodegaLogo(newBodega);
      if (logo) {
        setImageUrl(logo);
      }
    } finally {
      setIsSearchingLogo(false);
    }
  };

  const handleCreateSimple = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDate1) return;

    const cleanedWines = winesList.filter(w => w.name.trim() || w.pairing?.trim());
    const pairingMenu = cleanedWines.map(w => ({
      dish: w.pairing || 'Degustación',
      pairing: `${w.type} ${w.name}`.trim(),
      notes: w.grape || undefined
    }));

    // Point 1: Create 2 records if Date 2 is provided, or 1 record for Date 1
    const recordsToCreate: Activity[] = [];

    // Record 1 (Fecha 1)
    const baseRecord1: Activity = {
      id: `${newType}-${Date.now()}-f1`,
      type: newType,
      title: newTitle,
      subtitle: newSubtitle || (newBodega ? `Con ${newBodega}` : `Convocatoria de ${newType}`),
      description: '', // Point 5: empty description by default
      date: newDate1,
      time: newTime1,
      price: Number(newPrice),
      totalSpots: Number(newSpots),
      bookedSpots: 0,
      status: 'proxima',
      location: newLocation,
      images: [imageUrl],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      ...(newType === 'cata' ? {
        category: 'vino',
        cataType: cataType,
        tallerEspecial: tallerEspecial || undefined,
        bodegaProductor: { 
          name: newBodega, 
          region: newBodegaRegion,
          colaboradores: newColaboradores || undefined
        },
        sumiller: newSumiller || 'Ana García',
        aove: newAove || undefined,
        wines: cleanedWines.length > 0 ? cleanedWines : undefined,
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

    recordsToCreate.push(baseRecord1);

    // Record 2 (Fecha 2, if specified)
    if (newDate2 && newDate2.trim().length > 0) {
      const baseRecord2: Activity = {
        ...baseRecord1,
        id: `${newType}-${Date.now()}-f2`,
        date: newDate2,
        time: newTime2,
        bookedSpots: 0,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0]
      };
      recordsToCreate.push(baseRecord2);
    }

    for (const record of recordsToCreate) {
      await addActivity(record);
    }

    setSavedSuccess(`¡${recordsToCreate.length === 2 ? '2 convocatorias generadas (Fecha 1 y Fecha 2)' : 'Convocatoria generada'} con éxito en Firestore!`);
    setShowCreateForm(false);
    setTimeout(() => setSavedSuccess(null), 4000);
  };

  const startEdit = (act: Activity) => {
    setEditingId(act.id);
    setEditPrice(act.price);
    setEditDate(act.date);
    setEditSpots(act.totalSpots);
  };

  const saveEdit = async (id: string) => {
    await quickUpdateActivity(id, {
      price: editPrice,
      date: editDate,
      totalSpots: editSpots
    });
    setEditingId(null);
  };

  const toggleStatus = async (act: Activity) => {
    const nextStatus = act.status === 'proxima' ? 'celebrada' : 'proxima';
    await quickUpdateActivity(act.id, {
      status: nextStatus
    });
  };

  const totalUpcomingSpots = upcoming.reduce((acc, a) => acc + a.totalSpots, 0);
  const totalBookedSpots = upcoming.reduce((acc, a) => acc + a.bookedSpots, 0);

  return (
    <div className="space-y-8">
      {/* Header and Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest font-bold text-[#C96043]">
            Operación Rápida
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#26201D]">
            Modo Sencillo
          </h2>
          <p className="text-xs text-[#574B45] mt-1">
            Gestión simplificada del día a día, control de aforo y altas con PDF (2 convocatorias automáticas, 25€ / 14 plazas).
          </p>
        </div>

        <button
          id="btn-simple-create-toggle"
          type="button"
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2.5 rounded-xl bg-[#521849] hover:bg-[#3E1037] text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{showCreateForm ? 'Cerrar Formulario' : 'Crear Nueva Actividad'}</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{savedSuccess}</span>
        </div>
      )}

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

              {/* Point 1: Fechas 1 y 2 */}
              <div className="p-3.5 rounded-2xl bg-[#FCFAF7] border border-[#EDE4D7] sm:col-span-2 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#521849] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#C96043]" />
                    Fecha 1 (Primer Turno / Registro 1) *
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-[#574B45] mb-1">Fecha (AAAA-MM-DD)</label>
                    <input
                      type="text"
                      required
                      value={newDate1}
                      onChange={(e) => handleDate1Change(e.target.value)}
                      placeholder="2026-04-10"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#EDE4D7] bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#574B45] mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#521849]" />
                      Hora Inicio
                    </label>
                    <input
                      type="text"
                      value={newTime1}
                      onChange={(e) => setNewTime1(e.target.value)}
                      placeholder="21:00 (Viernes) / 13:00 (Domingo)"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#EDE4D7] bg-white text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FCFAF7] border border-[#EDE4D7] sm:col-span-2 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#521849] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#C96043]" />
                    Fecha 2 (Segundo Turno / Registro 2 - Opcional)
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-[#574B45] mb-1">Fecha (AAAA-MM-DD)</label>
                    <input
                      type="text"
                      value={newDate2}
                      onChange={(e) => handleDate2Change(e.target.value)}
                      placeholder="2026-04-17 (Opcional)"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#EDE4D7] bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#574B45] mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#521849]" />
                      Hora Inicio
                    </label>
                    <input
                      type="text"
                      value={newTime2}
                      onChange={(e) => setNewTime2(e.target.value)}
                      placeholder="13:00"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#EDE4D7] bg-white text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Point 3: Default 25€ & 14 spots */}
              <div>
                <label className="block text-xs font-semibold text-[#26201D] mb-1">Precio por Persona (€)</label>
                <input
                  type="number"
                  step="0.5"
                  value={newPrice}
                  onChange={(e) => setNewPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs font-bold text-[#521849]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#26201D] mb-1">Aforo Máximo (Plazas)</label>
                <input
                  type="number"
                  value={newSpots}
                  onChange={(e) => setNewSpots(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs font-bold text-[#26201D]"
                />
              </div>

              {/* Point 6: Sumiller */}
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

              {/* Bodega & Region */}
              <div>
                <label className="block text-xs font-semibold text-[#26201D] mb-1">Bodega Invitada</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={newBodega}
                    onChange={(e) => setNewBodega(e.target.value)}
                    placeholder="Bodega La Uveja Negra"
                    className="w-full px-3 py-2 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs font-semibold text-[#521849]"
                  />
                  <button
                    type="button"
                    onClick={() => setIsLogoModalOpen(true)}
                    title="Buscar logotipo en internet y Google Imágenes"
                    className="px-3 py-2 rounded-xl bg-gradient-to-r from-[#521849] to-[#C96043] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs hover:opacity-90 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Buscar Logo</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#26201D] mb-1">Región / Procedencia</label>
                <input
                  type="text"
                  value={newBodegaRegion}
                  onChange={(e) => setNewBodegaRegion(e.target.value)}
                  placeholder="Carrión de Calatrava - Ciudad Real"
                  className="w-full px-3 py-2 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#26201D] mb-1">Especial Colaboración</label>
                <input
                  type="text"
                  value={newColaboradores}
                  onChange={(e) => setNewColaboradores(e.target.value)}
                  placeholder="Eva Imedio y Venancio Castillo"
                  className="w-full px-3 py-2 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#26201D] mb-1">AOVE / Aceite Maridaje</label>
                <input
                  type="text"
                  value={newAove}
                  onChange={(e) => setNewAove(e.target.value)}
                  placeholder="Quinto Don Otilio - AOVE Picual"
                  className="w-full px-3 py-2 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs"
                />
              </div>

              {/* Point 2: Sede oficial location */}
              <div className="sm:col-span-2 lg:col-span-4">
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
            </div>

            {/* Point 7: Modular Wine and Pairing Cards */}
            {newType === 'cata' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-[#FBF9F5] border border-[#EDE4D7] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wine className="w-4 h-4 text-[#521849]" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#521849]">
                      Vinos y Maridajes de la Cata ({winesList.length} vinos configurados)
                    </h4>
                  </div>
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
                  {winesList.map((wine, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-white border border-[#EDE4D7] space-y-2.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#521849] bg-[#521849]/10 px-2 py-0.5 rounded-md">
                          Vino #{idx + 1}
                        </span>
                        {winesList.length > 1 && (
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

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2.5 rounded-xl border border-[#EDE4D7] text-xs font-semibold text-[#574B45] hover:bg-[#F6F1EA] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#521849] hover:bg-[#3E1037] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                {newDate2 ? 'Guardar Ficha (Generar 2 Convocatorias en BD)' : 'Guardar Ficha en BD'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#EDE4D7] space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#574B45]">
            Próximas Actividades
          </span>
          <p className="text-2xl font-bold font-serif text-[#521849]">
            {upcoming.length}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#EDE4D7] space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#574B45]">
            Plazas Ocupadas / Totales
          </span>
          <p className="text-2xl font-bold font-serif text-[#26201D]">
            {totalBookedSpots} / {totalUpcomingSpots}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#EDE4D7] space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#574B45]">
            Actividades Pasadas
          </span>
          <p className="text-2xl font-bold font-serif text-[#4D6233]">
            {held.length}
          </p>
        </div>
      </div>

      {/* List of Upcoming Activities */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#26201D]">
          Actividades Programadas ({upcoming.length})
        </h3>

        <div className="grid grid-cols-1 gap-3">
          {upcoming.map((act) => {
            const isEditing = editingId === act.id;
            return (
              <div
                key={act.id}
                className="p-5 rounded-2xl bg-white border border-[#EDE4D7] hover:border-[#DFD3C2] transition-all space-y-4 shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-[#521849]/10 text-[#521849]">
                      {act.type}
                    </span>
                    <h4 className="text-base font-bold font-serif text-[#26201D] mt-1">
                      {act.title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
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
                        {act.date} {act.time ? `(${act.time})` : ''}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-[#574B45] block">Precio:</span>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editPrice}
                        onChange={(e) => setEditPrice(Number(e.target.value))}
                        className="w-full px-2 py-1 rounded border border-[#EDE4D7] text-xs font-bold"
                      />
                    ) : (
                      <span className="font-bold text-[#521849] flex items-center gap-1">
                        <Euro className="w-3.5 h-3.5" />
                        {act.price.toFixed(2)} €
                      </span>
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
                    <span className={`font-bold ${act.bookedSpots >= act.totalSpots ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {act.bookedSpots} / {act.totalSpots} ({act.totalSpots - act.bookedSpots} libres)
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

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
          bodegaName={newBodega || newTitle || ''}
          currentImageUrl={imageUrl || ''}
          onSelectImage={(url) => setImageUrl(url)}
        />
      )}
    </div>
  );
};
