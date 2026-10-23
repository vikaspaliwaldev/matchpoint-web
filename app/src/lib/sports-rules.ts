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
  'badminton': {
    maxPoints: 21,
    deucePoint: 20,
    setsToWin: 2,
    bestOf: 3,
  },
};

// ── Volleyball Types & Stats ──
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
  max_timeouts?: number;
  timeout_scope?: 'set' | 'match';
  stats_p1?: VolleyballPointStats;
  stats_p2?: VolleyballPointStats;
  rotation_p1?: number[]; // indices or rotation position 1-6
  rotation_p2?: number[];
  last_point_type?: VolleyballPointType;
  last_point_scorer?: 'player1' | 'player2';
  early_conclude_reason?: string;
  total_paused_seconds?: number;
  pause_duration_seconds?: number;
}

export const initialVolleyballMetadata: VolleyballMetadata = {
  serving_team: 'player1',
  match_format: 'best_of_3',
  standard_set_points: 25,
  deciding_set_points: 15,
  timeouts_p1: 0,
  timeouts_p2: 0,
  max_timeouts_per_set: 2,
  max_timeouts: 2,
  timeout_scope: 'set',
  stats_p1: { attacks: 0, blocks: 0, aces: 0, opponent_errors: 0 },
  stats_p2: { attacks: 0, blocks: 0, aces: 0, opponent_errors: 0 },
  rotation_p1: [1, 2, 3, 4, 5, 6],
  rotation_p2: [1, 2, 3, 4, 5, 6],
};

// ── Table Tennis Types & Stats ──
export type TableTennisPointType =
  | 'forehand_winner'
  | 'backhand_winner'
  | 'service_ace'
  | 'opp_unforced_error'
  | 'opp_service_fault'
  | 'opp_edge_ball'
  | 'quick';

export interface TableTennisPointStats {
  forehand_winners: number;
  backhand_winners: number;
  service_aces: number;
  opponent_errors: number;
}

export interface TableTennisMetadata {
  initial_server: 'player1' | 'player2';
  serving_team?: 'player1' | 'player2';
  scoring_format?: string;
  timeouts_p1?: number;
  timeouts_p2?: number;
  max_timeouts?: number;
  timeout_scope?: 'set' | 'match';
  stats_p1?: TableTennisPointStats;
  stats_p2?: TableTennisPointStats;
  last_point_type?: TableTennisPointType;
  last_point_scorer?: 'player1' | 'player2';
  early_conclude_reason?: string;
  total_paused_seconds?: number;
}

export const initialTableTennisMetadata: TableTennisMetadata = {
  initial_server: 'player1',
  serving_team: 'player1',
  scoring_format: '11-point',
  timeouts_p1: 0,
  timeouts_p2: 0,
  max_timeouts: 2, // Default 2 timeouts per set/game or match, configurable
  timeout_scope: 'set',
  stats_p1: { forehand_winners: 0, backhand_winners: 0, service_aces: 0, opponent_errors: 0 },
  stats_p2: { forehand_winners: 0, backhand_winners: 0, service_aces: 0, opponent_errors: 0 },
};

// ── Squash Types & Stats ──
export type SquashPointType =
  | 'stroke_awarded'
  | 'kill_shot'
  | 'nick_winner'
  | 'drop_shot'
  | 'opp_tin_error'
  | 'opp_out_error'
  | 'quick';

export interface SquashPointStats {
  strokes: number;
  kill_shots: number;
  nick_winners: number;
  opponent_errors: number;
}

export interface SquashMetadata {
  serving_team: 'player1' | 'player2';
  serving_box: 'left' | 'right' | null; // null triggers choice overlay
  last_rally_winner: 'player1' | 'player2' | null;
  timeouts_p1?: number;
  timeouts_p2?: number;
  max_timeouts?: number;
  timeout_scope?: 'set' | 'match';
  stats_p1?: SquashPointStats;
  stats_p2?: SquashPointStats;
  last_point_type?: SquashPointType;
  last_point_scorer?: 'player1' | 'player2';
  early_conclude_reason?: string;
  total_paused_seconds?: number;
}

export const initialSquashMetadata: SquashMetadata = {
  serving_team: 'player1',
  serving_box: null,
  last_rally_winner: null,
  timeouts_p1: 0,
  timeouts_p2: 0,
  max_timeouts: 2,
  timeout_scope: 'set',
  stats_p1: { strokes: 0, kill_shots: 0, nick_winners: 0, opponent_errors: 0 },
  stats_p2: { strokes: 0, kill_shots: 0, nick_winners: 0, opponent_errors: 0 },
};

