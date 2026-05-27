'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { mockTournaments, mockEvents, mockRegistrations } from '@/lib/mock-data';
import { useAuth } from '@/lib/auth-context';
import { IconCalendar, IconMapPin, IconTrophy, IconCheck } from '@/components/icons';

export default function MyTournamentsPage() {
  const { user } = useAuth();
  const [toast, setToast] = useState<string | null>(null);

  const openTournaments = mockTournaments.filter(t => t.status === 'open' || t.status === 'live');

  const handleRegister = (tournamentId: string, eventId: string) => {
    if (!user) return;
    const existing = mockRegistrations.find(
      r => r.player_id === user.id && r.event_id === eventId
    );
    if (existing) {
      setToast('Already registered for this event');
    } else {
      mockRegistrations.push({
        id: `r${Date.now()}`,
        tournament_id: tournamentId,
        event_id: eventId,
        player_id: user.id,
        player_name: user.name,
        player_email: user.email,
        status: 'pending',
        registered_at: new Date().toISOString(),
      });
      setToast('Registration submitted! Awaiting approval.');
    }
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Browse Tournaments</h1>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>Register for open tournaments</p>

      <div style={{ display: 'grid', gap: 20 }}>
        {openTournaments.map(t => {
          const events = mockEvents.filter(e => e.tournament_id === t.id);
          return (
            <div key={t.id} className="glass-card" style={{ overflow: 'hidden' }}>
              <div style={{
                height: 80,
                background: t.status === 'live'
                  ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                  : 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                padding: '0 24px',
                gap: 12,
              }}>
                <IconTrophy size={28} />
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700 }}>{t.name}</h2>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>{t.location}</div>
                </div>
                {t.status === 'live' && (
                  <span className="badge badge-live" style={{ marginLeft: 'auto' }}>
                    <span className="live-dot" style={{ width: 5, height: 5 }} /> Live
                  </span>
                )}
              </div>
              <div style={{ padding: '20px 24px' }}>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>{t.description}</p>
                <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <IconCalendar size={14} />
                    {new Date(t.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <IconMapPin size={14} /> {t.location.split(',')[0]}
                  </span>
                </div>

                {/* Events to register */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {events.map(ev => {
                    const isRegistered = user && mockRegistrations.some(
                      r => r.player_id === user.id && r.event_id === ev.id
                    );
                    return (
                      <div key={ev.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                      }}>
                        <div>
                          <span style={{ fontWeight: 500, fontSize: 14 }}>{ev.event_name}</span>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>
                            {ev.registrations_count}/{ev.entry_limit} entries · {ev.format}
                          </span>
                        </div>
                        {isRegistered ? (
                          <span className="btn btn-sm" style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--score-win)', border: 'none', cursor: 'default' }}>
                            <IconCheck size={14} /> Registered
                          </span>
                        ) : (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleRegister(t.id, ev.id)}
                          >
                            Register
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div style={{ marginTop: 12 }}>
                  <Link href={`/tournament/${t.slug}`} className="btn btn-ghost btn-sm">
                    View Public Page →
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {toast && (
        <div className={`toast ${toast.includes('Already') ? 'toast-error' : 'toast-success'}`}>
          {toast}
        </div>
      )}
    </div>
  );
}
