import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import GlobalSearch from './GlobalSearch';
import NotificationPanel from './NotificationPanel';

const pageTitles = {
  '/': 'Team Pulse',
  '/inbox': 'Global Inbox',
  '/leads': 'Leads Pipeline',
  '/kanban': 'Kanban Board',
  '/analytics': 'Forecast',
  '/forecast': 'Revenue Forecast',
  '/settings': 'Account Settings',
  '/today': "Today's Tasks",
  '/pulse': 'My Pulse',
  '/coach': 'Call Coach',
  '/calendar': 'Calendar',
  '/sources': 'Lead Sources',
  '/team-mgmt': 'Team Management',
  '/org-settings': 'Org Setup',
  '/team-reports': 'Team Reports',
  '/help': 'Help & Support',
  '/billing': 'Billing & Plans',
  '/welcome': 'Welcome',
  '/super-admin': 'Global Overview',
  '/super-admin/companies': 'All Companies',
  '/super-admin/forecasting': 'Global Forecasting',
  '/super-admin/lead-sources': 'Lead Source Usage',
  '/super-admin/community': 'Community Admin',
};


const CompanySelector = ({ selectedCompanyId, setSelectedCompanyId }) => {
  const [companies, setCompanies] = useState([]);
  const [open, setOpen] = useState(false);
  const token = sessionStorage.getItem('voiceiq_token') || localStorage.getItem('voiceiq_token');

  useEffect(() => {
    if (!token) return;
    fetch('/api/company/', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => setCompanies(Array.isArray(data) ? data : []))
      .catch(() => setCompanies([]));
  }, [token]);

  const selected = companies.find(c => c.id === selectedCompanyId);
  const label = selected ? selected.name : 'All Companies';

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          borderRadius: 10,
          border: '1px solid var(--border)',
          background: 'var(--bg-subtle)',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--text)',
          transition: 'all 0.2s ease',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'var(--bg-surface)';
          e.currentTarget.style.borderColor = 'var(--primary)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'var(--bg-subtle)';
          e.currentTarget.style.borderColor = 'var(--border)';
        }}
      >
        {/* Globe icon for All / Building icon for specific company */}
        {selectedCompanyId ? (
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--primary)" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        ) : (
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--primary)" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease', flexShrink: 0 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className="dropdown animate-fadein"
          style={{
            position: 'absolute',
            left: 0,
            top: 'calc(100% + 6px)',
            minWidth: 220,
            maxHeight: 280,
            overflowY: 'auto',
            zIndex: 200,
          }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ padding: 6 }}>
            {/* "All Companies" option */}
            <button
              onClick={() => { setSelectedCompanyId(null); setOpen(false); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '8px 10px',
                borderRadius: 8,
                background: selectedCompanyId === null ? 'var(--primary)' : 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                color: selectedCompanyId === null ? 'white' : 'var(--text)',
                fontWeight: selectedCompanyId === null ? 700 : 500,
                textAlign: 'left',
                transition: 'background 0.15s',
              }}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              All Companies
            </button>

            {/* Divider */}
            {companies.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />
            )}

            {/* List of companies */}
            {companies.map(company => (
              <button
                key={company.id}
                onClick={() => { setSelectedCompanyId(company.id); setOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  background: selectedCompanyId === company.id ? 'var(--primary)' : 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  color: selectedCompanyId === company.id ? 'white' : 'var(--text)',
                  fontWeight: selectedCompanyId === company.id ? 700 : 500,
                  textAlign: 'left',
                  transition: 'background 0.15s',
                }}
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {company.name}
                </span>
              </button>
            ))}

            {companies.length === 0 && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 10px', margin: 0 }}>
                No companies found
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


const Header = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, updateProfile, logout, selectedCompanyId, setSelectedCompanyId } = useUser();


  const title = pageTitles[location.pathname] || 'DaleIQ';

  useEffect(() => {
    const handleKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    if (!profileOpen) return;
    const handler = () => setProfileOpen(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [profileOpen]);

  return (
    <header className="header-container">
      {/* Left: page title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' }}>
        <h1 className="header-title">
          {title}
        </h1>
        {/* Super Admin badge */}
        {profile?.isSuperAdmin && (
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 20,
            background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
            color: 'white',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            flexShrink: 0,
          }}>
            Super Admin
          </span>
        )}
      </div>

      {/* Center: Super Admin Company Selector OR Search */}
      {profile?.isSuperAdmin ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <CompanySelector
            selectedCompanyId={selectedCompanyId}
            setSelectedCompanyId={setSelectedCompanyId}
          />
          <div
            onClick={() => setSearchOpen(true)}
            className="header-search"
            style={{ flex: 1 }}
          >
            <svg className="header-search-icon" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <span className="header-search-text">Search...</span>
            <div className="header-search-shortcut">⌘K</div>
          </div>
        </div>
      ) : (
        <div
          onClick={() => setSearchOpen(true)}
          className="header-search"
        >
          <svg className="header-search-icon" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <span className="header-search-text">Search leads, calls, messages...</span>
          <div className="header-search-shortcut">⌘K</div>
        </div>
      )}

      {/* Right: notifications + profile */}
      <div className="header-actions">
        <button
          onClick={() => setNotifOpen(true)}
          className="header-notif-btn"
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
          </svg>
          <span className="header-notif-badge"/>
        </button>

        <div className="profile-container" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
          >
            <div className="profile-avatar">
              {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
            </div>
          </button>
          {profileOpen && (
            <div className="dropdown animate-fadein" style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', width: 200, zIndex: 100 }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: 0 }}>{profile.name}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>{profile.email}</p>
                {profile?.isSuperAdmin && (
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#7C3AED', margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    DaleCRM Owner
                  </p>
                )}
              </div>
              <div style={{ padding: 8 }}>
                {profile?.isSuperAdmin && (
                  <button onClick={() => { navigate('/super-admin'); setProfileOpen(false); }} style={{ display: 'flex', width: '100%', padding: '8px 10px', borderRadius: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#7C3AED', textAlign: 'left', fontWeight: 600 }}>
                    Global Overview
                  </button>
                )}
                <button onClick={() => { navigate('/settings'); setProfileOpen(false); }} style={{ display: 'flex', width: '100%', padding: '8px 10px', borderRadius: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text)', textAlign: 'left' }}>Profile & Settings</button>
                <button onClick={logout} style={{ display: 'flex', width: '100%', padding: '8px 10px', borderRadius: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#DC2626', textAlign: 'left' }}>Sign Out</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <NotificationPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
    </header>
  );
};

export default Header;
