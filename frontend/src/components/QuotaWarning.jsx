import React, { useState } from 'react';

const QuotaWarning = ({ message, progressPercent = 90 }) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const isCritical = progressPercent >= 100;
  
  return (
    <div style={{
      background: isCritical ? '#fef2f2' : '#fffbeb',
      border: `1px solid ${isCritical ? '#f87171' : '#fbbf24'}`,
      padding: '1rem',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '1.5rem',
      color: isCritical ? '#991b1b' : '#92400e'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '1.25rem' }}>{isCritical ? '🚨' : '⚠️'}</span>
        <div>
          <strong style={{ display: 'block', fontSize: '0.875rem' }}>
            {isCritical ? 'Quota Exceeded' : 'Quota Warning'}
          </strong>
          <span style={{ fontSize: '0.875rem' }}>{message}</span>
        </div>
      </div>
      <button 
        onClick={() => setIsVisible(false)}
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'inherit', opacity: 0.7 }}
      >
        ×
      </button>
    </div>
  );
};

export default QuotaWarning;
