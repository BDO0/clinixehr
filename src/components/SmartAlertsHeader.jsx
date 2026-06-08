import { useState } from 'react';
import { AlertTriangle, ShieldAlert, AlertCircle, Info, ChevronDown, ChevronRight, X } from 'lucide-react';
import { checkDrugInteractions, checkDrugAllergies } from '../data/drugInteractions';

const SEVERITY_ORDER = ['critical', 'warning', 'info'];
const SEVERITY_CONFIG = {
  critical: { icon: ShieldAlert, color: 'var(--color-danger)', bg: 'var(--color-danger-bg)', label: 'CRITICAL' },
  warning:  { icon: AlertTriangle, color: 'var(--color-warning)', bg: 'var(--color-warning-bg)', label: 'WARNING' },
  info:     { icon: Info, color: '#2563EB', bg: 'var(--color-info-bg)', label: 'INFO' },
};

/**
 * Smart Alerts Header
 * Aggregates and displays all active clinical alerts at the top of PatientDetailPage.
 * Shows drug allergies, interactions, critical labs, missed appointments, chronic conditions.
 */
export default function SmartAlertsHeader({ patient, labs = [], appointments = [], prescriptions = [] }) {
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(new Set());

  if (!patient) return null;

  // Build alert list
  const alerts = [];

  // 1. Allergies
  if (patient.allergies?.length > 0) {
    patient.allergies.forEach(allergy => {
      alerts.push({
        id: `allergy-${allergy}`,
        severity: 'critical',
        title: 'Allergy Alert',
        message: `Patient has documented allergy to ${allergy}`,
        detail: `Review all prescriptions for ${allergy} cross-reactivity before ordering.`,
      });
    });
  }

  // 2. Drug interactions from active meds
  const activeDrugs = prescriptions.filter(rx => {
    if (rx.status === 'discontinued' || rx.computedStatus === 'completed') return false;
    if (rx.duration && rx.prescribedAt) {
      const prescribedTime = rx.prescribedAt.toMillis();
      const durationMs = parseInt(rx.duration) * 86400000;
      if (Date.now() > prescribedTime + durationMs) return false;
    }
    return true;
  }).map(rx => rx.drug);

  if (activeDrugs.length >= 2) {
    const interactions = checkDrugInteractions(activeDrugs);
    interactions
      .filter(i => ['high', 'contraindicated'].includes(i.severity))
      .forEach(i => {
        alerts.push({
          id: `interaction-${i.drugs.join('-')}`,
          severity: i.severity === 'contraindicated' ? 'critical' : 'warning',
          title: 'Drug Interaction',
          message: i.message,
          detail: i.management || 'Review clinical management guidelines.',
        });
      });
  }

  // 3. Critical lab results
  (labs || []).filter(l => l.status === 'critical').forEach(l => {
    alerts.push({
      id: `lab-critical-${l.id}`,
      severity: 'critical',
      title: 'Critical Lab',
      message: `${l.testName}: ${l.result || 'CRITICAL'} ${l.unit || ''}`,
      detail: `${l.testName} resulted as CRITICAL. Immediate clinical review required.`,
    });
  });

  // 4. Abnormal lab results
  (labs || []).filter(l => l.status === 'abnormal').forEach(l => {
    alerts.push({
      id: `lab-abnormal-${l.id}`,
      severity: 'warning',
      title: 'Abnormal Lab',
      message: `${l.testName}: ${l.result || 'ABNORMAL'} ${l.unit || ''}`,
      detail: `${l.testName} outside normal range. Review and follow up.`,
    });
  });

  // 5. Missed/cancelled appointments
  const missedAppts = (appointments || []).filter(a => a.status === 'cancelled').length;
  if (missedAppts > 0) {
    alerts.push({
      id: 'missed-appts',
      severity: 'info',
      title: 'Missed Appointment',
      message: `${missedAppts} cancelled appointment(s) on record`,
      detail: 'Consider reaching out to reschedule.',
    });
  }

  // 6. Chronic conditions
  const criticalPmh = (patient.pmh || []).filter(h => h.critical);
  criticalPmh.forEach(h => {
    alerts.push({
      id: `critical-condition-${h.condition}`,
      severity: 'warning',
      title: 'Critical Condition',
      message: `Critical: ${h.condition}`,
      detail: `${h.condition} requires ongoing management. Last recorded: ${h.year || 'unknown year'}.`,
    });
  });

  if (alerts.length === 0) return null;

  // Filter dismissed
  const visible = alerts.filter(a => !dismissed.has(a.id));

  // Sort by severity
  const sorted = [...visible].sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity));

  // Group by severity
  const grouped = {};
  sorted.forEach(a => {
    if (!grouped[a.severity]) grouped[a.severity] = [];
    grouped[a.severity].push(a);
  });

  const countBySeverity = SEVERITY_ORDER.reduce((acc, s) => {
    const count = sorted.filter(a => a.severity === s).length;
    if (count > 0) acc.push(`${s}: ${count}`);
    return acc;
  }, []);

  if (visible.length === 0) return null;

  return (
    <div style={{ marginBottom: '1rem' }}>
      {/* Collapsed Summary */}
      <div
        onClick={() => setCollapsed(!collapsed)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
          padding: '0.75rem 1rem',
          background: visible.some(a => a.severity === 'critical') ? 'var(--color-danger-bg)' : 'var(--color-warning-bg)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid',
          borderColor: visible.some(a => a.severity === 'critical') ? 'var(--color-danger)' : 'var(--color-border)',
        }}
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
        <AlertTriangle size={18} color={visible.some(a => a.severity === 'critical') ? 'var(--color-danger)' : 'var(--color-warning)'} />
        <span style={{ fontWeight: 700, fontSize: '0.9rem', flex: 1 }}>
          Clinical Alerts ({visible.length})
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          {countBySeverity.join(' | ')}
        </span>
      </div>

      {/* Expanded Alerts */}
      {!collapsed && (
        <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {SEVERITY_ORDER.map(sev => {
            const items = grouped[sev];
            if (!items) return null;
            const config = SEVERITY_CONFIG[sev];

            return (
              <div key={sev}>
                {items.map(alert => {
                  const Icon = config.icon;
                  return (
                    <div
                      key={alert.id}
                      style={{
                        padding: '0.65rem 0.9rem',
                        background: config.bg,
                        borderRadius: 'var(--radius-sm)',
                        borderLeft: `3px solid ${config.color}`,
                        marginBottom: '0.3rem',
                        display: 'flex', gap: '10px', alignItems: 'flex-start',
                        fontSize: '0.82rem',
                      }}
                    >
                      <Icon size={16} color={config.color} style={{ flexShrink: 0, marginTop: 1 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: config.color, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>
                          {config.label}
                        </div>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-main)', marginBottom: 2 }}>
                          {alert.title}: {alert.message}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-sub)' }}>
                          {alert.detail}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDismissed(new Set([...dismissed, alert.id]));
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--color-text-muted)', flexShrink: 0 }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}