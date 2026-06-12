import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

const SuperAdminCommunity = () => {
  const navigate = useNavigate();
  const { profile } = useUser();

  useEffect(() => {
    if (!profile?.isSuperAdmin) navigate('/');
  }, [profile, navigate]);

  if (!profile?.isSuperAdmin) return null;

  const sections = [
    {
      title: 'Community Forums',
      desc: 'Manage community discussion threads and posts. Pin announcements, remove spam, and configure categories.',
      icon: '💬',
      color: '#4F46E5',
      action: () => navigate('/community-forums'),
      cta: 'Open Forums',
    },
    {
      title: 'About Community',
      desc: 'Configure community welcome content, rules, and feature highlights shown to all users.',
      icon: '🌐',
      color: '#10B981',
      action: () => navigate('/community'),
      cta: 'Configure',
    },
    {
      title: 'Announcements',
      desc: 'Post global announcements visible to all DaleCRM tenants. Great for product updates and new feature releases.',
      icon: '📢',
      color: '#F59E0B',
      action: null,
      cta: 'Coming Soon',
    },
    {
      title: 'Moderation Logs',
      desc: 'Review community moderation events, flagged content, and admin actions with full audit trail.',
      icon: '🛡️',
      color: '#EC4899',
      action: null,
      cta: 'Coming Soon',
    },
  ];

  return (
    <div style={{ padding: '32px', overflowY: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>Community Admin</h2>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
          Manage the DaleCRM community experience for all tenants
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {sections.map(section => (
          <div key={section.title} style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            transition: 'all 0.2s ease',
          }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: `${section.color}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24,
            }}>
              {section.icon}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
                {section.title}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {section.desc}
              </div>
            </div>
            <button
              onClick={section.action || undefined}
              disabled={!section.action}
              style={{
                marginTop: 'auto',
                padding: '10px 16px',
                borderRadius: 10,
                border: 'none',
                background: section.action ? section.color : 'var(--bg-subtle)',
                color: section.action ? 'white' : 'var(--text-muted)',
                fontSize: 13,
                fontWeight: 600,
                cursor: section.action ? 'pointer' : 'not-allowed',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={e => { if (section.action) e.currentTarget.style.opacity = '0.85'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
            >
              {section.cta}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SuperAdminCommunity;
