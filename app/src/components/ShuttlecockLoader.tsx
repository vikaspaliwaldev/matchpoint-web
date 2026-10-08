import React from 'react';

interface LoaderProps {
  size?: number;
  message?: string;
}

export default function ShuttlecockLoader({ size = 50, message = 'Loading...' }: LoaderProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 16px',
      textAlign: 'center',
    }}>
      <div style={{
        position: 'relative',
        width: size,
        height: size,
        marginBottom: message ? 16 : 0,
      }}>
        {/* Pulsing glow ring */}
        <div style={{
          position: 'absolute',
          inset: -6,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.4) 0%, transparent 70%)',
          animation: 'pulse 1.8s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
        {/* Spinning Shuttlecock */}
        <img
          src="/shuttlecock-loader.png"
          alt="Loading..."
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            animation: 'spin 1.5s linear infinite',
            filter: 'drop-shadow(0 0 8px rgba(37, 99, 235, 0.6))',
          }}
        />
      </div>
      {message && (
        <p style={{
          fontSize: 14,
          fontWeight: 500,
          color: 'var(--text-secondary)',
          margin: 0,
          letterSpacing: '0.02em',
        }}>
          {message}
        </p>
      )}
    </div>
  );
}
