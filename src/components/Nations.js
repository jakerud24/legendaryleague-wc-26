import React, { useState } from 'react';
import { TEAMS } from '../data';
import { SQUADS } from '../squads';

const POS_LABELS = { gk: 'GK', def: 'DEF', mid: 'MID', att: 'ATT' };
const POS_COLORS = { gk: '#f59e0b', def: '#3b82f6', mid: '#10b981', att: '#ef4444' };

function SquadView({ teamId }) {
  const squad = SQUADS[teamId];
  if (!squad) return <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: '8px 0' }}>Squad data coming soon.</div>;

  return (
    <div style={{ marginTop: 10 }}>
      {['gk', 'def', 'mid', 'att'].map(pos => {
        const players = squad[pos] || [];
        if (players.length === 0) return null;
        return (
          <div key={pos} style={{ marginBottom: 8 }}>
            <div style={{
              display: 'inline-block', background: POS_COLORS[pos], color: '#fff',
              borderRadius: 4, padding: '1px 8px', fontSize: 9, fontFamily: 'var(--mono)',
              fontWeight: 700, marginBottom: 4, letterSpacing: '0.1em'
            }}>
              {POS_LABELS[pos]}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {players.map((p, i) => (
                <div key={i} style={{
                  background: 'var(--green-mid)', border: '1px solid var(--green-border)',
                  borderRadius: 6, padding: '4px 8px', fontSize: 11
                }}>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{p.name}</span>
                  {p.club && <span style={{ color: 'var(--text-muted)', fontSize: 10, marginLeft: 4 }}>{p.club}</span>}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Nations({ managers, getTeamPts, getTeamStats }) {
  const [expandedMgr, setExpandedMgr] = useState(null);
  const [expandedTeam, setExpandedTeam] = useState(null);

  // Build manager → teams list
  const mgrTeams = Object.entries(managers).map(([id, mgr]) => ({
    id, name: mgr.name, teams: (mgr.teams || []).map(tid => TEAMS.find(t => t.id === tid)).filter(Boolean)
  }));

  // Sort managers by score
  mgrTeams.sort((a, b) => {
    const aScore = a.teams.reduce((s, t) => s + getTeamPts(t.id), 0);
    const bScore = b.teams.reduce((s, t) => s + getTeamPts(t.id), 0);
    return bScore - aScore;
  });

  if (mgrTeams.length === 0) {
    return <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No managers set up yet.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {mgrTeams.map(mgr => {
        const mgrScore = mgr.teams.reduce((s, t) => s + getTeamPts(t.id), 0);
        const isOpen = expandedMgr === mgr.id;
        return (
          <div key={mgr.id} style={{
            background: 'var(--green-mid)', border: '1px solid var(--green-border)',
            borderRadius: 12, overflow: 'hidden'
          }}>
            {/* Manager header */}
            <div
              onClick={() => setExpandedMgr(isOpen ? null : mgr.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer' }}
            >
              <span style={{ fontFamily: 'var(--display)', fontSize: '1.2rem', color: 'var(--gold)', flex: 1 }}>{mgr.name}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text-muted)' }}>{mgr.teams.length} teams · {mgrScore}pts</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{isOpen ? '▲' : '▼'}</span>
            </div>

            {isOpen && (
              <div style={{ borderTop: '1px solid var(--green-border)', padding: '8px 16px 16px' }}>
                {mgr.teams.map(team => {
                  const stats = getTeamStats(team.id);
                  const pts = getTeamPts(team.id);
                  const isTeamOpen = expandedTeam === team.id;
                  return (
                    <div key={team.id} style={{
                      background: 'var(--green-light)', border: '1px solid var(--green-border)',
                      borderRadius: 8, marginBottom: 6, overflow: 'hidden'
                    }}>
                      {/* Team row */}
                      <div
                        onClick={() => setExpandedTeam(isTeamOpen ? null : team.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', cursor: 'pointer' }}
                      >
                        <span style={{ fontSize: 20 }}>{team.flag}</span>
                        <span style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{team.name}</span>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                          {stats.played > 0 ? `${stats.played}GP · ${stats.wins}W ${stats.draws}D ${stats.losses}L · GD ${stats.gd >= 0 ? '+' : ''}${stats.gd} · ` : ''}
                        </span>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, color: 'var(--gold)' }}>{pts}pts</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: 11, marginLeft: 8 }}>{isTeamOpen ? '▲' : '▼'}</span>
                      </div>

                      {/* Squad view */}
                      {isTeamOpen && (
                        <div style={{ padding: '0 12px 12px', borderTop: '1px solid var(--green-border)' }}>
                          <SquadView teamId={team.id} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
