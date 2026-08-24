import fs from 'fs';
let code = fs.readFileSync('src/pages/admin/ModoAvanzadoView.tsx', 'utf8');

const targetTabsText = `<button
          type="button"
          onClick={() => setActiveTab('metricas')}
          className={\`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 \${
            activeTab === 'metricas'
              ? 'bg-[#521849] text-white shadow-xs'
              : 'bg-white text-[#574B45] hover:bg-[#F6F1EA]'
          }\`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Métricas de Visitas y Reservas</span>
        </button>`;

const replacementTabsText = `<button
          type="button"
          onClick={() => setActiveTab('celebradas')}
          className={\`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 \${
            activeTab === 'celebradas'
              ? 'bg-[#521849] text-white shadow-xs'
              : 'bg-white text-[#574B45] hover:bg-[#F6F1EA]'
          }\`}
        >
          <Clock className="w-4 h-4" />
          <span>Actividades Celebradas</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('metricas')}
          className={\`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 \${
            activeTab === 'metricas'
              ? 'bg-[#521849] text-white shadow-xs'
              : 'bg-white text-[#574B45] hover:bg-[#F6F1EA]'
          }\`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Métricas de Visitas y Reservas</span>
        </button>`;

code = code.replace(targetTabsText, replacementTabsText);
fs.writeFileSync('src/pages/admin/ModoAvanzadoView.tsx', code);
console.log('Fixed Tabs');
