import React, { useState, useEffect } from 'react';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { useToast } from '../contexts/ToastContext';

const CHANNELS = ['WhatsApp', 'SMS', 'Email'];

const ComposeSheet = ({ isOpen, onClose, contact, initialChannel = 'WhatsApp', initialDraft = null, onSent }) => {
  const { show } = useToast();
  const [channel, setChannel] = useState(initialChannel);
  const [draft, setDraft] = useState('');
  const [freeText, setFreeText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [editing, setEditing] = useState(false);
  const [subject, setSubject] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState(null); // null | 'sent' | 'failed'

  const token = localStorage.getItem('voiceiq_token');

  useEffect(() => {
    if (!isOpen) {
      setDeliveryStatus(null);
      setFreeText('');
      setEditing(false);
      return;
    }
    setChannel(initialChannel);
    if (initialDraft) {
      setDraft(initialDraft);
      return;
    }
    // Fetch AI draft from the backend for any channel
    if (contact?.id) {
      setLoading(true);
      fetch(`/api/leads/${contact.id}/ai-suggest?channel=${channel.toLowerCase()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          setDraft(data?.draft || `Hi ${(contact?.title || contact?.name)?.split(' ')[0] || 'there'}, following up via ${channel} — happy to answer any questions!`);
          if (channel === 'Email' && data?.subject) {
            setSubject(data.subject);
          } else if (channel === 'Email') {
            setSubject(`Follow up: ${contact?.title || 'Our conversation'}`);
          }
        })
        .catch(() => {
          setDraft(`Hi ${(contact?.title || contact?.name)?.split(' ')[0] || 'there'}, following up via ${channel} — happy to answer any questions!`);
          if (channel === 'Email') setSubject('Re: Next Steps');
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, contact?.id, channel]);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    if (isOpen) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const regenerate = () => {
    if (!contact?.id) return;
    setLoading(true);
    fetch(`/api/leads/${contact.id}/ai-suggest?channel=${channel.toLowerCase()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        setDraft(data?.draft || draft);
        if (channel === 'Email' && data?.subject) setSubject(data.subject);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  /**
   * THE REAL SEND — handles both DB logging and external redirection
   */
  const send = async (messageOverride) => {
    const messageToSend = messageOverride || (editing || !draft ? freeText : draft);
    if (!messageToSend?.trim()) return;

    if (!contact?.id) {
      show({ type: 'error', message: 'Cannot send: lead ID is missing.' });
      return;
    }

    setSending(true);
    setDeliveryStatus(null);

    try {
      // 1. Log the activity in our CRM first (all channels)
      const res = await fetch(`/api/leads/${contact.id}/whatsapp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        // We reuse the WhatsApp endpoint or could create generic activity endpoint
        // For simplicity, we use the WhatsApp endpoint logic for logging.
        body: JSON.stringify({ 
          message: messageToSend, 
          purpose: channel.toLowerCase() // track which channel was used
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Logging failed');
      }

      // 2. Perform external redirection
      const phone = contact.phone?.replace(/[^0-9]/g, '') || '';
      const email = contact.email || '';
      const encodedMsg = encodeURIComponent(messageToSend);

      if (channel === 'WhatsApp') {
        window.open(`https://wa.me/${phone}?text=${encodedMsg}`, '_blank');
      } else if (channel === 'SMS') {
        window.location.href = `sms:${phone}?body=${encodedMsg}`;
      } else if (channel === 'Email') {
        const encodedSubject = encodeURIComponent(subject || 'Following up');
        window.location.href = `mailto:${email}?subject=${encodedSubject}&body=${encodedMsg}`;
      }

      setDeliveryStatus('sent');
      show({
        type: 'success',
        message: `✅ Message logged & redirected to ${channel}!`,
      });

      // Notify parent to refresh
      onSent?.();
      setTimeout(() => onClose?.(), 1500);
    } catch (err) {
      setDeliveryStatus('failed');
      show({ type: 'error', message: `Failed: ${err.message}` });
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: 'var(--bg-surface)', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', padding: 24, boxShadow: '0 -8px 40px rgba(0,0,0,0.2)' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <button onClick={onClose} aria-label="Close compose" style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--text-muted)', minHeight: 'auto', minWidth: 'auto', padding: 4 }}>×</button>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
            Message {contact?.title || contact?.name || 'Contact'}
          </span>
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

        {/* Delivery status badge */}
        {deliveryStatus && (
          <div style={{
            padding: '10px 14px', borderRadius: 10, marginBottom: 16,
            background: deliveryStatus === 'sent' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${deliveryStatus === 'sent' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: deliveryStatus === 'sent' ? '#10B981' : '#EF4444',
            fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
          }}>
            {deliveryStatus === 'sent' ? '✅ Sent & saved to interaction chart' : '❌ Delivery failed — check WhatsApp config'}
          </div>
        )}

        {/* AI draft card */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-micro)', letterSpacing: '0.1em', marginBottom: 8 }}>
            AI SUGGESTED DRAFT {contact?.id ? '(Llama 3.1 powered)' : ''}
          </div>
          {loading ? <LoadingSkeleton variant="text" lines={3} /> : (
            <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 14, background: 'var(--bg-subtle)' }}>
              {channel === 'Email' && (
                <div style={{ marginBottom: 12, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Subject</label>
                  {editing 
                    ? <input value={subject} onChange={e => setSubject(e.target.value)} style={{ width: '100%', border: 'none', background: 'transparent', fontSize: 13, fontWeight: 700, outline: 'none' }} />
                    : <div style={{ fontSize: 13, fontWeight: 700 }}>{subject}</div>
                  }
                </div>
              )}
              {editing
                ? <textarea value={draft} onChange={e => setDraft(e.target.value)}
                    style={{ width: '100%', border: 'none', background: 'transparent', fontSize: 13, color: 'var(--text)', resize: 'none', outline: 'none', minHeight: 80, fontFamily: 'inherit', lineHeight: 1.6 }} />
                : <p style={{ fontSize: 13, color: 'var(--text)', margin: 0, lineHeight: 1.6 }}>{draft}</p>
              }
            </div>
          )}
            {!loading && (
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button onClick={() => setEditing(!editing)} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: '1px solid var(--border)', background: 'none', fontSize: 13, fontWeight: 600, color: 'var(--text)', cursor: 'pointer', minHeight: 'auto' }}>
                  {editing ? 'Done editing' : 'Edit'}
                </button>
                <button onClick={regenerate} disabled={loading} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: '1px solid var(--border)', background: 'none', fontSize: 13, fontWeight: 600, color: 'var(--text)', cursor: 'pointer', minHeight: 'auto' }}>Regenerate</button>
                <button onClick={() => send(draft)} disabled={sending || !draft} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', background: sending ? '#ccc' : 'var(--primary)', fontSize: 13, fontWeight: 700, color: 'white', cursor: sending ? 'default' : 'pointer', minHeight: 'auto' }}>
                  {sending ? 'Sending…' : 'Send ✓'}
                </button>
              </div>
            )}
          </div>

        {/* Separator */}
        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-micro)', margin: '16px 0' }}>— or write your own —</div>

        {/* Free form */}
        <textarea
          value={freeText}
          onChange={e => setFreeText(e.target.value)}
          placeholder={`Start typing your ${channel} message…`}
          style={{
            width: '100%', minHeight: 100, border: '1.5px dashed var(--border)', borderRadius: 10,
            background: 'transparent', color: 'var(--text)', fontSize: 13, padding: 12,
            fontFamily: 'inherit', lineHeight: 1.6, resize: 'vertical', outline: 'none', boxSizing: 'border-box',
          }}
        />
        {freeText.trim() && (
          <button onClick={() => send(freeText)} disabled={sending} style={{ marginTop: 10, width: '100%', padding: '12px 0', borderRadius: 10, border: 'none', background: sending ? '#ccc' : 'var(--primary)', color: 'white', fontSize: 14, fontWeight: 700, cursor: sending ? 'default' : 'pointer' }}>
            {sending ? 'Sending…' : `Send via ${channel} ✓`}
          </button>
        )}
      </div>
    </div>
  );
};

export default ComposeSheet;

