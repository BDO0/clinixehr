import { useState } from 'react';
import { signInWithEmailAndPassword, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { auth, db } from '../firebase';
import { useAuthStore } from '../store/authStore';
import { Eye, EyeOff, Stethoscope, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const navigate    = useNavigate();
  const setProfile  = useAuthStore((s) => s.setProfile);

  async function handleLogin(e) {
    e.preventDefault();
    if (!email || !password) { toast.error('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      // Allow independent sessions per tab
      await setPersistence(auth, browserSessionPersistence);

      const cred = await signInWithEmailAndPassword(auth, email, password);
      const snap = await getDoc(doc(db, 'staff', cred.user.uid));
      if (snap.exists()) setProfile({ uid: cred.user.uid, ...snap.data() });
      toast.success('Welcome back!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg =
        err.code === 'auth/invalid-credential' ? 'Invalid email or password.' :
        err.code === 'auth/too-many-requests'   ? 'Too many attempts. Try again later.' :
        'Login failed. Check your connection.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'linear-gradient(160deg, var(--color-amber-dark) 0%, #3D2408 50%, #1A0F03 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      {/* Logo Block */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div
          style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-amber-light), var(--color-amber))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: '0 8px 32px rgba(196,139,40,0.5)',
          }}
        >
          <Stethoscope size={38} color="white" strokeWidth={1.8} />
        </div>
        <h1 className="font-display gradient-text" style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>
          ClinixEHR
        </h1>
        <p style={{ color: 'rgba(235,193,118,0.7)', fontSize: '0.85rem', marginTop: 6, fontWeight: 500 }}>
          Internal Clinical Management System
        </p>
      </div>

      {/* Login Card */}
      <div
        style={{
          background: 'rgba(255,245,225,0.06)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(235,193,118,0.25)',
          borderRadius: 'var(--radius-xl)',
          padding: '2rem 1.5rem',
          width: '100%', maxWidth: 420,
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}
      >
        <h2 style={{ color: 'white', fontWeight: 700, fontSize: '1.15rem', margin: '0 0 1.5rem' }}>
          Staff Sign In
        </h2>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Email */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="input-label" style={{ color: 'rgba(235,193,118,0.8)' }}>Email Address</label>
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'rgba(255,255,255,0.08)',
                border: '1.5px solid rgba(235,193,118,0.25)',
                borderRadius: 'var(--radius-sm)',
                padding: '0 1rem',
              }}
            >
              <Mail size={18} color="rgba(235,193,118,0.6)" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@clinic.com"
                style={{
                  flex: 1, minWidth: 0, border: 'none', outline: 'none',
                  background: 'none', color: 'white',
                  fontSize: '0.95rem', padding: '0.85rem 0',
                  fontFamily: 'inherit', minHeight: 52,
                }}
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="input-label" style={{ color: 'rgba(235,193,118,0.8)' }}>Password</label>
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'rgba(255,255,255,0.08)',
                border: '1.5px solid rgba(235,193,118,0.25)',
                borderRadius: 'var(--radius-sm)',
                padding: '0 1rem',
              }}
            >
              <Lock size={18} color="rgba(235,193,118,0.6)" />
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  flex: 1, minWidth: 0, border: 'none', outline: 'none',
                  background: 'none', color: 'white',
                  fontSize: '0.95rem', padding: '0.85rem 0',
                  fontFamily: 'inherit', minHeight: 52,
                }}
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowPw(!showPw)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(235,193,118,0.6)', display: 'flex', padding: 0, flexShrink: 0 }}>
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', marginTop: 8, minHeight: 52, fontSize: '1rem' }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem', textAlign: 'center', marginTop: '1.5rem', lineHeight: 1.5 }}>
          Access restricted to authorized clinical staff only.<br />Contact your administrator for access.
        </p>
      </div>
    </div>
  );
}