// ── Tennis Types & Stats ──
export type TennisPointType =
  | 'ace'
  | 'forehand_winner'
  | 'backhand_winner'
  | 'volley_winner'
  | 'opp_unforced_error'
  | 'opp_double_fault'
  | 'quick';

export interface TennisPointStats {
  aces: number;
  winners: number;
  double_faults: number;
  opponent_errors: number;
}

export interface TennisMetadata {
  player1_game_points: number; // 0, 1, 2, 3, etc.
  player2_game_points: number;
  in_tiebreak: boolean;
  serving_team: 'player1' | 'player2';
  first_server: 'player1' | 'player2';
  timeouts_p1?: number;
  timeouts_p2?: number;
  max_timeouts?: number;
  timeout_scope?: 'set' | 'match';
  stats_p1?: TennisPointStats;
  stats_p2?: TennisPointStats;
  last_point_type?: TennisPointType;
  last_point_scorer?: 'player1' | 'player2';
  early_conclude_reason?: string;
  total_paused_seconds?: number;
}

export const initialTennisMetadata: TennisMetadata = {
  player1_game_points: 0,
  player2_game_points: 0,
  in_tiebreak: false,
  serving_team: 'player1',
  first_server: 'player1',
  timeouts_p1: 0,
  timeouts_p2: 0,
  max_timeouts: 2,
  timeout_scope: 'set',
  stats_p1: { aces: 0, winners: 0, double_faults: 0, opponent_errors: 0 },
  stats_p2: { aces: 0, winners: 0, double_faults: 0, opponent_errors: 0 },
};

// ── Badminton Types & Stats ──
export type BadmintonPointType =
  | 'smash_winner'
  | 'drop_winner'
  | 'net_kill'
  | 'service_ace'
  | 'opp_shuttle_out'
  | 'opp_net_fault'
  | 'quick';

export interface BadmintonPointStats {
  smashes: number;
  drops: number;
  net_kills: number;
  opponent_errors: number;
}

export interface BadmintonMetadata {
  serving_team: 'player1' | 'player2';
  timeouts_p1?: number;
  timeouts_p2?: number;
  max_timeouts?: number;
  timeout_scope?: 'set' | 'match';
  stats_p1?: BadmintonPointStats;
  stats_p2?: BadmintonPointStats;
  last_point_type?: BadmintonPointType;
  last_point_scorer?: 'player1' | 'player2';
  early_conclude_reason?: string;
  total_paused_seconds?: number;
}

export const initialBadmintonMetadata: BadmintonMetadata = {
  serving_team: 'player1',
  timeouts_p1: 0,
  timeouts_p2: 0,
  max_timeouts: 2,
  timeout_scope: 'set',
  stats_p1: { smashes: 0, drops: 0, net_kills: 0, opponent_errors: 0 },
  stats_p2: { smashes: 0, drops: 0, net_kills: 0, opponent_errors: 0 },
};

// ── Cricket Types, Deliveries, Innings & Stats ──

export type CricketFormat = 't20' | 't10' | 't5' | 'box_cricket' | 'the_hundred' | 'odi' | 'standard';

export type CricketExtraType = 'wide' | 'no_ball' | 'bye' | 'leg_bye' | 'penalty';

export type CricketWicketType =
  | 'bowled'
  | 'caught'
  | 'lbw'
  | 'run_out'
  | 'stumped'
  | 'hit_wicket'
  | 'retired_hurt'
  | 'retired_out'
  | 'timed_out'
  | 'handled_ball'
  | 'obstructing_field';

export type CricketWagonZone =
  | 'third_man'
  | 'point'
  | 'cover'
  | 'extra_cover'
  | 'long_off'
  | 'long_on'
  | 'mid_wicket'
  | 'square_leg'
  | 'fine_leg';

export interface CricketBatterScore {
  player_id: string;
  player_name: string;
  batting_style?: 'RHB' | 'LHB'; // Right-Hand Bat or Left-Hand Bat
  runs: number;
  balls_faced: number;
  fours: number;
  sixes: number;
  strike_rate: number;
  is_out: boolean;
  dismissal_text?: string;
  dismissal_bowler_id?: string;
  dismissal_fielder_id?: string;
}

