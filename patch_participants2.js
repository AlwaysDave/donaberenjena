import fs from 'fs';
let code = fs.readFileSync('src/components/admin/ParticipantsManager.tsx', 'utf8');

// 1. Update filteredParticipants
const oldFilteredParticipants = `  const filteredParticipants = useMemo(() => {
    return participants.filter(p => {
      // Activity filter
      if (selectedActivityId !== 'all' && p.activityId !== selectedActivityId) {
        return false;
      }`;
const newFilteredParticipants = `  const filteredParticipants = useMemo(() => {
    return participants.filter(p => {
      // Past Activities filter
      if (!showPast && selectedActivityId === 'all') {
        const act = activities.find(a => a.id === p.activityId);
        if (act && act.status === 'celebrada') {
          return false;
        }
      }
      
      // Activity filter
      if (selectedActivityId !== 'all' && p.activityId !== selectedActivityId) {
        return false;
      }`;
code = code.replace(oldFilteredParticipants, newFilteredParticipants);

// 2. Update metrics calculation
const oldMetrics = `  const metrics = useMemo(() => {
    const relevant = selectedActivityId === 'all' 
      ? participants 
      : participants.filter(p => p.activityId === selectedActivityId);

    const activeParticipants = relevant.filter(p => p.status !== 'cancelada');
    const totalSpotsBooked = activeParticipants.reduce((sum, p) => sum + (p.spots || 0), 0);
    const totalExpectedRevenue = activeParticipants.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
    const withAllergies = activeParticipants.filter(p => p.notes && p.notes.trim().length > 0).length;
    const attendedCount = relevant.filter(p => p.status === 'asistio').reduce((sum, p) => sum + p.spots, 0);

    let maxCapacity = 0;
    if (selectedActivityId === 'all') {
      maxCapacity = activities.reduce((sum, a) => sum + a.totalSpots, 0);
    } else if (currentActivity) {
      maxCapacity = currentActivity.totalSpots;
    }`;

const newMetrics = `  const metrics = useMemo(() => {
    const relevant = selectedActivityId === 'all' 
      ? participants.filter(p => {
          if (!showPast) {
            const act = activities.find(a => a.id === p.activityId);
            if (act && act.status === 'celebrada') return false;
          }
          return true;
        })
      : participants.filter(p => p.activityId === selectedActivityId);

    const activeParticipants = relevant.filter(p => p.status !== 'cancelada');
    const totalSpotsBooked = activeParticipants.reduce((sum, p) => sum + (p.spots || 0), 0);
    const totalExpectedRevenue = activeParticipants.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
    const withAllergies = activeParticipants.filter(p => p.notes && p.notes.trim().length > 0).length;
    const attendedCount = relevant.filter(p => p.status === 'asistio').reduce((sum, p) => sum + p.spots, 0);

    let maxCapacity = 0;
    if (selectedActivityId === 'all') {
      maxCapacity = activities.reduce((sum, a) => {
        if (!showPast && a.status === 'celebrada') return sum;
        return sum + (a.totalSpots || 0);
      }, 0);
    } else if (currentActivity) {
      maxCapacity = currentActivity.totalSpots || 0;
    }`;

code = code.replace(oldMetrics, newMetrics);

// also need to make sure we add showPast and activities to the dependencies of filteredParticipants and metrics!
const oldDeps1 = `    });
  }, [participants, selectedActivityId, statusFilter, searchTerm]);`;
const newDeps1 = `    });
  }, [participants, selectedActivityId, statusFilter, searchTerm, showPast, activities]);`;
code = code.replace(oldDeps1, newDeps1);

const oldDeps2 = `    };
  }, [participants, selectedActivityId, activities, currentActivity]);`;
const newDeps2 = `    };
  }, [participants, selectedActivityId, activities, currentActivity, showPast]);`;
code = code.replace(oldDeps2, newDeps2);

fs.writeFileSync('src/components/admin/ParticipantsManager.tsx', code);
console.log('Participants updated correctly');
