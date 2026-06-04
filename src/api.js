import { TEAMS } from './data';

const BASE_URL = 'https://v3.football.api-sports.io';
const API_KEY = process.env.REACT_APP_API_FOOTBALL_KEY;
const LEAGUE_ID = 1;
const SEASON = 2026;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function getCached(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch {
    return null;
  }
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

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { 'x-apisports-key': API_KEY },
  });
  const json = await res.json();
  setCache(cacheKey, json);
  return json;
}

export async function fetchStandings() {
  const json = await apiFetch(`/standings?league=${LEAGUE_ID}&season=${SEASON}`);
  return json?.response?.[0]?.league?.standings || [];
}

export async function fetchFixtures() {
  const json = await apiFetch(`/fixtures?league=${LEAGUE_ID}&season=${SEASON}`);
  return json?.response || [];
}

// Map API team names to our team IDs
const API_NAME_MAP = {
  'Mexico': 'mexico',
  'South Africa': 'south_africa',
  'Korea Republic': 'south_korea',
  'Czech Republic': 'czechia',
  'Czechia': 'czechia',
  'Canada': 'canada',
  'Bosnia and Herzegovina': 'bosnia',
  'Qatar': 'qatar',
  'Switzerland': 'switzerland',
  'Brazil': 'brazil',
  'Morocco': 'morocco',
  'Haiti': 'haiti',
  'Scotland': 'scotland',
  'United States': 'usa',
  'USA': 'usa',
  'Paraguay': 'paraguay',
  'Australia': 'australia',
  'Turkey': 'turkey',
  'Germany': 'germany',
  "Côte d'Ivoire": 'ivory_coast',
  'Ivory Coast': 'ivory_coast',
  'Ecuador': 'ecuador',
  'Curaçao': 'curacao',
  'Netherlands': 'netherlands',
  'Japan': 'japan',
  'Sweden': 'sweden',
  'Tunisia': 'tunisia',
  'Belgium': 'belgium',
  'Egypt': 'egypt',
  'Iran': 'iran',
  'New Zealand': 'new_zealand',
  'Spain': 'spain',
  'Cape Verde': 'cape_verde',
  'Saudi Arabia': 'saudi_arabia',
  'Uruguay': 'uruguay',
  'France': 'france',
  'Senegal': 'senegal',
  'Iraq': 'iraq',
  'Norway': 'norway',
  'Argentina': 'argentina',
  'Algeria': 'algeria',
  'Austria': 'austria',
  'Jordan': 'jordan',
  'Colombia': 'colombia',
  'Portugal': 'portugal',
  'DR Congo': 'dr_congo',
  'Uzbekistan': 'uzbekistan',
  'England': 'england',
  'Croatia': 'croatia',
  'Ghana': 'ghana',
  'Panama': 'panama',
};

export function mapApiNameToId(apiName) {
  return API_NAME_MAP[apiName] || null;
}

export async function fetchNextMatch() {
  const json = await apiFetch(`/fixtures?league=${LEAGUE_ID}&season=${SEASON}&next=1`);
  return json?.response?.[0] || null;
}

export async function fetchTeamStatuses() {
  // Returns a map of teamId -> round status based on standings/fixtures
  try {
    const fixtures = await fetchFixtures();
    // Build a map of results from fixtures to determine advancement
    const teamStats = {};
    TEAMS.forEach(t => {
      teamStats[t.id] = { gf: 0, ga: 0, gd: 0, played: 0 };
    });

    fixtures.forEach(f => {
      if (f.fixture.status.short !== 'FT') return;
      const homeId = mapApiNameToId(f.teams.home.name);
      const awayId = mapApiNameToId(f.teams.away.name);
      const homeG = f.goals.home || 0;
      const awayG = f.goals.away || 0;

      if (homeId && teamStats[homeId]) {
        teamStats[homeId].gf += homeG;
        teamStats[homeId].ga += awayG;
        teamStats[homeId].gd += homeG - awayG;
        teamStats[homeId].played++;
      }
      if (awayId && teamStats[awayId]) {
        teamStats[awayId].gf += awayG;
        teamStats[awayId].ga += homeG;
        teamStats[awayId].gd += awayG - homeG;
        teamStats[awayId].played++;
      }
    });

    return teamStats;
  } catch {
    return {};
  }
}
