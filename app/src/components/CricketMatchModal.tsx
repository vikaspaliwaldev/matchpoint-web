'use client';

import React, { useState } from 'react';
import { Match, Tournament, TournamentEvent } from '@/types';
import {
  CricketMetadata,
  CricketInnings,
  CricketBall,
  calculateCurrentRunRate,
  calculateRequiredRunRate,
} from '@/lib/sports-rules';
import { getTeamLogo } from '@/lib/team-logos';

interface CricketMatchModalProps {
  match: Match;
  tournament?: Tournament;
  event?: TournamentEvent;
  onClose: () => void;
}

export default function CricketMatchModal({
  match,
  tournament,
  event,
  onClose,
}: CricketMatchModalProps) {
  const [activeTab, setActiveTab] = useState<'live' | 'scorecard' | 'commentary' | 'info'>('live');
  const [selectedInningsTab, setSelectedInningsTab] = useState<1 | 2>(1);

  const meta = match.sport_metadata as CricketMetadata | undefined;
  const currentInningsNum = meta?.current_innings || 1;
  const inn1 = meta?.innings_1;
  const inn2 = meta?.innings_2;

  // View innings based on sub-tab
  const viewingInnings = selectedInningsTab === 1 ? inn1 : (inn2 || inn1);
  const activeInnings = currentInningsNum === 1 ? inn1 : (inn2 || inn1);

  const crr = activeInnings ? calculateCurrentRunRate(activeInnings.total_runs, activeInnings.balls_bowled) : 0;
  const targetRuns = inn2?.target_runs;
  const ballsRemaining = activeInnings ? Math.max(0, activeInnings.max_overs * 6 - activeInnings.balls_bowled) : 0;
  const runsNeeded = targetRuns && activeInnings ? Math.max(0, targetRuns - activeInnings.total_runs) : 0;
  const rrr = currentInningsNum === 2 && targetRuns ? calculateRequiredRunRate(runsNeeded, ballsRemaining) : 0;

  // Striker & Non-Striker
  const striker = meta?.striker_id && activeInnings?.batters ? activeInnings.batters[meta.striker_id] : null;
  const nonStriker = meta?.non_striker_id && activeInnings?.batters ? activeInnings.batters[meta.non_striker_id] : null;
  const bowler = meta?.bowler_id && activeInnings?.bowlers ? activeInnings.bowlers[meta.bowler_id] : null;

  // Deliveries list reverse-ordered
  const allDeliveries = activeInnings?.deliveries || [];
  const deliveriesReversed = [...allDeliveries].reverse();

  // Group deliveries into overs for CricHeroes-style commentary
  const overGroups: { overNumber: number; balls: CricketBall[]; runsInOver: number; wicketsInOver: number }[] = [];
  const overMap = new Map<number, CricketBall[]>();
  allDeliveries.forEach(b => {
    const list = overMap.get(b.over_number) || [];
    list.push(b);
    overMap.set(b.over_number, list);
  });
  Array.from(overMap.keys())
    .sort((a, b) => b - a)
    .forEach(ov => {
      const balls = overMap.get(ov) || [];
      const runs = balls.reduce((sum, b) => sum + (b.total_runs || 0), 0);
      const wkts = balls.filter(b => b.is_wicket).length;
      overGroups.push({
        overNumber: ov + 1,
        balls: [...balls].reverse(),
        runsInOver: runs,
        wicketsInOver: wkts,
      });
    });

  // Recent balls for strip (last 12 balls)
  const recentBalls = allDeliveries.slice(-12);

  return (
    <div
      onClick={e => {
        // Allow clicking outer background to close as well
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: '#070d1e',
        zIndex: 10000,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 0,
      }}
    >
      <div style={{
        background: '#0b1329',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        width: '100%',
        maxWidth: 960,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 0 50px rgba(0,0,0,0.8)',
        color: '#f8fafc',
      }}>
        {/* Header Bar with prominent Back navigation */}
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          background: 'linear-gradient(135deg, #0f172a 0%, #091328 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 20,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#f8fafc',
                borderRadius: 8,
                padding: '6px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 700,
                transition: 'all 0.2s',
              }}
              title="Return to Main Page"
            >
              <span>←</span>
              <span>Back</span>
            </button>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  background: '#ea580c',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 4,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}>
                  🏏 CricHeroes Scorecard
                </span>
                <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
                  {tournament?.name} {event?.event_name ? `· ${event.event_name}` : ''}
                </span>
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: '2px 0 0 0', color: '#f8fafc' }}>
                {match.player1_name} vs {match.player2_name}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              color: '#cbd5e1',
              borderRadius: '50%',
              width: 34,
              height: 34,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: 16,
              fontWeight: 700,
            }}
            title="Close (Return to Main Page)"
          >
            ✕
          </button>
        </div>

        {/* CricHeroes Style Hero Scoreboard Banner */}
        <div style={{
          padding: '16px 20px',
          background: 'linear-gradient(135deg, #091328 0%, #112240 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {activeInnings ? activeInnings.batting_team_name : match.player1_name} · Innings {currentInningsNum}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 4 }}>
                <span style={{ fontSize: 'clamp(36px, 6vw, 48px)', fontWeight: 900, fontFamily: 'monospace', color: '#f8fafc', lineHeight: 1 }}>
                  {activeInnings ? `${activeInnings.total_runs}/${activeInnings.wickets}` : '0/0'}
                </span>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#94a3b8' }}>
                  ({activeInnings?.overs_formatted || '0.0'} / {activeInnings?.max_overs || meta?.overs_per_innings || 20} ov)
                </span>
              </div>
              {inn1 && currentInningsNum === 2 && (
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                  1st Inn: {inn1.batting_team_name} {inn1.total_runs}/{inn1.wickets} ({inn1.overs_formatted} ov)
                </div>
              )}
            </div>

            {/* Run Rate & Match Equations */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#38bdf8' }}>
                CRR: <span style={{ fontFamily: 'monospace' }}>{crr.toFixed(2)}</span>
              </div>
              {currentInningsNum === 2 && targetRuns && (
                <div style={{ marginTop: 4 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#facc15' }}>
                    Need {runsNeeded} runs from {ballsRemaining} balls
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginTop: 2 }}>
                    RRR: <span style={{ fontFamily: 'monospace' }}>{rrr.toFixed(2)}</span>
                  </div>
                </div>
              )}
              {meta?.toss_winner_id && (
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 6, fontStyle: 'italic' }}>
                  Toss: {meta.toss_winner_id === 'player1' ? match.player1_name : match.player2_name} elected to {meta.toss_decision}
                </div>
              )}
            </div>
          </div>

          {/* Recent balls ribbon */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, overflowX: 'auto', paddingBottom: 2 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              Recent:
            </span>
            {recentBalls.length === 0 ? (
              <span style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>Match waiting for first delivery</span>
            ) : (
              recentBalls.map((b, idx) => {
                const isW = b.is_wicket;
                const isSix = b.runs_off_bat === 6;
                const isFour = b.runs_off_bat === 4;
                const isExtra = !b.is_legal;
                const bg = isW ? '#ef4444' : isSix ? '#8b5cf6' : isFour ? '#10b981' : isExtra ? '#f59e0b' : 'rgba(255,255,255,0.12)';
                const label = isW ? 'W' : b.extra_type ? `${b.total_runs}${b.extra_type === 'wide' ? 'wd' : 'nb'}` : `${b.runs_off_bat}`;
                return (
                  <div
                    key={idx}
                    style={{
                      minWidth: 26,
                      height: 26,
                      borderRadius: 13,
                      background: bg,
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 800,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                      flexShrink: 0,
                    }}
                  >
                    {label}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Navigation Tabs (Live / Scorecard / Commentary / Match Info) */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: '#090e1e',
        }}>
          {[
            { id: 'live', label: '⚡ Live' },
            { id: 'scorecard', label: '📊 Full Scorecard' },
            { id: 'commentary', label: '🎙️ Commentary' },
            { id: 'info', label: 'ℹ️ Match Info' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                flex: 1,
                padding: '12px 14px',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #38bdf8' : '2px solid transparent',
                color: activeTab === tab.id ? '#38bdf8' : '#94a3b8',
                fontWeight: activeTab === tab.id ? 800 : 600,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Container */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {/* TAB 1: LIVE CREASE SNAPSHOT */}
          {activeTab === 'live' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Batting on Crease */}
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: '10px 14px',
                  background: 'rgba(255,255,255,0.05)',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  fontSize: 12,
                  fontWeight: 800,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}>
                  <span>Batting</span>
                  <div style={{ display: 'flex', gap: 20 }}>
                    <span style={{ width: 28, textAlign: 'right' }}>R</span>
                    <span style={{ width: 28, textAlign: 'right' }}>B</span>
                    <span style={{ width: 28, textAlign: 'right' }}>4s</span>
                    <span style={{ width: 28, textAlign: 'right' }}>6s</span>
                    <span style={{ width: 44, textAlign: 'right' }}>SR</span>
                  </div>
                </div>

                {/* Striker Row */}
                <div style={{
                  padding: '12px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#60a5fa' }}>
                      {meta?.striker_name || striker?.player_name || 'Striker'} *
                    </span>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: 4,
                      background: 'rgba(56, 189, 248, 0.15)',
                      color: '#38bdf8',
                    }}>
                      {striker?.batting_style || meta?.striker_batting_style || 'RHB'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 20, fontFamily: 'monospace', fontWeight: 700, fontSize: 13 }}>
                    <span style={{ width: 28, textAlign: 'right', color: '#f8fafc', fontWeight: 800 }}>{striker?.runs ?? 0}</span>
                    <span style={{ width: 28, textAlign: 'right', color: '#94a3b8' }}>{striker?.balls_faced ?? 0}</span>
                    <span style={{ width: 28, textAlign: 'right', color: '#94a3b8' }}>{striker?.fours ?? 0}</span>
                    <span style={{ width: 28, textAlign: 'right', color: '#94a3b8' }}>{striker?.sixes ?? 0}</span>
                    <span style={{ width: 44, textAlign: 'right', color: '#38bdf8' }}>{striker?.strike_rate?.toFixed(1) ?? '0.0'}</span>
                  </div>
                </div>

                {/* Non-Striker Row */}
                <div style={{
                  padding: '12px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>
                      {meta?.non_striker_name || nonStriker?.player_name || 'Non-Striker'}
                    </span>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: 4,
                      background: 'rgba(148, 163, 184, 0.15)',
                      color: '#94a3b8',
                    }}>
                      {nonStriker?.batting_style || meta?.non_striker_batting_style || 'RHB'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 20, fontFamily: 'monospace', fontWeight: 700, fontSize: 13 }}>
                    <span style={{ width: 28, textAlign: 'right', color: '#f8fafc', fontWeight: 800 }}>{nonStriker?.runs ?? 0}</span>
                    <span style={{ width: 28, textAlign: 'right', color: '#94a3b8' }}>{nonStriker?.balls_faced ?? 0}</span>
                    <span style={{ width: 28, textAlign: 'right', color: '#94a3b8' }}>{nonStriker?.fours ?? 0}</span>
                    <span style={{ width: 28, textAlign: 'right', color: '#94a3b8' }}>{nonStriker?.sixes ?? 0}</span>
                    <span style={{ width: 44, textAlign: 'right', color: '#38bdf8' }}>{nonStriker?.strike_rate?.toFixed(1) ?? '0.0'}</span>
                  </div>
                </div>
              </div>

              {/* Current Bowler Card */}
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: '10px 14px',
                  background: 'rgba(255,255,255,0.05)',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  fontSize: 12,
                  fontWeight: 800,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}>
                  <span>Bowling</span>
                  <div style={{ display: 'flex', gap: 20 }}>
                    <span style={{ width: 28, textAlign: 'right' }}>O</span>
                    <span style={{ width: 28, textAlign: 'right' }}>M</span>
                    <span style={{ width: 28, textAlign: 'right' }}>R</span>
                    <span style={{ width: 28, textAlign: 'right' }}>W</span>
                    <span style={{ width: 44, textAlign: 'right' }}>ECON</span>
                  </div>
                </div>

                <div style={{
                  padding: '12px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#34d399' }}>
                      {meta?.bowler_name || bowler?.player_name || 'Bowler'}
                    </span>
                    {bowler?.bowling_style && (
                      <span style={{ fontSize: 10, color: '#94a3b8', fontStyle: 'italic' }}>
                        ({bowler.bowling_style})
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 20, fontFamily: 'monospace', fontWeight: 700, fontSize: 13 }}>
                    <span style={{ width: 28, textAlign: 'right', color: '#f8fafc' }}>{bowler?.overs ?? '0.0'}</span>
                    <span style={{ width: 28, textAlign: 'right', color: '#94a3b8' }}>{bowler?.maidens ?? 0}</span>
                    <span style={{ width: 28, textAlign: 'right', color: '#f8fafc' }}>{bowler?.runs_conceded ?? 0}</span>
                    <span style={{ width: 28, textAlign: 'right', color: '#34d399', fontWeight: 800 }}>{bowler?.wickets ?? 0}</span>
                    <span style={{ width: 44, textAlign: 'right', color: '#38bdf8' }}>{bowler?.economy?.toFixed(2) ?? '0.00'}</span>
                  </div>
                </div>
              </div>

              {/* Latest Commentary highlight */}
              {allDeliveries.length > 0 && (
                <div style={{
                  padding: '14px',
                  background: 'rgba(56, 189, 248, 0.05)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  borderRadius: 12,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', marginBottom: 4 }}>
                    Last Delivery
                  </div>
                  <div style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.5 }}>
                    <strong>{allDeliveries[allDeliveries.length - 1].bowler_name}</strong> to <strong>{allDeliveries[allDeliveries.length - 1].striker_name}</strong>: {allDeliveries[allDeliveries.length - 1].commentary || `${allDeliveries[allDeliveries.length - 1].total_runs} run(s)`}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FULL SCORECARD */}
          {activeTab === 'scorecard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Innings selector tab */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setSelectedInningsTab(1)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: selectedInningsTab === 1 ? '#38bdf8' : 'rgba(255,255,255,0.05)',
                    color: selectedInningsTab === 1 ? '#091328' : '#cbd5e1',
                    border: 'none',
                  }}
                >
                  1st Innings ({inn1 ? `${inn1.batting_team_name} ${inn1.total_runs}/${inn1.wickets}` : 'Pending'})
                </button>
                {inn2 && (
                  <button
                    onClick={() => setSelectedInningsTab(2)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: selectedInningsTab === 2 ? '#38bdf8' : 'rgba(255,255,255,0.05)',
                      color: selectedInningsTab === 2 ? '#091328' : '#cbd5e1',
                      border: 'none',
                    }}
                  >
                    2nd Innings ({inn2.batting_team_name} {inn2.total_runs}/{inn2.wickets})
                  </button>
                )}
              </div>

              {/* Batting Table */}
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: '10px 14px',
                  background: 'rgba(255,255,255,0.05)',
                  fontSize: 12,
                  fontWeight: 800,
                  color: '#38bdf8',
                  textTransform: 'uppercase',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}>
                  <span>Batting — {viewingInnings?.batting_team_name}</span>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <span style={{ width: 28, textAlign: 'right' }}>R</span>
                    <span style={{ width: 28, textAlign: 'right' }}>B</span>
                    <span style={{ width: 28, textAlign: 'right' }}>4s</span>
                    <span style={{ width: 28, textAlign: 'right' }}>6s</span>
                    <span style={{ width: 44, textAlign: 'right' }}>SR</span>
                  </div>
                </div>

                {viewingInnings && Object.values(viewingInnings.batters || {}).map((b, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '10px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderTop: '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: b.is_out ? '#cbd5e1' : '#60a5fa' }}>
                          {b.player_name} {!b.is_out && '*'}
                        </span>
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 4px', borderRadius: 3, background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>
                          {b.batting_style || 'RHB'}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                        {b.is_out ? (b.dismissal_text || 'out') : 'not out'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontFamily: 'monospace', fontWeight: 700, fontSize: 13 }}>
                      <span style={{ width: 28, textAlign: 'right', color: '#f8fafc', fontWeight: 800 }}>{b.runs}</span>
                      <span style={{ width: 28, textAlign: 'right', color: '#94a3b8' }}>{b.balls_faced}</span>
                      <span style={{ width: 28, textAlign: 'right', color: '#94a3b8' }}>{b.fours}</span>
                      <span style={{ width: 28, textAlign: 'right', color: '#94a3b8' }}>{b.sixes}</span>
                      <span style={{ width: 44, textAlign: 'right', color: '#38bdf8' }}>{b.strike_rate?.toFixed(1) || '0.0'}</span>
                    </div>
                  </div>
                ))}

                {/* Extras & Total Summary */}
                <div style={{
                  padding: '10px 14px',
                  background: 'rgba(255,255,255,0.02)',
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  color: '#94a3b8',
                }}>
                  <span>Extras: (wd {viewingInnings?.extras?.wides || 0}, nb {viewingInnings?.extras?.no_balls || 0}, b {viewingInnings?.extras?.byes || 0}, lb {viewingInnings?.extras?.leg_byes || 0})</span>
                  <strong style={{ color: '#f8fafc' }}>{viewingInnings?.extras?.total || 0}</strong>
                </div>
                <div style={{
                  padding: '12px 14px',
                  background: 'rgba(56, 189, 248, 0.08)',
                  borderTop: '1px solid rgba(56, 189, 248, 0.2)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 14,
                  fontWeight: 900,
                  color: '#f8fafc',
                }}>
                  <span>Total</span>
                  <span style={{ fontFamily: 'monospace' }}>
                    {viewingInnings?.total_runs}/{viewingInnings?.wickets} ({viewingInnings?.overs_formatted} Ov)
                  </span>
                </div>
              </div>

              {/* Bowling Table */}
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: '10px 14px',
                  background: 'rgba(255,255,255,0.05)',
                  fontSize: 12,
                  fontWeight: 800,
                  color: '#34d399',
                  textTransform: 'uppercase',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}>
                  <span>Bowling — {viewingInnings?.bowling_team_name}</span>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <span style={{ width: 28, textAlign: 'right' }}>O</span>
                    <span style={{ width: 28, textAlign: 'right' }}>M</span>
                    <span style={{ width: 28, textAlign: 'right' }}>R</span>
                    <span style={{ width: 28, textAlign: 'right' }}>W</span>
                    <span style={{ width: 44, textAlign: 'right' }}>ECON</span>
                  </div>
                </div>

                {viewingInnings && Object.values(viewingInnings.bowlers || {}).map((bw, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '10px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderTop: '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>
                      {bw.player_name}
                    </span>
                    <div style={{ display: 'flex', gap: 16, fontFamily: 'monospace', fontWeight: 700, fontSize: 13 }}>
                      <span style={{ width: 28, textAlign: 'right', color: '#f8fafc' }}>{bw.overs}</span>
                      <span style={{ width: 28, textAlign: 'right', color: '#94a3b8' }}>{bw.maidens}</span>
                      <span style={{ width: 28, textAlign: 'right', color: '#f8fafc' }}>{bw.runs_conceded}</span>
                      <span style={{ width: 28, textAlign: 'right', color: '#34d399', fontWeight: 800 }}>{bw.wickets}</span>
                      <span style={{ width: 44, textAlign: 'right', color: '#38bdf8' }}>{bw.economy?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Fall of Wickets (FOW) */}
              {viewingInnings && viewingInnings.fall_of_wickets && viewingInnings.fall_of_wickets.length > 0 && (
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12,
                  padding: '12px 14px',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', marginBottom: 8 }}>
                    Fall of Wickets
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12, color: '#cbd5e1' }}>
                    {viewingInnings.fall_of_wickets.map((fow, i) => (
                      <span key={i} style={{ background: 'rgba(255,255,255,0.04)', padding: '4px 8px', borderRadius: 6 }}>
                        <strong>{fow.runs}/{fow.wicket_number}</strong> ({fow.player_name}, {fow.overs} ov)
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: LIVE COMMENTARY */}
          {activeTab === 'commentary' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {overGroups.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🎙️</div>
                  <p style={{ margin: 0, fontSize: 14 }}>No deliveries bowled yet. Live commentary will stream ball-by-ball here.</p>
                </div>
              ) : (
                overGroups.map(grp => (
                  <div
                    key={grp.overNumber}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 12,
                      overflow: 'hidden',
                    }}
                  >
                    {/* Over Summary Header */}
                    <div style={{
                      padding: '10px 14px',
                      background: 'rgba(56, 189, 248, 0.08)',
                      borderBottom: '1px solid rgba(56, 189, 248, 0.15)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#38bdf8' }}>
                        END OF OVER {grp.overNumber}
                      </span>
                      <span style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 700 }}>
                        {grp.runsInOver} runs · {grp.wicketsInOver} wkt(s)
                      </span>
                    </div>

                    {/* Ball-by-ball stream */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {grp.balls.map(ball => {
                        const isW = ball.is_wicket;
                        const isSix = ball.runs_off_bat === 6;
                        const isFour = ball.runs_off_bat === 4;
                        const isExtra = !ball.is_legal;
                        const pillBg = isW ? '#ef4444' : isSix ? '#8b5cf6' : isFour ? '#10b981' : isExtra ? '#f59e0b' : 'rgba(255,255,255,0.12)';
                        const pillText = isW ? 'W' : ball.extra_type ? `${ball.total_runs}${ball.extra_type === 'wide' ? 'wd' : 'nb'}` : `${ball.runs_off_bat}`;

                        return (
                          <div
                            key={ball.id}
                            style={{
                              padding: '10px 14px',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 12,
                              borderBottom: '1px solid rgba(255,255,255,0.03)',
                            }}
                          >
                            <span style={{
                              fontFamily: 'monospace',
                              fontWeight: 800,
                              fontSize: 12,
                              color: '#94a3b8',
                              minWidth: 32,
                              marginTop: 2,
                            }}>
                              {ball.over_number}.{ball.ball_in_over}
                            </span>
                            <div style={{
                              minWidth: 26,
                              height: 26,
                              borderRadius: 13,
                              background: pillBg,
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 11,
                              fontWeight: 800,
                              flexShrink: 0,
                            }}>
                              {pillText}
                            </div>
                            <div style={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: 1.4 }}>
                              <span style={{ fontWeight: 700, color: '#f8fafc' }}>
                                {ball.bowler_name} to {ball.striker_name}:{' '}
                              </span>
                              <span style={{ color: '#cbd5e1' }}>
                                {ball.commentary || `${ball.total_runs} run(s) scored.`}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: MATCH INFO */}
          {activeTab === 'info' && (
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              fontSize: 13,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8 }}>
                <span style={{ color: '#94a3b8' }}>Tournament</span>
                <span style={{ fontWeight: 700 }}>{tournament?.name || 'Tournament'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8 }}>
                <span style={{ color: '#94a3b8' }}>Match Format</span>
                <span style={{ fontWeight: 700, textTransform: 'uppercase' }}>{meta?.format || 'T20'} ({meta?.overs_per_innings || 20} Overs per side)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8 }}>
                <span style={{ color: '#94a3b8' }}>Ground / Venue</span>
                <span style={{ fontWeight: 700 }}>{match.court || 'Ground 1'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8 }}>
                <span style={{ color: '#94a3b8' }}>Toss</span>
                <span style={{ fontWeight: 700 }}>
                  {meta?.toss_winner_id ? `${meta.toss_winner_id === 'player1' ? match.player1_name : match.player2_name} won the toss and chose to ${meta.toss_decision}` : 'Yet to be conducted'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Umpire</span>
                <span style={{ fontWeight: 700 }}>{match.umpire_name || 'Official Umpire'}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
