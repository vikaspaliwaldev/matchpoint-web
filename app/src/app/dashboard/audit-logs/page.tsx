'use client';

import React, { useState, useEffect } from 'react';
import { AuditLog } from '@/types';
import { getAuditLogs } from '@/lib/supabase-service';
import { IconClipboard, IconClock, IconUsers } from '@/components/icons';
import { useAuth } from '@/lib/auth-context';

export default function AuditLogsPage() {
  const { user, activeRole } = useAuth();
  const currentRole = activeRole || user?.role;
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'tournament' | 'event' | 'registration' | 'match' | 'team'>('all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;



  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeTab]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await getAuditLogs();
        setLogs(data);
      } catch (err) {
        console.error('Failed to load audit logs:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredLogs = logs.filter(log => {
    if (activeTab !== 'all') {
      const logCat = (log.category || '').toLowerCase();
      // Handle both singular and plural forms (e.g. tournament vs tournaments)
      const tabKey = activeTab.toLowerCase();
      const match = logCat === tabKey || logCat === `${tabKey}s` || `${logCat}s` === tabKey;
      if (!match) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return (
        (log.action || '').toLowerCase().includes(q) ||
        (log.user_name || 'System').toLowerCase().includes(q) ||
        (log.details && log.details.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalItems = filteredLogs.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const categories = [
    { key: 'all', label: 'All Activities' },
    { key: 'tournament', label: 'Tournaments' },
    { key: 'event', label: 'Events' },
    { key: 'registration', label: 'Registrations' },
    { key: 'match', label: 'Matches' },
    { key: 'team', label: 'Teams' },
  ] as const;

  const formatLogDate = (rawTime: string) => {
    if (!rawTime) return 'Just now';
    const parsed = Date.parse(rawTime);
    const dateObj = isNaN(parsed) ? new Date() : new Date(parsed);
    return dateObj.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }) + ' IST';
  };

  const formatPlainDetails = (details?: string) => {
    if (!details) return 'Administrative change committed';
    // If it's a raw HTTP request string like "Request: PUT /api/v1/tournaments/123, Response Status: 200"
    if (details.includes('Request:') && details.includes('Response Status:')) {
      const match = details.match(/Request:\s*([A-Z]+)\s+([^\s,]+)/);
      if (match) {
        const method = match[1];
        const endpoint = match[2];
        const resource = endpoint.split('/').filter(Boolean).slice(-2).join(' #');
        return `${method === 'POST' ? 'Created' : method === 'PUT' || method === 'PATCH' ? 'Updated' : 'Deleted'} resource (${resource})`;
      }
    }
    return details;
  };

  if (currentRole !== 'system_admin') {
    return (
      <div className="glass-card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
        <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Access Denied</p>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8 }}>
          You do not have permission to access the System Audit Logs.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="glass-card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
        <div className="animate-spin" style={{ display: 'inline-block', fontSize: 24, marginBottom: 12, animation: 'spin 2s linear infinite' }}>🔄</div>
        <p style={{ fontSize: 15, fontWeight: 500 }}>Loading system audit logs...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>System Audit Logs</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
          Monitor system actions, administrative configurations, and player updates (Admin Only)
        </p>
      </div>

      {/* Toolbar & Filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Categories Tab Group */}
          <div className="tab-group" style={{ display: 'inline-flex' }}>
            {categories.map(cat => (
              <button
                key={cat.key}
                className={`tab ${activeTab === cat.key ? 'active' : ''}`}
                onClick={() => setActiveTab(cat.key as any)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <input
            className="input"
            style={{ maxWidth: 360 }}
            placeholder="Search action logs, operators, or details..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Logs List */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container" style={{ margin: 0, border: 'none' }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: 220 }}>Timestamp (IST)</th>
                <th style={{ width: 140 }}>Category</th>
                <th style={{ width: 160 }}>Operator</th>
                <th style={{ width: 260 }}>Action Performed</th>
                <th>Change Details (Plain Text)</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.map(log => {
                const logTime = formatLogDate(log.created_at);

                let badgeClass = 'badge-open';
                const catLower = (log.category || '').toLowerCase();
                if (catLower.includes('tourn')) badgeClass = 'badge-live';
                else if (catLower.includes('event')) badgeClass = 'badge-accent';
                else if (catLower.includes('regist')) badgeClass = 'badge-pending';
                else if (catLower.includes('match')) badgeClass = 'badge-live';
                else if (catLower.includes('team')) badgeClass = 'badge-waitlisted';

                const plainDetails = formatPlainDetails(log.details);

                return (
                  <tr key={log.id} style={{ transition: 'all var(--transition-fast)' }}>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13, padding: '16px 20px', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <IconClock size={13} />
                        {logTime}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${badgeClass}`} style={{ textTransform: 'capitalize', fontSize: 10 }}>
                        {log.category}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: '50%',
                          background: 'var(--bg-elevated)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontWeight: 700, color: 'var(--text-primary)'
                        }}>
                          {(log.user_name || 'System').charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 500, fontSize: 13 }}>{log.user_name || 'System'}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                      {log.action}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5 }}>
                      <span style={{ 
                        display: 'inline-block',
                        padding: '3px 8px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)'
                      }}>
                        {plainDetails}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

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

        {filteredLogs.length === 0 && (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
            No audit logs found matching criteria.
          </div>
        )}
      </div>
    </div>
  );
}
