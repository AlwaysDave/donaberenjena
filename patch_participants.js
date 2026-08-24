import fs from 'fs';
let code = fs.readFileSync('src/components/admin/ParticipantsManager.tsx', 'utf8');

// 1. Add showPast state
code = code.replace(
  "const [searchTerm, setSearchTerm] = useState<string>('');",
  "const [searchTerm, setSearchTerm] = useState<string>('');\n  const [showPast, setShowPast] = useState<boolean>(initialActivityId ? true : false);"
);

// 2. Filter activeActivities based on showPast
const oldActiveActivities = `  const activeActivities = useMemo(() => {
    return activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [activities]);`;

const newActiveActivities = `  const activeActivities = useMemo(() => {
    let filtered = activities;
    if (!showPast) {
      filtered = activities.filter(a => a.status !== 'celebrada');
    }
    // Si selectedActivityId no está en las filtradas, lo forzamos para que no se rompa el select
    if (selectedActivityId !== 'all' && !filtered.some(a => a.id === selectedActivityId)) {
      const selected = activities.find(a => a.id === selectedActivityId);
      if (selected) {
        filtered = [...filtered, selected];
      }
    }
    return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [activities, showPast, selectedActivityId]);`;
code = code.replace(oldActiveActivities, newActiveActivities);

// 3. Add toggle switch in UI
const oldHeader = `<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#290824] tracking-tight flex items-center gap-2">`;
const newHeader = `<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-[#290824] tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-[#842A76]" />
              Gestor de Asistentes y Reservas
            </h2>
            <button
              type="button"
              onClick={() => setShowPast(!showPast)}
              className={\`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors \${showPast ? 'bg-[#521849] text-white border-[#521849]' : 'bg-white text-[#574B45] border-[#EDE4D7] hover:bg-[#F6F1EA]'}\`}
            >
              {showPast ? 'Ocultar Celebradas' : 'Ver Celebradas'}
            </button>
          </div>
          <p className="text-sm text-[#574B45] mt-1">
            Administra reservas, controla aforos y registra pagos manualmente.
          </p>
        </div>`;
code = code.replace(/<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">\s*<div>\s*<h2 className="text-xl font-bold text=\[#290824\] tracking-tight flex items-center gap-2">\s*<Users className="w-5 h-5 text=\[#842A76\]" \/>\s*Gestor de Asistentes y Reservas\s*<\/h2>\s*<p className="text-sm text=\[#574B45\] mt-1">\s*Administra reservas, controla aforos y registra pagos manualmente\.\s*<\/p>\s*<\/div>/g, newHeader);

fs.writeFileSync('src/components/admin/ParticipantsManager.tsx', code);
console.log('Participants patched!');
