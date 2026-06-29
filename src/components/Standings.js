import React, { useState } from 'react';
import { TEAMS } from '../data';
import { getGoalsForEvent } from '../espn';

const ESPN_NAME_MAP_REVERSE = {
  mexico: 'Mexico', south_africa: 'South Africa', south_korea: 'South Korea',
  czechia: 'Czechia', canada: 'Canada', bosnia: 'Bosnia-Herzegovina',
  qatar: 'Qatar', switzerland: 'Switzerland', brazil: 'Brazil', morocco: 'Morocco',
  haiti: 'Haiti', scotland: 'Scotland', usa: 'United States', paraguay: 'Paraguay',
  australia: 'Australia', turkey: 'Türkiye', germany: 'Germany', ivory_coast: 'Ivory Coast',
  ecuador: 'Ecuador', curacao: 'Curaçao', netherlands: 'Netherlands', japan: 'Japan',
  sweden: 'Sweden', tunisia: 'Tunisia', belgium: 'Belgium', egypt: 'Egypt', iran: 'Iran',
  new_zealand: 'New Zealand', spain: 'Spain', cape_verde: 'Cape Verde', saudi_arabia: 'Saudi Arabia',
  uruguay: 'Uruguay', france: 'France', senegal: 'Senegal', iraq: 'Iraq', norway: 'Norway',
  argentina: 'Argentina', algeria: 'Algeria', austria: 'Austria', jordan: 'Jordan',
  colombia: 'Colombia', portugal: 'Portugal', dr_congo: 'DR Congo', uzbekistan: 'Uzbekistan',
  england: 'England', croatia: 'Croatia', ghana: 'Ghana', panama: 'Panama',
};

// Some ESPN events use alternate name strings for the same team across different fixtures.
// This is a defensive list of all known aliases per team ID, checked in addition to the primary name above.
const ESPN_NAME_ALIASES = {
  dr_congo: ['DR Congo', 'Congo DR', 'Democratic Republic of Congo'],
  bosnia: ['Bosnia-Herzegovina', 'Bosnia and Herzegovina'],
  turkey: ['Türkiye', 'Turkey'],
  usa: ['United States', 'USA'],
  curacao: ['Curaçao', 'Curacao'],
  ivory_coast: ['Ivory Coast', "Côte d'Ivoire"],
};

function getAllNamesForTeam(teamId) {
  return ESPN_NAME_ALIASES[teamId] || [ESPN_NAME_MAP_REVERSE[teamId]];
}

function getTeamIdForEspnName(espnName) {
  for (const [id, primary] of Object.entries(ESPN_NAME_MAP_REVERSE)) {
    if (primary === espnName) return id;
  }
  for (const [id, aliases] of Object.entries(ESPN_NAME_ALIASES)) {
    if (aliases.includes(espnName)) return id;
  }
  return null;
}

const DISPLAY_NAME_OVERRIDE = {
  bosnia: 'Bosnia',
};

function getNextMatchForTeam(teamId, espnData, ownerMap) {
  if (!espnData?.events) return null;
  const myNames = getAllNamesForTeam(teamId);
  if (!myNames || myNames.length === 0) return null;

  const upcoming = espnData.events.filter(e => {
    const state = e.status?.type?.state;
    if (state !== 'pre' && state !== 'in') return false;
    const comp = e.competitions?.[0];
    const competitors = comp?.competitors || [];
    return competitors.some(c => myNames.includes(c.team?.displayName || c.team?.name));
  });

  if (upcoming.length === 0) return null;
  upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));
  const next = upcoming[0];
  const comp = next.competitions?.[0];
  const competitors = comp?.competitors || [];
  const opponent = competitors.find(c => !myNames.includes(c.team?.displayName || c.team?.name));
  if (!opponent) return null;

  const oppName = opponent.team?.displayName || opponent.team?.name;
  const oppTeamId = getTeamIdForEspnName(oppName);
  const oppTeam = oppTeamId ? TEAMS.find(t => t.id === oppTeamId) : null;
  const oppOwner = oppTeam ? ownerMap[oppTeam.id] : null;
  const isLive = next.status?.type?.state === 'in';

  return {
    date: next.date,
    isLive,
    oppFlag: oppTeam?.flag || '🏳',
    oppName: oppTeam ? (DISPLAY_NAME_OVERRIDE[oppTeam.id] || oppTeam.name) : oppName,
    oppOwner,
    venue: comp?.venue?.address?.city || comp?.venue?.fullName || null,
  };
}

