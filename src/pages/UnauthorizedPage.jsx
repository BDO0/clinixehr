import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';

export default function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="page-root">
      <PageHeader title="Access Denied" />
      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div 
          className="pulse-amber"
          style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.1), rgba(196, 139, 40, 0.2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '1.5rem',
            border: '2px solid rgba(235, 193, 118, 0.3)'
          }}
        >
          <ShieldAlert size={40} color="var(--color-danger)" />
        </div>
        
        <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-main)', margin: '0 0 0.5rem', textAlign: 'center' }}>
          Restricted Area
        </h2>
        
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', textAlign: 'center', maxWidth: 300, marginBottom: '2rem', lineHeight: 1.5 }}>
          Your current role does not have permission to view this page. Please contact your administrator if you believe this is an error.
        </p>

        <button 
          className="btn-primary" 
          onClick={() => navigate('/dashboard')}
          style={{ padding: '0.8rem 2rem' }}
        >
          <ArrowLeft size={18} style={{ marginRight: 8 }} /> Return to Dashboard
        </button>
      </div>
    </div>
  );
}
