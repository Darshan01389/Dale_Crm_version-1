import React, { useState, useEffect } from 'react';
import axios from 'axios';

// A simple mock chart to avoid taking a new charting dependency if one isn't present
// though in a real app Recharts or Chart.js would be used here.
const FunnelBar = ({ label, value, max, color }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--text)' }}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
    <div style={{ width: '100%', height: 16, background: 'var(--bg-surface)', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ width: `${Math.min((value / max) * 100, 100)}%`, height: '100%', background: color, borderRadius: 8, transition: 'width 1s ease-out' }} />
    </div>
  </div>
);

const CampaignAnalytics = () => {
  const [metrics, setMetrics] = useState({
    totalSpend: 1450.50,
    leadsGenerated: 342,
    qualifiedLeads: 89,
    revenue: 45000,
    cpl: 4.24,
    cac: 16.29,
    roi: 3103,
    conversionRate: 26.02
  });

  const [aiInsights, setAiInsights] = useState([]);
  const [loadingInsights, setLoadingInsights] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const token = localStorage.getItem('voiceiq_token');
        const res = await axios.get('/api/analytics/ai-insights', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAiInsights(res.data);
      } catch (err) {
        console.error("Failed to fetch AI insights", err);
      } finally {
        setLoadingInsights(false);
      }
    };
    fetchInsights();
  }, []);

  // Example funnels
  const maxFunnel = 5000;
  
  return (
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <h2 className="text-h2" style={{ margin: 0 }}>Campaign Analytics</h2>
        
        <div style={{ display: 'flex', gap: 12 }}>
          <select style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}>
            <option>Last 30 Days</option>
            <option>Last 7 Days</option>
            <option>This Quarter</option>
          </select>
          <button className="btn-primary" style={{ padding: '8px 16px', borderRadius: 8 }}>Export Report</button>
        </div>
      </div>

      {/* Top Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Total Spend', value: `$${metrics.totalSpend.toLocaleString()}` },
          { label: 'Leads Generated', value: metrics.leadsGenerated },
          { label: 'Cost Per Lead (CPL)', value: `$${metrics.cpl}` },
          { label: 'Revenue Generated', value: `$${metrics.revenue.toLocaleString()}` },
          { label: 'Return on Ad Spend (ROAS)', value: `${metrics.roi}%` },
          { label: 'Conversion Rate', value: `${metrics.conversionRate}%` },
        ].map((m, i) => (
          <div key={i} className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>{m.label}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--text)' }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Source Contribution Funnel */}
        <div className="card" style={{ padding: 24 }}>
          <h3 className="text-h3" style={{ marginBottom: 24 }}>Lead Sources (All Time)</h3>
          <FunnelBar label="Website Organic" value={2105} max={maxFunnel} color="#3B82F6" />
          <FunnelBar label="Facebook Ads" value={1450} max={maxFunnel} color="#10B981" />
          <FunnelBar label="Google Ads" value={890} max={maxFunnel} color="#F59E0B" />
          <FunnelBar label="LinkedIn B2B" value={420} max={maxFunnel} color="#6366F1" />
        </div>

        {/* AI Recommendations */}
        <div className="card glass" style={{ padding: 24, border: '1px solid var(--primary)', background: 'var(--bg-surface)' }}>
          <h3 className="text-h3" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
            ✨ AI Campaign Optimizer
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {loadingInsights ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>Analyzing campaign metrics...</div>
            ) : aiInsights.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>No critical insights at this time.</div>
            ) : (
              aiInsights.map((insight, idx) => {
                let bg, border, color;
                if (insight.insight_type === 'PAUSE') {
                  bg = 'rgba(239, 68, 68, 0.1)';
                  border = 'rgba(239, 68, 68, 0.2)';
                  color = 'var(--danger)';
                } else if (insight.insight_type === 'SCALE') {
                  bg = 'rgba(16, 185, 129, 0.1)';
                  border = 'rgba(16, 185, 129, 0.2)';
                  color = 'var(--success)';
                } else {
                  bg = 'var(--bg-subtle)';
                  border = 'var(--border)';
                  color = 'var(--primary)';
                }

                return (
                  <div key={insight.id || idx} style={{ padding: 16, background: bg, borderRadius: 12, border: `1px solid ${border}` }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: color, marginBottom: 4 }}>
                      {insight.insight_type} RECOMMENDATION
                    </div>
                    <p style={{ margin: 0, fontSize: 14, color: 'var(--text)' }}>{insight.message}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignAnalytics;
