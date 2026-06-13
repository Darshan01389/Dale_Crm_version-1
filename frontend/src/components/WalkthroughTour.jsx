import React, { useState, useEffect } from 'react';
import { Joyride, STATUS, EVENTS, ACTIONS } from 'react-joyride';
import { useUser } from '../contexts/UserContext';
import { useNavigate, useLocation } from 'react-router-dom';

const WalkthroughTour = () => {
  const { profile } = useUser();
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState([]);
  const [stepIndex, setStepIndex] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Determine which tour to run based on role
    const currentRole = profile?.role || 'Sales Rep';
    const isSuperAdmin = profile?.isSuperAdmin;

    // Check if user has already completed the tour (optional: can store in localStorage)
    const hasCompletedTour = localStorage.getItem(`tour_completed_${currentRole}`);
    if (hasCompletedTour) return;

    // Delay start slightly to allow UI to render completely
    const timer = setTimeout(() => {
      if (isSuperAdmin) {
        setSteps(superAdminSteps);
      } else if (currentRole === 'Manager' || currentRole === 'Team Lead' || currentRole === 'Owner / Admin' || currentRole === 'Sales Admin') {
        setSteps(managerSteps);
      } else {
        setSteps(salesRepSteps);
      }
      setRun(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [profile]);

  useEffect(() => {
    if (run && steps[stepIndex]) {
      const targetRoute = steps[stepIndex].route;
      if (targetRoute && location.pathname !== targetRoute) {
        navigate(targetRoute);
      }
    }
  }, [stepIndex, run, steps, location.pathname, navigate]);

  const handleJoyrideCallback = (data) => {
    const { action, index, status, type } = data;
    const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      const currentRole = profile?.role || 'Sales Rep';
      localStorage.setItem(`tour_completed_${currentRole}`, 'true');
      setStepIndex(0);
    } else if (type === EVENTS.STEP_AFTER) {
      const nextStepIndex = index + (action === ACTIONS.PREV ? -1 : 1);
      const nextStep = steps[nextStepIndex];

      if (nextStep) {
        if (nextStep.route && location.pathname !== nextStep.route) {
          navigate(nextStep.route);
        }

        if (nextStep.target !== 'body') {
          let attempts = 0;
          const checkTarget = setInterval(() => {
            attempts++;
            if (document.querySelector(nextStep.target)) {
              clearInterval(checkTarget);
              setStepIndex(nextStepIndex);
            } else if (attempts > 50) { // 5 seconds timeout
              clearInterval(checkTarget);
              setRun(false); // target not found after 5s, abort tour
            }
          }, 100);
        } else {
          setStepIndex(nextStepIndex);
        }
      } else {
        setStepIndex(nextStepIndex);
      }
    } else if (type === EVENTS.TARGET_NOT_FOUND) {
      // Abort tour gracefully instead of freezing
      setRun(false);
    }
  };

  const commonStyles = {
    options: {
      arrowColor: '#fff',
      backgroundColor: '#fff',
      overlayColor: 'rgba(0, 0, 0, 0.5)',
      primaryColor: 'var(--primary)',
      textColor: '#333',
      zIndex: 10000,
    },
    tooltipContainer: {
      textAlign: 'left',
    },
    buttonNext: {
      backgroundColor: 'var(--primary)',
      borderRadius: '8px',
      padding: '10px 16px',
      fontWeight: 'bold',
      fontFamily: 'inherit',
    },
    buttonBack: {
      color: 'var(--text-muted)',
      marginRight: '10px',
      fontFamily: 'inherit',
    },
    buttonSkip: {
      color: 'var(--text-muted)',
      fontFamily: 'inherit',
    }
  };

  const salesRepSteps = [
    {
      target: 'body',
      route: '/',
      content: 'Welcome to DalelQ! Let\'s take a quick tour to show you how our AI will revolutionize your sales workflow.',
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '#tour-kpi-row',
      route: '/pulse',
      content: 'Start your day here. These metrics update in real-time based on your closed deals and AI lead quality scores.',
      placement: 'bottom',
    },
    {
      target: 'body', // fallback since .tour-lead-card is missing, just show on kanban page
      route: '/kanban',
      content: 'This is your active pipeline. You can drag and drop cards, but here’s the secret: our AI will automatically move these cards for you based on how your sales calls go.',
      placement: 'center',
    },
    {
      target: 'body', // fallback
      route: '/leads',
      content: 'The Magic Button. Click here to instantly call your prospect right from the browser. No external phones needed. We\'ll record and transcribe it automatically.',
      placement: 'center',
    },
    {
      target: 'body', // fallback
      route: '/inbox',
      content: 'Hang up, and watch the magic. Within seconds, our AI will extract the prospect\'s sentiment, objections, and automatically update the pipeline stage!',
      placement: 'center',
    }
  ];

  const managerSteps = [
    {
      target: 'body',
      route: '/',
      content: 'Welcome, Manager! DalelQ gives you complete visibility into your team\'s performance and AI intelligence.',
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '#tour-team-pulse',
      route: '/',
      content: 'The Team Pulse dashboard aggregates revenue, win velocity, and global sentiment across all your reps.',
      placement: 'bottom',
    },
    {
      target: '#tour-automation-rules',
      route: '/sources',
      content: 'Set up Automation Rules here. You can route incoming leads to specific reps based on Lead Source, Intent, or Value.',
      placement: 'right',
    },
    {
      target: '#tour-lead-sources', // fallback to sidebar or sources route
      route: '/sources',
      content: 'Generate custom Webhooks for Facebook Ads, Zapier, or your website to funnel leads directly into the AI pipeline.',
      placement: 'left',
    }
  ];

  const superAdminSteps = [
    {
      target: 'body',
      route: '/super-admin',
      content: 'Welcome, Super Admin! From here, you have global control over the DalelQ ecosystem.',
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '#tour-tenant-management',
      route: '/super-admin/companies',
      content: 'Manage all tenant organizations, active companies, and system-wide health from this overview.',
      placement: 'bottom',
    },
    {
      target: '#tour-global-settings',
      route: '/super-admin/community',
      content: 'Configure global AI providers (Ollama / Local Whisper) and system-wide configurations.',
      placement: 'right',
    }
  ];

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      hideCloseButton
      run={run}
      stepIndex={stepIndex}
      scrollToFirstStep
      showProgress
      showSkipButton
      steps={steps}
      styles={commonStyles}
    />
  );
};

export default WalkthroughTour;
