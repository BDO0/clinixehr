import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';

/**
 * Sticky gradient page header with optional back button and actions slot.
 */
export default function PageHeader({
  title,
  subtitle,
  backTo,
  actions,
  liveIndicator = false,
}) {
  const navigate = useNavigate();
  const { theme, startBlinkToggle } = useThemeStore();

  return (
    <div className="page-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {backTo && (
          <button
            className="btn-icon"
            onClick={() => navigate(backTo)}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white' }}
          >
            <ChevronLeft size={20} />
          </button>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <h1
              className="gradient-text font-display"
              style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {title}
            </h1>
            {liveIndicator && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span className="live-dot" />
                <span style={{ fontSize: '0.7rem', color: '#86EFAC', fontWeight: 600 }}>LIVE</span>
              </div>
            )}
          </div>
          {subtitle && (
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>
              {subtitle}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {actions}
          <button 
            className="btn-icon" 
            onClick={startBlinkToggle} 
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white' }}
            title="Toggle Dark Mode"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}
