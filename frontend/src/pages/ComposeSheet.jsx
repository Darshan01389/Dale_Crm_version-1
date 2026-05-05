import React, { useState, useEffect } from 'react';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { useToast } from '../contexts/ToastContext';

const CHANNELS = ['WhatsApp', 'SMS', 'Email'];

const MOCK_CONTEXT = {
  lastCall: { time: '2 days ago', summary: 'Budget approved, wants demo by Friday' },
  lastMsg:  { channel: 'WhatsApp', time: 'Yesterday', text: 'Hi, just checking if you got my last message?' },
};

const ComposeSheet = ({ isOpen, onClose, contact, initialChannel = 'WhatsApp', initialDraft = null }) => {
  const { show } = useToast();
  const [channel, setChannel] = useState(initialChannel);
  const [draft, setDraft] = useState(initialDraft);
  const [freeText, setFreeText] = useState('');
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (isOpen && !initialDraft) {
      setLoading(true);
      setTimeout(() => {
        setDraft(`Hi ${contact?.name?.split(' ')[0] || 'there'}, following up on our last conversation. I wanted to confirm if you had any questions about the proposal I sent. Happy to jump on a quick call today if that works!`);
        setLoading(false);
      }, 1200);
    }
  }, [isOpen, contact?.name, initialDraft]);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    if (isOpen) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const regenerate = () => {
    setLoading(true);
    setTimeout(() => {
      setDraft(`${contact?.name?.split(' ')[0] || 'Hi'}, quick follow-up — are you free for a 15-minute call this week? I'd love to walk you through the next steps.`);
      setLoading(false);
    }, 1000);
  };

  const send = () => {
    show({ type: 'success', message: `Message sent via ${channel}.` });
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: 'var(--bg-surface)', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', padding: 24, boxShadow: '0 -8px 40px rgba(0,0,0,0.2)' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <button onClick={onClose} aria-label="Close compose" style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--text-muted)', minHeight: 'auto', minWidth: 'auto', padding: 4 }}>×</button>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Reply to {contact?.name || 'Contact'}</span>
          <div style={{ width: 32 }} />
        </div>

        {/* Channel tabs */}
        <div style={{ display: 'flex', background: 'var(--bg-subtle)', borderRadius: 10, padding: 3, marginBottom: 20 }}>
          {CHANNELS.map(ch => (
            <button key={ch} onClick={() => setChannel(ch)} style={{
              flex: 1, padding: '8px 4px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              background: channel === ch ? 'var(--primary)' : 'transparent',
              color: channel === ch ? 'white' : 'var(--text-muted)',
              transition: 'all 0.15s ease', minHeight: 'auto',
            }}>{ch}</button>
          ))}
        </div>

        {/* AI draft card */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-micro)', letterSpacing: '0.1em', marginBottom: 8 }}>AI SUGGESTED DRAFT</div>
          {loading ? <LoadingSkeleton variant="text" lines={3} /> : (
            <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 14, background: 'var(--bg-subtle)' }}>
              {editing
                ? <textarea value={draft} onChange={e => setDraft(e.target.value)}
                    style={{ width: '100%', border: 'none', background: 'transparent', fontSize: 13, color: 'var(--text)', resize: 'none', outline: 'none', minHeight: 80, fontFamily: 'inherit', lineHeight: 1.6 }} />
                : <p style={{ fontSize: 13, color: 'var(--text)', margin: 0, lineHeight: 1.6 }}>{draft}</p>
              }
            </div>
          )}
          {!loading && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={() => setEditing(!editing)} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: '1px solid var(--border)', background: 'none', fontSize: 13, fontWeight: 600, color: 'var(--text)', cursor: 'pointer', minHeight: 'auto' }}>Edit</button>
              <button onClick={regenerate} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: '1px solid var(--border)', background: 'none', fontSize: 13, fontWeight: 600, color: 'var(--text)', cursor: 'pointer', minHeight: 'auto' }}>Regenerate</button>
              <button onClick={send} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', background: 'var(--primary)', fontSize: 13, fontWeight: 700, color: 'white', cursor: 'pointer', minHeight: 'auto' }}>Send</button>
            </div>
          )}
        </div>

        {/* Recent context */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-micro)', letterSpacing: '0.1em', marginBottom: 8 }}>RECENT CONTEXT</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: 8, marginBottom: 6 }}>
            <span style={{ fontWeight: 700 }}>Voice call · {MOCK_CONTEXT.lastCall.time}</span> — {MOCK_CONTEXT.lastCall.summary}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: 8 }}>
            <span style={{ fontWeight: 700 }}>{MOCK_CONTEXT.lastMsg.channel} · {MOCK_CONTEXT.lastMsg.time}</span> — "{MOCK_CONTEXT.lastMsg.text}"
          </div>
        </div>

        {/* Separator */}
        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-micro)', margin: '16px 0' }}>— or write your own —</div>

        {/* Free form */}
        <textarea
          value={freeText}
          onChange={e => setFreeText(e.target.value)}
          placeholder="Start typing your message…"
          style={{
            width: '100%', minHeight: 100, border: '1.5px dashed var(--border)', borderRadius: 10,
            background: 'transparent', color: 'var(--text)', fontSize: 13, padding: 12,
            fontFamily: 'inherit', lineHeight: 1.6, resize: 'vertical', outline: 'none', boxSizing: 'border-box',
          }}
        />
        {freeText.trim() && (
          <button onClick={send} style={{ marginTop: 10, width: '100%', padding: '12px 0', borderRadius: 10, border: 'none', background: 'var(--primary)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            Send via {channel}
          </button>
        )}
      </div>
    </div>
  );
};

export default ComposeSheet;
