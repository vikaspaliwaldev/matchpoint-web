'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  getTournamentBySlug,
  getEventsByTournament,
  getMatchesByTournament,
  getTeamsByTournament,
  getTournamentMedia,
  getPlayers,
  createTournamentFeedback,
} from '@/lib/supabase-service';
import {
  IconCalendar,
  IconMapPin,
  IconTrophy,
  IconShuttlecock,
  IconArrowLeft,
  IconActivity,
  IconUsers,
  IconX,
} from '@/components/icons';
import { Match, TournamentMedia, Tournament, TournamentEvent, Team, User } from '@/types';
import WinPredictorGauge from '@/components/WinPredictorGauge';
import MatchCommentsSidebar from '@/components/MatchCommentsSidebar';
import MatchMediaModal, { getYouTubeEmbedUrl, getYouTubeThumbnail } from '@/components/MatchMediaModal';
import { useAuth } from '@/lib/auth-context';
import { getMatchNumber, getUniqueMatchId } from '@/lib/match-numbering';
import { generateMatchHighlights } from '@/lib/highlights';
import { calculateVolleyballStandings } from '@/lib/sports-rules';
import { getTeamLogo, registerTeamLogo } from '@/lib/team-logos';

// Helper for dynamic voting confidence percentages
const getCrowdConfidence = (match: Match, userVote?: 'player1' | 'player2') => {
  let hash = 0;
  const str = match.id + (match.player1_name || '') + (match.player2_name || '');
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const baseSplit = Math.abs(hash % 31) + 35; // Generates a percentage between 35% and 66%
  
  let p1Pct = baseSplit;
  let p2Pct = 100 - baseSplit;
  
  if (userVote === 'player1') {
    p1Pct = Math.min(95, p1Pct + 5);
    p2Pct = 100 - p1Pct;
  } else if (userVote === 'player2') {
    p2Pct = Math.min(95, p2Pct + 5);
    p1Pct = 100 - p2Pct;
  }
  
  return { p1Pct, p2Pct };
};

// Algorithmic scrapers to detect high-intensity matches
const getMatchIntensity = (match: Match): number => {
  if (match.status !== 'completed' || !match.sets || match.sets.length === 0) return 0;
  
  let totalPoints = 0;
  let isComeback = false;
  let maxDiffInSet = 0;
  let hasDeuce = false;

  const completedSets = match.sets.filter(s => s.is_complete);
  if (completedSets.length === 0) return 0;

  completedSets.forEach((set) => {
    const p1 = set.player1_score;
    const p2 = set.player2_score;
    totalPoints += p1 + p2;
    const diff = Math.abs(p1 - p2);
    if (diff > maxDiffInSet) maxDiffInSet = diff;
    if (p1 > 21 || p2 > 21 || (p1 === 21 && p2 === 20) || (p2 === 21 && p1 === 20)) {
      hasDeuce = true;
    }
  });

  // Check if first set winner is different from match winner
  const firstSetWinner = completedSets[0].winner_id;
  if (firstSetWinner && firstSetWinner !== match.winner_id) {
    isComeback = true;
  }

  let score = totalPoints * 1.0;
  score += completedSets.length * 15.0; // More sets = higher drama
  if (hasDeuce) score += 20.0;
  if (isComeback) score += 25.0;
  if (maxDiffInSet <= 3) score += 10.0; // Close sets = higher drama

  return score;
};

const getMatchOfTheDay = (matches: Match[]): Match | null => {
  const completed = matches.filter(m => m.status === 'completed');
  if (completed.length === 0) return null;
  
  let bestMatch = completed[0];
  let maxScore = getMatchIntensity(bestMatch);
  
  for (let i = 1; i < completed.length; i++) {
    const score = getMatchIntensity(completed[i]);
    if (score > maxScore) {
      maxScore = score;
      bestMatch = completed[i];
    }
  }
  
  return maxScore > 0 ? bestMatch : null;
};

// Bracket round names
const getRoundLabel = (roundIndex: number, totalRounds: number) => {
  const fromFinal = totalRounds - roundIndex;
  switch (fromFinal) {
    case 1: return 'Final 🏆';
    case 2: return 'Semi Finals';
    case 3: return 'Quarter Finals';
    case 4: return 'Round of 16';
    case 5: return 'Round of 32';
    default: return `Round ${roundIndex + 1}`;
  }
};

