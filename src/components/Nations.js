import React from 'react';
import { TEAMS, CONFEDERATIONS, ROUND_LABELS } from '../data';

export default function Nations({ managers, roundStatuses, getTeamPoints }) {
  const allAssigned = Object.values(managers).reduce((acc, mgr) => {
    (mgr.teams || []).forEach(tid => { acc[tid] = mgr.name; });
    return acc;
  }, {});

  return (
    <div>
      {CONFEDERATIONS.map(conf => {
        const teams = TEAMS.filter(t => t.confederation === conf);
        if (teams.length === 0) return null;
        return (
          <div key={conf} className="nations-section">
            <div className="conf-title">{conf} ({teams.length})</div>
            <div className="nations-grid">
              {teams.map(team => {
                const owner = allAssigned[team.id];
                const pts = getTeamPoints(team.id);
                const round = roundStatuses[team.id];
                return (
                  <div key={team.id} className={`nation-card ${owner ? 'owned' : 'unowned'}`}>
                    <div className="nation-flag">{team.flag}</div>
                    <div className="nation-name">{team.name}</div>
                    <div className="nation-meta">GRP {team.group}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="nation-owner">{owner || 'Unowned'}</div>
                      {owner && <div className="nation-pts">{pts}pt{pts !== 1 ? 's' : ''}</div>}
                    </div>
                    {round && round !== 'group' && (
                      <div className="nation-round-badge">{ROUND_LABELS[round]}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
