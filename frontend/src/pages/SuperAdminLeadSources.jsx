import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

const SuperAdminLeadSources = () => {
  const navigate = useNavigate();
  const { profile, selectedCompanyId } = useUser();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = sessionStorage.getItem('voiceiq_token') || localStorage.getItem('voiceiq_token');

  useEffect(() => {
    if (!profile?.isSuperAdmin) { navigate('/'); return; }
    const url = selectedCompanyId
      ? `/api/leads/?company_id=${selectedCompanyId}&limit=2000`
      : '/api/leads/?limit=2000';
    fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : { items: [] })
      .then(resp => setLeads(resp.items || resp || []))
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  }, [profile, token, navigate, selectedCompanyId]);

  if (!profile?.isSuperAdmin) return null;

  // Aggregate source counts
  const sourceCounts = leads.reduce((acc, lead) => {
    const src = lead.source || 'Unknown';
    acc[src] = (acc[src] || 0) + 1;
    return acc;
  }, {});

  const sorted = Object.entries(sourceCounts)
    .sort(([, a], [, b]) => b - a);

  const total = leads.length;
  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EC4899', '#06B6D4', '#8B5CF6', '#EF4444', '#14B8A6'];

  return (
    <div style={{ padding: '32px', overflowY: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>Lead Source Usage</h2>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
          {selectedCompanyId ? `Company #${selectedCompanyId}` : 'All companies'} · {total} total leads
        </p>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)' }}>Loading lead source data...</div>
      ) : sorted.length === 0 ? (
        <div style={{
          padding: 48, textAlign: 'center', borderRadius: 16,
          background: 'var(--bg-surface)', border: '1px dashed var(--border)',
          color: 'var(--text-muted)',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📡</div>
          <p style={{ margin: 0, fontWeight: 600 }}>No lead source data yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 640 }}>
          {sorted.map(([source, count], idx) => {
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            const color = COLORS[idx % COLORS.length];
            return (
              <div key={source} style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border)',
                borderRadius: 12, padding: '16px 20px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{source}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
                    {count} leads ({pct}%)
                  </span>
                </div>
                <div style={{ background: 'var(--bg-subtle)', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                  <div style={{
                    width: `${pct}%`, height: '100%',
                    background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                    borderRadius: 99,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SuperAdminLeadSources;
