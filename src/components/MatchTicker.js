import React from 'react';
import { TEAMS } from '../data';

function getTeamId(espnName) {
  const map = {
    'Mexico': 'mexico', 'South Africa': 'south_africa', 'South Korea': 'south_korea',
    'Czechia': 'czechia', 'Canada': 'canada',
    'Bosnia-Herzegovina': 'bosnia', 'Bosnia and Herzegovina': 'bosnia',
    'Qatar': 'qatar', 'Switzerland': 'switzerland', 'Brazil': 'brazil', 'Morocco': 'morocco',
    'Haiti': 'haiti', 'Scotland': 'scotland', 'United States': 'usa', 'USA': 'usa',
    'Paraguay': 'paraguay', 'Australia': 'australia', 'Türkiye': 'turkey', 'Turkey': 'turkey',
    'Germany': 'germany', 'Ivory Coast': 'ivory_coast', "Côte d'Ivoire": 'ivory_coast',
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

function MatchCard({ event, ownerMap }) {
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

  // Shortened display names
  const shortName = (name, id) => {
    if (id === 'bosnia') return 'Bosnia';
    return name.split(' ').pop();
  };

  const kickoffTime = new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: isLive ? 'rgba(224,82,82,0.12)' : 'var(--green-mid)',
      border: `1px solid ${isLive ? '#e05252' : 'var(--green-border)'}`,
      borderRadius: 8,
      padding: '6px 10px',
      fontSize: 12,
      whiteSpace: 'nowrap',
    }}>
      {isLive && (
        <span style={{ background: '#e05252', color: '#fff', borderRadius: 4, padding: '1px 5px', fontSize: 9, fontFamily: 'var(--mono)', fontWeight: 700 }}>
          {clock} {period && `· ${period}'`}
        </span>
      )}
      {isFinal && <span style={{ color: 'var(--text-muted)', fontSize: 9, fontFamily: 'var(--mono)' }}>FT</span>}
      {state === 'pre' && <span style={{ color: 'var(--text-muted)', fontSize: 9, fontFamily: 'var(--mono)' }}>{kickoffTime}</span>}

      <span>{homeFlag}</span>
      <span style={{ color: homeOwner ? 'var(--gold)' : 'var(--text-secondary)' }}>
        {homeOwner ? homeOwner : shortName(homeName, homeId)}
      </span>

      {(isLive || isFinal) ? (
        <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--text-primary)', margin: '0 2px' }}>
          {homeScore}–{awayScore}
        </span>
      ) : (
        <span style={{ color: 'var(--text-muted)', margin: '0 2px' }}>vs</span>
      )}

      <span style={{ color: awayOwner ? 'var(--gold)' : 'var(--text-secondary)' }}>
        {awayOwner ? awayOwner : shortName(awayName, awayId)}
      </span>
      <span>{awayFlag}</span>
    </div>
  );
}

export default function MatchTicker({ espnData, managers }) {
  if (!espnData?.events) return null;

  const ownerMap = {};
  Object.values(managers).forEach(mgr => {
    (mgr.teams || []).forEach(tid => { ownerMap[tid] = mgr.name; });
  });

  const events = espnData.events;
  const live = events.filter(e => e.status?.type?.state === 'in');
  const upcoming = events.filter(e => e.status?.type?.state === 'pre')
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, live.length > 0 ? 3 : 4);
  const finished = events.filter(e => e.status?.type?.state === 'post')
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 4);

  const liveAndUpcoming = [...live, ...upcoming];

  if (liveAndUpcoming.length === 0 && finished.length === 0) return null;

  return (
    <div style={{ borderBottom: '1px solid var(--green-border)' }}>
      {liveAndUpcoming.length > 0 && (
        <div style={{ background: 'var(--green-light)', overflowX: 'auto', whiteSpace: 'nowrap', padding: '8px 24px 6px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 4 }}>
            LIVE & UPCOMING
          </div>
          <div style={{ display: 'inline-flex', gap: 8 }}>
            {liveAndUpcoming.map(event => <MatchCard key={event.id} event={event} ownerMap={ownerMap} />)}
          </div>
        </div>
      )}
      {finished.length > 0 && (
        <div style={{ background: 'var(--green-dark)', overflowX: 'auto', whiteSpace: 'nowrap', padding: '6px 24px 8px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 4 }}>
            RESULTS
          </div>
          <div style={{ display: 'inline-flex', gap: 8 }}>
            {finished.map(event => <MatchCard key={event.id} event={event} ownerMap={ownerMap} />)}
          </div>
        </div>
      )}
    </div>
  );
}
