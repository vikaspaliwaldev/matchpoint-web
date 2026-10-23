// ============================================================
// MatchPoint — Offline Scoring & Synchronization Utility
// ============================================================
// Works transparently across all sports (Badminton, Table Tennis, Squash, Tennis, Volleyball)
// Caches match payloads in localStorage and immediately flushes them when online.
// ============================================================

import { updateMatchScore } from './supabase-service';
import { MatchSet, MatchStatus } from '@/types';

export interface OfflineScorePayload {
  matchId: string;
  sets: MatchSet[];
  status: MatchStatus;
  winnerId?: string | null;
  actualStartTime?: string | null;
  actualEndTime?: string | null;
  court?: string | null;
  subMatches?: any;
  durationSeconds?: number | null;
  sport?: string;
  sportType?: string;
  metadata?: any;
  sportMetadata?: any;
  savedAt?: string;
  updatedAt?: string;
}

export function saveOfflineScorePayload(payload: OfflineScorePayload): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`matchpoint_offline_score_${payload.matchId}`, JSON.stringify(payload));
  } catch (err) {
    console.warn('Failed to save score to local storage:', err);
  }
}

export function getOfflineScorePayload(matchId: string): OfflineScorePayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`matchpoint_offline_score_${matchId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearOfflineScorePayload(matchId: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(`matchpoint_offline_score_${matchId}`);
  } catch {}
}

export async function flushAllOfflineScores(
  onProgress?: (flushedMatchId: string) => void
): Promise<number> {
  if (typeof window === 'undefined') return 0;
  if (!navigator.onLine) return 0;

  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('matchpoint_offline_score_')) {
      keys.push(key);
    }
  }

  if (keys.length === 0) return 0;

  let flushedCount = 0;
  for (const k of keys) {
    try {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const payload: OfflineScorePayload = JSON.parse(raw);

      await updateMatchScore(
        payload.matchId,
        payload.sets,
        payload.status,
        payload.winnerId,
        payload.actualStartTime,
        payload.actualEndTime,
        payload.court,
        payload.subMatches,
        payload.durationSeconds,
        payload.sport || payload.sportType || 'badminton',
        payload.metadata || payload.sportMetadata
      );

      localStorage.removeItem(k);
      flushedCount++;
      if (onProgress) onProgress(payload.matchId);
    } catch (err) {
      console.warn(`Failed to flush offline item ${k}:`, err);
    }
  }

  return flushedCount;
}
