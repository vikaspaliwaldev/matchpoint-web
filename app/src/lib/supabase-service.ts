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
} from '@/types';

// ============================================================
// Spring Boot REST API Helpers (Dynamic Routing)
// ============================================================

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('matchpoint_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`http://localhost:8080/api/v1${path}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers
    }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP error ${res.status}`);
  }
  if (res.status === 204) return null as any;
  return await res.json();
}

export async function logClientActivity(type: string, details?: string, userId?: string, userName?: string): Promise<void> {
  try {
    const payload = {
      userId: userId || 'GUEST',
      userName: userName || 'Anonymous Visitor',
      activityType: type,
      details: details || ''
    };
    const url = userId ? '/activity-logs' : '/public/activity-logs';
    
    await fetch(`http://localhost:8080/api/v1${url}`, {
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
    await logClientActivity('PAGE_VIEW', 'Viewed tournaments dashboard');
    return data;
  } catch (err) {
    console.error('getTournaments REST API error, falling back to mock:', err);
    return mock.mockTournaments;
  }
}

export async function getMasterEvents(): Promise<MasterEvent[]> {
  // Master events templates are loaded dynamically from mock layer as standard templates
  return mock.mockMasterEvents;
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
    user || { id: 'admin-1', name: 'Administrator' }
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
    user || { id: 'admin-1', name: 'Administrator' }
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

export async function updateRegistrationStatus(
  regId: string,
  status: Registration['status'],
  seed?: number | null
): Promise<void> {
  if (!isSupabaseConfigured) {
    const idx = mock.mockRegistrations.findIndex(r => r.id === regId);
    if (idx !== -1) {
      mock.mockRegistrations[idx].status = status;
      if (seed !== undefined) mock.mockRegistrations[idx].seed = seed ?? undefined;
    }
    return;
  }
  try {
    const existing = await apiFetch<Registration>(`/registrations/${regId}`);
    existing.status = status;
    if (seed !== undefined) existing.seed = seed ?? undefined;
    await apiFetch<Registration>(`/registrations/${regId}`, {
      method: 'PUT',
      body: JSON.stringify(existing)
    });
    await logClientActivity('UPDATE_REGISTRATION_STATUS', `Set registration status to ${status} for ID: ${regId}`);
  } catch (err) {
    console.error('updateRegistrationStatus REST API error, throwing:', err);
    throw err;
  }
}

// ---- Teams ----

export async function getTeamsByTournament(tournamentId: string): Promise<Team[]> {
  if (!isSupabaseConfigured) {
    return mock.getTeamsByTournament(tournamentId);
  }
  try {
    const data = await apiFetch<Team[]>(`/teams/tournament/${tournamentId}`);
    return data;
  } catch (err) {
    console.error('getTeamsByTournament REST API error, falling back to mock:', err);
    return mock.getTeamsByTournament(tournamentId);
  }
}

export async function createTeam(team: Team): Promise<Team> {
  if (!isSupabaseConfigured) {
    mock.mockTeams.push(team);
    return team;
  }
  try {
    const data = await apiFetch<Team>('/teams', {
      method: 'POST',
      body: JSON.stringify(team)
    });
    await logClientActivity('CREATE_TEAM', `Created team "${team.name}" for tournament: ${team.tournament_id}`);
    return data;
  } catch (err) {
    console.error('createTeam REST API error, throwing:', err);
    throw err;
  }
}

export async function updateTeamRoster(
  teamId: string,
  players: string[],
  captainId?: string | null
): Promise<void> {
  if (!isSupabaseConfigured) {
    const idx = mock.mockTeams.findIndex(t => t.id === teamId);
    if (idx !== -1) {
      mock.mockTeams[idx].players = players;
      if (captainId !== undefined) mock.mockTeams[idx].captain_id = captainId ?? undefined;
    }
    return;
  }
  try {
    const existing = await apiFetch<any>(`/teams/${teamId}`);
    existing.players = players;
    if (captainId !== undefined) existing.captain_id = captainId ?? undefined;
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

// ---- Matches ----

export async function getMatchesByEvent(eventId: string): Promise<Match[]> {
  if (!isSupabaseConfigured) {
    return mock.getMatchesByEvent(eventId);
  }
  try {
    const data = await apiFetch<Match[]>(`/matches/event/${eventId}`);
    data.sort((a, b) => {
      const aRound = a.fixture_round !== undefined ? a.fixture_round : (a as any).fixtureRound || 0;
      const bRound = b.fixture_round !== undefined ? b.fixture_round : (b as any).fixtureRound || 0;
      if (aRound !== bRound) {
        return aRound - bRound;
      }
      const aPos = a.fixture_position !== undefined ? a.fixture_position : (a as any).fixturePosition || 0;
      const bPos = b.fixture_position !== undefined ? b.fixture_position : (b as any).fixturePosition || 0;
      return aPos - bPos;
    });
    return data;
  } catch (err) {
    console.error('getMatchesByEvent REST API error, falling back to mock:', err);
    return mock.getMatchesByEvent(eventId);
  }
}

export async function getMatchesByTournament(tournamentId: string): Promise<Match[]> {
  if (!isSupabaseConfigured) {
    return mock.getMatchesByTournament(tournamentId);
  }
  try {
    const data = await apiFetch<Match[]>(`/matches/tournament/${tournamentId}`);
    return data;
  } catch (err) {
    console.error('getMatchesByTournament REST API error, falling back to mock:', err);
    return mock.getMatchesByTournament(tournamentId);
  }
}

export async function getMatches(): Promise<Match[]> {
  if (!isSupabaseConfigured) {
    return mock.mockMatches;
  }
  try {
    const data = await apiFetch<Match[]>('/matches');
    return data;
  } catch (err) {
    console.error('getMatches REST API error, falling back to mock:', err);
    return mock.mockMatches;
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
      tournamentId: m.tournament_id || (m as any).tournamentId,
      eventId: m.event_id || (m as any).eventId,
      fixtureRound: m.fixture_round !== undefined ? m.fixture_round : (m as any).fixtureRound,
      fixturePosition: m.fixture_position !== undefined ? m.fixture_position : (m as any).fixturePosition,
      court: m.court,
      player1Id: m.player1_id || (m as any).player1Id,
      player1Name: m.player1_name || (m as any).player1Name,
      player2Id: m.player2_id || (m as any).player2Id,
      player2Name: m.player2_name || (m as any).player2Name,
      umpireId: m.umpire_id || (m as any).umpireId,
      umpireName: m.umpire_name || (m as any).umpireName,
      scheduledTime: m.scheduled_time || (m as any).scheduledTime,
      actualStartTime: m.actual_start_time || (m as any).actualStartTime,
      actualEndTime: m.actual_end_time || (m as any).actualEndTime,
      durationSeconds: m.duration_seconds !== undefined ? m.duration_seconds : (m as any).durationSeconds,
      status: m.status,
      winnerId: m.winner_id || (m as any).winnerId,
      sets: m.sets,
      subMatches: m.sub_matches || (m as any).subMatches
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

export async function updateMatchScore(
  matchId: string,
  sets: MatchSet[],
  status: MatchStatus,
  winnerId?: string | null,
  actualStartTime?: string | null,
  actualEndTime?: string | null,
  durationSeconds?: number | null,
  subMatches?: Match['sub_matches']
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
        duration_seconds: durationSeconds || undefined,
        sub_matches: subMatches || mock.mockMatches[idx].sub_matches,
      };
    }
    return;
  }

  try {
    const existing = await apiFetch<any>(`/matches/${matchId}`);
    
    existing.sets = sets;
    existing.status = status;
    existing.winnerId = winnerId || null;
    if (actualStartTime !== undefined) existing.actualStartTime = actualStartTime;
    if (actualEndTime !== undefined) existing.actualEndTime = actualEndTime;
    if (durationSeconds !== undefined) existing.durationSeconds = durationSeconds;
    if (subMatches !== undefined) existing.subMatches = subMatches;

    await apiFetch(`/matches/${matchId}`, {
      method: 'PUT',
      body: JSON.stringify(existing)
    });
  } catch (err) {
    console.error('updateMatchScore REST API error:', err);
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
    existing.umpireId = umpireId;
    existing.umpireName = umpireName;

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
    const data = await apiFetch<Match[]>(`/matches/umpire/${umpireId}`);
    return data;
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
      created_at: p.createdAt || p.created_at,
    })) as User[];
    return users.filter(u => u.roles.includes('player'));
  } catch (err) {
    console.error('getPlayers REST API error, falling back to mock:', err);
    return mock.mockUsers.filter(u => u.roles.includes('player'));
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
    const data = await apiFetch<Match[]>(`/matches/player/${playerId}`);
    return data.filter(m => {
      const stat = m.status || (m as any).status;
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
    user_id: logUser.id === 'system' ? undefined : logUser.id,
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
      userId: logEntry.user_id,
      userName: logEntry.user_name,
      details: logEntry.details,
      createdAt: logEntry.created_at
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
      user_id: log.userId,
      user_name: log.userName,
      details: log.details,
      created_at: log.createdAt
    }));
  } catch (err) {
    console.error('getAuditLogs REST API error, falling back to mock:', err);
    return mock.mockAuditLogs;
  }
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

  if (currentStatus === 'completed' || currentStatus === 'cancelled') {
    throw new Error(`Cannot edit tournament because it is already ${currentStatus}.`);
  }

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
        teamSizeLimit: data.team_size_limit !== undefined ? data.team_size_limit : existing.teamSizeLimit,
        teamTieConfigs: data.team_tie_configs !== undefined ? data.team_tie_configs : existing.teamTieConfigs,
        start_date: data.start_date !== undefined ? data.start_date : existing.start_date,
        end_date: data.end_date !== undefined ? data.end_date : existing.end_date,
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
        eventName: data.event_name !== undefined ? data.event_name : existing.eventName,
        format: data.format !== undefined ? data.format : existing.format,
        category: data.category !== undefined ? data.category : existing.category,
        entryLimit: data.entry_limit !== undefined ? data.entry_limit : existing.entryLimit,
        genderRequirement: (data as any).gender_requirement !== undefined ? (data as any).gender_requirement : existing.genderRequirement,
        minAge: (data as any).min_age !== undefined ? (data as any).min_age : existing.minAge,
        maxAge: (data as any).max_age !== undefined ? (data as any).max_age : existing.maxAge,
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
