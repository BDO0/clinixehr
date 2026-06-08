/**
 * Deterministic Clinical Insight Rules
 * No AI/ML — pure rule-based logic for actionable patient insights.
 * Each rule defines a condition function, insight message, and suggested action.
 */

export const CLINICAL_RULES = [
  {
    id: 'missed_appointments',
    condition: (ctx) => (ctx.missedAppointments || 0) > 2,
    insight: (ctx) => `${ctx.missedAppointments} missed appointments — patient may have adherence barriers.`,
    action: 'Review medication adherence and barriers to care.',
    severity: 'warning',
    icon: 'CalendarX',
  },
  {
    id: 'increasing_bp',
    condition: (ctx) => ctx.bpTrend === 'increasing' && (ctx.bpHighCount || 0) >= 2,
    insight: () => 'Rising blood pressure trend over last readings.',
    action: 'Consider medication adjustment or lifestyle counseling.',
    severity: 'warning',
    icon: 'TrendingUp',
  },
  {
    id: 'polypharmacy',
    condition: (ctx) => (ctx.activeMeds || 0) > 4,
    insight: (ctx) => `Patient is on ${ctx.activeMeds} active medications (polypharmacy risk).`,
    action: 'Conduct medication reconciliation review.',
    severity: 'warning',
    icon: 'Pill',
  },
  {
    id: 'no_recent_visit',
    condition: (ctx) => (ctx.daysSinceLastVisit || 365) > 180,
    insight: () => 'No clinical visit in over 6 months.',
    action: 'Schedule a follow-up appointment.',
    severity: 'info',
    icon: 'Clock',
  },
  {
    id: 'abnormal_labs_unresolved',
    condition: (ctx) => (ctx.unresolvedAbnormalLabs || 0) > 0,
    insight: (ctx) => `${ctx.unresolvedAbnormalLabs} abnormal lab result(s) pending review.`,
    action: 'Review outstanding abnormal results.',
    severity: 'critical',
    icon: 'FlaskConical',
  },
  {
    id: 'overdue_immunization',
    condition: (ctx) => (ctx.overdueImmunizations || 0) > 0,
    insight: (ctx) => `${ctx.overdueImmunizations} overdue immunization(s) detected.`,
    action: 'Schedule vaccination appointment.',
    severity: 'info',
    icon: 'Syringe',
  },
  {
    id: 'chronic_condition_risk',
    condition: (ctx) => (ctx.chronicConditions?.length || 0) >= 3,
    insight: (ctx) => `Multiple chronic conditions: ${ctx.chronicConditions.join(', ')}.`,
    action: 'Ensure care coordination across conditions.',
    severity: 'warning',
    icon: 'Heart',
  },
  {
    id: 'weight_trend',
    condition: (ctx) => ctx.weightTrend === 'increasing' && (ctx.weightGain || 0) > 3,
    insight: (ctx) => `Weight increased by ${ctx.weightGain} kg over recent visits.`,
    action: 'Discuss diet and exercise plan.',
    severity: 'info',
    icon: 'Weight',
  },
];