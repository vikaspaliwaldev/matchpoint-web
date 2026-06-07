'use client';

import React, { useState, useEffect } from 'react';
import { Registration, RegistrationStatus, Tournament, TournamentEvent, User } from '@/types';
import { IconCheck, IconX, IconUsers } from '@/components/icons';
import { useAuth } from '@/lib/auth-context';
import {
  getRegistrations,
  getTournaments,
  getEvents,
  updateRegistrationStatus,
  disqualifyPlayer,
  getPlayers,
  saveRegistrationsBatch,
} from '@/lib/supabase-service';

interface SearchableTournamentSelectProps {
  selectedId: string;
  onSelect: (id: string) => void;
  tournaments: Tournament[];
  placeholder?: string;
}

function SearchableTournamentSelect({
  selectedId,
  onSelect,
  tournaments,
  placeholder = "Search tournaments..."
}: SearchableTournamentSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedTour = tournaments.find(t => t.id === selectedId);

  // Initialize query with selected tournament name if set
  React.useEffect(() => {
    if (selectedTour) {
      setQuery(selectedTour.name);
    } else if (selectedId === 'all') {
      setQuery('All Tournaments');
    } else {
      setQuery('');
    }
  }, [selectedId, selectedTour]);

  // Handle outside click closures
  React.useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (selectedTour) {
          setQuery(selectedTour.name);
        } else if (selectedId === 'all') {
          setQuery('All Tournaments');
        } else {
          setQuery('');
        }
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [selectedTour, selectedId]);

  const filtered = React.useMemo(() => {
    const term = query.toLowerCase().trim();
    const matchesAll = "all tournaments".includes(term) || "all".includes(term);
    const basicList = tournaments.filter(t => {
      if (term === '' || (selectedTour && selectedTour.name === query) || (selectedId === 'all' && query === 'All Tournaments')) return true;
      return t.name.toLowerCase().includes(term) || t.location.toLowerCase().includes(term) || t.slug.toLowerCase().includes(term);
    });
    
    if (term !== '' && matchesAll && selectedId !== 'all') {
      return [{ id: 'all', name: 'All Tournaments' } as any, ...basicList];
    }
    
    if (term === '' || query === 'All Tournaments') {
      return [{ id: 'all', name: 'All Tournaments' } as any, ...basicList];
    }
    return basicList;
  }, [tournaments, query, selectedTour, selectedId]);

  return (
    <div style={{ position: 'relative', minWidth: 220, zIndex: 30 }} ref={containerRef}>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          className="input"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          style={{ paddingRight: 32 }}
        />
        <button
          type="button"
          onClick={() => {
            if (isOpen) {
              setIsOpen(false);
              if (selectedTour) setQuery(selectedTour.name);
              else if (selectedId === 'all') setQuery('All Tournaments');
            } else {
              setIsOpen(true);
            }
          }}
          style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
            fontSize: 12, padding: 0
          }}
        >
          {isOpen ? '▲' : '▼'}
        </button>
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          maxHeight: 200,
          overflowY: 'auto',
          zIndex: 999,
          marginTop: 6,
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)',
        }}>
          {filtered.length > 0 ? (
            filtered.map(t => (
              <div
                key={t.id}
                onClick={() => {
                  onSelect(t.id);
                  setQuery(t.name);
                  setIsOpen(false);
                }}
                style={{
                  padding: '10px 14px',
                  cursor: 'pointer',
                  fontSize: 13,
                  borderBottom: '1px solid var(--border)',
                  background: selectedId === t.id ? 'var(--accent-subtle)' : 'transparent',
                  color: selectedId === t.id ? 'var(--accent-hover)' : 'var(--text-primary)',
                  transition: 'background var(--transition-fast)',
                }}
                onMouseOver={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                onMouseOut={e => e.currentTarget.style.background = selectedId === t.id ? 'var(--accent-subtle)' : 'transparent'}
              >
                <div style={{ fontWeight: 600 }}>{t.name}</div>
                {t.location && (
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>📍 {t.location}</div>
                )}
              </div>
            ))
          ) : (
            <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
              No matching tournaments found
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---- CSV Parsing & Age Calculation Helpers ----

function getCutoffAge(dobString: string, cutoffDateString?: string) {
  if (!dobString) return 0;
  const dob = new Date(dobString);
  const refDate = cutoffDateString ? new Date(cutoffDateString) : new Date();
  let age = refDate.getFullYear() - dob.getFullYear();
  const m = refDate.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && refDate.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

function parseCSV(text: string): any[] {
  const lines: string[] = [];
  let row: string[] = [];
  let inQuotes = false;
  let currentVal = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(currentVal.trim());
      if (row.length > 0 && row.some(x => x !== '')) {
        lines.push(JSON.stringify(row));
      }
      row = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }
  if (currentVal || row.length > 0) {
    row.push(currentVal.trim());
    if (row.length > 0 && row.some(x => x !== '')) {
      lines.push(JSON.stringify(row));
    }
  }

  if (lines.length === 0) return [];
  const headers = JSON.parse(lines[0]).map((h: string) => h.toLowerCase().replace(/[\s_]+/g, ''));
  
  return lines.slice(1).map(line => {
    const values = JSON.parse(line);
    const item: any = {};
    headers.forEach((h: string, idx: number) => {
      item[h] = values[idx] || '';
    });
    return item;
  });
}

export default function RegistrationsPage() {
  const { user, activeRole } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [events, setEvents] = useState<TournamentEvent[]>([]);
  const [players, setPlayers] = useState<User[]>([]);
  const [viewingPlayer, setViewingPlayer] = useState<User | null>(null);
  const [filterStatus, setFilterStatus] = useState<RegistrationStatus | 'all'>('all');
  const [filterTournament, setFilterTournament] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [disqualifyId, setDisqualifyId] = useState<string | null>(null);
  const [disqualifyReason, setDisqualifyReason] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterTournament, searchQuery]);

  // Import Drawer States
  const [showImportDrawer, setShowImportDrawer] = useState(false);
  const [importTournamentId, setImportTournamentId] = useState('');
  const [importEventId, setImportEventId] = useState('');
  const [importedRows, setImportedRows] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<number, string[]>>({});
  const [isSavingImport, setIsSavingImport] = useState(false);

  useEffect(() => {
    if (tournaments.length > 0 && !importTournamentId) {
      setImportTournamentId(tournaments[0].id);
    }
  }, [tournaments, importTournamentId]);

  const importEvents = events.filter(e => e.tournament_id === importTournamentId);

  useEffect(() => {
    if (importEvents.length > 0) {
      setImportEventId(importEvents[0].id);
    } else {
      setImportEventId('');
    }
  }, [importTournamentId, events]);

  const runValidation = (rows: any[], tId: string, eId: string) => {
    const t = tournaments.find(x => x.id === tId);
    const ev = events.find(x => x.id === eId);
    const errs: Record<number, string[]> = {};

    if (!t || !ev) return errs;

    rows.forEach((row, idx) => {
      const rowErrors: string[] = [];
      
      if (!row.name || !row.name.trim()) {
        rowErrors.push('Name is required');
      }
      if (!row.email || !row.email.trim() || !row.email.includes('@')) {
        rowErrors.push('Valid email is required');
      }
      
      // DOB calculation & limit check
      if (ev.max_age || ev.min_age || ev.age_limit) {
        if (!row.dob || !row.dob.trim()) {
          rowErrors.push(`DOB is required for U${ev.max_age || ev.age_limit} category`);
        } else {
          const refDate = t.age_cutoff_date || t.start_date || new Date().toISOString();
          const age = getCutoffAge(row.dob, refDate);
          
          if (ev.max_age && age > ev.max_age) {
            rowErrors.push(`Age (${age}) exceeds max limit of ${ev.max_age}`);
          } else if (ev.age_limit && (!ev.age_restriction_type || ev.age_restriction_type === 'max') && age > ev.age_limit) {
            rowErrors.push(`Age (${age}) exceeds max limit of ${ev.age_limit}`);
          }

          if (ev.min_age && age < ev.min_age) {
            rowErrors.push(`Age (${age}) is below min limit of ${ev.min_age}`);
          } else if (ev.age_limit && ev.age_restriction_type === 'min' && age < ev.age_limit) {
            rowErrors.push(`Age (${age}) is below min limit of ${ev.age_limit}`);
          }
        }
      }

      // Gender limit check
      const expectedGender = (ev.gender || ev.gender_restriction || '').trim().toLowerCase();
      if (expectedGender && expectedGender !== 'open' && expectedGender !== 'mixed') {
        const pGender = (row.gender || '').trim().toLowerCase();
        
        let normalizedGender = '';
        if (pGender.startsWith('m') || pGender.startsWith('b')) normalizedGender = 'male';
        else if (pGender.startsWith('f') || pGender.startsWith('g') || pGender.startsWith('w')) normalizedGender = 'female';
        
        let genderMatch = false;
        if (expectedGender === 'boys' || expectedGender === 'male' || expectedGender === 'men') {
          genderMatch = normalizedGender === 'male';
        } else if (expectedGender === 'girls' || expectedGender === 'female' || expectedGender === 'women') {
          genderMatch = normalizedGender === 'female';
        }
        
        if (!genderMatch && normalizedGender) {
          rowErrors.push(`Gender (${row.gender}) does not match event (${ev.gender || ev.gender_restriction})`);
        }
      }

      if (rowErrors.length > 0) {
        errs[idx] = rowErrors;
      }
    });

    return errs;
  };

  const handleRowEdit = (index: number, field: string, value: string) => {
    const updated = [...importedRows];
    updated[index] = { ...updated[index], [field]: value };
    setImportedRows(updated);
    
    // Re-validate immediately
    const errs = runValidation(updated, importTournamentId, importEventId);
    setValidationErrors(errs);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      try {
        const parsed = parseCSV(text);
        setImportedRows(parsed);
        const errs = runValidation(parsed, importTournamentId, importEventId);
        setValidationErrors(errs);
      } catch (err) {
        console.error('Failed to parse CSV file:', err);
        alert('Invalid CSV file format. Please check the template.');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (importedRows.length === 0) return;
    if (Object.keys(validationErrors).length > 0) {
      alert('Please fix all validation errors before importing.');
      return;
    }

    try {
      setIsSavingImport(true);
      
      const newRegistrations: Registration[] = importedRows.map((row, idx) => {
        // Try to match player by email
        const matchedPlayer = players.find(p => p.email.toLowerCase() === row.email.toLowerCase());
        const playerId = matchedPlayer ? matchedPlayer.id : `u-shadow-${Date.now()}-${idx}`;
        
        const reg: Registration = {
          id: `reg-imported-${Date.now()}-${idx}`,
          tournament_id: importTournamentId,
          event_id: importEventId,
          player_id: playerId,
          player_name: row.name,
          player_email: row.email,
          status: 'approved', // imported registrations are auto-approved
          registered_at: new Date().toISOString(),
          partner_name: row.partnername || undefined,
          partner_email: row.partneremail || undefined,
          partner_gender: row.partnergender || undefined,
          partner_age: row.partnerage ? Number(row.partnerage) : undefined,
        };
        return reg;
      });

      await saveRegistrationsBatch(newRegistrations);
      setRegistrations(prev => [...prev, ...newRegistrations]);
      alert(`Successfully imported ${newRegistrations.length} registrations!`);
      
      // Reset state
      setImportedRows([]);
      setValidationErrors({});
      setShowImportDrawer(false);
    } catch (err) {
      console.error('Failed to save imported registrations:', err);
      alert('Failed to save imported registrations.');
    } finally {
      setIsSavingImport(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,Name,Email,Phone,Age,Gender,DOB,PartnerName,PartnerEmail,PartnerGender,PartnerAge\nJohn Doe,john@example.com,9876543210,12,Male,2014-05-15,,,\nJane Smith,jane@example.com,9876543211,28,Female,1998-09-20,,,\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "matchpoint_roster_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Dynamic database load on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [regsData, toursData, eventsData, playersData] = await Promise.all([
          getRegistrations(),
          getTournaments(),
          getEvents(),
          getPlayers(),
        ]);
        setRegistrations(regsData);
        setTournaments(toursData);
        setEvents(eventsData);
        setPlayers(playersData);
      } catch (err) {
        console.error('Failed to load registrations page data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = registrations.filter(r => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (filterTournament !== 'all' && r.tournament_id !== filterTournament) return false;
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      const playerName = r.player_name ? r.player_name.toLowerCase() : '';
      const playerEmail = r.player_email ? r.player_email.toLowerCase() : '';
      return playerName.includes(query) || playerEmail.includes(query);
    }
    return true;
  });

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedRegistrations = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Dynamic database update with local state synchrony
  const handleStatusChange = async (id: string, status: RegistrationStatus) => {
    try {
      await updateRegistrationStatus(id, status, undefined, user);
      setRegistrations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    } catch (err) {
      console.error('Failed to update registration status in database:', err);
      alert('Failed to update registration status. Please check your Supabase connection and try again.');
    }
  };

  const pendingCount = registrations.filter(r => r.status === 'pending').length;

  if (loading) {
    return (
      <div className="glass-card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
        <div className="animate-spin" style={{ display: 'inline-block', fontSize: 24, marginBottom: 12, animation: 'spin 2s linear infinite' }}>🔄</div>
        <p style={{ fontSize: 15, fontWeight: 500 }}>Loading Registrations...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Registrations</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
            Manage player registrations across tournaments
            {pendingCount > 0 && (
              <span className="badge badge-pending" style={{ marginLeft: 8 }}>{pendingCount} pending</span>
            )}
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowImportDrawer(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          📤 Import Roster (CSV)
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="tab-group" style={{ display: 'inline-flex' }}>
          {(['all', 'pending', 'approved', 'rejected', 'waitlisted'] as const).map(status => (
            <button
              key={status}
              className={`tab ${filterStatus === status ? 'active' : ''}`}
              onClick={() => setFilterStatus(status)}
              style={{ textTransform: 'capitalize' }}
            >
              {status}
            </button>
          ))}
        </div>

        <SearchableTournamentSelect
          selectedId={filterTournament}
          onSelect={setFilterTournament}
          tournaments={tournaments}
        />

        <input
          type="text"
          placeholder="🔍 Search players..."
          className="input"
          style={{ width: 'auto', minWidth: 240, marginLeft: 'auto' }}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Player</th>
              <th>Email</th>
              <th>Tournament</th>
              <th>Event</th>
              <th>Seed</th>
              <th>Status</th>
              <th>Registered</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRegistrations.map(reg => {
              const tournament = tournaments.find(t => t.id === reg.tournament_id);
              const eventObj = events.find(e => e.id === reg.event_id);
              return (
                <tr key={reg.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {(() => {
                        const matchedPlayer = players.find(p => p.id === reg.player_id);
                        return matchedPlayer?.avatar ? (
                          <img src={matchedPlayer.avatar} alt={reg.player_name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                        ) : (
                          <div style={{
                            width: 32, height: 32,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, fontWeight: 700,
                            color: '#fff',
                            flexShrink: 0,
                          }}>
                            {reg.player_name.charAt(0).toUpperCase()}
                          </div>
                        );
                      })()}
                      {activeRole === 'admin' ? (
                        <button
                          type="button"
                          onClick={() => {
                            const found = players.find(p => p.id === reg.player_id);
                            if (found) {
                              setViewingPlayer(found);
                            } else {
                              setViewingPlayer({
                                id: reg.player_id,
                                name: reg.player_name,
                                email: reg.player_email,
                                role: 'player',
                                roles: ['player'],
                                created_at: new Date().toISOString()
                              });
                            }
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            margin: 0,
                            fontWeight: 600,
                            color: 'var(--accent)',
                            textDecoration: 'underline',
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontFamily: 'inherit',
                            fontSize: 'inherit'
                          }}
                        >
                          {reg.player_name}{reg.partner_name ? ` / ${reg.partner_name}` : ''}
                        </button>
                      ) : (
                        <span style={{ fontWeight: 500 }}>
                          {reg.player_name}{reg.partner_name ? ` / ${reg.partner_name}` : ''}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{reg.player_email}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{tournament?.name || reg.tournament_id}</td>
                  <td>{eventObj?.event_name || reg.event_id}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {reg.seed ? `#${reg.seed}` : '—'}
                  </td>
                  <td>
                    <span className={`badge badge-${reg.status}`}>{reg.status}</span>
                    {reg.status === 'disqualified' && reg.disqualification_reason && (
                      <div style={{ fontSize: 11, color: 'var(--score-loss)', marginTop: 4 }}>
                        Reason: {reg.disqualification_reason}
                      </div>
                    )}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                    {new Date(reg.registered_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {reg.status === 'pending' && (
                        <>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--score-win)' }}
                            onClick={() => handleStatusChange(reg.id, 'approved')}
                            title="Approve"
                          >
                            <IconCheck size={16} />
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--score-loss)' }}
                            onClick={() => handleStatusChange(reg.id, 'rejected')}
                            title="Reject"
                          >
                            <IconX size={16} />
                          </button>
                        </>
                      )}
                      {reg.status === 'waitlisted' && (
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--score-win)' }}
                          onClick={() => handleStatusChange(reg.id, 'approved')}
                        >
                          <IconCheck size={14} /> Approve
                        </button>
                      )}
                      {reg.status === 'approved' && (
                        <>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--text-muted)', fontSize: 12 }}
                            onClick={() => handleStatusChange(reg.id, 'waitlisted')}
                          >
                            Waitlist
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--score-loss)', fontSize: 12 }}
                            onClick={() => setDisqualifyId(reg.id)}
                          >
                            Disqualify
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalItems > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} entries
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: 13 }}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
              .map((page, idx, arr) => {
                const showEllipsisBefore = idx > 0 && page - arr[idx - 1] > 1;
                return (
                  <React.Fragment key={page}>
                    {showEllipsisBefore && <span style={{ padding: '6px 8px', color: 'var(--text-muted)' }}>...</span>}
                    <button
                      onClick={() => setCurrentPage(page)}
                      className={`btn ${currentPage === page ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '6px 12px', fontSize: 13, minWidth: 36 }}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                );
              })
            }
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: 13 }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <div className="empty-state-icon">📋</div>
          <p>No registrations match your filters</p>
        </div>
      )}

      {disqualifyId && (
        <div className="modal-overlay" onClick={() => setDisqualifyId(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>Disqualify Player</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setDisqualifyId(null)}><IconX size={18} /></button>
            </div>
            <form onSubmit={async e => {
              e.preventDefault();
              try {
                await disqualifyPlayer(disqualifyId, disqualifyReason);
                setRegistrations(prev => prev.map(r => r.id === disqualifyId ? { ...r, status: 'disqualified', disqualification_reason: disqualifyReason } : r));
                setDisqualifyId(null);
                setDisqualifyReason('');
              } catch (err) {
                console.error(err);
                alert('Failed to disqualify player.');
              }
            }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="input-group">
                <label className="input-label" htmlFor="disq-reason">Reason for Disqualification *</label>
                <textarea id="disq-reason" className="input" placeholder="e.g. Failure to report to court / Unsportsmanlike conduct..." value={disqualifyReason} onChange={e => setDisqualifyReason(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', background: 'var(--score-loss)' }}>
                Confirm Disqualification
              </button>
            </form>
          </div>
        </div>
      )}

      {viewingPlayer && (
        <PlayerProfileModal player={viewingPlayer} onClose={() => setViewingPlayer(null)} />
      )}

      {/* Import Drawer Modal */}
      {showImportDrawer && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 880, width: '90vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>📤 Import Player Roster</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => { setShowImportDrawer(false); setImportedRows([]); setValidationErrors({}); }}><IconX size={18} /></button>
            </div>

            {/* Selection Step */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 20, background: 'var(--bg-secondary)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ flex: 1 }}>
                <label className="label" style={{ marginBottom: 6, display: 'block', fontSize: 13, fontWeight: 500 }}>Select Target Tournament</label>
                <select
                  className="input"
                  value={importTournamentId}
                  onChange={e => {
                    setImportTournamentId(e.target.value);
                    setImportedRows([]);
                    setValidationErrors({});
                  }}
                >
                  {tournaments.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.type})</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label className="label" style={{ marginBottom: 6, display: 'block', fontSize: 13, fontWeight: 500 }}>Select Target Event/Category</label>
                <select
                  className="input"
                  value={importEventId}
                  onChange={e => {
                    setImportEventId(e.target.value);
                    setImportedRows([]);
                    setValidationErrors({});
                  }}
                  disabled={importEvents.length === 0}
                >
                  {importEvents.length === 0 && <option value="">No events configured</option>}
                  {importEvents.map(ev => (
                    <option key={ev.id} value={ev.id}>
                      {ev.event_name} (Category: {ev.category}, Limit: {ev.entry_limit})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {importedRows.length === 0 ? (
              // Drag and drop uploader interface
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '48px 24px',
                border: '2px dashed rgba(255, 255, 255, 0.15)',
                borderRadius: 'var(--radius-lg)',
                background: 'rgba(255, 255, 255, 0.02)',
                textAlign: 'center',
                margin: '20px 0',
                transition: 'border-color var(--transition-normal)',
              }}
              onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--accent)'; }}
              onDragLeave={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'; }}
              onDrop={e => {
                e.preventDefault();
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                const file = e.dataTransfer.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const text = event.target?.result as string;
                    try {
                      const parsed = parseCSV(text);
                      setImportedRows(parsed);
                      const errs = runValidation(parsed, importTournamentId, importEventId);
                      setValidationErrors(errs);
                    } catch (err) {
                      console.error(err);
                      alert('Failed to parse dropped CSV file.');
                    }
                  };
                  reader.readAsText(file);
                }
              }}
              >
                <div style={{ fontSize: 40, marginBottom: 16 }}>📄</div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Drag and drop your roster CSV file here</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>or click to browse from your computer</p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  id="csv-file-picker"
                />
                <div style={{ display: 'flex', gap: 12 }}>
                  <label htmlFor="csv-file-picker" className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                    Browse File
                  </label>
                  <button className="btn btn-ghost" onClick={handleDownloadTemplate} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    📥 Download CSV Template
                  </button>
                </div>
              </div>
            ) : (
              // Interactive Validation / Correction Grid
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>
                    Parsed {importedRows.length} player rows. Double click any cell to edit details inline.
                  </span>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setImportedRows([]); setValidationErrors({}); }}>
                    🔄 Clear & Re-upload
                  </button>
                </div>

                {/* Validation warnings display */}
                {Object.keys(validationErrors).length > 0 && (
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    color: 'var(--score-loss)',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 16,
                    fontSize: 13,
                    fontWeight: 500,
                  }}>
                    ⚠️ Found {Object.keys(validationErrors).length} rows with validation errors. Please correct them below before saving.
                  </div>
                )}

                {/* Grid Table */}
                <div className="table-container" style={{ flex: 1, overflowY: 'auto', maxHeight: 380, border: '1px solid var(--border)' }}>
                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: 50 }}>Row</th>
                        <th>Player Name *</th>
                        <th>Email Address *</th>
                        <th>Phone</th>
                        <th>Age</th>
                        <th>Gender</th>
                        <th>DOB * (YYYY-MM-DD)</th>
                        <th>Partner Name (Opt)</th>
                        <th>Partner Email (Opt)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importedRows.map((row, idx) => {
                        const hasErrors = !!validationErrors[idx];
                        const errMsgs = validationErrors[idx] || [];
                        return (
                          <tr key={idx} style={{ background: hasErrors ? 'rgba(239, 68, 68, 0.04)' : undefined }}>
                            <td style={{ fontWeight: 600, color: hasErrors ? 'var(--score-loss)' : 'var(--text-muted)' }}>
                              {idx + 1}
                              {hasErrors && (
                                <span title={errMsgs.join('\n')} style={{ marginLeft: 6, cursor: 'help' }}>⚠️</span>
                              )}
                            </td>
                            {/* Editable Cells */}
                            <td>
                              <input
                                type="text"
                                className="input-grid"
                                value={row.name || ''}
                                onChange={e => handleRowEdit(idx, 'name', e.target.value)}
                                style={{
                                  border: 'none', background: 'transparent', padding: 4, width: '100%', color: 'var(--text-primary)',
                                  outline: !row.name ? '1px solid var(--score-loss)' : undefined
                                }}
                              />
                            </td>
                            <td>
                              <input
                                type="email"
                                className="input-grid"
                                value={row.email || ''}
                                onChange={e => handleRowEdit(idx, 'email', e.target.value)}
                                style={{
                                  border: 'none', background: 'transparent', padding: 4, width: '100%', color: 'var(--text-primary)',
                                  outline: !row.email || !row.email.includes('@') ? '1px solid var(--score-loss)' : undefined
                                }}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="input-grid"
                                value={row.phone || ''}
                                onChange={e => handleRowEdit(idx, 'phone', e.target.value)}
                                style={{ border: 'none', background: 'transparent', padding: 4, width: '100%', color: 'var(--text-primary)' }}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="input-grid"
                                value={row.age || ''}
                                onChange={e => handleRowEdit(idx, 'age', e.target.value)}
                                style={{ border: 'none', background: 'transparent', padding: 4, width: 40, color: 'var(--text-primary)' }}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="input-grid"
                                value={row.gender || ''}
                                onChange={e => handleRowEdit(idx, 'gender', e.target.value)}
                                style={{ border: 'none', background: 'transparent', padding: 4, width: 60, color: 'var(--text-primary)' }}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="input-grid"
                                placeholder="YYYY-MM-DD"
                                value={row.dob || ''}
                                onChange={e => handleRowEdit(idx, 'dob', e.target.value)}
                                style={{
                                  border: 'none', background: 'transparent', padding: 4, width: 100, color: 'var(--text-primary)',
                                  outline: hasErrors && errMsgs.some(m => m.includes('DOB') || m.includes('Age')) ? '1px solid var(--score-loss)' : undefined
                                }}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="input-grid"
                                value={row.partnername || ''}
                                onChange={e => handleRowEdit(idx, 'partnername', e.target.value)}
                                style={{ border: 'none', background: 'transparent', padding: 4, width: '100%', color: 'var(--text-primary)' }}
                              />
                            </td>
                            <td>
                              <input
                                type="email"
                                className="input-grid"
                                value={row.partneremail || ''}
                                onChange={e => handleRowEdit(idx, 'partneremail', e.target.value)}
                                style={{ border: 'none', background: 'transparent', padding: 4, width: '100%', color: 'var(--text-primary)' }}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
                  <button className="btn btn-secondary" onClick={() => { setImportedRows([]); setValidationErrors({}); setShowImportDrawer(false); }}>
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    disabled={Object.keys(validationErrors).length > 0 || isSavingImport}
                    onClick={handleConfirmImport}
                  >
                    {isSavingImport ? 'Saving...' : 'Confirm Batch Import'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PlayerProfileModal({
  player,
  onClose
}: {
  player: User;
  onClose: () => void;
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 420, padding: 24, borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Player Profile</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><IconX size={18} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center', marginBottom: 24 }}>
          {player.avatar ? (
            <img src={player.avatar} alt={player.name} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 700, color: '#fff',
              boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.4)'
            }}>
              {player.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h3 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{player.name}</h3>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
              {player.roles.map(r => (
                <span key={r} className="badge badge-accent" style={{ textTransform: 'capitalize', fontSize: 10 }}>{r}</span>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, background: 'var(--bg-secondary)', padding: 18, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Email Address</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{player.email}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Phone Number</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{player.phone || 'Not provided'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Age</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{player.age !== undefined && player.age !== null ? `${player.age} years` : 'Not provided'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 4 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Gender</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{player.gender || 'Not provided'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
