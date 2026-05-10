import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useUser } from '../contexts/UserContext';
import AddContactModal from '../components/AddContactModal';

const MOCK_LEADS = [
  { id: '1', name: 'Sarah Jenkins', company: 'TechFlow Inc', phone: '+91 98765 43210', stage: 'Negotiation', intent: 'high', value: '₹4.5L', source: 'WhatsApp', lastContact: '2h ago' },
  { id: '2', name: 'Michael Chen', company: 'Logis Co', phone: '+91 91234 56789', stage: 'Proposal', intent: 'high', value: '₹12.0L', source: 'Call', lastContact: '1d ago' },
  { id: '3', name: 'Priya Patel', company: 'FinServ Ltd', phone: '+91 94567 89012', stage: 'Contacted', intent: 'standard', value: '₹2.2L', source: 'Email', lastContact: '3d ago' },
  { id: '4', name: 'Rajesh Kumar', company: 'RetailMax', phone: '+91 97890 12345', stage: 'New', intent: 'risk', value: '₹1.8L', source: 'LinkedIn', lastContact: '12d ago' },
  { id: '5', name: 'Emily Davis', company: 'Aurora Tech', phone: '+91 99012 34567', stage: 'Closed-Won', intent: 'high', value: '₹6.0L', source: 'Referral', lastContact: '5d ago' },
  { id: '6', name: 'Arjun Singh', company: 'Globex Corp', phone: '+91 93456 78901', stage: 'New', intent: 'risk', value: '₹3.1L', source: 'WhatsApp', lastContact: '15d ago' },
  { id: '7', name: 'Lisa Wong', company: 'NexGen Systems', phone: '+91 90234 56789', stage: 'Contacted', intent: 'standard', value: '₹5.5L', source: 'Call', lastContact: '7d ago' },
  { id: '8', name: 'Vikram Nair', company: 'Initech Pvt', phone: '+91 95678 90123', stage: 'Proposal', intent: 'high', value: '₹8.0L', source: 'Email', lastContact: '4h ago' },
];

const intentBadge = {
  high: { label: 'High Intent', cls: 'badge-high-intent' },
  risk: { label: 'At Risk', cls: 'badge-at-risk' },
  standard: { label: 'Standard', cls: 'badge-standard' },
};

const stageColors = {
  'New': '#D1D5DB', 'Contacted': '#93C5FD', 'Proposal': '#60A5FA',
  'Negotiation': '#2563EB', 'Closed-Won': '#4F46E5', 'Closed-Lost': '#9CA3AF',
};

