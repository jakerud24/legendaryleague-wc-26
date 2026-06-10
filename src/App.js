import React, { useState, useEffect } from 'react';
import { ref, onValue, set } from 'firebase/database';
import { db } from './firebase';
import { TEAMS } from './data';
import { fetchNextMatch, fetchTeamPoints, clearCache } from './api';
import Standings from './components/Standings';
import DraftRoom from './components/DraftRoom';
import Bracket from './components/Bracket';
import Nations from './components/Nations';
import './App.css';

const TABS = [
  { id: 'standings', label: '🏆 Standings' },
  { id: 'draft', label: '📋 Draft Room' },
  { id: 'bracket', label: '🗂 Bracket' },
  { id: 'nations', label: '🌍 Nations' },
];

function Countdown({ nextMatch }) {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    if (!nextMatch) return;
    const kickoff = new Date(nextMatch.fixture.date);
    const tick = () => {
      const diff = kickoff - new Date();
      if (diff <= 0) { setTimeLeft('LIVE NOW'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${d}d ${h}h ${m}m ${s}s`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [nextMatch]);
  if (!nextMatch) return null;
  return (
    <div className="countdown-bar">
      <span className="countdown-label">NEXT MATCH</span>
      <span className="countdown-teams">{nextMatch.teams.home.name} vs {nextMatch.teams.away.name}</span>
      <span className="countdown-timer">{timeLeft}</span>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('standings');
  const [nextMatch, setNextMatch] = useState(null);
  const [teamPoints, setTeamPoints] = useState({});
  const [lastRefresh, setLastRefresh] = useState(null);
  const [loading, setLoading] = useState(true);
  const [managers, setManagersState] = useState({});
  const [roundStatuses, setRoundStatusesState] = useState({});

  useEffect(() => {
    const unsub = onValue(ref(db, 'managers'), snap => {
      setManagersState(snap.val() || {});
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onValue(ref(db, 'roundStatuses'), snap => {
      setRoundStatusesState(snap.val() || {});
    });
    return () => unsub();
  }, []);

  const setManagers = (updater) => {
    setManagersState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      set(ref(db, 'managers'), next);
      return next;
    });
  };

  const setRoundStatuses = (updater) => {
    setRoundStatusesState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      set(ref(db, 'roundStatuses'), next);
      return next;
    });
  };

  const loadData = async () => {
    fetchNextMatch().then(setNextMatch).catch(() => {});
    fetchTeamPoints().then(pts => {
      setTeamPoints(pts);
      setLastRefresh(new Date());
    }).catch(() => {});
  };

  useEffect(() => { loadData(); }, []);

  const refresh = () => {
    clearCache();
    loadData();
  };

  const getTeamPts = (teamId) => teamPoints[teamId]?.points || 0;

  const getManagerScore = (mgr) => {
    if (!mgr?.teams) return 0;
    return mgr.teams.reduce((sum, tid) => sum + getTeamPts(tid), 0);
  };

  const getManagerGD = (mgr) => {
    if (!mgr?.teams) return 0;
    return mgr.teams.reduce((sum, tid) => sum + (teamPoints[tid]?.gd || 0), 0);
  };

  const getSortedManagers = () =>
    Object.entries(managers)
      .map(([id, mgr]) => ({ id, ...mgr, score: getManagerScore(mgr), gd: getManagerGD(mgr) }))
      .sort((a, b) => b.score - a.score || b.gd - a.gd);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--green-dark)', color: 'var(--gold)', fontFamily: 'var(--display)', fontSize: '2rem' }}>
      LOADING...
    </div>
  );

  return (
    <div className="app">
      <header className="app-header">
        <div className="pitch-lines" aria-hidden="true">
          <div className="pitch-center-circle" />
          <div className="pitch-center-line" />
          <div className="pitch-left-box" />
          <div className="pitch-right-box" />
        </div>
        <div className="header-content">
          <div className="header-title">
            <h1>THE LEGENDARY LEAGUE</h1>
            <p className="header-subtitle">FIFA WORLD CUP 2026 · SNAKE DRAFT TRACKER</p>
          </div>
          <Countdown nextMatch={nextMatch} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="refresh-btn" onClick={refresh}>↻ REFRESH</button>
            {lastRefresh && <span className="last-refresh">{lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
          </div>
        </div>
      </header>

      <nav className="tab-nav">
        {TABS.map(tab => (
          <button key={tab.id} className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="app-main">
        {activeTab === 'standings' && <Standings managers={managers} getSortedManagers={getSortedManagers} getTeamPts={getTeamPts} teamPoints={teamPoints} />}
        {activeTab === 'draft' && <DraftRoom managers={managers} setManagers={setManagers} roundStatuses={roundStatuses} setRoundStatuses={setRoundStatuses} />}
        {activeTab === 'bracket' && <Bracket roundStatuses={roundStatuses} managers={managers} teamPoints={teamPoints} />}
        {activeTab === 'nations' && <Nations managers={managers} teamPoints={teamPoints} getTeamPts={getTeamPts} />}
      </main>
    </div>
  );
}
