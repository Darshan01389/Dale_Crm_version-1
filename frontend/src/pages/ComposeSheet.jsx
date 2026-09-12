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
  const [proposalData, setProposalData] = useState(null);
  const [proposalTier, setProposalTier] = useState('professional');
  const [proposalLoading, setProposalLoading] = useState(false);

  const token = localStorage.getItem('voiceiq_token');

  useEffect(() => {
    if (isOpen) {
      setChannel(initialChannel);
      setDeliveryStatus(null);
      setFreeText('');
      setEditing(false);
      setProposalData(null);
    }
  }, [isOpen, initialChannel]);

  // Sync draft when channel changes if proposal was generated
  useEffect(() => {
    if (!isOpen) return;
    if (proposalData?.channel_templates?.[channel]) {
      setDraft(proposalData.channel_templates[channel]);
      if (channel === 'Email') {
        setSubject(`Proposal: ${proposalData.tier_recommended} — ${proposalData.company_name}`);
      }
      return;
    }

    if (initialDraft && channel === initialChannel) {
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
  }, [isOpen, contact?.id, channel, initialDraft, initialChannel, proposalData]);

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

  const generateProposal = async (tierToUse) => {
    const targetTier = tierToUse || proposalTier;
    setProposalLoading(true);
    try {
      const res = await fetch('/api/copilot/proposal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          lead_id: contact?.id ? String(contact.id) : null,
          tier: targetTier,
          transcripts: [contact?.notes || '']
        })
      });
      if (!res.ok) throw new Error('Proposal generation failed');
      const data = await res.json();
      setProposalData(data);
      if (data.channel_templates && data.channel_templates[channel]) {
        setDraft(data.channel_templates[channel]);
      }
      if (channel === 'Email') {
        setSubject(`Proposal: ${data.tier_recommended} — ${data.company_name}`);
      }
      show({ type: 'success', message: `✨ Executive Proposal generated for ${data.tier_recommended}!` });
    } catch (err) {
      show({ type: 'error', message: `Proposal generation error: ${err.message}` });
    } finally {
      setProposalLoading(false);
    }
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

        {/* ── FRONTIER PILLAR 4: 1-CLICK PROPOSAL COPILOT ── */}
        <div style={{
          marginBottom: 20,
          borderRadius: 14,
          padding: 16,
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>✨</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                1-Click Executive Proposal Copilot
              </span>
            </div>
            <select
              value={proposalTier}
              onChange={(e) => {
                setProposalTier(e.target.value);
                generateProposal(e.target.value);
              }}
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '4px 8px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'var(--bg-surface)',
                color: 'var(--text)',
                cursor: 'pointer'
              }}
            >
              <option value="starter">Growth Tier (₹25k/mo)</option>
              <option value="professional">Enterprise Tier (₹75k/mo)</option>
              <option value="custom">Autonomous OS (₹1.5L/mo)</option>
            </select>
          </div>

          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 12px 0', lineHeight: 1.4 }}>
            Synthesizes conversation transcripts, BANT criteria, and pricing matrix into an executive-ready proposal.
          </p>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => generateProposal()}
              disabled={proposalLoading}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 8,
                border: 'none',
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                color: 'white',
                fontSize: 12,
                fontWeight: 700,
                cursor: proposalLoading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)'
              }}
            >
              {proposalLoading ? 'Synthesizing Swarm Proposal…' : '⚡ Generate Grounded Proposal'}
            </button>
            {proposalData && (
              <button
                onClick={() => {
                  setProposalData(null);
                  regenerate();
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Reset
              </button>
            )}
          </div>

          {/* Proposal Summary Card */}
          {proposalData && (
            <div style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 10,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              fontSize: 12
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: 800, color: 'var(--text)', fontSize: 13 }}>
                  {proposalData.tier_recommended}
                </span>
                <span style={{ fontWeight: 800, color: 'var(--primary)', background: 'var(--primary-glow)', padding: '2px 8px', borderRadius: 6, fontSize: 11 }}>
                  ACV ₹{(proposalData.annual_contract_value_inr).toLocaleString()}
                </span>
              </div>
              
              {/* BANT Pills */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginBottom: 8 }}>
                {Object.entries(proposalData.bant_qualification_summary || {}).map(([k, v]) => (
                  <div key={k} style={{ padding: '4px 8px', borderRadius: 6, background: 'var(--bg-subtle)', fontSize: 10.5 }}>
                    <strong style={{ color: 'var(--primary)' }}>{k}:</strong> <span style={{ color: 'var(--text-muted)' }}>{v.substring(0, 40)}…</span>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600 }}>
                ✓ {proposalData.roi_projection?.substring(0, 75)}…
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 4, fontStyle: 'italic' }}>
                Proposal draft loaded into {channel} tab below. Ready to review and dispatch.
              </div>
            </div>
          )}
        </div>

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

