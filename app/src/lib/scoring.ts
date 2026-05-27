// ============================================================
// MatchPoint — Badminton Scoring Rules Engine
// ============================================================
// Supports BWF Rules for:
// - 21-point Game (Standard BWF): Deuce at 20-20, golden point at 30
// - 15-point Game (Classic BWF): Deuce at 14-14, golden point at 21
// - 11-point Game (Trial BWF): Deuce at 10-10, golden point at 15
// ============================================================

import { MatchSet, ScoringFormat } from '@/types';

export interface ScoringConfig {
  maxPoints: number;
  deucePoint: number;
  absoluteMax: number;
  bestOf: number;
  setsToWin: number;
}

export const SCORING_CONFIGS: Record<ScoringFormat, ScoringConfig> = {
  '11-point': {
    maxPoints: 11,
    deucePoint: 10,
    absoluteMax: 15,
    bestOf: 3,
    setsToWin: 2,
  },
  '15-point': {
    maxPoints: 15,
    deucePoint: 14,
    absoluteMax: 21,
    bestOf: 3,
    setsToWin: 2,
  },
  '21-point': {
    maxPoints: 21,
    deucePoint: 20,
    absoluteMax: 30, // Official BWF standard (first to 30)
    bestOf: 3,
    setsToWin: 2,
  },
};

export const DEFAULT_SCORING_CONFIG = SCORING_CONFIGS['21-point'];

// Retain legacy constants for backward compatibility if imported elsewhere
export const MAX_POINTS = DEFAULT_SCORING_CONFIG.maxPoints;
export const DEUCE_POINT = DEFAULT_SCORING_CONFIG.deucePoint;
export const ABSOLUTE_MAX = DEFAULT_SCORING_CONFIG.absoluteMax;
export const BEST_OF = DEFAULT_SCORING_CONFIG.bestOf;
export const SETS_TO_WIN = DEFAULT_SCORING_CONFIG.setsToWin;

export interface ScoreState {
  sets: MatchSet[];
  currentSet: number;
  isMatchComplete: boolean;
  matchWinnerId: string | null;
  player1SetsWon: number;
  player2SetsWon: number;
}

export function createInitialScoreState(): ScoreState {
  return {
    sets: [{ set_number: 1, player1_score: 0, player2_score: 0, is_complete: false }],
    currentSet: 0,
    isMatchComplete: false,
    matchWinnerId: null,
    player1SetsWon: 0,
    player2SetsWon: 0,
  };
}

export function isSetComplete(
  set: MatchSet,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG
): { complete: boolean; winnerId?: string } {
  const { player1_score: p1, player2_score: p2 } = set;

  // Normal win: maxPoints with 2+ lead
  if (p1 >= config.maxPoints && p1 - p2 >= 2) return { complete: true, winnerId: 'player1' };
  if (p2 >= config.maxPoints && p2 - p1 >= 2) return { complete: true, winnerId: 'player2' };

  // Deuce win at absoluteMax
  if (p1 === config.absoluteMax) return { complete: true, winnerId: 'player1' };
  if (p2 === config.absoluteMax) return { complete: true, winnerId: 'player2' };

  return { complete: false };
}

export function addPoint(
  state: ScoreState,
  player: 'player1' | 'player2',
  player1Id: string,
  player2Id: string,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG
): ScoreState {
  if (state.isMatchComplete) return state;

  const newSets = state.sets.map(s => ({ ...s }));
  const currentSet = newSets[state.currentSet];

  if (player === 'player1') {
    currentSet.player1_score++;
  } else {
    currentSet.player2_score++;
  }

  const result = isSetComplete(currentSet, config);

  if (result.complete) {
    const winnerId = result.winnerId === 'player1' ? player1Id : player2Id;
    currentSet.is_complete = true;
    currentSet.winner_id = winnerId;

    const p1Wins = newSets.filter(s => s.winner_id === player1Id).length;
    const p2Wins = newSets.filter(s => s.winner_id === player2Id).length;

    if (p1Wins >= config.setsToWin) {
      return {
        sets: newSets,
        currentSet: state.currentSet,
        isMatchComplete: true,
        matchWinnerId: player1Id,
        player1SetsWon: p1Wins,
        player2SetsWon: p2Wins,
      };
    }
    if (p2Wins >= config.setsToWin) {
      return {
        sets: newSets,
        currentSet: state.currentSet,
        isMatchComplete: true,
        matchWinnerId: player2Id,
        player1SetsWon: p1Wins,
        player2SetsWon: p2Wins,
      };
    }

    // Start next set
    const nextSetNumber = newSets.length + 1;
    newSets.push({
      set_number: nextSetNumber,
      player1_score: 0,
      player2_score: 0,
      is_complete: false,
    });

    return {
      sets: newSets,
      currentSet: state.currentSet + 1,
      isMatchComplete: false,
      matchWinnerId: null,
      player1SetsWon: p1Wins,
      player2SetsWon: p2Wins,
    };
  }

  return {
    ...state,
    sets: newSets,
  };
}

export function undoPoint(state: ScoreState): ScoreState {
  if (state.isMatchComplete) return state;

  const newSets = state.sets.map(s => ({ ...s }));
  const currentSet = newSets[state.currentSet];

  if (currentSet.player1_score === 0 && currentSet.player2_score === 0) {
    // If first set, can't undo
    if (state.currentSet === 0) return state;

    // Go back to previous set
    newSets.pop();
    const prevSet = newSets[newSets.length - 1];
    prevSet.is_complete = false;
    prevSet.winner_id = undefined;

    // Recalculate set wins
    const p1Wins = newSets.filter(s => s.winner_id && s.winner_id === 'player1').length;
    const p2Wins = newSets.filter(s => s.winner_id && s.winner_id === 'player2').length;

    return {
      sets: newSets,
      currentSet: state.currentSet - 1,
      isMatchComplete: false,
      matchWinnerId: null,
      player1SetsWon: p1Wins,
      player2SetsWon: p2Wins,
    };
  }

  // Simple undo: remove last point
  if (currentSet.player2_score > currentSet.player1_score) {
    currentSet.player2_score--;
  } else {
    currentSet.player1_score--;
  }

  return { ...state, sets: newSets };
}

export function getSetSummary(set: MatchSet): string {
  return `${set.player1_score}-${set.player2_score}`;
}

export function isDeuce(set: MatchSet, config: ScoringConfig = DEFAULT_SCORING_CONFIG): boolean {
  return set.player1_score >= config.deucePoint && set.player2_score >= config.deucePoint;
}

export function getGamePoint(
  set: MatchSet,
  player1Id: string,
  player2Id: string,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG
): string | null {
  const { player1_score: p1, player2_score: p2 } = set;
  
  if (p1 >= config.deucePoint && p1 > p2) return player1Id;
  if (p2 >= config.deucePoint && p2 > p1) return player2Id;
  if (p1 === config.maxPoints - 1 && p2 < config.deucePoint) return player1Id;
  if (p2 === config.maxPoints - 1 && p1 < config.deucePoint) return player2Id;
  
  return null;
}
