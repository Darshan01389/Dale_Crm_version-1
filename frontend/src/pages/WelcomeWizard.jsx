import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const WelcomeWizard = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [persona, setPersona] = useState('');
  const [industry, setIndustry] = useState('');

  const next = () => {
    if (step < 3) setStep(step + 1);
    else navigate('/');
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column'
    }} className="animate-in">
      {/* Fluid Progress Bar */}
      <div style={{ height: 8, background: 'var(--border-subtle)', position: 'relative' }}>
        <div style={{ 
          height: '100%', background: 'linear-gradient(90deg, var(--primary) 0%, #3b82f6 100%)', 
          width: `${(step / 3) * 100}%`, transition: 'width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
          boxShadow: '0 0 15px var(--primary-glow)' 
        }} />
      </div>

      <div style={{ maxWidth: 700, width: '100%', margin: '0 auto', padding: '80px 32px', flex: 1 }}>
        <div style={{ marginBottom: 60 }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--primary)', letterSpacing: '0.2em', marginBottom: 16 }}>
            STEP {step} / 3
          </div>
          <h1 className="text-h1" style={{ fontSize: 48, marginBottom: 16, lineHeight: 1.1 }}>
            {step === 1 && "Select your role."}
            {step === 2 && "Industry context."}
            {step === 3 && "Outreach channels."}
          </h1>
          <p style={{ fontSize: 18, color: 'var(--text-muted)', lineHeight: 1.6, fontWeight: 500 }}>
            {step === 1 && "We'll tailor DaleIQ's AI insights to your persona and daily goals."}
            {step === 2 && "This calibrates your pipeline stages and default AI templates."}
            {step === 3 && "Where do your prospects usually engage with you?"}
          </p>
        </div>

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              { id: 'rep', title: 'Sales Representative', sub: 'In the field, focusing on individual closure', icon: '👤', color: 'var(--rep-accent)' },
              { id: 'lead', title: 'Team Lead / Manager', sub: 'Overseeing a team, pipeline, and performance', icon: '👥', color: 'var(--lead-accent)' },
              { id: 'owner', title: 'Business Owner / Admin', sub: 'Strategic growth and platform governance', icon: '🏢', color: 'var(--owner-accent)' },
            ].map(item => (
              <div 
                key={item.id}
                onClick={() => setPersona(item.id)}
                className="hover-lift"
                style={{
                  display: 'flex', alignItems: 'center', padding: '28px', borderRadius: 24,
                  border: `2px solid ${persona === item.id ? 'var(--primary)' : 'var(--border-subtle)'}`,
                  background: 'var(--bg-surface)',
                  cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', gap: 24,
                  boxShadow: persona === item.id ? 'var(--shadow-lg)' : 'var(--shadow-sm)'
                }}
              >
                <div style={{ 
                  width: 64, height: 64, borderRadius: 20, background: persona === item.id ? 'var(--primary)' : 'var(--bg-subtle)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
                  transition: 'all 0.3s ease', boxShadow: persona === item.id ? '0 8px 16px var(--primary-glow)' : 'none'
                }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: persona === item.id ? 'var(--primary)' : 'var(--text)' }}>{item.title}</div>
                  <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>{item.sub}</div>
                </div>
                {persona === item.id && (
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><path d="M20 6L9 17l-5-5"/></svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              'Real Estate', 'SaaS / Software', 'Consulting',
              'Agency Services', 'Education', 'Financial Services',
              'Retail / D2C', 'Healthcare', 'Logistics'
            ].map(item => (
              <div 
                key={item}
                onClick={() => setIndustry(item)}
                className="hover-lift"
                style={{
                  padding: '24px', borderRadius: 20, textAlign: 'center', cursor: 'pointer',
                  border: `2px solid ${industry === item ? 'var(--primary)' : 'var(--border-subtle)'}`,
                  background: industry === item ? 'var(--primary)' : 'var(--bg-surface)',
                  color: industry === item ? 'white' : 'var(--text)',
                  fontWeight: 700, fontSize: 16, transition: 'all 0.2s ease',
                  boxShadow: industry === item ? '0 4px 12px var(--primary-glow)' : 'var(--shadow-sm)'
                }}
              >
                {item}
              </div>
            ))}
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { id: 'wa', title: 'WhatsApp for Business', icon: '💬', desc: 'Auto-sync conversations & intent' },
              { id: 'sms', title: 'Carrier SMS / iMessage', icon: '✉️', desc: 'Unified message thread' },
              { id: 'email', title: 'Gmail / Outlook 365', icon: '📧', desc: 'Bi-directional email sync' },
            ].map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', padding: '24px 32px', borderRadius: 24, background: 'var(--bg-surface)', gap: 20, border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ fontSize: 32 }}>{item.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{item.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500, marginTop: 2 }}>{item.desc}</div>
                </div>
                <div style={{ width: 48, height: 26, borderRadius: 13, background: 'var(--primary)', position: 'relative', cursor: 'pointer' }}>
                  <div style={{ position: 'absolute', right: 4, top: 4, width: 18, height: 18, borderRadius: '50%', background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 16, background: 'rgba(31, 78, 121, 0.05)', padding: '20px 24px', borderRadius: 20, marginTop: 20, border: '1px solid rgba(31, 78, 121, 0.1)' }}>
              <span style={{ fontSize: 20 }}>✨</span>
              <p style={{ fontSize: 14, color: 'var(--primary)', margin: 0, lineHeight: 1.6, fontWeight: 600 }}>
                You can complete the deeper integration for these channels in the <span style={{ fontWeight: 800 }}>Onboarding Checklist</span> after you finish.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Premium Footer */}
      <div style={{ padding: '32px', borderTop: '1px solid var(--border)', background: 'white', zIndex: 20 }}>
        <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', gap: 16 }}>
          {step > 1 && (
            <button 
              onClick={() => setStep(step - 1)}
              className="btn-secondary"
              style={{ padding: '0 32px', borderRadius: 20, fontWeight: 700 }}
            >
              Back
            </button>
          )}
          <button 
            disabled={(step === 1 && !persona) || (step === 2 && !industry)}
            onClick={next}
            className="btn-primary" 
            style={{ 
              flex: 1, height: 64, borderRadius: 20, fontSize: 18, 
              fontWeight: 800, justifyContent: 'center',
              boxShadow: '0 8px 20px var(--primary-glow)',
              opacity: ((step === 1 && !persona) || (step === 2 && !industry)) ? 0.5 : 1
            }}
          >
            {step === 3 ? "Launch My Workspace" : "Next Step"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeWizard;
