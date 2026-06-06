import { AlertTriangle, ShieldAlert, AlertCircle, Info, CheckCircle2 } from 'lucide-react';

const SEVERITY_MAP = {
  contraindicated: { icon: ShieldAlert,   cls: 'alert-drug-warn', label: 'CONTRAINDICATED', color: 'var(--color-danger)' },
  high:            { icon: AlertTriangle,  cls: 'alert-drug-warn', label: 'HIGH RISK',        color: 'var(--color-danger)' },
  moderate:        { icon: AlertCircle,    cls: 'alert-warning',   label: 'MODERATE',         color: 'var(--color-amber-dark)' },
  low:             { icon: Info,           cls: 'alert-info',      label: 'LOW RISK',         color: 'var(--color-info)' },
};

/**
 * Renders a list of drug-interaction warning alerts with detailed rationale.
 */
export default function DrugWarning({ interactions }) {
  if (!interactions || interactions.length === 0) {
    return (
      <div className="alert alert-success" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, background: 'var(--color-success-bg)', borderColor: 'var(--color-success-border)' }}>
        <CheckCircle2 size={18} color="var(--color-success)" />
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-success)' }}>
          Clinical Safety Verified: No interactions detected.
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
      {interactions.map((interaction, i) => {
        const { icon: Icon, cls, label, color } = SEVERITY_MAP[interaction.severity] || SEVERITY_MAP.moderate;
        return (
          <div key={i} className={`alert ${cls}`} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 16px' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <Icon size={20} strokeWidth={2.5} style={{ flexShrink: 0 }} />
              <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em', color: color }}>
                DRUG INTERACTION — {label}
              </span>
            </div>
            
            <div style={{ paddingLeft: 30 }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 4 }}>{interaction.message}</div>
              
              {interaction.rationale && (
                <div style={{ fontSize: '0.82rem', marginBottom: 6, opacity: 0.9 }}>
                  <strong style={{ fontSize: '0.7rem', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Rationale:</strong>
                  {interaction.rationale}
                </div>
              )}
              
              {interaction.management && (
                <div style={{ fontSize: '0.82rem', padding: '6px 10px', background: 'var(--color-surface)', borderRadius: 6, borderLeft: `3px solid ${color}` }}>
                  <strong style={{ fontSize: '0.7rem', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Clinical Management:</strong>
                  {interaction.management}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
