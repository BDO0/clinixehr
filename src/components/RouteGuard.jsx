import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

/**
 * Wraps a route, redirecting unauthenticated users to /login.
 * Optionally restricts to specific roles.
 * @param {string[]} [roles] - allowed roles; if omitted, any authenticated user passes
 */
export default function RouteGuard({ children, roles }) {
  const { user, profile, loading } = useAuthStore();

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-cream)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            className="pulse-amber"
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #C48B28, #EBC176)',
              margin: '0 auto 16px',
            }}
          />
          <p style={{ color: 'var(--color-text-sub)', fontWeight: 600, fontSize: '0.9rem' }}>
            Authenticating…
          </p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (roles && profile && !roles.includes(profile.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
