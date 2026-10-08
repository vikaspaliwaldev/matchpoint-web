import React from 'react';

interface WinPredictorGaugeProps {
  player1Name: string;
  player2Name: string;
  player1Score: number;
  player2Score: number;
  player1Sets: number;
  player2Sets: number;
  servingTeam?: 'player1' | 'player2' | null;
}

export default function WinPredictorGauge({
  player1Name,
  player2Name,
  player1Score,
  player2Score,
  player1Sets,
  player2Sets,
  servingTeam,
}: WinPredictorGaugeProps) {
  // Sigmoid formula: P(win) = 1 / (1 + exp(-x))
  // x = score_lead * 0.35 + sets_lead * 2.5 + serve_bonus * 0.5
  const scoreLead = player1Score - player2Score;
  const setsLead = player1Sets - player2Sets;
  const serveBonus = servingTeam === 'player1' ? 0.5 : servingTeam === 'player2' ? -0.5 : 0;
  
  const x = scoreLead * 0.35 + setsLead * 2.5 + serveBonus;
  const probability1 = 1 / (1 + Math.exp(-x));
  
  const p1Percentage = Math.round(probability1 * 100);
  const p2Percentage = 100 - p1Percentage;

  const firstName1 = player1Name ? player1Name.split(' ')[0] : 'Player 1';
  const firstName2 = player2Name ? player2Name.split(' ')[0] : 'Player 2';

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      borderRadius: 'var(--radius-md)',
      padding: '12px 16px',
      border: '1px solid var(--border)',
      marginTop: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          🔮 Win Probability
        </span>
        <span style={{ color: '#818cf8', fontFamily: 'var(--font-mono)' }}>
          {p1Percentage > p2Percentage ? `${p1Percentage}% ${firstName1}` : `${p2Percentage}% ${firstName2}`}
        </span>
      </div>
      
      {/* Visual Slider */}
      <div style={{
        height: 8,
        borderRadius: 'var(--radius-full)',
        background: 'var(--border)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex'
      }}>
        <div style={{
          width: `${p1Percentage}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #2563eb, #3b82f6)',
          transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        }} />
        <div style={{
          width: `${p2Percentage}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #10b981, #059669)',
          transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        }} />
      </div>
      
      {/* Score labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
        <span>{firstName1}: {p1Percentage}%</span>
        <span>{firstName2}: {p2Percentage}%</span>
      </div>
    </div>
  );
}
