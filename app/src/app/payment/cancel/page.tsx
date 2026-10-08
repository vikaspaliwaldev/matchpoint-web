'use client';

import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { IconX } from '@/components/icons';

function CancelContent() {
  const router = useRouter();

  return (
    <div style={{
      maxWidth: 500,
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
          background: 'radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0) 70%)',
          pointerEvents: 'none'
        }} />

        {/* Cancel Icon */}
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px auto',
          boxShadow: '0 8px 24px rgba(239, 68, 68, 0.3)',
          position: 'relative'
        }}>
          <IconX size={36} className="text-white" />
        </div>

        <h1 style={{
          fontSize: 28,
          fontWeight: 800,
          letterSpacing: '-0.5px',
          background: 'linear-gradient(135deg, #fca5a5 0%, #ef4444 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: 12
        }}>
          Payment Cancelled
        </h1>
        
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: 15,
          lineHeight: 1.6,
          maxWidth: '85%',
          margin: '0 auto 32px auto'
        }}>
          Your entry fee transaction was not completed. As a result, your registration remains in a pending payment status.
        </p>

        <div style={{
          background: 'rgba(15, 23, 42, 0.4)',
          borderRadius: 16,
          border: '1px solid rgba(255, 255, 255, 0.04)',
          padding: 20,
          textAlign: 'left',
          marginBottom: 32,
          fontSize: 14,
          lineHeight: 1.5,
          color: 'var(--text-muted)'
        }}>
          💡 <strong style={{ color: 'var(--text-secondary)' }}>Note:</strong> If you did not intend to cancel, you can return to your dashboard under <strong style={{ color: 'var(--text-primary)' }}>My Tournaments</strong> to retry the entry fee payment at any time.
        </div>

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
            Retry Registration / Payment
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
            Go to Home
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

export default function CancelPage() {
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
        <div style={{ color: 'var(--text-secondary)', fontSize: 16 }}>Loading page...</div>
      }>
        <CancelContent />
      </Suspense>
    </div>
  );
}
