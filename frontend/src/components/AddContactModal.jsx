import React, { useState } from 'react';

const AddContactModal = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [source, setSource] = useState('Referral');
  const [note, setNote] = useState('');

  const isPhoneValid = phone.length >= 10;
  const isDuplicate = phone.endsWith('99');

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 2000, padding: 16
    }}>
      <div className="card" style={{ width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', padding: 0 }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>New Contact</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)' }}>&times;</button>
        </div>

        <div style={{ padding: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-micro)', letterSpacing: 1, display: 'block', marginBottom: 8 }}>FULL NAME *</label>
            <input 
              className="input" 
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-micro)', letterSpacing: 1, display: 'block', marginBottom: 8 }}>PHONE NUMBER *</label>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input 
                className="input" 
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              {isPhoneValid && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#F0FAF4', padding: '6px 12px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                  <span style={{ color: 'var(--rep-accent)', fontSize: 12, fontWeight: 700 }}>✓ Verified</span>
                </div>
              )}
            </div>
          </div>

          {isPhoneValid && (
            <div style={{ 
              background: isDuplicate ? '#FEF2F2' : '#EFF6FF', 
              padding: 16, borderRadius: 12, marginBottom: 20, 
              border: `1px solid ${isDuplicate ? '#FECACA' : '#DBEAFE'}`, 
              display: 'flex', gap: 12 
            }}>
              <span style={{ fontSize: 16 }}>{isDuplicate ? '🚨' : '✨'}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: isDuplicate ? '#991B1B' : '#1F4E79' }}>
                  {isDuplicate ? 'Duplicate Detected' : 'AI Detection'}
                </div>
                <div style={{ fontSize: 12, color: isDuplicate ? '#991B1B' : '#1F4E79', marginTop: 2 }}>
                  {isDuplicate 
                    ? 'A contact with this phone number already exists in your database.' 
                    : 'WhatsApp available. No existing records found. Location: Mumbai, India.'}
                </div>
              </div>
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-micro)', letterSpacing: 1, display: 'block', marginBottom: 8 }}>EMAIL ADDRESS</label>
            <input 
              className="input" 
              type="email"
              placeholder="john@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-micro)', letterSpacing: 1, display: 'block', marginBottom: 8 }}>SOURCE</label>
            <select className="input" value={source} onChange={(e) => setSource(e.target.value)}>
              <option>Referral</option>
              <option>Inbound Call</option>
              <option>Meta Ads</option>
              <option>Cold Outreach</option>
            </select>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-micro)', letterSpacing: 1, display: 'block', marginBottom: 8 }}>QUICK NOTE</label>
            <textarea 
              className="input" 
              placeholder="Add context about this lead..."
              style={{ minHeight: 80 }}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <button 
            className="btn-primary" 
            style={{ 
              width: '100%', padding: 16, borderRadius: 12, justifyContent: 'center',
              background: isDuplicate ? '#DC2626' : 'var(--primary-color)'
            }}
            disabled={!name || !phone}
            onClick={() => {
              if (isDuplicate) {
                alert('Redirecting to Merge View (Screen 28)...');
              }
              onClose();
            }}
          >
            {isDuplicate ? 'View Duplicate & Merge' : 'Save & Open Conversation →'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddContactModal;
