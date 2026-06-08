import { format } from 'date-fns';
import { Pill } from 'lucide-react';

/**
 * Medication Timeline Visualization
 * Shows medication progression over time as a horizontal swimlane.
 */
export default function MedicationTimeline({ prescriptions = [] }) {
  if (!prescriptions || prescriptions.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '1.5rem' }}>
        <Pill size={32} />
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem' }}>No medication history</p>
      </div>
    );
  }

  // Sort by prescribedAt ascending
  const sorted = [...prescriptions]
    .filter(rx => rx.prescribedAt?.toMillis?.())
    .sort((a, b) => a.prescribedAt.toMillis() - b.prescribedAt.toMillis());

  if (sorted.length === 0) return null;

  // Build monthly segments
  const startDate = new Date(sorted[0].prescribedAt.toMillis());
  const endDate = new Date(sorted[sorted.length - 1].prescribedAt.toMillis());
  const monthRange = [];
  const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

  while (cursor <= endDate) {
    monthRange.push(new Date(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }

  // Use relative positioning: each month is a segment
  // For each prescription, find which months it spans
  const monthWidth = 120; // px per month

  return (
    <div style={{ marginTop: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
      <div style={{ minWidth: Math.max(monthRange.length * monthWidth, 300), position: 'relative' }}>
        {/* Month headers */}
        <div style={{ display: 'flex', marginBottom: 8 }}>
          {monthRange.map((m, i) => (
            <div key={i} style={{ width: monthWidth, flexShrink: 0 }}>
              <div style={{
                fontSize: '0.65rem', fontWeight: 700,
                color: 'var(--color-text-muted)', textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}>
                {format(m, 'MMM')}
              </div>
              <div style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)' }}>
                {format(m, 'yy')}
              </div>
            </div>
          ))}
        </div>

        {/* Timeline track */}
        <div style={{ position: 'relative', height: 60, background: 'var(--color-surface)', borderRadius: 8, overflow: 'hidden' }}>
          {/* Month grid lines */}
          {monthRange.map((_, i) => (
            <div key={i} style={{
              position: 'absolute', left: i * monthWidth, top: 0,
              width: 1, height: '100%', background: 'var(--color-border)', opacity: 0.4,
            }} />
          ))}

          {/* Medication bubbles */}
          {sorted.map((rx, i) => {
            const rxTime = rx.prescribedAt.toMillis();
            const rxDate = new Date(rxTime);
            const durationMs = (rx.duration ? parseInt(rx.duration) : 7) * 86400000;
            const endMs = rxTime + durationMs;

            // Position as percentage of total range
            const totalMs = endDate.getTime() - startDate.getTime() || 1;
            const leftPct = ((rxTime - startDate.getTime()) / totalMs) * 100;
            const widthPct = Math.max(8, (durationMs / totalMs) * 100);

            const isActive = rx.computedStatus === 'active';
            const isOverridden = rx.overrideRationale;
            const color = isActive ? (isOverridden ? '#DC2626' : '#16A34A') : '#A88A5A';

            // Stack vertically if overlapping
            const row = i % 2 === 0 ? 8 : 32;

            return (
              <div key={rx.id} title={`${rx.drug} ${rx.dose} — ${rx.computedStatus}`} style={{
                position: 'absolute',
                left: `${leftPct}%`,
                top: row,
                width: `${widthPct}%`,
                minWidth: 60,
                height: 22,
                background: color,
                borderRadius: 11,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 6px',
                opacity: isActive ? 1 : 0.5,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
              }}>
                <span style={{
                  fontSize: '0.6rem', fontWeight: 700, color: 'white',
                  textOverflow: 'ellipsis', overflow: 'hidden',
                }}>
                  {rx.drug}
                </span>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#16A34A', display: 'inline-block' }} />
            Active
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#A88A5A', display: 'inline-block' }} />
            Completed/Discontinued
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#DC2626', display: 'inline-block' }} />
            Override
          </span>
        </div>
      </div>
    </div>
  );
}