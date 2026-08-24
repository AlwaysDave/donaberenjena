import fs from 'fs';
let code = fs.readFileSync('src/pages/admin/ModoAvanzadoView.tsx', 'utf8');

// 1. Add statusFilter state
const stateSearch = `const [filterTypes, setFilterTypes] = useState<{ cata: boolean; curso: boolean; viaje: boolean }>({
    cata: true,
    curso: true,
    viaje: true
  });`;
const stateReplace = `const [filterTypes, setFilterTypes] = useState<{ cata: boolean; curso: boolean; viaje: boolean }>({
    cata: true,
    curso: true,
    viaje: true
  });
  const [statusFilter, setStatusFilter] = useState<'proximas' | 'celebradas' | 'todas'>('proximas');`;
code = code.replace(stateSearch, stateReplace);

// 2. Update filteredActivities logic
const filterSearch = `const filteredActivities = activities.filter(act => filterTypes[act.type]);`;
const filterReplace = `const filteredActivities = activities.filter(act => {
    const typeMatch = filterTypes[act.type];
    const statusMatch = statusFilter === 'todas' || 
                        (statusFilter === 'proximas' && act.status !== 'celebrada') ||
                        (statusFilter === 'celebradas' && act.status === 'celebrada');
    return typeMatch && statusMatch;
  });`;
code = code.replace(filterSearch, filterReplace);

// 3. Add UI select to the filter bar
const uiSearch = `                <span className={\`text-[10px] px-1.5 py-0.2 rounded-full uppercase tracking-wider font-extrabold \${
                  filterTypes.viaje ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-500'
                }\`}>
                  {filterTypes.viaje ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>`;
const uiReplace = `                <span className={\`text-[10px] px-1.5 py-0.2 rounded-full uppercase tracking-wider font-extrabold \${
                  filterTypes.viaje ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-500'
                }\`}>
                  {filterTypes.viaje ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>
            {/* Status Filter */}
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
code = code.replace(uiSearch, uiReplace);

fs.writeFileSync('src/pages/admin/ModoAvanzadoView.tsx', code);
console.log('Filters updated!');
