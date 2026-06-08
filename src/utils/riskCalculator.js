/**
 * Patient Risk Calculator
 * Computes a numeric risk score based on clinical indicators.
 * Score 0-2 -> LOW | 3-5 -> MODERATE | 6+ -> HIGH
 */

/**
 * Calculate patient risk score and level.
 * @param {object} patient
 * @param {object} [options]
 * @param {number} [options.activeMeds]
 * @param {number} [options.criticalPmhCount]
 * @param {number} [options.criticalLabCount]
 * @param {number} [options.highRiskInteractions]
 * @param {number} [options.allergyCount]
 * @param {number} [options.missedAppointments]
 * @param {number} [options.abnormalLabs]
 * @returns {{ score: number, level: string, color: string, factors: string[] }}
 */
export function calculateRisk(patient, {
  activeMeds = 0,
  criticalPmhCount = 0,
  criticalLabCount = 0,
  highRiskInteractions = 0,
  allergyCount = 0,
  missedAppointments = 0,
  abnormalLabs = 0,
} = {}) {
  let score = 0;
  const factors = [];

  if (activeMeds > 0) {
    score += Math.min(activeMeds, 4);
    if (activeMeds >= 5) factors.push(`${activeMeds} active medications (polypharmacy)`);
  }

  if (criticalPmhCount > 0) {
    score += criticalPmhCount * 2;
    factors.push(`${criticalPmhCount} critical condition(s)`);
  }

  if (criticalLabCount > 0) {
    score += criticalLabCount * 2;
    factors.push(`${criticalLabCount} critical lab(s)`);
  }

  if (highRiskInteractions > 0) {
    score += highRiskInteractions * 3;
    factors.push(`${highRiskInteractions} high-risk drug interaction(s)`);
  }

  if (allergyCount > 0) {
    score += Math.min(allergyCount, 2);
    factors.push(`${allergyCount} documented allergy/allergies`);
  }

  if (missedAppointments > 0) {
    score += Math.min(missedAppointments, 2);
    factors.push(`${missedAppointments} missed appointment(s)`);
  }

  if (abnormalLabs > 0) {
    score += Math.min(abnormalLabs, 2);
    factors.push(`${abnormalLabs} abnormal lab(s)`);
  }

  // Determine level
  let level, color;
  if (score <= 2) {
    level = 'LOW';
    color = '#16A34A';
  } else if (score <= 5) {
    level = 'MODERATE';
    color = '#D97706';
  } else {
    level = 'HIGH';
    color = '#DC2626';
  }

  return { score, level, color, factors };
}