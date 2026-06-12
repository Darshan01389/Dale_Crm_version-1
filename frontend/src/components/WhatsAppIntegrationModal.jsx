import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';

const WhatsAppIntegrationModal = ({ isOpen, onClose, onComplete }) => {
  const { getToken } = useUser();
  const [integrationType, setIntegrationType] = useState('cloud_api'); // 'cloud_api' or 'web_whatsapp'
  const [formData, setFormData] = useState({
    phoneNumberId: '',
    accessToken: ''
  });
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [qrStatus, setQrStatus] = useState('pending'); // 'pending', 'scanning', 'linked'

  useEffect(() => {
    if (isOpen && integrationType === 'web_whatsapp') {
      fetchQrCode();
    }
  }, [isOpen, integrationType]);

  const fetchQrCode = async () => {
    setLoading(true);
    setQrStatus('pending');
    try {
      const response = await fetch('/api/whatsapp/web/qr', {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setQrCode(data.qrCodeDataUrl);
        setQrStatus('scanning');
      } else {
        throw new Error('Failed to fetch QR code');
      }
    } catch (err) {
      console.error(err);
      setQrStatus('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let interval;
    if (qrStatus === 'scanning' && integrationType === 'web_whatsapp') {
      interval = setInterval(async () => {
        try {
          const response = await fetch('/api/whatsapp/web/status', {
            headers: { 'Authorization': `Bearer ${getToken()}` }
          });
          if (response.ok) {
            const data = await response.json();
            if (data.status === 'ready' || data.status === 'authenticated') {
              setQrStatus('linked');
              clearInterval(interval);
              setTimeout(() => {
                onComplete();
              }, 1500); // give a brief success message before closing
            }
          }
        } catch (e) {
          console.error("Polling error", e);
        }
      }, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    }
  }, [qrStatus, integrationType, getToken, onComplete]);

  const handleSaveCloudApi = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/whatsapp/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          provider: 'cloud_api',
          phone_number_id: formData.phoneNumberId,
          access_token: formData.accessToken
        })
      });
      if (response.ok) {
        onComplete();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      <div className="card glass" style={{ width: 480, padding: 24, borderRadius: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>WhatsApp Integration</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
          Choose how you want to connect WhatsApp to send automated outreach messages.
        </p>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <button
            onClick={() => setIntegrationType('cloud_api')}
            style={{
              flex: 1, padding: 12, borderRadius: 8, cursor: 'pointer',
              border: `1px solid ${integrationType === 'cloud_api' ? 'var(--primary)' : 'var(--border)'}`,
              background: integrationType === 'cloud_api' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
              color: integrationType === 'cloud_api' ? 'var(--primary)' : 'var(--text)'
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 14 }}>Official Cloud API</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>For Enterprise</div>
          </button>
          <button
            onClick={() => setIntegrationType('web_whatsapp')}
            style={{
              flex: 1, padding: 12, borderRadius: 8, cursor: 'pointer',
              border: `1px solid ${integrationType === 'web_whatsapp' ? '#10B981' : 'var(--border)'}`,
              background: integrationType === 'web_whatsapp' ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
              color: integrationType === 'web_whatsapp' ? '#10B981' : 'var(--text)'
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 14 }}>Web WhatsApp</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Free & Easy</div>
          </button>
        </div>

        {integrationType === 'cloud_api' && (
          <form onSubmit={handleSaveCloudApi} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Phone Number ID</label>
              <input
                type="text"
                required
                className="input"
                style={{ width: '100%', padding: '8px 12px' }}
                value={formData.phoneNumberId}
                onChange={e => setFormData({ ...formData, phoneNumberId: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Access Token</label>
              <input
                type="password"
                required
                className="input"
                style={{ width: '100%', padding: '8px 12px' }}
                value={formData.accessToken}
                onChange={e => setFormData({ ...formData, accessToken: e.target.value })}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '10px 0', marginTop: 8 }}>
              {loading ? 'Saving...' : 'Save Configuration'}
            </button>
          </form>
        )}

        {integrationType === 'web_whatsapp' && (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            {qrStatus === 'linked' ? (
              <div style={{ padding: 40 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                <h3 style={{ margin: 0, color: '#10B981' }}>Device Linked Successfully!</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 8 }}>Ready to send automated messages.</p>
              </div>
            ) : loading ? (
              <div style={{ padding: 40, color: 'var(--text-muted)', fontSize: 13 }}>Generating QR Code...</div>
            ) : qrCode ? (
              <div>
                <img src={qrCode} alt="WhatsApp QR Code" style={{ width: 200, height: 200, borderRadius: 8, border: '1px solid var(--border)' }} />
                <p style={{ fontSize: 13, color: 'var(--text)', marginTop: 16, fontWeight: 500 }}>
                  Open WhatsApp on your phone, go to Linked Devices, and scan this code.
                </p>
                <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                  <div className="spinner" style={{ width: 14, height: 14, border: '2px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                  Waiting for device scan...
                </div>
              </div>
            ) : (
              <div style={{ padding: 40, color: '#EF4444', fontSize: 13 }}>Failed to generate QR Code. Make sure the Node.js microservice is running.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsAppIntegrationModal;
