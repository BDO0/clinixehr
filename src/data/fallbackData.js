import { Timestamp } from 'firebase/firestore';

// ─── Helpers ────────────────────────────────────────────
const now = Date.now();
const ts = (minutesAgo = 0) => Timestamp.fromMillis(now - minutesAgo * 60000);
const todayDate = () => new Date().toISOString().slice(0, 10);

// ─── Demo Patients ──────────────────────────────────────
export const DEMO_PATIENTS = [
  {
    id: 'demo-pt-1',
    firstName: 'Maria',
    lastName: 'Santos',
    dateOfBirth: '1985-03-15',
    age: 41,
    gender: 'Female',
    bloodType: 'O+',
    phone: '0917-555-0101',
    address: '123 Rizal Ave, Manila',
    allergies: ['Penicillin', 'Sulfa'],
    emergencyContact: 'Juan Santos',
    emergencyPhone: '0917-555-0102',
    pmh: [
      { condition: 'Hypertension', year: '2019', critical: true },
      { condition: 'Type 2 Diabetes', year: '2020', critical: true },
    ],
    surgicalHistory: [{ procedure: 'Appendectomy', year: '2005', hospital: 'PGH' }],
    familyHistory: [{ relation: 'Father', condition: 'Heart Disease' }],
    socialHistory: [{ factor: 'Smoking', details: 'Quit 2 yrs ago' }],
    lastVisit: '2026-05-20',
    deleted: false,
    createdAt: ts(1209600),
    createdBy: 'system',
  },
  {
    id: 'demo-pt-2',
    firstName: 'Jose',
    lastName: 'Dela Cruz',
    dateOfBirth: '1972-07-22',
    age: 53,
    gender: 'Male',
    bloodType: 'A+',
    phone: '0918-555-0201',
    address: '456 Quezon Blvd, Quezon City',
    allergies: [],
    emergencyContact: 'Elena Dela Cruz',
    emergencyPhone: '0918-555-0202',
    pmh: [
      { condition: 'Asthma', year: '2015', critical: false },
    ],
    surgicalHistory: [],
    familyHistory: [{ relation: 'Mother', condition: 'Breast Cancer' }],
    socialHistory: [{ factor: 'Alcohol', details: 'Occasional' }],
    lastVisit: '2026-06-01',
    deleted: false,
    createdAt: ts(1100000),
    createdBy: 'system',
  },
  {
    id: 'demo-pt-3',
    firstName: 'Ana',
    lastName: 'Reyes',
    dateOfBirth: '1990-11-08',
    age: 35,
    gender: 'Female',
    bloodType: 'B+',
    phone: '0919-555-0301',
    address: '789 Makati Ave, Makati',
    allergies: ['Latex'],
    emergencyContact: 'Carlos Reyes',
    emergencyPhone: '0919-555-0302',
    pmh: [],
    surgicalHistory: [{ procedure: 'Cesarean Section', year: '2020', hospital: 'St. Luke\'s' }],
    familyHistory: [],
    socialHistory: [],
    lastVisit: '2026-06-03',
    deleted: false,
    createdAt: ts(1000000),
    createdBy: 'system',
  },
  {
    id: 'demo-pt-4',
    firstName: 'Pedro',
    lastName: 'Gonzales',
    dateOfBirth: '1965-01-30',
    age: 61,
    gender: 'Male',
    bloodType: 'AB+',
    phone: '0920-555-0401',
    address: '321 Cebu St, Cebu City',
    allergies: ['Aspirin'],
    emergencyContact: 'Luisa Gonzales',
    emergencyPhone: '0920-555-0402',
    pmh: [
      { condition: 'Coronary Artery Disease', year: '2018', critical: true },
      { condition: 'Hyperlipidemia', year: '2018', critical: false },
    ],
    surgicalHistory: [{ procedure: 'CABG', year: '2019', hospital: 'Philippine Heart Center' }],
    familyHistory: [
      { relation: 'Father', condition: 'MI at 55' },
      { relation: 'Brother', condition: 'Hypertension' },
    ],
    socialHistory: [{ factor: 'Smoking', details: '30 pack-years' }],
    lastVisit: '2026-05-28',
    deleted: false,
    createdAt: ts(900000),
    createdBy: 'system',
  },
  {
    id: 'demo-pt-5',
    firstName: 'Sofia',
    lastName: 'Lim',
    dateOfBirth: '2018-04-12',
    age: 8,
    gender: 'Female',
    bloodType: 'O-',
    phone: '0921-555-0501',
    address: '654 Baguio Rd, Baguio',
    allergies: ['Eggs'],
    emergencyContact: 'Teresa Lim',
    emergencyPhone: '0921-555-0502',
    pmh: [],
    surgicalHistory: [],
    familyHistory: [],
    socialHistory: [],
    lastVisit: '2026-06-05',
    deleted: false,
    createdAt: ts(800000),
    createdBy: 'system',
  },
];

