import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Stethoscope } from 'lucide-react';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/services', label: 'Services' },
  { to: '/doctors', label: 'Doctors' },
  { to: '/book-appointment', label: 'Book Appointment' },
  { to: '/teleconsult', label: 'Teleconsult' },
  { to: '/my-appointments', label: 'My Appointments' },
];

export default function PublicNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'var(--color-white)',
      borderBottom: '1px solid var(--color-border)',
      backdropFilter: 'blur(12px)',
    }}>
      <div style={{
        maxWidth: '1200px', margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.75rem 1.5rem',
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--color-amber-light), var(--color-amber))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 800, fontSize: '1.2rem',
          }}>
            <Stethoscope size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-text-main)', fontFamily: 'Montserrat, sans-serif' }}>
              Clinix EHR
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: -2 }}>
              Healthcare Platform
            </div>
          </div>
        </Link>

        {/* Desktop Links */}
        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
          {NAV_LINKS.map(link => (
            <Link
              key={link.to}
              to={link.to}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '0.85rem',
                fontWeight: location.pathname === link.to ? 700 : 500,
                color: location.pathname === link.to ? 'var(--color-amber)' : 'var(--color-text-sub)',
                background: location.pathname === link.to ? 'var(--color-amber-bg)' : 'transparent',
                transition: 'all 0.2s ease',
              }}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/login"
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: 'white',
              background: 'var(--color-amber)',
              marginLeft: '0.5rem',
              transition: 'all 0.2s ease',
            }}
          >
            Staff Login
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-main)', padding: 8 }}
          className="mobile-nav-toggle"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div style={{
          padding: '0.5rem 1.5rem 1rem',
          borderTop: '1px solid var(--color-border)',
          background: 'var(--color-white)',
          display: 'flex', flexDirection: 'column', gap: '0.25rem',
        }}>
          {NAV_LINKS.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: location.pathname === link.to ? 700 : 500,
                color: location.pathname === link.to ? 'var(--color-amber)' : 'var(--color-text-sub)',
                background: location.pathname === link.to ? 'var(--color-amber-bg)' : 'transparent',
              }}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/login"
            onClick={() => setMobileOpen(false)}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: 700,
              color: 'white',
              background: 'var(--color-amber)',
              textAlign: 'center',
              marginTop: '0.5rem',
            }}
          >
            Staff Login
          </Link>
        </div>
      )}
    </nav>
  );
}