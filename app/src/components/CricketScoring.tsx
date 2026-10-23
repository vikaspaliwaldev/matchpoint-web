'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Match, TournamentEvent, Tournament, Team, User } from '@/types';
import { updateMatchScore, logAction, getTeamsByTournament, getPlayers } from '@/lib/supabase-service';
import { useAuth } from '@/lib/auth-context';
import {
  CricketMetadata,
  CricketInnings,
  CricketBall,
  CricketExtraType,
  CricketWicketType,
  CricketWagonZone,
  initialCricketMetadata,
  createEmptyCricketInnings,
  formatCricketOvers,
  calculateCurrentRunRate,
  calculateRequiredRunRate,
  isCricketInningsComplete,
} from '@/lib/sports-rules';
import {
  saveOfflineScorePayload,
  getOfflineScorePayload,
  clearOfflineScorePayload,
  flushAllOfflineScores,
} from '@/lib/offline-scoring';
import { IconPlay, IconPause, IconUndo, IconTrophy } from '@/components/icons';
import { getTeamLogo } from '@/lib/team-logos';
import CricketMatchModal from './CricketMatchModal';
import MatchMediaModal from './MatchMediaModal';

interface CricketScoringProps {
  match: Match;
  event?: TournamentEvent;
  tournament?: Tournament;
  onScoreUpdated: () => void;
}

