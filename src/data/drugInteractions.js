/**
 * Drug Interaction Database
 * Each entry defines a pair of drugs that interact dangerously.
 * Keys are lowercase, comma-sorted drug name pairs.
 */

export const DRUG_INTERACTIONS = [
  {
    drugs:    ['warfarin', 'aspirin'],
    severity: 'high',
    message:  'Warfarin + Aspirin: Extreme bleeding risk.',
    rationale: 'Aspirin inhibits platelet aggregation and can damage the GI lining, while warfarin inhibits clotting factors. Together, they exponentially increase hemorrhage risk.',
    management: 'Avoid combination if possible. If required, monitor INR and hemoglobin closely. Consider GI prophylaxis (e.g., PPI).'
  },
  {
    drugs:    ['warfarin', 'ibuprofen'],
    severity: 'high',
    message:  'Warfarin + Ibuprofen: NSAID-induced bleeding risk.',
    rationale: 'NSAIDs like Ibuprofen increase the risk of GI bleeding and can potentially interfere with warfarin metabolism.',
    management: 'Avoid NSAIDs; use Acetaminophen (Tylenol) for pain management if appropriate.'
  },
  {
    drugs:    ['simvastatin', 'clarithromycin'],
    severity: 'high',
    message:  'Simvastatin + Clarithromycin: Risk of muscle breakdown.',
    rationale: 'Clarithromycin is a potent CYP3A4 inhibitor that increases simvastatin levels by up to 10-fold.',
    management: 'Withhold Simvastatin while on Clarithromycin or switch to a non-CYP3A4 statin (e.g., Pravastatin).'
  },
  {
    drugs:    ['sildenafil', 'nitrates'],
    severity: 'contraindicated',
    message:  'Sildenafil + Nitrates: Fatal hypotension risk.',
    rationale: 'Both drugs increase nitric oxide, causing synergistic vasodilation that can lead to life-threatening drops in blood pressure.',
    management: 'CONTRAINDICATED. Do not prescribe together. Ensure 24-48 hours between doses of either.'
  },
  {
    drugs:    ['lisinopril', 'spironolactone'],
    severity: 'high',
    message:  'Lisinopril + Spironolactone: Severe Hyperkalemia.',
    rationale: 'Both drugs conserve potassium. Dual use can lead to cardiac arrhythmias due to excessive potassium levels.',
    management: 'Monitor serum potassium and creatinine within 1 week of starting/changing doses.'
  },
  {
    drugs:    ['ssri', 'tramadol'],
    severity: 'high',
    message:  'SSRI + Tramadol: Serotonin Syndrome.',
    rationale: 'Both agents increase serotonin levels in the synaptic cleft. Excess serotonin causes neuromuscular hyperactivity and autonomic instability.',
    management: 'Monitor for mental status changes, hyperthermia, and tremors. Use alternative analgesics if possible.'
  },
  {
    drugs:    ['digoxin', 'amiodarone'],
    severity: 'high',
    message:  'Digoxin + Amiodarone: Digoxin Toxicity.',
    rationale: 'Amiodarone inhibits P-glycoprotein, the transporter responsible for digoxin renal clearance, doubling digoxin levels.',
    management: 'Reduce digoxin dose by 50% when starting amiodarone. Monitor digoxin levels.'
  },
  {
    drugs:    ['metformin', 'contrast'],
    severity: 'high',
    message:  'Metformin + IV Contrast: Lactic Acidosis.',
    rationale: 'Contrast media can cause acute kidney injury, leading to metformin accumulation and fatal lactic acidosis.',
    management: 'Discontinue metformin at the time of or prior to the procedure and withhold for 48 hours.'
  },
  {
    drugs:    ['st john', 'cyclosporine'],
    severity: 'high',
    message:  'St. John\'s Wort + Cyclosporine: Organ Rejection Risk.',
    rationale: 'St. John\'s Wort induces CYP3A4, significantly lowering cyclosporine blood levels below therapeutic range.',
    management: 'Advise patient to avoid all herbal supplements while on immunosuppressants.'
  },
  {
    drugs:    ['atorvastatin', 'grapefruit'],
    severity: 'high',
    message:  'Atorvastatin + Grapefruit Juice: Statin Toxicity.',
    rationale: 'Grapefruit juice inhibits CYP3A4 metabolism of atorvastatin in the gut, leading to increased systemic exposure and myopathy risk.',
    management: 'Advise patient to avoid grapefruit/grapefruit juice, or switch to a non-CYP3A4 statin (e.g., Rosuvastatin).'
  },
  {
    drugs:    ['fluoxetine', 'phenelzine'],
    severity: 'contraindicated',
    message:  'SSRI (Fluoxetine) + MAOI (Phenelzine): Fatal Serotonin Syndrome.',
    rationale: 'Combining serotonin reuptake inhibitors with monoamine oxidase inhibitors leads to massive serotonin accumulation.',
    management: 'CONTRAINDICATED. Require at least a 14-day washout period (5 weeks for fluoxetine) between discontinuing one and starting the other.'
  },
  {
    drugs:    ['clopidogrel', 'omeprazole'],
    severity: 'moderate',
    message:  'Clopidogrel + Omeprazole: Reduced Antiplatelet Efficacy.',
    rationale: 'Omeprazole inhibits CYP2C19, the enzyme required to convert clopidogrel to its active metabolite.',
    management: 'Consider an alternative PPI (e.g., Pantoprazole) that has less CYP2C19 inhibition.'
  },
  {
    drugs:    ['methotrexate', 'bactrim'],
    severity: 'contraindicated',
    message:  'Methotrexate + Bactrim (Trimethoprim/Sulfamethoxazole): Severe Bone Marrow Suppression.',
    rationale: 'Both drugs disrupt folate metabolism, causing synergistic and potentially fatal pancytopenia.',
    management: 'CONTRAINDICATED. Use an alternative antibiotic.'
  },
  {
    drugs:    ['lithium', 'hydrochlorothiazide'],
    severity: 'high',
    message:  'Lithium + Thiazide Diuretics: Lithium Toxicity.',
    rationale: 'Thiazide diuretics cause sodium depletion, which leads to a compensatory increase in renal reabsorption of lithium, causing toxicity.',
    management: 'Avoid combination. If necessary, reduce lithium dose by 50% and monitor levels closely.'
  },
  {
    drugs:    ['ciprofloxacin', 'tizanidine'],
    severity: 'contraindicated',
    message:  'Ciprofloxacin + Tizanidine: Severe Hypotension & Sedation.',
    rationale: 'Ciprofloxacin strongly inhibits CYP1A2, drastically increasing tizanidine serum levels.',
    management: 'CONTRAINDICATED. Use an alternative muscle relaxant or antibiotic.'
  },
  {
    drugs:    ['amiodarone', 'levofloxacin'],
    severity: 'high',
    message:  'Amiodarone + Levofloxacin: QT Prolongation Risk.',
    rationale: 'Both medications independently prolong the QT interval. Concurrent use significantly increases the risk of Torsades de Pointes.',
    management: 'Avoid combination if possible. Obtain baseline and regular ECGs to monitor QTc interval.'
  },
  {
    drugs:    ['losartan', 'potassium'],
    severity: 'moderate',
    message:  'ARB (Losartan) + Potassium Supplements: Hyperkalemia.',
    rationale: 'Angiotensin Receptor Blockers reduce aldosterone secretion, which decreases renal potassium excretion.',
    management: 'Monitor serum potassium levels. Avoid routine use of potassium supplements unless hypokalemia is documented.'
  },
  {
    drugs:    ['amoxicillin', 'methotrexate'],
    severity: 'moderate',
    message:  'Amoxicillin + Methotrexate: Methotrexate Toxicity.',
    rationale: 'Penicillins can compete with methotrexate for renal tubular secretion, potentially increasing methotrexate levels.',
    management: 'Monitor for signs of methotrexate toxicity (stomatitis, bone marrow suppression) during concurrent therapy.'
  },
  {
    drugs:    ['carbamazepine', 'erythromycin'],
    severity: 'high',
    message:  'Carbamazepine + Erythromycin: Carbamazepine Toxicity.',
    rationale: 'Erythromycin inhibits CYP3A4, leading to rapid accumulation of carbamazepine and resulting toxicity (ataxia, nystagmus).',
    management: 'Avoid concurrent use; select an alternative antibiotic.'
  },
  {
    drugs:    ['ibuprofen', 'methotrexate'],
    severity: 'high',
    message:  'Ibuprofen + Methotrexate: Renal Toxicity & Bone Marrow Suppression.',
    rationale: 'NSAIDs decrease renal blood flow and compete for renal tubular secretion with methotrexate, increasing its toxicity.',
    management: 'Avoid NSAIDs in patients receiving moderate to high doses of methotrexate.'
  },
  {
    drugs:    ['spironolactone', 'bactrim'],
    severity: 'high',
    message:  'Spironolactone + Bactrim: Life-threatening Hyperkalemia.',
    rationale: 'Trimethoprim acts like a potassium-sparing diuretic in the distal tubule. Combined with spironolactone, it frequently causes severe hyperkalemia.',
    management: 'Avoid combination, especially in elderly patients or those with impaired renal function.'
  },
  {
    drugs:    ['levothyroxine', 'calcium'],
    severity: 'moderate',
    message:  'Levothyroxine + Calcium/Iron Supplements: Decreased Absorption.',
    rationale: 'Calcium and iron can bind to levothyroxine in the GI tract, significantly reducing its absorption.',
    management: 'Separate administration by at least 4 hours.'
  },
  {
    drugs:    ['azithromycin', 'ondansetron'],
    severity: 'moderate',
    message:  'Azithromycin + Ondansetron: QT Prolongation.',
    rationale: 'Both drugs have potential to prolong the QT interval. Risk is synergistic.',
    management: 'Monitor ECG if the patient has underlying cardiac conditions or electrolyte imbalances.'
  },
  {
    drugs:    ['valproic', 'lamotrigine'],
    severity: 'high',
    message:  'Valproic Acid + Lamotrigine: Stevens-Johnson Syndrome Risk.',
    rationale: 'Valproic acid inhibits lamotrigine metabolism, more than doubling its half-life and drastically increasing the risk of severe skin rashes.',
    management: 'Lamotrigine dose must be reduced by at least 50% when added to valproic acid. Titrate very slowly.'
  },
  {
    drugs:    ['ergotamine', 'clarithromycin'],
    severity: 'contraindicated',
    message:  'Ergotamine + Clarithromycin: Severe Ischemia Risk.',
    rationale: 'Clarithromycin strongly inhibits CYP3A4, leading to massive increases in ergotamine levels and resulting in severe vasospasm and limb ischemia.',
    management: 'CONTRAINDICATED. Do not use together.'
  },
  {
    drugs:    ['pimozide', 'azithromycin'],
    severity: 'contraindicated',
    message:  'Pimozide + Azithromycin: Sudden Cardiac Death.',
    rationale: 'Both drugs significantly prolong the QT interval, creating a high risk of fatal ventricular arrhythmias.',
    management: 'CONTRAINDICATED. Use an alternative antipsychotic or antibiotic.'
  },
  {
    drugs:    ['colchicine', 'clarithromycin'],
    severity: 'contraindicated',
    message:  'Colchicine + Clarithromycin: Fatal Toxicity.',
    rationale: 'Inhibition of both CYP3A4 and P-glycoprotein by clarithromycin leads to fatal colchicine accumulation, even at normal doses.',
    management: 'CONTRAINDICATED. Select alternative agents.'
  },
  {
    drugs:    ['thioridazine', 'paroxetine'],
    severity: 'contraindicated',
    message:  'Thioridazine + Paroxetine: QT Prolongation.',
    rationale: 'Paroxetine inhibits CYP2D6, the primary enzyme for thioridazine metabolism, leading to life-threatening cardiac arrhythmias.',
    management: 'CONTRAINDICATED. Switch to alternative therapies.'
  }
];

