import React from 'react';

const AboutCommunity = () => {
  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--bg)', padding: '40px 24px' }} className="custom-scroll animate-in">
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1 className="text-h1" style={{ marginBottom: 12 }}>Deal IQ Community & About</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 16, marginBottom: 40 }}>Welcome to the official Deal IQ headquarters. Learn about our mission and connect with other sales leaders.</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 32, marginBottom: 48 }}>
          <div className="card glass" style={{ padding: 40 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>About Deal IQ</h2>
            <p style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--text)', marginBottom: 20 }}>
              Deal IQ is the world's first AI-native Sales Intelligence platform designed for high-velocity teams. 
              Our mission is to eliminate CRM data entry and replace it with automated intelligence that helps you close deals faster.
            </p>
            <p style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--text)' }}>
              Built by sales veterans for sales leaders, Deal IQ combines advanced LLMs with real-time communication signals 
              to provide a "GPS for your pipeline."
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 32 }}>
              <div style={{ padding: 20, background: 'var(--bg-subtle)', borderRadius: 16 }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>🚀</div>
                <div style={{ fontWeight: 800, fontSize: 14 }}>Fastest Growing</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Over 500+ teams onboarded in 2024.</div>
              </div>
              <div style={{ padding: 20, background: 'var(--bg-subtle)', borderRadius: 16 }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>🤖</div>
                <div style={{ fontWeight: 800, fontSize: 14 }}>AI-First</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>90% of data entry automated via LLMs.</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card" style={{ padding: 30, background: 'var(--primary)', color: 'white' }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Join the Community</h3>
              <p style={{ fontSize: 13, opacity: 0.9, marginBottom: 24, lineHeight: 1.6 }}>
                Connect with 5,000+ sales professionals using Deal IQ to redefine their workflows.
              </p>
              <button style={{ 
                width: '100%', padding: '14px', borderRadius: 12, border: 'none', 
                background: 'white', color: 'var(--primary)', fontWeight: 800, cursor: 'pointer' 
              }}>
                Access Forums →
              </button>
            </div>
            
            <div className="card" style={{ padding: 30 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Community Stats</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Total Members</span>
                  <span style={{ fontWeight: 800 }}>12,402</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Active Discussions</span>
                  <span style={{ fontWeight: 800 }}>842</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>New Posts (Today)</span>
                  <span style={{ fontWeight: 800, color: '#6366F1' }}>+48</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24 }}>Popular Community Discussions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20, marginBottom: 60 }}>
          {[
            { title: 'Best prompts for WhatsApp follow-ups?', tags: ['AI', 'Templates'], views: '1.2k' },
            { title: 'Setting up multi-channel sequences', tags: ['Workflow', 'Setup'], views: '840' },
            { title: 'Deal IQ vs Traditional CRM', tags: ['Strategy'], views: '2.5k' }
          ].map((topic, i) => (
            <div key={topic.title} className="card glass" style={{ padding: 24, cursor: 'pointer' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                {topic.tags.map(t => (
                  <span key={t} style={{ fontSize: 10, fontWeight: 900, background: 'var(--bg-subtle)', padding: '4px 8px', borderRadius: 4, letterSpacing: 0.5 }}>{t.toUpperCase()}</span>
                ))}
              </div>
              <h4 style={{ fontSize: 15, fontWeight: 800, marginBottom: 16, lineHeight: 1.4 }}>{topic.title}</h4>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{topic.views} views • 12 replies</div>
            </div>
          ))}
        </div>

        <div style={{ padding: 40, background: 'var(--bg-surface)', borderRadius: 24, border: '1px solid var(--border-subtle)' }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 32, textAlign: 'center' }}>Community Values</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 32 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>🤝</div>
              <h4 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Radical Candor</h4>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>We share honest feedback to help each other grow as sales professionals.</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>💡</div>
              <h4 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Knowledge Sharing</h4>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>We believe that a rising tide lifts all boats. Share your best prompts!</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>🛡️</div>
              <h4 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Respect & Safety</h4>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>Our community is a safe space for learning. No spam, just value.</p>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 60, textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 }}>Need more help? <span style={{ color: 'var(--primary)', cursor: 'pointer' }} onClick={() => window.open('https://docs.daleiq.com', '_blank')}>Visit Official Docs</span></p>
        </div>
      </div>
    </div>
  );
};

export default AboutCommunity;
