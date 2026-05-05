import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const WelcomeWizard = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [persona, setPersona] = useState('');
  const [industry, setIndustry] = useState('');
  const [channels, setChannels] = useState({ wa: true, sms: false, email: true });

  const toggleChannel = (id) => {
    setChannels(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const next = () => {
    if (step < 3) setStep(step + 1);
    else navigate('/');
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column'
    }} className="animate-in welcome-wizard">
      <style>{`
        .wizard-content {
          max-width: 700px;
          width: 100%;
          margin: 0 auto;
          padding: 60px 24px;
          flex: 1;
        }
        @media (max-width: 600px) {
          .wizard-content { padding: 40px 16px; }
          .wizard-title { font-size: 32px !important; }
          .wizard-card { padding: 16px !important; gap: 12px !important; }
          .wizard-icon { width: 48px !important; height: 48px !important; font-size: 20px !important; }
          .industry-grid { grid-template-columns: 1fr !important; }
          .wizard-footer { padding: 16px !important; }
          .wizard-next-btn { height: 56px !important; font-size: 16px !important; }
        }
      `}</style>

      {/* Fluid Progress Bar */}
      <div style={{ height: 8, background: 'var(--border-subtle)', position: 'relative' }}>
        <div style={{ 
          height: '100%', background: 'linear-gradient(90deg, var(--primary) 0%, #3b82f6 100%)', 
          width: `${(step / 3) * 100}%`, transition: 'width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
          boxShadow: '0 0 15px var(--primary-glow)' 
        }} />
      </div>

      <div className="wizard-content">
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--primary)', letterSpacing: '0.2em', marginBottom: 12 }}>
            STEP {step} / 3
          </div>
          <h1 className="wizard-title" style={{ fontSize: 40, marginBottom: 12, lineHeight: 1.1, fontWeight: 900 }}>
            {step === 1 && "Select your role"}
            {step === 2 && "Industry context"}
            {step === 3 && "Outreach channels"}
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.6, fontWeight: 500 }}>
            {step === 1 && "We'll tailor DealIQ's AI insights to your persona and daily goals."}
            {step === 2 && "This calibrates your pipeline stages and default AI templates."}
            {step === 3 && "Where do your prospects usually engage with you?"}
          </p>
        </div>

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { id: 'rep', title: 'Sales Representative', sub: 'Focusing on individual closure', icon: '👤' },
              { id: 'lead', title: 'Team Lead / Manager', sub: 'Overseeing team performance', icon: '👥' },
              { id: 'owner', title: 'Business Owner / Admin', sub: 'Strategic growth & governance', icon: '🏢' },
            ].map(item => (
              <div 
                key={item.id}
                onClick={() => setPersona(item.id)}
                className="wizard-card hover-lift"
                style={{
                  display: 'flex', alignItems: 'center', padding: '24px', borderRadius: 20,
                  border: `2px solid ${persona === item.id ? 'var(--primary)' : 'var(--border-subtle)'}`,
                  background: 'var(--bg-surface)',
                  cursor: 'pointer', transition: 'all 0.2s ease', gap: 20,
                  boxShadow: persona === item.id ? 'var(--shadow-lg)' : 'var(--shadow-sm)'
                }}
              >
                <div className="wizard-icon" style={{ 
                  width: 56, height: 56, borderRadius: 16, background: persona === item.id ? 'var(--primary)' : 'var(--bg-subtle)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                  transition: 'all 0.2s ease', color: persona === item.id ? 'white' : 'inherit'
                }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: persona === item.id ? 'var(--primary)' : 'var(--text)' }}>{item.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2, fontWeight: 500 }}>{item.sub}</div>
                </div>
                <div style={{ 
                  width: 24, height: 24, borderRadius: '50%', 
                  border: `2px solid ${persona === item.id ? 'var(--primary)' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: persona === item.id ? 'var(--primary)' : 'transparent'
                }}>
                  {persona === item.id && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><path d="M20 6L9 17l-5-5"/></svg>}
                </div>
              </div>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="industry-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
                  padding: '20px', borderRadius: 16, textAlign: 'center', cursor: 'pointer',
                  border: `2px solid ${industry === item ? 'var(--primary)' : 'var(--border-subtle)'}`,
                  background: industry === item ? 'var(--primary)' : 'var(--bg-surface)',
                  color: industry === item ? 'white' : 'var(--text)',
                  fontWeight: 700, fontSize: 14, transition: 'all 0.2s ease',
                  boxShadow: industry === item ? '0 4px 12px var(--primary-glow)' : 'var(--shadow-sm)'
                }}
              >
                {item}
              </div>
            ))}
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { id: 'wa', title: 'WhatsApp for Business', icon: '💬', desc: 'Auto-sync intent' },
              { id: 'sms', title: 'Carrier SMS', icon: '✉️', desc: 'Unified threads' },
              { id: 'email', title: 'Gmail / Outlook', icon: '📧', desc: 'Email sync' },
            ].map(item => (
              <div 
                key={item.id} 
                onClick={() => toggleChannel(item.id)}
                className="hover-lift"
                style={{ 
                  display: 'flex', alignItems: 'center', padding: '20px 24px', 
                  borderRadius: 20, background: 'var(--bg-surface)', gap: 16, 
                  border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: 28 }}>{item.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{item.desc}</div>
                </div>
                <div 
                  style={{ width: 48, height: 26, borderRadius: 13, background: channels[item.id] ? 'var(--primary)' : 'var(--border)', position: 'relative', transition: 'background 0.3s ease' }}
                >
                  <div style={{ position: 'absolute', left: channels[item.id] ? 26 : 4, top: 4, width: 18, height: 18, borderRadius: '50%', background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: 'left 0.3s ease' }} />
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 12, background: 'rgba(31, 78, 121, 0.05)', padding: '16px', borderRadius: 16, marginTop: 12, border: '1px solid rgba(31, 78, 121, 0.1)' }}>
              <span style={{ fontSize: 18 }}>✨</span>
              <p style={{ fontSize: 13, color: 'var(--primary)', margin: 0, lineHeight: 1.5, fontWeight: 600 }}>
                You can complete deeper integration in the <span style={{ fontWeight: 800 }}>Onboarding Checklist</span> later.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Premium Footer */}
      <div className="wizard-footer" style={{ padding: '24px 32px', borderTop: '1px solid var(--border)', background: 'white', zIndex: 20 }}>
        <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', gap: 12 }}>
          {step > 1 && (
            <button 
              onClick={() => setStep(step - 1)}
              className="btn-secondary"
              style={{ padding: '0 24px', borderRadius: 16, fontWeight: 700 }}
            >
              Back
            </button>
          )}
          <button 
            disabled={(step === 1 && !persona) || (step === 2 && !industry)}
            onClick={next}
            className="wizard-next-btn btn-primary" 
            style={{ 
              flex: 1, height: 60, borderRadius: 16, fontSize: 17, 
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
