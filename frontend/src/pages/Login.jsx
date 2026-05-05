import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import FluidBackground from '../components/FluidBackground';

const Login = () => {
  const navigate = useNavigate();
  const { updateProfile } = useUser();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGoogleLogin = () => {
    setLoading(true);
    // Mock successful Google login
    setTimeout(() => {
      localStorage.setItem('voiceiq_token', 'mock_google_token');
      localStorage.setItem('voiceiq_profile', JSON.stringify({
        name: 'Darshan Singh',
        email: 'darshan@example.com',
        role: 'Sales Rep',
        initials: 'DS'
      }));
      setLoading(false);
      navigate('/');
    }, 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      let data;
      const ct = response.headers.get('content-type');
      if (ct && ct.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || `Server error (${response.status})`);
      }

      if (!response.ok) throw new Error(data.detail || 'Login failed');

      // Store tokens
      localStorage.setItem('voiceiq_token', data.access_token);
      localStorage.setItem('voiceiq_refresh_token', data.refresh_token);

      // Fetch user profile info
      const profileResponse = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${data.access_token}`
        }
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        updateProfile({
          name: profileData.name,
          email: profileData.email,
          role: profileData.role || 'Sales Rep'
        });
      }

      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <FluidBackground />

      {/* Decorative Blur Orbs */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none', opacity: 0.5 }} />

      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 440, padding: '24px 20px' }} className="animate-in">
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 64, height: 64, borderRadius: 18,
            background: 'var(--primary)', marginBottom: 20,
            boxShadow: '0 8px 24px var(--primary-glow)',
            transform: 'rotate(-4deg)'
          }}>
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
              <path d="M12 2L3 7v10l9 5 9-5V7L12 2z" fill="white" opacity="0.9"/>
              <path d="M12 2v20M3 7l9 5 9-5" stroke="white" strokeWidth="1.5" opacity="0.4"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.04em' }}>
            DaleIQ
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-muted)', margin: '8px 0 0', fontWeight: 500 }}>
            The Operating System for Modern Sales
          </p>
        </div>

        <div className="card glass" style={{ padding: 40, borderRadius: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>
            Welcome back
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 28 }}>
            Enter your credentials to access your dashboard
          </p>

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: 12, padding: '12px 16px', marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 10,
              fontSize: 14, color: '#EF4444', fontWeight: 500
            }}>
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-5a.75.75 0 001.5 0v-4a.75.75 0 00-1.5 0v4zm.75-7.25a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="you@company.com"
                className="input"
                style={{ height: 48 }}
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Password
                </label>
                <Link to="/forgot-password" style={{ fontSize: 12, color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
                  Forgot?
                </Link>
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                className="input"
                style={{ height: 48 }}
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ 
                width: '100%', 
                height: 52,
                marginTop: 8,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                <div className="spinner" style={{ width: 20, height: 20, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  Sign In to DaleIQ
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                  </svg>
                </div>
              )}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '24px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)', opacity: 0.5 }}/>
            <span style={{ fontSize: 12, color: 'var(--text-micro)', fontWeight: 600 }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)', opacity: 0.5 }}/>
          </div>

          <button
            type="button"
            className="btn-secondary"
            onClick={handleGoogleLogin}
            style={{ width: '100%', height: 50, gap: 12 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)', marginTop: 32, fontWeight: 500 }}>
          New to DaleIQ?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>
            Request Access
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Login;
