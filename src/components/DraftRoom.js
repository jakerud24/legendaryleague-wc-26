import React, { useState } from 'react';
import { TEAMS } from '../data';

const PASSWORD = 'legendary2026';
const NUM_MANAGERS = 8;
const TEAMS_PER_MANAGER = 6;

const MATCH_RESULT_OPTIONS = [
  { value: '', label: '— No result —' },
  { value: 'W', label: '✅ Win (+3)' },
  { value: 'D', label: '➖ Draw (+1)' },
  { value: 'ET', label: '⏱ ET/Pens Loss (+1)' },
  { value: 'L', label: '❌ Loss (+0)' },
  { value: 'WF', label: '🏆 Final Win (+4)' },
  { value: 'EF', label: '🥈 Final ET/Pens Loss (+2)' },
  { value: 'LF', label: '🥈 Final Reg Loss (+1)' },
];

export function calculateTeamStats(results) {
  if (!results) return { points: 0, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, gd: 0 };
  let points = 0, played = 0, wins = 0, draws = 0, losses = 0, gf = 0, ga = 0;
  Object.values(results).forEach(r => {
    if (!r || !r.result) return;
    played++;
    const gfVal = parseInt(r.gf) || 0;
    const gaVal = parseInt(r.ga) || 0;
    gf += gfVal;
    ga += gaVal;
    if (r.result === 'W' || r.result === 'WF') { points += r.result === 'WF' ? 4 : 3; wins++; }
    else if (r.result === 'D' || r.result === 'ET' || r.result === 'EF') { points += r.result === 'EF' ? 2 : 1; draws++; }
    else if (r.result === 'L' || r.result === 'LF') { points += r.result === 'LF' ? 1 : 0; losses++; }
  });
  return { points, played, wins, draws, losses, gf, ga, gd: gf - ga };
}

