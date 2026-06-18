import React, { useState, useEffect, useCallback } from 'react';
import { ref, onValue, set } from 'firebase/database';
import { db } from './firebase';
import { fetchESPNData, parseESPNResults, isAnyGameLive, getNextMatchInfo, clearESPNCache } from './espn';
import Standings from './components/Standings';
import DraftRoom from './components/DraftRoom';
import Bracket from './components/Bracket';
import Nations from './components/Nations';
import MatchTicker from './components/MatchTicker';
import './App.css';

const TABS = [
  { id: 'standings', label: '🏆 Standings' },
  { id: 'bracket', label: '🗂 Bracket' },
  { id: 'nations', label: '🌍 Team Details' },
  { id: 'draft', label: '📋 Draft Room' },
];

function Countdown({ nextMatch }) {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    if (!nextMatch) return;
    const kickoff = new Date(nextMatch.date);
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
      <span className="countdown-label">NEXT</span>
      <span className="countdown-teams">{nextMatch.home} vs {nextMatch.away}</span>
      <span className="countdown-timer">{timeLeft}</span>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('standings');
  const [loading, setLoading] = useState(true);
  const [managers, setManagersState] = useState({});
  const [espnStats, setEspnStats] = useState({});
  const [espnData, setEspnData] = useState(null);
  const [nextMatch, setNextMatch] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [espnError, setEspnError] = useState(false);

  useEffect(() => {
    const unsub = onValue(ref(db, 'managers'), snap => {
      setManagersState(snap.val() || {});
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const loadESPN = useCallback(async (force = false) => {
    try {
      if (force) clearESPNCache();
      const data = await fetchESPNData();
      const stats = parseESPNResults(data);
      const live = isAnyGameLive(data);
      const next = getNextMatchInfo(data);
      setEspnData(data);
      setEspnStats(stats);
      setIsLive(live);
      setNextMatch(next);
      setLastRefresh(new Date());
      setEspnError(false);
    } catch (e) {
      setEspnError(true);
    }
  }, []);

  useEffect(() => { loadESPN(); }, [loadESPN]);

  useEffect(() => {
    const interval = setInterval(() => loadESPN(), isLive ? 30000 : 300000);
    return () => clearInterval(interval);
  }, [isLive, loadESPN]);

  const setManagers = (updater) => {
    setManagersState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      set(ref(db, 'managers'), next);
      return next;
    });
  };

  const getTeamStats = (teamId) =>
    espnStats[teamId] || { points: 0, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, gd: 0 };

  const getTeamPts = (teamId) => getTeamStats(teamId).points;
  const getManagerScore = (mgr) => mgr?.teams?.reduce((s, tid) => s + getTeamPts(tid), 0) || 0;
  const getManagerGD = (mgr) => mgr?.teams?.reduce((s, tid) => s + getTeamStats(tid).gd, 0) || 0;
  const getManagerGF = (mgr) => mgr?.teams?.reduce((s, tid) => s + getTeamStats(tid).gf, 0) || 0;

  const getSortedManagers = () =>
    Object.entries(managers)
      .map(([id, mgr]) => ({ id, ...mgr, score: getManagerScore(mgr), gd: getManagerGD(mgr), gf: getManagerGF(mgr) }))
      .sort((a, b) => b.score - a.score || b.gd - a.gd || b.gf - a.gf);

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
            <p className="header-subtitle">FIFA WORLD CUP 2026 · GAMBLING GUYS</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Countdown nextMatch={nextMatch} />
            {isLive && (
              <span style={{ background: '#e05252', color: '#fff', borderRadius: 999, padding: '3px 10px', fontSize: 11, fontFamily: 'var(--mono)', fontWeight: 700, letterSpacing: '0.1em' }}>
                ● LIVE
              </span>
            )}
            <button className="refresh-btn" onClick={() => loadESPN(true)}>↻ REFRESH</button>
            {lastRefresh && (
              <span className="last-refresh">
                {espnError ? '⚠ ESPN unavailable' : lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>
      </header>

      <MatchTicker espnData={espnData} managers={managers} />

      <nav className="tab-nav">
        {TABS.map(tab => (
          <button key={tab.id} className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="app-main">
        {activeTab === 'standings' && <Standings managers={managers} getSortedManagers={getSortedManagers} getTeamPts={getTeamPts} getTeamStats={getTeamStats} espnData={espnData} />}
        {activeTab === 'bracket' && <Bracket managers={managers} getTeamPts={getTeamPts} getTeamStats={getTeamStats} />}
        {activeTab === 'nations' && <Nations managers={managers} getTeamPts={getTeamPts} getTeamStats={getTeamStats} />}
        {activeTab === 'draft' && <DraftRoom managers={managers} setManagers={setManagers} matchResults={{}} setMatchResults={() => {}} />}
      </main>
    </div>
  );
}
