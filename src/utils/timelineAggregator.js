/**
 * Clinical Timeline Aggregator
 * Merges ALL patient-related events into a single chronological timeline.
 * No duplicate storage — derived from existing subcollections on read.
 */
import { format } from 'date-fns';

/**
 * @typedef {Object} PatientEvent
 * @property {string} id - Source document ID
 * @property {string} patientId
 * @property {'vitals'|'exam'|'prescription'|'immunization'|'order'|'lab'|'appointment'|'discharge'} type
 * @property {string} title - Short human-readable title
 * @property {string} description - Detail rich text
 * @property {number} timestamp - Unix ms
 * @property {string} dateLabel - Formatted date for grouping
 * @property {string} icon - Emoji icon
 * @property {string} color - CSS color for dot
 * @property {object} metadata - Raw data for expand section
 */

const EVENT_CONFIG = {
  prescription: { icon: '💊', color: '#C48B28', label: 'Prescription' },
  lab:          { icon: '🧪', color: '#2563EB', label: 'Lab Result' },
  exam:         { icon: '🩺', color: '#16A34A', label: 'Examination' },
  immunization: { icon: '💉', color: '#7C3AED', label: 'Immunization' },
  appointment:  { icon: '📅', color: '#D97706', label: 'Appointment' },
  vital:        { icon: '❤️', color: '#DC2626', label: 'Vitals' },
  order:        { icon: '📋', color: '#0891B2', label: 'Order' },
  discharge:    { icon: '📄', color: '#6B7280', label: 'Discharge Plan' },
};

/**
 * Aggregate all patient events from multiple data sources.
 * @param {string} patientId
 * @param {object} sources - Object containing arrays from all subcollections
 * @returns {PatientEvent[]} Events sorted newest-first
 */
