import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { SkeletonList } from './Skeleton';
import { aggregateTimeline, groupEventsByDate } from '../utils/timelineAggregator';

/**
 * Clinical Timeline Component
 * Displays a unified chronological feed of all patient events.
 */
export default function ClinicalTimeline({ patientId, sources, loading }) {
  const [events, setEvents] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (sources) {
      const all = aggregateTimeline(patientId, sources);
      setEvents(all);
    }
  }, [patientId, sources]);

  if (loading) return <SkeletonList count={5} />;

  const grouped = groupEventsByDate(events);

  if (grouped.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '3rem 1rem' }}>
        <Clock size={48} />
        <p style={{ fontWeight: 600, margin: '0.5rem 0 0' }}>No clinical events recorded yet.</p>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: '0' }}>
          Events from vitals, exams, prescriptions, labs, and appointments will appear here.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '0.5rem 0' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: '1.25rem', fontSize: '0.85rem', color: 'var(--color-text-muted)'
      }}>
        <Clock size={16} />
        <span style={{ fontWeight: 600 }}>{events.length} events · chronologically sorted</span>
      </div>

      {grouped.map(group => (
        <div key={group.date} style={{ marginBottom: '1.5rem' }}>
          {/* Date Header */}
          <div style={{
            position: 'sticky', top: 0, zIndex: 10,
            background: 'var(--color-cream)',
            padding: '0.5rem 0',
            marginBottom: '0.75rem',
            borderBottom: '2px solid var(--color-border)',
          }}>
            <h3 style={{
              fontFamily: 'Montserrat, sans-serif',
              fontSize: '0.85rem', fontWeight: 700,
              color: 'var(--color-text-main)',
              margin: 0, letterSpacing: '0.02em',
            }}>
              {group.date}
            </h3>
          </div>

          {/* Timeline Column */}
          <div style={{ position: 'relative', paddingLeft: '2rem' }}>
            {/* Vertical Line */}
            <div style={{
              position: 'absolute', left: '10px', top: '8px', bottom: '8px',
              width: '2px', background: 'var(--color-border)',
              borderRadius: '2px',
            }} />

            {group.events.map(event => (
              <div key={`${event.type}-${event.id}`} style={{ position: 'relative', marginBottom: '0.75rem' }}>
                {/* Dot on Timeline */}
                <div style={{
                  position: 'absolute', left: '-2rem', top: '14px',
                  width: '14px', height: '14px', borderRadius: '50%',
                  background: event.color,
                  border: '2px solid var(--color-white)',
                  boxShadow: '0 0 0 2px var(--color-border)',
                  zIndex: 2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }} />

                {/* Event Card */}
                <div
                  onClick={() => setExpandedId(expandedId === `${event.type}-${event.id}` ? null : `${event.type}-${event.id}`)}
                  className="card"
                  style={{
                    padding: '0.75rem 1rem',
                    cursor: 'pointer',
                    marginLeft: '0', marginRight: '0',
                    transition: 'all 0.2s ease',
                    borderLeft: `3px solid ${event.color}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ fontSize: '1.2rem', lineHeight: 1.4, flexShrink: 0 }}>{event.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-main)' }}>
                        {event.title}
                      </div>
                      {event.description && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-sub)', marginTop: '2px' }}>
                          {event.description}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expandable Metadata */}
                  {expandedId === `${event.type}-${event.id}` && event.metadata && (
                    <div style={{
                      marginTop: '10px', padding: '10px 12px',
                      background: 'var(--color-surface)',
                      borderRadius: '8px', fontSize: '0.8rem',
                      border: '1px solid var(--color-border)',
                    }}>
                      {Object.entries(event.metadata).filter(([, v]) => v != null && v !== '').map(([key, val]) => (
                        <div key={key} style={{ marginBottom: '4px', display: 'flex', gap: '8px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--color-text-sub)', textTransform: 'capitalize', minWidth: '100px' }}>
                            {key.replace(/([A-Z])/g, ' $1').trim()}:
                          </span>
                          <span style={{ color: 'var(--color-text-main)', wordBreak: 'break-word' }}>
                            {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}