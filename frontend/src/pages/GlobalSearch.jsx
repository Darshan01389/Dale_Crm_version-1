import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const MOCK_RESULTS = {
  contacts: [
    { id: '1', name: 'Savithri Devi', sub: 'TechFlow Inc · Procurement', type: 'contact' },
    { id: '2', name: 'Mohan Kumar', sub: 'Initech Pvt · Director', type: 'contact' },
  ],
  deals: [
    { id: 'd1', name: 'TechFlow Enterprise', sub: '₹12.5L · Negotiation', type: 'deal' },
    { id: 'd2', name: 'Initech CRM Sync', sub: '₹8.0L · Proposal', type: 'deal' },
  ],
  conversations: [
    { id: 'c1', name: 'WhatsApp with Savithri', sub: '“Can you send the PDF by EOD?”', type: 'chat' },
    { id: 'c2', name: 'Call with Mohan', sub: 'Call: 12min — signals: budget approved', type: 'voice' },
  ]
};

const GlobalSearch = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const flatResults = [
    ...MOCK_RESULTS.contacts.map(r => ({ ...r, category: 'CONTACTS' })),
    ...MOCK_RESULTS.deals.map(r => ({ ...r, category: 'DEALS' })),
    ...MOCK_RESULTS.conversations.map(r => ({ ...r, category: 'CONVERSATIONS' })),
  ].filter(r => 
    r.name.toLowerCase().includes(query.toLowerCase()) || 
    r.sub.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % flatResults.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + flatResults.length) % flatResults.length);
      } else if (e.key === 'Enter' && flatResults[selectedIndex]) {
        handleSelect(flatResults[selectedIndex]);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, flatResults, selectedIndex]);

  const handleSelect = (item) => {
    if (item.type === 'contact') navigate(`/leads/${item.id}`);
    else if (item.type === 'deal') navigate(`/kanban`);
    else if (item.type === 'chat' || item.type === 'voice') navigate(`/inbox`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 3000,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '80px 20px'
    }} onClick={onClose}>
      <div style={{
        width: '100%', maxWidth: 600, background: 'var(--bg-surface)', 
        borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border)'
      }} onClick={e => e.stopPropagation()}>
        
        {/* Input area */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>🔍</span>
          <input
            ref={inputRef}
            className="input"
            style={{ border: 'none', background: 'transparent', fontSize: 16, height: 40, outline: 'none' }}
            placeholder="Search contacts, deals, conversations..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        {/* Results */}
        <div style={{ maxHeight: 400, overflowY: 'auto', padding: '12px 0' }} className="custom-scroll">
          {flatResults.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No results found for "{query}"
            </div>
          ) : (
            <div>
              {['CONTACTS', 'DEALS', 'CONVERSATIONS'].map(cat => {
                const catItems = flatResults.filter(r => r.category === cat);
                if (catItems.length === 0) return null;
                return (
                  <div key={cat}>
                    <div style={{ padding: '8px 20px', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{cat}</div>
                    {catItems.map(item => {
                      const globalIdx = flatResults.indexOf(item);
                      const isSelected = globalIdx === selectedIndex;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSelect(item)}
                          onMouseEnter={() => setSelectedIndex(globalIdx)}
                          style={{
                            padding: '12px 20px', cursor: 'pointer',
                            background: isSelected ? 'var(--bg-subtle)' : 'transparent',
                            display: 'flex', alignItems: 'center', gap: 14,
                            borderLeft: isSelected ? '4px solid var(--primary)' : '4px solid transparent',
                          }}
                        >
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                            {item.type === 'contact' ? '👤' : item.type === 'deal' ? '💰' : item.type === 'chat' ? '💬' : '📞'}
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{item.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.sub}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg-subtle)', display: 'flex', gap: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            <span style={{ padding: '2px 4px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 4, marginRight: 4 }}>↵</span> to select
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            <span style={{ padding: '2px 4px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 4, marginRight: 4 }}>↑↓</span> to navigate
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            <span style={{ padding: '2px 4px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 4, marginRight: 4 }}>esc</span> to close
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;
