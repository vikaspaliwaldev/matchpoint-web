'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Match, User, TournamentEvent, Tournament } from '@/types';
import { getLeaderboard, getMatches, getEvents, getTournaments } from '@/lib/supabase-service';
import { IconShuttlecock, IconTrophy, IconActivity, IconUsers, IconX, IconClock } from '@/components/icons';
import ShuttlecockLoader from '@/components/ShuttlecockLoader';
import { getPlayerAchievements } from '@/lib/achievements';
import { generateMatchHighlights } from '@/lib/highlights';

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
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [events, setEvents] = useState<TournamentEvent[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTourIds, setSelectedTourIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Standings Category Tabs
  const [leaderboardTab, setLeaderboardTab] = useState<'singles' | 'doubles'>('singles');

  // Professional BAI ranking filters state
  const [selectedAgeCat, setSelectedAgeCat] = useState<string>('all');
  const [selectedEventType, setSelectedEventType] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');

  // Head-to-Head selection states
  const [playerAId, setPlayerAId] = useState('');
  const [playerBId, setPlayerBId] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, leaderboardTab, selectedAgeCat, selectedEventType, selectedGender, selectedTourIds]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [boardData, matchesData, eventsData, tournamentsData] = await Promise.all([
        getLeaderboard(),
        getMatches(),
        getEvents(),
        getTournaments()
      ]);
      setLeaderboard(boardData);
      setMatches(matchesData);
      setEvents(eventsData);
      setTournaments(tournamentsData);
      
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
    const isFilteringActive = selectedAgeCat !== 'all' || selectedEventType !== 'all' || selectedGender !== 'all';
    const filteredByActivity = isFilteringActive
      ? mapped.filter(p => p.played > 0)
      : mapped;

    return filteredByActivity.sort((a, b) => b.points - a.points || b.winRate - a.winRate || b.played - a.played);
  }, [leaderboard, matches, events, leaderboardTab, selectedAgeCat, selectedEventType, selectedGender, selectedTourIds]);

  const filteredBoard = displayLeaderboard.filter(r =>
    r.playerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.playerEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalItems = filteredBoard.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedBoard = React.useMemo(() => {
    return filteredBoard.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredBoard, currentPage]);

  const playerA = displayLeaderboard.find(r => r.playerId === playerAId);
  const playerB = displayLeaderboard.find(r => r.playerId === playerBId);

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
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      {/* Navbar */}
      <nav className="nav">
        <div className="container-app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{
              width: 36, height: 36,
              background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
              borderRadius: 'var(--radius-md)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <IconShuttlecock size={20} />
            </div>
            <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>MatchPoint</span>
          </Link>
          <div style={{ display: 'flex', gap: 16 }}>
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
              
              {/* Category selector tabs */}
              <div className="tab-group" style={{ display: 'inline-flex' }}>
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
                tournaments={tournaments}
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
                  }}
                  style={{ height: 36, fontSize: 13, padding: '0 10px', background: 'var(--bg-primary)' }}
                >
                  <option value="all">All Events (Unified)</option>
                  <option value="SINGLES">Singles (MS / WS / BS / GS)</option>
                  <option value="DOUBLES">Doubles (MD / WD / BD / GD)</option>
                  <option value="MIXED_DOUBLES">Mixed Doubles (XD / MXD)</option>
                  <option value="TEAM">Team Ties</option>
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

          <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
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
                  const isPodium = rank <= 3;
                  const podiumEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉';
                  
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
                      onClick={() => setSelectedPlayerId(row.playerId)}
                    >
                      <td style={{ padding: '16px 20px', fontWeight: 700, fontSize: isPodium ? 18 : 14 }}>
                        {isPodium ? podiumEmoji : `#${rank}`}
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
        </section>

        {/* Head-to-Head Comparison Section - NOW ON BOTTOM! */}
        {leaderboard.length > 1 && (
          <section className="glass-card" style={{ padding: 28 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              ⚔️ Head-to-Head Comparison
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 24, alignItems: 'center', marginBottom: 24 }}>
              {/* Select Player A */}
              <SearchablePlayerSelect
                label="Player A"
                selectedId={playerAId}
                onSelect={setPlayerAId}
                excludeId={playerBId}
                players={displayLeaderboard}
              />

              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-muted)', paddingTop: 20 }}>VS</div>

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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 1fr', gap: 16, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
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
          </section>
        )}
      </main>

      {/* Player Details Modal */}
      {(() => {
        if (!selectedPlayerId) return null;
        const selectedPlayerRow = leaderboard.find(r => r.playerId === selectedPlayerId);
        if (!selectedPlayerRow) return null;

        const selectedPlayerMatches = matches.filter(
          m => m.status === 'completed' && (m.player1_id === selectedPlayerId || m.player2_id === selectedPlayerId)
        );

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
            <div style={{
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
              <div style={{ padding: '32px 32px 20px', borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    width: 60, height: 60,
                    background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
                    borderRadius: 'var(--radius-full)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 24,
                    boxShadow: '0 0 20px rgba(139, 92, 246, 0.2)',
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
              <div style={{ padding: '24px 32px 32px', display: 'flex', flexDirection: 'column', gap: 28 }}>
                
                {/* Statistics Grid */}
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.05em', marginBottom: 12 }}>
                    📊 Player Statistics
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                    gap: 12
                  }}>
                    {[
                      { label: 'Total Played', value: selectedPlayerRow.played, color: '#0f172a' },
                      { label: 'Wins', value: selectedPlayerRow.wins, color: '#16a34a' },
                      { label: 'Losses', value: selectedPlayerRow.losses, color: '#dc2626' },
                      { label: 'Win Rate', value: `${selectedPlayerRow.winRate}%`, color: '#0f172a' },
                      { label: 'League Points', value: selectedPlayerRow.points, color: 'var(--accent)', highlight: true }
                    ].map((stat, i) => (
                      <div key={i} style={{
                        background: '#f8fafc',
                        border: stat.highlight ? '1px solid var(--accent)' : '1px solid rgba(0, 0, 0, 0.08)',
                        borderRadius: 'var(--radius-md)',
                        padding: '16px 12px',
                        textAlign: 'center',
                        boxShadow: stat.highlight ? 'inset 0 0 12px rgba(99, 102, 241, 0.05)' : 'none',
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
                          background: ach.earned ? 'rgba(99, 102, 241, 0.08)' : '#f8fafc',
                          border: ach.earned ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid rgba(0, 0, 0, 0.06)',
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
                          boxShadow: ach.earned ? '0 4px 12px rgba(99, 102, 241, 0.05)' : 'none',
                        }}
                      >
                        <div style={{
                          fontSize: 28,
                          filter: ach.earned ? 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.4))' : 'none',
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
                    🏸 Recent Match Highlights
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
