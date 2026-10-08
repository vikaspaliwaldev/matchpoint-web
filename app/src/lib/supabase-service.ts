// ============================================================
// MatchPoint — Supabase Database Service Layer
// ============================================================
// All database queries are consolidated here.
// Each query dynamically respects `isSupabaseConfigured`.
// - If true: queries the live Supabase PostgreSQL database
// - If false: transparently updates / reads the local Mock Data store
// ============================================================

import { isSupabaseConfigured, supabase } from './supabase';
import * as mock from './mock-data';
import {
  Tournament,
  TournamentEvent,
  Match,
  MatchSet,
  MatchStatus,
  Registration,
  Team,
  User,
  AuditLog,
  MasterEvent,
  TournamentMedia,
  MatchComment,
  MatchPoll,
} from '@/types';

// ============================================================
// Spring Boot REST API Helpers (Dynamic Routing)
// ============================================================

import { API_BASE_URL } from './api-config';
import { registerTeamLogo } from './team-logos';

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('matchpoint_token') : null;
  return {
    'Content-Type': 'application/json',
    'bypass-tunnel-reminder': 'true',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(new DOMException(`API request to ${path} timed out after 45s`, 'TimeoutError'));
  }, 45000); // 45 seconds timeout (safe for cold starts)

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        ...getAuthHeaders(),
        ...options.headers
      }
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      const text = await res.text();
      if (res.status === 502 || res.status === 503 || res.status === 504) {
        if (typeof window !== 'undefined' && window.location.pathname !== '/maintenance') {
          window.location.href = '/maintenance';
        }
      }
      throw new Error(text || `HTTP error ${res.status}`);
    }
    if (res.status === 204) return null as any;
    const text = await res.text();
    if (!text || text.trim() === '') return null as any;
    try {
      return JSON.parse(text);
    } catch (e) {
      return text as any;
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    // Log the network error, but do not force a hard redirect to /maintenance.
    // This allows high-level mock data fallbacks to gracefully take over and keep the app functional.
    if (err.name === 'AbortError' || err.name === 'TimeoutError') {
      console.warn(`API request to ${path} timed out after 45s.`);
    } else {
      console.warn(`API request to ${path} failed:`, err.message || err);
    }
    throw err;
  }
}

// ============================================================
// Stats — Lightweight aggregate counts for landing page
// ============================================================
export async function getStats(): Promise<{ tournaments: number; players: number; matches: number }> {
  if (!isSupabaseConfigured) {
    return {
      tournaments: mock.mockTournaments.length,
      players: mock.mockUsers.filter(u => u.roles.includes('player')).length,
      matches: mock.mockMatches.length,
    };
  }
  try {
    const data = await apiFetch<{ tournaments: number; players: number; matches: number }>('/stats');
    return data;
  } catch (err) {
    console.error('getStats REST API error:', err);
    return { tournaments: 0, players: 0, matches: 0 };
  }
}

export async function logClientActivity(type: string, details?: string, userId?: string, userName?: string): Promise<void> {

  try {
    const payload = {
      user_id: userId || 'GUEST',
      user_name: userName || 'Anonymous Visitor',
      activity_type: type,
      details: details || ''
    };
    const url = userId ? '/activity-logs' : '/public/activity-logs';
    
    await fetch(`${API_BASE_URL}/api/v1${url}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
  } catch (err) {
    // Fail silently for telemetry clickstream tracking
  }
}


// ---- Tournaments ----

export async function getTournaments(): Promise<Tournament[]> {
  if (!isSupabaseConfigured) {
    return mock.mockTournaments;
  }
  try {
    const data = await apiFetch<Tournament[]>('/tournaments');
    data.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
    logClientActivity('PAGE_VIEW', 'Viewed tournaments dashboard');
    return data;
  } catch (err) {
    console.error('getTournaments REST API error, falling back to mock:', err);
    return mock.mockTournaments;
  }
}

export async function getTournamentBySlug(slug: string): Promise<Tournament | undefined> {
  if (!isSupabaseConfigured) {
    return mock.getTournamentBySlug(slug);
  }
  try {
    const list = await getTournaments();
    return list.find(t => t.slug === slug);
  } catch (err) {
    console.error('getTournamentBySlug REST API error, falling back to mock:', err);
    return mock.getTournamentBySlug(slug);
  }
}

export async function getMasterEvents(): Promise<MasterEvent[]> {
  if (!isSupabaseConfigured) {
    return mock.mockMasterEvents;
  }
  try {
    const data = await apiFetch<MasterEvent[]>('/master-events');
    return data;
  } catch (err) {
    console.error('getMasterEvents REST API error, falling back to mock:', err);
    return mock.mockMasterEvents;
  }
}

export async function createMasterEvent(event: MasterEvent): Promise<MasterEvent> {
  if (!isSupabaseConfigured) {
    mock.mockMasterEvents.push(event);
    return event;
  }
  try {
    return await apiFetch<MasterEvent>('/master-events', {
      method: 'POST',
      body: JSON.stringify(event)
    });
  } catch (err) {
    console.error('createMasterEvent REST API error:', err);
    throw err;
  }
}

export async function updateMasterEvent(id: string, event: MasterEvent): Promise<MasterEvent> {
  if (!isSupabaseConfigured) {
    const idx = mock.mockMasterEvents.findIndex(e => e.id === id);
    if (idx !== -1) {
      mock.mockMasterEvents[idx] = { ...event, id };
    }
    return event;
  }
  try {
    return await apiFetch<MasterEvent>(`/master-events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(event)
    });
  } catch (err) {
    console.error('updateMasterEvent REST API error:', err);
    throw err;
  }
}

export async function deleteMasterEvent(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const idx = mock.mockMasterEvents.findIndex(e => e.id === id);
    if (idx !== -1) {
      mock.mockMasterEvents.splice(idx, 1);
    }
    return;
  }
  try {
    await apiFetch<void>(`/master-events/${id}`, {
      method: 'DELETE'
    });
  } catch (err) {
    console.error('deleteMasterEvent REST API error:', err);
    throw err;
  }
}

export async function createTournament(tournament: Tournament, user?: { id: string; name: string } | null): Promise<Tournament> {
  if (!isSupabaseConfigured) {
    mock.mockTournaments.unshift(tournament);
  } else {
    try {
      await apiFetch<Tournament>('/tournaments', {
        method: 'POST',
        body: JSON.stringify(tournament)
      });
      await logClientActivity('CREATE_TOURNAMENT', `Created tournament "${tournament.name}"`, user?.id, user?.name);
    } catch (err) {
      console.error('createTournament REST API error, throwing:', err);
      throw err;
    }
  }

  // Log to Audit Log
  await logAction(
    `Tournament "${tournament.name}" created`,
    'tournament',
    `Type: ${tournament.type}, Roster Limit: ${tournament.team_size_limit || 'N/A'}, Format details: ${tournament.team_tie_configs ? tournament.team_tie_configs.map(c => `${c.name} x${c.count}`).join(', ') : 'Default'}`,
    user || { id: 'u1', name: 'Administrator' }
  );

  return tournament;
}