function getLastMatchForTeam(teamId, espnData, ownerMap) {
  if (!espnData?.events) return null;
  const myNames = getAllNamesForTeam(teamId);
  if (!myNames || myNames.length === 0) return null;

  const finished = espnData.events.filter(e => {
    const state = e.status?.type?.state;
    if (state !== 'post') return false;
    const comp = e.competitions?.[0];
    const competitors = comp?.competitors || [];
    return competitors.some(c => myNames.includes(c.team?.displayName || c.team?.name));
  });

  if (finished.length === 0) return null;
  finished.sort((a, b) => new Date(b.date) - new Date(a.date));
  const last = finished[0];
  const comp = last.competitions?.[0];
  const competitors = comp?.competitors || [];
  const me = competitors.find(c => myNames.includes(c.team?.displayName || c.team?.name));
  const opponent = competitors.find(c => !myNames.includes(c.team?.displayName || c.team?.name));
  if (!opponent || !me) return null;

  const oppName = opponent.team?.displayName || opponent.team?.name;
  const oppTeamId = getTeamIdForEspnName(oppName);
  const oppTeam = oppTeamId ? TEAMS.find(t => t.id === oppTeamId) : null;
  const oppOwner = oppTeam ? ownerMap[oppTeam.id] : null;

  const myScore = parseInt(me.score) || 0;
  const oppScore = parseInt(opponent.score) || 0;
  const goals = getGoalsForEvent(last);

  return {
    date: last.date,
    oppFlag: oppTeam?.flag || '🏳',
    oppName: oppTeam ? (DISPLAY_NAME_OVERRIDE[oppTeam.id] || oppTeam.name) : oppName,
    oppOwner,
    myScore,
    oppScore,
    goals,
    myTeamId: me.team?.id,
  };
}

function formatPST(dateStr) {
  const d = new Date(dateStr);
  const datePart = d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', timeZone: 'America/Los_Angeles' });
  const timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles' });
  return `${datePart} @ ${timePart} PT`;
}

