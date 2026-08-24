import React from 'react';
import { Building, Globe, Plus, Trash2, Wine } from 'lucide-react';
import { BodegaItem, WineDetail } from '../../types';

interface BodegaManagerProps {
  bodegas: BodegaItem[];
  onChange: (bodegas: BodegaItem[]) => void;
  onOpenLogoModal?: (bodegaIndex: number) => void;
}

export const BodegaManager: React.FC<BodegaManagerProps> = ({
  bodegas,
  onChange,
  onOpenLogoModal
}) => {
  const handleAddBodega = () => {
    if (bodegas.length >= 4) return;
    const newBodega: BodegaItem = {
      name: '',
      website: '',
      region: 'Castilla-La Mancha',
      wines: [
        { type: 'Blanco', name: '', grape: '', pairing: '' },
        { type: 'Tinto', name: '', grape: '', pairing: '' }
      ]
    };
    onChange([...bodegas, newBodega]);
  };

  const handleRemoveBodega = (index: number) => {
    if (bodegas.length <= 1) return;
    onChange(bodegas.filter((_, i) => i !== index));
  };

  const handleUpdateBodegaField = (index: number, field: keyof BodegaItem, value: any) => {
    const updated = [...bodegas];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    onChange(updated);
  };

  const handleAddWine = (bodegaIndex: number) => {
    const bodega = bodegas[bodegaIndex];
    if (bodega.wines.length >= 4) return;
    const updatedWines = [...bodega.wines, { type: 'Vino', name: '', grape: '', pairing: '' }];
    handleUpdateBodegaField(bodegaIndex, 'wines', updatedWines);
  };

  const handleRemoveWine = (bodegaIndex: number, wineIndex: number) => {
    const bodega = bodegas[bodegaIndex];
    if (bodega.wines.length <= 1) return;
    const updatedWines = bodega.wines.filter((_, i) => i !== wineIndex);
    handleUpdateBodegaField(bodegaIndex, 'wines', updatedWines);
  };

  const handleUpdateWineField = (bodegaIndex: number, wineIndex: number, field: keyof WineDetail, value: string) => {
    const bodega = bodegas[bodegaIndex];
    const updatedWines = [...bodega.wines];
    updatedWines[wineIndex] = {
      ...updatedWines[wineIndex],
      [field]: value
    };
    handleUpdateBodegaField(bodegaIndex, 'wines', updatedWines);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-[#EDE4D7] pb-3">
        <div className="flex items-center gap-2">
          <Building className="w-5 h-5 text-[#521849]" />
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#521849]">
              Bodegas Participantes ({bodegas.length} {bodegas.length === 1 ? 'bodega' : 'bodegas'})
            </h4>
            <p className="text-[11px] text-[#574B45]">
              Puedes añadir de 1 a 4 bodegas. Cada bodega incluye su información y de 1 a 4 vinos con maridaje.
            </p>
          </div>
        </div>
        {bodegas.length < 4 && (
          <button
            type="button"
            onClick={handleAddBodega}
            className="px-3 py-1.5 rounded-xl bg-[#521849] hover:bg-[#3E1037] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Añadir Bodega</span>
          </button>
        )}
      </div>

      {/* Bodega Cards */}
      <div className="space-y-6">
        {bodegas.map((bodega, bIdx) => (
          <div
            key={bIdx}
            className="p-5 sm:p-6 rounded-2xl bg-white border-2 border-[#EDE4D7] shadow-xs space-y-5 relative"
          >
            {/* Header of Bodega Card */}
            <div className="flex items-center justify-between border-b border-[#F6F1EA] pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-[#521849] text-white text-xs font-bold uppercase tracking-wider">
                  Bodega #{bIdx + 1}
                </span>
                <span className="font-serif font-bold text-base text-[#26201D]">
                  {bodega.name || 'Nueva Bodega'}
                </span>
              </div>
              {bodegas.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveBodega(bIdx)}
                  className="text-[#9B3E26] hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 flex items-center gap-1 text-xs font-medium cursor-pointer transition-colors"
                  title="Eliminar esta bodega"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Eliminar Bodega</span>
                </button>
              )}
            </div>

            {/* Bodega Info Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#26201D] mb-1">
                  Nombre de la Bodega / Productor *
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={bodega.name}
                    onChange={(e) => handleUpdateBodegaField(bIdx, 'name', e.target.value)}
                    placeholder="Ej. Bodega La Uveja Negra"
                    className="w-full px-3 py-2 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs font-medium focus:bg-white"
                  />
                  {onOpenLogoModal && (
                    <button
                      type="button"
                      onClick={() => onOpenLogoModal(bIdx)}
                      title="Buscar logotipo en Google Imágenes"
                      className="px-2.5 py-2 rounded-xl bg-[#521849] hover:bg-[#3E1037] text-white text-xs font-bold flex items-center justify-center shrink-0 cursor-pointer"
                    >
                      <Globe className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#26201D] mb-1">
                  Localidad / Región / D.O. *
                </label>
                <input
                  type="text"
                  value={bodega.region}
                  onChange={(e) => handleUpdateBodegaField(bIdx, 'region', e.target.value)}
                  placeholder="Ej. Carrión de Calatrava – Ciudad Real"
                  className="w-full px-3 py-2 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#26201D] mb-1">
                  Página Web Oficial (Opcional)
                </label>
                <input
                  type="url"
                  value={bodega.website || ''}
                  onChange={(e) => handleUpdateBodegaField(bIdx, 'website', e.target.value)}
                  placeholder="https://ejemplo.es"
                  className="w-full px-3 py-2 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs focus:bg-white"
                />
              </div>
            </div>

            {/* Wines and Pairings Sub-block */}
            <div className="p-4 sm:p-5 rounded-xl bg-[#FCFAF7] border border-[#EDE4D7] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wine className="w-4 h-4 text-[#521849]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#521849]">
                    Vinos y Maridajes de {bodega.name || `Bodega #${bIdx + 1}`} ({bodega.wines.length} de 4)
                  </span>
                </div>
                {bodega.wines.length < 4 && (
                  <button
                    type="button"
                    onClick={() => handleAddWine(bIdx)}
                    className="text-xs font-semibold text-[#521849] hover:text-[#3E1037] flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Añadir Vino</span>
                  </button>
                )}
              </div>

              {/* Wines Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {bodega.wines.map((wine, wIdx) => (
                  <div
                    key={wIdx}
                    className="p-3.5 rounded-xl bg-white border border-[#EDE4D7] space-y-2.5 shadow-2xs relative"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#521849] bg-[#521849]/10 px-2 py-0.5 rounded-md">
                        Vino #{wIdx + 1}
                      </span>
                      {bodega.wines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveWine(bIdx, wIdx)}
                          className="text-[#9B3E26] hover:text-rose-700 p-1 cursor-pointer"
                          title="Eliminar vino"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] text-[#574B45] mb-0.5 font-medium">Tipo / Pase</label>
                        <input
                          type="text"
                          value={wine.type}
                          onChange={(e) => handleUpdateWineField(bIdx, wIdx, 'type', e.target.value)}
                          placeholder="Blanco, Tinto, Vermut..."
                          className="w-full px-2 py-1.5 rounded-lg border border-[#EDE4D7] text-xs"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] text-[#574B45] mb-0.5 font-medium">Nombre Comercial *</label>
                        <input
                          type="text"
                          value={wine.name}
                          onChange={(e) => handleUpdateWineField(bIdx, wIdx, 'name', e.target.value)}
                          placeholder="Ej. El Jalbegandero / Lustau Rojo"
                          className="w-full px-2 py-1.5 rounded-lg border border-[#EDE4D7] text-xs font-semibold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-[#574B45] mb-0.5 font-medium">Variedad / Uva</label>
                        <input
                          type="text"
                          value={wine.grape || ''}
                          onChange={(e) => handleUpdateWineField(bIdx, wIdx, 'grape', e.target.value)}
                          placeholder="Ej. 100% Airén"
                          className="w-full px-2 py-1.5 rounded-lg border border-[#EDE4D7] text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[#574B45] mb-0.5 font-medium">Maridaje Asociado</label>
                        <input
                          type="text"
                          value={wine.pairing || ''}
                          onChange={(e) => handleUpdateWineField(bIdx, wIdx, 'pairing', e.target.value)}
                          placeholder="Ej. Arroz Meloso con Verduritas"
                          className="w-full px-2 py-1.5 rounded-lg border border-[#EDE4D7] text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
