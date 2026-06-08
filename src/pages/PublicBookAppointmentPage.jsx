import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Calendar, User, Clock, Stethoscope, CheckCircle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const APPT_TYPES = ['Consultation', 'Follow-up', 'Procedure', 'Vaccination', 'Check-up', 'Teleconsult'];
const TIME_SLOTS = [
  '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
];

export default function PublicBookAppointmentPage() {
  const [step, setStep] = useState(1);
  const [doctors, setDoctors] = useState([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    patientName: '',
    patientEmail: '',
    patientPhone: '',
    reason: '',
    type: 'Consultation',
    doctor: '',
    doctorName: '',
    date: '',
    time: '',
    notes: '',
  });

  useEffect(() => {
    async function fetchDoctors() {
      try {
        const q = query(collection(db, 'staff'), where('role', '==', 'doctor'));
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setDoctors(list);
      } catch (e) {
        console.error('Failed to fetch doctors:', e);
      }
    }
    fetchDoctors();
  }, []);

  const updateForm = (key, value) => {
    setForm(f => ({ ...f, [key]: value }));
  };

  const handleDoctorChange = (e) => {
    const idx = e.target.value;
    if (idx === '') {
      updateForm('doctor', '');
      updateForm('doctorName', '');
    } else {
      const doc = doctors[parseInt(idx)];
      updateForm('doctor', doc.id);
      updateForm('doctorName', doc.displayName);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.patientName || !form.patientPhone || !form.date || !form.time) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setSaving(true);
    try {
      // Parse date and time to create a scheduledAt timestamp
      const dateTimeStr = `${form.date}T${form.time.replace(' ', 'T')}`;
      const scheduledAt = new Date(dateTimeStr);

      await addDoc(collection(db, 'appointments'), {
        patientName: form.patientName,
        patientEmail: form.patientEmail || '',
        patientPhone: form.patientPhone,
        reason: form.reason || `${form.type} appointment`,
        type: form.type,
        doctor: form.doctor || '',
        doctorName: form.doctorName || '',
        status: 'pending',
        scheduledAt: Timestamp.fromDate(scheduledAt),
        duration: 30,
        room: 'General',
        amount: form.type === 'Teleconsult' ? 500 : 800,
        source: 'public-booking',
        createdAt: Timestamp.now(),
        notes: form.notes || '',
        arrivedAt: null,
      });

      setSuccess(true);
      toast.success('Appointment booked successfully!');
    } catch (err) {
      console.error('Booking error:', err);
      toast.error('Failed to book appointment. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (success) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'var(--color-success-bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem',
        }}>
          <CheckCircle size={40} color="var(--color-success)" />
        </div>
        <h1 style={{
          fontFamily: 'Montserrat, sans-serif',
          fontSize: '1.5rem',
          fontWeight: 800,
          color: 'var(--color-text-main)',
          margin: '0 0 0.75rem',
        }}>
          Appointment Confirmed!
        </h1>
        <p style={{ fontSize: '0.95rem', color: 'var(--color-text-sub)', lineHeight: 1.7, margin: '0 0 2rem' }}>
          Your appointment for <strong>{form.type}</strong> with <strong>{form.doctorName || 'our clinic'}</strong> on <strong>{form.date}</strong> at <strong>{form.time}</strong> has been booked successfully.
        </p>
        <div style={{
          padding: '1.25rem',
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border)',
          marginBottom: '2rem',
          textAlign: 'left',
          fontSize: '0.85rem',
        }}>
          <div style={{ marginBottom: '0.5rem' }}><strong>Patient:</strong> {form.patientName}</div>
          <div style={{ marginBottom: '0.5rem' }}><strong>Date:</strong> {form.date}</div>
          <div style={{ marginBottom: '0.5rem' }}><strong>Time:</strong> {form.time}</div>
          <div><strong>Status:</strong> <span className="badge badge-warning">Pending Confirmation</span></div>
        </div>
        <a href="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '0.75rem 1.5rem',
          borderRadius: '12px',
          background: 'var(--color-amber)',
          color: 'white',
          fontWeight: 700,
          textDecoration: 'none',
        }}>
          Back to Home <ArrowRight size={18} />
        </a>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{
          fontFamily: 'Montserrat, sans-serif',
          fontSize: '2rem',
          fontWeight: 800,
          color: 'var(--color-text-main)',
          margin: '0 0 0.75rem',
        }}>
          Book an Appointment
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-sub)' }}>
          Fill out the form below and we'll confirm your appointment.
        </p>
      </div>

      {/* Steps Indicator */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: '1rem',
        marginBottom: '2rem',
      }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: step >= s ? 'var(--color-amber)' : 'var(--color-border)',
              color: step >= s ? 'white' : 'var(--color-text-muted)',
              fontWeight: 700, fontSize: '0.85rem',
            }}>
              {s}
            </div>
            <span style={{
              fontSize: '0.8rem', fontWeight: 600,
              color: step >= s ? 'var(--color-text-main)' : 'var(--color-text-muted)',
              display: s === 3 ? 'none' : undefined,
            }}>
              {s === 1 ? 'Details' : s === 2 ? 'Schedule' : 'Confirm'}
            </span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Step 1: Patient Details */}
        {step === 1 && (
          <div className="card" style={{ padding: '1.5rem', background: 'var(--color-white)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <User size={18} color="var(--color-amber)" /> Your Details
            </h2>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="input-label">Full Name *</label>
              <input className="input-field" value={form.patientName} onChange={e => updateForm('patientName', e.target.value)} placeholder="Juan Dela Cruz" required />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="input-label">Email Address</label>
                <input className="input-field" type="email" value={form.patientEmail} onChange={e => updateForm('patientEmail', e.target.value)} placeholder="juan@email.com" />
              </div>
              <div className="form-group">
                <label className="input-label">Phone Number *</label>
                <input className="input-field" type="tel" value={form.patientPhone} onChange={e => updateForm('patientPhone', e.target.value)} placeholder="0917 123 4567" required />
              </div>
            </div>

            <div className="form-group">
              <label className="input-label">Reason for Visit</label>
              <textarea className="input-field" value={form.reason} onChange={e => updateForm('reason', e.target.value)} placeholder="Brief description of your concern..." style={{ minHeight: 60 }} />
            </div>

            <button type="button" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={() => setStep(2)}>
              Next: Choose Schedule <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* Step 2: Schedule */}
        {step === 2 && (
          <div className="card" style={{ padding: '1.5rem', background: 'var(--color-white)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={18} color="var(--color-amber)" /> Appointment Schedule
            </h2>

            <div className="form-row">
              <div className="form-group">
                <label className="input-label">Appointment Type *</label>
                <select className="input-field" value={form.type} onChange={e => updateForm('type', e.target.value)}>
                  {APPT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="input-label">Preferred Doctor</label>
                <select className="input-field" value={doctors.findIndex(d => d.id === form.doctor)} onChange={handleDoctorChange}>
                  <option value="">Any available doctor</option>
                  {doctors.map((d, i) => (
                    <option key={d.id} value={i}>{d.displayName} — {d.specialty || 'General'}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="input-label">Preferred Date *</label>
                <input className="input-field" type="date" value={form.date} onChange={e => updateForm('date', e.target.value)} min={new Date().toISOString().split('T')[0]} required />
              </div>
              <div className="form-group">
                <label className="input-label">Preferred Time *</label>
                <select className="input-field" value={form.time} onChange={e => updateForm('time', e.target.value)} required>
                  <option value="">Select time</option>
                  {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="input-label">Additional Notes</label>
              <textarea className="input-field" value={form.notes} onChange={e => updateForm('notes', e.target.value)} placeholder="Any additional information..." style={{ minHeight: 60 }} />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setStep(1)}>
                Back
              </button>
              <button type="button" className="btn-primary" style={{ flex: 1 }} onClick={() => setStep(3)}>
                Review & Confirm <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div className="card" style={{ padding: '1.5rem', background: 'var(--color-white)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle size={18} color="var(--color-amber)" /> Review Your Booking
            </h2>

            <div style={{
              display: 'grid', gap: '0.75rem',
              padding: '1rem',
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1.25rem',
              fontSize: '0.85rem',
            }}>
              <div><strong>Patient:</strong> {form.patientName}</div>
              <div><strong>Contact:</strong> {form.patientPhone} {form.patientEmail && `· ${form.patientEmail}`}</div>
              <div><strong>Type:</strong> {form.type}</div>
              <div><strong>Doctor:</strong> {form.doctorName || 'Any available'}</div>
              <div><strong>Date:</strong> {form.date}</div>
              <div><strong>Time:</strong> {form.time}</div>
              {form.notes && <div><strong>Notes:</strong> {form.notes}</div>}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setStep(2)}>
                Back
              </button>
              <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={saving}>
                {saving ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}