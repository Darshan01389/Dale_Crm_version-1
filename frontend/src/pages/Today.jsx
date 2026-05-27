import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import IntentBadge from '../components/IntentBadge';
import EmptyState from '../components/EmptyState';
import { useUser } from '../contexts/UserContext';

const todayStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

const SectionLabel = ({ text, count, color }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
    <span style={{ fontSize: 11, fontWeight: 900, color, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{text}</span>
    <span style={{ fontSize: 10, fontWeight: 800, color: 'white', background: color, borderRadius: 20, padding: '2px 8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{count}</span>
  </div>
);

const TaskSkeleton = () => (
  <div style={{ padding: '20px', background: 'var(--bg-surface)', borderRadius: 20, border: '1px solid var(--border-subtle)', marginBottom: 12, opacity: 0.6 }}>
    <div className="skeleton" style={{ width: '60%', height: 16, borderRadius: 4, marginBottom: 8 }} />
    <div className="skeleton" style={{ width: '40%', height: 12, borderRadius: 4 }} />
  </div>
);

const Today = () => {
  const navigate = useNavigate();
  const { profile } = useUser();
  const [loading, setLoading] = useState(true);
  const [priorityLeads, setPriorityLeads] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [syncing, setSyncing] = useState(false);

  const fetchData = async () => {
    const token = localStorage.getItem('voiceiq_token');
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchWithTimeout = (url, options, timeout = 10000) => {
      return Promise.race([
        fetch(url, options),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout))
      ]);
    };

    try {
      const [leadRes, taskRes] = await Promise.all([
        fetchWithTimeout('/api/leads/priority', { headers: { Authorization: `Bearer ${token}` } }),
        fetchWithTimeout('/api/tasks/today', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (leadRes.ok) setPriorityLeads(await leadRes.json());
      if (taskRes.ok) setTasks(await taskRes.json());
    } catch (err) {
      console.error("Error fetching Today's data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const reSyncAI = async () => {
    setSyncing(true);
    try {
      const token = localStorage.getItem('voiceiq_token');
      const res = await fetch('/api/tasks/sync', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setTasks(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  const triggerReassignment = async () => {
    if (!window.confirm("Trigger AI check for stagnant leads?")) return;
    try {
      const token = localStorage.getItem('voiceiq_token');
      const res = await fetch('/api/tasks/reassign-stagnant', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      alert(data.message);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const callFirst = priorityLeads.filter(l => (l.ai_score || 0) >= 70);
  const atRisk = priorityLeads.filter(l => (l.ai_score || 0) < 70 && (l.ai_score || 0) > 0);
  const allEmpty = !loading && !callFirst.length && !atRisk.length && !tasks.length;

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--bg)' }} className="custom-scroll animate-in">
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 100px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 44 }}>
          <div>
            <h1 className="text-h1" style={{ fontSize: 32, letterSpacing: '-0.02em' }}>Today</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, fontWeight: 600 }}>{todayStr}</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={reSyncAI} disabled={syncing} className="btn-secondary" style={{ fontSize: 12, padding: '10px 18px', borderRadius: 12, fontWeight: 700 }}>
              {syncing ? 'Syncing...' : '↻ Re-Sync AI'}
            </button>
            {['Owner / Admin', 'Sales Admin', 'Team Lead', 'Manager', 'admin', 'admin/developers', 'Developer'].includes(profile?.role) && (
              <button onClick={triggerReassignment} className="btn-primary" style={{ fontSize: 12, padding: '10px 18px', borderRadius: 12, background: 'var(--text)', color: 'white', fontWeight: 700 }}>
                ⚙️ Lead Check
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <>
            <TaskSkeleton />
            <TaskSkeleton />
            <TaskSkeleton />
          </>
        ) : (
          <>
            {/* AI Suggested Tasks Section */}
            {tasks.length > 0 && (
              <div style={{ marginBottom: 52 }}>
                <SectionLabel text={`AI-Driven Action Items`} count={tasks.filter(t => !t.is_completed).length} color="var(--primary)" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {tasks.map(task => (
                    <div key={task.id} 
                      onClick={() => task.lead_id && navigate(`/leads/${task.lead_id}`)}
                      className="glass-hover"
                      style={{ 
                        display: 'flex', flexDirection: 'column', gap: 12, padding: '24px', 
                        background: 'var(--bg-surface)', borderRadius: 24,
                        border: '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        opacity: task.is_completed ? 0.6 : 1,
                        boxShadow: task.is_completed ? 'none' : '0 10px 30px -10px rgba(79, 70, 229, 0.1)'
                      }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                            <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)', textDecoration: task.is_completed ? 'line-through' : 'none' }}>
                              {task.title}
                            </div>
                            {task.is_completed && (
                              <div style={{ padding: '2px 8px', borderRadius: 6, background: '#10B981', color: 'white', fontSize: 9, fontWeight: 900, textTransform: 'uppercase' }}>✓ AI VERIFIED</div>
                            )}
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{task.description}</div>
                        </div>
                        <div style={{ 
                          fontSize: 10, fontWeight: 900, padding: '4px 10px', borderRadius: 8,
                          background: task.priority === 'High' ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-subtle)',
                          color: task.priority === 'High' ? '#EF4444' : 'var(--text-muted)',
                          textTransform: 'uppercase', letterSpacing: '0.05em'
                        }}>{task.priority}</div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <div style={{ padding: '4px 10px', borderRadius: 20, background: 'rgba(79, 70, 229, 0.08)', color: 'var(--primary)', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                          👤 {task.lead_name}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Click to open profile ›</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {allEmpty && (
              <EmptyState variant="A" headline="You're all caught up"
                subhead="AI hasn't surfaced any urgent tasks for today. Great work!"
                ctaLabel="Global Pipeline" onCta={() => navigate('/leads')} />
            )}

            {callFirst.length > 0 && (
              <div style={{ marginBottom: 40 }}>
                <SectionLabel text={`Immediate Follow-up Required`} count={callFirst.length} color="#4F46E5" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {callFirst.map(item => (
                    <div key={item.id} onClick={() => navigate(`/leads/${item.id}`)}
                      className="glass-hover"
                      style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px', background: 'var(--bg-surface)', borderRadius: 20, border: '1px solid var(--border-subtle)', cursor: 'pointer', minHeight: 70 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>{item.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>{item.ai_score_summary || 'High priority lead waiting for response.'}</div>
                      </div>
                      <IntentBadge type="HIGH_INTENT" />
                      <span style={{ color: 'var(--text-muted)', fontSize: 16, fontWeight: 300 }}>›</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {atRisk.length > 0 && (
              <div style={{ marginBottom: 40 }}>
                <SectionLabel text={`Don't Let These Cool`} count={atRisk.length} color="#B4670F" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {atRisk.map(item => (
                    <div key={item.id} onClick={() => navigate(`/leads/${item.id}`)}
                      className="glass-hover"
                      style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px', background: 'var(--bg-surface)', borderRadius: 20, border: '1px solid var(--border-subtle)', cursor: 'pointer', minHeight: 70 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>{item.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>Potential deal showing signs of stagnation.</div>
                      </div>
                      <IntentBadge type="AT_RISK" />
                      <span style={{ color: 'var(--text-muted)', fontSize: 16, fontWeight: 300 }}>›</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <style>{`
        .skeleton {
          background: linear-gradient(90deg, var(--bg-subtle) 25%, var(--border-subtle) 50%, var(--bg-subtle) 75%);
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
        }
        @keyframes loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .glass-hover:hover {
          transform: translateY(-2px);
          border-color: var(--primary) !important;
          box-shadow: 0 12px 40px -12px rgba(79, 70, 229, 0.15) !important;
        }
      `}</style>
    </div>
  );
};

export default Today;
