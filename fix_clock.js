import fs from 'fs';
let code = fs.readFileSync('src/pages/admin/ModoAvanzadoView.tsx', 'utf8');

// The file might have Clock imported twice in the lucide-react block.
code = code.replace(/Clock,\n  Clock,/, 'Clock,');

fs.writeFileSync('src/pages/admin/ModoAvanzadoView.tsx', code);
