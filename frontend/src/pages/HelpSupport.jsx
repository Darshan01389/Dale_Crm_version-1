import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';

const CARDS = [
  { icon: '💬', name: 'Chat with Support',   desc: 'Avg response: 3 minutes',           action: 'OPEN CHAT',  href: 'mailto:support@daleiq.com' },
  { icon: '📚', name: 'Knowledge Base',       desc: '120+ articles, video tutorials',    action: 'BROWSE',     href: 'https://docs.daleiq.com' },
  { icon: '🚀', name: 'Onboarding Coach',     desc: 'Re-run setup walkthrough',          action: 'RESTART',    href: null, onboard: true },
  { icon: '✉️', name: 'Email Support',        desc: 'support@daleiq.com · 1-day response', action: 'EMAIL',   href: 'mailto:support@daleiq.com' },
  { icon: '🐛', name: 'Report a Bug',         desc: 'Help us fix it fast',               action: 'REPORT',     href: 'mailto:bugs@daleiq.com' },
  { icon: '💡', name: 'Suggest a Feature',    desc: 'Vote on the roadmap',               action: 'SUBMIT',     href: 'mailto:feedback@daleiq.com' },
];

const FAQS = [
  { q: 'How do I connect my WhatsApp?', a: 'Go to Settings → Channels and click "Connect WhatsApp". You will need your Meta Developer credentials.' },
  { q: 'Can I reassign multiple leads at once?', a: 'Yes, go to the Leads table, select multiple checkboxes, and click "Reassign" from the bulk actions menu.' },
  { q: 'How is the AI Win Probability calculated?', a: 'Our model analyses historical conversion rates, communication velocity, sentiment from transcripts, and firmographic data.' },
];
const HelpSupport = () => {
  const { profile } = useUser();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('operational');
  const isFounder = profile?.is_founding_customer;

  const [showChatbot, setShowChatbot] = useState(false);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data === 'closeChat') {
        setShowChatbot(false);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleCard = (card) => {
    if (card.onboard) { window.location.href = '/welcome'; return; }
    if (card.name === 'Chat with Support') {
      setShowChatbot(true);
      return;
    }
    if (card.href) window.open(card.href, '_blank');
  };

  if (showChatbot) {
    return (
      <div style={{ height: '100%', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
        <iframe 
          src="http://localhost:8002" 
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="DaleIQ Assistant"
        />
      </div>
    );
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--bg)' }} className="custom-scroll animate-in">
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px 80px' }}>

        <h1 className="text-h1" style={{ marginBottom: 8 }}>Help & Support</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 28, fontSize: 14 }}>Find answers, contact support, or report an issue.</p>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 40, maxWidth: 480 }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 16 }}>🔍</span>
          <input
            className="input"
            placeholder="Search the help center…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && search.trim()) window.open(`https://docs.daleiq.com/search?q=${encodeURIComponent(search)}`, '_blank'); }}
            style={{ paddingLeft: 44 }}
          />
        </div>

        {/* 3×2 card grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16, marginBottom: 40 }}>
          {CARDS.map(card => (
            <div key={card.name} style={{ display: 'flex', flexDirection: 'column', padding: 20, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, boxShadow: 'var(--shadow-sm)', cursor: 'pointer', transition: 'box-shadow 0.2s' }}
              onClick={() => handleCard(card)}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{card.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>{card.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', flex: 1, lineHeight: 1.5 }}>{card.desc}</div>
              <div style={{ marginTop: 16, fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>{card.action} →</div>
            </div>
          ))}
        </div>

        {/* Founding customer perk card */}
        {isFounder && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 20, background: '#E6F1FB', border: '2px solid #1F4E79', borderRadius: 12, marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#1F4E79', letterSpacing: '0.08em', marginBottom: 4 }}>★ FOUNDING CUSTOMER PERK</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>Stuck? Email the founder directly.</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Ram responds within 24 hours — ram@daleiq.com</div>
            </div>
            <a href="mailto:ram@daleiq.com" style={{ textDecoration: 'none' }}>
              <button style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid #1F4E79', background: 'transparent', color: '#1F4E79', fontSize: 13, fontWeight: 700, cursor: 'pointer', minHeight: 'auto' }}>
                Email Ram
              </button>
            </a>
          </div>
        )}

        {/* FAQ */}
        <div className="card" style={{ padding: 28, marginBottom: 32 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 20 }}>Frequently Asked Questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {FAQS.map((faq, i) => (
              <div key={i} style={{ borderBottom: i < FAQS.length - 1 ? '1px solid var(--border-subtle)' : 'none', paddingBottom: i < FAQS.length - 1 ? 16 : 0 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{faq.q}</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0, lineHeight: 1.6 }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* System status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: status === 'operational' ? '#1F6E43' : '#B4670F' }} />
            {status === 'operational' ? 'All systems operational' : 'Degraded performance'}
          </div>
          <a href="https://status.daleiq.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
            Status page →
          </a>
        </div>
      </div>
    </div>
  );
};

export default HelpSupport;
