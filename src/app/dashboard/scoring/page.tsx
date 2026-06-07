'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  getMatches,
  updateMatchScore,
  getEvents,
  getTournaments,
  getTeamsByTournament,
  getPlayers,
  logAction,
  saveMatchHistory,
} from '@/lib/supabase-service';
import type { MatchHistoryData } from '@/lib/supabase-service';
import { useAuth } from '@/lib/auth-context';
import { Match, TournamentEvent, Tournament, Team, User, TeamSubMatch, MatchSet, MatchStatus } from '@/types';
import {
  createInitialScoreState,
  addPoint,
  undoPoint,
  isDeuce,
  getGamePoint,
  ScoreState,
  SCORING_CONFIGS,
} from '@/lib/scoring';
import { IconPlay, IconPause, IconUndo, IconTrophy, IconClock, IconCheck, IconArrowLeft } from '@/components/icons';
import WinPredictorGauge from '@/components/WinPredictorGauge';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function ScoringPage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [events, setEvents] = useState<TournamentEvent[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  useEffect(() => {
    async function loadMatches() {
      try {
        setLoading(true);
        const data = await getMatches();
        const evs = await getEvents();
        const tours = await getTournaments();
        
        setMatches(data);
        setEvents(evs);
        setTournaments(tours);
        
        // Check URL search parameter for matchId
        const params = new URLSearchParams(window.location.search);
        const urlMatchId = params.get('matchId');
        if (urlMatchId && data.some(m => m.id === urlMatchId)) {
          setSelectedMatchId(urlMatchId);
        } else {
          const umpireMatches = data.filter(
            m => (m.status === 'running' || m.status === 'scheduled') && m.umpire_id === user?.id
          );
          const available = umpireMatches.length > 0
            ? umpireMatches
            : data.filter(m => m.status === 'running' || m.status === 'scheduled');
            
          if (available.length > 0) {
            setSelectedMatchId(available[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load matches:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMatches();
  }, [user]);

  const umpireMatches = matches.filter(
    m => (m.status === 'running' || m.status === 'scheduled') && m.umpire_id === user?.id
  );
  const availableMatches = umpireMatches.length > 0
    ? umpireMatches
    : matches.filter(m => m.status === 'running' || m.status === 'scheduled');

  const match = matches.find(m => m.id === selectedMatchId);

  if (loading) {
    return (
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Live Scoring</h1>
        <div className="glass-card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div className="animate-spin" style={{ display: 'inline-block', fontSize: 24, marginBottom: 12, animation: 'spin 2s linear infinite' }}>🔄</div>
          <p style={{ fontSize: 15, fontWeight: 500 }}>Loading Match Fixtures...</p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Live Scoring</h1>
        <div className="empty-state">
          <div className="empty-state-icon">🏸</div>
          <p style={{ fontSize: 16, fontWeight: 500 }}>No matches assigned to you</p>
          <p style={{ fontSize: 14 }}>Ask the admin to assign you as umpire for a match</p>
        </div>
      </div>
    );
  }

  const matchEvent = events.find(e => e.id === match.event_id);
  const matchTournament = tournaments.find(t => t.id === match.tournament_id);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>Live Scoring</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
          {umpireMatches.length > 0 ? 'Your assigned matches' : 'Select a match and start scoring'}
        </p>
      </div>

      {/* Match selector */}
      <div style={{ marginBottom: 24 }}>
        <select
          className="input"
          style={{ width: 'auto', minWidth: 300 }}
          value={selectedMatchId || ''}
          onChange={e => setSelectedMatchId(e.target.value)}
        >
          {availableMatches.map(m => (
            <option key={m.id} value={m.id}>
              {m.player1_name} vs {m.player2_name} ({m.court || 'No court'})
            </option>
          ))}
        </select>
      </div>

      <ScoringInterface
        key={selectedMatchId}
        match={match}
        event={matchEvent}
        tournament={matchTournament}
        onScoreUpdated={async () => {
          const freshMatches = await getMatches();
          setMatches(freshMatches);
        }}
      />
    </div>
  );
}

function getIndividualPlayers(name: string): string[] {
  if (!name) return ['TBD'];
  const parts = name.split(/\s*(?:\/|\+|,|and)\s*/i);
  if (parts.length > 1) return parts.map(p => p.trim());
  return [name.trim()];
}

function ScoringInterface({
  match,
  event,
  tournament,
  onScoreUpdated,
}: {
  match: Match;
  event?: TournamentEvent;
  tournament?: Tournament;
  onScoreUpdated: () => void;
}) {
  const { user } = useAuth();
  const defaultScoringFormat = event?.scoring_format || '21-point';
  const defaultScoringConfig = SCORING_CONFIGS[defaultScoringFormat];

  // Core Game Configurations and overrides
  const [targetPoints, setTargetPoints] = useState(defaultScoringConfig.maxPoints);
  const [maxCapPoints, setMaxCapPoints] = useState(defaultScoringConfig.absoluteMax);
  const [bestOfGames, setBestOfGames] = useState(3);
  const [selectedCourt, setSelectedCourt] = useState(match.court || 'Court 1');

  // Team configurations
  const isTeamMatch = tournament?.type === 'team' && Array.isArray(match.sub_matches) && match.sub_matches.length > 0;
  const [teams, setTeams] = useState<Team[]>([]);
  const [allPlayers, setAllPlayers] = useState<User[]>([]);
  const [activeSubMatchIdx, setActiveSubMatchIdx] = useState<number | null>(null);
  const [subMatches, setSubMatches] = useState<TeamSubMatch[]>(match.sub_matches || []);
  const [overallWinnerId, setOverallWinnerId] = useState<string | null>(match.winner_id || null);
  const [overallStatus, setOverallStatus] = useState<MatchStatus>(match.status);

  // Scorer States
  const [matchStarted, setMatchStarted] = useState(match.status === 'running');
  const [isPaused, setIsPaused] = useState(false);
  const [matchElapsed, setMatchElapsed] = useState(0);
  const [totalPausedTime, setTotalPausedTime] = useState(0);
  const [pauseElapsed, setPauseElapsed] = useState(0);

  // BWF Serving and court side layouts
  const [servingTeam, setServingTeam] = useState<'player1' | 'player2'>('player1');
  const [courtSides, setCourtSides] = useState<{ left: 'player1' | 'player2'; right: 'player1' | 'player2' }>({
    left: 'player1',
    right: 'player2',
  });

  const isDoubles = match.player1_name.includes('/') || match.player1_name.includes('+') || match.player1_name.includes(',') || (event?.category || '').endsWith('D');
  const p1Names = getIndividualPlayers(match.player1_name);
  const p2Names = getIndividualPlayers(match.player2_name);

  // For singles: both positions use the same player name (no "Partner")
  const [t1Positions, setT1Positions] = useState({ left: isDoubles ? (p1Names[1] || p1Names[0]) : p1Names[0], right: p1Names[0] });
  const [t2Positions, setT2Positions] = useState({ left: p2Names[0], right: isDoubles ? (p2Names[1] || p2Names[0]) : p2Names[0] });

  // History and progression tracker
  const [pointsHistory, setPointsHistory] = useState<{ p1Score: number; p2Score: number; scorer: 'player1' | 'player2' }[]>([]);
  const [lastScored, setLastScored] = useState<'player1' | 'player2' | null>(null);

  // Operational Settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrateEnabled, setVibrateEnabled] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Game Intervals (60s mid-game & 120s set-end)
  const [intervalActive, setIntervalActive] = useState(false);
  const [intervalType, setIntervalType] = useState<'mid-game' | 'game-end'>('mid-game');
  const [intervalTimeLeft, setIntervalTimeLeft] = useState(60);
  const [gameWinnerSummary, setGameWinnerSummary] = useState('');
  const [midGameIntervalTriggered, setMidGameIntervalTriggered] = useState<boolean[]>( [false, false, false, false, false] );

  const matchTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pauseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const intervalTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isTeamMatch) {
      async function loadRosters() {
        try {
          const teamList = await getTeamsByTournament(match.tournament_id!);
          const playerList = await getPlayers();
          setTeams(teamList);
          setAllPlayers(playerList);
        } catch (err) {
          console.error('Failed to load team rosters for scoring:', err);
        }
      }
      loadRosters();
    }
  }, [isTeamMatch, match]);

  const team1 = teams.find(t => t.id === match.player1_id);
  const team2 = teams.find(t => t.id === match.player2_id);
  const team1Roster = allPlayers.filter(p => team1?.players.includes(p.id));
  const team2Roster = allPlayers.filter(p => team2?.players.includes(p.id));

  // Synthesize Web Audio beeps
  const playScoreBeep = () => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // High-pitched A5 beep
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.005, audioCtx.currentTime + 0.12);
      oscillator.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
      console.warn("Audio Context blocked:", e);
    }
  };

  const triggerVibration = () => {
    if (vibrateEnabled && typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(80);
    }
  };

  // State initialization for scoring BWF
  const [state, setState] = useState<ScoreState>(() => {
    if (match.sets.length > 0) {
      const p1Wins = match.sets.filter(s => s.winner_id === match.player1_id).length;
      const p2Wins = match.sets.filter(s => s.winner_id === match.player2_id).length;
      return {
        sets: [...match.sets],
        currentSet: match.sets.length - 1,
        isMatchComplete: match.status === 'completed',
        matchWinnerId: match.winner_id || null,
        player1SetsWon: p1Wins,
        player2SetsWon: p2Wins,
      };
    }
    return createInitialScoreState();
  });

  const currentSet = state.sets[state.currentSet];

  // Match setup start
  const handleStartMatch = async () => {
    setMatchStarted(true);
    setIsPaused(false);
    try {
      await updateMatchScore(
        match.id,
        state.sets,
        'running',
        null,
        new Date().toISOString(),
        null,
        selectedCourt,
        isTeamMatch ? subMatches : undefined
      );
      onScoreUpdated();
      playScoreBeep();

      // Audit log: Match Started
      await logAction(
        'Match Started',
        'match',
        `Match: ${match.player1_name} vs ${match.player2_name} | Court: ${selectedCourt} | Format: ${targetPoints}-point (Best of ${bestOfGames}) | Umpire: ${match.umpire_name || 'N/A'}`,
        user ? { id: user.id, name: user.name } : null
      );
    } catch (err) {
      console.error('Failed to start match:', err);
    }
  };

  // Timers and intervals control
  useEffect(() => {
    if (matchStarted && !isPaused && !state.isMatchComplete && !intervalActive) {
      matchTimerRef.current = setInterval(() => {
        setMatchElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (matchTimerRef.current) clearInterval(matchTimerRef.current);
    };
  }, [matchStarted, isPaused, state.isMatchComplete, intervalActive]);

  useEffect(() => {
    if (isPaused) {
      setPauseElapsed(0);
      pauseTimerRef.current = setInterval(() => {
        setPauseElapsed(prev => prev + 1);
      }, 1000);
    } else {
      if (pauseTimerRef.current) {
        clearInterval(pauseTimerRef.current);
        setTotalPausedTime(prev => prev + pauseElapsed);
        setPauseElapsed(0);
      }
    }
    return () => {
      if (pauseTimerRef.current) clearInterval(pauseTimerRef.current);
    };
  }, [isPaused, pauseElapsed]);

  // Interval timer countdown
  useEffect(() => {
    if (intervalActive && intervalTimeLeft > 0) {
      intervalTimerRef.current = setInterval(() => {
        setIntervalTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalTimerRef.current!);
            setIntervalActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalTimerRef.current) clearInterval(intervalTimerRef.current);
    };
  }, [intervalActive, intervalTimeLeft]);

  // BWF completion and deuce checks
  const handleScore = useCallback(async (player: 'player1' | 'player2') => {
    if (isPaused || state.isMatchComplete || intervalActive) return;

    triggerVibration();
    playScoreBeep();

    setLastScored(player);
    
    // Position swaps on server side wins
    if (isDoubles) {
      if (player === servingTeam) {
        // Serving team wins point: swap server partners side position
        if (player === 'player1') {
          setT1Positions(prev => ({ left: prev.right, right: prev.left }));
        } else {
          setT2Positions(prev => ({ left: prev.right, right: prev.left }));
        }
      } else {
        // Receiving team wins point: switch serve side, partners stay
        setServingTeam(player);
      }
    } else {
      setServingTeam(player);
    }

    let nextState: ScoreState = { ...state };
    const currentSets = [...state.sets];
    let setIdx = state.currentSet;

    // Safety: if setIdx is out of bounds or the current set is already complete, create a new set
    if (setIdx < 0 || setIdx >= currentSets.length || !currentSets[setIdx] || currentSets[setIdx].is_complete) {
      currentSets.push({
        set_number: currentSets.length + 1,
        player1_score: 0,
        player2_score: 0,
        is_complete: false,
      });
      setIdx = currentSets.length - 1;
    }

    const activeSet = { ...currentSets[setIdx] };
    if (player === 'player1') activeSet.player1_score++;
    else activeSet.player2_score++;

    const p1 = activeSet.player1_score;
    const p2 = activeSet.player2_score;

    // Check mid-game 11-point interval
    if ((p1 === 11 || p2 === 11) && !midGameIntervalTriggered[setIdx]) {
      const nextTrigger = [...midGameIntervalTriggered];
      nextTrigger[setIdx] = true;
      setMidGameIntervalTriggered(nextTrigger);
      
      setIntervalType('mid-game');
      setIntervalTimeLeft(60);
      setIntervalActive(true);
    }

    let setComplete = false;
    let setWinner: string | undefined = undefined;

    if (p1 >= targetPoints || p2 >= targetPoints) {
      const diff = Math.abs(p1 - p2);
      if (diff >= 2 || p1 === maxCapPoints || p2 === maxCapPoints) {
        setComplete = true;
        setWinner = p1 > p2 ? match.player1_id : match.player2_id;
      }
    }

    activeSet.is_complete = setComplete;
    activeSet.winner_id = setWinner;
    currentSets[setIdx] = activeSet;

    // Calculate sets won
    const p1Wins = currentSets.filter(s => s.winner_id === match.player1_id).length;
    const p2Wins = currentSets.filter(s => s.winner_id === match.player2_id).length;
    const targetWins = Math.ceil(bestOfGames / 2);

    let matchComplete = false;
    let matchWinner: string | null = null;

    if (p1Wins >= targetWins) {
      matchComplete = true;
      matchWinner = match.player1_id;
    } else if (p2Wins >= targetWins) {
      matchComplete = true;
      matchWinner = match.player2_id;
    }

    nextState = {
      sets: currentSets,
      currentSet: setComplete && !matchComplete ? setIdx + 1 : setIdx,
      isMatchComplete: matchComplete,
      matchWinnerId: matchWinner,
      player1SetsWon: p1Wins,
      player2SetsWon: p2Wins,
    };

    setState(nextState);
    
    // Save points history for graphs
    setPointsHistory(prev => [...prev, { p1Score: p1, p2Score: p2, scorer: player }]);

    // Trigger set completion interval
    if (setComplete && !matchComplete) {
      const setWinnerName = p1 > p2 ? match.player1_name : match.player2_name;
      setGameWinnerSummary(
        `Set ${activeSet.set_number} won by ${setWinnerName} (${p1} - ${p2})`
      );
      setIntervalType('game-end');
      setIntervalTimeLeft(120);
      setIntervalActive(true);

      // Auto side swap visual guideline
      setCourtSides(prev => ({ left: prev.right, right: prev.left }));

      // Audit log: Game/Set Won
      logAction(
        'Game Set Won',
        'match',
        `Game ${activeSet.set_number}: ${match.player1_name} ${p1} - ${p2} ${match.player2_name} | Winner: ${setWinnerName}`,
        user ? { id: user.id, name: user.name } : null
      ).catch(() => {});
    }

    try {
      const finalStatus = matchComplete ? 'completed' : 'running';
      await updateMatchScore(
        match.id,
        currentSets,
        finalStatus as any,
        matchWinner,
        match.actual_start_time || new Date().toISOString(),
        matchComplete ? new Date().toISOString() : null,
        selectedCourt
      );
      onScoreUpdated();

      // Audit log + Match History: Match Completed
      if (matchComplete && matchWinner) {
        const winnerName = matchWinner === match.player1_id ? match.player1_name : match.player2_name;
        const setsStr = currentSets.filter(s => s.is_complete).map(s => `${s.player1_score}-${s.player2_score}`).join(', ');
        const currentPlayTime = matchElapsed - totalPausedTime;

        await logAction(
          'Match Completed',
          'match',
          `Match: ${match.player1_name} vs ${match.player2_name} | Winner: ${winnerName} | Sets: ${p1Wins}-${p2Wins} (${setsStr}) | Duration: ${formatTime(currentPlayTime)} | Court: ${selectedCourt}`,
          user ? { id: user.id, name: user.name } : null
        );

        // Save detailed match history
        const historyData: MatchHistoryData = {
          id: `mh-${match.id}-${Date.now()}`,
          match_id: match.id,
          tournament_id: match.tournament_id,
          event_id: match.event_id,
          umpire_id: match.umpire_id,
          umpire_name: match.umpire_name,
          player1_name: match.player1_name,
          player2_name: match.player2_name,
          scoring_format: `${targetPoints}-point`,
          best_of_games: bestOfGames,
          court: selectedCourt,
          points_history: pointsHistory.map((ph, idx) => ({
            point: idx + 1,
            scorer: ph.scorer,
            p1_score: ph.p1Score,
            p2_score: ph.p2Score,
            set: currentSets.findIndex(s => s.player1_score >= ph.p1Score && s.player2_score >= ph.p2Score) + 1 || 1,
            server: servingTeam,
            timestamp_sec: 0,
          })),
          sets_snapshot: currentSets,
          total_duration_seconds: matchElapsed,
          play_time_seconds: currentPlayTime,
          paused_time_seconds: totalPausedTime,
          started_at: match.actual_start_time || new Date().toISOString(),
          ended_at: new Date().toISOString(),
          winner_id: matchWinner,
          winner_name: winnerName,
          final_status: 'completed',
        };
        saveMatchHistory(historyData).catch(err => console.error('Failed to save match history:', err));
      }
    } catch (err) {
      console.error('Failed to save score:', err);
    }
  }, [state, servingTeam, isPaused, intervalActive, isDoubles, targetPoints, maxCapPoints, bestOfGames, match, midGameIntervalTriggered, selectedCourt, onScoreUpdated]);

  const handleUndo = useCallback(async () => {
    if (state.sets.length === 0 || intervalActive) return;

    const currentSets = [...state.sets];
    const setIdx = state.currentSet;

    // Guard: if setIdx is out of bounds, clamp it
    if (setIdx < 0 || setIdx >= currentSets.length) {
      // Nothing to undo — state is inconsistent, just return
      return;
    }

    const activeSet = { ...currentSets[setIdx] };

    // Guard: if we're at 0-0 in the first set, there's nothing to undo
    if (activeSet.player1_score === 0 && activeSet.player2_score === 0 && setIdx === 0) {
      return;
    }

    playScoreBeep();

    if (activeSet.is_complete) {
      activeSet.is_complete = false;
      activeSet.winner_id = undefined;
    }

    if (activeSet.player1_score === 0 && activeSet.player2_score === 0 && setIdx > 0) {
      currentSets.pop();
      const prevSetIdx = setIdx - 1;
      const prevSet = { ...currentSets[prevSetIdx] };
      prevSet.is_complete = false;
      prevSet.winner_id = undefined;
      currentSets[prevSetIdx] = prevSet;
      
      setState(prev => ({
        ...prev,
        sets: currentSets,
        currentSet: prevSetIdx,
        isMatchComplete: false,
        matchWinnerId: null,
        player1SetsWon: currentSets.filter(s => s.winner_id === match.player1_id).length,
        player2SetsWon: currentSets.filter(s => s.winner_id === match.player2_id).length,
      }));
    } else {
      if (lastScored === 'player1' && activeSet.player1_score > 0) {
        activeSet.player1_score--;
      } else if (lastScored === 'player2' && activeSet.player2_score > 0) {
        activeSet.player2_score--;
      } else {
        if (activeSet.player1_score > activeSet.player2_score) activeSet.player1_score--;
        else if (activeSet.player2_score > 0) activeSet.player2_score--;
        else if (activeSet.player1_score > 0) activeSet.player1_score--;
      }
      currentSets[setIdx] = activeSet;

      setState(prev => ({
        ...prev,
        sets: currentSets,
        isMatchComplete: false,
        matchWinnerId: null,
        player1SetsWon: currentSets.filter(s => s.winner_id === match.player1_id).length,
        player2SetsWon: currentSets.filter(s => s.winner_id === match.player2_id).length,
      }));
    }

    setLastScored(null);
    setPointsHistory(prev => prev.slice(0, -1));

    try {
      await updateMatchScore(
        match.id,
        currentSets,
        'running',
        null,
        match.actual_start_time,
        null,
        selectedCourt
      );
      onScoreUpdated();
    } catch (err) {
      console.error('Failed to undo point:', err);
    }
  }, [state, intervalActive, lastScored, match, selectedCourt, onScoreUpdated]);

  const handleReset = useCallback(async () => {
    if (!window.confirm("Are you sure you want to reset this scorer scoreboard?")) return;

    const initialState = createInitialScoreState();
    setState(initialState);
    setIsPaused(false);
    setLastScored(null);
    setMatchStarted(false);
    setMatchElapsed(0);
    setPauseElapsed(0);
    setTotalPausedTime(0);
    setPointsHistory([]);
    setMidGameIntervalTriggered([false, false, false, false, false]);

    try {
      await updateMatchScore(match.id, initialState.sets, 'scheduled', null, null, null, selectedCourt);
      onScoreUpdated();

      // Audit log: Score Reset
      await logAction(
        'Match Score Reset',
        'match',
        `Match: ${match.player1_name} vs ${match.player2_name} | Scoreboard reset by umpire`,
        user ? { id: user.id, name: user.name } : null
      );
    } catch (err) {
      console.error('Failed to reset match score:', err);
    }
  }, [match, selectedCourt, onScoreUpdated, user]);

  // Determine diagonal serving direction visually
  const isServerScoreEven = currentSet ? (servingTeam === 'player1' ? currentSet.player1_score : currentSet.player2_score) % 2 === 0 : true;

  // Swapping visual controls
  const handleSwitchSides = () => {
    setCourtSides(prev => ({ left: prev.right, right: prev.left }));
    playScoreBeep();
  };

  const handleSwapPartners = (team: 'player1' | 'player2') => {
    if (team === 'player1') {
      setT1Positions(prev => ({ left: prev.right, right: prev.left }));
    } else {
      setT2Positions(prev => ({ left: prev.right, right: prev.left }));
    }
    playScoreBeep();
  };

  // Sub-Tie Matchboard scorers trigger
  const handleScoreSubMatch = useCallback(async (subIdx: number, player: 'player1' | 'player2') => {
    if (!subMatches) return;
    const subMatch = subMatches[subIdx];
    if (subMatch.status === 'completed') return;

    triggerVibration();
    playScoreBeep();

    const currentSets = [...subMatch.sets];
    let setIdx = currentSets.length - 1;
    if (setIdx < 0 || currentSets[setIdx].is_complete) {
      currentSets.push({
        set_number: currentSets.length + 1,
        player1_score: 0,
        player2_score: 0,
        is_complete: false,
      });
      setIdx = currentSets.length - 1;
    }

    const activeSet = { ...currentSets[setIdx] };
    if (player === 'player1') activeSet.player1_score++;
    else activeSet.player2_score++;

    const p1 = activeSet.player1_score;
    const p2 = activeSet.player2_score;

    let isComplete = false;
    let setWinner: string | undefined = undefined;

    if (p1 >= targetPoints || p2 >= targetPoints) {
      const diff = Math.abs(p1 - p2);
      if (diff >= 2 || p1 === maxCapPoints || p2 === maxCapPoints) {
        isComplete = true;
        setWinner = p1 > p2 ? match.player1_id : match.player2_id;
      }
    }

    activeSet.is_complete = isComplete;
    activeSet.winner_id = setWinner;
    currentSets[setIdx] = activeSet;

    // Celebration check
    const margin = tournament?.bonus_point_margin || 5;
    if (isComplete && Math.abs(p1 - p2) >= margin) {
      const winnerName = p1 > p2 ? match.player1_name : match.player2_name;
      alert(`💥 Margin Cleared! ${winnerName} wins by ${Math.abs(p1 - p2)} pts! Team secures a Bonus Point! 🎉`);
    }

    const nextSubMatches = [...subMatches];
    const updatedSubMatch = { ...subMatch, sets: currentSets, status: 'running' as MatchStatus };

    const p1Wins = currentSets.filter(s => s.winner_id === match.player1_id).length;
    const p2Wins = currentSets.filter(s => s.winner_id === match.player2_id).length;

    if (p1Wins >= Math.ceil(bestOfGames / 2) || p2Wins >= Math.ceil(bestOfGames / 2)) {
      updatedSubMatch.status = 'completed';
      updatedSubMatch.winner_id = p1Wins >= p2Wins ? match.player1_id : match.player2_id;
    }

    nextSubMatches[subIdx] = updatedSubMatch;
    setSubMatches(nextSubMatches);

    const totalTies = nextSubMatches.length;
    const needed = Math.ceil(totalTies / 2);
    const team1Wins = nextSubMatches.filter(s => s.status === 'completed' && s.winner_id === match.player1_id).length;
    const team2Wins = nextSubMatches.filter(s => s.status === 'completed' && s.winner_id === match.player2_id).length;

    let nextStatus: MatchStatus = 'running';
    let nextWinnerId: string | null = null;

    if (team1Wins >= needed) {
      nextStatus = 'completed';
      nextWinnerId = match.player1_id;
    } else if (team2Wins >= needed) {
      nextStatus = 'completed';
      nextWinnerId = match.player2_id;
    }

    setOverallStatus(nextStatus);
    setOverallWinnerId(nextWinnerId);

    try {
      await updateMatchScore(
        match.id,
        match.sets,
        nextStatus,
        nextWinnerId,
        match.actual_start_time || new Date().toISOString(),
        nextStatus === 'completed' ? new Date().toISOString() : null,
        selectedCourt,
        nextSubMatches
      );
      onScoreUpdated();
    } catch (err) {
      console.error('Failed to update sub-match score:', err);
    }
  }, [subMatches, match, targetPoints, maxCapPoints, bestOfGames, tournament, selectedCourt, onScoreUpdated]);

  const handleSubMatchUndo = useCallback(async (subIdx: number) => {
    if (!subMatches) return;
    const subMatch = subMatches[subIdx];
    if (subMatch.sets.length === 0) return;

    playScoreBeep();

    const currentSets = [...subMatch.sets];
    const setIdx = currentSets.length - 1;
    const activeSet = { ...currentSets[setIdx] };

    if (activeSet.is_complete) {
      activeSet.is_complete = false;
      activeSet.winner_id = undefined;
    }

    if (activeSet.player1_score === 0 && activeSet.player2_score === 0 && currentSets.length > 1) {
      currentSets.pop();
    } else {
      if (activeSet.player2_score > activeSet.player1_score) activeSet.player2_score--;
      else if (activeSet.player1_score > 0) activeSet.player1_score--;
      currentSets[setIdx] = activeSet;
    }

    const nextSubMatches = [...subMatches];
    nextSubMatches[subIdx] = { ...subMatch, sets: currentSets, status: 'running' };
    setSubMatches(nextSubMatches);
    setOverallWinnerId(null);
    setOverallStatus('running');

    try {
      await updateMatchScore(
        match.id,
        match.sets,
        'running',
        null,
        match.actual_start_time,
        null,
        selectedCourt,
        nextSubMatches
      );
      onScoreUpdated();
    } catch (err) {
      console.error('Failed to undo sub-match score:', err);
    }
  }, [subMatches, match, selectedCourt, onScoreUpdated]);

  const getPlayerOccurrences = useCallback((name: string) => {
    if (!name || !name.trim()) return 0;
    let count = 0;
    subMatches.forEach(s => {
      s.player1_names.forEach(p => { if (p && p.trim().toLowerCase() === name.trim().toLowerCase()) count++; });
      s.player2_names.forEach(p => { if (p && p.trim().toLowerCase() === name.trim().toLowerCase()) count++; });
    });
    return count;
  }, [subMatches]);

  const isPlayerInMultipleSingles = useCallback((name: string) => {
    if (!name || !name.trim()) return false;
    let singlesCount = 0;
    subMatches.forEach(s => {
      const isSingles = !s.event_type.endsWith('D');
      if (isSingles) {
        s.player1_names.forEach(p => { if (p && p.trim().toLowerCase() === name.trim().toLowerCase()) singlesCount++; });
        s.player2_names.forEach(p => { if (p && p.trim().toLowerCase() === name.trim().toLowerCase()) singlesCount++; });
      }
    });
    return singlesCount > 1;
  }, [subMatches]);

  const handleTrumpToggle = async (subIdx: number, team: 'player1' | 'player2') => {
    if (!subMatches) return;
    const nextSubMatches = subMatches.map((s, idx) => {
      const isTarget = idx === subIdx;
      if (team === 'player1') {
        return {
          ...s,
          t1_trump: isTarget ? !s.t1_trump : false // reset others
        };
      } else {
        return {
          ...s,
          t2_trump: isTarget ? !s.t2_trump : false // reset others
        };
      }
    });

    setSubMatches(nextSubMatches);

    try {
      await updateMatchScore(
        match.id,
        match.sets,
        match.status,
        match.winner_id,
        match.actual_start_time,
        null,
        selectedCourt,
        nextSubMatches
      );
      onScoreUpdated();
    } catch (err) {
      console.error('Failed to update Trump Match toggle:', err);
    }
  };

  const handleSubMatchEventTypeChange = async (subIdx: number, newEventType: string) => {
    if (!subMatches) return;
    const nextSubMatches = [...subMatches];
    nextSubMatches[subIdx] = {
      ...nextSubMatches[subIdx],
      event_type: newEventType
    };
    setSubMatches(nextSubMatches);

    try {
      await updateMatchScore(
        match.id,
        match.sets,
        match.status,
        match.winner_id,
        match.actual_start_time,
        null,
        selectedCourt,
        nextSubMatches
      );
      onScoreUpdated();
    } catch (err) {
      console.error('Failed to change sub-match event type:', err);
    }
  };

  const handleRosterSelect = async (subIdx: number, team: 'player1' | 'player2', slot: number, name: string) => {
    if (!subMatches) return;
    const nextSubMatches = [...subMatches];
    const subMatch = { ...nextSubMatches[subIdx] };
    
    if (team === 'player1') {
      const names = [...subMatch.player1_names];
      names[slot] = name;
      subMatch.player1_names = names.filter(Boolean);
    } else {
      const names = [...subMatch.player2_names];
      names[slot] = name;
      subMatch.player2_names = names.filter(Boolean);
    }
    
    nextSubMatches[subIdx] = subMatch;
    setSubMatches(nextSubMatches);

    try {
      await updateMatchScore(
        match.id,
        match.sets,
        match.status,
        match.winner_id,
        match.actual_start_time,
        null,
        selectedCourt,
        nextSubMatches
      );
      onScoreUpdated();
    } catch (err) {
      console.error('Failed to save roster assignment:', err);
    }
  };

  const playTime = matchElapsed - totalPausedTime;

  // 1. Setup screen prior to match starting
  if (!matchStarted) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto' }} className="glass-card animate-slide-up">
        <div style={{ padding: 32 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
            🏟️ Match Setup Scorer Board
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>
            Configure and synchronize court configurations before starting game play.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            <div className="input-group">
              <label className="input-label">Court Selection</label>
              <select className="input" value={selectedCourt} onChange={e => setSelectedCourt(e.target.value)}>
                <option value="Court 1">Court 1</option>
                <option value="Court 2">Court 2</option>
                <option value="Court 3">Court 3</option>
                <option value="Court 4">Court 4</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Scoring Format Cap</label>
              <select
                className="input"
                value={targetPoints}
                onChange={e => {
                  const pts = parseInt(e.target.value);
                  setTargetPoints(pts);
                  setMaxCapPoints(pts === 21 ? 30 : pts === 15 ? 21 : 15);
                }}
              >
                <option value="21">21 Points (Standard BWF)</option>
                <option value="15">15 Points (Operational Cap)</option>
                <option value="11">11 Points (Short Game)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            <div className="input-group">
              <label className="input-label">Game Length</label>
              <select className="input" value={bestOfGames} onChange={e => setBestOfGames(parseInt(e.target.value))}>
                <option value="3">Best of 3 Sets</option>
                <option value="1">Single Game Match</option>
                <option value="5">Best of 5 Sets</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Initial Serve Team</label>
              <select className="input" value={servingTeam} onChange={e => setServingTeam(e.target.value as any)}>
                <option value="player1">{match.player1_name} (Serve First)</option>
                <option value="player2">{match.player2_name} (Serve First)</option>
              </select>
            </div>
          </div>

          {/* Court Position Preview */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10, textAlign: 'center' }}>
              🏟️ Court Preview — Player Positions
            </div>
            <div style={{
              background: '#008751', border: '3px solid rgba(255,255,255,0.85)', borderRadius: 8,
              display: 'grid', gridTemplateColumns: '1fr 4px 1fr',
              height: isDoubles ? 140 : 100, position: 'relative', overflow: 'hidden',
            }}>
              {/* Left Court */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: isDoubles ? 8 : 0, padding: 8 }}>
                {isDoubles ? (
                  <>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', textAlign: 'center', padding: '4px 8px', background: 'rgba(255,255,255,0.15)', borderRadius: 4, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                      {courtSides.left === 'player1' ? t1Positions.left : t2Positions.left}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', textAlign: 'center', padding: '4px 8px', background: 'rgba(255,255,255,0.15)', borderRadius: 4, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                      {courtSides.left === 'player1' ? t1Positions.right : t2Positions.right}
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', textAlign: 'center', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                    {courtSides.left === 'player1' ? match.player1_name : match.player2_name}
                  </div>
                )}
              </div>
              {/* Net */}
              <div style={{
                backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.85) 50%, transparent 50%)',
                backgroundSize: '4px 8px',
                backgroundRepeat: 'repeat-y',
              }} />
              {/* Right Court */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: isDoubles ? 8 : 0, padding: 8 }}>
                {isDoubles ? (
                  <>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', textAlign: 'center', padding: '4px 8px', background: 'rgba(255,255,255,0.15)', borderRadius: 4, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                      {courtSides.right === 'player1' ? t1Positions.right : t2Positions.right}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', textAlign: 'center', padding: '4px 8px', background: 'rgba(255,255,255,0.15)', borderRadius: 4, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                      {courtSides.right === 'player1' ? t1Positions.left : t2Positions.left}
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', textAlign: 'center', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                    {courtSides.right === 'player1' ? match.player1_name : match.player2_name}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
              <button className="btn btn-secondary btn-sm" onClick={handleSwitchSides} style={{ fontSize: 11 }}>
                🔄 Swap Court Sides
              </button>
              {isDoubles && (
                <>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleSwapPartners('player1')} style={{ fontSize: 11, marginLeft: 8 }}>👥 Swap {p1Names[0].split(' ')[0]}</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleSwapPartners('player2')} style={{ fontSize: 11, marginLeft: 8 }}>👥 Swap {p2Names[0].split(' ')[0]}</button>
                </>
              )}
            </div>
          </div>

          <button className="btn btn-primary btn-lg" style={{ width: '100%', padding: '14px 20px', fontSize: 16, fontWeight: 700 }} onClick={handleStartMatch}>
            <IconPlay size={18} /> Start Match & Timer
          </button>
        </div>
      </div>
    );
  }

  // Render Sub-Tie Matchboard view for team matches
  if (isTeamMatch && activeSubMatchIdx === null) {
    const isOverallComplete = overallStatus === 'completed';
    const team1SubWins = subMatches.filter(s => s.status === 'completed' && s.winner_id === match.player1_id).length;
    const team2SubWins = subMatches.filter(s => s.status === 'completed' && s.winner_id === match.player2_id).length;

    return (
      <div style={{ maxWidth: 740, margin: '0 auto' }} className="animate-slide-up">
        <div className="glass-card" style={{ padding: 24, marginBottom: 24, border: isOverallComplete ? '1px solid rgba(168,85,247,0.3)' : undefined }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>📍 COURT: {selectedCourt}</span>
            <span className={`badge badge-${overallStatus}`}>{overallStatus}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, margin: '12px 0' }}>
            <div style={{ textAlign: 'right', flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{match.player1_name}</div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Roster competitors</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-secondary)', padding: '6px 16px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: team1SubWins > team2SubWins ? 'var(--score-win)' : 'var(--text-primary)' }}>{team1SubWins}</span>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>TIES</span>
              <span style={{ fontSize: 24, fontWeight: 800, color: team2SubWins > team1SubWins ? 'var(--score-win)' : 'var(--text-primary)' }}>{team2SubWins}</span>
            </div>

            <div style={{ textAlign: 'left', flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{match.player2_name}</div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Roster competitors</span>
            </div>
          </div>

          {isOverallComplete && (
            <div style={{ textAlign: 'center', marginTop: 16, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
              <h4 style={{ color: 'var(--score-win)', margin: 0, fontWeight: 700 }}>
                🏆 Tie Complete! {overallWinnerId === match.player1_id ? match.player1_name : match.player2_name} Wins ({team1SubWins} - {team2SubWins})
              </h4>
            </div>
          )}
        </div>

        {/* List of sub-matches */}
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>🏸 Sub-Matches Dashboard</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {subMatches.map((sub, sIdx) => {
            const isSubComplete = sub.status === 'completed';
            const isSubRunning = sub.status === 'running';
            const isSubDoubles = sub.event_type.endsWith('D');
            const slots = isSubDoubles ? [0, 1] : [0];

            // Check constraints
            let hasRosterViolation = false;
            let hasSinglesViolation = false;
            let offendingPlayers: string[] = [];

            const allNames = [...sub.player1_names, ...sub.player2_names].filter(Boolean);
            allNames.forEach(name => {
              if (getPlayerOccurrences(name) > 2) {
                hasRosterViolation = true;
                offendingPlayers.push(name);
              }
              if (isPlayerInMultipleSingles(name)) {
                hasSinglesViolation = true;
                offendingPlayers.push(name);
              }
            });

            const hasTrump = sub.t1_trump || sub.t2_trump;
            let cardBorder = isSubRunning ? '1px solid var(--accent)' : undefined;
            let cardBoxShadow = undefined;
            if (hasTrump) {
              cardBorder = '1px solid rgba(245, 158, 11, 0.6)';
              cardBoxShadow = '0 0 15px rgba(245, 158, 11, 0.2)';
            }

            return (
              <div key={sub.id} className="glass-card" style={{ padding: 20, border: cardBorder, boxShadow: cardBoxShadow }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {!isSubRunning && !isSubComplete ? (
                      <select
                        className="input"
                        style={{ height: 26, fontSize: 11, padding: '0 6px', width: 'auto', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                        value={sub.event_type}
                        onChange={e => handleSubMatchEventTypeChange(sIdx, e.target.value)}
                      >
                        {(tournament?.team_tie_events || ['MS', 'MD', 'XD']).map(evt => (
                          <option key={evt} value={evt}>{evt}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="badge badge-accent" style={{ fontWeight: 700 }}>{sub.event_type}</span>
                    )}

                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      {sub.event_type === 'MS' ? "Men's Singles" :
                       sub.event_type === 'MD' ? "Men's Doubles" :
                       sub.event_type === 'WS' ? "Women's Singles" :
                       sub.event_type === 'WD' ? "Women's Doubles" : "Mixed Doubles"}
                    </span>
                    {sub.t1_trump && <span className="badge" style={{ background: '#f59e0b', color: '#000', fontWeight: 700, fontSize: 10, borderRadius: 'var(--radius-sm)' }}>🃏 T1 TRUMP</span>}
                    {sub.t2_trump && <span className="badge" style={{ background: '#f59e0b', color: '#000', fontWeight: 700, fontSize: 10, borderRadius: 'var(--radius-sm)' }}>🃏 T2 TRUMP</span>}
                  </div>
                  <span className={`badge badge-${sub.status}`}>{sub.status}</span>
                </div>

                {/* Validation errors */}
                {(hasRosterViolation || hasSinglesViolation) && (
                  <div style={{
                    marginBottom: 12,
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 12px',
                    fontSize: 11,
                    fontWeight: 500,
                    color: 'var(--score-loss)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4
                  }}>
                    {hasRosterViolation && (
                      <div>⚠️ Max 2 Matches limit violated for: <strong>{[...new Set(offendingPlayers.filter(name => getPlayerOccurrences(name) > 2))].join(', ')}</strong></div>
                    )}
                    {hasSinglesViolation && (
                      <div>⚠️ Player assigned to multiple Singles matches: <strong>{[...new Set(offendingPlayers.filter(name => isPlayerInMultipleSingles(name)))].join(', ')}</strong></div>
                    )}
                  </div>
                )}

                {/* Rosters Selection */}
                {!isOverallComplete && !isSubComplete && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 14, background: 'var(--bg-secondary)', padding: 12, borderRadius: 'var(--radius-md)' }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>{match.player1_name} Roster Selection</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {slots.map(slot => (
                          <div key={slot} style={{ display: 'flex', gap: 4 }}>
                            <input
                              type="text"
                              className="input"
                              style={{ height: 32, fontSize: 12, padding: '0 8px', flex: 1 }}
                              placeholder={`Type Player ${slot + 1} name...`}
                              value={sub.player1_names[slot] || ''}
                              onChange={e => handleRosterSelect(sIdx, 'player1', slot, e.target.value)}
                              list={`players-list-1-${sIdx}-${slot}`}
                            />
                            <datalist id={`players-list-1-${sIdx}-${slot}`}>
                              {team1Roster.map(p => (
                                <option key={p.id} value={p.name} />
                              ))}
                            </datalist>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>{match.player2_name} Roster Selection</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {slots.map(slot => (
                          <div key={slot} style={{ display: 'flex', gap: 4 }}>
                            <input
                              type="text"
                              className="input"
                              style={{ height: 32, fontSize: 12, padding: '0 8px', flex: 1 }}
                              placeholder={`Type Player ${slot + 1} name...`}
                              value={sub.player2_names[slot] || ''}
                              onChange={e => handleRosterSelect(sIdx, 'player2', slot, e.target.value)}
                              list={`players-list-2-${sIdx}-${slot}`}
                            />
                            <datalist id={`players-list-2-${sIdx}-${slot}`}>
                              {team2Roster.map(p => (
                                <option key={p.id} value={p.name} />
                              ))}
                            </datalist>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub Match Competitors info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: sub.winner_id === match.player1_id ? 'var(--score-win)' : 'var(--text-primary)' }}>
                      {sub.player1_names.join(' / ') || 'TBD Team 1'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{match.player1_name}</div>
                  </div>

                  {/* Sub Match Score aggregate */}
                  <div style={{ textAlign: 'center', background: 'var(--bg-secondary)', padding: '6px 12px', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                      {sub.sets.length > 0
                        ? sub.sets.map(s => `${s.player1_score}-${s.player2_score}`).join(' | ')
                        : 'No sets'}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: sub.winner_id === match.player2_id ? 'var(--score-win)' : 'var(--text-primary)' }}>
                      {sub.player2_names.join(' / ') || 'TBD Team 2'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{match.player2_name}</div>
                  </div>
                </div>

                {/* Optional Trump Match Selector */}
                {!isOverallComplete && !isSubComplete && (
                  <div style={{ display: 'flex', gap: 12, marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 12, alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>🃏 Optional Trump Selectors:</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{
                          fontSize: 10,
                          padding: '2px 8px',
                          border: sub.t1_trump ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                          background: sub.t1_trump ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'transparent',
                          color: sub.t1_trump ? '#000' : 'var(--text-secondary)',
                          fontWeight: 700,
                        }}
                        onClick={() => handleTrumpToggle(sIdx, 'player1')}
                      >
                        {sub.t1_trump ? '🃏 T1 Trump' : '🃏 Select T1 Trump'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{
                          fontSize: 10,
                          padding: '2px 8px',
                          border: sub.t2_trump ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                          background: sub.t2_trump ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'transparent',
                          color: sub.t2_trump ? '#000' : 'var(--text-secondary)',
                          fontWeight: 700,
                        }}
                        onClick={() => handleTrumpToggle(sIdx, 'player2')}
                      >
                        {sub.t2_trump ? '🃏 T2 Trump' : '🃏 Select T2 Trump'}
                      </button>
                    </div>
                  </div>
                )}

                {!isOverallComplete && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setActiveSubMatchIdx(sIdx)}
                      disabled={sub.player1_names.length === 0 || sub.player2_names.length === 0 || hasRosterViolation}
                    >
                      {isSubComplete ? "Edit Score" : isSubRunning ? "Resume Scoring" : "Start Scoring"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Render Sub-Match view for active sub match scoring
  if (isTeamMatch && activeSubMatchIdx !== null) {
    const subMatch = subMatches[activeSubMatchIdx];
    const currentSubSet = subMatch.sets[subMatch.sets.length - 1];
    const p1Name = subMatch.player1_names.join(' / ') || `${match.player1_name} Player(s)`;
    const p2Name = subMatch.player2_names.join(' / ') || `${match.player2_name} Player(s)`;
    const isSubDeuce = currentSubSet ? isDeuce(currentSubSet, { maxPoints: targetPoints, absoluteMax: maxCapPoints } as any) : false;
    const isSubComplete = subMatch.status === 'completed';

    return (
      <div style={{ maxWidth: 700, margin: '0 auto' }} className="animate-slide-up">
        <button className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }} onClick={() => setActiveSubMatchIdx(null)}>
          <IconArrowLeft size={16} /> Back to Tie Matchboard
        </button>

        <div className="glass-card" style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>🔥 Sub-Match: {subMatch.event_type}</span>
            <span className="badge badge-accent">{targetPoints}-Pt Game</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 12 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Sets Won</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>
                {subMatch.sets.filter(s => s.winner_id === match.player1_id).length}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Sets Won</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>
                {subMatch.sets.filter(s => s.winner_id === match.player2_id).length}
              </div>
            </div>
          </div>

          {isSubDeuce && !isSubComplete && (
            <div style={{ textAlign: 'center', background: 'rgba(245,158,11,0.1)', color: 'var(--score-point)', padding: '4px 12px', borderRadius: 20, marginTop: 12, fontSize: 12, fontWeight: 600 }}>
              ⚡ DEUCE ACTIVE (Limit: {maxCapPoints})
            </div>
          )}
        </div>

        {/* Scoring Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <button className="score-button" onClick={() => handleScoreSubMatch(activeSubMatchIdx, 'player1')} disabled={isSubComplete}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>{p1Name}</div>
            <div style={{ fontSize: 64, fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{currentSubSet?.player1_score ?? 0}</div>
            {isSubComplete && subMatch.winner_id === match.player1_id && <div style={{ color: 'var(--score-win)', marginTop: 8 }}>🏆 Winner</div>}
          </button>

          <button className="score-button" onClick={() => handleScoreSubMatch(activeSubMatchIdx, 'player2')} disabled={isSubComplete}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>{p2Name}</div>
            <div style={{ fontSize: 64, fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{currentSubSet?.player2_score ?? 0}</div>
            {isSubComplete && subMatch.winner_id === match.player2_id && <div style={{ color: 'var(--score-win)', marginTop: 8 }}>🏆 Winner</div>}
          </button>
        </div>

        {/* Action button */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
          <button className="btn btn-secondary" onClick={() => handleSubMatchUndo(activeSubMatchIdx)} disabled={subMatch.sets.length === 0}>
            <IconUndo size={16} /> Undo Point
          </button>
          <button className="btn btn-secondary" onClick={() => setActiveSubMatchIdx(null)}>Return to Dashboard</button>
        </div>

        {/* Set list */}
        {subMatch.sets.length > 0 && (
          <div className="glass-card" style={{ padding: 16, marginTop: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Sets Summary</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {subMatch.sets.map((set, setIdx) => (
                <div key={setIdx} style={{ padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', minWidth: 70, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Set {set.set_number}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                    {set.player1_score} - {set.player2_score}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // BWF Game point calculations
  const gamePointPlayer = currentSet ? getGamePoint(currentSet, match.player1_id, match.player2_id, { maxPoints: targetPoints } as any) : null;
  const isDeuceActive = currentSet ? isDeuce(currentSet, { maxPoints: targetPoints, absoluteMax: maxCapPoints } as any) : false;

  // Helper: computed scores for left/right court sides
  const leftScore = courtSides.left === 'player1' ? (currentSet?.player1_score ?? 0) : (currentSet?.player2_score ?? 0);
  const rightScore = courtSides.right === 'player1' ? (currentSet?.player1_score ?? 0) : (currentSet?.player2_score ?? 0);
  const currentSetNumber = currentSet?.set_number ?? 1;

  return (
    <div style={{
      maxWidth: 600,
      margin: '0 auto',
      background: '#07080c', 
      padding: '12px',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid rgba(255,255,255,0.06)',
      boxShadow: '0 16px 48px rgba(0, 0, 0, 0.75)',
      color: '#ffffff',
    }} className="animate-slide-up">
      {/* BWF Countdown Interval screen overlay */}
      {intervalActive && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: '#0a0a0a', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          zIndex: 2000, padding: 24
        }}>
          {intervalType === 'mid-game' ? (
            <>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                11, {currentSetNumber}. Interval
              </div>
              <div style={{ fontSize: 120, fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#fff', lineHeight: 1, marginBottom: 40 }}>
                {intervalTimeLeft}
              </div>
              <button
                className="btn btn-primary btn-lg"
                onClick={() => setIntervalActive(false)}
                style={{ minWidth: 220, fontSize: 16, padding: '14px 32px' }}
              >
                Resume game
              </button>
            </>
          ) : (
            <>
              <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
                padding: 24, width: '100%', maxWidth: 480, marginBottom: 32
              }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: 'var(--score-win)' }}>
                  {gameWinnerSummary}
                </h2>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                  <span>{match.player1_name}</span>
                  <span>{state.sets.map(s => s.player1_score).join('  ')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginTop: 4 }}>
                  <span>{match.player2_name}</span>
                  <span>{state.sets.map(s => s.player2_score).join('  ')}</span>
                </div>
              </div>

              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Interval</div>
              <div style={{ fontSize: 100, fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#fff', lineHeight: 1, marginBottom: 12 }}>
                {intervalTimeLeft}
              </div>

              {isDoubles && (
                <div style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                  padding: 16, marginBottom: 24, width: '100%', maxWidth: 320, textAlign: 'center'
                }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>Rearrange players for next game</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div style={{ padding: 8, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 600 }}>
                      {courtSides.left === 'player1' ? t1Positions.left : t2Positions.left}
                    </div>
                    <div style={{ padding: 8, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 600 }}>
                      {courtSides.right === 'player1' ? t1Positions.right : t2Positions.right}
                    </div>
                    <div style={{ padding: 8, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 600 }}>
                      {courtSides.left === 'player1' ? t1Positions.right : t2Positions.right}
                    </div>
                    <div style={{ padding: 8, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 600 }}>
                      {courtSides.right === 'player1' ? t1Positions.left : t2Positions.left}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 10 }}>
                    <button className="btn btn-secondary btn-sm" onClick={handleSwitchSides} style={{ fontSize: 11 }}>🔄 Switch Ends</button>
                    {isDoubles && (
                      <>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleSwapPartners('player1')} style={{ fontSize: 11 }}>👥 Swap L</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleSwapPartners('player2')} style={{ fontSize: 11 }}>👥 Swap R</button>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                <button className="btn btn-primary" onClick={() => setIntervalActive(false)} style={{ minWidth: 120 }}>▶ Continue</button>
                <button className="btn btn-secondary" onClick={handleUndo}>↩ Undo</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══════════ GAME HEADER ═══════════ */}
      <div style={{
        background: 'linear-gradient(135deg, #131722 0%, #0d0f14 100%)', 
        borderRadius: 'var(--radius-lg)', 
        padding: '12px 16px',
        marginBottom: 10, 
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#22c55e', textShadow: '0 0 8px rgba(34,197,94,0.35)' }}>Game {currentSetNumber}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>
              {selectedCourt} · {match.is_adhoc ? (match.round_name || 'Ad-hoc Match') : `${tournament?.name || ''}${event?.event_name ? ` · ${event.event_name}` : ''}`}
            </span>
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => setSettingsOpen(true)}
              style={{ width: 28, height: 28, fontSize: 14, padding: 0 }}
              title="Settings"
            >⚙️</button>
          </div>
        </div>

        {/* Player names + all set scores in a compact strip */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontSize: 14, fontWeight: 700, flex: 1, 
              color: servingTeam === 'player1' ? '#facc15' : '#ffffff',
              textShadow: servingTeam === 'player1' ? '0 0 8px rgba(250,204,21,0.3)' : 'none',
              ...(state.matchWinnerId === match.player1_id ? { color: '#22c55e' } : {})
            }}>
              {servingTeam === 'player1' && !state.isMatchComplete && <span style={{ color: '#ef4444', marginRight: 6 }}>🏸</span>}
              {match.player1_name}
            </span>
            <div style={{ display: 'flex', gap: 6, fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14 }}>
              {state.sets.map((s, i) => (
                <span key={i} style={{
                  color: s.winner_id === match.player1_id ? '#22c55e' :
                         s.winner_id === match.player2_id ? '#64748b' : '#ffffff',
                  minWidth: 20, textAlign: 'center',
                  ...(i === state.currentSet && !s.is_complete ? {
                    background: 'rgba(99,102,241,0.25)', 
                    borderRadius: 4, 
                    padding: '2px 6px',
                    border: '1px solid #818cf8',
                    boxShadow: '0 0 8px rgba(99,102,241,0.35)',
                  } : {
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: 4,
                    padding: '2px 4px',
                  })
                }}>{s.player1_score}</span>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontSize: 14, fontWeight: 700, flex: 1, 
              color: servingTeam === 'player2' ? '#facc15' : '#ffffff',
              textShadow: servingTeam === 'player2' ? '0 0 8px rgba(250,204,21,0.3)' : 'none',
              ...(state.matchWinnerId === match.player2_id ? { color: '#22c55e' } : {})
            }}>
              {servingTeam === 'player2' && !state.isMatchComplete && <span style={{ color: '#ef4444', marginRight: 6 }}>🏸</span>}
              {match.player2_name}
            </span>
            <div style={{ display: 'flex', gap: 6, fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14 }}>
              {state.sets.map((s, i) => (
                <span key={i} style={{
                  color: s.winner_id === match.player2_id ? '#22c55e' :
                         s.winner_id === match.player1_id ? '#64748b' : '#ffffff',
                  minWidth: 20, textAlign: 'center',
                  ...(i === state.currentSet && !s.is_complete ? {
                    background: 'rgba(99,102,241,0.25)', 
                    borderRadius: 4, 
                    padding: '2px 6px',
                    border: '1px solid #818cf8',
                    boxShadow: '0 0 8px rgba(99,102,241,0.35)',
                  } : {
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: 4,
                    padding: '2px 4px',
                  })
                }}>{s.player2_score}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Timer + sets won */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
          <span>⏱ {formatTime(playTime)}</span>
          <span>Sets: {state.player1SetsWon} - {state.player2SetsWon} (Best of {bestOfGames})</span>
        </div>

        {/* Win Predictor Gauge */}
        <WinPredictorGauge 
          player1Name={match.player1_name}
          player2Name={match.player2_name}
          player1Score={currentSet?.player1_score ?? 0}
          player2Score={currentSet?.player2_score ?? 0}
          player1Sets={state.player1SetsWon}
          player2Sets={state.player2SetsWon}
          servingTeam={servingTeam}
        />
      </div>

      {/* Status indicators */}
      {isDeuceActive && !state.isMatchComplete && (
        <div style={{ textAlign: 'center', background: 'rgba(245,158,11,0.15)', color: 'var(--score-point)', padding: '6px 16px', borderRadius: 'var(--radius-full)', marginBottom: 10, fontSize: 12, fontWeight: 700 }}>
          ⚡ DEUCE (Cap: {maxCapPoints})
        </div>
      )}
      {gamePointPlayer && !isDeuceActive && !state.isMatchComplete && (
        <div style={{ textAlign: 'center', background: 'rgba(34,197,94,0.15)', color: 'var(--score-win)', padding: '6px 16px', borderRadius: 'var(--radius-full)', marginBottom: 10, fontSize: 12, fontWeight: 700 }}>
          🏆 GAME POINT — {gamePointPlayer === match.player1_id ? match.player1_name : match.player2_name}
        </div>
      )}
      {isPaused && !state.isMatchComplete && (
        <div style={{ textAlign: 'center', background: 'rgba(245,158,11,0.15)', color: 'var(--score-point)', padding: '8px 16px', borderRadius: 'var(--radius-full)', marginBottom: 10, fontSize: 14, fontWeight: 700 }}>
          ⏸ MATCH PAUSED — Tap resume to continue
        </div>
      )}
 
      {/* ═══════════ INTERACTIVE COURT SCORING ═══════════ */}
      <div style={{
        position: 'relative',
        width: '100%',
        background: '#008751', // Authentic green mat color from reference picture
        border: '12px solid #008751', // Green margin border from picture
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.45)',
        marginBottom: 12,
        overflow: 'hidden',
        minHeight: isDoubles ? 260 : 200,
        opacity: isPaused || state.isMatchComplete ? 0.4 : 1,
        pointerEvents: isPaused || state.isMatchComplete ? 'none' : 'auto',
        transition: 'opacity 0.2s',
      }}>
        {/* Court markings (White lines, 2.5px) */}
        {/* Outer Court Boundary */}
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, border: '3px solid #ffffff', pointerEvents: 'none' }} />
        
        {/* Top & Bottom Singles Sidelines (Inner side lines) */}
        <div style={{ position: 'absolute', top: '7.5%', left: 0, right: 0, borderTop: '2.5px solid #ffffff', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '7.5%', left: 0, right: 0, borderTop: '2.5px solid #ffffff', pointerEvents: 'none' }} />
        
        {/* Left Short Service Line */}
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: '35.2%', borderLeft: '2.5px solid #ffffff', pointerEvents: 'none' }} />
        
        {/* Right Short Service Line */}
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: '64.8%', borderLeft: '2.5px solid #ffffff', pointerEvents: 'none' }} />
        
        {/* Center Net Divider (Vertical dashed line exactly in the middle) */}
        <div style={{
          position: 'absolute', top: 0, bottom: 0, left: '50%',
          width: '3px',
          transform: 'translateX(-50%)',
          backgroundImage: 'linear-gradient(to bottom, #ffffff 55%, transparent 45%)',
          backgroundSize: '3px 8px',
          backgroundRepeat: 'repeat-y',
          zIndex: 15, pointerEvents: 'none'
        }} />
        
        {/* Left Center Line (horizontal divider between left service courts) */}
        <div style={{ position: 'absolute', top: '50%', left: 0, right: '64.8%', borderTop: '2.5px solid #ffffff', pointerEvents: 'none' }} />
        
        {/* Right Center Line (horizontal divider between right service courts) */}
        <div style={{ position: 'absolute', top: '50%', left: '64.8%', right: 0, borderTop: '2.5px solid #ffffff', pointerEvents: 'none' }} />
        
        {/* Left Doubles Long Service Line */}
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: '5.7%', borderLeft: '2.5px solid #ffffff', pointerEvents: 'none' }} />
        
        {/* Right Doubles Long Service Line */}
        <div style={{ position: 'absolute', top: 0, bottom: 0, right: '5.7%', borderRight: '2.5px solid #ffffff', pointerEvents: 'none' }} />

        {/* Serve quadrant highlights */}
        {servingTeam === courtSides.left && isDoubles && (
          <div style={{
            position: 'absolute',
            top: isServerScoreEven ? '50%' : 0,
            bottom: isServerScoreEven ? 0 : '50%',
            left: '5.7%', right: '64.8%',
            background: 'rgba(239, 68, 68, 0.25)',
            borderBottom: isServerScoreEven ? 'none' : '2px solid rgba(239, 68, 68, 0.5)',
            borderTop: isServerScoreEven ? '2px solid rgba(239, 68, 68, 0.5)' : 'none',
            pointerEvents: 'none',
            borderRadius: 4,
          }} />
        )}
        {servingTeam === courtSides.left && !isDoubles && (
          <div style={{
            position: 'absolute', 
            top: isServerScoreEven ? '50%' : '7.5%',
            bottom: isServerScoreEven ? '7.5%' : '50%',
            left: 0, right: '64.8%',
            background: 'rgba(239, 68, 68, 0.25)',
            border: '2px solid rgba(239, 68, 68, 0.4)',
            pointerEvents: 'none',
            borderRadius: 4,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }} />
        )}
        {servingTeam === courtSides.right && isDoubles && (
          <div style={{
            position: 'absolute',
            top: isServerScoreEven ? 0 : '50%',
            bottom: isServerScoreEven ? '50%' : 0,
            left: '64.8%', right: '5.7%',
            background: 'rgba(239, 68, 68, 0.25)',
            borderBottom: isServerScoreEven ? '2px solid rgba(239, 68, 68, 0.5)' : 'none',
            borderTop: isServerScoreEven ? 'none' : '2px solid rgba(239, 68, 68, 0.5)',
            pointerEvents: 'none',
            borderRadius: 4,
          }} />
        )}
        {servingTeam === courtSides.right && !isDoubles && (
          <div style={{
            position: 'absolute', 
            top: isServerScoreEven ? '7.5%' : '50%',
            bottom: isServerScoreEven ? '50%' : '7.5%',
            left: '64.8%', right: 0,
            background: 'rgba(239, 68, 68, 0.25)',
            border: '2px solid rgba(239, 68, 68, 0.4)',
            pointerEvents: 'none',
            borderRadius: 4,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }} />
        )}

        {/* Left Side Player Elements */}
        {isDoubles ? (
          <>
            {/* Top Left Quadrant (Doubles Left Court) */}
            <div style={{
              position: 'absolute', top: '5%', bottom: '50%', left: '5.7%', right: '55%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
              pointerEvents: 'none', zIndex: 15,
            }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#ffffff', textShadow: '0 2.5px 8px rgba(0,0,0,0.95)', textAlign: 'center', lineHeight: 1.2 }}>
                {courtSides.left === 'player1' ? t1Positions.left : t2Positions.left}
              </span>
              {servingTeam === courtSides.left && !isServerScoreEven && (
                <span style={{ fontSize: 8, background: '#ef4444', color: '#fff', padding: '1.5px 5px', borderRadius: 4, marginTop: 4, fontWeight: 700, letterSpacing: 0.5, boxShadow: '0 2px 6px rgba(0,0,0,0.45)' }}>SERVING</span>
              )}
            </div>
            {/* Bottom Left Quadrant (Doubles Right Court) */}
            <div style={{
              position: 'absolute', top: '50%', bottom: '5%', left: '5.7%', right: '55%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
              pointerEvents: 'none', zIndex: 15,
            }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#ffffff', textShadow: '0 2.5px 8px rgba(0,0,0,0.95)', textAlign: 'center', lineHeight: 1.2 }}>
                {courtSides.left === 'player1' ? t1Positions.right : t2Positions.right}
              </span>
              {servingTeam === courtSides.left && isServerScoreEven && (
                <span style={{ fontSize: 8, background: '#ef4444', color: '#fff', padding: '1.5px 5px', borderRadius: 4, marginTop: 4, fontWeight: 700, letterSpacing: 0.5, boxShadow: '0 2px 6px rgba(0,0,0,0.45)' }}>SERVING</span>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Singles Left Player: Top (Odd) or Bottom (Even) -- BWF Diagonal! */}
            <div style={{
              position: 'absolute',
              top: !isServerScoreEven ? '7.5%' : '50%',
              bottom: !isServerScoreEven ? '50%' : '7.5%',
              left: '5.7%', right: '55%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
              pointerEvents: 'none', zIndex: 15,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#ffffff', textShadow: '0 2.5px 8px rgba(0,0,0,0.95)', textAlign: 'center', lineHeight: 1.2 }}>
                {courtSides.left === 'player1' ? match.player1_name : match.player2_name}
              </span>
              {servingTeam === courtSides.left && (
                <span style={{ fontSize: 8, background: '#ef4444', color: '#fff', padding: '1.5px 5px', borderRadius: 4, marginTop: 4, fontWeight: 700, letterSpacing: 0.5, boxShadow: '0 2px 6px rgba(0,0,0,0.45)' }}>SERVING</span>
              )}
            </div>
          </>
        )}

        {/* Right Side Player Elements */}
        {isDoubles ? (
          <>
            {/* Top Right Quadrant (Doubles Right Court) */}
            <div style={{
              position: 'absolute', top: '5%', bottom: '50%', left: '55%', right: '5.7%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
              pointerEvents: 'none', zIndex: 15,
            }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#ffffff', textShadow: '0 2.5px 8px rgba(0,0,0,0.95)', textAlign: 'center', lineHeight: 1.2 }}>
                {courtSides.right === 'player1' ? t1Positions.right : t2Positions.right}
              </span>
              {servingTeam === courtSides.right && isServerScoreEven && (
                <span style={{ fontSize: 8, background: '#ef4444', color: '#fff', padding: '1.5px 5px', borderRadius: 4, marginTop: 4, fontWeight: 700, letterSpacing: 0.5, boxShadow: '0 2px 6px rgba(0,0,0,0.45)' }}>SERVING</span>
              )}
            </div>
            {/* Bottom Right Quadrant (Doubles Left Court) */}
            <div style={{
              position: 'absolute', top: '50%', bottom: '5%', left: '55%', right: '5.7%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
              pointerEvents: 'none', zIndex: 15,
            }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#ffffff', textShadow: '0 2.5px 8px rgba(0,0,0,0.95)', textAlign: 'center', lineHeight: 1.2 }}>
                {courtSides.right === 'player1' ? t1Positions.left : t2Positions.left}
              </span>
              {servingTeam === courtSides.right && !isServerScoreEven && (
                <span style={{ fontSize: 8, background: '#ef4444', color: '#fff', padding: '1.5px 5px', borderRadius: 4, marginTop: 4, fontWeight: 700, letterSpacing: 0.5, boxShadow: '0 2px 6px rgba(0,0,0,0.45)' }}>SERVING</span>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Singles Right Player: Top (Even) or Bottom (Odd) -- BWF Diagonal! */}
            <div style={{
              position: 'absolute',
              top: isServerScoreEven ? '7.5%' : '50%',
              bottom: isServerScoreEven ? '50%' : '7.5%',
              left: '55%', right: '5.7%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
              pointerEvents: 'none', zIndex: 15,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#ffffff', textShadow: '0 2.5px 8px rgba(0,0,0,0.95)', textAlign: 'center', lineHeight: 1.2 }}>
                {courtSides.right === 'player1' ? match.player1_name : match.player2_name}
              </span>
              {servingTeam === courtSides.right && (
                <span style={{ fontSize: 8, background: '#ef4444', color: '#fff', padding: '1.5px 5px', borderRadius: 4, marginTop: 4, fontWeight: 700, letterSpacing: 0.5, boxShadow: '0 2px 6px rgba(0,0,0,0.45)' }}>SERVING</span>
              )}
            </div>
          </>
        )}

        {/* LEFT TOUCH ZONE BUTTON */}
        <button
          onClick={() => handleScore(courtSides.left)}
          disabled={isPaused || state.isMatchComplete}
          style={{
            position: 'absolute', top: 0, bottom: 0, left: 0, width: '50%',
            background: 'transparent', border: 'none', cursor: 'pointer',
            touchAction: 'manipulation', zIndex: 10,
          }}
          onPointerDown={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
          onPointerUp={e => e.currentTarget.style.background = 'transparent'}
          onPointerLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          {/* +1 visual indicator */}
          <div style={{
            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
            fontSize: 16, fontWeight: 900, color: '#fff',
            background: 'rgba(34, 197, 94, 0.85)', padding: '6px 14px', borderRadius: 20,
            pointerEvents: 'none', letterSpacing: 1,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}>+1</div>
        </button>

        {/* RIGHT TOUCH ZONE BUTTON */}
        <button
          onClick={() => handleScore(courtSides.right)}
          disabled={isPaused || state.isMatchComplete}
          style={{
            position: 'absolute', top: 0, bottom: 0, right: 0, width: '50%',
            background: 'transparent', border: 'none', cursor: 'pointer',
            touchAction: 'manipulation', zIndex: 10,
          }}
          onPointerDown={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
          onPointerUp={e => e.currentTarget.style.background = 'transparent'}
          onPointerLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          {/* +1 visual indicator */}
          <div style={{
            position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
            fontSize: 16, fontWeight: 900, color: '#fff',
            background: 'rgba(34, 197, 94, 0.85)', padding: '6px 14px', borderRadius: 20,
            pointerEvents: 'none', letterSpacing: 1,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}>+1</div>
        </button>
      </div>

      {/* ═══════════ SCORE & SERVICE STATUS BAR ═══════════ */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'linear-gradient(135deg, #10121a 0%, #08090d 100%)', 
        borderRadius: 'var(--radius-md)', 
        padding: '12px 18px',
        marginBottom: 10, 
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
      }}>
        <div style={{ fontSize: 13, color: '#f1f5f9', fontWeight: 700, minWidth: 0, flex: 1, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
          {lastScored === servingTeam
            ? `${servingTeam === 'player1' ? match.player1_name : match.player2_name} serving`
            : lastScored !== null
              ? 'Service over'
              : `${servingTeam === 'player1' ? match.player1_name : match.player2_name} to serve`
          }
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: 32, letterSpacing: 4, flexShrink: 0 }}>
          <span style={{ 
            color: lastScored === courtSides.left ? '#22d3ee' : '#ffffff',
            textShadow: lastScored === courtSides.left ? '0 0 12px rgba(34,211,238,0.5)' : 'none'
          }}>{leftScore}</span>
          <span style={{ color: '#555555', margin: '0 8px' }}>,</span>
          <span style={{ 
            color: lastScored === courtSides.right ? '#22d3ee' : '#ffffff',
            textShadow: lastScored === courtSides.right ? '0 0 12px rgba(34,211,238,0.5)' : 'none'
          }}>{rightScore}</span>
        </div>
        <button
          className="btn btn-ghost"
          onClick={handleUndo}
          disabled={state.isMatchComplete}
          style={{ 
            padding: '6px 12px', 
            fontSize: 13, 
            fontWeight: 700, 
            flexShrink: 0, 
            marginLeft: 8,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 'var(--radius-sm)',
            color: '#ffffff'
          }}
        >
          Undo ↩
        </button>
      </div>
 
      {/* ═══════════ CONTROLS ═══════════ */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <button
          onClick={() => {
            const nextPaused = !isPaused;
            setIsPaused(nextPaused);
            const cs = state.sets[state.currentSet];
            const scoreInfo = cs ? `Score: ${cs.player1_score}-${cs.player2_score}` : '';
            logAction(
              nextPaused ? 'Match Paused' : 'Match Resumed',
              'match',
              `Match: ${match.player1_name} vs ${match.player2_name} | ${scoreInfo} | ${nextPaused ? 'Paused' : 'Resumed'} by umpire`,
              user ? { id: user.id, name: user.name } : null
            ).catch(() => {});
          }}
          disabled={state.isMatchComplete}
          style={{ 
            flex: 1.5,
            padding: '10px 14px',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            borderRadius: 'var(--radius-md)',
            border: isPaused ? 'none' : '1px solid rgba(255,255,255,0.08)',
            background: isPaused ? 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)' : 'rgba(255,255,255,0.05)',
            color: isPaused ? '#000000' : '#ffffff',
            boxShadow: isPaused ? '0 0 15px rgba(234,179,8,0.3)' : 'none',
          }}
        >
          {isPaused ? '▶ Resume' : '⏸ Pause'}
        </button>
 
        {isDoubles && (
          <>
            <button className="btn btn-secondary" onClick={handleSwitchSides} style={{ flex: 1, padding: '10px 8px', fontSize: 11, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}>🔄 Ends</button>
            <button className="btn btn-secondary" onClick={() => handleSwapPartners(courtSides.left)} style={{ flex: 1, padding: '10px 8px', fontSize: 11, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}>👥 L</button>
            <button className="btn btn-secondary" onClick={() => handleSwapPartners(courtSides.right)} style={{ flex: 1, padding: '10px 8px', fontSize: 11, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}>👥 R</button>
          </>
        )}
        {!isDoubles && (
          <button className="btn btn-secondary" onClick={handleSwitchSides} style={{ flex: 1, padding: '10px 8px', fontSize: 11, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}>🔄 Ends</button>
        )}
 
        <button className="btn btn-danger" onClick={handleReset} style={{ flex: 1, padding: '10px 8px', fontSize: 11, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444' }}>
          Reset
        </button>
      </div>

      {/* ═══════════ MATCH COMPLETE ═══════════ */}
      {state.isMatchComplete && (
        <div className="glass-card animate-slide-up" style={{
          padding: 28, textAlign: 'center',
          border: '1px solid rgba(34, 197, 94, 0.3)', background: 'rgba(34, 197, 94, 0.05)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🏆</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Match Complete!</h2>
          <p style={{ fontSize: 18, color: 'var(--score-win)', fontWeight: 700 }}>
            {state.matchWinnerId === match.player1_id ? match.player1_name : match.player2_name} wins!
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>
            Sets: {state.player1SetsWon} - {state.player2SetsWon} · Duration: {formatTime(playTime)}
          </p>

          {/* Score summary per set */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
            {state.sets.filter(s => s.is_complete).map((set, i) => (
              <div key={i} style={{
                padding: '8px 14px', borderRadius: 'var(--radius-md)',
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                textAlign: 'center', minWidth: 80,
              }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>Game {set.set_number}</div>
                <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  <span style={{ color: set.winner_id === match.player1_id ? 'var(--score-win)' : 'var(--text-muted)' }}>{set.player1_score}</span>
                  <span style={{ color: 'var(--text-muted)', margin: '0 3px' }}>-</span>
                  <span style={{ color: set.winner_id === match.player2_id ? 'var(--score-win)' : 'var(--text-muted)' }}>{set.player2_score}</span>
                </div>
              </div>
            ))}
          </div>

          {/* SVG progression Line Graph */}
          <ScoreProgressionGraph history={pointsHistory} />

          {/* Score Sheet Table */}
          <div style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 16, textAlign: 'left' }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>📋 Score Sheet</h4>
            <div style={{ overflowX: 'auto', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)', padding: 10 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontWeight: 600 }}>
                    <th style={{ padding: '5px 10px', textAlign: 'left' }}>Game</th>
                    <th style={{ padding: '5px 10px', textAlign: 'center' }}>{match.player1_name}</th>
                    <th style={{ padding: '5px 10px', textAlign: 'center' }}>{match.player2_name}</th>
                    <th style={{ padding: '5px 10px', textAlign: 'left' }}>Winner</th>
                  </tr>
                </thead>
                <tbody>
                  {state.sets.map((set, sIdx) => (
                    <tr key={sIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '6px 10px', fontWeight: 600 }}>Game {set.set_number}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'center', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{set.player1_score}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'center', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{set.player2_score}</td>
                      <td style={{ padding: '6px 10px', color: 'var(--score-win)', fontWeight: 600, fontSize: 12 }}>
                        {set.winner_id === match.player1_id ? match.player1_name : set.winner_id === match.player2_id ? match.player2_name : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 14, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>🖨️ Print</button>
              <button className="btn btn-primary btn-sm" onClick={() => alert("Score sheet shared successfully! 📨")}>📤 Share</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ SETTINGS MODAL ═══════════ */}
      {settingsOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 3000, padding: 20
        }}>
          <div className="glass-card animate-slide-up" style={{ width: '100%', maxWidth: 420, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>⚙️ Settings</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setSettingsOpen(false)} style={{ width: 28, height: 28 }}>❌</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
              <div className="input-group">
                <label className="input-label">Game Target Points</label>
                <select className="input" value={targetPoints} onChange={e => {
                  const pts = parseInt(e.target.value);
                  setTargetPoints(pts);
                  setMaxCapPoints(pts === 21 ? 30 : pts === 15 ? 21 : 15);
                }}>
                  <option value="21">21 Points (Standard BWF)</option>
                  <option value="15">15 Points (Operational)</option>
                  <option value="11">11 Points (Short)</option>
                </select>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  Changes target for the current active game
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Play sound on score</span>
                <input type="checkbox" checked={soundEnabled} onChange={e => setSoundEnabled(e.target.checked)} style={{ width: 18, height: 18, cursor: 'pointer' }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Vibrate on score</span>
                <input type="checkbox" checked={vibrateEnabled} onChange={e => setVibrateEnabled(e.target.checked)} style={{ width: 18, height: 18, cursor: 'pointer' }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Keep screen ON</span>
                <input type="checkbox" defaultChecked style={{ width: 18, height: 18, cursor: 'pointer' }} onChange={(e) => {
                  if (e.target.checked && 'wakeLock' in navigator) {
                    (navigator as any).wakeLock.request('screen').catch(() => {});
                  }
                }} />
              </div>
            </div>

            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setSettingsOpen(false)}>
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreProgressionGraph({ history }: { history: { p1Score: number; p2Score: number; scorer: 'player1' | 'player2' }[] }) {
  if (history.length === 0) return null;
  
  const width = 500;
  const height = 220;
  const padding = 35;
  
  const maxScore = Math.max(
    ...history.map(h => Math.max(h.p1Score, h.p2Score)),
    11
  );
  
  const pointsCount = history.length;
  
  const getX = (idx: number) => padding + (idx / pointsCount) * (width - 2 * padding);
  const getY = (score: number) => height - padding - (score / maxScore) * (height - 2 * padding);
  
  let p1Path = `M ${getX(0)} ${getY(0)}`;
  let p2Path = `M ${getX(0)} ${getY(0)}`;
  
  history.forEach((h, idx) => {
    p1Path += ` L ${getX(idx + 1)} ${getY(h.p1Score)}`;
    p2Path += ` L ${getX(idx + 1)} ${getY(h.p2Score)}`;
  });
  
  return (
    <div style={{ marginTop: 24, textAlign: 'left' }}>
      <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>
        📈 Score Progression Timeline Graph
      </h4>
      <div style={{
        background: 'rgba(0,0,0,0.2)', padding: 12,
        borderRadius: 8, border: '1px solid var(--border)',
        display: 'flex', justifyContent: 'center'
      }}>
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const val = Math.round(ratio * maxScore);
            const y = getY(val);
            return (
              <g key={idx}>
                <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3 3" />
                <text x={padding - 8} y={y + 4} fill="var(--text-muted)" fontSize="9" textAnchor="end">{val}</text>
              </g>
            );
          })}
          
          {/* X axis lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const pointIdx = Math.round(ratio * pointsCount);
            const x = getX(pointIdx);
            return (
              <g key={idx}>
                <line x1={x} y1={padding} x2={x} y2={height - padding} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3 3" />
                <text x={x} y={height - padding + 15} fill="var(--text-muted)" fontSize="9" textAnchor="middle">{pointIdx}</text>
              </g>
            );
          })}
          
          {/* Main line paths */}
          <path d={p1Path} fill="none" stroke="#00d2ff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d={p2Path} fill="none" stroke="#ff3860" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          
          {/* Legend */}
          <g transform={`translate(${width / 2 - 120}, ${padding - 18})`}>
            <circle cx="10" cy="10" r="5" fill="#00d2ff" />
            <text x="22" y="14" fill="var(--text-secondary)" fontSize="10" fontWeight="600">Competitor 1</text>
            
            <circle cx="120" cy="10" r="5" fill="#ff3860" />
            <text x="132" y="14" fill="var(--text-secondary)" fontSize="10" fontWeight="600">Competitor 2</text>
          </g>
        </svg>
      </div>
    </div>
  );
}
