import React, { useState } from 'react';
import { TEAMS, ROUND_LABELS, SCORING } from '../data';

export default function Standings({ managers, getSortedManagers, getTeamPoints, roundStatuses, teamStats }) {
  const [expanded, setExpanded] = useState(null);
  const sorted = getSortedManagers();

  const getTeam = (id) => TEAMS.find(t => t.id === id);

  const getPillClass = (teamId) => {
    const pts = getTeamPoints(teamId);
    if (pts === 0) return 'team-pill eliminated';
    if (pts >= 4) return 'team-pill deep';
    return 'team-pill alive';
  };

  const getMaxPossible = (mgr) => {
    if (!mgr?.teams) return 0;
    return mgr.teams.reduce((sum, tid) => {
      const current = getTeamPoints(tid);
      return sum + Math.max(current, 10);
    }, 0);
  };

  if (sorted.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>⚽</div>
        <p style={{ fontFamily: 'var(--display)', fontSize: '1.6rem', color: 'var(--gold)', marginBottom: '8px' }}>DRAFT PENDING</p>
        <p style={{ fontSize: '13px' }}>Head to Draft Room to set up your managers and teams.</p>
      </div>
    );
  }

  return (
    <div className="standings-list">
      {sorted.map((mgr, idx) => {
        const isExpanded = expanded === mgr.id;
        return (
          <div
            key={mgr.id}
            className={`manager-card ${idx === 0 ? 'leader' : ''}`}
            onClick={() => setExpanded(isExpanded ? null : mgr.id)}
          >
            <div className="manager-card-header">
              <span className={`pick-number ${idx < 3 ? 'top' : ''}`}>#{idx + 1}</span>
              <span className="manager-name">{mgr.name}</span>
              <div className="manager-teams-inline">
                {(mgr.teams || []).map(tid => {
                  const team = getTeam(tid);
                  if (!team) return null;
                  return (
                    <span key={tid} className={getPillClass(tid)}>
                      {team.flag} {team.name}
                      <span className="team-pill-pts">{getTeamPoints(tid)}</span>
                    </span>
                  );
                })}
              </div>
              <span className="manager-total">{mgr.score}</span>
            </div>

            {isExpanded && (
              <div className="manager-expand">
                <div className="expand-row">
                  {(mgr.teams || []).map(tid => {
                    const team = getTeam(tid);
                    if (!team) return null;
                    const pts = getTeamPoints(tid);
                    const round = roundStatuses[tid] || 'group';
                    const stats = teamStats[tid];
                    return (
                      <div key={tid} className="expand-team">
                        <span className="expand-team-flag">{team.flag}</span>
                        <div>
                          <div className="expand-team-name">{team.name}</div>
                          <div className="expand-team-round">{ROUND_LABELS[round]}</div>
                          {stats && (
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
                              GD: {stats.gd >= 0 ? '+' : ''}{stats.gd}
                            </div>
                          )}
                        </div>
                        <span className="expand-team-pts">{pts}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="expand-meta">
                  GD: {mgr.gd >= 0 ? '+' : ''}{mgr.gd} · Max possible: {getMaxPossible(mgr)} pts · Draft pick: #{idx + 1}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
