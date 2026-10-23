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

  const targetSport = directorySportFilter;

  const filteredPlayers = players.filter(p => {
    const pNameLower = p.name.toLowerCase();
    const matchesSearch = pNameLower.includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (targetSport === 'all') return true;

    // 1. Check if the player has any match in the target sport (direct or by name)
    const hasMatchInSport = matches.some(m => {
      const tour = tournaments.find(tour => tour.id === m.tournament_id);
      const mSport = m.sport || tour?.sport || 'badminton';
      if (mSport !== targetSport) return false;

      const isDirectPlayer = m.player1_id === p.id || m.player2_id === p.id;
      const isNamePlayer = m.player1_name.toLowerCase().includes(pNameLower) || m.player2_name.toLowerCase().includes(pNameLower);
      if (isDirectPlayer || isNamePlayer) return true;

      // Cricket metadata check: did this player bat or bowl in this cricket match?
      if (mSport === 'cricket' && m.sport_metadata) {
        const meta = m.sport_metadata;
        const inInn1 = meta.innings_1 && (
          meta.innings_1.batters?.[p.id] ||
          meta.innings_1.bowlers?.[p.id] ||
          Object.values(meta.innings_1.batters || {}).some((b: any) => b.player_name?.toLowerCase().includes(pNameLower)) ||
          Object.values(meta.innings_1.bowlers || {}).some((bw: any) => bw.player_name?.toLowerCase().includes(pNameLower))
        );
        const inInn2 = meta.innings_2 && (
          meta.innings_2.batters?.[p.id] ||
          meta.innings_2.bowlers?.[p.id] ||
          Object.values(meta.innings_2.batters || {}).some((b: any) => b.player_name?.toLowerCase().includes(pNameLower)) ||
          Object.values(meta.innings_2.bowlers || {}).some((bw: any) => bw.player_name?.toLowerCase().includes(pNameLower))
        );
        if (inInn1 || inInn2) return true;
      }
      return false;
    });
    if (hasMatchInSport) return true;

    // 2. Check if the player belongs to a team registered in a targetSport tournament
    const belongsToTeamInSport = teams.some(t => {
      const isMember = t.players?.includes(p.id) ||
        t.players?.some(pid => pid.toLowerCase() === pNameLower) ||
        t.roster?.some(r => r.id === p.id || r.name.toLowerCase() === pNameLower);
      if (!isMember) return false;
      const tour = tournaments.find(tour => tour.id === t.tournament_id);
      return tour && (tour.sport === targetSport || (targetSport === 'volleyball' && tour.id.includes('vpl')));
    });
    if (belongsToTeamInSport) return true;

    return false;
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

  // Helper to check if a match involves the selected player
  const isPlayerInMatch = (m: Match, pId: string, pName: string) => {
    const pNameLower = pName.toLowerCase();
    if (m.player1_id === pId || m.player2_id === pId) return true;
    if (m.player1_name.toLowerCase().includes(pNameLower) || m.player2_name.toLowerCase().includes(pNameLower)) return true;

    // Check Cricket figures
    if (m.sport === 'cricket' && m.sport_metadata) {
      const meta = m.sport_metadata;
      const inInn1 = meta.innings_1 && (
        meta.innings_1.batters?.[pId] ||
        meta.innings_1.bowlers?.[pId] ||
        Object.values(meta.innings_1.batters || {}).some((b: any) => b.player_name?.toLowerCase().includes(pNameLower)) ||
        Object.values(meta.innings_1.bowlers || {}).some((bw: any) => bw.player_name?.toLowerCase().includes(pNameLower))
      );
      const inInn2 = meta.innings_2 && (
        meta.innings_2.batters?.[pId] ||
        meta.innings_2.bowlers?.[pId] ||
        Object.values(meta.innings_2.batters || {}).some((b: any) => b.player_name?.toLowerCase().includes(pNameLower)) ||
        Object.values(meta.innings_2.bowlers || {}).some((bw: any) => bw.player_name?.toLowerCase().includes(pNameLower))
      );
      if (inInn1 || inInn2) return true;
    }

    // Check team matches (e.g. Volleyball or Team Cricket)
    const playerTeams = teams.filter(t =>
      t.players?.includes(pId) ||
      t.players?.some(id => id.toLowerCase() === pNameLower) ||
      t.roster?.some(r => r.id === pId || r.name.toLowerCase() === pNameLower)
    );
    if (playerTeams.length > 0) {
      const teamNames = playerTeams.map(t => t.name.toLowerCase());
      const teamIds = playerTeams.map(t => t.id);
      if (teamIds.includes(m.player1_id) || teamIds.includes(m.player2_id)) return true;
      if (teamNames.some(tn => m.player1_name.toLowerCase().includes(tn) || m.player2_name.toLowerCase().includes(tn))) return true;
    }

    return false;
  };

  // Calculate statistics for selected player split/filtered by sport
  const playerMatches = selectedPlayer ? matches.filter(m => {
    if (!isPlayerInMatch(m, selectedPlayer.id, selectedPlayer.name)) return false;
    const tour = tournaments.find(t => t.id === m.tournament_id);
    const mSport = m.sport || tour?.sport || 'badminton';
    if (profileSportFilter !== 'all') {
      return mSport === profileSportFilter;
    }
    return true;
  }) : [];

  // Calculate all sports played by selected player
  const playerSportsPlayed = selectedPlayer ? Array.from(new Set(
    matches
      .filter(m => isPlayerInMatch(m, selectedPlayer.id, selectedPlayer.name))
      .map(m => {
        const tour = tournaments.find(t => t.id === m.tournament_id);
        return m.sport || tour?.sport || 'badminton';
      })
  )) : [];

  // Matches in descending order (recent first)
  const sortedMatches = [...playerMatches].sort((a, b) => {
    const timeA = a.scheduled_time ? new Date(a.scheduled_time).getTime() : 0;
    const timeB = b.scheduled_time ? new Date(b.scheduled_time).getTime() : 0;
    return timeB - timeA;
  });

  const completedMatches = playerMatches.filter(m => m.status === 'completed');
  const wins = completedMatches.filter(m => {
    if (!selectedPlayer) return false;
    if (m.winner_id === selectedPlayer.id) return true;
    const pNameLower = selectedPlayer.name.toLowerCase();
    if (m.winner_id && (m.winner_id === m.player1_id ? m.player1_name : m.player2_name).toLowerCase().includes(pNameLower)) return true;
    // Check if player's team won
    const playerTeams = teams.filter(t =>
      t.players?.includes(selectedPlayer.id) ||
      t.players?.some(id => id.toLowerCase() === pNameLower) ||
      t.roster?.some(r => r.id === selectedPlayer.id || r.name.toLowerCase() === pNameLower)
    );
    const teamIds = playerTeams.map(t => t.id);
    if (m.winner_id && teamIds.includes(m.winner_id)) return true;
    return false;
  }).length;
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
              { id: 'cricket', label: 'Cricket', icon: '🏏' },
              { id: 'badminton', label: 'Badminton', icon: '🏸' },
              { id: 'tennis', label: 'Tennis', icon: '🎾' },
              { id: 'table_tennis', label: 'Table Tennis', icon: '🏓' },
              { id: 'volleyball', label: 'Volleyball', icon: '🏐' },
              { id: 'squash', label: 'Squash', icon: '🎾' },
              { id: 'basketball', label: 'Basketball', icon: '🏀' },
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
                  const mSport = match.sport || tournament?.sport || 'badminton';

                  const pNameLower = selectedPlayer.name.toLowerCase();
                  const isPlayerP1 = match.player1_id === selectedPlayer.id || match.player1_name.toLowerCase().includes(pNameLower);
                  const oppName = isPlayerP1 ? match.player2_name : match.player1_name;
                  
                  let resultState: 'win' | 'loss' | 'pending' = 'pending';
                  if (match.status === 'completed') {
                    if (match.winner_id === selectedPlayer.id) {
                      resultState = 'win';
                    } else if (match.winner_id) {
                      const winnerName = match.winner_id === match.player1_id ? match.player1_name : match.player2_name;
                      if (winnerName.toLowerCase().includes(pNameLower)) {
                        resultState = 'win';
                      } else {
                        // Check team win
                        const playerTeams = teams.filter(t =>
                          t.players?.includes(selectedPlayer.id) ||
                          t.players?.some(id => id.toLowerCase() === pNameLower) ||
                          t.roster?.some(r => r.id === selectedPlayer.id || r.name.toLowerCase() === pNameLower)
                        );
                        resultState = playerTeams.some(t => t.id === match.winner_id) ? 'win' : 'loss';
                      }
                    } else {
                      resultState = 'loss';
                    }
                  }

                  // Cricket Match summary extraction
                  const cricketMeta = mSport === 'cricket' ? (match.sport_metadata as any) : null;
                  const inn1 = cricketMeta?.innings_1;
                  const inn2 = cricketMeta?.innings_2;

                  // Player individual figures in this cricket match
                  let batterStat: any = null;
                  let bowlerStat: any = null;
                  if (cricketMeta) {
                    [inn1, inn2].filter(Boolean).forEach(inn => {
                      if (inn.batters?.[selectedPlayer.id]) batterStat = inn.batters[selectedPlayer.id];
                      else {
                        const bEntry = Object.values(inn.batters || {}).find((b: any) => b.player_name?.toLowerCase().includes(pNameLower));
                        if (bEntry) batterStat = bEntry;
                      }

                      if (inn.bowlers?.[selectedPlayer.id]) bowlerStat = inn.bowlers[selectedPlayer.id];
                      else {
                        const bwEntry = Object.values(inn.bowlers || {}).find((bw: any) => bw.player_name?.toLowerCase().includes(pNameLower));
                        if (bwEntry) bowlerStat = bwEntry;
                      }
                    });
                  }

                  return (
                    <div key={match.id} style={{
                      padding: 16,
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
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

                      <div style={{ paddingLeft: 8, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 13, background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 4 }}>
                              {mSport === 'cricket' ? '🏏 Cricket' : mSport === 'volleyball' ? '🏐 Volleyball' : mSport === 'badminton' ? '🏸 Badminton' : mSport === 'tennis' ? '🎾 Tennis' : '🏅 ' + mSport}
                            </span>
                            <span style={{ fontWeight: 600, fontSize: 15 }}>
                              vs {oppName}
                            </span>
                            <span className={`badge badge-${match.status === 'running' ? 'live' : match.status === 'completed' ? (resultState === 'win' ? 'approved' : 'rejected') : 'open'}`}>
                              {match.status === 'completed' ? (resultState === 'win' ? 'WIN' : 'LOSS') : match.status}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span>{tournament?.name}</span>
                            {eventObj && (
                              <>
                                <span>·</span>
                                <span>{eventObj.event_name}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Date and Court */}
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                            <IconClock size={11} />
                            {match.scheduled_time ? new Date(match.scheduled_time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                          </div>
                          {match.court && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{match.court}</div>}
                        </div>
                      </div>

                      {/* Score / Performance details */}
                      <div style={{ paddingLeft: 8, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                        {mSport === 'cricket' && cricketMeta ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {/* Inning Totals */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
                              {inn1 && (
                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                                  {inn1.batting_team_name}: <span style={{ color: 'var(--accent)' }}>{inn1.total_runs}/{inn1.wickets}</span> <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>({inn1.overs_formatted || '0.0'} ov)</span>
                                </div>
                              )}
                              {inn2 && (
                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                                  vs {inn2.batting_team_name}: <span style={{ color: 'var(--accent)' }}>{inn2.total_runs}/{inn2.wickets}</span> <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>({inn2.overs_formatted || '0.0'} ov)</span>
                                </div>
                              )}
                            </div>

                            {/* Player's individual stats if available */}
                            {(batterStat || bowlerStat) && (
                              <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 12,
                                background: 'var(--bg-elevated)',
                                padding: '6px 12px',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: 12,
                                marginTop: 4,
                              }}>
                                {batterStat && (
                                  <div style={{ color: 'var(--text-primary)' }}>
                                    🏏 Batting: <strong>{batterStat.runs}</strong> ({batterStat.balls_faced}b, {batterStat.fours}x4, {batterStat.sixes}x6) — SR: {batterStat.strike_rate}
                                  </div>
                                )}
                                {bowlerStat && (
                                  <div style={{ color: 'var(--text-primary)' }}>
                                    🔴 Bowling: <strong>{bowlerStat.wickets}/{bowlerStat.runs_conceded}</strong> in {bowlerStat.overs || '0'} ov — Econ: {bowlerStat.economy}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Racket / Volleyball sets */
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Sets Breakdown:</div>
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
                                    {isPlayerP1 ? `${s.player1_score}-${s.player2_score}` : `${s.player2_score}-${s.player1_score}`}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>TBD</span>
                            )}
                          </div>
                        )}
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
