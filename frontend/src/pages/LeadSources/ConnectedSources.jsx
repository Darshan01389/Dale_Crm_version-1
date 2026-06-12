import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../../contexts/ToastContext';
import CsvUploader from './CsvUploader';

const ConnectedSources = () => {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeUploadId, setActiveUploadId] = useState(null);
  const { show: showToast } = useToast();

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      const token = localStorage.getItem('voiceiq_token');
      const res = await axios.get('/api/lead-sources/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSources(res.data);
    } catch (err) {
      console.error(err);
      showToast({ type: 'error', message: 'Failed to fetch lead sources.' });
    } finally {
      setLoading(false);
    }
  };

  const deleteSource = async (id) => {
    if (!window.confirm("Are you sure you want to disconnect and delete this source?")) return;
    try {
      const token = localStorage.getItem('voiceiq_token');
      await axios.delete(`/api/lead-sources/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast({ type: 'success', message: 'Source deleted.' });
      fetchSources();
    } catch (err) {
      console.error(err);
      showToast({ type: 'error', message: 'Failed to delete source.' });
    }
  };

  if (loading) return <div>Loading connected sources...</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
      {sources.length === 0 ? (
        <div style={{ gridColumn: '1 / -1', padding: 40, textAlign: 'center', background: 'var(--bg-surface)', borderRadius: 12, border: '1px dashed var(--border)' }}>
          <h3 className="text-h3" style={{ marginBottom: 8 }}>No Sources Connected</h3>
          <p className="text-muted">You haven't connected any external lead sources yet. Click "Add Source" to get started.</p>
        </div>
      ) : (
        sources.map((src) => (
          <div key={src.id} className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 className="text-h3" style={{ margin: 0 }}>{src.name}</h3>
                <p className="text-muted" style={{ margin: '4px 0 0', fontSize: 13 }}>{src.platform_type}</p>
              </div>
              <span className="badge" style={{ 
                background: src.status === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-subtle)', 
                color: src.status === 'Active' ? 'var(--success)' : 'var(--text-muted)' 
              }}>
                {src.status}
              </span>
            </div>
            
            <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Sync Schedule:</span>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>{src.sync_schedule}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Last Sync:</span>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                  {src.last_sync_at ? new Date(src.last_sync_at).toLocaleString() : 'Never'}
                </span>
              </div>
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', gap: 12, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <button 
                className="btn-primary" 
                style={{ flex: 1, padding: '8px 0', background: 'var(--bg-subtle)', color: 'var(--text)', border: '1px solid var(--border)' }}
                onClick={() => {
                  if (src.platform_type === 'CSV Upload') {
                    setActiveUploadId(activeUploadId === src.id ? null : src.id);
                  } else {
                    alert(`Configure ${src.name} - Coming in Phase 2`);
                  }
                }}
              >
                {activeUploadId === src.id ? 'Close' : 'Configure'}
              </button>
              <button 
                style={{ padding: '8px 16px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
                onClick={() => deleteSource(src.id)}
              >
                Disconnect
              </button>
            </div>

            {activeUploadId === src.id && src.platform_type === 'CSV Upload' && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px dashed var(--border)' }}>
                <CsvUploader onUploadSuccess={() => fetchSources()} />
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default ConnectedSources;
