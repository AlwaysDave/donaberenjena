import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useGeminiHealth } from '../../hooks/useGeminiHealth';
import { buildInfo } from '../../config/buildInfo';
import { 
  Server, 
  Database, 
  Cloud, 
  BrainCircuit, 
  Globe, 
  HardDrive, 
  Activity, 
  Users, 
  ShieldCheck,
  Zap,
  MousePointerClick,
  Filter,
  BarChart3,
  Wifi,
  Search,
  AlertTriangle
} from 'lucide-react';

export const ITMetricsDashboard: React.FC = () => {
  const { activities, members, participants, isConnected } = useData();
  const { status: geminiStatus, latency: geminiLatency, errorMsg: geminiError } = useGeminiHealth();
  const isGeminiConnected = geminiStatus === 'ok' ? true : geminiStatus === 'checking' ? null : false;

  const totalDocuments = activities.length + members.length + participants.length;
  // Storage is unconnected, show NULL
  const estimatedStorageMB = null; 

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold font-serif text-[#26201D] flex items-center gap-2">
            <Server className="w-5 h-5 text-[#521849]" />
            <span>Panel de Control IT & Telemetría</span>
          </h3>
          <p className="text-xs text-[#574B45] mt-0.5">
            Monitorización de estado de servicios, infraestructura y embudo de tráfico web.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Sistemas Operativos</span>
        </div>
      </div>

      {/* Block 1: Salud de Servicios & Conexiones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-5 rounded-2xl bg-white border ${isConnected ? 'border-[#EDE4D7]' : 'border-rose-200'} shadow-xs hover:border-[#DFD3C2] transition-colors relative overflow-hidden`}>
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Database className={`w-16 h-16 ${isConnected ? 'text-emerald-900' : 'text-rose-900'}`} />
          </div>
          <div className="flex items-center justify-between text-[#574B45] mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Base de Datos</span>
            <Database className={`w-4 h-4 ${isConnected ? 'text-emerald-600' : 'text-rose-600'}`} />
          </div>
          <div className="flex items-end gap-2">
            <span className="text-xl font-bold font-serif text-[#26201D]">Firebase Firestore</span>
          </div>
          <div className="flex items-center justify-between mt-3">
            {isConnected ? (
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Wifi className="w-3 h-3" /> Conectado (Real)
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Sin conexión
              </span>
            )}
            <span className="text-[10px] text-stone-400 font-mono font-bold">Latencia: {isConnected ? '< 50ms' : 'NULL'}</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#EDE4D7] shadow-xs hover:border-[#DFD3C2] transition-colors relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <HardDrive className="w-16 h-16 text-blue-900" />
          </div>
          <div className="flex items-center justify-between text-[#574B45] mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Almacenamiento</span>
            <Cloud className="w-4 h-4 text-stone-400" />
          </div>
          <div className="flex items-end gap-2">
            <span className="text-xl font-bold font-serif text-[#26201D]">Firebase Storage</span>
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-[11px] font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Sin conexión
            </span>
            <span className="text-[10px] text-stone-400 font-mono font-bold">NULL GB</span>
          </div>
        </div>

        <div className={`p-5 rounded-2xl bg-white border ${isGeminiConnected ? 'border-[#EDE4D7]' : 'border-rose-200'} shadow-xs hover:border-[#DFD3C2] transition-colors relative overflow-hidden`}>
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <BrainCircuit className={`w-16 h-16 ${isGeminiConnected ? 'text-amber-900' : 'text-rose-900'}`} />
          </div>
          <div className="flex items-center justify-between text-[#574B45] mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Motor de IA (Gemini)</span>
            <BrainCircuit className={`w-4 h-4 ${isGeminiConnected ? 'text-amber-600' : (isGeminiConnected === null ? 'text-stone-400' : 'text-rose-600')}`} />
          </div>
          <div className="flex items-end gap-2">
            <span className="text-xl font-bold font-serif text-[#26201D]">Google AI API</span>
          </div>
          <div className="flex items-center justify-between mt-3">
            {isGeminiConnected ? (
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Zap className="w-3 h-3" /> Configuración disponible
              </span>
            ) : isGeminiConnected === null ? (
              <span className="text-[11px] font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                Comprobando...
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full flex items-center gap-1" title={geminiError || undefined}>
                <AlertTriangle className="w-3 h-3" /> {geminiError || 'Sin configurar'}
              </span>
            )}
            <span className="text-[10px] text-stone-400 font-mono font-bold">
              Latencia: {geminiLatency !== null ? `${geminiLatency}ms` : 'NULL'}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#521849] border border-[#3E1037] shadow-xs text-white relative overflow-hidden" title="Identificador del commit que generó este despliegue">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Server className="w-16 h-16 text-white" />
          </div>
          <div className="flex items-center justify-between text-[#DFD3C2] mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Entorno App</span>
            <Globe className="w-4 h-4 text-[#DFD3C2]" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xl font-bold font-serif text-white capitalize">{buildInfo.environment}</span>
            <span className="text-xs text-[#DFD3C2] font-medium" title="Identificador del commit que generó este despliegue">
              Versión desplegada: <strong className="text-white font-mono">{buildInfo.shortSha || 'Local / sin despliegue Git'}</strong>
            </span>
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-[11px] font-semibold text-[#521849] bg-white/90 px-2 py-0.5 rounded-full flex items-center gap-1 max-w-[120px] truncate" title={buildInfo.branch || 'Local'}>
              Rama: {buildInfo.branch || 'Local'}
            </span>
            <span className="text-[10px] text-[#DFD3C2] font-mono font-bold">Uptime: NULL</span>
          </div>
        </div>
      </div>

      {/* Block 2: Tráfico y Embudo Web */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Embudo de Conversión */}
        <div className="bg-white rounded-3xl border border-[#EDE4D7] p-6 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-serif font-bold text-base text-[#26201D] flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#521849]" />
              <span>Embudo de Conversión (Últimos 30 días)</span>
            </h4>
          </div>
          
          <div className="space-y-4">
            {/* Step 1 */}
            <div className="relative">
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-[#574B45]">Visitantes Únicos (Web)</span>
                <span className="text-stone-400 font-mono font-bold">NULL</span>
              </div>
              <div className="h-4 w-full bg-[#F6F1EA] rounded-full overflow-hidden">
                <div className="h-full bg-stone-300 w-0 rounded-full transition-all duration-1000"></div>
              </div>
            </div>
            
            {/* Step 2 */}
            <div className="relative pl-4">
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-[#574B45] flex items-center gap-1">
                  <span className="w-px h-6 bg-[#EDE4D7] absolute left-2 -top-4"></span>
                  Visualizaciones de Actividad (Click en ficha)
                </span>
                <span className="text-stone-400 font-mono font-bold">NULL</span>
              </div>
              <div className="h-4 w-full bg-[#F6F1EA] rounded-full overflow-hidden">
                <div className="h-full bg-stone-300 w-0 rounded-full transition-all duration-1000"></div>
              </div>
              <div className="text-[10px] text-stone-400 font-bold text-right mt-0.5">Sin conexión a Analytics</div>
            </div>

            {/* Step 3 */}
            <div className="relative pl-8">
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-[#574B45] flex items-center gap-1">
                  <span className="w-px h-6 bg-[#EDE4D7] absolute left-6 -top-4"></span>
                  Inicios de Reserva (Intentos)
                </span>
                <span className="text-stone-400 font-mono font-bold">NULL</span>
              </div>
              <div className="h-4 w-full bg-[#F6F1EA] rounded-full overflow-hidden">
                <div className="h-full bg-stone-300 w-0 rounded-full transition-all duration-1000"></div>
              </div>
              <div className="text-[10px] text-stone-400 font-bold text-right mt-0.5">Sin conexión a Analytics</div>
            </div>

            {/* Step 4 */}
            <div className="relative pl-12">
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-[#521849] flex items-center gap-1">
                  <span className="w-px h-6 bg-[#EDE4D7] absolute left-10 -top-4"></span>
                  Reservas Confirmadas (Real)
                </span>
                <span className="text-[#521849] font-black">{participants.length}</span>
              </div>
              <div className="h-4 w-full bg-[#F6F1EA] rounded-full overflow-hidden">
                <div className="h-full bg-[#521849] w-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(82,24,73,0.3)]"></div>
              </div>
              <div className="text-[10px] font-bold text-stone-400 text-right mt-0.5">
                Tasa de conversión global: NULL
              </div>
            </div>
          </div>
        </div>

        {/* Tráfico por página y búsquedas */}
        <div className="bg-white rounded-3xl border border-[#EDE4D7] p-6 shadow-xs flex flex-col gap-6">
          <div>
            <h4 className="font-serif font-bold text-base text-[#26201D] flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-[#521849]" />
              <span>Páginas más visitadas</span>
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs border-b border-[#F6F1EA] pb-2">
                <span className="font-medium text-[#26201D]">/catas (Calendario Catas)</span>
                <span className="font-mono font-bold text-stone-400">NULL</span>
              </div>
              <div className="flex items-center justify-between text-xs border-b border-[#F6F1EA] pb-2">
                <span className="font-medium text-[#26201D]">/instalaciones</span>
                <span className="font-mono font-bold text-stone-400">NULL</span>
              </div>
              <div className="flex items-center justify-between text-xs border-b border-[#F6F1EA] pb-2">
                <span className="font-medium text-[#26201D]">/cursos</span>
                <span className="font-mono font-bold text-stone-400">NULL</span>
              </div>
              <div className="flex items-center justify-between text-xs pb-1">
                <span className="font-medium text-[#26201D]">/contacto</span>
                <span className="font-mono font-bold text-stone-400">NULL</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-serif font-bold text-base text-[#26201D] flex items-center gap-2 mb-3">
              <Search className="w-4 h-4 text-[#521849]" />
              <span>Top Búsquedas & Filtros IA</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-[#F6F1EA] border border-[#EDE4D7] rounded-full text-[11px] font-bold text-stone-400 font-mono">
                NULL (Sin conexión a Analytics)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Block 3: Rendimiento y Capacidad */}
      <div className="bg-white rounded-3xl border border-[#EDE4D7] p-6 shadow-xs">
        <h4 className="font-serif font-bold text-base text-[#26201D] flex items-center gap-2 mb-6">
          <Activity className="w-4 h-4 text-[#521849]" />
          <span>Métricas de Base de Datos y Almacenamiento</span>
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Docs Count */}
          <div className="space-y-4 col-span-1 lg:col-span-2">
            <h5 className="text-xs font-bold uppercase tracking-wider text-[#574B45] mb-2">Documentos (Estado Real)</h5>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#FCFAF7] p-3 rounded-xl border border-[#EDE4D7]">
                <span className="text-[10px] uppercase text-[#8C7E77] block mb-1">Actividades</span>
                <span className="text-xl font-mono font-bold text-[#26201D]">{activities.length}</span>
              </div>
              <div className="bg-[#FCFAF7] p-3 rounded-xl border border-[#EDE4D7]">
                <span className="text-[10px] uppercase text-[#8C7E77] block mb-1">Socios (Censo)</span>
                <span className="text-xl font-mono font-bold text-[#26201D]">{members.length}</span>
              </div>
              <div className="bg-[#FCFAF7] p-3 rounded-xl border border-[#EDE4D7]">
                <span className="text-[10px] uppercase text-[#8C7E77] block mb-1">Reservas Totales</span>
                <span className="text-xl font-mono font-bold text-[#26201D]">{participants.length}</span>
              </div>
              <div className="bg-[#FCFAF7] p-3 rounded-xl border border-[#EDE4D7]">
                <span className="text-[10px] uppercase text-[#8C7E77] block mb-1">Documentos Totales</span>
                <span className="text-xl font-mono font-bold text-[#521849]">{totalDocuments}</span>
              </div>
            </div>
          </div>

          {/* Storage Bar */}
          <div className="space-y-4 col-span-1 lg:col-span-2">
            <h5 className="text-xs font-bold uppercase tracking-wider text-[#574B45] mb-2">Desglose de Almacenamiento (Real)</h5>
            <div className="bg-[#FCFAF7] p-4 rounded-xl border border-[#EDE4D7]">
              <div className="flex justify-between items-end mb-3">
                <span className="text-2xl font-mono font-bold text-stone-400">NULL GB</span>
                <span className="text-xs font-medium text-[#8C7E77]">Requiere Firebase Storage</span>
              </div>
              
              {/* Stacked Bar Empty State */}
              <div className="flex h-3 w-full bg-[#EDE4D7] rounded-full overflow-hidden mb-4">
                <div className="bg-stone-300 h-full w-full" title="Sin conexión"></div>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-[10px] font-medium text-stone-400 font-bold">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-stone-300"></div>
                  <span>Imágenes HD (Actividades) - Desconectado</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-stone-300"></div>
                  <span>Comprobantes/PDFs - Desconectado</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

