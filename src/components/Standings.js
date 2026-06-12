import React, { useState } from 'react';
import { TEAMS } from '../data';

export default function Standings({ managers, getSortedManagers, getTeamPts, getTeamData }) {
  const [expanded, setExpanded] = useState(null);
  const sorted = getSortedManagers();
  const getTeam = (id) => TEAMS.find(t => t.id === id);

  const getPillClass = (teamId) => {
    const pts = getTeamPts(teamId);
    if (pts === 0) return 'team-pill';
    if (pts >= 6) return 'team-pill deep';
    return 'team-pill alive';
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
    <div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text-muted)', marginBottom: 16, letterSpacing: '0.1em' }}>
        SCORING: 3pts WIN · 1pt DRAW · 1pt ET/PENS LOSS · 0pts REG LOSS · FINAL +1 BONUS · 3RD PLACE EXCLUDED
      </div>
      <div className="standings-list">
        {sorted.map((mgr, idx) => {
          const isExpanded = expanded === mgr.id;
          return (
            <div key={mgr.id} className={`manager-card ${idx === 0 && mgr.score > 0 ? 'leader' : ''}`}
              onClick={() => setExpanded(isExpanded ? null : mgr.id)}>
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
                        <span className="team-pill-pts">{getTeamPts(tid)}</span>
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
                      const pts = getTeamPts(tid);
                      const data = getTeamData(tid);
                      return (
                        <div key={tid} className="expand-team">
                          <span className="expand-team-flag">{team.flag}</span>
                          <div>
                            <div className="expand-team-name">{team.name}</div>
                            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                              {data.played}GP · {data.wins}W {data.draws}D {data.losses}L
                            </div>
                          </div>
                          <span className="expand-team-pts">{pts}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="expand-meta">
                    {mgr.score} pts total · Draft pick order: #{idx + 1}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
