import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X } from 'lucide-react';

/**
 * QR Code badge for quick patient retrieval.
 * Encodes patient ID for scanning.
 */
export default function QrPatientBadge({ patientId, size = 40 }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      {/* Compact badge */}
      <div
        onClick={() => setShowModal(true)}
        style={{
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 8px',
          borderRadius: 8,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          transition: 'all 0.2s ease',
        }}
        title="Scan to open patient profile"
      >
        <QRCodeSVG value={String(patientId)} size={size} bgColor="transparent" fgColor="var(--color-amber-dark)" />
      </div>

      {/* Full-size modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '2rem',
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 24,
              padding: '2rem',
              textAlign: 'center',
              maxWidth: 320,
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}
              >
                <X size={20} />
              </button>
            </div>
            <QRCodeSVG value={String(patientId)} size={200} bgColor="transparent" fgColor="#5A3C0B" />
            <p style={{ marginTop: '1.5rem', fontWeight: 700, fontSize: '0.9rem', color: '#2C1A06' }}>
              Scan to access patient profile
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#A88A5A' }}>
              ID: {patientId}
            </p>
          </div>
        </div>
      )}
    </>
  );
}