import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

const SuperAdminCompanies = () => {
  const navigate = useNavigate();
  const { profile, setSelectedCompanyId } = useUser();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const token = sessionStorage.getItem('voiceiq_token') || localStorage.getItem('voiceiq_token');

  useEffect(() => {
    if (!profile?.isSuperAdmin) { navigate('/'); return; }
    fetch('/api/company/', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => setCompanies(Array.isArray(data) ? data : []))
      .catch(() => setCompanies([]))
      .finally(() => setLoading(false));
  }, [profile, token, navigate]);

  const filtered = companies.filter(c =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.industry || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleView = (company) => {
    setSelectedCompanyId(company.id);
    navigate('/kanban');
  };

  if (!profile?.isSuperAdmin) return null;

  return (
    <div style={{ padding: '32px', overflowY: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>All Companies</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
            {companies.length} registered tenant{companies.length !== 1 ? 's' : ''}
          </p>
        </div>
        <input
          type="text"
          placeholder="Search companies..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)',
            background: 'var(--bg-subtle)', color: 'var(--text)', fontSize: 13,
            outline: 'none', width: 220,
          }}
        />
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)' }}>Loading companies...</div>
      ) : filtered.length === 0 ? (
        <div style={{
          padding: 48, textAlign: 'center', borderRadius: 16,
          background: 'var(--bg-surface)', border: '1px dashed var(--border)',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏢</div>
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--text)' }}>No companies found</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {filtered.map(company => (
            <div
              key={company.id}
              onClick={() => handleView(company)}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 800, fontSize: 18,
                }}>
                  {(company.name || 'C')[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{company.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {company.industry || 'Unknown Industry'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>Size: </span>
                  {company.size || '—'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>ID: </span>
                  {company.id}
                </div>
              </div>
              <div style={{
                marginTop: 14, padding: '8px 12px', borderRadius: 8,
                background: 'rgba(79, 70, 229, 0.08)',
                fontSize: 12, fontWeight: 600, color: 'var(--primary)', textAlign: 'center',
              }}>
                Click to view pipeline →
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SuperAdminCompanies;
