'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Tournament, TournamentEvent, Registration, Match } from '@/types';
import * as dbService from '@/lib/supabase-service';
import {
  mockDashboardStats,
  mockTournaments,
  getLiveMatches,
  getUpcomingMatches,
  getPlayerRegistrations,
  getUmpireMatches,
} from '@/lib/mock-data';
import {
  IconTrophy,
  IconUsers,
  IconActivity,
  IconCalendar,
  IconTarget,
  IconZap,
  IconPlay,
  IconChevronRight,
  IconClock,
  IconMapPin,
} from '@/components/icons';

export default function DashboardPage() {
  const { user, activeRole } = useAuth();

  if (!user) return null;

  const role = activeRole || user.role;
  if (role === 'admin') return <AdminDashboard />;
  if (role === 'umpire') return <UmpireDashboard />;
  return <PlayerDashboard userId={user.id} />;
}

function AdminDashboard() {
  const stats = mockDashboardStats;
  const liveMatches = getLiveMatches();
  const recentTournaments = mockTournaments.slice(0, 4);

  const statCards = [
    { label: 'Total Tournaments', value: stats.totalTournaments, icon: <IconTrophy size={22} />, color: 'var(--accent)' },
    { label: 'Active Tournaments', value: stats.activeTournaments, icon: <IconZap size={22} />, color: 'var(--score-live)' },
    { label: 'Total Registrations', value: stats.totalRegistrations, icon: <IconUsers size={22} />, color: '#3b82f6' },
    { label: 'Live Matches', value: stats.liveMatches, icon: <IconActivity size={22} />, color: 'var(--score-point)' },
    { label: 'Total Matches', value: stats.totalMatches, icon: <IconTarget size={22} />, color: '#a855f7' },
    { label: 'Completed', value: stats.completedMatches, icon: <IconCalendar size={22} />, color: '#06b6d4' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>Admin Dashboard</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
          Overview of your tournaments and activity
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 16,
        marginBottom: 32,
      }}>
        {statCards.map((card, i) => (
          <div key={i} className="stat-card animate-slide-up stagger-item">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ color: card.color }}>{card.icon}</div>
            </div>
            <div className="stat-value" style={{ color: card.color }}>{card.value}</div>
            <div className="stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Live Matches & Recent Tournaments */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Live Matches */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="live-dot" />
              Live Matches
            </h2>
          </div>
          {liveMatches.length === 0 ? (
            <div className="empty-state" style={{ padding: 30 }}>
              <div className="empty-state-icon">🏸</div>
              <p style={{ fontSize: 14 }}>No live matches right now</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {liveMatches.map(match => {
                const currentSet = match.sets[match.sets.length - 1];
                return (
                  <div key={match.id} style={{
                    padding: 14,
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span className="badge badge-live" style={{ fontSize: 10 }}>
                        <span className="live-dot" style={{ width: 5, height: 5 }} /> LIVE
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{match.court}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{match.player1_name}</span>
                      <span style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                        {currentSet?.player1_score ?? 0}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>{match.player2_name}</span>
                      <span style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                        {currentSet?.player2_score ?? 0}
                      </span>
                    </div>
                    {match.sets.length > 1 && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                        Sets: {match.sets.map(s => `${s.player1_score}-${s.player2_score}`).join(' | ')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Tournaments */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>Recent Tournaments</h2>
            <Link href="/dashboard/tournaments" className="btn btn-ghost btn-sm">
              View All <IconChevronRight size={14} />
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recentTournaments.map(t => (
              <Link
                key={t.id}
                href="/dashboard/tournaments"
                style={{
                  padding: 14,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  textDecoration: 'none',
                  display: 'block',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{t.name}</span>
                  <span className={`badge badge-${t.status}`}>{t.status}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <IconCalendar size={12} />
                    {new Date(t.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <IconMapPin size={12} />
                    {t.location.split(',')[0]}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PlayerDashboard({ userId }: { userId: string }) {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [events, setEvents] = useState<TournamentEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'current' | 'completed'>('current');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [regs, matches, tours, evs] = await Promise.all([
          dbService.getPlayerRegistrations(userId),
          dbService.getUpcomingMatches(userId),
          dbService.getTournaments(),
          dbService.getEvents(),
        ]);
        setRegistrations(regs);
        setUpcomingMatches(matches);
        setTournaments(tours);
        setEvents(evs);
      } catch (err) {
        console.error('Failed to load player dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [userId]);

  const getTournamentForReg = (tournamentId: string) => {
    return tournaments.find(t => t.id === tournamentId);
  };

  const getEventForReg = (eventId: string) => {
    return events.find(e => e.id === eventId);
  };

  // 1. Current & Upcoming: Tournament status !== 'completed'. Sorted in ascending order of start_date (earlier start dates first).
  const currentAndUpcomingRegs = registrations
    .filter(reg => {
      const t = getTournamentForReg(reg.tournament_id);
      return t ? t.status !== 'completed' : true;
    })
    .sort((a, b) => {
      const tA = getTournamentForReg(a.tournament_id);
      const tB = getTournamentForReg(b.tournament_id);
      const dateA = tA?.start_date ? new Date(tA.start_date).getTime() : 0;
      const dateB = tB?.start_date ? new Date(tB.start_date).getTime() : 0;
      return dateA - dateB;
    });

  // 2. Completed: Tournament status === 'completed'. Sorted in descending order of start_date (latest completed first).
  const completedRegs = registrations
    .filter(reg => {
      const t = getTournamentForReg(reg.tournament_id);
      return t ? t.status === 'completed' : false;
    })
    .sort((a, b) => {
      const tA = getTournamentForReg(a.tournament_id);
      const tB = getTournamentForReg(b.tournament_id);
      const dateA = tA?.start_date ? new Date(tA.start_date).getTime() : 0;
      const dateB = tB?.start_date ? new Date(tB.start_date).getTime() : 0;
      return dateB - dateA;
    });

  const displayedRegs = activeTab === 'current' ? currentAndUpcomingRegs : completedRegs;

  if (loading) {
    return (
      <div className="glass-card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
        <div className="animate-spin" style={{ display: 'inline-block', fontSize: 24, marginBottom: 12, animation: 'spin 2s linear infinite' }}>🔄</div>
        <p style={{ fontSize: 15, fontWeight: 500 }}>Loading Player Dashboard...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>Player Dashboard</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>Your matches and tournaments</p>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--accent)' }}>{registrations.length}</div>
          <div className="stat-label">Registrations</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--score-live)' }}>{upcomingMatches.length}</div>
          <div className="stat-label">Upcoming Matches</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#a855f7' }}>
            {registrations.filter(r => r.status === 'approved').length}
          </div>
          <div className="stat-label">Approved</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Upcoming Matches */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Upcoming Matches</h2>
          {upcomingMatches.length === 0 ? (
            <div className="empty-state" style={{ padding: 30 }}>
              <div className="empty-state-icon">📋</div>
              <p style={{ fontSize: 14 }}>No upcoming matches</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {upcomingMatches.map(match => (
                <div key={match.id} style={{
                  padding: 14,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span className={`badge badge-${match.status === 'running' ? 'live' : 'open'}`}>
                      {match.status === 'running' ? 'LIVE' : 'Scheduled'}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{match.court}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>
                    {match.player1_name} vs {match.player2_name}
                  </div>
                  {match.scheduled_time && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <IconClock size={12} />
                      {new Date(match.scheduled_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Registrations */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>My Registrations</h2>
          
          {/* Elegant tab switching pill-buttons */}
          <div className="tab-group" style={{ display: 'inline-flex', width: '100%', marginBottom: 16 }}>
            <button
              className={`tab ${activeTab === 'current' ? 'active' : ''}`}
              onClick={() => setActiveTab('current')}
              style={{ flex: 1, textAlign: 'center' }}
            >
              Current & Upcoming ({currentAndUpcomingRegs.length})
            </button>
            <button
              className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
              onClick={() => setActiveTab('completed')}
              style={{ flex: 1, textAlign: 'center' }}
            >
              Completed ({completedRegs.length})
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {displayedRegs.length === 0 ? (
              <div className="empty-state" style={{ padding: 30 }}>
                <div className="empty-state-icon">📋</div>
                <p style={{ fontSize: 14 }}>
                  No {activeTab === 'current' ? 'current or upcoming' : 'completed'} registrations found.
                </p>
              </div>
            ) : (
              displayedRegs.map(reg => {
                const tournament = getTournamentForReg(reg.tournament_id);
                const eventObj = getEventForReg(reg.event_id);
                return (
                  <div key={reg.id} style={{
                    padding: 14,
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {tournament?.name || reg.tournament_id}
                      </span>
                      <span className={`badge badge-${reg.status}`}>{reg.status}</span>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {eventObj?.event_name || reg.event_id}
                      </span>
                      {reg.seed && (
                        <span style={{ fontWeight: 600, color: 'var(--score-point)' }}>Seed #{reg.seed}</span>
                      )}
                    </div>

                    {tournament?.start_date && (
                      <div style={{
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        marginTop: 2,
                        borderTop: '1px dashed var(--border)',
                        paddingTop: 6
                      }}>
                        <IconCalendar size={12} />
                        <span>
                          Starts: {new Date(tournament.start_date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Browse Tournaments */}
      <div style={{ marginTop: 32 }}>
        <Link href="/dashboard/my-tournaments" className="btn btn-primary">
          <IconTrophy size={16} /> Browse Tournaments
        </Link>
      </div>
    </div>
  );
}

function UmpireDashboard() {
  const { user } = useAuth();
  const assignedMatches = user ? getUmpireMatches(user.id) : [];
  const liveMatch = assignedMatches.find(m => m.status === 'running');
  const scheduledMatches = assignedMatches.filter(m => m.status === 'scheduled');

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>Umpire Dashboard</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>Score matches and manage live games</p>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--accent)' }}>{assignedMatches.length}</div>
          <div className="stat-label">Assigned Matches</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--score-live)' }}>{liveMatch ? 1 : 0}</div>
          <div className="stat-label">Live Now</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#a855f7' }}>{scheduledMatches.length}</div>
          <div className="stat-label">Upcoming</div>
        </div>
      </div>

      {/* Current Live Match */}
      {liveMatch && (
        <div className="glass-card" style={{ padding: 24, marginBottom: 24, border: '1px solid rgba(34, 197, 94, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="live-dot" /> Currently Scoring
            </h2>
            <Link href="/dashboard/scoring" className="btn btn-primary btn-sm">
              <IconPlay size={14} /> Open Scorer
            </Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '20px 0' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{liveMatch.player1_name}</div>
              <div className="score-display" style={{ color: 'var(--text-primary)' }}>
                {liveMatch.sets[liveMatch.sets.length - 1]?.player1_score ?? 0}
              </div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 300, color: 'var(--text-muted)' }}>vs</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{liveMatch.player2_name}</div>
              <div className="score-display" style={{ color: 'var(--text-secondary)' }}>
                {liveMatch.sets[liveMatch.sets.length - 1]?.player2_score ?? 0}
              </div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
            {liveMatch.court} · Set {liveMatch.sets.length}
          </div>
        </div>
      )}

      {/* Upcoming Matches */}
      <div className="glass-card" style={{ padding: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Scheduled Matches</h2>
        {scheduledMatches.length === 0 ? (
          <div className="empty-state" style={{ padding: 30 }}>
            <div className="empty-state-icon">📋</div>
            <p style={{ fontSize: 14 }}>No upcoming matches assigned</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {scheduledMatches.map(match => (
              <div key={match.id} style={{
                padding: 14,
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{match.player1_name} vs {match.player2_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {match.court} · {match.scheduled_time ? new Date(match.scheduled_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'TBD'}
                  </div>
                </div>
                <Link href="/dashboard/scoring" className="btn btn-secondary btn-sm">
                  <IconPlay size={14} /> Start
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
