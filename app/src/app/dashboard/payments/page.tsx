'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Tournament, Registration, User } from '@/types';
import {
  getTournaments,
  getRegistrationsByTournament,
  downloadFeeReport,
  emailFeeReport,
  getPlayers,
  recordPaymentCollection,
  uploadToSupabaseStorage
} from '@/lib/supabase-service';
import { IconClipboard, IconClock, IconUsers, IconTrophy, IconCheck, IconRefreshCw, IconX } from '@/components/icons';

export default function PaymentsPage() {
  const { user, activeRole } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [players, setPlayers] = useState<User[]>([]);
  const [viewingPlayer, setViewingPlayer] = useState<User | null>(null);
  const [recordingPaymentReg, setRecordingPaymentReg] = useState<Registration | null>(null);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [loadingTournaments, setLoadingTournaments] = useState(true);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'exempt' | 'unpaid' | 'pending'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  const pageSize = 10;

  // Protect route to admin or system_admin
  const currentRole = activeRole || user?.role;
  const isAdmin = currentRole === 'admin' || currentRole === 'system_admin' || user?.roles?.includes('admin') || user?.roles?.includes('system_admin');

  // Load fee-collecting tournaments and players on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoadingTournaments(true);
        const [list, playersList] = await Promise.all([
          getTournaments(),
          getPlayers()
        ]);
        const feeCollecting = list.filter(t => t.collects_fees || (t.events && t.events.some(e => (e.entry_fee || 0) > 0)));
        setTournaments(feeCollecting);
        setPlayers(playersList);
        if (feeCollecting.length > 0) {
          setSelectedTournament(feeCollecting[0]);
        }
      } catch (err) {
        console.error('Failed to load tournaments and players:', err);
      } finally {
        setLoadingTournaments(false);
      }
    }
    loadData();
  }, []);

  // Load registrations when selected tournament changes
  useEffect(() => {
    if (!selectedTournament) {
      setRegistrations([]);
      return;
    }

    async function loadRegistrations() {
      try {
        setLoadingRegistrations(true);
        const data = await getRegistrationsByTournament(selectedTournament!.id);
        setRegistrations(data);
        setCurrentPage(1);
      } catch (err) {
        console.error('Failed to load registrations:', err);
      } finally {
        setLoadingRegistrations(false);
      }
    }
    loadRegistrations();
  }, [selectedTournament]);

  // Reset page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  if (!user) return null;

  if (!isAdmin) {
    return (
      <div className="glass-card" style={{ padding: 48, textAlign: 'center', margin: '40px auto', maxWidth: 500 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#ef4444', marginBottom: 8 }}>Access Denied</h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          You must be an administrator or organizer to view fee collection reports.
        </p>
      </div>
    );
  }

  // Filter registrations
  const filteredRegs = registrations.filter(reg => {
    if (statusFilter !== 'all' && reg.payment_status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (reg.player_name || '').toLowerCase().includes(q) ||
        (reg.player_email || '').toLowerCase().includes(q) ||
        (reg.partner_name || '').toLowerCase().includes(q) ||
        (reg.partner_email || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalItems = filteredRegs.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedRegs = filteredRegs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Stats calculations
  const totalRegistrations = registrations.length;
  const paidCount = registrations.filter(r => r.payment_status === 'paid').length;
  const exemptCount = registrations.filter(r => r.payment_status === 'exempt').length;
  const pendingCount = registrations.filter(r => r.payment_status === 'pending').length;
  const unpaidCount = registrations.filter(r => r.payment_status === 'unpaid').length;

  const entryFeeVal = selectedTournament?.entry_fee ? Number(selectedTournament.entry_fee) : 0;
  const totalRevenue = paidCount * entryFeeVal;

  const handleDownload = async () => {
    if (!selectedTournament) return;
    try {
      setActionLoading(true);
      setToast('Generating PDF report...');
      await downloadFeeReport(selectedTournament.id, selectedTournament.name);
      setToast('PDF report downloaded successfully!');
    } catch (err: any) {
      console.error(err);
      setToast('Failed to download report: ' + err.message);
    } finally {
      setActionLoading(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleEmail = async () => {
    if (!selectedTournament) return;
    const email = prompt("Enter email address to send report to:", user.email || '');
    if (!email) return;
    try {
      setActionLoading(true);
      setToast('Sending report email...');
      await emailFeeReport(selectedTournament.id, email);
      setToast(`Report emailed successfully to ${email}`);
    } catch (err: any) {
      console.error(err);
      setToast('Failed to email report: ' + err.message);
    } finally {
      setActionLoading(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>Payments & Fee Reports</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
            Monitor and export player registration entry fee collections and statements
          </p>
        </div>

        {/* Tournament Selector */}
        {tournaments.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Select Tournament:</span>
            <select
              className="input"
              style={{ width: 260, height: 42, cursor: 'pointer', fontWeight: 600 }}
              value={selectedTournament?.id || ''}
              onChange={(e) => {
                const tour = tournaments.find(t => t.id === e.target.value);
                if (tour) setSelectedTournament(tour);
              }}
            >
              {tournaments.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loadingTournaments ? (
        <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
          <div className="animate-spin" style={{ display: 'inline-block', fontSize: 24, marginBottom: 12 }}>🔄</div>
          <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-secondary)' }}>Loading tournaments data...</p>
        </div>
      ) : tournaments.length === 0 ? (
        <div className="glass-card" style={{ padding: 48, textAlign: 'center', border: '1px dashed var(--border)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>No Paid Tournaments Configured</h3>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 450, margin: '0 auto 20px auto' }}>
            There are no tournaments currently configured to collect entry fees. Go to the Tournament list, click Edit on any tournament, and enable collects fees.
          </p>
        </div>
      ) : selectedTournament ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Summary Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            
            {/* Total Revenue */}
            <div className="glass-card" style={{ padding: '20px 24px', position: 'relative', overflow: 'hidden', border: '1px solid var(--border)', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Revenue Collected</div>
              <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8, color: '#10b981' }}>
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: selectedTournament.currency || 'INR', maximumFractionDigits: 0 }).format(totalRevenue)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>
                Based on {paidCount} paid registrations
              </div>
            </div>

            {/* Entry Fee Config */}
            <div className="glass-card" style={{ padding: '20px 24px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Tournament Entry Fee</div>
              <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>
                {entryFeeVal} <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>{selectedTournament.currency}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>
                Umpire/Mock modes enabled
              </div>
            </div>

            {/* Total Registrations */}
            <div className="glass-card" style={{ padding: '20px 24px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Total Registrations</div>
              <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>
                {totalRegistrations}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>
                {exemptCount} exempt | {pendingCount + unpaidCount} outstanding
              </div>
            </div>

            {/* Action Card */}
            <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
              <button
                className="btn btn-primary"
                onClick={() => setIsBulkUploadModalOpen(true)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 36, fontSize: 13, background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}
              >
                📤 Upload / Record Collection
              </button>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <button
                  className="btn btn-secondary"
                  onClick={handleDownload}
                  disabled={actionLoading}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: 34, fontSize: 12, padding: '4px 8px' }}
                >
                  📥 PDF
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleEmail}
                  disabled={actionLoading}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: 34, fontSize: 12, padding: '4px 8px', border: '1px solid var(--border)' }}
                >
                  📧 Email
                </button>
              </div>
            </div>
            
          </div>

          {/* Registrations List Section */}
          <div className="glass-card" style={{ padding: 24, border: '1px solid var(--border)' }}>
            
            {/* Toolbar Filters */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['all', 'paid', 'exempt', 'unpaid', 'pending'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={`tab ${statusFilter === f ? 'active' : ''}`}
                    style={{ textTransform: 'capitalize', fontSize: 13, padding: '6px 12px' }}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <input
                className="input"
                style={{ maxWidth: 300, height: 38 }}
                placeholder="Search players by name/email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Table */}
            {loadingRegistrations ? (
              <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-secondary)' }}>
                <div className="animate-spin" style={{ display: 'inline-block', fontSize: 20, marginBottom: 8 }}>🔄</div>
                <p style={{ fontSize: 13 }}>Loading player registration logs...</p>
              </div>
            ) : paginatedRegs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)', fontSize: 14 }}>
                No registration transactions found matching the filter criteria.
              </div>
            ) : (
              <div className="table-container" style={{ margin: 0, border: 'none' }}>
                <table style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Player Name</th>
                      <th>Email Address</th>
                      <th>Payment Status</th>
                      <th>Payment Method</th>
                      <th style={{ width: 150 }}>Partner details</th>
                      <th style={{ width: 140 }}>Registered Date</th>
                      <th style={{ width: 130, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRegs.map(reg => {
                      let badgeClass = 'badge-pending';
                      if (reg.payment_status === 'paid') badgeClass = 'badge-live';
                      if (reg.payment_status === 'exempt') badgeClass = 'badge-accent';
                      if (reg.payment_status === 'unpaid') badgeClass = 'badge-open';

                      return (
                        <tr key={reg.id} style={{ transition: 'all var(--transition-fast)' }}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              {(() => {
                                const matchedPlayer = players.find(p => p.id === reg.player_id);
                                return matchedPlayer?.avatar ? (
                                  <img src={matchedPlayer.avatar} alt={reg.player_name} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                                ) : (
                                  <div style={{
                                    width: 28, height: 28,
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, var(--accent), #3b82f6)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 11, fontWeight: 700,
                                    color: '#fff',
                                    flexShrink: 0,
                                  }}>
                                    {(reg.player_name || '').charAt(0).toUpperCase()}
                                  </div>
                                );
                              })()}
                              <button
                                type="button"
                                onClick={() => {
                                  const found = players.find(p => p.id === reg.player_id);
                                  if (found) {
                                    setViewingPlayer(found);
                                  } else {
                                    setViewingPlayer({
                                      id: reg.player_id,
                                      name: reg.player_name,
                                      email: reg.player_email,
                                      role: 'player',
                                      roles: ['player'],
                                      created_at: new Date().toISOString()
                                    });
                                  }
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: 0,
                                  margin: 0,
                                  fontWeight: 600,
                                  color: 'var(--accent)',
                                  textDecoration: 'underline',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  fontFamily: 'inherit',
                                  fontSize: 'inherit'
                                }}
                              >
                                {reg.player_name}
                              </button>
                            </div>
                          </td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{reg.player_email}</td>
                          <td>
                            <span className={`badge ${badgeClass}`} style={{ textTransform: 'capitalize', fontSize: 11, fontWeight: 600 }}>
                              {reg.payment_status}
                            </span>
                          </td>
                          <td style={{ textTransform: 'capitalize', fontSize: 13, fontWeight: 500 }}>
                            {reg.payment_method === 'offline' ? 'Offline (Admin)' : reg.payment_method}
                          </td>
                          <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {reg.partner_name ? `${reg.partner_name} (${reg.partner_gender || ''})` : '—'}
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                            {reg.registered_at ? new Date(reg.registered_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {reg.payment_status !== 'paid' ? (
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => setRecordingPaymentReg(reg)}
                                style={{ fontSize: 11, padding: '4px 10px', height: 28 }}
                              >
                                💳 Record
                              </button>
                            ) : (
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => setRecordingPaymentReg(reg)}
                                style={{ fontSize: 11, padding: '4px 8px', height: 28, color: 'var(--text-muted)' }}
                                title="View / Update Payment Details"
                              >
                                ✏️ Receipt
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalItems > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, flexWrap: 'wrap', gap: 12 }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} registrations
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
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`btn ${currentPage === page ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '6px 12px', fontSize: 13, minWidth: 36 }}
                    >
                      {page}
                    </button>
                  ))}
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
        </div>
      ) : null}

      {/* Toast Alert */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'var(--accent)',
          color: 'white',
          padding: '12px 20px',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 9999,
          fontSize: 14,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          animation: 'slide-in-right 0.3s ease-out'
        }}>
          <IconCheck size={16} />
          {toast}
        </div>
      )}

      {viewingPlayer && (
        <PlayerProfileModal player={viewingPlayer} onClose={() => setViewingPlayer(null)} />
      )}

      {recordingPaymentReg && selectedTournament && (
        <RecordPaymentModal
          tournament={selectedTournament}
          registration={recordingPaymentReg}
          adminUser={user}
          onClose={() => setRecordingPaymentReg(null)}
          onSuccess={(updated) => {
            setRegistrations(prev => prev.map(r => r.id === updated.id ? updated : r));
            setRecordingPaymentReg(null);
            setToast(`Payment recorded successfully for ${updated.player_name}!`);
            setTimeout(() => setToast(null), 3000);
          }}
        />
      )}

      {isBulkUploadModalOpen && selectedTournament && (
        <UploadCollectionModal
          tournament={selectedTournament}
          registrations={registrations}
          adminUser={user}
          onClose={() => setIsBulkUploadModalOpen(false)}
          onSuccess={(updatedList) => {
            setRegistrations(prev => prev.map(r => {
              const u = updatedList.find(x => x.id === r.id);
              return u || r;
            }));
            setIsBulkUploadModalOpen(false);
            setToast(`Recorded payment batch successfully!`);
            setTimeout(() => setToast(null), 3000);
          }}
        />
      )}
    </div>
  );
}

function RecordPaymentModal({
  tournament,
  registration,
  adminUser,
  onClose,
  onSuccess
}: {
  tournament: Tournament;
  registration: Registration;
  adminUser: User | null;
  onClose: () => void;
  onSuccess: (updated: Registration) => void;
}) {
  const [amount, setAmount] = useState(tournament.entry_fee || 0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'bank_transfer' | 'cheque' | 'other'>('cash');
  const [refId, setRefId] = useState(registration.payment_reference || '');
  const [notes, setNotes] = useState(registration.notes || '');
  const [submitting, setSubmitting] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      let receiptUrl = '';
      if (receiptFile) {
        try {
          receiptUrl = await uploadToSupabaseStorage(receiptFile, 'receipts');
        } catch (e) {
          console.warn('Receipt upload failed, continuing with details', e);
        }
      }

      const updated = await recordPaymentCollection(
        registration.id,
        {
          amount: Number(amount),
          payment_method: paymentMethod,
          reference_id: refId,
          notes: notes + (receiptUrl ? ` [Receipt: ${receiptUrl}]` : ''),
          receipt_url: receiptUrl,
        },
        adminUser
      );
      onSuccess(updated);
    } catch (err: any) {
      alert('Failed to record payment: ' + (err?.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 480, padding: 24, borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Record Payment Collection</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              {tournament.name}
            </p>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><IconX size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--bg-secondary)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{registration.player_name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{registration.player_email}</div>
            {registration.partner_name && (
              <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 4 }}>Partner: {registration.partner_name}</div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="input-group">
              <label className="input-label">Amount Collected ({tournament.currency || 'INR'}) *</label>
              <input
                type="number"
                className="input"
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                min={0}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Payment Mode *</label>
              <select
                className="input"
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as any)}
                required
              >
                <option value="cash">💵 Cash Collection</option>
                <option value="upi">📱 UPI / QR Code</option>
                <option value="bank_transfer">🏦 Bank Transfer (NEFT/IMPS)</option>
                <option value="cheque">📄 Cheque</option>
                <option value="other">⚡ Other</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Transaction / Reference ID (Optional)</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. UPI Ref, IMPS-12345678"
              value={refId}
              onChange={e => setRefId(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Upload Receipt / Payment Screenshot (Optional)</label>
            <input
              type="file"
              className="input"
              accept="image/*,application/pdf"
              onChange={e => setReceiptFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Remarks / Notes (Optional)</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Handed cash at registration desk"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Confirm & Mark Paid'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UploadCollectionModal({
  tournament,
  registrations,
  adminUser,
  onClose,
  onSuccess
}: {
  tournament: Tournament;
  registrations: Registration[];
  adminUser: User | null;
  onClose: () => void;
  onSuccess: (updated: Registration[]) => void;
}) {
  const [selectedRegIds, setSelectedRegIds] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'bank_transfer' | 'other'>('cash');
  const [notes, setNotes] = useState('Bulk batch collection recorded');
  const [uploading, setUploading] = useState(false);

  const unpaidList = registrations.filter(r => r.payment_status !== 'paid');

  const toggleSelectAll = () => {
    if (selectedRegIds.length === unpaidList.length) {
      setSelectedRegIds([]);
    } else {
      setSelectedRegIds(unpaidList.map(r => r.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedRegIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBulkSubmit = async () => {
    if (selectedRegIds.length === 0) return;
    try {
      setUploading(true);
      const updatedList: Registration[] = [];
      for (const id of selectedRegIds) {
        const res = await recordPaymentCollection(
          id,
          {
            amount: tournament.entry_fee || 0,
            payment_method: paymentMethod,
            notes,
          },
          adminUser
        );
        updatedList.push(res);
      }
      onSuccess(updatedList);
    } catch (err: any) {
      alert('Error updating batch: ' + (err?.message || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 580, padding: 24, borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Upload / Record Batch Collections</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Quickly mark offline payment collections for multiple registered players in {tournament.name}
            </p>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><IconX size={18} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div className="input-group">
            <label className="input-label">Batch Payment Mode</label>
            <select
              className="input"
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value as any)}
            >
              <option value="cash">💵 Cash Received</option>
              <option value="upi">📱 Bulk UPI / QR</option>
              <option value="bank_transfer">🏦 Direct Transfer</option>
              <option value="other">⚡ Other</option>
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Batch Notes</label>
            <input
              type="text"
              className="input"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>
            Select Unpaid Players ({selectedRegIds.length} of {unpaidList.length} selected)
          </span>
          {unpaidList.length > 0 && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={toggleSelectAll}
              style={{ fontSize: 12 }}
            >
              {selectedRegIds.length === unpaidList.length ? 'Deselect All' : 'Select All'}
            </button>
          )}
        </div>

        <div style={{
          maxHeight: 240,
          overflowY: 'auto',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          background: 'var(--bg-secondary)',
          marginBottom: 20
        }}>
          {unpaidList.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              All registered players have already paid! 🎉
            </div>
          ) : (
            unpaidList.map(r => (
              <label
                key={r.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: selectedRegIds.includes(r.id) ? 'var(--accent-subtle)' : 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  fontSize: 13
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedRegIds.includes(r.id)}
                  onChange={() => toggleSelect(r.id)}
                />
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.player_name}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 11, marginLeft: 8 }}>{r.player_email}</span>
                </div>
                <span className="badge badge-open" style={{ fontSize: 10, textTransform: 'capitalize' }}>
                  {r.payment_status}
                </span>
              </label>
            ))
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={uploading}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleBulkSubmit}
            disabled={uploading || selectedRegIds.length === 0}
          >
            {uploading ? 'Processing...' : `Confirm Payment for ${selectedRegIds.length} Player(s)`}
          </button>
        </div>
      </div>
    </div>
  );
}

function PlayerProfileModal({
  player,
  onClose
}: {
  player: User;
  onClose: () => void;
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 420, padding: 24, borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Player Profile</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><IconX size={18} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center', marginBottom: 24 }}>
          {player.avatar ? (
            <img src={player.avatar} alt={player.name} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), #3b82f6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 700, color: '#fff',
              boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.4)'
            }}>
              {player.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h3 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{player.name}</h3>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
              {player.roles.map(r => (
                <span key={r} className="badge badge-accent" style={{ textTransform: 'capitalize', fontSize: 10 }}>{r}</span>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, background: 'var(--bg-secondary)', padding: 18, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Email Address</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{player.email}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Phone Number</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{player.phone || 'Not provided'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Age</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{player.age !== undefined && player.age !== null ? `${player.age} years` : 'Not provided'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 4 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Gender</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{player.gender || 'Not provided'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
