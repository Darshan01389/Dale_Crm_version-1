import React, { useState } from 'react';
import SetupChecklist from '../components/SetupChecklist';
import { useUser } from '../contexts/UserContext';

const PERIODS = [
  { id: '7d', label: '7 Days' },
  { id: '30d', label: '30 Days' },
  { id: '90d', label: '3 Months' },
  { id: '180d', label: '6 Months' },
];

const RepPulse = () => {
  const { profile } = useUser();
  const [period, setPeriod] = useState('30d');
  const [showChecklist, setShowChecklist] = useState(profile?.role !== 'Sales Rep');

  // Mock stats based on period
  const statsData = {
    '7d': { outreach: 142, meetings: 12, won: '₹1.2L', quota: 40, trend: [30, 45, 25, 60, 40, 55, 42], goals: [{ label: 'Qualify 5 Leads', progress: 3, total: 5 }, { label: '2 Discovery Calls', progress: 1, total: 2 }, { label: '₹1L Revenue', progress: 0.8, total: 1 }] },
    '30d': { outreach: 584, meetings: 45, won: '₹8.4L', quota: 84, trend: [60, 80, 45, 90, 70, 100, 85], goals: [{ label: 'Qualify 20 Leads', progress: 14, total: 20 }, { label: '10 Discovery Calls', progress: 8, total: 10 }, { label: '₹10L Revenue', progress: 8.4, total: 10 }] },
    '90d': { outreach: 1840, meetings: 128, won: '₹22.5L', quota: 75, trend: [80, 70, 100, 85, 110, 95, 120], goals: [{ label: 'Qualify 60 Leads', progress: 45, total: 60 }, { label: '30 Discovery Calls', progress: 22, total: 30 }, { label: '₹30L Revenue', progress: 22.5, total: 30 }] },
    '180d': { outreach: 3200, meetings: 210, won: '₹45.0L', quota: 92, trend: [100, 120, 95, 110, 130, 115, 140], goals: [{ label: 'Qualify 120 Leads', progress: 110, total: 120 }, { label: '60 Discovery Calls', progress: 55, total: 60 }, { label: '₹60L Revenue', progress: 45, total: 60 }] },
  };

  const stats = statsData[period];

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--bg)', padding: 'var(--mobile-padding, 40px)' }} className="custom-scroll animate-in">
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40, flexWrap: 'wrap', gap: 24 }}>
          <div>
            <h1 className="text-h1" style={{ margin: 0 }}>My Pulse</h1>
            <p style={{ fontSize: 16, color: 'var(--text-muted)', marginTop: 8, fontWeight: 500 }}>Track your sales velocity and quarterly targets</p>
          </div>
          <div style={{ display: 'flex', background: 'var(--bg-subtle)', padding: 6, borderRadius: 16, border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
            {PERIODS.map(p => (
              <button 
                key={p.id}
                onClick={() => setPeriod(p.id)}
                style={{
                  padding: '10px 20px', borderRadius: 12, fontSize: 13, fontWeight: 700,
                  background: period === p.id ? 'var(--primary)' : 'transparent',
                  color: period === p.id ? 'white' : 'var(--text-muted)',
                  border: 'none', cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Setup Checklist (Screen 16) */}
        {showChecklist && (
          <div style={{ marginBottom: 40 }}>
            <SetupChecklist />
          </div>
        )}

        {/* Top KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginBottom: 40 }}>
          {[
            { label: 'Outreach', value: stats.outreach, sub: 'Calls & Messages', accent: 'var(--primary)' },
            { label: 'Meetings', value: stats.meetings, sub: 'Demos Booked', accent: 'var(--owner-accent)' },
            { label: 'Revenue Won', value: stats.won, sub: 'Actual Closed', accent: 'var(--rep-accent)' },
            { label: 'Quota Target', value: `${stats.quota}%`, sub: 'Goal Attainment', accent: 'var(--primary)' },
          ].map(k => (
            <div key={k.label} className="card" style={{ padding: 28 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: 20 }}>{k.label.toUpperCase()}</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em' }}>{k.value}</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8, fontWeight: 500 }}>{k.sub}</div>
              {k.label === 'Quota Target' && (
                <div style={{ height: 8, background: 'var(--bg-subtle)', borderRadius: 4, marginTop: 20, overflow: 'hidden' }}>
                  <div style={{ width: `${stats.quota}%`, height: '100%', background: 'var(--primary)', borderRadius: 4, boxShadow: '0 0 10px var(--primary-glow)' }} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Personal Goals Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 32, marginBottom: 40 }} className="middle-grid">
          <div className="card" style={{ padding: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              <h3 className="text-h3" style={{ margin: 0 }}>Activity Trend</h3>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--success)', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: 8 }}>+12% vs LW</div>
            </div>
            <div style={{ height: 240, display: 'flex', alignItems: 'flex-end', gap: 12 }}>
              {stats.trend.map((h, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
                  <div style={{ 
                    width: '100%', 
                    height: `${h * 1.5}px`, 
                    background: 'var(--primary)', 
                    opacity: 0.2 + (h/Math.max(...stats.trend))*0.8, 
                    borderRadius: '8px 8px 4px 4px',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: h > 80 ? '0 4px 12px var(--primary-glow)' : 'none'
                  }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-micro)', textTransform: 'uppercase' }}>W{i+1}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card glass" style={{ padding: 32, background: 'var(--text)', border: 'none', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 100%)', pointerEvents: 'none' }} />
            <h3 className="text-h3" style={{ margin: '0 0 32px', color: 'white', position: 'relative' }}>Personal Goals</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32, position: 'relative' }}>
              {stats.goals.map(g => (
                <div key={g.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 12 }}>
                    <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{g.label}</span>
                    <span style={{ fontWeight: 800, color: '#10B981' }}>{Math.round((g.progress/g.total)*100)}%</span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3 }}>
                    <div style={{ width: `${(g.progress/g.total)*100}%`, height: '100%', background: '#10B981', borderRadius: 3, boxShadow: '0 0 10px #10B981' }} />
                  </div>
                </div>
              ))}
            </div>
            <button className="btn-primary" style={{ width: '100%', marginTop: 40, height: 48, background: 'white', color: 'var(--text)', boxShadow: 'none' }}>
              Update Targets
            </button>
          </div>
        </div>

        {/* Win Probability Widget */}
        <div className="card" style={{ padding: 32, border: '1px solid rgba(16, 185, 129, 0.2)', background: 'rgba(16, 185, 129, 0.05)' }}>
          <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
            <div style={{ 
              width: 80, height: 80, borderRadius: 20, 
              background: 'white', border: '1px solid rgba(16, 185, 129, 0.2)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              fontSize: 22, fontWeight: 900, color: '#059669',
              boxShadow: 'var(--shadow-md)',
              transform: 'rotate(-3deg)'
            }}>
              82%
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ padding: 6, background: 'white', borderRadius: 8, boxShadow: 'var(--shadow-sm)' }}>
                  <svg width="16" height="16" fill="var(--success)" viewBox="0 0 24 24"><path d="M12 2L3 7v10l9 5 9-5V7L12 2z"/></svg>
                </div>
                <h4 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text)' }}>AI Forecast Intelligence</h4>
              </div>
              <p style={{ fontSize: 15, color: 'var(--text-muted)', margin: 0, fontWeight: 500, lineHeight: 1.6 }}>
                Your current momentum is <span style={{ color: 'var(--success)', fontWeight: 700 }}>12% higher</span> than your trailing 3-month average. 
                AI predicts you will exceed your Q2 quota by ₹2.4L if you maintain this pace.
              </p>
            </div>
          </div>
        </div>

      </div>
      <style>{`
        @media (max-width: 768px) {
          .middle-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
        }
      `}</style>
    </div>
  );
};

export default RepPulse;