export default function TournamentPublicView({ slug }: { slug: string }) {
  const { user, logout } = useAuth();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [events, setEvents] = useState<TournamentEvent[]>([]);
  const [tournamentTeams, setTournamentTeams] = useState<Team[]>([]);
  const [allPlayers, setAllPlayers] = useState<User[]>([]);
  const [teamSearch, setTeamSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'live' | 'schedule' | 'results' | 'draw' | 'standings' | 'teams' | 'gallery'>('live');
  const [liveScores, setLiveScores] = useState<Match[]>([]);
  const [media, setMedia] = useState<TournamentMedia[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [activeChatMatchId, setActiveChatMatchId] = useState<string | null>(null);
  const [selectedMediaMatch, setSelectedMediaMatch] = useState<Match | null>(null);
  const [expandedSummaryMatchId, setExpandedSummaryMatchId] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [predictions, setPredictions] = useState<Record<string, 'player1' | 'player2'>>({});
  const [schedulePage, setSchedulePage] = useState(1);
  const schedulePageSize = 10;

  useEffect(() => {
    setSchedulePage(1);
  }, [selectedEventId]);

  // Bug Report / Feedback Portal States
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackType, setFeedbackType] = useState('bug');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackName, setFeedbackName] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('matchpoint_predictions');
      if (stored) {
        setPredictions(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load predictions:', e);
    }
  }, []);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tournament || !feedbackMessage.trim()) return;

    try {
      setIsSubmittingFeedback(true);
      await createTournamentFeedback({
        tournament_id: tournament.id,
        user_name: feedbackName.trim() || 'Anonymous',
        feedback_type: feedbackType,
        message: feedbackMessage.trim(),
      });
      setFeedbackSuccess(true);
      setFeedbackMessage('');
      setFeedbackName('');
      
      // Auto close and reset modal after 4 seconds
      setTimeout(() => {
        setShowFeedbackModal(false);
        setFeedbackSuccess(false);
      }, 4000);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleVote = (matchId: string, playerKey: 'player1' | 'player2') => {
    const newPredictions = { ...predictions, [matchId]: playerKey };
    setPredictions(newPredictions);
    localStorage.setItem('matchpoint_predictions', JSON.stringify(newPredictions));
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    
    async function loadData() {
      try {
        const tour = await getTournamentBySlug(slug);
        if (!active) return;
        
        if (!tour) {
          setTournament(null);
          setLoading(false);
          return;
        }

        setTournament(tour);
        if (typeof window !== 'undefined') {
          document.title = `${tour.name} — MatchPoint`;
        }

        const [evs, matches, med, tms, plyrs] = await Promise.all([
          getEventsByTournament(tour.id),
          getMatchesByTournament(tour.id),
          getTournamentMedia(tour.id),
          getTeamsByTournament(tour.id),
          getPlayers()
        ]);

        if (active) {
          setEvents(evs);
          setLiveScores(matches);
          setMedia(med);
          setTournamentTeams(tms || []);
          setAllPlayers(plyrs || []);
          // Register dynamic team logos if present
          (tms || []).forEach(team => {
            if (team.name && team.logo_url) {
              registerTeamLogo(team.name, team.logo_url);
            }
          });
          setLoadingMedia(false);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load tournament data:', err);
        if (active) setLoading(false);
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [slug]);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
  };

  const nextImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % media.length);
  };

  const prevImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex - 1 + media.length) % media.length);
  };

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, media]);


  // Poll actual match and scores data periodically from database when on live tab
  useEffect(() => {
    if (!tournament || activeTab !== 'live') return;
    
    let active = true;
    async function pollMatches() {
      if (!tournament) return;
      try {
        const matches = await getMatchesByTournament(tournament.id);
        if (active) {
          setLiveScores(matches);
          setLastSynced(new Date());
        }
      } catch (err) {
        console.error('Failed to poll tournament matches:', err);
      }
    }

    pollMatches();
    const interval = setInterval(pollMatches, 15000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [tournament, activeTab]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        color: 'var(--text-secondary)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-spin" style={{ display: 'inline-block', fontSize: 32, marginBottom: 12, animation: 'spin 2s linear infinite' }}>🔄</div>
          <p style={{ fontSize: 16, fontWeight: 500 }}>Loading Tournament Standings...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
      }}>
        <div className="empty-state">
          <div style={{ fontSize: 64 }}>🏸</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginTop: 16, marginBottom: 8 }}>Tournament Not Found</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>The tournament you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/" className="btn btn-primary">Go Home</Link>
        </div>
      </div>
    );
  }

  const filteredScores = selectedEventId === 'all'
    ? liveScores
    : liveScores.filter(m => m.event_id === selectedEventId);

  const liveMatches = filteredScores.filter(m => m.status === 'running' || m.status === 'paused');
  const scheduledMatches = [...filteredScores].sort((a, b) => {
    const timeA = a.scheduled_time ? new Date(a.scheduled_time).getTime() : 0;
    const timeB = b.scheduled_time ? new Date(b.scheduled_time).getTime() : 0;
    
    // Sort strictly by scheduled time first if both have valid timestamps
    if (timeA !== 0 && timeB !== 0) {
      if (timeA !== timeB) return timeA - timeB;
    } else if (timeA !== 0) {
      return -1;
    } else if (timeB !== 0) {
      return 1;
    }
    
    // Tie-breaker by fixture position or round
    const posA = a.fixture_position ?? 0;
    const posB = b.fixture_position ?? 0;
    if (posA !== posB) return posA - posB;

    return a.id.localeCompare(b.id);
  });
  
  const totalScheduleItems = scheduledMatches.length;
  const totalSchedulePages = Math.ceil(totalScheduleItems / schedulePageSize) || 1;
  const paginatedScheduleMatches = scheduledMatches.slice((schedulePage - 1) * schedulePageSize, schedulePage * schedulePageSize);
  
  const completedMatches = filteredScores.filter(m => m.status === 'completed');

  return (
    <div data-active-sport={tournament.sport} style={{ minHeight: '100vh', background: 'transparent' }}>
      {/* Nav */}
      <nav className="nav">
        <div className="container-app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{
              width: 32, height: 32,
              background: 'linear-gradient(135deg, var(--accent), #3b82f6)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {tournament.sport === 'badminton' && <span style={{ fontSize: 16 }}>🏸</span>}
              {tournament.sport === 'table_tennis' && <span style={{ fontSize: 16 }}>🏓</span>}
              {tournament.sport === 'squash' && <span style={{ fontSize: 16 }}>🎾</span>}
              {tournament.sport === 'tennis' && <span style={{ fontSize: 16 }}>🥎</span>}
              {tournament.sport === 'volleyball' && <span style={{ fontSize: 16 }}>🏐</span>}
              {tournament.sport === 'cricket' && <span style={{ fontSize: 16 }}>🏏</span>}
              {tournament.sport === 'basketball' && <span style={{ fontSize: 16 }}>🏀</span>}
              {(tournament.sport === 'all' || !tournament.sport) && <IconShuttlecock size={16} />}
            </div>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>MatchPoint</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {user ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--accent), #3b82f6)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 700, color: '#fff'
                    }}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                    Hi, {user.name}
                  </span>
                </div>
                <Link href="/dashboard" className="btn btn-primary btn-sm">Dashboard</Link>
                <button 
                  onClick={logout} 
                  className="btn btn-ghost btn-sm" 
                  style={{ cursor: 'pointer' }}
                >
                  Log Out
                </button>
              </>
            ) : (
              <Link href="/login" className="btn btn-ghost btn-sm">Sign In</Link>
            )}
          </div>
        </div>
      </nav>

      {/* Tournament Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
        padding: '48px 0',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div className="container-app" style={{ position: 'relative', zIndex: 1 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.7)', fontSize: 13, textDecoration: 'none', marginBottom: 20 }}>
            <IconArrowLeft size={14} /> Back to Home
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h1 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 800, color: '#ffffff' }}>{tournament.name}</h1>
            {tournament.status === 'live' && (
              <span className="badge" style={{ fontSize: 12, background: 'rgba(255,255,255,0.2)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.25)' }}>
                <span className="live-dot" style={{ width: 6, height: 6, background: '#ffffff', boxShadow: '0 0 8px #ffffff' }} /> LIVE
              </span>
            )}
            {tournament.status === 'completed' && (
              <span className="badge" style={{ fontSize: 12, background: 'rgba(255,255,255,0.2)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.25)' }}>
                Completed
              </span>
            )}
          </div>

          <p style={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.95)', maxWidth: 600, marginBottom: 20 }}>{tournament.description}</p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, fontSize: 14, color: 'rgba(255, 255, 255, 0.85)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconCalendar size={16} />
              {new Date(tournament.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} — {new Date(tournament.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconMapPin size={16} />
              {tournament.location}
            </span>
          </div>

          {/* Event Badges */}
          <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
            {events.map(ev => (
              <span key={ev.id} style={{
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(255,255,255,0.15)',
                color: '#ffffff',
                fontSize: 13,
                fontWeight: 500,
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                {ev.event_name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container-app" style={{ padding: '28px 24px 60px' }}>
        {/* Tabs */}
        <div className="tab-group" style={{ marginBottom: 28, display: 'inline-flex', flexWrap: 'wrap', gap: 6 }}>
          <button className={`tab ${activeTab === 'live' ? 'active' : ''}`} onClick={() => setActiveTab('live')}>
            Live Scores {liveMatches.length > 0 && `(${liveMatches.length})`}
          </button>
          <button className={`tab ${activeTab === 'schedule' ? 'active' : ''}`} onClick={() => setActiveTab('schedule')}>
            Schedule
          </button>
          <button className={`tab ${activeTab === 'results' ? 'active' : ''}`} onClick={() => setActiveTab('results')}>
            Results
          </button>
          <button className={`tab ${activeTab === 'draw' ? 'active' : ''}`} onClick={() => setActiveTab('draw')}>
            Interactive Draw 🏸
          </button>
          <button className={`tab ${activeTab === 'standings' ? 'active' : ''}`} onClick={() => setActiveTab('standings')}>
            Standings & Ranks 🏆
          </button>
          <button className={`tab ${activeTab === 'teams' ? 'active' : ''}`} onClick={() => setActiveTab('teams')}>
            Teams & Rosters 🛡️ {tournamentTeams.length > 0 && `(${tournamentTeams.length})`}
          </button>
          <button className={`tab ${activeTab === 'gallery' ? 'active' : ''}`} onClick={() => setActiveTab('gallery')}>
            Media Gallery {media.length > 0 && `(${media.length})`}
          </button>
        </div>

        {/* Category Filter Selector */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 24,
          flexWrap: 'wrap',
          background: 'rgba(255, 255, 255, 0.02)',
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)'
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>🏸 Filter by Event:</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              className={`btn btn-sm ${selectedEventId === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedEventId('all')}
              style={{ fontSize: 12, padding: '6px 14px', height: 'auto', borderRadius: 'var(--radius-full)' }}
            >
              All Categories
            </button>
            {events.map(ev => (
              <button
                key={ev.id}
                className={`btn btn-sm ${selectedEventId === ev.id ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedEventId(ev.id)}
                style={{ fontSize: 12, padding: '6px 14px', height: 'auto', borderRadius: 'var(--radius-full)' }}
              >
                {ev.event_name}
              </button>
            ))}
          </div>
        </div>

        {/* Live Scores Tab */}
        {activeTab === 'live' && (
          <div>
            {lastSynced && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 12, color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.02)', padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: 20, fontFamily: 'var(--font-mono)', alignItems: 'center', width: 'fit-content' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                  Last Synced: {lastSynced.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            )}
            {liveMatches.length === 0 ? (
              <div className="empty-state" style={{ marginTop: 40 }}>
                <div style={{ fontSize: 48 }}>📺</div>
                <p style={{ fontSize: 16, fontWeight: 500, marginTop: 12 }}>No live matches right now</p>
                <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Check back during the tournament for live scoring</p>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{
                  flex: '1 1 500px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: 24
                }}>
                  {liveMatches.map(match => {
                    const currentSet = match.sets[match.sets.length - 1];
                    const eventObj = events.find(e => e.id === match.event_id);
                    const eventName = eventObj?.event_name || 'Event';
                    
                    const p1SetsWon = match.sets.filter(s => s.is_complete && s.winner_id === match.player1_id).length;
                    const p2SetsWon = match.sets.filter(s => s.is_complete && s.winner_id === match.player2_id).length;
                    const matchNumber = getMatchNumber(match.id, match.event_id, liveScores);

                    const isTeamMatch = match.sub_matches && match.sub_matches.length > 0;
                    const t1Wins = isTeamMatch ? match.sub_matches!.filter(s => s.status === 'completed' && s.winner_id === match.player1_id).length : 0;
                    const t2Wins = isTeamMatch ? match.sub_matches!.filter(s => s.status === 'completed' && s.winner_id === match.player2_id).length : 0;

                    return (
                      <div key={match.id} className="glass-card" style={{
                        padding: 0,
                        overflow: 'hidden',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                        display: 'flex',
                        flexDirection: 'column',
                      }}>
                        {/* Header */}
                        <div style={{
                          padding: '16px 20px',
                          background: 'rgba(34, 197, 94, 0.05)',
                          borderBottom: '1px solid var(--border)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {match.status === 'paused' ? (
                              <span className="badge badge-paused" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--score-point)', border: '1px solid rgba(245, 158, 11, 0.3)', display: 'inline-flex', alignItems: 'center', width: 'fit-content' }}>
                                ⏸ PAUSED
                              </span>
                            ) : (
                              <span className="badge badge-live">
                                <span className="live-dot" style={{ width: 5, height: 5 }} /> LIVE
                              </span>
                            )}
                            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span>{eventName} · Match {matchNumber}</span>
                              <span style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#93C5FD', padding: '1px 5px', borderRadius: 4, fontFamily: 'monospace', fontSize: 10, fontWeight: 700 }}>
                                {getUniqueMatchId(match)}
                              </span>
                            </span>
                          </div>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {match.court} {isTeamMatch ? '' : `· Set ${match.sets.length}`}
                          </span>
                        </div>

                        {/* Card Body */}
                        <div style={{ padding: '24px 20px 16px 20px', display: 'flex', flexDirection: 'column', gap: 16, flex: 1, justifyContent: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '10px 0' }}>
                            <div style={{ textAlign: 'center', flex: 1 }}>
                              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                {getTeamLogo(match.player1_name) && match.player1_name !== 'TBD' && match.player1_name !== 'BYE' && (
                                  <img src={getTeamLogo(match.player1_name)!} alt="" style={{ width: 18, height: 18, borderRadius: 4, objectFit: 'cover' }} />
                                )}
                                <span>{match.player1_name}</span>
                              </div>
                              <div className="score-display" style={{ fontSize: 48 }}>
                                {isTeamMatch ? t1Wins : (currentSet?.player1_score ?? 0)}
                              </div>
                              {isTeamMatch && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Ties Won</div>}
                            </div>
                            <div style={{ fontSize: 20, fontWeight: 300, color: 'var(--text-muted)', padding: '0 12px' }}>vs</div>
                            <div style={{ textAlign: 'center', flex: 1 }}>
                              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                {getTeamLogo(match.player2_name) && match.player2_name !== 'TBD' && match.player2_name !== 'BYE' && (
                                  <img src={getTeamLogo(match.player2_name)!} alt="" style={{ width: 18, height: 18, borderRadius: 4, objectFit: 'cover' }} />
                                )}
                                <span>{match.player2_name}</span>
                              </div>
                              <div className="score-display" style={{ fontSize: 48, color: 'var(--text-secondary)' }}>
                                {isTeamMatch ? t2Wins : (currentSet?.player2_score ?? 0)}
                              </div>
                              {isTeamMatch && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Ties Won</div>}
                            </div>
                          </div>

                          {/* Set history (Individual matches only) */}
                          {!isTeamMatch && match.sets.length > 1 && (
                            <div style={{
                              display: 'flex',
                              justifyContent: 'center',
                              gap: 12,
                              marginTop: 12,
                              padding: '8px 0',
                              borderTop: '1px solid var(--border)',
                            }}>
                              {match.sets.map((s, i) => (
                                <div key={i} style={{
                                  fontSize: 13,
                                  fontFamily: 'var(--font-mono)',
                                  fontWeight: 600,
                                  color: s.is_complete ? 'var(--text-muted)' : 'var(--text-primary)',
                                }}>
                                  {s.player1_score}-{s.player2_score}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Sub-matches listing for team tournaments */}
                          {isTeamMatch && (
                            <div style={{
                              marginTop: 12,
                              padding: '12px 14px',
                              background: 'rgba(255, 255, 255, 0.02)',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--border)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 10,
                            }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                                🏸 Sub-Matches Detail ({t1Wins} - {t2Wins})
                              </div>
                              {match.sub_matches!.map((sub, sIdx) => {
                                const p1Names = sub.player1_names.join(" / ") || 'TBD';
                                const p2Names = sub.player2_names.join(" / ") || 'TBD';
                                const scoreString = sub.sets.length > 0
                                  ? sub.sets.map(s => `${s.player1_score}-${s.player2_score}`).join(' | ')
                                  : 'Pending';
                                return (
                                  <div key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, gap: 8 }}>
                                    <div style={{ flex: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                      <span className="badge" style={{ padding: '1px 4px', fontSize: 9, marginRight: 6, background: 'var(--accent-subtle)', color: 'var(--accent)' }}>{sub.event_type}</span>
                                      <span style={{ fontWeight: sub.winner_id === match.player1_id ? 700 : 400, color: sub.winner_id === match.player1_id ? 'var(--score-win)' : 'var(--text-primary)' }}>{p1Names}</span>
                                      {sub.t1_trump && <span style={{ color: '#f59e0b', fontSize: 10, marginLeft: 4 }} title="Trump Match">🃏</span>}
                                    </div>
                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>{scoreString}</span>
                                    <div style={{ flex: 1, textAlign: 'right', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                      {sub.t2_trump && <span style={{ color: '#f59e0b', fontSize: 10, marginRight: 4 }} title="Trump Match">🃏</span>}
                                      <span style={{ fontWeight: sub.winner_id === match.player2_id ? 700 : 400, color: sub.winner_id === match.player2_id ? 'var(--score-win)' : 'var(--text-primary)' }}>{p2Names}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Win Predictor Gauge (Individual matches only) */}
                          {!isTeamMatch && (
                            <WinPredictorGauge 
                              player1Name={match.player1_name}
                              player2Name={match.player2_name}
                              player1Score={currentSet?.player1_score ?? 0}
                              player2Score={currentSet?.player2_score ?? 0}
                              player1Sets={p1SetsWon}
                              player2Sets={p2SetsWon}
                              servingTeam={(match as any).serving_team || (match as any).servingTeam || null}
                            />
                          )}

                          {/* Fan Prediction Pool (Individual matches only) */}
                          {!isTeamMatch ? (
                            !predictions[match.id] ? (
                              <div style={{
                                marginTop: 12,
                                padding: '10px 14px',
                                background: 'rgba(255, 255, 255, 0.02)',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px dashed var(--border)',
                                fontSize: 12
                              }}>
                                <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span>🔮</span> Predict the Winner
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                  <button 
                                    className="btn btn-ghost btn-sm" 
                                    onClick={() => handleVote(match.id, 'player1')}
                                    style={{ flex: 1, fontSize: 11, padding: '4px 8px', border: '1px solid var(--border)' }}
                                  >
                                    {match.player1_name || 'Player 1'}
                                  </button>
                                  <button 
                                    className="btn btn-ghost btn-sm" 
                                    onClick={() => handleVote(match.id, 'player2')}
                                    style={{ flex: 1, fontSize: 11, padding: '4px 8px', border: '1px solid var(--border)' }}
                                  >
                                    {match.player2_name || 'Player 2'}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div style={{
                                marginTop: 12,
                                padding: '10px 14px',
                                background: 'rgba(37, 99, 235, 0.03)',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid rgba(37, 99, 235, 0.15)',
                                fontSize: 12
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: 11, marginBottom: 4 }}>
                                  <span>🔮 Fan Predictions</span>
                                  <span style={{ fontWeight: 600, color: 'var(--accent)' }}>Voted!</span>
                                </div>
                                {(() => {
                                  const { p1Pct, p2Pct } = getCrowdConfidence(match, predictions[match.id]);
                                  return (
                                    <div>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: 12, marginBottom: 4 }}>
                                        <span>{match.player1_name}: {p1Pct}%</span>
                                        <span>{match.player2_name}: {p2Pct}%</span>
                                      </div>
                                      <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
                                        <div style={{ width: `${p1Pct}%`, background: 'linear-gradient(90deg, var(--accent), #3b82f6)', height: '100%', transition: 'width 0.5s' }} />
                                        <div style={{ width: `${p2Pct}%`, background: '#10b981', height: '100%', transition: 'width 0.5s' }} />
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            )
                          ) : null}
                        </div>

                        {/* Card Footer */}
                        <div style={{
                          padding: '12px 20px',
                          background: 'rgba(0,0,0,0.05)',
                          borderTop: '1px solid var(--border)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: 12,
                          color: 'var(--text-muted)'
                        }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <IconActivity size={13} />
                            {match.status === 'paused' ? 'Match Paused' : `Game in Set ${match.sets.length}`}
                          </span>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => setSelectedMediaMatch(match)}
                              style={{ 
                                fontSize: 11, 
                                padding: '4px 8px', 
                                color: 'var(--text-secondary)',
                                background: 'transparent',
                                borderRadius: 'var(--radius-sm)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              🎥 Media
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => setActiveChatMatchId(activeChatMatchId === match.id ? null : match.id)}
                              style={{ 
                                fontSize: 11, 
                                padding: '4px 8px', 
                                color: activeChatMatchId === match.id ? 'var(--accent)' : 'var(--text-secondary)',
                                background: activeChatMatchId === match.id ? 'var(--accent-subtle)' : 'transparent',
                                borderRadius: 'var(--radius-sm)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              💬 Chat
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Commentary Sidebar panel drawer */}
                {activeChatMatchId && (
                  <div 
                    className="glass-card animate-slide-up" 
                    style={{ 
                      width: '100%',
                      maxWidth: 380,
                      height: 520,
                      position: 'sticky',
                      top: 96,
                      padding: 0,
                      overflow: 'hidden',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <div style={{ position: 'absolute', right: 12, top: 12, zIndex: 10 }}>
                      <button 
                        className="btn btn-ghost btn-sm"
                        onClick={() => setActiveChatMatchId(null)}
                        style={{ minWidth: 0, padding: '4px 8px', color: 'var(--text-muted)', fontSize: 11 }}
                      >
                        ✕ Close
                      </button>
                    </div>
                    <MatchCommentsSidebar matchId={activeChatMatchId} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <div>
            {scheduledMatches.length === 0 ? (
              <div className="empty-state" style={{ marginTop: 40 }}>
                <div style={{ fontSize: 48 }}>📅</div>
                <p style={{ fontSize: 16, fontWeight: 500, marginTop: 12 }}>No matches scheduled yet</p>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Match</th>
                      <th>Court</th>
                      <th>Scheduled</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'center' }}>Media</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedScheduleMatches.map(match => {
                      const eventObj = events.find(e => e.id === match.event_id);
                      const eventName = eventObj?.event_name || 'Event';
                      const matchNumber = getMatchNumber(match.id, match.event_id, liveScores);
                      return (
                        <tr key={match.id}>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(37, 99, 235, 0.1)', color: 'var(--accent)', padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase' }}>
                                  {eventName} · Match {matchNumber}
                                </span>
                                <span style={{ fontSize: 10, fontWeight: 800, background: 'rgba(59, 130, 246, 0.15)', color: '#93C5FD', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace' }}>
                                  {getUniqueMatchId(match)}
                                </span>
                                <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                                  {getTeamLogo(match.player1_name) && match.player1_name !== 'TBD' && match.player1_name !== 'BYE' && (
                                    <img src={getTeamLogo(match.player1_name)!} alt="" style={{ width: 16, height: 16, borderRadius: 3, objectFit: 'cover' }} />
                                  )}
                                  <span>{match.player1_name}</span>
                                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>vs</span>
                                  {getTeamLogo(match.player2_name) && match.player2_name !== 'TBD' && match.player2_name !== 'BYE' && (
                                    <img src={getTeamLogo(match.player2_name)!} alt="" style={{ width: 16, height: 16, borderRadius: 3, objectFit: 'cover' }} />
                                  )}
                                  <span>{match.player2_name}</span>
                                </div>
                              </div>
                              
                              {/* Inline Prediction Pool for scheduled only */}
                              {match.status === 'scheduled' && (
                                <div style={{ marginTop: 4 }}>
                                  {!predictions[match.id] ? (
                                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>🔮 Predict:</span>
                                      <button onClick={() => handleVote(match.id, 'player1')} className="btn btn-ghost btn-sm" style={{ fontSize: 9, padding: '2px 6px', height: 'auto', border: '1px solid var(--border)', minWidth: 0 }}>
                                        {match.player1_name}
                                      </button>
                                      <button onClick={() => handleVote(match.id, 'player2')} className="btn btn-ghost btn-sm" style={{ fontSize: 9, padding: '2px 6px', height: 'auto', border: '1px solid var(--border)', minWidth: 0 }}>
                                        {match.player2_name}
                                      </button>
                                    </div>
                                  ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600 }}>🔮 Crowdvote:</span>
                                      {(() => {
                                        const { p1Pct, p2Pct } = getCrowdConfidence(match, predictions[match.id]);
                                        return (
                                          <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                                            {match.player1_name} ({p1Pct}%) — {match.player2_name} ({p2Pct}%)
                                          </span>
                                        );
                                      })()}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Live score inline for running */}
                              {(match.status === 'running' || match.status === 'paused') && match.sets && match.sets.length > 0 && (
                                <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--score-live)' }}>Live Score:</span>
                                  <div style={{ display: 'flex', gap: 6 }}>
                                    {match.sets.map((s, idx) => (
                                      <span key={idx} style={{
                                        fontSize: 11,
                                        fontFamily: 'var(--font-mono)',
                                        background: s.is_complete ? 'var(--bg-elevated)' : 'rgba(239, 68, 68, 0.1)',
                                        color: s.is_complete ? 'var(--text-secondary)' : 'var(--score-live)',
                                        padding: '2px 6px',
                                        borderRadius: 'var(--radius-sm)',
                                        fontWeight: 600
                                      }}>
                                        {s.player1_score}-{s.player2_score}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Result inline for completed */}
                              {match.status === 'completed' && match.sets && match.sets.length > 0 && (
                                <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--score-win)' }}>Result:</span>
                                  <div style={{ display: 'flex', gap: 6 }}>
                                    {match.sets.map((s, idx) => (
                                      <span key={idx} style={{
                                        fontSize: 11,
                                        fontFamily: 'var(--font-mono)',
                                        background: 'var(--bg-elevated)',
                                        color: 'var(--text-secondary)',
                                        padding: '2px 6px',
                                        borderRadius: 'var(--radius-sm)',
                                        fontWeight: 600
                                      }}>
                                        {s.player1_score}-{s.player2_score}
                                      </span>
                                    ))}
                                  </div>
                                  {match.winner_id && (
                                    <span style={{ fontSize: 11, color: 'var(--score-win)', fontWeight: 600 }}>
                                      🏆 {match.winner_id === match.player1_id ? match.player1_name : match.player2_name} won
                                    </span>
                                  )}
                                  {match.max_viewers !== undefined && match.max_viewers > 0 && (
                                    <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                      · 👥 {match.max_viewers} peak viewers
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td>{match.court || 'TBD'}</td>
                          <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                            {match.scheduled_time
                              ? new Date(match.scheduled_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
                              : 'Schedule TBD'
                            }
                          </td>
                          <td>
                            {(() => {
                              if (match.status === 'running' || match.status === 'paused') {
                                return (
                                  <span className="badge badge-live" style={{ background: 'var(--score-live)', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                    <span className="live-dot" style={{ background: '#fff', width: 6, height: 6 }} /> Live
                                  </span>
                                );
                              } else if (match.status === 'completed') {
                                return (
                                  <span className="badge badge-approved" style={{ background: 'rgba(34, 197, 94, 0.15)', color: 'var(--score-win)', border: 'none' }}>
                                    Completed
                                  </span>
                                );
                              } else {
                                return (
                                  <span className="badge" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                                    Not yet started
                                  </span>
                                );
                              }
                            })()}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {(() => {
                              const matchMediaList = media.filter(m => m.match_id === match.id);
                              return (
                                <button
                                  onClick={() => setSelectedMediaMatch(match)}
                                  className="btn btn-ghost btn-sm"
                                  title="View match photos & video highlights"
                                  style={{
                                    fontSize: 11,
                                    padding: '4px 8px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius-sm)',
                                    background: matchMediaList.length > 0 ? 'var(--accent-subtle)' : 'transparent',
                                    color: matchMediaList.length > 0 ? 'var(--accent)' : 'var(--text-secondary)'
                                  }}
                                >
                                  <span>📷</span>
                                  <span>{matchMediaList.length > 0 ? `${matchMediaList.length} Media` : 'Media'}</span>
                                </button>
                              );
                            })()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls for Schedule */}
            {totalScheduleItems > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, flexWrap: 'wrap', gap: 12 }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Showing {(schedulePage - 1) * schedulePageSize + 1} to {Math.min(schedulePage * schedulePageSize, totalScheduleItems)} of {totalScheduleItems} entries
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => setSchedulePage(prev => Math.max(prev - 1, 1))}
                    disabled={schedulePage === 1}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: 13 }}
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalSchedulePages }, (_, i) => i + 1)
                    .filter(page => page === 1 || page === totalSchedulePages || Math.abs(page - schedulePage) <= 1)
                    .map((page, idx, arr) => {
                      const showEllipsisBefore = idx > 0 && page - arr[idx - 1] > 1;
                      return (
                        <React.Fragment key={page}>
                          {showEllipsisBefore && <span style={{ padding: '6px 8px', color: 'var(--text-muted)' }}>...</span>}
                          <button
                            onClick={() => setSchedulePage(page)}
                            className={`btn ${schedulePage === page ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ padding: '6px 12px', fontSize: 13, minWidth: 36 }}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      );
                    })
                  }
                  <button
                    onClick={() => setSchedulePage(prev => Math.min(prev + 1, totalSchedulePages))}
                    disabled={schedulePage === totalSchedulePages}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: 13 }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && (
          <div>
            {(() => {
              const spotlightMatch = getMatchOfTheDay(liveScores);
              if (!spotlightMatch) return null;
              
              const eventObj = events.find(e => e.id === spotlightMatch.event_id);
              const eventName = eventObj?.event_name || 'Event';
              const matchNumber = getMatchNumber(spotlightMatch.id, spotlightMatch.event_id, liveScores);
              const isP1Winner = spotlightMatch.winner_id === spotlightMatch.player1_id;
              
              return (
                <div className="glass-card animate-slide-up" style={{
                  border: '2px solid rgba(245, 158, 11, 0.45)',
                  boxShadow: '0 8px 32px rgba(245, 158, 11, 0.12)',
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, var(--bg-secondary) 100%)',
                  padding: 24,
                  borderRadius: 'var(--radius-lg)',
                  marginBottom: 28,
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Glowing Spotlight Badge */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: '#0a0a0c',
                    fontWeight: 800,
                    fontSize: 10,
                    padding: '6px 18px',
                    borderRadius: '0 0 0 var(--radius-md)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
                  }}>
                    🔥 Match of the Day
                  </div>
 
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {eventName} · Match {matchNumber}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Completed at {spotlightMatch.court} • Thrilling {spotlightMatch.sets.length}-Set Clash
                    </span>
                  </div>
 
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{
                        fontSize: 18,
                        fontWeight: isP1Winner ? 800 : 400,
                        color: isP1Winner ? 'var(--score-win)' : 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}>
                        {isP1Winner && <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center' }}><IconTrophy size={16} /></span>}
                        {spotlightMatch.player1_name}
                      </div>
                      <div style={{
                        fontSize: 18,
                        fontWeight: !isP1Winner ? 800 : 400,
                        color: !isP1Winner ? 'var(--score-win)' : 'var(--text-secondary)',
                        marginTop: 6,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}>
                        {!isP1Winner && <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center' }}><IconTrophy size={16} /></span>}
                        {spotlightMatch.player2_name}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontFamily: 'var(--font-mono)' }}>
                      {spotlightMatch.sets.map((s, i) => (
                        <div key={i} style={{ textAlign: 'center', background: 'var(--bg-elevated)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Set {s.set_number}</div>
                          <div style={{
                            fontSize: 16,
                            fontWeight: 700,
                            color: s.winner_id === spotlightMatch.player1_id ? 'var(--score-win)' : 'var(--text-secondary)',
                          }}>
                            {s.player1_score}
                          </div>
                          <div style={{
                            fontSize: 16,
                            fontWeight: 700,
                            color: s.winner_id === spotlightMatch.player2_id ? 'var(--score-win)' : 'var(--text-secondary)',
                          }}>
                            {s.player2_score}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
 
                  <div style={{
                    marginTop: 18,
                    padding: '14px 18px',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    borderLeft: '4px solid #f59e0b',
                    borderRight: '1px solid var(--border)',
                    borderTop: '1px solid var(--border)',
                    borderBottom: '1px solid var(--border)',
                    fontSize: 13.5,
                    lineHeight: '1.6',
                    color: 'var(--text-secondary)',
                    backdropFilter: 'blur(8px)',
                  }}>
                    <strong>Recap:</strong> {generateMatchHighlights(spotlightMatch)}
                  </div>
                </div>
              );
            })()}

            {completedMatches.length === 0 ? (
              <div className="empty-state" style={{ marginTop: 40 }}>
                <div style={{ fontSize: 48 }}>🏆</div>
                <p style={{ fontSize: 16, fontWeight: 500, marginTop: 12 }}>No completed matches yet</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {completedMatches.map(match => {
                  const eventObj = events.find(e => e.id === match.event_id);
                  const eventName = eventObj?.event_name || 'Event';
                  const matchNumber = getMatchNumber(match.id, match.event_id, liveScores);
                  const isExpanded = expandedSummaryMatchId === match.id;

                  const isTeamMatch = match.sub_matches && match.sub_matches.length > 0;
                  const t1Wins = isTeamMatch ? match.sub_matches!.filter(s => s.status === 'completed' && s.winner_id === match.player1_id).length : 0;
                  const t2Wins = isTeamMatch ? match.sub_matches!.filter(s => s.status === 'completed' && s.winner_id === match.player2_id).length : 0;

                  return (
                    <div key={match.id} className="glass-card" style={{ padding: 16 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 8 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase' }}>
                          {eventName} · Match {matchNumber}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: 15,
                            fontWeight: match.winner_id === match.player1_id ? 700 : 400,
                            color: match.winner_id === match.player1_id ? 'var(--score-win)' : 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}>
                            {match.winner_id === match.player1_id && <IconTrophy size={14} />}
                            {match.player1_name}
                          </div>
                          <div style={{
                            fontSize: 15,
                            fontWeight: match.winner_id === match.player2_id ? 700 : 400,
                            color: match.winner_id === match.player2_id ? 'var(--score-win)' : 'var(--text-secondary)',
                            marginTop: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}>
                            {match.winner_id === match.player2_id && <IconTrophy size={14} />}
                            {match.player2_name}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 16, fontFamily: 'var(--font-mono)' }}>
                          {isTeamMatch ? (
                            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Ties Won</div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: match.winner_id === match.player1_id ? 'var(--score-win)' : 'var(--text-primary)' }}>
                                  {t1Wins}
                                </div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: match.winner_id === match.player2_id ? 'var(--score-win)' : 'var(--text-secondary)', marginTop: 2 }}>
                                  {t2Wins}
                                </div>
                              </div>
                            </div>
                          ) : (
                            match.sets.map((s, i) => (
                              <div key={i} style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Set {s.set_number}</div>
                                <div style={{
                                  fontSize: 16,
                                  fontWeight: 700,
                                  color: s.winner_id === match.player1_id ? 'var(--score-win)' : 'var(--text-secondary)',
                                }}>
                                  {s.player1_score}
                                </div>
                                <div style={{
                                  fontSize: 16,
                                  fontWeight: 700,
                                  color: s.winner_id === match.player2_id ? 'var(--score-win)' : 'var(--text-secondary)',
                                }}>
                                  {s.player2_score}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        <div style={{ marginLeft: 20 }}>
                          <span className="badge badge-completed">{match.court}</span>
                        </div>
                      </div>

                      {/* Sub-matches listing for team tournaments */}
                      {isTeamMatch && (
                        <div style={{
                          marginTop: 12,
                          padding: '12px 14px',
                          background: 'rgba(255, 255, 255, 0.01)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 10,
                        }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                            🏸 Sub-Matches Detail ({t1Wins} - {t2Wins})
                          </div>
                          {match.sub_matches!.map((sub) => {
                            const p1Names = sub.player1_names.join(" / ") || 'TBD';
                            const p2Names = sub.player2_names.join(" / ") || 'TBD';
                            const scoreString = sub.sets.length > 0
                              ? sub.sets.map(s => `${s.player1_score}-${s.player2_score}`).join(' | ')
                              : 'Pending';
                            return (
                              <div key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, gap: 8 }}>
                                <div style={{ flex: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                  <span className="badge" style={{ padding: '1px 4px', fontSize: 9, marginRight: 6, background: 'var(--accent-subtle)', color: 'var(--accent)' }}>{sub.event_type}</span>
                                  <span style={{ fontWeight: sub.winner_id === match.player1_id ? 700 : 400, color: sub.winner_id === match.player1_id ? 'var(--score-win)' : 'var(--text-primary)' }}>{p1Names}</span>
                                  {sub.t1_trump && <span style={{ color: '#f59e0b', fontSize: 10, marginLeft: 4 }} title="Trump Match">🃏</span>}
                                </div>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>{scoreString}</span>
                                <div style={{ flex: 1, textAlign: 'right', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                  {sub.t2_trump && <span style={{ color: '#f59e0b', fontSize: 10, marginRight: 4 }} title="Trump Match">🃏</span>}
                                  <span style={{ fontWeight: sub.winner_id === match.player2_id ? 700 : 400, color: sub.winner_id === match.player2_id ? 'var(--score-win)' : 'var(--text-primary)' }}>{p2Names}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Expandable Match Highlights Summary Drawer (Individual matches only) */}
                      {!isTeamMatch && (
                        <div style={{
                          marginTop: 12,
                          paddingTop: 12,
                          borderTop: '1px solid var(--border)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                        }}>
                          <button
                            onClick={() => setExpandedSummaryMatchId(isExpanded ? null : match.id)}
                            style={{
                              alignSelf: 'flex-start',
                              background: 'none',
                              border: 'none',
                              color: 'var(--accent)',
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: 0,
                            }}
                          >
                            <span>🏸 {isExpanded ? 'Hide Match Summary' : 'View Match Summary'}</span>
                            <span style={{
                              transition: 'transform 0.2s',
                              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                              fontSize: 8,
                            }}>▼</span>
                          </button>

                          {isExpanded && (
                            <div 
                              className="animate-fadeIn" 
                          style={{
                            marginTop: 4,
                            padding: '12px 16px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderRadius: 'var(--radius-sm)',
                            borderLeft: '3px solid var(--accent)',
                            fontSize: 13,
                            lineHeight: '1.6',
                            color: 'var(--text-secondary)',
                            backdropFilter: 'blur(8px)',
                          }}
                        >
                          {generateMatchHighlights(match)}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Match Media & Photos Button for all results */}
                  <div style={{
                    marginTop: 10,
                    paddingTop: 10,
                    borderTop: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 8,
                  }}>
                        {(() => {
                          const matchMediaList = media.filter(m => m.match_id === match.id);
                          return (
                            <button
                              onClick={() => setSelectedMediaMatch(match)}
                              className="btn btn-ghost btn-sm"
                              style={{
                                fontSize: 12,
                                padding: '4px 10px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-sm)',
                                background: matchMediaList.length > 0 ? 'var(--accent-subtle)' : 'var(--bg-secondary)',
                                color: matchMediaList.length > 0 ? 'var(--accent)' : 'var(--text-primary)',
                                fontWeight: 600,
                              }}
                            >
                              <span>📷</span>
                              <span>{matchMediaList.length > 0 ? `View Media & Highlights (${matchMediaList.length})` : 'View Match Media'}</span>
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Interactive Draw Tab */}
        {activeTab === 'draw' && (
          <div>
            {selectedEventId === 'all' ? (
              <div className="empty-state animate-slide-up" style={{ marginTop: 40 }}>
                <div style={{ fontSize: 48 }}>🏸</div>
                <p style={{ fontSize: 16, fontWeight: 500, marginTop: 12 }}>Select a Category to View the Visual Draw</p>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
                  Please filter by an event category above (e.g. Under 13 Boys) to render the bracket draw path.
                </p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {events.map(ev => (
                    <button
                      key={ev.id}
                      onClick={() => setSelectedEventId(ev.id)}
                      className="btn btn-secondary btn-sm"
                      style={{ borderRadius: 'var(--radius-full)' }}
                    >
                      {ev.event_name}
                    </button>
                  ))}
                </div>
              </div>
            ) : (() => {
              // Group filtered event matches by fixture_round
              const eventMatches = liveScores.filter(m => m.event_id === selectedEventId);
              if (eventMatches.length === 0) {
                return (
                  <div className="empty-state animate-slide-up" style={{ marginTop: 40 }}>
                    <div style={{ fontSize: 48 }}>📅</div>
                    <p style={{ fontSize: 16, fontWeight: 500, marginTop: 12 }}>No bracket fixtures found</p>
                    <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                      The bracket draws have not been generated for this category yet.
                    </p>
                  </div>
                );
              }

              const roundsMap: Record<number, Match[]> = {};
              eventMatches.forEach(match => {
                const r = match.fixture_round || 0;
                if (!roundsMap[r]) roundsMap[r] = [];
                roundsMap[r].push(match);
              });

              const sortedRoundNumbers = Object.keys(roundsMap)
                .map(Number)
                .sort((a, b) => a - b);

              sortedRoundNumbers.forEach(r => {
                roundsMap[r].sort((a, b) => (a.fixture_position || 0) - (b.fixture_position || 0));
              });

              const activeEventObj = events.find(e => e.id === selectedEventId);

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                      🏆 {activeEventObj?.event_name} Bracket Draw
                    </h3>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {eventMatches.length} Matches • {sortedRoundNumbers.length} Rounds
                    </span>
                  </div>

                  {/* Horizontal Scrollable Bracket Tree */}
                  <div style={{
                    overflowX: 'auto',
                    padding: '24px 0',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(0,0,0,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    minWidth: '100%'
                  }}>
                    <div style={{
                      display: 'flex',
                      gap: 48,
                      padding: '0 24px',
                      alignItems: 'center',
                      minHeight: 520,
                      margin: '0 auto'
                    }}>
                      {sortedRoundNumbers.map((roundNum, roundIdx) => {
                        const roundMatches = roundsMap[roundNum];
                        const label = getRoundLabel(roundNum, sortedRoundNumbers.length);
                        return (
                          <div
                            key={roundNum}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 20,
                              minWidth: 240,
                              height: '100%',
                              justifyContent: 'space-around',
                              position: 'relative'
                            }}
                          >
                            {/* Column Header */}
                            <div style={{
                              textAlign: 'center',
                              fontSize: 12,
                              fontWeight: 700,
                              color: 'var(--accent)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              borderBottom: '1px solid var(--border)',
                              paddingBottom: 8,
                              marginBottom: 12
                            }}>
                              {label}
                            </div>

                            {/* Column Nodes */}
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-around',
                              flex: 1,
                              gap: 16
                            }}>
                              {roundMatches.map(match => {
                                const isRunning = match.status === 'running' || match.status === 'paused';
                                const isCompleted = match.status === 'completed';
                                const hasSets = match.sets && match.sets.length > 0;
                                const isP1Winner = isCompleted && match.winner_id === match.player1_id;
                                const isP2Winner = isCompleted && match.winner_id === match.player2_id;

                                const p1Sets = hasSets ? match.sets.filter(s => s.is_complete && s.winner_id === match.player1_id).length : 0;
                                const p2Sets = hasSets ? match.sets.filter(s => s.is_complete && s.winner_id === match.player2_id).length : 0;

                                return (
                                  <div
                                    key={match.id}
                                    className="glass-card"
                                    style={{
                                      padding: '12px 14px',
                                      width: 240,
                                      border: isRunning 
                                        ? '1px solid var(--accent)' 
                                        : isCompleted 
                                        ? '1px solid rgba(255, 255, 255, 0.08)'
                                        : '1px solid var(--border)',
                                      borderRadius: 'var(--radius-md)',
                                      background: isRunning 
                                        ? 'rgba(37, 99, 235, 0.04)' 
                                        : 'var(--bg-secondary)',
                                      boxShadow: isRunning 
                                        ? '0 0 16px rgba(37, 99, 235, 0.15)' 
                                        : 'none',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: 8,
                                      position: 'relative'
                                    }}
                                  >
                                    {/* Match Label */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)' }}>
                                      <span>Match {getMatchNumber(match.id, match.event_id, liveScores)}</span>
                                      {isRunning && (
                                        <span className="live-dot" style={{ background: '#22c55e', width: 6, height: 6 }} />
                                      )}
                                      {isCompleted && (
                                        <span style={{ color: '#22c55e', fontWeight: 600 }}>Finalized</span>
                                      )}
                                    </div>

                                    {/* Player 1 Row */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, maxWidth: 170 }}>
                                        {getTeamLogo(match.player1_name) && match.player1_name !== 'TBD' && match.player1_name !== 'BYE' && (
                                          <img src={getTeamLogo(match.player1_name)!} alt="" style={{ width: 16, height: 16, borderRadius: 3, objectFit: 'cover' }} />
                                        )}
                                        {isP1Winner && <span style={{ fontSize: 11, color: 'var(--score-win)', fontWeight: 800 }}>✓</span>}
                                        <span style={{
                                          fontSize: 13,
                                          fontWeight: isP1Winner ? 700 : 400,
                                          color: isP1Winner ? 'var(--score-win)' : match.player1_id === 'BYE' || match.player1_id === 'TBD' ? 'var(--text-muted)' : 'var(--text-primary)',
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis'
                                        }}>
                                          {match.player1_name}
                                        </span>
                                      </div>
                                      {isCompleted && hasSets && (
                                        <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', color: isP1Winner ? 'var(--score-win)' : 'var(--text-muted)' }}>
                                          {p1Sets}
                                        </span>
                                      )}
                                    </div>

                                    {/* Player 2 Row */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, maxWidth: 170 }}>
                                        {getTeamLogo(match.player2_name) && match.player2_name !== 'TBD' && match.player2_name !== 'BYE' && (
                                          <img src={getTeamLogo(match.player2_name)!} alt="" style={{ width: 16, height: 16, borderRadius: 3, objectFit: 'cover' }} />
                                        )}
                                        {isP2Winner && <span style={{ fontSize: 11, color: 'var(--score-win)', fontWeight: 800 }}>✓</span>}
                                        <span style={{
                                          fontSize: 13,
                                          fontWeight: isP2Winner ? 700 : 400,
                                          color: isP2Winner ? 'var(--score-win)' : match.player2_id === 'BYE' || match.player2_id === 'TBD' ? 'var(--text-muted)' : 'var(--text-primary)',
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis'
                                        }}>
                                          {match.player2_name}
                                        </span>
                                      </div>
                                      {isCompleted && hasSets && (
                                        <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', color: isP2Winner ? 'var(--score-win)' : 'var(--text-muted)' }}>
                                          {p2Sets}
                                        </span>
                                      )}
                                    </div>

                                    {/* Set-wise scores */}
                                    {hasSets && (
                                      <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 11,
                                        fontFamily: 'var(--font-mono)',
                                        color: isRunning ? 'var(--score-live)' : 'var(--text-muted)',
                                        borderTop: '1px dashed var(--border)',
                                        paddingTop: 6,
                                        marginTop: 4,
                                        gap: 4
                                      }}>
                                        <span>Sets: </span>
                                        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                                          {match.sets.map(s => `${s.player1_score}-${s.player2_score}`).join(', ')}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Standings & Ranks Tab (Round-wise Standings) */}
        {activeTab === 'standings' && (
          <div>
            {(() => {
              // Group completed/active matches by round or group name
              const roundGroups = new Map<string, { roundTitle: string; roundOrder: number; matches: Match[] }>();

              liveScores.forEach(m => {
                let rName = m.round_name || `Round ${m.fixture_round || 1}`;
                let rOrder = m.fixture_round || 1;

                if (!roundGroups.has(rName)) {
                  roundGroups.set(rName, { roundTitle: rName, roundOrder: rOrder, matches: [] });
                }
                roundGroups.get(rName)!.matches.push(m);
              });

              const groupsArr = Array.from(roundGroups.values()).sort((a, b) => a.roundOrder - b.roundOrder);

              const roundWiseData = groupsArr.map(group => {
                const teamMap = new Map<string, string>();
                
                // If tournament has explicit teams registered, register them first
                if (tournamentTeams && tournamentTeams.length > 0) {
                  tournamentTeams.forEach(t => teamMap.set(t.name.trim().toLowerCase(), t.name.trim()));
                }

                // Also gather teams present in this round's matches, avoiding TBD and BYE
                group.matches.forEach(m => {
                  if (m.player1_name && m.player1_name !== 'TBD' && m.player1_name !== 'BYE') {
                    const key = m.player1_name.trim().toLowerCase();
                    if (!teamMap.has(key)) teamMap.set(key, m.player1_name.trim());
                  }
                  if (m.player2_name && m.player2_name !== 'TBD' && m.player2_name !== 'BYE') {
                    const key = m.player2_name.trim().toLowerCase();
                    if (!teamMap.has(key)) teamMap.set(key, m.player2_name.trim());
                  }
                });

                // Build teamsList mapping to the team's canonical ID if available
                const teamsList = Array.from(teamMap.values()).map(canonicalName => {
                  const matchedTeam = tournamentTeams.find(t => t.name.trim().toLowerCase() === canonicalName.toLowerCase());
                  return {
                    id: matchedTeam ? matchedTeam.id : canonicalName,
                    name: canonicalName
                  };
                });

                let standings = [];
                if (tournament.sport === 'volleyball') {
                  standings = calculateVolleyballStandings(teamsList, group.matches as any);
                } else {
                  standings = teamsList.map(t => {
                    let played = 0;
                    let won = 0;
                    let lost = 0;
                    let setsWon = 0;
                    let setsLost = 0;

                    group.matches.forEach(m => {
                      if (m.player1_id !== t.id && m.player2_id !== t.id) return;
                      if (m.status !== 'completed' && !m.winner_id) return;
                      played++;
                      if (m.winner_id === t.id) won++;
                      else lost++;
                      (m.sets || []).forEach(s => {
                        if (s.is_complete && s.winner_id) {
                          if (s.winner_id === t.id || (m.player1_id === t.id && s.winner_id === 'player1') || (m.player2_id === t.id && s.winner_id === 'player2')) {
                            setsWon++;
                          } else {
                            setsLost++;
                          }
                        }
                      });
                    });
                    const points = (won * 3) + (lost * 1);
                    return {
                      teamId: t.id,
                      teamName: t.name,
                      played,
                      won,
                      lost,
                      points,
                      setsWon,
                      setsLost,
                      setRatio: setsLost > 0 ? Math.round((setsWon / setsLost) * 100) / 100 : setsWon,
                      rallyPointsWon: 0,
                      rallyPointsLost: 0,
                      pointQuotient: 0,
                    };
                  }).sort((a, b) => b.points - a.points || b.won - a.won || (b.setsWon - b.setsLost) - (a.setsWon - a.setsLost));
                }

                // Count how many matches in this round actually have confirmed teams assigned
                const hasRealMatches = group.matches.some(m =>
                  m.player1_name && m.player1_name !== 'TBD' && m.player1_name !== 'BYE' &&
                  m.player2_name && m.player2_name !== 'TBD' && m.player2_name !== 'BYE'
                );

                const isRoundTbd = !hasRealMatches || teamsList.length === 0;

                return {
                  title: group.roundTitle,
                  matchesCount: group.matches.length,
                  isTbd: isRoundTbd,
                  standings: isRoundTbd ? [] : standings,
                };
              });

              if (roundWiseData.length === 0) {
                return (
                  <div className="empty-state animate-slide-up" style={{ marginTop: 40 }}>
                    <div style={{ fontSize: 48 }}>🏆</div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 12 }}>No Standings Yet</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                      Standings will appear once tournament matches are scheduled and underway.
                    </p>
                  </div>
                );
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                  <div style={{
                    padding: '16px 20px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12
                  }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                        Round-wise Tournament Standings
                      </h3>
                      <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
                        Official round & group stage rankings with FIVB 3-point system & tiebreakers.
                      </p>
                    </div>
                    <span className="badge badge-accent" style={{ fontSize: 12 }}>
                      {roundWiseData.length} Stages / Tables
                    </span>
                  </div>

                  {roundWiseData.map((roundGroup, rIdx) => (
                    <div
                      key={roundGroup.title + rIdx}
                      style={{
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        background: 'var(--bg-card)',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      {/* Table Header */}
                      <div style={{
                        padding: '16px 20px',
                        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(59, 130, 246, 0.04))',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{
                            background: 'var(--accent)',
                            color: '#fff',
                            padding: '3px 9px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: 0.5
                          }}>
                            STAGE {rIdx + 1}
                          </span>
                          <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                            {roundGroup.title}
                          </h4>
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
                          {roundGroup.standings.length} Teams · {roundGroup.matchesCount} match(es)
                        </span>
                      </div>

                      {/* Standings Table */}
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                          <thead>
                            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                              <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-secondary)', width: 70 }}>Pos</th>
                              <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-secondary)' }}>Team</th>
                              <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>Pld</th>
                              <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>W</th>
                              <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>L</th>
                              <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>Sets (W - L)</th>
                              <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>Set Ratio</th>
                              {tournament.sport === 'volleyball' && (
                                <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>Pt Quotient</th>
                              )}
                              <th style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--accent)', textAlign: 'right' }}>
                                {tournament.sport === 'volleyball' ? 'FIVB Pts' : 'Points'}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {roundGroup.isTbd || roundGroup.standings.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={tournament.sport === 'volleyball' ? 8 : 7}
                                  style={{
                                    padding: '36px 20px',
                                    textAlign: 'center',
                                    color: 'var(--text-muted)',
                                    fontStyle: 'italic',
                                    background: 'rgba(255, 255, 255, 0.01)',
                                  }}
                                >
                                  ⏳ Round fixtures & qualified teams are to be decided (TBD). Matchups will be populated by tournament administrators upon progression.
                                </td>
                              </tr>
                            ) : (
                              roundGroup.standings.map((row, idx) => {
                                const rank = idx + 1;
                                return (
                                  <tr
                                    key={row.teamId}
                                    style={{
                                      borderBottom: idx === roundGroup.standings.length - 1 ? 'none' : '1px solid var(--border)',
                                      background: rank === 1 ? 'rgba(245, 158, 11, 0.03)' : 'transparent',
                                      transition: 'background var(--transition-fast)',
                                    }}
                                    className="table-row"
                                  >
                                    <td style={{ padding: '14px 18px', fontWeight: 700, fontSize: 14, color: rank === 1 ? 'var(--accent)' : 'var(--text-primary)' }}>
                                      {rank}
                                    </td>
                                    <td style={{ padding: '14px 18px' }}>
                                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        {getTeamLogo(row.teamName) ? (
                                          <img
                                            src={getTeamLogo(row.teamName)!}
                                            alt={row.teamName}
                                            style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'cover', border: '1px solid var(--border)' }}
                                          />
                                        ) : (
                                          <span>🛡️</span>
                                        )}
                                        <span>{row.teamName}</span>
                                      </div>
                                    </td>
                                    <td style={{ padding: '14px 18px', textAlign: 'center' }}>{row.played}</td>
                                    <td style={{ padding: '14px 18px', textAlign: 'center', color: 'var(--score-win)', fontWeight: 600 }}>{row.won}</td>
                                    <td style={{ padding: '14px 18px', textAlign: 'center', color: 'var(--score-loss)' }}>{row.lost}</td>
                                    <td style={{ padding: '14px 18px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 600 }}>
                                      {row.setsWon} - {row.setsLost}
                                    </td>
                                    <td style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600 }}>
                                      {row.setRatio.toFixed(2)}
                                    </td>
                                    {tournament.sport === 'volleyball' && (
                                      <td style={{ padding: '14px 18px', textAlign: 'center', color: '#93C5FD', fontWeight: 600 }}>
                                        {row.pointQuotient.toFixed(3)}
                                      </td>
                                    )}
                                    <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 800, color: 'var(--accent)', fontSize: 15 }}>
                                      {row.points}
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* Teams & Rosters Tab */}
        {activeTab === 'teams' && (
          <div>
            {/* Search toolbar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              marginBottom: 24,
              flexWrap: 'wrap'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Tournament Teams & Squad Rosters
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
                  Browse registered team franchises, team captains, and full player lineups.
                </p>
              </div>
              <input
                className="input"
                style={{ maxWidth: 360, width: '100%' }}
                placeholder="Search by team or player name..."
                value={teamSearch}
                onChange={e => setTeamSearch(e.target.value)}
              />
            </div>

            {tournamentTeams.length === 0 ? (
              <div className="empty-state animate-slide-up" style={{ marginTop: 40 }}>
                <div style={{ fontSize: 48 }}>🛡️</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 12 }}>No Teams Registered Yet</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                  Team rosters will appear here once officially enrolled by tournament administrators.
                </p>
              </div>
            ) : (() => {
              const q = teamSearch.toLowerCase().trim();
              const filteredTeams = tournamentTeams.filter(team => {
                if (!q) return true;
                if (team.name.toLowerCase().includes(q)) return true;
                const pids = team.players || [];
                const matchedPlayer = pids.some(pid => {
                  const plyr = allPlayers.find(p => p.id === pid);
                  return plyr && plyr.name.toLowerCase().includes(q);
                });
                return matchedPlayer;
              });

              if (filteredTeams.length === 0) {
                return (
                  <div className="empty-state animate-slide-up" style={{ marginTop: 40 }}>
                    <div style={{ fontSize: 40 }}>🔍</div>
                    <p style={{ fontSize: 15, fontWeight: 600, marginTop: 8 }}>No teams or players found</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Try searching with a different team or player name.</p>
                  </div>
                );
              }

              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                  {filteredTeams.map(team => {
                    const uniquePlayerIds = [...new Set(team.players || [])];
                    const squadPlayers = uniquePlayerIds.map(pid => allPlayers.find(p => p.id === pid)).filter(Boolean);
                    const captain = allPlayers.find(p => p.id === team.captain_id);
                    const logoSrc = team.logo_url || getTeamLogo(team.name);

                    return (
                      <div key={team.id} className="glass-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)' }}>
                        {/* Team Card Banner */}
                        <div style={{
                          padding: '16px 20px',
                          background: `${team.logo_color || '#2563eb'}18`,
                          borderBottom: `2px solid ${team.logo_color || '#2563eb'}`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 14
                        }}>
                          {logoSrc ? (
                            <img
                              src={logoSrc}
                              alt={team.name}
                              style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.2)' }}
                            />
                          ) : (
                            <div style={{
                              width: 44,
                              height: 44,
                              borderRadius: 'var(--radius-md)',
                              background: team.logo_color || '#2563eb',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 18,
                              fontWeight: 700,
                              color: '#fff'
                            }}>
                              {team.name.charAt(0)}
                            </div>
                          )}
                          <div style={{ flex: 1, overflow: 'hidden' }}>
                            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              {team.name}
                            </h4>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                              {squadPlayers.length} Member{squadPlayers.length !== 1 ? 's' : ''}
                              {captain && <span> · Captain: <strong style={{ color: 'var(--text-primary)' }}>{captain.name}</strong></span>}
                            </div>
                          </div>
                        </div>

                        {/* Players Roster List */}
                        <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                            Active Roster
                          </div>
                          {squadPlayers.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '6px 0' }}>No players assigned yet.</p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {squadPlayers.map(player => {
                                if (!player) return null;
                                const isCaptain = team.captain_id === player.id;
                                return (
                                  <div
                                    key={player.id}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      padding: '8px 10px',
                                      borderRadius: 'var(--radius-sm)',
                                      background: isCaptain ? 'var(--accent-subtle)' : 'var(--bg-secondary)',
                                      border: '1px solid var(--border)'
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                      <div style={{
                                        width: 26,
                                        height: 26,
                                        borderRadius: '50%',
                                        background: isCaptain ? 'var(--accent)' : 'linear-gradient(135deg, var(--accent), #3b82f6)',
                                        color: '#fff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 11,
                                        fontWeight: 700,
                                        flexShrink: 0
                                      }}>
                                        {player.name.charAt(0)}
                                      </div>
                                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                                        {player.name}
                                      </span>
                                    </div>
                                    {isCaptain && (
                                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--score-point)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                        👑 Captain
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Media Gallery Tab */}
      {activeTab === 'gallery' && (
        <div className="container-app" style={{ padding: '0 24px 60px' }}>
          <style>{`
            .gallery-grid {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
              grid-gap: 20px;
              grid-auto-flow: dense;
            }
            .gallery-item {
              position: relative;
              overflow: hidden;
              border-radius: var(--radius-md);
              cursor: pointer;
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              aspect-ratio: 4 / 3;
              background: rgba(255, 255, 255, 0.03);
            }
            .gallery-item img {
              width: 100%;
              height: 100%;
              object-fit: cover;
              transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            }
            .gallery-item:hover {
              transform: translateY(-6px);
              box-shadow: 0 12px 30px rgba(0,0,0,0.3);
              border-color: var(--accent);
            }
            .gallery-item:hover img {
              transform: scale(1.06);
            }
            .gallery-caption-overlay {
              position: absolute;
              bottom: 0;
              left: 0;
              right: 0;
              background: linear-gradient(to top, rgba(10,10,12,0.9) 0%, rgba(10,10,12,0.4) 60%, transparent 100%);
              padding: 16px;
              opacity: 0;
              transform: translateY(10px);
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            .gallery-item:hover .gallery-caption-overlay {
              opacity: 1;
              transform: translateY(0);
            }
            .lightbox-backdrop {
              animation: lb-fadeIn 0.25s ease-out forwards;
            }
            @keyframes lb-fadeIn {
              from { opacity: 0; backdrop-filter: blur(0px); }
              to { opacity: 1; backdrop-filter: blur(12px); }
            }
            .spinner {
              width: 28px;
              height: 28px;
              border: 2px solid rgba(255, 255, 255, 0.1);
              border-radius: 50%;
              border-top-color: var(--accent);
              animation: spin 0.8s linear infinite;
            }
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>

          {loadingMedia ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <div className="spinner" />
            </div>
          ) : media.length === 0 ? (
            <div className="empty-state" style={{ marginTop: 20 }}>
              <div style={{ fontSize: 48 }}>📸</div>
              <p style={{ fontSize: 16, fontWeight: 500, marginTop: 12 }}>No media uploaded yet</p>
              <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Follow this tournament to see photos and flyers when they are uploaded</p>
            </div>
          ) : (
            <div className="gallery-grid">
              {media.map((item, idx) => {
                const isVideo = item.media_type === 'video' || getYouTubeEmbedUrl(item.file_url);
                const thumbUrl = isVideo ? (getYouTubeThumbnail(item.file_url) || item.file_url) : item.file_url;
                const matchItem = item.match_id ? liveScores.find(m => m.id === item.match_id) : null;

                return (
                  <div
                    key={item.id}
                    className="glass-card gallery-item"
                    style={{
                      border: '1px solid var(--border)',
                      position: 'relative'
                    }}
                    onClick={() => openLightbox(idx)}
                  >
                    {matchItem && (
                      <span style={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        background: 'rgba(15,23,42,0.85)',
                        color: 'var(--accent)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 600,
                        zIndex: 2,
                        backdropFilter: 'blur(4px)'
                      }}>
                        🏸 Match: {matchItem.player1_name} vs {matchItem.player2_name}
                      </span>
                    )}
                    <img
                      src={thumbUrl}
                      alt={item.caption || 'Tournament Media'}
                      loading="lazy"
                    />
                    {isVideo && (
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0, 0, 0, 0.4)',
                        transition: 'background 0.2s',
                        zIndex: 1
                      }}>
                        <div style={{
                          width: 50,
                          height: 50,
                          borderRadius: '50%',
                          background: 'rgba(34, 197, 94, 0.95)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: 20,
                          paddingLeft: 4,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        }}>
                          ▶
                        </div>
                      </div>
                    )}
                  {item.caption && (
                    <div className="gallery-caption-overlay">
                      <p style={{
                        margin: 0,
                        color: '#fff',
                        fontSize: 13,
                        fontWeight: 500,
                        lineHeight: 1.4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {item.caption}
                      </p>
                    </div>
                  )}
                </div>
              ); })}
            </div>
          )}
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxIndex !== null && media[lightboxIndex] && (
        <div 
          className="lightbox-backdrop"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(10, 10, 12, 0.95)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button 
            onClick={closeLightbox}
            style={{
              position: 'absolute',
              top: 24,
              right: 24,
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '50%',
              width: 44,
              height: 44,
              color: '#fff',
              fontSize: 24,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
              zIndex: 10000,
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          >
            &times;
          </button>

          {/* Left Arrow */}
          {media.length > 1 && (
            <button 
              onClick={prevImage}
              style={{
                position: 'absolute',
                left: 24,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '50%',
                width: 48,
                height: 48,
                color: '#fff',
                fontSize: 24,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                zIndex: 10000,
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'var(--accent)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.transform = 'translateY(-50%)';
              }}
            >
              &#10094;
            </button>
          )}

          {/* Image Container */}
          <div 
            style={{
              maxWidth: '85vw',
              maxHeight: '75vh',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image
          >
            {getYouTubeEmbedUrl(media[lightboxIndex].file_url) ? (
              <iframe
                src={`${getYouTubeEmbedUrl(media[lightboxIndex].file_url)}?autoplay=1`}
                title={media[lightboxIndex].caption || 'Video Playback'}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{
                  width: '80vw',
                  height: '45vw',
                  maxWidth: '960px',
                  maxHeight: '540px',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              />
            ) : (
              <img 
                src={media[lightboxIndex].file_url}
                alt={media[lightboxIndex].caption || 'Lightbox View'}
                style={{
                  maxWidth: '100%',
                  maxHeight: '75vh',
                  objectFit: 'contain',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              />
            )}
          </div>

          {/* Caption & Counter */}
          <div 
            style={{
              marginTop: 20,
              textAlign: 'center',
              maxWidth: '600px',
              padding: '0 24px',
              color: '#fff',
              zIndex: 10000,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {media[lightboxIndex].caption && (
              <p style={{ fontSize: 16, margin: '0 0 8px 0', fontWeight: 500, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                {media[lightboxIndex].caption}
              </p>
            )}
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', background: 'rgba(0,0,0,0.4)', padding: '4px 12px', borderRadius: 'var(--radius-full)' }}>
              {lightboxIndex + 1} of {media.length}
            </span>
          </div>

          {/* Right Arrow */}
          {media.length > 1 && (
            <button 
              onClick={nextImage}
              style={{
                position: 'absolute',
                right: 24,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '50%',
                width: 48,
                height: 48,
                color: '#fff',
                fontSize: 24,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                zIndex: 10000,
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'var(--accent)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.transform = 'translateY(-50%)';
              }}
            >
              &#10095;
            </button>
          )}
        </div>
      )}

      {/* Footer */}
      <footer style={{
        padding: '24px 0',
        borderTop: '1px solid var(--border)',
      }}>
        <div className="container-app" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Powered by <Link href="/" style={{ color: 'var(--accent)', textDecoration: 'none' }}>MatchPoint</Link>
          </p>
        </div>
      </footer>
      {/* Floating Bug Report / Feedback Button */}
      <button
        onClick={() => setShowFeedbackModal(true)}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'linear-gradient(135deg, var(--accent), #3b82f6)',
          color: '#ffffff',
          border: 'none',
          borderRadius: '50px',
          padding: '12px 24px',
          fontSize: 13,
          fontWeight: 700,
          boxShadow: '0 8px 30px rgba(37, 99, 235, 0.4)',
          cursor: 'pointer',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
          e.currentTarget.style.boxShadow = '0 12px 35px rgba(37, 99, 235, 0.5)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = '0 8px 30px rgba(37, 99, 235, 0.4)';
        }}
      >
        🐞 Report Bug / Feedback
      </button>

      {/* Submit Bug / Feedback Modal */}
      {showFeedbackModal && (
        <div className="modal-overlay" onClick={() => setShowFeedbackModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>🐞 Report Bug or Submit Feedback</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowFeedbackModal(false)}><IconX size={18} /></button>
            </div>

            {feedbackSuccess ? (
              <div style={{
                textAlign: 'center',
                padding: '24px 0',
                color: 'var(--score-win)',
                fontSize: 16,
                fontWeight: 600,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12
              }}>
                <span style={{ fontSize: 48 }}>✅</span>
                <span>Thank you! Your feedback has been submitted.</span>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 400, marginTop: 4 }}>
                  Tournament managers and organizers have been notified.
                </p>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="input-group">
                  <label className="input-label" htmlFor="feed-type" style={{ fontSize: 13, fontWeight: 500 }}>Feedback / Issue Type</label>
                  <select
                    id="feed-type"
                    className="input"
                    value={feedbackType}
                    onChange={e => setFeedbackType(e.target.value)}
                  >
                    <option value="bug">🐞 Technical Bug Report</option>
                    <option value="dispute">⚖️ Match Score / Rule Dispute</option>
                    <option value="suggestion">💡 Feature Suggestion</option>
                    <option value="general">💬 General Feedback</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="feed-name" style={{ fontSize: 13, fontWeight: 500 }}>Your Name (Optional)</label>
                  <input
                    id="feed-name"
                    type="text"
                    className="input"
                    value={feedbackName}
                    onChange={e => setFeedbackName(e.target.value)}
                    placeholder="Anonymous"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="feed-msg" style={{ fontSize: 13, fontWeight: 500 }}>Message Details *</label>
                  <textarea
                    id="feed-msg"
                    className="input"
                    value={feedbackMessage}
                    onChange={e => setFeedbackMessage(e.target.value)}
                    placeholder="Explain the issue or feedback here..."
                    style={{ minHeight: 100 }}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmittingFeedback}
                  style={{ width: '100%', marginTop: 8 }}
                >
                  {isSubmittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
      {selectedMediaMatch && (
        <MatchMediaModal 
          match={selectedMediaMatch} 
          onClose={() => setSelectedMediaMatch(null)} 
        />
      )}
    </div>
  );
}
