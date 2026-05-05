import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SetupChecklist from '../components/SetupChecklist';
import FoundingWelcome from '../components/FoundingWelcome';
import { useUser } from '../contexts/UserContext';

const MOCK = {
  kpis: [
    { label: 'Revenue vs Target', value: '₹24.2L', sub: '81% of ₹30L target', trend: '+12%', up: true, progress: 81 },
    { label: 'AI Forecast', value: '₹31.1L', sub: 'HIGH confidence band', trend: '', up: true },
    { label: 'Win Rate', value: '34%', sub: '18 of 53 deals closed', trend: '+3pts', up: true },
    { label: 'Pipeline Value', value: '₹68.5L', sub: '47 active deals', trend: '-2%', up: false },
  ],
  team: [
    { name: 'Ravi Kumar', revenue: '₹8.4L', pct: 84, initials: 'RK' },
    { name: 'Priya Sharma', revenue: '₹7.1L', pct: 71, initials: 'PS' },
    { name: 'Arun Mehta', revenue: '₹5.2L', pct: 52, initials: 'AM' },
    { name: 'Deepa Nair', revenue: '₹3.5L', pct: 35, initials: 'DN' },
  ],
  atRisk: [
    { name: 'Globex Corp', rep: 'Ravi Kumar', reason: 'No contact in 12 days', value: '₹4.2L', id: '1' },
    { name: 'Initech Pvt Ltd', rep: 'Priya Sharma', reason: 'Proposal not opened', value: '₹2.8L', id: '2' },
    { name: 'Umbrella Retail', rep: 'Arun Mehta', reason: 'Sentiment declining', value: '₹1.5L', id: '3' },
  ],
  sourceRevenue: [
    { source: 'Inbound Website', value: '₹12.5L', pct: 52 },
    { source: 'Outbound Cold', value: '₹6.8L', pct: 28 },
    { source: 'Referral', value: '₹3.2L', pct: 13 },
    { source: 'Partner', value: '₹1.7L', pct: 7 },
  ],
  channelHealth: [
    { channel: 'WhatsApp', metric: '68%', label: 'Response Rate', status: 'healthy' },
    { channel: 'Voice Calls', metric: '4m 12s', label: 'Avg Duration', status: 'healthy' },
    { channel: 'Email', metric: '12%', label: 'Open Rate', status: 'warning' },
    { channel: 'SMS', metric: '2.1%', label: 'Click Rate', status: 'critical' },
  ]
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { profile } = useUser();
  const [data] = useState(MOCK);
  const [showChecklist] = useState(profile?.role !== 'Sales Rep');
  const [showFounding, setShowFounding] = useState(!localStorage.getItem('founding_seen'));

  const handleCloseFounding = () => {
    localStorage.setItem('founding_seen', 'true');
    setShowFounding(false);
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
        <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 360 }}>
          <select className="input" style={{ fontWeight: 600 }}>
            <option>All Teams</option>
            <option>Alpha Squad</option>
            <option>Enterprise West</option>
          </select>
        </div>
      </div>

      {/* Setup Checklist */}
      {showChecklist && (
        <div style={{ marginBottom: 40 }}>
          <SetupChecklist />
        </div>
      )}

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 40 }}>
        {data.kpis.map((kpi, i) => (
          <div key={i} className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{kpi.label.toUpperCase()}</span>
              {kpi.trend && (
                <span style={{ fontSize: 12, fontWeight: 700, color: kpi.up ? 'var(--success)' : 'var(--danger)', background: kpi.up ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', padding: '2px 8px', borderRadius: 6 }}>
                  {kpi.up ? '↑' : '↓'} {kpi.trend}
                </span>
              )}
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>{kpi.value}</div>
            <div style={{ marginTop: 'auto' }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 10 }}>{kpi.sub}</div>
              {kpi.progress !== undefined && (
                <div style={{ height: 8, background: 'var(--bg-subtle)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${kpi.progress}%`, height: '100%', background: 'var(--primary)', borderRadius: 4, boxShadow: '0 0 8px var(--primary-glow)' }} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="middle-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 40 }}>
        
        {/* Revenue by Team Bar Chart (Spec Requirement) */}
        <div className="card" style={{ padding: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <h3 className="text-h3" style={{ margin: 0 }}>Revenue by Rep</h3>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>QUOTA ATTAINMENT</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {data.team.map(rep => (
              <div key={rep.name} style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ width: 100, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                  {rep.name}
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, height: 24, background: 'var(--bg-subtle)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${rep.pct}%`, height: '100%', 
                      background: rep.pct >= 75 ? 'var(--rep-accent)' : rep.pct >= 50 ? 'var(--owner-accent)' : 'var(--danger)',
                    }} />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', width: 60, textAlign: 'right' }}>{rep.revenue}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Source -> Revenue Attribution (Spec Requirement) */}
        <div className="card" style={{ padding: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <h3 className="text-h3" style={{ margin: 0 }}>Source → Revenue</h3>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>YTD PIPELINE</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {data.sourceRevenue.map(src => (
              <div key={src.source}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{src.source}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>{src.value}</span>
                </div>
                <div style={{ height: 8, background: 'var(--bg-subtle)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${src.pct}%`, height: '100%', background: 'var(--primary)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Channel Health 4-Card Section (Spec Requirement) */}
      <h3 className="text-h3" style={{ marginBottom: 24 }}>Channel Health</h3>
      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 40 }}>
        {data.channelHealth.map(ch => (
          <div key={ch.channel} className="card" style={{ padding: 20, borderLeft: `4px solid ${ch.status === 'healthy' ? 'var(--success)' : ch.status === 'warning' ? 'var(--owner-accent)' : 'var(--danger)'}` }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: 8 }}>{ch.channel.toUpperCase()}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>{ch.metric}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{ch.label}</div>
          </div>
        ))}
      </div>

      {/* Middle row 2 */}
      <div className="middle-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 40 }}>
        {/* Live Activity Feed */}
        <div className="card" style={{ padding: 32, background: 'var(--text)', border: 'none', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 100%)', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, position: 'relative' }}>
            <h3 className="text-h3" style={{ margin: 0, color: 'white' }}>Live Activity</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 10px #10B981' }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: '#10B981', letterSpacing: '0.05em' }}>MONITORING</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, position: 'relative' }}>
            {[
              { rep: 'Ravi', action: 'Sent proposal to Sarah', time: '10m ago', icon: '📄' },
              { rep: 'Priya', action: 'Logged 4m call with Michael', time: '22m ago', icon: '📞' },
              { rep: 'Arun', action: 'Created new contact: Amit', time: '1h ago', icon: '👤' },
              { rep: 'Deepa', action: 'Won deal: TechFlow Inc', time: '2h ago', special: true, icon: '🏆' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: item.special ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
                    <span style={{ fontWeight: 800, color: item.special ? '#10B981' : 'white' }}>{item.rep}</span> {item.action}
                  </p>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Deals at Risk Table */}
        <div className="card" style={{ padding: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
            <div>
              <h3 className="text-h3" style={{ margin: 0 }}>⚠️ Critical Deals</h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8, fontWeight: 500 }}>AI flagged deals requiring attention</p>
            </div>
            <button className="btn-secondary" style={{ height: 40, padding: '0 20px', fontWeight: 700 }}>VIEW ALL</button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-subtle)' }}>
                  {['Prospect', 'Risk Factor', 'Value'].map(h => (
                    <th key={h} style={{ padding: '0 16px 16px 0', textAlign: 'left', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.atRisk.map(deal => (
                  <tr key={deal.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '20px 16px 20px 0', fontWeight: 700, color: 'var(--text)', fontSize: 14 }}>{deal.name}</td>
                    <td style={{ padding: '20px 16px 20px 0' }}>
                      <span style={{ padding: '4px 10px', background: 'rgba(217, 119, 6, 0.1)', color: 'var(--owner-accent)', borderRadius: 6, fontSize: 10, fontWeight: 800 }}>{deal.reason.toUpperCase()}</span>
                    </td>
                    <td style={{ padding: '20px 0', fontWeight: 800, color: 'var(--text)', fontSize: 14 }}>{deal.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
