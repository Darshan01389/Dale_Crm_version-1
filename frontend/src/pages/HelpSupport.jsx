import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';

const CARDS = [
  { icon: '💬', name: 'Chat with Support', desc: 'Avg response: 3 minutes', action: 'OPEN CHAT', href: 'mailto:supportaicrm@gmail.com' },
  { icon: '📚', name: 'Knowledge Base', desc: 'About Dale IQ, Community forums, and 120+ video tutorials', action: 'BROWSE', href: null, internal: '/community' },
  { icon: '✉️', name: 'Email Support', desc: 'supportaicrm@gmail.com · 1-day response', action: 'EMAIL', href: 'mailto:supportaicrm@gmail.com' },
  { icon: '🐛', name: 'Report a Bug', desc: 'Help us fix it fast', action: 'REPORT', href: 'mailto:bugsaicrm@gmail.com' },
  { icon: '💡', name: 'Suggest a Feature', desc: 'Vote on the roadmap', action: 'SUBMIT', href: 'mailto:feedbackaicrm@gmail.com' },
];

const FAQS = [
  { q: 'How do I connect my WhatsApp?', a: 'Go to Settings → Channels and click "Connect WhatsApp". You will need your Meta Developer credentials.' },
  { q: 'Can I reassign multiple leads at once?', a: 'Yes, go to the Leads table, select multiple checkboxes, and click "Reassign" from the bulk actions menu.' },
  { q: 'How is the AI Win Probability calculated?', a: 'Our model analyses historical conversion rates, communication velocity, sentiment from transcripts, and firmographic data.' },
];
const HelpSupport = () => {
  const navigate = useNavigate();
  const { profile } = useUser();
  const { theme } = useTheme();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('operational');
  const isFounder = profile?.is_founding_customer;

  const [showChatbot, setShowChatbot] = useState(false);
  const [chatbotUrl, setChatbotUrl] = useState('');
  const iframeRef = React.useRef(null);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data === 'closeChat') {
        setShowChatbot(false);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Set chatbot URL once when opening to avoid resetting conversation history
  useEffect(() => {
    if (showChatbot) {
      const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#4F46E5';
      setChatbotUrl(`/api/chatbot/ui?theme=${theme}&primary=${encodeURIComponent(primaryColor)}`);
    } else {
      setChatbotUrl('');
    }
  }, [showChatbot]);

  // Dynamically synchronize theme changes to the running chatbot session without reload
  useEffect(() => {
    if (showChatbot && iframeRef.current) {
      const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#4F46E5';
      iframeRef.current.contentWindow?.postMessage({
        type: 'theme-change',
        theme,
        primary: primaryColor
      }, '*');
    }
  }, [theme, showChatbot]);

  const handleCard = (card) => {
    if (card.internal) { navigate(card.internal); return; }
    if (card.name === 'Chat with Support') {
      setShowChatbot(true);
      return;
    }
    if (card.href) window.open(card.href, '_blank');
  };

  if (showChatbot && chatbotUrl) {
    return (
      <div style={{ height: '100%', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
        <iframe
          ref={iframeRef}
          src={chatbotUrl}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="DaleIQ Assistant"
        />
      </div>
    );
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--bg)' }} className="custom-scroll animate-in">
      <style>{`
        .help-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }
        @media (max-width: 768px) {
          .help-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .status-footer {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 12px;
          }
        }
      `}</style>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: 'var(--mobile-padding, 40px 24px 80px)' }}>

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
            style={{ paddingLeft: 44, height: 48 }}
          />
        </div>

        {/* 3×2 card grid */}
        <div className="help-grid">
          {CARDS.map(card => (
            <div key={card.name}
              className="hover-lift"
              style={{
                display: 'flex', flexDirection: 'column', padding: 24,
                background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                borderRadius: 16, boxShadow: 'var(--shadow-sm)', cursor: 'pointer',
                transition: 'all 0.2s ease', minHeight: 200
              }}
              onClick={() => handleCard(card)}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>{card.icon}</div>
              <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)', marginBottom: 6 }}>{card.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', flex: 1, lineHeight: 1.6 }}>{card.desc}</div>
              <div style={{ marginTop: 20, fontSize: 13, fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                {card.action} <span style={{ fontSize: 16 }}>→</span>
              </div>
            </div>
          ))}
        </div>

        {/* Founding customer perk card */}
        {isFounder && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 24, background: 'rgba(79, 70, 229, 0.05)', border: '2px solid var(--primary)', borderRadius: 16, marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--primary)', letterSpacing: '0.1em', marginBottom: 6 }}>★ FOUNDING CUSTOMER PERK</div>
              <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)', marginBottom: 4 }}>Stuck? Email the founder directly.</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Ram responds within 24 hours — ram@daleiq.com</div>
            </div>
            <a href="mailto:ram@daleiq.com" style={{ textDecoration: 'none' }}>
              <button className="btn-primary" style={{ padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 800 }}>
                Email Ram
              </button>
            </a>
          </div>
        )}

        {/* FAQ */}
        <div className="card" style={{ padding: 32, marginBottom: 40, borderRadius: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 24 }}>Frequently Asked Questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {FAQS.map((faq, i) => (
              <div key={i} style={{ borderBottom: i < FAQS.length - 1 ? '1px solid var(--border-subtle)' : 'none', paddingBottom: i < FAQS.length - 1 ? 20 : 0 }}>
                <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 8, color: 'var(--text)' }}>{faq.q}</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0, lineHeight: 1.6, fontWeight: 500 }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* System status */}
        <div className="status-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: status === 'operational' ? '#6366F1' : '#F59E0B', boxShadow: status === 'operational' ? '0 0 8px rgba(99, 102, 241, 0.4)' : 'none' }} />
            {status === 'operational' ? 'All systems operational' : 'Degraded performance'}
          </div>
          <a href="https://status.daleiq.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            Status page <span>↗</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default HelpSupport;
