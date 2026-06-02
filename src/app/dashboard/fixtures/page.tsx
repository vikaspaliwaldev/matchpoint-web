'use client';

import React, { useState, useEffect } from 'react';
import {
  getEvents,
  getTournaments,
  getMatches,
  getRegistrationsByEvent,
  saveMatchesBatch,
  getTeamsByTournament,
  updateMatchPlayers,
  deleteMatch,
  createMatch,
} from '@/lib/supabase-service';
import { generateKnockoutBracket } from '@/lib/fixtures';
import { Match, TournamentEvent, Tournament, Registration, Team } from '@/types';
import { IconTrophy, IconZap, IconRefreshCw, IconX } from '@/components/icons';
import PdfReportGenerator from '@/components/PdfReportGenerator';

export default function FixturesPage() {
  const [events, setEvents] = useState<TournamentEvent[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedBracket, setGeneratedBracket] = useState<{ rounds: { round_number: number; round_name: string; matches: Match[] }[] } | null>(null);

  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [showEventSuggestions, setShowEventSuggestions] = useState(false);

  useEffect(() => {
    if (selectedEvent && events.length > 0 && tournaments.length > 0) {
      const activeEv = events.find(e => e.id === selectedEvent);
      if (activeEv) {
        const activeT = tournaments.find(t => t.id === activeEv.tournament_id);
        setEventSearchQuery(`${activeT?.name || 'Tournament'} — ${activeEv.event_name}`);
      }
    }
  }, [selectedEvent, events, tournaments]);

  const [approvedRegs, setApprovedRegs] = useState<Registration[]>([]);
  
  // Swap / Add Match Modal states
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [swapPlayer1, setSwapPlayer1] = useState('');
  const [swapPlayer2, setSwapPlayer2] = useState('');

  const [showAddMatchModal, setShowAddMatchModal] = useState(false);
  const [addRound, setAddRound] = useState(1);
  const [addPosition, setAddPosition] = useState(0);
  const [addPlayer1, setAddPlayer1] = useState('tbd');
  const [addPlayer2, setAddPlayer2] = useState('tbd');
  const [addCourt, setAddCourt] = useState('Court 1');
  const [addTime, setAddTime] = useState('');

  const handleEditMatchClick = (match: Match) => {
    setSelectedMatch(match);
    setSwapPlayer1(match.player1_id || 'tbd');
    setSwapPlayer2(match.player2_id || 'tbd');
    setShowSwapModal(true);
  };
  const [teams, setTeams] = useState<Team[]>([]);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const evs = await getEvents();
        const tours = await getTournaments();
        const mts = await getMatches();
        
        // Deduplicate unique tournaments and events
        const uniqueTours = tours.filter((t, i, self) => self.findIndex(x => x.id === t.id) === i);
        const uniqueEvents = evs.filter((e, i, self) => self.findIndex(x => x.id === e.id) === i);

        setTournaments(uniqueTours);
        setEvents(uniqueEvents);
        setMatches(mts);
        
        if (uniqueEvents.length > 0) {
          setSelectedEvent(uniqueEvents[0].id);
        }
      } catch (err) {
        console.error('Failed to load fixtures initial data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const event = events.find(e => e.id === selectedEvent);
  const tournament = event ? tournaments.find(t => t.id === event.tournament_id) : null;

  const existingMatches = matches.filter(m => m.event_id === selectedEvent);
  const hasExistingFixtures = existingMatches.length > 0;

  // Load registrations or teams depending on tournament type
  useEffect(() => {
    if (!selectedEvent || !tournament) return;
    async function loadEventData() {
      if (!tournament) return;
      try {
        const regs = await getRegistrationsByEvent(selectedEvent);
        setApprovedRegs(regs.filter(r => r.status === 'approved'));

        if (tournament.type === 'team') {
          const tms = await getTeamsByTournament(tournament.id);
          setTeams(tms);
        } else {
          setTeams([]);
        }
      } catch (err) {
        console.error('Failed to load event data:', err);
      }
    }
    loadEventData();
  }, [selectedEvent, tournament]);

  const handleGenerate = async () => {
    if (!event || !tournament) return;
    
    let competitorRegs: Registration[] = [];
    if (tournament.type === 'team') {
      if (teams.length < 2) {
        alert('Need at least 2 teams created for this tournament to generate fixtures.');
        return;
      }
      competitorRegs = teams.map((team, idx) => ({
        id: `t-reg-${team.id}`,
        tournament_id: tournament.id,
        event_id: event.id,
        player_id: team.id,
        player_name: team.name,
        player_email: 'team@matchpoint.io',
        status: 'approved' as const,
        registered_at: new Date().toISOString(),
        seed: idx + 1,
      }));
    } else {
      if (approvedRegs.length < 2) {
        alert('Need at least 2 approved registrations to generate bracket.');
        return;
      }
      competitorRegs = approvedRegs;
    }

    try {
      setGenerating(false);
      const bracket = generateKnockoutBracket({
        eventId: event.id,
        tournamentId: event.tournament_id,
        registrations: competitorRegs,
        tournamentType: tournament.type,
        teamTieEvents: tournament.team_tie_events || ['MS', 'MD', 'XD'],
      });

      const flatMatches = bracket.rounds.flatMap(r => r.matches);
      await saveMatchesBatch(flatMatches);

      // Refresh local state matches
      const updatedMatches = await getMatches();
      setMatches(updatedMatches);
      setGeneratedBracket(bracket);
      
      alert('Fixtures generated successfully!');
    } catch (err) {
      console.error('Failed to save generated fixtures:', err);
      alert('Failed to save generated fixtures.');
    }
  };

  const handleSwapSave = async () => {
    if (!selectedMatch) return;

    if (swapPlayer1 !== 'tbd' && swapPlayer1 !== 'bye' && swapPlayer1 === swapPlayer2) {
      alert("Competitor 1 and Competitor 2 cannot be the same player/team.");
      return;
    }
    
    let name1 = 'TBD';
    let name2 = 'TBD';
    
    if (swapPlayer1 === 'bye') name1 = 'BYE';
    else if (swapPlayer1 === 'tbd') name1 = 'TBD';
    else {
      const comp = tournament?.type === 'team'
        ? teams.find(t => t.id === swapPlayer1)
        : approvedRegs.find(r => r.player_id === swapPlayer1);
      name1 = tournament?.type === 'team' ? (comp as Team)?.name : (comp as Registration)?.player_name || 'TBD';
    }

    if (swapPlayer2 === 'bye') name2 = 'BYE';
    else if (swapPlayer2 === 'tbd') name2 = 'TBD';
    else {
      const comp = tournament?.type === 'team'
        ? teams.find(t => t.id === swapPlayer2)
        : approvedRegs.find(r => r.player_id === swapPlayer2);
      name2 = tournament?.type === 'team' ? (comp as Team)?.name : (comp as Registration)?.player_name || 'TBD';
    }

    try {
      await updateMatchPlayers(selectedMatch.id, name1, name2, swapPlayer1, swapPlayer2);
      
      setMatches(prev => prev.map(m => m.id === selectedMatch.id ? {
        ...m,
        player1_id: swapPlayer1,
        player1_name: name1,
        player2_id: swapPlayer2,
        player2_name: name2
      } : m));
      
      setShowSwapModal(false);
      setSelectedMatch(null);
    } catch (err) {
      console.error('Failed to swap competitors:', err);
      alert('Failed to swap competitors.');
    }
  };

  const handleAddMatchSave = async () => {
    if (!selectedEvent || !tournament) return;

    if (addPlayer1 !== 'tbd' && addPlayer1 !== 'bye' && addPlayer1 === addPlayer2) {
      alert("Competitor 1 and Competitor 2 cannot be the same player/team.");
      return;
    }
    
    let name1 = 'TBD';
    let name2 = 'TBD';
    
    if (addPlayer1 === 'bye') name1 = 'BYE';
    else if (addPlayer1 === 'tbd') name1 = 'TBD';
    else {
      const comp = tournament.type === 'team'
        ? teams.find(t => t.id === addPlayer1)
        : approvedRegs.find(r => r.player_id === addPlayer1);
      name1 = tournament.type === 'team' ? (comp as Team)?.name : (comp as Registration)?.player_name || 'TBD';
    }

    if (addPlayer2 === 'bye') name2 = 'BYE';
    else if (addPlayer2 === 'tbd') name2 = 'TBD';
    else {
      const comp = tournament.type === 'team'
        ? teams.find(t => t.id === addPlayer2)
        : approvedRegs.find(r => r.player_id === addPlayer2);
      name2 = tournament.type === 'team' ? (comp as Team)?.name : (comp as Registration)?.player_name || 'TBD';
    }

    const newMatch: Match = {
      id: `m-custom-${Date.now()}`,
      tournament_id: tournament.id,
      event_id: selectedEvent,
      fixture_round: Number(addRound),
      fixture_position: Number(addPosition),
      player1_id: addPlayer1,
      player1_name: name1,
      player2_id: addPlayer2,
      player2_name: name2,
      court: addCourt || undefined,
      scheduled_time: addTime || undefined,
      status: 'scheduled',
      sets: [],
    };

    try {
      await createMatch(newMatch);
      setMatches(prev => [...prev, newMatch]);
      setShowAddMatchModal(false);
    } catch (err) {
      console.error('Failed to add custom match:', err);
      alert('Failed to add custom match.');
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm('Are you sure you want to delete this match permanently?')) return;
    try {
      await deleteMatch(matchId);
      setMatches(prev => prev.filter(m => m.id !== matchId));
    } catch (err) {
      console.error('Failed to delete match:', err);
      alert('Failed to delete match.');
    }
  };

  // Group existing matches by round
  const matchesByRound = existingMatches.reduce((acc, m) => {
    if (!acc[m.fixture_round]) acc[m.fixture_round] = [];
    acc[m.fixture_round].push(m);
    return acc;
  }, {} as Record<number, Match[]>);

  const roundNames = (roundNum: number, total: number) => {
    const fromFinal = total - roundNum;
    switch (fromFinal) {
      case 0: return 'Final';
      case 1: return 'Semi Finals';
      case 2: return 'Quarter Finals';
      default: return `Round ${roundNum + 1}`;
    }
  };

  const totalRounds = Math.max(...Object.keys(matchesByRound).map(Number), 0) + 1;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>Fixtures & Brackets</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>Generate and view tournament brackets</p>
      </div>

      {loading ? (
        <div className="glass-card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div className="animate-spin" style={{ display: 'inline-block', fontSize: 24, marginBottom: 12, animation: 'spin 2s linear infinite' }}>🔄</div>
          <p style={{ fontSize: 15, fontWeight: 500 }}>Loading Tournaments & Fixtures...</p>
        </div>
      ) : (
        <>
          {/* Searchable Event Selector */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: 340 }}>
              <input
                className="input"
                placeholder="🔍 Search tournament or event..."
                value={eventSearchQuery}
                onChange={e => {
                  setEventSearchQuery(e.target.value);
                  setShowEventSuggestions(true);
                }}
                onFocus={() => setShowEventSuggestions(true)}
                onBlur={() => setTimeout(() => setShowEventSuggestions(false), 200)}
                style={{ paddingRight: 32 }}
              />
              <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
                ▼
              </span>

              {showEventSuggestions && (
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
                  maxHeight: 240,
                  overflowY: 'auto',
                  marginTop: 4,
                }}>
                  {events
                    .map(ev => {
                      const t = tournaments.find(tt => tt.id === ev.tournament_id);
                      const label = `${t?.name || 'Tournament'} — ${ev.event_name}`;
                      return { ev, label };
                    })
                    .filter(item => item.label.toLowerCase().includes(eventSearchQuery.toLowerCase()))
                    .map(item => (
                      <div
                        key={item.ev.id}
                        style={{
                          padding: '10px 12px',
                          fontSize: 13,
                          cursor: 'pointer',
                          borderBottom: '1px solid var(--border)',
                          color: item.ev.id === selectedEvent ? 'var(--accent)' : 'var(--text-primary)',
                          background: item.ev.id === selectedEvent ? 'var(--accent-subtle)' : 'transparent',
                        }}
                        onClick={() => {
                          setSelectedEvent(item.ev.id);
                          setEventSearchQuery(item.label);
                          setGeneratedBracket(null);
                          setShowEventSuggestions(false);
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-subtle)'}
                        onMouseLeave={e => e.currentTarget.style.background = item.ev.id === selectedEvent ? 'var(--accent-subtle)' : 'transparent'}
                      >
                        🏸 {item.label}
                      </div>
                    ))
                  }
                  {events.length === 0 && (
                    <div style={{ padding: 12, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
                      No events configured
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              className="btn btn-primary"
              onClick={handleGenerate}
              disabled={tournament?.type === 'team' ? teams.length < 2 : approvedRegs.length < 2}
            >
              {hasExistingFixtures || generatedBracket
                ? <><IconRefreshCw size={16} /> Regenerate Bracket</>
                : <><IconZap size={16} /> Generate Bracket</>
              }
            </button>

            {hasExistingFixtures && (
              <>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setAddRound(1);
                    setAddPosition(0);
                    setAddPlayer1('tbd');
                    setAddPlayer2('tbd');
                    setAddCourt('Court 1');
                    setAddTime('');
                    setShowAddMatchModal(true);
                  }}
                >
                  ➕ Add Custom Match
                </button>
                {tournament && event && (
                  <PdfReportGenerator
                    tournament={tournament}
                    event={event}
                    matches={existingMatches}
                  />
                )}
              </>
            )}
          </div>

          {event && tournament && (
            <div style={{ marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <span className="badge badge-accent">Category: {event.category}</span>
              <span className="badge" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                Format: {event.format}
              </span>
              <span className="badge" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                Type: {tournament.type}
              </span>
              <span className="badge" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                {tournament.type === 'team' ? `${teams.length} teams created` : `${approvedRegs.length} approved players`}
              </span>
              {tournament.type === 'team' && teams.length < 2 && (
                <span style={{ fontSize: 13, color: 'var(--score-loss)' }}>
                  ⚠ Need at least 2 teams to generate bracket
                </span>
              )}
              {tournament.type === 'individual' && approvedRegs.length < 2 && (
                <span style={{ fontSize: 13, color: 'var(--score-loss)' }}>
                  ⚠ Need at least 2 approved player registrations to generate bracket
                </span>
              )}
            </div>
          )}

          {/* Bracket Display */}
          {(generatedBracket || hasExistingFixtures) && (
            <div style={{
              overflowX: 'auto',
              padding: '20px 0',
            }}>
              <div style={{
                display: 'flex',
                gap: 40,
                alignItems: 'flex-start',
                minWidth: 'fit-content',
              }}>
                {generatedBracket ? (
                  generatedBracket.rounds.map((round, i) => (
                    <BracketRound
                      key={i}
                      roundName={round.round_name}
                      matches={round.matches}
                      roundIndex={i}
                      totalRounds={generatedBracket.rounds.length}
                      onEdit={handleEditMatchClick}
                      onDelete={handleDeleteMatch}
                    />
                  ))
                ) : (
                  Object.entries(matchesByRound)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([roundNum, matches]) => (
                      <BracketRound
                        key={roundNum}
                        roundName={roundNames(Number(roundNum), totalRounds)}
                        matches={matches}
                        roundIndex={Number(roundNum)}
                        totalRounds={totalRounds}
                        onEdit={handleEditMatchClick}
                        onDelete={handleDeleteMatch}
                      />
                    ))
                )}
              </div>
            </div>
          )}

          {!hasExistingFixtures && !generatedBracket && (
            <div className="empty-state" style={{ marginTop: 40 }}>
              <div className="empty-state-icon">🏸</div>
              <p style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>No fixtures generated yet</p>
              <p style={{ fontSize: 14 }}>Select an event and click &quot;Generate Bracket&quot; to create fixtures</p>
            </div>
          )}

          {/* Swap Competitors Modal */}
          {showSwapModal && selectedMatch && (
            <div className="modal-overlay">
              <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 480, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 700 }}>Swap / Assign Competitors</h2>
                  <button className="btn btn-ghost btn-icon" onClick={() => { setShowSwapModal(false); setSelectedMatch(null); }}><IconX size={18} /></button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label className="label" style={{ marginBottom: 6, display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Competitor 1</label>
                    <select
                      className="input"
                      value={swapPlayer1}
                      onChange={e => setSwapPlayer1(e.target.value)}
                    >
                      <option value="tbd">TBD (To Be Decided)</option>
                      <option value="bye">BYE (Free Pass)</option>
                      {tournament?.type === 'team' ? (
                        teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)
                      ) : (
                        approvedRegs.map(r => <option key={r.player_id} value={r.player_id}>{r.player_name}</option>)
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="label" style={{ marginBottom: 6, display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Competitor 2</label>
                    <select
                      className="input"
                      value={swapPlayer2}
                      onChange={e => setSwapPlayer2(e.target.value)}
                    >
                      <option value="tbd">TBD (To Be Decided)</option>
                      <option value="bye">BYE (Free Pass)</option>
                      {tournament?.type === 'team' ? (
                        teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)
                      ) : (
                        approvedRegs.map(r => <option key={r.player_id} value={r.player_id}>{r.player_name}</option>)
                      )}
                    </select>
                  </div>
                </div>

                {swapPlayer1 !== 'tbd' && swapPlayer1 !== 'bye' && swapPlayer1 === swapPlayer2 && (
                  <div style={{ color: '#ef4444', fontSize: 13, marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
                    <span>⚠️</span> Competitor 1 and Competitor 2 cannot be the same.
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                  <button className="btn btn-secondary" onClick={() => { setShowSwapModal(false); setSelectedMatch(null); }}>Cancel</button>
                  <button
                    className="btn btn-primary"
                    onClick={handleSwapSave}
                    disabled={swapPlayer1 !== 'tbd' && swapPlayer1 !== 'bye' && swapPlayer1 === swapPlayer2}
                    style={{
                      opacity: (swapPlayer1 !== 'tbd' && swapPlayer1 !== 'bye' && swapPlayer1 === swapPlayer2) ? 0.6 : 1,
                      cursor: (swapPlayer1 !== 'tbd' && swapPlayer1 !== 'bye' && swapPlayer1 === swapPlayer2) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add Custom Match Modal */}
          {showAddMatchModal && (
            <div className="modal-overlay">
              <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 700 }}>Add Custom Match</h2>
                  <button className="btn btn-ghost btn-icon" onClick={() => setShowAddMatchModal(false)}><IconX size={18} /></button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <label className="label" style={{ marginBottom: 6, display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Round Number</label>
                      <input
                        type="number"
                        className="input"
                        min={1}
                        value={addRound}
                        onChange={e => setAddRound(Number(e.target.value))}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="label" style={{ marginBottom: 6, display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Position (0-indexed)</label>
                      <input
                        type="number"
                        className="input"
                        min={0}
                        value={addPosition}
                        onChange={e => setAddPosition(Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label" style={{ marginBottom: 6, display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Competitor 1</label>
                    <select
                      className="input"
                      value={addPlayer1}
                      onChange={e => setAddPlayer1(e.target.value)}
                    >
                      <option value="tbd">TBD (To Be Decided)</option>
                      <option value="bye">BYE (Free Pass)</option>
                      {tournament?.type === 'team' ? (
                        teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)
                      ) : (
                        approvedRegs.map(r => <option key={r.player_id} value={r.player_id}>{r.player_name}</option>)
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="label" style={{ marginBottom: 6, display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Competitor 2</label>
                    <select
                      className="input"
                      value={addPlayer2}
                      onChange={e => setAddPlayer2(e.target.value)}
                    >
                      <option value="tbd">TBD (To Be Decided)</option>
                      <option value="bye">BYE (Free Pass)</option>
                      {tournament?.type === 'team' ? (
                        teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)
                      ) : (
                        approvedRegs.map(r => <option key={r.player_id} value={r.player_id}>{r.player_name}</option>)
                      )}
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <label className="label" style={{ marginBottom: 6, display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Court</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="Court 1"
                        value={addCourt}
                        onChange={e => setAddCourt(e.target.value)}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="label" style={{ marginBottom: 6, display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Scheduled Time</label>
                      <input
                        type="datetime-local"
                        className="input"
                        value={addTime}
                        onChange={e => setAddTime(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {addPlayer1 !== 'tbd' && addPlayer1 !== 'bye' && addPlayer1 === addPlayer2 && (
                  <div style={{ color: '#ef4444', fontSize: 13, marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
                    <span>⚠️</span> Competitor 1 and Competitor 2 cannot be the same.
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                  <button className="btn btn-secondary" onClick={() => setShowAddMatchModal(false)}>Cancel</button>
                  <button
                    className="btn btn-primary"
                    onClick={handleAddMatchSave}
                    disabled={addPlayer1 !== 'tbd' && addPlayer1 !== 'bye' && addPlayer1 === addPlayer2}
                    style={{
                      opacity: (addPlayer1 !== 'tbd' && addPlayer1 !== 'bye' && addPlayer1 === addPlayer2) ? 0.6 : 1,
                      cursor: (addPlayer1 !== 'tbd' && addPlayer1 !== 'bye' && addPlayer1 === addPlayer2) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Add Match
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function BracketRound({
  roundName,
  matches,
  roundIndex,
  onEdit,
  onDelete,
}: {
  roundName: string;
  matches: Match[];
  roundIndex: number;
  totalRounds: number;
  onEdit: (match: Match) => void;
  onDelete: (matchId: string) => void;
}) {
  const gap = Math.pow(2, roundIndex) * 20;

  return (
    <div style={{ minWidth: 240 }}>
      <div style={{
        fontSize: 13,
        fontWeight: 600,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: 16,
        textAlign: 'center',
      }}>
        {roundName}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap, justifyContent: 'center' }}>
        {matches.map(match => (
          <BracketMatchCard
            key={match.id}
            match={match}
            onEdit={() => onEdit(match)}
            onDelete={() => onDelete(match.id)}
          />
        ))}
      </div>
    </div>
  );
}

function BracketMatchCard({
  match,
  onEdit,
  onDelete
}: {
  match: Match;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isLive = match.status === 'running';
  const isComplete = match.status === 'completed';

  // Calculate scores: set count or sub-matches count
  let score1 = 0;
  let score2 = 0;
  if (match.sub_matches && match.sub_matches.length > 0) {
    match.sub_matches.forEach(sub => {
      if (sub.status === 'completed' && sub.winner_id) {
        if (sub.winner_id === match.player1_id) score1 += 1;
        else score2 += 1;
      }
    });
  } else {
    match.sets.forEach(s => {
      if (s.is_complete && s.winner_id) {
        if (s.winner_id === match.player1_id) score1 += 1;
        else score2 += 1;
      }
    });
  }

  return (
    <div
      className="bracket-match"
      onClick={onEdit}
      style={{
        position: 'relative',
        cursor: 'pointer',
        border: isLive ? '1px solid rgba(34, 197, 94, 0.4)' : undefined,
        boxShadow: isLive ? '0 0 16px rgba(34, 197, 94, 0.15)' : undefined,
      }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        title="Delete Match"
        style={{
          position: 'absolute',
          top: 6,
          right: 6,
          background: 'rgba(239, 68, 68, 0.1)',
          border: 'none',
          borderRadius: '50%',
          width: 22,
          height: 22,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--score-loss)',
          fontSize: 10,
          opacity: 0.5,
          zIndex: 10,
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
        onMouseLeave={e => e.currentTarget.style.opacity = '0.5'}
      >
        🗑️
      </button>

      {isLive && (
        <div style={{
          padding: '4px 8px',
          background: 'rgba(34, 197, 94, 0.1)',
          fontSize: 10,
          fontWeight: 600,
          color: 'var(--score-live)',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}>
          <span className="live-dot" style={{ width: 5, height: 5 }} /> LIVE
          {match.court && <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', marginRight: 24 }}>{match.court}</span>}
        </div>
      )}
      
      <div className={`bracket-player ${isComplete && match.winner_id === match.player1_id ? 'winner' : ''}`} style={{ paddingRight: 24 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isComplete && match.winner_id === match.player1_id && <IconTrophy size={12} />}
          {match.player1_name}
        </span>
        <span className="bracket-score" style={{ fontWeight: 700 }}>
          {isComplete || isLive ? score1 : ''}
        </span>
      </div>
      
      <div className={`bracket-player ${isComplete && match.winner_id === match.player2_id ? 'winner' : ''}`} style={{ paddingRight: 24 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isComplete && match.winner_id === match.player2_id && <IconTrophy size={12} />}
          {match.player2_name}
        </span>
        <span className="bracket-score" style={{ fontWeight: 700 }}>
          {isComplete || isLive ? score2 : ''}
        </span>
      </div>
    </div>
  );
}
