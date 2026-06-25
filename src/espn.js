// ESPN displayName → our team ID mapping (verified against live API response)
const ESPN_NAME_MAP = {
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

function mapName(name) {
  return ESPN_NAME_MAP[name] || null;
}

function matchPoints(homeScore, awayScore, homeId, targetId, status, round) {
  const isHome = homeId === targetId;
  const teamScore = isHome ? homeScore : awayScore;
  const oppScore = isHome ? awayScore : homeScore;
  const isFinal = round?.toLowerCase().includes('final') && !round?.toLowerCase().includes('3rd') && !round?.toLowerCase().includes('third');
  const is3rd = round?.toLowerCase().includes('3rd') || round?.toLowerCase().includes('third');

  if (is3rd) return null;

  const bonus = isFinal ? 1 : 0;
  const wentET = status === 'AET' || status === 'Pen';

  if (teamScore > oppScore) return 3 + bonus;
  if (teamScore < oppScore) return wentET ? 1 + bonus : 0 + bonus;
  return 1 + bonus;
}

const CACHE_KEY = 'espn_wc_data';
const CACHE_TTL_LIVE = 30 * 1000;
const CACHE_TTL_IDLE = 5 * 60 * 1000;

function getCached() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts, isLive } = JSON.parse(raw);
    const ttl = isLive ? CACHE_TTL_LIVE : CACHE_TTL_IDLE;
    if (Date.now() - ts > ttl) return null;
    return data;
  } catch { return null; }
}

function setCache(data, isLive) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now(), isLive }));
  } catch {}
}

export function clearESPNCache() {
  localStorage.removeItem(CACHE_KEY);
}

export async function fetchESPNData() {
  const cached = getCached();
  if (cached) return cached;

  const res = await fetch('/api/fixtures');
  const json = await res.json();

  const isLive = json.events?.some(e => e.status?.type?.state === 'in');
  setCache(json, isLive);
  return json;
}

