'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { IconShuttlecock } from '@/components/icons';

import { API_BASE_URL } from '@/lib/api-config';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Reset Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/forgot-password`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'bypass-tunnel-reminder': 'true'
        },
        body: JSON.stringify({ email })
      });

      if (res.ok) {
        setMessage('A 6-digit OTP has been sent to your email.');
        setStep(2);
      } else {
        const text = await res.text();
        setError(text || 'Failed to send OTP. Please try again.');
      }
    } catch (err) {
      setError('Connection failure. Please check if the backend service is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/verify-otp`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'bypass-tunnel-reminder': 'true'
        },
        body: JSON.stringify({ email, otp })
      });

      if (res.ok) {
        const data = await res.json();
        setResetToken(data.reset_token);
        setStep(3);
      } else {
        const text = await res.text();
        setError(text || 'Verification failed: Invalid or expired OTP.');
      }
    } catch (err) {
      setError('Connection failure. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/reset-password`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'bypass-tunnel-reminder': 'true'
        },
        body: JSON.stringify({ resetToken, newPassword: password })
      });

      if (res.ok) {
        setMessage('Your password has been successfully reset.');
        setStep(4); // Success state
      } else {
        const text = await res.text();
        setError(text || 'Failed to reset password. Token may have expired.');
      }
    } catch (err) {
      setError('Connection failure. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      background: 'transparent',
    }}>
      <div className="hero-glow" style={{ position: 'fixed', top: -300, left: '50%', transform: 'translateX(-50%)' }} />
      <div className="animate-slide-up" style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 40, textDecoration: 'none' }}>
          <div style={{
            width: 44, height: 44,
            background: 'linear-gradient(135deg, var(--accent), #3b82f6)',
            borderRadius: 'var(--radius-md)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IconShuttlecock size={24} />
          </div>
          <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>MatchPoint</span>
        </Link>

        {/* Card wrapper */}
        <div className="glass-card" style={{ padding: 32 }}>
          {step === 1 && (
            <>
              <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Recover Password</h1>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 28 }}>
                Enter your email address and we will send you a 6-digit OTP code to reset your password.
              </p>

              <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div className="input-group">
                  <label className="input-label" htmlFor="reset-email">Email Address</label>
                  <input
                    id="reset-email"
                    type="email"
                    className="input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>

                {error && <p className="error-text">{error}</p>}

                <button type="submit" className="btn btn-primary btn-lg" disabled={isLoading} style={{ width: '100%' }}>
                  {isLoading ? 'Sending OTP...' : 'Send Reset Code'}
                </button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Enter Verification Code</h1>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 28 }}>
                We sent a 6-digit code to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>. Enter it below to verify.
              </p>

              {message && <p style={{ fontSize: 13, color: 'var(--accent)', marginBottom: 16 }}>{message}</p>}

              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div className="input-group">
                  <label className="input-label" htmlFor="reset-otp">Verification OTP</label>
                  <input
                    id="reset-otp"
                    type="text"
                    maxLength={6}
                    className="input"
                    placeholder="123456"
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                    style={{ letterSpacing: '8px', textAlign: 'center', fontSize: '20px', fontWeight: 'bold' }}
                    required
                  />
                </div>

                {error && <p className="error-text">{error}</p>}

                <button type="submit" className="btn btn-primary btn-lg" disabled={isLoading} style={{ width: '100%' }}>
                  {isLoading ? 'Verifying OTP...' : 'Verify OTP'}
                </button>
              </form>
              <button 
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', marginTop: 12 }}
                onClick={() => setStep(1)}
              >
                Go Back
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Set New Password</h1>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 28 }}>
                Please choose a new secure password for your account.
              </p>

              <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div className="input-group">
                  <label className="input-label" htmlFor="new-password">New Password</label>
                  <input
                    id="new-password"
                    type="password"
                    className="input"
                    placeholder="At least 4 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="confirm-new-password">Confirm Password</label>
                  <input
                    id="confirm-new-password"
                    type="password"
                    className="input"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                {error && <p className="error-text">{error}</p>}

                <button type="submit" className="btn btn-primary btn-lg" disabled={isLoading} style={{ width: '100%' }}>
                  {isLoading ? 'Resetting Password...' : 'Reset Password'}
                </button>
              </form>
            </>
          )}

          {step === 4 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 56, height: 56,
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#10b981',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px auto',
                fontSize: 24
              }}>
                ✓
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Password Updated!</h1>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 28, lineHeight: 1.6 }}>
                Your password has been successfully updated. You can now log in with your new password.
              </p>

              <Link href="/login" className="btn btn-primary btn-lg" style={{ width: '100%', textDecoration: 'none', display: 'block', textAlign: 'center', boxSizing: 'border-box' }}>
                Go to Sign In
              </Link>
            </div>
          )}
        </div>

        {step !== 4 && (
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-secondary)' }}>
            Remembered your credentials?{' '}
            <Link href="/login" style={{ color: 'var(--accent-hover)', textDecoration: 'none', fontWeight: 500 }}>
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
