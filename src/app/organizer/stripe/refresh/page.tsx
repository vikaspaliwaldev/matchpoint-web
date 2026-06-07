'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StripeRefreshPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/dashboard/tournaments');
    }, 3500);
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
        <div style={{ fontSize: 64, marginBottom: 16 }}>⚠️</div>
        <h1 style={{ color: '#ef4444', fontSize: 26, fontWeight: 800, marginBottom: 12 }}>Session Expired</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: 15 }}>
          The Stripe onboarding session has expired or was interrupted.
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          Returning to the dashboard so you can regenerate the link...
        </p>
        <div style={{ marginTop: 24 }}>
          <button onClick={() => router.push('/dashboard/tournaments')} className="btn btn-secondary" style={{ width: '100%' }}>
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
