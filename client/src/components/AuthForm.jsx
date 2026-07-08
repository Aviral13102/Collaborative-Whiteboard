import { useState } from 'react';
import { login, register } from '../utils/api';

const styles = {
  wrapper: {
    position: 'relative',
    width: '100%',
    maxWidth: '420px',
    margin: '0 auto',
    animation: 'scaleIn 0.5s ease-out',
  },
  card: {
    position: 'relative',
    padding: '40px 36px',
    background: 'rgba(13, 19, 38, 0.8)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '24px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
    zIndex: 2,
  },
  brand: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  brandName: {
    fontSize: '32px',
    fontWeight: 800,
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #22d3ee 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    letterSpacing: '-0.02em',
  },
  brandSubtitle: {
    fontSize: '14px',
    color: '#94a3b8',
    marginTop: '6px',
  },
  tabs: {
    display: 'flex',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '12px',
    padding: '4px',
    marginBottom: '28px',
    border: '1px solid rgba(255, 255, 255, 0.06)',
  },
  tab: {
    flex: 1,
    padding: '10px',
    textAlign: 'center',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#94a3b8',
    cursor: 'pointer',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    border: 'none',
    background: 'none',
  },
  tabActive: {
    background: 'rgba(99, 102, 241, 0.15)',
    color: '#f1f5f9',
    boxShadow: '0 0 12px rgba(99, 102, 241, 0.15)',
  },
  formGroup: {
    marginBottom: '18px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    color: '#94a3b8',
    marginBottom: '6px',
    letterSpacing: '0.02em',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '12px',
    color: '#f1f5f9',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    backdropFilter: 'blur(8px)',
  },
  submitBtn: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 2px 10px rgba(99, 102, 241, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    marginTop: '24px',
  },
  error: {
    padding: '12px 16px',
    background: 'rgba(248, 113, 113, 0.08)',
    border: '1px solid rgba(248, 113, 113, 0.2)',
    borderRadius: '10px',
    color: '#f87171',
    fontSize: '13px',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  success: {
    padding: '12px 16px',
    background: 'rgba(52, 211, 153, 0.08)',
    border: '1px solid rgba(52, 211, 153, 0.2)',
    borderRadius: '10px',
    color: '#34d399',
    fontSize: '13px',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  decorCircle1: {
    position: 'absolute',
    width: '200px',
    height: '200px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08), transparent 70%)',
    top: '-60px',
    right: '-60px',
    pointerEvents: 'none',
    zIndex: 1,
  },
  decorCircle2: {
    position: 'absolute',
    width: '160px',
    height: '160px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(34, 211, 238, 0.06), transparent 70%)',
    bottom: '-40px',
    left: '-40px',
    pointerEvents: 'none',
    zIndex: 1,
  },
};

export default function AuthForm({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [shakeError, setShakeError] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      let res;
      if (mode === 'register') {
        res = await register(formData);
        setSuccess('Account created! Logging you in...');
        // Auto-login after registration
        setTimeout(async () => {
          try {
            const loginRes = await login({ email: formData.email, password: formData.password });
            const { token, user } = loginRes.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            if (onAuth) onAuth(user);
          } catch {
            setMode('login');
            setSuccess('');
            setError('Registered but auto-login failed. Please log in.');
          }
          setLoading(false);
        }, 800);
        return;
      } else {
        res = await login(formData);
      }

      const { token, user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setSuccess('Welcome back!');
      setTimeout(() => {
        if (onAuth) onAuth(user);
      }, 400);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Something went wrong';
      setError(msg);
      setShakeError(true);
      setTimeout(() => setShakeError(false), 500);
    } finally {
      if (mode === 'login') setLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccess('');
  };

  const getInputStyle = (fieldName) => ({
    ...styles.input,
    borderColor: focusedField === fieldName ? '#6366f1' : 'rgba(255, 255, 255, 0.06)',
    boxShadow: focusedField === fieldName
      ? '0 0 0 3px rgba(99, 102, 241, 0.15), 0 0 20px rgba(99, 102, 241, 0.15)'
      : 'none',
  });

  return (
    <div style={styles.wrapper}>
      {/* Decorative elements */}
      <div style={styles.decorCircle1} />
      <div style={styles.decorCircle2} />

      <div style={styles.card}>
        {/* Brand */}
        <div style={styles.brand}>
          <div style={styles.brandName}>Whiteboard</div>
          <div style={styles.brandSubtitle}>Collaborate in real-time</div>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          <button
            type="button"
            style={{ ...styles.tab, ...(mode === 'login' ? styles.tabActive : {}) }}
            onClick={() => switchMode('login')}
          >
            Sign In
          </button>
          <button
            type="button"
            style={{ ...styles.tab, ...(mode === 'register' ? styles.tabActive : {}) }}
            onClick={() => switchMode('register')}
          >
            Create Account
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div style={styles.error} className={shakeError ? 'animate-shake' : ''}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="#f87171" strokeWidth="1.5" />
              <path d="M8 4.5v4" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="8" cy="11" r="0.75" fill="#f87171" />
            </svg>
            {error}
          </div>
        )}
        {success && (
          <div style={styles.success}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="#34d399" strokeWidth="1.5" />
              <path d="M5 8l2 2 4-4" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Username</label>
              <input
                type="text"
                name="username"
                placeholder="Choose a username"
                value={formData.username}
                onChange={handleChange}
                onFocus={() => setFocusedField('username')}
                onBlur={() => setFocusedField(null)}
                style={getInputStyle('username')}
                required
                autoComplete="username"
              />
            </div>
          )}

          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              style={getInputStyle('email')}
              required
              autoComplete="email"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              style={getInputStyle('password')}
              required
              minLength={6}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitBtn,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'wait' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.boxShadow = '0 4px 24px rgba(99, 102, 241, 0.35)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 10px rgba(99, 102, 241, 0.15)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {loading && <span className="spinner spinner-sm" />}
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
