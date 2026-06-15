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
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 16, letterSpacing: '0.08em' }}>
          SORTED BY PTS · GD · GF WITHIN EACH GROUP
        </div>
        <div className="groups-grid">
          {GROUPS.map(group => {
            const teams = TEAMS.filter(t => t.group === group);
            // Sort by pts desc, then GD desc, then GF desc
            const sorted = [...teams].sort((a, b) => {
              const aStats = getTeamStats(a.id);
              const bStats = getTeamStats(b.id);
              if (bStats.points !== aStats.points) return bStats.points - aStats.points;
              if (bStats.gd !== aStats.gd) return bStats.gd - aStats.gd;
              return bStats.gf - aStats.gf;
            });

            return (
              <div key={group} className="group-card">
                <div className="group-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>GROUP {group}</span>
                  <span style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>GP · GD · PTS</span>
                </div>
                {sorted.map((team, pos) => {
                  const stats = getTeamStats(team.id);
                  const pts = getTeamPts(team.id);
                  const owner = allAssigned[team.id];
                  const isTop2 = pos < 2 && stats.played > 0;
                  return (
                    <div key={team.id} className="group-team-row" style={{
                      borderLeft: isTop2 ? '2px solid var(--gold)' : '2px solid transparent',
                      opacity: stats.played === 0 ? 0.6 : 1,
                    }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', minWidth: 12 }}>{pos + 1}</span>
                      <span className="group-team-flag">{team.flag}</span>
                      <span className="group-team-name" style={{ flex: 1 }}>{team.name}</span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', minWidth: 60, textAlign: 'right' }}>
                        {stats.played > 0 ? `${stats.played} · ${stats.gd >= 0 ? '+' : ''}${stats.gd} · ` : ''}
                        <span style={{ color: pts > 0 ? 'var(--gold)' : 'var(--text-muted)', fontWeight: pts > 0 ? 700 : 400 }}>{pts}</span>
                      </span>
                      {owner && <span className="group-team-owner" style={{ marginLeft: 4 }}>{owner}</span>}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
