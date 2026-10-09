// ============================================================
// MatchPoint — Multi-Sport Rules Engine
// ============================================================
// Supports client-side rules for:
// - Table Tennis: 11 points, best of 5 sets, serve switches every 2 points (or every 1 point in deuce)
// - Squash: 11 points, best of 5 sets, PAR scoring, serve switches box (left/right) on consecutive server wins, choice on hand-out
// ============================================================

import { MatchSet } from '@/types';

export interface SportScoringConfig {
  maxPoints: number;
  deucePoint: number;
  setsToWin: number;
  bestOf: number;
}

export const SPORT_CONFIGS: Record<string, SportScoringConfig> = {
  'table_tennis': {
    maxPoints: 11,
    deucePoint: 10,
    setsToWin: 3, // Best of 5
    bestOf: 5,
  },
  'squash': {
    maxPoints: 11,
    deucePoint: 10,
    setsToWin: 3, // Best of 5
    bestOf: 5,
  },
  'tennis': {
    maxPoints: 6,
    deucePoint: 5,
    setsToWin: 2, // Best of 3
    bestOf: 3,
  },
  'volleyball': {
    maxPoints: 25,
    deucePoint: 24,
    setsToWin: 2, // Default Best of 3 (or 3 for Best of 5)
    bestOf: 3,
  },
};

export type VolleyballPointType = 
  | 'attack'          // Spike / Kill
  | 'block'           // Stuff block kill
  | 'ace'             // Direct service ace
  | 'opp_attack_out'  // Opponent attack hit out / long / wide
  | 'opp_net_fault'   // Opponent net touch / centerline fault
  | 'opp_service_err' // Opponent service into net or out
  | 'opp_rotation_err'// Opponent rotation / position fault
  | 'quick';          // Quick unclassified point (+1)

export interface VolleyballPointStats {
  attacks: number;
  blocks: number;
  aces: number;
  opponent_errors: number;
}

export interface VolleyballMetadata {
  serving_team: 'player1' | 'player2';
  match_format: 'best_of_3' | 'best_of_5' | 'custom';
  standard_set_points: number; // typically 25
  deciding_set_points: number; // typically 15
  timeouts_p1: number;
  timeouts_p2: number;
  max_timeouts_per_set: number;
  stats_p1?: VolleyballPointStats;
  stats_p2?: VolleyballPointStats;
  rotation_p1?: number[]; // indices or rotation position 1-6
  rotation_p2?: number[];
  last_point_type?: VolleyballPointType;
  last_point_scorer?: 'player1' | 'player2';
  early_conclude_reason?: string;
}

export const initialVolleyballMetadata: VolleyballMetadata = {
  serving_team: 'player1',
  match_format: 'best_of_3',
  standard_set_points: 25,
  deciding_set_points: 15,
  timeouts_p1: 0,
  timeouts_p2: 0,
  max_timeouts_per_set: 2,
  stats_p1: { attacks: 0, blocks: 0, aces: 0, opponent_errors: 0 },
  stats_p2: { attacks: 0, blocks: 0, aces: 0, opponent_errors: 0 },
  rotation_p1: [1, 2, 3, 4, 5, 6],
  rotation_p2: [1, 2, 3, 4, 5, 6],
};


/**
 * Checks if a volleyball set is complete.
 * - Standard sets: 25 points, win by 2, NO UPPER CAP (e.g. 26-24, 29-27, 31-29).
 * - Deciding set (set 3 in Best of 3, set 5 in Best of 5): 15 points, win by 2, NO UPPER CAP.
 */
export function isVolleyballSetComplete(
  p1: number,
  p2: number,
  setNumber: number = 1,
  format: 'best_of_3' | 'best_of_5' | 'custom' = 'best_of_3',
  customStandardPoints: number = 25,
  customDecidingPoints: number = 15
): boolean {
  const isDecidingSet = (format === 'best_of_3' && setNumber === 3) ||
                        (format === 'best_of_5' && setNumber === 5);
  const target = isDecidingSet ? customDecidingPoints : customStandardPoints;

  // Win by 2 points with NO ceiling cap
  if (p1 >= target && p1 - p2 >= 2) return true;
  if (p2 >= target && p2 - p1 >= 2) return true;
  return false;
}

/**
 * Checks if the overall Volleyball match is won.
 */
