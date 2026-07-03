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
    const bonus = 0; // No bonus for Final — all rounds score the same

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

// Max possible additional points for a team from remaining games
export function getMaxAdditionalPoints(teamId, espnData) {
  if (!espnData?.events) return 0;
  const myNames = [];
  // Build reverse lookup from teamId to ESPN names
  const nameMap = {
    mexico: ['Mexico'], south_africa: ['South Africa'], south_korea: ['South Korea'],
    czechia: ['Czechia'], canada: ['Canada'], bosnia: ['Bosnia-Herzegovina', 'Bosnia and Herzegovina'],
    qatar: ['Qatar'], switzerland: ['Switzerland'], brazil: ['Brazil'], morocco: ['Morocco'],
    haiti: ['Haiti'], scotland: ['Scotland'], usa: ['United States', 'USA'],
    paraguay: ['Paraguay'], australia: ['Australia'], turkey: ['Türkiye', 'Turkey'],
    germany: ['Germany'], ivory_coast: ['Ivory Coast', "Côte d'Ivoire"],
    ecuador: ['Ecuador'], curacao: ['Curaçao', 'Curacao'], netherlands: ['Netherlands'],
    japan: ['Japan'], sweden: ['Sweden'], tunisia: ['Tunisia'], belgium: ['Belgium'],
    egypt: ['Egypt'], iran: ['Iran'], new_zealand: ['New Zealand'], spain: ['Spain'],
    cape_verde: ['Cape Verde'], saudi_arabia: ['Saudi Arabia'], uruguay: ['Uruguay'],
    france: ['France'], senegal: ['Senegal'], iraq: ['Iraq'], norway: ['Norway'],
    argentina: ['Argentina'], algeria: ['Algeria'], austria: ['Austria'], jordan: ['Jordan'],
    colombia: ['Colombia'], portugal: ['Portugal'], dr_congo: ['DR Congo', 'Congo DR'],
    uzbekistan: ['Uzbekistan'], england: ['England'], croatia: ['Croatia'],
    ghana: ['Ghana'], panama: ['Panama'],
  };
  const teamNames = nameMap[teamId] || [];

  // Find upcoming games for this team
  const upcomingGames = espnData.events.filter(e => {
    if (e.status?.type?.state !== 'pre') return false;
    const slug = e.season?.slug || '';
    if (slug.includes('group')) return false;
    const competitors = e.competitions?.[0]?.competitors || [];
    return competitors.some(c => teamNames.includes(c.team?.displayName || c.team?.name));
  });

  // Also count live game if playing now
  const liveGame = espnData.events.find(e => {
    if (e.status?.type?.state !== 'in') return false;
    const slug = e.season?.slug || '';
    if (slug.includes('group')) return false;
    const competitors = e.competitions?.[0]?.competitors || [];
    return competitors.some(c => teamNames.includes(c.team?.displayName || c.team?.name));
  });

  let maxPts = 0;
  const allGames = liveGame ? [liveGame, ...upcomingGames] : upcomingGames;
  allGames.forEach(e => {
    const round = e.competitions?.[0]?.notes?.[0]?.text || '';
    const isFinal = round.toLowerCase() === 'final';
    maxPts += 3;
  });

  return maxPts;
}


// Bracket tree: each match is [teamA, teamB] where teams are current alive teams
// or arrays representing "winner of [match]"
// We model the bracket as a binary tree and simulate all possible outcomes
// to find the maximum points a manager's set of teams can accumulate.

