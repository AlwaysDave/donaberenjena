import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Globe, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  FileText, 
  ExternalLink,
  Bot,
  Share2,
  Compass,
  ArrowRight,
  Sparkles,
  Info,
  Layers,
  XCircle,
  RefreshCw,
  ShieldCheck,
  Activity as ActivityIcon,
  PlayCircle,
  Eye,
  ShoppingCart,
  UserPlus,
  Lock
} from 'lucide-react';
import { MetricStatusBadge } from './MetricStatusBadge';
import { getGAMeasurementId, getAnalyticsConsent, AnalyticsConsentStatus } from '../../../utils/googleAnalytics';

interface TabCeoSeoProps {
  onNavigateToCaptacion?: () => void;
}

interface SeoCheckItem {
  id: string;
  label: string;
  description: string;
  status: 'real' | 'unconfigured' | 'error' | 'checking';
  statusLabel: string;
  detail?: string;
}

export const TabCeoSeo: React.FC<TabCeoSeoProps> = ({
  onNavigateToCaptacion
}) => {
  const [gaMeasurementId, setGaMeasurementId] = useState<string | undefined>(undefined);
  const [consentStatus, setConsentStatus] = useState<AnalyticsConsentStatus>('pending');
  const [activeGuideTab, setActiveGuideTab] = useState<'realtime' | 'tagassistant' | 'events'>('realtime');

  const [seoChecks, setSeoChecks] = useState<SeoCheckItem[]>([
    {
      id: 'meta-title',
      label: 'Meta Tag Title',
      description: 'Título principal indexable por buscadores en el punto de entrada HTML.',
      status: 'checking',
      statusLabel: 'Comprobando...'
    },
    {
      id: 'meta-desc',
      label: 'Meta Tag Description',
      description: 'Descripción para resultados de búsqueda y snippets en buscadores.',
      status: 'checking',
      statusLabel: 'Comprobando...'
    },
    {
      id: 'robots',
      label: 'Archivo robots.txt',
      description: 'Directivas de indexación y acceso para rastreadores web.',
      status: 'checking',
      statusLabel: 'Comprobando...'
    },
    {
      id: 'sitemap',
      label: 'Mapa del Sitio sitemap.xml',
      description: 'Índice estructurado de URLs públicas para indexación en Google.',
      status: 'checking',
      statusLabel: 'Comprobando...'
    },
    {
      id: 'canonical',
      label: 'Etiqueta Canonical (<link rel="canonical">)',
      description: 'Declaración de URL canónica para prevenir contenido duplicado.',
      status: 'unconfigured',
      statusLabel: 'Ausente',
      detail: 'Recomendado cuando se asigne el dominio final definitivo.'
    },
    {
      id: 'open-graph',
      label: 'Etiquetas Open Graph y Twitter Cards',
      description: 'Metadatos para previsualización enriquecida al compartir enlaces en redes y mensajería.',
      status: 'unconfigured',
      statusLabel: 'Ausente',
      detail: 'Pendiente de añadir en cabecera HTML.'
    }
  ]);

  const runSeoChecks = async () => {
    setGaMeasurementId(getGAMeasurementId());
    setConsentStatus(getAnalyticsConsent());

    const updated = [...seoChecks];

    // 1. Check title
    const docTitle = typeof document !== 'undefined' ? document.title : '';
    const titleIdx = updated.findIndex(c => c.id === 'meta-title');
    if (titleIdx >= 0) {
      if (docTitle && docTitle.length > 5) {
        updated[titleIdx] = {
          ...updated[titleIdx],
          status: 'real',
          statusLabel: 'Correcto',
          detail: `"${docTitle}"`
        };
      } else {
        updated[titleIdx] = {
          ...updated[titleIdx],
          status: 'error',
          statusLabel: 'Incompleto',
          detail: 'Título no encontrado o demasiado corto.'
        };
      }
    }

    // 2. Check meta description
    const metaDesc = typeof document !== 'undefined' 
      ? document.querySelector('meta[name="description"]')?.getAttribute('content')
      : null;
    const descIdx = updated.findIndex(c => c.id === 'meta-desc');
    if (descIdx >= 0) {
      if (metaDesc && metaDesc.length > 15) {
        updated[descIdx] = {
          ...updated[descIdx],
          status: 'real',
          statusLabel: 'Configurado',
          detail: metaDesc.length > 80 ? `${metaDesc.substring(0, 80)}...` : metaDesc
        };
      } else {
        updated[descIdx] = {
          ...updated[descIdx],
          status: 'unconfigured',
          statusLabel: 'Sin descripción',
          detail: 'No se encontró la etiqueta meta description en el documento.'
        };
      }
    }

    // 3. Check robots.txt
    const robotsIdx = updated.findIndex(c => c.id === 'robots');
    try {
      const robotsRes = await fetch('/robots.txt');
      if (robotsRes.ok) {
        updated[robotsIdx] = {
          ...updated[robotsIdx],
          status: 'real',
          statusLabel: 'Disponible (HTTP 200)',
          detail: 'Ruta servida correctamente en /robots.txt'
        };
      } else {
        updated[robotsIdx] = {
          ...updated[robotsIdx],
          status: 'error',
          statusLabel: `Error HTTP ${robotsRes.status}`,
          detail: 'El archivo robots.txt no responde con código 200.'
        };
      }
    } catch {
      updated[robotsIdx] = {
        ...updated[robotsIdx],
        status: 'error',
        statusLabel: 'No accesible',
        detail: 'Fallo de conexión al solicitar /robots.txt'
      };
    }

    // 4. Check sitemap.xml
    const sitemapIdx = updated.findIndex(c => c.id === 'sitemap');
    try {
      const sitemapRes = await fetch('/sitemap.xml');
      if (sitemapRes.ok) {
        updated[sitemapIdx] = {
          ...updated[sitemapIdx],
          status: 'real',
          statusLabel: 'Disponible (HTTP 200)',
          detail: 'Mapa XML servido correctamente en /sitemap.xml'
        };
      } else {
        updated[sitemapIdx] = {
          ...updated[sitemapIdx],
          status: 'error',
          statusLabel: `Error HTTP ${sitemapRes.status}`,
          detail: 'El archivo sitemap.xml no responde con código 200.'
        };
      }
    } catch {
      updated[sitemapIdx] = {
        ...updated[sitemapIdx],
        status: 'error',
        statusLabel: 'No accesible',
        detail: 'Fallo de conexión al solicitar /sitemap.xml'
      };
    }

    setSeoChecks(updated);
  };

  useEffect(() => {
    runSeoChecks();

    const handleConsentChange = () => {
      setConsentStatus(getAnalyticsConsent());
    };
    window.addEventListener('dnb_cookie_consent_changed', handleConsentChange);
    return () => {
      window.removeEventListener('dnb_cookie_consent_changed', handleConsentChange);
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* 1. SECCIÓN DECISIONES DE DIRECCIÓN (PARTE CEO) */}
      <div className="bg-white border border-[#EDE4D7] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold font-serif text-[#26201D] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#521849]" />
              <span>Decisiones de Dirección y Estado de Captación</span>
            </h3>
            <p className="text-xs text-[#574B45]">
              Resumen ejecutivo sobre la visibilidad del portal, analítica externa GA4 y adquisición de asistentes a eventos.
            </p>
          </div>

          {onNavigateToCaptacion && (
            <button
              type="button"
              onClick={onNavigateToCaptacion}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#EDE4D7] text-xs font-semibold text-[#521849] hover:bg-stone-100 transition-colors shadow-2xs shrink-0 cursor-pointer"
            >
              <span>Ver Embudo en Captación y navegación</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 bg-[#FAF8F5] border border-[#EDE4D7] rounded-xl space-y-2">
            <div className="text-xs font-bold text-[#26201D] flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-[#521849]" />
              <span>Telemetría Web Interna</span>
            </div>
            <p className="text-xs text-[#574B45]">
              El sistema propio recopila visitas, aperturas de modal y reservas en base de datos con estricta privacidad (cero PII).
            </p>
          </div>

          <div className="p-4 bg-[#FAF8F5] border border-[#EDE4D7] rounded-xl space-y-2">
            <div className="text-xs font-bold text-[#26201D] flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-[#521849]" />
              <span>Google Analytics 4 (GA4)</span>
            </div>
            <p className="text-xs text-[#574B45]">
              {gaMeasurementId ? (
                <>Integrado con ID <strong className="font-mono text-[#521849]">{gaMeasurementId}</strong> y condicionado a la aceptación previa de cookies analíticas por el usuario.</>
              ) : (
                <>Listo para conectarse en cuanto se asigne la variable <code className="font-mono text-[11px]">VITE_GA_MEASUREMENT_ID</code>.</>
              )}
            </p>
          </div>

          <div className="p-4 bg-[#FAF8F5] border border-[#EDE4D7] rounded-xl space-y-2">
            <div className="text-xs font-bold text-[#26201D] flex items-center gap-1.5">
              <Search className="w-4 h-4 text-[#521849]" />
              <span>Indexabilidad Técnica</span>
            </div>
            <p className="text-xs text-[#574B45]">
              Archivos <code className="font-mono text-[11px]">robots.txt</code> y <code className="font-mono text-[11px]">sitemap.xml</code> servidos y listos para rastreo por Google.
            </p>
          </div>
        </div>
      </div>

      {/* 2. INTEGRACIONES DE ANALÍTICA EXTERNA (GA4 & SEARCH CONSOLE) */}
      <div className="bg-white border border-[#EDE4D7] rounded-2xl p-6 shadow-xs space-y-4">
        <h4 className="text-sm font-bold font-serif text-[#26201D] flex items-center gap-2">
          <Globe className="w-4 h-4 text-[#521849]" />
          <span>Servicios y Plataformas Externas de Medición</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* GA4 Card */}
          <div className="p-4 bg-[#FAF8F5] border border-[#EDE4D7] rounded-xl space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#26201D]">Google Analytics 4 (GA4)</span>
                {gaMeasurementId ? (
                  <MetricStatusBadge state="real" label="Configurado" />
                ) : (
                  <MetricStatusBadge state="unconfigured" label="Sin configurar" />
                )}
              </div>
              <p className="text-xs text-[#574B45] leading-relaxed">
                Medición de tráfico, embudo y eventos enriquecidos (<code className="font-mono text-[10px]">page_view</code>, <code className="font-mono text-[10px]">view_item</code>, <code className="font-mono text-[10px]">sign_up</code>, <code className="font-mono text-[10px]">purchase</code>).
              </p>
              {gaMeasurementId && (
                <div className="mt-2.5 flex items-center gap-2 text-xs">
                  <span className="text-[#574B45]">Measurement ID:</span>
                  <span className="font-mono font-bold text-[#521849] bg-white px-2 py-0.5 rounded border border-[#EDE4D7]">
                    {gaMeasurementId}
                  </span>
                </div>
              )}
            </div>

            <div className="text-[11px] text-stone-500 pt-2 border-t border-stone-200/60 flex items-center justify-between">
              <span>Consentimiento actual: <strong>{consentStatus === 'accepted' ? 'Aceptado' : consentStatus === 'rejected' ? 'Rechazado' : 'Pendiente'}</strong></span>
              <span className="flex items-center gap-1 text-emerald-700">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Cero PII</span>
              </span>
            </div>
          </div>

          {/* Search Console Card */}
          <div className="p-4 bg-[#FAF8F5] border border-[#EDE4D7] rounded-xl space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#26201D]">Google Search Console</span>
                <MetricStatusBadge state="unconfigured" label="Sin configurar" />
              </div>
              <p className="text-xs text-[#574B45]">
                Supervisión de clics en resultados orgánicos de Google, errores de rastreo e indexación de páginas públicas.
              </p>
            </div>
            <div className="text-[11px] text-stone-500 pt-2 border-t border-stone-200/60">
              Estado: Pendiente de verificar propiedad en Google Search Console tras asignar el dominio.
            </div>
          </div>
        </div>
      </div>

      {/* 3. GUÍA DE PRUEBA Y VERIFICACIÓN CON REALTIME Y TAG ASSISTANT */}
      <div className="bg-white border border-[#EDE4D7] rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F6F1EA] pb-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold font-serif text-[#26201D] flex items-center gap-2">
              <PlayCircle className="w-4 h-4 text-[#521849]" />
              <span>Guía de Verificación y Pruebas en Vivo (GA4 Realtime & Tag Assistant)</span>
            </h4>
            <p className="text-xs text-[#574B45]">
              Procedimiento paso a paso para comprobar la inyección condicional de la etiqueta y el registro de eventos.
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-[#FAF8F5] border border-[#EDE4D7] rounded-xl self-start sm:self-center">
            <button
              type="button"
              onClick={() => setActiveGuideTab('realtime')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeGuideTab === 'realtime'
                  ? 'bg-white text-[#521849] shadow-2xs'
                  : 'text-[#574B45] hover:text-[#26201D]'
              }`}
            >
              1. En Tiempo Real
            </button>
            <button
              type="button"
              onClick={() => setActiveGuideTab('tagassistant')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeGuideTab === 'tagassistant'
                  ? 'bg-white text-[#521849] shadow-2xs'
                  : 'text-[#574B45] hover:text-[#26201D]'
              }`}
            >
              2. Tag Assistant & Debug
            </button>
            <button
              type="button"
              onClick={() => setActiveGuideTab('events')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeGuideTab === 'events'
                  ? 'bg-white text-[#521849] shadow-2xs'
                  : 'text-[#574B45] hover:text-[#26201D]'
              }`}
            >
              3. Eventos y Cero PII
            </button>
          </div>
        </div>

        {/* Tab 1: Realtime */}
        {activeGuideTab === 'realtime' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EDE4D7] space-y-2">
                <span className="text-xs font-bold text-[#521849]">Paso A: Aceptar Banner</span>
                <p className="text-xs text-[#574B45] leading-relaxed">
                  Abre la web en una pestaña normal o de incógnito. Asegúrate de pulsar <strong>«Aceptar analíticas»</strong> en el banner inferior. Hasta ese momento, no se inyecta ninguna etiqueta ni se emiten datos.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EDE4D7] space-y-2">
                <span className="text-xs font-bold text-[#521849]">Paso B: Abrir GA4 Realtime</span>
                <p className="text-xs text-[#574B45] leading-relaxed">
                  Entra en tu consola de <strong>Google Analytics</strong> &gt; sección <strong>Informes</strong> &gt; <strong>En tiempo real</strong> (Realtime). Verás aparecer el usuario activo en los últimos 30 minutos.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EDE4D7] space-y-2">
                <span className="text-xs font-bold text-[#521849]">Paso C: Navegar por la SPA</span>
                <p className="text-xs text-[#574B45] leading-relaxed">
                  Haz clic entre <code className="text-[11px] font-mono">/catas</code>, <code className="text-[11px] font-mono">/cursos</code> y <code className="text-[11px] font-mono">/conocenos</code>. En la tarjeta de «Vistas por título de página y pantalla» se registrará cada cambio de ruta inmediatamente.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Tag Assistant */}
        {activeGuideTab === 'tagassistant' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EDE4D7] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ActivityIcon className="w-4 h-4 text-[#521849]" />
                  <span className="text-xs font-bold text-[#26201D]">Depuración con Google Tag Assistant (tagassistant.google.com)</span>
                </div>
                <a
                  href="https://tagassistant.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#521849] hover:underline"
                >
                  <span>Abrir Tag Assistant</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <ol className="list-decimal list-inside space-y-2 text-xs text-[#574B45] leading-relaxed">
                <li>Visita <strong className="text-[#26201D]">tagassistant.google.com</strong> y pulsa en <em>Add Domain</em>.</li>
                <li>Introduce la URL de tu aplicación (por ejemplo la URL pública de Cloud Run o dominio propio) y pulsa <em>Connect</em>.</li>
                <li>En la ventana conectada, acepta las cookies analíticas.</li>
                <li>Observa en Tag Assistant cómo se carga el contenedor <code className="font-mono text-[11px] text-[#521849]">{gaMeasurementId || 'G-XXXXXXXXXX'}</code> y se sincronizan los eventos en tiempo real con <strong>DebugView</strong> de GA4.</li>
              </ol>
            </div>
          </div>
        )}

        {/* Tab 3: Events & Zero PII */}
        {activeGuideTab === 'events' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3 bg-[#FAF8F5] border border-[#EDE4D7] rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#26201D]">
                  <Eye className="w-3.5 h-3.5 text-[#521849]" />
                  <span>page_view</span>
                </div>
                <p className="text-[11px] text-[#574B45]">
                  Se dispara en cada transición de ruta en la SPA con <code className="font-mono text-[10px]">page_path</code> y <code className="font-mono text-[10px]">page_title</code>.
                </p>
              </div>

              <div className="p-3 bg-[#FAF8F5] border border-[#EDE4D7] rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#26201D]">
                  <Sparkles className="w-3.5 h-3.5 text-[#521849]" />
                  <span>view_item</span>
                </div>
                <p className="text-[11px] text-[#574B45]">
                  Al entrar a la ficha de una cata o curso con <code className="font-mono text-[10px]">item_id</code>, <code className="font-mono text-[10px]">item_name</code> y <code className="font-mono text-[10px]">price</code>.
                </p>
              </div>

              <div className="p-3 bg-[#FAF8F5] border border-[#EDE4D7] rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#26201D]">
                  <UserPlus className="w-3.5 h-3.5 text-[#521849]" />
                  <span>sign_up</span>
                </div>
                <p className="text-[11px] text-[#574B45]">
                  Al abrir el modal para reservar o apuntarse a lista de espera (<code className="font-mono text-[10px]">method: modal_reserva</code>).
                </p>
              </div>

              <div className="p-3 bg-[#FAF8F5] border border-[#EDE4D7] rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#26201D]">
                  <ShoppingCart className="w-3.5 h-3.5 text-[#521849]" />
                  <span>purchase</span>
                </div>
                <p className="text-[11px] text-[#574B45]">
                  Exclusivamente <strong>después</strong> de que el servidor confirme la reserva (<code className="font-mono text-[10px]">transaction_id</code>, <code className="font-mono text-[10px]">value</code>, <code className="font-mono text-[10px]">items</code>).
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-900 space-y-0.5">
                <span className="font-bold">Garantía de Privacidad y Cero PII:</span>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Ningún parámetro de evento en GA4 contiene nombres de asistentes, direcciones de correo electrónico, números de teléfono ni notas personales. Todos los identificadores son puramente numéricos/alfanuméricos de actividades y transacciones.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. SALUD SEO TÉCNICA (ON-PAGE & INDEXABILIDAD) */}
      <div className="bg-white border border-[#EDE4D7] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold font-serif text-[#26201D] flex items-center gap-2">
            <Search className="w-4 h-4 text-[#521849]" />
            <span>Salud SEO Técnica e Indexabilidad en Buscadores</span>
          </h4>
          <button
            type="button"
            onClick={runSeoChecks}
            className="p-1.5 rounded-lg text-[#574B45] hover:text-[#26201D] hover:bg-stone-100 transition-colors cursor-pointer"
            title="Volver a comprobar SEO"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {seoChecks.map((item) => (
            <div
              key={item.id}
              className="p-3.5 bg-[#FAF8F5] border border-[#EDE4D7] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3 min-w-0">
                {item.status === 'real' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : item.status === 'unconfigured' ? (
                  <HelpCircle className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                ) : item.status === 'checking' ? (
                  <RefreshCw className="w-4 h-4 text-stone-400 animate-spin shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5 min-w-0">
                  <div className="text-xs font-bold text-[#26201D]">{item.label}</div>
                  <div className="text-[11px] text-[#574B45]">{item.description}</div>
                  {item.detail && (
                    <div className="text-[11px] font-mono text-stone-600 truncate mt-0.5">
                      {item.detail}
                    </div>
                  )}
                </div>
              </div>

              <div className="shrink-0 self-end sm:self-center">
                <MetricStatusBadge 
                  state={item.status === 'real' ? 'real' : item.status === 'checking' ? 'nodata' : item.status === 'unconfigured' ? 'unconfigured' : 'error'} 
                  label={item.statusLabel}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