export function isVolleyballMatchWon(
  sets: MatchSet[],
  format: 'best_of_3' | 'best_of_5' | 'custom' = 'best_of_3'
): { isWon: boolean; winnerId: string | null; p1SetsWon: number; p2SetsWon: number } {
  const setsToWin = format === 'best_of_5' ? 3 : 2;
  let p1SetsWon = 0;
  let p2SetsWon = 0;

  for (const s of sets) {
    if (s.is_complete && s.winner_id) {
      if (s.winner_id === 'player1') p1SetsWon++;
      else if (s.winner_id === 'player2') p2SetsWon++;
    }
  }

  if (p1SetsWon >= setsToWin) return { isWon: true, winnerId: 'player1', p1SetsWon, p2SetsWon };
  if (p2SetsWon >= setsToWin) return { isWon: true, winnerId: 'player2', p1SetsWon, p2SetsWon };
  return { isWon: false, winnerId: null, p1SetsWon, p2SetsWon };
}

export interface VolleyballStanding {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  lost: number;
  points: number; // FIVB: 3 for 3-0/3-1 win, 2 for 3-2 win, 1 for 2-3 loss, 0 for 0-3/1-3 loss
  setsWon: number;
  setsLost: number;
  setRatio: number;
  rallyPointsWon: number;
  rallyPointsLost: number;
  pointQuotient: number;
}

/**
 * Calculates official FIVB tournament standings from completed volleyball matches.
 */
export function calculateVolleyballStandings(
  teams: { id: string; name: string }[],
  matches: { player1_id: string; player2_id: string; status: string; sets: MatchSet[]; winner_id?: string | null }[]
): VolleyballStanding[] {
  const standingsMap: Record<string, VolleyballStanding> = {};

  for (const t of teams) {
    standingsMap[t.id] = {
      teamId: t.id,
      teamName: t.name,
      played: 0,
      won: 0,
      lost: 0,
      points: 0,
      setsWon: 0,
      setsLost: 0,
      setRatio: 0,
      rallyPointsWon: 0,
      rallyPointsLost: 0,
      pointQuotient: 0,
    };
  }

  const nameToIdMap: Record<string, string> = {};
  for (const t of teams) {
    if (t.name) {
      nameToIdMap[t.name.trim().toLowerCase()] = t.id;
    }
  }

  const resolveTeamStanding = (idOrName: string | undefined | null) => {
    if (!idOrName) return undefined;
    if (standingsMap[idOrName]) return standingsMap[idOrName];
    const mappedId = nameToIdMap[idOrName.trim().toLowerCase()];
    if (mappedId && standingsMap[mappedId]) return standingsMap[mappedId];
    return undefined;
  };

  for (const m of matches) {
    if (m.status !== 'completed' && !m.winner_id) continue;
    const s1 = resolveTeamStanding(m.player1_id) || resolveTeamStanding((m as any).player1_name);
    const s2 = resolveTeamStanding(m.player2_id) || resolveTeamStanding((m as any).player2_name);
    if (!s1 || !s2) continue;

    s1.played++;
    s2.played++;

    let p1Sets = 0;
    let p2Sets = 0;
    let p1Rally = 0;
    let p2Rally = 0;

    for (const s of m.sets || []) {
      const p1Score = s.player1_score || 0;
      const p2Score = s.player2_score || 0;
      p1Rally += p1Score;
      p2Rally += p2Score;
      
      if (s.is_complete || s.winner_id || (p1Score > 0 || p2Score > 0)) {
        if (s.winner_id === 'player1' || s.winner_id === m.player1_id || s.winner_id === s1.teamId) {
          p1Sets++;
        } else if (s.winner_id === 'player2' || s.winner_id === m.player2_id || s.winner_id === s2.teamId) {
          p2Sets++;
        } else if (p1Score > p2Score && (s.is_complete || Math.max(p1Score, p2Score) >= 15)) {
          p1Sets++;
        } else if (p2Score > p1Score && (s.is_complete || Math.max(p1Score, p2Score) >= 15)) {
          p2Sets++;
        }
      }
    }

    s1.setsWon += p1Sets;
    s1.setsLost += p2Sets;
    s1.rallyPointsWon += p1Rally;
    s1.rallyPointsLost += p2Rally;

    s2.setsWon += p2Sets;
    s2.setsLost += p1Sets;
    s2.rallyPointsWon += p2Rally;
    s2.rallyPointsLost += p1Rally;

    // FIVB Point System:
    // 3-0 or 3-1 win: Winner gets 3 pts, Loser gets 0
    // 3-2 win (or 2-1 in Best of 3): Winner gets 2 pts, Loser gets 1 pt
    // 2-0 win (Best of 3): Winner gets 3 pts, Loser gets 0 pts
    const p1Won = m.winner_id === m.player1_id || m.winner_id === s1.teamId || (p1Sets > p2Sets);

    if (p1Won) {
      s1.won++;
      s2.lost++;
      if (p2Sets === 0 || (p1Sets === 3 && p2Sets === 1) || (p1Sets === 2 && p2Sets === 0)) {
        s1.points += 3;
        s2.points += 0;
      } else {
        // Deciding set
        s1.points += 2;
        s2.points += 1;
      }
    } else {
      s2.won++;
      s1.lost++;
      if (p1Sets === 0 || (p2Sets === 3 && p1Sets === 1) || (p2Sets === 2 && p1Sets === 0)) {
        s2.points += 3;
        s1.points += 0;
      } else {
        s2.points += 2;
        s1.points += 1;
      }
    }
  }

  // Calculate Ratios and Sort
  return Object.values(standingsMap).map(s => {
    s.setRatio = s.setsLost === 0 ? s.setsWon : parseFloat((s.setsWon / s.setsLost).toFixed(3));
    s.pointQuotient = s.rallyPointsLost === 0 ? s.rallyPointsWon : parseFloat((s.rallyPointsWon / s.rallyPointsLost).toFixed(3));
    return s;
  }).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.setRatio !== a.setRatio) return b.setRatio - a.setRatio;
    return b.pointQuotient - a.pointQuotient;
  });
}

