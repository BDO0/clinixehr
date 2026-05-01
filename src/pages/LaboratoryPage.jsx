import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuthStore } from '../store/authStore';
import PageHeader from '../components/PageHeader';
import BottomNav from '../components/BottomNav';
import { SkeletonList } from '../components/Skeleton';
import toast from 'react-hot-toast';
import { FlaskConical, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

const LAB_TESTS = [
  'CBC', 'BMP', 'CMP', 'Lipid Panel', 'HbA1c', 'TSH', 'Urinalysis',
  'PT/INR', 'ABG', 'LFT', 'Creatinine', 'BUN', 'Troponin', 'CRP', 'ESR', 'Culture & Sensitivity'
];

function AddLabModal({ onClose }) {
  const profile = useAuthStore((s) => s.profile);
  const [form, setForm] = useState({ patientName: '', patientId: '', testName: '', result: '', unit: '', referenceRange: '', status: 'normal', notes: '' });
  const [saving, setSaving] = useState(false);
  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.patientName || !form.testName || !form.result) { toast.error('Patient, test name, and result required.'); return; }
    setSaving(true);
    try {
      await addDoc(collection(db, 'labResults'), {
        ...form,
        orderedBy: profile?.displayName || 'Staff',
        resultedAt: Timestamp.now(),
      });
      toast.success('Lab result saved!');
      onClose();
    } catch { toast.error('Failed to save lab result.'); }
    finally { setSaving(false); }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1.25rem' }}>Add Lab Result</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label className="input-label">Patient Name *</label><input className="input-field" value={form.patientName} onChange={(e) => set('patientName', e.target.value)} placeholder="Maria Santos" /></div>
          <div className="form-row">
            <div className="form-group">
              <label className="input-label">Test Name *</label>
              <select className="input-field" value={form.testName} onChange={(e) => set('testName', e.target.value)}>
                <option value="">Select…</option>
                {LAB_TESTS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="input-label">Status</label>
              <select className="input-field" value={form.status} onChange={(e) => set('status', e.target.value)}>
                <option value="normal">Normal</option>
                <option value="abnormal">Abnormal</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="input-label">Result *</label><input className="input-field" value={form.result} onChange={(e) => set('result', e.target.value)} placeholder="7.5" /></div>
            <div className="form-group"><label className="input-label">Unit</label><input className="input-field" value={form.unit} onChange={(e) => set('unit', e.target.value)} placeholder="mg/dL" /></div>
          </div>
          <div className="form-group"><label className="input-label">Reference Range</label><input className="input-field" value={form.referenceRange} onChange={(e) => set('referenceRange', e.target.value)} placeholder="4.0 - 10.0" /></div>
          <div className="form-group"><label className="input-label">Notes</label><textarea className="input-field" value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Clinical notes…" /></div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={saving}>{saving ? 'Saving…' : 'Save Result'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LaboratoryPage() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const profile = useAuthStore((s) => s.profile);

  useEffect(() => {
    const q = query(collection(db, 'labResults'), orderBy('resultedAt', 'desc'));
    return onSnapshot(q, (snap) => {
      setResults(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, []);

  const filtered = filter === 'all' ? results : results.filter(r => r.status === filter);

  const counts = {
    all:      results.length,
    normal:   results.filter(r => r.status === 'normal').length,
    abnormal: results.filter(r => r.status === 'abnormal').length,
    critical: results.filter(r => r.status === 'critical').length,
  };

  return (
    <div className="page-root">
      <PageHeader
        title="Laboratory"
        subtitle={`${counts.abnormal} abnormal · ${counts.critical} critical`}
        liveIndicator
        actions={
          ['admin', 'nurse', 'doctor'].includes(profile?.role) && (
            <button className="btn-icon" style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white' }} onClick={() => setShowAdd(true)}>
              <Plus size={20} />
            </button>
          )
        }
      />

      <div className="page-content">
        <div className="tab-bar">
          {[['all', `All (${counts.all})`], ['normal', `Normal (${counts.normal})`], ['abnormal', `Abnormal (${counts.abnormal})`], ['critical', `Critical (${counts.critical})`]].map(([k, l]) => (
            <button key={k} className={`tab${filter === k ? ' active' : ''}`} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </div>

        {loading ? <SkeletonList count={5} /> : filtered.length === 0 ? (
          <div className="empty-state"><FlaskConical size={48} /><p style={{ fontWeight: 600 }}>No results found</p></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {filtered.map((r) => (
              <div key={r.id} className="card" style={{ padding: '0.9rem', borderLeft: `4px solid ${r.status === 'critical' ? 'var(--color-danger)' : r.status === 'abnormal' ? 'var(--color-warning)' : 'var(--color-success)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{r.testName}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-sub)' }}>{r.patientName}</div>
                  </div>
                  <span className={`badge ${r.status === 'critical' ? 'badge-danger' : r.status === 'abnormal' ? 'badge-warning' : 'badge-success'}`}>
                    {r.status === 'abnormal' ? <AlertCircle size={11} style={{ marginRight: 3 }} /> : <CheckCircle2 size={11} style={{ marginRight: 3 }} />}
                    {r.status}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'baseline' }}>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: r.status === 'normal' ? 'var(--color-success)' : r.status === 'critical' ? 'var(--color-danger)' : 'var(--color-warning)' }}>
                    {r.result}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{r.unit}</span>
                  {r.referenceRange && <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Ref: {r.referenceRange}</span>}
                </div>
                {r.notes && <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: 'var(--color-text-sub)', fontStyle: 'italic' }}>{r.notes}</p>}
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 6 }}>
                  {r.resultedAt?.toDate ? format(r.resultedAt.toDate(), 'MMM d, yyyy h:mm a') : '—'} · {r.orderedBy}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && <AddLabModal onClose={() => setShowAdd(false)} />}
      <BottomNav />
    </div>
  );
}
