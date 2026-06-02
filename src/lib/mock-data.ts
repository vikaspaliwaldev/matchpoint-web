// ============================================================
// MatchPoint — Mock Data Store (Demo Mode)
// ============================================================

import {
  User,
  Tournament,
  TournamentEvent,
  Registration,
  Match,
  MatchSet,
  DashboardStats,
  MatchStatus,
  Team,
  MasterEvent,
  TournamentMedia,
  MatchComment,
} from '@/types';

// ---- Event Master Table (Global Master Events Templates) ----
export const mockMasterEvents: MasterEvent[] = [
  { id: 'ms_open', name: "Men's Singles", event_type: 'singles', category: 'open', gender: 'Male', min_age: 0, max_age: 100 },
  { id: 'ws_open', name: "Women's Singles", event_type: 'singles', category: 'open', gender: 'Female', min_age: 0, max_age: 100 },
  { id: 'md_open', name: "Men's Doubles", event_type: 'doubles', category: 'open', gender: 'Male', min_age: 0, max_age: 100 },
  { id: 'wd_open', name: "Women's Doubles", event_type: 'doubles', category: 'open', gender: 'Female', min_age: 0, max_age: 100 },
  { id: 'xd_open', name: "Mixed Doubles", event_type: 'doubles', category: 'open', gender: 'Mixed', min_age: 0, max_age: 100 },
  { id: 'bs_u19', name: "Boys Singles Under-19", event_type: 'singles', category: 'junior', gender: 'Male', min_age: 0, max_age: 19 },
  { id: 'gs_u19', name: "Girls Singles Under-19", event_type: 'singles', category: 'junior', gender: 'Female', min_age: 0, max_age: 19 },
  { id: 'team_open', name: "Franchise Team Championship", event_type: 'team', category: 'open', gender: 'Open', min_age: 0, max_age: 100 },
];

// ---- Users ----

export const mockUsers: User[] = [
  {
    id: 'u1',
    email: 'admin@matchpoint.io',
    name: 'Rajesh Kumar',
    role: 'admin',
    roles: ['admin', 'player'],
    phone: '+91 98765 43210',
    age: 32,
    gender: 'Male',
    created_at: '2025-01-15T10:00:00Z',
  },
  {
    id: 'u2',
    email: 'priya@matchpoint.io',
    name: 'Priya Sharma',
    role: 'player',
    roles: ['player'],
    phone: '+91 91234 56789',
    age: 24,
    gender: 'Female',
    created_at: '2025-02-01T10:00:00Z',
  },
  {
    id: 'u3',
    email: 'vikas@matchpoint.io',
    name: 'Vikas Patel',
    role: 'player',
    roles: ['player'],
    age: 28,
    gender: 'Male',
    created_at: '2025-02-05T10:00:00Z',
  },
  {
    id: 'u4',
    email: 'anita@matchpoint.io',
    name: 'Anita Desai',
    role: 'player',
    roles: ['player'],
    age: 21,
    gender: 'Female',
    created_at: '2025-02-10T10:00:00Z',
  },
  {
    id: 'u5',
    email: 'umpire@matchpoint.io',
    name: 'Suresh Nair',
    role: 'umpire',
    roles: ['umpire', 'player'],
    age: 40,
    gender: 'Male',
    created_at: '2025-01-20T10:00:00Z',
  },
  {
    id: 'u6',
    email: 'rahul@matchpoint.io',
    name: 'Rahul Singh',
    role: 'player',
    roles: ['player'],
    age: 25,
    gender: 'Male',
    created_at: '2025-03-01T10:00:00Z',
  },
  {
    id: 'u7',
    email: 'neha@matchpoint.io',
    name: 'Neha Gupta',
    role: 'player',
    roles: ['player'],
    age: 23,
    gender: 'Female',
    created_at: '2025-03-05T10:00:00Z',
  },
  {
    id: 'u8',
    email: 'amit@matchpoint.io',
    name: 'Amit Verma',
    role: 'player',
    roles: ['player'],
    age: 27,
    gender: 'Male',
    created_at: '2025-03-10T10:00:00Z',
  },
  {
    id: 'u9',
    email: 'deepa@matchpoint.io',
    name: 'Deepa Menon',
    role: 'player',
    roles: ['player'],
    age: 29,
    gender: 'Female',
    created_at: '2025-03-12T10:00:00Z',
  },
  {
    id: 'u10',
    email: 'karthik@matchpoint.io',
    name: 'Karthik Rajan',
    role: 'player',
    roles: ['player'],
    age: 26,
    gender: 'Male',
    created_at: '2025-03-15T10:00:00Z',
  },
  {
    id: 'u11',
    email: 'allroles@matchpoint.io',
    name: 'Arjun Mehta',
    role: 'admin',
    roles: ['admin', 'player', 'umpire'],
    created_at: '2025-01-10T10:00:00Z',
  },
  {
    id: 'u12',
    email: 'umpire2@matchpoint.io',
    name: 'Kavita Rao',
    role: 'umpire',
    roles: ['umpire'],
    created_at: '2025-02-20T10:00:00Z',
  },
];

