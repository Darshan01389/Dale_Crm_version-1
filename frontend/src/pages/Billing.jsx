import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../contexts/ToastContext';

export default function Billing() {
  const { profile } = useUser();
  const { show } = useToast() || { show: (cfg) => alert(cfg.message) };

  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [subStatus, setSubStatus] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [subscribing, setSubscribing] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState('stripe');
  const [generatingInvoice, setGeneratingInvoice] = useState(false);

  const fetchBillingData = async () => {
    setLoading(true);
    try {
      const [plansRes, statusRes, invoicesRes] = await Promise.all([
        api.get('/api/billing/plans').catch(() => ({ data: [] })),
        api.get('/api/billing/status').catch(() => ({ data: null })),
        api.get('/api/billing/invoices').catch(() => ({ data: [] }))
      ]);

      if (plansRes.data && plansRes.data.length > 0) {
        setPlans(plansRes.data);
      } else {
        // Fallback default plans for display
        setPlans([
          {
            id: 'starter',
            name: 'Starter Tier',
            monthly_price: 49,
            annual_price: 470,
            ai_requests_limit: 1000,
            max_users: 5,
            features: '5 Team Members, 1,000 AI Lead Scores / mo, Basic WhatsApp Automation, Email Support'
          },
          {
            id: 'pro',
            name: 'Professional Tier',
            monthly_price: 149,
            annual_price: 1430,
            ai_requests_limit: 5000,
            max_users: 25,
            features: '25 Team Members, 5,000 AI Lead Scores / mo, Full WhatsApp & Acoustic Coach, Priority Webhooks & API'
          },
          {
            id: 'enterprise',
            name: 'Enterprise Tier',
            monthly_price: 399,
            annual_price: 3830,
            ai_requests_limit: 50000,
            max_users: 100,
            features: 'Unlimited Members, 50,000 AI Scores / mo, Custom ML Retraining, Dedicated SLA & Multi-tenant Audits'
          }
        ]);
      }

      setSubStatus(statusRes.data);
      setInvoices(invoicesRes.data || []);
    } catch (err) {
      console.error('Error fetching billing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  const handleSubscribeClick = (plan) => {
    setSelectedPlan(plan);
    setShowPayModal(true);
  };

  const executeSubscription = async () => {
    if (!selectedPlan) return;
    setSubscribing(true);
    try {
      const res = await api.post('/api/billing/subscribe', {
        plan_id: selectedPlan.id,
        billing_cycle: billingCycle,
        gateway: selectedGateway
      });

      const initData = res.data;
      show({ type: 'success', message: `Checkout initiated via ${selectedGateway.toUpperCase()}!` });

      // If mock/sandbox order, simulate payment directly
      if (initData.order_id) {
        try {
          await api.post('/api/billing/webhook/simulate', {
            gateway: selectedGateway,
            gateway_order_id: initData.order_id
          });
          show({ type: 'success', message: 'Payment successfully captured! Plan updated.' });
        } catch {
          // Simulation endpoint optional in prod
        }
      }

      setShowPayModal(false);
      fetchBillingData();
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Subscription failed';
      show({ type: 'error', message: String(msg) });
    } finally {
      setSubscribing(false);
    }
  };

  const handleGenerateInvoice = async () => {
    setGeneratingInvoice(true);
    try {
      const res = await api.post('/api/billing/generate-invoice');
      show({ type: 'success', message: 'New invoice generated successfully!' });
      fetchBillingData();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to generate invoice';
      show({ type: 'error', message: String(msg) });
    } finally {
      setGeneratingInvoice(false);
    }
  };

  const downloadInvoice = async (inv) => {
    try {
      const res = await api.get(`/api/billing/invoices/${inv.id}/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_${inv.id.substring(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      show({ type: 'error', message: 'Invoice PDF download failed or is not available in test sandbox.' });
    }
  };

  const currentPlan = subStatus?.plan || plans[1] || plans[0];
  const aiUsed = subStatus?.ai_requests_used || 240;
  const aiLimit = currentPlan?.ai_requests_limit || 5000;
  const aiPercent = Math.min(100, Math.round((aiUsed / (aiLimit || 1)) * 100));

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--bg)', padding: '40px 24px 100px' }} className="custom-scroll animate-in">
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h1 className="text-h1" style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text)' }}>
              Billing & Subscriptions
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 6, fontWeight: 500 }}>
              Manage your company tier, monitor AI quota utilization, and download tax invoices.
            </p>
          </div>
          <button
            onClick={handleGenerateInvoice}
            disabled={generatingInvoice}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 12, fontSize: 13, fontWeight: 700 }}
          >
            <span>{generatingInvoice ? 'Generating...' : '📄 Generate Invoice'}</span>
          </button>
        </div>

        {/* Current Plan & Quota Card */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 24,
          marginBottom: 40
        }}>
          {/* Active Plan Overview */}
          <div className="card glass" style={{ padding: 28, position: 'relative', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', top: -20, right: -20, width: 120, height: 120,
              background: 'radial-gradient(circle, rgba(79, 70, 229, 0.15) 0%, transparent 70%)',
              pointerEvents: 'none'
            }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--primary)' }}>
                Current Subscription
              </span>
              <span style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800,
                background: subStatus?.status === 'active' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(79, 70, 229, 0.12)',
                color: subStatus?.status === 'active' ? '#10B981' : 'var(--primary)',
                border: `1px solid ${subStatus?.status === 'active' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(79, 70, 229, 0.3)'}`
              }}>
                {(subStatus?.status || 'Active').toUpperCase()}
              </span>
            </div>

            <h3 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)', marginBottom: 8 }}>
              {currentPlan?.name || 'Professional Plan'}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.5 }}>
              Renews on {subStatus?.current_period_end ? new Date(subStatus.current_period_end).toLocaleDateString() : 'Next billing cycle'} • Billed {billingCycle}
            </p>

            <div style={{ display: 'flex', gap: 16, alignItems: 'baseline' }}>
              <span style={{ fontSize: 36, fontWeight: 900, color: 'var(--text)' }}>
                ${billingCycle === 'monthly' ? (currentPlan?.monthly_price || 149) : Math.round((currentPlan?.annual_price || 1430) / 12)}
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>/ month</span>
            </div>
          </div>

          {/* AI Usage Meter */}
          <div className="card glass" style={{ padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#F59E0B' }}>
                Resource Quota (Current Month)
              </span>
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)' }}>
                {aiPercent}% Used
              </span>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>
                <span>AI Scoring & Enrichment</span>
                <span>{aiUsed.toLocaleString()} / {aiLimit.toLocaleString()}</span>
              </div>
              <div style={{ width: '100%', height: 10, borderRadius: 5, background: 'var(--bg-subtle)', overflow: 'hidden' }}>
                <div style={{
                  width: `${aiPercent}%`, height: '100%', borderRadius: 5,
                  background: aiPercent > 85 ? 'var(--danger)' : 'var(--primary)',
                  transition: 'width 0.4s ease'
                }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 20 }}>
              <div style={{ padding: '12px 16px', background: 'var(--bg-subtle)', borderRadius: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>WhatsApp Messages</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text)', marginTop: 4 }}>Unlimited</div>
              </div>
              <div style={{ padding: '12px 16px', background: 'var(--bg-subtle)', borderRadius: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>Active Squad Seats</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text)', marginTop: 4 }}>
                  {profile?.role === 'Owner / Admin' ? 'Multi-User' : 'Active'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Tiers Section */}
        <div style={{ marginBottom: 50 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>Available Plans</h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                Scale your sales operations seamlessly as your pipeline grows.
              </p>
            </div>

            {/* Monthly / Annual Toggle */}
            <div style={{
              display: 'flex', alignItems: 'center', background: 'var(--bg-surface)',
              padding: 4, borderRadius: 12, border: '1px solid var(--border)'
            }}>
              <button
                onClick={() => setBillingCycle('monthly')}
                style={{
                  padding: '6px 14px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 800,
                  cursor: 'pointer',
                  background: billingCycle === 'monthly' ? 'var(--primary)' : 'transparent',
                  color: billingCycle === 'monthly' ? '#fff' : 'var(--text-muted)'
                }}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                style={{
                  padding: '6px 14px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 800,
                  cursor: 'pointer',
                  background: billingCycle === 'annual' ? 'var(--primary)' : 'transparent',
                  color: billingCycle === 'annual' ? '#fff' : 'var(--text-muted)'
                }}
              >
                Yearly (20% OFF)
              </button>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 24
          }}>
            {plans.map((plan, idx) => {
              const isPro = idx === 1 || plan.name.toLowerCase().includes('pro');
              const price = billingCycle === 'monthly' ? (plan.monthly_price || 99) : Math.round((plan.annual_price || 950) / 12);
              const featuresList = (plan.features || '').split(',').map(f => f.trim()).filter(Boolean);

              return (
                <div
                  key={plan.id || idx}
                  className="card glass-hover"
                  style={{
                    padding: 32,
                    borderRadius: 24,
                    background: 'var(--bg-surface)',
                    border: isPro ? '2px solid var(--primary)' : '1px solid var(--border)',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: isPro ? '0 12px 30px -10px rgba(79, 70, 229, 0.2)' : 'var(--shadow-sm)'
                  }}
                >
                  {isPro && (
                    <div style={{
                      position: 'absolute', top: 16, right: 16,
                      background: 'var(--primary)', color: 'white',
                      fontSize: 10, fontWeight: 900, textTransform: 'uppercase',
                      padding: '4px 10px', borderRadius: 20, letterSpacing: '0.08em'
                    }}>
                      Most Popular
                    </div>
                  )}

                  <div>
                    <h3 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)', marginBottom: 8 }}>
                      {plan.name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 24 }}>
                      <span style={{ fontSize: 32, fontWeight: 900, color: 'var(--text)' }}>${price}</span>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>/ mo</span>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 20, marginBottom: 24 }}>
                      <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.08em' }}>
                        Included Features
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {featuresList.map((f, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>
                            <span style={{ color: '#10B981', fontWeight: 900 }}>✓</span>
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSubscribeClick(plan)}
                    className={isPro ? 'btn-primary' : 'btn-secondary'}
                    style={{
                      width: '100%', padding: '14px', borderRadius: 14,
                      fontSize: 14, fontWeight: 800, textAlign: 'center', cursor: 'pointer'
                    }}
                  >
                    {currentPlan?.name === plan.name ? 'Active Plan' : `Switch to ${plan.name}`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Invoice & Payment History */}
        <div className="card glass" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 16 }}>
            Billing History & Receipts
          </h2>

          {invoices.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🧾</div>
              <p style={{ fontWeight: 700 }}>No past invoices yet.</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>Invoices generated for your subscription cycles will appear here.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 800 }}>Invoice #</th>
                    <th style={{ padding: '12px 16px', fontWeight: 800 }}>Date</th>
                    <th style={{ padding: '12px 16px', fontWeight: 800 }}>Amount</th>
                    <th style={{ padding: '12px 16px', fontWeight: 800 }}>Status</th>
                    <th style={{ padding: '12px 16px', fontWeight: 800, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '16px', fontWeight: 800, color: 'var(--text)' }}>
                        {inv.invoice_number || `INV-${inv.id.substring(0, 8)}`}
                      </td>
                      <td style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {inv.billing_date ? new Date(inv.billing_date).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ padding: '16px', fontWeight: 800, color: 'var(--text)' }}>
                        ${inv.amount || 0}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 800,
                          background: inv.status === 'paid' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                          color: inv.status === 'paid' ? '#10B981' : '#F59E0B'
                        }}>
                          {(inv.status || 'Paid').toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <button
                          onClick={() => downloadInvoice(inv)}
                          className="btn-secondary"
                          style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}
                        >
                          ⬇ PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Payment Gateway Modal */}
      {showPayModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 5000,
          background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div className="card animate-in" style={{
            width: '100%', maxWidth: 440, background: 'var(--bg-surface)',
            borderRadius: 24, padding: 32, border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-xl)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)' }}>Upgrade to {selectedPlan?.name}</h3>
              <button
                onClick={() => setShowPayModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 22, color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 24 }}>
              Select your payment method below to complete the subscription for your team.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
              {[
                { id: 'stripe', label: 'Credit Card / Stripe', icon: '💳' },
                { id: 'razorpay', label: 'Razorpay / UPI / NetBanking', icon: '⚡' },
                { id: 'upi', label: 'Direct Corporate UPI Transfer', icon: '📱' }
              ].map(gw => (
                <div
                  key={gw.id}
                  onClick={() => setSelectedGateway(gw.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
                    borderRadius: 14, cursor: 'pointer',
                    border: selectedGateway === gw.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                    background: selectedGateway === gw.id ? 'rgba(79, 70, 229, 0.06)' : 'var(--bg-subtle)'
                  }}
                >
                  <span style={{ fontSize: 20 }}>{gw.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{gw.label}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowPayModal(false)}
                className="btn-secondary"
                style={{ flex: 1, padding: 12, borderRadius: 12, fontWeight: 700 }}
              >
                Cancel
              </button>
              <button
                onClick={executeSubscription}
                disabled={subscribing}
                className="btn-primary"
                style={{ flex: 2, padding: 12, borderRadius: 12, fontWeight: 800 }}
              >
                {subscribing ? 'Processing...' : 'Confirm & Activate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
