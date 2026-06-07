'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Tournament, TournamentEvent, TournamentStatus, EventCategory, EventFormat, ScoringFormat, MasterEvent, TournamentMedia, User } from '@/types';
import CertificateBuilder from '@/components/CertificateBuilder';
import ShuttlecockLoader from '@/components/ShuttlecockLoader';
import {
  getTournaments,
  getEventsByTournament,
  createTournament,
  createEvent,
  updateTournamentStatus,
  updateTournament,
  updateEvent,
  deleteEvent,
  getMasterEvents,
  getTournamentMedia,
  uploadTournamentMedia,
  deleteTournamentMedia,
  getAllProfiles,
  connectStripeConnect,
} from '@/lib/supabase-service';
import {
  IconPlus,
  IconX,
  IconTrophy,
  IconCalendar,
  IconMapPin,
  IconEye,
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconSettings,
} from '@/components/icons';

export default function TournamentsPage() {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [masterEvents, setMasterEvents] = useState<MasterEvent[]>([]);
  const [eventsMap, setEventsMap] = useState<Record<string, TournamentEvent[]>>({});
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<TournamentStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<TournamentEvent | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showEditEventModal, setShowEditEventModal] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);

  // Load all tournaments and events on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await getTournaments();
        const masters = await getMasterEvents();
        setMasterEvents(masters);

        // Filter tournaments: super-admins see all, others see created or delegated co-admin tournaments
        const filteredT = user?.role === 'admin' ? data : data.filter(t => 
          user?.id && (t.created_by === user.id || (t.admins && t.admins.includes(user.id)))
        );

        // Strict deduplication to prevent key collisions
        const uniqueT = filteredT.filter((t, i, self) => self.findIndex(x => x.id === t.id) === i);
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

  const filtered = tournaments.filter(t => {
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    const matchesSearch = searchQuery.trim() === '' ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.location && t.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const handleCreate = async (data: Partial<Tournament>): Promise<boolean> => {
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
      team_size_limit: data.team_size_limit,
      bonus_point_margin: data.bonus_point_margin,
      bonus_point_value: data.bonus_point_value,
      team_tie_configs: data.team_tie_configs,
      team_tie_events: data.team_tie_events,
      collects_fees: data.collects_fees || false,
      entry_fee: data.entry_fee ? Number(data.entry_fee) : 0,
      currency: data.currency || 'INR',
    };
    try {
      await createTournament(newT, user ? { id: user.id, name: user.name } : null);
      
      let createdEvents: TournamentEvent[] = [];
      if (newT.type === 'team') {
        // 1. Create a default "Team Event" representing registration/team matching
        const mainEvent: TournamentEvent = {
          id: `e${Date.now()}-team-main`,
          tournament_id: newT.id,
          master_event_id: 'team_open',
          event_name: 'Team Event',
          category: 'TEAM',
          entry_limit: 32,
          format: 'league',
          registrations_count: 0,
          scoring_format: '21-point',
          gender_restriction: 'open',
          age_limit: 0,
          age_restriction_type: 'max',
        };
        await createEvent(mainEvent);
        createdEvents.push(mainEvent);

        // 2. Create sub-events for the selected tie configurations
        if (newT.team_tie_configs && newT.team_tie_configs.length > 0) {
          for (let i = 0; i < newT.team_tie_configs.length; i++) {
            const config = newT.team_tie_configs[i];
            const subEvent: TournamentEvent = {
              id: `e${Date.now()}-team-sub-${config.event_id}-${i}`,
              tournament_id: newT.id,
              master_event_id: config.event_id,
              event_name: config.name,
              category: config.event_id.toUpperCase(),
              entry_limit: 32,
              format: 'knockout',
              registrations_count: 0,
              scoring_format: '21-point',
              gender_restriction: config.event_id.toLowerCase().includes('women') ? 'women' : config.event_id.toLowerCase().includes('men') ? 'men' : 'open',
              age_limit: 0,
              age_restriction_type: 'max',
            };
            await createEvent(subEvent);
            createdEvents.push(subEvent);
          }
        }
        setEventsMap(prev => ({ ...prev, [newT.id]: createdEvents }));
      } else {
        setEventsMap(prev => ({ ...prev, [newT.id]: [] }));
      }

      setTournaments(prev => {
        if (prev.some(t => t.id === newT.id)) return prev;
        return [newT, ...prev];
      });
      setShowCreateModal(false);
      return true;
    } catch (err: any) {
      console.error('Failed to create tournament:', err);
      throw err;
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
  
  const handleConnectStripe = async (tournamentId: string) => {
    try {
      const url = await connectStripeConnect(tournamentId);
      window.location.href = url;
    } catch (err: any) {
      console.error('Failed to link Stripe Connect account:', err);
      alert(err.message || 'Failed to initiate Stripe onboarding. Please try again.');
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

  const handleDeleteEvent = async (eventId: string) => {
    if (!selectedTournament) return;
    try {
      await deleteEvent(eventId, user ? { id: user.id, name: user.name } : null);
      setEventsMap(prev => {
        const list = prev[selectedTournament.id] || [];
        const next = list.filter(e => e.id !== eventId);
        return { ...prev, [selectedTournament.id]: next };
      });
      setShowEditEventModal(false);
      setSelectedEvent(null);
      setSelectedTournament(null);
    } catch (err) {
      console.error('Failed to delete event:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete event.');
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

      {/* Filter & Search Bar Row */}
      <div style={{ marginBottom: 24, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Filter Tabs */}
        <div className="tab-group" style={{ display: 'inline-flex' }}>
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

        {/* Search Bar */}
        <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
          <input
            type="text"
            className="input"
            placeholder="Search tournaments by name, location, or description..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingRight: searchQuery ? 32 : 12, height: 38 }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: 14,
                padding: 0
              }}
            >
              <IconX size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Tournament List */}
      {loading ? (
        <div className="glass-card" style={{ padding: 48 }}>
          <ShuttlecockLoader message="Loading Tournaments & Events..." />
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
                            {t.age_cutoff_date && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent)', fontWeight: 500 }}>
                                🛡️ Cutoff: {new Date(t.age_cutoff_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            )}
                            {t.collects_fees && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent)', fontWeight: 600 }}>
                                💳 Entry Fee: {t.entry_fee} {t.currency}
                              </span>
                            )}
                            {t.collects_fees && (
                              t.stripe_account_id ? (
                                <span style={{ color: '#22c55e', fontWeight: 600 }}>
                                  🟢 Stripe Connected
                                </span>
                              ) : (
                                <span style={{ color: '#ef4444', fontWeight: 600 }}>
                                  ⚠️ Payouts Setup Pending
                                </span>
                              )
                            )}
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
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-start' }}
                            onClick={() => { setSelectedTournament(t); setShowGalleryModal(true); }}
                          >
                            📷 Manage Gallery
                          </button>
                          
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => { setSelectedTournament(t); setShowEditModal(true); }}
                          >
                            Edit Tournament
                          </button>
                          
                          {!isReadOnly && (
                            <>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => { setSelectedTournament(t); setShowEventModal(true); }}
                              >
                                <IconPlus size={14} /> Add Event
                              </button>
                              {t.collects_fees && !t.stripe_account_id && (
                                <button
                                  className="btn btn-sm animate-pulse"
                                  style={{ background: 'linear-gradient(135deg, var(--accent), #8b5cf6)', color: 'white', border: 'none', fontWeight: 600 }}
                                  onClick={() => handleConnectStripe(t.id)}
                                >
                                  💳 Connect Stripe
                                </button>
                              )}
                            </>
                          )}
                          
                          {t.status === 'draft' && (
                            <>
                              <button className="btn btn-primary btn-sm" onClick={() => handleStatusChange(t.id, 'open')}>
                                Open Registration
                              </button>
                              <button
                                className="btn btn-sm"
                                style={{ border: '1px solid rgba(239, 68, 68, 0.4)', color: 'var(--score-loss)', background: 'rgba(239, 68, 68, 0.05)' }}
                                onClick={() => handleStatusChange(t.id, 'cancelled')}
                              >
                                Cancel Tournament
                              </button>
                            </>
                          )}
                          {t.status === 'open' && (
                            <>
                              <button className="btn btn-primary btn-sm" style={{ background: 'var(--score-live)' }} onClick={() => handleStatusChange(t.id, 'live')}>
                                Go Live
                              </button>
                              <button className="btn btn-ghost btn-sm" onClick={() => handleStatusChange(t.id, 'draft')}>
                                Revert to Draft
                              </button>
                              <button
                                className="btn btn-sm"
                                style={{ border: '1px solid rgba(239, 68, 68, 0.4)', color: 'var(--score-loss)', background: 'rgba(239, 68, 68, 0.05)' }}
                                onClick={() => handleStatusChange(t.id, 'cancelled')}
                              >
                                Cancel Tournament
                              </button>
                            </>
                          )}
                          {t.status === 'live' && (
                            <>
                              <button className="btn btn-secondary btn-sm" onClick={() => handleStatusChange(t.id, 'completed')}>
                                Complete
                              </button>
                              <button className="btn btn-ghost btn-sm" onClick={() => handleStatusChange(t.id, 'open')}>
                                Revert to Open
                              </button>
                              <button
                                className="btn btn-sm"
                                style={{ border: '1px solid rgba(239, 68, 68, 0.4)', color: 'var(--score-loss)', background: 'rgba(239, 68, 68, 0.05)' }}
                                onClick={() => handleStatusChange(t.id, 'cancelled')}
                              >
                                Cancel Tournament
                              </button>
                            </>
                          )}
                          {t.status === 'completed' && (
                            <>
                              <button className="btn btn-ghost btn-sm" onClick={() => handleStatusChange(t.id, 'live')}>
                                Revert to Live
                              </button>
                              <button className="btn btn-ghost btn-sm" onClick={() => handleStatusChange(t.id, 'open')}>
                                Revert to Open
                              </button>
                            </>
                          )}
                          {t.status === 'cancelled' && (
                            <button className="btn btn-ghost btn-sm" onClick={() => handleStatusChange(t.id, 'draft')}>
                              Reactivate (Revert to Draft)
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
          onDelete={handleDeleteEvent}
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

      {/* Manage Gallery Modal */}
      {showGalleryModal && selectedTournament && (
        <ManageGalleryModal
          tournament={selectedTournament}
          onClose={() => { setShowGalleryModal(false); setSelectedTournament(null); }}
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
  onCreate: (data: Partial<Tournament>) => Promise<boolean>;
}) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [ageCutoffDate, setAgeCutoffDate] = useState('');
  const [type, setType] = useState<'individual' | 'team'>('individual');
  const [dateError, setDateError] = useState('');
  const [teamSizeLimit, setTeamSizeLimit] = useState(6);
  const [teamTieConfigs, setTeamTieConfigs] = useState<{ event_id: string; name: string; count: number }[]>([]);
  const [selectedMasterEventId, setSelectedMasterEventId] = useState('');
  const [subMatchCount, setSubMatchCount] = useState(1);
  const [bonusPointMargin, setBonusPointMargin] = useState(5);
  const [bonusPointValue, setBonusPointValue] = useState(1);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [collectsFees, setCollectsFees] = useState(false);
  const [entryFee, setEntryFee] = useState('0');
  const [currency, setCurrency] = useState('INR');

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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dateError) return;
    if (type === 'team' && teamTieConfigs.length === 0) return;
    
    setIsSubmitting(true);
    setError('');

    // Map to tie events array for backwards compat
    const flatTieEvents = teamTieConfigs.flatMap(c => Array(c.count).fill(c.name));

    try {
      await onCreate({
        name,
        description,
        location,
        start_date: startDate,
        end_date: endDate,
        age_cutoff_date: ageCutoffDate || undefined,
        type,
        team_size_limit: type === 'team' ? Number(teamSizeLimit) : undefined,
        team_tie_configs: type === 'team' ? teamTieConfigs : undefined,
        team_tie_events: type === 'team' ? flatTieEvents : undefined,
        bonus_point_margin: type === 'team' ? Number(bonusPointMargin) : undefined,
        bonus_point_value: type === 'team' ? Number(bonusPointValue) : undefined,
        collects_fees: collectsFees,
        entry_fee: collectsFees ? Number(entryFee) : 0,
        currency,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create tournament. Please ensure the name is unique.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 580, minHeight: 460, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Create Tournament</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><IconX size={18} /></button>
        </div>

        {error && (
          <div style={{
            color: 'var(--score-loss)',
            fontSize: 13,
            fontWeight: 500,
            background: 'rgba(239, 68, 68, 0.1)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            marginBottom: 16,
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Stepper Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, background: 'var(--bg-secondary)', padding: '12px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          {[
            { number: 1, label: 'General Info' },
            { number: 2, label: 'Schedule & Format' },
            { number: 3, label: 'Entry Fee Settings' },
            ...(type === 'team' ? [{ number: 4, label: 'Team Setup' }] : []),
          ].map((s, idx) => (
            <React.Fragment key={s.number}>
              {idx > 0 && <div style={{ flex: 1, height: 2, background: step >= s.number ? 'var(--accent)' : 'var(--border)', margin: '0 8px' }} />}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: step === s.number ? 'var(--accent)' : (step > s.number ? 'var(--score-win)' : 'var(--bg-elevated)'),
                  color: step === s.number || step > s.number ? '#fff' : 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700
                }}>
                  {step > s.number ? '✓' : s.number}
                </div>
                <span style={{ fontSize: 12, fontWeight: step === s.number ? 600 : 400, color: step === s.number ? 'var(--text-primary)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {s.label}
                </span>
              </div>
            </React.Fragment>
          ))}
        </div>

        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
          
          {/* Step 1: General Details */}
          {step === 1 && (
            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="input-group">
                <label className="input-label" htmlFor="t-name">Tournament Name *</label>
                <input id="t-name" className="input" placeholder="e.g., Mumbai Open 2025" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="input-group">
                <label className="input-label" htmlFor="t-desc">Description</label>
                <textarea id="t-desc" className="input" placeholder="Tournament description..." value={description} onChange={e => setDescription(e.target.value)} style={{ minHeight: 80, resize: 'vertical' }} />
              </div>
              <div className="input-group">
                <label className="input-label" htmlFor="t-loc">Location</label>
                <input id="t-loc" className="input" placeholder="Venue, City" value={location} onChange={e => setLocation(e.target.value)} />
              </div>
            </div>
          )}

          {/* Step 2: Schedule & Format */}
          {step === 2 && (
            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
              <div className="input-group">
                <label className="input-label" htmlFor="t-cutoff">Age Cutoff Date (Optional)</label>
                <input id="t-cutoff" type="date" className="input" value={ageCutoffDate} onChange={e => setAgeCutoffDate(e.target.value)} />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Used to dynamically evaluate registrations against age rules (e.g. U9, 35+)</span>
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
            </div>
          )}

          {/* Step 3: Entry Fee Settings */}
          {step === 3 && (
            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="input-group">
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={collectsFees}
                    onChange={e => setCollectsFees(e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: 'var(--accent)' }}
                  />
                  <span style={{ fontSize: 14, fontWeight: 600 }}>Collect Entry Fees from Players</span>
                </label>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 26 }}>
                  If enabled, players will be required to pay an entry fee via Stripe during registration.
                </span>
              </div>

              {collectsFees && (
                <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 16, borderLeft: '2px solid var(--accent)', paddingLeft: 16, marginTop: 8 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="input-group">
                      <label className="input-label" htmlFor="t-fee">Entry Fee Amount *</label>
                      <input
                        id="t-fee"
                        type="number"
                        className="input"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={entryFee}
                        onChange={e => setEntryFee(e.target.value)}
                        required={collectsFees}
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label" htmlFor="t-currency">Currency *</label>
                      <select
                        id="t-currency"
                        className="input"
                        value={currency}
                        onChange={e => setCurrency(e.target.value)}
                        style={{ height: 42 }}
                      >
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                    ℹ️ **Payouts Notice**: You will need to link your Stripe account under the tournament actions in the dashboard to begin accepting registrations.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Team Configurations */}
          {step === 4 && type === 'team' && (
            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                  <div style={{ padding: '12px', border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                    No tie events configured yet. Configure events above.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: 'var(--bg-secondary)', padding: 10, borderRadius: 'var(--radius-md)', maxHeight: 120, overflowY: 'auto' }}>
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

          {/* Stepper Navigation Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            {step > 1 ? (
              <button type="button" className="btn btn-secondary" onClick={() => setStep(prev => prev - 1)}>
                Back
              </button>
            ) : (
              <div /> // Spacer
            )}

            {step === 1 && (
              <button type="button" className="btn btn-primary" onClick={() => setStep(2)} disabled={!name}>
                Next: Schedule & Format
              </button>
            )}

            {step === 2 && (
              <button type="button" className="btn btn-primary" onClick={() => setStep(3)} disabled={!!dateError}>
                Next: Entry Fee Settings
              </button>
            )}

            {step === 3 && (
              type === 'team' ? (
                <button type="button" className="btn btn-primary" onClick={() => setStep(4)}>
                  Next: Configure Team Setup
                </button>
              ) : (
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Tournament'}
                </button>
              )
            )}

            {step === 4 && type === 'team' && (
              <button type="submit" className="btn btn-primary" disabled={teamTieConfigs.length === 0 || isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Tournament'}
              </button>
            )}
          </div>
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
  const [selectedMasterIds, setSelectedMasterIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [entryLimit, setEntryLimit] = useState('32');
  const [format, setFormat] = useState<EventFormat>('knockout');
  const [scoringFormat, setScoringFormat] = useState<ScoringFormat>('21-point');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter events based on search query
  const filteredEvents = masterEvents.filter(me => {
    const q = searchQuery.toLowerCase();
    return (
      me.name.toLowerCase().includes(q) ||
      me.event_type.toLowerCase().includes(q) ||
      me.category.toLowerCase().includes(q) ||
      me.gender.toLowerCase().includes(q)
    );
  });

  const handleToggleSelect = (id: string) => {
    setSelectedMasterIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const idsToAdd = filteredEvents.map(e => e.id);
    setSelectedMasterIds(prev => {
      const union = new Set([...prev, ...idsToAdd]);
      return Array.from(union);
    });
  };

  const handleClearAll = () => {
    setSelectedMasterIds([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMasterIds.length === 0) return;

    setIsSubmitting(true);
    try {
      // Create each event sequentially
      for (let i = 0; i < selectedMasterIds.length; i++) {
        const masterId = selectedMasterIds[i];
        const master = masterEvents.find(me => me.id === masterId);
        
        const newEvent: TournamentEvent = {
          id: `e${Date.now()}-${masterId}-${i}`, // unique suffix to prevent collisions
          tournament_id: tournament.id,
          master_event_id: masterId,
          event_name: master ? master.name : 'Unknown Event',
          category: master ? master.category.toUpperCase() : undefined,
          entry_limit: parseInt(entryLimit),
          format,
          registrations_count: 0,
          scoring_format: scoringFormat,
          gender_restriction: master ? (master.gender === 'Female' ? 'women' : master.gender === 'Male' ? 'men' : 'open') : 'open',
        };

        await createEvent(newEvent);
        onEventAdded(newEvent);
      }
      onClose();
    } catch (err) {
      console.error('Failed to create event(s):', err);
      alert('Failed to add some events. Please check connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>Add Event to Tournament</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{tournament.name}</p>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><IconX size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          <div className="input-group" style={{ position: 'relative' }} ref={dropdownRef}>
            <label className="input-label">Select Event Template(s) *</label>
            
            {/* Selected Items / Chips */}
            {selectedMasterIds.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {selectedMasterIds.map(id => {
                  const master = masterEvents.find(me => me.id === id);
                  if (!master) return null;
                  return (
                    <span
                      key={id}
                      className="badge"
                      style={{
                        background: 'var(--accent-subtle)',
                        color: 'var(--accent-hover)',
                        border: '1px solid var(--border-accent)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        textTransform: 'none',
                        padding: '4px 8px',
                        fontSize: '12px'
                      }}
                    >
                      {master.name} ({master.category.toUpperCase()})
                      <button
                        type="button"
                        onClick={() => handleToggleSelect(id)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          color: 'var(--accent-hover)',
                          display: 'inline-flex',
                          padding: 0
                        }}
                      >
                        <IconX size={14} />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Search Input Box */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="input"
                placeholder={
                  selectedMasterIds.length > 0
                    ? `Selected ${selectedMasterIds.length} event template(s)...`
                    : "Type to search event templates..."
                }
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setIsDropdownOpen(prev => !prev)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    transform: isDropdownOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform var(--transition-fast)'
                  }}
                >
                  <IconChevronDown size={18} />
                </span>
              </button>
            </div>

            {/* Dropdown Options List */}
            {isDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 50,
                  marginTop: 4,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-hover)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  maxHeight: '220px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Quick Action bar (Select All / Clear All) */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderBottom: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1
                  }}
                >
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {filteredEvents.length} templates found
                  </span>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {filteredEvents.length > 0 && (
                      <button
                        type="button"
                        onClick={handleSelectAllFiltered}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--accent)',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        Select All
                      </button>
                    )}
                    {selectedMasterIds.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAll}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--score-loss)',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>

                {/* Options List */}
                {filteredEvents.length === 0 ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                    No templates match your search
                  </div>
                ) : (
                  filteredEvents.map(me => {
                    const isSelected = selectedMasterIds.includes(me.id);
                    return (
                      <div
                        key={me.id}
                        onClick={() => handleToggleSelect(me.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          cursor: 'pointer',
                          background: isSelected ? 'var(--bg-elevated)' : 'transparent',
                          borderBottom: '1px solid var(--border)',
                          transition: 'background var(--transition-fast)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--bg-card-hover)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = isSelected ? 'var(--bg-elevated)' : 'transparent';
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                            {me.name}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                            {me.event_type.toUpperCase()} • {me.category.toUpperCase()} • {me.gender.toUpperCase()}
                          </div>
                        </div>
                        {isSelected ? (
                          <span style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center' }}>
                            <IconCheck size={16} />
                          </span>
                        ) : (
                          <div
                            style={{
                              width: 16,
                              height: 16,
                              border: '1px solid var(--border-hover)',
                              borderRadius: '3px'
                            }}
                          />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="input-group">
              <label className="input-label" htmlFor="e-format">Tournament Format</label>
              <select id="e-format" className="input" value={format} onChange={e => setFormat(e.target.value as any)}>
                <option value="knockout">Knockout</option>
                <option value="round_robin">Round Robin</option>
                <option value="swiss">Swiss</option>
                <option value="league">League</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="e-limit">Entry Limit *</label>
              <input 
                id="e-limit" 
                type="number" 
                className="input" 
                value={entryLimit} 
                onChange={e => setEntryLimit(e.target.value)} 
                min="2" 
                max="512" 
                required 
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="e-scoring">Scoring Rules</label>
            <select id="e-scoring" className="input" value={scoringFormat} onChange={e => setScoringFormat(e.target.value as any)}>
              <option value="11-point">11-Point (Golden at 15) BWF Compliant</option>
              <option value="15-point">15-Point (Golden at 21) BWF Compliant</option>
              <option value="21-point">21-Point (Golden at 30) BWF Compliant</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={selectedMasterIds.length === 0 || isSubmitting}>
              {isSubmitting ? `Adding ${selectedMasterIds.length} Event(s)...` : `Add Event${selectedMasterIds.length > 1 ? 's' : ''}`}
            </button>
          </div>
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
  const [ageCutoffDate, setAgeCutoffDate] = useState(tournament.age_cutoff_date || '');
  const [type, setType] = useState(tournament.type);
  const [dateError, setDateError] = useState('');
  const [teamSizeLimit, setTeamSizeLimit] = useState(tournament.team_size_limit || 6);
  const [teamTieConfigs, setTeamTieConfigs] = useState<{ event_id: string; name: string; count: number }[]>(tournament.team_tie_configs || []);
  const [selectedMasterEventId, setSelectedMasterEventId] = useState('');
  const [subMatchCount, setSubMatchCount] = useState(1);
  const [bonusPointMargin, setBonusPointMargin] = useState(tournament.bonus_point_margin || 5);
  const [bonusPointValue, setBonusPointValue] = useState(tournament.bonus_point_value || 1);
  const [collectsFees, setCollectsFees] = useState(tournament.collects_fees || false);
  const [entryFee, setEntryFee] = useState(String(tournament.entry_fee || '0'));
  const [currency, setCurrency] = useState(tournament.currency || 'INR');
  const [status, setStatus] = useState(tournament.status);

  // Co-admin management states
  const [activeTab, setActiveTab] = useState<'details' | 'admins' | 'certificates'>('details');
  const [adminsList, setAdminsList] = useState<string[]>(tournament.admins || []);
  const [emailSearch, setEmailSearch] = useState('');
  const [profiles, setProfiles] = useState<User[]>([]);
  const [emailError, setEmailError] = useState('');

  // Load all profiles to search for co-managers
  useEffect(() => {
    async function fetchProfiles() {
      try {
        const prs = await getAllProfiles();
        setProfiles(prs);
      } catch (err) {
        console.error('Failed to load profiles for co-admins:', err);
      }
    }
    fetchProfiles();
  }, []);

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
    <div className="modal-overlay">
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 580, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Edit Tournament</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><IconX size={18} /></button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 16, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
          <button
            type="button"
            style={{
              padding: '8px 16px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'details' ? '2px solid var(--accent)' : 'none',
              color: activeTab === 'details' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            onClick={() => setActiveTab('details')}
          >
            Tournament Details
          </button>
          <button
            type="button"
            style={{
              padding: '8px 16px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'admins' ? '2px solid var(--accent)' : 'none',
              color: activeTab === 'admins' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            onClick={() => setActiveTab('admins')}
          >
            Co-Managers & Collaborators
          </button>
          <button
            type="button"
            style={{
              padding: '8px 16px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'certificates' ? '2px solid var(--accent)' : 'none',
              color: activeTab === 'certificates' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            onClick={() => setActiveTab('certificates')}
          >
            🏆 Certificates & Branding
          </button>
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
            age_cutoff_date: ageCutoffDate || undefined,
            type,
            status,
            team_size_limit: type === 'team' ? Number(teamSizeLimit) : undefined,
            team_tie_configs: type === 'team' ? teamTieConfigs : undefined,
            team_tie_events: type === 'team' ? flatTieEvents : undefined,
            bonus_point_margin: type === 'team' ? Number(bonusPointMargin) : undefined,
            bonus_point_value: type === 'team' ? Number(bonusPointValue) : undefined,
            admins: adminsList,
            collects_fees: collectsFees,
            entry_fee: collectsFees ? Number(entryFee) : 0,
            currency,
          });
        }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {activeTab === 'details' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="input-group">
                <label className="input-label" htmlFor="edit-t-name">Tournament Name *</label>
                <input id="edit-t-name" className="input" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="input-group">
                <label className="input-label" htmlFor="edit-t-status">Tournament Status *</label>
                <select
                  id="edit-t-status"
                  className="input"
                  value={status}
                  onChange={e => setStatus(e.target.value as any)}
                  style={{ textTransform: 'capitalize' }}
                >
                  <option value="draft">Draft</option>
                  <option value="open">Open (Registration Open)</option>
                  <option value="live">Live (Ongoing)</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
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
              <div className="input-group">
                <label className="input-label" htmlFor="edit-t-cutoff">Age Cutoff Date (Optional)</label>
                <input id="edit-t-cutoff" type="date" className="input" value={ageCutoffDate} onChange={e => setAgeCutoffDate(e.target.value)} />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Used to dynamically evaluate registrations against age rules (e.g. U9, 35+)</span>
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
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: 'var(--bg-secondary)', padding: 10, borderRadius: 'var(--radius-md)', maxHeight: 120, overflowY: 'auto' }}>
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

              {/* Payment Settings */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 8 }}>
                <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  💰 Payment & Entry Fee Settings
                </h4>
                <div className="input-group" style={{ marginBottom: 12 }}>
                  <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={collectsFees}
                      onChange={e => setCollectsFees(e.target.checked)}
                      style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}
                    />
                    <span style={{ fontSize: 14, fontWeight: 600 }}>Collect Entry Fees from Players</span>
                  </label>
                </div>

                {collectsFees && (
                  <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 14, borderLeft: '2px solid var(--accent)', paddingLeft: 14 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div className="input-group">
                        <label className="input-label" htmlFor="edit-t-fee">Entry Fee Amount</label>
                        <input
                          id="edit-t-fee"
                          type="number"
                          className="input"
                          min="0"
                          step="0.01"
                          value={entryFee}
                          onChange={e => setEntryFee(e.target.value)}
                          required={collectsFees}
                        />
                      </div>
                      <div className="input-group">
                        <label className="input-label" htmlFor="edit-t-currency">Currency</label>
                        <select
                          id="edit-t-currency"
                          className="input"
                          value={currency}
                          onChange={e => setCurrency(e.target.value)}
                          style={{ height: 42 }}
                        >
                          <option value="INR">INR (₹)</option>
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'admins' && (
            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: 280 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label className="input-label">Search User by Email</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="email"
                    className="input"
                    placeholder="co-admin@matchpoint.io"
                    value={emailSearch}
                    onChange={e => { setEmailSearch(e.target.value); setEmailError(''); }}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      if (!emailSearch.trim()) return;
                      const matchedUser = profiles.find(p => p.email.toLowerCase() === emailSearch.trim().toLowerCase());
                      if (!matchedUser) {
                        setEmailError('No registered user found with this email.');
                        return;
                      }
                      if (adminsList.includes(matchedUser.id)) {
                        setEmailError('User is already a co-manager.');
                        return;
                      }
                      setAdminsList([...adminsList, matchedUser.id]);
                      setEmailSearch('');
                      setEmailError('');
                    }}
                  >
                    + Add Co-Manager
                  </button>
                </div>
                {emailError && (
                  <div style={{ color: 'var(--score-loss)', fontSize: 12, fontWeight: 500, marginTop: 4 }}>
                    ⚠️ {emailError}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                <label className="input-label">Current Co-Managers ({adminsList.length})</label>
                {adminsList.length === 0 ? (
                  <div style={{ padding: '16px', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                    No additional managers delegated yet. Only the tournament owner has edit rights.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
                    {adminsList.map(adminId => {
                      const matchedUser = profiles.find(p => p.id === adminId);
                      return (
                        <div key={adminId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>{matchedUser?.name || 'Loading Name...'}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{matchedUser?.email || adminId}</span>
                          </div>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--score-loss)', padding: '4px 8px' }}
                            onClick={() => {
                              setAdminsList(adminsList.filter(id => id !== adminId));
                            }}
                          >
                            ✕ Remove
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'certificates' && (
            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: 280 }}>
              <CertificateBuilder tournament={tournament} />
            </div>
          )}

          {activeTab !== 'certificates' && (
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 8 }} disabled={!!dateError || (type === 'team' && teamTieConfigs.length === 0)}>
              Save Changes
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

function EditEventModal({
  event,
  masterEvents,
  onClose,
  onUpdate,
  onDelete
}: {
  event: TournamentEvent;
  masterEvents: MasterEvent[];
  onClose: () => void;
  onUpdate: (data: Partial<TournamentEvent>) => void;
  onDelete: (id: string) => void;
}) {
  const [entryLimit, setEntryLimit] = useState(event.entry_limit);
  const [format, setFormat] = useState(event.format);
  const [scoringFormat, setScoringFormat] = useState(event.scoring_format || '21-point');

  // Find the master event name for read-only template info display
  const masterEvent = masterEvents.find(me => me.id === event.master_event_id);
  const eventName = event.event_name || masterEvent?.name || 'Loading event...';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({
      entry_limit: Number(entryLimit),
      format,
      scoring_format: scoringFormat,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Edit Event Rules</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><IconX size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          <div className="input-group" style={{ background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <label className="input-label" style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Linked Event Template (Read-Only)</label>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              🏸 {eventName}
            </div>
            {masterEvent && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Type: {masterEvent.event_type.toUpperCase()} • Category: {masterEvent.category.toUpperCase()} • Gender: {masterEvent.gender}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="input-group">
              <label className="input-label" htmlFor="edit-e-format">Tournament Format</label>
              <select id="edit-e-format" className="input" value={format} onChange={e => setFormat(e.target.value as any)}>
                <option value="knockout">Knockout</option>
                <option value="round_robin">Round Robin</option>
                <option value="swiss">Swiss</option>
                <option value="league">League</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="edit-e-limit">Entry Limit *</label>
              <input 
                id="edit-e-limit" 
                type="number" 
                className="input" 
                value={entryLimit} 
                onChange={e => setEntryLimit(Number(e.target.value))} 
                min="2" 
                max="512" 
                required 
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="edit-e-scoring">Scoring Rules</label>
            <select id="edit-e-scoring" className="input" value={scoringFormat} onChange={e => setScoringFormat(e.target.value as any)}>
              <option value="11-point">11-Point (Golden at 15) BWF Compliant</option>
              <option value="15-point">15-Point (Golden at 21) BWF Compliant</option>
              <option value="21-point">21-Point (Golden at 30) BWF Compliant</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 12 }}>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                if (confirm(`Are you sure you want to delete this event "${eventName}"? All registration data for this event will be lost.`)) {
                  onDelete(event.id);
                }
              }}
            >
              🗑️ Delete Event
            </button>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// Manage Gallery Modal Component
// ============================================================

function ManageGalleryModal({
  tournament,
  onClose,
}: {
  tournament: Tournament;
  onClose: () => void;
}) {
  const [media, setMedia] = useState<TournamentMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [remoteUrl, setRemoteUrl] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  // Load media on mount
  useEffect(() => {
    let active = true;
    async function fetchMedia() {
      try {
        setLoading(true);
        const data = await getTournamentMedia(tournament.id);
        if (active) setMedia(data);
      } catch (err) {
        console.error('Failed to load gallery media:', err);
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchMedia();
    return () => {
      active = false;
    };
  }, [tournament.id]);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Compress at 0.75 quality JPEG
          const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setUploadError('Only image files are supported (PNG, JPG, WebP).');
        return;
      }
      setUploadError('');
      setSelectedFile(file);
      setRemoteUrl(''); // Clear remote URL if file is chosen
      const previewUrl = URL.createObjectURL(file);
      setFilePreview(previewUrl);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setUploadError('Only image files are supported (PNG, JPG, WebP).');
        return;
      }
      setUploadError('');
      setSelectedFile(file);
      setRemoteUrl(''); // Clear remote URL
      const previewUrl = URL.createObjectURL(file);
      setFilePreview(previewUrl);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !remoteUrl) {
      setUploadError('Please select a file or paste a remote image URL.');
      return;
    }

    try {
      setUploading(true);
      setUploadError('');

      let fileUrl = '';
      if (selectedFile) {
        // Compress and convert to Base64
        fileUrl = await compressImage(selectedFile);
      } else {
        fileUrl = remoteUrl;
      }

      const payload = {
        tournament_id: tournament.id,
        file_url: fileUrl,
        caption: caption.trim() || undefined,
        media_type: 'image' as const,
      };

      const newMedia = await uploadTournamentMedia(tournament.id, payload);
      setMedia(prev => [newMedia, ...prev]);

      // Reset form
      setCaption('');
      setRemoteUrl('');
      clearSelectedFile();
    } catch (err) {
      console.error('Failed to upload media:', err);
      setUploadError('Failed to save media. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (mediaId: string) => {
    if (!window.confirm('Are you sure you want to delete this media item? This action is permanent.')) {
      return;
    }

    try {
      await deleteTournamentMedia(tournament.id, mediaId);
      setMedia(prev => prev.filter(m => m.id !== mediaId));
    } catch (err) {
      console.error('Failed to delete media:', err);
      alert('Failed to delete media item.');
    }
  };

  return (
    <div className="modal-overlay">
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()} 
        style={{ 
          maxWidth: 900, 
          width: '95%',
          display: 'flex', 
          flexDirection: 'column',
          maxHeight: '90vh',
          padding: 28,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>Manage Media Gallery</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{tournament.name}</p>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><IconX size={18} /></button>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', 
          gap: 28, 
          flex: 1, 
          overflowY: 'auto',
          minHeight: 0,
          paddingRight: 4
        }}>
          {/* Left Column: Upload Tools */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, borderBottom: '1px solid var(--border)', paddingBottom: 8, margin: 0 }}>
              Upload New Media
            </h3>

            {uploadError && (
              <div style={{
                color: 'var(--score-loss)',
                fontSize: 13,
                fontWeight: 500,
                background: 'rgba(239, 68, 68, 0.1)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}>
                ⚠️ {uploadError}
              </div>
            )}

            <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Option 1: Drag & Drop Dropzone */}
              <div className="input-group">
                <label className="input-label">Drag & Drop Image File</label>
                {!filePreview ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    style={{
                      border: dragOver ? '2px dashed var(--accent)' : '2px dashed var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '32px 16px',
                      textAlign: 'center',
                      background: dragOver ? 'var(--accent-subtle)' : 'rgba(255,255,255,0.01)',
                      cursor: 'pointer',
                      transition: 'all 0.25s',
                    }}
                    onClick={() => document.getElementById('gallery-file-input')?.click()}
                    onMouseOver={(e) => { if (!dragOver) e.currentTarget.style.borderColor = 'var(--accent)'; }}
                    onMouseOut={(e) => { if (!dragOver) e.currentTarget.style.borderColor = 'var(--border)'; }}
                  >
                    <input
                      id="gallery-file-input"
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                    />
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
                    <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>
                      Drag files here or <span style={{ color: 'var(--accent)', textDecoration: 'underline' }}>browse</span>
                    </p>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                      PNG, JPG, WebP (Compressed client-side for fast loads)
                    </span>
                  </div>
                ) : (
                  <div style={{
                    position: 'relative',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    border: '1px solid var(--border)',
                    height: 140,
                    background: '#0e0e11',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <img 
                      src={filePreview} 
                      alt="Upload preview" 
                      style={{ height: '100%', width: '100%', objectFit: 'contain' }} 
                    />
                    <button
                      type="button"
                      onClick={clearSelectedFile}
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        background: 'rgba(239, 68, 68, 0.9)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: 28,
                        height: 28,
                        cursor: 'pointer',
                        fontSize: 14,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      }}
                      title="Remove image"
                    >
                      &times;
                    </button>
                  </div>
                )}
              </div>

              {/* Separator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>OR</span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>

              {/* Option 2: Remote URL */}
              <div className="input-group">
                <label className="input-label" htmlFor="gallery-url-input">Paste Image URL</label>
                <input
                  id="gallery-url-input"
                  className="input"
                  type="url"
                  placeholder="https://example.com/flyer.jpg"
                  value={remoteUrl}
                  onChange={e => {
                    setRemoteUrl(e.target.value);
                    if (e.target.value) clearSelectedFile(); // Clear file if URL is pasted
                  }}
                  style={{ background: 'var(--bg-primary)' }}
                />
              </div>

              {/* Caption */}
              <div className="input-group">
                <label className="input-label" htmlFor="gallery-caption-input">Caption / Title</label>
                <input
                  id="gallery-caption-input"
                  className="input"
                  type="text"
                  placeholder="Brief description of this image..."
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  style={{ background: 'var(--bg-primary)' }}
                  maxLength={150}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ height: 44, width: '100%', marginTop: 8 }}
                disabled={uploading || (!selectedFile && !remoteUrl)}
              >
                {uploading ? 'Processing & Saving...' : 'Add to Gallery'}
              </button>
            </form>
          </div>

          {/* Right Column: Existing Media List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, borderLeft: '1px solid var(--border)', paddingLeft: 28 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, borderBottom: '1px solid var(--border)', paddingBottom: 8, margin: 0 }}>
              Current Gallery ({media.length})
            </h3>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0', flex: 1, alignItems: 'center' }}>
                <div className="animate-spin" style={{ fontSize: 24 }}>🔄</div>
              </div>
            ) : media.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '48px 16px',
                color: 'var(--text-muted)',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🖼️</div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>No gallery items uploaded yet.</p>
                <span style={{ fontSize: 12, marginTop: 4 }}>Add your first image in the left panel.</span>
              </div>
            ) : (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 12, 
                maxHeight: '52vh', 
                overflowY: 'auto',
                paddingRight: 6
              }}>
                {media.map(item => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      gap: 12,
                      background: 'var(--bg-secondary)',
                      padding: 10,
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{
                      width: 64,
                      height: 48,
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      border: '1px solid var(--border)',
                      flexShrink: 0,
                      background: '#000',
                    }}>
                      <img 
                        src={item.file_url} 
                        alt={item.caption || 'Media item'} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    </div>
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        margin: 0,
                        fontSize: 13,
                        fontWeight: 500,
                        color: 'var(--text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {item.caption || 'No Caption'}
                      </p>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginTop: 2 }}>
                        {item.created_at ? new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Unknown date'}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ 
                        color: 'var(--score-loss)', 
                        padding: '6px 10px', 
                        fontSize: 12, 
                        flexShrink: 0 
                      }}
                      onClick={() => handleDelete(item.id)}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

