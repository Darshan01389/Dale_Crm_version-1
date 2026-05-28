import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../../contexts/ToastContext';

const SOURCE_TYPES = [
  { id: 'website', name: 'Website Tracker', icon: '🌐', desc: 'Track pageviews and form submissions via JS snippet.' },
  { id: 'facebook', name: 'Facebook Ads', icon: '🔵', desc: 'Sync leads directly from Meta Lead Ads.' },
  { id: 'webhook', name: 'Custom Webhook', icon: '🔗', desc: 'Receive JSON payloads from any external app (Zapier, Make, etc).' },
  { id: 'csv', name: 'CSV Upload', icon: '📄', desc: 'Import leads manually from a spreadsheet.' },
];

const AddSourceWizard = () => {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState(null);
  const [sourceName, setSourceName] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdSource, setCreatedSource] = useState(null);
  
  const navigate = useNavigate();
  const { show: showToast } = useToast();

  const handleNext = async () => {
    if (step === 1) {
      if (!selectedType) return showToast({ type: 'error', message: 'Please select a source type.' });
      setStep(2);
    } else if (step === 2) {
      if (!sourceName.trim()) return showToast({ type: 'error', message: 'Please enter a source name.' });
      
      setLoading(true);
      try {
        const token = localStorage.getItem('voiceiq_token');
        const res = await axios.post('/api/lead-sources/', {
          name: sourceName,
          platform_type: selectedType.name,
          status: 'Active',
          sync_schedule: 'Real-time',
          field_mapping: { "name": "title", "email": "email", "phone": "phone" } // Basic default mapping
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setCreatedSource(res.data);
        setStep(3);
        showToast({ type: 'success', message: 'Lead Source created successfully!' });
      } catch (err) {
        console.error(err);
        showToast({ type: 'error', message: 'Failed to create lead source.' });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="card" style={{ maxWidth: 800, margin: '0 auto', padding: 32 }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 32, alignItems: 'center' }}>
        <button 
          onClick={() => navigate('/sources/connected')} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
        >
          ← Back
        </button>
        <h2 className="text-h2" style={{ margin: 0 }}>Add New Lead Source</h2>
      </div>

      {/* Step Indicators */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 40 }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{ 
            flex: 1, height: 4, borderRadius: 2, 
            background: step >= s ? 'var(--primary)' : 'var(--border)' 
          }} />
        ))}
      </div>

      {/* Step 1: Select Type */}
      {step === 1 && (
        <div>
          <h3 className="text-h3" style={{ marginBottom: 24 }}>Select Source Type</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {SOURCE_TYPES.map(type => (
              <div 
                key={type.id}
                onClick={() => setSelectedType(type)}
                style={{ 
                  padding: 24, borderRadius: 12, border: `2px solid ${selectedType?.id === type.id ? 'var(--primary)' : 'var(--border)'}`,
                  cursor: 'pointer', background: selectedType?.id === type.id ? 'var(--primary-glow)' : 'var(--bg-surface)',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 12 }}>{type.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 4 }}>{type.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{type.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Configuration */}
      {step === 2 && (
        <div>
          <h3 className="text-h3" style={{ marginBottom: 24 }}>Configure {selectedType.name}</h3>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Internal Name</label>
            <input 
              type="text" 
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
              placeholder="e.g. Summer Campaign Ads"
              style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text)' }}
            />
          </div>
        </div>
      )}

      {/* Step 3: Connection Details / Code Snippet */}
      {step === 3 && createdSource && (
        <div>
          <h3 className="text-h3" style={{ marginBottom: 24, color: 'var(--success)' }}>✅ Source Connected Successfully</h3>
          
          <div style={{ padding: 24, background: 'var(--bg-subtle)', borderRadius: 12, border: '1px solid var(--border)', marginBottom: 24 }}>
            {selectedType.id === 'webhook' && (
              <>
                <h4 style={{ margin: '0 0 12px' }}>Your Webhook URL</h4>
                <p className="text-muted" style={{ fontSize: 13, marginBottom: 16 }}>Send POST requests containing JSON data to this URL.</p>
                <code style={{ display: 'block', padding: 16, background: '#1E293B', color: '#10B981', borderRadius: 8, fontSize: 13, wordBreak: 'break-all' }}>
                  {`${window.location.origin}/api/webhooks/${createdSource.id}`}
                </code>
              </>
            )}
            
            {selectedType.id === 'website' && (
              <>
                <h4 style={{ margin: '0 0 12px' }}>Tracking Snippet</h4>
                <p className="text-muted" style={{ fontSize: 13, marginBottom: 16 }}>Place this script in the &lt;head&gt; of your website.</p>
                <pre style={{ margin: 0, padding: 16, background: '#1E293B', color: '#60A5FA', borderRadius: 8, fontSize: 13, overflowX: 'auto' }}>
{`<script src="${window.location.origin}/crm-tracker.js"></script>
<script>
  CRM.init({
    sourceId: "${createdSource.id}"
  });
</script>`}
                </pre>
              </>
            )}

            {(selectedType.id === 'facebook' || selectedType.id === 'csv') && (
              <p className="text-muted">Further configuration for this module will be available in the upcoming integration phases.</p>
            )}
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
        {step < 3 ? (
          <button 
            className="btn-primary" 
            onClick={handleNext}
            disabled={loading}
            style={{ padding: '12px 24px', borderRadius: 8, fontWeight: 700, minWidth: 120 }}
          >
            {loading ? 'Processing...' : 'Next Step →'}
          </button>
        ) : (
          <button 
            className="btn-primary" 
            onClick={() => navigate('/sources/connected')}
            style={{ padding: '12px 24px', borderRadius: 8, fontWeight: 700 }}
          >
            Finish & Return
          </button>
        )}
      </div>
    </div>
  );
};

export default AddSourceWizard;
