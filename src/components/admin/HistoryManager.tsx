import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Participant, Activity } from '../../types';
import { 
  History, 
  Trophy, 
  Sparkles, 
  Search, 
  Download, 
  Filter, 
  UserCheck, 
  Wine, 
  GraduationCap, 
  Compass, 
  CheckCircle, 
  AlertCircle, 
  ArrowUpDown, 
  RefreshCw, 
  X, 
  Check, 
  Calendar,
  Users,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  UserX
} from 'lucide-react';
import { getAdminAuthHeader } from '../../services/authHelper';

interface UnifiedPerson {
  id: string; // generated unique key
  normalizedName: string;
  displayNames: string[];
  email?: string;
  phone?: string;
  isMember: boolean;
  totalAttendances: number;
  cataAttendances: number;
  cursoAttendances: number;
  viajeAttendances: number;
  totalCancelled: number;
  totalNoShows: number;
  totalJustified: number;
  totalUnjustified: number;
  participations: Participant[];
  years: number[];
}

function normalizeText(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}

function isAnonymousName(name: string): boolean {
  const norm = normalizeText(name);
  if (!norm || norm.length < 2) return true;
  const anonTerms = [
    'acompanante', 'acomp', 'invitado', 'invitada', 'sin nombre', 
    'anonimo', 'anonima', 'amigo', 'amiga', 'pareja', 'persona', 
    'asistente', 'familiar', 'participante', 'prueba', 'test', 'socio'
  ];
  return anonTerms.some(term => norm === term || norm.startsWith(term + ' ') || norm.endsWith(' ' + term));
}

