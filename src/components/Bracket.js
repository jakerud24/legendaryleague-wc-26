import React from 'react';
import { TEAMS } from '../data';

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L'];

export default function Bracket({ managers, getTeamPts, getTeamStats }) {
  const allAssigned = Object.values(managers).reduce((acc, mgr) => {
    (mgr.teams || []).forEach(tid => { acc[tid] = mgr.name; });
    return acc;
  }, {});

  return (
    <div>
      <div className="bracket-section">
        <h2 className="bracket-section-title">⚽ Group Stage</h2>
        <div className="groups-grid">
          {GROUPS.map(group => (
            <div key={group} className="group-card">
              <div className="group-card-header">GROUP {group}</div>
              {TEAMS.filter(t => t.group === group).map(team => {
                const stats = getTeamStats(team.id);
                const pts = getTeamPts(team.id);
                return (
                  <div key={team.id} className="group-team-row">
                    <span className="group-team-flag">{team.flag}</span>
                    <span className="group-team-name">{team.name}</span>
                    {pts > 0 && <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--gold)' }}>{pts}pts</span>}
                    {allAssigned[team.id] && <span className="group-team-owner">{allAssigned[team.id]}</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
