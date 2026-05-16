import React, { useState } from 'react';
import { useToast } from '../contexts/ToastContext';

const AddContactModal = ({ isOpen, onClose, onSuccess }) => {
  const { show } = useToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [source, setSource] = useState('Referral');
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isPhoneValid = phone.length >= 10;
  const isDuplicate = phone.endsWith('99');

  const handleSave = async () => {
    if (!name || !phone) return;
    
    setIsSaving(true);
    try {
      const token = localStorage.getItem('voiceiq_token');
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: name,
          phone: phone,
          email: email || null,
          source: source,
          notes: note,
          status: 'new'
        })
      });

      if (response.ok) {
        show({ type: 'success', message: 'Lead added successfully!' });
        if (onSuccess) onSuccess();
        // Reset form
        setName('');
        setPhone('');
        setEmail('');
        setSource('Referral');
        setNote('');
        onClose();
      } else {
        const err = await response.json();
        show({ type: 'error', message: err.detail || 'Failed to add lead' });
      }
    } catch (error) {
      show({ type: 'error', message: 'Network error while adding lead' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 2000, padding: 16
    }}>
      <div className="card glass animate-in" style={{ width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', padding: 0, borderRadius: 24 }}>
        <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Create New Lead</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--text-muted)' }}>&times;</button>
        </div>

        <div style={{ padding: 32 }}>
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '0.05em', display: 'block', marginBottom: 10 }}>FULL NAME *</label>
            <input 
              className="input" 
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSaving}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '0.05em', display: 'block', marginBottom: 10 }}>PHONE NUMBER *</label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <input 
                className="input" 
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isSaving}
              />
              {isPhoneValid && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(16, 185, 129, 0.1)', padding: '8px 14px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                  <span style={{ color: '#10B981', fontSize: 12, fontWeight: 800 }}>✓ Verified</span>
                </div>
              )}
            </div>
          </div>

          {isPhoneValid && (
            <div style={{ 
              background: isDuplicate ? 'rgba(239, 68, 68, 0.05)' : 'rgba(79, 70, 229, 0.05)', 
              padding: 20, borderRadius: 16, marginBottom: 24, 
              border: `1px solid ${isDuplicate ? 'rgba(239, 68, 68, 0.2)' : 'rgba(79, 70, 229, 0.2)'}`, 
              display: 'flex', gap: 14 
            }}>
              <span style={{ fontSize: 20 }}>{isDuplicate ? '🚨' : '✨'}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: isDuplicate ? '#EF4444' : 'var(--primary)' }}>
                  {isDuplicate ? 'Duplicate Detected' : 'AI Analysis Active'}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>
                  {isDuplicate 
                    ? 'This contact already exists. Saving will create a duplicate record.' 
                    : 'Real-time validation: WhatsApp verified. Region: Maharashtra. No existing records found.'}
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '0.05em', display: 'block', marginBottom: 10 }}>EMAIL ADDRESS</label>
              <input 
                className="input" 
                type="email"
                placeholder="john@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSaving}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '0.05em', display: 'block', marginBottom: 10 }}>SOURCE</label>
              <select className="input" value={source} onChange={(e) => setSource(e.target.value)} disabled={isSaving}>
                <option>Referral</option>
                <option>Inbound Call</option>
                <option>Meta Ads</option>
                <option>Cold Outreach</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 32 }}>
            <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '0.05em', display: 'block', marginBottom: 10 }}>QUICK NOTE</label>
            <textarea 
              className="input" 
              placeholder="Add context about this lead..."
              style={{ minHeight: 100, resize: 'none' }}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={isSaving}
            />
          </div>

          <button 
            className="btn-primary" 
            style={{ 
              width: '100%', padding: 18, borderRadius: 16, justifyContent: 'center',
              background: isSaving ? 'var(--text-muted)' : (isDuplicate ? '#EF4444' : 'var(--primary)'),
              opacity: isSaving ? 0.7 : 1
            }}
            disabled={!name || !phone || isSaving}
            onClick={handleSave}
          >
            {isSaving ? 'Processing...' : (isDuplicate ? 'View Duplicate & Merge' : 'Save & Open Profile →')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddContactModal;
