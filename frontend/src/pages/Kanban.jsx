import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AddDealModal from '../components/AddDealModal';

const STAGES = [
  { name: 'New', key: 'new', color: '#D1D5DB', bg: '#F9FAFB' },
  { name: 'Discovery', key: 'discovery', color: '#93C5FD', bg: '#EFF6FF' },
  { name: 'Proposal', key: 'proposal', color: '#60A5FA', bg: '#DBEAFE' },
  { name: 'Negotiation', key: 'negotiation', color: '#2563EB', bg: '#BFDBFE' },
  { name: 'Closed Won', key: 'won', color: '#10B981', bg: '#D1FAE5' },
  { name: 'Closed Lost', key: 'lost', color: '#EF4444', bg: '#FEE2E2' },
];

const intentDot = {
  high: { color: '#10B981', label: 'Hot' },
  risk: { color: '#F59E0B', label: 'Risk' },
  standard: { color: '#6B7280', label: 'Std' },
  unknown: { color: '#9CA3AF', label: '?' },
};

const Kanban = () => {
  const navigate = useNavigate();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState(null);
  const [filter, setFilter] = useState({ rep: 'All Reps', intent: 'All' });
  const [expandedStages, setExpandedStages] = useState(['New', 'Discovery', 'Proposal']);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('voiceiq_token');
      const res = await axios.get('/api/deals', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeals(res.data);
    } catch (err) {
      console.error("Error fetching deals:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = deals.filter(d => {
    if (filter.intent !== 'All' && (d.intent || 'unknown') !== filter.intent) return false;
    return true;
  });

  const totalVolume = filtered.reduce((acc, d) => acc + (d.amount || 0), 0);

  const byStage = (stageKey) => filtered.filter(d => d.stage_key === stageKey);

  const toggleStage = (stage) => {
    setExpandedStages(prev => 
      prev.includes(stage) ? prev.filter(s => s !== stage) : [...prev, stage]
    );
  };

  const handleDragStart = (e, deal) => {
    setDragging(deal);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = async (e, stageKey) => {
    e.preventDefault();
    if (!dragging || dragging.stage_key === stageKey) return;

    // Optimistic update
    const oldDeals = [...deals];
    setDeals(prev => prev.map(d => d.id === dragging.id ? { ...d, stage_key: stageKey } : d));

    try {
      const token = localStorage.getItem('voiceiq_token');
      await axios.patch(`/api/deals/${dragging.id}`, { stage_key: stageKey }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error("Error updating deal stage:", err);
      setDeals(oldDeals); // Rollback
    }
    setDragging(null);
  };

  if (loading) return <div style={{ padding: 40 }}>Loading Pipeline...</div>;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#F9FAFB', overflow: 'hidden' }} className="kanban-view">
      <style>{`
        @media (max-width: 768px) {
          .kanban-container { flex-direction: column !important; padding: 16px !important; overflow-y: auto !important; }
          .kanban-col { min-width: 100% !important; width: 100% !important; margin-bottom: 12px; }
          .kanban-header-desktop { display: none !important; }
          .kanban-header-mobile { display: flex !important; flex-direction: column; padding: 16px; border-bottom: 1px solid var(--border); background: white; }
          .filter-row { display: none !important; }
        }
        @media (min-width: 769px) {
          .kanban-header-mobile { display: none !important; }
        }
      `}</style>

      {/* Desktop Header */}
      <div className="kanban-header-desktop" style={{ padding: '24px 30px', background: '#FFFFFF', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: '#111827' }}>Pipeline Management</h2>
          <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#6B7280' }}>{filtered.length} DEALS</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--primary)' }}>₹{(totalVolume / 100000).toFixed(1)}L TOTAL VALUE</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn-secondary" style={{ padding: '10px 18px', borderRadius: 10, fontWeight: 700 }}>Export</button>
          <button className="btn-primary" onClick={() => setShowAddModal(true)} style={{ padding: '10px 18px', borderRadius: 10, fontWeight: 700 }}>+ New Deal</button>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="kanban-header-mobile">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 20, fontWeight: 900 }}>My Pipeline</h2>
          <button onClick={() => setShowAddModal(true)} style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '50%', width: 36, height: 36, fontSize: 20 }}>+</button>
        </div>
        <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4, fontWeight: 600 }}>{filtered.length} deals • ₹{(totalVolume / 100000).toFixed(1)}L</div>
      </div>

      {/* Filter row */}
      <div className="filter-row" style={{ padding: '12px 30px', borderBottom: '1px solid var(--border)', background: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <div style={{ display: 'flex', background: '#F3F4F6', padding: 4, borderRadius: 8 }}>
          {['All Reps', 'My Deals'].map(r => (
            <button key={r} onClick={() => setFilter(f => ({ ...f, rep: r }))} style={{
              padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none',
              background: filter.rep === r ? '#FFFFFF' : 'transparent',
              color: filter.rep === r ? '#111827' : '#6B7280',
            }}>{r}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ k: 'All', l: 'ALL' }, { k: 'high', l: 'HOT' }, { k: 'risk', l: 'AT RISK' }].map(({ k, l }) => (
            <button key={k} onClick={() => setFilter(f => ({ ...f, intent: k }))} style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 800, cursor: 'pointer', border: '1.5px solid var(--border)',
              background: filter.intent === k ? 'var(--primary)' : 'white',
              color: filter.intent === k ? 'white' : '#6B7280',
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Kanban columns */}
      <div className="kanban-container custom-scroll" style={{ flex: 1, display: 'flex', gap: 20, padding: '24px 30px', overflowX: 'auto', overflowY: 'hidden' }}>
        {STAGES.map(stage => {
          const cards = byStage(stage.key);
          const stageValue = cards.reduce((acc, d) => acc + (d.amount || 0), 0);
          const isExpanded = expandedStages.includes(stage.name);
          
          return (
            <div key={stage.key}
              className="kanban-col"
              onDragOver={e => e.preventDefault()}
              onDrop={e => handleDrop(e, stage.key)}
              style={{
                minWidth: 300, width: 300, flexShrink: 0,
                display: 'flex', flexDirection: 'column',
                background: '#F3F4F6', borderRadius: 16, overflow: 'hidden',
              }}
            >
              {/* Column header */}
              <div 
                onClick={() => window.innerWidth <= 768 && toggleStage(stage.name)}
                style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: stage.bg, flexShrink: 0, cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: stage.color }} />
                  <span style={{ fontSize: 11, fontWeight: 900, color: '#111827', letterSpacing: 1 }}>{stage.name.toUpperCase()}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                   <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                     <span style={{ fontSize: 12, fontWeight: 800, color: '#111827' }}>₹{(stageValue / 100000).toFixed(1)}L</span>
                     <span style={{ fontSize: 10, fontWeight: 700, color: '#6B7280' }}>{cards.length}</span>
                   </div>
                   <span className="mobile-only" style={{ fontSize: 12, opacity: 0.5 }}>{isExpanded ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Cards - Accordion for mobile */}
              <div style={{ 
                flex: 1, overflowY: 'auto', padding: 12, 
                display: (isExpanded || window.innerWidth > 768) ? 'block' : 'none' 
              }} className="custom-scroll">
                {cards.map(deal => (
                  <div key={deal.id}
                    draggable
                    onDragStart={e => handleDragStart(e, deal)}
                    onClick={() => navigate(`/leads/${deal.lead_id || ''}`)}
                    className="deal-card"
                    style={{
                      background: 'white', borderRadius: 12, padding: 16, marginBottom: 12,
                      border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                      cursor: 'grab', transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 4, fontSize: 8, fontWeight: 900, letterSpacing: '0.5px',
                        background: (intentDot[deal.intent] || intentDot.unknown).color + '15',
                        color: (intentDot[deal.intent] || intentDot.unknown).color,
                        border: `1px solid ${(intentDot[deal.intent] || intentDot.unknown).color}30`,
                      }}>{(deal.intent || 'STANDARD').toUpperCase()}</span>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 4 }}>{deal.title}</div>
                    <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, marginBottom: 12 }}>{deal.lead_name || 'Direct Deal'}</div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F3F4F6', paddingTop: 12 }}>
                      <span style={{ fontSize: 16, fontWeight: 900, color: '#111827' }}>₹{((deal.amount || 0) / 100000).toFixed(1)}L</span>
                      <div style={{ width: 24, height: 24, borderRadius: 12, background: 'var(--primary)', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'white' }}>{(deal.title || 'D')[0]}</div>
                    </div>
                  </div>
                ))}
                {cards.length === 0 && (
                  <div style={{ padding: '20px', textAlign: 'center', fontSize: 12, color: '#9CA3AF', fontWeight: 600 }}>EMPTY</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <AddDealModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        onSuccess={fetchDeals}
      />

      {/* Mobile FAB */}
      <button 
        className="mobile-only"
        onClick={() => setShowAddModal(true)}
        style={{
          position: 'fixed', bottom: 80, right: 20, width: 56, height: 56,
          borderRadius: '50%', background: 'var(--primary)', color: 'white',
          border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
          zIndex: 1000
        }}
      >
        +
      </button>
    </div>
  );
};

export default Kanban;
