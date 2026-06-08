/**
 * PDF Generator Module
 * Generates professional A4-optimized PDF documents for medical records.
 * Uses jsPDF + autoTable for table layouts.
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// ========================
// 🎨 Design System
// ========================
const COLORS = {
  primary: [196, 139, 40],   // Amber Mirage
  success: [22, 163, 74],
  warning: [217, 119, 6],
  danger: [220, 38, 38],
  textLight: [255, 255, 255],
  textMuted: [130, 130, 130],
};

const CLINIC_NAME = 'CLINIX EHR';
const CLINIC_SUBTITLE = 'Electronic Health Record System';
const FOOTER_TEXT = 'This is a computer-generated document.';

// ========================
// 🧾 HEADER
// ========================
function addClinicHeader(doc) {
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(CLINIC_NAME, 14, 20);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.textMuted);
  doc.text(CLINIC_SUBTITLE, 14, 26);

  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.5);
  doc.line(14, 30, 196, 30);
  doc.setDrawColor(0, 0, 0);
}

// ========================
// 👤 PATIENT INFO
// ========================
function addPatientInfo(doc, patient, startY) {
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Patient Information', 14, startY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  const p = patient || {};
  doc.text(`Name: ${p.firstName || ''} ${p.lastName || ''}`, 14, startY + 7);
  doc.text(`DOB: ${p.dateOfBirth || '\u2014'}`, 14, startY + 14);
  doc.text(`Age: ${p.age || '\u2014'}`, 14, startY + 21);
  doc.text(`Gender: ${p.gender || '\u2014'}`, 14, startY + 28);

  return startY + 35;
}

// ========================
// 📄 FOOTER
// ========================
function addFooter(doc) {
  const total = doc.internal.getNumberOfPages();

  for (let i = 1; i <= total; i++) {
    doc.setPage(i);

    doc.setFontSize(7);
    doc.setTextColor(...COLORS.textMuted);
    doc.text(FOOTER_TEXT, 14, 285);
    doc.text(`Page ${i} of ${total}`, 160, 285, { align: 'right' });

    doc.setTextColor(0, 0, 0);
  }
}

// ========================
// 💊 PRESCRIPTION PDF
// ========================
export function generatePrescriptionPDF(patient, rx, prescriber = {}) {
  if (!patient) throw new Error('Patient data is required.');
  if (!rx) throw new Error('Prescription data is required.');

  const doc = new jsPDF('portrait', 'mm', 'a4');
  addClinicHeader(doc);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.primary);
  doc.text('ELECTRONIC PRESCRIPTION', 14, 38);
  doc.setTextColor(0, 0, 0);

  const y = addPatientInfo(doc, patient, 46);

  autoTable(doc, {
    startY: y,
    head: [['Field', 'Details']],
    body: [
      ['Medication', rx?.drug || '\u2014'],
      ['Dosage', rx?.dose || '\u2014'],
      ['Route', rx?.route || '\u2014'],
      ['Frequency', rx?.frequency || '\u2014'],
      ['Duration', rx?.duration ? `${rx.duration} days` : '\u2014'],
      ['Instructions', rx?.instructions || '\u2014'],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.textLight,
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { cellWidth: 140 },
    },
    margin: { left: 14, right: 14 },
  });

  const fy = doc.lastAutoTable?.finalY ?? y + 60;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Prescriber', 14, fy + 15);

  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${rx?.prescribedBy || prescriber.name || '\u2014'}`, 14, fy + 22);
  doc.text(`License No: ${prescriber.license || '\u2014'}`, 14, fy + 29);
  doc.text(
    `Date: ${
      rx?.prescribedAt?.toDate
        ? rx.prescribedAt.toDate().toLocaleDateString()
        : new Date().toLocaleDateString()
    }`,
    14,
    fy + 36
  );

  doc.line(100, fy + 22, 180, fy + 22);
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.textMuted);
  doc.text('Signature', 100, fy + 26);

  addFooter(doc);
  doc.save(`prescription_${Date.now()}.pdf`);
}

// ========================
// 🧪 LAB RESULT PDF
// ========================
export function generateLabResultPDF(patient, labResult) {
  if (!patient) throw new Error('Patient data is required.');
  if (!labResult) throw new Error('Lab result data is required.');

  const doc = new jsPDF('portrait', 'mm', 'a4');
  addClinicHeader(doc);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.primary);
  doc.text('LABORATORY RESULT', 14, 38);
  doc.setTextColor(0, 0, 0);

  const y = addPatientInfo(doc, patient, 46);

  const sc =
    labResult?.status === 'critical'
      ? COLORS.danger
      : labResult?.status === 'abnormal'
      ? COLORS.warning
      : COLORS.success;

  doc.setFillColor(...sc);
  doc.rect(150, 33, 40, 8, 'F');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text((labResult?.status || 'NORMAL').toUpperCase(), 152, 39);
  doc.setTextColor(0, 0, 0);

  const tableData =
    labResult?.panelData && Object.keys(labResult.panelData).length > 0
      ? Object.keys(labResult.panelData).map(k => [
          k,
          labResult.panelData[k] || '\u2014',
        ])
      : [
          ['Test Name', labResult?.testName || '\u2014'],
          ['Result', labResult?.result || '\u2014'],
          ['Unit', labResult?.unit || '\u2014'],
          ['Reference Range', labResult?.referenceRange || '\u2014'],
          ['Status', labResult?.status || '\u2014'],
        ];

  autoTable(doc, {
    startY: y,
    head: [['Field', 'Details']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.textLight,
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  });

  const fy = doc.lastAutoTable?.finalY ?? y + 60;

  doc.setFontSize(9);
  doc.text(`Ordered by: ${labResult?.orderedBy || '\u2014'}`, 14, fy + 12);
  doc.text(
    `Resulted: ${
      labResult?.resultedAt?.toDate
        ? labResult.resultedAt.toDate().toLocaleString()
        : new Date().toLocaleString()
    }`,
    14,
    fy + 19
  );

  addFooter(doc);
  doc.save(`lab_result_${Date.now()}.pdf`);
}

// ========================
// 🏥 DISCHARGE SUMMARY PDF
// ========================
export function generateDischargeSummaryPDF(patient, dischargePlan) {
  if (!patient) throw new Error('Patient data is required.');
  if (!dischargePlan) throw new Error('Discharge plan data is required.');

  const doc = new jsPDF('portrait', 'mm', 'a4');
  addClinicHeader(doc);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.primary);
  doc.text('DISCHARGE SUMMARY', 14, 38);
  doc.setTextColor(0, 0, 0);

  const y = addPatientInfo(doc, patient, 46);

  autoTable(doc, {
    startY: y,
    head: [['Field', 'Details']],
    body: [
      ['Condition', dischargePlan?.condition || '\u2014'],
      ['Date', dischargePlan?.date || '\u2014'],
      ['Nature', dischargePlan?.nature || '\u2014'],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.textLight,
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 130 },
    },
    margin: { left: 14, right: 14 },
  });

  const fy = doc.lastAutoTable?.finalY ?? y + 60;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Discharge Plan', 14, fy + 12);

  let sy = fy + 22;
  const sections = ['medication', 'exercise', 'diet', 'healthTeaching', 'nextVisit'];

  sections.forEach((key, i) => {
    const content = dischargePlan?.[key];
    if (!content) return;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
    doc.text(`${i + 1}. ${label}`, 14, sy);

    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(String(content), 170);

    lines.forEach((line, j) => {
      doc.text(line, 20, sy + 5 + j * 5);
    });

    sy += 10 + lines.length * 5;
  });

  const sigY = Math.max(sy + 12, 230);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Prepared by:', 14, sigY);

  doc.line(14, sigY + 14, 80, sigY + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(dischargePlan?.createdBy || '\u2014', 14, sigY + 19);

  doc.setTextColor(...COLORS.textMuted);
  doc.text('Signature', 14, sigY + 24);

  addFooter(doc);
  doc.save(`discharge_summary_${Date.now()}.pdf`);
}