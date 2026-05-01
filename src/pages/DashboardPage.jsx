import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuthStore } from '../store/authStore';
import PageHeader from '../components/PageHeader';
import BottomNav from '../components/BottomNav';
import { SkeletonStat, SkeletonList } from '../components/Skeleton';
import { useNavigate } from 'react-router-dom';
import {
  Users, Calendar, FlaskConical, AlertCircle,
  Activity, ChevronRight, ClipboardList, Pill
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
  const navigate = useNavigate();

  const [stats,       setStats]       = useState(null);
  const [upcoming,    setUpcoming]    = useState([]);
  const [recentPts,   setRecentPts]   = useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    const now = Timestamp.now();
    const unsubs = [];

    // Total patients
    const patientsQ = query(collection(db, 'patients'), where('deleted', '!=', true));
    unsubs.push(onSnapshot(patientsQ, (snap) => {
      setStats((s) => ({ ...s, patients: snap.size }));
    }));

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

    // Abnormal lab results
    const labQ = query(collection(db, 'labResults'), where('status', '==', 'abnormal'), limit(99));
    unsubs.push(onSnapshot(labQ, (snap) => {
      setStats((s) => ({ ...s, abnormalLabs: snap.size }));
    }));

    // Recent patients
    const recentQ = query(collection(db, 'patients'), orderBy('createdAt', 'desc'), limit(5));
    unsubs.push(onSnapshot(recentQ, (snap) => {
      setRecentPts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }));

    return () => unsubs.forEach((u) => u());
  }, []);

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
            onClick={() => navigate('/settings')}>
            <Activity size={20} />
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
            <StatCard icon={FlaskConical} label="Abnormal Labs" value={stats?.abnormalLabs ?? 0}  color="#DC2626" bg="#FEF2F2" sub="Needs review" />
            <StatCard icon={Pill}        label="Active Meds"  value="—"                          color="#16A34A" bg="#F0FDF4" />
          </div>
        )}

        {/* Quick Actions */}
        <p className="section-title">Quick Actions</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
          {[
            { label: 'Add Patient',     icon: Users,         to: '/patients/new',  color: '#C48B28', bg: 'rgba(196,139,40,0.12)' },
            { label: 'New Appointment', icon: Calendar,      to: '/appointments',  color: '#2563EB', bg: '#EFF6FF' },
            { label: 'Lab Results',     icon: FlaskConical,  to: '/laboratory',    color: '#DC2626', bg: '#FEF2F2' },
            { label: 'Orders/Rx',       icon: ClipboardList, to: '/patients',      color: '#7A5C2E', bg: 'rgba(90,60,11,0.08)' },
          ].map(({ label, icon: Icon, to, color, bg }) => (
            <button
              key={label}
              onClick={() => navigate(to)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                gap: 8, padding: '1rem',
                background: 'var(--color-white)', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-sm)', cursor: 'pointer',
                transition: 'all 0.2s', textAlign: 'left',
              }}
            >
              <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={20} color={color} strokeWidth={2} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-main)' }}>{label}</span>
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
