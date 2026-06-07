'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function MaintenancePage() {
  const [isOnline, setIsOnline] = useState(false);
  const [checking, setChecking] = useState(true);
  const [countdown, setCountdown] = useState(5);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  async function checkServerStatus() {
    try {
      setChecking(true);
      // Ping a public endpoint to see if backend is responsive
      const res = await fetch(`${API_BASE_URL}/api/v1/tournaments`, {
        method: 'GET',
        headers: { 'bypass-tunnel-reminder': 'true' }
      });
      if (res.ok) {
        setIsOnline(true);
      } else {
        setIsOnline(false);
      }
    } catch (err) {
      setIsOnline(false);
    } finally {
      setChecking(false);
    }
  }

  // Initial check
  useEffect(() => {
    checkServerStatus();
  }, []);

  // Countdown & auto check every 10 seconds
  useEffect(() => {
    if (isOnline) return;

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          checkServerStatus();
          return 10; // Reset countdown timer
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOnline]);

  return (
    <div style={{
      background: 'var(--bg-primary)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      color: 'var(--text-primary)',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div className="glass-card animate-slide-up" style={{
        maxWidth: '560px',
        width: '100%',
        padding: '32px',
        borderRadius: 'var(--radius-lg)',
        textAlign: 'center',
        border: '1px solid var(--border)',
        boxShadow: 'var(--glass-shadow)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        {/* Banner Outage Image */}
        <div style={{
          width: '100%',
          height: '240px',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          marginBottom: '24px',
          border: '1px solid var(--border)',
          position: 'relative'
        }}>
          <img
            src="/badminton-outage.png"
            alt="Badminton Net Outage"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        </div>

        {/* Warning Accent Dot */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{
            display: 'inline-block',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: isOnline ? '#22c55e' : '#f59e0b',
            boxShadow: isOnline ? '0 0 10px #22c55e' : '0 0 10px #f59e0b',
            animation: isOnline ? 'none' : 'pulse-live 2s infinite'
          }} />
          <span style={{
            fontSize: '12px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: isOnline ? '#22c55e' : '#f59e0b'
          }}>
            {isOnline ? 'System Online' : checking ? 'Checking court...' : `Rechecking in ${countdown}s`}
          </span>
        </div>

        {/* Heading */}
        <h1 style={{
          fontSize: '28px',
          fontWeight: 800,
          marginBottom: '8px',
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em'
        }}>
          {isOnline ? 'Net Repaired! (System Ready)' : 'Net Cord Fault! (Service Outage)'}
        </h1>

        {/* Subtitle description */}
        <p style={{
          fontSize: '14px',
          color: 'var(--text-secondary)',
          lineHeight: '1.6',
          marginBottom: '24px',
          maxWidth: '460px'
        }}>
          {isOnline 
            ? 'The MatchPoint server has successfully reconnected to the database and courts. All draws and scoring systems are active.'
            : 'The MatchPoint court servers are currently resting between sets. We are experiencing a brief database or backend service interruption.'}
        </p>

        {/* Notice Info Box */}
        {!isOnline && (
          <div style={{
            width: '100%',
            padding: '12px 16px',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            fontSize: '13px',
            color: 'var(--text-muted)',
            textAlign: 'left',
            marginBottom: '28px'
          }}>
            <strong>Court Status:</strong> Our technical team and umpires have been dispatched to inspect the lines. The game will resume shortly.
          </div>
        )}

        {/* Call to Actions */}
        <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
          {isOnline ? (
            <Link href="/" className="btn btn-primary" style={{ flex: 1, padding: '12px' }}>
              Return to Tournament Hub
            </Link>
          ) : (
            <>
              <button
                onClick={checkServerStatus}
                disabled={checking}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '12px' }}
              >
                {checking ? 'Pinging server...' : 'Verify Status Now'}
              </button>
              <Link href="/" className="btn btn-ghost" style={{ flex: 1, padding: '12px', border: '1px solid var(--border)' }}>
                Try Loading Anyway
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
