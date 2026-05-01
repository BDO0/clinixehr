import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import BottomNav from '../components/BottomNav';
import toast from 'react-hot-toast';
import { LogOut, User, Shield, Info, ChevronRight, Bell, Lock } from 'lucide-react';

export default function SettingsPage() {
  const profile  = useAuthStore((s) => s.profile);
  const logout   = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await signOut(auth);
      logout();
      toast.success('Logged out successfully.');
      navigate('/login', { replace: true });
    } catch {
      toast.error('Logout failed.');
    }
  }

  const roleColors = { admin: '#2563EB', doctor: '#C48B28', nurse: '#16A34A', staff: '#7A5C2E' };
  const roleColor  = roleColors[profile?.role] || '#7A5C2E';

  return (
    <div className="page-root">
      <PageHeader title="Settings" subtitle="Account & Preferences" />

      <div className="page-content">
        {/* Profile Card */}
        <div className="card-elevated" style={{ padding: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="avatar avatar-lg" style={{ background: `linear-gradient(135deg, ${roleColor}33, ${roleColor})` }}>
            <span style={{ color: 'white', fontWeight: 700, fontSize: '1.4rem' }}>
              {(profile?.displayName || 'S')[0].toUpperCase()}
            </span>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{profile?.displayName || 'Staff User'}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{profile?.email || auth.currentUser?.email}</div>
            <span className="badge badge-amber" style={{ marginTop: 6, fontSize: '0.75rem', background: `${roleColor}18`, color: roleColor }}>
              <Shield size={11} style={{ marginRight: 4 }} />
              {profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : 'Staff'}
            </span>
          </div>
        </div>

        {/* Settings Sections */}
        <p className="section-title">Account</p>
        <div className="card" style={{ overflow: 'hidden', marginBottom: '1rem' }}>
          {[
            { icon: User,  label: 'Profile Information',  sub: 'Name, contact details' },
            { icon: Lock,  label: 'Change Password',       sub: 'Update your password' },
            { icon: Bell,  label: 'Notifications',         sub: 'Alert preferences' },
          ].map(({ icon: Icon, label, sub }, i, arr) => (
            <div key={label} style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
              <div className="list-item">
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(196,139,40,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} color="var(--color-amber)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{sub}</div>
                </div>
                <ChevronRight size={16} color="var(--color-text-muted)" />
              </div>
            </div>
          ))}
        </div>

        <p className="section-title">About</p>
        <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Info size={18} color="var(--color-amber)" />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>ClinixEHR v1.0</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Internal Clinical Management System</div>
            </div>
          </div>
        </div>

        {/* Role Permissions Info */}
        <p className="section-title">Your Permissions</p>
        <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
          {profile?.role === 'doctor' && (
            <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--color-text-sub)', lineHeight: 2 }}>
              <li>View &amp; write Medical Examination Results</li>
              <li>Issue Doctor's Orders</li>
              <li>Write E-Prescriptions</li>
              <li>View Lab Results &amp; Medical History</li>
            </ul>
          )}
          {profile?.role === 'nurse' && (
            <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--color-text-sub)', lineHeight: 2 }}>
              <li>Log Vital Signs</li>
              <li>Write Nurse Notes</li>
              <li>Update Health Status</li>
              <li>View all clinical modules</li>
            </ul>
          )}
          {(profile?.role === 'admin' || profile?.role === 'staff') && (
            <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--color-text-sub)', lineHeight: 2 }}>
              <li>Manage Patient Demographics</li>
              <li>Manage Appointments</li>
              <li>Manage Billing Records</li>
              <li>Full system access</li>
            </ul>
          )}
        </div>

        {/* Logout */}
        <button className="btn-danger" style={{ width: '100%', marginBottom: '1rem' }} onClick={handleLogout}>
          <LogOut size={18} /> Sign Out
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
