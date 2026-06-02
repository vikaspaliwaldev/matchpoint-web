'use client';

import React, { useState, useEffect } from 'react';
import { AuditLog } from '@/types';
import { getAuditLogs } from '@/lib/supabase-service';
import { IconClipboard, IconClock, IconUsers } from '@/components/icons';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'tournament' | 'event' | 'registration' | 'match' | 'team'>('all');
  const [search, setSearch] = useState('');

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
    if (activeTab !== 'all' && log.category !== activeTab) return false;
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

  const categories = ['all', 'tournament', 'event', 'registration', 'match', 'team'] as const;

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
                key={cat}
                className={`tab ${activeTab === cat ? 'active' : ''}`}
                onClick={() => setActiveTab(cat)}
                style={{ textTransform: 'capitalize' }}
              >
                {cat === 'all' ? 'All Activities' : `${cat}s`}
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
                <th style={{ width: 180 }}>Timestamp</th>
                <th style={{ width: 140 }}>Category</th>
                <th style={{ width: 160 }}>Operator</th>
                <th>Action Log</th>
                <th>Parameters / Meta</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => {
                const logTime = new Date(log.created_at).toLocaleString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'medium'
                });

                let badgeClass = 'badge-open';
                if (log.category === 'tournament') badgeClass = 'badge-live';
                if (log.category === 'event') badgeClass = 'badge-accent';
                if (log.category === 'registration') badgeClass = 'badge-pending';
                if (log.category === 'match') badgeClass = 'badge-live';
                if (log.category === 'team') badgeClass = 'badge-waitlisted';

                return (
                  <tr key={log.id} style={{ transition: 'all var(--transition-fast)' }}>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, border: 'none', padding: '16px 20px' }}>
                      <IconClock size={13} />
                      {logTime}
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
                          {(log.user_name || 'System').charAt(0)}
                        </div>
                        <span style={{ fontWeight: 500, fontSize: 13 }}>{log.user_name || 'System'}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 500, fontSize: 14 }}>{log.action}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12, fontFamily: 'var(--font-mono)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.details}>
                      {log.details || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
            No audit logs found matching criteria.
          </div>
        )}
      </div>
    </div>
  );
}
