'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Match, TournamentEvent, Tournament, MatchSet } from '@/types';
import { updateMatchScore, logAction } from '@/lib/supabase-service';
import { useAuth } from '@/lib/auth-context';
import {
  isSquashSetComplete,
  SquashMetadata,
  initialSquashMetadata,
  SquashPointType,
  SquashPointStats,
} from '@/lib/sports-rules';
import { IconPlay, IconPause, IconUndo, IconCheck, IconArrowLeft, IconTrophy } from '@/components/icons';
import {
  saveOfflineScorePayload,
  flushAllOfflineScores,
} from '@/lib/offline-scoring';

interface SquashScoringProps {
  match: Match;
  event?: TournamentEvent;
  tournament?: Tournament;
  onScoreUpdated: () => void;
}

export default function SquashScoring({
  match,
  event,
  tournament,
  onScoreUpdated,
}: SquashScoringProps) {
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
  
  // Squash game configs (PAR-11, best of 5)
  const setsToWin = 3;

  // Squash metadata for serve tracking
  const [squashMeta, setSquashMeta] = useState<SquashMetadata>(() => {
    if (match.sport_metadata && typeof match.sport_metadata === 'object' && 'serving_team' in match.sport_metadata) {
      return match.sport_metadata as SquashMetadata;
    }
    return { ...initialSquashMetadata };
  });

  // Timeouts Configuration (Default 2, configurable per set or match)
  const [maxTimeouts, setMaxTimeouts] = useState<number>(squashMeta.max_timeouts ?? 2);
  const [timeoutScope, setTimeoutScope] = useState<'set' | 'match'>(squashMeta.timeout_scope ?? 'set');
  const [timeoutsP1, setTimeoutsP1] = useState<number>(squashMeta.timeouts_p1 ?? 0);
  const [timeoutsP2, setTimeoutsP2] = useState<number>(squashMeta.timeouts_p2 ?? 0);

  // Statistics
  const [statsP1, setStatsP1] = useState<SquashPointStats>(
    squashMeta.stats_p1 || { strokes: 0, kill_shots: 0, nick_winners: 0, opponent_errors: 0 }
  );
  const [statsP2, setStatsP2] = useState<SquashPointStats>(
    squashMeta.stats_p2 || { strokes: 0, kill_shots: 0, nick_winners: 0, opponent_errors: 0 }
  );
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showAttributionSheet, setShowAttributionSheet] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Offline / Network Resilience
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'offline' | 'saved_locally'>('idle');

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      setSyncStatus('syncing');
      try {
        await flushAllOfflineScores();
        setSyncStatus('idle');
      } catch {
        setSyncStatus('saved_locally');
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
  
  // Game states
  const [matchStarted, setMatchStarted] = useState(match.status === 'running' || match.status === 'completed');
  const [isPaused, setIsPaused] = useState(match.status === 'paused');
  const [matchElapsed, setMatchElapsed] = useState(match.duration_seconds || 0);
  const [totalPausedTime, setTotalPausedTime] = useState(squashMeta.total_paused_seconds || 0);
  const [pauseElapsed, setPauseElapsed] = useState(0);
  const [declareWinnerOpen, setDeclareWinnerOpen] = useState(false);
  const [earlyConcludeReason, setEarlyConcludeReason] = useState<string>('Retirement / Medical Injury');
  const [customEarlyConcludeReason, setCustomEarlyConcludeReason] = useState<string>('');
  const [courtSides, setCourtSides] = useState<{ left: 'player1' | 'player2'; right: 'player1' | 'player2' }>({
    left: 'player1',
    right: 'player2',
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pauseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [sets, setSets] = useState<MatchSet[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`matchpoint_offline_score_${match.id}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed.sets) && parsed.sets.length > 0) return parsed.sets;
        }
      } catch {}
    }
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

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrateEnabled, setVibrateEnabled] = useState(true);
  const [selectedCourt, setSelectedCourt] = useState(match.court || 'Squash Court 1');
  
  // Match history tracking for Undo
  const [history, setHistory] = useState<{
    sets: MatchSet[];
    meta: SquashMetadata;
    statsP1: SquashPointStats;
    statsP2: SquashPointStats;
    timeoutsP1: number;
    timeoutsP2: number;
  }[]>([]);

  // Derived sets won
  const p1SetsWon = sets.filter(s => s.is_complete && s.winner_id === match.player1_id).length;
  const p2SetsWon = sets.filter(s => s.is_complete && s.winner_id === match.player2_id).length;
  const isMatchComplete = p1SetsWon >= setsToWin || p2SetsWon >= setsToWin;
  const matchWinnerId = p1SetsWon >= setsToWin ? match.player1_id : (p2SetsWon >= setsToWin ? match.player2_id : null);

  const currentSet = sets[currentSetIdx];
  const p1Score = currentSet?.player1_score ?? 0;
  const p2Score = currentSet?.player2_score ?? 0;

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
    let interval: NodeJS.Timeout | null = null;
    if (isPaused && !isMatchComplete) {
      interval = setInterval(() => {
        setPauseElapsed(prev => prev + 1);
      }, 1000);
    } else {
      setPauseElapsed(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPaused, isMatchComplete]);

  // Timeout call
  const handleCallTimeout = (player: 'player1' | 'player2') => {
    if (player === 'player1' && timeoutsP1 < maxTimeouts) {
      const next = timeoutsP1 + 1;
      setTimeoutsP1(next);
      saveStateToDB(sets, squashMeta, undefined, undefined, undefined, statsP1, statsP2, next, timeoutsP2);
      playBeep(520, 0.15);
    } else if (player === 'player2' && timeoutsP2 < maxTimeouts) {
      const next = timeoutsP2 + 1;
      setTimeoutsP2(next);
      saveStateToDB(sets, squashMeta, undefined, undefined, undefined, statsP1, statsP2, timeoutsP1, next);
      playBeep(520, 0.15);
    }
  };

  // Save changes to database and offline cache
  const saveStateToDB = async (
    updatedSets: MatchSet[],
    updatedMeta: SquashMetadata,
    overrideStatus?: Match['status'],
    overrideWinnerId?: string | null,
    earlyReason?: string,
    overrideStatsP1?: SquashPointStats,
    overrideStatsP2?: SquashPointStats,
    overrideTimeoutsP1?: number,
    overrideTimeoutsP2?: number
  ) => {
    const finalStatus = overrideStatus || (overrideWinnerId || p1SetsWon >= setsToWin || p2SetsWon >= setsToWin ? 'completed' : (isPaused ? 'paused' : 'running'));
    const finalWinner = overrideWinnerId || (p1SetsWon >= setsToWin ? match.player1_id : (p2SetsWon >= setsToWin ? match.player2_id : null));

    const finalMeta: SquashMetadata = {
      ...updatedMeta,
      timeouts_p1: overrideTimeoutsP1 !== undefined ? overrideTimeoutsP1 : timeoutsP1,
      timeouts_p2: overrideTimeoutsP2 !== undefined ? overrideTimeoutsP2 : timeoutsP2,
      max_timeouts: maxTimeouts,
      timeout_scope: timeoutScope,
      stats_p1: overrideStatsP1 || statsP1,
      stats_p2: overrideStatsP2 || statsP2,
      total_paused_seconds: totalPausedTime + pauseElapsed,
      ...(earlyReason ? { early_conclude_reason: earlyReason } : {})
    };

    const actualStartTime = overrideStatus === 'running' && !match.actual_start_time ? new Date().toISOString() : match.actual_start_time;
    const actualEndTime = finalStatus === 'completed' ? new Date().toISOString() : null;

    saveOfflineScorePayload({
      matchId: match.id,
      sets: updatedSets,
      status: finalStatus,
      winnerId: finalWinner,
      actualStartTime,
      actualEndTime,
      court: selectedCourt,
      durationSeconds: matchElapsed,
      sport: 'squash',
      metadata: finalMeta,
      savedAt: new Date().toISOString(),
    });

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
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
        actualStartTime,
        actualEndTime,
        selectedCourt,
        undefined,
        matchElapsed,
        'squash',
        finalMeta
      );
      setSyncStatus('idle');
      onScoreUpdated();
    } catch (err) {
      console.warn('Failed to sync Squash score:', err);
      setSyncStatus('saved_locally');
      onScoreUpdated();
    }
  };

  // Select service box
  const handleSelectBox = (box: 'left' | 'right') => {
    const newMeta: SquashMetadata = {
      ...squashMeta,
      serving_box: box,
    };
    setSquashMeta(newMeta);
    saveStateToDB(sets, newMeta);
    playBeep(600, 0.05);
  };

  // Add Point with optional reason
  const handleAddPoint = (player: 'player1' | 'player2', pointType: SquashPointType = 'quick') => {
    if (!matchStarted || isMatchComplete || isPaused) return;

    // If a service box choice is pending, prevent scoring
    if (squashMeta.serving_box === null) {
      alert("Please select the serving box first.");
      return;
    }

    // Save history for undo
    setHistory(prev => [
      ...prev,
      {
        sets: sets.map(s => ({ ...s })),
        meta: { ...squashMeta },
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
      if (pointType === 'stroke_awarded') nextStatsP1.strokes++;
      else if (pointType === 'kill_shot') nextStatsP1.kill_shots++;
      else if (pointType === 'nick_winner') nextStatsP1.nick_winners++;
      else if (pointType.startsWith('opp_')) nextStatsP1.opponent_errors++;
    } else {
      if (pointType === 'stroke_awarded') nextStatsP2.strokes++;
      else if (pointType === 'kill_shot') nextStatsP2.kill_shots++;
      else if (pointType === 'nick_winner') nextStatsP2.nick_winners++;
      else if (pointType.startsWith('opp_')) nextStatsP2.opponent_errors++;
    }
    setStatsP1(nextStatsP1);
    setStatsP2(nextStatsP2);

    // Calculate next serve metadata:
    let nextServer = squashMeta.serving_team;
    let nextBox: 'left' | 'right' | null = squashMeta.serving_box;
    
    if (player === squashMeta.serving_team) {
      // Server won the rally. Remains server, switches box.
      nextBox = squashMeta.serving_box === 'left' ? 'right' : 'left';
    } else {
      // Receiver won rally (Hand-Out). Service switches, box is reset to null (must choose).
      nextServer = player;
      nextBox = null; 
    }

    const newMeta: SquashMetadata = {
      ...squashMeta,
      serving_team: nextServer,
      serving_box: nextBox,
      last_rally_winner: player,
      last_point_type: pointType,
      last_point_scorer: player,
    };
    setSquashMeta(newMeta);

    const newSets = sets.map((s, idx) => {
      if (idx !== currentSetIdx) return s;
      const updatedSet = { ...s };
      if (player === 'player1') {
        updatedSet.player1_score++;
      } else {
        updatedSet.player2_score++;
      }

      // Check if current set complete (PAR-11, win by 2)
      if (isSquashSetComplete(updatedSet.player1_score, updatedSet.player2_score)) {
        updatedSet.is_complete = true;
        updatedSet.winner_id = updatedSet.player1_score > updatedSet.player2_score ? match.player1_id : match.player2_id;
      }
      return updatedSet;
    });

    // Check set completions
    const updatedSet = newSets[currentSetIdx];
    let finalSets = newSets;
    let nextIdx = currentSetIdx;

    if (updatedSet.is_complete) {
      const p1Wins = newSets.filter(s => s.is_complete && s.winner_id === match.player1_id).length;
      const p2Wins = newSets.filter(s => s.is_complete && s.winner_id === match.player2_id).length;
      
      const matchOver = p1Wins >= setsToWin || p2Wins >= setsToWin;

      if (!matchOver) {
        // Start next set automatically
        nextIdx = currentSetIdx + 1;
        finalSets.push({
          set_number: nextIdx + 1,
          player1_score: 0,
          player2_score: 0,
          is_complete: false,
        });
        
        // Reset server details for next set (needs server choice again)
        newMeta.serving_box = null;
        setTimeout(() => playBeep(520, 0.2), 300);
      } else {
        setTimeout(() => playBeep(1200, 0.4), 300);
      }
    }

    setSets(finalSets);
    setCurrentSetIdx(nextIdx);
    setSquashMeta(newMeta);
    saveStateToDB(finalSets, newMeta);
  };

  // Undo Point
  const handleUndo = () => {
    if (history.length === 0 || isPaused) return;
    
    playBeep(400, 0.1);
    triggerVibrate(60);

    const prev = history[history.length - 1];
    setHistory(prevHistory => prevHistory.slice(0, -1));
    setSets(prev.sets);
    setSquashMeta(prev.meta);
    setStatsP1(prev.statsP1);
    setStatsP2(prev.statsP2);
    setTimeoutsP1(prev.timeoutsP1);
    setTimeoutsP2(prev.timeoutsP2);

    // Find correct active set index
    const activeIdx = prev.sets.findIndex(s => !s.is_complete);
    setCurrentSetIdx(activeIdx === -1 ? prev.sets.length - 1 : activeIdx);
    saveStateToDB(prev.sets, prev.meta, undefined, undefined, undefined, prev.statsP1, prev.statsP2, prev.timeoutsP1, prev.timeoutsP2);
  };

  const handleStartMatch = async () => {
    setMatchStarted(true);
    await saveStateToDB(sets, squashMeta, 'running');
    playBeep(660, 0.15);
    await logAction('Match Started', 'match', `Squash match started: ${match.player1_name} vs ${match.player2_name}`, user ? { id: user.id, name: user.name } : null);
  };

  const handleSwitchSides = () => {
    setCourtSides(prev => ({ left: prev.right, right: prev.left }));
    playBeep();
  };

  const handleDeclareWinner = async (winnerId: string, reason?: string) => {
    setDeclareWinnerOpen(false);
    playBeep(1200, 0.4);
    await saveStateToDB(sets, squashMeta, 'completed', winnerId, reason);
    const reasonText = reason ? ` | Reason: ${reason}` : '';
    await logAction(
      'Match Decided',
      'match',
      `Squash match winner declared early by umpire: ${winnerId === match.player1_id ? match.player1_name : match.player2_name}${reasonText}`,
      user ? { id: user.id, name: user.name } : null
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };


  const leftPlayerName = courtSides.left === 'player1' ? match.player1_name : match.player2_name;
  const rightPlayerName = courtSides.right === 'player1' ? match.player1_name : match.player2_name;
  const leftScore = courtSides.left === 'player1' ? p1Score : p2Score;
  const rightScore = courtSides.right === 'player1' ? p1Score : p2Score;

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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                🎾 Squash · {selectedCourt} {matchStarted && `· ⏱ ${formatTime(matchElapsed - totalPausedTime)}`}
              </span>
              {!isOnline && (
                <span style={{ background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4 }}>
                  OFFLINE
                </span>
              )}
              {syncStatus === 'syncing' && (
                <span style={{ background: '#3b82f6', color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4 }}>
                  SYNCING...
                </span>
              )}
              {syncStatus === 'saved_locally' && (
                <span style={{ background: '#eab308', color: '#000', fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4 }}>
                  SAVED TO DEVICE
                </span>
              )}
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>
              {tournament?.name || 'MatchPoint Tournament'}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button 
              onClick={() => setShowStatsModal(true)}
              style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(147, 51, 234, 0.2)', border: '1px solid rgba(147, 51, 234, 0.4)', color: '#c084fc', fontSize: 12, fontWeight: 700 }}
              title="Match Statistics"
            >
              📊 Stats
            </button>
            <button 
              onClick={() => setShowAttributionSheet(true)}
              style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.4)', color: '#93c5fd', fontSize: 12, fontWeight: 700 }}
              title="Award Rally with Reason"
            >
              ⚡ Reason ▾
            </button>
            <button 
              onClick={() => setShowConfigModal(true)}
              style={{ padding: '6px 10px', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border)', fontSize: 12, fontWeight: 700 }}
              title="Configure Timeouts"
            >
              ⚙️ Timeouts
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

        {/* Set Tracker Indicator */}
        <div style={{
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
            <div style={{ fontSize: 11, color: '#2563eb', fontWeight: 800 }}>
              Sets: {p1SetsWon} · Timeouts: {timeoutsP1}/{maxTimeouts}
            </div>
          </div>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)' }}>vs</div>
          <div style={{ textAlign: 'left', flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700 }}>{match.player2_name}</div>
            <div style={{ fontSize: 11, color: '#10b981', fontWeight: 800 }}>
              Sets: {p2SetsWon} · Timeouts: {timeoutsP2}/{maxTimeouts}
            </div>
          </div>
        </div>

        {/* Serve indicator banner */}
        {matchStarted && !isMatchComplete && (
          <div 
            className={isScoringFullscreen ? 'fullscreen-scorebar' : ''}
            style={{
            textAlign: 'center',
            fontSize: 13,
            fontWeight: 700,
            padding: '8px 12px',
            borderRadius: 8,
            background: squashMeta.serving_team === 'player1' ? 'rgba(37, 99, 235, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            border: `1px solid ${squashMeta.serving_team === 'player1' ? '#2563eb' : '#10b981'}`,
            color: squashMeta.serving_team === 'player1' ? '#1d4ed8' : '#047857',
          }}>
            🎯 Server: <strong>{squashMeta.serving_team === 'player1' ? match.player1_name : match.player2_name}</strong> 
            {squashMeta.serving_box ? ` (serving from ${squashMeta.serving_box.toUpperCase()} box)` : ' (Choice Pending)'}
          </div>
        )}

        {/* Instructions banner when serve box is choice pending */}
        {matchStarted && !isMatchComplete && squashMeta.serving_box === null && (
          <div style={{
            textAlign: 'center',
            fontSize: 12,
            fontWeight: 700,
            color: '#ea580c',
            padding: '6px 12px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(249, 115, 22, 0.15)',
            border: '1px solid rgba(249, 115, 22, 0.35)',
            marginTop: 4,
            animation: 'pulse-text-fade 1.5s infinite',
          }}>
            👉 Tap the flashing orange service box on the court to select the serve side
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes pulse-text-fade {
                0% { opacity: 0.7; }
                50% { opacity: 1; }
                100% { opacity: 0.7; }
              }
            `}} />
          </div>
        )}
      </div>

      {/* 2. BODY CONTENT */}
      {!matchStarted ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <div style={{ fontSize: 48 }}>🎾</div>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center', maxWidth: 280 }}>
            Squash Scoring is set to Best of 5 Games (PAR to 11). Tap start to begin.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 240 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Select initial server</label>
            <select 
              value={squashMeta.serving_team}
              onChange={e => setSquashMeta(prev => ({ ...prev, serving_team: e.target.value as any }))}
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
              <div key={i}>Game {s.set_number}: {s.player1_score} - {s.player2_score} {s.winner_id === match.player1_id ? `(${match.player1_name.charAt(0)})` : `(${match.player2_name.charAt(0)})`}</div>
            ))}
          </div>
        </div>
      ) : (
        <>

          {/* Interactive Squash Court Mat */}
          <div 
            className={isScoringFullscreen ? 'fullscreen-court-container' : ''} 
            style={isScoringFullscreen ? { flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 } : { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}
          >
            <div 
              className={isScoringFullscreen ? 'fullscreen-court' : ''}
              style={{
                position: 'relative',
                width: '100%',
                background: '#A16207', // Reddish-brown / parquet wood court color for squash
                border: '10px solid #A16207',
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
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, border: '2px solid #ef4444', pointerEvents: 'none' }} />
              
              {/* Short line (horizontal line at 45% height) */}
              <div style={{ position: 'absolute', top: '45%', left: 0, right: 0, height: '2px', background: '#ef4444', pointerEvents: 'none' }} />

              {/* Half-court line (vertical line from short line to back wall) */}
              <div style={{ position: 'absolute', top: '45%', bottom: 0, left: '50%', width: '2px', background: '#ef4444', pointerEvents: 'none' }} />

              {/* Service boxes: Left and Right */}
              {/* Left service box (approx 35% to 50% left, 20% to 45% height) */}
              <button
                onClick={() => handleSelectBox('left')}
                disabled={!matchStarted || isMatchComplete || isPaused || squashMeta.serving_box !== null}
                style={{
                  position: 'absolute', top: '20%', height: '25%', left: '35%', width: '15%',
                  background: squashMeta.serving_box === 'left' 
                    ? 'rgba(239, 68, 68, 0.2)' 
                    : (squashMeta.serving_box === null && squashMeta.serving_team === courtSides.left ? 'rgba(249, 115, 22, 0.25)' : 'transparent'),
                  border: `2px ${squashMeta.serving_box === null && squashMeta.serving_team === courtSides.left ? 'dashed' : 'solid'} #ef4444`,
                  cursor: squashMeta.serving_box === null ? 'pointer' : 'default',
                  zIndex: 20, animation: squashMeta.serving_box === null && squashMeta.serving_team === courtSides.left ? 'pulse-border 1s infinite' : 'none'
                }}
              />

              {/* Right service box (approx 50% to 65% right, 20% to 45% height) */}
              <button
                onClick={() => handleSelectBox('right')}
                disabled={!matchStarted || isMatchComplete || isPaused || squashMeta.serving_box !== null}
                style={{
                  position: 'absolute', top: '20%', height: '25%', left: '50%', width: '15%',
                  background: squashMeta.serving_box === 'right' 
                    ? 'rgba(16, 185, 129, 0.2)' 
                    : (squashMeta.serving_box === null && squashMeta.serving_team === courtSides.right ? 'rgba(249, 115, 22, 0.25)' : 'transparent'),
                  border: `2px ${squashMeta.serving_box === null && squashMeta.serving_team === courtSides.right ? 'dashed' : 'solid'} #ef4444`,
                  cursor: squashMeta.serving_box === null ? 'pointer' : 'default',
                  zIndex: 20, animation: squashMeta.serving_box === null && squashMeta.serving_team === courtSides.right ? 'pulse-border 1s infinite' : 'none'
                }}
              />

              {/* Keyframe animation styling */}
              <style dangerouslySetInnerHTML={{__html: `
                @keyframes pulse-border {
                  0% { border-color: #ef4444; background: rgba(249, 115, 22, 0.1); }
                  50% { border-color: #f97316; background: rgba(249, 115, 22, 0.4); }
                  100% { border-color: #ef4444; background: rgba(249, 115, 22, 0.1); }
                }
              `}} />

              {/* Left Side Player Info & Score */}
              <div style={{
                position: 'absolute', top: '50%', bottom: '5%', left: '5%', right: '55%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                pointerEvents: 'none', zIndex: 15,
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase' }}>{leftPlayerName.split(' ')[0]}</span>
                <span style={{ fontSize: 'clamp(24px, 10vh, 54px)', fontWeight: 900, fontFamily: 'monospace', color: '#ffffff', margin: '2px 0' }}>{leftScore}</span>
                {squashMeta.serving_team === courtSides.left && (
                  <span style={{ fontSize: 9, background: '#ef4444', color: '#fff', padding: '1px 5px', borderRadius: 4, fontWeight: 700, letterSpacing: 0.5 }}>SERVING</span>
                )}
              </div>

              {/* Right Side Player Info & Score */}
              <div style={{
                position: 'absolute', top: '50%', bottom: '5%', left: '55%', right: '5%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                pointerEvents: 'none', zIndex: 15,
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase' }}>{rightPlayerName.split(' ')[0]}</span>
                <span style={{ fontSize: 'clamp(24px, 10vh, 54px)', fontWeight: 900, fontFamily: 'monospace', color: '#ffffff', margin: '2px 0' }}>{rightScore}</span>
                {squashMeta.serving_team === courtSides.right && (
                  <span style={{ fontSize: 9, background: '#10b981', color: '#fff', padding: '1px 5px', borderRadius: 4, fontWeight: 700, letterSpacing: 0.5 }}>SERVING</span>
                )}
              </div>

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
                  position: 'absolute', left: 14, bottom: 14,
                  fontSize: 14, fontWeight: 900, color: '#fff',
                  background: 'rgba(37, 99, 235, 0.85)', padding: '4px 10px', borderRadius: 20,
                  pointerEvents: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}>+1 Rally</div>
              </button>

              {/* Left touch target */}
              <button
                onClick={() => handleAddPoint(courtSides.left, 'quick')}
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
                  position: 'absolute', left: 14, bottom: 14,
                  fontSize: 14, fontWeight: 900, color: '#fff',
                  background: 'rgba(37, 99, 235, 0.85)', padding: '6px 12px', borderRadius: 20,
                  pointerEvents: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}>+1 TAP</div>
              </button>

              {/* Right touch target */}
              <button
                onClick={() => handleAddPoint(courtSides.right, 'quick')}
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
                  position: 'absolute', right: 14, bottom: 14,
                  fontSize: 14, fontWeight: 900, color: '#fff',
                  background: 'rgba(16, 185, 129, 0.85)', padding: '6px 12px', borderRadius: 20,
                  pointerEvents: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}>+1 TAP</div>
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
                  <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'monospace', color: '#FDE047' }}>
                    Break Stopwatch: {formatTime(pauseElapsed)}
                  </div>
                  <button
                    onClick={() => {
                      setIsPaused(false);
                      setTotalPausedTime(prev => prev + pauseElapsed);
                      saveStateToDB(sets, squashMeta, 'running');
                    }}
                    className="btn btn-primary"
                    style={{
                      padding: '10px 24px', borderRadius: 'var(--radius-md)', fontWeight: 700,
                      background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)', color: '#000000', border: 'none'
                    }}
                  >
                    ▶ Resume Match
                  </button>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Total Paused Time: {formatTime(totalPausedTime + pauseElapsed)}
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
            background: 'rgba(234, 88, 12, 0.1)',
            border: '1px solid rgba(234, 88, 12, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 12px',
            marginTop: 8,
            gap: 8,
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#f97316', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                ⚡ Rally Reason:
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
                onClick={() => handleAddPoint('player1', 'kill_shot')}
                disabled={!matchStarted || isMatchComplete || isPaused}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: 11, padding: '4px 8px', height: 28, fontWeight: 700, color: '#2563eb' }}
                title={`Kill Shot Winner for ${match.player1_name}`}
              >
                ⚡ Kill L
              </button>
              <button
                onClick={() => handleAddPoint('player1', 'stroke_awarded')}
                disabled={!matchStarted || isMatchComplete || isPaused}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: 11, padding: '4px 8px', height: 28, fontWeight: 700, color: '#2563eb' }}
                title={`Stroke Awarded for ${match.player1_name}`}
              >
                🔴 Stroke L
              </button>
              <button
                onClick={() => handleAddPoint('player2', 'kill_shot')}
                disabled={!matchStarted || isMatchComplete || isPaused}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: 11, padding: '4px 8px', height: 28, fontWeight: 700, color: '#10b981' }}
                title={`Kill Shot Winner for ${match.player2_name}`}
              >
                ⚡ Kill R
              </button>
              <button
                onClick={() => handleAddPoint('player2', 'stroke_awarded')}
                disabled={!matchStarted || isMatchComplete || isPaused}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: 11, padding: '4px 8px', height: 28, fontWeight: 700, color: '#10b981' }}
                title={`Stroke Awarded for ${match.player2_name}`}
              >
                🔴 Stroke R
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
                minWidth: '110px'
              }}
            >
              <IconUndo size={14} /> Undo Rally
            </button>
            <button 
              onClick={() => {
                const nextPause = !isPaused;
                setIsPaused(nextPause);
                if (!nextPause) {
                  setTotalPausedTime(prev => prev + pauseElapsed);
                }
                saveStateToDB(sets, squashMeta, nextPause ? 'paused' : 'running');
              }}
              className="btn"
              style={{
                flex: 1, height: 48, 
                background: isPaused ? 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)' : 'var(--bg-secondary)',
                border: isPaused ? 'none' : '1px solid var(--border)',
                color: isPaused ? '#000000' : 'var(--text-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, fontWeight: 700,
                minWidth: '110px'
              }}
            >
              {isPaused ? <IconPlay size={14} /> : <IconPause size={14} />} {isPaused ? `Resume (${formatTime(pauseElapsed)})` : 'Pause'}
            </button>
            <button 
              onClick={handleSwitchSides}
              className="btn"
              style={{
                flex: 1, height: 48, background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, fontWeight: 700,
                minWidth: '110px'
              }}
            >
              🔄 Swap Sides
            </button>
            {/* Timeouts */}
            <button
              onClick={() => handleCallTimeout(courtSides.left)}
              disabled={isPaused || (courtSides.left === 'player1' ? timeoutsP1 >= maxTimeouts : timeoutsP2 >= maxTimeouts)}
              className="btn"
              style={{
                flex: 1, height: 48, background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 12, fontWeight: 700,
                minWidth: '110px'
              }}
              title="Call Timeout for Left Team"
            >
              ⏱ TO L ({courtSides.left === 'player1' ? timeoutsP1 : timeoutsP2}/{maxTimeouts})
            </button>
            <button
              onClick={() => handleCallTimeout(courtSides.right)}
              disabled={isPaused || (courtSides.right === 'player1' ? timeoutsP1 >= maxTimeouts : timeoutsP2 >= maxTimeouts)}
              className="btn"
              style={{
                flex: 1, height: 48, background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 12, fontWeight: 700,
                minWidth: '110px'
              }}
              title="Call Timeout for Right Team"
            >
              ⏱ TO R ({courtSides.right === 'player1' ? timeoutsP1 : timeoutsP2}/{maxTimeouts})
            </button>
            <div className={isScoringFullscreen ? "fullscreen-declare-winner" : ""} style={{ flex: 1, minWidth: '110px' }}>
              <button 
                onClick={() => setDeclareWinnerOpen(true)}
                className="btn"
                style={{
                  width: '100%', height: 48, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, fontWeight: 700,
                  minWidth: '110px'
                }}
              >
                <IconTrophy size={14} /> Winner
              </button>
            </div>
          </div>
        </>
      )}

      {/* Completed Sets footer */}
      {sets.length > 1 && !isScoringFullscreen && (
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
            s.is_complete && (
              <span key={idx} style={{ background: 'var(--bg-secondary)', padding: '4px 8px', borderRadius: 4 }}>
                Game {s.set_number}: <strong>{s.player1_score}-{s.player2_score}</strong>
              </span>
            )
          ))}
        </div>
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
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>📊 Squash Statistics</h3>
              <button onClick={() => setShowStatsModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center', marginBottom: 16 }}>
              <div style={{ textAlign: 'center', fontWeight: 800, color: '#2563eb', fontSize: 13 }}>{match.player1_name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Metric</div>
              <div style={{ textAlign: 'center', fontWeight: 800, color: '#10b981', fontSize: 13 }}>{match.player2_name}</div>

              {[
                { label: 'Strokes Awarded', p1: statsP1.strokes, p2: statsP2.strokes },
                { label: 'Kill Shots', p1: statsP1.kill_shots, p2: statsP2.kill_shots },
                { label: 'Nick Winners', p1: statsP1.nick_winners, p2: statsP2.nick_winners },
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
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>⚡ Award Squash Rally with Reason</h3>
              <button onClick={() => setShowAttributionSheet(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {/* Player 1 Options */}
              <div style={{ background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontWeight: 800, color: '#2563eb', fontSize: 13, marginBottom: 4 }}>🔵 {match.player1_name}</div>
                <button onClick={() => { handleAddPoint('player1', 'stroke_awarded'); setShowAttributionSheet(false); }} className="btn" style={{ fontSize: 11, textAlign: 'left', background: 'var(--bg-secondary)' }}>🔴 Stroke Awarded</button>
                <button onClick={() => { handleAddPoint('player1', 'kill_shot'); setShowAttributionSheet(false); }} className="btn" style={{ fontSize: 11, textAlign: 'left', background: 'var(--bg-secondary)' }}>⚡ Kill Shot Winner</button>
                <button onClick={() => { handleAddPoint('player1', 'nick_winner'); setShowAttributionSheet(false); }} className="btn" style={{ fontSize: 11, textAlign: 'left', background: 'var(--bg-secondary)' }}>🎯 Nick Shot Winner</button>
                <button onClick={() => { handleAddPoint('player1', 'opp_tin_error'); setShowAttributionSheet(false); }} className="btn" style={{ fontSize: 11, textAlign: 'left', background: 'var(--bg-secondary)' }}>⚠️ Opp Tin Hit</button>
                <button onClick={() => { handleAddPoint('player1', 'opp_out_error'); setShowAttributionSheet(false); }} className="btn" style={{ fontSize: 11, textAlign: 'left', background: 'var(--bg-secondary)' }}>❌ Opp Ball Out</button>
              </div>

              {/* Player 2 Options */}
              <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontWeight: 800, color: '#10b981', fontSize: 13, marginBottom: 4 }}>🟢 {match.player2_name}</div>
                <button onClick={() => { handleAddPoint('player2', 'stroke_awarded'); setShowAttributionSheet(false); }} className="btn" style={{ fontSize: 11, textAlign: 'left', background: 'var(--bg-secondary)' }}>🔴 Stroke Awarded</button>
                <button onClick={() => { handleAddPoint('player2', 'kill_shot'); setShowAttributionSheet(false); }} className="btn" style={{ fontSize: 11, textAlign: 'left', background: 'var(--bg-secondary)' }}>⚡ Kill Shot Winner</button>
                <button onClick={() => { handleAddPoint('player2', 'nick_winner'); setShowAttributionSheet(false); }} className="btn" style={{ fontSize: 11, textAlign: 'left', background: 'var(--bg-secondary)' }}>🎯 Nick Shot Winner</button>
                <button onClick={() => { handleAddPoint('player2', 'opp_tin_error'); setShowAttributionSheet(false); }} className="btn" style={{ fontSize: 11, textAlign: 'left', background: 'var(--bg-secondary)' }}>⚠️ Opp Tin Hit</button>
                <button onClick={() => { handleAddPoint('player2', 'opp_out_error'); setShowAttributionSheet(false); }} className="btn" style={{ fontSize: 11, textAlign: 'left', background: 'var(--bg-secondary)' }}>❌ Opp Ball Out</button>
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
                <option value="set">Per Game / Set (Default 2 per set)</option>
                <option value="match">Per Entire Match</option>
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setShowConfigModal(false)} className="btn btn-primary" style={{ padding: '8px 16px', fontWeight: 700 }}>Done</button>
            </div>
          </div>
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
              Select the winner to end this Squash match early.
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