// ---- Categories ----
export let mockCategories = [
  { value: 'MS', label: "Men's Singles" },
  { value: 'WS', label: "Women's Singles" },
  { value: 'MD', label: "Men's Doubles" },
  { value: 'WD', label: "Women's Doubles" },
  { value: 'XD', label: "Mixed Doubles" },
  { value: 'TEAM', label: "Team" },
];

// ---- Tournaments ----

export const mockTournaments: Tournament[] = [
  {
    id: 't1',
    name: 'Mumbai Badminton Open 2025',
    slug: 'mumbai-open-2025',
    description: 'The premier badminton tournament in Mumbai. Open to all skill levels. Prizes worth ₹5,00,000!',
    location: 'Shree Shiv Chhatrapati Sports Complex, Mumbai',
    start_date: '2025-06-15',
    end_date: '2025-06-22',
    type: 'individual',
    status: 'live',
    created_by: 'u1',
    created_at: '2025-01-20T10:00:00Z',
  },
  {
    id: 't2',
    name: 'Delhi Shuttle Championship',
    slug: 'delhi-shuttle-championship',
    description: 'Annual championship featuring top players from across North India.',
    location: 'Siri Fort Sports Complex, New Delhi',
    start_date: '2025-07-10',
    end_date: '2025-07-14',
    type: 'individual',
    status: 'open',
    created_by: 'u1',
    created_at: '2025-02-10T10:00:00Z',
  },
  {
    id: 't3',
    name: 'Bangalore Corporate League',
    slug: 'bangalore-corporate-league',
    description: 'Team-based corporate badminton league. Companies compete head-to-head!',
    location: 'Koramangala Indoor Stadium, Bangalore',
    start_date: '2025-08-01',
    end_date: '2025-08-15',
    type: 'team',
    status: 'draft',
    created_by: 'u1',
    created_at: '2025-03-01T10:00:00Z',
  },
  {
    id: 't4',
    name: 'Pune Masters Invitational',
    slug: 'pune-masters-2025',
    description: 'Invitational tournament for ranked players. Seeded draw with knockout format.',
    location: 'Balewadi Stadium, Pune',
    start_date: '2025-05-01',
    end_date: '2025-05-05',
    type: 'individual',
    status: 'completed',
    created_by: 'u1',
    created_at: '2025-01-05T10:00:00Z',
  },
];

// ---- Events ----

export const mockEvents: TournamentEvent[] = [
  { id: 'e1', tournament_id: 't1', master_event_id: 'ms_open', event_name: "Men's Singles", category: 'MS', entry_limit: 32, format: 'knockout', registrations_count: 24, scoring_format: '21-point', gender_restriction: 'men', age_limit: 0, age_restriction_type: 'max' },
  { id: 'e2', tournament_id: 't1', master_event_id: 'ws_open', event_name: "Women's Singles", category: 'WS', entry_limit: 16, format: 'knockout', registrations_count: 12, scoring_format: '21-point', gender_restriction: 'women', age_limit: 0, age_restriction_type: 'max' },
  { id: 'e3', tournament_id: 't1', master_event_id: 'md_open', event_name: "Men's Doubles", category: 'MD', entry_limit: 16, format: 'knockout', registrations_count: 14, scoring_format: '21-point', gender_restriction: 'men', age_limit: 0, age_restriction_type: 'max' },
  { id: 'e4', tournament_id: 't1', master_event_id: 'xd_open', event_name: "Mixed Doubles", category: 'XD', entry_limit: 16, format: 'knockout', registrations_count: 10, scoring_format: '21-point', gender_restriction: 'mixed', age_limit: 0, age_restriction_type: 'max' },
  { id: 'e5', tournament_id: 't2', master_event_id: 'ms_open', event_name: "Men's Singles", category: 'MS', entry_limit: 64, format: 'knockout', registrations_count: 38, scoring_format: '21-point', gender_restriction: 'men', age_limit: 0, age_restriction_type: 'max' },
  { id: 'e6', tournament_id: 't2', master_event_id: 'ws_open', event_name: "Women's Singles", category: 'WS', entry_limit: 32, format: 'knockout', registrations_count: 20, scoring_format: '21-point', gender_restriction: 'women', age_limit: 0, age_restriction_type: 'max' },
  { id: 'e7', tournament_id: 't4', master_event_id: 'ms_open', event_name: "Men's Singles", category: 'MS', entry_limit: 16, format: 'knockout', registrations_count: 16, scoring_format: '21-point', gender_restriction: 'men', age_limit: 0, age_restriction_type: 'max' },
  { id: 'e8', tournament_id: 't3', master_event_id: 'team_open', event_name: "Team Event", category: 'TEAM', entry_limit: 8, format: 'league', registrations_count: 6, scoring_format: '21-point', gender_restriction: 'open', age_limit: 0, age_restriction_type: 'max' },
];

