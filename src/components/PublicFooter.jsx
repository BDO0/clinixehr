import { Link } from 'react-router-dom';
import { Stethoscope, Mail, Phone, MapPin } from 'lucide-react';

export default function PublicFooter() {
  return (
    <footer style={{
      background: 'var(--color-text-main)',
      color: 'var(--color-cream)',
      padding: '3rem 1.5rem 1.5rem',
      marginTop: '4rem',
    }}>
      <div style={{
        maxWidth: '1200px', margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '2rem',
      }}>
        {/* Brand */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--color-amber-light), var(--color-amber))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 800, fontSize: '1rem',
            }}>
              <Stethoscope size={18} />
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.1rem', fontFamily: 'Montserrat, sans-serif' }}>
              Clinix EHR
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', lineHeight: 1.6, color: 'var(--color-amber-light)', margin: 0 }}>
            Modern healthcare management platform connecting patients with quality medical care.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 1rem', color: 'var(--color-amber)' }}>
            Quick Links
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              { to: '/', label: 'Home' },
              { to: '/services', label: 'Services' },
              { to: '/doctors', label: 'Doctors' },
              { to: '/book-appointment', label: 'Book Appointment' },
              { to: '/teleconsult', label: 'Teleconsult' },
            ].map(link => (
              <Link key={link.to} to={link.to} style={{
                color: 'var(--color-cream)', textDecoration: 'none',
                fontSize: '0.85rem', opacity: 0.8, transition: 'opacity 0.2s',
              }}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div>
          <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 1rem', color: 'var(--color-amber)' }}>
            Contact
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={14} color="var(--color-amber)" />
              <span>123 Medical Center Drive, City</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Phone size={14} color="var(--color-amber)" />
              <span>(02) 8123-4567</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Mail size={14} color="var(--color-amber)" />
              <span>info@clinixehr.com</span>
            </div>
          </div>
        </div>

        {/* Hours */}
        <div>
          <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 1rem', color: 'var(--color-amber)' }}>
            Office Hours
          </h4>
          <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div>Mon – Fri: 8:00 AM – 6:00 PM</div>
            <div>Saturday: 9:00 AM – 3:00 PM</div>
            <div>Sunday: Closed</div>
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: '1200px', margin: '2rem auto 0',
        paddingTop: '1.5rem',
        borderTop: '1px solid rgba(235, 193, 118, 0.15)',
        textAlign: 'center',
        fontSize: '0.78rem',
        color: 'var(--color-amber-light)',
        opacity: 0.7,
      }}>
        &copy; {new Date().getFullYear()} Clinix EHR. All rights reserved.
      </div>
    </footer>
  );
}