export interface CricketBowlerScore {
  player_id: string;
  player_name: string;
  bowling_style?: string;     // e.g. "Right-arm fast", "Slow left-arm orthodox"
  overs: number;              // full decimal or fractional e.g. 3.2
  balls_bowled: number;       // total legal deliveries bowled
  maidens: number;
  runs_conceded: number;
  wickets: number;
  economy: number;
  wides: number;
  no_balls: number;
  dots: number;
}

export interface CricketBall {
  id: string;
  over_number: number;        // 0-indexed over: 0 = Over 1, 1 = Over 2...
  ball_in_over: number;       // 1 to 6 (for legal balls)
  is_legal: boolean;          // false for Wide / No-ball
  bowler_id: string;
  bowler_name: string;
  striker_id: string;
  striker_name: string;
  non_striker_id: string;
  non_striker_name: string;
  runs_off_bat: number;       // 0, 1, 2, 3, 4, 6
  extra_type?: CricketExtraType;
  extra_runs: number;
  total_runs: number;
  is_wicket: boolean;
  wicket_type?: CricketWicketType;
  wicket_player_id?: string;
  wicket_player_name?: string;
  assisting_player_id?: string; // Fielder who caught / threw
  assisting_player_name?: string;
  wagon_zone?: CricketWagonZone;
  is_free_hit?: boolean;
  commentary?: string;
  timestamp: string;
}

export interface CricketFallOfWicket {
  wicket_number: number;
  runs: number;
  overs: string;              // formatted e.g. "4.2"
  player_id: string;
  player_name: string;
}

export interface CricketInnings {
  innings_number: 1 | 2;
  batting_team_id: 'player1' | 'player2';
  batting_team_name: string;
  bowling_team_id: 'player1' | 'player2';
  bowling_team_name: string;
  total_runs: number;
  wickets: number;
  balls_bowled: number;       // legal deliveries
  overs_formatted: string;    // e.g. "12.4"
  max_overs: number;
  is_declared?: boolean;
  is_all_out?: boolean;
  is_complete: boolean;
  target_runs?: number;
  extras: {
    wides: number;
    no_balls: number;
    byes: number;
    leg_byes: number;
    penalty: number;
    total: number;
  };
  fall_of_wickets: CricketFallOfWicket[];
  batters: Record<string, CricketBatterScore>;
  bowlers: Record<string, CricketBowlerScore>;
  deliveries: CricketBall[];
}

export interface CricketCustomRules {
  wide_runs: number;          // Default 1, Box cricket can be 2
  no_ball_runs: number;       // Default 1, Box cricket can be 2
  free_hit_on_no_ball: boolean;
  max_overs_per_bowler: number;
  players_per_side: number;   // 11 for standard, 6 or 8 for turf/box
  powerplay_overs?: number;   // e.g. 6 overs for T20, 2 for T10
  ball_type?: 'leather' | 'tennis' | 'tape' | 'rubber';
  pitch_type?: 'turf' | 'matting' | 'concrete' | 'ground';
  box_wall_runs?: number;     // e.g. 1 or 2 runs on hitting side walls
  one_tip_one_hand?: boolean; // Box cricket rule
  retire_at_runs?: number;    // e.g. 30 or 50 runs retirement
  roof_is_dead_ball?: boolean;// Box cricket ceiling hit
  last_man_standing?: boolean;// Allow last batsman to bat alone
}

export interface CricketMetadata {
  format: CricketFormat;
  overs_per_innings: number;
  current_innings: 1 | 2;
  innings_1: CricketInnings;
  innings_2?: CricketInnings;
  striker_id: string;
  striker_name: string;
  striker_batting_style?: 'RHB' | 'LHB';
  non_striker_id: string;
  non_striker_name: string;
  non_striker_batting_style?: 'RHB' | 'LHB';
  bowler_id: string;
  bowler_name: string;
  bowler_bowling_style?: string;
  previous_bowler_id?: string;
  toss_winner_id?: 'player1' | 'player2';
  toss_decision?: 'bat' | 'bowl';
  custom_rules: CricketCustomRules;
  last_ball_text?: string;
  is_free_hit?: boolean;
  wagon_wheel_enabled?: boolean;
  early_conclude_reason?: string;
  total_paused_seconds?: number;
}

