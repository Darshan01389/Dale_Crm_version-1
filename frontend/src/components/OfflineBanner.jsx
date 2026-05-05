import React, { useState, useEffect } from 'react';

/**
 * OfflineBanner — amber sticky banner when browser goes offline.
 * Auto-dismisses on reconnect.
 */
const OfflineBanner = () => {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline  = () => setOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online',  goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online',  goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div role="alert" aria-live="polite" style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      zIndex: 10000,
      background: '#FFF3DB',
      borderBottom: '1px solid #B4670F',
      padding: '10px 20px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 12,
    }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#7A4A00' }}>
        ⚠ You're offline — messages will queue and send when connection returns
      </span>
      <button
        onClick={() => window.location.reload()}
        aria-label="Retry connection"
        style={{
          background: '#B4670F', color: 'white', border: 'none',
          borderRadius: 6, padding: '6px 14px',
          fontSize: 12, fontWeight: 700, cursor: 'pointer',
          minHeight: 'auto', minWidth: 'auto',
        }}
      >
        RETRY
      </button>
    </div>
  );
};

export default OfflineBanner;
