import React, { useState } from 'react';
import { TEAMS } from '../data';
import { mapName, getKnockoutMatches, getGoalsForEvent } from '../espn';

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L'];

const ROUND_ORDER = ['round-of-32','round-of-16','quarterfinals','semifinals','final'];
const ROUND_LABELS = {
  'round-of-32': 'R32',
  'round-of-16': 'R16',
  'quarterfinals': 'QF',
  'semifinals': 'SF',
  'final': '🏆 Final',
};

function getRoundKey(slug) {
  for (const key of ROUND_ORDER) {
    if (slug.includes(key.replace('round-of-', 'round-of-'))) return key;
    if (slug.includes(key)) return key;
  }
  // handle espn slugs like "knockout-round-of-32"
  if (slug.includes('32')) return 'round-of-32';
  if (slug.includes('16')) return 'round-of-16';
  if (slug.includes('quarter')) return 'quarterfinals';
  if (slug.includes('semi')) return 'semifinals';
  if (slug.includes('final')) return 'final';
  return slug;
}

function TeamRow({ teamName, teamId, owner, score, isWinner, isEliminated }) {
  const team = teamId ? TEAMS.find(t => t.id === teamId) : null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px',
      background: isWinner ? 'rgba(212,124,42,0.15)' : 'transparent',
      opacity: isEliminated ? 0.45 : 1,
      minWidth: 0,
    }}>
      <span style={{ fontSize: 15, flexShrink: 0 }}>{team?.flag || '🏳'}</span>
      <span style={{
        flex: 1, fontSize: 11, fontWeight: owner ? 600 : 400,
        color: owner ? 'var(--gold)' : 'var(--text-primary)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {owner || (teamName ? teamName.split(' ').slice(-1)[0] : '?')}
      </span>
      {score !== null && score !== undefined && (
        <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{score}</span>
      )}
      {isWinner && <span style={{ fontSize: 10, flexShrink: 0 }}>✓</span>}
    </div>
  );
}

