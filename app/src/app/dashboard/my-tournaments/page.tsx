'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getTournaments, getEvents, getPlayerRegistrations, createRegistration, getAllProfiles, getRazorpayConfig, createRazorpayOrder, verifyRazorpayPayment, mockPayRegistration, deleteRegistration } from '@/lib/supabase-service';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useSport } from '@/lib/sport-context';
import { IconCalendar, IconMapPin, IconTrophy, IconCheck, IconChevronDown, IconChevronRight, IconX } from '@/components/icons';
import { Tournament, TournamentEvent, Registration } from '@/types';
import ShuttlecockLoader from '@/components/ShuttlecockLoader';

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if ((window as any).Razorpay) {
      return resolve(true);
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function MyTournamentsPage() {
  const { user } = useAuth();
  const { activeSport } = useSport();
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

  // Payment Selection Modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [pendingRegistration, setPendingRegistration] = useState<{ reg: Registration, tournament: Tournament, fee: number } | null>(null);

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

  const handleWithdraw = async (regId: string) => {
    if (!user) return;
    const confirmWithdraw = window.confirm("Are you sure you want to withdraw from this event? This action cannot be undone.");
    if (!confirmWithdraw) return;

    try {
      setToast('Withdrawing registration...');
      await deleteRegistration(regId, user);
      setToast('Successfully withdrew registration!');
      setTimeout(() => setToast(null), 3000);
      
      // Refresh the player's registrations
      const updatedRegs = await getPlayerRegistrations(user.id);
      setRegistrations(updatedRegs);
    } catch (err: any) {
      console.error(err);
      setToast(err.message || 'Failed to withdraw registration. Please try again.');
      setTimeout(() => setToast(null), 3000);
    }
  };

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
    if (!tournament) return;
    
    const fee = ev.entry_fee ?? tournament.entry_fee ?? 0;
    const isPaymentEnabled = tournament.collects_fees || (ev && ev.entry_fee && ev.entry_fee > 0);

    // Fallback if payment options are totally missing or empty but collects fees is true
    const hasRazorpay = tournament.payment_options?.find(p => p.provider === 'razorpay')?.enabled || (ev && ev.entry_fee && ev.entry_fee > 0);
    const hasMock = tournament.payment_options?.find(p => p.provider === 'mock')?.enabled;
    
    if (isPaymentEnabled && !(hasRazorpay || hasMock)) {
      setToast('Ineligible: Tournament collects entry fees but no payment providers are set up by the organizer.');
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

      if (isPaymentEnabled && fee > 0) {
        setPendingRegistration({ reg: newReg, tournament, fee });
        setPaymentModalOpen(true);
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
    if (!tournament) return;

    const isPaymentEnabled = tournament.collects_fees || (ev && ev.entry_fee && ev.entry_fee > 0);
    const hasRazorpay = tournament.payment_options?.find(p => p.provider === 'razorpay')?.enabled || (ev && ev.entry_fee && ev.entry_fee > 0);
    const hasMock = tournament.payment_options?.find(p => p.provider === 'mock')?.enabled;

    if (isPaymentEnabled && !(hasRazorpay || hasMock)) {
      setToast('Ineligible: Tournament collects entry fees but no payment providers are set up by the organizer.');
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

      setPartnerModalOpen(false);
      setPartnerName('');
      setPartnerEmail('');
      setPartnerGender('Male');
      setPartnerAge('');
      setSelectedPartnerId(null);

      const fee = ev.entry_fee ?? tournament.entry_fee ?? 0;

      if (isPaymentEnabled && fee > 0) {
        setPendingRegistration({ reg: newReg, tournament, fee });
        setPaymentModalOpen(true);
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
    const matchesSport = activeSport === 'all' || t.sport === activeSport;
    if (!matchesSport) return false;
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
    .sort((a, b) => {
      const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
      const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
      return dateA - dateB;
    });

  // Sort past in descending start_date order.
  const pastTours = searchedTournaments
    .filter(t => t.status === 'completed' || t.status === 'cancelled')
    .sort((a, b) => {
      const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
      const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
      return dateB - dateA;
    });

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
            const hasEventWithFee = tournamentEvents.some(e => e.entry_fee && e.entry_fee > 0);
            const isExpanded = expandedTourId === t.id;
            const canWithdraw = (() => {
              const todayStr = new Date().toISOString().split('T')[0];
              if (t.withdraw_date) {
                return todayStr <= t.withdraw_date;
              }
              return todayStr < t.start_date;
            })();
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
                    background: t.status === 'completed'
                      ? 'linear-gradient(135deg, #1e293b, #334155)'
                      : t.status === 'cancelled'
                      ? 'linear-gradient(135deg, #ef444420, #ef444440)'
                      : 'linear-gradient(135deg, #1d4ed8, #2563eb)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 24px',
                    gap: 12,
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                  onClick={() => setExpandedTourId(isExpanded ? null : t.id)}
                >
                  <div style={{ color: t.status === 'cancelled' ? 'var(--score-loss)' : '#ffffff', flexShrink: 0, display: 'flex' }}>
                    <IconTrophy size={28} />
                  </div>
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
                    <div style={{
                      fontSize: 12,
                      color: 'rgba(255, 255, 255, 0.9)',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '4px 12px',
                      alignItems: 'center',
                      marginTop: 4
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        📍 {t.location}
                      </span>
                      {t.start_date && t.end_date && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          • 📅 {new Date(t.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} — {new Date(t.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
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
                      {t.withdraw_date && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          🚫 <strong>Withdraw Deadline:</strong> {new Date(t.withdraw_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                      {(t.collects_fees || hasEventWithFee) && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#34d399', fontWeight: 600 }}>
                          🪙 Entry Fees apply (Select event to see specific fee)
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
                                (() => {
                                  const regObj = user ? registrations.find(
                                    r => r.player_id === user.id && r.tournament_id === t.id
                                  ) : null;
                                  const isPaid = regObj ? (regObj.payment_status === 'paid' || regObj.payment_status === 'exempt') : false;
                                  const fee = teamEvent.entry_fee ?? t.entry_fee ?? 0;
                                  const isPaymentEnabled = t.collects_fees || (teamEvent && teamEvent.entry_fee && teamEvent.entry_fee > 0);
                                  const needsPayment = isPaymentEnabled && fee > 0 && regObj && !isPaid;

                                  if (needsPayment) {
                                    return (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <button
                                          className="btn btn-primary btn-sm animate-pulse"
                                          style={{ background: 'linear-gradient(135deg, var(--accent), #3b82f6)', color: 'white', border: 'none', fontWeight: 600 }}
                                          onClick={() => {
                                            setPendingRegistration({ reg: regObj!, tournament: t, fee });
                                            setPaymentModalOpen(true);
                                          }}
                                        >
                                          💳 Pay Fee
                                        </button>
                                        {canWithdraw && (
                                          <button
                                            className="btn btn-outline btn-sm"
                                            style={{ borderColor: 'var(--score-loss)', color: 'var(--score-loss)', fontSize: 12 }}
                                            onClick={() => handleWithdraw(regObj!.id)}
                                          >
                                            Withdraw
                                          </button>
                                        )}
                                      </div>
                                    );
                                  }
                                  return (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <span className="btn btn-sm" style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--score-win)', border: 'none', cursor: 'default' }}>
                                        <IconCheck size={14} /> Registered
                                      </span>
                                      {canWithdraw && (
                                        <button
                                          className="btn btn-outline btn-sm"
                                          style={{ borderColor: 'var(--score-loss)', color: 'var(--score-loss)', fontSize: 12 }}
                                          onClick={() => handleWithdraw(regObj!.id)}
                                        >
                                          Withdraw
                                        </button>
                                      )}
                                    </div>
                                  );
                                })()
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
                                (() => {
                                  const regObj = user ? registrations.find(
                                    r => r.player_id === user.id && r.event_id === ev.id
                                  ) : null;
                                  const isPaid = regObj ? (regObj.payment_status === 'paid' || regObj.payment_status === 'exempt') : false;
                                  const fee = ev.entry_fee ?? t.entry_fee ?? 0;
                                  const isPaymentEnabled = t.collects_fees || (ev && ev.entry_fee && ev.entry_fee > 0);
                                  const needsPayment = isPaymentEnabled && fee > 0 && regObj && !isPaid;

                                  if (needsPayment) {
                                    return (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <button
                                          className="btn btn-primary btn-sm animate-pulse"
                                          style={{ background: 'linear-gradient(135deg, var(--accent), #3b82f6)', color: 'white', border: 'none', fontWeight: 600 }}
                                          onClick={() => {
                                            setPendingRegistration({ reg: regObj!, tournament: t, fee });
                                            setPaymentModalOpen(true);
                                          }}
                                        >
                                          💳 Pay Fee
                                        </button>
                                        {canWithdraw && (
                                          <button
                                            className="btn btn-outline btn-sm"
                                            style={{ borderColor: 'var(--score-loss)', color: 'var(--score-loss)', fontSize: 12 }}
                                            onClick={() => handleWithdraw(regObj!.id)}
                                          >
                                            Withdraw
                                          </button>
                                        )}
                                      </div>
                                    );
                                  }
                                  return (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <span className="btn btn-sm" style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--score-win)', border: 'none', cursor: 'default' }}>
                                        <IconCheck size={14} /> Registered
                                      </span>
                                      {canWithdraw && (
                                        <button
                                          className="btn btn-outline btn-sm"
                                          style={{ borderColor: 'var(--score-loss)', color: 'var(--score-loss)', fontSize: 12 }}
                                          onClick={() => handleWithdraw(regObj!.id)}
                                        >
                                          Withdraw
                                        </button>
                                      )}
                                    </div>
                                  );
                                })()
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
                      <Link href={`/tournament?slug=${t.slug || t.id}`} className="btn btn-ghost btn-sm" style={{ padding: 0 }}>
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

      {/* Payment Selection Modal */}
      {paymentModalOpen && pendingRegistration && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content animate-slide-up" style={{ maxWidth: 450, width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>Select Payment Method</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setPaymentModalOpen(false)}>
                <IconX size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '0 8px 8px 8px' }}>
              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>
                  {pendingRegistration.tournament.currency} {pendingRegistration.fee}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Entry Fee Required</div>
              </div>

              {(pendingRegistration.tournament.payment_options?.find(p => p.provider === 'razorpay')?.enabled ||
                (() => {
                  const regEvent = events.find(e => e.id === pendingRegistration.reg.event_id);
                  return !!(regEvent && regEvent.entry_fee && regEvent.entry_fee > 0);
                })()) && (
                <button
                  className="btn btn-secondary"
                  style={{ padding: '14px', fontSize: 16, display: 'flex', justifyContent: 'center', gap: 8, background: '#0e1111', color: '#fff' }}
                  onClick={async () => {
                    if (!user) return;
                    try {
                      setToast('Initializing Razorpay Checkout...');
                      
                      // 1. Load Script
                      const loaded = await loadRazorpayScript();
                      if (!loaded) {
                        setToast('Failed to load Razorpay SDK. Please check your network.');
                        return;
                      }

                      // 2. Fetch Config
                      const config = await getRazorpayConfig();

                      // 3. Create Backend Order
                      const order = await createRazorpayOrder(pendingRegistration.reg.id, user.id);
                      if (order.free) {
                        setToast('Registration processed as free!');
                        setPaymentModalOpen(false);
                        setPendingRegistration(null);
                        const updatedRegs = await getPlayerRegistrations(user.id);
                        setRegistrations(updatedRegs);
                        return;
                      }

                      // 4. Check Sandbox / Mock Mode
                      if (config.is_mock) {
                        setToast('Sandbox Mode: Simulating secure payment...');
                        await new Promise(resolve => setTimeout(resolve, 1500));
                        
                        const verification = await verifyRazorpayPayment({
                          razorpay_order_id: order.id,
                          razorpay_payment_id: `pay_mock_${Date.now()}`,
                          razorpay_signature: `mock_sig_${Date.now()}`
                        });
                        
                        if (verification.success) {
                          setToast('Mock Payment Successful! Registration confirmed.');
                          setPaymentModalOpen(false);
                          setPendingRegistration(null);
                          const updatedRegs = await getPlayerRegistrations(user.id);
                          setRegistrations(updatedRegs);
                        } else {
                          setToast('Mock payment verification failed.');
                        }
                        return;
                      }

                      // 5. Open Real checkout
                      const options = {
                        key: config.razorpay_key_id,
                        amount: order.amount * 100, // paise
                        currency: order.currency,
                        name: "MatchPoint",
                        description: `Registration Fee: ${pendingRegistration.tournament.name}`,
                        order_id: order.id,
                        handler: async function (response: any) {
                          setToast('Verifying payment... Please wait.');
                          try {
                            const verification = await verifyRazorpayPayment({
                              razorpay_order_id: response.razorpay_order_id,
                              razorpay_payment_id: response.razorpay_payment_id,
                              razorpay_signature: response.razorpay_signature
                            });
                            
                            if (verification.success) {
                              setToast('Payment Successful! Registration confirmed.');
                              setPaymentModalOpen(false);
                              setPendingRegistration(null);
                              const updatedRegs = await getPlayerRegistrations(user.id);
                              setRegistrations(updatedRegs);
                            } else {
                              setToast('Payment verification failed.');
                            }
                          } catch (err: any) {
                            console.error('Razorpay verification error:', err);
                            setToast(err.message || 'Payment verification failed.');
                          }
                        },
                        prefill: {
                          name: user.name,
                          email: user.email,
                        },
                        theme: {
                           color: "#2563eb"
                        }
                      };

                      const rzp = new (window as any).Razorpay(options);
                      rzp.on('payment.failed', function (response: any) {
                        setToast('Payment failed: ' + response.error.description);
                      });
                      rzp.open();
                    } catch (err: any) {
                      console.error('Razorpay init error:', err);
                      setToast(err.message || 'Failed to start Razorpay checkout.');
                    }
                  }}
                >
                  ⚡ Pay via Razorpay
                </button>
              )}

              {pendingRegistration.tournament.payment_options?.find(p => p.provider === 'mock')?.enabled && (
                <button
                  className="btn btn-secondary"
                  style={{ padding: '14px', fontSize: 16, display: 'flex', justifyContent: 'center', gap: 8, border: '1px solid var(--accent)', color: 'var(--accent)' }}
                  onClick={async () => {
                    if (!user) return;
                    setToast('Processing Mock Payment...');
                    try {
                      if (!isSupabaseConfigured) {
                        await mockPayRegistration(pendingRegistration.reg.id);
                        setToast('Mock Payment Successful! Registration confirmed.');
                        setPaymentModalOpen(false);
                        setPendingRegistration(null);
                        const updatedRegs = await getPlayerRegistrations(user.id);
                        setRegistrations(updatedRegs);
                        return;
                      }

                      const order = await createRazorpayOrder(pendingRegistration.reg.id, user.id);
                      if (order.free) {
                        setToast('Mock Payment Successful! Registration confirmed.');
                        setPaymentModalOpen(false);
                        setPendingRegistration(null);
                        const updatedRegs = await getPlayerRegistrations(user.id);
                        setRegistrations(updatedRegs);
                        return;
                      }

                      const verification = await verifyRazorpayPayment({
                        razorpay_order_id: order.id,
                        razorpay_payment_id: `pay_mock_${Date.now()}`,
                        razorpay_signature: `mock_sig_${Date.now()}`
                      });

                      if (verification.success) {
                        setToast('Mock Payment Successful! Registration confirmed.');
                        setPaymentModalOpen(false);
                        setPendingRegistration(null);
                        const updatedRegs = await getPlayerRegistrations(user.id);
                        setRegistrations(updatedRegs);
                      } else {
                        setToast('Mock payment verification failed.');
                      }
                    } catch (err: any) {
                      console.error(err);
                      setToast(err.message || 'Mock payment failed.');
                    }
                  }}
                >
                  🧪 Test / Mock Payment
                </button>
              )}
            </div>
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