// ── Table Tennis Helpers ──

export function isTableTennisSetComplete(p1: number, p2: number, scoringFormat: string = '11-point'): boolean {
  const target = scoringFormat === '21-point' ? 21 : 11;
  if (p1 >= target && p1 - p2 >= 2) return true;
  if (p2 >= target && p2 - p1 >= 2) return true;
  return false;
}

/**
 * Calculates who serves next in Table Tennis.
 * Serves alternate every 2 points (for 11-point) or every 5 points (for 21-point).
 * If score is in deuce, serves alternate every 1 point.
 */
export function getTableTennisServer(
  p1Score: number,
  p2Score: number,
  initialServer: 'player1' | 'player2' = 'player1',
  scoringFormat: string = '11-point'
): 'player1' | 'player2' {
  const totalPoints = p1Score + p2Score;
  const is21Point = scoringFormat === '21-point';
  const deuceThreshold = is21Point ? 20 : 10;
  const changeFrequency = is21Point ? 5 : 2;
  const isDeuceMode = p1Score >= deuceThreshold && p2Score >= deuceThreshold;
  
  if (isDeuceMode) {
    // In deuce, server changes every point
    const shift = totalPoints % 2;
    if (initialServer === 'player1') {
      return shift === 0 ? 'player1' : 'player2';
    } else {
      return shift === 0 ? 'player2' : 'player1';
    }
  } else {
    // Standard cycles
    const cycles = Math.floor(totalPoints / changeFrequency);
    const shift = cycles % 2;
    if (initialServer === 'player1') {
      return shift === 0 ? 'player1' : 'player2';
    } else {
      return shift === 0 ? 'player2' : 'player1';
    }
  }
}

// ── Squash Helpers ──

export function isSquashSetComplete(p1: number, p2: number): boolean {
  // Point-a-rally (PAR) to 11. Must win by 2.
  if (p1 >= 11 && p1 - p2 >= 2) return true;
  if (p2 >= 11 && p2 - p1 >= 2) return true;
  return false;
}

export interface SquashMetadata {
  serving_team: 'player1' | 'player2';
  serving_box: 'left' | 'right' | null; // null triggers choice overlay
  last_rally_winner: 'player1' | 'player2' | null;
}

export const initialSquashMetadata: SquashMetadata = {
  serving_team: 'player1',
  serving_box: null, // Initial choice required
  last_rally_winner: null,
};

// ── Tennis Helpers ──

export interface TennisMetadata {
  player1_game_points: number; // 0, 1, 2, 3, etc.
  player2_game_points: number;
  in_tiebreak: boolean;
  serving_team: 'player1' | 'player2';
  first_server: 'player1' | 'player2';
}

export const initialTennisMetadata: TennisMetadata = {
  player1_game_points: 0,
  player2_game_points: 0,
  in_tiebreak: false,
  serving_team: 'player1',
  first_server: 'player1',
};

