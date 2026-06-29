import React, { useState } from 'react';
import { TEAMS } from '../data';
import { mapName, getKnockoutMatches } from '../espn';

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L'];

const ROUND_LABELS = {
  'round-of-32': 'Round of 32',
  'round-of-16': 'Round of 16',
  'quarterfinals': 'Quarterfinals',
  'semifinals': 'Semifinals',
  'final': 'Final',
};

function getRoundLabel(slug) {
  for (const [key, label] of Object.entries(ROUND_LABELS)) {
    if (slug.includes(key)) return label;
  }
  return slug;
}

function KOMatch({ event, ownerMap }) {
  const comp = event.competitions?.[0];
  const competitors = comp?.competitors || [];
  const home = competitors.find(c => c.homeAway === 'home');
  const away = competitors.find(c => c.homeAway === 'away');
  if (!home || !away) return null;

  const state = event.status?.type?.state;
  const isFinal = state === 'post';
  const isLive = state === 'in';
  const isPre = state === 'pre';

  const homeName = home.team?.displayName || home.team?.name;
  const awayName = away.team?.displayName || away.team?.name;
  const homeId = mapName(homeName);
  const awayId = mapName(awayName);
  const homeTeam = homeId ? TEAMS.find(t => t.id === homeId) : null;
  const awayTeam = awayId ? TEAMS.find(t => t.id === awayId) : null;
  const homeOwner = homeId ? ownerMap[homeId] : null;
  const awayOwner = awayId ? ownerMap[awayId] : null;
  const homeScore = parseInt(home.score) || 0;
  const awayScore = parseInt(away.score) || 0;
  const shortDetail = comp?.status?.type?.shortDetail || event.status?.type?.shortDetail || '';
  const wentET = shortDetail.includes('AET') || shortDetail.includes('Pen');
  const venue = comp?.venue?.fullName;

  const kickoffPST = new Date(event.date).toLocaleDateString('en-US', {
    month: 'numeric', day: 'numeric', timeZone: 'America/Los_Angeles'
  }) + ' ' + new Date(event.date).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles'
  }) + ' PT';

  const renderTeam = (team, teamName, owner, score, isWinner) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
      background: isWinner ? 'rgba(212,124,42,0.12)' : 'transparent',
      borderRadius: 6,
      opacity: isFinal && !isWinner ? 0.5 : 1,
    }}>
      <span style={{ fontSize: 18 }}>{team?.flag || '🏳'}</span>
      <span style={{ flex: 1, fontSize: 13, fontWeight: owner ? 600 : 400, color: owner ? 'var(--gold)' : 'var(--text-primary)' }}>
        {owner || teamName}
      </span>
      {(isFinal || isLive) && (
        <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 14 }}>{score}</span>
      )}
      {isWinner && isFinal && <span style={{ fontSize: 10 }}>✓</span>}
    </div>
  );

  return (
    <div style={{
      background: 'var(--green-mid)', border: `1px solid ${isLive ? '#e05252' : 'var(--green-border)'}`,
      borderRadius: 10, overflow: 'hidden', minWidth: 200
    }}>
      {renderTeam(homeTeam, homeName, homeOwner, homeScore, isFinal && home.winner)}
      <div style={{ height: 1, background: 'var(--green-border)' }} />
      {renderTeam(awayTeam, awayName, awayOwner, awayScore, isFinal && away.winner)}
      <div style={{ padding: '4px 10px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: isLive ? '#e05252' : 'var(--text-muted)', fontWeight: isLive ? 700 : 400 }}>
          {isLive ? '● LIVE' : isFinal ? `FT${wentET ? ' (AET)' : ''}` : kickoffPST}
        </span>
        {venue && <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)' }}>{venue}</span>}
      </div>
    </div>
  );
}

export default function Bracket({ managers, getTeamPts, getTeamStats, espnData }) {
  const ownerMap = {};
  Object.values(managers).forEach(mgr => {
    (mgr.teams || []).forEach(tid => { ownerMap[tid] = mgr.name; });
  });

  const koMatches = getKnockoutMatches(espnData || { events: [] });

  // Group KO matches by round slug
  const rounds = {};
  koMatches.forEach(e => {
    const slug = e.season?.slug || 'unknown';
    if (!rounds[slug]) rounds[slug] = [];
    rounds[slug].push(e);
  });

  const roundOrder = ['round-of-32', 'round-of-16', 'quarterfinals', 'semifinals', 'final'];
  const sortedRounds = Object.keys(rounds).sort((a, b) => {
    const ai = roundOrder.findIndex(r => a.includes(r));
    const bi = roundOrder.findIndex(r => b.includes(r));
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return (
    <div>
      {/* Knockout bracket */}
      {sortedRounds.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          {sortedRounds.map(slug => (
            <div key={slug} style={{ marginBottom: 24 }}>
              <h2 className="bracket-section-title" style={{ marginBottom: 12 }}>
                🏆 {getRoundLabel(slug)}
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {rounds[slug].map(e => (
                  <KOMatch key={e.id} event={e} ownerMap={ownerMap} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Group stage */}
      <h2 className="bracket-section-title" style={{ marginBottom: 12 }}>⚽ Group Stage</h2>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 16, letterSpacing: '0.08em' }}>
        SORTED BY PTS · GD · GF
      </div>
      <div className="groups-grid">
        {GROUPS.map(group => {
          const teams = TEAMS.filter(t => t.group === group);
          const sorted = [...teams].sort((a, b) => {
            const aS = getTeamStats(a.id);
            const bS = getTeamStats(b.id);
            if (bS.points !== aS.points) return bS.points - aS.points;
            if (bS.gd !== aS.gd) return bS.gd - aS.gd;
            return bS.gf - aS.gf;
          });

          return (
            <div key={group} className="group-card">
              <div className="group-card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>GROUP {group}</span>
                <span style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>GP · GD · PTS</span>
              </div>
              {sorted.map((team, pos) => {
                const stats = getTeamStats(team.id);
                const pts = getTeamPts(team.id);
                const owner = ownerMap[team.id];
                const isTop2 = pos < 2 && stats.played > 0;
                return (
                  <div key={team.id} className="group-team-row" style={{
                    borderLeft: isTop2 ? '2px solid var(--gold)' : '2px solid transparent',
                    opacity: stats.eliminated ? 0.4 : 1,
                  }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', minWidth: 12 }}>{pos + 1}</span>
                    <span className="group-team-flag">{team.flag}</span>
                    <span className="group-team-name" style={{ flex: 1 }}>{team.name}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', minWidth: 60, textAlign: 'right' }}>
                      {stats.played > 0 ? `${stats.played} · ${stats.gd >= 0 ? '+' : ''}${stats.gd} · ` : ''}
                      <span style={{ color: pts > 0 ? 'var(--gold)' : 'var(--text-muted)', fontWeight: pts > 0 ? 700 : 400 }}>{pts}</span>
                    </span>
                    {owner && <span className="group-team-owner">{owner}</span>}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
