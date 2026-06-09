import { useEffect, useState } from 'react';
import { collection, query, orderBy, addDoc, updateDoc, doc, Timestamp, getDocs, where, writeBatch, limit, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuthStore } from '../store/authStore';
import PageHeader from '../components/PageHeader';
import BottomNav from '../components/BottomNav';
import { SkeletonList } from '../components/Skeleton';
import toast from 'react-hot-toast';
import { Calendar, Plus, Clock, User, MapPin, Video, ExternalLink } from 'lucide-react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import PatientAutocomplete from '../components/PatientAutocomplete';
import { safeOnSnapshot } from '../utils/safeFirestore';
import { DEMO_APPOINTMENTS } from '../data/fallbackData';

const STATUS_OPTIONS = ['pending', 'confirmed', 'arrived', 'in_consultation', 'completed', 'cancelled'];
const APPT_TYPES = ['Consultation', 'Follow-up', 'Procedure', 'Vaccination', 'Other', 'Teleconsult'];
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
  return wait ? <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>⏱ {wait}</span> : null;
}

function AddApptModal({ onClose }) {
  const profile = useAuthStore((s) => s.profile);
  const [form, setForm] = useState({ 
    patientName: '', patientId: '', scheduledAt: '', reason: '', doctor: '', status: 'pending',
    type: 'Consultation', duration: 30, room: 'Room 1', amount: ''
  });
  const [doctors, setDoctors] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchDoctors() {
      try {
        const q = query(collection(db, 'staff'), where('role', '==', 'doctor'));
        const snap = await getDocs(q);
        setDoctors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.warn('Failed to fetch doctors:', e);
      }
    }
    fetchDoctors();
  }, []);

  // Pre-fill amount when type changes
  useEffect(() => {
    if (form.type) {
      const apptPrices = { 'Consultation': 500, 'Follow-up': 350, 'Procedure': 1500, 'Vaccination': 300, 'Other': 400 };
      const defaultAmount = apptPrices[form.type] || 400;
      set('amount', defaultAmount.toString());
    }
  }, [form.type]);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.patientName || !form.scheduledAt) { toast.error('Patient name and date/time required.'); return; }
    setSaving(true);
    
    const start = new Date(form.scheduledAt);
    const end = new Date(start.getTime() + form.duration * 60000);

    // Conflict Check - using date range filter for performance
    if (form.doctor) {
      try {
        const dayStart = new Date(start);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(start);
        dayEnd.setHours(23, 59, 59, 999);

        const overlapQ = query(
          collection(db, 'appointments'),
          where('doctor', '==', form.doctor),
          where('scheduledAt', '>=', Timestamp.fromDate(dayStart)),
          where('scheduledAt', '<=', Timestamp.fromDate(dayEnd)),
          limit(50)
        );
        const snap = await getDocs(overlapQ);
        let hasConflict = false;
        snap.forEach(d => {
          const a = d.data();
          if (a.status === 'cancelled') return;
          const aStart = a.scheduledAt?.toDate();
          if (!aStart) return;

          const aEnd = a.endTime ? a.endTime.toDate() : new Date(aStart.getTime() + (a.duration || 30) * 60000);
          if (start < aEnd && end > aStart) hasConflict = true;
        });
        
        if (hasConflict) {
          toast.error(`This doctor is already booked during this time.`);
          setSaving(false);
          return;
        }
      } catch(err) {
        console.warn("Conflict check skipped/failed:", err);
      }
    }

    try {
      const apptRef = doc(collection(db, 'appointments'));
      
      // Use writeBatch for atomic creation of appointment + teleconsult link
      const batch = writeBatch(db);
      
      batch.set(apptRef, {
        ...form,
        scheduledAt: Timestamp.fromDate(start),
        endTime: Timestamp.fromDate(end),
        createdBy: profile?.uid,
        createdAt: Timestamp.now(),
        teleconsultLink: form.type === 'Teleconsult' ? `https://meet.jit.si/clinixehr-${apptRef.id}` : '',
        teleconsultEnabled: form.type === 'Teleconsult',
        lookupToken: '',  // placeholder - staff appointments don't need public lookup
      });

      await batch.commit();

      toast.success('Appointment scheduled!');
      onClose();
    } catch { toast.error('Failed to schedule appointment.'); }
    finally { setSaving(false); }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
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
          <div className="form-group">
            <label className="input-label">Attending Doctor</label>
            <select className="input-field" value={form.doctor} onChange={(e) => set('doctor', e.target.value)}>
              <option value="">Select doctor…</option>
              {doctors.map(d => (
                <option key={d.id} value={d.displayName || `${d.firstName || ''} ${d.lastName || ''}`.trim()}>
                  Dr. {d.displayName || `${d.firstName || ''} ${d.lastName || ''}`.trim()}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="input-label">Amount (₱) *</label>
            <input className="input-field" type="number" step="0.01" value={form.amount} onChange={(e) => set('amount', e.target.value)} placeholder="500.00" />
          </div>
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
    const q = query(collection(db, 'appointments'), orderBy('scheduledAt', 'asc'), limit(100));
    return safeOnSnapshot(q, DEMO_APPOINTMENTS, {
      onData: (data) => { setAppointments(data); setLoading(false); },
      minItems: 3,
    });
  }, []);

  const filtered = appointments.filter((a) => {
    const date = a.scheduledAt?.toDate ? a.scheduledAt.toDate() : null;
    if (!date) return false;
    if (filter === 'live')     return isToday(date) && (a.status === 'arrived' || a.status === 'confirmed' || a.status === 'in_consultation');
    if (filter === 'today')    return isToday(date);
    if (filter === 'upcoming') return !isPast(date) || isToday(date);
    if (filter === 'past')     return isPast(date) && !isToday(date);
    return true;
  });

  async function changeStatus(id, status, appointment) {
    try {
      const updates = { status };
      if (status === 'arrived') updates.arrivedAt = Timestamp.now();

      // Build a batch for ALL status changes that need to sync to secureAppointments
      const batch = writeBatch(db);

      // 1. Always update the main appointment document
      batch.update(doc(db, 'appointments', id), updates);

      // 2. Always sync status to secureAppointments (if lookupToken exists)
      //    This ensures the public user sees real-time status updates
      if (appointment?.lookupToken) {
        batch.update(doc(db, 'secureAppointments', appointment.lookupToken), updates);
      }

      // 3. If confirming: create the patient record (atomic with status update)
      if (status === 'confirmed' && appointment?.patientId && appointment?.patientName) {
        const patientRef = doc(db, 'patients', appointment.patientId);
        batch.set(patientRef, {
          firstName: appointment.patientName.split(/\s+/)[0] || appointment.patientName,
          lastName: appointment.patientName.split(/\s+/).slice(1).join(' ') || '',
          email: appointment.patientEmail || '',
          phone: appointment.patientPhone || '',
          source: 'public-booking',
          createdBy: profile?.uid,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        }, { merge: true });
      }

      // 4. If completing: also create billing + exam note atomically
      if (status === 'completed' && appointment?.patientId) {
        const apptAmount = parseFloat(appointment.amount) || 
          ({ 'Consultation': 500, 'Follow-up': 350, 'Procedure': 1500, 'Vaccination': 300, 'Other': 400 }[appointment.type] || 400);

        const billingRef = doc(collection(db, 'billing'));
        batch.set(billingRef, {
          patientName: appointment.patientName,
          patientId: appointment.patientId,
          serviceType: 'Consultation',
          description: `Appointment: ${appointment.type} — ${appointment.reason || appointment.type}`,
          amount: apptAmount,
          paymentMethod: 'Cash',
          status: 'unpaid',
          createdBy: profile?.uid,
          createdByName: profile?.displayName || '',
          createdAt: Timestamp.now(),
          source: 'appointment',
          sourceId: id,
        });

        if (['admin', 'doctor', 'nurse'].includes(profile?.role)) {
          const examRef = doc(collection(db, 'patients', appointment.patientId, 'examinations'));
          batch.set(examRef, {
            chiefComplaint: appointment.reason || `Appointment: ${appointment.type}`,
            hpi: `Automated note from completed appointment.\nType: ${appointment.type}\nDuration: ${appointment.duration} mins`,
            pe: '', assessment: '', plan: '', intervention: '', evaluation: '',
            examinedBy: appointment.doctor ? `Dr. ${appointment.doctor}` : profile?.displayName || 'System',
            examinedAt: Timestamp.now()
          });
        }
      }

      // Commit ALL writes atomically — EITHER all succeed OR none
      await batch.commit();

      // User feedback based on action
      if (status === 'confirmed') {
        toast.success(`Appointment confirmed. Patient record created.`);
      } else if (status === 'cancelled') {
        toast.success(`Appointment cancelled.`);
      } else if (status === 'completed') {
        toast.success(`Appointment completed. Billing + exam note created.`);
      } else {
        toast.success(`Marked as ${status}`);
      }
    } catch (err) {
      console.error('Status update failed:', err);
      toast.error(`Failed to update appointment. All changes rolled back.`);
    }
  }

  function getStatusBadge(status) {
    switch(status) {
      case 'confirmed': return <span className="badge badge-success">confirmed</span>;
      case 'arrived': return <span className="badge" style={{ background: 'var(--color-warning)', color: 'white', border: 'none' }}>arrived</span>;
      case 'in_consultation': return <span className="badge" style={{ background: '#6366F1', color: 'white', border: 'none' }}>in consultation</span>;
      case 'completed': return <span className="badge badge-info">completed</span>;
      case 'cancelled': return <span className="badge badge-danger">cancelled</span>;
      default: return <span className="badge">pending</span>;
    }
  }

  function joinTeleconsult(appt) {
    if (appt.teleconsultLink) {
      window.open(appt.teleconsultLink, '_blank', 'noopener,noreferrer');
    } else {
      toast.error('No teleconsult link available for this appointment.');
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
                    <div style={{ textAlign: 'center', background: 'var(--color-surface)', borderRadius: 10, padding: '6px 10px', minWidth: 52 }}>
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
                      {appt.teleconsultLink && (
                        <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Video size={12} color="var(--color-info)" />
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-info)', fontWeight: 600 }}>
                            Teleconsult ready
                          </span>
                        </div>
                      )}
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
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <button className="btn-primary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', background: '#6366F1' }} onClick={() => changeStatus(appt.id, 'in_consultation', appt)}>
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          <Video size={14} /> Start Consultation
                        </span>
                      </button>
                      <button className="btn-primary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', background: 'var(--color-success)' }} onClick={() => changeStatus(appt.id, 'completed', appt)}>
                        Mark Consult Completed
                      </button>
                    </div>
                  )}
                  {appt.status === 'in_consultation' && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      {appt.teleconsultLink && (
                        <button className="btn-icon" style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', background: 'var(--color-info)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }} onClick={() => joinTeleconsult(appt)}>
                          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                            <ExternalLink size={14} /> Join Video
                          </span>
                        </button>
                      )}
                      <button className="btn-primary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', background: 'var(--color-success)' }} onClick={() => changeStatus(appt.id, 'completed', appt)}>
                        Mark Consult Completed
                      </button>
                    </div>
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