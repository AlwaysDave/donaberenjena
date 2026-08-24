import fs from 'fs';
let code = fs.readFileSync('src/pages/admin/ModoAvanzadoView.tsx', 'utf8');

const tableSearch = `              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#FCFAF7] border-b border-[#EDE4D7] text-[#574B45] uppercase tracking-wider font-semibold">
                      <th className="p-4">Actividad</th>
                      <th className="p-4">Tipo</th>
                      <th className="p-4">Fecha</th>
                      <th className="p-4">Plazas Ocupadas</th>
                      <th className="p-4">Aforo Máximo</th>
                      <th className="p-4">% Ocupación</th>
                      <th className="p-4">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDE4D7]">
                    {activities.map((act) => {
                      const occupancy = act.totalSpots > 0 ? Math.round((act.bookedSpots / act.totalSpots) * 100) : 0;
                      return (
                        <tr key={act.id} className="hover:bg-[#FCFAF7]">
                          <td className="p-4 font-semibold text-[#26201D]">
                            <p className="font-serif text-sm truncate max-w-xs">{act.title}</p>
                            <p className="text-[11px] text-[#574B45]">{act.subtitle}</p>
                          </td>
                          <td className="p-4 capitalize text-[#574B45]">
                            {act.type}
                          </td>
                          <td className="p-4 text-[#26201D]">
                            {act.date}
                          </td>
                          <td className="p-4 font-bold text-[#521849]">
                            {act.bookedSpots}
                          </td>
                          <td className="p-4 text-[#574B45]">
                            {act.totalSpots}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-[#EDE4D7] h-2 rounded-full overflow-hidden">
                                <div 
                                  className={\`h-full \${occupancy >= 100 ? 'bg-rose-500' : 'bg-[#521849]'}\`} 
                                  style={{ width: \`\${Math.min(100, occupancy)}%\` }}
                                />
                              </div>
                              <span className="font-semibold text-[11px] text-[#26201D]">{occupancy}%</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={\`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider \${
                              occupancy >= 100 
                                ? 'bg-rose-100 text-rose-800' 
                                : occupancy >= 75
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }\`}>
                              {occupancy >= 100 ? 'Completo' : occupancy >= 75 ? 'Últimas plazas' : 'Disponible'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {activities.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-[#574B45]">
                          No hay actividades para mostrar métricas.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>`;

const tableReplace = `              <div className="overflow-x-auto">
                {(() => {
                  const sortedActivities = [...activities].sort((a, b) => {
                    let valA, valB;
                    
                    if (metricsSort.key === 'type') {
                      valA = a.type;
                      valB = b.type;
                    } else if (metricsSort.key === 'occupancy') {
                      valA = a.totalSpots > 0 ? (a.bookedSpots / a.totalSpots) : 0;
                      valB = b.totalSpots > 0 ? (b.bookedSpots / b.totalSpots) : 0;
                    } else {
                      valA = new Date(a.date).getTime();
                      valB = new Date(b.date).getTime();
                    }
                    
                    if (valA < valB) return metricsSort.direction === 'asc' ? -1 : 1;
                    if (valA > valB) return metricsSort.direction === 'asc' ? 1 : -1;
                    return 0;
                  });
                  
                  const handleSort = (key: 'date' | 'type' | 'occupancy') => {
                    setMetricsSort(prev => ({
                      key,
                      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
                    }));
                  };
                  
                  return (
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-[#FCFAF7] border-b border-[#EDE4D7] text-[#574B45] uppercase tracking-wider font-semibold">
                          <th className="p-4">Actividad</th>
                          <th className="p-4 cursor-pointer hover:bg-[#F6F1EA] transition-colors select-none" onClick={() => handleSort('type')}>
                            Tipo {metricsSort.key === 'type' && (metricsSort.direction === 'asc' ? '↑' : '↓')}
                          </th>
                          <th className="p-4 cursor-pointer hover:bg-[#F6F1EA] transition-colors select-none" onClick={() => handleSort('date')}>
                            Fecha {metricsSort.key === 'date' && (metricsSort.direction === 'asc' ? '↑' : '↓')}
                          </th>
                          <th className="p-4">Plazas Ocupadas</th>
                          <th className="p-4">Aforo Máximo</th>
                          <th className="p-4 cursor-pointer hover:bg-[#F6F1EA] transition-colors select-none" onClick={() => handleSort('occupancy')}>
                            % Ocupación {metricsSort.key === 'occupancy' && (metricsSort.direction === 'asc' ? '↑' : '↓')}
                          </th>
                          <th className="p-4">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EDE4D7]">
                        {sortedActivities.map((act) => {
                          const occupancy = act.totalSpots > 0 ? Math.round((act.bookedSpots / act.totalSpots) * 100) : 0;
                          return (
                            <tr key={act.id} className="hover:bg-[#FCFAF7]">
                              <td className="p-4 font-semibold text-[#26201D]">
                                <a 
                                  href={\`/actividad/\${act.id}\`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="font-serif text-sm truncate max-w-xs hover:text-[#521849] hover:underline cursor-pointer block"
                                >
                                  {act.title}
                                </a>
                                <p className="text-[11px] text-[#574B45]">{act.subtitle}</p>
                              </td>
                              <td className="p-4 capitalize text-[#574B45]">
                                {act.type}
                              </td>
                              <td className="p-4 text-[#26201D]">
                                {act.date}
                              </td>
                              <td className="p-4 font-bold text-[#521849]">
                                {act.bookedSpots}
                              </td>
                              <td className="p-4 text-[#574B45]">
                                {act.totalSpots}
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 bg-[#EDE4D7] h-2 rounded-full overflow-hidden">
                                    <div 
                                      className={\`h-full \${occupancy >= 100 ? 'bg-rose-500' : 'bg-[#521849]'}\`} 
                                      style={{ width: \`\${Math.min(100, occupancy)}%\` }}
                                    />
                                  </div>
                                  <span className="font-semibold text-[11px] text-[#26201D]">{occupancy}%</span>
                                </div>
                              </td>
                              <td className="p-4">
                                {act.status === 'celebrada' ? (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-200 text-gray-600">
                                    CELEBRADA
                                  </span>
                                ) : (
                                  <span className={\`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider \${
                                    occupancy >= 100 
                                      ? 'bg-rose-100 text-rose-800' 
                                      : occupancy >= 75
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }\`}>
                                    {occupancy >= 100 ? 'Completo' : occupancy >= 75 ? 'Últimas plazas' : 'Disponible'}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {sortedActivities.length === 0 && (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-[#574B45]">
                              No hay actividades para mostrar métricas.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  );
                })()}
              </div>`;

if (code.includes(tableSearch)) {
  code = code.replace(tableSearch, tableReplace);
  fs.writeFileSync('src/pages/admin/ModoAvanzadoView.tsx', code);
  console.log("Successfully replaced table.");
} else {
  console.log("Could not find tableSearch block.");
}
