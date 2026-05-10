import React from 'react';

const MergeContactModal = ({ isOpen, onClose, contact1, contact2 }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000
    }}>
      <div className="card" style={{ width: '100%', maxWidth: 700, padding: 32 }}>
        <h2 style={{ marginTop: 0, marginBottom: 24, fontSize: 20 }}>Merge Contact Records</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Select the data points you want to keep. The resulting merged contact will preserve all conversation histories.</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
          <div style={{ border: '1px solid var(--primary)', borderRadius: 12, padding: 16, background: 'rgba(99, 102, 241, 0.05)' }}>
            <h4 style={{ margin: '0 0 16px', color: 'var(--primary)' }}>Master Record (Keep)</h4>
            <p><strong>Name:</strong> {contact1?.name || 'Sarah Jenkins'}</p>
            <p><strong>Phone:</strong> {contact1?.phone || '+91 98765 43210'}</p>
            <p><strong>Email:</strong> {contact1?.email || 'sarah@techflow.in'}</p>
            <p><strong>Owner:</strong> Ravi Kumar</p>
          </div>
          <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16, opacity: 0.7 }}>
            <h4 style={{ margin: '0 0 16px', color: 'var(--text-muted)' }}>Duplicate (Merge & Delete)</h4>
            <p><strong>Name:</strong> S. Jenkins</p>
            <p><strong>Phone:</strong> {contact1?.phone || '+91 98765 43210'}</p>
            <p><strong>Email:</strong> No email</p>
            <p><strong>Owner:</strong> Unassigned</p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={onClose}>Confirm Merge</button>
        </div>
      </div>
    </div>
  );
};

export default MergeContactModal;
