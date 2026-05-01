import { useEffect, useState } from 'react';
import {
  collection, query, orderBy, onSnapshot, addDoc, Timestamp, where, doc, getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import PageHeader from '../components/PageHeader';
import BottomNav from '../components/BottomNav';
import DrugWarning from '../components/DrugWarning';
import { SkeletonList } from '../components/Skeleton';
import { checkDrugInteractions } from '../data/drugInteractions';
import toast from 'react-hot-toast';
import {
  Activity, Stethoscope, ClipboardList, Pill,
  FlaskConical, FileText, Plus, Thermometer
} from 'lucide-react';
import { format } from 'date-fns';

// ─── Vitals Tab ───────────────────────────────────────
function VitalsTab({ patientId }) {
  const profile = useAuthStore((s) => s.profile);
  const [vitals,  setVitals]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [form,    setForm]    = useState({ bp: '', hr: '', temp: '', rr: '', o2: '', weight: '', notes: '' });
  const [saving,  setSaving]  = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'patients', patientId, 'vitals'),
      orderBy('recordedAt', 'desc')
    );
    return onSnapshot(q, (snap) => {
      setVitals(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, [patientId]);

  async function saveVitals(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await addDoc(collection(db, 'patients', patientId, 'vitals'), {
        ...form,
        recordedBy: profile?.displayName || 'Staff',
        recordedByRole: profile?.role,
        recordedAt: Timestamp.now(),
      });
      toast.success('Vitals saved!');
      setForm({ bp: '', hr: '', temp: '', rr: '', o2: '', weight: '', notes: '' });
      setShowForm(false);
    } catch { toast.error('Failed to save vitals.'); }
    finally { setSaving(false); }
  }

  return (
    <div>
      {['nurse', 'doctor', 'admin'].includes(profile?.role) && (
        <button className="btn-primary" style={{ width: '100%', marginBottom: '1rem' }}
          onClick={() => setShowForm(!showForm)}>
          <Plus size={18} /> {showForm ? 'Cancel' : 'Log Vitals'}
        </button>
      )}

      {showForm && (
        <form onSubmit={saveVitals} className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
          <div className="form-row">
            <div className="form-group"><label className="input-label">BP (mmHg)</label><input className="input-field" value={form.bp} onChange={(e) => setForm(f => ({...f, bp: e.target.value}))} placeholder="120/80" /></div>
            <div className="form-group"><label className="input-label">HR (bpm)</label><input className="input-field" type="number" value={form.hr} onChange={(e) => setForm(f => ({...f, hr: e.target.value}))} placeholder="72" /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="input-label">Temp (°C)</label><input className="input-field" type="number" step="0.1" value={form.temp} onChange={(e) => setForm(f => ({...f, temp: e.target.value}))} placeholder="36.6" /></div>
            <div className="form-group"><label className="input-label">RR (/min)</label><input className="input-field" type="number" value={form.rr} onChange={(e) => setForm(f => ({...f, rr: e.target.value}))} placeholder="16" /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="input-label">O₂ Sat (%)</label><input className="input-field" type="number" value={form.o2} onChange={(e) => setForm(f => ({...f, o2: e.target.value}))} placeholder="98" /></div>
            <div className="form-group"><label className="input-label">Weight (kg)</label><input className="input-field" type="number" step="0.1" value={form.weight} onChange={(e) => setForm(f => ({...f, weight: e.target.value}))} placeholder="65" /></div>
          </div>
          <div className="form-group"><label className="input-label">Nurse Notes</label><textarea className="input-field" value={form.notes} onChange={(e) => setForm(f => ({...f, notes: e.target.value}))} placeholder="Patient complaints, observations…" /></div>
          <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={saving}>{saving ? 'Saving…' : 'Save Vitals'}</button>
        </form>
      )}

      {loading ? <SkeletonList count={3} /> : vitals.length === 0 ? (
        <div className="empty-state"><Thermometer size={36} /><p>No vitals recorded yet.</p></div>
      ) : vitals.map((v) => (
        <div key={v.id} className="card" style={{ padding: '0.9rem', marginBottom: '0.6rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-sub)' }}>
              {v.recordedAt?.toDate ? format(v.recordedAt.toDate(), 'MMM d, yyyy h:mm a') : '—'}
            </span>
            <span className="badge badge-muted" style={{ fontSize: '0.7rem' }}>{v.recordedByRole}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {[['BP', v.bp, 'mmHg'], ['HR', v.hr, 'bpm'], ['Temp', v.temp, '°C'], ['RR', v.rr, '/min'], ['O₂', v.o2, '%'], ['Wt', v.weight, 'kg']].map(([lbl, val, unit]) => val ? (
              <div key={lbl} style={{ background: 'var(--color-surface)', borderRadius: 8, padding: '6px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{lbl}</div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-main)' }}>{val}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{unit}</div>
              </div>
            ) : null)}
          </div>
          {v.notes && <p style={{ margin: '8px 0 0', fontSize: '0.82rem', color: 'var(--color-text-sub)', fontStyle: 'italic' }}>"{v.notes}"</p>}
        </div>
      ))}
    </div>
  );
}

