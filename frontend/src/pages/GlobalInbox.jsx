import React, { useState, useEffect } from 'react';
import ComposeModal from '../components/ComposeModal';
import IntentBadge from '../components/IntentBadge';
import EmptyState from '../components/EmptyState';
import LoadingSkeleton from '../components/LoadingSkeleton';

const CONTACTS = [
  { id: '1', name: 'Sarah Jenkins', phone: '+91 98765 43210', initials: 'SJ', color: '#1F6E43', lastMsg: 'Thanks! Will review and get back to you.', time: '2m ago', unread: 2, intent: 'high', risk: 'standard', channel: 'WhatsApp', timestamp: Date.now() - 120000 },
  { id: '2', name: 'Michael Chen', phone: '+91 91234 56789', initials: 'MC', color: '#1F4E79', lastMsg: 'Can you send the API docs?', time: '1h ago', unread: 0, intent: 'high', risk: 'standard', channel: 'WhatsApp', timestamp: Date.now() - 3600000 },
  { id: '3', name: 'Priya Patel', phone: '+91 94567 89012', initials: 'PP', color: '#7C4A2D', time: '3h ago', unread: 1, intent: 'standard', risk: 'standard', channel: 'voice', duration: 8, signals: ['budget approved', 'demo asked'], timestamp: Date.now() - 10800000 },
  { id: '4', name: 'Rajesh Kumar', phone: '+91 97890 12345', initials: 'RK', color: '#B4670F', lastMsg: "We'll need a discount to proceed.", time: '1d ago', unread: 0, intent: 'standard', risk: 'risk', channel: 'SMS', timestamp: Date.now() - 86400000 },
];

const THREADS = {
  '1': [
    { id: 1, dir: 'in', text: "Hi, I got your details from a colleague. Looking for CRM solutions.", time: '10:00 AM', channel: 'WhatsApp' },
    { id: 2, dir: 'out', text: "Hi Sarah! Happy to help. Would you like to schedule a quick discovery call?", time: '10:05 AM', channel: 'WhatsApp' },
    { id: 3, dir: 'in', text: "Yes, tomorrow at 3pm works.", time: '10:10 AM', channel: 'WhatsApp' },
    { id: 4, dir: 'out', text: "Perfect! I'll send a calendar invite now.", time: '10:12 AM', channel: 'WhatsApp' },
    { id: 5, dir: 'in', text: "Thanks! Will review and get back to you.", time: '2m ago', channel: 'WhatsApp' },
  ],
  '2': [
    { id: 1, dir: 'out', text: "Hi Michael, following up on our proposal sent last week.", time: '9:00 AM', channel: 'WhatsApp' },
    { id: 2, dir: 'in', text: "Can you send the API docs?", time: '1h ago', channel: 'WhatsApp' },
  ],
  '3': [
    { id: 1, dir: 'in', text: "Interested in the enterprise plan.", time: 'Yesterday', channel: 'Email' },
    { id: 2, dir: 'out', text: "Great! Let me share our enterprise pricing.", time: 'Yesterday', channel: 'Email' },
    { id: 3, dir: 'in', text: "Sounds good, let me check with the team.", time: '3h ago', channel: 'Email' },
  ],
  '4': [
    { id: 1, dir: 'in', text: "We'll need a discount to proceed.", time: '1d ago', channel: 'SMS' },
  ],
};

const intentColor = { high: '#1F6E43', risk: '#B4670F', standard: '#9CA3AF' };

