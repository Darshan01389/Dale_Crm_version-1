import React, { createContext, useContext, useEffect, useState } from 'react';

// ACCENT_COLORS are disabled in favor of Persona-based accents in UserContext
/*
export const ACCENT_COLORS = {
  purple:  '262 83% 58%',
  blue:    '217 91% 60%',
  emerald: '142 71% 45%',
  rose:    '346 84% 61%',
  amber:   '38 92% 50%',
};
*/

const ThemeContext = createContext(undefined);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('voiceiq-theme');
    return savedTheme || 'system';
  });

  /*
  const [accentColor, setAccentColor] = useState(() => {
    const saved = localStorage.getItem('voiceiq-accent');
    return saved || 'purple';
  });
  */

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }

    localStorage.setItem('voiceiq-theme', theme);
  }, [theme]);

  /*
  // Apply Accent Color
  useEffect(() => {
    const root = window.document.documentElement;
    const hsl = ACCENT_COLORS[accentColor];
    root.style.setProperty('--primary', hsl);
    localStorage.setItem('voiceiq-accent', accentColor);
  }, [accentColor]);
  */

  // Handle system theme changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(mediaQuery.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
