import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Video, Shield, Monitor, Smartphone, ArrowRight, CheckCircle, Info } from 'lucide-react';

export default function PublicTeleconsultPage() {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '20px',
          background: 'var(--color-info-bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem',
          color: 'var(--color-info)',
        }}>
          <Video size={36} />
        </div>
        <h1 style={{
          fontFamily: 'Montserrat, sans-serif',
          fontSize: '2rem',
          fontWeight: 800,
          color: 'var(--color-text-main)',
          margin: '0 0 0.75rem',
        }}>
          Teleconsultation Services
        </h1>
        <p style={{
          fontSize: '1rem',
          color: 'var(--color-text-sub)',
          maxWidth: '600px',
          margin: '0 auto',
          lineHeight: 1.7,
        }}>
          Consult with our healthcare professionals from the comfort of your home. 
          Secure, convenient, and accessible video consultations.
        </p>
      </div>

      {/* How It Works */}
      <h2 style={{
        fontFamily: 'Montserrat, sans-serif',
        fontSize: '1.3rem',
        fontWeight: 800,
        color: 'var(--color-text-main)',
        textAlign: 'center',
        margin: '0 0 1.5rem',
      }}>
        How It Works
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.5rem',
        marginBottom: '3rem',
      }}>
        {[
          { step: '1', title: 'Book an Appointment', desc: 'Schedule a teleconsultation slot through our booking system.' },
          { step: '2', title: 'Receive Your Link', desc: 'Get a unique Jitsi Meet link sent to you before your appointment.' },
          { step: '3', title: 'Join the Call', desc: 'Click the link at your scheduled time to join the video consultation.' },
          { step: '4', title: 'Consult Your Doctor', desc: 'Discuss your health concerns with your doctor in real-time.' },
        ].map((item, i) => (
          <div key={i} style={{
            textAlign: 'center',
            padding: '1.5rem',
            background: 'var(--color-white)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'var(--color-amber)',
              color: 'white', fontWeight: 800, fontSize: '1.1rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem',
            }}>
              {item.step}
            </div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--color-text-main)' }}>
              {item.title}
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-sub)', lineHeight: 1.6, margin: 0 }}>
              {item.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Requirements */}
      <div className="card" style={{
        padding: '2rem',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        marginBottom: '2rem',
      }}>
        <h2 style={{
          fontFamily: 'Montserrat, sans-serif',
          fontSize: '1.1rem',
          fontWeight: 800,
          color: 'var(--color-text-main)',
          margin: '0 0 1rem',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Info size={18} color="var(--color-amber)" /> Requirements
        </h2>

        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {[
            { icon: Monitor, text: 'A computer, tablet, or smartphone with a camera and microphone' },
            { icon: Smartphone, text: 'Stable internet connection (minimum 2 Mbps recommended)' },
            { icon: Shield, text: 'A quiet, private space for your consultation' },
            { icon: Video, text: 'A modern web browser (Chrome, Firefox, Safari, or Edge)' },
          ].map((req, i) => {
            const Icon = req.icon;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.85rem' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '10px',
                  background: 'var(--color-info-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--color-info)', flexShrink: 0,
                }}>
                  <Icon size={18} />
                </div>
                <span style={{ color: 'var(--color-text-sub)' }}>{req.text}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Jitsi Meet Info */}
      <div className="card" style={{
        padding: '2rem',
        background: 'var(--color-white)',
        border: '1px solid var(--color-border)',
        marginBottom: '2rem',
      }}>
        <h2 style={{
          fontFamily: 'Montserrat, sans-serif',
          fontSize: '1.1rem',
          fontWeight: 800,
          color: 'var(--color-text-main)',
          margin: '0 0 0.75rem',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Video size={18} color="var(--color-info)" /> About Jitsi Meet
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-sub)', lineHeight: 1.7, margin: '0 0 1rem' }}>
          We use <strong>Jitsi Meet</strong>, a free and open-source video conferencing platform, for our teleconsultations. 
          No account or download required — simply click the link and join from your browser.
        </p>
        <div style={{
          padding: '1rem',
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-sm)',
          fontFamily: 'monospace',
          fontSize: '0.8rem',
          color: 'var(--color-text-muted)',
          wordBreak: 'break-all',
          border: '1px solid var(--color-border)',
        }}>
          https://meet.jit.si/clinixehr-{'{appointmentId}'}
        </div>
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center' }}>
        <Link to="/book-appointment" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '0.85rem 2rem',
          borderRadius: '12px',
          background: 'var(--color-amber)',
          color: 'white',
          fontWeight: 700,
          fontSize: '1rem',
          textDecoration: 'none',
          boxShadow: '0 4px 16px rgba(196,139,40,0.3)',
        }}>
          Book a Teleconsult <ArrowRight size={18} />
        </Link>
        <p style={{ marginTop: '1rem', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
          Need help? Call (02) 8123-4567
        </p>
      </div>

      {/* QR Sample Info */}
      <div style={{
        marginTop: '3rem',
        padding: '1.5rem',
        background: 'var(--color-info-bg)',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid rgba(37, 99, 235, 0.15)',
        display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
        fontSize: '0.85rem',
      }}>
        <Info size={18} color="var(--color-info)" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <strong style={{ color: 'var(--color-text-main)' }}>For Staff:</strong>{' '}
          <span style={{ color: 'var(--color-text-sub)' }}>
            Teleconsult appointments created through the admin panel will automatically generate 
            Jitsi Meet links in the format: <code>https://meet.jit.si/clinixehr-{'{appointmentId}'}</code>.
          </span>
        </div>
      </div>
    </div>
  );
}