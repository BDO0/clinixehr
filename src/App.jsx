import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { useAuthStore } from './store/authStore';

import RouteGuard        from './components/RouteGuard';
import LoginPage         from './pages/LoginPage';
import DashboardPage     from './pages/DashboardPage';
import PatientsPage      from './pages/PatientsPage';
import PatientDetailPage from './pages/PatientDetailPage';
import AppointmentsPage  from './pages/AppointmentsPage';
import LaboratoryPage    from './pages/LaboratoryPage';
import PharmacyPage      from './pages/PharmacyPage';
import BillingPage       from './pages/BillingPage';
import SettingsPage      from './pages/SettingsPage';

export default function App() {
  const { setUser, setProfile, setLoading } = useAuthStore();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const snap = await getDoc(doc(db, 'staff', user.uid));
          if (snap.exists()) setProfile({ uid: user.uid, ...snap.data() });
        } catch (e) {
          console.warn('Could not load staff profile:', e);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, [setUser, setProfile, setLoading]);

  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            fontFamily: 'Inter, sans-serif',
            borderRadius: '12px',
            background: '#2C1A06',
            color: '#FFF5E1',
            fontSize: '0.9rem',
            boxShadow: '0 8px 32px rgba(90,60,11,0.3)',
          },
          success: { iconTheme: { primary: '#C48B28', secondary: '#FFF5E1' } },
          error:   { iconTheme: { primary: '#DC2626', secondary: '#FFF5E1' } },
        }}
      />

      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected — all roles */}
        <Route path="/dashboard" element={<RouteGuard><DashboardPage /></RouteGuard>} />
        <Route path="/patients"  element={<RouteGuard><PatientsPage /></RouteGuard>} />
        <Route path="/patients/:id" element={<RouteGuard><PatientDetailPage /></RouteGuard>} />
        <Route path="/appointments" element={<RouteGuard><AppointmentsPage /></RouteGuard>} />
        <Route path="/laboratory"   element={<RouteGuard><LaboratoryPage /></RouteGuard>} />
        <Route path="/pharmacy"     element={<RouteGuard><PharmacyPage /></RouteGuard>} />
        <Route path="/settings"     element={<RouteGuard><SettingsPage /></RouteGuard>} />

        {/* Admin/Staff only */}
        <Route path="/billing" element={
          <RouteGuard roles={['admin', 'staff', 'doctor']}>
            <BillingPage />
          </RouteGuard>
        } />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
