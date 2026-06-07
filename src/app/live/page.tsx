'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Match, Tournament, TournamentEvent } from '@/types';
import { getMatches, getTournaments, getEvents } from '@/lib/supabase-service';
import { IconShuttlecock, IconMapPin, IconCalendar, IconClock, IconActivity } from '@/components/icons';
import WinPredictorGauge from '@/components/WinPredictorGauge';
import MatchCommentsSidebar from '@/components/MatchCommentsSidebar';
import { getMatchNumber } from '@/lib/match-numbering';
import ShuttlecockLoader from '@/components/ShuttlecockLoader';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export default function PublicLiveScoreboardPage() {
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [activeChatMatchId, setActiveChatMatchId] = useState<string | null>(null);
  const [events, setEvents] = useState<TournamentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [allMatches, setAllMatches] = useState<Match[]>([]);

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


  useEffect(() => {
    // Initial fetch of data
    loadLiveData();

    if (isSupabaseConfigured) {
      // Subscribe to real-time matches table updates
      console.log('🔌 Connecting to Supabase Realtime for matches updates...');
      const channel = supabase
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
              is_adhoc: payload.new.is_adhoc !== undefined ? payload.new.is_adhoc : payload.new.isAdhoc,
              adhoc_type: payload.new.adhoc_type || payload.new.adhocType,
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

      return () => {
        console.log('🔌 Disconnecting live matches realtime channel');
        supabase.removeChannel(channel);
      };
    } else {
      // Fall back to polling for local mock data mode
      console.log('🔄 Supabase not configured. Running live scoreboard in polling mock mode...');
      const timer = setInterval(() => {
        loadLiveData();
      }, 4000);
      return () => clearInterval(timer);
    }
  }, []);

  if (loading && liveMatches.length === 0) {
    return (
      <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ShuttlecockLoader message="Connecting to court scoreboard..." />
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      {/* Top Header Navigation */}
      <nav className="nav">
        <div className="container-app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{
              width: 36, height: 36,
              background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
              borderRadius: 'var(--radius-md)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <IconShuttlecock size={20} />
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 36, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="badge badge-live" style={{ marginBottom: 8 }}>
              <span className="live-dot" /> LIVE SCOREBOARD
            </div>
            <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, color: 'var(--text-primary)' }}>Match Arena</h1>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginTop: 4 }}>
              Real-time court scores, game durations, and points progression for live badminton matches.
            </p>
            {lastSynced && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 12, color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.02)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginTop: 12, fontFamily: 'var(--font-mono)', width: 'fit-content', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                  Last Synced: {lastSynced.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            )}
          </div>
          <button className="btn btn-secondary" onClick={loadLiveData} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🔄</span> Refresh Scores
          </button>
        </div>

        {/* Live Grid & Commentary Sidebar Wrapper */}
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{
            flex: '1 1 500px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: 24
          }}>
            {liveMatches.map(match => {
              const tournament = tournaments.find(t => t.id === match.tournament_id);
              const eventObj = events.find(e => e.id === match.event_id);
              const activeSet = match.sets[match.sets.length - 1];
              
              const p1SetsWon = match.sets.filter(s => s.is_complete && s.winner_id === match.player1_id).length;
              const p2SetsWon = match.sets.filter(s => s.is_complete && s.winner_id === match.player2_id).length;
              const matchNumber = getMatchNumber(match.id, match.event_id, allMatches);

              return (
                <div
                  key={match.id}
                  className="glass-card animate-slide-up"
                  style={{
                    padding: 0,
                    overflow: 'hidden',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* Card Header */}
                  <div style={{
                    padding: '16px 20px',
                    background: 'rgba(99, 102, 241, 0.08)',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>
                        {tournament?.name || 'Tournament'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        {eventObj?.event_name || 'Event Category'} · Match {matchNumber}
                      </div>
                    </div>
                    {match.status === 'paused' ? (
                      <span className="badge badge-paused" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--score-point)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                        ⏸ PAUSED · {match.court || 'Court 1'}
                      </span>
                    ) : (
                      <span className="badge badge-live">
                        <span className="live-dot" /> {match.court || 'Court 1'}
                      </span>
                    )}
                  </div>

                  {/* Card Body: Player names and scores */}
                  <div style={{ padding: '24px 20px 16px 20px', display: 'flex', flexDirection: 'column', gap: 16, flex: 1, justifyContent: 'center' }}>
                    {/* Player 1 Row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 700, color: '#fff'
                        }}>
                          {match.player1_name.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
                          {match.player1_name}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {/* Set Snapshot score history */}
                        {match.sets.slice(0, -1).map((s, idx) => (
                          <span key={idx} style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', padding: '2px 4px' }}>
                            {s.player1_score}
                          </span>
                        ))}
                        {/* Current Set Score */}
                        <span style={{
                          fontSize: 28,
                          fontWeight: 800,
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--text-primary)',
                          background: 'var(--bg-elevated)',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-sm)',
                          minWidth: 44,
                          textAlign: 'center',
                          border: '1px solid var(--border)'
                        }}>
                          {activeSet?.player1_score ?? 0}
                        </span>
                      </div>
                    </div>

                    {/* Player 2 Row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 700, color: '#fff'
                        }}>
                          {match.player2_name.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
                          {match.player2_name}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {/* Set Snapshot score history */}
                        {match.sets.slice(0, -1).map((s, idx) => (
                          <span key={idx} style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', padding: '2px 4px' }}>
                            {s.player2_score}
                          </span>
                        ))}
                        {/* Current Set Score */}
                        <span style={{
                          fontSize: 28,
                          fontWeight: 800,
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--text-secondary)',
                          background: 'var(--bg-elevated)',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-sm)',
                          minWidth: 44,
                          textAlign: 'center',
                          border: '1px solid var(--border)'
                        }}>
                          {activeSet?.player2_score ?? 0}
                        </span>
                      </div>
                    </div>

                    {/* Live momentum win predictor */}
                    <WinPredictorGauge 
                      player1Name={match.player1_name}
                      player2Name={match.player2_name}
                      player1Score={activeSet?.player1_score ?? 0}
                      player2Score={activeSet?.player2_score ?? 0}
                      player1Sets={p1SetsWon}
                      player2Sets={p2SetsWon}
                      servingTeam={(match as any).serving_team || (match as any).servingTeam || null}
                    />
                  </div>

                  {/* Card Footer: Status details */}
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
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setActiveChatMatchId(activeChatMatchId === match.id ? null : match.id)}
                      style={{ 
                        fontSize: 11, 
                        padding: '4px 8px', 
                        color: activeChatMatchId === match.id ? 'var(--accent)' : 'var(--text-secondary)',
                        background: activeChatMatchId === match.id ? 'var(--accent-subtle)' : 'transparent',
                        borderRadius: 'var(--radius-sm)'
                      }}
                    >
                      💬 Spectator Chat
                    </button>
                  </div>
                </div>
              );
            })}

            {liveMatches.length === 0 && (
              <div className="glass-card animate-slide-up" style={{ padding: 64, gridColumn: '1 / -1', textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🏸</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Arena Quiet</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 440, margin: '0 auto 24px' }}>
                  There are no matches currently in progress. Live scores will display automatically once the umpire starts scoring games.
                </p>
                <Link href="/" className="btn btn-primary">Return to Home</Link>
              </div>
            )}
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
      </main>
    </div>
  );
}
