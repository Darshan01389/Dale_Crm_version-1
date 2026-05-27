import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const TeamReports = () => {
  const [data, setData] = useState(null);
  const [teamReport, setTeamReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30 Days');

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  useEffect(() => {
    fetchTeamReportData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('voiceiq_token');
      const res = await axios.get(`/api/analytics/dashboard?date_range=${dateRange}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
    } catch (err) {
      console.error("Error fetching team analytics dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamReportData = async () => {
    setReportLoading(true);
    try {
      const token = localStorage.getItem('voiceiq_token');
      const res = await axios.get('/api/analytics/team-progress', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeamReport(res.data);
    } catch (err) {
      console.error("Error fetching team progress report:", err);
    } finally {
      setReportLoading(false);
    }
  };

  if (loading || reportLoading) return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Loading Team Intelligence...</div>;
  if (!data) return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Error loading reports.</div>;

  const sentimentData = [
    { name: 'Positive', value: data.sentiment_breakdown.positive, color: '#10B981' },
    { name: 'Neutral', value: data.sentiment_breakdown.neutral, color: '#6B7280' },
    { name: 'Negative', value: data.sentiment_breakdown.negative, color: '#EF4444' },
  ];

  const funnelData = data.funnel.map(f => ({
    name: f.label,
    value: f.open_deals,
    amount: f.open_pipeline_value
  }));

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'SR';
  };

  return (
    <div style={{ padding: '30px 40px', background: 'var(--bg)', height: '100%', overflowY: 'auto' }} className="custom-scroll animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <div>
          <h1 className="text-h1" style={{ marginBottom: 4 }}>Team Intelligence</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Aggregated performance and sentiment analysis across the organization.</p>
        </div>
        <select 
          value={dateRange} 
          onChange={(e) => setDateRange(e.target.value)}
          style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'white', fontWeight: 600, outline: 'none' }}
        >
          <option>7 Days</option>
          <option>30 Days</option>
          <option>3 Months</option>
          <option>12 Months</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 30 }}>
        <div className="card glass" style={{ padding: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 8 }}>REVENUE WON</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--primary)' }}>₹{(data.revenue_won / 100000).toFixed(1)}L</div>
          <div style={{ fontSize: 12, color: 'var(--success)', marginTop: 4, fontWeight: 600 }}>↑ 12% vs last period</div>
        </div>
        <div className="card glass" style={{ padding: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 8 }}>AVG WIN RATE</div>
          <div style={{ fontSize: 28, fontWeight: 900 }}>{data.win_rate_pct || 0}%</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontWeight: 600 }}>Benchmark: 22%</div>
        </div>
        <div className="card glass" style={{ padding: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 8 }}>LEAD QUALITY</div>
          <div style={{ fontSize: 28, fontWeight: 900 }}>{data.leads_avg_ai_score?.toFixed(1) || 0}</div>
          <div style={{ fontSize: 12, color: 'var(--primary)', marginTop: 4, fontWeight: 600 }}>High Intent Average</div>
        </div>
        <div className="card glass" style={{ padding: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 8 }}>TOTAL ACTIVITIES</div>
          <div style={{ fontSize: 28, fontWeight: 900 }}>{data.activities_last_7_days}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontWeight: 600 }}>Calls + Messages</div>
        </div>
      </div>

      {/* Recharts Funnel and Sentiment */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24, marginBottom: 30 }} className="middle-grid">
        <div className="card glass" style={{ padding: 30 }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 24 }}>Pipeline Distribution</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                  {funnelData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#EF4444'][idx % 6]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card glass" style={{ padding: 30 }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 24 }}>Customer Sentiment</h3>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 20 }}>
            {sentimentData.map(s => (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, boxShadow: `0 0 8px ${s.color}66` }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>{s.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── TEAMS AGGREGATED REPORT ── */}
      <div className="card glass animate-in" style={{ padding: 30, marginBottom: 30 }}>
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', margin: 0 }}>👥 Teams Performance & Analytics</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Aggregated leads and sales deal pipeline metrics segmented at the team level.</p>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', paddingBottom: 12 }}>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>TEAM SQUAD</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>MEMBERS</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>ACTIVE LEADS</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>OPEN DEALS</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>DEALS WON</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>REVENUE WON</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>WIN RATE</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>TEAM AI INDEX</th>
              </tr>
            </thead>
            <tbody>
              {teamReport?.teams?.map((team) => (
                <tr key={team.id} className="hover-lift" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'transparent', transition: 'background 0.2s' }}>
                  <td style={{ padding: '16px 16px', fontWeight: 800, color: 'var(--text)', fontSize: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: team.id === 'unassigned' ? '#9CA3AF' : 'var(--primary)' }} />
                      <div>
                        {team.name}
                        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginTop: 2 }}>{team.description}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 16px', fontWeight: 700, color: 'var(--text)' }}>{team.member_count}</td>
                  <td style={{ padding: '16px 16px', fontWeight: 700, color: 'var(--text)' }}>{team.leads_count}</td>
                  <td style={{ padding: '16px 16px', fontWeight: 700, color: 'var(--text)' }}>{team.deals_open}</td>
                  <td style={{ padding: '16px 16px', fontWeight: 700, color: 'var(--success)' }}>{team.deals_won}</td>
                  <td style={{ padding: '16px 16px', fontWeight: 800, color: 'var(--primary)' }}>₹{(team.revenue_won / 100000).toFixed(1)}L</td>
                  <td style={{ padding: '16px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 60, height: 6, background: 'var(--bg-subtle)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${team.win_rate}%`, height: '100%', background: 'var(--success)' }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 800 }}>{team.win_rate}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 16px' }}>
                    <span style={{ padding: '4px 8px', borderRadius: 6, background: team.avg_ai_score >= 70 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(99, 102, 241, 0.1)', color: team.avg_ai_score >= 70 ? 'var(--success)' : 'var(--primary)', fontSize: 12, fontWeight: 800 }}>
                      {team.avg_ai_score || 0}
                    </span>
                  </td>
                </tr>
              ))}
              {(!teamReport?.teams || teamReport.teams.length === 0) && (
                <tr>
                  <td colSpan="8" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    No team squads configured in the system.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MEMBERS INDIVIDUAL REPORT ── */}
      <div className="card glass animate-in" style={{ padding: 30, marginBottom: 30 }}>
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', margin: 0 }}>🏆 Team Members Progress & Velocity</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Granular performance indicators and lead conversion summaries for individual sales representatives.</p>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', paddingBottom: 12 }}>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>REPRESENTATIVE</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>TEAM SQUAD</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>ROLE</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>LEADS OWNED</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>OPEN DEALS</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>DEALS WON</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>REVENUE WON</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>WIN RATE</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>AI INDEX</th>
              </tr>
            </thead>
            <tbody>
              {teamReport?.members?.map((member) => (
                <tr key={member.id} className="hover-lift" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'transparent', transition: 'background 0.2s' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ 
                        width: 32, height: 32, borderRadius: 10, background: 'var(--primary-glow)', color: 'var(--primary)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12
                      }}>
                        {getInitials(member.name)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, color: 'var(--text)', fontSize: 13.5 }}>{member.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{member.team_name}</span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ 
                      padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase',
                      background: member.role === 'Owner / Admin' ? 'rgba(239, 68, 68, 0.1)' : member.role === 'Team Lead' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                      color: member.role === 'Owner / Admin' ? 'var(--danger)' : member.role === 'Team Lead' ? 'var(--warning)' : 'var(--primary)'
                    }}>
                      {member.role === 'Owner / Admin' ? 'Admin' : member.role === 'Team Lead' ? 'Manager' : 'Sales'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text)' }}>{member.leads_count}</td>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text)' }}>{member.deals_open}</td>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--success)' }}>{member.deals_won}</td>
                  <td style={{ padding: '14px 16px', fontWeight: 800, color: 'var(--primary)' }}>₹{(member.revenue_won / 100000).toFixed(1)}L</td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 50, height: 5, background: 'var(--bg-subtle)', borderRadius: 3.5, overflow: 'hidden' }}>
                        <div style={{ width: `${member.win_rate}%`, height: '100%', background: 'var(--success)' }} />
                      </div>
                      <span style={{ fontSize: 12.5, fontWeight: 800 }}>{member.win_rate}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ padding: '3px 6px', borderRadius: 5, background: member.avg_ai_score >= 70 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(99, 102, 241, 0.08)', color: member.avg_ai_score >= 70 ? 'var(--success)' : 'var(--primary)', fontSize: 12, fontWeight: 800 }}>
                      {member.avg_ai_score || 0}
                    </span>
                  </td>
                </tr>
              ))}
              {(!teamReport?.members || teamReport.members.length === 0) && (
                <tr>
                  <td colSpan="9" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    No users registered in this organization.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Insights */}
      <div className="card glass" style={{ padding: 30 }}>
        <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 8 }}>AI Insights</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>Real-time observations from lead patterns and model performance.</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }} className="middle-grid">
          <div style={{ padding: 20, borderRadius: 16, background: '#F0FAF4', border: '1px solid #D1FAE5' }}>
            <div style={{ fontSize: 16, marginBottom: 8 }}>📈</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#065F46', marginBottom: 4 }}>Conversion Uptrend</div>
            <p style={{ fontSize: 12, color: '#065F46', opacity: 0.8, margin: 0 }}>Lead scoring accuracy has improved to {data.model_accuracy_pct?.toFixed(1) || 0}% this month.</p>
          </div>
          <div style={{ padding: 20, borderRadius: 16, background: '#EFF6FF', border: '1px solid #DBEAFE' }}>
            <div style={{ fontSize: 16, marginBottom: 8 }}>⚡</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#1E40AF', marginBottom: 4 }}>Velocity Alert</div>
            <p style={{ fontSize: 12, color: '#1E40AF', opacity: 0.8, margin: 0 }}>Average deal duration is 14% shorter for high-intent leads.</p>
          </div>
          <div style={{ padding: 20, borderRadius: 16, background: '#FFF7ED', border: '1px solid #FFEDD5' }}>
            <div style={{ fontSize: 16, marginBottom: 8 }}>💡</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#9A3412', marginBottom: 4 }}>Optimization Hint</div>
            <p style={{ fontSize: 12, color: '#9A3412', opacity: 0.8, margin: 0 }}>Inbound calls show 3x higher positive sentiment than email outreach.</p>
          </div>
        </div>
      </div>
      
      <style>{`
        @media (max-width: 1024px) {
          .middle-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
        }
      `}</style>
    </div>
  );
};

export default TeamReports;
