import React, { useState, useEffect, useRef } from 'react';
import ComposeModal from '../components/ComposeModal';
import IntentBadge from '../components/IntentBadge';
import EmptyState from '../components/EmptyState';
import LoadingSkeleton from '../components/LoadingSkeleton';
import LogCallModal from '../components/LogCallModal';
import VoiceNotePlayer from '../components/VoiceNotePlayer';

// Deterministic modern styling colors
const ModernColors = ['#4F46E5', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

// Reusable vertical Callback-Ref Drag-to-Scroll hook for mice & touch gestures
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

const GlobalInbox = () => {
  const [contacts, setContacts] = useState([]);
  const [active, setActive] = useState(null);
  const [msg, setMsg] = useState('');
  const [threads, setThreads] = useState({});
  const [channel, setChannel] = useState('WhatsApp');
  const [sortTab, setSortTab] = useState('Intent');
  const [view, setView] = useState('list'); // 'list' or 'thread'
  const [showAI, setShowAI] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [loading, setLoading] = useState(true);
  const [pullY, setPullY] = useState(0);
  
  const [showCallLogModal, setShowCallLogModal] = useState(false);

  // AI draft states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDraft, setAiDraft] = useState('');
  
  // AI Copilot Llama 70b State
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotInsight, setCopilotInsight] = useState(null);
  const [copilotAction, setCopilotAction] = useState(null);

  // Bind drag-to-scroll vertical scrolling dynamically via Callback Refs
  const contactsRef = useDragScroll();
  const messagesRef = useDragScroll();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadData = async () => {
    const token = sessionStorage.getItem('voiceiq_token') || localStorage.getItem('voiceiq_token');
    if (!token) return;

    try {
      // 1. Fetch all leads
      const leadsRes = await fetch('/api/leads', { headers: { Authorization: `Bearer ${token}` } });
      const rawLeads = leadsRes.ok ? await leadsRes.json() : [];

      // 2. Fetch recent activities to preview last messages
      const activitiesRes = await fetch('/api/activities?limit=100', { headers: { Authorization: `Bearer ${token}` } });
      const rawActivities = activitiesRes.ok ? await activitiesRes.json() : [];

      // Map last activities by lead ID
      const lastActivityMap = {};
      rawActivities.forEach(act => {
        if (act.lead_id && !lastActivityMap[act.lead_id]) {
          lastActivityMap[act.lead_id] = act;
        }
      });

      // Normalize into UI friendly structure
      const normalized = rawLeads.map(l => {
        // Initials
        const words = (l.title || 'Unknown').split(' ');
        const initials = words.map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'L';

        // Deterministic color
        const charCodeSum = (l.title || '').split('').reduce((sum, c) => sum + c.charCodeAt(0), 0);
        const color = ModernColors[charCodeSum % ModernColors.length];

        // Find last preview message
        const lastAct = lastActivityMap[l.id];
        const lastMsg = lastAct ? lastAct.body : (l.notes || 'No message history yet.');

        // Format relative time badge
        let time = 'Never';
        let timestamp = 0;
        const dateSource = lastAct ? lastAct.occurred_at : (l.last_contacted_at || l.created_at);
        if (dateSource) {
          timestamp = new Date(dateSource).getTime();
          const diff = Date.now() - timestamp;
          const mins = Math.floor(diff / 60000);
          const hrs = Math.floor(diff / 3600000);
          if (mins < 60) time = mins <= 1 ? 'Just now' : `${mins}m ago`;
          else if (hrs < 24) time = `${hrs}h ago`;
          else time = `${Math.floor(hrs / 24)}d ago`;
        }

        // AI Intent
        let intent = 'standard';
        if (l.ai_score != null) {
          if (l.ai_score >= 70 || l.ai_score >= 0.7) intent = 'high';
          else if (l.ai_score <= 35 || l.ai_score <= 0.35) intent = 'risk';
        } else if (l.sentiment_label === 'positive') intent = 'high';
        else if (l.sentiment_label === 'negative') intent = 'risk';

        return {
          id: l.id,
          name: l.title || 'Unknown',
          phone: l.phone || '',
          initials,
          color,
          lastMsg,
          time,
          unread: 0, // default
          intent,
          risk: l.risk_flag ? 'risk' : 'standard',
          channel: lastAct ? (lastAct.activity_type === 'whatsapp' ? 'WhatsApp' : lastAct.activity_type === 'email' ? 'Email' : lastAct.activity_type === 'sms' ? 'SMS' : 'voice') : 'WhatsApp',
          timestamp
        };
      });

      setContacts(normalized);
      
      // Auto-set the first lead as active if none is selected
      if (normalized.length > 0) {
        setActive(prev => {
          const stillExists = normalized.find(c => c.id === prev?.id);
          return stillExists || normalized[0];
        });
      }
    } catch (err) {
      console.error("Error loading inbox leads:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchThread = async (leadId) => {
    const token = sessionStorage.getItem('voiceiq_token') || localStorage.getItem('voiceiq_token');
    if (!token || !leadId) return;

    try {
      const res = await fetch(`/api/leads/${leadId}/report`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();

        // Sort activities chronologically
        const sortedActs = [...data.activities].sort((a, b) => new Date(a.occurred_at) - new Date(b.occurred_at));

        // Map to UI chat bubble shape
        const mappedMsgs = sortedActs.map(act => {
          const meta = JSON.parse(act.extra_metadata || '{}');
          
          let dir = 'in'; // default to inbound
          if (meta.direction === 'inbound' || meta.direction === 'in') {
            dir = 'in';
          } else if (meta.direction === 'outbound' || meta.direction === 'out') {
            dir = 'out';
          } else {
            // Heuristic fallbacks
            if (act.subject?.toLowerCase().includes('agent message')) {
              dir = 'out';
            }
          }

          const timeStr = new Date(act.occurred_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          return {
            id: act.id,
            dir,
            text: act.body,
            time: timeStr,
            channel: act.activity_type === 'whatsapp' ? 'WhatsApp' : act.activity_type === 'email' ? 'Email' : act.activity_type === 'sms' ? 'SMS' : 'voice',
            timestamp: new Date(act.occurred_at).getTime()
          };
        });

        setThreads(prev => ({
          ...prev,
          [leadId]: mappedMsgs
        }));
      }
    } catch (err) {
      console.error("Error loading conversation timeline:", err);
    }
  };

  const fetchCopilotInsights = async () => {
    if (!active) return;
    setCopilotLoading(true);
    setShowAI(true);
    try {
      const token = localStorage.getItem('voiceiq_token');
      // Simulate Llama 70b API
      await new Promise(r => setTimeout(r, 1200));
      setCopilotInsight(`Llama 70b Analysis: ${active.name} has shown strong interest in the technical architecture. Based on recent messages, they are waiting for a pricing breakdown. High intent to buy.`);
      setCopilotAction(`Schedule a follow-up call to review the enterprise pricing proposal.`);
    } catch (err) {
      console.error(err);
    } finally {
      setCopilotLoading(false);
    }
  };

  const fetchAiDraft = async () => {
    if (!active) return;
    setAiLoading(true);
    setAiDraft('');
    const token = sessionStorage.getItem('voiceiq_token') || localStorage.getItem('voiceiq_token');
    try {
      const res = await fetch(`/api/leads/${active.id}/ai-suggest?channel=${channel.toLowerCase()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAiDraft(data.draft || '');
      }
    } catch (err) {
      console.error("Failed to generate AI suggestion:", err);
    } finally {
      setAiLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  // Poll for inbox thread history updates when selection changes
  useEffect(() => {
    if (active) {
      fetchThread(active.id);
      // If AI Suggestions bar is open, refresh suggestions
      if (showAI) {
        fetchAiDraft();
      }
    }
  }, [active, channel]);

  // Load AI draft on toggle
  useEffect(() => {
    if (showAI && active) {
      fetchAiDraft();
    }
  }, [showAI]);

  // Auto polling refresh every 15 seconds to fetch inbound simulated messages
  useEffect(() => {
    const timer = setInterval(() => {
      loadData();
      if (active) {
        fetchThread(active.id);
      }
    }, 15000);
    return () => clearInterval(timer);
  }, [active]);

  const handleTouchStart = (e) => {
    if (window.scrollY === 0) {
      setPullY(e.touches[0].clientY);
    }
  };

  const handleTouchEnd = (e) => {
    if (pullY > 0 && e.changedTouches[0].clientY - pullY > 100) {
      setLoading(true);
      loadData().then(() => setLoading(false));
    }
    setPullY(0);
  };

  const send = async () => {
    if (!msg.trim() || !active) return;
    const currentMsg = msg;
    setMsg(''); // clear instantly

    const token = sessionStorage.getItem('voiceiq_token') || localStorage.getItem('voiceiq_token');
    try {
      let res;
      if (channel === 'WhatsApp') {
        res = await fetch(`/api/leads/${active.id}/whatsapp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ message: currentMsg, purpose: 'outreach' })
        });
      } else {
        // SMS, Email generic activities
        res = await fetch('/api/activities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            activity_type: channel === 'Email' ? 'email' : channel === 'SMS' ? 'sms' : 'note',
            lead_id: active.id,
            subject: `${channel} outreach`,
            body: currentMsg,
            extra_metadata: JSON.stringify({ direction: 'outbound' })
          })
        });
      }

      if (res.ok) {
        // Refresh timeline instantly
        await fetchThread(active.id);
        // Refresh contact list preview
        await loadData();
      }
    } catch (err) {
      console.error("Error dispatching message:", err);
    }
  };

  const handleSelect = (contact) => {
    setActive(contact);
    if (window.innerWidth <= 768) {
      setView('thread');
    }
  };

  const [emailSubject, setEmailSubject] = useState('');

  const handleSimulateInboundEmail = async () => {
    if (!active) return;
    try {
      const token = sessionStorage.getItem('voiceiq_token') || localStorage.getItem('voiceiq_token');
      const sender = `${active.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@enterprise.com`;
      await fetch('/api/activities/email-inbound', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          lead_id: active.id,
          sender_email: sender,
          subject: `Re: Dale CRM Enterprise Rollout`,
          body: `Hi team, we reviewed the live battlecards and softphone features. This fits our requirements nicely. Can you confirm if you support custom SSO integrations and what the onboarding timeline is?`
        })
      });
      await fetchThread(active.id);
      await loadData();
    } catch (err) {
      console.error("Error simulating inbound email:", err);
    }
  };

  const handleSmartDraft = () => {
    if (!active) return;
    if (channel === 'Email') {
      setEmailSubject(`Dale CRM Enterprise Proposal & Next Steps for ${active.name}`);
      setMsg(`Dear ${active.name},\n\nThank you for exploring Dale CRM. Based on our review, our native WhatsApp automation and Softphone capabilities can accelerate your team's pipeline conversion by up to 30%.\n\nI've attached our technical architecture whitepaper and pricing tiers. Would you be open to a 15-minute walkthrough this week?\n\nBest regards,\nEnterprise Sales Team\nDale CRM`);
    } else {
      setMsg(`Hi ${active.name}! Just following up on our earlier discussion regarding Dale CRM. Would you like a quick 5-min demo walkthrough today?`);
    }
  };

  const applyAISuggestion = (text) => {
    setMsg(text);
    setShowAI(false);
  };

  const sortedContacts = [...contacts].sort((a, b) => {
    if (sortTab === 'Intent') return (b.intent === 'high' ? 1 : 0) - (a.intent === 'high' ? 1 : 0);
    if (sortTab === 'Risk') return (b.risk === 'risk' ? 1 : 0) - (a.risk === 'risk' ? 1 : 0);
    if (sortTab === 'Recent') return b.timestamp - a.timestamp;
    if (sortTab === 'Channel') return a.channel.localeCompare(b.channel);
    return 0;
  });

  const messages = active ? (threads[active.id] || []) : [];

  return (
    <div style={{ height: '100%', display: 'flex', overflow: 'hidden', background: 'var(--bg)' }} className="animate-in">
      <style>{`
        :root {
          --whatsapp-bg: var(--bg-subtle);
          --whatsapp-pattern: none;
          --whatsapp-out-bg: #EAE3FC;
          --whatsapp-out-text: #2c1a52;
          --whatsapp-in-bg: #ffffff;
          --whatsapp-in-text: #0f172a;
          --whatsapp-border: #e2e8f0;
        }
        
        .dark {
          --whatsapp-bg: var(--bg-subtle);
          --whatsapp-pattern: none;
          --whatsapp-out-bg: #2e244d;
          --whatsapp-out-text: #ede9fe;
          --whatsapp-in-bg: #1e1e24;
          --whatsapp-in-text: #eeeeee;
          --whatsapp-border: #2d3340;
        }

        .whatsapp-bubble {
          position: relative;
          padding: 8px 14px 8px 14px;
          border-radius: 12px;
          font-size: 14px;
          line-height: 1.5;
          box-shadow: 0 1px 1px rgba(0, 0, 0, 0.08);
          max-width: 100%;
          word-wrap: break-word;
          display: flex;
          flex-direction: column;
          gap: 4px;
          transition: all 0.2s ease;
        }

        .whatsapp-bubble.out-bubble {
          background: var(--whatsapp-out-bg);
          color: var(--whatsapp-out-text);
          border-top-right-radius: 0;
        }

        .whatsapp-bubble.in-bubble {
          background: var(--whatsapp-in-bg);
          color: var(--whatsapp-in-text);
          border-top-left-radius: 0;
          border: 1px solid var(--whatsapp-border);
        }

        .whatsapp-bubble.out-bubble::after {
          content: '';
          position: absolute;
          right: -8px;
          top: 0;
          width: 0;
          height: 0;
          border-top: 8px solid var(--whatsapp-out-bg);
          border-right: 8px solid transparent;
        }

        .whatsapp-bubble.in-bubble::after {
          content: '';
          position: absolute;
          left: -8px;
          top: 0;
          width: 0;
          height: 0;
          border-top: 8px solid var(--whatsapp-in-bg);
          border-left: 8px solid transparent;
        }

        .whatsapp-bubble.in-bubble::after {
          border-top-color: var(--whatsapp-border);
          left: -9px;
        }

        .whatsapp-bubble.in-bubble::before {
          content: '';
          position: absolute;
          left: -8px;
          top: 0;
          width: 0;
          height: 0;
          border-top: 8px solid var(--whatsapp-in-bg);
          border-left: 8px solid transparent;
          z-index: 1;
        }
      `}</style>

      {/* Contact list (Left Panel) */}
      <div 
        className={view === 'thread' ? 'desktop-only' : ''}
        style={{ 
          display: view === 'thread' ? undefined : 'flex',
          width: isMobile ? '100%' : 400, 
          borderRight: '1px solid var(--border)', 
          background: 'var(--bg-surface)', 
          flexDirection: 'column', 
          flexShrink: 0,
          position: 'relative',
          zIndex: 20
        }}
      >
        <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
            <h1 className="text-h1" style={{ fontSize: 24, flex: 1, margin: 0, fontWeight: 800 }}>Global Inbox</h1>
            <button 
              onClick={() => setShowCompose(true)}
              className="btn-primary" 
              style={{ width: 38, height: 38, borderRadius: 12, padding: 0, justifyContent: 'center' }}
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
              </svg>
            </button>
          </div>
          
          {/* Search Bar */}
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="input" 
              style={{ paddingLeft: 40, height: 38, fontSize: 13.5, borderRadius: 10 }}
            />
            <svg style={{ position: 'absolute', left: 14, top: 10, color: 'var(--text-muted)' }} width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>

          {/* Sort Tabs */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }} className="hide-scroll">
            {['Intent', 'Risk', 'Recent', 'Channel'].map(t => (
              <button
                key={t}
                onClick={() => setSortTab(t)}
                style={{
                  padding: '6px 12px', fontSize: 12.5, fontWeight: sortTab === t ? 700 : 500,
                  whiteSpace: 'nowrap', cursor: 'pointer', border: 'none',
                  background: 'transparent',
                  color: sortTab === t ? 'var(--primary)' : 'var(--text-muted)',
                  borderBottom: sortTab === t ? '2px solid var(--primary)' : '2px solid transparent',
                  transition: 'all 0.2s ease',
                  letterSpacing: '0.01em',
                  marginBottom: -1,
                  borderRadius: 0,
                  minWidth: 'auto',
                  minHeight: 'auto'
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        
        <div 
          ref={contactsRef}
          style={{ overflowY: 'auto', flex: 1 }} 
          className="custom-scroll"
          onTouchStart={isMobile ? handleTouchStart : undefined}
          onTouchEnd={isMobile ? handleTouchEnd : undefined}
        >
          {loading ? (
            <div style={{ padding: 20 }}>
              <LoadingSkeleton variant="row" lines={5} />
            </div>
          ) : sortedContacts.length === 0 ? (
            <EmptyState variant="A" />
          ) : (
            sortedContacts.map(c => (
            <div key={c.id} onClick={() => handleSelect(c)} className="inbox-row" style={{ 
              background: active?.id === c.id ? 'rgba(124, 58, 237, 0.06)' : 'transparent', 
              padding: '16px 20px',
              borderLeft: active?.id === c.id ? '4px solid var(--primary)' : '4px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              gap: 14,
              borderBottom: '1px solid var(--border-subtle)'
            }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ 
                  width: 48, height: 48, borderRadius: 14, background: c.color, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  fontSize: 16, fontWeight: 855, color: 'white',
                  boxShadow: active?.id === c.id ? `0 6px 14px ${c.color}33` : 'none',
                  transform: active?.id === c.id ? 'scale(1.03)' : 'scale(1)',
                  transition: 'all 0.2s'
                }}>
                  {c.initials}
                </div>
                {c.unread > 0 && (
                  <span style={{ 
                    position: 'absolute', top: -3, right: -3, minWidth: 20, height: 20, 
                    borderRadius: 10, background: 'var(--primary)', fontSize: 10, fontWeight: 800, 
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    border: '2px solid white', boxShadow: 'var(--shadow-sm)' 
                  }}>
                    {c.unread}
                  </span>
                )}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>{c.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{c.time}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ 
                    fontSize: 13, color: c.unread > 0 ? 'var(--text)' : 'var(--text-muted)', 
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, 
                    fontWeight: c.unread > 0 ? 700 : 500 
                  }}>
                    {c.lastMsg}
                  </span>
                  {c.intent === 'high' ? <IntentBadge type="HIGH_INTENT" /> : c.risk === 'risk' ? <IntentBadge type="AT_RISK" /> : <IntentBadge type="STANDARD" />}
                </div>
              </div>
            </div>
          )))}
        </div>
      </div>

      {/* Thread (Main Panel) */}
      <div 
        className={view === 'list' ? 'desktop-only' : ''}
        style={{ display: view === 'list' ? undefined : 'flex', flex: 1, flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-subtle)' }}
      >
        {active ? (
          <>
            {/* Thread header */}
            <div style={{ 
              padding: '16px 24px', borderBottom: '1px solid var(--border)', 
              background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0,
              zIndex: 10,
              boxShadow: 'var(--shadow)'
            }}>
              <button 
                className="mobile-only" 
                onClick={() => setView('list')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 10, marginRight: -6 }}
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="var(--text)" strokeWidth="3"><path d="M15 19l-7-7 7-7"/></svg>
              </button>
              <div style={{ 
                width: 42, height: 42, borderRadius: 12, background: active.color, 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                fontSize: 15, fontWeight: 800, color: 'white',
                boxShadow: `0 4px 10px ${active.color}22`
              }}>
                {active.initials}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>{active.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)' }} />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Active now</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <button 
                  className="btn-secondary desktop-only" 
                  onClick={() => {
                    if (active?.phone) {
                      window.location.href = `tel:${active.phone.replace(/[^0-9+]/g, '')}`;
                    }
                    setShowCallLogModal(true);
                  }}
                  style={{ height: 38, padding: '0 14px', fontSize: 13, fontWeight: 700, borderRadius: '8px' }}>
                  📞 Call Prospect
                </button>
                <button className="btn-primary" style={{ height: 38, padding: '0 14px', fontSize: 13, fontWeight: 700, borderRadius: '8px' }} onClick={() => {
                  if (!showAI) {
                    fetchCopilotInsights();
                  } else {
                    setShowAI(false);
                  }
                }}>
                  <span style={{ marginRight: 6 }}>✨</span> AI Copilot
                </button>
              </div>
            </div>

            {/* AI Copilot Insights Panel */}
            {showAI && (
              <div style={{ 
                padding: '20px 24px', background: 'rgba(124, 58, 237, 0.04)', borderBottom: '1px solid var(--border-subtle)', 
                display: 'flex', flexDirection: 'column', gap: 12, animation: 'fadeInDown 0.3s cubic-bezier(0.23, 1, 0.32, 1)' 
              }}>
                {copilotLoading ? (
                  <>
                    <LoadingSkeleton variant="text" lines={2} />
                    <div style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 800, marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', animation: 'pulse 1s infinite' }} />
                      Llama 3.1 70b analyzing context...
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ fontSize: 20 }}>🤖</div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
                          Llama 70b Analysis
                        </div>
                        <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.5, fontWeight: 500 }}>
                          {copilotInsight}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ background: 'var(--bg-surface)', padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(124, 58, 237, 0.2)', marginLeft: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>Suggested Action</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{copilotAction}</div>
                      </div>
                      <button 
                        onClick={() => {
                          if (active?.phone) {
                            window.location.href = `tel:${active.phone.replace(/[^0-9+]/g, '')}`;
                          }
                          setShowCallLogModal(true);
                        }}
                        style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 10px var(--primary-glow)' }}>
                        Execute
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Messages Pane with Flat Background (Wallpaper Removed) */}
            <div 
              ref={messagesRef}
              style={{ 
                flex: 1, 
                overflowY: 'auto', 
                padding: '24px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 14,
                background: 'var(--bg-subtle)'
              }} 
              className="custom-scroll"
            >
              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--text-muted)', background: 'var(--bg-surface)', padding: '4px 12px', borderRadius: 20, letterSpacing: '0.05em', boxShadow: 'var(--shadow-sm)' }}>TODAY</span>
              </div>
              
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 14 }}>
                  No messages logged in this channel yet.
                </div>
              ) : (
                messages.map((m, idx) => (
                  <div key={m.id} style={{ alignSelf: m.dir === 'out' ? 'flex-end' : 'flex-start', maxWidth: '70%', position: 'relative' }}>
                    {m.dir === 'in' && idx === 0 && (
                      <div style={{ 
                        marginBottom: 10, display: 'inline-flex', alignItems: 'center', gap: 8, 
                        background: 'var(--bg-surface)', padding: '6px 12px', borderRadius: 10, 
                        boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-subtle)'
                      }}>
                        <span style={{ fontSize: 15 }}>🚀</span>
                        <span style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.05em' }}>INTENT: ACTIVE OUTREACH</span>
                      </div>
                    )}
                    {m.channel === 'voice' ? (
                      <VoiceNotePlayer
                        variant={m.dir === 'in' ? 'inbound' : 'outbound'}
                        audioSrc={`/api/voice/${m.text}/stream`}
                        transcript="Voice Recording Logged. (AI transcription processing)"
                        channel="Call"
                        sender={m.dir === 'in' ? (active?.name || 'Lead') : 'Agent'}
                        timestamp={m.time}
                      />
                    ) : (
                      <div className={`whatsapp-bubble ${m.dir === 'out' ? 'out-bubble' : 'in-bubble'}`}>
                        <div style={{ fontSize: 14.5, fontWeight: 500, whiteSpace: 'pre-wrap' }}>{m.text}</div>
                        
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'flex-end', 
                          alignItems: 'center', 
                          gap: 4, 
                          marginTop: 4, 
                          alignSelf: 'flex-end'
                        }}>
                          <span style={{ fontSize: 10, opacity: 0.6, fontWeight: 600 }}>{m.time}</span>
                          {m.dir === 'out' && (
                            <span style={{ display: 'inline-flex', color: 'var(--primary)', opacity: 0.9 }}>
                              <svg width="15" height="15" viewBox="0 0 16 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1.5 7.5L5 11L14 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M5.5 7.5L9 11L15.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Rich Omnichannel Composer */}
            <div style={{ 
              padding: '16px 20px', 
              background: 'var(--bg-surface)', 
              borderTop: '1px solid var(--border)',
              display: 'flex', flexDirection: 'column', gap: 12
            }}>
              {/* Channel Selector & Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', gap: 6, background: 'var(--bg-subtle)', padding: 3, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                  {['WhatsApp', 'Email', 'SMS'].map(ch => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setChannel(ch)}
                      style={{
                        padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                        border: 'none', cursor: 'pointer',
                        background: channel === ch ? 'var(--primary)' : 'transparent',
                        color: channel === ch ? 'white' : 'var(--text-muted)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {ch === 'WhatsApp' ? '📱 WhatsApp' : ch === 'Email' ? '✉️ Email' : '💬 SMS'}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  {channel === 'Email' && (
                    <button
                      type="button"
                      onClick={handleSimulateInboundEmail}
                      className="btn-secondary"
                      style={{ padding: '4px 10px', fontSize: 11, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      📥 Simulate Inbound
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSmartDraft}
                    className="btn-secondary"
                    style={{ padding: '4px 10px', fontSize: 11, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--primary)' }}
                  >
                    ✨ 1-Click AI Draft
                  </button>
                </div>
              </div>

              {/* Optional Email Subject Input */}
              {channel === 'Email' && (
                <input 
                  type="text"
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                  placeholder="Subject: (e.g. Dale CRM Follow-up)"
                  className="input"
                  style={{ height: 36, fontSize: 13, padding: '0 10px' }}
                />
              )}

              {/* Message Text Input & Dispatch */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                <textarea
                  value={msg}
                  onChange={e => setMsg(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder={channel === 'Email' ? 'Write email message body... (Shift+Enter for newline)' : `Type ${channel} message... (Press Enter to send)`}
                  rows={channel === 'Email' ? 3 : 2}
                  className="input custom-scroll"
                  style={{ flex: 1, padding: 10, fontSize: 13, resize: 'none', lineHeight: 1.5 }}
                />
                <button
                  type="button"
                  onClick={send}
                  disabled={!msg.trim()}
                  className="btn-primary"
                  style={{ height: 42, padding: '0 20px', borderRadius: 10, fontWeight: 700, fontSize: 13 }}
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <EmptyState variant="B" />
          </div>
        )}
      </div>

      {showCompose && <ComposeModal isOpen={true} onClose={() => setShowCompose(false)} contact={active} />}
      
      <LogCallModal
        isOpen={showCallLogModal}
        onClose={() => setShowCallLogModal(false)}
        contact={active}
        onLogged={() => {
          // If we had a real backend, we'd refetch thread here
          fetchThread(active.id);
        }}
      />
    </div>
  );
};

export default GlobalInbox;
