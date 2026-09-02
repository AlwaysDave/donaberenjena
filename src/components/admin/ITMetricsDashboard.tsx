import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { TabCaptacionNavegacion } from './metrics/TabCaptacionNavegacion';
import { TabTecnologia } from './metrics/TabTecnologia';
import { TabCeoSeo } from './metrics/TabCeoSeo';
import { 
  BarChart3, 
  Layers, 
  Server, 
  Globe, 
  Compass,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface ITMetricsDashboardProps {
  onNavigateTab?: (tabId: string) => void;
}

export const ITMetricsDashboard: React.FC<ITMetricsDashboardProps> = () => {
  const { 
    activities, 
    participants, 
    members, 
    expenses, 
    sponsorships, 
    contactMessages, 
    isConnected, 
    useMockData,
    toggleMockData,
    connectionError
  } = useData();

  // Internal 3 sub-tabs: 1. Captación y navegación, 2. Tecnología & Salud, 3. CEO & SEO
  const [activeSubTab, setActiveSubTab] = useState<'captacion' | 'tecnologia' | 'ceo_seo'>('captacion');

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header with Title and Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#EDE4D7] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#521849]" />
            <h3 className="text-lg font-bold font-serif text-[#26201D]">
              Panel Admin IT
            </h3>
          </div>
          <p className="text-xs text-[#574B45] mt-1">
            Supervisión integral: embudo de captación y navegación web, salud de la infraestructura técnica y estado SEO en buscadores.
          </p>
        </div>

        {/* Mode Toggle Button */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-[11px] font-bold text-[#26201D]">
              {useMockData ? 'Modo Demostración Activo' : 'Conectado a Datos Reales'}
            </div>
            <div className="text-[10px] text-[#574B45]">
              {useMockData ? 'Visualizando datos simulados de prueba' : 'Sincronizado con Firebase Firestore'}
            </div>
          </div>
          <button
            type="button"
            onClick={toggleMockData}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-2xs ${
              useMockData
                ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                : 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100'
            }`}
          >
            {useMockData ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Modo Demo</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Modo Real</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sub-tab Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EDE4D7] pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('captacion')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeSubTab === 'captacion'
                ? 'bg-[#521849] text-white shadow-xs'
                : 'bg-white text-[#574B45] hover:bg-[#F6F1EA] border border-[#EDE4D7]'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>1. Captación y navegación</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('tecnologia')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeSubTab === 'tecnologia'
                ? 'bg-[#521849] text-white shadow-xs'
                : 'bg-white text-[#574B45] hover:bg-[#F6F1EA] border border-[#EDE4D7]'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>2. Tecnología & Salud</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('ceo_seo')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeSubTab === 'ceo_seo'
                ? 'bg-[#521849] text-white shadow-xs'
                : 'bg-white text-[#574B45] hover:bg-[#F6F1EA] border border-[#EDE4D7]'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>3. CEO & SEO</span>
          </button>
        </div>
      </div>

      {/* Sub-tab Content Render */}
      {activeSubTab === 'captacion' && (
        <TabCaptacionNavegacion 
          useMockData={useMockData} 
        />
      )}

      {activeSubTab === 'tecnologia' && (
        <TabTecnologia
          isConnected={isConnected}
          useMockData={useMockData}
          connectionError={connectionError}
          activitiesCount={activities.length}
          membersCount={members.length}
          participantsCount={participants.length}
          expensesCount={expenses.length}
          sponsorshipsCount={sponsorships.length}
          messagesCount={contactMessages.length}
        />
      )}

      {activeSubTab === 'ceo_seo' && (
        <TabCeoSeo
          onNavigateToCaptacion={() => setActiveSubTab('captacion')}
        />
      )}
    </div>
  );
};
