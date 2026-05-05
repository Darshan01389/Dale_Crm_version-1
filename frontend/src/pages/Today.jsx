import React, { useState } from 'react';
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
  const allEmpty = !CALL_FIRST.length && !DONT_COOL.length && !SCHEDULED.length;

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

        {CALL_FIRST.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <SectionLabel text={`Call First · ${CALL_FIRST.length}`} count={CALL_FIRST.length} color="#1F6E43" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {CALL_FIRST.map(item => (
                <div key={item.id} onClick={() => navigate(`/leads/${item.contactId}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', background: 'var(--bg-surface)', borderRadius: 14, border: '1px solid var(--border-subtle)', cursor: 'pointer', minHeight: 60, boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{item.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{item.reason}</div>
                  </div>
                  <IntentBadge type="HIGH_INTENT" />
                  <span style={{ color: 'var(--text-muted)', fontSize: 16 }}>›</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {DONT_COOL.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <SectionLabel text={`Don't Let These Cool · ${DONT_COOL.length}`} count={DONT_COOL.length} color="#B4670F" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DONT_COOL.map(item => (
                <div key={item.id} onClick={() => navigate(`/leads/${item.contactId}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', background: 'var(--bg-surface)', borderRadius: 14, border: '1px solid var(--border-subtle)', cursor: 'pointer', minHeight: 60, boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{item.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{item.reason}</div>
                  </div>
                  <IntentBadge type="AT_RISK" />
                  <span style={{ color: 'var(--text-muted)', fontSize: 16 }}>›</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {SCHEDULED.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <SectionLabel text={`Scheduled · ${SCHEDULED.length}`} count={SCHEDULED.length} color="#1F4E79" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {SCHEDULED.map(item => (
                <div key={item.id} onClick={() => navigate(`/leads/${item.contactId}`)}
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
    </div>
  );
};

export default Today;
