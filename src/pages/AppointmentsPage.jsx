import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuthStore } from '../store/authStore';
import PageHeader from '../components/PageHeader';
import BottomNav from '../components/BottomNav';
import { SkeletonList } from '../components/Skeleton';
import toast from 'react-hot-toast';
import { Calendar, Plus, Clock, User } from 'lucide-react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';

const STATUS_OPTIONS = ['pending', 'confirmed', 'completed', 'cancelled'];

function AddApptModal({ onClose }) {
  const profile = useAuthStore((s) => s.profile);
  const [form, setForm] = useState({ patientName: '', patientId: '', scheduledAt: '', reason: '', doctor: '', status: 'pending' });
  const [saving, setSaving] = useState(false);
  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.patientName || !form.scheduledAt) { toast.error('Patient name and date/time required.'); return; }
    setSaving(true);
    try {
      await addDoc(collection(db, 'appointments'), {
        ...form,
        scheduledAt: Timestamp.fromDate(new Date(form.scheduledAt)),
        createdBy: profile?.uid,
        createdAt: Timestamp.now(),
      });
      toast.success('Appointment scheduled!');
      onClose();
    } catch { toast.error('Failed to schedule appointment.'); }
    finally { setSaving(false); }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1.25rem' }}>
          Schedule Appointment
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label className="input-label">Patient Name *</label><input className="input-field" value={form.patientName} onChange={(e) => set('patientName', e.target.value)} placeholder="Maria Santos" /></div>
          <div className="form-group"><label className="input-label">Date & Time *</label><input className="input-field" type="datetime-local" value={form.scheduledAt} onChange={(e) => set('scheduledAt', e.target.value)} /></div>
          <div className="form-group"><label className="input-label">Reason / Chief Complaint</label><input className="input-field" value={form.reason} onChange={(e) => set('reason', e.target.value)} placeholder="Follow-up, Check-up…" /></div>
          <div className="form-group"><label className="input-label">Attending Doctor</label><input className="input-field" value={form.doctor} onChange={(e) => set('doctor', e.target.value)} placeholder="Dr. Reyes" /></div>
          <div className="form-group">
            <label className="input-label">Status</label>
            <select className="input-field" value={form.status} onChange={(e) => set('status', e.target.value)}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={saving}>{saving ? 'Saving…' : 'Schedule'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showAdd, setShowAdd]   = useState(false);
  const [filter,  setFilter]    = useState('upcoming');

  useEffect(() => {
    const q = query(collection(db, 'appointments'), orderBy('scheduledAt', 'asc'));
    return onSnapshot(q, (snap) => {
      setAppointments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, []);

  const filtered = appointments.filter((a) => {
    const date = a.scheduledAt?.toDate ? a.scheduledAt.toDate() : null;
    if (!date) return false;
    if (filter === 'today')    return isToday(date);
    if (filter === 'upcoming') return !isPast(date) || isToday(date);
    if (filter === 'past')     return isPast(date) && !isToday(date);
    return true;
  });

  async function changeStatus(id, status) {
    try {
      await updateDoc(doc(db, 'appointments', id), { status });
      toast.success(`Marked as ${status}`);
    } catch { toast.error('Update failed.'); }
  }

  function dayLabel(date) {
    if (isToday(date))    return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEEE, MMM d');
  }

  return (
    <div className="page-root">
      <PageHeader
        title="Appointments"
        subtitle={`${appointments.length} total`}
        liveIndicator
        actions={
          <button className="btn-icon" style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white' }} onClick={() => setShowAdd(true)}>
            <Plus size={20} />
          </button>
        }
      />

      <div className="page-content">
        <div className="tab-bar">
          {[['upcoming', 'Upcoming'], ['today', 'Today'], ['past', 'Past'], ['all', 'All']].map(([k, l]) => (
            <button key={k} className={`tab${filter === k ? ' active' : ''}`} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </div>

        {loading ? <SkeletonList count={5} /> : filtered.length === 0 ? (
          <div className="empty-state"><Calendar size={48} /><p style={{ fontWeight: 600 }}>No appointments</p><p style={{ fontSize: '0.85rem', margin: 0 }}>Schedule one using the + button</p></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {filtered.map((appt) => {
              const date = appt.scheduledAt?.toDate ? appt.scheduledAt.toDate() : null;
              return (
                <div key={appt.id} className="card" style={{ padding: '0.9rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ textAlign: 'center', background: 'rgba(196,139,40,0.1)', borderRadius: 10, padding: '6px 10px', minWidth: 52 }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-amber)', lineHeight: 1 }}>{date ? format(date, 'd') : '—'}</div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--color-text-sub)', textTransform: 'uppercase' }}>{date ? format(date, 'MMM') : ''}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{appt.patientName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', gap: 10, marginTop: 2, flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={12} />{date ? format(date, 'h:mm a') : '—'}</span>
                        {appt.reason && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><User size={12} />{appt.reason}</span>}
                      </div>
                      {appt.doctor && <div style={{ fontSize: '0.78rem', color: 'var(--color-text-sub)', marginTop: 3 }}>Dr. {appt.doctor}</div>}
                    </div>
                    <span className={`badge ${
                      appt.status === 'confirmed' ? 'badge-success' :
                      appt.status === 'completed' ? 'badge-info' :
                      appt.status === 'cancelled' ? 'badge-danger' : 'badge-warning'
                    }`}>{appt.status || 'pending'}</span>
                  </div>
                  {/* Quick Status Actions */}
                  {appt.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <button className="btn-secondary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', minHeight: 36 }} onClick={() => changeStatus(appt.id, 'confirmed')}>Confirm</button>
                      <button className="btn-ghost" style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', minHeight: 36, color: 'var(--color-danger)' }} onClick={() => changeStatus(appt.id, 'cancelled')}>Cancel</button>
                    </div>
                  )}
                  {appt.status === 'confirmed' && (
                    <button className="btn-primary" style={{ width: '100%', marginTop: 10, padding: '0.5rem', fontSize: '0.8rem', minHeight: 36 }} onClick={() => changeStatus(appt.id, 'completed')}>Mark Completed</button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAdd && <AddApptModal onClose={() => setShowAdd(false)} />}
      <BottomNav />
    </div>
  );
}