// ---- Registrations ----

export const mockRegistrations: Registration[] = [
  // T1 - Event e1 (Men's Singles)
  { id: 'r1', tournament_id: 't1', event_id: 'e1', player_id: 'u2', player_name: 'Priya Sharma', player_email: 'priya@matchpoint.io', status: 'approved', registered_at: '2025-04-01T10:00:00Z', seed: 1 },
  { id: 'r2', tournament_id: 't1', event_id: 'e1', player_id: 'u3', player_name: 'Vikas Patel', player_email: 'vikas@matchpoint.io', status: 'approved', registered_at: '2025-04-02T10:00:00Z', seed: 2 },
  { id: 'r3', tournament_id: 't1', event_id: 'e1', player_id: 'u4', player_name: 'Anita Desai', player_email: 'anita@matchpoint.io', status: 'approved', registered_at: '2025-04-03T10:00:00Z', seed: 3 },
  { id: 'r4', tournament_id: 't1', event_id: 'e1', player_id: 'u6', player_name: 'Rahul Singh', player_email: 'rahul@matchpoint.io', status: 'approved', registered_at: '2025-04-04T10:00:00Z', seed: 4 },
  { id: 'r5', tournament_id: 't1', event_id: 'e1', player_id: 'u7', player_name: 'Neha Gupta', player_email: 'neha@matchpoint.io', status: 'pending', registered_at: '2025-04-05T10:00:00Z' },
  { id: 'r6', tournament_id: 't1', event_id: 'e1', player_id: 'u8', player_name: 'Amit Verma', player_email: 'amit@matchpoint.io', status: 'approved', registered_at: '2025-04-06T10:00:00Z', seed: 5 },
  { id: 'r7', tournament_id: 't1', event_id: 'e1', player_id: 'u9', player_name: 'Deepa Menon', player_email: 'deepa@matchpoint.io', status: 'rejected', registered_at: '2025-04-07T10:00:00Z' },
  { id: 'r8', tournament_id: 't1', event_id: 'e1', player_id: 'u10', player_name: 'Karthik Rajan', player_email: 'karthik@matchpoint.io', status: 'approved', registered_at: '2025-04-08T10:00:00Z', seed: 6 },

  // T1 - Event e2 (Women's Singles) — NEW: registrations for fixture generation
  { id: 'r11', tournament_id: 't1', event_id: 'e2', player_id: 'u2', player_name: 'Priya Sharma', player_email: 'priya@matchpoint.io', status: 'approved', registered_at: '2025-04-01T10:00:00Z', seed: 1 },
  { id: 'r12', tournament_id: 't1', event_id: 'e2', player_id: 'u4', player_name: 'Anita Desai', player_email: 'anita@matchpoint.io', status: 'approved', registered_at: '2025-04-02T10:00:00Z', seed: 2 },
  { id: 'r13', tournament_id: 't1', event_id: 'e2', player_id: 'u7', player_name: 'Neha Gupta', player_email: 'neha@matchpoint.io', status: 'approved', registered_at: '2025-04-03T10:00:00Z', seed: 3 },
  { id: 'r14', tournament_id: 't1', event_id: 'e2', player_id: 'u9', player_name: 'Deepa Menon', player_email: 'deepa@matchpoint.io', status: 'approved', registered_at: '2025-04-04T10:00:00Z', seed: 4 },

  // T2 - Event e5 (Men's Singles)
  { id: 'r9', tournament_id: 't2', event_id: 'e5', player_id: 'u2', player_name: 'Priya Sharma', player_email: 'priya@matchpoint.io', status: 'approved', registered_at: '2025-05-01T10:00:00Z', seed: 1 },
  { id: 'r10', tournament_id: 't2', event_id: 'e5', player_id: 'u6', player_name: 'Rahul Singh', player_email: 'rahul@matchpoint.io', status: 'approved', registered_at: '2025-05-02T10:00:00Z', seed: 2 },
  { id: 'r15', tournament_id: 't2', event_id: 'e5', player_id: 'u3', player_name: 'Vikas Patel', player_email: 'vikas@matchpoint.io', status: 'approved', registered_at: '2025-05-03T10:00:00Z', seed: 3 },
  { id: 'r16', tournament_id: 't2', event_id: 'e5', player_id: 'u8', player_name: 'Amit Verma', player_email: 'amit@matchpoint.io', status: 'approved', registered_at: '2025-05-04T10:00:00Z', seed: 4 },

  // T2 - Event e6 (Women's Singles)
  { id: 'r17', tournament_id: 't2', event_id: 'e6', player_id: 'u4', player_name: 'Anita Desai', player_email: 'anita@matchpoint.io', status: 'approved', registered_at: '2025-05-01T10:00:00Z', seed: 1 },
  { id: 'r18', tournament_id: 't2', event_id: 'e6', player_id: 'u7', player_name: 'Neha Gupta', player_email: 'neha@matchpoint.io', status: 'approved', registered_at: '2025-05-02T10:00:00Z', seed: 2 },
  { id: 'r19', tournament_id: 't2', event_id: 'e6', player_id: 'u9', player_name: 'Deepa Menon', player_email: 'deepa@matchpoint.io', status: 'approved', registered_at: '2025-05-03T10:00:00Z', seed: 3 },
  { id: 'r20', tournament_id: 't2', event_id: 'e6', player_id: 'u2', player_name: 'Priya Sharma', player_email: 'priya@matchpoint.io', status: 'approved', registered_at: '2025-05-04T10:00:00Z', seed: 4 },
];

