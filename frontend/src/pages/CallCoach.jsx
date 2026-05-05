import React, { useState } from 'react';

const CallCoach = () => {
  const [selectedCall, setSelectedCall] = useState(null);

  const calls = [
    { id: 1, prospect: 'Sarah Jenkins', rep: 'Ravi Kumar', date: 'May 02, 2026', duration: '4m 12s', sentiment: 'Positive', score: 85, signal: 'Pricing Objection' },
    { id: 2, prospect: 'Michael Chen', rep: 'Priya Sharma', date: 'May 01, 2026', duration: '12m 45s', sentiment: 'Neutral', score: 72, signal: 'Decision Maker Found' },
    { id: 3, prospect: 'Amit Shah', rep: 'Arun Mehta', date: 'Apr 30, 2026', duration: '8m 20s', sentiment: 'Negative', score: 45, signal: 'Low Budget' },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>
      <div style={{ padding: '24px 30px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
        <h1 className="text-h1" style={{ margin: 0 }}>Call Coach</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Review transcripts and AI insights to coach your team.</p>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '350px 1fr', overflow: 'hidden' }}>
        {/* Call List */}
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
                <span style={{ padding: '4px 8px', borderRadius: 6, background: 'rgba(31, 78, 121, 0.1)', color: 'var(--primary)', fontSize: 10, fontWeight: 800, letterSpacing: '0.05em' }}>{call.signal.toUpperCase()}</span>
                <span style={{ 
                  padding: '4px 8px', borderRadius: 6, 
                  background: call.score >= 80 ? 'rgba(16, 185, 129, 0.1)' : call.score >= 60 ? 'rgba(217, 119, 6, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: call.score >= 80 ? 'var(--success)' : call.score >= 60 ? 'var(--owner-accent)' : 'var(--danger)',
                  fontSize: 10, fontWeight: 800, letterSpacing: '0.05em' 
                }}>SCORE: {call.score}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Call Detail / Transcript */}
        {selectedCall ? (
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Header / Player Area */}
            <div style={{ padding: '24px 30px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--text)' }}>{selectedCall.prospect}</h3>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Rep: {selectedCall.rep} · {selectedCall.date}</div>
                </div>
                <button className="btn-primary" style={{ padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700 }}>Share Feedback</button>
              </div>

              {/* Signal Summary Bar */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>SIGNALS DETECTED</span>
                <span style={{ padding: '4px 10px', borderRadius: 20, background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', fontSize: 11, fontWeight: 800, letterSpacing: '0.05em', border: '1px solid var(--success)' }}>BUDGET APPROVED</span>
                <span style={{ padding: '4px 10px', borderRadius: 20, background: 'rgba(217, 119, 6, 0.1)', color: 'var(--owner-accent)', fontSize: 11, fontWeight: 800, letterSpacing: '0.05em', border: '1px solid var(--owner-accent)' }}>COMPETITOR MENTIONED</span>
                <span style={{ padding: '4px 10px', borderRadius: 20, background: 'rgba(217, 119, 6, 0.1)', color: 'var(--owner-accent)', fontSize: 11, fontWeight: 800, letterSpacing: '0.05em', border: '1px solid var(--owner-accent)' }}>PRICING OBJECTION</span>
              </div>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex' }} className="custom-scroll">
              {/* Left Column: Transcript */}
              <div style={{ flex: 3, padding: '30px', borderRight: '1px solid var(--border)' }}>
                <h4 style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 24 }}>TRANSCRIPT</h4>
                {[
                  { speaker: selectedCall.rep, text: "Good morning Sarah, how is your week going so far?", time: "0:00" },
                  { speaker: "Sarah Jenkins", text: "It's busy, as always. We are looking at a few vendors for the CRM integration.", time: "0:08" },
                  { speaker: selectedCall.rep, text: "Understood. I saw that you specifically mentioned WhatsApp sync as a priority. Is that the biggest pain point right now?", time: "0:15" },
                  { speaker: "Sarah Jenkins", text: "Yes, our team is already using WhatsApp but it's completely fragmented from our sales pipeline.", time: "0:24" },
                  { speaker: selectedCall.rep, text: "We can definitely solve that. We have native WhatsApp integration that syncs automatically.", time: "0:35" },
                  { speaker: "Sarah Jenkins", text: "That sounds great, but we are a bit worried about the pricing. Another vendor offered it cheaper.", time: "0:45", highlight: 'warning' },
                  { speaker: selectedCall.rep, text: "I hear you. While others might be cheaper initially, our integration doesn't charge per message and includes unlimited AI summaries.", time: "0:52", highlight: 'success' },
                ].map((msg, i) => (
                  <div key={i} style={{ marginBottom: 20, position: 'relative' }}>
                    {msg.highlight === 'warning' && <div style={{ position: 'absolute', left: -16, top: 0, bottom: 0, width: 4, background: 'var(--owner-accent)', borderRadius: 2 }} />}
                    {msg.highlight === 'success' && <div style={{ position: 'absolute', left: -16, top: 0, bottom: 0, width: 4, background: 'var(--success)', borderRadius: 2 }} />}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: msg.speaker === selectedCall.rep ? 'var(--primary)' : 'var(--text)', textTransform: 'uppercase' }}>{msg.speaker}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{msg.time}</div>
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6 }}>{msg.text}</div>
                  </div>
                ))}
              </div>

              {/* Right Column: Coaching Notes */}
              <div style={{ flex: 2, padding: '30px', background: 'var(--bg-subtle)' }}>
                <h4 style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 24 }}>AI COACHING NOTES</h4>
                
                <div style={{ background: 'var(--bg-surface)', padding: 20, borderRadius: 12, border: '1px solid var(--border)', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 16 }}>✅</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--success)' }}>Strengths</span>
                  </div>
                  <ul style={{ paddingLeft: 20, margin: 0, fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>
                    <li>Rep established rapport well in the first 2 minutes.</li>
                    <li>Successfully navigated the pricing concern by pivoting to value-add features (unlimited messages).</li>
                  </ul>
                </div>

                <div style={{ background: 'var(--bg-surface)', padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 16 }}>🎯</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--owner-accent)' }}>Areas to Improve</span>
                  </div>
                  <ul style={{ paddingLeft: 20, margin: 0, fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>
                    <li>Did not ask discovery questions about the competitor's exact feature set.</li>
                    <li>Missed a clear "next steps" closing statement.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 14, fontWeight: 500 }}>
            Select a call to view transcript and AI coaching
          </div>
        )}
      </div>
    </div>
  );
};

export default CallCoach;
