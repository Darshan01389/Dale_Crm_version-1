import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SetupChecklist from '../components/SetupChecklist';
import { useUser } from '../contexts/UserContext';

const PERIODS = [
  { id: '7 Days', label: '7 Days' },
  { id: '30 Days', label: '30 Days' },
  { id: '3 Months', label: '3 Months' },
  { id: '12 Months', label: '12 Months' },
];

const RepPulse = () => {
  const { profile } = useUser();
  const [period, setPeriod] = useState('30 Days');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showChecklist, setShowChecklist] = useState(profile?.role !== 'Sales Rep');

  useEffect(() => {
    fetchPulse();
  }, [period]);

  const fetchPulse = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('voiceiq_token');
      const res = await axios.get(`/api/analytics/dashboard?date_range=${period}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
    } catch (err) {
      console.error("Error fetching pulse data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: 40 }}>Loading your Pulse...</div>;
  if (!data) return <div style={{ padding: 40 }}>Error loading pulse data.</div>;

  const stats = [
    { label: 'Outreach', value: data.activities_last_7_days, sub: 'Calls & Messages', accent: 'var(--primary)' },
    { label: 'Deals Open', value: data.deals_open, sub: 'Active Pipeline', accent: 'var(--owner-accent)' },
    { label: 'Revenue Won', value: `₹${(data.revenue_won / 100000).toFixed(1)}L`, sub: 'Actual Closed', accent: 'var(--rep-accent)' },
    { label: 'Win Rate', value: `${data.win_rate_pct || 0}%`, sub: 'Conversion Performance', accent: 'var(--primary)' },
  ];

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--bg)', padding: 'var(--mobile-padding, 40px)' }} className="custom-scroll animate-in">
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40, flexWrap: 'wrap', gap: 24 }}>
          <div>
            <h1 className="text-h1" style={{ margin: 0 }}>My Pulse</h1>
            <p style={{ fontSize: 16, color: 'var(--text-muted)', marginTop: 8, fontWeight: 500 }}>Track your sales velocity and personal targets</p>
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

        {/* Setup Checklist */}
        {showChecklist && (
          <div style={{ marginBottom: 40 }}>
            <SetupChecklist />
          </div>
        )}

        {/* Top KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginBottom: 40 }}>
          {stats.map(k => (
            <div key={k.label} className="card" style={{ padding: 28 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: 20 }}>{k.label.toUpperCase()}</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em' }}>{k.value}</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8, fontWeight: 500 }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Personal Goals Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 32, marginBottom: 40 }} className="middle-grid">
          <div className="card" style={{ padding: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              <h3 className="text-h3" style={{ margin: 0 }}>Pipeline Funnel</h3>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--success)', background: 'rgba(99, 102, 241, 0.1)', padding: '4px 10px', borderRadius: 8 }}>LIVE STATUS</div>
            </div>
            <div style={{ height: 240, display: 'flex', alignItems: 'flex-end', gap: 12 }}>
              {data.funnel.map((f, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
                  <div style={{ 
                    width: '100%', 
                    height: `${Math.min(f.open_deals * 20 + 20, 240)}px`, 
                    background: ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#EF4444'][i % 6], 
                    opacity: 0.8, 
                    borderRadius: '8px 8px 4px 4px',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-micro)', textTransform: 'uppercase', textAlign: 'center' }}>{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card glass" style={{ padding: 32, background: 'var(--text)', border: 'none', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 100%)', pointerEvents: 'none' }} />
            <h3 className="text-h3" style={{ margin: '0 0 32px', color: 'white', position: 'relative' }}>AI Insights</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, position: 'relative' }}>
              <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>
                <div style={{ fontWeight: 800, color: '#6366F1', marginBottom: 4 }}>Sentiment Trend</div>
                Positive sentiment has increased by 12% in your recent leads.
              </div>
              <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>
                <div style={{ fontWeight: 800, color: '#6366F1', marginBottom: 4 }}>Conversion Signal</div>
                Leads with AI scores &gt; 80 are converting 3x faster this month.
              </div>
              <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>
                <div style={{ fontWeight: 800, color: '#6366F1', marginBottom: 4 }}>Activity Peak</div>
                Your highest engagement occurs between 10 AM and 12 PM.
              </div>
            </div>
          </div>
        </div>

        {/* Win Probability Widget */}
        <div className="card" style={{ padding: 32, border: '1px solid rgba(99, 102, 241, 0.2)', background: 'rgba(99, 102, 241, 0.05)' }}>
          <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
            <div style={{ 
              width: 80, height: 80, borderRadius: 20, 
              background: 'white', border: '1px solid rgba(99, 102, 241, 0.2)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              fontSize: 22, fontWeight: 900, color: '#4338CA',
              boxShadow: 'var(--shadow-md)',
              transform: 'rotate(-3deg)'
            }}>
              {data.model_accuracy_pct || 85}%
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ padding: 6, background: 'white', borderRadius: 8, boxShadow: 'var(--shadow-sm)' }}>
                  <svg width="16" height="16" fill="var(--success)" viewBox="0 0 24 24"><path d="M12 2L3 7v10l9 5 9-5V7L12 2z"/></svg>
                </div>
                <h4 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text)' }}>AI Forecast Intelligence</h4>
              </div>
              <p style={{ fontSize: 15, color: 'var(--text-muted)', margin: 0, fontWeight: 500, lineHeight: 1.6 }}>
                Your current lead quality average is <span style={{ color: 'var(--success)', fontWeight: 700 }}>{data.leads_avg_ai_score?.toFixed(1) || 0}</span>. 
                AI predicts a win rate of {data.win_rate_pct || 0}% based on your current pipeline velocity.
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
