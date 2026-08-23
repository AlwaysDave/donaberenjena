import React, { useState, useEffect } from 'react';
import { Search, ExternalLink, Image as ImageIcon, Check, X, Upload, Sparkles } from 'lucide-react';

interface BodegaLogoSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  bodegaName: string;
  currentImageUrl: string;
  onSelectImage: (url: string) => void;
}

export const BodegaLogoSearchModal: React.FC<BodegaLogoSearchModalProps> = ({
  isOpen,
  onClose,
  bodegaName,
  currentImageUrl,
  onSelectImage
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUrl, setSelectedUrl] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const cleanBodega = bodegaName.trim() || 'Bodega';
      setSearchQuery(`logo ${cleanBodega}`);
      setSelectedUrl(currentImageUrl || '');
      setInputUrl(currentImageUrl || '');
      setImageError(false);
    }
  }, [isOpen, bodegaName, currentImageUrl]);

  if (!isOpen) return null;

  const googleImagesUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(searchQuery || bodegaName || 'bodega logo')}`;

  const handleOpenGoogle = () => {
    window.open(googleImagesUrl, '_blank', 'noopener,noreferrer');
  };

  const handleApplyUrl = (urlToApply: string) => {
    if (!urlToApply.trim()) return;
    onSelectImage(urlToApply.trim());
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setInputUrl(result);
          setSelectedUrl(result);
          setImageError(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Curated quality wine / winery fallbacks
  const presetImages = [
    { label: 'Viñedos y Barricas', url: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=800&q=80' },
    { label: 'Cata y Copas', url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80' },
    { label: 'Uvas y Vendimia', url: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=800&q=80' },
    { label: 'Bodega Clásica', url: 'https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?auto=format&fit=crop&w=800&q=80' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#521849] to-[#3E1037] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-md">
              <Search className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight font-serif">Buscar Logo / Portada</h3>
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

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Step 1: Google Images Search Button */}
          <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                Paso 1: Abrir buscador en Google
              </span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ej: logo SAT COLOMAN"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-amber-300/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-800"
                />
              </div>
              <button
                type="button"
                onClick={handleOpenGoogle}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg text-sm flex items-center justify-center gap-2 shadow-sm transition-colors whitespace-nowrap cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                Buscar en Google Imágenes
              </button>
            </div>
            <p className="text-xs text-amber-800/80">
              💡 <em>Se abrirá Google Imágenes en una pestaña nueva. Haz clic derecho en la imagen que te guste → "Copiar dirección de imagen" y pégala en el Paso 2.</em>
            </p>
          </div>

          {/* Step 2: Paste URL or Upload file */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-[#521849]" />
              Paso 2: Pegar URL de la Imagen o Subir Archivo
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => {
                  setInputUrl(e.target.value);
                  setSelectedUrl(e.target.value);
                  setImageError(false);
                }}
                placeholder="https://ejemplo.com/logo-bodega.png"
                className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#521849] font-mono text-xs text-slate-800"
              />
              <label className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg cursor-pointer flex items-center gap-1.5 border border-slate-200 transition-colors">
                <Upload className="w-4 h-4 text-slate-600" />
                <span>Subir archivo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Preview section */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Vista previa del Logo / Imagen
            </span>
            <div className="h-44 bg-slate-100 rounded-xl border border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative">
              {selectedUrl && !imageError ? (
                <img
                  src={selectedUrl}
                  alt="Vista previa"
                  referrerPolicy="no-referrer"
                  className="max-h-full max-w-full object-contain p-2"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="text-center p-4 text-slate-400">
                  <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">
                    {imageError ? '⚠️ No se pudo cargar la imagen desde esa URL' : 'Pega una URL o sube una imagen para ver la vista previa'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
              O elige una imagen temática de respaldo:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {presetImages.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setInputUrl(preset.url);
                    setSelectedUrl(preset.url);
                    setImageError(false);
                  }}
                  className={`p-1.5 rounded-lg border text-left flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    selectedUrl === preset.url
                      ? 'border-[#521849] bg-[#521849]/5 ring-2 ring-[#521849]/30'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.label}
                    className="w-full h-14 object-cover rounded"
                  />
                  <span className="text-[11px] font-medium text-slate-700 truncate w-full text-center">
                    {preset.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions */}
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
            onClick={() => handleApplyUrl(selectedUrl)}
            disabled={!selectedUrl.trim() || imageError}
            className="px-5 py-2 text-sm font-bold bg-[#521849] hover:bg-[#3E1037] disabled:opacity-50 text-white rounded-lg flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            Aplicar esta Imagen
          </button>
        </div>
      </div>
    </div>
  );
};
