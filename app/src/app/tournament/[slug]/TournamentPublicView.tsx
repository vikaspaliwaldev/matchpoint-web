'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  getTournamentBySlug,
  getEventsByTournament,
  getMatchesByTournament,
} from '@/lib/mock-data';
import {
  IconCalendar,
  IconMapPin,
  IconTrophy,
  IconShuttlecock,
  IconArrowLeft,
  IconActivity,
  IconUsers,
} from '@/components/icons';
import { Match } from '@/types';

export default function TournamentPublicView({ slug }: { slug: string }) {
  const tournament = getTournamentBySlug(slug);
  const [activeTab, setActiveTab] = useState<'live' | 'schedule' | 'results'>('live');
  const [liveScores, setLiveScores] = useState<Match[]>([]);

  useEffect(() => {
    if (!tournament) return;
    const allMatches = getMatchesByTournament(tournament.id);
    setLiveScores(allMatches);
  }, [tournament]);

  // Simulate live score updates
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveScores(prev =>
        prev.map(m => {
          if (m.status === 'running' && m.sets.length > 0) {
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
    }, 2500);
    return () => clearInterval(timer);
  }, []);

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

  const events = getEventsByTournament(tournament.id);
  const liveMatches = liveScores.filter(m => m.status === 'running');
  const scheduledMatches = liveScores.filter(m => m.status === 'scheduled');
  const completedMatches = liveScores.filter(m => m.status === 'completed');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Nav */}
      <nav className="nav">
        <div className="container-app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{
              width: 32, height: 32,
              background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <IconShuttlecock size={16} />
            </div>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>MatchPoint</span>
          </Link>
          <Link href="/login" className="btn btn-ghost btn-sm">Sign In</Link>
        </div>
      </nav>

      {/* Tournament Banner */}
      <div style={{
        background: tournament.status === 'live'
          ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)'
          : tournament.status === 'completed'
          ? 'linear-gradient(135deg, #059669, #10b981)'
          : 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
        padding: '48px 0',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div className="container-app" style={{ position: 'relative', zIndex: 1 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.7)', fontSize: 13, textDecoration: 'none', marginBottom: 20 }}>
            <IconArrowLeft size={14} /> Back to Home
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h1 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 800 }}>{tournament.name}</h1>
            {tournament.status === 'live' && (
              <span className="badge badge-live" style={{ fontSize: 12 }}>
                <span className="live-dot" style={{ width: 6, height: 6 }} /> LIVE
              </span>
            )}
            {tournament.status === 'completed' && (
              <span className="badge badge-completed">Completed</span>
            )}
          </div>

          <p style={{ fontSize: 16, opacity: 0.85, maxWidth: 600, marginBottom: 20 }}>{tournament.description}</p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, fontSize: 14, opacity: 0.8 }}>
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
                fontSize: 13,
                fontWeight: 500,
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
        <div className="tab-group" style={{ marginBottom: 28, display: 'inline-flex' }}>
          <button className={`tab ${activeTab === 'live' ? 'active' : ''}`} onClick={() => setActiveTab('live')}>
            Live Scores {liveMatches.length > 0 && `(${liveMatches.length})`}
          </button>
          <button className={`tab ${activeTab === 'schedule' ? 'active' : ''}`} onClick={() => setActiveTab('schedule')}>
            Schedule
          </button>
          <button className={`tab ${activeTab === 'results' ? 'active' : ''}`} onClick={() => setActiveTab('results')}>
            Results
          </button>
        </div>

        {/* Live Scores Tab */}
        {activeTab === 'live' && (
          <div>
            {liveMatches.length === 0 ? (
              <div className="empty-state" style={{ marginTop: 40 }}>
                <div style={{ fontSize: 48 }}>📺</div>
                <p style={{ fontSize: 16, fontWeight: 500, marginTop: 12 }}>No live matches right now</p>
                <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Check back during the tournament for live scoring</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
                {liveMatches.map(match => {
                  const currentSet = match.sets[match.sets.length - 1];
                  return (
                    <div key={match.id} className="glass-card" style={{
                      padding: 24,
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <span className="badge badge-live">
                          <span className="live-dot" style={{ width: 5, height: 5 }} /> LIVE
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {match.court} · Set {match.sets.length}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '10px 0' }}>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>
                            {match.player1_name}
                          </div>
                          <div className="score-display" style={{ fontSize: 48 }}>
                            {currentSet?.player1_score ?? 0}
                          </div>
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 300, color: 'var(--text-muted)', padding: '0 12px' }}>vs</div>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>
                            {match.player2_name}
                          </div>
                          <div className="score-display" style={{ fontSize: 48, color: 'var(--text-secondary)' }}>
                            {currentSet?.player2_score ?? 0}
                          </div>
                        </div>
                      </div>

                      {/* Set history */}
                      {match.sets.length > 1 && (
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
                    </div>
                  );
                })}
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
                <p style={{ fontSize: 16, fontWeight: 500, marginTop: 12 }}>No upcoming matches</p>
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
                    </tr>
                  </thead>
                  <tbody>
                    {scheduledMatches.map(match => (
                      <tr key={match.id}>
                        <td>
                          <div style={{ fontWeight: 500 }}>{match.player1_name}</div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>vs {match.player2_name}</div>
                        </td>
                        <td>{match.court || 'TBD'}</td>
                        <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                          {match.scheduled_time
                            ? new Date(match.scheduled_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
                            : 'TBD'
                          }
                        </td>
                        <td><span className="badge badge-open">Scheduled</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && (
          <div>
            {completedMatches.length === 0 ? (
              <div className="empty-state" style={{ marginTop: 40 }}>
                <div style={{ fontSize: 48 }}>🏆</div>
                <p style={{ fontSize: 16, fontWeight: 500, marginTop: 12 }}>No completed matches yet</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {completedMatches.map(match => (
                  <div key={match.id} className="glass-card" style={{ padding: 16 }}>
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
                        {match.sets.map((s, i) => (
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
                        ))}
                      </div>
                      <div style={{ marginLeft: 20 }}>
                        <span className="badge badge-completed">{match.court}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

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
    </div>
  );
}
