import React, { useState, useEffect } from 'react';
import Joyride, { STATUS } from 'react-joyride';
import { useUser } from '../contexts/UserContext';

const WalkthroughTour = () => {
  const { profile } = useUser();
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState([]);

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

  const handleJoyrideCallback = (data) => {
    const { status } = data;
    const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      const currentRole = profile?.role || 'Sales Rep';
      localStorage.setItem(`tour_completed_${currentRole}`, 'true');
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
      content: 'Welcome to DalelQ! Let\'s take a quick tour to show you how our AI will revolutionize your sales workflow.',
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '#tour-kpi-row',
      content: 'Start your day here. These metrics update in real-time based on your closed deals and AI lead quality scores.',
      placement: 'bottom',
    },
    {
      target: '.tour-lead-card',
      content: 'This is your active pipeline. You can drag and drop cards, but here’s the secret: our AI will automatically move these cards for you based on how your sales calls go.',
      placement: 'right',
    },
    {
      target: '#tour-call-button',
      content: 'The Magic Button. Click here to instantly call your prospect right from the browser. No external phones needed. We\'ll record and transcribe it automatically.',
      placement: 'left',
    },
    {
      target: '.tour-ai-insights',
      content: 'Hang up, and watch the magic. Within seconds, our AI will extract the prospect\'s sentiment, objections, and automatically update the pipeline stage!',
      placement: 'left',
    }
  ];

  const managerSteps = [
    {
      target: 'body',
      content: 'Welcome, Manager! DalelQ gives you complete visibility into your team\'s performance and AI intelligence.',
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '#tour-team-pulse',
      content: 'The Team Pulse dashboard aggregates revenue, win velocity, and global sentiment across all your reps.',
      placement: 'bottom',
    },
    {
      target: '#tour-automation-rules',
      content: 'Set up Automation Rules here. You can route incoming leads to specific reps based on Lead Source, Intent, or Value.',
      placement: 'right',
    },
    {
      target: '#tour-lead-sources',
      content: 'Generate custom Webhooks for Facebook Ads, Zapier, or your website to funnel leads directly into the AI pipeline.',
      placement: 'left',
    }
  ];

  const superAdminSteps = [
    {
      target: 'body',
      content: 'Welcome, Super Admin! From here, you have global control over the DalelQ ecosystem.',
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '#tour-tenant-management',
      content: 'Manage all tenant organizations, active companies, and system-wide health from this overview.',
      placement: 'bottom',
    },
    {
      target: '#tour-global-settings',
      content: 'Configure global AI providers (Ollama / Local Whisper) and system-wide configurations.',
      placement: 'right',
    }
  ];

  // We only run if there are steps. The exact targets might not exist on the current page immediately,
  // so react-joyride handles finding them or skipping if target isn't found.
  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      hideCloseButton
      run={run}
      scrollToFirstStep
      showProgress
      showSkipButton
      steps={steps}
      styles={commonStyles}
    />
  );
};

export default WalkthroughTour;
