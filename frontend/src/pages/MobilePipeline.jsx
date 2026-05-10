import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import AddContactModal from '../components/AddContactModal';

const STAGE_ORDER = ['New', 'Contacted', 'Proposal', 'Negotiation', 'Closed-Won'];

const DEALS = [
  { id: '1', name: 'Sarah Jenkins',  stage: 'Proposal',     value: '₹4.5L', intent: 'hot',  contactId: '1' },
  { id: '2', name: 'Vikram Nair',    stage: 'Negotiation',  value: '₹8.0L', intent: 'hot',  contactId: '8' },
  { id: '3', name: 'Priya Sharma',   stage: 'Contacted',    value: '₹2.1L', intent: 'risk', contactId: '2' },
  { id: '4', name: 'Rajesh Kumar',   stage: 'New',          value: '₹1.8L', intent: 'std',  contactId: '4' },
  { id: '5', name: 'Arjun Singh',    stage: 'Proposal',     value: '₹3.1L', intent: 'risk', contactId: '6' },
  { id: '6', name: 'Meera Patel',    stage: 'New',          value: '₹5.0L', intent: 'hot',  contactId: '9' },
  { id: '7', name: 'Amit Joshi',     stage: 'Contacted',    value: '₹1.2L', intent: 'std',  contactId: '3' },
  { id: '8', name: 'Deepa Nair',     stage: 'Closed-Won',   value: '₹6.3L', intent: 'hot',  contactId: '5' },
];

const INTENT_DOT = { hot: '#4F46E5', risk: '#B4670F', std: '#777777' };

const MobilePipeline = () => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState({});
  const [showClosed, setShowClosed] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const activeDeals = DEALS.filter(d => d.stage !== 'Closed-Won' && d.stage !== 'Closed-Lost');
  const closedDeals = DEALS.filter(d => d.stage === 'Closed-Won' || d.stage === 'Closed-Lost');
  const totalValue  = activeDeals.reduce((sum, d) => sum + parseFloat(d.value.replace(/[₹L]/g, '')) , 0);

  const grouped = STAGE_ORDER.filter(s => s !== 'Closed-Won').reduce((acc, s) => {
    acc[s] = activeDeals.filter(d => d.stage === s);
    return acc;
  }, {});

  const stageValue = (deals) =>
    '₹' + deals.reduce((s, d) => s + parseFloat(d.value.replace(/[₹L]/g, '')), 0).toFixed(1) + 'L';

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--bg)', position: 'relative' }} className="custom-scroll animate-in">
      <div style={{ padding: '24px 20px 120px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <h1 className="text-h1">My Pipeline</h1>
          <button style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, fontSize: 13, cursor: 'pointer', minHeight: 'auto', minWidth: 'auto', padding: '4px 0' }}>
            Filter
          </button>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28 }}>
          {activeDeals.length} active deals · ₹{totalValue.toFixed(1)}L pipeline value
        </p>

        {activeDeals.length === 0 && (
          <EmptyState variant="B" ctaLabel="Create a deal" onCta={() => setShowModal(true)} />
        )}

        {/* Stage Groups */}
        {STAGE_ORDER.filter(s => s !== 'Closed-Won').map(stage => {
          const deals = grouped[stage] || [];
          if (!deals.length) return null;
          const isExpanded = expanded[stage];
          const visible = isExpanded ? deals : deals.slice(0, 3);
          const hidden  = deals.length - 3;

          return (
            <div key={stage} style={{ marginBottom: 28 }}>
              {/* Stage header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {stage} · {deals.length}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{stageValue(deals)}</span>
              </div>

              {/* Deal rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {visible.map(deal => (
                  <div key={deal.id}
                    onClick={() => navigate(`/leads/${deal.contactId}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'var(--bg-surface)', borderRadius: 10, cursor: 'pointer', minHeight: 44, border: '1px solid var(--border-subtle)' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: INTENT_DOT[deal.intent], flexShrink: 0 }} />
                    <span style={{ flex: 1, fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{deal.name}</span>
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{deal.value}</span>
                  </div>
                ))}
                {!isExpanded && hidden > 0 && (
                  <button
                    onClick={() => setExpanded(p => ({ ...p, [stage]: true }))}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 13, fontWeight: 700, padding: '10px 16px', cursor: 'pointer', textAlign: 'left', minHeight: 'auto' }}>
                    +{hidden} more
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Closed deals toggle */}
        <button
          onClick={() => setShowClosed(p => !p)}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', padding: '8px 0', minHeight: 'auto', display: 'block', marginBottom: 12 }}>
          {showClosed ? 'Hide closed deals ▲' : 'Show closed deals ▼'}
        </button>

        {showClosed && closedDeals.map(deal => (
          <div key={deal.id}
            onClick={() => navigate(`/leads/${deal.contactId}`)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'var(--bg-surface)', borderRadius: 10, cursor: 'pointer', minHeight: 44, border: '1px solid var(--border-subtle)', opacity: 0.6, marginBottom: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4F46E5', flexShrink: 0 }} />
            <span style={{ flex: 1, fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{deal.name}</span>
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{deal.value}</span>
          </div>
        ))}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowModal(true)}
        aria-label="Add new contact"
        style={{ position: 'fixed', bottom: 80, right: 20, width: 56, height: 56, borderRadius: '50%', background: 'var(--primary)', color: 'white', fontSize: 24, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px var(--primary-glow)', minHeight: 'unset', minWidth: 'unset' }}>
        +
      </button>

      {showModal && <AddContactModal onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default MobilePipeline;
