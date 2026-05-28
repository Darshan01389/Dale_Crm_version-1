import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';
import QuotaIndicator from '../components/QuotaIndicator';

const Billing = () => {
  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const { show: showToast } = useToast();

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  
  // Custom Plan State
  const [customReqs, setCustomReqs] = useState(50);
  const [customVoice, setCustomVoice] = useState(true);
  const [customSources, setCustomSources] = useState(true);

  // UPI Checkout State
  const [showCheckout, setShowCheckout] = useState(false);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('voiceiq_token');
      const [planRes, statusRes, invRes] = await Promise.all([
        axios.get('/api/billing/plans', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/billing/status', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/billing/invoices', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setPlans(planRes.data);
      setSubscription(statusRes.data);
      setInvoices(invRes.data);
    } catch (err) {
      console.error(err);
      showToast({ type: 'error', message: 'Failed to fetch billing details' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const calculateCustomPrice = () => {
    let price = 50; // base
    price += (customReqs / 10) * 15; // $15 per 10 requests/min
    if (customVoice) price += 50;
    if (customSources) price += 50;
    return price;
  };

  const handleSubscribe = async () => {
    if (!selectedPlan) return;
    try {
      const token = localStorage.getItem('voiceiq_token');
      const payload = {
        plan_id: selectedPlan.id,
      };
      
      if (selectedPlan.name === 'Custom') {
        payload.custom_price = calculateCustomPrice();
        payload.custom_requests_per_minute = customReqs;
        payload.custom_voice = customVoice;
        payload.custom_lead_sources = customSources;
      }

      await axios.post('/api/billing/subscribe', payload, { headers: { Authorization: `Bearer ${token}` } });
      showToast({ type: 'success', message: 'Successfully Subscribed!' });
      setShowCheckout(false);
      setShowUpgradeModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      showToast({ type: 'error', message: 'Subscription failed' });
    }
  };

  const generateInvoicePDF = (invoice) => {
    // Generate a simple blob text for demo downloading
    const content = `INVOICE #${invoice.id}\nDate: ${new Date(invoice.billing_date).toLocaleDateString()}\nStatus: ${invoice.status}\nAmount Due: $${invoice.amount_due.toFixed(2)}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice_${invoice.id.substring(0,8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateOverageInvoice = async () => {
    try {
      const token = localStorage.getItem('voiceiq_token');
      await axios.post('/api/billing/generate-invoice', {}, { headers: { Authorization: `Bearer ${token}` } });
      showToast({ type: 'success', message: 'Invoice generated successfully' });
      fetchData();
    } catch (err) {
      showToast({ type: 'error', message: 'Failed to generate invoice' });
    }
  };

  if (loading) return <div style={{ padding: 40 }}>Loading billing details...</div>;

  const currentPlanName = subscription?.plan?.name || "None";
  const limit = subscription?.custom_requests_per_minute 
    ? (subscription.custom_requests_per_minute * 1000) // Convert per-min to rough monthly limit for demo 
    : (subscription?.plan?.max_requests_per_minute * 1000) || 10000;
  
  const usage = subscription?.ai_requests_used || 0;
  const resetDate = new Date(subscription?.current_period_end).toLocaleDateString();

  return (
    <div style={{ padding: 'var(--mobile-padding, 40px)', background: 'var(--bg)', height: '100%', overflowY: 'auto' }} className="custom-scroll animate-in">
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1 className="text-h1" style={{ marginBottom: 8 }}>Billing & Subscription</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 32, fontSize: 16 }}>Manage your AI limits and invoices.</p>

        {/* Quota Warning Banner */}
        <QuotaIndicator label="AI Processing Credits" current={usage} total={limit} resetDate={resetDate} />

        <div className="card" style={{ padding: 32, marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <h2 style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>{currentPlanName} Plan</h2>
              <span style={{ background: 'var(--owner-accent)', color: 'white', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800 }}>ACTIVE</span>
            </div>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 14 }}>
              ${subscription?.custom_price ?? subscription?.plan?.base_price ?? 0}/month · Next billing date: {resetDate}
            </p>
          </div>
          <button className="btn-primary" style={{ padding: '12px 24px' }} onClick={() => setShowUpgradeModal(true)}>Upgrade / Manage Plan</button>
        </div>

        <h3 className="text-h3" style={{ marginBottom: 20 }}>Usage Quotas</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 40 }}>
          {[
            { label: 'AI Processing Credits', used: usage, total: limit, pct: (usage/limit)*100 },
          ].map(quota => (
            <div key={quota.label} className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontWeight: 700 }}>{quota.label}</span>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{quota.used} / {quota.total}</span>
              </div>
              <div style={{ height: 8, background: 'var(--bg-subtle)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ 
                  width: `${Math.min(quota.pct, 100)}%`, 
                  height: '100%', 
                  background: quota.pct > 90 ? 'var(--danger)' : quota.pct > 75 ? 'var(--owner-accent)' : 'var(--primary)',
                  borderRadius: 4
                }} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 className="text-h3" style={{ margin: 0 }}>Recent Invoices</h3>
          <button onClick={generateOverageInvoice} className="btn-secondary" style={{ fontSize: 13, padding: '6px 12px' }}>Simulate Month End</button>
        </div>
        
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
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>No invoices yet.</td>
                </tr>
              ) : invoices.map((inv, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '16px 24px', fontWeight: 600 }}>{new Date(inv.billing_date).toLocaleDateString()}</td>
                  <td style={{ padding: '16px 24px', fontWeight: 800 }}>${inv.amount_due.toFixed(2)}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ 
                      color: inv.status === 'paid' ? 'var(--success)' : 'var(--danger)', 
                      background: inv.status === 'paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                      padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 800 
                    }}>
                      {inv.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <button onClick={() => generateInvoicePDF(inv)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>Download PDF</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="card glass" style={{ width: 800, maxHeight: '90vh', overflowY: 'auto', padding: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 className="text-h2" style={{ margin: 0 }}>Select a Subscription</h2>
              <button onClick={() => setShowUpgradeModal(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--text)' }}>×</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              {/* Preset Plans */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {plans.filter(p => p.name !== 'Custom').map(plan => (
                  <div 
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan)}
                    style={{ 
                      padding: 24, borderRadius: 12, border: selectedPlan?.id === plan.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                      background: selectedPlan?.id === plan.id ? 'var(--primary-glow)' : 'var(--bg-surface)',
                      cursor: 'pointer'
                    }}
                  >
                    <h3 style={{ margin: '0 0 8px', fontSize: 20 }}>{plan.name}</h3>
                    <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>${plan.base_price}/mo</div>
                    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: 'var(--text-muted)' }}>
                      <li>{plan.max_requests_per_minute} AI Requests / minute</li>
                      <li>{plan.has_voice_transcription ? "Full Voice Transcription" : "Limited Voice Transcription"}</li>
                      <li>{plan.has_advanced_lead_sources ? "Advanced Integrations" : "Basic Webhooks"}</li>
                    </ul>
                  </div>
                ))}
              </div>

              {/* Custom Plan */}
              {plans.filter(p => p.name === 'Custom').map(plan => (
                <div 
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  style={{ 
                    padding: 24, borderRadius: 12, border: selectedPlan?.id === plan.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                    background: selectedPlan?.id === plan.id ? 'var(--primary-glow)' : 'var(--bg-surface)',
                    cursor: 'pointer'
                  }}
                >
                  <h3 style={{ margin: '0 0 8px', fontSize: 20 }}>Enterprise Custom</h3>
                  <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>${calculateCustomPrice()}/mo</div>
                  
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                      <span>AI Requests / Min</span>
                      <span>{customReqs}</span>
                    </label>
                    <input 
                      type="range" min="10" max="200" step="10" 
                      value={customReqs} 
                      onChange={(e) => setCustomReqs(Number(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <input type="checkbox" checked={customVoice} onChange={e => setCustomVoice(e.target.checked)} />
                    <span style={{ fontSize: 14, fontWeight: 600 }}>Enable Voice Transcription Analytics (+$50)</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input type="checkbox" checked={customSources} onChange={e => setCustomSources(e.target.checked)} />
                    <span style={{ fontSize: 14, fontWeight: 600 }}>Enable Advanced Lead Source Sync (+$50)</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                className="btn-primary" 
                style={{ padding: '12px 32px' }} 
                disabled={!selectedPlan}
                onClick={() => setShowCheckout(true)}
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal with UPI QR */}
      {showCheckout && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card glass" style={{ width: 400, padding: 32, textAlign: 'center' }}>
            <h2 className="text-h2" style={{ margin: '0 0 8px' }}>Scan to Pay</h2>
            <p className="text-muted" style={{ marginBottom: 24 }}>Amount Due: ${selectedPlan?.name === 'Custom' ? calculateCustomPrice() : selectedPlan?.base_price}</p>
            
            <div style={{ background: 'white', padding: 16, borderRadius: 16, marginBottom: 24, display: 'inline-block' }}>
              <img src="/qr.png" alt="UPI QR Code" style={{ width: 250, height: 250, display: 'block', marginBottom: 16 }} />
              <div style={{ fontSize: 14, fontWeight: 800, color: '#333' }}>UPI ID: 07darshann@oksbi</div>
            </div>

            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <button className="btn-secondary" onClick={() => setShowCheckout(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSubscribe}>I have paid</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;
