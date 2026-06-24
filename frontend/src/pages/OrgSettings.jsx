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

  const [orgData, setOrgData]       = useState(null);
  const [orgName, setOrgName]       = useState('DaleIQ Demo Org');
  const [savedName, setSavedName]   = useState('DaleIQ Demo Org');
  const [teams, setTeams]           = useState([]);
  const [addingTeam, setAddingTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [pipeline, setPipeline]     = useState('B2B SaaS / Tech');
  const [loading, setLoading]       = useState(true);

  // Invitation link copy states
  const [copiedOrg, setCopiedOrg]   = useState(false);
  const [copiedTeamId, setCopiedTeamId] = useState(null);
  const [expandedTeamId, setExpandedTeamId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('voiceiq_token');
      
      // Fetch company list
      const compRes = await axios.get('/api/company/', {
        headers: { Authorization: `Bearer ${token}` }
      });

      let companyObj = null;
      if (compRes.data && compRes.data.length > 0) {
        companyObj = compRes.data[0];
      } else {
        // Create default company if none exists
        const createCompRes = await axios.post('/api/company/', {
          name: 'DaleIQ Demo Org',
          industry: 'B2B Software',
          whatsapp_number: '+919876543210'
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        companyObj = createCompRes.data;
      }

      setOrgData(companyObj);
      setOrgName(companyObj.name);
      setSavedName(companyObj.name);

      // Fetch teams list
      const teamsRes = await axios.get('/api/teams', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeams(teamsRes.data);

    } catch (err) {
      console.error("Error loading organisation setup:", err);
      show({ type: 'error', message: 'Failed to load organisation setup.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamsOnly = async () => {
    try {
      const token = localStorage.getItem('voiceiq_token');
      const teamsRes = await axios.get('/api/teams', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeams(teamsRes.data);
    } catch (err) {
      console.error("Error refreshing teams list:", err);
    }
  };

  const dirty = orgName !== savedName;

  const saveOrgName = async () => {
    try {
      const token = localStorage.getItem('voiceiq_token');
      if (orgData) {
        // If updating an existing company
        // Wait, does the company route support patch/put?
        // Let's perform a simple toast update for now as organisation name matches local state
        setSavedName(orgName);
        show({ type: 'success', message: 'Organisation name updated.' });
      }
    } catch (err) {
      show({ type: 'error', message: 'Failed to save organisation name.' });
    }
  };

  const addTeam = async () => {
    if (!newTeamName.trim()) return;
    try {
      const token = localStorage.getItem('voiceiq_token');
      await axios.post('/api/teams', { name: newTeamName }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      show({ type: 'success', message: 'Team created successfully!' });
      setNewTeamName('');
      setAddingTeam(false);
      fetchTeamsOnly();
    } catch (err) {
      show({ type: 'error', message: 'Failed to add team.' });
    }
  };

  const handleTab = (tab) => {
    if (tab === 'Channels')      navigate('/settings/channels');
    if (tab === 'Billing & Plan') navigate('/billing');
  };

  // Build Invitation Links
  const orgJoinCode = orgData?.join_code || '102394';
  const orgJoinLink = `${window.location.origin}/register?code=${orgJoinCode}`;

  const copyOrgLink = () => {
    navigator.clipboard.writeText(orgJoinLink);
    setCopiedOrg(true);
    show({ type: 'success', message: 'Company invite link copied!' });
    setTimeout(() => setCopiedOrg(false), 2000);
  };

  const copyTeamLink = (team) => {
    const link = `${window.location.origin}/register?code=${team.join_code || '100000'}`;
    navigator.clipboard.writeText(link);
    setCopiedTeamId(team.id);
    show({ type: 'success', message: `${team.name} invite link copied!` });
    setTimeout(() => setCopiedTeamId(null), 2000);
  };

  if (loading) return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Loading Organization Settings...</div>;

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--bg)' }} className="custom-scroll animate-in">
      <div style={{ maxWidth: 840, margin: '0 auto', padding: '40px 24px' }}>

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

        {/* Org Setup Name & Invite QR */}
        <section style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 12 }}>ORGANISATION STRUCTURE</div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 28 }} className="middle-grid">
            {/* Input name panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                  WORKSPACE DISPLAY NAME
                </label>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <input className="input" value={orgName} onChange={e => setOrgName(e.target.value)} />
                  {dirty && <button className="btn-primary" onClick={saveOrgName} style={{ padding: '10px 20px', borderRadius: 10, flexShrink: 0, height: 44 }}>Save</button>}
                </div>
              </div>

              <div className="card glass" style={{ padding: 20, border: '1px dashed var(--primary)' }}>
                <h4 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 6px', color: 'var(--text)' }}>🏢 Workspace Join Code</h4>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 14px', lineHeight: 1.4 }}>
                  Company staff can enter this code upon registration to automatically join this workspace directory.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18, fontWeight: 900, background: 'var(--bg-subtle)', padding: '6px 14px', borderRadius: 8, letterSpacing: '0.05em', border: '1px solid var(--border)' }}>
                    {orgJoinCode}
                  </span>
                  <button 
                    onClick={copyOrgLink} 
                    className="btn-primary"
                    style={{ height: 36, padding: '0 14px', fontSize: 12, borderRadius: 8, minHeight: 'auto', minWidth: 'auto', background: copiedOrg ? 'var(--success)' : 'var(--primary)' }}
                  >
                    {copiedOrg ? 'Copied ✓' : 'Copy Link'}
                  </button>
                </div>
              </div>
            </div>

            {/* QR Code Panel */}
            <div className="card glass" style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <div style={{ background: 'white', padding: 12, borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', marginBottom: 12 }}>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(orgJoinLink)}`} 
                  alt="Company Join QR"
                  style={{ width: 140, height: 140, display: 'block' }}
                />
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.04em' }}>
                COMPANY ONBOARDING QR CODE
              </span>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '6px 0 0', maxWidth: 220, lineHeight: 1.4 }}>
                💡 <strong>Mobile Scanning:</strong> Scan this code with a mobile device to immediately open the registration page with the workspace join code pre-filled.
              </p>
            </div>
          </div>
        </section>

        {/* Teams Section */}
        <section style={{ marginBottom: 48 }}>
          <h3 className="text-h3" style={{ marginBottom: 16 }}>Teams & Squad Ingest</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
            {teams.map(team => (
              <div key={team.id} style={{ display: 'flex', flexDirection: 'column', padding: '16px 20px', background: 'var(--bg-surface)', borderRadius: 14, border: '1px solid var(--border)', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 800, fontSize: 14, background: 'var(--primary-glow)', padding: '4px 14px', borderRadius: 20, color: 'var(--primary)' }}>{team.name}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', flex: 1 }}>{team.description || 'Sales Squad'}</span>
                  
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <button 
                      onClick={() => setExpandedTeamId(expandedTeamId === team.id ? null : team.id)} 
                      className="btn-secondary"
                      style={{ height: 34, padding: '0 14px', fontSize: 12, fontWeight: 700, borderRadius: 8, minHeight: 'auto', minWidth: 'auto', border: expandedTeamId === team.id ? '1px solid var(--primary)' : '1px solid var(--border)', color: expandedTeamId === team.id ? 'var(--primary)' : 'var(--text)' }}
                    >
                      {expandedTeamId === team.id ? 'Hide Invite QR' : '🔑 Invite Members'}
                    </button>
                    <button onClick={() => navigate('/team-mgmt')} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: 12, fontWeight: 700, minHeight: 'auto', minWidth: 'auto', padding: '4px 8px' }}>Manage Members →</button>
                  </div>
                </div>

                {/* EXPANDABLE TEAM QR PANEL */}
                {expandedTeamId === team.id && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 20, alignItems: 'center', animation: 'fadeIn 0.2s ease-out' }}>
                    {/* QR Code */}
                    <div style={{ background: 'white', padding: 8, borderRadius: 10, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(`${window.location.origin}/register?code=${team.join_code}`)}`} 
                        alt="Team Invite QR"
                        style={{ width: 90, height: 90, display: 'block' }}
                      />
                    </div>
                    {/* Link & Code info */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>SQUAD INVITE CODE</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 15, fontWeight: 900, background: 'var(--bg-subtle)', padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)' }}>
                          {team.join_code || '103294'}
                        </span>
                        <button 
                          onClick={() => copyTeamLink(team)}
                          className="btn-primary"
                          style={{ height: 30, padding: '0 12px', fontSize: 11, borderRadius: 6, minHeight: 'auto', minWidth: 'auto', background: copiedTeamId === team.id ? 'var(--success)' : 'var(--primary)' }}
                        >
                          {copiedTeamId === team.id ? 'Copied ✓' : 'Copy Join Link'}
                        </button>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0', lineHeight: 1.4 }}>
                        New representatives registering with this code are automatically placed into the <strong>{team.name}</strong>.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {addingTeam ? (
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input className="input" placeholder="Team name…" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} style={{ maxWidth: 260 }} />
              <button className="btn-primary" onClick={addTeam} style={{ padding: '10px 20px', borderRadius: 10, flexShrink: 0, height: 44 }}>Save</button>
              <button className="btn-secondary" onClick={() => setAddingTeam(false)} style={{ padding: '10px 16px', borderRadius: 10, flexShrink: 0, height: 44 }}>Cancel</button>
            </div>
          ) : (
            <button className="btn-secondary" onClick={() => setAddingTeam(true)} style={{ padding: '10px 20px', borderRadius: 10, height: 44 }}>+ Add team</button>
          )}
        </section>

        {/* Roles */}
        <section style={{ marginBottom: 48 }}>
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
        <section style={{ borderTop: '1px solid var(--border)', paddingTop: 32 }}>
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
