import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
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
  const [gateway, setGateway] = useState(null);
  const [initiatingPayment, setInitiatingPayment] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('idle'); // 'idle' | 'pending' | 'success' | 'failed'
  const [upiId, setUpiId] = useState('');

  const fetchData = async () => {
    try {
      const token = sessionStorage.getItem('voiceiq_token') || localStorage.getItem('voiceiq_token');
      const [planRes, statusRes, invRes, upiRes] = await Promise.all([
        axios.get('/api/billing/plans', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/billing/status', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/billing/invoices', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/billing/upi-config', { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { upi_id: '' } }))
      ]);
      setPlans(planRes.data);
      setSubscription(statusRes.data);
      setInvoices(invRes.data);
      setUpiId(upiRes?.data?.upi_id || '');
    } catch (err) {
      console.error(err);
      showToast({ type: 'error', message: 'Failed to fetch billing details' });
    } finally {
      setLoading(false);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  useEffect(() => {
    fetchData();

    // Check for Stripe mock checkout return
    const params = new URLSearchParams(window.location.search);
    const statusParam = params.get('status');
    const sessionId = params.get('session_id');
    if (statusParam === 'mock_stripe' && sessionId) {
      setShowCheckout(true);
      setGateway('stripe');
      setPaymentDetails({
        stripe_session_id: sessionId,
        gateway: 'stripe'
      });
      setPaymentStatus('pending');
    }
  }, []);

  // Keep a ref so we can poll immediately on demand
  const pollRef = useRef(null);

  const checkPaymentStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('voiceiq_token');
      const res = await axios.get('/api/billing/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === 'active') {
        // Stop polling
        if (pollRef.current) clearInterval(pollRef.current);
        setPaymentStatus('success');
        showToast({ type: 'success', message: '🎉 Subscription activated!' });
        if (window.location.search) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        setTimeout(() => {
          setShowCheckout(false);
          setShowUpgradeModal(false);
          setPaymentStatus('idle');
          setPaymentDetails(null);
          setGateway(null);
          fetchData();
        }, 2500);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Polling payment status failed', err);
      return false;
    }
  }, []);

  // Polling for payment status to automatically update
  useEffect(() => {
    if (paymentStatus === 'pending') {
      // Kick off polling every 2s
      pollRef.current = setInterval(checkPaymentStatus, 2000);
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [paymentStatus, checkPaymentStatus]);

  const calculateCustomPrice = () => {
    let price = 50; // base
    price += (customReqs / 10) * 15; // $15 per 10 requests/min
    if (customVoice) price += 50;
    if (customSources) price += 50;
    return price;
  };

  const initiateCheckout = async (chosenGateway) => {
    if (!selectedPlan) return;
    setInitiatingPayment(true);
    setGateway(chosenGateway);
    try {
      const token = localStorage.getItem('voiceiq_token');
      const payload = {
        plan_id: selectedPlan.id,
        gateway: chosenGateway
      };
      
      if (selectedPlan.name === 'Custom') {
        payload.custom_price = calculateCustomPrice();
        payload.custom_requests_per_minute = customReqs;
        payload.custom_voice = customVoice;
        payload.custom_lead_sources = customSources;
      }

      const res = await axios.post('/api/billing/subscribe', payload, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setPaymentDetails(res.data);
      setPaymentStatus('pending');
      
      if (chosenGateway === 'stripe') {
        // Redirect to Stripe checkout
        window.location.href = res.data.stripe_checkout_url;
      } else if (chosenGateway === 'razorpay') {
        // Open Razorpay SDK if not mock key
        if (res.data.razorpay_key_id !== 'rzp_test_mock_123') {
          const success = await loadRazorpayScript();
          if (success) {
            const options = {
              key: res.data.razorpay_key_id,
              amount: res.data.amount * 85 * 100, // paise (exchange rate 85)
              currency: "INR",
              name: "DaleiQ Intelligence",
              description: `${selectedPlan.name} Subscription`,
              order_id: res.data.razorpay_order_id,
              handler: function (response) {
                showToast({ type: 'success', message: 'Payment authorized!' });
              },
              theme: { color: "#6366f1" }
            };
            const rzp = new window.Razorpay(options);
            rzp.open();
          } else {
            showToast({ type: 'error', message: 'Failed to load Razorpay SDK.' });
          }
        }
      }
    } catch (err) {
      console.error(err);
      showToast({ type: 'error', message: 'Payment initiation failed' });
      setPaymentStatus('idle');
      setGateway(null);
    } finally {
      setInitiatingPayment(false);
    }
  };

  const simulatePayment = async () => {
    if (!paymentDetails) {
      showToast({ type: 'error', message: 'Payment details missing. Please restart checkout.' });
      return;
    }
    // gateway and order_id come directly from the API response
    const gwName = paymentDetails.gateway;
    const orderId = gwName === 'stripe'
      ? paymentDetails.stripe_session_id
      : paymentDetails.razorpay_order_id;

    if (!gwName || !orderId) {
      showToast({ type: 'error', message: 'Invalid payment details. Please restart checkout.' });
      console.error('paymentDetails:', paymentDetails);
      return;
    }

    try {
      await axios.post('/api/billing/webhook/simulate', {
        gateway: gwName,
        gateway_order_id: orderId
      });
      showToast({ type: 'success', message: 'Payment verified! Activating subscription...' });
      // Immediately poll instead of waiting for next interval
      await checkPaymentStatus();
    } catch (err) {
      console.error('Simulate payment error:', err);
      const msg = err.response?.data?.detail || 'Failed to verify payment';
      showToast({ type: 'error', message: msg });
    }
  };

  const generateInvoicePDF = async (invoice) => {
    try {
      const token = sessionStorage.getItem('voiceiq_token') || localStorage.getItem('voiceiq_token');
      const response = await axios.get(`/api/billing/invoices/${invoice.id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice_${invoice.id.substring(0, 8)}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      showToast({ type: 'error', message: 'Failed to download invoice PDF' });
    }
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

  const isProduction = import.meta.env.VITE_APP_ENV === 'production';
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

      {/* Checkout Modal with Stripe & Razorpay Integrations */}
      {showCheckout && (
        <div style={{ 
          position: 'fixed', 
          top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(15, 23, 42, 0.85)', 
          backdropFilter: 'blur(8px)',
          zIndex: 110, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: 20
        }}>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
            @keyframes pulse {
              0%, 100% { opacity: 0.5; }
              50% { opacity: 1; }
            }
            .spinner-icon {
              animation: spin 1s linear infinite;
              border: 3px solid rgba(255,255,255,0.1);
              border-top-color: var(--primary);
              border-radius: 50%;
              width: 50px;
              height: 50px;
              margin: 0 auto 20px;
            }
            .pulse-text {
              animation: pulse 1.5s ease-in-out infinite;
            }
            .gateway-btn {
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              background: var(--bg-surface);
              border: 1px solid var(--border-subtle);
              border-radius: 16px;
              padding: 20px;
              width: 100%;
              text-align: left;
              cursor: pointer;
              color: var(--text);
              display: flex;
              align-items: center;
              gap: 16px;
            }
            .gateway-btn:hover {
              transform: translateY(-2px);
              border-color: var(--primary);
              background: var(--primary-glow);
            }
          `}</style>

          <div className="card glass" style={{ 
            width: 440, 
            padding: 32, 
            borderRadius: 24,
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            textAlign: 'center',
            position: 'relative'
          }}>
            
            {/* Close Button */}
            {paymentStatus === 'idle' && !initiatingPayment && (
              <button 
                onClick={() => {
                  setShowCheckout(false);
                  setGateway(null);
                  setPaymentDetails(null);
                }} 
                style={{ 
                  position: 'absolute', 
                  top: 24, 
                  right: 24, 
                  background: 'none', 
                  border: 'none', 
                  fontSize: 20, 
                  cursor: 'pointer', 
                  color: 'var(--text-muted)' 
                }}
              >
                ×
              </button>
            )}

            {paymentStatus === 'idle' && (
              <>
                <h2 className="text-h2" style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 800 }}>Checkout</h2>
                <p className="text-muted" style={{ marginBottom: 24, fontSize: 14 }}>Choose your preferred payment method.</p>
                
                {/* Plan Summary Card */}
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.03)', 
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 16, 
                  padding: 16, 
                  marginBottom: 24,
                  textAlign: 'left'
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Selected Plan</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <span style={{ fontWeight: 800, fontSize: 18 }}>{selectedPlan?.name}</span>
                    <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary)' }}>
                      ${selectedPlan?.name === 'Custom' ? calculateCustomPrice() : selectedPlan?.base_price}
                    </span>
                  </div>
                </div>

                {initiatingPayment ? (
                  <div style={{ padding: '40px 0' }}>
                    <div className="spinner-icon" />
                    <p style={{ fontWeight: 600 }}>Connecting to payment gateway...</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <button className="gateway-btn" onClick={() => initiateCheckout('stripe')}>
                      <div style={{ 
                        background: 'linear-gradient(135deg, #635bff, #807aff)', 
                        width: 44, height: 44, borderRadius: 12, 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        color: 'white', fontWeight: 900, fontSize: 18
                      }}>
                        S
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>Stripe Checkout</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Credit Cards & Global payments</div>
                      </div>
                    </button>

                    <button className="gateway-btn" onClick={() => initiateCheckout('razorpay')}>
                      <div style={{ 
                        background: 'linear-gradient(135deg, #1f72e7, #00d2ff)', 
                        width: 44, height: 44, borderRadius: 12, 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        color: 'white', fontWeight: 900, fontSize: 18
                      }}>
                        R
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>Razorpay (UPI / India)</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>UPI, GPay, Cards & Netbanking</div>
                      </div>
                    </button>
                  </div>
                )}
              </>
            )}

            {paymentStatus === 'pending' && (
              <>
                <div className="spinner-icon" />
                <h2 className="text-h2" style={{ margin: '0 0 8px', fontSize: 22 }}>Verify Payment</h2>
                <p className="text-muted pulse-text" style={{ marginBottom: 24, fontSize: 14, color: 'var(--primary)' }}>
                  Awaiting confirmation from {gateway === 'stripe' ? 'Stripe' : 'Razorpay'}...
                </p>

                {gateway === 'stripe' && (
                  <div style={{ marginBottom: 24 }}>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                      We opened the Stripe secure payment page in a new window. Once completed, your subscription will activate automatically.
                    </p>
                    {/* Sandbox Helper */}
                    {!isProduction && (!paymentDetails?.stripe_session_id || paymentDetails.stripe_session_id.startsWith('cs_mock_')) && (
                      <div style={{ 
                        background: 'rgba(239, 68, 68, 0.05)', 
                        border: '1px dashed rgba(239, 68, 68, 0.3)', 
                        borderRadius: 12, 
                        padding: 16,
                        marginBottom: 16
                      }}>
                        <div style={{ fontWeight: 800, color: 'var(--danger)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Sandbox Simulation Mode</div>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 12px' }}>
                          Stripe secret keys are not configured. Click below to simulate the webhook callback locally.
                        </p>
                        <button className="btn-primary" onClick={simulatePayment} style={{ width: '100%', padding: '10px' }}>
                          Simulate Stripe Webhook Succeeded
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {gateway === 'razorpay' && (() => {
                  const isProduction = import.meta.env.VITE_APP_ENV === 'production';
                  const planAmt = selectedPlan?.name === 'Custom' ? calculateCustomPrice() : selectedPlan?.base_price;
                  const amtINR = paymentDetails?.amount ? (paymentDetails.amount * 85).toFixed(2) : (planAmt * 85).toFixed(2);
                  const activeUpi = upiId || '07darshann@oksbi';
                  const upiLink = `upi://pay?pa=${encodeURIComponent(activeUpi)}&pn=DaleiQ%20Intelligence&am=${amtINR}&cu=INR&tn=${encodeURIComponent((selectedPlan?.name || 'Plan') + ' Subscription')}`;
                  const isMock = paymentDetails?.razorpay_key_id === 'rzp_test_mock_123' || !paymentDetails?.razorpay_key_id;

                  return (
                    <div style={{ marginBottom: 24 }}>
                      {/* Razorpay Live – user already sees the SDK popup, just show wait message */}
                      {!isMock ? (
                        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                          Please complete the payment in the Razorpay window. Your subscription will activate automatically.
                        </p>
                      ) : isProduction ? (
                        <p style={{ fontSize: 13, color: 'var(--danger)', fontWeight: 'bold' }}>
                          Razorpay gateway is not configured. Please contact organization administrator.
                        </p>
                      ) : (
                        /* ---- UPI Deep-Link QR (sandbox) ---- */
                        <div style={{ borderRadius: 16, padding: 4, marginBottom: 0 }}>
                          {/* Instruction */}
                          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>
                            📱 <strong>Scan with GPay / PhonePe / Paytm</strong> to pay ₹{amtINR}.<br/>
                            Amount is pre-filled and <strong>cannot be changed</strong>.
                          </p>

                          {/* Dynamic UPI QR */}
                          <div style={{
                            background: 'white',
                            padding: 16,
                            borderRadius: 16,
                            display: 'inline-block',
                            marginBottom: 12,
                            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                          }}>
                            <QRCodeSVG
                              value={upiLink}
                              size={200}
                              level="M"
                              includeMargin={false}
                              fgColor="#1a0040"
                            />
                          </div>

                          {/* Amount badge */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            marginBottom: 12
                          }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Pay exactly</span>
                            <span style={{
                              background: 'linear-gradient(135deg,#1f72e7,#00d2ff)',
                              color: 'white',
                              fontWeight: 900,
                              fontSize: 16,
                              padding: '4px 14px',
                              borderRadius: 20
                            }}>₹{amtINR}</span>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>to</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>{activeUpi}</span>
                          </div>

                          {/* Divider */}
                          <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '12px 0' }} />

                          {/* After paying, click to verify */}
                          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                            After completing payment in your UPI app, click below:
                          </p>
                          <button
                            className="btn-primary"
                            onClick={simulatePayment}
                            style={{ width: '100%', padding: '12px', fontSize: 14, fontWeight: 700 }}
                          >
                            ✓ I Have Paid — Verify &amp; Activate
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <button 
                  className="btn-secondary" 
                  style={{ width: '100%', padding: '12px' }}
                  onClick={() => {
                    setPaymentStatus('idle');
                    setPaymentDetails(null);
                    setGateway(null);
                    // Clear search params
                    if (window.location.search) {
                      window.history.replaceState({}, document.title, window.location.pathname);
                    }
                  }}
                >
                  Cancel & Go Back
                </button>
              </>
            )}

            {paymentStatus === 'success' && (
              <div style={{ padding: '24px 0' }}>
                <div style={{ 
                  width: 72, height: 72, borderRadius: '50%', 
                  background: 'rgba(16, 185, 129, 0.1)', 
                  color: 'var(--success)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  fontSize: 36, margin: '0 auto 20px',
                  boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)'
                }}>
                  ✓
                </div>
                <h2 className="text-h2" style={{ margin: '0 0 8px', fontSize: 24, color: 'var(--success)' }}>Payment Confirmed</h2>
                <p className="text-muted" style={{ fontSize: 14 }}>
                  Your subscription is now active. Enjoy your limits!
                </p>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;
