import React, { useState } from 'react';

const SetupChecklist = () => {
  const [items, setItems] = useState([
    { id: 'wa', label: 'Connect WhatsApp', hint: 'Sync business conversations', done: true },
    { id: 'sms', label: 'Connect SMS', hint: 'Enable bulk text outreach', done: true },
    { id: 'contacts', label: 'Import Contacts', hint: 'Upload your CSV/Excel list', done: false, recommended: true },
    { id: 'team', label: 'Invite Team', hint: 'Add up to 5 collaborators', done: false },
    { id: 'call', label: 'Make first call', hint: 'Test voice transcription', done: false },
  ]);

  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const doneCount = items.filter(i => i.done).length;

  return (
    <div className="card" style={{ padding: 24, marginBottom: 24, border: '2px solid #E5E7EB' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>Setup Checklist</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>{doneCount} of {items.length} done</span>
            <span style={{ fontSize: 12, color: '#9CA3AF' }}>•</span>
            <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600 }}>Estimated 10 minutes total</span>
          </div>
        </div>
        <button 
          onClick={() => setDismissed(true)}
          style={{ background: 'none', border: 'none', color: '#9CA3AF', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
        >
          Hide
        </button>
      </div>

      <div style={{ height: 6, background: '#F3F4F6', borderRadius: 3, marginBottom: 24, overflow: 'hidden' }}>
        <div style={{ 
          height: '100%', background: 'var(--primary)', 
          width: `${(doneCount / items.length) * 100}%`, transition: 'width 0.4s ease' 
        }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map(item => (
          <div key={item.id} style={{
            display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px',
            borderRadius: 12, background: item.done ? '#F9FAFB' : 'white',
            border: `1px solid ${item.done ? '#F3F4F6' : '#E5E7EB'}`,
            opacity: item.done ? 0.6 : 1
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%', border: `2px solid ${item.done ? 'var(--primary)' : '#D1D5DB'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: item.done ? 'var(--primary)' : 'transparent'
            }}>
              {item.done && <span style={{ color: 'white', fontSize: 14 }}>✓</span>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ 
                fontSize: 14, fontWeight: 800, 
                textDecoration: item.done ? 'line-through' : 'none',
                color: item.done ? '#9CA3AF' : '#111827'
              }}>
                {item.label}
              </div>
              <div style={{ fontSize: 12, color: '#9CA3AF' }}>{item.hint}</div>
            </div>
            {item.recommended && !item.done && (
              <span style={{ 
                padding: '4px 8px', borderRadius: 6, background: '#FEF3C7', 
                color: '#92400E', fontSize: 10, fontWeight: 900 
              }}>
                RECOMMENDED
              </span>
            )}
            {!item.done && (
              <button style={{ 
                background: 'none', border: 'none', color: 'var(--primary)', 
                fontSize: 13, fontWeight: 700, cursor: 'pointer' 
              }}>
                Start →
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SetupChecklist;
