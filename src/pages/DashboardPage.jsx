import { useEffect, useState, useRef } from 'react';
import { collection, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useAuthStore } from '../store/authStore';
import PageHeader from '../components/PageHeader';
import BottomNav from '../components/BottomNav';
import { SkeletonStat, SkeletonList } from '../components/Skeleton';
import KpiWidget from '../components/KpiWidget';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Users, Calendar, FlaskConical, AlertCircle,
  Activity, ChevronRight, ClipboardList, Pill, LogOut, Video
} from 'lucide-react';
import { format } from 'date-fns';
import { safeOnSnapshot, safeGetCountFromServer } from '../utils/safeFirestore';
import { DEMO_APPOINTMENTS, DEMO_PATIENTS, DEMO_DASHBOARD_KPIS } from '../data/fallbackData';

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
  const statsReady    = useRef(0);

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

  // Determine how many stat sources need to load before we stop showing skeletons
  const isClinicalRole = ['admin', 'doctor', 'nurse'].includes(profile?.role);
  // Patients + Appointments + RecentPts = 3 always; Labs + Prescriptions = 2 more for clinical roles
  const TOTAL_STAT_SOURCES = isClinicalRole ? 5 : 3;

  function markSourceReady() {
    statsReady.current += 1;
    if (statsReady.current >= TOTAL_STAT_SOURCES) {
      setLoading(false);
    }
  }

  useEffect(() => {
    const unsubs = [];
    statsReady.current = 0;
    setLoading(true);

    // Total patients count — safe with fallback
    const fetchPatientCount = async () => {
      const patientsQ = query(collection(db, 'patients'), where('deleted', '!=', true));
      const { count } = await safeGetCountFromServer(patientsQ, DEMO_DASHBOARD_KPIS.patients);
      setStats((s) => ({ ...s, patients: count }));
      markSourceReady();
    };
    fetchPatientCount();

    // Upcoming appointments (today) — safe with fallback
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const apptQ = query(
      collection(db, 'appointments'),
      where('scheduledAt', '>=', Timestamp.fromDate(startOfDay)),
      orderBy('scheduledAt', 'asc'),
      limit(5)
    );
    unsubs.push(
      safeOnSnapshot(apptQ, DEMO_APPOINTMENTS, {
        onData: (data) => {
          setUpcoming(data);
          setStats((s) => ({ ...s, appointments: data.length }));
          markSourceReady();
        },
        minItems: 3,
      })
    );

    // Clinical Data (Restricted to clinical roles) — safe with fallback
    if (isClinicalRole) {
      const labQ = query(collection(db, 'labResults'), orderBy('resultedAt', 'desc'));
      unsubs.push(
        safeOnSnapshot(labQ, [], {
          onData: (snapData) => {
            const latestLabs = new Map();
            snapData.forEach(d => {
              if (!d.patientId || !d.testName) return;
              const key = `${d.patientId}_${d.testName}`;
              if (!latestLabs.has(key)) {
                latestLabs.set(key, d.status);
              }
            });
            let activeAbnormalCount = 0;
            latestLabs.forEach(status => {
              if (status === 'abnormal' || status === 'critical') activeAbnormalCount++;
            });
            // Use real count if >= 1, else fallback KPI
            setStats((s) => ({
              ...s,
              abnormalLabs: snapData.length > 0 ? activeAbnormalCount : DEMO_DASHBOARD_KPIS.abnormalLabs,
            }));
            markSourceReady();
          },
        })
      );

      const rxQ = query(collection(db, 'allPrescriptions'), where('status', '==', 'active'));
      unsubs.push(
        safeOnSnapshot(rxQ, [], {
          onData: (snapData) => {
            const activeCount = snapData.filter(d => {
              if (d.duration && d.prescribedAt) {
                const prescribedTime = d.prescribedAt.toMillis();
                const durationMs = parseInt(d.duration) * 86400000;
                return Date.now() <= prescribedTime + durationMs;
              }
              return true;
            }).length;
            setStats((s) => ({
              ...s,
              activeMeds: snapData.length > 0 ? activeCount : DEMO_DASHBOARD_KPIS.activeMeds,
            }));
            markSourceReady();
          },
        })
      );
    }

    // Recent patients — safe with fallback
    const recentQ = query(collection(db, 'patients'), orderBy('createdAt', 'desc'), limit(5));
    unsubs.push(
      safeOnSnapshot(recentQ, DEMO_PATIENTS.slice(0, 5), {
        onData: (data) => {
          setRecentPts(data);
          markSourceReady();
        },
        minItems: 3,
      })
    );

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
          <div className="grid-2-mobile-1" style={{ marginBottom: '1rem' }}>
            {[0,1,2,3].map((i) => <SkeletonStat key={i} />)}
          </div>
        ) : (
          <div className="grid-2-mobile-1" style={{ marginBottom: '1rem' }}>
            <StatCard icon={Users}       label="Patients"    value={stats?.patients ?? 0}      color="var(--color-amber)" bg="var(--color-amber-bg)" />
            <StatCard icon={Calendar}    label="Today's Appts" value={stats?.appointments ?? 0} color="#2563EB" bg="var(--color-blue-bg)" />
            {['admin', 'doctor', 'nurse'].includes(profile?.role) && (
              <>
                <StatCard icon={FlaskConical} label="Abnormal Labs" value={stats?.abnormalLabs ?? 0}  color="var(--color-danger)" bg="var(--color-danger-bg)" sub="Needs review" />
                <StatCard icon={Pill}        label="Active Meds"  value={stats?.activeMeds ?? 0}      color="var(--color-success)" bg="var(--color-success-bg)" />
              </>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <p className="section-title">Quick Actions</p>
        <div className="grid-2-mobile-1" style={{ marginBottom: '1rem' }}>
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
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        {appt.patientName}
                        {appt.teleconsultLink && (
                          <Video size={12} color="var(--color-info)" style={{ marginLeft: 6, verticalAlign: 'middle' }} />
                        )}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                        {appt.scheduledAt?.toDate ? format(appt.scheduledAt.toDate(), 'h:mm a') : '—'} · {appt.reason || 'Check-up'}
                        {appt.teleconsultLink && <span style={{ color: 'var(--color-info)', fontWeight: 600, marginLeft: 4 }}>· Teleconsult</span>}
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
