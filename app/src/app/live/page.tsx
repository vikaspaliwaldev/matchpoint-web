'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Match, Tournament, TournamentEvent } from '@/types';
import { getMatches, getTournaments, getEvents, updateLiveViewers } from '@/lib/supabase-service';
import { IconShuttlecock, IconMapPin, IconCalendar, IconClock, IconActivity } from '@/components/icons';
import WinPredictorGauge from '@/components/WinPredictorGauge';
import MatchCommentsSidebar from '@/components/MatchCommentsSidebar';
import MatchMediaModal from '@/components/MatchMediaModal';
import { getMatchNumber } from '@/lib/match-numbering';
import ShuttlecockLoader from '@/components/ShuttlecockLoader';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useSport } from '@/lib/sport-context';
import SportSelector from '@/components/SportSelector';
import { formatTennisGameScore, getTableTennisServer } from '@/lib/sports-rules';
import { LiquidGlassCard } from '@/components/kokonutui/liquid-glass-card';
import { getTeamLogo } from '@/lib/team-logos';

interface SearchableTournamentSelectProps {
  selectedId: string;
  onSelect: (id: string) => void;
  tournaments: Tournament[];
  placeholder?: string;
}

function SearchableTournamentSelect({
  selectedId,
  onSelect,
  tournaments,
  placeholder = "Search tournaments..."
}: SearchableTournamentSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedTour = tournaments.find(t => t.id === selectedId);

  // Initialize query with selected tournament name if set
  useEffect(() => {
    if (selectedTour) {
      setQuery(selectedTour.name);
    } else if (selectedId === 'all') {
      setQuery('All Tournaments');
    } else {
      setQuery('');
    }
  }, [selectedId, selectedTour]);

  // Handle outside click closures
  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (selectedTour) {
          setQuery(selectedTour.name);
        } else if (selectedId === 'all') {
          setQuery('All Tournaments');
        } else {
          setQuery('');
        }
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [selectedTour, selectedId]);

  const filtered = React.useMemo(() => {
    const term = query.toLowerCase().trim();
    const matchesAll = "all tournaments".includes(term) || "all".includes(term);
    const basicList = tournaments.filter(t => {
      if (term === '' || (selectedTour && selectedTour.name === query) || (selectedId === 'all' && query === 'All Tournaments')) return true;
      return t.name.toLowerCase().includes(term) || (t.location && t.location.toLowerCase().includes(term));
    });
    
    if (term !== '' && matchesAll && selectedId !== 'all') {
      return [{ id: 'all', name: 'All Tournaments' } as any, ...basicList];
    }
    
    if (term === '' || query === 'All Tournaments') {
      return [{ id: 'all', name: 'All Tournaments' } as any, ...basicList];
    }
    return basicList;
  }, [tournaments, query, selectedTour, selectedId]);

  return (
    <div style={{ position: 'relative', minWidth: 200, zIndex: 100 }} ref={containerRef}>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            if (query === 'All Tournaments') setQuery('');
          }}
          placeholder={placeholder}
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 8,
            padding: '8px 36px 8px 16px',
            color: '#ffffff',
            fontSize: 13,
            fontWeight: 600,
            outline: 'none',
            width: '100%',
            cursor: 'text',
          }}
        />
        <button
          type="button"
          onClick={() => {
            if (isOpen) {
              setIsOpen(false);
              if (selectedTour) setQuery(selectedTour.name);
              else if (selectedId === 'all') setQuery('All Tournaments');
            } else {
              setIsOpen(true);
            }
          }}
          style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer',
            fontSize: 10, padding: 0
          }}
        >
          {isOpen ? '▲' : '▼'}
        </button>
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: '#1e293b',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 8,
          maxHeight: 200,
          overflowY: 'auto',
          zIndex: 9999,
          marginTop: 6,
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
        }}>
          {filtered.length > 0 ? (
            filtered.map(t => (
              <div
                key={t.id}
                onClick={() => {
                  onSelect(t.id);
                  setQuery(t.name);
                  setIsOpen(false);
                }}
                style={{
                  padding: '10px 14px',
                  cursor: 'pointer',
                  fontSize: 13,
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  background: selectedId === t.id ? 'rgba(37, 99, 235, 0.2)' : 'transparent',
                  color: '#ffffff',
                  transition: 'background 0.15s ease',
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                onMouseOut={e => e.currentTarget.style.background = selectedId === t.id ? 'rgba(37, 99, 235, 0.2)' : 'transparent'}
              >
                <div style={{ fontWeight: 600 }}>{t.name}</div>
                {t.location && (
                  <div style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.5)', marginTop: 2 }}>📍 {t.location}</div>
                )}
              </div>
            ))
          ) : (
            <div style={{ padding: '12px 14px', fontSize: 13, color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center' }}>
              No matching tournaments found
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PublicLiveScoreboardPage() {
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [liveViewerCount, setLiveViewerCount] = useState<number>(1);
  const [viewerId, setViewerId] = useState<string>('');
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [activeChatMatchId, setActiveChatMatchId] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<'chat' | 'poll'>('chat');
  const [selectedMediaMatch, setSelectedMediaMatch] = useState<Match | null>(null);
  const [events, setEvents] = useState<TournamentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('all');
  const { activeSport } = useSport();
  
  const filteredLiveMatches = liveMatches.filter(m => 
    (activeSport === 'all' || m.sport === activeSport) &&
    (selectedTournamentId === 'all' || m.tournament_id === selectedTournamentId)
  );

  // Load all matches, events, tournaments
  const loadLiveData = async () => {
    try {
      const [matchesData, toursData, evsData] = await Promise.all([
        getMatches(),
        getTournaments(),
        getEvents()
      ]);
      setTournaments(toursData);
      setEvents(evsData);
      setAllMatches(matchesData);
      // Filter for active running and paused matches
      const activeMatches = matchesData.filter(m => m.status === 'running' || m.status === 'paused');
      setLiveMatches(activeMatches);
      setLastSynced(new Date());
    } catch (err) {
      console.error('Failed to fetch live scoreboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Unique viewer ID generation/retrieval
  useEffect(() => {
    let vid = localStorage.getItem('viewer_id');
    if (!vid) {
      vid = 'viewer-' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('viewer_id', vid);
    }
    setViewerId(vid);
  }, []);

  // Subscribe to Supabase Presence to track live scoreboard viewers count
  useEffect(() => {
    if (!viewerId) return;

    if (isSupabaseConfigured) {
      console.log('🔌 Connecting to Supabase Presence for live page...');
      const presenceChannel = supabase.channel('live-presence-room');

      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel.presenceState();
          const uniqueUsers = Object.keys(state).length;
          setLiveViewerCount(Math.max(1, uniqueUsers));
        });

      presenceChannel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            id: viewerId,
            online_at: new Date().toISOString()
          });
        }
      });

      return () => {
        console.log('🔌 Disconnecting Supabase Presence for live page');
        supabase.removeChannel(presenceChannel);
      };
    } else {
      // Mock mode: simulate random spectators (5-15) and sync
      setLiveViewerCount(Math.floor(Math.random() * 11) + 5);
      const timer = setInterval(() => {
        setLiveViewerCount(prev => {
          const change = Math.floor(Math.random() * 3) - 1; // -1, 0, or +1
          const next = Math.max(1, prev + change);
          updateLiveViewers(next).catch(err => console.error(err));
          return next;
        });
      }, 8000);
      return () => clearInterval(timer);
    }
  }, [viewerId]);

  // Synchronize viewer count with database for active matches
  useEffect(() => {
    if (liveViewerCount > 0 && liveMatches.length > 0) {
      updateLiveViewers(liveViewerCount).catch(err => console.error(err));
    }
  }, [liveViewerCount, liveMatches.length]);


  useEffect(() => {
    // Initial fetch of data
    loadLiveData();

    // 1. Sync live matches state periodically (runs in both Supabase and Mock modes)
    const syncInterval = setInterval(async () => {
      try {
        const matchesData = await getMatches();
        setAllMatches(matchesData);
        // Filter for active running and paused matches
        const activeMatches = matchesData.filter(m => m.status === 'running' || m.status === 'paused');
        setLiveMatches(activeMatches);
        setLastSynced(new Date());
      } catch (err) {
        console.error('Failed to sync live matches:', err);
      }
    }, 5000);

    // 2. Real-time updates via Supabase if configured
    let channel: any = null;
    if (isSupabaseConfigured) {
      console.log('🔌 Connecting to Supabase Realtime for matches updates...');
      channel = supabase
        .channel('live-matches-channel')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'matches' },
          (payload: any) => {
            console.log('⚡ Received real-time match update:', payload.new);
            
            // Map keys dynamically since supabase might return camelCase or snake_case based on schema
            const updatedMatch = {
              id: payload.new.id,
              tournament_id: payload.new.tournament_id || payload.new.tournamentId,
              event_id: payload.new.event_id || payload.new.eventId,
              fixture_round: payload.new.fixture_round !== undefined ? payload.new.fixture_round : payload.new.fixtureRound,
              fixture_position: payload.new.fixture_position !== undefined ? payload.new.fixture_position : payload.new.fixturePosition,
              court: payload.new.court,
              player1_id: payload.new.player1_id || payload.new.player1Id,
              player1_name: payload.new.player1_name || payload.new.player1Name,
              player2_id: payload.new.player2_id || payload.new.player2Id,
              player2_name: payload.new.player2_name || payload.new.player2Name,
              umpire_id: payload.new.umpire_id || payload.new.umpireId,
              umpire_name: payload.new.umpire_name || payload.new.umpireName,
              scheduled_time: payload.new.scheduled_time || payload.new.scheduledTime,
              actual_start_time: payload.new.actual_start_time || payload.new.actualStartTime,
              actual_end_time: payload.new.actual_end_time || payload.new.actualEndTime,
              duration_seconds: payload.new.duration_seconds !== undefined ? payload.new.duration_seconds : payload.new.durationSeconds,
              status: payload.new.status,
              winner_id: payload.new.winner_id || payload.new.winnerId,
              sets: payload.new.sets || [],
              sub_matches: payload.new.sub_matches || payload.new.subMatches || [],
              round_name: payload.new.round_name || payload.new.roundName,
              is_adhoc: payload.new.is_adhoc !== undefined ? payload.new.is_adhoc : (payload.new.isAdhoc !== undefined ? payload.new.isAdhoc : payload.new.adhoc),
              adhoc_type: payload.new.adhoc_type || payload.new.adhocType || payload.new.adhoc_type,
              max_viewers: payload.new.max_viewers !== undefined ? payload.new.max_viewers : (payload.new.maxViewers !== undefined ? payload.new.maxViewers : 0),
              sport: payload.new.sport || 'badminton',
              sport_metadata: payload.new.sport_metadata || payload.new.sportMetadata || {},
            };

            setAllMatches(prev => {
              const idx = prev.findIndex(m => m.id === updatedMatch.id);
              let nextMatches = [...prev];
              if (idx !== -1) {
                nextMatches[idx] = updatedMatch as Match;
              } else {
                nextMatches.push(updatedMatch as Match);
              }
              
              // Filter active matches for scoreboard display
              const activeMatches = nextMatches.filter(m => m.status === 'running' || m.status === 'paused');
              setLiveMatches(activeMatches);
              return nextMatches;
            });
            setLastSynced(new Date());
          }
        )
        .subscribe();
    }

    return () => {
      clearInterval(syncInterval);
      if (channel) {
        console.log('🔌 Disconnecting live matches realtime channel');
        supabase.removeChannel(channel);
      }
    };
  }, []);

  if (loading && liveMatches.length === 0) {
    return (
      <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ShuttlecockLoader message="Connecting to court scoreboard..." />
      </div>
    );
  }

  // Dynamic helper for rendering elapsed match duration
  const getElapsedTime = (match: Match) => {
    if (match.status !== 'running' || !match.actual_start_time) return null;
    const startTime = new Date(match.actual_start_time).getTime();
    const now = new Date().getTime();
    const diffMs = now - startTime;
    const diffMins = Math.max(1, Math.floor(diffMs / 60000));
    return `${diffMins}'`;
  };

  // Helper for splitting and formatting player names (support for doubles + servers)
  const renderPlayerName = (name: string, isServing: boolean, sport?: string) => {
    const parts = name.split(/\s*[\/&+,]\s*/);
    const getServeIndicator = (sp: string | undefined) => {
      if (sp === 'volleyball') return '🏐';
      if (sp === 'tennis') return '🥎';
      if (sp === 'table_tennis') return '🏓';
      if (sp === 'squash') return '🎾';
      if (sp === 'badminton') return '🏸';
      return '♦';
    };
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
        {parts.map((part, idx) => {
          // Extract Seed e.g. "Name [1]"
          const seedMatch = part.match(/(.*?)(\s*\[.*?\])$/);
          const displayName = seedMatch ? seedMatch[1] : part;
          const seed = seedMatch ? seedMatch[2] : '';
          
          // Extract Region e.g. "Name (Region)"
          const regionMatch = displayName.match(/(.*?)(\s*\(.*?\))$/);
          const nameText = regionMatch ? regionMatch[1] : displayName;
          const region = regionMatch ? regionMatch[2] : '';

          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 4, minHeight: 20, width: '100%' }}>
              {idx === 0 && isServing ? (
                <span style={{ color: 'var(--accent)', fontWeight: 'bold', fontSize: 13, width: 16, flexShrink: 0, display: 'inline-flex', alignItems: 'center' }}>
                  {getServeIndicator(sport)}
                </span>
              ) : (
                <span style={{ width: 16, flexShrink: 0 }} />
              )}
              {getTeamLogo(nameText.trim()) && (
                <img
                  src={getTeamLogo(nameText.trim())!}
                  alt=""
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    objectFit: 'cover',
                    flexShrink: 0,
                    marginRight: 4,
                  }}
                />
              )}
              <span 
                style={{ 
                  fontWeight: 600, 
                  color: 'var(--text-primary)', 
                  fontSize: 14, 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  maxWidth: '100%'
                }}
                title={nameText.trim()}
              >
                {nameText.trim()}
              </span>
              {seed && (
                <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 12, flexShrink: 0 }}>
                  {seed.trim()}
                </span>
              )}
              {region && (
                <span style={{ color: 'var(--text-muted)', fontSize: 11, flexShrink: 0, whiteSpace: 'nowrap' }}>
                  {region.trim()}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ background: 'transparent', minHeight: '100vh' }}>
      <style dangerouslySetInnerHTML={{__html: `
        /* Live Grid responsive adjustments */
        .live-grid-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)) !important;
          gap: 24px;
          flex: 1 1 500px;
        }
        .live-match-card {
          display: flex;
          flex-direction: row;
          overflow: hidden;
          position: relative;
          width: 100%;
          height: 100%;
        }
        .live-card-sidebar {
          width: 32px;
          background: var(--accent);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          writing-mode: vertical-rl;
          transform: rotate(180deg);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 10px 0;
          border-right: 1px solid var(--border);
        }
        .live-card-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .live-sidebar-container {
          width: 100%;
          max-width: 380px;
          height: 520px;
          position: sticky;
          top: 96px;
          padding: 0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        @media (max-width: 600px) {
          .live-match-card {
            flex-direction: column;
          }
          .live-card-sidebar {
            width: 100%;
            height: 28px;
            writing-mode: horizontal-tb;
            transform: none;
            padding: 4px 10px;
            justify-content: center;
            letter-spacing: 0.05em;
            border-right: none;
            border-bottom: 1px solid var(--border);
          }
          .live-grid-container {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 768px) {
          .live-sidebar-container {
            max-width: 100% !important;
            position: static !important;
            height: 480px !important;
          }
        }
      `}} />
      {/* Top Header Navigation */}
      <nav className="nav">
        <div className="container-app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{
              width: 36, height: 36,
              background: 'linear-gradient(135deg, var(--accent), #3b82f6)',
              borderRadius: 'var(--radius-md)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {activeSport === 'badminton' && <span style={{ fontSize: 18 }}>🏸</span>}
              {activeSport === 'table_tennis' && <span style={{ fontSize: 18 }}>🏓</span>}
              {activeSport === 'squash' && <span style={{ fontSize: 18 }}>🎾</span>}
              {activeSport === 'tennis' && <span style={{ fontSize: 18 }}>🥎</span>}
              {activeSport === 'volleyball' && <span style={{ fontSize: 18 }}>🏐</span>}
              {activeSport === 'cricket' && <span style={{ fontSize: 18 }}>🏏</span>}
              {activeSport === 'basketball' && <span style={{ fontSize: 18 }}>🏀</span>}
              {activeSport === 'all' && <IconShuttlecock size={20} />}
            </div>
            <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>MatchPoint</span>
          </Link>
          <div style={{ display: 'flex', gap: 16 }}>
            <Link href="/" className="btn btn-ghost">Home</Link>
            <Link href="/players" className="btn btn-ghost">Leaderboard</Link>
          </div>
        </div>
      </nav>

      {/* Main Scoreboard Content */}
      <main className="container-app" style={{ padding: '40px 20px 80px 20px' }}>
        {/* Redesigned Dark Header Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #1e3a8a, #0f172a)',
          borderRadius: 12,
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 32,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: 0.5 }}>
              LIVE SCORES
            </h1>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#fca5a5',
              fontWeight: 700,
              fontSize: 11,
              padding: '3px 8px',
              borderRadius: 100,
            }}>
              <span className="live-dot" style={{ background: '#ef4444', width: 6, height: 6 }} />
              LIVE
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.7)', display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              {liveViewerCount} {liveViewerCount === 1 ? 'viewer' : 'viewers'} online
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <SearchableTournamentSelect
              selectedId={selectedTournamentId}
              onSelect={setSelectedTournamentId}
              tournaments={tournaments}
            />

            <SportSelector />

            <Link
              href="/scoreboard"
              target="_blank"
              style={{
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(30, 58, 138, 0.4))',
                border: '1px solid #38BDF8',
                color: '#38BDF8',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              📺 Stadium TV
            </Link>

            <button
              className="btn"
              onClick={loadLiveData}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600
              }}
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Live Grid & Commentary Sidebar Wrapper */}
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div className="live-grid-container">
            {filteredLiveMatches.map(match => {
              const tournament = tournaments.find(t => t.id === match.tournament_id);
              const eventObj = events.find(e => e.id === match.event_id);
              const matchNumber = getMatchNumber(match.id, match.event_id, allMatches);
              const elapsedTime = getElapsedTime(match);
              
              let servingTeam: 'player1' | 'player2' | null = null;
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
              const isP1Serving = servingTeam === 'player1';
              const isP2Serving = servingTeam === 'player2';

              const tennisMeta = match.sport_metadata;
              const p1GamePoints = tennisMeta?.player1_game_points ?? 0;
              const p2GamePoints = tennisMeta?.player2_game_points ?? 0;
              const gameInProgress = match.sport === 'tennis' && (p1GamePoints > 0 || p2GamePoints > 0);

              const tennisScores = (match.sport === 'tennis' && tennisMeta) ? formatTennisGameScore(
                p1GamePoints,
                p2GamePoints,
                !!tennisMeta.in_tiebreak
              ) : { p1: '0', p2: '0' };
              const tennisP1Points = tennisScores.p1;
              const tennisP2Points = tennisScores.p2;

              const maxSetsCount = Math.max(3, match.sets.length);
              const setsArray = Array.from({ length: maxSetsCount });

              return (
                <LiquidGlassCard
                  key={match.id}
                  glassSize="none"
                  className="h-full animate-slide-up transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_20px_50px_rgba(37,99,235,0.15)]"
                  contentClassName="live-match-card"
                  contentStyle={{ height: '100%' }}
                >
                  {/* Left Sidebar (Desktop) / Top Bar (Mobile) */}
                  <div className="live-card-sidebar">
                    {match.court || 'Court 1'}
                  </div>

                  {/* Main Card Content */}
                  <div className="live-card-main">
                    {/* Card Inner Header */}
                    <div style={{
                      padding: '16px 20px',
                      borderBottom: '1px solid var(--border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 8
                    }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#1e3a8a', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={tournament?.name}>
                          {tournament?.name || 'Tournament'}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {eventObj?.event_name || 'Event Category'} · Match {matchNumber}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        {match.max_viewers !== undefined && match.max_viewers > 0 && (
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                            👁️ {match.max_viewers}
                          </span>
                        )}
                        {elapsedTime && (
                          <span style={{
                            background: 'var(--accent)',
                            color: '#fff',
                            padding: '2px 8px',
                            borderRadius: 12,
                            fontSize: 10,
                            fontWeight: 700
                          }}>
                            {elapsedTime}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Body: Player names and score columns aligned */}
                    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1, minWidth: 0 }}>
                      
                      {/* Set Grid Headers: G1, G2, G3 */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingRight: 0 }}>
                        {setsArray.map((_, idx) => (
                          <span key={idx} style={{ width: 36, textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>
                            G{idx + 1}
                          </span>
                        ))}
                        {match.sport === 'tennis' && gameInProgress && (
                          <span style={{ width: 36, textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#eab308' }}>
                            PTS
                          </span>
                        )}
                      </div>

                      {/* Player 1 Row */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                        {renderPlayerName(match.player1_name, isP1Serving, match.sport)}
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                          {setsArray.map((_, idx) => {
                            const setObj = match.sets[idx];
                            const isCurrentSet = idx === match.sets.length - 1 && !setObj?.is_complete;
                            const score = setObj ? setObj.player1_score : ' ';
                            return (
                              <span
                                key={idx}
                                style={{
                                  width: 36,
                                  height: 36,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 800,
                                  fontSize: 15,
                                  fontFamily: 'var(--font-mono)',
                                  borderRadius: 8,
                                  background: isCurrentSet ? 'rgba(37, 99, 235, 0.08)' : 'var(--bg-elevated)',
                                  color: isCurrentSet ? 'var(--accent)' : 'var(--text-secondary)',
                                  border: isCurrentSet ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                                }}
                              >
                                {score}
                              </span>
                            );
                          })}
                          {match.sport === 'tennis' && gameInProgress && (
                            <span
                              style={{
                                width: 36,
                                height: 36,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 850,
                                fontSize: 13,
                                fontFamily: 'var(--font-mono)',
                                borderRadius: 8,
                                background: 'rgba(250, 204, 21, 0.15)',
                                color: '#eab308',
                                border: '1.5px solid rgba(234, 179, 8, 0.4)',
                              }}
                            >
                              {tennisP1Points}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Player 2 Row */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                        {renderPlayerName(match.player2_name, isP2Serving, match.sport)}
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                          {setsArray.map((_, idx) => {
                            const setObj = match.sets[idx];
                            const isCurrentSet = idx === match.sets.length - 1 && !setObj?.is_complete;
                            const score = setObj ? setObj.player2_score : ' ';
                            return (
                              <span
                                key={idx}
                                style={{
                                  width: 36,
                                  height: 36,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 800,
                                  fontSize: 15,
                                  fontFamily: 'var(--font-mono)',
                                  borderRadius: 8,
                                  background: isCurrentSet ? 'rgba(37, 99, 235, 0.08)' : 'var(--bg-elevated)',
                                  color: isCurrentSet ? 'var(--accent)' : 'var(--text-secondary)',
                                  border: isCurrentSet ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                                }}
                              >
                                {score}
                              </span>
                            );
                          })}
                          {match.sport === 'tennis' && gameInProgress && (
                            <span
                              style={{
                                width: 36,
                                height: 36,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 850,
                                fontSize: 13,
                                fontFamily: 'var(--font-mono)',
                                borderRadius: 8,
                                background: 'rgba(250, 204, 21, 0.15)',
                                color: '#eab308',
                                border: '1.5px solid rgba(234, 179, 8, 0.4)',
                              }}
                            >
                              {tennisP2Points}
                            </span>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* Card Actions Footer: watch, media, chat, poll separate buttons */}
                    <div style={{
                      padding: '12px 16px',
                      borderTop: '1px solid var(--border)',
                      background: 'rgba(0,0,0,0.02)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 8,
                      flexWrap: 'wrap'
                    }}>
                      <Link
                        href={`/watch?matchId=${match.id}`}
                        className="btn btn-ghost btn-sm"
                        style={{
                          flex: '1 1 auto',
                          fontSize: 12,
                          padding: '6px 10px',
                          color: 'var(--accent)',
                          background: 'var(--accent-subtle)',
                          borderRadius: 8,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 4,
                          textDecoration: 'none',
                          fontWeight: 600,
                        }}
                      >
                        📺 Watch
                      </Link>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setSelectedMediaMatch(match)}
                        style={{
                          flex: '1 1 auto',
                          fontSize: 12,
                          padding: '6px 10px',
                          color: 'var(--text-secondary)',
                          background: 'rgba(0,0,0,0.03)',
                          border: '1px solid var(--border)',
                          borderRadius: 8,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 4,
                          fontWeight: 600,
                        }}
                      >
                        🎥 Media
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          setSidebarTab('chat');
                          setActiveChatMatchId(activeChatMatchId === match.id && sidebarTab === 'chat' ? null : match.id);
                        }}
                        style={{
                          flex: '1 1 auto',
                          fontSize: 12,
                          padding: '6px 10px',
                          color: activeChatMatchId === match.id && sidebarTab === 'chat' ? 'var(--accent)' : 'var(--text-secondary)',
                          background: activeChatMatchId === match.id && sidebarTab === 'chat' ? 'var(--accent-subtle)' : 'rgba(0,0,0,0.03)',
                          border: activeChatMatchId === match.id && sidebarTab === 'chat' ? '1px solid var(--accent)' : '1px solid var(--border)',
                          borderRadius: 8,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 4,
                          fontWeight: 600,
                        }}
                      >
                        💬 Chat
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          setSidebarTab('poll');
                          setActiveChatMatchId(activeChatMatchId === match.id && sidebarTab === 'poll' ? null : match.id);
                        }}
                        style={{
                          flex: '1 1 auto',
                          fontSize: 12,
                          padding: '6px 10px',
                          color: activeChatMatchId === match.id && sidebarTab === 'poll' ? 'var(--accent)' : 'var(--text-secondary)',
                          background: activeChatMatchId === match.id && sidebarTab === 'poll' ? 'var(--accent-subtle)' : 'rgba(0,0,0,0.03)',
                          border: activeChatMatchId === match.id && sidebarTab === 'poll' ? '1px solid var(--accent)' : '1px solid var(--border)',
                          borderRadius: 8,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 4,
                          fontWeight: 600,
                        }}
                      >
                        📊 Poll
                      </button>
                    </div>
                  </div>
                </LiquidGlassCard>
              );
            })}

            {filteredLiveMatches.length === 0 && (
              <LiquidGlassCard className="animate-slide-up" glassSize="lg" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '64px 32px' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🏸</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Arena Quiet</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 440, margin: '0 auto 24px' }}>
                  There are no matches currently in progress for the selected sport. Live scores will display automatically once the umpire starts scoring games.
                </p>
                <Link href="/" className="btn btn-primary">Return to Home</Link>
              </LiquidGlassCard>
            )}
          </div>

          {/* Commentary Sidebar panel drawer */}
          {activeChatMatchId && (
            <LiquidGlassCard className="animate-slide-up live-sidebar-container" glassSize="none">
              <div style={{ position: 'absolute', right: 12, top: 12, zIndex: 10 }}>
                <button 
                  className="btn btn-ghost btn-sm"
                  onClick={() => setActiveChatMatchId(null)}
                  style={{ minWidth: 0, padding: '4px 8px', color: 'var(--text-muted)', fontSize: 11 }}
                >
                  ✕ Close
                </button>
              </div>
              <MatchCommentsSidebar matchId={activeChatMatchId} defaultTab={sidebarTab} />
            </LiquidGlassCard>
          )}
        </div>
      </main>

      {selectedMediaMatch && (
        <MatchMediaModal 
          match={selectedMediaMatch} 
          onClose={() => setSelectedMediaMatch(null)} 
        />
      )}
    </div>
  );
}