// ─── Demo Appointments ─────────────────────────────────
export const DEMO_APPOINTMENTS = [
  {
    id: 'demo-appt-1',
    patientId: 'demo-pt-1',
    patientName: 'Maria Santos',
    scheduledAt: ts(-30),
    endTime: ts(30),
    duration: 60,
    reason: 'Routine Check-up — BP monitoring',
    doctor: 'Dr. Reyes',
    type: 'Consultation',
    room: 'Room 1',
    status: 'confirmed',
    teleconsultLink: '',
    teleconsultEnabled: false,
    amount: '500',
    createdBy: 'system',
    createdAt: ts(-120),
  },
  {
    id: 'demo-appt-2',
    patientId: 'demo-pt-2',
    patientName: 'Jose Dela Cruz',
    scheduledAt: ts(-60),
    endTime: ts(0),
    duration: 60,
    reason: 'Asthma follow-up',
    doctor: 'Dr. Reyes',
    type: 'Follow-up',
    room: 'Room 2',
    status: 'arrived',
    arrivedAt: ts(-55),
    teleconsultLink: '',
    teleconsultEnabled: false,
    amount: '350',
    createdBy: 'system',
    createdAt: ts(-180),
  },
  {
    id: 'demo-appt-3',
    patientId: 'demo-pt-3',
    patientName: 'Ana Reyes',
    scheduledAt: ts(60),
    endTime: ts(90),
    duration: 30,
    reason: 'Post-natal check',
    doctor: 'Dr. Santos',
    type: 'Consultation',
    room: 'Treatment A',
    status: 'confirmed',
    teleconsultLink: '',
    teleconsultEnabled: false,
    amount: '500',
    createdBy: 'system',
    createdAt: ts(-200),
  },
  {
    id: 'demo-appt-4',
    patientId: 'demo-pt-4',
    patientName: 'Pedro Gonzales',
    scheduledAt: ts(120),
    endTime: ts(180),
    duration: 60,
    reason: 'Cardiac rehab follow-up',
    doctor: 'Dr. Reyes',
    type: 'Follow-up',
    room: 'Room 1',
    status: 'pending',
    teleconsultLink: '',
    teleconsultEnabled: false,
    amount: '350',
    createdBy: 'system',
    createdAt: ts(-250),
  },
  {
    id: 'demo-appt-5',
    patientId: 'demo-pt-5',
    patientName: 'Sofia Lim',
    scheduledAt: ts(240),
    endTime: ts(270),
    duration: 30,
    reason: 'Vaccination — MMR',
    doctor: 'Dr. Santos',
    type: 'Vaccination',
    room: 'Treatment B',
    status: 'confirmed',
    teleconsultLink: '',
    teleconsultEnabled: false,
    amount: '300',
    createdBy: 'system',
    createdAt: ts(-300),
  },
];

