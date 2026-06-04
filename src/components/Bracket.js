import React from 'react';
import { TEAMS, ROUND_LABELS } from '../data';

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L'];

export default function Bracket({ roundStatuses, managers }) {
  const allAssigned = Object.values(managers).reduce((acc, mgr) => {
    (mgr.teams || []).forEach(tid => { acc[tid] = mgr.name; });
    return acc;
  }, {});

  const getTeamsByGroup = (group) => TEAMS.filter(t => t.group === group);

  const isEliminated = (teamId) => {
    const round = roundStatuses[teamId] || 'group';
    return round === 'group';
  };

  const getAdvancedTeams = (minRound) => {
    const order = ['group','r32','r16','qf','sf','fourth','runner_up','champion'];
    return TEAMS.filter(t => {
      const r = roundStatuses[t.id] || 'group';
      return order.indexOf(r) >= order.indexOf(minRound);
    });
  };

  const r32Teams = getAdvancedTeams('r32');
  const r16Teams = getAdvancedTeams('r16');
  const qfTeams = getAdvancedTeams('qf');
  const sfTeams = getAdvancedTeams('sf');
  const finalTeams = getAdvancedTeams('runner_up');
  const champion = TEAMS.find(t => (roundStatuses[t.id] || '') === 'champion');

  return (
    <div>
      <div className="bracket-section">
        <h2 className="bracket-section-title">⚽ Group Stage</h2>
        <div className="groups-grid">
          {GROUPS.map(group => (
            <div key={group} className="group-card">
              <div className="group-card-header">GROUP {group}</div>
              {getTeamsByGroup(group).map(team => (
                <div key={team.id} className={`group-team-row ${isEliminated(team.id) ? 'eliminated' : ''}`}>
                  <span className="group-team-flag">{team.flag}</span>
                  <span className="group-team-name">{team.name}</span>
                  {allAssigned[team.id] && (
                    <span className="group-team-owner">{allAssigned[team.id]}</span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="bracket-section">
        <h2 className="bracket-section-title">🏆 Knockout Rounds</h2>

        {[
          { label: 'Round of 32', teams: r32Teams },
          { label: 'Round of 16', teams: r16Teams },
          { label: 'Quarterfinals', teams: qfTeams },
          { label: 'Semifinals', teams: sfTeams },
          { label: 'Final', teams: finalTeams },
        ].map(({ label, teams }) => (
          <div key={label} style={{ marginBottom: 24 }}>
            <div style={{
              fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em',
              color: 'var(--gold)', marginBottom: 10, textTransform: 'uppercase'
            }}>
              {label} · {teams.length} teams
            </div>
            {teams.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 12, fontStyle: 'italic' }}>
                TBD — teams advance as results come in
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {teams.map(team => (
                  <div key={team.id} style={{
                    background: 'var(--green-mid)', border: '1px solid var(--gold)',
                    borderRadius: 8, padding: '8px 12px', display: 'flex',
                    alignItems: 'center', gap: 8, fontSize: 13
                  }}>
                    <span style={{ fontSize: 18 }}>{team.flag}</span>
                    <span>{team.name}</span>
                    {allAssigned[team.id] && (
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
                        {allAssigned[team.id]}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {champion && (
          <div style={{
            background: 'var(--gold-dim)', border: '2px solid var(--gold)',
            borderRadius: 12, padding: '20px 24px', display: 'flex',
            alignItems: 'center', gap: 16, marginTop: 16
          }}>
            <span style={{ fontSize: '3rem' }}>{champion.flag}</span>
            <div>
              <div style={{ fontFamily: 'var(--display)', fontSize: '2rem', color: 'var(--gold)' }}>
                {champion.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                🏆 2026 World Cup Champion
                {allAssigned[champion.id] && ` · Owned by ${allAssigned[champion.id]}`}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
