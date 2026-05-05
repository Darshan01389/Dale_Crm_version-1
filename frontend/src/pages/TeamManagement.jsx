import React from 'react';

const TeamManagement = () => (
  <div style={{ padding: 40 }}>
    <h1 className="text-h1">Team Mgmt</h1>
    <p style={{ color: 'var(--text-muted)' }}>Manage your sales teams, reps, and assignments.</p>
    <div className="card" style={{ padding: 40, marginTop: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
      <h3>No teams created yet</h3>
      <p style={{ maxWidth: 300, margin: '0 auto 20px', color: 'var(--text-muted)' }}>
        Start by creating your first sales squad to enable Team Pulse and Kanban tracking.
      </p>
      <button className="btn-primary">Create Team →</button>
    </div>
  </div>
);

export default TeamManagement;