export async function updateTournamentStatus(id: string, status: Tournament['status']): Promise<void> {
  if (!isSupabaseConfigured) {
    const idx = mock.mockTournaments.findIndex(t => t.id === id);
    if (idx !== -1) {
      mock.mockTournaments[idx].status = status;
    }
    return;
  }
  try {
    const existing = await apiFetch<Tournament>(`/tournaments/${id}`);
    existing.status = status;
    await apiFetch<Tournament>(`/tournaments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(existing)
    });
    await logClientActivity('UPDATE_TOURNAMENT_STATUS', `Set tournament status to ${status} for ID: ${id}`);
  } catch (err) {
    console.error('updateTournamentStatus REST API error, throwing:', err);
    throw err;
  }
}

// ---- Events ----

export async function getEventsByTournament(tournamentId: string): Promise<TournamentEvent[]> {
  if (!isSupabaseConfigured) {
    return mock.getEventsByTournament(tournamentId);
  }
  try {
    const data = await apiFetch<TournamentEvent[]>(`/events/tournament/${tournamentId}`);
    return data;
  } catch (err) {
    console.error('getEventsByTournament REST API error, falling back to mock:', err);
    return mock.getEventsByTournament(tournamentId);
  }
}

export async function createEvent(event: TournamentEvent, user?: { id: string; name: string } | null): Promise<TournamentEvent> {
  if (!isSupabaseConfigured) {
    mock.mockEvents.push(event);
  } else {
    try {
      await apiFetch<TournamentEvent>('/events', {
        method: 'POST',
        body: JSON.stringify(event)
      });
      await logClientActivity('CREATE_EVENT', `Created event "${event.event_name}" under tournament: ${event.tournament_id}`, user?.id, user?.name);
    } catch (err) {
      console.error('createEvent REST API error, throwing:', err);
      throw err;
    }
  }

  // Log to Audit Log
  await logAction(
    `Event "${event.event_name}" created`,
    'event',
    `Format: ${event.format}, Category: ${event.category}, Limit: ${event.entry_limit}`,
    user || { id: 'u1', name: 'Administrator' }
  );

  return event;
}

// ---- Registrations ----

export async function getRegistrationsByEvent(eventId: string): Promise<Registration[]> {
  if (!isSupabaseConfigured) {
    return mock.getRegistrationsByEvent(eventId);
  }
  try {
    const data = await apiFetch<Registration[]>(`/registrations/event/${eventId}`);
    return data;
  } catch (err) {
    console.error('getRegistrationsByEvent REST API error, falling back to mock:', err);
    return mock.getRegistrationsByEvent(eventId);
  }
}

export async function getRegistrationsByTournament(tournamentId: string): Promise<Registration[]> {
  if (!isSupabaseConfigured) {
    return mock.mockRegistrations.filter(r => r.tournament_id === tournamentId);
  }
  try {
    const data = await apiFetch<Registration[]>(`/registrations/tournament/${tournamentId}`);
    return data;
  } catch (err) {
    console.error('getRegistrationsByTournament REST API error, falling back to mock:', err);
    return mock.mockRegistrations.filter(r => r.tournament_id === tournamentId);
  }
}

export async function createRegistration(reg: Registration): Promise<Registration> {
  if (!isSupabaseConfigured) {
    mock.mockRegistrations.push(reg);
    return reg;
  }
  try {
    const data = await apiFetch<Registration>('/registrations', {
      method: 'POST',
      body: JSON.stringify(reg)
    });
    await logClientActivity('CREATE_REGISTRATION', `Registered player ${reg.player_name || (reg as any).playerName} for event: ${reg.event_id || (reg as any).eventId}`);
    return data;
  } catch (err) {
    console.error('createRegistration REST API error, throwing:', err);
    throw err;
  }
}

export async function saveRegistrationsBatch(regs: Registration[]): Promise<Registration[]> {
  const results: Registration[] = [];
  for (const reg of regs) {
    const saved = await createRegistration(reg);
    results.push(saved);
  }
  return results;
}

export async function updateRegistrationStatus(
  regId: string,
  status: Registration['status'],
  seed?: number | null,
  user?: { id: string; name: string } | null
): Promise<void> {
  let playerName = 'Player';

  if (!isSupabaseConfigured) {
    const idx = mock.mockRegistrations.findIndex(r => r.id === regId);
    if (idx !== -1) {
      mock.mockRegistrations[idx].status = status;
      if (seed !== undefined) mock.mockRegistrations[idx].seed = seed ?? undefined;
      playerName = mock.mockRegistrations[idx].player_name;
    }
  } else {
    try {
      const existing = await apiFetch<Registration>(`/registrations/${regId}`);
      existing.status = status;
      if (seed !== undefined) existing.seed = seed ?? undefined;
      playerName = existing.player_name || (existing as any).playerName || 'Player';

      await apiFetch<Registration>(`/registrations/${regId}`, {
        method: 'PUT',
        body: JSON.stringify(existing)
      });
      await logClientActivity('UPDATE_REGISTRATION_STATUS', `Set registration status to ${status} for ID: ${regId}`, user?.id, user?.name);
    } catch (err) {
      console.error('updateRegistrationStatus REST API error, throwing:', err);
      throw err;
    }
  }

  // Log to System Audit Logs
  await logAction(
    `Registration for "${playerName}" ${status}`,
    'registration',
    `Registration ID: ${regId}, New Status: ${status}${seed !== undefined && seed !== null ? `, Seed: ${seed}` : ''}`,
  );
}

export async function mockPayRegistration(regId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const idx = mock.mockRegistrations.findIndex(r => r.id === regId);
    if (idx !== -1) {
      mock.mockRegistrations[idx].payment_status = 'paid';
      mock.mockRegistrations[idx].status = 'approved';
      mock.mockRegistrations[idx].payment_method = 'mock';
    }
  }
}

export async function recordPaymentCollection(
  regId: string,
  paymentDetails: {
    amount: number;
    payment_method: 'cash' | 'upi' | 'bank_transfer' | 'cheque' | 'other' | string;
    reference_id?: string;
    notes?: string;
    receipt_url?: string;
  },
  adminUser?: { id: string; name: string } | null
): Promise<Registration> {
  if (!isSupabaseConfigured) {
    const idx = mock.mockRegistrations.findIndex(r => r.id === regId);
    if (idx !== -1) {
      mock.mockRegistrations[idx] = {
        ...mock.mockRegistrations[idx],
        payment_status: 'paid',
        status: 'approved',
        payment_method: paymentDetails.payment_method as any,
        payment_reference: paymentDetails.reference_id,
        notes: paymentDetails.notes || mock.mockRegistrations[idx].notes,
      };
      return mock.mockRegistrations[idx];
    }
    throw new Error('Registration not found');
  }

  try {
    const existing = await apiFetch<Registration>(`/registrations/${regId}`);
    const updated = {
      ...existing,
      payment_status: 'paid',
      status: 'approved',
      payment_method: paymentDetails.payment_method,
      payment_reference: paymentDetails.reference_id,
      notes: paymentDetails.notes,
    };
    const res = await apiFetch<Registration>(`/registrations/${regId}`, {
      method: 'PUT',
      body: JSON.stringify(updated),
    });
    return res;
  } catch (err) {
    console.error('recordPaymentCollection error:', err);
    throw err;
  }
}

export async function deleteRegistration(
  regId: string,
  user?: { id: string; name: string } | null
): Promise<void> {
  if (!isSupabaseConfigured) {
    const idx = mock.mockRegistrations.findIndex(r => r.id === regId);
    if (idx !== -1) {
      mock.mockRegistrations.splice(idx, 1);
    }
    return;
  }
  try {
    await apiFetch(`/registrations/${regId}`, {
      method: 'DELETE'
    });
    await logClientActivity('WITHDRAW_REGISTRATION', `Withdrew registration ID: ${regId}`, user?.id, user?.name);
  } catch (err: any) {
    console.error('deleteRegistration REST API error, throwing:', err);
    throw err;
  }
}

// ---- Teams ----

export async function getAllTeams(): Promise<Team[]> {
  if (!isSupabaseConfigured) {
    return mock.mockTeams;
  }
  try {
    const data = await apiFetch<Team[]>('/teams');
    return data;
  } catch (err) {
    console.error('getAllTeams REST API error, falling back to mock:', err);
    return mock.mockTeams;
  }
}

export async function getTeamsByTournament(tournamentId: string): Promise<Team[]> {
  if (!isSupabaseConfigured) {
    const list = mock.getTeamsByTournament(tournamentId);
    list.forEach(t => {
      if (t.logo_url) registerTeamLogo(t.name, t.logo_url);
    });
    return list;
  }
  try {
    const data = await apiFetch<Team[]>(`/teams/tournament/${tournamentId}`);
    data.forEach(t => {
      if (t.logo_url) registerTeamLogo(t.name, t.logo_url);
    });
    return data;
  } catch (err) {
    console.error('getTeamsByTournament REST API error, falling back to mock:', err);
    const list = mock.getTeamsByTournament(tournamentId);
    list.forEach(t => {
      if (t.logo_url) registerTeamLogo(t.name, t.logo_url);
    });
    return list;
  }
}

export async function createTeam(team: Team, user?: { id: string; name: string } | null): Promise<Team> {
  if (team.logo_url) {
    registerTeamLogo(team.name, team.logo_url);
  }
  if (!isSupabaseConfigured) {
    mock.mockTeams.push(team);
    await logAction(
      `Team "${team.name}" created`,
      'team',
      `Tournament ID: ${team.tournament_id}`,
      user
    );
    return team;
  }
  try {
    const data = await apiFetch<Team>('/teams', {
      method: 'POST',
      body: JSON.stringify(team)
    });
    if (data.logo_url) {
      registerTeamLogo(data.name, data.logo_url);
    }
    await logClientActivity('CREATE_TEAM', `Created team "${team.name}" for tournament: ${team.tournament_id}`);
    await logAction(
      `Team "${team.name}" created`,
      'team',
      `Tournament ID: ${team.tournament_id}`,
      user
    );
    return data;
  } catch (err) {
    console.error('createTeam REST API error, throwing:', err);
    throw err;
  }
}

export async function updateTeamRoster(
  teamId: string,
  players: string[],
  captainId?: string | null,
  user?: { id: string; name: string } | null
): Promise<void> {
  let teamName = 'Team';
  if (!isSupabaseConfigured) {
    const idx = mock.mockTeams.findIndex(t => t.id === teamId);
    if (idx !== -1) {
      mock.mockTeams[idx].players = players;
      if (captainId !== undefined) mock.mockTeams[idx].captain_id = captainId ?? undefined;
      teamName = mock.mockTeams[idx].name;
    }
  } else {
    try {
      const existing = await apiFetch<any>(`/teams/${teamId}`);
      existing.players = players;
      if (captainId !== undefined) existing.captain_id = captainId ?? undefined;
      teamName = existing.name || 'Team';
      await apiFetch<Team>(`/teams/${teamId}`, {
        method: 'PUT',
        body: JSON.stringify(existing)
      });
      await logClientActivity('UPDATE_TEAM_ROSTER', `Updated roster for team ID: ${teamId}`);
    } catch (err) {
      console.error('updateTeamRoster REST API error, throwing:', err);
      throw err;
    }
  }

  await logAction(
    `Roster for team "${teamName}" updated`,
    'team',
    `Team ID: ${teamId}, Total Players: ${players.length}${captainId ? `, Captain ID: ${captainId}` : ''}`,
    user
  );
}

// ---- Matches ----

function mapBackendMatchToMatch(m: any): Match {
  if (!m) return m;
  return {
    id: m.id,
    tournament_id: m.tournament_id || m.tournamentId,
    event_id: m.event_id || m.eventId,
    fixture_round: m.fixture_round !== undefined ? m.fixture_round : m.fixtureRound,
    fixture_position: m.fixture_position !== undefined ? m.fixture_position : m.fixturePosition,
    court: m.court,
    player1_id: m.player1_id || m.player1Id,
    player1_name: m.player1_name || m.player1Name,
    player2_id: m.player2_id || m.player2Id,
    player2_name: m.player2_name || m.player2Name,
    umpire_id: m.umpire_id || m.umpireId,
    umpire_name: m.umpire_name || m.umpireName,
    scheduled_time: m.scheduled_time || m.scheduledTime,
    actual_start_time: m.actual_start_time || m.actualStartTime,
    actual_end_time: m.actual_end_time || m.actualEndTime,
    duration_seconds: m.duration_seconds !== undefined ? m.duration_seconds : m.durationSeconds,
    status: m.status,
    winner_id: m.winner_id || m.winnerId,
    sets: (m.sets || []).map((s: any) => ({
      set_number: s.set_number !== undefined ? s.set_number : s.setNumber,
      player1_score: s.player1_score !== undefined ? s.player1_score : s.player1Score,
      player2_score: s.player2_score !== undefined ? s.player2_score : s.player2Score,
      is_complete: s.is_complete !== undefined ? s.is_complete : s.isComplete || s.complete || false,
      winner_id: s.winner_id || s.winnerId,
    })),
    sub_matches: (m.sub_matches || m.subMatches || []).map((sm: any) => ({
      id: sm.id,
      event_type: sm.event_type || sm.eventType,
      player1_names: sm.player1_names || sm.player1Names || [],
      player2_names: sm.player2_names || sm.player2Names || [],
      sets: (sm.sets || []).map((s: any) => ({
        set_number: s.set_number !== undefined ? s.set_number : s.setNumber,
        player1_score: s.player1_score !== undefined ? s.player1_score : s.player1Score,
        player2_score: s.player2_score !== undefined ? s.player2_score : s.player2Score,
        is_complete: s.is_complete !== undefined ? s.is_complete : s.isComplete || s.complete || false,
        winner_id: s.winner_id || s.winnerId,
      })),
      status: sm.status,
      winner_id: sm.winner_id || sm.winnerId,
    })),
    round_name: m.round_name || m.roundName,
    is_adhoc: m.is_adhoc !== undefined ? m.is_adhoc : (m.isAdhoc !== undefined ? m.isAdhoc : m.adhoc),
    adhoc_type: m.adhoc_type || m.adhocType || m.adhoc_type,
    max_viewers: m.max_viewers !== undefined ? m.max_viewers : (m.maxViewers !== undefined ? m.maxViewers : 0),
    sport: m.sport || 'badminton',
    sport_metadata: m.sport_metadata || m.sportMetadata || {},
  };
}

export function sortMatchesList(matches: Match[]): Match[] {
  return [...matches].sort((a, b) => {
    const isLiveA = a.status === 'running' || a.status === 'paused';
    const isLiveB = b.status === 'running' || b.status === 'paused';

    if (isLiveA && !isLiveB) return -1;
    if (!isLiveA && isLiveB) return 1;
    if (isLiveA && isLiveB) {
      const timeA = a.scheduled_time ? new Date(a.scheduled_time).getTime() : 0;
      const timeB = b.scheduled_time ? new Date(b.scheduled_time).getTime() : 0;
      return timeA - timeB;
    }

    const isScheduledA = a.status === 'scheduled';
    const isScheduledB = b.status === 'scheduled';

    if (isScheduledA && !isScheduledB) return -1;
    if (!isScheduledA && isScheduledB) return 1;

    if (isScheduledA && isScheduledB) {
      const timeA = a.scheduled_time ? new Date(a.scheduled_time).getTime() : 0;
      const timeB = b.scheduled_time ? new Date(b.scheduled_time).getTime() : 0;
      return timeA - timeB;
    }

    const timeA = a.scheduled_time ? new Date(a.scheduled_time).getTime() : 0;
    const timeB = b.scheduled_time ? new Date(b.scheduled_time).getTime() : 0;
    return timeB - timeA;
  });
}

export async function getMatchesByEvent(eventId: string): Promise<Match[]> {
  if (!isSupabaseConfigured) {
    return mock.getMatchesByEvent(eventId);
  }
  try {
    const data = await apiFetch<any[]>(`/matches/event/${eventId}`);
    const mapped = data.map(mapBackendMatchToMatch);
    mapped.sort((a, b) => {
      const aRound = a.fixture_round || 0;
      const bRound = b.fixture_round || 0;
      if (aRound !== bRound) {
        return aRound - bRound;
      }
      const aPos = a.fixture_position || 0;
      const bPos = b.fixture_position || 0;
      return aPos - bPos;
    });
    return mapped;
  } catch (err) {
    console.error('getMatchesByEvent REST API error, falling back to mock:', err);
    return mock.getMatchesByEvent(eventId);
  }
}

export async function getMatchesByTournament(tournamentId: string): Promise<Match[]> {
  if (!isSupabaseConfigured) {
    return sortMatchesList(mock.getMatchesByTournament(tournamentId));
  }
  try {
    const data = await apiFetch<any[]>(`/matches/tournament/${tournamentId}`);
    const mapped = data.map(mapBackendMatchToMatch);
    return sortMatchesList(mapped);
  } catch (err) {
    console.error('getMatchesByTournament REST API error, falling back to mock:', err);
    return sortMatchesList(mock.getMatchesByTournament(tournamentId));
  }
}

export async function getMatches(): Promise<Match[]> {
  if (!isSupabaseConfigured) {
    return sortMatchesList(mock.mockMatches);
  }
  try {
    const data = await apiFetch<any[]>('/matches');
    const mapped = data.map(mapBackendMatchToMatch);
    return sortMatchesList(mapped);
  } catch (err) {
    console.error('getMatches REST API error, falling back to mock:', err);
    return sortMatchesList(mock.mockMatches);
  }
}

export async function getLiveMatchesFromApi(): Promise<Match[]> {
  if (!isSupabaseConfigured) {
    return sortMatchesList(mock.mockMatches.filter(m => m.status === 'running' || m.status === 'paused'));
  }
  try {
    const data = await apiFetch<any[]>('/matches/live');
    const mapped = data.map(mapBackendMatchToMatch);
    return sortMatchesList(mapped);
  } catch (err) {
    console.error('getLiveMatchesFromApi error, falling back to mock:', err);
    return sortMatchesList(mock.mockMatches.filter(m => m.status === 'running' || m.status === 'paused'));
  }
}

export async function saveMatchesBatch(matches: Match[]): Promise<void> {
  if (!isSupabaseConfigured) {
    if (matches.length > 0) {
      const eventId = matches[0].event_id || (matches[0] as any).eventId;
      const remaining = mock.mockMatches.filter(m => m.event_id !== eventId && (m as any).eventId !== eventId);
      mock.mockMatches.length = 0;
      mock.mockMatches.push(...remaining, ...matches);
    }
    return;
  }

  if (matches.length === 0) return;
  try {
    const backendMatches = matches.map(m => ({
      id: m.id,
      tournament_id: m.tournament_id || (m as any).tournamentId,
      event_id: m.event_id || (m as any).eventId,
      fixture_round: m.fixture_round !== undefined ? m.fixture_round : (m as any).fixtureRound,
      fixture_position: m.fixture_position !== undefined ? m.fixture_position : (m as any).fixturePosition,
      court: m.court,
      player1_id: (m.player1_id && m.player1_id !== 'BYE') ? m.player1_id : ((m as any).player1Id && (m as any).player1Id !== 'BYE') ? (m as any).player1Id : null,
      player1_name: m.player1_name || (m as any).player1Name,
      player2_id: (m.player2_id && m.player2_id !== 'BYE') ? m.player2_id : ((m as any).player2Id && (m as any).player2Id !== 'BYE') ? (m as any).player2Id : null,
      player2_name: m.player2_name || (m as any).player2Name,
      umpire_id: m.umpire_id || (m as any).umpireId,
      umpire_name: m.umpire_name || (m as any).umpireName,
      scheduled_time: m.scheduled_time || (m as any).scheduledTime,
      actual_start_time: m.actual_start_time || (m as any).actualStartTime,
      actual_end_time: m.actual_end_time || (m as any).actualEndTime,
      duration_seconds: m.duration_seconds !== undefined ? m.duration_seconds : (m as any).durationSeconds,
      status: m.status,
      winner_id: m.winner_id || (m as any).winnerId,
      sets: m.sets,
      sub_matches: m.sub_matches || (m as any).subMatches,
      round_name: m.round_name || (m as any).roundName,
      sport: m.sport || 'badminton',
      sport_metadata: m.sport_metadata || (m as any).sportMetadata || {},
    }));

    await apiFetch('/matches/batch', {
      method: 'POST',
      body: JSON.stringify(backendMatches)
    });
  } catch (err) {
    console.error('saveMatchesBatch REST API error:', err);
    throw err;
  }
}

export async function createMatch(match: Match): Promise<Match> {
  if (!isSupabaseConfigured) {
    mock.mockMatches.push(match);
    return match;
  }
  try {
    const data = await apiFetch<any>('/matches', {
      method: 'POST',
      body: JSON.stringify(match)
    });
    return mapBackendMatchToMatch(data);
  } catch (err) {
    console.error('createMatch REST API error:', err);
    throw err;
  }
}

export async function updateMatchScore(
  matchId: string,
  sets: MatchSet[],
  status: MatchStatus,
  winnerId?: string | null,
  actualStartTime?: string | null,
  actualEndTime?: string | null,
  court?: string | null,
  subMatches?: Match['sub_matches'],
  durationSeconds?: number | null,
  sport?: string | null,
  sportMetadata?: any | null
): Promise<void> {
  if (!isSupabaseConfigured) {
    const idx = mock.mockMatches.findIndex(m => m.id === matchId);
    if (idx !== -1) {
      mock.mockMatches[idx] = {
        ...mock.mockMatches[idx],
        sets,
        status,
        winner_id: winnerId || undefined,
        actual_start_time: actualStartTime || undefined,
        actual_end_time: actualEndTime || undefined,
        court: court || undefined,
        sub_matches: subMatches || mock.mockMatches[idx].sub_matches,
        duration_seconds: durationSeconds || undefined,
        sport: sport || mock.mockMatches[idx].sport,
        sport_metadata: sportMetadata || mock.mockMatches[idx].sport_metadata,
      };
    }
    return;
  }

  try {
    const existing = await apiFetch<any>(`/matches/${matchId}`);
    
    existing.sets = sets;
    existing.status = status;
    existing.winner_id = winnerId || null;
    if (actualStartTime !== undefined) existing.actual_start_time = actualStartTime;
    if (actualEndTime !== undefined) existing.actual_end_time = actualEndTime;
    if (court !== undefined) existing.court = court;
    if (subMatches !== undefined) existing.sub_matches = subMatches;
    if (durationSeconds !== undefined) existing.duration_seconds = durationSeconds;
    if (sport !== undefined) existing.sport = sport;
    if (sportMetadata !== undefined) existing.sport_metadata = sportMetadata;

    await apiFetch(`/matches/${matchId}`, {
      method: 'PUT',
      body: JSON.stringify(existing)
    });
  } catch (err) {
    console.error('updateMatchScore REST API error:', err);
    throw err;
  }
}

export async function resetMatchByAdmin(matchId: string, user?: { id?: string; name: string } | null): Promise<void> {
  const initialSets: MatchSet[] = [{ set_number: 1, player1_score: 0, player2_score: 0, is_complete: false }];
  
  if (!isSupabaseConfigured) {
    const idx = mock.mockMatches.findIndex(m => m.id === matchId);
    if (idx !== -1) {
      mock.mockMatches[idx] = {
        ...mock.mockMatches[idx],
        sets: initialSets,
        status: 'scheduled',
        winner_id: undefined,
        actual_start_time: undefined,
        actual_end_time: undefined,
        duration_seconds: 0,
        sport_metadata: {},
      };
    }
  } else {
    try {
      const existing = await apiFetch<any>(`/matches/${matchId}`);
      existing.sets = initialSets;
      existing.status = 'scheduled';
      existing.winner_id = null;
      existing.actual_start_time = null;
      existing.actual_end_time = null;
      existing.duration_seconds = 0;
      existing.sport_metadata = {};

      await apiFetch(`/matches/${matchId}`, {
        method: 'PUT',
        body: JSON.stringify(existing)
      });
    } catch (err) {
      console.error('resetMatchByAdmin REST API error:', err);
      throw err;
    }
  }

  // Audit log
  try {
    await logAction(
      'Match Reset by Admin',
      'match',
      `Match ID '${matchId}' was completely reset to scheduled state with cleared scores by admin.`,
      user ? { id: user.id || 'admin', name: user.name } : null
    );
  } catch (auditErr) {
    console.warn('Failed to record match reset audit log:', auditErr);
  }
}

export async function deleteMatch(matchId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const idx = mock.mockMatches.findIndex(m => m.id === matchId);
    if (idx !== -1) {
      mock.mockMatches.splice(idx, 1);
    }
    return;
  }
  try {
    await apiFetch(`/matches/${matchId}`, {
      method: 'DELETE'
    });
  } catch (err) {
    console.error(`Failed to delete match ${matchId}:`, err);
    throw err;
  }
}

export async function updateMatchPlayers(
  matchId: string,
  player1Name: string,
  player2Name: string,
  player1Id?: string,
  player2Id?: string
): Promise<void> {
  if (!isSupabaseConfigured) {
    const idx = mock.mockMatches.findIndex(m => m.id === matchId);
    if (idx !== -1) {
      mock.mockMatches[idx].player1_name = player1Name;
      mock.mockMatches[idx].player2_name = player2Name;
      if (player1Id !== undefined) mock.mockMatches[idx].player1_id = player1Id;
      if (player2Id !== undefined) mock.mockMatches[idx].player2_id = player2Id;
    }
    return;
  }
  try {
    const existing = await apiFetch<any>(`/matches/${matchId}`);
    existing.player1_name = player1Name;
    existing.player2_name = player2Name;
    existing.player1Name = player1Name;
    existing.player2Name = player2Name;
    if (player1Id !== undefined) {
      existing.player1_id = player1Id;
      existing.player1Id = player1Id;
    }
    if (player2Id !== undefined) {
      existing.player2_id = player2Id;
      existing.player2Id = player2Id;
    }

    await apiFetch(`/matches/${matchId}`, {
      method: 'PUT',
      body: JSON.stringify(existing)
    });
  } catch (err) {
    console.error('updateMatchPlayers REST API error:', err);
    throw err;
  }
}

export async function assignUmpireToMatch(
  matchId: string,
  umpireId: string | null,
  umpireName: string | null
): Promise<void> {
  if (!isSupabaseConfigured) {
    const idx = mock.mockMatches.findIndex(m => m.id === matchId);
    if (idx !== -1) {
      mock.mockMatches[idx] = {
        ...mock.mockMatches[idx],
        umpire_id: umpireId || undefined,
        umpire_name: umpireName || undefined,
      };
    }
    return;
  }

  try {
    const existing = await apiFetch<any>(`/matches/${matchId}`);
    existing.umpire_id = umpireId;
    existing.umpire_name = umpireName;

    await apiFetch(`/matches/${matchId}`, {
      method: 'PUT',
      body: JSON.stringify(existing)
    });
  } catch (err) {
    console.error('assignUmpireToMatch REST API error:', err);
    throw err;
  }
}

// ---- Profiles / Users ----

export async function getUmpireUsers(): Promise<User[]> {
  if (!isSupabaseConfigured) {
    return mock.getUmpireUsers();
  }
  try {
    const data = await apiFetch<any[]>('/profiles');
    const users = data.map(p => ({
      id: p.id,
      email: p.email,
      name: p.name,
      phone: p.phone,
      roles: p.roles || [],
      role: p.roles && p.roles.includes('admin') ? 'admin' : (p.roles && p.roles.includes('umpire') ? 'umpire' : 'player'),
      avatar: p.avatar,
      age: p.age,
      gender: p.gender,
      created_at: p.createdAt || p.created_at,
    })) as User[];
    return users.filter(u => u.roles.includes('umpire'));
  } catch (err) {
    console.error('getUmpireUsers REST API error, falling back to mock:', err);
    return mock.getUmpireUsers();
  }
}

export async function getUmpireMatches(umpireId: string): Promise<Match[]> {
  if (!isSupabaseConfigured) {
    return mock.getUmpireMatches(umpireId);
  }
  try {
    const data = await apiFetch<any[]>(`/matches/umpire/${umpireId}`);
    return data.map(mapBackendMatchToMatch);
  } catch (err) {
    console.error('getUmpireMatches REST API error, falling back to mock:', err);
    return mock.getUmpireMatches(umpireId);
  }
}

export async function getPlayers(): Promise<User[]> {
  if (!isSupabaseConfigured) {
    return mock.mockUsers.filter(u => u.roles.includes('player'));
  }
  try {
    const data = await apiFetch<any[]>('/profiles');
    const users = data.map(p => ({
      id: p.id,
      email: p.email,
      name: p.name,
      phone: p.phone,
      roles: p.roles || [],
      role: p.roles && p.roles.includes('admin') ? 'admin' : (p.roles && p.roles.includes('umpire') ? 'umpire' : 'player'),
      avatar: p.avatar,
      age: p.age,
      gender: p.gender,
      created_at: p.createdAt || p.created_at,
    })) as User[];
    return users.filter(u => u.roles.includes('player'));
  } catch (err) {
    console.error('getPlayers REST API error, falling back to mock:', err);
    return mock.mockUsers.filter(u => u.roles.includes('player'));
  }
}

export async function updatePlayerProfile(id: string, profile: Partial<User> & { date_of_birth?: string }): Promise<User> {
  if (!isSupabaseConfigured) {
    const idx = mock.mockUsers.findIndex(u => u.id === id);
    if (idx !== -1) {
      mock.mockUsers[idx] = { ...mock.mockUsers[idx], ...profile };
      return mock.mockUsers[idx];
    }
    throw new Error('User profile not found in mock data');
  }
  try {
    const payload = { ...profile };

    const data = await apiFetch<any>(`/profiles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      phone: data.phone,
      roles: data.roles || [],
      role: data.roles && data.roles.includes('system_admin') ? 'system_admin' : (data.roles && data.roles.includes('admin') ? 'admin' : (data.roles && data.roles.includes('umpire') ? 'umpire' : 'player')),
      avatar: data.avatar,
      age: data.age,
      gender: data.gender,
      date_of_birth: data.dateOfBirth || data.date_of_birth,
      created_at: data.createdAt || data.created_at,
    } as User;
  } catch (err) {
    console.error('updatePlayerProfile REST API error:', err);
    throw err;
  }
}

