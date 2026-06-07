'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getRegistrationById, getTournaments, getEvents } from '@/lib/supabase-service';
import { Registration, Tournament, TournamentEvent } from '@/types';
import { IconCheck } from '@/components/icons';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const registrationIdParam = searchParams.get('registration_id');

  const [loading, setLoading] = useState(true);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [event, setEvent] = useState<TournamentEvent | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        // Resolve registration ID
        let regId = registrationIdParam;
        if (!regId && typeof window !== 'undefined') {
          regId = sessionStorage.getItem('pending_registration_id');
        }

        if (!regId) {
          // If no specific registration ID is found, we can try to look up the newest registration
          setLoading(false);
          return;
        }

        const reg = await getRegistrationById(regId);
        setRegistration(reg);

        // Fetch tournament & event
        const [tours, evs] = await Promise.all([getTournaments(), getEvents()]);
        const tour = tours.find(t => t.id === reg.tournament_id);
        const ev = evs.find(e => e.id === reg.event_id);

        if (tour) setTournament(tour);
        if (ev) setEvent(ev);

        // Clean up sessionStorage
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('pending_registration_id');
        }
      } catch (err: any) {
        console.error('Failed to load registration details on success page:', err);
        setError(err.message || 'Unable to retrieve registration details.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [registrationIdParam, sessionId]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        color: 'var(--text-primary)'
      }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          border: '3px solid rgba(56, 189, 248, 0.1)',
          borderTopColor: '#38bdf8',
          animation: 'spin 1s linear infinite',
          marginBottom: 16
        }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Confirming transaction details...</p>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}} />
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: 520,
      width: '100%',
      margin: '0 auto',
      animation: 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      <div style={{
        background: 'rgba(30, 41, 59, 0.45)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 24,
        padding: '40px 32px 32px 32px',
        textAlign: 'center',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative background glow */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '60%',
          height: '40%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0) 70%)',
          pointerEvents: 'none'
        }} />

        {/* Check Icon */}
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px auto',
          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
          position: 'relative'
        }}>
          <IconCheck size={36} className="text-white" />
        </div>

        <h1 style={{
          fontSize: 30,
          fontWeight: 800,
          letterSpacing: '-0.5px',
          background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: 8
        }}>
          Registration Confirmed!
        </h1>
        
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: 15,
          lineHeight: 1.6,
          maxWidth: '85%',
          margin: '0 auto 32px auto'
        }}>
          {registration ? 'Your entry fee payment has been successfully processed and your spot is secured.' : 'Your entry fee payment was successful.'}
        </p>

        {registration ? (
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: 16,
            border: '1px solid rgba(255, 255, 255, 0.05)',
            padding: 20,
            textAlign: 'left',
            marginBottom: 32
          }}>
            <h2 style={{
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: 'var(--text-muted)',
              marginBottom: 16,
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              paddingBottom: 8
            }}>
              Registration Info
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Tournament</span>
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {tournament?.name || 'Loading tournament details...'}
                </span>
              </div>

              {event && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Event Category</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#38bdf8' }}>
                      {event.name} ({event.category})
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Registration Type</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {registration.partner_name ? 'Doubles' : 'Singles'}
                    </span>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Player</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {registration.player_name}
                  </span>
                </div>
                {registration.partner_name && (
                  <div>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Partner</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {registration.partner_name}
                    </span>
                  </div>
                )}
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 8,
                paddingTop: 12,
                borderTop: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <div>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Status</span>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    marginLeft: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 9999,
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#34d399'
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                    Paid & Approved
                  </span>
                </div>
                
                {tournament?.entry_fee && (
                  <div>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', marginRight: 8 }}>Amount</span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: tournament.currency || 'USD'
                      }).format(tournament.entry_fee)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: 16,
            border: '1px solid rgba(255, 255, 255, 0.05)',
            padding: 24,
            marginBottom: 32
          }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
              Transaction Session: <code style={{ color: '#cbd5e1', fontSize: 13 }}>{sessionId || 'N/A'}</code>
            </p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onClick={() => router.push('/dashboard/my-tournaments')}
            style={{
              background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '14px 28px',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 16,
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(2, 132, 199, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(2, 132, 199, 0.3)';
            }}
          >
            Go to My Tournaments
          </button>
          
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '12px 28px',
              borderRadius: 12,
              fontWeight: 600,
              fontSize: 15,
              cursor: 'pointer',
              transition: 'color 0.2s, border-color 0.2s, background 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            Back to Home
          </button>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}} />
    </div>
  );
}

export default function SuccessPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at top, #0f172a 0%, #020617 100%)',
      padding: '40px 24px'
    }}>
      <Suspense fallback={
        <div style={{ color: 'var(--text-secondary)', fontSize: 16 }}>Loading payment state...</div>
      }>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