// ---- Teams ----

export const mockTeams: Team[] = [
  { id: 'team1', name: 'Infosys Smashers', tournament_id: 't3', logo_color: '#6366f1', captain_id: 'u3', players: ['u3', 'u6'] },
  { id: 'team2', name: 'TCS Titans', tournament_id: 't3', logo_color: '#ef4444', captain_id: 'u8', players: ['u8', 'u10'] },
  { id: 'team3', name: 'Wipro Warriors', tournament_id: 't3', logo_color: '#22c55e', players: [] },
];

// ---- Matches ----

function createSet(p1: number, p2: number, setNum: number, winnerId?: string): MatchSet {
  return {
    set_number: setNum,
    player1_score: p1,
    player2_score: p2,
    is_complete: !!(winnerId),
    winner_id: winnerId,
  };
}

export const mockMatches: Match[] = [
  // T1 - Event e1 (MS) - Semi Finals
  {
    id: 'm1',
    tournament_id: 't1',
    event_id: 'e1',
    fixture_round: 2,
    fixture_position: 0,
    court: 'Court 1',
    player1_id: 'u2',
    player1_name: 'Priya Sharma',
    player2_id: 'u3',
    player2_name: 'Vikas Patel',
    umpire_id: 'u5',
    umpire_name: 'Suresh Nair',
    scheduled_time: '2025-06-20T10:00:00Z',
    status: 'running' as MatchStatus,
    sets: [
      createSet(21, 18, 1, 'u2'),
      createSet(14, 17, 2),
    ],
  },
  {
    id: 'm2',
    tournament_id: 't1',
    event_id: 'e1',
    fixture_round: 2,
    fixture_position: 1,
    court: 'Court 2',
    player1_id: 'u4',
    player1_name: 'Anita Desai',
    player2_id: 'u6',
    player2_name: 'Rahul Singh',
    scheduled_time: '2025-06-20T14:00:00Z',
    status: 'scheduled' as MatchStatus,
    sets: [],
  },
  // T1 - Event e1 (MS) - Quarter Finals (completed)
  {
    id: 'm3',
    tournament_id: 't1',
    event_id: 'e1',
    fixture_round: 1,
    fixture_position: 0,
    court: 'Court 1',
    player1_id: 'u2',
    player1_name: 'Priya Sharma',
    player2_id: 'u8',
    player2_name: 'Amit Verma',
    scheduled_time: '2025-06-18T10:00:00Z',
    status: 'completed' as MatchStatus,
    winner_id: 'u2',
    sets: [
      createSet(21, 15, 1, 'u2'),
      createSet(21, 12, 2, 'u2'),
    ],
  },
  {
    id: 'm4',
    tournament_id: 't1',
    event_id: 'e1',
    fixture_round: 1,
    fixture_position: 1,
    court: 'Court 2',
    player1_id: 'u3',
    player1_name: 'Vikas Patel',
    player2_id: 'u10',
    player2_name: 'Karthik Rajan',
    scheduled_time: '2025-06-18T14:00:00Z',
    status: 'completed' as MatchStatus,
    winner_id: 'u3',
    sets: [
      createSet(18, 21, 1, 'u10'),
      createSet(21, 16, 2, 'u3'),
      createSet(21, 19, 3, 'u3'),
    ],
  },
  {
    id: 'm5',
    tournament_id: 't1',
    event_id: 'e1',
    fixture_round: 1,
    fixture_position: 2,
    court: 'Court 1',
    player1_id: 'u4',
    player1_name: 'Anita Desai',
    player2_id: 'u7',
    player2_name: 'Neha Gupta',
    scheduled_time: '2025-06-19T10:00:00Z',
    status: 'completed' as MatchStatus,
    winner_id: 'u4',
    sets: [
      createSet(21, 11, 1, 'u4'),
      createSet(21, 17, 2, 'u4'),
    ],
  },
  {
    id: 'm6',
    tournament_id: 't1',
    event_id: 'e1',
    fixture_round: 1,
    fixture_position: 3,
    court: 'Court 2',
    player1_id: 'u6',
    player1_name: 'Rahul Singh',
    player2_id: 'u9',
    player2_name: 'Deepa Menon',
    scheduled_time: '2025-06-19T14:00:00Z',
    status: 'completed' as MatchStatus,
    winner_id: 'u6',
    sets: [
      createSet(21, 19, 1, 'u6'),
      createSet(19, 21, 2, 'u9'),
      createSet(21, 15, 3, 'u6'),
    ],
  },
];