// R16 pairs (teams currently alive in each match)
const R16_MATCHES = [
  { id: 'M89', teams: ['paraguay', 'france'],     pts: 3, done: true,  winner: 'paraguay' },
  { id: 'M90', teams: ['canada', 'morocco'],       pts: 3, done: false },
  { id: 'M91', teams: ['brazil', 'norway'],        pts: 3, done: false },
  { id: 'M92', teams: ['mexico', 'england'],       pts: 3, done: false },
  { id: 'M93', teams: ['portugal', 'spain'],       pts: 3, done: false },
  { id: 'M94', teams: ['usa', 'belgium'],          pts: 3, done: false },
  { id: 'M95', teams: ['argentina', 'cape_verde'], pts: 3, done: false },
  { id: 'M96', teams: ['australia', 'egypt'],      pts: 3, done: false },
  { id: 'M85', teams: ['switzerland', 'algeria'],  pts: 3, done: false },
  { id: 'M87', teams: ['colombia', 'ghana'],       pts: 3, done: false },
];

// QF bracket: which R16 match winners play each other
// M97: W89 vs W90, M98: W93 vs W94, M99: W91 vs W92, M100: W95 vs W96... 
// Wait from screenshot: M97=W89+W90, M98=W93+W94 (but let me re-check M95/M96 vs M85/M87)
// Right bottom: M95=W86+W88, M96=W85+W87 → M100=W95+W96
// M86=ARG/CPV, M88=AUS/EGY, M85=SUI/ALG, M87=COL/GHA
const QF_MATCHES = [
  { id: 'M97', r16: ['M89', 'M90'], pts: 3 },  // PAR/FRA winner vs CAN/MAR winner
  { id: 'M98', r16: ['M93', 'M94'], pts: 3 },  // POR/ESP winner vs USA/BEL winner
  { id: 'M99', r16: ['M91', 'M92'], pts: 3 },  // BRA/NOR winner vs MEX/ENG winner
  { id: 'M100',r16: ['M95', 'M96'], pts: 3 },  // ARG/CPV winner vs AUS/EGY winner... 
  // Wait - M95 and M96 from screenshot feed M100
  // M95 = W86(ARG/CPV) vs W88(AUS/EGY), M96 = W85(SUI/ALG) vs W87(COL/GHA)
  // But above I listed M85 and M87 as R16 matches directly... 
  // Actually from the screenshot: ARG/CPV and AUS/EGY and SUI/ALG and COL/GHA are all R32 games
  // feeding into R16 (M95, M96), then QF (M100)
  // So M95 and M96 ARE the R16 matches for that quarter
  // Let me rename to be cleaner
];

// Cleaner: just define the bracket as a tree of R16 slots
// Each R16 match feeds into a QF, two QFs feed into a SF, two SFs feed into Final
// Tree (using R16 match IDs):
// Final: SF_L vs SF_R
// SF_L: QF_1 (M89/M90) vs QF_2 (M93/M94)  [left side]
// SF_R: QF_3 M91/M92 vs QF_4 M95/M96 which include M85/M87

// From screenshot more carefully:
// Left top quarter: M89(PAR/FRA), M90(CAN/MAR) → M97(QF) → M101(SF_L)
// Left bot quarter: M93(POR/ESP), M94(USA/BEL) → M98(QF) → M101(SF_L)
// Right top quarter: M91(BRA/NOR), M92(MEX/ENG) → M99(QF) → M102(SF_R)
// Right bot quarter: M95(W86/W88)=(ARG/CPV vs AUS/EGY), M96(W85/W87)=(SUI/ALG vs COL/GHA) → M100(QF) → M102(SF_R)

// So the R16 matches are: M89,M90,M91,M92,M93,M94,M95,M96
// Where M95 = ARG vs CPV winner vs AUS vs EGY winner... 
// But ARG/CPV (M86) and AUS/EGY (M88) haven't played yet (R32 still upcoming)
// And SUI/ALG (M85) and COL/GHA (M87) also R32 upcoming
// So for the "right_bottom" quarter, the R16 will be between winners of those R32 games

// This means for teams still in R32, they need to win R32 first (+3pts) before R16
// Let me model all of this properly

