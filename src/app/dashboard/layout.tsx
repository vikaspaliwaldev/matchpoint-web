'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import {
  IconShuttlecock,
  IconDashboard,
  IconTrophy,
  IconUsers,
  IconClipboard,
  IconGitBranch,
  IconActivity,
  IconLogout,
  IconMenu,
  IconX,
} from '@/components/icons';

function SunIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function MoonIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, activeRole, logout, switchRole, needsRoleSelection, selectRole, isProfileComplete } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  React.useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) return null;

  // Profile completion guard — redirect to profile page if incomplete
  const isOnProfilePage = pathname === '/dashboard/profile';
  const showProfileGuard = !isProfileComplete && !isOnProfilePage;

  // If user hasn't selected a role yet, show role picker
  if (needsRoleSelection) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
      }}>
        <div className="hero-glow" style={{ position: 'fixed', top: -300, left: '50%', transform: 'translateX(-50%)' }} />
        <div className="animate-slide-up glass-card" style={{ padding: 36, maxWidth: 420, width: '90%', position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Welcome, {user.name}!</h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
            You have multiple roles. Choose how you want to start:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {user.roles.map(role => {
              const roleInfo: Record<string, { label: string; desc: string; color: string }> = {
                admin: { label: 'Organizer', desc: 'Manage tournaments, fixtures, and registrations', color: 'var(--accent)' },
                player: { label: 'Player', desc: 'View matches, track results, register for events', color: 'var(--score-live)' },
                umpire: { label: 'Umpire', desc: 'Score matches and manage live games', color: 'var(--score-point)' },
              };
              const info = roleInfo[role];
              return (
                <button
                  key={role}
                  className="btn btn-secondary"
                  onClick={() => selectRole(role)}
                  style={{
                    justifyContent: 'flex-start',
                    padding: '16px 20px',
                    textAlign: 'left',
                    height: 'auto',
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 'var(--radius-md)',
                    background: `${info.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: info.color, fontSize: 16, fontWeight: 700, flexShrink: 0,
                  }}>
                    {info.label.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{info.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>{info.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const currentRole = activeRole || user.role;

  const adminLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: <IconDashboard size={18} /> },
    { href: '/dashboard/tournaments', label: 'Tournaments', icon: <IconTrophy size={18} /> },
    { href: '/dashboard/events', label: 'All Events', icon: <IconClipboard size={18} /> },
    { href: '/dashboard/registrations', label: 'Registrations', icon: <IconClipboard size={18} /> },
    { href: '/dashboard/fixtures', label: 'Fixtures', icon: <IconGitBranch size={18} /> },
    { href: '/dashboard/matches', label: 'Matches', icon: <IconActivity size={18} /> },
    { href: '/dashboard/teams', label: 'Teams', icon: <IconUsers size={18} /> },
    { href: '/dashboard/players', label: 'Players Directory', icon: <IconUsers size={18} /> },
    { href: '/dashboard/users', label: 'User Management', icon: <IconUsers size={18} /> },
    { href: '/dashboard/audit-logs', label: 'Audit Logs', icon: <IconClipboard size={18} /> },
    { href: '/dashboard/profile', label: 'My Profile', icon: <IconUsers size={18} /> },
  ];

  const playerLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: <IconDashboard size={18} /> },
    { href: '/dashboard/my-tournaments', label: 'My Tournaments', icon: <IconTrophy size={18} /> },
    { href: '/dashboard/my-matches', label: 'My Matches', icon: <IconActivity size={18} /> },
    { href: '/dashboard/players', label: 'Players Directory', icon: <IconUsers size={18} /> },
    { href: '/dashboard/profile', label: 'My Profile', icon: <IconUsers size={18} /> },
  ];

  const umpireLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: <IconDashboard size={18} /> },
    { href: '/dashboard/scoring', label: 'Live Scoring', icon: <IconActivity size={18} /> },
    { href: '/dashboard/players', label: 'Players Directory', icon: <IconUsers size={18} /> },
    { href: '/dashboard/profile', label: 'My Profile', icon: <IconUsers size={18} /> },
  ];

  const links = currentRole === 'admin' ? adminLinks : currentRole === 'umpire' ? umpireLinks : playerLinks;

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Top Nav */}
      <nav className="nav" style={{ height: 64 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '100%',
          padding: '0 20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ display: 'none' }}
              id="mobile-menu-toggle"
            >
              {sidebarOpen ? <IconX size={20} /> : <IconMenu size={20} />}
            </button>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <div style={{
                width: 32, height: 32,
                background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <IconShuttlecock size={16} />
              </div>
              <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>MatchPoint</span>
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Theme toggle */}
            <button
              className="btn btn-ghost btn-icon"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <SunIcon size={18} /> : <MoonIcon size={18} />}
            </button>

            {/* Role switcher — only if user has multiple roles */}
            {user.roles.length > 1 && (
              <div style={{ display: 'flex', gap: 4 }}>
                {user.roles.map(role => (
                  <button
                    key={role}
                    className={`tab ${currentRole === role ? 'active' : ''}`}
                    onClick={() => switchRole(role)}
                    style={{ fontSize: 11, padding: '4px 10px', textTransform: 'capitalize' }}
                  >
                    {role === 'admin' ? 'Organizer' : role}
                  </button>
                ))}
              </div>
            )}

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-elevated)',
            }}>
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <div style={{
                  width: 28, height: 28,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: '#fff',
                }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>{user.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                  {currentRole === 'admin' ? 'Organizer' : currentRole}
                </div>
              </div>
            </div>

            <button className="btn btn-ghost btn-icon" onClick={handleLogout} title="Logout">
              <IconLogout size={18} />
            </button>
          </div>
        </div>
      </nav>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-section">Navigation</div>
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`sidebar-link ${pathname === link.href ? 'active' : ''}`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}

          <div style={{ flex: 1 }} />

          <div className="divider" />
          <div className="sidebar-section">Quick Links</div>
          <Link href="/tournament/mumbai-open-2025" className="sidebar-link">
            <IconUsers size={18} />
            Public Page
          </Link>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, padding: 28, overflowY: 'auto', maxHeight: 'calc(100vh - 64px)' }}>
          {showProfileGuard ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 'calc(100vh - 200px)',
            }}>
              <div className="glass-card animate-slide-up" style={{
                padding: 40,
                maxWidth: 480,
                textAlign: 'center',
              }}>
                <div style={{
                  width: 72, height: 72,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px',
                  fontSize: 32,
                }}>
                  👤
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Complete Your Profile</h2>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
                  Please fill in your <strong>date of birth</strong>, <strong>phone number</strong>, and <strong>gender</strong> to access the dashboard.
                  This information is required for tournament eligibility and communication.
                </p>
                <Link href="/dashboard/profile" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                  Complete Profile →
                </Link>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          #mobile-menu-toggle { display: flex !important; }
          .sidebar { 
            position: fixed;
            top: 64px;
            left: ${sidebarOpen ? '0' : '-280px'};
            z-index: 30;
            transition: left 0.3s ease;
            height: calc(100vh - 64px);
          }
        }
      `}</style>
    </div>
  );
}
