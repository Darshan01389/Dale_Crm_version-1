import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';

const TABS = ['Organisation', 'Channels', 'Billing & Plan', 'Data Export', 'Security'];

const ROLES = [
  { name: 'Admin', desc: 'Full access.',                      users: 1 },
  { name: 'Manager',     desc: 'Manages a team. Sees team pipeline.', users: 2 },
  { name: 'Sales',     desc: 'Manages own leads.',                 users: 9 },
];

const PIPELINE_OPTIONS = ['E-commerce / D2C', 'Real Estate', 'B2B SaaS / Tech', 'Home / Local Services', 'Generic'];

const OrgSettings = () => {
  const navigate = useNavigate();
  const { show }  = useToast();

  const [orgName, setOrgName]       = useState('DaleIQ Demo Org');
  const [savedName, setSavedName]   = useState('DaleIQ Demo Org');
  const [teams, setTeams]           = useState([]);
  const [addingTeam, setAddingTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [pipeline, setPipeline]     = useState('B2B SaaS / Tech');
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('voiceiq_token');
      const res = await axios.get('/api/teams', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeams(res.data);
    } catch (err) {
      console.error("Error fetching teams:", err);
    } finally {
      setLoading(false);
    }
  };

  const dirty = orgName !== savedName;

  const saveOrgName = () => {
    setSavedName(orgName);
    show({ type: 'success', message: 'Organisation name updated.' });
  };

  const addTeam = async () => {
    if (!newTeamName.trim()) return;
    try {
      const token = localStorage.getItem('voiceiq_token');
      await axios.post('/api/teams', { name: newTeamName }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      show({ type: 'success', message: 'Team added.' });
      setNewTeamName('');
      setAddingTeam(false);
      fetchTeams();
    } catch (err) {
      show({ type: 'error', message: 'Failed to add team.' });
    }
  };

  const handleTab = (tab) => {
    if (tab === 'Channels')      navigate('/settings/channels');
    if (tab === 'Billing & Plan') navigate('/billing');
  };

  if (loading) return <div style={{ padding: 40 }}>Loading Organization Settings...</div>;

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--bg)' }} className="custom-scroll animate-in">
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '40px 24px' }}>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 40, overflowX: 'auto' }}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => handleTab(tab)} style={{
              padding: '12px 20px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', minHeight: 'auto', minWidth: 'auto',
              color: tab === 'Organisation' ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: tab === 'Organisation' ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: -1,
            }}>{tab}</button>
          ))}
        </div>

        {/* Org name */}
        <section style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 8 }}>ORGANISATION NAME</div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <input className="input" value={orgName} onChange={e => setOrgName(e.target.value)} style={{ maxWidth: 340 }} />
            {dirty && <button className="btn-primary" onClick={saveOrgName} style={{ padding: '10px 20px', borderRadius: 10, flexShrink: 0 }}>Save</button>}
          </div>
        </section>

        {/* Teams */}
        <section style={{ marginBottom: 40 }}>
          <h3 className="text-h3" style={{ marginBottom: 16 }}>Teams</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            {teams.map(team => (
              <div key={team.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', background: 'var(--bg-surface)', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontWeight: 700, fontSize: 14, background: 'var(--bg-subtle)', padding: '3px 12px', borderRadius: 20, color: 'var(--primary)' }}>{team.name}</span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', flex: 1 }}>{team.description || 'Sales Squad'}</span>
                <button onClick={() => navigate('/team-mgmt')} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Manage Members →</button>
              </div>
            ))}
          </div>
          {addingTeam ? (
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input className="input" placeholder="Team name…" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} style={{ maxWidth: 260 }} />
              <button className="btn-primary" onClick={addTeam} style={{ padding: '10px 20px', borderRadius: 10, flexShrink: 0 }}>Save</button>
              <button className="btn-secondary" onClick={() => setAddingTeam(false)} style={{ padding: '10px 16px', borderRadius: 10, flexShrink: 0 }}>Cancel</button>
            </div>
          ) : (
            <button className="btn-secondary" onClick={() => setAddingTeam(true)} style={{ padding: '10px 20px', borderRadius: 10 }}>+ Add team</button>
          )}
        </section>

        {/* Roles */}
        <section style={{ marginBottom: 40 }}>
          <h3 className="text-h3" style={{ marginBottom: 4 }}>Roles</h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Core roles available in DaleIQ Sales OS.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ROLES.map(role => (
              <div key={role.name} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', background: 'var(--bg-surface)', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{role.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{role.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pipeline template */}
        <section>
          <h3 className="text-h3" style={{ marginBottom: 8 }}>Pipeline Template</h3>
          <p style={{ fontSize: 13, color: 'var(--warning)', marginBottom: 12 }}>⚠ Changing this may affect your existing stage names.</p>
          <select className="input" value={pipeline} onChange={e => { setPipeline(e.target.value); show({ type: 'success', message: 'Pipeline template updated.' }); }} style={{ maxWidth: 320 }}>
            {PIPELINE_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
        </section>
      </div>
    </div>
  );
};

export default OrgSettings;
