'use client';

import React, { useState } from 'react';
import { Team, Tournament, User, Registration, Match } from '@/types';
import { IconPlus, IconX, IconUsers, IconTrophy, IconCheck, IconEdit } from '@/components/icons';
import { useAuth } from '@/lib/auth-context';
import { useSport } from '@/lib/sport-context';
import {
  getTournaments,
  getTeamsByTournament,
  getRegistrationsByTournament,
  getPlayers,
  createTeam,
  updateTeam,
  updateTeamRoster,
  getMatchesByTournament,
} from '@/lib/supabase-service';
import { calculateVolleyballStandings } from '@/lib/sports-rules';
import { getTeamLogo } from '@/lib/team-logos';
import { useEffect } from 'react';

export default function TeamsPage() {
  const { user } = useAuth();
  const { activeSport } = useSport();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [allPlayers, setAllPlayers] = useState<User[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState<string | null>(null); // team id
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTournament]);

  // Load team tournaments on mount
  useEffect(() => {
    async function loadTournaments() {
      try {
        setLoading(true);
        const data = await getTournaments();
        const teamT = data.filter(t => t.type === 'team');
        setTournaments(teamT);
      } catch (err) {
        console.error('Failed to load tournaments:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTournaments();
  }, []);

  // Sync selectedTournament when activeSport or tournaments list updates
  useEffect(() => {
    const matched = tournaments.filter(t => activeSport === 'all' || t.sport === activeSport);
    if (matched.length > 0) {
      if (!matched.some(t => t.id === selectedTournament)) {
        setSelectedTournament(matched[0].id);
      }
    } else {
      setSelectedTournament('');
    }
  }, [activeSport, tournaments, selectedTournament]);

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

  const teamTournaments = tournaments.filter(t => activeSport === 'all' || t.sport === activeSport);
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

  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const handleCreateTeam = async (name: string, color: string, logoUrl?: string) => {
    const newTeam: Team = {
      id: `team${Date.now()}`,
      name,
      tournament_id: selectedTournament,
      logo_color: color,
      logo_url: logoUrl,
      players: [],
    };
    try {
      await createTeam(newTeam, user);
      setTeams(prev => [...prev, newTeam]);
      setShowCreateModal(false);
    } catch (err) {
      console.error('Failed to create team:', err);
    }
  };

  const handleUpdateTeam = async (teamId: string, name: string, color: string, logoUrl?: string) => {
    const existing = teams.find(t => t.id === teamId);
    if (!existing) return;
    const updated: Team = {
      ...existing,
      name,
      logo_color: color,
      logo_url: logoUrl || existing.logo_url,
    };
    try {
      await updateTeam(updated, user);
      setTeams(prev => prev.map(t => t.id === teamId ? updated : t));
      setEditingTeam(null);
    } catch (err) {
      console.error('Failed to update team:', err);
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
      await updateTeamRoster(teamId, nextPlayers, team.captain_id, user);
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
      await updateTeamRoster(teamId, nextPlayers, nextCaptain, user);
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
      await updateTeamRoster(teamId, team.players, playerId, user);
      setTeams(prev => prev.map(t =>
        t.id === teamId ? { ...t, captain_id: playerId } : t
      ));
    } catch (err) {
      console.error('Failed to set captain:', err);
    }
  };

  const getStandings = () => {
    if (tournament?.sport === 'volleyball') {
      const teamsList = tournamentTeams.map(t => ({ id: t.id, name: t.name }));
      const vbStandings = calculateVolleyballStandings(teamsList, matches as any);
      return vbStandings.map(s => {
        const teamObj = tournamentTeams.find(t => t.id === s.teamId || t.name.trim().toLowerCase() === s.teamName.trim().toLowerCase());
        return {
          teamId: s.teamId,
          teamName: s.teamName,
          logoColor: teamObj?.logo_color || '#3b82f6',
          played: s.played,
          won: s.won,
          lost: s.lost,
          setsWon: s.setsWon,
          setsLost: s.setsLost,
          setRatio: s.setRatio,
          pointQuotient: s.pointQuotient,
          bonusPoints: 0,
          points: s.points,
        };
      });
    }

    const standingsMap: Record<string, {
      teamId: string;
      teamName: string;
      logoColor: string;
      played: number;
      won: number;
      lost: number;
      setsWon: number;
      setsLost: number;
      setRatio: number;
      pointQuotient: number;
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
        setRatio: 0,
        pointQuotient: 0,
        bonusPoints: 0,
        points: 0,
      };
    });

    const nameToIdMap: Record<string, string> = {};
    tournamentTeams.forEach(t => {
      nameToIdMap[t.name.trim().toLowerCase()] = t.id;
    });

    const resolveTeam = (idOrName: string | undefined | null) => {
      if (!idOrName) return undefined;
      if (standingsMap[idOrName]) return standingsMap[idOrName];
      const mappedId = nameToIdMap[idOrName.trim().toLowerCase()];
      if (mappedId && standingsMap[mappedId]) return standingsMap[mappedId];
      return undefined;
    };

    // We only process completed matches (ties) for this tournament
    const completedMatches = matches.filter(m => m.status === 'completed' || !!m.winner_id);

    completedMatches.forEach(match => {
      const t1 = resolveTeam(match.player1_id) || resolveTeam(match.player1_name);
      const t2 = resolveTeam(match.player2_id) || resolveTeam(match.player2_name);

      if (t1 && t2) {
        t1.played += 1;
        t2.played += 1;

        const p1Won = match.winner_id === match.player1_id || match.winner_id === t1.teamId;
        const p2Won = match.winner_id === match.player2_id || match.winner_id === t2.teamId;

        if (p1Won) {
          t1.won += 1;
          t1.points += 3; // 3 points for win
          t2.lost += 1;
          t2.points += 1; // 1 point for loss
        } else if (p2Won) {
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
                if (set.is_complete || (set.player1_score > 0 || set.player2_score > 0)) {
                  const setWinnerIsP1 = set.winner_id === 'player1' || set.player1_score > set.player2_score;
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
            if (set.is_complete || (set.player1_score > 0 || set.player2_score > 0)) {
              const setWinnerIsP1 = set.winner_id === 'player1' || set.winner_id === t1.teamId || set.player1_score > set.player2_score;
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
    return Object.values(standingsMap).map(s => {
      s.setRatio = s.setsLost === 0 ? s.setsWon : parseFloat((s.setsWon / s.setsLost).toFixed(2));
      return s;
    }).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.won !== a.won) return b.won - a.won;
      return b.setRatio - a.setRatio;
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
                      {team.logo_url || getTeamLogo(team.name) ? (
                        <img
                          src={team.logo_url || getTeamLogo(team.name)!}
                          alt={team.name}
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: 'var(--radius-md)',
                            objectFit: 'cover',
                            border: `2px solid ${team.logo_color}`,
                            background: '#000',
                          }}
                        />
                      ) : (
                        <div style={{
                          width: 40, height: 40, borderRadius: 'var(--radius-md)',
                          background: team.logo_color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 18, fontWeight: 700, color: '#fff',
                        }}>
                          {team.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 600 }}>{team.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {teamPlayers.length} / {limit} player{teamPlayers.length !== 1 ? 's' : ''}
                          {team.captain_id && ` · Captain: ${allPlayers.find(u => u.id === team.captain_id)?.name || 'Unknown'}`}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setEditingTeam(team)}
                        title="Edit Team & Logo"
                        style={{ padding: '4px 8px' }}
                      >
                        <IconEdit size={14} /> Edit
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setShowAssignModal(team.id)}
                        disabled={isFull}
                        title={isFull ? "Roster limit reached" : "Add Player"}
                      >
                        <IconPlus size={14} /> Add
                      </button>
                    </div>
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
                                  background: 'linear-gradient(135deg, var(--accent), #3b82f6)',
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
                  {tournament?.sport === 'volleyball'
                    ? 'Official FIVB 3-Point System (3-0/3-1: 3pts-0pts | 3-2: 2pts-1pt | Ranked by Pts, Set Ratio, Pt Quotient)'
                    : `Leaderboard stats (Tie Win = 3pts, Tie Loss = 1pt, Bonus = +1pt per set won by ${tournament?.bonus_point_margin || 5}+ pts)`
                  }
                </p>
              </div>
            </div>

            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    <th style={{ padding: '12px 20px', width: 80 }}>Pos</th>
                    <th style={{ padding: '12px 20px' }}>Team</th>
                    <th style={{ padding: '12px 20px', textAlign: 'center' }}>Pld</th>
                    <th style={{ padding: '12px 20px', textAlign: 'center' }}>W</th>
                    <th style={{ padding: '12px 20px', textAlign: 'center' }}>L</th>
                    <th style={{ padding: '12px 20px', textAlign: 'center' }}>Sets (W - L)</th>
                    <th style={{ padding: '12px 20px', textAlign: 'center' }}>Set Ratio</th>
                    {tournament?.sport === 'volleyball' && (
                      <th style={{ padding: '12px 20px', textAlign: 'center' }}>Pt Quotient</th>
                    )}
                    {tournament?.sport !== 'volleyball' && (
                      <th style={{ padding: '12px 20px', textAlign: 'center', color: 'var(--accent)' }}>Bonus Pts</th>
                    )}
                    <th style={{ padding: '12px 20px', textAlign: 'center', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {tournament?.sport === 'volleyball' ? 'FIVB Pts' : 'Total Points'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const standings = getStandings();
                    const totalItems = standings.length;
                    const totalPages = Math.ceil(totalItems / pageSize) || 1;
                    const paginatedStandings = standings.slice((currentPage - 1) * pageSize, currentPage * pageSize);

                    return (
                      <>
                        {paginatedStandings.map((row, idx) => {
                          const absoluteIndex = (currentPage - 1) * pageSize + idx;
                          return (
                            <tr key={row.teamId} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s', background: absoluteIndex === 0 && row.played > 0 ? 'rgba(37, 99, 235, 0.05)' : 'transparent' }}>
                              <td style={{ padding: '14px 20px', fontWeight: 700 }}>
                                {absoluteIndex === 0 ? '🏆 1' : absoluteIndex + 1}
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
                              <td style={{ padding: '14px 20px', textAlign: 'center', fontWeight: 600 }}>
                                {row.setRatio ? row.setRatio.toFixed(2) : '0.00'}
                              </td>
                              {tournament?.sport === 'volleyball' && (
                                <td style={{ padding: '14px 20px', textAlign: 'center', color: '#93C5FD', fontWeight: 600 }}>
                                  {row.pointQuotient ? row.pointQuotient.toFixed(3) : '0.000'}
                                </td>
                              )}
                              {tournament?.sport !== 'volleyball' && (
                                <td style={{ padding: '14px 20px', textAlign: 'center', color: 'var(--accent)', fontWeight: 600 }}>
                                  +{row.bonusPoints}
                                </td>
                              )}
                              <td style={{ padding: '14px 20px', textAlign: 'center', fontWeight: 700, fontSize: 16 }}>
                                {row.points}
                              </td>
                            </tr>
                          );
                        })}
                        
                        {tournamentTeams.length === 0 && (
                          <tr>
                            <td colSpan={8} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                              No standings available. Add teams to see calculations.
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })()}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {(() => {
              const standings = getStandings();
              const totalItems = standings.length;
              const totalPages = Math.ceil(totalItems / pageSize) || 1;
              if (totalItems === 0) return null;
              
              return (
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
              );
            })()}
          </div>
        </>
      ) : null}

      {/* Create Team Modal */}
      {showCreateModal && (
        <CreateTeamModal onClose={() => setShowCreateModal(false)} onCreate={handleCreateTeam} />
      )}

      {/* Edit Team Modal */}
      {editingTeam && (
        <EditTeamModal
          team={editingTeam}
          onClose={() => setEditingTeam(null)}
          onUpdate={handleUpdateTeam}
        />
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

function CreateTeamModal({
  onClose,
  onCreate
}: {
  onClose: () => void;
  onCreate: (name: string, color: string, logoUrl?: string) => void;
}) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#2563eb');
  const [logoUrl, setLogoUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const colors = ['#2563eb', '#ef4444', '#22c55e', '#3b82f6', '#f59e0b', '#a855f7', '#ec4899', '#06b6d4'];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogoUrl(reader.result);
      }
      setUploading(false);
    };
    reader.onerror = () => {
      alert('Failed to read image file');
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Create Team</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Configure team branding, logo & colors</p>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><IconX size={18} /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onCreate(name, color, logoUrl || undefined); }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="input-group">
            <label className="input-label" htmlFor="team-name">Team Name *</label>
            <input id="team-name" className="input" placeholder="e.g., Thunder Smashers" value={name} onChange={e => setName(e.target.value)} required />
          </div>

          {/* Logo Upload Section */}
          <div className="input-group">
            <label className="input-label">Team Official Logo</label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{
                width: 56, height: 56, borderRadius: 'var(--radius-md)',
                border: `2px dashed ${logoUrl ? color : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', background: 'var(--bg-secondary)', flexShrink: 0
              }}>
                {logoUrl ? (
                  <img src={logoUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: 22 }}>🛡️</span>
                )}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <input
                  type="file"
                  accept="image/*"
                  id="create-logo-file"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <label htmlFor="create-logo-file" className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                    {uploading ? 'Processing...' : '📁 Choose File'}
                  </label>
                  {logoUrl && (
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setLogoUrl('')} style={{ color: 'var(--score-loss)' }}>
                      Remove
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  className="input"
                  placeholder="Or paste image URL (https://...)"
                  value={logoUrl}
                  onChange={e => setLogoUrl(e.target.value)}
                  style={{ fontSize: 12, padding: '4px 8px' }}
                />
              </div>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Team Color Theme</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {colors.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{
                    width: 32, height: 32, borderRadius: 'var(--radius-md)',
                    background: c,
                    border: color === c ? '3px solid var(--text-primary)' : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Live Preview Card */}
          <div style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: `${color}15`,
            border: `2px solid ${color}`,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo preview"
                style={{
                  width: 40, height: 40, borderRadius: 'var(--radius-md)',
                  objectFit: 'cover', border: `2px solid ${color}`, background: '#000'
                }}
              />
            ) : (
              <div style={{
                width: 40, height: 40, borderRadius: 'var(--radius-md)',
                background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 700, color: '#fff',
              }}>
                {name ? name.charAt(0).toUpperCase() : '?'}
              </div>
            )}
            <div>
              <span style={{ fontWeight: 700, fontSize: 15, display: 'block' }}>{name || 'Team Name'}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Official Franchise Preview</span>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={!name}>
            Create Team
          </button>
        </form>
      </div>
    </div>
  );
}

function EditTeamModal({
  team,
  onClose,
  onUpdate,
}: {
  team: Team;
  onClose: () => void;
  onUpdate: (teamId: string, name: string, color: string, logoUrl?: string) => void;
}) {
  const [name, setName] = useState(team.name);
  const [color, setColor] = useState(team.logo_color || '#2563eb');
  const [logoUrl, setLogoUrl] = useState(team.logo_url || getTeamLogo(team.name) || '');
  const [uploading, setUploading] = useState(false);

  const colors = ['#2563eb', '#ef4444', '#22c55e', '#3b82f6', '#f59e0b', '#a855f7', '#ec4899', '#06b6d4'];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogoUrl(reader.result);
      }
      setUploading(false);
    };
    reader.onerror = () => {
      alert('Failed to read image file');
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Edit Team & Branding</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Update logo, color, and name for {team.name}</p>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><IconX size={18} /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onUpdate(team.id, name, color, logoUrl || undefined); }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="input-group">
            <label className="input-label" htmlFor="edit-team-name">Team Name *</label>
            <input id="edit-team-name" className="input" placeholder="e.g., Thunder Smashers" value={name} onChange={e => setName(e.target.value)} required />
          </div>

          {/* Logo Upload Section */}
          <div className="input-group">
            <label className="input-label">Team Official Logo</label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{
                width: 56, height: 56, borderRadius: 'var(--radius-md)',
                border: `2px dashed ${logoUrl ? color : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', background: 'var(--bg-secondary)', flexShrink: 0
              }}>
                {logoUrl ? (
                  <img src={logoUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: 22 }}>🛡️</span>
                )}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <input
                  type="file"
                  accept="image/*"
                  id="edit-logo-file"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <label htmlFor="edit-logo-file" className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                    {uploading ? 'Processing...' : '📁 Choose File'}
                  </label>
                  {logoUrl && (
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setLogoUrl('')} style={{ color: 'var(--score-loss)' }}>
                      Remove
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  className="input"
                  placeholder="Or paste image URL (https://...)"
                  value={logoUrl}
                  onChange={e => setLogoUrl(e.target.value)}
                  style={{ fontSize: 12, padding: '4px 8px' }}
                />
              </div>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Team Color Theme</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {colors.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{
                    width: 32, height: 32, borderRadius: 'var(--radius-md)',
                    background: c,
                    border: color === c ? '3px solid var(--text-primary)' : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Live Preview Card */}
          <div style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: `${color}15`,
            border: `2px solid ${color}`,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo preview"
                style={{
                  width: 40, height: 40, borderRadius: 'var(--radius-md)',
                  objectFit: 'cover', border: `2px solid ${color}`, background: '#000'
                }}
              />
            ) : (
              <div style={{
                width: 40, height: 40, borderRadius: 'var(--radius-md)',
                background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 700, color: '#fff',
              }}>
                {name ? name.charAt(0).toUpperCase() : '?'}
              </div>
            )}
            <div>
              <span style={{ fontWeight: 700, fontSize: 15, display: 'block' }}>{name || 'Team Name'}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Updated Franchise Preview</span>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={!name}>
            Save Changes
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
                    background: 'linear-gradient(135deg, var(--accent), #3b82f6)',
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
