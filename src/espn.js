// ESPN name → our team ID mapping
const ESPN_NAME_MAP = {
  'Mexico': 'mexico', 'South Africa': 'south_africa', 'Korea Republic': 'south_korea',
  'South Korea': 'south_korea', 'Czech Republic': 'czechia', 'Czechia': 'czechia',
  'Canada': 'canada', 'Bosnia and Herzegovina': 'bosnia', 'Bosnia-Herzegovina': 'bosnia',
  'Qatar': 'qatar', 'Switzerland': 'switzerland', 'Brazil': 'brazil', 'Morocco': 'morocco',
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

function mapName(name) {
  return ESPN_NAME_MAP[name] || null;
}

// Points per match result
function matchPoints(homeScore, awayScore, homeId, targetId, status, round) {
  const isHome = homeId === targetId;
  const teamScore = isHome ? homeScore : awayScore;
  const oppScore = isHome ? awayScore : homeScore;
  const isFinal = round?.toLowerCase().includes('final') && !round?.toLowerCase().includes('3rd') && !round?.toLowerCase().includes('third');
  const is3rd = round?.toLowerCase().includes('3rd') || round?.toLowerCase().includes('third');
  
  if (is3rd) return null; // skip 3rd place game
  
  const bonus = isFinal ? 1 : 0;

  // Check if it went to ET/pens
  const wentET = status === 'AET' || status === 'Pen';
  
  if (teamScore > oppScore) return 3 + bonus; // win
  if (teamScore < oppScore) return wentET ? 1 + bonus : 0 + bonus; // loss
  return 1 + bonus; // draw
}

const CACHE_KEY = 'espn_wc_data';
const CACHE_TTL_LIVE = 30 * 1000; // 30 seconds when live
const CACHE_TTL_IDLE = 5 * 60 * 1000; // 5 minutes otherwise

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

  // Check if any games are live right now
  const isLive = json.events?.some(e => e.status?.type?.state === 'in');
  setCache(json, isLive);
  return json;
}

// Returns { teamId: { points, played, wins, draws, losses, gf, ga, gd } }
export function parseESPNResults(espnData) {
  const teamStats = {};

  if (!espnData?.events) return teamStats;

  espnData.events.forEach(event => {
    const status = event.status?.type?.state; // 'pre', 'in', 'post'
    if (status !== 'post') return; // only finished games

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

    const wentET = competition.status?.type?.shortDetail?.includes('AET') ||
                   competition.status?.type?.shortDetail?.includes('Pen') ||
                   competition.status?.type?.description?.includes('Penalty') ||
                   competition.status?.type?.description?.includes('Extra Time');

    const bonus = isFinal ? 1 : 0;

    [homeId, awayId].forEach(teamId => {
      if (!teamId) return;
      if (!teamStats[teamId]) teamStats[teamId] = { points: 0, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, gd: 0 };

      const isHome = homeId === teamId;
      const gf = isHome ? homeScore : awayScore;
      const ga = isHome ? awayScore : homeScore;
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
