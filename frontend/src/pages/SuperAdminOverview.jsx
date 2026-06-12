import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

const StatCard = ({ label, value, icon, color, sub }) => (
  <div style={{
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 16,
    transition: 'box-shadow 0.2s ease',
  }}
    onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-lg)'}
    onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
  >
    <div style={{
      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
      background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ color, fontSize: 20 }}>{icon}</span>
    </div>
    <div>
      <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color, marginTop: 4, fontWeight: 600 }}>{sub}</div>}
    </div>
  </div>
);

const CompanyRow = ({ company, onClick }) => (
  <div
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '14px 20px',
      borderRadius: 12,
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      marginBottom: 8,
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = 'var(--primary)';
      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = 'var(--border)';
      e.currentTarget.style.boxShadow = 'none';
    }}
  >
    <div style={{
      width: 40, height: 40, borderRadius: 10,
      background: 'var(--primary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontWeight: 800, fontSize: 16, flexShrink: 0,
    }}>
      {(company.name || 'C')[0].toUpperCase()}
    </div>
    <div style={{ flex: 1, overflow: 'hidden' }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{company.name}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
        {company.industry || 'Unknown Industry'} · {company.size || '—'} employees
      </div>
    </div>
    <div style={{ textAlign: 'right', flexShrink: 0 }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>ID: {company.id}</div>
      <div style={{
        marginTop: 4, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
        background: 'rgba(79, 70, 229, 0.12)', color: 'var(--primary)',
      }}>
        View →
      </div>
    </div>
  </div>
);

const SuperAdminOverview = () => {
  const navigate = useNavigate();
  const { profile, selectedCompanyId, setSelectedCompanyId } = useUser();
  const [companies, setCompanies] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = sessionStorage.getItem('voiceiq_token') || localStorage.getItem('voiceiq_token');

  useEffect(() => {
    if (!profile?.isSuperAdmin) {
      navigate('/');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const [companiesRes] = await Promise.all([
          fetch('/api/company/', { headers: { 'Authorization': `Bearer ${token}` } }),
        ]);

        if (companiesRes.ok) {
          const companiesData = await companiesRes.json();
          const list = Array.isArray(companiesData) ? companiesData : [];
          setCompanies(list);
          setStats({
            total_companies: list.length,
            active_companies: list.filter(c => c.status !== 'inactive').length,
          });
        }
      } catch (err) {
        console.error('SuperAdmin overview fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile, token, navigate]);

  const handleViewCompany = (company) => {
    setSelectedCompanyId(company.id);
    navigate('/kanban');
  };

  if (!profile?.isSuperAdmin) return null;

  return (
    <div style={{ padding: '32px 32px', overflowY: 'auto', height: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(124, 58, 237, 0.35)',
          }}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>Global Overview</h2>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>DaleCRM Super Admin — All Companies</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading...</div>
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 16,
            marginBottom: 32,
          }}>
            <StatCard
              label="Total Companies"
              value={stats?.total_companies ?? 0}
              icon="🏢"
              color="#4F46E5"
              sub="Registered tenants"
            />
            <StatCard
              label="Active Companies"
              value={stats?.active_companies ?? 0}
              icon="✅"
              color="#10B981"
              sub="Currently active"
            />
          </div>

          {/* Companies List */}
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
              All Companies
            </h3>
            <button
              onClick={() => navigate('/super-admin/companies')}
              style={{
                fontSize: 13, fontWeight: 600, color: 'var(--primary)',
                background: 'none', border: 'none', cursor: 'pointer',
              }}
            >
              Manage →
            </button>
          </div>

          {companies.length === 0 ? (
            <div style={{
              padding: 40, textAlign: 'center',
              background: 'var(--bg-surface)',
              border: '1px dashed var(--border)',
              borderRadius: 16,
              color: 'var(--text-muted)',
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🏢</div>
              <p style={{ margin: 0, fontWeight: 600 }}>No companies registered yet</p>
              <p style={{ margin: '4px 0 0', fontSize: 13 }}>Companies will appear here once registered.</p>
            </div>
          ) : (
            <div>
              {companies.map(company => (
                <CompanyRow
                  key={company.id}
                  company={company}
                  onClick={() => handleViewCompany(company)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SuperAdminOverview;
