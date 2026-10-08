'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Match, User, TournamentEvent, Tournament, Team } from '@/types';
import { getLeaderboard, getMatches, getEvents, getTournaments, getAllTeams } from '@/lib/supabase-service';
import { IconShuttlecock, IconTrophy, IconActivity, IconUsers, IconX, IconClock } from '@/components/icons';
import ShuttlecockLoader from '@/components/ShuttlecockLoader';
import { getPlayerAchievements } from '@/lib/achievements';
import { generateMatchHighlights } from '@/lib/highlights';
import { useSport } from '@/lib/sport-context';
import SportSelector from '@/components/SportSelector';
import { VolleyballStanding, calculateVolleyballStandings } from '@/lib/sports-rules';
import { getTeamLogo } from '@/lib/team-logos';

interface LeaderboardRow {
  playerId: string;
  playerName: string;
  playerEmail: string;
  played: number;
  wins: number;
  losses: number;
  winRate: number;
  championships: number;
  points: number;
}

interface SearchablePlayerSelectProps {
  label: string;
  selectedId: string;
  onSelect: (id: string) => void;
  excludeId: string;
  players: LeaderboardRow[];
  placeholder?: string;
}

function SearchablePlayerSelect({
  label,
  selectedId,
  onSelect,
  excludeId,
  players,
  placeholder = "Type to search..."
}: SearchablePlayerSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedPlayer = players.find(p => p.playerId === selectedId);

  // Initialize query with selected player name if set and not active searching
  React.useEffect(() => {
    if (selectedPlayer) {
      setQuery(selectedPlayer.playerName);
    } else {
      setQuery('');
    }
  }, [selectedId, selectedPlayer]);

  // Handle outside click closures
  React.useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (selectedPlayer) {
          setQuery(selectedPlayer.playerName);
        } else {
          setQuery('');
        }
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [selectedPlayer]);

  const filtered = React.useMemo(() => {
    return players.filter(p => {
      if (p.playerId === excludeId) return false;
      const term = query.toLowerCase().trim();
      if (term === '' || (selectedPlayer && selectedPlayer.playerName === query)) return true;
      return p.playerName.toLowerCase().includes(term) || p.playerEmail.toLowerCase().includes(term);
    });
  }, [players, query, excludeId, selectedPlayer]);

  return (
    <div className="input-group" style={{ margin: 0, position: 'relative' }} ref={containerRef}>
      <label className="input-label">{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          className="input"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          style={{ paddingRight: 32 }}
        />
        <button
          type="button"
          onClick={() => {
            if (isOpen) {
              setIsOpen(false);
              if (selectedPlayer) setQuery(selectedPlayer.playerName);
            } else {
              setIsOpen(true);
            }
          }}
          style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
            fontSize: 12, padding: 0
          }}
        >
          {isOpen ? '▲' : '▼'}
        </button>
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          maxHeight: 200,
          overflowY: 'auto',
          zIndex: 999,
          marginTop: 6,
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)',
        }}>
          {filtered.length > 0 ? (
            filtered.map(p => (
              <div
                key={p.playerId}
                onClick={() => {
                  onSelect(p.playerId);
                  setQuery(p.playerName);
                  setIsOpen(false);
                }}
                style={{
                  padding: '10px 14px',
                  cursor: 'pointer',
                  fontSize: 13,
                  borderBottom: '1px solid var(--border)',
                  background: selectedId === p.playerId ? 'var(--accent-subtle)' : 'transparent',
                  color: selectedId === p.playerId ? 'var(--accent-hover)' : 'var(--text-primary)',
                  transition: 'background var(--transition-fast)',
                }}
                onMouseOver={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                onMouseOut={e => e.currentTarget.style.background = selectedId === p.playerId ? 'var(--accent-subtle)' : 'transparent'}
              >
                <div style={{ fontWeight: 600 }}>{p.playerName}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{p.playerEmail}</div>
              </div>
            ))
          ) : (
            <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
              No matching players found
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface SearchableTeamSelectProps {
  label: string;
  selectedId: string;
  onSelect: (id: string) => void;
  excludeId: string;
  teams: { teamId: string; teamName: string }[];
  placeholder?: string;
}

function SearchableTeamSelect({
  label,
  selectedId,
  onSelect,
  excludeId,
  teams,
  placeholder = "Type to search team..."
}: SearchableTeamSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedTeam = teams.find(t => t.teamId === selectedId);

  React.useEffect(() => {
    if (selectedTeam) {
      setQuery(selectedTeam.teamName);
    } else {
      setQuery('');
    }
  }, [selectedId, selectedTeam]);

  React.useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (selectedTeam) {
          setQuery(selectedTeam.teamName);
        } else {
          setQuery('');
        }
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [selectedTeam]);

  const filtered = React.useMemo(() => {
    return teams.filter(t => {
      if (t.teamId === excludeId) return false;
      const term = query.toLowerCase().trim();
      if (term === '' || (selectedTeam && selectedTeam.teamName === query)) return true;
      return t.teamName.toLowerCase().includes(term);
    });
  }, [teams, query, excludeId, selectedTeam]);

  return (
    <div className="input-group" style={{ margin: 0, position: 'relative' }} ref={containerRef}>
      <label className="input-label">{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          className="input"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          style={{ paddingRight: 32 }}
        />
        <button
          type="button"
          onClick={() => {
            if (isOpen) {
              setIsOpen(false);
              if (selectedTeam) setQuery(selectedTeam.teamName);
            } else {
              setIsOpen(true);
            }
          }}
          style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
            fontSize: 12, padding: 0
          }}
        >
          {isOpen ? '▲' : '▼'}
        </button>
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          maxHeight: 200,
          overflowY: 'auto',
          zIndex: 999,
          marginTop: 6,
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)',
        }}>
          {filtered.length > 0 ? (
            filtered.map(t => {
              const logo = getTeamLogo(t.teamName);
              return (
                <div
                  key={t.teamId}
                  onClick={() => {
                    onSelect(t.teamId);
                    setQuery(t.teamName);
                    setIsOpen(false);
                  }}
                  style={{
                    padding: '10px 14px',
                    cursor: 'pointer',
                    fontSize: 13,
                    borderBottom: '1px solid var(--border)',
                    background: selectedId === t.teamId ? 'var(--accent-subtle)' : 'transparent',
                    color: selectedId === t.teamId ? 'var(--accent-hover)' : 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    transition: 'background var(--transition-fast)',
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                  onMouseOut={e => e.currentTarget.style.background = selectedId === t.teamId ? 'var(--accent-subtle)' : 'transparent'}
                >
                  {logo ? (
                    <img src={logo} alt={t.teamName} style={{ width: 22, height: 22, borderRadius: 4, objectFit: 'cover' }} />
                  ) : (
                    <span>🛡️</span>
                  )}
                  <div>
                    <div style={{ fontWeight: 600 }}>{t.teamName}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>ID: {t.teamId}</div>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
              No matching teams found
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface MultiSelectTournamentDropdownProps {
  tournaments: Tournament[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

function MultiSelectTournamentDropdown({ tournaments, selectedIds, onChange }: MultiSelectTournamentDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const filtered = tournaments.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(x => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 240, position: 'relative' }} ref={containerRef}>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>FILTER BY TOURNAMENTS</span>
      
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          minHeight: 36,
          padding: '6px 12px',
          background: 'var(--bg-primary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 6
        }}
      >
        {selectedIds.length === 0 ? (
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>All Tournaments</span>
        ) : (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {selectedIds.map(id => {
              const name = tournaments.find(t => t.id === id)?.name || id;
              return (
                <span 
                  key={id} 
                  style={{
                    background: 'var(--accent-subtle)',
                    color: 'var(--accent-hover)',
                    fontSize: 11,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelect(id);
                  }}
                >
                  {name}
                  <span style={{ fontSize: 10, fontWeight: 'bold' }}>×</span>
                </span>
              );
            })}
          </div>
        )}
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{isOpen ? '▲' : '▼'}</span>
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          maxHeight: 220,
          overflowY: 'auto',
          zIndex: 999,
          marginTop: 6,
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)',
          padding: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 6
        }}>
          <input
            type="text"
            className="input"
            placeholder="Search tournament..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            style={{ height: 32, fontSize: 12, padding: '0 8px', marginBottom: 4 }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 140, overflowY: 'auto' }}>
            {filtered.map(t => {
              const isSelected = selectedIds.includes(t.id);
              return (
                <div
                  key={t.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelect(t.id);
                  }}
                  style={{
                    padding: '8px 10px',
                    cursor: 'pointer',
                    fontSize: 12,
                    borderRadius: 'var(--radius-sm)',
                    background: isSelected ? 'var(--accent-subtle)' : 'transparent',
                    color: isSelected ? 'var(--accent-hover)' : 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                  onMouseOver={e => e.currentTarget.style.background = isSelected ? 'var(--accent-subtle)' : 'var(--bg-elevated)'}
                  onMouseOut={e => e.currentTarget.style.background = isSelected ? 'var(--accent-subtle)' : 'transparent'}
                >
                  <input 
                    type="checkbox" 
                    checked={isSelected} 
                    readOnly 
                    style={{ pointerEvents: 'none' }}
                  />
                  <span style={{ fontWeight: isSelected ? 600 : 400 }}>{t.name}</span>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div style={{ padding: '8px 10px', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                No tournaments found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PlayersPublicLeaderboardPage() {
  const { activeSport } = useSport();
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [events, setEvents] = useState<TournamentEvent[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [selectedTourIds, setSelectedTourIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Standings Category Tabs: 'singles' | 'doubles' | 'teams'
  const isTeamSport = activeSport === 'volleyball' || activeSport === 'basketball' || activeSport === 'cricket';
  const [leaderboardTab, setLeaderboardTab] = useState<'singles' | 'doubles' | 'teams'>(
    isTeamSport ? 'teams' : 'singles'
  );
  // View mode for tournament standings: overall or round-wise
  const [standingsViewMode, setStandingsViewMode] = useState<'overall' | 'round_wise'>('round_wise');

  useEffect(() => {
    // If selected tournament is a team tournament, or active sport is team sport, switch to teams tab
    const selectedTours = tournaments.filter(t => selectedTourIds.includes(t.id));
    const allSelectedAreTeam = selectedTours.length > 0 && selectedTours.every(t => t.type === 'team');

    if (isTeamSport || allSelectedAreTeam) {
      setLeaderboardTab('teams');
    }
  }, [activeSport, isTeamSport, selectedTourIds, tournaments]);

  // Professional BAI ranking filters state
  const [selectedAgeCat, setSelectedAgeCat] = useState<string>('all');
  const [selectedEventType, setSelectedEventType] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');

  // Head-to-Head selection states
  const [playerAId, setPlayerAId] = useState('');
  const [playerBId, setPlayerBId] = useState('');
  const [teamAId, setTeamAId] = useState('');
  const [teamBId, setTeamBId] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [playerModalSport, setPlayerModalSport] = useState<string>('all');

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, leaderboardTab, selectedAgeCat, selectedEventType, selectedGender, selectedTourIds]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [boardData, matchesData, eventsData, tournamentsData, teamsData] = await Promise.all([
        getLeaderboard(),
        getMatches(),
        getEvents(),
        getTournaments(),
        getAllTeams()
      ]);
      setLeaderboard(boardData);
      setMatches(matchesData);
      setEvents(eventsData);
      setTournaments(tournamentsData);
      setAllTeams(teamsData || []);
      
      // Auto-select first two players for comparison if available
      if (boardData.length > 1) {
        setPlayerAId(boardData[0].playerId);
        setPlayerBId(boardData[1].playerId);
      }
    } catch (err) {
      console.error('Failed to load public stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Recalculate stats dynamically for the active tab (Singles vs Doubles) and professional BAI categories
  const displayLeaderboard = React.useMemo(() => {
    const mapped = leaderboard.map(p => {
      let played = 0;
      let wins = 0;
      let losses = 0;
      const pId = p.playerId;
      const pNameLower = p.playerName.toLowerCase();

      const playerMatches = matches.filter(m => {
        if (m.status !== 'completed') return false;
        if (m.is_adhoc) return false;

        // In individual standings, exclude team-type tournament matches (teams are listed in the Teams tab)
        const tour = tournaments.find(t => t.id === m.tournament_id);
        if (tour && tour.type === 'team') return false;

        // Filter by sport context
        const matchesSport = activeSport === 'all' || (tour && tour.sport === activeSport) || m.sport === activeSport;
        if (!matchesSport) return false;

        // Filter by selected Tournaments if any are selected
        if (selectedTourIds.length > 0 && (!m.tournament_id || !selectedTourIds.includes(m.tournament_id))) return false;

        // Find the event for this match to apply Category/Age/Gender criteria
        const matchEvent = m.event_id ? events.find(e => e.id === m.event_id) : undefined;
        if (!matchEvent) return false;

        // Filter by Event Type
        if (selectedEventType !== 'all' && matchEvent.event_type !== selectedEventType) return false;

        // Filter by Gender
        if (selectedGender !== 'all') {
          if (selectedGender === 'MALE' && matchEvent.gender !== 'BOYS' && matchEvent.gender !== 'MALE') return false;
          if (selectedGender === 'FEMALE' && matchEvent.gender !== 'GIRLS' && matchEvent.gender !== 'FEMALE') return false;
          if (selectedGender === 'MIXED' && matchEvent.gender !== 'MIXED') return false;
        }

        // Filter by Age Category
        if (selectedAgeCat !== 'all' && matchEvent.age_category !== selectedAgeCat) return false;

        // Doubles matches contain slashes, pluses or event category indicators (if event type is 'all')
        if (selectedEventType === 'all') {
          const doublesMatch = m.player1_name.includes('/') || m.player1_name.includes('+') || m.player1_name.includes(',') || m.player1_name.toLowerCase().includes(' and ') || matchEvent.event_type === 'DOUBLES' || matchEvent.event_type === 'MIXED_DOUBLES';
          const isDoublesTab = leaderboardTab === 'doubles';
          if (isDoublesTab !== doublesMatch) return false;
        }

        // Verify if player competed (by ID or splitting names)
        const isP1 = m.player1_id === pId || m.player1_name.toLowerCase().includes(pNameLower);
        const isP2 = m.player2_id === pId || m.player2_name.toLowerCase().includes(pNameLower);
        return isP1 || isP2;
      });

      playerMatches.forEach(m => {
        const isP1 = m.player1_id === pId || m.player1_name.toLowerCase().includes(pNameLower);
        let won = false;
        if (m.winner_id) {
          if (m.winner_id === pId) won = true;
          else {
            const winnerName = m.winner_id === m.player1_id ? m.player1_name : m.player2_name;
            if (winnerName.toLowerCase().includes(pNameLower)) won = true;
          }
        } else {
          const p1Sets = m.sets?.filter(s => s.is_complete && s.winner_id === m.player1_id).length || 0;
          const p2Sets = m.sets?.filter(s => s.is_complete && s.winner_id === m.player2_id).length || 0;
          won = isP1 ? p1Sets > p2Sets : p2Sets > p1Sets;
        }

        played++;
        if (won) wins++;
        else losses++;
      });

      const winRate = played > 0 ? Math.round((wins / played) * 1000.0) / 10.0 : 0.0;
      // Compute championships based on category finals won
      const championshipsCount = playerMatches.filter(m => (m.fixture_round ?? 0) >= 4 && (m.winner_id === pId || (m.winner_id && (m.winner_id === m.player1_id ? m.player1_name : m.player2_name).toLowerCase().includes(pNameLower)))).length;
      const points = (wins * 10) + (losses * 2);

      // Extract partner name if we are on the doubles tab
      let partnerName = '';
      if ((selectedEventType === 'DOUBLES' || selectedEventType === 'MIXED_DOUBLES' || leaderboardTab === 'doubles') && playerMatches.length > 0) {
        const matchWithPartner = playerMatches.find(m => {
          const isP1 = m.player1_name.toLowerCase().includes(pNameLower);
          const isP2 = m.player2_name.toLowerCase().includes(pNameLower);
          return isP1 || isP2;
        });
        if (matchWithPartner) {
          const compName = matchWithPartner.player1_name.toLowerCase().includes(pNameLower)
            ? matchWithPartner.player1_name
            : matchWithPartner.player2_name;
          const parts = compName.split(/\s*(?:\/|\+|,|and)\s*/i);
          if (parts.length > 1) {
            const partnerPart = parts.find(part => !part.toLowerCase().includes(pNameLower));
            if (partnerPart) {
              partnerName = partnerPart.trim();
            }
          }
        }
      }

      return {
        ...p,
        played,
        wins,
        losses,
        winRate,
        championships: championshipsCount > 0 ? championshipsCount : (p.championships || 0),
        points,
        partnerName
      };
    });

    // Hide inactive players for specific categories (identical to BAI leaderboards)
    const isFilteringActive = selectedAgeCat !== 'all' || selectedEventType !== 'all' || selectedGender !== 'all' || activeSport !== 'all';
    const filteredByActivity = isFilteringActive
      ? mapped.filter(p => p.played > 0)
      : mapped;

    return filteredByActivity.sort((a, b) => b.points - a.points || b.winRate - a.winRate || b.played - a.played);
  }, [leaderboard, matches, events, leaderboardTab, selectedAgeCat, selectedEventType, selectedGender, selectedTourIds, activeSport]);

  // Recalculate dynamic Team Standings (Volleyball FIVB 3-Point tables & Team Franchise ties)
  const displayTeamLeaderboard = React.useMemo(() => {
    // 1. Gather all unique teams from matches filtered by sport and selected tournaments
    const relevantMatches = matches.filter(m => {
      const tour = tournaments.find(t => t.id === m.tournament_id);
      const matchesSport = activeSport === 'all' || (tour && tour.sport === activeSport) || m.sport === activeSport;
      if (!matchesSport) return false;
      // In teams tab or for team sports, ensure tournament is a team tournament if specified
      if (activeSport === 'badminton' && tour && tour.type !== 'team') return false;
      if (selectedTourIds.length > 0 && (!m.tournament_id || !selectedTourIds.includes(m.tournament_id))) return false;
      return true;
    });

    const relevantTeams = allTeams.filter(t => {
      const tour = tournaments.find(tourItem => tourItem.id === t.tournament_id);
      const matchesSport = activeSport === 'all' || (tour && tour.sport === activeSport);
      if (!matchesSport) return false;
      if (selectedTourIds.length > 0 && !selectedTourIds.includes(t.tournament_id)) return false;
      return true;
    });

    const teamMap = new Map<string, string>();
    relevantTeams.forEach(t => {
      teamMap.set(t.name.trim().toLowerCase(), t.name.trim());
    });

    relevantMatches.forEach(m => {
      if (m.player1_name && m.player1_name !== 'TBD' && m.player1_name !== 'BYE') {
        const key = m.player1_name.trim().toLowerCase();
        if (!teamMap.has(key)) teamMap.set(key, m.player1_name.trim());
      }
      if (m.player2_name && m.player2_name !== 'TBD' && m.player2_name !== 'BYE') {
        const key = m.player2_name.trim().toLowerCase();
        if (!teamMap.has(key)) teamMap.set(key, m.player2_name.trim());
      }
    });

    const teamsList = Array.from(teamMap.values()).map(canonicalName => {
      const matched = relevantTeams.find(t => t.name.trim().toLowerCase() === canonicalName.toLowerCase());
      return {
        id: matched ? matched.id : canonicalName,
        name: canonicalName
      };
    });

    // If Volleyball, compute official FIVB standings (points, set ratio, rally quotient)
    if (activeSport === 'volleyball') {
      return calculateVolleyballStandings(teamsList, relevantMatches as any);
    }

    // Default / Badminton Team Ties standings calculation
    return teamsList.map(t => {
      let played = 0;
      let won = 0;
      let lost = 0;
      let setsWon = 0;
      let setsLost = 0;

      relevantMatches.forEach(m => {
        const isT1 = m.player1_id === t.id || m.player1_name?.trim().toLowerCase() === t.name.trim().toLowerCase();
        const isT2 = m.player2_id === t.id || m.player2_name?.trim().toLowerCase() === t.name.trim().toLowerCase();
        if (!isT1 && !isT2) return;
        if (m.status !== 'completed' && !m.winner_id) return;

        played++;
        const isWinner = m.winner_id === t.id || (isT1 && m.winner_id === m.player1_id) || (isT2 && m.winner_id === m.player2_id);
        if (isWinner) won++;
        else lost++;

        (m.sets || []).forEach(s => {
          if (s.is_complete && s.winner_id) {
            if (s.winner_id === t.id || (isT1 && s.winner_id === 'player1') || (isT2 && s.winner_id === 'player2')) {
              setsWon++;
            } else {
              setsLost++;
            }
          }
        });
      });

      const points = (won * 3) + (lost * 1);

      return {
        teamId: t.id,
        teamName: t.name,
        played,
        won,
        lost,
        points,
        setsWon,
        setsLost,
        setRatio: setsLost > 0 ? Math.round((setsWon / setsLost) * 100) / 100 : setsWon,
        rallyPointsWon: 0,
        rallyPointsLost: 0,
        pointQuotient: 0,
      };
    }).sort((a, b) => b.points - a.points || b.won - a.won || (b.setsWon - b.setsLost) - (a.setsWon - a.setsLost));
  }, [matches, tournaments, allTeams, activeSport, selectedTourIds]);

  // Round-wise standings grouping (e.g. Round 1 League / Groups, Super 6, Semis, Finals)
  const roundWiseTeamStandings = React.useMemo(() => {
    const relevantMatches = matches.filter(m => {
      const tour = tournaments.find(t => t.id === m.tournament_id);
      const matchesSport = activeSport === 'all' || (tour && tour.sport === activeSport) || m.sport === activeSport;
      if (!matchesSport) return false;
      if (activeSport === 'badminton' && tour && tour.type !== 'team') return false;
      if (selectedTourIds.length > 0 && (!m.tournament_id || !selectedTourIds.includes(m.tournament_id))) return false;
      return true;
    });

    const relevantTeams = allTeams.filter(t => {
      const tour = tournaments.find(tourItem => tourItem.id === t.tournament_id);
      const matchesSport = activeSport === 'all' || (tour && tour.sport === activeSport);
      if (!matchesSport) return false;
      if (selectedTourIds.length > 0 && !selectedTourIds.includes(t.tournament_id)) return false;
      return true;
    });

    // Group matches by round or group name
    const roundGroups = new Map<string, { roundTitle: string; roundOrder: number; matches: typeof relevantMatches }>();

    relevantMatches.forEach(m => {
      let rName = m.round_name || `Round ${m.fixture_round || 1}`;
      let rOrder = m.fixture_round || 1;

      if (!roundGroups.has(rName)) {
        roundGroups.set(rName, { roundTitle: rName, roundOrder: rOrder, matches: [] });
      }
      roundGroups.get(rName)!.matches.push(m);
    });

    const groupsArr = Array.from(roundGroups.values()).sort((a, b) => a.roundOrder - b.roundOrder);

    return groupsArr.map(group => {
      const teamMap = new Map<string, string>();
      relevantTeams.forEach(t => {
        teamMap.set(t.name.trim().toLowerCase(), t.name.trim());
      });

      group.matches.forEach(m => {
        if (m.player1_name && m.player1_name !== 'TBD' && m.player1_name !== 'BYE') {
          const key = m.player1_name.trim().toLowerCase();
          if (!teamMap.has(key)) teamMap.set(key, m.player1_name.trim());
        }
        if (m.player2_name && m.player2_name !== 'TBD' && m.player2_name !== 'BYE') {
          const key = m.player2_name.trim().toLowerCase();
          if (!teamMap.has(key)) teamMap.set(key, m.player2_name.trim());
        }
      });

      const teamsList = Array.from(teamMap.values()).map(canonicalName => {
        const matched = relevantTeams.find(t => t.name.trim().toLowerCase() === canonicalName.toLowerCase());
        return {
          id: matched ? matched.id : canonicalName,
          name: canonicalName
        };
      });

      let standings = [];
      if (activeSport === 'volleyball') {
        standings = calculateVolleyballStandings(teamsList, group.matches as any);
      } else {
        standings = teamsList.map(t => {
          let played = 0;
          let won = 0;
          let lost = 0;
          let setsWon = 0;
          let setsLost = 0;

          group.matches.forEach(m => {
            const isT1 = m.player1_id === t.id || m.player1_name?.trim().toLowerCase() === t.name.trim().toLowerCase();
            const isT2 = m.player2_id === t.id || m.player2_name?.trim().toLowerCase() === t.name.trim().toLowerCase();
            if (!isT1 && !isT2) return;
            if (m.status !== 'completed' && !m.winner_id) return;
            played++;
            const isWinner = m.winner_id === t.id || (isT1 && m.winner_id === m.player1_id) || (isT2 && m.winner_id === m.player2_id);
            if (isWinner) won++;
            else lost++;
            (m.sets || []).forEach(s => {
              if (s.is_complete && s.winner_id) {
                if (s.winner_id === t.id || (isT1 && s.winner_id === 'player1') || (isT2 && s.winner_id === 'player2')) {
                  setsWon++;
                } else {
                  setsLost++;
                }
              }
            });
          });
          const points = (won * 3) + (lost * 1);
          return {
            teamId: t.id,
            teamName: t.name,
            played,
            won,
            lost,
            points,
            setsWon,
            setsLost,
            setRatio: setsLost > 0 ? Math.round((setsWon / setsLost) * 100) / 100 : setsWon,
            rallyPointsWon: 0,
            rallyPointsLost: 0,
            pointQuotient: 0,
          };
        }).sort((a, b) => b.points - a.points || b.won - a.won || (b.setsWon - b.setsLost) - (a.setsWon - a.setsLost));
      }

      // Count how many matches in this round actually have confirmed teams assigned
      const hasRealMatches = group.matches.some(m =>
        m.player1_name && m.player1_name !== 'TBD' && m.player1_name !== 'BYE' &&
        m.player2_name && m.player2_name !== 'TBD' && m.player2_name !== 'BYE'
      );

      const isRoundTbd = !hasRealMatches || teamsList.length === 0;

      return {
        title: group.roundTitle,
        matchesCount: group.matches.length,
        isTbd: isRoundTbd,
        standings: isRoundTbd ? [] : standings,
      };
    });
  }, [matches, tournaments, allTeams, activeSport, selectedTourIds]);

  const filteredBoard = displayLeaderboard.filter(r =>
    r.playerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.playerEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTeamBoard = displayTeamLeaderboard.filter(t =>
    t.teamName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalItems = leaderboardTab === 'teams' ? filteredTeamBoard.length : filteredBoard.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedBoard = React.useMemo(() => {
    return filteredBoard.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredBoard, currentPage]);

  const paginatedTeamBoard = React.useMemo(() => {
    return filteredTeamBoard.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredTeamBoard, currentPage]);

  const playerA = displayLeaderboard.find(r => r.playerId === playerAId);
  const playerB = displayLeaderboard.find(r => r.playerId === playerBId);

  // Auto-select teams for team comparison when displayTeamLeaderboard changes
  useEffect(() => {
    if (displayTeamLeaderboard.length > 0) {
      if (!teamAId || !displayTeamLeaderboard.some(t => t.teamId === teamAId)) {
        setTeamAId(displayTeamLeaderboard[0].teamId);
      }
      if (displayTeamLeaderboard.length > 1 && (!teamBId || !displayTeamLeaderboard.some(t => t.teamId === teamBId) || teamBId === displayTeamLeaderboard[0].teamId)) {
        setTeamBId(displayTeamLeaderboard[1].teamId);
      }
    }
  }, [displayTeamLeaderboard, teamAId, teamBId]);

  const teamA = displayTeamLeaderboard.find(t => t.teamId === teamAId);
  const teamB = displayTeamLeaderboard.find(t => t.teamId === teamBId);

  // Direct matches between Team A and Team B
  const directTeamMatches = React.useMemo(() => {
    if (!teamAId || !teamBId) return [];
    const nameA = teamA?.teamName.toLowerCase();
    const nameB = teamB?.teamName.toLowerCase();

    return matches.filter(m => {
      if (m.status !== 'completed' && !m.winner_id) return false;
      const hasA = m.player1_id === teamAId || m.player2_id === teamAId ||
                   (nameA && (m.player1_name.toLowerCase().includes(nameA) || m.player2_name.toLowerCase().includes(nameA)));
      const hasB = m.player1_id === teamBId || m.player2_id === teamBId ||
                   (nameB && (m.player1_name.toLowerCase().includes(nameB) || m.player2_name.toLowerCase().includes(nameB)));
      if (hasA && hasB) {
        const side1A = m.player1_id === teamAId || (nameA && m.player1_name.toLowerCase().includes(nameA));
        const side1B = m.player1_id === teamBId || (nameB && m.player1_name.toLowerCase().includes(nameB));
        return side1A !== side1B;
      }
      return false;
    });
  }, [matches, teamAId, teamBId, teamA, teamB]);

  const winsTeamA = directTeamMatches.filter(m => {
    const wonId = m.winner_id;
    if (!wonId) return false;
    if (wonId === teamAId) return true;
    const nameA = teamA?.teamName.toLowerCase();
    const winnerName = wonId === m.player1_id ? m.player1_name : m.player2_name;
    return nameA && winnerName.toLowerCase().includes(nameA);
  }).length;

  const winsTeamB = directTeamMatches.length - winsTeamA;

  // Compute direct match details between A and B, including doubles pairs!
  const nameA = playerA?.playerName.toLowerCase();
  const nameB = playerB?.playerName.toLowerCase();

  const directMatches = matches.filter(m => {
    if (m.status !== 'completed') return false;
    if (m.is_adhoc) return false;

    const hasA = m.player1_id === playerAId || m.player2_id === playerAId || 
                 (nameA && (m.player1_name.toLowerCase().includes(nameA) || m.player2_name.toLowerCase().includes(nameA)));
    const hasB = m.player1_id === playerBId || m.player2_id === playerBId || 
                 (nameB && (m.player1_name.toLowerCase().includes(nameB) || m.player2_name.toLowerCase().includes(nameB)));
                 
    if (hasA && hasB) {
      // Ensure Player A and Player B were on opposite sides of the net
      const side1A = m.player1_id === playerAId || (nameA && m.player1_name.toLowerCase().includes(nameA));
      const side1B = m.player1_id === playerBId || (nameB && m.player1_name.toLowerCase().includes(nameB));
      return side1A !== side1B;
    }
    return false;
  });

  const winsA = directMatches.filter(m => {
    const wonId = m.winner_id;
    if (!wonId) return false;
    if (wonId === playerAId) return true;
    const winnerName = wonId === m.player1_id ? m.player1_name : m.player2_name;
    return nameA && winnerName.toLowerCase().includes(nameA);
  }).length;

  const winsB = directMatches.length - winsA;

  if (loading && leaderboard.length === 0) {
    return (
      <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ShuttlecockLoader message="Fetching league standings..." />
      </div>
    );
  }

  return (
    <div style={{ background: 'transparent', minHeight: '100vh' }}>
      <style dangerouslySetInnerHTML={{__html: `
        /* Standings page responsive styling overrides */
        .h2h-selectors-grid {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 24px;
          align-items: center;
          margin-bottom: 24px;
        }
        .h2h-stats-grid {
          display: grid;
          grid-template-columns: 1fr 120px 1fr;
          gap: 16px;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          overflow: hidden;
        }
        @media (max-width: 768px) {
          .h2h-selectors-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .h2h-vs-text {
            text-align: center !important;
            padding-top: 0 !important;
          }
        }
        @media (max-width: 600px) {
          .h2h-stats-grid {
            grid-template-columns: 1fr 80px 1fr !important;
            gap: 8px !important;
          }
          .modal-content-custom {
            max-height: 95vh !important;
          }
          .modal-header-custom {
            padding: 20px 20px 12px !important;
          }
          .modal-body-custom {
            padding: 16px 20px 20px !important;
            gap: 16px !important;
          }
        }
      `}} />
      {/* Navbar */}
      <nav className="nav">
        <div className="container-app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{
              width: 36, height: 36,
              background: 'linear-gradient(135deg, var(--accent), #3b82f6)',
              borderRadius: 'var(--radius-md)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {activeSport === 'badminton' && <span style={{ fontSize: 18 }}>🏸</span>}
              {activeSport === 'table_tennis' && <span style={{ fontSize: 18 }}>🏓</span>}
              {activeSport === 'squash' && <span style={{ fontSize: 18 }}>🎾</span>}
              {activeSport === 'tennis' && <span style={{ fontSize: 18 }}>🥎</span>}
              {activeSport === 'volleyball' && <span style={{ fontSize: 18 }}>🏐</span>}
              {activeSport === 'cricket' && <span style={{ fontSize: 18 }}>🏏</span>}
              {activeSport === 'basketball' && <span style={{ fontSize: 18 }}>🏀</span>}
              {activeSport === 'all' && <IconShuttlecock size={20} />}
            </div>
            <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>MatchPoint</span>
          </Link>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <SportSelector />
            <Link href="/" className="btn btn-ghost">Home</Link>
            <Link href="/live" className="btn btn-ghost">Live Scores</Link>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="container-app" style={{ padding: '40px 20px 80px 20px', display: 'flex', flexDirection: 'column', gap: 40 }}>
        {/* Page Header */}
        <div>
          <span className="badge badge-accent" style={{ marginBottom: 8 }}>LEAGUE LEADERBOARD</span>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, color: 'var(--text-primary)' }}>Standings & Ranks</h1>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginTop: 4 }}>
            Explore global leaderboards, check player performance win rates, and compare direct head-to-head match stats.
          </p>
        </div>

        {/* Global Leaderboard Table - NOW ON TOP! */}
        <section className="glass-card animate-slide-up" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                🏆 Global Standings
              </h3>
              
              {/* Category selector tabs: for team sports (Volleyball, etc.) show only Teams, for individual sports show Singles, Doubles, and Teams */}
              <div className="tab-group" style={{ display: 'inline-flex' }}>
                {!isTeamSport && (
                  <>
                    <button
                      className={`tab ${leaderboardTab === 'singles' ? 'active' : ''}`}
                      onClick={() => { setLeaderboardTab('singles'); setSelectedEventType('all'); }}
                      style={{ fontSize: 12, padding: '6px 14px' }}
                    >
                      👤 Singles
                    </button>
                    <button
                      className={`tab ${leaderboardTab === 'doubles' ? 'active' : ''}`}
                      onClick={() => { setLeaderboardTab('doubles'); setSelectedEventType('all'); }}
                      style={{ fontSize: 12, padding: '6px 14px' }}
                    >
                      👥 Doubles & Mixed
                    </button>
                  </>
                )}
                <button
                  className={`tab ${leaderboardTab === 'teams' ? 'active' : ''}`}
                  onClick={() => { setLeaderboardTab('teams'); setSelectedEventType('all'); }}
                  style={{ fontSize: 12, padding: '6px 14px' }}
                >
                  🛡️ Teams
                </button>
              </div>
            </div>
            <input
              className="input"
              placeholder="Search standings by name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ maxWidth: 300 }}
            />
          </div>

          {/* BAI Professional Filters Bar */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', flex: 1, gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              
              {/* Tournaments Filter */}
              <MultiSelectTournamentDropdown
                tournaments={tournaments.filter(t => {
                  const matchesSport = activeSport === 'all' || t.sport === activeSport;
                  if (!matchesSport) return false;
                  if (activeSport === 'badminton' && leaderboardTab === 'teams') return t.type === 'team';
                  return true;
                })}
                selectedIds={selectedTourIds}
                onChange={setSelectedTourIds}
              />
              
              {/* Event Type Filter */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>EVENT CATEGORY</span>
                <select
                  className="input"
                  value={selectedEventType}
                  onChange={e => {
                    setSelectedEventType(e.target.value);
                    if (e.target.value === 'SINGLES') setLeaderboardTab('singles');
                    else if (e.target.value === 'DOUBLES' || e.target.value === 'MIXED_DOUBLES') setLeaderboardTab('doubles');
                    else if (e.target.value === 'TEAM') setLeaderboardTab('teams');
                  }}
                  style={{ height: 36, fontSize: 13, padding: '0 10px', background: 'var(--bg-primary)' }}
                >
                  {isTeamSport || leaderboardTab === 'teams' ? (
                    <>
                      <option value="all">All Team Events (Unified)</option>
                      <option value="TEAM">Team League & Ties</option>
                      {events
                        .filter(e => {
                          const tour = tournaments.find(t => t.id === e.tournament_id);
                          return activeSport === 'all' || (tour && tour.sport === activeSport);
                        })
                        .map(e => (
                          <option key={e.id} value={e.id}>{e.event_name || e.category || e.id}</option>
                        ))}
                    </>
                  ) : (
                    <>
                      <option value="all">All Events (Unified)</option>
                      <option value="SINGLES">Singles (MS / WS / BS / GS)</option>
                      <option value="DOUBLES">Doubles (MD / WD / BD / GD)</option>
                      <option value="MIXED_DOUBLES">Mixed Doubles (XD / MXD)</option>
                      <option value="TEAM">Team Ties</option>
                    </>
                  )}
                </select>
              </div>

              {/* Age Category Filter (BAI Standard / Dynamic) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>AGE CRITERIA</span>
                <select
                  className="input"
                  value={selectedAgeCat}
                  onChange={e => setSelectedAgeCat(e.target.value)}
                  style={{ height: 36, fontSize: 13, padding: '0 10px', background: 'var(--bg-primary)' }}
                >
                  <option value="all">All Age Groups</option>
                  {Array.from(new Set(events.map(e => e.age_category || 'OPEN').filter(Boolean)))
                    .sort((a, b) => {
                      if (a === 'OPEN' || b === 'OPEN') return a === 'OPEN' ? 1 : -1;
                      const numA = parseInt(a.replace(/\D/g, '')) || 0;
                      const numB = parseInt(b.replace(/\D/g, '')) || 0;
                      return numA - numB;
                    })
                    .map(cat => (
                      <option key={cat} value={cat}>
                        {cat === 'OPEN' ? 'Open / Senior' : cat.includes('+') ? `Masters ${cat}` : `Under ${cat.replace(/\D/g, '')} (${cat})`}
                      </option>
                    ))}
                </select>
              </div>

              {/* Gender Criteria Filter */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 140 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>GENDER GROUP</span>
                <select
                  className="input"
                  value={selectedGender}
                  onChange={e => setSelectedGender(e.target.value)}
                  style={{ height: 36, fontSize: 13, padding: '0 10px', background: 'var(--bg-primary)' }}
                >
                  <option value="all">All Genders</option>
                  <option value="MALE">Boys / Men</option>
                  <option value="FEMALE">Girls / Women</option>
                  <option value="MIXED">Mixed Only</option>
                </select>
              </div>

            </div>

            {/* Clear All Filters button */}
            {(selectedAgeCat !== 'all' || selectedEventType !== 'all' || selectedGender !== 'all' || selectedTourIds.length > 0) && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setSelectedAgeCat('all');
                  setSelectedEventType('all');
                  setSelectedGender('all');
                  setSelectedTourIds([]);
                }}
                style={{ alignSelf: 'flex-end', height: 36, fontSize: 12 }}
              >
                Reset Filters
              </button>
            )}
          </div>

          {/* Default Empty State when All Sports is active and no Tournament selected */}
          {activeSport === 'all' && selectedTourIds.length === 0 ? (
            <div style={{
              padding: '60px 24px',
              textAlign: 'center',
              border: '2px dashed var(--border)',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-secondary)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
            }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'var(--accent-subtle)',
                color: 'var(--accent-hover)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
              }}>
                🎯
              </div>
              <div style={{ maxWidth: 440 }}>
                <h4 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
                  Select a Sport Category or Tournament
                </h4>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                  To view official rankings and standings, please select a sport from the top sport selector (e.g. Volleyball, Badminton) or choose a tournament from the filter above.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSelectedTourIds(tournaments.map(t => t.id))}
                >
                  Show All Tournaments
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                {leaderboardTab === 'teams' ? (
                  /* Teams Standings Tables (Volleyball FIVB / Franchise Team Ties) */
                  <div>
                    {/* View Mode Toggle: Round-wise vs Overall */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 18px',
                      background: 'var(--bg-secondary)',
                      borderBottom: '1px solid var(--border)',
                      flexWrap: 'wrap',
                      gap: 12
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Standings Format:</span>
                        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-card)', padding: 3, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                          <button
                            type="button"
                            onClick={() => setStandingsViewMode('round_wise')}
                            style={{
                              padding: '5px 12px',
                              borderRadius: 4,
                              fontSize: 12,
                              fontWeight: 600,
                              border: 'none',
                              cursor: 'pointer',
                              background: standingsViewMode === 'round_wise' ? 'var(--accent)' : 'transparent',
                              color: standingsViewMode === 'round_wise' ? '#fff' : 'var(--text-secondary)',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            📊 Round-wise Standings ({roundWiseTeamStandings.length} Stages)
                          </button>
                          <button
                            type="button"
                            onClick={() => setStandingsViewMode('overall')}
                            style={{
                              padding: '5px 12px',
                              borderRadius: 4,
                              fontSize: 12,
                              fontWeight: 600,
                              border: 'none',
                              cursor: 'pointer',
                              background: standingsViewMode === 'overall' ? 'var(--accent)' : 'transparent',
                              color: standingsViewMode === 'overall' ? '#fff' : 'var(--text-secondary)',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            🏆 Consolidated Overall Table
                          </button>
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {standingsViewMode === 'round_wise'
                          ? 'Showing separate standing tables for each tournament round/group stage'
                          : 'Cumulative points across all completed matches'}
                      </div>
                    </div>

                    {standingsViewMode === 'round_wise' && roundWiseTeamStandings.length > 0 ? (
                      /* Multiple Round-Wise Standings Tables */
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '16px 0' }}>
                        {roundWiseTeamStandings.map((roundGroup, rIdx) => (
                          <div
                            key={roundGroup.title + rIdx}
                            style={{
                              border: '1px solid var(--border)',
                              borderRadius: 'var(--radius-md)',
                              overflow: 'hidden',
                              background: 'var(--bg-card)',
                              boxShadow: 'var(--shadow-sm)'
                            }}
                          >
                            {/* Round Table Header */}
                            <div style={{
                              padding: '14px 20px',
                              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(59, 130, 246, 0.04))',
                              borderBottom: '1px solid var(--border)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{
                                  background: 'var(--accent)',
                                  color: '#fff',
                                  padding: '2px 8px',
                                  borderRadius: 4,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  letterSpacing: 0.5
                                }}>
                                  STAGE {rIdx + 1}
                                </span>
                                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                                  {roundGroup.title}
                                </h4>
                              </div>
                              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
                                {roundGroup.standings.length} Teams · {roundGroup.matchesCount} match(es)
                              </span>
                            </div>

                            {/* Round Standings Table */}
                            <div style={{ overflowX: 'auto' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                                <thead>
                                  <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                                    <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-secondary)', width: 70 }}>Pos</th>
                                    <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-secondary)' }}>Team</th>
                                    <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>Pld</th>
                                    <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>W</th>
                                    <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>L</th>
                                    <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>Sets (W - L)</th>
                                    <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>Set Ratio</th>
                                    {activeSport === 'volleyball' && (
                                      <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>Pt Quotient</th>
                                    )}
                                    <th style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--accent)', textAlign: 'right' }}>
                                      {activeSport === 'volleyball' ? 'FIVB Pts' : 'Points'}
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {roundGroup.isTbd || roundGroup.standings.length === 0 ? (
                                    <tr>
                                      <td
                                        colSpan={activeSport === 'volleyball' ? 8 : 7}
                                        style={{
                                          padding: '36px 20px',
                                          textAlign: 'center',
                                          color: 'var(--text-muted)',
                                          fontStyle: 'italic',
                                          background: 'rgba(255, 255, 255, 0.01)',
                                        }}
                                      >
                                        ⏳ Round fixtures & qualified teams are to be decided (TBD). Matchups will be populated by tournament administrators upon progression.
                                      </td>
                                    </tr>
                                  ) : (
                                    roundGroup.standings.map((row: any, idx: number) => {
                                      const rank = idx + 1;
                                      return (
                                      <tr
                                        key={row.teamId}
                                        style={{
                                          borderBottom: idx === roundGroup.standings.length - 1 ? 'none' : '1px solid var(--border)',
                                          background: rank === 1 ? 'rgba(245, 158, 11, 0.03)' : 'transparent',
                                          transition: 'background var(--transition-fast)',
                                        }}
                                        className="table-row"
                                      >
                                        <td style={{ padding: '14px 18px', fontWeight: 700, fontSize: 14, color: rank === 1 ? 'var(--accent)' : 'var(--text-primary)' }}>
                                          {rank}
                                        </td>
                                        <td style={{ padding: '14px 18px' }}>
                                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                                            {getTeamLogo(row.teamName) ? (
                                              <img
                                                src={getTeamLogo(row.teamName)!}
                                                alt={row.teamName}
                                                style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'cover', border: '1px solid var(--border)' }}
                                              />
                                            ) : (
                                              <span>🛡️</span>
                                            )}
                                            <span>{row.teamName}</span>
                                          </div>
                                        </td>
                                        <td style={{ padding: '14px 18px', textAlign: 'center' }}>{row.played}</td>
                                        <td style={{ padding: '14px 18px', textAlign: 'center', color: 'var(--score-win)', fontWeight: 600 }}>{row.won}</td>
                                        <td style={{ padding: '14px 18px', textAlign: 'center', color: 'var(--score-loss)' }}>{row.lost}</td>
                                        <td style={{ padding: '14px 18px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 600 }}>
                                          {row.setsWon} - {row.setsLost}
                                        </td>
                                        <td style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600 }}>
                                          {row.setRatio.toFixed(2)}
                                        </td>
                                        {activeSport === 'volleyball' && (
                                          <td style={{ padding: '14px 18px', textAlign: 'center', color: '#93C5FD', fontWeight: 600 }}>
                                            {row.pointQuotient.toFixed(3)}
                                          </td>
                                        )}
                                        <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 800, color: 'var(--accent)', fontSize: 15 }}>
                                          {row.points}
                                        </td>
                                      </tr>
                                    );
                                  })
                                )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* Consolidated Single Table */
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
                        <thead>
                          <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                            <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-secondary)', width: 80 }}>Rank</th>
                            <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Team</th>
                            <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>Played</th>
                            <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>Wins</th>
                            <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>Losses</th>
                            <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>Sets (W - L)</th>
                            <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>Set Ratio</th>
                            {activeSport === 'volleyball' && (
                              <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>Pt Quotient</th>
                            )}
                            <th style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--accent)', textAlign: 'right' }}>
                              {activeSport === 'volleyball' ? 'FIVB Points' : 'Points'}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedTeamBoard.map((row, idx) => {
                            const rank = (currentPage - 1) * pageSize + idx + 1;

                            return (
                              <tr
                                key={row.teamId}
                                style={{
                                  borderBottom: idx === paginatedTeamBoard.length - 1 ? 'none' : '1px solid var(--border)',
                                  background: rank === 1 ? 'rgba(245, 158, 11, 0.03)' : 'transparent',
                                  transition: 'background var(--transition-fast)',
                                }}
                                className="table-row"
                              >
                                <td style={{ padding: '16px 20px', fontWeight: 700, fontSize: 14, color: rank === 1 ? 'var(--accent)' : 'var(--text-primary)' }}>
                                  {rank}
                                </td>
                                <td style={{ padding: '16px 20px' }}>
                                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 15, display: 'flex', alignItems: 'center', gap: 10 }}>
                                    {getTeamLogo(row.teamName) ? (
                                      <img
                                        src={getTeamLogo(row.teamName)!}
                                        alt={row.teamName}
                                        style={{ width: 26, height: 26, borderRadius: 6, objectFit: 'cover', border: '1px solid var(--border)' }}
                                      />
                                    ) : (
                                      <span>🛡️</span>
                                    )}
                                    <span>{row.teamName}</span>
                                  </div>
                                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ID: {row.teamId}</div>
                                </td>
                                <td style={{ padding: '16px 20px', textAlign: 'center' }}>{row.played}</td>
                                <td style={{ padding: '16px 20px', textAlign: 'center', color: 'var(--score-win)', fontWeight: 600 }}>{row.won}</td>
                                <td style={{ padding: '16px 20px', textAlign: 'center', color: 'var(--score-loss)' }}>{row.lost}</td>
                                <td style={{ padding: '16px 20px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 600 }}>
                                  {row.setsWon} - {row.setsLost}
                                </td>
                                <td style={{ padding: '16px 20px', textAlign: 'center', fontWeight: 600 }}>
                                  {row.setRatio.toFixed(2)}
                                </td>
                                {activeSport === 'volleyball' && (
                                  <td style={{ padding: '16px 20px', textAlign: 'center', color: '#93C5FD', fontWeight: 600 }}>
                                    {row.pointQuotient.toFixed(3)}
                                  </td>
                                )}
                                <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 800, color: 'var(--accent)', fontSize: 16 }}>
                                  {row.points}
                                </td>
                              </tr>
                            );
                          })}

                          {filteredTeamBoard.length === 0 && (
                            <tr>
                              <td colSpan={activeSport === 'volleyball' ? 9 : 8} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                                No teams found in standings for this category.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                ) : (
                  /* Individual / Doubles Standings Table */
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                        <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-secondary)', width: 80 }}>Rank</th>
                        <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Player</th>
                        <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>Played</th>
                        <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>Wins</th>
                        <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>Losses</th>
                        <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>Win Rate</th>
                        <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>Championships</th>
                        <th style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--accent)', textAlign: 'right' }}>Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedBoard.map((row, idx) => {
                        const rank = (currentPage - 1) * pageSize + idx + 1;
                        
                        return (
                          <tr
                            key={row.playerId}
                            style={{
                              borderBottom: idx === filteredBoard.length - 1 ? 'none' : '1px solid var(--border)',
                              background: rank === 1 ? 'rgba(245, 158, 11, 0.03)' : 'transparent',
                              transition: 'background var(--transition-fast)',
                              cursor: 'pointer',
                            }}
                            className="table-row"
                            onClick={() => { setSelectedPlayerId(row.playerId); setPlayerModalSport('all'); }}
                          >
                            <td style={{ padding: '16px 20px', fontWeight: 700, fontSize: 14, color: rank === 1 ? 'var(--accent)' : 'var(--text-primary)' }}>
                              {rank}
                            </td>
                            <td style={{ padding: '16px 20px' }}>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                {row.playerName} {leaderboardTab === 'doubles' && (row as any).partnerName ? ` / ${(row as any).partnerName}` : ''}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{row.playerEmail}</div>
                            </td>
                            <td style={{ padding: '16px 20px', textAlign: 'center' }}>{row.played}</td>
                            <td style={{ padding: '16px 20px', textAlign: 'center', color: 'var(--score-win)', fontWeight: 600 }}>{row.wins}</td>
                            <td style={{ padding: '16px 20px', textAlign: 'center', color: 'var(--score-loss)' }}>{row.losses}</td>
                            <td style={{ padding: '16px 20px', textAlign: 'center', fontWeight: 600 }}>{row.winRate}%</td>
                            <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                              {row.championships > 0 ? (
                                <span title={`${row.championships} event championship won`} style={{ cursor: 'help' }}>
                                  🏆 {row.championships}
                                </span>
                              ) : '—'}
                            </td>
                            <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 800, color: 'var(--accent)', fontSize: 15 }}>
                              {row.points}
                            </td>
                          </tr>
                        );
                      })}

                      {filteredBoard.length === 0 && (
                        <tr>
                          <td colSpan={8} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                            No players found in standings for this category.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
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
            </>
          )}
        </section>

        {/* Head-to-Head Comparison Section - NOW ON BOTTOM! */}
        {((leaderboardTab === 'teams' || isTeamSport) ? displayTeamLeaderboard.length > 1 : leaderboard.length > 1) && (
          <section className="glass-card" style={{ padding: 28 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              ⚔️ Head-to-Head Comparison
            </h2>

            {(leaderboardTab === 'teams' || isTeamSport) ? (
              /* Team vs Team Comparison */
              <>
                <div className="h2h-selectors-grid">
                  {/* Select Team A */}
                  <SearchableTeamSelect
                    label="Team A"
                    selectedId={teamAId}
                    onSelect={setTeamAId}
                    excludeId={teamBId}
                    teams={displayTeamLeaderboard}
                  />

                  <div className="h2h-vs-text" style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-muted)', paddingTop: 20 }}>VS</div>

                  {/* Select Team B */}
                  <SearchableTeamSelect
                    label="Team B"
                    selectedId={teamBId}
                    onSelect={setTeamBId}
                    excludeId={teamAId}
                    teams={displayTeamLeaderboard}
                  />
                </div>

                {teamA && teamB && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Stats Grid compare */}
                    <div className="h2h-stats-grid">
                      {/* Header Row */}
                      <div style={{ padding: '12px 20px', fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                        {getTeamLogo(teamA.teamName) ? (
                          <img src={getTeamLogo(teamA.teamName)!} alt={teamA.teamName} style={{ width: 24, height: 24, borderRadius: 4, objectFit: 'cover' }} />
                        ) : <span>🛡️</span>}
                        <span>{teamA.teamName}</span>
                      </div>
                      <div style={{ padding: '12px 0', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.05)', textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>STAT</div>
                      <div style={{ padding: '12px 20px', fontWeight: 700, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
                        <span>{teamB.teamName}</span>
                        {getTeamLogo(teamB.teamName) ? (
                          <img src={getTeamLogo(teamB.teamName)!} alt={teamB.teamName} style={{ width: 24, height: 24, borderRadius: 4, objectFit: 'cover' }} />
                        ) : <span>🛡️</span>}
                      </div>

                      {/* Points row */}
                      <div style={{ padding: '12px 20px', fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>{teamA.points} pts</div>
                      <div style={{ padding: '12px 0', textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Points</div>
                      <div style={{ padding: '12px 20px', fontSize: 18, fontWeight: 700, color: 'var(--accent)', textAlign: 'right' }}>{teamB.points} pts</div>

                      {/* Matches played row */}
                      <div style={{ padding: '12px 20px', fontSize: 14, color: 'var(--text-primary)' }}>{teamA.played}</div>
                      <div style={{ padding: '12px 0', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>Played</div>
                      <div style={{ padding: '12px 20px', fontSize: 14, color: 'var(--text-secondary)', textAlign: 'right' }}>{teamB.played}</div>

                      {/* Wins row */}
                      <div style={{ padding: '12px 20px', fontSize: 14, fontWeight: 600, color: 'var(--score-win)' }}>{teamA.won}</div>
                      <div style={{ padding: '12px 0', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>Wins</div>
                      <div style={{ padding: '12px 20px', fontSize: 14, fontWeight: 600, color: 'var(--score-win)', textAlign: 'right' }}>{teamB.won}</div>

                      {/* Losses row */}
                      <div style={{ padding: '12px 20px', fontSize: 14, color: 'var(--score-loss)' }}>{teamA.lost}</div>
                      <div style={{ padding: '12px 0', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>Losses</div>
                      <div style={{ padding: '12px 20px', fontSize: 14, color: 'var(--score-loss)', textAlign: 'right' }}>{teamB.lost}</div>

                      {/* Sets (W - L) row */}
                      <div style={{ padding: '12px 20px', fontSize: 14, fontWeight: 600, fontFamily: 'monospace' }}>{teamA.setsWon} - {teamA.setsLost}</div>
                      <div style={{ padding: '12px 0', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>Sets (W - L)</div>
                      <div style={{ padding: '12px 20px', fontSize: 14, fontWeight: 600, fontFamily: 'monospace', textAlign: 'right' }}>{teamB.setsWon} - {teamB.setsLost}</div>

                      {/* Set ratio row */}
                      <div style={{ padding: '12px 20px', fontSize: 14, fontWeight: 600 }}>{teamA.setRatio.toFixed(2)}</div>
                      <div style={{ padding: '12px 0', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', borderBottom: 'none' }}>Set Ratio</div>
                      <div style={{ padding: '12px 20px', fontSize: 14, fontWeight: 600, textAlign: 'right' }}>{teamB.setRatio.toFixed(2)}</div>
                    </div>

                    {/* Direct matchup scoreboard */}
                    <div style={{ padding: 20, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                      <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, textAlign: 'center' }}>Direct Matchup Score</h4>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, marginBottom: 18 }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent)' }}>{winsTeamA}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Wins ({teamA.teamName})</div>
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-muted)' }}>—</div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent)' }}>{winsTeamB}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Wins ({teamB.teamName})</div>
                        </div>
                      </div>

                      {/* direct matches list */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {directTeamMatches.map(match => {
                          const wonId = match.winner_id;
                          const isWinA = wonId === teamAId || (wonId && teamA.teamName && (wonId === match.player1_id ? match.player1_name : match.player2_name).toLowerCase().includes(teamA.teamName.toLowerCase()));
                          return (
                            <div key={match.id} style={{
                              padding: 12,
                              background: 'var(--bg-primary)',
                              border: '1px solid var(--border)',
                              borderRadius: 'var(--radius-sm)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: 13
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontWeight: 600, color: isWinA ? 'var(--score-win)' : 'var(--text-secondary)' }}>
                                  {isWinA ? '🥇 ' : ''}{match.player1_name}
                                </span>
                                <span style={{ color: 'var(--text-muted)' }}>vs</span>
                                <span style={{ fontWeight: 600, color: !isWinA ? 'var(--score-win)' : 'var(--text-secondary)' }}>
                                  {!isWinA ? '🥇 ' : ''}{match.player2_name}
                                </span>
                              </div>
                              {/* Sets score */}
                              <div style={{ display: 'flex', gap: 6 }}>
                                {(match.sets || []).map((s, idx) => (
                                  <span key={idx} style={{
                                    padding: '2px 6px',
                                    background: 'var(--bg-elevated)',
                                    borderRadius: 'var(--radius-xs)',
                                    fontSize: 11,
                                    fontFamily: 'var(--font-mono)'
                                  }}>
                                    {s.player1_score}-{s.player2_score}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })}

                        {directTeamMatches.length === 0 && (
                          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', margin: '10px 0 0 0' }}>
                            No direct matches have been played between these two teams yet.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Individual Player vs Player Comparison */
              <>
                <div className="h2h-selectors-grid">
                  {/* Select Player A */}
                  <SearchablePlayerSelect
                    label="Player A"
                    selectedId={playerAId}
                    onSelect={setPlayerAId}
                    excludeId={playerBId}
                    players={displayLeaderboard}
                  />

                  <div className="h2h-vs-text" style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-muted)', paddingTop: 20 }}>VS</div>

                  {/* Select Player B */}
                  <SearchablePlayerSelect
                    label="Player B"
                    selectedId={playerBId}
                    onSelect={setPlayerBId}
                    excludeId={playerAId}
                    players={displayLeaderboard}
                  />
                </div>

                {playerA && playerB && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Stats Grid compare */}
                    <div className="h2h-stats-grid">
                      {/* Header Row */}
                      <div style={{ padding: '12px 20px', fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}>{playerA.playerName}</div>
                      <div style={{ padding: '12px 0', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.05)', textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>STAT</div>
                      <div style={{ padding: '12px 20px', fontWeight: 700, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', textAlign: 'right' }}>{playerB.playerName}</div>

                      {/* Points row */}
                      <div style={{ padding: '12px 20px', fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>{playerA.points} pts</div>
                      <div style={{ padding: '12px 0', textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Points</div>
                      <div style={{ padding: '12px 20px', fontSize: 18, fontWeight: 700, color: 'var(--accent)', textAlign: 'right' }}>{playerB.points} pts</div>

                      {/* Matches played row */}
                      <div style={{ padding: '12px 20px', fontSize: 14, color: 'var(--text-primary)' }}>{playerA.played}</div>
                      <div style={{ padding: '12px 0', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>Played</div>
                      <div style={{ padding: '12px 20px', fontSize: 14, color: 'var(--text-secondary)', textAlign: 'right' }}>{playerB.played}</div>

                      {/* Wins row */}
                      <div style={{ padding: '12px 20px', fontSize: 14, fontWeight: 600, color: 'var(--score-win)' }}>{playerA.wins}</div>
                      <div style={{ padding: '12px 0', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>Wins</div>
                      <div style={{ padding: '12px 20px', fontSize: 14, fontWeight: 600, color: 'var(--score-win)', textAlign: 'right' }}>{playerB.wins}</div>

                      {/* Losses row */}
                      <div style={{ padding: '12px 20px', fontSize: 14, color: 'var(--score-loss)' }}>{playerA.losses}</div>
                      <div style={{ padding: '12px 0', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>Losses</div>
                      <div style={{ padding: '12px 20px', fontSize: 14, color: 'var(--score-loss)', textAlign: 'right' }}>{playerB.losses}</div>

                      {/* Win rate row */}
                      <div style={{ padding: '12px 20px', fontSize: 14, fontWeight: 600 }}>{playerA.winRate}%</div>
                      <div style={{ padding: '12px 0', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>Win Rate</div>
                      <div style={{ padding: '12px 20px', fontSize: 14, fontWeight: 600, textAlign: 'right' }}>{playerB.winRate}%</div>

                      {/* Championships row */}
                      <div style={{ padding: '12px 20px', fontSize: 14 }}>{playerA.championships > 0 ? `🏆 ${playerA.championships}` : '—'}</div>
                      <div style={{ padding: '12px 0', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', borderBottom: 'none' }}>Championships</div>
                      <div style={{ padding: '12px 20px', fontSize: 14, textAlign: 'right' }}>{playerB.championships > 0 ? `${playerB.championships} 🏆` : '—'}</div>
                    </div>

                    {/* Direct matchup scoreboard */}
                    <div style={{ padding: 20, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                      <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, textAlign: 'center' }}>Direct Matchup Score</h4>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, marginBottom: 18 }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent)' }}>{winsA}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Wins (A)</div>
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-muted)' }}>—</div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent)' }}>{winsB}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Wins (B)</div>
                        </div>
                      </div>

                      {/* direct matches list */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {directMatches.map(match => {
                          const wonId = match.winner_id;
                          const isWinA = wonId === playerAId || (wonId && nameA && (wonId === match.player1_id ? match.player1_name : match.player2_name).toLowerCase().includes(nameA));
                          return (
                            <div key={match.id} style={{
                              padding: 12,
                              background: 'var(--bg-primary)',
                              border: '1px solid var(--border)',
                              borderRadius: 'var(--radius-sm)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: 13
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontWeight: 600, color: isWinA ? 'var(--score-win)' : 'var(--text-secondary)' }}>
                                  {isWinA ? '🥇 ' : ''}{match.player1_name}
                                </span>
                                <span style={{ color: 'var(--text-muted)' }}>vs</span>
                                <span style={{ fontWeight: 600, color: !isWinA ? 'var(--score-win)' : 'var(--text-secondary)' }}>
                                  {!isWinA ? '🥇 ' : ''}{match.player2_name}
                                </span>
                              </div>
                              {/* Sets score */}
                              <div style={{ display: 'flex', gap: 6 }}>
                                {match.sets.map((s, idx) => (
                                  <span key={idx} style={{
                                    padding: '2px 6px',
                                    background: 'var(--bg-elevated)',
                                    borderRadius: 'var(--radius-xs)',
                                    fontSize: 11,
                                    fontFamily: 'var(--font-mono)'
                                  }}>
                                    {s.player1_score}-{s.player2_score}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })}

                        {directMatches.length === 0 && (
                          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', margin: '10px 0 0 0' }}>
                            No direct matches have been played between these two players yet.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </main>

      {/* Player Details Modal */}
      {(() => {
        if (!selectedPlayerId) return null;
        const selectedPlayerRow = leaderboard.find(r => r.playerId === selectedPlayerId);
        if (!selectedPlayerRow) return null;

        // All completed matches for this player across all disciplines
        const allPlayerCompletedMatches = matches.filter(
          m => m.status === 'completed' && (m.player1_id === selectedPlayerId || m.player2_id === selectedPlayerId)
        );

        // Sports played by this player
        const sportsPlayedByPlayer = Array.from(new Set(
          allPlayerCompletedMatches.map(m => {
            const tour = tournaments.find(t => t.id === m.tournament_id);
            return m.sport || tour?.sport || 'badminton';
          })
        ));

        // Filtered matches by selected sport in modal
        const selectedPlayerMatches = allPlayerCompletedMatches.filter(m => {
          if (playerModalSport === 'all') return true;
          const tour = tournaments.find(t => t.id === m.tournament_id);
          const mSport = m.sport || tour?.sport || 'badminton';
          return mSport === playerModalSport;
        });

        // Compute sport-specific or unified stats dynamically for the modal
        const pNameLower = selectedPlayerRow.playerName.toLowerCase();
        let modalPlayed = 0;
        let modalWins = 0;
        let modalLosses = 0;

        selectedPlayerMatches.forEach(m => {
          const isP1 = m.player1_id === selectedPlayerId || m.player1_name.toLowerCase().includes(pNameLower);
          let won = false;
          if (m.winner_id) {
            if (m.winner_id === selectedPlayerId) won = true;
            else {
              const winnerName = m.winner_id === m.player1_id ? m.player1_name : m.player2_name;
              if (winnerName.toLowerCase().includes(pNameLower)) won = true;
            }
          } else {
            const p1Sets = m.sets?.filter(s => s.is_complete && s.winner_id === m.player1_id).length || 0;
            const p2Sets = m.sets?.filter(s => s.is_complete && s.winner_id === m.player2_id).length || 0;
            won = isP1 ? p1Sets > p2Sets : p2Sets > p1Sets;
          }
          modalPlayed++;
          if (won) modalWins++;
          else modalLosses++;
        });

        const modalWinRate = modalPlayed > 0 ? Math.round((modalWins / modalPlayed) * 1000.0) / 10.0 : 0.0;
        const modalPoints = (modalWins * 10) + (modalLosses * 2);

        const selectedPlayerAchievements = getPlayerAchievements(selectedPlayerId, matches);

        return (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(10, 10, 12, 0.6)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setSelectedPlayerId(null)}
          >
            <div 
              className="modal-content-custom"
              style={{
                background: '#ffffff',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: 'var(--radius-lg)',
                width: '100%',
                maxWidth: 720,
                maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
            }}
            onClick={e => e.stopPropagation()}
            >
              {/* Modal Close */}
              <button 
                onClick={() => setSelectedPlayerId(null)}
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  background: 'rgba(0, 0, 0, 0.05)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 36,
                  height: 36,
                  color: '#0f172a',
                  fontSize: 16,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  zIndex: 10,
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.1)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)'}
              >
                <IconX size={16} />
              </button>

              {/* Header */}
              <div className="modal-header-custom" style={{ padding: '32px 32px 20px', borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    width: 60, height: 60,
                    background: 'linear-gradient(135deg, var(--accent), #3b82f6)',
                    borderRadius: 'var(--radius-full)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 24,
                    boxShadow: '0 0 20px rgba(37, 99, 235, 0.2)',
                  }}>
                    🏅
                  </div>
                  <div>
                    <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      {selectedPlayerRow.playerName}
                    </h2>
                    <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0 0' }}>
                      {selectedPlayerRow.playerEmail}
                    </p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="modal-body-custom" style={{ padding: '24px 32px 32px', display: 'flex', flexDirection: 'column', gap: 28 }}>
                
                {/* Sport Split Selector for Multi-Sport Player */}
                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0, 0, 0, 0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      🏅 Split Stats by Sport:
                    </span>
                    <div style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap' }}>
                      {['all', ...sportsPlayedByPlayer].map(s => {
                        const isSel = playerModalSport === s;
                        const label = s === 'all' ? 'All Disciplines' : s.replace('_', ' ').toUpperCase();
                        const icon = s === 'volleyball' ? '🏐' : s === 'badminton' ? '🏸' : s === 'table_tennis' ? '🏓' : s === 'squash' ? '🎾' : '🏅';
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setPlayerModalSport(s)}
                            style={{
                              padding: '4px 12px',
                              borderRadius: '16px',
                              fontSize: 11,
                              fontWeight: 700,
                              border: '1px solid',
                              borderColor: isSel ? 'var(--accent)' : 'rgba(0, 0, 0, 0.12)',
                              background: isSel ? 'rgba(37, 99, 235, 0.1)' : '#ffffff',
                              color: isSel ? 'var(--accent)' : '#475569',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              boxShadow: isSel ? '0 2px 6px rgba(37, 99, 235, 0.15)' : 'none',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <span>{icon}</span>
                            <span>{label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Statistics Grid */}
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.05em', marginBottom: 12 }}>
                    📊 Player Statistics {playerModalSport !== 'all' ? `(${playerModalSport.replace('_', ' ').toUpperCase()})` : ''}
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                    gap: 12
                  }}>
                    {[
                      { label: 'Total Played', value: modalPlayed, color: '#0f172a' },
                      { label: 'Wins', value: modalWins, color: '#16a34a' },
                      { label: 'Losses', value: modalLosses, color: '#dc2626' },
                      { label: 'Win Rate', value: `${modalWinRate}%`, color: '#0f172a' },
                      { label: 'League Points', value: modalPoints, color: 'var(--accent)', highlight: true }
                    ].map((stat, i) => (
                      <div key={i} style={{
                        background: '#f8fafc',
                        border: stat.highlight ? '1px solid var(--accent)' : '1px solid rgba(0, 0, 0, 0.08)',
                        borderRadius: 'var(--radius-md)',
                        padding: '16px 12px',
                        textAlign: 'center',
                        boxShadow: stat.highlight ? 'inset 0 0 12px rgba(37, 99, 235, 0.05)' : 'none',
                      }}>
                        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6, fontWeight: 500 }}>{stat.label}</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gamification Achievements */}
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.05em', marginBottom: 12 }}>
                    🏆 Earned Achievements ({selectedPlayerAchievements.filter(a => a.earned).length}/{selectedPlayerAchievements.length})
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                    gap: 12
                  }}>
                    {selectedPlayerAchievements.map(ach => (
                      <div
                        key={ach.id}
                        title={ach.description}
                        style={{
                          background: ach.earned ? 'rgba(37, 99, 235, 0.08)' : '#f8fafc',
                          border: ach.earned ? '1px solid rgba(37, 99, 235, 0.2)' : '1px solid rgba(0, 0, 0, 0.06)',
                          borderRadius: 'var(--radius-md)',
                          padding: '16px 12px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 8,
                          textAlign: 'center',
                          transition: 'all 0.2s',
                          cursor: 'help',
                          filter: ach.earned ? 'none' : 'grayscale(1) opacity(0.35)',
                          boxShadow: ach.earned ? '0 4px 12px rgba(37, 99, 235, 0.05)' : 'none',
                        }}
                      >
                        <div style={{
                          fontSize: 28,
                          filter: ach.earned ? 'drop-shadow(0 0 8px rgba(37, 99, 235, 0.4))' : 'none',
                        }}>
                          {ach.icon}
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: ach.earned ? '#0f172a' : '#64748b' }}>
                            {ach.name}
                          </div>
                          <div style={{ fontSize: 9, color: ach.earned ? '#16a34a' : '#64748b', marginTop: 2, fontWeight: 600 }}>
                            {ach.earned ? 'UNLOCKED' : 'LOCKED'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Matches & Narrative Highlights */}
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.05em', marginBottom: 12 }}>
                    ⚡ Recent Match Highlights {playerModalSport !== 'all' ? `(${playerModalSport.replace('_', ' ').toUpperCase()})` : ''}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {selectedPlayerMatches.slice(0, 5).map(match => {
                      const isP1 = match.player1_id === selectedPlayerId;
                      const isWinner = match.winner_id === selectedPlayerId;
                      const oppName = isP1 ? match.player2_name : match.player1_name;
                      
                      return (
                        <div key={match.id} style={{
                          background: '#f8fafc',
                          border: '1px solid rgba(0, 0, 0, 0.08)',
                          borderRadius: 'var(--radius-md)',
                          padding: 16,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 10,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{
                                padding: '3px 8px',
                                background: isWinner ? 'rgba(22, 163, 74, 0.12)' : 'rgba(220, 38, 38, 0.12)',
                                color: isWinner ? '#16a34a' : '#dc2626',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: 10,
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                              }}>
                                {isWinner ? 'WON' : 'LOST'}
                              </span>
                              <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                                vs {oppName}
                              </span>
                            </div>
                            {/* Scoreline */}
                            <div style={{ display: 'flex', gap: 6 }}>
                              {match.sets.map((s, idx) => (
                                <span key={idx} style={{
                                  padding: '2px 6px',
                                  background: '#ffffff',
                                  border: '1px solid rgba(0, 0, 0, 0.08)',
                                  borderRadius: 'var(--radius-xs)',
                                  fontSize: 11,
                                  fontFamily: 'var(--font-mono)',
                                  color: '#475569',
                                }}>
                                  {s.player1_score}-{s.player2_score}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Highlights Description */}
                          <div style={{
                            padding: '8px 12px',
                            background: '#ffffff',
                            borderLeft: '2px solid var(--accent)',
                            borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                            fontSize: 12,
                            lineHeight: '1.5',
                            color: '#334155',
                          }}>
                            {generateMatchHighlights(match)}
                          </div>
                        </div>
                      );
                    })}

                    {selectedPlayerMatches.length === 0 && (
                      <p style={{ textAlign: 'center', fontSize: 13, color: '#64748b', margin: '12px 0 0 0' }}>
                        No completed matches found for this player.
                      </p>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        );
      })()}

      <style jsx>{`
        .table-row:hover {
          background-color: var(--bg-elevated) !important;
        }
      `}</style>
    </div>
  );
}
