import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../contexts/ToastContext';

const DEMO_LEADS = [
  { id: null, name: '— Select a Lead —' },
];

const WhatsAppSimulator = () => {
  const { profile } = useUser();
  const { show } = useToast();
  const messagesEndRef = useRef(null);

  const [companyNumber, setCompanyNumber] = useState('');
  const [leadNumber, setLeadNumber] = useState('');
  const [leadId, setLeadId] = useState('');
  const [leads, setLeads] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [savedNumber, setSavedNumber] = useState('');

  const token = localStorage.getItem('voiceiq_token');
  const isAllowed = profile?.role === 'Sales Rep' || profile?.role === 'Team Lead';

  // Fetch leads and saved number on mount
  useEffect(() => {
    if (!isAllowed) return;
    fetchLeads();
    fetchSavedNumber();
  }, [isAllowed]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchLeads = async () => {
    try {
      const res = await axios.get('/api/leads', { headers: { Authorization: `Bearer ${token}` } });
      const data = res.data?.leads || res.data || [];
      setLeads(Array.isArray(data) ? data : []);
    } catch {
      setLeads([]);
    }
  };

  const fetchSavedNumber = async () => {
    try {
      const res = await axios.get('/api/whatsapp/settings/number', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.whatsapp_number) {
        setSavedNumber(res.data.whatsapp_number);
        setCompanyNumber(res.data.whatsapp_number);
      }
    } catch { /* No saved number yet */ }
  };

  const saveCompanyNumber = async () => {
    if (!companyNumber.trim()) return show({ type: 'error', message: 'Enter a valid company number.' });
    try {
      await axios.put(
        '/api/whatsapp/settings/number',
        { whatsapp_number: companyNumber.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSavedNumber(companyNumber.trim());
      show({ type: 'success', message: `Company number saved: ${companyNumber}` });
    } catch {
      show({ type: 'error', message: 'Failed to save company number.' });
    }
  };

  const startSession = async () => {
    if (!companyNumber || !leadNumber || !leadId) {
      return show({ type: 'error', message: 'Please select a lead and enter both phone numbers.' });
    }
    setLoadingHistory(true);
    try {
      const res = await axios.get(`/api/whatsapp/history/${leadId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const history = res.data.messages || [];
      setMessages(history.map(m => ({
        from: m.direction === 'inbound' ? 'lead' : 'agent',
        text: m.message,
        time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      })));
    } catch {
      setMessages([]);
    }
    setSessionActive(true);
    setLoadingHistory(false);
  };

  const sendAsLead = async () => {
    if (!inputMessage.trim() || !leadId) return;
    const msg = inputMessage.trim();
    setInputMessage('');
    setMessages(prev => [...prev, {
      from: 'lead',
      text: msg,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
    setLoading(true);
    try {
      const res = await axios.post(
        '/api/whatsapp/simulate',
        { lead_id: leadId, lead_message: msg, company_number: companyNumber, lead_number: leadNumber },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const agentReply = res.data.reply;
      setTimeout(() => {
        setMessages(prev => [...prev, {
          from: 'agent',
          text: agentReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          summary: res.data.summary,
        }]);
        setLoading(false);
      }, 500);
    } catch (err) {
      show({ type: 'error', message: 'Agent failed to reply. Check backend.' });
      setLoading(false);
    }
  };

  if (!isAllowed) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 48 }}>🔒</div>
        <h2 style={{ color: 'var(--text)', margin: 0 }}>Access Restricted</h2>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
          The WhatsApp Simulator is only available for Sales Rep and Team Lead accounts.
        </p>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--bg)', padding: '32px 24px 80px' }} className="animate-in custom-scroll">
      <h1 className="text-h1" style={{ marginBottom: 4 }}>📱 WhatsApp Agent Simulator</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 32, fontSize: 14 }}>
        Demonstrate the autonomous AI agent live. Send messages as the lead — watch Llama 3.1 reply instantly.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24, maxWidth: 1100 }}>

        {/* ── Left Panel: Config ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card glass" style={{ padding: 24, borderRadius: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 20px' }}>
              Session Setup
            </h3>

            <label style={labelStyle}>Select Lead</label>
            <select
              className="input" style={{ marginBottom: 16 }}
              value={leadId} onChange={e => setLeadId(e.target.value)}
              disabled={sessionActive}
            >
              <option value="">— Select a Lead —</option>
              {leads.map(l => (
                <option key={l.id} value={l.id}>{l.title || l.name} {l.lead_company_name ? `— ${l.lead_company_name}` : ''}</option>
              ))}
            </select>

            <label style={labelStyle}>Company Number (Your WhatsApp)</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input
                className="input" style={{ flex: 1 }}
                placeholder="+91 9876543210"
                value={companyNumber}
                onChange={e => setCompanyNumber(e.target.value)}
                disabled={sessionActive}
              />
              <button className="btn-secondary" style={{ padding: '0 12px', fontSize: 12, borderRadius: 10 }} onClick={saveCompanyNumber}>
                Save
              </button>
            </div>
            {savedNumber && (
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>
                ✅ Saved: {savedNumber}
              </p>
            )}

            <label style={labelStyle}>Lead Number (Friend's WhatsApp)</label>
            <input
              className="input" style={{ marginBottom: 20 }}
              placeholder="+91 9123456789"
              value={leadNumber}
              onChange={e => setLeadNumber(e.target.value)}
              disabled={sessionActive}
            />

            {!sessionActive ? (
              <button
                className="btn-primary" style={{ width: '100%', height: 48, borderRadius: 12, justifyContent: 'center' }}
                onClick={startSession} disabled={loadingHistory}
              >
                {loadingHistory ? 'Loading History...' : '▶ Start Live Demo'}
              </button>
            ) : (
              <button
                className="btn-secondary" style={{ width: '100%', height: 48, borderRadius: 12, justifyContent: 'center', color: '#EF4444', borderColor: '#EF4444' }}
                onClick={() => { setSessionActive(false); setMessages([]); setLeadId(''); }}
              >
                ✕ End Session
              </button>
            )}
          </div>

          {/* Info card */}
          <div className="card" style={{ padding: 20, borderRadius: 16, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--primary)' }}>How it works:</strong><br />
              Type a message <em>as the lead</em> on the right → The Llama 3.1 70B agent replies in real time → All messages are saved to the CRM interaction chart.
            </p>
          </div>
        </div>

        {/* ── Right Panel: Chat ── */}
        <div className="card glass" style={{ borderRadius: 20, display: 'flex', flexDirection: 'column', minHeight: 520 }}>
          {/* Chat Header */}
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #25D366, #128C7E)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
              💬
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>
                {sessionActive && leadId
                  ? (leads.find(l => l.id === leadId)?.title || 'Lead Chat')
                  : 'WhatsApp Agent'}
              </div>
              <div style={{ fontSize: 12, color: '#25D366', fontWeight: 600 }}>
                {sessionActive ? '● AI Agent Active — Powered by Llama 3.1 70B' : 'Configure session to start'}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16, background: '#ECE5DD', minHeight: 300 }} className="custom-scroll">
            {!sessionActive && (
              <div style={{ textAlign: 'center', color: '#888', fontSize: 13, marginTop: 60 }}>
                Configure the session on the left and click "Start Live Demo"
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.from === 'lead' ? 'flex-start' : 'flex-end', gap: 4 }}>
                <div style={{
                  maxWidth: '70%',
                  padding: '10px 14px',
                  borderRadius: msg.from === 'lead' ? '4px 18px 18px 18px' : '18px 4px 18px 18px',
                  background: msg.from === 'lead' ? '#fff' : '#DCF8C6',
                  color: '#1a1a1a',
                  fontSize: 14,
                  lineHeight: 1.5,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: msg.from === 'lead' ? '#666' : '#25D366', marginBottom: 4 }}>
                    {msg.from === 'lead' ? '👤 Lead' : '🤖 AI Agent'}
                  </div>
                  {msg.text}
                  <div style={{ fontSize: 10, color: '#888', marginTop: 6, textAlign: 'right' }}>{msg.time}</div>
                </div>
                {msg.summary && (
                  <div style={{ fontSize: 11, color: '#6366f1', background: 'rgba(99,102,241,0.1)', padding: '4px 10px', borderRadius: 8, maxWidth: '70%' }}>
                    💡 {msg.summary}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                <div style={{ background: '#fff', padding: '12px 16px', borderRadius: '4px 18px 18px 18px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                  <span style={{ fontSize: 18 }}>⠋</span> <span style={{ fontSize: 12, color: '#888' }}>Agent is typing…</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center' }}>
            <input
              className="input"
              placeholder={sessionActive ? "Type as the lead…" : "Start a session first"}
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !loading && sendAsLead()}
              disabled={!sessionActive || loading}
              style={{ flex: 1, height: 44 }}
            />
            <button
              onClick={sendAsLead}
              disabled={!sessionActive || loading || !inputMessage.trim()}
              style={{
                width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: sessionActive ? '#25D366' : '#ccc', color: '#fff', fontSize: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >
              ➤
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const labelStyle = {
  display: 'block',
  fontSize: 11,
  fontWeight: 800,
  color: 'var(--text-muted)',
  letterSpacing: 1,
  textTransform: 'uppercase',
  marginBottom: 8,
};

export default WhatsAppSimulator;