// ─── Demo Lab Results ──────────────────────────────────
export const DEMO_LABS = [
  {
    id: 'demo-lab-1',
    patientId: 'demo-pt-1',
    patientName: 'Maria Santos',
    testName: 'CBC',
    status: 'abnormal',
    panelData: { WBC: '12.5', RBC: '4.2', Hgb: '11.0', Hct: '35', Plt: '280' },
    orderedBy: 'Dr. Reyes',
    resultedAt: ts(1440),
    notes: 'Elevated WBC — possible infection',
  },
  {
    id: 'demo-lab-2',
    patientId: 'demo-pt-1',
    patientName: 'Maria Santos',
    testName: 'HbA1c',
    status: 'abnormal',
    result: '7.8',
    unit: '%',
    referenceRange: '< 5.7',
    orderedBy: 'Dr. Reyes',
    resultedAt: ts(1440),
    notes: 'Poor glycemic control — adjust medication',
  },
  {
    id: 'demo-lab-3',
    patientId: 'demo-pt-4',
    patientName: 'Pedro Gonzales',
    testName: 'Lipid Panel',
    status: 'critical',
    panelData: { TotalChol: '280', HDL: '32', LDL: '190', Trig: '210' },
    orderedBy: 'Dr. Santos',
    resultedAt: ts(720),
    notes: 'Severe dyslipidemia — statin therapy indicated',
  },
  {
    id: 'demo-lab-4',
    patientId: 'demo-pt-2',
    patientName: 'Jose Dela Cruz',
    testName: 'CMP',
    status: 'normal',
    panelData: { Na: '140', K: '4.1', Cl: '102', CO2: '25', BUN: '15', Cr: '0.9', Glu: '92', Ca: '9.4', AST: '22', ALT: '18', ALP: '65', TBili: '0.5', TProt: '7.2', Alb: '4.1' },
    orderedBy: 'Dr. Reyes',
    resultedAt: ts(2880),
    notes: 'All values within normal range',
  },
  {
    id: 'demo-lab-5',
    patientId: 'demo-pt-3',
    patientName: 'Ana Reyes',
    testName: 'TSH',
    status: 'normal',
    result: '2.1',
    unit: 'mIU/L',
    referenceRange: '0.4 - 4.0',
    orderedBy: 'Dr. Santos',
    resultedAt: ts(4320),
  },
  {
    id: 'demo-lab-6',
    patientId: 'demo-pt-4',
    patientName: 'Pedro Gonzales',
    testName: 'Troponin',
    status: 'critical',
    result: '0.12',
    unit: 'ng/mL',
    referenceRange: '< 0.04',
    orderedBy: 'Dr. Reyes',
    resultedAt: ts(180),
    notes: 'URGENT — possible MI, admit for observation',
  },
];

// ─── Demo Prescriptions ────────────────────────────────
export const DEMO_PRESCRIPTIONS = [
  {
    id: 'demo-rx-1',
    patientId: 'demo-pt-1',
    patientName: 'Maria Santos',
    drug: 'Losartan',
    dose: '50mg',
    route: 'Oral',
    frequency: 'OD',
    duration: '30',
    instructions: 'Take in the morning with food',
    status: 'active',
    prescribedBy: 'Dr. Reyes',
    prescribedByRole: 'doctor',
    prescribedAt: ts(1440),
    computedStatus: 'active',
    isExpired: false,
  },
  {
    id: 'demo-rx-2',
    patientId: 'demo-pt-1',
    patientName: 'Maria Santos',
    drug: 'Metformin',
    dose: '850mg',
    route: 'Oral',
    frequency: 'BID',
    duration: '90',
    instructions: 'Take with meals to reduce GI upset',
    status: 'active',
    prescribedBy: 'Dr. Reyes',
    prescribedByRole: 'doctor',
    prescribedAt: ts(1440),
    computedStatus: 'active',
    isExpired: false,
  },
  {
    id: 'demo-rx-3',
    patientId: 'demo-pt-4',
    patientName: 'Pedro Gonzales',
    drug: 'Atorvastatin',
    dose: '40mg',
    route: 'Oral',
    frequency: 'OD',
    duration: '90',
    instructions: 'Take at bedtime',
    status: 'active',
    prescribedBy: 'Dr. Santos',
    prescribedByRole: 'doctor',
    prescribedAt: ts(720),
    computedStatus: 'active',
    isExpired: false,
  },
  {
    id: 'demo-rx-4',
    patientId: 'demo-pt-2',
    patientName: 'Jose Dela Cruz',
    drug: 'Salbutamol',
    dose: '100mcg',
    route: 'Inhaled',
    frequency: 'PRN',
    duration: '180',
    instructions: '2 puffs as needed for wheezing',
    status: 'active',
    prescribedBy: 'Dr. Reyes',
    prescribedByRole: 'doctor',
    prescribedAt: ts(5760),
    computedStatus: 'active',
    isExpired: false,
  },
];

