import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useToast } from '../../contexts/ToastContext';

const WebhookLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [retryingLogId, setRetryingLogId] = useState(null);
  const { show: showToast } = useToast();

  const fetchLogs = async () => {
    try {
      const res = await api.get('/api/webhooks/logs');
      setLogs(res.data);
    } catch (err) {
      console.error(err);
      showToast({ type: 'error', message: 'Failed to fetch webhook logs.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (logId) => {
    setRetryingLogId(logId);
    try {
      await api.post(`/api/webhooks/logs/${logId}/retry`);
      showToast({ type: 'success', message: 'Webhook reprocessed successfully.' });
      fetchLogs();
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || 'Failed to retry webhook.';
      showToast({ type: 'error', message: detail });
      fetchLogs();
    } finally {
      setRetryingLogId(null);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  if (loading) {
    return <div style={{ color: 'var(--text-muted)', padding: 20 }}>Loading webhook logs...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 className="text-h3" style={{ margin: 0 }}>Webhook Integration Logs</h3>
          <p className="text-muted" style={{ margin: '4px 0 0', fontSize: 13 }}>
            Monitor and debug incoming lead payloads from connected webhooks.
          </p>
        </div>
        <button 
          className="btn-primary" 
          onClick={fetchLogs} 
          style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13 }}
        >
          Refresh Logs
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {logs.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <p className="text-muted" style={{ margin: 0 }}>No webhook logs found. Send test webhook requests to populate this log.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '16px 24px', fontWeight: 800, color: 'var(--text-muted)' }}>Source Name</th>
                  <th style={{ padding: '16px 24px', fontWeight: 800, color: 'var(--text-muted)' }}>Timestamp</th>
                  <th style={{ padding: '16px 24px', fontWeight: 800, color: 'var(--text-muted)' }}>Status</th>
                  <th style={{ padding: '16px 24px', fontWeight: 800, color: 'var(--text-muted)' }}>Error Message</th>
                  <th style={{ padding: '16px 24px', fontWeight: 800, color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  const dateStr = new Date(log.created_at).toLocaleString();
                  return (
                    <React.Fragment key={log.id}>
                      <tr style={{ borderBottom: '1px solid var(--border)', background: isExpanded ? 'var(--bg-subtle)' : 'transparent' }}>
                        <td style={{ padding: '16px 24px', fontWeight: 700 }}>{log.source_name}</td>
                        <td style={{ padding: '16px 24px', color: 'var(--text-muted)' }}>{dateStr}</td>
                        <td style={{ padding: '16px 24px' }}>
                          <span className="badge" style={{
                            background: log.status === 'Processed' 
                              ? 'rgba(16, 185, 129, 0.1)' 
                              : log.status === 'Failed' 
                              ? 'rgba(239, 68, 68, 0.1)' 
                              : 'rgba(245, 158, 11, 0.1)',
                            color: log.status === 'Processed' 
                              ? 'var(--success)' 
                              : log.status === 'Failed' 
                              ? 'var(--danger)' 
                              : 'var(--owner-accent)'
                          }}>
                            {log.status}
                          </span>
                        </td>
                        <td style={{ padding: '16px 24px', color: 'var(--danger)', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {log.error_message || '-'}
                        </td>
                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                            {log.status === 'Failed' && (
                              <button
                                className="btn-primary"
                                onClick={() => handleRetry(log.id)}
                                disabled={retryingLogId === log.id}
                                style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                {retryingLogId === log.id ? 'Retrying...' : 'Retry Mapping'}
                              </button>
                            )}
                            <button
                              className="btn-secondary"
                              onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                              style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6 }}
                            >
                              {isExpanded ? 'Hide Payload' : 'View Payload'}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan="5" style={{ padding: '24px', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                              {log.error_message && (
                                <div style={{ padding: 12, background: 'rgba(239, 68, 68, 0.05)', border: '1.5px solid var(--danger)', borderRadius: 8 }}>
                                  <strong style={{ display: 'block', fontSize: 12, color: 'var(--danger)', marginBottom: 4 }}>Full Error Details:</strong>
                                  <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: 12, whiteSpace: 'pre-wrap', color: 'var(--text)' }}>
                                    {log.error_message}
                                  </pre>
                                </div>
                              )}
                              <div>
                                <strong style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Payload Details:</strong>
                                <pre style={{
                                  margin: 0,
                                  padding: 16,
                                  background: 'var(--bg-surface)',
                                  borderRadius: 10,
                                  border: '1px solid var(--border)',
                                  overflowX: 'auto',
                                  fontFamily: 'monospace',
                                  fontSize: 12,
                                  color: 'var(--text)'
                                }}>
                                  {JSON.stringify(log.payload, null, 2)}
                                </pre>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebhookLogs;
