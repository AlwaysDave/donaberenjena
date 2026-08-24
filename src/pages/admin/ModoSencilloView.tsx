import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Activity, ActivityType, CataActivity, WineDetail, BodegaItem } from '../../types';
import { extractTextFromPdf, parseCataText, DEFAULT_OFFICIAL_LOCATION, getDefaultStartTime } from '../../services/pdfCataParser';
import { searchBodegaLogo } from '../../services/bodegaLogoService';
import { BodegaLogoSearchModal } from '../../components/admin/BodegaLogoSearchModal';
import { BodegaWebsiteSearchModal } from '../../components/admin/BodegaWebsiteSearchModal';
import { BodegaManager } from '../../components/admin/BodegaManager';
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
  const [newDescription, setNewDescription] = useState('');
  const [newDate1, setNewDate1] = useState('');
  const [newDate2, setNewDate2] = useState('');
  const [newTime1, setNewTime1] = useState('21:00');
  const [newTime2, setNewTime2] = useState('13:00');
  const [newPrice, setNewPrice] = useState(25.0); // Default 25.00€
  const [newSpots, setNewSpots] = useState(14); // Default 14
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
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editDate, setEditDate] = useState<string>('');
  const [editSpots, setEditSpots] = useState<number>(0);

  const upcoming = activities.filter(a => a.status === 'proxima');
  const held = activities.filter(a => a.status === 'celebrada');

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
      setNewTime1(formatTime(parsed.time) || (parsed.date ? getDefaultStartTime(parsed.date) : '21:00'));

      if (parsed.date2) {
        setNewDate2(parsed.date2);
        setNewTime2(formatTime(parsed.time2) || (parsed.date2 ? getDefaultStartTime(parsed.date2) : '13:00'));
      } else {
        setNewDate2('');
        setNewTime2('');
      }

      setNewPrice(Number(Number(parsed.price || 25.0).toFixed(2)));
      setNewSpots(parsed.spots || 14);
      setNewLocation(parsed.location || DEFAULT_OFFICIAL_LOCATION);
      
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
      setPdfSuccess(`¡Archivo "${file.name}" analizado con IA con éxito! Detectadas ${parsed.bodegas?.length || 1} bodegas, ${totalWinesCount} vinos y sumiller ${parsed.sumiller || 'Ana García'}.`);
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
    if (!newTitle || !newDate1) return;

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

    // Point 1: Create 2 records if Date 2 is provided, or 1 record for Date 1
    const recordsToCreate: Activity[] = [];

    // Record 1 (Fecha 1)
    const baseRecord1: Activity = {
      id: `${newType}-${Date.now()}-f1`,
      type: newType,
      title: newTitle,
      subtitle: newSubtitle || (cleanedBodegas[0]?.name ? `Con ${cleanedBodegas[0]?.name}` : `Convocatoria de ${newType}`),
      description: newDescription || '',
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

              <div className="p-3.5 rounded-2xl bg-[#FCFAF7] border border-[#EDE4D7] sm:col-span-2 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#521849] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#C96043]" />
                    Fecha 2 (Segundo Turno / Registro 2 - Opcional)
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-[#574B45] mb-1">Fecha</label>
                    <input
                      type="date"
                      value={newDate2}
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
                      value={newTime2}
                      onChange={(e) => setNewTime2(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#EDE4D7] bg-white text-xs font-medium cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Point 3: Default 25€ & 14 spots */}
              <div>
                <label className="block text-xs font-semibold text-[#26201D] mb-1">Precio por Persona (€)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={isNaN(newPrice) ? '' : newPrice}
                    onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs font-bold text-[#521849]"
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-[#521849]">€</span>
                </div>
                <span className="text-[10px] text-[#574B45] mt-0.5 block">
                  Formato: {newPrice.toFixed(2)} €
                </span>
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
