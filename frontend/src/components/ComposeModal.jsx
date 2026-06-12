import React, { useState } from 'react';

const ComposeModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [to, setTo] = useState('');
  const [channel, setChannel] = useState('WhatsApp');
  const [msg, setMsg] = useState('');
  const [showAI, setShowAI] = useState(false);

  const suggestions = [
    "Hi [Name], reaching out regarding...",
    "Following up on our discovery call...",
    "I have some updates on the proposal..."
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="card" style={{ width: '100%', maxWidth: 500, margin: 20, padding: 0, overflow: 'hidden', borderRadius: 20 }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Compose Message</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#9CA3AF' }}>&times;</button>
        </div>

        <div style={{ padding: '24px', background: 'white' }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: '#9CA3AF', letterSpacing: 1, marginBottom: 8 }}>SEND TO</label>
            <input 
              placeholder="Name or Phone Number"
              value={to} onChange={e => setTo(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #E5E7EB', outline: 'none', fontSize: 14 }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: '#9CA3AF', letterSpacing: 1, marginBottom: 8 }}>CHANNEL</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {['WhatsApp', 'SMS', 'Email'].map(ch => (
                <button 
                  key={ch}
                  onClick={() => setChannel(ch)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                    border: '1.5px solid',
                    borderColor: channel === ch ? 'var(--primary)' : '#E5E7EB',
                    background: channel === ch ? 'var(--primary)' : 'white',
                    color: channel === ch ? 'white' : '#6B7280',
                    cursor: 'pointer'
                  }}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontSize: 11, fontWeight: 900, color: '#9CA3AF', letterSpacing: 1 }}>MESSAGE</label>
              <button onClick={() => setShowAI(!showAI)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>✨ AI ASSIST</button>
            </div>
            
            {showAI && (
              <div style={{ marginBottom: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {suggestions.map((s, i) => (
                  <button 
                    key={i}
                    onClick={() => { setMsg(s); setShowAI(false); }}
                    style={{ padding: '6px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#F0F9FF', color: '#4F46E5', border: '1px solid #BAE6FD', cursor: 'pointer' }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <textarea 
              rows={5}
              placeholder="Type your message..."
              value={msg} onChange={e => setMsg(e.target.value)}
              style={{ width: '100%', padding: '16px', borderRadius: 16, border: '1.5px solid #E5E7EB', outline: 'none', fontSize: 14, resize: 'none', background: '#F9FAFB' }}
            />
          </div>

          <button className="btn-primary" style={{ width: '100%', padding: '14px', borderRadius: 14, fontWeight: 800, fontSize: 15 }}>
            Send Message
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComposeModal;
