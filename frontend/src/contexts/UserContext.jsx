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
    try {
      const saved = localStorage.getItem('voiceiq_profile');
      if (saved) {
        initialProfile = { ...defaultProfile, ...JSON.parse(saved) };
      }
    } catch {}
    applyTheme(initialProfile.role);
    return initialProfile;
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
