import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { Info } from 'lucide-react';

// Pages
import { HomePage } from './pages/HomePage';
import { CatasPage } from './pages/CatasPage';
import { CursosPage } from './pages/CursosPage';
import { ViajesPage } from './pages/ViajesPage';
import { ActivityDetailPage } from './pages/ActivityDetailPage';
import { ConocenosPage } from './pages/ConocenosPage';
import { InstalacionesPage } from './pages/InstalacionesPage';
import { ContactoPage } from './pages/ContactoPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';

const PublicDemoBanner: React.FC = () => {
  const { isDemoMode } = useData();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  if (!isDemoMode || isAdminRoute) return null;

  return (
    <div className="bg-[#521849] text-[#EDE4D7] text-[11px] py-1.5 px-4 text-center border-b border-[#3E1037] flex items-center justify-center gap-1.5 font-medium">
      <Info className="w-3.5 h-3.5 text-[#E6AF2E] shrink-0" />
      <span>
        Mostrando catálogo demostrativo de la asociación Doña Berenjena mientras se conecta la base de datos de producción.
      </span>
    </div>
  );
};

const AppLayout: React.FC = () => {
  const location = useLocation();
  const isAdminDashboard = location.pathname.startsWith('/admin') && location.pathname !== '/admin/login';

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F5] text-[#26201D]">
      <PublicDemoBanner />
      {!isAdminDashboard && <Navbar />}
      
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/catas" element={<CatasPage />} />
          <Route path="/cursos" element={<CursosPage />} />
          <Route path="/viajes" element={<ViajesPage />} />
          <Route path="/actividad/:id" element={<ActivityDetailPage />} />
          <Route path="/conocenos" element={<ConocenosPage />} />
          <Route path="/instalaciones" element={<InstalacionesPage />} />
          <Route path="/contacto" element={<ContactoPage />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          
          {/* Fallback */}
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>

      {!isAdminDashboard && <Footer />}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </DataProvider>
    </AuthProvider>
  );
}
