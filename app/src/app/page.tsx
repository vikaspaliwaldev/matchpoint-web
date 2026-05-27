'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Tournament, TournamentEvent, Match, User } from '@/types';
import * as dbService from '@/lib/supabase-service';
import { getLiveMatches } from '@/lib/mock-data';
import {
  IconTrophy,
  IconZap,
  IconTarget,
  IconGlobe,
  IconUsers,
  IconActivity,
  IconCalendar,
  IconMapPin,
  IconShuttlecock,
  IconClock,
} from '@/components/icons';

export default function LandingPage() {
  const { user } = useAuth();
  const [liveMatches, setLiveMatches] = useState(getLiveMatches());
  const [animatedStats, setAnimatedStats] = useState({ tournaments: 0, players: 0, matches: 0 });
  const [dbTournaments, setDbTournaments] = useState<Tournament[]>([]);
  const [dbEvents, setDbEvents] = useState<TournamentEvent[]>([]);
  const [dbMatches, setDbMatches] = useState<Match[]>([]);
  const [dbPlayers, setDbPlayers] = useState<User[]>([]);
  const [explorerTab, setExplorerTab] = useState<'tournament' | 'player'>('tournament');
  const [selectedTourId, setSelectedTourId] = useState<string>('');
  const [playerSearch, setPlayerSearch] = useState<string>('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');

  useEffect(() => {
    async function loadExplorerData() {
      try {
        const [tours, evs, mats, play] = await Promise.all([
          dbService.getTournaments(),
          dbService.getEvents(),
          dbService.getMatches(),
          dbService.getPlayers(),
        ]);
        setDbTournaments(tours);
        setDbEvents(evs);
        setDbMatches(mats);
        setDbPlayers(play);
        if (tours.length > 0) {
          setSelectedTourId(tours[0].id);
        }
        if (play.length > 0) {
          setSelectedPlayerId(play[0].id);
        }
      } catch (err) {
        console.error('Failed to load explorer data:', err);
      }
    }
    loadExplorerData();
  }, []);

  useEffect(() => {
    // Animate stat counters
    const targets = { tournaments: 150, players: 5200, matches: 12400 };
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = Math.min(step / steps, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedStats({
        tournaments: Math.floor(targets.tournaments * eased),
        players: Math.floor(targets.players * eased),
        matches: Math.floor(targets.matches * eased),
      });
      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, []);

  // Simulate live score changes
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveMatches(prev =>
        prev.map(m => {
          if (m.sets.length > 0 && m.status === 'running') {
            const newSets = m.sets.map((s, i) => {
              if (i === m.sets.length - 1 && !s.is_complete) {
                const addToP1 = Math.random() > 0.5;
                return {
                  ...s,
                  player1_score: addToP1 ? Math.min(s.player1_score + 1, 21) : s.player1_score,
                  player2_score: !addToP1 ? Math.min(s.player2_score + 1, 21) : s.player2_score,
                };
              }
              return s;
            });
            return { ...m, sets: newSets };
          }
          return m;
        })
      );
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const features = [
    {
      icon: <IconTrophy size={28} />,
      title: 'Tournament Management',
      description: 'Create and manage tournaments with multiple events, formats, and categories.',
    },
    {
      icon: <IconZap size={28} />,
      title: 'Live Scoring',
      description: 'Real-time score updates with sub-second latency. Umpire-friendly touch interface.',
    },
    {
      icon: <IconTarget size={28} />,
      title: 'Auto Fixtures',
      description: 'Generate knockout brackets, seeded draws, and round-robin schedules automatically.',
    },
    {
      icon: <IconGlobe size={28} />,
      title: 'Public Pages',
      description: 'Share tournament schedules, live scores, and results — no login required.',
    },
    {
      icon: <IconUsers size={28} />,
      title: 'Player Registration',
      description: 'Self-service registration with approval workflows and seed management.',
    },
    {
      icon: <IconActivity size={28} />,
      title: 'Role-Based Dashboards',
      description: 'Dedicated dashboards for admins, players, and umpires with relevant widgets.',
    },
  ];

  const upcomingTournaments = dbTournaments.filter(t => t.status === 'open' || t.status === 'live');

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      {/* Navigation */}
      <nav className="nav">
        <div className="container-app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{
              width: 36, height: 36,
              background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
              borderRadius: 'var(--radius-md)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <IconShuttlecock size={20} className="" />
            </div>
            <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>MatchPoint</span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {user ? (
              <Link href="/dashboard" className="btn btn-primary">Dashboard</Link>
            ) : (
              <>
                <Link href="/login" className="btn btn-ghost">Log In</Link>
                <Link href="/register" className="btn btn-primary">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-gradient" style={{ position: 'relative', overflow: 'hidden', padding: '100px 0 80px' }}>
        <div className="hero-glow" style={{ top: -200, left: '50%', transform: 'translateX(-50%)' }} />
        <div className="container-app" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div className="badge badge-accent" style={{ marginBottom: 20, fontSize: 12 }}>
            <span className="live-dot" style={{ width: 6, height: 6 }} />
            Live Scoring Available
          </div>
          <h1 style={{
            fontSize: 'clamp(36px, 6vw, 72px)',
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: 20,
            background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--accent-hover) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            The Ultimate Badminton<br />Tournament Platform
          </h1>
          <p style={{
            fontSize: 18,
            color: 'var(--text-secondary)',
            maxWidth: 600,
            margin: '0 auto 40px',
            lineHeight: 1.7,
          }}>
            Create tournaments, generate fixtures, score matches in real-time, and share results — all from one powerful platform.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" className="btn btn-primary btn-lg">
              Start Your Tournament
              <IconChevronRight size={18} />
            </Link>
            <Link href="/tournament/mumbai-open-2025" className="btn btn-secondary btn-lg">
              View Live Demo
            </Link>
          </div>

          {/* Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 24,
            maxWidth: 600,
            margin: '60px auto 0',
          }}>
            {[
              { label: 'Tournaments', value: animatedStats.tournaments, suffix: '+' },
              { label: 'Players', value: animatedStats.players.toLocaleString(), suffix: '+' },
              { label: 'Matches Scored', value: animatedStats.matches.toLocaleString(), suffix: '+' },
            ].map((stat, i) => (
              <div key={i} className="animate-slide-up stagger-item">
                <div style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                  {stat.value}{stat.suffix}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Matches Ticker */}
      {liveMatches.length > 0 && (
        <section style={{
          background: 'var(--bg-secondary)',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
          padding: '16px 0',
        }}>
          <div className="container-app" style={{ display: 'flex', alignItems: 'center', gap: 20, overflowX: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <span className="live-dot" />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--score-live)' }}>LIVE</span>
            </div>
            {liveMatches.map(match => {
              const currentSet = match.sets[match.sets.length - 1];
              return (
                <Link
                  key={match.id}
                  href={`/tournament/mumbai-open-2025`}
                  className="glass-card"
                  style={{
                    padding: '10px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    textDecoration: 'none',
                    flexShrink: 0,
                    minWidth: 280,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{match.player1_name}</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>{match.player2_name}</div>
                  </div>
                  <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{currentSet?.player1_score ?? 0}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-secondary)' }}>{currentSet?.player2_score ?? 0}</div>
                  </div>
                  {match.sets.length > 1 && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      Set {match.sets.length}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Public Explorer Hub */}
      <section style={{ padding: '60px 0', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
        <div className="container-app">
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <span className="badge badge-accent" style={{ marginBottom: 12 }}>Explorer Hub</span>
            <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>
              Public Results & Timelines
            </h2>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto' }}>
              Search tournament draws or look up individual player timelines. Open to the public.
            </p>
          </div>

          {/* Explorer Container */}
          <div className="glass-card animate-slide-up" style={{ maxWidth: 840, margin: '0 auto', padding: 28 }}>
            {/* Tabs */}
            <div className="tab-group" style={{ display: 'inline-flex', width: '100%', marginBottom: 24 }}>
              <button
                className={`tab ${explorerTab === 'tournament' ? 'active' : ''}`}
                onClick={() => setExplorerTab('tournament')}
                style={{ flex: 1, textAlign: 'center' }}
              >
                Tournaments History
              </button>
              <button
                className={`tab ${explorerTab === 'player' ? 'active' : ''}`}
                onClick={() => setExplorerTab('player')}
                style={{ flex: 1, textAlign: 'center' }}
              >
                Player History Explorer
              </button>
            </div>

            {/* Content: Tournament Selector */}
            {explorerTab === 'tournament' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="input-group">
                  <label className="input-label" htmlFor="explore-tours">Select Tournament</label>
                  <select
                    id="explore-tours"
                    className="input"
                    value={selectedTourId}
                    onChange={e => setSelectedTourId(e.target.value)}
                  >
                    {dbTournaments.length === 0 && <option value="">No tournaments active</option>}
                    {dbTournaments.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                {/* Selected Tournament Matches Timeline (Recent First / Descending) */}
                {selectedTourId && (() => {
                  const tour = dbTournaments.find(t => t.id === selectedTourId);
                  const tourMatches = dbMatches.filter(m => m.tournament_id === selectedTourId);
                  
                  // Sort descending: recent first
                  const sortedTourMatches = [...tourMatches].sort((a, b) => {
                    const timeA = a.scheduled_time ? new Date(a.scheduled_time).getTime() : 0;
                    const timeB = b.scheduled_time ? new Date(b.scheduled_time).getTime() : 0;
                    return timeB - timeA;
                  });

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {tour && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 13, color: 'var(--text-muted)', background: 'var(--bg-primary)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            📍 {tour.location}
                          </span>
                          <span>·</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            📅 {new Date(tour.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                          <span>·</span>
                          <span className={`badge badge-${tour.status}`}>{tour.status}</span>
                        </div>
                      )}

                      <h4 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Matches Timeline (Descending)</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {sortedTourMatches.map(match => {
                          const eventObj = dbEvents.find(e => e.id === match.event_id);
                          return (
                            <div key={match.id} style={{
                              padding: 14,
                              borderRadius: 'var(--radius-md)',
                              background: 'var(--bg-primary)',
                              border: '1px solid var(--border)',
                              display: 'flex',
                              flexWrap: 'wrap',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 16
                            }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                  <span style={{ fontWeight: 600, fontSize: 14 }}>
                                    {match.player1_name} vs {match.player2_name}
                                  </span>
                                  <span className={`badge badge-${match.status === 'running' ? 'live' : match.status}`}>{match.status}</span>
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                                  {eventObj?.event_name} · {match.court}
                                </div>
                              </div>

                              {/* Scores */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                {match.sets.length > 0 ? (
                                  <div style={{ display: 'flex', gap: 4 }}>
                                    {match.sets.map((s, idx) => (
                                      <div key={idx} style={{
                                        padding: '2px 6px',
                                        background: 'var(--bg-elevated)',
                                        borderRadius: 'var(--radius-sm)',
                                        fontSize: 11,
                                        fontFamily: 'var(--font-mono)',
                                        fontWeight: s.is_complete ? 600 : 400
                                      }}>
                                        {s.player1_score}-{s.player2_score}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>TBD</span>
                                )}

                                <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <IconClock size={12} />
                                  {match.scheduled_time ? new Date(match.scheduled_time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {sortedTourMatches.length === 0 && (
                          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', padding: 12 }}>
                            No matches played in this tournament yet.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Content: Player History */}
            {explorerTab === 'player' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="input-group">
                    <label className="input-label" htmlFor="explore-player-search">Search Player Name</label>
                    <input
                      id="explore-player-search"
                      className="input"
                      placeholder="e.g. Priya Sharma..."
                      value={playerSearch}
                      onChange={e => setPlayerSearch(e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label" htmlFor="explore-players">Select Player Profile</label>
                    <select
                      id="explore-players"
                      className="input"
                      value={selectedPlayerId}
                      onChange={e => setSelectedPlayerId(e.target.value)}
                    >
                      {dbPlayers
                        .filter(p => p.name.toLowerCase().includes(playerSearch.toLowerCase()))
                        .map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))
                      }
                      {dbPlayers.filter(p => p.name.toLowerCase().includes(playerSearch.toLowerCase())).length === 0 && (
                        <option value="">No profiles found</option>
                      )}
                    </select>
                  </div>
                </div>

                {/* Player Matches & Stats History (Descending Timeline) */}
                {selectedPlayerId && (() => {
                  const player = dbPlayers.find(p => p.id === selectedPlayerId);
                  const playerMatches = dbMatches.filter(m => m.player1_id === selectedPlayerId || m.player2_id === selectedPlayerId);
                  
                  const sortedPlayerMatches = [...playerMatches].sort((a, b) => {
                    const timeA = a.scheduled_time ? new Date(a.scheduled_time).getTime() : 0;
                    const timeB = b.scheduled_time ? new Date(b.scheduled_time).getTime() : 0;
                    return timeB - timeA;
                  });

                  const completed = playerMatches.filter(m => m.status === 'completed');
                  const wins = completed.filter(m => m.winner_id === selectedPlayerId).length;
                  const losses = completed.length - wins;
                  const winRate = completed.length > 0 ? Math.round((wins / completed.length) * 100) : 0;

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                      {player && (
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '16px 20px',
                          background: 'var(--bg-primary)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border)',
                          gap: 16
                        }}>
                          <div>
                            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{player.name}</span>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{player.email}</div>
                          </div>
                          
                          <div style={{ display: 'flex', gap: 12 }}>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{playerMatches.length}</div>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Played</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--score-win)' }}>{wins}</div>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Wins</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--score-loss)' }}>{losses}</div>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Losses</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>{winRate}%</div>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Win Ratio</div>
                            </div>
                          </div>
                        </div>
                      )}

                      <h4 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Match Timeline (Descending)</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {sortedPlayerMatches.map(match => {
                          const opponent = match.player1_id === selectedPlayerId ? match.player2_name : match.player1_name;
                          const eventObj = dbEvents.find(e => e.id === match.event_id);
                          const isWin = match.status === 'completed' && match.winner_id === selectedPlayerId;
                          
                          return (
                            <div key={match.id} style={{
                              padding: 14,
                              borderRadius: 'var(--radius-md)',
                              background: 'var(--bg-primary)',
                              border: '1px solid var(--border)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 16
                            }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                  <span style={{ fontWeight: 600, fontSize: 14 }}>
                                    vs {opponent}
                                  </span>
                                  <span className={`badge badge-${match.status === 'completed' ? (isWin ? 'approved' : 'rejected') : 'open'}`}>
                                    {match.status === 'completed' ? (isWin ? 'WIN' : 'LOSS') : match.status}
                                  </span>
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                                  {eventObj?.event_name}
                                </div>
                              </div>

                              {/* Score */}
                              <div style={{ display: 'flex', gap: 4 }}>
                                {match.sets.map((s, idx) => (
                                  <div key={idx} style={{
                                    padding: '2px 6px',
                                    background: 'var(--bg-elevated)',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: 11,
                                    fontFamily: 'var(--font-mono)',
                                    fontWeight: s.is_complete ? 600 : 400
                                  }}>
                                    {match.player1_id === selectedPlayerId ? `${s.player1_score}-${s.player2_score}` : `${s.player2_score}-${s.player1_score}`}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}

                        {sortedPlayerMatches.length === 0 && (
                          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', padding: 12 }}>
                            No matches found for this player.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ padding: '80px 0' }}>
        <div className="container-app">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 12 }}>Everything You Need</h2>
            <p style={{ fontSize: 16, color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto' }}>
              From tournament creation to final results — a complete platform for badminton organizers and players.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 20,
          }}>
            {features.map((feature, i) => (
              <div key={i} className="glass-card animate-slide-up stagger-item" style={{ padding: 28 }}>
                <div style={{
                  width: 52, height: 52,
                  background: 'var(--accent-subtle)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--accent-hover)',
                  marginBottom: 16,
                }}>
                  {feature.icon}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{feature.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Tournaments */}
      <section style={{ padding: '0 0 80px' }}>
        <div className="container-app">
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 12 }}>Upcoming Tournaments</h2>
            <p style={{ fontSize: 16, color: 'var(--text-secondary)' }}>
              Browse and register for upcoming badminton tournaments
            </p>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: 20,
          }}>
            {upcomingTournaments.map((t, i) => (
              <Link
                key={t.id}
                href={`/tournament/${t.slug}`}
                className="glass-card animate-slide-up stagger-item"
                style={{ textDecoration: 'none', overflow: 'hidden' }}
              >
                {/* Banner gradient */}
                <div style={{
                  height: 120,
                  background: i === 0
                    ? 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)'
                    : 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}>
                  <IconTrophy size={48} className="" />
                  {t.status === 'live' && (
                    <div className="badge badge-live" style={{ position: 'absolute', top: 12, right: 12 }}>
                      <span className="live-dot" style={{ width: 6, height: 6 }} /> Live
                    </div>
                  )}
                  {t.status === 'open' && (
                    <div className="badge badge-open" style={{ position: 'absolute', top: 12, right: 12 }}>
                      Open
                    </div>
                  )}
                </div>
                <div style={{ padding: '20px 24px' }}>
                  <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>{t.name}</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
                    {t.description}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                      <IconCalendar size={14} />
                      {new Date(t.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} — {new Date(t.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                      <IconMapPin size={14} />
                      {t.location}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '60px 0',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border)',
      }}>
        <div className="container-app" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Ready to Organize Your Tournament?</h2>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 28, maxWidth: 500, margin: '0 auto 28px' }}>
            Get started for free. Create your first tournament in under 10 minutes.
          </p>
          <Link href="/register" className="btn btn-primary btn-lg">
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '40px 0',
        borderTop: '1px solid var(--border)',
      }}>
        <div className="container-app" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 28, height: 28,
              background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <IconShuttlecock size={14} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 600 }}>MatchPoint</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            © 2025 MatchPoint. Built for badminton lovers.
          </p>
        </div>
      </footer>
    </div>
  );
}

function IconChevronRight({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
