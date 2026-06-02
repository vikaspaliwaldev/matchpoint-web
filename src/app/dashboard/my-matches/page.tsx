'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getMatches, getTournaments, getEvents } from '@/lib/supabase-service';
import { Match, Tournament, TournamentEvent } from '@/types';
import { IconClock, IconTrophy } from '@/components/icons';

export default function MyMatchesPage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [events, setEvents] = useState<TournamentEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function loadMatchesData() {
      try {
        setLoading(true);
        const [mats, tours, evs] = await Promise.all([
          getMatches(),
          getTournaments(),
          getEvents(),
        ]);
        setMatches(mats);
        setTournaments(tours);
        setEvents(evs);
      } catch (err) {
        console.error('Failed to load my matches:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMatchesData();
  }, [user]);

  if (!user) return null;

  if (loading) {
    return (
      <div className="glass-card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
        <div className="animate-spin" style={{ display: 'inline-block', fontSize: 24, marginBottom: 12, animation: 'spin 2s linear infinite' }}>🔄</div>
        <p style={{ fontSize: 15, fontWeight: 500 }}>Loading your matches...</p>
      </div>
    );
  }

  const myMatches = matches.filter(
    m => m.player1_id === user.id || m.player2_id === user.id
  );

  const liveMatches = myMatches.filter(m => m.status === 'running');
  const upcomingMatches = myMatches.filter(m => m.status === 'scheduled');
  const completedMatches = myMatches.filter(m => m.status === 'completed');

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>My Matches</h1>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>Track your match history and upcoming games</p>

      {liveMatches.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="live-dot" /> Live Now
          </h2>
          <div style={{ display: 'grid', gap: 12 }}>
            {liveMatches.map(match => (
              <MatchCard
                key={match.id}
                match={match}
                userId={user.id}
                tournaments={tournaments}
                events={events}
              />
            ))}
          </div>
        </div>
      )}

      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Upcoming</h2>
        {upcomingMatches.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No upcoming matches</p>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {upcomingMatches.map(match => (
              <MatchCard
                key={match.id}
                match={match}
                userId={user.id}
                tournaments={tournaments}
                events={events}
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Completed</h2>
        {completedMatches.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No completed matches yet</p>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {completedMatches.map(match => (
              <MatchCard
                key={match.id}
                match={match}
                userId={user.id}
                tournaments={tournaments}
                events={events}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MatchCard({
  match,
  userId,
  tournaments,
  events,
}: {
  match: Match;
  userId: string;
  tournaments: Tournament[];
  events: TournamentEvent[];
}) {
  const isWinner = match.winner_id === userId;
  const isLoser = match.status === 'completed' && match.winner_id !== userId;
  const isLive = match.status === 'running';

  const tournament = tournaments.find(t => t.id === match.tournament_id);
  const eventObj = events.find(e => e.id === match.event_id);
  const tourName = tournament?.name || 'Tournament';
  const eventName = eventObj?.event_name || 'Event';

  return (
    <div className="glass-card" style={{
      padding: 16,
      border: isLive ? '1px solid rgba(34, 197, 94, 0.3)' : isWinner ? '1px solid rgba(34, 197, 94, 0.2)' : undefined,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isLive && <span className="badge badge-live"><span className="live-dot" style={{ width: 5, height: 5 }} /> Live</span>}
          {isWinner && <span className="badge badge-approved"><IconTrophy size={10} /> Won</span>}
          {isLoser && <span className="badge badge-rejected">Lost</span>}
          {match.status === 'scheduled' && <span className="badge badge-open">Scheduled</span>}
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{match.court}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase' }}>
          {tourName} · {eventName}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 15,
            fontWeight: match.player1_id === userId ? 700 : 400,
            color: match.winner_id === match.player1_id ? 'var(--score-win)' : 'var(--text-primary)',
          }}>
            {match.player1_name} {match.player1_id === userId ? '(You)' : ''}
          </div>
          <div style={{
            fontSize: 15,
            fontWeight: match.player2_id === userId ? 700 : 400,
            color: match.winner_id === match.player2_id ? 'var(--score-win)' : 'var(--text-secondary)',
            marginTop: 2,
          }}>
            {match.player2_name} {match.player2_id === userId ? '(You)' : ''}
          </div>
        </div>

        {match.sets.length > 0 && (
          <div style={{ fontFamily: 'var(--font-mono)', textAlign: 'right' }}>
            {match.sets.map((s, i) => (
              <div key={i} style={{ fontSize: 14, fontWeight: 600 }}>
                {s.player1_score} - {s.player2_score}
              </div>
            ))}
          </div>
        )}
      </div>

      {match.scheduled_time && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
          <IconClock size={12} />
          {new Date(match.scheduled_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
        </div>
      )}
    </div>
  );
}
