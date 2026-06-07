'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StripeReturnPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/dashboard/tournaments');
    }, 2500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      padding: 24
    }}>
      <div style={{
        textAlign: 'center',
        background: 'var(--bg-card)',
        padding: 40,
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        maxWidth: 480,
        width: '100%',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
      }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>💳</div>
        <h1 style={{ color: '#22c55e', fontSize: 26, fontWeight: 800, marginBottom: 12 }}>Account Linked!</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: 15 }}>
          Your Stripe Connect payouts account has been successfully linked with MatchPoint.
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          Redirecting back to dashboard...
        </p>
        <div style={{ marginTop: 24 }}>
          <button onClick={() => router.push('/dashboard/tournaments')} className="btn btn-primary" style={{ width: '100%' }}>
            Return Immediately
          </button>
        </div>
      </div>
    </div>
  );
}
