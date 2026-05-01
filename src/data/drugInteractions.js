/**
 * Drug Interaction Database
 * Each entry defines a pair of drugs that interact dangerously.
 * Keys are lowercase, comma-sorted drug name pairs.
 */

export const DRUG_INTERACTIONS = [
  {
    drugs:    ['warfarin', 'aspirin'],
    severity: 'high',
    message:  'Warfarin + Aspirin: High risk of bleeding. Concurrent use significantly increases hemorrhagic risk.',
  },
  {
    drugs:    ['warfarin', 'ibuprofen'],
    severity: 'high',
    message:  'Warfarin + Ibuprofen: NSAIDs can potentiate anticoagulant effect and cause GI bleeding.',
  },
  {
    drugs:    ['metformin', 'alcohol'],
    severity: 'moderate',
    message:  'Metformin + Alcohol: Risk of lactic acidosis increased with heavy alcohol use.',
  },
  {
    drugs:    ['simvastatin', 'clarithromycin'],
    severity: 'high',
    message:  'Simvastatin + Clarithromycin: Risk of myopathy and rhabdomyolysis significantly increased.',
  },
  {
    drugs:    ['clopidogrel', 'omeprazole'],
    severity: 'moderate',
    message:  'Clopidogrel + Omeprazole: Omeprazole reduces clopidogrel antiplatelet effect.',
  },
  {
    drugs:    ['lisinopril', 'spironolactone'],
    severity: 'high',
    message:  'Lisinopril + Spironolactone: Risk of severe hyperkalemia. Monitor potassium levels closely.',
  },
  {
    drugs:    ['ssri', 'tramadol'],
    severity: 'high',
    message:  'SSRI + Tramadol: Risk of serotonin syndrome. Can be life-threatening.',
  },
  {
    drugs:    ['ciprofloxacin', 'antacids'],
    severity: 'moderate',
    message:  'Ciprofloxacin + Antacids: Antacids reduce ciprofloxacin absorption. Separate doses by 2+ hours.',
  },
  {
    drugs:    ['digoxin', 'amiodarone'],
    severity: 'high',
    message:  'Digoxin + Amiodarone: Amiodarone increases digoxin levels — risk of toxicity.',
  },
  {
    drugs:    ['methotrexate', 'nsaids'],
    severity: 'high',
    message:  'Methotrexate + NSAIDs: NSAIDs can increase methotrexate toxicity.',
  },
  {
    drugs:    ['sildenafil', 'nitrates'],
    severity: 'contraindicated',
    message:  'Sildenafil + Nitrates: CONTRAINDICATED. Severe hypotension risk.',
  },
  {
    drugs:    ['lithium', 'ibuprofen'],
    severity: 'high',
    message:  'Lithium + Ibuprofen: NSAIDs increase lithium serum levels — toxicity risk.',
  },
];

/**
 * Check a list of drug names for interactions.
 * @param {string[]} drugNames - array of medication names (case-insensitive)
 * @returns {object[]} array of triggered interaction objects
 */
export function checkDrugInteractions(drugNames) {
  const normalized = drugNames.map((d) => d.toLowerCase().trim());
  const triggered  = [];

  for (const interaction of DRUG_INTERACTIONS) {
    const [a, b] = interaction.drugs;
    const hasA = normalized.some((d) => d.includes(a) || a.includes(d));
    const hasB = normalized.some((d) => d.includes(b) || b.includes(d));
    if (hasA && hasB) triggered.push(interaction);
  }

  return triggered;
}
