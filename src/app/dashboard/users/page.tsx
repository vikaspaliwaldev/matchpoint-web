'use client';

import React, { useState, useEffect } from 'react';
import { User, UserRole } from '@/types';
import { getAllProfiles, updateUserRoles } from '@/lib/supabase-service';
import { useAuth } from '@/lib/auth-context';
import { IconUsers, IconX, IconClipboard, IconActivity } from '@/components/icons';

export default function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Fetch all users
  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getAllProfiles();
      // Sort users by name
      data.sort((a, b) => a.name.localeCompare(b.name));
      setUsers(data);
    } catch (err) {
      console.error('Failed to load profiles:', err);
      showToast('Failed to load user profiles.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Filter users by search query
  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Open roles editor
  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setSelectedRoles([...user.roles]);
  };

  // Close roles editor
  const handleCloseEdit = () => {
    if (!updating) {
      setEditingUser(null);
      setSelectedRoles([]);
    }
  };

  // Toggle role checkbox
  const handleToggleRole = (role: string) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter(r => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  // Submit role updates
  const handleSaveRoles = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    // Validation: Must have at least one role
    if (selectedRoles.length === 0) {
      showToast('A user must have at least one assigned role.', 'error');
      return;
    }

    setUpdating(true);
    try {
      await updateUserRoles(editingUser.id, selectedRoles);
      showToast(`Successfully updated roles for ${editingUser.name}!`, 'success');
      setEditingUser(null);
      // Reload updated users list
      await loadUsers();
    } catch (err) {
      console.error(err);
      showToast('Failed to update roles. Make sure you have Administrator permissions.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin': return 'badge-accent';
      case 'umpire': return 'badge-live';
      default: return 'badge-open';
    }
  };

  const getRoleDisplayName = (role: string) => {
    return role === 'admin' ? 'Organizer' : role.charAt(0).toUpperCase() + role.slice(1);
  };

  // Helper to determine if a user profile is completed
  const isProfileComplete = (u: User) => {
    return !!(u.date_of_birth || u.age) && !!u.phone && !!u.gender;
  };

  if (loading && users.length === 0) {
    return (
      <div className="glass-card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
        <div className="animate-spin" style={{ display: 'inline-block', fontSize: 24, marginBottom: 12, animation: 'spin 2s linear infinite' }}>🔄</div>
        <p style={{ fontSize: 15, fontWeight: 500 }}>Loading system profiles...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>User Management</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
          Manage user permissions, assign roles, and view profile completeness metrics for all registered users.
        </p>
      </div>

      {/* Stats Summary Widget */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 28 }}>
        <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
            👥
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{users.length}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Users</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
            👑
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{users.filter(u => u.roles.includes('admin')).length}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Organizers</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--score-live)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
            🎾
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{users.filter(u => u.roles.includes('player')).length}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Players</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
            ⚖️
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{users.filter(u => u.roles.includes('umpire')).length}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Umpires</div>
          </div>
        </div>
      </div>

      {/* Search & Main Table */}
      <div className="glass-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
          <input
            className="input"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ maxWidth: 360 }}
          />
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Showing {filteredUsers.length} of {users.length} registered profiles
          </span>
        </div>

        <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>User Profile</th>
                <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Email</th>
                <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Assigned Roles</th>
                <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Profile Completeness</th>
                <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user, idx) => {
                const complete = isProfileComplete(user);
                return (
                  <tr key={user.id} style={{ borderBottom: idx === filteredUsers.length - 1 ? 'none' : '1px solid var(--border)', transition: 'background var(--transition-fast)' }} className="table-row">
                    <td style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{
                          width: 38, height: 38, borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0
                        }}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Registered: {user.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>{user.email}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {user.roles.map(r => (
                          <span key={r} className={`badge ${getRoleBadgeClass(r)}`} style={{ fontSize: 10, textTransform: 'capitalize' }}>
                            {getRoleDisplayName(r)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span className={`badge badge-${complete ? 'approved' : 'rejected'}`} style={{ fontSize: 11 }}>
                        {complete ? '✅ Complete' : '⚠️ Incomplete'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleOpenEdit(user)}
                        disabled={user.id === currentUser?.id}
                        title={user.id === currentUser?.id ? "You cannot modify your own roles" : "Edit assigned roles"}
                        style={{ padding: '6px 12px', height: 'auto', fontSize: 13 }}
                      >
                        Manage Roles
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                    No system profiles match your search criteria.
                  </td>
                </tr>
              )}
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
      </div>

      {/* Role Editor Modal */}
      {editingUser && (
        <div className="modal-overlay" onClick={handleCloseEdit}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 440, padding: 28, borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>Manage Assigned Roles</h2>
              <button className="btn btn-ghost btn-icon" onClick={handleCloseEdit} disabled={updating}><IconX size={18} /></button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--bg-secondary)', padding: '14px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: 24 }}>
              {editingUser.avatar ? (
                <img src={editingUser.avatar} alt={editingUser.name} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0
                }}>
                  {editingUser.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{editingUser.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{editingUser.email}</div>
              </div>
            </div>

            <form onSubmit={handleSaveRoles} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label className="input-label" style={{ marginBottom: 12, display: 'block', fontWeight: 600 }}>Select Roles</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { key: 'admin', label: 'Organizer (admin)', desc: 'Full administration, edit settings, manage tournaments & scores' },
                    { key: 'umpire', label: 'Umpire', desc: 'Manage fixtures and operate live score dashboards' },
                    { key: 'player', label: 'Player', desc: 'Participate, register, and track own stats' }
                  ].map(roleItem => {
                    const isChecked = selectedRoles.includes(roleItem.key);
                    return (
                      <div
                        key={roleItem.key}
                        onClick={() => !updating && handleToggleRole(roleItem.key)}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 12,
                          padding: '12px 14px',
                          borderRadius: 'var(--radius-md)',
                          border: `1px solid ${isChecked ? 'var(--accent)' : 'var(--border)'}`,
                          background: isChecked ? 'var(--accent-subtle)' : 'var(--bg-secondary)',
                          cursor: updating ? 'not-allowed' : 'pointer',
                          transition: 'all var(--transition-fast)'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Controlled by outer div onClick
                          disabled={updating}
                          style={{ marginTop: 3, accentColor: 'var(--accent)', cursor: 'pointer' }}
                        />
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{roleItem.label}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>{roleItem.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={handleCloseEdit} disabled={updating}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={updating} style={{ minWidth: 120 }}>
                  {updating ? 'Saving...' : 'Save Roles'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`} style={{ zIndex: 100 }}>
          {toast.message}
        </div>
      )}

      <style jsx>{`
        .table-row:hover {
          background-color: var(--bg-elevated) !important;
        }
      `}</style>
    </div>
  );
}
