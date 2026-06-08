import { useAuthStore } from '../store/authStore';
import { calculateRisk } from '../utils/riskCalculator';
import { Shield, Activity, AlertTriangle } from 'lucide-react';

const RISK_INDICATORS = {
  LOW:      { dots: '●○○', color: '#16A34A', label: 'Low Risk' },
  MODERATE: { dots: '●●○', color: '#D97706', label: 'Moderate Risk' },
  HIGH:     { dots: '●●●', color: '#DC2626', label: 'High Risk' },
};

/**
 * Patient Health Summary Card
 * Instant communication of patient condition — visible at the top of their profile.
 */
export default function PatientSummaryCard({ patient, vitals, labs, appointments, prescriptions }) {
  const profile = useAuthStore((s) => s.profile);
  if (!patient) return null;

  // Count critical PMH conditions
  const criticalPmhCount = (patient.pmh || []).filter(h => h.critical).length;

  // Count allergies
  const allergyCount = (patient.allergies || []).length;

  // Count active medications
  const activeMeds = (prescriptions || []).filter(rx => {
    if (rx.status === 'discontinued' || rx.computedStatus === 'completed') return false;
    if (rx.duration && rx.prescribedAt) {
      const prescribedTime = rx.prescribedAt.toMillis();
      const durationMs = parseInt(rx.duration) * 86400000;
      if (Date.now() > prescribedTime + durationMs) return false;
    }
    return true;
  });

  // Count critical labs
  const criticalLabCount = (labs || []).filter(l => l.status === 'critical').length;

  // Count missed appointments
  const missedAppts = (appointments || []).filter(a => a.status === 'cancelled').length;

  // Count abnormal labs
  const abnormalLabs = (labs || []).filter(l => l.status === 'abnormal').length;

  const risk = calculateRisk(patient, {
    activeMeds: activeMeds.length,
    criticalPmhCount,
    criticalLabCount,
    highRiskInteractions: 0,
    allergyCount,
    missedAppointments: missedAppts,
    abnormalLabs,
  });

  const riskUI = RISK_INDICATORS[risk.level] || RISK_INDICATORS.LOW;

  // Chronic conditions summary
  const chronicConditions = (patient.pmh || []).slice(0, 4).map(h => h.condition).filter(Boolean);

  return (
    <div className="card" style={{
      padding: '1.25rem',
      marginBottom: '1rem',
      background: 'var(--color-surface)',
      border: `1px solid ${riskUI.color}20`,
      borderLeft: `4px solid ${riskUI.color}`,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Risk Level Floater */}
      <div style={{
        position: 'absolute', top: '1rem', right: '1rem',
        textAlign: 'right',
      }}>
        <div style={{
          fontSize: '1.5rem', fontWeight: 800, lineHeight: 1,
          color: riskUI.color, letterSpacing: '0.1em',
        }}>
          {riskUI.dots}
        </div>
        <div style={{
          fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
          color: riskUI.color, marginTop: 2, letterSpacing: '0.05em',
        }}>
          {riskUI.label}
        </div>
      </div>

      {/* Row 1: Demographics */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
        <div style={{
          width: 48, height: 48, borderRadius: '16px',
          background: 'linear-gradient(135deg, var(--color-amber-light), var(--color-amber))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 800, fontSize: '1.1rem',
          boxShadow: '0 4px 12px rgba(196,139,40,0.3)',
        }}>
          {patient.firstName?.[0]}{patient.lastName?.[0]}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-main)' }}>
            {patient.firstName} {patient.lastName}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-sub)' }}>
            {patient.age ? `${patient.age} yrs` : '—'} · {patient.gender || '—'} · {patient.bloodType || 'Blood: —'}
          </div>
        </div>
      </div>

      {/* Row 2: Allergies + Conditions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {allergyCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem' }}>
            <AlertTriangle size={14} color="var(--color-danger)" style={{ flexShrink: 0 }} />
            <span style={{ fontWeight: 600, color: 'var(--color-danger)' }}>Allergies:</span>
            <span style={{ color: 'var(--color-text-sub)' }}>{patient.allergies.join(', ')}</span>
          </div>
        )}

        {chronicConditions.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.82rem' }}>
            <Activity size={14} color="var(--color-amber)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <span style={{ fontWeight: 600, color: 'var(--color-amber)' }}>Conditions:</span>
              <div style={{ color: 'var(--color-text-sub)', marginTop: 2 }}>
                {chronicConditions.slice(0, 3).join(' · ')}
                {chronicConditions.length > 3 && <span style={{ color: 'var(--color-text-muted)' }}> +{chronicConditions.length - 3} more</span>}
              </div>
            </div>
          </div>
        )}

        {/* Row 3: Metrics */}
        <div style={{
          display: 'flex', gap: '1.25rem', marginTop: '0.5rem',
          paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)',
          fontSize: '0.78rem', color: 'var(--color-text-sub)',
        }}>
          <div><strong style={{ color: 'var(--color-text-main)' }}>{activeMeds.length}</strong> Active Rx</div>
          <div><strong style={{ color: criticalLabCount > 0 ? 'var(--color-danger)' : 'var(--color-text-main)' }}>{criticalLabCount}</strong> Critical Labs</div>
          <div><strong style={{ color: risk.score >= 6 ? 'var(--color-danger)' : 'var(--color-text-main)' }}>{risk.score}</strong> Risk Score</div>
        </div>
      </div>
    </div>
  );
}