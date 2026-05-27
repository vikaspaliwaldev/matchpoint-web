'use client';

import React, { useState, useEffect } from 'react';
import {
  getEvents,
  getTournaments,
  getMatches,
  getRegistrationsByEvent,
  saveMatchesBatch,
  getTeamsByTournament,
} from '@/lib/supabase-service';
import { generateKnockoutBracket } from '@/lib/fixtures';
import { Match, TournamentEvent, Tournament, Registration, Team } from '@/types';
import { IconTrophy, IconZap, IconRefreshCw } from '@/components/icons';

export default function FixturesPage() {
  const [events, setEvents] = useState<TournamentEvent[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedBracket, setGeneratedBracket] = useState<{ rounds: { round_number: number; round_name: string; matches: Match[] }[] } | null>(null);

  const [approvedRegs, setApprovedRegs] = useState<Registration[]>([]);
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
          {/* Event Selector */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              className="input"
              style={{ width: 'auto', minWidth: 280 }}
              value={selectedEvent}
              onChange={e => { setSelectedEvent(e.target.value); setGeneratedBracket(null); }}
            >
              {events.length === 0 && <option value="">No events configured</option>}
              {events.map(ev => {
                const t = tournaments.find(tt => tt.id === ev.tournament_id);
                return (
                  <option key={ev.id} value={ev.id}>
                    {t?.name || 'Tournament'} — {ev.event_name}
                  </option>
                );
              })}
            </select>

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
        </>
      )}
    </div>
  );
}

function BracketRound({
  roundName,
  matches,
  roundIndex,
}: {
  roundName: string;
  matches: Match[];
  roundIndex: number;
  totalRounds: number;
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
          <BracketMatchCard key={match.id} match={match} />
        ))}
      </div>
    </div>
  );
}

function BracketMatchCard({ match }: { match: Match }) {
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
    <div className="bracket-match" style={{
      border: isLive ? '1px solid rgba(34, 197, 94, 0.4)' : undefined,
      boxShadow: isLive ? '0 0 16px rgba(34, 197, 94, 0.15)' : undefined,
    }}>
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
          {match.court && <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>{match.court}</span>}
        </div>
      )}
      <div className={`bracket-player ${isComplete && match.winner_id === match.player1_id ? 'winner' : ''}`}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isComplete && match.winner_id === match.player1_id && <IconTrophy size={12} />}
          {match.player1_name}
        </span>
        <span className="bracket-score" style={{ fontWeight: 700 }}>
          {isComplete || isLive ? score1 : ''}
        </span>
      </div>
      <div className={`bracket-player ${isComplete && match.winner_id === match.player2_id ? 'winner' : ''}`}>
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
