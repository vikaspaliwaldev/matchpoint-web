'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Match, MatchSet, Tournament, TournamentEvent, TournamentMedia } from '@/types';
import { getMatchById, getMatches, getTournaments, getEvents, getMatchMedia, getMatchHistory } from '@/lib/supabase-service';
import type { MatchHistoryData } from '@/lib/supabase-service';
import { getYouTubeEmbedUrl } from '@/components/MatchMediaModal';
import { IconShuttlecock, IconActivity } from '@/components/icons';
import { formatTennisGameScore, getTableTennisServer } from '@/lib/sports-rules';
import MatchCommentsSidebar from '@/components/MatchCommentsSidebar';
import ShuttlecockLoader from '@/components/ShuttlecockLoader';
import WinPredictorGauge from '@/components/WinPredictorGauge';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { getTeamLogo } from '@/lib/team-logos';

// ─── YouTube IFrame API type declarations ───
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function WatchMatchPage() {
  const searchParams = useSearchParams();
  const matchId = searchParams?.get('matchId') || '';

  const [match, setMatch] = useState<Match | null>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [event, setEvent] = useState<TournamentEvent | null>(null);
  const [media, setMedia] = useState<TournamentMedia[]>([]);
  const [matchHistory, setMatchHistory] = useState<MatchHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);

  // YouTube IFrame API player reference (for timeline seek)
  const playerRef = useRef<any>(null);
  const playerContainerRef = useRef<string>('yt-player-' + Math.random().toString(36).substring(7));
  const videoContainerRef = useRef<HTMLDivElement>(null);

  // Timeline sync state
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const timeTrackingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const [showScoreOverlay, setShowScoreOverlay] = useState(true);
  const [overlayScale, setOverlayScale] = useState<number>(1.0); // 0.8: Small, 1.0: Medium, 1.2: Large
  const [overlayPos, setOverlayPos] = useState({ x: 16, y: 16 }); // px offsets from top-left of video container
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartOffset = useRef({ x: 0, y: 0 });

  const tennisMeta = match?.sport_metadata;
  const p1GamePoints = tennisMeta?.player1_game_points ?? 0;
  const p2GamePoints = tennisMeta?.player2_game_points ?? 0;
  const gameInProgress = match?.sport === 'tennis' && (p1GamePoints > 0 || p2GamePoints > 0);

  const tennisScores = (match?.sport === 'tennis' && tennisMeta) ? formatTennisGameScore(
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
  if (match) {
    if (match.sport === 'tennis' || match.sport === 'squash' || match.sport === 'badminton') {
      servingTeam = match.sport_metadata?.serving_team || match.sport_metadata?.initial_server || 'player1';
    } else if (match.sport === 'table_tennis') {
      const activeSet = match.sets?.[match.sets.length - 1];
      const p1Score = activeSet?.player1_score ?? 0;
      const p2Score = activeSet?.player2_score ?? 0;
      const ttInitialServer = match.sport_metadata?.initial_server || 'player1';
      const ttFormat = match.sport_metadata?.scoring_format || '11-point';
      servingTeam = getTableTennisServer(p1Score, p2Score, ttInitialServer, ttFormat);
    }
  }

  // Snap to corners helper
  const snapToCorner = useCallback((corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right') => {
    const container = videoContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const cardElement = container.querySelector('.watch-score-overlay') as HTMLElement;
    const cardWidth = cardElement ? cardElement.offsetWidth * overlayScale : 240 * overlayScale;
    const cardHeight = cardElement ? cardElement.offsetHeight * overlayScale : 140 * overlayScale;

    const margin = 16;
    let x = margin;
    let y = margin;

    if (corner === 'top-right') {
      x = rect.width - cardWidth - margin;
    } else if (corner === 'bottom-left') {
      y = rect.height - cardHeight - margin;
    } else if (corner === 'bottom-right') {
      x = rect.width - cardWidth - margin;
      y = rect.height - cardHeight - margin - (isFullscreen ? 64 : 44);
    }

    setOverlayPos({ x: Math.max(0, x), y: Math.max(0, y) });
  }, [overlayScale, isFullscreen]);

  // Window-level events for dragging boundaries
  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (clientX: number, clientY: number) => {
      const container = videoContainerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      
      let newX = clientX - rect.left - dragStartOffset.current.x;
      let newY = clientY - rect.top - dragStartOffset.current.y;

      const cardElement = container.querySelector('.watch-score-overlay') as HTMLElement;
      const cardWidth = cardElement ? cardElement.offsetWidth * overlayScale : 240 * overlayScale;
      const cardHeight = cardElement ? cardElement.offsetHeight * overlayScale : 140 * overlayScale;

      const maxX = rect.width - cardWidth;
      const maxY = rect.height - cardHeight;

      newX = Math.max(0, Math.min(maxX, newX));
      newY = Math.max(0, Math.min(maxY, newY));

      setOverlayPos({ x: newX, y: newY });
    };

    const onMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };

    const onMouseUp = () => setIsDragging(false);
    const onTouchEnd = () => setIsDragging(false);

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, overlayScale]);

  const startDrag = (clientX: number, clientY: number) => {
    const container = videoContainerRef.current;
    if (!container) return;
    const cardElement = container.querySelector('.watch-score-overlay') as HTMLElement;
    if (!cardElement) return;

    const rect = cardElement.getBoundingClientRect();
    dragStartOffset.current = {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
    setIsDragging(true);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.no-drag')) return;
    e.preventDefault();
    startDrag(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('.no-drag')) return;
    if (e.touches.length === 0) return;
    startDrag(e.touches[0].clientX, e.touches[0].clientY);
  };



  // ─── Load Data ───
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Direct fetch by ID first to guarantee we have the absolute latest score
        const directMatchPromise = matchId ? getMatchById(matchId) : Promise.resolve(null);
        const [directMatch, allMatches, tours, evs, mediaData] = await Promise.all([
          directMatchPromise,
          getMatches(),
          getTournaments(),
          getEvents(),
          getMatchMedia(matchId),
        ]);

        const foundMatch = directMatch || allMatches.find(m => m.id === matchId) || null;
        setMatch(foundMatch);
        setMedia(mediaData);

        if (foundMatch) {
          setTournament(tours.find(t => t.id === foundMatch.tournament_id) || null);
          setEvent(evs.find(e => e.id === foundMatch.event_id) || null);
        }

        // Find first YouTube video link
        const ytMedia = mediaData.find(m => getYouTubeEmbedUrl(m.file_url));
        if (ytMedia) {
          setActiveVideoUrl(ytMedia.file_url);
        }

        // Load match history for completed matches (for timeline replay)
        if (foundMatch && foundMatch.status === 'completed') {
          const history = await getMatchHistory(matchId);
          setMatchHistory(history);
        }
      } catch (err) {
        console.error('Failed to load watch page data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [matchId]);

  // ─── Real-time score updates via Spring SSE stream + fast interval polling fallback ───
  useEffect(() => {
    if (!matchId) return;

    // Helper to apply latest match update smoothly
    const applyMatchUpdate = (updated: any) => {
      if (!updated) return;
      setMatch(prev => {
        if (!prev) return updated;
        const normalizedSets = (updated.sets || []).map((s: any) => ({
          set_number: s.set_number !== undefined ? s.set_number : s.setNumber,
          player1_score: s.player1_score !== undefined ? s.player1_score : s.player1Score,
          player2_score: s.player2_score !== undefined ? s.player2_score : s.player2Score,
          is_complete: s.is_complete !== undefined ? s.is_complete : s.isComplete || s.complete || false,
          winner_id: s.winner_id || s.winnerId,
        }));
        return {
          ...prev,
          ...updated,
          sets: normalizedSets.length > 0 ? normalizedSets : prev.sets,
          duration_seconds: updated.duration_seconds !== undefined ? updated.duration_seconds : prev.duration_seconds,
          status: updated.status || prev.status,
          sport_metadata: updated.sport_metadata || updated.sportMetadata || prev.sport_metadata,
        };
      });
    };

    // 1. Fallback interval polling: guarantees scores update even if SSE is blocked or disconnects
    const pollInterval = setInterval(async () => {
      try {
        const latest = await getMatchById(matchId);
        if (latest) {
          applyMatchUpdate(latest);
        }
      } catch (err) {
        // silent fallback fail
      }
    }, 2000);

    // 2. SSE Stream
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const sseUrl = `${apiBaseUrl}/api/v1/live/match/${matchId}`;
    let eventSource: EventSource | null = null;
    
    try {
      eventSource = new EventSource(sseUrl);
      eventSource.addEventListener('match-update', (event: any) => {
        try {
          const updated = JSON.parse(event.data);
          applyMatchUpdate(updated);
        } catch (err) {
          console.error('Failed to parse SSE match update:', err);
        }
      });
      eventSource.onerror = (err) => {
        // SSE will retry automatically
      };
    } catch (e) {
      console.warn('SSE connection initialization error, relying on fast polling:', e);
    }

    return () => {
      clearInterval(pollInterval);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [matchId]);
  // ─── Also watch for new media added (so live stream link appears automatically) ───
  useEffect(() => {
    const mediaInterval = setInterval(async () => {
      try {
        const updated = await getMatchMedia(matchId);
        setMedia(updated);
        // Auto-select first YouTube if none active
        if (!activeVideoUrl) {
          const ytMedia = updated.find(m => getYouTubeEmbedUrl(m.file_url));
          if (ytMedia) setActiveVideoUrl(ytMedia.file_url);
        }
      } catch {}
    }, 15000);

    return () => clearInterval(mediaInterval);
  }, [matchId, activeVideoUrl]);

  // ─── YouTube IFrame API for timeline seek ───
  const initYouTubePlayer = useCallback((embedUrl: string) => {
    // Clean up old player
    if (playerRef.current) {
      try { playerRef.current.destroy(); } catch {}
      playerRef.current = null;
    }

    const videoId = embedUrl.split('/').pop()?.split('?')[0];
    if (!videoId) return;

    const createPlayer = () => {
      playerRef.current = new window.YT.Player(playerContainerRef.current, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 1,
          mute: 1,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
            } else {
              setIsPlaying(false);
            }
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      // Load YT IFrame API
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
      window.onYouTubeIframeAPIReady = createPlayer;
    }
  }, []);

  // Track video time for timeline sync
  useEffect(() => {
    if (isPlaying && playerRef.current) {
      timeTrackingInterval.current = setInterval(() => {
        try {
          const time = playerRef.current.getCurrentTime();
          if (typeof time === 'number') setCurrentVideoTime(Math.floor(time));
        } catch {}
      }, 500);
    } else {
      if (timeTrackingInterval.current) clearInterval(timeTrackingInterval.current);
    }
    return () => {
      if (timeTrackingInterval.current) clearInterval(timeTrackingInterval.current);
    };
  }, [isPlaying]);

  // Initialize player when video URL changes (only for replay mode with history)
  useEffect(() => {
    if (activeVideoUrl && matchHistory?.points_history?.some(p => p.timestamp_sec > 0)) {
      const embedUrl = getYouTubeEmbedUrl(activeVideoUrl);
      if (embedUrl) {
        // Small delay to let DOM render
        setTimeout(() => initYouTubePlayer(embedUrl), 300);
      }
    }
    return () => {
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch {}
        playerRef.current = null;
      }
    };
  }, [activeVideoUrl, matchHistory, initYouTubePlayer]);

  const seekToTime = (seconds: number) => {
    if (playerRef.current?.seekTo) {
      playerRef.current.seekTo(seconds, true);
    }
  };

  // ─── Fullscreen Toggle ───
  const toggleFullscreen = useCallback(() => {
    const container = videoContainerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(err => {
        console.error('Fullscreen request failed:', err);
      });
    } else {
      document.exitFullscreen();
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      setShowOverlay(true); // Always show overlay when entering/exiting fullscreen
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keep overlay always visible — no auto-hide
  const handleMouseMoveOnVideo = useCallback(() => {
    setShowOverlay(true);
  }, []);

  // ─── Derived Data ───
  const isLive = match?.status === 'running' || match?.status === 'paused';
  const isCompleted = match?.status === 'completed';
  const activeSet = match?.sets && match.sets.length > 0
    ? (match.sets.find(s => !s.is_complete) || match.sets[match.sets.length - 1])
    : null;
  const p1SetsWon = match?.sets?.filter(s => s.is_complete && (s.winner_id === match.player1_id || s.winner_id === 'player1')).length || 0;
  const p2SetsWon = match?.sets?.filter(s => s.is_complete && (s.winner_id === match.player2_id || s.winner_id === 'player2')).length || 0;


  const ytVideos = media.filter(m => getYouTubeEmbedUrl(m.file_url));
  const hasTimeline = matchHistory?.points_history?.some(p => p.timestamp_sec > 0) || false;
  const embedUrl = activeVideoUrl ? getYouTubeEmbedUrl(activeVideoUrl) : null;

  // Compute current score from timeline position (for VOD replay)
  const getTimelineScore = () => {
    if (!hasTimeline || !matchHistory?.points_history) return null;
    const points = matchHistory.points_history;
    let activePoint = points[0];
    for (const p of points) {
      if (p.timestamp_sec <= currentVideoTime) {
        activePoint = p;
      } else {
        break;
      }
    }
    return activePoint;
  };

  if (loading) {
    return (
      <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ShuttlecockLoader message="Loading match stream..." />
      </div>
    );
  }

  if (!match) {
    return (
      <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 48 }}>🏸</div>
        <h2 style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Match Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>The match you&apos;re looking for doesn&apos;t exist or has been removed.</p>
        <Link href="/live" className="btn btn-primary">← Back to Live Arena</Link>
      </div>
    );
  }

  return (
    <div data-active-sport={match.sport || 'all'} style={{ background: 'transparent', minHeight: '100vh' }}>
      <style dangerouslySetInnerHTML={{__html: `
        /* Watch Match page responsive styling overrides */
        .watch-right-panel {
          flex: 0 0 340px;
          width: 340px;
          position: sticky;
          top: 80px;
        }
        .watch-chat-panel {
          width: 100%;
          max-width: 360px;
          height: 520px;
          position: sticky;
          top: 80px;
          padding: 0;
          overflow: hidden;
          border: 1px solid var(--border);
          display: flex;
          flex-direction: column;
        }
        @media (max-width: 768px) {
          .watch-right-panel {
            flex: 1 1 100% !important;
            width: 100% !important;
            position: static !important;
          }
          .watch-chat-panel {
            max-width: 100% !important;
            position: static !important;
            height: 480px !important;
          }
        }
      `}} />
      {/* Top Nav */}
      <nav className="nav">
        <div className="container-app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link href="/live" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>
              ← Back to Arena
            </Link>
            <div style={{ width: 1, height: 24, background: 'var(--border)' }} />
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <div style={{
                width: 32, height: 32,
                background: 'linear-gradient(135deg, var(--accent), #3b82f6)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {match.sport === 'badminton' && <span style={{ fontSize: 16 }}>🏸</span>}
                {match.sport === 'table_tennis' && <span style={{ fontSize: 16 }}>🏓</span>}
                {match.sport === 'squash' && <span style={{ fontSize: 16 }}>🎾</span>}
                {match.sport === 'tennis' && <span style={{ fontSize: 16 }}>🥎</span>}
                {match.sport === 'volleyball' && <span style={{ fontSize: 16 }}>🏐</span>}
                {match.sport === 'cricket' && <span style={{ fontSize: 16 }}>🏏</span>}
                {match.sport === 'basketball' && <span style={{ fontSize: 16 }}>🏀</span>}
                {(match.sport === 'all' || !match.sport) && <IconShuttlecock size={16} />}
              </div>
              <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>MatchPoint</span>
            </Link>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setChatOpen(!chatOpen)}
              style={{
                fontSize: 12,
                color: chatOpen ? 'var(--accent)' : 'var(--text-secondary)',
                background: chatOpen ? 'var(--accent-subtle)' : 'transparent',
              }}
            >
              💬 Chat
            </button>
          </div>
        </div>
      </nav>

      <main className="container-app" style={{ padding: '24px 20px 80px 20px' }}>
        {/* Match Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
            {isLive && (
              <div className="badge badge-live">
                <span className="live-dot" /> LIVE
              </div>
            )}
            {isCompleted && (
              <div className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', fontSize: 11, fontWeight: 600 }}>
                ✓ COMPLETED
              </div>
            )}
            {match.status === 'paused' && (
              <div className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)', fontSize: 11, fontWeight: 600 }}>
                ⏸ PAUSED
              </div>
            )}
            {tournament && (
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {tournament.name} {event ? `· ${event.event_name}` : ''}
              </span>
            )}
          </div>
          <h1 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            {match.player1_name} vs {match.player2_name}
          </h1>
          {match.court && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              📍 {match.court}
            </p>
          )}
        </div>

        {/* Main Content: Video + Score Panel */}
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* LEFT: Video Player + Timeline */}
          <div style={{ flex: '1 1 600px', minWidth: 0 }}>
            {/* Video Player with Fullscreen Score Overlay */}
            {embedUrl ? (
              <div style={{ marginBottom: 20 }}>
                <style>{`@keyframes fs-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
                <div
                  ref={videoContainerRef}
                  onMouseMove={handleMouseMoveOnVideo}
                  style={{
                    position: 'relative',
                    width: '100%',
                    ...(isFullscreen
                      ? { height: '100vh', background: '#000' }
                      : { paddingTop: '56.25%', background: '#020617', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }),
                    overflow: 'hidden',
                  }}
                >
                  {/* YouTube iframe */}
                  {hasTimeline ? (
                    <div
                      id={playerContainerRef.current}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                    />
                  ) : (
                    <iframe
                      src={`${embedUrl}?autoplay=1&mute=1&modestbranding=1&rel=0&fs=0`}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  )}

                  {/* ── Floating Score Overlay (stays visible in fullscreen) ── */}
                  {match && showScoreOverlay && (
                    <div
                      className="watch-score-overlay"
                      style={{
                        position: 'absolute',
                        top: overlayPos.y,
                        left: overlayPos.x,
                        zIndex: 20,
                        opacity: showOverlay ? 1 : 0,
                        transform: showOverlay ? `translateY(0) scale(${overlayScale})` : `translateY(8px) scale(${overlayScale})`,
                        transformOrigin: 'top left',
                        transition: 'opacity 0.3s ease, transform 0.3s ease',
                        pointerEvents: showOverlay ? 'auto' : 'none',
                      }}
                    >
                      <div style={{
                        background: 'rgba(15, 23, 42, 0.85)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        borderRadius: 10,
                        border: '1px solid rgba(255,255,255,0.12)',
                        padding: isFullscreen ? '14px 20px' : '10px 14px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                        minWidth: isFullscreen ? 280 : 220,
                      }}>
                        {/* Header: brand + status */}
                        <div 
                          onMouseDown={handleMouseDown}
                          onTouchStart={handleTouchStart}
                          style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            marginBottom: 8,
                            cursor: 'move',
                            userSelect: 'none',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: isFullscreen ? 12 : 10, cursor: 'move', color: '#94a3b8' }}>⋮⋮</span>
                            <span style={{ fontSize: isFullscreen ? 13 : 11 }}>🏸</span>
                            <span style={{ fontSize: isFullscreen ? 11 : 9, fontWeight: 700, color: '#2563eb', letterSpacing: 0.5 }}>
                              MatchPoint
                            </span>
                          </div>
                          <div className="no-drag" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {isLive && (
                              <span style={{
                                display: 'flex', alignItems: 'center', gap: 4,
                                fontSize: isFullscreen ? 10 : 8, fontWeight: 700, color: '#ef4444',
                                background: 'rgba(239,68,68,0.15)', padding: '2px 6px', borderRadius: 100,
                              }}>
                                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444', animation: 'fs-pulse 1.5s infinite' }} />
                                LIVE
                              </span>
                            )}
                            {isCompleted && (
                              <span style={{ fontSize: isFullscreen ? 10 : 8, fontWeight: 700, color: '#10b981' }}>✓ FINAL</span>
                            )}
                            
                            {/* Overlay Settings Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsSettingsOpen(!isSettingsOpen);
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#cbd5e1',
                                cursor: 'pointer',
                                padding: '2px',
                                fontSize: '13px',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                              title="Overlay settings"
                            >
                              ⚙️
                            </button>
                            
                            {/* Hide Overlay Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowScoreOverlay(false);
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#cbd5e1',
                                cursor: 'pointer',
                                padding: '2px',
                                fontSize: '13px',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                              title="Hide overlay"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        {isSettingsOpen && (
                          <div className="no-drag" style={{
                            marginTop: 10,
                            marginBottom: 10,
                            padding: 8,
                            background: 'rgba(11, 14, 23, 0.95)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                            fontSize: 11,
                          }}>
                            {/* Size selection */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                              <span style={{ color: '#94a3b8' }}>Size:</span>
                              <div style={{ display: 'flex', gap: 4 }}>
                                {[
                                  { scale: 0.8, label: 'S' },
                                  { scale: 1.0, label: 'M' },
                                  { scale: 1.2, label: 'L' }
                                ].map(sz => (
                                  <button
                                    key={sz.label}
                                    onClick={() => setOverlayScale(sz.scale)}
                                    style={{
                                      padding: '2px 6px',
                                      background: overlayScale === sz.scale ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                                      color: '#ffffff',
                                      border: 'none',
                                      borderRadius: 4,
                                      cursor: 'pointer',
                                      fontWeight: overlayScale === sz.scale ? 'bold' : 'normal'
                                    }}
                                  >
                                    {sz.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                            
                            {/* Snap positions */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <span style={{ color: '#94a3b8' }}>Snap to:</span>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                                {[
                                  { corner: 'top-left' as const, label: 'Top-Left' },
                                  { corner: 'top-right' as const, label: 'Top-Right' },
                                  { corner: 'bottom-left' as const, label: 'Bottom-Left' },
                                  { corner: 'bottom-right' as const, label: 'Bottom-Right' }
                                ].map(pos => (
                                  <button
                                    key={pos.corner}
                                    onClick={() => snapToCorner(pos.corner)}
                                    style={{
                                      padding: '2px 4px',
                                      background: 'rgba(255,255,255,0.05)',
                                      color: '#cbd5e1',
                                      border: 'none',
                                      borderRadius: 4,
                                      cursor: 'pointer',
                                      fontSize: 10
                                    }}
                                  >
                                    {pos.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Player 1 */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {getTeamLogo(match.player1_name) ? (
                              <img
                                src={getTeamLogo(match.player1_name)!}
                                alt={match.player1_name}
                                style={{
                                  width: isFullscreen ? 24 : 20,
                                  height: isFullscreen ? 24 : 20,
                                  borderRadius: 4,
                                  objectFit: 'cover',
                                }}
                              />
                            ) : (
                              <div style={{
                                width: isFullscreen ? 24 : 20, height: isFullscreen ? 24 : 20, borderRadius: '50%',
                                background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: isFullscreen ? 10 : 9, fontWeight: 700, color: '#fff',
                              }}>
                                {match.player1_name.charAt(0)}
                              </div>
                            )}
                            <span style={{
                              fontSize: isFullscreen ? 13 : 11, fontWeight: 600, color: '#f8fafc',
                              maxWidth: isFullscreen ? 160 : 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              display: 'inline-flex', alignItems: 'center', gap: 4
                            }}>
                              {match.player1_name}
                              {servingTeam === 'player1' && (
                                <span style={{ marginLeft: 4, filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.5))' }} title="Serving">
                                  {getServeIndicator(match.sport)}
                                </span>
                              )}
                            </span>
                          </div>
                          
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            {/* Completed sets */}
                            {match.sets?.filter(s => s.is_complete).map((s, idx) => (
                              <span key={idx} style={{
                                fontSize: isFullscreen ? 16 : 13, fontWeight: 700, fontFamily: 'var(--font-mono)',
                                color: '#94a3b8', background: 'rgba(255,255,255,0.06)',
                                padding: '2px 8px', borderRadius: 4, minWidth: 24, textAlign: 'center'
                              }}>
                                {s.player1_score}
                              </span>
                            ))}
                            {/* Current Set */}
                            {!isCompleted && activeSet && (
                              <span style={{
                                fontSize: isFullscreen ? 18 : 14, fontWeight: 800, fontFamily: 'var(--font-mono)',
                                color: '#ffffff', background: 'rgba(255,255,255,0.12)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                padding: '2px 8px', borderRadius: 4, minWidth: 24, textAlign: 'center'
                              }}>
                                {activeSet.player1_score}
                              </span>
                            )}
                            {/* Game Points (Tennis only, if game is in progress) */}
                            {match.sport === 'tennis' && gameInProgress && (
                              <span style={{
                                fontSize: isFullscreen ? 18 : 14, fontWeight: 800, fontFamily: 'var(--font-mono)',
                                color: '#facc15', background: 'rgba(250, 204, 21, 0.15)',
                                border: '1px solid rgba(250, 204, 21, 0.4)',
                                padding: '2px 8px', borderRadius: 4, minWidth: 32, textAlign: 'center'
                              }}>
                                {tennisP1Points}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Player 2 */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {getTeamLogo(match.player2_name) ? (
                              <img
                                src={getTeamLogo(match.player2_name)!}
                                alt={match.player2_name}
                                style={{
                                  width: isFullscreen ? 24 : 20,
                                  height: isFullscreen ? 24 : 20,
                                  borderRadius: 4,
                                  objectFit: 'cover',
                                }}
                              />
                            ) : (
                              <div style={{
                                width: isFullscreen ? 24 : 20, height: isFullscreen ? 24 : 20, borderRadius: '50%',
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: isFullscreen ? 10 : 9, fontWeight: 700, color: '#fff',
                              }}>
                                {match.player2_name.charAt(0)}
                              </div>
                            )}
                            <span style={{
                              fontSize: isFullscreen ? 13 : 11, fontWeight: 600, color: '#f8fafc',
                              maxWidth: isFullscreen ? 160 : 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              display: 'inline-flex', alignItems: 'center', gap: 4
                            }}>
                              {match.player2_name}
                              {servingTeam === 'player2' && (
                                <span style={{ marginLeft: 4, filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.5))' }} title="Serving">
                                  {getServeIndicator(match.sport)}
                                </span>
                              )}
                            </span>
                          </div>
                          
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            {/* Completed sets */}
                            {match.sets?.filter(s => s.is_complete).map((s, idx) => (
                              <span key={idx} style={{
                                fontSize: isFullscreen ? 16 : 13, fontWeight: 700, fontFamily: 'var(--font-mono)',
                                color: '#94a3b8', background: 'rgba(255,255,255,0.06)',
                                padding: '2px 8px', borderRadius: 4, minWidth: 24, textAlign: 'center'
                              }}>
                                {s.player2_score}
                              </span>
                            ))}
                            {/* Current Set */}
                            {!isCompleted && activeSet && (
                              <span style={{
                                fontSize: isFullscreen ? 18 : 14, fontWeight: 800, fontFamily: 'var(--font-mono)',
                                color: '#cbd5e1', background: 'rgba(255,255,255,0.12)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                padding: '2px 8px', borderRadius: 4, minWidth: 24, textAlign: 'center'
                              }}>
                                {activeSet.player2_score}
                              </span>
                            )}
                            {/* Game Points (Tennis only, if game is in progress) */}
                            {match.sport === 'tennis' && gameInProgress && (
                              <span style={{
                                fontSize: isFullscreen ? 18 : 14, fontWeight: 800, fontFamily: 'var(--font-mono)',
                                color: '#facc15', background: 'rgba(250, 204, 21, 0.15)',
                                border: '1px solid rgba(250, 204, 21, 0.4)',
                                padding: '2px 8px', borderRadius: 4, minWidth: 32, textAlign: 'center'
                              }}>
                                {tennisP2Points}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Completed set scores (compact) */}
                        {match.sets && match.sets.filter(s => s.is_complete).length > 0 && (
                          <div style={{
                            marginTop: 6, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.1)',
                            display: 'flex', gap: 6, justifyContent: 'center',
                          }}>
                            {match.sets.filter(s => s.is_complete).map((s, i) => (
                              <span key={i} style={{ fontSize: isFullscreen ? 11 : 9, color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                                {s.player1_score}-{s.player2_score}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Custom Overlay Visibility Toggle Button */}
                  <button
                    onClick={() => setShowScoreOverlay(!showScoreOverlay)}
                    style={{
                      position: 'absolute',
                      bottom: isFullscreen ? 80 : 16,
                      right: isFullscreen ? 80 : 60,
                      zIndex: 20,
                      width: isFullscreen ? 44 : 36,
                      height: isFullscreen ? 44 : 36,
                      borderRadius: 8,
                      background: 'rgba(15, 23, 42, 0.75)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#f8fafc',
                      fontSize: isFullscreen ? 16 : 13,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: showOverlay ? 1 : 0,
                      transition: 'opacity 0.3s ease',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    }}
                    title={showScoreOverlay ? 'Hide Score Card' : 'Show Score Card'}
                  >
                    {showScoreOverlay ? '👁️' : '👁️‍🗨️'}
                  </button>

                  {/* Custom Fullscreen Toggle Button */}
                  <button
                    onClick={toggleFullscreen}
                    style={{
                      position: 'absolute',
                      bottom: isFullscreen ? 80 : 16,
                      right: isFullscreen ? 24 : 12,
                      zIndex: 20,
                      width: isFullscreen ? 44 : 36,
                      height: isFullscreen ? 44 : 36,
                      borderRadius: 8,
                      background: 'rgba(15, 23, 42, 0.75)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#f8fafc',
                      fontSize: isFullscreen ? 18 : 14,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: showOverlay ? 1 : 0,
                      transition: 'opacity 0.3s ease',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    }}
                    title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Fullscreen'}
                  >
                    {isFullscreen ? '⊘' : '⛶'}
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="glass-card"
                style={{
                  height: 340,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: 12,
                  marginBottom: 20,
                  border: '1px dashed rgba(255,255,255,0.1)',
                }}
              >
                <span style={{ fontSize: 56 }}>📺</span>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>No Stream Available</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 400, textAlign: 'center', margin: 0 }}>
                  {isLive
                    ? 'The umpire or admin can add a YouTube live stream link via the Media Hub to enable live streaming here.'
                    : 'No video recording was linked to this match.'}
                </p>
              </div>
            )}

            {/* Video Selector (if multiple videos) */}
            {ytVideos.length > 1 && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                {ytVideos.map((v, i) => {
                  const isActive = activeVideoUrl === v.file_url;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setActiveVideoUrl(v.file_url)}
                      className="btn btn-sm"
                      style={{
                        fontSize: 11,
                        padding: '6px 12px',
                        background: isActive ? 'var(--accent-subtle)' : 'rgba(255,255,255,0.03)',
                        color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                        border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                      }}
                    >
                      ▶ {v.caption || `Camera ${i + 1}`}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Score Timeline for VOD Replay */}
            {hasTimeline && matchHistory?.points_history && (
              <div className="glass-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <div style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    📊 Score Timeline
                  </h3>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {formatDuration(currentVideoTime)}
                  </span>
                </div>
                <div style={{ maxHeight: 260, overflowY: 'auto', padding: '0' }}>
                  {matchHistory.points_history.map((point, idx) => {
                    const isActive = idx < matchHistory.points_history!.length - 1
                      ? point.timestamp_sec <= currentVideoTime && matchHistory.points_history![idx + 1].timestamp_sec > currentVideoTime
                      : point.timestamp_sec <= currentVideoTime;
                    const scorerName = point.scorer === match.player1_id ? match.player1_name : match.player2_name;

                    return (
                      <div
                        key={idx}
                        onClick={() => seekToTime(point.timestamp_sec)}
                        style={{
                          padding: '10px 20px',
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          cursor: 'pointer',
                          background: isActive ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
                          borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                        onMouseOver={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                        onMouseOut={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: isActive ? 'var(--accent)' : 'var(--text-primary)' }}>
                            Point {point.point}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>
                            Set {point.set} · {scorerName} scores
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <span style={{
                            fontSize: 13,
                            fontWeight: 700,
                            fontFamily: 'var(--font-mono)',
                            color: isActive ? 'var(--accent)' : 'var(--text-primary)',
                          }}>
                            {point.p1_score} - {point.p2_score}
                          </span>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', minWidth: 40, textAlign: 'right' }}>
                            {formatDuration(point.timestamp_sec)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Live Score Panel */}
          <div className="watch-right-panel">
            {/* Score Card */}
            <div
              className="glass-card animate-slide-up"
              style={{
                padding: 0,
                overflow: 'hidden',
                border: isLive ? '1px solid rgba(37, 99, 235, 0.3)' : '1px solid var(--border)',
                boxShadow: isLive ? '0 0 40px rgba(37, 99, 235, 0.08)' : undefined,
                marginBottom: 16,
              }}
            >
              {/* Score Header */}
              <div style={{
                padding: '14px 20px',
                background: isLive ? 'rgba(37, 99, 235, 0.08)' : 'rgba(255,255,255,0.02)',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: isLive ? 'var(--accent)' : 'var(--text-primary)' }}>
                  {isLive ? '⚡ LIVE SCORE' : isCompleted ? '🏆 FINAL SCORE' : 'SCORE'}
                </span>
                {isLive && match.sets && (
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    <IconActivity size={12} /> Set {match.sets.length}
                  </span>
                )}
              </div>

              {/* Player Scores */}
              <div style={{ padding: '24px 20px' }}>
                {/* Player 1 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {getTeamLogo(match.player1_name) ? (
                      <img
                        src={getTeamLogo(match.player1_name)!}
                        alt={match.player1_name}
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 8,
                          objectFit: 'cover',
                          border: '2px solid var(--border)',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                        }}
                      />
                    ) : (
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: match.winner_id === match.player1_id
                          ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                          : 'linear-gradient(135deg, var(--accent), #3b82f6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, fontWeight: 700, color: '#fff',
                      }}>
                        {match.winner_id === match.player1_id ? '👑' : match.player1_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        {match.player1_name}
                        {servingTeam === 'player1' && (
                          <span title="Serving">
                            {getServeIndicator(match.sport)}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Sets won: {p1SetsWon}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {/* Completed sets */}
                    {match.sets?.filter(s => s.is_complete).map((s, idx) => (
                      <span key={idx} style={{
                        fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)',
                        color: 'var(--text-secondary)', background: 'var(--bg-elevated)',
                        padding: '4px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                        minWidth: 32, textAlign: 'center'
                      }}>
                        {s.player1_score}
                      </span>
                    ))}
                    {/* Current Set */}
                    {!isCompleted && activeSet && (
                      <span style={{
                        fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-mono)',
                        color: 'var(--text-primary)', background: 'var(--bg-card)',
                        border: '2px solid var(--border)',
                        padding: '4px 12px', borderRadius: 'var(--radius-sm)',
                        minWidth: 32, textAlign: 'center'
                      }}>
                        {activeSet.player1_score}
                      </span>
                    )}
                    {/* Game Points (Tennis only, if game is in progress) */}
                    {match.sport === 'tennis' && gameInProgress && (
                      <span style={{
                        fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-mono)',
                        color: 'var(--accent)', background: 'var(--accent-subtle)',
                        border: '2px solid var(--accent)',
                        padding: '4px 12px', borderRadius: 'var(--radius-sm)',
                        minWidth: 44, textAlign: 'center'
                      }}>
                        {tennisP1Points}
                      </span>
                    )}
                  </div>
                </div>

                {/* VS Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '0 0 20px 0' }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: 2 }}>VS</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                </div>

                {/* Player 2 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {getTeamLogo(match.player2_name) ? (
                      <img
                        src={getTeamLogo(match.player2_name)!}
                        alt={match.player2_name}
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 8,
                          objectFit: 'cover',
                          border: '2px solid var(--border)',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                        }}
                      />
                    ) : (
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: match.winner_id === match.player2_id
                          ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                          : 'linear-gradient(135deg, #10b981, #059669)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, fontWeight: 700, color: '#fff',
                      }}>
                        {match.winner_id === match.player2_id ? '👑' : match.player2_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        {match.player2_name}
                        {servingTeam === 'player2' && (
                          <span title="Serving">
                            {getServeIndicator(match.sport)}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Sets won: {p2SetsWon}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {/* Completed sets */}
                    {match.sets?.filter(s => s.is_complete).map((s, idx) => (
                      <span key={idx} style={{
                        fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)',
                        color: 'var(--text-secondary)', background: 'var(--bg-elevated)',
                        padding: '4px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                        minWidth: 32, textAlign: 'center'
                      }}>
                        {s.player2_score}
                      </span>
                    ))}
                    {/* Current Set */}
                    {!isCompleted && activeSet && (
                      <span style={{
                        fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-mono)',
                        color: 'var(--text-primary)', background: 'var(--bg-card)',
                        border: '2px solid var(--border)',
                        padding: '4px 12px', borderRadius: 'var(--radius-sm)',
                        minWidth: 32, textAlign: 'center'
                      }}>
                        {activeSet.player2_score}
                      </span>
                    )}
                    {/* Game Points (Tennis only, if game is in progress) */}
                    {match.sport === 'tennis' && gameInProgress && (
                      <span style={{
                        fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-mono)',
                        color: 'var(--accent)', background: 'var(--accent-subtle)',
                        border: '2px solid var(--accent)',
                        padding: '4px 12px', borderRadius: 'var(--radius-sm)',
                        minWidth: 44, textAlign: 'center'
                      }}>
                        {tennisP2Points}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Set History */}
              {match.sets && match.sets.length > 1 && (
                <div style={{
                  padding: '12px 20px',
                  borderTop: '1px solid var(--border)',
                  background: 'rgba(0,0,0,0.05)',
                }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: 0.5 }}>SET SCORES</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {match.sets.filter(s => s.is_complete).map((s, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: 'var(--bg-elevated)',
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border)',
                          fontSize: 13,
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 2 }}>Set {s.set_number}</div>
                        {s.player1_score} - {s.player2_score}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Win Predictor for live matches */}
              {isLive && activeSet && (
                <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)' }}>
                  <WinPredictorGauge
                    player1Name={match.player1_name}
                    player2Name={match.player2_name}
                    player1Score={activeSet.player1_score}
                    player2Score={activeSet.player2_score}
                    player1Sets={p1SetsWon}
                    player2Sets={p2SetsWon}
                    servingTeam={(match as any).serving_team || null}
                  />
                </div>
              )}
            </div>

            {/* Match Info Card */}
            <div className="glass-card" style={{
              padding: 16,
              border: '1px solid var(--border)',
              fontSize: 12,
              color: 'var(--text-secondary)',
              marginBottom: 16,
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {tournament && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Tournament</span>
                    <span style={{ fontWeight: 600 }}>{tournament.name}</span>
                  </div>
                )}
                {event && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Event</span>
                    <span style={{ fontWeight: 600 }}>{event.event_name}</span>
                  </div>
                )}
                {match.court && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Court</span>
                    <span style={{ fontWeight: 600 }}>{match.court}</span>
                  </div>
                )}
                {match.umpire_name && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Umpire</span>
                    <span style={{ fontWeight: 600 }}>{match.umpire_name}</span>
                  </div>
                )}
                {match.max_viewers !== undefined && match.max_viewers > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Peak Viewers</span>
                    <span style={{ fontWeight: 600 }}>👁️ {match.max_viewers}</span>
                  </div>
                )}
                {match.duration_seconds && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Duration</span>
                    <span style={{ fontWeight: 600 }}>{formatDuration(match.duration_seconds)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Winner Banner for completed matches */}
            {isCompleted && match.winner_id && (
              <div
                className="glass-card animate-slide-up"
                style={{
                  padding: 20,
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.05))',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  textAlign: 'center',
                  marginBottom: 16,
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 4 }}>🏆</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#f59e0b', letterSpacing: 1, marginBottom: 4 }}>WINNER</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
                  {match.winner_id === match.player1_id ? match.player1_name : match.player2_name}
                </div>
              </div>
            )}
          </div>

          {/* Chat Sidebar */}
          {chatOpen && (
            <div
              className="glass-card animate-slide-up watch-chat-panel"
            >
              <div style={{ position: 'absolute', right: 12, top: 12, zIndex: 10 }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setChatOpen(false)}
                  style={{ minWidth: 0, padding: '4px 8px', color: 'var(--text-muted)', fontSize: 11 }}
                >
                  ✕
                </button>
              </div>
              <MatchCommentsSidebar matchId={matchId} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
