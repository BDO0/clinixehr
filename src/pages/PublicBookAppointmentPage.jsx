import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { safeCreateDoc } from '../utils/safeFirestore';
import { Calendar, User, Clock, Stethoscope, CheckCircle, ArrowRight, Phone, Mail, Hash, ExternalLink, Video, Shield, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const APPT_TYPES = ['Consultation', 'Follow-up', 'Procedure', 'Vaccination', 'Check-up', 'Teleconsult'];
const TIME_SLOTS = [
  '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
];

const PHONE_REGEX = /^(09|\+639)\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_BOOKING_INTERVAL_MS = 2000;

function generateLookupToken() {
  const array = new Uint8Array(24);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

function generateRoomPassword() {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => charset[byte % charset.length]).join('');
}

function generateJitsiRoomName() {
  const randomPart = Math.random().toString(36).substring(2, 10);
  const timePart = Date.now().toString(36);
  return `clinixehr-${randomPart}-${timePart}`;
}

/**
 * Normalize Philippine mobile number for use as deterministic Firestore document ID.
 * Rules: strip all non-digits, convert leading +639 to 09.
 * Examples:
 *   +639171234567  → 09171234567
 *   0917-123-4567  → 09171234567
 *   0917 123 4567  → 09171234567
 */
function normalizePhone(raw) {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('639') && digits.length === 12) {
    return '0' + digits.slice(2);
  }
  return digits;
}

/**
 * Build slot ID: doctorId_YYYYMMDD_HHMM
 * Deterministic — prevents double booking via create-only enforcement.
 */
function buildSlotId(doctorId, dateStr, timeStr) {
  const [time, modifier] = timeStr.split(' ');
  let [hours, minutes] = time.split(':');
  let h = parseInt(hours, 10);
  const m = parseInt(minutes, 10);
  if (modifier === 'PM' && h !== 12) h += 12;
  if (modifier === 'AM' && h === 12) h = 0;

  const dateKey = dateStr.replace(/-/g, '');
  const timeKey = String(h).padStart(2, '0') + String(m).padStart(2, '0');
  const docKey = doctorId || 'any';
  return `${docKey}_${dateKey}_${timeKey}`;
}

