// ============================================================
// MatchPoint — Knockout Fixture Generator
// ============================================================

import { Match, Registration, MatchStatus } from '@/types';

interface FixtureConfig {
  eventId: string;
  tournamentId: string;
  registrations: Registration[];
  courts?: string[];
  tournamentType?: 'individual' | 'team';
  teamTieEvents?: string[];
}

interface GeneratedFixture {
  rounds: {
    round_number: number;
    round_name: string;
    matches: Match[];
  }[];
}

function nextPowerOf2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

function getRoundName(roundIndex: number, totalRounds: number): string {
  const fromFinal = totalRounds - roundIndex;
  switch (fromFinal) {
    case 1: return 'Final';
    case 2: return 'Semi Finals';
    case 3: return 'Quarter Finals';
    case 4: return 'Round of 16';
    case 5: return 'Round of 32';
    case 6: return 'Round of 64';
    default: return `Round ${roundIndex + 1}`;
  }
}

export function generateKnockoutBracket(config: FixtureConfig): GeneratedFixture {
  const { eventId, tournamentId, registrations, courts = ['Court 1', 'Court 2'], tournamentType = 'individual', teamTieEvents = [] } = config;

  // Sort by seed (seeded players first)
  const sorted = [...registrations]
    .filter(r => r.status === 'approved')
    .sort((a, b) => {
      if (a.seed && b.seed) return a.seed - b.seed;
      if (a.seed) return -1;
      if (b.seed) return 1;
      return 0;
    });

  const bracketSize = nextPowerOf2(sorted.length);
  const totalRounds = Math.log2(bracketSize);
  const numByes = bracketSize - sorted.length;

  // Place players in bracket positions (seeded placement)
  const slots: (Registration | null)[] = new Array(bracketSize).fill(null);

  // Place seeded players at standard positions
  for (let i = 0; i < sorted.length; i++) {
    slots[i] = sorted[i];
  }

  // Generate first round matches
  const rounds: GeneratedFixture['rounds'] = [];

  const firstRoundMatches: Match[] = [];
  for (let i = 0; i < bracketSize / 2; i++) {
    const p1 = slots[i * 2];
    const p2 = slots[i * 2 + 1];

    // If either player is null (bye), the other advances automatically
    if (!p1 && !p2) continue;

    const isBye = !p1 || !p2;
    const match: Match = {
      id: `gen-m-${eventId}-r0-${i}`,
      tournament_id: tournamentId,
      event_id: eventId,
      fixture_round: 0,
      fixture_position: i,
      court: courts[i % courts.length],
      player1_id: p1?.player_id || 'BYE',
      player1_name: p1 ? (p1.partner_name ? `${p1.player_name}/${p1.partner_name}` : p1.player_name) : 'BYE',
      player2_id: p2?.player_id || 'BYE',
      player2_name: p2 ? (p2.partner_name ? `${p2.player_name}/${p2.partner_name}` : p2.player_name) : 'BYE',
      status: (isBye ? 'completed' : 'scheduled') as MatchStatus,
      winner_id: isBye ? (p1 ? p1.player_id : p2?.player_id) : undefined,
      sets: [],
      sub_matches: tournamentType === 'team' && teamTieEvents.length > 0 && !isBye
        ? teamTieEvents.map((evt, idx) => ({
            id: `sub-m-${eventId}-r0-${i}-${evt.replace(/[^a-zA-Z0-9]/g, '-')}-${idx}`,
            event_type: evt,
            player1_names: [],
            player2_names: [],
            sets: [],
            status: 'scheduled' as MatchStatus,
          }))
        : undefined,
    };

    firstRoundMatches.push(match);
  }

  // Only add first round if there are actual matches (not all byes)
  const actualFirstRound = firstRoundMatches.filter(
    m => m.player1_id !== 'BYE' && m.player2_id !== 'BYE'
  );

  if (actualFirstRound.length > 0 || numByes === 0) {
    rounds.push({
      round_number: 0,
      round_name: getRoundName(0, totalRounds),
      matches: firstRoundMatches,
    });
  }

  // Generate placeholder rounds for remaining rounds
  let matchesInRound = bracketSize / 4;
  for (let r = 1; r < totalRounds; r++) {
    const roundMatches: Match[] = [];

    for (let i = 0; i < matchesInRound; i++) {
      roundMatches.push({
        id: `gen-m-${eventId}-r${r}-${i}`,
        tournament_id: tournamentId,
        event_id: eventId,
        fixture_round: r,
        fixture_position: i,
        court: courts[i % courts.length],
        player1_id: 'TBD',
        player1_name: 'TBD',
        player2_id: 'TBD',
        player2_name: 'TBD',
        status: 'scheduled' as MatchStatus,
        sets: [],
        sub_matches: tournamentType === 'team' && teamTieEvents.length > 0
          ? teamTieEvents.map((evt, idx) => ({
              id: `sub-m-${eventId}-r${r}-${i}-${evt.replace(/[^a-zA-Z0-9]/g, '-')}-${idx}`,
              event_type: evt,
              player1_names: [],
              player2_names: [],
              sets: [],
              status: 'scheduled' as MatchStatus,
            }))
          : undefined,
      });
    }

    rounds.push({
      round_number: r,
      round_name: getRoundName(r, totalRounds),
      matches: roundMatches,
    });

    matchesInRound = matchesInRound / 2;
  }

  return { rounds };
}
