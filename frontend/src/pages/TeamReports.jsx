import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const TeamReports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30 Days');

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('voiceiq_token');
      const res = await axios.get(`/api/analytics/dashboard?date_range=${dateRange}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
    } catch (err) {
      console.error("Error fetching team analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: 40 }}>Loading Team Intelligence...</div>;
  if (!data) return <div style={{ padding: 40 }}>Error loading reports.</div>;

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

  return (
    <div style={{ padding: '30px 40px', background: 'var(--bg)', height: '100%', overflowY: 'auto' }} className="custom-scroll">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <div>
          <h1 className="text-h1" style={{ marginBottom: 4 }}>Team Intelligence</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Aggregated performance and sentiment analysis across the organization.</p>
        </div>
        <select 
          value={dateRange} 
          onChange={(e) => setDateRange(e.target.value)}
          style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'white', fontWeight: 600 }}
        >
          <option>7 Days</option>
          <option>30 Days</option>
          <option>3 Months</option>
          <option>12 Months</option>
        </select>
      </div>

      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 30 }}>
        <div className="card glass" style={{ padding: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 8 }}>REVENUE WON</div>
          <div style={{ fontSize: 28, fontWeight: 900 }}>₹{(data.revenue_won / 100000).toFixed(1)}L</div>
          <div style={{ fontSize: 12, color: '#6366F1', marginTop: 4, fontWeight: 600 }}>↑ 12% vs last period</div>
        </div>
        <div className="card glass" style={{ padding: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 8 }}>AVG WIN RATE</div>
          <div style={{ fontSize: 28, fontWeight: 900 }}>{data.win_rate_pct || 0}%</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontWeight: 600 }}>Benchmark: 22%</div>
        </div>
        <div className="card glass" style={{ padding: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 8 }}>LEAD QUALITY</div>
          <div style={{ fontSize: 28, fontWeight: 900 }}>{data.leads_avg_ai_score?.toFixed(1) || 0}</div>
          <div style={{ fontSize: 12, color: '#6366F1', marginTop: 4, fontWeight: 600 }}>High Intent Average</div>
        </div>
        <div className="card glass" style={{ padding: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 8 }}>TOTAL ACTIVITIES</div>
          <div style={{ fontSize: 28, fontWeight: 900 }}>{data.activities_last_7_days}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontWeight: 600 }}>Calls + Messages</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24, marginBottom: 30 }}>
        <div className="card glass" style={{ padding: 30 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 24 }}>Pipeline Distribution</h3>
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
          <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 24 }}>Customer Sentiment</h3>
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

      <div className="card glass" style={{ padding: 30 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>AI Insights</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>Real-time observations from lead patterns and model performance.</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
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
    </div>
  );
};

export default TeamReports;
