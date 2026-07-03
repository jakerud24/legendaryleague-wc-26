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

export function mapName(name) {
  return ESPN_NAME_MAP[name] || null;
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
  if (!espnData?.events) return teamStats;

  espnData.events.forEach(event => {
    const status = event.status?.type?.state;
    if (status !== 'post' && status !== 'in') return;
    const competition = event.competitions?.[0];
    if (!competition) return;
    const round = competition.notes?.[0]?.text || '';
    const is3rd = round.toLowerCase().includes('3rd') || round.toLowerCase().includes('third');
    if (is3rd) return;
    const isFinal = round.toLowerCase() === 'final';
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
    const shortDetail = competition.status?.type?.shortDetail || event.status?.type?.shortDetail || '';
    const wentET = shortDetail.includes('AET') || shortDetail.includes('Pen') ||
                   (competition.status?.type?.description || '').includes('Penalty') ||
                   (competition.status?.type?.description || '').includes('Extra Time');
    const bonus = isFinal ? 1 : 0;

    [homeId, awayId].forEach(teamId => {
      if (!teamId) return;
      if (!teamStats[teamId]) teamStats[teamId] = { points: 0, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, gd: 0, live: false };
      const isHome = homeId === teamId;
      const gf = isHome ? homeScore : awayScore;
      const ga = isHome ? awayScore : homeScore;
      if (isLiveMatch) {
        teamStats[teamId].live = true;
        teamStats[teamId].points += gf > ga ? 3 + bonus : gf < ga ? 0 + bonus : 1 + bonus;
        teamStats[teamId].played++; teamStats[teamId].gf += gf; teamStats[teamId].ga += ga; teamStats[teamId].gd += gf - ga;
        if (gf > ga) teamStats[teamId].wins++; else if (gf < ga) teamStats[teamId].losses++; else teamStats[teamId].draws++;
        return;
      }
      const won = isHome ? home.winner : away.winner;
      const lost = isHome ? away.winner : home.winner;
      teamStats[teamId].played++; teamStats[teamId].gf += gf; teamStats[teamId].ga += ga; teamStats[teamId].gd += gf - ga;
      if (won) { teamStats[teamId].wins++; teamStats[teamId].points += 3 + bonus; }
      else if (lost) { teamStats[teamId].losses++; teamStats[teamId].points += wentET ? 1 + bonus : 0 + bonus; }
      else { teamStats[teamId].draws++; teamStats[teamId].points += 1 + bonus; }
    });
  });

  // Confirmed group stage eliminations
  const GROUP_ELIMINATED = new Set([
    'czechia', 'south_korea', 'qatar', 'haiti', 'turkey', 'tunisia',
    'curacao', 'new_zealand', 'iran', 'scotland', 'saudi_arabia',
    'iraq', 'jordan', 'panama', 'uruguay', 'uzbekistan',
  ]);
  GROUP_ELIMINATED.forEach(id => {
    if (!teamStats[id]) teamStats[id] = { points: 0, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, gd: 0, live: false };
    teamStats[id].eliminated = true;
  });

  // KO round: loser of any finished non-group match is eliminated
  espnData.events.forEach(event => {
    if ((event.season?.slug || '').includes('group')) return;
    if (event.status?.type?.state !== 'post') return;
    const loser = (event.competitions?.[0]?.competitors || []).find(c => c.winner === false);
    if (!loser) return;
    const id = mapName(loser.team?.displayName || loser.team?.name);
    if (!id) return;
    if (!teamStats[id]) teamStats[id] = { points: 0, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, gd: 0, live: false };
    teamStats[id].eliminated = true;
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

export function getGoalsForEvent(event) {
  const comp = event?.competitions?.[0];
  return (comp?.details || [])
    .filter(d => d.scoringPlay)
    .map(d => ({
      teamId: d.team?.id,
      scorer: d.athletesInvolved?.[0]?.shortName || d.athletesInvolved?.[0]?.displayName || 'Unknown',
      clock: d.clock?.displayValue || '',
      ownGoal: !!d.ownGoal,
      penalty: !!d.penaltyKick,
    }));
}

export function getKnockoutMatches(espnData) {
  if (!espnData?.events) return [];
  return espnData.events
    .filter(e => !(e.season?.slug || '').includes('group'))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}
