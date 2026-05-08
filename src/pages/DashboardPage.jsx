import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp, getCountFromServer } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useAuthStore } from '../store/authStore';
import PageHeader from '../components/PageHeader';
import BottomNav from '../components/BottomNav';
import { SkeletonStat, SkeletonList } from '../components/Skeleton';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Users, Calendar, FlaskConical, AlertCircle,
  Activity, ChevronRight, ClipboardList, Pill, LogOut
} from 'lucide-react';
import { format } from 'date-fns';

function StatCard({ icon: Icon, label, value, color, bg, sub }) {
  return (
    <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-sub)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {label}
        </span>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} color={color} strokeWidth={2} />
        </div>
      </div>
      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-text-main)', lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const profile  = useAuthStore((s) => s.profile);
  const logout   = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const [stats,       setStats]       = useState(null);
  const [upcoming,    setUpcoming]    = useState([]);
  const [recentPts,   setRecentPts]   = useState([]);
  const [loading,     setLoading]     = useState(true);

  async function handleLogout() {
    if (!window.confirm('Are you sure you want to sign out?')) return;
    try {
      await signOut(auth);
      logout();
      toast.success('Logged out successfully.');
      navigate('/login', { replace: true });
    } catch {
      toast.error('Logout failed.');
    }
  }

  useEffect(() => {
    const unsubs = [];

    // Total patients - securely and efficiently via server count
    const fetchPatientCount = async () => {
      try {
        const patientsQ = query(collection(db, 'patients'), where('deleted', '!=', true));
        const snapshot = await getCountFromServer(patientsQ);
        setStats((s) => ({ ...s, patients: snapshot.data().count }));
      } catch (e) {
        console.warn("Failed to fetch patient count:", e);
      }
    };
    fetchPatientCount();

    // Upcoming appointments (today)
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const apptQ = query(
      collection(db, 'appointments'),
      where('scheduledAt', '>=', Timestamp.fromDate(startOfDay)),
      orderBy('scheduledAt', 'asc'),
      limit(5)
    );
    unsubs.push(onSnapshot(apptQ, (snap) => {
      setUpcoming(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setStats((s) => ({ ...s, appointments: snap.size }));
    }));

    // Clinical Data (Restricted to clinical roles)
    if (['admin', 'doctor', 'nurse'].includes(profile?.role)) {
      const labQ = query(collection(db, 'labResults'), orderBy('resultedAt', 'desc'));
      unsubs.push(onSnapshot(labQ, (snap) => {
        const latestLabs = new Map();
        
        // Since docs are ordered by resultedAt desc, the first time we see a patientId_testName combo, it's the most recent.
        snap.docs.forEach(d => {
          const data = d.data();
          if (!data.patientId || !data.testName) return;
          
          const key = `${data.patientId}_${data.testName}`;
          if (!latestLabs.has(key)) {
            latestLabs.set(key, data.status);
          }
        });

        let activeAbnormalCount = 0;
        latestLabs.forEach(status => {
          if (status === 'abnormal' || status === 'critical') {
            activeAbnormalCount++;
          }
        });

        setStats((s) => ({ ...s, abnormalLabs: activeAbnormalCount }));
      }));

      const rxQ = query(collection(db, 'allPrescriptions'), where('status', '==', 'active'));
      unsubs.push(onSnapshot(rxQ, (snap) => {
        const activeCount = snap.docs.filter(d => {
          const data = d.data();
          if (data.duration && data.prescribedAt) {
            const prescribedTime = data.prescribedAt.toMillis();
            const durationMs = parseInt(data.duration) * 86400000;
            return Date.now() <= prescribedTime + durationMs;
          }
          return true;
        }).length;
        setStats((s) => ({ ...s, activeMeds: activeCount }));
      }));
    }

    // Recent patients
    const recentQ = query(collection(db, 'patients'), orderBy('createdAt', 'desc'), limit(5));
    unsubs.push(onSnapshot(recentQ, (snap) => {
      setRecentPts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }));

    return () => unsubs.forEach((u) => u());
  }, [profile?.role]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const roleLabel = { admin: 'Administrator', staff: 'Staff', nurse: 'Nurse', doctor: 'Doctor' };

  return (
    <div className="page-root">
      <PageHeader
        title="ClinixEHR"
        subtitle={`${greeting()}, ${profile?.displayName || 'Staff'}`}
        liveIndicator
        actions={
          <button className="btn-icon" style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white' }}
            onClick={handleLogout}
            title="Sign Out">
            <LogOut size={20} />
          </button>
        }
      />

      <div className="page-content">
        {/* Role Badge */}
        <div style={{ marginBottom: '1rem', paddingTop: '0.25rem' }}>
          <span className="badge badge-amber" style={{ fontSize: '0.8rem' }}>
            {roleLabel[profile?.role] || 'Clinical Staff'}
          </span>
        </div>

        {/* Stats Grid */}
        <p className="section-title">Overview</p>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            {[0,1,2,3].map((i) => <SkeletonStat key={i} />)}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <StatCard icon={Users}       label="Patients"    value={stats?.patients ?? 0}      color="#C48B28" bg="rgba(196,139,40,0.12)" />
            <StatCard icon={Calendar}    label="Today's Appts" value={stats?.appointments ?? 0} color="#2563EB" bg="#EFF6FF" />
            {['admin', 'doctor', 'nurse'].includes(profile?.role) && (
              <>
                <StatCard icon={FlaskConical} label="Abnormal Labs" value={stats?.abnormalLabs ?? 0}  color="#DC2626" bg="#FEF2F2" sub="Needs review" />
                <StatCard icon={Pill}        label="Active Meds"  value={stats?.activeMeds ?? 0}      color="#16A34A" bg="#F0FDF4" />
              </>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <p className="section-title">Quick Actions</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
          {[
            { label: 'Add Patient',     icon: Users,         to: '/patients',     roles: ['admin', 'doctor', 'nurse', 'staff'] },
            { label: 'New Appointment', icon: Calendar,      to: '/appointments', roles: ['admin', 'doctor', 'staff'] },
            { label: 'Lab Results',     icon: FlaskConical,  to: '/laboratory',   roles: ['admin', 'doctor', 'nurse'] },
            { label: 'Orders/Rx',       icon: ClipboardList, to: '/patients',     roles: ['admin', 'doctor'] },
          ]
          .filter(action => action.roles.includes(profile?.role || 'staff'))
          .map(({ label, icon: Icon, to }) => (
            <button
              key={label}
              onClick={() => navigate(to)}
              className="quick-action-card"
            >
              <div className="icon-wrapper">
                <Icon size={22} strokeWidth={2.2} />
              </div>
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Upcoming Appointments */}
        <p className="section-title">Upcoming Appointments</p>
        <div className="card" style={{ marginBottom: '1rem', overflow: 'hidden' }}>
          {loading ? <SkeletonList count={3} /> : upcoming.length === 0 ? (
            <div className="empty-state" style={{ padding: '1.5rem' }}>
              <Calendar size={32} />
              <p style={{ margin: 0, fontSize: '0.9rem' }}>No appointments today</p>
            </div>
          ) : (
            upcoming.map((appt, i) => (
              <div key={appt.id} style={{ borderBottom: i < upcoming.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                <div className="list-item" onClick={() => navigate(`/patients/${appt.patientId}`)}>
                  <div className="avatar" style={{ fontSize: '0.8rem', width: 40, height: 40 }}>
                    {(appt.patientName || '?')[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{appt.patientName}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                      {appt.scheduledAt?.toDate ? format(appt.scheduledAt.toDate(), 'h:mm a') : '—'} · {appt.reason || 'Check-up'}
                    </div>
                  </div>
                  <span className={`badge ${appt.status === 'confirmed' ? 'badge-success' : appt.status === 'cancelled' ? 'badge-danger' : 'badge-warning'}`}>
                    {appt.status || 'pending'}
                  </span>
                  <ChevronRight size={16} color="var(--color-text-muted)" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Recent Patients */}
        <p className="section-title">Recent Patients</p>
        <div className="card" style={{ marginBottom: '1rem', overflow: 'hidden' }}>
          {loading ? <SkeletonList count={3} /> : recentPts.length === 0 ? (
            <div className="empty-state" style={{ padding: '1.5rem' }}>
              <Users size={32} />
              <p style={{ margin: 0, fontSize: '0.9rem' }}>No patients yet</p>
            </div>
          ) : (
            recentPts.map((pt, i) => (
              <div key={pt.id} style={{ borderBottom: i < recentPts.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                <div className="list-item" onClick={() => navigate(`/patients/${pt.id}`)}>
                  <div className="avatar">
                    {(pt.firstName || '?')[0]}{(pt.lastName || '')[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{pt.firstName} {pt.lastName}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                      {pt.age ? `${pt.age} yrs` : ''} {pt.gender ? `· ${pt.gender}` : ''}
                    </div>
                  </div>
                  <ChevronRight size={16} color="var(--color-text-muted)" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
