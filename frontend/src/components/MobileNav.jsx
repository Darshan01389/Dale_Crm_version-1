import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

const navItems = [
  {
    path: '/pulse',
    label: 'Pulse',
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h2l2-6 3 12 3-8 2 4h3"/>
      </svg>
    ),
    roles: ['Sales Rep', 'Team Lead'], // Screen 1
  },
  {
    path: '/today',
    label: 'Today',
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
      </svg>
    ),
    roles: ['Sales Rep', 'Team Lead'], // Screen 2
  },
  {
    path: '/inbox',
    label: 'Inbox',
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3v-3z"/>
      </svg>
    ),
    roles: ['Sales Rep', 'Team Lead'], // Screen 3
  },
  {
    path: '/',
    label: 'Dash',
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
      </svg>
    ),
    roles: ['Team Lead', 'Owner / Admin'], // Screen 7
  },
  {
    path: '/settings',
    label: 'Profile',
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
      </svg>
    ),
    roles: ['Sales Rep', 'Team Lead', 'Owner / Admin'], // Screen 14
  },
];

const MobileNav = () => {
  const location = useLocation();
  const { profile } = useUser();

  const filteredItems = navItems.filter(item => 
    item.roles.includes(profile.role || 'Sales Rep')
  );

  return (
    <nav className="mobile-nav mobile-only glass" style={{ 
      position: 'fixed', bottom: 0, left: 0, right: 0, height: 72, 
      display: 'flex', justifyContent: 'space-around', alignItems: 'center', 
      padding: '0 12px', zIndex: 1000, 
      borderTop: '1px solid var(--border-subtle)',
      background: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(16px) saturate(180%)'
    }}>
      {filteredItems.map(item => {
        const isActive = item.path === '/' 
          ? location.pathname === '/' 
          : location.pathname.startsWith(item.path);
        
        return (
          <Link 
            key={item.path} 
            to={item.path} 
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              textDecoration: 'none', color: isActive ? 'var(--primary)' : 'var(--text-muted)',
              flex: 1, padding: '8px 0', transition: 'all 0.2s ease',
              position: 'relative'
            }}
          >
            {isActive && (
              <div style={{
                position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)',
                width: 32, height: 3, background: 'var(--primary)', borderRadius: '0 0 4px 4px',
                boxShadow: '0 2px 8px var(--primary-glow)'
              }} />
            )}
            <div style={{ 
              color: isActive ? 'var(--primary)' : 'var(--text-muted)',
              transform: isActive ? 'scale(1.1) translateY(-2px)' : 'scale(1)',
              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}>
              {item.icon}
            </div>
            <span style={{ 
              fontSize: 10, fontWeight: isActive ? 800 : 600, 
              letterSpacing: '0.02em', textTransform: 'uppercase' 
            }}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default MobileNav;
