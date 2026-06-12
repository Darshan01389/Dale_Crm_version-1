import React, { useState, useEffect } from 'react';

const NetworkErrorBoundary = ({ children }) => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOffline) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--border-color)', margin: '2rem' }}>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>No Internet Connection</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          It looks like you are offline. Please check your network connection and try again.
        </p>
        <button 
          onClick={() => window.location.reload()}
          style={{ background: 'var(--primary-color)', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '500' }}
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return children;
};

export default NetworkErrorBoundary;
