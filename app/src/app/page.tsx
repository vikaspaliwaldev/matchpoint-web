'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Tournament, TournamentEvent, Match, User } from '@/types';
import * as dbService from '@/lib/supabase-service';
import { getLiveMatches } from '@/lib/mock-data';
import { useSport } from '@/lib/sport-context';
import SportSelector from '@/components/SportSelector';
import {
  IconTrophy,
  IconZap,
  IconTarget,
  IconGlobe,
  IconUsers,
  IconActivity,
  IconCalendar,
  IconMapPin,
  IconShuttlecock,
  IconClock,
} from '@/components/icons';
import { LiquidGlassCard, LiquidButton } from '@/components/kokonutui/liquid-glass-card';

export default function LandingPage() {
  const { user, logout } = useAuth();
  const { activeSport } = useSport();
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [animatedStats, setAnimatedStats] = useState({ tournaments: 0, players: 0, matches: 0 });
  const [dbTournaments, setDbTournaments] = useState<Tournament[]>([]);
  const [dbEvents, setDbEvents] = useState<TournamentEvent[]>([]);
  const [dbMatches, setDbMatches] = useState<Match[]>([]);
  const [dbPlayers, setDbPlayers] = useState<User[]>([]);
  const [dbLeaderboard, setDbLeaderboard] = useState<any[]>([]);
  const [dbStats, setDbStats] = useState<{ tournaments: number; players: number; matches: number } | null>(null);

  // Filtered arrays based on activeSport context
  const filteredTournaments = dbTournaments.filter(t => activeSport === 'all' || t.sport === activeSport);
  const filteredMatches = dbMatches.filter(m => activeSport === 'all' || m.sport === activeSport);
  const filteredLiveMatches = liveMatches.filter(m => activeSport === 'all' || m.sport === activeSport);
  const [explorerTab, setExplorerTab] = useState<'tournament' | 'player'>('tournament');
  const [tourSearchQuery, setTourSearchQuery] = useState('');
  const [tourStatusFilter, setTourStatusFilter] = useState<'all' | 'open_live' | 'completed'>('all');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);


  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Contact Support Form States
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactOrg, setContactOrg] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSuccess, setContactSuccess] = useState(false);
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);

  const matchesLoaded = React.useRef(false);

  const explorerLoaded = React.useRef(false);

  useEffect(() => {
    // Load stats immediately using the lightweight /stats endpoint (just 3 COUNT queries)
    dbService.getStats()
      .then(stats => { setDbStats(stats); setDataLoaded(true); })
      .catch(err => { console.error('Failed to load stats:', err); setDataLoaded(true); });
  }, []);

  // Lazy-load all explorer data only when the user scrolls to / opens the explorer section
  useEffect(() => {
    if (explorerLoaded.current) return;
    explorerLoaded.current = true;

    // Load tournaments (fast ~2s)
    dbService.getTournaments()
      .then(setDbTournaments)
      .catch(err => console.error('Failed to load tournaments:', err));

    // Load events (slower ~10s) — deferred so it doesn't block login
    dbService.getEvents()
      .then(setDbEvents)
      .catch(err => console.error('Failed to load events:', err));
  }, [explorerTab]);

  // Lazy-load matches only when the user opens either explorer tab
  useEffect(() => {
    if (matchesLoaded.current) return;
    if (explorerTab !== 'tournament' && explorerTab !== 'player') return;
    matchesLoaded.current = true;
    dbService.getMatches()
      .then(mats => setDbMatches(mats))
      .catch(err => console.error('Failed to lazy-load matches:', err));
  }, [explorerTab]);


  useEffect(() => {
    // Animate as soon as lightweight stats OR full data is ready (whichever is first)
    if (!dbStats && !dataLoaded) {
      return;
    }

    // Use lightweight stats if available; fall back to derived counts from loaded data
    const targets = {
      tournaments: dbStats ? dbStats.tournaments : filteredTournaments.length,
      players: dbStats ? dbStats.players : dbPlayers.length,
      matches: dbStats ? dbStats.matches : filteredMatches.length
    };
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = Math.min(step / steps, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedStats({
        tournaments: Math.floor(targets.tournaments * eased),
        players: Math.floor(targets.players * eased),
        matches: Math.floor(targets.matches * eased),
      });
      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, [dataLoaded, dbStats, filteredTournaments.length, filteredMatches.length, dbPlayers.length]);

  // Lazy-load players only when user opens the player explorer tab
  const playersLoaded = React.useRef(false);
  useEffect(() => {
    if (explorerTab !== 'player' || playersLoaded.current) return;
    playersLoaded.current = true;
    dbService.getPlayers()
      .then(play => {
        setDbPlayers(play);
        if (play.length > 0) {
          setSelectedPlayerIds(prev => prev.length === 0 ? [play[0].id] : prev);
        }
      })
      .catch(err => console.error('Failed to load players:', err));
  }, [explorerTab]);

  useEffect(() => {
    // Initial live match load
    dbService.getLiveMatchesFromApi().then(setLiveMatches).catch(console.error);

    // Poll every 30 seconds using the lightweight /matches/live endpoint
    const timer = setInterval(async () => {
      try {
        const live = await dbService.getLiveMatchesFromApi();
        setLiveMatches(live);
      } catch (err) {
        console.error('Failed to poll live matches on landing page:', err);
      }
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) return;

    try {
      setIsSubmittingContact(true);
      await dbService.createSupportRequest({
        name: contactName.trim(),
        email: contactEmail.trim(),
        organization: contactOrg.trim() || undefined,
        message: contactMessage.trim(),
      });

      // Secure email dispatch logging (hidden from user UI)
      const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'vpaliwal18@gmail.com';
      console.log(
        `%c[EMAIL DISPATCHER]%c Security Protocol: Sending query securely to ${supportEmail}\nSender: ${contactName.trim()} <${contactEmail.trim()}>\nMessage: ${contactMessage.trim()}`,
        'color: var(--accent); font-weight: bold;',
        'color: inherit;'
      );

      setContactSuccess(true);
      setContactName('');
      setContactEmail('');
      setContactOrg('');
      setContactMessage('');
      
      // Auto reset success message after 5 seconds
      setTimeout(() => setContactSuccess(false), 5000);
    } catch (err) {
      console.error('Failed to submit support request:', err);
      alert('Failed to submit request. Please try again.');
    } finally {
      setIsSubmittingContact(false);
    }
  };

  const features = [
    {
      icon: <IconTrophy size={28} />,
      title: 'Tournament Management',
      description: 'Create and manage tournaments with multiple events, formats, and categories.',
    },
    {
      icon: <IconZap size={28} />,
      title: 'Live Scoring',
      description: 'Real-time score updates with sub-second latency. Umpire-friendly touch interface.',
    },
    {
      icon: <IconTarget size={28} />,
      title: 'Auto Fixtures',
      description: 'Generate knockout brackets, seeded draws, and round-robin schedules automatically.',
    },
    {
      icon: <IconGlobe size={28} />,
      title: 'Public Pages',
      description: 'Share tournament schedules, live scores, and results — no login required.',
    },
    {
      icon: <IconUsers size={28} />,
      title: 'Player Registration',
      description: 'Self-service registration with approval workflows and seed management.',
    },
    {
      icon: <IconActivity size={28} />,
      title: 'Role-Based Dashboards',
      description: 'Dedicated dashboards for admins, players, and umpires with relevant widgets.',
    },
  ];

  const upcomingTournaments = filteredTournaments.filter(t => t.status === 'open' || t.status === 'live');

  return (
    <div style={{ background: 'transparent', minHeight: '100vh' }}>
      <style dangerouslySetInnerHTML={{__html: `
        /* Mobile Navbar overrides */
        .landing-nav-menu {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .landing-nav-toggle {
          display: none;
        }
        
        @media (max-width: 768px) {
          .landing-nav-menu {
            display: none !important;
          }
          .landing-nav-toggle {
            display: flex !important;
            background: transparent;
            border: none;
            color: var(--text-primary);
            cursor: pointer;
            padding: 8px;
          }
          .landing-nav-mobile-menu {
            display: flex;
            flex-direction: column;
            background: var(--bg-card);
            border-bottom: 1px solid var(--border);
            padding: 16px 24px;
            gap: 12px;
            position: absolute;
            top: 64px;
            left: 0;
            right: 0;
            z-index: 50;
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
          }
          .landing-nav-mobile-menu a {
            padding: 8px 0;
            font-size: 15px;
            font-weight: 600;
            text-align: left;
            width: 100%;
          }
          .landing-nav-mobile-menu button {
            padding: 8px 0;
            font-size: 15px;
            font-weight: 600;
            text-align: left;
            width: 100%;
          }
        }

        /* Stats Grid responsive overrides */
        .landing-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          max-width: 600px;
          margin: 60px auto 0;
        }
        @media (max-width: 600px) {
          .landing-stats-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
            margin-top: 40px !important;
          }
        }

        /* Explorer Grid responsive overrides */
        .landing-explorer-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 28px;
          max-height: 560px;
          overflow-y: auto;
        }
        @media (max-width: 768px) {
          .landing-explorer-grid {
            grid-template-columns: 1fr !important;
            max-height: none !important;
            gap: 20px !important;
          }
        }

        /* Explorer tab-group responsive overrides */
        @media (max-width: 580px) {
          .landing-explorer-tabs {
            display: flex !important;
            flex-direction: column !important;
            gap: 4px !important;
          }
        }

        /* Contact form grid responsive overrides */
        .landing-contact-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        @media (max-width: 580px) {
          .landing-contact-grid {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
        }
      `}} />

      {/* Navigation */}
      <nav className="nav">
        <div className="container-app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{
              width: 36, height: 36,
              background: 'linear-gradient(135deg, var(--accent), #3b82f6)',
              borderRadius: 'var(--radius-md)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {activeSport === 'badminton' && <span style={{ fontSize: 18 }}>🏸</span>}
              {activeSport === 'table_tennis' && <span style={{ fontSize: 18 }}>🏓</span>}
              {activeSport === 'squash' && <span style={{ fontSize: 18 }}>🎾</span>}
              {activeSport === 'tennis' && <span style={{ fontSize: 18 }}>🥎</span>}
              {activeSport === 'volleyball' && <span style={{ fontSize: 18 }}>🏐</span>}
              {activeSport === 'cricket' && <span style={{ fontSize: 18 }}>🏏</span>}
              {activeSport === 'basketball' && <span style={{ fontSize: 18 }}>🏀</span>}
              {activeSport === 'all' && <IconShuttlecock size={20} className="" />}
            </div>
            <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>MatchPoint</span>
          </Link>

          {/* Hamburger menu button for mobile */}
          <button 
            className="landing-nav-toggle btn btn-ghost btn-icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>

          {/* Desktop Nav menu */}
          <div className="landing-nav-menu">
            <a
              href="#explorer"
              style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)', textDecoration: 'none', cursor: 'pointer' }}
              className="nav-link"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById('explorer');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                }
                setExplorerTab('tournament');
              }}
            >
              Tournaments
            </a>
            <Link href="/live" style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)', textDecoration: 'none' }} className="nav-link">Live Scores</Link>
            <Link href="/scoreboard" style={{ fontSize: 14, fontWeight: 600, color: '#38BDF8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }} className="nav-link">
              <span>📺</span> Stadium TV
            </Link>
            <Link href="/players" style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)', textDecoration: 'none' }} className="nav-link">Standings</Link>
            <a
              href="#about"
              style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)', textDecoration: 'none', cursor: 'pointer' }}
              className="nav-link"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById('about');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              About Us
            </a>
            <a
              href="#contact"
              style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)', textDecoration: 'none', cursor: 'pointer' }}
              className="nav-link"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById('contact');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              Contact Us
            </a>
            <SportSelector />
            <div style={{ width: 1, height: 16, background: 'var(--border)' }} />
            {user ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--accent), #3b82f6)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 700, color: '#fff'
                    }}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>
                    Hi, {user.name}
                  </span>
                </div>
                <Link href="/dashboard" className="btn btn-primary">Dashboard</Link>
                <button onClick={logout} className="btn btn-ghost" style={{ cursor: 'pointer' }}>
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn btn-ghost">Log In</Link>
                <Link href="/register" className="btn btn-primary">Get Started</Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile Drawer Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="landing-nav-mobile-menu">
            <a
              href="#explorer"
              style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)', textDecoration: 'none', cursor: 'pointer' }}
              className="nav-link"
              onClick={(e) => {
                e.preventDefault();
                setIsMobileMenuOpen(false);
                const el = document.getElementById('explorer');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                }
                setExplorerTab('tournament');
              }}
            >
              Tournaments
            </a>
            <Link href="/live" style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)', textDecoration: 'none' }} className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Live Scores</Link>
            <Link href="/scoreboard" style={{ fontSize: 14, fontWeight: 600, color: '#38BDF8', textDecoration: 'none' }} className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>📺 Stadium TV</Link>
            <Link href="/players" style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)', textDecoration: 'none' }} className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Standings</Link>
            <a
              href="#about"
              style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)', textDecoration: 'none', cursor: 'pointer' }}
              className="nav-link"
              onClick={(e) => {
                e.preventDefault();
                setIsMobileMenuOpen(false);
                const el = document.getElementById('about');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              About Us
            </a>
            <a
              href="#contact"
              style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)', textDecoration: 'none', cursor: 'pointer' }}
              className="nav-link"
              onClick={(e) => {
                e.preventDefault();
                setIsMobileMenuOpen(false);
                const el = document.getElementById('contact');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              Contact Us
            </a>
            <SportSelector style={{ width: '100%', maxWidth: 200, margin: '8px 0' }} />
            <div style={{ height: 1, background: 'var(--border)', width: '100%' }} />
            {user ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--accent), #3b82f6)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 700, color: '#fff'
                    }}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>
                    Hi, {user.name}
                  </span>
                </div>
                <Link href="/dashboard" className="btn btn-primary" style={{ textAlign: 'center' }} onClick={() => setIsMobileMenuOpen(false)}>Dashboard</Link>
                <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="btn btn-ghost" style={{ cursor: 'pointer', textAlign: 'left' }}>
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn btn-ghost" style={{ textAlign: 'left' }} onClick={() => setIsMobileMenuOpen(false)}>Log In</Link>
                <Link href="/register" className="btn btn-primary" style={{ textAlign: 'center' }} onClick={() => setIsMobileMenuOpen(false)}>Get Started</Link>
              </>
            )}
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="hero-gradient" style={{ position: 'relative', overflow: 'hidden', padding: '100px 0 80px' }}>
        <div className="hero-glow" style={{ top: -200, left: '50%', transform: 'translateX(-50%)' }} />
        <div className="container-app" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div className="badge badge-accent" style={{ marginBottom: 20, fontSize: 12 }}>
            <span className="live-dot" style={{ width: 6, height: 6 }} />
            Live Scoring Available
          </div>
          <h1 style={{
            fontSize: 'clamp(36px, 6vw, 72px)',
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: 20,
            background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--accent-hover) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            {activeSport === 'badminton' && <>The Ultimate Badminton<br />Tournament Platform</>}
            {activeSport === 'table_tennis' && <>The Ultimate Table Tennis<br />Tournament Platform</>}
            {activeSport === 'squash' && <>The Ultimate Squash<br />Tournament Platform</>}
            {activeSport === 'tennis' && <>The Ultimate Tennis<br />Tournament Platform</>}
            {activeSport === 'volleyball' && <>The Ultimate Volleyball<br />Tournament Platform</>}
            {activeSport === 'cricket' && <>The Ultimate Cricket<br />Tournament Platform</>}
            {activeSport === 'basketball' && <>The Ultimate Basketball<br />Tournament Platform</>}
            {activeSport === 'all' && <>The Ultimate Multi-Sport<br />Tournament Platform</>}
          </h1>
          <p style={{
            fontSize: 18,
            color: 'var(--text-secondary)',
            maxWidth: 600,
            margin: '0 auto 40px',
            lineHeight: 1.7,
          }}>
            Create tournaments, generate fixtures, score matches in real-time, and share results — all from one powerful platform.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" className="btn btn-primary btn-lg">
              Start Your Tournament
              <IconChevronRight size={18} />
            </Link>
            <Link href="/scoreboard" className="btn btn-secondary btn-lg" style={{ borderColor: 'rgba(56, 189, 248, 0.4)', color: '#38BDF8', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>📺</span> Stadium TV
            </Link>
            <Link href="/demo" className="btn btn-ghost btn-lg">
              View Live Demo
            </Link>
          </div>

          {/* Stats */}
          <div className="landing-stats-grid" style={{ perspective: 1000 }}>
            {[
              { label: 'Tournaments Created', value: animatedStats.tournaments, suffix: '' },
              { label: 'Registered Players', value: animatedStats.players.toLocaleString(), suffix: '' },
              { label: 'Matches Scheduled', value: animatedStats.matches.toLocaleString(), suffix: '' },
            ].map((stat, i) => (
              <LiquidGlassCard
                key={i}
                className="animate-slide-up stagger-item flex flex-col items-center justify-center text-center transition-all duration-300 hover:scale-105 hover:shadow-[0_20px_50px_rgba(37,99,235,0.25)] border border-white/10"
                glassSize="sm"
              >
                <div style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-mono)', background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--accent-hover) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {stat.value}{stat.suffix}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500, marginTop: 4 }}>{stat.label}</div>
              </LiquidGlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Live Matches Ticker - Auto scrolling marquee */}
      {filteredLiveMatches.length > 0 && (
        <section style={{
          background: 'var(--bg-secondary)',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
          padding: '16px 0',
          overflow: 'hidden',
          position: 'relative',
        }}>
          <style>{`
            @keyframes marquee-scroll {
              0% { transform: translateX(0); }
              100% { transform: translateX(-33.33%); }
            }
            .marquee-track {
              display: flex;
              gap: 20px;
              width: max-content;
              animation: marquee-scroll 25s linear infinite;
            }
            .marquee-track:hover {
              animation-play-state: paused;
            }
          `}</style>
          
          <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
            {/* Live Indicator overlay */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexShrink: 0,
              padding: '0 24px',
              background: 'var(--bg-secondary)',
              zIndex: 10,
              borderRight: '1px solid var(--border)',
              boxShadow: '10px 0 15px -5px rgba(0,0,0,0.3)'
            }}>
              <span className="live-dot" />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--score-live)', letterSpacing: '0.05em' }}>LIVE SCORES</span>
            </div>
            
            <div style={{ overflow: 'hidden', flex: 1, display: 'flex' }}>
              <div className="marquee-track">
                {/* Tripled arrays to ensure seamless loop gap coverage */}
                {[...filteredLiveMatches, ...filteredLiveMatches, ...filteredLiveMatches].map((match, idx) => {
                  const currentSet = match.sets?.find(s => !s.is_complete) || match.sets?.[match.sets.length - 1];
                  const tour = dbTournaments.find(t => t.id === match.tournament_id);
                  const ev = dbEvents.find(e => e.id === match.event_id);
                  const tourName = tour?.name || 'Tournament';
                  const eventName = ev?.event_name || 'Event';
                  return (
                    <Link
                      key={`${match.id}-ticker-${idx}`}
                      href="/live"
                      className="glass-card"
                      style={{
                        padding: '10px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        textDecoration: 'none',
                        flexShrink: 0,
                        minWidth: 280,
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border)',
                        transition: 'border-color 0.2s, transform 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--accent)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.transform = 'none';
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {tourName} · {eventName}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{match.player1_name}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{match.player2_name}</div>
                      </div>
                      <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{currentSet?.player1_score ?? 0}</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-secondary)' }}>{currentSet?.player2_score ?? 0}</div>
                      </div>
                      {match.status === 'paused' ? (
                        <div style={{ fontSize: 9, fontWeight: 800, color: '#fff', background: '#f59e0b', padding: '2px 6px', borderRadius: 4, letterSpacing: '0.04em', flexShrink: 0 }}>
                          PAUSED
                        </div>
                      ) : match.sets.length > 1 ? (
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '2px 4px', borderRadius: 'var(--radius-sm)', flexShrink: 0 }}>
                          S{match.sets.length}
                        </div>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Public Explorer Hub */}
      <section id="explorer" style={{ padding: '60px 0', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
        <div className="container-app">
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <span className="badge badge-accent" style={{ marginBottom: 12 }}>Explorer Hub</span>
            <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>
              Public Results & Timelines
            </h2>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto' }}>
              Search tournament draws or look up individual player timelines. Open to the public.
            </p>
          </div>

          {/* Explorer Container */}
          <LiquidGlassCard className="animate-slide-up" style={{ maxWidth: 840, margin: '0 auto' }} glassSize="lg">
            {/* Tabs */}
            <div className="tab-group landing-explorer-tabs" style={{ display: 'flex', width: '100%', marginBottom: 24 }}>
              <button
                className={`tab ${explorerTab === 'tournament' ? 'active' : ''}`}
                onClick={() => setExplorerTab('tournament')}
                style={{ flex: 1, textAlign: 'center' }}
              >
                Tournament History
              </button>
              <button
                className={`tab ${explorerTab === 'player' ? 'active' : ''}`}
                onClick={() => setExplorerTab('player')}
                style={{ flex: 1, textAlign: 'center' }}
              >
                Player History Exposure
              </button>
            </div>

            {/* Content: Tournament History — show all tournaments by default */}
            {explorerTab === 'tournament' && (() => {
              const filteredTours = filteredTournaments.filter(tour => {
                if (tourSearchQuery.trim() !== '') {
                  const q = tourSearchQuery.toLowerCase().trim();
                  const name = (tour.name || '').toLowerCase();
                  const loc = (tour.location || '').toLowerCase();
                  const slug = (tour.slug || '').toLowerCase();
                  const desc = (tour.description || '').toLowerCase();
                  if (!name.includes(q) && !loc.includes(q) && !slug.includes(q) && !desc.includes(q)) {
                    return false;
                  }
                }
                if (tourStatusFilter === 'open_live') {
                  return tour.status === 'open' || tour.status === 'live';
                }
                if (tourStatusFilter === 'completed') {
                  return tour.status === 'completed' || tour.status === 'cancelled';
                }
                return true;
              });

              // Sort tournaments: live (desc) → upcoming/open (asc) → others (desc)
              const statusPriority: Record<string, number> = { live: 0, open: 1, draft: 2, completed: 3, cancelled: 4 };
              const sortedTournaments = [...filteredTours].sort((a, b) => {
                const pa = statusPriority[a.status] ?? 5;
                const pb = statusPriority[b.status] ?? 5;
                if (pa !== pb) return pa - pb;
                const timeA = new Date(a.start_date).getTime();
                const timeB = new Date(b.start_date).getTime();
                // Live → descending (recent first), Open → ascending (soonest first), Others → descending
                if (a.status === 'open') return timeA - timeB;
                return timeB - timeA;
              });

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Search & Status Filters */}
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="🔍 Search tournaments by name, location..."
                      className="input"
                      style={{ flex: 1, minWidth: 260 }}
                      value={tourSearchQuery}
                      onChange={e => setTourSearchQuery(e.target.value)}
                    />
                    <div className="tab-group" style={{ display: 'inline-flex', gap: 2 }}>
                      {[
                        { id: 'all', label: 'All' },
                        { id: 'open_live', label: 'Open / Live' },
                        { id: 'completed', label: 'Completed' }
                      ].map(opt => (
                        <button
                          key={opt.id}
                          className={`tab ${tourStatusFilter === opt.id ? 'active' : ''}`}
                          onClick={() => setTourStatusFilter(opt.id as any)}
                          style={{ padding: '6px 14px', fontSize: 12 }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                    Tournaments ({sortedTournaments.length})
                  </h4>
                  <div style={{ maxHeight: 520, overflowY: 'auto', paddingRight: 6, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {sortedTournaments.length > 0 ? sortedTournaments.map(tour => (
                      <div key={tour.id} style={{ padding: '16px 20px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 20, transition: 'border-color 0.2s' }}>
                        {/* Left: Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                            <span className={`badge badge-${tour.status}`} style={{ fontSize: 10, textTransform: 'uppercase' }}>
                              {tour.status}
                            </span>
                            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                              {tour.type === 'individual' ? 'Individual' : 'Team'}
                            </span>
                          </div>
                          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {tour.name}
                          </h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                            <span>📍 {tour.location}</span>
                            <span>📅 {new Date(tour.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} — {new Date(tour.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                          {tour.description && (
                            <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: '4px 0 0 0' }}>
                              {tour.description}
                            </p>
                          )}
                        </div>
                        {/* Right: CTA */}
                        <div style={{ flexShrink: 0 }}>
                          <Link href={`/tournament?slug=${tour.slug || tour.id}`} className="btn btn-primary" style={{ padding: '6px 14px', fontSize: 11, whiteSpace: 'nowrap' }}>
                            View →
                          </Link>
                        </div>
                      </div>
                    )) : (
                      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', padding: '24px 0' }}>
                        No tournaments found.
                      </p>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Content: Player History */}
            {explorerTab === 'player' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <SearchableMultiSelect
                  id="explore-players-multi"
                  label="Select Player(s)"
                  placeholder="Type to search and select players..."
                  options={dbPlayers.map(p => ({ id: p.id, name: p.name }))}
                  selectedIds={selectedPlayerIds}
                  onChange={setSelectedPlayerIds}
                />

                {/* Selected Players details & combined matches timeline */}
                {selectedPlayerIds.length > 0 ? (() => {
                  const selectedPlayers = dbPlayers.filter(p => selectedPlayerIds.includes(p.id));
                  const combinedPlayerMatches = filteredMatches.filter(m => 
                    selectedPlayerIds.includes(m.player1_id || '') || selectedPlayerIds.includes(m.player2_id || '')
                  );
                  // Remove duplicates by match ID
                  const uniquePlayerMatches = Array.from(new Map(combinedPlayerMatches.map(m => [m.id, m])).values());

                  const sortedPlayerMatches = [...uniquePlayerMatches].sort((a, b) => {
                    const timeA = a.scheduled_time ? new Date(a.scheduled_time).getTime() : 0;
                    const timeB = b.scheduled_time ? new Date(b.scheduled_time).getTime() : 0;
                    return timeB - timeA;
                  });

                  return (
                    <div className="landing-explorer-grid">
                      
                      {/* Left Column: Player Cards */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: 500, overflowY: 'auto', paddingRight: 4 }}>
                        <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)' }}>
                          Player Profiles ({selectedPlayers.length})
                        </h4>
                        {selectedPlayers.map(player => {
                          const playerMatches = filteredMatches.filter(m => m.player1_id === player.id || m.player2_id === player.id);
                          const completed = playerMatches.filter(m => m.status === 'completed');
                          const wins = completed.filter(m => m.winner_id === player.id).length;
                          const losses = completed.length - wins;
                          const winRate = completed.length > 0 ? Math.round((wins / completed.length) * 100) : 0;

                          return (
                            <div key={player.id} style={{
                              padding: '16px 20px',
                              background: 'var(--bg-primary)',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--border)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 12
                            }}>
                              <div>
                                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{player.name}</span>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{player.email}</div>
                              </div>
                              
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                                <div style={{ textAlign: 'center' }}>
                                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{playerMatches.length}</div>
                                  <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Played</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--score-win)' }}>{wins}</div>
                                  <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Wins</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--score-loss)' }}>{losses}</div>
                                  <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Losses</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>{winRate}%</div>
                                  <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Win Ratio</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Right Column: Combined Timeline */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)' }}>
                          Match Timeline (Descending)
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 500, overflowY: 'auto', paddingRight: 4 }}>
                          {sortedPlayerMatches.map(match => {
                            const eventObj = dbEvents.find(e => e.id === match.event_id);
                            
                            // Check if a selected player won this match
                            let resultText: string = match.status;
                            let badgeType = 'open';
                            
                            if (match.status === 'completed' && match.winner_id) {
                              const wonPlayer = selectedPlayers.find(p => p.id === match.winner_id);
                              if (wonPlayer) {
                                resultText = `WIN (${wonPlayer.name})`;
                                badgeType = 'approved';
                              } else {
                                const lostPlayer = selectedPlayers.find(p => p.id === match.player1_id || p.id === match.player2_id);
                                if (lostPlayer) {
                                  resultText = `LOSS (${lostPlayer.name})`;
                                  badgeType = 'rejected';
                                } else {
                                  resultText = 'Completed';
                                  badgeType = 'completed';
                                }
                              }
                            }

                            return (
                              <div key={match.id} style={{
                                padding: 14,
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--bg-primary)',
                                border: '1px solid var(--border)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 16
                              }}>
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                                    <span style={{ fontWeight: 600, fontSize: 13 }}>
                                      {match.player1_name} vs {match.player2_name}
                                    </span>
                                    <span className={`badge badge-${badgeType}`} style={{ fontSize: 9 }}>
                                      {resultText}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                                    {eventObj?.event_name || 'Event'}
                                  </div>
                                </div>

                                {/* Score */}
                                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                                  {match.sets.map((s, idx) => (
                                    <div key={idx} style={{
                                      padding: '2px 6px',
                                      background: 'var(--bg-elevated)',
                                      borderRadius: 'var(--radius-sm)',
                                      fontSize: 10,
                                      fontFamily: 'var(--font-mono)',
                                      fontWeight: s.is_complete ? 600 : 400
                                    }}>
                                      {s.player1_score}-{s.player2_score}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}

                          {sortedPlayerMatches.length === 0 && (
                            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', padding: 12 }}>
                              No matches found for selected player(s).
                            </p>
                          )}
                        </div>
                      </div>

                    </div>
                  );
                })() : (
                  <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', padding: '24px 0' }}>
                    Select player(s) to view timeline.
                  </p>
                )}
              </div>
            )}
          </LiquidGlassCard>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ padding: '80px 0' }}>
        <div className="container-app">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 12 }}>Everything You Need</h2>
            <p style={{ fontSize: 16, color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto' }}>
              From tournament creation to final results — a complete platform for badminton organizers and players.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 20,
          }}>
             {features.map((feature, i) => (
              <LiquidGlassCard
                key={i}
                className="animate-slide-up stagger-item transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_20px_50px_rgba(37,99,235,0.15)] border border-white/10"
                glassSize="default"
              >
                <div style={{
                  width: 52, height: 52,
                  background: 'var(--accent-subtle)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--accent-hover)',
                  marginBottom: 16,
                }}>
                  {feature.icon}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>{feature.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{feature.description}</p>
              </LiquidGlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Tournaments */}
      <section style={{ padding: '0 0 80px' }}>
        <div className="container-app">
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 12 }}>Upcoming Tournaments</h2>
            <p style={{ fontSize: 16, color: 'var(--text-secondary)' }}>
              Browse and register for upcoming badminton tournaments
            </p>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: 20,
          }}>
            {upcomingTournaments.map((t, i) => (
              <Link
                key={t.id}
                href={`/tournament?slug=${t.slug || t.id}`}
                style={{ textDecoration: 'none' }}
              >
                <LiquidGlassCard
                  glassSize="none"
                  className="animate-slide-up stagger-item h-full overflow-hidden border border-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_20px_50px_rgba(37,99,235,0.15)]"
                  style={{ padding: 0 }}
                >
                  {/* Banner gradient */}
                  <div style={{
                    height: 120,
                    background: t.status === 'completed'
                      ? 'linear-gradient(135deg, #1e293b, #334155)'
                      : t.status === 'cancelled'
                      ? 'linear-gradient(135deg, #ef444420, #ef444440)'
                      : 'linear-gradient(135deg, #1d4ed8, #2563eb)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}>
                    <IconTrophy size={48} className="" />
                    {t.status === 'live' && (
                      <div className="badge badge-live" style={{ position: 'absolute', top: 12, right: 12 }}>
                        <span className="live-dot" style={{ width: 6, height: 6 }} /> Live
                      </div>
                    )}
                    {t.status === 'open' && (
                      <div className="badge badge-open" style={{ position: 'absolute', top: 12, right: 12 }}>
                        Open
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '20px 24px' }}>
                    <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>{t.name}</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
                      {t.description}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                        <IconCalendar size={14} />
                        {new Date(t.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} — {new Date(t.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                        <IconMapPin size={14} />
                        {t.location}
                      </div>
                    </div>
                  </div>
                </LiquidGlassCard>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" style={{
        padding: '80px 0',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-secondary)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div className="container-app" style={{ maxWidth: 840 }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span className="badge badge-accent" style={{ marginBottom: 12 }}>Our Story</span>
            <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>About MatchPoint</h2>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
              We are a passionate team of badminton players, coaches, and developers dedicated to professionalizing amateur and professional club tournaments globally.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 40, alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h3 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>Empowering the Badminton Community</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                MatchPoint started out of frustration with manual spreadsheet updates, messy messaging threads, and slow score reporting at local club matches.
              </p>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Our platform delivers professional-grade bracket generators, automated seedings, custom visual court setups, and umpire scoring panels with immediate real-time sync.
              </p>
              
              <div style={{ display: 'flex', gap: 24, marginTop: 8 }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>100%</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Real-time Sync</div>
                </div>
                <div style={{ width: 1, height: 36, background: 'var(--border)' }} />
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>Sub-Second</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Score Latency</div>
                </div>
              </div>
            </div>

            <LiquidGlassCard className="border border-white/10 hover:shadow-[0_20px_50px_rgba(37,99,235,0.1)] transition-shadow duration-300" glassSize="lg" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                🏸 Our Vision
              </h4>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                To establish the digital standard for badminton tournaments, providing organizers with simple, bulletproof management interfaces and offering players a professional tour experience.
              </p>
              <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '8px 0' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent), #3b82f6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 700, color: '#fff'
                }}>
                  VP
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Vikas Paliwal</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Founder & Head Organizer</div>
                </div>
              </div>
            </LiquidGlassCard>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact" style={{
        padding: '80px 0',
        borderTop: '1px solid var(--border)',
        background: 'linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)',
      }}>
        <div className="container-app" style={{ maxWidth: 640 }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <span className="badge badge-accent" style={{ marginBottom: 12 }}>Contact Us</span>
            <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>
              Get In Touch With Us
            </h2>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)' }}>
              Have questions, feedback, or need help setting up your tournament brackets? Send us a message below.
            </p>
          </div>

          <LiquidGlassCard className="animate-slide-up border border-white/10 shadow-2xl" glassSize="lg">
            {contactSuccess ? (
              <div style={{
                textAlign: 'center',
                padding: '24px 0',
                color: 'var(--score-win)',
                fontSize: 16,
                fontWeight: 600,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12
              }}>
                <span style={{ fontSize: 48 }}>✅</span>
                <span>Message Sent Successfully!</span>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 400, marginTop: 4 }}>
                  Your query has been logged and sent securely to the tournament organizers. We will get back to you within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div className="landing-contact-grid">
                  <div className="input-group">
                    <label className="input-label" htmlFor="contact-name" style={{ fontSize: 13, fontWeight: 500 }}>Your Name *</label>
                    <input
                      id="contact-name"
                      type="text"
                      className="input"
                      value={contactName}
                      onChange={e => setContactName(e.target.value)}
                      placeholder="e.g. John Doe"
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label" htmlFor="contact-email" style={{ fontSize: 13, fontWeight: 500 }}>Email Address *</label>
                    <input
                      id="contact-email"
                      type="email"
                      className="input"
                      value={contactEmail}
                      onChange={e => setContactEmail(e.target.value)}
                      placeholder="e.g. john@org.com"
                      required
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="contact-org" style={{ fontSize: 13, fontWeight: 500 }}>Club / School / Organization (Optional)</label>
                  <input
                    id="contact-org"
                    type="text"
                    className="input"
                    value={contactOrg}
                    onChange={e => setContactOrg(e.target.value)}
                    placeholder="e.g. Mumbai Badminton Club"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="contact-msg" style={{ fontSize: 13, fontWeight: 500 }}>How can we help? (Details about event size, brackets) *</label>
                  <textarea
                    id="contact-msg"
                    className="input"
                    value={contactMessage}
                    onChange={e => setContactMessage(e.target.value)}
                    placeholder="e.g. We want to configure a 32-player boys under-15 singles knockout draw and import names..."
                    style={{ minHeight: 100 }}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  disabled={isSubmittingContact}
                  style={{ width: '100%', marginTop: 10 }}
                >
                  {isSubmittingContact ? 'Submitting request...' : '📤 Submit Setup Request'}
                </button>
              </form>
            )}
          </LiquidGlassCard>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '60px 0',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border)',
      }}>
        <div className="container-app" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Ready to Organize Your Tournament?</h2>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 28, maxWidth: 500, margin: '0 auto 28px' }}>
            Get started for free. Create your first tournament in under 10 minutes.
          </p>
          <Link href="/register" className="btn btn-primary btn-lg">
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '40px 0',
        borderTop: '1px solid var(--border)',
      }}>
        <div className="container-app" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 28, height: 28,
              background: 'linear-gradient(135deg, var(--accent), #3b82f6)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {activeSport === 'badminton' && <span style={{ fontSize: 12 }}>🏸</span>}
              {activeSport === 'table_tennis' && <span style={{ fontSize: 12 }}>🏓</span>}
              {activeSport === 'squash' && <span style={{ fontSize: 12 }}>🎾</span>}
              {activeSport === 'tennis' && <span style={{ fontSize: 12 }}>🥎</span>}
              {activeSport === 'volleyball' && <span style={{ fontSize: 12 }}>🏐</span>}
              {activeSport === 'cricket' && <span style={{ fontSize: 12 }}>🏏</span>}
              {activeSport === 'basketball' && <span style={{ fontSize: 12 }}>🏀</span>}
              {activeSport === 'all' && <IconShuttlecock size={14} />}
            </div>
            <span style={{ fontSize: 14, fontWeight: 600 }}>MatchPoint</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            © 2025 MatchPoint. {activeSport === 'badminton' && 'Built for badminton lovers.'}
            {activeSport === 'table_tennis' && 'Built for table tennis lovers.'}
            {activeSport === 'squash' && 'Built for squash lovers.'}
            {activeSport === 'tennis' && 'Built for tennis lovers.'}
            {activeSport === 'volleyball' && 'Built for volleyball lovers.'}
            {activeSport === 'cricket' && 'Built for cricket lovers.'}
            {activeSport === 'basketball' && 'Built for basketball lovers.'}
            {activeSport === 'all' && 'Built for sports lovers.'}
          </p>
        </div>
      </footer>
    </div>
  );
}

function IconChevronRight({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

interface SearchableMultiSelectProps {
  id: string;
  label: string;
  placeholder: string;
  options: { id: string; name: string }[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

function SearchableMultiSelect({
  id,
  label,
  placeholder,
  options,
  selectedIds,
  onChange,
}: SearchableMultiSelectProps) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const filtered = options.filter(opt =>
    opt.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (optionId: string) => {
    if (selectedIds.includes(optionId)) {
      onChange(selectedIds.filter(id => id !== optionId));
    } else {
      onChange([...selectedIds, optionId]);
    }
  };

  const removeSelected = (optionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedIds.filter(id => id !== optionId));
  };

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`#container-${id}`)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [id]);

  const selectedOptions = options.filter(opt => selectedIds.includes(opt.id));

  return (
    <div id={`container-${id}`} className="input-group" style={{ position: 'relative' }}>
      <label className="input-label">{label}</label>
      
      {/* Selected Items / Trigger Area */}
      <div
        className="input"
        style={{
          minHeight: '44px',
          height: 'auto',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          alignItems: 'center',
          padding: '6px 12px',
          cursor: 'pointer',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          position: 'relative',
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedOptions.length === 0 && (
          <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{placeholder}</span>
        )}
        {selectedOptions.map(opt => (
          <span
            key={opt.id}
            className="badge badge-accent"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              fontSize: '12px',
              fontWeight: 500,
              background: 'var(--accent-subtle)',
              border: '1px solid var(--accent)',
              borderRadius: 'var(--radius-sm)',
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            {opt.name}
            <button
              type="button"
              onClick={(e) => removeSelected(opt.id, e)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '0 2px',
                fontSize: '12px',
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
          </span>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            {isOpen ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 100,
            background: 'var(--bg-primary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
            maxHeight: '260px',
            overflowY: 'auto',
            padding: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          {/* Search Input inside dropdown */}
          <input
            type="text"
            className="input"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            style={{
              padding: '6px 10px',
              fontSize: '13px',
              marginBottom: '6px',
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
            {filtered.map(opt => {
              const isSelected = selectedIds.includes(opt.id);
              return (
                <div
                  key={opt.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelect(opt.id);
                  }}
                  onMouseEnter={() => setHoveredId(opt.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: isSelected 
                      ? 'var(--accent-subtle)' 
                      : (hoveredId === opt.id ? 'var(--bg-secondary)' : 'transparent'),
                    color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                  }}
                >
                  <span>{opt.name}</span>
                  {isSelected && <span style={{ color: 'var(--accent-hover)' }}>✓</span>}
                </div>
              );
            })}
            {filtered.length === 0 && (
              <span style={{ padding: '8px', fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
                No options found
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
