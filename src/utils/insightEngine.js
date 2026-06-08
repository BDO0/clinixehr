/**
 * Clinical Insight Engine
 * Evaluates deterministic rules against patient context to generate actionable insights.
 */
import { CLINICAL_RULES } from '../data/clinicalRules';

/**
 * Build patient context object from available data.
 * @param {object} patient
 * @param {object} [options]
 * @param {object[]} [options.vitals]
 * @param {object[]} [options.labs]
 * @param {object[]} [options.prescriptions]
 * @param {object[]} [options.immunizations]
 * @param {object[]} [options.appointments]
 * @returns {object} PatientContext for rule evaluation
 */
export function buildPatientContext(patient, { vitals = [], labs = [], prescriptions = [], immunizations = [], appointments = [] } = {}) {
  // Active medications
  const activeMeds = prescriptions.filter(rx => {
    if (rx.status === 'discontinued' || rx.computedStatus === 'completed') return false;
    if (rx.duration && rx.prescribedAt) {
      const prescribedTime = rx.prescribedAt.toMillis();
      const durationMs = parseInt(rx.duration) * 86400000;
      if (Date.now() > prescribedTime + durationMs) return false;
    }
    return true;
  }).length;

  // Chronic conditions from PMH
  const chronicConditions = (patient?.pmh || []).map(h => h.condition).filter(Boolean);

  // Missed appointments
  const missedAppointments = appointments.filter(a => a.status === 'cancelled' || (a.status === 'completed' && false)).length;

  // Abnormal labs count
  const unresolvedAbnormalLabs = labs.filter(l => l.status === 'abnormal' || l.status === 'critical').length;

  // Overdue immunizations
  const overdueImmunizations = immunizations.filter(v => {
    if (!v.nextDueDate) return false;
    return new Date(v.nextDueDate) < new Date();
  }).length;

  // Last visit
  const allDates = [
    ...vitals.map(v => v.recordedAt?.toMillis?.() || 0),
    ...appointments.filter(a => a.status === 'completed').map(a => a.scheduledAt?.toMillis?.() || 0),
    ...labs.map(l => l.resultedAt?.toMillis?.() || 0),
  ].filter(t => t > 0);
  const lastVisit = allDates.length > 0 ? Math.max(...allDates) : 0;
  const daysSinceLastVisit = lastVisit > 0 ? Math.floor((Date.now() - lastVisit) / 86400000) : 365;

  // BP Trend (simple: check last 3 vitals for BP)
  const bpReadings = vitals
    .filter(v => v.bp)
    .sort((a, b) => (b.recordedAt?.toMillis?.() || 0) - (a.recordedAt?.toMillis?.() || 0))
    .slice(0, 3);
  const bpValues = bpReadings.map(v => {
    const parts = v.bp.split('/');
    return parseInt(parts[0]) || 0;
  });
  const bpHighCount = bpValues.filter(bp => bp >= 130).length;
  const bpTrend = bpValues.length >= 2
    ? (bpValues[0] > bpValues[bpValues.length - 1] ? 'increasing' : bpValues[0] < bpValues[bpValues.length - 1] ? 'decreasing' : 'stable')
    : 'unknown';

  // Weight trend
  const weightReadings = vitals
    .filter(v => v.weight)
    .sort((a, b) => (b.recordedAt?.toMillis?.() || 0) - (a.recordedAt?.toMillis?.() || 0))
    .slice(0, 2);
  const weightGain = weightReadings.length >= 2
    ? parseFloat(weightReadings[0].weight) - parseFloat(weightReadings[weightReadings.length - 1].weight)
    : 0;
  const weightTrend = weightGain > 1 ? 'increasing' : weightGain < -1 ? 'decreasing' : 'stable';

  return {
    activeMeds,
    chronicConditions,
    missedAppointments,
    unresolvedAbnormalLabs,
    overdueImmunizations,
    daysSinceLastVisit,
    bpHighCount,
    bpTrend,
    weightGain: Math.abs(weightGain),
    weightTrend,
  };
}

/**
 * Evaluate all clinical rules against the given patient context.
 * @param {object} patientContext - From buildPatientContext()
 * @returns {object[]} Array of triggered insights with id, insight, action, severity, icon
 */
export function evaluateInsights(patientContext) {
  return CLINICAL_RULES
    .filter(rule => rule.condition(patientContext))
    .map(rule => ({
      id: rule.id,
      insight: rule.insight(patientContext),
      action: rule.action,
      severity: rule.severity,
      icon: rule.icon,
    }));
}