import React from 'react';
import { useUser } from '../contexts/UserContext';

const RoleUpgradeModal = () => {
  const { showRoleUpgradeModal, logout } = useUser();

  if (!showRoleUpgradeModal) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
    }}>
      <div className="card glass animate-in" style={{
        width: 420, padding: 32, borderRadius: 24, textAlign: 'center'
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 32,
          background: 'rgba(99, 102, 241, 0.1)', color: '#6366F1',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px'
        }}>
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        
        <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 12 }}>
          Role Upgraded!
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
          Your role in the organization has been upgraded by your administrator. Please log in again to apply these new permissions to your account.
        </p>

        <button 
          onClick={() => logout()} 
          className="btn-primary" 
          style={{ width: '100%', height: 48, fontSize: 16 }}
        >
          Log In Again
        </button>
      </div>
    </div>
  );
};

export default RoleUpgradeModal;
