import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Activity, ActivityType, CataActivity, CataCategory, CursoActivity, ViajeActivity } from '../../types';
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
  RefreshCw, 
  X, 
  Save, 
  Wine, 
  ChefHat, 
  Compass, 
  Layers, 
  Sparkles,
  Image as ImageIcon
} from 'lucide-react';

export const ModoAvanzadoView: React.FC = () => {
  const { activities, metrics, addActivity, updateActivity, deleteActivity, resetToDefaults } = useData();

  const [activeTab, setActiveTab] = useState<'gestion' | 'metricas'>('gestion');
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [activityTypeToCreate, setActivityTypeToCreate] = useState<ActivityType>('cata');
  const [notification, setNotification] = useState<string | null>(null);

  // Form State for Advanced Editor
  const [formData, setFormData] = useState<Partial<Activity>>({});
  const [imageUrlsText, setImageUrlsText] = useState<string>('');
  const [pairingText, setPairingText] = useState<string>(''); // For catas: dish | pairing | notes
  const [syllabusText, setSyllabusText] = useState<string>(''); // For cursos: line by line
  const [servicesText, setServicesText] = useState<string>(''); // For viajes: line by line

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const startCreate = (type: ActivityType) => {
    setIsCreatingNew(true);
    setActivityTypeToCreate(type);
    const blank: Partial<Activity> = {
      id: `${type}-${Date.now()}`,
      type: type,
      title: '',
      subtitle: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      time: '20:00 h',
      price: 45,
      totalSpots: 20,
      bookedSpots: 0,
      status: 'proxima',
      location: 'Sede Doña Berenjena (C/ Mayor 14, Planta 1, Madrid)',
      featured: false,
      howToReserveInfo: 'Reserva confirmada mediante abono de plaza.',
      images: ['https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1200&q=80'],
      documentPdf: {
        title: 'Ficha Técnica Informativa.pdf',
        url: '#',
        fileSize: '1.2 MB'
      },
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };

    if (type === 'cata') {
      (blank as Partial<CataActivity>).category = 'vino';
      (blank as Partial<CataActivity>).bodegaProductor = { name: '', region: '', enologo: '', description: '' };
      (blank as Partial<CataActivity>).pairingMenu = [];
      setPairingText('Terrina de lechal | Tinto Crianza | Maridaje de contraste\nTabla de afinados | Blanco Fermentado en Barrica | Textura untuosa');
    } else if (type === 'curso') {
      (blank as Partial<CursoActivity>).theme = 'Técnicas de Cocina';
      (blank as Partial<CursoActivity>).chef = { name: '', bio: '', restaurant: '' };
      (blank as Partial<CursoActivity>).syllabus = [];
      (blank as Partial<CursoActivity>).includesTasting = true;
      setSyllabusText('Selección de materia prima\nTécnica de fondos oscuros\nCocinado individual en estación\nDegustación en mesa');
    } else if (type === 'viaje') {
      (blank as Partial<ViajeActivity>).destination = '';
      (blank as Partial<ViajeActivity>).durationDays = 3;
      (blank as Partial<ViajeActivity>).includedServices = [];
      (blank as Partial<ViajeActivity>).itinerary = [
        { day: 1, title: 'Llegada y presentación', description: 'Recepción de los socios', highlights: ['Cena inaugural'] }
      ];
      setServicesText('Autobús privado exclusivo\nHotel 4* con desayuno\nVisitas a bodegas y catas privadas\nAlmuerzos y cenas maridadas');
    }

    setFormData(blank);
    setImageUrlsText(blank.images?.join('\n') || '');
    setEditingActivity(blank as Activity);
  };

  const startEdit = (act: Activity) => {
    setIsCreatingNew(false);
    setEditingActivity(act);
    setFormData({ ...act });
    setImageUrlsText(act.images.join('\n'));

    if (act.type === 'cata') {
      const cata = act as CataActivity;
      const pText = cata.pairingMenu?.map(p => `${p.dish} | ${p.pairing} | ${p.notes || ''}`).join('\n') || '';
      setPairingText(pText);
    } else if (act.type === 'curso') {
      const curso = act as CursoActivity;
      setSyllabusText(curso.syllabus?.join('\n') || '');
    } else if (act.type === 'viaje') {
      const viaje = act as ViajeActivity;
      setServicesText(viaje.includedServices?.join('\n') || '');
    }
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    const parsedImages = imageUrlsText.split('\n').map(s => s.trim()).filter(Boolean);
    const finalImages = parsedImages.length > 0 ? parsedImages : ['https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1200&q=80'];

    let finalizedActivity: Activity = {
      ...formData,
      images: finalImages,
      price: Number(formData.price || 0),
      totalSpots: Number(formData.totalSpots || 1),
      bookedSpots: Number(formData.bookedSpots || 0),
      updatedAt: new Date().toISOString().split('T')[0]
    } as Activity;

    if (finalizedActivity.type === 'cata') {
      const pMenu = pairingText.split('\n').map(line => {
        const [dish, pairing, notes] = line.split('|').map(s => s.trim());
        if (!dish) return null;
        return { dish, pairing: pairing || 'Vino armonizado', notes: notes || '' };
      }).filter(Boolean) as any[];
      (finalizedActivity as CataActivity).pairingMenu = pMenu;
    } else if (finalizedActivity.type === 'curso') {
      const syll = syllabusText.split('\n').map(s => s.trim()).filter(Boolean);
      (finalizedActivity as CursoActivity).syllabus = syll;
    } else if (finalizedActivity.type === 'viaje') {
      const serv = servicesText.split('\n').map(s => s.trim()).filter(Boolean);
      (finalizedActivity as ViajeActivity).includedServices = serv;
    }

    if (isCreatingNew) {
      await addActivity(finalizedActivity);
      showNotification('¡Actividad creada y registrada en base de datos!');
    } else {
      await updateActivity(finalizedActivity);
      showNotification('¡Cambios guardados con éxito!');
    }

    setEditingActivity(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Confirmas que deseas eliminar esta actividad de forma permanente?')) {
      await deleteActivity(id);
      showNotification('Actividad eliminada.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EDE4D7] pb-4">
        <div className="flex items-center gap-2">
          <button
            id="tab-avanzado-gestion"
            type="button"
            onClick={() => setActiveTab('gestion')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'gestion'
                ? 'bg-[#521849] text-white shadow-xs'
                : 'bg-white text-[#574B45] border border-[#EDE4D7] hover:bg-[#F6F1EA]'
            }`}
          >
            Gestión de Actividades ({activities.length})
          </button>
          <button
            id="tab-avanzado-metricas"
            type="button"
            onClick={() => setActiveTab('metricas')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'metricas'
                ? 'bg-[#521849] text-white shadow-xs'
                : 'bg-white text-[#574B45] border border-[#EDE4D7] hover:bg-[#F6F1EA]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Métricas Web</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-reset-defaults"
            type="button"
            onClick={() => {
              if (window.confirm('¿Restablecer todas las actividades a los datos de muestra iniciales?')) {
                resetToDefaults();
                showNotification('Base de datos restablecida.');
              }
            }}
            className="px-3 py-1.5 rounded-lg border border-[#EDE4D7] text-xs text-[#574B45] hover:text-[#521849] hover:bg-white flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Restablecer Demos</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* METRICS VIEW */}
      {/* ========================================================================= */}
      {activeTab === 'metricas' && (
        <div className="space-y-8 animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-[#EDE4D7] space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#574B45]">
                Páginas Vistas (Mes)
              </span>
              <p className="text-3xl font-bold font-serif text-[#521849]">
                {metrics.pageViewsThisMonth.toLocaleString()}
              </p>
              <p className="text-[11px] text-emerald-700 font-medium">↑ +18% frente al mes anterior</p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#EDE4D7] space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#574B45]">
                Visitantes Únicos
              </span>
              <p className="text-3xl font-bold font-serif text-[#26201D]">
                {metrics.uniqueVisitorsThisMonth.toLocaleString()}
              </p>
              <p className="text-[11px] text-[#574B45]">Tráfico orgánico y recomendaciones</p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#EDE4D7] space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#574B45]">
                Reservas Gestionadas
              </span>
              <p className="text-3xl font-bold font-serif text-[#C96043]">
                {metrics.activeReservationsCount}
              </p>
              <p className="text-[11px] text-emerald-700 font-medium">En proceso de confirmación</p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#EDE4D7] space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#574B45]">
                Tasa Ocupación Media
              </span>
              <p className="text-3xl font-bold font-serif text-[#4D6233]">
                {metrics.occupancyRateAverage}%
              </p>
              <p className="text-[11px] text-[#574B45]">Aforo cubierto en las últimas 5 catas</p>
            </div>
          </div>

          {/* Top Visited Activities */}
          <div className="p-6 rounded-2xl bg-white border border-[#EDE4D7] space-y-4">
            <h3 className="text-base font-bold font-serif text-[#26201D] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#521849]" />
              <span>Actividades más visitadas y consultadas</span>
            </h3>

            <div className="divide-y divide-[#EDE4D7]">
              {metrics.topVisitedActivities.map((item, idx) => (
                <div key={item.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#F6F1EA] text-[#521849] font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-[#26201D]">{item.title}</p>
                      <span className="text-[10px] uppercase font-semibold text-[#574B45]">{item.type}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-[#521849]">{item.views}</span>
                    <span className="text-[10px] text-[#574B45] block">visitas</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ACTIVITIES MANAGEMENT VIEW */}
      {/* ========================================================================= */}
      {activeTab === 'gestion' && (
        <div className="space-y-6">
          {/* Creation Bar with 3 types */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-[#EDE4D7]">
            <div>
              <h3 className="font-bold text-sm text-[#26201D]">Crear Nueva Actividad Completa</h3>
              <p className="text-xs text-[#574B45]">Elige el tipo de ficha técnica a confeccionar:</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                id="btn-create-cata"
                type="button"
                onClick={() => startCreate('cata')}
                className="px-3.5 py-2 rounded-xl bg-[#521849] hover:bg-[#3E1037] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Wine className="w-3.5 h-3.5" />
                <span>+ Nueva Cata</span>
              </button>
              <button
                id="btn-create-curso"
                type="button"
                onClick={() => startCreate('curso')}
                className="px-3.5 py-2 rounded-xl bg-[#C96043] hover:bg-[#B84E33] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <ChefHat className="w-3.5 h-3.5" />
                <span>+ Nuevo Curso</span>
              </button>
              <button
                id="btn-create-viaje"
                type="button"
                onClick={() => startCreate('viaje')}
                className="px-3.5 py-2 rounded-xl bg-[#4D6233] hover:bg-[#3B4B27] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>+ Nuevo Viaje</span>
              </button>
            </div>
          </div>

          {/* Table of all activities with comprehensive controls */}
          <div className="bg-white rounded-2xl border border-[#EDE4D7] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FCFAF7] border-b border-[#EDE4D7] text-[#574B45] uppercase font-semibold">
                  <tr>
                    <th className="p-4">Tipo</th>
                    <th className="p-4">Título & Detalles</th>
                    <th className="p-4">Fecha & Hora</th>
                    <th className="p-4">Precio</th>
                    <th className="p-4">Aforo</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDE4D7]">
                  {activities.map((act) => (
                    <tr key={act.id} className="hover:bg-[#FCFAF7] transition-colors">
                      <td className="p-4 font-bold uppercase text-[10px]">
                        <span className="px-2 py-1 rounded bg-[#F6EDF4] text-[#521849]">
                          {act.type}
                        </span>
                      </td>
                      <td className="p-4 max-w-xs">
                        <p className="font-bold text-[#26201D] truncate">{act.title}</p>
                        <p className="text-[11px] text-[#574B45] truncate">{act.subtitle || act.location}</p>
                      </td>
                      <td className="p-4 whitespace-nowrap text-[#3D3430]">
                        {act.date} {act.time && `(${act.time})`}
                      </td>
                      <td className="p-4 whitespace-nowrap font-bold text-[#521849]">
                        {act.price}€
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className="font-semibold text-[#26201D]">{act.bookedSpots}</span> / {act.totalSpots}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          act.status === 'proxima' ? 'bg-emerald-100 text-emerald-800' : 'bg-[#EDE4D7] text-[#574B45]'
                        }`}>
                          {act.status === 'proxima' ? 'Próxima' : 'Celebrada'}
                        </span>
                      </td>
                      <td className="p-4 whitespace-nowrap text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => startEdit(act)}
                          className="p-1.5 rounded-lg border border-[#EDE4D7] text-[#521849] hover:bg-white cursor-pointer"
                          title="Editar ficha completa"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(act.id)}
                          className="p-1.5 rounded-lg border border-[#EDE4D7] text-[#9B3E26] hover:bg-rose-50 cursor-pointer"
                          title="Eliminar actividad"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADVANCED MODAL / SLIDEOVER FORM */}
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
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-[#521849]">
                  {isCreatingNew ? 'Creación de Nueva Ficha' : 'Edición Avanzada de Ficha'}
                </span>
                <h3 className="text-2xl font-bold font-serif text-[#26201D]">
                  {formData.title || `Nueva ficha de ${formData.type}`}
                </h3>
              </div>

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

                <div>
                  <label className="block text-xs font-semibold text-[#26201D] mb-1">Fecha</label>
                  <input
                    type="text"
                    value={formData.date || ''}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs focus:outline-none focus:border-[#521849] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#26201D] mb-1">Horario / Duración</label>
                  <input
                    type="text"
                    value={formData.time || ''}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    placeholder="Ej. 20:00 h o 3 días / 2 noches"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs focus:outline-none focus:border-[#521849] focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#26201D] mb-1">Precio (€)</label>
                    <input
                      type="number"
                      value={formData.price || 0}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#26201D] mb-1">Aforo Total</label>
                    <input
                      type="number"
                      value={formData.totalSpots || 0}
                      onChange={(e) => setFormData({ ...formData, totalSpots: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs"
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

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#26201D] mb-1">Ubicación física</label>
                  <input
                    type="text"
                    value={formData.location || ''}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#26201D] mb-1">Descripción detallada</label>
                  <textarea
                    rows={4}
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs resize-none"
                  />
                </div>
              </div>

              {/* URLs de Imágenes */}
              <div>
                <label className="block text-xs font-semibold text-[#26201D] mb-1">
                  Imágenes de la ficha (una URL por línea)
                </label>
                <textarea
                  rows={2}
                  value={imageUrlsText}
                  onChange={(e) => setImageUrlsText(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs font-mono"
                />
              </div>

              {/* Type specific fields */}
              {formData.type === 'cata' && (
                <div className="p-5 rounded-2xl bg-[#FBF9F5] border border-[#EDE4D7] space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#521849]">
                    Campos Específicos de Cata
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#26201D] mb-1">Categoría</label>
                      <select
                        value={(formData as CataActivity).category || 'vino'}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value as CataCategory } as any)}
                        className="w-full px-3 py-2 rounded-lg border border-[#EDE4D7] bg-white text-xs"
                      >
                        <option value="vino">Vino</option>
                        <option value="vermut">Vermut</option>
                        <option value="aceite">Aceite de Oliva</option>
                        <option value="cerveza">Cerveza</option>
                        <option value="quesos">Quesos</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#26201D] mb-1">Bodega / Productor</label>
                      <input
                        type="text"
                        value={(formData as CataActivity).bodegaProductor?.name || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          bodegaProductor: {
                            ...(formData as CataActivity).bodegaProductor,
                            name: e.target.value,
                            region: (formData as CataActivity).bodegaProductor?.region || 'España'
                          }
                        } as any)}
                        placeholder="Ej. Bodegas Dominio de Atauta"
                        className="w-full px-3 py-2 rounded-lg border border-[#EDE4D7] bg-white text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#26201D] mb-1">
                      Menú de Maridaje (Formato: Plato | Vino/Bebida | Notas de cata)
                    </label>
                    <textarea
                      rows={3}
                      value={pairingText}
                      onChange={(e) => setPairingText(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#EDE4D7] bg-white text-xs"
                    />
                  </div>
                </div>
              )}

              {formData.type === 'curso' && (
                <div className="p-5 rounded-2xl bg-[#F9ECE8] border border-[#C96043]/30 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#C96043]">
                    Campos Específicos de Curso
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#26201D] mb-1">Nombre del Chef</label>
                      <input
                        type="text"
                        value={(formData as CursoActivity).chef?.name || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          chef: {
                            ...(formData as CursoActivity).chef,
                            name: e.target.value,
                            bio: (formData as CursoActivity).chef?.bio || ''
                          }
                        } as any)}
                        className="w-full px-3 py-2 rounded-lg border border-[#EDE4D7] bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#26201D] mb-1">Restaurante del Chef</label>
                      <input
                        type="text"
                        value={(formData as CursoActivity).chef?.restaurant || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          chef: {
                            ...(formData as CursoActivity).chef,
                            name: (formData as CursoActivity).chef?.name || '',
                            bio: (formData as CursoActivity).chef?.bio || '',
                            restaurant: e.target.value
                          }
                        } as any)}
                        className="w-full px-3 py-2 rounded-lg border border-[#EDE4D7] bg-white text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#26201D] mb-1">
                      Temario / Puntos que se aprenderán (uno por línea)
                    </label>
                    <textarea
                      rows={3}
                      value={syllabusText}
                      onChange={(e) => setSyllabusText(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#EDE4D7] bg-white text-xs"
                    />
                  </div>
                </div>
              )}

              {formData.type === 'viaje' && (
                <div className="p-5 rounded-2xl bg-[#EFF4E9] border border-[#4D6233]/30 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#4D6233]">
                    Campos Específicos de Viaje
                  </h4>
                  <div>
                    <label className="block text-xs font-semibold text-[#26201D] mb-1">Destino</label>
                    <input
                      type="text"
                      value={(formData as ViajeActivity).destination || ''}
                      onChange={(e) => setFormData({ ...formData, destination: e.target.value } as any)}
                      className="w-full px-3 py-2 rounded-lg border border-[#EDE4D7] bg-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#26201D] mb-1">
                      Servicios Incluidos (uno por línea)
                    </label>
                    <textarea
                      rows={3}
                      value={servicesText}
                      onChange={(e) => setServicesText(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#EDE4D7] bg-white text-xs"
                    />
                  </div>
                </div>
              )}

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
                  <span>Guardar Cambios en Base de Datos</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
