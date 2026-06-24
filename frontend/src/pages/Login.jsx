import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import FluidBackground from '../components/FluidBackground';

import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
  const navigate = useNavigate();
  const { updateProfile } = useUser();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFluid, setShowFluid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  React.useEffect(() => {
    // Secretly wake up the AI models so they are ready by the time the user logs in
    fetch('/api/system/prewarm').catch(() => {});
    
    // Defer the fluid background rendering so the form appears instantly
    const timer = setTimeout(() => setShowFluid(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });

      let data;
      const ct = response.headers.get('content-type');
      if (ct && ct.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || `Server error (${response.status})`);
      }

      if (!response.ok) throw new Error(data.detail || 'Google Login failed');

      // Store tokens
      sessionStorage.setItem('voiceiq_token', data.access_token);
      sessionStorage.setItem('voiceiq_refresh_token', data.refresh_token);
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

      if (!response.ok) {
        if (data.detail === "PENDING_APPROVAL") {
          throw new Error("Your account is still pending admin approval. Please wait for 30 minutes or contact the owner.");
        } else if (data.detail === "EXPIRED_PENDING") {
          throw new Error("Your admin approval request expired (1 hour limit). You have been downgraded to Sales Rep. Please login again to continue.");
        } else if (data.detail === "REJECTED_APPROVAL") {
          throw new Error("Due to insufficient information, your role as admin is not approved. For future changes contact supportaicrm@gmail.com");
        }
        throw new Error(data.detail || 'Login failed');
      }

      // Store tokens
      sessionStorage.setItem('voiceiq_token', data.access_token);
      sessionStorage.setItem('voiceiq_refresh_token', data.refresh_token);
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
      overflowY: 'auto',
      padding: '16px 0',
    }}>
      {showFluid && <FluidBackground />}

      {/* Decorative Blur Orbs */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none', opacity: 0.5 }} />

      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 390, padding: '8px 16px' }} className="animate-in">
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 40, height: 40, borderRadius: 12,
            background: 'var(--primary)', marginBottom: 8,
            boxShadow: '0 6px 18px var(--primary-glow)',
            transform: 'rotate(-4deg)'
          }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
              <path d="M12 2L3 7v10l9 5 9-5V7L12 2z" fill="white" opacity="0.95"/>
              <path d="M12 2v20M3 7l9 5 9-5" stroke="white" strokeWidth="1.5" opacity="0.4"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text)', margin: 0, letterSpacing: '-0.04em' }}>
            DaleIQ
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0', fontWeight: 500 }}>
            The Operating System for Modern Sales
          </p>
        </div>

        <div className="card glass" style={{ padding: '20px 22px', borderRadius: 16 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px' }}>
            Welcome back
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
            Enter your credentials to access your dashboard
          </p>

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)',
              borderRadius: 8, padding: '8px 12px', marginBottom: 12,
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 12, color: '#EF4444', fontWeight: 500
            }}>
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-5a.75.75 0 001.5 0v-4a.75.75 0 00-1.5 0v4zm.75-7.25a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 10.5, fontWeight: 750, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="you@company.com"
                className="input"
                style={{ height: 40, padding: '8px 12px', fontSize: 13 }}
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <label style={{ fontSize: 10.5, fontWeight: 750, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Password
                </label>
                <Link to="/forgot-password" style={{ fontSize: 10.5, color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
                  Forgot?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  className="input"
                  style={{ height: 40, padding: '8px 40px 8px 12px', fontSize: 13, width: '100%' }}
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ 
                width: '100%', 
                height: 42,
                marginTop: 4,
                borderRadius: '8px',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                <div className="spinner" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                  Sign In to DaleIQ
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                  </svg>
                </div>
              )}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)', opacity: 0.4 }}/>
            <span style={{ fontSize: 10, color: 'var(--text-micro)', fontWeight: 600 }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)', opacity: 0.4 }}/>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google login failed')}
              useOneTap
              theme="filled_blue"
              shape="rectangular"
              text="continue_with"
            />
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 16, fontWeight: 500 }}>
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
