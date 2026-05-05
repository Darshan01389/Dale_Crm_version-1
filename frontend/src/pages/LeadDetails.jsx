import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MergeContactModal from '../components/MergeContactModal';
import ReassignModal from '../components/ReassignModal';
import DestructiveModal from '../components/DestructiveModal';
import IntentBadge from '../components/IntentBadge';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ComposeSheet from './ComposeSheet';
import VoiceNotePlayer from '../components/VoiceNotePlayer';

const LeadDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('Activity');
  const [showMenu, setShowMenu] = useState(false);
  
  // Modals & Sheets
  const [showMerge, setShowMerge] = useState(false);
  const [showReassign, setShowReassign] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [composeChannel, setComposeChannel] = useState('WhatsApp');
  const [aiDraft, setAiDraft] = useState(null);

  // AI Summary State
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summary, setSummary] = useState('');

  const lead = {
    id: id || '1',
    name: 'Sarah Jenkins',
    company: 'TechFlow Inc',
    role: 'Procurement Manager',
    email: 'sarah.j@techflow.io',
    phone: '+91 98765 43210',
    status: 'Negotiation',
    intent: 'HIGH_INTENT',
    hasPossibleDuplicate: true,
  };

  const activity = [
    { id: 1, type: 'voice_call', duration: '4:12', timestamp: '2h ago', signals: [{ label: 'PRICING OBJECTION', type: 'negative', timestamp: 0.3 }], transcript: "Sarah asked about pricing bands..." },
    { id: 2, type: 'wa', text: '“Can you send the PDF by EOD?”', time: '5h ago', dir: 'in' },
    { id: 3, type: 'voice_note', dir: 'outbound', duration: '0:45', timestamp: '1d ago', transcript: "Hi Sarah, sending over the PDF now." },
    { id: 4, type: 'email', title: 'Email Sent', text: 'Introductory deck and case studies.', time: '2d ago' },
  ];

  useEffect(() => {
    // Initial fetch mock
    setTimeout(() => {
      setLoading(false);
      fetchSummary();
    }, 800);
  }, []);

  const fetchSummary = () => {
    setSummaryLoading(true);
    setTimeout(() => {
      setSummary("Sarah is evaluating a multi-channel CRM integration for her procurement team. She specifically mentioned WhatsApp sync as a deal-breaker. Price sensitive but highly engaged.");
      setSummaryLoading(false);
    }, 1200);
  };

  const openCompose = (channel, withAI = false) => {
    setComposeChannel(channel);
    setAiDraft(withAI ? null : undefined); // null means "fetch draft on open"
    setShowCompose(true);
  };

  if (loading) {
    return (
      <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
          <LoadingSkeleton variant="row" lines={1} />
        </div>
        <div style={{ marginBottom: 32 }}>
          <LoadingSkeleton variant="card" lines={3} />
        </div>
        <LoadingSkeleton variant="row" lines={3} />
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)', position: 'relative' }}>
      
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text)' }}>←</button>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: 'white' }}>
            SJ
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--text)' }}>{lead.name}</h1>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2, margin: 0 }}>{lead.role} at {lead.company}</p>
          </div>
        </div>
        
        {/* Overflow Menu */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowMenu(!showMenu)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)', padding: 8 }}>
            ···
          </button>
          {showMenu && (
            <div style={{ position: 'absolute', right: 0, top: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--shadow-md)', width: 180, zIndex: 100, overflow: 'hidden' }}>
              <button onClick={() => { setShowMenu(false); setShowReassign(true); }} style={{ width: '100%', textAlign: 'left', padding: '12px 16px', background: 'none', border: 'none', borderBottom: '1px solid var(--border-subtle)', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--text)' }}>Reassign to…</button>
              <button onClick={() => { setShowMenu(false); setShowArchive(true); }} style={{ width: '100%', textAlign: 'left', padding: '12px 16px', background: 'none', border: 'none', borderBottom: '1px solid var(--border-subtle)', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--text)' }}>Archive contact</button>
              <button onClick={() => { setShowMenu(false); setShowDelete(true); }} style={{ width: '100%', textAlign: 'left', padding: '12px 16px', background: 'none', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--danger)' }}>Delete contact</button>
            </div>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }} className="custom-scroll">
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
          
          <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center' }}>
            <IntentBadge type={lead.intent} />
          </div>

          {/* Duplicate Banner */}
          {lead.hasPossibleDuplicate && (
            <div style={{ background: '#FFF3DB', border: '1px solid #B4670F', borderRadius: 12, padding: '12px 16px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#B4670F', marginBottom: 2 }}>⚠ Possible duplicate detected</div>
                <div style={{ fontSize: 12, color: '#92540c' }}>DaleIQ found a contact with the same phone number.</div>
              </div>
              <button onClick={() => setShowMerge(true)} style={{ background: 'none', border: 'none', fontSize: 13, fontWeight: 700, color: '#B4670F', cursor: 'pointer', textDecoration: 'underline' }}>
                Review →
              </button>
            </div>
          )}

          {/* AI Summary Card */}
          <div style={{ background: '#F2F6FA', border: '1px solid #B5D4F4', borderRadius: 12, padding: '16px', marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#185FA5', letterSpacing: '0.08em', marginBottom: 8, textTransform: 'uppercase' }}>AI SUMMARY</div>
            {summaryLoading ? (
              <LoadingSkeleton variant="text" lines={2} />
            ) : (
              <p style={{ fontSize: 13, color: 'var(--text)', margin: '0 0 12px', lineHeight: 1.6 }}>{summary}</p>
            )}
            <div style={{ textAlign: 'right' }}>
              <button onClick={fetchSummary} disabled={summaryLoading} style={{ background: 'none', border: 'none', fontSize: 12, fontWeight: 700, color: '#185FA5', cursor: summaryLoading ? 'default' : 'pointer', textDecoration: 'underline' }}>
                Regenerate
              </button>
            </div>
          </div>

          {/* Channel Quick-Action Row */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
            <button onClick={() => openCompose('WhatsApp')} style={{ flex: 1, height: 44, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text)', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span style={{ color: '#25D366', fontSize: 16 }}>WA</span>
            </button>
            <button onClick={() => openCompose('SMS')} style={{ flex: 1, height: 44, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text)', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span style={{ color: '#5A5A5A', fontSize: 16 }}>SMS</span>
            </button>
            <button onClick={() => openCompose('Email')} style={{ flex: 1, height: 44, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text)', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span style={{ color: '#5A5A5A', fontSize: 16 }}>Email</span>
            </button>
            <button style={{ flex: 1, height: 44, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text)', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span style={{ color: '#5A5A5A', fontSize: 16 }}>Log Call</span>
            </button>
          </div>

          {/* Thread / Activity */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {activity.map((item) => {
              if (item.type === 'voice_note' && item.dir === 'inbound') {
                return <VoiceNotePlayer key={item.id} variant="inbound" {...item} />;
              }
              if (item.type === 'voice_note' && item.dir === 'outbound') {
                return <VoiceNotePlayer key={item.id} variant="outbound" {...item} />;
              }
              if (item.type === 'voice_call') {
                return <VoiceNotePlayer key={item.id} variant="call" {...item} />;
              }
              // Generic message bubble
              const isOut = item.dir === 'out';
              return (
                <div key={item.id} style={{ alignSelf: isOut ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                  <div style={{
                    padding: '12px 16px', borderRadius: 16,
                    background: isOut ? 'var(--primary)' : 'var(--bg-surface)',
                    color: isOut ? 'white' : 'var(--text)',
                    fontSize: 14, lineHeight: 1.5,
                    borderBottomRightRadius: isOut ? 4 : 16,
                    borderBottomLeftRadius: !isOut ? 4 : 16,
                    border: isOut ? 'none' : '1px solid var(--border-subtle)',
                    boxShadow: isOut ? '0 4px 12px var(--primary-glow)' : 'var(--shadow-sm)'
                  }}>
                    {item.text}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textAlign: isOut ? 'right' : 'left' }}>
                    {item.time}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* Fixed Compose Bar */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 56, background: 'var(--bg)', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, zIndex: 50 }}>
        <div 
          onClick={() => openCompose('WhatsApp')}
          style={{ flex: 1, height: 36, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '0 16px', display: 'flex', alignItems: 'center', color: 'var(--text-muted)', fontSize: 14, cursor: 'text' }}>
          Type a message…
        </div>
        <button 
          onClick={() => openCompose('WhatsApp', true)}
          style={{ height: 36, padding: '0 16px', borderRadius: 18, border: 'none', background: 'var(--primary)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px var(--primary-glow)' }}>
          ✨ AI Suggest
        </button>
      </div>

      <MergeContactModal isOpen={showMerge} onClose={() => setShowMerge(false)} contact1={lead} />
      <ReassignModal isOpen={showReassign} onClose={() => setShowReassign(false)} contactName={lead.name} />
      
      <DestructiveModal 
        isOpen={showArchive} 
        onClose={() => setShowArchive(false)}
        variant="A"
        title="Archive this contact?"
        body={`${lead.name} will be moved to your archive. You can restore them anytime from settings. All messages, calls, and history will be preserved.`}
        confirmLabel="Archive contact"
      />

      <DestructiveModal 
        isOpen={showDelete} 
        onClose={() => setShowDelete(false)}
        variant="B"
        title="Permanently delete contact?"
        deletedItems={[
          "Contact record", 
          "All messages across WhatsApp, SMS, Email", 
          "Voice call recordings + transcripts", 
          "Deal value from pipeline"
        ]}
        confirmLabel="Permanently delete"
      />

      <ComposeSheet 
        isOpen={showCompose}
        onClose={() => setShowCompose(false)}
        contact={lead}
        initialChannel={composeChannel}
        initialDraft={aiDraft}
      />

    </div>
  );
};

export default LeadDetails;