export default function CricketScoring({
  match,
  event,
  tournament,
  onScoreUpdated,
}: CricketScoringProps) {
  const { user } = useAuth();
  const scorecardRef = useRef<HTMLDivElement | null>(null);

  // Fullscreen state
  const [isScoringFullscreen, setIsScoringFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    const container = scorecardRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => {
        setIsScoringFullscreen(true);
      }).catch(() => {
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

  // Sport metadata initialization
  const rawMeta = match.sport_metadata as CricketMetadata | undefined;
  const oversFormat = (match.sport_metadata?.format || event?.scoring_format || 't20') as any;
  const tourneyCricket = tournament?.cricket_config;
  const defaultMaxOvers = tourneyCricket?.overs_per_innings || (oversFormat === 't10' ? 10 : oversFormat === 't5' ? 5 : oversFormat === 'box_cricket' ? 8 : oversFormat === 'the_hundred' ? 20 : oversFormat === 'odi' ? 50 : 20);

  // Check if offline cached payload exists for this match
  const cachedOfflinePayload = typeof window !== 'undefined' ? getOfflineScorePayload(match.id) : null;
  const cachedMeta = (cachedOfflinePayload?.metadata || cachedOfflinePayload?.sportMetadata) as CricketMetadata | undefined;

  const [meta, setMeta] = useState<CricketMetadata>(() => {
    if (cachedMeta && cachedMeta.innings_1) {
      return { ...cachedMeta };
    }
    if (rawMeta && rawMeta.innings_1) {
      return { ...rawMeta };
    }
    return {
      ...initialCricketMetadata,
      format: oversFormat,
      overs_per_innings: defaultMaxOvers,
      innings_1: createEmptyCricketInnings(1, 'player1', match.player1_name, 'player2', match.player2_name, defaultMaxOvers),
      innings_2: createEmptyCricketInnings(2, 'player2', match.player2_name, 'player1', match.player1_name, defaultMaxOvers),
      custom_rules: {
        ...initialCricketMetadata.custom_rules,
        ...(tourneyCricket ? {
          max_overs_per_bowler: tourneyCricket.max_overs_per_bowler || Math.max(1, Math.ceil(defaultMaxOvers / 5)),
          free_hit_on_no_ball: tourneyCricket.free_hit_on_no_ball ?? true,
          powerplay_overs: tourneyCricket.powerplay_overs,
          ball_type: tourneyCricket.ball_type,
          pitch_type: tourneyCricket.pitch_type,
          wide_runs: tourneyCricket.wide_runs || 1,
          no_ball_runs: tourneyCricket.no_ball_runs || 1,
          one_tip_one_hand: tourneyCricket.one_tip_one_hand ?? false,
          roof_is_dead_ball: tourneyCricket.roof_is_dead_ball ?? false,
        } : {})
      }
    };
  });

  // Match Status
  const [matchStarted, setMatchStarted] = useState(
    cachedOfflinePayload ? (cachedOfflinePayload.status === 'running' || cachedOfflinePayload.status === 'completed') : (match.status === 'running' || match.status === 'completed')
  );
  const [isPaused, setIsPaused] = useState(
    cachedOfflinePayload ? cachedOfflinePayload.status === 'paused' : match.status === 'paused'
  );
  const [matchElapsed, setMatchElapsed] = useState(
    cachedOfflinePayload?.durationSeconds ?? (match.duration_seconds || 0)
  );
  const [pauseElapsed, setPauseElapsed] = useState(0);
  const [totalPausedTime, setTotalPausedTime] = useState(
    cachedMeta?.total_paused_seconds ?? (rawMeta?.total_paused_seconds || 0)
  );
  const [selectedCourt, setSelectedCourt] = useState(
    cachedOfflinePayload?.court || match.court || 'Ground 1'
  );
  const [teams, setTeams] = useState<Team[]>([]);

  // Sound and Haptic
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrateEnabled, setVibrateEnabled] = useState(true);

  // Sync / Offline status
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'offline' | 'saved_locally'>('idle');

  // Modals
  const [showTossModal, setShowTossModal] = useState(false);
  const [showBowlerModal, setShowBowlerModal] = useState(false);
  const [showBatterModal, setShowBatterModal] = useState(false);
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [showWagonWheelModal, setShowWagonWheelModal] = useState(false);
  const [pendingBallForWagon, setPendingBallForWagon] = useState<CricketBall | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showDeclareWinnerModal, setShowDeclareWinnerModal] = useState(false);
  const [showScorecardPreview, setShowScorecardPreview] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showOverlayModal, setShowOverlayModal] = useState(false);

  // CricHeroes Match Kickoff Setup State
  const [setupTossWinner, setSetupTossWinner] = useState<'player1' | 'player2'>('player1');
  const [setupTossDecision, setSetupTossDecision] = useState<'bat' | 'bowl'>('bat');
  const [setupStrikerName, setSetupStrikerName] = useState('');
  const [setupStrikerBattingStyle, setSetupStrikerBattingStyle] = useState<'RHB' | 'LHB'>('RHB');
  const [setupNonStrikerName, setSetupNonStrikerName] = useState('');
  const [setupNonStrikerBattingStyle, setSetupNonStrikerBattingStyle] = useState<'RHB' | 'LHB'>('RHB');
  const [setupBowlerName, setSetupBowlerName] = useState('');
  const [setupBowlerStyle, setSetupBowlerStyle] = useState('Right-arm fast');
  const [setupStep, setSetupStep] = useState<1 | 2>(1); // 1 = Toss, 2 = Openers & Bowler

  // Wicket flow form state
  const [wicketType, setWicketType] = useState<CricketWicketType>('caught');
  const [dismissedBatter, setDismissedBatter] = useState<'striker' | 'non_striker'>('striker');
  const [fielderName, setFielderName] = useState('');
  const [nextBatterName, setNextBatterName] = useState('');
  const [nextBatterBattingStyle, setNextBatterBattingStyle] = useState<'RHB' | 'LHB'>('RHB');

  // Bowler change state
  const [nextBowlerNameInput, setNextBowlerNameInput] = useState('');
  const [nextBowlerStyleInput, setNextBowlerStyleInput] = useState('Right-arm fast');

  // Batter edit state
  const [editStrikerName, setEditStrikerName] = useState('');
  const [editStrikerStyle, setEditStrikerStyle] = useState<'RHB' | 'LHB'>('RHB');
  const [editNonStrikerName, setEditNonStrikerName] = useState('');
  const [editNonStrikerStyle, setEditNonStrikerStyle] = useState<'RHB' | 'LHB'>('RHB');

  // Undo history stack
  const [history, setHistory] = useState<CricketMetadata[]>([]);

  // Load team rosters and players
  const [allPlayers, setAllPlayers] = useState<User[]>([]);

  useEffect(() => {
    if (tournament?.id) {
      getTeamsByTournament(tournament.id).then(setTeams).catch(() => {});
    }
    getPlayers().then(setAllPlayers).catch(() => {});
  }, [tournament?.id]);

  // Resolve teams for match
  // player1_id / player2_id in match can be team ID or user ID
  const team1 = useMemo(() => {
    return teams.find(t => t.id === match.player1_id || t.name.toLowerCase() === match.player1_name.toLowerCase()) || null;
  }, [teams, match.player1_id, match.player1_name]);

  const team2 = useMemo(() => {
    return teams.find(t => t.id === match.player2_id || t.name.toLowerCase() === match.player2_name.toLowerCase()) || null;
  }, [teams, match.player2_id, match.player2_name]);

  // Helper to extract list of players for a given team
  const getPlayersForTeam = useCallback((targetTeam: Team | null, fallbackTeamName: string) => {
    if (!targetTeam) return [];
    const list: { id: string; name: string; battingStyle?: 'RHB' | 'LHB'; bowlingStyle?: string }[] = [];
    
    // Check if targetTeam has roster array
    if (targetTeam.roster && targetTeam.roster.length > 0) {
      targetTeam.roster.forEach(rp => {
        list.push({
          id: rp.id,
          name: rp.name,
          battingStyle: rp.batting_style || 'RHB',
          bowlingStyle: rp.bowling_style || 'Right-arm fast',
        });
      });
    }

    // Also check targetTeam.players (IDs mapped to allPlayers)
    if (targetTeam.players && targetTeam.players.length > 0) {
      targetTeam.players.forEach(pId => {
        const found = allPlayers.find(u => u.id === pId);
        if (found && !list.some(item => item.id === found.id || item.name.toLowerCase() === found.name.toLowerCase())) {
          list.push({
            id: found.id,
            name: found.name,
            battingStyle: found.batting_style || 'RHB',
            bowlingStyle: found.bowling_style || 'Right-arm fast',
          });
        } else if (!found && !list.some(item => item.id === pId)) {
          list.push({
            id: pId,
            name: pId,
            battingStyle: 'RHB',
            bowlingStyle: 'Right-arm fast',
          });
        }
      });
    }

    return list;
  }, [allPlayers]);

  const team1PlayerList = useMemo(() => getPlayersForTeam(team1, match.player1_name), [getPlayersForTeam, team1, match.player1_name]);
  const team2PlayerList = useMemo(() => getPlayersForTeam(team2, match.player2_name), [getPlayersForTeam, team2, match.player2_name]);

  // Online listener
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

  // Timer
  useEffect(() => {
    let t: any = null;
    if (matchStarted && !isPaused && match.status !== 'completed') {
      t = setInterval(() => setMatchElapsed(prev => prev + 1), 1000);
    }
    return () => { if (t) clearInterval(t); };
  }, [matchStarted, isPaused, match.status]);

  useEffect(() => {
    let p: any = null;
    if (isPaused && match.status !== 'completed') {
      p = setInterval(() => setPauseElapsed(prev => prev + 1), 1000);
    } else {
      setPauseElapsed(0);
    }
    return () => { if (p) clearInterval(p); };
  }, [isPaused, match.status]);

  // Audio / Vibrate
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

  // Active Innings helper
  const currentInningsNum = meta.current_innings;
  const currentInnings = currentInningsNum === 1 ? meta.innings_1 : (meta.innings_2 || meta.innings_1);
  const isSecondInnings = currentInningsNum === 2;
  const targetRuns = currentInnings.target_runs;

  // Innings teams
  const battingTeamList = useMemo(() => {
    return currentInnings.batting_team_id === 'player1' ? team1PlayerList : team2PlayerList;
  }, [currentInnings.batting_team_id, team1PlayerList, team2PlayerList]);

  const bowlingTeamList = useMemo(() => {
    return currentInnings.bowling_team_id === 'player1' ? team1PlayerList : team2PlayerList;
  }, [currentInnings.bowling_team_id, team1PlayerList, team2PlayerList]);

  // Batters from batting team who are not currently out and not currently at crease
  const availableBattersList = useMemo(() => {
    const inn = currentInnings;
    return battingTeamList.filter(p => {
      // Exclude striker & non-striker currently at crease
      if (p.id === meta.striker_id || p.name.toLowerCase() === meta.striker_name.toLowerCase()) return false;
      if (p.id === meta.non_striker_id || p.name.toLowerCase() === meta.non_striker_name.toLowerCase()) return false;
      // Exclude batters already dismissed in this innings
      const matchedBatter = Object.values(inn.batters || {}).find(
        b => b.player_id === p.id || b.player_name.toLowerCase() === p.name.toLowerCase()
      );
      if (matchedBatter && matchedBatter.is_out) return false;
      return true;
    });
  }, [battingTeamList, currentInnings, meta.striker_id, meta.striker_name, meta.non_striker_id, meta.non_striker_name]);

  // Bowlers from fielding team eligible to bowl next over (excluding bowler who just finished over)
  const availableBowlersList = useMemo(() => {
    return bowlingTeamList.filter(p => {
      if (p.id === meta.bowler_id || p.name.toLowerCase() === meta.bowler_name.toLowerCase()) return false;
      return true;
    });
  }, [bowlingTeamList, meta.bowler_id, meta.bowler_name]);

  // Runs needed & Balls remaining
  const maxTotalBalls = currentInnings.max_overs * 6;
  const ballsRemaining = Math.max(0, maxTotalBalls - currentInnings.balls_bowled);
  const runsNeeded = targetRuns ? Math.max(0, targetRuns - currentInnings.total_runs) : 0;
  const crr = calculateCurrentRunRate(currentInnings.total_runs, currentInnings.balls_bowled);
  const rrr = isSecondInnings && targetRuns ? calculateRequiredRunRate(runsNeeded, ballsRemaining) : 0;

  // Striker & Non-Striker card
  const strikerScore = currentInnings.batters[meta.striker_id] || {
    player_id: meta.striker_id || 'p1',
    player_name: meta.striker_name || 'Striker',
    runs: 0,
    balls_faced: 0,
    fours: 0,
    sixes: 0,
    strike_rate: 0,
    is_out: false
  };

  const nonStrikerScore = currentInnings.batters[meta.non_striker_id] || {
    player_id: meta.non_striker_id || 'p2',
    player_name: meta.non_striker_name || 'Non-Striker',
    runs: 0,
    balls_faced: 0,
    fours: 0,
    sixes: 0,
    strike_rate: 0,
    is_out: false
  };

  const bowlerScore = currentInnings.bowlers[meta.bowler_id] || {
    player_id: meta.bowler_id || 'b1',
    player_name: meta.bowler_name || 'Bowler',
    overs: 0,
    balls_bowled: 0,
    maidens: 0,
    runs_conceded: 0,
    wickets: 0,
    economy: 0,
    wides: 0,
    no_balls: 0,
    dots: 0
  };

  // Last 6 Balls of current over
  const lastBalls = currentInnings.deliveries.slice(-8);

  // Save State to DB & Offline cache
  const saveStateToDB = async (
    newMeta: CricketMetadata,
    overrideStatus?: Match['status'],
    overrideWinnerId?: string | null,
    earlyReason?: string
  ) => {
    const isCompleted = overrideStatus === 'completed' || (overrideWinnerId !== undefined && overrideWinnerId !== null);
    const finalStatus: Match['status'] = isCompleted ? 'completed' : (isPaused ? 'paused' : 'running');
    const finalWinner = overrideWinnerId !== undefined ? overrideWinnerId : match.winner_id;

    // Convert Innings to MatchSet format for legacy dashboard viewers
    const syntheticSets = [
      {
        set_number: 1,
        player1_score: newMeta.innings_1.batting_team_id === 'player1' ? newMeta.innings_1.total_runs : (newMeta.innings_2?.total_runs || 0),
        player2_score: newMeta.innings_1.batting_team_id === 'player2' ? newMeta.innings_1.total_runs : (newMeta.innings_2?.total_runs || 0),
        is_complete: newMeta.innings_1.is_complete,
        winner_id: finalWinner || undefined
      }
    ];

    const actualStartTime = overrideStatus === 'running' && !match.actual_start_time ? new Date().toISOString() : match.actual_start_time;
    const actualEndTime = finalStatus === 'completed' ? new Date().toISOString() : null;

    saveOfflineScorePayload({
      matchId: match.id,
      sets: syntheticSets,
      status: finalStatus,
      winnerId: finalWinner,
      actualStartTime,
      actualEndTime,
      court: selectedCourt,
      durationSeconds: matchElapsed,
      sport: 'cricket',
      metadata: newMeta,
      savedAt: new Date().toISOString()
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
        syntheticSets,
        finalStatus,
        finalWinner,
        actualStartTime,
        actualEndTime,
        selectedCourt,
        undefined,
        matchElapsed,
        'cricket',
        newMeta
      );
      setSyncStatus('idle');
      onScoreUpdated();
    } catch {
      setSyncStatus('saved_locally');
      onScoreUpdated();
    }
  };

  // Toss & Match Start with CricHeroes-style kickoff
  const handleStartMatch = (
    winner: 'player1' | 'player2',
    decision: 'bat' | 'bowl',
    strikerInfo?: { name: string; battingStyle: 'RHB' | 'LHB' },
    nonStrikerInfo?: { name: string; battingStyle: 'RHB' | 'LHB' },
    bowlerInfo?: { name: string; bowlingStyle?: string }
  ) => {
    const battingTeamId = decision === 'bat' ? winner : (winner === 'player1' ? 'player2' : 'player1');
    const bowlingTeamId = battingTeamId === 'player1' ? 'player2' : 'player1';
    const battingTeamName = battingTeamId === 'player1' ? match.player1_name : match.player2_name;
    const bowlingTeamName = bowlingTeamId === 'player1' ? match.player1_name : match.player2_name;

    const sName = strikerInfo?.name.trim() || `${battingTeamName} Opener 1`;
    const sStyle = strikerInfo?.battingStyle || 'RHB';
    const nsName = nonStrikerInfo?.name.trim() || `${battingTeamName} Opener 2`;
    const nsStyle = nonStrikerInfo?.battingStyle || 'RHB';
    const bName = bowlerInfo?.name.trim() || `${bowlingTeamName} Bowler 1`;
    const bStyle = bowlerInfo?.bowlingStyle || 'Right-arm fast';

    const sId = `bat_${Date.now()}_1`;
    const nsId = `bat_${Date.now()}_2`;
    const bwId = `bw_${Date.now()}_1`;

    const inn1 = createEmptyCricketInnings(1, battingTeamId, battingTeamName, bowlingTeamId, bowlingTeamName, meta.overs_per_innings);
    inn1.batters[sId] = {
      player_id: sId,
      player_name: sName,
      batting_style: sStyle,
      runs: 0,
      balls_faced: 0,
      fours: 0,
      sixes: 0,
      strike_rate: 0,
      is_out: false
    };
    inn1.batters[nsId] = {
      player_id: nsId,
      player_name: nsName,
      batting_style: nsStyle,
      runs: 0,
      balls_faced: 0,
      fours: 0,
      sixes: 0,
      strike_rate: 0,
      is_out: false
    };
    inn1.bowlers[bwId] = {
      player_id: bwId,
      player_name: bName,
      bowling_style: bStyle,
      overs: 0,
      balls_bowled: 0,
      maidens: 0,
      runs_conceded: 0,
      wickets: 0,
      economy: 0,
      wides: 0,
      no_balls: 0,
      dots: 0
    };

    const updated: CricketMetadata = {
      ...meta,
      toss_winner_id: winner,
      toss_decision: decision,
      current_innings: 1,
      innings_1: inn1,
      striker_name: sName,
      striker_id: sId,
      striker_batting_style: sStyle,
      non_striker_name: nsName,
      non_striker_id: nsId,
      non_striker_batting_style: nsStyle,
      bowler_name: bName,
      bowler_id: bwId,
      bowler_bowling_style: bStyle,
    };

    setMeta(updated);
    setMatchStarted(true);
    setShowTossModal(false);
    playBeep(920, 0.2);
    saveStateToDB(updated, 'running');
  };

  // Core Scoring Engine: Log Delivery
  const handleBallDelivery = (
    runsOffBat: number,
    extraType?: CricketExtraType,
    extraRuns: number = 0,
    isWicket: boolean = false,
    wicketDetails?: {
      type: CricketWicketType;
      dismissed: 'striker' | 'non_striker';
      fielder?: string;
      newBatterName: string;
      newBatterBattingStyle?: 'RHB' | 'LHB';
    }
  ) => {
    if (!matchStarted || isPaused || match.status === 'completed') return;

    // Snapshot for Undo
    setHistory(prev => [...prev, JSON.parse(JSON.stringify(meta))]);

    // Audio & Haptic
    if (runsOffBat === 4 || runsOffBat === 6) {
      playBeep(1040, 0.25);
    } else if (isWicket) {
      playBeep(340, 0.35);
    } else {
      playBeep(runsOffBat > 0 ? 880 : 660, 0.08);
    }
    triggerVibrate(isWicket ? 100 : 40);

    const inn = JSON.parse(JSON.stringify(currentInnings)) as CricketInnings;
    const isLegalBall = extraType !== 'wide' && extraType !== 'no_ball';
    const totalDeliveryRuns = runsOffBat + extraRuns;

    // 1. Update Extras
    if (extraType === 'wide') {
      inn.extras.wides += extraRuns;
      inn.extras.total += extraRuns;
    } else if (extraType === 'no_ball') {
      inn.extras.no_balls += extraRuns;
      inn.extras.total += extraRuns;
    } else if (extraType === 'bye') {
      inn.extras.byes += extraRuns;
      inn.extras.total += extraRuns;
    } else if (extraType === 'leg_bye') {
      inn.extras.leg_byes += extraRuns;
      inn.extras.total += extraRuns;
    }

    // 2. Total Innings runs & balls
    inn.total_runs += totalDeliveryRuns;
    if (isLegalBall) {
      inn.balls_bowled += 1;
      inn.overs_formatted = formatCricketOvers(inn.balls_bowled);
    }

    // 3. Update Batter Stats
    const strikerId = meta.striker_id;
    const nonStrikerId = meta.non_striker_id;
    if (!inn.batters[strikerId]) {
      inn.batters[strikerId] = {
        player_id: strikerId,
        player_name: meta.striker_name,
        runs: 0,
        balls_faced: 0,
        fours: 0,
        sixes: 0,
        strike_rate: 0,
        is_out: false
      };
    }
    const bat = inn.batters[strikerId];
    if (extraType !== 'wide') {
      bat.balls_faced += 1;
    }
    bat.runs += runsOffBat;
    if (runsOffBat === 4) bat.fours += 1;
    if (runsOffBat === 6) bat.sixes += 1;
    bat.strike_rate = bat.balls_faced > 0 ? parseFloat(((bat.runs / bat.balls_faced) * 100).toFixed(1)) : 0;

    // 4. Update Bowler Stats
    const bowlerId = meta.bowler_id;
    if (!inn.bowlers[bowlerId]) {
      inn.bowlers[bowlerId] = {
        player_id: bowlerId,
        player_name: meta.bowler_name,
        overs: 0,
        balls_bowled: 0,
        maidens: 0,
        runs_conceded: 0,
        wickets: 0,
        economy: 0,
        wides: 0,
        no_balls: 0,
        dots: 0
      };
    }
    const bowl = inn.bowlers[bowlerId];
    if (isLegalBall) {
      bowl.balls_bowled += 1;
      bowl.overs = parseFloat(formatCricketOvers(bowl.balls_bowled));
    }
    // Runs charged to bowler (runs off bat + wides + no-balls, but not byes/leg-byes)
    const runsChargedToBowler = runsOffBat + (extraType === 'wide' || extraType === 'no_ball' ? extraRuns : 0);
    bowl.runs_conceded += runsChargedToBowler;
    if (extraType === 'wide') bowl.wides += 1;
    if (extraType === 'no_ball') bowl.no_balls += 1;
    if (runsOffBat === 0 && (!extraType || extraType === 'bye' || extraType === 'leg_bye')) {
      bowl.dots += 1;
    }
    bowl.economy = bowl.balls_bowled > 0 ? parseFloat(((bowl.runs_conceded / bowl.balls_bowled) * 6).toFixed(2)) : 0;

    // 5. Handle Wicket
    let nextStrikerId = meta.striker_id;
    let nextStrikerName = meta.striker_name;
    let nextNonStrikerId = meta.non_striker_id;
    let nextNonStrikerName = meta.non_striker_name;

    if (isWicket && wicketDetails) {
      inn.wickets += 1;
      // Bowler gets wicket unless run_out or retired
      if (wicketDetails.type !== 'run_out' && wicketDetails.type !== 'retired_hurt' && wicketDetails.type !== 'retired_out') {
        bowl.wickets += 1;
      }

      const dismissedId = wicketDetails.dismissed === 'striker' ? strikerId : nonStrikerId;
      const dismissedName = wicketDetails.dismissed === 'striker' ? meta.striker_name : meta.non_striker_name;
      const dismissedBat = inn.batters[dismissedId];
      if (dismissedBat) {
        dismissedBat.is_out = true;
        dismissedBat.dismissal_text = `${wicketDetails.type.toUpperCase()}${wicketDetails.fielder ? ` (c ${wicketDetails.fielder})` : ''} b ${meta.bowler_name}`;
      }

      // Record Fall of Wicket (FOW)
      inn.fall_of_wickets.push({
        wicket_number: inn.wickets,
        runs: inn.total_runs,
        overs: inn.overs_formatted,
        player_id: dismissedId,
        player_name: dismissedName
      });

      // New Incoming Batter
      const newId = `b_${Date.now()}`;
      const nStyle = wicketDetails.newBatterBattingStyle || 'RHB';
      inn.batters[newId] = {
        player_id: newId,
        player_name: wicketDetails.newBatterName || `Batter ${inn.wickets + 2}`,
        batting_style: nStyle,
        runs: 0,
        balls_faced: 0,
        fours: 0,
        sixes: 0,
        strike_rate: 0,
        is_out: false
      };

      if (wicketDetails.dismissed === 'striker') {
        nextStrikerId = newId;
        nextStrikerName = wicketDetails.newBatterName || `Batter ${inn.wickets + 2}`;
      } else {
        nextNonStrikerId = newId;
        nextNonStrikerName = wicketDetails.newBatterName || `Batter ${inn.wickets + 2}`;
      }
    }

    // Commentary text generation (CricHeroes style)
    let autoCommentary = '';
    if (isWicket && wicketDetails) {
      autoCommentary = `OUT! ${wicketDetails.type.toUpperCase()}${wicketDetails.fielder ? ` by ${wicketDetails.fielder}` : ''}. ${meta.striker_name} has to depart!`;
    } else if (extraType === 'wide') {
      autoCommentary = `Wide ball down the leg side, extra ${extraRuns} run(s) gifted to ${inn.batting_team_name}.`;
    } else if (extraType === 'no_ball') {
      autoCommentary = `NO BALL! Overstepping by ${meta.bowler_name}. Next ball is a FREE HIT!`;
    } else if (runsOffBat === 6) {
      autoCommentary = `SIX! That's massive! ${meta.striker_name} connects cleanly and sends it soaring over the boundary ropes!`;
    } else if (runsOffBat === 4) {
      autoCommentary = `FOUR! Glorious shot through the gaps by ${meta.striker_name}. The ball races away to the fence!`;
    } else if (runsOffBat === 1) {
      autoCommentary = `Pushed into the gap for a brisk single, rotates the strike.`;
    } else if (runsOffBat === 2) {
      autoCommentary = `Tucked away into the outfield, quick running between the wickets gets them a brace.`;
    } else if (runsOffBat === 3) {
      autoCommentary = `Deep into the pocket, outstanding running gets 3 runs.`;
    } else if (runsOffBat === 0) {
      autoCommentary = `Good length delivery, defended solidly back to the bowler. Dot ball.`;
    }

    // 6. Record Ball in Deliveries array
    const ballRecord: CricketBall = {
      id: `ball_${Date.now()}`,
      over_number: Math.floor(inn.balls_bowled / 6),
      ball_in_over: (inn.balls_bowled % 6) || 6,
      is_legal: isLegalBall,
      bowler_id: meta.bowler_id,
      bowler_name: meta.bowler_name,
      striker_id: strikerId,
      striker_name: meta.striker_name,
      non_striker_id: nonStrikerId,
      non_striker_name: meta.non_striker_name,
      runs_off_bat: runsOffBat,
      extra_type: extraType,
      extra_runs: extraRuns,
      total_runs: totalDeliveryRuns,
      is_wicket: isWicket,
      wicket_type: wicketDetails?.type,
      is_free_hit: meta.is_free_hit,
      commentary: autoCommentary,
      timestamp: new Date().toISOString()
    };
    inn.deliveries.push(ballRecord);

    // 7. Strike Rotation (Odd runs swap strike; Over completion swaps strike)
    const isOddRuns = (runsOffBat % 2 === 1) || (extraType === 'bye' && extraRuns % 2 === 1) || (extraType === 'leg_bye' && extraRuns % 2 === 1);
    const isOverComplete = isLegalBall && (inn.balls_bowled % 6 === 0);

    let finalStrikerId = nextStrikerId;
    let finalStrikerName = nextStrikerName;
    let finalNonStrikerId = nextNonStrikerId;
    let finalNonStrikerName = nextNonStrikerName;

    if (isOddRuns && !isOverComplete) {
      // Swap strike mid-over
      finalStrikerId = nextNonStrikerId;
      finalStrikerName = nextNonStrikerName;
      finalNonStrikerId = nextStrikerId;
      finalNonStrikerName = nextStrikerName;
    } else if (isOverComplete && !isOddRuns) {
      // Swap strike at end of over
      finalStrikerId = nextNonStrikerId;
      finalStrikerName = nextNonStrikerName;
      finalNonStrikerId = nextStrikerId;
      finalNonStrikerName = nextStrikerName;
    }

    // Free Hit logic: If No-Ball, next delivery is Free Hit; else resets
    const nextFreeHit = extraType === 'no_ball';

    // 8. Check Innings / Match Completion
    const compCheck = isCricketInningsComplete(inn, meta.custom_rules.players_per_side, isSecondInnings ? targetRuns : undefined);
    
    let updatedMeta: CricketMetadata = {
      ...meta,
      striker_id: finalStrikerId,
      striker_name: finalStrikerName,
      non_striker_id: finalNonStrikerId,
      non_striker_name: finalNonStrikerName,
      is_free_hit: nextFreeHit,
      last_ball_text: isWicket ? 'W' : extraType ? `${extraRuns}${extraType === 'wide' ? 'wd' : 'nb'}` : `${runsOffBat}`,
      [currentInningsNum === 1 ? 'innings_1' : 'innings_2']: inn
    };

    if (compCheck.isComplete) {
      inn.is_complete = true;
      if (currentInningsNum === 1) {
        // Switch to 2nd Innings
        const target = inn.total_runs + 1;
        const inn2 = createEmptyCricketInnings(
          2,
          inn.bowling_team_id,
          inn.bowling_team_name,
          inn.batting_team_id,
          inn.batting_team_name,
          meta.overs_per_innings
        );
        inn2.target_runs = target;

        updatedMeta = {
          ...updatedMeta,
          current_innings: 2,
          innings_1: inn,
          innings_2: inn2,
          striker_name: `${inn.bowling_team_name} Opener 1`,
          striker_id: 'b2_1',
          non_striker_name: `${inn.bowling_team_name} Opener 2`,
          non_striker_id: 'b2_2',
          bowler_name: `${inn.batting_team_name} Bowler 1`,
          bowler_id: 'bw2_1',
        };
        playBeep(520, 0.3);
      } else {
        // Match Over in 2nd Innings
        const winTeamId = inn.total_runs >= (targetRuns || 0) ? inn.batting_team_id : inn.bowling_team_id;
        const winnerDbId = winTeamId === 'player1' ? match.player1_id : match.player2_id;
        setMeta(updatedMeta);
        saveStateToDB(updatedMeta, 'completed', winnerDbId);
        return;
      }
    }

    setMeta(updatedMeta);
    saveStateToDB(updatedMeta);

    // Prompt for next bowler if over completed and innings still active
    if (isOverComplete && !compCheck.isComplete) {
      setShowBowlerModal(true);
    }

    // Optional Wagon Wheel prompt on boundaries
    if (meta.wagon_wheel_enabled && (runsOffBat === 4 || runsOffBat === 6)) {
      setPendingBallForWagon(ballRecord);
      setShowWagonWheelModal(true);
    }
  };

  // Assign Wagon Wheel Zone to ball
  const handleSelectWagonZone = (zone: CricketWagonZone) => {
    if (!pendingBallForWagon) return;
    const inn = JSON.parse(JSON.stringify(currentInnings)) as CricketInnings;
    const targetBall = inn.deliveries.find(d => d.id === pendingBallForWagon.id);
    if (targetBall) {
      targetBall.wagon_zone = zone;
    }
    const updatedMeta = {
      ...meta,
      [currentInningsNum === 1 ? 'innings_1' : 'innings_2']: inn
    };
    setMeta(updatedMeta);
    saveStateToDB(updatedMeta);
    setShowWagonWheelModal(false);
    setPendingBallForWagon(null);
  };

  // Undo Ball
  const handleUndo = () => {
    if (history.length === 0 || isPaused) return;
    playBeep(400, 0.1);
    triggerVibrate(60);
    const lastMeta = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setMeta(lastMeta);
    saveStateToDB(lastMeta);
  };

  // Manual strike swap
  const handleManualSwapStrike = () => {
    setMeta(prev => ({
      ...prev,
      striker_id: prev.non_striker_id,
      striker_name: prev.non_striker_name,
      non_striker_id: prev.striker_id,
      non_striker_name: prev.striker_name
    }));
    playBeep(440, 0.05);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={scorecardRef}
      className={isScoringFullscreen ? 'fullscreen-scorecard' : ''}
      style={{
        maxWidth: isScoringFullscreen ? 'none' : 640,
        margin: isScoringFullscreen ? '0' : '0 auto',
        background: 'var(--bg-card)',
        borderRadius: isScoringFullscreen ? '0' : 'var(--radius-lg)',
        border: isScoringFullscreen ? 'none' : '1px solid var(--border)',
        boxShadow: isScoringFullscreen ? 'none' : 'var(--glass-shadow)',
        color: 'var(--text-primary)',
        padding: isScoringFullscreen ? '16px' : '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        height: isScoringFullscreen ? '100vh' : 'auto',
      }}
    >
      {/* 1. HEADER BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 800, background: 'rgba(234, 88, 12, 0.2)', color: '#ea580c', padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase' }}>
              🏏 Cricket ({meta.format.toUpperCase()})
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
              {selectedCourt} · {formatTimer(matchElapsed)}
            </span>
            {(!isOnline || syncStatus === 'saved_locally' || syncStatus === 'syncing') && (
              <button
                onClick={async () => {
                  if (typeof navigator !== 'undefined' && navigator.onLine) {
                    setSyncStatus('syncing');
                    try {
                      await flushAllOfflineScores();
                      setSyncStatus('idle');
                    } catch {
                      setSyncStatus('saved_locally');
                    }
                  }
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 12,
                  background: syncStatus === 'syncing' ? 'rgba(59, 130, 246, 0.25)' : 'rgba(234, 179, 8, 0.25)',
                  border: syncStatus === 'syncing' ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid rgba(234, 179, 8, 0.5)',
                  color: syncStatus === 'syncing' ? '#93C5FD' : '#FDE047',
                  cursor: 'pointer',
                }}
                title={!isOnline ? 'Offline: scoring saved to device' : syncStatus === 'saved_locally' ? 'Saved locally (click to sync)' : 'Syncing...'}
              >
                <span>{syncStatus === 'syncing' ? '🔄' : '📶'}</span>
                <span>{!isOnline ? 'Offline' : syncStatus === 'saved_locally' ? 'Saved Locally' : 'Syncing'}</span>
              </button>
            )}
          </div>
          <h2 style={{ fontSize: 17, fontWeight: 800, marginTop: 4, margin: 0 }}>
            {match.player1_name} vs {match.player2_name}
          </h2>
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowScorecardPreview(true)}
            style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(234, 88, 12, 0.15)', border: '1px solid rgba(234, 88, 12, 0.35)', fontSize: 12, fontWeight: 700, color: '#ea580c' }}
            title="Preview CricHeroes Scorecard & Commentary"
          >
            📊 Scorecard
          </button>
          <button
            onClick={() => setShowMediaModal(true)}
            style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)', fontSize: 12, fontWeight: 700, color: '#f87171' }}
            title="Upload Match Photos, YouTube Live Stream link, and Highlights"
          >
            🎥 Media / YouTube
          </button>
          <button
            onClick={() => setShowOverlayModal(true)}
            style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.35)', fontSize: 12, fontWeight: 700, color: '#38bdf8' }}
            title="CricHeroes OBS / vMix / Stadium TV Overlay"
          >
            📡 Broadcast Overlay
          </button>
          <button
            onClick={() => setMeta(prev => ({ ...prev, wagon_wheel_enabled: !prev.wagon_wheel_enabled }))}
            style={{ padding: '6px 10px', borderRadius: 8, background: meta.wagon_wheel_enabled ? 'rgba(59,130,246,0.2)' : 'var(--bg-secondary)', border: '1px solid var(--border)', fontSize: 12, fontWeight: 700, color: meta.wagon_wheel_enabled ? '#3b82f6' : 'var(--text-muted)' }}
            title="Toggle Wagon Wheel Prompt"
          >
            🎯 Wagon
          </button>
          <button
            onClick={() => setShowConfigModal(true)}
            style={{ padding: '6px 10px', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border)', fontSize: 12, fontWeight: 700 }}
            title="Rules & Overs Setup"
          >
            ⚙️ Rules
          </button>
          <button
            onClick={() => setSoundEnabled(prev => !prev)}
            style={{ padding: 8, borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border)', fontSize: 13 }}
            title="Sound"
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
          <button
            onClick={toggleFullscreen}
            style={{ padding: '8px 12px', borderRadius: 8, background: isScoringFullscreen ? 'rgba(239, 68, 68, 0.2)' : 'var(--bg-secondary)', border: '1px solid var(--border)', fontSize: 12, fontWeight: 700, color: isScoringFullscreen ? '#f87171' : 'var(--text-primary)' }}
          >
            {isScoringFullscreen ? '📴 Exit' : '⛶ Fullscreen'}
          </button>
        </div>
      </div>

      {/* 2. BODY CONTENT */}
      {!matchStarted ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '30px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: 52 }}>🏏</div>
          <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Start Cricket Match</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 360, margin: 0 }}>
            Configure toss winner and decision to begin live ball-by-ball scoring.
          </p>
          <button
            onClick={() => setShowTossModal(true)}
            className="btn btn-primary"
            style={{ padding: '12px 32px', fontSize: 15, fontWeight: 800, borderRadius: 'var(--radius-md)' }}
          >
            🪙 Record Toss & Start
          </button>
        </div>
      ) : (
        <>
          {/* Main Cricket Scoreboard Banner (CricHeroes Style) */}
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            color: '#ffffff',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}>
            {/* Top row: Batting Team & Big Score */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {currentInnings.batting_team_name} (Innings {currentInningsNum})
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 2 }}>
                  <span style={{ fontSize: 'clamp(36px, 8vw, 48px)', fontWeight: 900, fontFamily: 'monospace', color: '#f8fafc' }}>
                    {currentInnings.total_runs}/{currentInnings.wickets}
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#94a3b8' }}>
                    ({currentInnings.overs_formatted} / {currentInnings.max_overs} ov)
                  </span>
                </div>
              </div>

              {/* CRR & Target RRR */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8' }}>
                  CRR: {crr.toFixed(2)}
                </div>
                {isSecondInnings && targetRuns && (
                  <>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#facc15', marginTop: 2 }}>
                      Need {runsNeeded} off {ballsRemaining}b
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#e2e8f0' }}>
                      RRR: {rrr.toFixed(2)}
                    </div>
                  </>
                )}
                {meta.is_free_hit && (
                  <span style={{ fontSize: 9, background: '#ef4444', color: '#fff', padding: '2px 6px', borderRadius: 4, fontWeight: 800, letterSpacing: 0.5, marginTop: 4, display: 'inline-block' }}>
                    ⚡ FREE HIT
                  </span>
                )}
              </div>
            </div>

            {/* Middle row: Active Batters Card */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '8px 12px' }}>
              {/* Striker */}
              <div style={{ borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#60a5fa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      🏏 {strikerScore.player_name} *
                    </span>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 4px', borderRadius: 3, background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}>
                      {strikerScore.batting_style || meta.striker_batting_style || 'RHB'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setEditStrikerName(meta.striker_name);
                      setEditStrikerStyle(meta.striker_batting_style || 'RHB');
                      setEditNonStrikerName(meta.non_striker_name);
                      setEditNonStrikerStyle(meta.non_striker_batting_style || 'RHB');
                      setShowBatterModal(true);
                    }}
                    style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: 10, cursor: 'pointer' }}
                    title="Change or Edit Batters"
                  >
                    ✏️
                  </button>
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, marginTop: 2 }}>
                  {strikerScore.runs} <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>({strikerScore.balls_faced}b, {strikerScore.fours}x4, {strikerScore.sixes}x6)</span>
                </div>
              </div>

              {/* Non-Striker */}
              <div style={{ paddingLeft: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {nonStrikerScore.player_name}
                    </span>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 4px', borderRadius: 3, background: 'rgba(148, 163, 184, 0.2)', color: '#94a3b8' }}>
                      {nonStrikerScore.batting_style || meta.non_striker_batting_style || 'RHB'}
                    </span>
                  </div>
                  <button
                    onClick={handleManualSwapStrike}
                    style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontSize: 10, padding: '1px 6px', borderRadius: 4, cursor: 'pointer' }}
                    title="Swap Strike"
                  >
                    ⇄ Strike
                  </button>
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, marginTop: 2 }}>
                  {nonStrikerScore.runs} <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>({nonStrikerScore.balls_faced}b, {nonStrikerScore.fours}x4, {nonStrikerScore.sixes}x6)</span>
                </div>
              </div>
            </div>

            {/* Bottom row: Active Bowler Card */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '6px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#34d399' }}>
                  🔴 Bowler: {bowlerScore.player_name}
                </span>
                <button
                  onClick={() => setShowBowlerModal(true)}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: 10, cursor: 'pointer' }}
                >
                  Change ▾
                </button>
              </div>
              <div style={{ fontSize: 12, fontWeight: 800 }}>
                {bowlerScore.overs}-{bowlerScore.maidens}-{bowlerScore.runs_conceded}-{bowlerScore.wickets}
                <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 6 }}>Econ: {bowlerScore.economy}</span>
              </div>
            </div>

            {/* Over Ribbon: Last Balls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', paddingTop: 2 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>This Over:</span>
              {lastBalls.length === 0 ? (
                <span style={{ fontSize: 11, color: '#64748b' }}>Over not started</span>
              ) : (
                lastBalls.map((b, i) => {
                  const isFour = b.runs_off_bat === 4;
                  const isSix = b.runs_off_bat === 6;
                  const isW = b.is_wicket;
                  const isExtra = !b.is_legal;

                  const bg = isW ? '#ef4444' : isSix ? '#8b5cf6' : isFour ? '#10b981' : isExtra ? '#f59e0b' : 'rgba(255,255,255,0.15)';
                  const label = isW ? 'W' : b.extra_type ? `${b.total_runs}${b.extra_type === 'wide' ? 'wd' : 'nb'}` : `${b.runs_off_bat}`;

                  return (
                    <div
                      key={i}
                      style={{
                        minWidth: 26,
                        height: 26,
                        borderRadius: 13,
                        background: bg,
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 900,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        flexShrink: 0
                      }}
                    >
                      {label}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 3. SCORING INPUT KEYPAD (Runs & Extras) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
            {/* Primary Runs Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
              {[0, 1, 2, 3, 4, 6].map(run => (
                <button
                  key={run}
                  onClick={() => handleBallDelivery(run)}
                  disabled={isPaused || match.status === 'completed'}
                  className="btn"
                  style={{
                    height: 52,
                    fontSize: 20,
                    fontWeight: 900,
                    borderRadius: 'var(--radius-md)',
                    background: run === 4 ? 'rgba(16, 185, 129, 0.15)' : run === 6 ? 'rgba(139, 92, 246, 0.15)' : 'var(--bg-secondary)',
                    border: run === 4 ? '2px solid #10b981' : run === 6 ? '2px solid #8b5cf6' : '1px solid var(--border)',
                    color: run === 4 ? '#10b981' : run === 6 ? '#a78bfa' : 'var(--text-primary)',
                    boxShadow: 'var(--glass-shadow)',
                    cursor: isPaused || match.status === 'completed' ? 'not-allowed' : 'pointer'
                  }}
                >
                  {run}
                </button>
              ))}
            </div>

            {/* Extras & Wicket Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
              <button
                onClick={() => handleBallDelivery(0, 'wide', meta.custom_rules.wide_runs)}
                disabled={isPaused || match.status === 'completed'}
                className="btn btn-secondary"
                style={{ height: 44, fontSize: 12, fontWeight: 800, background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#f59e0b' }}
              >
                +1 WD
              </button>
              <button
                onClick={() => handleBallDelivery(0, 'no_ball', meta.custom_rules.no_ball_runs)}
                disabled={isPaused || match.status === 'completed'}
                className="btn btn-secondary"
                style={{ height: 44, fontSize: 12, fontWeight: 800, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444' }}
              >
                +1 NB
              </button>
              <button
                onClick={() => handleBallDelivery(0, 'bye', 1)}
                disabled={isPaused || match.status === 'completed'}
                className="btn btn-secondary"
                style={{ height: 44, fontSize: 12, fontWeight: 800 }}
              >
                +1 BYE
              </button>
              <button
                onClick={() => handleBallDelivery(0, 'leg_bye', 1)}
                disabled={isPaused || match.status === 'completed'}
                className="btn btn-secondary"
                style={{ height: 44, fontSize: 12, fontWeight: 800 }}
              >
                +1 LB
              </button>
              <button
                onClick={() => setShowWicketModal(true)}
                disabled={isPaused || match.status === 'completed'}
                className="btn"
                style={{
                  height: 44, fontSize: 12, fontWeight: 900,
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: '#ffffff',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(239,68,68,0.35)'
                }}
              >
                OUT ❌
              </button>
            </div>
          </div>

          {/* 4. ACTION TOOLBAR */}
          <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
            <button
              onClick={handleUndo}
              disabled={history.length === 0 || isPaused}
              className="btn btn-secondary"
              style={{ flex: 1, height: 44, fontSize: 12, fontWeight: 700, minWidth: 100 }}
            >
              <IconUndo size={14} /> Undo Ball
            </button>
            <button
              onClick={() => {
                const next = !isPaused;
                setIsPaused(next);
                if (!next) setTotalPausedTime(prev => prev + pauseElapsed);
                saveStateToDB(meta, next ? 'paused' : 'running');
              }}
              className="btn btn-secondary"
              style={{
                flex: 1, height: 44, fontSize: 12, fontWeight: 700, minWidth: 100,
                background: isPaused ? 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)' : 'var(--bg-secondary)',
                color: isPaused ? '#000' : 'var(--text-primary)',
                border: isPaused ? 'none' : '1px solid var(--border)'
              }}
            >
              {isPaused ? <IconPlay size={14} /> : <IconPause size={14} />} {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              onClick={handleManualSwapStrike}
              disabled={isPaused}
              className="btn btn-secondary"
              style={{ flex: 1, height: 44, fontSize: 12, fontWeight: 700, minWidth: 100 }}
            >
              👥 Swap Strike
            </button>
            <button
              onClick={() => setShowDeclareWinnerModal(true)}
              className="btn"
              style={{ flex: 1, height: 44, fontSize: 12, fontWeight: 700, minWidth: 100, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}
            >
              <IconTrophy size={14} /> End Match
            </button>
          </div>
        </>
      )}

      {/* ── MODALS ── */}

      {/* CricHeroes Match Kickoff Setup Modal */}
      {showTossModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: 16 }}>
          <div style={{ background: '#0b1329', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 'var(--radius-lg)', padding: 22, maxWidth: 500, width: '100%', color: '#f8fafc', boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 10, fontWeight: 800, background: '#ea580c', color: '#fff', padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase' }}>
                  CricHeroes Setup
                </span>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: '6px 0 0 0' }}>
                  {setupStep === 1 ? '🪙 Step 1: Match Toss & Decision' : '🏏 Step 2: Openers & Opening Bowler'}
                </h3>
              </div>
              <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700 }}>
                Step {setupStep} of 2
              </span>
            </div>

            {setupStep === 1 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: 8 }}>Who won the toss?</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => setSetupTossWinner('player1')}
                      style={{
                        padding: '12px',
                        borderRadius: 8,
                        border: setupTossWinner === 'player1' ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                        background: setupTossWinner === 'player1' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.03)',
                        color: setupTossWinner === 'player1' ? '#38bdf8' : '#f8fafc',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      🔵 {match.player1_name}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSetupTossWinner('player2')}
                      style={{
                        padding: '12px',
                        borderRadius: 8,
                        border: setupTossWinner === 'player2' ? '2px solid #34d399' : '1px solid rgba(255,255,255,0.1)',
                        background: setupTossWinner === 'player2' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255,255,255,0.03)',
                        color: setupTossWinner === 'player2' ? '#34d399' : '#f8fafc',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      🟢 {match.player2_name}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: 8 }}>Elected to?</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => setSetupTossDecision('bat')}
                      style={{
                        padding: '12px',
                        borderRadius: 8,
                        border: setupTossDecision === 'bat' ? '2px solid #facc15' : '1px solid rgba(255,255,255,0.1)',
                        background: setupTossDecision === 'bat' ? 'rgba(250, 204, 21, 0.15)' : 'rgba(255,255,255,0.03)',
                        color: setupTossDecision === 'bat' ? '#facc15' : '#f8fafc',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      🏏 Bat First
                    </button>
                    <button
                      type="button"
                      onClick={() => setSetupTossDecision('bowl')}
                      style={{
                        padding: '12px',
                        borderRadius: 8,
                        border: setupTossDecision === 'bowl' ? '2px solid #facc15' : '1px solid rgba(255,255,255,0.1)',
                        background: setupTossDecision === 'bowl' ? 'rgba(250, 204, 21, 0.15)' : 'rgba(255,255,255,0.03)',
                        color: setupTossDecision === 'bowl' ? '#facc15' : '#f8fafc',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      ⚾ Bowl First
                    </button>
                  </div>
                </div>

                <div style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  fontSize: 12,
                  color: '#e2e8f0',
                }}>
                  📢 <strong>{setupTossWinner === 'player1' ? match.player1_name : match.player2_name}</strong> won the toss and elected to <strong>{setupTossDecision}</strong> first.
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                  <button
                    type="button"
                    onClick={() => setShowTossModal(false)}
                    className="btn btn-secondary"
                    style={{ padding: '8px 16px', fontSize: 13 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const battingTeam = setupTossDecision === 'bat'
                        ? (setupTossWinner === 'player1' ? match.player1_name : match.player2_name)
                        : (setupTossWinner === 'player1' ? match.player2_name : match.player1_name);
                      const bowlingTeam = battingTeam === match.player1_name ? match.player2_name : match.player1_name;
                      const bList = setupTossDecision === 'bat'
                        ? (setupTossWinner === 'player1' ? team1PlayerList : team2PlayerList)
                        : (setupTossWinner === 'player1' ? team2PlayerList : team1PlayerList);
                      const fList = bList === team1PlayerList ? team2PlayerList : team1PlayerList;

                      if (!setupStrikerName) {
                        setSetupStrikerName(bList[0]?.name || `${battingTeam} Opener 1`);
                        if (bList[0]?.battingStyle) setSetupStrikerBattingStyle(bList[0].battingStyle);
                      }
                      if (!setupNonStrikerName) {
                        setSetupNonStrikerName(bList[1]?.name || `${battingTeam} Opener 2`);
                        if (bList[1]?.battingStyle) setSetupNonStrikerBattingStyle(bList[1].battingStyle);
                      }
                      if (!setupBowlerName) {
                        setSetupBowlerName(fList[0]?.name || `${bowlingTeam} Bowler 1`);
                        if (fList[0]?.bowlingStyle) setSetupBowlerStyle(fList[0].bowlingStyle);
                      }
                      setSetupStep(2);
                    }}
                    className="btn btn-primary"
                    style={{ padding: '8px 20px', fontSize: 13, fontWeight: 700 }}
                  >
                    Next: Select Players →
                  </button>
                </div>
              </div>
            ) : (
              (() => {
                const isP1Batting = setupTossDecision === 'bat' ? setupTossWinner === 'player1' : setupTossWinner === 'player2';
                const currentBattingRoster = isP1Batting ? team1PlayerList : team2PlayerList;
                const currentBowlingRoster = isP1Batting ? team2PlayerList : team1PlayerList;
                const battingTeamLabel = isP1Batting ? match.player1_name : match.player2_name;
                const bowlingTeamLabel = isP1Batting ? match.player2_name : match.player1_name;

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* Striker */}
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <label style={{ fontSize: 12, fontWeight: 800, color: '#60a5fa' }}>
                          🏏 Striker (On Strike *) — {battingTeamLabel}
                        </label>
                        {currentBattingRoster.length > 0 && (
                          <span style={{ fontSize: 10, color: '#94a3b8' }}>
                            {currentBattingRoster.length} players available
                          </span>
                        )}
                      </div>

                      {/* Dropdown for batting team */}
                      {currentBattingRoster.length > 0 && (
                        <select
                          className="input"
                          style={{ width: '100%', marginBottom: 8, background: '#1e293b' }}
                          value={currentBattingRoster.some(p => p.name === setupStrikerName) ? setupStrikerName : ''}
                          onChange={e => {
                            const selectedName = e.target.value;
                            setSetupStrikerName(selectedName);
                            const matched = currentBattingRoster.find(p => p.name === selectedName);
                            if (matched?.battingStyle) setSetupStrikerBattingStyle(matched.battingStyle);
                          }}
                        >
                          <option value="">-- Choose from {battingTeamLabel} roster --</option>
                          {currentBattingRoster.map(p => (
                            <option key={p.id} value={p.name}>
                              {p.name} ({p.battingStyle || 'RHB'})
                            </option>
                          ))}
                        </select>
                      )}

                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          type="text"
                          value={setupStrikerName}
                          onChange={e => setSetupStrikerName(e.target.value)}
                          placeholder="Or type player name..."
                          className="input"
                          style={{ flex: 1 }}
                        />
                        <select
                          value={setupStrikerBattingStyle}
                          onChange={e => setSetupStrikerBattingStyle(e.target.value as any)}
                          className="input"
                          style={{ width: 100 }}
                        >
                          <option value="RHB">Right (RHB)</option>
                          <option value="LHB">Left (LHB)</option>
                        </select>
                      </div>
                    </div>

                    {/* Non-Striker */}
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <label style={{ fontSize: 12, fontWeight: 800, color: '#cbd5e1' }}>
                          🏃 Non-Striker — {battingTeamLabel}
                        </label>
                      </div>

                      {/* Dropdown for non-striker */}
                      {currentBattingRoster.length > 0 && (
                        <select
                          className="input"
                          style={{ width: '100%', marginBottom: 8, background: '#1e293b' }}
                          value={currentBattingRoster.some(p => p.name === setupNonStrikerName) ? setupNonStrikerName : ''}
                          onChange={e => {
                            const selectedName = e.target.value;
                            setSetupNonStrikerName(selectedName);
                            const matched = currentBattingRoster.find(p => p.name === selectedName);
                            if (matched?.battingStyle) setSetupNonStrikerBattingStyle(matched.battingStyle);
                          }}
                        >
                          <option value="">-- Choose from {battingTeamLabel} roster --</option>
                          {currentBattingRoster.filter(p => p.name !== setupStrikerName).map(p => (
                            <option key={p.id} value={p.name}>
                              {p.name} ({p.battingStyle || 'RHB'})
                            </option>
                          ))}
                        </select>
                      )}

                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          type="text"
                          value={setupNonStrikerName}
                          onChange={e => setSetupNonStrikerName(e.target.value)}
                          placeholder="Or type player name..."
                          className="input"
                          style={{ flex: 1 }}
                        />
                        <select
                          value={setupNonStrikerBattingStyle}
                          onChange={e => setSetupNonStrikerBattingStyle(e.target.value as any)}
                          className="input"
                          style={{ width: 100 }}
                        >
                          <option value="RHB">Right (RHB)</option>
                          <option value="LHB">Left (LHB)</option>
                        </select>
                      </div>
                    </div>

                    {/* Opening Bowler */}
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <label style={{ fontSize: 12, fontWeight: 800, color: '#34d399' }}>
                          🔴 Opening Bowler — {bowlingTeamLabel}
                        </label>
                        {currentBowlingRoster.length > 0 && (
                          <span style={{ fontSize: 10, color: '#94a3b8' }}>
                            {currentBowlingRoster.length} players available
                          </span>
                        )}
                      </div>

                      {/* Dropdown for opening bowler */}
                      {currentBowlingRoster.length > 0 && (
                        <select
                          className="input"
                          style={{ width: '100%', marginBottom: 8, background: '#1e293b' }}
                          value={currentBowlingRoster.some(p => p.name === setupBowlerName) ? setupBowlerName : ''}
                          onChange={e => {
                            const selectedName = e.target.value;
                            setSetupBowlerName(selectedName);
                            const matched = currentBowlingRoster.find(p => p.name === selectedName);
                            if (matched?.bowlingStyle) setSetupBowlerStyle(matched.bowlingStyle);
                          }}
                        >
                          <option value="">-- Choose from {bowlingTeamLabel} roster --</option>
                          {currentBowlingRoster.map(p => (
                            <option key={p.id} value={p.name}>
                              {p.name} ({p.bowlingStyle || 'Bowler'})
                            </option>
                          ))}
                        </select>
                      )}

                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          type="text"
                          value={setupBowlerName}
                          onChange={e => setSetupBowlerName(e.target.value)}
                          placeholder="Or type bowler name..."
                          className="input"
                          style={{ flex: 1 }}
                        />
                        <select
                          value={setupBowlerStyle}
                          onChange={e => setSetupBowlerStyle(e.target.value)}
                          className="input"
                          style={{ width: 140 }}
                        >
                          <option value="Right-arm fast">Right-arm fast</option>
                          <option value="Right-arm medium">Right-arm med</option>
                          <option value="Right-arm spin">Right-arm spin</option>
                          <option value="Left-arm fast">Left-arm fast</option>
                          <option value="Left-arm orthodox">Left-arm spin</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                      <button
                        type="button"
                        onClick={() => setSetupStep(1)}
                        className="btn btn-secondary"
                        style={{ padding: '8px 16px', fontSize: 13 }}
                      >
                        ← Back to Toss
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleStartMatch(
                            setupTossWinner,
                            setupTossDecision,
                            { name: setupStrikerName, battingStyle: setupStrikerBattingStyle },
                            { name: setupNonStrikerName, battingStyle: setupNonStrikerBattingStyle },
                            { name: setupBowlerName, bowlingStyle: setupBowlerStyle }
                          );
                        }}
                        className="btn btn-primary"
                        style={{ padding: '10px 24px', fontSize: 13, fontWeight: 800, background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)' }}
                      >
                        🚀 Start Match Scoring
                      </button>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        </div>
      )}

      {/* Wicket Modal */}
      {showWicketModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: 16 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20, maxWidth: 460, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#ef4444' }}>❌ Record Wicket / Dismissal</h3>
              <button onClick={() => setShowWicketModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Dismissed Batter */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Which batter is out?</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button
                    onClick={() => setDismissedBatter('striker')}
                    className="btn"
                    style={{ fontSize: 12, fontWeight: 700, background: dismissedBatter === 'striker' ? 'var(--accent)' : 'var(--bg-secondary)', color: dismissedBatter === 'striker' ? '#fff' : 'var(--text-primary)' }}
                  >
                    🏏 Striker: {meta.striker_name} ({meta.striker_batting_style || 'RHB'})
                  </button>
                  <button
                    onClick={() => setDismissedBatter('non_striker')}
                    className="btn"
                    style={{ fontSize: 12, fontWeight: 700, background: dismissedBatter === 'non_striker' ? 'var(--accent)' : 'var(--bg-secondary)', color: dismissedBatter === 'non_striker' ? '#fff' : 'var(--text-primary)' }}
                  >
                    Non-Striker: {meta.non_striker_name} ({meta.non_striker_batting_style || 'RHB'})
                  </button>
                </div>
              </div>

              {/* Mode of Dismissal */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Dismissal Type</label>
                <select
                  value={wicketType}
                  onChange={e => setWicketType(e.target.value as any)}
                  className="input"
                  style={{ width: '100%', background: 'var(--bg-secondary)' }}
                >
                  <option value="caught">Caught (c Fielder b Bowler)</option>
                  <option value="bowled">Bowled</option>
                  <option value="lbw">LBW</option>
                  <option value="run_out">Run Out</option>
                  <option value="stumped">Stumped</option>
                  <option value="hit_wicket">Hit Wicket</option>
                  <option value="retired_hurt">Retired Hurt</option>
                </select>
              </div>

              {/* Fielder Name (for Catch / Run Out) */}
              {(wicketType === 'caught' || wicketType === 'run_out' || wicketType === 'stumped') && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
                      {wicketType === 'caught' ? `Caught by — ${currentInnings.bowling_team_name}` : `Fielder involved — ${currentInnings.bowling_team_name}`}
                    </label>
                    {bowlingTeamList.length > 0 && (
                      <span style={{ fontSize: 10, color: '#94a3b8' }}>{bowlingTeamList.length} fielders</span>
                    )}
                  </div>
                  {bowlingTeamList.length > 0 && (
                    <select
                      className="input"
                      style={{ width: '100%', marginBottom: 6, background: '#1e293b' }}
                      value={bowlingTeamList.some(p => p.name === fielderName) ? fielderName : ''}
                      onChange={e => setFielderName(e.target.value)}
                    >
                      <option value="">-- Choose fielder from {currentInnings.bowling_team_name} --</option>
                      {bowlingTeamList.map(p => (
                        <option key={p.id} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  )}
                  <input
                    type="text"
                    value={fielderName}
                    onChange={e => setFielderName(e.target.value)}
                    placeholder="Or type fielder name..."
                    className="input"
                    style={{ width: '100%' }}
                  />
                </div>
              )}

              {/* Next Batter with Handedness */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
                    Next Incoming Batter — {currentInnings.batting_team_name}
                  </label>
                  {availableBattersList.length > 0 && (
                    <span style={{ fontSize: 10, color: '#94a3b8' }}>{availableBattersList.length} available</span>
                  )}
                </div>

                {availableBattersList.length > 0 && (
                  <select
                    className="input"
                    style={{ width: '100%', marginBottom: 6, background: '#1e293b' }}
                    value={availableBattersList.some(p => p.name === nextBatterName) ? nextBatterName : ''}
                    onChange={e => {
                      const selected = e.target.value;
                      setNextBatterName(selected);
                      const matched = availableBattersList.find(p => p.name === selected);
                      if (matched?.battingStyle) setNextBatterBattingStyle(matched.battingStyle);
                    }}
                  >
                    <option value="">-- Choose incoming batter from {currentInnings.batting_team_name} --</option>
                    {availableBattersList.map(p => (
                      <option key={p.id} value={p.name}>
                        {p.name} ({p.battingStyle || 'RHB'})
                      </option>
                    ))}
                  </select>
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={nextBatterName}
                    onChange={e => setNextBatterName(e.target.value)}
                    placeholder={`Or type Batter ${currentInnings.wickets + 3}...`}
                    className="input"
                    style={{ flex: 1 }}
                  />
                  <select
                    value={nextBatterBattingStyle}
                    onChange={e => setNextBatterBattingStyle(e.target.value as any)}
                    className="input"
                    style={{ width: 100 }}
                  >
                    <option value="RHB">Right (RHB)</option>
                    <option value="LHB">Left (LHB)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                <button onClick={() => setShowWicketModal(false)} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: 12 }}>Cancel</button>
                <button
                  onClick={() => {
                    handleBallDelivery(0, undefined, 0, true, {
                      type: wicketType,
                      dismissed: dismissedBatter,
                      fielder: fielderName.trim() || undefined,
                      newBatterName: nextBatterName.trim() || `Batter ${currentInnings.wickets + 3}`,
                      newBatterBattingStyle: nextBatterBattingStyle,
                    } as any);
                    setShowWicketModal(false);
                    setFielderName('');
                    setNextBatterName('');
                  }}
                  className="btn btn-primary"
                  style={{ padding: '8px 20px', fontSize: 12, fontWeight: 700, background: '#ef4444' }}
                >
                  Confirm Wicket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bowler Change Modal */}
      {showBowlerModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: 16 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20, maxWidth: 420, width: '100%' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 12px 0' }}>🔄 Select Next Bowler</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
              Choose a bowler from <strong>{currentInnings.bowling_team_name}</strong> for the next over:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {/* Dropdown for bowlers in bowling team */}
              {availableBowlersList.length > 0 && (
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    Available Bowlers ({currentInnings.bowling_team_name})
                  </label>
                  <select
                    className="input"
                    style={{ width: '100%', background: '#1e293b' }}
                    value={availableBowlersList.some(p => p.name === nextBowlerNameInput) ? nextBowlerNameInput : ''}
                    onChange={e => {
                      const selected = e.target.value;
                      setNextBowlerNameInput(selected);
                      const matched = availableBowlersList.find(p => p.name === selected);
                      if (matched?.bowlingStyle) setNextBowlerStyleInput(matched.bowlingStyle);
                    }}
                  >
                    <option value="">-- Choose bowler from {currentInnings.bowling_team_name} --</option>
                    {availableBowlersList.map(p => (
                      <option key={p.id} value={p.name}>
                        {p.name} ({p.bowlingStyle || 'Bowler'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Bowler Name
                </label>
                <input
                  type="text"
                  placeholder="Or enter bowler name..."
                  value={nextBowlerNameInput}
                  onChange={e => setNextBowlerNameInput(e.target.value)}
                  className="input"
                  style={{ width: '100%' }}
                  autoFocus={availableBowlersList.length === 0}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Bowling Style
                </label>
                <select
                  value={nextBowlerStyleInput}
                  onChange={e => setNextBowlerStyleInput(e.target.value)}
                  className="input"
                  style={{ width: '100%' }}
                >
                  <option value="Right-arm fast">Right-arm fast</option>
                  <option value="Right-arm medium">Right-arm medium</option>
                  <option value="Right-arm spin">Right-arm spin / off break</option>
                  <option value="Left-arm fast">Left-arm fast</option>
                  <option value="Slow left-arm orthodox">Slow left-arm orthodox</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setShowBowlerModal(false)} className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: 12 }}>Cancel</button>
              <button
                onClick={() => {
                  const name = nextBowlerNameInput.trim();
                  if (name) {
                    const bId = `bw_${name.toLowerCase().replace(/\s+/g, '_')}`;
                    const inn = JSON.parse(JSON.stringify(currentInnings)) as CricketInnings;
                    if (!inn.bowlers[bId]) {
                      inn.bowlers[bId] = {
                        player_id: bId,
                        player_name: name,
                        bowling_style: nextBowlerStyleInput,
                        overs: 0,
                        balls_bowled: 0,
                        maidens: 0,
                        runs_conceded: 0,
                        wickets: 0,
                        economy: 0,
                        wides: 0,
                        no_balls: 0,
                        dots: 0
                      };
                    } else {
                      inn.bowlers[bId].bowling_style = nextBowlerStyleInput;
                    }
                    const updatedMeta = {
                      ...meta,
                      bowler_name: name,
                      bowler_id: bId,
                      bowler_bowling_style: nextBowlerStyleInput,
                      previous_bowler_id: meta.bowler_id,
                      [currentInningsNum === 1 ? 'innings_1' : 'innings_2']: inn
                    };
                    setMeta(updatedMeta);
                    saveStateToDB(updatedMeta);
                  }
                  setShowBowlerModal(false);
                  setNextBowlerNameInput('');
                }}
                className="btn btn-primary"
                style={{ padding: '6px 18px', fontSize: 12, fontWeight: 700 }}
              >
                Set Bowler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Batters Modal */}
      {showBatterModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: 16 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20, maxWidth: 440, width: '100%' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 8px 0' }}>🏏 Change / Edit Active Batters</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
              Select or edit batters for <strong>{currentInnings.batting_team_name}</strong>:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16 }}>
              {/* Striker */}
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: '#60a5fa', display: 'block', marginBottom: 6 }}>
                  🏏 Striker (On Strike *)
                </label>
                {battingTeamList.length > 0 && (
                  <select
                    className="input"
                    style={{ width: '100%', marginBottom: 6, background: '#1e293b' }}
                    value={battingTeamList.some(p => p.name === editStrikerName) ? editStrikerName : ''}
                    onChange={e => {
                      const sName = e.target.value;
                      setEditStrikerName(sName);
                      const matched = battingTeamList.find(p => p.name === sName);
                      if (matched?.battingStyle) setEditStrikerStyle(matched.battingStyle);
                    }}
                  >
                    <option value="">-- Choose from {currentInnings.batting_team_name} --</option>
                    {battingTeamList.map(p => (
                      <option key={p.id} value={p.name}>
                        {p.name} ({p.battingStyle || 'RHB'})
                      </option>
                    ))}
                  </select>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={editStrikerName}
                    onChange={e => setEditStrikerName(e.target.value)}
                    placeholder="Striker name..."
                    className="input"
                    style={{ flex: 1 }}
                  />
                  <select
                    value={editStrikerStyle}
                    onChange={e => setEditStrikerStyle(e.target.value as any)}
                    className="input"
                    style={{ width: 100 }}
                  >
                    <option value="RHB">RHB</option>
                    <option value="LHB">LHB</option>
                  </select>
                </div>
              </div>

              {/* Non-Striker */}
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: '#cbd5e1', display: 'block', marginBottom: 6 }}>
                  🏃 Non-Striker
                </label>
                {battingTeamList.length > 0 && (
                  <select
                    className="input"
                    style={{ width: '100%', marginBottom: 6, background: '#1e293b' }}
                    value={battingTeamList.some(p => p.name === editNonStrikerName) ? editNonStrikerName : ''}
                    onChange={e => {
                      const nsName = e.target.value;
                      setEditNonStrikerName(nsName);
                      const matched = battingTeamList.find(p => p.name === nsName);
                      if (matched?.battingStyle) setEditNonStrikerStyle(matched.battingStyle);
                    }}
                  >
                    <option value="">-- Choose from {currentInnings.batting_team_name} --</option>
                    {battingTeamList.map(p => (
                      <option key={p.id} value={p.name}>
                        {p.name} ({p.battingStyle || 'RHB'})
                      </option>
                    ))}
                  </select>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={editNonStrikerName}
                    onChange={e => setEditNonStrikerName(e.target.value)}
                    placeholder="Non-striker name..."
                    className="input"
                    style={{ flex: 1 }}
                  />
                  <select
                    value={editNonStrikerStyle}
                    onChange={e => setEditNonStrikerStyle(e.target.value as any)}
                    className="input"
                    style={{ width: 100 }}
                  >
                    <option value="RHB">RHB</option>
                    <option value="LHB">LHB</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setShowBatterModal(false)} className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: 12 }}>Cancel</button>
              <button
                onClick={() => {
                  const sName = editStrikerName.trim() || meta.striker_name;
                  const nsName = editNonStrikerName.trim() || meta.non_striker_name;
                  const inn = JSON.parse(JSON.stringify(currentInnings)) as CricketInnings;

                  // Update or create striker in inn.batters
                  let sId = meta.striker_id;
                  if (!inn.batters[sId] || inn.batters[sId].player_name !== sName) {
                    sId = `b_${sName.toLowerCase().replace(/\s+/g, '_')}`;
                    if (!inn.batters[sId]) {
                      inn.batters[sId] = {
                        player_id: sId,
                        player_name: sName,
                        batting_style: editStrikerStyle,
                        runs: 0,
                        balls_faced: 0,
                        fours: 0,
                        sixes: 0,
                        strike_rate: 0,
                        is_out: false
                      };
                    }
                  } else {
                    inn.batters[sId].batting_style = editStrikerStyle;
                  }

                  // Update or create non-striker in inn.batters
                  let nsId = meta.non_striker_id;
                  if (!inn.batters[nsId] || inn.batters[nsId].player_name !== nsName) {
                    nsId = `b_${nsName.toLowerCase().replace(/\s+/g, '_')}`;
                    if (!inn.batters[nsId]) {
                      inn.batters[nsId] = {
                        player_id: nsId,
                        player_name: nsName,
                        batting_style: editNonStrikerStyle,
                        runs: 0,
                        balls_faced: 0,
                        fours: 0,
                        sixes: 0,
                        strike_rate: 0,
                        is_out: false
                      };
                    }
                  } else {
                    inn.batters[nsId].batting_style = editNonStrikerStyle;
                  }

                  const updatedMeta = {
                    ...meta,
                    striker_id: sId,
                    striker_name: sName,
                    striker_batting_style: editStrikerStyle,
                    non_striker_id: nsId,
                    non_striker_name: nsName,
                    non_striker_batting_style: editNonStrikerStyle,
                    [currentInningsNum === 1 ? 'innings_1' : 'innings_2']: inn
                  };
                  setMeta(updatedMeta);
                  saveStateToDB(updatedMeta);
                  setShowBatterModal(false);
                }}
                className="btn btn-primary"
                style={{ padding: '6px 18px', fontSize: 12, fontWeight: 700 }}
              >
                Save Batters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Wagon Wheel Zone Modal */}
      {showWagonWheelModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: 16 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20, maxWidth: 420, width: '100%', textAlign: 'center' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 8px 0', color: '#38bdf8' }}>🎯 Wagon Wheel Direction</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 14px 0' }}>Where was this shot hit?</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
              {[
                { zone: 'third_man', label: 'Third Man' },
                { zone: 'point', label: 'Point' },
                { zone: 'cover', label: 'Cover' },
                { zone: 'extra_cover', label: 'Ex Cover' },
                { zone: 'long_off', label: 'Long Off' },
                { zone: 'long_on', label: 'Long On' },
                { zone: 'mid_wicket', label: 'Mid Wicket' },
                { zone: 'square_leg', label: 'Square Leg' },
                { zone: 'fine_leg', label: 'Fine Leg' },
              ].map(item => (
                <button
                  key={item.zone}
                  onClick={() => handleSelectWagonZone(item.zone as any)}
                  className="btn btn-secondary"
                  style={{ padding: '10px 4px', fontSize: 11, fontWeight: 700 }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <button onClick={() => setShowWagonWheelModal(false)} className="btn btn-ghost" style={{ fontSize: 12 }}>Skip Wagon Wheel</button>
          </div>
        </div>
      )}

      {/* Rules & Custom Config Modal */}
      {showConfigModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: 16 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 22, maxWidth: 400, width: '100%' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 14px 0' }}>⚙️ Cricket Rules Setup</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>Overs Per Innings</label>
                <input
                  type="number" min="1" max="50"
                  value={meta.overs_per_innings}
                  onChange={e => {
                    const ov = parseInt(e.target.value, 10) || 20;
                    setMeta(prev => ({
                      ...prev,
                      overs_per_innings: ov,
                      innings_1: { ...prev.innings_1, max_overs: ov },
                      innings_2: prev.innings_2 ? { ...prev.innings_2, max_overs: ov } : undefined
                    }));
                  }}
                  className="input" style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>Players per Team</label>
                <input
                  type="number" min="4" max="15"
                  value={meta.custom_rules.players_per_side}
                  onChange={e => {
                    const p = parseInt(e.target.value, 10) || 11;
                    setMeta(prev => ({ ...prev, custom_rules: { ...prev.custom_rules, players_per_side: p } }));
                  }}
                  className="input" style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                  <input
                    type="checkbox"
                    checked={meta.custom_rules.free_hit_on_no_ball}
                    onChange={e => setMeta(prev => ({ ...prev, custom_rules: { ...prev.custom_rules, free_hit_on_no_ball: e.target.checked } }))}
                  />
                  Free Hit on No-Ball
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <button onClick={() => setShowConfigModal(false)} className="btn btn-primary" style={{ padding: '8px 20px', fontWeight: 700 }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Declare Winner Modal */}
      {showDeclareWinnerModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: 16 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 22, maxWidth: 380, width: '100%', textAlign: 'center' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 12px 0' }}>🏆 Declare Match Winner</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              Select the winning team to conclude match:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={() => {
                  setShowDeclareWinnerModal(false);
                  saveStateToDB(meta, 'completed', match.player1_id);
                }}
                className="btn btn-primary"
                style={{ padding: 12, fontSize: 13, fontWeight: 800 }}
              >
                🔵 {match.player1_name} Wins
              </button>
              <button
                onClick={() => {
                  setShowDeclareWinnerModal(false);
                  saveStateToDB(meta, 'completed', match.player2_id);
                }}
                className="btn btn-primary"
                style={{ padding: 12, fontSize: 13, fontWeight: 800, background: '#10b981' }}
              >
                🟢 {match.player2_name} Wins
              </button>
              <button onClick={() => setShowDeclareWinnerModal(false)} className="btn btn-secondary" style={{ marginTop: 6 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* CricHeroes Scorecard & Commentary Preview Modal */}
      {showScorecardPreview && (
        <CricketMatchModal
          match={{ ...match, sport_metadata: meta }}
          tournament={tournament}
          event={event}
          onClose={() => setShowScorecardPreview(false)}
        />
      )}

      {/* Match Media Hub (Umpire & Broadcaster Upload Modal) */}
      {showMediaModal && (
        <MatchMediaModal
          match={match}
          onClose={() => setShowMediaModal(false)}
        />
      )}

      {/* Broadcast Screen / Overlay Link Modal */}
      {showOverlayModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: 16 }}>
          <div style={{ background: '#0b1329', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 16, padding: 22, maxWidth: 540, width: '100%', color: '#f8fafc', boxShadow: '0 25px 60px rgba(0,0,0,0.7)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <span style={{ fontSize: 10, fontWeight: 800, background: '#38bdf8', color: '#0f172a', padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase' }}>
                  📡 Broadcast & Overlay Studio
                </span>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: '6px 0 0 0' }}>
                  CricHeroes Overlay & Stadium TV
                </h3>
              </div>
              <button
                onClick={() => setShowOverlayModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: 16, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16, lineHeight: 1.5 }}>
              Use these live URLs for OBS Studio, vMix browser source, or arena big-screen displays. All score changes update in real time with zero delay.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 18 }}>
              {/* Cricket OBS Lower-Third */}
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#38bdf8' }}>
                    🏏 CricHeroes Lower-Third Overlay (OBS / vMix)
                  </span>
                  <a
                    href={`/overlay/cricket?matchId=${match.id}&theme=ipl&position=bottom`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 11, color: '#38bdf8', textDecoration: 'none', fontWeight: 700 }}
                  >
                    Open Preview ↗
                  </a>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    readOnly
                    value={typeof window !== 'undefined' ? `${window.location.origin}/overlay/cricket?matchId=${match.id}&theme=ipl&position=bottom` : `/overlay/cricket?matchId=${match.id}&theme=ipl`}
                    className="input"
                    style={{ flex: 1, fontSize: 11, background: '#020617', color: '#cbd5e1' }}
                  />
                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        navigator.clipboard.writeText(`${window.location.origin}/overlay/cricket?matchId=${match.id}&theme=ipl&position=bottom`);
                        alert('Copied CricHeroes OBS Overlay URL to clipboard!');
                      }
                    }}
                    className="btn btn-secondary"
                    style={{ fontSize: 11, padding: '0 12px' }}
                  >
                    📋 Copy
                  </button>
                </div>
              </div>

              {/* Stadium TV Arena Screen */}
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#34d399' }}>
                    📺 Stadium TV • Cricket Big Screen
                  </span>
                  <a
                    href={`/scoreboard?matchId=${match.id}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 11, color: '#34d399', textDecoration: 'none', fontWeight: 700 }}
                  >
                    Open Screen ↗
                  </a>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    readOnly
                    value={typeof window !== 'undefined' ? `${window.location.origin}/scoreboard?matchId=${match.id}` : `/scoreboard?matchId=${match.id}`}
                    className="input"
                    style={{ flex: 1, fontSize: 11, background: '#020617', color: '#cbd5e1' }}
                  />
                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        navigator.clipboard.writeText(`${window.location.origin}/scoreboard?matchId=${match.id}`);
                        alert('Copied Stadium TV URL to clipboard!');
                      }
                    }}
                    className="btn btn-secondary"
                    style={{ fontSize: 11, padding: '0 12px' }}
                  >
                    📋 Copy
                  </button>
                </div>
              </div>

              {/* Mobile Broadcaster Camera Studio */}
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#f43f5e' }}>
                    📹 Broadcaster Studio (Phone/Webcam stream + Live Score)
                  </span>
                  <a
                    href={`/dashboard/broadcast?matchId=${match.id}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 11, color: '#f43f5e', textDecoration: 'none', fontWeight: 700 }}
                  >
                    Launch Studio ↗
                  </a>
                </div>
                <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>
                  Turn any smartphone or laptop into a live camera streamer with real-time CricHeroes overlay burned onto video.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowOverlayModal(false)}
                className="btn btn-primary"
                style={{ padding: '8px 20px', fontSize: 12 }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
