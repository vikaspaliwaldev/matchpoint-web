'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getLoginLogs, getAllProfiles } from '@/lib/supabase-service';
import { User } from '@/types';
import { IconClock, IconActivity, IconRefreshCw, IconUsers } from '@/components/icons';

interface LoginLog {
  id: string;
  userId: string;
  email?: string;
  userName?: string;
  loginTime: string;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failed_credentials' | 'failed_bad_credentials';
}

export default function LoginManagementPage() {
  const { user: currentUser, activeRole } = useAuth();
  const currentRole = activeRole || currentUser?.role;

  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [profiles, setProfiles] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [logData, userData] = await Promise.all([
        getLoginLogs(),
        getAllProfiles()
      ]);
      setLogs(logData);
      setProfiles(userData);
    } catch (err) {
      console.error('Failed to load login management data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (currentRole !== 'system_admin') {
    return (
      <div className="glass-card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
        <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Access Denied</p>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8 }}>
          You do not have permission to access the Login Management dashboard.
        </p>
      </div>
    );
  }

  // Filter logs
  const filteredLogs = logs.filter(log => {
    // 1. Status Filter
    if (statusFilter === 'success' && log.status !== 'success') return false;
    if (statusFilter === 'failed' && log.status === 'success') return false;

    // 2. Search query mapping with profile lookup
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      // Find matching profile by id, email, or username
      const prof = profiles.find(p => 
        (p.id && log.userId && p.id.toLowerCase() === log.userId.toLowerCase()) ||
        (p.email && log.email && p.email.toLowerCase() === log.email.toLowerCase()) ||
        (p.email && log.userId && p.email.toLowerCase() === log.userId.toLowerCase()) ||
        (p.name && log.userName && p.name.toLowerCase() === log.userName.toLowerCase())
      );
      const email = (log.email || prof?.email || log.userId || '').toLowerCase();
      const name = (log.userName || prof?.name || (prof?.email ? prof.email.split('@')[0] : '') || '').toLowerCase();
      const ip = (log.ipAddress || '').toLowerCase();
      const ua = (log.userAgent || '').toLowerCase();

      return email.includes(q) || name.includes(q) || ip.includes(q) || ua.includes(q);
    }
    return true;
  });

  const totalItems = filteredLogs.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const formatUserAgent = (ua: string) => {
    if (!ua || ua === 'Unknown Client') return 'Web Browser / Client';
    if (ua.includes('iPhone')) return 'iPhone (Safari Mobile)';
    if (ua.includes('Android')) return 'Android Mobile';
    if (ua.includes('Macintosh') && ua.includes('Chrome')) return 'Mac (Google Chrome)';
    if (ua.includes('Macintosh') && ua.includes('Safari')) return 'Mac (Apple Safari)';
    if (ua.includes('Windows') && ua.includes('Chrome')) return 'Windows (Google Chrome)';
    if (ua.includes('Windows') && ua.includes('Edge')) return 'Windows (Microsoft Edge)';
    if (ua.includes('Postman')) return 'Postman REST Client';
    if (ua.includes('curl')) return 'cURL Request';
    return ua.length > 40 ? ua.substring(0, 40) + '...' : ua;
  };

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

  if (loading && logs.length === 0) {
    return (
      <div className="glass-card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
        <div className="animate-spin" style={{ display: 'inline-block', fontSize: 24, marginBottom: 12, animation: 'spin 2s linear infinite' }}>🔄</div>
        <p style={{ fontSize: 15, fontWeight: 500 }}>Loading system login logs...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>Login Management</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
          Audit rolling user login sessions, monitor failed credential attempts, and check user client security profiles.
        </p>
      </div>

      {/* Toolbar & Filters */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          
          <div className="tab-group" style={{ display: 'inline-flex' }}>
            {[
              { key: 'all', label: 'All Attempts' },
              { key: 'success', label: 'Successful' },
              { key: 'failed', label: 'Failed' },
            ].map(tab => (
              <button
                key={tab.key}
                className={`tab ${statusFilter === tab.key ? 'active' : ''}`}
                onClick={() => setStatusFilter(tab.key as any)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
            <input
              className="input"
              style={{ maxWidth: 360, width: '100%' }}
              placeholder="Search by email, name, IP or device..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <button onClick={loadData} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, height: 40, whiteSpace: 'nowrap' }}>
              <IconRefreshCw size={14} /> Refresh
            </button>
          </div>

        </div>
      </div>

      {/* Main Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container" style={{ margin: 0, border: 'none' }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: 220 }}>Login Time</th>
                <th>User Account</th>
                <th>IP Address</th>
                <th>Browser / Client</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.map(log => {
                const prof = profiles.find(p => 
                  (p.id && log.userId && p.id.toLowerCase() === log.userId.toLowerCase()) ||
                  (p.email && log.email && p.email.toLowerCase() === log.email.toLowerCase()) ||
                  (p.email && log.userId && p.email.toLowerCase() === log.userId.toLowerCase()) ||
                  (p.name && log.userName && p.name.toLowerCase() === log.userName.toLowerCase())
                );
                const email = log.email || prof?.email || (log.userId?.includes('@') ? log.userId : 'system@matchpoint.io');
                const name = log.userName || prof?.name || (prof?.email ? prof.email.split('@')[0] : log.userId || 'Administrator');

                const logTime = formatLogDate(log.loginTime);
                const isSuccess = log.status === 'success';

                return (
                  <tr key={log.id} style={{ transition: 'all var(--transition-fast)' }}>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13, padding: '16px 20px', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <IconClock size={13} />
                        {logTime}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: isSuccess ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700, color: isSuccess ? '#10b981' : '#ef4444'
                        }}>
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>{name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 500, fontSize: 13, color: 'var(--text-primary)' }}>
                      {log.ipAddress && log.ipAddress !== 'null' && log.ipAddress !== 'undefined' ? log.ipAddress : '127.0.0.1'}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }} title={log.userAgent}>
                      {formatUserAgent(log.userAgent)}
                    </td>
                    <td>
                      <span className={`badge ${isSuccess ? 'badge-live' : 'badge-pending'}`} style={{ fontSize: 10 }}>
                        {isSuccess ? 'SUCCESS' : 'FAILED'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalItems > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 20, flexWrap: 'wrap', gap: 12 }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} attempts
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
            No user sign-in logs found matching search criteria.
          </div>
        )}
      </div>
    </div>
  );
}
