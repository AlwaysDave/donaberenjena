import React, { useState } from 'react';
import { 
  Server, 
  Database, 
  BrainCircuit, 
  HardDrive, 
  ShieldCheck, 
  Wifi, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  RefreshCw, 
  HelpCircle, 
  FileCode, 
  Tag, 
  GitBranch, 
  Layers, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { useGeminiHealth } from '../../../hooks/useGeminiHealth';
import { buildInfo, appVersion } from '../../../config/buildInfo';
import { MetricStatusBadge } from './MetricStatusBadge';

interface TabTecnologiaProps {
  isConnected: boolean;
  useMockData: boolean;
  connectionError?: string | null;
  activitiesCount: number;
  membersCount: number;
  participantsCount: number;
  expensesCount: number;
  sponsorshipsCount: number;
  messagesCount: number;
}

export const TabTecnologia: React.FC<TabTecnologiaProps> = ({
  isConnected,
  useMockData,
  connectionError,
  activitiesCount,
  membersCount,
  participantsCount,
  expensesCount,
  sponsorshipsCount,
  messagesCount
}) => {
  const { 
    status: geminiStatus, 
    latency: geminiLatency, 
    errorMsg: geminiError, 
    message: geminiMessage,
    lastChecked: geminiLastChecked,
    recheck: recheckGemini 
  } = useGeminiHealth();

  const [isRechecking, setIsRechecking] = useState(false);

  const handleRecheck = async () => {
    setIsRechecking(true);
    await recheckGemini();
    setIsRechecking(false);
  };

  const totalDocuments = activitiesCount + membersCount + participantsCount + expensesCount + sponsorshipsCount + messagesCount;
  const formattedVersion = appVersion.startsWith('v') ? appVersion : `v${appVersion}`;

  return (
    <div className="space-y-6">
      {/* Disclaimer / Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FBF9F5] border border-[#EDE4D7] rounded-xl p-4">
        <div>
          <h4 className="text-sm font-bold text-[#26201D]">Infraestructura y Salud del Sistema</h4>
          <p className="text-xs text-[#574B45]">
            Supervisión del estado de conexión de la base de datos, backend Express y disponibilidad del servicio Gemini.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRecheck}
          disabled={isRechecking}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#EDE4D7] bg-white text-xs font-semibold text-[#26201D] hover:bg-stone-50 transition-colors shadow-2xs cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRechecking ? 'animate-spin text-[#521849]' : 'text-stone-500'}`} />
          <span>Comprobar Gemini</span>
        </button>
      </div>

      {/* Grid de Servicios Principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Base de Datos: Firestore */}
        <div className="p-5 rounded-2xl bg-white border border-[#EDE4D7] shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[#574B45] mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">Base de Datos</span>
              <Database className={`w-4 h-4 ${isConnected && !useMockData ? 'text-emerald-600' : 'text-stone-400'}`} />
            </div>
            <div className="text-xl font-bold font-serif text-[#26201D]">Firebase Firestore</div>
            <p className="text-xs text-[#574B45] mt-1">Almacenamiento NoSQL en tiempo real y persistencia en la nube</p>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 space-y-2">
            <div className="flex items-center justify-between">
              <MetricStatusBadge 
                state={useMockData ? 'demo' : isConnected ? 'real' : 'error'} 
                label={useMockData ? 'Modo Demo (Local)' : isConnected ? 'Conectado (Real)' : 'Sin Conexión'}
              />
              <span className="text-[11px] font-mono text-stone-500">
                {useMockData ? 'En memoria' : isConnected ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            {connectionError && !useMockData && (
              <div className="text-[11px] text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200">
                {connectionError}
              </div>
            )}
          </div>
        </div>

        {/* 2. Servicio de Inteligencia Artificial: Gemini */}
        <div className="p-5 rounded-2xl bg-white border border-[#EDE4D7] shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[#574B45] mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">Motor de IA</span>
              <BrainCircuit className={`w-4 h-4 ${geminiStatus === 'configured' ? 'text-blue-600' : 'text-stone-400'}`} />
            </div>
            <div className="text-xl font-bold font-serif text-[#26201D]">Google Gemini</div>
            <p className="text-xs text-[#574B45] mt-1">
              Extracción asistida de datos a partir de cartelería y fichas técnicas
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 space-y-1.5">
            <div className="flex items-center justify-between">
              {geminiStatus === 'configured' ? (
                <MetricStatusBadge state="configured" label="Configurado" source="GEMINI_API_KEY" />
              ) : geminiStatus === 'not_configured' ? (
                <MetricStatusBadge state="unconfigured" label="Sin configurar" />
              ) : geminiStatus === 'checking' ? (
                <MetricStatusBadge state="nodata" label="Comprobando..." />
              ) : (
                <MetricStatusBadge state="error" label="Error de servicio" />
              )}
              <span className="text-[11px] font-mono text-stone-500">
                {geminiLatency !== null ? `${geminiLatency} ms` : '—'}
              </span>
            </div>
            <div className="text-[10px] text-stone-500">
              {geminiLatency !== null ? 'Tiempo de respuesta de comprobación' : 'Estado en servidor'}
            </div>
          </div>
        </div>

        {/* 3. Almacenamiento de Archivos: Firebase Storage */}
        <div className="p-5 rounded-2xl bg-white border border-[#EDE4D7] shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[#574B45] mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">Almacenamiento CDN</span>
              <HardDrive className="w-4 h-4 text-stone-400" />
            </div>
            <div className="text-xl font-bold font-serif text-[#26201D]">Firebase Storage</div>
            <p className="text-xs text-[#574B45] mt-1">Imágenes de actividades y documentos adjuntos</p>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 space-y-1.5">
            <div className="flex items-center justify-between">
              <MetricStatusBadge state="unconfigured" label="Sin configurar (URLs externas)" />
              <span className="text-[11px] font-mono text-stone-400">N/A</span>
            </div>
            <div className="text-[10px] text-stone-500">
              Capacidad: Uso no medido
            </div>
          </div>
        </div>
      </div>

      {/* Panel de Volumetría y Colecciones */}
      <div className="bg-white border border-[#EDE4D7] rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-bold font-serif text-[#26201D] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#521849]" />
            <span>Registros cargados ({totalDocuments} totales)</span>
          </h4>
          <span className="text-xs text-[#574B45]">
            {useMockData ? 'Fuente: Colección en memoria Demo' : 'Fuente: Firestore Data Provider'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EDE4D7]">
            <div className="text-[11px] text-[#574B45] font-semibold uppercase">Actividades</div>
            <div className="text-xl font-bold font-serif text-[#26201D] mt-1">{activitiesCount}</div>
            <div className="text-[10px] text-stone-400 mt-1">Colección 'activities'</div>
          </div>

          <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EDE4D7]">
            <div className="text-[11px] text-[#574B45] font-semibold uppercase">Participantes</div>
            <div className="text-xl font-bold font-serif text-[#26201D] mt-1">{participantsCount}</div>
            <div className="text-[10px] text-stone-400 mt-1">Colección 'participants'</div>
          </div>

          <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EDE4D7]">
            <div className="text-[11px] text-[#574B45] font-semibold uppercase">Socios Censo</div>
            <div className="text-xl font-bold font-serif text-[#26201D] mt-1">{membersCount}</div>
            <div className="text-[10px] text-stone-400 mt-1">Colección 'members'</div>
          </div>

          <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EDE4D7]">
            <div className="text-[11px] text-[#574B45] font-semibold uppercase">Gastos</div>
            <div className="text-xl font-bold font-serif text-[#26201D] mt-1">{expensesCount}</div>
            <div className="text-[10px] text-stone-400 mt-1">Colección 'expenses'</div>
          </div>

          <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EDE4D7]">
            <div className="text-[11px] text-[#574B45] font-semibold uppercase">Patrocinios</div>
            <div className="text-xl font-bold font-serif text-[#26201D] mt-1">{sponsorshipsCount}</div>
            <div className="text-[10px] text-stone-400 mt-1">Colección 'sponsorships'</div>
          </div>

          <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EDE4D7]">
            <div className="text-[11px] text-[#574B45] font-semibold uppercase">Mensajes Web</div>
            <div className="text-xl font-bold font-serif text-[#26201D] mt-1">{messagesCount}</div>
            <div className="text-[10px] text-stone-400 mt-1">Colección 'contactMessages'</div>
          </div>
        </div>
      </div>

      {/* Información de Versión y Compilación */}
      <div className="bg-white border border-[#EDE4D7] rounded-2xl p-5 shadow-xs">
        <h4 className="text-sm font-bold font-serif text-[#26201D] flex items-center gap-2 mb-3">
          <Tag className="w-4 h-4 text-[#521849]" />
          <span>Información de Compilación y Versión de la Aplicación</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
            <div className="text-[#574B45] font-semibold">Versión de la App</div>
            <div className="text-sm font-bold font-mono text-[#26201D] mt-0.5">{formattedVersion}</div>
          </div>
          <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
            <div className="text-[#574B45] font-semibold">Fecha de Compilación</div>
            <div className="text-sm font-bold font-mono text-[#26201D] mt-0.5">
              {buildInfo.buildDate ? new Date(buildInfo.buildDate).toLocaleString('es-ES') : 'En ejecución local'}
            </div>
          </div>
          <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
            <div className="text-[#574B45] font-semibold">Entorno de Ejecución</div>
            <div className="text-sm font-bold font-mono text-[#26201D] mt-0.5">
              {buildInfo.environment || 'Producción / Cloud'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
