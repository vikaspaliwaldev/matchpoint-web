'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { mockCategories } from '@/lib/mock-data';
import { Tournament, TournamentEvent, TournamentStatus, EventCategory, EventFormat, ScoringFormat, MasterEvent } from '@/types';
import {
  getTournaments,
  getEventsByTournament,
  createTournament,
  createEvent,
  updateTournamentStatus,
  updateTournament,
  updateEvent,
  getMasterEvents,
} from '@/lib/supabase-service';
import {
  IconPlus,
  IconX,
  IconTrophy,
  IconCalendar,
  IconMapPin,
  IconEye,
  IconCheck,
} from '@/components/icons';

export default function TournamentsPage() {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [masterEvents, setMasterEvents] = useState<MasterEvent[]>([]);
  const [eventsMap, setEventsMap] = useState<Record<string, TournamentEvent[]>>({});
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<TournamentStatus | 'all'>('all');
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<TournamentEvent | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showEditEventModal, setShowEditEventModal] = useState(false);

  // Load all tournaments and events on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await getTournaments();
        const masters = await getMasterEvents();
        setMasterEvents(masters);

        // Strict deduplication to prevent key collisions
        const uniqueT = data.filter((t, i, self) => self.findIndex(x => x.id === t.id) === i);
        setTournaments(uniqueT);

        const map: Record<string, TournamentEvent[]> = {};
        await Promise.all(
          uniqueT.map(async t => {
            const evs = await getEventsByTournament(t.id);
            map[t.id] = evs;
          })
        );
        setEventsMap(map);
      } catch (err) {
        console.error('Failed to load tournaments:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = filterStatus === 'all' ? tournaments : tournaments.filter(t => t.status === filterStatus);

  const handleCreate = async (data: Partial<Tournament>) => {
    const newT: Tournament = {
      id: `t${Date.now()}`,
      slug: data.name!.toLowerCase().replace(/\s+/g, '-'),
      name: data.name!,
      description: data.description || '',
      location: data.location || '',
      start_date: data.start_date || '',
      end_date: data.end_date || '',
      type: data.type || 'individual',
      status: 'draft',
      created_by: user?.id || 'u1',
      created_at: new Date().toISOString(),
      team_size_limit: data.team_size_limit || 4,
      bonus_point_margin: data.bonus_point_margin || 5
    };
    try {
      await createTournament(newT, user ? { id: user.id, name: user.name } : null);
      setTournaments(prev => {
        if (prev.some(t => t.id === newT.id)) return prev;
        return [newT, ...prev];
      });
      setEventsMap(prev => ({ ...prev, [newT.id]: [] }));
      setShowCreateModal(false);
    } catch (err) {
      console.error('Failed to create tournament:', err);
    }
  };

  const handleStatusChange = async (id: string, status: TournamentStatus) => {
    try {
      await updateTournamentStatus(id, status);
      setTournaments(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    } catch (err) {
      console.error('Failed to update tournament status:', err);
    }
  };

  const handleUpdateTournament = async (data: Partial<Tournament>) => {
    if (!selectedTournament) return;
    try {
      await updateTournament(selectedTournament.id, data, user ? { id: user.id, name: user.name } : null);
      setTournaments(prev => prev.map(t => t.id === selectedTournament.id ? { ...t, ...data } : t));
      setShowEditModal(false);
      setSelectedTournament(null);
    } catch (err) {
      console.error('Failed to update tournament:', err);
      alert(err instanceof Error ? err.message : 'Failed to update tournament.');
    }
  };

  const handleUpdateEvent = async (data: Partial<TournamentEvent>) => {
    if (!selectedEvent || !selectedTournament) return;
    try {
      await updateEvent(selectedEvent.id, data, user ? { id: user.id, name: user.name } : null);
      setEventsMap(prev => {
        const list = prev[selectedTournament.id] || [];
        const next = list.map(e => e.id === selectedEvent.id ? { ...e, ...data } : e);
        return { ...prev, [selectedTournament.id]: next };
      });
      setShowEditEventModal(false);
      setSelectedEvent(null);
      setSelectedTournament(null);
    } catch (err) {
      console.error('Failed to update event:', err);
      alert(err instanceof Error ? err.message : 'Failed to update event.');
    }
  };

  const getEventsForTournament = (tid: string) => eventsMap[tid] || [];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Tournaments</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>Create and manage your tournaments</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <IconPlus size={16} /> New Tournament
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="tab-group" style={{ marginBottom: 24, display: 'inline-flex' }}>
        {(['all', 'draft', 'open', 'live', 'completed', 'cancelled'] as const).map(status => (
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

      {/* Tournament List */}
      {loading ? (
        <div className="glass-card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div className="animate-spin" style={{ display: 'inline-block', fontSize: 24, marginBottom: 12, animation: 'spin 2s linear infinite' }}>🔄</div>
          <p style={{ fontSize: 15, fontWeight: 500 }}>Loading Tournaments & Events...</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gap: 16 }}>
            {filtered.map(t => {
              const events = getEventsForTournament(t.id);
              const isReadOnly = t.status === 'completed' || t.status === 'cancelled';
              
              return (
                <div key={t.id} className="glass-card animate-slide-up stagger-item" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ display: 'flex' }}>
                    {/* Color bar */}
                    <div style={{
                      width: 4,
                      background: t.status === 'live' ? 'var(--score-live)' :
                        t.status === 'open' ? 'var(--status-open)' :
                        t.status === 'completed' ? 'var(--status-completed)' :
                        'var(--border)',
                    }} />
                    <div style={{ flex: 1, padding: '20px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                            <h3 style={{ fontSize: 18, fontWeight: 600 }}>{t.name}</h3>
                            <span className={`badge badge-${t.status}`}>{t.status}</span>
                            <span className="badge badge-accent" style={{ textTransform: 'capitalize' }}>{t.type}</span>
                          </div>
                          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, maxWidth: 600 }}>{t.description}</p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 13, color: 'var(--text-muted)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <IconCalendar size={14} />
                              {new Date(t.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} — {new Date(t.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <IconMapPin size={14} />
                              {t.location}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <IconTrophy size={14} />
                              {events.length} events
                            </span>
                          </div>

                          {/* Events chips with quick edit support */}
                          {events.length > 0 && (
                            <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
                              {events.map(ev => (
                                <span key={ev.id} className="badge" style={{
                                  background: 'var(--bg-elevated)',
                                  color: 'var(--text-secondary)',
                                  fontSize: 11,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6
                                }}>
                                  {ev.event_name} ({ev.registrations_count || 0}/{ev.entry_limit})
                                  {!isReadOnly && (
                                    <button 
                                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 10, padding: 0 }}
                                      onClick={() => { setSelectedEvent(ev); setSelectedTournament(t); setShowEditEventModal(true); }}
                                      title="Edit Event"
                                    >
                                      ✏️
                                    </button>
                                  )}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginLeft: 20 }}>
                          <Link href={`/tournament/${t.slug}`} className="btn btn-ghost btn-sm">
                            <IconEye size={14} /> Public Page
                          </Link>
                          
                          {!isReadOnly && (
                            <>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => { setSelectedTournament(t); setShowEventModal(true); }}
                              >
                                <IconPlus size={14} /> Add Event
                              </button>
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => { setSelectedTournament(t); setShowEditModal(true); }}
                              >
                                Edit Tournament
                              </button>
                            </>
                          )}
                          
                          {t.status === 'draft' && (
                            <button className="btn btn-primary btn-sm" onClick={() => handleStatusChange(t.id, 'open')}>
                              Open Registration
                            </button>
                          )}
                          {t.status === 'open' && (
                            <button className="btn btn-primary btn-sm" style={{ background: 'var(--score-live)' }} onClick={() => handleStatusChange(t.id, 'live')}>
                              Go Live
                            </button>
                          )}
                          {t.status === 'live' && (
                            <button className="btn btn-secondary btn-sm" onClick={() => handleStatusChange(t.id, 'completed')}>
                              Complete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="empty-state" style={{ marginTop: 40 }}>
              <div className="empty-state-icon">🏆</div>
              <p style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>No tournaments found</p>
              <p style={{ fontSize: 14 }}>Create your first tournament to get started</p>
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowCreateModal(true)}>
                <IconPlus size={16} /> Create Tournament
              </button>
            </div>
          )}
        </>
      )}

      {/* Create Tournament Modal */}
      {showCreateModal && (
        <CreateTournamentModal
          masterEvents={masterEvents}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreate}
        />
      )}

      {/* Edit Tournament Modal */}
      {showEditModal && selectedTournament && (
        <EditTournamentModal
          tournament={selectedTournament}
          masterEvents={masterEvents}
          onClose={() => { setShowEditModal(false); setSelectedTournament(null); }}
          onUpdate={handleUpdateTournament}
        />
      )}

      {/* Edit Event Modal */}
      {showEditEventModal && selectedEvent && (
        <EditEventModal
          event={selectedEvent}
          masterEvents={masterEvents}
          onClose={() => { setShowEditEventModal(false); setSelectedEvent(null); setSelectedTournament(null); }}
          onUpdate={handleUpdateEvent}
        />
      )}

      {/* Add Event Modal */}
      {showEventModal && selectedTournament && (
        <AddEventModal
          tournament={selectedTournament}
          masterEvents={masterEvents}
          onClose={() => { setShowEventModal(false); setSelectedTournament(null); }}
          onEventAdded={(newEvent) => {
            setEventsMap(prev => {
              const current = prev[selectedTournament.id] || [];
              if (current.some(e => e.id === newEvent.id)) return prev;
              return {
                ...prev,
                [selectedTournament.id]: [...current, newEvent]
              };
            });
          }}
        />
      )}
    </div>
  );
}

function CreateTournamentModal({
  masterEvents,
  onClose,
  onCreate,
}: {
  masterEvents: MasterEvent[];
  onClose: () => void;
  onCreate: (data: Partial<Tournament>) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [type, setType] = useState<'individual' | 'team'>('individual');
  const [dateError, setDateError] = useState('');
  const [teamSizeLimit, setTeamSizeLimit] = useState(6);
  const [teamTieConfigs, setTeamTieConfigs] = useState<{ event_id: string; name: string; count: number }[]>([]);
  const [selectedMasterEventId, setSelectedMasterEventId] = useState('');
  const [subMatchCount, setSubMatchCount] = useState(1);
  const [bonusPointMargin, setBonusPointMargin] = useState(5);
  const [bonusPointValue, setBonusPointValue] = useState(1);

  // Initialize selectedMasterEventId when masterEvents is loaded
  useEffect(() => {
    if (masterEvents && masterEvents.length > 0) {
      setSelectedMasterEventId(masterEvents[0].id);
    }
  }, [masterEvents]);

  // Premium inline date validation
  useEffect(() => {
    if (startDate && endDate && endDate < startDate) {
      setDateError('End Date cannot be earlier than Start Date.');
    } else {
      setDateError('');
    }
  }, [startDate, endDate]);

  const handleAddTieConfig = () => {
    const master = masterEvents.find(e => e.id === selectedMasterEventId);
    if (!master) return;

    setTeamTieConfigs(prev => {
      const idx = prev.findIndex(c => c.event_id === selectedMasterEventId);
      if (idx !== -1) {
        const next = [...prev];
        next[idx].count += subMatchCount;
        return next;
      }
      return [...prev, { event_id: master.id, name: master.name, count: subMatchCount }];
    });
    setSubMatchCount(1);
  };

  const handleRemoveTieConfig = (eventId: string) => {
    setTeamTieConfigs(prev => prev.filter(c => c.event_id !== eventId));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 580 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Create Tournament</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><IconX size={18} /></button>
        </div>
        <form onSubmit={e => {
          e.preventDefault();
          if (dateError) return;
          if (type === 'team' && teamTieConfigs.length === 0) return;
          
          // Map to tie events array for backwards compat
          const flatTieEvents = teamTieConfigs.flatMap(c => Array(c.count).fill(c.name));

          onCreate({
            name,
            description,
            location,
            start_date: startDate,
            end_date: endDate,
            type,
            team_size_limit: type === 'team' ? Number(teamSizeLimit) : undefined,
            team_tie_configs: type === 'team' ? teamTieConfigs : undefined,
            team_tie_events: type === 'team' ? flatTieEvents : undefined,
            bonus_point_margin: type === 'team' ? Number(bonusPointMargin) : undefined,
            bonus_point_value: type === 'team' ? Number(bonusPointValue) : undefined,
          });
        }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="input-group">
            <label className="input-label" htmlFor="t-name">Tournament Name *</label>
            <input id="t-name" className="input" placeholder="e.g., Mumbai Open 2025" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="t-desc">Description</label>
            <textarea id="t-desc" className="input" placeholder="Tournament description..." value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="t-loc">Location</label>
            <input id="t-loc" className="input" placeholder="Venue, City" value={location} onChange={e => setLocation(e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="input-group">
              <label className="input-label" htmlFor="t-start">Start Date</label>
              <input id="t-start" type="date" className="input" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="t-end">End Date</label>
              <input id="t-end" type="date" className="input" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate} />
            </div>
          </div>
          {dateError && (
            <div style={{
              color: 'var(--score-loss)',
              fontSize: 13,
              fontWeight: 500,
              background: 'rgba(239, 68, 68, 0.1)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              marginTop: -4,
              animation: 'shake 0.3s ease-in-out'
            }}>
              ⚠️ {dateError}
            </div>
          )}
          <div className="input-group">
            <label className="input-label">Type</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['individual', 'team'] as const).map(t => (
                <label key={t} style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${type === t ? 'var(--accent)' : 'var(--border)'}`,
                  background: type === t ? 'var(--accent-subtle)' : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'center',
                  fontSize: 14,
                  fontWeight: 500,
                  textTransform: 'capitalize',
                  transition: 'all var(--transition-fast)',
                }}>
                  <input type="radio" name="type" value={t} checked={type === t} onChange={() => setType(t)} style={{ display: 'none' }} />
                  {t}
                </label>
              ))}
            </div>
          </div>

          {/* Team configurations view */}
          {type === 'team' && (
            <div className="glass-card animate-slide-up" style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}>
              <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                🛡️ Team Tournament Setup
              </h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="input-group">
                  <label className="input-label" htmlFor="t-size">Team Roster Size Limit</label>
                  <input
                    id="t-size"
                    type="number"
                    className="input"
                    min="2"
                    max="20"
                    value={teamSizeLimit}
                    onChange={e => setTeamSizeLimit(Number(e.target.value))}
                    required
                  />
                </div>
                <div className="input-group">
                  <label className="input-label" htmlFor="t-bonus">Set Margin for Bonus Point</label>
                  <input
                    id="t-bonus"
                    type="number"
                    className="input"
                    min="1"
                    max="30"
                    value={bonusPointMargin}
                    onChange={e => setBonusPointMargin(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              {/* Dynamic event configuration panel from Master Events Table */}
              <div className="input-group" style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                <label className="input-label">Configure Tie Events (From Master Event Table) *</label>
                
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 12 }}>
                  <div style={{ flex: 2 }}>
                    <label className="input-label" style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Select Event Master</label>
                    <select
                      className="input"
                      value={selectedMasterEventId}
                      onChange={e => setSelectedMasterEventId(e.target.value)}
                      style={{ height: 42 }}
                    >
                      {masterEvents.map(me => (
                        <option key={me.id} value={me.id}>{me.name} ({me.category})</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="input-label" style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Matches Quantity</label>
                    <input
                      type="number"
                      className="input"
                      min="1"
                      max="10"
                      value={subMatchCount}
                      onChange={e => setSubMatchCount(Number(e.target.value))}
                      style={{ height: 42 }}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleAddTieConfig}
                    style={{ height: 42, padding: '0 16px', whiteSpace: 'nowrap' }}
                  >
                    + Add to Tie
                  </button>
                </div>

                {/* List of configured match formats */}
                {teamTieConfigs.length === 0 ? (
                  <div style={{ padding: '16px', border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                    No tie events configured yet. Configure events above.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: 'var(--bg-secondary)', padding: 10, borderRadius: 'var(--radius-md)' }}>
                    {teamTieConfigs.map(config => (
                      <div key={config.event_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elevated)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>
                          🏸 {config.name} <span style={{ color: 'var(--accent)', marginLeft: 8 }}>x {config.count} match{config.count !== 1 ? 'es' : ''}</span>
                        </span>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--score-loss)', padding: '2px 6px', fontSize: 11 }}
                          onClick={() => handleRemoveTieConfig(config.event_id)}
                        >
                          ✕ Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 8 }} disabled={!!dateError || (type === 'team' && teamTieConfigs.length === 0)}>
            Create Tournament
          </button>
        </form>
      </div>
    </div>
  );
}

function AddEventModal({
  tournament,
  masterEvents,
  onClose,
  onEventAdded,
}: {
  tournament: Tournament;
  masterEvents: MasterEvent[];
  onClose: () => void;
  onEventAdded: (newEvent: TournamentEvent) => void;
}) {
  const [selectedMasterId, setSelectedMasterId] = useState('');
  const [eventName, setEventName] = useState('');
  const [category, setCategory] = useState<EventCategory>('MS');
  const [entryLimit, setEntryLimit] = useState('32');
  const [format, setFormat] = useState<EventFormat>('knockout');
  const [scoringFormat, setScoringFormat] = useState<ScoringFormat>('21-point');

  // Dynamic categories adding state
  const [categories, setCategories] = useState(mockCategories);
  const [showAddCustomCategory, setShowAddCustomCategory] = useState(false);
  const [customCategoryCode, setCustomCategoryCode] = useState('');
  const [customCategoryName, setCustomCategoryName] = useState('');

  // Handle master event template selection
  const handleMasterSelectChange = (meId: string) => {
    setSelectedMasterId(meId);
    if (meId === 'custom') {
      return;
    }
    const template = masterEvents.find(me => me.id === meId);
    if (template) {
      setEventName(template.name);
      setCategory(template.category);
      setFormat(template.format || 'knockout');
      setScoringFormat(template.scoring_format || '21-point');
    }
  };

  // Pre-select first template on load
  useEffect(() => {
    if (masterEvents && masterEvents.length > 0) {
      handleMasterSelectChange(masterEvents[0].id);
    } else {
      setSelectedMasterId('custom');
    }
  }, [masterEvents]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newEvent: TournamentEvent = {
      id: `e${Date.now()}`,
      tournament_id: tournament.id,
      event_name: eventName,
      category,
      entry_limit: parseInt(entryLimit),
      format,
      registrations_count: 0,
      scoring_format: scoringFormat,
    };
    try {
      await createEvent(newEvent);
      onEventAdded(newEvent);
      onClose();
    } catch (err) {
      console.error('Failed to create event:', err);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>Add Event</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{tournament.name}</p>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><IconX size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Master Event Template Dropdown */}
          <div className="input-group" style={{ background: 'var(--accent-subtle)', padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid rgba(var(--accent-rgb), 0.15)' }}>
            <label className="input-label" htmlFor="me-select" style={{ color: 'var(--accent)', fontWeight: 600 }}>🏸 Select Event Template (Master Event Table) *</label>
            <select
              id="me-select"
              className="input"
              value={selectedMasterId}
              onChange={e => handleMasterSelectChange(e.target.value)}
              style={{ background: 'var(--bg-primary)' }}
            >
              {masterEvents.map(me => (
                <option key={me.id} value={me.id}>{me.name} ({me.category})</option>
              ))}
              <option value="custom">-- Custom / Other Event --</option>
            </select>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
              {selectedMasterId !== 'custom' ? '✅ Initialized parameters from global master event template' : '✍️ Custom fields activated below'}
            </div>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="e-name">Event Name *</label>
            <input id="e-name" className="input" placeholder="e.g., Men's Singles" value={eventName} onChange={e => { setEventName(e.target.value); setSelectedMasterId('custom'); }} required />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="input-group">
              <label className="input-label" htmlFor="e-cat">Category</label>
              {!showAddCustomCategory ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <select
                    id="e-cat"
                    className="input"
                    value={category}
                    onChange={e => { setCategory(e.target.value); setSelectedMasterId('custom'); }}
                    style={{ flex: 1 }}
                  >
                    {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowAddCustomCategory(true)}
                    style={{ padding: '0 12px', height: 42, fontSize: 13, whiteSpace: 'nowrap' }}
                  >
                    + Custom
                  </button>
                </div>
              ) : (
                <div className="glass-card" style={{ padding: 12, border: '1px solid var(--border)', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Add Custom Category</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        className="input"
                        placeholder="Code (e.g. U19S)"
                        value={customCategoryCode}
                        onChange={e => setCustomCategoryCode(e.target.value.toUpperCase())}
                        style={{ flex: 1, fontSize: 12, height: 36, padding: '0 8px' }}
                      />
                      <input
                        className="input"
                        placeholder="Name (e.g. U-19 Singles)"
                        value={customCategoryName}
                        onChange={e => setCustomCategoryName(e.target.value)}
                        style={{ flex: 2, fontSize: 12, height: 36, padding: '0 8px' }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          setShowAddCustomCategory(false);
                          setCustomCategoryCode('');
                          setCustomCategoryName('');
                        }}
                        style={{ fontSize: 11, padding: '2px 8px' }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          if (customCategoryCode.trim() && customCategoryName.trim()) {
                            const newCat = { value: customCategoryCode.trim(), label: customCategoryName.trim() };
                            mockCategories.push(newCat);
                            setCategories([...mockCategories]);
                            setCategory(customCategoryCode.trim());
                            setSelectedMasterId('custom');
                            setShowAddCustomCategory(false);
                            setCustomCategoryCode('');
                            setCustomCategoryName('');
                          }
                        }}
                        style={{ fontSize: 11, padding: '2px 8px' }}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="e-format">Format</label>
              <select id="e-format" className="input" value={format} onChange={e => setFormat(e.target.value as EventFormat)}>
                <option value="knockout">Knockout</option>
                <option value="round_robin">Round Robin</option>
                <option value="swiss">Swiss</option>
                <option value="league">League</option>
              </select>
            </div>
          </div>

          {/* Scoring Config Options */}
          <div className="input-group">
            <label className="input-label">Scoring Format</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {[
                { value: '11-point', label: '11-Pt BWF Game', desc: 'Deuce 10, Golden 15' },
                { value: '15-point', label: '15-Pt Classic', desc: 'Deuce 14, Golden 21' },
                { value: '21-point', label: '21-Pt Standard', desc: 'Deuce 20, Golden 30' },
              ].map(fmt => (
                <label key={fmt.value} style={{
                  padding: '12px 8px',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${scoringFormat === fmt.value ? 'var(--accent)' : 'var(--border)'}`,
                  background: scoringFormat === fmt.value ? 'var(--accent-subtle)' : 'var(--bg-elevated)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all var(--transition-fast)',
                }}>
                  <input type="radio" name="scoringFormat" value={fmt.value} checked={scoringFormat === fmt.value} onChange={() => { setScoringFormat(fmt.value as ScoringFormat); setSelectedMasterId('custom'); }} style={{ display: 'none' }} />
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{fmt.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{fmt.desc}</div>
                </label>
              ))}
            </div>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="e-limit">Entry Limit</label>
            <input id="e-limit" type="number" className="input" value={entryLimit} onChange={e => setEntryLimit(e.target.value)} min="2" max="256" />
          </div>
          
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 8 }}>
            Add Event
          </button>
        </form>
      </div>
    </div>
  );
}

function EditTournamentModal({
  tournament,
  masterEvents,
  onClose,
  onUpdate
}: {
  tournament: Tournament;
  masterEvents: MasterEvent[];
  onClose: () => void;
  onUpdate: (data: Partial<Tournament>) => void;
}) {
  const [name, setName] = useState(tournament.name);
  const [description, setDescription] = useState(tournament.description || '');
  const [location, setLocation] = useState(tournament.location || '');
  const [startDate, setStartDate] = useState(tournament.start_date || '');
  const [endDate, setEndDate] = useState(tournament.end_date || '');
  const [type, setType] = useState(tournament.type);
  const [dateError, setDateError] = useState('');
  const [teamSizeLimit, setTeamSizeLimit] = useState(tournament.team_size_limit || 6);
  const [teamTieConfigs, setTeamTieConfigs] = useState<{ event_id: string; name: string; count: number }[]>(tournament.team_tie_configs || []);
  const [selectedMasterEventId, setSelectedMasterEventId] = useState('');
  const [subMatchCount, setSubMatchCount] = useState(1);
  const [bonusPointMargin, setBonusPointMargin] = useState(tournament.bonus_point_margin || 5);
  const [bonusPointValue, setBonusPointValue] = useState(tournament.bonus_point_value || 1);

  // Initialize selectedMasterEventId when masterEvents is loaded
  useEffect(() => {
    if (masterEvents && masterEvents.length > 0) {
      setSelectedMasterEventId(masterEvents[0].id);
    }
  }, [masterEvents]);

  useEffect(() => {
    if (startDate && endDate && endDate < startDate) {
      setDateError('End Date cannot be earlier than Start Date.');
    } else {
      setDateError('');
    }
  }, [startDate, endDate]);

  const handleAddTieConfig = () => {
    const master = masterEvents.find(e => e.id === selectedMasterEventId);
    if (!master) return;

    setTeamTieConfigs(prev => {
      const idx = prev.findIndex(c => c.event_id === selectedMasterEventId);
      if (idx !== -1) {
        const next = [...prev];
        next[idx].count += subMatchCount;
        return next;
      }
      return [...prev, { event_id: master.id, name: master.name, count: subMatchCount }];
    });
    setSubMatchCount(1);
  };

  const handleRemoveTieConfig = (eventId: string) => {
    setTeamTieConfigs(prev => prev.filter(c => c.event_id !== eventId));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 580 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Edit Tournament</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><IconX size={18} /></button>
        </div>
        <form onSubmit={e => {
          e.preventDefault();
          if (dateError) return;
          if (type === 'team' && teamTieConfigs.length === 0) return;
          
          // Map to tie events array for backwards compat
          const flatTieEvents = teamTieConfigs.flatMap(c => Array(c.count).fill(c.name));

          onUpdate({
            name,
            description,
            location,
            start_date: startDate,
            end_date: endDate,
            type,
            team_size_limit: type === 'team' ? Number(teamSizeLimit) : undefined,
            team_tie_configs: type === 'team' ? teamTieConfigs : undefined,
            team_tie_events: type === 'team' ? flatTieEvents : undefined,
            bonus_point_margin: type === 'team' ? Number(bonusPointMargin) : undefined,
            bonus_point_value: type === 'team' ? Number(bonusPointValue) : undefined,
          });
        }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="input-group">
            <label className="input-label" htmlFor="edit-t-name">Tournament Name *</label>
            <input id="edit-t-name" className="input" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="edit-t-desc">Description</label>
            <textarea id="edit-t-desc" className="input" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="edit-t-loc">Location</label>
            <input id="edit-t-loc" className="input" value={location} onChange={e => setLocation(e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="input-group">
              <label className="input-label" htmlFor="edit-t-start">Start Date</label>
              <input id="edit-t-start" type="date" className="input" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="edit-t-end">End Date</label>
              <input id="edit-t-end" type="date" className="input" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate} />
            </div>
          </div>
          {dateError && (
            <div style={{
              color: 'var(--score-loss)',
              fontSize: 13,
              fontWeight: 500,
              background: 'rgba(239, 68, 68, 0.1)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              marginTop: -4
            }}>
              ⚠️ {dateError}
            </div>
          )}
          
          <div className="input-group">
            <label className="input-label">Type</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['individual', 'team'] as const).map(t => (
                <label key={t} style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${type === t ? 'var(--accent)' : 'var(--border)'}`,
                  background: type === t ? 'var(--accent-subtle)' : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'center',
                  fontSize: 14,
                  fontWeight: 500,
                  textTransform: 'capitalize',
                  transition: 'all var(--transition-fast)',
                }}>
                  <input type="radio" name="edit-type" value={t} checked={type === t} onChange={() => setType(t)} style={{ display: 'none' }} />
                  {t}
                </label>
              ))}
            </div>
          </div>

          {/* Team configurations view */}
          {type === 'team' && (
            <div className="glass-card animate-slide-up" style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}>
              <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                🛡️ Team Tournament Setup
              </h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="input-group">
                  <label className="input-label" htmlFor="edit-t-size">Team Roster Size Limit</label>
                  <input
                    id="edit-t-size"
                    type="number"
                    className="input"
                    min="2"
                    max="20"
                    value={teamSizeLimit}
                    onChange={e => setTeamSizeLimit(Number(e.target.value))}
                    required
                  />
                </div>
                <div className="input-group">
                  <label className="input-label" htmlFor="edit-t-bonus">Set Margin for Bonus Point</label>
                  <input
                    id="edit-t-bonus"
                    type="number"
                    className="input"
                    min="1"
                    max="30"
                    value={bonusPointMargin}
                    onChange={e => setBonusPointMargin(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              {/* Dynamic event configuration panel from Master Events Table */}
              <div className="input-group" style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                <label className="input-label">Configure Tie Events (From Master Event Table) *</label>
                
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 12 }}>
                  <div style={{ flex: 2 }}>
                    <label className="input-label" style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Select Event Master</label>
                    <select
                      className="input"
                      value={selectedMasterEventId}
                      onChange={e => setSelectedMasterEventId(e.target.value)}
                      style={{ height: 42 }}
                    >
                      {masterEvents.map(me => (
                        <option key={me.id} value={me.id}>{me.name} ({me.category})</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="input-label" style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Matches Quantity</label>
                    <input
                      type="number"
                      className="input"
                      min="1"
                      max="10"
                      value={subMatchCount}
                      onChange={e => setSubMatchCount(Number(e.target.value))}
                      style={{ height: 42 }}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleAddTieConfig}
                    style={{ height: 42, padding: '0 16px', whiteSpace: 'nowrap' }}
                  >
                    + Add to Tie
                  </button>
                </div>

                {/* List of configured match formats */}
                {teamTieConfigs.length === 0 ? (
                  <div style={{ padding: '16px', border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                    No tie events configured yet. Configure events above.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: 'var(--bg-secondary)', padding: 10, borderRadius: 'var(--radius-md)' }}>
                    {teamTieConfigs.map(config => (
                      <div key={config.event_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elevated)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>
                          🏸 {config.name} <span style={{ color: 'var(--accent)', marginLeft: 8 }}>x {config.count} match{config.count !== 1 ? 'es' : ''}</span>
                        </span>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--score-loss)', padding: '2px 6px', fontSize: 11 }}
                          onClick={() => handleRemoveTieConfig(config.event_id)}
                        >
                          ✕ Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 8 }} disabled={!!dateError || (type === 'team' && teamTieConfigs.length === 0)}>
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}

function EditEventModal({
  event,
  masterEvents,
  onClose,
  onUpdate
}: {
  event: TournamentEvent;
  masterEvents: MasterEvent[];
  onClose: () => void;
  onUpdate: (data: Partial<TournamentEvent>) => void;
}) {
  const [selectedMasterId, setSelectedMasterId] = useState('custom');
  const [eventName, setEventName] = useState(event.event_name);
  const [category, setCategory] = useState(event.category);
  const [entryLimit, setEntryLimit] = useState(event.entry_limit);
  const [format, setFormat] = useState(event.format);
  const [scoringFormat, setScoringFormat] = useState(event.scoring_format || '21-point');

  // Handle master event template selection
  const handleMasterSelectChange = (meId: string) => {
    setSelectedMasterId(meId);
    if (meId === 'custom') {
      return;
    }
    const template = masterEvents.find(me => me.id === meId);
    if (template) {
      setEventName(template.name);
      setCategory(template.category);
      setFormat(template.format || 'knockout');
      setScoringFormat(template.scoring_format || '21-point');
    }
  };

  // Detect matching template on mount or event change
  useEffect(() => {
    const matched = masterEvents.find(
      me => me.name.toLowerCase() === event.event_name.toLowerCase() || me.category === event.category
    );
    if (matched) {
      setSelectedMasterId(matched.id);
    } else {
      setSelectedMasterId('custom');
    }
  }, [event, masterEvents]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Edit Event</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><IconX size={18} /></button>
        </div>
        <form onSubmit={e => {
          e.preventDefault();
          onUpdate({ event_name: eventName, category, entry_limit: Number(entryLimit), format, scoring_format: scoringFormat });
        }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Master Event Template Dropdown */}
          <div className="input-group" style={{ background: 'var(--accent-subtle)', padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid rgba(var(--accent-rgb), 0.15)' }}>
            <label className="input-label" htmlFor="edit-me-select" style={{ color: 'var(--accent)', fontWeight: 600 }}>🏸 Select Event Template (Master Event Table)</label>
            <select
              id="edit-me-select"
              className="input"
              value={selectedMasterId}
              onChange={e => handleMasterSelectChange(e.target.value)}
              style={{ background: 'var(--bg-primary)' }}
            >
              {masterEvents.map(me => (
                <option key={me.id} value={me.id}>{me.name} ({me.category})</option>
              ))}
              <option value="custom">-- Custom / Other Event --</option>
            </select>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
              {selectedMasterId !== 'custom' ? '✅ Linked with global master event template' : '✍️ Decoupled custom event parameters'}
            </div>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="edit-ev-name">Event Name *</label>
            <input id="edit-ev-name" className="input" value={eventName} onChange={e => { setEventName(e.target.value); setSelectedMasterId('custom'); }} required />
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="edit-ev-cat">Category *</label>
            <input id="edit-ev-cat" className="input" value={category} onChange={e => { setCategory(e.target.value); setSelectedMasterId('custom'); }} required />
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="edit-ev-limit">Entry Limit *</label>
            <input id="edit-ev-limit" type="number" className="input" value={entryLimit} onChange={e => setEntryLimit(Number(e.target.value))} required />
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="edit-ev-format">Format</label>
            <select id="edit-ev-format" className="input" value={format} onChange={e => setFormat(e.target.value as any)}>
              <option value="knockout">Knockout</option>
              <option value="round_robin">Round Robin</option>
              <option value="swiss">Swiss</option>
              <option value="league">League</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="edit-ev-scoring">Scoring Rules</label>
            <select id="edit-ev-scoring" className="input" value={scoringFormat} onChange={e => setScoringFormat(e.target.value as any)}>
              <option value="11-point">11-Point (Golden at 15) BWF Compliant</option>
              <option value="15-point">15-Point (Golden at 21) BWF Compliant</option>
              <option value="21-point">21-Point (Golden at 30) BWF Compliant</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 8 }}>
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}