function MatchBox({ event, ownerMap, onExpand, isExpanded }) {
  const comp = event?.competitions?.[0];
  if (!comp) return (
    <div style={{ width: 160, background: 'var(--green-mid)', border: '1px dashed var(--green-border)', borderRadius: 8, padding: '8px', opacity: 0.4, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
      TBD
    </div>
  );

  const competitors = comp.competitors || [];
  const home = competitors.find(c => c.homeAway === 'home');
  const away = competitors.find(c => c.homeAway === 'away');

  const state = event.status?.type?.state;
  const isPost = state === 'post';
  const isLive = state === 'in';
  const isPre = state === 'pre';

  const homeName = home?.team?.displayName || home?.team?.name || 'TBD';
  const awayName = away?.team?.displayName || away?.team?.name || 'TBD';
  const homeId = mapName(homeName);
  const awayId = mapName(awayName);
  const homeOwner = homeId ? ownerMap[homeId] : null;
  const awayOwner = awayId ? ownerMap[awayId] : null;
  const homeScore = isPost || isLive ? parseInt(home?.score) || 0 : null;
  const awayScore = isPost || isLive ? parseInt(away?.score) || 0 : null;
  const shortDetail = comp.status?.type?.shortDetail || '';
  const wentET = shortDetail.includes('AET') || shortDetail.includes('Pen');
  const venueAddr = comp.venue?.address;
  const venue = venueAddr?.city || null;

  const kickoff = new Date(event.date).toLocaleDateString('en-US', {
    month: 'numeric', day: 'numeric', timeZone: 'America/Los_Angeles'
  }) + ' ' + new Date(event.date).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles'
  });

  const goals = isPost ? getGoalsForEvent(event) : [];

  return (
    <div style={{ width: 170 }}>
      <div
        onClick={isPost ? onExpand : undefined}
        style={{
          background: 'var(--green-mid)',
          border: `1px solid ${isLive ? '#e05252' : isExpanded ? 'var(--gold)' : 'var(--green-border)'}`,
          borderRadius: isExpanded ? '8px 8px 0 0' : 8,
          overflow: 'hidden',
          cursor: isPost ? 'pointer' : 'default',
        }}
      >
        <TeamRow
          teamName={homeName} teamId={homeId} owner={homeOwner}
          score={homeScore} isWinner={isPost && home?.winner}
          isEliminated={isPost && !home?.winner}
        />
        <div style={{ height: 1, background: 'var(--green-border)' }} />
        <TeamRow
          teamName={awayName} teamId={awayId} owner={awayOwner}
          score={awayScore} isWinner={isPost && away?.winner}
          isEliminated={isPost && !away?.winner}
        />
        <div style={{
          padding: '3px 8px', display: 'flex', justifyContent: 'space-between',
          fontSize: 9, fontFamily: 'var(--mono)', color: isLive ? '#e05252' : 'var(--text-muted)',
          background: 'var(--green-light)',
        }}>
          <span>{isLive ? '● LIVE' : isPost ? `FT${wentET ? ' (AET)' : ''}` : kickoff}</span>
          {venue && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 90, whiteSpace: 'nowrap' }}>{venue}</span>}
        </div>
      </div>
      {isExpanded && goals.length > 0 && (
        <div style={{
          border: '1px solid var(--gold)', borderTop: 'none', borderRadius: '0 0 8px 8px',
          background: 'var(--green-mid)', padding: '6px 8px',
        }}>
          {goals.map((g, i) => {
            const isHomeGoal = g.teamId === home?.team?.id;
            const flag = isHomeGoal ? (homeId ? TEAMS.find(t => t.id === homeId)?.flag : '🏳') : (awayId ? TEAMS.find(t => t.id === awayId)?.flag : '🏳');
            return (
              <div key={i} style={{ fontSize: 10, display: 'flex', gap: 4, alignItems: 'center', marginBottom: 2 }}>
                <span>{flag}</span>
                <span style={{ color: 'var(--text-primary)' }}>{g.scorer}</span>
                <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>{g.clock}</span>
                {g.ownGoal && <span style={{ color: '#e05252', fontSize: 9 }}>OG</span>}
                {g.penalty && <span style={{ color: 'var(--gold)', fontSize: 9 }}>PEN</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BracketView({ rounds, sortedRoundKeys, ownerMap }) {
  const [expandedId, setExpandedId] = useState(null);

  if (sortedRoundKeys.length === 0) return (
    <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '20px 0' }}>
      Knockout bracket not yet available.
    </div>
  );

  return (
    <div style={{ overflowX: 'auto', paddingBottom: 16 }}>
      <div style={{ display: 'flex', gap: 0, alignItems: 'flex-start', minWidth: 'max-content' }}>
        {sortedRoundKeys.map((roundKey, roundIdx) => {
          const matches = rounds[roundKey];
          const label = ROUND_LABELS[roundKey] || roundKey;
          const matchCount = matches.length;
          // Each later round has fewer matches — space them out vertically to align
          const totalSlots = Math.pow(2, sortedRoundKeys.length - 1 - roundIdx);
          const slotHeight = 90;

          return (
            <div key={roundKey} style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Round header */}
              <div style={{
                fontFamily: 'var(--display)', fontSize: 13, color: 'var(--gold)',
                letterSpacing: '0.1em', marginBottom: 8, padding: '0 12px', textAlign: 'center',
                width: 194,
              }}>
                {label}
              </div>
              {/* Match slots */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {Array.from({ length: totalSlots }).map((_, slotIdx) => {
                  const match = matches[slotIdx];
                  const spacer = slotIdx > 0;
                  return (
                    <div key={slotIdx} style={{ display: 'flex', alignItems: 'center' }}>
                      {/* Connecting line from previous round */}
                      {roundIdx > 0 && (
                        <div style={{
                          width: 12, height: slotHeight,
                          display: 'flex', alignItems: 'center',
                        }}>
                          <div style={{
                            width: 12, height: 1,
                            background: 'var(--green-border)',
                          }} />
                        </div>
                      )}
                      <div style={{
                        padding: '0 6px',
                        height: slotHeight,
                        display: 'flex', alignItems: 'center',
                      }}>
                        {match ? (
                          <MatchBox
                            event={match}
                            ownerMap={ownerMap}
                            isExpanded={expandedId === match.id}
                            onExpand={() => setExpandedId(expandedId === match.id ? null : match.id)}
                          />
                        ) : (
                          <div style={{
                            width: 170, height: 68,
                            background: 'var(--green-light)',
                            border: '1px dashed var(--green-border)',
                            borderRadius: 8,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--mono)',
                          }}>TBD</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
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

  // Group by round
  const rounds = {};
  koMatches.forEach(e => {
    const key = getRoundKey(e.season?.slug || '');
    if (!rounds[key]) rounds[key] = [];
    rounds[key].push(e);
  });

  const sortedRoundKeys = Object.keys(rounds).sort((a, b) => {
    const ai = ROUND_ORDER.indexOf(a);
    const bi = ROUND_ORDER.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return (
    <div>
      {/* Knockout bracket */}
      {sortedRoundKeys.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <h2 className="bracket-section-title" style={{ marginBottom: 16 }}>🏆 Knockout Bracket</h2>
          <BracketView rounds={rounds} sortedRoundKeys={sortedRoundKeys} ownerMap={ownerMap} />
        </div>
      )}

      {/* Group stage */}
      <h2 className="bracket-section-title" style={{ marginBottom: 12 }}>⚽ Group Stage</h2>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 16 }}>
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
