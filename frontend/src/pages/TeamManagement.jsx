import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';

const TeamManagement = () => {
  const { show } = useToast();
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamMembers, setTeamMembers] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('voiceiq_token');
      const [teamsRes, usersRes] = await Promise.all([
        axios.get('/api/teams', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/users', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setTeams(teamsRes.data);
      setUsers(usersRes.data);
      
      // Fetch members for each team
      const membersMap = {};
      await Promise.all(teamsRes.data.map(async (team) => {
        const res = await axios.get(`/api/teams/${team.id}/members`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        membersMap[team.id] = res.data;
      }));
      setTeamMembers(membersMap);

    } catch (err) {
      console.error("Error fetching team data:", err);
      show({ type: 'error', message: 'Failed to load team data.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    try {
      const token = localStorage.getItem('voiceiq_token');
      await axios.post('/api/teams', { name: newTeamName }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      show({ type: 'success', message: 'Team created successfully!' });
      setNewTeamName('');
      setShowAddTeam(false);
      fetchData();
    } catch (err) {
      show({ type: 'error', message: 'Failed to create team.' });
    }
  };

  const handleAddMember = async (teamId, userId) => {
    try {
      const token = localStorage.getItem('voiceiq_token');
      await axios.post(`/api/teams/${teamId}/members/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      show({ type: 'success', message: 'Member added to team!' });
      fetchData();
    } catch (err) {
      show({ type: 'error', message: 'Failed to add member.' });
    }
  };

  if (loading) return <div style={{ padding: 40 }}>Loading Team Management...</div>;

  return (
    <div style={{ padding: 40, background: 'var(--bg)', height: '100%', overflowY: 'auto' }} className="custom-scroll animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 className="text-h1">Team Management</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>Organize your sales force into high-performance squads.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAddTeam(true)}>+ Create New Team</button>
      </div>

      {showAddTeam && (
        <div className="card" style={{ padding: 24, marginBottom: 32, maxWidth: 400 }}>
          <h3 style={{ marginBottom: 16 }}>Create New Team</h3>
          <input 
            className="input" 
            placeholder="Team Name (e.g. Alpha Squad)" 
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            style={{ marginBottom: 16 }}
          />
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-primary" onClick={handleCreateTeam}>Save Team</button>
            <button className="btn-secondary" onClick={() => setShowAddTeam(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 24 }}>
        {teams.map(team => (
          <div key={team.id} className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ 
                  width: 40, height: 40, borderRadius: 12, 
                  background: 'var(--primary)', color: 'white', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 18
                }}>
                  {team.name[0]}
                </div>
                <h3 style={{ margin: 0 }}>{team.name}</h3>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
                {teamMembers[team.id]?.length || 0} MEMBERS
              </span>
            </div>

            <div style={{ marginBottom: 20 }}>
              <h4 style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 12 }}>TEAM MEMBERS</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {teamMembers[team.id]?.map(member => (
                  <div key={member.id} style={{ 
                    display: 'flex', alignItems: 'center', gap: 12, 
                    padding: '8px 12px', background: 'var(--bg-subtle)', borderRadius: 8 
                  }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>
                      {member.name[0]}
                    </div>
                    <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{member.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{member.role === 'Team Lead' ? 'Manager' : 'Sales'}</div>
                  </div>
                ))}
                {(!teamMembers[team.id] || teamMembers[team.id].length === 0) && (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>No members assigned.</div>
                )}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              <h4 style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 12 }}>ASSIGN NEW MEMBER</h4>
              <div style={{ display: 'flex', gap: 8 }}>
                <select 
                  className="input" 
                  style={{ flex: 1, height: 38, fontSize: 13 }}
                  onChange={(e) => e.target.value && handleAddMember(team.id, e.target.value)}
                  defaultValue=""
                >
                  <option value="" disabled>Select User...</option>
                  {users.filter(u => u.role !== 'Owner / Admin' && !teamMembers[team.id]?.find(m => m.id === u.id)).map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role === 'Team Lead' ? 'Manager' : 'Sales'})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamManagement;
