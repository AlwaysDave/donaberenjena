import fs from 'fs';
let code = fs.readFileSync('src/components/admin/ParticipantsManager.tsx', 'utf8');

// Remove showPast state
code = code.replace(
  "const [showPast, setShowPast] = useState<boolean>(initialActivityId ? true : false);",
  ""
);

// activeActivities: remove showPast logic
const oldActiveActivities = `  const activeActivities = useMemo(() => {
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
const newActiveActivities = `  const activeActivities = useMemo(() => {
    let filtered = activities.filter(a => a.status !== 'celebrada');
    
    // Si selectedActivityId no está en las filtradas, lo forzamos para que no se rompa el select
    // (Por ejemplo, cuando navegamos desde la tabla de Actividades Celebradas)
    if (selectedActivityId !== 'all' && !filtered.some(a => a.id === selectedActivityId)) {
      const selected = activities.find(a => a.id === selectedActivityId);
      if (selected) {
        filtered = [...filtered, selected];
      }
    }
    return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [activities, selectedActivityId]);`;
code = code.replace(oldActiveActivities, newActiveActivities);

// filteredParticipants: remove showPast
const oldFilteredParts = `      // Past Activities filter
      if (!showPast && selectedActivityId === 'all') {
        const act = activities.find(a => a.id === p.activityId);
        if (act && act.status === 'celebrada') {
          return false;
        }
      }`;
const newFilteredParts = `      // Past Activities filter
      if (selectedActivityId === 'all') {
        const act = activities.find(a => a.id === p.activityId);
        if (act && act.status === 'celebrada') {
          return false;
        }
      }`;
code = code.replace(oldFilteredParts, newFilteredParts);
code = code.replace(
  "  }, [participants, selectedActivityId, statusFilter, searchTerm, showPast, activities]);",
  "  }, [participants, selectedActivityId, statusFilter, searchTerm, activities]);"
);

// metrics: remove showPast
const oldMetrics = `  const metrics = useMemo(() => {
    const relevant = selectedActivityId === 'all' 
      ? participants.filter(p => {
          if (!showPast) {
            const act = activities.find(a => a.id === p.activityId);
            if (act && act.status === 'celebrada') return false;
          }
          return true;
        })
      : participants.filter(p => p.activityId === selectedActivityId);`;
const newMetrics = `  const metrics = useMemo(() => {
    const relevant = selectedActivityId === 'all' 
      ? participants.filter(p => {
          const act = activities.find(a => a.id === p.activityId);
          if (act && act.status === 'celebrada') return false;
          return true;
        })
      : participants.filter(p => p.activityId === selectedActivityId);`;
code = code.replace(oldMetrics, newMetrics);

const oldMaxCapacity = `    if (selectedActivityId === 'all') {
      maxCapacity = activities.reduce((sum, a) => {
        if (!showPast && a.status === 'celebrada') return sum;
        return sum + (a.totalSpots || 0);
      }, 0);
    }`;
const newMaxCapacity = `    if (selectedActivityId === 'all') {
      maxCapacity = activities.reduce((sum, a) => {
        if (a.status === 'celebrada') return sum;
        return sum + (a.totalSpots || 0);
      }, 0);
    }`;
code = code.replace(oldMaxCapacity, newMaxCapacity);
code = code.replace(
  "  }, [participants, selectedActivityId, activities, currentActivity, showPast]);",
  "  }, [participants, selectedActivityId, activities, currentActivity]);"
);

// Remove the toggle button from the header
const toggleButtonRegex = /<button[\s\S]*?onClick=\{\(\) => setShowPast\(!showPast\)\}[\s\S]*?<\/button>/;
code = code.replace(toggleButtonRegex, "");

fs.writeFileSync('src/components/admin/ParticipantsManager.tsx', code);
console.log('Participants patched');
