import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../contexts/ToastContext';

export default function WhatsAppSimulator() {
  const { profile } = useUser();
  const { show } = useToast() || { show: (cfg) => alert(cfg.message) };

  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [companyNumber, setCompanyNumber] = useState('+1 (555) 019-2834');
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [simulating, setSimulating] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [latestAnalysis, setLatestAnalysis] = useState(null);

  const chatEndRef = useRef(null);

  // Fetch leads and configured WhatsApp number
  useEffect(() => {
    const initData = async () => {
      try {
        const [leadsRes, numRes] = await Promise.all([
          api.get('/api/leads').catch(() => ({ data: [] })),
          api.get('/api/whatsapp/settings/number').catch(() => ({ data: null }))
        ]);

        const leadsList = leadsRes.data || [];
        setLeads(leadsList);
        if (leadsList.length > 0) {
          setSelectedLead(leadsList[0]);
        }

        if (numRes.data?.whatsapp_number) {
          setCompanyNumber(numRes.data.whatsapp_number);
        }
      } catch (err) {
        console.error('Error initializing WhatsApp simulator:', err);
      }
    };
    initData();
  }, []);

  // Fetch message history when selected lead changes
  useEffect(() => {
    if (!selectedLead?.id) return;
    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        const res = await api.get(`/api/whatsapp/history/${selectedLead.id}`);
        if (res.data?.messages) {
          setMessages(res.data.messages);
        } else {
          setMessages([]);
        }
      } catch {
        setMessages([
          {
            id: 'mock-1',
            direction: 'outbound',
            message: `Hi ${selectedLead.title}! Thanks for checking out DaleIQ. How can we help accelerate your sales team?`,
            timestamp: new Date(Date.now() - 3600000).toISOString()
          }
        ]);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, [selectedLead]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, simulating]);

  const handleSimulateSend = async () => {
    if (!inputMsg.trim() || !selectedLead) return;
    const currentMsg = inputMsg.trim();
    setInputMsg('');

    // Add simulated inbound message to conversation UI
    const tempInbound = {
      id: `temp-${Date.now()}`,
      direction: 'inbound',
      message: currentMsg,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempInbound]);
    setSimulating(true);

    try {
      const res = await api.post('/api/whatsapp/simulate', {
        lead_id: selectedLead.id,
        lead_message: currentMsg,
        company_number: companyNumber || '+15550192834',
        lead_number: selectedLead.phone || '+15559998888'
      });

      const data = res.data;
      if (data?.reply) {
        const aiOutbound = {
          id: `ai-${Date.now()}`,
          direction: 'outbound',
          message: data.reply,
          timestamp: new Date().toISOString(),
          sentiment: data.sentiment,
          summary: data.summary
        };
        setMessages(prev => [...prev, aiOutbound]);
        if (data.summary || data.sentiment) {
          setLatestAnalysis({
            summary: data.summary,
            sentiment: data.sentiment,
            urgency: data.urgency || 'Normal'
          });
        }
        show({ type: 'success', message: 'AI Agent replied instantly!' });
      }
    } catch (err) {
      const errMsg = err.response?.data?.detail || 'Failed to simulate WhatsApp reply.';
      show({ type: 'error', message: String(errMsg) });
    } finally {
      setSimulating(false);
    }
  };

  const quickPrompts = [
    'What are your pricing plans for 10 users?',
    'Can we schedule a 15-minute product demo tomorrow?',
    'I want to speak with your manager regarding enterprise terms.',
    'How does your AI compare to Salesforce Einstein?',
    'Is your WhatsApp integration officially compliant with Meta APIs?'
  ];

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--bg)', padding: '32px 24px 80px' }} className="custom-scroll animate-in">
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 24 }}>💬</span>
              <h1 className="text-h1" style={{ fontSize: 26, fontWeight: 900, color: 'var(--text)' }}>
                WhatsApp AI Agent Simulator
              </h1>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              Test how the AI assistant replies to prospect inquiries in real time without sending real SMS/WhatsApp charges.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Demo Number:</span>
            <input
              type="text"
              value={companyNumber}
              onChange={e => setCompanyNumber(e.target.value)}
              style={{
                padding: '8px 14px', borderRadius: 10, background: 'var(--bg-surface)',
                border: '1px solid var(--border)', fontSize: 13, color: 'var(--text)', fontWeight: 700
              }}
            />
          </div>
        </div>

        {/* 3-Column Simulator Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '300px 1fr 300px',
          gap: 24,
          height: 'calc(100vh - 220px)',
          minHeight: 620
        }}>
          
          {/* Left Column: Lead Selector */}
          <div className="card glass" style={{ padding: 20, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 14 }}>
              Select Prospect Lead ({leads.length})
            </div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }} className="custom-scroll">
              {leads.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  No leads available.
                </div>
              ) : (
                leads.map(ld => {
                  const isSelected = selectedLead?.id === ld.id;
                  return (
                    <div
                      key={ld.id}
                      onClick={() => setSelectedLead(ld)}
                      style={{
                        padding: '12px 14px', borderRadius: 14, cursor: 'pointer',
                        background: isSelected ? 'rgba(79, 70, 229, 0.1)' : 'var(--bg-subtle)',
                        border: isSelected ? '2px solid var(--primary)' : '1px solid transparent',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)' }}>
                          {ld.title}
                        </div>
                        {ld.ai_score && (
                          <span style={{
                            fontSize: 10, fontWeight: 900, padding: '2px 6px', borderRadius: 6,
                            background: ld.ai_score >= 70 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                            color: ld.ai_score >= 70 ? '#10B981' : '#F59E0B'
                          }}>
                            {ld.ai_score}%
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {ld.company || 'Direct Contact'} • {ld.phone || 'No phone'}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Center Column: WhatsApp Chat Canvas */}
          <div style={{
            background: 'var(--bg-surface)',
            borderRadius: 24,
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-md)'
          }}>
            {/* WhatsApp Header */}
            <div style={{
              background: '#075E54', color: '#fff', padding: '14px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', background: '#128C7E',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900
                }}>
                  {selectedLead?.title?.charAt(0) || '👤'}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>
                    {selectedLead?.title || 'Select a Lead'}
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.85 }}>
                    Online • WhatsApp Business Simulated
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 14, fontSize: 18, opacity: 0.9 }}>
                <span>📹</span>
                <span>📞</span>
                <span>⋮</span>
              </div>
            </div>

            {/* Chat Canvas Body */}
            <div style={{
              flex: 1, padding: '20px 24px', overflowY: 'auto',
              background: 'radial-gradient(circle, rgba(18, 140, 126, 0.04) 10%, transparent 10%)',
              backgroundSize: '20px 20px',
              display: 'flex', flexDirection: 'column', gap: 14
            }} className="custom-scroll">
              
              <div style={{ alignSelf: 'center', background: 'rgba(0,0,0,0.2)', padding: '4px 12px', borderRadius: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                Messages are end-to-end encrypted with Dale AI Intelligence
              </div>

              {loadingHistory ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 13 }}>
                  Loading conversation history...
                </div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 13 }}>
                  No messages yet. Send a simulation prompt below!
                </div>
              ) : (
                messages.map((m, idx) => {
                  const isInbound = m.direction === 'inbound';
                  return (
                    <div
                      key={m.id || idx}
                      style={{
                        alignSelf: isInbound ? 'flex-start' : 'flex-end',
                        maxWidth: '75%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isInbound ? 'flex-start' : 'flex-end'
                      }}
                    >
                      <div style={{
                        padding: '12px 16px',
                        borderRadius: isInbound ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
                        background: isInbound ? 'var(--bg-subtle)' : '#005c4b',
                        color: isInbound ? 'var(--text)' : '#FFFFFF',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        fontSize: 14,
                        lineHeight: 1.5,
                        wordBreak: 'break-word',
                        border: isInbound ? '1px solid var(--border-subtle)' : 'none'
                      }}>
                        {m.message}
                        <div style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                          gap: 4, marginTop: 4, fontSize: 10, opacity: 0.75
                        }}>
                          <span>{m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}</span>
                          {!isInbound && <span>✓✓</span>}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {simulating && (
                <div style={{
                  alignSelf: 'flex-end', background: '#005c4b', color: '#fff',
                  padding: '10px 18px', borderRadius: '16px 16px 4px 16px',
                  fontSize: 12, display: 'flex', alignItems: 'center', gap: 8
                }}>
                  <span>AI Agent is drafting reply...</span>
                  <span className="pulse">⏳</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Form Bar */}
            <div style={{
              padding: '14px 20px', background: 'var(--bg-subtle)',
              borderTop: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center'
            }}>
              <input
                type="text"
                value={inputMsg}
                onChange={e => setInputMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSimulateSend()}
                placeholder="Type a message as the prospect (e.g., 'Can you share a pricing quote?')..."
                style={{
                  flex: 1, padding: '12px 18px', borderRadius: 24,
                  background: 'var(--bg-surface)', border: '1px solid var(--border)',
                  color: 'var(--text)', fontSize: 14, outline: 'none'
                }}
              />
              <button
                onClick={handleSimulateSend}
                disabled={simulating || !inputMsg.trim()}
                style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: '#25D366', color: 'white', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, cursor: 'pointer', opacity: simulating || !inputMsg.trim() ? 0.6 : 1,
                  boxShadow: '0 4px 10px rgba(37, 211, 102, 0.3)'
                }}
              >
                ➤
              </button>
            </div>
          </div>

          {/* Right Column: AI Insights & Quick Simulation Prompts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Quick Test Chips */}
            <div className="card glass" style={{ padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 12 }}>
                ⚡ Quick Test Scenarios
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {quickPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInputMsg(p)}
                    style={{
                      textAlign: 'left', padding: '10px 12px', borderRadius: 10,
                      background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)',
                      fontSize: 12, color: 'var(--text)', cursor: 'pointer', lineHeight: 1.4,
                      fontWeight: 600, transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(79, 70, 229, 0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                  >
                    "{p}"
                  </button>
                ))}
              </div>
            </div>

            {/* Lead & Realtime AI Signals */}
            <div className="card glass" style={{ padding: 20, flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 12 }}>
                🎯 Real-Time Agent Intelligence
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ padding: 12, background: 'var(--bg-subtle)', borderRadius: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>Lead Status</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', marginTop: 2, textTransform: 'capitalize' }}>
                    {selectedLead?.status || 'Active Inbound'}
                  </div>
                </div>

                <div style={{ padding: 12, background: 'var(--bg-subtle)', borderRadius: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>Sentiment compound</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#10B981', marginTop: 2 }}>
                    {selectedLead?.sentiment_compound ? `${(selectedLead.sentiment_compound * 100).toFixed(0)}% Positive` : 'Neutral / Positive'}
                  </div>
                </div>

                {latestAnalysis?.summary && (
                  <div style={{ padding: 14, background: 'rgba(79, 70, 229, 0.08)', border: '1px solid rgba(79, 70, 229, 0.2)', borderRadius: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase' }}>
                      Latest AI Intent Extraction
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text)', marginTop: 6, lineHeight: 1.5 }}>
                      {latestAnalysis.summary}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
