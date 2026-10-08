import { Match } from '@/types';

/**
 * Calculates a stable chronological sequence number (Match 1, Match 2, Match 3, etc.)
 * for a match within its specific event category.
 */
export function getMatchNumber(matchId: string, eventId: string | undefined, allMatches: Match[]): number {
  if (!matchId || !eventId || !Array.isArray(allMatches)) return 1;

  const eventMatches = allMatches
    .filter(m => m.event_id === eventId)
    .sort((a, b) => {
      // 1. Sort by fixture round
      const roundA = a.fixture_round || 1;
      const roundB = b.fixture_round || 1;
      if (roundA !== roundB) return roundA - roundB;

      // 2. Sort by fixture position
      const posA = a.fixture_position || 0;
      const posB = b.fixture_position || 0;
      if (posA !== posB) return posA - posB;

      // 3. Sort by scheduled time
      const timeA = a.scheduled_time ? new Date(a.scheduled_time).getTime() : 0;
      const timeB = b.scheduled_time ? new Date(b.scheduled_time).getTime() : 0;
      if (timeA !== timeB) return timeA - timeB;

      // 4. Fallback stable sort by id
      return a.id.localeCompare(b.id);
    });

  const index = eventMatches.findIndex(m => m.id === matchId);
  return index !== -1 ? index + 1 : 1;
}

/**
 * Returns a clean, unique match ID badge string (e.g. #MP-VPL-001 or #M-101)
 */
export function getUniqueMatchId(match: Partial<Match>): string {
  if (match.match_code) return match.match_code;
  if (!match.id) return '#MATCH';
  
  // Format specific known tournament prefix
  if (match.id.startsWith('m_7pd_')) {
    const num = match.id.replace('m_7pd_', '');
    return `#7PD-VPL-${num.padStart(2, '0')}`;
  }
  if (match.id.startsWith('m_wvpl_')) {
    const num = match.id.replace('m_wvpl_', '');
    return `#WVPL-${num.padStart(2, '0')}`;
  }
  if (match.id.startsWith('adhoc-m-')) {
    const num = match.id.slice(-4);
    return `#ADHOC-${num}`;
  }
  if (match.id.startsWith('m')) {
    return `#M-${match.id.replace('m', '').padStart(3, '0')}`;
  }
  return `#${match.id.slice(0, 8).toUpperCase()}`;
}
