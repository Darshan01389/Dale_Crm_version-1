import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import SetupChecklist from '../components/SetupChecklist';
import FoundingWelcome from '../components/FoundingWelcome';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../contexts/ToastContext';


const Dashboard = () => {
  const navigate = useNavigate();
  const { profile } = useUser();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showChecklist] = useState(profile?.role !== 'Sales Rep');
  const [showFounding, setShowFounding] = useState(!localStorage.getItem('founding_seen'));

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('voiceiq_token');
      const res = await axios.get('/api/analytics/dashboard?date_range=30 Days', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseFounding = () => {
    localStorage.setItem('founding_seen', 'true');
    setShowFounding(false);
  };

  if (loading) return <div style={{ padding: 40 }}>Loading Team Pulse...</div>;
  if (!data) return <div style={{ padding: 40 }}>Error loading dashboard.</div>;

  const kpis = [
    { label: 'Revenue Won', value: `₹${(data.revenue_won / 100000).toFixed(1)}L`, sub: 'Current Period', trend: '+12%', up: true, progress: data.current_sales_progress.pipeline_progress_pct, icon: '💰', color: '#6366F1' },
    { label: 'AI Lead Quality', value: data.leads_avg_ai_score?.toFixed(1) || 0, sub: 'Average Score', trend: '', up: true, icon: '✨', color: '#8B5CF6' },
    { label: 'Win Rate', value: `${data.win_rate_pct || 0}%`, sub: `${data.current_sales_progress.deals_won} deals closed`, trend: '+3pts', up: true, icon: '🏆', color: '#10B981' },
    { label: 'Pipeline Value', value: `₹${(data.weighted_pipeline_value / 100000).toFixed(1)}L`, sub: `${data.deals_open} active deals`, trend: '-2%', up: false, icon: '📊', color: '#F59E0B' },
  ];

  return (
    <div style={{
      height: '100%',
      overflowY: 'auto',
      background: 'var(--bg)',
      padding: 'var(--mobile-padding, 40px)',
    }} className="custom-scroll app-dashboard animate-in">
      <style>{`
        @media (max-width: 768px) {
          .app-dashboard { padding: 20px !important; }
          .kpi-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
          .kpi-grid-secondary { grid-template-columns: 1fr 1fr !important; }
          .middle-grid { grid-template-columns: 1fr !important; }
          .header-row { flex-direction: column; align-items: flex-start !important; gap: 20px; }
        }
      `}</style>

      {showFounding && <FoundingWelcome onContinue={handleCloseFounding} />}

      {/* Page Header */}
      <div className="header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <h1 className="text-h1" style={{ margin: 0 }}>Team Pulse</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(239, 68, 68, 0.1)', padding: '6px 14px', borderRadius: 24, border: '1px solid rgba(239, 68, 68, 0.1)' }}>
              <div className="pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', boxShadow: '0 0 8px #EF4444' }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: '#EF4444', letterSpacing: '0.05em' }}>LIVE ANALYTICS</span>
            </div>
          </div>
          <p style={{ color: 'var(--text-muted)', marginTop: 8, fontSize: 15, fontWeight: 500 }}>Real-time performance across your sales organization</p>
        </div>
      </div>

      {/* Setup Checklist */}
      {showChecklist && (
        <div style={{ marginBottom: 40 }}>
          <SetupChecklist />
        </div>
      )}



      {/* KPI Cards */}
      <div id="tour-team-pulse" className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 40 }}>
        {kpis.map((kpi, i) => (
          <div key={i} className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -10, right: -10, fontSize: 64, opacity: 0.05, transform: 'rotate(-15deg)' }}>{kpi.icon}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{kpi.label.toUpperCase()}</span>
              {kpi.trend && (
                <span style={{ fontSize: 12, fontWeight: 700, color: kpi.up ? 'var(--success)' : 'var(--danger)', background: kpi.up ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', padding: '2px 8px', borderRadius: 6 }}>
                  {kpi.up ? '↑' : '↓'} {kpi.trend}
                </span>
              )}
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: kpi.color, letterSpacing: '-0.02em', position: 'relative', zIndex: 1 }}>{kpi.value}</div>
            <div style={{ marginTop: 'auto', position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 10 }}>{kpi.sub}</div>
              {kpi.progress !== undefined && (
                <div style={{ height: 8, background: 'var(--bg-subtle)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${Math.min(kpi.progress, 100)}%`, 
                    height: '100%', 
                    background: kpi.color,
                    borderRadius: 4, 
                    boxShadow: `0 0 8px ${kpi.color}33`
                  }} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="middle-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 32, marginBottom: 40 }}>
        
        {/* Pipeline Distribution */}
        <div className="card" style={{ padding: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <h3 className="text-h3" style={{ margin: 0 }}>Pipeline Funnel</h3>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>OPEN DEALS BY STAGE</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {data.funnel.map((st, idx) => {
              const COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#EF4444'];
              return (
                <div key={st.stage_key} style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div style={{ width: 120, fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                    {st.label}
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1, height: 20, background: 'var(--bg-subtle)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ 
                        width: `${Math.min((st.open_deals / (data.deals_open || 1)) * 100, 100)}%`, height: '100%', 
                        background: COLORS[idx % COLORS.length], opacity: 0.8
                      }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', width: 60, textAlign: 'right' }}>{st.open_deals}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sentiment Analysis */}
        <div className="card" style={{ padding: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <h3 className="text-h3" style={{ margin: 0 }}>Customer Sentiment</h3>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>AI ANALYSIS</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {[
              { label: 'Positive', value: data.sentiment_breakdown.positive, color: '#10B981' },
              { label: 'Neutral', value: data.sentiment_breakdown.neutral, color: '#6B7280' },
              { label: 'Negative', value: data.sentiment_breakdown.negative, color: '#EF4444' },
            ].map((src) => {
              const total = data.sentiment_breakdown.positive + data.sentiment_breakdown.neutral + data.sentiment_breakdown.negative || 1;
              const pct = (src.value / total) * 100;
              return (
                <div key={src.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{src.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>{src.value}</span>
                  </div>
                  <div style={{ height: 8, background: 'var(--bg-subtle)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: src.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* AI Model Metrics */}
      <h3 className="text-h3" style={{ marginBottom: 24 }}>AI Model Performance</h3>
      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 40 }}>
        <div className="card" style={{ padding: 20, borderLeft: '4px solid var(--primary)' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: 8 }}>MODEL ACCURACY</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>{data.model_accuracy_pct?.toFixed(1) || 0}%</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Lead Scoring Engine</div>
        </div>
        <div className="card" style={{ padding: 20, borderLeft: '4px solid var(--success)' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: 8 }}>PREDICTION CONFIDENCE</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>High</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Conversion Forecasting</div>
        </div>
        <div className="card" style={{ padding: 20, borderLeft: '4px solid var(--warning)' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: 8 }}>AVG LEAD SCORE</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>{data.leads_avg_ai_score?.toFixed(1) || 0}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Global Average</div>
        </div>
        <div className="card" style={{ padding: 20, borderLeft: '4px solid var(--primary)' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: 8 }}>ESTIMATED COST</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>₹{(data.estimated_cost / 1000).toFixed(1)}k</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Resource Utilization</div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
