'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Match, Tournament, TournamentEvent, Team } from '@/types';
import { getMatches, getTournaments, getEvents, uploadMatchMedia, getAllTeams } from '@/lib/supabase-service';
import { useAuth } from '@/lib/auth-context';
import ShuttlecockLoader from '@/components/ShuttlecockLoader';
import { IconShuttlecock } from '@/components/icons';
import { useSport } from '@/lib/sport-context';
import { formatTennisGameScore, getTableTennisServer, CricketMetadata, CricketInnings } from '@/lib/sports-rules';
import { getTeamLogo, registerTeamLogo } from '@/lib/team-logos';

export default function BroadcastStudioPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { activeSport } = useSport();

  const initialMatchId = searchParams.get('matchId') || '';

  // ── Data State ──
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [events, setEvents] = useState<TournamentEvent[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatchId, setSelectedMatchId] = useState(initialMatchId);
  const [recordingOrientation, setRecordingOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [overlayTheme, setOverlayTheme] = useState<'ipl' | 'icc' | 'classic'>('ipl');

  // ── Automatic Fullscreen Scoreboard Overlay State & Event Detection ──
  const [showFullScoreboard, setShowFullScoreboard] = useState(false);
  const [fullScoreboardTitle, setFullScoreboardTitle] = useState('');
  const [fullScoreboardCountdown, setFullScoreboardCountdown] = useState(0);
  const fullScoreboardTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fullScoreboardCountdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const showFullScoreboardRef = useRef(false);
  const fullScoreboardTitleRef = useRef('');

  // Keep track of previous cricket state to detect 4/6, wickets, over completion, and inning/match completion
  const prevCricketStateRef = useRef<{
    totalDeliveries: number;
    ballsBowled: number;
    wickets: number;
    currentInnings: number;
    matchStatus: string;
    lastBallId?: string;
  } | null>(null);

  // ── Camera State ──
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // ── Recording State ──
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingDurationRef = useRef(0);

  const formatDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    const formattedMins = mins.toString().padStart(2, '0');
    const formattedSecs = secs.toString().padStart(2, '0');
    
    if (hrs > 0) {
      return `${hrs}:${formattedMins}:${formattedSecs}`;
    }
    return `${formattedMins}:${formattedSecs}`;
  };

  // ── Canvas Overlay Recording Refs ──
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recordingLoopRef = useRef<number | null>(null);
  const matchStateRef = useRef<{
    match: Match | null;
    tournament: Tournament | null;
    event: TournamentEvent | null;
    p1Sets: number;
    p2Sets: number;
    completedSets: any[];
    currentSet: any;
  }>({
    match: null,
    tournament: null,
    event: null,
    p1Sets: 0,
    p2Sets: 0,
    completedSets: [],
    currentSet: null,
  });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const scorecardRef = useRef<HTMLDivElement | null>(null);

  const toggleFullscreen = useCallback(() => {
    const container = scorecardRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => {
        setIsFullscreen(true);
        if (screen.orientation && (screen.orientation as any).lock) {
          const lockOrientation = recordingOrientation === 'landscape' ? 'landscape' : 'portrait';
          (screen.orientation as any).lock(lockOrientation).catch((err: any) => {
            console.log('Orientation lock failed:', err);
          });
        }
      }).catch(err => {
        console.error('Fullscreen request failed:', err);
        setIsFullscreen(true);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
        if (screen.orientation && screen.orientation.unlock) {
          screen.orientation.unlock();
        }
      }).catch(err => {
        console.error('Exit fullscreen failed:', err);
        setIsFullscreen(false);
      });
    }
  }, [recordingOrientation]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      if (!isFull) {
        if (screen.orientation && screen.orientation.unlock) {
          screen.orientation.unlock();
        }
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // ── YouTube Link State ──
  const [ytUrl, setYtUrl] = useState('');
  const [ytSaving, setYtSaving] = useState(false);
  const [ytSaved, setYtSaved] = useState(false);
  const [ytError, setYtError] = useState<string | null>(null);

  // ── Toast ──
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // ── Load data ──
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [mats, tours, evs, tms] = await Promise.all([
          getMatches(),
          getTournaments(),
          getEvents(),
          getAllTeams(),
        ]);
        setAllMatches(mats);
        setTournaments(tours);
        setEvents(evs);
        setTeams(tms || []);

        // Register logos for dynamic teams
        (tms || []).forEach(team => {
          if (team.name && team.logo_url) {
            registerTeamLogo(team.name, team.logo_url);
          }
        });
      } catch (err) {
        console.error('Failed to load broadcast studio data:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Trigger Fullscreen Scoreboard takeover for specified seconds
  const triggerFullscreenScoreboard = useCallback((title: string, durationSec: number) => {
    if (fullScoreboardTimerRef.current) clearTimeout(fullScoreboardTimerRef.current);
    if (fullScoreboardCountdownTimerRef.current) clearInterval(fullScoreboardCountdownTimerRef.current);

    setShowFullScoreboard(true);
    setFullScoreboardTitle(title);
    setFullScoreboardCountdown(durationSec);
    showFullScoreboardRef.current = true;
    fullScoreboardTitleRef.current = title;

    fullScoreboardCountdownTimerRef.current = setInterval(() => {
      setFullScoreboardCountdown(prev => {
        if (prev <= 1) {
          if (fullScoreboardCountdownTimerRef.current) clearInterval(fullScoreboardCountdownTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    fullScoreboardTimerRef.current = setTimeout(() => {
      setShowFullScoreboard(false);
      showFullScoreboardRef.current = false;
      if (fullScoreboardCountdownTimerRef.current) clearInterval(fullScoreboardCountdownTimerRef.current);
    }, durationSec * 1000);
  }, []);

  // ── Live score polling & SSE stream for real-time responsiveness ──
  useEffect(() => {
    if (!selectedMatchId) return;

    // SSE connection
    let sseSource: EventSource | null = null;
    try {
      sseSource = new EventSource(`/api/v1/live/match/${selectedMatchId}`);
      sseSource.addEventListener('match-update', (event: any) => {
        try {
          const updatedMatch = JSON.parse(event.data);
          if (updatedMatch && updatedMatch.id === selectedMatchId) {
            setAllMatches(prev => prev.map(m => m.id === selectedMatchId ? { ...m, ...updatedMatch } : m));
          }
        } catch {}
      });
    } catch {}

    const interval = setInterval(async () => {
      try {
        const mats = await getMatches();
        setAllMatches(mats);
      } catch {}
    }, 2000);

    return () => {
      if (sseSource) sseSource.close();
      clearInterval(interval);
    };
  }, [selectedMatchId]);

  // Reset selected match if it doesn't match the new sport context
  useEffect(() => {
    if (activeSport === 'all' || !selectedMatchId) return;
    const match = allMatches.find(m => m.id === selectedMatchId);
    if (match && match.sport !== activeSport) {
      setSelectedMatchId('');
      const sps = new URLSearchParams(window.location.search);
      sps.delete('matchId');
      router.replace(`${window.location.pathname}?${sps.toString()}`);
    }
  }, [activeSport, allMatches, selectedMatchId, router]);

  const liveMatches = allMatches.filter(m => {
    const matchesSport = activeSport === 'all' || m.sport === activeSport;
    return matchesSport && (m.status === 'running' || m.status === 'paused');
  });
  const selectedMatch = allMatches.find(m => m.id === selectedMatchId) || null;
  const selectedTournament = selectedMatch ? tournaments.find(t => t.id === selectedMatch.tournament_id) : null;
  const selectedEvent = selectedMatch ? events.find(e => e.id === selectedMatch.event_id) : null;

  // Active set computation: first incomplete set, or last set if all are complete
  const currentSet = selectedMatch?.sets?.find(s => !s.is_complete) || selectedMatch?.sets?.[selectedMatch.sets.length - 1];
  const p1Sets = selectedMatch?.sets?.filter(s => s.is_complete && (s.winner_id === selectedMatch.player1_id || s.winner_id === 'player1')).length ?? 0;
  const p2Sets = selectedMatch?.sets?.filter(s => s.is_complete && (s.winner_id === selectedMatch.player2_id || s.winner_id === 'player2')).length ?? 0;
  const completedSets = selectedMatch?.sets?.filter(s => s.is_complete) ?? [];

  const tennisMeta = selectedMatch?.sport_metadata;
  const p1GamePoints = tennisMeta?.player1_game_points ?? 0;
  const p2GamePoints = tennisMeta?.player2_game_points ?? 0;
  const gameInProgress = selectedMatch?.sport === 'tennis' && (p1GamePoints > 0 || p2GamePoints > 0);

  const tennisScores = (selectedMatch?.sport === 'tennis' && tennisMeta) ? formatTennisGameScore(
    p1GamePoints,
    p2GamePoints,
    !!tennisMeta.in_tiebreak
  ) : { p1: '0', p2: '0' };
  const tennisP1Points = tennisScores.p1;
  const tennisP2Points = tennisScores.p2;

  const getServeIndicator = (sport: string | undefined) => {
    if (sport === 'tennis') return '🥎';
    if (sport === 'table_tennis') return '🏓';
    if (sport === 'squash') return '🎾';
    if (sport === 'badminton') return '🏸';
    return '●';
  };

  let servingTeam: 'player1' | 'player2' | null = null;
  if (selectedMatch) {
    if (selectedMatch.sport === 'tennis' || selectedMatch.sport === 'squash' || selectedMatch.sport === 'badminton') {
      servingTeam = selectedMatch.sport_metadata?.serving_team || selectedMatch.sport_metadata?.initial_server || 'player1';
    } else if (selectedMatch.sport === 'table_tennis') {
      const activeSet = selectedMatch.sets?.[selectedMatch.sets.length - 1];
      const p1Score = activeSet?.player1_score ?? 0;
      const p2Score = activeSet?.player2_score ?? 0;
      const ttInitialServer = selectedMatch.sport_metadata?.initial_server || 'player1';
      const ttFormat = selectedMatch.sport_metadata?.scoring_format || '11-point';
      servingTeam = getTableTennisServer(p1Score, p2Score, ttInitialServer, ttFormat);
    }
  }

  // Sync state values to ref for canvas drawing loop
  useEffect(() => {
    matchStateRef.current = {
      match: selectedMatch,
      tournament: selectedTournament || null,
      event: selectedEvent || null,
      p1Sets,
      p2Sets,
      completedSets,
      currentSet: currentSet || null,
    };
  }, [selectedMatch, selectedTournament, selectedEvent, p1Sets, p2Sets, completedSets, currentSet]);

  // ── Automatic Cricket Event Monitor for Fullscreen Scoreboard Takeover ──
  useEffect(() => {
    if (!selectedMatch || selectedMatch.sport !== 'cricket') return;
    const cMeta = selectedMatch.sport_metadata as CricketMetadata | undefined;
    if (!cMeta) return;

    const currentInnNum = cMeta.current_innings || 1;
    const inn = currentInnNum === 1 ? cMeta.innings_1 : (cMeta.innings_2 || cMeta.innings_1);
    if (!inn) return;

    const deliveries = inn.deliveries || [];
    const totalDeliveries = deliveries.length;
    const ballsBowled = inn.balls_bowled || 0;
    const wickets = inn.wickets || 0;
    const matchStatus = selectedMatch.status;
    const lastBall = deliveries.length > 0 ? deliveries[deliveries.length - 1] : null;

    const prev = prevCricketStateRef.current;
    if (!prev) {
      // First initialize
      prevCricketStateRef.current = {
        totalDeliveries,
        ballsBowled,
        wickets,
        currentInnings: currentInnNum,
        matchStatus,
        lastBallId: lastBall?.id,
      };
      return;
    }

    // 1. Check Match Finish or Inning Finish (30 seconds display)
    if (matchStatus === 'completed' && prev.matchStatus !== 'completed') {
      triggerFullscreenScoreboard('MATCH COMPLETED', 30);
    } else if (currentInnNum > prev.currentInnings) {
      triggerFullscreenScoreboard('INNINGS BREAK / INNINGS FINISHED', 30);
    }
    // 2. Check Wicket / Player Out (12 seconds display)
    else if (wickets > prev.wickets || (lastBall && lastBall.id !== prev.lastBallId && lastBall.is_wicket)) {
      const wicketType = lastBall?.wicket_type ? ` (${lastBall.wicket_type.toUpperCase()})` : '';
      triggerFullscreenScoreboard(`PLAYER OUT - WICKET!${wicketType}`, 12);
    }
    // 3. Check Over Finish (6 seconds display) - ballsBowled multiple of 6 and increased
    else if (ballsBowled > prev.ballsBowled && ballsBowled % 6 === 0) {
      const overNum = ballsBowled / 6;
      triggerFullscreenScoreboard(`END OF OVER ${overNum}`, 6);
    }
    // 4. Check Boundary: 4 or 6 (6 seconds display)
    else if (lastBall && lastBall.id !== prev.lastBallId && (lastBall.runs_off_bat === 4 || lastBall.runs_off_bat === 6)) {
      const runText = lastBall.runs_off_bat === 6 ? '🚀 MAXIMUM 6 RUNS!' : '💥 FOUR! BOUNDARY';
      triggerFullscreenScoreboard(runText, 6);
    }

    // Update ref
    prevCricketStateRef.current = {
      totalDeliveries,
      ballsBowled,
      wickets,
      currentInnings: currentInnNum,
      matchStatus,
      lastBallId: lastBall?.id,
    };
  }, [selectedMatch, triggerFullscreenScoreboard]);

  // ── Camera ──
  const startCamera = useCallback(async (facing: 'user' | 'environment' = facingMode) => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      // Request both audio and video for rich recording, fallback gracefully to video-only if mic fails
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
      } catch (audioErr) {
        console.warn('Audio capture failed, falling back to video-only stream:', audioErr);
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err: any) {
      const msg = err?.name === 'NotAllowedError'
        ? 'Camera permission denied. Please allow camera access in your browser settings.'
        : err?.name === 'NotFoundError'
        ? 'No camera found on this device.'
        : 'Could not start camera: ' + err.message;
      setCameraError(msg);
      setCameraActive(false);
    }
  }, [facingMode]);

  // ── Recording Handlers ──
  // ── Recording Handlers ──
  const startRecording = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !streamRef.current) return;
    recordedChunksRef.current = [];
    
    // Choose compatible mimetype, fallback progressively
    let options = { mimeType: 'video/webm;codecs=vp9,opus' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: 'video/webm;codecs=vp8,opus' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'video/webm' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options = { mimeType: 'video/mp4' }; // Safari compatibility
        }
      }
    }

    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Start canvas drawing loop
      const render = () => {
        if (video.readyState >= 2) {
          // Set canvas dimensions based on chosen orientation
          const targetW = recordingOrientation === 'portrait' ? 720 : 1280;
          const targetH = recordingOrientation === 'portrait' ? 1280 : 720;
          if (canvas.width !== targetW || canvas.height !== targetH) {
            canvas.width = targetW;
            canvas.height = targetH;
          }

          // Cover crop algorithm to draw camera stream onto canvas without distortion
          const imgW = video.videoWidth;
          const imgH = video.videoHeight;
          const cw = canvas.width;
          const ch = canvas.height;
          
          if (imgW && imgH) {
            const videoRatio = imgW / imgH;
            const canvasRatio = cw / ch;
            let sx = 0, sy = 0, sw = imgW, sh = imgH;
            
            if (videoRatio > canvasRatio) {
              // Video is wider than canvas -> crop sides
              sw = imgH * canvasRatio;
              sx = (imgW - sw) / 2;
            } else {
              // Video is taller than canvas -> crop top/bottom
              sh = imgW / canvasRatio;
              sy = (imgH - sh) / 2;
            }
            ctx.drawImage(video, sx, sy, sw, sh, 0, 0, cw, ch);
          } else {
            ctx.drawImage(video, 0, 0, cw, ch);
          }
          
          // Draw REC & timer badge on canvas in top-left
          ctx.save();
          ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
          const recW = 100;
          const recH = 30;
          const recX = 24;
          const recY = 24;
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(recX, recY, recW, recH, 6);
          } else {
            ctx.rect(recX, recY, recW, recH);
          }
          ctx.fill();

          // Draw blinking red dot based on timestamp
          const blink = Math.floor(Date.now() / 500) % 2 === 0;
          ctx.fillStyle = blink ? '#ef4444' : 'rgba(239, 68, 68, 0.3)';
          ctx.beginPath();
          ctx.arc(recX + 15, recY + 15, 4, 0, 2 * Math.PI);
          ctx.fill();

          // Draw duration text
          ctx.fillStyle = '#ffffff';
          ctx.font = `bold 12px monospace, system-ui, sans-serif`;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(formatDuration(recordingDurationRef.current), recX + 26, recY + 15);
          ctx.restore();

          // Draw scoreboard overlay onto canvas
          const state = matchStateRef.current;
          if (state.match) {
            if (recordingOrientation === 'landscape') {
              // LANDSCAPE COMPACT SLIM TICKER (Height: 60px, bottom aligned)
              const tickerH = 60;
              const tickerY = canvas.height - tickerH;

              // Background
              ctx.fillStyle = 'rgba(10, 10, 15, 0.85)';
              ctx.fillRect(0, tickerY, canvas.width, tickerH);

              // Top border line
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(0, tickerY);
              ctx.lineTo(canvas.width, tickerY);
              ctx.stroke();

              // Left part: Tournament name
              ctx.textAlign = 'left';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
              ctx.font = `bold 13px system-ui, sans-serif`;
              const tourName = state.tournament ? state.tournament.name : 'MATCHPOINT';
              const evName = state.event?.event_name ? ` · ${state.event.event_name}` : '';
              const tourText = `${tourName.toUpperCase()}${evName.toUpperCase()}`;
              let truncatedTour = tourText;
              if (ctx.measureText(tourText).width > 300) {
                truncatedTour = tourText.substring(0, 28) + '...';
              }
              ctx.fillText(truncatedTour, 24, tickerY + 30);

              // Right part: Set & Court info
              ctx.textAlign = 'right';
              ctx.textBaseline = 'middle';
              ctx.font = `bold 12px system-ui, sans-serif`;
              if (state.match.status === 'paused') {
                ctx.fillStyle = '#f59e0b';
                ctx.fillText('⏸ PAUSED  ·  ', canvas.width - 24 - ctx.measureText(`Set ${state.match.sets.length}`).width - (state.match.court ? 100 : 0), tickerY + 30);
              }
              ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
              ctx.font = `13px system-ui, sans-serif`;
              let infoText = `Set ${state.match.sets.length}`;
              if (state.match.court) {
                infoText += ` · 📍 ${state.match.court}`;
              }
              if (state.completedSets.length > 0) {
                const history = state.completedSets.map((s: any) => `${s.player1_score}-${s.player2_score}`).join(', ');
                infoText += `  (${history})`;
              }
              ctx.fillText(infoText, canvas.width - 24, tickerY + 30);

              // Center part: Live scores ticker
              const centerX = canvas.width / 2;

              // VS separator
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
              ctx.font = `bold 11px system-ui, sans-serif`;
              ctx.fillText('VS', centerX, tickerY + 30);

              // Score 1 (Player 1) background and number
              ctx.fillStyle = 'rgba(37, 99, 235, 0.15)'; // Blue background
              ctx.fillRect(centerX - 65, tickerY + 15, 36, 30);
              ctx.fillStyle = '#2563eb'; // Blue score color
              ctx.font = `900 18px monospace, sans-serif`;
              ctx.textAlign = 'center';
              ctx.fillText(String(state.currentSet?.player1_score ?? 0), centerX - 47, tickerY + 30);

              // Score 2 (Player 2) background and number
              ctx.fillStyle = 'rgba(16, 185, 129, 0.15)'; // Green background
              ctx.fillRect(centerX + 29, tickerY + 15, 36, 30);
              ctx.fillStyle = '#10b981'; // Green score color
              ctx.font = `900 18px monospace, sans-serif`;
              ctx.textAlign = 'center';
              ctx.fillText(String(state.currentSet?.player2_score ?? 0), centerX + 47, tickerY + 30);

              // Player 1 Name & Sets Won
              ctx.textAlign = 'right';
              ctx.fillStyle = '#ffffff';
              ctx.font = `bold 14px system-ui, sans-serif`;
              const p1Name = state.match.player1_name;
              ctx.fillText(p1Name, centerX - 75, tickerY + 30);

              if (state.p1Sets > 0) {
                const nameW = ctx.measureText(p1Name).width;
                ctx.fillStyle = '#86efac';
                ctx.font = `12px system-ui, sans-serif`;
                ctx.fillText('●'.repeat(state.p1Sets), centerX - 85 - nameW, tickerY + 30);
              }

              // Player 2 Name & Sets Won
              ctx.textAlign = 'left';
              ctx.fillStyle = '#ffffff';
              ctx.font = `bold 14px system-ui, sans-serif`;
              const p2Name = state.match.player2_name;
              ctx.fillText(p2Name, centerX + 75, tickerY + 30);

              if (state.p2Sets > 0) {
                const nameW = ctx.measureText(p2Name).width;
                ctx.fillStyle = '#86efac';
                ctx.font = `12px system-ui, sans-serif`;
                ctx.fillText('●'.repeat(state.p2Sets), centerX + 85 + nameW, tickerY + 30);
              }
            } else {
              // PORTRAIT STACKED LAYOUT (Matches original implementation style but refined)
              const scale = Math.max(canvas.width, canvas.height) / 1280;
              const padX = 24 * scale;
              
              // Draw bottom gradient background
              const gradHeight = Math.min(canvas.height * 0.35, 250 * scale);
              const grad = ctx.createLinearGradient(0, canvas.height - gradHeight, 0, canvas.height);
              grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
              grad.addColorStop(0.3, 'rgba(0, 0, 0, 0.6)');
              grad.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
              ctx.fillStyle = grad;
              ctx.fillRect(0, canvas.height - gradHeight, canvas.width, gradHeight);

              // Draw tournament/event info
              if (state.tournament && state.event) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.font = `bold ${Math.round(20 * scale)}px system-ui, -apple-system, sans-serif`;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                const text = `${state.tournament.name.toUpperCase()} · ${(state.event.event_name || '').toUpperCase()}`;
                ctx.fillText(text, padX, canvas.height - gradHeight + 20 * scale);
              }

              // Draw player scores
              const scoreStartTop = canvas.height - Math.min(canvas.height * 0.25, 180 * scale);
              const rowHeight = 48 * scale;

              const drawPlayerRow = (playerIndex: number, name: string, score: number, setsWon: number, badgeGradientColors: string[]) => {
                const rowY = scoreStartTop + playerIndex * rowHeight;
                
                // Draw badge
                const badgeSize = 28 * scale;
                const badgeX = padX;
                const badgeY = rowY + (rowHeight - badgeSize) / 2;
                
                ctx.save();
                const radius = 6 * scale;
                ctx.beginPath();
                if (ctx.roundRect) {
                  ctx.roundRect(badgeX, badgeY, badgeSize, badgeSize, radius);
                } else {
                  ctx.rect(badgeX, badgeY, badgeSize, badgeSize);
                }
                ctx.clip();
                const badgeGrad = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeSize, badgeY + badgeSize);
                badgeGrad.addColorStop(0, badgeGradientColors[0]);
                badgeGrad.addColorStop(1, badgeGradientColors[1]);
                ctx.fillStyle = badgeGrad;
                ctx.fill();
                ctx.restore();
                
                // Badge text
                ctx.fillStyle = '#ffffff';
                ctx.font = `bold ${Math.round(16 * scale)}px system-ui, sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(name.charAt(0).toUpperCase(), badgeX + badgeSize / 2, badgeY + badgeSize / 2);
                
                // Player name - increased font size
                ctx.fillStyle = playerIndex === 0 ? '#ffffff' : 'rgba(255, 255, 255, 0.85)';
                ctx.font = `bold ${Math.round(26 * scale)}px system-ui, sans-serif`;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                const nameX = badgeX + badgeSize + 12 * scale;
                ctx.fillText(name, nameX, rowY + rowHeight / 2);
                
                const nameWidth = ctx.measureText(name).width;
                
                // Sets won indicator (dots)
                if (setsWon > 0) {
                  ctx.fillStyle = '#86efac';
                  ctx.font = `${Math.round(22 * scale)}px system-ui, sans-serif`;
                  ctx.textAlign = 'left';
                  ctx.textBaseline = 'middle';
                  ctx.fillText('●'.repeat(setsWon), nameX + nameWidth + 10 * scale, rowY + rowHeight / 2);
                }
                
                // Score text - increased font size
                ctx.fillStyle = playerIndex === 0 ? '#ffffff' : 'rgba(255, 255, 255, 0.75)';
                ctx.font = `900 ${Math.round(56 * scale)}px monospace, sans-serif`;
                ctx.textAlign = 'right';
                ctx.textBaseline = 'middle';
                ctx.fillText(String(score), canvas.width - padX, rowY + rowHeight / 2);
              };

              // Player 1 row
              drawPlayerRow(0, state.match.player1_name, state.currentSet?.player1_score ?? 0, state.p1Sets, ['#2563eb', '#3b82f6']);
              // Player 2 row
              drawPlayerRow(1, state.match.player2_name, state.currentSet?.player2_score ?? 0, state.p2Sets, ['#10b981', '#059669']);

              // Set info & court bottom row
              const bottomRowY = scoreStartTop + 2 * rowHeight + 10 * scale;
              
              // Draw status dot (amber if paused, red if running)
              ctx.fillStyle = state.match.status === 'paused' ? '#f59e0b' : '#f43f5e';
              ctx.beginPath();
              ctx.arc(padX + 5 * scale, bottomRowY, 4 * scale, 0, 2 * Math.PI);
              ctx.fill();
              
              ctx.fillStyle = state.match.status === 'paused' ? '#f59e0b' : 'rgba(255, 255, 255, 0.4)';
              ctx.font = `${Math.round(16 * scale)}px system-ui, sans-serif`;
              ctx.textAlign = 'left';
              ctx.textBaseline = 'middle';
              ctx.fillText(state.match.status === 'paused' ? `PAUSED · Set ${state.match.sets.length}` : `Set ${state.match.sets.length}`, padX + 15 * scale, bottomRowY);
              
              let textX = padX + 80 * scale;
              if (state.match.court) {
                ctx.fillText(`📍 ${state.match.court}`, textX, bottomRowY);
                textX += 120 * scale;
              }
              
              if (state.completedSets.length > 0) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
                const setsText = state.completedSets.map((s: any) => `${s.player1_score}-${s.player2_score}`).join('   ');
                ctx.fillText(setsText, textX, bottomRowY);
              }
            }
          }
        }
        recordingLoopRef.current = requestAnimationFrame(render);
      };

      // Call initial render frame
      render();

      // Capture canvas stream at 30fps
      const canvasStream = (canvas as any).captureStream ? (canvas as any).captureStream(30) : (canvas as HTMLCanvasElement).captureStream(30);
      const combinedStream = new MediaStream();
      canvasStream.getVideoTracks().forEach((track: MediaStreamTrack) => combinedStream.addTrack(track));
      
      // Merge audio tracks from camera stream if present
      if (streamRef.current) {
        streamRef.current.getAudioTracks().forEach((track: MediaStreamTrack) => combinedStream.addTrack(track));
      }

      const recorder = new MediaRecorder(combinedStream, options);
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType });
        const url = URL.createObjectURL(blob);
        
        // Auto-download to user downloads folder
        const a = document.createElement('a');
        document.body.appendChild(a);
        a.style.display = 'none';
        a.href = url;
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const matchLabel = selectedMatch 
          ? `${selectedMatch.player1_name.replace(/\s+/g, '_')}_vs_${selectedMatch.player2_name.replace(/\s+/g, '_')}`
          : 'match';
        
        const ext = recorder.mimeType.includes('mp4') ? 'mp4' : 'webm';
        a.download = `MatchPoint_${matchLabel}_${timestamp}.${ext}`;
        a.click();
        
        setTimeout(() => {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }, 150);

        showToast('💾 Match recording saved to local downloads!');
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000); // 1s slices
      setIsRecording(true);

      // Start recording timer
      recordingDurationRef.current = 0;
      setRecordingDuration(0);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        recordingDurationRef.current += 1;
        setRecordingDuration(recordingDurationRef.current);
      }, 1000);

      showToast('⏺️ Local recording started...');
    } catch (err: any) {
      console.error('Failed to initialize local recording:', err);
      alert('Could not start recording: ' + err.message);
    }
  }, [selectedMatch, recordingOrientation]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (recordingLoopRef.current) {
      cancelAnimationFrame(recordingLoopRef.current);
      recordingLoopRef.current = null;
    }
  }, []);

  const stopCamera = useCallback(() => {
    // Make sure we stop recording first if it's running
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setIsFullscreen(false);

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (recordingLoopRef.current) {
      cancelAnimationFrame(recordingLoopRef.current);
      recordingLoopRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }, []);

  const flipCamera = useCallback(async () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    if (cameraActive) await startCamera(next);
  }, [facingMode, cameraActive, startCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (recordingLoopRef.current) cancelAnimationFrame(recordingLoopRef.current);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  // ── Save YouTube URL via shared service ──
  const saveYouTubeUrl = async () => {
    if (!ytUrl.trim() || !selectedMatchId) return;
    setYtSaving(true);
    setYtError(null);
    try {
      await uploadMatchMedia(selectedMatchId, {
        tournament_id: selectedMatch?.tournament_id || undefined,
        match_id: selectedMatchId,
        uploaded_by: user?.id,
        file_url: ytUrl.trim(),
        caption: '📡 LIVE STREAM',
        media_type: 'video',
      } as any);
      setYtSaved(true);
      showToast('✅ YouTube stream URL saved! Viewers can now find your stream on the watch page.');
    } catch (err: any) {
      setYtError('Failed to save stream URL: ' + (err?.message || 'Unknown error'));
    } finally {
      setYtSaving(false);
    }
  };

  // ── Guard ──
  if (!user) return null;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <ShuttlecockLoader message="Loading Broadcaster Studio..." />
      </div>
    );
  }

  return (
    <div style={{
      background: 'var(--bg-primary)',
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      maxWidth: 480,
      margin: '0 auto',
      position: 'relative',
      fontFamily: 'var(--font-sans, system-ui)',
    }}>

      {/* ── Dynamic Rotation CSS overrides ── */}
      <style dangerouslySetInnerHTML={{__html: `
        .rotation-reminder {
          position: absolute;
          top: 70px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(37, 99, 235, 0.95);
          color: #fff;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          box-shadow: 0 4px 15px rgba(0,0,0,0.3);
          z-index: 10001;
          text-align: center;
          white-space: nowrap;
        }

        @media (orientation: landscape) {
          .reminder-landscape-target {
            display: none !important;
          }
          .reminder-portrait-target {
            display: block !important;
          }
        }
        @media (orientation: portrait) {
          .reminder-landscape-target {
            display: block !important;
          }
          .reminder-portrait-target {
            display: none !important;
          }
        }
      `}} />

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
          background: '#10b981', color: '#fff', padding: '10px 20px',
          borderRadius: 100, fontSize: 13, fontWeight: 600, zIndex: 1000,
          boxShadow: '0 4px 20px rgba(16,185,129,0.4)',
          whiteSpace: 'nowrap',
          animation: 'slide-up 0.3s ease',
        }}>
          {toast}
        </div>
      )}

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/dashboard" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 20, lineHeight: 1 }}>
            ←
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconShuttlecock size={16} />
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Broadcaster Studio</span>
          </div>
        </div>
        {/* Live badge */}
        {cameraActive && selectedMatch && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: '#f43f5e', color: '#fff', padding: '4px 10px',
            borderRadius: 100, fontSize: 11, fontWeight: 800, letterSpacing: '0.06em',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', display: 'inline-block', animation: 'pulse-live 1.2s infinite' }} />
            LIVE
          </div>
        )}
      </div>

      {/* ── Match Selector & Orientation Switcher ── */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
            Select Match
          </label>
          <select
            value={selectedMatchId}
            onChange={e => { setSelectedMatchId(e.target.value); setYtSaved(false); setYtUrl(''); }}
            className="input"
            style={{ width: '100%', height: 40, fontSize: 14, background: 'var(--bg-secondary)' }}
          >
            <option value="">— Choose a live match —</option>
            {liveMatches.map(m => {
              const tour = tournaments.find(t => t.id === m.tournament_id);
              return (
                <option key={m.id} value={m.id}>
                  {m.player1_name} vs {m.player2_name}{tour ? ` · ${tour.name}` : ''}
                </option>
              );
            })}
            {liveMatches.length === 0 && (
              <option value="" disabled>No live matches right now</option>
            )}
          </select>
        </div>

        {selectedMatch && (
          <div style={{ display: 'grid', gridTemplateColumns: selectedMatch?.sport === 'cricket' ? '1fr 1fr' : '1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
                Recording Layout Orientation
              </label>
              <div className="tab-group" style={{ display: 'flex', width: '100%', gap: 2 }}>
                <button
                  type="button"
                  className={`tab ${recordingOrientation === 'portrait' ? 'active' : ''}`}
                  onClick={() => setRecordingOrientation('portrait')}
                  style={{ flex: 1, textAlign: 'center' }}
                  disabled={isRecording}
                >
                  📱 Portrait (9:16)
                </button>
                <button
                  type="button"
                  className={`tab ${recordingOrientation === 'landscape' ? 'active' : ''}`}
                  onClick={() => setRecordingOrientation('landscape')}
                  style={{ flex: 1, textAlign: 'center' }}
                  disabled={isRecording}
                >
                  🖥️ Landscape (16:9)
                </button>
              </div>
              {isRecording && (
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block', textAlign: 'center' }}>
                  ⚠️ Orientation locked while recording.
                </span>
              )}
            </div>

            {selectedMatch?.sport === 'cricket' && (
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
                  Cricket Overlay Palette
                </label>
                <div className="tab-group" style={{ display: 'flex', width: '100%', gap: 2 }}>
                  <button
                    type="button"
                    className={`tab ${overlayTheme === 'ipl' ? 'active' : ''}`}
                    onClick={() => setOverlayTheme('ipl')}
                    style={{
                      flex: 1, textAlign: 'center', fontSize: 12,
                      fontWeight: overlayTheme === 'ipl' ? 800 : 500,
                      background: overlayTheme === 'ipl' ? 'linear-gradient(135deg, #1e1b4b, #312e81)' : undefined,
                      color: overlayTheme === 'ipl' ? '#facc15' : undefined,
                      borderColor: overlayTheme === 'ipl' ? '#eab308' : undefined,
                    }}
                  >
                    ⚡ IPL Neon
                  </button>
                  <button
                    type="button"
                    className={`tab ${overlayTheme === 'icc' ? 'active' : ''}`}
                    onClick={() => setOverlayTheme('icc')}
                    style={{
                      flex: 1, textAlign: 'center', fontSize: 12,
                      fontWeight: overlayTheme === 'icc' ? 800 : 500,
                      background: overlayTheme === 'icc' ? 'linear-gradient(135deg, #082f49, #0369a1)' : undefined,
                      color: overlayTheme === 'icc' ? '#38bdf8' : undefined,
                      borderColor: overlayTheme === 'icc' ? '#0284c7' : undefined,
                    }}
                  >
                    🌐 ICC Blue
                  </button>
                  <button
                    type="button"
                    className={`tab ${overlayTheme === 'classic' ? 'active' : ''}`}
                    onClick={() => setOverlayTheme('classic')}
                    style={{ flex: 1, textAlign: 'center', fontSize: 12 }}
                  >
                    ⚪ Classic
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedMatch ? (
        <>
          {/* ── Camera Area ── */}
          <div 
            ref={scorecardRef}
            style={isFullscreen ? {
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100dvh',
              background: '#000',
              zIndex: 9999,
              overflow: 'hidden',
            } : {
              position: 'relative',
              width: '100%',
              aspectRatio: recordingOrientation === 'portrait' ? '9/16' : '16/9',
              maxHeight: recordingOrientation === 'portrait' ? '55dvh' : '40dvh',
              background: '#0a0a0f',
              overflow: 'hidden',
              flexShrink: 0,
              transition: 'aspect-ratio 0.3s ease, max-height 0.3s ease',
            }}
          >
            {/* Camera video */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                display: cameraActive ? 'block' : 'none',
              }}
            />

            {/* Hidden canvas for recording overlay */}
            <canvas
              ref={canvasRef}
              style={{ display: 'none' }}
            />

            {/* REC overlay status */}
            {isRecording && (
              <div style={{
                position: 'absolute', top: 12, left: 12,
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(239,68,68,0.4)',
                backdropFilter: 'blur(8px)', padding: '6px 12px', borderRadius: 8,
                color: '#f87171', fontSize: 11, fontWeight: 700, zIndex: 10,
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'pulse-live 1s infinite' }} />
                REC {formatDuration(recordingDuration)}
              </div>
            )}

            {/* Camera placeholder when off */}
            {!cameraActive && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 16,
              }}>
                <div style={{ fontSize: 56 }}>📷</div>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '0 32px' }}>
                  Tap "Start Camera" below to begin your broadcast
                </p>
                {cameraError && (
                  <div style={{
                    background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)',
                    borderRadius: 8, padding: '10px 16px', fontSize: 12, color: '#fda4af',
                    textAlign: 'center', maxWidth: 320, margin: '0 16px',
                  }}>
                    {cameraError}
                  </div>
                )}
              </div>
            )}

            {/* Rotation reminder for broadcasters based on chosen layout */}
            {isFullscreen && (
              <div 
                className={`rotation-reminder ${recordingOrientation === 'landscape' ? 'reminder-landscape-target' : 'reminder-portrait-target'}`}
              >
                {recordingOrientation === 'landscape' 
                  ? '🔄 Rotate to landscape for wider recording view!' 
                  : '🔄 Rotate to portrait for vertical recording view!'}
              </div>
            )}

            {/* Fullscreen Scoreboard Overlay Takeover (Over finish, 4/6, Player Out, Inning/Match Finish) */}
            {showFullScoreboard && selectedMatch && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(ellipse at top, #0f172a 0%, #020617 100%)',
                zIndex: 2000,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '20px 24px',
                color: '#f8fafc',
                overflowY: 'auto',
                animation: 'fadeIn 0.3s ease',
              }}>
                {/* Scoreboard Takeover Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      background: fullScoreboardTitle.includes('WICKET') || fullScoreboardTitle.includes('OUT')
                        ? '#dc2626'
                        : fullScoreboardTitle.includes('6')
                        ? '#7c3aed'
                        : fullScoreboardTitle.includes('FOUR')
                        ? '#059669'
                        : '#ea580c',
                      color: '#fff',
                      padding: '4px 12px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 900,
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                    }}>
                      ⚡ {fullScoreboardTitle}
                    </span>
                    <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 700 }}>
                      {selectedTournament?.name || 'Tournament'} · {selectedMatch.court || 'Center Court'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>Camera resumes in:</span>
                    <span style={{
                      background: 'rgba(56, 189, 248, 0.2)',
                      color: '#38bdf8',
                      border: '1px solid #38bdf8',
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 800,
                      fontFamily: 'monospace'
                    }}>
                      {fullScoreboardCountdown}s
                    </span>
                    <button
                      onClick={() => setShowFullScoreboard(false)}
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: 'none',
                        color: '#fff',
                        borderRadius: 4,
                        padding: '4px 8px',
                        fontSize: 11,
                        cursor: 'pointer',
                        fontWeight: 700,
                        marginLeft: 6,
                      }}
                      title="Skip and resume camera"
                    >
                      Resume Camera ✕
                    </button>
                  </div>
                </div>

                {/* Scoreboard Takeover Main Score & Players */}
                {selectedMatch.sport === 'cricket' ? (() => {
                  const cMeta = (selectedMatch.sport_metadata || {}) as CricketMetadata;
                  const currentInnNum = cMeta.current_innings || 1;
                  const inn1 = cMeta.innings_1;
                  const inn2 = cMeta.innings_2;
                  const inn: CricketInnings = currentInnNum === 1 ? (inn1 || ({} as any)) : (inn2 || inn1 || ({} as any));
                  const battingTeamName = inn.batting_team_name || selectedMatch.player1_name;
                  const bowlingTeamName = inn.bowling_team_name || selectedMatch.player2_name;
                  const totalRuns = inn.total_runs ?? 0;
                  const wickets = inn.wickets ?? 0;
                  const oversFormatted = inn.overs_formatted || '0.0';
                  const maxOvers = inn.max_overs || 20;

                  const target = inn.target_runs;
                  const ballsRemaining = Math.max(0, (maxOvers * 6) - (inn.balls_bowled || 0));
                  const runsNeeded = target ? Math.max(0, target - totalRuns) : 0;
                  const crr = inn.balls_bowled > 0 ? (totalRuns / (inn.balls_bowled / 6)).toFixed(2) : '0.00';
                  const rrr = currentInnNum === 2 && target && ballsRemaining > 0 ? ((runsNeeded / ballsRemaining) * 6).toFixed(2) : '0.00';

                  const deliveries = inn.deliveries || [];
                  const lastDeliveries = deliveries.slice(-10);
                  const battersList = Object.values(inn.batters || {});
                  const bowlersList = Object.values(inn.bowlers || {});

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: '10px 0', overflowY: 'auto' }}>
                      {/* Big Score Header Banner */}
                      <div style={{
                        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)',
                        border: '1.5px solid #ea580c',
                        borderRadius: 12,
                        padding: '12px 18px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 12,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                      }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 900, color: '#ea580c', textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                            🏏 {battingTeamName} · Innings {currentInnNum}
                            {inn1 && inn2 && (
                              <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>
                                (1st: {inn1.batting_team_name} {inn1.total_runs}/{inn1.wickets})
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 4 }}>
                            <span style={{ fontSize: 'clamp(32px, 4.5vw, 48px)', fontWeight: 900, fontFamily: 'monospace', color: '#38bdf8', lineHeight: 1 }}>
                              {totalRuns}/{wickets}
                            </span>
                            <span style={{ fontSize: 16, fontWeight: 800, color: '#ffffff' }}>
                              ({oversFormatted} / {maxOvers} ov)
                            </span>
                          </div>
                          {target && currentInnNum === 2 && (
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#facc15', marginTop: 4 }}>
                              🎯 Target: {target} (Need {runsNeeded} runs in {ballsRemaining} balls)
                            </div>
                          )}
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#38bdf8' }}>
                            CRR: {crr} {currentInnNum === 2 && target && `· RRR: ${rrr}`}
                          </div>
                          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>
                            Bowling: <strong style={{ color: '#fff' }}>{bowlingTeamName}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Batting & Bowling Complete Tables Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
                        {/* 1. Complete Batting Scorecard Table */}
                        <div style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 10,
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            padding: '8px 12px',
                            background: 'rgba(255,255,255,0.06)',
                            fontSize: 11,
                            fontWeight: 800,
                            color: '#38bdf8',
                            textTransform: 'uppercase',
                            display: 'flex',
                            justifyContent: 'space-between',
                          }}>
                            <span>Batting — {battingTeamName}</span>
                            <div style={{ display: 'flex', gap: 12, fontFamily: 'monospace' }}>
                              <span style={{ width: 24, textAlign: 'right' }}>R</span>
                              <span style={{ width: 24, textAlign: 'right' }}>B</span>
                              <span style={{ width: 20, textAlign: 'right' }}>4s</span>
                              <span style={{ width: 20, textAlign: 'right' }}>6s</span>
                              <span style={{ width: 36, textAlign: 'right' }}>SR</span>
                            </div>
                          </div>

                          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                            {battersList.length === 0 ? (
                              <div style={{ padding: 12, fontSize: 12, color: '#64748b', textAlign: 'center' }}>No batters yet</div>
                            ) : (
                              battersList.map((b, i) => (
                                <div
                                  key={i}
                                  style={{
                                    padding: '6px 12px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                                    background: !b.is_out ? 'rgba(56, 189, 248, 0.05)' : 'transparent',
                                  }}
                                >
                                  <div style={{ maxWidth: 170, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                      <span style={{ fontSize: 12, fontWeight: 700, color: b.is_out ? '#cbd5e1' : '#60a5fa' }}>
                                        {b.player_name} {!b.is_out && '*'}
                                      </span>
                                    </div>
                                    <div style={{ fontSize: 10, color: '#64748b' }}>
                                      {b.is_out ? (b.dismissal_text || 'out') : 'not out'}
                                    </div>
                                  </div>
                                  <div style={{ display: 'flex', gap: 12, fontFamily: 'monospace', fontWeight: 700, fontSize: 12 }}>
                                    <span style={{ width: 24, textAlign: 'right', color: '#f8fafc', fontWeight: 800 }}>{b.runs}</span>
                                    <span style={{ width: 24, textAlign: 'right', color: '#94a3b8' }}>{b.balls_faced}</span>
                                    <span style={{ width: 20, textAlign: 'right', color: '#94a3b8' }}>{b.fours || 0}</span>
                                    <span style={{ width: 20, textAlign: 'right', color: '#94a3b8' }}>{b.sixes || 0}</span>
                                    <span style={{ width: 36, textAlign: 'right', color: '#38bdf8' }}>{b.strike_rate ? b.strike_rate.toFixed(1) : '0.0'}</span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>

                          {/* Extras & Total Row */}
                          <div style={{
                            padding: '6px 12px',
                            background: 'rgba(255,255,255,0.03)',
                            borderTop: '1px solid rgba(255,255,255,0.08)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: 11,
                            color: '#94a3b8',
                          }}>
                            <span>Extras (wd {inn.extras?.wides || 0}, nb {inn.extras?.no_balls || 0}, b {inn.extras?.byes || 0}, lb {inn.extras?.leg_byes || 0})</span>
                            <strong style={{ color: '#f8fafc', fontFamily: 'monospace' }}>{inn.extras?.total || 0}</strong>
                          </div>
                        </div>

                        {/* 2. Complete Bowling Scorecard Table */}
                        <div style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 10,
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            padding: '8px 12px',
                            background: 'rgba(255,255,255,0.06)',
                            fontSize: 11,
                            fontWeight: 800,
                            color: '#34d399',
                            textTransform: 'uppercase',
                            display: 'flex',
                            justifyContent: 'space-between',
                          }}>
                            <span>Bowling — {bowlingTeamName}</span>
                            <div style={{ display: 'flex', gap: 12, fontFamily: 'monospace' }}>
                              <span style={{ width: 24, textAlign: 'right' }}>O</span>
                              <span style={{ width: 20, textAlign: 'right' }}>M</span>
                              <span style={{ width: 24, textAlign: 'right' }}>R</span>
                              <span style={{ width: 20, textAlign: 'right' }}>W</span>
                              <span style={{ width: 36, textAlign: 'right' }}>ECON</span>
                            </div>
                          </div>

                          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                            {bowlersList.length === 0 ? (
                              <div style={{ padding: 12, fontSize: 12, color: '#64748b', textAlign: 'center' }}>No bowling figures yet</div>
                            ) : (
                              bowlersList.map((bw, i) => (
                                <div
                                  key={i}
                                  style={{
                                    padding: '6px 12px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                                    background: bw.player_name === cMeta.bowler_name ? 'rgba(52, 211, 153, 0.06)' : 'transparent',
                                  }}
                                >
                                  <span style={{ fontSize: 12, fontWeight: 700, color: bw.player_name === cMeta.bowler_name ? '#34d399' : '#f8fafc', maxWidth: 170, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {bw.player_name === cMeta.bowler_name ? `🔴 ${bw.player_name}` : bw.player_name}
                                  </span>
                                  <div style={{ display: 'flex', gap: 12, fontFamily: 'monospace', fontWeight: 700, fontSize: 12 }}>
                                    <span style={{ width: 24, textAlign: 'right', color: '#f8fafc' }}>{bw.overs}</span>
                                    <span style={{ width: 20, textAlign: 'right', color: '#94a3b8' }}>{bw.maidens || 0}</span>
                                    <span style={{ width: 24, textAlign: 'right', color: '#f8fafc' }}>{bw.runs_conceded}</span>
                                    <span style={{ width: 20, textAlign: 'right', color: '#34d399', fontWeight: 800 }}>{bw.wickets}</span>
                                    <span style={{ width: 36, textAlign: 'right', color: '#38bdf8' }}>{bw.economy ? bw.economy.toFixed(2) : '0.00'}</span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>

                          {/* Fall of Wickets (FOW) */}
                          {inn.fall_of_wickets && inn.fall_of_wickets.length > 0 && (
                            <div style={{
                              padding: '6px 12px',
                              background: 'rgba(239, 68, 68, 0.05)',
                              borderTop: '1px solid rgba(239, 68, 68, 0.2)',
                              fontSize: 10,
                              color: '#cbd5e1',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              overflowX: 'auto',
                            }}>
                              <span style={{ color: '#ef4444', fontWeight: 800, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>FOW:</span>
                              {inn.fall_of_wickets.map((fow, i) => (
                                <span key={i} style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 4, whiteSpace: 'nowrap' }}>
                                  {fow.runs}/{fow.wicket_number} ({fow.player_name})
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Recent Deliveries Ball History Ribbon */}
                      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto' }}>
                        <span style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Recent Deliveries:</span>
                        {lastDeliveries.length === 0 ? (
                          <span style={{ fontSize: 11, color: '#64748b' }}>No deliveries yet</span>
                        ) : (
                          lastDeliveries.map((b, i) => {
                            const isW = b.is_wicket;
                            const isSix = b.runs_off_bat === 6;
                            const isFour = b.runs_off_bat === 4;
                            const isExtra = !b.is_legal;
                            const bg = isW ? '#ef4444' : isSix ? '#8b5cf6' : isFour ? '#10b981' : isExtra ? '#ea580c' : 'rgba(255,255,255,0.15)';
                            const label = isW ? (b.extra_type ? `1w` : 'W') : b.extra_type ? `${b.total_runs}${b.extra_type === 'wide' ? 'w' : 'n'}` : `${b.runs_off_bat}`;
                            return (
                              <div key={i} style={{ minWidth: 24, height: 24, borderRadius: 12, background: bg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, flexShrink: 0 }}>
                                {label}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })() : (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <div style={{ fontSize: 32, fontWeight: 800 }}>{selectedMatch.player1_name} vs {selectedMatch.player2_name}</div>
                    <div style={{ fontSize: 24, marginTop: 8, color: '#38bdf8' }}>Match in Progress</div>
                  </div>
                )}

                <div style={{ textAlign: 'center', fontSize: 11, color: '#64748b', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8 }}>
                  MatchPoint TV • Live Complete Scoreboard Takeover
                </div>
              </div>
            )}

            {/* Score Overlay — Attached Table Design (Logo/Team | Total/Overs | Batter 1 & 2 | Bowler | Over Balls) */}
            <div style={{
              position: 'absolute', bottom: 12, left: 16, right: 16,
              zIndex: 999,
              display: showFullScoreboard ? 'none' : 'block',
            }}>
              {selectedMatch.sport === 'cricket' ? (() => {
                const cMeta = (selectedMatch.sport_metadata || {}) as CricketMetadata;
                const currentInnNum = cMeta.current_innings || 1;
                const inn: CricketInnings = currentInnNum === 1 ? (cMeta.innings_1 || ({} as any)) : (cMeta.innings_2 || cMeta.innings_1 || ({} as any));
                const battingTeamName = inn.batting_team_name || selectedMatch.player1_name;
                const totalRuns = inn.total_runs ?? 0;
                const wickets = inn.wickets ?? 0;
                const oversFormatted = inn.overs_formatted || '0.0';
                const maxOvers = inn.max_overs || 20;

                const striker = inn.batters?.[cMeta.striker_id] || { player_name: cMeta.striker_name || 'Player2', runs: 0, balls_faced: 0 };
                const nonStriker = inn.batters?.[cMeta.non_striker_id] || { player_name: cMeta.non_striker_name || 'Player1', runs: 0, balls_faced: 0 };
                const bowler = inn.bowlers?.[cMeta.bowler_id] || { player_name: cMeta.bowler_name || "Bowler's Name", overs: 0, runs_conceded: 0, wickets: 0 };

                const deliveries = inn.deliveries || [];
                const lastBalls = deliveries.slice(-6);
                // Resolve team logo and clean short code
                const matchedTeam = teams.find(
                  t => t.name.toLowerCase() === battingTeamName.toLowerCase() ||
                       (t.id && (t.id === selectedMatch.player1_id || t.id === selectedMatch.player2_id))
                );
                const teamLogo = matchedTeam?.logo_url || getTeamLogo(battingTeamName) || getTeamLogo(selectedMatch.player1_name);
                const teamShort = matchedTeam?.short_name || (
                  battingTeamName.length > 6 
                    ? battingTeamName.split(' ').map(w => w[0]).join('').substring(0, 4).toUpperCase()
                    : battingTeamName.toUpperCase()
                );

                // Theme palette styling for modern ICC / IPL broadcast aesthetics
                const isIcc = overlayTheme === 'icc';
                const isClassic = overlayTheme === 'classic';
                const isIpl = !isIcc && !isClassic;

                const tableContainerBg = isIpl 
                  ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.96) 100%)'
                  : isIcc 
                  ? 'linear-gradient(135deg, rgba(10, 25, 60, 0.98) 0%, rgba(20, 45, 95, 0.96) 100%)'
                  : '#ffffff';

                const tableBorder = isIpl
                  ? '1.5px solid rgba(249, 115, 22, 0.5)'
                  : isIcc
                  ? '1.5px solid rgba(56, 189, 248, 0.5)'
                  : '1px solid #000000';

                const cellBorder = isIpl || isIcc ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #d1d5db';
                const textPrimary = isIpl || isIcc ? '#f8fafc' : '#0f172a';
                const textSecondary = isIpl || isIcc ? '#94a3b8' : '#334155';
                const scoreColor = isIpl ? '#facc15' : isIcc ? '#38bdf8' : '#000000';
                const logoCellBg = isIpl 
                  ? 'linear-gradient(180deg, #ea580c 0%, #c2410c 100%)'
                  : isIcc
                  ? 'linear-gradient(180deg, #0284c7 0%, #0369a1 100%)'
                  : '#f8fafc';

                return (
                  <div style={{
                    width: '100%',
                    background: tableContainerBg,
                    color: textPrimary,
                    border: tableBorder,
                    borderRadius: 4,
                    boxShadow: '0 8px 30px rgba(0,0,0,0.7)',
                    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                    overflow: 'hidden',
                    backdropFilter: 'blur(10px)',
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
                      <tbody>
                        {/* Row 1: Logo/Team Title | Score | Batter 1 (Non-striker) | Bowler Name */}
                        <tr style={{ borderBottom: cellBorder, height: 26 }}>
                          {/* Col 1: Logo or Team Short (Rowspan 2) */}
                          <td rowSpan={2} style={{
                            width: 76,
                            minWidth: 68,
                            padding: '2px 6px',
                            borderRight: cellBorder,
                            textAlign: 'center',
                            verticalAlign: 'middle',
                            background: logoCellBg,
                            color: '#ffffff',
                          }}>
                            {teamLogo ? (
                              <img
                                src={teamLogo}
                                alt={battingTeamName}
                                style={{ height: 20, maxWidth: 36, objectFit: 'contain', display: 'block', margin: '0 auto 2px' }}
                              />
                            ) : (
                              <div style={{
                                width: 22,
                                height: 22,
                                borderRadius: '50%',
                                background: matchedTeam?.logo_color || (isIpl ? '#f97316' : '#0284c7'),
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 10,
                                fontWeight: 900,
                                margin: '0 auto 2px',
                                border: '1px solid rgba(255,255,255,0.4)',
                              }}>
                                {teamShort.charAt(0) || 'T'}
                              </div>
                            )}
                            <div style={{
                              fontWeight: 900,
                              fontSize: 10,
                              color: '#ffffff',
                              textTransform: 'uppercase',
                              lineHeight: 1,
                              letterSpacing: 0.5,
                              textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                            }}>
                              {teamShort}
                            </div>
                          </td>

                          {/* Col 2: Score 14/1 */}
                          <td style={{
                            width: 72,
                            minWidth: 64,
                            padding: '2px 6px',
                            borderRight: cellBorder,
                            textAlign: 'center',
                            fontWeight: 900,
                            fontSize: 14,
                            fontFamily: 'monospace',
                            color: scoreColor,
                            whiteSpace: 'nowrap',
                            background: isIpl ? 'rgba(250, 204, 21, 0.08)' : isIcc ? 'rgba(56, 189, 248, 0.08)' : 'transparent',
                          }}>
                            {totalRuns}/{wickets}
                          </td>

                          {/* Col 3: Batter 1 Name */}
                          <td style={{
                            padding: '2px 8px',
                            fontWeight: 700,
                            fontSize: 11,
                            color: textPrimary,
                            borderRight: cellBorder,
                            whiteSpace: 'nowrap',
                            maxWidth: 130,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}>
                            {nonStriker.player_name}
                          </td>

                          {/* Col 4: Batter 1 Runs (Balls) */}
                          <td style={{
                            padding: '2px 8px',
                            fontWeight: 700,
                            fontSize: 11,
                            color: textSecondary,
                            borderRight: cellBorder,
                            whiteSpace: 'nowrap',
                            textAlign: 'left',
                          }}>
                            {String(nonStriker.runs).padStart(2, '0')} ({nonStriker.balls_faced} Balls)
                          </td>

                          {/* Col 5: Bowler's Name */}
                          <td style={{
                            padding: '2px 8px',
                            fontWeight: 700,
                            fontSize: 11,
                            color: textPrimary,
                            borderRight: cellBorder,
                            whiteSpace: 'nowrap',
                            maxWidth: 130,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}>
                            <span style={{ color: isIpl ? '#f87171' : isIcc ? '#38bdf8' : '#ef4444', marginRight: 4 }}>🔴</span>
                            {bowler.player_name}
                          </td>

                          {/* Col 6: Bowler Figures (e.g. 2/12 (2.3 Overs)) */}
                          <td style={{
                            padding: '2px 8px',
                            fontWeight: 700,
                            fontSize: 11,
                            color: textSecondary,
                            whiteSpace: 'nowrap',
                            textAlign: 'left',
                          }}>
                            {bowler.wickets}/{bowler.runs_conceded} ({bowler.overs} Overs)
                          </td>
                        </tr>

                        {/* Row 2: Overs | Batter 2* (Striker) | Over balls ribbon */}
                        <tr style={{ height: 26, background: isIpl || isIcc ? 'rgba(255,255,255,0.02)' : '#ffffff' }}>
                          {/* Col 2: Overs (1.4/5 ov) */}
                          <td style={{
                            padding: '2px 6px',
                            borderRight: cellBorder,
                            textAlign: 'center',
                            fontWeight: 700,
                            fontSize: 10,
                            color: textSecondary,
                            whiteSpace: 'nowrap',
                          }}>
                            ({oversFormatted}/{maxOvers} ov)
                          </td>

                          {/* Col 3: Batter 2 Name with Striker * */}
                          <td style={{
                            padding: '2px 8px',
                            fontWeight: 800,
                            fontSize: 11,
                            color: isIpl ? '#38bdf8' : isIcc ? '#67e8f9' : '#0f172a',
                            borderRight: cellBorder,
                            whiteSpace: 'nowrap',
                            maxWidth: 130,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}>
                            🏏 {striker.player_name}*
                          </td>

                          {/* Col 4: Batter 2 Runs (Balls) */}
                          <td style={{
                            padding: '2px 8px',
                            fontWeight: 800,
                            fontSize: 11,
                            color: textPrimary,
                            borderRight: cellBorder,
                            whiteSpace: 'nowrap',
                            textAlign: 'left',
                          }}>
                            {String(striker.runs).padStart(2, '0')} ({striker.balls_faced} Balls)
                          </td>

                          {/* Col 5 & 6 combined: O: Balls Ribbon */}
                          <td colSpan={2} style={{
                            padding: '2px 8px',
                            background: isIpl ? 'rgba(0, 0, 0, 0.45)' : isIcc ? 'rgba(3, 15, 38, 0.7)' : '#0f172a',
                            color: '#ffffff',
                            textAlign: 'left',
                            verticalAlign: 'middle',
                            whiteSpace: 'nowrap',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 0.5, color: '#94a3b8' }}>
                                O:
                              </span>
                              {lastBalls.length === 0 ? (
                                <span style={{ fontSize: 10, color: '#64748b' }}>-</span>
                              ) : (
                                lastBalls.map((b, i) => {
                                  const isW = b.is_wicket;
                                  const isSix = b.runs_off_bat === 6;
                                  const isFour = b.runs_off_bat === 4;
                                  const isExtra = !b.is_legal;
                                  const bg = isW ? '#ef4444' : isExtra ? '#ea580c' : isSix ? '#8b5cf6' : isFour ? '#10b981' : '#334155';
                                  const label = isW ? (b.extra_type ? `1w` : 'W') : b.extra_type ? `${b.total_runs}${b.extra_type === 'wide' ? 'w' : 'n'}` : `${b.runs_off_bat}`;
                                  return (
                                    <div
                                      key={i}
                                      style={{
                                        width: 16,
                                        height: 16,
                                        borderRadius: '50%',
                                        background: bg,
                                        color: '#ffffff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 8.5,
                                        fontWeight: 900,
                                        flexShrink: 0,
                                        boxShadow: isSix || isFour || isW ? '0 0 6px rgba(255,255,255,0.4)' : 'none',
                                      }}
                                    >
                                      {label}
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                );
              })() : recordingOrientation === 'landscape' ? (
                // Horizontal Ticker Scoreboard for Landscape Broadcast (saves vertical space)
                <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  {/* Left: Tournament/Event */}
                  <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {selectedMatch.status === 'paused' ? (
                        <span style={{
                          fontSize: 9,
                          fontWeight: 800,
                          color: '#fff',
                          background: '#f59e0b',
                          padding: '1px 6px',
                          borderRadius: 4,
                          letterSpacing: '0.05em'
                        }}>
                          ⏸ PAUSED
                        </span>
                      ) : (
                        <span style={{ fontSize: 9, fontWeight: 800, color: '#2563eb', letterSpacing: '0.05em' }}>LIVE BROADCAST</span>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selectedTournament?.name} · {selectedEvent?.event_name}
                    </span>
                  </div>

                  {/* Center: Live Scores */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(0,0,0,0.65)', padding: '6px 16px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)' }}>
                    {/* Player 1 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {selectedMatch.player1_name}
                        {servingTeam === 'player1' && (
                          <span style={{ fontSize: 11 }}>{getServeIndicator(selectedMatch.sport)}</span>
                        )}
                      </span>
                      {p1Sets > 0 && <span style={{ fontSize: 9, color: '#86efac' }}>{'●'.repeat(p1Sets)}</span>}
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <span style={{ fontSize: 18, fontWeight: 900, fontFamily: 'monospace', color: '#2563eb', background: 'rgba(37, 99, 235, 0.15)', padding: '2px 8px', borderRadius: 4 }}>
                          {currentSet?.player1_score ?? 0}
                        </span>
                        {selectedMatch.sport === 'tennis' && gameInProgress && (
                          <span style={{ fontSize: 14, fontWeight: 800, fontFamily: 'monospace', color: '#eab308', background: 'rgba(234, 179, 8, 0.2)', padding: '1px 6px', borderRadius: 4 }}>
                            {tennisP1Points}
                          </span>
                        )}
                      </div>
                    </div>

                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>VS</span>

                    {/* Player 2 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        {selectedMatch.sport === 'tennis' && gameInProgress && (
                          <span style={{ fontSize: 14, fontWeight: 800, fontFamily: 'monospace', color: '#eab308', background: 'rgba(234, 179, 8, 0.2)', padding: '1px 6px', borderRadius: 4 }}>
                            {tennisP2Points}
                          </span>
                        )}
                        <span style={{ fontSize: 18, fontWeight: 900, fontFamily: 'monospace', color: '#10b981', background: 'rgba(16,185,129,0.15)', padding: '2px 8px', borderRadius: 4 }}>
                          {currentSet?.player2_score ?? 0}
                        </span>
                      </div>
                      {p2Sets > 0 && <span style={{ fontSize: 9, color: '#86efac' }}>{'●'.repeat(p2Sets)}</span>}
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.8)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {selectedMatch.player2_name}
                        {servingTeam === 'player2' && (
                          <span style={{ fontSize: 11 }}>{getServeIndicator(selectedMatch.sport)}</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Right: Set info / Court */}
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                    <span>Set {currentSet?.set_number || selectedMatch.sets?.length || 1}</span>
                    {selectedMatch.court && <span>📍 {selectedMatch.court}</span>}
                    {completedSets.length > 0 && (
                      <span style={{ color: 'rgba(255,255,255,0.3)', marginLeft: 8 }}>
                        ({completedSets.map((s: any) => `${s.player1_score}-${s.player2_score}`).join(', ')})
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                // Original Vertical Layout for compact mobile page preview
                <>
                  {/* Match context */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    {selectedTournament && selectedEvent && (
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {selectedTournament.name} · {selectedEvent.event_name}
                      </div>
                    )}
                    {selectedMatch.status === 'paused' && (
                      <span style={{
                        fontSize: 9,
                        fontWeight: 800,
                        color: '#fff',
                        background: '#f59e0b',
                        padding: '1px 6px',
                        borderRadius: 4,
                        letterSpacing: '0.05em'
                      }}>
                        ⏸ PAUSED
                      </span>
                    )}
                  </div>

                  {/* Scores */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {/* Player 1 */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: 4,
                          background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontWeight: 800, color: '#fff'
                        }}>{selectedMatch.player1_name.charAt(0)}</div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {selectedMatch.player1_name}
                          {servingTeam === 'player1' && (
                            <span style={{ fontSize: 11 }}>{getServeIndicator(selectedMatch.sport)}</span>
                          )}
                        </span>
                        {p1Sets > 0 && (
                          <span style={{ fontSize: 10, color: '#86efac', fontWeight: 700 }}>
                            {'●'.repeat(p1Sets)}
                          </span>
                        )}
                      </div>
                      
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 32, fontWeight: 900, fontFamily: 'monospace', color: '#fff', minWidth: 40, textAlign: 'right' }}>
                          {currentSet?.player1_score ?? 0}
                        </span>
                        {selectedMatch.sport === 'tennis' && gameInProgress && (
                          <span style={{ fontSize: 24, fontWeight: 850, fontFamily: 'monospace', color: '#eab308', background: 'rgba(234, 179, 8, 0.15)', border: '1.5px solid rgba(234, 179, 8, 0.4)', padding: '2px 8px', borderRadius: 6, minWidth: 36, textAlign: 'center' }}>
                            {tennisP1Points}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Player 2 */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: 4,
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontWeight: 800, color: '#fff'
                        }}>{selectedMatch.player2_name.charAt(0)}</div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.8)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {selectedMatch.player2_name}
                          {servingTeam === 'player2' && (
                            <span style={{ fontSize: 11 }}>{getServeIndicator(selectedMatch.sport)}</span>
                          )}
                        </span>
                        {p2Sets > 0 && (
                          <span style={{ fontSize: 10, color: '#86efac', fontWeight: 700 }}>
                            {'●'.repeat(p2Sets)}
                          </span>
                        )}
                      </div>
                      
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 32, fontWeight: 900, fontFamily: 'monospace', color: 'rgba(255,255,255,0.7)', minWidth: 40, textAlign: 'right' }}>
                          {currentSet?.player2_score ?? 0}
                        </span>
                        {selectedMatch.sport === 'tennis' && gameInProgress && (
                          <span style={{ fontSize: 24, fontWeight: 850, fontFamily: 'monospace', color: '#eab308', background: 'rgba(234, 179, 8, 0.15)', border: '1.5px solid rgba(234, 179, 8, 0.4)', padding: '2px 8px', borderRadius: 6, minWidth: 36, textAlign: 'center' }}>
                            {tennisP2Points}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Set history & court */}
                  <div style={{ display: 'flex', gap: 12, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#f43f5e', display: 'inline-block', animation: 'pulse-live 1.5s infinite' }} />
                      Set {currentSet?.set_number || selectedMatch.sets?.length || 1}
                    </div>
                    {selectedMatch.court && (
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                        📍 {selectedMatch.court}
                      </div>
                    )}
                    {completedSets.length > 0 && (
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', display: 'flex', gap: 4 }}>
                        {completedSets.map((s, i) => (
                          <span key={i}>{s.player1_score}-{s.player2_score}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Camera Floating Toolbar (top-right) */}
            {cameraActive && (
              <div style={{
                position: 'absolute',
                top: 12,
                right: 12,
                display: 'flex',
                flexDirection: isFullscreen ? 'row' : 'column',
                gap: 10,
                zIndex: 10000,
              }}>
                {/* Fullscreen toggle button */}
                <button
                  onClick={toggleFullscreen}
                  style={{
                    background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(8px)', borderRadius: 8,
                    color: '#fff', fontSize: 16, width: 40, height: 40,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                  title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                  {isFullscreen ? '⏹ Exit' : '⛶'}
                </button>

                {/* Flip camera button */}
                <button
                  onClick={flipCamera}
                  style={{
                    background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(8px)', borderRadius: 8,
                    color: '#fff', fontSize: 16, width: 40, height: 40,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                  title="Flip camera"
                >
                  🔄
                </button>

                {/* Fullscreen Record button shortcut */}
                {isFullscreen && (
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    style={{
                      background: isRecording ? 'rgba(239, 68, 68, 0.85)' : 'rgba(0, 0, 0, 0.65)',
                      border: isRecording ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(8px)', borderRadius: 8,
                      color: isRecording ? '#fff' : '#f87171', fontSize: 13, width: isRecording ? 110 : 68, height: 40,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer',
                      gap: 4,
                      fontWeight: 700,
                    }}
                    title={isRecording ? "Stop recording" : "Start recording"}
                  >
                    {isRecording ? `⏹ Stop (${formatDuration(recordingDuration)})` : '🔴 Rec'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── Camera Control Bar ── */}
          <div style={{
            display: 'flex', gap: 10, padding: '14px 16px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-card)',
          }}>
            {!cameraActive ? (
              <button
                onClick={() => startCamera()}
                className="btn btn-primary"
                style={{
                  flex: 1, gap: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'linear-gradient(135deg, #f43f5e, #e11d48)', border: 'none',
                  height: 48, fontSize: 15, fontWeight: 700,
                }}
              >
                📷 Start Camera
              </button>
            ) : (
              <>
                <button
                  onClick={stopCamera}
                  style={{
                    flex: 1, gap: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.3)',
                    color: '#f43f5e', borderRadius: 'var(--radius-md)', height: 48,
                    fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  ⏹ Stop
                </button>
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  style={{
                    flex: 1, gap: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isRecording ? 'rgba(239, 68, 68, 0.2)' : 'var(--bg-secondary)',
                    border: isRecording ? '1px solid #ef4444' : '1px solid var(--border)',
                    color: isRecording ? '#f87171' : 'var(--text-primary)',
                    borderRadius: 'var(--radius-md)', height: 48,
                    fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  {isRecording ? `⏹ Stop (${formatDuration(recordingDuration)})` : '🔴 Record'}
                </button>
                <button
                  onClick={flipCamera}
                  style={{
                    width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)', fontSize: 20, cursor: 'pointer', flexShrink: 0,
                  }}
                  title="Flip camera"
                >
                  🔄
                </button>
              </>
            )}
          </div>

          {/* ── Admin 1-Click Live Streaming & YouTube Ingest Section ── */}
          <div style={{
            padding: '16px',
            borderBottom: '1px solid var(--border)',
            background: (user?.role === 'admin' || user?.role === 'system_admin' || user?.roles?.includes('admin'))
              ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(244, 63, 94, 0.04))'
              : undefined,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 18 }}>🔴</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
                  Live Streaming to YouTube
                </span>
                {(user?.role === 'admin' || user?.role === 'system_admin' || user?.roles?.includes('admin')) && (
                  <span style={{
                    fontSize: 10,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    color: '#fff',
                    padding: '2px 7px',
                    borderRadius: 999,
                  }}>
                    Admin 1-Click
                  </span>
                )}
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                RTMP / Studio Ready
              </span>
            </div>

            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>
              {(user?.role === 'admin' || user?.role === 'system_admin' || user?.roles?.includes('admin'))
                ? 'As Admin, launch your YouTube Live Studio broadcast in 1 click or paste the match watch URL so viewers can tune in directly with full scoreboard overlays.'
                : 'Start your YouTube Live stream, then paste the public URL below. It will automatically attach to the match for all online spectators.'}
            </p>

            {/* Admin Quick Action Hub */}
            {(user?.role === 'admin' || user?.role === 'system_admin' || user?.roles?.includes('admin')) && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 8,
                marginBottom: 12,
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-secondary)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}>
                <a
                  href="https://studio.youtube.com/channel/UC/livestreaming/stream"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 700,
                    textDecoration: 'none',
                    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.25)',
                  }}
                >
                  <span>📺</span> Open YouTube Live Studio
                </a>
                <button
                  type="button"
                  onClick={() => {
                    const sampleUrl = `https://youtube.com/live/${selectedMatch?.id?.substring(0, 8)}?feature=share`;
                    setYtUrl(sampleUrl);
                    showToast('Pasted stream template! Edit or click Save & Share.');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <span>⚡</span> Quick Auto-Fill URL
                </button>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="url"
                className="input"
                placeholder="https://youtube.com/live/... or https://youtu.be/..."
                value={ytUrl}
                onChange={e => { setYtUrl(e.target.value); setYtSaved(false); }}
                style={{ flex: 1, height: 40, fontSize: 13 }}
                disabled={ytSaving}
              />
              <button
                onClick={saveYouTubeUrl}
                disabled={!ytUrl.trim() || ytSaving}
                style={{
                  padding: '0 16px', height: 40, borderRadius: 'var(--radius-md)',
                  background: ytSaved ? '#10b981' : 'var(--accent)',
                  color: '#fff', border: 'none', fontSize: 13, fontWeight: 700,
                  cursor: !ytUrl.trim() || ytSaving ? 'not-allowed' : 'pointer',
                  opacity: !ytUrl.trim() || ytSaving ? 0.6 : 1,
                  whiteSpace: 'nowrap', transition: 'background 0.3s',
                  flexShrink: 0,
                }}
              >
                {ytSaving ? '...' : ytSaved ? '✓ Saved' : 'Save & Share'}
              </button>
            </div>
            {ytError && (
              <p style={{ fontSize: 12, color: '#f87171', marginTop: 6 }}>{ytError}</p>
            )}
            {ytSaved && (
              <p style={{ fontSize: 12, color: '#34d399', marginTop: 6 }}>
                🎉 Stream link saved! Viewers on the watch page can now click through to your YouTube stream.
              </p>
            )}
          </div>

          {/* ── Tips Section ── */}
          <div style={{ padding: '14px 16px 24px 16px', flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              Broadcasting Tips
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { icon: '📱', tip: 'Keep your phone in landscape mode for the best viewing experience' },
                { icon: '💡', tip: 'Make sure the court is well-lit before starting your broadcast' },
                { icon: '🔋', tip: 'Plug in a charger — camera streaming drains battery quickly' },
                { icon: '📶', tip: 'Use WiFi or a strong 4G/5G signal for smooth streaming' },
                { icon: '🎙️', tip: 'The score overlay updates automatically every 3 seconds' },
              ].map(({ icon, tip }, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        /* ── No Match Selected ── */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>📡</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Ready to Go Live?</h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 320 }}>
            {liveMatches.length > 0
              ? 'Select a live match from the dropdown above to start broadcasting with the score overlay.'
              : 'No matches are live right now. This page will update automatically when an umpire starts a match.'}
          </p>
          {liveMatches.length === 0 && (
            <div style={{
              marginTop: 24, padding: '12px 16px',
              background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--text-secondary)',
            }}>
              🔄 Checking for live matches every 3 seconds...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
