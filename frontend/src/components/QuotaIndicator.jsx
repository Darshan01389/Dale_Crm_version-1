import React from 'react';

/**
 * QuotaIndicator — inline usage meter per DaleIQ spec.
 * Props: label, current, total, resetDate
 */
const QuotaIndicator = ({ label, current, total, resetDate }) => {
  const pct = Math.min(100, Math.round((current / total) * 100));
  const barColor =
    pct < 50  ? '#185FA5' :
    pct < 80  ? '#B4670F' :
                '#9B2C2C';
  const bgColor =
    pct < 50  ? '#E6F1FB' :
    pct < 80  ? '#FFF3DB' :
                '#FDE8E8';

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{label}</span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
          {current.toLocaleString()} / {total.toLocaleString()} · {pct}% used
        </span>
      </div>
      <div style={{ height: 4, background: 'var(--bg-subtle)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%', borderRadius: 4,
          background: barColor,
          transition: 'width 0.4s ease',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, alignItems: 'center' }}>
        {resetDate && (
          <span style={{ fontSize: 11, color: 'var(--text-micro)' }}>Resets {resetDate}</span>
        )}
        {pct >= 80 && (
          <a href="/billing" style={{ fontSize: 11, color: barColor, fontWeight: 700, textDecoration: 'none', marginLeft: 'auto' }}>
            Upgrade plan →
          </a>
        )}
      </div>
    </div>
  );
};

export default QuotaIndicator;
