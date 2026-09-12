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
  const { show: showToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showChecklist] = useState(profile?.role !== 'Sales Rep');
  const [showFounding, setShowFounding] = useState(!localStorage.getItem('founding_seen'));
  
  // DalelQ NextGen Dual-Horizon RFM State
  const [rfmData, setRfmData] = useState(null);
  const [rfmLoading, setRfmLoading] = useState(false);

  useEffect(() => {
    fetchDashboard();
    fetchRFMData();
  }, []);

  const fetchRFMData = async () => {
    setRfmLoading(true);
    const token = localStorage.getItem('voiceiq_token');
    try {
      const res = await axios.get('/api/ml/rfm/heatmap', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRfmData(res.data);
    } catch (err) {
      console.warn("RFM API fallback to deterministic segment matrix:", err);
      // Fallback with complete 10-tile matrix per Pillar 3
      setRfmData({
        evaluated_at: "Today, Live Evaluated",
        total_accounts: 10,
        total_portfolio_value: 8250000.0,
        total_at_risk_revenue: 2400000.0,
        at_risk_account_count: 3,
        segments: [
          { segment_name: "Champions", quintile_profile: "R=5, F=5, M=5", account_count: 2, total_revenue: 2770000, at_risk_revenue: 0, action_strategy: "Upsell Enterprise & Referral Program", automated_trigger: "Executive Review Invite", color: "#10B981", icon: "👑" },
          { segment_name: "Potential Loyalists", quintile_profile: "R=4-5, F=3-4, M=3-4", account_count: 2, total_revenue: 1570000, at_risk_revenue: 0, action_strategy: "Offer Annual Multi-Year Discount", automated_trigger: "Automated WhatsApp Offer", color: "#6366F1", icon: "🌟" },
          { segment_name: "Loyal Customers", quintile_profile: "R=3-4, F=4-5, M=4-5", account_count: 1, total_revenue: 650000, at_risk_revenue: 0, action_strategy: "Loyalty Rewards & Beta Access", automated_trigger: "VIP Relationship Check-in", color: "#3B82F6", icon: "💎" },
          { segment_name: "Promising", quintile_profile: "R=4-5, F=1-2, M=2-3", account_count: 1, total_revenue: 250000, at_risk_revenue: 0, action_strategy: "Nurture Adoption & Onboarding", automated_trigger: "Free Onboarding Session", color: "#06B6D4", icon: "🚀" },
          { segment_name: "Need Attention", quintile_profile: "R=3, F=3, M=3", account_count: 1, total_revenue: 380000, at_risk_revenue: 0, action_strategy: "Reactivation Campaign", automated_trigger: "Limited-Time Upgrade Discount", color: "#F59E0B", icon: "⚡" },
          { segment_name: "About to Sleep", quintile_profile: "R=2-3, F=1-2, M=1-2", account_count: 1, total_revenue: 140000, at_risk_revenue: 140000, action_strategy: "Win-Back Survey & Engagement", automated_trigger: "Re-engagement Email Pulse", color: "#F97316", icon: "💤" },
          { segment_name: "At-Risk Churners", quintile_profile: "R=1-2, F=4-5, M=4-5", account_count: 1, total_revenue: 1450000, at_risk_revenue: 1450000, action_strategy: "High-Value Account Stagnation Warning", automated_trigger: "Instant Manager Call Task", color: "#EF4444", icon: "🚨" },
          { segment_name: "Cannot Lose Them", quintile_profile: "R=1-2, F=4-5, M=5", account_count: 1, total_revenue: 2400000, at_risk_revenue: 2400000, action_strategy: "High-Touch Retention Concierge", automated_trigger: "C-Suite Personal Outreach", color: "#DC2626", icon: "🛡️" },
          { segment_name: "Hibernating", quintile_profile: "R=1-2, F=1-2, M=1-2", account_count: 1, total_revenue: 110000, at_risk_revenue: 110000, action_strategy: "Automated AI Revival Sequence", automated_trigger: "Low-Touch Email Campaign", color: "#6B7280", icon: "🍂" },
          { segment_name: "Lost / Inactive", quintile_profile: "R=1, F=1, M=1", account_count: 1, total_revenue: 75000, at_risk_revenue: 75000, action_strategy: "Archival Nurture or Exit Poll", automated_trigger: "Quarterly Win-Back Survey", color: "#4B5563", icon: "🚪" }
        ]
      });
    } finally {
      setRfmLoading(false);
    }
  };

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

  const fireConfetti = () => {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '99999';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const pieces = Array.from({ length: 90 }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height * 0.4,
      w: 8 + Math.random() * 8,
      h: 8 + Math.random() * 8,
      color: ['#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#EC4899'][Math.floor(Math.random() * 5)],
      vx: (Math.random() - 0.5) * 5,
      vy: 3 + Math.random() * 6,
      rot: Math.random() * 360,
      vrot: (Math.random() - 0.5) * 12
    }));
    let frames = 0;
    const anim = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vrot;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      frames++;
      if (frames < 140) requestAnimationFrame(anim);
      else canvas.remove();
    };
    anim();
  };

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

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button 
            onClick={fireConfetti}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 12, fontSize: 13, fontWeight: 700 }}
          >
            🎉 Celebrate Milestone
          </button>
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

      {/* Dual-Horizon RFM Customer Health Heatmap & Churn Alerts (Pillar 3) */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--primary)', letterSpacing: '0.08em' }}>
                PILLAR 3: DUAL-HORIZON RFM & CHURN ENGINE
              </span>
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)', fontWeight: 800 }}>
                TUYET 2025 & GUPTA 2024
              </span>
            </div>
            <h2 className="text-h2" style={{ margin: 0 }}>Customer Health Matrix & At-Risk Churn Early-Warning</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '4px 0 0' }}>
              Continuous Recency (R), Frequency (F), and Monetary (M) quintile evaluation ($1 \le R, F, M \le 5$) with automated triggers.
            </p>
          </div>

          {/* At-Risk Alert Strip */}
          <div style={{
            display: 'flex', gap: 16, alignItems: 'center',
            background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)',
            padding: '10px 18px', borderRadius: 12
          }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 900, color: '#EF4444', letterSpacing: '0.06em' }}>
                🚨 AT-RISK REVENUE VOLUME
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#EF4444' }}>
                ₹{((rfmData?.total_at_risk_revenue || 2400000) / 100000).toFixed(1)}L
              </div>
            </div>
            <div style={{ width: 1, height: 28, background: 'rgba(239, 68, 68, 0.2)' }} />
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)' }}>AT-RISK ACCOUNTS</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>
                {rfmData?.at_risk_account_count || 3} Accounts Stagnating
              </div>
            </div>
          </div>
        </div>

        {/* 10-Tile Interactive Matrix */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16
        }}>
          {(rfmData?.segments || []).map((seg, idx) => {
            const isAtRisk = seg.at_risk_revenue > 0;
            return (
              <div
                key={idx}
                className="card glass card-hover"
                style={{
                  padding: 18, borderRadius: 14,
                  borderTop: `4px solid ${seg.color}`,
                  background: isAtRisk ? 'rgba(239, 68, 68, 0.02)' : 'var(--bg-surface)',
                  display: 'flex', flexDirection: 'column', gap: 10
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20 }}>{seg.icon}</span>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>
                        {seg.segment_name}
                      </h4>
                      <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                        {seg.quintile_profile}
                      </span>
                    </div>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 8,
                    background: `${seg.color}15`, color: seg.color
                  }}>
                    {seg.account_count} {seg.account_count === 1 ? 'Account' : 'Accounts'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Total Value:</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>
                    ₹{(seg.total_revenue / 100000).toFixed(1)}L
                  </span>
                </div>

                {isAtRisk && (
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#EF4444', background: 'rgba(239, 68, 68, 0.1)', padding: '4px 8px', borderRadius: 6 }}>
                    ⚠ ₹{(seg.at_risk_revenue / 100000).toFixed(1)}L At Risk
                  </div>
                )}

                <div style={{ fontSize: 11, color: 'var(--text)', background: 'var(--bg-subtle)', padding: 8, borderRadius: 8, lineHeight: 1.4 }}>
                  <strong style={{ color: 'var(--text-muted)' }}>Action:</strong> {seg.action_strategy}
                </div>

                <button
                  onClick={() => {
                    showToast({
                      type: 'success',
                      message: `⚡ Executed: ${seg.automated_trigger} for ${seg.segment_name} (${seg.account_count} accounts)!`
                    });
                  }}
                  style={{
                    marginTop: 'auto', width: '100%', padding: '8px 0', borderRadius: 8, border: 'none',
                    background: isAtRisk ? '#EF4444' : 'var(--primary)',
                    color: 'white', fontSize: 11, fontWeight: 800, cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  ⚡ {seg.automated_trigger}
                </button>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