export async function getAllProfiles(): Promise<User[]> {
  if (!isSupabaseConfigured) {
    return mock.mockUsers;
  }
  try {
    const data = await apiFetch<any[]>('/profiles');
    return data.map(p => ({
      id: p.id,
      email: p.email,
      name: p.name,
      phone: p.phone,
      roles: p.roles || [],
      role: p.roles && p.roles.includes('admin') ? 'admin' : (p.roles && p.roles.includes('umpire') ? 'umpire' : 'player'),
      avatar: p.avatar,
      age: p.age,
      gender: p.gender,
      date_of_birth: p.dateOfBirth || p.date_of_birth,
      created_at: p.createdAt || p.created_at,
    })) as User[];
  } catch (err) {
    console.error('getAllProfiles REST API error, falling back to mock:', err);
    return mock.mockUsers;
  }
}

export async function updateUserRoles(id: string, roles: string[]): Promise<User> {
  if (!isSupabaseConfigured) {
    const idx = mock.mockUsers.findIndex(u => u.id === id);
    if (idx !== -1) {
      mock.mockUsers[idx].roles = roles as any;
      mock.mockUsers[idx].role = roles.includes('admin') ? 'admin' : (roles.includes('umpire') ? 'umpire' : 'player');
      return mock.mockUsers[idx];
    }
    throw new Error('User not found in mock data');
  }
  try {
    const data = await apiFetch<any>(`/profiles/${id}/roles`, {
      method: 'PUT',
      body: JSON.stringify(roles)
    });
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      phone: data.phone,
      roles: data.roles || [],
      role: data.roles && data.roles.includes('admin') ? 'admin' : (data.roles && data.roles.includes('umpire') ? 'umpire' : 'player'),
      avatar: data.avatar,
      age: data.age,
      gender: data.gender,
      date_of_birth: data.dateOfBirth || data.date_of_birth,
      created_at: data.createdAt || data.created_at,
    } as User;
  } catch (err) {
    console.error('updateUserRoles REST API error:', err);
    throw err;
  }
}

