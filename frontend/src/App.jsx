import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import GlobalInbox from './pages/GlobalInbox';
import Kanban from './pages/Kanban';
import MobilePipeline from './pages/MobilePipeline';
import CallCoach from './pages/CallCoach';
import Forecast from './pages/Forecast';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import { useUser } from './contexts/UserContext';
import MobileNav from './components/MobileNav';
import Today from './pages/Today';
import WelcomeWizard from './pages/WelcomeWizard';
import Calendar from './pages/Calendar';
import LeadSourceHub from './pages/LeadSourceHub';
import LeadDetails from './pages/LeadDetails';
import RepPulse from './pages/RepPulse';
import TeamManagement from './pages/TeamManagement';
import OrgSettings from './pages/OrgSettings';
import TeamReports from './pages/TeamReports';
import HelpSupport from './pages/HelpSupport';
import Billing from './pages/Billing';
import ChannelSettings from './pages/ChannelSettings';
import ForgotPassword from './pages/ForgotPassword';
import AboutCommunity from './pages/AboutCommunity';
import OfflineBanner from './components/OfflineBanner';
import { ToastProvider } from './contexts/ToastContext';
import { PersonaProvider } from './contexts/PersonaContext';

// mobile detection hook
const useIsMobile = () => {
  const [mobile, setMobile] = React.useState(window.innerWidth < 768);
  React.useEffect(() => {
    const h = () => setMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return mobile;
};

// Auth guard
const PrivateRoute = ({ element }) => {
  const token = localStorage.getItem('voiceiq_token');
  return token ? element : <Navigate to="/login" replace />;
};

// App shell with sidebar + header
const AppShell = ({ children }) => (
  <div className="app-container">
    <div className="desktop-only" style={{ display: 'flex', height: '100%' }}>
      <Sidebar />
    </div>
    <div className="main-content">
      <Header />
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {children}
      </div>
      <MobileNav />
    </div>
  </div>
);

const RoleRoute = ({ roles, element, fallback = "/" }) => {
  const { profile } = useUser();
  const currentRole = profile?.role || 'Sales Rep';
  if (!roles.includes(currentRole)) {
    if (typeof fallback === 'string') return <Navigate to={fallback} replace />;
    return fallback;
  }
  return element;
};

const protected_route = (path, Component, roles, fallback) => (
  <Route
    path={path}
    element={
      <PrivateRoute element={
        roles ? (
          <RoleRoute roles={roles} element={<AppShell><Component /></AppShell>} fallback={fallback} />
        ) : (
          <AppShell><Component /></AppShell>
        )
      } />
    }
  />
);

// Pipeline route: Kanban on desktop, MobilePipeline on mobile
const PipelineRoute = () => {
  const isMobile = useIsMobile();
  return isMobile ? <MobilePipeline /> : <Kanban />;
};

const App = () => (
  <ToastProvider>
    <PersonaProvider>
      <OfflineBanner />
      <Routes>
        {/* Public */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Home — role-based */}
        <Route
          path="/"
          element={
            <PrivateRoute element={
              <AppShell>
                <RoleRoute
                  roles={['Owner / Admin']}
                  element={<Dashboard />}
                  fallback={
                    <RoleRoute
                      roles={['Team Lead']}
                      element={<Dashboard />}
                      fallback={<RepPulse />}
                    />
                  }
                />
              </AppShell>
            } />
          }
        />

        {/* Core screens */}
        {protected_route('/pulse',       RepPulse,        ['Sales Rep', 'Team Lead'])}
        {protected_route('/inbox',       GlobalInbox,     ['Sales Rep', 'Team Lead', 'Owner / Admin'])}
        {protected_route('/leads',       Leads,           ['Sales Rep', 'Team Lead', 'Owner / Admin'])}
        {protected_route('/today',       Today,           ['Sales Rep', 'Team Lead'])}
        {protected_route('/coach',       CallCoach,       ['Team Lead', 'Owner / Admin'])}
        {protected_route('/forecast',    Forecast,        ['Team Lead', 'Owner / Admin'])}
        {protected_route('/settings',    Settings,        ['Sales Rep', 'Team Lead', 'Owner / Admin'])}
        <Route path="/welcome" element={<PrivateRoute element={<WelcomeWizard />} />} />
        {protected_route('/calendar',    Calendar,        ['Sales Rep', 'Team Lead'])}
        {protected_route('/leads/:id',   LeadDetails,     ['Sales Rep', 'Team Lead', 'Owner / Admin'])}
        {protected_route('/sources',     LeadSourceHub,   ['Owner / Admin'])}
        {protected_route('/team-mgmt',   TeamManagement,  ['Owner / Admin'])}
        {protected_route('/org-settings',OrgSettings,     ['Owner / Admin'])}
        {protected_route('/team-reports',TeamReports,     ['Team Lead', 'Owner / Admin'])}
        {protected_route('/help',        HelpSupport,     ['Sales Rep', 'Team Lead', 'Owner / Admin'])}
        {protected_route('/billing',     Billing,         ['Owner / Admin'])}
        {protected_route('/settings/channels', ChannelSettings, ['Owner / Admin'])}
        {protected_route('/community',   AboutCommunity,  ['Sales Rep', 'Team Lead', 'Owner / Admin'])}

        {/* Pipeline — responsive (Kanban desktop / MobilePipeline mobile) */}
        <Route
          path="/kanban"
          element={
            <PrivateRoute element={
              <RoleRoute
                roles={['Sales Rep', 'Team Lead', 'Owner / Admin']}
                element={<AppShell><PipelineRoute /></AppShell>}
                fallback="/"
              />
            } />
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PersonaProvider>
  </ToastProvider>
);

export default App;
