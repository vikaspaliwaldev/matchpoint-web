'use client';

import React, { useState, useEffect } from 'react';
import { Tournament, TournamentEvent } from '@/types';
import { getEvents, getTournaments } from '@/lib/supabase-service';
import { IconClipboard, IconTrophy, IconUsers } from '@/components/icons';

export default function AllEventsPage() {
  const [events, setEvents] = useState<TournamentEvent[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [tournamentFilter, setTournamentFilter] = useState('all');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [evs, tours] = await Promise.all([
          getEvents(),
          getTournaments()
        ]);
        setEvents(evs);
        setTournaments(tours);
      } catch (err) {
        console.error('Failed to load events directory:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const categories = Array.from(new Set(events.map(e => e.category).filter(Boolean)));

  const filteredEvents = events.filter(e => {
    if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
    if (tournamentFilter !== 'all' && e.tournament_id !== tournamentFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="glass-card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
        <div className="animate-spin" style={{ display: 'inline-block', fontSize: 24, marginBottom: 12, animation: 'spin 2s linear infinite' }}>🔄</div>
        <p style={{ fontSize: 15, fontWeight: 500 }}>Loading events directory...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>All Events Directory</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
            Monitor and coordinate all events across active tournaments ({filteredEvents.length} events)
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div className="tab-group" style={{ display: 'inline-flex' }}>
          <button
            className={`tab ${categoryFilter === 'all' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('all')}
          >
            All Categories
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              className={`tab ${categoryFilter === cat ? 'active' : ''}`}
              onClick={() => setCategoryFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <select
          className="input"
          style={{ width: 'auto', minWidth: 240 }}
          value={tournamentFilter}
          onChange={e => setTournamentFilter(e.target.value)}
        >
          <option value="all">All Tournaments</option>
          {tournaments.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* Grid of Event Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {filteredEvents.map(event => {
          const tournament = tournaments.find(t => t.id === event.tournament_id);
          const ratio = (event.registrations_count || 0) / event.entry_limit;
          
          return (
            <div key={event.id} className="glass-card animate-slide-up stagger-item" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <span className="badge badge-accent" style={{ textTransform: 'uppercase', fontSize: 10 }}>{event.category || 'Event'}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>ID: {event.id}</span>
              </div>

              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                  {event.event_name}
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ color: 'var(--accent)', display: 'inline-flex', alignItems: 'center' }}>
                    <IconTrophy size={14} />
                  </span>
                  {tournament?.name || 'Unknown Tournament'}
                </p>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Format:</span>
                  <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{event.format.replace('_', ' ')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 10 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Scoring Rules:</span>
                  <span style={{ fontWeight: 500 }}>{event.scoring_format || '21-point'} Compliant</span>
                </div>

                {/* Progress bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                  <span>Registrations Fill Ratio</span>
                  <span>{event.registrations_count || 0} / {event.entry_limit}</span>
                </div>
                <div style={{ width: '100%', height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(ratio * 100, 100)}%`,
                    height: '100%',
                    background: ratio >= 0.85 ? 'var(--score-win)' : 'var(--accent)',
                    borderRadius: 3,
                    transition: 'width 0.4s ease'
                  }} />
                </div>
              </div>
            </div>
          );
        })}

        {filteredEvents.length === 0 && (
          <div className="glass-card" style={{ gridColumn: '1/-1', padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: 15 }}>No events found matching selected filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