export async function getPlayerRegistrations(playerId: string): Promise<Registration[]> {
  if (!isSupabaseConfigured) {
    return mock.getPlayerRegistrations(playerId);
  }
  try {
    const data = await apiFetch<Registration[]>(`/registrations/player/${playerId}`);
    return data;
  } catch (err) {
    console.error('getPlayerRegistrations REST API error, falling back to mock:', err);
    return mock.getPlayerRegistrations(playerId);
  }
}

export async function getUpcomingMatches(playerId: string): Promise<Match[]> {
  if (!isSupabaseConfigured) {
    return mock.getUpcomingMatches(playerId);
  }
  try {
    const data = await apiFetch<any[]>(`/matches/player/${playerId}`);
    return data.map(mapBackendMatchToMatch).filter(m => {
      const stat = m.status;
      return ['scheduled', 'running'].includes(stat);
    });
  } catch (err) {
    console.error('getUpcomingMatches REST API error, falling back to mock:', err);
    return mock.getUpcomingMatches(playerId);
  }
}

export async function getEvents(): Promise<TournamentEvent[]> {
  if (!isSupabaseConfigured) {
    return mock.mockEvents;
  }
  try {
    const data = await apiFetch<TournamentEvent[]>('/events');
    return data;
  } catch (err) {
    console.error('getEvents REST API error, falling back to mock:', err);
    return mock.mockEvents;
  }
}

