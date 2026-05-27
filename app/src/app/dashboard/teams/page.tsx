'use client';

import React, { useState } from 'react';
import { Team, Tournament, User, Registration, Match } from '@/types';
import { IconPlus, IconX, IconUsers, IconTrophy, IconCheck } from '@/components/icons';
import {
  getTournaments,
  getTeamsByTournament,
  getRegistrationsByTournament,
  getPlayers,
  createTeam,
  updateTeamRoster,
  getMatchesByTournament,
} from '@/lib/supabase-service';
import { useEffect } from 'react';

export default function TeamsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [allPlayers, setAllPlayers] = useState<User[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState<string | null>(null); // team id

  // Load team tournaments on mount
  useEffect(() => {
    async function loadTournaments() {
      try {
        setLoading(true);
        const data = await getTournaments();
        const teamT = data.filter(t => t.type === 'team');
        setTournaments(teamT);
        if (teamT.length > 0) {
          setSelectedTournament(teamT[0].id);
        }
      } catch (err) {
        console.error('Failed to load tournaments:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTournaments();
  }, []);

  // Load tournament-specific teams and registrations
  useEffect(() => {
    if (!selectedTournament) return;
    async function loadTournamentData() {
      try {
        setLoading(true);
        const teamsData = await getTeamsByTournament(selectedTournament);
        const registrationsData = await getRegistrationsByTournament(selectedTournament);
        const playersData = await getPlayers();
        const matchesData = await getMatchesByTournament(selectedTournament);
        
        setTeams(teamsData);
        setRegistrations(registrationsData);
        setAllPlayers(playersData);
        setMatches(matchesData);
      } catch (err) {
        console.error('Failed to load tournament data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTournamentData();
  }, [selectedTournament]);

  const teamTournaments = tournaments;
  const tournament = tournaments.find(t => t.id === selectedTournament);
  const tournamentTeams = teams.filter(t => t.tournament_id === selectedTournament);

  // Players already assigned to a team
  const assignedPlayerIds = new Set(tournamentTeams.flatMap(t => t.players));

  // Find approved player IDs for this tournament from registrations
  const approvedPlayerIds = new Set(
    registrations
      .filter(r => r.status === 'approved')
      .map(r => r.player_id)
  );

  // Available players = players who are approved for this tournament AND not already assigned to a team
  const availablePlayers = allPlayers.filter(
    p => approvedPlayerIds.has(p.id) && !assignedPlayerIds.has(p.id)
  );

  const handleCreateTeam = async (name: string, color: string) => {
    const newTeam: Team = {
      id: `team${Date.now()}`,
      name,
      tournament_id: selectedTournament,
      logo_color: color,
      players: [],
    };
    try {
      await createTeam(newTeam);
      setTeams(prev => [...prev, newTeam]);
      setShowCreateModal(false);
    } catch (err) {
      console.error('Failed to create team:', err);
    }
  };

  const handleAssignPlayer = async (teamId: string, playerId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;
    if (team.players.includes(playerId)) return;
    
    // Enforce size limit
    const limit = tournament?.team_size_limit || 6;
    if (team.players.length >= limit) {
      alert(`Cannot add player. Roster size limit of ${limit} has been reached for this team.`);
      return;
    }
    
    const nextPlayers = [...team.players, playerId];
    try {
      await updateTeamRoster(teamId, nextPlayers, team.captain_id);
      setTeams(prev => prev.map(t =>
        t.id === teamId ? { ...t, players: nextPlayers } : t
      ));
    } catch (err) {
      console.error('Failed to assign player:', err);
    }
  };

  const handleRemovePlayer = async (teamId: string, playerId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;
    const nextPlayers = team.players.filter(p => p !== playerId);
    const nextCaptain = team.captain_id === playerId ? null : team.captain_id;
    try {
      await updateTeamRoster(teamId, nextPlayers, nextCaptain);
      setTeams(prev => prev.map(t =>
        t.id === teamId ? { ...t, players: nextPlayers, captain_id: nextCaptain || undefined } : t
      ));
    } catch (err) {
      console.error('Failed to remove player:', err);
    }
  };

  const handleSetCaptain = async (teamId: string, playerId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;
    try {
      await updateTeamRoster(teamId, team.players, playerId);
      setTeams(prev => prev.map(t =>
        t.id === teamId ? { ...t, captain_id: playerId } : t
      ));
    } catch (err) {
      console.error('Failed to set captain:', err);
    }
  };

  const getStandings = () => {
    const standingsMap: Record<string, {
      teamId: string;
      teamName: string;
      logoColor: string;
      played: number;
      won: number;
      lost: number;
      setsWon: number;
      setsLost: number;
      bonusPoints: number;
      points: number;
    }> = {};

    // Initialize all teams
    tournamentTeams.forEach(team => {
      standingsMap[team.id] = {
        teamId: team.id,
        teamName: team.name,
        logoColor: team.logo_color,
        played: 0,
        won: 0,
        lost: 0,
        setsWon: 0,
        setsLost: 0,
        bonusPoints: 0,
        points: 0,
      };
    });

    // We only process completed matches (ties) for this tournament
    const completedMatches = matches.filter(m => m.status === 'completed');

    completedMatches.forEach(match => {
      const t1 = standingsMap[match.player1_id];
      const t2 = standingsMap[match.player2_id];

      if (t1 && t2) {
        t1.played += 1;
        t2.played += 1;

        if (match.winner_id === match.player1_id) {
          t1.won += 1;
          t1.points += 3; // 3 points for win
          t2.lost += 1;
          t2.points += 1; // 1 point for loss
        } else if (match.winner_id === match.player2_id) {
          t2.won += 1;
          t2.points += 3;
          t1.lost += 1;
          t1.points += 1;
        }

        // Add sub-matches sets if present
        if (match.sub_matches && match.sub_matches.length > 0) {
          match.sub_matches.forEach(sub => {
            if (sub.status === 'completed' && sub.sets) {
              sub.sets.forEach(set => {
                if (set.is_complete) {
                  const setWinnerIsP1 = set.player1_score > set.player2_score;
                  if (setWinnerIsP1) {
                    t1.setsWon += 1;
                    t2.setsLost += 1;
                  } else {
                    t2.setsWon += 1;
                    t1.setsLost += 1;
                  }

                  // Bonus margin check
                  const margin = tournament?.bonus_point_margin || 5;
                  const diff = Math.abs(set.player1_score - set.player2_score);
                  if (diff >= margin) {
                    if (setWinnerIsP1) {
                      t1.bonusPoints += 1;
                      t1.points += 1; // Award bonus point
                    } else {
                      t2.bonusPoints += 1;
                      t2.points += 1;
                    }
                  }
                }
              });
            }
          });
        } else if (match.sets) {
          match.sets.forEach(set => {
            if (set.is_complete) {
              const setWinnerIsP1 = set.player1_score > set.player2_score;
              if (setWinnerIsP1) {
                t1.setsWon += 1;
                t2.setsLost += 1;
              } else {
                t2.setsWon += 1;
                t1.setsLost += 1;
              }

              const margin = tournament?.bonus_point_margin || 5;
              const diff = Math.abs(set.player1_score - set.player2_score);
              if (diff >= margin) {
                if (setWinnerIsP1) {
                  t1.bonusPoints += 1;
                  t1.points += 1;
                } else {
                  t2.bonusPoints += 1;
                  t2.points += 1;
                }
              }
            }
          });
        }
      }
    });

    // Sort by points (desc), won ties (desc), sets ratio (desc)
    return Object.values(standingsMap).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.won !== a.won) return b.won - a.won;
      const ratioA = a.setsLost === 0 ? a.setsWon : a.setsWon / a.setsLost;
      const ratioB = b.setsLost === 0 ? b.setsWon : b.setsWon / b.setsLost;
      return ratioB - ratioA;
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Team Management</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>Create teams and assign players</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)} disabled={!selectedTournament}>
          <IconPlus size={16} /> Create Team
        </button>
      </div>

      {/* Tournament Selector */}
      <div style={{ marginBottom: 24 }}>
        <select
          className="input"
          style={{ width: 'auto', minWidth: 300 }}
          value={selectedTournament}
          onChange={e => setSelectedTournament(e.target.value)}
        >
          {teamTournaments.length === 0 && <option value="">No team tournaments</option>}
          {teamTournaments.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        {teamTournaments.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
            Create a tournament with type &quot;Team&quot; first to manage teams.
          </p>
        )}
      </div>

      {loading ? (
        <div className="glass-card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div className="animate-spin" style={{ display: 'inline-block', fontSize: 24, marginBottom: 12, animation: 'spin 2s linear infinite' }}>🔄</div>
          <p style={{ fontSize: 15, fontWeight: 500 }}>Loading Rosters & Teams...</p>
        </div>
      ) : tournament ? (
        <>
          {/* Summary */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
            <div className="stat-card" style={{ flex: 1 }}>
              <div className="stat-value" style={{ color: 'var(--accent)' }}>{tournamentTeams.length}</div>
              <div className="stat-label">Teams</div>
            </div>
            <div className="stat-card" style={{ flex: 1 }}>
              <div className="stat-value" style={{ color: 'var(--score-live)' }}>{assignedPlayerIds.size}</div>
              <div className="stat-label">Players Assigned</div>
            </div>
            <div className="stat-card" style={{ flex: 1 }}>
              <div className="stat-value" style={{ color: '#a855f7' }}>{availablePlayers.length}</div>
              <div className="stat-label">Available</div>
            </div>
          </div>

          {/* Teams Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            {tournamentTeams.map(team => {
              // Deduplicate player IDs to prevent duplicate keys
              const uniquePlayerIds = [...new Set(team.players)];
              const teamPlayers = uniquePlayerIds.map(pid => allPlayers.find(u => u.id === pid)).filter(Boolean);
              const limit = tournament?.team_size_limit || 6;
              const isFull = teamPlayers.length >= limit;
              
              return (
                <div key={team.id} className="glass-card" style={{ overflow: 'hidden' }}>
                  {/* Team Header */}
                  <div style={{
                    padding: '16px 20px',
                    background: `${team.logo_color}20`,
                    borderBottom: `2px solid ${team.logo_color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 'var(--radius-md)',
                        background: team.logo_color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18, fontWeight: 700, color: '#fff',
                      }}>
                        {team.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 600 }}>{team.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {teamPlayers.length} / {limit} player{teamPlayers.length !== 1 ? 's' : ''}
                          {team.captain_id && ` · Captain: ${allPlayers.find(u => u.id === team.captain_id)?.name || 'Unknown'}`}
                        </div>
                      </div>
                    </div>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setShowAssignModal(team.id)}
                      disabled={isFull}
                      title={isFull ? "Roster limit reached" : "Add Player"}
                    >
                      <IconPlus size={14} /> Add
                    </button>
                  </div>

                  {/* Player Roster */}
                  <div style={{ padding: '12px 20px' }}>
                    {teamPlayers.length === 0 ? (
                      <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                        No players assigned yet
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {teamPlayers.map(player => {
                          if (!player) return null;
                          const isCaptain = team.captain_id === player.id;
                          return (
                            <div key={player.id} style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 10px',
                              borderRadius: 'var(--radius-sm)',
                              background: isCaptain ? 'var(--accent-subtle)' : 'transparent',
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                  width: 28, height: 28, borderRadius: '50%',
                                  background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0,
                                }}>
                                  {player.name.charAt(0)}
                                </div>
                                <div>
                                  <div style={{ fontSize: 13, fontWeight: 500 }}>
                                    {player.name}
                                    {isCaptain && <span style={{ color: 'var(--score-point)', marginLeft: 6, fontSize: 11 }}>👑 Captain</span>}
                                  </div>
                                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{player.email}</div>
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: 4 }}>
                                {!isCaptain && (
                                  <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => handleSetCaptain(team.id, player.id)}
                                    title="Set as captain"
                                    style={{ fontSize: 11, padding: '2px 6px' }}
                                  >
                                    👑
                                  </button>
                                )}
                                <button
                                  className="btn btn-ghost btn-sm"
                                  onClick={() => handleRemovePlayer(team.id, player.id)}
                                  title="Remove from team"
                                  style={{ color: 'var(--score-loss)', fontSize: 11, padding: '2px 6px' }}
                                >
                                  <IconX size={12} />
                                </button>
                              </div>
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

          {tournamentTeams.length === 0 && (
            <div className="empty-state" style={{ marginTop: 40 }}>
              <div className="empty-state-icon">🏸</div>
              <p style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>No teams yet</p>
              <p style={{ fontSize: 14 }}>Create your first team for this tournament</p>
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowCreateModal(true)}>
                <IconPlus size={16} /> Create Team
              </button>
            </div>
          )}

          {/* Standings Table Section */}
          <div style={{ marginTop: 40, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  📊 League Table Standings
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Leaderboard stats (Tie Win = 3pts, Tie Loss = 1pt, Bonus = +1pt per set won by {tournament?.bonus_point_margin || 5}+ pts)
                </p>
              </div>
            </div>

            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    <th style={{ padding: '12px 20px', width: 80 }}>Rank</th>
                    <th style={{ padding: '12px 20px' }}>Team</th>
                    <th style={{ padding: '12px 20px', textAlign: 'center' }}>Played</th>
                    <th style={{ padding: '12px 20px', textAlign: 'center' }}>Won</th>
                    <th style={{ padding: '12px 20px', textAlign: 'center' }}>Lost</th>
                    <th style={{ padding: '12px 20px', textAlign: 'center' }}>Sets Ratio (W-L)</th>
                    <th style={{ padding: '12px 20px', textAlign: 'center', color: 'var(--accent)' }}>Bonus Pts</th>
                    <th style={{ padding: '12px 20px', textAlign: 'center', fontWeight: 700, color: 'var(--text-primary)' }}>Total Points</th>
                  </tr>
                </thead>
                <tbody>
                  {getStandings().map((row, idx) => (
                    <tr key={row.teamId} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s', background: idx === 0 && row.played > 0 ? 'rgba(99, 102, 241, 0.05)' : 'transparent' }}>
                      <td style={{ padding: '14px 20px', fontWeight: 700 }}>
                        {idx === 0 ? '🏆 1' : idx + 1}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ width: 12, height: 12, borderRadius: '50%', background: row.logoColor, display: 'inline-block' }} />
                          <span style={{ fontWeight: 600 }}>{row.teamName}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'center' }}>{row.played}</td>
                      <td style={{ padding: '14px 20px', textAlign: 'center', color: 'var(--score-live)', fontWeight: 600 }}>{row.won}</td>
                      <td style={{ padding: '14px 20px', textAlign: 'center', color: 'var(--score-loss)' }}>{row.lost}</td>
                      <td style={{ padding: '14px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        {row.setsWon} - {row.setsLost}
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'center', color: 'var(--accent)', fontWeight: 600 }}>
                        +{row.bonusPoints}
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'center', fontWeight: 700, fontSize: 16 }}>
                        {row.points}
                      </td>
                    </tr>
                  ))}
                  {tournamentTeams.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                        No standings available. Add teams to see calculations.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}

      {/* Create Team Modal */}
      {showCreateModal && (
        <CreateTeamModal onClose={() => setShowCreateModal(false)} onCreate={handleCreateTeam} />
      )}

      {/* Assign Player Modal */}
      {showAssignModal && (
        <AssignPlayerModal
          teamId={showAssignModal}
          teamName={teams.find(t => t.id === showAssignModal)?.name || ''}
          availablePlayers={availablePlayers}
          onClose={() => setShowAssignModal(null)}
          onAssign={handleAssignPlayer}
        />
      )}
    </div>
  );
}

function CreateTeamModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string, color: string) => void }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');

  const colors = ['#6366f1', '#ef4444', '#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Create Team</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><IconX size={18} /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onCreate(name, color); }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="input-group">
            <label className="input-label" htmlFor="team-name">Team Name *</label>
            <input id="team-name" className="input" placeholder="e.g., Thunder Smashers" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="input-group">
            <label className="input-label">Team Color</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {colors.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{
                    width: 36, height: 36, borderRadius: 'var(--radius-md)',
                    background: c,
                    border: color === c ? '3px solid var(--text-primary)' : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                />
              ))}
            </div>
          </div>
          {/* Preview */}
          <div style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: `${color}15`,
            border: `2px solid ${color}`,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 'var(--radius-md)',
              background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 700, color: '#fff',
            }}>
              {name ? name.charAt(0).toUpperCase() : '?'}
            </div>
            <span style={{ fontWeight: 600 }}>{name || 'Team Name'}</span>
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={!name}>
            Create Team
          </button>
        </form>
      </div>
    </div>
  );
}

function AssignPlayerModal({
  teamId,
  teamName,
  availablePlayers,
  onClose,
  onAssign,
}: {
  teamId: string;
  teamName: string;
  availablePlayers: { id: string; name: string; email: string }[];
  onClose: () => void;
  onAssign: (teamId: string, playerId: string) => void;
}) {
  const [search, setSearch] = useState('');

  const filtered = availablePlayers.filter(
    p => p.name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>Assign Players</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>to {teamName}</p>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><IconX size={18} /></button>
        </div>

        <input
          className="input"
          placeholder="Search players..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginBottom: 16 }}
        />

        <div style={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              No available players
            </div>
          ) : (
            filtered.map(player => (
              <div key={player.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700, color: '#fff',
                  }}>
                    {player.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{player.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{player.email}</div>
                  </div>
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => { onAssign(teamId, player.id); }}
                >
                  <IconPlus size={14} /> Add
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
