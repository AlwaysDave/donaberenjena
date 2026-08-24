import React, { useState, useEffect } from 'react';
import { Search, ExternalLink, Globe, Check, X, Sparkles } from 'lucide-react';

interface BodegaWebsiteSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  bodegaName: string;
  currentWebsite: string;
  onSelectWebsite: (url: string) => void;
}

export const BodegaWebsiteSearchModal: React.FC<BodegaWebsiteSearchModalProps> = ({
  isOpen,
  onClose,
  bodegaName,
  currentWebsite,
  onSelectWebsite
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUrl, setSelectedUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      const cleanBodega = bodegaName.trim() || 'Bodega';
      setSearchQuery(`bodega ${cleanBodega} web oficial`);
      setSelectedUrl(currentWebsite || '');
    }
  }, [isOpen, bodegaName, currentWebsite]);

  if (!isOpen) return null;

  const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery || `${bodegaName} web oficial`)}`;

  const handleOpenGoogle = () => {
    window.open(googleSearchUrl, '_blank', 'noopener,noreferrer');
  };

  const handleApplyUrl = () => {
    let url = selectedUrl.trim();
    if (url && !/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }
    onSelectWebsite(url);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#521849] to-[#3E1037] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-md">
              <Globe className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight font-serif">Buscar Web Oficial de la Bodega</h3>
              <p className="text-xs text-amber-200/80">Bodega: {bodegaName || 'Bodega Invitada'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Step 1: Search in Google */}
          <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200/70 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
              Paso 1: Abrir búsqueda de la bodega en Google
            </span>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ej: bodega SAT Coloman web oficial"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-amber-300/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-800"
                />
              </div>
              <button
                type="button"
                onClick={handleOpenGoogle}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg text-sm flex items-center justify-center gap-2 shadow-sm transition-colors whitespace-nowrap cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                Buscar en Google
              </button>
            </div>
            <p className="text-xs text-amber-800/80">
              💡 <em>Se abrirá Google en una nueva pestaña con los resultados oficiales de la bodega. Copia la URL de su página web y pégala en el Paso 2.</em>
            </p>
          </div>

          {/* Step 2: Paste URL */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-[#521849]" />
              Paso 2: Pegar la URL de la Web
            </label>
            <div className="relative">
              <input
                type="url"
                value={selectedUrl}
                onChange={(e) => setSelectedUrl(e.target.value)}
                placeholder="https://www.bodegaejemplo.com"
                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#521849] font-mono text-slate-800"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Si no encuentras una web oficial o prefieres no enlazarla, puedes dejar este campo vacío.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleApplyUrl}
            className="px-5 py-2 text-sm font-bold bg-[#521849] hover:bg-[#3E1037] text-white rounded-lg flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            Guardar Web
          </button>
        </div>
      </div>
    </div>
  );
};
