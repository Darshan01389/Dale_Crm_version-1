import React, { createContext, useContext, useEffect } from 'react';
import { useUser } from './UserContext';

const PERSONA_COLORS = {
  'Sales Rep':    '#1F6E43',  // Forest Green
  'Team Lead':    '#1F4E79',  // DaleIQ Blue
  'Owner / Admin':'#7C4A2D',  // Warm Brown
};

const PERSONA_GLOW = {
  'Sales Rep':    'rgba(31, 110, 67, 0.15)',
  'Team Lead':    'rgba(31, 78, 121, 0.15)',
  'Owner / Admin':'rgba(124, 74, 45, 0.15)',
};

const PersonaContext = createContext(null);

export const PersonaProvider = ({ children }) => {
  const { profile } = useUser();

  useEffect(() => {
    const role = profile?.role || 'Team Lead';
    const color = PERSONA_COLORS[role] || '#1F4E79';
    const glow  = PERSONA_GLOW[role]  || 'rgba(31,78,121,0.15)';
    /*
    document.documentElement.style.setProperty('--persona-accent', color);
    document.documentElement.style.setProperty('--primary', color);
    document.documentElement.style.setProperty('--primary-glow', glow);
    */
  }, [profile?.role]);

  return (
    <PersonaContext.Provider value={{ role: profile?.role }}>
      {children}
    </PersonaContext.Provider>
  );
};

export const usePersona = () => useContext(PersonaContext);
export default PersonaProvider;
