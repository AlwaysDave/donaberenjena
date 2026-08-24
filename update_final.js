import fs from 'fs';

// 1. Update ParticipantsManager.tsx text
let pmCode = fs.readFileSync('src/components/admin/ParticipantsManager.tsx', 'utf8');

pmCode = pmCode.replace(
  "Participantes Registrados",
  "Reservas de Próximas Actividades"
);

pmCode = pmCode.replace(
  "🌟 Todas las Actividades y Catas ({participants.length} registros)",
  "🌟 Todas las Próximas Actividades"
);

// We should also replace the top left eyebrow text
pmCode = pmCode.replace(
  "Control de Asistencia y Reservas",
  "Control de Asistencia"
);

fs.writeFileSync('src/components/admin/ParticipantsManager.tsx', pmCode);


// 2. Update ModoAvanzadoView.tsx text (we already updated "Reservas de Próximas Actividades" but need to check if there are any pending things)
let maCode = fs.readFileSync('src/pages/admin/ModoAvanzadoView.tsx', 'utf8');
// Replace the exact text just in case it didn't match perfectly before
maCode = maCode.replace(
  "<span>Asistentes y Reservas ({participants.length})</span>",
  "<span>Reservas de Próximas Actividades ({upcomingBookedSpots}/{upcomingTotalSpots})</span>"
);

fs.writeFileSync('src/pages/admin/ModoAvanzadoView.tsx', maCode);

console.log('Final text updates done');