// ─── Demo Vitals (per-patient) ─────────────────────────
export const DEMO_VITALS = {
  'demo-pt-1': [
    { id: 'demo-v-1', bp: '140/90', hr: '88', temp: '36.8', rr: '18', o2: '97', weight: '68', notes: 'BP elevated, counsel on diet', recordedBy: 'Nurse Ana', recordedByRole: 'nurse', recordedAt: ts(1440) },
    { id: 'demo-v-2', bp: '135/85', hr: '84', temp: '36.5', rr: '16', o2: '98', weight: '67.5', recordedBy: 'Nurse Ana', recordedByRole: 'nurse', recordedAt: ts(10080) },
    { id: 'demo-v-3', bp: '145/92', hr: '90', temp: '37.0', rr: '20', o2: '96', weight: '68.2', notes: 'Patient reports stress at work', recordedBy: 'Nurse Ben', recordedByRole: 'nurse', recordedAt: ts(20160) },
  ],
  'demo-pt-2': [
    { id: 'demo-v-4', bp: '120/80', hr: '72', temp: '36.4', rr: '16', o2: '99', weight: '75', recordedBy: 'Nurse Ana', recordedByRole: 'nurse', recordedAt: ts(2880) },
  ],
  'demo-pt-4': [
    { id: 'demo-v-5', bp: '155/95', hr: '92', temp: '36.9', rr: '22', o2: '94', weight: '82', notes: 'Hypertensive urgency — inform doctor', recordedBy: 'Nurse Ben', recordedByRole: 'nurse', recordedAt: ts(720) },
    { id: 'demo-v-6', bp: '150/90', hr: '88', temp: '36.7', rr: '20', o2: '95', weight: '81.5', recordedBy: 'Nurse Ana', recordedByRole: 'nurse', recordedAt: ts(10080) },
  ],
};

// ─── Demo Orders (per-patient) ──────────────────────────
export const DEMO_ORDERS = {
  'demo-pt-1': [
    { id: 'demo-ord-1', orderType: 'laboratory', details: 'CBC, HbA1c, Lipid Panel — routine monitoring', priority: 'routine', status: 'pending', orderedBy: 'Dr. Reyes', orderedByRole: 'doctor', createdAt: ts(1440) },
    { id: 'demo-ord-2', orderType: 'medication', details: 'Increase Losartan to 100mg if BP > 140/90', priority: 'urgent', status: 'pending', orderedBy: 'Dr. Reyes', orderedByRole: 'doctor', createdAt: ts(1440) },
  ],
  'demo-pt-4': [
    { id: 'demo-ord-3', orderType: 'imaging', details: 'Chest X-Ray PA view — rule out cardiomegaly', priority: 'stat', status: 'pending', orderedBy: 'Dr. Santos', orderedByRole: 'doctor', createdAt: ts(720) },
  ],
};

