/**
 * Curated list of common ICD-10 codes for the EHR system.
 * This avoids loading the entire 70,000+ dataset client-side while covering majority of primary care scenarios.
 */
export const COMMON_ICD10_CODES = [
  // Cardiovascular
  { code: 'I10', desc: 'Essential (primary) hypertension' },
  { code: 'I25.10', desc: 'Atherosclerotic heart disease of native coronary artery without angina pectoris' },
  { code: 'I48.91', desc: 'Unspecified atrial fibrillation' },
  { code: 'I50.9', desc: 'Heart failure, unspecified' },
  // Endocrine/Metabolic
  { code: 'E11.9', desc: 'Type 2 diabetes mellitus without complications' },
  { code: 'E03.9', desc: 'Hypothyroidism, unspecified' },
  { code: 'E78.5', desc: 'Hyperlipidemia, unspecified' },
  // Respiratory
  { code: 'J45.909', desc: 'Unspecified asthma, uncomplicated' },
  { code: 'J44.9', desc: 'Chronic obstructive pulmonary disease, unspecified' },
  { code: 'J06.9', desc: 'Acute upper respiratory infection, unspecified' },
  { code: 'J01.90', desc: 'Acute sinusitis, unspecified' },
  { code: 'J20.9', desc: 'Acute bronchitis, unspecified' },
  // Musculoskeletal
  { code: 'M54.50', desc: 'Low back pain, unspecified' },
  { code: 'M15.9', desc: 'Polyosteoarthritis, unspecified' },
  { code: 'M25.50', desc: 'Pain in unspecified joint' },
  // Gastrointestinal
  { code: 'K21.9', desc: 'Gastro-esophageal reflux disease without esophagitis' },
  { code: 'K58.9', desc: 'Irritable bowel syndrome without diarrhea' },
  { code: 'K52.9', desc: 'Noninfective gastroenteritis and colitis, unspecified' },
  // Mental Health
  { code: 'F32.A', desc: 'Depression, unspecified' },
  { code: 'F41.1', desc: 'Generalized anxiety disorder' },
  // Genitourinary
  { code: 'N39.0', desc: 'Urinary tract infection, site not specified' },
  { code: 'N18.9', desc: 'Chronic kidney disease, unspecified' },
  // Skin
  { code: 'L20.9', desc: 'Atopic dermatitis, unspecified' },
  { code: 'L70.0', desc: 'Acne vulgaris' },
  { code: 'L03.90', desc: 'Cellulitis, unspecified' },
  // Neurological
  { code: 'G43.909', desc: 'Migraine, unspecified, not intractable, without status migrainosus' },
  { code: 'G47.33', desc: 'Obstructive sleep apnea (adult) (pediatric)' },
  // General/Symptoms
  { code: 'R51.9', desc: 'Headache, unspecified' },
  { code: 'R53.83', desc: 'Other fatigue' },
  { code: 'R07.9', desc: 'Chest pain, unspecified' },
  { code: 'R10.9', desc: 'Unspecified abdominal pain' },
  { code: 'Z00.00', desc: 'Encounter for general adult medical examination without abnormal findings' }
];
