import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Stethoscope, Award, Clock, MapPin } from 'lucide-react';

const DOCTOR_SPECIALTIES = {
  'Cardiology': 'Heart and cardiovascular system specialist',
  'Pediatrics': 'Child health and development specialist',
  'Internal Medicine': 'Adult disease prevention and treatment',
  'Family Medicine': 'Comprehensive healthcare for all ages',
  'Neurology': 'Nervous system disorders specialist',
  'Orthopedics': 'Musculoskeletal system specialist',
  'Dermatology': 'Skin, hair, and nail conditions specialist',
  'Ophthalmology': 'Eye and vision care specialist',
  'ENT': 'Ear, nose, and throat specialist',
  'Psychiatry': 'Mental health specialist',
  'General Surgery': 'Surgical procedures specialist',
  'OB-GYN': 'Women\'s reproductive health specialist',
};

export default function PublicDoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDoctors() {
      try {
        const q = query(collection(db, 'staff'), where('role', '==', 'doctor'));
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setDoctors(list);
      } catch (e) {
        console.error('Failed to fetch doctors:', e);
        // Use fallback sample data
        setDoctors([
          { displayName: 'Dr. Juan Dela Cruz', specialty: 'Cardiology', email: 'juan@clinixehr.com' },
          { displayName: 'Dr. Maria Santos', specialty: 'Pediatrics', email: 'maria@clinixehr.com' },
          { displayName: 'Dr. Jose Rizal', specialty: 'Internal Medicine', email: 'jose@clinixehr.com' },
          { displayName: 'Dr. Ana Gonzales', specialty: 'Family Medicine', email: 'ana@clinixehr.com' },
          { displayName: 'Dr. Carlos Mendoza', specialty: 'Neurology', email: 'carlos@clinixehr.com' },
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchDoctors();
  }, []);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{
          fontFamily: 'Montserrat, sans-serif',
          fontSize: '2rem',
          fontWeight: 800,
          color: 'var(--color-text-main)',
          margin: '0 0 0.75rem',
        }}>
          Meet Our Doctors
        </h1>
        <p style={{
          fontSize: '1rem',
          color: 'var(--color-text-sub)',
          maxWidth: '600px',
          margin: '0 auto',
          lineHeight: 1.7,
        }}>
          Our team of experienced and compassionate healthcare professionals is dedicated to providing you with the best medical care.
        </p>
      </div>

      {/* Doctors Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
          Loading doctors...
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
        }}>
          {doctors.map(doc => (
            <div key={doc.id} className="card" style={{
              padding: '2rem',
              background: 'var(--color-white)',
              border: '1px solid var(--color-border)',
              textAlign: 'center',
              transition: 'all 0.2s ease',
            }}>
              {/* Avatar */}
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--color-amber-light), var(--color-amber))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 800, fontSize: '1.5rem',
                margin: '0 auto 1.25rem',
                boxShadow: '0 8px 24px rgba(196,139,40,0.25)',
              }}>
                {doc.displayName?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'DR'}
              </div>

              <h3 style={{
                fontSize: '1.05rem',
                fontWeight: 700,
                color: 'var(--color-text-main)',
                margin: '0 0 0.5rem',
                fontFamily: 'Montserrat, sans-serif',
              }}>
                {doc.displayName || 'Doctor'}
              </h3>

              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                fontSize: '0.85rem', color: 'var(--color-amber)', fontWeight: 600,
                marginBottom: '1rem',
              }}>
                <Award size={14} />
                {doc.specialty || 'General Medicine'}
              </div>

              <p style={{
                fontSize: '0.8rem',
                color: 'var(--color-text-muted)',
                lineHeight: 1.6,
                margin: '0 0 1.25rem',
              }}>
                {DOCTOR_SPECIALTIES[doc.specialty] || 'Experienced medical professional dedicated to patient care.'}
              </p>

              <div style={{
                display: 'flex', flexDirection: 'column', gap: '0.4rem',
                fontSize: '0.78rem', color: 'var(--color-text-sub)',
              }}>
                {doc.email && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <MapPin size={12} /> {doc.email}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Clock size={12} /> Available for consultation
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}