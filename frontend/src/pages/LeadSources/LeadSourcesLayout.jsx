import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';

const navTabs = [
  { path: '/sources/connected', label: 'Connected Sources' },
  { path: '/sources/analytics', label: 'Analytics' },
  { path: '/sources/automation', label: 'Automation Rules' },
  { path: '/sources/webhooks', label: 'Webhooks' },
];

const LeadSourcesLayout = () => {
  const location = useLocation();

  return (
    <div style={{ padding: '24px 40px', maxWidth: 1200, margin: '0 auto', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 className="text-h1" style={{ marginBottom: 8 }}>Lead Sources</h1>
          <p className="text-muted">Manage all external data sources, integrations, and campaign analytics.</p>
        </div>
        <Link 
          to="/sources/add"
          className="btn-primary" 
          style={{ textDecoration: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Source
        </Link>
      </div>

      <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid var(--border)', marginBottom: 32 }}>
        {navTabs.map(tab => {
          const isActive = location.pathname.startsWith(tab.path) || (location.pathname === '/sources' && tab.path === '/sources/connected');
          return (
            <Link
              key={tab.path}
              to={tab.path}
              style={{
                textDecoration: 'none',
                padding: '12px 0',
                fontWeight: 600,
                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                borderBottom: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                transition: 'all 0.2s ease'
              }}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <Outlet />
    </div>
  );
};

export default LeadSourcesLayout;
