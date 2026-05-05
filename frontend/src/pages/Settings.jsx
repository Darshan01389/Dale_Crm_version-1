import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';

const Toggle = ({ checked, onChange, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-subtle)' }}>
    <span style={{ fontSize: 13, color: 'var(--text)' }}>{label}</span>
    <div onClick={() => onChange(!checked)} style={{
      width: 40, height: 22, borderRadius: 11, cursor: 'pointer', transition: 'background 0.2s',
      background: checked ? 'var(--primary)' : 'var(--border)',
      position: 'relative', flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', top: 3, left: checked ? 21 : 3, width: 16, height: 16,
        borderRadius: '50%', background: 'white', transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </div>
  </div>
);

const Section = ({ title, children }) => (
  <div className="card" style={{ padding: 24, marginBottom: 16 }}>
    <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 16px' }}>{title}</h3>
    {children}
  </div>
);

const Settings = () => {
  const { profile, updateProfile, logout } = useUser();
  const { theme, setTheme } = useTheme();
  const [tab, setTab] = useState('profile');
  const [form, setForm] = useState({ name: profile.name, email: profile.email, phone: profile.phone, role: profile.role });
  const [notifs, setNotifs] = useState({ highIntent: true, atRisk: true, dailySummary: false, weeklyDigest: true });
  const [saved, setSaved] = useState(false);

  const allTabs = [
    { id: 'profile', label: 'Profile', roles: ['Sales Rep', 'Team Lead', 'Owner / Admin'] },
    { id: 'appearance', label: 'Appearance', roles: ['Sales Rep', 'Team Lead', 'Owner / Admin'] },
    { id: 'notifications', label: 'Notifications', roles: ['Sales Rep', 'Team Lead', 'Owner / Admin'] },
    { id: 'channels', label: 'Channels', roles: ['Team Lead', 'Owner / Admin'] },
    { id: 'org', label: 'Org Setup', roles: ['Owner / Admin'] },
    { id: 'security', label: 'Security', roles: ['Sales Rep', 'Team Lead', 'Owner / Admin'] },
  ];

  const tabs = allTabs.filter(t => t.roles.includes(profile.role || 'Sales Rep'));

  const save = () => {
    updateProfile(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const channels = [
    { name: 'WhatsApp', desc: 'Meta Cloud API · Business number connected', status: 'ACTIVE', icon: '💬', iconColor: '#25D366' },
    { name: 'SMS', desc: 'Twilio · India short-code enabled', status: 'ACTIVE', icon: '✉️', iconColor: '#5A5A5A' },
    { name: 'Email', desc: 'Gmail OAuth · IMAP sync enabled', status: 'PARTIAL', icon: '📧', iconColor: '#5A5A5A' },
    { name: 'Voice Capture (Android)', desc: '9 of 12 devices enrolled', status: 'PARTIAL', icon: '📞', iconColor: '#5A5A5A' },
    { name: 'Voice Capture (iOS)', desc: 'Post-call voice memo flow', status: 'INACTIVE', icon: '🎙️', iconColor: '#5A5A5A' },
  ];

  const statusCls = { ACTIVE: 'badge-active', PARTIAL: 'badge-partial', INACTIVE: 'badge-inactive' };

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--bg-subtle)' }} className="custom-scroll">
      {/* Settings tabs - Responsive scroll */}
      <div className="tab-bar hide-scroll" style={{ 
        background: 'var(--bg-surface)', 
        padding: '0 16px',
        overflowX: 'auto',
        display: 'flex',
        whiteSpace: 'nowrap',
        borderBottom: '1px solid var(--border)'
      }}>
        {tabs.map(t => (
          <button 
            key={t.id} 
            onClick={() => setTab(t.id)} 
            className={`tab ${tab === t.id ? 'active' : ''}`}
            style={{ flexShrink: 0 }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '32px var(--mobile-padding, 20px) 16px', maxWidth: 800 }}>
        <h1 className="text-h1" style={{ margin: 0 }}>Account Settings</h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8, fontWeight: 500 }}>Manage your personal profile, notifications, and organization preferences</p>
      </div>

      <div style={{ padding: '0 var(--mobile-padding, 20px) 40px', maxWidth: 640 }}>

        {/* Profile */}
        {tab === 'profile' && (
          <>
            <Section title="Profile">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: 'white' }}>
                  {profile.initials}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{profile.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{profile.role} · {profile.email}</div>
                </div>
              </div>
              {[
                { label: 'Full Name', key: 'name', type: 'text' },
                { label: 'Email Address', key: 'email', type: 'email' },
                { label: 'Phone', key: 'phone', type: 'tel' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>{f.label}</label>
                  <input type={f.type} className="input" value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                </div>
              ))}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Role</label>
                <select className="input" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                  {['Sales Rep', 'Team Lead', 'Owner / Admin'].map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button onClick={save} className="btn-primary" style={{ padding: '10px 24px' }}>Save Changes</button>
                {saved && <span style={{ fontSize: 13, color: '#1F6E43', fontWeight: 600 }}>✓ Saved</span>}
              </div>
              <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid var(--border-subtle)' }}>
                <button 
                  onClick={logout}
                  className="btn-secondary" 
                  style={{ width: '100%', color: '#DC2626', borderColor: '#FECACA', justifyContent: 'center' }}
                >
                  Sign Out of DaleIQ
                </button>
              </div>
            </Section>
          </>
        )}

        {/* Appearance */}
        {tab === 'appearance' && (
          <Section title="Appearance">
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Theme</div>
              <div style={{ display: 'flex', gap: 10 }}>
                {[{ id: 'light', label: '☀️ Light' }, { id: 'dark', label: '🌙 Dark' }, { id: 'system', label: '💻 System' }].map(t => (
                  <button key={t.id} onClick={() => setTheme(t.id)} style={{
                    flex: 1, padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                    border: `2px solid ${theme === t.id ? 'var(--primary)' : 'var(--border)'}`,
                    background: theme === t.id ? 'var(--primary-light)' : 'var(--bg-surface)',
                    color: theme === t.id ? 'var(--primary)' : 'var(--text)',
                  }}>{t.label}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Density</div>
              <select className="input" style={{ maxWidth: 240 }}>
                <option>Comfortable (Default)</option>
                <option>Compact (More data on screen)</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Language</div>
              <select className="input" style={{ maxWidth: 240 }}>
                <option>English</option>
                <option>Hindi</option>
              </select>
            </div>
          </Section>
        )}

        {/* Notifications */}
        {tab === 'notifications' && (
          <Section title="Notifications">
            <Toggle label="High-intent contact assigned to me" checked={notifs.highIntent} onChange={v => setNotifs(p => ({ ...p, highIntent: v }))} />
            <Toggle label="At-risk deal flagged" checked={notifs.atRisk} onChange={v => setNotifs(p => ({ ...p, atRisk: v }))} />
            <Toggle label="Daily summary email" checked={notifs.dailySummary} onChange={v => setNotifs(p => ({ ...p, dailySummary: v }))} />
            <Toggle label="Weekly digest" checked={notifs.weeklyDigest} onChange={v => setNotifs(p => ({ ...p, weeklyDigest: v }))} />
          </Section>
        )}

        {/* Channels */}
        {tab === 'channels' && (
          <Section title="Channel Configuration">
            {channels.map(ch => (
              <div key={ch.name} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                  {ch.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{ch.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{ch.desc}</div>
                </div>
                <span className={`badge ${statusCls[ch.status]}`}>{ch.status}</span>
                <button style={{ fontSize: 12, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Configure</button>
              </div>
            ))}
          </Section>
        )}
        {/* Org Setup */}
        {tab === 'org' && (
          <Section title="Organization Setup">
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Company Name</label>
              <input type="text" className="input" defaultValue="DaleIQ Enterprise" />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Fiscal Year Start</label>
              <select className="input">
                <option>April</option>
                <option>January</option>
              </select>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Default Currency</label>
              <select className="input">
                <option>INR (₹)</option>
                <option>USD ($)</option>
              </select>
            </div>
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 20 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Branding</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 64, height: 64, borderRadius: 12, border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🏢</div>
                <button className="btn-secondary" style={{ fontSize: 12 }}>Upload Logo</button>
              </div>
            </div>
          </Section>
        )}
        {/* Security */}
        {tab === 'security' && (
          <Section title="Security">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 8px' }}>Password</h4>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 12px' }}>Last changed 3 months ago.</p>
                <button className="btn-secondary" style={{ width: 'fit-content', padding: '8px 16px', fontSize: 13 }}>Change Password</button>
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 24 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 8px' }}>Two-Factor Authentication (2FA)</h4>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 16px' }}>Add an extra layer of security to your account using an authenticator app.</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-subtle)', borderRadius: 12, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 24 }}>📱</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Authenticator App</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{profile.is2FAEnabled ? 'Enabled' : 'Not configured'}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => updateProfile({ is2FAEnabled: !profile.is2FAEnabled })}
                    className={profile.is2FAEnabled ? "btn-secondary" : "btn-primary"} 
                    style={{ padding: '8px 16px', fontSize: 12, borderRadius: 8 }}
                  >
                    {profile.is2FAEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                  </button>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 24 }}>
                <button onClick={logout} className="btn-secondary" style={{ justifyContent: 'flex-start', gap: 10, color: '#DC2626', borderColor: '#FECACA' }}>🚪 Sign Out of All Devices</button>
              </div>
            </div>
          </Section>
        )}
      </div>
    </div>
  );
};

export default Settings;
