import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import FluidBackground from '../components/FluidBackground';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const performVerification = async () => {
      if (!token) {
        setStatus('error');
        setErrorMsg('Verification token is missing from URL.');
        return;
      }

      try {
        await axios.post('/api/auth/verify-email', { token });
        setStatus('success');
        // Auto-redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (err) {
        console.error(err);
        setStatus('error');
        setErrorMsg(err.response?.data?.detail || 'Verification failed. The token may have expired or is invalid.');
      }
    };

    performVerification();
  }, [token, navigate]);

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
          {status === 'verifying' && (
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
                Please wait while we verify your credentials.
              </p>
            </>
          )}

          {status === 'success' && (
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

          {status === 'error' && (
            <>
              <div style={{ fontSize: 48, marginBottom: 20 }}>❌</div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Verification Failed</h2>
              <p style={{ fontSize: 14, color: 'var(--danger)', lineHeight: 1.6, marginBottom: 24 }}>
                {errorMsg}
              </p>
              <Link to="/login" className="btn-secondary" style={{ width: '100%', textDecoration: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                Back to Login
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
