import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Activity, ActivityType } from '../../types';
import { Plus, Users, Calendar, Euro, CheckCircle, Sparkles, Check, Edit2, AlertCircle } from 'lucide-react';

export const ModoSencilloView: React.FC = () => {
  const { activities, addActivity, quickUpdateActivity } = useData();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Simplified creation form state
  const [newType, setNewType] = useState<ActivityType>('cata');
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newPrice, setNewPrice] = useState(40);
  const [newSpots, setNewSpots] = useState(20);

  // Editing state for quick in-line updates
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editDate, setEditDate] = useState<string>('');
  const [editSpots, setEditSpots] = useState<number>(0);

  const upcoming = activities.filter(a => a.status === 'proxima');
  const held = activities.filter(a => a.status === 'celebrada');

  const handleCreateSimple = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDate) return;

    const newActivity: Activity = {
      id: `${newType}-${Date.now()}`,
      type: newType,
      title: newTitle,
      subtitle: `Convocatoria de ${newType} de Doña Berenjena`,
      description: `Actividad programada en nuestra sede oficial. Plazas limitadas.`,
      date: newDate,
      price: Number(newPrice),
      totalSpots: Number(newSpots),
      bookedSpots: 0,
      status: 'proxima',
      location: 'Sede Doña Berenjena (C/ Mayor 14, Madrid)',
      images: [
        newType === 'cata' 
          ? 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80'
          : newType === 'curso'
          ? 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80'
          : 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=800&q=80'
      ],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      ...(newType === 'cata' ? {
        category: 'vino',
        bodegaProductor: { name: 'Bodega Invitada', region: 'España' },
        pairingMenu: [{ dish: 'Bocado de temporada', pairing: 'Vino seleccionado' }]
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

    await addActivity(newActivity);
    setSavedSuccess(true);
    setNewTitle('');
    setShowCreateForm(false);
    setTimeout(() => setSavedSuccess(false), 3000);
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

  // Occupancy metrics calculations for simple mode
  const totalUpcomingSpots = upcoming.reduce((acc, a) => acc + a.totalSpots, 0);
  const totalBookedUpcomingSpots = upcoming.reduce((acc, a) => acc + a.bookedSpots, 0);
  const totalFreeUpcomingSpots = Math.max(0, totalUpcomingSpots - totalBookedUpcomingSpots);
  const overallOccupancyPct = totalUpcomingSpots > 0 ? Math.round((totalBookedUpcomingSpots / totalUpcomingSpots) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Simple Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#EDE4D7]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#C96043]">
            <Sparkles className="w-4 h-4" />
            <span>Panel Simplificado de Coordinación</span>
          </div>
          <h2 className="text-xl font-bold font-serif text-[#26201D] mt-1">
            Gestión Rápida de Plazas y Fechas
          </h2>
          <p className="text-xs text-[#574B45]">
            Edición directa de precios, aforos y estado de las convocatorias en 1 clic.
          </p>
        </div>

        <button
          id="btn-simple-open-create"
          type="button"
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2.5 rounded-xl bg-[#C96043] hover:bg-[#B84E33] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>{showCreateForm ? 'Cerrar Formulario' : 'Crear Nueva Actividad Rápida'}</span>
        </button>
      </div>

      {/* Success Notification */}
      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs flex items-center gap-2 font-medium">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>¡Actividad creada y publicada con éxito en la web!</span>
        </div>
      )}

      {/* Simple Creation Form (Quick Mode) */}
      {showCreateForm && (
        <form
          onSubmit={handleCreateSimple}
          className="bg-[#FCFAF7] p-6 rounded-2xl border border-[#C96043]/30 space-y-4 animate-fadeIn"
        >
          <h3 className="text-sm font-bold text-[#26201D] flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#C96043]" />
            <span>Formulario Rápido (Campos Esenciales)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#26201D] mb-1">Tipo</label>
              <select
                id="select-simple-type"
                value={newType}
                onChange={(e) => setNewType(e.target.value as ActivityType)}
                className="w-full px-3 py-2 rounded-lg border border-[#EDE4D7] bg-white text-xs"
              >
                <option value="cata">Cata Gastronómica</option>
                <option value="curso">Curso de Cocina</option>
                <option value="viaje">Viaje Organizado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#26201D] mb-1">Título de la actividad *</label>
              <input
                id="input-simple-title"
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ej. Cata de Vinos Tintos de Madrid"
                className="w-full px-3 py-2 rounded-lg border border-[#EDE4D7] bg-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#26201D] mb-1">Fecha *</label>
              <input
                id="input-simple-date"
                type="text"
                required
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                placeholder="Ej. 2026-11-20 o 20 de Noviembre"
                className="w-full px-3 py-2 rounded-lg border border-[#EDE4D7] bg-white text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-[#26201D] mb-1">Precio (€)</label>
                <input
                  id="input-simple-price"
                  type="number"
                  required
                  min={0}
                  value={newPrice}
                  onChange={(e) => setNewPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-[#EDE4D7] bg-white text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#26201D] mb-1">Plazas totales</label>
                <input
                  id="input-simple-spots"
                  type="number"
                  required
                  min={1}
                  value={newSpots}
                  onChange={(e) => setNewSpots(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-[#EDE4D7] bg-white text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-3 py-2 rounded-lg border border-[#EDE4D7] text-xs text-[#574B45] hover:bg-white"
            >
              Cancelar
            </button>
            <button
              id="btn-simple-submit-create"
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#C96043] text-white text-xs font-semibold hover:bg-[#B84E33]"
            >
              Guardar y Publicar
            </button>
          </div>
        </form>
      )}

      {/* Basic Metrics: Occupancy Bars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#EDE4D7] space-y-1">
          <span className="text-xs text-[#574B45] uppercase tracking-wider font-semibold">
            Plazas Totales Convocadas
          </span>
          <p className="text-2xl font-bold font-serif text-[#26201D]">{totalUpcomingSpots}</p>
          <p className="text-[11px] text-[#574B45]">En las próximas actividades activas</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EDE4D7] space-y-1">
          <span className="text-xs text-[#574B45] uppercase tracking-wider font-semibold">
            Plazas Reservadas
          </span>
          <p className="text-2xl font-bold font-serif text-[#521849]">{totalBookedUpcomingSpots}</p>
          <div className="w-full bg-[#F6F1EA] rounded-full h-1.5 overflow-hidden mt-2">
            <div className="bg-[#521849] h-full" style={{ width: `${overallOccupancyPct}%` }} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EDE4D7] space-y-1">
          <span className="text-xs text-[#574B45] uppercase tracking-wider font-semibold">
            Plazas Libres Disponibles
          </span>
          <p className="text-2xl font-bold font-serif text-[#C96043]">{totalFreeUpcomingSpots}</p>
          <p className="text-[11px] text-emerald-700 font-medium">{100 - overallOccupancyPct}% del aforo aún disponible</p>
        </div>
      </div>

      {/* Activities Quick List with Direct In-Line Edit */}
      <div className="bg-white rounded-2xl border border-[#EDE4D7] overflow-hidden">
        <div className="p-5 border-b border-[#EDE4D7] flex items-center justify-between">
          <h3 className="font-bold text-base font-serif text-[#26201D]">
            Listado de Actividades y Control de Aforo
          </h3>
          <span className="text-xs text-[#574B45]">
            {activities.length} actividades en base de datos
          </span>
        </div>

        <div className="divide-y divide-[#EDE4D7]">
          {activities.map((act) => {
            const isEditing = editingId === act.id;
            const free = Math.max(0, act.totalSpots - act.bookedSpots);
            const isHeld = act.status === 'celebrada';
            const pct = Math.min(100, Math.round((act.bookedSpots / act.totalSpots) * 100));

            return (
              <div key={act.id} className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-[#FCFAF7] transition-colors">
                {/* Left: Info */}
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-[#F6EDF4] text-[#521849]">
                      {act.type}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      isHeld ? 'bg-[#EDE4D7] text-[#574B45]' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {isHeld ? 'Celebrada' : 'Próxima'}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-[#26201D]">
                    {act.title}
                  </h4>
                  <p className="text-xs text-[#574B45] flex items-center gap-3">
                    <span>Fecha: <strong>{act.date}</strong></span>
                    <span>Precio: <strong>{act.price}€</strong></span>
                    <span>Aforo: <strong>{act.bookedSpots} / {act.totalSpots}</strong> ({free} libres)</span>
                  </p>

                  {/* Visual Progress bar */}
                  {!isHeld && (
                    <div className="w-48 bg-[#F6F1EA] rounded-full h-1.5 overflow-hidden mt-1">
                      <div className="bg-[#521849] h-full" style={{ width: `${pct}%` }} />
                    </div>
                  )}
                </div>

                {/* Right: Quick Controls / Edit */}
                <div className="flex flex-wrap items-center gap-2">
                  {isEditing ? (
                    <div className="flex items-center gap-2 bg-[#FCFAF7] p-2 rounded-xl border border-[#DFD3C2]">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-[#574B45]">Fecha</span>
                        <input
                          type="text"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="w-24 px-2 py-1 bg-white border border-[#EDE4D7] rounded text-xs"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-[#574B45]">Precio €</span>
                        <input
                          type="number"
                          value={editPrice}
                          onChange={(e) => setEditPrice(Number(e.target.value))}
                          className="w-16 px-2 py-1 bg-white border border-[#EDE4D7] rounded text-xs"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-[#574B45]">Plazas</span>
                        <input
                          type="number"
                          value={editSpots}
                          onChange={(e) => setEditSpots(Number(e.target.value))}
                          className="w-16 px-2 py-1 bg-white border border-[#EDE4D7] rounded text-xs"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => saveEdit(act.id)}
                        className="p-2 bg-emerald-600 text-white rounded-lg text-xs hover:bg-emerald-700 cursor-pointer"
                        title="Guardar cambios"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => startEdit(act)}
                        className="px-3 py-1.5 rounded-lg border border-[#EDE4D7] text-xs font-medium text-[#26201D] hover:bg-white flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-[#574B45]" />
                        <span>Editar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleStatus(act)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          isHeld
                            ? 'bg-[#521849] text-white hover:bg-[#3E1037]'
                            : 'bg-[#EDE4D7] text-[#26201D] hover:bg-[#DFD3C2]'
                        }`}
                      >
                        {isHeld ? 'Marcar como Próxima' : 'Marcar como Celebrada'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
