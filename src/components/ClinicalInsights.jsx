import { Lightbulb } from 'lucide-react';
import { evaluateInsights, buildPatientContext } from '../utils/insightEngine';

const SEVERITY_STYLES = {
  critical: { bg: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: 'var(--color-danger)', label: 'CRITICAL' },
  warning:  { bg: 'var(--color-warning-bg)', color: 'var(--color-warning)', border: '#D97706', label: 'WARNING' },
  info:     { bg: 'var(--color-info-bg)', color: '#2563EB', border: '#2563EB', label: 'INFO' },
};

/**
 * Rule-based Clinical Insights Engine Component
 * Evaluates deterministic rules and displays triggered insights.
 */
export default function ClinicalInsights({ patient, vitals = [], labs = [], prescriptions = [], immunizations = [], appointments = [] }) {
  if (!patient) return null;

  const context = buildPatientContext(patient, { vitals, labs, prescriptions, immunizations, appointments });
  const insights = evaluateInsights(context);

  if (insights.length === 0) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '0.85rem 1rem',
        background: 'var(--color-success-bg)',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid rgba(34, 197, 94, 0.2)',
        marginBottom: '1rem',
      }}>
        <Lightbulb size={18} color="var(--color-success)" />
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-success)' }}>
          No clinical concerns detected. Patient is stable.
        </span>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.6rem' }}>
        <Lightbulb size={18} color="var(--color-amber)" />
        <span style={{
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: 700, fontSize: '0.85rem',
          color: 'var(--color-text-main)',
        }}>
          Clinical Insights ({insights.length})
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {insights.map(insight => {
          const style = SEVERITY_STYLES[insight.severity] || SEVERITY_STYLES.info;
          return (
            <div key={insight.id} style={{
              padding: '0.75rem 1rem',
              background: style.bg,
              borderRadius: 'var(--radius-sm)',
              borderLeft: `4px solid ${style.border}`,
              fontSize: '0.85rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{
                  fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.08em',
                  color: style.color, textTransform: 'uppercase',
                }}>
                  {style.label}
                </span>
              </div>
              <div style={{ fontWeight: 600, color: 'var(--color-text-main)', marginBottom: 2 }}>
                {insight.insight}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-sub)' }}>
                <strong>Suggested action:</strong> {insight.action}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}