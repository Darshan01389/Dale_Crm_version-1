import React, { useState, useEffect, useRef } from 'react';

/**
 * DestructiveModal — 3 variants per DaleIQ spec.
 * variant: 'A' (reversible) | 'B' (irreversible, type DELETE) | 'C' (bulk action)
 */
const DestructiveModal = ({
  isOpen,
  onClose,
  onConfirm,
  variant = 'A',
  // Variant A/B
  title = 'Are you sure?',
  body = '',
  confirmLabel = 'Confirm',
  // Variant B
  deletedItems = [],
  // Variant C
  count = 0,
  scope = '',
  showGoodbyeCheckbox = false,
}) => {
  const [typeValue, setTypeValue] = useState('');
  const [goodbyeChecked, setGoodbyeChecked] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTypeValue('');
      setGoodbyeChecked(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    if (isOpen) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const canConfirmB = typeValue === 'DELETE';

  const Overlay = ({ children }) => (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 3000,
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      {children}
    </div>
  );

  /* ── Variant A — Reversible ──────────────────────────── */
  if (variant === 'A') {
    return (
      <Overlay>
        <div className="card" style={{ maxWidth: 440, width: '100%', padding: 32, borderRadius: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 12px', color: 'var(--text)' }}>{title}</h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 8px', lineHeight: 1.6 }}>{body}</p>
          <p style={{ fontSize: 12, color: 'var(--text-micro)', margin: '0 0 28px' }}>You can restore anytime from settings.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button className="btn-secondary" onClick={onClose} style={{ padding: '10px 20px' }}>Cancel</button>
            <button className="btn-primary" onClick={onConfirm} style={{ padding: '10px 20px', background: 'var(--primary)' }}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </Overlay>
    );
  }

  /* ── Variant B — Irreversible (type DELETE) ──────────── */
  if (variant === 'B') {
    return (
      <Overlay>
        <div style={{
          maxWidth: 480, width: '100%', padding: 32, borderRadius: 20,
          background: 'var(--bg-surface)', border: '2px solid #7B2F2F',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 20 }}>⚠</span>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#7B2F2F' }}>{title}</h2>
          </div>
          {deletedItems.length > 0 && (
            <ul style={{ margin: '0 0 16px', paddingLeft: 20, color: 'var(--text)', fontSize: 13, lineHeight: 1.8 }}>
              {deletedItems.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          )}
          <div style={{
            background: '#FFF3DB', border: '1px solid #B4670F',
            borderRadius: 8, padding: '10px 14px', marginBottom: 20,
            fontSize: 13, color: '#7A4A00', fontWeight: 500,
          }}>
            ⚠ This cannot be undone. Consider archiving instead.
          </div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
            Type <strong>DELETE</strong> to confirm
          </label>
          <input
            ref={inputRef}
            className="input"
            value={typeValue}
            onChange={e => setTypeValue(e.target.value)}
            placeholder="DELETE"
            style={{ marginBottom: 20, borderColor: typeValue && !canConfirmB ? '#9B2C2C' : undefined }}
          />
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button className="btn-secondary" onClick={onClose} style={{ padding: '10px 20px' }}>Cancel</button>
            <button
              onClick={onConfirm}
              disabled={!canConfirmB}
              style={{
                padding: '10px 20px', borderRadius: 10, border: 'none',
                background: canConfirmB ? '#7B2F2F' : '#ccc',
                color: 'white', fontWeight: 700, fontSize: 14, cursor: canConfirmB ? 'pointer' : 'not-allowed',
              }}
            >
              {confirmLabel || 'Permanently delete'}
            </button>
          </div>
        </div>
      </Overlay>
    );
  }

  /* ── Variant C — Bulk Action ─────────────────────────── */
  return (
    <Overlay>
      <div className="card" style={{ maxWidth: 460, width: '100%', padding: 32, borderRadius: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 12px', color: 'var(--text)' }}>
          {title || `Move ${count} contacts?`}
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 20px', lineHeight: 1.6 }}>
          {scope || `These ${count} contacts will be archived from your active pipeline. Their conversation history is preserved.`}
        </p>
        {showGoodbyeCheckbox && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, cursor: 'pointer', fontSize: 13 }}>
            <input
              type="checkbox"
              checked={goodbyeChecked}
              onChange={e => setGoodbyeChecked(e.target.checked)}
              style={{ width: 16, height: 16 }}
            />
            Send a final goodbye message ("We'll be here if things change")
          </label>
        )}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose} style={{ padding: '10px 20px' }}>Cancel</button>
          <button className="btn-primary" onClick={() => onConfirm?.(goodbyeChecked)} style={{ padding: '10px 20px' }}>
            {confirmLabel || `Move all ${count}`}
          </button>
        </div>
      </div>
    </Overlay>
  );
};

export default DestructiveModal;