export function formatTennisGameScore(
  p1Points: number,
  p2Points: number,
  inTiebreak: boolean
): { p1: string; p2: string } {
  if (inTiebreak) {
    return { p1: p1Points.toString(), p2: p2Points.toString() };
  }

  const scores = ['00', '15', '30', '40'];
  if (p1Points <= 3 && p2Points <= 3) {
    if (p1Points === 3 && p2Points === 3) {
      return { p1: '40', p2: '40' }; // Deuce representation
    }
    return { p1: scores[p1Points], p2: scores[p2Points] };
  }

  // Advantage situations
  if (p1Points === p2Points) {
    return { p1: '40', p2: '40' }; // Deuce
  }
  if (p1Points > p2Points) {
    return { p1: 'Ad', p2: '40' };
  }
  return { p1: '40', p2: 'Ad' };
}

export function isTennisSetComplete(p1Games: number, p2Games: number): boolean {
  // A set is won by the first player to win 6 games, with at least a 2-game lead.
  // If the set score is 6-6, a tiebreaker is played, and the set goes to 7-6.
  if (p1Games >= 6 && p1Games - p2Games >= 2) return true;
  if (p2Games >= 6 && p2Games - p1Games >= 2) return true;
  if (p1Games === 7 && p2Games === 6) return true;
  if (p2Games === 7 && p1Games === 6) return true;
  return false;
}

export interface SportScoringOption {
  value: string;
  label: string;
  badge?: string;
  description?: string;
  isDefault?: boolean;
}

export const SPORT_SCORING_OPTIONS: Record<string, SportScoringOption[]> = {
  volleyball: [
    {
      value: '25-point-best-of-3',
      label: '25-Point Best of 3 (Sets 1-2: 25, Decider: 15, Win by 2, No Cap)',
      badge: 'FIVB Standard',
      isDefault: true,
    },
    {
      value: '25-point-best-of-5',
      label: '25-Point Best of 5 (Sets 1-4: 25, Decider: 15, Win by 2, No Cap)',
      badge: 'FIVB Championship',
    },
    {
      value: '21-point-best-of-3',
      label: '21-Point Fast Format (Sets 1-2: 21, Decider: 15, Win by 2, No Cap)',
      badge: 'Fast League',
    },
    {
      value: '15-point-best-of-3',
      label: '15-Point Blitz (All sets to 15, Win by 2, No Cap)',
      badge: 'Blitz / Short',
    },
  ],
  badminton: [
    {
      value: '21-point',
      label: '21-Point (Golden Point at 30) BWF Compliant',
      badge: 'BWF Standard',
      isDefault: true,
    },
    {
      value: '15-point',
      label: '15-Point (Golden Point at 21) BWF Compliant',
      badge: 'BWF Classic',
    },
    {
      value: '11-point',
      label: '11-Point (Golden Point at 15) BWF Compliant',
      badge: 'BWF Trial',
    },
  ],
  table_tennis: [
    {
      value: '11-point',
      label: '11-Point Standard (ITTF Official, Best of 5, Serve every 2)',
      badge: 'ITTF Official',
      isDefault: true,
    },
    {
      value: '21-point',
      label: '21-Point Classic (Legacy ITTF, Serve every 5)',
      badge: 'Classic',
    },
  ],
  squash: [
    {
      value: '11-point',
      label: '11-Point PAR (Point-A-Rally, WSF Standard, Best of 5)',
      badge: 'WSF Standard',
      isDefault: true,
    },
  ],
  tennis: [
    {
      value: 'standard',
      label: 'Standard Sets (6 Games with Ad / Deuce & Tiebreak at 6-6)',
      badge: 'ITF Standard',
      isDefault: true,
    },
  ],
  cricket: [
    {
      value: 'standard',
      label: 'Standard Overs & Wickets',
      badge: 'Standard',
      isDefault: true,
    },
  ],
  basketball: [
    {
      value: 'standard',
      label: 'Quarter-based Scoring (FIBA Standard)',
      badge: 'FIBA Standard',
      isDefault: true,
    },
  ],
};

export function getScoringOptionsForSport(sport?: string): SportScoringOption[] {
  const normalized = (sport || 'badminton').toLowerCase();
  return SPORT_SCORING_OPTIONS[normalized] || SPORT_SCORING_OPTIONS['badminton'];
}

export function getDefaultScoringFormatForSport(sport?: string): string {
  const options = getScoringOptionsForSport(sport);
  const def = options.find(o => o.isDefault);
  return def ? def.value : options[0]?.value || '21-point';
}

/**
 * Returns the currently active set for a match.
 * If there are sets, it finds the first incomplete set (e.g. Set 1 if in progress),
 * or the last set if all are completed or no set is flagged incomplete.
 */
export function getActiveMatchSet(sets?: MatchSet[]): MatchSet | null {
  if (!sets || sets.length === 0) return null;
  const active = sets.find(s => !s.is_complete);
  return active || sets[sets.length - 1] || null;
}


