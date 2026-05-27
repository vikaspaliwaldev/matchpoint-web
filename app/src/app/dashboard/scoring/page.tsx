'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  getMatches,
  updateMatchScore,
  getEvents,
  getTournaments,
  getTeamsByTournament,
  getPlayers,
} from '@/lib/supabase-service';
import { useAuth } from '@/lib/auth-context';
import { Match, TournamentEvent, Tournament, Team, User, TeamSubMatch, MatchSet, MatchStatus } from '@/types';
import {
  createInitialScoreState,
  addPoint,
  undoPoint,
  isDeuce,
  getGamePoint,
  ScoreState,
  SCORING_CONFIGS,
} from '@/lib/scoring';
import { IconPlay, IconPause, IconUndo, IconTrophy, IconClock, IconCheck, IconArrowLeft } from '@/components/icons';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function ScoringPage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [events, setEvents] = useState<TournamentEvent[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  useEffect(() => {
    async function loadMatches() {
      try {
        setLoading(true);
        const data = await getMatches();
        const evs = await getEvents();
        const tours = await getTournaments();
        
        setMatches(data);
        setEvents(evs);
        setTournaments(tours);
        
        const umpireMatches = data.filter(
          m => (m.status === 'running' || m.status === 'scheduled') && m.umpire_id === user?.id
        );
        const available = umpireMatches.length > 0
          ? umpireMatches
          : data.filter(m => m.status === 'running' || m.status === 'scheduled');
          
        if (available.length > 0) {
          setSelectedMatchId(available[0].id);
        }
      } catch (err) {
        console.error('Failed to load matches:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMatches();
  }, [user]);

  const umpireMatches = matches.filter(
    m => (m.status === 'running' || m.status === 'scheduled') && m.umpire_id === user?.id
  );
  const availableMatches = umpireMatches.length > 0
    ? umpireMatches
    : matches.filter(m => m.status === 'running' || m.status === 'scheduled');

  const match = matches.find(m => m.id === selectedMatchId);

  if (loading) {
    return (
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Live Scoring</h1>
        <div className="glass-card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div className="animate-spin" style={{ display: 'inline-block', fontSize: 24, marginBottom: 12, animation: 'spin 2s linear infinite' }}>🔄</div>
          <p style={{ fontSize: 15, fontWeight: 500 }}>Loading Match Fixtures...</p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Live Scoring</h1>
        <div className="empty-state">
          <div className="empty-state-icon">🏸</div>
          <p style={{ fontSize: 16, fontWeight: 500 }}>No matches assigned to you</p>
          <p style={{ fontSize: 14 }}>Ask the admin to assign you as umpire for a match</p>
        </div>
      </div>
    );
  }

  const matchEvent = events.find(e => e.id === match.event_id);
  const matchTournament = tournaments.find(t => t.id === match.tournament_id);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>Live Scoring</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
          {umpireMatches.length > 0 ? 'Your assigned matches' : 'Select a match and start scoring'}
        </p>
      </div>

      {/* Match selector */}
      <div style={{ marginBottom: 24 }}>
        <select
          className="input"
          style={{ width: 'auto', minWidth: 300 }}
          value={selectedMatchId || ''}
          onChange={e => setSelectedMatchId(e.target.value)}
        >
          {availableMatches.map(m => (
            <option key={m.id} value={m.id}>
              {m.player1_name} vs {m.player2_name} ({m.court || 'No court'})
            </option>
          ))}
        </select>
      </div>

      <ScoringInterface
        key={selectedMatchId}
        match={match}
        event={matchEvent}
        tournament={matchTournament}
        onScoreUpdated={async () => {
          const freshMatches = await getMatches();
          setMatches(freshMatches);
        }}
      />
    </div>
  );
}

function ScoringInterface({
  match,
  event,
  tournament,
  onScoreUpdated,
}: {
  match: Match;
  event?: TournamentEvent;
  tournament?: Tournament;
  onScoreUpdated: () => void;
}) {
  const scoringFormat = event?.scoring_format || '21-point';
  const scoringConfig = SCORING_CONFIGS[scoringFormat];

  // Team configurations
  const isTeamMatch = tournament?.type === 'team' || !!match.sub_matches;
  const [teams, setTeams] = useState<Team[]>([]);
  const [allPlayers, setAllPlayers] = useState<User[]>([]);
  const [activeSubMatchIdx, setActiveSubMatchIdx] = useState<number | null>(null);
  const [subMatches, setSubMatches] = useState<TeamSubMatch[]>(match.sub_matches || []);
  const [overallWinnerId, setOverallWinnerId] = useState<string | null>(match.winner_id || null);
  const [overallStatus, setOverallStatus] = useState<MatchStatus>(match.status);

  // Timers and states for standard match (reused inside sub-match)
  const [isPaused, setIsPaused] = useState(false);
  const [matchStarted, setMatchStarted] = useState(match.status === 'running');
  const [matchElapsed, setMatchElapsed] = useState(0);
  const [totalPausedTime, setTotalPausedTime] = useState(0);

  useEffect(() => {
    if (isTeamMatch) {
      async function loadRosters() {
        try {
          const teamList = await getTeamsByTournament(match.tournament_id);
          const playerList = await getPlayers();
          setTeams(teamList);
          setAllPlayers(playerList);
        } catch (err) {
          console.error('Failed to load team rosters for scoring:', err);
        }
      }
      loadRosters();
    }
  }, [isTeamMatch, match]);

  const team1 = teams.find(t => t.id === match.player1_id);
  const team2 = teams.find(t => t.id === match.player2_id);

  const team1Roster = allPlayers.filter(p => team1?.players.includes(p.id));
  const team2Roster = allPlayers.filter(p => team2?.players.includes(p.id));

  // Overall sub-match scorer trigger
  const handleScoreSubMatch = useCallback(async (subIdx: number, player: 'player1' | 'player2') => {
    if (!subMatches) return;
    const subMatch = subMatches[subIdx];
    if (subMatch.status === 'completed') return;

    const currentSets = [...subMatch.sets];
    let setIdx = currentSets.length - 1;
    if (setIdx < 0 || currentSets[setIdx].is_complete) {
      currentSets.push({
        set_number: currentSets.length + 1,
        player1_score: 0,
        player2_score: 0,
        is_complete: false,
      });
      setIdx = currentSets.length - 1;
    }

    const activeSet = { ...currentSets[setIdx] };
    if (player === 'player1') activeSet.player1_score++;
    else activeSet.player2_score++;

    // BWF set completion rules
    const pointsToWin = scoringConfig.maxPoints;
    const goldenPoint = scoringConfig.absoluteMax;
    const p1 = activeSet.player1_score;
    const p2 = activeSet.player2_score;

    let isComplete = false;
    let setWinner: string | undefined = undefined;

    if (p1 >= pointsToWin || p2 >= pointsToWin) {
      const diff = Math.abs(p1 - p2);
      if (diff >= 2 || p1 === goldenPoint || p2 === goldenPoint) {
        isComplete = true;
        setWinner = p1 > p2 ? match.player1_id : match.player2_id;
      }
    }

    activeSet.is_complete = isComplete;
    activeSet.winner_id = setWinner;
    currentSets[setIdx] = activeSet;

    // Celebration check
    const margin = tournament?.bonus_point_margin || 5;
    if (isComplete && Math.abs(p1 - p2) >= margin) {
      const winnerName = p1 > p2 ? match.player1_name : match.player2_name;
      alert(`💥 Margin Cleared! ${winnerName} wins the set by ${Math.abs(p1 - p2)} pts! Team secures a Bonus Point! 🎉`);
    }

    const nextSubMatches = [...subMatches];
    const updatedSubMatch = { ...subMatch, sets: currentSets, status: 'running' as MatchStatus };

    // Check if sub-match is complete (best of 3 sets)
    const p1Wins = currentSets.filter(s => s.winner_id === match.player1_id).length;
    const p2Wins = currentSets.filter(s => s.winner_id === match.player2_id).length;

    if (p1Wins >= 2 || p2Wins >= 2) {
      updatedSubMatch.status = 'completed';
      updatedSubMatch.winner_id = p1Wins >= 2 ? match.player1_id : match.player2_id;
    }

    nextSubMatches[subIdx] = updatedSubMatch;
    setSubMatches(nextSubMatches);

    // Calculate tie winner
    const totalTies = nextSubMatches.length;
    const needed = Math.ceil(totalTies / 2);
    const team1Wins = nextSubMatches.filter(s => s.status === 'completed' && s.winner_id === match.player1_id).length;
    const team2Wins = nextSubMatches.filter(s => s.status === 'completed' && s.winner_id === match.player2_id).length;

    let nextStatus: MatchStatus = 'running';
    let nextWinnerId: string | null = null;

    if (team1Wins >= needed) {
      nextStatus = 'completed';
      nextWinnerId = match.player1_id;
    } else if (team2Wins >= needed) {
      nextStatus = 'completed';
      nextWinnerId = match.player2_id;
    }

    setOverallStatus(nextStatus);
    setOverallWinnerId(nextWinnerId);

    try {
      await updateMatchScore(
        match.id,
        match.sets,
        nextStatus,
        nextWinnerId,
        match.actual_start_time || new Date().toISOString(),
        nextStatus === 'completed' ? new Date().toISOString() : null,
        null,
        nextSubMatches
      );
      onScoreUpdated();
    } catch (err) {
      console.error('Failed to update sub-match score in database:', err);
    }
  }, [subMatches, match, scoringConfig, tournament, onScoreUpdated]);

  const handleSubMatchUndo = useCallback(async (subIdx: number) => {
    if (!subMatches) return;
    const subMatch = subMatches[subIdx];
    if (subMatch.sets.length === 0) return;

    const currentSets = [...subMatch.sets];
    const setIdx = currentSets.length - 1;
    const activeSet = { ...currentSets[setIdx] };

    if (activeSet.is_complete) {
      activeSet.is_complete = false;
      activeSet.winner_id = undefined;
    }

    if (activeSet.player1_score === 0 && activeSet.player2_score === 0 && currentSets.length > 1) {
      currentSets.pop();
    } else {
      if (activeSet.player2_score > activeSet.player1_score) {
        activeSet.player2_score--;
      } else if (activeSet.player1_score > 0) {
        activeSet.player1_score--;
      }
      currentSets[setIdx] = activeSet;
    }

    const nextSubMatches = [...subMatches];
    nextSubMatches[subIdx] = { ...subMatch, sets: currentSets, status: 'running' };
    setSubMatches(nextSubMatches);
    setOverallWinnerId(null);
    setOverallStatus('running');

    try {
      await updateMatchScore(
        match.id,
        match.sets,
        'running',
        null,
        match.actual_start_time,
        null,
        null,
        nextSubMatches
      );
      onScoreUpdated();
    } catch (err) {
      console.error('Failed to undo sub-match score:', err);
    }
  }, [subMatches, match, onScoreUpdated]);

  const handleRosterSelect = async (subIdx: number, team: 'player1' | 'player2', slot: number, name: string) => {
    if (!subMatches) return;
    const nextSubMatches = [...subMatches];
    const subMatch = { ...nextSubMatches[subIdx] };
    
    if (team === 'player1') {
      const names = [...subMatch.player1_names];
      names[slot] = name;
      subMatch.player1_names = names.filter(Boolean);
    } else {
      const names = [...subMatch.player2_names];
      names[slot] = name;
      subMatch.player2_names = names.filter(Boolean);
    }
    
    nextSubMatches[subIdx] = subMatch;
    setSubMatches(nextSubMatches);

    try {
      await updateMatchScore(
        match.id,
        match.sets,
        match.status,
        match.winner_id,
        match.actual_start_time,
        null,
        null,
        nextSubMatches
      );
      onScoreUpdated();
    } catch (err) {
      console.error('Failed to save roster assignment:', err);
    }
  };

  // Overall calculations for scoreboard
  const team1SubWins = subMatches.filter(s => s.status === 'completed' && s.winner_id === match.player1_id).length;
  const team2SubWins = subMatches.filter(s => s.status === 'completed' && s.winner_id === match.player2_id).length;

  // Render sub-scoring panel if selected
  if (isTeamMatch && activeSubMatchIdx !== null) {
    const subMatch = subMatches[activeSubMatchIdx];
    const currentSet = subMatch.sets[subMatch.sets.length - 1];
    const p1Name = subMatch.player1_names.join(' / ') || `${match.player1_name} Player(s)`;
    const p2Name = subMatch.player2_names.join(' / ') || `${match.player2_name} Player(s)`;
    const isSubDeuce = currentSet ? isDeuce(currentSet, scoringConfig) : false;
    const isSubComplete = subMatch.status === 'completed';

    return (
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <button
          className="btn btn-ghost btn-sm"
          style={{ marginBottom: 16 }}
          onClick={() => setActiveSubMatchIdx(null)}
        >
          <IconArrowLeft size={16} /> Back to Tie Matchboard
        </button>

        <div className="glass-card" style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>
              🔥 Tie Sub-Match: {subMatch.event_type}
            </span>
            <span className="badge badge-accent">
              {scoringFormat} best of 3
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 12 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Sets Won</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>
                {subMatch.sets.filter(s => s.winner_id === match.player1_id).length}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Sets Won</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>
                {subMatch.sets.filter(s => s.winner_id === match.player2_id).length}
              </div>
            </div>
          </div>

          {isSubDeuce && !isSubComplete && (
            <div style={{ textAlign: 'center', background: 'rgba(245,158,11,0.1)', color: 'var(--score-point)', padding: '4px 12px', borderRadius: 20, marginTop: 12, fontSize: 12, fontWeight: 600 }}>
              ⚡ DEUCE ACTIVE (Absolute limit: {scoringConfig.absoluteMax})
            </div>
          )}
        </div>

        {/* Scoreboard buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <button
            className="score-button"
            onClick={() => handleScoreSubMatch(activeSubMatchIdx, 'player1')}
            disabled={isSubComplete}
          >
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>{p1Name}</div>
            <div style={{ fontSize: 64, fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
              {currentSet?.player1_score ?? 0}
            </div>
            {isSubComplete && subMatch.winner_id === match.player1_id && (
              <div style={{ color: 'var(--score-win)', marginTop: 8 }}>🏆 Winner</div>
            )}
          </button>

          <button
            className="score-button"
            onClick={() => handleScoreSubMatch(activeSubMatchIdx, 'player2')}
            disabled={isSubComplete}
          >
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>{p2Name}</div>
            <div style={{ fontSize: 64, fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
              {currentSet?.player2_score ?? 0}
            </div>
            {isSubComplete && subMatch.winner_id === match.player2_id && (
              <div style={{ color: 'var(--score-win)', marginTop: 8 }}>🏆 Winner</div>
            )}
          </button>
        </div>

        {/* Action button */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
          <button
            className="btn btn-secondary"
            onClick={() => handleSubMatchUndo(activeSubMatchIdx)}
            disabled={subMatch.sets.length === 0}
          >
            <IconUndo size={16} /> Undo Point
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setActiveSubMatchIdx(null)}
          >
            Return to Dashboard
          </button>
        </div>

        {/* Set list */}
        {subMatch.sets.length > 0 && (
          <div className="glass-card" style={{ padding: 16, marginTop: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Sets Summary</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {subMatch.sets.map((set, setIdx) => (
                <div key={setIdx} style={{ padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', minWidth: 70, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Set {set.set_number}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                    {set.player1_score} - {set.player2_score}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render Sub-Tie Matchboard view for team matches
  if (isTeamMatch) {
    const isOverallComplete = overallStatus === 'completed';
    return (
      <div style={{ maxWidth: 740, margin: '0 auto' }}>
        <div className="glass-card" style={{ padding: 24, marginBottom: 24, border: isOverallComplete ? '1px solid rgba(168,85,247,0.3)' : undefined }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>📍 COURT: {match.court || 'Court TBD'}</span>
            <span className={`badge badge-${overallStatus}`}>{overallStatus}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, margin: '12px 0' }}>
            <div style={{ textAlign: 'right', flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{match.player1_name}</div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Roster competitors</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-secondary)', padding: '6px 16px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: team1SubWins > team2SubWins ? 'var(--score-win)' : 'var(--text-primary)' }}>{team1SubWins}</span>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>TIES</span>
              <span style={{ fontSize: 24, fontWeight: 800, color: team2SubWins > team1SubWins ? 'var(--score-win)' : 'var(--text-primary)' }}>{team2SubWins}</span>
            </div>

            <div style={{ textAlign: 'left', flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{match.player2_name}</div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Roster competitors</span>
            </div>
          </div>

          {isOverallComplete && (
            <div style={{ textAlign: 'center', marginTop: 16, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
              <h4 style={{ color: 'var(--score-win)', margin: 0, fontWeight: 700 }}>
                🏆 Tie Complete! {overallWinnerId === match.player1_id ? match.player1_name : match.player2_name} Wins ({team1SubWins} - {team2SubWins})
              </h4>
            </div>
          )}
        </div>

        {/* List of sub-matches */}
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>🏸 Sub-Matches Dashboard</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {subMatches.map((sub, sIdx) => {
            const isSubComplete = sub.status === 'completed';
            const isSubRunning = sub.status === 'running';
            const isDoubles = sub.event_type.endsWith('D');
            const slots = isDoubles ? [0, 1] : [0];

            return (
              <div key={sub.id} className="glass-card" style={{ padding: 20, border: isSubRunning ? '1px solid var(--accent)' : undefined }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="badge badge-accent" style={{ fontWeight: 700 }}>{sub.event_type}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      {sub.event_type === 'MS' ? "Men's Singles" :
                       sub.event_type === 'MD' ? "Men's Doubles" :
                       sub.event_type === 'WS' ? "Women's Singles" :
                       sub.event_type === 'WD' ? "Women's Doubles" : "Mixed Doubles"}
                    </span>
                  </div>
                  <span className={`badge badge-${sub.status}`}>{sub.status}</span>
                </div>

                {/* Rosters Selection */}
                {!isOverallComplete && !isSubComplete && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 14, background: 'var(--bg-secondary)', padding: 12, borderRadius: 'var(--radius-md)' }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>{match.player1_name} Roster Selection</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {slots.map(slot => (
                          <select
                            key={slot}
                            className="input"
                            style={{ height: 32, fontSize: 12, padding: '0 8px' }}
                            value={sub.player1_names[slot] || ''}
                            onChange={e => handleRosterSelect(sIdx, 'player1', slot, e.target.value)}
                          >
                            <option value="">Select Player {slot + 1}</option>
                            {team1Roster.map(p => (
                              <option key={p.id} value={p.name}>{p.name}</option>
                            ))}
                          </select>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>{match.player2_name} Roster Selection</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {slots.map(slot => (
                          <select
                            key={slot}
                            className="input"
                            style={{ height: 32, fontSize: 12, padding: '0 8px' }}
                            value={sub.player2_names[slot] || ''}
                            onChange={e => handleRosterSelect(sIdx, 'player2', slot, e.target.value)}
                          >
                            <option value="">Select Player {slot + 1}</option>
                            {team2Roster.map(p => (
                              <option key={p.id} value={p.name}>{p.name}</option>
                            ))}
                          </select>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub Match Competitors info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: sub.winner_id === match.player1_id ? 'var(--score-win)' : 'var(--text-primary)' }}>
                      {sub.player1_names.join(' / ') || 'TBD Team 1'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{match.player1_name}</div>
                  </div>

                  {/* Sub Match Score aggregate */}
                  <div style={{ textAlign: 'center', background: 'var(--bg-secondary)', padding: '6px 12px', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                      {sub.sets.length > 0
                        ? sub.sets.map(s => `${s.player1_score}-${s.player2_score}`).join(' | ')
                        : 'No sets'}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: sub.winner_id === match.player2_id ? 'var(--score-win)' : 'var(--text-primary)' }}>
                      {sub.player2_names.join(' / ') || 'TBD Team 2'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{match.player2_name}</div>
                  </div>
                </div>

                {!isOverallComplete && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setActiveSubMatchIdx(sIdx)}
                      disabled={sub.player1_names.length === 0 || sub.player2_names.length === 0}
                    >
                      {isSubComplete ? "Edit Score" : isSubRunning ? "Resume Scoring" : "Start Scoring"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Standard Scorer Interface
  const [state, setState] = useState<ScoreState>(() => {
    if (match.sets.length > 0) {
      const p1Wins = match.sets.filter(s => s.winner_id === match.player1_id).length;
      const p2Wins = match.sets.filter(s => s.winner_id === match.player2_id).length;
      return {
        sets: [...match.sets],
        currentSet: match.sets.length - 1,
        isMatchComplete: match.status === 'completed',
        matchWinnerId: match.winner_id || null,
        player1SetsWon: p1Wins,
        player2SetsWon: p2Wins,
      };
    }
    return createInitialScoreState();
  });

  const [lastScored, setLastScored] = useState<'player1' | 'player2' | null>(null);
  const matchTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pauseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [pauseElapsed, setPauseElapsed] = useState(0);

  useEffect(() => {
    if (matchStarted && !isPaused && !state.isMatchComplete) {
      matchTimerRef.current = setInterval(() => {
        setMatchElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (matchTimerRef.current) clearInterval(matchTimerRef.current);
    };
  }, [matchStarted, isPaused, state.isMatchComplete]);

  useEffect(() => {
    if (isPaused) {
      setPauseElapsed(0);
      pauseTimerRef.current = setInterval(() => {
        setPauseElapsed(prev => prev + 1);
      }, 1000);
    } else {
      if (pauseTimerRef.current) {
        clearInterval(pauseTimerRef.current);
        setTotalPausedTime(prev => prev + pauseElapsed);
        setPauseElapsed(0);
      }
    }
    return () => {
      if (pauseTimerRef.current) clearInterval(pauseTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaused]);

  const currentSet = state.sets[state.currentSet];
  const isDeuceState = currentSet ? isDeuce(currentSet, scoringConfig) : false;
  const gamePointPlayer = currentSet ? getGamePoint(currentSet, match.player1_id, match.player2_id, scoringConfig) : null;

  const handleScore = useCallback((player: 'player1' | 'player2') => {
    if (isPaused || state.isMatchComplete) return;

    if (!matchStarted) {
      setMatchStarted(true);
    }

    setLastScored(player);
    let nextState: ScoreState | null = null;
    setState(prev => {
      nextState = addPoint(prev, player, match.player1_id, match.player2_id, scoringConfig);
      return nextState;
    });

    setTimeout(async () => {
      if (nextState) {
        try {
          const finalStatus = nextState.isMatchComplete ? 'completed' : 'running';
          await updateMatchScore(
            match.id,
            nextState.sets,
            finalStatus as any,
            nextState.matchWinnerId,
            match.actual_start_time || new Date().toISOString(),
            nextState.isMatchComplete ? new Date().toISOString() : null,
            null
          );
          onScoreUpdated();
        } catch (err) {
          console.error('Failed to update match score in database:', err);
        }
      }
    }, 0);
  }, [isPaused, state.isMatchComplete, match, matchStarted, scoringConfig, onScoreUpdated]);

  const handleUndo = useCallback(() => {
    let nextState: ScoreState | null = null;
    setState(prev => {
      nextState = undoPoint(prev);
      return nextState;
    });
    setLastScored(null);

    setTimeout(async () => {
      if (nextState) {
        try {
          const finalStatus = nextState.isMatchComplete ? 'completed' : 'running';
          await updateMatchScore(
            match.id,
            nextState.sets,
            finalStatus as any,
            nextState.matchWinnerId,
            match.actual_start_time,
            null,
            null
          );
          onScoreUpdated();
        } catch (err) {
          console.error('Failed to undo match score in database:', err);
        }
      }
    }, 0);
  }, [match, onScoreUpdated]);

  const handleReset = useCallback(async () => {
    const initialState = createInitialScoreState();
    setState(initialState);
    setIsPaused(false);
    setLastScored(null);
    setMatchStarted(false);
    setMatchElapsed(0);
    setPauseElapsed(0);
    setTotalPausedTime(0);

    try {
      await updateMatchScore(match.id, initialState.sets, 'scheduled', null, null, null, null);
      onScoreUpdated();
    } catch (err) {
      console.error('Failed to reset match score in database:', err);
    }
  }, [match, onScoreUpdated]);

  const playTime = matchElapsed - totalPausedTime;

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      {/* Match Info Header */}
      <div className="glass-card" style={{
        padding: 20,
        marginBottom: 20,
        border: state.isMatchComplete ? '1px solid rgba(168, 85, 247, 0.3)' : undefined,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{match.court || 'Court TBD'}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="badge badge-accent" style={{
              background: 'var(--accent-subtle)',
              borderColor: 'var(--accent)',
              color: 'var(--accent)',
              fontWeight: 600,
            }}>
              {scoringFormat === '11-point' ? '11-Pt BWF (Golden 15)' :
               scoringFormat === '15-point' ? '15-Pt Classic (Golden 21)' :
               '21-Pt BWF (Golden 30)'}
            </span>
            {state.isMatchComplete ? (
              <span className="badge badge-completed">Match Complete</span>
            ) : isPaused ? (
              <span className="badge badge-pending">Paused</span>
            ) : matchStarted ? (
              <span className="badge badge-live">
                <span className="live-dot" style={{ width: 5, height: 5 }} /> Live
              </span>
            ) : (
              <span className="badge badge-open">Ready</span>
            )}
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Set {state.currentSet + 1} of {state.sets.length > 2 ? 3 : 'Best of 3'}
            </span>
          </div>
        </div>

        {/* Match Timer */}
        {matchStarted && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 24,
            marginTop: 12,
            padding: '8px 0',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Elapsed</div>
              <div style={{
                fontSize: 20,
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-primary)',
              }}>
                <IconClock size={14} /> {formatTime(matchElapsed)}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Play Time</div>
              <div style={{
                fontSize: 16,
                fontWeight: 600,
                fontFamily: 'var(--font-mono)',
                color: 'var(--score-live)',
              }}>
                {formatTime(Math.max(0, playTime))}
              </div>
            </div>
            {totalPausedTime > 0 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Paused Total</div>
                <div style={{
                  fontSize: 16,
                  fontWeight: 600,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--score-point)',
                }}>
                  {formatTime(totalPausedTime)}
                </div>
              </div>
            )}
          </div>
        )}

        {isPaused && (
          <div style={{
            textAlign: 'center',
            marginTop: 12,
            padding: '10px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>⏸ Pause Duration</div>
            <div style={{
              fontSize: 32,
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: 'var(--score-point)',
            }}>
              {formatTime(pauseElapsed)}
            </div>
          </div>
        )}

        {/* Sets won indicator */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 40,
          marginTop: 12,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Sets Won</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[0, 1].map(i => (
                <div key={i} style={{
                  width: 12, height: 12, borderRadius: '50%',
                  background: i < state.player1SetsWon ? 'var(--score-win)' : 'var(--bg-elevated)',
                  border: '2px solid var(--border)',
                }} />
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Sets Won</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[0, 1].map(i => (
                <div key={i} style={{
                  width: 12, height: 12, borderRadius: '50%',
                  background: i < state.player2SetsWon ? 'var(--score-win)' : 'var(--bg-elevated)',
                  border: '2px solid var(--border)',
                }} />
              ))}
            </div>
          </div>
        </div>

        {isDeuceState && !state.isMatchComplete && (
          <div style={{
            textAlign: 'center',
            marginTop: 12,
            padding: '6px 16px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(245, 158, 11, 0.1)',
            color: 'var(--score-point)',
            fontSize: 13,
            fontWeight: 600,
          }}>
            ⚡ DEUCE
          </div>
        )}

        {gamePointPlayer && !isDeuceState && !state.isMatchComplete && (
          <div style={{
            textAlign: 'center',
            marginTop: 12,
            padding: '6px 16px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(34, 197, 94, 0.1)',
            color: 'var(--score-win)',
            fontSize: 13,
            fontWeight: 600,
          }}>
            🏆 Game Point — {gamePointPlayer === match.player1_id ? match.player1_name : match.player2_name}
          </div>
        )}
      </div>

      {/* Score Display & Buttons */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 16,
        marginBottom: 20,
      }}>
        {/* Player 1 */}
        <div>
          <button
            className="score-button"
            onClick={() => handleScore('player1')}
            disabled={isPaused || state.isMatchComplete}
            style={{
              borderColor: lastScored === 'player1' ? 'var(--accent)' : undefined,
              boxShadow: lastScored === 'player1' ? '0 0 30px var(--accent-glow)' : undefined,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>
              {match.player1_name}
            </div>
            <div className={`score-display ${lastScored === 'player1' ? 'score-animate' : ''}`}>
              {currentSet?.player1_score ?? 0}
            </div>
            {state.isMatchComplete && state.matchWinnerId === match.player1_id && (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--score-win)' }}>
                <IconTrophy size={18} /> Winner
              </div>
            )}
          </button>
        </div>

        {/* Player 2 */}
        <div>
          <button
            className="score-button"
            onClick={() => handleScore('player2')}
            disabled={isPaused || state.isMatchComplete}
            style={{
              borderColor: lastScored === 'player2' ? 'var(--accent)' : undefined,
              boxShadow: lastScored === 'player2' ? '0 0 30px var(--accent-glow)' : undefined,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>
              {match.player2_name}
            </div>
            <div className={`score-display ${lastScored === 'player2' ? 'score-animate' : ''}`}>
              {currentSet?.player2_score ?? 0}
            </div>
            {state.isMatchComplete && state.matchWinnerId === match.player2_id && (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--score-win)' }}>
                <IconTrophy size={18} /> Winner
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 24,
      }}>
        <button
          className="btn btn-secondary"
          onClick={handleUndo}
          disabled={state.isMatchComplete}
        >
          <IconUndo size={16} /> Undo
        </button>

        <button
          className={`btn ${isPaused ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setIsPaused(!isPaused)}
          disabled={state.isMatchComplete || !matchStarted}
        >
          {isPaused ? <><IconPlay size={16} /> Resume</> : <><IconPause size={16} /> Pause</>}
        </button>

        <button
          className="btn btn-danger"
          onClick={handleReset}
        >
          Reset Match
        </button>
      </div>

      {/* Set History */}
      {state.sets.length > 0 && (
        <div className="glass-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Set History</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {state.sets.map((set, i) => (
              <div key={i} style={{
                padding: '10px 16px',
                borderRadius: 'var(--radius-md)',
                background: i === state.currentSet && !set.is_complete
                  ? 'var(--accent-subtle)'
                  : 'var(--bg-secondary)',
                border: `1px solid ${i === state.currentSet && !set.is_complete ? 'var(--accent)' : 'var(--border)'}`,
                textAlign: 'center',
                minWidth: 80,
              }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                  Set {set.set_number}
                </div>
                <div style={{
                  fontSize: 20,
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                }}>
                  <span style={{
                    color: set.winner_id === match.player1_id ? 'var(--score-win)' : 'var(--text-primary)',
                  }}>
                    {set.player1_score}
                  </span>
                  <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>-</span>
                  <span style={{
                    color: set.winner_id === match.player2_id ? 'var(--score-win)' : 'var(--text-primary)',
                  }}>
                    {set.player2_score}
                  </span>
                </div>
                {set.is_complete && (
                  <div style={{ fontSize: 10, color: 'var(--score-win)', marginTop: 4 }}>
                    ✓ Complete
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Match Complete Celebration */}
      {state.isMatchComplete && (
        <div className="glass-card animate-slide-up" style={{
          padding: 32,
          textAlign: 'center',
          marginTop: 20,
          border: '1px solid rgba(34, 197, 94, 0.3)',
          background: 'rgba(34, 197, 94, 0.05)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Match Complete!</h2>
          <p style={{ fontSize: 18, color: 'var(--score-win)', fontWeight: 600 }}>
            {state.matchWinnerId === match.player1_id ? match.player1_name : match.player2_name} wins!
          </p>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8 }}>
            {state.player1SetsWon} - {state.player2SetsWon} in sets
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
            Duration: {formatTime(matchElapsed)} (Play: {formatTime(Math.max(0, playTime))}, Paused: {formatTime(totalPausedTime)})
          </p>
        </div>
      )}
    </div>
  );
}
