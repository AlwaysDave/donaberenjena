import React, { useState, useEffect } from 'react';
import { 
  getAnalyticsConsent, 
  setAnalyticsConsent, 
  AnalyticsConsentStatus, 
  getGAMeasurementId 
} from '../../utils/googleAnalytics';
import { ShieldCheck, Cookie, Settings, Check, X, Info } from 'lucide-react';

export const CookieConsentBanner: React.FC = () => {
  const [consentStatus, setConsentStatus] = useState<AnalyticsConsentStatus>('pending');
  const [isOpen, setIsOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analyticsChecked, setAnalyticsChecked] = useState(true);

  const gaId = getGAMeasurementId();

  useEffect(() => {
    const current = getAnalyticsConsent();
    setConsentStatus(current);
    if (current === 'pending') {
      // Small delay to prevent layout flicker on initial render
      const timer = setTimeout(() => setIsOpen(true), 600);
      return () => clearTimeout(timer);
    } else {
      setAnalyticsChecked(current === 'accepted');
    }
  }, []);

  // Listen to open requests from footer or settings link
  useEffect(() => {
    const handleOpenSettings = () => {
      const current = getAnalyticsConsent();
      setAnalyticsChecked(current === 'accepted');
      setShowDetails(true);
      setIsOpen(true);
    };

    window.addEventListener('dnb_open_cookie_settings', handleOpenSettings);
    return () => {
      window.removeEventListener('dnb_open_cookie_settings', handleOpenSettings);
    };
  }, []);

  const handleAcceptAll = () => {
    setAnalyticsConsent(true);
    setConsentStatus('accepted');
    setIsOpen(false);
    setShowDetails(false);
  };

  const handleRejectAnalytics = () => {
    setAnalyticsConsent(false);
    setConsentStatus('rejected');
    setIsOpen(false);
    setShowDetails(false);
  };

  const handleSaveCustom = () => {
    setAnalyticsConsent(analyticsChecked);
    setConsentStatus(analyticsChecked ? 'accepted' : 'rejected');
    setIsOpen(false);
    setShowDetails(false);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      id="cookie-consent-banner"
      role="region"
      aria-label="Consentimiento de cookies"
      className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6 pointer-events-none"
    >
      <div className="max-w-4xl mx-auto bg-white/95 backdrop-blur-md border border-[#EDE4D7] rounded-2xl shadow-xl p-5 sm:p-6 pointer-events-auto transition-all animate-in fade-in slide-in-from-bottom-4 duration-300">
        {!showDetails ? (
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="flex items-start gap-3.5 max-w-2xl">
              <div className="w-10 h-10 rounded-xl bg-[#FAF6F0] border border-[#EDE4D7] text-[#521849] flex items-center justify-center shrink-0 mt-0.5">
                <Cookie className="w-5 h-5 text-[#521849]" />
              </div>
              <div className="space-y-1 text-left">
                <h3 className="text-sm font-bold text-[#26201D] font-serif flex items-center gap-2">
                  <span>Privacidad y Uso de Cookies</span>
                  <span className="text-[10px] uppercase font-sans tracking-wider px-2 py-0.5 bg-[#FAF6F0] border border-[#EDE4D7] rounded-full text-[#574B45] font-semibold">
                    RGPD
                  </span>
                </h3>
                <p className="text-xs text-[#574B45] leading-relaxed">
                  Utilizamos cookies técnicas necesarias para el funcionamiento del portal y, si lo autorizas, cookies analíticas de <strong>Google Analytics 4</strong> para medir de forma anónima la interacción con nuestras catas y actividades culturales, sin recopilar datos personales.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto shrink-0 justify-end">
              <button
                type="button"
                onClick={() => setShowDetails(true)}
                className="px-3 py-2 text-xs font-semibold text-[#574B45] hover:text-[#26201D] hover:bg-[#FAF6F0] rounded-xl border border-transparent hover:border-[#EDE4D7] transition-all cursor-pointer"
              >
                Personalizar
              </button>
              <button
                type="button"
                onClick={handleRejectAnalytics}
                className="px-3.5 py-2 text-xs font-semibold text-[#574B45] bg-[#FAF8F5] hover:bg-[#F2ECE4] border border-[#EDE4D7] rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                Solo necesarias
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="px-4 py-2 text-xs font-bold text-white bg-[#521849] hover:bg-[#3E1037] rounded-xl transition-all cursor-pointer shadow-sm"
              >
                Aceptar analíticas
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#F6F1EA] pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#521849]" />
                <h3 className="text-sm font-bold text-[#26201D] font-serif">
                  Configuración de Preferencias de Privacidad
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDetails(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
                title="Cerrar detalles"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {/* Categoría 1: Esenciales */}
              <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EDE4D7] flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#26201D]">Cookies Técnicas y Esenciales</span>
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Siempre activas
                    </span>
                  </div>
                  <p className="text-[11px] text-[#574B45]">
                    Necesarias para la navegación básica, seguridad, autenticación administrativa y mantenimiento del estado de sesión en reservas. No almacenan información de identificación personal.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={true}
                  disabled
                  className="rounded text-[#521849] focus:ring-[#521849] opacity-60 cursor-not-allowed mt-1"
                />
              </div>

              {/* Categoría 2: Analíticas GA4 */}
              <div className="p-3.5 rounded-xl bg-white border border-[#EDE4D7] flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#26201D]">Medición y Analítica (Google Analytics 4)</span>
                    {gaId && (
                      <span className="text-[10px] font-mono text-[#521849] bg-[#FAF6F0] px-1.5 py-0.2 rounded border border-[#EDE4D7]">
                        {gaId}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#574B45]">
                    Nos permite entender de manera anónima qué catas, cursos y viajes despiertan mayor interés para optimizar las plazas y la experiencia del portal. La etiqueta y los eventos de GA4 solo se cargan si marcas esta casilla.
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="consent-analytics-toggle"
                  checked={analyticsChecked}
                  onChange={(e) => setAnalyticsChecked(e.target.checked)}
                  className="h-4 w-4 rounded text-[#521849] border-[#EDE4D7] focus:ring-[#521849] cursor-pointer mt-1"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#F6F1EA]">
              <div className="flex items-center gap-1.5 text-[11px] text-[#574B45]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Garantía de Cero PII y cumplimiento RGPD</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRejectAnalytics}
                  className="px-3 py-1.5 text-xs font-medium text-[#574B45] hover:bg-[#FAF8F5] border border-[#EDE4D7] rounded-xl transition-all cursor-pointer"
                >
                  Rechazar analíticas
                </button>
                <button
                  type="button"
                  onClick={handleSaveCustom}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-[#521849] hover:bg-[#3E1037] rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  Guardar preferencias
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