export async function getRegistrations(): Promise<Registration[]> {
  if (!isSupabaseConfigured) {
    return mock.mockRegistrations;
  }
  try {
    const data = await apiFetch<Registration[]>('/registrations');
    data.sort((a, b) => {
      const aTime = a.registered_at ? new Date(a.registered_at).getTime() : 0;
      const bTime = b.registered_at ? new Date(b.registered_at).getTime() : 0;
      return bTime - aTime;
    });
    return data;
  } catch (err) {
    console.error('getRegistrations REST API error, falling back to mock:', err);
    return mock.mockRegistrations;
  }
}

export async function logAction(
  action: string,
  category: AuditLog['category'],
  details?: string,
  user?: { id: string; name: string } | null
): Promise<void> {
  const logId = `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const logUser = user || { id: 'system', name: 'System / Guest' };
  
  const logEntry: AuditLog = {
    id: logId,
    action,
    category,
    user_id: (logUser.id && logUser.id.startsWith('u-')) ? logUser.id : undefined,
    user_name: logUser.name,
    details: details || '',
    created_at: new Date().toISOString(),
  };

  if (!isSupabaseConfigured) {
    mock.mockAuditLogs.unshift(logEntry);
    return;
  }

  try {
    const backendLog = {
      id: logEntry.id,
      action: logEntry.action,
      category: logEntry.category,
      user_id: logEntry.user_id,
      user_name: logEntry.user_name,
      details: logEntry.details,
      created_at: logEntry.created_at
    };

    await apiFetch('/audit-logs', {
      method: 'POST',
      body: JSON.stringify(backendLog)
    });
  } catch (err) {
    console.error('Failed to save audit log via REST API:', err);
  }
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  if (!isSupabaseConfigured) {
    return mock.mockAuditLogs;
  }
  try {
    const data = await apiFetch<any[]>('/audit-logs');
    return data.map(log => ({
      id: log.id,
      action: log.action,
      category: log.category,
      user_id: log.userId || log.user_id,
      user_name: log.userName || log.user_name || 'System',
      details: log.details,
      created_at: log.createdAt || log.created_at || new Date().toISOString()
    }));
  } catch (err) {
    console.error('getAuditLogs REST API error, falling back to mock:', err);
    return mock.mockAuditLogs;
  }
}

export async function updateTeam(team: Team, user?: { id: string; name: string } | null): Promise<Team> {
  if (team.logo_url) {
    registerTeamLogo(team.name, team.logo_url);
  }
  if (!isSupabaseConfigured) {
    const idx = mock.mockTeams.findIndex(t => t.id === team.id);
    if (idx !== -1) {
      mock.mockTeams[idx] = { ...mock.mockTeams[idx], ...team };
    }
  } else {
    try {
      await apiFetch<Team>(`/teams/${team.id}`, {
        method: 'PUT',
        body: JSON.stringify(team)
      });
      await logClientActivity('UPDATE_TEAM', `Updated team "${team.name}"`);
    } catch (err) {
      console.error('updateTeam REST API error, throwing:', err);
      throw err;
    }
  }

  await logAction(
    `Team "${team.name}" details updated`,
    'team',
    `Updated team profile and logo for "${team.name}"`,
    user
  );
  return team;
}

export async function deleteTeam(teamId: string, teamName?: string, user?: { id: string; name: string } | null): Promise<void> {
  if (!isSupabaseConfigured) {
    const idx = mock.mockTeams.findIndex(t => t.id === teamId);
    if (idx !== -1) {
      mock.mockTeams.splice(idx, 1);
    }
  } else {
    try {
      await apiFetch(`/teams/${teamId}`, {
        method: 'DELETE'
      });
      await logClientActivity('DELETE_TEAM', `Deleted team ID: ${teamId}`);
    } catch (err) {
      console.error('deleteTeam REST API error, throwing:', err);
      throw err;
    }
  }

  await logAction(
    `Team "${teamName || teamId}" deleted`,
    'team',
    `Removed team ID: ${teamId}`,
    user
  );
}

export async function getLoginLogs(): Promise<any[]> {
  if (!isSupabaseConfigured) {
    return mock.mockLoginLogs;
  }
  try {
    const rawLogs = await apiFetch<any[]>('/auth/admin/logins');
    return (rawLogs || []).map((l: any) => {
      let rawTime = l.loginTime || l.login_time || l.createdAt || l.created_at;
      let validTime = rawTime;
      if (!validTime || isNaN(Date.parse(validTime))) {
        validTime = new Date().toISOString();
      }
      return {
        id: String(l.id || Math.random()),
        userId: l.userId || l.user_id || '',
        email: l.email || '',
        userName: l.userName || l.user_name || '',
        loginTime: validTime,
        ipAddress: l.ipAddress || l.ip_address || '127.0.0.1',
        userAgent: l.userAgent || l.user_agent || 'Unknown Client',
        status: l.status || 'success'
      };
    });
  } catch (err) {
    console.error('getLoginLogs REST API error, falling back to mock:', err);
    return mock.mockLoginLogs;
  }
}


export async function backupDatabase(): Promise<any> {
  if (!isSupabaseConfigured) {
    return {
      "mock_table": [{"id": 1, "name": "Mock Database Row"}]
    };
  }
  return await apiFetch<any>('/admin/db/backup');
}

export async function requestRestoreDatabase(backupData: any, requestedBy?: string): Promise<any> {
  if (!isSupabaseConfigured) {
    const mockRequest = {
      id: "mock-req-" + Date.now(),
      backupData: JSON.stringify(backupData),
      requestedBy: requestedBy || "admin@matchpoint.io",
      status: "PENDING",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString()
    };
    
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('mock_restore_requests');
        const requests = stored ? JSON.parse(stored) : [];
        requests.push(mockRequest);
        localStorage.setItem('mock_restore_requests', JSON.stringify(requests));
      } catch (e) {
        console.error('Failed to save mock request to localStorage', e);
      }
    }
    
    console.log("Mock restore requested successfully:", mockRequest);
    return mockRequest;
  }
  return await apiFetch<any>('/admin/db/restore/request', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(backupData)
  });
}

export async function getPendingRestoreRequests(): Promise<any[]> {
  if (!isSupabaseConfigured) {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('mock_restore_requests');
        if (stored) {
          const parsed = JSON.parse(stored);
          return parsed.filter((r: any) => r.status === 'PENDING');
        }
      } catch (e) {
        console.error('Failed to parse mock requests from localStorage', e);
      }
    }
    return [
      {
        id: "mock-pending-restore-id-123",
        requestedBy: "admin_paliwal",
        status: "PENDING",
        createdAt: new Date(Date.now() - 3600 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 23 * 3600 * 1000).toISOString()
      }
    ];
  }
  return await apiFetch<any[]>('/admin/db/restore/requests');
}

export async function approveRestoreRequest(id: string, approvingAdmin?: string): Promise<any> {
  if (!isSupabaseConfigured) {
    if (typeof window !== 'undefined') {
      try {
        if (id === "mock-pending-restore-id-123") {
          if (approvingAdmin && "admin_paliwal".toLowerCase() === approvingAdmin.toLowerCase()) {
            throw new Error(JSON.stringify({ error: "Approval must be from a different Admin user" }));
          }
          return { message: "Mock restore successfully approved and executed." };
        }

        const stored = localStorage.getItem('mock_restore_requests');
        const requests = stored ? JSON.parse(stored) : [];
        const req = requests.find((r: any) => r.id === id);
        if (req) {
          if (approvingAdmin && req.requestedBy.toLowerCase() === approvingAdmin.toLowerCase()) {
            throw new Error(JSON.stringify({ error: "Approval must be from a different Admin user" }));
          }
          req.status = "EXECUTED";
          req.approvedBy = approvingAdmin || "admin2@matchpoint.io";
          localStorage.setItem('mock_restore_requests', JSON.stringify(requests));
        }
      } catch (e: any) {
        if (e.message && e.message.includes("Approval must be")) {
          throw e;
        }
        console.error('Failed to approve mock request in localStorage', e);
      }
    }
    return { message: "Mock restore successfully approved and executed." };
  }
  return await apiFetch<any>(`/admin/db/restore/approve/${id}`, {
    method: 'POST'
  });
}

export async function rejectRestoreRequest(id: string): Promise<any> {
  if (!isSupabaseConfigured) {
    if (typeof window !== 'undefined') {
      try {
        if (id === "mock-pending-restore-id-123") {
          return { message: "Mock restore request rejected." };
        }

        const stored = localStorage.getItem('mock_restore_requests');
        const requests = stored ? JSON.parse(stored) : [];
        const req = requests.find((r: any) => r.id === id);
        if (req) {
          req.status = "REJECTED";
          localStorage.setItem('mock_restore_requests', JSON.stringify(requests));
        }
      } catch (e) {
        console.error('Failed to reject mock request in localStorage', e);
      }
    }
    return { message: "Mock restore request rejected." };
  }
  return await apiFetch<any>(`/admin/db/restore/reject/${id}`, {
    method: 'POST'
  });
}

export async function updateTournament(
  id: string,
  data: Partial<Tournament>,
  user?: { id: string; name: string } | null
): Promise<void> {
  let currentStatus: Tournament['status'] = 'draft';
  if (!isSupabaseConfigured) {
    const tour = mock.mockTournaments.find(t => t.id === id);
    if (tour) currentStatus = tour.status;
  } else {
    try {
      const tour = await apiFetch<Tournament>(`/tournaments/${id}`);
      if (tour) currentStatus = tour.status;
    } catch (err) {
      console.error('updateTournament status check error:', err);
    }
  }

  // Allow editing or updating the status at any stage

  if (!isSupabaseConfigured) {
    const idx = mock.mockTournaments.findIndex(t => t.id === id);
    if (idx !== -1) {
      mock.mockTournaments[idx] = { ...mock.mockTournaments[idx], ...data };
    }
  } else {
    try {
      const existing = await apiFetch<any>(`/tournaments/${id}`);
      
      const merged = {
        ...existing,
        name: data.name !== undefined ? data.name : existing.name,
        type: data.type !== undefined ? data.type : existing.type,
        status: data.status !== undefined ? data.status : existing.status,
        location: data.location !== undefined ? data.location : existing.location,
        description: data.description !== undefined ? data.description : existing.description,
        banner: data.banner !== undefined ? data.banner : existing.banner,
        team_size_limit: data.team_size_limit !== undefined ? data.team_size_limit : existing.team_size_limit,
        team_tie_configs: data.team_tie_configs !== undefined ? data.team_tie_configs : existing.team_tie_configs,
        team_tie_events: data.team_tie_events !== undefined ? data.team_tie_events : existing.team_tie_events,
        start_date: data.start_date !== undefined ? data.start_date : existing.start_date,
        end_date: data.end_date !== undefined ? data.end_date : existing.end_date,
        bonus_point_margin: data.bonus_point_margin !== undefined ? data.bonus_point_margin : existing.bonus_point_margin,
        bonus_point_value: data.bonus_point_value !== undefined ? data.bonus_point_value : existing.bonus_point_value,
        collects_fees: data.collects_fees !== undefined ? data.collects_fees : existing.collects_fees,
        entry_fee: data.entry_fee !== undefined ? data.entry_fee : existing.entry_fee,
        currency: data.currency !== undefined ? data.currency : existing.currency,
        platform_fee_percentage: data.platform_fee_percentage !== undefined ? data.platform_fee_percentage : existing.platform_fee_percentage,
        payment_options: data.payment_options !== undefined ? data.payment_options : existing.payment_options,
        age_cutoff_date: data.age_cutoff_date !== undefined ? data.age_cutoff_date : existing.age_cutoff_date,
        withdraw_date: data.withdraw_date !== undefined ? data.withdraw_date : existing.withdraw_date,
        admins: data.admins !== undefined ? data.admins : existing.admins,
      };

      await apiFetch(`/tournaments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(merged)
      });
    } catch (err) {
      console.error('updateTournament REST API error:', err);
      throw err;
    }
  }

  await logAction(
    `Tournament "${data.name || id}" updated`,
    'tournament',
    `Fields: ${Object.keys(data).join(', ')} (Status: ${data.status || currentStatus})`,
    user
  );
}

