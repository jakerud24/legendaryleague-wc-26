import React from 'react';
import { TEAMS } from '../data';

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L'];

export default function Bracket({ managers, matchResults, getTeamPts }) {
  const allAssigned = Object.values(managers).reduce((acc, mgr) => {
    (mgr.teams || []).forEach(tid => { acc[tid] = mgr.name; });
    return acc;
  }, {});

  const getTeamsByGroup = (group) => TEAMS.filter(t => t.group === group);

  const getTeamResults = (teamId) => {
    const results = matchResults[teamId] || {};
    return Object.values(results).filter(Boolean);
  };

  const hasPlayed = (teamId) => getTeamResults(teamId).length > 0;

  return (
    <div>
      <div className="bracket-section">
        <h2 className="bracket-section-title">⚽ Group Stage</h2>
        <div className="groups-grid">
          {GROUPS.map(group => (
            <div key={group} className="group-card">
              <div className="group-card-header">GROUP {group}</div>
              {getTeamsByGroup(group).map(team => (
                <div key={team.id} className={`group-team-row ${!hasPlayed(team.id) ? '' : ''}`}>
                  <span className="group-team-flag">{team.flag}</span>
                  <span className="group-team-name">{team.name}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--gold)' }}>
                    {getTeamPts(team.id) > 0 ? `${getTeamPts(team.id)}pts` : ''}
                  </span>
                  {allAssigned[team.id] && (
                    <span className="group-team-owner">{allAssigned[team.id]}</span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
