'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { 
  backupDatabase, 
  requestRestoreDatabase, 
  getPendingRestoreRequests, 
  approveRestoreRequest, 
  rejectRestoreRequest 
} from '@/lib/supabase-service';
import { IconClipboard, IconClock, IconRefreshCw, IconCheck, IconX } from '@/components/icons';

interface RestoreRequest {
  id: string;
  backupData: string;
  requestedBy: string;
  approvedBy: string | null;
  status: string;
  createdAt: string;
  expiresAt: string;
}

export default function BackupRestorePage() {
  const { user, activeRole } = useAuth();
  const currentRole = activeRole || user?.role;
  const [requests, setRequests] = useState<RestoreRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadPendingRequests = async () => {
    try {
      setLoading(true);
      const data = await getPendingRestoreRequests();
      setRequests(data);
    } catch (err) {
      console.error('Failed to load pending restore requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingRequests();
  }, []);

  const handleBackup = async () => {
    try {
      setActionLoading(true);
      setMessage(null);
      const data = await backupDatabase();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      a.download = `MatchPoint_DB_Backup_${timestamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setMessage({ text: '🎉 Database backup successfully exported and downloaded!', type: 'success' });
    } catch (err: any) {
      console.error('Database backup failed:', err);
      setMessage({ text: `❌ Backup failed: ${err.message || 'Unknown server error'}`, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('⚠️ Are you sure you want to request a database restore? Another Admin will need to approve it.')) {
      e.target.value = '';
      return;
    }

    try {
      setActionLoading(true);
      setMessage(null);
      
      const reader = new FileReader();
      const fileReadPromise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file.'));
      });
      
      reader.readAsText(file);
      const fileContent = await fileReadPromise;
      const backupData = JSON.parse(fileContent);
      
      await requestRestoreDatabase(backupData, user?.email || undefined);
      
      setMessage({ text: '🎉 Restore request successfully submitted! Awaiting signature from another System Admin.', type: 'success' });
      loadPendingRequests();
    } catch (err: any) {
      console.error('Submit restore request failed:', err);
      setMessage({ text: `❌ Submission failed: ${err.message || 'Invalid backup JSON file content'}`, type: 'error' });
    } finally {
      setActionLoading(false);
      e.target.value = '';
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm('⚠️ WARNING: Approving this request will immediately overwrite all active database tables. Proceed?')) {
      return;
    }

    try {
      setActionLoading(true);
      setMessage(null);
      await approveRestoreRequest(id, user?.email || undefined);
      setMessage({ text: '🎉 Database successfully restored to the requested backup!', type: 'success' });
      loadPendingRequests();
    } catch (err: any) {
      console.error('Approve restore failed:', err);
      let errMsg = 'Server error during execution';
      try {
        const parsed = JSON.parse(err.message);
        if (parsed.error) errMsg = parsed.error;
      } catch (e) {
        if (err.message) errMsg = err.message;
      }
      setMessage({ text: `❌ Restore failed: ${errMsg}`, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Are you sure you want to reject this request?')) {
      return;
    }

    try {
      setActionLoading(true);
      setMessage(null);
      await rejectRestoreRequest(id);
      setMessage({ text: '🎉 Restore request successfully rejected and deleted.', type: 'success' });
      loadPendingRequests();
    } catch (err: any) {
      console.error('Reject restore failed:', err);
      setMessage({ text: `❌ Rejection failed: ${err.message || 'Server error'}`, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  if (currentRole !== 'system_admin') {
    return (
      <div className="glass-card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
        <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Access Denied</p>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8 }}>
          You do not have permission to access the Database Backup & Restore operations dashboard.
        </p>
      </div>
    );
  }

  if (loading && requests.length === 0) {
    return (
      <div className="glass-card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
        <div className="animate-spin" style={{ display: 'inline-block', fontSize: 24, marginBottom: 12, animation: 'spin 2s linear infinite' }}>🔄</div>
        <p style={{ fontSize: 15, fontWeight: 500 }}>Loading maintenance logs...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '8px 4px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)' }}>Database Backup & Restore</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
          Perform schema-wide table backups and request/approve restorations. Restores require signature consent from at least two Admins.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Backup and Restore Cards Row */}
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          
          {/* Card 1: Export Backup */}
          <div className="glass-card" style={{ flex: 1, minWidth: 320, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 24 }}>📥</span>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Export Database Backup</h3>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                Compiles all schema tables (including matches, tournaments, transactions, feedback, and user profiles) into a downloadable JSON backup file. Useful for rolling point-in-time snapshots.
              </p>
            </div>
            <button
              onClick={handleBackup}
              disabled={actionLoading}
              className="btn btn-primary"
              style={{ marginTop: 24, width: '100%', height: 42, fontSize: 14, fontWeight: 600, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', border: 'none' }}
            >
              {actionLoading ? 'Exporting...' : '⬇️ Download JSON Backup'}
            </button>
          </div>

          {/* Card 2: Request Restore */}
          <div className="glass-card" style={{ flex: 1, minWidth: 320, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 24 }}>📤</span>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Request Database Restore</h3>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                Upload a JSON backup file to initiate a restore request. Because this operation clears existing records, <span style={{ color: '#ef4444', fontWeight: 600 }}>another System Admin user must sign off and approve it</span> before it is executed.
              </p>
            </div>
            <div style={{ marginTop: 24 }}>
              <input
                type="file"
                accept=".json"
                id="request-file-input"
                onChange={handleRequestRestore}
                disabled={actionLoading}
                style={{ display: 'none' }}
              />
              <label
                htmlFor="request-file-input"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 42,
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  opacity: actionLoading ? 0.6 : 1,
                  textAlign: 'center',
                }}
              >
                {actionLoading ? 'Processing...' : '📁 Upload & Request Restore'}
              </label>
            </div>
          </div>
        </div>

        {/* Action feedback banner */}
        {message && (
          <div style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            fontSize: 13,
            fontWeight: 500,
            background: message.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            border: message.type === 'success' ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(239,68,68,0.3)',
            color: message.type === 'success' ? '#10b981' : '#ef4444',
          }}>
            {message.text}
          </div>
        )}

        {/* Section 2: Pending Approval Queue */}
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Pending Restore Approvals</h2>
            <button 
              onClick={loadPendingRequests} 
              className="btn btn-secondary" 
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: 13 }}
            >
              <IconRefreshCw size={13} /> Refresh
            </button>
          </div>

          <div className="glass-card" style={{ padding: 0, overflow: 'hidden', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="table-container" style={{ margin: 0, border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Submitted Time</th>
                    <th>Requested By</th>
                    <th>Expires In</th>
                    <th>Status</th>
                    <th style={{ width: 300, textAlign: 'center' }}>Approval Signature Action</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(req => {
                    const requestedBy = req.requestedBy || (req as any).requested_by || '';
                    const createdAt = req.createdAt || (req as any).created_at;
                    const expiresAt = req.expiresAt || (req as any).expires_at;

                    const reqTime = createdAt ? new Date(createdAt).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'medium'
                    }) : 'N/A';

                    const isCreator = requestedBy.toLowerCase() === (user?.email || '').toLowerCase();
                    const expirationDate = expiresAt ? new Date(expiresAt) : new Date();
                    const isExpired = expiresAt ? expirationDate.getTime() < Date.now() : false;
                    const hoursLeft = expiresAt ? Math.max(0, Math.round((expirationDate.getTime() - Date.now()) / (3600 * 1000))) : 0;

                    return (
                      <tr key={req.id}>
                        <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <IconClock size={13} />
                            {reqTime}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>
                          {requestedBy}
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                          {isExpired ? (
                            <span style={{ color: '#ef4444' }}>Expired</span>
                          ) : (
                            <span>{hoursLeft} hours left</span>
                          )}
                        </td>
                        <td>
                          <span className="badge badge-pending">PENDING</span>
                        </td>
                        <td>
                          {isCreator ? (
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, fontStyle: 'italic', padding: '6px 0' }}>
                              Awaiting other Admin approval
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                              <button
                                onClick={() => handleApprove(req.id)}
                                disabled={actionLoading}
                                className="btn btn-primary"
                                style={{ 
                                  height: 32, 
                                  padding: '0 12px', 
                                  fontSize: 12, 
                                  fontWeight: 600, 
                                  background: 'linear-gradient(135deg, #10b981, #059669)',
                                  border: 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4
                                }}
                              >
                                <IconCheck size={12} /> Approve & Execute
                              </button>
                              <button
                                onClick={() => handleReject(req.id)}
                                disabled={actionLoading}
                                className="btn btn-secondary"
                                style={{ 
                                  height: 32, 
                                  padding: '0 12px', 
                                  fontSize: 12, 
                                  fontWeight: 600, 
                                  color: '#ef4444', 
                                  borderColor: 'rgba(239, 68, 68, 0.3)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4
                                }}
                              >
                                <IconX size={12} /> Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {requests.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                        No pending restore requests found in the approval queue.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