// ---- Dashboard Stats ----

export const mockDashboardStats: DashboardStats = {
  totalTournaments: 4,
  activeTournaments: 2,
  totalRegistrations: 60,
  totalMatches: 24,
  liveMatches: 1,
  completedMatches: 18,
};

// ---- Helper Functions ----

export function getTournamentById(id: string): Tournament | undefined {
  return mockTournaments.find(t => t.id === id);
}

export function getEventsByTournament(tournamentId: string): TournamentEvent[] {
  return mockEvents.filter(e => e.tournament_id === tournamentId);
}

export function getRegistrationsByEvent(eventId: string): Registration[] {
  return mockRegistrations.filter(r => r.event_id === eventId);
}

export function getMatchesByEvent(eventId: string): Match[] {
  return mockMatches.filter(m => m.event_id === eventId);
}

export function getMatchesByTournament(tournamentId: string): Match[] {
  return mockMatches.filter(m => m.tournament_id === tournamentId);
}

export function getLiveMatches(): Match[] {
  return mockMatches.filter(m => m.status === 'running');
}

export function getUpcomingMatches(playerId: string): Match[] {
  return mockMatches.filter(m =>
    (m.player1_id === playerId || m.player2_id === playerId) &&
    (m.status === 'scheduled' || m.status === 'running')
  );
}

export function getPlayerRegistrations(playerId: string): Registration[] {
  return mockRegistrations.filter(r => r.player_id === playerId);
}

export function getUmpireMatches(umpireId: string): Match[] {
  return mockMatches.filter(m => m.umpire_id === umpireId);
}

export function getTournamentBySlug(slug: string): Tournament | undefined {
  return mockTournaments.find(t => t.slug === slug);
}

export function getTeamsByTournament(tournamentId: string): Team[] {
  return mockTeams.filter(t => t.tournament_id === tournamentId);
}

export function getUmpireUsers(): User[] {
  return mockUsers.filter(u => u.roles.includes('umpire'));
}