const GlobalInbox = () => {
  const [active, setActive] = useState(CONTACTS[0]);
  const [msg, setMsg] = useState('');
  const [threads, setThreads] = useState(THREADS);
  const [channel, setChannel] = useState('WhatsApp');
  const [sortTab, setSortTab] = useState('Intent');
  const [view, setView] = useState('list'); // 'list' or 'thread'
  const [showAI, setShowAI] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [loading, setLoading] = useState(true);
  const [pullY, setPullY] = useState(0);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-refresh 30s polling + initial load
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    const interval = setInterval(() => {
      // Mock re-fetch
      console.log('Polling conversations...');
    }, 30000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  const handleTouchStart = (e) => {
    if (window.scrollY === 0) {
      setPullY(e.touches[0].clientY);
    }
  };

  const handleTouchEnd = (e) => {
    if (pullY > 0 && e.changedTouches[0].clientY - pullY > 100) {
      setLoading(true);
      setTimeout(() => setLoading(false), 800);
    }
    setPullY(0);
  };

  const send = () => {
    if (!msg.trim()) return;
    const newMsg = { id: Date.now(), dir: 'out', text: msg, time: 'Just now', channel };
    setThreads(prev => ({ ...prev, [active.id]: [...(prev[active.id] || []), newMsg] }));
    setMsg('');
  };

  const handleSelect = (contact) => {
    setActive(contact);
    if (window.innerWidth <= 768) {
      setView('thread');
    }
  };

  const applyAISuggestion = (text) => {
    setMsg(text);
    setShowAI(false);
  };

  const sortedContacts = [...CONTACTS].sort((a, b) => {
    if (sortTab === 'Intent') return (b.intent === 'high' ? 1 : 0) - (a.intent === 'high' ? 1 : 0);
    if (sortTab === 'Risk') return (b.risk === 'risk' ? 1 : 0) - (a.risk === 'risk' ? 1 : 0);
    if (sortTab === 'Recent') return b.timestamp - a.timestamp;
    if (sortTab === 'Channel') return a.channel.localeCompare(b.channel);
    return 0;
  });

  const messages = threads[active.id] || [];

  return (
    <div style={{ height: '100%', display: 'flex', overflow: 'hidden', background: 'var(--bg)' }} className="animate-in">
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
        <div style={{ padding: '32px 24px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <h1 className="text-h1" style={{ fontSize: 28, flex: 1, margin: 0 }}>Global Inbox</h1>
            <button 
              onClick={() => setShowCompose(true)}
              className="btn-primary" 
              style={{ width: 44, height: 44, borderRadius: 14, padding: 0, justifyContent: 'center' }}
            >
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
              </svg>
            </button>
          </div>
          
          {/* Search Bar */}
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="input" 
              style={{ paddingLeft: 44, height: 44 }}
            />
            <svg style={{ position: 'absolute', left: 16, top: 12, color: 'var(--text-muted)' }} width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>

          {/* Sort Tabs */}
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }} className="hide-scroll">
            {['Intent', 'Risk', 'Recent', 'Channel'].map(t => (
              <button
                key={t}
                onClick={() => setSortTab(t)}
                style={{
                  padding: '8px 16px', fontSize: 13, fontWeight: sortTab === t ? 700 : 500,
                  whiteSpace: 'nowrap', cursor: 'pointer', border: 'none',
                  background: 'transparent',
                  color: sortTab === t ? 'var(--text)' : 'var(--text-muted)',
                  borderBottom: sortTab === t ? '2px solid var(--primary)' : '2px solid transparent',
                  transition: 'all 0.2s ease',
                  letterSpacing: '0.02em',
                  marginBottom: -1,
                  borderRadius: 0,
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        
        <div 
          style={{ overflowY: 'auto', flex: 1 }} 
          className="custom-scroll"
          onTouchStart={isMobile ? handleTouchStart : undefined}
          onTouchEnd={isMobile ? handleTouchEnd : undefined}
        >
          {loading ? (
            <div style={{ padding: 24 }}>
              <LoadingSkeleton variant="row" lines={5} />
            </div>
          ) : sortedContacts.length === 0 ? (
            <EmptyState variant="A" />
          ) : (
            sortedContacts.map(c => (
            <div key={c.id} onClick={() => handleSelect(c)} className="inbox-row" style={{ 
              background: active.id === c.id ? 'rgba(31, 78, 121, 0.05)' : 'transparent', 
              padding: '24px',
              borderLeft: active.id === c.id ? '4px solid var(--primary)' : '4px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              gap: 16,
              borderBottom: '1px solid var(--border-subtle)'
            }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ 
                  width: 56, height: 56, borderRadius: 18, background: c.color, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  fontSize: 18, fontWeight: 800, color: 'white',
                  boxShadow: active.id === c.id ? `0 8px 16px ${c.color}33` : 'none',
                  transform: active.id === c.id ? 'scale(1.05)' : 'scale(1)',
                  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}>
                  {c.initials}
                </div>
                {c.unread > 0 && (
                  <span style={{ 
                    position: 'absolute', top: -4, right: -4, minWidth: 24, height: 24, 
                    borderRadius: 12, background: 'var(--success)', fontSize: 11, fontWeight: 800, 
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    border: '3px solid white', boxShadow: 'var(--shadow-sm)' 
                  }}>
                    {c.unread}
                  </span>
                )}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>{c.name}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{c.time}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ 
                    fontSize: 14, color: c.unread > 0 ? 'var(--text)' : 'var(--text-muted)', 
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, 
                    fontWeight: c.unread > 0 ? 700 : 500 
                  }}>
                    {c.channel === 'voice' ? `Call: ${c.duration}min — signals: ${c.signals.join(', ')}` : c.lastMsg}
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
        {/* Thread header */}
        <div style={{ 
          padding: '20px 32px', borderBottom: '1px solid var(--border)', 
          background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0,
          zIndex: 10
        }}>
          <button 
            className="mobile-only" 
            onClick={() => setView('list')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 12, marginRight: -8 }}
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="var(--text)" strokeWidth="3"><path d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div style={{ 
            width: 48, height: 48, borderRadius: 16, background: active.color, 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            fontSize: 16, fontWeight: 800, color: 'white',
            boxShadow: `0 4px 12px ${active.color}33`
          }}>
            {active.initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>{active.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Active via {channel}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-secondary desktop-only" style={{ height: 44, padding: '0 20px', fontWeight: 700 }}>📞 Call Prospect</button>
            <button className="btn-primary" style={{ height: 44, padding: '0 20px', fontWeight: 700 }} onClick={() => setShowAI(!showAI)}>
              <span style={{ marginRight: 8 }}>✨</span> AI Copilot
            </button>
          </div>
        </div>

        {/* AI Suggest Strip */}
        {showAI && (
          <div style={{ 
            padding: '16px 24px', background: 'rgba(31, 78, 121, 0.05)', borderBottom: '1px solid var(--border-subtle)', 
            display: 'flex', gap: 12, overflowX: 'auto', animation: 'fadeInDown 0.3s cubic-bezier(0.23, 1, 0.32, 1)' 
          }} className="hide-scroll">
            {["Hi! Just checking in...", "Following up on proposal", "Schedule discovery call", "Answer pricing query"].map((s, i) => (
              <button 
                key={i} 
                onClick={() => applyAISuggestion(s)}
                style={{ 
                  background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', padding: '12px 20px', 
                  borderRadius: 14, fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap',
                  color: 'var(--primary)', boxShadow: 'var(--shadow-sm)',
                  cursor: 'pointer', transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '40px 32px', display: 'flex', flexDirection: 'column', gap: 24 }} className="custom-scroll">
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', background: 'var(--bg-subtle)', padding: '4px 12px', borderRadius: 20, letterSpacing: '0.05em' }}>TODAY</span>
          </div>
          
          {messages.map((m, idx) => (
            <div key={m.id} style={{ alignSelf: m.dir === 'out' ? 'flex-end' : 'flex-start', maxWidth: '75%', position: 'relative' }}>
              {m.dir === 'in' && idx === 0 && (
                <div style={{ 
                  marginBottom: 10, display: 'inline-flex', alignItems: 'center', gap: 8, 
                  background: 'var(--bg-surface)', padding: '6px 12px', borderRadius: 10, 
                  boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-subtle)'
                }}>
                  <span style={{ fontSize: 16 }}>🚀</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.05em' }}>INTENT: READY TO BUY</span>
                </div>
              )}
              <div style={{
                padding: '16px 24px', borderRadius: 24,
                background: m.dir === 'out' ? 'var(--primary)' : 'var(--bg-surface)',
                color: m.dir === 'out' ? 'white' : 'var(--text)',
                fontSize: 15, fontWeight: 500, lineHeight: 1.6,
                boxShadow: m.dir === 'out' ? '0 4px 12px var(--primary-glow)' : 'var(--shadow-sm)',
                borderBottomRightRadius: m.dir === 'out' ? 6 : 24,
                borderBottomLeftRadius: m.dir === 'in' ? 6 : 24,
                border: m.dir === 'in' ? '1px solid var(--border-subtle)' : 'none'
              }}>
                {m.text}
                <div style={{ 
                  display: 'flex', justifyContent: m.dir === 'out' ? 'flex-end' : 'flex-start', 
                  alignItems: 'center', gap: 8, marginTop: 8, opacity: 0.7 
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700 }}>{m.time}{m.dir === 'out' && ' · Seen'}</div>
                </div>
              </div>
            </div>
          ))}

          {/* Voice Note Pattern */}
          <div style={{ 
            alignSelf: 'center', width: '100%', maxWidth: 560, 
            background: 'var(--bg-surface)', borderRadius: 28, padding: 24, 
            border: '1px solid var(--border-subtle)', margin: '20px 0', 
            boxShadow: 'var(--shadow-lg)', position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
              <button style={{ 
                width: 52, height: 52, borderRadius: 18, background: 'var(--primary)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', 
                boxShadow: '0 4px 12px var(--primary-glow)'
              }}>
                <svg width="24" height="24" fill="white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </button>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--primary)', letterSpacing: '0.1em' }}>VOICE LOG · 2:14</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>Yesterday, 4:20 PM</span>
                </div>
                <div style={{ height: 8, background: 'var(--bg-subtle)', borderRadius: 4, marginTop: 12, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '45%', background: 'var(--primary)', borderRadius: 4, boxShadow: '0 0 10px var(--primary-glow)' }} />
                </div>
              </div>
            </div>
            <p style={{ 
              fontSize: 15, color: 'var(--text)', fontStyle: 'italic', margin: 0, 
              lineHeight: 1.7, borderLeft: '4px solid var(--primary)', paddingLeft: 20,
              fontWeight: 500, background: 'rgba(31, 78, 121, 0.02)', padding: '16px 20px', borderRadius: '0 16px 16px 0'
            }}>
              "Can we discuss the enterprise pricing for 50 users? I\'m looking for the bulk discount we discussed..."
            </p>
          </div>
        </div>

        {/* Compose Bar */}
        <div style={{ padding: '24px 32px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', zIndex: 10 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                value={msg} onChange={e => setMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder={`Message ${active.name.split(' ')[0]} via ${channel}...`}
                style={{ 
                  width: '100%', padding: '16px 32px', border: '2px solid var(--border-subtle)', 
                  borderRadius: 40, fontSize: 15, background: 'var(--bg-subtle)', 
                  color: 'var(--text)', outline: 'none', transition: 'all 0.3s ease',
                  fontWeight: 600
                }}
              />
              <div style={{ position: 'absolute', right: 20, top: 14, display: 'flex', gap: 12 }}>
                <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>📎</button>
                <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>😊</button>
              </div>
            </div>
            <button 
              onClick={send} 
              style={{ 
                background: 'var(--primary)', color: 'white', border: 'none', 
                borderRadius: '20px', height: 56, padding: '0 32px', display: 'flex', 
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                cursor: 'pointer', transition: 'all 0.2s ease',
                fontWeight: 800, boxShadow: '0 8px 20px var(--primary-glow)'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Send <svg style={{ marginLeft: 10 }} width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Intelligence Panel Removed (Moved to Lead Details) */}


      <ComposeModal 
        isOpen={showCompose} 
        onClose={() => setShowCompose(false)} 
      />
    </div>
  );
};

export default GlobalInbox;
