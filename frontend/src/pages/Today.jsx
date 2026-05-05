import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import IntentBadge from '../components/IntentBadge';
import EmptyState from '../components/EmptyState';

const todayStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

const CALL_FIRST = [
  { id: '1', name: 'Sarah Jenkins', company: 'TechFlow Inc', reason: 'Proposal due Friday — confirm signal', contactId: '1' },
  { id: '2', name: 'Vikram Nair',   company: 'Initech Pvt',  reason: 'Call scheduled for today — high intent', contactId: '8' },
];
const DONT_COOL = [
  { id: '3', name: 'Rajesh Kumar', reason: 'No activity in 12 days — deal at risk', contactId: '4' },
  { id: '4', name: 'Arjun Singh',  reason: 'No activity in 15 days — may go cold', contactId: '6' },
];
const SCHEDULED = [
  { id: '5', name: 'Lisa Wong',   task: 'Discovery call',   time: '3:00 PM', contactId: '7' },
  { id: '6', name: 'Meera Patel', task: 'Send pricing deck', time: '5:00 PM', contactId: '9' },
];

const SectionLabel = ({ text, count, color }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
    <span style={{ fontSize: 11, fontWeight: 900, color, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{text}</span>
    <span style={{ fontSize: 10, fontWeight: 800, color: 'white', background: color, borderRadius: '50%', width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{count}</span>
  </div>
);

const Today = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [priorityLeads, setPriorityLeads] = useState([]);
  const [scheduled, setScheduled] = useState([]); // Still mock for now, but wired for data

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('voiceiq_token');
        const res = await fetch('/api/leads/priority', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setPriorityLeads(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const callFirst = priorityLeads.filter(l => (l.ai_score || 0) >= 70);
  const atRisk = priorityLeads.filter(l => (l.ai_score || 0) < 70 && (l.ai_score || 0) > 0);

  const allEmpty = !callFirst.length && !atRisk.length && !scheduled.length;

  if (loading) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ width: 40, height: 40, border: '4px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--bg)' }} className="custom-scroll animate-in">
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 100px' }}>
        <h1 className="text-h1">Today</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, marginBottom: 40 }}>{todayStr}</p>

        {allEmpty && (
          <EmptyState variant="A" headline="Nothing on for today"
            subhead="Your scheduled tasks and AI-surfaced leads will appear here."
            ctaLabel="Go to Inbox" onCta={() => navigate('/inbox')} />
        )}

        {callFirst.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <SectionLabel text={`Call First · ${callFirst.length}`} count={callFirst.length} color="#1F6E43" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {callFirst.map(item => (
                <div key={item.id} onClick={() => navigate(`/leads/${item.id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', background: 'var(--bg-surface)', borderRadius: 14, border: '1px solid var(--border-subtle)', cursor: 'pointer', minHeight: 60, boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{item.title}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{item.ai_score_summary || 'AI Score: ' + item.ai_score}</div>
                  </div>
                  <IntentBadge type="HIGH_INTENT" />
                  <span style={{ color: 'var(--text-muted)', fontSize: 16 }}>›</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {atRisk.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <SectionLabel text={`Don't Let These Cool · ${atRisk.length}`} count={atRisk.length} color="#B4670F" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {atRisk.map(item => (
                <div key={item.id} onClick={() => navigate(`/leads/${item.id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', background: 'var(--bg-surface)', borderRadius: 14, border: '1px solid var(--border-subtle)', cursor: 'pointer', minHeight: 60, boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{item.title}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{item.ai_score_summary || 'Potential deal at risk'}</div>
                  </div>
                  <IntentBadge type="AT_RISK" />
                  <span style={{ color: 'var(--text-muted)', fontSize: 16 }}>›</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {scheduled.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <SectionLabel text={`Scheduled · ${scheduled.length}`} count={scheduled.length} color="#1F4E79" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {scheduled.map(item => (
                <div key={item.id} onClick={() => navigate(`/leads/${item.id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 4px', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', minHeight: 44 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', width: 64, flexShrink: 0 }}>{item.time}</span>
                  <span style={{ fontSize: 13, color: 'var(--text)', flex: 1 }}>{item.task}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Today;
