import { Printer } from 'lucide-react';
import { generatePrescriptionPDF, generateLabResultPDF, generateDischargeSummaryPDF } from '../utils/pdfGenerator';
import toast from 'react-hot-toast';

/**
 * Print Button Component
 * Generates and downloads a professional PDF document.
 * Uses direct download (never blocked by browsers).
 */
export default function PrintButton({ type, patient, data, prescriber, label }) {
  if (!type || !data) return null;

  const labelMap = {
    prescription: 'Download Prescription',
    lab:          'Download Lab Result',
    discharge:    'Download Discharge Summary',
  };

  const displayLabel = label || labelMap[type] || 'Download PDF';

  const handleClick = () => {
    try {
      switch (type) {
        case 'prescription':
          if (!patient) { toast.error('Patient data not loaded.'); return; }
          generatePrescriptionPDF(patient, data, prescriber);
          break;
        case 'lab':
          if (!patient) { toast.error('Patient data not loaded.'); return; }
          generateLabResultPDF(patient, data);
          break;
        case 'discharge':
          if (!patient) { toast.error('Patient data not loaded.'); return; }
          generateDischargeSummaryPDF(patient, data);
          break;
        default:
          return;
      }
      toast.success(`${displayLabel} downloaded successfully.`);
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  return (
    <button
      type="button"
      className="btn-secondary"
      onClick={handleClick}
      style={{
        fontSize: '0.78rem',
        padding: '0.4rem 0.8rem',
        minHeight: '36px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
      }}
    >
      <Printer size={14} />
      {displayLabel}
    </button>
  );
}