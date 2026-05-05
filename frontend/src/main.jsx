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
  'Sales Rep': { color: '#1F6E43', glow: 'rgba(31, 110, 67, 0.15)' },
  'Team Lead': { color: '#1F4E79', glow: 'rgba(31, 78, 121, 0.15)' },
  'Owner / Admin': { color: '#7C4A2D', glow: 'rgba(124, 74, 45, 0.15)' }
};
try {
  const savedProfile = JSON.parse(localStorage.getItem('voiceiq_profile') || '{}');
  const role = savedProfile.role || 'Sales Rep';
  const theme = themes[role] || themes['Team Lead'];
  document.documentElement.style.setProperty('--primary', theme.color);
  document.documentElement.style.setProperty('--primary-glow', theme.glow);
} catch (e) {
  // Default to Sales Rep color
  document.documentElement.style.setProperty('--primary', '#1F6E43');
  document.documentElement.style.setProperty('--primary-glow', 'rgba(31, 110, 67, 0.15)');
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
