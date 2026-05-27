'use client';

import React, { useState } from 'react';
import {
  getMatches,
  getTournaments,
  getEventsByTournament,
  getUmpireUsers,
  assignUmpireToMatch
} from '@/lib/supabase-service';
import { Match, MatchStatus, User, Tournament, TournamentEvent } from '@/types';
import { IconActivity, IconX, IconCheck, IconUsers } from '@/components/icons';
import { useEffect } from 'react';

export default function MatchesPage() {
  const [filterStatus, setFilterStatus] = useState<MatchStatus | 'all'>('all');
  const [matches, setMatches] = useState<Match[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [events, setEvents] = useState<TournamentEvent[]>([]);
  const [umpires, setUmpires] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUmpireModal, setShowUmpireModal] = useState<string | null>(null); // match id

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const matchesData = await getMatches();
        const tournamentsData = await getTournaments();
        const umpiresData = await getUmpireUsers();
        
        const allEvents: TournamentEvent[] = [];
        await Promise.all(
          tournamentsData.map(async t => {
            const evs = await getEventsByTournament(t.id);
            allEvents.push(...evs);
          })
        );
        
        setMatches(matchesData);
        setTournaments(tournamentsData);
        setEvents(allEvents);
        setUmpires(umpiresData);
      } catch (err) {
        console.error('Failed to load matches data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = filterStatus === 'all' ? matches : matches.filter(m => m.status === filterStatus);

  const handleAssignUmpire = async (matchId: string, umpire: User) => {
    try {
      await assignUmpireToMatch(matchId, umpire.id, umpire.name);
      setMatches(prev => prev.map(m =>
        m.id === matchId ? { ...m, umpire_id: umpire.id, umpire_name: umpire.name } : m
      ));
      setShowUmpireModal(null);
    } catch (err) {
      console.error('Failed to assign umpire:', err);
    }
  };

  const handleRemoveUmpire = async (matchId: string) => {
    try {
      await assignUmpireToMatch(matchId, null, null);
      setMatches(prev => prev.map(m =>
        m.id === matchId ? { ...m, umpire_id: undefined, umpire_name: undefined } : m
      ));
    } catch (err) {
      console.error('Failed to remove umpire:', err);
    }
  };

  if (loading) {
    return (
      <div>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Matches</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>All matches across tournaments</p>
        </div>
        <div className="glass-card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div className="animate-spin" style={{ display: 'inline-block', fontSize: 24, marginBottom: 12, animation: 'spin 2s linear infinite' }}>🔄</div>
          <p style={{ fontSize: 15, fontWeight: 500 }}>Loading Matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>Matches</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>All matches across tournaments</p>
      </div>

      <div className="tab-group" style={{ marginBottom: 24, display: 'inline-flex' }}>
        {(['all', 'scheduled', 'running', 'completed'] as const).map(status => (
          <button
            key={status}
            className={`tab ${filterStatus === status ? 'active' : ''}`}
            onClick={() => setFilterStatus(status)}
            style={{ textTransform: 'capitalize' }}
          >
            {status === 'running' ? '🔴 Live' : status}
          </button>
        ))}
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Match</th>
              <th>Tournament</th>
              <th>Event</th>
              <th>Court</th>
              <th>Score</th>
              <th>Umpire</th>
              <th>Status</th>
              <th>Scheduled</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(match => {
              const tournament = tournaments.find(t => t.id === match.tournament_id);
              const event = events.find(e => e.id === match.event_id);
              return (
                <tr key={match.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{match.player1_name}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>vs {match.player2_name}</div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{tournament?.name}</td>
                  <td>
                    <span className="badge badge-accent">{event?.category}</span>
                  </td>
                  <td style={{ fontSize: 13 }}>{match.court || '—'}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13 }}>
                    {match.sets.length > 0
                      ? match.sets.map(s => `${s.player1_score}-${s.player2_score}`).join(', ')
                      : '—'
                    }
                  </td>
                  <td>
                    {match.umpire_name ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: '50%',
                          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0,
                        }}>
                          {match.umpire_name.charAt(0)}
                        </div>
                        <span style={{ fontSize: 13 }}>{match.umpire_name}</span>
                        {match.status === 'scheduled' && (
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '0 4px', color: 'var(--text-muted)' }}
                            onClick={() => handleRemoveUmpire(match.id)}
                            title="Remove umpire"
                          >
                            <IconX size={12} />
                          </button>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>—</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge badge-${match.status === 'running' ? 'live' : match.status === 'completed' ? 'completed' : 'open'}`}>
                      {match.status === 'running' && <span className="live-dot" style={{ width: 5, height: 5 }} />}
                      {match.status}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {match.scheduled_time
                      ? new Date(match.scheduled_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
                      : '—'
                    }
                  </td>
                  <td>
                    {match.status === 'scheduled' && !match.umpire_id && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setShowUmpireModal(match.id)}
                      >
                        <IconUsers size={14} /> Assign Umpire
                      </button>
                    )}
                    {match.status === 'scheduled' && match.umpire_id && (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setShowUmpireModal(match.id)}
                        style={{ fontSize: 12 }}
                      >
                        Change
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <div className="empty-state-icon">🏸</div>
          <p>No matches found</p>
        </div>
      )}

      {/* Assign Umpire Modal */}
      {showUmpireModal && (
        <AssignUmpireModal
          matchId={showUmpireModal}
          match={matches.find(m => m.id === showUmpireModal)!}
          umpires={umpires}
          onClose={() => setShowUmpireModal(null)}
          onAssign={handleAssignUmpire}
        />
      )}
    </div>
  );
}

function AssignUmpireModal({
  matchId,
  match,
  umpires,
  onClose,
  onAssign,
}: {
  matchId: string;
  match: Match;
  umpires: User[];
  onClose: () => void;
  onAssign: (matchId: string, umpire: User) => void;
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>Assign Umpire</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {match.player1_name} vs {match.player2_name} · {match.court}
            </p>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><IconX size={18} /></button>
        </div>

        {umpires.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
            No umpires registered. Users with the umpire role will appear here.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {umpires.map(umpire => {
              const isCurrentlyAssigned = match.umpire_id === umpire.id;
              return (
                <div key={umpire.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: isCurrentlyAssigned ? 'var(--accent-subtle)' : 'var(--bg-secondary)',
                  border: `1px solid ${isCurrentlyAssigned ? 'var(--accent)' : 'var(--border)'}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 700, color: '#fff',
                    }}>
                      {umpire.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{umpire.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{umpire.email}</div>
                    </div>
                  </div>
                  {isCurrentlyAssigned ? (
                    <span className="badge badge-approved">
                      <IconCheck size={12} /> Assigned
                    </span>
                  ) : (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => onAssign(matchId, umpire)}
                    >
                      Assign
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
