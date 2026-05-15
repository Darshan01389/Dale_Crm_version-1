import React from 'react';

const LeadSourceHub = () => {
  const sources = [
    { id: 'wa', name: 'WhatsApp Business', desc: 'Sync customer chats', icon: '💬', status: 'connected', stats: '2.4k messages processed' },
    { id: 'sms', name: 'Twilio SMS', desc: 'Manage bulk outreach', icon: '✉️', status: 'connected', stats: '840 texts sent' },
    { id: 'fb', name: 'FB Lead Ads', desc: 'Auto-import from Meta', icon: '📱', status: 'disconnected' },
    { id: 'li', name: 'LinkedIn Ads', desc: 'Capture B2B leads', icon: '🔗', status: 'disconnected' },
    { id: 'form', name: 'Custom Forms', desc: 'Connect website forms', icon: '📝', status: 'connected', stats: '12 new leads today' },
  ];

  return (
    <div style={{ padding: '32px 40px', height: '100%', overflowY: 'auto', background: 'var(--bg)' }} className="custom-scroll animate-in">
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#111827' }}>Lead Sources</h1>
        <p style={{ fontSize: 14, color: '#6B7280', marginTop: 8 }}>Configure where your leads come from and how DaleIQ AI processes them.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
        {sources.map(source => (
          <div key={source.id} className="card" style={{ padding: 24, borderRadius: 20, border: source.status === 'connected' ? '1px solid var(--primary)' : '1px solid #E5E7EB' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                {source.icon}
              </div>
              <div style={{
                padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 900,
                background: source.status === 'connected' ? '#D1FAE5' : '#F3F4F6',
                color: source.status === 'connected' ? '#065F46' : '#6B7280'
              }}>
                {source.status.toUpperCase()}
              </div>
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 900, color: '#111827', margin: 0 }}>{source.name}</h3>
            <p style={{ fontSize: 13, color: '#6B7280', marginTop: 6 }}>{source.desc}</p>

            {source.status === 'connected' ? (
              <div style={{ marginTop: 20, padding: '12px 16px', background: '#F0F9FF', borderRadius: 12, border: '1px solid #BAE6FD' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#4F46E5' }}>LIVE PERFORMANCE</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0C4A6E', marginTop: 4 }}>{source.stats}</div>
              </div>
            ) : (
              <div style={{ marginTop: 20, height: 42 }} />
            )}

            <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
              <button 
                className={source.status === 'connected' ? 'btn-secondary' : 'btn-primary'}
                style={{ flex: 1, padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 800, justifyContent: 'center' }}
              >
                {source.status === 'connected' ? 'Configure' : 'Connect Now'}
              </button>
              {source.status === 'connected' && (
                <button style={{ padding: '10px', width: 42, height: 42, borderRadius: 10, border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer' }}>
                  ⚙️
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Custom API / Webhook placeholder */}
        <div style={{
          padding: 24, borderRadius: 20, border: '2px dashed #E5E7EB',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', minHeight: 280
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>Developer API</h3>
          <p style={{ fontSize: 13, color: '#6B7280', marginTop: 6, maxWidth: 200 }}>Push leads directly via our secure Webhook API.</p>
          <button style={{ marginTop: 20, background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 800, cursor: 'pointer', fontSize: 13 }}>
            View Documentation →
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeadSourceHub;
