import { Link } from 'react-router-dom';
import { ArrowRight, CalendarCheck, Shield, Video, Stethoscope, Activity, HeartPulse } from 'lucide-react';

const HERO_STYLES = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 1.5rem',
  },
  section: {
    padding: '4rem 0',
  },
  gradientText: {
    background: 'linear-gradient(135deg, var(--color-amber-dark), var(--color-amber))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
};

export default function PublicHomePage() {
  return (
    <div>
      {/* ─── Hero Section ─── */}
      <section style={{
        ...HERO_STYLES.section,
        padding: '5rem 1.5rem',
        background: 'linear-gradient(135deg, var(--color-cream) 0%, var(--color-surface-2) 100%)',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '0.4rem 1rem',
            borderRadius: '100px',
            background: 'var(--color-amber-bg)',
            color: 'var(--color-amber)',
            fontSize: '0.8rem',
            fontWeight: 700,
            marginBottom: '1.5rem',
          }}>
            <HeartPulse size={14} />
            Your Health, Our Priority
          </div>

          <h1 style={{
            fontFamily: 'Montserrat, sans-serif',
            fontSize: 'clamp(1.8rem, 4vw, 3.2rem)',
            fontWeight: 800,
            lineHeight: 1.2,
            margin: '0 0 1.25rem',
            color: 'var(--color-text-main)',
          }}>
            Modern Healthcare{' '}
            <span style={HERO_STYLES.gradientText}>
              at Your Fingertips
            </span>
          </h1>

          <p style={{
            fontSize: '1.05rem',
            color: 'var(--color-text-sub)',
            lineHeight: 1.7,
            maxWidth: '600px',
            margin: '0 auto 2rem',
          }}>
            Experience seamless healthcare with our integrated platform. 
            Book appointments, consult with doctors online, and manage your health records — all in one place.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/book-appointment" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '0.85rem 1.75rem',
              borderRadius: '12px',
              background: 'var(--color-amber)',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.95rem',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 16px rgba(196,139,40,0.3)',
            }}>
              Book an Appointment <ArrowRight size={18} />
            </Link>
            <Link to="/teleconsult" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '0.85rem 1.75rem',
              borderRadius: '12px',
              background: 'var(--color-white)',
              color: 'var(--color-amber)',
              fontWeight: 700,
              fontSize: '0.95rem',
              textDecoration: 'none',
              border: '2px solid var(--color-amber)',
              transition: 'all 0.2s ease',
            }}>
              <Video size={18} /> Teleconsult Now
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Features Grid ─── */}
      <section style={{ ...HERO_STYLES.section, ...HERO_STYLES.container }}>
        <h2 style={{
          fontFamily: 'Montserrat, sans-serif',
          fontSize: '1.6rem',
          fontWeight: 800,
          textAlign: 'center',
          margin: '0 0 0.5rem',
          color: 'var(--color-text-main)',
        }}>
          Why Choose Clinix EHR?
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: '0 0 2.5rem' }}>
          Comprehensive healthcare solutions designed for you
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
        }}>
          {[
            { icon: CalendarCheck, title: 'Easy Booking', desc: 'Schedule appointments online with just a few clicks. Choose your preferred doctor and time slot.' },
            { icon: Video, title: 'Teleconsultation', desc: 'Consult with healthcare professionals from the comfort of your home via secure video calls.' },
            { icon: Shield, title: 'Secure Records', desc: 'Your medical data is encrypted and protected with enterprise-grade security.' },
            { icon: Activity, title: 'Health Tracking', desc: 'Monitor your vitals, lab results, and medical history in one unified dashboard.' },
            { icon: Stethoscope, title: 'Expert Doctors', desc: 'Access a network of qualified and experienced medical professionals.' },
            { icon: HeartPulse, title: 'Quality Care', desc: 'We are committed to providing the highest standard of healthcare services.' },
          ].map((feat, i) => {
            const Icon = feat.icon;
            return (
              <div key={i} className="card" style={{
                padding: '1.75rem',
                textAlign: 'center',
                background: 'var(--color-white)',
                border: '1px solid var(--color-border)',
                transition: 'all 0.2s ease',
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '16px',
                  background: 'var(--color-amber-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1rem',
                  color: 'var(--color-amber)',
                }}>
                  <Icon size={28} />
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--color-text-main)' }}>
                  {feat.title}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-sub)', lineHeight: 1.6, margin: 0 }}>
                  {feat.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      <section style={{
        ...HERO_STYLES.section,
        background: 'var(--color-amber-dark)',
        color: 'white',
        textAlign: 'center',
        padding: '4rem 1.5rem',
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{
            fontFamily: 'Montserrat, sans-serif',
            fontSize: '1.6rem',
            fontWeight: 800,
            margin: '0 0 1rem',
          }}>
            Ready to Get Started?
          </h2>
          <p style={{ fontSize: '0.95rem', lineHeight: 1.7, margin: '0 0 2rem', opacity: 0.9 }}>
            Book your first appointment today and experience the future of healthcare.
          </p>
          <Link to="/book-appointment" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '0.85rem 2rem',
            borderRadius: '12px',
            background: 'var(--color-amber)',
            color: 'white',
            fontWeight: 700,
            fontSize: '1rem',
            textDecoration: 'none',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          }}>
            Book Now <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}