export async function updateEvent(
  id: string,
  data: Partial<TournamentEvent>,
  user?: { id: string; name: string } | null
): Promise<void> {
  let tournamentId = data.tournament_id || (data as any).tournamentId || '';
  if (!tournamentId) {
    if (!isSupabaseConfigured) {
      const ev = mock.mockEvents.find(e => e.id === id);
      if (ev) tournamentId = ev.tournament_id;
    } else {
      try {
        const ev = await apiFetch<any>(`/events/${id}`);
        if (ev) tournamentId = ev.tournamentId || ev.tournament_id;
      } catch (err) {
        console.error('updateEvent parent ID query error:', err);
      }
    }
  }

  let currentStatus: Tournament['status'] = 'draft';
  if (tournamentId) {
    if (!isSupabaseConfigured) {
      const tour = mock.mockTournaments.find(t => t.id === tournamentId);
      if (tour) currentStatus = tour.status;
    } else {
      try {
        const tour = await apiFetch<Tournament>(`/tournaments/${tournamentId}`);
        if (tour) currentStatus = tour.status;
      } catch (err) {
        console.error('updateEvent parent status query error:', err);
      }
    }
  }

  if (currentStatus === 'completed' || currentStatus === 'cancelled') {
    throw new Error(`Cannot edit event because parent tournament is already ${currentStatus}.`);
  }

  if (!isSupabaseConfigured) {
    const idx = mock.mockEvents.findIndex(e => e.id === id);
    if (idx !== -1) {
      mock.mockEvents[idx] = { ...mock.mockEvents[idx], ...data };
    }
  } else {
    try {
      const existing = await apiFetch<any>(`/events/${id}`);
      
      const merged = {
        ...existing,
        event_name: data.event_name !== undefined ? data.event_name : existing.event_name,
        format: data.format !== undefined ? data.format : existing.format,
        category: data.category !== undefined ? data.category : existing.category,
        entry_limit: data.entry_limit !== undefined ? data.entry_limit : existing.entry_limit,
        scoring_format: data.scoring_format !== undefined ? data.scoring_format : existing.scoring_format,
        gender_restriction: data.gender_restriction !== undefined ? data.gender_restriction : existing.gender_restriction,
        age_limit: data.age_limit !== undefined ? data.age_limit : existing.age_limit,
        age_restriction_type: data.age_restriction_type !== undefined ? data.age_restriction_type : existing.age_restriction_type,
        entry_fee: data.entry_fee !== undefined ? data.entry_fee : existing.entry_fee,
      };

      await apiFetch(`/events/${id}`, {
        method: 'PUT',
        body: JSON.stringify(merged)
      });
    } catch (err) {
      console.error('updateEvent REST API error:', err);
      throw err;
    }
  }

  await logAction(
    `Event "${data.event_name || id}" updated`,
    'event',
    `Fields: ${Object.keys(data).join(', ')}`,
    user
  );
}

