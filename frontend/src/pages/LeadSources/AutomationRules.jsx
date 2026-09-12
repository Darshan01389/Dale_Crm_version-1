import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../../contexts/ToastContext';

const AutomationRules = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [simulatingRule, setSimulatingRule] = useState(null);
  const [simulationResult, setSimulationResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);
  const { show: showToast } = useToast();

  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    conditions: [{ field: 'source', operator: 'equals', value: '' }],
    action_type: 'drip_sequence',
    action_payload: {
      steps: [
        { step: 1, channel: 'whatsapp', delay_days: 0, template: 'Instant Welcome & Meeting Invite' },
        { step: 2, channel: 'email', delay_days: 2, template: 'Product Architecture & ROI Case Study' },
        { step: 3, channel: 'task', delay_days: 3, template: 'Executive Follow-up Call & Demo Reminder' },
      ]
    }
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

  const handleAddStep = () => {
    const currentSteps = newRule.action_payload?.steps || [];
    const nextStepNum = currentSteps.length + 1;
    const updated = [
      ...currentSteps,
      { step: nextStepNum, channel: 'whatsapp', delay_days: 2, template: `Cadence Touch #${nextStepNum}` }
    ];
    setNewRule({
      ...newRule,
      action_payload: { ...newRule.action_payload, steps: updated }
    });
  };

  const handleRemoveStep = (idx) => {
    const currentSteps = newRule.action_payload?.steps || [];
    if (currentSteps.length <= 1) return;
    const updated = currentSteps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, step: i + 1 }));
    setNewRule({
      ...newRule,
      action_payload: { ...newRule.action_payload, steps: updated }
    });
  };

  const handleStepChange = (idx, field, value) => {
    const currentSteps = [...(newRule.action_payload?.steps || [])];
    currentSteps[idx] = { ...currentSteps[idx], [field]: value };
    setNewRule({
      ...newRule,
      action_payload: { ...newRule.action_payload, steps: currentSteps }
    });
  };

  const handleSaveRule = async () => {
    if (!newRule.name || !newRule.conditions[0].value) {
      return showToast({ type: 'error', message: 'Rule name and trigger condition value required.' });
    }

    try {
      const token = localStorage.getItem('voiceiq_token');
      await axios.post('/api/automation/rules', newRule, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast({ type: 'success', message: 'Automation Cadence Created!' });
      setShowModal(false);
      setNewRule({
        name: '',
        description: '',
        conditions: [{ field: 'source', operator: 'equals', value: '' }],
        action_type: 'drip_sequence',
        action_payload: {
          steps: [
            { step: 1, channel: 'whatsapp', delay_days: 0, template: 'Instant Welcome & Meeting Invite' },
            { step: 2, channel: 'email', delay_days: 2, template: 'Product Architecture & ROI Case Study' },
            { step: 3, channel: 'task', delay_days: 3, template: 'Executive Follow-up Call & Demo Reminder' },
          ]
        }
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

  const handleSimulate = async (rule) => {
    setSimulatingRule(rule);
    setSimLoading(true);
    setSimulationResult(null);
    try {
      const token = localStorage.getItem('voiceiq_token');
      const res = await axios.post(`/api/automation/rules/${rule.id}/simulate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSimulationResult(res.data);
    } catch (err) {
      console.error(err);
      showToast({ type: 'error', message: 'Failed to simulate sequence.' });
    } finally {
      setSimLoading(false);
    }
  };

  const channelIcon = (ch) => {
    if (ch === 'whatsapp') return '📱 WhatsApp';
    if (ch === 'email') return '✉️ Email';
    if (ch === 'task') return '📞 Call Task';
    return '⚡ Action';
  };

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 className="text-h2" style={{ margin: 0 }}>Autonomous Drip & Automation Engine</h2>
          <p className="text-muted" style={{ margin: '6px 0 0' }}>Define multi-touch follow-up cadences and autonomous lead routing.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + Create Cadence Workflow
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {loading ? (
          <div style={{ padding: 32, textAlign: 'center' }}>Loading automations...</div>
        ) : rules.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            No automation rules configured yet. Create your first autonomous drip sequence!
          </div>
        ) : (
          rules.map(rule => {
            const steps = rule.action_payload?.steps || [];
            const isDrip = rule.action_type === 'drip_sequence' || steps.length > 0;
            return (
              <div key={rule.id} className="card glass" style={{ padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <h3 className="text-h3" style={{ margin: 0 }}>{rule.name}</h3>
                      <span style={{ 
                        padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800,
                        background: isDrip ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-subtle)',
                        color: isDrip ? 'var(--primary)' : 'var(--text-muted)',
                        border: '1px solid var(--border-subtle)'
                      }}>
                        {isDrip ? '🔄 MULTI-TOUCH DRIP' : '⚡ SINGLE ACTION'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 8, fontSize: 13, marginTop: 8, alignItems: 'center' }}>
                      <span style={{ background: 'var(--bg-subtle)', padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)' }}>
                        IF {rule.conditions[0]?.field} {rule.conditions[0]?.operator} "{rule.conditions[0]?.value}"
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <button 
                      onClick={() => handleSimulate(rule)}
                      className="btn-secondary"
                      style={{ padding: '6px 14px', fontSize: 12, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      ⚡ Test Cadence
                    </button>
                    <div style={{ 
                      padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 800,
                      background: rule.is_active ? 'rgba(16,185,129,0.15)' : 'var(--bg-subtle)', 
                      color: rule.is_active ? 'var(--success)' : 'var(--text-muted)' 
                    }}>
                      {rule.is_active ? 'ACTIVE' : 'PAUSED'}
                    </div>
                    <button 
                      onClick={() => handleDelete(rule.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 8, fontSize: 13 }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Cadence Timeline Chain */}
                {isDrip && steps.length > 0 && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 10, letterSpacing: '0.05em' }}>
                      TOUCHPOINT SEQUENCE:
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      {steps.map((st, i) => (
                        <React.Fragment key={i}>
                          <div style={{ 
                            background: 'var(--bg-surface)', padding: '8px 14px', borderRadius: 10, 
                            border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8,
                            fontSize: 12
                          }}>
                            <span style={{ fontWeight: 800, color: 'var(--primary)' }}>Step {st.step}:</span>
                            <span style={{ fontWeight: 600 }}>{channelIcon(st.channel)}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-subtle)', padding: '2px 6px', borderRadius: 6 }}>
                              +{st.delay_days}d
                            </span>
                          </div>
                          {i < steps.length - 1 && (
                            <span style={{ color: 'var(--primary)', fontWeight: 800 }}>→</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Create Workflow Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card glass" style={{ width: '90%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto', padding: 32, borderRadius: 20 }}>
            <h2 className="text-h2" style={{ marginTop: 0 }}>New Autonomous Cadence</h2>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Cadence Name</label>
              <input 
                value={newRule.name} onChange={e => setNewRule({...newRule, name: e.target.value})}
                placeholder="e.g. Inbound Website Lead 5-Day Fast-Track"
                className="input"
                style={{ width: '100%', height: 42, padding: '0 12px', fontSize: 13 }}
              />
            </div>

            <div style={{ padding: 16, background: 'var(--bg-subtle)', borderRadius: 12, marginBottom: 20, border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 10 }}>TRIGGER FILTER:</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <select 
                  value={newRule.conditions[0].field} 
                  onChange={e => setNewRule({...newRule, conditions: [{...newRule.conditions[0], field: e.target.value}]})}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 8, background: 'var(--bg-surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
                >
                  <option value="source">Lead Source</option>
                  <option value="company">Company</option>
                  <option value="deal_value">Deal Value</option>
                  <option value="ai_score">AI Score</option>
                </select>
                <select 
                  value={newRule.conditions[0].operator} 
                  onChange={e => setNewRule({...newRule, conditions: [{...newRule.conditions[0], operator: e.target.value}]})}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 8, background: 'var(--bg-surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
                >
                  <option value="equals">Equals</option>
                  <option value="contains">Contains</option>
                  <option value="greater_than">Greater Than</option>
                </select>
                <input 
                  value={newRule.conditions[0].value}
                  onChange={e => setNewRule({...newRule, conditions: [{...newRule.conditions[0], value: e.target.value}]})}
                  placeholder="e.g. Website"
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 8, background: 'var(--bg-surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
                />
              </div>
            </div>

            {/* Steps Builder */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text)', letterSpacing: '0.05em' }}>CADENCE SEQUENCE STEPS</span>
                <button type="button" onClick={handleAddStep} className="btn-secondary" style={{ padding: '4px 10px', fontSize: 11, borderRadius: 6 }}>
                  + Add Touchpoint
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {newRule.action_payload.steps.map((st, i) => (
                  <div key={i} style={{ 
                    padding: 12, borderRadius: 10, background: 'var(--bg-surface)', border: '1px solid var(--border)',
                    display: 'flex', gap: 10, alignItems: 'center'
                  }}>
                    <span style={{ fontWeight: 800, fontSize: 12, color: 'var(--primary)', width: 50 }}>#{st.step}</span>
                    
                    <select 
                      value={st.channel} 
                      onChange={e => handleStepChange(i, 'channel', e.target.value)}
                      style={{ padding: '6px 8px', borderRadius: 6, background: 'var(--bg-subtle)', color: 'var(--text)', border: '1px solid var(--border)', fontSize: 12 }}
                    >
                      <option value="whatsapp">📱 WhatsApp</option>
                      <option value="email">✉️ Email</option>
                      <option value="task">📞 Call Task</option>
                    </select>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>+</span>
                      <input 
                        type="number" min="0" max="30"
                        value={st.delay_days}
                        onChange={e => handleStepChange(i, 'delay_days', parseInt(e.target.value) || 0)}
                        style={{ width: 44, padding: '4px 6px', borderRadius: 6, background: 'var(--bg-subtle)', color: 'var(--text)', border: '1px solid var(--border)', fontSize: 12 }}
                      />
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>days</span>
                    </div>

                    <input 
                      value={st.template}
                      onChange={e => handleStepChange(i, 'template', e.target.value)}
                      placeholder="Template / Pitch description"
                      style={{ flex: 1, padding: '6px 8px', borderRadius: 6, background: 'var(--bg-subtle)', color: 'var(--text)', border: '1px solid var(--border)', fontSize: 12 }}
                    />

                    {newRule.action_payload.steps.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => handleRemoveStep(i)}
                        style={{ border: 'none', background: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 4, fontSize: 14 }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button className="btn-secondary" style={{ padding: '10px 18px', borderRadius: 10 }} onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" style={{ padding: '10px 24px', borderRadius: 10 }} onClick={handleSaveRule}>Launch Cadence</button>
            </div>
          </div>
        </div>
      )}

      {/* Simulation Modal */}
      {simulatingRule && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card glass" style={{ width: '90%', maxWidth: 540, padding: 32, borderRadius: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.06em' }}>SIMULATION PREVIEW</span>
                <h3 className="text-h3" style={{ margin: '4px 0 0' }}>{simulatingRule.name}</h3>
              </div>
              <button onClick={() => setSimulatingRule(null)} style={{ border: 'none', background: 'none', color: 'var(--text)', fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>

            {simLoading ? (
              <div style={{ padding: 40, textAlign: 'center' }}>Calculating execution timeline...</div>
            ) : simulationResult ? (
              <div>
                <div style={{ display: 'flex', gap: 16, marginBottom: 20, background: 'var(--bg-subtle)', padding: 16, borderRadius: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>TOTAL TOUCHES</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>{simulationResult.total_touches}</div>
                  </div>
                  <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 16 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>CADENCE SPAN</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)' }}>{simulationResult.total_cadence_days} Days</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {simulationResult.sequence_timeline.map((step, i) => (
                    <div key={i} style={{ 
                      padding: 14, borderRadius: 10, background: 'var(--bg-surface)', border: '1px solid var(--border)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontWeight: 800, fontSize: 12, color: 'var(--primary)' }}>{step.scheduled_time}</span>
                          <span style={{ fontSize: 13, fontWeight: 700 }}>{channelIcon(step.channel)}</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{step.template}</div>
                      </div>
                      <span style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.15)', color: 'var(--success)', fontWeight: 700 }}>
                        {step.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div style={{ marginTop: 24, textAlign: 'right' }}>
              <button className="btn-primary" onClick={() => setSimulatingRule(null)} style={{ padding: '10px 20px', borderRadius: 10 }}>
                Close Simulation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutomationRules;
