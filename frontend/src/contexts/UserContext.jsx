import React, { createContext, useContext, useState, useEffect } from 'react';

const defaultProfile = {
  name: 'Darshan Kumar',
  email: 'darshan@voiceiq.ai',
  phone: '+91 98765 43210',
  role: 'Sales Rep',
  initials: 'DK',
  is2FAEnabled: false,
  isSuperAdmin: false,
  companyId: null,
};

function getInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

const UserContext = createContext(undefined);

const applyTheme = (role) => {
  const themes = {
    'Sales Rep': { color: '#4F46E5', glow: 'rgba(79, 70, 229, 0.15)' },
    'Team Lead': { color: '#4F46E5', glow: 'rgba(79, 70, 229, 0.15)' },
    'Owner / Admin': { color: '#4F46E5', glow: 'rgba(79, 70, 229, 0.15)' }
  };
  const theme = themes[role] || themes['Team Lead'];
  document.documentElement.style.setProperty('--primary', theme.color);
  document.documentElement.style.setProperty('--primary-glow', theme.glow);
};

export const UserProvider = ({ children }) => {

  const [profile, setProfile] = useState(() => {
    let initialProfile = defaultProfile;
    applyTheme(initialProfile.role);
    return initialProfile;
  });

  // Super Admin context: when Super Admin selects a company to view,
  // selectedCompanyId holds that company's ID (null = viewing all companies)
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = sessionStorage.getItem('voiceiq_token') || localStorage.getItem('voiceiq_token');
      if (!token) return;

      try {
        const response = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setProfile(prev => {
            const isSuperAdmin = data.email === 'daleaicrm@gmail.com' || data.is_super_admin === true;
            const next = {
              ...prev,
              name: data.name,
              email: data.email,
              role: data.role || 'Sales Rep',
              initials: getInitials(data.name),
              isSuperAdmin,
              companyId: data.company_id ?? null,
            };
            localStorage.setItem('voiceiq_profile', JSON.stringify(next));
            applyTheme(next.role);
            return next;
          });
        }
      } catch (err) {
        console.error('Failed to sync profile:', err);
      }
    };
    fetchProfile();
  }, []);

  const updateProfile = async (updates) => {
    const token = sessionStorage.getItem('voiceiq_token') || localStorage.getItem('voiceiq_token');
    if (token) {
      try {
        const response = await fetch('/api/auth/me', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updates)
        });
        if (response.ok) {
          const data = await response.json();
          updates = {
            ...updates,
            name: data.name,
            email: data.email,
            role: data.role
          };
        }
      } catch (err) {
        console.error('Failed to save profile updates to database:', err);
      }
    }

    setProfile(prev => {
      const next = {
        ...prev,
        ...updates,
        initials: updates.name ? getInitials(updates.name) : prev.initials,
      };
      localStorage.setItem('voiceiq_profile', JSON.stringify(next));
      if (updates.role) {
        applyTheme(updates.role);
      }
      return next;
    });
  };

  const logout = () => {
    sessionStorage.removeItem('voiceiq_token');
    sessionStorage.removeItem('voiceiq_refresh_token');
    localStorage.removeItem('voiceiq_token');
    localStorage.removeItem('voiceiq_refresh_token');
    localStorage.removeItem('voiceiq_profile');
    window.location.href = '/login';
  };

  return (
    <UserContext.Provider value={{
      profile,
      updateProfile,
      logout,
      selectedCompanyId,
      setSelectedCompanyId,
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
};
