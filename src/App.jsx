import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';

import RouteGuard        from './components/RouteGuard';
import LoginPage         from './pages/LoginPage';
import DashboardPage     from './pages/DashboardPage';
import PatientsPage      from './pages/PatientsPage';
import PatientDetailPage from './pages/PatientDetailPage';
import AppointmentsPage  from './pages/AppointmentsPage';
import LaboratoryPage    from './pages/LaboratoryPage';
import PharmacyPage      from './pages/PharmacyPage';
import BillingPage       from './pages/BillingPage';
import UnauthorizedPage  from './pages/UnauthorizedPage';

export default function App() {
  const { setUser, setProfile, setLoading } = useAuthStore();
  const theme = useThemeStore((s) => s.theme);
  const transitionState = useThemeStore((s) => s.transitionState);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

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

      {/* Top Eyelid */}
      <svg
        className={`theme-lid theme-lid-top ${
          transitionState === 'closing'        ? 'closed'       :
          transitionState === 'snapping-dark'  ? 'snap-away'    :
          transitionState === 'sealed-for-open'? 'sealed'       :
          transitionState === 'opening-light'  ? 'open'         : ''
        }`}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M 0 0 L 100 0 L 100 100 Q 50 83 0 100 Z" fill="#120C05" />
      </svg>

      {/* Bottom Eyelid */}
      <svg
        className={`theme-lid theme-lid-bottom ${
          transitionState === 'closing'        ? 'closed'       :
          transitionState === 'snapping-dark'  ? 'snap-away'    :
          transitionState === 'sealed-for-open'? 'sealed'       :
          transitionState === 'opening-light'  ? 'open'         : ''
        }`}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M 0 0 Q 50 17 100 0 L 100 100 L 0 100 Z" fill="#120C05" />
      </svg>

      <div className={`app-wrapper ${
        transitionState === 'snapping-dark'   ? 'blur-in'  :
        transitionState === 'opening-light'   ? 'blur-in'  :
        transitionState === 'fading-dark-out' ? 'blur-out' : ''
      }`}>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected — all authenticated users */}
          <Route path="/dashboard" element={<RouteGuard><DashboardPage /></RouteGuard>} />
          <Route path="/unauthorized" element={<RouteGuard><UnauthorizedPage /></RouteGuard>} />

          {/* Patients: Admin, Doctor, Nurse, Staff(Reception) */}
          <Route path="/patients"  element={<RouteGuard roles={['admin', 'doctor', 'nurse', 'staff']}><PatientsPage /></RouteGuard>} />
          <Route path="/patients/:id" element={<RouteGuard roles={['admin', 'doctor', 'nurse', 'staff']}><PatientDetailPage /></RouteGuard>} />

          {/* Clinical Modules: Admin, Doctor, Nurse */}
          <Route path="/laboratory"   element={<RouteGuard roles={['admin', 'doctor', 'nurse']}><LaboratoryPage /></RouteGuard>} />
          <Route path="/pharmacy"     element={<RouteGuard roles={['admin', 'doctor', 'nurse']}><PharmacyPage /></RouteGuard>} />

          {/* Appointments: Admin, Doctor, Staff */}
          <Route path="/appointments" element={<RouteGuard roles={['admin', 'doctor', 'staff']}><AppointmentsPage /></RouteGuard>} />

          {/* Billing/Finance: Admin, Staff */}
          <Route path="/billing" element={
            <RouteGuard roles={['admin', 'staff']}>
              <BillingPage />
            </RouteGuard>
          } />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
