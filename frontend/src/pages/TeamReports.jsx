import React from 'react';

const TeamReports = () => (
  <div style={{ padding: 40 }}>
    <h1 className="text-h1">Team Performance</h1>
    <p style={{ color: 'var(--text-muted)' }}>Detailed breakdown of team revenue, win rates, and activity metrics.</p>
    <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 24 }}>
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>TOTAL REVENUE</div>
        <div style={{ fontSize: 24, fontWeight: 900 }}>₹0.00</div>
      </div>
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>AVG WIN RATE</div>
        <div style={{ fontSize: 24, fontWeight: 900 }}>0%</div>
      </div>
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>ACTIVE QUOTAS</div>
        <div style={{ fontSize: 24, fontWeight: 900 }}>0</div>
      </div>
    </div>
    <div className="card" style={{ padding: 40, marginTop: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
      <h3>Insufficient data for reports</h3>
      <p style={{ maxWidth: 300, margin: '0 auto', color: 'var(--text-muted)' }}>
        Complete your first month of activity to see trend lines and comparative performance.
      </p>
    </div>
  </div>
);

export default TeamReports;
