import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { useUser } from './contexts/UserContext';
import MobileNav from './components/MobileNav';
import OfflineBanner from './components/OfflineBanner';
import { ToastProvider } from './contexts/ToastContext';
import { PersonaProvider } from './contexts/PersonaContext';

// Load Auth pages instantly
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';

// Lazy load everything else
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Leads = React.lazy(() => import('./pages/Leads'));
const GlobalInbox = React.lazy(() => import('./pages/GlobalInbox'));
const Kanban = React.lazy(() => import('./pages/Kanban'));
const MobilePipeline = React.lazy(() => import('./pages/MobilePipeline'));
const CallCoach = React.lazy(() => import('./pages/CallCoach'));
const Forecast = React.lazy(() => import('./pages/Forecast'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Today = React.lazy(() => import('./pages/Today'));
const WelcomeWizard = React.lazy(() => import('./pages/WelcomeWizard'));
const Calendar = React.lazy(() => import('./pages/Calendar'));
const LeadSourcesLayout = React.lazy(() => import('./pages/LeadSources/LeadSourcesLayout'));
const ConnectedSources = React.lazy(() => import('./pages/LeadSources/ConnectedSources'));
const AddSourceWizard = React.lazy(() => import('./pages/LeadSources/AddSourceWizard'));
const CampaignAnalytics = React.lazy(() => import('./pages/LeadSources/CampaignAnalytics'));
const AutomationRules = React.lazy(() => import('./pages/LeadSources/AutomationRules'));
const WebhookLogs = React.lazy(() => import('./pages/LeadSources/WebhookLogs'));
const LeadDetails = React.lazy(() => import('./pages/LeadDetails'));
const RepPulse = React.lazy(() => import('./pages/RepPulse'));
const TeamManagement = React.lazy(() => import('./pages/TeamManagement'));
const OrgSettings = React.lazy(() => import('./pages/OrgSettings'));
const TeamReports = React.lazy(() => import('./pages/TeamReports'));
const HelpSupport = React.lazy(() => import('./pages/HelpSupport'));
const Billing = React.lazy(() => import('./pages/Billing'));
const ChannelSettings = React.lazy(() => import('./pages/ChannelSettings'));
const AboutCommunity = React.lazy(() => import('./pages/AboutCommunity'));
const CommunityForums = React.lazy(() => import('./pages/CommunityForums'));
const WhatsAppSimulator = React.lazy(() => import('./pages/WhatsAppSimulator'));
const SuperAdminOverview = React.lazy(() => import('./pages/SuperAdminOverview'));
const SuperAdminCompanies = React.lazy(() => import('./pages/SuperAdminCompanies'));
const SuperAdminForecasting = React.lazy(() => import('./pages/SuperAdminForecasting'));
const SuperAdminLeadSources = React.lazy(() => import('./pages/SuperAdminLeadSources'));
const SuperAdminCommunity = React.lazy(() => import('./pages/SuperAdminCommunity'));

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
  const token = sessionStorage.getItem('voiceiq_token') || localStorage.getItem('voiceiq_token');
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
  const isSuperAdmin = profile?.isSuperAdmin;
  // Super Admins bypass role restrictions
  if (isSuperAdmin) return element;
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

const App = () => {

  return (
  <ToastProvider>
    <PersonaProvider>
      <OfflineBanner />
      <Suspense fallback={<div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>Loading application...</div>}>
      <Routes>
        {/* Public */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* Home — role-based */}
        <Route
          path="/"
          element={
            <PrivateRoute element={
              <AppShell>
                <RoleRoute
                  roles={['Owner / Admin', 'Sales Admin']}
                  element={<Kanban />}
                  fallback={
                    <RoleRoute
                      roles={['Team Lead', 'Manager']}
                      element={<Dashboard />}
                      fallback={<RepPulse />}
                    />
                  }
                />
              </AppShell>
            } />
          }
        />

        {/* Super Admin exclusive routes */}
        <Route path="/super-admin" element={<PrivateRoute element={<AppShell><SuperAdminOverview /></AppShell>} />} />
        <Route path="/super-admin/companies" element={<PrivateRoute element={<AppShell><SuperAdminCompanies /></AppShell>} />} />
        <Route path="/super-admin/forecasting" element={<PrivateRoute element={<AppShell><SuperAdminForecasting /></AppShell>} />} />
        <Route path="/super-admin/lead-sources" element={<PrivateRoute element={<AppShell><SuperAdminLeadSources /></AppShell>} />} />
        <Route path="/super-admin/community" element={<PrivateRoute element={<AppShell><SuperAdminCommunity /></AppShell>} />} />

        {/* Core screens */}
        {protected_route('/pulse',       RepPulse,        ['Sales Rep', 'Sales', 'Team Lead', 'Manager'])}
        {protected_route('/inbox',       GlobalInbox,     ['Sales Rep', 'Sales', 'Team Lead', 'Manager', 'Owner / Admin', 'Sales Admin'])}
        {protected_route('/leads',       Leads,           ['Sales Rep', 'Sales', 'Team Lead', 'Manager'])}
        {protected_route('/today',       Today,           ['Sales Rep', 'Sales', 'Team Lead', 'Manager'])}
        {protected_route('/coach',       CallCoach,       ['Team Lead', 'Manager', 'Owner / Admin', 'Sales Admin'])}
        {protected_route('/forecast',    Forecast,        ['Owner / Admin', 'Sales Admin'])}
        {protected_route('/settings',    Settings,        ['Sales Rep', 'Sales', 'Team Lead', 'Manager', 'Owner / Admin', 'Sales Admin'])}
        <Route path="/welcome" element={<PrivateRoute element={<WelcomeWizard />} />} />
        {protected_route('/calendar',    Calendar,        ['Team Lead', 'Manager', 'Owner / Admin', 'Sales Admin'])}
        {protected_route('/leads/:id',   LeadDetails,     ['Sales Rep', 'Sales', 'Team Lead', 'Manager'])}
        
        {/* Lead Sources Nested Routes */}
        <Route path="/sources" element={
          <PrivateRoute element={
            <RoleRoute roles={['Owner / Admin', 'Sales Admin']} element={<AppShell><LeadSourcesLayout /></AppShell>} fallback="/" />
          } />
        }>
          <Route index element={<Navigate to="connected" replace />} />
          <Route path="connected" element={<ConnectedSources />} />
          <Route path="add" element={<AddSourceWizard />} />
          <Route path="analytics" element={<CampaignAnalytics />} />
          <Route path="automation" element={<AutomationRules />} />
          <Route path="webhooks" element={<WebhookLogs />} />
        </Route>
        {protected_route('/team-mgmt',   TeamManagement,  ['Owner / Admin', 'Sales Admin', 'Team Lead', 'Manager'])}
        {protected_route('/org-settings',OrgSettings,     ['Owner / Admin', 'Sales Admin'])}
        {protected_route('/team-reports',TeamReports,     ['Team Lead', 'Manager', 'Owner / Admin', 'Sales Admin'])}
        {protected_route('/help',        HelpSupport,     ['Sales Rep', 'Sales', 'Team Lead', 'Manager', 'Owner / Admin', 'Sales Admin'])}
        {protected_route('/billing',     Billing,         ['Owner / Admin', 'Sales Admin'])}
        {protected_route('/settings/channels', ChannelSettings, ['Owner / Admin', 'Sales Admin'])}
        {protected_route('/community',   AboutCommunity,  ['Sales Rep', 'Sales', 'Team Lead', 'Manager', 'Owner / Admin', 'Sales Admin'])}
        {protected_route('/community-forums', CommunityForums, ['Sales Rep', 'Sales', 'Team Lead', 'Manager', 'Owner / Admin', 'Sales Admin'])}

        {/* Pipeline — responsive (Kanban desktop / MobilePipeline mobile) */}
        <Route
          path="/kanban"
          element={
            <PrivateRoute element={
              <RoleRoute
                roles={['Team Lead', 'Manager', 'Owner / Admin', 'Sales Admin']}
                element={<AppShell><PipelineRoute /></AppShell>}
                fallback="/"
              />
            } />
          }
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </PersonaProvider>
  </ToastProvider>
  );
};

export default App;
