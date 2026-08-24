import fs from 'fs';
let code = fs.readFileSync('src/pages/admin/ModoAvanzadoView.tsx', 'utf8');

const stateHookSearch = `  const [activeTab, setActiveTab] = useState<'gestion' | 'participantes' | 'celebradas' | 'metricas'>('gestion');`;
const stateHookReplace = `  const [activeTab, setActiveTab] = useState<'gestion' | 'participantes' | 'celebradas' | 'metricas'>('gestion');
  const [metricsSort, setMetricsSort] = useState<{ key: 'date' | 'type' | 'occupancy'; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });`;
code = code.replace(stateHookSearch, stateHookReplace);

fs.writeFileSync('src/pages/admin/ModoAvanzadoView.tsx', code);
console.log('Sort state added');
