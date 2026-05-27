'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@/types';
import { IconShuttlecock } from '@/components/icons';

export default function RegisterPage() {
  const { register, isLoading } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('player');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }
    const success = await register(name, email, password, role);
    if (success) {
      router.push('/dashboard');
    } else {
      setError('Registration failed. Please try again.');
    }
  };

  const roles: { value: UserRole; label: string; description: string }[] = [
    { value: 'player', label: 'Player', description: 'Register for tournaments and track your matches' },
    { value: 'admin', label: 'Organizer', description: 'Create and manage tournaments' },
    { value: 'umpire', label: 'Umpire', description: 'Score matches during tournaments' },
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
      <div className="animate-slide-up" style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
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

        <div className="glass-card" style={{ padding: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Create your account</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 28 }}>Join the badminton community</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="input-group">
              <label className="input-label" htmlFor="register-name">Full Name</label>
              <input id="register-name" type="text" className="input" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} required />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="register-email">Email</label>
              <input id="register-email" type="email" className="input" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="register-password">Password</label>
              <input id="register-password" type="password" className="input" placeholder="At least 4 characters" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>

            <div className="input-group">
              <label className="input-label">I am a...</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {roles.map(r => (
                  <label
                    key={r.value}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: `1px solid ${role === r.value ? 'var(--accent)' : 'var(--border)'}`,
                      background: role === r.value ? 'var(--accent-subtle)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={r.value}
                      checked={role === r.value}
                      onChange={() => setRole(r.value)}
                      style={{ accentColor: 'var(--accent)' }}
                    />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{r.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {error && <p className="error-text">{error}</p>}

            <button type="submit" className="btn btn-primary btn-lg" disabled={isLoading} style={{ width: '100%' }}>
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--accent-hover)', textDecoration: 'none', fontWeight: 500 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
