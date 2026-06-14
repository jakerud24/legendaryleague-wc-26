import React from 'react';
import { TEAMS } from '../data';

function getTeamId(espnName) {
  const map = {
    'Mexico': 'mexico', 'South Africa': 'south_africa', 'Korea Republic': 'south_korea',
    'South Korea': 'south_korea', 'Czech Republic': 'czechia', 'Czechia': 'czechia',
    'Canada': 'canada', 'Bosnia and Herzegovina': 'bosnia', 'Qatar': 'qatar',
    'Switzerland': 'switzerland', 'Brazil': 'brazil', 'Morocco': 'morocco',
    'Haiti': 'haiti', 'Scotland': 'scotland', 'United States': 'usa', 'USA': 'usa',
    'Paraguay': 'paraguay', 'Australia': 'australia', 'Turkey': 'turkey', 'Türkiye': 'turkey',
    'Germany': 'germany', "Ivory Coast": 'ivory_coast', "Côte d'Ivoire": 'ivory_coast',
    'Ecuador': 'ecuador', 'Curaçao': 'curacao', 'Curacao': 'curacao',
    'Netherlands': 'netherlands', 'Japan': 'japan', 'Sweden': 'sweden', 'Tunisia': 'tunisia',
    'Belgium': 'belgium', 'Egypt': 'egypt', 'Iran': 'iran', 'New Zealand': 'new_zealand',
    'Spain': 'spain', 'Cape Verde': 'cape_verde', 'Saudi Arabia': 'saudi_arabia',
    'Uruguay': 'uruguay', 'France': 'france', 'Senegal': 'senegal', 'Iraq': 'iraq',
    'Norway': 'norway', 'Argentina': 'argentina', 'Algeria': 'algeria', 'Austria': 'austria',
    'Jordan': 'jordan', 'Colombia': 'colombia', 'Portugal': 'portugal',
    'DR Congo': 'dr_congo', 'Congo DR': 'dr_congo', 'Democratic Republic of Congo': 'dr_congo',
    'Uzbekistan': 'uzbekistan', 'England': 'england', 'Croatia': 'croatia',
    'Ghana': 'ghana', 'Panama': 'panama',
  };
  return map[espnName] || null;
}

function getFlag(espnName) {
  const id = getTeamId(espnName);
  if (!id) return '🏳';
  const team = TEAMS.find(t => t.id === id);
  return team?.flag || '🏳';
}

export default function MatchTicker({ espnData, managers }) {
  if (!espnData?.events) return null;

  // Build owner lookup
  const ownerMap = {};
  Object.values(managers).forEach(mgr => {
    (mgr.teams || []).forEach(tid => { ownerMap[tid] = mgr.name; });
  });

  // Get today's matches + live matches
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const todayMatches = espnData.events.filter(e => {
    const matchDate = new Date(e.date).toISOString().slice(0, 10);
    const state = e.status?.type?.state;
    return matchDate === todayStr || state === 'in';
  });

  if (todayMatches.length === 0) return null;

  // Sort: live first, then by time
  todayMatches.sort((a, b) => {
    const aLive = a.status?.type?.state === 'in' ? 0 : 1;
    const bLive = b.status?.type?.state === 'in' ? 0 : 1;
    if (aLive !== bLive) return aLive - bLive;
    return new Date(a.date) - new Date(b.date);
  });

  return (
    <div style={{
      background: 'var(--green-light)',
      borderBottom: '1px solid var(--green-border)',
      overflowX: 'auto',
      whiteSpace: 'nowrap',
      padding: '8px 24px',
    }}>
      <div style={{ display: 'inline-flex', gap: 8 }}>
        {todayMatches.map(event => {
          const comp = event.competitions?.[0];
          const competitors = comp?.competitors || [];
          const home = competitors.find(c => c.homeAway === 'home');
          const away = competitors.find(c => c.homeAway === 'away');
          if (!home || !away) return null;

          const state = event.status?.type?.state;
          const isLive = state === 'in';
          const isFinal = state === 'post';
          const clock = event.status?.displayClock;
          const period = event.status?.period;

          const homeName = home.team?.displayName || home.team?.name;
          const awayName = away.team?.displayName || away.team?.name;
          const homeId = getTeamId(homeName);
          const awayId = getTeamId(awayName);
          const homeOwner = homeId ? ownerMap[homeId] : null;
          const awayOwner = awayId ? ownerMap[awayId] : null;
          const homeFlag = getFlag(homeName);
          const awayFlag = getFlag(awayName);
          const homeScore = home.score ?? '';
          const awayScore = away.score ?? '';

          const kickoffTime = new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const round = comp?.notes?.[0]?.text || '';

          return (
            <div key={event.id} style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: isLive ? 'rgba(212,124,42,0.12)' : 'var(--green-mid)',
              border: `1px solid ${isLive ? 'var(--gold)' : 'var(--green-border)'}`,
              borderRadius: 8,
              padding: '6px 10px',
              fontSize: 12,
              whiteSpace: 'nowrap',
            }}>
              {/* Status badge */}
              {isLive && (
                <span style={{ background: '#e05252', color: '#fff', borderRadius: 4, padding: '1px 5px', fontSize: 9, fontFamily: 'var(--mono)', fontWeight: 700 }}>
                  {clock} {period && `· ${period}'`}
                </span>
              )}
              {isFinal && (
                <span style={{ color: 'var(--text-muted)', fontSize: 9, fontFamily: 'var(--mono)' }}>FT</span>
              )}
              {state === 'pre' && (
                <span style={{ color: 'var(--text-muted)', fontSize: 9, fontFamily: 'var(--mono)' }}>{kickoffTime}</span>
              )}

              {/* Home team */}
              <span>{homeFlag}</span>
              <span style={{ color: homeOwner ? 'var(--gold)' : 'var(--text-secondary)' }}>
                {homeOwner ? homeOwner : homeName.split(' ').pop()}
              </span>

              {/* Score or vs */}
              {(isLive || isFinal) ? (
                <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--text-primary)', margin: '0 2px' }}>
                  {homeScore}–{awayScore}
                </span>
              ) : (
                <span style={{ color: 'var(--text-muted)', margin: '0 2px' }}>vs</span>
              )}

              {/* Away team */}
              <span style={{ color: awayOwner ? 'var(--gold)' : 'var(--text-secondary)' }}>
                {awayOwner ? awayOwner : awayName.split(' ').pop()}
              </span>
              <span>{awayFlag}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
