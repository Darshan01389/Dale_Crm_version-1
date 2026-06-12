import React from 'react';

/**
 * EmptyState — 3 variants per DaleIQ spec.
 * variant: 'A' (Inbox/Today) | 'B' (Pipeline) | 'C' (Pulse)
 */
const EmptyState = ({
  variant = 'A',
  headline,
  subhead,
  ctaLabel,
  onCta,
  secondaryLabel,
  onSecondary,
}) => {
  /* ── Variant A — Inbox / Today ───────────────────────── */
  if (variant === 'A') {
    return (
      <div style={{ textAlign: 'center', padding: '60px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 80, height: 60, borderRadius: 16,
          background: 'var(--bg-subtle)', border: '2px dashed var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, marginBottom: 8,
        }}>📭</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
          {headline || 'Your inbox is empty'}
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0, maxWidth: 320, lineHeight: 1.6 }}>
          {subhead || 'New messages from WhatsApp, SMS, and Email will appear here.'}
        </p>
        {onCta && (
          <button className="btn-primary" onClick={onCta} style={{ marginTop: 8, padding: '12px 28px', borderRadius: 10 }}>
            {ctaLabel || 'Connect channels'}
          </button>
        )}
        {onSecondary && (
          <button onClick={onSecondary} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--primary)', fontSize: 13, fontWeight: 600,
            textDecoration: 'underline', minHeight: 'auto',
          }}>
            {secondaryLabel || 'Learn more'}
          </button>
        )}
      </div>
    );
  }

  /* ── Variant B — Pipeline ────────────────────────────── */
  if (variant === 'B') {
    return (
      <div style={{ textAlign: 'center', padding: '60px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 80, height: 60, borderRadius: 12,
          border: '2px dashed var(--border)', background: 'var(--bg-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, marginBottom: 8,
        }}>📋</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
          {headline || 'No deals in your pipeline'}
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0, maxWidth: 340, lineHeight: 1.6 }}>
          {subhead || 'Create a deal to track it through stages and forecast revenue.'}
        </p>
        {onCta && (
          <button className="btn-primary" onClick={onCta} style={{ marginTop: 8, padding: '12px 28px', borderRadius: 10 }}>
            {ctaLabel || 'Create a deal'}
          </button>
        )}
        {onSecondary && (
          <button onClick={onSecondary} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--primary)', fontSize: 13, fontWeight: 600,
            textDecoration: 'underline', minHeight: 'auto',
          }}>
            {secondaryLabel || 'Watch a 60-sec demo →'}
          </button>
        )}
      </div>
    );
  }

  /* ── Variant C — Pulse (greyed sample KPIs) ──────────── */
  return (
    <div style={{ textAlign: 'center', padding: '40px 24px' }}>
      {/* Greyed sample KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, maxWidth: 480, margin: '0 auto 40px', opacity: 0.25 }}>
        {['Revenue', 'Win Rate', 'Pipeline', 'AI Forecast'].map(k => (
          <div key={k} className="card" style={{ padding: 20, textAlign: 'left' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: 8 }}>
              {k.toUpperCase()} — SAMPLE
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)' }}>—</div>
          </div>
        ))}
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>
        {headline || "Your team isn't active yet"}
      </h2>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 20px', lineHeight: 1.6, maxWidth: 360, marginLeft: 'auto', marginRight: 'auto' }}>
        {subhead || 'Once your reps log their first calls and messages, your pulse comes alive.'}
      </p>
      {onCta && (
        <button className="btn-primary" onClick={onCta} style={{ padding: '12px 28px', borderRadius: 10 }}>
          {ctaLabel || 'Invite your team'}
        </button>
      )}
      {onSecondary && (
        <button onClick={onSecondary} style={{
          display: 'block', margin: '12px auto 0', background: 'none', border: 'none',
          cursor: 'pointer', color: 'var(--primary)', fontSize: 13, fontWeight: 600,
          textDecoration: 'underline', minHeight: 'auto',
        }}>
          {secondaryLabel || 'View sample data →'}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
