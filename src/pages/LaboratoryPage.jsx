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
import PatientAutocomplete from '../components/PatientAutocomplete';

const LAB_TEMPLATES = {
  'CBC': [
    { key: 'WBC', label: 'WBC', unit: 'k/uL', ref: '4.5 - 11.0' },
    { key: 'RBC', label: 'RBC', unit: 'M/uL', ref: '4.2 - 5.4' },
    { key: 'Hgb', label: 'Hemoglobin', unit: 'g/dL', ref: '12 - 16' },
    { key: 'Hct', label: 'Hematocrit', unit: '%', ref: '37 - 47' },
    { key: 'Plt', label: 'Platelets', unit: 'k/uL', ref: '150 - 400' }
  ],
  'BMP': [
    { key: 'Na', label: 'Sodium', unit: 'mEq/L', ref: '135 - 145' },
    { key: 'K', label: 'Potassium', unit: 'mEq/L', ref: '3.5 - 5.0' },
    { key: 'Cl', label: 'Chloride', unit: 'mEq/L', ref: '98 - 106' },
    { key: 'CO2', label: 'CO2', unit: 'mEq/L', ref: '23 - 29' },
    { key: 'BUN', label: 'BUN', unit: 'mg/dL', ref: '7 - 20' },
    { key: 'Cr', label: 'Creatinine', unit: 'mg/dL', ref: '0.6 - 1.2' },
    { key: 'Glu', label: 'Glucose', unit: 'mg/dL', ref: '70 - 99' },
    { key: 'Ca', label: 'Calcium', unit: 'mg/dL', ref: '8.6 - 10.3' }
  ],
  'CMP': [
    { key: 'Na', label: 'Sodium', unit: 'mEq/L', ref: '135 - 145' },
    { key: 'K', label: 'Potassium', unit: 'mEq/L', ref: '3.5 - 5.0' },
    { key: 'Cl', label: 'Chloride', unit: 'mEq/L', ref: '98 - 106' },
    { key: 'CO2', label: 'CO2', unit: 'mEq/L', ref: '23 - 29' },
    { key: 'BUN', label: 'BUN', unit: 'mg/dL', ref: '7 - 20' },
    { key: 'Cr', label: 'Creatinine', unit: 'mg/dL', ref: '0.6 - 1.2' },
    { key: 'Glu', label: 'Glucose', unit: 'mg/dL', ref: '70 - 99' },
    { key: 'Ca', label: 'Calcium', unit: 'mg/dL', ref: '8.6 - 10.3' },
    { key: 'AST', label: 'AST', unit: 'U/L', ref: '8 - 33' },
    { key: 'ALT', label: 'ALT', unit: 'U/L', ref: '4 - 36' },
    { key: 'ALP', label: 'ALP', unit: 'U/L', ref: '20 - 130' },
    { key: 'TBili', label: 'Total Bili', unit: 'mg/dL', ref: '0.1 - 1.2' },
    { key: 'TProt', label: 'Total Protein', unit: 'g/dL', ref: '6.0 - 8.3' },
    { key: 'Alb', label: 'Albumin', unit: 'g/dL', ref: '3.4 - 5.4' }
  ],
  'Lipid Panel': [
    { key: 'TotalChol', label: 'Total Chol', unit: 'mg/dL', ref: '< 200' },
    { key: 'HDL', label: 'HDL', unit: 'mg/dL', ref: '> 40' },
    { key: 'LDL', label: 'LDL', unit: 'mg/dL', ref: '< 100' },
    { key: 'Trig', label: 'Triglycerides', unit: 'mg/dL', ref: '< 150' }
  ],
  'Urinalysis': [
    { key: 'Color', label: 'Color', unit: '', ref: 'Yellow' },
    { key: 'Clarity', label: 'Clarity', unit: '', ref: 'Clear' },
    { key: 'pH', label: 'pH', unit: '', ref: '4.5 - 8.0' },
    { key: 'SpGr', label: 'SpGr', unit: '', ref: '1.005 - 1.030' },
    { key: 'Pro', label: 'Protein', unit: '', ref: 'Negative' },
    { key: 'Glu', label: 'Glucose', unit: '', ref: 'Negative' },
    { key: 'Ket', label: 'Ketones', unit: '', ref: 'Negative' }
  ],
  'HbA1c': [
    { key: 'HbA1c', label: 'HbA1c', unit: '%', ref: '< 5.7' }
  ],
  'TSH': [
    { key: 'TSH', label: 'TSH', unit: 'mIU/L', ref: '0.4 - 4.0' }
  ],
  'PT/INR': [
    { key: 'PT', label: 'PT (sec)', unit: 'sec', ref: '11.0 - 13.5' },
    { key: 'INR', label: 'INR', unit: '', ref: '0.8 - 1.1' }
  ],
  'ABG': [
    { key: 'pH', label: 'pH', unit: '', ref: '7.35 - 7.45' },
    { key: 'pCO2', label: 'pCO2', unit: 'mmHg', ref: '35 - 45' },
    { key: 'pO2', label: 'pO2', unit: 'mmHg', ref: '80 - 100' },
    { key: 'HCO3', label: 'HCO3', unit: 'mEq/L', ref: '22 - 26' },
    { key: 'O2Sat', label: 'O2 Sat', unit: '%', ref: '> 95' }
  ],
  'LFT': [
    { key: 'AST', label: 'AST', unit: 'U/L', ref: '8 - 33' },
    { key: 'ALT', label: 'ALT', unit: 'U/L', ref: '4 - 36' },
    { key: 'ALP', label: 'ALP', unit: 'U/L', ref: '20 - 130' },
    { key: 'TBili', label: 'Total Bili', unit: 'mg/dL', ref: '0.1 - 1.2' }
  ],
  'Creatinine': [
    { key: 'Creatinine', label: 'Creatinine', unit: 'mg/dL', ref: '0.6 - 1.2' }
  ],
  'BUN': [
    { key: 'BUN', label: 'BUN', unit: 'mg/dL', ref: '7 - 20' }
  ],
  'Troponin': [
    { key: 'Troponin', label: 'Troponin', unit: 'ng/mL', ref: '< 0.04' }
  ],
  'CRP': [
    { key: 'CRP', label: 'CRP', unit: 'mg/L', ref: '< 10.0' }
  ],
  'ESR': [
    { key: 'ESR', label: 'ESR', unit: 'mm/hr', ref: '0 - 20' }
  ],
  'Culture & Sensitivity': [
    { key: 'Source', label: 'Source', unit: '', ref: '' },
    { key: 'Organism', label: 'Organism', unit: '', ref: '' },
    { key: 'Sensitivities', label: 'Sensitivities', unit: '', ref: '' }
  ]
};

