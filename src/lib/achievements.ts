import { Match, MatchSet } from '@/types';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
}

/**
 * Scans all matches in the league and determines the active and locked achievements
 * earned by a specific player.
 */
export function getPlayerAchievements(playerId: string, allMatches: Match[]): Achievement[] {
  const achievements: Achievement[] = [
    {
      id: 'champion',
      name: 'Champion',
      description: 'Won a tournament division or major finals event.',
      icon: '🏆',
      earned: false,
    },
    {
      id: 'comeback',
      name: 'Comeback King/Queen',
      description: 'Won a match after dropping the opening set.',
      icon: '⚡',
      earned: false,
    },
    {
      id: 'sweep',
      name: 'Clean Sweep',
      description: 'Dominated a set, conceding 5 or fewer points.',
      icon: '🧹',
      earned: false,
    },
    {
      id: 'deuce',
      name: 'Deuce Survivor',
      description: 'Won a highly contested set extending into deuce caps.',
      icon: '🩺',
      earned: false,
    },
    {
      id: 'ironman',
      name: 'Iron Man / Woman',
      description: 'Won a grueling 3-set marathon match with 95+ total points.',
      icon: '🏃‍♂️',
      earned: false,
    },
    {
      id: 'veteran',
      name: 'Match Veteran',
      description: 'Completed 5 or more competitive league matches.',
      icon: '🎖',
      earned: false,
    },
    {
      id: 'streak',
      name: 'Streak Master',
      description: 'Maintained a stellar 3+ match winning streak.',
      icon: '🔥',
      earned: false,
    },
  ];

  if (!playerId || !Array.isArray(allMatches)) return achievements;

  // Filter completed matches where player participated
  const playerMatches = allMatches.filter(
    m => m.status === 'completed' && (m.player1_id === playerId || m.player2_id === playerId)
  );

  // 1. Veteran Badge (Played 5+ completed matches)
  if (playerMatches.length >= 5) {
    const veteranAch = achievements.find(a => a.id === 'veteran');
    if (veteranAch) veteranAch.earned = true;
  }

  // Scan individual match patterns
  let comebackEarned = false;
  let sweepEarned = false;
  let deuceEarned = false;
  let ironmanEarned = false;
  let championEarned = false;

  playerMatches.forEach(match => {
    const isP1 = match.player1_id === playerId;
    const isWinner = match.winner_id === playerId;

    // A. Champion Badge (Won a final fixture)
    // We assume fixture_round >= 3 (e.g. Semi-finals / Finals) or round is the final match in the list
    if (isWinner && match.fixture_round !== undefined && match.fixture_round >= 3) {
      championEarned = true;
    }

    // B. Comeback Badge (Won after losing the 1st set)
    if (isWinner && match.sets && match.sets.length > 1) {
      const firstSet = match.sets[0];
      if (firstSet.is_complete && firstSet.winner_id !== playerId) {
        comebackEarned = true;
      }
    }

    // C. Clean Sweep & Deuce Survivor (Inspect individual sets)
    if (match.sets) {
      let totalMatchPoints = 0;
      match.sets.forEach(set => {
        const p1Score = set.player1_score;
        const p2Score = set.player2_score;
        totalMatchPoints += p1Score + p2Score;

        const isPlayerSetWinner = set.winner_id === playerId;
        const oppScore = isP1 ? p2Score : p1Score;

        // Clean Sweep (Conceded <= 5 points in a set won)
        if (isPlayerSetWinner && set.is_complete && oppScore <= 5 && oppScore > 0) {
          sweepEarned = true;
        }

        // Deuce Survivor (Won a deuce set > 21 or 21-20/22-20)
        const isDeuceSet = p1Score > 21 || p2Score > 21 || (p1Score === 21 && p2Score === 20) || (p2Score === 21 && p1Score === 20);
        if (isPlayerSetWinner && set.is_complete && isDeuceSet) {
          deuceEarned = true;
        }
      });

      // D. Iron Man Badge (Won a 3-set match exceeding 95 total points)
      if (isWinner && match.sets.length === 3 && totalMatchPoints >= 95) {
        ironmanEarned = true;
      }
    }
  });

  // E. Streak Master Badge (Active 3+ winning streak)
  // Sort player's matches chronologically
  const sortedMatches = [...playerMatches].sort((a, b) => {
    const timeA = a.actual_end_time ? new Date(a.actual_end_time).getTime() : 0;
    const timeB = b.actual_end_time ? new Date(b.actual_end_time).getTime() : 0;
    return timeA - timeB;
  });

  let currentStreak = 0;
  let maxStreak = 0;

  sortedMatches.forEach(match => {
    if (match.winner_id === playerId) {
      currentStreak++;
      if (currentStreak > maxStreak) maxStreak = currentStreak;
    } else {
      currentStreak = 0;
    }
  });

  const streakEarned = maxStreak >= 3;

  // Apply results to achievements array
  if (championEarned) achievements.find(a => a.id === 'champion')!.earned = true;
  if (comebackEarned) achievements.find(a => a.id === 'comeback')!.earned = true;
  if (sweepEarned) achievements.find(a => a.id === 'sweep')!.earned = true;
  if (deuceEarned) achievements.find(a => a.id === 'deuce')!.earned = true;
  if (ironmanEarned) achievements.find(a => a.id === 'ironman')!.earned = true;
  if (streakEarned) achievements.find(a => a.id === 'streak')!.earned = true;

  return achievements;
}
