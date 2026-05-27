'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { IconShuttlecock } from '@/components/icons';

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = await login(email, password);
    if (success) {
      router.push('/dashboard');
    } else {
      setError('Invalid credentials. Try one of the demo accounts below.');
    }
  };

  const demoAccounts = [
    { email: 'admin@matchpoint.io', label: 'Rajesh Kumar', roles: 'Admin + Player', color: 'var(--accent)' },
    { email: 'priya@matchpoint.io', label: 'Priya Sharma', roles: 'Player', color: 'var(--score-live)' },
    { email: 'umpire@matchpoint.io', label: 'Suresh Nair', roles: 'Umpire + Player', color: 'var(--score-point)' },
    { email: 'allroles@matchpoint.io', label: 'Arjun Mehta', roles: 'All Roles', color: '#a855f7' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      background: 'var(--bg-primary)',
    }}>
      <div className="hero-glow" style={{ position: 'fixed', top: -300, left: '50%', transform: 'translateX(-50%)' }} />
      <div className="animate-slide-up" style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 40, textDecoration: 'none' }}>
          <div style={{
            width: 44, height: 44,
            background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
            borderRadius: 'var(--radius-md)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IconShuttlecock size={24} />
          </div>
          <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>MatchPoint</span>
        </Link>

        {/* Form Card */}
        <div className="glass-card" style={{ padding: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Welcome back</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 28 }}>Sign in to your account</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="input-group">
              <label className="input-label" htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                className={`input ${error ? 'input-error' : ''}`}
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <p className="error-text">{error}</p>}

            <button type="submit" className="btn btn-primary btn-lg" disabled={isLoading} style={{ width: '100%' }}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="divider" />

          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>Quick login with demo accounts:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {demoAccounts.map(account => (
              <button
                key={account.email}
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'space-between', width: '100%' }}
                onClick={() => {
                  setEmail(account.email);
                  setPassword('demo');
                }}
              >
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 13 }}>{account.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{account.email}</div>
                </div>
                <span className="badge" style={{
                  background: `${account.color}20`,
                  color: account.color,
                  fontSize: 10,
                }}>
                  {account.roles}
                </span>
              </button>
            ))}
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-secondary)' }}>
          Don&apos;t have an account?{' '}
          <Link href="/register" style={{ color: 'var(--accent-hover)', textDecoration: 'none', fontWeight: 500 }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