export async function deleteEvent(id: string, user?: { id: string; name: string } | null): Promise<void> {
  if (!isSupabaseConfigured) {
    const idx = mock.mockEvents.findIndex(e => e.id === id);
    if (idx !== -1) {
      mock.mockEvents.splice(idx, 1);
    }
  } else {
    try {
      await apiFetch(`/events/${id}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.error(`Failed to delete event ${id}:`, err);
      throw err;
    }
  }

  await logAction(
    `Event "${id}" deleted`,
    'event',
    `Event ID: ${id}`,
    user
  );
}

export async function updateRoundName(
  eventId: string,
  roundNumber: number,
  newRoundName: string,
  user?: { id: string; name: string } | null
): Promise<void> {
  if (!isSupabaseConfigured) {
    mock.mockEvents.forEach(m => {
      // Since event doesn't store match round name directly (it groups matches),
      // we update round name in mock matches:
    });
    mock.mockMatches.forEach(m => {
      if (m.event_id === eventId && m.fixture_round === roundNumber) {
        m.round_name = newRoundName;
      }
    });
    return;
  }
  try {
    const allMatches = await apiFetch<any[]>(`/matches/event/${eventId}`);
    const roundMatches = allMatches.filter(m => m.fixture_round === roundNumber);
    for (const m of roundMatches) {
      m.round_name = newRoundName;
      await apiFetch(`/matches/${m.id}`, {
        method: 'PUT',
        body: JSON.stringify(m)
      });
    }
  } catch (err) {
    console.error('updateRoundName REST API error:', err);
    throw err;
  }

  await logAction(
    `Round name updated`,
    'match',
    `Event ID: ${eventId}, Round: ${roundNumber}, Name: ${newRoundName}`,
    user
  );
}

export async function disqualifyPlayer(
  registrationId: string,
  reason: string,
  user?: { id: string; name: string } | null
): Promise<void> {
  let regDetails: any = null;

  if (!isSupabaseConfigured) {
    const idx = mock.mockRegistrations.findIndex(r => r.id === registrationId);
    if (idx !== -1) {
      mock.mockRegistrations[idx].status = 'disqualified';
      mock.mockRegistrations[idx].disqualification_reason = reason;
      regDetails = mock.mockRegistrations[idx];
    }
  } else {
    try {
      const existing = await apiFetch<any>(`/registrations/${registrationId}`);
      existing.status = 'disqualified';
      existing.disqualificationReason = reason;
      regDetails = existing;

      await apiFetch(`/registrations/${registrationId}`, {
        method: 'PUT',
        body: JSON.stringify(existing)
      });
    } catch (err) {
      console.error('disqualifyPlayer REST API error:', err);
      throw err;
    }
  }

  await logAction(
    `Player "${regDetails?.player_name || regDetails?.playerName || registrationId}" disqualified`,
    'registration',
    `Reason: ${reason}`,
    user
  );
}

// ─── Match History ────────────────────────────────────────

export interface MatchHistoryData {
  id: string;
  match_id: string;
  tournament_id?: string;
  event_id?: string;
  umpire_id?: string;
  umpire_name?: string;
  player1_name?: string;
  player2_name?: string;
  scoring_format?: string;
  best_of_games?: number;
  court?: string;
  points_history?: Array<{
    point: number;
    scorer: string;
    p1_score: number;
    p2_score: number;
    set: number;
    server: string;
    timestamp_sec: number;
  }>;
  sets_snapshot?: any[];
  total_duration_seconds?: number;
  play_time_seconds?: number;
  paused_time_seconds?: number;
  started_at?: string;
  ended_at?: string;
  winner_id?: string;
  winner_name?: string;
  final_status?: string;
  created_at?: string;
}

export async function saveMatchHistory(data: MatchHistoryData): Promise<void> {
  if (!isSupabaseConfigured) {
    console.log('[Mock] Match history saved:', data.id);
    return;
  }

  try {
    await apiFetch('/match-history', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  } catch (err) {
    console.error('saveMatchHistory REST API error:', err);
  }
}

export async function getMatchHistory(matchId: string): Promise<MatchHistoryData | null> {
  if (!isSupabaseConfigured) {
    return null;
  }

  try {
    const data = await apiFetch<MatchHistoryData>(`/match-history/match/${matchId}`);
    return data;
  } catch (err) {
    console.error('getMatchHistory REST API error:', err);
    return null;
  }
}

export async function getLeaderboard(): Promise<any[]> {
  if (!isSupabaseConfigured) {
    const computed = mock.mockUsers.map((u, i) => {
      const wins = Math.max(12 - i, 0);
      const losses = Math.max(i - 2, 0);
      const played = wins + losses;
      const winRate = played > 0 ? Math.round((wins / played) * 1000.0) / 10.0 : 0.0;
      const championships = i === 1 ? 1 : 0; 
      const points = (wins * 10) + (losses * 2) + (championships * 20);
      return {
        playerId: u.id,
        playerName: u.name,
        playerEmail: u.email,
        played,
        wins,
        losses,
        winRate,
        championships,
        points
      };
    });
    computed.sort((a, b) => b.points - a.points);
    return computed;
  }

  try {
    const data = await apiFetch<any[]>('/leaderboard');
    return data.map(p => ({
      playerId: p.player_id,
      playerName: p.player_name,
      playerEmail: p.player_email,
      played: p.played,
      wins: p.wins,
      losses: p.losses,
      winRate: p.win_rate,
      championships: p.championships,
      points: p.points
    }));
  } catch (err) {
    console.error('getLeaderboard REST API error, falling back to mock:', err);
    const computed = mock.mockUsers.map((u, i) => {
      const wins = Math.max(12 - i, 0);
      const losses = Math.max(i - 2, 0);
      const played = wins + losses;
      const winRate = played > 0 ? Math.round((wins / played) * 1000.0) / 10.0 : 0.0;
      const championships = i === 1 ? 1 : 0;
      const points = (wins * 10) + (losses * 2) + (championships * 20);
      return {
        playerId: u.id,
        playerName: u.name,
        playerEmail: u.email,
        played,
        wins,
        losses,
        winRate,
        championships,
        points
      };
    });
    computed.sort((a, b) => b.points - a.points);
    return computed;
  }
}

// ---- Tournament Media ----

export async function getTournamentMedia(tournamentId: string): Promise<TournamentMedia[]> {
  if (!isSupabaseConfigured) {
    return mock.getTournamentMedia(tournamentId);
  }
  try {
    return await apiFetch<TournamentMedia[]>(`/tournaments/${tournamentId}/media`);
  } catch (err) {
    console.error('getTournamentMedia REST API error, falling back to mock:', err);
    return mock.getTournamentMedia(tournamentId);
  }
}

export async function uploadToSupabaseStorage(file: File, bucket: string): Promise<string> {
  if (!isSupabaseConfigured) {
    return fileToDataUrl(file);
  }
  try {
    const fileExt = file.name.split('.').pop() || 'webp';
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });
    if (error) {
      console.warn(`Supabase storage bucket '${bucket}' upload failed (${error.message}), falling back to DataURL:`, error);
      return await fileToDataUrl(file);
    }

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return publicUrl || await fileToDataUrl(file);
  } catch (err) {
    console.warn(`Failed to upload file to Supabase storage bucket '${bucket}', falling back to DataURL:`, err);
    return await fileToDataUrl(file);
  }
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = err => reject(err);
    reader.readAsDataURL(file);
  });
}

export async function uploadTournamentMedia(
  tournamentId: string,
  payload: Omit<TournamentMedia, 'id' | 'created_at'>
): Promise<TournamentMedia> {
  if (!isSupabaseConfigured) {
    return mock.uploadTournamentMedia(tournamentId, payload);
  }
  try {
    return await apiFetch<TournamentMedia>(`/tournaments/${tournamentId}/media`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error('uploadTournamentMedia REST API error:', err);
    throw err;
  }
}

export async function deleteTournamentMedia(tournamentId: string, mediaId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    mock.deleteTournamentMedia(tournamentId, mediaId);
    return;
  }
  try {
    await apiFetch<void>(`/tournaments/${tournamentId}/media/${mediaId}`, {
      method: 'DELETE'
    });
  } catch (err) {
    console.error('deleteTournamentMedia REST API error:', err);
    throw err;
  }
}

export async function getMatchMedia(matchId: string): Promise<TournamentMedia[]> {
  if (!isSupabaseConfigured) {
    return mock.getMatchMedia(matchId);
  }
  try {
    return await apiFetch<TournamentMedia[]>(`/matches/${matchId}/media`);
  } catch (err) {
    console.error('getMatchMedia REST API error, falling back to mock:', err);
    return mock.getMatchMedia(matchId);
  }
}

export async function uploadMatchMedia(
  matchId: string,
  payload: Omit<TournamentMedia, 'id' | 'created_at'>
): Promise<TournamentMedia> {
  if (!isSupabaseConfigured) {
    return mock.uploadMatchMedia(matchId, payload);
  }
  try {
    return await apiFetch<TournamentMedia>(`/matches/${matchId}/media`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error('uploadMatchMedia REST API error:', err);
    throw err;
  }
}

export async function deleteMatchMedia(matchId: string, mediaId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    mock.deleteMatchMedia(matchId, mediaId);
    return;
  }
  try {
    await apiFetch<void>(`/matches/${matchId}/media/${mediaId}`, {
      method: 'DELETE'
    });
  } catch (err) {
    console.error('deleteMatchMedia REST API error:', err);
    throw err;
  }
}

// ---- Match Comments ----

export async function getMatchComments(matchId: string): Promise<MatchComment[]> {
  if (!isSupabaseConfigured) {
    return mock.getMatchComments(matchId);
  }
  try {
    return await apiFetch<MatchComment[]>(`/matches/${matchId}/comments`);
  } catch (err) {
    console.error('getMatchComments REST API error, falling back to mock:', err);
    return mock.getMatchComments(matchId);
  }
}

export async function postMatchComment(
  matchId: string,
  payload: Omit<MatchComment, 'id' | 'created_at'>
): Promise<MatchComment> {
  if (!isSupabaseConfigured) {
    return mock.postMatchComment(matchId, payload);
  }
  try {
    return await apiFetch<MatchComment>(`/matches/${matchId}/comments`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error('postMatchComment REST API error:', err);
    throw err;
  }
}

export async function deleteMatchComment(matchId: string, commentId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    mock.deleteMatchComment(matchId, commentId);
    return;
  }
  try {
    await apiFetch<void>(`/matches/${matchId}/comments/${commentId}`, {
      method: 'DELETE'
    });
  } catch (err) {
    console.error('deleteMatchComment REST API error:', err);
    throw err;
  }
}

export async function createSupportRequest(payload: {
  name: string;
  email: string;
  organization?: string;
  message: string;
}): Promise<any> {
  if (!isSupabaseConfigured) {
    if (!(mock as any).mockSupportRequests) (mock as any).mockSupportRequests = [];
    (mock as any).mockSupportRequests.push(payload);
    return payload;
  }
  try {
    return await apiFetch<any>('/public/support', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error('createSupportRequest REST API error:', err);
    throw err;
  }
}

export async function createTournamentFeedback(payload: {
  tournament_id: string;
  user_name?: string;
  feedback_type: string;
  message: string;
}): Promise<any> {
  if (!isSupabaseConfigured) {
    if (!(mock as any).mockFeedback) (mock as any).mockFeedback = [];
    (mock as any).mockFeedback.push(payload);
    return payload;
  }
  try {
    return await apiFetch<any>('/tournament-feedback', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error('createTournamentFeedback REST API error:', err);
    throw err;
  }
}


export async function getRegistrationById(regId: string): Promise<Registration> {
  if (!isSupabaseConfigured) {
    const reg = mock.mockRegistrations.find(r => r.id === regId);
    if (!reg) throw new Error('Registration not found');
    return reg;
  }
  try {
    const data = await apiFetch<Registration>(`/registrations/${regId}`);
    return data;
  } catch (err) {
    console.error('getRegistrationById REST API error, falling back to mock:', err);
    const reg = mock.mockRegistrations.find(r => r.id === regId);
    if (!reg) throw new Error('Registration not found');
    return reg;
  }
}

export async function getRazorpayConfig(): Promise<{ razorpay_key_id: string; is_mock: boolean }> {
  if (!isSupabaseConfigured) {
    return { razorpay_key_id: 'rzp_test_mockKeyId', is_mock: true };
  }
  try {
    return await apiFetch<{ razorpay_key_id: string; is_mock: boolean }>('/public/payments/razorpay/config');
  } catch (err) {
    console.error('getRazorpayConfig error:', err);
    return { razorpay_key_id: 'rzp_test_mockKeyId', is_mock: true };
  }
}

export async function createRazorpayOrder(registrationId: string, userId: string): Promise<{ id: string; amount: number; currency: string; free: boolean }> {
  if (!isSupabaseConfigured) {
    return { id: `order_mock_${Date.now()}`, amount: 500, currency: 'INR', free: false };
  }
  try {
    return await apiFetch<{ id: string; amount: number; currency: string; free: boolean }>('/payments/razorpay/order', {
      method: 'POST',
      body: JSON.stringify({ registration_id: registrationId, user_id: userId })
    });
  } catch (err) {
    console.error('createRazorpayOrder error:', err);
    throw err;
  }
}

export async function verifyRazorpayPayment(payload: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured) {
    return { success: true, message: 'Mock payment verified' };
  }
  try {
    return await apiFetch<{ success: boolean; message: string }>('/payments/razorpay/verify', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error('verifyRazorpayPayment error:', err);
    throw err;
  }
}

export async function downloadFeeReport(tournamentId: string, tournamentName: string): Promise<void> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('matchpoint_token') : null;
    const response = await fetch(`${API_BASE_URL}/api/v1/tournaments/${tournamentId}/payments/report`, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    if (!response.ok) throw new Error('Failed to generate report');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Fee_Collection_Report_${tournamentName.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error('downloadFeeReport error:', err);
    throw err;
  }
}

export async function emailFeeReport(tournamentId: string, email: string): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured) {
    return { success: true, message: 'Mock report email sent' };
  }
  try {
    return await apiFetch<{ success: boolean; message: string }>(`/tournaments/${tournamentId}/payments/report/email?email=${encodeURIComponent(email)}`, {
      method: 'POST'
    });
  } catch (err) {
    console.error('emailFeeReport error:', err);
    throw err;
  }
}

export async function getMatchPolls(matchId: string): Promise<MatchPoll[]> {
  if (!isSupabaseConfigured) {
    return mock.getMatchPolls(matchId);
  }
  try {
    return await apiFetch<MatchPoll[]>(`/polls/match/${matchId}`);
  } catch (err) {
    console.error('getMatchPolls error, falling back to mock:', err);
    return mock.getMatchPolls(matchId);
  }
}

export async function createMatchPoll(matchId: string, question: string, options: string[]): Promise<MatchPoll> {
  if (!isSupabaseConfigured) {
    return mock.createMatchPoll(matchId, question, options);
  }
  try {
    return await apiFetch<MatchPoll>(`/polls/match/${matchId}`, {
      method: 'POST',
      body: JSON.stringify({ question, options })
    });
  } catch (err) {
    console.error('createMatchPoll error, falling back to mock:', err);
    return mock.createMatchPoll(matchId, question, options);
  }
}

export async function voteInMatchPoll(pollId: string, optionIndex: number): Promise<MatchPoll> {
  if (!isSupabaseConfigured) {
    return mock.voteInMatchPoll(pollId, optionIndex);
  }
  try {
    return await apiFetch<MatchPoll>(`/polls/${pollId}/vote?optionIndex=${optionIndex}`, {
      method: 'POST'
    });
  } catch (err) {
    console.error('voteInMatchPoll error, falling back to mock:', err);
    return mock.voteInMatchPoll(pollId, optionIndex);
  }
}

export async function getMatchById(matchId: string): Promise<Match | null> {
  if (!isSupabaseConfigured) {
    return mock.mockMatches.find(m => m.id === matchId) || null;
  }
  try {
    const data = await apiFetch<any>(`/matches/${matchId}`);
    return mapBackendMatchToMatch(data);
  } catch (err) {
    console.error('getMatchById error, falling back to mock:', err);
    return mock.mockMatches.find(m => m.id === matchId) || null;
  }
}

export async function updateLiveViewers(count: number): Promise<void> {
  if (!isSupabaseConfigured) {
    mock.updateMockMatchesViewers(count);
    return;
  }
  try {
    await apiFetch(`/matches/viewers?count=${count}`, {
      method: 'POST'
    });
  } catch (err) {
    console.error('updateLiveViewers REST API error:', err);
  }
}
