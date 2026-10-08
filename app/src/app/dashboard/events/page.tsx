'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useSport } from '@/lib/sport-context';
import { MasterEvent } from '@/types';
import {
  getMasterEvents,
  createMasterEvent,
  updateMasterEvent,
  deleteMasterEvent,
} from '@/lib/supabase-service';
import { IconPlus, IconX, IconRefreshCw } from '@/components/icons';

export default function AllEventsPage() {
  const { user } = useAuth();
  const { activeSport } = useSport();
  const isAdmin = user?.role === 'admin';

  const [masterEvents, setMasterEvents] = useState<MasterEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<MasterEvent | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter]);

  async function loadData() {
    try {
      setLoading(true);
      const data = await getMasterEvents();
      // Sort master events alphabetically by name
      const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name));
      setMasterEvents(sorted);
    } catch (err) {
      console.error('Failed to load master events:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (eventData: Omit<MasterEvent, 'created_at'>) => {
    try {
      await createMasterEvent(eventData);
      await loadData();
      setShowAddModal(false);
    } catch (err) {
      console.error('Failed to create master event:', err);
      alert('Failed to create master event. Please ensure the Code/ID is unique.');
    }
  };

  const handleUpdate = async (id: string, eventData: Omit<MasterEvent, 'created_at'>) => {
    try {
      await updateMasterEvent(id, eventData);
      await loadData();
      setShowEditModal(false);
      setSelectedEvent(null);
    } catch (err) {
      console.error('Failed to update master event:', err);
      alert('Failed to update master event.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the event template "${name}"?\nThis might break tournaments referencing this master event.`)) {
      return;
    }
    try {
      await deleteMasterEvent(id);
      await loadData();
    } catch (err) {
      console.error('Failed to delete master event:', err);
      alert('Failed to delete master event. It might be referenced by existing tournament events.');
    }
  };

  // Filter templates
  const filteredEvents = masterEvents.filter(e => {
    const eventSports = e.sports && e.sports.length > 0 ? e.sports : (e.sport ? [e.sport] : []);
    const matchesSport = activeSport === 'all' || eventSports.length === 0 || eventSports.includes(activeSport);
    if (!matchesSport) return false;

    const query = searchQuery.toLowerCase();
    const matchesSearch =
      e.name.toLowerCase().includes(query) ||
      e.id.toLowerCase().includes(query) ||
      e.event_type.toLowerCase().includes(query) ||
      (e.category && e.category.toLowerCase().includes(query)) ||
      (e.gender && e.gender.toLowerCase().includes(query)) ||
      eventSports.some(s => s.toLowerCase().includes(query));

    if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
    return matchesSearch;
  });

  const totalItems = filteredEvents.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedEvents = filteredEvents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Event Master Dictionary</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
            Manage the global list of standard event templates used across all tournaments.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary btn-icon" onClick={loadData} title="Refresh Data">
            <IconRefreshCw size={16} />
          </button>
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              <IconPlus size={16} /> Add Event Template
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          className="input"
          placeholder="Search by name, code, type, category..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ maxWidth: 360, flex: 1 }}
        />

        <div className="tab-group" style={{ display: 'inline-flex' }}>
          <button
            className={`tab ${categoryFilter === 'all' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('all')}
          >
            All Templates
          </button>
          <button
            className={`tab ${categoryFilter === 'junior' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('junior')}
          >
            Junior
          </button>
          <button
            className={`tab ${categoryFilter === 'open' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('open')}
          >
            Open
          </button>
          <button
            className={`tab ${categoryFilter === 'veteran' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('veteran')}
          >
            Veteran
          </button>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="glass-card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div className="animate-spin" style={{ display: 'inline-block', fontSize: 24, marginBottom: 12, animation: 'spin 2s linear infinite' }}>🔄</div>
          <p style={{ fontSize: 15, fontWeight: 500 }}>Loading master events dictionary...</p>
        </div>
      ) : (
        <div className="glass-card animate-slide-up" style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 700 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255, 255, 255, 0.02)' }}>
                <th style={{ padding: '16px 20px', fontWeight: 600, fontSize: 13, color: 'var(--text-muted)' }}>Event Name</th>
                <th style={{ padding: '16px 20px', fontWeight: 600, fontSize: 13, color: 'var(--text-muted)' }}>Code / ID</th>
                <th style={{ padding: '16px 20px', fontWeight: 600, fontSize: 13, color: 'var(--text-muted)' }}>Associated Sports</th>
                <th style={{ padding: '16px 20px', fontWeight: 600, fontSize: 13, color: 'var(--text-muted)' }}>Type</th>
                <th style={{ padding: '16px 20px', fontWeight: 600, fontSize: 13, color: 'var(--text-muted)' }}>Category</th>
                <th style={{ padding: '16px 20px', fontWeight: 600, fontSize: 13, color: 'var(--text-muted)' }}>Gender</th>
                <th style={{ padding: '16px 20px', fontWeight: 600, fontSize: 13, color: 'var(--text-muted)' }}>Age Rules</th>
                {isAdmin && <th style={{ padding: '16px 20px', fontWeight: 600, fontSize: 13, color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {paginatedEvents.map((event) => {
                const eventSports = event.sports && event.sports.length > 0 ? event.sports : (event.sport ? [event.sport] : ['all']);
                return (
                <tr
                  key={event.id}
                  style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s ease' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.01)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>
                    {event.name}
                  </td>
                  <td style={{ padding: '16px 20px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>
                    {event.id}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {eventSports.map(sp => (
                        <span key={sp} className="badge badge-accent" style={{ fontSize: 10, textTransform: 'capitalize' }}>
                          {sp === 'table_tennis' ? 'TT' : sp}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span className="badge" style={{
                      textTransform: 'uppercase',
                      fontSize: 10,
                      fontWeight: 600,
                      background: event.event_type === 'singles' ? 'rgba(37, 99, 235, 0.1)' : event.event_type === 'doubles' ? 'rgba(168, 85, 247, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                      color: event.event_type === 'singles' ? '#60a5fa' : event.event_type === 'doubles' ? '#c084fc' : '#4ade80',
                      border: event.event_type === 'singles' ? '1px solid rgba(37, 99, 235, 0.2)' : event.event_type === 'doubles' ? '1px solid rgba(168, 85, 247, 0.2)' : '1px solid rgba(34, 197, 94, 0.2)',
                    }}>
                      {event.event_type}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span className="badge" style={{
                      textTransform: 'capitalize',
                      fontSize: 11,
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-secondary)'
                    }}>
                      {event.category}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>
                    <span className="badge badge-outline" style={{ fontSize: 11 }}>
                      {event.gender}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: 13, color: 'var(--text-secondary)' }}>
                    {event.category === 'junior' && event.max_age > 0 && `Max Age: ${event.max_age} (U${event.max_age})`}
                    {event.category === 'veteran' && event.min_age > 0 && `Min Age: ${event.min_age}+`}
                    {event.category === 'open' && 'No Age Limit'}
                    {event.category !== 'junior' && event.category !== 'veteran' && event.category !== 'open' && (
                      event.min_age || event.max_age ? `${event.min_age} - ${event.max_age} yrs` : 'No restrictions'
                    )}
                  </td>
                  {isAdmin && (
                    <td style={{ padding: '16px 20px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => { setSelectedEvent(event); setShowEditModal(true); }}
                        style={{ marginRight: 8, padding: '4px 8px', fontSize: 12 }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleDelete(event.id, event.name)}
                        style={{ padding: '4px 8px', fontSize: 12, color: 'var(--score-loss)' }}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  )}
                </tr>
              )})}

              {filteredEvents.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                    No event templates found matching current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {totalItems > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, padding: '0 20px 20px 20px', flexWrap: 'wrap', gap: 12 }}>
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
        </div>
      )}

      {/* Add Master Event Template Modal */}
      {showAddModal && (
        <MasterEventFormModal
          title="Add Event Template"
          onClose={() => setShowAddModal(false)}
          onSubmit={handleCreate}
        />
      )}

      {/* Edit Master Event Template Modal */}
      {showEditModal && selectedEvent && (
        <MasterEventFormModal
          title="Edit Event Template"
          initialData={selectedEvent}
          isEdit={true}
          onClose={() => { setShowEditModal(false); setSelectedEvent(null); }}
          onSubmit={(data) => handleUpdate(selectedEvent.id, data)}
        />
      )}
    </div>
  );
}

function MasterEventFormModal({
  title,
  initialData,
  isEdit = false,
  onClose,
  onSubmit,
}: {
  title: string;
  initialData?: MasterEvent;
  isEdit?: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<MasterEvent, 'created_at'>) => void;
}) {
  const { activeSport } = useSport();
  const [id, setId] = useState(initialData?.id || '');
  const [name, setName] = useState(initialData?.name || '');
  
  // Multi-sports selection
  const allSportsList = [
    { id: 'badminton', label: '🏸 Badminton' },
    { id: 'table_tennis', label: '🏓 Table Tennis' },
    { id: 'squash', label: '🎾 Squash' },
    { id: 'tennis', label: '🥎 Tennis' },
    { id: 'volleyball', label: '🏐 Volleyball' },
    { id: 'cricket', label: '🏏 Cricket' },
  ];

  const initialSports = initialData?.sports && initialData.sports.length > 0
    ? initialData.sports
    : (initialData?.sport ? [initialData.sport] : (activeSport !== 'all' ? [activeSport] : ['badminton']));

  const [selectedSports, setSelectedSports] = useState<string[]>(initialSports);
  const [eventType, setEventType] = useState<'singles' | 'doubles' | 'team'>(initialData?.event_type || 'singles');
  const [category, setCategory] = useState<'junior' | 'open' | 'veteran' | string>(initialData?.category || 'open');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Mixed' | 'Open' | 'Boys' | 'Girls'>(
    (initialData?.gender as any) || 'Male'
  );
  const [minAge, setMinAge] = useState(initialData?.min_age !== undefined ? String(initialData.min_age) : '0');
  const [maxAge, setMaxAge] = useState(initialData?.max_age !== undefined ? String(initialData.max_age) : '100');

  const toggleSport = (sportId: string) => {
    setSelectedSports(prev => {
      if (prev.includes(sportId)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter(s => s !== sportId);
      } else {
        return [...prev, sportId];
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Auto-generate code if empty and not in edit mode
    let finalId = id.trim();
    if (!finalId && !isEdit) {
      finalId = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // remove special characters
        .replace(/\s+/g, '_'); // replace spaces with underscores
    }

    onSubmit({
      id: finalId,
      name: name.trim(),
      event_type: eventType,
      category,
      gender,
      min_age: parseInt(minAge) || 0,
      max_age: parseInt(maxAge) || 100,
      sport: selectedSports[0] || 'badminton',
      sports: selectedSports,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>{title}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><IconX size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="input-group">
            <label className="input-label">Associated Sports (Select one or more) *</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 4 }}>
              {allSportsList.map(sp => {
                const checked = selectedSports.includes(sp.id);
                return (
                  <label
                    key={sp.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: checked ? 'rgba(37, 99, 235, 0.15)' : 'var(--bg-secondary)',
                      border: checked ? '1px solid var(--accent)' : '1px solid var(--border)',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: checked ? 600 : 400,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSport(sp.id)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span>{sp.label}</span>
                  </label>
                );
              })}
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              Example: &ldquo;Under 9 Boys&rdquo; can apply to Badminton, TT, Squash, &amp; Tennis. &ldquo;Mens Team&rdquo; can apply to Volleyball &amp; Cricket.
            </span>
          </div>
          
          <div className="input-group">
            <label className="input-label" htmlFor="me-name">Template Name *</label>
            <input
              id="me-name"
              className="input"
              placeholder="e.g. Under-9 Boys Singles or Mens Team"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="me-id">Code / Short ID</label>
            <input
              id="me-id"
              className="input"
              placeholder={isEdit ? '' : 'e.g. u9_boys (leave blank to auto-generate)'}
              value={id}
              onChange={e => setId(e.target.value)}
              disabled={isEdit}
            />
            {isEdit && <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Template codes cannot be modified after creation.</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="input-group">
              <label className="input-label" htmlFor="me-type">Event Type</label>
              <select
                id="me-type"
                className="input"
                value={eventType}
                onChange={e => setEventType(e.target.value as any)}
              >
                <option value="singles">Singles</option>
                <option value="doubles">Doubles</option>
                <option value="team">Team Championship</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="me-cat">Category</label>
              <select
                id="me-cat"
                className="input"
                value={category}
                onChange={e => {
                  const catVal = e.target.value as any;
                  setCategory(catVal);
                  if (catVal === 'junior') {
                    if (maxAge === '100') setMaxAge('15');
                    setMinAge('0');
                  } else if (catVal === 'veteran') {
                    if (minAge === '0') setMinAge('35');
                    setMaxAge('100');
                  } else {
                    setMinAge('0');
                    setMaxAge('100');
                  }
                }}
              >
                <option value="junior">Junior</option>
                <option value="open">Open</option>
                <option value="veteran">Veteran</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="me-gender">Gender Classification (Compulsory) *</label>
            <select
              id="me-gender"
              className="input"
              value={gender}
              onChange={e => setGender(e.target.value as any)}
              required
            >
              <option value="Boys">Boys (Junior)</option>
              <option value="Girls">Girls (Junior)</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Mixed">Mixed</option>
              <option value="Open">Open (All genders)</option>
            </select>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              All events require a compulsory gender classification.
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="input-group">
              <label className="input-label" htmlFor="me-min-age">Minimum Age Limit</label>
              <input
                id="me-min-age"
                type="number"
                className="input"
                value={minAge}
                onChange={e => setMinAge(e.target.value)}
                min="0"
                max="120"
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="me-max-age">Maximum Age Limit</label>
              <input
                id="me-max-age"
                type="number"
                className="input"
                value={maxAge}
                onChange={e => setMaxAge(e.target.value)}
                min="0"
                max="120"
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={!name}>
              {isEdit ? 'Save Changes' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