/**
 * Check a list of drug names for interactions.
 * @param {string[]} drugNames - array of medication names (case-insensitive)
 * @returns {object[]} array of triggered interaction objects
 */
export function checkDrugInteractions(drugNames) {
  if (!Array.isArray(drugNames)) return [];
  const normalized = drugNames
    .filter(d => typeof d === 'string')
    .map(d => d.toLowerCase().trim());
  const triggered  = [];

  for (const interaction of DRUG_INTERACTIONS) {
    const [a, b] = interaction.drugs;
    const hasA = normalized.some((d) => d.includes(a) || a.includes(d));
    const hasB = normalized.some((d) => d.includes(b) || b.includes(d));
    if (hasA && hasB) triggered.push(interaction);
  }

  return triggered;
}

/**
 * Allergy Cross Reference Database
 * Maps allergy classes to specific drugs.
 */
export const ALLERGY_CROSS_REFERENCE = {
  penicillin: ['amoxicillin', 'ampicillin', 'augmentin', 'penicillin', 'piperacillin', 'ticarcillin'],
  sulfa: ['bactrim', 'sulfamethoxazole', 'septra', 'sulfasalazine'],
  nsaids: ['ibuprofen', 'naproxen', 'celebrex', 'aspirin', 'meloxicam', 'diclofenac', 'ketorolac'],
  opioids: ['morphine', 'oxycodone', 'hydrocodone', 'tramadol', 'fentanyl', 'codeine'],
  cephalosporins: ['cephalexin', 'ceftriaxone', 'cefazolin', 'cefepime']
};