export function createEmptyCricketInnings(
  inningsNumber: 1 | 2,
  battingTeamId: 'player1' | 'player2',
  battingTeamName: string,
  bowlingTeamId: 'player1' | 'player2',
  bowlingTeamName: string,
  maxOvers: number = 20
): CricketInnings {
  return {
    innings_number: inningsNumber,
    batting_team_id: battingTeamId,
    batting_team_name: battingTeamName,
    bowling_team_id: bowlingTeamId,
    bowling_team_name: bowlingTeamName,
    total_runs: 0,
    wickets: 0,
    balls_bowled: 0,
    overs_formatted: '0.0',
    max_overs: maxOvers,
    is_complete: false,
    extras: { wides: 0, no_balls: 0, byes: 0, leg_byes: 0, penalty: 0, total: 0 },
    fall_of_wickets: [],
    batters: {},
    bowlers: {},
    deliveries: [],
  };
}

export const initialCricketMetadata: CricketMetadata = {
  format: 't20',
  overs_per_innings: 20,
  current_innings: 1,
  striker_id: '',
  striker_name: '',
  non_striker_id: '',
  non_striker_name: '',
  bowler_id: '',
  bowler_name: '',
  custom_rules: {
    wide_runs: 1,
    no_ball_runs: 1,
    free_hit_on_no_ball: true,
    max_overs_per_bowler: 4,
    players_per_side: 11,
  },
  innings_1: createEmptyCricketInnings(1, 'player1', 'Team 1', 'player2', 'Team 2', 20),
  wagon_wheel_enabled: true,
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

// ── Cricket Tournament Standings & Leaderboards ──

export interface CricketStanding {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  lost: number;
  tied: number;
  noResult: number;
  points: number;             // Win = 2, Tie/NR = 1, Loss = 0
  runsScored: number;
  oversFacedBalls: number;
  oversFacedFormatted: string;
  runsConceded: number;
  oversBowledBalls: number;
  oversBowledFormatted: string;
  netRunRate: number;         // Official ICC/IPL NRR
}

export interface CricketLeaderboards {
  orangeCap: {
    playerId: string;
    playerName: string;
    teamName: string;
    runs: number;
    ballsFaced: number;
    fours: number;
    sixes: number;
    strikeRate: number;
  }[];
  purpleCap: {
    playerId: string;
    playerName: string;
    teamName: string;
    wickets: number;
    oversFormatted: string;
    runsConceded: number;
    economy: number;
  }[];
}

/**
 * Calculates official tournament table standings with Net Run Rate (NRR) for Cricket.
 */
export function calculateCricketStandings(
  teams: { id: string; name: string }[],
  matches: { player1_id: string; player2_id: string; status: string; winner_id?: string | null; sport_metadata?: any }[]
): CricketStanding[] {
  const standingsMap: Record<string, CricketStanding> = {};

  for (const t of teams) {
    standingsMap[t.id] = {
      teamId: t.id,
      teamName: t.name,
      played: 0,
      won: 0,
      lost: 0,
      tied: 0,
      noResult: 0,
      points: 0,
      runsScored: 0,
      oversFacedBalls: 0,
      oversFacedFormatted: '0.0',
      runsConceded: 0,
      oversBowledBalls: 0,
      oversBowledFormatted: '0.0',
      netRunRate: 0,
    };
  }

  const nameToIdMap: Record<string, string> = {};
  for (const t of teams) {
    if (t.name) {
      nameToIdMap[t.name.trim().toLowerCase()] = t.id;
    }
  }

  const resolveTeam = (idOrName: string | undefined | null) => {
    if (!idOrName) return undefined;
    if (standingsMap[idOrName]) return standingsMap[idOrName];
    const mapped = nameToIdMap[idOrName.trim().toLowerCase()];
    if (mapped && standingsMap[mapped]) return standingsMap[mapped];
    return undefined;
  };

  for (const m of matches) {
    if (m.status !== 'completed' && !m.winner_id) continue;
    const s1 = resolveTeam(m.player1_id) || resolveTeam((m as any).player1_name);
    const s2 = resolveTeam(m.player2_id) || resolveTeam((m as any).player2_name);
    if (!s1 || !s2) continue;

    s1.played++;
    s2.played++;

    const meta = m.sport_metadata as CricketMetadata | undefined;
    const inn1 = meta?.innings_1;
    const inn2 = meta?.innings_2;

    if (inn1 && inn2) {
      const isTeam1BattingFirst = inn1.batting_team_id === 'player1';
      const t1Runs = isTeam1BattingFirst ? inn1.total_runs : inn2.total_runs;
      const t1Balls = isTeam1BattingFirst ? inn1.balls_bowled : inn2.balls_bowled;
      const t2Runs = isTeam1BattingFirst ? inn2.total_runs : inn1.total_runs;
      const t2Balls = isTeam1BattingFirst ? inn2.balls_bowled : inn1.balls_bowled;

      s1.runsScored += t1Runs;
      s1.oversFacedBalls += t1Balls;
      s1.runsConceded += t2Runs;
      s1.oversBowledBalls += t2Balls;

      s2.runsScored += t2Runs;
      s2.oversFacedBalls += t2Balls;
      s2.runsConceded += t1Runs;
      s2.oversBowledBalls += t1Balls;
    }

    const p1Won = m.winner_id === m.player1_id || m.winner_id === s1.teamId;
    const p2Won = m.winner_id === m.player2_id || m.winner_id === s2.teamId;

    if (p1Won) {
      s1.won++;
      s1.points += 2;
      s2.lost++;
    } else if (p2Won) {
      s2.won++;
      s2.points += 2;
      s1.lost++;
    } else {
      // Tie or No Result
      s1.tied++;
      s1.points += 1;
      s2.tied++;
      s2.points += 1;
    }
  }

  // Format overs and calculate final NRR
  return Object.values(standingsMap).map(s => {
    s.oversFacedFormatted = formatCricketOvers(s.oversFacedBalls);
    s.oversBowledFormatted = formatCricketOvers(s.oversBowledBalls);
    s.netRunRate = calculateNetRunRate(s.runsScored, s.oversFacedBalls, s.runsConceded, s.oversBowledBalls);
    return s;
  }).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.won !== a.won) return b.won - a.won;
    return b.netRunRate - a.netRunRate;
  });
}