// ─── Orders Tab ───────────────────────────────────────
function OrdersTab({ patientId }) {
  const profile = useAuthStore((s) => s.profile);
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [form,    setForm]    = useState({ orderType: 'medication', details: '', priority: 'routine' });
  const [showForm, setShowForm] = useState(false);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'patients', patientId, 'orders'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => { setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); setLoading(false); });
  }, [patientId]);

  async function saveOrder(e) {
    e.preventDefault();
    if (!form.details) { toast.error('Order details required.'); return; }
    setSaving(true);
    try {
      await addDoc(collection(db, 'patients', patientId, 'orders'), {
        ...form,
        orderedBy: profile?.displayName || 'Doctor',
        orderedByRole: profile?.role,
        status: 'pending',
        createdAt: Timestamp.now(),
      });
      toast.success('Order created!');
      setForm({ orderType: 'medication', details: '', priority: 'routine' });
      setShowForm(false);
    } catch { toast.error('Failed to create order.'); }
    finally { setSaving(false); }
  }

  return (
    <div>
      {['doctor', 'admin'].includes(profile?.role) && (
        <button className="btn-primary" style={{ width: '100%', marginBottom: '1rem' }} onClick={() => setShowForm(!showForm)}>
          <Plus size={18} /> {showForm ? 'Cancel' : "New Doctor's Order"}
        </button>
      )}
      {showForm && (
        <form onSubmit={saveOrder} className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
          <div className="form-row">
            <div className="form-group">
              <label className="input-label">Order Type</label>
              <select className="input-field" value={form.orderType} onChange={(e) => setForm(f => ({...f, orderType: e.target.value}))}>
                {['medication', 'laboratory', 'imaging', 'procedure', 'referral', 'diet', 'other'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="input-label">Priority</label>
              <select className="input-field" value={form.priority} onChange={(e) => setForm(f => ({...f, priority: e.target.value}))}>
                {['routine', 'urgent', 'stat'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="input-label">Order Details *</label>
            <textarea className="input-field" value={form.details} onChange={(e) => setForm(f => ({...f, details: e.target.value}))} placeholder="Describe the order clearly…" />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={saving}>{saving ? 'Saving…' : 'Create Order'}</button>
        </form>
      )}
      {loading ? <SkeletonList count={3} /> : orders.length === 0 ? (
        <div className="empty-state"><ClipboardList size={36} /><p>No orders yet.</p></div>
      ) : orders.map((o) => (
        <div key={o.id} className="card" style={{ padding: '0.9rem', marginBottom: '0.6rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <span className="badge badge-amber" style={{ textTransform: 'capitalize' }}>{o.orderType}</span>
              <span className={`badge ${o.priority === 'stat' ? 'badge-danger' : o.priority === 'urgent' ? 'badge-warning' : 'badge-muted'}`} style={{ textTransform: 'capitalize' }}>{o.priority}</span>
            </div>
            <span className={`badge ${o.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>{o.status}</span>
          </div>
          <p style={{ margin: '0 0 6px', fontSize: '0.9rem', fontWeight: 500 }}>{o.details}</p>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            By {o.orderedBy} · {o.createdAt?.toDate ? format(o.createdAt.toDate(), 'MMM d, h:mm a') : '—'}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Prescriptions Tab ────────────────────────────────
function PrescriptionsTab({ patientId }) {
  const profile = useAuthStore((s) => s.profile);
  const [rxList,  setRxList]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [interactions, setInteractions] = useState([]);
  const [form,    setForm]    = useState({ drug: '', dose: '', route: '', frequency: '', duration: '', instructions: '' });
  const [showForm, setShowForm] = useState(false);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'patients', patientId, 'prescriptions'), orderBy('prescribedAt', 'desc'));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setRxList(list);
      setInteractions(checkDrugInteractions(list.map((r) => r.drug)));
      setLoading(false);
    });
  }, [patientId]);

  async function saveRx(e) {
    e.preventDefault();
    if (!form.drug || !form.dose) { toast.error('Drug name and dose required.'); return; }
    setSaving(true);
    try {
      await addDoc(collection(db, 'patients', patientId, 'prescriptions'), {
        ...form,
        prescribedBy: profile?.displayName || 'Doctor',
        prescribedByRole: profile?.role,
        status: 'active',
        prescribedAt: Timestamp.now(),
      });
      toast.success(`${form.drug} prescribed!`);
      setForm({ drug: '', dose: '', route: '', frequency: '', duration: '', instructions: '' });
      setShowForm(false);
    } catch { toast.error('Failed to save prescription.'); }
    finally { setSaving(false); }
  }

  return (
    <div>
      <DrugWarning interactions={interactions} />
      {['doctor', 'admin'].includes(profile?.role) && (
        <button className="btn-primary" style={{ width: '100%', marginBottom: '1rem' }} onClick={() => setShowForm(!showForm)}>
          <Plus size={18} /> {showForm ? 'Cancel' : 'New E-Prescription'}
        </button>
      )}
      {showForm && (
        <form onSubmit={saveRx} className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
          <div className="form-row">
            <div className="form-group"><label className="input-label">Drug Name *</label><input className="input-field" value={form.drug} onChange={(e) => setForm(f => ({...f, drug: e.target.value}))} placeholder="Amoxicillin" /></div>
            <div className="form-group"><label className="input-label">Dose *</label><input className="input-field" value={form.dose} onChange={(e) => setForm(f => ({...f, dose: e.target.value}))} placeholder="500mg" /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="input-label">Route</label><input className="input-field" value={form.route} onChange={(e) => setForm(f => ({...f, route: e.target.value}))} placeholder="Oral" /></div>
            <div className="form-group"><label className="input-label">Frequency</label><input className="input-field" value={form.frequency} onChange={(e) => setForm(f => ({...f, frequency: e.target.value}))} placeholder="TID" /></div>
          </div>
          <div className="form-group"><label className="input-label">Duration</label><input className="input-field" value={form.duration} onChange={(e) => setForm(f => ({...f, duration: e.target.value}))} placeholder="7 days" /></div>
          <div className="form-group"><label className="input-label">Special Instructions</label><textarea className="input-field" value={form.instructions} onChange={(e) => setForm(f => ({...f, instructions: e.target.value}))} placeholder="Take after meals…" /></div>
          <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={saving}>{saving ? 'Saving…' : 'Issue Prescription'}</button>
        </form>
      )}
      {loading ? <SkeletonList count={3} /> : rxList.length === 0 ? (
        <div className="empty-state"><Pill size={36} /><p>No prescriptions yet.</p></div>
      ) : rxList.map((rx) => (
        <div key={rx.id} className="card" style={{ padding: '0.9rem', marginBottom: '0.6rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{rx.drug} <span style={{ fontWeight: 400, color: 'var(--color-text-sub)' }}>{rx.dose}</span></div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                {rx.route} · {rx.frequency} {rx.duration ? `· ${rx.duration}` : ''}
              </div>
              {rx.instructions && <div style={{ fontSize: '0.78rem', color: 'var(--color-text-sub)', marginTop: 4, fontStyle: 'italic' }}>{rx.instructions}</div>}
            </div>
            <span className={`badge ${rx.status === 'active' ? 'badge-success' : 'badge-muted'}`}>{rx.status}</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 8 }}>
            Dr. {rx.prescribedBy} · {rx.prescribedAt?.toDate ? format(rx.prescribedAt.toDate(), 'MMM d, yyyy') : '—'}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Exam Results Tab ─────────────────────────────────
function ExamTab({ patientId }) {
  const profile = useAuthStore((s) => s.profile);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ chiefComplaint: '', hpi: '', pe: '', assessment: '', plan: '' });
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'patients', patientId, 'examinations'), orderBy('examinedAt', 'desc'));
    return onSnapshot(q, (snap) => { setExams(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); setLoading(false); });
  }, [patientId]);

  async function saveExam(e) {
    e.preventDefault();
    if (!form.chiefComplaint) { toast.error('Chief complaint required.'); return; }
    setSaving(true);
    try {
      await addDoc(collection(db, 'patients', patientId, 'examinations'), {
        ...form,
        examinedBy: profile?.displayName || 'Doctor',
        examinedAt: Timestamp.now(),
      });
      toast.success('Examination saved!');
      setForm({ chiefComplaint: '', hpi: '', pe: '', assessment: '', plan: '' });
      setShowForm(false);
    } catch { toast.error('Failed to save exam.'); }
    finally { setSaving(false); }
  }

  return (
    <div>
      {['doctor', 'admin'].includes(profile?.role) && (
        <button className="btn-primary" style={{ width: '100%', marginBottom: '1rem' }} onClick={() => setShowForm(!showForm)}>
          <Plus size={18} /> {showForm ? 'Cancel' : 'New Examination'}
        </button>
      )}
      {showForm && (
        <form onSubmit={saveExam} className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
          {[['chiefComplaint', 'Chief Complaint *', 'Chest pain for 2 days…'],
            ['hpi', 'History of Present Illness', 'Patient reports…'],
            ['pe', 'Physical Examination', 'BP: 130/85, HR: 88…'],
            ['assessment', 'Assessment / Diagnosis', 'Hypertensive urgency…'],
            ['plan', 'Plan', 'Start Amlodipine 5mg OD…'],
          ].map(([key, label, placeholder]) => (
            <div className="form-group" key={key}>
              <label className="input-label">{label}</label>
              <textarea className="input-field" value={form[key]} onChange={(e) => setForm(f => ({...f, [key]: e.target.value}))} placeholder={placeholder} />
            </div>
          ))}
          <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={saving}>{saving ? 'Saving…' : 'Save Examination'}</button>
        </form>
      )}
      {loading ? <SkeletonList count={2} /> : exams.length === 0 ? (
        <div className="empty-state"><Stethoscope size={36} /><p>No examinations recorded.</p></div>
      ) : exams.map((ex) => (
        <div key={ex.id} className="card" style={{ padding: '0.9rem', marginBottom: '0.6rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{ex.chiefComplaint}</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
              {ex.examinedAt?.toDate ? format(ex.examinedAt.toDate(), 'MMM d, yyyy') : '—'}
            </span>
          </div>
          {ex.assessment && <div style={{ fontSize: '0.82rem', color: 'var(--color-amber-dark)', fontWeight: 600, marginBottom: 4 }}>Dx: {ex.assessment}</div>}
          {ex.plan && <div style={{ fontSize: '0.82rem', color: 'var(--color-text-sub)' }}>Plan: {ex.plan}</div>}
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 6 }}>Dr. {ex.examinedBy}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────
const TABS = [
  { key: 'vitals', label: 'Vitals',   icon: Activity    },
  { key: 'exam',   label: 'Exam',     icon: Stethoscope },
  { key: 'orders', label: 'Orders',   icon: ClipboardList },
  { key: 'rx',     label: 'Rx',       icon: Pill        },
];

export default function PatientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [tab,     setTab]     = useState('vitals');

  useEffect(() => {
    getDoc(doc(db, 'patients', id)).then((snap) => {
      if (snap.exists()) setPatient({ id: snap.id, ...snap.data() });
    });
  }, [id]);

  return (
    <div className="page-root">
      <PageHeader
        title={patient ? `${patient.firstName} ${patient.lastName}` : 'Patient'}
        subtitle={patient ? `${patient.age ? patient.age + ' yrs' : ''} ${patient.gender ? '· ' + patient.gender : ''} ${patient.bloodType ? '· ' + patient.bloodType : ''}` : ''}
        backTo="/patients"
        liveIndicator
      />

      <div className="page-content">
        {/* Allergy Banner */}
        {patient?.allergies?.length > 0 && (
          <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
            ⚠ Allergies: {patient.allergies.join(', ')}
          </div>
        )}

        {/* Tabs */}
        <div className="tab-bar">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} className={`tab${tab === key ? ' active' : ''}`} onClick={() => setTab(key)}>
              <Icon size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              {label}
            </button>
          ))}
        </div>

        {tab === 'vitals' && <VitalsTab patientId={id} />}
        {tab === 'exam'   && <ExamTab   patientId={id} />}
        {tab === 'orders' && <OrdersTab patientId={id} />}
        {tab === 'rx'     && <PrescriptionsTab patientId={id} />}
      </div>

      <BottomNav />
    </div>
  );
}