// ─── Demo Exams (per-patient) ──────────────────────────
export const DEMO_EXAMS = {
  'demo-pt-1': [
    { id: 'demo-ex-1', chiefComplaint: 'Dizziness and headache for 3 days', hpi: 'Patient reports intermittent dizziness, worse in the morning. No syncope.', pe: 'BP 140/90, HR 88, regular rhythm, no murmurs', assessment: 'I10 - Essential (primary) hypertension', plan: 'Continue Losartan 50mg OD. Monitor BP weekly. Lifestyle modifications.', intervention: 'Patient education on low-sodium diet. Provided BP log sheet.', evaluation: 'Patient verbalizes understanding. Will return in 2 weeks.', examinedBy: 'Dr. Reyes', examinedAt: ts(1440) },
  ],
  'demo-pt-2': [
    { id: 'demo-ex-2', chiefComplaint: 'Wheezing and shortness of breath', hpi: 'Triggered by dust exposure. Using inhaler 3x/day for past week.', pe: 'Expiratory wheeze bilateral, SpO2 94%', assessment: 'J45.909 - Unspecified asthma, uncomplicated', plan: 'Continue Salbutamol PRN. Start Budesonide inhaler. Avoid triggers.', intervention: 'Demonstrated proper inhaler technique.', evaluation: 'Patient demonstrates correct technique. Symptoms improving.', examinedBy: 'Dr. Reyes', examinedAt: ts(2880) },
  ],
};

// ─── Demo Immunizations (per-patient) ──────────────────
export const DEMO_IMMUNIZATIONS = {
  'demo-pt-1': [
    { id: 'demo-imm-1', vaccineName: 'COVID-19 Pfizer', dateAdministered: '2025-11-15', lotNumber: 'PF12345', nextDueDate: '2026-11-15', notes: '3rd booster, no adverse reactions', administeredBy: 'Nurse Ana', administeredByRole: 'nurse', createdAt: ts(604800) },
    { id: 'demo-imm-2', vaccineName: 'Influenza (Flu)', dateAdministered: '2026-01-10', lotNumber: 'FL98765', nextDueDate: '2027-01-10', administeredBy: 'Nurse Ben', administeredByRole: 'nurse', createdAt: ts(302400) },
  ],
  'demo-pt-5': [
    { id: 'demo-imm-3', vaccineName: 'MMR', dateAdministered: '2024-06-15', lotNumber: 'MMR54321', nextDueDate: '2028-06-15', notes: '1st dose given at 6 yrs', administeredBy: 'Nurse Ana', administeredByRole: 'nurse', createdAt: ts(8640000) },
  ],
};

// ─── Demo Discharge Plans (per-patient) ────────────────
export const DEMO_DISCHARGE = {
  'demo-pt-4': [
    {
      id: 'demo-dc-1',
      condition: 'Stable, ambulatory with assistance',
      date: '2026-05-28',
      nature: 'Home per Request',
      medication: 'Atorvastatin 40mg OD, Aspirin 81mg OD, Clopidogrel 75mg OD',
      exercise: 'Light walking 15 min 2x/day. No heavy lifting for 4 weeks.',
      diet: 'Low-sodium, low-fat cardiac diet. Avoid processed foods.',
      healthTeaching: 'Monitor for chest pain, SOB, palpitations. Return immediately if symptoms recur.',
      nextVisit: '2026-06-11 — Cardio Rehab Clinic, Room 3',
      createdBy: 'Dr. Santos',
      createdAt: ts(432000),
    },
  ],
};

