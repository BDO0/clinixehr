import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, Timestamp, doc, updateDoc, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuthStore } from '../store/authStore';
import PageHeader from '../components/PageHeader';
import BottomNav from '../components/BottomNav';
import { SkeletonList } from '../components/Skeleton';
import toast from 'react-hot-toast';
import { Calendar, Plus, Clock, User, MapPin } from 'lucide-react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import PatientAutocomplete from '../components/PatientAutocomplete';

const STATUS_OPTIONS = ['pending', 'confirmed', 'arrived', 'completed', 'cancelled'];
const APPT_TYPES = ['Consultation', 'Follow-up', 'Procedure', 'Vaccination', 'Other'];
const DURATIONS = [15, 30, 45, 60, 90, 120];
const ROOMS = ['Triage', 'Room 1', 'Room 2', 'Treatment A', 'Treatment B', 'Telehealth'];

function WaitTimer({ arrivedAt }) {
  const [wait, setWait] = useState('');
  useEffect(() => {
    if (!arrivedAt) return;
    const update = () => {
      const diff = Math.floor((new Date() - arrivedAt.toDate()) / 60000);
      if (diff < 0) setWait('');
      else if (diff > 60) setWait(`${Math.floor(diff/60)}h ${diff%60}m wait`);
      else setWait(`${diff} min wait`);
    };
    update();
    const int = setInterval(update, 60000);
    return () => clearInterval(int);
  }, [arrivedAt]);
  return wait ? <span className="badge badge-warning" style={{ fontSize: '0.7rem', background: '#FDE68A', color: '#92400E' }}>⏱ {wait}</span> : null;
}

