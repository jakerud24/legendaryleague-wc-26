import React, { useState } from 'react';
import { TEAMS } from '../data';
import { getGoalsForEvent } from '../espn';

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

function shortName(name, id) {
  if (id === 'bosnia') return 'Bosnia';
  return name.split(' ').pop();
}

function GoalsList({ event, homeFlag, awayFlag }) {
  const goals = getGoalsForEvent(event);
  if (goals.length === 0) {
    return <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '6px 0' }}>No goals scored.</div>;
  }
  const homeTeamId = event.competitions?.[0]?.competitors?.find(c => c.homeAway === 'home')?.team?.id;
  const awayTeamId = event.competitions?.[0]?.competitors?.find(c => c.homeAway === 'away')?.team?.id;
  const homeGoals = goals.filter(g => g.teamId === homeTeamId);
  const awayGoals = goals.filter(g => g.teamId === awayTeamId);

  const renderGoal = (g) => (
    <div key={g.clock + g.scorer} style={{ fontSize: 11, color: 'var(--text-primary)' }}>
      {g.scorer} <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>{g.clock}</span>
      {g.ownGoal && <span style={{ color: '#e05252', fontSize: 9, marginLeft: 4 }}>OG</span>}
      {g.penalty && <span style={{ color: 'var(--gold)', fontSize: 9, marginLeft: 4 }}>PEN</span>}
    </div>
  );

  return (
    <div style={{ display: 'flex', gap: 16, padding: '8px 4px', flexWrap: 'wrap' }}>
      <div style={{ minWidth: 110 }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>{homeFlag} Goals</div>
        {homeGoals.length > 0 ? homeGoals.map(renderGoal) : <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</div>}
      </div>
      <div style={{ minWidth: 110 }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>{awayFlag} Goals</div>
        {awayGoals.length > 0 ? awayGoals.map(renderGoal) : <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</div>}
      </div>
    </div>
  );
}

function MatchCard({ event, ownerMap, expandable, isExpanded, onToggle }) {
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
  const venueAddr = comp?.venue?.address;
  const venue = venueAddr ? (venueAddr.city || '') + (venueAddr.country && venueAddr.country !== 'USA' ? `, ${venueAddr.country}` : (venueAddr.city ? '' : '')) : null;

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', verticalAlign: 'top' }}>
      <div
        onClick={expandable ? onToggle : undefined}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: isLive ? 'rgba(224,82,82,0.12)' : 'var(--green-mid)',
          border: `1px solid ${isLive ? '#e05252' : isExpanded ? 'var(--gold)' : 'var(--green-border)'}`,
          borderRadius: isExpanded ? '8px 8px 0 0' : 8,
          padding: '6px 10px',
          fontSize: 12,
          whiteSpace: 'nowrap',
          cursor: expandable ? 'pointer' : 'default',
        }}
      >
        {isLive && (
          <span style={{ background: '#e05252', color: '#fff', borderRadius: 4, padding: '1px 5px', fontSize: 9, fontFamily: 'var(--mono)', fontWeight: 700 }}>
            {clock} {period && `· ${period}'`}
          </span>
        )}
        {isFinal && <span style={{ color: 'var(--text-muted)', fontSize: 9, fontFamily: 'var(--mono)' }}>FT</span>}
        {state === 'pre' && (
          <span style={{ color: 'var(--text-muted)', fontSize: 9, fontFamily: 'var(--mono)' }}>
            {kickoffTime}{venue ? ` · ${venue}` : ''}
          </span>
        )}

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
        {expandable && <span style={{ color: 'var(--text-muted)', fontSize: 9, marginLeft: 2 }}>{isExpanded ? '▲' : '▼'}</span>}
      </div>
      {isExpanded && (
        <div style={{ border: '1px solid var(--gold)', borderTop: 'none', borderRadius: '0 0 8px 8px', background: 'var(--green-mid)', padding: '0 10px' }}>
          <GoalsList event={event} homeFlag={homeFlag} awayFlag={awayFlag} />
        </div>
      )}
    </div>
  );
}

export default function MatchTicker({ espnData, managers }) {
  const [expandedId, setExpandedId] = useState(null);

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
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const liveAndUpcoming = [...live, ...upcoming];

  if (liveAndUpcoming.length === 0 && finished.length === 0) return null;

  return (
    <div style={{ borderBottom: '1px solid var(--green-border)' }}>
      {liveAndUpcoming.length > 0 && (
        <div style={{ background: 'var(--green-light)', overflowX: 'auto', whiteSpace: 'nowrap', padding: '8px 24px 6px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 4 }}>
            LIVE & UPCOMING
          </div>
          <div style={{ display: 'inline-flex', gap: 8, alignItems: 'flex-start' }}>
            {liveAndUpcoming.map(event => (
              <MatchCard key={event.id} event={event} ownerMap={ownerMap} expandable={false} />
            ))}
          </div>
        </div>
      )}
      {finished.length > 0 && (
        <div style={{ background: 'var(--green-dark)', overflowX: 'auto', whiteSpace: 'nowrap', padding: '6px 24px 8px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 4 }}>
            RESULTS · TAP A MATCH FOR GOAL SCORERS
          </div>
          <div style={{ display: 'inline-flex', gap: 8, alignItems: 'flex-start' }}>
            {finished.map(event => (
              <MatchCard
                key={event.id}
                event={event}
                ownerMap={ownerMap}
                expandable={true}
                isExpanded={expandedId === event.id}
                onToggle={() => setExpandedId(expandedId === event.id ? null : event.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
