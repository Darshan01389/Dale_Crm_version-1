import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../../contexts/ToastContext';

const AutomationRules = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { show: showToast } = useToast();

  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    conditions: [{ field: 'source', operator: 'equals', value: '' }],
    action_type: 'assign_to_user',
    action_payload: { user_id: '' }
  });

  const fetchRules = async () => {
    try {
      const token = localStorage.getItem('voiceiq_token');
      const res = await axios.get('/api/automation/rules', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRules(res.data);
    } catch (err) {
      console.error(err);
      showToast({ type: 'error', message: 'Failed to fetch automation rules.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleSaveRule = async () => {
    if (!newRule.name || !newRule.conditions[0].value) {
      return showToast({ type: 'error', message: 'Name and at least one condition value required.' });
    }

    try {
      const token = localStorage.getItem('voiceiq_token');
      await axios.post('/api/automation/rules', newRule, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast({ type: 'success', message: 'Automation Rule Created!' });
      setShowModal(false);
      setNewRule({
        name: '', description: '', conditions: [{ field: 'source', operator: 'equals', value: '' }],
        action_type: 'assign_to_user', action_payload: { user_id: '' }
      });
      fetchRules();
    } catch (err) {
      console.error(err);
      showToast({ type: 'error', message: 'Failed to create rule.' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this rule?")) return;
    try {
      const token = localStorage.getItem('voiceiq_token');
      await axios.delete(`/api/automation/rules/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast({ type: 'success', message: 'Rule deleted.' });
      fetchRules();
    } catch (err) {
      showToast({ type: 'error', message: 'Failed to delete.' });
    }
  };

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 className="text-h2" style={{ margin: 0 }}>Automation Engine</h2>
          <p className="text-muted" style={{ margin: '8px 0 0' }}>Define triggers to route and process incoming leads automatically.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + Create Workflow
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {loading ? (
          <div>Loading rules...</div>
        ) : rules.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            No automation rules configured yet.
          </div>
        ) : (
          rules.map(rule => (
            <div key={rule.id} className="card" style={{ padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 className="text-h3" style={{ margin: '0 0 8px' }}>{rule.name}</h3>
                <div style={{ display: 'flex', gap: 12, fontSize: 13 }}>
                  <span style={{ background: 'var(--bg-subtle)', padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)' }}>
                    IF {rule.conditions[0]?.field} {rule.conditions[0]?.operator} "{rule.conditions[0]?.value}"
                  </span>
                  <span style={{ fontWeight: 800 }}>→</span>
                  <span style={{ background: 'var(--primary-glow)', color: 'var(--primary)', padding: '4px 8px', borderRadius: 6 }}>
                    THEN {rule.action_type.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ padding: '6px 12px', background: rule.is_active ? 'rgba(16,185,129,0.1)' : 'var(--bg-subtle)', color: rule.is_active ? 'var(--success)' : 'var(--text-muted)', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>
                  {rule.is_active ? 'ACTIVE' : 'PAUSED'}
                </div>
                <button 
                  onClick={() => handleDelete(rule.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 8 }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Basic Create Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: 500, padding: 32 }}>
            <h2 className="text-h2" style={{ marginTop: 0 }}>New Workflow Rule</h2>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Rule Name</label>
              <input 
                value={newRule.name} onChange={e => setNewRule({...newRule, name: e.target.value})}
                placeholder="e.g. Route FB Leads to VIP Team"
                style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text)' }}
              />
            </div>

            <div style={{ padding: 16, background: 'var(--bg-subtle)', borderRadius: 8, marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 12 }}>IF TRIGGER MATCHES:</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <select 
                  value={newRule.conditions[0].field} 
                  onChange={e => setNewRule({...newRule, conditions: [{...newRule.conditions[0], field: e.target.value}]})}
                  style={{ flex: 1, padding: 8, borderRadius: 6 }}
                >
                  <option value="source">Lead Source</option>
                  <option value="company">Company</option>
                  <option value="deal_value">Deal Value</option>
                  <option value="ai_score">AI Score</option>
                </select>
                <select 
                  value={newRule.conditions[0].operator} 
                  onChange={e => setNewRule({...newRule, conditions: [{...newRule.conditions[0], operator: e.target.value}]})}
                  style={{ flex: 1, padding: 8, borderRadius: 6 }}
                >
                  <option value="equals">Equals</option>
                  <option value="contains">Contains</option>
                  <option value="greater_than">Greater Than</option>
                </select>
                <input 
                  value={newRule.conditions[0].value}
                  onChange={e => setNewRule({...newRule, conditions: [{...newRule.conditions[0], value: e.target.value}]})}
                  placeholder="Value..."
                  style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid var(--border)' }}
                />
              </div>
            </div>

            <div style={{ padding: 16, background: 'var(--primary-glow)', borderRadius: 8, marginBottom: 24, border: '1px solid rgba(79, 70, 229, 0.2)' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--primary)', marginBottom: 12 }}>THEN EXECUTE ACTION:</div>
              <select 
                value={newRule.action_type}
                onChange={e => setNewRule({...newRule, action_type: e.target.value})}
                style={{ width: '100%', padding: 8, borderRadius: 6, marginBottom: 8 }}
              >
                <option value="assign_to_user">Assign to Sales Rep</option>
                <option value="change_status">Change Lead Status</option>
              </select>

              {newRule.action_type === 'assign_to_user' && (
                <input 
                  value={newRule.action_payload.user_id}
                  onChange={e => setNewRule({...newRule, action_payload: { user_id: e.target.value }})}
                  placeholder="Target User UUID"
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)' }}
                />
              )}
              {newRule.action_type === 'change_status' && (
                <select 
                  value={newRule.action_payload.status || 'hot'}
                  onChange={e => setNewRule({...newRule, action_payload: { status: e.target.value }})}
                  style={{ width: '100%', padding: 8, borderRadius: 6 }}
                >
                  <option value="hot">Hot Lead</option>
                  <option value="qualified">Qualified</option>
                  <option value="junk">Junk</option>
                </select>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button style={{ padding: '10px 16px', border: 'none', background: 'none', color: 'var(--text)', cursor: 'pointer' }} onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" style={{ padding: '10px 24px', borderRadius: 8 }} onClick={handleSaveRule}>Save Rule</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutomationRules;
