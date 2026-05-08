import { useEffect, useState } from 'react';
import {
  collection, query, orderBy, onSnapshot, addDoc, Timestamp, where
} from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import PageHeader from '../components/PageHeader';
import BottomNav from '../components/BottomNav';
import { SkeletonList } from '../components/Skeleton';
import { UserPlus, Search, ChevronRight, Users } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const GENDER_OPTIONS = ['Male', 'Female', 'Other'];
const BLOOD_TYPES    = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];

function AddPatientModal({ onClose }) {
  const profile = useAuthStore((s) => s.profile);
  const [form, setForm] = useState({
    firstName: '', lastName: '', dob: '', gender: '', bloodType: '',
    phone: '', address: '', allergies: '', emergencyContact: '', emergencyPhone: '',
  });
  const [saving, setSaving] = useState(false);

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.firstName || !form.lastName) { toast.error('First and last name required.'); return; }
    setSaving(true);
    try {
      const age = form.dob
        ? Math.floor((Date.now() - new Date(form.dob)) / (365.25 * 86400000))
        : null;
      await addDoc(collection(db, 'patients'), {
        ...form,
        age,
        allergies: form.allergies ? form.allergies.split(',').map((s) => s.trim()) : [],
        createdAt: Timestamp.now(),
        createdBy: profile?.uid,
        deleted: false,
      });
      toast.success(`${form.firstName} ${form.lastName} added!`);
      onClose();
    } catch {
      toast.error('Failed to add patient.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1.25rem' }}>
          Register New Patient
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="input-label">First Name *</label>
              <input className="input-field" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} placeholder="Maria" />
            </div>
            <div className="form-group">
              <label className="input-label">Last Name *</label>
              <input className="input-field" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} placeholder="Santos" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="input-label">Date of Birth</label>
              <input className="input-field" type="date" value={form.dob} onChange={(e) => set('dob', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="input-label">Gender</label>
              <select className="input-field" value={form.gender} onChange={(e) => set('gender', e.target.value)}>
                <option value="">Select…</option>
                {GENDER_OPTIONS.map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="input-label">Blood Type</label>
              <select className="input-field" value={form.bloodType} onChange={(e) => set('bloodType', e.target.value)}>
                <option value="">Select…</option>
                {BLOOD_TYPES.map((b) => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="input-label">Phone</label>
              <input className="input-field" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="09XX XXX XXXX" />
            </div>
          </div>
          <div className="form-group">
            <label className="input-label">Address</label>
            <input className="input-field" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Street, City" />
          </div>
          <div className="form-group">
            <label className="input-label">Known Allergies (comma-separated)</label>
            <input className="input-field" value={form.allergies} onChange={(e) => set('allergies', e.target.value)} placeholder="Penicillin, Sulfa" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="input-label">Emergency Contact</label>
              <input className="input-field" value={form.emergencyContact} onChange={(e) => set('emergencyContact', e.target.value)} placeholder="Juan Santos" />
            </div>
            <div className="form-group">
              <label className="input-label">Emergency Phone</label>
              <input className="input-field" value={form.emergencyPhone} onChange={(e) => set('emergencyPhone', e.target.value)} placeholder="09XX XXX XXXX" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={saving}>
              {saving ? 'Saving…' : 'Register Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [showAdd,  setShowAdd]  = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // We use a simplified query to avoid "stuck on loading" if composite indexes are missing.
    // Error handling added to capture Firestore permission or index errors.
    const q = query(
      collection(db, 'patients'),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, 
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter(p => p.deleted !== true); // Client-side fallback for filtering deleted items
        setPatients(list);
        setLoading(false);
      },
      (err) => {
        console.error('Firestore Fetch Error:', err);
        toast.error('Failed to load patients. Check your connection or indexes.');
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  const filtered = patients.filter((p) => {
    const q = search.toLowerCase();
    return (
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
      (p.phone || '').includes(q)
    );
  });

  return (
    <div className="page-root">
      <PageHeader
        title="Patients"
        subtitle={`${patients.length} registered`}
        actions={
          <button className="btn-icon" style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white' }}
            onClick={() => setShowAdd(true)}>
            <UserPlus size={20} />
          </button>
        }
      />

      <div className="page-content">
        {/* Search */}
        <div className="search-bar" style={{ marginBottom: '1rem' }}>
          <Search size={18} color="var(--color-text-muted)" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or phone…"
          />
        </div>

        {/* List */}
        {loading ? (
          <SkeletonList count={6} />
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Users size={48} />
            <p style={{ fontWeight: 600, margin: 0 }}>No patients found</p>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>
              {search ? 'Try a different search term.' : 'Register your first patient above.'}
            </p>
          </div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            {filtered.map((pt, i) => (
              <div key={pt.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                <div className="list-item" onClick={() => navigate(`/patients/${pt.id}`)}>
                  <div className="avatar">
                    {(pt.firstName || '?')[0]}{(pt.lastName || '')[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{pt.firstName} {pt.lastName}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                      {pt.age ? `${pt.age} yrs` : ''}
                      {pt.gender ? ` · ${pt.gender}` : ''}
                      {pt.bloodType ? ` · ${pt.bloodType}` : ''}
                    </div>
                  </div>
                  {pt.allergies?.length > 0 && (
                    <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>⚠ Allergy</span>
                  )}
                  <ChevronRight size={16} color="var(--color-text-muted)" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && <AddPatientModal onClose={() => setShowAdd(false)} />}
      <BottomNav />
    </div>
  );
}
