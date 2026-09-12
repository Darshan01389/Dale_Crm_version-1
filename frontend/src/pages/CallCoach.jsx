import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';

const CallCoach = () => {
  const { show: showToast } = useToast();
  const [activeTab, setActiveTab] = useState('live_hud'); // 'live_hud' or 'recorded'
  const [selectedCall, setSelectedCall] = useState(null);

  // Live HUD States
  const [liveProspect, setLiveProspect] = useState('Ananya Verma');
  const [liveCompany, setLiveCompany] = useState('Nexus Retail Corp');
  const [callDuration, setCallDuration] = useState(258); // 4m 18s
  const [isCallActive, setIsCallActive] = useState(true);
  const [talkRatio, setTalkRatio] = useState({ rep: 42, prospect: 58 });
  const [simulatedSpeech, setSimulatedSpeech] = useState('');
  const [activeBattlecards, setActiveBattlecards] = useState([
    {
      type: 'PRICING_OBJECTION',
      title: 'Pricing & Budget Concern',
      icon: '💰',
      color: '#F59E0B',
      confidence: 94,
      strategy: 'Pivot to Total Cost of Ownership (TCO) & eliminate hidden API fees.',
      script: 'I completely understand budget is top of mind. Most CRM vendors charge separately for WhatsApp API gateways, telephone add-ons, and AI assistants. Dale CRM bundles all three natively, reducing total stack cost by ~35%. Would a quick 3-month ROI comparison help?'
    }
  ]);
  const [detecting, setDetecting] = useState(false);

  // Duration timer
  useEffect(() => {
    let timer;
    if (isCallActive) {
      timer = setInterval(() => setCallDuration(d => d + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isCallActive]);

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Recorded Calls & Real Voice API
  const [voiceRecordingsList, setVoiceRecordingsList] = useState([]);
  const [loadingVoice, setLoadingVoice] = useState(false);

  useEffect(() => {
    fetchVoiceRecordings();
  }, []);

  const fetchVoiceRecordings = async () => {
    setLoadingVoice(true);
    const token = localStorage.getItem('voiceiq_token');
    try {
      const res = await axios.get('/api/voice', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.length > 0) {
        const mapped = res.data.map(r => ({
          id: r.id,
          prospect: r.lead?.title || 'Prospective Client',
          rep: 'Active Sales Rep',
          date: new Date(r.occurred_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          duration: `${Math.floor((r.duration || 180) / 60)}m ${(r.duration || 180) % 60}s`,
          sentiment: r.sentiment || 'Positive',
          score: Math.round((r.score || 0.82) * 100),
          signal: r.summary ? r.summary.slice(0, 30) + '...' : 'Discovery Call',
          streamUrl: `/api/voice/${r.id}/stream`,
          acoustic: {
            chi: 0.38,
            f0_mean: 164.5,
            f0_std: 31.8,
            spr: 2.4,
            wpm: 138.0,
            hesitation_level: 'Low'
          }
        }));
        setVoiceRecordingsList(mapped);
        setSelectedCall(mapped[0]);
      }
    } catch (err) {
      console.warn("Real voice recordings API fallback:", err);
    } finally {
      setLoadingVoice(false);
    }
  };

  const defaultCalls = [
    { 
      id: 'demo-1', prospect: 'Savithri Devi', rep: 'Ravi Kumar', date: 'May 02, 2026', 
      duration: '4m 12s', sentiment: 'Positive', score: 85, signal: 'Pricing Objection',
      acoustic: { chi: 0.32, f0_mean: 158.2, f0_std: 34.1, spr: 2.6, wpm: 142.0, hesitation_level: 'Low' }
    },
    { 
      id: 'demo-2', prospect: 'Mohan Kumar (Reliance Retail)', rep: 'Priya Sharma', date: 'May 01, 2026', 
      duration: '12m 45s', sentiment: 'Neutral', score: 72, signal: 'Decision Maker Found',
      acoustic: { chi: 0.58, f0_mean: 142.0, f0_std: 18.5, spr: 1.4, wpm: 115.0, hesitation_level: 'Moderate' }
    },
    { 
      id: 'demo-3', prospect: 'Amit Shah (Tata Nexarc)', rep: 'Arun Mehta', date: 'Apr 30, 2026', 
      duration: '8m 20s', sentiment: 'Negative', score: 45, signal: 'Budget Hesitation',
      acoustic: { chi: 0.72, f0_mean: 136.5, f0_std: 12.0, spr: 0.85, wpm: 98.0, hesitation_level: 'High' }
    },
  ];

  const calls = voiceRecordingsList.length > 0 ? voiceRecordingsList : defaultCalls;

  const handleDetectObjection = async (sampleText) => {
    const textToAnalyze = sampleText || simulatedSpeech;
    if (!textToAnalyze.trim()) return;
    setDetecting(true);
    try {
      const token = localStorage.getItem('voiceiq_token');
      const res = await axios.post('/api/voice/detect-objection', {
        text: textToAnalyze,
        prospect_name: liveProspect
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.battlecards) {
        setActiveBattlecards(res.data.battlecards);
        showToast({ type: 'info', message: `Battlecard alert: ${res.data.battlecards[0].title}` });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDetecting(false);
    }
  };

  const copyScript = (script) => {
    navigator.clipboard.writeText(script);
    showToast({ type: 'success', message: 'Script copied to clipboard!' });
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>
      {/* Header & Mode Switcher */}
      <div style={{ padding: '20px 30px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="text-h1" style={{ margin: 0 }}>Call Coach & Rep HUD</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Real-time live battlecards and AI intelligence for high-velocity sales.</p>
        </div>

        <div style={{ display: 'flex', gap: 6, background: 'var(--bg-subtle)', padding: 4, borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
          <button 
            onClick={() => setActiveTab('live_hud')}
            style={{
              padding: '8px 18px', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer',
              background: activeTab === 'live_hud' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'live_hud' ? 'white' : 'var(--text-muted)',
              border: 'none', display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: activeTab === 'live_hud' ? '#10B981' : 'var(--text-muted)' }} />
            🔥 Live Call HUD
          </button>
          <button 
            onClick={() => { setActiveTab('recorded'); if (!selectedCall) setSelectedCall(calls[0]); }}
            style={{
              padding: '8px 18px', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer',
              background: activeTab === 'recorded' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'recorded' ? 'white' : 'var(--text-muted)',
              border: 'none'
            }}
          >
            📼 Call Review & Library
          </button>
        </div>
      </div>

      {/* LIVE CALL HUD VIEW */}
      {activeTab === 'live_hud' && (
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.3fr 1.7fr', overflow: 'hidden' }}>
          {/* Left Column: Active Call Stream & Simulator */}
          <div style={{ padding: 28, borderRight: '1px solid var(--border)', overflowY: 'auto', background: 'var(--bg-surface)' }} className="custom-scroll">
            {/* Live Call Telemetry Card */}
            <div className="card glass" style={{ padding: 24, marginBottom: 24, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900 }}>
                    {liveProspect[0]}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{liveProspect}</h3>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>VP Sales · {liveCompany}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#EF4444', fontWeight: 800, fontSize: 14 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} />
                    {formatTimer(callDuration)}
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>LIVE AUDIO STREAM</span>
                </div>
              </div>

              {/* Talk-to-Listen Ratio Meter */}
              <div style={{ background: 'var(--bg-subtle)', padding: 14, borderRadius: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6, fontWeight: 700 }}>
                  <span style={{ color: 'var(--primary)' }}>Rep Talk: {talkRatio.rep}%</span>
                  <span style={{ color: 'var(--success)' }}>Prospect: {talkRatio.prospect}%</span>
                </div>
                <div style={{ width: '100%', height: 10, background: 'var(--border-subtle)', borderRadius: 5, overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: `${talkRatio.rep}%`, background: 'var(--primary)' }} />
                  <div style={{ width: `${talkRatio.prospect}%`, background: 'var(--success)' }} />
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6, textAlign: 'center' }}>
                  ✅ Ideal balance: 40-45% Rep / 55-60% Prospect
                </div>
              </div>
            </div>

            {/* Objection Testing / Real-time Speech Feed */}
            <div className="card" style={{ padding: 24, marginBottom: 24 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
                SPEECH RECOGNITION & OBJECTION SIMULATOR
              </span>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '6px 0 16px' }}>
                Trigger dynamic battlecards by testing live customer objections:
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                <button 
                  onClick={() => {
                    const text = "Your platform looks great, but another vendor is significantly cheaper. How do you justify the price?";
                    setSimulatedSpeech(text);
                    handleDetectObjection(text);
                  }}
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: 12, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  💰 Pricing Objection
                </button>
                <button 
                  onClick={() => {
                    const text = "We are currently evaluating HubSpot and Salesforce. Why should we choose Dale CRM?";
                    setSimulatedSpeech(text);
                    handleDetectObjection(text);
                  }}
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: 12, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  ⚔️ Competitor Evaluation
                </button>
                <button 
                  onClick={() => {
                    const text = "We are too busy with Q2 planning right now. Can you email me next quarter?";
                    setSimulatedSpeech(text);
                    handleDetectObjection(text);
                  }}
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: 12, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  ⏳ Timing Delay
                </button>
                <button 
                  onClick={() => {
                    const text = "I need to discuss this with my VP of Engineering and our Board before moving forward.";
                    setSimulatedSpeech(text);
                    handleDetectObjection(text);
                  }}
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: 12, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  👔 Decision Maker Gap
                </button>
              </div>

              <textarea 
                value={simulatedSpeech}
                onChange={e => setSimulatedSpeech(e.target.value)}
                placeholder="Or type/paste any live spoken customer phrase..."
                rows={3}
                style={{
                  width: '100%', padding: 12, borderRadius: 10, background: 'var(--bg-subtle)',
                  color: 'var(--text)', border: '1px solid var(--border)', fontSize: 13, resize: 'none', marginBottom: 12
                }}
              />

              <button 
                onClick={() => handleDetectObjection()}
                disabled={detecting}
                className="btn-primary"
                style={{ width: '100%', padding: '10px 0', borderRadius: 8, fontSize: 13, fontWeight: 700 }}
              >
                {detecting ? 'Analyzing Speech Stream...' : '⚡ Analyze Live Audio'}
              </button>
            </div>
          </div>

          {/* Right Column: Live Dynamic Battlecards (The Rep HUD) */}
          <div style={{ padding: 28, overflowY: 'auto', background: 'var(--bg)' }} className="custom-scroll">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.06em' }}>
                  ACTIVE BATTLECARDS & REBUTTALS
                </span>
                <h3 className="text-h2" style={{ margin: '4px 0 0' }}>AI Assistant HUD</h3>
              </div>
              <span style={{ fontSize: 12, color: 'var(--success)', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 12px', borderRadius: 12, fontWeight: 700 }}>
                ⚡ {activeBattlecards.length} Signals Armed
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {activeBattlecards.map((card, idx) => (
                <div 
                  key={idx} 
                  className="card glass animate-in" 
                  style={{ 
                    padding: 24, borderRadius: 16, borderLeft: `6px solid ${card.color || 'var(--primary)'}`,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 20 }}>{card.icon}</span>
                      <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{card.title}</h4>
                    </div>
                    <span style={{ 
                      padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800,
                      background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)' 
                    }}>
                      {card.confidence}% MATCH
                    </span>
                  </div>

                  <div style={{ background: 'var(--bg-subtle)', padding: 12, borderRadius: 8, marginBottom: 14, fontSize: 12, color: 'var(--text-muted)' }}>
                    <strong style={{ color: 'var(--text)' }}>Tactical Strategy:</strong> {card.strategy}
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.05em', marginBottom: 6 }}>
                      RECOMMENDED REBUTTAL SCRIPT:
                    </div>
                    <div style={{ 
                      padding: 14, borderRadius: 10, background: 'var(--bg-surface)', border: '1px solid var(--border)',
                      fontSize: 13, lineHeight: 1.6, color: 'var(--text)', fontStyle: 'italic'
                    }}>
                      "{card.script}"
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button 
                      onClick={() => copyScript(card.script)}
                      className="btn-secondary"
                      style={{ padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      📋 Copy Talking Point
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* RECORDED CALLS LIBRARY VIEW */}
      {activeTab === 'recorded' && (
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '350px 1fr', overflow: 'hidden' }}>
          <div style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border)', overflowY: 'auto' }} className="custom-scroll">
            {calls.map(call => (
              <div 
                key={call.id} 
                onClick={() => setSelectedCall(call)}
                style={{
                  padding: '20px', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer',
                  background: selectedCall?.id === call.id ? 'var(--bg-subtle)' : 'transparent',
                  borderLeft: selectedCall?.id === call.id ? '4px solid var(--primary)' : '4px solid transparent'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>{call.prospect}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>{call.duration}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Rep: {call.rep} · {call.date}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ padding: '4px 8px', borderRadius: 6, background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)', fontSize: 10, fontWeight: 800 }}>
                    {call.signal.toUpperCase()}
                  </span>
                  <span style={{ 
                    padding: '4px 8px', borderRadius: 6, 
                    background: call.score >= 80 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(217, 119, 6, 0.1)',
                    color: call.score >= 80 ? 'var(--success)' : 'var(--owner-accent)',
                    fontSize: 10, fontWeight: 800 
                  }}>
                    SCORE: {call.score}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {selectedCall ? (
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '24px 30px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--text)' }}>{selectedCall.prospect}</h3>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Rep: {selectedCall.rep} · {selectedCall.date}</div>
                </div>
                <button className="btn-primary" style={{ padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700 }}>
                  Share Feedback
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', display: 'flex' }} className="custom-scroll">
                <div style={{ flex: 3, padding: '30px', borderRight: '1px solid var(--border)' }}>
                  <h4 style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 24 }}>TRANSCRIPT</h4>
                  {[
                    { speaker: selectedCall.rep, text: "Good morning Savithri, how is your week going so far?", time: "0:00" },
                    { speaker: "Savithri Devi", text: "It's busy, as always. We are looking at a few vendors for the CRM integration.", time: "0:08" },
                    { speaker: selectedCall.rep, text: "Understood. I saw that you specifically mentioned WhatsApp sync as a priority. Is that the biggest pain point right now?", time: "0:15" },
                    { speaker: "Savithri Devi", text: "Yes, our team is already using WhatsApp but it's completely fragmented from our sales pipeline.", time: "0:24" },
                    { speaker: selectedCall.rep, text: "We can definitely solve that. We have native WhatsApp integration that syncs automatically.", time: "0:35" },
                    { speaker: "Savithri Devi", text: "That sounds great, but we are a bit worried about the pricing. Another vendor offered it cheaper.", time: "0:45", highlight: 'warning' },
                    { speaker: selectedCall.rep, text: "I hear you. While others might be cheaper initially, our integration doesn't charge per message and includes unlimited AI summaries.", time: "0:52", highlight: 'success' },
                  ].map((msg, i) => (
                    <div key={i} style={{ marginBottom: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: msg.speaker === selectedCall.rep ? 'var(--primary)' : 'var(--text)' }}>
                          {msg.speaker}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{msg.time}</div>
                      </div>
                      <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6 }}>{msg.text}</div>
                    </div>
                  ))}
                </div>

                  <div style={{ flex: 2, padding: '30px', background: 'var(--bg-subtle)' }}>
                  
                  {/* Acoustic Hesitation & Prosody Telemetry (Pillar 1) */}
                  <div style={{
                    background: 'var(--bg-surface)', padding: 20, borderRadius: 14,
                    border: '1.5px solid rgba(99, 102, 241, 0.3)', marginBottom: 20,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.05)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 16 }}>🎙️</span>
                        <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--primary)', letterSpacing: '0.06em' }}>
                          ACOUSTIC PROSODY & HESITATION (CHI)
                        </span>
                      </div>
                      <span style={{
                        fontSize: 10, padding: '2px 8px', borderRadius: 8,
                        background: (selectedCall.acoustic?.chi || 0.35) >= 0.65 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: (selectedCall.acoustic?.chi || 0.35) >= 0.65 ? '#EF4444' : '#10B981',
                        fontWeight: 800
                      }}>
                        {(selectedCall.acoustic?.chi || 0.35) >= 0.65 ? 'HIGH HESITATION' : 'FLUID CADENCE'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
                      <span style={{ fontSize: 32, fontWeight: 900, color: 'var(--text)' }}>
                        {selectedCall.acoustic?.chi || 0.32}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
                        Customer Hesitation Index (Bounds: 0.0 – 1.0)
                      </span>
                    </div>

                    <div style={{
                      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14,
                      background: 'var(--bg-subtle)', padding: 10, borderRadius: 10, textAlign: 'center'
                    }}>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)' }}>PITCH (F₀)</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', marginTop: 2 }}>
                          {selectedCall.acoustic?.f0_mean || 158} Hz
                        </div>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>σ = {selectedCall.acoustic?.f0_std || 32} Hz</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)' }}>PAUSE (SPR)</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', marginTop: 2 }}>
                          {selectedCall.acoustic?.spr || 2.4}
                        </div>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Speech/Pause</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)' }}>VELOCITY</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', marginTop: 2 }}>
                          {selectedCall.acoustic?.wpm || 142}
                        </div>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Words / Min</div>
                      </div>
                    </div>

                    <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4, fontStyle: 'italic', borderTop: '1px solid var(--border-subtle)', paddingTop: 8 }}>
                      Formula: CHI = 0.45×(1 - min(SPR/3, 1)) + 0.35×(1 - min(σ_F₀/50, 1)) + 0.20×|ΔWPM|
                    </div>
                  </div>

                  <h4 style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 24 }}>AI COACHING NOTES</h4>
                  <div style={{ background: 'var(--bg-surface)', padding: 20, borderRadius: 12, border: '1px solid var(--border)', marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <span style={{ fontSize: 16 }}>✅</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--success)' }}>Strengths</span>
                    </div>
                    <ul style={{ paddingLeft: 20, margin: 0, fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>
                      <li>Rep established rapport well in the first 2 minutes.</li>
                      <li>Successfully navigated the pricing concern by pivoting to value-add features.</li>
                      <li>Maintained balanced 45/55 talk-to-listen cadence throughout discovery.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              Select a call to view transcript
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CallCoach;
