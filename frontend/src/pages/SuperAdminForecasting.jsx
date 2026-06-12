import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

const SuperAdminForecasting = () => {
  const navigate = useNavigate();
  const { profile, selectedCompanyId } = useUser();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = sessionStorage.getItem('voiceiq_token') || localStorage.getItem('voiceiq_token');

  useEffect(() => {
    if (!profile?.isSuperAdmin) { navigate('/'); return; }
    const url = selectedCompanyId
      ? `/api/deals/?company_id=${selectedCompanyId}`
      : '/api/deals/';
    fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : { items: [] })
      .then(resp => {
        const deals = resp.items || resp || [];
        const total = deals.reduce((s, d) => s + (d.value || 0), 0);
        const won = deals.filter(d => d.stage === 'Closed Won');
        const lost = deals.filter(d => d.stage === 'Closed Lost');
        const pipeline = deals.filter(d => !['Closed Won', 'Closed Lost'].includes(d.stage));
        setData({
          total_deals: deals.length,
          pipeline_value: pipeline.reduce((s, d) => s + (d.value || 0), 0),
          won_value: won.reduce((s, d) => s + (d.value || 0), 0),
          won_count: won.length,
          lost_count: lost.length,
          pipeline_count: pipeline.length,
        });
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [profile, token, navigate, selectedCompanyId]);

  if (!profile?.isSuperAdmin) return null;

  const fmt = (v) => `$${(v || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <div style={{ padding: '32px', overflowY: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>Global Forecasting</h2>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
          {selectedCompanyId ? `Company #${selectedCompanyId} forecast` : 'Aggregated across all companies'}
        </p>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)' }}>Loading forecasting data...</div>
      ) : !data ? (
        <div style={{ color: 'var(--text-muted)' }}>Failed to load data. Make sure the backend is running.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {[
            { label: 'Pipeline Value', value: fmt(data.pipeline_value), icon: '📊', color: '#4F46E5', sub: `${data.pipeline_count} active deals` },
            { label: 'Won Revenue', value: fmt(data.won_value), icon: '🏆', color: '#10B981', sub: `${data.won_count} deals won` },
            { label: 'Deals Lost', value: data.lost_count, icon: '❌', color: '#EF4444', sub: 'This period' },
            { label: 'Total Deals', value: data.total_deals, icon: '📋', color: '#F59E0B', sub: 'All time' },
          ].map(card => (
            <div key={card.label} style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: 16, padding: '20px 24px',
              display: 'flex', alignItems: 'flex-start', gap: 16,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: `${card.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20,
              }}>{card.icon}</div>
              <div>
                <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{card.value}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{card.label}</div>
                <div style={{ fontSize: 11, color: card.color, marginTop: 4, fontWeight: 600 }}>{card.sub}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SuperAdminForecasting;