export function aggregateTimeline(patientId, sources) {
  const events = [];

  // ─── Prescriptions ───
  (sources.prescriptions || []).forEach(rx => {
    const time = rx.prescribedAt?.toMillis?.() || 0;
    events.push({
      id: rx.id,
      patientId,
      type: 'prescription',
      title: `${rx.drug} ${rx.dose || ''}`.trim(),
      description: `${rx.route ? rx.route + ' · ' : ''}${rx.frequency || ''}${rx.duration ? ' · ' + rx.duration + ' days' : ''}`,
      timestamp: time,
      dateLabel: time ? format(new Date(time), 'MMMM d, yyyy') : '',
      icon: EVENT_CONFIG.prescription.icon,
      color: EVENT_CONFIG.prescription.color,
      metadata: {
        status: rx.status || 'active',
        instructions: rx.instructions || '',
        prescribedBy: rx.prescribedBy || '',
        overrideRationale: rx.overrideRationale || null,
      },
    });
  });

  // ─── Lab Results ───
  (sources.labs || []).forEach(lab => {
    const time = lab.resultedAt?.toMillis?.() || 0;
    const isPanel = lab.panelData && Object.keys(lab.panelData).length > 0;
    events.push({
      id: lab.id,
      patientId,
      type: 'lab',
      title: isPanel ? `${lab.testName} — Panel Completed` : `${lab.testName}: ${lab.result || '—'} ${lab.unit || ''}`,
      description: `Status: ${lab.status}${lab.referenceRange ? ' · Ref: ' + lab.referenceRange : ''}`,
      timestamp: time,
      dateLabel: time ? format(new Date(time), 'MMMM d, yyyy') : '',
      icon: EVENT_CONFIG.lab.icon,
      color: lab.status === 'critical' ? '#DC2626' : lab.status === 'abnormal' ? '#D97706' : EVENT_CONFIG.lab.color,
      metadata: { status: lab.status, panelData: lab.panelData, notes: lab.notes || '', orderedBy: lab.orderedBy || '' },
    });
  });

  // ─── Examinations ───
  (sources.exams || []).forEach(exam => {
    const time = exam.examinedAt?.toMillis?.() || 0;
    events.push({
      id: exam.id,
      patientId,
      type: 'exam',
      title: exam.chiefComplaint || 'Examination',
      description: `Assessment: ${exam.assessment || '—'} · Plan: ${exam.plan || '—'}`,
      timestamp: time,
      dateLabel: time ? format(new Date(time), 'MMMM d, yyyy') : '',
      icon: EVENT_CONFIG.exam.icon,
      color: EVENT_CONFIG.exam.color,
      metadata: {
        hpi: exam.hpi || '',
        pe: exam.pe || '',
        assessment: exam.assessment || '',
        plan: exam.plan || '',
        intervention: exam.intervention || '',
        evaluation: exam.evaluation || '',
        examinedBy: exam.examinedBy || '',
      },
    });
  });

  // ─── Immunizations ───
  (sources.immunizations || []).forEach(vax => {
    const d = vax.dateAdministered || vax.createdAt?.toMillis?.() || 0;
    const time = typeof d === 'number' ? d : new Date(d).getTime();
    events.push({
      id: vax.id,
      patientId,
      type: 'immunization',
      title: `${vax.vaccineName} Administered`,
      description: vax.lotNumber ? `Lot: ${vax.lotNumber}` : '',
      timestamp: time,
      dateLabel: vax.dateAdministered || (time ? format(new Date(time), 'MMMM d, yyyy') : ''),
      icon: EVENT_CONFIG.immunization.icon,
      color: EVENT_CONFIG.immunization.color,
      metadata: {
        lotNumber: vax.lotNumber || '',
        nextDueDate: vax.nextDueDate || '',
        administeredBy: vax.administeredBy || '',
        notes: vax.notes || '',
      },
    });
  });

  // ─── Vitals ───
  (sources.vitals || []).forEach(v => {
    const time = v.recordedAt?.toMillis?.() || 0;
    const readings = [];
    if (v.bp) readings.push(`BP: ${v.bp}`);
    if (v.hr) readings.push(`HR: ${v.hr}`);
    if (v.temp) readings.push(`Temp: ${v.temp}°C`);
    if (v.rr) readings.push(`RR: ${v.rr}`);
    if (v.o2) readings.push(`O₂: ${v.o2}%`);
    if (v.weight) readings.push(`Wt: ${v.weight}kg`);
    events.push({
      id: v.id,
      patientId,
      type: 'vital',
      title: 'Vitals Check',
      description: readings.join(' · '),
      timestamp: time,
      dateLabel: time ? format(new Date(time), 'MMMM d, yyyy') : '',
      icon: EVENT_CONFIG.vital.icon,
      color: EVENT_CONFIG.vital.color,
      metadata: { readings, notes: v.notes || '', recordedBy: v.recordedBy || '' },
    });
  });

  // ─── Orders ───
  (sources.orders || []).forEach(o => {
    const time = o.createdAt?.toMillis?.() || 0;
    events.push({
      id: o.id,
      patientId,
      type: 'order',
      title: `${o.orderType || 'Order'} — ${o.details?.slice(0, 60) || ''}`,
      description: `Priority: ${o.priority || 'routine'} · Status: ${o.status || 'pending'}`,
      timestamp: time,
      dateLabel: time ? format(new Date(time), 'MMMM d, yyyy') : '',
      icon: EVENT_CONFIG.order.icon,
      color: o.priority === 'stat' ? '#DC2626' : o.priority === 'urgent' ? '#D97706' : EVENT_CONFIG.order.color,
      metadata: { orderType: o.orderType, priority: o.priority, details: o.details, status: o.status, orderedBy: o.orderedBy },
    });
  });

  // ─── Appointments ───
  (sources.appointments || []).forEach(a => {
    const time = a.scheduledAt?.toMillis?.() || 0;
    events.push({
      id: a.id,
      patientId,
      type: 'appointment',
      title: `${a.type || 'Appointment'} — ${a.reason || 'No reason'} (${a.status || 'pending'})`,
      description: `Room: ${a.room || '—'} · Doctor: ${a.doctor || '—'} · Duration: ${a.duration || 30}m`,
      timestamp: time,
      dateLabel: time ? format(new Date(time), 'MMMM d, yyyy') : '',
      icon: EVENT_CONFIG.appointment.icon,
      color: a.status === 'cancelled' ? '#6B7280' : a.status === 'completed' ? '#16A34A' : EVENT_CONFIG.appointment.color,
      metadata: { status: a.status, type: a.type, doctor: a.doctor, room: a.room, amount: a.amount },
    });
  });

  // ─── Discharge Plans ───
  (sources.dischargePlans || []).forEach(p => {
    const time = p.createdAt?.toMillis?.() || 0;
    events.push({
      id: p.id,
      patientId,
      type: 'discharge',
      title: `Discharge — ${p.nature || 'Home per Request'}`,
      description: p.condition ? `Condition: ${p.condition}` : '',
      timestamp: time,
      dateLabel: p.date || (time ? format(new Date(time), 'MMMM d, yyyy') : ''),
      icon: EVENT_CONFIG.discharge.icon,
      color: EVENT_CONFIG.discharge.color,
      metadata: { condition: p.condition, nature: p.nature, medication: p.medication, exercise: p.exercise, diet: p.diet, healthTeaching: p.healthTeaching, nextVisit: p.nextVisit },
    });
  });

  // Sort newest first
  events.sort((a, b) => b.timestamp - a.timestamp);

  return events;
}

/**
 * Group events by date label for rendering.
 * @param {PatientEvent[]} events
 * @returns {{ date: string, events: PatientEvent[] }[]}
 */
export function groupEventsByDate(events) {
  const map = {};
  events.forEach(e => {
    const key = e.dateLabel || 'Unknown';
    if (!map[key]) map[key] = [];
    map[key].push(e);
  });
  return Object.entries(map)
    .sort((a, b) => {
      // Parse dates for sorting
      const da = new Date(a[0]);
      const db = new Date(b[0]);
      return db - da;
    })
    .map(([date, evts]) => ({ date, events: evts }));
}