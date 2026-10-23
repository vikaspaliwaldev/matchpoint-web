'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Match, TournamentEvent, Tournament, MatchSet } from '@/types';
import { updateMatchScore, logAction } from '@/lib/supabase-service';
import { useAuth } from '@/lib/auth-context';
import { isTennisSetComplete, formatTennisGameScore, TennisMetadata, TennisPointType, TennisPointStats } from '@/lib/sports-rules';
import { saveOfflineScorePayload, flushAllOfflineScores } from '@/lib/offline-scoring';
import { IconPlay, IconPause, IconUndo, IconCheck, IconArrowLeft, IconTrophy } from '@/components/icons';

interface TennisScoringProps {
  match: Match;
  event?: TournamentEvent;
  tournament?: Tournament;
  onScoreUpdated: () => void;
}

interface TennisHistoryState {
  sets: MatchSet[];
  currentSetIdx: number;
  p1GamePoints: number;
  p2GamePoints: number;
  inTiebreak: boolean;
  servingTeam: 'player1' | 'player2';
  courtSides: { left: 'player1' | 'player2'; right: 'player1' | 'player2' };
  statsP1: TennisPointStats;
  statsP2: TennisPointStats;
  timeoutsP1: number;
  timeoutsP2: number;
}

export default function TennisScoring({
  match,
  event,
  tournament,
  onScoreUpdated,
}: TennisScoringProps) {
  const { user } = useAuth();
  
  const [isScoringFullscreen, setIsScoringFullscreen] = useState(false);
  const scorecardRef = useRef<HTMLDivElement | null>(null);

  // Offline status & Auto-sync state
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'offline'>('idle');

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      setSyncStatus('syncing');
      try {
        await flushAllOfflineScores();
        setSyncStatus('synced');
        setTimeout(() => setSyncStatus('idle'), 3000);
      } catch (e) {
        console.error('Error flushing offline scores:', e);
        setSyncStatus('idle');
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    const container = scorecardRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => {
        setIsScoringFullscreen(true);
        if (screen.orientation && (screen.orientation as any).lock) {
          (screen.orientation as any).lock('landscape').catch((err: any) => {
            console.log('Orientation lock failed:', err);
          });
        }
      }).catch(err => {
        console.error('Fullscreen request failed:', err);
        setIsScoringFullscreen(true);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsScoringFullscreen(false);
      }).catch(err => {
        console.error('Exit fullscreen failed:', err);
        setIsScoringFullscreen(false);
      });
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsScoringFullscreen(isFull);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Tennis config (best of 3 sets, 2 sets to win)
  const setsToWin = 2;

  // Metadata retrieval
  const existingMeta = (match.sport_metadata as TennisMetadata) || {};

  // Game states
  const [matchStarted, setMatchStarted] = useState(match.status === 'running');
  const [isPaused, setIsPaused] = useState(false);
  const [matchElapsed, setMatchElapsed] = useState(0);
  const [totalPausedTime, setTotalPausedTime] = useState(existingMeta.total_paused_seconds || 0);
  const [pauseElapsed, setPauseElapsed] = useState(0);
  const [declareWinnerOpen, setDeclareWinnerOpen] = useState(false);
  const [earlyConcludeReason, setEarlyConcludeReason] = useState<string>('Retirement / Medical Injury');
  const [customEarlyConcludeReason, setCustomEarlyConcludeReason] = useState<string>('');

  // Timeouts Configuration & Usage
  const [maxTimeouts, setMaxTimeouts] = useState<number>(existingMeta.max_timeouts ?? 2);
  const [timeoutScope, setTimeoutScope] = useState<'set' | 'match'>(existingMeta.timeout_scope ?? 'set');
  const [timeoutsP1, setTimeoutsP1] = useState<number>(existingMeta.timeouts_p1 ?? 0);
  const [timeoutsP2, setTimeoutsP2] = useState<number>(existingMeta.timeouts_p2 ?? 0);

  // Statistics
  const [statsP1, setStatsP1] = useState<TennisPointStats>(
    existingMeta.stats_p1 || { aces: 0, winners: 0, double_faults: 0, opponent_errors: 0 }
  );
  const [statsP2, setStatsP2] = useState<TennisPointStats>(
    existingMeta.stats_p2 || { aces: 0, winners: 0, double_faults: 0, opponent_errors: 0 }
  );

  // Modals
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showAttributionSheet, setShowAttributionSheet] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  
  // Players layout position
  const [courtSides, setCourtSides] = useState<{ left: 'player1' | 'player2'; right: 'player1' | 'player2' }>({
    left: 'player1',
    right: 'player2',
  });

  const getIndividualPlayers = (name: string): string[] => {
    if (!name) return ['TBD'];
    const parts = name.split(/\s*(?:\/|\+|,|and)\s*/i);
    if (parts.length > 1) return parts.map(p => p.trim());
    return [name.trim()];
  };

  const p1Names = getIndividualPlayers(match.player1_name);
  const p2Names = getIndividualPlayers(match.player2_name);
  const isDoubles = p1Names.length > 1 || p2Names.length > 1 || (event?.category || '').endsWith('D');

  const [t1Positions, setT1Positions] = useState(() => ({
    p1: p1Names[0] || 'Player 1',
    p2: isDoubles ? (p1Names[1] || 'Partner') : ''
  }));
  
  const [t2Positions, setT2Positions] = useState(() => ({
    p1: p2Names[0] || 'Player 2',
    p2: isDoubles ? (p2Names[1] || 'Partner') : ''
  }));

  const handleSwapPartners = (team: 'player1' | 'player2') => {
    if (team === 'player1') {
      setT1Positions(prev => ({ p1: prev.p2 || prev.p1, p2: prev.p1 }));
    } else {
      setT2Positions(prev => ({ p1: prev.p2 || prev.p1, p2: prev.p1 }));
    }
    playBeep(440, 0.05);
  };

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pauseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sets state (stores games won in each set)
  const [sets, setSets] = useState<MatchSet[]>(() => {
    if (match.sets && match.sets.length > 0) return match.sets.map(s => ({ ...s }));
    return [{ set_number: 1, player1_score: 0, player2_score: 0, is_complete: false }];
  });
  const [currentSetIdx, setCurrentSetIdx] = useState(() => {
    if (match.sets && match.sets.length > 0) {
      const activeIdx = match.sets.findIndex(s => !s.is_complete);
      return activeIdx === -1 ? match.sets.length - 1 : activeIdx;
    }
    return 0;
  });

  // Current Game/Tiebreaker points
  const [p1GamePoints, setP1GamePoints] = useState(existingMeta.player1_game_points ?? 0);
  const [p2GamePoints, setP2GamePoints] = useState(existingMeta.player2_game_points ?? 0);
  const [inTiebreak, setInTiebreak] = useState(existingMeta.in_tiebreak ?? false);

  // Initial and current server
  const [initialServer, setInitialServer] = useState<'player1' | 'player2'>(existingMeta.first_server || 'player1');
  const [servingTeam, setServingTeam] = useState<'player1' | 'player2'>(existingMeta.serving_team || 'player1');

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrateEnabled, setVibrateEnabled] = useState(true);
  const [selectedCourt, setSelectedCourt] = useState(match.court || 'Court 1');

  // Score History (for Undo)
  const [history, setHistory] = useState<TennisHistoryState[]>([]);

  // Derived sets won
  const p1SetsWon = sets.filter(s => s.is_complete && s.winner_id === match.player1_id).length;
  const p2SetsWon = sets.filter(s => s.is_complete && s.winner_id === match.player2_id).length;
  const isMatchComplete = p1SetsWon >= setsToWin || p2SetsWon >= setsToWin;
  const matchWinnerId = p1SetsWon >= setsToWin ? match.player1_id : (p2SetsWon >= setsToWin ? match.player2_id : null);

  const currentSet = sets[currentSetIdx];
  const p1Games = currentSet?.player1_score ?? 0;
  const p2Games = currentSet?.player2_score ?? 0;

  // Play audio feed back
  const playBeep = (freq = 800, duration = 0.08) => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  };

  // Trigger vibration
  const triggerVibrate = (ms = 40) => {
    if (vibrateEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(ms);
    }
  };

  // Timer Effects
  useEffect(() => {
    if (matchStarted && !isPaused && !isMatchComplete) {
      timerRef.current = setInterval(() => {
        setMatchElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [matchStarted, isPaused, isMatchComplete]);

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

  // Sync state to DB & Local offline cache
  const saveStateToDB = async (
    updatedSets: MatchSet[], 
    overrideStatus?: Match['status'], 
    overrideWinnerId?: string | null,
    extraMeta: Partial<TennisMetadata> = {}
  ) => {
    const finalStatus = overrideStatus || (overrideWinnerId || p1SetsWon >= setsToWin || p2SetsWon >= setsToWin ? 'completed' : 'running');
    const finalWinner = overrideWinnerId || (p1SetsWon >= setsToWin ? match.player1_id : (p2SetsWon >= setsToWin ? match.player2_id : null));

    const meta: TennisMetadata = {
      player1_game_points: p1GamePoints,
      player2_game_points: p2GamePoints,
      in_tiebreak: inTiebreak,
      serving_team: servingTeam,
      first_server: initialServer,
      timeouts_p1: timeoutsP1,
      timeouts_p2: timeoutsP2,
      max_timeouts: maxTimeouts,
      timeout_scope: timeoutScope,
      stats_p1: statsP1,
      stats_p2: statsP2,
      total_paused_seconds: totalPausedTime,
      ...extraMeta
    };

    saveOfflineScorePayload({
      matchId: match.id,
      sets: updatedSets,
      status: finalStatus,
      winnerId: finalWinner,
      actualStartTime: overrideStatus === 'running' ? new Date().toISOString() : match.actual_start_time,
      actualEndTime: finalStatus === 'completed' ? new Date().toISOString() : null,
      court: selectedCourt,
      sportType: 'tennis',
      sportMetadata: meta,
      updatedAt: new Date().toISOString(),
    });

    try {
      await updateMatchScore(
        match.id,
        updatedSets,
        finalStatus,
        finalWinner,
        overrideStatus === 'running' ? new Date().toISOString() : match.actual_start_time,
        finalStatus === 'completed' ? new Date().toISOString() : null,
        selectedCourt,
        undefined,
        null,
        'tennis',
        meta
      );
      onScoreUpdated();
    } catch (err) {
      console.warn('Network issue saving Tennis score, cached offline:', err);
    }
  };

  const handleStartMatch = async () => {
    setMatchStarted(true);
    setServingTeam(initialServer);
    await saveStateToDB(sets, 'running', null, { serving_team: initialServer });
    playBeep(660, 0.15);
    await logAction('Match Started', 'match', `Tennis match started: ${match.player1_name} vs ${match.player2_name}`, user ? { id: user.id, name: user.name } : null);
  };

  const handleTimeout = async (team: 'player1' | 'player2') => {
    if (isPaused || isMatchComplete || !matchStarted) return;
    if (team === 'player1' && timeoutsP1 >= maxTimeouts) return;
    if (team === 'player2' && timeoutsP2 >= maxTimeouts) return;

    const nextP1Timeouts = team === 'player1' ? timeoutsP1 + 1 : timeoutsP1;
    const nextP2Timeouts = team === 'player2' ? timeoutsP2 + 1 : timeoutsP2;

    setTimeoutsP1(nextP1Timeouts);
    setTimeoutsP2(nextP2Timeouts);
    setIsPaused(true);
    playBeep(440, 0.3);

    await saveStateToDB(sets, undefined, undefined, {
      timeouts_p1: nextP1Timeouts,
      timeouts_p2: nextP2Timeouts,
    });
  };

  // Switch server helper
  const getNextRegularServer = (current: 'player1' | 'player2') => {
    return current === 'player1' ? 'player2' : 'player1';
  };

  // Add Point with Classification
  const handleAddPoint = (player: 'player1' | 'player2', pointType: TennisPointType = 'quick') => {
    if (!matchStarted || isMatchComplete || isPaused) return;

    // Save history for Undo
    setHistory(prev => [
      ...prev,
      {
        sets: sets.map(s => ({ ...s })),
        currentSetIdx,
        p1GamePoints,
        p2GamePoints,
        inTiebreak,
        servingTeam,
        courtSides: { ...courtSides },
        statsP1: { ...statsP1 },
        statsP2: { ...statsP2 },
        timeoutsP1,
        timeoutsP2,
      }
    ]);

    playBeep(player === 'player1' ? 880 : 980);
    triggerVibrate();

    // Update stats
    let nextStatsP1 = { ...statsP1 };
    let nextStatsP2 = { ...statsP2 };

    if (player === 'player1') {
      if (pointType === 'ace') nextStatsP1.aces++;
      else if (pointType === 'forehand_winner' || pointType === 'backhand_winner' || pointType === 'volley_winner') nextStatsP1.winners++;
      else if (pointType === 'opp_double_fault') nextStatsP2.double_faults++;
      else if (pointType === 'opp_unforced_error') nextStatsP1.opponent_errors++;
    } else {
      if (pointType === 'ace') nextStatsP2.aces++;
      else if (pointType === 'forehand_winner' || pointType === 'backhand_winner' || pointType === 'volley_winner') nextStatsP2.winners++;
      else if (pointType === 'opp_double_fault') nextStatsP1.double_faults++;
      else if (pointType === 'opp_unforced_error') nextStatsP2.opponent_errors++;
    }
    setStatsP1(nextStatsP1);
    setStatsP2(nextStatsP2);

    let nextP1Points = p1GamePoints;
    let nextP2Points = p2GamePoints;
    let nextInTiebreak = inTiebreak;
    let nextServingTeam = servingTeam;
    let nextSets = [...sets];
    let nextSetIdx = currentSetIdx;
    let nextTimeoutsP1 = timeoutsP1;
    let nextTimeoutsP2 = timeoutsP2;

    if (inTiebreak) {
      // Tiebreak scoring: count 1, 2, 3...
      if (player === 'player1') {
        nextP1Points++;
      } else {
        nextP2Points++;
      }

      const totalTBPoints = nextP1Points + nextP2Points;
      
      // Server changes after first point, then after every 2 points
      if (totalTBPoints % 2 === 1) {
        nextServingTeam = getNextRegularServer(servingTeam);
      } else if (totalTBPoints > 0 && totalTBPoints % 2 === 0) {
        nextServingTeam = getNextRegularServer(servingTeam);
      }

      // Check if Tiebreak complete (first to 7 points with a 2-point lead)
      if (nextP1Points >= 7 && nextP1Points - nextP2Points >= 2) {
        nextSets[currentSetIdx] = {
          ...nextSets[currentSetIdx],
          player1_score: p1Games + 1,
          player2_score: p2Games,
          is_complete: true,
          winner_id: match.player1_id
        };
        nextP1Points = 0;
        nextP2Points = 0;
        nextInTiebreak = false;
        nextServingTeam = getNextRegularServer(initialServer);
      } else if (nextP2Points >= 7 && nextP2Points - nextP1Points >= 2) {
        nextSets[currentSetIdx] = {
          ...nextSets[currentSetIdx],
          player1_score: p1Games,
          player2_score: p2Games + 1,
          is_complete: true,
          winner_id: match.player2_id
        };
        nextP1Points = 0;
        nextP2Points = 0;
        nextInTiebreak = false;
        nextServingTeam = getNextRegularServer(initialServer);
      }

      // Swap sides in tiebreaker every 6 points
      if (totalTBPoints % 6 === 0) {
        setCourtSides(prev => ({ left: prev.right, right: prev.left }));
      }

    } else {
      // Standard game scoring
      if (player === 'player1') {
        nextP1Points++;
      } else {
        nextP2Points++;
      }

      // Check if Player 1 won the game
      if (nextP1Points >= 4 && nextP1Points - nextP2Points >= 2) {
        const updatedGamesP1 = p1Games + 1;
        nextSets[currentSetIdx] = {
          ...nextSets[currentSetIdx],
          player1_score: updatedGamesP1,
        };
        nextP1Points = 0;
        nextP2Points = 0;

        nextServingTeam = getNextRegularServer(servingTeam);

        if (isTennisSetComplete(updatedGamesP1, p2Games)) {
          nextSets[currentSetIdx].is_complete = true;
          nextSets[currentSetIdx].winner_id = updatedGamesP1 > p2Games ? match.player1_id : match.player2_id;
        } else if (updatedGamesP1 === 6 && p2Games === 6) {
          nextInTiebreak = true;
        }

        const totalGames = updatedGamesP1 + p2Games;
        if (totalGames % 2 === 1) {
          setCourtSides(prev => ({ left: prev.right, right: prev.left }));
        }

      } else if (nextP2Points >= 4 && nextP2Points - nextP1Points >= 2) {
        const updatedGamesP2 = p2Games + 1;
        nextSets[currentSetIdx] = {
          ...nextSets[currentSetIdx],
          player2_score: updatedGamesP2,
        };
        nextP1Points = 0;
        nextP2Points = 0;

        nextServingTeam = getNextRegularServer(servingTeam);

        if (isTennisSetComplete(p1Games, updatedGamesP2)) {
          nextSets[currentSetIdx].is_complete = true;
          nextSets[currentSetIdx].winner_id = p1Games > updatedGamesP2 ? match.player1_id : match.player2_id;
        } else if (p1Games === 6 && updatedGamesP2 === 6) {
          nextInTiebreak = true;
        }

        const totalGames = p1Games + updatedGamesP2;
        if (totalGames % 2 === 1) {
          setCourtSides(prev => ({ left: prev.right, right: prev.left }));
        }
      }
    }

    const activeSet = nextSets[currentSetIdx];
    if (activeSet.is_complete) {
      const p1Wins = nextSets.filter(s => s.is_complete && s.winner_id === match.player1_id).length;
      const p2Wins = nextSets.filter(s => s.is_complete && s.winner_id === match.player2_id).length;

      const matchOver = p1Wins >= setsToWin || p2Wins >= setsToWin;
      if (!matchOver) {
        nextSetIdx = currentSetIdx + 1;
        nextSets.push({
          set_number: nextSetIdx + 1,
          player1_score: 0,
          player2_score: 0,
          is_complete: false
        });
        if (timeoutScope === 'set') {
          nextTimeoutsP1 = 0;
          nextTimeoutsP2 = 0;
          setTimeoutsP1(0);
          setTimeoutsP2(0);
        }
        setTimeout(() => playBeep(520, 0.2), 300);
      } else {
        setTimeout(() => playBeep(1200, 0.4), 300);
      }
    }

    setP1GamePoints(nextP1Points);
    setP2GamePoints(nextP2Points);
    setInTiebreak(nextInTiebreak);
    setServingTeam(nextServingTeam);
    setSets(nextSets);
    setCurrentSetIdx(nextSetIdx);

    saveStateToDB(nextSets, undefined, undefined, {
      player1_game_points: nextP1Points,
      player2_game_points: nextP2Points,
      in_tiebreak: nextInTiebreak,
      serving_team: nextServingTeam
    });
  };

  const handleUndo = () => {
    if (history.length === 0 || isPaused) return;

    playBeep(400, 0.1);
    triggerVibrate(60);

    const prev = history[history.length - 1];
    setHistory(prevHistory => prevHistory.slice(0, -1));

    setP1GamePoints(prev.p1GamePoints);
    setP2GamePoints(prev.p2GamePoints);
    setInTiebreak(prev.inTiebreak);
    setServingTeam(prev.servingTeam);
    setSets(prev.sets);
    setCurrentSetIdx(prev.currentSetIdx);
    setCourtSides(prev.courtSides);
    setStatsP1(prev.statsP1);
    setStatsP2(prev.statsP2);
    setTimeoutsP1(prev.timeoutsP1);
    setTimeoutsP2(prev.timeoutsP2);

    saveStateToDB(prev.sets, undefined, undefined, {
      player1_game_points: prev.p1GamePoints,
      player2_game_points: prev.p2GamePoints,
      in_tiebreak: prev.inTiebreak,
      serving_team: prev.servingTeam,
      stats_p1: prev.statsP1,
      stats_p2: prev.statsP2,
      timeouts_p1: prev.timeoutsP1,
      timeouts_p2: prev.timeoutsP2,
    });
  };

  const handleSwitchSides = () => {
    setCourtSides(prev => ({ left: prev.right, right: prev.left }));
    playBeep();
  };

  const handleDeclareWinner = async (winnerId: string, reason?: string) => {
    setDeclareWinnerOpen(false);
    playBeep(1200, 0.4);
    await saveStateToDB(sets, 'completed', winnerId, reason ? { early_conclude_reason: reason } as any : {});
    const reasonText = reason ? ` | Reason: ${reason}` : '';
    await logAction(
      'Match Decided',
      'match',
      `Tennis winner declared early by umpire: ${winnerId === match.player1_id ? match.player1_name : match.player2_name}${reasonText}`,
      user ? { id: user.id, name: user.name } : null
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formattedGameScores = formatTennisGameScore(p1GamePoints, p2GamePoints, inTiebreak);
  const leftPlayerName = courtSides.left === 'player1' 
    ? (isDoubles ? `${t1Positions.p1} / ${t1Positions.p2}` : t1Positions.p1) 
    : (isDoubles ? `${t2Positions.p1} / ${t2Positions.p2}` : t2Positions.p1);
  const rightPlayerName = courtSides.right === 'player1' 
    ? (isDoubles ? `${t1Positions.p1} / ${t1Positions.p2}` : t1Positions.p1) 
    : (isDoubles ? `${t2Positions.p1} / ${t2Positions.p2}` : t2Positions.p1);
  const leftGames = courtSides.left === 'player1' ? p1Games : p2Games;
  const rightGames = courtSides.right === 'player1' ? p1Games : p2Games;
  const leftPoints = courtSides.left === 'player1' ? formattedGameScores.p1 : formattedGameScores.p2;
  const rightPoints = courtSides.right === 'player1' ? formattedGameScores.p1 : formattedGameScores.p2;

  return (
    <div 
      ref={scorecardRef}
      className={isScoringFullscreen ? 'fullscreen-scorecard' : ''}
      style={{
        maxWidth: isScoringFullscreen ? 'none' : 600,
        margin: isScoringFullscreen ? '0' : '0 auto',
        background: 'var(--bg-card)', 
        borderRadius: isScoringFullscreen ? '0' : 'var(--radius-lg)',
        border: isScoringFullscreen ? 'none' : '1px solid var(--border)',
        boxShadow: isScoringFullscreen ? 'none' : 'var(--glass-shadow)',
        color: 'var(--text-primary)',
        padding: isScoringFullscreen ? '16px' : '12px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: isScoringFullscreen ? '100dvh' : '80dvh',
        position: 'relative',
      }}
    >
      {/* Dynamic landscape overrides */}
      {isScoringFullscreen && (
        <div className="portrait-only" style={{
          textAlign: 'center',
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--text-secondary)',
          background: 'rgba(37, 99, 235, 0.1)',
          border: '1px solid rgba(37, 99, 235, 0.25)',
          padding: '8px 16px',
          borderRadius: 'var(--radius-md)',
          marginBottom: 16,
          boxShadow: 'var(--glass-shadow)',
        }}>
          🔄 Rotate phone to landscape (horizontal) for a wider court scoreboard!
        </div>
      )}

      {/* 1. HEADER WRAPPER (fullscreen-header) */}
      <div 
        className={isScoringFullscreen ? 'fullscreen-header' : ''}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          marginBottom: isScoringFullscreen ? 0 : 16
        }}
      >
        {/* Header Info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                🥎 Tennis · {selectedCourt} {matchStarted && `· ⏱ ${formatTime(matchElapsed - totalPausedTime)}`}
              </span>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                background: !isOnline ? '#ef4444' : syncStatus === 'syncing' ? '#f59e0b' : '#10b981',
                color: '#fff',
              }}>
                {!isOnline ? 'OFFLINE' : syncStatus === 'syncing' ? 'SYNCING...' : 'ONLINE'}
              </span>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>
              {tournament?.name || 'MatchPoint Tournament'}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button 
              onClick={() => setShowAttributionSheet(true)}
              style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#3b82f6', fontSize: 12, fontWeight: 700 }}
              title="Point Breakdown / Reason"
            >
              ⚡ Rally Type
            </button>
            <button 
              onClick={() => setShowStatsModal(true)}
              style={{ padding: '6px 10px', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border)', fontSize: 12, fontWeight: 700 }}
              title="Match Statistics"
            >
              📊 Stats
            </button>
            <button 
              onClick={() => setShowConfigModal(true)}
              style={{ padding: 8, borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border)', fontSize: 12 }}
              title="Configure Timeouts"
            >
              ⚙️
            </button>
            <button 
              onClick={() => setSoundEnabled(prev => !prev)}
              style={{ padding: 8, borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border)', fontSize: 14 }}
              title="Toggle Sound"
            >
              {soundEnabled ? '🔊' : '🔇'}
            </button>
            <button 
              onClick={() => setVibrateEnabled(prev => !prev)}
              style={{ padding: 8, borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border)', fontSize: 14 }}
              title="Toggle Vibration"
            >
              {vibrateEnabled ? '📳' : '📴'}
            </button>
            <button 
              onClick={toggleFullscreen}
              style={{ 
                padding: '8px 12px', borderRadius: 8, 
                background: isScoringFullscreen ? 'rgba(239, 68, 68, 0.2)' : 'var(--bg-secondary)', 
                border: '1px solid var(--border)', 
                fontSize: 12, 
                color: isScoringFullscreen ? '#f87171' : 'var(--text-primary)', 
                fontWeight: 600 
              }}
              title={isScoringFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isScoringFullscreen ? "📴 Exit" : "⛶ Fullscreen"}
            </button>
          </div>
        </div>

        {/* Set Tracker Indicator & Timeouts */}
        <div 
          className={isScoringFullscreen ? 'fullscreen-scorebar' : ''}
          style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          background: 'rgba(255,255,255,0.03)',
          padding: '8px 16px',
          borderRadius: 'var(--radius-md)',
        }}>
          <div style={{ textAlign: 'right', flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700 }}>{match.player1_name}</div>
            <div style={{ fontSize: 11, color: '#2563eb', fontWeight: 800 }}>Sets: {p1SetsWon} · TO: {timeoutsP1}/{maxTimeouts}</div>
          </div>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)' }}>vs</div>
          <div style={{ textAlign: 'left', flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700 }}>{match.player2_name}</div>
            <div style={{ fontSize: 11, color: '#10b981', fontWeight: 800 }}>Sets: {p2SetsWon} · TO: {timeoutsP2}/{maxTimeouts}</div>
          </div>
        </div>

        {/* Serve indicator banner */}
        {matchStarted && !isMatchComplete && (
          <div style={{
            textAlign: 'center',
            fontSize: 13,
            fontWeight: 700,
            padding: '8px 12px',
            borderRadius: 8,
            background: servingTeam === 'player1' ? 'rgba(37, 99, 235, 0.1)' : 'rgba(16,185,129,0.1)',
            border: `1px solid ${servingTeam === 'player1' ? '#2563eb' : '#10b981'}`,
            color: servingTeam === 'player1' ? '#93c5fd' : '#a7f3d0',
          }}>
            🎾 Server: <strong style={{ textDecoration: 'underline' }}>{servingTeam === 'player1' ? match.player1_name : match.player2_name}</strong> {inTiebreak && ' (Tiebreaker)'}
          </div>
        )}
      </div>

      {/* 2. BODY CONTENT */}
      {!matchStarted ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <div style={{ fontSize: 48 }}>🥎</div>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center', maxWidth: 280 }}>
            Tennis scoring rules: Best of 3 Sets. Advantage scoring (Deuce/Ad) and 7-Point Tiebreaker at 6-6.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 240 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Select Server to start</label>
            <select 
              value={initialServer}
              onChange={e => setInitialServer(e.target.value as any)}
              className="input"
              style={{ width: '100%', background: 'var(--bg-secondary)' }}
            >
              <option value="player1">Serve: {match.player1_name}</option>
              <option value="player2">Serve: {match.player2_name}</option>
            </select>
          </div>
          <button onClick={handleStartMatch} className="btn btn-primary" style={{ width: '100%', maxWidth: 240, height: 48, fontSize: 15, fontWeight: 700 }}>
            🚀 Start Match
          </button>
        </div>
      ) : isMatchComplete ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <div style={{ fontSize: 56 }}>🏆</div>
          <h2 style={{ fontSize: 22, fontWeight: 800 }}>Match Completed!</h2>
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>
            Winner: {matchWinnerId === match.player1_id ? match.player1_name : match.player2_name}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, color: 'var(--text-secondary)' }}>
            {sets.map((s, i) => (
              <div key={i}>Set {s.set_number}: {s.player1_score} - {s.player2_score} {s.winner_id === match.player1_id ? `(${match.player1_name.charAt(0)})` : `(${match.player2_name.charAt(0)})`}</div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Interactive Tennis Court Mat */}
          <div 
            className={isScoringFullscreen ? 'fullscreen-court-container' : ''} 
            style={isScoringFullscreen ? { flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 } : { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}
          >
            <div 
              className={isScoringFullscreen ? 'fullscreen-court' : ''}
              style={{
                position: 'relative',
                width: '100%',
                background: '#235D3A', // Green lawn tennis court
                border: '10px solid #235D3A',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.45)',
                overflow: 'hidden',
                minHeight: isScoringFullscreen ? undefined : 240,
                aspectRatio: '1.8 / 1',
                opacity: isMatchComplete ? 0.4 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              {/* White lines: court boundary */}
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, border: '2px solid #ffffff', pointerEvents: 'none' }} />
              
              {/* Double sidelines (tennis double lines) */}
              <div style={{ position: 'absolute', top: '10%', bottom: '10%', left: 0, right: 0, borderTop: '2px solid #ffffff', borderBottom: '2px solid #ffffff', pointerEvents: 'none' }} />

              {/* Service lines (horizontal lines at 25% and 75%) */}
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: '21%', width: '2px', background: '#ffffff', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', top: 0, bottom: 0, right: '21%', width: '2px', background: '#ffffff', pointerEvents: 'none' }} />
              
              {/* Center Service Line */}
              <div style={{ position: 'absolute', top: '50%', left: '21%', right: '21%', height: '2px', background: '#ffffff', pointerEvents: 'none' }} />

              {/* Net Divider */}
              <div style={{
                position: 'absolute', top: 0, bottom: 0, left: '50%',
                width: '6px',
                transform: 'translateX(-50%)',
                background: 'rgba(255, 255, 255, 0.4)',
                borderLeft: '2px solid #ffffff',
                borderRight: '2px solid #ffffff',
                zIndex: 15, pointerEvents: 'none'
              }} />

              {/* Left Side Player Info & Game Score */}
              {isDoubles ? (
                <>
                  {/* Left Side - Top Quadrant (Ad Court / Net Player) */}
                  <div style={{
                    position: 'absolute', top: '10%', bottom: '50%', left: '4%', right: '54%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                    pointerEvents: 'none', zIndex: 15,
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.9)', textAlign: 'center', textShadow: '0 2px 6px rgba(0,0,0,0.85)', lineHeight: 1.2 }}>
                      {courtSides.left === 'player1' ? t1Positions.p2 : t2Positions.p2}
                    </span>
                    <span style={{ fontSize: 8, background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '1px 4px', borderRadius: 3, marginTop: 2, fontWeight: 700 }}>NET / AD</span>
                  </div>
                  {/* Left Side - Bottom Quadrant (Deuce Court / Baseline Server) */}
                  <div style={{
                    position: 'absolute', top: '50%', bottom: '10%', left: '4%', right: '54%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                    pointerEvents: 'none', zIndex: 15,
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#ffffff', textAlign: 'center', textShadow: '0 2px 6px rgba(0,0,0,0.85)', lineHeight: 1.2 }}>
                      {courtSides.left === 'player1' ? t1Positions.p1 : t2Positions.p1}
                    </span>
                    {servingTeam === courtSides.left ? (
                      <span style={{ fontSize: 8, background: '#ef4444', color: '#fff', padding: '1px 5px', borderRadius: 4, marginTop: 2, fontWeight: 700, letterSpacing: 0.5 }}>SERVING</span>
                    ) : (
                      <span style={{ fontSize: 8, background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '1px 4px', borderRadius: 3, marginTop: 2, fontWeight: 700 }}>DEUCE</span>
                    )}
                  </div>
                  {/* Left Side - Center Score Overlay */}
                  <div style={{
                    position: 'absolute', top: '50%', left: '26%', transform: 'translate(-50%, -50%)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    pointerEvents: 'none', zIndex: 14, opacity: 0.9
                  }}>
                    <span style={{ fontSize: 'clamp(24px, 10vh, 52px)', fontWeight: 900, fontFamily: 'monospace', color: '#ffffff', textShadow: '0 4px 14px rgba(0,0,0,0.8)' }}>{leftPoints}</span>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#facc15', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Games: {leftGames}</div>
                  </div>
                </>
              ) : (
                <div style={{
                  position: 'absolute', top: '10%', bottom: '10%', left: '5%', right: '55%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                  pointerEvents: 'none', zIndex: 15,
                }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', textAlign: 'center' }}>{leftPlayerName}</span>
                  <span style={{ fontSize: 'clamp(24px, 10vh, 54px)', fontWeight: 900, fontFamily: 'monospace', color: '#ffffff', margin: '2px 0' }}>{leftPoints}</span>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#facc15' }}>Games: {leftGames}</div>
                  {servingTeam === courtSides.left && (
                    <span style={{ fontSize: 9, background: '#ef4444', color: '#fff', padding: '1px 5px', borderRadius: 4, fontWeight: 700, letterSpacing: 0.5, marginTop: 2 }}>SERVING</span>
                  )}
                </div>
              )}

              {/* Right Side Player Info & Game Score */}
              {isDoubles ? (
                <>
                  {/* Right Side - Top Quadrant (Deuce Receiver Court) */}
                  <div style={{
                    position: 'absolute', top: '10%', bottom: '50%', left: '54%', right: '4%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                    pointerEvents: 'none', zIndex: 15,
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#ffffff', textAlign: 'center', textShadow: '0 2px 6px rgba(0,0,0,0.85)', lineHeight: 1.2 }}>
                      {courtSides.right === 'player1' ? t1Positions.p1 : t2Positions.p1}
                    </span>
                    {servingTeam === courtSides.right ? (
                      <span style={{ fontSize: 8, background: '#10b981', color: '#fff', padding: '1px 5px', borderRadius: 4, marginTop: 2, fontWeight: 700, letterSpacing: 0.5 }}>SERVING</span>
                    ) : (
                      <span style={{ fontSize: 8, background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '1px 4px', borderRadius: 3, marginTop: 2, fontWeight: 700 }}>DEUCE</span>
                    )}
                  </div>
                  {/* Right Side - Bottom Quadrant (Ad Court / Net Player) */}
                  <div style={{
                    position: 'absolute', top: '50%', bottom: '10%', left: '54%', right: '4%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                    pointerEvents: 'none', zIndex: 15,
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.9)', textAlign: 'center', textShadow: '0 2px 6px rgba(0,0,0,0.85)', lineHeight: 1.2 }}>
                      {courtSides.right === 'player1' ? t1Positions.p2 : t2Positions.p2}
                    </span>
                    <span style={{ fontSize: 8, background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '1px 4px', borderRadius: 3, marginTop: 2, fontWeight: 700 }}>NET / AD</span>
                  </div>
                  {/* Right Side - Center Score Overlay */}
                  <div style={{
                    position: 'absolute', top: '50%', left: '74%', transform: 'translate(-50%, -50%)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    pointerEvents: 'none', zIndex: 14, opacity: 0.9
                  }}>
                    <span style={{ fontSize: 'clamp(24px, 10vh, 52px)', fontWeight: 900, fontFamily: 'monospace', color: '#ffffff', textShadow: '0 4px 14px rgba(0,0,0,0.8)' }}>{rightPoints}</span>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#facc15', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Games: {rightGames}</div>
                  </div>
                </>
              ) : (
                <div style={{
                  position: 'absolute', top: '5%', bottom: '5%', left: '55%', right: '5%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                  pointerEvents: 'none', zIndex: 15,
                }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', textAlign: 'center' }}>{rightPlayerName}</span>
                  <span style={{ fontSize: 'clamp(24px, 10vh, 54px)', fontWeight: 900, fontFamily: 'monospace', color: '#ffffff', margin: '2px 0' }}>{rightPoints}</span>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#facc15' }}>Games: {rightGames}</div>
                  {servingTeam === courtSides.right && (
                    <span style={{ fontSize: 9, background: '#10b981', color: '#fff', padding: '1px 5px', borderRadius: 4, fontWeight: 700, letterSpacing: 0.5, marginTop: 2 }}>SERVING</span>
                  )}
                </div>
              )}

              {/* Left touch target */}
              <button
                onClick={() => handleAddPoint(courtSides.left)}
                disabled={!matchStarted || isMatchComplete || isPaused}
                style={{
                  position: 'absolute', top: 0, bottom: 0, left: 0, width: '50%',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  touchAction: 'manipulation', zIndex: 10,
                }}
                onPointerDown={e => { if (!isPaused) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
                onPointerUp={e => e.currentTarget.style.background = 'transparent'}
                onPointerLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 14, fontWeight: 900, color: '#fff',
                  background: 'rgba(37, 99, 235, 0.85)', padding: '4px 10px', borderRadius: 20,
                  pointerEvents: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}>+1 Point</div>
              </button>

              {/* Right touch target */}
              <button
                onClick={() => handleAddPoint(courtSides.right)}
                disabled={!matchStarted || isMatchComplete || isPaused}
                style={{
                  position: 'absolute', top: 0, bottom: 0, right: 0, width: '50%',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  touchAction: 'manipulation', zIndex: 10,
                }}
                onPointerDown={e => { if (!isPaused) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
                onPointerUp={e => e.currentTarget.style.background = 'transparent'}
                onPointerLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 14, fontWeight: 900, color: '#fff',
                  background: 'rgba(16, 185, 129, 0.85)', padding: '4px 10px', borderRadius: 20,
                  pointerEvents: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}>+1 Point</div>
              </button>

              {/* Pause Overlay inside Court */}
              {isPaused && !isMatchComplete && (
                <div style={{
                  position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
                  background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(4px)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  zIndex: 100, gap: 16, borderRadius: 'var(--radius-lg)'
                }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#facc15' }}>
                    ⏸ MATCH PAUSED — Tap Resume to continue
                  </div>
                  <button
                    onClick={() => setIsPaused(false)}
                    className="btn btn-primary"
                    style={{
                      padding: '10px 20px', borderRadius: 'var(--radius-md)', fontWeight: 700,
                      background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)', color: '#000000', border: 'none'
                    }}
                  >
                    ▶ Resume Match
                  </button>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Paused: {formatTime(pauseElapsed)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Point Breakdown / Quick Attribution Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(35, 93, 58, 0.15)',
            border: '1px solid rgba(35, 93, 58, 0.4)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 12px',
            marginTop: 8,
            gap: 8,
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                ⚡ Point Type:
              </span>
              <button
                onClick={() => setShowAttributionSheet(true)}
                className="btn btn-primary btn-sm"
                style={{ fontSize: 11, padding: '4px 10px', height: 28, fontWeight: 700 }}
              >
                + Detailed Reason...
              </button>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                onClick={() => handleAddPoint(courtSides.left, 'ace')}
                disabled={!matchStarted || isMatchComplete || isPaused}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: 11, padding: '4px 8px', height: 28, fontWeight: 700, color: '#2563eb' }}
                title={`Ace for ${courtSides.left === 'player1' ? match.player1_name : match.player2_name}`}
              >
                🎯 Ace L
              </button>
              <button
                onClick={() => handleAddPoint(courtSides.left, 'forehand_winner')}
                disabled={!matchStarted || isMatchComplete || isPaused}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: 11, padding: '4px 8px', height: 28, fontWeight: 700, color: '#2563eb' }}
                title={`Winner for ${courtSides.left === 'player1' ? match.player1_name : match.player2_name}`}
              >
                ⚡ Winner L
              </button>
              <button
                onClick={() => handleAddPoint(courtSides.right, 'ace')}
                disabled={!matchStarted || isMatchComplete || isPaused}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: 11, padding: '4px 8px', height: 28, fontWeight: 700, color: '#10b981' }}
                title={`Ace for ${courtSides.right === 'player1' ? match.player1_name : match.player2_name}`}
              >
                🎯 Ace R
              </button>
              <button
                onClick={() => handleAddPoint(courtSides.right, 'forehand_winner')}
                disabled={!matchStarted || isMatchComplete || isPaused}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: 11, padding: '4px 8px', height: 28, fontWeight: 700, color: '#10b981' }}
                title={`Winner for ${courtSides.right === 'player1' ? match.player1_name : match.player2_name}`}
              >
                ⚡ Winner R
              </button>
            </div>
          </div>

          {/* 3. ACTION CONTROLS (fullscreen-controls) */}
          <div 
            className={isScoringFullscreen ? 'fullscreen-controls' : ''}
            style={{ 
              display: 'flex', 
              gap: 8, 
              alignItems: 'center', 
              justifyContent: 'center', 
              marginTop: isScoringFullscreen ? 0 : 10, 
              flexWrap: 'wrap',
              width: '100%'
            }}
          >
            <button 
              onClick={handleUndo}
              disabled={history.length === 0 || isPaused}
              className="btn"
              style={{
                flex: 1, height: 48, background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, fontWeight: 700,
                opacity: history.length === 0 || isPaused ? 0.5 : 1, cursor: history.length === 0 || isPaused ? 'not-allowed' : 'pointer',
                minWidth: '120px'
              }}
            >
              <IconUndo size={14} /> Undo Point
            </button>
            <button 
              onClick={() => setIsPaused(!isPaused)}
              className="btn"
              style={{
                flex: 1, height: 48, 
                background: isPaused ? 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)' : 'var(--bg-secondary)',
                border: isPaused ? 'none' : '1px solid var(--border)',
                color: isPaused ? '#000000' : 'var(--text-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, fontWeight: 700,
                minWidth: '120px'
              }}
            >
              {isPaused ? <IconPlay size={14} /> : <IconPause size={14} />} {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button 
              onClick={handleSwitchSides}
              className="btn"
              style={{
                flex: 1, height: 48, background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, fontWeight: 700,
                minWidth: '120px'
              }}
            >
              🔄 Swap Sides
            </button>
            {isDoubles && (
              <>
                <button 
                  onClick={() => handleSwapPartners(courtSides.left)}
                  className="btn"
                  style={{
                    flex: 1, height: 48, background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, fontWeight: 700,
                    minWidth: '120px'
                  }}
                >
                  👥 Swap L
                </button>
                <button 
                  onClick={() => handleSwapPartners(courtSides.right)}
                  className="btn"
                  style={{
                    flex: 1, height: 48, background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, fontWeight: 700,
                    minWidth: '120px'
                  }}
                >
                  👥 Swap R
                </button>
              </>
            )}
            {/* Timeout Buttons */}
            <button 
              onClick={() => handleTimeout('player1')}
              disabled={timeoutsP1 >= maxTimeouts || isPaused || isMatchComplete || !matchStarted}
              className="btn"
              style={{
                flex: 1, height: 48, background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.3)',
                color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: 700,
                opacity: timeoutsP1 >= maxTimeouts || isPaused ? 0.5 : 1, minWidth: '110px'
              }}
              title={`Call Timeout for ${match.player1_name}`}
            >
              ⏱ TO ({timeoutsP1}/{maxTimeouts}) L
            </button>
            <button 
              onClick={() => handleTimeout('player2')}
              disabled={timeoutsP2 >= maxTimeouts || isPaused || isMatchComplete || !matchStarted}
              className="btn"
              style={{
                flex: 1, height: 48, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: 700,
                opacity: timeoutsP2 >= maxTimeouts || isPaused ? 0.5 : 1, minWidth: '110px'
              }}
              title={`Call Timeout for ${match.player2_name}`}
            >
              ⏱ TO ({timeoutsP2}/{maxTimeouts}) R
            </button>

            <div className={isScoringFullscreen ? "fullscreen-declare-winner" : ""} style={{ flex: 1, minWidth: '120px' }}>
              <button 
                onClick={() => setDeclareWinnerOpen(true)}
                className="btn"
                style={{
                  width: '100%', height: 48, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, fontWeight: 700,
                  minWidth: '120px'
                }}
              >
                <IconTrophy size={14} /> Winner
              </button>
            </div>
          </div>
        </>
      )}

      {/* Match Statistics Modal */}
      {showStatsModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: 16
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: 24, maxWidth: 460, width: '100%',
            boxShadow: 'var(--glass-shadow)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>📊 Tennis Statistics</h3>
              <button onClick={() => setShowStatsModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center', marginBottom: 16 }}>
              <div style={{ textAlign: 'center', fontWeight: 800, color: '#2563eb', fontSize: 13 }}>{match.player1_name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Metric</div>
              <div style={{ textAlign: 'center', fontWeight: 800, color: '#10b981', fontSize: 13 }}>{match.player2_name}</div>

              {[
                { label: 'Aces', p1: statsP1.aces, p2: statsP2.aces },
                { label: 'Winners (Fore/Back/Volley)', p1: statsP1.winners, p2: statsP2.winners },
                { label: 'Double Faults', p1: statsP1.double_faults, p2: statsP2.double_faults },
                { label: 'Opponent Errors', p1: statsP1.opponent_errors, p2: statsP2.opponent_errors },
                { label: 'Timeouts Used', p1: `${timeoutsP1}/${maxTimeouts}`, p2: `${timeoutsP2}/${maxTimeouts}` },
              ].map((m, i) => (
                <React.Fragment key={i}>
                  <div style={{ background: 'rgba(37,99,235,0.1)', padding: 8, borderRadius: 8, textAlign: 'center', fontWeight: 800, color: '#3b82f6' }}>{m.p1}</div>
                  <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{m.label}</div>
                  <div style={{ background: 'rgba(16,185,129,0.1)', padding: 8, borderRadius: 8, textAlign: 'center', fontWeight: 800, color: '#10b981' }}>{m.p2}</div>
                </React.Fragment>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowStatsModal(false)} className="btn btn-primary" style={{ padding: '8px 20px', fontWeight: 700 }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Point Attribution Sheet Modal */}
      {showAttributionSheet && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: 16
        }} onClick={() => setShowAttributionSheet(false)}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: 20, maxWidth: 600, width: '100%',
            boxShadow: 'var(--glass-shadow)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>⚡ Award Tennis Point with Reason</h3>
              <button onClick={() => setShowAttributionSheet(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {/* Player 1 Options */}
              <div style={{ background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontWeight: 800, color: '#2563eb', fontSize: 13, marginBottom: 4 }}>🔵 {match.player1_name}</div>
                <button onClick={() => { handleAddPoint('player1', 'ace'); setShowAttributionSheet(false); }} className="btn" style={{ fontSize: 11, textAlign: 'left', background: 'var(--bg-secondary)' }}>🎯 Service Ace</button>
                <button onClick={() => { handleAddPoint('player1', 'forehand_winner'); setShowAttributionSheet(false); }} className="btn" style={{ fontSize: 11, textAlign: 'left', background: 'var(--bg-secondary)' }}>⚡ Forehand Winner</button>
                <button onClick={() => { handleAddPoint('player1', 'backhand_winner'); setShowAttributionSheet(false); }} className="btn" style={{ fontSize: 11, textAlign: 'left', background: 'var(--bg-secondary)' }}>💫 Backhand Winner</button>
                <button onClick={() => { handleAddPoint('player1', 'volley_winner'); setShowAttributionSheet(false); }} className="btn" style={{ fontSize: 11, textAlign: 'left', background: 'var(--bg-secondary)' }}>🏐 Net Volley Winner</button>
                <button onClick={() => { handleAddPoint('player1', 'opp_double_fault'); setShowAttributionSheet(false); }} className="btn" style={{ fontSize: 11, textAlign: 'left', background: 'var(--bg-secondary)' }}>⚠️ Opp Double Fault</button>
                <button onClick={() => { handleAddPoint('player1', 'opp_unforced_error'); setShowAttributionSheet(false); }} className="btn" style={{ fontSize: 11, textAlign: 'left', background: 'var(--bg-secondary)' }}>❌ Opp Unforced Error</button>
              </div>

              {/* Player 2 Options */}
              <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontWeight: 800, color: '#10b981', fontSize: 13, marginBottom: 4 }}>🟢 {match.player2_name}</div>
                <button onClick={() => { handleAddPoint('player2', 'ace'); setShowAttributionSheet(false); }} className="btn" style={{ fontSize: 11, textAlign: 'left', background: 'var(--bg-secondary)' }}>🎯 Service Ace</button>
                <button onClick={() => { handleAddPoint('player2', 'forehand_winner'); setShowAttributionSheet(false); }} className="btn" style={{ fontSize: 11, textAlign: 'left', background: 'var(--bg-secondary)' }}>⚡ Forehand Winner</button>
                <button onClick={() => { handleAddPoint('player2', 'backhand_winner'); setShowAttributionSheet(false); }} className="btn" style={{ fontSize: 11, textAlign: 'left', background: 'var(--bg-secondary)' }}>💫 Backhand Winner</button>
                <button onClick={() => { handleAddPoint('player2', 'volley_winner'); setShowAttributionSheet(false); }} className="btn" style={{ fontSize: 11, textAlign: 'left', background: 'var(--bg-secondary)' }}>🏐 Net Volley Winner</button>
                <button onClick={() => { handleAddPoint('player2', 'opp_double_fault'); setShowAttributionSheet(false); }} className="btn" style={{ fontSize: 11, textAlign: 'left', background: 'var(--bg-secondary)' }}>⚠️ Opp Double Fault</button>
                <button onClick={() => { handleAddPoint('player2', 'opp_unforced_error'); setShowAttributionSheet(false); }} className="btn" style={{ fontSize: 11, textAlign: 'left', background: 'var(--bg-secondary)' }}>❌ Opp Unforced Error</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Modal */}
      {showConfigModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: 16
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: 24, maxWidth: 380, width: '100%',
            boxShadow: 'var(--glass-shadow)'
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>⚙️ Configure Timeouts</h3>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Max Timeouts (per team)</label>
              <input 
                type="number" min="1" max="5" 
                value={maxTimeouts} 
                onChange={e => setMaxTimeouts(Math.max(1, parseInt(e.target.value) || 2))}
                className="input" style={{ width: '100%' }}
              />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Timeout Scope</label>
              <select 
                value={timeoutScope} 
                onChange={e => setTimeoutScope(e.target.value as 'set' | 'match')}
                className="input" style={{ width: '100%' }}
              >
                <option value="set">Per Set (Default 2 per set)</option>
                <option value="match">Per Entire Match</option>
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setShowConfigModal(false)} className="btn btn-primary" style={{ padding: '8px 16px', fontWeight: 700 }}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Completed Sets footer */}
      {sets.length > 0 && (
        <div style={{
          marginTop: 16,
          paddingTop: 12,
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'center',
          gap: 16,
          fontSize: 12,
          color: 'var(--text-secondary)',
        }}>
          {sets.map((s, idx) => (
            <span key={idx} style={{ background: 'var(--bg-secondary)', padding: '4px 8px', borderRadius: 4, opacity: s.is_complete ? 1 : 0.5 }}>
              Set {s.set_number}: <strong>{s.player1_score}-{s.player2_score}</strong>
            </span>
          ))}
        </div>
      )}

      {/* Declare Winner Modal Overlay */}
      {declareWinnerOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 10000, padding: 16
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: 24, maxWidth: 400, width: '100%',
            boxShadow: 'var(--glass-shadow)', textAlign: 'center'
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>🏆 Declare Match Winner</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
              Select the winner to end this Tennis match early.
            </p>
            <div style={{
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: 8,
              padding: 12,
              marginBottom: 16,
              textAlign: 'left'
            }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#f59e0b', marginBottom: 6 }}>
                Reason for Early Conclusion:
              </label>
              <select
                value={earlyConcludeReason}
                onChange={e => setEarlyConcludeReason(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  borderRadius: 6,
                  padding: '8px 10px',
                  fontSize: 13,
                  outline: 'none',
                  marginBottom: earlyConcludeReason === 'Other' ? 8 : 0,
                }}
              >
                <option value="Retirement / Medical Injury">Retirement / Medical Injury</option>
                <option value="Walkover / Opponent Forfeit">Walkover / Opponent Forfeit</option>
                <option value="Disqualification / Code Violation">Disqualification / Code Violation</option>
                <option value="Adverse Conditions / Weather / Venue Issue">Adverse Conditions / Weather / Venue Issue</option>
                <option value="Match Time Curfew / Official Decision">Match Time Curfew / Official Decision</option>
                <option value="Mutual Agreement">Mutual Agreement</option>
                <option value="Other">Other (Please specify)</option>
              </select>

              {earlyConcludeReason === 'Other' && (
                <input
                  type="text"
                  placeholder="Enter specific reason..."
                  value={customEarlyConcludeReason}
                  onChange={e => setCustomEarlyConcludeReason(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    borderRadius: 6,
                    padding: '8px 10px',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={() => {
                  const effectiveReason = earlyConcludeReason === 'Other'
                    ? (customEarlyConcludeReason.trim() || 'Other')
                    : earlyConcludeReason;
                  handleDeclareWinner(match.player1_id, effectiveReason);
                }}
                className="btn btn-primary"
                style={{ height: 44, fontSize: 14, fontWeight: 600 }}
              >
                🥇 Winner: {match.player1_name}
              </button>
              <button
                onClick={() => {
                  const effectiveReason = earlyConcludeReason === 'Other'
                    ? (customEarlyConcludeReason.trim() || 'Other')
                    : earlyConcludeReason;
                  handleDeclareWinner(match.player2_id, effectiveReason);
                }}
                className="btn btn-primary"
                style={{ height: 44, fontSize: 14, fontWeight: 600, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
              >
                🥇 Winner: {match.player2_name}
              </button>
              <button
                onClick={() => setDeclareWinnerOpen(false)}
                className="btn btn-ghost"
                style={{ height: 44, fontSize: 14, color: 'var(--text-muted)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
