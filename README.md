# The Legendary League · World Cup 2026

Fantasy World Cup draft order tracker for 14 managers, 3 teams each.

## Setup

1. Clone this repo
2. `npm install`
3. Copy `.env.example` to `.env` and add your API-Football key:
   ```
   REACT_APP_API_FOOTBALL_KEY=your_key_here
   ```
4. `npm start` to run locally

## Deploy to Vercel

1. Push to GitHub
2. Go to vercel.com → New Project → Import your repo
3. Add environment variable: `REACT_APP_API_FOOTBALL_KEY`
4. Deploy

## Scoring
- Group stage exit: 0pts
- Round of 32: 1pt
- Round of 16: 2pts
- Quarterfinal: 3pts
- Semifinal: 4pts
- 4th place: 5pts
- Runner-up: 6pts
- Champion: 10pts

Tiebreaker: combined goal differential. Secondary: total goals scored.

## Admin / Draft Room
Password: `legendary2026`

Change this in `src/components/DraftRoom.js` line 7.
