'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Match, TournamentEvent, Tournament, MatchSet, Team } from '@/types';
import { updateMatchScore, logAction, getTeamsByTournament } from '@/lib/supabase-service';
import { useAuth } from '@/lib/auth-context';
import {
  isVolleyballSetComplete,
  isVolleyballMatchWon,
  VolleyballMetadata,
  initialVolleyballMetadata,
  VolleyballPointType,
  VolleyballPointStats,
} from '@/lib/sports-rules';
import { IconPlay, IconPause, IconUndo, IconCheck, IconArrowLeft, IconTrophy } from '@/components/icons';
import MatchMediaModal from '@/components/MatchMediaModal';
import { getTeamLogo } from '@/lib/team-logos';
import { getUniqueMatchId } from '@/lib/match-numbering';

interface VolleyballScoringProps {
  match: Match;
  event?: TournamentEvent;
  tournament?: Tournament;
  onScoreUpdated: () => void;
}

export default function VolleyballScoring({
  match,
  event,
  tournament,
  onScoreUpdated,
}: VolleyballScoringProps) {
  const { user } = useAuth();

  const [isScoringFullscreen, setIsScoringFullscreen] = useState(false);
  const scorecardRef = useRef<HTMLDivElement | null>(null);

  const toggleFullscreen = useCallback(() => {
    const container = scorecardRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => {
        setIsScoringFullscreen(true);
        if (screen.orientation && (screen.orientation as any).lock) {
          (screen.orientation as any).lock('landscape').catch(() => {});
        }
      }).catch(err => {
        console.error('Fullscreen request failed:', err);
        setIsScoringFullscreen(true);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsScoringFullscreen(false);
      }).catch(() => {
        setIsScoringFullscreen(false);
      });
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsScoringFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Format configurations
  const existingMeta = (match.sport_metadata as VolleyballMetadata) || initialVolleyballMetadata;

  // Infer default rules from event scoring_format if not previously saved in sport_metadata
  const eventScoring = event?.scoring_format || '';
  const initialFormatFromEvent = 
    eventScoring.includes('best-of-5') ? 'best_of_5' :
    eventScoring.includes('best-of-3') ? 'best_of_3' : 'best_of_3';

  const initialStandardPointsFromEvent =
    eventScoring.startsWith('15-point') ? 15 :
    eventScoring.startsWith('21-point') ? 21 : 25;

  const [matchFormat, setMatchFormat] = useState<'best_of_3' | 'best_of_5' | 'custom'>(
    existingMeta.match_format || initialFormatFromEvent
  );
  const [standardSetPoints, setStandardSetPoints] = useState<number>(
    existingMeta.standard_set_points || initialStandardPointsFromEvent
  );
  const [decidingSetPoints, setDecidingSetPoints] = useState<number>(existingMeta.deciding_set_points || 15);
  const [servingTeam, setServingTeam] = useState<'player1' | 'player2'>(existingMeta.serving_team || 'player1');
  const [timeoutsP1, setTimeoutsP1] = useState<number>(existingMeta.timeouts_p1 || 0);
  const [timeoutsP2, setTimeoutsP2] = useState<number>(existingMeta.timeouts_p2 || 0);

  // Point classification stats
  const [statsP1, setStatsP1] = useState<VolleyballPointStats>(
    existingMeta.stats_p1 || { attacks: 0, blocks: 0, aces: 0, opponent_errors: 0 }
  );
  const [statsP2, setStatsP2] = useState<VolleyballPointStats>(
    existingMeta.stats_p2 || { attacks: 0, blocks: 0, aces: 0, opponent_errors: 0 }
  );
  const [lastPointType, setLastPointType] = useState<VolleyballPointType | null>(existingMeta.last_point_type || null);
  const [lastPointScorer, setLastPointScorer] = useState<'player1' | 'player2' | null>(existingMeta.last_point_scorer || null);

  // 6-Player Rotation tracking (Positions 1 to 6)
  const [rotationP1, setRotationP1] = useState<number[]>(existingMeta.rotation_p1 || [1, 2, 3, 4, 5, 6]);
  const [rotationP2, setRotationP2] = useState<number[]>(existingMeta.rotation_p2 || [1, 2, 3, 4, 5, 6]);

  // Point Type selector modal / quick-popover
  const [pointReasonModal, setPointReasonModal] = useState<{ open: boolean; targetPlayer: 'player1' | 'player2' }>({
    open: false,
    targetPlayer: 'player1',
  });

  // Sound and Vibration toggles
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrateEnabled, setVibrateEnabled] = useState(true);

  // Court Selection
  const [selectedCourt, setSelectedCourt] = useState<string>(match.court || 'Court 1');

  // Teams and Roster
  const [team1Roster, setTeam1Roster] = useState<string[]>([]);
  const [team2Roster, setTeam2Roster] = useState<string[]>([]);

  useEffect(() => {
    async function loadRosters() {
      if (tournament?.id) {
        try {
          const teams = await getTeamsByTournament(tournament.id);
          const t1 = teams.find(t => t.id === match.player1_id || t.name.toLowerCase() === match.player1_name.toLowerCase());
          const t2 = teams.find(t => t.id === match.player2_id || t.name.toLowerCase() === match.player2_name.toLowerCase());
          if (t1 && t1.players && t1.players.length > 0) setTeam1Roster(t1.players);
          if (t2 && t2.players && t2.players.length > 0) setTeam2Roster(t2.players);
        } catch (e) {
          // ignore roster fetch error
        }
      }
    }
    loadRosters();
  }, [tournament?.id, match.player1_id, match.player2_id, match.player1_name, match.player2_name]);

  // Timer states
  const [matchStarted, setMatchStarted] = useState<boolean>(match.status === 'running' || match.status === 'completed');
  const [isPaused, setIsPaused] = useState<boolean>(match.status === 'paused');
  const [matchElapsed, setMatchElapsed] = useState<number>(match.duration_seconds || 0);
  const [pauseElapsed, setPauseElapsed] = useState<number>(0);
  const [totalPausedTime, setTotalPausedTime] = useState<number>(0);

  // History stack for Undo (including stats and rotations)
  const [history, setHistory] = useState<{
    sets: MatchSet[];
    servingTeam: 'player1' | 'player2';
    timeoutsP1: number;
    timeoutsP2: number;
    statsP1: VolleyballPointStats;
    statsP2: VolleyballPointStats;
    rotationP1: number[];
    rotationP2: number[];
    lastPointType?: VolleyballPointType;
    lastPointScorer?: 'player1' | 'player2';
  }[]>([]);

  // Modals & Panels
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showEndMatchModal, setShowEndMatchModal] = useState(false);
  const [earlyConcludeReason, setEarlyConcludeReason] = useState<string>('Retirement / Medical Injury');
  const [customEarlyConcludeReason, setCustomEarlyConcludeReason] = useState<string>('');
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [mobileAttributionTab, setMobileAttributionTab] = useState<'player1' | 'player2'>('player1');

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sets state: Always guarantee all sets for the format exist
  const initializeSets = (): MatchSet[] => {
    const maxSets = matchFormat === 'best_of_5' ? 5 : 3;
    const initial: MatchSet[] = [];
    const existingSets = match.sets || [];
    
    for (let i = 1; i <= maxSets; i++) {
      const existing = existingSets.find(s => s.set_number === i);
      if (existing) {
        initial.push({ ...existing });
      } else {
        initial.push({
          set_number: i,
          player1_score: 0,
          player2_score: 0,
          is_complete: false,
          winner_id: undefined,
        });
      }
    }
    return initial;
  };

  // Court Side Switch State (allows umpire to flip team 1 and team 2 court sides)
  const [sidesSwapped, setSidesSwapped] = useState<boolean>(false);

  // Offline / Network Resilience States
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [offlinePendingCount, setOfflinePendingCount] = useState<number>(0);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'offline' | 'saved_locally'>('idle');

  // Monitor network online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      flushOfflineQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check of pending offline updates for this match in localStorage
    try {
      const stored = localStorage.getItem(`matchpoint_offline_score_${match.id}`);
      if (stored) {
        setOfflinePendingCount(1);
        setSyncStatus('saved_locally');
        if (navigator.onLine) {
          flushOfflineQueue();
        }
      }
    } catch {}

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [match.id]);

  // Flush offline queue when network is restored
  const flushOfflineQueue = async () => {
    try {
      const key = `matchpoint_offline_score_${match.id}`;
      const payloadStr = localStorage.getItem(key);
      if (!payloadStr) return;

      setSyncStatus('syncing');
      const payload = JSON.parse(payloadStr);

      await updateMatchScore(
        payload.matchId,
        payload.sets,
        payload.status,
        payload.winnerId,
        payload.actualStartTime,
        payload.actualEndTime,
        payload.court,
        undefined,
        payload.durationSeconds,
        'volleyball',
        payload.metadata
      );

      localStorage.removeItem(key);
      setOfflinePendingCount(0);
      setSyncStatus('idle');
      onScoreUpdated();
    } catch (err) {
      console.warn('Failed to flush offline queue:', err);
      setSyncStatus('saved_locally');
    }
  };

  const [sets, setSets] = useState<MatchSet[]>(initializeSets);

  // Calculate sets won
  const setsToWin = matchFormat === 'best_of_5' ? 3 : 2;
  const p1SetsWon = sets.filter(s => s.is_complete && (s.winner_id === 'player1' || s.winner_id === match.player1_id)).length;
  const p2SetsWon = sets.filter(s => s.is_complete && (s.winner_id === 'player2' || s.winner_id === match.player2_id)).length;
  const isMatchComplete = match.status === 'completed' || p1SetsWon >= setsToWin || p2SetsWon >= setsToWin;

  // Active set computation: first incomplete set, or last set if all are complete
  const currentSetIdx = sets.findIndex(s => !s.is_complete) !== -1
    ? sets.findIndex(s => !s.is_complete)
    : Math.max(0, sets.length - 1);
  const currentSet = sets[currentSetIdx] || { player1_score: 0, player2_score: 0, set_number: 1, is_complete: false };

  // Rally target points for current set
  const isDecidingSet = (matchFormat === 'best_of_3' && currentSet.set_number === 3) ||
                        (matchFormat === 'best_of_5' && currentSet.set_number === 5);
  const currentTargetPoints = isDecidingSet ? decidingSetPoints : standardSetPoints;


  // Audio feedback
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

  const triggerVibrate = (ms = 40) => {
    if (vibrateEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(ms);
    }
  };

  // Timers
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

  // Sync matchElapsed if match updates externally
  useEffect(() => {
    if (match.duration_seconds !== undefined && match.duration_seconds > matchElapsed) {
      setMatchElapsed(match.duration_seconds);
    }
    if (match.status === 'paused') {
      setIsPaused(true);
    } else if (match.status === 'running') {
      setIsPaused(false);
      setMatchStarted(true);
    }
  }, [match.duration_seconds, match.status]);

  // Rotate a team's positions clockwise: 1->6, 2->1, 3->2, 4->3, 5->4, 6->5 (FIVB rule)
  const rotateTeamLineup = (currentRotation: number[]): number[] => {
    if (currentRotation.length !== 6) return currentRotation;
    // Standard rotation order: player at Pos 1 goes to Pos 6, Pos 2 to Pos 1, Pos 3 to Pos 2, Pos 4 to Pos 3, Pos 5 to Pos 4, Pos 6 to Pos 5
    const [p1, p2, p3, p4, p5, p6] = currentRotation;
    return [p2, p3, p4, p5, p6, p1];
  };

  // Sync to database
  const saveStateToDB = async (
    updatedSets: MatchSet[],
    overrideStatus?: Match['status'],
    overrideWinnerId?: string | null,
    newServingTeam?: 'player1' | 'player2',
    newTimeoutsP1?: number,
    newTimeoutsP2?: number,
    newDuration?: number,
    overrideStatsP1?: VolleyballPointStats,
    overrideStatsP2?: VolleyballPointStats,
    overrideRotationP1?: number[],
    overrideRotationP2?: number[],
    overrideLastPointType?: VolleyballPointType,
    overrideLastPointScorer?: 'player1' | 'player2',
    earlyReason?: string
  ) => {
    const finalSetsWon = isVolleyballMatchWon(updatedSets, matchFormat);
    const finalStatus = overrideStatus || (overrideWinnerId || finalSetsWon.isWon ? 'completed' : (isPaused ? 'paused' : 'running'));
    const finalWinner = overrideWinnerId || (finalSetsWon.isWon ? (finalSetsWon.winnerId === 'player1' ? match.player1_id : match.player2_id) : null);

    const metadata: VolleyballMetadata = {
      serving_team: newServingTeam || servingTeam,
      match_format: matchFormat,
      standard_set_points: standardSetPoints,
      deciding_set_points: decidingSetPoints,
      timeouts_p1: newTimeoutsP1 !== undefined ? newTimeoutsP1 : timeoutsP1,
      timeouts_p2: newTimeoutsP2 !== undefined ? newTimeoutsP2 : timeoutsP2,
      max_timeouts_per_set: 2,
      stats_p1: overrideStatsP1 || statsP1,
      stats_p2: overrideStatsP2 || statsP2,
      rotation_p1: overrideRotationP1 || rotationP1,
      rotation_p2: overrideRotationP2 || rotationP2,
      last_point_type: overrideLastPointType !== undefined ? overrideLastPointType : (lastPointType || undefined),
      last_point_scorer: overrideLastPointScorer !== undefined ? overrideLastPointScorer : (lastPointScorer || undefined),
      early_conclude_reason: earlyReason || (match.sport_metadata as any)?.early_conclude_reason,
    };

    // Prepare payload
    const payload = {
      matchId: match.id,
      sets: updatedSets,
      status: finalStatus,
      winnerId: finalWinner,
      actualStartTime: match.actual_start_time || new Date().toISOString(),
      actualEndTime: finalStatus === 'completed' ? new Date().toISOString() : null,
      court: selectedCourt,
      durationSeconds: newDuration !== undefined ? newDuration : matchElapsed,
      metadata,
    };

    // Cache locally immediately so user NEVER loses data regardless of connection
    try {
      localStorage.setItem(`matchpoint_offline_score_${match.id}`, JSON.stringify(payload));
    } catch {}

    // If device is explicitly offline, mark saved locally and notify UI
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setOfflinePendingCount(1);
      setSyncStatus('saved_locally');
      onScoreUpdated();
      return;
    }

    try {
      setSyncStatus('syncing');
      await updateMatchScore(
        match.id,
        updatedSets,
        finalStatus,
        finalWinner,
        payload.actualStartTime,
        payload.actualEndTime,
        selectedCourt,
        undefined,
        payload.durationSeconds,
        'volleyball',
        metadata
      );

      // Successfully synced to backend! Clear offline copy
      try {
        localStorage.removeItem(`matchpoint_offline_score_${match.id}`);
      } catch {}

      setOfflinePendingCount(0);
      setSyncStatus('idle');

      if (finalStatus === 'completed' && earlyReason) {
        await logAction(
          'Match Concluded Early',
          'match',
          `Match ${match.player1_name} vs ${match.player2_name} concluded early. Reason: "${earlyReason}". Winner: ${finalWinner === match.player1_id ? match.player1_name : match.player2_name}`,
          user ? { id: user.id, name: user.name } : null
        );
      }

      onScoreUpdated();
    } catch (err) {
      console.warn('Network slow/offline: Score saved locally on device:', err);
      setOfflinePendingCount(1);
      setSyncStatus('saved_locally');
      // Still trigger onScoreUpdated so local state updates immediately
      onScoreUpdated();
    }
  };

  // Point Addition with full FIVB classification & rotation
  const handleAddPoint = (scoringPlayer: 'player1' | 'player2', pointType: VolleyballPointType = 'quick') => {
    // If match not started, match complete, match paused, or current set is complete, don't allow points
    if (!matchStarted || isMatchComplete || isPaused) return;
    if (currentSet.is_complete) return;

    // Push to undo stack
    setHistory(prev => [
      ...prev,
      {
        sets: sets.map(s => ({ ...s })),
        servingTeam,
        timeoutsP1,
        timeoutsP2,
        statsP1: { ...statsP1 },
        statsP2: { ...statsP2 },
        rotationP1: [...rotationP1],
        rotationP2: [...rotationP2],
        lastPointType: lastPointType || undefined,
        lastPointScorer: lastPointScorer || undefined,
      },
    ]);

    playBeep(scoringPlayer === 'player1' ? 880 : 980);
    triggerVibrate();

    // 1. Calculate stats update
    let nextStatsP1 = { ...statsP1 };
    let nextStatsP2 = { ...statsP2 };

    if (scoringPlayer === 'player1') {
      if (pointType === 'attack') nextStatsP1.attacks++;
      else if (pointType === 'block') nextStatsP1.blocks++;
      else if (pointType === 'ace') nextStatsP1.aces++;
      else if (pointType.startsWith('opp_')) nextStatsP1.opponent_errors++;
    } else {
      if (pointType === 'attack') nextStatsP2.attacks++;
      else if (pointType === 'block') nextStatsP2.blocks++;
      else if (pointType === 'ace') nextStatsP2.aces++;
      else if (pointType.startsWith('opp_')) nextStatsP2.opponent_errors++;
    }

    setStatsP1(nextStatsP1);
    setStatsP2(nextStatsP2);
    setLastPointType(pointType);
    setLastPointScorer(scoringPlayer);

    // 2. FIVB Rotation Rule: If receiving team wins the rally (side-out), they gain the serve AND MUST ROTATE clockwise
    let nextRotationP1 = [...rotationP1];
    let nextRotationP2 = [...rotationP2];

    const isSideOut = servingTeam !== scoringPlayer;
    if (isSideOut) {
      if (scoringPlayer === 'player1') {
        nextRotationP1 = rotateTeamLineup(rotationP1);
        setRotationP1(nextRotationP1);
      } else {
        nextRotationP2 = rotateTeamLineup(rotationP2);
        setRotationP2(nextRotationP2);
      }
    }

    const nextServingTeam = scoringPlayer;
    setServingTeam(nextServingTeam);

    // 3. Update current set score and check if set is complete
    let setJustCompleted = false;
    const updatedSets = sets.map((s, idx) => {
      if (idx !== currentSetIdx) return s;
      const copy = { ...s };
      if (scoringPlayer === 'player1') copy.player1_score++;
      else copy.player2_score++;

      // Check if set won (25 pts for standard, 15 for decider, win by 2, no upper cap)
      if (
        isVolleyballSetComplete(
          copy.player1_score,
          copy.player2_score,
          copy.set_number,
          matchFormat,
          standardSetPoints,
          decidingSetPoints
        )
      ) {
        copy.is_complete = true;
        copy.winner_id = copy.player1_score > copy.player2_score ? 'player1' : 'player2';
        setJustCompleted = true;
      }
      return copy;
    });

    setSets(updatedSets);

    // Check if match won
    const matchWonCheck = isVolleyballMatchWon(updatedSets, matchFormat);
    const isMatchNowWon = matchWonCheck.isWon;

    // Reset timeouts on set completion
    let nextT1 = timeoutsP1;
    let nextT2 = timeoutsP2;
    if (setJustCompleted) {
      nextT1 = 0;
      nextT2 = 0;
      setTimeoutsP1(0);
      setTimeoutsP2(0);
    }

    const nextStatus = isMatchNowWon ? 'completed' : (isPaused ? 'paused' : 'running');
    const nextWinner = isMatchNowWon ? (matchWonCheck.winnerId === 'player1' ? match.player1_id : match.player2_id) : null;

    saveStateToDB(
      updatedSets,
      nextStatus,
      nextWinner,
      nextServingTeam,
      nextT1,
      nextT2,
      undefined,
      nextStatsP1,
      nextStatsP2,
      nextRotationP1,
      nextRotationP2,
      pointType,
      scoringPlayer
    );
  };

  // Undo Last Point
  const handleUndo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setSets(last.sets);
    setServingTeam(last.servingTeam);
    setTimeoutsP1(last.timeoutsP1);
    setTimeoutsP2(last.timeoutsP2);
    setStatsP1(last.statsP1);
    setStatsP2(last.statsP2);
    setRotationP1(last.rotationP1);
    setRotationP2(last.rotationP2);
    setLastPointType(last.lastPointType || null);
    setLastPointScorer(last.lastPointScorer || null);

    saveStateToDB(
      last.sets,
      'running',
      null,
      last.servingTeam,
      last.timeoutsP1,
      last.timeoutsP2,
      undefined,
      last.statsP1,
      last.statsP2,
      last.rotationP1,
      last.rotationP2,
      last.lastPointType,
      last.lastPointScorer
    );
  };

  // Timeout Call
  const handleCallTimeout = (player: 'player1' | 'player2') => {
    if (player === 'player1' && timeoutsP1 < 2) {
      const next = timeoutsP1 + 1;
      setTimeoutsP1(next);
      saveStateToDB(sets, undefined, undefined, servingTeam, next, timeoutsP2);
    } else if (player === 'player2' && timeoutsP2 < 2) {
      const next = timeoutsP2 + 1;
      setTimeoutsP2(next);
      saveStateToDB(sets, undefined, undefined, servingTeam, timeoutsP1, next);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={scorecardRef}
      className="vb-scoring-root"
      style={{
        background: '#0B1120',
        color: '#F8FAFC',
        minHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Inter, system-ui, sans-serif',
        padding: '16px',
        borderRadius: isScoringFullscreen ? '0' : '16px',
      }}
    >
      {/* Top Header bar */}
      <div
        className="vb-header-bar"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          paddingBottom: '12px',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>🏐</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>
                Volleyball Match Umpire Console
              </h2>
              <span
                style={{
                  background: 'rgba(59, 130, 246, 0.2)',
                  color: '#93C5FD',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  fontWeight: 800,
                }}
              >
                {getUniqueMatchId(match)}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#94A3B8' }}>
              {tournament?.name || 'Tournament'} • Set {currentSet.set_number} (Target: {currentTargetPoints} pts, win by 2)
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Live Stopwatch Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: isPaused ? 'rgba(234, 179, 8, 0.15)' : matchStarted && !isMatchComplete ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: isPaused ? '1px solid rgba(234, 179, 8, 0.4)' : matchStarted && !isMatchComplete ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
              padding: '6px 14px',
              borderRadius: '8px',
              fontFamily: 'monospace',
              fontSize: '14px',
              fontWeight: '800',
              color: isPaused ? '#FACC15' : matchStarted && !isMatchComplete ? '#4ADE80' : '#94A3B8',
            }}
          >
            <span>⏱️</span>
            <span>{formatTime(matchElapsed)}</span>
            <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: isPaused ? '#EAB308' : matchStarted && !isMatchComplete ? '#22C55E' : '#64748B', color: '#0F172A', fontWeight: 900 }}>
              {isPaused ? 'PAUSED' : matchStarted && !isMatchComplete ? 'RUNNING' : 'STOPPED'}
            </span>
          </div>
          {/* Offline / Sync Status Badge */}
          {(!isOnline || syncStatus === 'saved_locally' || syncStatus === 'syncing') && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: syncStatus === 'syncing' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                border: syncStatus === 'syncing' ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid rgba(234, 179, 8, 0.4)',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '700',
                color: syncStatus === 'syncing' ? '#93C5FD' : '#FDE047',
              }}
              title={
                !isOnline
                  ? 'Device is offline. Scores are safely saved locally on device and will auto-sync once connection restores.'
                  : syncStatus === 'saved_locally'
                  ? 'Score saved locally on device. Syncing to server...'
                  : 'Syncing offline scores to server...'
              }
            >
              <span>{syncStatus === 'syncing' ? '🔄' : '📶'}</span>
              <span>
                {!isOnline ? 'Offline Mode (Saved Locally)' : syncStatus === 'saved_locally' ? 'Saved Locally (Pending Sync)' : 'Syncing Score...'}
              </span>
            </div>
          )}

          {/* Switch Court Sides Button */}
          <button
            onClick={() => setSidesSwapped(prev => !prev)}
            style={{
              background: sidesSwapped ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255, 255, 255, 0.08)',
              border: sidesSwapped ? '1px solid rgba(168, 85, 247, 0.5)' : '1px solid rgba(255, 255, 255, 0.15)',
              color: sidesSwapped ? '#D8B4FE' : '#E2E8F0',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s ease',
            }}
            title="Switch court sides (Swap Left and Right teams on court)"
          >
            <span>⇄</span>
            <span>Switch Sides</span>
          </button>

          {/* Format Badge */}
          <button
            onClick={() => setShowConfigModal(true)}
            style={{
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: '#60A5FA',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            ⚙️ Format: {matchFormat === 'best_of_5' ? 'Best of 5' : 'Best of 3'} ({standardSetPoints}/{decidingSetPoints} pts)
          </button>

          <button
            onClick={() => setShowMediaModal(true)}
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#F87171',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            📺 YouTube / Media
          </button>

          <button
            onClick={toggleFullscreen}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#E2E8F0',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            {isScoringFullscreen ? 'Exit Fullscreen' : '⛶ Fullscreen'}
          </button>
        </div>
      </div>

      {/* Interactive Olympic / World Championship Volleyball Court Graphic Mat (Exact match to official FIVB court) */}
      <div
        className={isScoringFullscreen ? 'fullscreen-court-container' : ''}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 0,
          width: '100%',
          margin: '10px 0',
        }}
      >
        <div
          className={`vb-court-box ${isScoringFullscreen ? 'fullscreen-court' : ''}`}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: isScoringFullscreen ? '94vw' : '100%',
            /* Surrounding court: Outer Free-Zone Wood Floor, followed by deep cobalt blue free-zone */
            background: '#0D47A1', // Deep royal cobalt blue free zone (exact match to image)
            border: '18px solid #0B3C8A',
            outline: '10px solid #E8DFD0', // Natural birch outer arena floor border
            borderRadius: '8px',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.75), inset 0 0 50px rgba(0,0,0,0.4)',
            overflow: 'hidden',
            aspectRatio: '1.82 / 1',
            minHeight: isScoringFullscreen ? undefined : 330,
            opacity: isMatchComplete ? 0.45 : isPaused ? 0.6 : 1,
            transition: 'all 0.25s ease',
          }}
        >
          {/* Subtle Olympic court surface texture */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 16px, transparent 16px, transparent 32px), radial-gradient(circle at 50% 40%, rgba(255,255,255,0.12) 0%, transparent 80%)',
              pointerEvents: 'none',
              zIndex: 2,
            }}
          />

          {/* MAIN 9m x 18m PLAYING COURT (Framed with white 5cm boundary line inside the blue free-zone) */}
          <div
            style={{
              position: 'absolute',
              top: '11%',
              bottom: '11%',
              left: '11%',
              right: '11%',
              border: '4px solid #FFFFFF',
              boxShadow: '0 0 10px rgba(0,0,0,0.3)',
              display: 'flex',
              zIndex: 4,
              overflow: 'hidden',
            }}
          >
            {/* Left Court (Backcourt): Warm Natural Beech / Cream Matte Wood */}
            <div
              style={{
                flex: '1 1 33.33%',
                background: '#E9DFC9', // Light sandy birch wood
                backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.012) 0px, rgba(0,0,0,0.012) 8px, transparent 8px, transparent 16px)',
                position: 'relative',
              }}
            />

            {/* Middle Attack Zone (3m Left + 3m Right = 6m Total): Warm Golden Amber / Caramel Parquet */}
            <div
              style={{
                flex: '1 1 33.34%',
                background: '#C99752', // Golden amber attack zone (exact match to image)
                backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.02) 0px, rgba(0,0,0,0.02) 8px, transparent 8px, transparent 16px)',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Central FIVB / Tournament Swirl Volleyball Emblem (SVG - exact purple 5-blade swirl with volleyball center) */}
              <svg
                viewBox="0 0 200 200"
                style={{
                  width: isScoringFullscreen ? '190px' : '135px',
                  height: isScoringFullscreen ? '190px' : '135px',
                  opacity: 0.88,
                  filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.25))',
                  pointerEvents: 'none',
                  zIndex: 5,
                }}
              >
                {/* 5 Dynamic Curved Swirl Blades (Royal Purple #5B32A3) */}
                <g fill="#5B32A3">
                  <path d="M100 25 C122 25 142 35 156 50 C146 56 136 65 129 76 C124 55 113 40 100 25 Z" />
                  <path d="M165 78 C176 96 177 118 168 137 C157 131 144 128 131 129 C148 116 158 98 165 78 Z" />
                  <path d="M142 165 C125 178 102 181 83 173 C87 161 93 149 103 140 C113 158 128 167 142 165 Z" />
                  <path d="M60 162 C43 147 37 124 43 103 C54 108 66 115 74 125 C62 138 57 151 60 162 Z" />
                  <path d="M43 72 C55 54 75 43 96 44 C95 56 97 69 103 80 C86 73 66 70 43 72 Z" />
                </g>
                {/* Center Volleyball with seams */}
                <circle cx="100" cy="100" r="23" fill="#E9DFC9" stroke="#5B32A3" strokeWidth="2.5" />
                <path d="M84 92 C92 88 100 88 108 92" stroke="#5B32A3" strokeWidth="2" fill="none" />
                <path d="M82 100 C92 100 108 100 118 100" stroke="#5B32A3" strokeWidth="2" fill="none" />
                <path d="M84 108 C92 112 100 112 108 108" stroke="#5B32A3" strokeWidth="2" fill="none" />
                <path d="M96 79 C96 89 96 111 96 121" stroke="#5B32A3" strokeWidth="2" fill="none" />
                <path d="M104 79 C104 89 104 111 104 121" stroke="#5B32A3" strokeWidth="2" fill="none" />
              </svg>
            </div>

            {/* Right Court (Backcourt): Warm Natural Beech / Cream Matte Wood */}
            <div
              style={{
                flex: '1 1 33.33%',
                background: '#E9DFC9', // Light sandy birch wood
                backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.012) 0px, rgba(0,0,0,0.012) 8px, transparent 8px, transparent 16px)',
                position: 'relative',
              }}
            />
          </div>

          {/* ATTACK LINE EXTENSIONS (Dashed white tick marks outside sidelines on free zone, matching image) */}
          {/* Top-left attack line extension */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              height: '11%',
              left: 'calc(11% + 33.33% * 0.78)',
              width: '3px',
              backgroundImage: 'repeating-linear-gradient(to bottom, #FFFFFF 0px, #FFFFFF 6px, transparent 6px, transparent 12px)',
              zIndex: 6,
              pointerEvents: 'none',
            }}
          />
          {/* Bottom-left attack line extension */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              height: '11%',
              left: 'calc(11% + 33.33% * 0.78)',
              width: '3px',
              backgroundImage: 'repeating-linear-gradient(to top, #FFFFFF 0px, #FFFFFF 6px, transparent 6px, transparent 12px)',
              zIndex: 6,
              pointerEvents: 'none',
            }}
          />
          {/* Top-right attack line extension */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              height: '11%',
              right: 'calc(11% + 33.33% * 0.78)',
              width: '3px',
              backgroundImage: 'repeating-linear-gradient(to bottom, #FFFFFF 0px, #FFFFFF 6px, transparent 6px, transparent 12px)',
              zIndex: 6,
              pointerEvents: 'none',
            }}
          />
          {/* Bottom-right attack line extension */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              height: '11%',
              right: 'calc(11% + 33.33% * 0.78)',
              width: '3px',
              backgroundImage: 'repeating-linear-gradient(to top, #FFFFFF 0px, #FFFFFF 6px, transparent 6px, transparent 12px)',
              zIndex: 6,
              pointerEvents: 'none',
            }}
          />

          {/* Outer Boundary Corner Hash Marks (Service Zone Limiters on free zone) */}
          <div style={{ position: 'absolute', top: '9%', left: '10%', width: '8px', height: '3px', background: '#FFFFFF', zIndex: 6, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '9%', left: '10%', width: '8px', height: '3px', background: '#FFFFFF', zIndex: 6, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '9%', right: '10%', width: '8px', height: '3px', background: '#FFFFFF', zIndex: 6, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '9%', right: '10%', width: '8px', height: '3px', background: '#FFFFFF', zIndex: 6, pointerEvents: 'none' }} />

          {/* Center Line underneath the Net */}
          <div
            style={{
              position: 'absolute',
              top: '11%',
              bottom: '11%',
              left: '50%',
              width: '3px',
              transform: 'translateX(-50%)',
              background: '#FFFFFF',
              pointerEvents: 'none',
              zIndex: 7,
            }}
          />

          {/* Volleyball Net - spans full court and posts in the free zone */}
          <div
            style={{
              position: 'absolute',
              top: '7%',
              bottom: '7%',
              left: '50%',
              width: '6px',
              transform: 'translateX(-50%)',
              background: 'repeating-linear-gradient(to bottom, #FFFFFF 0px, #FFFFFF 4px, rgba(15,23,42,0.9) 4px, rgba(15,23,42,0.9) 8px)',
              boxShadow: '0 0 16px rgba(0,0,0,0.85)',
              zIndex: 25,
              pointerEvents: 'none',
            }}
          />

          {/* Top Post and Antenna in Blue Zone */}
          <div
            style={{
              position: 'absolute',
              top: '3%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '8px',
              height: '24px',
              background: '#1E293B',
              borderRadius: '3px',
              border: '1px solid #94A3B8',
              boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
              zIndex: 26,
              pointerEvents: 'none',
            }}
          />
          {/* Bottom Post and Antenna in Blue Zone */}
          <div
            style={{
              position: 'absolute',
              bottom: '3%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '8px',
              height: '24px',
              background: '#1E293B',
              borderRadius: '3px',
              border: '1px solid #94A3B8',
              boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
              zIndex: 26,
              pointerEvents: 'none',
            }}
          />

          {/* Clean Volleyball Court Mat (Player position circles and numbers removed for clear unobstructed view) */}

          {/* Left Half Court Surface - Dynamically swaps team 1 or team 2 based on sidesSwapped */}
          {(() => {
            const leftTeamKey: 'player1' | 'player2' = !sidesSwapped ? 'player1' : 'player2';
            const leftName = !sidesSwapped ? match.player1_name : match.player2_name;
            const leftScore = !sidesSwapped ? currentSet.player1_score : currentSet.player2_score;
            const leftSetsWon = !sidesSwapped ? p1SetsWon : p2SetsWon;
            const leftTimeouts = !sidesSwapped ? timeoutsP1 : timeoutsP2;
            const isLeftServing = servingTeam === leftTeamKey;
            const leftThemeColor = leftTeamKey === 'player1' ? '#2563EB' : '#10B981';

            return (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: 0,
                  width: '50%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  boxSizing: 'border-box',
                  zIndex: 10,
                  pointerEvents: 'none',
                }}
              >
                {/* Top Bar: Team Name + Serving Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'flex-start' }}>
                  <div
                    style={{
                      background: isLeftServing ? leftThemeColor : 'rgba(15, 23, 42, 0.85)',
                      color: '#FFFFFF',
                      padding: '4px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '800',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                      backdropFilter: 'blur(6px)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    {getTeamLogo(leftName) && (
                      <img
                        src={getTeamLogo(leftName)!}
                        alt={leftName}
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 4,
                          objectFit: 'cover',
                          border: '1px solid rgba(255,255,255,0.5)',
                        }}
                      />
                    )}
                    <span>{leftName}</span>
                  </div>
                  {isLeftServing && (
                    <span
                      style={{
                        background: '#EF4444',
                        color: '#FFF',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '10px',
                        fontWeight: '800',
                        letterSpacing: '1px',
                        boxShadow: '0 2px 8px rgba(239, 68, 68, 0.5)',
                      }}
                    >
                      🏐 SERVING
                    </span>
                  )}
                </div>

                {/* Giant Center Points Display */}
                <div
                  style={{
                    fontSize: 'clamp(54px, 13vw, 115px)',
                    fontWeight: '900',
                    color: '#FFFFFF',
                    fontFamily: 'monospace',
                    textShadow: '0 6px 25px rgba(0, 0, 0, 0.75)',
                    userSelect: 'none',
                    lineHeight: 1,
                  }}
                >
                  {leftScore}
                </div>

                {/* Bottom Bar: Sets Won & Timeouts */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.75)',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    backdropFilter: 'blur(6px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#93C5FD' }}>
                    SETS: <strong style={{ color: '#FFF', fontSize: '13px' }}>{leftSetsWon}</strong>/{setsToWin}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', pointerEvents: 'auto' }}>
                    <span style={{ fontSize: '10px', color: '#CBD5E1', marginRight: 2 }}>T/O:</span>
                    {[1, 2].map(num => (
                      <div
                        key={num}
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: num <= leftTimeouts ? '#EF4444' : 'rgba(255,255,255,0.3)',
                        }}
                      />
                    ))}
                    <button
                      disabled={leftTimeouts >= 2 || !matchStarted || isMatchComplete}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCallTimeout(leftTeamKey);
                      }}
                      style={{
                        marginLeft: '6px',
                        background: 'rgba(239, 68, 68, 0.25)',
                        border: '1px solid rgba(239, 68, 68, 0.5)',
                        color: '#FCA5A5',
                        borderRadius: '4px',
                        padding: '1px 6px',
                        fontSize: '10px',
                        fontWeight: '700',
                        cursor: leftTimeouts < 2 ? 'pointer' : 'not-allowed',
                      }}
                    >
                      T/O
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Right Half Court Surface - Dynamically swaps team 2 or team 1 based on sidesSwapped */}
          {(() => {
            const rightTeamKey: 'player1' | 'player2' = !sidesSwapped ? 'player2' : 'player1';
            const rightName = !sidesSwapped ? match.player2_name : match.player1_name;
            const rightScore = !sidesSwapped ? currentSet.player2_score : currentSet.player1_score;
            const rightSetsWon = !sidesSwapped ? p2SetsWon : p1SetsWon;
            const rightTimeouts = !sidesSwapped ? timeoutsP2 : timeoutsP1;
            const isRightServing = servingTeam === rightTeamKey;
            const rightThemeColor = rightTeamKey === 'player2' ? '#10B981' : '#2563EB';

            return (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  right: 0,
                  width: '50%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  boxSizing: 'border-box',
                  zIndex: 10,
                  pointerEvents: 'none',
                }}
              >
                {/* Top Bar: Team Name + Serving Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'flex-end' }}>
                  {isRightServing && (
                    <span
                      style={{
                        background: '#EF4444',
                        color: '#FFF',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '10px',
                        fontWeight: '800',
                        letterSpacing: '1px',
                        boxShadow: '0 2px 8px rgba(239, 68, 68, 0.5)',
                      }}
                    >
                      🏐 SERVING
                    </span>
                  )}
                  <div
                    style={{
                      background: isRightServing ? rightThemeColor : 'rgba(15, 23, 42, 0.85)',
                      color: '#FFFFFF',
                      padding: '4px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '800',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                      backdropFilter: 'blur(6px)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span>{rightName}</span>
                    {getTeamLogo(rightName) && (
                      <img
                        src={getTeamLogo(rightName)!}
                        alt={rightName}
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 4,
                          objectFit: 'cover',
                          border: '1px solid rgba(255,255,255,0.5)',
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* Giant Center Points Display */}
                <div
                  style={{
                    fontSize: 'clamp(54px, 13vw, 115px)',
                    fontWeight: '900',
                    color: '#FFFFFF',
                    fontFamily: 'monospace',
                    textShadow: '0 6px 25px rgba(0, 0, 0, 0.75)',
                    userSelect: 'none',
                    lineHeight: 1,
                  }}
                >
                  {rightScore}
                </div>

                {/* Bottom Bar: Sets Won & Timeouts */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.75)',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    backdropFilter: 'blur(6px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', pointerEvents: 'auto' }}>
                    <button
                      disabled={rightTimeouts >= 2 || !matchStarted || isMatchComplete}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCallTimeout(rightTeamKey);
                      }}
                      style={{
                        marginRight: '6px',
                        background: 'rgba(239, 68, 68, 0.25)',
                        border: '1px solid rgba(239, 68, 68, 0.5)',
                        color: '#FCA5A5',
                        borderRadius: '4px',
                        padding: '1px 6px',
                        fontSize: '10px',
                        fontWeight: '700',
                        cursor: rightTimeouts < 2 ? 'pointer' : 'not-allowed',
                      }}
                    >
                      T/O
                    </button>
                    <span style={{ fontSize: '10px', color: '#CBD5E1' }}>T/O:</span>
                    {[1, 2].map(num => (
                      <div
                        key={num}
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: num <= rightTimeouts ? '#EF4444' : 'rgba(255,255,255,0.3)',
                        }}
                      />
                    ))}
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#93C5FD' }}>
                    SETS: <strong style={{ color: '#FFF', fontSize: '13px' }}>{rightSetsWon}</strong>/{setsToWin}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Quick Point Tap Overlay - Left Court */}
          <button
            onClick={() => handleAddPoint(!sidesSwapped ? 'player1' : 'player2', 'quick')}
            disabled={!matchStarted || isMatchComplete || isPaused || currentSet.is_complete}
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              width: '50%',
              background: 'transparent',
              border: 'none',
              cursor: !matchStarted || isMatchComplete || isPaused || currentSet.is_complete ? 'default' : 'pointer',
              zIndex: 8,
              touchAction: 'manipulation',
            }}
            title={`Tap left side to quickly award +1 point to ${!sidesSwapped ? match.player1_name : match.player2_name}`}
          />

          {/* Quick Point Tap Overlay - Right Court */}
          <button
            onClick={() => handleAddPoint(!sidesSwapped ? 'player2' : 'player1', 'quick')}
            disabled={!matchStarted || isMatchComplete || isPaused || currentSet.is_complete}
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              right: 0,
              width: '50%',
              background: 'transparent',
              border: 'none',
              cursor: !matchStarted || isMatchComplete || isPaused || currentSet.is_complete ? 'default' : 'pointer',
              zIndex: 8,
              touchAction: 'manipulation',
            }}
            title={`Tap right side to quickly award +1 point to ${!sidesSwapped ? match.player2_name : match.player1_name}`}
          />

          {/* Set Completed Banner / Advance to Next Set Overlay */}
          {currentSet.is_complete && !isMatchComplete && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(15, 23, 42, 0.92)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 35,
                padding: '20px',
                textAlign: 'center',
                gap: 16,
              }}
            >
              <div style={{ fontSize: 36 }}>🎉</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#FACC15', letterSpacing: '0.5px' }}>
                SET {currentSet.set_number} COMPLETE!
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF' }}>
                Winner: <span style={{ color: currentSet.winner_id === 'player1' ? '#60A5FA' : '#34D399' }}>
                  {currentSet.winner_id === 'player1' ? match.player1_name : match.player2_name}
                </span>{' '}
                ({currentSet.player1_score} - {currentSet.player2_score})
              </div>
              <div style={{ fontSize: 13, color: '#94A3B8', maxWidth: 380 }}>
                Sets Score: <strong style={{ color: '#FFF' }}>{p1SetsWon}</strong> ({match.player1_name}) vs{' '}
                <strong style={{ color: '#FFF' }}>{p2SetsWon}</strong> ({match.player2_name})
              </div>

              {currentSetIdx < sets.length - 1 && (
                <button
                  onClick={() => {
                    // Advance to next set by switching teams / resetting state for next set
                    const nextSetNum = currentSetIdx + 2;
                    const nextServing = currentSet.winner_id === 'player1' ? 'player1' : 'player2';
                    setServingTeam(nextServing);
                    // Rotate court sides if desired or maintain
                    saveStateToDB(sets, 'running', undefined, nextServing, 0, 0);
                  }}
                  style={{
                    marginTop: 8,
                    padding: '12px 28px',
                    borderRadius: '10px',
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                    color: '#FFFFFF',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 15,
                    boxShadow: '0 4px 16px rgba(37, 99, 235, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  ▶ Start Set {currentSetIdx + 2}
                </button>
              )}
            </div>
          )}

          {/* Match Concluded Celebration Overlay on Court */}
          {isMatchComplete && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(15, 23, 42, 0.94)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 38,
                padding: '24px',
                textAlign: 'center',
                gap: 16,
              }}
            >
              <div style={{ fontSize: 44 }}>🏆</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#38BDF8', letterSpacing: '0.5px' }}>
                MATCH CONCLUDED!
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF' }}>
                Match Winner:{' '}
                <span style={{ color: p1SetsWon >= setsToWin ? '#60A5FA' : '#34D399' }}>
                  {p1SetsWon >= setsToWin ? match.player1_name : match.player2_name}
                </span>{' '}
                ({p1SetsWon} - {p2SetsWon} Sets)
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                {sets.filter(s => s.is_complete).map(s => (
                  <span
                    key={s.set_number}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 6,
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      fontFamily: 'monospace',
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    Set {s.set_number}: {s.player1_score}-{s.player2_score}
                  </span>
                ))}
              </div>
              <button
                onClick={() => setShowEndMatchModal(true)}
                style={{
                  marginTop: 10,
                  padding: '10px 24px',
                  borderRadius: '10px',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  color: '#FFFFFF',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 14,
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                }}
              >
                🏁 View / Finalize Result
              </button>
            </div>
          )}

          {/* Paused Overlay on Court */}
          {isPaused && !isMatchComplete && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(15, 23, 42, 0.88)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 40,
                gap: 14,
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 800, color: '#FACC15', letterSpacing: '0.5px' }}>
                ⏸ VOLLEYBALL MATCH PAUSED
              </div>
              <button
                onClick={() => {
                  setIsPaused(false);
                  saveStateToDB(sets, 'running', undefined, undefined, undefined, undefined, matchElapsed);
                }}
                style={{
                  padding: '10px 24px',
                  borderRadius: '10px',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  color: '#FFFFFF',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 14,
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                }}
              >
                ▶ Resume Play
              </button>
            </div>
          )}
        </div>

        {/* Mobile Team Attribution Switcher Tabs */}
        <div className="vb-mobile-team-tabs">
          <button
            type="button"
            className={`vb-mobile-team-tab ${mobileAttributionTab === 'player1' ? 'active-t1' : ''}`}
            onClick={() => setMobileAttributionTab('player1')}
          >
            🔵 {match.player1_name} Reason
          </button>
          <button
            type="button"
            className={`vb-mobile-team-tab ${mobileAttributionTab === 'player2' ? 'active-t2' : ''}`}
            onClick={() => setMobileAttributionTab('player2')}
          >
            🟢 {match.player2_name} Reason
          </button>
        </div>

        {/* FIVB POINT CATEGORY ATTRIBUTION CONSOLE */}
        <div
          className="vb-attribution-console"
          style={{
            width: '100%',
            maxWidth: isScoringFullscreen ? '94vw' : '100%',
            marginTop: '10px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
          }}
        >
          {/* Team 1 Point Options */}
          <div
            className={`vb-team1-panel ${mobileAttributionTab === 'player1' ? 'vb-tab-visible' : 'vb-tab-hidden'}`}
            style={{
              background: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '12px',
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#93C5FD' }}>
                +{match.player1_name} Point Reason:
              </span>
              <button
                onClick={() => handleAddPoint('player1', 'quick')}
                disabled={!matchStarted || isMatchComplete || isPaused || currentSet.is_complete}
                style={{
                  background: '#2563EB',
                  border: 'none',
                  color: '#FFFFFF',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                +1 Quick
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              <button
                onClick={() => handleAddPoint('player1', 'attack')}
                disabled={!matchStarted || isMatchComplete || isPaused || currentSet.is_complete}
                style={{
                  flex: '1 1 45%',
                  background: 'rgba(37, 99, 235, 0.2)',
                  border: '1px solid rgba(37, 99, 235, 0.4)',
                  color: '#BFDBFE',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                💥 Spike / Attack Kill
              </button>
              <button
                onClick={() => handleAddPoint('player1', 'block')}
                disabled={!matchStarted || isMatchComplete || isPaused || currentSet.is_complete}
                style={{
                  flex: '1 1 45%',
                  background: 'rgba(37, 99, 235, 0.2)',
                  border: '1px solid rgba(37, 99, 235, 0.4)',
                  color: '#BFDBFE',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                🛡️ Stuff Block Kill
              </button>
              <button
                onClick={() => handleAddPoint('player1', 'ace')}
                disabled={!matchStarted || isMatchComplete || isPaused || currentSet.is_complete}
                style={{
                  flex: '1 1 45%',
                  background: 'rgba(37, 99, 235, 0.2)',
                  border: '1px solid rgba(37, 99, 235, 0.4)',
                  color: '#BFDBFE',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                ⚡ Service Ace
              </button>
              <button
                onClick={() => handleAddPoint('player1', 'opp_attack_out')}
                disabled={!matchStarted || isMatchComplete || isPaused || currentSet.is_complete}
                style={{
                  flex: '1 1 45%',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#FCA5A5',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                🚫 Opp Hit Out / Wide
              </button>
              <button
                onClick={() => handleAddPoint('player1', 'opp_net_fault')}
                disabled={!matchStarted || isMatchComplete || isPaused || currentSet.is_complete}
                style={{
                  flex: '1 1 45%',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#FCA5A5',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                ⚠️ Opp Net Touch / Fault
              </button>
              <button
                onClick={() => handleAddPoint('player1', 'opp_service_err')}
                disabled={!matchStarted || isMatchComplete || isPaused || currentSet.is_complete}
                style={{
                  flex: '1 1 45%',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#FCA5A5',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                ❌ Opp Serve In Net/Out
              </button>
            </div>
          </div>

          {/* Team 2 Point Options */}
          <div
            className={`vb-team2-panel ${mobileAttributionTab === 'player2' ? 'vb-tab-visible' : 'vb-tab-hidden'}`}
            style={{
              background: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#6EE7B7' }}>
                +{match.player2_name} Point Reason:
              </span>
              <button
                onClick={() => handleAddPoint('player2', 'quick')}
                disabled={!matchStarted || isMatchComplete || isPaused || currentSet.is_complete}
                style={{
                  background: '#10B981',
                  border: 'none',
                  color: '#FFFFFF',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                +1 Quick
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              <button
                onClick={() => handleAddPoint('player2', 'attack')}
                disabled={!matchStarted || isMatchComplete || isPaused || currentSet.is_complete}
                style={{
                  flex: '1 1 45%',
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  color: '#A7F3D0',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                💥 Spike / Attack Kill
              </button>
              <button
                onClick={() => handleAddPoint('player2', 'block')}
                disabled={!matchStarted || isMatchComplete || isPaused || currentSet.is_complete}
                style={{
                  flex: '1 1 45%',
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  color: '#A7F3D0',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                🛡️ Stuff Block Kill
              </button>
              <button
                onClick={() => handleAddPoint('player2', 'ace')}
                disabled={!matchStarted || isMatchComplete || isPaused || currentSet.is_complete}
                style={{
                  flex: '1 1 45%',
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  color: '#A7F3D0',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                ⚡ Service Ace
              </button>
              <button
                onClick={() => handleAddPoint('player2', 'opp_attack_out')}
                disabled={!matchStarted || isMatchComplete || isPaused || currentSet.is_complete}
                style={{
                  flex: '1 1 45%',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#FCA5A5',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                🚫 Opp Hit Out / Wide
              </button>
              <button
                onClick={() => handleAddPoint('player2', 'opp_net_fault')}
                disabled={!matchStarted || isMatchComplete || isPaused || currentSet.is_complete}
                style={{
                  flex: '1 1 45%',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#FCA5A5',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                ⚠️ Opp Net Touch / Fault
              </button>
              <button
                onClick={() => handleAddPoint('player2', 'opp_service_err')}
                disabled={!matchStarted || isMatchComplete || isPaused || currentSet.is_complete}
                style={{
                  flex: '1 1 45%',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#FCA5A5',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                ❌ Opp Serve In Net/Out
              </button>
            </div>
          </div>
        </div>

        {/* Set Scores Bar & Undo Point Strip underneath court */}
        <div
          className="vb-sets-undo-strip"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            maxWidth: isScoringFullscreen ? '94vw' : '100%',
            marginTop: '12px',
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '8px 16px',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {/* Sets summary badges */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8' }}>SETS:</span>
            {sets.map((s, idx) => (
              <span
                key={s.set_number}
                style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: idx === currentSetIdx ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255,255,255,0.05)',
                  border: idx === currentSetIdx ? '1px solid #3B82F6' : '1px solid rgba(255,255,255,0.1)',
                  color: idx === currentSetIdx ? '#93C5FD' : '#E2E8F0',
                  fontWeight: idx === currentSetIdx ? '800' : '600',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                }}
              >
                S{s.set_number}: {s.player1_score}-{s.player2_score}
                {s.is_complete ? '✓' : ''}
              </span>
            ))}
          </div>

          {/* Quick Undo & Manual Rotate buttons */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={() => setShowStatsModal(true)}
              style={{
                background: 'rgba(147, 51, 234, 0.15)',
                border: '1px solid rgba(147, 51, 234, 0.3)',
                color: '#C084FC',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              📊 Match Stats
            </button>
            <button
              onClick={handleUndo}
              disabled={history.length === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: history.length > 0 ? 'rgba(234, 179, 8, 0.15)' : 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(234, 179, 8, 0.3)',
                color: history.length > 0 ? '#FDE047' : '#64748B',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: history.length > 0 ? 'pointer' : 'not-allowed',
              }}
            >
              <IconUndo size={13} /> Undo Point
            </button>
            <button
              onClick={() => {
                const nextRot1 = rotateTeamLineup(rotationP1);
                setRotationP1(nextRot1);
                saveStateToDB(sets, undefined, undefined, servingTeam, timeoutsP1, timeoutsP2, undefined, statsP1, statsP2, nextRot1, rotationP2);
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#E2E8F0',
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
              title="Manually rotate Team 1 positions"
            >
              🔄 Rot T1
            </button>
            <button
              onClick={() => {
                const nextRot2 = rotateTeamLineup(rotationP2);
                setRotationP2(nextRot2);
                saveStateToDB(sets, undefined, undefined, servingTeam, timeoutsP1, timeoutsP2, undefined, statsP1, statsP2, rotationP1, nextRot2);
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#E2E8F0',
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
              title="Manually rotate Team 2 positions"
            >
              🔄 Rot T2
            </button>
            <button
              onClick={() => setServingTeam(prev => (prev === 'player1' ? 'player2' : 'player1'))}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#E2E8F0',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              ⇄ Change Serve
            </button>
          </div>
        </div>
      </div>


      {/* Bottom Controls Bar */}
      <div
        className="vb-bottom-bar"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '16px',
          paddingTop: '12px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => setServingTeam(prev => (prev === 'player1' ? 'player2' : 'player1'))}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#E2E8F0',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            ⇄ Switch Server
          </button>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94A3B8' }}>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
            />
            Sound
          </label>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {!matchStarted && (
            <button
              onClick={() => {
                setMatchStarted(true);
                saveStateToDB(sets, 'running');
              }}
              style={{
                background: '#10B981',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 20px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              ▶ Start Match
            </button>
          )}

          {matchStarted && !isMatchComplete && (
            <button
              onClick={() => {
                const nextPaused = !isPaused;
                setIsPaused(nextPaused);
                saveStateToDB(sets, nextPaused ? 'paused' : 'running', undefined, undefined, undefined, undefined, matchElapsed);
              }}
              style={{
                background: isPaused ? '#10B981' : '#F59E0B',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              {isPaused ? '▶ Resume' : '⏸ Pause'}
            </button>
          )}

          <button
            onClick={() => setShowEndMatchModal(true)}
            style={{
              background: isMatchComplete ? '#3B82F6' : 'rgba(239, 68, 68, 0.2)',
              border: isMatchComplete ? 'none' : '1px solid rgba(239, 68, 68, 0.4)',
              color: isMatchComplete ? '#FFFFFF' : '#FCA5A5',
              borderRadius: '8px',
              padding: '8px 20px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            {isMatchComplete ? '🏆 Complete Match' : 'Conclude Match'}
          </button>
        </div>
      </div>

      {/* Format Configuration Modal */}
      {showConfigModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: '#0F172A',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '16px',
              padding: '24px',
              width: '90%',
              maxWidth: '420px',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>
              Volleyball Set & Point Settings
            </h3>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>
                Match Set Format
              </label>
              <select
                value={matchFormat}
                onChange={(e) => setMatchFormat(e.target.value as any)}
                style={{
                  width: '100%',
                  background: '#1E293B',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#F8FAFC',
                  borderRadius: '8px',
                  padding: '8px 12px',
                }}
              >
                <option value="best_of_3">Best of 3 Sets (Win 2 sets to win)</option>
                <option value="best_of_5">Best of 5 Sets (Win 3 sets to win)</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>
                  Standard Set Points
                </label>
                <input
                  type="number"
                  value={standardSetPoints}
                  onChange={(e) => setStandardSetPoints(parseInt(e.target.value) || 25)}
                  style={{
                    width: '100%',
                    background: '#1E293B',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#F8FAFC',
                    borderRadius: '8px',
                    padding: '8px 12px',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>
                  Decider Set Points
                </label>
                <input
                  type="number"
                  value={decidingSetPoints}
                  onChange={(e) => setDecidingSetPoints(parseInt(e.target.value) || 15)}
                  style={{
                    width: '100%',
                    background: '#1E293B',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#F8FAFC',
                    borderRadius: '8px',
                    padding: '8px 12px',
                  }}
                />
              </div>
            </div>

            <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '16px' }}>
              Note: Volleyball sets must be won by at least 2 points with no maximum ceiling cap.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setShowConfigModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: 'none',
                  color: '#94A3B8',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfigModal(false);
                  saveStateToDB(sets);
                }}
                style={{
                  background: '#3B82F6',
                  border: 'none',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Save Format
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Match Confirmation Modal */}
      {showEndMatchModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: '#0F172A',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '16px',
              padding: '24px',
              width: '90%',
              maxWidth: '420px',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>
              Conclude Volleyball Match
            </h3>
            
            {/* If neither team has naturally won required sets */}
            {p1SetsWon < setsToWin && p2SetsWon < setsToWin && (
              <div style={{
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '10px',
                padding: '12px',
                marginBottom: '16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#FBBF24', fontSize: '13px', fontWeight: 600, marginBottom: 8 }}>
                  ⚠️ Early Match Conclusion ({setsToWin} sets required to win)
                </div>
                <label style={{ display: 'block', fontSize: '12px', color: '#CBD5E1', marginBottom: '6px' }}>
                  Select Reason for Early Conclusion:
                </label>
                <select
                  value={earlyConcludeReason}
                  onChange={e => setEarlyConcludeReason(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    padding: '8px 10px',
                    fontSize: '13px',
                    marginBottom: earlyConcludeReason === 'Other' ? '8px' : '0',
                    outline: 'none',
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
                      background: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#F8FAFC',
                      padding: '8px 10px',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                )}
              </div>
            )}

            <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '16px' }}>
              Select the final match winner to mark this match completed:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <button
                onClick={() => {
                  const isEarly = p1SetsWon < setsToWin && p2SetsWon < setsToWin;
                  const effectiveReason = isEarly 
                    ? (earlyConcludeReason === 'Other' ? (customEarlyConcludeReason.trim() || 'Other') : earlyConcludeReason)
                    : undefined;
                  setShowEndMatchModal(false);
                  saveStateToDB(sets, 'completed', match.player1_id, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, effectiveReason);
                }}
                style={{
                  background: 'rgba(59, 130, 246, 0.2)',
                  border: '1px solid #3B82F6',
                  color: '#60A5FA',
                  padding: '12px',
                  borderRadius: '10px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                🏆 Winner: {match.player1_name} ({p1SetsWon} Sets)
              </button>

              <button
                onClick={() => {
                  const isEarly = p1SetsWon < setsToWin && p2SetsWon < setsToWin;
                  const effectiveReason = isEarly 
                    ? (earlyConcludeReason === 'Other' ? (customEarlyConcludeReason.trim() || 'Other') : earlyConcludeReason)
                    : undefined;
                  setShowEndMatchModal(false);
                  saveStateToDB(sets, 'completed', match.player2_id, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, effectiveReason);
                }}
                style={{
                  background: 'rgba(59, 130, 246, 0.2)',
                  border: '1px solid #3B82F6',
                  color: '#60A5FA',
                  padding: '12px',
                  borderRadius: '10px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                🏆 Winner: {match.player2_name} ({p2SetsWon} Sets)
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowEndMatchModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: 'none',
                  color: '#94A3B8',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                }}
              >
                Back to Scoring
              </button>
            </div>
          </div>
        </div>
      )}

      {showMediaModal && (
        <MatchMediaModal
          match={match}
          onClose={() => setShowMediaModal(false)}
        />
      )}

      {/* Match Stats Modal */}
      {showStatsModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: '#0F172A',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '16px',
              padding: '24px',
              width: '90%',
              maxWidth: '480px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#FFFFFF', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                📊 Volleyball Match Statistics
              </h3>
              <button
                onClick={() => setShowStatsModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  fontSize: '18px',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ textAlign: 'center', fontWeight: '800', color: '#60A5FA', fontSize: '13px' }}>
                {match.player1_name}
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Metric
              </div>
              <div style={{ textAlign: 'center', fontWeight: '800', color: '#34D399', fontSize: '13px' }}>
                {match.player2_name}
              </div>

              {[
                { label: '💥 Spike / Attack Kills', p1: statsP1.attacks, p2: statsP2.attacks },
                { label: '🛡️ Stuff Blocks', p1: statsP1.blocks, p2: statsP2.blocks },
                { label: '⚡ Service Aces', p1: statsP1.aces, p2: statsP2.aces },
                { label: '🎁 Opponent Errors', p1: statsP1.opponent_errors, p2: statsP2.opponent_errors },
              ].map((stat, idx) => (
                <React.Fragment key={idx}>
                  <div
                    style={{
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                      padding: '8px',
                      borderRadius: '8px',
                      textAlign: 'center',
                      fontSize: '16px',
                      fontWeight: '800',
                      color: '#93C5FD',
                    }}
                  >
                    {stat.p1}
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: '700', color: '#CBD5E1', padding: '0 8px' }}>
                    {stat.label}
                  </div>
                  <div
                    style={{
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      padding: '8px',
                      borderRadius: '8px',
                      textAlign: 'center',
                      fontSize: '16px',
                      fontWeight: '800',
                      color: '#6EE7B7',
                    }}
                  >
                    {stat.p2}
                  </div>
                </React.Fragment>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                onClick={() => setShowStatsModal(false)}
                style={{
                  background: '#2563EB',
                  border: 'none',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  padding: '8px 20px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Responsive Mobile Styles */}
      <style jsx>{`
        .vb-mobile-team-tabs {
          display: none;
          width: 100%;
          gap: 8px;
          margin-top: 8px;
        }
        .vb-mobile-team-tab {
          flex: 1;
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: rgba(15, 23, 42, 0.7);
          color: #94A3B8;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .vb-mobile-team-tab.active-t1 {
          background: rgba(37, 99, 235, 0.25);
          border-color: #3B82F6;
          color: #93C5FD;
        }
        .vb-mobile-team-tab.active-t2 {
          background: rgba(16, 185, 129, 0.25);
          border-color: #10B981;
          color: #6EE7B7;
        }

        @media (max-width: 768px) {
          .vb-scoring-root {
            padding: 8px !important;
            border-radius: 8px !important;
          }
          .vb-header-bar {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 8px !important;
            margin-bottom: 8px !important;
            padding-bottom: 8px !important;
          }
          .vb-court-box {
            border-width: 6px !important;
            outline-width: 3px !important;
            min-height: 220px !important;
            border-radius: 6px !important;
          }
          .vb-mobile-team-tabs {
            display: flex !important;
          }
          .vb-attribution-console {
            grid-template-columns: 1fr !important;
            gap: 8px !important;
          }
          .vb-tab-hidden {
            display: none !important;
          }
          .vb-tab-visible {
            display: flex !important;
          }
          .vb-sets-undo-strip {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 8px !important;
            padding: 8px 10px !important;
          }
          .vb-bottom-bar {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 10px !important;
          }
          .vb-bottom-bar > div {
            justify-content: space-between !important;
            width: 100% !important;
          }
        }

        @media (max-width: 480px) {
          .vb-court-box {
            border-width: 4px !important;
            outline: none !important;
            min-height: 190px !important;
          }
        }
      `}</style>
    </div>
  );
}
