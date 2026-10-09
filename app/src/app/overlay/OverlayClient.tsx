'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Match } from '@/types';
import { getMatches } from '@/lib/supabase-service';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { formatTennisGameScore, getTableTennisServer } from '@/lib/sports-rules';

/**
 * OBS Score Overlay Page
 * 
 * Usage: Add as a Browser Source in OBS Studio.
 * URL: /overlay/{matchId}?position=bottom-left&scale=1&theme=dark
 * 
 * Query Params:
 * - position: top-left | top-right | bottom-left | bottom-right | center (default: bottom-left)
 * - scale: 0.6 - 2.0 (default: 1)
 * - theme: dark | light (default: dark)
 * - compact: true | false (default: false) — ultra-compact single-line mode
 */

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function OverlayPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const matchId = searchParams?.get('matchId') || params?.matchId as string || '';

  const position = searchParams?.get('position') || 'bottom-left';
  const scale = Math.max(0.6, Math.min(2, parseFloat(searchParams?.get('scale') || '1')));
  const theme = searchParams?.get('theme') || 'dark';
  const compact = searchParams?.get('compact') === 'true';

  const [match, setMatch] = useState<Match | null>(null);
  const [elapsed, setElapsed] = useState(0);

  // Load match
  useEffect(() => {
    async function load() {
      try {
        const all = await getMatches();
        const found = all.find(m => m.id === matchId);
        if (found) setMatch(found);
      } catch (err) {
        console.error('Overlay: failed to load match:', err);
      }
    }
    load();
  }, [matchId]);

  // Real-time updates via Spring SSE stream (reduces egress to zero)
  useEffect(() => {
    if (!matchId) return;

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const sseUrl = `${apiBaseUrl}/api/v1/live/match/${matchId}`;
    
    console.log(`🔌 Overlay connecting to Live SSE score updates at: ${sseUrl}`);
    const eventSource = new EventSource(sseUrl);

    eventSource.addEventListener('match-update', (event: any) => {
      try {
        const updated = JSON.parse(event.data);
        if (updated) {
          setMatch(prev => {
            if (!prev) return updated;
            return {
              ...prev,
              ...updated,
              sets: (updated.sets || []).map((s: any) => ({
                set_number: s.set_number !== undefined ? s.set_number : s.setNumber,
                player1_score: s.player1_score !== undefined ? s.player1_score : s.player1Score,
                player2_score: s.player2_score !== undefined ? s.player2_score : s.player2Score,
                is_complete: s.is_complete !== undefined ? s.is_complete : s.isComplete || s.complete || false,
                winner_id: s.winner_id || s.winnerId,
              })),
            };
          });
        }
      } catch (err) {
        console.error('Overlay: failed to parse SSE match update:', err);
      }
    });

    eventSource.onerror = (err) => {
      console.warn('Overlay: SSE stream error, client will auto-retry...', err);
    };

    return () => {
      console.log(`🔌 Closing SSE connection for overlay match: ${matchId}`);
      eventSource.close();
    };
  }, [matchId]);

  // Elapsed timer
  useEffect(() => {
    if (!match || match.status !== 'running') return;
    const timer = setInterval(() => setElapsed(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [match?.status]);

  // Position styles
  const positionStyles: React.CSSProperties = {
    position: 'fixed',
    ...(position === 'top-left' && { top: 20, left: 20 }),
    ...(position === 'top-right' && { top: 20, right: 20 }),
    ...(position === 'bottom-left' && { bottom: 20, left: 20 }),
    ...(position === 'bottom-right' && { bottom: 20, right: 20 }),
    ...(position === 'center' && { bottom: 20, left: '50%', transform: `translateX(-50%) scale(${scale})` }),
  };

  if (position !== 'center') {
    positionStyles.transform = `scale(${scale})`;
    positionStyles.transformOrigin = position.replace('-', ' ');
  }

  // Theme
  const isDark = theme === 'dark';
  const bgColor = isDark ? 'rgba(15, 23, 42, 0.88)' : 'rgba(255, 255, 255, 0.92)';
  const textColor = isDark ? '#f8fafc' : '#1e293b';
  const mutedColor = isDark ? '#94a3b8' : '#64748b';
  const accentColor = '#2563eb';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)';

  const isLive = match?.status === 'running';
  const isPaused = match?.status === 'paused';
  const isCompleted = match?.status === 'completed';

  const activeSet = match?.sets?.find(s => !s.is_complete) || match?.sets?.[match.sets.length - 1];
  const p1Sets = match?.sets?.filter(s => s.is_complete && s.winner_id === match.player1_id).length || 0;
  const p2Sets = match?.sets?.filter(s => s.is_complete && s.winner_id === match.player2_id).length || 0;

  const tennisMeta = match?.sport_metadata;
  const p1GamePoints = tennisMeta?.player1_game_points ?? 0;
  const p2GamePoints = tennisMeta?.player2_game_points ?? 0;
  const gameInProgress = match?.sport === 'tennis' && (p1GamePoints > 0 || p2GamePoints > 0);

  const tennisScores = (match?.sport === 'tennis' && tennisMeta) ? formatTennisGameScore(
    p1GamePoints,
    p2GamePoints,
    !!tennisMeta.in_tiebreak
  ) : { p1: '0', p2: '0' };
  const tennisP1Points = tennisScores.p1;
  const tennisP2Points = tennisScores.p2;

  const getServeIndicator = (sport: string | undefined) => {
    if (sport === 'tennis') return '🥎';
    if (sport === 'table_tennis') return '🏓';
    if (sport === 'squash') return '🎾';
    if (sport === 'badminton') return '🏸';
    return '●';
  };

  let servingTeam: 'player1' | 'player2' | null = null;
  if (match) {
    if (match.sport === 'tennis' || match.sport === 'squash' || match.sport === 'badminton') {
      servingTeam = match.sport_metadata?.serving_team || match.sport_metadata?.initial_server || 'player1';
    } else if (match.sport === 'table_tennis') {
      const activeSet = match.sets?.[match.sets.length - 1];
      const p1Score = activeSet?.player1_score ?? 0;
      const p2Score = activeSet?.player2_score ?? 0;
      const ttInitialServer = match.sport_metadata?.initial_server || 'player1';
      const ttFormat = match.sport_metadata?.scoring_format || '11-point';
      servingTeam = getTableTennisServer(p1Score, p2Score, ttInitialServer, ttFormat);
    }
  }

  // Detect game/match point
  let statusLabel = '';
  if (isLive && activeSet) {
    const p1 = activeSet.player1_score;
    const p2 = activeSet.player2_score;
    const target = match?.sport === 'table_tennis' || match?.sport === 'squash' ? 11 : 21; // standard target points
    if (p1 >= target - 1 && p1 > p2) statusLabel = 'Game Point';
    if (p2 >= target - 1 && p2 > p1) statusLabel = 'Game Point';
    if (p1 >= target - 1 && p2 >= target - 1 && p1 === p2) statusLabel = 'Deuce';
  }

  if (!match) {
    return (
      <div style={{
        ...positionStyles,
        background: bgColor,
        backdropFilter: 'blur(16px)',
        borderRadius: 12,
        padding: '12px 20px',
        border: `1px solid ${borderColor}`,
        color: mutedColor,
        fontSize: 13,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        Waiting for match...
      </div>
    );
  }

  // ─── Compact Single-Line Mode ───
  if (compact) {
    return (
      <>
        <style>{`html, body { background: transparent !important; margin: 0; padding: 0; overflow: hidden; }`}</style>
        <div style={{
          ...positionStyles,
          background: bgColor,
          backdropFilter: 'blur(16px)',
          borderRadius: 8,
          padding: '8px 16px',
          border: `1px solid ${borderColor}`,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}>
          {isLive && (
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#ef4444',
              boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)',
              animation: 'pulse 1.5s infinite',
            }} />
          )}
          {isPaused && (
            <span style={{
              fontSize: 10,
              fontWeight: 800,
              color: '#f59e0b',
              background: 'rgba(245, 158, 11, 0.15)',
              padding: '2px 6px',
              borderRadius: 4,
              letterSpacing: 0.5
            }}>
              ⏸ PAUSED
            </span>
          )}
          <span style={{ fontSize: 14, fontWeight: 600, color: textColor }}>
            {match.player1_name.split(' ').pop()}
          </span>
          <span style={{
            fontSize: 22, fontWeight: 800, color: textColor,
            fontFamily: 'monospace',
            letterSpacing: 2,
          }}>
            {match.sport === 'tennis' 
              ? `${activeSet?.player1_score ?? 0}(${tennisP1Points}) - ${activeSet?.player2_score ?? 0}(${tennisP2Points})`
              : `${activeSet?.player1_score ?? 0} - ${activeSet?.player2_score ?? 0}`
            }
          </span>
          <span style={{ fontSize: 14, fontWeight: 600, color: textColor }}>
            {match.player2_name.split(' ').pop()}
          </span>
          <span style={{ fontSize: 11, color: mutedColor, marginLeft: 4 }}>
            ({p1Sets}-{p2Sets})
          </span>
        </div>
      </>
    );
  }

  // ─── Full Overlay Mode ───
  return (
    <>
      <style>{`
        html, body { background: transparent !important; margin: 0; padding: 0; overflow: hidden; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div style={{
        ...positionStyles,
        background: bgColor,
        backdropFilter: 'blur(20px)',
        borderRadius: 14,
        border: `1px solid ${borderColor}`,
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        animation: 'slideUp 0.4s ease-out',
        minWidth: 300,
      }}>
        {/* Header */}
        <div style={{
          padding: '10px 16px',
          borderBottom: `1px solid ${borderColor}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: isDark ? 'rgba(37, 99, 235, 0.06)' : 'rgba(37, 99, 235, 0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14 }}>
              {match.sport === 'table_tennis' ? '🏓' : match.sport === 'squash' ? '🎾' : '🏸'}
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: accentColor, letterSpacing: 0.5 }}>
              MatchPoint
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isLive && (
              <span style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 10, fontWeight: 700, color: '#ef4444',
                background: 'rgba(239, 68, 68, 0.12)',
                padding: '3px 8px', borderRadius: 100,
                letterSpacing: 0.5,
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: '#ef4444',
                  animation: 'pulse 1.5s infinite',
                }} />
                LIVE
              </span>
            )}
            {isPaused && (
              <span style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', letterSpacing: 0.5 }}>
                ⏸ PAUSED
              </span>
            )}
            {isCompleted && (
              <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981', letterSpacing: 0.5 }}>
                ✓ FINAL
              </span>
            )}
            <span style={{ fontSize: 10, color: mutedColor }}>
              Set {match.sets?.length || 1}
            </span>
          </div>
        </div>

        {/* Score Body */}
        <div style={{ padding: '14px 16px' }}>
          {/* Player 1 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: `linear-gradient(135deg, ${accentColor}, #3b82f6)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: '#fff',
              }}>
                {match.player1_name.charAt(0)}
              </div>
              <span style={{
                fontSize: 14, fontWeight: 600, color: textColor,
                maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}>
                {match.player1_name}
                {servingTeam === 'player1' && (
                  <span title="Serving">
                    {getServeIndicator(match.sport)}
                  </span>
                )}
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {/* Previous completed sets */}
              {match.sets?.filter(s => s.is_complete).map((s, i) => (
                <span key={i} style={{
                  fontSize: 13, fontWeight: 700, color: mutedColor,
                  fontFamily: 'monospace',
                  background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  padding: '2px 8px', borderRadius: 4, minWidth: 24, textAlign: 'center'
                }}>
                  {s.player1_score}
                </span>
              ))}
              {/* Current active set */}
              {!isCompleted && activeSet && (
                <span style={{
                  fontSize: 15, fontWeight: 800, color: textColor,
                  fontFamily: 'monospace',
                  background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                  border: `1px solid ${borderColor}`,
                  padding: '2px 8px', borderRadius: 4, minWidth: 24, textAlign: 'center'
                }}>
                  {activeSet.player1_score}
                </span>
              )}
              {/* Game Points (Tennis only, if game is in progress) */}
              {match.sport === 'tennis' && gameInProgress && (
                <span style={{
                  fontSize: 15, fontWeight: 800, color: '#eab308',
                  fontFamily: 'monospace',
                  background: 'rgba(234, 179, 8, 0.15)',
                  border: '1px solid rgba(234, 179, 8, 0.4)',
                  padding: '2px 8px', borderRadius: 4, minWidth: 32, textAlign: 'center'
                }}>
                  {tennisP1Points}
                </span>
              )}
            </div>
          </div>

          {/* Player 2 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: '#fff',
              }}>
                {match.player2_name.charAt(0)}
              </div>
              <span style={{
                fontSize: 14, fontWeight: 600, color: textColor,
                maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}>
                {match.player2_name}
                {servingTeam === 'player2' && (
                  <span title="Serving">
                    {getServeIndicator(match.sport)}
                  </span>
                )}
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {/* Previous completed sets */}
              {match.sets?.filter(s => s.is_complete).map((s, i) => (
                <span key={i} style={{
                  fontSize: 13, fontWeight: 700, color: mutedColor,
                  fontFamily: 'monospace',
                  background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  padding: '2px 8px', borderRadius: 4, minWidth: 24, textAlign: 'center'
                }}>
                  {s.player2_score}
                </span>
              ))}
              {/* Current active set */}
              {!isCompleted && activeSet && (
                <span style={{
                  fontSize: 15, fontWeight: 800, color: textColor,
                  fontFamily: 'monospace',
                  background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                  border: `1px solid ${borderColor}`,
                  padding: '2px 8px', borderRadius: 4, minWidth: 24, textAlign: 'center'
                }}>
                  {activeSet.player2_score}
                </span>
              )}
              {/* Game Points (Tennis only, if game is in progress) */}
              {match.sport === 'tennis' && gameInProgress && (
                <span style={{
                  fontSize: 15, fontWeight: 800, color: '#eab308',
                  fontFamily: 'monospace',
                  background: 'rgba(234, 179, 8, 0.15)',
                  border: '1px solid rgba(234, 179, 8, 0.4)',
                  padding: '2px 8px', borderRadius: 4, minWidth: 32, textAlign: 'center'
                }}>
                  {tennisP2Points}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer: Status / Game Point */}
        {(statusLabel || match.court) && (
          <div style={{
            padding: '8px 16px',
            borderTop: `1px solid ${borderColor}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            {statusLabel && (
              <span style={{
                fontSize: 10, fontWeight: 700,
                color: statusLabel === 'Deuce' ? '#f59e0b' : '#ef4444',
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}>
                {statusLabel}
              </span>
            )}
            {match.court && (
              <span style={{ fontSize: 10, color: mutedColor }}>
                {match.court}
              </span>
            )}
          </div>
        )}
      </div>
    </>
  );
}