export function parseESPNResults(espnData) {
  const teamStats = {};
  const advanceFalse = new Set();
  const advanceTrue = new Set();

  if (!espnData?.events) return teamStats;

  espnData.events.forEach(event => {
    const status = event.status?.type?.state;
    if (status !== 'post' && status !== 'in') return;

    const competition = event.competitions?.[0];
    if (!competition) return;

    const round = event.season?.slug || competition.notes?.[0]?.text || '';
    const is3rd = round.toLowerCase().includes('3rd') || round.toLowerCase().includes('third') ||
                  competition.notes?.[0]?.text?.toLowerCase().includes('third');
    if (is3rd) return;

    const isFinal = (round.toLowerCase().includes('final') && !is3rd) ||
                    competition.notes?.[0]?.text?.toLowerCase() === 'final';

    const competitors = competition.competitors;
    if (!competitors || competitors.length !== 2) return;

    const home = competitors.find(c => c.homeAway === 'home');
    const away = competitors.find(c => c.homeAway === 'away');
    if (!home || !away) return;

    const homeId = mapName(home.team?.displayName || home.team?.name);
    const awayId = mapName(away.team?.displayName || away.team?.name);
    const homeScore = parseInt(home.score) || 0;
    const awayScore = parseInt(away.score) || 0;
    const isLiveMatch = status === 'in';

    const wentET = competition.status?.type?.shortDetail?.includes('AET') ||
                   competition.status?.type?.shortDetail?.includes('Pen') ||
                   competition.status?.type?.description?.includes('Penalty') ||
                   competition.status?.type?.description?.includes('Extra Time');

    const bonus = isFinal ? 1 : 0;

    [homeId, awayId].forEach(teamId => {
      if (!teamId) return;
      if (!teamStats[teamId]) teamStats[teamId] = { points: 0, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, gd: 0, live: false };

      const isHome = homeId === teamId;
      const gf = isHome ? homeScore : awayScore;
      const ga = isHome ? awayScore : homeScore;

      if (isLiveMatch) {
        teamStats[teamId].live = true;
        teamStats[teamId].liveGf = gf;
        teamStats[teamId].liveGa = ga;
        const provisionalPts = gf > ga ? 3 + bonus : gf < ga ? 0 + bonus : 1 + bonus;
        teamStats[teamId].points += provisionalPts;
        teamStats[teamId].played += 1;
        teamStats[teamId].gf += gf;
        teamStats[teamId].ga += ga;
        teamStats[teamId].gd += gf - ga;
        if (gf > ga) teamStats[teamId].wins++;
        else if (gf < ga) teamStats[teamId].losses++;
        else teamStats[teamId].draws++;
        return;
      }

      const won = isHome ? home.winner : away.winner;
      const lost = isHome ? away.winner : home.winner;

      teamStats[teamId].played++;
      teamStats[teamId].gf += gf;
      teamStats[teamId].ga += ga;
      teamStats[teamId].gd += gf - ga;

      if (won) {
        teamStats[teamId].wins++;
        teamStats[teamId].points += 3 + bonus;
      } else if (lost) {
        teamStats[teamId].losses++;
        teamStats[teamId].points += wentET ? 1 + bonus : 0 + bonus;
      } else {
        teamStats[teamId].draws++;
        teamStats[teamId].points += 1 + bonus;
      }
    });

    // Track advance flags from finished games
    if (status === 'post') {
      const isGroupGame = (event.season?.slug || '').includes('group');
      [home, away].forEach(c => {
        const id = mapName(c.team?.displayName || c.team?.name);
        if (!id) return;
        if (c.advance === true) advanceTrue.add(id);
        else if (c.advance === false) {
          // In knockout rounds advance=false is unambiguous — team is out
          // In group stage we wait until all 48 games are done (best 3rd-place rule)
          if (!isGroupGame) advanceTrue.delete(id); // ensure not in advance set
          advanceFalse.add(id);
        }
      });
    }
  });

  // Count finished group stage games — 48 total
  const finishedGroupGames = espnData.events.filter(e =>
    e.status?.type?.state === 'post' &&
    (e.season?.slug || '').includes('group')
  ).length;
  const allGroupsDone = finishedGroupGames >= 48;

  // Build group membership and standings from finished group games
  const groupTeams = {}; // groupLabel -> [teamId, ...]
  espnData.events.forEach(e => {
    if (!(e.season?.slug || '').includes('group')) return;
    const groupNote = e.competitions?.[0]?.altGameNote || ''; // e.g. "FIFA World Cup, Group A"
    const groupMatch = groupNote.match(/Group ([A-L])/i);
    if (!groupMatch) return;
    const grp = groupMatch[1].toUpperCase();
    if (!groupTeams[grp]) groupTeams[grp] = new Set();
    const competitors = e.competitions?.[0]?.competitors || [];
    competitors.forEach(c => {
      const id = mapName(c.team?.displayName || c.team?.name);
      if (id) groupTeams[grp].add(id);
    });
  });

  // For each group with all 3 games played (6 team-games = 3 matches),
  // rank teams and mark 4th place as eliminated immediately.
  // 3rd place only gets marked after all 48 games done (best-3rd-place rule).
  Object.entries(groupTeams).forEach(([grp, teamSet]) => {
    const teams = [...teamSet];
    if (teams.length < 4) return;

    // Count games played per team in this group
    const gamesInGroup = espnData.events.filter(e => {
      const note = e.competitions?.[0]?.altGameNote || '';
      return note.includes(`Group ${grp}`) && e.status?.type?.state === 'post';
    }).length;

    if (gamesInGroup < 3) return; // group not fully played yet — no shadows

    // Sort by pts desc, GD desc, GF desc
    const ranked = teams.sort((a, b) => {
      const sa = teamStats[a] || {};
      const sb = teamStats[b] || {};
      if ((sb.points || 0) !== (sa.points || 0)) return (sb.points || 0) - (sa.points || 0);
      if ((sb.gd || 0) !== (sa.gd || 0)) return (sb.gd || 0) - (sa.gd || 0);
      return (sb.gf || 0) - (sa.gf || 0);
    });

    const fourth = ranked[3];
    const third = ranked[2];

    // 4th place: always eliminated once their group is done
    if (fourth && !advanceTrue.has(fourth)) {
      if (!teamStats[fourth]) teamStats[fourth] = { points: 0, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, gd: 0, live: false };
      teamStats[fourth].eliminated = true;
    }

    // 3rd place: only eliminated after all 48 group games done (ESPN resolves best-3rd-place)
    if (allGroupsDone && third && !advanceTrue.has(third) && advanceFalse.has(third)) {
      if (!teamStats[third]) teamStats[third] = { points: 0, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, gd: 0, live: false };
      teamStats[third].eliminated = true;
    }
  });

  // Knockout round eliminations — advance=false is unambiguous
  advanceFalse.forEach(id => {
    if (advanceTrue.has(id)) return;
    const hasUpcoming = espnData.events.some(e =>
      e.status?.type?.state === 'pre' &&
      (e.competitions?.[0]?.competitors || []).some(c =>
        mapName(c.team?.displayName || c.team?.name) === id
      )
    );
    const isGroupTeam = Object.values(groupTeams).some(s => s.has(id));
    if (!isGroupTeam && !hasUpcoming) {
      if (!teamStats[id]) teamStats[id] = { points: 0, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, gd: 0, live: false };
      teamStats[id].eliminated = true;
    }
  });

  return teamStats;
}

export function isAnyGameLive(espnData) {
  return espnData?.events?.some(e => e.status?.type?.state === 'in') || false;
}

export function getNextMatchInfo(espnData) {
  const upcoming = espnData?.events?.filter(e => e.status?.type?.state === 'pre') || [];
  if (upcoming.length === 0) return null;
  upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));
  const next = upcoming[0];
  const comps = next.competitions?.[0]?.competitors || [];
  const home = comps.find(c => c.homeAway === 'home')?.team?.displayName || '';
  const away = comps.find(c => c.homeAway === 'away')?.team?.displayName || '';
  return { date: next.date, home, away };
}

// Extracts goal-scoring events from a finished match's `details` array.
// Returns array of { teamId, scorer, clock, ownGoal, penalty }
export function getGoalsForEvent(event) {
  const comp = event?.competitions?.[0];
  const details = comp?.details || [];
  return details
    .filter(d => d.scoringPlay)
    .map(d => ({
      teamId: d.team?.id,
      scorer: d.athletesInvolved?.[0]?.shortName || d.athletesInvolved?.[0]?.displayName || 'Unknown',
      clock: d.clock?.displayValue || '',
      ownGoal: !!d.ownGoal,
      penalty: !!d.penaltyKick,
    }));
}
