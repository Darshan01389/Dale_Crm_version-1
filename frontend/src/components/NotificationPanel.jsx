import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MOCK_NOTIFS = [
  { id: '1', type: 'mention', user: 'Ravi Kumar', text: 'mentioned you in a note on Sarah Jenkins', time: '2m ago', severity: 'info', read: false },
  { id: '2', type: 'alert', user: 'AI Assistant', text: 'Lead "Michael Chen" is at risk — no contact in 12 days', time: '1h ago', severity: 'warning', read: false },
  { id: '3', type: 'alert', user: 'System', text: 'New lead "Priya Patel" assigned to you', time: '3h ago', severity: 'success', read: true },
  { id: '4', type: 'alert', user: 'Billing', text: 'AI Credit quota reached 90%', time: '1d ago', severity: 'critical', read: true },
];

const SEVERITY_COLORS = {
  info: 'var(--primary)',
  warning: 'var(--owner-accent)',
  success: 'var(--success)',
  critical: 'var(--danger)',
};

const NotificationPanel = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');

  const filteredNotifs = MOCK_NOTIFS.filter(n => {
    if (filter === 'Mentions') return n.type === 'mention';
    if (filter === 'Alerts') return n.type === 'alert';
    return true;
  });

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 3000,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex', justifyContent: 'flex-end'
    }} onClick={onClose}>
      <div style={{
        width: '100%', maxWidth: 400, background: 'var(--bg-surface)', 
        height: '100%', boxShadow: '-8px 0 32px rgba(0,0,0,0.15)',
        display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.3s ease'
      }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 className="text-h2" style={{ margin: 0 }}>Notifications</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 28, color: 'var(--text-muted)', cursor: 'pointer', lineHeight: 1 }}>×</button>
          </div>
          
          <div style={{ display: 'flex', gap: 10 }}>
            {['All', 'Mentions', 'Alerts'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700,
                  border: '1px solid var(--border)', cursor: 'pointer',
                  background: filter === f ? 'var(--primary)' : 'transparent',
                  color: filter === f ? 'white' : 'var(--text-muted)',
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scroll">
          {filteredNotifs.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              No notifications yet.
            </div>
          ) : (
            filteredNotifs.map(n => (
              <div
                key={n.id}
                style={{
                  padding: '24px 20px', borderBottom: '1px solid var(--border-subtle)',
                  background: n.read ? 'transparent' : 'var(--bg-subtle)',
                  display: 'flex', gap: 16, cursor: 'pointer',
                  position: 'relative'
                }}
                onClick={() => { navigate('/inbox'); onClose(); }}
              >
                {!n.read && (
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: SEVERITY_COLORS[n.severity] }} />
                )}
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', background: SEVERITY_COLORS[n.severity] + '15',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0,
                  color: SEVERITY_COLORS[n.severity]
                }}>
                  {n.type === 'mention' ? '@' : n.severity === 'critical' ? '⚠' : '⚡'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6, marginBottom: 6 }}>
                    <span style={{ fontWeight: 800 }}>{n.user}</span> {n.text}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.02em' }}>{n.time}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '20px', borderTop: '1px solid var(--border)', textAlign: 'center', background: 'var(--bg-subtle)' }}>
          <button
            onClick={() => { navigate('/settings'); onClose(); }}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 800, fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}
          >
            Notification Preferences
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;
