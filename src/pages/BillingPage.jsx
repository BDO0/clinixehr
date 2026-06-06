import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuthStore } from '../store/authStore';
import PageHeader from '../components/PageHeader';
import BottomNav from '../components/BottomNav';
import { SkeletonList } from '../components/Skeleton';
import toast from 'react-hot-toast';
import { CreditCard, Plus, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import PatientAutocomplete from '../components/PatientAutocomplete';

const PAYMENT_METHODS = ['Cash', 'PhilHealth', 'HMO', 'Credit Card', 'GCash', 'Maya', 'Bank Transfer'];
const SERVICE_TYPES   = ['Consultation', 'Laboratory', 'Imaging', 'Procedure', 'Pharmacy', 'Room & Board', 'ER', 'Other'];

function AddBillingModal({ onClose }) {
  const profile = useAuthStore((s) => s.profile);
  const [form, setForm] = useState({ patientName: '', patientId: '', serviceType: '', description: '', amount: '', paymentMethod: 'Cash', status: 'unpaid' });
  const [saving, setSaving] = useState(false);
  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.patientId) { toast.error('Please select an existing patient from the suggestions.'); return; }
    if (!form.amount) { toast.error('Amount is required.'); return; }
    if (!form.serviceType) { toast.error('Service type is required.'); return; }
    setSaving(true);
    try {
      await addDoc(collection(db, 'billing'), {
        patientName: form.patientName,
        patientId: form.patientId,
        serviceType: form.serviceType,
        description: form.description || '',
        amount: parseFloat(form.amount),
        paymentMethod: form.paymentMethod,
        status: form.status,
        createdBy: profile?.uid,
        createdByName: profile?.displayName || '',
        createdAt: Timestamp.now(),
      });
      toast.success('Billing record added!');
      onClose();
    } catch (err) {
      console.error('Billing add error:', err);
      if (err.code === 'permission-denied') {
        toast.error('Permission denied: You do not have permission to create billing records.');
      } else if (err.code === 'unavailable') {
        toast.error('Network error: Check your internet connection and try again.');
      } else {
        toast.error(`Failed to add billing record: ${err.message || 'Unknown error'}`);
      }
    }
    finally { setSaving(false); }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1.25rem' }}>New Billing Record</h2>
        <form onSubmit={handleSubmit}>
          <PatientAutocomplete 
            value={form.patientName} 
            onChange={(val) => {
              set('patientName', val);
              set('patientId', '');
            }}
            onSelect={(id, name) => {
              set('patientId', id);
              set('patientName', name);
            }}
          />
          <div className="form-row">
            <div className="form-group">
              <label className="input-label">Service Type</label>
              <select className="input-field" value={form.serviceType} onChange={(e) => set('serviceType', e.target.value)}>
                <option value="">Select…</option>
                {SERVICE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="input-label">Amount (₱) *</label><input className="input-field" type="number" step="0.01" value={form.amount} onChange={(e) => set('amount', e.target.value)} placeholder="1500.00" /></div>
          </div>
          <div className="form-group"><label className="input-label">Description</label><input className="input-field" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="CBC + Urinalysis" /></div>
          <div className="form-row">
            <div className="form-group">
              <label className="input-label">Payment Method</label>
              <select className="input-field" value={form.paymentMethod} onChange={(e) => set('paymentMethod', e.target.value)}>
                {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="input-label">Status</label>
              <select className="input-field" value={form.status} onChange={(e) => set('status', e.target.value)}>
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={saving}>{saving ? 'Saving…' : 'Add Record'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function BillingPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all');
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'billing'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      setRecords(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, []);

  const filtered  = filter === 'all' ? records : records.filter(r => r.status === filter);
  const totalDue  = records.filter(r => r.status === 'unpaid').reduce((s, r) => s + (r.amount || 0), 0);
  const totalPaid = records.filter(r => r.status === 'paid').reduce((s, r) => s + (r.amount || 0), 0);

  async function markPaid(id) {
    try {
      await updateDoc(doc(db, 'billing', id), { status: 'paid', paidAt: Timestamp.now() });
      toast.success('Marked as paid!');
    } catch (err) {
      console.error('Mark paid error:', err);
      if (err.code === 'permission-denied') {
        toast.error('Permission denied: You do not have permission to update billing records.');
      } else if (err.code === 'unavailable') {
        toast.error('Network error: Check your internet connection.');
      } else {
        toast.error('Failed to mark as paid. Please try again.');
      }
    }
  }

  return (
    <div className="page-root">
      <PageHeader
        title="Billing"
        subtitle={`₱${totalDue.toLocaleString()} outstanding`}
        actions={
          <button className="btn-icon" style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white' }} onClick={() => setShowAdd(true)}>
            <Plus size={20} />
          </button>
        }
      />

      <div className="page-content">
        {/* Summary Cards */}
        <div className="grid-2-mobile-1" style={{ marginBottom: '1rem' }}>
          <div className="stat-card">
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Outstanding</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-danger)' }}>₱{totalDue.toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Collected</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-success)' }}>₱{totalPaid.toLocaleString()}</div>
          </div>
        </div>

        <div className="tab-bar">
          {[['all', 'All'], ['unpaid', 'Unpaid'], ['paid', 'Paid'], ['partial', 'Partial']].map(([k, l]) => (
            <button key={k} className={`tab${filter === k ? ' active' : ''}`} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </div>

        {loading ? <SkeletonList count={5} /> : filtered.length === 0 ? (
          <div className="empty-state"><CreditCard size={48} /><p style={{ fontWeight: 600 }}>No billing records</p></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {filtered.map((r) => (
              <div key={r.id} className="card" style={{ padding: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{r.patientName}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{r.serviceType}{r.description ? ` · ${r.description}` : ''}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-sub)', marginTop: 2 }}>{r.paymentMethod}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: r.status === 'paid' ? 'var(--color-success)' : r.status === 'partial' ? 'var(--color-warning)' : 'var(--color-danger)' }}>
                      ₱{(r.amount || 0).toLocaleString()}
                    </div>
                    <span className={`badge ${r.status === 'paid' ? 'badge-success' : r.status === 'partial' ? 'badge-warning' : 'badge-danger'}`}>{r.status}</span>
                  </div>
                </div>
                {r.status === 'unpaid' && (
                  <button className="btn-primary" style={{ width: '100%', marginTop: 10, padding: '0.5rem', fontSize: '0.85rem', minHeight: 40 }} onClick={() => markPaid(r.id)}>
                    <DollarSign size={15} /> Mark as Paid
                  </button>
                )}
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 6 }}>
                  {r.createdAt?.toDate ? format(r.createdAt.toDate(), 'MMM d, yyyy') : '—'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && <AddBillingModal onClose={() => setShowAdd(false)} />}
      <BottomNav />
    </div>
  );
}
