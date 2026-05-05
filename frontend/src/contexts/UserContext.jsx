import React, { createContext, useContext, useState, useEffect } from 'react';

const defaultProfile = {
  name: 'Darshan Kumar',
  email: 'darshan@voiceiq.ai',
  phone: '+91 98765 43210',
  role: 'Sales Rep',
  initials: 'DK',
  is2FAEnabled: false,
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

export const UserProvider = ({ children }) => {
  const applyTheme = (role) => {
    const roleColors = {
      'Sales Rep': 'var(--rep-accent)',
      'Team Lead': 'var(--lead-accent)',
      'Owner / Admin': 'var(--owner-accent)'
    };
    if (roleColors[role]) {
      document.documentElement.style.setProperty('--primary', roleColors[role]);
    }
  };

  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('voiceiq_profile');
      if (saved) {
        const parsed = { ...defaultProfile, ...JSON.parse(saved) };
        applyTheme(parsed.role);
        return parsed;
      }
    } catch {}
    applyTheme(defaultProfile.role);
    return defaultProfile;
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('voiceiq_token');
      if (!token) return;

      try {
        const response = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          updateProfile({
            name: data.name,
            email: data.email,
            role: data.role || 'Sales Rep'
          });
        }
      } catch (err) {
        console.error('Failed to sync profile:', err);
      }
    };
    fetchProfile();
  }, []);

  const updateProfile = (updates) => {
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
    localStorage.removeItem('voiceiq_token');
    localStorage.removeItem('voiceiq_profile');
    window.location.href = '/login';
  };

  return (
    <UserContext.Provider value={{ profile, updateProfile, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
};
