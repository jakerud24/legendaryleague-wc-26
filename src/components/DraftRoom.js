import React, { useState } from 'react';
import { TEAMS, ROUND_LABELS, ROUND_ORDER } from '../data';

const PASSWORD = 'legendary2026';
const NUM_MANAGERS = 14;
const TEAMS_PER_MANAGER = 3;

export default function DraftRoom({ managers, setManagers, roundStatuses, setRoundStatuses }) {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('ll_authed') === '1');
  const [pw, setPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [newManagerName, setNewManagerName] = useState('');

  const tryAuth = () => {
    if (pw === PASSWORD) {
      sessionStorage.setItem('ll_authed', '1');
      setAuthed(true);
    } else {
      setPwError('Wrong password. Try again.');
    }
  };

  const allAssignedTeams = Object.values(managers).flatMap(m => m.teams || []);

  const addManager = () => {
    if (!newManagerName.trim()) return;
    if (Object.keys(managers).length >= NUM_MANAGERS) return;
    const id = `mgr_${Date.now()}`;
    setManagers(prev => ({ ...prev, [id]: { name: newManagerName.trim(), teams: [] } }));
    setNewManagerName('');
  };

  const removeManager = (id) => {
    setManagers(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const updateManagerName = (id, name) => {
    setManagers(prev => ({ ...prev, [id]: { ...prev[id], name } }));
  };

  const assignTeam = (mgrId, slot, teamId) => {
    setManagers(prev => {
      const teams = [...(prev[mgrId].teams || [])];
      teams[slot] = teamId || undefined;
      return { ...prev, [mgrId]: { ...prev[mgrId], teams: teams.filter(Boolean) } };
    });
  };

  const updateRound = (teamId, round) => {
    setRoundStatuses(prev => ({ ...prev, [teamId]: round }));
  };

  const getTeamName = (id) => {
    const t = TEAMS.find(t => t.id === id);
    return t ? `${t.flag} ${t.name}` : '';
  };

  const availableTeams = (currentTeamId) =>
    TEAMS.filter(t => t.id === currentTeamId || !allAssignedTeams.includes(t.id));

  const assignedTeams = TEAMS.filter(t => allAssignedTeams.includes(t.id));

  if (!authed) {
    return (
      <div className="draft-room">
        <div className="draft-password-gate">
          <h2>DRAFT ROOM</h2>
          <p>Commissioner access only</p>
          <input
            className="input-field"
            type="password"
            placeholder="Enter password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && tryAuth()}
          />
          <button className="btn-primary" onClick={tryAuth}>Enter</button>
          {pwError && <p className="draft-error">{pwError}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="draft-room">
      <p className="draft-section-title">MANAGER SETUP</p>

      <div className="draft-controls">
        <input
          className="input-field"
          style={{ width: 220, marginBottom: 0 }}
          type="text"
          placeholder="Manager name"
          value={newManagerName}
          onChange={e => setNewManagerName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addManager()}
        />
        <button className="btn-primary" style={{ width: 'auto' }} onClick={addManager}>
          + Add Manager
        </button>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', alignSelf: 'center' }}>
          {Object.keys(managers).length}/{NUM_MANAGERS} managers
        </span>
      </div>

      <div className="draft-grid">
        {Object.entries(managers).map(([id, mgr]) => (
          <div key={id} className="manager-slot">
            <input
              className="input-field"
              style={{ marginBottom: 10, fontSize: 13 }}
              value={mgr.name}
              onChange={e => updateManagerName(id, e.target.value)}
            />
            {[0, 1, 2].map(slot => (
              <select
                key={slot}
                className="team-select"
                value={mgr.teams?.[slot] || ''}
                onChange={e => assignTeam(id, slot, e.target.value)}
              >
                <option value="">— Pick {slot + 1} —</option>
                {availableTeams(mgr.teams?.[slot]).map(t => (
                  <option key={t.id} value={t.id}>{t.flag} {t.name}</option>
                ))}
              </select>
            ))}
            <button
              style={{ background: 'none', border: '1px solid #e05252', color: '#e05252', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer', marginTop: 4 }}
              onClick={() => removeManager(id)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {assignedTeams.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <p className="draft-section-title">ROUND STATUS</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
            Update each team's current round as the tournament progresses.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
            {assignedTeams.map(team => (
              <div key={team.id} style={{
                background: 'var(--green-mid)', border: '1px solid var(--green-border)',
                borderRadius: 8, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10
              }}>
                <span style={{ fontSize: 20 }}>{team.flag}</span>
                <span style={{ flex: 1, fontSize: 13 }}>{team.name}</span>
                <select
                  className="round-select"
                  value={roundStatuses[team.id] || 'group'}
                  onChange={e => updateRound(team.id, e.target.value)}
                >
                  {ROUND_ORDER.map(r => (
                    <option key={r} value={r}>{ROUND_LABELS[r]}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