const LAB_TESTS = Object.keys(LAB_TEMPLATES);

function AddLabModal({ onClose }) {
  const profile = useAuthStore((s) => s.profile);
  const [form, setForm] = useState({ patientName: '', patientId: '', testName: '', result: '', unit: '', referenceRange: '', status: 'normal', notes: '', panelData: {} });
  const [saving, setSaving] = useState(false);
  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function handlePanelChange(key, val) {
    setForm(f => ({ ...f, panelData: { ...f.panelData, [key]: val } }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.patientId || !form.testName) { toast.error('Please select an existing patient from the suggestions.'); return; }
    
    const template = LAB_TEMPLATES[form.testName];
    if (template) {
      const filledKeys = Object.keys(form.panelData).filter(k => form.panelData[k] && form.panelData[k].trim() !== '');
      if (filledKeys.length !== template.length) {
        toast.error('All panel metrics must be filled out before saving.');
        return;
      }
    } else {
      if (!form.result) {
        toast.error('Result is required.');
        return;
      }
    }

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
          <PatientAutocomplete 
            value={form.patientName} 
            onChange={(val) => {
              set('patientName', val);
              set('patientId', ''); // Reset ID when user types to force a new selection
            }}
            onSelect={(id, name) => {
              set('patientId', id);
              set('patientName', name);
            }}
          />
          <div className="form-row">
            <div className="form-group">
              <label className="input-label">Test Name *</label>
              <select className="input-field" value={form.testName} onChange={(e) => { set('testName', e.target.value); set('panelData', {}); }}>
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
          
          {LAB_TEMPLATES[form.testName] ? (
            <div style={{ marginBottom: '1rem' }}>
              <label className="input-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Panel Results</label>
              <div className="table-responsive">
                <table className="lab-panel-table">
                  <thead>
                    <tr>
                      <th>Metric</th>
                      <th>Result</th>
                      <th>Unit</th>
                      <th>Ref Range</th>
                    </tr>
                  </thead>
                  <tbody>
                    {LAB_TEMPLATES[form.testName].map(m => (
                      <tr key={m.key}>
                        <td style={{ fontWeight: 600 }}>{m.label}</td>
                        <td style={{ padding: '4px 8px' }}>
                          <input 
                            className="input-field" 
                            style={{ minHeight: '30px', padding: '4px 8px' }}
                            value={form.panelData[m.key] || ''} 
                            onChange={(e) => handlePanelChange(m.key, e.target.value)} 
                            placeholder="—"
                          />
                        </td>
                        <td style={{ color: 'var(--color-text-sub)', fontWeight: 600 }}>{m.unit}</td>
                        <td style={{ color: 'var(--color-amber)', fontSize: '0.78rem', fontWeight: 700 }}>{m.ref}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <>
              <div className="form-row">
                <div className="form-group"><label className="input-label">Result *</label><input className="input-field" value={form.result} onChange={(e) => set('result', e.target.value)} placeholder="7.5" /></div>
                <div className="form-group"><label className="input-label">Unit</label><input className="input-field" value={form.unit} onChange={(e) => set('unit', e.target.value)} placeholder="mg/dL" /></div>
              </div>
              <div className="form-group"><label className="input-label">Reference Range</label><input className="input-field" value={form.referenceRange} onChange={(e) => set('referenceRange', e.target.value)} placeholder="4.0 - 10.0" /></div>
            </>
          )}
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
  const [filter, setFilter] = useState('all');
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
    all: results.length,
    normal: results.filter(r => r.status === 'normal').length,
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
              <div key={r.id} className="card" style={{ 
                padding: '0.9rem', 
                background: 'var(--color-surface)',
                borderLeft: `4px solid ${r.status === 'critical' ? 'var(--color-danger)' : r.status === 'abnormal' ? 'var(--color-warning)' : 'var(--color-success)'}` 
              }}>
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
                {r.panelData && Object.keys(r.panelData).length > 0 ? (
                  <div className="table-responsive" style={{ margin: '10px 0' }}>
                    <table className="lab-panel-table">
                      <tbody>
                        {LAB_TEMPLATES[r.testName]?.map(m => (
                          <tr key={m.key}>
                            <td style={{ fontWeight: 600, width: '30%' }}>{m.label}</td>
                            <td style={{ fontWeight: 800, color: 'var(--color-amber)' }}>{r.panelData[m.key] || '—'}</td>
                            <td style={{ color: 'var(--color-text-sub)', fontWeight: 600 }}>{m.unit}</td>
                            <td style={{ color: 'var(--color-amber)', fontSize: '0.78rem', fontWeight: 700 }}>{m.ref}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 16, alignItems: 'baseline' }}>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, color: r.status === 'normal' ? 'var(--color-success)' : r.status === 'critical' ? 'var(--color-danger)' : 'var(--color-warning)' }}>
                      {r.result}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{r.unit}</span>
                    {r.referenceRange && <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Ref: {r.referenceRange}</span>}
                  </div>
                )}
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
