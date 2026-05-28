import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../contexts/ToastContext';

const JoinCodeWidget = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState(null); // 'success' or 'already' or 'error'
  const [showScanner, setShowScanner] = useState(false);
  const { show: showToast } = useToast();

  const handleJoin = async (enteredCode) => {
    const codeToSubmit = enteredCode || code;
    if (!codeToSubmit.trim()) return;
    setLoading(true);
    setMessage('');
    setStatus(null);
    try {
      const token = localStorage.getItem('voiceiq_token');
      const res = await axios.post('/api/users/join', { code: codeToSubmit.trim() }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatus(res.data.status);
      setMessage(res.data.message);
      if (res.data.status === 'success') {
        showToast({ type: 'success', message: res.data.message });
      } else {
        showToast({ type: 'info', message: res.data.message });
      }
      setCode('');
    } catch (err) {
      console.error(err);
      setStatus('error');
      const errMsg = err.response?.data?.detail || 'Invalid Invite or Join Code.';
      setMessage(errMsg);
      showToast({ type: 'error', message: errMsg });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let scanner = null;
    if (showScanner) {
      const initScanner = () => {
        if (!window.Html5QrcodeScanner) {
          console.error("Html5QrcodeScanner not loaded yet");
          return;
        }
        scanner = new window.Html5QrcodeScanner("qr-reader", {
          fps: 10,
          qrbox: { width: 220, height: 220 }
        }, false);
        
        scanner.render((decodedText) => {
          let extractedCode = decodedText;
          if (decodedText.includes('code=')) {
            const parts = decodedText.split('code=');
            if (parts.length > 1) {
              extractedCode = parts[1].split('&')[0];
            }
          }
          showToast({ type: 'success', message: 'QR Code Scanned successfully!' });
          setCode(extractedCode);
          setShowScanner(false);
          // Auto submit
          handleJoin(extractedCode);
        }, (err) => {
          // Silent scan errors
        });
      };

      if (!window.Html5QrcodeScanner) {
        const script = document.createElement('script');
        script.src = "https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js";
        script.async = true;
        script.onload = initScanner;
        document.body.appendChild(script);
      } else {
        // Wait a tick for the div container to render
        setTimeout(initScanner, 100);
      }
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(e => console.error("Error clearing scanner on unmount:", e));
      }
    };
  }, [showScanner]);

  return (
    <div className="card glass animate-in" style={{ padding: '20px 24px', borderRadius: 16, border: '1px dashed var(--primary)', marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <h4 style={{ fontSize: 14, fontWeight: 800, margin: 0, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
            🔗 Join Organisation or Squad
          </h4>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Got an invitation code? Enter your 6-digit code or scan the QR code to join your company workspace or squad.
          </p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); handleJoin(); }} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', maxWidth: 460, width: '100%' }}>
          <input 
            className="input" 
            placeholder="Enter 6-digit code..." 
            value={code} 
            onChange={e => setCode(e.target.value)}
            style={{ flex: 1, height: 38, padding: '0 12px', fontSize: 13, borderRadius: 8 }}
          />
          <button 
            type="button"
            onClick={() => setShowScanner(true)}
            className="btn-secondary"
            style={{ height: 38, padding: '0 12px', borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, minHeight: 'auto', minWidth: 'auto', border: '1px solid var(--border)' }}
          >
            📷 Scan QR
          </button>
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
            style={{ height: 38, padding: '0 16px', borderRadius: 8, fontSize: 13, minHeight: 'auto', minWidth: 'auto' }}
          >
            {loading ? 'Joining...' : 'Join Workspace'}
          </button>
        </form>
      </div>

      {message && (
        <div style={{ 
          marginTop: 16, padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600,
          background: status === 'success' ? 'rgba(16, 185, 129, 0.08)' : status === 'already' ? 'rgba(59, 130, 246, 0.08)' : 'rgba(239, 68, 68, 0.08)',
          border: `1px solid ${status === 'success' ? 'rgba(16, 185, 129, 0.2)' : status === 'already' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
          color: status === 'success' ? 'var(--success)' : status === 'already' ? 'var(--info)' : 'var(--danger)',
          display: 'flex', alignItems: 'center', gap: 8
        }}>
          <span>{status === 'success' ? '🎉' : status === 'already' ? 'ℹ' : '⚠'}</span>
          {message}
        </div>
      )}

      {/* Camera Scanner Modal Overlay */}
      {showScanner && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(10px)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="card glass" style={{
            width: '90%', maxWidth: 420, padding: 24, borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.1)', background: 'var(--bg-surface)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)', position: 'relative'
          }}>
            <button 
              onClick={() => setShowScanner(false)}
              style={{
                position: 'absolute', top: 16, right: 16, border: 'none', background: 'var(--bg-subtle)',
                color: 'var(--text)', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13
              }}
            >
              ✕
            </button>
            <h3 style={{ fontSize: 16, fontWeight: 900, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
              📷 Scan Invitation QR Code
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 20px', lineHeight: 1.4 }}>
              Allow camera permission when prompted. Center the QR code in the scanning box.
            </p>
            
            <div id="qr-reader" style={{ 
              width: '100%', 
              borderRadius: 12, 
              overflow: 'hidden', 
              border: '1px solid var(--border)',
              background: '#090D16'
            }} />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

const PERIODS = [
  { id: '7 Days', label: '7 Days' },
  { id: '30 Days', label: '30 Days' },
  { id: '3 Months', label: '3 Months' },
  { id: '12 Months', label: '12 Months' },
];

const RepPulse = () => {
  const { profile } = useUser();
  const [period, setPeriod] = useState('30 Days');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPulse();
  }, [period]);

  const fetchPulse = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('voiceiq_token');
      const res = await axios.get(`/api/analytics/dashboard?date_range=${period}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
    } catch (err) {
      console.error("Error fetching pulse data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: 40 }}>Loading your Pulse...</div>;
  if (!data) return <div style={{ padding: 40 }}>Error loading pulse data.</div>;

  const stats = [
    { label: 'Outreach', value: data.activities_last_7_days, sub: 'Calls & Messages', accent: 'var(--primary)' },
    { label: 'Deals Open', value: data.deals_open, sub: 'Active Pipeline', accent: 'var(--owner-accent)' },
    { label: 'Revenue Won', value: `₹${(data.revenue_won / 100000).toFixed(1)}L`, sub: 'Actual Closed', accent: 'var(--rep-accent)' },
    { label: 'Win Rate', value: `${data.win_rate_pct || 0}%`, sub: 'Conversion Performance', accent: 'var(--primary)' },
  ];

  return (
    <div className="custom-scroll animate-in rep-pulse-container" style={{ height: '100%', overflowY: 'auto', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40, flexWrap: 'wrap', gap: 24 }}>
          <div>
            <h1 className="text-h1" style={{ margin: 0 }}>My Pulse</h1>
            <p style={{ fontSize: 16, color: 'var(--text-muted)', marginTop: 8, fontWeight: 500 }}>Track your sales velocity and personal targets</p>
          </div>
          <div className="period-selector" style={{ display: 'flex', background: 'var(--bg-subtle)', padding: 6, borderRadius: 16, border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
            {PERIODS.map(p => (
              <button 
                key={p.id}
                className="period-btn"
                onClick={() => setPeriod(p.id)}
                style={{
                  padding: '10px 20px', borderRadius: 12, fontSize: 13, fontWeight: 700,
                  background: period === p.id ? 'var(--primary)' : 'transparent',
                  color: period === p.id ? 'white' : 'var(--text-muted)',
                  border: 'none', cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>



        {/* Join Organisation / Team Widget */}
        <JoinCodeWidget />

        {/* Top KPIs */}
        <div className="top-kpis-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, marginBottom: 40 }}>
          {stats.map(k => (
            <div key={k.label} className="card pulse-card" style={{ padding: 28 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: 20 }}>{k.label.toUpperCase()}</div>
              <div className="pulse-stat-val" style={{ fontSize: 36, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em' }}>{k.value}</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8, fontWeight: 500 }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Personal Goals Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 32, marginBottom: 40 }} className="middle-grid">
          <div className="card" style={{ padding: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              <h3 className="text-h3" style={{ margin: 0 }}>Pipeline Funnel</h3>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--success)', background: 'rgba(99, 102, 241, 0.1)', padding: '4px 10px', borderRadius: 8 }}>LIVE STATUS</div>
            </div>
            <div style={{ height: 240, display: 'flex', alignItems: 'flex-end', gap: 12 }}>
              {data.funnel.map((f, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
                  <div style={{ 
                    width: '100%', 
                    height: `${Math.min(f.open_deals * 20 + 20, 240)}px`, 
                    background: ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#EF4444'][i % 6], 
                    opacity: 0.8, 
                    borderRadius: '8px 8px 4px 4px',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-micro)', textTransform: 'uppercase', textAlign: 'center' }}>{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card glass" style={{ padding: 32, background: 'var(--text)', border: 'none', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 100%)', pointerEvents: 'none' }} />
            <h3 className="text-h3" style={{ margin: '0 0 32px', color: 'white', position: 'relative' }}>AI Insights</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, position: 'relative' }}>
              <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>
                <div style={{ fontWeight: 800, color: '#6366F1', marginBottom: 4 }}>Sentiment Trend</div>
                Positive sentiment has increased by 12% in your recent leads.
              </div>
              <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>
                <div style={{ fontWeight: 800, color: '#6366F1', marginBottom: 4 }}>Conversion Signal</div>
                Leads with AI scores &gt; 80 are converting 3x faster this month.
              </div>
              <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>
                <div style={{ fontWeight: 800, color: '#6366F1', marginBottom: 4 }}>Activity Peak</div>
                Your highest engagement occurs between 10 AM and 12 PM.
              </div>
            </div>
          </div>
        </div>

        {/* Win Probability Widget */}
        <div className="card forecast-widget" style={{ padding: 32, border: '1px solid rgba(99, 102, 241, 0.2)', background: 'rgba(99, 102, 241, 0.05)' }}>
          <div className="forecast-inner" style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
            <div style={{ 
              width: 80, height: 80, borderRadius: 20, flexShrink: 0,
              background: 'white', border: '1px solid rgba(99, 102, 241, 0.2)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              fontSize: 22, fontWeight: 900, color: '#4338CA',
              boxShadow: 'var(--shadow-md)',
              transform: 'rotate(-3deg)'
            }}>
              {data.model_accuracy_pct || 85}%
            </div>
            <div style={{ flex: 1 }}>
              <div className="forecast-header" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ padding: 6, background: 'white', borderRadius: 8, boxShadow: 'var(--shadow-sm)' }}>
                  <svg width="16" height="16" fill="var(--success)" viewBox="0 0 24 24"><path d="M12 2L3 7v10l9 5 9-5V7L12 2z"/></svg>
                </div>
                <h4 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text)' }}>AI Forecast Intelligence</h4>
              </div>
              <p style={{ fontSize: 15, color: 'var(--text-muted)', margin: 0, fontWeight: 500, lineHeight: 1.6 }}>
                Your current lead quality average is <span style={{ color: 'var(--success)', fontWeight: 700 }}>{data.leads_avg_ai_score?.toFixed(1) || 0}</span>. 
                AI predicts a win rate of {data.win_rate_pct || 0}% based on your current pipeline velocity.
              </p>
            </div>
          </div>
        </div>

      </div>
      <style>{`
        .rep-pulse-container { padding: 40px; }
        @media (max-width: 768px) {
          .rep-pulse-container { padding: 16px !important; }
          .middle-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
          .top-kpis-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
          .pulse-card { padding: 20px !important; }
          .pulse-stat-val { font-size: 28px !important; }
          .period-selector { flex-wrap: wrap; justify-content: center; width: 100%; gap: 4px; }
          .period-btn { padding: 6px 10px !important; font-size: 11px !important; flex: 1; min-width: 70px; }
          .forecast-widget { padding: 20px !important; }
          .forecast-inner { flex-direction: column; text-align: center; gap: 16px !important; }
          .forecast-header { justify-content: center; }
        }
      `}</style>
    </div>
  );
};

export default RepPulse;