export const mockAuditLogs: any[] = [
  { id: 'log-1', action: 'Tournament "Mumbai Badminton Open 2025" created', category: 'tournament', user_name: 'Rajesh Kumar', details: 'Status set to draft', created_at: new Date(Date.now() - 3600000 * 24 * 10).toISOString() },
  { id: 'log-2', action: 'Event "Men\'s Singles" added', category: 'event', user_name: 'Rajesh Kumar', details: 'Tournament ID: t1, Entry limit: 32', created_at: new Date(Date.now() - 3600000 * 24 * 9).toISOString() },
  { id: 'log-3', action: 'Player Priya Sharma registered', category: 'registration', user_name: 'Priya Sharma', details: 'Registered for Mumbai Badminton Open 2025 (e1)', created_at: new Date(Date.now() - 3600000 * 24 * 8).toISOString() },
  { id: 'log-4', action: 'Player Priya Sharma approved', category: 'registration', user_name: 'Rajesh Kumar', details: 'Approved for Mumbai Badminton Open 2025', created_at: new Date(Date.now() - 3600000 * 5).toISOString() }
];

// ---- Tournament Media ----
export const mockTournamentMedia: TournamentMedia[] = [
  {
    id: 'media-1',
    tournament_id: 't1',
    uploaded_by: 'u1',
    file_url: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1200&q=80',
    caption: 'Mumbai Open 2025 opening ceremony and main court preparation.',
    media_type: 'image',
    created_at: '2025-06-14T10:00:00Z',
  },
  {
    id: 'media-2',
    tournament_id: 't1',
    uploaded_by: 'u1',
    file_url: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1200&q=80',
    caption: 'High-intensity rally during the Men\'s Singles practice sessions.',
    media_type: 'image',
    created_at: '2025-06-14T14:30:00Z',
  },
  {
    id: 'media-3',
    tournament_id: 't1',
    uploaded_by: 'u1',
    file_url: 'https://images.unsplash.com/photo-1613918431208-6752fe4ef70d?w=1200&q=80',
    caption: 'Action shot of a decisive smash from the mixed doubles qualifiers.',
    media_type: 'image',
    created_at: '2025-06-15T09:15:00Z',
  },
  {
    id: 'media-4',
    tournament_id: 't1',
    uploaded_by: 'u1',
    file_url: 'https://images.unsplash.com/photo-1521537634199-673a1e022146?w=1200&q=80',
    caption: 'Match gear setup on standard BWF-approved synthetic court.',
    media_type: 'image',
    created_at: '2025-06-15T16:00:00Z',
  }
];

export function getTournamentMedia(tournamentId: string): TournamentMedia[] {
  return mockTournamentMedia.filter(m => m.tournament_id === tournamentId)
    .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
}

export function uploadTournamentMedia(tournamentId: string, media: Omit<TournamentMedia, 'id' | 'created_at'>): TournamentMedia {
  const newMedia: TournamentMedia = {
    ...media,
    id: `media-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    tournament_id: tournamentId,
    created_at: new Date().toISOString()
  };
  mockTournamentMedia.unshift(newMedia);
  return newMedia;
}

export function deleteTournamentMedia(tournamentId: string, mediaId: string): boolean {
  const index = mockTournamentMedia.findIndex(m => m.id === mediaId && m.tournament_id === tournamentId);
  if (index !== -1) {
    mockTournamentMedia.splice(index, 1);
    return true;
  }
  return false;
}

// ---- Match Comments ----
export const mockMatchComments: MatchComment[] = [
  {
    id: 'comm-1',
    match_id: 'm1',
    user_name: 'Rahul Kumar',
    message: 'What a beautiful serve by Priya! Vikas looks completely off-balance.',
    created_at: new Date(Date.now() - 600000).toISOString()
  },
  {
    id: 'comm-2',
    match_id: 'm1',
    user_name: 'Deepa Menon',
    message: 'Awesome recovery by Vikas! That net chord play was unbelievable.',
    created_at: new Date(Date.now() - 400000).toISOString()
  },
  {
    id: 'comm-3',
    match_id: 'm1',
    user_name: 'Rajesh Kumar',
    message: 'Great rally, Priya leads 14-17 in set 2. This could go to a third set decider!',
    created_at: new Date(Date.now() - 200000).toISOString()
  }
];

export function getMatchComments(matchId: string): MatchComment[] {
  return mockMatchComments.filter(c => c.match_id === matchId)
    .sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());
}

export function postMatchComment(matchId: string, comment: Omit<MatchComment, 'id' | 'created_at'>): MatchComment {
  const newComment: MatchComment = {
    ...comment,
    id: `comm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    match_id: matchId,
    created_at: new Date().toISOString()
  };
  mockMatchComments.push(newComment);
  return newComment;
}

export function deleteMatchComment(matchId: string, commentId: string): boolean {
  const index = mockMatchComments.findIndex(c => c.id === commentId && c.match_id === matchId);
  if (index !== -1) {
    mockMatchComments.splice(index, 1);
    return true;
  }
  return false;
}


