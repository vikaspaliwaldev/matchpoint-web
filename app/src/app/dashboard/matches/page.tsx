'use client';

import React, { useState, useEffect } from 'react';
import {
  getMatches,
  getTournaments,
  getEventsByTournament,
  getUmpireUsers,
  assignUmpireToMatch,
  resetMatchByAdmin
} from '@/lib/supabase-service';
import { Match, MatchStatus, User, Tournament, TournamentEvent } from '@/types';
import { IconActivity, IconX, IconCheck, IconUsers } from '@/components/icons';
import MatchMediaModal from '@/components/MatchMediaModal';
import MatchSummaryModal from '@/components/MatchSummaryModal';
import { useAuth } from '@/lib/auth-context';
import { useSport } from '@/lib/sport-context';
import { getUniqueMatchId } from '@/lib/match-numbering';

export default function MatchesPage() {
  const { user, activeRole } = useAuth();
  const { activeSport } = useSport();
  const [matchSource, setMatchSource] = useState<'tournament' | 'adhoc'>('tournament');
  const [selectedSummaryMatch, setSelectedSummaryMatch] = useState<Match | null>(null);
  const [filterStatus, setFilterStatus] = useState<MatchStatus | 'all'>('all');
  const [matches, setMatches] = useState<Match[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [events, setEvents] = useState<TournamentEvent[]>([]);
  const [umpires, setUmpires] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUmpireModal, setShowUmpireModal] = useState<string | null>(null); // match id
  const [selectedMediaMatch, setSelectedMediaMatch] = useState<Match | null>(null);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('all');
  const [tournamentSearchQuery, setTournamentSearchQuery] = useState<string>('');
  const [showTournamentSuggestions, setShowTournamentSuggestions] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, selectedTournamentId, matchSource]);

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

  let filtered = matches.filter(m => {
    const tour = tournaments.find(t => t.id === m.tournament_id);
    const mSport = m.sport || tour?.sport || 'badminton';
    const matchesSport = activeSport === 'all' || mSport === activeSport;
    if (!matchesSport) return false;

    const isAdhoc = m.is_adhoc || !m.tournament_id;
    if (matchSource === 'adhoc') {
      return isAdhoc;
    } else {
      return !isAdhoc;
    }
  });

  if (filterStatus !== 'all') {
    filtered = filtered.filter(m => m.status === filterStatus);
  }

  if (matchSource === 'tournament' && selectedTournamentId !== 'all') {
    filtered = filtered.filter(m => m.tournament_id === selectedTournamentId);
  }

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedMatches = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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

  const handleResetMatch = async (match: Match) => {
    const confirmPrompt = `Are you sure you want to completely RESET this match?\n\n` +
      `Match: ${match.player1_name} vs ${match.player2_name}\n` +
      `Current Status: ${match.status.toUpperCase()}\n\n` +
      `This will revert status to SCHEDULED, clear all sets/scores, remove any declared winner, and clear duration.`;
    
    if (!window.confirm(confirmPrompt)) return;

    try {
      await resetMatchByAdmin(match.id, user ? { id: user.id, name: user.name } : null);
      setMatches(prev => prev.map(m => {
        if (m.id !== match.id) return m;
        return {
          ...m,
          status: 'scheduled',
          winner_id: undefined,
          actual_start_time: undefined,
          actual_end_time: undefined,
          duration_seconds: 0,
          sport_metadata: {},
          sets: [{ set_number: 1, player1_score: 0, player2_score: 0, is_complete: false }],
        };
      }));
      alert('Match successfully reset to scheduled.');
    } catch (err) {
      console.error('Failed to reset match:', err);
      alert('Failed to reset match. Please check console.');
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
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Matches</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
            {matchSource === 'tournament' ? 'All matches across tournaments' : 'All adhoc matches (friendly/practice)'}
          </p>
        </div>

        {/* Primary Match Source Switcher Tab Group */}
        <div className="tab-group" style={{ display: 'inline-flex' }}>
          <button
            className={`tab ${matchSource === 'tournament' ? 'active' : ''}`}
            onClick={() => {
              setMatchSource('tournament');
              setSelectedTournamentId('all');
              setTournamentSearchQuery('');
            }}
          >
            🏆 Tournament Matches
          </button>
          <button
            className={`tab ${matchSource === 'adhoc' ? 'active' : ''}`}
            onClick={() => {
              setMatchSource('adhoc');
              setSelectedTournamentId('all');
              setTournamentSearchQuery('');
            }}
          >
            🏸 Adhoc Matches
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="tab-group" style={{ display: 'inline-flex' }}>
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

        {/* Searchable Tournament Filter */}
        {matchSource === 'tournament' && (
          <div style={{ position: 'relative', width: 280 }}>
            <input
              className="input"
              placeholder="🔍 Filter by Tournament..."
              value={tournamentSearchQuery}
              onChange={e => {
                setTournamentSearchQuery(e.target.value);
                setShowTournamentSuggestions(true);
                if (selectedTournamentId !== 'all') {
                  setSelectedTournamentId('all');
                }
              }}
              onFocus={() => setShowTournamentSuggestions(true)}
              onBlur={() => setTimeout(() => setShowTournamentSuggestions(false), 200)}
              style={{ paddingRight: 32 }}
            />
            {selectedTournamentId !== 'all' || tournamentSearchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedTournamentId('all');
                  setTournamentSearchQuery('');
                }}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            ) : (
              <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
                ▼
              </span>
            )}

            {showTournamentSuggestions && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 50,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                maxHeight: 200,
                overflowY: 'auto',
                marginTop: 4,
              }}>
                <div
                  style={{ padding: '8px 12px', fontSize: 13, cursor: 'pointer', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                  onClick={() => {
                    setSelectedTournamentId('all');
                    setTournamentSearchQuery('');
                    setShowTournamentSuggestions(false);
                  }}
                >
                  -- All Tournaments --
                </div>
                {tournaments
                  .filter(t => activeSport === 'all' || t.sport === activeSport)
                  .filter(t => t.name.toLowerCase().includes(tournamentSearchQuery.toLowerCase()))
                  .map(t => (
                    <div
                      key={t.id}
                      style={{
                        padding: '8px 12px',
                        fontSize: 13,
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--border)',
                        color: t.id === selectedTournamentId ? 'var(--accent)' : 'var(--text-primary)',
                        background: t.id === selectedTournamentId ? 'var(--accent-subtle)' : 'transparent',
                      }}
                      onClick={() => {
                        setSelectedTournamentId(t.id);
                        setTournamentSearchQuery(t.name);
                        setShowTournamentSuggestions(false);
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-subtle)'}
                      onMouseLeave={e => e.currentTarget.style.background = t.id === selectedTournamentId ? 'var(--accent-subtle)' : 'transparent'}
                    >
                      🏆 {t.name}
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
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
            {paginatedMatches.map(match => {
              const tournament = tournaments.find(t => t.id === match.tournament_id);
              const event = events.find(e => e.id === match.event_id);
              return (
                <tr key={match.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 800, background: 'rgba(59, 130, 246, 0.15)', color: '#93C5FD', padding: '1px 5px', borderRadius: 4 }}>
                        {getUniqueMatchId(match)}
                      </span>
                    </div>
                    <div style={{ fontWeight: 500 }}>{match.player1_name}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>vs {match.player2_name}</div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                    {tournament?.name || (match.is_adhoc ? 'Adhoc Match' : '—')}
                  </td>
                  <td>
                    <span className="badge badge-accent">
                      {event?.category || (match.is_adhoc ? (match.adhoc_type ? match.adhoc_type.toUpperCase() : 'ADHOC') : '—')}
                    </span>
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
                        {match.status !== 'completed' && (
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
                    {match.status === 'paused' ? (
                      <span className="badge badge-paused" style={{ background: '#f59e0b', color: '#fff', fontWeight: 700 }}>
                        ⏸ Paused
                      </span>
                    ) : (
                      <span className={`badge badge-${match.status === 'running' ? 'live' : match.status === 'completed' ? 'completed' : 'open'}`}>
                        {match.status === 'running' && <span className="live-dot" style={{ width: 5, height: 5 }} />}
                        {match.status}
                      </span>
                    )}
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {match.scheduled_time
                      ? new Date(match.scheduled_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
                      : '—'
                    }
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {match.status !== 'completed' && !match.umpire_id && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setShowUmpireModal(match.id)}
                        >
                          <IconUsers size={14} /> Assign Umpire
                        </button>
                      )}
                      {match.status !== 'completed' && match.umpire_id && (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setShowUmpireModal(match.id)}
                          style={{ fontSize: 12 }}
                        >
                          Change
                        </button>
                      )}
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedMediaMatch(match)}
                        style={{ gap: 4, display: 'inline-flex', alignItems: 'center' }}
                      >
                        🎥 Media
                      </button>
                      {activeRole === 'admin' && match.status === 'completed' && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => setSelectedSummaryMatch(match)}
                          style={{ gap: 4, display: 'inline-flex', alignItems: 'center' }}
                        >
                          📄 Summary
                        </button>
                      )}
                      {activeRole === 'admin' && (match.status === 'completed' || match.status === 'running' || match.status === 'paused') && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleResetMatch(match)}
                          title="Reset match back to scheduled state, clearing scores and winner"
                          style={{
                            gap: 4,
                            display: 'inline-flex',
                            alignItems: 'center',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#ef4444'
                          }}
                        >
                          🔄 Reset
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalItems > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} entries
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: 13 }}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
              .map((page, idx, arr) => {
                const showEllipsisBefore = idx > 0 && page - arr[idx - 1] > 1;
                return (
                  <React.Fragment key={page}>
                    {showEllipsisBefore && <span style={{ padding: '6px 8px', color: 'var(--text-muted)' }}>...</span>}
                    <button
                      onClick={() => setCurrentPage(page)}
                      className={`btn ${currentPage === page ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '6px 12px', fontSize: 13, minWidth: 36 }}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                );
              })
            }
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: 13 }}
            >
              Next
            </button>
          </div>
        </div>
      )}

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

      {/* Match Media Modal */}
      {selectedMediaMatch && (
        <MatchMediaModal
          match={selectedMediaMatch}
          onClose={() => setSelectedMediaMatch(null)}
        />
      )}

      {/* Match Summary Modal */}
      {selectedSummaryMatch && (
        <MatchSummaryModal
          match={selectedSummaryMatch}
          tournament={tournaments.find(t => t.id === selectedSummaryMatch.tournament_id)}
          event={events.find(e => e.id === selectedSummaryMatch.event_id)}
          onClose={() => setSelectedSummaryMatch(null)}
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
