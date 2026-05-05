import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const show = useCallback(({ message, type = 'success', action = null }) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, type, action, id: Date.now() });
    if (type === 'success' || type === 'info') {
      timerRef.current = setTimeout(() => setToast(null), 4000);
    }
  }, []);

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast(null);
  }, []);

  return (
    <ToastContext.Provider value={{ show, dismiss }}>
      {children}
      {toast && <ToastBanner toast={toast} onDismiss={dismiss} />}
    </ToastContext.Provider>
  );
};

const TOAST_CONFIG = {
  success: { bg: '#EAF3DE', border: '#1F6E43', color: '#1F6E43', icon: '✓' },
  info:    { bg: '#E6F1FB', border: '#185FA5', color: '#185FA5', icon: 'ℹ' },
  warning: { bg: '#FFF3DB', border: '#B4670F', color: '#B4670F', icon: '⚠' },
  error:   { bg: '#FDE8E8', border: '#9B2C2C', color: '#9B2C2C', icon: '✕' },
};

const ToastBanner = ({ toast, onDismiss }) => {
  const cfg = TOAST_CONFIG[toast.type] || TOAST_CONFIG.info;
  return (
    <div style={{
      position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, maxWidth: 480, width: 'calc(100% - 40px)',
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      borderRadius: 10, padding: '12px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
      animation: 'slideDown 0.2s ease-out',
    }}>
      <span style={{ fontSize: 16, color: cfg.color, flexShrink: 0, lineHeight: 1 }}>{cfg.icon}</span>
      <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: '#0F172A' }}>{toast.message}</span>
      {toast.action && (
        <button onClick={toast.action.onClick} style={{
          background: 'none', border: `1px solid ${cfg.border}`, borderRadius: 6,
          padding: '4px 10px', fontSize: 12, fontWeight: 700, color: cfg.color,
          cursor: 'pointer', whiteSpace: 'nowrap', minHeight: 'auto', minWidth: 'auto',
        }}>
          {toast.action.label}
        </button>
      )}
      <button onClick={onDismiss} aria-label="Dismiss notification" style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: cfg.color, fontSize: 16, padding: 4, lineHeight: 1,
        minHeight: 'auto', minWidth: 'auto',
      }}>✕</button>
      <style>{`@keyframes slideDown { from { opacity:0; transform:translateX(-50%) translateY(-12px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`}</style>
    </div>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
};

export default ToastProvider;
