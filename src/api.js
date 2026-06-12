import { TEAMS } from './data';

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function getCached(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch { return null; }
}

function setCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}

async function apiFetch(endpoint) {
  const cacheKey = `apifootball_${endpoint}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  // Call our Vercel proxy instead of API directly (avoids CORS)
  const url = `/api/fixtures?endpoint=${encodeURIComponent(endpoint)}`;
  const res = await fetch(url);
  const json = await res.json();
  setCache(cacheKey, json);
  return json;
}

export const API_NAME_MAP = {
  'Mexico': 'mexico', 'South Africa': 'south_africa', 'Korea Republic': 'south_korea',
  'Czech Republic': 'czechia', 'Czechia': 'czechia', 'Canada': 'canada',
  'Bosnia and Herzegovina': 'bosnia', 'Qatar': 'qatar', 'Switzerland': 'switzerland',
  'Brazil': 'brazil', 'Morocco': 'morocco', 'Haiti': 'haiti', 'Scotland': 'scotland',
  'United States': 'usa', 'USA': 'usa', 'Paraguay': 'paraguay', 'Australia': 'australia',
  'Turkey': 'turkey', 'Türkiye': 'turkey', 'Germany': 'germany',
  "Côte d'Ivoire": 'ivory_coast', 'Ivory Coast': 'ivory_coast', 'Ecuador': 'ecuador',
  'Curaçao': 'curacao', 'Netherlands': 'netherlands', 'Japan': 'japan',
  'Sweden': 'sweden', 'Tunisia': 'tunisia', 'Belgium': 'belgium', 'Egypt': 'egypt',
  'Iran': 'iran', 'New Zealand': 'new_zealand', 'Spain': 'spain',
  'Cape Verde': 'cape_verde', 'Saudi Arabia': 'saudi_arabia', 'Uruguay': 'uruguay',
  'France': 'france', 'Senegal': 'senegal', 'Iraq': 'iraq', 'Norway': 'norway',
  'Argentina': 'argentina', 'Algeria': 'algeria', 'Austria': 'austria',
  'Jordan': 'jordan', 'Colombia': 'colombia', 'Portugal': 'portugal',
  'DR Congo': 'dr_congo', 'Congo DR': 'dr_congo', 'Uzbekistan': 'uzbekistan',
  'England': 'england', 'Croatia': 'croatia', 'Ghana': 'ghana', 'Panama': 'panama',
};

export function mapApiNameToId(apiName) {
  return API_NAME_MAP[apiName] || null;
}

function getMatchPoints(fixture, teamId) {
  const status = fixture.fixture.status.short;
  if (!['FT', 'AET', 'PEN'].includes(status)) return null;

  const round = fixture.league.round || '';
  const is3rdPlace = round.toLowerCase().includes('3rd') || round.toLowerCase().includes('third');
  const isFinal = round.toLowerCase().includes('final') && !is3rdPlace;

  if (is3rdPlace) return null;

  const homeId = mapApiNameToId(fixture.teams.home.name);
  const awayId = mapApiNameToId(fixture.teams.away.name);
  const isHome = homeId === teamId;
  const isAway = awayId === teamId;
  if (!isHome && !isAway) return null;

  const teamWon = isHome ? fixture.teams.home.winner : fixture.teams.away.winner;
  const teamLost = isHome ? fixture.teams.away.winner : fixture.teams.home.winner;
  const bonus = isFinal ? 1 : 0;

  if (status === 'AET' || status === 'PEN') {
    return teamWon ? 3 + bonus : 1 + bonus;
  }
  if (teamWon) return 3 + bonus;
  if (teamLost) return 0 + bonus;
  return 1 + bonus; // draw
}

export async function fetchFixtures() {
  const json = await apiFetch(`fixtures?league=1&season=2026`);
  return json?.response || [];
}

export async function fetchNextMatch() {
  const json = await apiFetch(`fixtures?league=1&season=2026&next=1`);
  return json?.response?.[0] || null;
}

export async function fetchTeamPoints() {
  try {
    const fixtures = await fetchFixtures();
    const teamData = {};
    TEAMS.forEach(t => {
      teamData[t.id] = { points: 0, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, gd: 0 };
    });

    fixtures.forEach(f => {
      const status = f.fixture.status.short;
      if (!['FT', 'AET', 'PEN'].includes(status)) return;

      const round = f.league.round || '';
      const is3rdPlace = round.toLowerCase().includes('3rd') || round.toLowerCase().includes('third');
      if (is3rdPlace) return;

      const homeId = mapApiNameToId(f.teams.home.name);
      const awayId = mapApiNameToId(f.teams.away.name);
      const homeG = f.goals.home ?? 0;
      const awayG = f.goals.away ?? 0;

      [homeId, awayId].forEach(tid => {
        if (!tid || !teamData[tid]) return;
        const pts = getMatchPoints(f, tid);
        if (pts === null) return;
        const isHome = homeId === tid;
        const gf = isHome ? homeG : awayG;
        const ga = isHome ? awayG : homeG;
        teamData[tid].points += pts;
        teamData[tid].played++;
        teamData[tid].gf += gf;
        teamData[tid].ga += ga;
        teamData[tid].gd += gf - ga;
        const won = isHome ? f.teams.home.winner : f.teams.away.winner;
        const lost = isHome ? f.teams.away.winner : f.teams.home.winner;
        if (status === 'FT') {
          if (won) teamData[tid].wins++;
          else if (lost) teamData[tid].losses++;
          else teamData[tid].draws++;
        }
      });
    });

    return teamData;
  } catch (e) {
    console.error('fetchTeamPoints error', e);
    return {};
  }
}

export function clearCache() {
  Object.keys(localStorage).filter(k => k.startsWith('apifootball_')).forEach(k => localStorage.removeItem(k));
}
