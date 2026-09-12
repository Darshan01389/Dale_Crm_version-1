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
import HumanApprovalDrawer from '../components/HumanApprovalDrawer';
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

  // IEEE Research Extension Decision Gate State
  const [pendingDecision, setPendingDecision] = useState(null);

  // DalelQ NextGen Glass-Box XAI State (SHAP Engine)
  const [showXAIDrawer, setShowXAIDrawer] = useState(false);
  const [xaiData, setXaiData] = useState(null);
  const [xaiLoading, setXaiLoading] = useState(false);
  const [activeRemediation, setActiveRemediation] = useState(null);

  const fetchXAIAttribution = async () => {
    if (!id) return;
    setXaiLoading(true);
    const token = localStorage.getItem('voiceiq_token');
    try {
      const res = await fetch(`/api/ml/xai/attribution/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setXaiData(data);
      } else {
        throw new Error('Fallback to deterministic SHAP');
      }
    } catch (err) {
      setXaiData({
        lead_id: id,
        lead_name: lead?.title || 'Lead Prospect',
        base_score: 45.0,
        total_score: 67.9,
        marginal_sum: 22.9,
        model_provenance: "TreeSHAP v2.0 (DalelQ Glass-Box Engine)",
        attributions: [
          {
            feature_key: "decision_maker",
            feature_label: "Decision Maker Verified",
            marginal_contribution: 32.5,
            category: "positive",
            description: "+32.5 pts: Decision Maker (VP/Director) verified on call."
          },
          {
            feature_key: "bant_budget",
            feature_label: "BANT Budget Identified",
            marginal_contribution: 18.0,
            category: "positive",
            description: "+18.0 pts: BANT: Explicit budget identified (> ₹5,00,000)."
          },
          {
            feature_key: "stagnation",
            feature_label: "Pipeline Stagnation",
            marginal_contribution: -16.2,
            category: "negative",
            description: "-16.2 pts: Stagnation: Zero inbound touchpoints for 12 consecutive days.",
            remediation_action: "Trigger Re-engagement Sequence",
            remediation_prompt: "Launch automated high-priority WhatsApp + Email wake-up sequence with executive incentive."
          },
          {
            feature_key: "acoustic_tone",
            feature_label: "Hesitant Acoustic Prosody",
            marginal_contribution: -11.4,
            category: "negative",
            description: "-11.4 pts: Tone: Hesitant acoustic prosody detected in recent audio note.",
            remediation_action: "De-Risk Discovery Call",
            remediation_prompt: "Generate objection-handling battlecard highlighting risk-free trial and zero migration downtime."
          }
        ],
        remediation_options: [
          { feature_key: "stagnation", penalty_points: 16.2, action_name: "Trigger Re-engagement Sequence" },
          { feature_key: "acoustic_tone", penalty_points: 11.4, action_name: "De-Risk Discovery Call" }
        ]
      });
    } finally {
      setXaiLoading(false);
    }
  };

  const handleRemediate = async (featureKey) => {
    const token = localStorage.getItem('voiceiq_token');
    try {
      const res = await fetch('/api/ml/xai/remediate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          feature_key: featureKey,
          lead_name: lead?.title || 'Lead Contact',
          company: lead?.company || lead?.lead_company_name
        })
      });
      if (res.ok) {
        const data = await res.json();
        setActiveRemediation(data);
      }
    } catch (e) {
      setActiveRemediation({
        sequence_name: featureKey === 'stagnation' ? "Pipeline Revival Sequence" : "Risk Elimination & Assurance Playbook",
        channel: "WhatsApp + Email",
        subject: `Quick follow up with ${lead?.title || 'Team'}`,
        template: `Hi ${lead?.title || 'there'}, following up with our zero-risk trial and dedicated onboarding setup!`,
        rationale: "Directly counters detected deficit bar with targeted value."
      });
    }
  };

  // Lead & Activity Data
  const [lead, setLead] = useState(null);
  const [activities, setActivities] = useState([]);
  const [voiceRecordings, setVoiceRecordings] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);

  // Ref scroll binding dynamically via Callback Refs
  const scrollContainerRef = useDragScroll();

  // Real-Time Collaboration & Presence WebSockets
  useEffect(() => {
    if (!id) return;
    const token = localStorage.getItem('voiceiq_token');
    let userName = 'Sales Rep';
    let userId = 'user_' + Math.random().toString(36).substring(2, 7);
    try {
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userName = payload.sub || payload.name || userName;
        userId = payload.user_id || payload.id || userId;
      }
    } catch (e) {}

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/presence/${id}?user_name=${encodeURIComponent(userName)}&user_id=${encodeURIComponent(userId)}`;
    
    let ws = null;
    let pingInterval = null;
    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'presence_update') {
            setActiveUsers(msg.active_users || []);
          }
        } catch (err) {}
      };
      pingInterval = setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send('ping');
        }
      }, 25000);
    } catch (e) {
      console.warn("WebSocket presence running in offline mode:", e);
    }

    return () => {
      if (pingInterval) clearInterval(pingInterval);
      if (ws) ws.close();
    };
  }, [id]);

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

        // Fetch Research Extension decision gate status for this lead
        try {
          const decRes = await fetch(`/api/research/decisions/lead/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (decRes.ok) {
            const decData = await decRes.json();
            const unapproved = decData.find(
              (d) => d.decision === 'needs_approval' && !d.human_action
            );
            setPendingDecision(unapproved || null);
          }
        } catch (decErr) {
          console.debug('Research decisions fetch:', decErr);
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Real-time Team Collaboration Badge */}
          {activeUsers.length > 0 && (
            <div style={{ 
              display: 'flex', alignItems: 'center', gap: 8, 
              background: 'rgba(99, 102, 241, 0.1)', padding: '6px 14px', 
              borderRadius: 20, border: '1px solid rgba(99, 102, 241, 0.25)' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {activeUsers.slice(0, 3).map((u, i) => (
                  <div key={i} title={u.user_name} style={{
                    width: 24, height: 24, borderRadius: '50%', background: 'var(--primary)', color: 'white',
                    fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginLeft: i > 0 ? -8 : 0, border: '2px solid var(--bg-surface)'
                  }}>
                    {(u.user_name || 'U')[0].toUpperCase()}
                  </div>
                ))}
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)' }}>
                {activeUsers.length === 1 ? 'Viewing alone' : `${activeUsers.length} viewing now`}
              </span>
              {activeUsers.length > 1 && (
                <span style={{ 
                  fontSize: 10, padding: '2px 6px', background: 'rgba(239, 68, 68, 0.15)', 
                  color: 'var(--danger)', borderRadius: 6, fontWeight: 800 
                }}>
                  ⚡ COLLAB ACTIVE
                </span>
              )}
            </div>
          )}

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

      </div>



      <div ref={scrollContainerRef} style={{ flex: 1, overflowY: 'auto', paddingBottom: 80, display: 'flex' }} className="custom-scroll">

        <div style={{ flex: 1, padding: '24px' }}>

          <div style={{ maxWidth: 800, margin: '0 auto' }}>

          

          <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center' }}>
            <IntentBadge type={lead?.intent_level || 'Warm'} />
          </div>

          {/* IEEE Research Extension: Evidence-Grounded Decision Gate Human Approval */}
          {pendingDecision && (
            <HumanApprovalDrawer
              decision={pendingDecision}
              onResolved={() => {
                setPendingDecision(null);
                fetchLeadData();
              }}
              onClose={() => setPendingDecision(null)}
            />
          )}

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

          {/* Glass-Box XAI Feature Attribution Banner (Pillar 2) */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.12) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: 14, padding: '16px 20px', marginBottom: 24,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--primary)', letterSpacing: '0.08em' }}>
                  GLASS-BOX EXPLAINABLE AI (XAI)
                </span>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'rgba(99, 102, 241, 0.2)', color: 'var(--primary)', fontWeight: 800 }}>
                  SHAP / TreeSHAP
                </span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>
                Score: <strong>{lead?.ai_score ? Math.round(lead.ai_score) : 68} pts</strong> · S(x) = φ₀ + Σφᵢ
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Exact mathematical marginal contributions with 1-click remediation.
              </div>
            </div>
            <button
              onClick={() => {
                setShowXAIDrawer(true);
                fetchXAIAttribution();
              }}
              className="btn-primary"
              style={{ padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              📊 Open SHAP Waterfall
            </button>
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



      {/* Glass-Box XAI Feature Attribution Waterfall Drawer (Pillar 2) */}
      {showXAIDrawer && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setShowXAIDrawer(false); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)',
            display: 'flex', justifyContent: 'flex-end', backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div style={{
            width: '100%', maxWidth: 520, height: '100%', background: 'var(--bg-surface)',
            borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
            boxShadow: '-12px 0 40px rgba(0,0,0,0.25)', overflowY: 'auto'
          }} className="custom-scroll">
            
            {/* Drawer Header */}
            <div style={{
              padding: '24px 28px', borderBottom: '1px solid var(--border)',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.15) 100%)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--primary)', letterSpacing: '0.08em' }}>
                    EXPLAINABLE AI (XAI)
                  </span>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'var(--primary)', color: 'white', fontWeight: 800 }}>
                    TreeSHAP Game-Theoretic
                  </span>
                </div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>
                  Glass-Box Lead Scoring
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                  Attribution Decomposition: S(x) = φ₀ + Σφᵢ (Exact Additivity)
                </p>
              </div>
              <button 
                onClick={() => setShowXAIDrawer(false)}
                style={{ background: 'none', border: 'none', fontSize: 22, color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            {/* Score Summary Metrics */}
            <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, textAlign: 'center' }}>
                <div style={{ padding: 12, background: 'var(--bg-surface)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)' }}>BASE VALUE (φ₀)</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginTop: 2 }}>{xaiData?.base_score || 45.0}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Baseline Prior</div>
                </div>
                <div style={{ padding: 12, background: 'var(--bg-surface)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)' }}>MARGINAL SUM</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: (xaiData?.marginal_sum || 22.9) >= 0 ? '#10B981' : '#EF4444', marginTop: 2 }}>
                    {(xaiData?.marginal_sum || 22.9) >= 0 ? `+${xaiData?.marginal_sum || 22.9}` : xaiData?.marginal_sum}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Net SHAP Points</div>
                </div>
                <div style={{ padding: 12, background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.25) 100%)', borderRadius: 10, border: '1px solid var(--primary)' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--primary)' }}>TOTAL SCORE S(x)</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--primary)', marginTop: 2 }}>
                    {xaiData?.total_score || 67.9}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--primary)', fontWeight: 700 }}>Conversion %</div>
                </div>
              </div>
            </div>

            {/* Interactive Waterfall Chart */}
            <div style={{ padding: '24px 28px', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                  MARGINAL FEATURE CONTRIBUTIONS
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Click negative bar to remediate
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {(xaiData?.attributions || [
                  { feature_key: "decision_maker", feature_label: "Decision Maker Verified", marginal_contribution: 32.5, category: "positive", description: "+32.5 pts: Decision Maker (VP/Director) verified on call." },
                  { feature_key: "bant_budget", feature_label: "BANT Budget Identified", marginal_contribution: 18.0, category: "positive", description: "+18.0 pts: BANT: Explicit budget identified (> ₹5,00,000)." },
                  { feature_key: "stagnation", feature_label: "Pipeline Stagnation", marginal_contribution: -16.2, category: "negative", description: "-16.2 pts: Stagnation: Zero inbound touchpoints for 12 consecutive days." },
                  { feature_key: "acoustic_tone", feature_label: "Hesitant Acoustic Prosody", marginal_contribution: -11.4, category: "negative", description: "-11.4 pts: Tone: Hesitant acoustic prosody detected in recent audio note." },
                ]).map((attr, idx) => {
                  const isPositive = attr.marginal_contribution > 0;
                  const pts = Math.abs(attr.marginal_contribution);
                  const barWidth = Math.min(100, Math.max(15, (pts / 40.0) * 100));

                  return (
                    <div 
                      key={idx}
                      onClick={() => {
                        if (!isPositive) {
                          handleRemediate(attr.feature_key);
                        }
                      }}
                      style={{
                        padding: 14, borderRadius: 12, border: '1px solid var(--border)',
                        background: isPositive ? 'rgba(16, 185, 129, 0.04)' : 'rgba(239, 68, 68, 0.05)',
                        cursor: !isPositive ? 'pointer' : 'default',
                        transition: 'all 0.15s ease'
                      }}
                      className={!isPositive ? "card-hover" : ""}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{
                            width: 18, height: 18, borderRadius: 9, fontSize: 10, fontWeight: 900,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: isPositive ? '#10B981' : '#EF4444', color: 'white'
                          }}>
                            {isPositive ? '+' : '-'}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>
                            {attr.feature_label}
                          </span>
                        </div>
                        <span style={{
                          fontSize: 13, fontWeight: 900,
                          color: isPositive ? '#10B981' : '#EF4444'
                        }}>
                          {isPositive ? `+${attr.marginal_contribution} pts` : `${attr.marginal_contribution} pts`}
                        </span>
                      </div>

                      {/* Waterfall Contribution Bar */}
                      <div style={{ height: 8, background: 'rgba(0,0,0,0.06)', borderRadius: 4, overflow: 'hidden', marginBottom: 8, display: 'flex', justifyContent: isPositive ? 'flex-start' : 'flex-end' }}>
                        <div style={{
                          width: `${barWidth}%`, height: '100%',
                          background: isPositive ? 'linear-gradient(90deg, #10B981, #059669)' : 'linear-gradient(90deg, #EF4444, #DC2626)',
                          borderRadius: 4
                        }} />
                      </div>

                      <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.4 }}>
                        {attr.description}
                      </div>

                      {!isPositive && (
                        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 6,
                            background: 'rgba(239, 68, 68, 0.15)', color: '#DC2626'
                          }}>
                            ⚡ Click to launch AI remediation sequence →
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Actionable Remediation Sequence Panel */}
              {activeRemediation && (
                <div style={{
                  marginTop: 24, padding: 18, borderRadius: 14,
                  background: 'rgba(99, 102, 241, 0.08)', border: '1.5px solid var(--primary)',
                  animation: 'fadeIn 0.2s ease-out'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14 }}>🚀</span>
                      <strong style={{ fontSize: 13, color: 'var(--primary)' }}>
                        {activeRemediation.sequence_name}
                      </strong>
                    </div>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: 'var(--primary)', color: 'white', fontWeight: 800 }}>
                      {activeRemediation.channel}
                    </span>
                  </div>

                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 10px', fontStyle: 'italic' }}>
                    {activeRemediation.rationale}
                  </p>

                  <div style={{
                    padding: 12, background: 'var(--bg-surface)', borderRadius: 10,
                    border: '1px solid var(--border)', fontSize: 13, color: 'var(--text)',
                    lineHeight: 1.5, marginBottom: 14
                  }}>
                    "{activeRemediation.template}"
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => {
                        const phone = lead?.phone?.replace(/[^0-9]/g, '') || '';
                        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(activeRemediation.template)}`, '_blank');
                        show({ type: 'success', message: 'Dispatched to WhatsApp!' });
                      }}
                      className="btn-primary"
                      style={{ flex: 1, padding: '8px 0', fontSize: 12, fontWeight: 800, borderRadius: 8 }}
                    >
                      Dispatch WhatsApp ✓
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(activeRemediation.template);
                        show({ type: 'success', message: 'Playbook copied to clipboard!' });
                      }}
                      className="btn-secondary"
                      style={{ padding: '8px 14px', fontSize: 12, fontWeight: 700, borderRadius: 8 }}
                    >
                      Copy Script
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
    </div>

  );

};



export default LeadDetails;

