import { AlertTriangle, ShieldAlert, AlertCircle, Info } from 'lucide-react';

const SEVERITY_MAP = {
  contraindicated: { icon: ShieldAlert,   cls: 'alert-drug-warn', label: 'CONTRAINDICATED' },
  high:            { icon: AlertTriangle,  cls: 'alert-drug-warn', label: 'HIGH RISK'        },
  moderate:        { icon: AlertCircle,    cls: 'alert-warning',   label: 'MODERATE'         },
  low:             { icon: Info,           cls: 'alert-info',      label: 'LOW RISK'         },
};

/**
 * Renders a list of drug-interaction warning alerts.
 * @param {object[]} interactions - from checkDrugInteractions()
 */
export default function DrugWarning({ interactions }) {
  if (!interactions || interactions.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
      {interactions.map((interaction, i) => {
        const { icon: Icon, cls, label } = SEVERITY_MAP[interaction.severity] || SEVERITY_MAP.moderate;
        return (
          <div key={i} className={`alert ${cls}`}>
            <Icon size={18} strokeWidth={2.2} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <span
                style={{
                  fontFamily: 'Montserrat, sans-serif',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  display: 'block',
                  marginBottom: 2,
                }}
              >
                ⚠ DRUG INTERACTION — {label}
              </span>
              <span style={{ fontSize: '0.85rem', lineHeight: 1.4 }}>{interaction.message}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
