import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { ThemeProvider } from './contexts/ThemeContext'
import { UserProvider } from './contexts/UserContext'

// Apply saved theme immediately to prevent flash
const savedTheme = localStorage.getItem('voiceiq-theme') || 'light';
if (savedTheme === 'dark') {
  document.documentElement.classList.add('dark');
} else if (savedTheme === 'system') {
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.classList.add('dark');
  }
}

// Apply persona accent color immediately
const themes = {
  'Sales Rep': { color: '#4F46E5', glow: 'rgba(79, 70, 229, 0.15)' },
  'Team Lead': { color: '#4F46E5', glow: 'rgba(79, 70, 229, 0.15)' },
  'Owner / Admin': { color: '#4F46E5', glow: 'rgba(79, 70, 229, 0.15)' }
};
try {
  const savedProfile = JSON.parse(localStorage.getItem('voiceiq_profile') || '{}');
  const role = savedProfile.role || 'Sales Rep';
  const theme = themes[role] || themes['Team Lead'];
  document.documentElement.style.setProperty('--primary', theme.color);
  document.documentElement.style.setProperty('--primary-glow', theme.glow);
} catch (e) {
  // Default to Sales Rep color
  document.documentElement.style.setProperty('--primary', '#4F46E5');
  document.documentElement.style.setProperty('--primary-glow', 'rgba(79, 70, 229, 0.15)');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <UserProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </UserProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
