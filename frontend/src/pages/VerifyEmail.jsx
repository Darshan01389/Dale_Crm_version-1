import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import FluidBackground from '../components/FluidBackground';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'verifying' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  const handleVerify = async (e) => {
    e.preventDefault();
    setStatus('verifying');
    setErrorMsg('');

    try {
      await axios.post('/api/auth/verify-email', { email, code });
      setStatus('success');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err.response?.data?.detail || 'Verification failed. The code may have expired or is invalid.');
    }
  };

  const handleResend = async () => {
    if (!email) {
      setErrorMsg('Please enter your email first to resend the code.');
      return;
    }
    try {
      await axios.post('/api/auth/resend-verification', { email });
      alert('A new 6-digit code has been sent to your email.');
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to resend code.');
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

      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 440, padding: '24px 20px' }} className="animate-in">
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
           <h1 style={{ fontSize: 36, fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.04em' }}>
            DaleIQ
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-muted)', margin: '8px 0 0', fontWeight: 500 }}>
            Account Email Verification
          </p>
        </div>

        <div className="card glass" style={{ padding: 40, borderRadius: 24, textAlign: 'center' }}>
          {status === 'idle' || status === 'error' ? (
            <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'left' }}>
              {status === 'error' && (
                <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '10px 14px', borderRadius: 8, fontSize: 14 }}>
                  {errorMsg}
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="you@company.com"
                  className="input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="123456"
                  className="input"
                  maxLength={6}
                  style={{ fontSize: 24, letterSpacing: '8px', textAlign: 'center', height: 60 }}
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <button type="submit" className="btn-primary" style={{ height: 48, marginTop: 10 }}>
                Verify Account
              </button>
              
              <div style={{ textAlign: 'center', marginTop: 10 }}>
                <button type="button" onClick={handleResend} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                  Resend Code
                </button>
              </div>
              <div style={{ textAlign: 'center', marginTop: 10 }}>
                 <Link to="/login" style={{ color: 'var(--text-muted)', fontSize: 14, textDecoration: 'none' }}>Back to Login</Link>
              </div>
            </form>
          ) : status === 'verifying' ? (
            <>
              <div className="spinner" style={{ 
                width: 40, height: 40, 
                border: '3px solid rgba(255,255,255,0.1)', 
                borderTopColor: 'var(--primary)', 
                borderRadius: '50%', 
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 20px'
              }} />
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Verifying Email...</h2>
              <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                Please wait while we check your code.
              </p>
            </>
          ) : (
            <>
              <div style={{ fontSize: 48, marginBottom: 20 }}>🎉</div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Email Verified!</h2>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 24 }}>
                Your email has been verified successfully. Redirecting you to login page...
              </p>
              <Link to="/login" className="btn-primary" style={{ width: '100%', textDecoration: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                Proceed to Login
              </Link>
            </>
          )}
        </div>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default VerifyEmail;
