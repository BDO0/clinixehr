import { useEffect, useState } from 'react';
import {
  collection, query, orderBy, onSnapshot, addDoc, Timestamp, where, doc, getDoc, updateDoc, setDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import PageHeader from '../components/PageHeader';
import BottomNav from '../components/BottomNav';
import DrugWarning from '../components/DrugWarning';
import { SkeletonList } from '../components/Skeleton';
import { checkDrugInteractions, checkDrugAllergies } from '../data/drugInteractions';
import toast from 'react-hot-toast';
import {
  Activity, Stethoscope, ClipboardList, Pill,
  FlaskConical, FileText, Plus, Thermometer, User,
  AlertTriangle, Trash2, History, Syringe, ShieldAlert, AlertCircle,
  Clock
} from 'lucide-react';
import Icd10Autocomplete from '../components/Icd10Autocomplete';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Enhanced Components
import ClinicalTimeline from '../components/ClinicalTimeline';
import ClinicalInsights from '../components/ClinicalInsights';
import PatientSummaryCard from '../components/PatientSummaryCard';
import SmartAlertsHeader from '../components/SmartAlertsHeader';
import PrintButton from '../components/PrintButton';
import QrPatientBadge from '../components/QrPatientBadge';
import MedicationTimeline from '../components/MedicationTimeline';

// ─── Demographics Tab ─────────────────────────────────
function DemographicsTab({ patient, immunizations = [], vitals, labs, appointments, prescriptions }) {
  if (!patient) return null;
  return (
    <div>
      {/* Patient Summary Card */}
      <PatientSummaryCard
        patient={patient}
        vitals={vitals}
        labs={labs}
        appointments={appointments}
        prescriptions={prescriptions}
      />

      <div className="card" style={{ background: 'var(--color-surface)', padding: '1.5rem', border: '1px solid rgba(235, 193, 118, 0.3)' }}>
        {/* Profile Header with Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2rem' }}>
          <div style={{
            width: 84, height: 84, borderRadius: '24px',
            background: 'linear-gradient(135deg, #FBBF24, #C48B28)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: '2.5rem', fontWeight: 800,
            boxShadow: '0 8px 24px rgba(196,139,40,0.3)',
            flexShrink: 0
          }}>
            {patient.firstName?.charAt(0)}{patient.lastName?.charAt(0)}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.6rem', color: 'var(--color-text-main)', fontFamily: 'Montserrat, sans-serif', fontWeight: 800 }}>
              {patient.firstName} {patient.lastName}
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--color-amber)', fontSize: '0.82rem', fontWeight: 600, wordBreak: 'break-all', overflowWrap: 'break-word' }}>
              Patient ID: {patient.id}
            </p>
            <div style={{ marginTop: 8 }}>
              <QrPatientBadge patientId={patient.id} />
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '1.75rem' }}>
          {/* Primary Data */}
          <section>
            <h3 style={{ color: '#C48B28', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.8rem', borderBottom: '1px solid rgba(196,139,40,0.15)', paddingBottom: '6px' }}>
              Primary Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
              <div><label className="input-label" style={{ fontSize: '0.7rem' }}>Age / DOB</label><div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{patient.age ? `${patient.age} yrs` : '—'} {patient.dateOfBirth ? `(${patient.dateOfBirth})` : ''}</div></div>
              <div><label className="input-label" style={{ fontSize: '0.7rem' }}>Gender</label><div style={{ fontWeight: 600, fontSize: '0.95rem', textTransform: 'capitalize' }}>{patient.gender || '—'}</div></div>
            </div>
          </section>

          {/* Contact Data */}
          <section>
            <h3 style={{ color: '#C48B28', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.8rem', borderBottom: '1px solid rgba(196,139,40,0.15)', paddingBottom: '6px' }}>
              Contact Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
              <div><label className="input-label" style={{ fontSize: '0.7rem' }}>Phone</label><div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{patient.phone || '—'}</div></div>
              <div><label className="input-label" style={{ fontSize: '0.7rem' }}>Emergency Contact</label><div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{patient.emergencyContact || '—'}</div></div>
              <div><label className="input-label" style={{ fontSize: '0.7rem' }}>Emergency Phone</label><div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{patient.emergencyPhone || '—'}</div></div>
            </div>
          </section>

          {/* Metadata */}
          <section>
            <h3 style={{ color: '#C48B28', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.8rem', borderBottom: '1px solid rgba(196,139,40,0.15)', paddingBottom: '6px' }}>
              Clinical Metadata
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
              <div><label className="input-label" style={{ fontSize: '0.7rem' }}>Blood Type</label><div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-danger)' }}>{patient.bloodType || '—'}</div></div>
              <div>
                <label className="input-label" style={{ fontSize: '0.7rem' }}>Allergies</label>
                <div>
                  {patient.allergies?.length > 0 ? (
                    patient.allergies.map(a => <span key={a} className="badge badge-danger" style={{ marginRight: 4, padding: '4px 8px' }}>{a}</span>)
                  ) : <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-success)' }}>None recorded</span>}
                </div>
              </div>
              <div><label className="input-label" style={{ fontSize: '0.7rem' }}>Last Visit</label><div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : 'N/A'}</div></div>
            </div>
          </section>

          {/* Immunizations Summary */}
          <section>
            <h3 style={{ color: '#C48B28', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.8rem', borderBottom: '1px solid rgba(196,139,40,0.15)', paddingBottom: '6px' }}>
              Immunization History
            </h3>
            <div style={{ background: 'var(--color-white)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(196,139,40,0.1)' }}>
              {immunizations.length === 0 ? (
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No immunizations recorded yet.</p>
              ) : (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {immunizations.map(v => (
                    <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Syringe size={14} color="var(--color-amber)" />
                        <span style={{ fontWeight: 600 }}>{v.vaccineName}</span>
                      </div>
                      <div style={{ color: 'var(--color-text-sub)' }}>{v.dateAdministered}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

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

      {loading ? <SkeletonList count={3} /> : (
        <>
          {vitals.length > 1 && (
            <div className="card" style={{ padding: '1rem', marginBottom: '1rem', height: 280 }}>
              <h4 style={{ margin: '0 0 1rem', fontSize: '0.9rem', color: 'var(--color-text-sub)' }}>Heart Rate & Weight Trends</h4>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={vitals.map(v => ({
                  time: v.recordedAt?.toDate ? format(v.recordedAt.toDate(), 'MMM d') : '',
                  hr: Number(v.hr) || null,
                  weight: Number(v.weight) || null,
                })).reverse()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: '0.8rem', borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                  <Line yAxisId="left" type="monotone" dataKey="hr" name="Heart Rate (bpm)" stroke="#DC2626" strokeWidth={2} dot={{ r: 3 }} />
                  <Line yAxisId="right" type="monotone" dataKey="weight" name="Weight (kg)" stroke="#2563EB" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          {vitals.length === 0 ? (
            <div className="empty-state"><Thermometer size={36} /><p>No vitals recorded yet.</p></div>
          ) : vitals.map((v) => (
        <div key={v.id} className="card" style={{ padding: '0.9rem', marginBottom: '0.6rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-sub)' }}>
              {v.recordedAt?.toDate ? format(v.recordedAt.toDate(), 'MMM d, yyyy h:mm a') : '—'}
            </span>
            <span className="badge badge-muted" style={{ fontSize: '0.7rem' }}>{v.recordedByRole}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: 6 }}>
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
        </>
      )}
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
function PrescriptionsTab({ patientId, patient }) {
  const profile = useAuthStore((s) => s.profile);
  const [rxList,  setRxList]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [interactions, setInteractions] = useState([]);
  
  // States for the current prescribing form
  const [form, setForm] = useState({ 
    drug: '', dose: '', route: '', frequency: '', duration: '', instructions: '', justification: '' 
  });
  const [pendingSafety, setPendingSafety] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'patients', patientId, 'prescriptions'), orderBy('prescribedAt', 'desc'));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => {
        const data = d.data();
        let isExpired = false;
        if (data.status === 'active' && data.duration && data.prescribedAt) {
          const prescribedTime = data.prescribedAt.toMillis();
          const durationMs = parseInt(data.duration) * 86400000;
          if (Date.now() > prescribedTime + durationMs) isExpired = true;
        }
        return { id: d.id, ...data, isExpired, computedStatus: data.status === 'discontinued' ? 'discontinued' : isExpired ? 'completed' : data.status };
      });
      setRxList(list);
      setInteractions(checkDrugInteractions(list.filter(r => r.computedStatus === 'active').map(r => r.drug)));
      setLoading(false);
    });
  }, [patientId]);

  async function saveRx(e) {
    e.preventDefault();
    if (!form.drug || !form.dose) { toast.error('Drug name and dose required.'); return; }
    
    // Safety Logic (Soft Stop on Submit)
    if (!pendingSafety) {
      const activeMeds = rxList.filter(r => r.computedStatus === 'active').map(r => r.drug);
      const simulatedMeds = [...new Set([...activeMeds, form.drug])];
      
      const interactionsFound = checkDrugInteractions(simulatedMeds).filter(i => 
        i.drugs.some(d => form.drug.toLowerCase().includes(d.toLowerCase()))
      );
      const allergyFound = checkDrugAllergies(form.drug, patient?.allergies);
      
      const hasHighRisk = interactionsFound.some(i => ['high', 'contraindicated'].includes(i.severity)) || allergyFound;

      if (hasHighRisk) {
        setPendingSafety({ interactions: interactionsFound, allergy: allergyFound });
        toast.error('Safety risks detected. Please review and provide justification.');
        return; // Soft Stop
      }
    }

    if (pendingSafety && !form.justification) {
      toast.error('Clinical Justification is required for high-risk prescriptions.');
      return;
    }

    setSaving(true);
    try {
      const rxData = {
        drug: form.drug,
        dose: form.dose,
        route: form.route,
        frequency: form.frequency,
        duration: form.duration,
        instructions: form.instructions,
        overrideRationale: form.justification || null,
        prescribedBy: profile?.displayName || 'Doctor',
        prescribedByRole: profile?.role,
        status: 'active',
        prescribedAt: Timestamp.now(),
      };

      const newRxRef = doc(collection(db, 'patients', patientId, 'prescriptions'));
      const rxId = newRxRef.id;

      await setDoc(newRxRef, rxData);
      if (patient) {
        await setDoc(doc(db, 'allPrescriptions', rxId), {
          ...rxData,
          patientId: patientId,
          patientName: `${patient.firstName} ${patient.lastName}`
        });
      }

      toast.success(`${form.drug} prescribed!`);
      setForm({ drug: '', dose: '', route: '', frequency: '', duration: '', instructions: '', justification: '' });
      setPendingSafety(null);
      setShowForm(false);
    } catch { toast.error('Failed to save prescription.'); }
    finally { setSaving(false); }
  }

  async function handleDiscontinue(rxId) {
    if (!window.confirm("Are you sure you want to discontinue this medication?")) return;
    try {
      // Update local patient record
      await updateDoc(doc(db, 'patients', patientId, 'prescriptions', rxId), { status: 'discontinued' });
      // Update global pharmacy record
      await updateDoc(doc(db, 'allPrescriptions', rxId), { status: 'discontinued' });
      toast.success("Medication discontinued.");
    } catch (e) {
      toast.error("Failed to discontinue medication.");
    }
  }

  return (
    <div>
      {/* Existing medications summary alerts */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 8, letterSpacing: '0.05em' }}>Current Safety Summary</h4>
        <DrugWarning interactions={interactions} />
      </div>

      {['doctor', 'admin'].includes(profile?.role) && (
        <button className="btn-primary" style={{ width: '100%', marginBottom: '1.25rem', boxShadow: 'var(--shadow-md)' }} onClick={() => setShowForm(!showForm)}>
          <Plus size={18} /> {showForm ? 'Cancel' : 'New E-Prescription'}
        </button>
      )}

      {showForm && (
        <form onSubmit={saveRx} className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem', border: '1px solid var(--color-border)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--color-amber)' }}></div>
          
          <h3 style={{ margin: '0 0 1.25rem', fontSize: '1rem', fontWeight: 800 }}>Electronic Prescription</h3>

          <div className="form-row">
            <div className="form-group"><label className="input-label">Drug Name *</label><input className="input-field" value={form.drug} onChange={(e) => { setForm(f => ({...f, drug: e.target.value})); setPendingSafety(null); }} placeholder="e.g. Sildenafil, Amoxicillin..." /></div>
            <div className="form-group"><label className="input-label">Dose *</label><input className="input-field" value={form.dose} onChange={(e) => setForm(f => ({...f, dose: e.target.value}))} placeholder="500mg" /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="input-label">Route</label><input className="input-field" value={form.route} onChange={(e) => setForm(f => ({...f, route: e.target.value}))} placeholder="Oral" /></div>
            <div className="form-group"><label className="input-label">Frequency</label><input className="input-field" value={form.frequency} onChange={(e) => setForm(f => ({...f, frequency: e.target.value}))} placeholder="TID" /></div>
          </div>
          <div className="form-group"><label className="input-label">Duration (Days)</label><input className="input-field" type="number" value={form.duration} onChange={(e) => setForm(f => ({...f, duration: e.target.value}))} placeholder="7" /></div>
          <div className="form-group"><label className="input-label">Special Instructions</label><textarea className="input-field" value={form.instructions} onChange={(e) => setForm(f => ({...f, instructions: e.target.value}))} placeholder="Take after meals…" style={{ minHeight: '60px' }} /></div>

          {/* Pending Safety Dashboard (Soft Stop) */}
          {pendingSafety && (
            <div style={{ margin: '1rem 0', padding: '1rem', background: 'var(--color-surface)', borderRadius: 12, border: '1px dashed var(--color-border)' }}>
              <h4 style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 8 }}>Safety Check Results</h4>
              {pendingSafety.allergy && (
                <div className="alert alert-critical" style={{ marginBottom: 8, fontSize: '0.85rem', display: 'flex', gap: 8 }}>
                  <ShieldAlert size={16} /> <strong>ALLERGY ALERT:</strong> {pendingSafety.allergy}
                </div>
              )}
              <DrugWarning interactions={pendingSafety.interactions} />
            </div>
          )}

          {/* Clinical Justification for Overrides */}
          {pendingSafety && (
            <div className="form-group" style={{ marginTop: '1rem', padding: '1rem', background: 'var(--color-danger-bg)', borderRadius: 8, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <label className="input-label" style={{ color: 'var(--color-danger)', fontWeight: 800 }}>Clinical Justification Required *</label>
              <textarea 
                className="input-field" 
                style={{ borderColor: 'var(--color-danger)', background: 'var(--color-white)' }}
                value={form.justification} 
                onChange={(e) => setForm(f => ({...f, justification: e.target.value}))} 
                placeholder="Reason for overriding interaction/allergy (e.g. Benefits outweigh risks, patient stable on this dose...)" 
                required
              />
            </div>
          )}

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', marginTop: '0.5rem', background: pendingSafety ? 'var(--color-danger)' : 'var(--color-amber)' }} 
            disabled={saving}
          >
            {saving ? 'Processing...' : pendingSafety ? 'Override & Issue Prescription' : 'Issue Prescription'}
          </button>
        </form>
      )}

      {/* Medication Timeline Visualization */}
      <div style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
        <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 8, letterSpacing: '0.05em' }}>
          Medication History
        </h4>
        <MedicationTimeline prescriptions={rxList} />
      </div>

      {loading ? <SkeletonList count={3} /> : rxList.length === 0 ? (
        <div className="empty-state"><Pill size={36} /><p>No prescriptions yet.</p></div>
      ) : rxList.map((rx) => (
        <div key={rx.id} className="card" style={{ padding: '1rem', marginBottom: '0.75rem', borderLeft: rx.overrideRationale ? '4px solid var(--color-danger)' : '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text-main)' }}>{rx.drug} <span style={{ fontWeight: 400, color: 'var(--color-text-sub)', fontSize: '0.85rem' }}>{rx.dose}</span></div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                {rx.route} · {rx.frequency} {rx.duration ? `· ${rx.duration} days` : ''}
              </div>
              
              {rx.overrideRationale && (
                <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--color-danger-bg)', borderRadius: 6, fontSize: '0.8rem', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                  <div style={{ color: 'var(--color-danger)', fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ShieldAlert size={10} /> Override Rationale
                  </div>
                  <div style={{ fontStyle: 'italic', color: 'var(--color-text-main)' }}>"{rx.overrideRationale}"</div>
                </div>
              )}

              {rx.instructions && <div style={{ fontSize: '0.78rem', color: 'var(--color-text-sub)', marginTop: 8, fontStyle: 'italic' }}>Note: {rx.instructions}</div>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, marginLeft: 12 }}>
              <span className={`badge ${rx.computedStatus === 'active' ? 'badge-success' : rx.computedStatus === 'completed' ? 'badge-amber' : 'badge-muted'}`} style={{ fontSize: '0.65rem' }}>
                {rx.computedStatus}
              </span>
              {rx.computedStatus === 'active' && ['doctor', 'nurse'].includes(profile?.role) && (
                <button onClick={() => handleDiscontinue(rx.id)} className="btn-ghost" style={{ fontSize: '0.7rem', padding: '4px 8px', color: 'var(--color-danger)', background: 'var(--color-danger-bg)', borderRadius: 6 }}>
                  Discontinue
                </button>
              )}
            </div>
          </div>
          <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
            <PrintButton type="prescription" patient={patient} data={rx} onPrint="print" />
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 12, borderTop: '1px solid var(--color-border)', paddingTop: 8 }}>
            Prescribed by Dr. {rx.prescribedBy} · {rx.prescribedAt?.toDate ? format(rx.prescribedAt.toDate(), 'MMM d, yyyy') : '—'}
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
  const [form, setForm] = useState({ chiefComplaint: '', hpi: '', pe: '', assessment: '', plan: '', intervention: '', evaluation: '' });
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'patients', patientId, 'examinations'), orderBy('examinedAt', 'desc'));
    return onSnapshot(q, (snap) => { setExams(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); setLoading(false); });
  }, [patientId]);

  async function saveExam(e) {
    e.preventDefault();
    if (!form.chiefComplaint || !form.assessment || !form.plan) { 
      toast.error('Chief Complaint, Assessment, and Plan are required.'); 
      return; 
    }
    setSaving(true);
    try {
      await addDoc(collection(db, 'patients', patientId, 'examinations'), {
        ...form,
        examinedBy: profile?.displayName || 'Staff',
        examinedAt: Timestamp.now(),
      });
      toast.success('Examination saved!');
      setForm({ chiefComplaint: '', hpi: '', pe: '', assessment: '', plan: '', intervention: '', evaluation: '' });
      setShowForm(false);
    } catch { toast.error('Failed to save exam.'); }
    finally { setSaving(false); }
  }

  return (
    <div>
      {['doctor', 'admin', 'nurse'].includes(profile?.role) && (
        <button className="btn-primary" style={{ width: '100%', marginBottom: '1rem' }} onClick={() => setShowForm(!showForm)}>
          <Plus size={18} /> {showForm ? 'Cancel' : 'New Examination'}
        </button>
      )}
      {showForm && (
        <form onSubmit={saveExam} className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
          {[['chiefComplaint', 'Subjective / Chief Complaint *', 'Chest pain for 2 days…'],
            ['hpi', 'History of Present Illness', 'Patient reports…'],
            ['pe', 'Objective / Physical Exam', 'BP: 130/85, HR: 88…']
          ].map(([key, label, placeholder]) => (
            <div className="form-group" key={key}>
              <label className="input-label">{label}</label>
              <textarea className="input-field" value={form[key]} onChange={(e) => setForm(f => ({...f, [key]: e.target.value}))} placeholder={placeholder} />
            </div>
          ))}

          <Icd10Autocomplete 
            value={form.assessment} 
            onChange={(val) => setForm(f => ({...f, assessment: val}))} 
          />

          {[['plan', 'Plan *', 'Start Amlodipine 5mg OD…'],
            ['intervention', 'Intervention', 'Actions taken during visit…'],
            ['evaluation', 'Evaluation', 'Patient response to intervention…'],
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
          {ex.assessment && <div style={{ fontSize: '0.82rem', color: 'var(--color-amber-dark)', fontWeight: 600, marginBottom: 4 }}>A: {ex.assessment}</div>}
          {ex.plan && <div style={{ fontSize: '0.82rem', color: 'var(--color-text-sub)', marginBottom: 2 }}>P: {ex.plan}</div>}
          {ex.intervention && <div style={{ fontSize: '0.82rem', color: 'var(--color-text-sub)', marginBottom: 2 }}>I: {ex.intervention}</div>}
          {ex.evaluation && <div style={{ fontSize: '0.82rem', color: 'var(--color-text-sub)' }}>E: {ex.evaluation}</div>}
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 6 }}>By {ex.examinedBy}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Immunizations Tab ────────────────────────────────
function ImmunizationsTab({ patientId }) {
  const profile = useAuthStore((s) => s.profile);
  const [vaccines, setVaccines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ vaccineName: '', dateAdministered: '', lotNumber: '', nextDueDate: '', notes: '' });
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'patients', patientId, 'immunizations'), orderBy('dateAdministered', 'desc'));
    return onSnapshot(q, (snap) => {
      setVaccines(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, [patientId]);

  async function saveVaccine(e) {
    e.preventDefault();
    if (!form.vaccineName || !form.dateAdministered) { toast.error('Vaccine Name and Date Administered are required.'); return; }
    setSaving(true);
    try {
      await addDoc(collection(db, 'patients', patientId, 'immunizations'), {
        ...form,
        administeredBy: profile?.displayName || 'Staff',
        administeredByRole: profile?.role,
        createdAt: Timestamp.now(),
      });
      toast.success('Immunization record saved!');
      setForm({ vaccineName: '', dateAdministered: '', lotNumber: '', nextDueDate: '', notes: '' });
      setShowForm(false);
    } catch { toast.error('Failed to save immunization.'); }
    finally { setSaving(false); }
  }

  return (
    <div>
      {['doctor', 'nurse', 'admin'].includes(profile?.role) && (
        <button className="btn-primary" style={{ width: '100%', marginBottom: '1rem' }} onClick={() => setShowForm(!showForm)}>
          <Plus size={18} /> {showForm ? 'Cancel' : 'Add Immunization'}
        </button>
      )}
      {showForm && (
        <form onSubmit={saveVaccine} className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
          <div className="form-row">
            <div className="form-group"><label className="input-label">Vaccine Name *</label><input className="input-field" value={form.vaccineName} onChange={(e) => setForm(f => ({...f, vaccineName: e.target.value}))} placeholder="e.g. COVID-19 Pfizer" /></div>
            <div className="form-group"><label className="input-label">Date Administered *</label><input className="input-field" type="date" value={form.dateAdministered} onChange={(e) => setForm(f => ({...f, dateAdministered: e.target.value}))} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="input-label">Lot / Batch Number</label><input className="input-field" value={form.lotNumber} onChange={(e) => setForm(f => ({...f, lotNumber: e.target.value}))} placeholder="e.g. AB12345" /></div>
            <div className="form-group"><label className="input-label">Next Due Date</label><input className="input-field" type="date" value={form.nextDueDate} onChange={(e) => setForm(f => ({...f, nextDueDate: e.target.value}))} /></div>
          </div>
          <div className="form-group"><label className="input-label">Notes / Reactions</label><textarea className="input-field" value={form.notes} onChange={(e) => setForm(f => ({...f, notes: e.target.value}))} placeholder="Patient observed for 15 mins..." style={{ minHeight: '60px' }} /></div>
          <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={saving}>{saving ? 'Saving…' : 'Save Immunization'}</button>
        </form>
      )}
      {loading ? <SkeletonList count={2} /> : vaccines.length === 0 ? (
        <div className="empty-state"><Syringe size={36} /><p>No immunizations recorded yet.</p></div>
      ) : vaccines.map((v) => (
        <div key={v.id} className="card" style={{ padding: '0.9rem', marginBottom: '0.6rem', borderLeft: '4px solid var(--color-info)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{v.vaccineName}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-sub)' }}>Given: {v.dateAdministered}</div>
              {v.lotNumber && <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Lot: {v.lotNumber}</div>}
            </div>
            {v.nextDueDate && (
              <div style={{ textAlign: 'right' }}>
                <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>Due: {v.nextDueDate}</span>
              </div>
            )}
          </div>
          {v.notes && <p style={{ margin: '8px 0 0', fontSize: '0.82rem', color: 'var(--color-text-sub)', fontStyle: 'italic' }}>"{v.notes}"</p>}
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 8 }}>
            Administered by {v.administeredBy} ({v.administeredByRole})
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Discharge Tab ────────────────────────────────────
function DischargeTab({ patientId, patient }) {
  const profile = useAuthStore((s) => s.profile);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    condition: '', date: '', nature: 'Home per Request',
    medication: '', exercise: '', diet: '', healthTeaching: '', nextVisit: ''
  });
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'patients', patientId, 'dischargePlans'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      setPlans(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, [patientId]);

  async function savePlan(e) {
    e.preventDefault();
    if (!form.date || !form.nature) { toast.error('Date and Nature are required.'); return; }
    setSaving(true);
    try {
      await addDoc(collection(db, 'patients', patientId, 'dischargePlans'), {
        ...form,
        createdBy: profile?.displayName || 'Staff',
        createdAt: Timestamp.now(),
      });
      toast.success('Discharge Plan saved!');
      setForm({ condition: '', date: '', nature: 'Home per Request', medication: '', exercise: '', diet: '', healthTeaching: '', nextVisit: '' });
      setShowForm(false);
    } catch { toast.error('Failed to save discharge plan.'); }
    finally { setSaving(false); }
  }

  return (
    <div>
      {['doctor', 'admin', 'nurse'].includes(profile?.role) && (
        <button className="btn-primary" style={{ width: '100%', marginBottom: '1rem' }} onClick={() => setShowForm(!showForm)}>
          <Plus size={18} /> {showForm ? 'Cancel' : 'New Discharge Plan'}
        </button>
      )}
      {showForm && (
        <form onSubmit={savePlan} className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
          <h3 style={{ textAlign: 'center', margin: '0 0 1.5rem', fontFamily: 'Montserrat', fontWeight: 800 }}>DISCHARGE PLAN</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label className="input-label">Condition upon Discharge</label>
              <input className="input-field" value={form.condition} onChange={e => setForm(f => ({...f, condition: e.target.value}))} placeholder="Stable, ambulatory..." />
            </div>
            <div className="form-group">
              <label className="input-label">Date of Discharge *</label>
              <input className="input-field" type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} />
            </div>
          </div>
          <div className="form-group">
            <label className="input-label">Nature of Discharge *</label>
            <select className="input-field" value={form.nature} onChange={e => setForm(f => ({...f, nature: e.target.value}))}>
              <option value="Home per Request">Home per Request</option>
              <option value="Discharge Against Medical Advise">Discharge Against Medical Advise</option>
              <option value="MGH">MGH (May Go Home)</option>
            </select>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid rgba(196,139,40,0.15)', margin: '1rem 0' }} />

          {[['medication', '1. Medication', 'List home medications...'],
            ['exercise', '2. Exercise', 'Activity restrictions, rehab...'],
            ['diet', '3. Diet', 'Dietary instructions...'],
            ['healthTeaching', '4. Health Teaching', 'Wound care, signs to watch for...'],
            ['nextVisit', '5. Schedule for Next Visit', 'Follow-up date and location...']
          ].map(([key, label, placeholder]) => (
            <div className="form-group" key={key}>
              <label className="input-label">{label}</label>
              <textarea className="input-field" value={form[key]} onChange={e => setForm(f => ({...f, [key]: e.target.value}))} placeholder={placeholder} style={{ minHeight: '60px' }} />
            </div>
          ))}

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={saving}>{saving ? 'Saving…' : 'Save Discharge Plan'}</button>
        </form>
      )}
      
      {loading ? <SkeletonList count={2} /> : plans.length === 0 ? (
        <div className="empty-state"><FileText size={36} /><p>No discharge plans.</p></div>
      ) : plans.map((p) => (
        <div key={p.id} className="card" style={{ padding: '0.9rem', marginBottom: '0.6rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Discharge Plan: {p.date}</span>
            <span className="badge badge-amber">{p.nature}</span>
          </div>
          {p.condition && <div style={{ fontSize: '0.82rem', marginBottom: 6 }}><strong>Condition:</strong> {p.condition}</div>}
          
          <div style={{ display: 'grid', gap: '0.5rem', background: 'var(--color-surface)', padding: '0.5rem', borderRadius: 4, marginTop: 8 }}>
            {p.medication && <div style={{ fontSize: '0.8rem' }}><strong style={{ color: 'var(--color-amber-dark)' }}>1. Medication:</strong> {p.medication}</div>}
            {p.exercise && <div style={{ fontSize: '0.8rem' }}><strong style={{ color: 'var(--color-amber-dark)' }}>2. Exercise:</strong> {p.exercise}</div>}
            {p.diet && <div style={{ fontSize: '0.8rem' }}><strong style={{ color: 'var(--color-amber-dark)' }}>3. Diet:</strong> {p.diet}</div>}
            {p.healthTeaching && <div style={{ fontSize: '0.8rem' }}><strong style={{ color: 'var(--color-amber-dark)' }}>4. Health Teaching:</strong> {p.healthTeaching}</div>}
            {p.nextVisit && <div style={{ fontSize: '0.8rem' }}><strong style={{ color: 'var(--color-amber-dark)' }}>5. Next Visit:</strong> {p.nextVisit}</div>}
          </div>

          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
            <PrintButton type="discharge" patient={patient} data={p} onPrint="print" />
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 6 }}>By {p.createdBy}</div>
        </div>
      ))}
    </div>
  );
}

// ─── History Tab ───────────────────────────────────────
function HistoryTab({ patient }) {
  const [pmh, setPmh] = useState(patient?.pmh || []);
  const [surgical, setSurgical] = useState(patient?.surgicalHistory || []);
  const [family, setFamily] = useState(patient?.familyHistory || []);
  const [social, setSocial] = useState(patient?.socialHistory || []);
  const [saving, setSaving] = useState(false);

  const [newPmh, setNewPmh] = useState({ condition: '', year: '', critical: false });
  const [newSurg, setNewSurg] = useState({ procedure: '', year: '', hospital: '' });
  const [newFam, setNewFam] = useState({ relation: '', condition: '' });
  const [newSoc, setNewSoc] = useState({ factor: '', details: '' });

  const addPmh = () => {
    if (!newPmh.condition) return;
    setPmh([...pmh, newPmh]);
    setNewPmh({ condition: '', year: '', critical: false });
  };

  const addSurg = () => {
    if (!newSurg.procedure) return;
    setSurgical([...surgical, newSurg]);
    setNewSurg({ procedure: '', year: '', hospital: '' });
  };

  const addFam = () => {
    if (!newFam.relation || !newFam.condition) return;
    setFamily([...family, newFam]);
    setNewFam({ relation: '', condition: '' });
  };

  const addSoc = () => {
    if (!newSoc.factor || !newSoc.details) return;
    setSocial([...social, newSoc]);
    setNewSoc({ factor: '', details: '' });
  };

  const saveHistory = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'patients', patient.id), {
        pmh,
        surgicalHistory: surgical,
        familyHistory: family,
        socialHistory: social
      });
      toast.success('Medical History saved!');
    } catch (e) {
      toast.error('Failed to save history.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn-primary" onClick={saveHistory} disabled={saving}>
          {saving ? 'Saving...' : 'Save All History'}
        </button>
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem', color: 'var(--color-text-main)', fontSize: '1.1rem' }}>Past Medical History (PMH)</h3>
        {pmh.length > 0 && (
          <div className="table-responsive">
            <table className="lab-panel-table" style={{ marginBottom: '1rem' }}>
              <thead><tr><th>Condition</th><th>Year</th><th>Critical</th><th></th></tr></thead>
              <tbody>
                {pmh.map((item, i) => (
                  <tr key={i}>
                    <td data-label="Condition" style={{ fontWeight: 600 }}>{item.condition}</td>
                    <td data-label="Year">{item.year || '—'}</td>
                    <td data-label="Critical">{item.critical ? <span className="badge badge-danger">Critical</span> : 'No'}</td>
                    <td data-label="Actions" style={{ textAlign: 'right' }}>
                      <button className="btn-ghost" style={{ padding: '4px' }} onClick={() => setPmh(pmh.filter((_, idx) => idx !== i))}><Trash2 size={14} color="var(--color-danger)" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="inline-add-row">
          <div style={{ flex: 2 }}><label className="input-label">Condition</label><input className="input-field" value={newPmh.condition} onChange={e => setNewPmh({...newPmh, condition: e.target.value})} placeholder="e.g. Hypertension" /></div>
          <div style={{ flex: 1 }}><label className="input-label">Year</label><input className="input-field" value={newPmh.year} onChange={e => setNewPmh({...newPmh, year: e.target.value})} placeholder="YYYY" /></div>
          <div style={{ display: 'flex', alignItems: 'center', height: '48px', paddingLeft: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
              <input type="checkbox" checked={newPmh.critical} onChange={e => setNewPmh({...newPmh, critical: e.target.checked})} style={{ width: '18px', height: '18px' }} />
              Mark Critical
            </label>
          </div>
          <button className="btn-secondary" onClick={addPmh}>Add</button>
        </div>
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem', color: 'var(--color-text-main)', fontSize: '1.1rem' }}>Surgical History</h3>
        {surgical.length > 0 && (
          <div className="table-responsive">
            <table className="lab-panel-table" style={{ marginBottom: '1rem' }}>
              <thead><tr><th>Procedure</th><th>Year</th><th>Location</th><th></th></tr></thead>
              <tbody>
                {surgical.map((item, i) => (
                  <tr key={i}>
                    <td data-label="Procedure" style={{ fontWeight: 600 }}>{item.procedure}</td>
                    <td data-label="Year">{item.year || '—'}</td>
                    <td data-label="Location">{item.hospital || '—'}</td>
                    <td data-label="Actions" style={{ textAlign: 'right' }}>
                      <button className="btn-ghost" style={{ padding: '4px' }} onClick={() => setSurgical(surgical.filter((_, idx) => idx !== i))}><Trash2 size={14} color="var(--color-danger)" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="inline-add-row">
          <div style={{ flex: 2 }}><label className="input-label">Procedure</label><input className="input-field" value={newSurg.procedure} onChange={e => setNewSurg({...newSurg, procedure: e.target.value})} placeholder="e.g. Appendectomy" /></div>
          <div style={{ flex: 1 }}><label className="input-label">Year</label><input className="input-field" value={newSurg.year} onChange={e => setNewSurg({...newSurg, year: e.target.value})} placeholder="YYYY" /></div>
          <div style={{ flex: 1.5 }}><label className="input-label">Location/Hospital</label><input className="input-field" value={newSurg.hospital} onChange={e => setNewSurg({...newSurg, hospital: e.target.value})} placeholder="City Gen" /></div>
          <button className="btn-secondary" onClick={addSurg}>Add</button>
        </div>
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem', color: 'var(--color-text-main)', fontSize: '1.1rem' }}>Family History</h3>
        {family.length > 0 && (
          <div className="table-responsive">
            <table className="lab-panel-table" style={{ marginBottom: '1rem' }}>
              <thead><tr><th>Relation</th><th>Condition</th><th></th></tr></thead>
              <tbody>
                {family.map((item, i) => (
                  <tr key={i}>
                    <td data-label="Relation" style={{ fontWeight: 600 }}>{item.relation}</td>
                    <td data-label="Condition">{item.condition}</td>
                    <td data-label="Actions" style={{ textAlign: 'right' }}>
                      <button className="btn-ghost" style={{ padding: '4px' }} onClick={() => setFamily(family.filter((_, idx) => idx !== i))}><Trash2 size={14} color="var(--color-danger)" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="inline-add-row">
          <div style={{ flex: 1 }}><label className="input-label">Relation</label><input className="input-field" value={newFam.relation} onChange={e => setNewFam({...newFam, relation: e.target.value})} placeholder="e.g. Father" /></div>
          <div style={{ flex: 2 }}><label className="input-label">Condition</label><input className="input-field" value={newFam.condition} onChange={e => setNewFam({...newFam, condition: e.target.value})} placeholder="e.g. Heart Disease" /></div>
          <button className="btn-secondary" onClick={addFam}>Add</button>
        </div>
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem', color: 'var(--color-text-main)', fontSize: '1.1rem' }}>Social History</h3>
        {social.length > 0 && (
          <div className="table-responsive">
            <table className="lab-panel-table" style={{ marginBottom: '1rem' }}>
              <thead><tr><th>Factor</th><th>Details</th><th></th></tr></thead>
              <tbody>
                {social.map((item, i) => (
                  <tr key={i}>
                    <td data-label="Factor" style={{ fontWeight: 600 }}>{item.factor}</td>
                    <td data-label="Details">{item.details}</td>
                    <td data-label="Actions" style={{ textAlign: 'right' }}>
                      <button className="btn-ghost" style={{ padding: '4px' }} onClick={() => setSocial(social.filter((_, idx) => idx !== i))}><Trash2 size={14} color="var(--color-danger)" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="inline-add-row">
          <div style={{ flex: 1 }}><label className="input-label">Factor</label>
            <select className="input-field" value={newSoc.factor} onChange={e => setNewSoc({...newSoc, factor: e.target.value})}>
              <option value="">Select...</option>
              <option value="Smoking">Smoking</option>
              <option value="Alcohol">Alcohol</option>
              <option value="Recreational Drugs">Recreational Drugs</option>
              <option value="Occupation">Occupation</option>
              <option value="Exercise">Exercise</option>
            </select>
          </div>
          <div style={{ flex: 2 }}><label className="input-label">Details</label><input className="input-field" value={newSoc.details} onChange={e => setNewSoc({...newSoc, details: e.target.value})} placeholder="e.g. 1 pack/day for 10 yrs" /></div>
          <button className="btn-secondary" onClick={addSoc}>Add</button>
        </div>
      </div>
    </div>
  );
}

// ─── Labs Tab ─────────────────────────────────────────
function LabsTab({ patientId, patient }) {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'labResults'), where('patientId', '==', patientId));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.resultedAt?.toMillis?.() || 0) - (a.resultedAt?.toMillis?.() || 0));
      setLabs(list);
      setLoading(false);
      
      // Auto-select first available metric if none selected
      if (!selectedMetric && list.length > 0) {
        const first = list.find(l => l.result || (l.panelData && Object.keys(l.panelData).length > 0));
        if (first) {
          if (first.result) setSelectedMetric(first.testName);
          else if (first.panelData) setSelectedMetric(Object.keys(first.panelData)[0]);
        }
      }
    });
  }, [patientId]);

  // Extract all unique metrics available in this patient's history
  const availableMetrics = new Set();
  labs.forEach(l => {
    if (l.result) availableMetrics.add(l.testName);
    if (l.panelData) Object.keys(l.panelData).forEach(k => availableMetrics.add(k));
  });
  const metricsList = Array.from(availableMetrics).sort();

  const chartData = labs
    .map(l => {
      let val = null;
      if (l.testName === selectedMetric && l.result) {
        val = Number(l.result);
      } else if (l.panelData && l.panelData[selectedMetric]) {
        val = Number(l.panelData[selectedMetric]);
      }
      
      if (isNaN(val) || val === null) return null;

      return {
        time: l.resultedAt?.toDate ? format(l.resultedAt.toDate(), 'MMM d') : '',
        fullTime: l.resultedAt?.toDate ? format(l.resultedAt.toDate(), 'MMM d, p') : '',
        value: val,
      };
    })
    .filter(d => d !== null)
    .reverse();

  return (
    <div>
      {metricsList.length > 0 && (
        <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '12px' }}>
            <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-sub)' }}>Trends</h4>
            <select 
              className="input-field" 
              style={{ minHeight: '36px', padding: '4px 8px', width: 'auto', fontSize: '0.85rem' }}
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
            >
              <option value="">Select Metric...</option>
              {metricsList.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {chartData.length > 1 ? (
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip 
                    labelKey="fullTime"
                    contentStyle={{ fontSize: '0.8rem', borderRadius: 8, border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-md)' }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    name={selectedMetric} 
                    stroke="var(--color-amber)" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: 'var(--color-amber)' }} 
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : selectedMetric ? (
            <div style={{ textAlign: 'center', padding: '1rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', background: 'var(--color-surface)', borderRadius: 8 }}>
              Need at least 2 results for <strong>{selectedMetric}</strong> to show trend.
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '1rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Select a metric above to view trends.
            </div>
          )}
        </div>
      )}

      {loading ? <SkeletonList count={2} /> : labs.length === 0 ? (
        <div className="empty-state"><FlaskConical size={36} /><p>No lab results found.</p></div>
      ) : labs.map(lab => (
        <div key={lab.id} className="card" style={{ padding: '0.9rem', marginBottom: '0.6rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{lab.testName}</span>
            <span className={`badge ${lab.status === 'normal' ? 'badge-success' : lab.status === 'abnormal' ? 'badge-amber' : 'badge-danger'}`}>
              {lab.status}
            </span>
          </div>
          {lab.panelData ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '0.8rem' }}>
              {Object.entries(lab.panelData).map(([k, v]) => (
                <div key={k}><strong>{k}:</strong> {v}</div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '0.85rem' }}>
              <strong>Result:</strong> {lab.result} {lab.unit} <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>(Ref: {lab.referenceRange})</span>
            </div>
          )}
          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
            <PrintButton type="lab" patient={patient} data={lab} onPrint="print" />
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 8 }}>
            {lab.resultedAt?.toDate ? format(lab.resultedAt.toDate(), 'MMM d, yyyy h:mm a') : '—'} · By {lab.orderedBy}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────
const TABS = [
  { key: 'overview',  label: 'Overview',  icon: User,          roles: ['admin', 'doctor', 'nurse', 'staff'] },
  { key: 'timeline',  label: 'Timeline',  icon: Clock,         roles: ['admin', 'doctor', 'nurse', 'staff'] },
  { key: 'history',   label: 'History',   icon: History,       roles: ['admin', 'doctor', 'nurse'] },
  { key: 'vitals',    label: 'Vitals',    icon: Activity,      roles: ['admin', 'doctor', 'nurse'] },
  { key: 'labs',      label: 'Labs',      icon: FlaskConical,  roles: ['admin', 'doctor', 'nurse'] },
  { key: 'exam',      label: 'Exam',      icon: Stethoscope,   roles: ['admin', 'doctor', 'nurse'] },
  { key: 'orders',    label: 'Orders',    icon: ClipboardList, roles: ['admin', 'doctor', 'nurse'] },
  { key: 'rx',        label: 'Rx',        icon: Pill,          roles: ['admin', 'doctor', 'nurse'] },
  { key: 'immunizations', label: 'Vaccines', icon: Syringe,    roles: ['admin', 'doctor', 'nurse'] },
  { key: 'discharge', label: 'Discharge', icon: FileText,      roles: ['admin', 'doctor', 'nurse'] },
];

export default function PatientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const profile = useAuthStore((s) => s.profile);
  const [patient, setPatient] = useState(null);
  const [immunizations, setImmunizations] = useState([]);
  
  // Additional data sources for timeline + summary
  const [vitals, setVitals] = useState([]);
  const [labs, setLabs] = useState([]);
  const [exams, setExams] = useState([]);
  const [orders, setOrders] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [dischargePlans, setDischargePlans] = useState([]);
  const [allLoading, setAllLoading] = useState(true);

  // Default tab handling
  const role = profile?.role || 'staff';
  const allowedTabs = TABS.filter(t => t.roles.includes(role));
  const [tab, setTab] = useState(allowedTabs.length > 0 ? allowedTabs[0].key : '');

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'patients', id), (snap) => {
      if (snap.exists()) setPatient({ id: snap.id, ...snap.data() });
    });
    return () => unsub();
  }, [id]);

  useEffect(() => {
    const imQ = query(collection(db, 'patients', id, 'immunizations'), orderBy('dateAdministered', 'desc'));
    return onSnapshot(imQ, (snap) => {
      setImmunizations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [id]);

  // Collect all data sources for timeline + insights + summary
  useEffect(() => {
    const unsubs = [];

    // Vitals
    const vQ = query(collection(db, 'patients', id, 'vitals'), orderBy('recordedAt', 'desc'));
    unsubs.push(onSnapshot(vQ, (snap) => setVitals(snap.docs.map(d => ({ id: d.id, ...d.data() })))));

    // Labs
    const lQ = query(collection(db, 'labResults'), where('patientId', '==', id));
    unsubs.push(onSnapshot(lQ, (snap) => setLabs(snap.docs.map(d => ({ id: d.id, ...d.data() })))));

    // Exams
    const eQ = query(collection(db, 'patients', id, 'examinations'), orderBy('examinedAt', 'desc'));
    unsubs.push(onSnapshot(eQ, (snap) => setExams(snap.docs.map(d => ({ id: d.id, ...d.data() })))));

    // Orders
    const oQ = query(collection(db, 'patients', id, 'orders'), orderBy('createdAt', 'desc'));
    unsubs.push(onSnapshot(oQ, (snap) => setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })))));

    // Prescriptions
    const pQ = query(collection(db, 'patients', id, 'prescriptions'), orderBy('prescribedAt', 'desc'));
    unsubs.push(onSnapshot(pQ, (snap) => {
      const list = snap.docs.map(d => {
        const data = d.data();
        let isExpired = false;
        if (data.status === 'active' && data.duration && data.prescribedAt) {
          const prescribedTime = data.prescribedAt.toMillis();
          const durationMs = parseInt(data.duration) * 86400000;
          if (Date.now() > prescribedTime + durationMs) isExpired = true;
        }
        return { id: d.id, ...data, isExpired, computedStatus: data.status === 'discontinued' ? 'discontinued' : isExpired ? 'completed' : data.status };
      });
      setPrescriptions(list);
    }));

    // Appointments (by patientId would require collectionGroup, use all + filter)
    const aQ = query(collection(db, 'appointments'));
    unsubs.push(onSnapshot(aQ, (snap) => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAppointments(all.filter(a => a.patientId === id));
    }));

    // Discharge plans
    const dQ = query(collection(db, 'patients', id, 'dischargePlans'), orderBy('createdAt', 'desc'));
    unsubs.push(onSnapshot(dQ, (snap) => setDischargePlans(snap.docs.map(d => ({ id: d.id, ...d.data() })))));

    // Set loading false when first batch arrives
    const timer = setTimeout(() => setAllLoading(false), 500);

    return () => {
      unsubs.forEach(u => u());
      clearTimeout(timer);
    };
  }, [id]);

  const criticalAlerts = [];
  if (patient) {
    if (patient.allergies && patient.allergies.length > 0) {
      criticalAlerts.push(`Severe Allergy: ${patient.allergies.join(', ')}`);
    }
    if (patient.pmh) {
      patient.pmh.forEach(h => {
        if (h.critical) criticalAlerts.push(`Critical Condition: ${h.condition}`);
      });
    }
  }

  // Build timeline sources object
  const timelineSources = {
    vitals,
    labs,
    exams,
    orders,
    prescriptions,
    immunizations,
    appointments,
    dischargePlans,
  };

  return (
    <div className="page-root">
      <PageHeader
        title={patient ? `${patient.firstName} ${patient.lastName}` : 'Patient'}
        subtitle={patient ? `${patient.age ? patient.age + ' yrs' : ''} ${patient.gender ? '· ' + patient.gender : ''} ${patient.bloodType ? '· ' + patient.bloodType : ''}` : ''}
        backTo="/patients"
        liveIndicator
      />

      <div className="page-content">
        {criticalAlerts.length > 0 && (
          <div className="alert alert-critical" style={{ marginBottom: '1.25rem', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 800, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.8rem' }}>Critical Alerts</div>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.9rem', fontWeight: 600 }}>
                {criticalAlerts.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          </div>
        )}

        {/* Smart Alerts Header — always visible for clinical roles */}
        {['admin', 'doctor', 'nurse'].includes(role) && (
          <SmartAlertsHeader
            patient={patient}
            labs={labs}
            appointments={appointments}
            prescriptions={prescriptions}
          />
        )}

        {/* Clinical Insights — always visible for clinical roles */}
        {['admin', 'doctor', 'nurse'].includes(role) && (
          <ClinicalInsights
            patient={patient}
            vitals={vitals}
            labs={labs}
            prescriptions={prescriptions}
            immunizations={immunizations}
            appointments={appointments}
          />
        )}

        {/* Tabs */}
        {allowedTabs.length > 0 ? (
          <>
            <div className="tab-bar">
              {allowedTabs.map(({ key, label, icon: Icon }) => (
                <button key={key} className={`tab${tab === key ? ' active' : ''}`} onClick={() => setTab(key)}>
                  <Icon size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                  {label}
                </button>
              ))}
            </div>

            {tab === 'overview' && <DemographicsTab patient={patient} immunizations={immunizations} vitals={vitals} labs={labs} appointments={appointments} prescriptions={prescriptions} />}
            {tab === 'timeline' && (
              <ClinicalTimeline
                patientId={id}
                sources={timelineSources}
                loading={allLoading}
              />
            )}
            {tab === 'vitals' && <VitalsTab patientId={id} />}
            {tab === 'labs' && <LabsTab patientId={id} patient={patient} />}
            {tab === 'history' && <HistoryTab patient={patient} />}
            {tab === 'exam'   && <ExamTab   patientId={id} />}
            {tab === 'orders' && <OrdersTab patientId={id} />}
            {tab === 'rx'     && <PrescriptionsTab patientId={id} patient={patient} />}
            {tab === 'immunizations' && <ImmunizationsTab patientId={id} />}
            {tab === 'discharge' && <DischargeTab patientId={id} patient={patient} />}
          </>
        ) : (
          <div className="card" style={{ padding: '2rem 1rem', textAlign: 'center', marginTop: '1rem' }}>
            <Activity size={32} color="var(--color-text-muted)" style={{ opacity: 0.5, marginBottom: '1rem' }} />
            <h3 style={{ margin: '0 0 0.5rem', color: 'var(--color-text-main)' }}>Clinical Data Restricted</h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Your role does not have permission to view clinical records.</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}