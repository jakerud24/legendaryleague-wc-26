export const CONFEDERATIONS = ['UEFA', 'CONMEBOL', 'CONCACAF', 'AFC', 'CAF', 'OFC'];

export const TEAMS = [
  // Group A
  { id: 'mexico', name: 'Mexico', flag: '🇲🇽', group: 'A', confederation: 'CONCACAF' },
  { id: 'south_africa', name: 'South Africa', flag: '🇿🇦', group: 'A', confederation: 'CAF' },
  { id: 'south_korea', name: 'South Korea', flag: '🇰🇷', group: 'A', confederation: 'AFC' },
  { id: 'czechia', name: 'Czechia', flag: '🇨🇿', group: 'A', confederation: 'UEFA' },
  // Group B
  { id: 'canada', name: 'Canada', flag: '🇨🇦', group: 'B', confederation: 'CONCACAF' },
  { id: 'bosnia', name: 'Bosnia-Herzegovina', flag: '🇧🇦', group: 'B', confederation: 'UEFA' },
  { id: 'qatar', name: 'Qatar', flag: '🇶🇦', group: 'B', confederation: 'AFC' },
  { id: 'switzerland', name: 'Switzerland', flag: '🇨🇭', group: 'B', confederation: 'UEFA' },
  // Group C
  { id: 'brazil', name: 'Brazil', flag: '🇧🇷', group: 'C', confederation: 'CONMEBOL' },
  { id: 'morocco', name: 'Morocco', flag: '🇲🇦', group: 'C', confederation: 'CAF' },
  { id: 'haiti', name: 'Haiti', flag: '🇭🇹', group: 'C', confederation: 'CONCACAF' },
  { id: 'scotland', name: 'Scotland', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', group: 'C', confederation: 'UEFA' },
  // Group D
  { id: 'usa', name: 'USA', flag: '🇺🇸', group: 'D', confederation: 'CONCACAF' },
  { id: 'paraguay', name: 'Paraguay', flag: '🇵🇾', group: 'D', confederation: 'CONMEBOL' },
  { id: 'australia', name: 'Australia', flag: '🇦🇺', group: 'D', confederation: 'AFC' },
  { id: 'turkey', name: 'Türkiye', flag: '🇹🇷', group: 'D', confederation: 'UEFA' },
  // Group E
  { id: 'germany', name: 'Germany', flag: '🇩🇪', group: 'E', confederation: 'UEFA' },
  { id: 'ivory_coast', name: 'Ivory Coast', flag: '🇨🇮', group: 'E', confederation: 'CAF' },
  { id: 'ecuador', name: 'Ecuador', flag: '🇪🇨', group: 'E', confederation: 'CONMEBOL' },
  { id: 'curacao', name: 'Curaçao', flag: '🇨🇼', group: 'E', confederation: 'CONCACAF' },
  // Group F
  { id: 'netherlands', name: 'Netherlands', flag: '🇳🇱', group: 'F', confederation: 'UEFA' },
  { id: 'japan', name: 'Japan', flag: '🇯🇵', group: 'F', confederation: 'AFC' },
  { id: 'sweden', name: 'Sweden', flag: '🇸🇪', group: 'F', confederation: 'UEFA' },
  { id: 'tunisia', name: 'Tunisia', flag: '🇹🇳', group: 'F', confederation: 'CAF' },
  // Group G
  { id: 'belgium', name: 'Belgium', flag: '🇧🇪', group: 'G', confederation: 'UEFA' },
  { id: 'egypt', name: 'Egypt', flag: '🇪🇬', group: 'G', confederation: 'CAF' },
  { id: 'iran', name: 'Iran', flag: '🇮🇷', group: 'G', confederation: 'AFC' },
  { id: 'new_zealand', name: 'New Zealand', flag: '🇳🇿', group: 'G', confederation: 'OFC' },
  // Group H
  { id: 'spain', name: 'Spain', flag: '🇪🇸', group: 'H', confederation: 'UEFA' },
  { id: 'cape_verde', name: 'Cape Verde', flag: '🇨🇻', group: 'H', confederation: 'CAF' },
  { id: 'saudi_arabia', name: 'Saudi Arabia', flag: '🇸🇦', group: 'H', confederation: 'AFC' },
  { id: 'uruguay', name: 'Uruguay', flag: '🇺🇾', group: 'H', confederation: 'CONMEBOL' },
  // Group I
  { id: 'france', name: 'France', flag: '🇫🇷', group: 'I', confederation: 'UEFA' },
  { id: 'senegal', name: 'Senegal', flag: '🇸🇳', group: 'I', confederation: 'CAF' },
  { id: 'iraq', name: 'Iraq', flag: '🇮🇶', group: 'I', confederation: 'AFC' },
  { id: 'norway', name: 'Norway', flag: '🇳🇴', group: 'I', confederation: 'UEFA' },
  // Group J
  { id: 'argentina', name: 'Argentina', flag: '🇦🇷', group: 'J', confederation: 'CONMEBOL' },
  { id: 'algeria', name: 'Algeria', flag: '🇩🇿', group: 'J', confederation: 'CAF' },
  { id: 'austria', name: 'Austria', flag: '🇦🇹', group: 'J', confederation: 'UEFA' },
  { id: 'jordan', name: 'Jordan', flag: '🇯🇴', group: 'J', confederation: 'AFC' },
  // Group K
  { id: 'colombia', name: 'Colombia', flag: '🇨🇴', group: 'K', confederation: 'CONMEBOL' },
  { id: 'portugal', name: 'Portugal', flag: '🇵🇹', group: 'K', confederation: 'UEFA' },
  { id: 'dr_congo', name: 'DR Congo', flag: '🇨🇩', group: 'K', confederation: 'CAF' },
  { id: 'uzbekistan', name: 'Uzbekistan', flag: '🇺🇿', group: 'K', confederation: 'AFC' },
  // Group L
  { id: 'england', name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', group: 'L', confederation: 'UEFA' },
  { id: 'croatia', name: 'Croatia', flag: '🇭🇷', group: 'L', confederation: 'UEFA' },
  { id: 'ghana', name: 'Ghana', flag: '🇬🇭', group: 'L', confederation: 'CAF' },
  { id: 'panama', name: 'Panama', flag: '🇵🇦', group: 'L', confederation: 'CONCACAF' },
];

export const SCORING = {
  group: 0,
  r32: 1,
  r16: 2,
  qf: 3,
  sf: 4,
  fourth: 5,
  runner_up: 6,
  champion: 10,
};

export const ROUND_LABELS = {
  group: 'Group Stage',
  r32: 'Round of 32',
  r16: 'Round of 16',
  qf: 'Quarterfinal',
  sf: 'Semifinal',
  fourth: '4th Place',
  runner_up: 'Runner-up',
  champion: 'Champion',
};

export const ROUND_ORDER = ['group', 'r32', 'r16', 'qf', 'sf', 'fourth', 'runner_up', 'champion'];

export const MAX_POINTS = 10;

export const API_FOOTBALL_LEAGUE_ID = 1;
export const API_FOOTBALL_SEASON = 2026;
