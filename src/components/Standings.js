import React, { useState } from 'react';
import { TEAMS } from '../data';

export default function Standings({ managers, getSortedManagers, getTeamPts, getTeamStats }) {
  const [expanded, setExpanded] = useState(null);
  const sorted = getSortedManagers();
  const getTeam = (id) => TEAMS.find(t => t.id === id);

  const getManagerGP = (mgr) => {
    if (!mgr?.teams) return 0;
    return mgr.teams.reduce((sum, tid) => sum + (getTeamStats(tid).played || 0), 0);
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
        SCORING: 3pts WIN · 1pt DRAW · 1pt ET/PENS LOSS · 0pts REG LOSS · FINAL +1 BONUS · TIEBREAKER: GD → GF
      </div>
      <div className="standings-list">
        {sorted.map((mgr, idx) => {
          const isExpanded = expanded === mgr.id;
          const gp = getManagerGP(mgr);
          return (
            <div key={mgr.id} className={`manager-card ${idx === 0 && mgr.score > 0 ? 'leader' : ''}`}
              onClick={() => setExpanded(isExpanded ? null : mgr.id)}>
              <div className="manager-card-header">
                <span className={`pick-number ${idx < 3 ? 'top' : ''}`}>#{idx + 1}</span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="manager-name">{mgr.name}</span>
                  {gp > 0 && (
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)' }}>{gp} GP</span>
                  )}
                </div>
                <div className="manager-teams-inline">
                  {(mgr.teams || []).map(tid => {
                    const team = getTeam(tid);
                    if (!team) return null;
                    const pts = getTeamPts(tid);
                    const stats = getTeamStats(tid);
                    return (
                      <span key={tid} className={`team-pill ${pts === 0 ? '' : pts >= 6 ? 'deep' : 'alive'}`}>
                        {team.flag} {team.name}
                        {stats.played > 0 && <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', marginLeft: 2 }}>{stats.played}GP</span>}
                        <span className="team-pill-pts">{pts}</span>
                      </span>
                    );
                  })}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="manager-total">{mgr.score}</div>
                  {mgr.gd !== 0 && (
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                      GD {mgr.gd >= 0 ? '+' : ''}{mgr.gd}
                    </div>
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="manager-expand">
                  <div className="expand-row">
                    {(mgr.teams || []).map(tid => {
                      const team = getTeam(tid);
                      if (!team) return null;
                      const pts = getTeamPts(tid);
                      const stats = getTeamStats(tid);
                      return (
                        <div key={tid} className="expand-team">
                          <span className="expand-team-flag">{team.flag}</span>
                          <div>
                            <div className="expand-team-name">{team.name}</div>
                            {stats.played > 0 && (
                              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                                {stats.played}GP · {stats.wins}W {stats.draws}D {stats.losses}L · GD {stats.gd >= 0 ? '+' : ''}{stats.gd}
                              </div>
                            )}
                          </div>
                          <span className="expand-team-pts">{pts}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="expand-meta">
                    {mgr.score} pts · {gp} GP · GD {mgr.gd >= 0 ? '+' : ''}{mgr.gd} · GF {mgr.gf} · Draft pick order: #{idx + 1}
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
