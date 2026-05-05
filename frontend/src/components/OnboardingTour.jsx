import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, X, Star, Sparkles } from 'lucide-react';

const OnboardingTour = () => {
  const [step, setStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const videoRef = useRef(null);
  const [personSide, setPersonSide] = useState('right');

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('daleiq_tour_seen');
    if (!hasSeenTour) {
      setTimeout(() => setIsVisible(true), 1500);
    }
  }, []);

  useEffect(() => {
    if (isVisible && videoRef.current) {
      videoRef.current.play();
    }
    // Change character position based on target to simulate "pointing"
    if (steps[step].target?.includes('sidebar')) {
      setPersonSide('right');
    } else {
      setPersonSide('left');
    }
  }, [step, isVisible]);

  const steps = [
    {
      title: "Welcome to DaleIQ",
      content: "Hi! I'm your DaleIQ Assistant. Let's take a quick tour to show you how to maximize your sales intelligence.",
      icon: <img src="/salesperson_icon.jpg" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />,
      target: null
    },
    {
      title: "Global Inbox",
      content: "Look over here! All your conversations from WhatsApp, SMS, and Email are in one place. I'll help you score every lead for intent.",
      target: "sidebar-inbox"
    },
    {
      title: "Team Pulse",
      content: "This is where you see the real-time visibility into your team's performance and my revenue forecasts.",
      target: "sidebar-pulse"
    },
    {
      title: "Need My Help?",
      content: "Just click my icon anytime in the bottom right if you need me to analyze a deal or automate a follow-up!",
      target: "ai-assistant-trigger"
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem('daleiq_tour_seen', 'true');
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(8px)'
    }}>
      <div style={{ 
        display: 'flex', 
        flexDirection: personSide === 'right' ? 'row' : 'row-reverse', 
        alignItems: 'center', 
        gap: 40,
        maxWidth: '90%'
      }}>
        {/* Animated Salesperson Character */}
        <motion.div
          key={`person-${step}`}
          initial={{ opacity: 0, x: personSide === 'right' ? 50 : -50 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ width: 300, height: 400, position: 'relative' }}
        >
          <video 
            ref={videoRef}
            src="/salesperson.mp4" 
            style={{ 
              width: '100%', height: '100%', objectFit: 'contain',
              mixBlendMode: 'multiply', // Makes a white background transparent
              filter: 'contrast(1.1)' 
            }}
            muted
            loop
            playsInline
          />
          {/* Action indicator (Finger/Pointer simulation) */}
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 1 }}
            style={{
              position: 'absolute',
              top: '40%',
              [personSide === 'right' ? 'left' : 'right']: -20,
              width: 40,
              height: 40,
              background: 'var(--primary)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px var(--primary-glow)',
              color: 'white',
              fontSize: 24,
              fontWeight: 900
            }}
          >
            ☝️
          </motion.div>
        </motion.div>

        {/* Tour Modal */}
        <motion.div
          key={`modal-${step}`}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            width: 420,
            background: 'white',
            borderRadius: 32,
            padding: 40,
            boxShadow: '0 20px 80px rgba(0,0,0,0.4)',
            textAlign: 'left',
            position: 'relative',
            border: '2px solid var(--primary)'
          }}
        >
          <button 
            onClick={handleComplete}
            style={{ position: 'absolute', top: 24, right: 24, background: 'none', border: 'none', color: 'var(--text-micro)', cursor: 'pointer' }}
          >
            <X size={24} />
          </button>

          <div style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
            overflow: 'hidden'
          }}>
            {steps[step].icon || <Sparkles size={32} />}
          </div>

          <h2 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text)', marginBottom: 16, letterSpacing: '-0.5px' }}>
            {steps[step].title}
          </h2>
          
          <p style={{ fontSize: 17, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 40, fontWeight: 500 }}>
            {steps[step].content}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {steps.map((_, i) => (
                <div key={i} style={{
                  width: i === step ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  background: i === step ? 'var(--primary)' : 'var(--border)',
                  transition: 'all 0.3s ease'
                }} />
              ))}
            </div>
            
            <button
              onClick={handleNext}
              className="btn-primary"
              style={{
                height: 52,
                padding: '0 32px',
                borderRadius: 16,
                fontSize: 16,
                fontWeight: 800,
                boxShadow: '0 8px 16px var(--primary-glow)'
              }}
            >
              {step === steps.length - 1 ? 'Start Selling' : 'Next Step'}
              <ChevronRight size={20} style={{ marginLeft: 8 }} />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OnboardingTour;
