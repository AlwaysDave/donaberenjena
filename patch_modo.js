import fs from 'fs';
let code = fs.readFileSync('src/pages/admin/ModoAvanzadoView.tsx', 'utf8');

// Remove statusFilter state
code = code.replace(
  "  const [statusFilter, setStatusFilter] = useState<'proximas' | 'celebradas' | 'todas'>('proximas');",
  ""
);

// Update filteredActivities
const filterSearch = `  const filteredActivities = activities.filter(act => {
    const typeMatch = filterTypes[act.type];
    const statusMatch = statusFilter === 'todas' || 
                        (statusFilter === 'proximas' && act.status !== 'celebrada') ||
                        (statusFilter === 'celebradas' && act.status === 'celebrada');
    return typeMatch && statusMatch;
  });`;
const filterReplace = `  const upcomingActivities = activities.filter(a => a.status !== 'celebrada');
  const upcomingTotalSpots = upcomingActivities.reduce((sum, a) => sum + (a.totalSpots || 0), 0);
  const upcomingBookedSpots = upcomingActivities.reduce((sum, a) => sum + (a.bookedSpots || 0), 0);

  const filteredActivities = activities.filter(act => {
    return filterTypes[act.type] && act.status !== 'celebrada';
  });`;
code = code.replace(filterSearch, filterReplace);

// Remove UI status filter
const uiSearch = `            {/* Status Filter */}
            <div className="flex items-center gap-1 border-l border-[#EDE4D7] pl-3 ml-1">
              <span className="text-xs font-bold text-[#574B45] uppercase tracking-wider mr-1">Estado:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'proximas' | 'celebradas' | 'todas')}
                className="bg-[#FCFAF7] border border-[#EDE4D7] text-[#574B45] text-xs font-bold rounded-xl px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#521849] cursor-pointer"
              >
                <option value="proximas">Próximas</option>
                <option value="celebradas">Celebradas</option>
                <option value="todas">Todas</option>
              </select>
            </div>`;
code = code.replace(uiSearch, "");

// Update tabs
const tab1Search = `<span>Catálogo de Actividades ({activities.length})</span>`;
const tab1Replace = `<span>Próximas Actividades ({upcomingActivities.length})</span>`;
code = code.replace(tab1Search, tab1Replace);

const tab2Search = `<span>Asistentes y Reservas ({participants.length})</span>`;
const tab2Replace = `<span>Reservas de Próximas Actividades ({upcomingBookedSpots}/{upcomingTotalSpots})</span>`;
code = code.replace(tab2Search, tab2Replace);

fs.writeFileSync('src/pages/admin/ModoAvanzadoView.tsx', code);
console.log('Modo patched');
