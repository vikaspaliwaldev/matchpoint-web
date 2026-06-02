import { Match } from '@/types';

/**
 * Automatically generates a descriptive, high-quality, natural-language narrative 
 * summarizing the completed match scoreline, blowouts, close battles, deuces, and comebacks.
 */
export function generateMatchHighlights(match: Match): string {
  if (!match || match.status !== 'completed' || !match.sets || match.sets.length === 0) {
    return 'Match summary is currently unavailable.';
  }

  const p1Name = match.player1_name || 'Player 1';
  const p2Name = match.player2_name || 'Player 2';
  const winnerId = match.winner_id;
  const isP1Winner = winnerId === match.player1_id;
  const winnerName = isP1Winner ? p1Name : p2Name;
  const loserName = isP1Winner ? p2Name : p1Name;

  // Filter completed sets
  const completedSets = match.sets.filter(s => s.is_complete);
  if (completedSets.length === 0) {
    return `${winnerName} won the match against ${loserName}.`;
  }

  const p1SetsWon = completedSets.filter(s => s.winner_id === match.player1_id).length;
  const p2SetsWon = completedSets.filter(s => s.winner_id === match.player2_id).length;
  const winnerSets = isP1Winner ? p1SetsWon : p2SetsWon;
  const loserSets = isP1Winner ? p2SetsWon : p1SetsWon;

  const sentences: string[] = [];

  // 1. Overall Match Outcome & Narrative Lead
  const totalSets = completedSets.length;
  const firstSetWinnerId = completedSets[0].winner_id;

  const scoreSummaryString = completedSets
    .map(s => `${s.player1_score}-${s.player2_score}`)
    .join(', ');

  if (winnerSets === totalSets) {
    // Dominating straight sets win
    sentences.push(
      `🏸 A dominating straight-sets victory (${winnerSets}-${loserSets}) for ${winnerName}, defeating ${loserName} in style with a final scoreline of [${scoreSummaryString}].`
    );
    sentences.push(`${winnerName} established control early on, keeping aggressive court position and dictating the pace of play.`);
  } else if (firstSetWinnerId && firstSetWinnerId !== winnerId) {
    // Fought back and won (Comeback victory)
    sentences.push(
      `🏸 A spectacular comeback victory for ${winnerName}! After dropping the opening set, ${winnerName} showed incredible mental resilience to rally back, claiming the next two games to seal a thrilling 2-1 win [${scoreSummaryString}].`
    );
  } else {
    // Balanced 2-1 thriller
    sentences.push(
      `🏸 ${winnerName} emerged victorious in a grueling 3-set thriller (${winnerSets}-${loserSets}) against ${loserName} [${scoreSummaryString}].`
    );
    sentences.push(`After splitting the first two games in a high-intensity physical exchange, the match was decided in a highly contested final set.`);
  }

  // 2. Analyze Individual Sets
  completedSets.forEach((set) => {
    const setNum = set.set_number;
    const p1Score = set.player1_score;
    const p2Score = set.player2_score;
    const isP1SetWinner = set.winner_id === match.player1_id;
    const setWinnerName = isP1SetWinner ? p1Name : p2Name;
    const setLoserName = isP1SetWinner ? p2Name : p1Name;
    const setWinnerScore = isP1SetWinner ? p1Score : p2Score;
    const setLoserScore = isP1SetWinner ? p2Score : p1Score;

    const diff = Math.abs(p1Score - p2Score);
    const isDeuce = p1Score > 21 || p2Score > 21 || (p1Score === 21 && p2Score === 20) || (p2Score === 21 && p1Score === 20);

    if (isDeuce) {
      sentences.push(
        `Game ${setNum} was an absolute nail-biter, extending deep into intense deuce territory as both players pushed their physical limits. ${setWinnerName} clinched the crucial deuce cap to secure the game ${p1Score}-${p2Score}.`
      );
    } else if (setWinnerScore >= 21 && setLoserScore <= 7) {
      sentences.push(
        `In Game ${setNum}, ${setWinnerName} put on a absolute masterclass, completely dominating court placement and conceding only ${setLoserScore} points in a swift blowout.`
      );
    } else if (diff <= 3) {
      sentences.push(
        `Game ${setNum} went right down to the wire, with ${setWinnerName} holding their composure during rapid net play exchanges to clinch a narrow ${p1Score}-${p2Score} win.`
      );
    } else {
      sentences.push(
        `Game ${setNum} saw a solid display from ${setWinnerName}, who built a steady mid-game lead to take it comfortably at ${setWinnerScore}-${setLoserScore}.`
      );
    }
  });

  // 3. Final Conclusion
  if (totalSets > 1) {
    const lastSet = completedSets[totalSets - 1];
    const lastSetWinner = lastSet.winner_id === match.player1_id ? p1Name : p2Name;
    sentences.push(
      `The final rally ended with ${lastSetWinner} unleashing a decisive smash, bringing a fitting conclusion to an excellent show of badminton athleticism.`
    );
  }

  return sentences.join(' ');
}