// ─── Demo Billing Records ──────────────────────────────
export const DEMO_BILLING = [
  {
    id: 'demo-bill-1',
    patientId: 'demo-pt-1',
    patientName: 'Maria Santos',
    serviceType: 'Consultation',
    description: 'Routine check-up with BP monitoring',
    amount: 500,
    paymentMethod: 'Cash',
    status: 'paid',
    createdBy: 'system',
    createdByName: 'Staff',
    createdAt: ts(1440),
    paidAt: ts(1440),
  },
  {
    id: 'demo-bill-2',
    patientId: 'demo-pt-1',
    patientName: 'Maria Santos',
    serviceType: 'Laboratory',
    description: 'Lab: CBC',
    amount: 350,
    paymentMethod: 'Cash',
    status: 'unpaid',
    createdBy: 'system',
    createdByName: 'Staff',
    createdAt: ts(1440),
  },
  {
    id: 'demo-bill-3',
    patientId: 'demo-pt-4',
    patientName: 'Pedro Gonzales',
    serviceType: 'Laboratory',
    description: 'Lab: Lipid Panel',
    amount: 600,
    paymentMethod: 'PhilHealth',
    status: 'unpaid',
    createdBy: 'system',
    createdByName: 'Staff',
    createdAt: ts(720),
  },
  {
    id: 'demo-bill-4',
    patientId: 'demo-pt-2',
    patientName: 'Jose Dela Cruz',
    serviceType: 'Consultation',
    description: 'Asthma follow-up consultation',
    amount: 350,
    paymentMethod: 'GCash',
    status: 'paid',
    createdBy: 'system',
    createdByName: 'Staff',
    createdAt: ts(5760),
    paidAt: ts(5760),
  },
  {
    id: 'demo-bill-5',
    patientId: 'demo-pt-3',
    patientName: 'Ana Reyes',
    serviceType: 'Consultation',
    description: 'Post-natal check',
    amount: 500,
    paymentMethod: 'Cash',
    status: 'paid',
    createdBy: 'system',
    createdByName: 'Staff',
    createdAt: ts(4320),
    paidAt: ts(4320),
  },
  {
    id: 'demo-bill-6',
    patientId: 'demo-pt-5',
    patientName: 'Sofia Lim',
    serviceType: 'Procedure',
    description: 'MMR Vaccination',
    amount: 300,
    paymentMethod: 'HMO',
    status: 'unpaid',
    createdBy: 'system',
    createdByName: 'Staff',
    createdAt: ts(2880),
  },
];

// ─── Dashboard KPIs ────────────────────────────────────
export const DEMO_DASHBOARD_KPIS = {
  patients: 5,
  appointments: 5,
  abnormalLabs: 3,
  activeMeds: 4,
};

// ─── Individual fallback patient (for PatientDetail) ───
export function getDemoPatient(id) {
  return DEMO_PATIENTS.find(p => p.id === id) || DEMO_PATIENTS[0];
}

// ─── Fallback per-collection accessors ─────────────────
export function getDemoVitals(patientId) {
  return DEMO_VITALS[patientId] || [
    { id: 'demo-v-fallback', bp: '120/80', hr: '72', temp: '36.5', rr: '16', o2: '98', weight: '70', notes: 'Routine check', recordedBy: 'Nurse Ana', recordedByRole: 'nurse', recordedAt: ts(1440) },
  ];
}

export function getDemoOrders(patientId) {
  return DEMO_ORDERS[patientId] || [
    { id: 'demo-ord-fallback', orderType: 'laboratory', details: 'Routine blood work — annual physical', priority: 'routine', status: 'pending', orderedBy: 'Dr. Reyes', orderedByRole: 'doctor', createdAt: ts(1440) },
  ];
}

export function getDemoExams(patientId) {
  return DEMO_EXAMS[patientId] || [
    { id: 'demo-ex-fallback', chiefComplaint: 'General check-up', hpi: 'Patient presents for annual wellness visit', pe: 'Within normal limits', assessment: 'Z00.00 - General adult medical examination', plan: 'Continue current regimen. Return in 6 months.', intervention: '', evaluation: 'Patient in good health.', examinedBy: 'Dr. Reyes', examinedAt: ts(1440) },
  ];
}

export function getDemoImmunizations(patientId) {
  return DEMO_IMMUNIZATIONS[patientId] || [
    { id: 'demo-imm-fallback', vaccineName: 'Tetanus (Td)', dateAdministered: '2025-06-01', lotNumber: 'TD67890', nextDueDate: '2035-06-01', notes: 'Routine booster', administeredBy: 'Nurse Ana', administeredByRole: 'nurse', createdAt: ts(864000) },
  ];
}

export function getDemoDischarge(patientId) {
  return DEMO_DISCHARGE[patientId] || [
    {
      id: 'demo-dc-fallback',
      condition: 'Stable, ambulatory',
      date: todayDate(),
      nature: 'Home per Request',
      medication: 'Continue prescribed medications as directed',
      exercise: 'Gradual return to normal activity',
      diet: 'Regular balanced diet',
      healthTeaching: 'Follow up with primary care physician within 1 week',
      nextVisit: 'Follow-up appointment scheduled',
      createdBy: 'Dr. Reyes',
      createdAt: ts(1440),
    },
  ];
}