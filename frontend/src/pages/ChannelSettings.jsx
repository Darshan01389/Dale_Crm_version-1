import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';

const TABS = ['Organisation', 'Channels', 'Billing & Plan', 'Data Export', 'Security'];

const CHANNELS = [
  { name: 'WhatsApp',             provider: 'Connected via Bird (US) + MSG91 (India)', status: 'ACTIVE'   },
  { name: 'SMS',                  provider: 'Bird (US) + MSG91 (India)',               status: 'ACTIVE'   },
  { name: 'Email',                provider: 'SMTP via Google Workspace',               status: 'ACTIVE'   },
  { name: 'Voice Capture (Android)', provider: 'Native wrapper installed on 9/12 devices', status: 'PARTIAL'  },
  { name: 'Voice Capture (iOS)', provider: 'Post-call voice memo flow enabled',        status: 'ACTIVE'   },
];

const PILL = {
  ACTIVE:   { bg: '#EAF3DE', color: '#4F46E5', border: '#4F46E5' },
  PARTIAL:  { bg: '#FBE9D2', color: '#B4670F', border: '#B4670F' },
  INACTIVE: { bg: '#F1EFE8', color: '#777',    border: '#777'    },
};

const ChannelSettings = () => {
  const navigate = useNavigate();
  const { show }  = useToast();

  const handleTab = (tab) => {
    if (tab === 'Organisation')  navigate('/org-settings');
    if (tab === 'Billing & Plan') navigate('/billing');
  };

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--bg)' }} className="custom-scroll animate-in">
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '40px 24px' }}>

        {/* Settings tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 40, overflowX: 'auto' }}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => handleTab(tab)} style={{
              padding: '12px 20px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', minHeight: 'auto', minWidth: 'auto',
              color: tab === 'Channels' ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: tab === 'Channels' ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: -1,
            }}>{tab}</button>
          ))}
        </div>

        <h1 className="text-h1" style={{ marginBottom: 8 }}>Channels</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 32, fontSize: 14 }}>
          Connect, configure, and monitor every communication channel.
        </p>

        {/* Channel cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {CHANNELS.map(ch => {
            const pill = PILL[ch.status];
            return (
              <div key={ch.name} style={{
                display: 'flex', alignItems: 'center', gap: 16, padding: 20,
                background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                borderRadius: 12, boxShadow: 'var(--shadow-sm)',
              }}>
                {/* Icon placeholder */}
                <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--bg-subtle)', border: '1px solid var(--border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                  {ch.name.startsWith('WhatsApp') ? '💬' : ch.name.startsWith('SMS') ? '📱' : ch.name.startsWith('Email') ? '✉️' : '🎙️'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 2 }}>{ch.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{ch.provider}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 20, border: `1px solid ${pill.border}`, background: pill.bg, color: pill.color, letterSpacing: '0.05em', flexShrink: 0 }}>
                  {ch.status}
                </span>
                <button
                  onClick={() => show({ type: 'info', message: 'Channel configuration coming in Phase 2.' })}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 13, fontWeight: 700, cursor: 'pointer', minHeight: 'auto', minWidth: 'auto', flexShrink: 0 }}>
                  CONFIGURE
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ChannelSettings;
