'use client';

import React, { useState, useEffect } from 'react';
import { User, Match, Tournament, Registration, TournamentEvent } from '@/types';
import { getPlayers, getMatches, getTournaments, getPlayerRegistrations, getEvents, getAllTeams } from '@/lib/supabase-service';
import { IconUsers, IconTrophy, IconActivity, IconCalendar, IconClock, IconMapPin, IconX } from '@/components/icons';
import { useAuth } from '@/lib/auth-context';
import { useSport } from '@/lib/sport-context';
import { Team } from '@/types';

export default function PlayersDirectoryPage() {
  const { activeRole } = useAuth();
  const { activeSport } = useSport();
  const [players, setPlayers] = useState<User[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [events, setEvents] = useState<TournamentEvent[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [directorySportFilter, setDirectorySportFilter] = useState<string>('all');
  const [profileSportFilter, setProfileSportFilter] = useState<string>('all');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [viewingPlayer, setViewingPlayer] = useState<User | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [playersData, matchesData, toursData, evsData, teamsData] = await Promise.all([
          getPlayers(),
          getMatches(),
          getTournaments(),
          getEvents(),
          getAllTeams(),
        ]);
        setPlayers(playersData);
        setMatches(matchesData);
        setTournaments(toursData);
        setEvents(evsData);
        setTeams(teamsData);
        if (playersData.length > 0) {
          setSelectedPlayerId(playersData[0].id);
        }
      } catch (err) {
        console.error('Failed to load players directory:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const targetSport = directorySportFilter !== 'all' ? directorySportFilter : activeSport;

  const filteredPlayers = players.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (targetSport === 'all') return true;

    // 1. Check if the player has any match in the target sport
    const hasMatchInSport = matches.some(m => {
      const isPlayer = m.player1_id === p.id || m.player2_id === p.id;
      if (!isPlayer) return false;
      const tour = tournaments.find(tour => tour.id === m.tournament_id);
      return m.sport === targetSport || (tour && tour.sport === targetSport);
    });
    if (hasMatchInSport) return true;

    // 2. Check if the player belongs to a team registered in a targetSport tournament
    const belongsToTeamInSport = teams.some(t => {
      if (!t.players.includes(p.id) && !t.players.includes(p.name)) return false;
      const tour = tournaments.find(tour => tour.id === t.tournament_id);
      return tour && (tour.sport === targetSport || (targetSport === 'volleyball' && tour.id.includes('vpl')));
    });
    if (belongsToTeamInSport) return true;

    // 3. Fallback
    return targetSport === 'badminton';
  });

  // Auto-select first matching player when active sport or list changes
  useEffect(() => {
    if (filteredPlayers.length > 0) {
      if (!filteredPlayers.some(p => p.id === selectedPlayerId)) {
        setSelectedPlayerId(filteredPlayers[0].id);
      }
    } else {
      setSelectedPlayerId(null);
    }
  }, [activeSport, directorySportFilter, filteredPlayers, selectedPlayerId]);

  const selectedPlayer = players.find(p => p.id === selectedPlayerId);

  // Calculate statistics for selected player split/filtered by sport
  const playerMatches = matches.filter(m => {
    const isPlayer = m.player1_id === selectedPlayerId || m.player2_id === selectedPlayerId;
    if (!isPlayer) return false;
    const tour = tournaments.find(t => t.id === m.tournament_id);
    const mSport = m.sport || tour?.sport || 'badminton';
    if (profileSportFilter !== 'all') {
      return mSport === profileSportFilter;
    }
    return activeSport === 'all' || (tour && tour.sport === activeSport) || m.sport === activeSport;
  });

  // Calculate all sports played by selected player
  const playerSportsPlayed = Array.from(new Set(
    matches
      .filter(m => m.player1_id === selectedPlayerId || m.player2_id === selectedPlayerId)
      .map(m => {
        const tour = tournaments.find(t => t.id === m.tournament_id);
        return m.sport || tour?.sport || 'badminton';
      })
  ));

  // Matches in descending order (recent first)
  const sortedMatches = [...playerMatches].sort((a, b) => {
    const timeA = a.scheduled_time ? new Date(a.scheduled_time).getTime() : 0;
    const timeB = b.scheduled_time ? new Date(b.scheduled_time).getTime() : 0;
    return timeB - timeA;
  });

  const completedMatches = playerMatches.filter(m => m.status === 'completed');
  const wins = completedMatches.filter(m => m.winner_id === selectedPlayerId).length;
  const losses = completedMatches.length - wins;
  const winRate = completedMatches.length > 0 ? Math.round((wins / completedMatches.length) * 100) : 0;

  // Active registrations for selected player
  const playerRegistrations = selectedPlayerId 
    ? matches.flatMap(m => {
        const list: any[] = [];
        return list;
      }) // We can mock registrations or compute active ones
    : [];

  if (loading) {
    return (
      <div className="glass-card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
        <div className="animate-spin" style={{ display: 'inline-block', fontSize: 24, marginBottom: 12, animation: 'spin 2s linear infinite' }}>🔄</div>
        <p style={{ fontSize: 15, fontWeight: 500 }}>Loading players directory...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>Players Directory</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
          Search player profiles, active rosters, and track individual match histories
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'flex-start' }}>
        {/* Left Side: Search list */}
        <div className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, maxHeight: 'calc(100vh - 180px)', overflowY: 'auto' }}>
          <input
            className="input"
            placeholder="Search players by name or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />

          {/* Sport Filter Tabs */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'All', icon: '🌍' },
              { id: 'volleyball', label: 'Volleyball', icon: '🏐' },
              { id: 'badminton', label: 'Badminton', icon: '🏸' },
              { id: 'table_tennis', label: 'Table Tennis', icon: '🏓' },
              { id: 'squash', label: 'Squash', icon: '🎾' },
            ].map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => setDirectorySportFilter(s.id)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: 11,
                  fontWeight: 600,
                  border: '1px solid',
                  borderColor: (directorySportFilter === s.id || (directorySportFilter === 'all' && s.id === 'all')) ? 'var(--accent)' : 'var(--border)',
                  background: (directorySportFilter === s.id || (directorySportFilter === 'all' && s.id === 'all')) ? 'var(--accent-subtle)' : 'var(--bg-secondary)',
                  color: (directorySportFilter === s.id || (directorySportFilter === 'all' && s.id === 'all')) ? 'var(--accent)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span>{s.icon}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredPlayers.map(player => (
              <button
                key={player.id}
                onClick={() => setSelectedPlayerId(player.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: selectedPlayerId === player.id ? 'var(--accent-subtle)' : 'var(--bg-secondary)',
                  border: `1px solid ${selectedPlayerId === player.id ? 'var(--accent)' : 'var(--border)'}`,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all var(--transition-fast)'
                }}
              >
                {player.avatar ? (
                  <img src={player.avatar} alt={player.name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--accent), #3b82f6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0
                  }}>
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {player.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {player.email}
                  </div>
                </div>
              </button>
            ))}

            {filteredPlayers.length === 0 && (
              <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', padding: 12 }}>
                No players match your search.
              </p>
            )}
          </div>
        </div>

        {/* Right Side: Player Details */}
        {selectedPlayer ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Header / Stats row */}
            <div className="glass-card" style={{ padding: 24, display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center' }}>
              {selectedPlayer.avatar ? (
                <img src={selectedPlayer.avatar} alt={selectedPlayer.name} style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent), #3b82f6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, fontWeight: 700, color: '#fff'
                }}>
                  {selectedPlayer.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{ flex: 1 }}>
                {activeRole === 'admin' ? (
                  <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, padding: 0 }}>
                    <button
                      type="button"
                      onClick={() => setViewingPlayer(selectedPlayer)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        margin: 0,
                        fontWeight: 700,
                        color: 'var(--accent)',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontFamily: 'inherit',
                        fontSize: 'inherit'
                      }}
                    >
                      {selectedPlayer.name}
                    </button>
                  </h2>
                ) : (
                  <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{selectedPlayer.name}</h2>
                )}
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{selectedPlayer.email}</p>
                <div style={{ display: 'inline-flex', gap: 4, marginTop: 6 }}>
                  {selectedPlayer.roles.map(r => (
                    <span key={r} className="badge badge-accent" style={{ textTransform: 'capitalize', fontSize: 10 }}>{r}</span>
                  ))}
                </div>
              </div>

              {/* Sport Split Selector for Player Stats */}
              <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Filter Stats By Sport:
                </span>
                <div style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap' }}>
                  {['all', ...playerSportsPlayed].map(s => {
                    const label = s === 'all' ? 'All Disciplines' : s.replace('_', ' ').toUpperCase();
                    const icon = s === 'volleyball' ? '🏐' : s === 'badminton' ? '🏸' : s === 'table_tennis' ? '🏓' : s === 'squash' ? '🎾' : '🏅';
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setProfileSportFilter(s)}
                        style={{
                          padding: '3px 10px',
                          borderRadius: '16px',
                          fontSize: 11,
                          fontWeight: 700,
                          border: '1px solid',
                          borderColor: profileSportFilter === s ? 'var(--accent)' : 'var(--border)',
                          background: profileSportFilter === s ? 'var(--accent-subtle)' : 'var(--bg-secondary)',
                          color: profileSportFilter === s ? 'var(--accent)' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <span>{icon}</span>
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Stats Block */}
              <div style={{ display: 'flex', gap: 16, width: '100%', flexWrap: 'wrap' }}>
                <div className="stat-card" style={{ minWidth: 100, padding: '12px 16px' }}>
                  <div className="stat-value" style={{ fontSize: 20, color: 'var(--text-primary)' }}>{playerMatches.length}</div>
                  <div className="stat-label" style={{ fontSize: 10 }}>Matches</div>
                </div>
                <div className="stat-card" style={{ minWidth: 100, padding: '12px 16px' }}>
                  <div className="stat-value" style={{ fontSize: 20, color: 'var(--score-win)' }}>{wins}</div>
                  <div className="stat-label" style={{ fontSize: 10 }}>Wins</div>
                </div>
                <div className="stat-card" style={{ minWidth: 100, padding: '12px 16px' }}>
                  <div className="stat-value" style={{ fontSize: 20, color: 'var(--score-loss)' }}>{losses}</div>
                  <div className="stat-label" style={{ fontSize: 10 }}>Losses</div>
                </div>
                <div className="stat-card" style={{ minWidth: 100, padding: '12px 16px' }}>
                  <div className="stat-value" style={{ fontSize: 20, color: 'var(--accent)' }}>{winRate}%</div>
                  <div className="stat-label" style={{ fontSize: 10 }}>Win Ratio</div>
                </div>
              </div>
            </div>

            {/* Timeline matches in descending order */}
            <div className="glass-card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--accent)', display: 'inline-flex', alignItems: 'center' }}>
                  <IconActivity size={20} />
                </span>
                Match History Timeline (Recent First)
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {sortedMatches.map(match => {
                  const tournament = tournaments.find(t => t.id === match.tournament_id);
                  const eventObj = events.find(e => e.id === match.event_id);
                  const isOpponent = match.player1_id === selectedPlayerId ? match.player2_name : match.player1_name;
                  
                  let resultState: 'win' | 'loss' | 'pending' = 'pending';
                  if (match.status === 'completed') {
                    resultState = match.winner_id === selectedPlayerId ? 'win' : 'loss';
                  }

                  return (
                    <div key={match.id} style={{
                      padding: 16,
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 16,
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      {/* Left vertical ribbon highlighting win/loss status */}
                      <div style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 4,
                        background: resultState === 'win' ? 'var(--score-win)' : resultState === 'loss' ? 'var(--score-loss)' : 'var(--status-open)'
                      }} />

                      <div style={{ paddingLeft: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontWeight: 600, fontSize: 15 }}>
                            vs {isOpponent}
                          </span>
                          <span className={`badge badge-${match.status === 'running' ? 'live' : match.status === 'completed' ? (resultState === 'win' ? 'approved' : 'rejected') : 'open'}`}>
                            {match.status === 'completed' ? (resultState === 'win' ? 'WIN' : 'LOSS') : match.status}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span>{tournament?.name}</span>
                          <span>·</span>
                          <span>{eventObj?.event_name}</span>
                        </div>
                      </div>

                      {/* Right Side: Sets Score */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        {match.sets.length > 0 ? (
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            {match.sets.map((s, idx) => (
                              <div key={idx} style={{
                                padding: '4px 8px',
                                background: 'var(--bg-elevated)',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: 12,
                                fontFamily: 'var(--font-mono)',
                                fontWeight: s.is_complete ? 600 : 400
                              }}>
                                {match.player1_id === selectedPlayerId ? `${s.player1_score}-${s.player2_score}` : `${s.player2_score}-${s.player1_score}`}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>TBD</span>
                        )}

                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <IconClock size={11} />
                            {match.scheduled_time ? new Date(match.scheduled_time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                          </div>
                          {match.court && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{match.court}</div>}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {sortedMatches.length === 0 && (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                    No matches played by this player yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>Select a player to view their profile, stats, and match timeline.</p>
          </div>
        )}
      </div>

      {viewingPlayer && (
        <PlayerProfileModal player={viewingPlayer} onClose={() => setViewingPlayer(null)} />
      )}
    </div>
  );
}

function PlayerProfileModal({
  player,
  onClose
}: {
  player: User;
  onClose: () => void;
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 420, padding: 24, borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Player Profile</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><IconX size={18} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center', marginBottom: 24 }}>
          {player.avatar ? (
            <img src={player.avatar} alt={player.name} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), #3b82f6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 700, color: '#fff',
              boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.4)'
            }}>
              {player.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h3 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{player.name}</h3>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
              {player.roles.map(r => (
                <span key={r} className="badge badge-accent" style={{ textTransform: 'capitalize', fontSize: 10 }}>{r}</span>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, background: 'var(--bg-secondary)', padding: 18, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Email Address</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{player.email}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Phone Number</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{player.phone || 'Not provided'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Age</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{player.age !== undefined && player.age !== null ? `${player.age} years` : 'Not provided'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 4 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Gender</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{player.gender || 'Not provided'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