/**
 * Check if a prescribed drug triggers any patient allergies.
 * @param {string} drugName - The name of the drug being prescribed
 * @param {string[]} patientAllergies - The list of allergies from the patient's medical history
 * @returns {string|null} The warning message if an allergy is triggered, or null if safe.
 */
export function checkDrugAllergies(drugName, patientAllergies) {
  if (!drugName || typeof drugName !== 'string' || !Array.isArray(patientAllergies) || patientAllergies.length === 0) return null;
  
  const normalizedDrug = drugName.toLowerCase().trim();
  
  for (const allergy of patientAllergies) {
    if (typeof allergy !== 'string') continue;
    const normalizedAllergy = allergy.toLowerCase().trim();
    
    // Direct match (e.g., patient is allergic to "amoxicillin", drug is "amoxicillin")
    if (normalizedDrug.includes(normalizedAllergy) || normalizedAllergy.includes(normalizedDrug)) {
      return `Patient is directly allergic to ${allergy}.`;
    }
    
    // Class match (e.g., patient is allergic to "penicillin", drug is "amoxicillin")
    for (const [allergyClass, drugsInClass] of Object.entries(ALLERGY_CROSS_REFERENCE)) {
      if (normalizedAllergy.includes(allergyClass) || allergyClass.includes(normalizedAllergy)) {
        if (drugsInClass.some(d => normalizedDrug.includes(d))) {
          return `${drugName} belongs to the ${allergyClass} class, which the patient is allergic to.`;
        }
      }
    }
  }
  return null;
}
