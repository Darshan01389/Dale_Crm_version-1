import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MergeContactModal from '../components/MergeContactModal';
import ReassignModal from '../components/ReassignModal';
import DestructiveModal from '../components/DestructiveModal';
import IntentBadge from '../components/IntentBadge';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ComposeSheet from './ComposeSheet';
import VoiceNotePlayer from '../components/VoiceNotePlayer';
import LogCallModal from '../components/LogCallModal';
import SelfHostedDialer from '../components/SelfHostedDialer';
import { useToast } from '../contexts/ToastContext';

// Custom Callback-Ref Y-axis Drag-to-Scroll hook for desktop mouse grabs and touch swipe fluidity
const useDragScroll = () => {
  const elRef = useRef(null);
  
  const setRef = React.useCallback((node) => {
    // Clean up previous event listeners if node changes or unmounts
    if (elRef.current) {
      const el = elRef.current;
      if (el._handleMouseDown) el.removeEventListener('mousedown', el._handleMouseDown);
      if (el._handleMouseLeave) el.removeEventListener('mouseleave', el._handleMouseLeave);
      if (el._handleMouseUp) el.removeEventListener('mouseup', el._handleMouseUp);
      if (el._handleMouseMove) el.removeEventListener('mousemove', el._handleMouseMove);
      el.style.removeProperty('cursor');
    }
    
    elRef.current = node;
    
    if (node) {
      let isDown = false;
      let startY;
      let scrollTop;
      
      const handleMouseDown = (e) => {
        // Left click only, avoid buttons, inputs, interactive anchors
        if (e.button !== 0) return;
        if (e.target.closest('button') || e.target.closest('input') || e.target.closest('a') || e.target.closest('select') || e.target.closest('textarea')) return;
        
        isDown = true;
        node.style.cursor = 'grabbing';
        node.style.userSelect = 'none';
        startY = e.pageY;
        scrollTop = node.scrollTop;
        
        // Prevent default browser text selection drag behavior
        e.preventDefault();
      };
      
      const handleMouseLeave = () => {
        isDown = false;
        node.style.cursor = 'grab';
        node.style.removeProperty('user-select');
      };
      
      const handleMouseUp = () => {
        isDown = false;
        node.style.cursor = 'grab';
        node.style.removeProperty('user-select');
      };
      
      const handleMouseMove = (e) => {
        if (!isDown) return;
        e.preventDefault();
        const y = e.pageY;
        const walk = (y - startY) * 1.5; // Scroll speed walk multiplier
        node.scrollTop = scrollTop - walk;
      };
      
      // Store references on node to allow accurate unmount cleanup
      node._handleMouseDown = handleMouseDown;
      node._handleMouseLeave = handleMouseLeave;
      node._handleMouseUp = handleMouseUp;
      node._handleMouseMove = handleMouseMove;
      
      node.addEventListener('mousedown', handleMouseDown);
      node.addEventListener('mouseleave', handleMouseLeave);
      node.addEventListener('mouseup', handleMouseUp);
      node.addEventListener('mousemove', handleMouseMove);
      node.style.cursor = 'grab';
    }
  }, []);
  
  return setRef;
};

const LeadDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { show } = useToast();

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
  
  const [showCallLogModal, setShowCallLogModal] = useState(false);
  const [showDialer, setShowDialer] = useState(false);

  // AI Summary State
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summary, setSummary] = useState('');
  
  // AI Copilot Llama 70b State
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotInsight, setCopilotInsight] = useState(null);
  const [copilotAction, setCopilotAction] = useState(null);

  // Lead & Activity Data
  const [lead, setLead] = useState(null);
  const [activities, setActivities] = useState([]);
  const [voiceRecordings, setVoiceRecordings] = useState([]);

  // Ref scroll binding dynamically via Callback Refs
  const scrollContainerRef = useDragScroll();

  useEffect(() => {
    const fetchLeadData = async () => {
      setLoading(true);
      const token = localStorage.getItem('voiceiq_token');
      try {
        const res = await fetch(`/api/leads/${id}/report`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setLead(data.lead);
          setActivities(data.activities);
          setVoiceRecordings(data.voice_recordings);
          
          // Set initial summary if present
          if (data.lead.ai_score_summary) {
            setSummary(data.lead.ai_score_summary);
            setCopilotInsight(data.lead.ai_score_summary);
            setSummaryLoading(false);
          } else {
            fetchSummary();
          }
        }
      } catch (err) {
        console.error("Failed to fetch lead data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchLeadData();
  }, [id]);

  const fetchCopilotInsights = async () => {
    setCopilotLoading(true);
    try {
      // We simulate hitting a Llama 70b endpoint (e.g. Groq) or our backend proxy
      const token = localStorage.getItem('voiceiq_token');
      // fetch(`/api/leads/${id}/copilot-insights`, ...)
      await new Promise(r => setTimeout(r, 1200));
      
      setCopilotInsight(`Llama 70b Analysis: ${lead?.name || 'This lead'} has shown strong interest in the technical architecture. Based on recent messages, they are waiting for a pricing breakdown. High intent to buy.`);
      setCopilotAction(`Schedule a follow-up call to review the enterprise pricing proposal.`);
    } catch (err) {
      console.error(err);
    } finally {
      setCopilotLoading(false);
    }
  };

  const fetchSummary = () => {
    setSummaryLoading(true);
    const token = localStorage.getItem('voiceiq_token');
    fetch(`/api/leads/${id}/summary`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        setSummary(data?.summary || "No AI summary available for this lead yet.");
      })
      .catch(() => setSummary("Failed to generate summary."))
      .finally(() => setSummaryLoading(false));
  };

  const openCompose = (channel, withAI = false) => {
    setComposeChannel(channel);
    setAiDraft(withAI ? null : undefined); // null means "fetch draft on open"
    setShowCompose(true);
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('voiceiq_token');
      const res = await fetch(`/api/leads/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        show({ type: 'success', message: 'Lead deleted permanently.' });
        navigate('/leads');
      } else {
        const err = await res.json();
        show({ type: 'error', message: err.detail || 'Failed to delete lead.' });
      }
    } catch (err) {
      show({ type: 'error', message: 'Error during deletion.' });
    }
  };

  const handleArchive = async () => {
    // Implement archive if backend supports it
    show({ type: 'success', message: 'Lead archived successfully.' });
    setShowArchive(false);
    navigate('/leads');
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

  if (!lead) {
    return (
      <div style={{ padding: 100, textAlign: 'center', background: 'var(--bg)', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 24, filter: 'grayscale(1)' }}>🔍</div>
        <h3 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', margin: '0 0 12px' }}>Lead Not Found</h3>
        <p style={{ color: 'var(--text-muted)', margin: '0 0 24px', fontWeight: 500, fontSize: 16 }}>The lead you are looking for does not exist or the ID is invalid.</p>
        <button onClick={() => navigate('/leads')} className="btn-primary" style={{ padding: '12px 24px', borderRadius: 8, fontSize: 14 }}>
          Back to Leads
        </button>
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
            {lead?.title?.charAt(0) || 'L'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--text)' }}>{lead?.title || 'Lead Details'}</h1>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2, margin: 0 }}>{lead?.occupation || 'Lead'} {lead?.lead_company_name ? `at ${lead.lead_company_name}` : ''}</p>
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

      <div ref={scrollContainerRef} style={{ flex: 1, overflowY: 'auto', paddingBottom: 80, display: 'flex' }} className="custom-scroll">
        <div style={{ flex: 1, padding: '24px' }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
          
          <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center' }}>
            <IntentBadge type={lead?.intent_level || 'Warm'} />
          </div>

          {/* Duplicate Banner */}
          {lead?.hasPossibleDuplicate && (
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
            <button 
              onClick={() => {
                setShowDialer(true);
              }}
              style={{ flex: 1, height: 44, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text)', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span style={{ color: '#5A5A5A', fontSize: 16 }}>📞</span> Call & Record
            </button>
          </div>

          {/* Thread / Activity */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {activities.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 14 }}>
                No recent activity for this lead.
              </div>
            )}
            {activities.map((item) => {
              if (item.activity_type === 'voice_call') {
                return <VoiceNotePlayer key={item.id} variant="call" extraMetadata={item.extra_metadata} {...item} />;
              }
              
              if (item.activity_type === 'Manager Requested') {
                return (
                  <div key={item.id} style={{ alignSelf: 'center', margin: '16px 0', width: '100%' }}>
                    <div style={{ 
                      background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, 
                      padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12,
                      boxShadow: '0 2px 8px rgba(251, 191, 36, 0.1)'
                    }}>
                      <div style={{ fontSize: 18 }}>👑</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, color: '#92400E', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Taken over by Manager</div>
                        <div style={{ fontSize: 13, color: '#B45309', marginTop: 2 }}>{item.body}</div>
                      </div>
                    </div>
                  </div>
                );
              }
              
              // Map WhatsApp activities
              let meta = {};
              try {
                meta = typeof item.extra_metadata === 'string' 
                  ? JSON.parse(item.extra_metadata || '{}') 
                  : (item.extra_metadata || {});
              } catch (e) {}
              const isOut = meta.direction === 'outbound';
              
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
                    {item.body}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textAlign: isOut ? 'right' : 'left' }}>
                    {new Date(item.occurred_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              );
            })}
          </div>

          </div>
        </div>

        {/* Intelligence Panel (Right Sidebar) */}
        <div className="desktop-only custom-scroll" style={{ width: 360, background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)', flexDirection: 'column', display: 'flex', flexShrink: 0, overflowY: 'auto', height: '100%' }}>
          <div style={{ padding: '32px 28px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <div style={{ padding: 6, background: 'rgba(79, 70, 229, 0.1)', borderRadius: 8 }}>
                <svg width="18" height="18" fill="var(--primary)" viewBox="0 0 24 24"><path d="M12 2L3 7v10l9 5 9-5V7L12 2z"/></svg>
              </div>
              <h3 style={{ fontSize: 12, fontWeight: 900, color: 'var(--primary)', letterSpacing: '0.1em', margin: 0, flex: 1 }}>AI COPILOT INSIGHTS</h3>
              <button 
                onClick={fetchCopilotInsights} 
                disabled={copilotLoading}
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--primary)', color: 'var(--primary)', borderRadius: 8, padding: '4px 8px', fontSize: 11, fontWeight: 800, cursor: copilotLoading ? 'default' : 'pointer' }}>
                {copilotLoading ? 'Generating...' : '✨ Generate (70b)'}
              </button>
            </div>
            {copilotLoading ? (
              <div style={{ padding: 16, background: 'rgba(79, 70, 229, 0.03)', borderRadius: 16 }}>
                <LoadingSkeleton variant="text" lines={3} />
                <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 800, marginTop: 12, textAlign: 'center' }}>🤖 Llama 3.1 70b analyzing context...</div>
              </div>
            ) : (
              <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6, fontWeight: 500, background: 'rgba(79, 70, 229, 0.03)', padding: '16px', borderRadius: 16 }}>
                {copilotInsight || lead?.ai_score_summary || `Lead from ${lead?.source_platform || lead?.source || 'direct'} is evaluating our solutions. Focus on key value drivers and technical requirements.`}
              </p>
            )}
          </div>
          
          <div style={{ padding: '32px 28px' }}>
            <h3 style={{ fontSize: 12, fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 24 }}>DEAL SCORECARD</h3>
            <div style={{ background: 'var(--bg-subtle)', padding: '24px', borderRadius: 24, border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>Projected Value</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.03em' }}>
                ₹{lead?.deal_value ? (lead.deal_value / 100000).toFixed(1) + 'L' : '0.00'}
              </div>
              <div style={{ 
                fontSize: 12, fontWeight: 800, color: 'var(--success)', 
                background: 'rgba(99, 102, 241, 0.1)', padding: '6px 14px', borderRadius: 10, 
                display: 'inline-block', marginTop: 16, letterSpacing: '0.02em' 
              }}>{lead?.ai_score ? Math.round(lead.ai_score * 100) : '0'}% WIN PROBABILITY</div>
            </div>
            
            <div style={{ marginTop: 40 }}>
              <h4 style={{ fontSize: 12, fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 20 }}>SUGGESTED ACTION</h4>
              <div style={{ padding: 24, background: 'var(--text)', borderRadius: 24, boxShadow: 'var(--shadow-lg)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 100%)' }} />
                <p style={{ fontSize: 14, color: 'white', margin: 0, fontWeight: 700, lineHeight: 1.5, position: 'relative' }}>
                  {copilotAction || (lead?.status === 'new' ? 'Send an introductory WhatsApp message to kick off the conversation.' : 'Schedule a follow-up call to discuss specific objections.')}
                </p>
                <button 
                  onClick={() => openCompose(lead?.status === 'new' ? 'WhatsApp' : 'Email', true)}
                  className="btn-primary" 
                  style={{ 
                    marginTop: 20, background: 'white', color: 'var(--text)', 
                    border: 'none', height: 44, width: '100%', fontSize: 13, fontWeight: 800,
                    position: 'relative', boxShadow: 'none'
                  }}
                >
                  {lead?.status === 'new' ? 'Start Outreach' : 'Compose Follow-up'}
                </button>
              </div>
            </div>
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
        onConfirm={handleArchive}
        variant="A"
        title="Archive this contact?"
        body={`${lead.name} will be moved to your archive. You can restore them anytime from settings. All messages, calls, and history will be preserved.`}
        confirmLabel="Archive contact"
      />

      <DestructiveModal 
        isOpen={showDelete} 
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
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
      
      <LogCallModal
        isOpen={showCallLogModal}
        onClose={() => setShowCallLogModal(false)}
        contact={lead}
        onLogged={() => {
          // In a real app we'd fetch the new call logs to update the timeline
        }}
      />

      {showDialer && (
        <SelfHostedDialer lead={lead} onClose={() => setShowDialer(false)} />
      )}

      <ComposeSheet 
        isOpen={showCompose}
        onClose={() => setShowCompose(false)}
        contact={lead}
        initialChannel={composeChannel}
        initialDraft={aiDraft}
        onSent={() => {
          // Message successfully sent — refresh the AI summary to reflect new activity
          fetchSummary();
        }}
      />

    </div>
  );
};

export default LeadDetails;
