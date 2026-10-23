'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Match } from '@/types';
import { getMatches } from '@/lib/supabase-service';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { CricketMetadata, CricketInnings } from '@/lib/sports-rules';

/**
 * CricHeroes-Style Cricket Live Streaming Overlay for OBS / vMix
 * 
 * Usage: Add as a Browser Source in OBS Studio / vMix.
 * Resolution: 1920 x 1080
 * URL: /overlay/cricket?matchId={matchId}&theme=ipl&position=bottom
 * 
 * URL Parameters:
 * - matchId: ID of the match
 * - theme: 'ipl' | 'icc' | 'turf' | 'minimal' (default: 'ipl')
 * - position: 'bottom' | 'top' (default: 'bottom')
 * - showLastBalls: 'true' | 'false' (default: 'true')
 * - team1Color: hex code (e.g., #0284c7)
 * - team2Color: hex code (e.g., #ea580c)
 */

export default function CricketOverlayClient() {
  const searchParams = useSearchParams();
  const matchId = searchParams?.get('matchId') || '';

  // Customization params
  const theme = searchParams?.get('theme') || 'ipl';
  const position = searchParams?.get('position') || 'bottom';
  const showLastBallsParam = searchParams?.get('showLastBalls') !== 'false';
  const customT1Color = searchParams?.get('team1Color') || '#1d4ed8';
  const customT2Color = searchParams?.get('team2Color') || '#059669';

  // State
  const [match, setMatch] = useState<Match | null>(null);
  const [celebration, setCelebration] = useState<{ type: 'four' | 'six' | 'wicket' | 'fifty'; text: string } | null>(null);
  const lastDeliveryIdRef = useRef<string>('');

  // Broadcaster manual trigger controls open/close
  const [showControls, setShowControls] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(theme);
  const [team1Color, setTeam1Color] = useState(customT1Color);
  const [team2Color, setTeam2Color] = useState(customT2Color);
  const [showLastBalls, setShowLastBalls] = useState(showLastBallsParam);

  // Load match
  useEffect(() => {
    async function load() {
      if (!matchId) return;
      try {
        const all = await getMatches();
        const found = all.find(m => m.id === matchId);
        if (found) setMatch(found);
      } catch (err) {
        console.error('Cricket Overlay: Failed to load match:', err);
      }
    }
    load();
  }, [matchId]);

  // Real-time updates via Spring SSE stream or Supabase Realtime
  useEffect(() => {
    if (!matchId) return;

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    let sseSource: EventSource | null = null;

    try {
      sseSource = new EventSource(`${apiBaseUrl}/api/v1/live/match/${matchId}`);
      sseSource.addEventListener('match-update', (event: any) => {
        try {
          const updatedMatch = JSON.parse(event.data);
          if (updatedMatch && updatedMatch.id === matchId) {
            setMatch(updatedMatch);
          }
        } catch {}
      });
      sseSource.onmessage = (event) => {
        try {
          const updatedMatch = JSON.parse(event.data);
          if (updatedMatch && updatedMatch.id === matchId) {
            setMatch(updatedMatch);
          }
        } catch {}
      };
    } catch {}

    // Polling fallback every 2 seconds for local/offline resilience
    const pollInterval = setInterval(async () => {
      try {
        const all = await getMatches();
        const found = all.find(m => m.id === matchId);
        if (found) setMatch(found);
      } catch {}
    }, 2000);

    // Fallback: Supabase postgres_changes
    let channel: any = null;
    if (isSupabaseConfigured && supabase) {
      channel = supabase
        .channel(`cricket_overlay_${matchId}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` },
          (payload: any) => {
            if (payload?.new) {
              setMatch(prev => ({ ...prev, ...payload.new }));
            }
          }
        )
        .subscribe();
    }

    return () => {
      if (sseSource) sseSource.close();
      clearInterval(pollInterval);
      if (channel && supabase) supabase.removeChannel(channel);
    };
  }, [matchId]);

  // Watch for boundary or wicket events to trigger animated celebration popups
  useEffect(() => {
    if (!match || !match.sport_metadata) return;
    const meta = match.sport_metadata as CricketMetadata;
    const inn = meta.current_innings === 1 ? meta.innings_1 : (meta.innings_2 || meta.innings_1);
    if (!inn || !inn.deliveries || inn.deliveries.length === 0) return;

    const lastBall = inn.deliveries[inn.deliveries.length - 1];
    if (lastBall && lastBall.id !== lastDeliveryIdRef.current) {
      lastDeliveryIdRef.current = lastBall.id;

      if (lastBall.runs_off_bat === 4) {
        setCelebration({ type: 'four', text: '💥 FOUR! BOUNDARY' });
        setTimeout(() => setCelebration(null), 4500);
      } else if (lastBall.runs_off_bat === 6) {
        setCelebration({ type: 'six', text: '🚀 MAXIMUM! 6 RUNS' });
        setTimeout(() => setCelebration(null), 5000);
      } else if (lastBall.is_wicket) {
        const dismissText = lastBall.wicket_type ? `${lastBall.wicket_type.toUpperCase()}` : 'OUT';
        setCelebration({ type: 'wicket', text: `❌ WICKET! ${dismissText}` });
        setTimeout(() => setCelebration(null), 5000);
      }
    }
  }, [match]);

  if (!match) {
    return (
      <div style={{ padding: 24, color: 'rgba(255,255,255,0.7)', fontFamily: 'system-ui, sans-serif' }}>
        Waiting for cricket match broadcast feed... (Match ID: {matchId || 'None'})
      </div>
    );
  }

  const meta = (match.sport_metadata || {}) as CricketMetadata;
  const currentInnNum = meta.current_innings || 1;
  const inn: CricketInnings = currentInnNum === 1 ? (meta.innings_1 || ({} as any)) : (meta.innings_2 || meta.innings_1 || ({} as any));

  const battingTeamName = inn.batting_team_name || match.player1_name;
  const bowlingTeamName = inn.bowling_team_name || match.player2_name;
  const totalRuns = inn.total_runs ?? 0;
  const wickets = inn.wickets ?? 0;
  const oversFormatted = inn.overs_formatted || '0.0';
  const maxOvers = inn.max_overs || 20;

  // Active Players
  const striker = inn.batters?.[meta.striker_id] || { player_name: meta.striker_name || 'Striker', runs: 0, balls_faced: 0 };
  const nonStriker = inn.batters?.[meta.non_striker_id] || { player_name: meta.non_striker_name || 'Non-Striker', runs: 0, balls_faced: 0 };
  const bowler = inn.bowlers?.[meta.bowler_id] || { player_name: meta.bowler_name || 'Bowler', overs: 0, runs_conceded: 0, wickets: 0 };

  const target = inn.target_runs;
  const ballsRemaining = Math.max(0, (maxOvers * 6) - (inn.balls_bowled || 0));
  const runsNeeded = target ? Math.max(0, target - totalRuns) : 0;

  const deliveries = inn.deliveries || [];
  const lastBalls = deliveries.slice(-6);

  // Theme styling presets
  const isIpl = selectedTheme === 'ipl';
  const isIcc = selectedTheme === 'icc';
  const isTurf = selectedTheme === 'turf';

  const tickerBg = isIpl
    ? 'linear-gradient(90deg, rgba(15, 23, 42, 0.96) 0%, rgba(30, 41, 59, 0.94) 100%)'
    : isIcc
    ? 'linear-gradient(90deg, #0f172a 0%, #1e3a8a 100%)'
    : isTurf
    ? 'linear-gradient(90deg, rgba(20, 83, 45, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)'
    : 'rgba(15, 23, 42, 0.92)';

  const activeTeamColor = inn.batting_team_id === 'player1' ? team1Color : team2Color;

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'transparent',
      overflow: 'hidden',
      position: 'relative',
      fontFamily: 'Outfit, system-ui, -apple-system, sans-serif',
    }}>
      {/* ── BROADCASTER FLOATING CONTROLS TOGGLE ── */}
      <div style={{ position: 'fixed', top: 12, right: 12, zIndex: 1000 }}>
        <button
          onClick={() => setShowControls(!showControls)}
          style={{
            padding: '6px 12px',
            fontSize: 11,
            fontWeight: 800,
            borderRadius: 6,
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}
        >
          ⚙️ Overlay Customizer
        </button>

        {showControls && (
          <div style={{
            marginTop: 8,
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 8,
            padding: 14,
            width: 260,
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            fontSize: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          }}>
            <div style={{ fontWeight: 800, color: '#38bdf8', fontSize: 13 }}>Overlay Settings</div>

            <div>
              <label style={{ display: 'block', fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>Theme Preset</label>
              <select
                value={selectedTheme}
                onChange={e => setSelectedTheme(e.target.value)}
                style={{ width: '100%', padding: '6px', borderRadius: 4, background: '#1e293b', color: '#fff', border: '1px solid #334155' }}
              >
                <option value="ipl">IPL / Modern Neon</option>
                <option value="icc">ICC Corporate Blue</option>
                <option value="turf">Turf / Grass Green</option>
                <option value="minimal">Minimal Dark Glass</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label style={{ display: 'block', fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>Team 1 Color</label>
                <input
                  type="color"
                  value={team1Color}
                  onChange={e => setTeam1Color(e.target.value)}
                  style={{ width: '100%', height: 32, padding: 0, border: 'none', borderRadius: 4, cursor: 'pointer' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>Team 2 Color</label>
                <input
                  type="color"
                  value={team2Color}
                  onChange={e => setTeam2Color(e.target.value)}
                  style={{ width: '100%', height: 32, padding: 0, border: 'none', borderRadius: 4, cursor: 'pointer' }}
                />
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showLastBalls}
                onChange={e => setShowLastBalls(e.target.checked)}
              />
              Show Last Balls Ribbon
            </label>

            {/* Manual celebration triggers */}
            <div style={{ borderTop: '1px solid #334155', paddingTop: 8 }}>
              <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 6 }}>Manual Triggers:</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
                <button
                  onClick={() => { setCelebration({ type: 'four', text: '💥 FOUR!' }); setTimeout(() => setCelebration(null), 4000); }}
                  style={{ padding: '4px', fontSize: 10, fontWeight: 700, background: '#10b981', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                >
                  4️⃣ Four
                </button>
                <button
                  onClick={() => { setCelebration({ type: 'six', text: '🚀 MAXIMUM 6!' }); setTimeout(() => setCelebration(null), 4000); }}
                  style={{ padding: '4px', fontSize: 10, fontWeight: 700, background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                >
                  6️⃣ Six
                </button>
                <button
                  onClick={() => { setCelebration({ type: 'wicket', text: '❌ WICKET!' }); setTimeout(() => setCelebration(null), 4000); }}
                  style={{ padding: '4px', fontSize: 10, fontWeight: 700, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                >
                  ⚡ Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── CELEBRATION FULLSCREEN/MIDSCREEN POPUP ── */}
      {celebration && (
        <div style={{
          position: 'fixed',
          top: '38%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 999,
          background: celebration.type === 'wicket'
            ? 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)'
            : celebration.type === 'six'
            ? 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)'
            : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
          color: '#ffffff',
          padding: '16px 48px',
          borderRadius: 16,
          boxShadow: '0 12px 48px rgba(0,0,0,0.7)',
          border: '3px solid #ffffff',
          fontSize: 36,
          fontWeight: 900,
          letterSpacing: 2,
          textAlign: 'center',
          animation: 'bounceIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }}>
          {celebration.text}
        </div>
      )}

      {/* ── CRICHEROES-STYLE LOWER-THIRD BROADCAST TICKER ── */}
      <div style={{
        position: 'fixed',
        left: 36,
        right: 36,
        ...(position === 'top' ? { top: 24 } : { bottom: 28 }),
        height: 64,
        background: tickerBg,
        border: '1.5px solid rgba(255, 255, 255, 0.15)',
        borderRadius: 12,
        boxShadow: '0 16px 36px rgba(0,0,0,0.65)',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        zIndex: 500,
        backdropFilter: 'blur(12px)',
      }}>
        {/* Left Block: Team Identity & Score */}
        <div style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          background: activeTeamColor,
          color: '#ffffff',
          gap: 12,
          flexShrink: 0,
          boxShadow: '4px 0 16px rgba(0,0,0,0.25)',
        }}>
          <span style={{ fontSize: 20 }}>🏏</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.5, lineHeight: 1.1 }}>
              {battingTeamName}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.85, textTransform: 'uppercase' }}>
              Innings {currentInnNum}
            </div>
          </div>
          <div style={{
            fontSize: 28,
            fontWeight: 900,
            fontFamily: 'monospace',
            letterSpacing: 1,
            marginLeft: 8,
          }}>
            {totalRuns}/{wickets}
            <span style={{ fontSize: 14, fontWeight: 700, opacity: 0.85, marginLeft: 4 }}>
              ({oversFormatted})
            </span>
          </div>
        </div>

        {/* Center Block: Active Striker & Non-Striker */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          padding: '0 24px',
          color: '#ffffff',
          flex: 1,
        }}>
          {/* Striker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#facc15' }}>🏏</span>
            <div>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#ffffff' }}>
                {striker.player_name} *
              </span>
              <span style={{ fontSize: 15, fontWeight: 900, color: '#38bdf8', marginLeft: 8 }}>
                {striker.runs}
              </span>
              <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 4 }}>
                ({striker.balls_faced})
              </span>
            </div>
          </div>

          <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>

          {/* Non-Striker */}
          <div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#cbd5e1' }}>
              {nonStriker.player_name}
            </span>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#ffffff', marginLeft: 8 }}>
              {nonStriker.runs}
            </span>
            <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 4 }}>
              ({nonStriker.balls_faced})
            </span>
          </div>

          <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>

          {/* Bowler Analysis */}
          <div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#34d399' }}>
              Bowl: {bowler.player_name}
            </span>
            <span style={{ fontSize: 13, fontWeight: 900, color: '#ffffff', marginLeft: 8, fontFamily: 'monospace' }}>
              {bowler.wickets}-{bowler.runs_conceded} ({bowler.overs} ov)
            </span>
          </div>
        </div>

        {/* Right Block: Target / RRR and Last Balls */}
        <div style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          gap: 16,
          background: 'rgba(0,0,0,0.3)',
          flexShrink: 0,
        }}>
          {/* Target / Equation */}
          {target && currentInnNum === 2 ? (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: '#facc15' }}>
                Target: {target}
              </div>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8' }}>
                Need {runsNeeded} off {ballsRemaining}b
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#38bdf8' }}>
                CRR: {(inn.balls_bowled > 0 ? (totalRuns / (inn.balls_bowled / 6)).toFixed(2) : '0.00')}
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8' }}>
                Max: {maxOvers} ov
              </div>
            </div>
          )}

          {/* Last Balls Ribbon */}
          {showLastBalls && lastBalls.length > 0 && (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: 12 }}>
              {lastBalls.map((b, i) => {
                const isFour = b.runs_off_bat === 4;
                const isSix = b.runs_off_bat === 6;
                const isW = b.is_wicket;
                const isExtra = !b.is_legal;

                const bg = isW ? '#ef4444' : isSix ? '#8b5cf6' : isFour ? '#10b981' : isExtra ? '#f59e0b' : 'rgba(255,255,255,0.18)';
                const label = isW ? 'W' : b.extra_type ? `${b.total_runs}${b.extra_type === 'wide' ? 'w' : 'n'}` : `${b.runs_off_bat}`;

                return (
                  <div
                    key={i}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      background: bg,
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      fontWeight: 900,
                    }}
                  >
                    {label}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