export default function Standings({ managers, getSortedManagers, getTeamPts, getTeamStats, espnData }) {
  const [expanded, setExpanded] = useState(null);
  const [expandedLastMatch, setExpandedLastMatch] = useState(null);
  const sorted = getSortedManagers();
  const getTeam = (id) => TEAMS.find(t => t.id === id);

  const ownerMap = {};
  Object.values(managers).forEach(mgr => {
    (mgr.teams || []).forEach(tid => { ownerMap[tid] = mgr.name; });
  });

  const getManagerGP = (mgr) => {
    if (!mgr?.teams) return 0;
    return mgr.teams.reduce((sum, tid) => sum + (getTeamStats(tid).played || 0), 0);
  };

  const managerHasLive = (mgr) => (mgr.teams || []).some(tid => getTeamStats(tid).live);

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
          const isLive = managerHasLive(mgr);
          const aliveCount = (mgr.teams || []).filter(tid => !getTeamStats(tid).eliminated).length;
          const totalTeams = (mgr.teams || []).length;
          return (
            <div key={mgr.id} className={`manager-card ${idx === 0 && mgr.score > 0 ? 'leader' : ''} ${isLive ? 'live-card' : ''}`}
              onClick={() => setExpanded(isExpanded ? null : mgr.id)}>
              <div className="manager-card-header">
                <span className={`pick-number ${idx < 3 ? 'top' : ''}`}>#{idx + 1}</span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="manager-name">
                    {mgr.name}
                    {isLive && <span className="live-dot" />}
                  </span>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {gp > 0 && (
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)' }}>{gp} GP</span>
                    )}
                    {totalTeams > 0 && (
                      <span style={{
                        fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700,
                        color: aliveCount === 0 ? '#e05252' : aliveCount < totalTeams ? 'var(--gold)' : 'var(--text-muted)',
                      }}>
                        {aliveCount}/{totalTeams} Alive
                      </span>
                    )}
                  </div>
                </div>
                <div className="manager-teams-inline">
                  {(mgr.teams || []).map(tid => {
                    const team = getTeam(tid);
                    if (!team) return null;
                    const pts = getTeamPts(tid);
                    const stats = getTeamStats(tid);
                    const displayName = DISPLAY_NAME_OVERRIDE[tid] || team.name;
                    const isEliminated = !!stats.eliminated;
                    return (
                      <span key={tid} className={`team-pill ${pts === 0 ? '' : pts >= 6 ? 'deep' : 'alive'} ${stats.live ? 'pill-live' : ''} ${isEliminated ? 'pill-eliminated' : ''}`}>
                        <span style={{ position: 'relative', display: 'inline-block' }}>
                          {team.flag}
                          {isEliminated && (
                            <span style={{
                              position: 'absolute', inset: 0,
                              background: 'rgba(0,0,0,0.55)',
                              borderRadius: 2,
                              pointerEvents: 'none',
                            }} />
                          )}
                        </span>
                        <span className="team-pill-name"> {displayName}</span>
                        {stats.live && <span className="pill-live-badge">LIVE</span>}
                        {stats.played > 0 && <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', marginLeft: 2 }}>{stats.played}GP</span>}
                        <span className="team-pill-pts">{pts}</span>
                      </span>
                    );
                  })}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="manager-total">{mgr.score}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                    GD {mgr.gd >= 0 ? '+' : ''}{mgr.gd}
                  </div>
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
                      const displayName = DISPLAY_NAME_OVERRIDE[tid] || team.name;
                      const nextMatch = getNextMatchForTeam(tid, espnData, ownerMap);
                      const lastMatch = getLastMatchForTeam(tid, espnData, ownerMap);
                      const lastMatchKey = `${tid}-last`;
                      const isLastExpanded = expandedLastMatch === lastMatchKey;
                      return (
                        <div key={tid} className={`expand-team ${stats.live ? 'pill-live' : ''}`} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className="expand-team-flag">{team.flag}</span>
                            <div style={{ flex: 1 }}>
                              <div className="expand-team-name">
                                {displayName}{stats.live && <span className="live-dot" />}
                              </div>
                              {stats.played > 0 && (
                                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                                  {stats.played}GP · {stats.wins}W {stats.draws}D {stats.losses}L · GD {stats.gd >= 0 ? '+' : ''}{stats.gd}
                                </div>
                              )}
                            </div>
                            <span className="expand-team-pts">{pts}</span>
                          </div>
                          {lastMatch && (
                            <div
                              onClick={(e) => { e.stopPropagation(); setExpandedLastMatch(isLastExpanded ? null : lastMatchKey); }}
                              style={{
                                marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--green-border)',
                                display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, cursor: 'pointer'
                              }}
                            >
                              <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                                LAST
                              </span>
                              <span>{lastMatch.oppFlag}</span>
                              <span style={{ color: lastMatch.oppOwner ? 'var(--gold)' : 'var(--text-secondary)', fontWeight: lastMatch.oppOwner ? 600 : 400 }}>
                                {lastMatch.oppOwner || lastMatch.oppName}
                              </span>
                              <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
                                {lastMatch.myScore}–{lastMatch.oppScore}
                              </span>
                              <span style={{ color: 'var(--text-muted)', fontSize: 9, marginLeft: 'auto' }}>
                                {isLastExpanded ? '▲' : '▼'}
                              </span>
                            </div>
                          )}
                          {isLastExpanded && lastMatch && (
                            <div style={{ paddingTop: 4 }}>
                              {lastMatch.goals.length === 0 ? (
                                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>No goals scored.</div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                  {lastMatch.goals.map((g, i) => (
                                    <div key={i} style={{ fontSize: 10, color: g.teamId === lastMatch.myTeamId ? 'var(--gold)' : 'var(--text-secondary)' }}>
                                      {g.teamId === lastMatch.myTeamId ? team.flag : lastMatch.oppFlag} {g.scorer}
                                      <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--mono)', marginLeft: 4 }}>{g.clock}</span>
                                      {g.ownGoal && <span style={{ color: '#e05252', fontSize: 9, marginLeft: 4 }}>OG</span>}
                                      {g.penalty && <span style={{ color: 'var(--gold)', fontSize: 9, marginLeft: 4 }}>PEN</span>}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                          {nextMatch ? (
                            <div style={{
                              marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--green-border)',
                              display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, flexWrap: 'wrap'
                            }}>
                              <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                                {nextMatch.isLive ? 'LIVE NOW' : 'NEXT'}
                              </span>
                              <span>{nextMatch.oppFlag}</span>
                              <span style={{ color: nextMatch.oppOwner ? 'var(--gold)' : 'var(--text-secondary)', fontWeight: nextMatch.oppOwner ? 600 : 400 }}>
                                {nextMatch.oppOwner || nextMatch.oppName}
                              </span>
                              {nextMatch.venue && (
                                <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>· {nextMatch.venue}</span>
                              )}
                              <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--mono)', fontSize: 10, marginLeft: 'auto' }}>
                                {formatPST(nextMatch.date)}
                              </span>
                            </div>
                          ) : (
                            stats.played > 0 && (
                              <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--green-border)', fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
                                Tournament complete for this team
                              </div>
                            )
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="expand-meta">
                    {mgr.score} pts · {gp} GP · GD {mgr.gd >= 0 ? '+' : ''}{mgr.gd} · GF {mgr.gf}
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
