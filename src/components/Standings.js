import React, { useState } from 'react';
import { TEAMS } from '../data';

const ESPN_NAME_MAP_REVERSE = {
  mexico: 'Mexico', south_africa: 'South Africa', south_korea: 'Korea Republic',
  czechia: 'Czech Republic', canada: 'Canada', bosnia: 'Bosnia and Herzegovina',
  qatar: 'Qatar', switzerland: 'Switzerland', brazil: 'Brazil', morocco: 'Morocco',
  haiti: 'Haiti', scotland: 'Scotland', usa: 'United States', paraguay: 'Paraguay',
  australia: 'Australia', turkey: 'Turkey', germany: 'Germany', ivory_coast: "Ivory Coast",
  ecuador: 'Ecuador', curacao: 'Curaçao', netherlands: 'Netherlands', japan: 'Japan',
  sweden: 'Sweden', tunisia: 'Tunisia', belgium: 'Belgium', egypt: 'Egypt', iran: 'Iran',
  new_zealand: 'New Zealand', spain: 'Spain', cape_verde: 'Cape Verde', saudi_arabia: 'Saudi Arabia',
  uruguay: 'Uruguay', france: 'France', senegal: 'Senegal', iraq: 'Iraq', norway: 'Norway',
  argentina: 'Argentina', algeria: 'Algeria', austria: 'Austria', jordan: 'Jordan',
  colombia: 'Colombia', portugal: 'Portugal', dr_congo: 'DR Congo', uzbekistan: 'Uzbekistan',
  england: 'England', croatia: 'Croatia', ghana: 'Ghana', panama: 'Panama',
};

function getNextMatchForTeam(teamId, espnData, ownerMap) {
  if (!espnData?.events) return null;
  const espnName = ESPN_NAME_MAP_REVERSE[teamId];
  if (!espnName) return null;

  const upcoming = espnData.events.filter(e => {
    const state = e.status?.type?.state;
    if (state !== 'pre' && state !== 'in') return false;
    const comp = e.competitions?.[0];
    const competitors = comp?.competitors || [];
    return competitors.some(c => (c.team?.displayName || c.team?.name) === espnName);
  });

  if (upcoming.length === 0) return null;
  upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));
  const next = upcoming[0];
  const comp = next.competitions?.[0];
  const competitors = comp?.competitors || [];
  const opponent = competitors.find(c => (c.team?.displayName || c.team?.name) !== espnName);
  if (!opponent) return null;

  const oppName = opponent.team?.displayName || opponent.team?.name;
  const oppTeam = TEAMS.find(t => {
    const mappedName = ESPN_NAME_MAP_REVERSE[t.id];
    return mappedName === oppName;
  });
  const oppOwner = oppTeam ? ownerMap[oppTeam.id] : null;
  const isLive = next.status?.type?.state === 'in';

  return {
    date: next.date,
    isLive,
    oppFlag: oppTeam?.flag || '🏳',
    oppOwner,
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
                      <span key={tid} className={`team-pill ${pts === 0 ? '' : pts >= 6 ? 'deep' : 'alive'} ${stats.live ? 'pill-live' : ''}`}>
                        {team.flag}<span className="team-pill-name"> {team.name}</span>
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
                      const nextMatch = getNextMatchForTeam(tid, espnData, ownerMap);
                      return (
                        <div key={tid} className={`expand-team ${stats.live ? 'pill-live' : ''}`} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className="expand-team-flag">{team.flag}</span>
                            <div style={{ flex: 1 }}>
                              <div className="expand-team-name">
                                {team.name}{stats.live && <span className="live-dot" />}
                              </div>
                              {stats.played > 0 && (
                                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                                  {stats.played}GP · {stats.wins}W {stats.draws}D {stats.losses}L · GD {stats.gd >= 0 ? '+' : ''}{stats.gd}
                                </div>
                              )}
                            </div>
                            <span className="expand-team-pts">{pts}</span>
                          </div>
                          {nextMatch && (
                            <div style={{
                              marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--green-border)',
                              display: 'flex', alignItems: 'center', gap: 6, fontSize: 11
                            }}>
                              <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                                {nextMatch.isLive ? 'LIVE NOW' : 'NEXT'}
                              </span>
                              <span>{nextMatch.oppFlag}</span>
                              {nextMatch.oppOwner && (
                                <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{nextMatch.oppOwner}</span>
                              )}
                              <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--mono)', fontSize: 10, marginLeft: 'auto' }}>
                                {formatPST(nextMatch.date)}
                              </span>
                            </div>
                          )}
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