export const HistoryManager: React.FC = () => {
  const { activities, participants, members, updateParticipant } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [memberFilter, setMemberFilter] = useState<'all' | 'members' | 'non_members'>('all');
  const [showRankings, setShowRankings] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<UnifiedPerson | null>(null);

  // AI Merging state
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<Array<{ original: string; suggested: string; reason: string; selected: boolean }>>([]);
  const [showAiModal, setShowAiModal] = useState(false);
  const [isApplyingMerges, setIsApplyingMerges] = useState(false);
  const [mergeResult, setMergeResult] = useState<string | null>(null);

  // Extract all distinct years available
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    activities.forEach(a => {
      const year = new Date(a.date).getFullYear();
      if (!isNaN(year)) yearsSet.add(year);
    });
    participants.forEach(p => {
      if (p.createdAt) {
        const year = new Date(p.createdAt).getFullYear();
        if (!isNaN(year)) yearsSet.add(year);
      }
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [activities, participants]);

  // Aggregate and group participants into unique individual records
  const unifiedPeople = useMemo(() => {
    const map = new Map<string, UnifiedPerson>();

    // Index active members by normalized name or email for cross-check
    const memberMap = new Map<string, boolean>();
    members.forEach(m => {
      if (m.email) memberMap.set(m.email.toLowerCase().trim(), m.active);
      memberMap.set(normalizeText(m.fullName), m.active);
    });

    participants.forEach(p => {
      const rawName = (p.fullName || '').trim();
      if (!rawName || isAnonymousName(rawName)) return;

      const normName = normalizeText(rawName);
      const email = p.email ? p.email.toLowerCase().trim() : undefined;
      
      // Determine unique key (prefer normalized name, secondary email)
      const key = normName;

      // Determine activity date / year
      const act = activities.find(a => a.id === p.activityId);
      const actDateStr = act ? act.date : (p.createdAt || '');
      const year = new Date(actDateStr).getFullYear() || new Date().getFullYear();

      // Check if matches year filter
      if (selectedYear !== 'all' && String(year) !== selectedYear) {
        return;
      }

      // Check attendance status
      const attended = p.status === 'asistio' || p.attended === true || (p.status === 'confirmada' && act?.status === 'celebrada');
      const isCancelled = p.status === 'cancelada';
      const isNoShow = p.status === 'no_asistio';
      const isJustified = p.justified === true;

      if (!map.has(key)) {
        // Resolve member status: check census first, then fallback to participant flag
        const isCensusMember = email && memberMap.has(email) ? memberMap.get(email)! : (memberMap.get(normName) ?? p.isMember);

        map.set(key, {
          id: `person-${key}`,
          normalizedName: rawName,
          displayNames: [rawName],
          email: p.email,
          phone: p.phone,
          isMember: isCensusMember,
          totalAttendances: 0,
          cataAttendances: 0,
          cursoAttendances: 0,
          viajeAttendances: 0,
          totalCancelled: 0,
          totalNoShows: 0,
          totalJustified: 0,
          totalUnjustified: 0,
          participations: [],
          years: []
        });
      }

      const record = map.get(key)!;
      if (!record.displayNames.includes(rawName)) {
        record.displayNames.push(rawName);
      }
      if (!record.email && p.email) record.email = p.email;
      if (!record.phone && p.phone) record.phone = p.phone;
      if (!record.years.includes(year)) record.years.push(year);

      record.participations.push(p);

      if (attended) {
        record.totalAttendances += 1;
        const actType = p.activityType || (act ? act.type : 'cata');
        if (actType === 'cata') record.cataAttendances += 1;
        else if (actType === 'curso') record.cursoAttendances += 1;
        else if (actType === 'viaje') record.viajeAttendances += 1;
      } else if (isCancelled) {
        record.totalCancelled += 1;
        if (isJustified) record.totalJustified += 1;
        else record.totalUnjustified += 1;
      } else if (isNoShow) {
        record.totalNoShows += 1;
        if (isJustified) record.totalJustified += 1;
        else record.totalUnjustified += 1;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalAttendances - a.totalAttendances);
  }, [participants, activities, members, selectedYear]);

  // Filter people by search query and member toggle
  const filteredPeople = useMemo(() => {
    const q = (searchQuery || '').toLowerCase().trim();
    return unifiedPeople.filter(person => {
      const matchSearch = !q ||
        (person.normalizedName || '').toLowerCase().includes(q) ||
        person.displayNames.some(d => (d || '').toLowerCase().includes(q)) ||
        (person.email && person.email.toLowerCase().includes(q)) ||
        (person.phone && person.phone.includes(q));

      if (!matchSearch) return false;

      if (memberFilter === 'members') return person.isMember;
      if (memberFilter === 'non_members') return !person.isMember;
      return true;
    });
  }, [unifiedPeople, searchQuery, memberFilter]);

  // Top 10 Active People Ranking
  const topPeopleRanking = useMemo(() => {
    return [...unifiedPeople]
      .sort((a, b) => b.totalAttendances - a.totalAttendances)
      .slice(0, 10);
  }, [unifiedPeople]);

  // Top 10 Popular Activities Ranking
  const topActivitiesRanking = useMemo(() => {
    return activities
      .map(act => {
        const count = participants.filter(p => p.activityId === act.id && (p.attended === true || p.status === 'confirmada')).length;
        const year = new Date(act.date).getFullYear();
        return {
          ...act,
          attendanceCount: count,
          year
        };
      })
      .filter(act => selectedYear === 'all' || String(act.year) === selectedYear)
      .sort((a, b) => b.attendanceCount - a.attendanceCount)
      .slice(0, 10);
  }, [activities, participants, selectedYear]);

  // Export History to CSV
  const handleExportCsv = () => {
    if (filteredPeople.length === 0) return;

    const headers = ['Nombre', 'Email', 'Teléfono', 'Socio', 'Total Asistencias', 'Catas', 'Cursos', 'Viajes'];
    const rows = filteredPeople.map(p => [
      `"${p.normalizedName}"`,
      `"${p.email || ''}"`,
      `"${p.phone || ''}"`,
      `"${p.isMember ? 'Sí' : 'No'}"`,
      p.totalAttendances,
      p.cataAttendances,
      p.cursoAttendances,
      p.viajeAttendances
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `historico-asistentes-${selectedYear === 'all' ? 'todos' : selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // AI Duplicates Analysis Handler
  const handleRunAiAnalysis = async () => {
    setIsAnalyzingAi(true);
    setMergeResult(null);

    try {
      // Gather distinct names
      const distinctNames = Array.from(new Set(participants.map(p => p.fullName.trim()).filter(n => !isAnonymousName(n))));

      if (distinctNames.length < 2) {
        alert('Se requieren al menos 2 nombres registrados para analizar duplicados.');
        setIsAnalyzingAi(false);
        return;
      }

      const authHeaders = await getAdminAuthHeader();
      const res = await fetch('/api/analyze-participants', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...authHeaders
        },
        body: JSON.stringify({ names: distinctNames })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al comunicarse con la IA.');
      }

      const data = await res.json();
      const suggestions = (data.suggestions || []).map((s: any) => ({
        ...s,
        selected: true
      }));

      setAiSuggestions(suggestions);
      setShowAiModal(true);
    } catch (err: any) {
      alert(`No se pudo realizar el análisis de duplicados: ${err.message}`);
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  // Apply selected merges
  const handleApplyMerges = async () => {
    const selectedMerges = aiSuggestions.filter(s => s.selected);
    if (selectedMerges.length === 0) return;

    setIsApplyingMerges(true);
    let updatedCount = 0;

    for (const merge of selectedMerges) {
      const matching = participants.filter(p => normalizeText(p.fullName) === normalizeText(merge.original));
      for (const p of matching) {
        await updateParticipant(p.id, { fullName: merge.suggested });
        updatedCount++;
      }
    }

    setIsApplyingMerges(false);
    setShowAiModal(false);
    setMergeResult(`Se han actualizado automáticamente los registros en ${updatedCount} fichas diferentes con el nuevo nombre unificado.`);
  };

  const handleToggleJustification = async (participantId: string, currentJustified?: boolean, currentReason?: string) => {
    const nextJustified = !currentJustified;
    let reason = currentReason;
    if (nextJustified && !currentReason) {
      const input = window.prompt('Motivo de la justificación (ej. Médica, Laboral, Fuerza mayor):', 'Justificada por secretaría');
      if (input === null) return; // cancelado por el usuario
      reason = input || 'Justificada por secretaría';
    }
    await updateParticipant(participantId, {
      justified: nextJustified,
      justificationReason: nextJustified ? reason : undefined
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Actions */}
      <div className="bg-white rounded-2xl border border-[#EDE4D7] p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold font-serif text-[#26201D] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#521849]" />
              <span>Participantes e Historial de Asistencia</span>
            </h3>
            <p className="text-xs text-[#574B45] mt-0.5">
              Consolidación de comensales únicos por fidelidad, historial de asistencia, cancelaciones y ausencias justificadas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-ai-analyze-duplicates"
              type="button"
              onClick={handleRunAiAnalysis}
              disabled={isAnalyzingAi}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-semibold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isAnalyzingAi ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-700" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-purple-700" />
              )}
              <span>Sugerir fusiones con IA</span>
            </button>

            <button
              id="btn-toggle-rankings"
              type="button"
              onClick={() => setShowRankings(!showRankings)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold shadow-2xs transition-all cursor-pointer ${
                showRankings 
                  ? 'bg-[#521849] text-white border-[#521849]' 
                  : 'bg-[#FCFAF7] hover:bg-[#F6F1EA] text-[#521849] border-[#EDE4D7]'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>{showRankings ? 'Ocultar Ranking' : 'Generar Ranking'}</span>
            </button>

            <button
              id="btn-export-history-csv"
              type="button"
              onClick={handleExportCsv}
              disabled={filteredPeople.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] hover:bg-[#F6F1EA] text-[#574B45] text-xs font-semibold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>
      </div>

      {mergeResult && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn" onClick={() => setMergeResult(null)}>
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-2xl border border-[#EDE4D7] animate-scaleUp text-center" onClick={e => e.stopPropagation()}>
            <div className="mx-auto w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-serif text-[#26201D] mb-2">¡Fusiones aplicadas!</h3>
            <p className="text-sm text-[#574B45] mb-6">
              {mergeResult}
            </p>
            <button 
              type="button" 
              onClick={() => setMergeResult(null)}
              className="w-full px-5 py-2.5 rounded-xl bg-[#521849] hover:bg-[#3E1037] text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* RANKINGS PANEL (If toggled) */}
      {showRankings && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-fadeIn">
          {/* Top 10 Asistentes Más Fieles */}
          <div className="bg-white rounded-3xl border border-[#EDE4D7] p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#EDE4D7] mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm font-serif text-[#26201D]">
                    Top 10 Asistentes Más Activos
                  </h4>
                  <p className="text-[11px] text-[#574B45]">
                    {selectedYear === 'all' ? 'Histórico global acumulado' : `Año ${selectedYear}`}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-[#521849] px-2.5 py-1 rounded-full bg-[#521849]/10">
                Fidelidad
              </span>
            </div>

            <div className="space-y-2">
              {topPeopleRanking.length === 0 ? (
                <p className="text-xs text-[#8C7E77] text-center py-6">No hay datos de asistencia para este periodo.</p>
              ) : (
                topPeopleRanking.map((p, idx) => (
                  <div 
                    key={p.id}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#FCFAF7] border border-[#EDE4D7]/50 text-xs transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        idx === 0 ? 'bg-amber-400 text-amber-950 shadow-xs' :
                        idx === 1 ? 'bg-stone-300 text-stone-900' :
                        idx === 2 ? 'bg-amber-700 text-white' :
                        'bg-stone-100 text-stone-600'
                      }`}>
                        {idx + 1}
                      </span>
                      <div>
                        <span className="font-bold text-[#26201D] block">{p.normalizedName}</span>
                        <div className="flex items-center gap-2 text-[10px] text-[#574B45]">
                          <span>{p.isMember ? '⭐ Socio' : 'Tarifa General'}</span>
                          <span>•</span>
                          <span>{p.cataAttendances} catas, {p.cursoAttendances} cursos, {p.viajeAttendances} viajes</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-bold font-mono text-sm text-[#521849]">
                        {p.totalAttendances}
                      </span>
                      <span className="text-[10px] text-[#8C7E77] block">asistencias</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top 10 Actividades Más Populares */}
          <div className="bg-white rounded-3xl border border-[#EDE4D7] p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#EDE4D7] mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-800">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm font-serif text-[#26201D]">
                    Top 10 Actividades Más Concurridas
                  </h4>
                  <p className="text-[11px] text-[#574B45]">
                    {selectedYear === 'all' ? 'Ranking histórico' : `Año ${selectedYear}`}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-purple-900 px-2.5 py-1 rounded-full bg-purple-100">
                Afluencia
              </span>
            </div>

            <div className="space-y-2">
              {topActivitiesRanking.length === 0 ? (
                <p className="text-xs text-[#8C7E77] text-center py-6">No hay actividades en este periodo.</p>
              ) : (
                topActivitiesRanking.map((act, idx) => (
                  <div 
                    key={act.id}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#FCFAF7] border border-[#EDE4D7]/50 text-xs transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        idx === 0 ? 'bg-amber-400 text-amber-950 shadow-xs' :
                        idx === 1 ? 'bg-stone-300 text-stone-900' :
                        idx === 2 ? 'bg-amber-700 text-white' :
                        'bg-stone-100 text-stone-600'
                      }`}>
                        {idx + 1}
                      </span>
                      <div>
                        <span className="font-bold text-[#26201D] block truncate max-w-[200px] sm:max-w-xs">{act.title}</span>
                        <div className="flex items-center gap-2 text-[10px] text-[#574B45]">
                          <span className="capitalize">{act.type}</span>
                          <span>•</span>
                          <span>{act.date}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-bold font-mono text-sm text-purple-900">
                        {act.attendanceCount} / {act.totalSpots}
                      </span>
                      <span className="text-[10px] text-[#8C7E77] block">asistieron</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="bg-white rounded-2xl border border-[#EDE4D7] p-4 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-[#8C7E77] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, email o teléfono en el histórico..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[#EDE4D7] bg-[#FCFAF7] text-xs focus:outline-none focus:border-[#521849] focus:bg-white"
            />
          </div>

          {/* Filters: Year & Member status */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Year Selector */}
            <div className="flex items-center gap-1.5 bg-[#FCFAF7] border border-[#EDE4D7] px-2.5 py-1.5 rounded-xl text-xs">
              <Calendar className="w-3.5 h-3.5 text-[#521849]" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-transparent text-xs font-semibold text-[#26201D] focus:outline-none cursor-pointer"
              >
                <option value="all">Todos los años</option>
                {availableYears.map(y => (
                  <option key={y} value={String(y)}>Año {y}</option>
                ))}
              </select>
            </div>

            {/* Member Status Filter */}
            <div className="inline-flex p-1 rounded-xl bg-[#FCFAF7] border border-[#EDE4D7]">
              <button
                type="button"
                onClick={() => setMemberFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  memberFilter === 'all' ? 'bg-[#521849] text-white shadow-2xs' : 'text-[#574B45] hover:text-[#26201D]'
                }`}
              >
                Todos ({unifiedPeople.length})
              </button>
              <button
                type="button"
                onClick={() => setMemberFilter('members')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  memberFilter === 'members' ? 'bg-emerald-700 text-white shadow-2xs' : 'text-[#574B45] hover:text-[#26201D]'
                }`}
              >
                Socios
              </button>
              <button
                type="button"
                onClick={() => setMemberFilter('non_members')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  memberFilter === 'non_members' ? 'bg-stone-700 text-white shadow-2xs' : 'text-[#574B45] hover:text-[#26201D]'
                }`}
              >
                No Socios
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Consolidated Table */}
      <div className="bg-white rounded-3xl border border-[#EDE4D7] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#FCFAF7] border-b border-[#EDE4D7] text-[#574B45] uppercase tracking-wider font-semibold">
                <th className="p-4">Persona / Asistente</th>
                <th className="p-4">Contacto</th>
                <th className="p-4">Condición</th>
                <th className="p-4 text-center">Catas</th>
                <th className="p-4 text-center">Cursos</th>
                <th className="p-4 text-center">Viajes</th>
                <th className="p-4 text-center font-bold text-[#521849]">Total Asistencias</th>
                <th className="p-4 text-right">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE4D7]">
              {filteredPeople.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#8C7E77]">
                    <Users className="w-8 h-8 mx-auto mb-2 text-[#EDE4D7]" />
                    <p className="font-semibold text-sm text-[#574B45]">No hay registros históricos</p>
                    <p className="text-xs mt-1">Prueba a seleccionar otro año o restablecer los filtros de búsqueda.</p>
                  </td>
                </tr>
              ) : (
                filteredPeople.map((person) => (
                  <tr 
                    key={person.id}
                    className="hover:bg-[#FCFAF7] transition-colors cursor-pointer"
                    onClick={() => setSelectedPerson(person)}
                  >
                    {/* Nombre y variantes */}
                    <td className="p-4">
                      <span className="font-bold text-[#26201D] text-sm font-serif">{person.normalizedName}</span>
                      {person.displayNames.length > 1 && (
                        <p className="text-[10px] text-[#8C7E77] italic mt-0.5">
                          Registrado también como: {person.displayNames.filter(n => n !== person.normalizedName).join(', ')}
                        </p>
                      )}
                    </td>

                    {/* Contacto */}
                    <td className="p-4 text-xs text-[#574B45]">
                      {person.email || person.phone ? (
                        <div className="space-y-0.5">
                          {person.email && <div>{person.email}</div>}
                          {person.phone && <div className="text-[11px] text-[#8C7E77]">{person.phone}</div>}
                        </div>
                      ) : (
                        <span className="text-[#8C7E77] italic text-[11px]">Sin contacto</span>
                      )}
                    </td>

                    {/* Condición de socio */}
                    <td className="p-4">
                      {person.isMember ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          <span>Socio</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-stone-100 text-stone-700">
                          <span>Tarifa General</span>
                        </span>
                      )}
                    </td>

                    {/* Breakdown counts */}
                    <td className="p-4 text-center font-mono">
                      <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-900 font-semibold">{person.cataAttendances}</span>
                    </td>
                    <td className="p-4 text-center font-mono">
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-900 font-semibold">{person.cursoAttendances}</span>
                    </td>
                    <td className="p-4 text-center font-mono">
                      <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-900 font-semibold">{person.viajeAttendances}</span>
                    </td>

                    {/* Total Attendances */}
                    <td className="p-4 text-center">
                      <span className="font-bold text-sm font-mono text-[#521849] bg-[#521849]/10 px-2.5 py-1 rounded-full">
                        {person.totalAttendances}
                      </span>
                    </td>

                    {/* Acción / Ver ficha */}
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPerson(person);
                        }}
                        className="p-1.5 rounded-lg hover:bg-[#EDE4D7] text-[#521849] transition-colors cursor-pointer"
                        title="Ver trayectoria de actividades"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Person Trajectory & History Details */}
      {selectedPerson && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#EDE4D7] my-8 animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-[#EDE4D7] mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#521849] text-white flex items-center justify-center font-serif text-lg font-bold">
                  {selectedPerson.normalizedName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold font-serif text-[#26201D] flex items-center gap-2">
                    <span>{selectedPerson.normalizedName}</span>
                    {selectedPerson.isMember && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase">
                        Socio
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-[#574B45]">
                    {selectedPerson.email || 'Sin correo'} {selectedPerson.phone ? `• Tel: ${selectedPerson.phone}` : ''}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPerson(null)}
                className="p-1.5 rounded-xl hover:bg-[#F6F1EA] text-[#574B45] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 text-center">
              <div className="p-3 rounded-2xl bg-[#FCFAF7] border border-[#EDE4D7]">
                <span className="text-[10px] uppercase font-bold text-[#574B45] block">Asistencias</span>
                <span className="text-xl font-bold font-mono text-[#521849]">{selectedPerson.totalAttendances}</span>
              </div>
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-100">
                <span className="text-[10px] uppercase font-bold text-rose-800 block">Catas / Cursos</span>
                <span className="text-xl font-bold font-mono text-rose-900">{selectedPerson.cataAttendances + selectedPerson.cursoAttendances}</span>
              </div>
              <div className="p-3 rounded-2xl bg-teal-50 border border-teal-100">
                <span className="text-[10px] uppercase font-bold text-teal-800 block">Viajes</span>
                <span className="text-xl font-bold font-mono text-teal-900">{selectedPerson.viajeAttendances}</span>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-100">
                <span className="text-[10px] uppercase font-bold text-amber-800 block">Canceladas / No Asistió</span>
                <span className="text-xl font-bold font-mono text-amber-900">
                  {selectedPerson.totalCancelled + selectedPerson.totalNoShows}
                </span>
                <span className="text-[9px] text-[#574B45] block mt-0.5">
                  {selectedPerson.totalJustified > 0 ? `(${selectedPerson.totalJustified} justificadas)` : ''}
                </span>
              </div>
            </div>

            {/* Activity participation list */}
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#574B45]">
                Historial de Reservas y Asistencias ({selectedPerson.participations.length})
              </h4>
              <span className="text-[11px] text-[#8C7E77]">
                Haz clic en «Justificar» para exonerar ausencias o cancelaciones
              </span>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {selectedPerson.participations.map(p => {
                const act = activities.find(a => a.id === p.activityId);
                const attended = p.status === 'asistio' || p.attended === true || (p.status === 'confirmada' && act?.status === 'celebrada');
                const isCancelled = p.status === 'cancelada';
                const isNoShow = p.status === 'no_asistio';

                return (
                  <div 
                    key={p.id}
                    className="p-3.5 rounded-2xl border border-[#EDE4D7] bg-[#FCFAF7] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#26201D]">{p.activityTitle}</span>
                        {p.justified && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
                            <ShieldCheck className="w-3 h-3 text-emerald-700" />
                            <span>Justificada</span>
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#574B45] mt-1">
                        <span className="capitalize">{p.activityType || (act ? act.type : 'actividad')}</span>
                        <span>•</span>
                        <span>{act ? act.date : (p.createdAt ? new Date(p.createdAt).toLocaleDateString('es-ES') : '-')}</span>
                        <span>•</span>
                        <span>Tarifa: {p.totalAmount} €</span>
                        {p.justificationReason && (
                          <span className="text-amber-800 italic">
                            (Motivo: {p.justificationReason})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        attended 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : isCancelled
                          ? 'bg-rose-100 text-rose-800'
                          : isNoShow
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-stone-200 text-stone-700'
                      }`}>
                        {attended ? 'Asistió' : isCancelled ? 'Cancelación previa' : isNoShow ? 'No Asistió (Falta)' : 'Pendiente'}
                      </span>

                      {(isCancelled || isNoShow || !attended) && (
                        <button
                          type="button"
                          onClick={() => handleToggleJustification(p.id, p.justified, p.justificationReason)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-colors cursor-pointer ${
                            p.justified
                              ? 'bg-stone-100 hover:bg-stone-200 text-[#574B45] border-stone-300'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                          }`}
                          title={p.justified ? 'Quitar condición de justificada' : 'Marcar como justificada'}
                        >
                          <ShieldCheck className="w-3 h-3" />
                          <span>{p.justified ? 'Quitar justif.' : 'Justificar'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 flex justify-end border-t border-[#EDE4D7] mt-5">
              <button
                type="button"
                onClick={() => setSelectedPerson(null)}
                className="px-5 py-2.5 rounded-xl bg-[#521849] hover:bg-[#3E1037] text-white text-xs font-semibold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: AI Merging Suggestions */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#EDE4D7] my-8 animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-[#EDE4D7] mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-purple-100 text-purple-900">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-serif text-[#26201D]">
                    Sugerencias de Unificación con Inteligencia Artificial
                  </h3>
                  <p className="text-xs text-[#574B45]">
                    Gemini ha detectado variantes y abreviaturas en los nombres de los asistentes
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="p-1.5 rounded-xl hover:bg-[#F6F1EA] text-[#574B45] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {aiSuggestions.length === 0 ? (
              <div className="p-8 text-center text-[#8C7E77]">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
                <p className="font-semibold text-sm text-[#574B45]">¡Datos completamente normalizados!</p>
                <p className="text-xs mt-1">No se han encontrado duplicados evidentes ni abreviaturas discrepantes.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-[#574B45]">
                  Selecciona las fusiones que deseas aplicar. Al confirmar, los registros asociados se actualizarán automáticamente con el nombre unificado.
                </p>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {aiSuggestions.map((sug, idx) => (
                    <label 
                      key={idx}
                      className={`p-3.5 rounded-2xl border transition-colors flex items-start gap-3 cursor-pointer ${
                        sug.selected ? 'bg-purple-50/70 border-purple-200' : 'bg-[#FCFAF7] border-[#EDE4D7]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={sug.selected}
                        onChange={(e) => {
                          const updated = [...aiSuggestions];
                          updated[idx].selected = e.target.checked;
                          setAiSuggestions(updated);
                        }}
                        className="w-4 h-4 mt-0.5 rounded text-[#521849] focus:ring-[#521849]"
                      />
                      <div className="flex-1 text-xs space-y-1">
                        <div className="flex items-center gap-2 font-semibold">
                          <span className="text-rose-900 line-through bg-rose-100 px-2 py-0.5 rounded">
                            {sug.original}
                          </span>
                          <span className="text-stone-400 font-normal">➔</span>
                          <span className="text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                            {sug.suggested}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#574B45] italic">{sug.reason}</p>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-[#EDE4D7]">
                  <span className="text-xs text-[#574B45]">
                    {aiSuggestions.filter(s => s.selected).length} de {aiSuggestions.length} seleccionadas
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAiModal(false)}
                      className="px-4 py-2 rounded-xl border border-[#EDE4D7] bg-white text-[#574B45] text-xs font-semibold hover:bg-[#F6F1EA] cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyMerges}
                      disabled={isApplyingMerges || aiSuggestions.filter(s => s.selected).length === 0}
                      className="px-5 py-2 rounded-xl bg-[#521849] hover:bg-[#3E1037] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isApplyingMerges && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      <span>Aplicar Fusiones Seleccionadas</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
