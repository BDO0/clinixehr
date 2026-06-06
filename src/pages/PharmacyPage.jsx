import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuthStore } from '../store/authStore';
import PageHeader from '../components/PageHeader';
import BottomNav from '../components/BottomNav';
import DrugWarning from '../components/DrugWarning';
import { SkeletonList } from '../components/Skeleton';
import { checkDrugInteractions } from '../data/drugInteractions';
import { Pill, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function PharmacyPage() {
  const profile = useAuthStore((s) => s.profile);
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
      const list = snap.docs.map((d) => {
        const data = d.data();
        let isExpired = false;
        if (data.status === 'active' && data.duration && data.prescribedAt) {
          const prescribedTime = data.prescribedAt.toMillis();
          const durationMs = parseInt(data.duration) * 86400000;
          if (Date.now() > prescribedTime + durationMs) {
            isExpired = true;
          }
        }
        return { id: d.id, ...data, isExpired, computedStatus: data.status === 'discontinued' ? 'discontinued' : isExpired ? 'completed' : data.status };
      });
      setAllRx(list);
      const active = list.filter(r => r.computedStatus === 'active').map(r => r.drug);
      setInteractions(checkDrugInteractions(active));
      setLoading(false);
    });
  }, []);

  async function handleDiscontinue(rxId, patientId) {
    if (!window.confirm("Are you sure you want to discontinue this medication?")) return;
    try {
      if (patientId) {
        await updateDoc(doc(db, 'patients', patientId, 'prescriptions', rxId), { status: 'discontinued' });
      }
      await updateDoc(doc(db, 'allPrescriptions', rxId), { status: 'discontinued' });
      toast.success("Medication discontinued.");
    } catch (e) {
      toast.error("Failed to discontinue medication.");
    }
  }

  const filtered = filter === 'all' ? allRx : filter === 'completed' ? allRx.filter(r => r.computedStatus === 'completed') : allRx.filter(r => r.computedStatus === filter);

  return (
    <div className="page-root">
      <PageHeader
        title="Pharmacy"
        subtitle={`${allRx.filter(r => r.computedStatus === 'active').length} active medications`}
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
          {[['active', 'Active'], ['completed', 'Completed'], ['discontinued', 'Discontinued'], ['all', 'All']].map(([k, l]) => (
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
                      {rx.route && `${rx.route} · `}{rx.frequency}{rx.duration && ` · ${rx.duration} days`}
                    </div>
                    {rx.patientName && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-sub)', marginTop: 4 }}>
                        Patient: <strong>{rx.patientName}</strong>
                      </div>
                    )}
                    {rx.instructions && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 4, fontStyle: 'italic' }}>
                        Note: {rx.instructions}
                      </div>
                    )}
                    {rx.overrideRationale && (
                      <div style={{ marginTop: 8, padding: '6px 10px', background: 'var(--color-danger-bg)', borderRadius: 6, fontSize: '0.75rem', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                        <div style={{ color: 'var(--color-danger)', fontWeight: 700, fontSize: '0.6rem', textTransform: 'uppercase', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <ShieldAlert size={10} /> Clinical Justification for Override
                        </div>
                        <div style={{ fontStyle: 'italic', color: 'var(--color-text-main)' }}>"{rx.overrideRationale}"</div>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <span className={`badge ${rx.computedStatus === 'active' ? 'badge-success' : rx.computedStatus === 'completed' ? 'badge-amber' : 'badge-muted'}`}>
                      {rx.computedStatus}
                    </span>
                    {rx.computedStatus === 'active' && ['doctor', 'nurse'].includes(profile?.role) && (
                      <button onClick={() => handleDiscontinue(rx.id, rx.patientId)} className="btn-ghost" style={{ fontSize: '0.7rem', padding: '2px 6px', color: 'var(--color-danger)' }}>
                        Discontinue
                      </button>
                    )}
                  </div>
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
