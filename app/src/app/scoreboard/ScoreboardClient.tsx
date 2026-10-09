'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Match, Tournament } from '@/types';
import { getMatches, getTournaments } from '@/lib/supabase-service';
import { VolleyballStanding, calculateVolleyballStandings } from '@/lib/sports-rules';
import { getTeamLogo } from '@/lib/team-logos';

export default function ScoreboardClient() {
  const searchParams = useSearchParams();
  const matchId = searchParams?.get('matchId') || '';
  const courtFilter = searchParams?.get('court') || '';

  const [match, setMatch] = useState<Match | null>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [standings, setStandings] = useState<VolleyballStanding[]>([]);
  const [matchRunSeconds, setMatchRunSeconds] = useState<number>(0);
  const [availableMatches, setAvailableMatches] = useState<Match[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>(matchId);

  // Sync matchRunSeconds whenever match data loads
  useEffect(() => {
    if (!match) return;
    if (match.duration_seconds !== undefined && match.duration_seconds > 0) {
      setMatchRunSeconds(match.duration_seconds);
    } else if (match.actual_start_time) {
      const elapsed = Math.max(0, Math.floor((Date.now() - new Date(match.actual_start_time).getTime()) / 1000));
      setMatchRunSeconds(elapsed);
    } else {
      setMatchRunSeconds(0);
    }
  }, [match?.id, match?.duration_seconds, match?.actual_start_time]);

  // Tick match runtime every second ONLY if the match is actively 'running' (freezes when paused)
  useEffect(() => {
    if (!match || match.status !== 'running') return;
    const interval = setInterval(() => {
      setMatchRunSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [match?.status, match?.id]);

  const formatMatchRuntime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) {
      const remMins = mins % 60;
      return `${hrs.toString().padStart(2, '0')}:${remMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectMatch = (newMatchId: string) => {
    setSelectedMatchId(newMatchId);
    const target = availableMatches.find(m => m.id === newMatchId);
    if (target) {
      setMatch(target);
    }
    // Update browser URL query param without full reload
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('matchId', newMatchId);
      window.history.replaceState({}, '', url.toString());
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const [allMatches, tours] = await Promise.all([getMatches(), getTournaments()]);
        // Stadium TV only broadcasts currently live matches (running or paused)
        const liveMatches = allMatches.filter(m => m.status === 'running' || m.status === 'paused');
        if (isMounted) {
          setAvailableMatches(liveMatches);
        }
        
        let targetMatch: Match | undefined;
        const currentActiveId = selectedMatchId || matchId;
        if (currentActiveId) {
          targetMatch = liveMatches.find(m => m.id === currentActiveId);
        } else if (courtFilter) {
          targetMatch = liveMatches.find(m => m.court?.toLowerCase().includes(courtFilter.toLowerCase()));
        } else {
          targetMatch = liveMatches[0];
        }

        if (isMounted && targetMatch) {
          setMatch(targetMatch);
          const tour = tours.find(t => t.id === targetMatch?.tournament_id);
          if (tour) setTournament(tour);

          if (targetMatch.sport === 'volleyball' && targetMatch.tournament_id) {
            const tourMatches = allMatches.filter(m => m.tournament_id === targetMatch?.tournament_id);
            const teamMap = new Map<string, string>();
            tourMatches.forEach(m => {
              if (m.player1_id && m.player1_name) teamMap.set(m.player1_id, m.player1_name);
              if (m.player2_id && m.player2_name) teamMap.set(m.player2_id, m.player2_name);
            });
            const teamsList = Array.from(teamMap.entries()).map(([id, name]) => ({ id, name }));
            const calcStandings = calculateVolleyballStandings(teamsList, tourMatches as any);
            setStandings(calcStandings);
          }
        }
      } catch (e) {
        console.error('Scoreboard fetch error:', e);
      }
    };

    fetchData();
    const pollInterval = setInterval(fetchData, 2000);
    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [matchId, courtFilter, selectedMatchId]);

  if (!match) {
    return (
      <div style={{
        background: 'radial-gradient(ellipse at top, #0f172a 0%, #020617 100%)',
        color: '#64748B',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        <div style={{ fontSize: 56 }}>📺</div>
        <div style={{ fontSize: '28px', fontWeight: '800', color: '#F8FAFC', letterSpacing: '2px' }}>
          STADIUM TV • LIVE BROADCAST
        </div>
        <div style={{ fontSize: '16px', color: '#38BDF8', fontWeight: '600' }}>
          WAITING FOR AN ACTIVE LIVE MATCH TO BEGIN...
        </div>
        <p style={{ fontSize: '13px', color: '#94A3B8', maxWidth: 420, textAlign: 'center' }}>
          As soon as an umpire starts scoring a match, this arena screen will automatically switch to the real-time scoreboard.
        </p>
      </div>
    );
  }

  const sets = match.sets || [];
  const currentSetIdx = sets.findIndex(s => !s.is_complete) !== -1 ? sets.findIndex(s => !s.is_complete) : Math.max(0, sets.length - 1);
  const activeSet = sets[currentSetIdx] || { player1_score: 0, player2_score: 0, set_number: 1 };
  
  const meta = match.sport_metadata || {};
  const servingTeam = meta.serving_team || 'player1';
  const timeoutsP1 = meta.timeouts_p1 || 0;
  const timeoutsP2 = meta.timeouts_p2 || 0;

  const p1SetsWon = sets.filter(s => s.is_complete && (s.winner_id === 'player1' || s.winner_id === match.player1_id)).length;
  const p2SetsWon = sets.filter(s => s.is_complete && (s.winner_id === 'player2' || s.winner_id === match.player2_id)).length;

  return (
    <div
      style={{
        background: 'radial-gradient(ellipse at top, #0f172a 0%, #020617 100%)',
        color: '#F8FAFC',
        minHeight: '100vh',
        width: '100vw',
        padding: '3vh 4vw',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Stadium Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid rgba(255,255,255,0.1)', paddingBottom: '2vh' }}>
        <div>
          <div style={{ fontSize: '1.2vw', color: '#38BDF8', fontWeight: '800', letterSpacing: '3px', textTransform: 'uppercase' }}>
            {tournament?.name || 'MATCHPOINT ARENA'} • {match.court || 'CENTER COURT'}
          </div>
          <div style={{ fontSize: '2vw', fontWeight: '900', color: '#FFFFFF' }}>
            {match.round_name || 'CHAMPIONSHIP MATCH'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.5vw', alignItems: 'center' }}>
          {/* Match Switcher Dropdown */}
          <select
            value={match.id}
            onChange={(e) => {
              handleSelectMatch(e.target.value);
            }}
            style={{
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid #38BDF8',
              color: '#38BDF8',
              borderRadius: '8px',
              padding: '0.6vh 1vw',
              fontSize: '1vw',
              fontWeight: '700',
              cursor: 'pointer',
              outline: 'none',
              maxWidth: '22vw',
            }}
          >
            {availableMatches.map((m) => (
              <option key={m.id} value={m.id} style={{ background: '#0F172A', color: '#F8FAFC' }}>
                {m.player1_name} vs {m.player2_name} ({m.court || 'Court'}) - {m.status.toUpperCase()}
              </option>
            ))}
          </select>

          <div style={{
            background: match.status === 'running' ? '#DC2626' : match.status === 'paused' ? '#D97706' : '#EAB308',
            color: '#FFFFFF',
            padding: '0.6vh 1.5vw',
            borderRadius: '8px',
            fontWeight: '900',
            fontSize: '1.2vw',
            letterSpacing: '2px',
            boxShadow: match.status === 'paused' ? '0 0 25px rgba(217, 119, 6, 0.6)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5vw'
          }}>
            {match.status === 'running' ? '● LIVE' : match.status === 'paused' ? '⏸ MATCH PAUSED' : match.status.toUpperCase()}
          </div>
          <div
            title="Match Duration"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5vw',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '0.6vh 1.2vw',
              borderRadius: '8px',
              fontSize: '1.5vw',
              fontWeight: '900',
              color: match.status === 'running' ? '#38BDF8' : '#FACC15',
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '1px',
            }}
          >
            <span style={{ fontSize: '1.2vw' }}>⏱️</span>
            <span>{formatMatchRuntime(matchRunSeconds)}</span>
          </div>
        </div>
      </div>

      {/* Main Dual Team Scoring Board */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)', gap: '2.5vw', alignItems: 'center', margin: '3vh 0', width: '100%', boxSizing: 'border-box' }}>
        
        {/* Team 1 Mega Card */}
        <div style={{
          background: servingTeam === 'player1' ? 'linear-gradient(135deg, rgba(30, 58, 138, 0.4), rgba(15, 23, 42, 0.9))' : 'rgba(15, 23, 42, 0.7)',
          border: servingTeam === 'player1' ? '3px solid #38BDF8' : '1px solid rgba(255,255,255,0.1)',
          borderRadius: '24px',
          padding: '3.5vh 2.5vw',
          textAlign: 'center',
          boxShadow: servingTeam === 'player1' ? '0 0 50px rgba(56, 189, 248, 0.25)' : 'none',
          position: 'relative',
          minWidth: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          {servingTeam === 'player1' && (
            <div style={{ position: 'absolute', top: '1.5vh', left: '1.5vw', background: '#38BDF8', color: '#0F172A', padding: '0.4vh 0.8vw', borderRadius: '6px', fontSize: '0.9vw', fontWeight: '900', letterSpacing: '1px' }}>
              🏐 SERVICE
            </div>
          )}

          {getTeamLogo(match.player1_name) && (
            <img
              src={getTeamLogo(match.player1_name)!}
              alt=""
              style={{
                width: '4.5vw',
                height: '4.5vw',
                borderRadius: '12px',
                objectFit: 'cover',
                border: '2px solid rgba(255,255,255,0.2)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
                marginBottom: '0.8vh',
              }}
            />
          )}

          <div
            title={match.player1_name}
            style={{
              fontSize: 'clamp(18px, 2.5vw, 36px)',
              fontWeight: '900',
              color: '#FFFFFF',
              marginTop: '0.5vh',
              marginBottom: '1vh',
              maxWidth: '100%',
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.2,
            }}
          >
            {match.player1_name}
          </div>

          <div style={{ fontSize: '1.4vw', color: '#94A3B8', fontWeight: '700' }}>
            SETS WON: <span style={{ color: '#38BDF8', fontSize: '2vw' }}>{p1SetsWon}</span>
          </div>

          <div style={{ fontSize: '14vw', fontWeight: '900', lineHeight: '1', color: '#38BDF8', margin: '2vh 0', fontVariantNumeric: 'tabular-nums' }}>
            {activeSet.player1_score}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.8vw' }}>
            <span style={{ fontSize: '1vw', color: '#64748B', fontWeight: '700' }}>TIMEOUTS:</span>
            {[1, 2].map(n => (
              <div key={n} style={{ width: '1.2vw', height: '1.2vw', borderRadius: '50%', background: n <= timeoutsP1 ? '#EF4444' : 'rgba(255,255,255,0.15)' }} />
            ))}
          </div>
        </div>

        {/* Center Set Summary Board */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2vh', minWidth: '15vw' }}>
          <div style={{ fontSize: '2vw', fontWeight: '900', color: '#64748B', letterSpacing: '4px' }}>
            SET {activeSet.set_number}
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '16px', padding: '2vh 1.5vw', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ fontSize: '0.9vw', color: '#94A3B8', fontWeight: '800', textAlign: 'center', marginBottom: '1.5vh', letterSpacing: '1px' }}>
              COMPLETED SETS
            </div>
            {sets.map(s => (
              <div key={s.set_number} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8vh 1vw', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '1.3vw', fontWeight: s.is_complete ? '700' : '900', color: s.is_complete ? '#94A3B8' : '#38BDF8' }}>
                <span>SET {s.set_number}</span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{s.player1_score} - {s.player2_score}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Team 2 Mega Card */}
        <div style={{
          background: servingTeam === 'player2' ? 'linear-gradient(135deg, rgba(30, 58, 138, 0.4), rgba(15, 23, 42, 0.9))' : 'rgba(15, 23, 42, 0.7)',
          border: servingTeam === 'player2' ? '3px solid #38BDF8' : '1px solid rgba(255,255,255,0.1)',
          borderRadius: '24px',
          padding: '3.5vh 2.5vw',
          textAlign: 'center',
          boxShadow: servingTeam === 'player2' ? '0 0 50px rgba(56, 189, 248, 0.25)' : 'none',
          position: 'relative',
          minWidth: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          {servingTeam === 'player2' && (
            <div style={{ position: 'absolute', top: '1.5vh', right: '1.5vw', background: '#38BDF8', color: '#0F172A', padding: '0.4vh 0.8vw', borderRadius: '6px', fontSize: '0.9vw', fontWeight: '900', letterSpacing: '1px' }}>
              🏐 SERVICE
            </div>
          )}

          {getTeamLogo(match.player2_name) && (
            <img
              src={getTeamLogo(match.player2_name)!}
              alt=""
              style={{
                width: '4.5vw',
                height: '4.5vw',
                borderRadius: '12px',
                objectFit: 'cover',
                border: '2px solid rgba(255,255,255,0.2)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
                marginBottom: '0.8vh',
              }}
            />
          )}

          <div
            title={match.player2_name}
            style={{
              fontSize: 'clamp(18px, 2.5vw, 36px)',
              fontWeight: '900',
              color: '#FFFFFF',
              marginTop: '0.5vh',
              marginBottom: '1vh',
              maxWidth: '100%',
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.2,
            }}
          >
            {match.player2_name}
          </div>

          <div style={{ fontSize: '1.4vw', color: '#94A3B8', fontWeight: '700' }}>
            SETS WON: <span style={{ color: '#38BDF8', fontSize: '2vw' }}>{p2SetsWon}</span>
          </div>

          <div style={{ fontSize: '14vw', fontWeight: '900', lineHeight: '1', color: '#38BDF8', margin: '2vh 0', fontVariantNumeric: 'tabular-nums' }}>
            {activeSet.player2_score}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.8vw' }}>
            <span style={{ fontSize: '1vw', color: '#64748B', fontWeight: '700' }}>TIMEOUTS:</span>
            {[1, 2].map(n => (
              <div key={n} style={{ width: '1.2vw', height: '1.2vw', borderRadius: '50%', background: n <= timeoutsP2 ? '#EF4444' : 'rgba(255,255,255,0.15)' }} />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Ticker / Standings Preview */}
      {standings.length > 0 && (
        <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '1.5vh 2vw', display: 'flex', alignItems: 'center', gap: '3vw', overflow: 'hidden' }}>
          <div style={{ fontSize: '1vw', fontWeight: '900', color: '#38BDF8', letterSpacing: '2px', whiteSpace: 'nowrap' }}>
            FIVB STANDINGS:
          </div>
          <div style={{ display: 'flex', gap: '2vw', overflowX: 'auto', flex: 1 }}>
            {standings.slice(0, 4).map((st, idx) => (
              <div key={st.teamId} style={{ fontSize: '1.1vw', whiteSpace: 'nowrap' }}>
                <span style={{ color: '#64748B', fontWeight: '700' }}>#{idx + 1}</span>{' '}
                <span style={{ fontWeight: '700', color: '#FFFFFF' }}>{st.teamName}</span>{' '}
                <span style={{ color: '#38BDF8', fontWeight: '800' }}>({st.points} pts, {st.won}W-{st.lost}L)</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
