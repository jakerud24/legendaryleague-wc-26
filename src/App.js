import React, { useState, useEffect } from 'react';
import { ref, onValue, set } from 'firebase/database';
import { db } from './firebase';
import { TEAMS } from './data';
import { calculateTeamStats } from './components/DraftRoom';
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

export default function App() {
  const [activeTab, setActiveTab] = useState('standings');
  const [loading, setLoading] = useState(true);
  const [managers, setManagersState] = useState({});
  const [matchResults, setMatchResultsState] = useState({});

  useEffect(() => {
    const unsub = onValue(ref(db, 'managers'), snap => {
      setManagersState(snap.val() || {});
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onValue(ref(db, 'matchResults'), snap => {
      setMatchResultsState(snap.val() || {});
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

  const setMatchResults = (updater) => {
    setMatchResultsState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      set(ref(db, 'matchResults'), next);
      return next;
    });
  };

  const getTeamStats = (teamId) => calculateTeamStats(matchResults[teamId]);
  const getTeamPts = (teamId) => getTeamStats(teamId).points;

  const getManagerScore = (mgr) => {
    if (!mgr?.teams) return 0;
    return mgr.teams.reduce((sum, tid) => sum + getTeamPts(tid), 0);
  };

  const getManagerGD = (mgr) => {
    if (!mgr?.teams) return 0;
    return mgr.teams.reduce((sum, tid) => sum + getTeamStats(tid).gd, 0);
  };

  const getManagerGF = (mgr) => {
    if (!mgr?.teams) return 0;
    return mgr.teams.reduce((sum, tid) => sum + getTeamStats(tid).gf, 0);
  };

  const getSortedManagers = () =>
    Object.entries(managers)
      .map(([id, mgr]) => ({
        id, ...mgr,
        score: getManagerScore(mgr),
        gd: getManagerGD(mgr),
        gf: getManagerGF(mgr)
      }))
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
            <p className="header-subtitle">FIFA WORLD CUP 2026 · DRAFT ORDER TRACKER</p>
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
        {activeTab === 'standings' && <Standings managers={managers} getSortedManagers={getSortedManagers} getTeamPts={getTeamPts} getTeamStats={getTeamStats} />}
        {activeTab === 'draft' && <DraftRoom managers={managers} setManagers={setManagers} matchResults={matchResults} setMatchResults={setMatchResults} />}
        {activeTab === 'bracket' && <Bracket managers={managers} matchResults={matchResults} getTeamPts={getTeamPts} getTeamStats={getTeamStats} />}
        {activeTab === 'nations' && <Nations managers={managers} getTeamPts={getTeamPts} getTeamStats={getTeamStats} />}
      </main>
    </div>
  );
}
