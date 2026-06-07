'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getTournaments, getEvents, getPlayerRegistrations, createRegistration, getAllProfiles, getCheckoutSessionUrl } from '@/lib/supabase-service';
import { useAuth } from '@/lib/auth-context';
import { IconCalendar, IconMapPin, IconTrophy, IconCheck, IconChevronDown, IconChevronRight } from '@/components/icons';
import { Tournament, TournamentEvent, Registration } from '@/types';
import ShuttlecockLoader from '@/components/ShuttlecockLoader';

export default function MyTournamentsPage() {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [events, setEvents] = useState<TournamentEvent[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTourId, setExpandedTourId] = useState<string | null>(null);

  // Doubles partner modal state
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [activeRegTourId, setActiveRegTourId] = useState('');
  const [activeRegEventId, setActiveRegEventId] = useState<string | null>(null);
  
  const [partnerName, setPartnerName] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [partnerGender, setPartnerGender] = useState('Male');
  const [partnerAge, setPartnerAge] = useState('');
  const [submittingRegistration, setSubmittingRegistration] = useState(false);

  // Autocomplete state
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (!user) return;
    const userId = user.id;
    async function loadData() {
      try {
        setLoading(true);
        const [toursData, eventsData, regsData, profilesData] = await Promise.all([
          getTournaments(),
          getEvents(),
          getPlayerRegistrations(userId),
          getAllProfiles()
        ]);
        setTournaments(toursData);
        setEvents(eventsData);
        setRegistrations(regsData);
        setProfiles(profilesData);
      } catch (err) {
        console.error('Failed to load tournaments directory:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const handleRegister = async (tournamentId: string, eventId: string) => {
    if (!user) return;

    // 1. Check if profile is complete
    if (user.age === undefined || user.age === null || !user.gender) {
      setToast('Please complete your profile details (Age & Gender) first! Redirecting...');
      setTimeout(() => {
        window.location.href = '/dashboard/profile';
      }, 2000);
      return;
    }

    // Find the specific event to check restrictions
    const ev = events.find(e => e.id === eventId);
    if (!ev) return;

    // Check if it is a Doubles Category
    const isDoubles = ev.category && ev.category.trim().toUpperCase().endsWith('D');

    if (isDoubles) {
      setActiveRegTourId(tournamentId);
      setActiveRegEventId(eventId);
      setPartnerName('');
      setPartnerEmail('');
      setPartnerGender('Male');
      setPartnerAge('');
      setSelectedPartnerId(null);
      setShowSuggestions(false);
      setPartnerModalOpen(true);
      return;
    }

    // Else register as Singles
    await submitSinglesRegistration(tournamentId, eventId, ev);
  };

  const submitSinglesRegistration = async (tournamentId: string, eventId: string, ev: TournamentEvent) => {
    if (!user) return;

    // 2. Client-side Gender Validation
    if (ev.gender_restriction && ev.gender_restriction !== 'open') {
      const pGender = (user.gender || '').trim().toLowerCase();
      const eRestriction = ev.gender_restriction.trim().toLowerCase();
      
      let genderMatch = false;
      if (eRestriction === 'men' && (pGender === 'men' || pGender === 'male')) {
        genderMatch = true;
      } else if (eRestriction === 'women' && (pGender === 'women' || pGender === 'female')) {
        genderMatch = true;
      } else if (eRestriction === 'mixed') {
        genderMatch = true;
      }

      if (!genderMatch) {
        setToast(`Registration failed: Gender does not match event requirement (${ev.gender_restriction} only)`);
        setTimeout(() => setToast(null), 3000);
        return;
      }
    }

    // 3. Client-side Age Validation
    if (ev.age_limit && ev.age_limit > 0) {
      const pAge = user.age || 0;
      const limit = ev.age_limit;
      const rType = ev.age_restriction_type ? ev.age_restriction_type.trim().toLowerCase() : 'max';

      let ageValid = true;
      if (rType === 'max' && pAge > limit) {
        ageValid = false;
      } else if (rType === 'min' && pAge < limit) {
        ageValid = false;
      }

      if (!ageValid) {
        const errorMsg = rType === 'max' 
          ? `Age exceeds the maximum limit of ${limit} for this event.` 
          : `Age is below the minimum limit of ${limit} for this event.`;
        setToast(`Registration failed: ${errorMsg}`);
        setTimeout(() => setToast(null), 3000);
        return;
      }
    }

    const tournament = tournaments.find(t => t.id === tournamentId);
    if (tournament?.collects_fees && !tournament.stripe_account_id) {
      setToast('Ineligible: Tournament collects entry fees but Stripe payouts are not set up by the organizer.');
      setTimeout(() => setToast(null), 4000);
      return;
    }

    try {
      setSubmittingRegistration(true);
      const newReg: Registration = {
        id: `r${Date.now()}`,
        tournament_id: tournamentId,
        event_id: eventId,
        player_id: user.id,
        player_name: user.name,
        player_email: user.email,
        status: 'pending',
        registered_at: new Date().toISOString(),
      };
      
      await createRegistration(newReg);
      setRegistrations(prev => [...prev, newReg]);

      if (tournament?.collects_fees && tournament.entry_fee && tournament.entry_fee > 0) {
        setToast('Redirecting to secure entry fee checkout...');
        sessionStorage.setItem('pending_registration_id', newReg.id);
        const checkoutUrl = await getCheckoutSessionUrl(newReg.id);
        window.location.href = checkoutUrl;
        return;
      }

      setToast('Registration submitted! Awaiting approval.');
    } catch (err: any) {
      console.error(err);
      setToast(err.message || 'Registration failed.');
    } finally {
      setSubmittingRegistration(false);
    }
    setTimeout(() => setToast(null), 3500);
  };

  const handlePartnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeRegEventId || !activeRegTourId) return;

    const ev = events.find(evObj => evObj.id === activeRegEventId);
    if (!ev) return;

    if (!partnerName.trim()) {
      setToast('Partner Name is required.');
      return;
    }

    const pGender = (user.gender || '').trim().toLowerCase();
    const partGender = partnerGender.trim().toLowerCase();
    const cat = (ev.category || '').trim().toUpperCase();

    // Enforce Men's/Boys' Doubles Gender Validations
    if (cat === 'MD' || (cat.startsWith('B') && cat.endsWith('D'))) {
      const isUserMale = pGender === 'male' || pGender === 'men';
      const isPartnerMale = partGender === 'male' || partGender === 'men';
      if (!isUserMale) {
        setToast("Ineligible: Only male players are allowed in Men's/Boys' doubles events.");
        return;
      }
      if (!isPartnerMale) {
        setToast("Ineligible: Partner must be male in Men's/Boys' doubles events.");
        return;
      }
    }
    // Enforce Women's/Girls' Doubles Gender Validations
    else if (cat === 'WD' || (cat.startsWith('G') && cat.endsWith('D'))) {
      const isUserFemale = pGender === 'female' || pGender === 'women';
      const isPartnerFemale = partGender === 'female' || partGender === 'women';
      if (!isUserFemale) {
        setToast("Ineligible: Only female players are allowed in Women's/Girls' doubles events.");
        return;
      }
      if (!isPartnerFemale) {
        setToast("Ineligible: Partner must be female in Women's/Girls' doubles events.");
        return;
      }
    }
    // Enforce Mixed Doubles Gender Validations
    else if (cat === 'XD' || (ev.gender_restriction || '').trim().toLowerCase() === 'mixed') {
      const isUserMale = pGender === 'male' || pGender === 'men';
      const isPartnerMale = partGender === 'male' || partGender === 'men';
      const isUserFemale = pGender === 'female' || pGender === 'women';
      const isPartnerFemale = partGender === 'female' || partGender === 'women';

      if (!((isUserMale && isPartnerFemale) || (isUserFemale && isPartnerMale))) {
        setToast('Ineligible: Mixed doubles requires exactly one male and one female player.');
        return;
      }
    }

    const tournament = tournaments.find(t => t.id === activeRegTourId);
    if (tournament?.collects_fees && !tournament.stripe_account_id) {
      setToast('Ineligible: Tournament collects entry fees but Stripe payouts are not set up by the organizer.');
      setTimeout(() => setToast(null), 4000);
      return;
    }

    // Submit Doubles Registration
    try {
      setSubmittingRegistration(true);
      const newReg: Registration = {
        id: `r${Date.now()}`,
        tournament_id: activeRegTourId,
        event_id: activeRegEventId,
        player_id: user.id,
        player_name: user.name,
        player_email: user.email,
        status: 'pending',
        registered_at: new Date().toISOString(),
        partner_name: partnerName.trim(),
        partner_email: partnerEmail.trim() || undefined,
        partner_gender: partnerGender,
        partner_age: partnerAge ? parseInt(partnerAge) : undefined,
      };

      await createRegistration(newReg);
      setRegistrations(prev => [...prev, newReg]);

      if (tournament?.collects_fees && tournament.entry_fee && tournament.entry_fee > 0) {
        setToast('Redirecting to secure entry fee checkout...');
        sessionStorage.setItem('pending_registration_id', newReg.id);
        const checkoutUrl = await getCheckoutSessionUrl(newReg.id);
        window.location.href = checkoutUrl;
        return;
      }

      setToast('Doubles registration submitted! Awaiting approval.');
      setPartnerModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setToast(err.message || 'Registration failed.');
    } finally {
      setSubmittingRegistration(false);
    }
    setTimeout(() => setToast(null), 3500);
  };

  const checkEligibility = (ev: TournamentEvent): { eligible: boolean; reason?: string; needsProfileUpdate?: boolean } => {
    if (!user) return { eligible: false };
    
    const hasRestrictions = (ev.gender_restriction && ev.gender_restriction !== 'open') || (ev.age_limit && ev.age_limit > 0);
    if (hasRestrictions && (user.age === undefined || user.age === null || !user.gender)) {
      return { eligible: false, reason: 'Profile details missing (Age & Gender)', needsProfileUpdate: true };
    }

    if (ev.gender_restriction && ev.gender_restriction !== 'open') {
      const pGender = user.gender ? user.gender.trim().toLowerCase() : '';
      const eRestriction = ev.gender_restriction.trim().toLowerCase();
      
      let genderMatch = false;
      if (eRestriction === 'men' && (pGender === 'men' || pGender === 'male')) {
        genderMatch = true;
      } else if (eRestriction === 'women' && (pGender === 'women' || pGender === 'female')) {
        genderMatch = true;
      } else if (eRestriction === 'mixed') {
        genderMatch = true;
      }

      if (!genderMatch) {
        return { eligible: false, reason: `Gender requirement not met (${ev.gender_restriction} only)` };
      }
    }

    if (ev.age_limit && ev.age_limit > 0) {
      const pAge = user.age || 0;
      const limit = ev.age_limit;
      const rType = ev.age_restriction_type ? ev.age_restriction_type.trim().toLowerCase() : 'max';

      let ageValid = true;
      if (rType === 'max' && pAge > limit) {
        ageValid = false;
      } else if (rType === 'min' && pAge < limit) {
        ageValid = false;
      }

      if (!ageValid) {
        const errorMsg = rType === 'max' 
          ? `Age exceeds maximum limit of ${limit}` 
          : `Age is below minimum limit of ${limit}`;
        return { eligible: false, reason: errorMsg };
      }
    }

    return { eligible: true };
  };

  // Search & Sorting Business Logic
  const searchedTournaments = tournaments.filter(t => {
    const q = searchQuery.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      (t.location && t.location.toLowerCase().includes(q)) ||
      (t.description && t.description.toLowerCase().includes(q)) ||
      t.status.toLowerCase().includes(q)
    );
  });

  // Sort upcoming in ascending start_date order.
  const upcomingTours = searchedTournaments
    .filter(t => t.status === 'open' || t.status === 'live' || t.status === 'draft')
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

  // Sort past in descending start_date order.
  const pastTours = searchedTournaments
    .filter(t => t.status === 'completed' || t.status === 'cancelled')
    .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());

  const displayedTournaments = [...upcomingTours, ...pastTours];

  if (loading) {
    return (
      <div className="glass-card" style={{ padding: 48 }}>
        <ShuttlecockLoader message="Loading open tournaments..." />
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Browse Tournaments</h1>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>Search and register for open tournaments, or review past results</p>

      {/* Search Input Bar */}
      <div style={{ marginBottom: 24, display: 'flex', gap: 12, alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search tournaments by name, location, description, or status..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="input"
          style={{ width: '100%', maxWidth: 480, height: 40 }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="btn btn-ghost btn-sm"
            style={{ padding: '0 12px', height: 40 }}
          >
            Clear
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gap: 20 }}>
        {displayedTournaments.length > 0 ? (
          displayedTournaments.map(t => {
            const tournamentEvents = events.filter(e => e.tournament_id === t.id);
            const isExpanded = expandedTourId === t.id;
            return (
              <div
                key={t.id}
                className="glass-card"
                style={{
                  overflow: 'hidden',
                  border: isExpanded ? '1px solid var(--accent)' : '1px solid var(--border)',
                  transition: 'border-color 0.2s'
                }}
              >
                {/* Header: Click to Expand */}
                <div
                  style={{
                    height: 80,
                    background: t.status === 'live'
                      ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                      : t.status === 'completed'
                      ? 'linear-gradient(135deg, #1e293b, #334155)'
                      : t.status === 'cancelled'
                      ? 'linear-gradient(135deg, #ef444420, #ef444440)'
                      : 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 24px',
                    gap: 12,
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                  onClick={() => setExpandedTourId(isExpanded ? null : t.id)}
                >
                  <IconTrophy size={28} style={{ color: t.status === 'cancelled' ? 'var(--score-loss)' : '#ffffff', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2 style={{
                      fontSize: 18,
                      fontWeight: 700,
                      margin: 0,
                      color: '#ffffff',
                      textDecoration: t.status === 'cancelled' ? 'line-through' : 'none',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {t.name}
                    </h2>
                    <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.9)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      📍 {t.location}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    <span className="badge" style={{
                      fontSize: 10,
                      textTransform: 'uppercase',
                      background: 'rgba(255, 255, 255, 0.2)',
                      color: '#ffffff',
                      border: '1px solid rgba(255, 255, 255, 0.25)'
                    }}>
                      {t.status}
                    </span>
                    <div style={{ color: '#ffffff' }}>
                      {isExpanded ? <IconChevronDown size={20} /> : <IconChevronRight size={20} />}
                    </div>
                  </div>
                </div>

                {/* Collapsible Details Panel */}
                <div style={{
                  maxHeight: isExpanded ? '2500px' : '0px',
                  overflow: 'hidden',
                  transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                  background: 'var(--bg-primary)'
                }}>
                  <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border)' }}>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
                      {t.description || 'No description provided.'}
                    </p>
                    
                    <div style={{ display: 'flex', gap: 24, fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <IconCalendar size={14} />
                        <strong>Dates:</strong> {new Date(t.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} — {new Date(t.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <IconMapPin size={14} />
                        <strong>Venue:</strong> {t.location}
                      </span>
                      {t.collects_fees && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#34d399', fontWeight: 600 }}>
                          🪙 Entry Fee: {new Intl.NumberFormat('en-US', { style: 'currency', currency: t.currency || 'INR' }).format(t.entry_fee || 0)}
                        </span>
                      )}
                    </div>

                    {/* Events to register */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {t.type === 'team' ? (
                        (() => {
                          const teamEvent = tournamentEvents.find(e => e.category === 'TEAM') || tournamentEvents[0];
                          if (!teamEvent) return <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No registration events available</div>;
                          
                          const isRegistered = user && registrations.some(
                            r => r.player_id === user.id && r.tournament_id === t.id
                          );
                          const eligibility = checkEligibility(teamEvent);

                          return (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '12px 16px',
                              borderRadius: 'var(--radius-md)',
                              background: 'var(--bg-secondary)',
                              border: '1px solid var(--border)',
                            }}>
                              <div>
                                <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--accent)' }}>📋 Team Tournament Roster Entry</span>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                                  Register to join the pool of players. The tournament administrator or team captains can assign you to a team.
                                </div>
                                {!eligibility.eligible && eligibility.reason && (
                                  <div style={{ fontSize: 11, color: 'var(--score-loss)', marginTop: 4, fontWeight: 500 }}>
                                    ⚠️ Ineligible: {eligibility.reason}
                                  </div>
                                )}
                              </div>
                              {isRegistered ? (
                                <span className="btn btn-sm" style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--score-win)', border: 'none', cursor: 'default' }}>
                                  <IconCheck size={14} /> Registered
                                </span>
                              ) : eligibility.needsProfileUpdate ? (
                                <button
                                  className="btn btn-sm"
                                  onClick={() => handleRegister(t.id, teamEvent.id)}
                                  style={{ background: 'var(--warning)', color: '#fff', border: 'none' }}
                                >
                                  Complete Profile
                                </button>
                              ) : !eligibility.eligible ? (
                                <button
                                  className="btn btn-sm"
                                  disabled
                                  style={{ background: 'var(--border)', color: 'var(--text-muted)', border: 'none', cursor: 'not-allowed' }}
                                >
                                  Ineligible
                                </button>
                              ) : (
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleRegister(t.id, teamEvent.id)}
                                >
                                  Register to Roster
                                </button>
                              )}
                            </div>
                          );
                        })()
                      ) : (
                        tournamentEvents.map(ev => {
                          const isRegistered = user && registrations.some(
                            r => r.player_id === user.id && r.event_id === ev.id
                          );
                          const genderBadge = ev.gender_restriction && ev.gender_restriction !== 'open' ? (
                            <span className="badge badge-accent" style={{ textTransform: 'capitalize', fontSize: 10, padding: '2px 6px', marginLeft: 8 }}>
                              {ev.gender_restriction}
                            </span>
                          ) : null;
                          const ageBadge = ev.age_limit && ev.age_limit > 0 ? (
                            <span className="badge badge-open" style={{ fontSize: 10, padding: '2px 6px', marginLeft: 6 }}>
                              {ev.age_restriction_type === 'min' ? `${ev.age_limit}+` : `U${ev.age_limit}`}
                            </span>
                          ) : null;

                          const eligibility = checkEligibility(ev);

                          return (
                            <div key={ev.id} style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '12px 16px',
                              borderRadius: 'var(--radius-md)',
                              background: 'var(--bg-secondary)',
                              border: '1px solid var(--border)',
                            }}>
                              <div>
                                <span style={{ fontWeight: 600, fontSize: 14 }}>🏸 {ev.event_name}</span>
                                {genderBadge}
                                {ageBadge}
                                {!eligibility.eligible && eligibility.reason && (
                                  <div style={{ fontSize: 11, color: 'var(--score-loss)', marginTop: 4, fontWeight: 500 }}>
                                    ⚠️ Ineligible: {eligibility.reason}
                                  </div>
                                )}
                              </div>
                              {isRegistered ? (
                                <span className="btn btn-sm" style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--score-win)', border: 'none', cursor: 'default' }}>
                                  <IconCheck size={14} /> Registered
                                </span>
                              ) : eligibility.needsProfileUpdate ? (
                                <button
                                  className="btn btn-sm"
                                  onClick={() => handleRegister(t.id, ev.id)}
                                  style={{ background: 'var(--warning)', color: '#fff', border: 'none' }}
                                >
                                  Complete Profile
                                </button>
                              ) : !eligibility.eligible ? (
                                <button
                                  className="btn btn-sm"
                                  disabled
                                  style={{ background: 'var(--border)', color: 'var(--text-muted)', border: 'none', cursor: 'not-allowed' }}
                                >
                                  Ineligible
                                </button>
                              ) : (
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleRegister(t.id, ev.id)}
                                >
                                  Register
                                </button>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                      <Link href={`/tournament/${t.slug || t.id}`} className="btn btn-ghost btn-sm" style={{ padding: 0 }}>
                        View Public Page →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state" style={{ padding: 40 }}>
            <div className="empty-state-icon">🏆</div>
            <p style={{ fontSize: 15, fontWeight: 500 }}>No tournaments found</p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Try adjusting your search criteria.</p>
          </div>
        )}
      </div>

      {/* Doubles Partner Details Modal */}
      {partnerModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20,
        }}>
          <div className="glass-card animate-slide-up" style={{ width: '100%', maxWidth: 450, padding: 28 }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>🏸 Doubles Partner Registration</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
              This category requires a doubles partner. Enter your partner's details to register. Both players will be registered as **1 entry**.
            </p>

            <form onSubmit={handlePartnerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="input-group" style={{ position: 'relative' }}>
                <label className="input-label" htmlFor="partner-name">Partner Full Name</label>
                <input
                  id="partner-name"
                  type="text"
                  className="input"
                  placeholder="Type to search existing players..."
                  value={partnerName}
                  onChange={e => {
                    setPartnerName(e.target.value);
                    setSelectedPartnerId(null);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => {
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                  required
                  autoComplete="off"
                />

                {showSuggestions && partnerName.trim().length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(10px)',
                    zIndex: 1050,
                    maxHeight: 180,
                    overflowY: 'auto',
                    marginTop: 4,
                  }}>
                    {profiles
                      .filter(p => 
                        (p.name?.toLowerCase().includes(partnerName.toLowerCase()) || 
                         p.email?.toLowerCase().includes(partnerName.toLowerCase())) &&
                        p.id !== user?.id
                      )
                      .map(p => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setPartnerName(p.name || '');
                            setPartnerEmail(p.email || '');
                            setPartnerGender(p.gender || 'Male');
                            setPartnerAge(p.age !== undefined && p.age !== null ? String(p.age) : '');
                            setSelectedPartnerId(p.id);
                            setShowSuggestions(false);
                          }}
                          style={{
                            padding: '10px 14px',
                            cursor: 'pointer',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)' }}>
                            {p.name}
                            {p.phone && p.gender && p.age !== null && p.age !== undefined ? (
                              <span style={{ fontSize: 9, background: 'rgba(34, 197, 94, 0.15)', color: 'var(--score-win)', padding: '1px 5px', borderRadius: 4 }}>✓ Profile Complete</span>
                            ) : (
                              <span style={{ fontSize: 9, background: 'rgba(239, 68, 68, 0.15)', color: 'var(--score-loss)', padding: '1px 5px', borderRadius: 4 }}>⚠️ Profile Incomplete</span>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.email}</div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="partner-email">Partner Email Address</label>
                <input
                  id="partner-email"
                  type="email"
                  className="input"
                  placeholder="partner@example.com"
                  value={partnerEmail}
                  onChange={e => setPartnerEmail(e.target.value)}
                  autoComplete="off"
                />
                {partnerEmail && !profiles.some(p => p.email?.toLowerCase() === partnerEmail.toLowerCase()) && (
                  <div style={{
                    fontSize: 11,
                    color: '#f59e0b',
                    marginTop: 6,
                    background: 'rgba(245, 158, 11, 0.08)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                  }}>
                    <span style={{ fontWeight: 600 }}>📝 Shadow Profile Auto-Creation:</span>
                    <span>This email is not registered yet. A new shadow profile will be created. Your partner can claim and complete this profile upon signing up with this email.</span>
                  </div>
                )}
                {selectedPartnerId && (
                  <div style={{
                    fontSize: 11,
                    color: 'var(--score-win)',
                    marginTop: 6,
                    background: 'rgba(34, 197, 94, 0.08)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(34, 197, 94, 0.2)',
                    fontWeight: 600,
                  }}>
                    ✨ Existing Player Selected: Suggestions will use their registered profile details.
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="input-group">
                  <label className="input-label" htmlFor="partner-gender">Partner Gender</label>
                  <select
                    id="partner-gender"
                    className="input"
                    value={partnerGender}
                    onChange={e => setPartnerGender(e.target.value)}
                    required
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="partner-age">Partner Age</label>
                  <input
                    id="partner-age"
                    type="number"
                    className="input"
                    placeholder="Partner age"
                    value={partnerAge}
                    onChange={e => setPartnerAge(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setPartnerModalOpen(false)}
                  disabled={submittingRegistration}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingRegistration}
                >
                  {submittingRegistration ? "Submitting..." : "Submit Registration"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast ${toast.includes('failed') || toast.includes('Please') || toast.includes('Ineligible') ? 'toast-error' : 'toast-success'}`}>
          {toast}
        </div>
      )}
    </div>
  );
}
