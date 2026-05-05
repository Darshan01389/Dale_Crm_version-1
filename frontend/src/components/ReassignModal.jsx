import React, { useState } from 'react';

const ReassignModal = ({ isOpen, onClose, contactName }) => {
  const [selectedRep, setSelectedRep] = useState('');

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000
    }}>
      <div className="card" style={{ width: '100%', maxWidth: 400, padding: 32 }}>
        <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 20 }}>Reassign Lead</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Select a new owner for <strong>{contactName || 'this lead'}</strong>. The new owner will be notified.</p>
        
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-micro)', letterSpacing: 1, display: 'block', marginBottom: 8 }}>NEW OWNER</label>
          <select className="input" value={selectedRep} onChange={e => setSelectedRep(e.target.value)}>
            <option value="" disabled>Select a team member...</option>
            <option value="Ravi Kumar">Ravi Kumar (Capacity: 84%)</option>
            <option value="Priya Sharma">Priya Sharma (Capacity: 71%)</option>
            <option value="Arun Mehta">Arun Mehta (Capacity: 52%)</option>
          </select>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={onClose} disabled={!selectedRep}>Reassign</button>
        </div>
      </div>
    </div>
  );
};

export default ReassignModal;
