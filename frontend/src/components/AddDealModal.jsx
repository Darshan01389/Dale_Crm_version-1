import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';

const AddDealModal = ({ isOpen, onClose, onSuccess }) => {
  const { show } = useToast();
  const [stages, setStages] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    stage_key: 'new',
    amount: 0,
    probability: 10,
    expected_close_date: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // We'll hardcode stages for now to match STAGES in Kanban or fetch them if endpoint exists
      // Actually, better to fetch them from backend if we have an endpoint
      // For now, let's use the known keys from seed
      setStages([
        { key: 'new', label: 'New' },
        { key: 'discovery', label: 'Discovery' },
        { key: 'proposal', label: 'Proposal' },
        { key: 'negotiation', label: 'Negotiation' },
        { key: 'won', label: 'Closed Won' },
        { key: 'lost', label: 'Closed Lost' },
      ]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('voiceiq_token');
      await axios.post('/api/deals', {
        ...formData,
        amount: parseFloat(formData.amount) || 0,
        probability: parseFloat(formData.probability) || 0,
        expected_close_date: formData.expected_close_date || null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error creating deal:", err);
      show({ type: 'error', message: 'Failed to create deal. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 2000, padding: 16, backdropFilter: 'blur(4px)'
    }}>
      <div className="card glass animate-in" style={{ width: '100%', maxWidth: 500, overflow: 'hidden', borderRadius: 24 }}>
        <div style={{ padding: '24px 30px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Create New Deal</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--text-muted)' }}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 30 }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 8, textTransform: 'uppercase' }}>DEAL TITLE *</label>
            <input 
              required
              className="input" 
              placeholder="e.g. Enterprise License - TechFlow"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 8, textTransform: 'uppercase' }}>PIPELINE STAGE</label>
              <select 
                className="input" 
                value={formData.stage_key}
                onChange={e => setFormData({...formData, stage_key: e.target.value})}
              >
                {stages.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 8, textTransform: 'uppercase' }}>AMOUNT (₹)</label>
              <input 
                type="number"
                className="input" 
                placeholder="0.00"
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: e.target.value})}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 8, textTransform: 'uppercase' }}>PROBABILITY (%)</label>
              <input 
                type="number"
                max="100"
                min="0"
                className="input" 
                value={formData.probability}
                onChange={e => setFormData({...formData, probability: e.target.value})}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 8, textTransform: 'uppercase' }}>EXPECTED CLOSE</label>
              <input 
                type="date"
                className="input" 
                value={formData.expected_close_date}
                onChange={e => setFormData({...formData, expected_close_date: e.target.value})}
              />
            </div>
          </div>

          <div style={{ marginBottom: 30 }}>
            <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 8, textTransform: 'uppercase' }}>NOTES</label>
            <textarea 
              className="input" 
              placeholder="Add deal context..."
              style={{ minHeight: 80 }}
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
            />
          </div>

          <button 
            type="submit"
            className="btn-primary" 
            style={{ width: '100%', height: 52, borderRadius: 12, justifyContent: 'center', fontSize: 16 }}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Deal →'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddDealModal;
