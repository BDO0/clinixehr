import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import PageHeader from '../components/PageHeader';
import BottomNav from '../components/BottomNav';
import DrugWarning from '../components/DrugWarning';
import { SkeletonList } from '../components/Skeleton';
import { checkDrugInteractions } from '../data/drugInteractions';
import { Pill, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';

export default function PharmacyPage() {
  const [allRx,   setAllRx]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('active');
  const [interactions, setInteractions] = useState([]);

  useEffect(() => {
    // Global view: query all prescriptions from all patients (collectionGroup)
    // Requires Firestore collectionGroup index in production.
    // For simplicity, we pull from a top-level 'prescriptions' mirror collection.
    const q = query(collection(db, 'allPrescriptions'), orderBy('prescribedAt', 'desc'));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllRx(list);
      const active = list.filter(r => r.status === 'active').map(r => r.drug);
      setInteractions(checkDrugInteractions(active));
      setLoading(false);
    });
  }, []);

  const filtered = filter === 'all' ? allRx : allRx.filter(r => r.status === filter);

  return (
    <div className="page-root">
      <PageHeader
        title="Pharmacy"
        subtitle={`${allRx.filter(r => r.status === 'active').length} active medications`}
        liveIndicator
      />

      <div className="page-content">
        {interactions.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <ShieldAlert size={18} color="var(--color-drug-warn)" />
              <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-drug-warn)' }}>
                DRUG INTERACTION ALERTS ({interactions.length})
              </span>
            </div>
            <DrugWarning interactions={interactions} />
          </div>
        )}

        <div className="tab-bar">
          {[['active', 'Active'], ['discontinued', 'Discontinued'], ['all', 'All']].map(([k, l]) => (
            <button key={k} className={`tab${filter === k ? ' active' : ''}`} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </div>

        {loading ? <SkeletonList count={5} /> : filtered.length === 0 ? (
          <div className="empty-state"><Pill size={48} /><p style={{ fontWeight: 600 }}>No medications found</p></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {filtered.map((rx) => (
              <div key={rx.id} className="card" style={{ padding: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{rx.drug}</span>
                      <span style={{ fontWeight: 400, color: 'var(--color-amber)', fontSize: '0.85rem' }}>{rx.dose}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                      {rx.route && `${rx.route} · `}{rx.frequency}{rx.duration && ` · ${rx.duration}`}
                    </div>
                    {rx.patientName && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-sub)', marginTop: 4 }}>
                        Patient: <strong>{rx.patientName}</strong>
                      </div>
                    )}
                    {rx.instructions && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 4, fontStyle: 'italic' }}>
                        {rx.instructions}
                      </div>
                    )}
                  </div>
                  <span className={`badge ${rx.status === 'active' ? 'badge-success' : 'badge-muted'}`}>{rx.status}</span>
                </div>
                <hr className="divider" style={{ margin: '8px 0' }} />
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                  Prescribed by {rx.prescribedBy} · {rx.prescribedAt?.toDate ? format(rx.prescribedAt.toDate(), 'MMM d, yyyy') : '—'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
