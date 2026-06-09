import { Stethoscope, FlaskConical, HeartPulse, Baby, Shield, Activity, Syringe, Scan } from 'lucide-react';

const SERVICES = [
  { icon: Stethoscope, title: 'General Consultation', desc: 'Comprehensive medical consultations for all ages. Our experienced physicians provide thorough evaluations and personalized treatment plans.' },
  { icon: HeartPulse, title: 'Cardiology', desc: 'Expert cardiac care including ECG, stress testing, echocardiograms, and management of heart conditions.' },
  { icon: FlaskConical, title: 'Laboratory Services', desc: 'Full-service diagnostic laboratory with rapid turnaround times for blood work, urinalysis, and specialized testing.' },
  { icon: Scan, title: 'Diagnostic Imaging', desc: 'X-ray, ultrasound, and other imaging services with state-of-the-art equipment and board-certified radiologists.' },
  { icon: Syringe, title: 'Vaccinations', desc: 'Complete immunization services for children and adults, including travel vaccines and seasonal flu shots.' },
  { icon: Baby, title: 'Pediatrics', desc: 'Specialized healthcare for infants, children, and adolescents in a comfortable, child-friendly environment.' },
  { icon: Shield, title: 'Preventive Care', desc: 'Annual physicals, health screenings, and wellness programs designed to keep you healthy.' },
  { icon: Activity, title: 'Health Monitoring', desc: 'Ongoing management of chronic conditions including hypertension, diabetes, and asthma with regular follow-ups.' },
];

export default function PublicServicesPage() {
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
          Our Medical Services
        </h1>
        <p style={{
          fontSize: '1rem',
          color: 'var(--color-text-sub)',
          maxWidth: '600px',
          margin: '0 auto',
          lineHeight: 1.7,
        }}>
          Comprehensive healthcare services delivered with compassion and excellence.
        </p>
      </div>

      {/* Services Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem',
      }}>
        {SERVICES.map((service, i) => {
          const Icon = service.icon;
          return (
            <div key={i} className="card" style={{
              padding: '2rem',
              background: 'var(--color-white)',
              border: '1px solid var(--color-border)',
              transition: 'all 0.2s ease',
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: '14px',
                background: 'var(--color-amber-bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '1.25rem',
                color: 'var(--color-amber)',
              }}>
                <Icon size={24} />
              </div>
              <h3 style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                color: 'var(--color-text-main)',
                margin: '0 0 0.75rem',
                fontFamily: 'Montserrat, sans-serif',
              }}>
                {service.title}
              </h3>
              <p style={{
                fontSize: '0.85rem',
                color: 'var(--color-text-sub)',
                lineHeight: 1.7,
                margin: 0,
              }}>
                {service.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* CTA Banner */}
      <div style={{
        marginTop: '3rem',
        padding: '2.5rem',
        borderRadius: 'var(--radius-md)',
        background: 'linear-gradient(135deg, var(--color-amber-dark), var(--color-amber))',
        textAlign: 'center',
        color: 'white',
      }}>
        <h2 style={{
          fontFamily: 'Montserrat, sans-serif',
          fontSize: '1.3rem',
          fontWeight: 800,
          margin: '0 0 0.5rem',
        }}>
          Need Help Choosing a Service?
        </h2>
        <p style={{ fontSize: '0.9rem', opacity: 0.9, margin: '0 0 1.5rem' }}>
          Our team is here to help you find the right care for your needs.
        </p>
        <a href="tel:+0281234567" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '0.75rem 1.5rem',
          borderRadius: '12px',
          background: 'white',
          color: 'var(--color-amber-dark)',
          fontWeight: 700,
          fontSize: '0.9rem',
          textDecoration: 'none',
        }}>
          Call (02) 8123-4567
        </a>
      </div>
    </div>
  );
}