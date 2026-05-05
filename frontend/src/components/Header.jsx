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
};


const Header = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, updateProfile, logout } = useUser();


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

  return (
    <header style={{
      height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)',
      flexShrink: 0, position: 'relative', zIndex: 40,
    }}>
      {/* Left: page title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
          {title}
        </h1>
      </div>


      {/* Center: Search Trigger */}
      <div 
        onClick={() => setSearchOpen(true)}
        style={{ 
          position: 'relative', width: 320, cursor: 'pointer',
          padding: '7px 12px 7px 34px', border: '1px solid var(--border)',
          borderRadius: 8, fontSize: 13, background: 'var(--bg-subtle)', color: '#9CA3AF'
        }}
      >
        <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
          width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        Search leads, calls, messages...
        <div style={{
          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
          padding: '2px 6px', background: 'white', border: '1px solid var(--border)',
          borderRadius: 4, fontSize: 10, fontWeight: 800
        }}>⌘K</div>
      </div>

      {/* Right: notifications + profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={() => setNotifOpen(true)}
          style={{
            position: 'relative', background: 'none', border: 'none', cursor: 'pointer',
            padding: 8, borderRadius: 8, color: 'var(--text-muted)',
          }}
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
          </svg>
          <span style={{
            position: 'absolute', top: 8, right: 8, width: 8, height: 8,
            borderRadius: '50%', background: '#EF4444', border: '2px solid var(--bg-surface)',
          }}/>
        </button>

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white'
            }}>
              {profile.initials}
            </div>
          </button>
          {profileOpen && (
            <div className="dropdown animate-fadein" style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', width: 200, zIndex: 100 }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: 0 }}>{profile.name}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>{profile.email}</p>
              </div>
              <div style={{ padding: 8 }}>
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

