import { useEffect, useState } from 'react';
import { collection, query, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuthStore } from '../store/authStore';
import PageHeader from '../components/PageHeader';
import BottomNav from '../components/BottomNav';
import { SkeletonStat, SkeletonList } from '../components/Skeleton';
import KpiWidget from '../components/KpiWidget';
import { Calendar, Users, DollarSign, Clock, AlertTriangle, CreditCard, Activity, FlaskConical } from 'lucide-react';
import { format } from 'date-fns';
import { safeOnSnapshot } from '../utils/safeFirestore';
import { DEMO_APPOINTMENTS, DEMO_LABS, DEMO_BILLING } from '../data/fallbackData';

export default function AdminDashboardPage() {
  const profile = useAuthStore((s) => s.profile);
  const [stats, setStats] = useState({});
  const [criticalCases, setCriticalCases] = useState([]);
  const [unpaidBills, setUnpaidBills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubs = [];

    // Today's appointments — safe with fallback
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const apptQ = query(
      collection(db, 'appointments'),
      where('scheduledAt', '>=', startOfDay),
      orderBy('scheduledAt', 'asc')
    );
    unsubs.push(
      safeOnSnapshot(apptQ, DEMO_APPOINTMENTS, {
        onData: (list) => {
          const todayCount = list.length;
          const seen = list.filter(a => a.status === 'completed').length;
          const waitTimes = list
            .filter(a => a.arrivedAt && a.scheduledAt?.toDate)
            .map(a => Math.floor((a.arrivedAt.toDate() - a.scheduledAt.toDate()) / 60000));
          const avgWait = waitTimes.length > 0 ? Math.round(waitTimes.reduce((s, v) => s + v, 0) / waitTimes.length) : 0;
          setStats(s => ({ ...s, todayAppointments: todayCount, patientsSeen: seen, avgWaitTime: avgWait }));
          setLoading(false);
        },
        minItems: 2,
      })
    );

    // Revenue today — safe with fallback
    const revQ = query(collection(db, 'billing'), where('status', '==', 'paid'));
    unsubs.push(
      safeOnSnapshot(revQ, DEMO_BILLING.filter(b => b.status === 'paid'), {
        onData: (list) => {
          let total = 0;
          list.forEach(d => {
            if (d.paidAt?.toDate) {
              const paidDate = d.paidAt.toDate();
              if (paidDate.toDateString() === new Date().toDateString()) {
                total += d.amount || 0;
              }
            }
          });
          // If real data contributed, use it; otherwise use simulated value
          setStats(s => ({
            ...s,
            revenueToday: list.length > 0 ? total : (DEMO_BILLING.filter(b => b.status === 'paid').reduce((sum, b) => sum + (b.amount || 0), 0)),
          }));
        },
      })
    );

    // Critical cases — safe with fallback
    const labQ = query(collection(db, 'labResults'), orderBy('resultedAt', 'desc'));
    unsubs.push(
      safeOnSnapshot(labQ, DEMO_LABS.filter(l => l.status === 'critical'), {
        onData: (list) => {
          const latest = {};
          list.forEach(d => {
            if (d.status === 'critical' && d.patientId && !latest[d.patientId]) {
              latest[d.patientId] = d;
            }
          });
          setCriticalCases(Object.values(latest).slice(0, 5));
        },
        minItems: 1,
      })
    );

    // Outstanding bills — safe with fallback
    const billQ = query(collection(db, 'billing'), where('status', '==', 'unpaid'), orderBy('createdAt', 'desc'));
    unsubs.push(
      safeOnSnapshot(billQ, DEMO_BILLING.filter(b => b.status === 'unpaid'), {
        onData: (unpaid) => {
          setUnpaidBills(unpaid.slice(0, 5));
          const total = unpaid.reduce((s, b) => s + (b.amount || 0), 0);
          setStats(s => ({ ...s, outstandingBills: total }));
        },
        minItems: 1,
      })
    );

    return () => unsubs.forEach(u => u());
  }, []);

  return (
    <div className="page-root">
      <PageHeader
        title="Admin Dashboard"
        subtitle="Clinic KPI Overview"
        liveIndicator
      />

      <div className="page-content">
        {loading ? (
          <div className="grid-3-mobile-1" style={{ marginBottom: '1rem' }}>
            {[1,2,3,4,5,6].map(i => <SkeletonStat key={i} />)}
          </div>
        ) : (
          <>
            {/* KPI Grid */}
            <p className="section-title">Today's Metrics</p>
            <div className="grid-3-mobile-1" style={{ marginBottom: '1.5rem' }}>
              <KpiWidget icon={Calendar} label="Appointments" value={stats.todayAppointments || 0} color="#2563EB" bg="var(--color-info-bg)" />
              <KpiWidget icon={Users} label="Patients Seen" value={stats.patientsSeen || 0} color="#16A34A" bg="var(--color-success-bg)" />
              <KpiWidget icon={DollarSign} label="Revenue (₱)" value={`₱${(stats.revenueToday || 0).toLocaleString()}`} color="#C48B28" bg="var(--color-amber-bg)" />
              <KpiWidget icon={Clock} label="Avg Wait Time" value={`${stats.avgWaitTime || 0}m`} color="#D97706" bg="var(--color-warning-bg)" />
              <KpiWidget icon={AlertTriangle} label="Critical Cases" value={criticalCases.length} color="#DC2626" bg="var(--color-danger-bg)" />
              <KpiWidget icon={CreditCard} label="Outstanding (₱)" value={`₱${(stats.outstandingBills || 0).toLocaleString()}`} color="#DC2626" bg="var(--color-danger-bg)" />
            </div>

            {/* Critical Cases Table */}
            <p className="section-title">Critical Cases Requiring Attention</p>
            <div className="card" style={{ marginBottom: '1rem', overflow: 'hidden' }}>
              {criticalCases.length === 0 ? (
                <div className="empty-state" style={{ padding: '1rem' }}>
                  <FlaskConical size={24} />
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>No critical cases</p>
                </div>
              ) : (
                criticalCases.map((c, i) => (
                  <div key={c.id} style={{
                    padding: '0.75rem', borderBottom: i < criticalCases.length - 1 ? '1px solid var(--color-border)' : 'none',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem',
                  }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{c.patientName || 'Unknown'}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                        {c.testName}: {c.result} {c.unit || ''}
                      </div>
                    </div>
                    <span className="badge badge-danger">CRITICAL</span>
                  </div>
                ))
              )}
            </div>

            {/* Outstanding Bills */}
            <p className="section-title">Top Unpaid Bills</p>
            <div className="card" style={{ marginBottom: '1rem', overflow: 'hidden' }}>
              {unpaidBills.length === 0 ? (
                <div className="empty-state" style={{ padding: '1rem' }}>
                  <CreditCard size={24} />
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>No unpaid bills</p>
                </div>
              ) : (
                unpaidBills.map((b, i) => (
                  <div key={b.id} style={{
                    padding: '0.75rem', borderBottom: i < unpaidBills.length - 1 ? '1px solid var(--color-border)' : 'none',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem',
                  }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{b.patientName || 'Unknown'}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                        {b.serviceType} · {b.createdAt?.toDate ? format(b.createdAt.toDate(), 'MMM d') : ''}
                      </div>
                    </div>
                    <div style={{ fontWeight: 800, color: 'var(--color-danger)' }}>
                      ₱{(b.amount || 0).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}