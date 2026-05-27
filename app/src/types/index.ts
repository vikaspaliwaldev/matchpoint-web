// ============================================================
// MatchPoint — Type Definitions
// ============================================================

// ---- Auth & Users ----

export type UserRole = 'admin' | 'player' | 'umpire';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole; // kept for backward compat — represents "primary" role
  roles: UserRole[]; // all assigned roles
  phone?: string;
  avatar?: string;
  created_at: string;
}

// ---- Tournament ----

export type TournamentStatus = 'draft' | 'open' | 'live' | 'completed' | 'cancelled';

export interface MasterEvent {
  id: string;
  name: string;
  category: string;
  scoring_format: ScoringFormat;
  format: EventFormat;
}

export interface Tournament {
  id: string;
  name: string;
  slug: string;
  description: string;
  location: string;
  banner?: string;
  start_date: string;
  end_date: string;
  type: 'individual' | 'team';
  status: TournamentStatus;
  created_by: string;
  created_at: string;
  events?: TournamentEvent[];
  team_size_limit?: number;
  team_tie_events?: string[];
  team_tie_configs?: { event_id: string; name: string; count: number }[];
  bonus_point_margin?: number;
  bonus_point_value?: number;
}

// ---- Event ----

export type EventCategory = string;
export type EventFormat = 'knockout' | 'round_robin' | 'swiss' | 'league' | 'hybrid';
export type ScoringFormat = '11-point' | '15-point' | '21-point';

export interface TournamentEvent {
  id: string;
  tournament_id: string;
  event_name: string;
  category: EventCategory;
  entry_limit: number;
  format: EventFormat;
  registrations_count?: number;
  scoring_format?: ScoringFormat;
}

// ---- Registration ----

export type RegistrationStatus = 'pending' | 'approved' | 'rejected' | 'waitlisted' | 'disqualified';

export interface Registration {
  id: string;
  tournament_id: string;
  event_id: string;
  player_id: string;
  player_name: string;
  player_email: string;
  status: RegistrationStatus;
  registered_at: string;
  seed?: number;
  disqualification_reason?: string;
}

// ---- Team ----

export interface Team {
  id: string;
  name: string;
  tournament_id: string;
  logo_color: string; // hex color for team identity
  captain_id?: string;
  players: string[]; // player user IDs
}

// ---- Match ----

export type MatchStatus = 'scheduled' | 'running' | 'paused' | 'completed';

export interface TeamSubMatch {
  id: string;
  event_type: string;
  player1_names: string[];
  player2_names: string[];
  sets: MatchSet[];
  status: MatchStatus;
  winner_id?: string;
}

export interface Match {
  id: string;
  tournament_id: string;
  event_id: string;
  fixture_round: number;
  fixture_position: number;
  court?: string;
  player1_id: string;
  player1_name: string;
  player2_id: string;
  player2_name: string;
  umpire_id?: string;
  umpire_name?: string;
  scheduled_time?: string;
  actual_start_time?: string;
  actual_end_time?: string;
  duration_seconds?: number;
  status: MatchStatus;
  winner_id?: string;
  sets: MatchSet[];
  sub_matches?: TeamSubMatch[];
}

export interface MatchSet {
  set_number: number;
  player1_score: number;
  player2_score: number;
  is_complete: boolean;
  winner_id?: string;
}

// ---- Audit Log ----

export interface AuditLog {
  id: string;
  action: string;
  category: 'tournament' | 'event' | 'registration' | 'match' | 'team' | 'auth';
  user_id?: string;
  user_name: string;
  details?: string;
  created_at: string;
}

// ---- Fixture ----

export interface FixtureRound {
  round_number: number;
  round_name: string;
  matches: Match[];
}

export interface Fixture {
  id: string;
  event_id: string;
  tournament_id: string;
  format: EventFormat;
  rounds: FixtureRound[];
}

// ---- Dashboard Widgets ----

export interface DashboardStats {
  totalTournaments: number;
  activeTournaments: number;
  totalRegistrations: number;
  totalMatches: number;
  liveMatches: number;
  completedMatches: number;
}
