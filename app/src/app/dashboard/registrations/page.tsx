'use client';

import React, { useState, useEffect } from 'react';
import { Registration, RegistrationStatus, Tournament, TournamentEvent } from '@/types';
import { IconCheck, IconX, IconUsers } from '@/components/icons';
import {
  getRegistrations,
  getTournaments,
  getEvents,
  updateRegistrationStatus,
  disqualifyPlayer,
} from '@/lib/supabase-service';

export default function RegistrationsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [events, setEvents] = useState<TournamentEvent[]>([]);
  const [filterStatus, setFilterStatus] = useState<RegistrationStatus | 'all'>('all');
  const [filterTournament, setFilterTournament] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [disqualifyId, setDisqualifyId] = useState<string | null>(null);
  const [disqualifyReason, setDisqualifyReason] = useState('');

  // Dynamic database load on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [regsData, toursData, eventsData] = await Promise.all([
          getRegistrations(),
          getTournaments(),
          getEvents(),
        ]);
        setRegistrations(regsData);
        setTournaments(toursData);
        setEvents(eventsData);
      } catch (err) {
        console.error('Failed to load registrations page data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = registrations.filter(r => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (filterTournament !== 'all' && r.tournament_id !== filterTournament) return false;
    return true;
  });

  // Dynamic database update with local state synchrony
  const handleStatusChange = async (id: string, status: RegistrationStatus) => {
    try {
      await updateRegistrationStatus(id, status);
      setRegistrations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    } catch (err) {
      console.error('Failed to update registration status in database:', err);
      alert('Failed to update registration status. Please check your Supabase connection and try again.');
    }
  };

  const pendingCount = registrations.filter(r => r.status === 'pending').length;

  if (loading) {
    return (
      <div className="glass-card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
        <div className="animate-spin" style={{ display: 'inline-block', fontSize: 24, marginBottom: 12, animation: 'spin 2s linear infinite' }}>🔄</div>
        <p style={{ fontSize: 15, fontWeight: 500 }}>Loading Registrations...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Registrations</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
            Manage player registrations across tournaments
            {pendingCount > 0 && (
              <span className="badge badge-pending" style={{ marginLeft: 8 }}>{pendingCount} pending</span>
            )}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div className="tab-group" style={{ display: 'inline-flex' }}>
          {(['all', 'pending', 'approved', 'rejected', 'waitlisted'] as const).map(status => (
            <button
              key={status}
              className={`tab ${filterStatus === status ? 'active' : ''}`}
              onClick={() => setFilterStatus(status)}
              style={{ textTransform: 'capitalize' }}
            >
              {status}
            </button>
          ))}
        </div>

        <select
          className="input"
          style={{ width: 'auto', minWidth: 200 }}
          value={filterTournament}
          onChange={e => setFilterTournament(e.target.value)}
        >
          <option value="all">All Tournaments</option>
          {tournaments.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Player</th>
              <th>Email</th>
              <th>Tournament</th>
              <th>Event</th>
              <th>Seed</th>
              <th>Status</th>
              <th>Registered</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(reg => {
              const tournament = tournaments.find(t => t.id === reg.tournament_id);
              const eventObj = events.find(e => e.id === reg.event_id);
              return (
                <tr key={reg.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 700,
                        color: '#fff',
                        flexShrink: 0,
                      }}>
                        {reg.player_name.charAt(0)}
                      </div>
                      <span style={{ fontWeight: 500 }}>{reg.player_name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{reg.player_email}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{tournament?.name || reg.tournament_id}</td>
                  <td>{eventObj?.event_name || reg.event_id}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {reg.seed ? `#${reg.seed}` : '—'}
                  </td>
                  <td>
                    <span className={`badge badge-${reg.status}`}>{reg.status}</span>
                    {reg.status === 'disqualified' && reg.disqualification_reason && (
                      <div style={{ fontSize: 11, color: 'var(--score-loss)', marginTop: 4 }}>
                        Reason: {reg.disqualification_reason}
                      </div>
                    )}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                    {new Date(reg.registered_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {reg.status === 'pending' && (
                        <>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--score-win)' }}
                            onClick={() => handleStatusChange(reg.id, 'approved')}
                            title="Approve"
                          >
                            <IconCheck size={16} />
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--score-loss)' }}
                            onClick={() => handleStatusChange(reg.id, 'rejected')}
                            title="Reject"
                          >
                            <IconX size={16} />
                          </button>
                        </>
                      )}
                      {reg.status === 'waitlisted' && (
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--score-win)' }}
                          onClick={() => handleStatusChange(reg.id, 'approved')}
                        >
                          <IconCheck size={14} /> Approve
                        </button>
                      )}
                      {reg.status === 'approved' && (
                        <>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--text-muted)', fontSize: 12 }}
                            onClick={() => handleStatusChange(reg.id, 'waitlisted')}
                          >
                            Waitlist
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--score-loss)', fontSize: 12 }}
                            onClick={() => setDisqualifyId(reg.id)}
                          >
                            Disqualify
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <div className="empty-state-icon">📋</div>
          <p>No registrations match your filters</p>
        </div>
      )}

      {disqualifyId && (
        <div className="modal-overlay" onClick={() => setDisqualifyId(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>Disqualify Player</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setDisqualifyId(null)}><IconX size={18} /></button>
            </div>
            <form onSubmit={async e => {
              e.preventDefault();
              try {
                await disqualifyPlayer(disqualifyId, disqualifyReason);
                setRegistrations(prev => prev.map(r => r.id === disqualifyId ? { ...r, status: 'disqualified', disqualification_reason: disqualifyReason } : r));
                setDisqualifyId(null);
                setDisqualifyReason('');
              } catch (err) {
                console.error(err);
                alert('Failed to disqualify player.');
              }
            }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="input-group">
                <label className="input-label" htmlFor="disq-reason">Reason for Disqualification *</label>
                <textarea id="disq-reason" className="input" placeholder="e.g. Failure to report to court / Unsportsmanlike conduct..." value={disqualifyReason} onChange={e => setDisqualifyReason(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', background: 'var(--score-loss)' }}>
                Confirm Disqualification
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
