import React, { useState } from 'react';

const MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
const FORECAST = [22, 28, 31, 35, 42, 38, 45, 51, 48, 55, 62, 68];
const ACTUAL =   [20, 26, 29, 32, 38, null, null, null, null, null, null, null];
const BEST_CASE = FORECAST.map(v => v * 1.15);
const WORST_CASE = FORECAST.map(v => v * 0.85);

const TOP_DEALS = [
  { id: 1, name: 'Acme Corp', rep: 'Ravi Kumar', value: '₹18.0L', close: 'Jun 15', conf: 'HIGH_INTENT', risk: 'standard' },
  { id: 2, name: 'Globex Ltd', rep: 'Priya Sharma', value: '₹12.5L', close: 'Jul 01', conf: 'HIGH_INTENT', risk: 'standard' },
  { id: 3, name: 'Initech Pvt', rep: 'Arun Mehta', value: '₹7.2L', close: 'Jun 30', conf: 'STANDARD', risk: 'standard' },
  { id: 4, name: 'Umbrella Co', rep: 'Deepa Nair', value: '₹4.8L', close: 'Aug 15', conf: 'STANDARD', risk: 'risk' },
];

const confStyle = {
  HIGH_INTENT: { bg: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', border: 'var(--success)' },
  STANDARD: { bg: 'var(--bg-subtle)', color: 'var(--text-muted)', border: 'transparent' },
  RISK: { bg: 'rgba(217, 119, 6, 0.1)', color: 'var(--owner-accent)', border: 'var(--owner-accent)' },
};

const Forecast = () => {
  const [period, setPeriod] = useState('FY 2025-26');
  const maxVal = Math.max(...BEST_CASE);

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--bg)', padding: 40 }} className="custom-scroll animate-in">
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
          <div>
            <h1 className="text-h1" style={{ margin: 0 }}>Forecast</h1>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>AI-driven revenue projections with confidence intervals</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['FY 2025-26', 'FY 2024-25'].map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                border: '1px solid var(--border)', cursor: 'pointer',
                background: period === p ? 'var(--primary)' : 'var(--bg-surface)',
                color: period === p ? 'white' : 'var(--text-muted)',
              }}>{p}</button>
            ))}
          </div>
        </div>

        {/* AI Confidence Band & KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, marginBottom: 40 }}>
          {/* Chart with Confidence Bands */}
          <div className="card" style={{ padding: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
              <h3 className="text-h3" style={{ margin: 0 }}>Revenue Projection</h3>
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, height: 12, background: 'var(--primary)', borderRadius: 3 }} /> Expected</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, height: 12, background: 'rgba(31, 78, 121, 0.2)', border: '1px solid var(--primary)', borderRadius: 3 }} /> Confidence Band</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, height: 12, background: 'var(--success)', borderRadius: 3 }} /> Actual</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 240, position: 'relative' }}>
              {MONTHS.map((m, i) => (
                <div key={m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%', position: 'relative' }}>
                  <div style={{ width: '100%', flex: 1, position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                    
                    {/* Confidence Band (Background) */}
                    <div style={{ 
                      position: 'absolute', bottom: 0, 
                      width: '80%', height: `${(BEST_CASE[i] / maxVal) * 100}%`, 
                      background: 'rgba(31, 78, 121, 0.1)', borderTop: '1px dashed var(--primary)',
                      borderRadius: '4px 4px 0 0', opacity: ACTUAL[i] ? 0.3 : 1
                    }} title={`Best Case: ₹${BEST_CASE[i].toFixed(1)}L`} />

                    {/* Expected (Mid) */}
                    <div style={{ 
                      position: 'absolute', bottom: 0, 
                      width: '60%', height: `${(FORECAST[i] / maxVal) * 100}%`, 
                      background: 'var(--primary)', opacity: ACTUAL[i] ? 0.4 : 0.8,
                      borderRadius: '4px 4px 0 0'
                    }} title={`Expected: ₹${FORECAST[i]}L`} />
                    
                    {/* Actual (Foreground) */}
                    {ACTUAL[i] !== null && (
                      <div style={{ 
                        position: 'absolute', bottom: 0, 
                        width: '60%', height: `${(ACTUAL[i] / maxVal) * 100}%`, 
                        background: 'var(--success)', borderRadius: '4px 4px 0 0',
                        boxShadow: '0 0 10px rgba(16, 185, 129, 0.4)'
                      }} title={`Actual: ₹${ACTUAL[i]}L`} />
                    )}

                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>{m}</span>
                </div>
              ))}
            </div>
          </div>

          {/* KPIs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              { label: 'Expected Forecast', value: '₹68.5L', sub: 'Based on current AI signals', color: 'var(--primary)' },
              { label: 'Best Case', value: '₹78.8L', sub: 'If 80% of pipeline closes', color: 'var(--success)' },
              { label: 'Worst Case', value: '₹58.2L', sub: 'If at-risk deals fall through', color: 'var(--owner-accent)' },
            ].map(k => (
              <div key={k.label} className="card" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: 8 }}>{k.label.toUpperCase()}</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: k.color, marginBottom: 4 }}>{k.value}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{k.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Contributing Deals Table */}
        <div className="card" style={{ padding: 32 }}>
          <h3 className="text-h3" style={{ marginBottom: 24, margin: 0 }}>Top Contributing Deals</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-subtle)' }}>
                {['Prospect', 'Rep', 'Value', 'Predicted Close', 'AI Confidence'].map(h => (
                  <th key={h} style={{ padding: '0 16px 16px 0', textAlign: 'left', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TOP_DEALS.map(d => {
                const confType = d.risk === 'risk' ? 'RISK' : d.conf;
                const style = confStyle[confType];
                const label = d.risk === 'risk' ? 'AT RISK' : d.conf === 'HIGH_INTENT' ? 'HIGH' : 'MEDIUM';

                return (
                  <tr key={d.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '20px 16px 20px 0', fontWeight: 700, color: 'var(--text)', fontSize: 14 }}>{d.name}</td>
                    <td style={{ padding: '20px 16px 20px 0', color: 'var(--text-muted)', fontSize: 14, fontWeight: 500 }}>{d.rep}</td>
                    <td style={{ padding: '20px 16px 20px 0', fontWeight: 800, color: 'var(--text)', fontSize: 14 }}>{d.value}</td>
                    <td style={{ padding: '20px 16px 20px 0', color: 'var(--text-muted)', fontSize: 14, fontWeight: 500 }}>{d.close}</td>
                    <td style={{ padding: '20px 0' }}>
                      <span style={{ 
                        fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 6, 
                        background: style.bg, color: style.color, border: `1px solid ${style.border}`,
                        letterSpacing: '0.05em'
                      }}>
                        {label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default Forecast;
