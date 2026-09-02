import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { trackPageView } from './utils/analyticsTracker';
import { initGA4, trackGAPageView } from './utils/googleAnalytics';
import { CookieConsentBanner } from './components/common/CookieConsentBanner';

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

const AppLayout: React.FC = () => {
  const location = useLocation();
  const isAdminDashboard = location.pathname.startsWith('/admin') && location.pathname !== '/admin/login';

  // Initialize GA4 if consent was previously granted
  useEffect(() => {
    initGA4();
  }, []);

  // Automatically track public page views on route transitions in internal telemetry and GA4
  useEffect(() => {
    const path = location.pathname;
    if (!path.startsWith('/admin')) {
      let activityId: string | undefined;
      if (path.startsWith('/actividad/')) {
        activityId = path.split('/')[2];
      }
      // Internal telemetry (zero-PII)
      trackPageView(path, activityId);

      // GA4 page_view (zero-PII, fired ONLY if consent is granted)
      trackGAPageView(location.pathname + location.search);
    }
  }, [location.pathname, location.search]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F5] text-[#26201D]">
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

      {/* Cookie Consent & Privacy Preference Management */}
      <CookieConsentBanner />
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
