import React, { createContext, useContext, useEffect } from 'react';
import { useUser } from './UserContext';

const PERSONA_COLORS = {
  'Sales Rep':    '#4F46E5',  // Forest Green
  'Team Lead':    '#4F46E5',  // DaleIQ Blue
  'Owner / Admin':'#4F46E5',  // Warm Brown
};

const PERSONA_GLOW = {
  'Sales Rep':    'rgba(79, 70, 229, 0.15)',
  'Team Lead':    'rgba(79, 70, 229, 0.15)',
  'Owner / Admin':'rgba(79, 70, 229, 0.15)',
};

const PersonaContext = createContext(null);

export const PersonaProvider = ({ children }) => {
  const { profile } = useUser();

  useEffect(() => {
    const role = profile?.role || 'Team Lead';
    const color = PERSONA_COLORS[role] || '#4F46E5';
    const glow  = PERSONA_GLOW[role]  || 'rgba(31,78,121,0.15)';
    document.documentElement.style.setProperty('--persona-accent', color);
    document.documentElement.style.setProperty('--primary', color);
    document.documentElement.style.setProperty('--primary-glow', glow);
  }, [profile?.role]);

  return (
    <PersonaContext.Provider value={{ role: profile?.role }}>
      {children}
    </PersonaContext.Provider>
  );
};

export const usePersona = () => useContext(PersonaContext);
export default PersonaProvider;