export default function PublicBookAppointmentPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [doctors, setDoctors] = useState([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [lookupTokenCopied, setLookupTokenCopied] = useState(false);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);

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

  const [errors, setErrors] = useState({});

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
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }));
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

  const validateStep1 = () => {
    const errs = {};
    if (!form.patientName.trim()) errs.patientName = 'Full name is required';
    if (!form.patientPhone.trim()) errs.patientPhone = 'Phone number is required';
    else if (!PHONE_REGEX.test(form.patientPhone.replace(/\s/g, ''))) errs.patientPhone = 'Enter a valid PH mobile number (e.g., 09171234567)';
    if (form.patientEmail && !EMAIL_REGEX.test(form.patientEmail)) errs.patientEmail = 'Enter a valid email address';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs = {};
    if (!form.date) errs.date = 'Preferred date is required';
    if (!form.time) errs.time = 'Preferred time is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  function parseTimeToDate(dateStr, timeStr) {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':');
    let h = parseInt(hours, 10);
    const m = parseInt(minutes, 10);
    if (modifier === 'PM' && h !== 12) h += 12;
    if (modifier === 'AM' && h === 12) h = 0;
    return new Date(dateStr + 'T' + String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':00');
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    const now = Date.now();
    if (now - lastSubmitTime < MIN_BOOKING_INTERVAL_MS) {
      toast.error('Please wait a moment before submitting again.');
      return;
    }
    if (!form.patientName || !form.patientPhone || !form.date || !form.time) {
      toast.error('Please fill in all required fields.');
      return;
    }
    const phoneClean = form.patientPhone.replace(/\s/g, '');
    if (!PHONE_REGEX.test(phoneClean)) {
      toast.error('Please enter a valid Philippine mobile number (e.g., 0917 123 4567)');
      return;
    }

    setSaving(true);
    setLastSubmitTime(now);

    try {
      const scheduledAt = parseTimeToDate(form.date, form.time);
      const duration = 30;
      const endTime = new Date(scheduledAt.getTime() + duration * 60000);
      const apptType = form.type;
      const apptPrice = apptType === 'Teleconsult' ? 500 : 800;

      // Generate security tokens
      const lookupToken = generateLookupToken();
      const roomPassword = apptType === 'Teleconsult' ? generateRoomPassword() : '';
      const jitsiRoomName = apptType === 'Teleconsult' ? generateJitsiRoomName() : '';
      const jitsiLink = apptType === 'Teleconsult' ? `https://meet.jit.si/${jitsiRoomName}` : '';

      // Patient is NOT created here. Staff creates the patient record when they
      // confirm the appointment. This prevents orphaned patient records.
      const patientId = normalizePhone(phoneClean);

      // ── Step 2: Create appointment (deterministic slot ID = doctor_date_time) ──
      // Using safeCreateDoc which pre-checks for existence to differentiate
      // "already exists" from "permission denied"
      const slotId = buildSlotId(form.doctor, form.date, form.time);
      const apptRef = doc(db, 'appointments', slotId);

      const appointmentResult = await safeCreateDoc(apptRef, {
        slotId,
        patientName: form.patientName.trim(),
        patientId: patientId,
        patientEmail: form.patientEmail || '',
        patientPhone: phoneClean,
        reason: form.reason || `${apptType} appointment`,
        type: apptType,
        doctor: form.doctor || '',
        doctorName: form.doctorName || '',
        status: 'pending',
        scheduledAt: Timestamp.fromDate(scheduledAt),
        endTime: Timestamp.fromDate(endTime),
        duration: duration,
        room: apptType === 'Teleconsult' ? 'Telehealth' : 'General',
        amount: apptPrice,
        source: 'public-booking',
        createdAt: Timestamp.now(),
        notes: form.notes || '',
        arrivedAt: null,
        lookupToken: lookupToken,
        teleconsultLink: jitsiLink,
        teleconsultEnabled: apptType === 'Teleconsult',
        teleconsultPassword: apptType === 'Teleconsult' ? roomPassword : '',
        teleconsultRoomName: apptType === 'Teleconsult' ? jitsiRoomName : '',
      });

      if (!appointmentResult.success) {
        if (appointmentResult.error === 'already-exists') {
          toast.error('This time slot was just booked. Please choose another time.');
        } else {
          toast.error('Unable to book appointment. Please try again later.');
        }
        setSaving(false);
        return;
      }

      // ── Step 3: Create secureAppointments entry for public lookup ──
      const secureApptRef = doc(db, 'secureAppointments', lookupToken);
      const secureResult = await safeCreateDoc(secureApptRef, {
        appointmentId: slotId,
        patientName: form.patientName.trim(),
        patientEmail: form.patientEmail || '',
        patientPhone: phoneClean,
        type: apptType,
        doctorName: form.doctorName || '',
        status: 'pending',
        scheduledAt: Timestamp.fromDate(scheduledAt),
        endTime: Timestamp.fromDate(endTime),
        duration: duration,
        reason: form.reason || '',
        teleconsultLink: jitsiLink,
        teleconsultEnabled: apptType === 'Teleconsult',
        teleconsultRoomName: apptType === 'Teleconsult' ? jitsiRoomName : '',
        createdAt: Timestamp.now(),
        bookingRef: slotId,
      });

      if (!secureResult.success) {
        if (secureResult.error === 'already-exists') {
          toast.error('Booking reference collision. Please try again.');
        } else {
          toast.error('Unable to confirm booking. Please try again later.');
        }
        setSaving(false);
        return;
      }

      setBookingData({
        bookingRef: slotId,
        lookupToken,
        teleconsultLink: jitsiLink,
        teleconsultPassword: roomPassword,
        type: apptType,
        doctorName: form.doctorName || '',
        patientName: form.patientName.trim(),
        date: form.date,
        time: form.time,
      });
      setSuccess(true);
      toast.success('Appointment booked successfully!');

    } catch (err) {
      console.error('BOOKING ERROR:', { code: err.code, message: err.message });
      const code = err.code || '';
      if (code === 'unavailable' || code === 'deadline-exceeded') {
        toast.error('Service temporarily unavailable. Please try again.');
      } else {
        toast.error('Booking failed due to an unexpected error. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCopyToken = () => {
    if (!bookingData?.lookupToken) return;
    navigator.clipboard.writeText(bookingData.lookupToken).then(() => {
      setLookupTokenCopied(true);
      setTimeout(() => setLookupTokenCopied(false), 3000);
    });
  };

  if (success && bookingData) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--color-success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <CheckCircle size={40} color="var(--color-success)" />
        </div>
        <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-main)', margin: '0 0 0.75rem' }}>
          Appointment Confirmed!
        </h1>
        <p style={{ fontSize: '0.95rem', color: 'var(--color-text-sub)', lineHeight: 1.7, margin: '0 0 2rem' }}>
          Your appointment for <strong>{bookingData.type}</strong> with <strong>{bookingData.doctorName || 'our clinic'}</strong> on <strong>{bookingData.date}</strong> at <strong>{bookingData.time}</strong> has been booked successfully.
        </p>
        <div style={{ padding: '1rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: '0.85rem' }}>
          <Hash size={16} color="var(--color-amber)" />
          <span><strong>Booking Reference:</strong> </span>
          <code style={{ background: 'var(--color-amber-bg)', padding: '0.25rem 0.75rem', borderRadius: '6px', fontWeight: 700, color: 'var(--color-amber)', fontSize: '0.9rem' }}>{bookingData.bookingRef}</code>
        </div>
        <div style={{ padding: '1.25rem', background: 'var(--color-warning-bg)', borderRadius: 'var(--radius-sm)', border: '2px solid #EBC176', marginBottom: '1rem', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem' }}>
            <Shield size={18} color="#D97706" />
            <strong style={{ color: '#92400E', fontSize: '0.9rem' }}>Your Secure Access Token</strong>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#92400E', margin: '0 0 0.75rem', lineHeight: 1.6 }}>
            You need this <strong>Access Token</strong> to view your appointment. <strong>Save it now — it will not be shown again.</strong>
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #EBC176' }}>
            <code style={{ flex: 1, fontSize: '0.82rem', fontWeight: 700, color: '#92400E', wordBreak: 'break-all', fontFamily: 'monospace' }}>{bookingData.lookupToken}</code>
            <button onClick={handleCopyToken} style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', background: lookupTokenCopied ? 'var(--color-success)' : 'var(--color-amber)', color: 'white', border: 'none', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {lookupTokenCopied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#92400E' }}>
            <AlertTriangle size={14} /> <span>You will NOT be able to retrieve your appointments without this token.</span>
          </div>
        </div>
        {bookingData.teleconsultLink && (
          <div style={{ padding: '1.25rem', background: 'var(--color-info-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(37, 99, 235, 0.15)', marginBottom: '1.5rem', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
              <Video size={18} color="var(--color-info)" /> Teleconsult Link Ready
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-sub)', margin: '0 0 0.75rem' }}>Click the button at your scheduled time to join.</p>
            <div style={{ padding: '0.5rem 0.75rem', background: 'white', borderRadius: '6px', border: '1px solid rgba(37, 99, 235, 0.15)', marginBottom: '0.75rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Shield size={14} color="var(--color-info)" /> <span><strong>Room Password:</strong> </span>
              <code style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>{bookingData.teleconsultPassword}</code>
            </div>
            <a href={bookingData.teleconsultLink} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0.6rem 1.25rem', borderRadius: '10px', background: 'var(--color-info)', color: 'white', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none' }}>
              <ExternalLink size={16} /> Join Teleconsult Now
            </a>
          </div>
        )}
        <div style={{ padding: '1.25rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', marginBottom: '1rem', textAlign: 'left', fontSize: '0.85rem' }}>
          <div><strong>Patient:</strong> {bookingData.patientName}</div>
          <div><strong>Date:</strong> {bookingData.date}</div>
          <div><strong>Time:</strong> {bookingData.time}</div>
          <div><strong>Type:</strong> {bookingData.type}</div>
          <div><strong>Status:</strong> <span className="badge badge-warning">Pending Confirmation</span></div>
        </div>
        <div style={{ padding: '1rem', background: 'var(--color-amber-bg)', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.82rem', color: 'var(--color-text-sub)' }}>
          Track your appointment using your <strong>Access Token</strong> on the My Appointments page.
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/my-appointments')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0.75rem 1.5rem', borderRadius: '12px', background: 'var(--color-white)', color: 'var(--color-amber)', fontWeight: 700, border: '2px solid var(--color-amber)', cursor: 'pointer', fontSize: '0.85rem' }}>
            <Clock size={16} /> Track My Appointment
          </button>
          <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0.75rem 1.5rem', borderRadius: '12px', background: 'var(--color-amber)', color: 'white', fontWeight: 700, textDecoration: 'none', fontSize: '0.85rem' }}>
            Back to Home <ArrowRight size={18} />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-main)', margin: '0 0 0.75rem' }}>Book an Appointment</h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-sub)' }}>Fill out the form below and we'll confirm your appointment.</p>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: step >= s ? 'var(--color-amber)' : 'var(--color-border)', color: step >= s ? 'white' : 'var(--color-text-muted)', fontWeight: 700, fontSize: '0.85rem' }}>{s}</div>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: step >= s ? 'var(--color-text-main)' : 'var(--color-text-muted)', display: s === 3 ? 'none' : undefined }}>{s === 1 ? 'Details' : s === 2 ? 'Schedule' : 'Confirm'}</span>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <div className="card" style={{ padding: '1.5rem', background: 'var(--color-white)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}><User size={18} color="var(--color-amber)" /> Your Details</h2>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="input-label">Full Name *</label>
              <input className={`input-field ${errors.patientName ? 'input-error' : ''}`} value={form.patientName} onChange={e => updateForm('patientName', e.target.value)} placeholder="Juan Dela Cruz" required />
              {errors.patientName && <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem' }}>{errors.patientName}</span>}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="input-label"><Mail size={12} style={{ marginRight: 4 }} /> Email Address</label>
                <input className={`input-field ${errors.patientEmail ? 'input-error' : ''}`} type="email" value={form.patientEmail} onChange={e => updateForm('patientEmail', e.target.value)} placeholder="juan@email.com" />
              </div>
              <div className="form-group">
                <label className="input-label"><Phone size={12} style={{ marginRight: 4 }} /> Phone Number *</label>
                <input className={`input-field ${errors.patientPhone ? 'input-error' : ''}`} type="tel" value={form.patientPhone} onChange={e => updateForm('patientPhone', e.target.value)} placeholder="0917 123 4567" required />
                {errors.patientPhone && <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem' }}>{errors.patientPhone}</span>}
              </div>
            </div>
            <div className="form-group">
              <label className="input-label">Reason for Visit</label>
              <textarea className="input-field" value={form.reason} onChange={e => updateForm('reason', e.target.value)} placeholder="Brief description of your concern..." style={{ minHeight: 60 }} />
            </div>
            <button type="button" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={() => { if (validateStep1()) setStep(2); }}>Next: Choose Schedule <ArrowRight size={18} /></button>
          </div>
        )}
        {step === 2 && (
          <div className="card" style={{ padding: '1.5rem', background: 'var(--color-white)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}><Calendar size={18} color="var(--color-amber)" /> Appointment Schedule</h2>
            <div className="form-row">
              <div className="form-group">
                <label className="input-label">Appointment Type *</label>
                <select className="input-field" value={form.type} onChange={e => updateForm('type', e.target.value)}>{APPT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select>
              </div>
              <div className="form-group">
                <label className="input-label">Preferred Doctor</label>
                <select className="input-field" value={doctors.findIndex(d => d.id === form.doctor)} onChange={handleDoctorChange}>
                  <option value="">Any available doctor</option>
                  {doctors.map((d, i) => (<option key={d.id} value={i}>{d.displayName} — {d.specialty || 'General'}</option>))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="input-label">Preferred Date *</label>
                <input className={`input-field ${errors.date ? 'input-error' : ''}`} type="date" value={form.date} onChange={e => updateForm('date', e.target.value)} min={new Date().toISOString().split('T')[0]} required />
                {errors.date && <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem' }}>{errors.date}</span>}
              </div>
              <div className="form-group">
                <label className="input-label">Preferred Time *</label>
                <select className={`input-field ${errors.time ? 'input-error' : ''}`} value={form.time} onChange={e => updateForm('time', e.target.value)} required>
                  <option value="">Select time</option>
                  {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {errors.time && <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem' }}>{errors.time}</span>}
              </div>
            </div>
            {form.type === 'Teleconsult' && (
              <div style={{ padding: '0.75rem 1rem', background: 'var(--color-info-bg)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--color-text-sub)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Video size={16} color="var(--color-info)" /> A secure Jitsi Meet link will be generated after booking.
              </div>
            )}
            <div className="form-group">
              <label className="input-label">Additional Notes</label>
              <textarea className="input-field" value={form.notes} onChange={e => updateForm('notes', e.target.value)} placeholder="Any additional information..." style={{ minHeight: 60 }} />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setStep(1)}>Back</button>
              <button type="button" className="btn-primary" style={{ flex: 1 }} onClick={() => { if (validateStep2()) setStep(3); }}>Review & Confirm <ArrowRight size={18} /></button>
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="card" style={{ padding: '1.5rem', background: 'var(--color-white)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}><CheckCircle size={18} color="var(--color-amber)" /> Review Your Booking</h2>
            <div style={{ display: 'grid', gap: '0.75rem', padding: '1rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              <div><strong>Patient:</strong> {form.patientName}</div>
              <div><strong>Contact:</strong> {form.patientPhone} {form.patientEmail && `· ${form.patientEmail}`}</div>
              <div><strong>Type:</strong> {form.type}</div>
              <div><strong>Doctor:</strong> {form.doctorName || 'Any available'}</div>
              <div><strong>Date:</strong> {form.date}</div>
              <div><strong>Time:</strong> {form.time}</div>
              {form.notes && <div><strong>Notes:</strong> {form.notes}</div>}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setStep(2)}>Back</button>
              <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={saving}>{saving ? 'Booking...' : 'Confirm Booking'}</button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}