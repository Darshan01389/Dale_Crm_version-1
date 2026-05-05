import React, { useState, useEffect } from 'react';

/**
 * LoadingSkeleton — shimmer placeholder matching loaded content shape.
 * Props:
 *   variant: 'card' | 'row' | 'text'
 *   lines: number (default 3)
 */
const LoadingSkeleton = ({ variant = 'text', lines = 3 }) => {
  const [showStillLoading, setShowStillLoading] = useState(false);
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const t = setTimeout(() => setShowStillLoading(true), 3000);
    return () => clearTimeout(t);
  }, []);

  const shimmerStyle = {
    background: prefersReduced
      ? '#E8ECF1'
      : 'linear-gradient(90deg, #E8ECF1 25%, #D0D7E3 50%, #E8ECF1 75%)',
    backgroundSize: '200% 100%',
    animation: prefersReduced ? 'none' : 'skeletonShimmer 2s ease-in-out infinite',
    borderRadius: 6,
  };

  const darkShimmer = `
    .dark .skeleton-bar {
      background: linear-gradient(90deg, #2A2E36 25%, #353B47 50%, #2A2E36 75%) !important;
    }
  `;

  if (variant === 'card') {
    return (
      <div style={{ padding: 24, borderRadius: 16, border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
        <style>{`@keyframes skeletonShimmer { 0%,100% { background-position: 200% 0; } 50% { background-position: -200% 0; } } ${darkShimmer}`}</style>
        <div className="skeleton-bar" style={{ ...shimmerStyle, height: 16, width: '40%', marginBottom: 16 }} />
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="skeleton-bar" style={{ ...shimmerStyle, height: 12, width: i === lines - 1 ? '60%' : '100%', marginBottom: 10 }} />
        ))}
        {showStillLoading && <p style={{ fontSize: 12, color: '#777', marginTop: 12, textAlign: 'center' }}>Still loading…</p>}
      </div>
    );
  }

  if (variant === 'row') {
    return (
      <div>
        <style>{`@keyframes skeletonShimmer { 0%,100% { background-position: 200% 0; } 50% { background-position: -200% 0; } } ${darkShimmer}`}</style>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="skeleton-bar" style={{ ...shimmerStyle, width: 44, height: 44, borderRadius: '50%', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton-bar" style={{ ...shimmerStyle, height: 13, width: '55%', marginBottom: 8 }} />
              <div className="skeleton-bar" style={{ ...shimmerStyle, height: 11, width: '80%' }} />
            </div>
            <div className="skeleton-bar" style={{ ...shimmerStyle, height: 20, width: 60, borderRadius: 4 }} />
          </div>
        ))}
        {showStillLoading && <p style={{ fontSize: 12, color: '#777', marginTop: 8, textAlign: 'center' }}>Still loading…</p>}
      </div>
    );
  }

  // text (default)
  return (
    <div>
      <style>{`@keyframes skeletonShimmer { 0%,100% { background-position: 200% 0; } 50% { background-position: -200% 0; } } ${darkShimmer}`}</style>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton-bar" style={{ ...shimmerStyle, height: 12, width: i === lines - 1 ? '65%' : `${80 + Math.random() * 20}%`, marginBottom: 10 }} />
      ))}
      {showStillLoading && <p style={{ fontSize: 12, color: '#777', marginTop: 8 }}>Still loading…</p>}
    </div>
  );
};

export default LoadingSkeleton;