function AddApptModal({ onClose }) {
  const profile = useAuthStore((s) => s.profile);
  const [form, setForm] = useState({ 
    patientName: '', patientId: '', scheduledAt: '', reason: '', doctor: '', status: 'pending',
    type: 'Consultation', duration: 30, room: 'Room 1'
  });
  const [saving, setSaving] = useState(false);
  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.patientName || !form.scheduledAt) { toast.error('Patient name and date/time required.'); return; }
    setSaving(true);
    
    const start = new Date(form.scheduledAt);
    const end = new Date(start.getTime() + form.duration * 60000);

    // Conflict Check
    if (form.doctor) {
      try {
        const overlapQ = query(collection(db, 'appointments'), where('doctor', '==', form.doctor));
        const snap = await getDocs(overlapQ);
        let hasConflict = false;
        snap.forEach(d => {
          const a = d.data();
          if (a.status === 'cancelled') return;
          const aStart = a.scheduledAt?.toDate();
          if (!aStart) return;
          if (aStart.getFullYear() !== start.getFullYear() || aStart.getMonth() !== start.getMonth() || aStart.getDate() !== start.getDate()) return;

          const aEnd = a.endTime ? a.endTime.toDate() : new Date(aStart.getTime() + (a.duration || 30) * 60000);
          if (start < aEnd && end > aStart) hasConflict = true;
        });
        
        if (hasConflict) {
          toast.error(`Dr. ${form.doctor} is already booked during this time.`);
          setSaving(false);
          return;
        }
      } catch(err) {
        console.warn("Conflict check skipped/failed:", err);
      }
    }

    try {
      await addDoc(collection(db, 'appointments'), {
        ...form,
        scheduledAt: Timestamp.fromDate(start),
        endTime: Timestamp.fromDate(end),
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
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-handle" />
        <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1.25rem' }}>Schedule Appointment</h2>
        <form onSubmit={handleSubmit}>
          <PatientAutocomplete value={form.patientName} onChange={(val) => set('patientName', val)} onSelect={(id, name) => { set('patientId', id); set('patientName', name); }} />
          
          <div className="form-row">
            <div className="form-group"><label className="input-label">Date & Time *</label><input className="input-field" type="datetime-local" value={form.scheduledAt} onChange={(e) => set('scheduledAt', e.target.value)} /></div>
            <div className="form-group">
              <label className="input-label">Duration (Mins)</label>
              <select className="input-field" value={form.duration} onChange={(e) => set('duration', Number(e.target.value))}>
                {DURATIONS.map(d => <option key={d} value={d}>{d} mins</option>)}
              </select>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label className="input-label">Type</label>
              <select className="input-field" value={form.type} onChange={(e) => set('type', e.target.value)}>
                {APPT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="input-label">Room</label>
              <select className="input-field" value={form.room} onChange={(e) => set('room', e.target.value)}>
                {ROOMS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group"><label className="input-label">Reason / Chief Complaint</label><input className="input-field" value={form.reason} onChange={(e) => set('reason', e.target.value)} placeholder="Follow-up, Check-up…" /></div>
          <div className="form-group"><label className="input-label">Attending Doctor</label><input className="input-field" value={form.doctor} onChange={(e) => set('doctor', e.target.value)} placeholder="Reyes" /></div>
          <div className="form-group">
            <label className="input-label">Initial Status</label>
            <select className="input-field" value={form.status} onChange={(e) => set('status', e.target.value)}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={saving}>{saving ? 'Saving…' : 'Schedule'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AppointmentsPage() {
  const profile = useAuthStore((s) => s.profile);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showAdd, setShowAdd]   = useState(false);
  const [filter,  setFilter]    = useState('live');

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
    if (filter === 'live')     return isToday(date) && (a.status === 'arrived' || a.status === 'confirmed');
    if (filter === 'today')    return isToday(date);
    if (filter === 'upcoming') return !isPast(date) || isToday(date);
    if (filter === 'past')     return isPast(date) && !isToday(date);
    return true;
  });

  async function changeStatus(id, status, appointment) {
    try {
      const updates = { status };
      if (status === 'arrived') updates.arrivedAt = Timestamp.now();
      await updateDoc(doc(db, 'appointments', id), updates);
      toast.success(`Marked as ${status}`);

      if (status === 'completed' && appointment?.patientId) {
        await addDoc(collection(db, 'patients', appointment.patientId, 'examinations'), {
           chiefComplaint: appointment.reason || `Appointment: ${appointment.type}`,
           hpi: `Automated note from completed appointment.\nType: ${appointment.type}\nDuration: ${appointment.duration} mins`,
           pe: '', assessment: '', plan: '', intervention: '', evaluation: '',
           examinedBy: appointment.doctor ? `Dr. ${appointment.doctor}` : profile?.displayName || 'System',
           examinedAt: Timestamp.now()
        });
        toast.success("Draft examination note auto-generated.");
      }
    } catch { toast.error('Update failed.'); }
  }

  function getStatusBadge(status) {
    switch(status) {
      case 'confirmed': return <span className="badge badge-success">confirmed</span>;
      case 'arrived': return <span className="badge badge-warning" style={{ background: '#F59E0B', color: 'white', border: 'none' }}>arrived</span>;
      case 'completed': return <span className="badge badge-info">completed</span>;
      case 'cancelled': return <span className="badge badge-danger">cancelled</span>;
      default: return <span className="badge">pending</span>;
    }
  }

  return (
    <div className="page-root">
      <PageHeader
        title="Appointments & Queue"
        subtitle={`${appointments.length} total records`}
        liveIndicator
        actions={
          <button className="btn-icon" style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white' }} onClick={() => setShowAdd(true)}>
            <Plus size={20} />
          </button>
        }
      />

      <div className="page-content">
        <div className="tab-bar">
          {[['live', 'Live Queue'], ['upcoming', 'Upcoming'], ['today', 'Today'], ['past', 'Past'], ['all', 'All']].map(([k, l]) => (
            <button key={k} className={`tab${filter === k ? ' active' : ''}`} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </div>

        {loading ? <SkeletonList count={5} /> : filtered.length === 0 ? (
          <div className="empty-state"><Calendar size={48} /><p style={{ fontWeight: 600 }}>No appointments</p><p style={{ fontSize: '0.85rem', margin: 0 }}>Queue is clear for this view.</p></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {filtered.map((appt) => {
              const date = appt.scheduledAt?.toDate ? appt.scheduledAt.toDate() : null;
              return (
                <div key={appt.id} className="card" style={{ padding: '0.9rem', borderLeft: appt.status === 'arrived' ? '4px solid #F59E0B' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ textAlign: 'center', background: 'rgba(196,139,40,0.1)', borderRadius: 10, padding: '6px 10px', minWidth: 52 }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-amber)', lineHeight: 1 }}>{date ? format(date, 'd') : '—'}</div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--color-text-sub)', textTransform: 'uppercase' }}>{date ? format(date, 'MMM') : ''}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {appt.patientName}
                        {appt.status === 'arrived' && <WaitTimer arrivedAt={appt.arrivedAt} />}
                      </div>
                      
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={12} />{date ? format(date, 'h:mm a') : '—'} ({appt.duration || 30}m)</span>
                        {appt.room && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={12} />{appt.room}</span>}
                        {appt.type && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><User size={12} />{appt.type}</span>}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-sub)', marginTop: 4, fontStyle: 'italic' }}>
                        {appt.reason ? `"${appt.reason}"` : ''} {appt.doctor && ` — Dr. ${appt.doctor}`}
                      </div>
                    </div>
                    {getStatusBadge(appt.status)}
                  </div>
                  
                  {/* Quick Status Actions */}
                  {appt.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <button className="btn-secondary" style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem' }} onClick={() => changeStatus(appt.id, 'confirmed', appt)}>Confirm</button>
                      <button className="btn-ghost" style={{ padding: '0.4rem', fontSize: '0.8rem', color: 'var(--color-danger)' }} onClick={() => changeStatus(appt.id, 'cancelled', appt)}>Cancel</button>
                    </div>
                  )}
                  {appt.status === 'confirmed' && (
                    <button className="btn-primary" style={{ width: '100%', marginTop: 10, padding: '0.5rem', fontSize: '0.85rem' }} onClick={() => changeStatus(appt.id, 'arrived', appt)}>Check-in (Arrived)</button>
                  )}
                  {appt.status === 'arrived' && (
                    <button style={{ width: '100%', marginTop: 10, padding: '0.5rem', fontSize: '0.85rem', background: 'var(--color-success)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: 'pointer' }} onClick={() => changeStatus(appt.id, 'completed', appt)}>Mark Consult Completed</button>
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
