import { useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Calendar, Clock, User, Video, ExternalLink, Search, Hash, ArrowRight, Shield, AlertTriangle, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const STATUS_LABELS = {
  pending: { label: 'Pending Confirmation', color: '#D97706', bg: 'rgba(217, 119, 6, 0.1)' },
  confirmed: { label: 'Confirmed', color: '#16A34A', bg: 'rgba(22, 163, 74, 0.1)' },
  arrived: { label: 'Arrived / Waiting', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
  in_consultation: { label: 'In Consultation', color: '#6366F1', bg: 'rgba(99, 102, 241, 0.1)' },
  completed: { label: 'Completed', color: '#6B7280', bg: 'rgba(107, 114, 128, 0.1)' },
  cancelled: { label: 'Cancelled', color: '#DC2626', bg: 'rgba(220, 38, 38, 0.1)' },
};

/**
 * Maximum search attempts to prevent brute-force abuse.
 */
const MAX_SEARCHES_PER_SESSION = 10;

export default function PublicMyAppointmentsPage() {
  const [lookupToken, setLookupToken] = useState('');
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [showTokenHelp, setShowTokenHelp] = useState(false);
  const [searchCount, setSearchCount] = useState(0);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    
    // Client-side rate limiting: prevent brute-force
    if (searchCount >= MAX_SEARCHES_PER_SESSION) {
      setError('Too many search attempts. Please try again later or contact the clinic.');
      return;
    }
    
    setLoading(true);
    setSearched(true);
    setAppointment(null);

    try {
      const token = lookupToken.trim();

      if (!token) {
        setError('Please enter your access token.');
        setLoading(false);
        return;
      }

      if (token.length !== 48 || !/^[0-9a-f]{48}$/.test(token)) {
        setError('Invalid access token format. Please enter the full 48-character token.');
        setLoading(false);
        return;
      }

      // ── SECURE LOOKUP ──
      // The access token IS the document ID in the secureAppointments collection.
      // Since tokens are 48 random hex characters (192 bits entropy),
      // they cannot be guessed, enumerated, or brute-forced.
      // The Firestore rules allow public read of secureAppointments/{token}
      // without authentication.
      const secureDoc = await getDoc(doc(db, 'secureAppointments', token));
      
      if (secureDoc.exists()) {
        const data = secureDoc.data();
        // Map secure appointment data to display format
        setAppointment({
          id: data.appointmentId || token,
          ...data,
        });
        setSearchCount(prev => prev + 1);
      } else {
        // Use generic error — don't reveal whether the token was valid format
        setError('No appointment found. Please check your access token and try again.');
        setSearchCount(prev => prev + 1);
      }
    } catch (err) {
      console.error('Search error:', err);
      if (err.code === 'permission-denied') {
        setError('Access denied. Please check your access token and try again.');
      } else {
        setError('An error occurred while searching. Please try again.');
      }
      setSearchCount(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  const canJoin = (appt) => {
    return appt.teleconsultLink && 
      (appt.status === 'arrived' || appt.status === 'in_consultation' || appt.status === 'confirmed');
  };

  const getStatusStyle = (status) => {
    return STATUS_LABELS[status] || { label: status, color: '#6B7280', bg: 'rgba(107, 114, 128, 0.1)' };
  };

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '16px',
          background: 'var(--color-info-bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1rem',
          color: 'var(--color-info)',
        }}>
          <Shield size={32} />
        </div>
        <h1 style={{
          fontFamily: 'Montserrat, sans-serif',
          fontSize: '1.8rem',
          fontWeight: 800,
          color: 'var(--color-text-main)',
          margin: '0 0 0.75rem',
        }}>
          My Appointments
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-sub)' }}>
          Enter your access token to view your appointment status.
        </p>
      </div>

      {/* Lookup Form */}
      <div className="card" style={{ padding: '1.5rem', background: 'var(--color-white)', marginBottom: '2rem' }}>
        <form onSubmit={handleSearch}>
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Lock size={14} /> Access Token
            </label>
            <input
              className="input-field"
              value={lookupToken}
              onChange={e => setLookupToken(e.target.value)}
              placeholder="Paste your 48-character access token here"
              style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}
              spellCheck={false}
              autoComplete="off"
            />
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
              The access token was shown on the booking confirmation page. It is required to view your appointments securely.
            </span>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading || searchCount >= MAX_SEARCHES_PER_SESSION}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <div className="pulse-amber" style={{ width: 16, height: 16, borderRadius: '50%', background: 'rgba(255,255,255,0.5)' }} />
                Verifying...
              </span>
            ) : searchCount >= MAX_SEARCHES_PER_SESSION ? (
              <span>Too many attempts — Contact clinic</span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Search size={16} /> Find My Appointment
              </span>
            )}
          </button>
        </form>

        {/* Lost token help */}
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <button
            onClick={() => setShowTokenHelp(!showTokenHelp)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-info)',
              cursor: 'pointer',
              fontSize: '0.78rem',
              fontWeight: 600,
              textDecoration: 'underline',
            }}
          >
            Lost your access token?
          </button>
          {showTokenHelp && (
            <div style={{
              marginTop: '0.75rem',
              padding: '0.75rem',
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.78rem',
              color: 'var(--color-text-sub)',
              lineHeight: 1.6,
              textAlign: 'left',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.5rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                <AlertTriangle size={14} color="var(--color-warning)" />
                What to do if you lost your token
              </div>
              <p style={{ margin: '0 0 0.5rem' }}>
                The access token is shown <strong>only once</strong> on the booking confirmation page for security reasons.
              </p>
              <p style={{ margin: '0 0 0.5rem' }}>
                If you've lost it, please contact the clinic directly:
              </p>
              <p style={{ margin: '0' }}>
                📞 (02) 8123-4567<br />
                Provide your full name and booking date to verify your identity.
              </p>
            </div>
          )}
        </div>

        {error && (
          <div style={{
            marginTop: '1rem', padding: '0.75rem',
            background: 'var(--color-danger-bg)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.82rem',
            color: 'var(--color-danger)',
            fontWeight: 600,
          }}>
            {error}
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
          <div className="pulse-amber" style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'linear-gradient(135deg, #C48B28, #EBC176)',
            margin: '0 auto 12px',
          }} />
          <p style={{ fontSize: '0.85rem' }}>Verifying your access...</p>
        </div>
      )}

      {/* No results */}
      {!loading && searched && !appointment && !error && (
        <div className="empty-state" style={{ padding: '3rem 1rem' }}>
          <Calendar size={48} />
          <p style={{ fontWeight: 600, margin: '0.5rem 0 0' }}>No appointment found</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: '0.25rem 0 1.5rem' }}>
            Check your access token and try again.
          </p>
          <Link to="/book-appointment" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '0.6rem 1.25rem',
            borderRadius: '10px',
            background: 'var(--color-amber)',
            color: 'white',
            fontWeight: 700,
            fontSize: '0.85rem',
            textDecoration: 'none',
          }}>
            Book an Appointment <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {/* Appointment Card */}
      {appointment && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {(() => {
            const appt = appointment;
            const date = appt.scheduledAt?.toDate ? appt.scheduledAt.toDate() : null;
            const statusStyle = getStatusStyle(appt.status);
            const teleconsultAvailable = canJoin(appt);

            return (
              <div key={appt.id} className="card" style={{
                padding: '1rem',
                border: `1px solid ${statusStyle.color}20`,
                borderLeft: `4px solid ${statusStyle.color}`,
              }}>
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-main)' }}>
                      {appt.type || 'Appointment'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-sub)', marginTop: 2 }}>
                      {appt.patientName}
                    </div>
                  </div>
                  <span style={{
                    padding: '0.2rem 0.6rem',
                    borderRadius: '6px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    background: statusStyle.bg,
                    color: statusStyle.color,
                    whiteSpace: 'nowrap',
                  }}>
                    {statusStyle.label}
                  </span>
                </div>

                {/* Details */}
                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {date && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Calendar size={14} />
                      {format(date, 'MMMM d, yyyy')} at {format(date, 'h:mm a')} ({appt.duration || 30}m)
                    </div>
                  )}
                  {appt.doctorName && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <User size={14} />
                      Dr. {appt.doctorName}
                    </div>
                  )}
                  {appt.reason && (
                    <div style={{ fontStyle: 'italic' }}>
                      "{appt.reason}"
                    </div>
                  )}
                </div>

                {/* Teleconsult Join Button */}
                {teleconsultAvailable && (
                  <div style={{ marginTop: '1rem' }}>
                    <a
                      href={appt.teleconsultLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '0.6rem 1.25rem',
                        borderRadius: '10px',
                        background: 'var(--color-info)',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        textDecoration: 'none',
                        boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
                      }}
                    >
                      <Video size={16} /> Join Teleconsult
                      <ExternalLink size={14} />
                    </a>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginLeft: '0.75rem' }}>
                      Opens in new window
                    </span>
                  </div>
                )}

                {/* Booking Reference */}
                {appt.bookingRef && (
                  <div style={{
                    marginTop: '0.75rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--color-border)',
                    fontSize: '0.7rem',
                    color: 'var(--color-text-muted)',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <Hash size={12} />
                    Ref: <code style={{ fontWeight: 600, color: 'var(--color-text-sub)' }}>{appt.bookingRef.slice(0, 8).toUpperCase()}</code>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}