// Full bracket as nested arrays: [teamA, teamB] where each element can be a team or [teamA, teamB]
// Points earned by winning each round: R32=3, R16=3, QF=3, SF=3, Final=4
const FULL_BRACKET = {
  // [left_team, right_team] at each level
  // null means TBD/already-won
  final: {
    pts: 3,
    left: { // SF_L → M101
      pts: 3,
      left: { // QF M97
        pts: 3,
        left:  { pts: 3, teams: ['paraguay', 'france'],   done: true, winner: 'paraguay' }, // M89
        right: { pts: 3, teams: ['canada',   'morocco'],  done: false },                     // M90
      },
      right: { // QF M98
        pts: 3,
        left:  { pts: 3, teams: ['portugal', 'spain'],    done: false }, // M93
        right: { pts: 3, teams: ['usa',      'belgium'],  done: false }, // M94
      },
    },
    right: { // SF_R → M102
      pts: 3,
      left: { // QF M99
        pts: 3,
        left:  { pts: 3, teams: ['brazil',  'norway'],   done: false }, // M91
        right: { pts: 3, teams: ['mexico',  'england'],  done: false }, // M92
      },
      right: { // QF M100
        pts: 3,
        left: { // R16 M95 (winners of R32 M86 + M88)
          pts: 3,
          left:  { pts: 3, teams: ['argentina', 'cape_verde'], done: false }, // M86 R32
          right: { pts: 3, teams: ['australia', 'egypt'],      done: false }, // M88 R32
        },
        right: { // R16 M96 (winners of R32 M85 + M87)
          pts: 3,
          left:  { pts: 3, teams: ['switzerland', 'algeria'], done: false }, // M85 R32
          right: { pts: 3, teams: ['colombia',    'ghana'],   done: false }, // M87 R32
        },
      },
    },
  },
};

// Recursively find max points for a set of manager teams in a bracket node
// Returns max additional points achievable
function maxPtsInNode(node, mgrTeams) {
  if (!node) return 0;

  // Leaf node: direct match
  if (node.teams) {
    const myTeams = node.teams.filter(t => mgrTeams.includes(t));
    if (myTeams.length === 0) return 0;
    if (node.done) {
      // Already played - winner already got points (in current score)
      return 0;
    }
    // Can win this match: best case 1 of my teams wins → pts
    return node.pts;
  }

  // Branch node: left match feeds into this match, right match feeds into this match
  // Winner of left plays winner of right
  const leftMax = maxPtsInNode(node.left, mgrTeams);
  const rightMax = maxPtsInNode(node.right, mgrTeams);

  // Who are my possible teams coming out of each side?
  const myLeftTeams = getReachableTeams(node.left, mgrTeams);
  const myRightTeams = getReachableTeams(node.right, mgrTeams);

  let matchMax = 0;
  if (myLeftTeams.length > 0 || myRightTeams.length > 0) {
    // At least one of my teams could reach this match — winner gets pts
    matchMax = node.pts;
  }
  if (myLeftTeams.length > 0 && myRightTeams.length > 0) {
    // My teams are on BOTH sides — they could meet each other.
    // The loser still gets +1 (assuming ET/Pens), so add that bonus.
    matchMax += 1;
  }

  return leftMax + rightMax + matchMax;
}

function getReachableTeams(node, mgrTeams) {
  if (!node) return [];
  if (node.teams) {
    if (node.done) return mgrTeams.filter(t => t === node.winner);
    return node.teams.filter(t => mgrTeams.includes(t));
  }
  return [
    ...getReachableTeams(node.left, mgrTeams),
    ...getReachableTeams(node.right, mgrTeams),
  ];
}

export function getMaxPossibleScore(managerTeams, espnData, teamStatsFn) {
  if (!managerTeams || !espnData) return null;
  const currentTotal = managerTeams.reduce((s, tid) => s + teamStatsFn(tid).points, 0);
  const aliveMgrTeams = managerTeams.filter(tid => !teamStatsFn(tid).eliminated);
  if (aliveMgrTeams.length === 0) return currentTotal;
  const additionalMax = maxPtsInNode(FULL_BRACKET.final, aliveMgrTeams);
  return currentTotal + additionalMax;
}
