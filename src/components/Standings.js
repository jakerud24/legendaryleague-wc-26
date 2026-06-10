import React, { useState } from 'react';
import { TEAMS } from '../data';

export default function Standings({ managers, getSortedManagers, getTeamPts, teamPoints }) {
  const [expanded, setExpanded] = useState(null);
  const sorted = getSortedManagers();
  const getTeam = (id) => TEAMS.find(t => t.id === id);

  const getPillClass = (teamId) => {
    const pts = getTeamPts(teamId);
    if (pts === 0) return 'team-pill eliminated';
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
            <div key={mgr.id} className={`manager-card ${idx === 0 ? 'leader' : ''}`} onClick={() => setExpanded(isExpanded ? null : mgr.id)}>
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
                      const data = teamPoints[tid] || {};
                      return (
                        <div key={tid} className="expand-team">
                          <span className="expand-team-flag">{team.flag}</span>
                          <div>
                            <div className="expand-team-name">{team.name}</div>
                            <div className="expand-team-round" style={{ fontFamily: 'var(--mono)', fontSize: 10 }}>
                              {data.played || 0}GP · {data.wins || 0}W {data.draws || 0}D {data.losses || 0}L
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
                              GD: {(data.gd || 0) >= 0 ? '+' : ''}{data.gd || 0}
                            </div>
                          </div>
                          <span className="expand-team-pts">{pts}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="expand-meta">
                    GD: {mgr.gd >= 0 ? '+' : ''}{mgr.gd} · {mgr.score} pts · Draft pick order: #{idx + 1}
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