const Leads = () => {
  const navigate = useNavigate();
  const { profile } = useUser();
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('All');
  const [intentFilter, setIntentFilter] = useState('All');
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Map API lead fields → UI fields
  const normalizeLeads = (raw) => raw.map(l => {
    // status → stage label
    const statusMap = {
      new: 'New', contacted: 'Contacted', proposal: 'Proposal',
      negotiation: 'Negotiation', won: 'Closed-Won', lost: 'Closed-Lost',
      qualified: 'Proposal', cold: 'Contacted'
    };
    // ai_score → intent
    let intent = 'standard';
    if (l.ai_score != null) {
      if (l.ai_score >= 70) intent = 'high';
      else if (l.ai_score <= 35) intent = 'risk';
    } else if (l.sentiment_label === 'positive') intent = 'high';
    else if (l.sentiment_label === 'negative') intent = 'risk';

    // last_contacted_at → relative time string
    let lastContact = 'Never';
    if (l.last_contacted_at) {
      const diff = Date.now() - new Date(l.last_contacted_at).getTime();
      const hrs = Math.floor(diff / 3600000);
      if (hrs < 24) lastContact = `${hrs}h ago`;
      else lastContact = `${Math.floor(hrs / 24)}d ago`;
    }

    // deal_value → formatted ₹ string
    const val = l.deal_value ?? 0;
    const valStr = val >= 100000
      ? `₹${(val / 100000).toFixed(1)}L`
      : `₹${(val / 1000).toFixed(0)}K`;

    return {
      id: l.id,
      name: l.title || l.name || 'Unknown',
      company: l.company || '—',
      phone: l.phone || '—',
      stage: statusMap[l.status] || l.status || 'New',
      intent,
      value: valStr,
      source: l.source || '—',
      lastContact,
      email: l.email,
    };
  });

  useEffect(() => {
    const loadLeads = async () => {
      try {
        const token = localStorage.getItem('voiceiq_token');
        const res = await fetch('/api/leads', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const d = await res.json();
          setLeads(d.length ? normalizeLeads(d) : MOCK_LEADS);
          return;
        }
      } catch {}
      setLeads(MOCK_LEADS);
    };
    loadLeads();
  }, []);

  const filtered = leads.filter(l => {
    const q = search.toLowerCase();
    if (q && !l.name?.toLowerCase().includes(q) && !l.company?.toLowerCase().includes(q)) return false;
    if (stageFilter !== 'All' && l.stage !== stageFilter) return false;
    if (intentFilter !== 'All' && l.intent !== intentFilter) return false;
    return true;
  });

  const stages = ['All', 'New', 'Contacted', 'Proposal', 'Negotiation', 'Closed-Won'];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }} className="animate-in">
      <div style={{ padding: '32px 32px 0' }}>
        <h1 className="text-h1" style={{ margin: 0 }}>Leads Pipeline</h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8, fontWeight: 500 }}>Manage your active prospects and deal progression</p>
      </div>

      {/* Toolbar */}
      <div className="glass" style={{ 
        padding: '24px 32px', borderBottom: '1px solid var(--border)', 
        background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', 
        gap: 20, flexShrink: 0, flexWrap: 'wrap', zIndex: 20,
        marginTop: 20
      }}>
        <div style={{ position: 'relative', width: 300 }}>
          <svg style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
            width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            placeholder="Search leads, companies..."
            className="input"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 44, height: 44 }}
          />
        </div>

        <div style={{ display: 'flex', gap: 10, background: 'var(--bg-subtle)', padding: 6, borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
          {stages.slice(0, 4).map(s => (
            <button key={s} onClick={() => setStageFilter(s)} style={{
              padding: '8px 18px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              border: 'none',
              background: stageFilter === s ? 'var(--primary)' : 'transparent',
              color: stageFilter === s ? 'white' : 'var(--text-muted)',
              transition: 'all 0.2s ease'
            }}>{s}</button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {[{ k: 'All', l: 'All Intent' }, { k: 'high', l: '🔥 High' }, { k: 'risk', l: '⚠️ Risk' }].map(({ k, l }) => (
            <button key={k} onClick={() => setIntentFilter(k)} style={{
              padding: '8px 18px', borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              border: '1px solid var(--border-subtle)',
              background: intentFilter === k ? 'var(--primary)' : 'var(--bg-surface)',
              color: intentFilter === k ? 'white' : 'var(--text-muted)',
              transition: 'all 0.2s ease',
              boxShadow: intentFilter === k ? '0 4px 12px var(--primary-glow)' : 'var(--shadow-sm)'
            }}>{l}</button>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, marginRight: 12 }}>{filtered.length} leads found</span>
          
          {(profile?.role === 'Owner / Admin' || profile?.role === 'Team Lead') && (
            <button 
              onClick={async () => {
                try {
                  const token = localStorage.getItem('voiceiq_token');
                  const leadIds = filtered.map(l => l.id);
                  await axios.post('/api/leads/distribute-ai', { lead_ids: leadIds }, {
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  alert('Leads distributed via AI matching!');
                } catch (err) {
                  alert('Error distributing leads. Ensure you have teams and reps assigned.');
                }
              }} 
              className="btn-secondary" 
              style={{ height: 44, padding: '0 20px', border: '1px solid var(--primary)', color: 'var(--primary)' }}
            >
              🪄 AI Distribute
            </button>
          )}

          <button onClick={() => { setSelected(null); setShowModal(true); }} className="btn-primary" style={{ height: 44, padding: '0 24px' }}>
            <span style={{ marginRight: 8 }}>+</span> Add Lead
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 32px 32px' }} className="custom-scroll">
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
          <thead style={{ position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 10 }}>
            <tr>
              {['Prospect', 'Company', 'Status', 'AI Signal', 'Value', 'Last Activity', ''].map(h => (
                <th key={h} style={{ padding: '20px 24px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(lead => (
              <tr key={lead.id}
                style={{ 
                  background: 'var(--bg-surface)', 
                  cursor: 'pointer', 
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: 'var(--shadow-sm)'
                }}
                className="hover-lift"
              >
                <td style={{ padding: '20px 24px', borderRadius: '16px 0 0 16px', border: '1px solid var(--border-subtle)', borderRight: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ 
                      width: 44, height: 44, borderRadius: 14, background: 'var(--primary)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      fontSize: 14, fontWeight: 800, color: 'white', flexShrink: 0,
                      boxShadow: '0 4px 10px var(--primary-glow)'
                    }}>
                      {lead.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 15 }}>{lead.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, marginTop: 2 }}>Lead ID: #{lead.id}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '20px 24px', color: 'var(--text)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', fontWeight: 600 }}>{lead.company}</td>
                <td style={{ padding: '20px 24px', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ 
                    fontSize: 11, fontWeight: 800, color: stageColors[lead.stage] || 'var(--text-muted)', 
                    background: (stageColors[lead.stage] || '#6B7280') + '15', 
                    padding: '6px 12px', borderRadius: 8, letterSpacing: '0.02em'
                  }}>
                    {lead.stage.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '20px 24px', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ 
                    padding: '6px 12px', borderRadius: 8, 
                    background: lead.intent === 'high' ? 'rgba(99, 102, 241, 0.1)' : lead.intent === 'risk' ? 'rgba(217, 119, 6, 0.1)' : 'var(--bg-subtle)',
                    color: lead.intent === 'high' ? 'var(--success)' : lead.intent === 'risk' ? 'var(--owner-accent)' : 'var(--text-muted)',
                    fontSize: 11, fontWeight: 800, letterSpacing: '0.02em'
                  }}>
                    {intentBadge[lead.intent]?.label.toUpperCase() || lead.intent.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '20px 24px', fontWeight: 800, color: 'var(--text)', fontSize: 16, borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>{lead.value}</td>
                <td style={{ padding: '20px 24px', color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>{lead.lastContact}</td>
                <td style={{ padding: '20px 24px', borderRadius: '0 16px 16px 0', border: '1px solid var(--border-subtle)', borderLeft: 'none', textAlign: 'right' }}>
                  <button 
                    onClick={(e) => { e.stopPropagation(); navigate(`/leads/${lead.id}`); }}
                    className="btn-secondary" 
                    style={{ height: 36, padding: '0 16px', fontSize: 12, fontWeight: 700 }}
                  >
                    Open Profile
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: 100, textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 24, filter: 'grayscale(1)' }}>🔍</div>
            <h3 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', margin: '0 0 12px' }}>No matches found</h3>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontWeight: 500, fontSize: 16 }}>Try adjusting your filters or search terms.</p>
          </div>
        )}
      </div>


      {/* Lead detail modal (Add/Edit) */}
      <AddContactModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
      />

      {/* Mobile FAB */}
      <button 
        className="mobile-only"
        onClick={() => { setSelected(null); setShowModal(true); }}
        style={{
          position: 'fixed', bottom: 80, right: 20, width: 56, height: 56,
          borderRadius: '50%', background: 'var(--primary)', color: 'white',
          border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
          zIndex: 1000, cursor: 'pointer'
        }}
      >
        +
      </button>
    </div>
  );
};

export default Leads;
