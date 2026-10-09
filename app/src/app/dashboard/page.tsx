'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useSport } from '@/lib/sport-context';
import ShuttlecockLoader from '@/components/ShuttlecockLoader';
import { Tournament, TournamentEvent, Registration, Match, User } from '@/types';
import * as dbService from '@/lib/supabase-service';
import { getActiveMatchSet } from '@/lib/sports-rules';
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
  IconX,
} from '@/components/icons';

export default function DashboardPage() {
  const { user, activeRole } = useAuth();

  if (!user) return null;

  const role = activeRole || user.role;
  if (role === 'system_admin') return <SystemAdminDashboard />;
  if (role === 'admin') return <AdminDashboard />;
  if (role === 'umpire') return <UmpireDashboard />;
  if (role === 'broadcaster') return <BroadcasterDashboard />;
  return <PlayerDashboard userId={user.id} />;
}

function AdminDashboard() {
  const { activeSport } = useSport();
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<Match[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [events, setEvents] = useState<TournamentEvent[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);

  useEffect(() => {
    async function loadAdminData() {
      try {
        setLoading(true);
        const [mats, tours, evs, regs] = await Promise.all([
          dbService.getMatches(),
          dbService.getTournaments(),
          dbService.getEvents(),
          dbService.getRegistrations(),
        ]);
        setMatches(mats);
        setTournaments(tours);
        setEvents(evs);
        setRegistrations(regs);
      } catch (err) {
        console.error('Failed to load admin dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAdminData();
  }, []);

  if (loading) {
    return (
      <div className="glass-card" style={{ padding: 48 }}>
        <ShuttlecockLoader message="Loading Admin Dashboard..." />
      </div>
    );
  }

  const filteredTournaments = tournaments.filter(t => activeSport === 'all' || t.sport === activeSport);
  const filteredMatches = matches.filter(m => activeSport === 'all' || m.sport === activeSport);
  const liveMatches = filteredMatches.filter(m => m.status === 'running' || m.status === 'paused');
  const recentTournaments = filteredTournaments.slice(0, 4);

  const stats = {
    totalTournaments: filteredTournaments.length,
    activeTournaments: filteredTournaments.filter(t => t.status === 'live').length,
    totalRegistrations: registrations.filter(r => {
      const tour = tournaments.find(t => t.id === r.tournament_id);
      return activeSport === 'all' || (tour && tour.sport === activeSport);
    }).length,
    liveMatches: liveMatches.length,
    totalMatches: filteredMatches.length,
    completedMatches: filteredMatches.filter(m => m.status === 'completed').length,
  };

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
                const currentSet = getActiveMatchSet(match.sets);
                const tour = tournaments.find(t => t.id === match.tournament_id);
                const ev = events.find(e => e.id === match.event_id);
                return (
                  <div key={match.id} style={{
                    padding: 14,
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      {match.status === 'paused' ? (
                        <span className="badge badge-paused" style={{ fontSize: 10, background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.4)', fontWeight: 800 }}>
                          ⏸ PAUSED
                        </span>
                      ) : (
                        <span className="badge badge-live" style={{ fontSize: 10 }}>
                          <span className="live-dot" style={{ width: 5, height: 5 }} /> LIVE
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{match.court}</span>
                    </div>
                    {tour && ev && (
                      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 6 }}>
                        {tour.name} · {ev.event_name}
                      </div>
                    )}
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
  const { activeSport } = useSport();
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

  const filteredUpcomingMatches = upcomingMatches.filter(m => activeSport === 'all' || m.sport === activeSport);
  const filteredRegistrations = registrations.filter(r => {
    const t = getTournamentForReg(r.tournament_id);
    return activeSport === 'all' || (t && t.sport === activeSport);
  });

  // 1. Current & Upcoming: Tournament status !== 'completed'. Sorted in ascending order of start_date (earlier start dates first).
  const currentAndUpcomingRegs = filteredRegistrations
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
  const completedRegs = filteredRegistrations
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
      <div className="glass-card" style={{ padding: 48 }}>
        <ShuttlecockLoader message="Loading Player Dashboard..." />
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
          <div className="stat-value" style={{ color: 'var(--accent)' }}>{filteredRegistrations.length}</div>
          <div className="stat-label">Registrations</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--score-live)' }}>{filteredUpcomingMatches.length}</div>
          <div className="stat-label">Upcoming Matches</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#a855f7' }}>
            {filteredRegistrations.filter(r => r.status === 'approved').length}
          </div>
          <div className="stat-label">Approved</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Upcoming Matches */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Upcoming Matches</h2>
          {filteredUpcomingMatches.length === 0 ? (
            <div className="empty-state" style={{ padding: 30 }}>
              <div className="empty-state-icon">📋</div>
              <p style={{ fontSize: 14 }}>No upcoming matches</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredUpcomingMatches.map(match => {
                const tour = tournaments.find(t => t.id === match.tournament_id);
                const ev = events.find(e => e.id === match.event_id);
                return (
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
                    {tour && ev && (
                      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 6 }}>
                        {tour.name} · {ev.event_name}
                      </div>
                    )}
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
                );
              })}
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
                        {eventObj?.event_name || reg.event_id}{reg.partner_name ? ` (with ${reg.partner_name})` : ''}
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
  const { activeSport } = useSport();
  const [loading, setLoading] = useState(true);
  const [assignedMatches, setAssignedMatches] = useState<Match[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [events, setEvents] = useState<TournamentEvent[]>([]);
  const [showAdHocModal, setShowAdHocModal] = useState(false);

  useEffect(() => {
    if (!user) return;
    async function loadUmpireData() {
      if (!user) return;
      try {
        setLoading(true);
        const [mats, tours, evs] = await Promise.all([
          dbService.getUmpireMatches(user.id),
          dbService.getTournaments(),
          dbService.getEvents(),
        ]);
        setAssignedMatches(mats);
        setTournaments(tours);
        setEvents(evs);
      } catch (err) {
        console.error('Failed to load umpire dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadUmpireData();

    // Poll umpire matches every 3 seconds to keep live scores up-to-date
    const interval = setInterval(async () => {
      try {
        const mats = await dbService.getUmpireMatches(user.id);
        setAssignedMatches(mats);
      } catch {}
    }, 3000);

    return () => clearInterval(interval);
  }, [user]);

  if (loading) {
    return (
      <div className="glass-card" style={{ padding: 48 }}>
        <ShuttlecockLoader message="Loading Umpire Dashboard..." />
      </div>
    );
  }

  const filteredAssignedMatches = assignedMatches.filter(m => activeSport === 'all' || m.sport === activeSport);
  const liveMatches = filteredAssignedMatches.filter(m => m.status === 'running' || m.status === 'paused');
  const scheduledMatches = filteredAssignedMatches.filter(m => m.status === 'scheduled');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Umpire Dashboard</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>Score matches and manage live games</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowAdHocModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          ⚡ New Ad-hoc Match
        </button>
      </div>

      {showAdHocModal && (
        <AdHocMatchModal
          onClose={() => setShowAdHocModal(false)}
          umpire={user}
        />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--accent)' }}>{filteredAssignedMatches.length}</div>
          <div className="stat-label">Assigned Matches</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--score-live)' }}>{liveMatches.length}</div>
          <div className="stat-label">Live Now</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#a855f7' }}>{scheduledMatches.length}</div>
          <div className="stat-label">Upcoming</div>
        </div>
      </div>

      {/* Current Live / Paused Matches */}
      {liveMatches.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span className="live-dot" /> Active & Live Matches ({liveMatches.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {liveMatches.map(match => {
              const currentSet = getActiveMatchSet(match.sets);
              const tour = tournaments.find(t => t.id === match.tournament_id);
              const ev = events.find(e => e.id === match.event_id);
              const isPaused = match.status === 'paused';

              return (
                <div
                  key={match.id}
                  className="glass-card"
                  style={{
                    padding: 20,
                    border: isPaused ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(34, 197, 94, 0.4)',
                    background: isPaused ? 'rgba(245, 158, 11, 0.03)' : undefined,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {isPaused ? (
                        <span className="badge badge-paused" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.4)', fontWeight: 800 }}>
                          ⏸ PAUSED
                        </span>
                      ) : (
                        <span className="badge badge-live" style={{ fontWeight: 800 }}>
                          <span className="live-dot" style={{ width: 5, height: 5 }} /> LIVE
                        </span>
                      )}
                      {tour && ev && (
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase' }}>
                          {tour.name} · {ev.event_name}
                        </div>
                      )}
                    </div>
                    <Link
                      href={`/dashboard/scoring?matchId=${match.id}`}
                      className="btn btn-primary btn-sm"
                      style={{
                        background: isPaused ? 'linear-gradient(135deg, #d97706, #b45309)' : undefined,
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <IconPlay size={14} /> {isPaused ? 'Resume Scorer' : 'Open Scorer'}
                    </Link>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '14px 0' }}>
                    <div style={{ textAlign: 'center', flex: 1 }}>
                      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{match.player1_name}</div>
                      <div className="score-display" style={{ color: 'var(--text-primary)', fontSize: 36 }}>
                        {currentSet?.player1_score ?? 0}
                      </div>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 300, color: 'var(--text-muted)', padding: '0 12px' }}>vs</div>
                    <div style={{ textAlign: 'center', flex: 1 }}>
                      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{match.player2_name}</div>
                      <div className="score-display" style={{ color: 'var(--text-secondary)', fontSize: 36 }}>
                        {currentSet?.player2_score ?? 0}
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                    <span>{match.court}</span>
                    <span>·</span>
                    <span>Set {currentSet?.set_number ?? 1}</span>
                    {match.sets.length > 1 && (
                      <span style={{ color: 'rgba(255,255,255,0.45)' }}>
                        (Sets: {match.sets.map(s => `${s.player1_score}-${s.player2_score}`).join(', ')})
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
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
            {scheduledMatches.map(match => {
              const tour = tournaments.find(t => t.id === match.tournament_id);
              const ev = events.find(e => e.id === match.event_id);
              return (
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
                    {tour && ev && (
                      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 4 }}>
                        {tour.name} · {ev.event_name}
                      </div>
                    )}
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{match.player1_name} vs {match.player2_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {match.court} · {match.scheduled_time ? new Date(match.scheduled_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'TBD'}
                    </div>
                  </div>
                  <Link href={`/dashboard/scoring?matchId=${match.id}`} className="btn btn-secondary btn-sm">
                    <IconPlay size={14} /> Start
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Ad-Hoc Match Creation Modal ───────────────────────────

export interface AdHocMatchModalProps {
  onClose: () => void;
  umpire: any;
}

export function AdHocMatchModal({ onClose, umpire }: AdHocMatchModalProps) {
  const router = useRouter();
  const { activeSport } = useSport();
  const [adhocSport, setAdhocSport] = useState<'badminton' | 'table_tennis' | 'squash' | 'tennis' | 'volleyball'>(
    activeSport === 'all' ? 'badminton' : (activeSport as any)
  );
  const [format, setFormat] = useState<'singles' | 'doubles'>('singles');
  const [adhocType, setAdhocType] = useState<string>('practice');
  const [scoringFormat, setScoringFormat] = useState<string>('21-point');
  const [court, setCourt] = useState<string>('Court 1');

  // Player fields
  const [p1Search, setP1Search] = useState('');
  const [p1Id, setP1Id] = useState('');
  const [p2Search, setP2Search] = useState('');
  const [p2Id, setP2Id] = useState('');

  // Doubles partners
  const [p1PartnerSearch, setP1PartnerSearch] = useState('');
  const [p1PartnerId, setP1PartnerId] = useState('');
  const [p2PartnerSearch, setP2PartnerSearch] = useState('');
  const [p2PartnerId, setP2PartnerId] = useState('');

  const [players, setPlayers] = useState<User[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active dropdown index to track which input's dropdown is visible
  const [activeDropdown, setActiveDropdown] = useState<'p1' | 'p2' | 'p1p' | 'p2p' | null>(null);

  useEffect(() => {
    async function fetchPlayers() {
      try {
        setLoadingPlayers(true);
        const data = await dbService.getPlayers();
        setPlayers(data);
      } catch (err) {
        console.error('Failed to load players directory:', err);
      } finally {
        setLoadingPlayers(false);
      }
    }
    fetchPlayers();
  }, []);

  useEffect(() => {
    if (adhocSport === 'tennis') {
      setScoringFormat('standard');
    } else if (adhocSport === 'table_tennis') {
      setScoringFormat('11-point');
    } else if (adhocSport === 'squash') {
      setScoringFormat('11-point');
    } else if (adhocSport === 'volleyball') {
      setScoringFormat('25-point');
    } else {
      setScoringFormat('21-point');
    }
  }, [adhocSport]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Resolve Player 1 Name & ID
    const name1 = p1Search.trim() || 'Player 1';
    const id1 = p1Id || `adhoc-p1-${Date.now()}`;

    // Resolve Player 2 Name & ID (Team 2 Singles, or Team 1 Doubles Partner)
    const name2 = p2Search.trim() || 'Player 2';
    const id2 = p2Id || `adhoc-p2-${Date.now()}`;

    // Validate uniqueness of players
    if (format === 'singles') {
      const isSameId = p1Id && p2Id && p1Id === p2Id;
      const isSameName = name1.toLowerCase() === name2.toLowerCase();
      if (isSameId || isSameName) {
        setError('Player 1 and Player 2 must be different.');
        setSubmitting(false);
        return;
      }
    } else {
      // Doubles
      const p1pName = p1PartnerSearch.trim() || 'Player 2';
      const p1pId = p1PartnerId || `adhoc-p1p-${Date.now()}`;

      const p2pName = p2PartnerSearch.trim() || 'Player 4';
      const p2pId = p2PartnerId || `adhoc-p2p-${Date.now()}`;

      const names = [
        name1.toLowerCase(),
        p1pName.toLowerCase(),
        name2.toLowerCase(),
        p2pName.toLowerCase()
      ];

      const ids = [id1, p1pId, id2, p2pId];

      // Check unique names
      const uniqueNames = new Set(names);
      if (uniqueNames.size !== names.length) {
        setError('All 4 players in a doubles match must be different.');
        setSubmitting(false);
        return;
      }

      // Check unique IDs
      const uniqueIds = new Set(ids);
      if (uniqueIds.size !== ids.length) {
        setError('All 4 players in a doubles match must be different.');
        setSubmitting(false);
        return;
      }
    }

    try {
      let player1NameCombined = name1;
      let player1IdCombined = id1;
      let player2NameCombined = name2;
      let player2IdCombined = id2;

      if (format === 'doubles') {
        const p1pName = p1PartnerSearch.trim() || 'Player 2';
        const p1pId = p1PartnerId || `adhoc-p1p-${Date.now()}`;

        const p2pName = p2PartnerSearch.trim() || 'Player 4';
        const p2pId = p2PartnerId || `adhoc-p2p-${Date.now()}`;

        player1NameCombined = `${name1} / ${p1pName}`;
        player1IdCombined = `${id1}/${p1pId}`;

        // In doubles, Player 3 and Player 4 are Team 2
        player2NameCombined = `${name2} / ${p2pName}`;
        player2IdCombined = `${id2}/${p2pId}`;
      }

      const newMatch: Match = {
        id: `adhoc-m-${Date.now()}`,
        player1_id: player1IdCombined,
        player1_name: player1NameCombined,
        player2_id: player2IdCombined,
        player2_name: player2NameCombined,
        umpire_id: umpire.id,
        umpire_name: umpire.name,
        court: court,
        status: 'scheduled',
        sport: adhocSport,
        sets: [],
        is_adhoc: true,
        adhoc_type: adhocType,
        fixture_round: 0,
        fixture_position: 0,
        round_name: adhocType.charAt(0).toUpperCase() + adhocType.slice(1) + ' Match',
        sport_metadata: {
          scoring_format: scoringFormat,
          format: format,
        },
      };

      const savedMatch = await dbService.createMatch(newMatch);

      // Audit Log: Ad-hoc match created
      await dbService.logAction(
        'Ad-hoc Match Created',
        'match',
        `Umpire ${umpire.name} created an adhoc ${format} ${adhocType} match: ${player1NameCombined} vs ${player2NameCombined}`,
        umpire
      );

      // Redirect immediately to the scoring page using Next.js router
      router.push(`/dashboard/scoring?matchId=${savedMatch.id}`);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to create ad-hoc match');
      setSubmitting(false);
    }
  };

  // Filter players list based on active input query
  const getFilteredPlayers = (query: string, currentField: 'p1' | 'p2' | 'p1p' | 'p2p') => {
    if (!query) return [];

    const selectedIds: string[] = [];
    if (currentField !== 'p1' && p1Id) selectedIds.push(p1Id);
    if (currentField !== 'p2' && p2Id) selectedIds.push(p2Id);
    if (currentField !== 'p1p' && p1PartnerId) selectedIds.push(p1PartnerId);
    if (currentField !== 'p2p' && p2PartnerId) selectedIds.push(p2PartnerId);

    return players.filter(p =>
      !selectedIds.includes(p.id) &&
      (p.name.toLowerCase().includes(query.toLowerCase()) ||
       p.email.toLowerCase().includes(query.toLowerCase()))
    ).slice(0, 5); // Limit to 5 suggestions
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(10, 10, 12, 0.6)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }} onClick={onClose}>
      <div style={{
        background: '#ffffff', border: '1px solid rgba(0, 0, 0, 0.1)', borderRadius: 'var(--radius-lg)',
        width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', display: 'flex', flexDirection: 'column', position: 'relative'
      }} onClick={e => e.stopPropagation()}>
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16, background: 'rgba(0, 0, 0, 0.05)',
            border: 'none', borderRadius: '50%', width: 32, height: 32,
            color: '#0f172a', fontSize: 14, cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 10
          }}
        >
          <IconX size={14} />
        </button>

        {/* Header */}
        <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>⚡ Create Ad-hoc Match</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Set up and score a quick practice or warmup match</p>
        </div>

        <form onSubmit={handleCreate} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && <div style={{ color: '#ef4444', fontSize: 13, fontWeight: 500 }}>⚠️ {error}</div>}

          {/* Match Settings Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div className="input-group">
              <label className="input-label">Sport</label>
              <select className="input" value={adhocSport} onChange={e => setAdhocSport(e.target.value as any)}>
                <option value="volleyball">🏐 Volleyball</option>
                <option value="badminton">🏸 Badminton</option>
                <option value="table_tennis">🏓 Table Tennis</option>
                <option value="squash">🎾 Squash</option>
                <option value="tennis">🥎 Tennis</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Format</label>
              <select className="input" value={format} onChange={e => setFormat(e.target.value as any)}>
                {adhocSport === 'volleyball' ? (
                  <>
                    <option value="singles">👥 Team (6v6 / Roster)</option>
                    <option value="doubles">🏖️ Beach Doubles (2v2)</option>
                  </>
                ) : (
                  <>
                    <option value="singles">👤 Singles</option>
                    <option value="doubles">👥 Doubles</option>
                  </>
                )}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Type</label>
              <select className="input" value={adhocType} onChange={e => setAdhocType(e.target.value)}>
                <option value="practice">⚡ Practice</option>
                <option value="warmup">🔥 Warmup</option>
                <option value="friendly">🤝 Friendly</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="input-group">
              <label className="input-label">Scoring Format</label>
              <select className="input" value={scoringFormat} onChange={e => setScoringFormat(e.target.value)}>
                {adhocSport === 'volleyball' && (
                  <>
                    <option value="25-point">25-Point Standard (Sets 1-4: 25, Decider: 15)</option>
                    <option value="21-point">21-Point Fast (Sets 1-2: 21, Decider: 15)</option>
                    <option value="15-point">15-Point Blitz</option>
                  </>
                )}
                {adhocSport === 'tennis' && (
                  <option value="standard">Standard Sets</option>
                )}
                {adhocSport === 'table_tennis' && (
                  <>
                    <option value="11-point">11-Point Standard</option>
                    <option value="21-point">21-Point Classic</option>
                  </>
                )}
                {adhocSport === 'squash' && (
                  <option value="11-point">11-Point Standard</option>
                )}
                {adhocSport === 'badminton' && (
                  <>
                    <option value="21-point">21-Point Standard</option>
                    <option value="15-point">15-Point Quick</option>
                    <option value="11-point">11-Point Blitz</option>
                  </>
                )}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Court / Location</label>
              <input type="text" className="input" value={court} onChange={e => setCourt(e.target.value)} required />
            </div>
          </div>

          {/* Player Selection Section */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>
              {format === 'singles' ? '👤 Player Selection' : '👥 Team Selection'}
            </h4>

            {format === 'singles' ? (
              // Singles Fields
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Player 1 */}
                <div style={{ position: 'relative' }}>
                  <label className="input-label">Player 1 (Left Side)</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Search or enter Player 1 name..."
                    value={p1Search}
                    onChange={e => {
                      setP1Search(e.target.value);
                      setP1Id('');
                      setActiveDropdown('p1');
                    }}
                    onFocus={() => setActiveDropdown('p1')}
                    onBlur={() => setTimeout(() => setActiveDropdown(null), 200)}
                  />
                  {activeDropdown === 'p1' && p1Search && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff',
                      border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', zIndex: 10,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflowY: 'auto', maxHeight: 200
                    }}>
                      {getFilteredPlayers(p1Search, 'p1').map(p => (
                        <div
                          key={p.id}
                          style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: 13 }}
                          onMouseDown={() => {
                            setP1Search(p.name);
                            setP1Id(p.id);
                            setActiveDropdown(null);
                          }}
                          onMouseOver={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.email}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Player 2 */}
                <div style={{ position: 'relative' }}>
                  <label className="input-label">Player 2 (Right Side)</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Search or enter Player 2 name..."
                    value={p2Search}
                    onChange={e => {
                      setP2Search(e.target.value);
                      setP2Id('');
                      setActiveDropdown('p2');
                    }}
                    onFocus={() => setActiveDropdown('p2')}
                    onBlur={() => setTimeout(() => setActiveDropdown(null), 200)}
                  />
                  {activeDropdown === 'p2' && p2Search && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff',
                      border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', zIndex: 10,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflowY: 'auto', maxHeight: 200
                    }}>
                      {getFilteredPlayers(p2Search, 'p2').map(p => (
                        <div
                          key={p.id}
                          style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: 13 }}
                          onMouseDown={() => {
                            setP2Search(p.name);
                            setP2Id(p.id);
                            setActiveDropdown(null);
                          }}
                          onMouseOver={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.email}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Doubles Fields
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Team 1 */}
                <div style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>Team 1 (Left Side)</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                    {/* Player 1 */}
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        className="input"
                        placeholder="Search or enter Player 1 name..."
                        value={p1Search}
                        onChange={e => {
                          setP1Search(e.target.value);
                          setP1Id('');
                          setActiveDropdown('p1');
                        }}
                        onFocus={() => setActiveDropdown('p1')}
                        onBlur={() => setTimeout(() => setActiveDropdown(null), 200)}
                      />
                      {activeDropdown === 'p1' && p1Search && (
                        <div style={{
                          position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff',
                          border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', zIndex: 10,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflowY: 'auto', maxHeight: 150
                        }}>
                          {getFilteredPlayers(p1Search, 'p1').map(p => (
                            <div
                              key={p.id}
                              style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: 13 }}
                              onMouseDown={() => {
                                setP1Search(p.name);
                                setP1Id(p.id);
                                setActiveDropdown(null);
                              }}
                              onMouseOver={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.email}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Player 2 */}
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        className="input"
                        placeholder="Search or enter Partner name..."
                        value={p1PartnerSearch}
                        onChange={e => {
                          setP1PartnerSearch(e.target.value);
                          setP1PartnerId('');
                          setActiveDropdown('p1p');
                        }}
                        onFocus={() => setActiveDropdown('p1p')}
                        onBlur={() => setTimeout(() => setActiveDropdown(null), 200)}
                      />
                      {activeDropdown === 'p1p' && p1PartnerSearch && (
                        <div style={{
                          position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff',
                          border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', zIndex: 10,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflowY: 'auto', maxHeight: 150
                        }}>
                          {getFilteredPlayers(p1PartnerSearch, 'p1p').map(p => (
                            <div
                              key={p.id}
                              style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: 13 }}
                              onMouseDown={() => {
                                setP1PartnerSearch(p.name);
                                setP1PartnerId(p.id);
                                setActiveDropdown(null);
                              }}
                              onMouseOver={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.email}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Team 2 */}
                <div style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>Team 2 (Right Side)</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                    {/* Player 3 */}
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        className="input"
                        placeholder="Search or enter Player 3 name..."
                        value={p2Search}
                        onChange={e => {
                          setP2Search(e.target.value);
                          setP2Id('');
                          setActiveDropdown('p2');
                        }}
                        onFocus={() => setActiveDropdown('p2')}
                        onBlur={() => setTimeout(() => setActiveDropdown(null), 200)}
                      />
                      {activeDropdown === 'p2' && p2Search && (
                        <div style={{
                          position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff',
                          border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', zIndex: 10,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflowY: 'auto', maxHeight: 150
                        }}>
                          {getFilteredPlayers(p2Search, 'p2').map(p => (
                            <div
                              key={p.id}
                              style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: 13 }}
                              onMouseDown={() => {
                                setP2Search(p.name);
                                setP2Id(p.id);
                                setActiveDropdown(null);
                              }}
                              onMouseOver={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.email}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Player 4 */}
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        className="input"
                        placeholder="Search or enter Partner name..."
                        value={p2PartnerSearch}
                        onChange={e => {
                          setP2PartnerSearch(e.target.value);
                          setP2PartnerId('');
                          setActiveDropdown('p2p');
                        }}
                        onFocus={() => setActiveDropdown('p2p')}
                        onBlur={() => setTimeout(() => setActiveDropdown(null), 200)}
                      />
                      {activeDropdown === 'p2p' && p2PartnerSearch && (
                        <div style={{
                          position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff',
                          border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', zIndex: 10,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflowY: 'auto', maxHeight: 150
                        }}>
                          {getFilteredPlayers(p2PartnerSearch, 'p2p').map(p => (
                            <div
                              key={p.id}
                              style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: 13 }}
                              onMouseDown={() => {
                                setP2PartnerSearch(p.name);
                                setP2PartnerId(p.id);
                                setActiveDropdown(null);
                              }}
                              onMouseOver={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.email}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 12 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : '⚡ Start Scoring'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Broadcaster Dashboard ───────────────────────────────────

function BroadcasterDashboard() {
  const { user } = useAuth();
  const { activeSport } = useSport();
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [events, setEvents] = useState<TournamentEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [mats, tours, evs] = await Promise.all([
          dbService.getMatches(),
          dbService.getTournaments(),
          dbService.getEvents(),
        ]);
        setLiveMatches(mats.filter(m => m.status === 'running' || m.status === 'paused'));
        setTournaments(tours);
        setEvents(evs);
      } catch (err) {
        console.error('Failed to load broadcaster dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    load();

    // Poll live matches every 3 seconds to keep live scores up-to-date
    const interval = setInterval(async () => {
      try {
        const mats = await dbService.getMatches();
        setLiveMatches(mats.filter(m => m.status === 'running' || m.status === 'paused'));
      } catch {}
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="glass-card" style={{ padding: 48 }}>
        <ShuttlecockLoader message="Loading Broadcaster Studio..." />
      </div>
    );
  }

  const filteredLiveMatches = liveMatches.filter(m => activeSport === 'all' || m.sport === activeSport);
  const activeTournamentsCount = tournaments.filter(t => (activeSport === 'all' || t.sport === activeSport) && t.status === 'live').length;

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, background: '#f43f5e', color: '#fff', padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase' }}>
            BROADCASTER
          </span>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>Broadcaster Dashboard</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
          Select a live match to start your camera broadcast with the live score overlay.
        </p>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 32 }}>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#f43f5e' }}>{filteredLiveMatches.length}</div>
          <div className="stat-label">Live Now</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--accent)' }}>{activeTournamentsCount}</div>
          <div className="stat-label">Active Tournaments</div>
        </div>
      </div>

      {/* Live Matches */}
      <div className="glass-card" style={{ padding: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="live-dot" /> Live Matches — Select to Broadcast
        </h2>
        {filteredLiveMatches.length === 0 ? (
          <div className="empty-state" style={{ padding: 48 }}>
            <div className="empty-state-icon">📡</div>
            <p style={{ fontSize: 14 }}>No live matches right now</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              Matches will appear here as soon as an umpire starts scoring.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredLiveMatches.map(match => {
              const tour = tournaments.find(t => t.id === match.tournament_id);
              const ev = events.find(e => e.id === match.event_id);
              const currentSet = getActiveMatchSet(match.sets);
              return (
                <div key={match.id} style={{
                  padding: 16, borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-secondary)', border: '1px solid rgba(244,63,94,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      {match.status === 'paused' ? (
                        <span className="badge badge-paused" style={{ fontSize: 9, background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.4)', fontWeight: 800, padding: '1px 6px' }}>
                          ⏸ PAUSED
                        </span>
                      ) : (
                        <span className="badge badge-live" style={{ fontSize: 9, padding: '1px 6px' }}>
                          <span className="live-dot" style={{ width: 4, height: 4 }} /> LIVE
                        </span>
                      )}
                      {tour && ev && (
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#f43f5e', textTransform: 'uppercase' }}>
                          {tour.name} · {ev.event_name}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{match.player1_name}</span>
                      <span style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                        {currentSet?.player1_score ?? 0}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>{match.player2_name}</span>
                      <span style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                        {currentSet?.player2_score ?? 0}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      {match.court} · Set {currentSet?.set_number ?? 1}
                      {match.sets.length > 1 && (
                        <span style={{ marginLeft: 8, color: 'rgba(255,255,255,0.4)' }}>
                          (Sets: {match.sets.map(s => `${s.player1_score}-${s.player2_score}`).join(', ')})
                        </span>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/broadcast?matchId=${match.id}`}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', background: 'linear-gradient(135deg, #f43f5e, #e11d48)', border: 'none' }}
                  >
                    📡 Go Live
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* How It Works */}
      <div className="glass-card" style={{ padding: 24, marginTop: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>How to Broadcast</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { step: '1', text: 'Click "Go Live" on any live match above', color: '#f43f5e' },
            { step: '2', text: 'Allow camera permission when prompted by your browser', color: '#f59e0b' },
            { step: '3', text: 'Your camera feed appears with the live score overlay — no extra app needed', color: '#10b981' },
            { step: '4', text: 'Open YouTube on your phone and start a live stream — it will capture your screen', color: '#2563eb' },
            { step: '5', text: 'Paste your YouTube stream URL in the Broadcaster Studio so fans can find it', color: '#3b82f6' },
          ].map(({ step, text, color }) => (
            <div key={step} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', background: `${color}20`, border: `1px solid ${color}40`,
                color, fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>{step}</div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: 2 }}>{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SystemAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [pendingRestores, setPendingRestores] = useState<any[]>([]);
  const [loginLogs, setLoginLogs] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [users, logs, restores, logins] = await Promise.all([
          dbService.getAllProfiles(),
          dbService.getAuditLogs(),
          dbService.getPendingRestoreRequests(),
          dbService.getLoginLogs ? dbService.getLoginLogs() : Promise.resolve([]),
        ]);
        setProfiles(users);
        setAuditLogs(logs);
        setPendingRestores(restores);
        setLoginLogs(logins);
      } catch (err) {
        console.error('Failed to load system admin data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="glass-card" style={{ padding: 48 }}>
        <ShuttlecockLoader message="Loading System Admin Dashboard..." />
      </div>
    );
  }

  // Count per role
  const totalUsers = profiles.length;
  const organizersCount = profiles.filter(u => u.roles.includes('admin')).length;
  const sysAdminsCount = profiles.filter(u => u.roles.includes('system_admin')).length;

  return (
    <SystemAdminDashboardView 
      totalUsers={totalUsers} 
      organizersCount={organizersCount} 
      sysAdminsCount={sysAdminsCount}
      pendingRestores={pendingRestores}
      auditLogs={auditLogs}
      loginLogs={loginLogs}
      profiles={profiles}
    />
  );
}

interface SystemAdminDashboardViewProps {
  totalUsers: number;
  organizersCount: number;
  sysAdminsCount: number;
  pendingRestores: any[];
  auditLogs: any[];
  loginLogs: any[];
  profiles: User[];
}

function SystemAdminDashboardView({
  totalUsers,
  organizersCount,
  sysAdminsCount,
  pendingRestores,
  auditLogs,
  loginLogs,
  profiles,
}: SystemAdminDashboardViewProps) {
  return (
    <div style={{ padding: '8px 4px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>System Admin Dashboard</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
          Overview of platform users, operational logs, active database backup routines, and administrative configurations.
        </p>
      </div>

      {/* Grid of stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 28 }}>
        {[
          { label: 'Total Accounts', val: totalUsers, icon: '👥', color: 'rgba(99, 102, 241, 0.1)', textCol: 'var(--accent)' },
          { label: 'Organizers', val: organizersCount, icon: '👑', color: 'rgba(236, 72, 153, 0.1)', textCol: '#ec4899' },
          { label: 'System Admins', val: sysAdminsCount, icon: '⚙️', color: 'rgba(168, 85, 247, 0.1)', textCol: '#a855f7' },
          { label: 'Active Restores', val: pendingRestores.length, icon: '🔄', color: 'rgba(239, 68, 68, 0.1)', textCol: '#ef4444' },
          { label: 'Recent Audit Logs', val: auditLogs.length, icon: '📋', color: 'rgba(16, 185, 129, 0.1)', textCol: 'var(--score-live)' },
        ].map(item => (
          <div key={item.label} className="glass-card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: item.color, color: item.textCol, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
              {item.icon}
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{item.val}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 28 }}>
        {/* Left Column: Quick Actions */}
        <div className="glass-card" style={{ flex: 1, minWidth: 320, padding: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Quick Administrative Actions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { href: '/dashboard/users', label: 'User Directory', desc: 'Toggle roles & complete profile audit', icon: '👤' },
              { href: '/dashboard/login-management', label: 'Login Logs', desc: 'Monitor system sign-ins', icon: '🔑' },
              { href: '/dashboard/audit-logs', label: 'System Audits', desc: 'Read rolling transaction history', icon: '📋' },
              { href: '/dashboard/backup-restore', label: 'DB Backups', desc: 'Export snapshots & approve restores', icon: '💾' },
            ].map(act => (
              <Link
                key={act.label}
                href={act.href}
                className="btn btn-secondary"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '16px 20px',
                  height: 'auto',
                  gap: 4,
                  textAlign: 'left',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-secondary)',
                  justifyContent: 'flex-start'
                }}
              >
                <div style={{ fontSize: 20, marginBottom: 4 }}>{act.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{act.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400, lineHeight: 1.3 }}>{act.desc}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* Right Column: Active Approvals */}
        <div className="glass-card" style={{ flex: 1, minWidth: 320, padding: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>⚠️</span> Pending Database Restores
          </h3>
          {pendingRestores.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '36px 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
              <p style={{ fontSize: 14, fontWeight: 500 }}>No database restores awaiting sign-off.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pendingRestores.slice(0, 3).map(req => (
                <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{req.requestedBy || req.requested_by}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      Expires: {new Date(req.expiresAt || req.expires_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <Link href="/dashboard/backup-restore" className="btn btn-primary" style={{ padding: '4px 10px', height: 'auto', fontSize: 11 }}>
                    Review
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row of logs preview */}
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        {/* Recent logins */}
        <div className="glass-card" style={{ flex: 1, minWidth: 320, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Recent Sign-ins</h3>
            <Link href="/dashboard/login-management" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
              View All
            </Link>
          </div>
          {loginLogs.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>No login logs available.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {loginLogs.slice(0, 4).map(log => {
                const prof = profiles.find(p => 
                  (p.id && log.userId && p.id.toLowerCase() === log.userId.toLowerCase()) ||
                  (p.email && log.email && p.email.toLowerCase() === log.email.toLowerCase()) ||
                  (p.email && log.userId && p.email.toLowerCase() === log.userId.toLowerCase()) ||
                  (p.name && log.userName && p.name.toLowerCase() === log.userName.toLowerCase())
                );
                const name = log.userName || prof?.name || (prof?.email ? prof.email.split('@')[0] : log.userId || 'Administrator');
                const email = log.email || prof?.email || (log.userId?.includes('@') ? log.userId : 'system@matchpoint.io');
                
                const rawTime = log.loginTime || log.login_time;
                const parsed = Date.parse(rawTime);
                const timeStr = !isNaN(parsed) 
                  ? new Date(parsed).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata', hour12: true }) + ' IST'
                  : 'Just now';
                const ipStr = log.ipAddress && log.ipAddress !== 'null' && log.ipAddress !== 'undefined' ? log.ipAddress : '127.0.0.1';
                const isSuccess = log.status === 'success';

                return (
                  <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {name} <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>({email})</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        IP: {ipStr} · {timeStr}
                      </div>
                    </div>
                    <span className={`badge ${isSuccess ? 'badge-live' : 'badge-pending'}`} style={{ fontSize: 9, flexShrink: 0 }}>
                      {isSuccess ? 'Success' : 'Failed'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Audit Logs */}
        <div className="glass-card" style={{ flex: 1, minWidth: 320, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Recent System Audits</h3>
            <Link href="/dashboard/audit-logs" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
              View All
            </Link>
          </div>
          {auditLogs.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>No audit logs available.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {auditLogs.slice(0, 4).map(log => {
                const rawTime = log.created_at || log.createdAt;
                const parsed = Date.parse(rawTime);
                const timeStr = !isNaN(parsed)
                  ? new Date(parsed).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata', hour12: true }) + ' IST'
                  : 'Recent';

                let plainDetail = log.details || 'Administrative modification';
                if (plainDetail.includes('Request:') && plainDetail.includes('Response Status:')) {
                  const m = plainDetail.match(/Request:\s*([A-Z]+)\s+([^\s,]+)/);
                  if (m) {
                    plainDetail = `${m[1]} operation on ${m[2].split('/').filter(Boolean).slice(-2).join(' #')}`;
                  }
                }

                return (
                  <div key={log.id} style={{ fontSize: 13 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{log.action}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{timeStr}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {log.user_name || 'System'} · {plainDetail}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


