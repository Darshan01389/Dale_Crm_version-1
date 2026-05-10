import React from 'react';
import QuotaIndicator from '../components/QuotaIndicator';

const Billing = () => {
  return (
    <div style={{ padding: 'var(--mobile-padding, 40px)', background: 'var(--bg)', height: '100%', overflowY: 'auto' }} className="custom-scroll animate-in">
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <h1 className="text-h1" style={{ marginBottom: 8 }}>Billing & Plans</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 32, fontSize: 16 }}>Manage your subscription, invoices, and quota usage.</p>

        {/* Quota Warning Banner */}
        <QuotaIndicator label="AI Processing Credits" current={9200} total={10000} resetDate="June 1, 2026" />

        <div className="card" style={{ padding: 32, marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <h2 style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>Growth Plan</h2>
              <span style={{ background: 'var(--owner-accent)', color: 'white', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800 }}>ACTIVE</span>
            </div>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 14 }}>$499/month · Next billing date: June 1, 2026</p>
          </div>
          <button className="btn-primary" style={{ padding: '12px 24px' }}>Upgrade Plan</button>
        </div>

        <h3 className="text-h3" style={{ marginBottom: 20 }}>Usage Quotas</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 40 }}>
          {[
            { label: 'Active User Seats', used: 12, total: 15, pct: 80 },
            { label: 'AI Processing Credits', used: 9200, total: 10000, pct: 92 },
            { label: 'WhatsApp Messages', used: 450, total: 2000, pct: 22 },
          ].map(quota => (
            <div key={quota.label} className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontWeight: 700 }}>{quota.label}</span>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{quota.used} / {quota.total}</span>
              </div>
              <div style={{ height: 8, background: 'var(--bg-subtle)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ 
                  width: `${quota.pct}%`, 
                  height: '100%', 
                  background: quota.pct > 90 ? 'var(--danger)' : quota.pct > 75 ? 'var(--owner-accent)' : 'var(--primary)',
                  borderRadius: 4
                }} />
              </div>
            </div>
          ))}
        </div>

        <h3 className="text-h3" style={{ marginBottom: 20 }}>Recent Invoices</h3>
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle)', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: 1 }}>
                <th style={{ padding: '16px 24px' }}>DATE</th>
                <th style={{ padding: '16px 24px' }}>AMOUNT</th>
                <th style={{ padding: '16px 24px' }}>STATUS</th>
                <th style={{ padding: '16px 24px' }}>INVOICE</th>
              </tr>
            </thead>
            <tbody>
              {[
                { date: 'May 1, 2026', amount: '$499.00', status: 'Paid' },
                { date: 'Apr 1, 2026', amount: '$499.00', status: 'Paid' },
                { date: 'Mar 1, 2026', amount: '$499.00', status: 'Paid' },
              ].map((inv, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '16px 24px', fontWeight: 600 }}>{inv.date}</td>
                  <td style={{ padding: '16px 24px', fontWeight: 800 }}>{inv.amount}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ color: 'var(--success)', background: 'rgba(99, 102, 241, 0.1)', padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 800 }}>
                      {inv.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <a href="#" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Download PDF</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Payment method */}
        <h3 className="text-h3" style={{ marginTop: 32, marginBottom: 16 }}>Payment method</h3>
        <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 28, borderRadius: 4, border: '1px solid var(--border)', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', flexShrink: 0 }}>VISA</div>
          <span style={{ fontSize: 13, color: 'var(--text)', flex: 1 }}>Visa ending in 4242 · expires 08/27</span>
          <button onClick={() => window.open('#', '_blank')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 13, fontWeight: 700, cursor: 'pointer', minHeight: 'auto', minWidth: 'auto' }}>
            Update card →
          </button>
        </div>
      </div>
    </div>
  );
};

export default Billing;