export default function DraftRoom({ managers, setManagers, matchResults, setMatchResults }) {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('ll_authed') === '1');
  const [pw, setPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [newManagerName, setNewManagerName] = useState('');
  const [activeSection, setActiveSection] = useState('managers');

  const tryAuth = () => {
    if (pw === PASSWORD) { sessionStorage.setItem('ll_authed', '1'); setAuthed(true); }
    else setPwError('Wrong password.');
  };

  const allAssignedTeams = Object.values(managers).flatMap(m => m.teams || []);
  const addManager = () => {
    if (!newManagerName.trim() || Object.keys(managers).length >= NUM_MANAGERS) return;
    const id = `mgr_${Date.now()}`;
    setManagers(prev => ({ ...prev, [id]: { name: newManagerName.trim(), teams: [] } }));
    setNewManagerName('');
  };
  const removeManager = (id) => setManagers(prev => { const next = { ...prev }; delete next[id]; return next; });
  const updateManagerName = (id, name) => setManagers(prev => ({ ...prev, [id]: { ...prev[id], name } }));
  const assignTeam = (mgrId, slot, teamId) => {
    setManagers(prev => {
      const teams = [...(prev[mgrId].teams || [])];
      if (teamId) teams[slot] = teamId;
      else teams.splice(slot, 1);
      return { ...prev, [mgrId]: { ...prev[mgrId], teams: teams.filter(Boolean) } };
    });
  };
  const availableTeams = (currentTeamId) =>
    TEAMS.filter(t => t.id === currentTeamId || !allAssignedTeams.includes(t.id));

  const assignedTeams = TEAMS.filter(t => allAssignedTeams.includes(t.id));

  const updateMatch = (teamId, matchKey, field, value) => {
    setMatchResults(prev => ({
      ...prev,
      [teamId]: {
        ...(prev[teamId] || {}),
        [matchKey]: { ...(prev[teamId]?.[matchKey] || {}), [field]: value }
      }
    }));
  };

  const addMatchSlot = (teamId) => {
    const existing = matchResults[teamId] || {};
    const nextNum = Object.keys(existing).length + 1;
    setMatchResults(prev => ({
      ...prev,
      [teamId]: { ...(prev[teamId] || {}), [`m${nextNum}`]: { result: '', gf: '', ga: '' } }
    }));
  };

  const removeLastMatch = (teamId) => {
    const existing = { ...(matchResults[teamId] || {}) };
    const keys = Object.keys(existing);
    if (keys.length === 0) return;
    delete existing[keys[keys.length - 1]];
    setMatchResults(prev => ({ ...prev, [teamId]: existing }));
  };

  if (!authed) {
    return (
      <div className="draft-room">
        <div className="draft-password-gate">
          <h2>DRAFT ROOM</h2>
          <p>Commissioner access only</p>
          <input className="input-field" type="password" placeholder="Enter password" value={pw}
            onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && tryAuth()} />
          <button className="btn-primary" onClick={tryAuth}>Enter</button>
          {pwError && <p className="draft-error">{pwError}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="draft-room">
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button onClick={() => setActiveSection('managers')} className={`tab-btn ${activeSection === 'managers' ? 'active' : ''}`}>👥 Managers</button>
        <button onClick={() => setActiveSection('scores')} className={`tab-btn ${activeSection === 'scores' ? 'active' : ''}`}>⚽ Match Results</button>
      </div>

      {activeSection === 'managers' && (
        <>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>
            {Object.keys(managers).length}/{NUM_MANAGERS} managers · {TEAMS_PER_MANAGER} teams each
          </div>
          <div className="draft-controls">
            <input className="input-field" style={{ width: 220, marginBottom: 0 }} type="text"
              placeholder="Manager name" value={newManagerName}
              onChange={e => setNewManagerName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addManager()} />
            <button className="btn-primary" style={{ width: 'auto' }} onClick={addManager}>+ Add Manager</button>
          </div>
          <div className="draft-grid">
            {Object.entries(managers).map(([id, mgr]) => (
              <div key={id} className="manager-slot">
                <input className="input-field" style={{ marginBottom: 10, fontSize: 13 }}
                  value={mgr.name} onChange={e => updateManagerName(id, e.target.value)} />
                {Array.from({ length: TEAMS_PER_MANAGER }).map((_, slot) => (
                  <select key={slot} className="team-select" value={mgr.teams?.[slot] || ''}
                    onChange={e => assignTeam(id, slot, e.target.value)}>
                    <option value="">— Pick {slot + 1} —</option>
                    {availableTeams(mgr.teams?.[slot]).map(t => (
                      <option key={t.id} value={t.id}>{t.flag} {t.name}</option>
                    ))}
                  </select>
                ))}
                <button style={{ background: 'none', border: '1px solid #e05252', color: '#e05252', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer', marginTop: 4 }}
                  onClick={() => removeManager(id)}>Remove</button>
              </div>
            ))}
          </div>
        </>
      )}

      {activeSection === 'scores' && (
        <>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 20, background: 'var(--green-light)', padding: '10px 14px', borderRadius: 8, lineHeight: 1.8 }}>
            WIN +3 · DRAW +1 · ET/PENS LOSS +1 · REG LOSS +0 · FINAL WIN +4 · FINAL ET/PENS +2 · FINAL REG LOSS +1 · 3RD PLACE = skip
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {assignedTeams.map(team => {
              const results = matchResults[team.id] || {};
              const stats = calculateTeamStats(results);
              const matchKeys = Object.keys(results);
              return (
                <div key={team.id} style={{ background: 'var(--green-mid)', border: '1px solid var(--green-border)', borderRadius: 10, padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: matchKeys.length > 0 ? 12 : 0 }}>
                    <span style={{ fontSize: 22 }}>{team.flag}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{team.name}</div>
                      {stats.played > 0 && (
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                          {stats.played}GP · GD {stats.gd >= 0 ? '+' : ''}{stats.gd} · GF {stats.gf} GA {stats.ga}
                        </div>
                      )}
                    </div>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 700, color: 'var(--gold)' }}>{stats.points}pts</span>
                    <button onClick={() => addMatchSlot(team.id)}
                      style={{ background: 'var(--gold)', color: '#0f1f0f', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                      + Game
                    </button>
                    {matchKeys.length > 0 && (
                      <button onClick={() => removeLastMatch(team.id)}
                        style={{ background: 'none', border: '1px solid #e05252', color: '#e05252', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>−</button>
                    )}
                  </div>
                  {matchKeys.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {matchKeys.map((key, idx) => {
                        const m = results[key] || {};
                        return (
                          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--green-light)', borderRadius: 6, padding: '6px 10px' }}>
                            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', minWidth: 20 }}>G{idx + 1}</span>
                            <select className="round-select" value={m.result || ''} onChange={e => updateMatch(team.id, key, 'result', e.target.value)}>
                              {MATCH_RESULT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)' }}>GF</span>
                            <input type="number" min="0" max="20" value={m.gf || ''}
                              onChange={e => updateMatch(team.id, key, 'gf', e.target.value)}
                              style={{ width: 40, background: 'var(--green-mid)', border: '1px solid var(--green-border)', borderRadius: 4, color: 'var(--text-primary)', fontFamily: 'var(--mono)', fontSize: 12, padding: '2px 6px', textAlign: 'center' }} />
                            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)' }}>GA</span>
                            <input type="number" min="0" max="20" value={m.ga || ''}
                              onChange={e => updateMatch(team.id, key, 'ga', e.target.value)}
                              style={{ width: 40, background: 'var(--green-mid)', border: '1px solid var(--green-border)', borderRadius: 4, color: 'var(--text-primary)', fontFamily: 'var(--mono)', fontSize: 12, padding: '2px 6px', textAlign: 'center' }} />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            {assignedTeams.length === 0 && (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 32 }}>Add managers and assign teams first.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