/**
 * Extracts aggregate batter and bowler statistics across tournament matches for Orange and Purple Cap.
 */
export function calculateCricketLeaderboards(
  matches: { sport_metadata?: any; player1_name?: string; player2_name?: string }[]
): CricketLeaderboards {
  const batterMap: Record<string, { playerId: string; playerName: string; teamName: string; runs: number; ballsFaced: number; fours: number; sixes: number; strikeRate: number }> = {};
  const bowlerMap: Record<string, { playerId: string; playerName: string; teamName: string; wickets: number; ballsBowled: number; runsConceded: number; economy: number }> = {};

  for (const m of matches) {
    const meta = m.sport_metadata as CricketMetadata | undefined;
    if (!meta) continue;

    const inningsList = [meta.innings_1, meta.innings_2].filter(Boolean) as CricketInnings[];
    for (const inn of inningsList) {
      // Batters
      for (const bId of Object.keys(inn.batters || {})) {
        const b = inn.batters[bId];
        const key = b.player_name.trim().toLowerCase();
        if (!batterMap[key]) {
          batterMap[key] = {
            playerId: bId,
            playerName: b.player_name,
            teamName: inn.batting_team_name,
            runs: 0,
            ballsFaced: 0,
            fours: 0,
            sixes: 0,
            strikeRate: 0,
          };
        }
        batterMap[key].runs += b.runs;
        batterMap[key].ballsFaced += b.balls_faced;
        batterMap[key].fours += b.fours;
        batterMap[key].sixes += b.sixes;
      }

      // Bowlers
      for (const bwId of Object.keys(inn.bowlers || {})) {
        const bw = inn.bowlers[bwId];
        const key = bw.player_name.trim().toLowerCase();
        if (!bowlerMap[key]) {
          bowlerMap[key] = {
            playerId: bwId,
            playerName: bw.player_name,
            teamName: inn.bowling_team_name,
            wickets: 0,
            ballsBowled: 0,
            runsConceded: 0,
            economy: 0,
          };
        }
        bowlerMap[key].wickets += bw.wickets;
        bowlerMap[key].ballsBowled += bw.balls_bowled;
        bowlerMap[key].runsConceded += bw.runs_conceded;
      }
    }
  }

  // Calculate final strike rates and economies
  const orangeCap = Object.values(batterMap).map(b => {
    b.strikeRate = b.ballsFaced > 0 ? parseFloat(((b.runs / b.ballsFaced) * 100).toFixed(1)) : 0;
    return b;
  }).sort((a, b) => b.runs - a.runs || b.strikeRate - a.strikeRate);

  const purpleCap = Object.values(bowlerMap).map(bw => {
    bw.economy = bw.ballsBowled > 0 ? parseFloat(((bw.runsConceded / bw.ballsBowled) * 6).toFixed(2)) : 0;
    return {
      playerId: bw.playerId,
      playerName: bw.playerName,
      teamName: bw.teamName,
      wickets: bw.wickets,
      oversFormatted: formatCricketOvers(bw.ballsBowled),
      runsConceded: bw.runsConceded,
      economy: bw.economy,
    };
  }).sort((a, b) => b.wickets - a.wickets || a.economy - b.economy);

  return { orangeCap, purpleCap };
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

// ── Tennis Helpers ──

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

// ── Cricket Helpers & Calculators ──

/**
 * Formats total legal deliveries into standard cricket overs notation: e.g. 19 balls -> "3.1"
 */
export function formatCricketOvers(legalBalls: number): string {
  const overs = Math.floor(legalBalls / 6);
  const balls = legalBalls % 6;
  return `${overs}.${balls}`;
}

/**
 * Converts overs string (e.g. "3.2" or 3.2) into total balls (3 * 6 + 2 = 20)
 */
export function cricketOversToBalls(oversStr: string | number): number {
  const parts = oversStr.toString().split('.');
  const overs = parseInt(parts[0], 10) || 0;
  const balls = parseInt(parts[1], 10) || 0;
  return (overs * 6) + balls;
}

/**
 * Calculates Current Run Rate (CRR): (Runs / Total Overs Faced)
 */
export function calculateCurrentRunRate(totalRuns: number, legalBalls: number): number {
  if (legalBalls === 0) return 0;
  const oversDecimal = legalBalls / 6;
  return parseFloat((totalRuns / oversDecimal).toFixed(2));
}

/**
 * Calculates Required Run Rate (RRR): (Runs Needed / Overs Remaining)
 */
export function calculateRequiredRunRate(runsNeeded: number, ballsRemaining: number): number {
  if (ballsRemaining <= 0) return runsNeeded > 0 ? 99.99 : 0;
  const oversRemainingDecimal = ballsRemaining / 6;
  return parseFloat((runsNeeded / oversRemainingDecimal).toFixed(2));
}

/**
 * Computes official Net Run Rate (NRR) for league standings:
 * (Total Runs Scored / Total Overs Faced) - (Total Runs Conceded / Total Overs Bowled)
 */
export function calculateNetRunRate(
  runsScored: number,
  oversFacedBalls: number,
  runsConceded: number,
  oversBowledBalls: number
): number {
  const oversFaced = oversFacedBalls > 0 ? (oversFacedBalls / 6) : 0;
  const oversBowled = oversBowledBalls > 0 ? (oversBowledBalls / 6) : 0;
  if (oversFaced === 0 || oversBowled === 0) return 0;
  const forRate = runsScored / oversFaced;
  const againstRate = runsConceded / oversBowled;
  return parseFloat((forRate - againstRate).toFixed(3));
}

/**
 * Checks if a cricket innings or match has completed.
 */
export function isCricketInningsComplete(
  innings: CricketInnings,
  playersPerSide: number = 11,
  targetRuns?: number
): { isComplete: boolean; reason?: string } {
  // 1. Target chased down in 2nd innings
  if (targetRuns && innings.total_runs >= targetRuns) {
    return { isComplete: true, reason: 'Target achieved' };
  }
  // 2. All Out (playersPerSide - 1 wickets)
  const maxWickets = Math.max(1, playersPerSide - 1);
  if (innings.wickets >= maxWickets) {
    return { isComplete: true, reason: 'All out' };
  }
  // 3. Overs completed
  const maxBalls = innings.max_overs * 6;
  if (innings.balls_bowled >= maxBalls) {
    return { isComplete: true, reason: 'Overs completed' };
  }
  return { isComplete: false };
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
      value: 't20',
      label: 'T20 (20 Overs per side, max 4 overs per bowler)',
      badge: 'T20 Standard',
      isDefault: true,
    },
    {
      value: 't10',
      label: 'T10 (10 Overs per side, max 2 overs per bowler)',
      badge: 'T10 Fast',
    },
    {
      value: 't5',
      label: 'T5 (5 Overs per side, max 1 over per bowler)',
      badge: 'Super 5s',
    },
    {
      value: 'box_cricket',
      label: 'Box Cricket / Turf (6-8 Overs, wall bonus & custom outs)',
      badge: 'Turf / Box',
    },
    {
      value: 'the_hundred',
      label: 'The Hundred (100 Balls per side, 5-ball overs)',
      badge: '100 Balls',
    },
    {
      value: 'odi',
      label: 'ODI / One Day (50 Overs per side)',
      badge: 'ICC ODI',
    },
    {
      value: 'standard',
      label: 'Custom Overs & Wickets',
      badge: 'Custom',
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


