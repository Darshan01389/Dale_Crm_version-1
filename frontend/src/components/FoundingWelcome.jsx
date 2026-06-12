import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

const FoundingWelcome = ({ onContinue }) => {
  const { profile } = useUser();
  const navigate = useNavigate();
  const firstName = profile?.name?.split(' ')[0] || 'there';

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const handleClose = () => {
    localStorage.setItem('founding_seen', 'true');
    onContinue?.();
  };

  const handleStart = () => {
    localStorage.setItem('founding_seen', 'true');
    navigate('/welcome');
  };

  const PERKS = [
    {
      name: 'Founding pricing locked in for life',
      desc: 'Whatever rate you signed up at stays — no price increases, ever.',
    },
    {
      name: 'Direct line to the founder',
      desc: 'Got an issue? Email Ram directly: ram@daleiq.com',
    },
    {
      name: 'Roadmap voice',
      desc: 'Vote on what we build next. Your suggestions get priority.',
    },
    {
      name: 'Quarterly product sync',
      desc: '30-min call with the team every quarter — your input shapes v2.',
    },
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 4000,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        background: 'var(--bg-surface)', borderRadius: 20,
        border: '3px solid #4F46E5',
        maxWidth: 480, width: '100%', padding: 40,
        boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
        display: 'flex', flexDirection: 'column', gap: 0,
      }}>
        {/* Founding pill */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#4F46E5', color: 'white',
            fontSize: 12, fontWeight: 800, letterSpacing: '0.08em',
            padding: '6px 18px', borderRadius: 20,
          }}>
            ★ FOUNDING CUSTOMER
          </span>
        </div>

        {/* Heading */}
        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px', textAlign: 'center' }}>
          Welcome aboard, {firstName}.
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 24px', textAlign: 'center' }}>
          You're one of the first 50 teams using DaleIQ.
        </p>

        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: '0 0 16px' }}>
          As a founding customer, you get:
        </p>

        {/* Perks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
          {PERKS.map((perk, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 16, color: '#4F46E5', flexShrink: 0, marginTop: 1 }}>★</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 2 }}>{perk.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{perk.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          className="btn-primary"
          onClick={handleStart}
          style={{ width: '100%', padding: '14px 0', borderRadius: 12, fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
          Let's get started →
        </button>
        <button
          onClick={handleClose}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', textDecoration: 'underline', minHeight: 'auto' }}>
          or close to explore
        </button>
      </div>
    </div>
  );
};

export default FoundingWelcome;
